-- V0.297 — third progressive family fact: one explicitly disliked food.
-- This is a taste preference only. LIA must never infer or write an allergy from this path.

alter table public.light_members
  add column if not exists disliked_foods text[] not null default '{}';

create or replace function public.add_lia_family_disliked_food(
  p_household_id uuid,
  p_subject_kind text,
  p_subject_id uuid,
  p_disliked_food text
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

  v_value:=trim(regexp_replace(coalesce(p_disliked_food,''),'\s+',' ','g'));
  if char_length(v_value) not between 2 and 80 then raise exception 'INVALID_DISLIKED_FOOD'; end if;

  if p_subject_kind='profile' then
    if p_subject_id<>auth.uid() then raise exception 'PROFILE_NOT_SELF'; end if;
    if not exists(select 1 from public.household_members where household_id=p_household_id and user_id=auth.uid()) then
      raise exception 'HOUSEHOLD_ACCESS_REQUIRED';
    end if;

    insert into public.member_preferences(user_id,disliked_foods,updated_at)
    values(auth.uid(),array[v_value],now())
    on conflict (user_id) do update
      set disliked_foods=case
            when exists(
              select 1 from unnest(public.member_preferences.disliked_foods) as item
              where lower(trim(item))=lower(v_value)
            ) then public.member_preferences.disliked_foods
            else array_append(public.member_preferences.disliked_foods,v_value)
          end,
          updated_at=now();
    return;
  end if;

  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  update public.light_members
     set disliked_foods=case
           when exists(
             select 1 from unnest(public.light_members.disliked_foods) as item
             where lower(trim(item))=lower(v_value)
           ) then public.light_members.disliked_foods
           else array_append(public.light_members.disliked_foods,v_value)
         end,
         updated_at=now()
   where id=p_subject_id and household_id=p_household_id;
  if not found then raise exception 'LIGHT_MEMBER_NOT_FOUND'; end if;
end; $$;

revoke all on function public.add_lia_family_disliked_food(uuid,text,uuid,text) from public;
revoke all on function public.add_lia_family_disliked_food(uuid,text,uuid,text) from anon;
grant execute on function public.add_lia_family_disliked_food(uuid,text,uuid,text) to authenticated;
