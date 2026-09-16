-- V0.65 — keep every active household with at least one administrator.

create or replace function public.prevent_last_household_admin_loss()
returns trigger
language plpgsql
security definer
set search_path=public as $$
declare
  admin_count integer;
begin
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

drop trigger if exists household_members_keep_admin on public.household_members;
create trigger household_members_keep_admin
before delete or update of role on public.household_members
for each row execute function public.prevent_last_household_admin_loss();
