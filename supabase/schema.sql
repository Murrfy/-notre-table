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
  setup_completed boolean not null default true,
  default_party_size smallint check (default_party_size is null or default_party_size between 1 and 20),
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

-- Rebuild only the meal-plan-generated portion of the weekly list.
-- Pantry quantities are subtracted only when units match. A pantry item without
-- a quantity is an explicit household marker that the ingredient is already in stock.
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

-- V0.65 — keep every active household with at least one administrator.
create or replace function public.prevent_last_household_admin_loss()
returns trigger
language plpgsql
security definer
set search_path=public as $$
declare
  admin_count integer;
begin
  if tg_op='DELETE' and not exists(
    select 1 from public.households h where h.id=old.household_id
  ) then
    return old;
  end if;

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


-- V0.84 — serialize invitation creation per household so concurrent admins/devices reuse one live code.
create or replace function public.create_household_invitation(p_household_id uuid)
returns text language plpgsql security definer set search_path=public as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  i int;
  attempts int := 0;
begin
  if not public.is_household_admin(p_household_id) then raise exception 'Admin required'; end if;

  -- Lock the stable parent row for the duration of this transaction. Concurrent invitation
  -- requests for the same household serialize here; the waiter then observes the first live code.
  perform 1 from public.households where id=p_household_id for update;
  if not found then raise exception 'Household not found'; end if;

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
-- V0.93 — make permanent account deletion compatible with shared households.
-- Personal authored content is removed before auth.users deletion; a shared household survives
-- without falsely attributing ownership to another account.

alter table public.households
  alter column created_by drop not null;

alter table public.households
  drop constraint if exists households_created_by_fkey;

alter table public.households
  add constraint households_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

create or replace function public.prepare_account_deletion(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_household_id uuid;
  v_role text;
  v_other_members integer := 0;
  v_promoted_user_id uuid;
  v_household_deleted boolean := false;
  v_recipe_ids uuid[] := '{}'::uuid[];
begin
  if p_user_id is null then
    raise exception 'ACCOUNT_DELETION_USER_REQUIRED';
  end if;

  -- One household per user is a schema invariant. Lock the membership and parent household
  -- so account deletion cannot race with invitation/admin changes.
  select hm.household_id,hm.role
    into v_household_id,v_role
  from public.household_members hm
  where hm.user_id=p_user_id
  for update;

  if v_household_id is not null then
    perform 1 from public.households h where h.id=v_household_id for update;

    select count(*) into v_other_members
    from public.household_members hm
    where hm.household_id=v_household_id and hm.user_id<>p_user_id;

    if v_other_members=0 then
      -- A one-person household has no shared continuity requirement. Deleting the parent
      -- removes all household-owned data and the last-admin trigger explicitly permits the cascade.
      delete from public.households where id=v_household_id;
      v_household_deleted:=true;
    else
      -- If the deleting account is the last admin, keep the shared household usable by promoting
      -- the longest-standing remaining member. This is deterministic and happens only for deletion.
      if v_role='admin' and not exists(
        select 1 from public.household_members hm
        where hm.household_id=v_household_id and hm.user_id<>p_user_id and hm.role='admin'
      ) then
        select hm.user_id into v_promoted_user_id
        from public.household_members hm
        where hm.household_id=v_household_id and hm.user_id<>p_user_id
        order by hm.joined_at asc,hm.user_id asc
        limit 1
        for update;

        update public.household_members
        set role='admin'
        where household_id=v_household_id and user_id=v_promoted_user_id;
      end if;

      -- Remove membership explicitly after another admin exists. Personal profile/preferences,
      -- votes, reactions, attendance rows and remaining auth references are removed/nullified by
      -- their FK actions when auth.admin.deleteUser performs the final permanent Auth deletion.
      delete from public.household_members
      where household_id=v_household_id and user_id=p_user_id;
    end if;
  end if;

  -- A member can leave a household before later deleting the account, so authored-content cleanup
  -- must not depend on a current membership row.
  select coalesce(array_agg(r.id),'{}'::uuid[]) into v_recipe_ids
  from public.recipes r
  where r.created_by=p_user_id;

  -- Remove user-authored/shared content before the Auth row is deleted. Meal slots and
  -- shopping lines derived from a deleted recipe are removed as well so recipe text is not
  -- retained indirectly and the meal_plans recipe/title integrity constraint cannot block deletion.
  delete from public.shopping_items si
  where si.created_by=p_user_id
     or (cardinality(v_recipe_ids)>0 and si.source_recipe_id=any(v_recipe_ids));

  delete from public.meal_plans mp
  where mp.created_by=p_user_id
     or (cardinality(v_recipe_ids)>0 and mp.recipe_id=any(v_recipe_ids));

  delete from public.meal_ideas mi where mi.proposed_by=p_user_id;
  delete from public.household_activity ha where ha.actor_user_id=p_user_id;
  delete from public.member_absences ma where ma.created_by=p_user_id;
  delete from public.meal_guests mg where mg.created_by=p_user_id;
  delete from public.invitations i where i.created_by=p_user_id;
  delete from public.recipes r where r.created_by=p_user_id;

  return jsonb_build_object(
    'household_id',v_household_id,
    'household_deleted',v_household_deleted,
    'promoted_user_id',v_promoted_user_id
  );
end;
$$;

revoke all on function public.prepare_account_deletion(uuid) from public;
revoke all on function public.prepare_account_deletion(uuid) from anon;
revoke all on function public.prepare_account_deletion(uuid) from authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
-- V0.103 — subscription access belongs to the household, not to one device/user cache.
-- RevenueCat still identifies the purchasing Auth user; only trusted server code may write
-- the household entitlement mirror consumed by every member of that household.

create table if not exists public.household_access (
  household_id uuid primary key references public.households(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','family')),
  payer_user_id uuid references auth.users(id) on delete set null,
  entitlement_id text,
  expires_at timestamptz,
  last_verified_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint household_access_family_entitlement_check check (plan <> 'family' or entitlement_id is not null)
);

alter table public.household_access enable row level security;

drop policy if exists household_access_select on public.household_access;
create policy household_access_select on public.household_access
for select using (public.is_household_member(household_id));

-- Authenticated clients can read the household status through RLS, but never forge billing state.
revoke insert, update, delete on table public.household_access from anon, authenticated;
grant select on table public.household_access to authenticated;

create or replace function public.prepare_account_deletion(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_household_id uuid;
  v_role text;
  v_other_members integer := 0;
  v_promoted_user_id uuid;
  v_household_deleted boolean := false;
  v_recipe_ids uuid[] := '{}'::uuid[];
begin
  if p_user_id is null then
    raise exception 'ACCOUNT_DELETION_USER_REQUIRED';
  end if;

  -- One household per user is a schema invariant. Lock the membership and parent household
  -- so account deletion cannot race with invitation/admin changes.
  select hm.household_id,hm.role
    into v_household_id,v_role
  from public.household_members hm
  where hm.user_id=p_user_id
  for update;

  if v_household_id is not null then
    perform 1 from public.households h where h.id=v_household_id for update;

    select count(*) into v_other_members
    from public.household_members hm
    where hm.household_id=v_household_id and hm.user_id<>p_user_id;

    if v_other_members=0 then
      -- A one-person household has no shared continuity requirement. Deleting the parent
      -- removes all household-owned data, including household_access, by cascade.
      delete from public.households where id=v_household_id;
      v_household_deleted:=true;
    else
      -- If the deleting account is the last admin, keep the shared household usable by promoting
      -- the longest-standing remaining member. This is deterministic and happens only for deletion.
      if v_role='admin' and not exists(
        select 1 from public.household_members hm
        where hm.household_id=v_household_id and hm.user_id<>p_user_id and hm.role='admin'
      ) then
        select hm.user_id into v_promoted_user_id
        from public.household_members hm
        where hm.household_id=v_household_id and hm.user_id<>p_user_id
        order by hm.joined_at asc,hm.user_id asc
        limit 1
        for update;

        update public.household_members
        set role='admin'
        where household_id=v_household_id and user_id=v_promoted_user_id;
      end if;

      -- If the deleting user was the RevenueCat payer, detach that identity. The household may
      -- keep a previously verified paid period only until its known Store expiry. A missing or
      -- already-expired end date fails closed to free access.
      update public.household_access
      set payer_user_id=null,
          plan=case when plan='family' and expires_at is not null and expires_at>now() then 'family' else 'free' end,
          updated_at=now()
      where household_id=v_household_id and payer_user_id=p_user_id;

      -- Remove membership explicitly after another admin exists. Personal profile/preferences,
      -- votes, reactions, attendance rows and remaining auth references are removed/nullified by
      -- their FK actions when auth.admin.deleteUser performs the final permanent Auth deletion.
      delete from public.household_members
      where household_id=v_household_id and user_id=p_user_id;
    end if;
  end if;

  -- A member can leave a household before later deleting the account, so authored-content cleanup
  -- must not depend on a current membership row.
  select coalesce(array_agg(r.id),'{}'::uuid[]) into v_recipe_ids
  from public.recipes r
  where r.created_by=p_user_id;

  -- Remove user-authored/shared content before the Auth row is deleted. Meal slots and
  -- shopping lines derived from a deleted recipe are removed as well so recipe text is not
  -- retained indirectly and the meal_plans recipe/title integrity constraint cannot block deletion.
  delete from public.shopping_items si
  where si.created_by=p_user_id
     or (cardinality(v_recipe_ids)>0 and si.source_recipe_id=any(v_recipe_ids));

  delete from public.meal_plans mp
  where mp.created_by=p_user_id
     or (cardinality(v_recipe_ids)>0 and mp.recipe_id=any(v_recipe_ids));

  delete from public.meal_ideas mi where mi.proposed_by=p_user_id;
  delete from public.household_activity ha where ha.actor_user_id=p_user_id;
  delete from public.member_absences ma where ma.created_by=p_user_id;
  delete from public.meal_guests mg where mg.created_by=p_user_id;
  delete from public.invitations i where i.created_by=p_user_id;
  delete from public.recipes r where r.created_by=p_user_id;

  return jsonb_build_object(
    'household_id',v_household_id,
    'household_deleted',v_household_deleted,
    'promoted_user_id',v_promoted_user_id
  );
end;
$$;

revoke all on function public.prepare_account_deletion(uuid) from public;
revoke all on function public.prepare_account_deletion(uuid) from anon;
revoke all on function public.prepare_account_deletion(uuid) from authenticated;
grant execute on function public.prepare_account_deletion(uuid) to service_role;
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

-- V0.111 — lightweight household members and secure one-click/two-click meal responses.
-- The native organizer stays authenticated. Lightweight members answer through a public
-- Edge Function using an opaque one-time token; no account or app installation is required.

create table if not exists public.light_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 60),
  phone_number text not null check (char_length(trim(phone_number)) between 6 and 32),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists light_members_household_idx on public.light_members(household_id,active,created_at);

create table if not exists public.light_meal_questions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  meal_date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  desire_options text[] not null default '{}',
  expires_at timestamptz not null,
  closed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint light_meal_questions_desires_check check (
    desire_options <@ array['home','pizza','pasta','sushi','chinese','surprise']::text[]
    and cardinality(desire_options)<=6
  )
);
create unique index if not exists light_meal_questions_one_slot_idx on public.light_meal_questions(household_id,meal_date,meal_type);
create index if not exists light_meal_questions_household_date_idx on public.light_meal_questions(household_id,meal_date);

create table if not exists public.light_response_tokens (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.light_meal_questions(id) on delete cascade,
  light_member_id uuid not null references public.light_members(id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash)=64),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  issued_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(question_id,light_member_id)
);
create index if not exists light_response_tokens_expiry_idx on public.light_response_tokens(expires_at) where consumed_at is null;

create table if not exists public.light_meal_responses (
  question_id uuid not null references public.light_meal_questions(id) on delete cascade,
  light_member_id uuid not null references public.light_members(id) on delete cascade,
  presence text not null check (presence in ('yes','no','maybe','take_charge')),
  desire text check (desire is null or desire in ('home','pizza','pasta','sushi','chinese','surprise')),
  responded_at timestamptz not null default now(),
  primary key(question_id,light_member_id)
);
create index if not exists light_meal_responses_question_idx on public.light_meal_responses(question_id,responded_at);

alter table public.light_members enable row level security;
alter table public.light_meal_questions enable row level security;
alter table public.light_response_tokens enable row level security;
alter table public.light_meal_responses enable row level security;

drop policy if exists light_members_select on public.light_members;
create policy light_members_select on public.light_members for select
using (public.is_household_admin(household_id));

drop policy if exists light_meal_questions_select on public.light_meal_questions;
create policy light_meal_questions_select on public.light_meal_questions for select
using (public.is_household_member(household_id));

drop policy if exists light_response_tokens_select on public.light_response_tokens;
create policy light_response_tokens_select on public.light_response_tokens for select
using (exists(
  select 1 from public.light_meal_questions q
  where q.id=question_id and public.is_household_admin(q.household_id)
));

drop policy if exists light_meal_responses_select on public.light_meal_responses;
create policy light_meal_responses_select on public.light_meal_responses for select
using (exists(
  select 1 from public.light_meal_questions q
  where q.id=question_id and public.is_household_member(q.household_id)
));

-- All writes go through controlled functions. Token hashes are never readable by mobile clients.
revoke all on table public.light_members from anon, authenticated;
revoke all on table public.light_meal_questions from anon, authenticated;
revoke all on table public.light_response_tokens from anon, authenticated;
revoke all on table public.light_meal_responses from anon, authenticated;
grant select on table public.light_members to authenticated;
grant select on table public.light_meal_questions to authenticated;
grant select on table public.light_meal_responses to authenticated;

create or replace function public.create_light_member(
  p_household_id uuid,
  p_display_name text,
  p_phone_number text
)
returns uuid
language plpgsql
security definer
set search_path=public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if not public.family_feature_allowed(p_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 1 and 60 then raise exception 'INVALID_MEMBER_NAME'; end if;
  if char_length(trim(coalesce(p_phone_number,''))) not between 6 and 32 then raise exception 'INVALID_PHONE_NUMBER'; end if;

  insert into public.light_members(household_id,display_name,phone_number,created_by)
  values(p_household_id,trim(p_display_name),trim(p_phone_number),auth.uid())
  returning id into v_id;
  return v_id;
end; $$;

create or replace function public.upsert_light_meal_question(
  p_household_id uuid,
  p_meal_date date,
  p_meal_type text,
  p_desire_options text[],
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path=public as $$
declare
  v_id uuid;
  v_options text[];
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if not public.family_feature_allowed(p_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if p_meal_date is null then raise exception 'MEAL_DATE_REQUIRED'; end if;
  if p_meal_type not in ('breakfast','lunch','dinner','snack') then raise exception 'INVALID_MEAL_TYPE'; end if;
  if p_expires_at is null or p_expires_at<=now() then raise exception 'QUESTION_EXPIRY_REQUIRED'; end if;

  select coalesce(array_agg(option order by ordinal),'{}'::text[]) into v_options
  from (
    select option,min(ordinal) as ordinal
    from unnest(coalesce(p_desire_options,'{}'::text[])) with ordinality as x(option,ordinal)
    where option in ('home','pizza','pasta','sushi','chinese','surprise')
    group by option
  ) s;
  if cardinality(v_options)<>cardinality(coalesce(p_desire_options,'{}'::text[])) then
    raise exception 'INVALID_DESIRE_OPTIONS';
  end if;

  insert into public.light_meal_questions(household_id,meal_date,meal_type,desire_options,expires_at,created_by)
  values(p_household_id,p_meal_date,p_meal_type,v_options,p_expires_at,auth.uid())
  on conflict (household_id,meal_date,meal_type) do update
    set desire_options=excluded.desire_options,
        expires_at=excluded.expires_at,
        closed_at=null,
        updated_at=now()
  returning id into v_id;

  -- Changing/reopening a question invalidates both earlier links and earlier answers.
  -- This prevents a response from retaining a desire option the organizer has just removed.
  delete from public.light_response_tokens where question_id=v_id;
  delete from public.light_meal_responses where question_id=v_id;
  return v_id;
end; $$;

create or replace function public.issue_light_response_token(
  p_question_id uuid,
  p_light_member_id uuid
)
returns text
language plpgsql
security definer
set search_path=public as $$
declare
  v_question public.light_meal_questions;
  v_member public.light_members;
  v_token text;
  v_hash text;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select * into v_question from public.light_meal_questions where id=p_question_id for update;
  if v_question.id is null then raise exception 'QUESTION_NOT_FOUND'; end if;
  if not public.is_household_admin(v_question.household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if not public.family_feature_allowed(v_question.household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if v_question.closed_at is not null or v_question.expires_at<=now() then raise exception 'QUESTION_CLOSED'; end if;

  select * into v_member from public.light_members where id=p_light_member_id and household_id=v_question.household_id and active=true;
  if v_member.id is null then raise exception 'LIGHT_MEMBER_NOT_FOUND'; end if;

  v_token:=encode(gen_random_bytes(32),'hex');
  v_hash:=encode(digest(v_token,'sha256'),'hex');

  insert into public.light_response_tokens(question_id,light_member_id,token_hash,expires_at,consumed_at,issued_by)
  values(v_question.id,v_member.id,v_hash,v_question.expires_at,null,auth.uid())
  on conflict (question_id,light_member_id) do update
    set token_hash=excluded.token_hash,
        expires_at=excluded.expires_at,
        consumed_at=null,
        issued_by=excluded.issued_by,
        created_at=now();

  return v_token;
end; $$;

create or replace function public.get_light_response_context(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_hash text;
  v_row record;
begin
  if p_token is null or char_length(p_token)<>64 then return null; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');

  select m.display_name,h.name as household_name,q.meal_date,q.meal_type,q.desire_options,
         least(q.expires_at,t.expires_at) as expires_at,
         (select m2.display_name
            from public.light_meal_responses r2
            join public.light_members m2 on m2.id=r2.light_member_id
           where r2.question_id=q.id and r2.presence='take_charge'
           order by r2.responded_at asc limit 1) as take_charge_name
    into v_row
  from public.light_response_tokens t
  join public.light_meal_questions q on q.id=t.question_id
  join public.light_members m on m.id=t.light_member_id and m.household_id=q.household_id
  join public.households h on h.id=q.household_id
  where t.token_hash=v_hash
    and t.consumed_at is null
    and t.expires_at>now()
    and q.closed_at is null
    and q.expires_at>now()
    and m.active=true
  limit 1;

  if not found then return null; end if;
  return jsonb_build_object(
    'member_name',v_row.display_name,
    'household_name',v_row.household_name,
    'meal_date',v_row.meal_date,
    'meal_type',v_row.meal_type,
    'desire_options',v_row.desire_options,
    'expires_at',v_row.expires_at,
    'take_charge_name',v_row.take_charge_name
  );
end; $$;

create or replace function public.submit_light_response(
  p_token text,
  p_presence text,
  p_desire text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_hash text;
  v_token_row public.light_response_tokens;
  v_question public.light_meal_questions;
  v_member public.light_members;
  v_desire text;
  v_take_charge_member uuid;
begin
  if p_token is null or char_length(p_token)<>64 then raise exception 'TOKEN_INVALID_OR_USED'; end if;
  if p_presence not in ('yes','no','maybe','take_charge') then raise exception 'INVALID_PRESENCE'; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');

  select * into v_token_row
  from public.light_response_tokens
  where token_hash=v_hash
  for update;

  if v_token_row.id is null or v_token_row.consumed_at is not null or v_token_row.expires_at<=now() then
    raise exception 'TOKEN_INVALID_OR_USED';
  end if;

  -- Serialize the question so only one member can take charge under concurrent clicks.
  select * into v_question from public.light_meal_questions where id=v_token_row.question_id for update;
  select * into v_member from public.light_members where id=v_token_row.light_member_id;
  if v_question.id is null or v_member.id is null or not v_member.active
     or v_question.closed_at is not null or v_question.expires_at<=now()
     or v_member.household_id<>v_question.household_id then
    raise exception 'TOKEN_INVALID_OR_USED';
  end if;

  select r.light_member_id into v_take_charge_member
  from public.light_meal_responses r
  where r.question_id=v_question.id and r.presence='take_charge'
  order by r.responded_at asc limit 1;
  if found then raise exception 'QUESTION_TAKEN_OVER'; end if;

  v_desire:=nullif(trim(coalesce(p_desire,'')),'');
  if p_presence in ('no','take_charge') then
    v_desire:=null;
  elsif v_desire is not null and not (v_desire=any(v_question.desire_options)) then
    raise exception 'DESIRE_NOT_OFFERED';
  end if;

  insert into public.light_meal_responses(question_id,light_member_id,presence,desire,responded_at)
  values(v_question.id,v_member.id,p_presence,v_desire,now())
  on conflict (question_id,light_member_id) do update
    set presence=excluded.presence,desire=excluded.desire,responded_at=excluded.responded_at;

  update public.light_response_tokens set consumed_at=now() where id=v_token_row.id;

  return jsonb_build_object('ok',true,'presence',p_presence,'desire',v_desire);
end; $$;

create or replace function public.get_light_meal_summary(p_question_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_household_id uuid;
  v_take_charge_name text;
  v_total integer;
  v_yes integer;
  v_no integer;
  v_maybe integer;
  v_take integer;
  v_home integer;
  v_pizza integer;
  v_pasta integer;
  v_sushi integer;
  v_chinese integer;
  v_surprise integer;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select household_id into v_household_id from public.light_meal_questions where id=p_question_id;
  if v_household_id is null then raise exception 'QUESTION_NOT_FOUND'; end if;
  if not public.is_household_admin(v_household_id) then raise exception 'ADMIN_REQUIRED'; end if;

  select count(*),
         count(*) filter(where presence='yes'),
         count(*) filter(where presence='no'),
         count(*) filter(where presence='maybe'),
         count(*) filter(where presence='take_charge'),
         count(*) filter(where desire='home'),
         count(*) filter(where desire='pizza'),
         count(*) filter(where desire='pasta'),
         count(*) filter(where desire='sushi'),
         count(*) filter(where desire='chinese'),
         count(*) filter(where desire='surprise')
    into v_total,v_yes,v_no,v_maybe,v_take,v_home,v_pizza,v_pasta,v_sushi,v_chinese,v_surprise
  from public.light_meal_responses where question_id=p_question_id;

  select m.display_name into v_take_charge_name
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=p_question_id and r.presence='take_charge'
  order by r.responded_at asc limit 1;

  return jsonb_build_object(
    'total',v_total,
    'presence',jsonb_build_object('yes',v_yes,'no',v_no,'maybe',v_maybe,'take_charge',v_take),
    'desires',jsonb_build_object('home',v_home,'pizza',v_pizza,'pasta',v_pasta,'sushi',v_sushi,'chinese',v_chinese,'surprise',v_surprise),
    'take_charge_name',v_take_charge_name
  );
end; $$;

revoke all on function public.create_light_member(uuid,text,text) from public;
revoke all on function public.upsert_light_meal_question(uuid,date,text,text[],timestamptz) from public;
revoke all on function public.issue_light_response_token(uuid,uuid) from public;
revoke all on function public.get_light_meal_summary(uuid) from public;
grant execute on function public.create_light_member(uuid,text,text) to authenticated;
grant execute on function public.upsert_light_meal_question(uuid,date,text,text[],timestamptz) to authenticated;
grant execute on function public.issue_light_response_token(uuid,uuid) to authenticated;
grant execute on function public.get_light_meal_summary(uuid) to authenticated;

revoke all on function public.get_light_response_context(text) from public;
revoke all on function public.get_light_response_context(text) from anon;
revoke all on function public.get_light_response_context(text) from authenticated;
grant execute on function public.get_light_response_context(text) to service_role;

revoke all on function public.submit_light_response(text,text,text) from public;
revoke all on function public.submit_light_response(text,text,text) from anon;
revoke all on function public.submit_light_response(text,text,text) from authenticated;
grant execute on function public.submit_light_response(text,text,text) to service_role;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='light_meal_responses'
  ) then
    alter publication supabase_realtime add table public.light_meal_responses;
  end if;
end $$;
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

-- V0.159 — server-side lifetime budget for pre-subscription LIA discovery.
-- Cloud discovery is available only after authentication. The pre-auth LIA introduction
-- remains local/scripted, so anonymous downloads do not require paid AI calls.

create table if not exists public.lia_discovery_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  spent_microusd bigint not null default 0 check (spent_microusd >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.lia_discovery_charges (
  request_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_microusd bigint not null check (requested_microusd > 0),
  approved boolean not null,
  charged_microusd bigint not null check (charged_microusd >= 0),
  created_at timestamptz not null default now()
);

create index if not exists lia_discovery_charges_user_created_idx
  on public.lia_discovery_charges(user_id,created_at desc);

alter table public.lia_discovery_usage enable row level security;
alter table public.lia_discovery_charges enable row level security;

revoke all on table public.lia_discovery_usage from public, anon, authenticated;
revoke all on table public.lia_discovery_charges from public, anon, authenticated;

create or replace function public.reserve_lia_discovery_budget(
  p_user_id uuid,
  p_request_id uuid,
  p_requested_microusd bigint
)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_limit constant bigint := 50000;
  v_spent bigint;
  v_existing public.lia_discovery_charges%rowtype;
  v_approved boolean;
  v_charged bigint;
begin
  if p_user_id is null or p_request_id is null then
    raise exception 'INVALID_DISCOVERY_REQUEST';
  end if;
  if p_requested_microusd is null or p_requested_microusd <= 0 or p_requested_microusd > v_limit then
    raise exception 'INVALID_DISCOVERY_COST';
  end if;

  select * into v_existing
    from public.lia_discovery_charges
   where request_id=p_request_id;

  if found then
    if v_existing.user_id<>p_user_id or v_existing.requested_microusd<>p_requested_microusd then
      raise exception 'DISCOVERY_REQUEST_ID_CONFLICT';
    end if;
    select spent_microusd into v_spent
      from public.lia_discovery_usage
     where user_id=p_user_id;
    return jsonb_build_object(
      'allowed',v_existing.approved,
      'charged_microusd',v_existing.charged_microusd,
      'spent_microusd',coalesce(v_spent,0),
      'limit_microusd',v_limit,
      'idempotent_replay',true
    );
  end if;

  insert into public.lia_discovery_usage(user_id,spent_microusd,updated_at)
  values(p_user_id,0,now())
  on conflict(user_id) do nothing;

  select spent_microusd into v_spent
    from public.lia_discovery_usage
   where user_id=p_user_id
   for update;

  v_approved := (v_spent + p_requested_microusd <= v_limit);
  v_charged := case when v_approved then p_requested_microusd else 0 end;

  if v_approved then
    update public.lia_discovery_usage
       set spent_microusd=spent_microusd+p_requested_microusd,
           updated_at=now()
     where user_id=p_user_id
     returning spent_microusd into v_spent;
  end if;

  insert into public.lia_discovery_charges(request_id,user_id,requested_microusd,approved,charged_microusd)
  values(p_request_id,p_user_id,p_requested_microusd,v_approved,v_charged);

  return jsonb_build_object(
    'allowed',v_approved,
    'charged_microusd',v_charged,
    'spent_microusd',v_spent,
    'limit_microusd',v_limit,
    'idempotent_replay',false
  );
end; $$;

revoke all on function public.reserve_lia_discovery_budget(uuid,uuid,bigint) from public;
revoke all on function public.reserve_lia_discovery_budget(uuid,uuid,bigint) from anon;
revoke all on function public.reserve_lia_discovery_budget(uuid,uuid,bigint) from authenticated;
grant execute on function public.reserve_lia_discovery_budget(uuid,uuid,bigint) to service_role;


-- V0.165 — guided first-household setup with LIA.
-- Existing households stay completed. Newly created households enter the short LIA setup.

alter table public.households
  add column if not exists setup_completed boolean not null default true;

alter table public.households
  add column if not exists default_party_size smallint;

do $$ begin
  alter table public.households
    add constraint households_default_party_size_range
    check (default_party_size is null or default_party_size between 1 and 20);
exception when duplicate_object then null; end $$;

create or replace function public.create_household(p_name text)
returns table(id uuid, name text)
language plpgsql security definer set search_path=public as $$
declare h public.households;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if exists(select 1 from public.household_members where user_id=auth.uid()) then raise exception 'User already belongs to a household'; end if;
  insert into public.households(name,created_by,setup_completed)
  values(trim(p_name),auth.uid(),false)
  returning * into h;
  insert into public.household_members(household_id,user_id,role) values(h.id,auth.uid(),'admin');
  return query select h.id,h.name;
end; $$;

create or replace function public.complete_household_setup(
  p_household_id uuid,
  p_display_name text,
  p_default_party_size integer
)
returns void
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 2 and 60 then raise exception 'INVALID_DISPLAY_NAME'; end if;
  if p_default_party_size is null or p_default_party_size not between 1 and 20 then raise exception 'INVALID_PARTY_SIZE'; end if;

  insert into public.profiles(id,display_name)
  values(auth.uid(),trim(p_display_name))
  on conflict (id) do update set display_name=excluded.display_name,updated_at=now();

  update public.households
  set default_party_size=p_default_party_size,
      setup_completed=true,
      updated_at=now()
  where id=p_household_id;
end; $$;

revoke all on function public.complete_household_setup(uuid,text,integer) from public;
revoke all on function public.complete_household_setup(uuid,text,integer) from anon;
grant execute on function public.complete_household_setup(uuid,text,integer) to authenticated;

-- V0.166 — structured family sheet for LIA.
-- Structured facts are entered once in a form; LIA only speaks when validation finds
-- a concrete omission or inconsistency. Existing lightweight family-response rows remain reusable.

alter table public.profiles add column if not exists salutation text;
alter table public.profiles add column if not exists age smallint;
alter table public.profiles add column if not exists phone_number text;

do $$ begin
  alter table public.profiles add constraint profiles_salutation_check check (salutation is null or salutation in ('mr','mrs','other'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_age_check check (age is null or age between 0 and 120);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_phone_check check (phone_number is null or char_length(trim(phone_number)) between 6 and 32);
exception when duplicate_object then null; end $$;

alter table public.light_members alter column phone_number drop not null;
alter table public.light_members add column if not exists age smallint;
alter table public.light_members add column if not exists relation text not null default 'other';
alter table public.light_members add column if not exists relation_label text;
alter table public.light_members add column if not exists salutation text;

do $$ begin
  alter table public.light_members add constraint light_members_age_check check (age is null or age between 0 and 120);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.light_members add constraint light_members_relation_check check (relation in ('spouse','child','other'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.light_members add constraint light_members_salutation_check check (salutation is null or salutation in ('mr','mrs','other'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.light_members add constraint light_members_relation_label_check check (relation<>'other' or char_length(trim(coalesce(relation_label,''))) between 1 and 40);
exception when duplicate_object then null; end $$;

create or replace function public.complete_household_family_setup(
  p_household_id uuid,
  p_display_name text,
  p_salutation text,
  p_age integer,
  p_phone_number text,
  p_members jsonb
)
returns void
language plpgsql security definer set search_path=public as $$
declare
  v_member jsonb;
  v_relation text;
  v_relation_label text;
  v_salutation text;
  v_name text;
  v_age integer;
  v_phone text;
  v_count integer;
  v_phone_key text;
  v_seen_phones text[] := array[]::text[];
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 2 and 60 then raise exception 'INVALID_DISPLAY_NAME'; end if;
  if p_salutation not in ('mr','mrs','other') then raise exception 'INVALID_SALUTATION'; end if;
  if p_age is null or p_age not between 0 and 120 then raise exception 'INVALID_AGE'; end if;
  if char_length(trim(coalesce(p_phone_number,''))) not between 6 and 32 then raise exception 'INVALID_PHONE_NUMBER'; end if;
  v_phone_key=regexp_replace(coalesce(p_phone_number,''),'[^0-9]','','g');
  if char_length(v_phone_key)<6 then raise exception 'INVALID_PHONE_NUMBER'; end if;
  v_seen_phones=array_append(v_seen_phones,v_phone_key);
  if p_members is null or jsonb_typeof(p_members)<>'array' then raise exception 'INVALID_FAMILY_MEMBERS'; end if;
  v_count=jsonb_array_length(p_members);
  if v_count>19 then raise exception 'TOO_MANY_FAMILY_MEMBERS'; end if;

  for v_member in select value from jsonb_array_elements(p_members)
  loop
    v_relation=coalesce(v_member->>'relation','');
    v_relation_label=nullif(trim(coalesce(v_member->>'relation_label','')),'');
    v_salutation=nullif(v_member->>'salutation','');
    v_name=trim(coalesce(v_member->>'display_name',''));
    begin v_age=nullif(v_member->>'age','')::integer; exception when others then raise exception 'INVALID_MEMBER_AGE'; end;
    v_phone=nullif(trim(coalesce(v_member->>'phone_number','')),'');
    if v_relation not in ('spouse','child','other') then raise exception 'INVALID_MEMBER_RELATION'; end if;
    if v_relation='other' and (v_relation_label is null or char_length(v_relation_label) not between 1 and 40) then raise exception 'INVALID_MEMBER_RELATION_LABEL'; end if;
    if v_salutation is not null and v_salutation not in ('mr','mrs','other') then raise exception 'INVALID_MEMBER_SALUTATION'; end if;
    if char_length(v_name) not between 2 and 60 then raise exception 'INVALID_MEMBER_NAME'; end if;
    if v_age is null or v_age not between 0 and 120 then raise exception 'INVALID_MEMBER_AGE'; end if;
    if v_relation<>'child' and v_phone is null then raise exception 'INVALID_MEMBER_PHONE_NUMBER'; end if;
    if v_phone is not null then
      if char_length(v_phone) not between 6 and 32 then raise exception 'INVALID_MEMBER_PHONE_NUMBER'; end if;
      v_phone_key=regexp_replace(v_phone,'[^0-9]','','g');
      if char_length(v_phone_key)<6 then raise exception 'INVALID_MEMBER_PHONE_NUMBER'; end if;
      if v_phone_key=any(v_seen_phones) then raise exception 'DUPLICATE_MEMBER_PHONE_NUMBER'; end if;
      v_seen_phones=array_append(v_seen_phones,v_phone_key);
    end if;
  end loop;

  insert into public.profiles(id,display_name,salutation,age,phone_number)
  values(auth.uid(),trim(p_display_name),p_salutation,p_age,trim(p_phone_number))
  on conflict (id) do update
    set display_name=excluded.display_name,
        salutation=excluded.salutation,
        age=excluded.age,
        phone_number=excluded.phone_number,
        updated_at=now();

  -- A brand-new household has no meal-response history yet. Rebuild the lightweight
  -- roster atomically from the family sheet so there is a single source for non-account members.
  delete from public.light_members where household_id=p_household_id;
  for v_member in select value from jsonb_array_elements(p_members)
  loop
    v_relation=v_member->>'relation';
    v_relation_label=nullif(trim(coalesce(v_member->>'relation_label','')),'');
    v_salutation=nullif(v_member->>'salutation','');
    v_name=trim(v_member->>'display_name');
    v_age=nullif(v_member->>'age','')::integer;
    v_phone=nullif(trim(coalesce(v_member->>'phone_number','')),'');
    insert into public.light_members(household_id,display_name,phone_number,age,relation,relation_label,salutation,created_by)
    values(p_household_id,v_name,v_phone,v_age,v_relation,v_relation_label,v_salutation,auth.uid());
  end loop;

  update public.households
  set default_party_size=least(20,1+v_count),
      setup_completed=true,
      updated_at=now()
  where id=p_household_id;
end; $$;

revoke all on function public.complete_household_family_setup(uuid,text,text,integer,text,jsonb) from public;
revoke all on function public.complete_household_family_setup(uuid,text,text,integer,text,jsonb) from anon;
grant execute on function public.complete_household_family_setup(uuid,text,text,integer,text,jsonb) to authenticated;

-- Family-sheet rows may intentionally have no phone (for example a young child).
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
  v_phone text;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select household_id into v_household_id from public.light_members where id=p_light_member_id;
  if v_household_id is null then raise exception 'LIGHT_MEMBER_NOT_FOUND'; end if;
  if not public.is_household_admin(v_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if not public.family_feature_allowed(v_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 1 and 60 then raise exception 'INVALID_MEMBER_NAME'; end if;
  v_phone=nullif(trim(coalesce(p_phone_number,'')),'');
  if v_phone is not null and char_length(v_phone) not between 6 and 32 then raise exception 'INVALID_PHONE_NUMBER'; end if;

  update public.light_members
     set display_name=trim(p_display_name),
         phone_number=v_phone,
         active=coalesce(p_active,true),
         updated_at=now()
   where id=p_light_member_id;
end; $$;

revoke all on function public.update_light_member(uuid,text,text,boolean) from public;
grant execute on function public.update_light_member(uuid,text,text,boolean) to authenticated;
-- V0.167 — additive only:
-- 1) private LIA Mémos;
-- 2) child age becomes optional in the family sheet, while invalid supplied ages are still rejected.

create table if not exists public.lia_memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  summary text not null check (char_length(trim(summary)) between 1 and 2000),
  status text not null default 'active' check (status in ('active','done')),
  link_kind text null,
  link_ref text null,
  link_label text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lia_memos_link_kind_check check (link_kind is null or link_kind in ('restaurant','recipe','meal','shopping','commander','family','other')),
  constraint lia_memos_link_shape_check check (
    (link_kind is null and link_ref is null and link_label is null)
    or
    (link_kind is not null and link_label is not null and char_length(trim(link_label)) between 1 and 120 and (link_ref is null or char_length(trim(link_ref)) between 1 and 256))
  )
);

alter table public.lia_memos enable row level security;

drop policy if exists lia_memos_select_own on public.lia_memos;
create policy lia_memos_select_own on public.lia_memos for select to authenticated using (user_id=auth.uid());
drop policy if exists lia_memos_insert_own on public.lia_memos;
create policy lia_memos_insert_own on public.lia_memos for insert to authenticated with check (user_id=auth.uid());
drop policy if exists lia_memos_update_own on public.lia_memos;
create policy lia_memos_update_own on public.lia_memos for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists lia_memos_delete_own on public.lia_memos;
create policy lia_memos_delete_own on public.lia_memos for delete to authenticated using (user_id=auth.uid());

create index if not exists lia_memos_user_status_created_idx on public.lia_memos(user_id,status,created_at desc);

create or replace function public.complete_household_family_setup(
  p_household_id uuid,
  p_display_name text,
  p_salutation text,
  p_age integer,
  p_phone_number text,
  p_members jsonb
)
returns void
language plpgsql security definer set search_path=public as $$
declare
  v_member jsonb;
  v_relation text;
  v_relation_label text;
  v_salutation text;
  v_name text;
  v_age integer;
  v_phone text;
  v_count integer;
  v_phone_key text;
  v_seen_phones text[] := array[]::text[];
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 2 and 60 then raise exception 'INVALID_DISPLAY_NAME'; end if;
  if p_salutation not in ('mr','mrs','other') then raise exception 'INVALID_SALUTATION'; end if;
  if p_age is null or p_age not between 0 and 120 then raise exception 'INVALID_AGE'; end if;
  if char_length(trim(coalesce(p_phone_number,''))) not between 6 and 32 then raise exception 'INVALID_PHONE_NUMBER'; end if;
  v_phone_key=regexp_replace(coalesce(p_phone_number,''),'[^0-9]','','g');
  if char_length(v_phone_key)<6 then raise exception 'INVALID_PHONE_NUMBER'; end if;
  v_seen_phones=array_append(v_seen_phones,v_phone_key);
  if p_members is null or jsonb_typeof(p_members)<>'array' then raise exception 'INVALID_FAMILY_MEMBERS'; end if;
  v_count=jsonb_array_length(p_members);
  if v_count>19 then raise exception 'TOO_MANY_FAMILY_MEMBERS'; end if;

  for v_member in select value from jsonb_array_elements(p_members)
  loop
    v_relation=coalesce(v_member->>'relation','');
    v_relation_label=nullif(trim(coalesce(v_member->>'relation_label','')),'');
    v_salutation=nullif(v_member->>'salutation','');
    v_name=trim(coalesce(v_member->>'display_name',''));
    begin v_age=nullif(v_member->>'age','')::integer; exception when others then raise exception 'INVALID_MEMBER_AGE'; end;
    v_phone=nullif(trim(coalesce(v_member->>'phone_number','')),'');
    if v_relation not in ('spouse','child','other') then raise exception 'INVALID_MEMBER_RELATION'; end if;
    if v_relation='other' and (v_relation_label is null or char_length(v_relation_label) not between 1 and 40) then raise exception 'INVALID_MEMBER_RELATION_LABEL'; end if;
    if v_salutation is not null and v_salutation not in ('mr','mrs','other') then raise exception 'INVALID_MEMBER_SALUTATION'; end if;
    if char_length(v_name) not between 2 and 60 then raise exception 'INVALID_MEMBER_NAME'; end if;
    if v_relation<>'child' and v_age is null then raise exception 'INVALID_MEMBER_AGE'; end if;
    if v_age is not null and v_age not between 0 and 120 then raise exception 'INVALID_MEMBER_AGE'; end if;
    if v_relation<>'child' and v_phone is null then raise exception 'INVALID_MEMBER_PHONE_NUMBER'; end if;
    if v_phone is not null then
      if char_length(v_phone) not between 6 and 32 then raise exception 'INVALID_MEMBER_PHONE_NUMBER'; end if;
      v_phone_key=regexp_replace(v_phone,'[^0-9]','','g');
      if char_length(v_phone_key)<6 then raise exception 'INVALID_MEMBER_PHONE_NUMBER'; end if;
      if v_phone_key=any(v_seen_phones) then raise exception 'DUPLICATE_MEMBER_PHONE_NUMBER'; end if;
      v_seen_phones=array_append(v_seen_phones,v_phone_key);
    end if;
  end loop;

  insert into public.profiles(id,display_name,salutation,age,phone_number)
  values(auth.uid(),trim(p_display_name),p_salutation,p_age,trim(p_phone_number))
  on conflict (id) do update
    set display_name=excluded.display_name,
        salutation=excluded.salutation,
        age=excluded.age,
        phone_number=excluded.phone_number,
        updated_at=now();

  delete from public.light_members where household_id=p_household_id;
  for v_member in select value from jsonb_array_elements(p_members)
  loop
    v_relation=v_member->>'relation';
    v_relation_label=nullif(trim(coalesce(v_member->>'relation_label','')),'');
    v_salutation=nullif(v_member->>'salutation','');
    v_name=trim(v_member->>'display_name');
    v_age=nullif(v_member->>'age','')::integer;
    v_phone=nullif(trim(coalesce(v_member->>'phone_number','')),'');
    insert into public.light_members(household_id,display_name,phone_number,age,relation,relation_label,salutation,created_by)
    values(p_household_id,v_name,v_phone,v_age,v_relation,v_relation_label,v_salutation,auth.uid());
  end loop;

  update public.households
  set default_party_size=least(20,1+v_count),
      setup_completed=true,
      updated_at=now()
  where id=p_household_id;
end; $$;

revoke all on function public.complete_household_family_setup(uuid,text,text,integer,text,jsonb) from public;
revoke all on function public.complete_household_family_setup(uuid,text,text,integer,text,jsonb) from anon;
grant execute on function public.complete_household_family_setup(uuid,text,text,integer,text,jsonb) to authenticated;
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


-- V0.171 — private restaurant favorites, explicitly separate from LIA Mémos.

create table if not exists public.commander_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'commander' check (char_length(trim(provider)) between 1 and 80),
  place_key text not null check (char_length(trim(place_key)) between 1 and 240),
  display_name text check (char_length(trim(display_name)) between 1 and 160),
  categories text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,provider,place_key)
);

alter table public.commander_favorites enable row level security;

drop policy if exists commander_favorites_select_own on public.commander_favorites;
create policy commander_favorites_select_own on public.commander_favorites for select to authenticated using (user_id=auth.uid());
drop policy if exists commander_favorites_insert_own on public.commander_favorites;
create policy commander_favorites_insert_own on public.commander_favorites for insert to authenticated with check (user_id=auth.uid());
drop policy if exists commander_favorites_update_own on public.commander_favorites;
create policy commander_favorites_update_own on public.commander_favorites for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists commander_favorites_delete_own on public.commander_favorites;
create policy commander_favorites_delete_own on public.commander_favorites for delete to authenticated using (user_id=auth.uid());

create index if not exists commander_favorites_user_created_idx on public.commander_favorites(user_id,created_at desc);

create or replace function public.touch_commander_favorite_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin
  new.updated_at=now();
  return new;
end; $$;

drop trigger if exists commander_favorites_touch_updated_at on public.commander_favorites;
create trigger commander_favorites_touch_updated_at
before update on public.commander_favorites
for each row execute function public.touch_commander_favorite_updated_at();

-- V0.172 — Google Places favorites persist only provider/place identity.
create or replace function public.scrub_google_commander_favorite_content()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if trim(new.provider)='google-places' then
    new.display_name=null;
    new.categories='{}'::text[];
  elsif new.display_name is null or char_length(trim(new.display_name))=0 then
    raise exception 'COMMANDER_FAVORITE_DISPLAY_NAME_REQUIRED';
  end if;
  return new;
end;
$$;

drop trigger if exists commander_favorites_google_content_guard on public.commander_favorites;
create trigger commander_favorites_google_content_guard
before insert or update on public.commander_favorites
for each row execute function public.scrub_google_commander_favorite_content();
-- V0.195 — LIA relational foundation.
-- Adds current relationship status to the organizer profile, makes organizer age optional,
-- and provides a private structured memory for non-transcript relationship facts.

alter table public.profiles add column if not exists relationship_status text;
do $$ begin
  alter table public.profiles add constraint profiles_relationship_status_check
    check (relationship_status is null or relationship_status in ('single','married','divorced','partnered'));
exception when duplicate_object then null; end $$;

create table if not exists public.lia_relationship_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null check (topic in ('food','family','personal_history','plans','leisure','style','travel')),
  subject_label text not null default '',
  fact_key text not null check (char_length(trim(fact_key)) between 1 and 80),
  fact_value text not null check (char_length(trim(fact_value)) between 1 and 1000),
  sensitivity text not null default 'ordinary' check (sensitivity in ('ordinary','personal','sensitive')),
  household_safe boolean not null default false,
  confirmed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,topic,subject_label,fact_key)
);

alter table public.lia_relationship_facts enable row level security;
drop policy if exists lia_relationship_facts_select_own on public.lia_relationship_facts;
create policy lia_relationship_facts_select_own on public.lia_relationship_facts for select to authenticated using (user_id=auth.uid());
drop policy if exists lia_relationship_facts_insert_own on public.lia_relationship_facts;
create policy lia_relationship_facts_insert_own on public.lia_relationship_facts for insert to authenticated with check (user_id=auth.uid());
drop policy if exists lia_relationship_facts_update_own on public.lia_relationship_facts;
create policy lia_relationship_facts_update_own on public.lia_relationship_facts for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists lia_relationship_facts_delete_own on public.lia_relationship_facts;
create policy lia_relationship_facts_delete_own on public.lia_relationship_facts for delete to authenticated using (user_id=auth.uid());

create or replace function public.complete_household_family_setup_v2(
  p_household_id uuid,
  p_display_name text,
  p_salutation text,
  p_age integer,
  p_phone_number text,
  p_relationship_status text,
  p_members jsonb
)
returns void
language plpgsql security definer set search_path=public as $$
declare
  v_member jsonb;
  v_relation text;
  v_relation_label text;
  v_salutation text;
  v_name text;
  v_age integer;
  v_phone text;
  v_count integer;
  v_phone_key text;
  v_seen_phones text[] := array[]::text[];
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if char_length(trim(coalesce(p_display_name,''))) not between 2 and 60 then raise exception 'INVALID_DISPLAY_NAME'; end if;
  if p_salutation not in ('mr','mrs','other') then raise exception 'INVALID_SALUTATION'; end if;
  if p_age is not null and p_age not between 0 and 120 then raise exception 'INVALID_AGE'; end if;
  if p_relationship_status is not null and p_relationship_status not in ('single','married','divorced','partnered') then raise exception 'INVALID_RELATIONSHIP_STATUS'; end if;
  if p_phone_number is not null and trim(p_phone_number)<>'' then
    if char_length(trim(p_phone_number)) not between 6 and 32 then raise exception 'INVALID_PHONE_NUMBER'; end if;
    v_phone_key=regexp_replace(p_phone_number,'[^0-9]','','g');
    if char_length(v_phone_key)<6 then raise exception 'INVALID_PHONE_NUMBER'; end if;
    v_seen_phones=array_append(v_seen_phones,v_phone_key);
  end if;
  if p_members is null or jsonb_typeof(p_members)<>'array' then raise exception 'INVALID_FAMILY_MEMBERS'; end if;
  v_count=jsonb_array_length(p_members);
  if v_count>19 then raise exception 'TOO_MANY_FAMILY_MEMBERS'; end if;

  for v_member in select value from jsonb_array_elements(p_members)
  loop
    v_relation=coalesce(v_member->>'relation','');
    v_relation_label=nullif(trim(coalesce(v_member->>'relation_label','')),'');
    v_salutation=nullif(v_member->>'salutation','');
    v_name=trim(coalesce(v_member->>'display_name',''));
    begin v_age=nullif(v_member->>'age','')::integer; exception when others then raise exception 'INVALID_MEMBER_AGE'; end;
    v_phone=nullif(trim(coalesce(v_member->>'phone_number','')),'');
    if v_relation not in ('spouse','child','other') then raise exception 'INVALID_MEMBER_RELATION'; end if;
    if v_relation='other' and (v_relation_label is null or char_length(v_relation_label) not between 1 and 40) then raise exception 'INVALID_MEMBER_RELATION_LABEL'; end if;
    if v_salutation is not null and v_salutation not in ('mr','mrs','other') then raise exception 'INVALID_MEMBER_SALUTATION'; end if;
    if char_length(v_name) not between 2 and 60 then raise exception 'INVALID_MEMBER_NAME'; end if;
    if v_age is not null and v_age not between 0 and 120 then raise exception 'INVALID_MEMBER_AGE'; end if;
    if v_phone is not null then
      if char_length(v_phone) not between 6 and 32 then raise exception 'INVALID_MEMBER_PHONE_NUMBER'; end if;
      v_phone_key=regexp_replace(v_phone,'[^0-9]','','g');
      if char_length(v_phone_key)<6 then raise exception 'INVALID_MEMBER_PHONE_NUMBER'; end if;
      if v_phone_key=any(v_seen_phones) then raise exception 'DUPLICATE_MEMBER_PHONE_NUMBER'; end if;
      v_seen_phones=array_append(v_seen_phones,v_phone_key);
    end if;
  end loop;

  insert into public.profiles(id,display_name,salutation,age,phone_number,relationship_status)
  values(auth.uid(),trim(p_display_name),p_salutation,p_age,nullif(trim(coalesce(p_phone_number,'')),''),p_relationship_status)
  on conflict (id) do update
    set display_name=excluded.display_name,
        salutation=excluded.salutation,
        age=excluded.age,
        phone_number=excluded.phone_number,
        relationship_status=excluded.relationship_status,
        updated_at=now();

  delete from public.light_members where household_id=p_household_id;
  for v_member in select value from jsonb_array_elements(p_members)
  loop
    v_relation=v_member->>'relation';
    v_relation_label=nullif(trim(coalesce(v_member->>'relation_label','')),'');
    v_salutation=nullif(v_member->>'salutation','');
    v_name=trim(v_member->>'display_name');
    v_age=nullif(v_member->>'age','')::integer;
    v_phone=nullif(trim(coalesce(v_member->>'phone_number','')),'');
    insert into public.light_members(household_id,display_name,phone_number,age,relation,relation_label,salutation,created_by)
    values(p_household_id,v_name,v_phone,v_age,v_relation,v_relation_label,v_salutation,auth.uid());
  end loop;

  update public.households
  set default_party_size=least(20,1+v_count),setup_completed=true,updated_at=now()
  where id=p_household_id;
end; $$;

revoke all on function public.complete_household_family_setup_v2(uuid,text,text,integer,text,text,jsonb) from public;
revoke all on function public.complete_household_family_setup_v2(uuid,text,text,integer,text,text,jsonb) from anon;
grant execute on function public.complete_household_family_setup_v2(uuid,text,text,integer,text,text,jsonb) to authenticated;

-- V0.195 — age-aware family meal messages + free family reply note.
-- The organizer composes one meal question; each recipient sees only the actions
-- that make sense for that member. Missing phone means no response link at all.

alter table public.light_meal_responses add column if not exists note text;
do $$ begin
  alter table public.light_meal_responses add constraint light_meal_responses_note_len
    check (note is null or char_length(note) <= 500);
exception when duplicate_object then null; end $$;

create or replace function public.issue_light_response_token(
  p_question_id uuid,
  p_light_member_id uuid
)
returns text
language plpgsql
security definer
set search_path=public as $$
declare
  v_question public.light_meal_questions;
  v_member public.light_members;
  v_token text;
  v_hash text;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select * into v_question from public.light_meal_questions where id=p_question_id for update;
  if v_question.id is null then raise exception 'QUESTION_NOT_FOUND'; end if;
  if not public.is_household_admin(v_question.household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if not public.family_feature_allowed(v_question.household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if v_question.closed_at is not null or v_question.expires_at<=now() then raise exception 'QUESTION_CLOSED'; end if;

  select * into v_member from public.light_members
   where id=p_light_member_id and household_id=v_question.household_id and active=true;
  if v_member.id is null then raise exception 'LIGHT_MEMBER_NOT_FOUND'; end if;
  if nullif(trim(coalesce(v_member.phone_number,'')),'') is null then raise exception 'LIGHT_MEMBER_NOT_REACHABLE'; end if;

  v_token:=encode(gen_random_bytes(32),'hex');
  v_hash:=encode(digest(v_token,'sha256'),'hex');
  insert into public.light_response_tokens(question_id,light_member_id,token_hash,expires_at,consumed_at,issued_by)
  values(v_question.id,v_member.id,v_hash,v_question.expires_at,null,auth.uid())
  on conflict (question_id,light_member_id) do update
    set token_hash=excluded.token_hash,expires_at=excluded.expires_at,consumed_at=null,
        issued_by=excluded.issued_by,created_at=now();
  return v_token;
end; $$;

create or replace function public.get_light_response_context(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_hash text;
  v_row record;
  v_allow_presence boolean;
  v_allow_desire boolean;
  v_allow_take_charge boolean;
begin
  if p_token is null or char_length(p_token)<>64 then return null; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');

  select m.display_name,m.age,m.relation,h.name as household_name,q.meal_date,q.meal_type,q.desire_options,
         least(q.expires_at,t.expires_at) as expires_at,
         (select m2.display_name from public.light_meal_responses r2
           join public.light_members m2 on m2.id=r2.light_member_id
          where r2.question_id=q.id and r2.presence='take_charge'
          order by r2.responded_at asc limit 1) as take_charge_name
    into v_row
  from public.light_response_tokens t
  join public.light_meal_questions q on q.id=t.question_id
  join public.light_members m on m.id=t.light_member_id and m.household_id=q.household_id
  join public.households h on h.id=q.household_id
  where t.token_hash=v_hash and t.consumed_at is null and t.expires_at>now()
    and q.closed_at is null and q.expires_at>now() and m.active=true
    and nullif(trim(coalesce(m.phone_number,'')),'') is not null
  limit 1;
  if not found then return null; end if;

  if v_row.relation='child' then
    v_allow_presence:=v_row.age is not null and v_row.age>=17;
    v_allow_desire:=v_row.age is not null and v_row.age>=16;
    v_allow_take_charge:=v_row.age is not null and v_row.age>=17;
  else
    v_allow_presence:=true;
    v_allow_desire:=true;
    v_allow_take_charge:=true;
  end if;

  return jsonb_build_object(
    'member_name',v_row.display_name,'member_age',v_row.age,'member_relation',v_row.relation,
    'household_name',v_row.household_name,'meal_date',v_row.meal_date,'meal_type',v_row.meal_type,
    'desire_options',case when v_allow_desire then v_row.desire_options else '{}'::text[] end,
    'allow_presence',v_allow_presence,'allow_desire',v_allow_desire,
    'allow_take_charge',v_allow_take_charge,'allow_note',true,
    'expires_at',v_row.expires_at,'take_charge_name',v_row.take_charge_name
  );
end; $$;

drop function if exists public.submit_light_response(text,text,text);
create or replace function public.submit_light_response(
  p_token text,
  p_presence text,
  p_desire text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_hash text;
  v_token_row public.light_response_tokens;
  v_question public.light_meal_questions;
  v_member public.light_members;
  v_desire text;
  v_note text;
  v_take_charge_member uuid;
  v_allow_presence boolean;
  v_allow_desire boolean;
  v_allow_take_charge boolean;
begin
  if p_token is null or char_length(p_token)<>64 then raise exception 'TOKEN_INVALID_OR_USED'; end if;
  if p_presence not in ('yes','no','maybe','take_charge') then raise exception 'INVALID_PRESENCE'; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');
  select * into v_token_row from public.light_response_tokens where token_hash=v_hash for update;
  if v_token_row.id is null or v_token_row.consumed_at is not null or v_token_row.expires_at<=now() then raise exception 'TOKEN_INVALID_OR_USED'; end if;
  select * into v_question from public.light_meal_questions where id=v_token_row.question_id for update;
  select * into v_member from public.light_members where id=v_token_row.light_member_id;
  if v_question.id is null or v_member.id is null or not v_member.active
     or v_question.closed_at is not null or v_question.expires_at<=now()
     or v_member.household_id<>v_question.household_id then raise exception 'TOKEN_INVALID_OR_USED'; end if;

  if v_member.relation='child' then
    v_allow_presence:=v_member.age is not null and v_member.age>=17;
    v_allow_desire:=v_member.age is not null and v_member.age>=16;
    v_allow_take_charge:=v_member.age is not null and v_member.age>=17;
  else
    v_allow_presence:=true;v_allow_desire:=true;v_allow_take_charge:=true;
  end if;

  -- For children under 17, home presence is implicit: the UI never asks the question.
  if not v_allow_presence and p_presence<>'yes' then raise exception 'RESPONSE_NOT_ALLOWED_FOR_AGE'; end if;
  if p_presence='take_charge' and not v_allow_take_charge then raise exception 'RESPONSE_NOT_ALLOWED_FOR_AGE'; end if;

  v_desire:=nullif(trim(coalesce(p_desire,'')),'');
  if not v_allow_desire then v_desire:=null;
  elsif p_presence in ('no','take_charge') then v_desire:=null;
  elsif v_desire is not null and not (v_desire=any(v_question.desire_options)) then raise exception 'DESIRE_NOT_OFFERED'; end if;

  v_note:=nullif(trim(coalesce(p_note,'')),'');
  if v_note is not null and char_length(v_note)>500 then raise exception 'NOTE_TOO_LONG'; end if;

  if p_presence='take_charge' then
    select r.light_member_id into v_take_charge_member from public.light_meal_responses r
     where r.question_id=v_question.id and r.presence='take_charge' order by r.responded_at asc limit 1;
    if found then raise exception 'QUESTION_TAKEN_OVER'; end if;
  end if;

  insert into public.light_meal_responses(question_id,light_member_id,presence,desire,note,responded_at)
  values(v_question.id,v_member.id,p_presence,v_desire,v_note,now())
  on conflict (question_id,light_member_id) do update
    set presence=excluded.presence,desire=excluded.desire,note=excluded.note,responded_at=excluded.responded_at;
  update public.light_response_tokens set consumed_at=now() where id=v_token_row.id;
  return jsonb_build_object('ok',true,'presence',p_presence,'desire',v_desire,'note',v_note);
end; $$;

create or replace function public.get_light_meal_summary(p_question_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_household_id uuid;v_take_charge_name text;v_total integer;v_yes integer;v_no integer;v_maybe integer;v_take integer;
  v_home integer;v_pizza integer;v_pasta integer;v_sushi integer;v_chinese integer;v_surprise integer;v_notes jsonb;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select household_id into v_household_id from public.light_meal_questions where id=p_question_id;
  if v_household_id is null then raise exception 'QUESTION_NOT_FOUND'; end if;
  if not public.is_household_admin(v_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  select count(*),count(*) filter(where presence='yes'),count(*) filter(where presence='no'),count(*) filter(where presence='maybe'),count(*) filter(where presence='take_charge'),
         count(*) filter(where desire='home'),count(*) filter(where desire='pizza'),count(*) filter(where desire='pasta'),count(*) filter(where desire='sushi'),count(*) filter(where desire='chinese'),count(*) filter(where desire='surprise')
    into v_total,v_yes,v_no,v_maybe,v_take,v_home,v_pizza,v_pasta,v_sushi,v_chinese,v_surprise
  from public.light_meal_responses where question_id=p_question_id;
  select m.display_name into v_take_charge_name from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
   where r.question_id=p_question_id and r.presence='take_charge' order by r.responded_at asc limit 1;
  select coalesce(jsonb_agg(jsonb_build_object('member_name',m.display_name,'note',r.note,'responded_at',r.responded_at) order by r.responded_at desc),'[]'::jsonb)
    into v_notes from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
   where r.question_id=p_question_id and r.note is not null;
  return jsonb_build_object('total',v_total,'presence',jsonb_build_object('yes',v_yes,'no',v_no,'maybe',v_maybe,'take_charge',v_take),
    'desires',jsonb_build_object('home',v_home,'pizza',v_pizza,'pasta',v_pasta,'sushi',v_sushi,'chinese',v_chinese,'surprise',v_surprise),
    'take_charge_name',v_take_charge_name,'notes',v_notes);
end; $$;

revoke all on function public.submit_light_response(text,text,text,text) from public;
revoke all on function public.submit_light_response(text,text,text,text) from anon;
revoke all on function public.submit_light_response(text,text,text,text) from authenticated;
grant execute on function public.submit_light_response(text,text,text,text) to service_role;
-- V0.196 — LIA open loops / daily-right-hand follow-up.
-- Stores only a compact structured thread, never a conversation transcript.

create table if not exists public.lia_open_loops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete cascade,
  kind text not null check (kind in ('reminder','follow_up','offer_help')),
  topic text not null check (char_length(trim(topic)) between 1 and 80),
  subject_label text not null default '' check (char_length(subject_label)<=80),
  summary text not null check (char_length(trim(summary)) between 1 and 500),
  app_prompt text not null check (char_length(trim(app_prompt)) between 1 and 500),
  sensitivity text not null default 'ordinary' check (sensitivity in ('ordinary','personal','sensitive')),
  action_kind text not null default 'none' check (action_kind in ('none','alarm','memo','prepare','search','discuss','check_in')),
  due_at timestamptz not null,
  expires_at timestamptz,
  notification_preview text check (notification_preview is null or char_length(notification_preview)<=180),
  notification_preview_safe boolean not null default false,
  status text not null default 'open' check (status in ('open','done','dismissed')),
  surface_count integer not null default 0 check (surface_count between 0 and 100),
  last_surfaced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or expires_at>due_at),
  check (sensitivity='ordinary' or notification_preview_safe=false)
);

create index if not exists lia_open_loops_user_due_idx on public.lia_open_loops(user_id,status,due_at);
create index if not exists lia_open_loops_household_due_idx on public.lia_open_loops(household_id,status,due_at) where household_id is not null;

alter table public.lia_open_loops enable row level security;
drop policy if exists lia_open_loops_select_own on public.lia_open_loops;
create policy lia_open_loops_select_own on public.lia_open_loops for select to authenticated using (user_id=auth.uid());
drop policy if exists lia_open_loops_insert_own on public.lia_open_loops;
create policy lia_open_loops_insert_own on public.lia_open_loops for insert to authenticated with check (user_id=auth.uid());
drop policy if exists lia_open_loops_update_own on public.lia_open_loops;
create policy lia_open_loops_update_own on public.lia_open_loops for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists lia_open_loops_delete_own on public.lia_open_loops;
create policy lia_open_loops_delete_own on public.lia_open_loops for delete to authenticated using (user_id=auth.uid());

create or replace function public.touch_lia_open_loop_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin
  new.updated_at=now();
  return new;
end; $$;

drop trigger if exists lia_open_loops_touch_updated_at on public.lia_open_loops;
create trigger lia_open_loops_touch_updated_at
before update on public.lia_open_loops
for each row execute function public.touch_lia_open_loop_updated_at();
-- V0.257 — En route avec LIA: 30 navigation starts per household subscription/month.
-- The quota is authoritative at household scope so several devices cannot each consume 30 trips.
-- Only the security-definer RPC can increment usage; authenticated clients may read their household row.

create table if not exists public.lia_navigation_monthly_usage (
  household_id uuid not null references public.households(id) on delete cascade,
  month_start date not null,
  trips_used integer not null default 0 check (trips_used >= 0 and trips_used <= 30),
  updated_at timestamptz not null default now(),
  primary key (household_id, month_start)
);

alter table public.lia_navigation_monthly_usage enable row level security;

drop policy if exists lia_navigation_monthly_usage_select on public.lia_navigation_monthly_usage;
create policy lia_navigation_monthly_usage_select on public.lia_navigation_monthly_usage
for select using (public.is_household_member(household_id));

revoke insert, update, delete on table public.lia_navigation_monthly_usage from anon, authenticated;
grant select on table public.lia_navigation_monthly_usage to authenticated;

create or replace function public.reserve_lia_navigation_trip(p_household_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_month_start date := date_trunc('month', timezone('UTC', now()))::date;
  v_resets_at timestamptz := ((date_trunc('month', timezone('UTC', now())) + interval '1 month') at time zone 'UTC');
  v_used integer;
  v_limit constant integer := 30;
begin
  if p_household_id is null or not public.is_household_member(p_household_id) then
    raise exception 'HOUSEHOLD_ACCESS_DENIED';
  end if;
  if not public.family_feature_allowed(p_household_id) then
    raise exception 'FAMILY_PLAN_REQUIRED';
  end if;

  insert into public.lia_navigation_monthly_usage(household_id,month_start,trips_used)
  values(p_household_id,v_month_start,0)
  on conflict (household_id,month_start) do nothing;

  select trips_used into v_used
  from public.lia_navigation_monthly_usage
  where household_id=p_household_id and month_start=v_month_start
  for update;

  if v_used >= v_limit then
    return jsonb_build_object(
      'allowed',false,
      'limit',v_limit,
      'used',v_used,
      'remaining',0,
      'month_start',v_month_start,
      'resets_at',v_resets_at
    );
  end if;

  update public.lia_navigation_monthly_usage
  set trips_used=trips_used+1,updated_at=now()
  where household_id=p_household_id and month_start=v_month_start
  returning trips_used into v_used;

  return jsonb_build_object(
    'allowed',true,
    'limit',v_limit,
    'used',v_used,
    'remaining',greatest(v_limit-v_used,0),
    'month_start',v_month_start,
    'resets_at',v_resets_at
  );
end;
$$;

revoke all on function public.reserve_lia_navigation_trip(uuid) from public;
revoke all on function public.reserve_lia_navigation_trip(uuid) from anon;
grant execute on function public.reserve_lia_navigation_trip(uuid) to authenticated;
-- V0.264 — private personal calendar owned by the signed-in user.
create table if not exists public.lia_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location text,
  notes text,
  reminder_minutes_before integer,
  recurrence_series_id text,
  recurrence_index integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lia_calendar_end_after_start check (ends_at is null or ends_at>starts_at),
  constraint lia_calendar_location_length check (location is null or char_length(trim(location))<=240),
  constraint lia_calendar_notes_length check (notes is null or char_length(notes)<=4000),
  constraint lia_calendar_reminder_range check (reminder_minutes_before is null or reminder_minutes_before between 0 and 10080),
  constraint lia_calendar_recurrence_pair check ((recurrence_series_id is null and recurrence_index is null) or (recurrence_series_id is not null and recurrence_index is not null and recurrence_index >= 0)),
  constraint lia_calendar_recurrence_series_length check (recurrence_series_id is null or char_length(recurrence_series_id) between 8 and 96)
);
alter table public.lia_calendar_events enable row level security;
drop policy if exists lia_calendar_select_own on public.lia_calendar_events;
create policy lia_calendar_select_own on public.lia_calendar_events for select to authenticated using (user_id=auth.uid());
drop policy if exists lia_calendar_insert_own on public.lia_calendar_events;
create policy lia_calendar_insert_own on public.lia_calendar_events for insert to authenticated with check (user_id=auth.uid());
drop policy if exists lia_calendar_update_own on public.lia_calendar_events;
create policy lia_calendar_update_own on public.lia_calendar_events for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists lia_calendar_delete_own on public.lia_calendar_events;
create policy lia_calendar_delete_own on public.lia_calendar_events for delete to authenticated using (user_id=auth.uid());
create index if not exists lia_calendar_user_start_idx on public.lia_calendar_events(user_id,starts_at);
create index if not exists lia_calendar_user_series_idx on public.lia_calendar_events(user_id,recurrence_series_id) where recurrence_series_id is not null;

-- V0.294 snapshot continuation: 202609190029 + 202609190030

-- V0.294 — shared named family choice board, editable responses, contextual LIA facts,
-- and retirement of the old "surprise" meal choice.

-- 1) Preserve historical data, then remove "surprise" from the active model.
update public.light_meal_responses set desire='home' where desire='surprise';

update public.light_meal_questions q
set desire_options=coalesce((
  select array_agg(option order by first_ordinal)
  from (
    select case when raw.option='surprise' then 'home' else raw.option end as option,
           min(raw.ordinal) as first_ordinal
    from unnest(q.desire_options) with ordinality as raw(option,ordinal)
    group by case when raw.option='surprise' then 'home' else raw.option end
  ) normalized
),'{}'::text[])
where 'surprise'=any(q.desire_options);

alter table public.light_meal_questions drop constraint if exists light_meal_questions_desires_check;
alter table public.light_meal_questions add constraint light_meal_questions_desires_check check (
  desire_options <@ array['home','pizza','pasta','sushi','chinese']::text[]
  and cardinality(desire_options)<=5
);

alter table public.light_meal_responses
  add column if not exists takes_charge boolean not null default false;

-- Old rows encoded "take charge" inside presence. Move that state to its own checkbox.
update public.light_meal_responses
set takes_charge=true,presence='yes'
where presence='take_charge';

alter table public.light_meal_responses drop constraint if exists light_meal_responses_presence_check;
alter table public.light_meal_responses add constraint light_meal_responses_presence_check
  check (presence in ('yes','no','maybe'));

alter table public.light_meal_responses drop constraint if exists light_meal_responses_desire_check;
alter table public.light_meal_responses add constraint light_meal_responses_desire_check
  check (desire is null or desire in ('home','pizza','pasta','sushi','chinese'));

create unique index if not exists light_meal_responses_one_take_charge_idx
  on public.light_meal_responses(question_id)
  where takes_charge=true;

-- Previously consumed one-time links are reopened while their meal/question is still valid.
update public.light_response_tokens t
set consumed_at=null
from public.light_meal_questions q
where q.id=t.question_id
  and t.expires_at>now()
  and q.closed_at is null
  and q.expires_at>now();

-- The organizer listens to question/response changes while Message famille is open,
-- and the global LIA family monitor follows responses after the screen is closed.
do $ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='light_meal_questions'
  ) then
    alter publication supabase_realtime add table public.light_meal_questions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='light_meal_responses'
  ) then
    alter publication supabase_realtime add table public.light_meal_responses;
  end if;
end $;

-- 2) Question writes accept only the five active meal choices.
create or replace function public.upsert_light_meal_question(
  p_household_id uuid,
  p_meal_date date,
  p_meal_type text,
  p_desire_options text[],
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path=public as $$
declare
  v_id uuid;
  v_options text[];
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  if not public.family_feature_allowed(p_household_id) then raise exception 'FAMILY_PLAN_REQUIRED'; end if;
  if p_meal_date is null then raise exception 'MEAL_DATE_REQUIRED'; end if;
  if p_meal_type not in ('breakfast','lunch','dinner','snack') then raise exception 'INVALID_MEAL_TYPE'; end if;
  if p_expires_at is null or p_expires_at<=now() then raise exception 'QUESTION_EXPIRY_REQUIRED'; end if;

  select coalesce(array_agg(option order by ordinal),'{}'::text[]) into v_options
  from (
    select option,min(ordinal) as ordinal
    from unnest(coalesce(p_desire_options,'{}'::text[])) with ordinality as x(option,ordinal)
    where option in ('home','pizza','pasta','sushi','chinese')
    group by option
  ) s;
  if cardinality(v_options)<>cardinality(coalesce(p_desire_options,'{}'::text[])) then
    raise exception 'INVALID_DESIRE_OPTIONS';
  end if;

  insert into public.light_meal_questions(household_id,meal_date,meal_type,desire_options,expires_at,created_by)
  values(p_household_id,p_meal_date,p_meal_type,v_options,p_expires_at,auth.uid())
  on conflict (household_id,meal_date,meal_type) do update
    set desire_options=excluded.desire_options,
        expires_at=excluded.expires_at,
        closed_at=null,
        updated_at=now()
  returning id into v_id;

  -- Reconfiguring a question intentionally resets its recipients and answers.
  delete from public.light_response_tokens where question_id=v_id;
  delete from public.light_meal_responses where question_id=v_id;
  return v_id;
end; $$;

revoke all on function public.upsert_light_meal_question(uuid,date,text,text[],timestamptz) from public;
grant execute on function public.upsert_light_meal_question(uuid,date,text,text[],timestamptz) to authenticated;

-- 3) Links are editable until expiry. Context also contains the shared family board.
create or replace function public.get_light_response_context(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_hash text;
  v_row record;
  v_allow_presence boolean;
  v_allow_desire boolean;
  v_allow_take_charge boolean;
  v_current jsonb;
  v_recipients jsonb;
  v_take_charge_name text;
begin
  if p_token is null or char_length(p_token)<>64 then return null; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');

  select t.question_id,t.light_member_id,m.display_name,m.age,m.relation,h.name as household_name,
         q.meal_date,q.meal_type,q.desire_options,least(q.expires_at,t.expires_at) as expires_at
    into v_row
  from public.light_response_tokens t
  join public.light_meal_questions q on q.id=t.question_id
  join public.light_members m on m.id=t.light_member_id and m.household_id=q.household_id
  join public.households h on h.id=q.household_id
  where t.token_hash=v_hash
    and t.expires_at>now()
    and q.closed_at is null
    and q.expires_at>now()
    and m.active=true
    and nullif(trim(coalesce(m.phone_number,'')),'') is not null
  limit 1;
  if not found then return null; end if;

  if v_row.relation='child' then
    v_allow_presence:=v_row.age is not null and v_row.age>=17;
    v_allow_desire:=v_row.age is not null and v_row.age>=16;
    v_allow_take_charge:=v_row.age is not null and v_row.age>=17;
  else
    v_allow_presence:=true;
    v_allow_desire:=true;
    v_allow_take_charge:=true;
  end if;

  select jsonb_build_object(
    'presence',r.presence,'desire',r.desire,'note',r.note,
    'takes_charge',r.takes_charge,'responded_at',r.responded_at
  )
    into v_current
  from public.light_meal_responses r
  where r.question_id=v_row.question_id and r.light_member_id=v_row.light_member_id;

  select m.display_name into v_take_charge_name
  from public.light_meal_responses r
  join public.light_members m on m.id=r.light_member_id
  where r.question_id=v_row.question_id and r.takes_charge=true
  order by r.responded_at asc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_name',m.display_name,
    'responded',r.light_member_id is not null,
    'presence',r.presence,
    'desire',r.desire,
    'note',r.note,
    'takes_charge',coalesce(r.takes_charge,false),
    'responded_at',r.responded_at
  ) order by t.created_at asc),'[]'::jsonb)
    into v_recipients
  from public.light_response_tokens t
  join public.light_members m on m.id=t.light_member_id
  left join public.light_meal_responses r
    on r.question_id=t.question_id and r.light_member_id=t.light_member_id
  where t.question_id=v_row.question_id;

  return jsonb_build_object(
    'member_name',v_row.display_name,
    'member_age',v_row.age,
    'member_relation',v_row.relation,
    'household_name',v_row.household_name,
    'meal_date',v_row.meal_date,
    'meal_type',v_row.meal_type,
    'desire_options',case when v_allow_desire then v_row.desire_options else '{}'::text[] end,
    'allow_presence',v_allow_presence,
    'allow_desire',v_allow_desire,
    'allow_take_charge',v_allow_take_charge,
    'allow_note',true,
    'expires_at',v_row.expires_at,
    'take_charge_name',v_take_charge_name,
    'current_response',v_current,
    'recipients',v_recipients
  );
end; $$;

revoke all on function public.get_light_response_context(text) from public;
revoke all on function public.get_light_response_context(text) from anon;
revoke all on function public.get_light_response_context(text) from authenticated;
grant execute on function public.get_light_response_context(text) to service_role;

-- 4) An answer can be edited repeatedly until expiry. Taking charge is an independent checkbox.
drop function if exists public.submit_light_response(text,text,text,text);
create or replace function public.submit_light_response(
  p_token text,
  p_presence text,
  p_desire text default null,
  p_note text default null,
  p_takes_charge boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_hash text;
  v_token_row public.light_response_tokens;
  v_question public.light_meal_questions;
  v_member public.light_members;
  v_desire text;
  v_note text;
  v_allow_presence boolean;
  v_allow_desire boolean;
  v_allow_take_charge boolean;
  v_other_take_charge text;
begin
  if p_token is null or char_length(p_token)<>64 then raise exception 'TOKEN_INVALID_OR_USED'; end if;
  if p_presence not in ('yes','no','maybe') then raise exception 'INVALID_PRESENCE'; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');

  select * into v_token_row
  from public.light_response_tokens
  where token_hash=v_hash
  for update;
  if v_token_row.id is null or v_token_row.expires_at<=now() then raise exception 'TOKEN_INVALID_OR_USED'; end if;

  select * into v_question from public.light_meal_questions where id=v_token_row.question_id for update;
  select * into v_member from public.light_members where id=v_token_row.light_member_id;
  if v_question.id is null or v_member.id is null or not v_member.active
     or v_question.closed_at is not null or v_question.expires_at<=now()
     or v_member.household_id<>v_question.household_id then raise exception 'TOKEN_INVALID_OR_USED'; end if;

  if v_member.relation='child' then
    v_allow_presence:=v_member.age is not null and v_member.age>=17;
    v_allow_desire:=v_member.age is not null and v_member.age>=16;
    v_allow_take_charge:=v_member.age is not null and v_member.age>=17;
  else
    v_allow_presence:=true;v_allow_desire:=true;v_allow_take_charge:=true;
  end if;

  if not v_allow_presence and p_presence<>'yes' then raise exception 'RESPONSE_NOT_ALLOWED_FOR_AGE'; end if;
  if p_takes_charge and not v_allow_take_charge then raise exception 'RESPONSE_NOT_ALLOWED_FOR_AGE'; end if;
  if p_presence='no' and p_takes_charge then raise exception 'INVALID_RESPONSE'; end if;

  v_desire:=nullif(trim(coalesce(p_desire,'')),'');
  if not v_allow_desire or p_presence='no' then v_desire:=null;
  elsif v_desire is not null and not (v_desire=any(v_question.desire_options)) then raise exception 'DESIRE_NOT_OFFERED'; end if;

  v_note:=nullif(trim(coalesce(p_note,'')),'');
  if v_note is not null and char_length(v_note)>500 then raise exception 'NOTE_TOO_LONG'; end if;

  if p_takes_charge then
    select m.display_name into v_other_take_charge
    from public.light_meal_responses r
    join public.light_members m on m.id=r.light_member_id
    where r.question_id=v_question.id
      and r.takes_charge=true
      and r.light_member_id<>v_member.id
    order by r.responded_at asc limit 1;
    if v_other_take_charge is not null then raise exception 'QUESTION_TAKEN_OVER:%',v_other_take_charge; end if;
  end if;

  insert into public.light_meal_responses(question_id,light_member_id,presence,desire,note,takes_charge,responded_at)
  values(v_question.id,v_member.id,p_presence,v_desire,v_note,p_takes_charge,now())
  on conflict (question_id,light_member_id) do update
    set presence=excluded.presence,
        desire=excluded.desire,
        note=excluded.note,
        takes_charge=excluded.takes_charge,
        responded_at=excluded.responded_at;

  -- Keep the same opaque token alive until its existing expiry.
  update public.light_response_tokens set consumed_at=null where id=v_token_row.id;

  return jsonb_build_object(
    'ok',true,'presence',p_presence,'desire',v_desire,'note',v_note,'takes_charge',p_takes_charge
  );
end; $$;

revoke all on function public.submit_light_response(text,text,text,text,boolean) from public;
revoke all on function public.submit_light_response(text,text,text,text,boolean) from anon;
revoke all on function public.submit_light_response(text,text,text,text,boolean) from authenticated;
grant execute on function public.submit_light_response(text,text,text,text,boolean) to service_role;

-- 5) Authenticated organizer summary: named recipients, choice totals, notes, and take-charge.
create or replace function public.get_light_meal_summary(p_question_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_household_id uuid;
  v_take_charge_name text;
  v_total integer;v_yes integer;v_no integer;v_maybe integer;v_take integer;
  v_home integer;v_pizza integer;v_pasta integer;v_sushi integer;v_chinese integer;
  v_notes jsonb;v_responses jsonb;v_recipients jsonb;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select household_id into v_household_id from public.light_meal_questions where id=p_question_id;
  if v_household_id is null then raise exception 'QUESTION_NOT_FOUND'; end if;
  if not public.is_household_admin(v_household_id) then raise exception 'ADMIN_REQUIRED'; end if;

  select count(*),count(*) filter(where presence='yes'),count(*) filter(where presence='no'),
         count(*) filter(where presence='maybe'),count(*) filter(where takes_charge=true),
         count(*) filter(where desire='home'),count(*) filter(where desire='pizza'),
         count(*) filter(where desire='pasta'),count(*) filter(where desire='sushi'),
         count(*) filter(where desire='chinese')
    into v_total,v_yes,v_no,v_maybe,v_take,v_home,v_pizza,v_pasta,v_sushi,v_chinese
  from public.light_meal_responses where question_id=p_question_id;

  select m.display_name into v_take_charge_name
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=p_question_id and r.takes_charge=true
  order by r.responded_at asc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_name',m.display_name,'note',r.note,'responded_at',r.responded_at
  ) order by r.responded_at desc),'[]'::jsonb)
    into v_notes
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=p_question_id and r.note is not null;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_id',m.id,'member_name',m.display_name,'presence',r.presence,'desire',r.desire,
    'note',r.note,'takes_charge',r.takes_charge,'responded_at',r.responded_at
  ) order by r.responded_at asc),'[]'::jsonb)
    into v_responses
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=p_question_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_id',m.id,'member_name',m.display_name,
    'responded',r.light_member_id is not null,
    'presence',r.presence,'desire',r.desire,'note',r.note,
    'takes_charge',coalesce(r.takes_charge,false),'responded_at',r.responded_at
  ) order by t.created_at asc),'[]'::jsonb)
    into v_recipients
  from public.light_response_tokens t
  join public.light_members m on m.id=t.light_member_id
  left join public.light_meal_responses r
    on r.question_id=t.question_id and r.light_member_id=t.light_member_id
  where t.question_id=p_question_id;

  return jsonb_build_object(
    'total',v_total,
    'presence',jsonb_build_object('yes',v_yes,'no',v_no,'maybe',v_maybe,'take_charge',v_take),
    'desires',jsonb_build_object('home',v_home,'pizza',v_pizza,'pasta',v_pasta,'sushi',v_sushi,'chinese',v_chinese),
    'take_charge_name',v_take_charge_name,'notes',v_notes,'responses',v_responses,'recipients',v_recipients
  );
end; $$;

revoke all on function public.get_light_meal_summary(uuid) from public;
grant execute on function public.get_light_meal_summary(uuid) to authenticated;

-- 6) Token-scoped shared board for family members. It reveals only the recipients of this one question.
create or replace function public.get_light_family_decisions(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=public as $$
declare
  v_hash text;v_question_id uuid;v_household_name text;v_meal_date date;v_meal_type text;
  v_take_charge_name text;v_recipients jsonb;v_options text[];
begin
  if p_token is null or char_length(p_token)<>64 then return null; end if;
  v_hash:=encode(digest(p_token,'sha256'),'hex');

  select q.id,h.name,q.meal_date,q.meal_type,q.desire_options
    into v_question_id,v_household_name,v_meal_date,v_meal_type,v_options
  from public.light_response_tokens t
  join public.light_meal_questions q on q.id=t.question_id
  join public.light_members target on target.id=t.light_member_id and target.household_id=q.household_id
  join public.households h on h.id=q.household_id
  where t.token_hash=v_hash and t.expires_at>now()
    and q.closed_at is null and q.expires_at>now() and target.active=true
  limit 1;
  if v_question_id is null then return null; end if;

  select m.display_name into v_take_charge_name
  from public.light_meal_responses r join public.light_members m on m.id=r.light_member_id
  where r.question_id=v_question_id and r.takes_charge=true
  order by r.responded_at asc limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'member_name',m.display_name,'responded',r.light_member_id is not null,
    'presence',r.presence,'desire',r.desire,'note',r.note,
    'takes_charge',coalesce(r.takes_charge,false),'responded_at',r.responded_at
  ) order by t.created_at asc),'[]'::jsonb)
    into v_recipients
  from public.light_response_tokens t
  join public.light_members m on m.id=t.light_member_id
  left join public.light_meal_responses r
    on r.question_id=t.question_id and r.light_member_id=t.light_member_id
  where t.question_id=v_question_id;

  return jsonb_build_object(
    'household_name',v_household_name,'meal_date',v_meal_date,'meal_type',v_meal_type,
    'desire_options',v_options,'take_charge_name',v_take_charge_name,'recipients',v_recipients
  );
end; $$;

revoke all on function public.get_light_family_decisions(text) from public;
revoke all on function public.get_light_family_decisions(text) from anon;
revoke all on function public.get_light_family_decisions(text) from authenticated;
grant execute on function public.get_light_family_decisions(text) to service_role;

-- V0.294 — progressive family profile enrichment.
-- Birthday is deliberately excluded from mandatory onboarding. LIA may ask later,
-- one small question at a time. Year remains optional.

alter table public.profiles add column if not exists birthday_month smallint;
alter table public.profiles add column if not exists birthday_day smallint;
alter table public.profiles add column if not exists birth_year smallint;

alter table public.light_members add column if not exists birthday_month smallint;
alter table public.light_members add column if not exists birthday_day smallint;
alter table public.light_members add column if not exists birth_year smallint;

do $$ begin
  alter table public.profiles add constraint profiles_birthday_month_check
    check (birthday_month is null or birthday_month between 1 and 12);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_birthday_day_check
    check (birthday_day is null or birthday_day between 1 and 31);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_birth_year_check
    check (birth_year is null or birth_year between 1900 and 2100);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.light_members add constraint light_members_birthday_month_check
    check (birthday_month is null or birthday_month between 1 and 12);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.light_members add constraint light_members_birthday_day_check
    check (birthday_day is null or birthday_day between 1 and 31);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.light_members add constraint light_members_birth_year_check
    check (birth_year is null or birth_year between 1900 and 2100);
exception when duplicate_object then null; end $$;

create or replace function public.set_lia_family_birthday(
  p_household_id uuid,
  p_subject_kind text,
  p_subject_id uuid,
  p_month integer,
  p_day integer,
  p_year integer default null
)
returns void
language plpgsql
security definer
set search_path=public as $$
declare
  v_date date;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_household_id is null then raise exception 'HOUSEHOLD_REQUIRED'; end if;
  if p_subject_kind not in ('profile','light_member') then raise exception 'INVALID_SUBJECT_KIND'; end if;
  if p_month not between 1 and 12 or p_day not between 1 and 31 then raise exception 'INVALID_BIRTHDAY'; end if;
  if p_year is not null and p_year not between 1900 and extract(year from current_date)::integer then raise exception 'INVALID_BIRTH_YEAR'; end if;

  begin
    v_date:=make_date(coalesce(p_year,2000),p_month,p_day);
  exception when others then
    raise exception 'INVALID_BIRTHDAY';
  end;

  if p_subject_kind='profile' then
    if p_subject_id<>auth.uid() then raise exception 'PROFILE_NOT_SELF'; end if;
    if not exists(select 1 from public.household_members where household_id=p_household_id and user_id=auth.uid()) then raise exception 'HOUSEHOLD_ACCESS_REQUIRED'; end if;
    update public.profiles
       set birthday_month=p_month,
           birthday_day=p_day,
           birth_year=p_year,
           updated_at=now()
     where id=auth.uid();
    if not found then raise exception 'PROFILE_NOT_FOUND'; end if;
    return;
  end if;

  if not public.is_household_admin(p_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  update public.light_members
     set birthday_month=p_month,
         birthday_day=p_day,
         birth_year=p_year,
         updated_at=now()
   where id=p_subject_id and household_id=p_household_id;
  if not found then raise exception 'LIGHT_MEMBER_NOT_FOUND'; end if;
end; $$;

revoke all on function public.set_lia_family_birthday(uuid,text,uuid,integer,integer,integer) from public;
revoke all on function public.set_lia_family_birthday(uuid,text,uuid,integer,integer,integer) from anon;
grant execute on function public.set_lia_family_birthday(uuid,text,uuid,integer,integer,integer) to authenticated;
