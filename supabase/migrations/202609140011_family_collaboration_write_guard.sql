-- V0.108 — after a Family subscription expires, shared history remains readable but
-- non-admin collaboration becomes read-only. The household admin keeps the free base product.

create or replace function public.can_write_household(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public as $$
  select public.is_household_member(p_household_id)
     and (
       not public.premium_enforcement_enabled()
       or public.household_has_active_family(p_household_id)
       or public.is_household_admin(p_household_id)
     )
$$;

revoke all on function public.can_write_household(uuid) from public;
grant execute on function public.can_write_household(uuid) to authenticated;

-- Base collaborative tables: members may always read. When enforcement is enabled and Family
-- is inactive, only an admin can write the free base product.
drop policy if exists recipes_insert on public.recipes;
drop policy if exists recipes_update on public.recipes;
drop policy if exists recipes_delete on public.recipes;
create policy recipes_insert on public.recipes for insert with check (public.can_write_household(household_id) and created_by=auth.uid());
create policy recipes_update on public.recipes for update using (public.can_write_household(household_id)) with check (public.can_write_household(household_id));
create policy recipes_delete on public.recipes for delete using (public.can_write_household(household_id));

drop policy if exists ingredients_insert on public.recipe_ingredients;
drop policy if exists ingredients_update on public.recipe_ingredients;
drop policy if exists ingredients_delete on public.recipe_ingredients;
create policy ingredients_insert on public.recipe_ingredients for insert with check (exists(select 1 from public.recipes r where r.id=recipe_id and public.can_write_household(r.household_id)));
create policy ingredients_update on public.recipe_ingredients for update using (exists(select 1 from public.recipes r where r.id=recipe_id and public.can_write_household(r.household_id))) with check (exists(select 1 from public.recipes r where r.id=recipe_id and public.can_write_household(r.household_id)));
create policy ingredients_delete on public.recipe_ingredients for delete using (exists(select 1 from public.recipes r where r.id=recipe_id and public.can_write_household(r.household_id)));

drop policy if exists meals_insert on public.meal_plans;
drop policy if exists meals_update on public.meal_plans;
drop policy if exists meals_delete on public.meal_plans;
create policy meals_insert on public.meal_plans for insert with check (public.can_write_household(household_id) and created_by=auth.uid());
create policy meals_update on public.meal_plans for update using (public.can_write_household(household_id)) with check (public.can_write_household(household_id));
create policy meals_delete on public.meal_plans for delete using (public.can_write_household(household_id));

drop policy if exists participants_insert on public.meal_participants;
drop policy if exists participants_update on public.meal_participants;
drop policy if exists participants_delete on public.meal_participants;
create policy participants_insert on public.meal_participants for insert with check (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.can_write_household(m.household_id)));
create policy participants_update on public.meal_participants for update using (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.can_write_household(m.household_id))) with check (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.can_write_household(m.household_id)));
create policy participants_delete on public.meal_participants for delete using (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.can_write_household(m.household_id)));

drop policy if exists meal_guests_insert on public.meal_guests;
drop policy if exists meal_guests_update on public.meal_guests;
drop policy if exists meal_guests_delete on public.meal_guests;
create policy meal_guests_insert on public.meal_guests for insert with check (created_by=auth.uid() and exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.can_write_household(m.household_id)));
create policy meal_guests_update on public.meal_guests for update using (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.can_write_household(m.household_id))) with check (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.can_write_household(m.household_id)));
create policy meal_guests_delete on public.meal_guests for delete using (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.can_write_household(m.household_id)));

drop policy if exists shopping_insert on public.shopping_items;
drop policy if exists shopping_update on public.shopping_items;
drop policy if exists shopping_delete on public.shopping_items;
create policy shopping_insert on public.shopping_items for insert with check (public.can_write_household(household_id));
create policy shopping_update on public.shopping_items for update using (public.can_write_household(household_id)) with check (public.can_write_household(household_id));
create policy shopping_delete on public.shopping_items for delete using (public.can_write_household(household_id));

drop policy if exists pantry_insert on public.pantry_items;
drop policy if exists pantry_update on public.pantry_items;
drop policy if exists pantry_delete on public.pantry_items;
create policy pantry_insert on public.pantry_items for insert with check (public.can_write_household(household_id));
create policy pantry_update on public.pantry_items for update using (public.can_write_household(household_id)) with check (public.can_write_household(household_id));
create policy pantry_delete on public.pantry_items for delete using (public.can_write_household(household_id));

drop policy if exists member_absences_insert on public.member_absences;
drop policy if exists member_absences_update on public.member_absences;
drop policy if exists member_absences_delete on public.member_absences;
create policy member_absences_insert on public.member_absences for insert with check (
  public.can_write_household(household_id)
  and created_by=auth.uid()
  and exists(select 1 from public.household_members hm where hm.household_id=member_absences.household_id and hm.user_id=member_absences.user_id)
);
create policy member_absences_update on public.member_absences for update using (public.can_write_household(household_id)) with check (
  public.can_write_household(household_id)
  and exists(select 1 from public.household_members hm where hm.household_id=member_absences.household_id and hm.user_id=member_absences.user_id)
);
create policy member_absences_delete on public.member_absences for delete using (public.can_write_household(household_id));

drop policy if exists shopping_responsibilities_insert on public.shopping_responsibilities;
drop policy if exists shopping_responsibilities_update on public.shopping_responsibilities;
drop policy if exists shopping_responsibilities_delete on public.shopping_responsibilities;
create policy shopping_responsibilities_insert on public.shopping_responsibilities for insert with check (
  public.can_write_household(household_id)
  and updated_by=auth.uid()
  and (assigned_user_id is null or exists(select 1 from public.household_members hm where hm.household_id=shopping_responsibilities.household_id and hm.user_id=shopping_responsibilities.assigned_user_id))
);
create policy shopping_responsibilities_update on public.shopping_responsibilities for update using (public.can_write_household(household_id)) with check (
  public.can_write_household(household_id)
  and updated_by=auth.uid()
  and (assigned_user_id is null or exists(select 1 from public.household_members hm where hm.household_id=shopping_responsibilities.household_id and hm.user_id=shopping_responsibilities.assigned_user_id))
);
create policy shopping_responsibilities_delete on public.shopping_responsibilities for delete using (public.can_write_household(household_id));

drop policy if exists recipe_feedback_insert on public.recipe_feedback;
drop policy if exists recipe_feedback_update on public.recipe_feedback;
drop policy if exists recipe_feedback_delete on public.recipe_feedback;
create policy recipe_feedback_insert on public.recipe_feedback for insert with check (
  user_id=auth.uid() and public.can_write_household(household_id)
  and exists(select 1 from public.recipes r where r.id=recipe_feedback.recipe_id and r.household_id=recipe_feedback.household_id)
);
create policy recipe_feedback_update on public.recipe_feedback for update using (user_id=auth.uid() and public.can_write_household(household_id)) with check (
  user_id=auth.uid() and public.can_write_household(household_id)
  and exists(select 1 from public.recipes r where r.id=recipe_feedback.recipe_id and r.household_id=recipe_feedback.household_id)
);
create policy recipe_feedback_delete on public.recipe_feedback for delete using (user_id=auth.uid() and public.can_write_household(household_id));

-- SECURITY DEFINER RPCs must enforce the same collaboration rule themselves because they can
-- bypass RLS internally.
create or replace function public.create_recipe_with_ingredients(
  p_household_id uuid,
  p_title text,
  p_prep_minutes integer default 0,
  p_cook_minutes integer default 0,
  p_portions numeric default 4,
  p_tags text[] default '{}',
  p_steps text[] default '{}',
  p_ingredients jsonb default '[]'::jsonb,
  p_source_url text default null,
  p_photo_url text default null,
  p_source_language text default null,
  p_difficulty text default 'easy'
)
returns uuid language plpgsql security definer set search_path=public as $$
declare rid uuid; item jsonb; idx integer:=0; difficulty_code text;
begin
  if not public.can_write_household(p_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if public.premium_enforcement_enabled() and not public.household_has_active_family(p_household_id) then
    if nullif(trim(coalesce(p_source_url,'')),'') is not null or nullif(trim(coalesce(p_photo_url,'')),'') is not null then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
    if (select count(*) from public.recipes where household_id=p_household_id)>=10 then raise exception 'FREE_RECIPE_LIMIT'; end if;
  end if;
  difficulty_code:=case lower(coalesce(p_difficulty,'easy')) when 'facile' then 'easy' when 'moyen' then 'medium' when 'difficile' then 'hard' when 'easy' then 'easy' when 'medium' then 'medium' when 'hard' then 'hard' else 'easy' end;
  insert into public.recipes(household_id,title,prep_minutes,cook_minutes,portions,tags,steps,source_url,photo_url,source_language,difficulty,created_by)
  values(p_household_id,trim(p_title),greatest(p_prep_minutes,0),greatest(p_cook_minutes,0),greatest(p_portions,1),coalesce(p_tags,'{}'),to_jsonb(coalesce(p_steps,'{}'::text[])),nullif(trim(coalesce(p_source_url,'')),''),nullif(trim(coalesce(p_photo_url,'')),''),nullif(trim(coalesce(p_source_language,'')),''),difficulty_code,auth.uid())
  returning id into rid;
  for item in select * from jsonb_array_elements(coalesce(p_ingredients,'[]'::jsonb)) loop
    idx:=idx+1;
    insert into public.recipe_ingredients(recipe_id,name,ingredient_key,quantity,unit,aisle,sort_order)
    values(rid,trim(item->>'name'),nullif(trim(coalesce(item->>'normalized_key',item->>'ingredient_key','')),''),nullif(item->>'quantity','')::numeric,nullif(item->>'unit',''),coalesce(nullif(item->>'aisle',''),'other'),idx);
  end loop;
  return rid;
end; $$;

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
declare mid uuid; source_meal public.meal_plans;
begin
  if not public.can_write_household(p_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if p_meal_type not in ('breakfast','lunch','dinner','snack') then raise exception 'Invalid meal type'; end if;
  if p_meal_mode not in ('fresh','leftover') then raise exception 'Invalid meal mode'; end if;
  if p_servings is not null and (p_servings<1 or p_servings>20) then raise exception 'Servings out of range'; end if;
  if p_cook_user_id is not null and not exists(select 1 from public.household_members hm where hm.household_id=p_household_id and hm.user_id=p_cook_user_id) then raise exception 'Cook must belong to household'; end if;
  if p_participant_user_ids is not null and exists(select 1 from unnest(p_participant_user_ids) as u(user_id) where u.user_id is null or not exists(select 1 from public.household_members hm where hm.household_id=p_household_id and hm.user_id=u.user_id)) then raise exception 'Participant must belong to household'; end if;
  if p_guest_names is not null and exists(select 1 from unnest(p_guest_names) as g(name) where nullif(trim(g.name),'') is not null and char_length(trim(g.name))>80) then raise exception 'Guest name too long'; end if;
  if p_meal_mode='leftover' then
    if p_leftover_from_meal_id is null then raise exception 'Leftover source required'; end if;
    select * into source_meal from public.meal_plans where id=p_leftover_from_meal_id and household_id=p_household_id;
    if source_meal.id is null then raise exception 'Leftover source not in household'; end if;
    if source_meal.meal_date>=p_meal_date then raise exception 'Leftover source must be earlier'; end if;
    p_recipe_id:=null;
    if nullif(trim(coalesce(p_custom_title,'')),'') is null then p_custom_title:=coalesce(source_meal.custom_title,(select title from public.recipes where id=source_meal.recipe_id),'Leftovers'); end if;
  else
    p_leftover_from_meal_id:=null;
    if p_recipe_id is null and nullif(trim(coalesce(p_custom_title,'')),'') is null then raise exception 'Recipe or title required'; end if;
    if p_recipe_id is not null and not exists(select 1 from public.recipes where id=p_recipe_id and household_id=p_household_id) then raise exception 'Recipe not in household'; end if;
  end if;
  insert into public.meal_plans(household_id,meal_date,meal_type,recipe_id,custom_title,notes,servings,meal_mode,leftover_from_meal_id,cook_user_id,created_by)
  values(p_household_id,p_meal_date,p_meal_type,p_recipe_id,nullif(trim(coalesce(p_custom_title,'')),''),nullif(trim(coalesce(p_notes,'')),''),p_servings,p_meal_mode,p_leftover_from_meal_id,p_cook_user_id,auth.uid())
  on conflict (household_id,meal_date,meal_type) do update set recipe_id=excluded.recipe_id,custom_title=excluded.custom_title,notes=excluded.notes,servings=excluded.servings,meal_mode=excluded.meal_mode,leftover_from_meal_id=excluded.leftover_from_meal_id,cook_user_id=excluded.cook_user_id,updated_at=now()
  returning id into mid;
  if p_participant_user_ids is not null then
    delete from public.meal_participants where meal_plan_id=mid;
    insert into public.meal_participants(meal_plan_id,user_id,eating) select mid,u.user_id,true from (select distinct user_id from unnest(p_participant_user_ids) as p(user_id) where user_id is not null) u;
  end if;
  if p_guest_names is not null then
    delete from public.meal_guests where meal_plan_id=mid;
    insert into public.meal_guests(meal_plan_id,name,created_by)
    select mid,min(clean_name),auth.uid() from (select trim(g.name) as clean_name from unnest(p_guest_names) as g(name) where nullif(trim(g.name),'') is not null) cleaned group by lower(clean_name);
  end if;
  return mid;
end; $$;

create or replace function public.rebuild_weekly_shopping_list(p_household_id uuid, p_week_start date)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.can_write_household(p_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  perform 1 from public.households where id=p_household_id for update;
  if not found then raise exception 'Household not found'; end if;
  delete from public.shopping_items where household_id=p_household_id and week_start=p_week_start and source='meal_plan';
  with required as (
    select coalesce(nullif(min(ri.ingredient_key),''),lower(trim(min(ri.name)))) as ingredient_key,min(ri.name) as label,
      sum(case when ri.quantity is null then null else ri.quantity * (coalesce(mp.servings,r.portions)::numeric / nullif(r.portions,0)::numeric) end) as quantity,
      ri.unit,ri.aisle,min(r.id) as source_recipe_id
    from public.meal_plans mp join public.recipes r on r.id=mp.recipe_id join public.recipe_ingredients ri on ri.recipe_id=r.id
    where mp.household_id=p_household_id and mp.meal_date>=p_week_start and mp.meal_date<p_week_start+7
    group by coalesce(nullif(ri.ingredient_key,''),lower(trim(ri.name))),coalesce(ri.unit,''),ri.unit,ri.aisle
  ), stock as (
    select ingredient_key,coalesce(unit,'') as unit_key,bool_or(quantity is null) as has_marker,sum(coalesce(quantity,0)) as quantity from public.pantry_items where household_id=p_household_id group by ingredient_key,coalesce(unit,'')
  ), missing as (
    select r.*,case when r.quantity is null then null else greatest(r.quantity-coalesce(s.quantity,0),0) end as missing_quantity,coalesce(s.has_marker,false) as has_marker
    from required r left join stock s on s.ingredient_key=r.ingredient_key and s.unit_key=coalesce(r.unit,'')
  )
  insert into public.shopping_items(household_id,week_start,label,ingredient_key,quantity,unit,aisle,source,source_recipe_id,created_by)
  select p_household_id,p_week_start,label,ingredient_key,missing_quantity,unit,aisle,'meal_plan',source_recipe_id,auth.uid() from missing where not has_marker and (quantity is null or missing_quantity>0);
end; $$;

create or replace function public.add_recipe_to_shopping_list(p_household_id uuid,p_week_start date,p_recipe_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare ri record; touched integer:=0;
begin
  if not public.can_write_household(p_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  perform 1 from public.households where id=p_household_id for update;
  if not found then raise exception 'Household not found'; end if;
  if not exists(select 1 from public.recipes where id=p_recipe_id and household_id=p_household_id) then raise exception 'Recipe not in household'; end if;
  for ri in select * from public.recipe_ingredients where recipe_id=p_recipe_id order by sort_order loop
    update public.shopping_items s set quantity=case when s.quantity is null and ri.quantity is null then null when s.quantity is null then ri.quantity when ri.quantity is null then s.quantity else s.quantity+ri.quantity end,source_recipe_id=p_recipe_id,updated_at=now()
    where s.household_id=p_household_id and s.week_start=p_week_start and s.checked=false and coalesce(nullif(s.ingredient_key,''),lower(trim(s.label)))=coalesce(nullif(ri.ingredient_key,''),lower(trim(ri.name))) and coalesce(s.unit,'')=coalesce(ri.unit,'') and s.aisle=ri.aisle;
    if not found then insert into public.shopping_items(household_id,week_start,label,ingredient_key,quantity,unit,aisle,source,source_recipe_id,created_by) values(p_household_id,p_week_start,ri.name,coalesce(nullif(ri.ingredient_key,''),lower(trim(ri.name))),ri.quantity,ri.unit,ri.aisle,'recipe',p_recipe_id,auth.uid()); end if;
    touched:=touched+1;
  end loop;
  return touched;
end; $$;

create or replace function public.upsert_pantry_item(
  p_household_id uuid,p_label text,p_ingredient_key text,p_quantity numeric default null,p_unit text default null,p_aisle text default 'other',p_expires_on date default null
)
returns uuid language plpgsql security definer set search_path=public as $$
declare existing_id uuid; existing_quantity numeric; existing_expiry date; result_id uuid;
begin
  if not public.can_write_household(p_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  perform 1 from public.households where id=p_household_id for update;
  if not found then raise exception 'Household not found'; end if;
  if nullif(trim(coalesce(p_label,'')),'') is null then raise exception 'Label required'; end if;
  if nullif(trim(coalesce(p_ingredient_key,'')),'') is null then raise exception 'Ingredient key required'; end if;
  if p_quantity is not null and p_quantity < 0 then raise exception 'Invalid quantity'; end if;
  if p_aisle not in ('produce','fresh','meat_fish','pantry','frozen','drinks','other') then p_aisle:='other'; end if;
  select id,quantity,expires_on into existing_id,existing_quantity,existing_expiry from public.pantry_items where household_id=p_household_id and ingredient_key=p_ingredient_key and coalesce(unit,'')=coalesce(nullif(trim(coalesce(p_unit,'')),''),'') limit 1;
  if existing_id is not null then
    update public.pantry_items set label=trim(p_label),quantity=case when p_quantity is null then null when existing_quantity is null then p_quantity else existing_quantity+p_quantity end,aisle=p_aisle,expires_on=case when existing_expiry is null then p_expires_on when p_expires_on is null then existing_expiry else least(existing_expiry,p_expires_on) end,updated_by=auth.uid(),updated_at=now() where id=existing_id returning id into result_id;
  else
    insert into public.pantry_items(household_id,label,ingredient_key,quantity,unit,aisle,expires_on,updated_by) values(p_household_id,trim(p_label),p_ingredient_key,p_quantity,nullif(trim(coalesce(p_unit,'')),''),p_aisle,p_expires_on,auth.uid()) returning id into result_id;
  end if;
  return result_id;
end; $$;

-- Keep the existing RPC privilege contract explicit after replacement.
revoke all on function public.create_recipe_with_ingredients(uuid,text,integer,integer,numeric,text[],text[],jsonb,text,text,text,text) from public;
revoke all on function public.set_meal_slot(uuid,date,text,uuid,text,text,numeric,text,uuid,uuid,uuid[],text[]) from public;
revoke all on function public.rebuild_weekly_shopping_list(uuid,date) from public;
revoke all on function public.add_recipe_to_shopping_list(uuid,date,uuid) from public;
revoke all on function public.upsert_pantry_item(uuid,text,text,numeric,text,text,date) from public;
grant execute on function public.create_recipe_with_ingredients(uuid,text,integer,integer,numeric,text[],text[],jsonb,text,text,text,text) to authenticated;
grant execute on function public.set_meal_slot(uuid,date,text,uuid,text,text,numeric,text,uuid,uuid,uuid[],text[]) to authenticated;
grant execute on function public.rebuild_weekly_shopping_list(uuid,date) to authenticated;
grant execute on function public.add_recipe_to_shopping_list(uuid,date,uuid) to authenticated;
grant execute on function public.upsert_pantry_item(uuid,text,text,numeric,text,text,date) to authenticated;
