#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
const gate=path.join(__dirname,'eas-build-pre-install.cjs');
const root=path.resolve(__dirname,'..');
const lockfile=path.join(root,'package-lock.json');
const hadLockfile=fs.existsSync(lockfile);
const originalLockfile=hadLockfile?fs.readFileSync(lockfile):null;
const packagePath=path.join(root,'package.json');
const appPath=path.join(root,'app.json');
const adapterPath=path.join(root,'src','services','revenuecat.ts');
const baselinePackage=fs.readFileSync(packagePath);
const baselineApp=fs.readFileSync(appPath);
const baselineAdapterExists=fs.existsSync(adapterPath);
const baselineAdapter=baselineAdapterExists?fs.readFileSync(adapterPath):null;
if(!hadLockfile)fs.writeFileSync(lockfile,JSON.stringify({name:'notre-table-gate-test',lockfileVersion:3},null,2)+'\n');
process.on('exit',()=>{try{if(hadLockfile&&originalLockfile)fs.writeFileSync(lockfile,originalLockfile);else if(!hadLockfile&&fs.existsSync(lockfile))fs.unlinkSync(lockfile);}catch{}});

const base={...process.env};
for(const key of ['EAS_BUILD','EAS_BUILD_PROFILE','EAS_NO_FROZEN_LOCKFILE','EXPO_PUBLIC_APP_ENV','EXPO_PUBLIC_SUPABASE_URL','EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY','EXPO_PUBLIC_REVENUECAT_IOS_API_KEY','EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY','EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID','EXPO_PUBLIC_ACCOUNT_DELETION_ENDPOINT','EXPO_PUBLIC_ACCOUNT_DELETION_WEB_URL','EXPO_PUBLIC_PRIVACY_POLICY_URL']) delete base[key];
const backend={EXPO_PUBLIC_SUPABASE_URL:'https://notre-table-smoke.supabase.co',EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_notre_table_smoke'};
const billing={EXPO_PUBLIC_REVENUECAT_IOS_API_KEY:'appl_notre_table_smoke',EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY:'goog_notre_table_smoke',EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID:'family'};
const compliance={EXPO_PUBLIC_ACCOUNT_DELETION_ENDPOINT:'https://api.notre-table.example/delete-account',EXPO_PUBLIC_ACCOUNT_DELETION_WEB_URL:'https://www.notre-table.example/delete-account',EXPO_PUBLIC_PRIVACY_POLICY_URL:'https://www.notre-table.example/privacy'};
let passed=0;
function run(name,env,expectedStatus,pattern){
  const result=spawnSync(process.execPath,[gate],{env:{...base,...env},encoding:'utf8'});
  const output=`${result.stdout||''}\n${result.stderr||''}`;
  if(result.status!==expectedStatus||!pattern.test(output)){
    throw new Error(`FAIL ${name}\n${output.trim()}`);
  }
  passed++;console.log(`PASS ${name}`);
}
function withoutLockfile(task){
  const bytes=fs.readFileSync(lockfile);
  fs.unlinkSync(lockfile);
  try{task();}finally{fs.writeFileSync(lockfile,bytes);}
}
function withFakeBrandAssets(task){
  const appBytes=fs.readFileSync(appPath);
  const app=JSON.parse(appBytes.toString('utf8'));
  const assetsDir=path.join(root,'.validation','gate-brand-assets');
  fs.mkdirSync(assetsDir,{recursive:true});
  const icon=path.join(assetsDir,'icon.png');
  const adaptive=path.join(assetsDir,'adaptive.png');
  fs.writeFileSync(icon,'synthetic-test-icon');
  fs.writeFileSync(adaptive,'synthetic-test-adaptive');
  app.expo.icon=path.relative(root,icon).split(path.sep).join('/');
  app.expo.android={...(app.expo.android||{}),adaptiveIcon:{foregroundImage:path.relative(root,adaptive).split(path.sep).join('/'),backgroundColor:'#FFFFFF'}};
  fs.writeFileSync(appPath,JSON.stringify(app,null,2)+'\n');
  try{task();}finally{fs.writeFileSync(appPath,appBytes);fs.rmSync(assetsDir,{recursive:true,force:true});}
}
function withFakeRevenueCatAdapter(task){
  const packageBytes=fs.readFileSync(packagePath);
  const hadAdapter=fs.existsSync(adapterPath);
  const adapterBytes=hadAdapter?fs.readFileSync(adapterPath):null;
  const pkg=JSON.parse(packageBytes.toString('utf8'));
  pkg.dependencies={...(pkg.dependencies||{}),'react-native-purchases':'9.0.0'};
  fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
  fs.writeFileSync(adapterPath,"export const fakeRevenueCat=true;\n");
  try{task();}finally{
    fs.writeFileSync(packagePath,packageBytes);
    if(hadAdapter&&adapterBytes)fs.writeFileSync(adapterPath,adapterBytes);else if(fs.existsSync(adapterPath))fs.unlinkSync(adapterPath);
  }
}
function withUnwiredRevenueCatAdapter(task){
  const packageBytes=fs.readFileSync(packagePath);
  const hadAdapter=fs.existsSync(adapterPath);
  const adapterBytes=hadAdapter?fs.readFileSync(adapterPath):null;
  const pkg=JSON.parse(packageBytes.toString('utf8'));
  pkg.dependencies={...(pkg.dependencies||{}),'react-native-purchases':'9.0.0'};
  fs.writeFileSync(packagePath,JSON.stringify(pkg,null,2)+'\n');
  fs.writeFileSync(adapterPath,`import Purchases from 'react-native-purchases';
export async function syncRevenueCatUser(userId){
 Purchases.configure({apiKey:'public',appUserID:userId});
 await Purchases.logIn(userId);
 await Purchases.getOfferings();
 await Purchases.getCustomerInfo();
 await Purchases.purchasePackage({} as any);
 await Purchases.restorePurchases();
 const entitlements={active:{}};
 const activeEntitlements=entitlements.active;
 const entitlementId=runtimeConfig.revenueCat.entitlementId;
 if(false) await Purchases.logOut();
 return {entitlements,activeEntitlements,entitlementId};
}
export async function clearRevenueCatIdentityAfterDeletion(){ await Purchases.logOut(); }
const runtimeConfig={revenueCat:{entitlementId:'family'}};
`);
  try{task();}finally{
    fs.writeFileSync(packagePath,packageBytes);
    if(hadAdapter&&adapterBytes)fs.writeFileSync(adapterPath,adapterBytes);else if(fs.existsSync(adapterPath))fs.unlinkSync(adapterPath);
  }
}
run('local development remains available without remote backend',{},0,/PASS EAS pre-install gate \(development\)/);
withoutLockfile(()=>run('EAS refuses a missing committed npm lockfile',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'preview',EXPO_PUBLIC_APP_ENV:'preview',...backend},1,/requires a committed package-lock\.json/));
run('EAS refuses frozen-lockfile bypass',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'preview',EAS_NO_FROZEN_LOCKFILE:'1',EXPO_PUBLIC_APP_ENV:'preview',...backend},1,/must not disable immutable dependency installation/);
run('preview EAS requires real backend',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'preview',EXPO_PUBLIC_APP_ENV:'preview'},1,/requires valid public Supabase configuration/);
run('preview EAS with backend passes release gate',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'preview',EXPO_PUBLIC_APP_ENV:'preview',...backend},0,/PASS EAS pre-install gate \(preview\)/);
run('unsupported technical profile cannot bypass release gate',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'base',EXPO_PUBLIC_APP_ENV:'development',...backend},1,/unsupported EAS build profile/);
run('profile and app environment must match',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'preview',EXPO_PUBLIC_APP_ENV:'production',...backend},1,/profile\/environment mismatch/);
run('privileged Supabase key is rejected',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'preview',EXPO_PUBLIC_APP_ENV:'preview',EXPO_PUBLIC_SUPABASE_URL:backend.EXPO_PUBLIC_SUPABASE_URL,EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_secret_forbidden'},1,/requires valid public Supabase configuration/);
run('legacy JWT API key is rejected from public EAS config',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'preview',EXPO_PUBLIC_APP_ENV:'preview',EXPO_PUBLIC_SUPABASE_URL:backend.EXPO_PUBLIC_SUPABASE_URL,EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature'},1,/requires valid public Supabase configuration/);
run('production requires store-compliance URLs',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'production',EXPO_PUBLIC_APP_ENV:'production',...backend},1,/requires HTTPS account-deletion API/);
run('production rejects non-HTTPS store-compliance URLs',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'production',EXPO_PUBLIC_APP_ENV:'production',...backend,...compliance,EXPO_PUBLIC_PRIVACY_POLICY_URL:'http://not-secure.example/privacy'},1,/requires HTTPS account-deletion API/);
run('production requires RevenueCat public configuration',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'production',EXPO_PUBLIC_APP_ENV:'production',...backend,...compliance},1,/platform-specific RevenueCat public SDK keys/);
run('production rejects RevenueCat secret keys in public config',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'production',EXPO_PUBLIC_APP_ENV:'production',...backend,...compliance,...billing,EXPO_PUBLIC_REVENUECAT_IOS_API_KEY:'sk_forbidden'},1,/platform-specific RevenueCat public SDK keys/);
run('production rejects missing versioned brand assets',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'production',EXPO_PUBLIC_APP_ENV:'production',...backend,...compliance,...billing},1,/requires versioned local brand assets/);
withFakeBrandAssets(()=>run('production remains blocked until real billing adapter exists',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'production',EXPO_PUBLIC_APP_ENV:'production',...backend,...compliance,...billing},1,/real RevenueCat adapter and react-native-purchases/));
withFakeBrandAssets(()=>withFakeRevenueCatAdapter(()=>run('production rejects a placeholder RevenueCat adapter',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'production',EXPO_PUBLIC_APP_ENV:'production',...backend,...compliance,...billing},1,/real RevenueCat adapter and react-native-purchases/)));
withFakeBrandAssets(()=>withUnwiredRevenueCatAdapter(()=>run('production rejects a real-looking adapter that is not wired to access/paywalls',{EAS_BUILD:'true',EAS_BUILD_PROFILE:'production',EXPO_PUBLIC_APP_ENV:'production',...backend,...compliance,...billing},1,/end-to-end RevenueCat wiring/)));
if(!fs.readFileSync(packagePath).equals(baselinePackage)) throw new Error('Gate-test cleanup failed: package.json was not restored byte-for-byte.');
if(!fs.readFileSync(appPath).equals(baselineApp)) throw new Error('Gate-test cleanup failed: app.json was not restored byte-for-byte.');
if(fs.existsSync(adapterPath)!==baselineAdapterExists) throw new Error('Gate-test cleanup failed: RevenueCat adapter existence changed.');
if(baselineAdapterExists&&!fs.readFileSync(adapterPath).equals(baselineAdapter)) throw new Error('Gate-test cleanup failed: RevenueCat adapter bytes changed.');
console.log(`EAS gate tests: ${passed}/${passed} passed`);
