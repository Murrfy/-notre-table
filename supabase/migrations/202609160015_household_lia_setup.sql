-- V0.165 — guided first-household setup with LIA.
-- Existing households stay completed. Newly created households enter the short LIA setup.

alter table public.households
  add column if not exists setup_completed boolean not null default true;

alter table public.households
  add column if not exists default_party_size smallint;

do $$ begin
  alter table public.households
    add constraint households_default_party_size_range
    check (default_party_size is null or default_party_size between 1 and 20);
exception when duplicate_object then null; end $$;

create or replace function public.create_household(p_name text)
returns table(id uuid, name text)
language plpgsql security definer set search_path=public as $$
declare h public.households;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists(select 1 from public.household_members where user_id=auth.uid()) then raise exception 'User already belongs to a household'; end if;
  insert into public.households(name,created_by,setup_completed)
  values(trim(p_name),auth.uid(),false)
  returning * into h;
  insert into public.household_members(household_id,user_id,role) values(h.id,auth.uid(),'admin');
  return query select h.id,h.name;
end; $$;

create or replace function public.complete_household_setup(
  p_household_id uuid,
  p_display_name text,
  p_default_party_size integer
)
returns void
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 2 and 60 then raise exception 'INVALID_DISPLAY_NAME'; end if;
  if p_default_party_size is null or p_default_party_size not between 1 and 20 then raise exception 'INVALID_PARTY_SIZE'; end if;

  insert into public.profiles(id,display_name)
  values(auth.uid(),trim(p_display_name))
  on conflict (id) do update set display_name=excluded.display_name,updated_at=now();

  update public.households
  set default_party_size=p_default_party_size,
      setup_completed=true,
      updated_at=now()
  where id=p_household_id;
end; $$;

revoke all on function public.complete_household_setup(uuid,text,integer) from public;
revoke all on function public.complete_household_setup(uuid,text,integer) from anon;
grant execute on function public.complete_household_setup(uuid,text,integer) to authenticated;
