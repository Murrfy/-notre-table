-- V0.195 — age-aware family meal messages + free family reply note.
-- The organizer composes one meal question; each recipient sees only the actions
-- that make sense for that member. Missing phone means no response link at all.

alter table public.light_meal_responses add column if not exists note text;
do $$ begin
  alter table public.light_meal_responses add constraint light_meal_responses_note_len
    check (note is null or char_length(note) <= 500);
exception when duplicate_object then null; end $$;

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

  select * into v_member from public.light_members
   where id=p_light_member_id and household_id=v_question.household_id and active=true;
  if v_member.id is null then raise exception 'LIGHT_MEMBER_NOT_FOUND'; end if;
  if nullif(trim(coalesce(v_member.phone_number,'')),'') is null then raise exception 'LIGHT_MEMBER_NOT_REACHABLE'; end if;

  v_token:=encode(gen_random_bytes(32),'hex');
  v_hash:=encode(digest(v_token,'sha256'),'hex');
  insert into public.light_response_tokens(question_id,light_member_id,token_hash,expires_at,consumed_at,issued_by)
  values(v_question.id,v_member.id,v_hash,v_question.expires_at,null,auth.uid())
  on conflict (question_id,light_member_id) do update
    set token_hash=excluded.token_hash,expires_at=excluded.expires_at,consumed_at=null,
        issued_by=excluded.issued_by,created_at=now();
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
  v_allow_presence boolean;
  v_allow_desire boolean;
  v_allow_take_charge boolean;
begin
  if p_token is null or char_length(p_token)<>64 then return null; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');

  select m.display_name,m.age,m.relation,h.name as household_name,q.meal_date,q.meal_type,q.desire_options,
         least(q.expires_at,t.expires_at) as expires_at,
         (select m2.display_name from public.light_meal_responses r2
           join public.light_members m2 on m2.id=r2.light_member_id
          where r2.question_id=q.id and r2.presence='take_charge'
          order by r2.responded_at asc limit 1) as take_charge_name
    into v_row
  from public.light_response_tokens t
  join public.light_meal_questions q on q.id=t.question_id
  join public.light_members m on m.id=t.light_member_id and m.household_id=q.household_id
  join public.households h on h.id=q.household_id
  where t.token_hash=v_hash and t.consumed_at is null and t.expires_at>now()
    and q.closed_at is null and q.expires_at>now() and m.active=true
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

  return jsonb_build_object(
    'member_name',v_row.display_name,'member_age',v_row.age,'member_relation',v_row.relation,
    'household_name',v_row.household_name,'meal_date',v_row.meal_date,'meal_type',v_row.meal_type,
    'desire_options',case when v_allow_desire then v_row.desire_options else '{}'::text[] end,
    'allow_presence',v_allow_presence,'allow_desire',v_allow_desire,
    'allow_take_charge',v_allow_take_charge,'allow_note',true,
    'expires_at',v_row.expires_at,'take_charge_name',v_row.take_charge_name
  );
end; $$;

drop function if exists public.submit_light_response(text,text,text);
create or replace function public.submit_light_response(
  p_token text,
  p_presence text,
  p_desire text default null,
  p_note text default null
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
  v_take_charge_member uuid;
  v_allow_presence boolean;
  v_allow_desire boolean;
  v_allow_take_charge boolean;
begin
  if p_token is null or char_length(p_token)<>64 then raise exception 'TOKEN_INVALID_OR_USED'; end if;
  if p_presence not in ('yes','no','maybe','take_charge') then raise exception 'INVALID_PRESENCE'; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');
  select * into v_token_row from public.light_response_tokens where token_hash=v_hash for update;
  if v_token_row.id is null or v_token_row.consumed_at is not null or v_token_row.expires_at<=now() then raise exception 'TOKEN_INVALID_OR_USED'; end if;
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

  -- For children under 17, home presence is implicit: the UI never asks the question.
  if not v_allow_presence and p_presence<>'yes' then raise exception 'RESPONSE_NOT_ALLOWED_FOR_AGE'; end if;
  if p_presence='take_charge' and not v_allow_take_charge then raise exception 'RESPONSE_NOT_ALLOWED_FOR_AGE'; end if;

  v_desire:=nullif(trim(coalesce(p_desire,'')),'');
  if not v_allow_desire then v_desire:=null;
  elsif p_presence in ('no','take_charge') then v_desire:=null;
  elsif v_desire is not null and not (v_desire=any(v_question.desire_options)) then raise exception 'DESIRE_NOT_OFFERED'; end if;

  v_note:=nullif(trim(coalesce(p_note,'')),'');
  if v_note is not null and char_length(v_note)>500 then raise exception 'NOTE_TOO_LONG'; end if;

  if p_presence='take_charge' then
    select r.light_member_id into v_take_charge_member from public.light_meal_responses r
     where r.question_id=v_question.id and r.presence='take_charge' order by r.responded_at asc limit 1;
    if found then raise exception 'QUESTION_TAKEN_OVER'; end if;
  end if;

  insert into public.light_meal_responses(question_id,light_member_id,presence,desire,note,responded_at)
  values(v_question.id,v_member.id,p_presence,v_desire,v_note,now())
  on conflict (question_id,light_member_id) do update
    set presence=excluded.presence,desire=excluded.desire,note=excluded.note,responded_at=excluded.responded_at;
  update public.light_response_tokens set consumed_at=now() where id=v_token_row.id;
  return jsonb_build_object('ok',true,'presence',p_presence,'desire',v_desire,'note',v_note);
end; $$;

create or replace function public.get_light_meal_summary(p_question_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_household_id uuid;v_take_charge_name text;v_total integer;v_yes integer;v_no integer;v_maybe integer;v_take integer;
  v_home integer;v_pizza integer;v_pasta integer;v_sushi integer;v_chinese integer;v_surprise integer;v_notes jsonb;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select household_id into v_household_id from public.light_meal_questions where id=p_question_id;
  if v_household_id is null then raise exception 'QUESTION_NOT_FOUND'; end if;
  if not public.is_household_admin(v_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  select count(*),count(*) filter(where presence='yes'),count(*) filter(where presence='no'),count(*) filter(where presence='maybe'),count(*) filter(where presence='take_charge'),
         count(*) filter(where desire='home'),count(*) filter(where desire='pizza'),count(*) filter(where desire='pasta'),count(*) filter(where desire='sushi'),count(*) filter(where desire='chinese'),count(*) filter(where desire='surprise')
    into v_total,v_yes,v_no,v_maybe,v_take,v_home,v_pizza,v_pasta,v_sushi,v_chinese,v_surprise
  from public.light_meal_responses where question_id=p_question_id;
  select m.display_name into v_take_charge_name from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
   where r.question_id=p_question_id and r.presence='take_charge' order by r.responded_at asc limit 1;
  select coalesce(jsonb_agg(jsonb_build_object('member_name',m.display_name,'note',r.note,'responded_at',r.responded_at) order by r.responded_at desc),'[]'::jsonb)
    into v_notes from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
   where r.question_id=p_question_id and r.note is not null;
  return jsonb_build_object('total',v_total,'presence',jsonb_build_object('yes',v_yes,'no',v_no,'maybe',v_maybe,'take_charge',v_take),
    'desires',jsonb_build_object('home',v_home,'pizza',v_pizza,'pasta',v_pasta,'sushi',v_sushi,'chinese',v_chinese,'surprise',v_surprise),
    'take_charge_name',v_take_charge_name,'notes',v_notes);
end; $$;

revoke all on function public.submit_light_response(text,text,text,text) from public;
revoke all on function public.submit_light_response(text,text,text,text) from anon;
revoke all on function public.submit_light_response(text,text,text,text) from authenticated;
grant execute on function public.submit_light_response(text,text,text,text) to service_role;
