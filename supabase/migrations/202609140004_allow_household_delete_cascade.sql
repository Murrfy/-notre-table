-- V0.73 — protect the last admin only while the household itself still exists.
-- A parent household DELETE cascades into household_members; that cascade must not be blocked.
create or replace function public.prevent_last_household_admin_loss()
returns trigger
language plpgsql
security definer
set search_path=public as $$
declare
  admin_count integer;
begin
  if tg_op='DELETE' and not exists(
    select 1 from public.households h where h.id=old.household_id
  ) then
    return old;
  end if;

  if old.role='admin' and (
    tg_op='DELETE'
    or (tg_op='UPDATE' and new.role<>'admin')
  ) then
    select count(*) into admin_count
    from public.household_members
    where household_id=old.household_id and role='admin';

    if admin_count<=1 then
      raise exception 'HOUSEHOLD_REQUIRES_ADMIN' using errcode='23514';
    end if;
  end if;

  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
