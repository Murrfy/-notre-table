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
