-- V0.297 — make LIA's “easy or impress?” question drive the rest of the meal flow.

alter table public.light_meal_questions
  add column if not exists lia_home_style text,
  add column if not exists lia_home_style_updated_at timestamptz;

alter table public.light_meal_questions
  drop constraint if exists light_meal_questions_lia_home_style_check;
alter table public.light_meal_questions
  add constraint light_meal_questions_lia_home_style_check
  check (lia_home_style is null or lia_home_style in ('easy','impress'));

create or replace function public.set_lia_family_home_style(
  p_question_id uuid,
  p_style text
)
returns void
language plpgsql
security definer
set search_path=public as $$
declare
  v_question public.light_meal_questions;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_style not in ('easy','impress') then raise exception 'INVALID_HOME_STYLE'; end if;

  select * into v_question
  from public.light_meal_questions
  where id=p_question_id
  for update;

  if v_question.id is null then raise exception 'QUESTION_NOT_FOUND'; end if;
  if not public.is_household_admin(v_question.household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if not public.family_feature_allowed(v_question.household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if v_question.closed_at is not null or v_question.expires_at<=now() then raise exception 'QUESTION_CLOSED'; end if;
  if not exists (
    select 1 from public.light_meal_responses
    where question_id=p_question_id and desire='home'
  ) then raise exception 'HOME_CHOICE_REQUIRED'; end if;
  if exists (
    select 1 from public.light_meal_responses
    where question_id=p_question_id and takes_charge=true
  ) then raise exception 'QUESTION_TAKEN_OVER'; end if;

  update public.light_meal_questions
  set lia_home_style=p_style,
      lia_home_style_updated_at=now(),
      updated_at=now()
  where id=p_question_id;
end; $$;

revoke all on function public.set_lia_family_home_style(uuid,text) from public;
grant execute on function public.set_lia_family_home_style(uuid,text) to authenticated;

-- Reconfiguring Message famille starts a fresh decision round, so an earlier
-- “easy / impress” answer must never leak into the new question.
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
        lia_home_style=null,
        lia_home_style_updated_at=null,
        updated_at=now()
  returning id into v_id;

  delete from public.light_response_tokens where question_id=v_id;
  delete from public.light_meal_responses where question_id=v_id;
  return v_id;
end; $$;

revoke all on function public.upsert_light_meal_question(uuid,date,text,text[],timestamptz) from public;
grant execute on function public.upsert_light_meal_question(uuid,date,text,text[],timestamptz) to authenticated;
