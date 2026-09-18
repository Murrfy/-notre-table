-- V0.270 — bounded recurring calendar series created by LIA.
alter table public.lia_calendar_events
  add column if not exists recurrence_series_id text,
  add column if not exists recurrence_index integer;

alter table public.lia_calendar_events
  drop constraint if exists lia_calendar_recurrence_pair;
alter table public.lia_calendar_events
  add constraint lia_calendar_recurrence_pair check (
    (recurrence_series_id is null and recurrence_index is null)
    or
    (recurrence_series_id is not null and recurrence_index is not null and recurrence_index >= 0)
  );

alter table public.lia_calendar_events
  drop constraint if exists lia_calendar_recurrence_series_length;
alter table public.lia_calendar_events
  add constraint lia_calendar_recurrence_series_length check (
    recurrence_series_id is null or char_length(recurrence_series_id) between 8 and 96
  );

create index if not exists lia_calendar_user_series_idx
  on public.lia_calendar_events(user_id,recurrence_series_id)
  where recurrence_series_id is not null;
