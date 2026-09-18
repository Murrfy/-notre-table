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
