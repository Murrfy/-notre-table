#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const env=String(process.env.EXPO_PUBLIC_APP_ENV||'development').trim().toLowerCase();
const easBuild=/^(1|true)$/i.test(String(process.env.EAS_BUILD||''));
const profile=String(process.env.EAS_BUILD_PROFILE||'').trim().toLowerCase();
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));

function clean(value){const v=String(value||'').trim();return v||undefined;}
function isPlaceholder(value){return Boolean(value&&/YOUR_|example\.com|YOUR_PROJECT/i.test(value));}
function isUnsafePublicKey(value){return Boolean(value&&(/service[_-]?role/i.test(value)||/^sb_secret_/i.test(value)));}
function isSupportedPublishableKey(value){return Boolean(value&&/^sb_publishable_[A-Za-z0-9_-]+$/.test(value));}
function isHttpsUrl(value){try{const parsed=new URL(value);return parsed.protocol==='https:'&&Boolean(parsed.hostname);}catch{return false;}}
function validPublicBackend(){
  const url=clean(process.env.EXPO_PUBLIC_SUPABASE_URL);
  const key=clean(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return Boolean(url&&key&&!isPlaceholder(url)&&!isPlaceholder(key)&&isHttpsUrl(url)&&!isUnsafePublicKey(key)&&isSupportedPublishableKey(key));
}


function validHttpsPublicUrl(name){
  const value=clean(process.env[name]);
  return Boolean(value&&!isPlaceholder(value)&&isHttpsUrl(value));
}
function validStoreComplianceConfig(){
  return validHttpsPublicUrl('EXPO_PUBLIC_ACCOUNT_DELETION_ENDPOINT')&&
    validHttpsPublicUrl('EXPO_PUBLIC_ACCOUNT_DELETION_WEB_URL')&&
    validHttpsPublicUrl('EXPO_PUBLIC_PRIVACY_POLICY_URL');
}
function validRevenueCatConfig(){
  const ios=clean(process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY);
  const android=clean(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY);
  const entitlement=clean(process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID);
  return Boolean(
    ios&&android&&entitlement&&
    /^appl_[A-Za-z0-9_-]+$/.test(ios)&&
    /^goog_[A-Za-z0-9_-]+$/.test(android)&&
    !/^sk_/i.test(ios)&&!/^sk_/i.test(android)&&
    /^[A-Za-z0-9._-]+$/.test(entitlement)
  );
}
function versionedLocalAsset(value){
  const v=clean(value);
  if(!v||/^https?:\/\//i.test(v)) return false;
  return fs.existsSync(path.resolve(root,v));
}
function validProductionBrandAssets(){
  const icon=app?.expo?.icon;
  const adaptive=app?.expo?.android?.adaptiveIcon;
  return versionedLocalAsset(icon)&&versionedLocalAsset(adaptive?.foregroundImage)&&/^#[0-9A-Fa-f]{6}$/.test(String(adaptive?.backgroundColor||''));
}
function block(message){console.error(`BLOCKED: ${message}`);process.exit(1);}

if(easBuild){
  if(!fs.existsSync(path.join(root,'package-lock.json'))) block('EAS build requires a committed package-lock.json so dependency installation stays reproducible.');
  if(/^(1|true)$/i.test(String(process.env.EAS_NO_FROZEN_LOCKFILE||''))) block('EAS_NO_FROZEN_LOCKFILE must not disable immutable dependency installation.');
  if(profile!=='preview'&&profile!=='production') block(`unsupported EAS build profile "${profile||'missing'}"; only preview and production are permitted.`);
  if(env!==profile) block(`EAS profile/environment mismatch: profile=${profile}, EXPO_PUBLIC_APP_ENV=${env}.`);
  if(!validPublicBackend()) block(`EAS ${profile} build requires valid public Supabase configuration from the selected EAS environment.`);
}

const productionRequired=profile==='production'||env==='production';
if(!productionRequired){
  console.log(`PASS EAS pre-install gate (${easBuild?profile:env}): release backend/profile checks satisfied; production billing gate not required.`);
  process.exit(0);
}

if(!validPublicBackend()) block('production build requires valid public Supabase configuration.');
if(!validStoreComplianceConfig()) block('production build requires HTTPS account-deletion API, account-deletion web resource, and privacy-policy URLs for store compliance.');
if(!validRevenueCatConfig()) block('production build requires platform-specific RevenueCat public SDK keys and a valid entitlement identifier. Secret sk_* keys are forbidden in EXPO_PUBLIC_* variables.');
if(!validProductionBrandAssets()){
  block('production build requires versioned local brand assets: expo.icon plus android.adaptiveIcon.foregroundImage and a six-digit adaptiveIcon.backgroundColor. Preview builds remain allowed until final brand assets are supplied.');
}
const deps={...(pkg.dependencies||{}),...(pkg.devDependencies||{})};
const hasRevenueCat=Boolean(deps['react-native-purchases']);
const adapter=path.join(root,'src','services','revenuecat.ts');
function hasRealRevenueCatAdapter(){
  if(!hasRevenueCat||!fs.existsSync(adapter)) return false;
  const source=fs.readFileSync(adapter,'utf8');
  const markers=[
    "from 'react-native-purchases'",
    'Purchases.configure',
    'appUserID',
    'Purchases.logIn',
    'Purchases.logOut',
    'syncRevenueCatUser',
    'clearRevenueCatIdentityAfterDeletion',
    'Purchases.getOfferings',
    'Purchases.purchasePackage',
    'Purchases.restorePurchases',
    'Purchases.getCustomerInfo',
    'entitlements.active',
    'runtimeConfig.revenueCat.entitlementId',
  ];
  return markers.every(marker=>source.includes(marker));
}
if(!hasRealRevenueCatAdapter()){
  block('production build requires the real RevenueCat adapter and react-native-purchases with identified-user configuration, logIn account switching, deletion logOut, Offerings, purchase, restore, CustomerInfo, and entitlement checks. Internal preview builds remain allowed for beta testing.');
}
function hasEndToEndRevenueCatWiring(){
  const app=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
  const privacy=fs.readFileSync(path.join(root,'src','services','privacy.ts'),'utf8');
  const main=fs.readFileSync(path.join(root,'src','screens','MainScreen.tsx'),'utf8');
  const planning=fs.readFileSync(path.join(root,'src','screens','PlanningScreen.tsx'),'utf8');
  const recipes=fs.readFileSync(path.join(root,'src','screens','RecipesScreen.tsx'),'utf8');
  const household=fs.readFileSync(path.join(root,'src','screens','HouseholdDashboardScreen.tsx'),'utf8');
  const subscription=fs.readFileSync(path.join(root,'src','services','subscription.ts'),'utf8');
  const householdSyncPath=path.join(root,'supabase','functions','sync-household-access','index.ts');
  const householdSync=fs.existsSync(householdSyncPath)?fs.readFileSync(householdSyncPath,'utf8'):'';
  // Production is not ready merely because an SDK file exists. Supabase auth changes
  // must drive RevenueCat identity, permanent deletion must clear the SDK identity,
  // CustomerInfo/Store Offerings must reach every paywall, and the effective entitlement
  // must be mirrored server-side at household scope so one purchase unlocks the whole family.
  return /services\/revenuecat/.test(app)&&app.includes('syncRevenueCatUser')&&
    /services\/revenuecat/.test(privacy)&&privacy.includes('clearRevenueCatIdentityAfterDeletion')&&
    /services\/revenuecat/.test(main)&&main.includes('storeOffer')&&main.includes("source:'revenuecat'")&&
    planning.includes('storeOffer={storeOffer}')&&
    recipes.includes('storeOffer={storeOffer}')&&
    household.includes('storeOffer={storeOffer}')&&
    subscription.includes("from('household_access')")&&subscription.includes("functions.invoke('sync-household-access'")&&
    householdSync.includes('REVENUECAT_SECRET_API_KEY')&&householdSync.includes('payer_user_id');
}
if(!hasEndToEndRevenueCatWiring()){
  block('production build requires end-to-end RevenueCat wiring: Supabase session changes must switch RevenueCat identity, account deletion must clear SDK identity, authenticated CustomerInfo must drive household-scoped access, localized Store Offerings must reach every paywall, and the trusted household entitlement mirror must be present.');
}
console.log('PASS EAS pre-install gate: production backend, billing and native brand assets are present.');
