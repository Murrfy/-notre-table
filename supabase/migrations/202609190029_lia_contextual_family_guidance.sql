-- V0.294 — named family decisions, shared choice board, and removal of the retired "surprise" choice.

-- Preserve old data safely, then remove "surprise" from the active model.
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

alter table public.light_meal_responses drop constraint if exists light_meal_responses_desire_check;
alter table public.light_meal_responses add constraint light_meal_responses_desire_check
  check (desire is null or desire in ('home','pizza','pasta','sushi','chinese'));

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

  delete from public.light_response_tokens where question_id=v_id;
  delete from public.light_meal_responses where question_id=v_id;
  return v_id;
end; $$;

revoke all on function public.upsert_light_meal_question(uuid,date,text,text[],timestamptz) from public;
grant execute on function public.upsert_light_meal_question(uuid,date,text,text[],timestamptz) to authenticated;

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

  select count(*),count(*) filter(where presence='yes'),count(*) filter(where presence='no'),count(*) filter(where presence='maybe'),count(*) filter(where presence='take_charge'),
         count(*) filter(where desire='home'),count(*) filter(where desire='pizza'),count(*) filter(where desire='pasta'),count(*) filter(where desire='sushi'),count(*) filter(where desire='chinese')
    into v_total,v_yes,v_no,v_maybe,v_take,v_home,v_pizza,v_pasta,v_sushi,v_chinese
  from public.light_meal_responses where question_id=p_question_id;

  select m.display_name into v_take_charge_name
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=p_question_id and r.presence='take_charge'
  order by r.responded_at asc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object('member_name',m.display_name,'note',r.note,'responded_at',r.responded_at) order by r.responded_at desc),'[]'::jsonb)
    into v_notes
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=p_question_id and r.note is not null;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_id',m.id,'member_name',m.display_name,'presence',r.presence,'desire',r.desire,'note',r.note,'responded_at',r.responded_at
  ) order by r.responded_at asc),'[]'::jsonb)
    into v_responses
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=p_question_id;

  -- A row exists for every member for whom the organizer actually issued a response link.
  select coalesce(jsonb_agg(jsonb_build_object(
    'member_id',m.id,
    'member_name',m.display_name,
    'responded',r.light_member_id is not null,
    'presence',r.presence,
    'desire',r.desire,
    'responded_at',r.responded_at
  ) order by t.created_at asc),'[]'::jsonb)
    into v_recipients
  from public.light_response_tokens t
  join public.light_members m on m.id=t.light_member_id
  left join public.light_meal_responses r on r.question_id=t.question_id and r.light_member_id=t.light_member_id
  where t.question_id=p_question_id;

  return jsonb_build_object(
    'total',v_total,
    'presence',jsonb_build_object('yes',v_yes,'no',v_no,'maybe',v_maybe,'take_charge',v_take),
    'desires',jsonb_build_object('home',v_home,'pizza',v_pizza,'pasta',v_pasta,'sushi',v_sushi,'chinese',v_chinese),
    'take_charge_name',v_take_charge_name,
    'notes',v_notes,
    'responses',v_responses,
    'recipients',v_recipients
  );
end; $$;

revoke all on function public.get_light_meal_summary(uuid) from public;
grant execute on function public.get_light_meal_summary(uuid) to authenticated;

create or replace function public.get_light_family_decisions(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_hash text;
  v_question_id uuid;
  v_household_name text;
  v_meal_date date;
  v_meal_type text;
  v_take_charge_name text;
  v_recipients jsonb;
begin
  if p_token is null or char_length(p_token)<>64 then return null; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');

  select q.id,h.name,q.meal_date,q.meal_type
    into v_question_id,v_household_name,v_meal_date,v_meal_type
  from public.light_response_tokens t
  join public.light_meal_questions q on q.id=t.question_id
  join public.light_members target on target.id=t.light_member_id and target.household_id=q.household_id
  join public.households h on h.id=q.household_id
  where t.token_hash=v_hash
    and t.expires_at>now()
    and q.closed_at is null
    and q.expires_at>now()
    and target.active=true
  limit 1;

  if v_question_id is null then return null; end if;

  select m.display_name into v_take_charge_name
  from public.light_meal_responses r
  join public.light_members m on m.id=r.light_member_id
  where r.question_id=v_question_id and r.presence='take_charge'
  order by r.responded_at asc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_name',m.display_name,
    'responded',r.light_member_id is not null,
    'presence',r.presence,
    'desire',r.desire,
    'responded_at',r.responded_at
  ) order by t.created_at asc),'[]'::jsonb)
    into v_recipients
  from public.light_response_tokens t
  join public.light_members m on m.id=t.light_member_id
  left join public.light_meal_responses r on r.question_id=t.question_id and r.light_member_id=t.light_member_id
  where t.question_id=v_question_id;

  return jsonb_build_object(
    'household_name',v_household_name,
    'meal_date',v_meal_date,
    'meal_type',v_meal_type,
    'take_charge_name',v_take_charge_name,
    'recipients',v_recipients
  );
end; $$;

revoke all on function public.get_light_family_decisions(text) from public;
revoke all on function public.get_light_family_decisions(text) from anon;
revoke all on function public.get_light_family_decisions(text) from authenticated;
grant execute on function public.get_light_family_decisions(text) to service_role;
