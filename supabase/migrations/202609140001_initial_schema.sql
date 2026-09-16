-- Notre Table — Supabase schema V0.29
-- PostgreSQL / Supabase. Script prévu pour être rejouable dans le SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table public.profiles add constraint profiles_display_name_len check (char_length(display_name) <= 60);
exception when duplicate_object then null; end $$;
alter table public.profiles add column if not exists avatar_path text;


create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create unique index if not exists one_household_per_user on public.household_members(user_id);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  code text not null unique check (char_length(code) = 6),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  photo_url text,
  prep_minutes integer not null default 0 check (prep_minutes >= 0),
  cook_minutes integer not null default 0 check (cook_minutes >= 0),
  portions numeric(6,2) not null default 4 check (portions > 0),
  steps jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  source_url text,
  difficulty text not null default 'easy' check (difficulty in ('easy','medium','hard')),
  source_language text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recipes add column if not exists difficulty text not null default 'easy';
alter table public.recipes add column if not exists source_language text;
update public.recipes set difficulty=case lower(difficulty) when 'facile' then 'easy' when 'moyen' then 'medium' when 'difficile' then 'hard' else difficulty end where difficulty is not null;
do $$ begin
  alter table public.recipes drop constraint if exists recipes_difficulty_check;
  alter table public.recipes drop constraint if exists recipes_difficulty_code_check;
  alter table public.recipes add constraint recipes_difficulty_code_check check (difficulty in ('easy','medium','hard'));
exception when duplicate_object then null; end $$;

create table if not exists public.recipe_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name text not null,
  ingredient_key text,
  quantity numeric(12,3),
  unit text,
  aisle text not null default 'other',
  sort_order integer not null default 0
);
alter table public.recipe_ingredients add column if not exists ingredient_key text;
update public.recipe_ingredients set aisle=case lower(aisle) when 'autres' then 'other' when 'épicerie' then 'pantry' when 'surgelés' then 'frozen' when 'boissons' then 'drinks' when 'produits frais' then 'fresh' when 'viandes & poissons' then 'meat_fish' when 'viandes et poissons' then 'meat_fish' when 'fruits & légumes' then 'produce' when 'fruits et légumes' then 'produce' else aisle end;

-- Cached translated views. The original recipe remains authoritative and untouched.
-- Writes are intended for a trusted translation endpoint/service role; household clients only read.
create table if not exists public.recipe_translations (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  language_code text not null check (char_length(language_code) between 2 and 12),
  title text not null,
  ingredients jsonb not null default '[]'::jsonb,
  steps text[] not null default '{}',
  source_hash text,
  engine text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (recipe_id, language_code)
);
create index if not exists recipe_translations_language_idx on public.recipe_translations(language_code);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  meal_date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  recipe_id uuid references public.recipes(id) on delete set null,
  custom_title text,
  cook_user_id uuid references auth.users(id) on delete set null,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (recipe_id is not null or nullif(trim(custom_title), '') is not null)
);
create index if not exists meal_plans_household_date_idx on public.meal_plans(household_id, meal_date);
create unique index if not exists meal_plans_one_slot_idx on public.meal_plans(household_id, meal_date, meal_type);

create table if not exists public.meal_participants (
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  eating boolean not null default true,
  primary key (meal_plan_id, user_id)
);


-- Temporary guests belong to a meal, not to the household account roster.
-- This keeps "who eats?" useful for friends/family visitors without forcing signup.
create table if not exists public.meal_guests (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists meal_guests_meal_idx on public.meal_guests(meal_plan_id);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  week_start date not null,
  label text not null,
  ingredient_key text,
  quantity numeric(12,3),
  unit text,
  aisle text not null default 'other',
  checked boolean not null default false,
  source text not null default 'manual' check (source in ('manual','meal_plan','recipe')),
  source_recipe_id uuid references public.recipes(id) on delete set null,
  checked_by uuid references auth.users(id) on delete set null,
  checked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.shopping_items add column if not exists week_start date;
alter table public.shopping_items alter column week_start drop default;
update public.shopping_items set week_start=current_date where week_start is null;
alter table public.shopping_items alter column week_start set not null;
alter table public.shopping_items add column if not exists ingredient_key text;
update public.shopping_items set aisle=case lower(aisle) when 'autres' then 'other' when 'épicerie' then 'pantry' when 'surgelés' then 'frozen' when 'boissons' then 'drinks' when 'produits frais' then 'fresh' when 'viandes & poissons' then 'meat_fish' when 'viandes et poissons' then 'meat_fish' when 'fruits & légumes' then 'produce' when 'fruits et légumes' then 'produce' else aisle end;
create index if not exists shopping_household_week_checked_idx on public.shopping_items(household_id, week_start, checked);

do $$ begin
  alter table public.shopping_items drop constraint if exists shopping_items_source_check;
  alter table public.shopping_items add constraint shopping_items_source_check check (source in ('manual','meal_plan','recipe'));
exception when duplicate_object then null; end $$;

create table if not exists public.member_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  allergies text[] not null default '{}',
  diets text[] not null default '{}',
  disliked_foods text[] not null default '{}',
  allergy_keys text[] not null default '{}',
  diet_keys text[] not null default '{}',
  disliked_ingredient_keys text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.member_preferences add column if not exists allergy_keys text[] not null default '{}';
alter table public.member_preferences add column if not exists diet_keys text[] not null default '{}';
alter table public.member_preferences add column if not exists disliked_ingredient_keys text[] not null default '{}';

-- Generic updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='profiles_set_updated_at') then
    create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname='households_set_updated_at') then
    create trigger households_set_updated_at before update on public.households for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname='recipes_set_updated_at') then
    create trigger recipes_set_updated_at before update on public.recipes for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname='recipe_translations_set_updated_at') then
    create trigger recipe_translations_set_updated_at before update on public.recipe_translations for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname='meal_plans_set_updated_at') then
    create trigger meal_plans_set_updated_at before update on public.meal_plans for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname='shopping_items_set_updated_at') then
    create trigger shopping_items_set_updated_at before update on public.shopping_items for each row execute function public.set_updated_at();
  end if;
end $$;

-- Auto-profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email,''),'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- RLS helper functions
create or replace function public.is_household_member(target_household uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.household_members hm where hm.household_id=target_household and hm.user_id=auth.uid());
$$;
create or replace function public.is_household_admin(target_household uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.household_members hm where hm.household_id=target_household and hm.user_id=auth.uid() and hm.role='admin');
$$;

-- Transactional app RPCs
create or replace function public.create_household(p_name text)
returns table(id uuid, name text)
language plpgsql security definer set search_path=public as $$
declare h public.households;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists(select 1 from public.household_members where user_id=auth.uid()) then raise exception 'User already belongs to a household'; end if;
  insert into public.households(name,created_by) values(trim(p_name),auth.uid()) returning * into h;
  insert into public.household_members(household_id,user_id,role) values(h.id,auth.uid(),'admin');
  return query select h.id,h.name;
end; $$;

create or replace function public.create_household_invitation(p_household_id uuid)
returns text language plpgsql security definer set search_path=public as $$
declare alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; v_code text; i int; attempts int:=0;
begin
  if not public.is_household_admin(p_household_id) then raise exception 'Admin required'; end if;
  loop
    attempts:=attempts+1; v_code:='';
    for i in 1..6 loop v_code:=v_code||substr(alphabet, 1+floor(random()*length(alphabet))::int, 1); end loop;
    exit when not exists(select 1 from public.invitations where code=v_code and expires_at>now() and used_by is null);
    if attempts>20 then raise exception 'Could not generate invitation code'; end if;
  end loop;
  insert into public.invitations(household_id,code,created_by,expires_at) values(p_household_id,v_code,auth.uid(),now()+interval '7 days');
  return v_code;
end; $$;

create or replace function public.join_household_by_code(p_code text)
returns table(id uuid, name text)
language plpgsql security definer set search_path=public as $$
declare inv public.invitations; h public.households;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists(select 1 from public.household_members where user_id=auth.uid()) then raise exception 'User already belongs to a household'; end if;
  select * into inv from public.invitations where code=upper(trim(p_code)) and expires_at>now() and used_by is null order by created_at desc limit 1 for update;
  if inv.id is null then raise exception 'Invalid or expired invitation'; end if;
  insert into public.household_members(household_id,user_id,role) values(inv.household_id,auth.uid(),'member');
  update public.invitations set used_by=auth.uid() where invitations.id=inv.id;
  select * into h from public.households where households.id=inv.household_id;
  return query select h.id,h.name;
end; $$;


drop function if exists public.create_recipe_with_ingredients(uuid,text,integer,integer,numeric,text[],text[],jsonb);
drop function if exists public.create_recipe_with_ingredients(uuid,text,integer,integer,numeric,text[],text[],jsonb,text,text);
drop function if exists public.create_recipe_with_ingredients(uuid,text,integer,integer,numeric,text[],text[],jsonb,text,text,text,text);

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

create or replace function public.set_meal_slot(
  p_household_id uuid,
  p_meal_date date,
  p_meal_type text,
  p_recipe_id uuid default null,
  p_custom_title text default null,
  p_notes text default null
)
returns uuid language plpgsql security definer set search_path=public as $$
declare mid uuid;
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;
  if p_meal_type not in ('breakfast','lunch','dinner','snack') then raise exception 'Invalid meal type'; end if;
  if p_recipe_id is null and nullif(trim(coalesce(p_custom_title,'')),'') is null then raise exception 'Recipe or title required'; end if;
  if p_recipe_id is not null and not exists(select 1 from public.recipes where id=p_recipe_id and household_id=p_household_id) then raise exception 'Recipe not in household'; end if;

  insert into public.meal_plans(household_id,meal_date,meal_type,recipe_id,custom_title,notes,created_by)
  values(p_household_id,p_meal_date,p_meal_type,p_recipe_id,nullif(trim(coalesce(p_custom_title,'')),''),nullif(trim(coalesce(p_notes,'')),''),auth.uid())
  on conflict (household_id,meal_date,meal_type) do update set
    recipe_id=excluded.recipe_id,
    custom_title=excluded.custom_title,
    notes=excluded.notes,
    updated_at=now()
  returning id into mid;
  return mid;
end; $$;

create or replace function public.rebuild_weekly_shopping_list(p_household_id uuid, p_week_start date)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;
  delete from public.shopping_items where household_id=p_household_id and week_start=p_week_start and source='meal_plan';
  insert into public.shopping_items(household_id,week_start,label,ingredient_key,quantity,unit,aisle,source,source_recipe_id,created_by)
  select p_household_id,p_week_start,min(ri.name),coalesce(nullif(min(ri.ingredient_key),''),lower(trim(min(ri.name)))),sum(ri.quantity),ri.unit,ri.aisle,'meal_plan',min(r.id),auth.uid()
  from public.meal_plans mp
  join public.recipes r on r.id=mp.recipe_id
  join public.recipe_ingredients ri on ri.recipe_id=r.id
  where mp.household_id=p_household_id and mp.meal_date>=p_week_start and mp.meal_date<p_week_start+7
  group by coalesce(nullif(ri.ingredient_key,''),lower(trim(ri.name))),coalesce(ri.unit,''),ri.aisle;
end; $$;

-- Copy every planned slot from the previous week into the target week.
create or replace function public.copy_previous_week(p_household_id uuid, p_target_week_start date)
returns integer language plpgsql security definer set search_path=public as $$
declare src record; target_id uuid; copied integer:=0;
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;
  for src in
    select * from public.meal_plans
    where household_id=p_household_id
      and meal_date>=p_target_week_start-7
      and meal_date<p_target_week_start
    order by meal_date,meal_type
  loop
    insert into public.meal_plans(household_id,meal_date,meal_type,recipe_id,custom_title,cook_user_id,notes,created_by)
    values(p_household_id,src.meal_date+7,src.meal_type,src.recipe_id,src.custom_title,src.cook_user_id,src.notes,auth.uid())
    on conflict (household_id,meal_date,meal_type) do update set
      recipe_id=excluded.recipe_id, custom_title=excluded.custom_title, cook_user_id=excluded.cook_user_id,
      notes=excluded.notes, updated_at=now()
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

-- Add one recipe's ingredients to a week's shopping list and merge matching unchecked lines.
create or replace function public.add_recipe_to_shopping_list(p_household_id uuid,p_week_start date,p_recipe_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare ri record; touched integer:=0;
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;
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

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.invitations enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_favorites enable row level security;
alter table public.recipe_translations enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_participants enable row level security;
alter table public.meal_guests enable row level security;
alter table public.shopping_items enable row level security;
alter table public.member_preferences enable row level security;

-- Recreate policies idempotently
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname='public' AND tablename IN ('profiles','households','household_members','invitations','recipes','recipe_ingredients','recipe_favorites','recipe_translations','meal_plans','meal_participants','meal_guests','shopping_items','member_preferences','household_activity') LOOP
    EXECUTE format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

create policy profiles_select on public.profiles for select using (id=auth.uid() or exists(select 1 from public.household_members me join public.household_members them on them.household_id=me.household_id where me.user_id=auth.uid() and them.user_id=profiles.id));
create policy profiles_insert on public.profiles for insert with check (id=auth.uid());
create policy profiles_update on public.profiles for update using (id=auth.uid()) with check (id=auth.uid());

create policy households_select on public.households for select using (public.is_household_member(id));
create policy households_update on public.households for update using (public.is_household_admin(id));
create policy households_delete on public.households for delete using (public.is_household_admin(id));

create policy members_select on public.household_members for select using (public.is_household_member(household_id));
create policy members_update on public.household_members for update using (public.is_household_admin(household_id));
create policy members_delete on public.household_members for delete using (public.is_household_admin(household_id) or user_id=auth.uid());

create policy invitations_select on public.invitations for select using (public.is_household_admin(household_id));
create policy invitations_write on public.invitations for all using (public.is_household_admin(household_id)) with check (public.is_household_admin(household_id));

create policy recipes_select on public.recipes for select using (public.is_household_member(household_id));
create policy recipes_insert on public.recipes for insert with check (public.is_household_member(household_id) and created_by=auth.uid());
create policy recipes_update on public.recipes for update using (public.is_household_member(household_id));
create policy recipes_delete on public.recipes for delete using (public.is_household_member(household_id));

create policy ingredients_select on public.recipe_ingredients for select using (exists(select 1 from public.recipes r where r.id=recipe_id and public.is_household_member(r.household_id)));
create policy ingredients_insert on public.recipe_ingredients for insert with check (exists(select 1 from public.recipes r where r.id=recipe_id and public.is_household_member(r.household_id)));
create policy ingredients_update on public.recipe_ingredients for update using (exists(select 1 from public.recipes r where r.id=recipe_id and public.is_household_member(r.household_id)));
create policy ingredients_delete on public.recipe_ingredients for delete using (exists(select 1 from public.recipes r where r.id=recipe_id and public.is_household_member(r.household_id)));

create policy recipe_translations_select on public.recipe_translations for select using (
  exists(select 1 from public.recipes r where r.id=recipe_id and public.is_household_member(r.household_id))
);

create policy recipe_favorites_own on public.recipe_favorites for all to authenticated
using (user_id=auth.uid() and exists(select 1 from public.recipes r where r.id=recipe_id and public.is_household_member(r.household_id)))
with check (user_id=auth.uid() and exists(select 1 from public.recipes r where r.id=recipe_id and public.is_household_member(r.household_id)));

create policy meals_select on public.meal_plans for select using (public.is_household_member(household_id));
create policy meals_insert on public.meal_plans for insert with check (public.is_household_member(household_id) and created_by=auth.uid());
create policy meals_update on public.meal_plans for update using (public.is_household_member(household_id));
create policy meals_delete on public.meal_plans for delete using (public.is_household_member(household_id));

create policy participants_select on public.meal_participants for select using (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.is_household_member(m.household_id)));
create policy participants_insert on public.meal_participants for insert with check (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.is_household_member(m.household_id)));
create policy participants_update on public.meal_participants for update using (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.is_household_member(m.household_id)));
create policy participants_delete on public.meal_participants for delete using (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.is_household_member(m.household_id)));


create policy meal_guests_select on public.meal_guests for select using (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.is_household_member(m.household_id)));
create policy meal_guests_insert on public.meal_guests for insert with check (created_by=auth.uid() and exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.is_household_member(m.household_id)));
create policy meal_guests_update on public.meal_guests for update using (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.is_household_member(m.household_id))) with check (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.is_household_member(m.household_id)));
create policy meal_guests_delete on public.meal_guests for delete using (exists(select 1 from public.meal_plans m where m.id=meal_plan_id and public.is_household_member(m.household_id)));

create policy shopping_select on public.shopping_items for select using (public.is_household_member(household_id));
create policy shopping_insert on public.shopping_items for insert with check (public.is_household_member(household_id));
create policy shopping_update on public.shopping_items for update using (public.is_household_member(household_id));
create policy shopping_delete on public.shopping_items for delete using (public.is_household_member(household_id));

create policy preferences_select on public.member_preferences for select using (user_id=auth.uid() or exists(select 1 from public.household_members me join public.household_members them on them.household_id=me.household_id where me.user_id=auth.uid() and them.user_id=member_preferences.user_id));
create policy preferences_insert on public.member_preferences for insert with check (user_id=auth.uid());
create policy preferences_update on public.member_preferences for update using (user_id=auth.uid()) with check (user_id=auth.uid());

-- Realtime for the collaborative core
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='shopping_items') THEN
    alter publication supabase_realtime add table public.shopping_items;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='meal_plans') THEN
    alter publication supabase_realtime add table public.meal_plans;
  END IF;
END $$;


-- Restrict RPC execution to signed-in users.
revoke all on function public.copy_previous_week(uuid,date) from public;
revoke all on function public.add_recipe_to_shopping_list(uuid,date,uuid) from public;
revoke all on function public.create_household(text) from public;
revoke all on function public.create_household_invitation(uuid) from public;
revoke all on function public.join_household_by_code(text) from public;
revoke all on function public.create_recipe_with_ingredients(uuid,text,integer,integer,numeric,text[],text[],jsonb,text,text,text,text) from public;
revoke all on function public.set_meal_slot(uuid,date,text,uuid,text,text) from public;
revoke all on function public.rebuild_weekly_shopping_list(uuid,date) from public;
grant execute on function public.copy_previous_week(uuid,date) to authenticated;
grant execute on function public.add_recipe_to_shopping_list(uuid,date,uuid) to authenticated;
grant execute on function public.create_household(text) to authenticated;
grant execute on function public.create_household_invitation(uuid) to authenticated;
grant execute on function public.join_household_by_code(text) to authenticated;
grant execute on function public.create_recipe_with_ingredients(uuid,text,integer,integer,numeric,text[],text[],jsonb,text,text,text,text) to authenticated;
grant execute on function public.set_meal_slot(uuid,date,text,uuid,text,text) to authenticated;
grant execute on function public.rebuild_weekly_shopping_list(uuid,date) to authenticated;

-- V0.7 integrity: a cook and meal participant must belong to the same household.
create or replace function public.validate_meal_cook_membership()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.cook_user_id is not null and not exists(
    select 1 from public.household_members hm
    where hm.household_id=new.household_id and hm.user_id=new.cook_user_id
  ) then
    raise exception 'Cook must belong to household';
  end if;
  return new;
end; $$;

drop trigger if exists meal_plans_validate_cook on public.meal_plans;
create trigger meal_plans_validate_cook
before insert or update of cook_user_id, household_id on public.meal_plans
for each row execute function public.validate_meal_cook_membership();

create or replace function public.validate_meal_participant_membership()
returns trigger language plpgsql security definer set search_path=public as $$
declare hid uuid;
begin
  select household_id into hid from public.meal_plans where id=new.meal_plan_id;
  if hid is null or not exists(
    select 1 from public.household_members hm
    where hm.household_id=hid and hm.user_id=new.user_id
  ) then
    raise exception 'Participant must belong to household';
  end if;
  return new;
end; $$;

drop trigger if exists meal_participants_validate_member on public.meal_participants;
create trigger meal_participants_validate_member
before insert or update of meal_plan_id, user_id on public.meal_participants
for each row execute function public.validate_meal_participant_membership();

-- V0.20 — idées de repas collaboratives et votes
create table if not exists public.meal_ideas (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 120),
  recipe_id uuid references public.recipes(id) on delete set null,
  proposed_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.meal_idea_votes (
  idea_id uuid not null references public.meal_ideas(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id,user_id)
);
alter table public.meal_ideas enable row level security;
alter table public.meal_idea_votes enable row level security;

drop policy if exists meal_ideas_select on public.meal_ideas;
drop policy if exists meal_ideas_insert on public.meal_ideas;
drop policy if exists meal_ideas_update on public.meal_ideas;
drop policy if exists meal_ideas_delete on public.meal_ideas;
create policy meal_ideas_select on public.meal_ideas for select using (public.is_household_member(household_id));
create policy meal_ideas_insert on public.meal_ideas for insert with check (public.is_household_member(household_id) and proposed_by=auth.uid() and (recipe_id is null or exists(select 1 from public.recipes r where r.id=recipe_id and r.household_id=household_id)));
create policy meal_ideas_update on public.meal_ideas for update using (proposed_by=auth.uid() or public.is_household_admin(household_id)) with check (public.is_household_member(household_id));
create policy meal_ideas_delete on public.meal_ideas for delete using (proposed_by=auth.uid() or public.is_household_admin(household_id));

drop policy if exists meal_idea_votes_select on public.meal_idea_votes;
drop policy if exists meal_idea_votes_insert on public.meal_idea_votes;
drop policy if exists meal_idea_votes_delete on public.meal_idea_votes;
create policy meal_idea_votes_select on public.meal_idea_votes for select using (exists(select 1 from public.meal_ideas i where i.id=idea_id and public.is_household_member(i.household_id)));
create policy meal_idea_votes_insert on public.meal_idea_votes for insert with check (user_id=auth.uid() and exists(select 1 from public.meal_ideas i where i.id=idea_id and public.is_household_member(i.household_id)));
create policy meal_idea_votes_delete on public.meal_idea_votes for delete using (user_id=auth.uid());

-- V0.21 — portions par repas et quantités de courses ajustées
alter table public.meal_plans add column if not exists servings numeric(6,2);

-- Replace the previous six-argument helper so the client has a single canonical RPC.
drop function if exists public.set_meal_slot(uuid,date,text,uuid,text,text);
create or replace function public.set_meal_slot(
  p_household_id uuid,
  p_meal_date date,
  p_meal_type text,
  p_recipe_id uuid default null,
  p_custom_title text default null,
  p_notes text default null,
  p_servings numeric default null
)
returns uuid language plpgsql security definer set search_path=public as $$
declare mid uuid;
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;
  if p_meal_type not in ('breakfast','lunch','dinner','snack') then raise exception 'Invalid meal type'; end if;
  if p_recipe_id is null and nullif(trim(coalesce(p_custom_title,'')),'') is null then raise exception 'Recipe or title required'; end if;
  if p_recipe_id is not null and not exists(select 1 from public.recipes where id=p_recipe_id and household_id=p_household_id) then raise exception 'Recipe not in household'; end if;
  if p_servings is not null and (p_servings<1 or p_servings>20) then raise exception 'Servings out of range'; end if;
  insert into public.meal_plans(household_id,meal_date,meal_type,recipe_id,custom_title,notes,servings,created_by)
  values(p_household_id,p_meal_date,p_meal_type,p_recipe_id,nullif(trim(coalesce(p_custom_title,'')),''),nullif(trim(coalesce(p_notes,'')),''),p_servings,auth.uid())
  on conflict (household_id,meal_date,meal_type) do update set
    recipe_id=excluded.recipe_id,
    custom_title=excluded.custom_title,
    notes=excluded.notes,
    servings=excluded.servings,
    updated_at=now()
  returning id into mid;
  return mid;
end; $$;
revoke all on function public.set_meal_slot(uuid,date,text,uuid,text,text,numeric) from public;
grant execute on function public.set_meal_slot(uuid,date,text,uuid,text,text,numeric) to authenticated;

create or replace function public.rebuild_weekly_shopping_list(p_household_id uuid, p_week_start date)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;
  delete from public.shopping_items where household_id=p_household_id and week_start=p_week_start and source='meal_plan';
  insert into public.shopping_items(household_id,week_start,label,ingredient_key,quantity,unit,aisle,source,source_recipe_id,created_by)
  select p_household_id,p_week_start,min(ri.name),coalesce(nullif(min(ri.ingredient_key),''),lower(trim(min(ri.name)))),
    sum(case when ri.quantity is null then null else ri.quantity * (coalesce(mp.servings,r.portions)::numeric / nullif(r.portions,0)::numeric) end),
    ri.unit,ri.aisle,'meal_plan',min(r.id),auth.uid()
  from public.meal_plans mp
  join public.recipes r on r.id=mp.recipe_id
  join public.recipe_ingredients ri on ri.recipe_id=r.id
  where mp.household_id=p_household_id and mp.meal_date>=p_week_start and mp.meal_date<p_week_start+7
  group by coalesce(nullif(ri.ingredient_key,''),lower(trim(ri.name))),coalesce(ri.unit,''),ri.aisle;
end; $$;

create or replace function public.copy_previous_week(p_household_id uuid, p_target_week_start date)
returns integer language plpgsql security definer set search_path=public as $$
declare src record; target_id uuid; copied integer:=0;
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;
  for src in
    select * from public.meal_plans
    where household_id=p_household_id and meal_date>=p_target_week_start-7 and meal_date<p_target_week_start
    order by meal_date,meal_type
  loop
    insert into public.meal_plans(household_id,meal_date,meal_type,recipe_id,custom_title,cook_user_id,notes,servings,created_by)
    values(p_household_id,src.meal_date+7,src.meal_type,src.recipe_id,src.custom_title,src.cook_user_id,src.notes,src.servings,auth.uid())
    on conflict (household_id,meal_date,meal_type) do update set
      recipe_id=excluded.recipe_id, custom_title=excluded.custom_title, cook_user_id=excluded.cook_user_id,
      notes=excluded.notes, servings=excluded.servings, updated_at=now()
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


-- Private profile avatars. Object paths are always <user_id>/<file>.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('profile-avatars','profile-avatars',false,5242880,array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists profile_avatars_select on storage.objects;
drop policy if exists profile_avatars_insert on storage.objects;
drop policy if exists profile_avatars_delete on storage.objects;

create policy profile_avatars_select on storage.objects
for select to authenticated
using (
  bucket_id='profile-avatars'
  and (
    owner_id=(select auth.uid()::text)
    or exists(
      select 1
      from public.household_members me
      join public.household_members them on them.household_id=me.household_id
      where me.user_id=(select auth.uid())
        and them.user_id::text=(storage.foldername(name))[1]
    )
  )
);

create policy profile_avatars_insert on storage.objects
for insert to authenticated
with check (
  bucket_id='profile-avatars'
  and (storage.foldername(name))[1]=(select auth.uid()::text)
);

create policy profile_avatars_delete on storage.objects
for delete to authenticated
using (
  bucket_id='profile-avatars'
  and owner_id=(select auth.uid()::text)
  and (storage.foldername(name))[1]=(select auth.uid()::text)
);


-- Household activity: a lightweight collaboration history, not a chat.
create table if not exists public.household_activity (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in ('meal_updated','meal_deleted','shopping_checked','shopping_unchecked','recipe_added','meal_idea_added')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists household_activity_recent_idx on public.household_activity(household_id,created_at desc);
alter table public.household_activity enable row level security;
drop policy if exists household_activity_select on public.household_activity;
create policy household_activity_select on public.household_activity
for select to authenticated
using (public.is_household_member(household_id));

create or replace function public.log_household_activity()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  hid uuid;
  event_name text;
  payload jsonb;
begin
  if tg_table_name='meal_plans' then
    hid:=coalesce(new.household_id,old.household_id);
    if tg_op='DELETE' then
      event_name:='meal_deleted';
      payload:=jsonb_build_object('meal_date',old.meal_date,'meal_type',old.meal_type);
    else
      event_name:='meal_updated';
      payload:=jsonb_build_object('meal_date',new.meal_date,'meal_type',new.meal_type);
    end if;
  elsif tg_table_name='shopping_items' then
    if tg_op<>'UPDATE' or new.checked is not distinct from old.checked then return new; end if;
    hid:=new.household_id;
    event_name:=case when new.checked then 'shopping_checked' else 'shopping_unchecked' end;
    payload:=jsonb_build_object('label',new.label,'ingredient_key',new.ingredient_key,'week_start',new.week_start);
  elsif tg_table_name='recipes' then
    hid:=new.household_id;
    event_name:='recipe_added';
    payload:=jsonb_build_object('title',new.title);
  elsif tg_table_name='meal_ideas' then
    hid:=new.household_id;
    event_name:='meal_idea_added';
    payload:=jsonb_build_object('title',new.title);
  else
    return coalesce(new,old);
  end if;

  insert into public.household_activity(household_id,actor_user_id,event_type,details)
  values(hid,auth.uid(),event_name,payload);
  return coalesce(new,old);
end; $$;
revoke all on function public.log_household_activity() from public;

drop trigger if exists meal_plans_activity on public.meal_plans;
create trigger meal_plans_activity after insert or update or delete on public.meal_plans
for each row execute function public.log_household_activity();

drop trigger if exists shopping_items_activity on public.shopping_items;
create trigger shopping_items_activity after update of checked on public.shopping_items
for each row execute function public.log_household_activity();

drop trigger if exists recipes_activity on public.recipes;
create trigger recipes_activity after insert on public.recipes
for each row execute function public.log_household_activity();

drop trigger if exists meal_ideas_activity on public.meal_ideas;
create trigger meal_ideas_activity after insert on public.meal_ideas
for each row execute function public.log_household_activity();

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='household_activity') then
    alter publication supabase_realtime add table public.household_activity;
  end if;
end $$;


-- V0.32 — anti-gaspillage : planifier des restes sans racheter les ingrédients
alter table public.meal_plans add column if not exists meal_mode text not null default 'fresh';
alter table public.meal_plans add column if not exists leftover_from_meal_id uuid references public.meal_plans(id) on delete set null;
do $$ begin
  alter table public.meal_plans drop constraint if exists meal_plans_meal_mode_check;
  alter table public.meal_plans add constraint meal_plans_meal_mode_check check (meal_mode in ('fresh','leftover'));
  alter table public.meal_plans drop constraint if exists meal_plans_leftover_shape_check;
  alter table public.meal_plans add constraint meal_plans_leftover_shape_check check (
    (meal_mode='fresh' and leftover_from_meal_id is null)
    or (meal_mode='leftover' and recipe_id is null)
  );
exception when duplicate_object then null; end $$;
create index if not exists meal_plans_leftover_source_idx on public.meal_plans(leftover_from_meal_id);

drop function if exists public.set_meal_slot(uuid,date,text,uuid,text,text,numeric);
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
  p_leftover_from_meal_id uuid default null
)
returns uuid language plpgsql security definer set search_path=public as $$
declare mid uuid; source_meal public.meal_plans;
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;
  if p_meal_type not in ('breakfast','lunch','dinner','snack') then raise exception 'Invalid meal type'; end if;
  if p_meal_mode not in ('fresh','leftover') then raise exception 'Invalid meal mode'; end if;
  if p_servings is not null and (p_servings<1 or p_servings>20) then raise exception 'Servings out of range'; end if;

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

  insert into public.meal_plans(household_id,meal_date,meal_type,recipe_id,custom_title,notes,servings,meal_mode,leftover_from_meal_id,created_by)
  values(p_household_id,p_meal_date,p_meal_type,p_recipe_id,nullif(trim(coalesce(p_custom_title,'')),''),nullif(trim(coalesce(p_notes,'')),''),p_servings,p_meal_mode,p_leftover_from_meal_id,auth.uid())
  on conflict (household_id,meal_date,meal_type) do update set
    recipe_id=excluded.recipe_id,
    custom_title=excluded.custom_title,
    notes=excluded.notes,
    servings=excluded.servings,
    meal_mode=excluded.meal_mode,
    leftover_from_meal_id=excluded.leftover_from_meal_id,
    updated_at=now()
  returning id into mid;
  return mid;
end; $$;
revoke all on function public.set_meal_slot(uuid,date,text,uuid,text,text,numeric,text,uuid) from public;
grant execute on function public.set_meal_slot(uuid,date,text,uuid,text,text,numeric,text,uuid) to authenticated;

-- Copied leftover placeholders stay leftovers but deliberately drop the old source pointer.
-- This avoids claiming that next week's leftovers came from a meal cooked seven days earlier.
create or replace function public.copy_previous_week(p_household_id uuid, p_target_week_start date)
returns integer language plpgsql security definer set search_path=public as $$
declare src record; target_id uuid; copied integer:=0;
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;
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

-- V0.33 — shared household pantry. This is a household-owned inventory, not a recipe catalog.
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 120),
  ingredient_key text not null,
  quantity numeric(12,3) check (quantity is null or quantity >= 0),
  unit text,
  aisle text not null default 'other' check (aisle in ('produce','fresh','meat_fish','pantry','frozen','drinks','other')),
  updated_by uuid references auth.users(id) on delete set null,
  expires_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pantry_items add column if not exists expires_on date;
create index if not exists pantry_household_expiry_idx on public.pantry_items(household_id,expires_on) where expires_on is not null;
create index if not exists pantry_household_key_idx on public.pantry_items(household_id,ingredient_key);
create unique index if not exists pantry_household_key_unit_unique on public.pantry_items(household_id,ingredient_key,coalesce(unit,''));
alter table public.pantry_items enable row level security;

do $$ begin
  drop policy if exists pantry_select on public.pantry_items;
  drop policy if exists pantry_insert on public.pantry_items;
  drop policy if exists pantry_update on public.pantry_items;
  drop policy if exists pantry_delete on public.pantry_items;
exception when undefined_object then null; end $$;
create policy pantry_select on public.pantry_items for select using (public.is_household_member(household_id));
create policy pantry_insert on public.pantry_items for insert with check (public.is_household_member(household_id));
create policy pantry_update on public.pantry_items for update using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
create policy pantry_delete on public.pantry_items for delete using (public.is_household_member(household_id));

drop function if exists public.upsert_pantry_item(uuid,text,text,numeric,text,text);
drop function if exists public.upsert_pantry_item(uuid,text,text,numeric,text,text,date);
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

-- Rebuild only the meal-plan-generated portion of the weekly list.
-- Pantry quantities are subtracted only when units match. A pantry item without
-- a quantity is an explicit household marker that the ingredient is already in stock.
create or replace function public.rebuild_weekly_shopping_list(p_household_id uuid, p_week_start date)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_household_member(p_household_id) then raise exception 'Household access denied'; end if;
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

-- V0.35 — household presence / absences used to size meals correctly.
create table if not exists public.member_absences (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  absence_date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
-- Upgrade safety for a database that already ran the V0.35 all-day model.
alter table public.member_absences add column if not exists meal_type text;
drop index if exists public.member_absences_household_user_date_unique;
insert into public.member_absences(household_id,user_id,absence_date,meal_type,created_by,created_at)
select m.household_id,m.user_id,m.absence_date,v.meal_type,m.created_by,m.created_at
from public.member_absences m
cross join (values ('lunch'),('dinner'),('snack')) as v(meal_type)
where m.meal_type is null;
update public.member_absences set meal_type='breakfast' where meal_type is null;
alter table public.member_absences alter column meal_type set not null;
alter table public.member_absences drop constraint if exists member_absences_meal_type_check;
alter table public.member_absences add constraint member_absences_meal_type_check check (meal_type in ('breakfast','lunch','dinner','snack'));
create unique index if not exists member_absences_household_user_date_meal_unique on public.member_absences(household_id,user_id,absence_date,meal_type);
create index if not exists member_absences_household_date_idx on public.member_absences(household_id,absence_date);
alter table public.member_absences enable row level security;

drop policy if exists member_absences_select on public.member_absences;
drop policy if exists member_absences_insert on public.member_absences;
drop policy if exists member_absences_update on public.member_absences;
drop policy if exists member_absences_delete on public.member_absences;
create policy member_absences_select on public.member_absences for select
  using (public.is_household_member(household_id));
create policy member_absences_insert on public.member_absences for insert
  with check (
    public.is_household_member(household_id)
    and created_by=auth.uid()
    and exists(select 1 from public.household_members hm where hm.household_id=member_absences.household_id and hm.user_id=member_absences.user_id)
  );
create policy member_absences_update on public.member_absences for update
  using (public.is_household_member(household_id))
  with check (
    public.is_household_member(household_id)
    and exists(select 1 from public.household_members hm where hm.household_id=member_absences.household_id and hm.user_id=member_absences.user_id)
  );
create policy member_absences_delete on public.member_absences for delete
  using (public.is_household_member(household_id));

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='member_absences') then
    alter publication supabase_realtime add table public.member_absences;
  end if;
end $$;


-- V0.41 — optional weekly shopping responsibility. A member claims it only when known;
-- nobody is assigned automatically and any household member can hand it over/release it.
create table if not exists public.shopping_responsibilities (
  household_id uuid not null references public.households(id) on delete cascade,
  week_start date not null,
  assigned_user_id uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (household_id,week_start)
);
create index if not exists shopping_responsibilities_household_week_idx on public.shopping_responsibilities(household_id,week_start);
alter table public.shopping_responsibilities enable row level security;

drop policy if exists shopping_responsibilities_select on public.shopping_responsibilities;
drop policy if exists shopping_responsibilities_insert on public.shopping_responsibilities;
drop policy if exists shopping_responsibilities_update on public.shopping_responsibilities;
drop policy if exists shopping_responsibilities_delete on public.shopping_responsibilities;
create policy shopping_responsibilities_select on public.shopping_responsibilities for select
  using (public.is_household_member(household_id));
create policy shopping_responsibilities_insert on public.shopping_responsibilities for insert
  with check (
    public.is_household_member(household_id)
    and updated_by=auth.uid()
    and (assigned_user_id is null or exists(select 1 from public.household_members hm where hm.household_id=shopping_responsibilities.household_id and hm.user_id=shopping_responsibilities.assigned_user_id))
  );
create policy shopping_responsibilities_update on public.shopping_responsibilities for update
  using (public.is_household_member(household_id))
  with check (
    public.is_household_member(household_id)
    and updated_by=auth.uid()
    and (assigned_user_id is null or exists(select 1 from public.household_members hm where hm.household_id=shopping_responsibilities.household_id and hm.user_id=shopping_responsibilities.assigned_user_id))
  );
create policy shopping_responsibilities_delete on public.shopping_responsibilities for delete
  using (public.is_household_member(household_id));

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='shopping_responsibilities') then
    alter publication supabase_realtime add table public.shopping_responsibilities;
  end if;
end $$;

-- V0.42 — private household taste memory for recipes.
-- Each member controls only their own reaction; the household can read the aggregate.
create table if not exists public.recipe_feedback (
  household_id uuid not null references public.households(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('again','ok','skip')),
  updated_at timestamptz not null default now(),
  primary key (recipe_id,user_id)
);
create index if not exists recipe_feedback_household_idx on public.recipe_feedback(household_id);
alter table public.recipe_feedback enable row level security;

drop policy if exists recipe_feedback_select on public.recipe_feedback;
drop policy if exists recipe_feedback_insert on public.recipe_feedback;
drop policy if exists recipe_feedback_update on public.recipe_feedback;
drop policy if exists recipe_feedback_delete on public.recipe_feedback;
create policy recipe_feedback_select on public.recipe_feedback for select
  using (public.is_household_member(household_id));
create policy recipe_feedback_insert on public.recipe_feedback for insert
  with check (
    user_id=auth.uid()
    and public.is_household_member(household_id)
    and exists(select 1 from public.recipes r where r.id=recipe_feedback.recipe_id and r.household_id=recipe_feedback.household_id)
  );
create policy recipe_feedback_update on public.recipe_feedback for update
  using (user_id=auth.uid() and public.is_household_member(household_id))
  with check (
    user_id=auth.uid()
    and public.is_household_member(household_id)
    and exists(select 1 from public.recipes r where r.id=recipe_feedback.recipe_id and r.household_id=recipe_feedback.household_id)
  );
create policy recipe_feedback_delete on public.recipe_feedback for delete
  using (user_id=auth.uid() and public.is_household_member(household_id));

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='recipe_feedback') then
    alter publication supabase_realtime add table public.recipe_feedback;
  end if;
end $$;
