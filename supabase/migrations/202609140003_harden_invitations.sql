-- V0.68 — invitation idempotency and cryptographic code generation.
-- Reusing an existing live invitation prevents duplicate active codes from rapid repeated taps.
-- pgcrypto bytes avoid predictable application-level random() for invitation secrets.
create or replace function public.create_household_invitation(p_household_id uuid)
returns text language plpgsql security definer set search_path=public as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  i int;
  attempts int := 0;
begin
  if not public.is_household_admin(p_household_id) then raise exception 'Admin required'; end if;

  select code into v_code
  from public.invitations
  where household_id=p_household_id and expires_at>now() and used_by is null
  order by created_at desc
  limit 1;
  if v_code is not null then return v_code; end if;

  loop
    attempts:=attempts+1;
    v_code:='';
    for i in 1..6 loop
      v_code:=v_code||substr(alphabet, 1+(get_byte(gen_random_bytes(1),0)%length(alphabet)), 1);
    end loop;
    exit when not exists(select 1 from public.invitations where code=v_code);
    if attempts>=20 then raise exception 'Could not generate invitation code'; end if;
  end loop;

  insert into public.invitations(household_id,code,created_by,expires_at)
  values(p_household_id,v_code,auth.uid(),now()+interval '7 days');
  return v_code;
end; $$;

revoke all on function public.create_household_invitation(uuid) from public;
grant execute on function public.create_household_invitation(uuid) to authenticated;
