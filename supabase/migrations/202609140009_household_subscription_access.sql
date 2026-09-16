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
