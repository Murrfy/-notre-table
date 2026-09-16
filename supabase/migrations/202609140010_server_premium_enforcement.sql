-- V0.105 — Premium enforcement is a trusted backend setting, never a mobile flag.
-- Development/preview backends can keep enforcement disabled. A production backend must
-- explicitly enable it server-side before release smoke is allowed to pass.

create table if not exists public.app_release_settings (
  singleton boolean primary key default true check (singleton),
  premium_enforcement boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.app_release_settings(singleton,premium_enforcement)
values(true,false)
on conflict (singleton) do nothing;

alter table public.app_release_settings enable row level security;
revoke all on table public.app_release_settings from public, anon, authenticated;
grant select,insert,update,delete on table public.app_release_settings to service_role;

create or replace function public.premium_enforcement_enabled()
returns boolean
language sql
stable
security definer
set search_path=public as $$
  select coalesce((select premium_enforcement from public.app_release_settings where singleton=true),false)
$$;

create or replace function public.household_has_active_family(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public as $$
  select exists(
    select 1
    from public.household_access ha
    where ha.household_id=p_household_id
      and ha.plan='family'
      and (ha.expires_at is null or ha.expires_at>now())
  )
$$;

create or replace function public.family_feature_allowed(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public as $$
  select not public.premium_enforcement_enabled()
      or public.household_has_active_family(p_household_id)
$$;

revoke all on function public.premium_enforcement_enabled() from public;
revoke all on function public.household_has_active_family(uuid) from public;
revoke all on function public.family_feature_allowed(uuid) from public;
grant execute on function public.premium_enforcement_enabled() to authenticated;
grant execute on function public.household_has_active_family(uuid) to authenticated;
grant execute on function public.family_feature_allowed(uuid) to authenticated;

-- Invitations are written only through the SECURITY DEFINER RPC. This prevents an admin
-- client from bypassing cryptographic code generation, member limits, or plan checks.
revoke insert,update,delete on table public.invitations from authenticated;
grant select on table public.invitations to authenticated;

create or replace function public.create_household_invitation(p_household_id uuid)
returns text language plpgsql security definer set search_path=public as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  i int;
  attempts int := 0;
begin
  if not public.is_household_admin(p_household_id) then raise exception 'Admin required'; end if;
  if not public.family_feature_allowed(p_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;

  -- Lock the stable parent row for the duration of this transaction. Concurrent invitation
  -- requests for the same household serialize here; the waiter then observes the first live code.
  perform 1 from public.households where id=p_household_id for update;
  if not found then raise exception 'Household not found'; end if;

  if (select count(*) from public.household_members where household_id=p_household_id)>=6 then
    raise exception 'HOUSEHOLD_MEMBER_LIMIT';
  end if;

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

create or replace function public.join_household_by_code(p_code text)
returns table(id uuid, name text)
language plpgsql security definer set search_path=public as $$
declare inv public.invitations; h public.households;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists(select 1 from public.household_members where user_id=auth.uid()) then raise exception 'User already belongs to a household'; end if;
  select * into inv from public.invitations where code=upper(trim(p_code)) and expires_at>now() and used_by is null order by created_at desc limit 1 for update;
  if inv.id is null then raise exception 'Invalid or expired invitation'; end if;
  perform 1 from public.households where households.id=inv.household_id for update;
  if not found then raise exception 'Invalid or expired invitation'; end if;
  if not public.family_feature_allowed(inv.household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if (select count(*) from public.household_members where household_id=inv.household_id)>=6 then raise exception 'HOUSEHOLD_MEMBER_LIMIT'; end if;
  insert into public.household_members(household_id,user_id,role) values(inv.household_id,auth.uid(),'member');
  update public.invitations set used_by=auth.uid() where invitations.id=inv.id;
  select * into h from public.households where households.id=inv.household_id;
  return query select h.id,h.name;
end; $$;

revoke all on function public.join_household_by_code(text) from public;
grant execute on function public.join_household_by_code(text) to authenticated;

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
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;
  if public.premium_enforcement_enabled() and not public.household_has_active_family(p_household_id) then
    if nullif(trim(coalesce(p_source_url,'')),'') is not null or nullif(trim(coalesce(p_photo_url,'')),'') is not null then
      raise exception 'FAMILY_PLAN_REQUIRED';
    end if;
    if (select count(*) from public.recipes where household_id=p_household_id)>=10 then
      raise exception 'FREE_RECIPE_LIMIT';
    end if;
  end if;
  difficulty_code:=case lower(coalesce(p_difficulty,'easy')) when 'facile' then 'easy' when 'moyen' then 'medium' when 'difficile' then 'hard' when 'easy' then 'easy' when 'medium' then 'medium' when 'hard' then 'hard' else 'easy' end;
  insert into public.recipes(household_id,title,prep_minutes,cook_minutes,portions,tags,steps,source_url,photo_url,source_language,difficulty,created_by)
  values(p_household_id,trim(p_title),greatest(p_prep_minutes,0),greatest(p_cook_minutes,0),greatest(p_portions,1),coalesce(p_tags,'{}'),to_jsonb(coalesce(p_steps,'{}'::text[])),nullif(trim(coalesce(p_source_url,'')),''),nullif(trim(coalesce(p_photo_url,'')),''),nullif(trim(coalesce(p_source_language,'')),''),difficulty_code,auth.uid())
  returning id into rid;
  for item in select * from jsonb_array_elements(coalesce(p_ingredients,'[]'::jsonb)) loop
    idx:=idx+1;
    insert into public.recipe_ingredients(recipe_id,name,ingredient_key,quantity,unit,aisle,sort_order)
    values(
      rid,
      trim(item->>'name'),
      nullif(trim(coalesce(item->>'normalized_key',item->>'ingredient_key','')),''),
      nullif(item->>'quantity','')::numeric,
      nullif(item->>'unit',''),
      coalesce(nullif(item->>'aisle',''),'other'),
      idx
    );
  end loop;
  return rid;
end; $$;

revoke all on function public.create_recipe_with_ingredients(uuid,text,integer,integer,numeric,text[],text[],jsonb,text,text,text,text) from public;
grant execute on function public.create_recipe_with_ingredients(uuid,text,integer,integer,numeric,text[],text[],jsonb,text,text,text,text) to authenticated;

create or replace function public.copy_previous_week(p_household_id uuid, p_target_week_start date)
returns integer language plpgsql security definer set search_path=public as $$
declare src record; target_id uuid; copied integer:=0;
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;
  if not public.family_feature_allowed(p_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  for src in
    select * from public.meal_plans
    where household_id=p_household_id and meal_date>=p_target_week_start-7 and meal_date<p_target_week_start
    order by meal_date,meal_type
  loop
    insert into public.meal_plans(household_id,meal_date,meal_type,recipe_id,custom_title,cook_user_id,notes,servings,meal_mode,leftover_from_meal_id,created_by)
    values(p_household_id,src.meal_date+7,src.meal_type,src.recipe_id,src.custom_title,src.cook_user_id,src.notes,src.servings,src.meal_mode,null,auth.uid())
    on conflict (household_id,meal_date,meal_type) do update set
      recipe_id=excluded.recipe_id, custom_title=excluded.custom_title, cook_user_id=excluded.cook_user_id,
      notes=excluded.notes, servings=excluded.servings, meal_mode=excluded.meal_mode, leftover_from_meal_id=null, updated_at=now()
    returning id into target_id;
    delete from public.meal_participants where meal_plan_id=target_id;
    insert into public.meal_participants(meal_plan_id,user_id,eating)
    select target_id,user_id,eating from public.meal_participants where meal_plan_id=src.id;
    delete from public.meal_guests where meal_plan_id=target_id;
    insert into public.meal_guests(meal_plan_id,name,created_by)
    select target_id,name,auth.uid() from public.meal_guests where meal_plan_id=src.id;
    copied:=copied+1;
  end loop;
  return copied;
end; $$;

revoke all on function public.copy_previous_week(uuid,date) from public;
grant execute on function public.copy_previous_week(uuid,date) to authenticated;

-- Family ideas remain readable as household history, but proposing/voting is a Family feature
-- once production enforcement is enabled.
drop policy if exists meal_ideas_insert on public.meal_ideas;
drop policy if exists meal_ideas_update on public.meal_ideas;
drop policy if exists meal_ideas_delete on public.meal_ideas;
create policy meal_ideas_insert on public.meal_ideas for insert with check (
  public.is_household_member(household_id)
  and public.family_feature_allowed(household_id)
  and proposed_by=auth.uid()
  and (recipe_id is null or exists(select 1 from public.recipes r where r.id=recipe_id and r.household_id=household_id))
);
create policy meal_ideas_update on public.meal_ideas for update
  using ((proposed_by=auth.uid() or public.is_household_admin(household_id)) and public.family_feature_allowed(household_id))
  with check (public.is_household_member(household_id) and public.family_feature_allowed(household_id));
create policy meal_ideas_delete on public.meal_ideas for delete
  using ((proposed_by=auth.uid() or public.is_household_admin(household_id)) and public.family_feature_allowed(household_id));

drop policy if exists meal_idea_votes_insert on public.meal_idea_votes;
drop policy if exists meal_idea_votes_delete on public.meal_idea_votes;
create policy meal_idea_votes_insert on public.meal_idea_votes for insert with check (
  user_id=auth.uid()
  and exists(select 1 from public.meal_ideas i where i.id=idea_id and public.is_household_member(i.household_id) and public.family_feature_allowed(i.household_id))
);
create policy meal_idea_votes_delete on public.meal_idea_votes for delete using (
  user_id=auth.uid()
  and exists(select 1 from public.meal_ideas i where i.id=idea_id and public.family_feature_allowed(i.household_id))
);
