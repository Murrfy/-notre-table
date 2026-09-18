-- V0.265 — reminders belong to calendar events so they follow moves and deletion.
alter table public.lia_calendar_events
  add column if not exists reminder_minutes_before integer;

alter table public.lia_calendar_events
  drop constraint if exists lia_calendar_reminder_range;
alter table public.lia_calendar_events
  add constraint lia_calendar_reminder_range
  check (reminder_minutes_before is null or reminder_minutes_before between 0 and 10080);
