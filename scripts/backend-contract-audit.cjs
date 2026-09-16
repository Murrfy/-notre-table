#!/usr/bin/env node
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const src=path.join(root,'src');
const schemaPath=path.join(root,'supabase','schema.sql');
const migrationDir=path.join(root,'supabase','migrations');
const failures=[];
const notes=[];

function walk(dir){
  const out=[];
  for(const name of fs.readdirSync(dir)){
    const p=path.join(dir,name); const s=fs.statSync(p);
    if(s.isDirectory())out.push(...walk(p)); else out.push(p);
  }
  return out;
}
function esc(v){return v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
const source=walk(src).filter(f=>/\.(ts|tsx)$/.test(f)).map(f=>fs.readFileSync(f,'utf8')).join('\n');
const schema=fs.readFileSync(schemaPath,'utf8');
const lower=schema.toLowerCase();

const tables=[...new Set([...source.matchAll(/\.from\(['\"]([^'\"]+)['\"]\)/g)].map(m=>m[1]))].sort();
const rpcs=[...new Set([...source.matchAll(/\.rpc\(['\"]([^'\"]+)['\"]/g)].map(m=>m[1]))].sort();
const realtimeTables=[...new Set([...source.matchAll(/table:\s*['\"]([^'\"]+)['\"]/g)].map(m=>m[1]))].sort();

for(const table of tables){
  if(!new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${esc(table)}\\b`,'i').test(schema)) failures.push(`Missing table in schema: ${table}`);
  if(!new RegExp(`alter\\s+table\\s+public\\.${esc(table)}\\s+enable\\s+row\\s+level\\s+security`,'i').test(schema)) failures.push(`RLS is not enabled in schema for client table: ${table}`);
  if(!new RegExp(`create\\s+policy\\s+[^;]+\\s+on\\s+public\\.${esc(table)}\\b`,'i').test(schema)) failures.push(`No RLS policy found for client table: ${table}`);
}

for(const rpc of rpcs){
  if(!new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${esc(rpc)}\\s*\\(`,'i').test(schema)) failures.push(`Missing RPC in schema: ${rpc}`);
  if(!new RegExp(`revoke\\s+all\\s+on\\s+function\\s+public\\.${esc(rpc)}\\s*\\(`,'i').test(schema)) failures.push(`RPC must explicitly revoke PUBLIC/default execution: ${rpc}`);
  if(!new RegExp(`grant\\s+execute\\s+on\\s+function\\s+public\\.${esc(rpc)}\\s*\\([^;]+?\\)\\s+to\\s+authenticated`,'i').test(schema)) failures.push(`RPC must explicitly grant execute to authenticated: ${rpc}`);
}

for(const table of realtimeTables){
  const quoted=new RegExp(`tablename\\s*=\\s*'${esc(table)}'`,'i').test(schema);
  const direct=new RegExp(`alter\\s+publication\\s+supabase_realtime\\s+add\\s+table\\s+public\\.${esc(table)}\\b`,'i').test(schema);
  if(!(quoted&&direct)) failures.push(`Realtime subscription exists in app but publication setup is missing for: ${table}`);
}

// Last-admin protection must not make whole-household deletion impossible through FK cascades.
const lastAdminFnMatch=schema.match(/create\s+or\s+replace\s+function\s+public\.prevent_last_household_admin_loss\s*\(\)[\s\S]*?\$\$;/i);
const lastAdminFn=lastAdminFnMatch?.[0]??'';
if(!/tg_op='DELETE'\s+and\s+not\s+exists\s*\([\s\S]*?from\s+public\.households/i.test(lastAdminFn)) failures.push('Last-admin guard must allow household_members cascade when the parent household is being deleted.');

// Invitation safety contract: one live code per household action and cryptographic generation.
const inviteFnMatches=[...schema.matchAll(/create\s+or\s+replace\s+function\s+public\.create_household_invitation\s*\(p_household_id uuid\)[\s\S]*?end; \$\$;/gi)];
const inviteFn=inviteFnMatches.at(-1)?.[0]??'';
if(!inviteFn.includes('gen_random_bytes')) failures.push('Invitation invariant: invitation codes must use cryptographic random bytes.');
if(!/where household_id=p_household_id and expires_at>now\(\) and used_by is null/i.test(inviteFn)) failures.push('Invitation invariant: repeated creation must reuse an existing live invitation.');
if(!/not exists\(select 1 from public\.invitations where code=v_code\)/i.test(inviteFn)) failures.push('Invitation invariant: generated codes must be unique against all historical invitation rows.');
if(!/from\s+public\.households\s+where\s+id=p_household_id\s+for\s+update/i.test(inviteFn)) failures.push('Invitation invariant: creation must serialize concurrent requests by locking the household row.');

// Stock/list RPCs that perform read-then-write merges must serialize per household.
for(const rpcName of ['upsert_pantry_item','add_recipe_to_shopping_list','rebuild_weekly_shopping_list']){
  const matches=[...schema.matchAll(new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${rpcName}\\s*\\([\\s\\S]*?end; \\$\\$;`,'gi'))];
  const fn=matches.at(-1)?.[0]??'';
  if(!/from\s+public\.households\s+where\s+id=p_household_id\s+for\s+update/i.test(fn)) failures.push(`Concurrency invariant: ${rpcName} must serialize household mutations by locking the household row.`);
}

// Storage contract used by avatar code.
if(source.includes("from('profile-avatars')")||source.includes('profile-avatars')){
  if(!/storage\.buckets/i.test(schema)||!/profile-avatars/i.test(schema)) failures.push('Profile avatar storage is used but the profile-avatars bucket is not declared in schema.');
  for(const verb of ['select','insert','delete']) if(!new RegExp(`profile_avatars_${verb}`,'i').test(schema)) failures.push(`Missing avatar storage policy: profile_avatars_${verb}`);
}

// Privileged keys must never be public/mobile configuration.
// Live backend smoke must test both isolation directions and leave no test data behind.
const liveSmoke=fs.readFileSync(path.join(root,'scripts','backend-live-smoke.cjs'),'utf8');
if(!liveSmoke.includes('Concurrent pantry merge failed')||!liveSmoke.includes('Concurrent recipe shopping merge failed')||!liveSmoke.includes('Concurrent weekly rebuild failed')) failures.push('Live smoke must prove pantry/shopping RPC behavior under real concurrency.');
if(!liveSmoke.includes('Concurrent previous-week copy created a duplicate or missing target meal')||!liveSmoke.includes('Concurrent previous-week copy did not preserve the exact participant set')||!liveSmoke.includes('Concurrent previous-week copy did not preserve exactly one guest')) failures.push('Live smoke must prove previous-week copy behavior under real concurrency, including meal children.');
if(!liveSmoke.includes('Cross-household shopping insert guard')||!liveSmoke.includes('Cross-household shopping update guard')||!liveSmoke.includes('Cross-household shopping delete guard')) failures.push('Live smoke must verify cross-household write isolation, not only reads.');
if(!liveSmoke.includes('Direct membership escalation guard')||!liveSmoke.includes('Member invitation privilege guard')) failures.push('Live smoke must verify membership/invitation privilege boundaries.');
if(!liveSmoke.includes('Concurrent invite idempotency failed')||!liveSmoke.includes('expected exactly one active invitation')) failures.push('Live smoke must verify invitation creation under real concurrency.');
if(!liveSmoke.includes('Concurrent invite consumption guard failed')||!liveSmoke.includes('admitted more than one new member')) failures.push('Live smoke must verify one-use invitation consumption under real concurrency.');
if(!liveSmoke.includes('createdHouseholds')||!liveSmoke.includes('Smoke cleanup failed')) failures.push('Live smoke must explicitly clean households before auth users and surface cleanup failures.');
for(const rpc of rpcs){
  if(!liveSmoke.includes(`'${rpc}'`)&&!liveSmoke.includes(`\"${rpc}\"`)) failures.push(`Live smoke must execute every client RPC: ${rpc}`);
}
if(!liveSmoke.includes('Same-household avatar read failed')||!liveSmoke.includes('Cross-household avatar read guard')||!liveSmoke.includes('Cross-user avatar upload guard')) failures.push('Live smoke must validate avatar storage RLS for owner, household member and outsider.');
if(!liveSmoke.includes('SUPABASE_SMOKE_TARGET')||!liveSmoke.includes('SUPABASE_SMOKE_ALLOW_DESTRUCTIVE')) failures.push('Live smoke must require explicit non-production destructive-test confirmation.');
if(!liveSmoke.includes('Atomic meal RPC did not persist exact participants')||!liveSmoke.includes('Denied atomic meal mutation changed participants')) failures.push('Live smoke must prove transactional meal slot children and rollback on invalid membership.');
if(!liveSmoke.includes('Shared-household account deletion did not preserve the household')||!liveSmoke.includes('Shared-household account deletion did not promote a successor admin')||!liveSmoke.includes('Solo-household account deletion did not delete the household')||!liveSmoke.includes("functions.invoke('delete-account'")) failures.push('Live smoke must prove the deployed account-deletion endpoint for shared-admin and solo-household cases.');
if(!liveSmoke.includes('Household premium inheritance failed')||!liveSmoke.includes('Cross-household premium read guard')||!liveSmoke.includes('Household premium client write guard')||!liveSmoke.includes('Deleted payer did not preserve only the verified paid period')) failures.push('Live smoke must prove household-scoped subscription RLS, shared access and payer-deletion continuity.');
if(!liveSmoke.includes('Expired Family downgrade did not block member collaboration')||!liveSmoke.includes('Free admin base write failed after downgrade')||!liveSmoke.includes('Family reactivation did not restore member collaboration')||!liveSmoke.includes('EXPECT_PREMIUM_ENFORCEMENT')) failures.push('Live smoke must prove server Premium downgrade/admin-Free/reactivation behavior and optional production-like enforcement expectation.');
const planningService=fs.readFileSync(path.join(src,'services','planning.ts'),'utf8');
for(const marker of ['p_cook_user_id','p_participant_user_ids','p_guest_names']) if(!planningService.includes(marker)) failures.push(`Planning mutation must send atomic set_meal_slot field: ${marker}`);
if(/from\(['"]meal_participants['"]\)\.delete\(\)/.test(planningService)||/from\(['"]meal_guests['"]\)\.delete\(\)/.test(planningService)) failures.push('Planning setMealSlot must not perform child-row mutation round trips outside the atomic RPC.');

// Account-deletion P0: authored data is prepared server-side and the creator FK cannot block Auth deletion.
if(!/alter\s+table\s+public\.households[\s\S]*?alter\s+column\s+created_by\s+drop\s+not\s+null/i.test(schema)) failures.push('Account deletion invariant: households.created_by must be nullable.');
if(!/constraint\s+households_created_by_fkey[\s\S]*?references\s+auth\.users\(id\)\s+on\s+delete\s+set\s+null/i.test(schema)) failures.push('Account deletion invariant: household creator FK must use ON DELETE SET NULL.');
const accountDeleteMatches=[...schema.matchAll(/create\s+or\s+replace\s+function\s+public\.prepare_account_deletion\s*\(p_user_id uuid\)[\s\S]*?\$\$;/gi)];
const accountDeleteFn=accountDeleteMatches.at(-1)?.[0]??'';
for(const marker of ['delete from public.shopping_items','delete from public.meal_plans','delete from public.meal_ideas','delete from public.household_activity','delete from public.recipes','delete from public.household_members']) if(!accountDeleteFn.toLowerCase().includes(marker)) failures.push(`Account deletion invariant missing authored-data cleanup: ${marker}`);
if(!/set\s+role='admin'/i.test(accountDeleteFn)||!/order\s+by\s+hm\.joined_at\s+asc/i.test(accountDeleteFn)) failures.push('Account deletion invariant: shared last-admin deletion must promote one deterministic remaining member.');
if(!/delete\s+from\s+public\.households\s+where\s+id=v_household_id/i.test(accountDeleteFn)) failures.push('Account deletion invariant: a solo household must be deleted with its only account.');
if(!/update\s+public\.household_access/i.test(accountDeleteFn)||!/payer_user_id=null/i.test(accountDeleteFn)||!/expires_at\s+is\s+not\s+null\s+and\s+expires_at>now\(\)/i.test(accountDeleteFn)) failures.push('Account deletion invariant: deleting the household payer must detach identity and preserve only a known unexpired paid period.');
for(const role of ['public','anon','authenticated']) if(!new RegExp(`revoke\\s+all\\s+on\\s+function\\s+public\\.prepare_account_deletion\\(uuid\\)\\s+from\\s+${role}`,'i').test(schema)) failures.push(`Account deletion RPC must revoke execute from ${role}.`);
if(!/grant\s+execute\s+on\s+function\s+public\.prepare_account_deletion\(uuid\)\s+to\s+service_role/i.test(schema)) failures.push('Account deletion RPC must grant execute only to service_role.');
const deleteFunctionPath=path.join(root,'supabase','functions','delete-account','index.ts');
if(!fs.existsSync(deleteFunctionPath)) failures.push('Missing trusted delete-account Edge Function.');
else {
  const edge=fs.readFileSync(deleteFunctionPath,'utf8');
  for(const marker of ["admin.auth.getUser(match[1])","admin.rpc('prepare_account_deletion'","admin.auth.admin.deleteUser(user.id,false)","storage.from('profile-avatars').remove"]) if(!edge.includes(marker)) failures.push(`delete-account Edge Function missing security/deletion step: ${marker}`);
  if(/body\?\.user_id|body\?\.userId|body\.user_id|body\.userId/.test(edge)) failures.push('delete-account Edge Function must derive user identity only from the bearer token, never the request body.');
}

const householdAccessFunctionPath=path.join(root,'supabase','functions','sync-household-access','index.ts');
if(!fs.existsSync(householdAccessFunctionPath)) failures.push('Missing trusted sync-household-access Edge Function.');
else {
  const edge=fs.readFileSync(householdAccessFunctionPath,'utf8');
  for(const marker of ["admin.auth.getUser(match[1])","from('household_members')","from('household_access')",'api.revenuecat.com/v1/subscribers','REVENUECAT_SECRET_API_KEY','REVENUECAT_ENTITLEMENT_ID']) if(!edge.includes(marker)) failures.push(`sync-household-access Edge Function missing security/billing step: ${marker}`);
  if(/body\?\.(?:user_id|userId|payer_user_id)|body\.(?:user_id|userId|payer_user_id)/.test(edge)) failures.push('sync-household-access must derive payer identity from authenticated/server state, never a client-supplied user id.');
}
const lightResponseFunctionPath=path.join(root,'supabase','functions','light-response','index.ts');
if(!fs.existsSync(lightResponseFunctionPath)) failures.push('Missing public light-response Edge Function.');
else {
  const edge=fs.readFileSync(lightResponseFunctionPath,'utf8');
  for(const marker of ["admin.rpc('get_light_response_context'","admin.rpc('submit_light_response'","verify_jwt = false","location.hash","history.replaceState","cache-control':'no-store","referrer-policy':'no-referrer'"]){
    if(marker==='verify_jwt = false')continue;
    if(!edge.includes(marker)) failures.push(`light-response Edge Function missing security/UX marker: ${marker}`);
  }
  if(/phone_number|p_household_id|light_member_id/.test(edge)) failures.push('Public light-response Edge Function must not expose phone, household ids or member ids.');
  if(!edge.includes("o==='surprise'){submit('yes','surprise')")) failures.push('Surprends-moi must remain a one-click positive response.');
  if(!edge.includes("p_presence:presence,p_desire:desire")) failures.push('Public response submission must pass only token + response choices to the trusted RPC.');
}
const supabaseConfigPath=path.join(root,'supabase','config.toml');
const supabaseConfig=fs.existsSync(supabaseConfigPath)?fs.readFileSync(supabaseConfigPath,'utf8'):'';
if(!/\[functions\.light-response\][\s\S]*verify_jwt\s*=\s*false/i.test(supabaseConfig)) failures.push('light-response must explicitly disable JWT verification because lightweight members have no account.');
for(const role of ['public','anon','authenticated']){
  if(!new RegExp(String.raw`revoke\s+all\s+on\s+function\s+public\.get_light_response_context\(text\)\s+from\s+${role}`,'i').test(schema)) failures.push(`Light response context RPC must revoke execute from ${role}.`);
  if(!new RegExp(String.raw`revoke\s+all\s+on\s+function\s+public\.submit_light_response\(text,text,text\)\s+from\s+${role}`,'i').test(schema)) failures.push(`Light response submit RPC must revoke execute from ${role}.`);
}
for(const fn of ['get_light_response_context','submit_light_response']) if(!new RegExp(String.raw`grant\s+execute\s+on\s+function\s+public\.${fn}\([^;]+?\)\s+to\s+service_role`,'i').test(schema)) failures.push(`Light response RPC must grant execute to service_role only: ${fn}`);
if(!/revoke\s+all\s+on\s+table\s+public\.light_response_tokens\s+from\s+anon,\s*authenticated/i.test(schema)) failures.push('Light response token hashes must not be readable by browser/mobile roles.');
if(!/from\s+public\.light_meal_questions\s+where\s+id=v_token_row\.question_id\s+for\s+update/i.test(schema)) failures.push('Light response submission must lock the question before resolving take-charge concurrency.');
if(!/presence='take_charge'/i.test(schema)||!schema.includes('QUESTION_TAKEN_OVER')) failures.push('Light response backend must enforce a single take-charge winner.');
if(!/create\s+or\s+replace\s+function\s+public\.get_light_meal_summary\s*\(/i.test(schema)) failures.push('Light response backend must expose an organizer summary RPC.');

const subscriptionService=fs.readFileSync(path.join(src,'services','subscription.ts'),'utf8');
for(const marker of ["from('household_access')","functions.invoke('sync-household-access'","runtimeConfig.environment === 'production'"]) if(!subscriptionService.includes(marker)) failures.push(`Household subscription client wiring missing marker: ${marker}`);

// Premium enforcement P0: release setting is server-only and both RPC + RLS write paths use trusted helpers.
if(!/create\s+table\s+if\s+not\s+exists\s+public\.app_release_settings/i.test(schema)) failures.push('Premium enforcement invariant: app_release_settings table is missing.');
if(!/revoke\s+all\s+on\s+table\s+public\.app_release_settings\s+from\s+public,\s*anon,\s*authenticated/i.test(schema)) failures.push('Premium enforcement invariant: app_release_settings must be inaccessible to mobile roles.');
for(const fn of ['premium_enforcement_enabled','household_has_active_family','family_feature_allowed','can_write_household']) if(!new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${fn}\\s*\\(`,'i').test(schema)) failures.push(`Premium enforcement helper missing: ${fn}`);
for(const rpcName of ['create_recipe_with_ingredients','set_meal_slot','rebuild_weekly_shopping_list','add_recipe_to_shopping_list','upsert_pantry_item']){
  const matches=[...schema.matchAll(new RegExp(`create\\s+or\\s+replace\\s+function\\s+public\\.${rpcName}\\s*\\([\\s\\S]*?end; \\$\\$;`,'gi'))];
  const fn=matches.at(-1)?.[0]??'';
  if(!/public\.can_write_household\(p_household_id\)/i.test(fn)) failures.push(`Premium downgrade invariant: ${rpcName} must use can_write_household.`);
}
for(const table of ['recipes','recipe_ingredients','meal_plans','meal_participants','meal_guests','shopping_items','pantry_items','member_absences','shopping_responsibilities','recipe_feedback']){
  const policyBlock=[...schema.matchAll(new RegExp(`create\\s+policy\\s+[a-z0-9_]+\\s+on\\s+public\\.${table}\\s+for\\s+(?:insert|update|delete)[\\s\\S]*?;`,'gi'))].map(m=>m[0]).join(' ');
  if(!/can_write_household/i.test(policyBlock)) failures.push(`Premium downgrade RLS invariant missing can_write_household for ${table} write policies.`);
}

const verifyBackend=fs.readFileSync(path.join(root,'supabase','verify_backend.sql'),'utf8');
const assertBackendPath=path.join(root,'supabase','assert_backend.sql');
const assertBackend=fs.existsSync(assertBackendPath)?fs.readFileSync(assertBackendPath,'utf8'):'';
if(!assertBackend) failures.push('Missing fail-closed supabase/assert_backend.sql.');
for(const marker of ['BACKEND_ASSERT_RLS_DISABLED','BACKEND_ASSERT_REALTIME_MISSING','BACKEND_ASSERT_AVATAR_BUCKET_PUBLIC','BACKEND_ASSERT_RPC_SIGNATURE_MISSING','BACKEND_ASSERT_RPC_PUBLIC_EXECUTE','BACKEND_ASSERT_RPC_OVERLOAD_COUNT','BACKEND_ASSERT_MIGRATION_MISSING','BACKEND_ASSERT_LIGHT_RESPONSE_RPC_MISSING','BACKEND_ASSERT_LIGHT_RESPONSE_TOKEN_CLIENT_READ','BACKEND_ASSERT_ACCOUNT_DELETION_RPC_MISSING','BACKEND_ASSERT_ACCOUNT_DELETION_HOUSEHOLD_OWNER_FK','BACKEND_ASSERT_HOUSEHOLD_ACCESS_CLIENT_WRITE_PRIVILEGE','BACKEND_ASSERT_PREMIUM_SETTINGS_CLIENT_PRIVILEGE','BACKEND_ASSERT_PREMIUM_SETTINGS_MISSING','BACKEND_ASSERT_PREMIUM_HELPER_MISSING','NOTRE_TABLE_BACKEND_ASSERTIONS_PASS']) if(!assertBackend.includes(marker)) failures.push(`assert_backend.sql missing fail-closed marker: ${marker}`);
if(/has_function_privilege\s*\(\s*['"]public['"]/i.test(verifyBackend)) failures.push('verify_backend.sql must not treat PUBLIC as a named role in has_function_privilege.');
if(!/aclexplode\s*\(/i.test(verifyBackend)||!/grantee\s*=\s*0/i.test(verifyBackend)) failures.push('verify_backend.sql must inspect PUBLIC function privileges through ACL grantee OID 0.');
if(!verifyBackend.includes('profile_avatars_select')||!verifyBackend.includes('profile_avatars_insert')||!verifyBackend.includes('profile_avatars_delete')) failures.push('verify_backend.sql must verify avatar Storage policies remotely.');
if(!verifyBackend.includes('supabase_migrations.schema_migrations')) failures.push('verify_backend.sql must expose the expected applied migration history.');
if(!verifyBackend.includes('app_release_settings')||!verifyBackend.includes('premium_enforcement')||!verifyBackend.includes('can_write_household')) failures.push('verify_backend.sql must expose server-only Premium enforcement settings and helper signatures.');
if(!verifyBackend.includes('oidvectortypes(p.proargtypes)')||!verifyBackend.includes('signature_exists')||!verifyBackend.includes('unexpected_overload')) failures.push('verify_backend.sql must prove exact RPC signatures and expose stale overloads.');
const expectedRpcSignatures={
  create_household:'text',
  create_household_invitation:'uuid',
  join_household_by_code:'text',
  create_recipe_with_ingredients:'uuid, text, integer, integer, numeric, text[], text[], jsonb, text, text, text, text',
  set_meal_slot:'uuid, date, text, uuid, text, text, numeric, text, uuid, uuid, uuid[], text[]',
  rebuild_weekly_shopping_list:'uuid, date',
  copy_previous_week:'uuid, date',
  add_recipe_to_shopping_list:'uuid, date, uuid',
  upsert_pantry_item:'uuid, text, text, numeric, text, text, date',
  create_light_member:'uuid, text, text',
  upsert_light_meal_question:'uuid, date, text, text[], timestamp with time zone',
  issue_light_response_token:'uuid, uuid',
  get_light_meal_summary:'uuid',
};
for(const [name,args] of Object.entries(expectedRpcSignatures)){
  const marker=`('${name}','${args}')`;
  if(!verifyBackend.includes(marker)) failures.push(`verify_backend.sql missing exact RPC signature proof: ${name}(${args})`);
  if(!assertBackend.includes(marker)) failures.push(`assert_backend.sql missing exact RPC signature assertion: ${name}(${args})`);
}
const envExample=fs.readFileSync(path.join(root,'.env.example'),'utf8');
if(/EXPO_PUBLIC_.*(?:SERVICE_ROLE|SECRET_KEY)/i.test(envExample)) failures.push('Privileged Supabase secret must never be exposed through EXPO_PUBLIC_* variables.');
if(/service[_-]?role|sb_secret_/i.test(fs.readFileSync(path.join(src,'lib','supabase.ts'),'utf8'))) failures.push('Supabase client must not embed or refer to privileged keys.');

const migrations=fs.existsSync(migrationDir)?fs.readdirSync(migrationDir).filter(f=>f.endsWith('.sql')).sort():[];
if(!migrations.length) failures.push('No versioned Supabase migration exists.');
else notes.push(`Migrations: ${migrations.join(', ')}`);

for(const migration of migrations){
  const version=(migration.match(/^(\d+)/)||[])[1];
  if(version&&!verifyBackend.includes(`'${version}'`)) failures.push(`verify_backend.sql must require applied migration version: ${version}`);
  if(version&&!assertBackend.includes(`'${version}'`)) failures.push(`assert_backend.sql must require applied migration version: ${version}`);
}

// Every object replaced/created by a later migration must be reflected in schema.sql.
// When several migrations replace the same function/trigger, only the latest effective definition
// must match the snapshot; older definitions are historical by design.
const normalizeSql=(value)=>value.replace(/--.*$/gm,'').replace(/\s+/g,' ').trim().toLowerCase();
const normalizedSchema=normalizeSql(schema);
const effectiveObjects=new Map();
const privilegeStatements=[];
for(const migration of migrations.slice(1)){
  const sql=fs.readFileSync(path.join(migrationDir,migration),'utf8');
  let tracked=0;
  for(const match of sql.matchAll(/(create\s+or\s+replace\s+function\s+public\.([a-z0-9_]+)\s*\(([^)]*)\)[\s\S]*?\$\$;)/gi)){
    tracked++;
    const key=`function:${match[2].toLowerCase()}(${normalizeSql(match[3])})`;
    effectiveObjects.set(key,{sql:match[1],migration});
  }
  for(const match of sql.matchAll(/(create\s+trigger\s+([a-z0-9_]+)[\s\S]*?;)/gi)){
    tracked++;
    const key=`trigger:${match[2].toLowerCase()}`;
    effectiveObjects.set(key,{sql:match[1],migration});
  }
  for(const match of sql.matchAll(/(?:revoke\s+all|grant\s+execute)[\s\S]*?;/gi)){
    tracked++;
    privilegeStatements.push({sql:match[0],migration});
  }
  if(!tracked) failures.push(`Migration parity audit cannot identify any tracked SQL object in later migration: ${migration}`);
}
for(const {sql,migration} of effectiveObjects.values()){
  const normalized=normalizeSql(sql);
  if(normalized&&!normalizedSchema.includes(normalized)) failures.push(`Schema snapshot is missing or differs from the latest effective object defined in migration: ${migration}`);
}
for(const {sql,migration} of privilegeStatements){
  const normalized=normalizeSql(sql);
  if(normalized&&!normalizedSchema.includes(normalized)) failures.push(`Schema snapshot is missing a privilege statement from migration: ${migration}`);
}
if(migrations.length&&fs.readFileSync(path.join(migrationDir,migrations[0]),'utf8')!==schema) notes.push('Schema snapshot differs from the initial migration and later-migration parity was checked.');

console.log('Notre Table backend contract audit');
console.log(`- Client tables: ${tables.length} (${tables.join(', ')})`);
console.log(`- Client RPCs: ${rpcs.length} (${rpcs.join(', ')})`);
console.log(`- Realtime tables: ${realtimeTables.length} (${realtimeTables.join(', ')})`);
for(const n of notes)console.log(`- NOTE: ${n}`);
if(failures.length){for(const f of failures)console.error(`- FAIL: ${f}`);process.exit(1);}
console.log('PASS');
