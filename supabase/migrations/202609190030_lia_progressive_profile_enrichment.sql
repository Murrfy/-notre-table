-- V0.294 — progressive family profile enrichment.
-- Birthday is deliberately excluded from mandatory onboarding. LIA may ask later,
-- one small question at a time. Year remains optional.

alter table public.profiles add column if not exists birthday_month smallint;
alter table public.profiles add column if not exists birthday_day smallint;
alter table public.profiles add column if not exists birth_year smallint;

alter table public.light_members add column if not exists birthday_month smallint;
alter table public.light_members add column if not exists birthday_day smallint;
alter table public.light_members add column if not exists birth_year smallint;

do $$ begin
  alter table public.profiles add constraint profiles_birthday_month_check
    check (birthday_month is null or birthday_month between 1 and 12);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_birthday_day_check
    check (birthday_day is null or birthday_day between 1 and 31);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_birth_year_check
    check (birth_year is null or birth_year between 1900 and 2100);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.light_members add constraint light_members_birthday_month_check
    check (birthday_month is null or birthday_month between 1 and 12);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.light_members add constraint light_members_birthday_day_check
    check (birthday_day is null or birthday_day between 1 and 31);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.light_members add constraint light_members_birth_year_check
    check (birth_year is null or birth_year between 1900 and 2100);
exception when duplicate_object then null; end $$;

create or replace function public.set_lia_family_birthday(
  p_household_id uuid,
  p_subject_kind text,
  p_subject_id uuid,
  p_month integer,
  p_day integer,
  p_year integer default null
)
returns void
language plpgsql
security definer
set search_path=public as $$
declare
  v_date date;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_household_id is null then raise exception 'HOUSEHOLD_REQUIRED'; end if;
  if p_subject_kind not in ('profile','light_member') then raise exception 'INVALID_SUBJECT_KIND'; end if;
  if p_month not between 1 and 12 or p_day not between 1 and 31 then raise exception 'INVALID_BIRTHDAY'; end if;
  if p_year is not null and p_year not between 1900 and extract(year from current_date)::integer then raise exception 'INVALID_BIRTH_YEAR'; end if;

  begin
    v_date:=make_date(coalesce(p_year,2000),p_month,p_day);
  exception when others then
    raise exception 'INVALID_BIRTHDAY';
  end;

  if p_subject_kind='profile' then
    if p_subject_id<>auth.uid() then raise exception 'PROFILE_NOT_SELF'; end if;
    if not exists(select 1 from public.household_members where household_id=p_household_id and user_id=auth.uid()) then raise exception 'HOUSEHOLD_ACCESS_REQUIRED'; end if;
    update public.profiles
       set birthday_month=p_month,
           birthday_day=p_day,
           birth_year=p_year,
           updated_at=now()
     where id=auth.uid();
    if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
    return;
  end if;

  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  update public.light_members
     set birthday_month=p_month,
         birthday_day=p_day,
         birth_year=p_year,
         updated_at=now()
   where id=p_subject_id and household_id=p_household_id;
  if not found then raise exception 'LIGHT_MEMBER_NOT_FOUND'; end if;
end; $$;

revoke all on function public.set_lia_family_birthday(uuid,text,uuid,integer,integer,integer) from public;
revoke all on function public.set_lia_family_birthday(uuid,text,uuid,integer,integer,integer) from anon;
grant execute on function public.set_lia_family_birthday(uuid,text,uuid,integer,integer,integer) to authenticated;
