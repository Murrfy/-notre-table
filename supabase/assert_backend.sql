-- Notre Table — fail-closed backend assertions.
-- Read-only with respect to application data. Raises on the first violated backend invariant.
-- Run after migrations and before the live multi-account smoke test.

do $$
declare
  item text;
  rec record;
  fn_oid oid;
  fn_owner oid;
  fn_acl aclitem[];
  rls_enabled boolean;
  overload_count integer;
  bucket_public boolean;
  bucket_limit bigint;
  bucket_mimes text[];
  premium_setting_exists boolean;
  expected_tables text[] := array[
    'profiles','households','household_members','invitations','recipes','recipe_ingredients',
    'recipe_favorites','recipe_translations','meal_plans','meal_participants','meal_guests',
    'shopping_items','member_preferences','meal_ideas','meal_idea_votes','household_activity',
    'pantry_items','member_absences','shopping_responsibilities','recipe_feedback','household_access',
    'light_members','light_meal_questions','light_response_tokens','light_meal_responses','lia_memos','commander_favorites','lia_navigation_monthly_usage'
  ];
  expected_realtime text[] := array['meal_plans','shopping_items','household_activity','member_absences','shopping_responsibilities','recipe_feedback','light_meal_questions','light_meal_responses'];
  expected_storage_policies text[] := array['profile_avatars_select','profile_avatars_insert','profile_avatars_delete'];
  expected_migrations text[] := array['202609140001','202609140002','202609140003','202609140004','202609140005','202609140006','202609140007','202609140008','202609140009','202609140010','202609140011','202609150012','202609150013','202609160014','202609160015','202609160016','202609160017','202609160018','202609160019','202609160020','202609160021','202609170022','202609170023','202609170024','202609180025','202609180026','202609180027','202609180028','202609190029','202609190030','202609190031'];
begin
  foreach item in array expected_tables loop
    select c.relrowsecurity into rls_enabled
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname=item and c.relkind='r';
    if not found then raise exception 'BACKEND_ASSERT_TABLE_MISSING: %',item; end if;
    if not rls_enabled then raise exception 'BACKEND_ASSERT_RLS_DISABLED: %',item; end if;
    if not exists(select 1 from pg_policies p where p.schemaname='public' and p.tablename=item) then
      raise exception 'BACKEND_ASSERT_POLICY_MISSING: %',item;
    end if;
  end loop;

  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='lia_memos' and column_name='link_kind') then raise exception 'BACKEND_ASSERT_LIA_MEMOS_LINK_KIND_MISSING'; end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='lia_memos' and column_name='link_ref') then raise exception 'BACKEND_ASSERT_LIA_MEMOS_LINK_REF_MISSING'; end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='lia_memos' and column_name='link_label') then raise exception 'BACKEND_ASSERT_LIA_MEMOS_LINK_LABEL_MISSING'; end if;
  if not exists(select 1 from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' and t.relname='lia_memos' and c.conname='lia_memos_link_kind_check') then raise exception 'BACKEND_ASSERT_LIA_MEMOS_LINK_KIND_CHECK_MISSING'; end if;
  if not exists(select 1 from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' and t.relname='lia_memos' and c.conname='lia_memos_link_shape_check') then raise exception 'BACKEND_ASSERT_LIA_MEMOS_LINK_SHAPE_CHECK_MISSING'; end if;

  foreach item in array expected_realtime loop
    if not exists(select 1 from pg_publication_tables p where p.pubname='supabase_realtime' and p.schemaname='public' and p.tablename=item) then
      raise exception 'BACKEND_ASSERT_REALTIME_MISSING: %',item;
    end if;
  end loop;

  select b.public,b.file_size_limit,b.allowed_mime_types into bucket_public,bucket_limit,bucket_mimes
  from storage.buckets b where b.id='profile-avatars';
  if not found then raise exception 'BACKEND_ASSERT_AVATAR_BUCKET_MISSING'; end if;
  if bucket_public then raise exception 'BACKEND_ASSERT_AVATAR_BUCKET_PUBLIC'; end if;
  if bucket_limit is distinct from 5242880 then raise exception 'BACKEND_ASSERT_AVATAR_SIZE_LIMIT: %',bucket_limit; end if;
  if not (bucket_mimes @> array['image/jpeg','image/png','image/webp','image/heic','image/heif']::text[]
          and array['image/jpeg','image/png','image/webp','image/heic','image/heif']::text[] @> bucket_mimes) then
    raise exception 'BACKEND_ASSERT_AVATAR_MIME_TYPES: %',bucket_mimes;
  end if;
  foreach item in array expected_storage_policies loop
    if not exists(select 1 from pg_policies p where p.schemaname='storage' and p.tablename='objects' and p.policyname=item) then
      raise exception 'BACKEND_ASSERT_STORAGE_POLICY_MISSING: %',item;
    end if;
  end loop;

  for rec in select * from (values
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
    ('get_light_meal_summary','uuid'),
    ('set_lia_family_birthday','uuid, text, uuid, integer, integer, integer'),
    ('set_lia_family_favorite_meal','uuid, text, uuid, text'),
    ('can_write_household','uuid'),
    ('reserve_lia_navigation_trip','uuid')
  ) as v(routine_name,arg_types) loop
    fn_oid:=null; fn_owner:=null; fn_acl:=null;
    select p.oid,p.proowner,p.proacl into fn_oid,fn_owner,fn_acl
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname=rec.routine_name and oidvectortypes(p.proargtypes)=rec.arg_types;
    if fn_oid is null then raise exception 'BACKEND_ASSERT_RPC_SIGNATURE_MISSING: %(%)',rec.routine_name,rec.arg_types; end if;
    if exists(select 1 from aclexplode(coalesce(fn_acl,acldefault('f',fn_owner))) a where a.grantee=0 and a.privilege_type='EXECUTE') then
      raise exception 'BACKEND_ASSERT_RPC_PUBLIC_EXECUTE: %(%)',rec.routine_name,rec.arg_types;
    end if;
    if not has_function_privilege('authenticated',fn_oid,'EXECUTE') then
      raise exception 'BACKEND_ASSERT_RPC_AUTH_EXECUTE_MISSING: %(%)',rec.routine_name,rec.arg_types;
    end if;
    select count(*) into overload_count
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname=rec.routine_name;
    if overload_count<>1 then raise exception 'BACKEND_ASSERT_RPC_OVERLOAD_COUNT: % has % overloads',rec.routine_name,overload_count; end if;
  end loop;

  -- Public lightweight-response helpers are callable only from the trusted Edge Function.
  for rec in select * from (values
    ('get_light_response_context','text'),
    ('get_light_family_decisions','text'),
    ('submit_light_response','text, text, text, text, boolean')
  ) as v(routine_name,arg_types) loop
    fn_oid:=null; fn_owner:=null; fn_acl:=null;
    select p.oid,p.proowner,p.proacl into fn_oid,fn_owner,fn_acl
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname=rec.routine_name and oidvectortypes(p.proargtypes)=rec.arg_types;
    if fn_oid is null then raise exception 'BACKEND_ASSERT_LIGHT_RESPONSE_RPC_MISSING: %(%)',rec.routine_name,rec.arg_types; end if;
    if exists(select 1 from aclexplode(coalesce(fn_acl,acldefault('f',fn_owner))) a where a.grantee=0 and a.privilege_type='EXECUTE') then
      raise exception 'BACKEND_ASSERT_LIGHT_RESPONSE_RPC_PUBLIC_EXECUTE: %(%)',rec.routine_name,rec.arg_types;
    end if;
    if has_function_privilege('anon',fn_oid,'EXECUTE') or has_function_privilege('authenticated',fn_oid,'EXECUTE') then
      raise exception 'BACKEND_ASSERT_LIGHT_RESPONSE_RPC_CLIENT_EXECUTE: %(%)',rec.routine_name,rec.arg_types;
    end if;
    if not has_function_privilege('service_role',fn_oid,'EXECUTE') then
      raise exception 'BACKEND_ASSERT_LIGHT_RESPONSE_RPC_SERVICE_EXECUTE_MISSING: %(%)',rec.routine_name,rec.arg_types;
    end if;
    select count(*) into overload_count from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname=rec.routine_name;
    if overload_count<>1 then raise exception 'BACKEND_ASSERT_LIGHT_RESPONSE_RPC_OVERLOAD_COUNT: % has % overloads',rec.routine_name,overload_count; end if;
  end loop;

  if has_table_privilege('authenticated','public.light_response_tokens','SELECT')
     or has_table_privilege('anon','public.light_response_tokens','SELECT') then
    raise exception 'BACKEND_ASSERT_LIGHT_RESPONSE_TOKEN_CLIENT_READ';
  end if;

  -- Account deletion must be executable only by the trusted server role, never by mobile users.
  fn_oid:=null; fn_owner:=null; fn_acl:=null;
  select p.oid,p.proowner,p.proacl into fn_oid,fn_owner,fn_acl
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='prepare_account_deletion' and oidvectortypes(p.proargtypes)='uuid';
  if fn_oid is null then raise exception 'BACKEND_ASSERT_ACCOUNT_DELETION_RPC_MISSING'; end if;
  if exists(select 1 from aclexplode(coalesce(fn_acl,acldefault('f',fn_owner))) a where a.grantee=0 and a.privilege_type='EXECUTE') then
    raise exception 'BACKEND_ASSERT_ACCOUNT_DELETION_PUBLIC_EXECUTE';
  end if;
  if has_function_privilege('authenticated',fn_oid,'EXECUTE') then
    raise exception 'BACKEND_ASSERT_ACCOUNT_DELETION_AUTH_EXECUTE';
  end if;
  if not has_function_privilege('service_role',fn_oid,'EXECUTE') then
    raise exception 'BACKEND_ASSERT_ACCOUNT_DELETION_SERVICE_EXECUTE_MISSING';
  end if;
  select count(*) into overload_count from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='prepare_account_deletion';
  if overload_count<>1 then raise exception 'BACKEND_ASSERT_ACCOUNT_DELETION_OVERLOAD_COUNT: %',overload_count; end if;

  if exists(
    select 1 from pg_attribute a join pg_class t on t.oid=a.attrelid join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public' and t.relname='households' and a.attname='created_by' and a.attnotnull and not a.attisdropped
  ) then raise exception 'BACKEND_ASSERT_ACCOUNT_DELETION_HOUSEHOLD_OWNER_NOT_NULL'; end if;
  if not exists(
    select 1 from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public' and t.relname='households' and c.conname='households_created_by_fkey' and c.confdeltype='n'
  ) then raise exception 'BACKEND_ASSERT_ACCOUNT_DELETION_HOUSEHOLD_OWNER_FK'; end if;

  -- Household subscription state is shared/readable inside one household but cannot be forged by mobile roles.
  if not exists(select 1 from pg_policies p where p.schemaname='public' and p.tablename='household_access' and p.policyname='household_access_select') then
    raise exception 'BACKEND_ASSERT_HOUSEHOLD_ACCESS_SELECT_POLICY_MISSING';
  end if;
  if has_table_privilege('authenticated','public.household_access','INSERT')
     or has_table_privilege('authenticated','public.household_access','UPDATE')
     or has_table_privilege('authenticated','public.household_access','DELETE') then
    raise exception 'BACKEND_ASSERT_HOUSEHOLD_ACCESS_CLIENT_WRITE_PRIVILEGE';
  end if;

  -- Premium enforcement configuration is server-only and must have exactly one trusted singleton row.
  if not exists(
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='app_release_settings' and c.relkind='r' and c.relrowsecurity
  ) then raise exception 'BACKEND_ASSERT_PREMIUM_SETTINGS_RLS'; end if;
  if has_table_privilege('authenticated','public.app_release_settings','SELECT')
     or has_table_privilege('authenticated','public.app_release_settings','INSERT')
     or has_table_privilege('authenticated','public.app_release_settings','UPDATE')
     or has_table_privilege('authenticated','public.app_release_settings','DELETE') then
    raise exception 'BACKEND_ASSERT_PREMIUM_SETTINGS_CLIENT_PRIVILEGE';
  end if;
  select exists(select 1 from public.app_release_settings where singleton=true) into premium_setting_exists;
  if not premium_setting_exists then raise exception 'BACKEND_ASSERT_PREMIUM_SETTINGS_MISSING'; end if;
  for rec in select * from (values
    ('premium_enforcement_enabled',''),
    ('household_has_active_family','uuid'),
    ('family_feature_allowed','uuid'),
    ('can_write_household','uuid'),
    ('reserve_lia_navigation_trip','uuid')
  ) as v(routine_name,arg_types) loop
    if not exists(
      select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname=rec.routine_name and oidvectortypes(p.proargtypes)=rec.arg_types
    ) then raise exception 'BACKEND_ASSERT_PREMIUM_HELPER_MISSING: %(%)',rec.routine_name,rec.arg_types; end if;
  end loop;

  foreach item in array expected_migrations loop
    if not exists(select 1 from supabase_migrations.schema_migrations m where m.version=item) then
      raise exception 'BACKEND_ASSERT_MIGRATION_MISSING: %',item;
    end if;
  end loop;
end $$;

select 'NOTRE_TABLE_BACKEND_ASSERTIONS_PASS' as result;
