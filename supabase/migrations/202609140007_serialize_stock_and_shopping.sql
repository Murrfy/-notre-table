-- V0.86 — serialize pantry merge and generated shopping mutations per household.

create or replace function public.upsert_pantry_item(
  p_household_id uuid,
  p_label text,
  p_ingredient_key text,
  p_quantity numeric default null,
  p_unit text default null,
  p_aisle text default 'other',
  p_expires_on date default null
)
returns uuid language plpgsql security definer set search_path=public as $$
declare existing_id uuid; existing_quantity numeric; existing_expiry date; result_id uuid;
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;

  -- Serialize household-level stock/list mutations so concurrent devices cannot both
  -- observe a missing row and create divergent state.
  perform 1 from public.households where id=p_household_id for update;
  if not found then raise exception 'Household not found'; end if;
  if nullif(trim(coalesce(p_label,'')),'') is null then raise exception 'Label required'; end if;
  if nullif(trim(coalesce(p_ingredient_key,'')),'') is null then raise exception 'Ingredient key required'; end if;
  if p_quantity is not null and p_quantity < 0 then raise exception 'Invalid quantity'; end if;
  if p_aisle not in ('produce','fresh','meat_fish','pantry','frozen','drinks','other') then p_aisle:='other'; end if;

  select id,quantity,expires_on into existing_id,existing_quantity,existing_expiry
  from public.pantry_items
  where household_id=p_household_id and ingredient_key=p_ingredient_key and coalesce(unit,'')=coalesce(nullif(trim(coalesce(p_unit,'')),''),'')
  limit 1;

  if existing_id is not null then
    update public.pantry_items set
      label=trim(p_label),
      quantity=case when p_quantity is null then null when existing_quantity is null then p_quantity else existing_quantity+p_quantity end,
      aisle=p_aisle,
      expires_on=case when existing_expiry is null then p_expires_on when p_expires_on is null then existing_expiry else least(existing_expiry,p_expires_on) end,
      updated_by=auth.uid(),
      updated_at=now()
    where id=existing_id
    returning id into result_id;
  else
    insert into public.pantry_items(household_id,label,ingredient_key,quantity,unit,aisle,expires_on,updated_by)
    values(p_household_id,trim(p_label),p_ingredient_key,p_quantity,nullif(trim(coalesce(p_unit,'')),''),p_aisle,p_expires_on,auth.uid())
    returning id into result_id;
  end if;
  return result_id;
end; $$;

revoke all on function public.upsert_pantry_item(uuid,text,text,numeric,text,text,date) from public;

grant execute on function public.upsert_pantry_item(uuid,text,text,numeric,text,text,date) to authenticated;

create or replace function public.add_recipe_to_shopping_list(p_household_id uuid,p_week_start date,p_recipe_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare ri record; touched integer:=0;
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;

  -- Serialize household-level stock/list mutations so concurrent devices cannot both
  -- observe a missing row and create divergent state.
  perform 1 from public.households where id=p_household_id for update;
  if not found then raise exception 'Household not found'; end if;
  if not exists(select 1 from public.recipes where id=p_recipe_id and household_id=p_household_id) then raise exception 'Recipe not in household'; end if;
  for ri in select * from public.recipe_ingredients where recipe_id=p_recipe_id order by sort_order loop
    update public.shopping_items s set
      quantity=case when s.quantity is null and ri.quantity is null then null when s.quantity is null then ri.quantity when ri.quantity is null then s.quantity else s.quantity+ri.quantity end,
      source_recipe_id=p_recipe_id,
      updated_at=now()
    where s.household_id=p_household_id and s.week_start=p_week_start and s.checked=false
      and coalesce(nullif(s.ingredient_key,''),lower(trim(s.label)))=coalesce(nullif(ri.ingredient_key,''),lower(trim(ri.name)))
      and coalesce(s.unit,'')=coalesce(ri.unit,'') and s.aisle=ri.aisle;
    if not found then
      insert into public.shopping_items(household_id,week_start,label,ingredient_key,quantity,unit,aisle,source,source_recipe_id,created_by)
      values(p_household_id,p_week_start,ri.name,coalesce(nullif(ri.ingredient_key,''),lower(trim(ri.name))),ri.quantity,ri.unit,ri.aisle,'recipe',p_recipe_id,auth.uid());
    end if;
    touched:=touched+1;
  end loop;
  return touched;
end; $$;

revoke all on function public.add_recipe_to_shopping_list(uuid,date,uuid) from public;

grant execute on function public.add_recipe_to_shopping_list(uuid,date,uuid) to authenticated;

create or replace function public.rebuild_weekly_shopping_list(p_household_id uuid, p_week_start date)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;

  -- Serialize household-level stock/list mutations so concurrent devices cannot both
  -- observe a missing row and create divergent state.
  perform 1 from public.households where id=p_household_id for update;
  if not found then raise exception 'Household not found'; end if;
  delete from public.shopping_items where household_id=p_household_id and week_start=p_week_start and source='meal_plan';

  with required as (
    select
      coalesce(nullif(min(ri.ingredient_key),''),lower(trim(min(ri.name)))) as ingredient_key,
      min(ri.name) as label,
      sum(case when ri.quantity is null then null else ri.quantity * (coalesce(mp.servings,r.portions)::numeric / nullif(r.portions,0)::numeric) end) as quantity,
      ri.unit,
      ri.aisle,
      min(r.id) as source_recipe_id
    from public.meal_plans mp
    join public.recipes r on r.id=mp.recipe_id
    join public.recipe_ingredients ri on ri.recipe_id=r.id
    where mp.household_id=p_household_id and mp.meal_date>=p_week_start and mp.meal_date<p_week_start+7
    group by coalesce(nullif(ri.ingredient_key,''),lower(trim(ri.name))),coalesce(ri.unit,''),ri.unit,ri.aisle
  ), stock as (
    select ingredient_key,coalesce(unit,'') as unit_key,bool_or(quantity is null) as has_marker,sum(coalesce(quantity,0)) as quantity
    from public.pantry_items where household_id=p_household_id
    group by ingredient_key,coalesce(unit,'')
  ), missing as (
    select r.*,
      case when r.quantity is null then null else greatest(r.quantity-coalesce(s.quantity,0),0) end as missing_quantity,
      coalesce(s.has_marker,false) as has_marker
    from required r
    left join stock s on s.ingredient_key=r.ingredient_key and s.unit_key=coalesce(r.unit,'')
  )
  insert into public.shopping_items(household_id,week_start,label,ingredient_key,quantity,unit,aisle,source,source_recipe_id,created_by)
  select p_household_id,p_week_start,label,ingredient_key,missing_quantity,unit,aisle,'meal_plan',source_recipe_id,auth.uid()
  from missing
  where not has_marker and (quantity is null or missing_quantity>0);
end; $$;

revoke all on function public.rebuild_weekly_shopping_list(uuid,date) from public;

grant execute on function public.rebuild_weekly_shopping_list(uuid,date) to authenticated;
