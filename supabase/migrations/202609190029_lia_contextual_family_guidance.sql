-- V0.294 — shared named family choice board, editable responses, contextual LIA facts,
-- and retirement of the old "surprise" meal choice.

-- 1) Preserve historical data, then remove "surprise" from the active model.
update public.light_meal_responses set desire='home' where desire='surprise';

update public.light_meal_questions q
set desire_options=coalesce((
  select array_agg(option order by first_ordinal)
  from (
    select case when raw.option='surprise' then 'home' else raw.option end as option,
           min(raw.ordinal) as first_ordinal
    from unnest(q.desire_options) with ordinality as raw(option,ordinal)
    group by case when raw.option='surprise' then 'home' else raw.option end
  ) normalized
),'{}'::text[])
where 'surprise'=any(q.desire_options);

alter table public.light_meal_questions drop constraint if exists light_meal_questions_desires_check;
alter table public.light_meal_questions add constraint light_meal_questions_desires_check check (
  desire_options <@ array['home','pizza','pasta','sushi','chinese']::text[]
  and cardinality(desire_options)<=5
);

alter table public.light_meal_responses
  add column if not exists takes_charge boolean not null default false;

-- Old rows encoded "take charge" inside presence. Move that state to its own checkbox.
update public.light_meal_responses
set takes_charge=true,presence='yes'
where presence='take_charge';

alter table public.light_meal_responses drop constraint if exists light_meal_responses_presence_check;
alter table public.light_meal_responses add constraint light_meal_responses_presence_check
  check (presence in ('yes','no','maybe'));

alter table public.light_meal_responses drop constraint if exists light_meal_responses_desire_check;
alter table public.light_meal_responses add constraint light_meal_responses_desire_check
  check (desire is null or desire in ('home','pizza','pasta','sushi','chinese'));

create unique index if not exists light_meal_responses_one_take_charge_idx
  on public.light_meal_responses(question_id)
  where takes_charge=true;

-- Previously consumed one-time links are reopened while their meal/question is still valid.
update public.light_response_tokens t
set consumed_at=null
from public.light_meal_questions q
where q.id=t.question_id
  and t.expires_at>now()
  and q.closed_at is null
  and q.expires_at>now();

-- 2) Question writes accept only the five active meal choices.
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
    where option in ('home','pizza','pasta','sushi','chinese')
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

  -- Reconfiguring a question intentionally resets its recipients and answers.
  delete from public.light_response_tokens where question_id=v_id;
  delete from public.light_meal_responses where question_id=v_id;
  return v_id;
end; $$;

revoke all on function public.upsert_light_meal_question(uuid,date,text,text[],timestamptz) from public;
grant execute on function public.upsert_light_meal_question(uuid,date,text,text[],timestamptz) to authenticated;

-- 3) Links are editable until expiry. Context also contains the shared family board.
create or replace function public.get_light_response_context(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_hash text;
  v_row record;
  v_allow_presence boolean;
  v_allow_desire boolean;
  v_allow_take_charge boolean;
  v_current jsonb;
  v_recipients jsonb;
  v_take_charge_name text;
begin
  if p_token is null or char_length(p_token)<>64 then return null; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');

  select t.question_id,t.light_member_id,m.display_name,m.age,m.relation,h.name as household_name,
         q.meal_date,q.meal_type,q.desire_options,least(q.expires_at,t.expires_at) as expires_at
    into v_row
  from public.light_response_tokens t
  join public.light_meal_questions q on q.id=t.question_id
  join public.light_members m on m.id=t.light_member_id and m.household_id=q.household_id
  join public.households h on h.id=q.household_id
  where t.token_hash=v_hash
    and t.expires_at>now()
    and q.closed_at is null
    and q.expires_at>now()
    and m.active=true
    and nullif(trim(coalesce(m.phone_number,'')),'') is not null
  limit 1;
  if not found then return null; end if;

  if v_row.relation='child' then
    v_allow_presence:=v_row.age is not null and v_row.age>=17;
    v_allow_desire:=v_row.age is not null and v_row.age>=16;
    v_allow_take_charge:=v_row.age is not null and v_row.age>=17;
  else
    v_allow_presence:=true;
    v_allow_desire:=true;
    v_allow_take_charge:=true;
  end if;

  select jsonb_build_object(
    'presence',r.presence,'desire',r.desire,'note',r.note,
    'takes_charge',r.takes_charge,'responded_at',r.responded_at
  )
    into v_current
  from public.light_meal_responses r
  where r.question_id=v_row.question_id and r.light_member_id=v_row.light_member_id;

  select m.display_name into v_take_charge_name
  from public.light_meal_responses r
  join public.light_members m on m.id=r.light_member_id
  where r.question_id=v_row.question_id and r.takes_charge=true
  order by r.responded_at asc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_name',m.display_name,
    'responded',r.light_member_id is not null,
    'presence',r.presence,
    'desire',r.desire,
    'note',r.note,
    'takes_charge',coalesce(r.takes_charge,false),
    'responded_at',r.responded_at
  ) order by t.created_at asc),'[]'::jsonb)
    into v_recipients
  from public.light_response_tokens t
  join public.light_members m on m.id=t.light_member_id
  left join public.light_meal_responses r
    on r.question_id=t.question_id and r.light_member_id=t.light_member_id
  where t.question_id=v_row.question_id;

  return jsonb_build_object(
    'member_name',v_row.display_name,
    'member_age',v_row.age,
    'member_relation',v_row.relation,
    'household_name',v_row.household_name,
    'meal_date',v_row.meal_date,
    'meal_type',v_row.meal_type,
    'desire_options',case when v_allow_desire then v_row.desire_options else '{}'::text[] end,
    'allow_presence',v_allow_presence,
    'allow_desire',v_allow_desire,
    'allow_take_charge',v_allow_take_charge,
    'allow_note',true,
    'expires_at',v_row.expires_at,
    'take_charge_name',v_take_charge_name,
    'current_response',v_current,
    'recipients',v_recipients
  );
end; $$;

revoke all on function public.get_light_response_context(text) from public;
revoke all on function public.get_light_response_context(text) from anon;
revoke all on function public.get_light_response_context(text) from authenticated;
grant execute on function public.get_light_response_context(text) to service_role;

-- 4) An answer can be edited repeatedly until expiry. Taking charge is an independent checkbox.
drop function if exists public.submit_light_response(text,text,text,text);
create or replace function public.submit_light_response(
  p_token text,
  p_presence text,
  p_desire text default null,
  p_note text default null,
  p_takes_charge boolean default false
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
  v_note text;
  v_allow_presence boolean;
  v_allow_desire boolean;
  v_allow_take_charge boolean;
  v_other_take_charge text;
begin
  if p_token is null or char_length(p_token)<>64 then raise exception 'TOKEN_INVALID_OR_USED'; end if;
  if p_presence not in ('yes','no','maybe') then raise exception 'INVALID_PRESENCE'; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');

  select * into v_token_row
  from public.light_response_tokens
  where token_hash=v_hash
  for update;
  if v_token_row.id is null or v_token_row.expires_at<=now() then raise exception 'TOKEN_INVALID_OR_USED'; end if;

  select * into v_question from public.light_meal_questions where id=v_token_row.question_id for update;
  select * into v_member from public.light_members where id=v_token_row.light_member_id;
  if v_question.id is null or v_member.id is null or not v_member.active
     or v_question.closed_at is not null or v_question.expires_at<=now()
     or v_member.household_id<>v_question.household_id then raise exception 'TOKEN_INVALID_OR_USED'; end if;

  if v_member.relation='child' then
    v_allow_presence:=v_member.age is not null and v_member.age>=17;
    v_allow_desire:=v_member.age is not null and v_member.age>=16;
    v_allow_take_charge:=v_member.age is not null and v_member.age>=17;
  else
    v_allow_presence:=true;v_allow_desire:=true;v_allow_take_charge:=true;
  end if;

  if not v_allow_presence and p_presence<>'yes' then raise exception 'RESPONSE_NOT_ALLOWED_FOR_AGE'; end if;
  if p_takes_charge and not v_allow_take_charge then raise exception 'RESPONSE_NOT_ALLOWED_FOR_AGE'; end if;
  if p_presence='no' and p_takes_charge then raise exception 'INVALID_RESPONSE'; end if;

  v_desire:=nullif(trim(coalesce(p_desire,'')),'');
  if not v_allow_desire or p_presence='no' then v_desire:=null;
  elsif v_desire is not null and not (v_desire=any(v_question.desire_options)) then raise exception 'DESIRE_NOT_OFFERED'; end if;

  v_note:=nullif(trim(coalesce(p_note,'')),'');
  if v_note is not null and char_length(v_note)>500 then raise exception 'NOTE_TOO_LONG'; end if;

  if p_takes_charge then
    select m.display_name into v_other_take_charge
    from public.light_meal_responses r
    join public.light_members m on m.id=r.light_member_id
    where r.question_id=v_question.id
      and r.takes_charge=true
      and r.light_member_id<>v_member.id
    order by r.responded_at asc limit 1;
    if v_other_take_charge is not null then raise exception 'QUESTION_TAKEN_OVER:%',v_other_take_charge; end if;
  end if;

  insert into public.light_meal_responses(question_id,light_member_id,presence,desire,note,takes_charge,responded_at)
  values(v_question.id,v_member.id,p_presence,v_desire,v_note,p_takes_charge,now())
  on conflict (question_id,light_member_id) do update
    set presence=excluded.presence,
        desire=excluded.desire,
        note=excluded.note,
        takes_charge=excluded.takes_charge,
        responded_at=excluded.responded_at;

  -- Keep the same opaque token alive until its existing expiry.
  update public.light_response_tokens set consumed_at=null where id=v_token_row.id;

  return jsonb_build_object(
    'ok',true,'presence',p_presence,'desire',v_desire,'note',v_note,'takes_charge',p_takes_charge
  );
end; $$;

revoke all on function public.submit_light_response(text,text,text,text,boolean) from public;
revoke all on function public.submit_light_response(text,text,text,text,boolean) from anon;
revoke all on function public.submit_light_response(text,text,text,text,boolean) from authenticated;
grant execute on function public.submit_light_response(text,text,text,text,boolean) to service_role;

-- 5) Authenticated organizer summary: named recipients, choice totals, notes, and take-charge.
create or replace function public.get_light_meal_summary(p_question_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_household_id uuid;
  v_take_charge_name text;
  v_total integer;v_yes integer;v_no integer;v_maybe integer;v_take integer;
  v_home integer;v_pizza integer;v_pasta integer;v_sushi integer;v_chinese integer;
  v_notes jsonb;v_responses jsonb;v_recipients jsonb;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select household_id into v_household_id from public.light_meal_questions where id=p_question_id;
  if v_household_id is null then raise exception 'QUESTION_NOT_FOUND'; end if;
  if not public.is_household_admin(v_household_id) then raise exception 'ADMIN_REQUIRED'; end if;

  select count(*),count(*) filter(where presence='yes'),count(*) filter(where presence='no'),
         count(*) filter(where presence='maybe'),count(*) filter(where takes_charge=true),
         count(*) filter(where desire='home'),count(*) filter(where desire='pizza'),
         count(*) filter(where desire='pasta'),count(*) filter(where desire='sushi'),
         count(*) filter(where desire='chinese')
    into v_total,v_yes,v_no,v_maybe,v_take,v_home,v_pizza,v_pasta,v_sushi,v_chinese
  from public.light_meal_responses where question_id=p_question_id;

  select m.display_name into v_take_charge_name
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=p_question_id and r.takes_charge=true
  order by r.responded_at asc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_name',m.display_name,'note',r.note,'responded_at',r.responded_at
  ) order by r.responded_at desc),'[]'::jsonb)
    into v_notes
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=p_question_id and r.note is not null;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_id',m.id,'member_name',m.display_name,'presence',r.presence,'desire',r.desire,
    'note',r.note,'takes_charge',r.takes_charge,'responded_at',r.responded_at
  ) order by r.responded_at asc),'[]'::jsonb)
    into v_responses
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=p_question_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_id',m.id,'member_name',m.display_name,
    'responded',r.light_member_id is not null,
    'presence',r.presence,'desire',r.desire,'note',r.note,
    'takes_charge',coalesce(r.takes_charge,false),'responded_at',r.responded_at
  ) order by t.created_at asc),'[]'::jsonb)
    into v_recipients
  from public.light_response_tokens t
  join public.light_members m on m.id=t.light_member_id
  left join public.light_meal_responses r
    on r.question_id=t.question_id and r.light_member_id=t.light_member_id
  where t.question_id=p_question_id;

  return jsonb_build_object(
    'total',v_total,
    'presence',jsonb_build_object('yes',v_yes,'no',v_no,'maybe',v_maybe,'take_charge',v_take),
    'desires',jsonb_build_object('home',v_home,'pizza',v_pizza,'pasta',v_pasta,'sushi',v_sushi,'chinese',v_chinese),
    'take_charge_name',v_take_charge_name,'notes',v_notes,'responses',v_responses,'recipients',v_recipients
  );
end; $$;

revoke all on function public.get_light_meal_summary(uuid) from public;
grant execute on function public.get_light_meal_summary(uuid) to authenticated;

-- 6) Token-scoped shared board for family members. It reveals only the recipients of this one question.
create or replace function public.get_light_family_decisions(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_hash text;v_question_id uuid;v_household_name text;v_meal_date date;v_meal_type text;
  v_take_charge_name text;v_recipients jsonb;v_options text[];
begin
  if p_token is null or char_length(p_token)<>64 then return null; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');

  select q.id,h.name,q.meal_date,q.meal_type,q.desire_options
    into v_question_id,v_household_name,v_meal_date,v_meal_type,v_options
  from public.light_response_tokens t
  join public.light_meal_questions q on q.id=t.question_id
  join public.light_members target on target.id=t.light_member_id and target.household_id=q.household_id
  join public.households h on h.id=q.household_id
  where t.token_hash=v_hash and t.expires_at>now()
    and q.closed_at is null and q.expires_at>now() and target.active=true
  limit 1;
  if v_question_id is null then return null; end if;

  select m.display_name into v_take_charge_name
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=v_question_id and r.takes_charge=true
  order by r.responded_at asc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_name',m.display_name,'responded',r.light_member_id is not null,
    'presence',r.presence,'desire',r.desire,'note',r.note,
    'takes_charge',coalesce(r.takes_charge,false),'responded_at',r.responded_at
  ) order by t.created_at asc),'[]'::jsonb)
    into v_recipients
  from public.light_response_tokens t
  join public.light_members m on m.id=t.light_member_id
  left join public.light_meal_responses r
    on r.question_id=t.question_id and r.light_member_id=t.light_member_id
  where t.question_id=v_question_id;

  return jsonb_build_object(
    'household_name',v_household_name,'meal_date',v_meal_date,'meal_type',v_meal_type,
    'desire_options',v_options,'take_charge_name',v_take_charge_name,'recipients',v_recipients
  );
end; $$;

revoke all on function public.get_light_family_decisions(text) from public;
revoke all on function public.get_light_family_decisions(text) from anon;
revoke all on function public.get_light_family_decisions(text) from authenticated;
grant execute on function public.get_light_family_decisions(text) to service_role;
