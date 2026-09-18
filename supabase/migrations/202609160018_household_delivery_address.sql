-- V0.169 — optional household delivery address for Commander.
-- Additive: existing households keep NULL and all existing household flows remain valid.

alter table public.households
  add column if not exists delivery_address text;

do $$ begin
  alter table public.households
    add constraint households_delivery_address_len
    check (delivery_address is null or char_length(delivery_address) <= 240);
exception when duplicate_object then null; end $$;

create or replace function public.create_household(
  p_name text,
  p_delivery_address text default null
)
returns table(id uuid, name text, delivery_address text)
language plpgsql security definer set search_path=public as $$
declare h public.households;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists(select 1 from public.household_members where user_id=auth.uid()) then raise exception 'User already belongs to a household'; end if;
  if char_length(trim(coalesce(p_name,''))) not between 2 and 80 then raise exception 'INVALID_HOUSEHOLD_NAME'; end if;
  if p_delivery_address is not null and char_length(trim(p_delivery_address)) > 240 then raise exception 'INVALID_DELIVERY_ADDRESS'; end if;

  insert into public.households(name,created_by,setup_completed,delivery_address)
  values(trim(p_name),auth.uid(),false,nullif(trim(coalesce(p_delivery_address,'')),''))
  returning * into h;
  insert into public.household_members(household_id,user_id,role) values(h.id,auth.uid(),'admin');
  return query select h.id,h.name,h.delivery_address;
end; $$;

revoke all on function public.create_household(text,text) from public;
grant execute on function public.create_household(text,text) to authenticated;
