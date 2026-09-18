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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lia_calendar_end_after_start check (ends_at is null or ends_at>starts_at),
  constraint lia_calendar_location_length check (location is null or char_length(trim(location))<=240),
  constraint lia_calendar_notes_length check (notes is null or char_length(notes)<=4000)
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
