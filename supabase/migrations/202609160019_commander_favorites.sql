-- V0.171 — private restaurant favorites, explicitly separate from LIA Mémos.

create table if not exists public.commander_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'commander' check (char_length(trim(provider)) between 1 and 80),
  place_key text not null check (char_length(trim(place_key)) between 1 and 240),
  display_name text not null check (char_length(trim(display_name)) between 1 and 160),
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
