-- V0.111 — lightweight household members and secure one-click/two-click meal responses.
-- The native organizer stays authenticated. Lightweight members answer through a public
-- Edge Function using an opaque one-time token; no account or app installation is required.

create table if not exists public.light_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 60),
  phone_number text not null check (char_length(trim(phone_number)) between 6 and 32),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists light_members_household_idx on public.light_members(household_id,active,created_at);

create table if not exists public.light_meal_questions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  meal_date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  desire_options text[] not null default '{}',
  expires_at timestamptz not null,
  closed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint light_meal_questions_desires_check check (
    desire_options <@ array['home','pizza','pasta','sushi','chinese','surprise']::text[]
    and cardinality(desire_options)<=6
  )
);
create unique index if not exists light_meal_questions_one_slot_idx on public.light_meal_questions(household_id,meal_date,meal_type);
create index if not exists light_meal_questions_household_date_idx on public.light_meal_questions(household_id,meal_date);

create table if not exists public.light_response_tokens (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.light_meal_questions(id) on delete cascade,
  light_member_id uuid not null references public.light_members(id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash)=64),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  issued_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(question_id,light_member_id)
);
create index if not exists light_response_tokens_expiry_idx on public.light_response_tokens(expires_at) where consumed_at is null;

create table if not exists public.light_meal_responses (
  question_id uuid not null references public.light_meal_questions(id) on delete cascade,
  light_member_id uuid not null references public.light_members(id) on delete cascade,
  presence text not null check (presence in ('yes','no','maybe','take_charge')),
  desire text check (desire is null or desire in ('home','pizza','pasta','sushi','chinese','surprise')),
  responded_at timestamptz not null default now(),
  primary key(question_id,light_member_id)
);
create index if not exists light_meal_responses_question_idx on public.light_meal_responses(question_id,responded_at);

alter table public.light_members enable row level security;
alter table public.light_meal_questions enable row level security;
alter table public.light_response_tokens enable row level security;
alter table public.light_meal_responses enable row level security;

drop policy if exists light_members_select on public.light_members;
create policy light_members_select on public.light_members for select
using (public.is_household_admin(household_id));

drop policy if exists light_meal_questions_select on public.light_meal_questions;
create policy light_meal_questions_select on public.light_meal_questions for select
using (public.is_household_member(household_id));

drop policy if exists light_response_tokens_select on public.light_response_tokens;
create policy light_response_tokens_select on public.light_response_tokens for select
using (exists(
  select 1 from public.light_meal_questions q
  where q.id=question_id and public.is_household_admin(q.household_id)
));

drop policy if exists light_meal_responses_select on public.light_meal_responses;
create policy light_meal_responses_select on public.light_meal_responses for select
using (exists(
  select 1 from public.light_meal_questions q
  where q.id=question_id and public.is_household_member(q.household_id)
));

-- All writes go through controlled functions. Token hashes are never readable by mobile clients.
revoke all on table public.light_members from anon, authenticated;
revoke all on table public.light_meal_questions from anon, authenticated;
revoke all on table public.light_response_tokens from anon, authenticated;
revoke all on table public.light_meal_responses from anon, authenticated;
grant select on table public.light_members to authenticated;
grant select on table public.light_meal_questions to authenticated;
grant select on table public.light_meal_responses to authenticated;

create or replace function public.create_light_member(
  p_household_id uuid,
  p_display_name text,
  p_phone_number text
)
returns uuid
language plpgsql
security definer
set search_path=public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if not public.family_feature_allowed(p_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 1 and 60 then raise exception 'INVALID_MEMBER_NAME'; end if;
  if char_length(trim(coalesce(p_phone_number,''))) not between 6 and 32 then raise exception 'INVALID_PHONE_NUMBER'; end if;

  insert into public.light_members(household_id,display_name,phone_number,created_by)
  values(p_household_id,trim(p_display_name),trim(p_phone_number),auth.uid())
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.upsert_light_meal_question(
  p_household_id uuid,
  p_meal_date date,
  p_meal_type text,
  p_desire_options text[],
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path=public as $$
declare
  v_id uuid;
  v_options text[];
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if not public.family_feature_allowed(p_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if p_meal_date is null then raise exception 'MEAL_DATE_REQUIRED'; end if;
  if p_meal_type not in ('breakfast','lunch','dinner','snack') then raise exception 'INVALID_MEAL_TYPE'; end if;
  if p_expires_at is null or p_expires_at<=now() then raise exception 'QUESTION_EXPIRY_REQUIRED'; end if;

  select coalesce(array_agg(option order by ordinal),'{}'::text[]) into v_options
  from (
    select option,min(ordinal) as ordinal
    from unnest(coalesce(p_desire_options,'{}'::text[])) with ordinality as x(option,ordinal)
    where option in ('home','pizza','pasta','sushi','chinese','surprise')
    group by option
  ) s;
  if cardinality(v_options)<>cardinality(coalesce(p_desire_options,'{}'::text[])) then
    raise exception 'INVALID_DESIRE_OPTIONS';
  end if;

  insert into public.light_meal_questions(household_id,meal_date,meal_type,desire_options,expires_at,created_by)
  values(p_household_id,p_meal_date,p_meal_type,v_options,p_expires_at,auth.uid())
  on conflict (household_id,meal_date,meal_type) do update
    set desire_options=excluded.desire_options,
        expires_at=excluded.expires_at,
        closed_at=null,
        updated_at=now()
  returning id into v_id;

  -- Changing/reopening a question invalidates both earlier links and earlier answers.
  -- This prevents a response from retaining a desire option the organizer has just removed.
  delete from public.light_response_tokens where question_id=v_id;
  delete from public.light_meal_responses where question_id=v_id;
  return v_id;
end; $$;

create or replace function public.issue_light_response_token(
  p_question_id uuid,
  p_light_member_id uuid
)
returns text
language plpgsql
security definer
set search_path=public as $$
declare
  v_question public.light_meal_questions;
  v_member public.light_members;
  v_token text;
  v_hash text;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select * into v_question from public.light_meal_questions where id=p_question_id for update;
  if v_question.id is null then raise exception 'QUESTION_NOT_FOUND'; end if;
  if not public.is_household_admin(v_question.household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if not public.family_feature_allowed(v_question.household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if v_question.closed_at is not null or v_question.expires_at<=now() then raise exception 'QUESTION_CLOSED'; end if;

  select * into v_member from public.light_members where id=p_light_member_id and household_id=v_question.household_id and active=true;
  if v_member.id is null then raise exception 'LIGHT_MEMBER_NOT_FOUND'; end if;

  v_token:=encode(gen_random_bytes(32),'hex');
  v_hash:=encode(digest(v_token,'sha256'),'hex');

  insert into public.light_response_tokens(question_id,light_member_id,token_hash,expires_at,consumed_at,issued_by)
  values(v_question.id,v_member.id,v_hash,v_question.expires_at,null,auth.uid())
  on conflict (question_id,light_member_id) do update
    set token_hash=excluded.token_hash,
        expires_at=excluded.expires_at,
        consumed_at=null,
        issued_by=excluded.issued_by,
        created_at=now();

  return v_token;
end; $$;

create or replace function public.get_light_response_context(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_hash text;
  v_row record;
begin
  if p_token is null or char_length(p_token)<>64 then return null; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');

  select m.display_name,h.name as household_name,q.meal_date,q.meal_type,q.desire_options,
         least(q.expires_at,t.expires_at) as expires_at,
         (select m2.display_name
            from public.light_meal_responses r2
            join public.light_members m2 on m2.id=r2.light_member_id
           where r2.question_id=q.id and r2.presence='take_charge'
           order by r2.responded_at asc limit 1) as take_charge_name
    into v_row
  from public.light_response_tokens t
  join public.light_meal_questions q on q.id=t.question_id
  join public.light_members m on m.id=t.light_member_id and m.household_id=q.household_id
  join public.households h on h.id=q.household_id
  where t.token_hash=v_hash
    and t.consumed_at is null
    and t.expires_at>now()
    and q.closed_at is null
    and q.expires_at>now()
    and m.active=true
  limit 1;

  if not found then return null; end if;
  return jsonb_build_object(
    'member_name',v_row.display_name,
    'household_name',v_row.household_name,
    'meal_date',v_row.meal_date,
    'meal_type',v_row.meal_type,
    'desire_options',v_row.desire_options,
    'expires_at',v_row.expires_at,
    'take_charge_name',v_row.take_charge_name
  );
end; $$;

create or replace function public.submit_light_response(
  p_token text,
  p_presence text,
  p_desire text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_hash text;
  v_token_row public.light_response_tokens;
  v_question public.light_meal_questions;
  v_member public.light_members;
  v_desire text;
  v_take_charge_member uuid;
begin
  if p_token is null or char_length(p_token)<>64 then raise exception 'TOKEN_INVALID_OR_USED'; end if;
  if p_presence not in ('yes','no','maybe','take_charge') then raise exception 'INVALID_PRESENCE'; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');

  select * into v_token_row
  from public.light_response_tokens
  where token_hash=v_hash
  for update;

  if v_token_row.id is null or v_token_row.consumed_at is not null or v_token_row.expires_at<=now() then
    raise exception 'TOKEN_INVALID_OR_USED';
  end if;

  -- Serialize the question so only one member can take charge under concurrent clicks.
  select * into v_question from public.light_meal_questions where id=v_token_row.question_id for update;
  select * into v_member from public.light_members where id=v_token_row.light_member_id;
  if v_question.id is null or v_member.id is null or not v_member.active
     or v_question.closed_at is not null or v_question.expires_at<=now()
     or v_member.household_id<>v_question.household_id then
    raise exception 'TOKEN_INVALID_OR_USED';
  end if;

  select r.light_member_id into v_take_charge_member
  from public.light_meal_responses r
  where r.question_id=v_question.id and r.presence='take_charge'
  order by r.responded_at asc limit 1;
  if found then raise exception 'QUESTION_TAKEN_OVER'; end if;

  v_desire:=nullif(trim(coalesce(p_desire,'')),'');
  if p_presence in ('no','take_charge') then
    v_desire:=null;
  elsif v_desire is not null and not (v_desire=any(v_question.desire_options)) then
    raise exception 'DESIRE_NOT_OFFERED';
  end if;

  insert into public.light_meal_responses(question_id,light_member_id,presence,desire,responded_at)
  values(v_question.id,v_member.id,p_presence,v_desire,now())
  on conflict (question_id,light_member_id) do update
    set presence=excluded.presence,desire=excluded.desire,responded_at=excluded.responded_at;

  update public.light_response_tokens set consumed_at=now() where id=v_token_row.id;

  return jsonb_build_object('ok',true,'presence',p_presence,'desire',v_desire);
end; $$;

create or replace function public.get_light_meal_summary(p_question_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_household_id uuid;
  v_take_charge_name text;
  v_total integer;
  v_yes integer;
  v_no integer;
  v_maybe integer;
  v_take integer;
  v_home integer;
  v_pizza integer;
  v_pasta integer;
  v_sushi integer;
  v_chinese integer;
  v_surprise integer;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select household_id into v_household_id from public.light_meal_questions where id=p_question_id;
  if v_household_id is null then raise exception 'QUESTION_NOT_FOUND'; end if;
  if not public.is_household_admin(v_household_id) then raise exception 'ADMIN_REQUIRED'; end if;

  select count(*),
         count(*) filter(where presence='yes'),
         count(*) filter(where presence='no'),
         count(*) filter(where presence='maybe'),
         count(*) filter(where presence='take_charge'),
         count(*) filter(where desire='home'),
         count(*) filter(where desire='pizza'),
         count(*) filter(where desire='pasta'),
         count(*) filter(where desire='sushi'),
         count(*) filter(where desire='chinese'),
         count(*) filter(where desire='surprise')
    into v_total,v_yes,v_no,v_maybe,v_take,v_home,v_pizza,v_pasta,v_sushi,v_chinese,v_surprise
  from public.light_meal_responses where question_id=p_question_id;

  select m.display_name into v_take_charge_name
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=p_question_id and r.presence='take_charge'
  order by r.responded_at asc limit 1;

  return jsonb_build_object(
    'total',v_total,
    'presence',jsonb_build_object('yes',v_yes,'no',v_no,'maybe',v_maybe,'take_charge',v_take),
    'desires',jsonb_build_object('home',v_home,'pizza',v_pizza,'pasta',v_pasta,'sushi',v_sushi,'chinese',v_chinese,'surprise',v_surprise),
    'take_charge_name',v_take_charge_name
  );
end; $$;

revoke all on function public.create_light_member(uuid,text,text) from public;
revoke all on function public.upsert_light_meal_question(uuid,date,text,text[],timestamptz) from public;
revoke all on function public.issue_light_response_token(uuid,uuid) from public;
revoke all on function public.get_light_meal_summary(uuid) from public;
grant execute on function public.create_light_member(uuid,text,text) to authenticated;
grant execute on function public.upsert_light_meal_question(uuid,date,text,text[],timestamptz) to authenticated;
grant execute on function public.issue_light_response_token(uuid,uuid) to authenticated;
grant execute on function public.get_light_meal_summary(uuid) to authenticated;

revoke all on function public.get_light_response_context(text) from public;
revoke all on function public.get_light_response_context(text) from anon;
revoke all on function public.get_light_response_context(text) from authenticated;
grant execute on function public.get_light_response_context(text) to service_role;

revoke all on function public.submit_light_response(text,text,text) from public;
revoke all on function public.submit_light_response(text,text,text) from anon;
revoke all on function public.submit_light_response(text,text,text) from authenticated;
grant execute on function public.submit_light_response(text,text,text) to service_role;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='light_meal_responses'
  ) then
    alter publication supabase_realtime add table public.light_meal_responses;
  end if;
end $$;
