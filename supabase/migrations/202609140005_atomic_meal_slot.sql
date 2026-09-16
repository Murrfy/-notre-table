-- V0.83 — make one meal edit atomic: slot + cook + participants + guests.
-- Existing optional semantics are preserved: NULL participant/guest arrays leave those child rows unchanged.

drop function if exists public.set_meal_slot(uuid,date,text,uuid,text,text,numeric,text,uuid);
create or replace function public.set_meal_slot(
  p_household_id uuid,
  p_meal_date date,
  p_meal_type text,
  p_recipe_id uuid default null,
  p_custom_title text default null,
  p_notes text default null,
  p_servings numeric default null,
  p_meal_mode text default 'fresh',
  p_leftover_from_meal_id uuid default null,
  p_cook_user_id uuid default null,
  p_participant_user_ids uuid[] default null,
  p_guest_names text[] default null
)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  mid uuid;
  source_meal public.meal_plans;
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;
  if p_meal_type not in ('breakfast','lunch','dinner','snack') then raise exception 'Invalid meal type'; end if;
  if p_meal_mode not in ('fresh','leftover') then raise exception 'Invalid meal mode'; end if;
  if p_servings is not null and (p_servings<1 or p_servings>20) then raise exception 'Servings out of range'; end if;

  if p_cook_user_id is not null and not exists(
    select 1 from public.household_members hm
    where hm.household_id=p_household_id and hm.user_id=p_cook_user_id
  ) then raise exception 'Cook must belong to household'; end if;

  if p_participant_user_ids is not null and exists(
    select 1
    from unnest(p_participant_user_ids) as u(user_id)
    where u.user_id is null or not exists(
      select 1 from public.household_members hm
      where hm.household_id=p_household_id and hm.user_id=u.user_id
    )
  ) then raise exception 'Participant must belong to household'; end if;

  if p_guest_names is not null and exists(
    select 1 from unnest(p_guest_names) as g(name)
    where nullif(trim(g.name),'') is not null and char_length(trim(g.name))>80
  ) then raise exception 'Guest name too long'; end if;

  if p_meal_mode='leftover' then
    if p_leftover_from_meal_id is null then raise exception 'Leftover source required'; end if;
    select * into source_meal from public.meal_plans where id=p_leftover_from_meal_id and household_id=p_household_id;
    if source_meal.id is null then raise exception 'Leftover source not in household'; end if;
    if source_meal.meal_date>=p_meal_date then raise exception 'Leftover source must be earlier'; end if;
    p_recipe_id:=null;
    if nullif(trim(coalesce(p_custom_title,'')),'') is null then
      p_custom_title:=coalesce(source_meal.custom_title,(select title from public.recipes where id=source_meal.recipe_id),'Leftovers');
    end if;
  else
    p_leftover_from_meal_id:=null;
    if p_recipe_id is null and nullif(trim(coalesce(p_custom_title,'')),'') is null then raise exception 'Recipe or title required'; end if;
    if p_recipe_id is not null and not exists(select 1 from public.recipes where id=p_recipe_id and household_id=p_household_id) then raise exception 'Recipe not in household'; end if;
  end if;

  insert into public.meal_plans(household_id,meal_date,meal_type,recipe_id,custom_title,notes,servings,meal_mode,leftover_from_meal_id,cook_user_id,created_by)
  values(p_household_id,p_meal_date,p_meal_type,p_recipe_id,nullif(trim(coalesce(p_custom_title,'')),''),nullif(trim(coalesce(p_notes,'')),''),p_servings,p_meal_mode,p_leftover_from_meal_id,p_cook_user_id,auth.uid())
  on conflict (household_id,meal_date,meal_type) do update set
    recipe_id=excluded.recipe_id,
    custom_title=excluded.custom_title,
    notes=excluded.notes,
    servings=excluded.servings,
    meal_mode=excluded.meal_mode,
    leftover_from_meal_id=excluded.leftover_from_meal_id,
    cook_user_id=excluded.cook_user_id,
    updated_at=now()
  returning id into mid;

  if p_participant_user_ids is not null then
    delete from public.meal_participants where meal_plan_id=mid;
    insert into public.meal_participants(meal_plan_id,user_id,eating)
    select mid,u.user_id,true
    from (select distinct user_id from unnest(p_participant_user_ids) as p(user_id) where user_id is not null) u;
  end if;

  if p_guest_names is not null then
    delete from public.meal_guests where meal_plan_id=mid;
    insert into public.meal_guests(meal_plan_id,name,created_by)
    select mid,min(clean_name),auth.uid()
    from (
      select trim(g.name) as clean_name
      from unnest(p_guest_names) as g(name)
      where nullif(trim(g.name),'') is not null
    ) cleaned
    group by lower(clean_name);
  end if;

  return mid;
end; $$;
revoke all on function public.set_meal_slot(uuid,date,text,uuid,text,text,numeric,text,uuid,uuid,uuid[],text[]) from public;
grant execute on function public.set_meal_slot(uuid,date,text,uuid,text,text,numeric,text,uuid,uuid,uuid[],text[]) to authenticated;
