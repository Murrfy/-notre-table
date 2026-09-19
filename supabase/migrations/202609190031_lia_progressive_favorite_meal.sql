-- V0.296 — second progressive family fact: favorite meal.
-- This remains outside mandatory onboarding and is learned only from an explicit answer.

alter table public.profiles add column if not exists favorite_meal text;
alter table public.light_members add column if not exists favorite_meal text;

do $$ begin
  alter table public.profiles add constraint profiles_favorite_meal_check
    check (favorite_meal is null or char_length(trim(favorite_meal)) between 2 and 120);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.light_members add constraint light_members_favorite_meal_check
    check (favorite_meal is null or char_length(trim(favorite_meal)) between 2 and 120);
exception when duplicate_object then null; end $$;

create or replace function public.set_lia_family_favorite_meal(
  p_household_id uuid,
  p_subject_kind text,
  p_subject_id uuid,
  p_favorite_meal text
)
returns void
language plpgsql
security definer
set search_path=public as $$
declare
  v_value text;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_household_id is null then raise exception 'HOUSEHOLD_REQUIRED'; end if;
  if p_subject_kind not in ('profile','light_member') then raise exception 'INVALID_SUBJECT_KIND'; end if;

  v_value:=trim(regexp_replace(coalesce(p_favorite_meal,''),'\s+',' ','g'));
  if char_length(v_value) not between 2 and 120 then raise exception 'INVALID_FAVORITE_MEAL'; end if;

  if p_subject_kind='profile' then
    if p_subject_id<>auth.uid() then raise exception 'PROFILE_NOT_SELF'; end if;
    if not exists(select 1 from public.household_members where household_id=p_household_id and user_id=auth.uid()) then
      raise exception 'HOUSEHOLD_ACCESS_REQUIRED';
    end if;
    update public.profiles
       set favorite_meal=v_value,
           updated_at=now()
     where id=auth.uid();
    if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
    return;
  end if;

  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  update public.light_members
     set favorite_meal=v_value,
         updated_at=now()
   where id=p_subject_id and household_id=p_household_id;
  if not found then raise exception 'LIGHT_MEMBER_NOT_FOUND'; end if;
end; $$;

revoke all on function public.set_lia_family_favorite_meal(uuid,text,uuid,text) from public;
revoke all on function public.set_lia_family_favorite_meal(uuid,text,uuid,text) from anon;
grant execute on function public.set_lia_family_favorite_meal(uuid,text,uuid,text) to authenticated;
