#!/usr/bin/env node
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const failures=[];
const notes=[];
const readJson=(name)=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));

const pkg=readJson('package.json');
const app=readJson('app.json');
const eas=readJson('eas.json');
const appSource=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
const runtime=fs.readFileSync(path.join(root,'src/lib/runtimeConfig.ts'),'utf8');
const auth=fs.readFileSync(path.join(root,'src/screens/AuthScreen.tsx'),'utf8');
const subscription=fs.readFileSync(path.join(root,'src/services/subscription.ts'),'utf8');
const privacyService=fs.readFileSync(path.join(root,'src/services/privacy.ts'),'utf8');
const revenueCatAdapterPath=path.join(root,'src','services','revenuecat.ts');
const hasRevenueCatAdapter=fs.existsSync(revenueCatAdapterPath);
const hasRevenueCatDependency=Boolean(pkg?.dependencies?.['react-native-purchases']||pkg?.devDependencies?.['react-native-purchases']);
if(hasRevenueCatAdapter!==hasRevenueCatDependency) failures.push('RevenueCat invariant: adapter and react-native-purchases dependency must appear together; orphan test fixtures are forbidden.');

if(pkg.version!==app?.expo?.version) failures.push(`Version mismatch: package=${pkg.version} app=${app?.expo?.version}`);
const lockPath=path.join(root,'package-lock.json');
if(!fs.existsSync(lockPath)) failures.push('Missing committed package-lock.json after network bootstrap.');
else {
  const lock=readJson('package-lock.json');
  if(lock.lockfileVersion!==3) failures.push(`package-lock.json must use lockfileVersion 3, got ${lock.lockfileVersion}.`);
  if(lock.name!==pkg.name||lock?.packages?.['']?.name!==pkg.name) failures.push('package-lock.json package identity must match package.json.');
  if(lock.version!==pkg.version||lock?.packages?.['']?.version!==pkg.version) failures.push('package-lock.json root version must match package.json.');
}

if(!app?.expo?.ios?.bundleIdentifier) failures.push('Missing iOS bundleIdentifier.');
if(!app?.expo?.android?.package) failures.push('Missing Android package name.');
const expectedNode='22.16.0';
const workflow=fs.readFileSync(path.join(root,'.github','workflows','validate.yml'),'utf8');
const bootstrapWorkflowPath=path.join(root,'.github','workflows','bootstrap-lockfile.yml');
const bootstrapWorkflow=fs.existsSync(bootstrapWorkflowPath)?fs.readFileSync(bootstrapWorkflowPath,'utf8'):'';
const buildProfiles=Object.keys(eas?.build||{}).sort();
if(JSON.stringify(buildProfiles)!==JSON.stringify(['preview','production'])) failures.push('EAS must expose only preview and production as buildable profiles; technical base profiles are forbidden.');
if(eas?.build?.preview?.node!==expectedNode||eas?.build?.production?.node!==expectedNode) failures.push(`EAS preview and production must both pin Node ${expectedNode}.`);
if(!workflow.includes(`node-version: '${expectedNode}'`)) failures.push(`GitHub validation must use the same Node ${expectedNode} runtime as EAS.`);
if(!workflow.includes("CI: '1'")) failures.push('GitHub installed validation must force CI mode for non-interactive Expo dependency checks.');
if(pkg?.scripts?.['validate:expo-deps']!=='expo install --check') failures.push('Installed validation must run Expo SDK dependency compatibility check.');
if(!pkg?.scripts?.['validate:installed']?.startsWith('npm run validate:expo-deps && ')) failures.push('validate:installed must fail on Expo dependency incompatibility before typecheck/export.');
if(!workflow.includes('npm ci --no-audit --no-fund')) failures.push('GitHub validation must install only from the committed lockfile with npm ci.');
if(workflow.includes('npm install ')) failures.push('Main GitHub validation must never bootstrap dependencies with npm install.');
if(!workflow.includes('package-lock.json is required for reproducible validation')) failures.push('Main GitHub validation must fail closed when package-lock.json is absent.');
const actionPins={
  'actions/checkout':'11d5960a326750d5838078e36cf38b85af677262',
  'actions/setup-node':'49933ea5288caeca8642d1e84afbd3f7d6820020',
  'actions/upload-artifact':'ea165f8d65b6e75b540449e92b4886f43607fa02',
};
for(const [action,sha] of Object.entries(actionPins)){
  for(const [label,source] of [['validate',workflow],['bootstrap',bootstrapWorkflow]]){
    if(!source.includes(`${action}@${sha}`)) failures.push(`${label} workflow must pin ${action} to reviewed commit ${sha}.`);
  }
}
for(const [label,source] of [['validate',workflow],['bootstrap',bootstrapWorkflow]]){
  if(!source.includes('permissions:\n  contents: read')) failures.push(`${label} workflow must use least-privilege contents: read.`);
  if(!source.includes('persist-credentials: false')) failures.push(`${label} checkout must not persist the GitHub token.`);
  const mutableUses=[...source.matchAll(/uses:\s+([^\s#]+)@([^\s#]+)/g)].filter(([,action,ref])=>action.startsWith('actions/')&&!/^[a-f0-9]{40}$/i.test(ref));
  if(mutableUses.length) failures.push(`${label} workflow contains mutable official action refs: ${mutableUses.map(m=>m[0]).join(', ')}`);
}
if(!workflow.includes('actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02')||!workflow.includes('.validation/')) failures.push('GitHub validation must preserve Expo export evidence as an artifact using the pinned upload action.');
if(pkg?.engines?.node!=='22.16.x'||pkg?.engines?.npm!=='10.9.x'||pkg?.packageManager!=='npm@10.9.2') failures.push('package.json must declare the exact release Node/npm toolchain line.');
if(!fs.readFileSync(path.join(root,'.gitignore'),'utf8').split(/\r?\n/).includes('.validation/')) failures.push('.validation/ must be gitignored so CI export evidence cannot be committed accidentally.');
if(!bootstrapWorkflow.includes('workflow_dispatch:')||!bootstrapWorkflow.includes('npm install --package-lock-only --ignore-scripts --no-audit --no-fund')) failures.push('A manual lockfile bootstrap workflow must generate the first lockfile without mutating the main CI lane.');
if(!bootstrapWorkflow.includes('npm ci --no-audit --no-fund')||!bootstrapWorkflow.includes('npm run ci:validate')) failures.push('Lockfile bootstrap must prove the generated lockfile by reinstalling and running full installed validation.');
if(!bootstrapWorkflow.includes('notre-table-package-lock-')) failures.push('Lockfile bootstrap must preserve the generated package-lock.json as a reviewable artifact.');
if(eas?.build?.preview?.environment!=='preview') failures.push('EAS preview profile must use the preview environment.');
if(eas?.build?.production?.environment!=='production') failures.push('EAS production profile must use the production environment.');
if(eas?.build?.production?.env?.EXPO_PUBLIC_APP_ENV!=='production') failures.push('Production profile must set EXPO_PUBLIC_APP_ENV=production.');
if(eas?.build?.preview?.env?.EXPO_PUBLIC_APP_ENV!=='preview') failures.push('Preview profile must set EXPO_PUBLIC_APP_ENV=preview.');
if(!app?.expo?.android?.blockedPermissions?.includes('android.permission.RECORD_AUDIO')) failures.push('Android RECORD_AUDIO must remain explicitly blocked because Notre Table has no audio feature.');
if(app?.expo?.ios?.config?.usesNonExemptEncryption!==false) failures.push('iOS export compliance must explicitly declare usesNonExemptEncryption=false for the current runtime.');
for(const permission of ['android.permission.SCHEDULE_EXACT_ALARM','android.permission.USE_EXACT_ALARM']){
  if(!app?.expo?.android?.blockedPermissions?.includes(permission)) failures.push(`Android ${permission.split('.').pop()} must remain explicitly blocked; local reminders intentionally use Expo SDK 57 inexact fallback instead of restricted exact-alarm access.`);
}
if(!runtime.includes("allowDemo = environment !== 'production'")) failures.push('Runtime config must disable demo mode in production.');
for(const marker of ['EXPO_PUBLIC_ACCOUNT_DELETION_WEB_URL','EXPO_PUBLIC_PRIVACY_POLICY_URL','EXPO_PUBLIC_REVENUECAT_IOS_API_KEY','EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY','EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID','REVENUECAT_SECRET_KEY_FORBIDDEN']) if(!runtime.includes(marker)) failures.push(`Runtime RevenueCat guard missing marker: ${marker}`);
if(!appSource.includes("runtimeConfig.allowDemo?enterDemo:undefined")) failures.push('App must hide demo entry points when runtimeConfig forbids demo.');
if(!auth.includes('onDemo?<Text')) failures.push('AuthScreen must make demo entry conditional.');
if(pkg?.scripts?.['eas-build-pre-install']!=='node scripts/eas-build-pre-install.cjs') failures.push('EAS release safety gate must run before dependency installation.');
if(pkg?.scripts?.['release:gate-test']!=='node scripts/eas-build-pre-install-tests.cjs') failures.push('EAS release gate tests must remain wired into package.json.');
if(pkg?.scripts?.['continuity:audit']!=='node scripts/continuity-audit.cjs') failures.push('continuity:audit must remain wired into package.json.');
const sourceHygienePath=path.join(root,'scripts','source-hygiene-audit.cjs');
if(!fs.existsSync(sourceHygienePath)) failures.push('Missing source hygiene audit.');
if(pkg?.scripts?.['source:hygiene:audit']!=='node scripts/source-hygiene-audit.cjs') failures.push('source:hygiene:audit must remain wired into package.json.');
if(!String(pkg?.scripts?.verify||'').includes('npm run source:hygiene:audit')) failures.push('verify must execute source:hygiene:audit.');

const betaAcceptancePath=path.join(root,'scripts','beta-acceptance-audit.cjs');
if(!fs.existsSync(betaAcceptancePath)) failures.push('Missing beta acceptance evidence gate.');
if(pkg?.scripts?.['beta:acceptance:audit']!=='node scripts/beta-acceptance-audit.cjs') failures.push('beta:acceptance:audit must remain wired into package.json.');
if(!fs.existsSync(path.join(root,'docs','BETA_ACCEPTANCE.md'))||!fs.existsSync(path.join(root,'docs','beta-acceptance.example.json'))) failures.push('Beta acceptance protocol and example evidence must remain versioned.');

const releaseDoctorPath=path.join(root,'scripts','release-doctor.cjs');
if(!fs.existsSync(releaseDoctorPath)) failures.push('Missing release doctor.');
if(pkg?.scripts?.['release:doctor']!=='node scripts/release-doctor.cjs') failures.push('release:doctor must remain wired into package.json.');
if(pkg?.scripts?.['release:doctor:strict']!=='node scripts/release-doctor.cjs --strict') failures.push('release:doctor:strict must remain wired into package.json.');
if(fs.existsSync(releaseDoctorPath)){
  const doctor=fs.readFileSync(releaseDoctorPath,'utf8');
  for(const marker of ['release-doctor.json','Installed validation / CI','Supabase development backend','EAS preview build','Production billing / Stores']) if(!doctor.includes(marker)) failures.push(`Release doctor missing marker: ${marker}`);
  for(const forbidden of ['process.env.SUPABASE_SERVICE_ROLE_KEY)','process.env.REVENUECAT_SECRET_API_KEY)','process.env.EXPO_TOKEN)']) if(doctor.includes(`console.log(${forbidden}`)) failures.push('Release doctor must never print sensitive environment values.');
}

const easGatePath=path.join(root,'scripts','eas-build-pre-install.cjs');
if(!fs.existsSync(easGatePath)) failures.push('Missing EAS release safety gate.');
else {
  const easGate=fs.readFileSync(easGatePath,'utf8');
  for(const marker of ['EAS_BUILD_PROFILE','requires a committed package-lock.json','EAS_NO_FROZEN_LOCKFILE','unsupported EAS build profile','profile/environment mismatch','requires valid public Supabase configuration','requires HTTPS account-deletion API','platform-specific RevenueCat public SDK keys','react-native-purchases','Purchases.logIn','Purchases.logOut','syncRevenueCatUser','clearRevenueCatIdentityAfterDeletion','end-to-end RevenueCat wiring','household-scoped access','versioned local brand assets']) if(!easGate.includes(marker)) failures.push(`EAS release gate missing fail-closed marker: ${marker}`);
}
if(!fs.existsSync(path.join(root,'scripts','eas-build-pre-install-tests.cjs'))) failures.push('Missing EAS release gate regression tests.');
if(!subscription.includes("runtimeConfig.environment === 'preview'")) failures.push('Preview builds must grant beta family access without fake purchases.');
if(!subscription.includes("PRODUCTION_BILLING_NOT_CONFIGURED")) failures.push('Local trial preview must fail closed in production.');
if(!subscription.includes("runtimeConfig.environment === 'production'")||!subscription.includes("source:'revenuecat'")&&!subscription.includes("source: 'revenuecat'")) failures.push('Production access must fail closed to RevenueCat instead of trusting local preview state.');
for(const marker of ["from('household_access')","functions.invoke('sync-household-access'",'last server-side household value']) if(!subscription.includes(marker)) failures.push(`Production household billing mirror missing marker: ${marker}`);
if(!privacyService.includes("signOut({scope:'local'})")) failures.push('Successful permanent account deletion must clear only the local cached session.');
const householdAccessFunctionPath=path.join(root,'supabase','functions','sync-household-access','index.ts');
if(!fs.existsSync(householdAccessFunctionPath)) failures.push('Production household billing requires the trusted sync-household-access Edge Function source.');
else {
  const householdAccessFunction=fs.readFileSync(householdAccessFunctionPath,'utf8');
  for(const marker of ['REVENUECAT_SECRET_API_KEY','REVENUECAT_ENTITLEMENT_ID','api.revenuecat.com/v1/subscribers',"from('household_access')",'payer_user_id']) if(!householdAccessFunction.includes(marker)) failures.push(`Household RevenueCat sync guard missing marker: ${marker}`);
}
const deleteAccountFunctionPath=path.join(root,'supabase','functions','delete-account','index.ts');
if(!fs.existsSync(deleteAccountFunctionPath)) failures.push('Production account deletion requires the trusted Supabase Edge Function source.');
else {
  const deleteAccountFunction=fs.readFileSync(deleteAccountFunctionPath,'utf8');
  for(const marker of ['REVENUECAT_CUSTOMER_DELETION_ENABLED','REVENUECAT_SECRET_API_KEY','api.revenuecat.com/v1/subscribers','revenuecat_customer_deleted']) if(!deleteAccountFunction.includes(marker)) failures.push(`Account deletion RevenueCat erasure guard missing marker: ${marker}`);
}
const privacyScreen=fs.readFileSync(path.join(root,'src','screens','PrivacyDataScreen.tsx'),'utf8');
for(const marker of ['apps.apple.com/account/subscriptions','play.google.com/store/account/subscriptions','privacy.subscriptionWarning','privacy.manageSubscription']) if(!privacyScreen.includes(marker)) failures.push(`Account deletion subscription-warning guard missing marker: ${marker}`);
const authServicePath=path.join(root,'src','services','auth.ts');
const authLinksPath=path.join(root,'src','lib','authLinks.ts');
const passwordRecoveryPath=path.join(root,'src','screens','PasswordRecoveryScreen.tsx');
if(!fs.existsSync(authServicePath)||!fs.existsSync(authLinksPath)||!fs.existsSync(passwordRecoveryPath)) failures.push('Native email confirmation/password-recovery deep-link flow is incomplete.');
else {
  const authService=fs.readFileSync(authServicePath,'utf8');
  const recoveryScreen=fs.readFileSync(passwordRecoveryPath,'utf8');
  for(const marker of ['exchangeCodeForSession','setSession','verifyOtp']) if(!authService.includes(marker)) failures.push(`Native auth deep-link consumer missing marker: ${marker}`);
  if(!recoveryScreen.includes('auth.updateUser({password})')) failures.push('Password recovery screen must update the authenticated user password.');
  if(!auth.includes('resetPasswordForEmail')||!auth.includes("Linking.createURL('auth/recovery')")||!auth.includes("Linking.createURL('auth/callback')")) failures.push('Auth screen must configure signup confirmation and password reset redirects back to the native app.');
  if(!appSource.includes('consumeAuthLink')||!appSource.includes('PasswordRecoveryScreen')) failures.push('App root must consume native Supabase auth links and surface password recovery.');
}

const releaseEvidencePath=path.join(root,'scripts','release-evidence.cjs');
if(!fs.existsSync(releaseEvidencePath)) failures.push('Missing release evidence manifest generator.');
else {
  const evidence=fs.readFileSync(releaseEvidencePath,'utf8');
  for(const marker of ['sha256','release_contract_sha256','package_lock_sha256','supabase/migrations','supabase/functions']) if(!evidence.includes(marker)) failures.push(`Release evidence generator missing marker: ${marker}`);
}
if(pkg?.scripts?.['release:evidence']!=='node scripts/release-evidence.cjs') failures.push('release:evidence must remain wired in package.json.');
if(!workflow.includes('npm run release:evidence')||!bootstrapWorkflow.includes('npm run release:evidence')) failures.push('Both networked validation workflows must generate the release evidence manifest.');

if(!fs.existsSync(path.join(root,'.github','workflows','validate.yml'))) failures.push('Missing GitHub validation workflow.');
if(!fs.existsSync(bootstrapWorkflowPath)) failures.push('Missing manual npm lockfile bootstrap workflow.');
if(!fs.existsSync(path.join(root,'docs','RELEASE_LANE.md'))) failures.push('Missing release-lane documentation.');
if(fs.existsSync(path.join(root,'package-lock.json'))) notes.push('npm lockfile present for reproducible installs.');
else notes.push('npm lockfile absent: reproducible installed validation remains an external release blocker.');
if(!appSource.includes("signOut({scope:'local'})")) failures.push('Sign-out must explicitly target only the current device session.');
if(!appSource.includes('activeUserIdRef')||!appSource.includes('householdGateRef')) failures.push('Session/account switching guard is missing.');
if(app?.expo?.extra?.eas?.projectId) notes.push('EAS projectId is already configured.');
else notes.push('EAS projectId intentionally not invented; it will be added only after a real Expo project is connected.');

console.log('Notre Table release audit');
console.log(`- Version: ${pkg.version}`);
console.log(`- iOS: ${app?.expo?.ios?.bundleIdentifier}`);
console.log(`- Android: ${app?.expo?.android?.package}`);
for(const note of notes) console.log(`- NOTE: ${note}`);
if(failures.length){for(const failure of failures)console.error(`- FAIL: ${failure}`);process.exit(1);}
console.log('PASS');
