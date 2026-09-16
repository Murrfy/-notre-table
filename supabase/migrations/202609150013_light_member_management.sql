-- V0.112 — organizer management for lightweight members.
-- Keep history stable: members are edited or deactivated, never hard-deleted by the mobile UI.

create or replace function public.update_light_member(
  p_light_member_id uuid,
  p_display_name text,
  p_phone_number text,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path=public as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select household_id into v_household_id from public.light_members where id=p_light_member_id;
  if v_household_id is null then raise exception 'LIGHT_MEMBER_NOT_FOUND'; end if;
  if not public.is_household_admin(v_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if not public.family_feature_allowed(v_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 1 and 60 then raise exception 'INVALID_MEMBER_NAME'; end if;
  if char_length(trim(coalesce(p_phone_number,''))) not between 6 and 32 then raise exception 'INVALID_PHONE_NUMBER'; end if;

  update public.light_members
     set display_name=trim(p_display_name),
         phone_number=trim(p_phone_number),
         active=coalesce(p_active,true),
         updated_at=now()
   where id=p_light_member_id;
end; $$;

revoke all on function public.update_light_member(uuid,text,text,boolean) from public;
grant execute on function public.update_light_member(uuid,text,text,boolean) to authenticated;
