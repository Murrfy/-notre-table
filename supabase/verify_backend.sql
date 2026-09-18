-- Notre Table — read-only post-deployment verification.
-- Run after applying migrations. It does not change application data.

-- 1) Client-facing/backend tables must exist and have RLS enabled.
with expected(table_name) as (
  values
    ('profiles'),('households'),('household_members'),('invitations'),('recipes'),('recipe_ingredients'),
    ('recipe_favorites'),('recipe_translations'),('meal_plans'),('meal_participants'),('meal_guests'),
    ('shopping_items'),('member_preferences'),('meal_ideas'),('meal_idea_votes'),('household_activity'),
    ('pantry_items'),('member_absences'),('shopping_responsibilities'),('recipe_feedback'),
    ('light_members'),('light_meal_questions'),('light_response_tokens'),('light_meal_responses'),('lia_memos'),('commander_favorites')
)
select e.table_name,
       c.oid is not null as table_exists,
       coalesce(c.relrowsecurity,false) as rls_enabled
from expected e
left join pg_namespace n on n.nspname='public'
left join pg_class c on c.relnamespace=n.oid and c.relname=e.table_name and c.relkind='r'
order by e.table_name;

-- 2) Every expected public table must expose at least one RLS policy.
with expected(table_name) as (
  values
    ('profiles'),('households'),('household_members'),('invitations'),('recipes'),('recipe_ingredients'),
    ('recipe_favorites'),('recipe_translations'),('meal_plans'),('meal_participants'),('meal_guests'),
    ('shopping_items'),('member_preferences'),('meal_ideas'),('meal_idea_votes'),('household_activity'),
    ('pantry_items'),('member_absences'),('shopping_responsibilities'),('recipe_feedback'),
    ('light_members'),('light_meal_questions'),('light_response_tokens'),('light_meal_responses'),('lia_memos'),('commander_favorites')
)
select e.table_name, count(p.policyname) as policy_count
from expected e
left join pg_policies p on p.schemaname='public' and p.tablename=e.table_name
group by e.table_name
order by e.table_name;

-- 3) Expected Realtime tables must be in the supabase_realtime publication.
with expected(table_name) as (
  values ('meal_plans'),('shopping_items'),('household_activity'),('member_absences'),('shopping_responsibilities'),('recipe_feedback'),('light_meal_responses')
)
select e.table_name, (p.tablename is not null) as realtime_enabled
from expected e
left join pg_publication_tables p
  on p.pubname='supabase_realtime' and p.schemaname='public' and p.tablename=e.table_name
order by e.table_name;

-- 4) Avatar bucket must exist, remain private and keep the expected restrictions.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id='profile-avatars';

-- 5) Avatar Storage RLS policies must exist on storage.objects.
with expected(policy_name) as (values ('profile_avatars_select'),('profile_avatars_insert'),('profile_avatars_delete'))
select e.policy_name, (p.policyname is not null) as policy_exists
from expected e
left join pg_policies p
  on p.schemaname='storage' and p.tablename='objects' and p.policyname=e.policy_name
order by e.policy_name;

-- 6) App RPC signatures and privileges.
-- Signature matching uses oidvectortypes(proargtypes) so a stale overload cannot satisfy the proof.
-- Every expected row should show signature_exists=true, public_can_execute=false and authenticated_can_execute=true.
with expected(routine_name,arg_types) as (
  values
    ('create_household','text'),
    ('complete_household_setup','uuid, text, integer'),
    ('complete_household_family_setup','uuid, text, text, integer, text, jsonb'),
    ('complete_household_family_setup_v2','uuid, text, text, integer, text, text, jsonb'),
    ('create_household_invitation','uuid'),
    ('join_household_by_code','text'),
    ('create_recipe_with_ingredients','uuid, text, integer, integer, numeric, text[], text[], jsonb, text, text, text, text'),
    ('set_meal_slot','uuid, date, text, uuid, text, text, numeric, text, uuid, uuid, uuid[], text[]'),
    ('rebuild_weekly_shopping_list','uuid, date'),
    ('copy_previous_week','uuid, date'),
    ('add_recipe_to_shopping_list','uuid, date, uuid'),
    ('upsert_pantry_item','uuid, text, text, numeric, text, text, date'),
    ('create_light_member','uuid, text, text'),
    ('update_light_member','uuid, text, text, boolean'),
    ('upsert_light_meal_question','uuid, date, text, text[], timestamp with time zone'),
    ('issue_light_response_token','uuid, uuid'),
    ('get_light_meal_summary','uuid')
), resolved as (
  select e.routine_name,e.arg_types,p.oid,p.proowner,p.proacl
  from expected e
  left join pg_namespace n on n.nspname='public'
  left join pg_proc p
    on p.pronamespace=n.oid
   and p.proname=e.routine_name
   and oidvectortypes(p.proargtypes)=e.arg_types
)
select r.routine_name,
       r.arg_types as expected_arguments,
       r.oid is not null as signature_exists,
       case when r.oid is null then false else exists (
         select 1
         from aclexplode(coalesce(r.proacl,acldefault('f',r.proowner))) acl
         where acl.grantee=0 and acl.privilege_type='EXECUTE'
       ) end as public_can_execute,
       case when r.oid is null then false else has_function_privilege('authenticated',r.oid,'EXECUTE') end as authenticated_can_execute
from resolved r
order by r.routine_name;

-- 6b) No stale overload of an app RPC should remain remotely.
-- This query must return zero rows.
with expected(routine_name,arg_types) as (
  values
    ('create_household','text'),
    ('complete_household_setup','uuid, text, integer'),
    ('complete_household_family_setup','uuid, text, text, integer, text, jsonb'),
    ('complete_household_family_setup_v2','uuid, text, text, integer, text, text, jsonb'),
    ('create_household_invitation','uuid'),
    ('join_household_by_code','text'),
    ('create_recipe_with_ingredients','uuid, text, integer, integer, numeric, text[], text[], jsonb, text, text, text, text'),
    ('set_meal_slot','uuid, date, text, uuid, text, text, numeric, text, uuid, uuid, uuid[], text[]'),
    ('rebuild_weekly_shopping_list','uuid, date'),
    ('copy_previous_week','uuid, date'),
    ('add_recipe_to_shopping_list','uuid, date, uuid'),
    ('upsert_pantry_item','uuid, text, text, numeric, text, text, date'),
    ('create_light_member','uuid, text, text'),
    ('update_light_member','uuid, text, text, boolean'),
    ('upsert_light_meal_question','uuid, date, text, text[], timestamp with time zone'),
    ('issue_light_response_token','uuid, uuid'),
    ('get_light_meal_summary','uuid')
), actual as (
  select p.proname as routine_name,oidvectortypes(p.proargtypes) as arg_types
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname in (select routine_name from expected)
)
select a.routine_name,a.arg_types as unexpected_overload
from actual a
where not exists (
  select 1 from expected e
  where e.routine_name=a.routine_name and e.arg_types=a.arg_types
)
order by a.routine_name,a.arg_types;


-- 6c) Server-only account-deletion preparation must exist and never be client executable.
with resolved as (
  select p.oid,p.proowner,p.proacl
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='prepare_account_deletion' and oidvectortypes(p.proargtypes)='uuid'
)
select r.oid is not null as signature_exists,
       case when r.oid is null then false else exists(
         select 1 from aclexplode(coalesce(r.proacl,acldefault('f',r.proowner))) acl
         where acl.grantee=0 and acl.privilege_type='EXECUTE'
       ) end as public_can_execute,
       case when r.oid is null then false else has_function_privilege('authenticated',r.oid,'EXECUTE') end as authenticated_can_execute,
       case when r.oid is null then false else has_function_privilege('service_role',r.oid,'EXECUTE') end as service_role_can_execute
from resolved r;

-- 6c2) Lightweight public-link helpers are server-only; mobile roles never read bearer-token hashes.
with expected(routine_name,arg_types) as (
  values ('get_light_response_context','text'),('submit_light_response','text, text, text, text')
), resolved as (
  select e.routine_name,e.arg_types,p.oid,p.proowner,p.proacl
  from expected e
  left join pg_namespace n on n.nspname='public'
  left join pg_proc p on p.pronamespace=n.oid and p.proname=e.routine_name and oidvectortypes(p.proargtypes)=e.arg_types
)
select r.routine_name,r.arg_types,r.oid is not null as signature_exists,
       case when r.oid is null then false else exists(select 1 from aclexplode(coalesce(r.proacl,acldefault('f',r.proowner))) acl where acl.grantee=0 and acl.privilege_type='EXECUTE') end as public_can_execute,
       case when r.oid is null then false else has_function_privilege('anon',r.oid,'EXECUTE') end as anon_can_execute,
       case when r.oid is null then false else has_function_privilege('authenticated',r.oid,'EXECUTE') end as authenticated_can_execute,
       case when r.oid is null then false else has_function_privilege('service_role',r.oid,'EXECUTE') end as service_role_can_execute
from resolved r order by r.routine_name;

select has_table_privilege('anon','public.light_response_tokens','SELECT') as anon_can_read_token_hashes,
       has_table_privilege('authenticated','public.light_response_tokens','SELECT') as authenticated_can_read_token_hashes;

-- 6d) A shared household must survive creator deletion without retaining the deleted account id.
select a.attnotnull as created_by_not_null,
       c.confdeltype as created_by_fk_delete_action
from pg_attribute a
join pg_class t on t.oid=a.attrelid
join pg_namespace n on n.oid=t.relnamespace
left join pg_constraint c on c.conrelid=t.oid and c.conname='households_created_by_fkey'
where n.nspname='public' and t.relname='households' and a.attname='created_by' and not a.attisdropped;

-- 6b) V0.179 optional structured Memo links.
select
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='lia_memos' and column_name='link_kind') as link_kind_exists,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='lia_memos' and column_name='link_ref') as link_ref_exists,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='lia_memos' and column_name='link_label') as link_label_exists,
  exists(select 1 from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' and t.relname='lia_memos' and c.conname='lia_memos_link_shape_check') as link_shape_check_exists;

-- 7) Applied migration versions visible to the Supabase migration history.
-- Every expected row should show applied=true.
with expected(version) as (
  values ('202609140001'),('202609140002'),('202609140003'),('202609140004'),('202609140005'),('202609140006'),('202609140007'),('202609140008'),('202609140009'),('202609140010'),('202609140011'),('202609150012'),('202609150013'),('202609160014'),('202609160015'),('202609160016'),('202609160017'),('202609160018'),('202609160019'),('202609160020'),('202609160021'),('202609170022'),('202609170023'),('202609170024'),('202609180025'),('202609180026'),('202609180027'),('202609180028')
)
select e.version,(m.version is not null) as applied
from expected e
left join supabase_migrations.schema_migrations m on m.version=e.version
order by e.version;

-- 8) Household subscription mirror: members may read, mobile roles may not write.
select c.relrowsecurity as rls_enabled,
       has_table_privilege('authenticated','public.household_access','SELECT') as authenticated_can_select,
       has_table_privilege('authenticated','public.household_access','INSERT') as authenticated_can_insert,
       has_table_privilege('authenticated','public.household_access','UPDATE') as authenticated_can_update,
       has_table_privilege('authenticated','public.household_access','DELETE') as authenticated_can_delete,
       exists(select 1 from pg_policies p where p.schemaname='public' and p.tablename='household_access' and p.policyname='household_access_select') as select_policy_exists
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='household_access' and c.relkind='r';

-- 9) Premium enforcement setting is server-only. Mobile/authenticated roles must not read or mutate it.
select c.relrowsecurity as rls_enabled,
       has_table_privilege('authenticated','public.app_release_settings','SELECT') as authenticated_can_select,
       has_table_privilege('authenticated','public.app_release_settings','INSERT') as authenticated_can_insert,
       has_table_privilege('authenticated','public.app_release_settings','UPDATE') as authenticated_can_update,
       has_table_privilege('authenticated','public.app_release_settings','DELETE') as authenticated_can_delete,
       exists(select 1 from public.app_release_settings where singleton=true) as singleton_exists,
       (select premium_enforcement from public.app_release_settings where singleton=true) as premium_enforcement
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='app_release_settings' and c.relkind='r';

-- 9b) Trusted Premium helper signatures must exist.
with expected(routine_name,arg_types) as (
  values
    ('premium_enforcement_enabled',''),
    ('household_has_active_family','uuid'),
    ('family_feature_allowed','uuid'),
    ('can_write_household','uuid')
)
select e.routine_name,e.arg_types,
       exists(
         select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public' and p.proname=e.routine_name and oidvectortypes(p.proargtypes)=e.arg_types
       ) as signature_exists
from expected e
order by e.routine_name;


-- 10) LIA navigation quota is household-scoped, client-read-only and server-reserved.
select c.relrowsecurity as rls_enabled,
       has_table_privilege('authenticated','public.lia_navigation_monthly_usage','SELECT') as authenticated_can_select,
       has_table_privilege('authenticated','public.lia_navigation_monthly_usage','INSERT') as authenticated_can_insert,
       has_table_privilege('authenticated','public.lia_navigation_monthly_usage','UPDATE') as authenticated_can_update,
       has_table_privilege('authenticated','public.lia_navigation_monthly_usage','DELETE') as authenticated_can_delete,
       has_function_privilege('authenticated','public.reserve_lia_navigation_trip(uuid)','EXECUTE') as authenticated_can_reserve
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='lia_navigation_monthly_usage' and c.relkind='r';
