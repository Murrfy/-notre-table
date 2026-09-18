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
