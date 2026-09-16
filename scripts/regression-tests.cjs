#!/usr/bin/env node
const fs=require('fs');
const os=require('os');
const path=require('path');
const {spawnSync}=require('child_process');
const assert=require('assert');
const ts=require('typescript');

const root=path.resolve(__dirname,'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'notre-table-regression-'));

const sources=[
  'src/lib/dates.ts',
  'src/domain/catalog.ts',
  'src/domain/ingredients.ts',
  'src/domain/meals.ts',
  'src/lib/units.ts',
  'src/lib/presence.ts',
  'src/lib/pantryExpiry.ts',
  'src/lib/recipeTaste.ts',
  'src/lib/runtimeConfig.ts',
  'src/lib/storageCodec.ts',
  'src/lib/requestGate.ts',
  'src/lib/offlineQueue.ts',
  'src/lib/authLinks.ts',
  'src/lib/premiumGate.ts',
  'src/lib/structuredInput.ts',
  'src/i18n/index.ts',
];

function compile(relative){
  const input=path.join(root,relative);
  const source=fs.readFileSync(input,'utf8');
  const output=ts.transpileModule(source,{
    fileName:input,
    compilerOptions:{
      target:ts.ScriptTarget.ES2020,
      module:ts.ModuleKind.CommonJS,
      esModuleInterop:true,
    },
    reportDiagnostics:true,
  });
  const errors=(output.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  if(errors.length){
    throw new Error(`${relative}: ${errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')).join('; ')}`);
  }
  const out=path.join(temp,relative.replace(/\.ts$/,'.js'));
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,output.outputText);
}

for(const file of sources)compile(file);

const dates=require(path.join(temp,'src/lib/dates.js'));
const catalog=require(path.join(temp,'src/domain/catalog.js'));
const ingredients=require(path.join(temp,'src/domain/ingredients.js'));
const meals=require(path.join(temp,'src/domain/meals.js'));
const units=require(path.join(temp,'src/lib/units.js'));
const presence=require(path.join(temp,'src/lib/presence.js'));
const pantryExpiry=require(path.join(temp,'src/lib/pantryExpiry.js'));
const recipeTaste=require(path.join(temp,'src/lib/recipeTaste.js'));
const runtimeConfig=require(path.join(temp,'src/lib/runtimeConfig.js'));
const storageCodec=require(path.join(temp,'src/lib/storageCodec.js'));
const requestGate=require(path.join(temp,'src/lib/requestGate.js'));
const offlineQueue=require(path.join(temp,'src/lib/offlineQueue.js'));
const authLinks=require(path.join(temp,'src/lib/authLinks.js'));
const premiumGate=require(path.join(temp,'src/lib/premiumGate.js'));
const structuredInput=require(path.join(temp,'src/lib/structuredInput.js'));
const i18n=require(path.join(temp,'src/i18n/index.js'));

function pressableOpeningTags(source){
  const tags=[]; let pos=0;
  while(true){
    const start=source.indexOf('<Pressable',pos); if(start<0)break;
    let i=start+'<Pressable'.length, depth=0, quote=null, escaped=false;
    for(;i<source.length;i++){
      const ch=source[i];
      if(quote){
        if(escaped)escaped=false; else if(ch==='\\')escaped=true; else if(ch===quote)quote=null;
      }else{
        if(ch==='"'||ch==="'"||ch==='`')quote=ch;
        else if(ch==='{')depth++; else if(ch==='}'&&depth>0)depth--;
        else if(ch==='>'&&depth===0){tags.push(source.slice(start,i+1));pos=i+1;break;}
      }
    }
    if(i>=source.length)break;
  }
  return tags;
}

function textInputOpeningTags(source){
  const tags=[]; let pos=0;
  while(true){
    const start=source.indexOf('<TextInput',pos); if(start<0)break;
    let i=start+'<TextInput'.length, depth=0, quote=null, escaped=false;
    for(;i<source.length;i++){
      const ch=source[i];
      if(quote){
        if(escaped)escaped=false; else if(ch==='\\')escaped=true; else if(ch===quote)quote=null;
      }else{
        if(ch==='"'||ch==="'"||ch==='`')quote=ch;
        else if(ch==='{')depth++; else if(ch==='}'&&depth>0)depth--;
        else if(ch==='>'&&depth===0){tags.push(source.slice(start,i+1));pos=i+1;break;}
      }
    }
    if(i>=source.length)break;
  }
  return tags;
}

const tests=[];
function test(name,fn){tests.push({name,fn});}

// Dates: local calendar math must not silently hard-code Monday.
test('startOfWeek respects Monday calendars',()=>{
  const w=dates.startOfWeek(new Date(2026,8,13,9,0,0),2); // Sunday -> previous Monday
  assert.strictEqual(dates.localIsoDate(w),'2026-09-07');
});
test('startOfWeek respects Sunday calendars',()=>{
  const w=dates.startOfWeek(new Date(2026,8,13,9,0,0),1);
  assert.strictEqual(dates.localIsoDate(w),'2026-09-13');
});
test('addDays remains calendar-based across month boundary',()=>{
  assert.strictEqual(dates.localIsoDate(dates.addDays(new Date(2026,0,31,12),1)),'2026-02-01');
});

// Canonical ingredient identity across supported languages.
test('tomato aliases share one language-neutral ingredient key',()=>{
  for(const label of ['tomato','Tomates','tomate','עגבניות']) assert.strictEqual(ingredients.canonicalIngredientKey(label),'tomato');
});
test('accented aliases normalize to the same key',()=>{
  for(const label of ['Sésame','sesamo','sésamo','שומשום']) assert.strictEqual(ingredients.canonicalIngredientKey(label),'sesame');
});
test('unknown ingredient keeps a stable slug instead of disappearing',()=>{
  assert.strictEqual(ingredients.canonicalIngredientKey('  Fleur de sel  '),'fleur_de_sel');
});
test('known ingredient localizes without changing shared key',()=>{
  assert.strictEqual(ingredients.localizedIngredientLabel('zucchini','fr'),'Courgettes');
  assert.strictEqual(ingredients.localizedIngredientLabel('zucchini','en'),'Zucchini');
  assert.strictEqual(ingredients.localizedIngredientLabel('zucchini','he'),'קישוא');
});

// Daily meal order is shared across screens so snack never falls after dinner.
test('meal order follows the day chronologically',()=>{
  assert.deepStrictEqual([...meals.MEAL_ORDER],['breakfast','lunch','snack','dinner']);
});
test('Today focus moves through meals by local hour',()=>{
  assert.strictEqual(meals.focusMealForHour(8),'breakfast');
  assert.strictEqual(meals.focusMealForHour(12),'lunch');
  assert.strictEqual(meals.focusMealForHour(15),'snack');
  assert.strictEqual(meals.focusMealForHour(20),'dinner');
});

// International normalization.
test('aisle normalization accepts multiple languages',()=>{
  assert.strictEqual(catalog.normalizeAisle('Fruits et légumes'),'produce');
  assert.strictEqual(catalog.normalizeAisle('Frutas y verduras'),'produce');
  assert.strictEqual(catalog.normalizeAisle('פירות וירקות'),'produce');
});
test('difficulty normalization accepts localized values',()=>{
  assert.strictEqual(catalog.normalizeDifficulty('moyen'),'medium');
  assert.strictEqual(catalog.normalizeDifficulty('difícil'),'hard');
  assert.strictEqual(catalog.normalizeDifficulty('קשה'),'hard');
});
test('unit normalization accepts localized units',()=>{
  assert.strictEqual(catalog.normalizeUnit('grammes'),'g');
  assert.strictEqual(catalog.normalizeUnit('כוס'),'cup');
  assert.strictEqual(catalog.normalizeUnit('c. à soupe'),'tbsp');
});

// Measurement conversion: display conversion only, source quantity remains semantic.
test('metric weight converts to imperial',()=>{
  assert.deepStrictEqual(units.convertQuantity(100,'g','imperial'),{quantity:3.5,unit:'oz'});
});
test('imperial volume converts to metric',()=>{
  assert.deepStrictEqual(units.convertQuantity(1,'cup','metric'),{quantity:237,unit:'ml'});
});
test('unknown unit is preserved',()=>{
  assert.deepStrictEqual(units.convertQuantity(2,'pinch','metric'),{quantity:2,unit:'pinch'});
});


// Presence: availability is meal-specific, not an all-day administrative flag.
test('meal presence can differ between lunch and dinner',()=>{
  const rows=[{id:'a1',household_id:'h1',user_id:'u1',absence_date:'2026-09-13',meal_type:'lunch'}];
  assert.strictEqual(presence.isMemberAwayForMeal(rows,'u1','2026-09-13','lunch'),true);
  assert.strictEqual(presence.isMemberAwayForMeal(rows,'u1','2026-09-13','dinner'),false);
});
test('meal absence count is scoped to the requested day',()=>{
  const rows=[
    {id:'a1',household_id:'h1',user_id:'u1',absence_date:'2026-09-13',meal_type:'lunch'},
    {id:'a2',household_id:'h1',user_id:'u2',absence_date:'2026-09-13',meal_type:'dinner'},
    {id:'a3',household_id:'h1',user_id:'u1',absence_date:'2026-09-14',meal_type:'breakfast'},
  ];
  assert.strictEqual(presence.countMealAbsences(rows,'2026-09-13'),2);
});

// Pantry freshness: anti-waste dates are local calendar dates, not timestamps.
test('pantry expiry classifies today and near dates',()=>{
  const today=new Date(2026,8,13,18,0,0);
  assert.strictEqual(pantryExpiry.pantryFreshness('2026-09-13',today),'soon');
  assert.strictEqual(pantryExpiry.pantryFreshness('2026-09-16',today),'soon');
  assert.strictEqual(pantryExpiry.pantryFreshness('2026-09-17',today),'later');
});
test('pantry expiry detects expired items without timezone drift',()=>{
  const today=new Date(2026,8,13,1,0,0);
  assert.strictEqual(pantryExpiry.pantryDaysUntil('2026-09-12',today),-1);
  assert.strictEqual(pantryExpiry.pantryDaysUntil('2026-09-13',today),0);
});
test('pantry merge keeps the earliest known expiry',()=>{
  assert.strictEqual(pantryExpiry.earliestExpiry('2026-09-20','2026-09-17'),'2026-09-17');
  assert.strictEqual(pantryExpiry.earliestExpiry(null,'2026-09-18'),'2026-09-18');
  assert.strictEqual(pantryExpiry.earliestExpiry('2026-09-18',null),'2026-09-18');
});
test('invalid pantry expiry is rejected',()=>{
  assert.strictEqual(pantryExpiry.parseIsoDay('2026-02-31'),null);
  assert.strictEqual(pantryExpiry.parseIsoDay('31/02/2026'),null);
});

// Household taste memory: reactions remain individual but aggregate deterministically.
test('recipe taste summarizes family reactions',()=>{
  assert.deepStrictEqual(recipeTaste.summarizeRecipeTaste(['again','again','ok','skip',null]),{again:2,ok:1,skip:1,total:4});
});
test('recipe taste returns no preference without opinions',()=>{
  assert.strictEqual(recipeTaste.preferredReaction(recipeTaste.emptyTasteCounts()),null);
});
test('recipe taste resolves the strongest family signal',()=>{
  assert.strictEqual(recipeTaste.preferredReaction({again:3,ok:1,skip:1,total:5}),'again');
});

test('auth deep link parser reads implicit recovery tokens from fragment',()=>{
  const parsed=authLinks.parseAuthLink('notretable://auth/recovery#access_token=abc&refresh_token=def&type=recovery');
  assert.strictEqual(parsed.handled,true);assert.strictEqual(parsed.recovery,true);assert.strictEqual(parsed.accessToken,'abc');assert.strictEqual(parsed.refreshToken,'def');
});
test('auth deep link parser reads PKCE auth code',()=>{
  const parsed=authLinks.parseAuthLink('notretable://auth/callback?code=pkce123');
  assert.strictEqual(parsed.handled,true);assert.strictEqual(parsed.code,'pkce123');
});
test('auth deep link parser recognizes recovery route in a custom URL scheme',()=>{
  const parsed=authLinks.parseAuthLink('notretable://auth/recovery?code=recovery123');
  assert.strictEqual(parsed.handled,true);assert.strictEqual(parsed.recovery,true);assert.strictEqual(parsed.code,'recovery123');
});
test('auth deep link parser ignores unrelated links',()=>{
  const parsed=authLinks.parseAuthLink('notretable://invite/ABC123');
  assert.strictEqual(parsed.handled,false);assert.strictEqual(parsed.recovery,false);
});
test('auth UI exposes confirmation redirect and password recovery flow',()=>{
  const auth=fs.readFileSync(path.join(root,'src','screens','AuthScreen.tsx'),'utf8');
  const app=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
  const recovery=fs.readFileSync(path.join(root,'src','screens','PasswordRecoveryScreen.tsx'),'utf8');
  assert.ok(auth.includes("Linking.createURL('auth/callback')"));
  assert.ok(auth.includes('resetPasswordForEmail'));
  assert.ok(auth.includes("Linking.createURL('auth/recovery')"));
  assert.ok(app.includes('consumeAuthLink'));
  assert.ok(recovery.includes('auth.updateUser({password})'));
});

// Runtime backend configuration: mobile config must fail closed and reject privileged secrets.
test('runtime config stays in demo mode when Supabase is absent',()=>{
  assert.strictEqual(runtimeConfig.resolveRuntimeConfig({}).supabase.enabled,false);
});
test('runtime config rejects partial Supabase settings',()=>{
  assert.strictEqual(runtimeConfig.resolveRuntimeConfig({EXPO_PUBLIC_SUPABASE_URL:'https://abc.supabase.co'}).supabase.enabled,false);
});
test('runtime config rejects privileged public Supabase keys',()=>{
  const cfg=runtimeConfig.resolveRuntimeConfig({EXPO_PUBLIC_SUPABASE_URL:'https://abc.supabase.co',EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_secret_should_never_be_mobile'});
  assert.strictEqual(cfg.supabase.enabled,false);
  assert.strictEqual(cfg.supabase.reason,'SUPABASE_PRIVILEGED_KEY_FORBIDDEN');
});
test('runtime config rejects legacy JWT API keys in public mobile config',()=>{
  const cfg=runtimeConfig.resolveRuntimeConfig({EXPO_PUBLIC_SUPABASE_URL:'https://abc.supabase.co',EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.signature'});
  assert.strictEqual(cfg.supabase.enabled,false);
  assert.strictEqual(cfg.supabase.reason,'SUPABASE_PUBLISHABLE_KEY_REQUIRED');
});
test('runtime config accepts a complete public Supabase configuration',()=>{
  const cfg=runtimeConfig.resolveRuntimeConfig({EXPO_PUBLIC_SUPABASE_URL:'https://abc.supabase.co',EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example'});
  assert.strictEqual(cfg.supabase.enabled,true);
});


test('runtime config keeps RevenueCat disabled when absent',()=>{
  const cfg=runtimeConfig.resolveRuntimeConfig({});
  assert.strictEqual(cfg.revenueCat.enabled,false);
  assert.strictEqual(cfg.revenueCat.reason,'REVENUECAT_NOT_CONFIGURED');
});
test('runtime config rejects incomplete RevenueCat public settings',()=>{
  const cfg=runtimeConfig.resolveRuntimeConfig({EXPO_PUBLIC_REVENUECAT_IOS_API_KEY:'appl_example'});
  assert.strictEqual(cfg.revenueCat.enabled,false);
  assert.strictEqual(cfg.revenueCat.reason,'REVENUECAT_CONFIG_INCOMPLETE');
});
test('runtime config rejects RevenueCat secret keys from public config',()=>{
  const cfg=runtimeConfig.resolveRuntimeConfig({EXPO_PUBLIC_REVENUECAT_IOS_API_KEY:'sk_forbidden',EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY:'goog_example',EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID:'family'});
  assert.strictEqual(cfg.revenueCat.enabled,false);
  assert.strictEqual(cfg.revenueCat.reason,'REVENUECAT_SECRET_KEY_FORBIDDEN');
});
test('runtime config requires platform-correct RevenueCat SDK keys',()=>{
  const cfg=runtimeConfig.resolveRuntimeConfig({EXPO_PUBLIC_REVENUECAT_IOS_API_KEY:'goog_wrong',EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY:'appl_wrong',EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID:'family'});
  assert.strictEqual(cfg.revenueCat.enabled,false);
  assert.strictEqual(cfg.revenueCat.reason,'REVENUECAT_IOS_PUBLIC_KEY_REQUIRED');
});
test('runtime config accepts complete RevenueCat public SDK configuration',()=>{
  const cfg=runtimeConfig.resolveRuntimeConfig({EXPO_PUBLIC_REVENUECAT_IOS_API_KEY:'appl_example',EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY:'goog_example',EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID:'family'});
  assert.strictEqual(cfg.revenueCat.enabled,true);
  assert.strictEqual(cfg.revenueCat.entitlementId,'family');
});

test('production subscription access uses household server truth before any local preview cache',()=>{
  const source=fs.readFileSync(path.join(root,'src','services','subscription.ts'),'utf8');
  const productionGuard=source.indexOf("if (runtimeConfig.environment === 'production') {");
  const syncCall=source.indexOf('syncHouseholdAccess(householdId)',productionGuard);
  const serverRead=source.indexOf('readHouseholdAccess(householdId)',productionGuard);
  const storedRead=source.indexOf('readStoredJson<Record<string, unknown>>(KEY');
  assert.ok(productionGuard>=0);
  assert.ok(syncCall>productionGuard);
  assert.ok(serverRead>syncCall);
  assert.ok(storedRead>serverRead);
  const productionBlock=source.slice(productionGuard,storedRead);
  assert.ok(!productionBlock.includes('readStoredJson'));
  assert.ok(productionBlock.includes("source:'revenuecat'"));
});

test('RevenueCat provider outage preserves the last household server truth instead of downgrading it',()=>{
  const source=fs.readFileSync(path.join(root,'supabase','functions','sync-household-access','index.ts'),'utf8');
  const outage=source.indexOf('provider_unavailable:true');
  const freeWrite=source.indexOf("plan:'free' as const");
  assert.ok(outage>=0);
  assert.ok(freeWrite>outage);
  assert.ok(source.includes("if(current)return json(200,{access:current,verified:false,provider_unavailable:true});"));
});

test('production paywall never falls back to preview reference prices',()=>{
  const source=fs.readFileSync(path.join(root,'src','screens','PaywallScreen.tsx'),'utf8');
  assert.ok(source.includes("monthlyPrice=production?storeOffer?.monthly?.localizedPrice:monthlyReference"));
  assert.ok(source.includes("annualPrice=production?storeOffer?.annual?.localizedPrice:annualReference"));
});
test('production paywall fails closed without localized Store packages',()=>{
  const source=fs.readFileSync(path.join(root,'src','screens','PaywallScreen.tsx'),'utf8');
  assert.ok(source.includes("production&&!storeReady"));
  assert.ok(source.includes("production?!selectedPackage:!onStartTrial"));
});
test('recipes local trial callback is optional for production',()=>{
  const source=fs.readFileSync(path.join(root,'src','screens','RecipesScreen.tsx'),'utf8');
  assert.ok(source.includes('onStartTrial?: () => void | Promise<void>;'));
  assert.ok(source.includes("access.plan === 'free' && onStartTrial"));
});

test('account deletion warns that Store subscription survives account deletion',()=>{
  const source=fs.readFileSync(path.join(root,'src','screens','PrivacyDataScreen.tsx'),'utf8');
  assert.ok(source.includes('privacy.subscriptionWarning'));
  assert.ok(source.includes('privacy.manageSubscription'));
  assert.ok(source.includes('https://apps.apple.com/account/subscriptions'));
  assert.ok(source.includes('https://play.google.com/store/account/subscriptions'));
});
test('RevenueCat customer erasure is server-only and opt-in fail-closed',()=>{
  const source=fs.readFileSync(path.join(root,'supabase','functions','delete-account','index.ts'),'utf8');
  assert.ok(source.includes("Deno.env.get('REVENUECAT_CUSTOMER_DELETION_ENABLED')"));
  assert.ok(source.includes("Deno.env.get('REVENUECAT_SECRET_API_KEY')"));
  assert.ok(source.includes('api.revenuecat.com/v1/subscribers'));
  assert.ok(source.includes('REVENUECAT_SERVER_SECRET_NOT_CONFIGURED'));
});
test('RevenueCat customer deletion is retry-safe for an already deleted customer',()=>{
  const source=fs.readFileSync(path.join(root,'supabase','functions','delete-account','index.ts'),'utf8');
  assert.ok(source.includes('response.status!==200&&response.status!==404'));
  assert.ok(source.includes('revenuecat_customer_deleted:revenueCatCustomerDeleted'));
});

test('first beta does not persist unavailable collaborative push toggles',()=>{
  const source=fs.readFileSync(path.join(root,'src','services','appPreferences.ts'),'utf8');
  assert.ok(source.includes('planningChanges: false'));
  assert.ok(source.includes('shoppingChecks: false'));
  assert.ok(source.includes("{...value,planningChanges:false,shoppingChecks:false}"));
});
test('notification settings expose collaborative push as unavailable instead of functional',()=>{
  const source=fs.readFileSync(path.join(root,'src','screens','NotificationSettingsScreen.tsx'),'utf8');
  assert.ok(source.includes("locale.t('notifications.remoteUnavailable')"));
  assert.ok(source.includes('value={false}'));
  assert.ok(source.includes('disabled rtl={rtl}'));
});

test('runtime config exposes only valid HTTPS privacy and deletion URLs',()=>{
  const cfg=runtimeConfig.resolveRuntimeConfig({
    EXPO_PUBLIC_ACCOUNT_DELETION_ENDPOINT:'https://api.notretable.app/delete',
    EXPO_PUBLIC_ACCOUNT_DELETION_WEB_URL:'https://notretable.app/delete-account',
    EXPO_PUBLIC_PRIVACY_POLICY_URL:'https://notretable.app/privacy',
  });
  assert.strictEqual(cfg.accountDeletionEndpoint,'https://api.notretable.app/delete');
  assert.strictEqual(cfg.accountDeletionWebUrl,'https://notretable.app/delete-account');
  assert.strictEqual(cfg.privacyPolicyUrl,'https://notretable.app/privacy');
});
test('runtime config accepts only HTTPS OCR endpoints',()=>{
  const secure=runtimeConfig.resolveRuntimeConfig({EXPO_PUBLIC_RECIPE_OCR_ENDPOINT:'https://ocr.notretable.app/read'});
  const insecure=runtimeConfig.resolveRuntimeConfig({EXPO_PUBLIC_RECIPE_OCR_ENDPOINT:'http://ocr.notretable.app/read'});
  assert.strictEqual(secure.recipeOcrEndpoint,'https://ocr.notretable.app/read');
  assert.strictEqual(insecure.recipeOcrEndpoint,undefined);
});
test('photo OCR uses the validated runtime config boundary',()=>{
  const source=fs.readFileSync(path.join(root,'src','lib','photoRecipeImport.ts'),'utf8');
  assert.ok(source.includes('runtimeConfig.recipeOcrEndpoint'));
  assert.ok(!source.includes('process.env.EXPO_PUBLIC_RECIPE_OCR_ENDPOINT'));
});
test('runtime source has no direct EXPO_PUBLIC access outside runtimeConfig',()=>{
  const files=[];
  const walk=dir=>{for(const name of fs.readdirSync(dir)){const full=path.join(dir,name);const stat=fs.statSync(full);if(stat.isDirectory())walk(full);else if(/\.(ts|tsx)$/.test(full))files.push(full);}};
  walk(path.join(root,'src'));
  const offenders=files.filter(file=>file!==path.join(root,'src','lib','runtimeConfig.ts')&&fs.readFileSync(file,'utf8').includes('process.env.EXPO_PUBLIC_'));
  assert.deepStrictEqual(offenders,[]);
});

test('external recipe imports use bounded fetch timeouts',()=>{
  const urlSource=fs.readFileSync(path.join(root,'src','lib','recipeImport.ts'),'utf8');
  const photoSource=fs.readFileSync(path.join(root,'src','lib','photoRecipeImport.ts'),'utf8');
  assert.ok(urlSource.includes('fetchWithTimeout'));
  assert.ok(urlSource.includes('15000'));
  assert.ok(photoSource.includes('fetchWithTimeout'));
  assert.ok(photoSource.includes('20000'));
});
test('RevenueCat account-erasure call has a bounded server timeout',()=>{
  const source=fs.readFileSync(path.join(root,'supabase','functions','delete-account','index.ts'),'utf8');
  assert.ok(source.includes('new AbortController()'));
  assert.ok(source.includes('10000'));
  assert.ok(source.includes('signal:controller.signal'));
});

test('runtime config rejects insecure or placeholder compliance URLs',()=>{
  const cfg=runtimeConfig.resolveRuntimeConfig({
    EXPO_PUBLIC_ACCOUNT_DELETION_ENDPOINT:'http://api.example.com/delete',
    EXPO_PUBLIC_ACCOUNT_DELETION_WEB_URL:'https://YOUR_PROJECT.example.com/delete',
    EXPO_PUBLIC_PRIVACY_POLICY_URL:'http://example.com/privacy',
  });
  assert.strictEqual(cfg.accountDeletionEndpoint,undefined);
  assert.strictEqual(cfg.accountDeletionWebUrl,undefined);
  assert.strictEqual(cfg.privacyPolicyUrl,undefined);
});

test('runtime config allows demo in development by default',()=>{
  const cfg=runtimeConfig.resolveRuntimeConfig({});
  assert.strictEqual(cfg.environment,'development');
  assert.strictEqual(cfg.allowDemo,true);
});
test('runtime config allows demo in preview builds',()=>{
  const cfg=runtimeConfig.resolveRuntimeConfig({EXPO_PUBLIC_APP_ENV:'preview'});
  assert.strictEqual(cfg.environment,'preview');
  assert.strictEqual(cfg.allowDemo,true);
});
test('runtime config disables demo in production builds',()=>{
  const cfg=runtimeConfig.resolveRuntimeConfig({EXPO_PUBLIC_APP_ENV:'production'});
  assert.strictEqual(cfg.environment,'production');
  assert.strictEqual(cfg.allowDemo,false);
});
test('production can use a valid public backend without enabling demo',()=>{
  const cfg=runtimeConfig.resolveRuntimeConfig({
    EXPO_PUBLIC_APP_ENV:'production',
    EXPO_PUBLIC_SUPABASE_URL:'https://abc.supabase.co',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example',
  });
  assert.strictEqual(cfg.supabase.enabled,true);
  assert.strictEqual(cfg.allowDemo,false);
});


// Local persistence: corrupted or stale JSON must fail closed to a conservative fallback.
test('storage codec returns valid JSON unchanged',()=>{
  assert.deepStrictEqual(storageCodec.decodeStoredJson('[1,2]',[],Array.isArray),{value:[1,2],valid:true});
});
test('storage codec contains malformed JSON',()=>{
  assert.deepStrictEqual(storageCodec.decodeStoredJson('{bad',[],Array.isArray),{value:[],valid:false});
});
test('storage codec rejects a wrong stored shape',()=>{
  assert.deepStrictEqual(storageCodec.decodeStoredJson('{"x":1}',[],Array.isArray),{value:[],valid:false});
});
test('storage codec treats a missing key as a normal fallback',()=>{
  assert.deepStrictEqual(storageCodec.decodeStoredJson(null,{ready:false}),{value:{ready:false},valid:true});
});


// Async freshness: late responses must never be considered current after a newer request.
test('request gate accepts the newest token',()=>{
  const gate=requestGate.createRequestGate();
  const token=requestGate.beginRequest(gate);
  assert.strictEqual(requestGate.isCurrentRequest(gate,token),true);
});
test('request gate rejects an older token after a newer request starts',()=>{
  const gate=requestGate.createRequestGate();
  const old=requestGate.beginRequest(gate);
  requestGate.beginRequest(gate);
  assert.strictEqual(requestGate.isCurrentRequest(gate,old),false);
});
test('request gate invalidation cancels the in-flight token',()=>{
  const gate=requestGate.createRequestGate();
  const token=requestGate.beginRequest(gate);
  requestGate.invalidateRequests(gate);
  assert.strictEqual(requestGate.isCurrentRequest(gate,token),false);
});
test('request gate tokens are monotonic',()=>{
  const gate=requestGate.createRequestGate();
  assert.strictEqual(requestGate.beginRequest(gate),1);
  assert.strictEqual(requestGate.beginRequest(gate),2);
  assert.strictEqual(requestGate.beginRequest(gate),3);
});


// Offline shopping queue: repeated gestures collapse to one final intention.
test('offline queue keeps only the last desired state for an item',()=>{
  const q1=offlineQueue.compactPendingToggleQueue([], {id:'i1',checked:true});
  const q2=offlineQueue.compactPendingToggleQueue(q1, {id:'i1',checked:false});
  assert.deepStrictEqual(q2,[{id:'i1',checked:false}]);
});
test('offline queue preserves other items while replacing one item state',()=>{
  const q=[
    {id:'i1',checked:true},
    {id:'i2',checked:false},
  ];
  assert.deepStrictEqual(
    offlineQueue.compactPendingToggleQueue(q,{id:'i1',checked:false}),
    [{id:'i2',checked:false},{id:'i1',checked:false}],
  );
});
test('offline queue appends a new item exactly once',()=>{
  const q=offlineQueue.compactPendingToggleQueue([{id:'i1',checked:true}],{id:'i2',checked:true});
  assert.deepStrictEqual(q,[{id:'i1',checked:true},{id:'i2',checked:true}]);
});

test('offline queue storage is scoped to the authenticated user',()=>{
  const a=offlineQueue.shoppingQueueStorageKey('h1','2026-09-14','user-a');
  const b=offlineQueue.shoppingQueueStorageKey('h1','2026-09-14','user-b');
  assert.notStrictEqual(a,b);
  assert.ok(a.endsWith(':user-a'));
});

test('offline replay stops when the authenticated user changes',()=>{
  assert.strictEqual(offlineQueue.replayBelongsToCurrentUser('user-a','user-a'),true);
  assert.strictEqual(offlineQueue.replayBelongsToCurrentUser('user-a','user-b'),false);
  assert.strictEqual(offlineQueue.replayBelongsToCurrentUser('user-a',null),false);
});

test('network replay fires on the first reachable observation',()=>{
  const state={isConnected:true,isInternetReachable:true};
  assert.strictEqual(offlineQueue.shouldReplayShoppingQueue(null,state),true);
});
test('network replay fires after offline becomes reachable',()=>{
  const state={isConnected:true,isInternetReachable:true};
  assert.strictEqual(offlineQueue.shouldReplayShoppingQueue(false,state),true);
});
test('network replay does not loop on repeated reachable events',()=>{
  const state={isConnected:true,isInternetReachable:true};
  assert.strictEqual(offlineQueue.shouldReplayShoppingQueue(true,state),false);
});
test('pending shopping intent overlays stale server state',()=>{
  const items=[{id:'i1',checked:false,label:'Milk'},{id:'i2',checked:false,label:'Bread'}];
  assert.deepStrictEqual(offlineQueue.overlayPendingToggles(items,[{id:'i1',checked:true}]),[
    {id:'i1',checked:true,label:'Milk'},{id:'i2',checked:false,label:'Bread'},
  ]);
});
test('connected state with temporarily unknown reachability can replay safely',()=>{
  assert.strictEqual(offlineQueue.isNetworkReachable({isConnected:true,isInternetReachable:null}),true);
  assert.strictEqual(offlineQueue.isNetworkReachable({isConnected:false,isInternetReachable:null}),false);
});


// Premium server refusals: backend truth must map to actionable client behavior.
test('premium gate classifies Family enforcement errors',()=>{
  assert.strictEqual(premiumGate.classifyPremiumGateError({message:'FAMILY_PLAN_REQUIRED'}),'FAMILY_PLAN_REQUIRED');
});
test('premium gate classifies Free recipe limit errors',()=>{
  assert.strictEqual(premiumGate.classifyPremiumGateError({details:'FREE_RECIPE_LIMIT'}),'FREE_RECIPE_LIMIT');
});
test('premium gate classifies household member limit errors',()=>{
  assert.strictEqual(premiumGate.classifyPremiumGateError({hint:'HOUSEHOLD_MEMBER_LIMIT'}),'HOUSEHOLD_MEMBER_LIMIT');
});
test('premium gate ignores unrelated backend errors',()=>{
  assert.strictEqual(premiumGate.classifyPremiumGateError(new Error('network failed')),null);
});
test('invalid invitation errors are recognized without exposing raw backend text',()=>{
  assert.strictEqual(premiumGate.isInvalidInvitationError({message:'Invalid or expired invitation'}),true);
  assert.strictEqual(premiumGate.isInvalidInvitationError({message:'something else'}),false);
});

test('server premium enforcement is non-client-configurable and collaboration downgrade is guarded',()=>{
  const m10=fs.readFileSync(path.join(root,'supabase','migrations','202609140010_server_premium_enforcement.sql'),'utf8').toLowerCase();
  const m11=fs.readFileSync(path.join(root,'supabase','migrations','202609140011_family_collaboration_write_guard.sql'),'utf8').toLowerCase();
  assert.ok(m10.includes('create table if not exists public.app_release_settings'));
  assert.ok(m10.includes('revoke all on table public.app_release_settings from public, anon, authenticated'));
  assert.ok(m10.includes('family_plan_required'));
  assert.ok(m10.includes('household_member_limit'));
  assert.ok(m10.includes('free_recipe_limit'));
  assert.ok(m10.includes('create or replace function public.family_feature_allowed'));
  assert.ok(m11.includes('create or replace function public.can_write_household'));
  assert.ok(m11.includes('public.is_household_admin(p_household_id)'));
  for(const rpc of ['create_recipe_with_ingredients','set_meal_slot','rebuild_weekly_shopping_list','add_recipe_to_shopping_list','upsert_pantry_item']){
    const at=m11.indexOf(`create or replace function public.${rpc}`);
    assert.ok(at>=0,`missing ${rpc}`);
    assert.ok(m11.slice(at,at+7000).includes('public.can_write_household'),`${rpc} lacks write guard`);
  }
});


test('household write guard resolves silent RLS refusals through the trusted RPC',()=>{
  const source=fs.readFileSync(path.join(root,'src','services','householdWriteGuard.ts'),'utf8');
  assert.ok(source.includes(".rpc('can_write_household'"));
  assert.ok(source.includes("throw new Error('FAMILY_PLAN_REQUIRED')"));
  assert.ok(source.includes('assertHouseholdWriteIfNoRows'));
});

test('planning and pantry deletes prove zero-row RLS outcomes before reporting success',()=>{
  const planning=fs.readFileSync(path.join(root,'src','services','planning.ts'),'utf8');
  const pantry=fs.readFileSync(path.join(root,'src','services','pantry.ts'),'utf8');
  for(const source of [planning,pantry]){
    assert.ok(source.includes(".select('id')"));
    assert.ok(source.includes('assertHouseholdWriteIfNoRows'));
  }
});

test('shopping mutations distinguish pending network work from a Family-plan write refusal',()=>{
  const source=fs.readFileSync(path.join(root,'src','services','shopping.ts'),'utf8');
  assert.ok(source.includes('assertHouseholdWriteAllowed(householdId)'));
  assert.ok(source.includes(".select('id')"));
  assert.ok(source.includes('rethrowHouseholdMutationError'));
});

test('presence responsibility and taste mutations use the shared household write guard',()=>{
  for(const relative of ['src/services/availability.ts','src/services/shoppingResponsibility.ts','src/services/recipeTaste.ts']){
    const source=fs.readFileSync(path.join(root,relative),'utf8');
    assert.ok(source.includes('householdWriteGuard'),relative);
    assert.ok(source.includes('rethrowHouseholdMutationError')||source.includes('assertHouseholdWriteIfNoRows'),relative);
  }
});

test('meal idea collaboration uses the household write guard for silent vote removals',()=>{
  const source=fs.readFileSync(path.join(root,'src','services','mealIdeas.ts'),'utf8');
  assert.ok(source.includes('householdWriteGuard'));
  assert.ok(source.includes(".select('idea_id')"));
  assert.ok(source.includes('assertHouseholdWriteIfNoRows(householdId,data)'));
  assert.ok(source.includes('rethrowHouseholdMutationError(householdId,error)'));
  const screen=fs.readFileSync(path.join(root,'src','screens','PlanningScreen.tsx'),'utf8');
  assert.ok(screen.includes('toggleMealIdeaVote(householdId,idea.id,idea.voted_by_me)'));
});

test('collaborative screens route Family refusals to an actionable paywall callback',()=>{
  const main=fs.readFileSync(path.join(root,'src','screens','MainScreen.tsx'),'utf8');
  const shopping=fs.readFileSync(path.join(root,'src','screens','ShoppingScreen.tsx'),'utf8');
  const pantry=fs.readFileSync(path.join(root,'src','screens','PantryScreen.tsx'),'utf8');
  const presence=fs.readFileSync(path.join(root,'src','screens','PresenceScreen.tsx'),'utf8');
  const taste=fs.readFileSync(path.join(root,'src','components','RecipeTasteCard.tsx'),'utf8');
  assert.ok(main.includes('onFamilyRequired={requireFamily}'));
  for(const source of [shopping,pantry,presence,taste]){
    assert.ok(source.includes('FAMILY_PLAN_REQUIRED'));
    assert.ok(source.includes('onFamilyRequired'));
  }
});

test('household access refresh ignores stale responses after a household switch',()=>{
  const source=fs.readFileSync(path.join(root,'src','screens','MainScreen.tsx'),'utf8');
  for(const marker of ['createRequestGate()','beginRequest(accessGate)','isCurrentRequest(accessGate,token)','invalidateRequests(accessGate)'])assert.ok(source.includes(marker));
});

// Translation engine: interpolation and language parity are separately checked by audit.
test('translation interpolation replaces repeated variables',()=>{
  const original=i18n.translations.en['planning.todayPresent'];
  assert.strictEqual(i18n.translate('en','planning.todayPresent',{present:3,total:4}),original.replace('{{present}}','3').replace('{{total}}','4'));
});
test('brand remains invariant in every supported language',()=>{
  for(const lang of ['fr','en','es','he']) assert.strictEqual(i18n.translate(lang,'brand'),'NOTRE TABLE');
});

test('light-member tokens are cryptographically random, stored hashed and one-use',()=>{
  const sql=fs.readFileSync(path.join(root,'supabase','migrations','202609150012_light_members_response_foundation.sql'),'utf8');
  assert.ok(sql.includes("encode(gen_random_bytes(32),'hex')"));
  assert.ok(sql.includes("encode(digest(v_token,'sha256'),'hex')"));
  assert.ok(!/create table[^;]+light_response_tokens[\s\S]*?\btoken\s+text\b/i.test(sql));
  assert.ok(/where token_hash=v_hash[\s\S]*?for update/i.test(sql));
  assert.ok(sql.includes('v_token_row.consumed_at is not null'));
  assert.ok(sql.includes('set consumed_at=now()'));
});

test('light-member public context never exposes phone numbers or internal ids',()=>{
  const sql=fs.readFileSync(path.join(root,'supabase','migrations','202609150012_light_members_response_foundation.sql'),'utf8');
  const fn=(sql.match(/create or replace function public\.get_light_response_context[\s\S]*?end; \$\$;/i)||[])[0]||'';
  assert.ok(fn.includes("'member_name'"));
  assert.ok(fn.includes("'household_name'"));
  assert.ok(!fn.includes("'phone_number'"));
  assert.ok(!fn.includes("'light_member_id'"));
  assert.ok(!fn.includes("'household_id'"));
});

test('organizer controls the optional desire list and stale answers are reset when it changes',()=>{
  const sql=fs.readFileSync(path.join(root,'supabase','migrations','202609150012_light_members_response_foundation.sql'),'utf8');
  assert.ok(sql.includes('p_desire_options text[]'));
  assert.ok(sql.includes("desire_options <@ array['home','pizza','pasta','sushi','chinese','surprise']::text[]"));
  assert.ok(sql.includes('delete from public.light_response_tokens where question_id=v_id'));
  assert.ok(sql.includes('delete from public.light_meal_responses where question_id=v_id'));
  assert.ok(sql.includes('v_desire=any(v_question.desire_options)'));
  assert.ok(sql.includes('get_light_meal_summary'));
  assert.ok(sql.includes("'presence',jsonb_build_object('yes',v_yes,'no',v_no,'maybe',v_maybe,'take_charge',v_take)"));
});

test('take-charge remains a one-click answer with no follow-up desire',()=>{
  const sql=fs.readFileSync(path.join(root,'supabase','migrations','202609150012_light_members_response_foundation.sql'),'utf8');
  const edge=fs.readFileSync(path.join(root,'supabase','functions','light-response','index.ts'),'utf8');
  assert.ok(sql.includes("p_presence in ('no','take_charge')"));
  assert.ok(edge.includes('data-presence="take_charge"'));
  assert.ok(!edge.includes('cook / order'));
  assert.ok(/where id=v_token_row\.question_id for update/i.test(sql));
  assert.ok(sql.includes("raise exception 'QUESTION_TAKEN_OVER'"));
  assert.ok(edge.includes('c.take_charge_name'));
  assert.ok(edge.includes('t.taken(c.take_charge_name)'));
});

test('surprise-me is a one-click yes while other desires remain optional two-click choices',()=>{
  const edge=fs.readFileSync(path.join(root,'supabase','functions','light-response','index.ts'),'utf8');
  assert.ok(edge.includes("if(o==='surprise'){submit('yes','surprise');return}"));
  assert.ok(edge.includes('selected=selected===o?null:o'));
  assert.ok(edge.includes("pb.forEach(b=>b.addEventListener('click',()=>submit(b.dataset.presence)))"));
});

test('light-response bearer token stays out of the HTTP URL and referrer',()=>{
  const edge=fs.readFileSync(path.join(root,'supabase','functions','light-response','index.ts'),'utf8');
  assert.ok(edge.includes("location.hash"));
  assert.ok(edge.includes("history.replaceState"));
  assert.ok(edge.includes("'referrer-policy':'no-referrer'"));
  assert.ok(edge.includes("'cache-control':'no-store, max-age=0'"));
  assert.ok(!/URLSearchParams[\s\S]{0,120}token/i.test(edge));
});

test('light-response edge is intentionally public but delegates all data access to server-only RPCs',()=>{
  const config=fs.readFileSync(path.join(root,'supabase','config.toml'),'utf8');
  const edge=fs.readFileSync(path.join(root,'supabase','functions','light-response','index.ts'),'utf8');
  assert.ok(/\[functions\.light-response\][\s\S]*verify_jwt\s*=\s*false/.test(config));
  assert.ok(edge.includes("admin.rpc('get_light_response_context'"));
  assert.ok(edge.includes("admin.rpc('submit_light_response'"));
  assert.ok(!edge.includes(".from('light_response_tokens')"));
});

test('light members phone data is admin-readable only and token hashes have no client read grant',()=>{
  const sql=fs.readFileSync(path.join(root,'supabase','migrations','202609150012_light_members_response_foundation.sql'),'utf8');
  const memberPolicy=(sql.match(/create policy light_members_select[\s\S]*?;/i)||[])[0]||'';
  assert.ok(memberPolicy.includes('public.is_household_admin(household_id)'));
  assert.ok(sql.includes('revoke all on table public.light_response_tokens from anon, authenticated'));
  assert.ok(!sql.includes('grant select on table public.light_response_tokens'));
});


test('backend live smoke crosses the deployed light-response Edge Function',()=>{
  const smoke=fs.readFileSync(path.join(root,'scripts','backend-live-smoke.cjs'),'utf8');
  assert.ok(smoke.includes("/functions/v1/light-response"));
  assert.ok(smoke.includes('assertLightResponseShell()'));
  assert.ok(smoke.includes("callLightResponse({action:'context'"));
  assert.ok(smoke.includes("callLightResponse({action:'submit'"));
  assert.ok(smoke.includes("replay.status!==410"));
});

test('backend live smoke verifies light-response browser security headers',()=>{
  const smoke=fs.readFileSync(path.join(root,'scripts','backend-live-smoke.cjs'),'utf8');
  for(const marker of ['cache-control','referrer-policy','x-frame-options','content-security-policy'])assert.ok(smoke.includes(marker));
});

test('release lane requires the current 15-RPC contract and deployed light-response edge',()=>{
  const lane=fs.readFileSync(path.join(root,'docs','RELEASE_LANE.md'),'utf8');
  assert.ok(lane.includes('15/15 client RPCs'));
  assert.ok(lane.includes('supabase/functions/light-response'));
  assert.ok(!lane.includes('require 10/10 client RPCs'));
});


test('release toolchain is explicitly aligned to Node 22.16 and npm 10.9',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const preflight=fs.readFileSync(path.join(root,'scripts','environment-preflight.cjs'),'utf8');
  assert.strictEqual(pkg.engines?.node,'22.16.x');
  assert.strictEqual(pkg.engines?.npm,'10.9.x');
  assert.strictEqual(pkg.packageManager,'npm@10.9.2');
  assert.ok(preflight.includes("const expectedNode='22.16.0'"));
  assert.ok(preflight.includes("const expectedNpm='10.9.2'"));
});

test('GitHub workflows pin official actions to immutable commits',()=>{
  const expected={
    'actions/checkout':'11d5960a326750d5838078e36cf38b85af677262',
    'actions/setup-node':'49933ea5288caeca8642d1e84afbd3f7d6820020',
    'actions/upload-artifact':'ea165f8d65b6e75b540449e92b4886f43607fa02',
  };
  for(const relative of ['.github/workflows/validate.yml','.github/workflows/bootstrap-lockfile.yml']){
    const source=fs.readFileSync(path.join(root,relative),'utf8');
    for(const [action,sha] of Object.entries(expected))assert.ok(source.includes(`${action}@${sha}`),`${relative}: ${action}`);
    const refs=[...source.matchAll(/uses:\s+([^\s#]+)@([^\s#]+)/g)];
    for(const [,action,ref] of refs.filter(x=>x[1].startsWith('actions/')))assert.match(ref,/^[a-f0-9]{40}$/i,`${relative}: mutable ${action}@${ref}`);
  }
});

test('GitHub workflows use read-only contents and do not persist checkout credentials',()=>{
  for(const relative of ['.github/workflows/validate.yml','.github/workflows/bootstrap-lockfile.yml']){
    const source=fs.readFileSync(path.join(root,relative),'utf8');
    assert.ok(source.includes('permissions:\n  contents: read'),relative);
    assert.ok(source.includes('persist-credentials: false'),relative);
  }
});

test('generated Expo validation evidence is excluded from source control',()=>{
  const ignore=fs.readFileSync(path.join(root,'.gitignore'),'utf8').split(/\r?\n/);
  assert.ok(ignore.includes('.validation/'));
});


test('CI generates a SHA-256 release evidence manifest after installed validation',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.strictEqual(pkg.scripts?.['release:evidence'],'node scripts/release-evidence.cjs');
  const script=fs.readFileSync(path.join(root,'scripts','release-evidence.cjs'),'utf8');
  for(const marker of ['release_contract_sha256','package_lock_sha256','supabase/migrations','supabase/functions'])assert.ok(script.includes(marker));
  for(const relative of ['.github/workflows/validate.yml','.github/workflows/bootstrap-lockfile.yml']){
    const workflow=fs.readFileSync(path.join(root,relative),'utf8');
    assert.ok(workflow.includes('npm run release:evidence'),relative);
  }
});

test('release evidence covers every versioned Supabase migration',()=>{
  const evidenceScript=fs.readFileSync(path.join(root,'scripts','release-evidence.cjs'),'utf8');
  assert.ok(evidenceScript.includes("...listFiles('supabase/migrations')"));
  const migrations=fs.readdirSync(path.join(root,'supabase','migrations')).filter(x=>x.endsWith('.sql'));
  assert.ok(migrations.length>=13);
});


test('release doctor is versioned, stage-aware and writes only to ignored validation evidence',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.strictEqual(pkg.scripts?.['release:doctor'],'node scripts/release-doctor.cjs');
  assert.strictEqual(pkg.scripts?.['release:doctor:strict'],'node scripts/release-doctor.cjs --strict');
  const source=fs.readFileSync(path.join(root,'scripts','release-doctor.cjs'),'utf8');
  for(const marker of ['release-doctor.json','Installed validation / CI','Supabase development backend','EAS preview build','Production billing / Stores'])assert.ok(source.includes(marker));
  const ignore=fs.readFileSync(path.join(root,'.gitignore'),'utf8').split(/\r?\n/);
  assert.ok(ignore.includes('.validation/'));
});

test('release doctor never exposes configured secret values in console or JSON',()=>{
  const secret='VERY_SECRET_DO_NOT_PRINT_7f93';
  const env={...process.env,
    RELEASE_DOCTOR_NETWORK_TIMEOUT_MS:'20',
    SUPABASE_SERVICE_ROLE_KEY:secret,
    REVENUECAT_SECRET_API_KEY:secret,
    EXPO_TOKEN:secret,
  };
  const result=spawnSync(process.execPath,[path.join(root,'scripts','release-doctor.cjs'),'--json'],{cwd:root,env,encoding:'utf8',timeout:8000});
  assert.strictEqual(result.status,0,result.stderr);
  assert.ok(!result.stdout.includes(secret));
  const report=JSON.parse(result.stdout);
  assert.strictEqual(report.format_version,1);
  assert.ok(Array.isArray(report.stages));
  const stored=fs.readFileSync(path.join(root,'.validation','release-doctor.json'),'utf8');
  assert.ok(!stored.includes(secret));
});

test('release doctor strict mode fails closed while the installed release lane is blocked',()=>{
  const result=spawnSync(process.execPath,[path.join(root,'scripts','release-doctor.cjs'),'--strict'],{cwd:root,env:{...process.env,RELEASE_DOCTOR_NETWORK_TIMEOUT_MS:'20'},encoding:'utf8',timeout:8000});
  assert.strictEqual(result.status,1);
  assert.ok(result.stdout.includes('Installed validation / CI'));
  assert.ok(result.stdout.includes('Committed package-lock.json present.'));
  assert.ok(!result.stdout.includes('package-lock.json absent; bootstrap'));
});


test('committed npm lockfile matches the release package identity',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const lockPath=path.join(root,'package-lock.json');
  assert.ok(fs.existsSync(lockPath),'package-lock.json must be committed after network bootstrap');
  const lock=JSON.parse(fs.readFileSync(lockPath,'utf8'));
  assert.strictEqual(lock.lockfileVersion,3,'npm 10 bootstrap must produce lockfileVersion 3');
  assert.strictEqual(lock.name,pkg.name,'lockfile package name must match package.json');
  assert.strictEqual(lock.version,pkg.version,'lockfile version must match package.json');
  assert.strictEqual(lock.packages?.['']?.name,pkg.name,'lockfile root package name must match package.json');
  assert.strictEqual(lock.packages?.['']?.version,pkg.version,'lockfile root package version must match package.json');
});

test('beta acceptance example is deliberately pending and cannot masquerade as proof',()=>{
  const example=path.join(root,'docs','beta-acceptance.example.json');
  const result=spawnSync(process.execPath,[path.join(root,'scripts','beta-acceptance-audit.cjs'),example],{cwd:root,encoding:'utf8',timeout:5000});
  assert.strictEqual(result.status,1);
  assert.ok(result.stderr.includes('BETA_ACCEPTANCE_FAIL'));
  assert.ok(result.stderr.includes('expected pass'));
});

test('beta acceptance requires all sixteen real-device scenarios and accepts complete synthetic evidence',()=>{
  const example=JSON.parse(fs.readFileSync(path.join(root,'docs','beta-acceptance.example.json'),'utf8'));
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  example.app_version=pkg.version;
  example.source_revision='abcdef1234567890';
  example.build_id='synthetic-regression-build';
  example.tested_at=new Date().toISOString();
  for(const row of Object.values(example.scenarios)){row.status='pass';row.evidence='synthetic regression reference';}
  const file=path.join(temp,'beta-acceptance-pass.json');
  fs.writeFileSync(file,JSON.stringify(example));
  const result=spawnSync(process.execPath,[path.join(root,'scripts','beta-acceptance-audit.cjs'),file],{cwd:root,encoding:'utf8',timeout:5000});
  assert.strictEqual(result.status,0,result.stderr);
  assert.ok(result.stdout.includes('NOTRE_TABLE_BETA_ACCEPTANCE_PASS'));
  assert.ok(result.stdout.includes('Required scenarios: 16/16'));
});

test('release lane refuses to call the two-device beta complete without the evidence gate',()=>{
  const lane=fs.readFileSync(path.join(root,'docs','RELEASE_LANE.md'),'utf8');
  assert.ok(lane.includes('docs/BETA_ACCEPTANCE.md'));
  assert.ok(lane.includes('beta:acceptance:audit'));
  assert.ok(lane.includes('NOTRE_TABLE_BETA_ACCEPTANCE_PASS'));
});

test('current checkpoint metadata stays aligned across package app and restart-facing docs',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
  const checkpoint=`V${pkg.version.replace(/\.0$/,'')}`;
  assert.strictEqual(app.expo.version,pkg.version);
  const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
  assert.ok(readme.startsWith(`# Notre Table — ${checkpoint}`));
  assert.ok(readme.includes(`## ${checkpoint} —`));
  const project=fs.readFileSync(path.join(root,'docs','PROJECT_STATE.md'),'utf8');
  assert.ok(project.includes(`## ${checkpoint} —`));
  const verification=fs.readFileSync(path.join(root,'docs','VERIFICATION.md'),'utf8');
  assert.ok(verification.startsWith(`# Vérifications techniques — état courant ${checkpoint}`));
});

test('continuity audit is wired into verify and passes on the current checkpoint',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.strictEqual(pkg.scripts?.['continuity:audit'],'node scripts/continuity-audit.cjs');
  assert.ok(pkg.scripts?.verify.includes('npm run continuity:audit'));
  const result=spawnSync(process.execPath,[path.join(root,'scripts','continuity-audit.cjs')],{cwd:root,encoding:'utf8',timeout:5000});
  assert.strictEqual(result.status,0,result.stderr||result.stdout);
  assert.ok(result.stdout.includes('PASS'));
});

test('beta acceptance example tracks the current app version while remaining pending',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const example=JSON.parse(fs.readFileSync(path.join(root,'docs','beta-acceptance.example.json'),'utf8'));
  assert.strictEqual(example.app_version,pkg.version);
  assert.ok(Object.values(example.scenarios).every(row=>row.status==='pending'));
});

test('README current checkpoint summary appears before older V0.113 history',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const checkpoint=`V${pkg.version.replace(/\.0$/,'')}`;
  const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
  assert.ok(readme.indexOf(`## ${checkpoint} —`)>=0);
  assert.ok(readme.indexOf(`## ${checkpoint} —`)<readme.indexOf('## V0.113 —'));
});

test('source hygiene audit is mandatory in verify and release audit',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.strictEqual(pkg.scripts?.['source:hygiene:audit'],'node scripts/source-hygiene-audit.cjs');
  assert.ok(String(pkg.scripts?.verify||'').includes('npm run source:hygiene:audit'));
  const releaseAudit=fs.readFileSync(path.join(root,'scripts','release-audit.cjs'),'utf8');
  for(const marker of ['source-hygiene-audit.cjs','source:hygiene:audit','verify must execute source:hygiene:audit']) assert.ok(releaseAudit.includes(marker));
});

test('source hygiene audit rejects a real environment file',()=>{
  const probe=path.join(root,'.env.production');
  try{
    fs.writeFileSync(probe,'EXPO_PUBLIC_SUPABASE_URL=https://probe.invalid\n');
    const result=spawnSync(process.execPath,[path.join(root,'scripts','source-hygiene-audit.cjs')],{encoding:'utf8'});
    assert.notStrictEqual(result.status,0);
    assert.match(`${result.stdout}\n${result.stderr}`,/environment file must never be versioned|forbidden sensitive filename/i);
  } finally {
    if(fs.existsSync(probe)) fs.unlinkSync(probe);
  }
});

test('release evidence hashes source hygiene policy inputs',()=>{
  const source=fs.readFileSync(path.join(root,'scripts','release-evidence.cjs'),'utf8');
  for(const marker of ["'.gitignore'","'.env.example'","'docs/RELEASE_LANE.md'","'docs/BETA_ACCEPTANCE.md'","'docs/VERIFICATION.md'"]) assert.ok(source.includes(marker));
});

test('release evidence hashes the complete runtime app source',()=>{
  const source=fs.readFileSync(path.join(root,'scripts','release-evidence.cjs'),'utf8');
  for(const marker of ["'App.tsx'","'index.ts'","...listFiles('src')","...listFiles('languages')"]) assert.ok(source.includes(marker));
  const runtimeFiles=[];
  const walk=(dir)=>{for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const rel=path.join(dir,entry.name);if(entry.isDirectory())walk(rel);else if(entry.isFile())runtimeFiles.push(rel);}};
  walk('src');
  walk('languages');
  assert.ok(runtimeFiles.length>50);
});

test('release evidence also binds checkpoint documentation and workflows',()=>{
  const source=fs.readFileSync(path.join(root,'scripts','release-evidence.cjs'),'utf8');
  for(const marker of ["'README.md'","...listFiles('docs')","...listFiles('.github')"]) assert.ok(source.includes(marker));
});

test('native privacy blocks Android audio recording explicitly',()=>{
  const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
  assert.ok(app.expo.android.blockedPermissions.includes('android.permission.RECORD_AUDIO'));
  const audit=fs.readFileSync(path.join(root,'scripts','audit-project.cjs'),'utf8');
  assert.ok(audit.includes('Android RECORD_AUDIO must stay explicitly blocked'));
});

test('production readiness models brand assets without blocking preview',()=>{
  const gate=fs.readFileSync(path.join(root,'scripts','eas-build-pre-install.cjs'),'utf8');
  assert.ok(gate.includes('validProductionBrandAssets'));
  assert.ok(gate.includes('versioned local brand assets'));
  const doctor=fs.readFileSync(path.join(root,'scripts','release-doctor.cjs'),'utf8');
  assert.ok(doctor.includes("check('brand-assets'"));
  assert.ok(doctor.includes("check('android-audio'"));
});

test('automatic native theme is backed by Expo SystemUI on Android',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
  assert.strictEqual(app.expo.userInterfaceStyle,'automatic');
  assert.strictEqual(pkg.dependencies['expo-system-ui'],'~57.0.4');
  assert.ok(app.expo.plugins.some(p=>(Array.isArray(p)?p[0]:p)==='expo-system-ui'));
  const preflight=fs.readFileSync(path.join(root,'scripts','environment-preflight.cjs'),'utf8');
  assert.ok(preflight.includes("expect('dependencies','expo-system-ui','~57.0.4')"));
});


test('Android local reminders create their channel before requesting notification permission',()=>{
  const source=fs.readFileSync(path.join(root,'src','services','notifications.ts'),'utf8');
  const channelCall=source.indexOf('ensureAndroidReminderChannel(copy.channelName)');
  const permissionCall=source.indexOf('Notifications.getPermissionsAsync()');
  assert(channelCall>=0,'Android reminder channel setup is missing');
  assert(permissionCall>=0,'notification permission lookup is missing');
  assert(channelCall<permissionCall,'Android reminder channel must exist before Android 13+ permission request flow');
  assert(source.includes("REMINDER_CHANNEL_ID='notre-table-reminders-v1'"),'reminder channel id must remain stable');
  assert(source.includes('Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID'),'reminder channel must be created explicitly');
  assert(source.includes('sound:null'),'reminder channel must remain silent');
  assert(source.includes("channelId:REMINDER_CHANNEL_ID"),'scheduled Android reminders must target the explicit channel');
});

test('Android reminder notification channel name is localized in every supported app language',()=>{
  const i18n=fs.readFileSync(path.join(root,'src','i18n','index.ts'),'utf8');
  const occurrences=(i18n.match(/'notifications\.channelName'/g)||[]).length;
  assert.strictEqual(occurrences,4,'channelName must exist in EN/FR/ES/HE');
  const screen=fs.readFileSync(path.join(root,'src','screens','NotificationSettingsScreen.tsx'),'utf8');
  assert(screen.includes("channelName:locale.t('notifications.channelName')"),'active locale must feed the Android channel name');
});


test('Android reminder scheduling does not request restricted exact-alarm permissions',()=>{
  const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
  const blocked=app.expo.android.blockedPermissions||[];
  assert(blocked.includes('android.permission.SCHEDULE_EXACT_ALARM'),'SCHEDULE_EXACT_ALARM must remain blocked for secondary reminders');
  assert(blocked.includes('android.permission.USE_EXACT_ALARM'),'USE_EXACT_ALARM must remain blocked for secondary reminders');
  const releaseAudit=fs.readFileSync(path.join(root,'scripts','release-audit.cjs'),'utf8');
  assert(releaseAudit.includes('SCHEDULE_EXACT_ALARM')&&releaseAudit.includes('USE_EXACT_ALARM'),'release audit must guard exact-alarm permissions');
});


test('iOS local reminders honor granular notification authorization states',()=>{
  const source=fs.readFileSync(path.join(root,'src','services','notifications.ts'),'utf8');
  assert(source.includes('notificationPermissionAllowsScheduling(permission)'),'notification permission helper must guard scheduling');
  assert(source.includes('Notifications.IosAuthorizationStatus.AUTHORIZED'),'iOS AUTHORIZED must be recognized');
  assert(source.includes('Notifications.IosAuthorizationStatus.PROVISIONAL'),'iOS PROVISIONAL must be recognized');
  assert(source.includes('Notifications.IosAuthorizationStatus.EPHEMERAL'),'iOS EPHEMERAL must be recognized');
  assert(source.includes("if(Platform.OS!=='ios')return permission.granted"),'Android must keep using the generic granted flag');
  assert(!source.includes("if(!permission.granted)permission=await Notifications.requestPermissionsAsync()"),'legacy generic-only permission branch must be removed');
});


test('iOS reminder permission request is alert-only and does not ask for sound or badge',()=>{
  const source=fs.readFileSync(path.join(root,'src','services','notifications.ts'),'utf8');
  assert(source.includes('async function requestReminderPermission()'),'dedicated reminder permission request helper is required');
  assert(source.includes('allowAlert:true'),'iOS reminders must request alert display');
  assert(source.includes('allowBadge:false'),'iOS reminders must not request badge permission');
  assert(source.includes('allowSound:false'),'iOS reminders must not request sound permission');
  assert(source.includes("if(Platform.OS!=='ios')return Notifications.requestPermissionsAsync();"),'Android request flow must remain unchanged');
  assert(source.includes('permission=await requestReminderPermission()'),'scheduling flow must use the minimized helper');
  assert(!source.includes('allowSound:true'),'reminder permission must never request sound');
  assert(!source.includes('allowBadge:true'),'reminder permission must never request badge');
});


test('iOS export compliance is explicit for the current exempt-encryption runtime',()=>{
  const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
  assert.strictEqual(app.expo.ios.config.usesNonExemptEncryption,false);
  const releaseAudit=fs.readFileSync(path.join(root,'scripts','release-audit.cjs'),'utf8');
  const doctor=fs.readFileSync(path.join(root,'scripts','release-doctor.cjs'),'utf8');
  assert(releaseAudit.includes('usesNonExemptEncryption'));
  assert(doctor.includes("check('ios-export-compliance'"));
});


test('declared iPad support remains visible as a manual production QA obligation',()=>{
  const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
  assert.strictEqual(app.expo.ios.supportsTablet,true);
  const doctor=fs.readFileSync(path.join(root,'scripts','release-doctor.cjs'),'utf8');
  assert(doctor.includes("check('ios-tablet-qa'"));
  assert(doctor.includes("iosTabletSupported?'manual':'pass'"));
  const lane=fs.readFileSync(path.join(root,'docs','RELEASE_LANE.md'),'utf8');
  assert(lane.includes('Portée iPad (V0.125)'));
});


test('safe areas use react-native-safe-area-context across the native app',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.strictEqual(pkg.dependencies['react-native-safe-area-context'],'~5.7.0');
  const appSource=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
  assert(appSource.includes("import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';"),'App root must import SafeAreaProvider');
  assert(appSource.includes('<SafeAreaProvider>'),'App root must provide safe-area context');
  const candidates=[path.join(root,'App.tsx')];
  const visit=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())visit(full);else if(/\.(?:ts|tsx)$/.test(entry.name))candidates.push(full);}};
  visit(path.join(root,'src'));
  for(const file of candidates){
    const source=fs.readFileSync(file,'utf8');
    assert(!/import\s*\{[^}]*\bSafeAreaView\b[^}]*\}\s*from\s*['"]react-native['"]/.test(source),`legacy SafeAreaView import remains in ${path.relative(root,file)}`);
  }
  const preflight=fs.readFileSync(path.join(root,'scripts','environment-preflight.cjs'),'utf8');
  assert(preflight.includes("expect('dependencies','react-native-safe-area-context','~5.7.0')"));
});


test('system locale and calendar preferences refresh when the native app returns active',()=>{
  const source=fs.readFileSync(path.join(root,'src','context','LocaleContext.tsx'),'utf8');
  assert(source.includes("import { AppState } from 'react-native';"),'LocaleContext must observe native app state');
  assert(source.includes("AppState.addEventListener('change'"),'LocaleContext must subscribe to app-state changes');
  assert(source.includes("state==='active'"),'locale refresh should occur when the app returns active');
  assert(source.includes('setEnvironmentRevision(value=>value+1)'),'active transition must invalidate the resolved native locale snapshot');
  assert(source.includes('useMemo(()=>resolve(preference),[preference,environmentRevision])'),'resolved locale must depend on the environment revision');
  assert(source.includes('return()=>subscription.remove()'),'app-state listener must be cleaned up');
});


test('interactive Text controls expose native button semantics',()=>{
  const candidates=[path.join(root,'App.tsx')];
  const visit=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())visit(full);else if(/\.tsx$/.test(entry.name))candidates.push(full);}};
  visit(path.join(root,'src'));
  let interactiveCount=0;
  for(const file of candidates){
    const source=fs.readFileSync(file,'utf8');
    const tags=source.match(/<Text\b[^>]*\bonPress=[^>]*>/g)||[];
    interactiveCount+=tags.length;
    for(const tag of tags)assert(/accessibilityRole=['"]button['"]/.test(tag),`interactive Text lacks button role in ${path.relative(root,file)}: ${tag}`);
  }
  assert(interactiveCount>=18,'expected the known interactive text control surface to be audited');
});


test('every Pressable has native accessibility semantics or is intentionally excluded',()=>{
  const candidates=[path.join(root,'App.tsx')];
  const visit=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())visit(full);else if(/\.tsx$/.test(entry.name))candidates.push(full);}};
  visit(path.join(root,'src'));
  let count=0, excluded=0;
  for(const file of candidates){
    const source=fs.readFileSync(file,'utf8');
    for(const tag of pressableOpeningTags(source)){
      count++;
      const semantic=/accessibilityRole=['"][^'"]+['"]/.test(tag);
      const hidden=/accessible=\{false\}/.test(tag);
      assert(semantic||hidden,`Pressable lacks accessibility semantics in ${path.relative(root,file)}: ${tag}`);
      if(hidden)excluded++;
    }
  }
  assert.strictEqual(count,117,'known Pressable surface changed; audit and classify the new controls');
  assert.strictEqual(excluded,1,'only the invisible action backdrop should be excluded');
});


test('disabled Pressable controls expose their disabled accessibility state',()=>{
  const candidates=[path.join(root,'App.tsx')];
  const visit=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())visit(full);else if(/\.tsx$/.test(entry.name))candidates.push(full);}};
  visit(path.join(root,'src'));
  let disabledCount=0;
  for(const file of candidates){
    const source=fs.readFileSync(file,'utf8');
    for(const tag of pressableOpeningTags(source)){
      if(!/\bdisabled=/.test(tag))continue;
      disabledCount++;
      assert(/accessibilityState=\{\{[^}]*\bdisabled\s*:/.test(tag),`disabled Pressable lacks accessibilityState.disabled in ${path.relative(root,file)}: ${tag}`);
    }
  }
  assert.strictEqual(disabledCount,32,'known disabled Pressable surface changed; audit the new controls');
});


test('persistent selection controls expose selected accessibility state',()=>{
  const candidates=[path.join(root,'App.tsx')];
  const visit=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())visit(full);else if(/\.tsx$/.test(entry.name))candidates.push(full);}};
  visit(path.join(root,'src'));
  let selectedCount=0;
  for(const file of candidates){
    const source=fs.readFileSync(file,'utf8');
    for(const tag of pressableOpeningTags(source)){
      if(/accessibilityState=/.test(tag)&&/\bselected\b/.test(tag))selectedCount++;
    }
  }
  assert.strictEqual(selectedCount,26,'known selected Pressable surface changed; classify new persistent selection controls');
});


test('all TextInput controls expose stable accessibility labels',()=>{
  const candidates=[path.join(root,'App.tsx')];
  const visit=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())visit(full);else if(/\.tsx$/.test(entry.name))candidates.push(full);}};
  visit(path.join(root,'src'));
  let count=0;
  for(const file of candidates){
    const source=fs.readFileSync(file,'utf8');
    for(const tag of textInputOpeningTags(source)){
      count++;
      assert(/\baccessibilityLabel=/.test(tag),`TextInput lacks accessibilityLabel in ${path.relative(root,file)}: ${tag}`);
    }
  }
  assert.strictEqual(count,24,'known TextInput surface changed; label new fields explicitly');
  const authSource=fs.readFileSync(path.join(root,'src','screens','AuthScreen.tsx'),'utf8');
  assert(authSource.includes("locale.t('auth.email')"),'auth email label must be localized');
});


test('disclosure controls expose expanded accessibility state',()=>{
  const candidates=[path.join(root,'App.tsx')];
  const visit=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())visit(full);else if(/\.tsx$/.test(entry.name))candidates.push(full);}};
  visit(path.join(root,'src'));
  let expandedCount=0;
  for(const file of candidates){
    const source=fs.readFileSync(file,'utf8');
    for(const tag of pressableOpeningTags(source)){
      if(/accessibilityState=/.test(tag)&&/\bexpanded\s*:/.test(tag))expandedCount++;
    }
  }
  assert.strictEqual(expandedCount,7,'known disclosure-control surface changed; classify new expandable controls');
  assert(fs.readFileSync(path.join(root,'src','screens','CookingModeScreen.tsx'),'utf8').includes('expanded:ingredientsOpen'));
  assert(fs.readFileSync(path.join(root,'src','screens','RecipesScreen.tsx'),'utf8').includes('expanded:filtersOpen'));
  assert(fs.readFileSync(path.join(root,'src','screens','PlanningScreen.tsx'),'utf8').includes('expanded:mealDetailsOpen'));
});


test('auth fields expose cross-platform autofill metadata',()=>{
  const auth=fs.readFileSync(path.join(root,'src','screens','AuthScreen.tsx'),'utf8');
  const recovery=fs.readFileSync(path.join(root,'src','screens','PasswordRecoveryScreen.tsx'),'utf8');
  assert(auth.includes('autoComplete="email"'),'auth email must expose email autofill');
  assert(auth.includes("autoComplete={mode==='signin'?'current-password':'new-password'}"),'auth password must distinguish sign-in from sign-up autofill');
  assert.strictEqual((recovery.match(/autoComplete="new-password"/g)||[]).length,2,'recovery password and confirmation must both expose new-password autofill');
  assert(!auth.includes('textContentType='),'auth screen should not duplicate autoComplete with textContentType');
  assert(!recovery.includes('textContentType='),'recovery screen should not duplicate autoComplete with textContentType');
});


test('icon-only controls expose explicit localized accessibility labels',()=>{
  const planning=fs.readFileSync(path.join(root,'src','screens','PlanningScreen.tsx'),'utf8');
  const shopping=fs.readFileSync(path.join(root,'src','screens','ShoppingScreen.tsx'),'utf8');
  const recipes=fs.readFileSync(path.join(root,'src','screens','RecipesScreen.tsx'),'utf8');
  assert(planning.includes("accessibilityLabel={locale.t('planning.decreaseServings')}"));
  assert(planning.includes("accessibilityLabel={locale.t('planning.increaseServings')}"));
  assert(shopping.includes("accessibilityLabel={locale.t('planning.previousWeek')}"));
  assert(shopping.includes("accessibilityLabel={locale.t('planning.nextWeek')}"));
  assert(shopping.includes("accessibilityLabel={locale.t('shopping.addAction')}"));
  assert(recipes.includes("accessibilityLabel={locale.t(recipe.favorite ? 'recipes.removeFavoriteA11y' : 'recipes.addFavoriteA11y')}"));
  const i18n=fs.readFileSync(path.join(root,'src','i18n','index.ts'),'utf8');
  for(const key of ['shopping.addAction','planning.decreaseServings','planning.increaseServings','recipes.removeFavoriteA11y','recipes.addFavoriteA11y']){
    assert((i18n.match(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length>=4,`${key} must be localized in all supported languages`);
  }
});


test('shopping checks and recipe favorites expose binary accessibility state',()=>{
  const shopping=fs.readFileSync(path.join(root,'src','screens','ShoppingScreen.tsx'),'utf8');
  const recipes=fs.readFileSync(path.join(root,'src','screens','RecipesScreen.tsx'),'utf8');
  assert(shopping.includes('accessibilityRole="checkbox"'));
  assert(shopping.includes('accessibilityState={{disabled:busy,checked:item.checked,busy:busy}}'));
  assert(recipes.includes('accessibilityState={{selected:recipe.favorite}}'));
  assert(recipes.includes('accessibilityState={{selected:Boolean(selected?.favorite)}}'));
});


test('all runtime disclosure panels expose expanded state',()=>{
  const shopping=fs.readFileSync(path.join(root,'src','screens','ShoppingScreen.tsx'),'utf8');
  const dashboard=fs.readFileSync(path.join(root,'src','screens','HouseholdDashboardScreen.tsx'),'utf8');
  assert(shopping.includes('accessibilityState={{expanded:checkedExpanded}}'));
  assert(shopping.includes('accessibilityState={{expanded:toolsOpen}}'));
  assert(dashboard.includes('accessibilityState={{expanded:settingsExpanded}}'));
  assert(dashboard.includes('accessibilityState={{expanded:activityExpanded}}'));
});


test('notification Switch exposes a stable accessible name and hint',()=>{
  const source=fs.readFileSync(path.join(root,'src','screens','NotificationSettingsScreen.tsx'),'utf8');
  const switchTags=[...source.matchAll(/<Switch\b[\s\S]*?\/>/g)].map(match=>match[0]);
  assert.strictEqual(switchTags.length,1,'known Switch surface changed; classify new native switches explicitly');
  const tag=switchTags[0];
  assert(tag.includes('accessibilityLabel={title}'),'notification Switch must expose the row title as its accessible name');
  assert(tag.includes('accessibilityHint={subtitle}'),'notification Switch must expose the row subtitle as its accessible hint');
  assert(!/accessibilityRole=/.test(tag),'native Switch must retain its native switch semantics');
});

test('visible asynchronous controls expose busy accessibility state',()=>{
  const candidates=[path.join(root,'App.tsx')];
  const visit=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())visit(full);else if(/\.tsx$/.test(entry.name))candidates.push(full);}};
  visit(path.join(root,'src'));
  let busyCount=0;
  for(const file of candidates){
    const source=fs.readFileSync(file,'utf8');
    for(const tag of pressableOpeningTags(source)){
      if(/accessibilityState=/.test(tag)&&/\bbusy\s*:/.test(tag))busyCount++;
    }
  }
  assert.strictEqual(busyCount,21,'known busy-control surface changed; classify new asynchronous controls');
  const shopping=fs.readFileSync(path.join(root,'src','screens','ShoppingScreen.tsx'),'utf8');
  assert(shopping.includes('busy:addingItem'));
  assert(shopping.includes('busy:exportingPdf'));
  const privacy=fs.readFileSync(path.join(root,'src','screens','PrivacyDataScreen.tsx'),'utf8');
  assert(privacy.includes("busy:busy==='export'"));
  assert(privacy.includes("busy:busy==='delete'"));
  const paywall=fs.readFileSync(path.join(root,'src','screens','PaywallScreen.tsx'),'utf8');
  assert(paywall.includes("busy:busy==='purchase'"));
  assert(paywall.includes("busy:busy==='restore'"));
  const taste=fs.readFileSync(path.join(root,'src','components','RecipeTasteCard.tsx'),'utf8');
  assert(taste.includes('accessibilityState={{disabled:busy,selected:active,busy:busy}}'),'recipe taste choices must announce busy while saving');
  const light=fs.readFileSync(path.join(root,'src','screens','LightParticipationScreen.tsx'),'utf8');
  assert.strictEqual((light.match(/busy:busy/g)||[]).length,5,'light-member asynchronous controls must announce busy');
  const dashboard=fs.readFileSync(path.join(root,'src','screens','HouseholdDashboardScreen.tsx'),'utf8');
  assert.strictEqual((dashboard.match(/busy:avatarBusy/g)||[]).length,2,'avatar actions must announce busy');
  assert(shopping.includes('accessibilityState={{disabled:busy,checked:item.checked,busy:busy}}'),'shopping checkbox must announce busy during server toggle');
});


test('dynamic user feedback is announced without making static text live',()=>{
  const candidates=[path.join(root,'App.tsx')];
  const visit=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())visit(full);else if(/\.tsx$/.test(entry.name))candidates.push(full);}};
  visit(path.join(root,'src'));
  let assertive=0, polite=0, alerts=0;
  for(const file of candidates){
    const source=fs.readFileSync(file,'utf8');
    assertive+=(source.match(/accessibilityLiveRegion="assertive"/g)||[]).length;
    polite+=(source.match(/accessibilityLiveRegion="polite"/g)||[]).length;
    alerts+=(source.match(/accessibilityRole="alert"/g)||[]).length;
  }
  assert.strictEqual(assertive,15,'known assertive feedback surface changed; classify new error announcements');
  assert.strictEqual(alerts,15,'every assertive error must retain alert semantics');
  assert.strictEqual(polite,5,'known polite feedback surface changed; classify new status announcements');
});


test('auth and household identity fields disable unwanted correction and capitalization',()=>{
  const auth=fs.readFileSync(path.join(root,'src','screens','AuthScreen.tsx'),'utf8');
  const recovery=fs.readFileSync(path.join(root,'src','screens','PasswordRecoveryScreen.tsx'),'utf8');
  const household=fs.readFileSync(path.join(root,'src','screens','HouseholdScreen.tsx'),'utf8');
  assert(auth.includes('autoComplete="email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address"'),'email must disable auto-correction and capitalization');
  assert(auth.includes("autoComplete={mode==='signin'?'current-password':'new-password'} value={password} onChangeText={setPassword} autoCapitalize=\"none\" autoCorrect={false} secureTextEntry"),'auth password must disable correction/capitalization');
  assert.strictEqual((recovery.match(/autoCapitalize="none" autoCorrect=\{false\} secureTextEntry/g)||[]).length,2,'both recovery password fields must disable correction/capitalization');
  assert(household.includes("setCode(v.replace(/[^a-zA-Z0-9]/g,'').toUpperCase().slice(0,6))"),'household code must normalize explicitly to uppercase');
  assert(household.includes('autoCapitalize="characters" autoCorrect={false}'),'household code must preserve uppercase entry without auto-correction');
});


test('standalone loading indicators expose progress semantics and localized labels',()=>{
  const candidates=[path.join(root,'App.tsx')];
  const visit=(dir)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);if(entry.isDirectory())visit(full);else if(/\.tsx$/.test(entry.name))candidates.push(full);}};
  visit(path.join(root,'src'));
  let progress=0;
  for(const file of candidates){
    const source=fs.readFileSync(file,'utf8');
    progress+=(source.match(/<ActivityIndicator\b[^>]*accessibilityRole="progressbar"[^>]*accessibilityLabel=\{locale\.t\('common\.loading'\)\}/g)||[]).length;
  }
  assert.strictEqual(progress,14,'known standalone loader surface changed; classify new loaders explicitly');
  const i18n=fs.readFileSync(path.join(root,'src','i18n','index.ts'),'utf8');
  assert.strictEqual((i18n.match(/'common\.loading'/g)||[]).length,4,'common.loading must exist in all supported languages');
});


test('all known dynamic error surfaces announce assertively',()=>{
  const dashboard=fs.readFileSync(path.join(root,'src','screens','HouseholdDashboardScreen.tsx'),'utf8');
  const shopping=fs.readFileSync(path.join(root,'src','screens','ShoppingScreen.tsx'),'utf8');
  const recipes=fs.readFileSync(path.join(root,'src','screens','RecipesScreen.tsx'),'utf8');
  const planning=fs.readFileSync(path.join(root,'src','screens','PlanningScreen.tsx'),'utf8');
  for(const marker of ['avatarError','responsibilityError','exportError','photoImportError','importError','ideaError']){
    const source=marker==='avatarError'?dashboard:marker==='responsibilityError'||marker==='exportError'?shopping:marker==='ideaError'?planning:recipes;
    const pattern=new RegExp(`\{${marker}[^\n]*?<Text[^>]*accessibilityRole=\"alert\"[^>]*accessibilityLiveRegion=\"assertive\"`);
    assert(pattern.test(source),`${marker} must be announced as an assertive alert`);
  }
  assert(/\{error \? <Text[^>]*accessibilityRole=\"alert\"[^>]*accessibilityLiveRegion=\"assertive\"/.test(recipes),'recipe list error must be announced as an assertive alert');
});


test('recipe favorite heart keeps a 44x44 effective touch target without changing visual size',()=>{
  const recipes=fs.readFileSync(path.join(root,'src','screens','RecipesScreen.tsx'),'utf8');
  assert(recipes.includes('accessibilityState={{selected:recipe.favorite}} hitSlop={5}'),'favorite heart must expand its hit target by 5 points on each side');
  assert(recipes.includes("heart: { width: 34, height: 34"),'favorite heart visual size must remain 34x34');
});


test('notification preference save reports native scheduling failures instead of leaking rejections',()=>{
  const source=fs.readFileSync(path.join(root,'src','screens','NotificationSettingsScreen.tsx'),'utf8');
  assert(source.includes("try{\n      await saveNotificationPreferences(prefs);"),'notification save must guard preference/native scheduling calls');
  assert(source.includes("setSaved(false);setStatus('');setError(locale.t('notifications.scheduleError'));"),'notification save must surface a localized failure');
  const i18n=fs.readFileSync(path.join(root,'src','i18n','index.ts'),'utf8');
  assert.strictEqual((i18n.match(/'notifications\.scheduleError'/g)||[]).length,4,'notification scheduling failure must be localized in all supported languages');
});


test('structured time input inserts a colon while accepting only four digits',()=>{
  assert.strictEqual(structuredInput.formatTimeInput('1'),'1');
  assert.strictEqual(structuredInput.formatTimeInput('173'),'17:3');
  assert.strictEqual(structuredInput.formatTimeInput('17:30'),'17:30');
  assert.strictEqual(structuredInput.formatTimeInput('17h30'),'17:30');
  assert.strictEqual(structuredInput.formatTimeInput('173099'),'17:30');
});

test('structured ISO date input inserts separators while accepting only eight digits',()=>{
  assert.strictEqual(structuredInput.formatIsoDateInput('2026'),'2026');
  assert.strictEqual(structuredInput.formatIsoDateInput('202609'),'2026-09');
  assert.strictEqual(structuredInput.formatIsoDateInput('20260915'),'2026-09-15');
  assert.strictEqual(structuredInput.formatIsoDateInput('2026/09/15'),'2026-09-15');
  assert.strictEqual(structuredInput.formatIsoDateInput('2026091599'),'2026-09-15');
});

test('time and ISO date fields use a cross-platform numeric keypad with native length bounds',()=>{
  const notifications=fs.readFileSync(path.join(root,'src','screens','NotificationSettingsScreen.tsx'),'utf8');
  const pantry=fs.readFileSync(path.join(root,'src','screens','PantryScreen.tsx'),'utf8');
  assert(!notifications.includes('keyboardType="numbers-and-punctuation"'));
  assert(!pantry.includes('keyboardType="numbers-and-punctuation"'));
  assert(notifications.includes('keyboardType="number-pad" maxLength={5}'));
  assert(pantry.includes('keyboardType="number-pad" maxLength={10}'));
  assert(notifications.includes('formatTimeInput(v)'));
  assert(pantry.includes('formatIsoDateInput(v)'));
});


test('notification save is single-flight and exposes busy state while scheduling',()=>{
  const source=fs.readFileSync(path.join(root,'src','screens','NotificationSettingsScreen.tsx'),'utf8');
  assert(source.includes('const saveInFlight=useRef(false);'),'notification save must use a synchronous in-flight lock');
  assert(source.includes('if(saveInFlight.current)return;'),'notification save must refuse duplicate in-flight taps');
  assert(source.includes('saveInFlight.current=true;setSaving(true);'),'notification save must lock before awaiting native work');
  assert(source.includes('saveInFlight.current=false;setSaving(false);'),'notification save must unlock in finally');
  assert(source.includes('accessibilityState={{disabled:saving,busy:saving}} disabled={saving}'),'save button must expose disabled and busy state');
  const i18n=fs.readFileSync(path.join(root,'src','i18n','index.ts'),'utf8');
  assert.strictEqual((i18n.match(/'notifications\.saving'/g)||[]).length,4,'notifications.saving must be localized in all supported languages');
});

test('purchase restore and account deletion are guarded by synchronous single-flight locks',()=>{
  const paywall=fs.readFileSync(path.join(root,'src','screens','PaywallScreen.tsx'),'utf8');
  assert(paywall.includes('const billingInFlight=useRef(false);'),'billing actions must use a synchronous in-flight lock');
  assert(paywall.includes('if(active||busy||billingInFlight.current) return;'),'purchase must refuse duplicate in-flight taps');
  assert(paywall.includes('if(!production||!storeOffer||busy||billingInFlight.current) return;'),'restore must refuse duplicate in-flight taps');
  assert.strictEqual((paywall.match(/billingInFlight\.current=true;setBusy\('/g)||[]).length,3,'purchase/trial/restore paths must lock before awaiting');
  assert.strictEqual((paywall.match(/billingInFlight\.current=false;setBusy\(null\)/g)||[]).length,3,'billing paths must unlock in finally');
  const privacy=fs.readFileSync(path.join(root,'src','screens','PrivacyDataScreen.tsx'),'utf8');
  assert(privacy.includes('const deleteInFlight=useRef(false);'),'account deletion must use a synchronous in-flight lock');
  assert(privacy.includes("if(deleteInFlight.current)return;deleteInFlight.current=true;setBusy('delete')"),'account deletion must lock before awaiting');
  assert(privacy.includes('finally{deleteInFlight.current=false;setBusy(null);}'),'account deletion must unlock in finally');
});

test('household light-member and privacy submissions use synchronous single-flight guards',()=>{
  const household=fs.readFileSync(path.join(root,'src','screens','HouseholdScreen.tsx'),'utf8');
  assert(household.includes('const submitInFlight=useRef(false);'),'household create/join must use a synchronous in-flight lock');
  assert(household.includes('if(submitInFlight.current)return;submitInFlight.current=true;setLoading(true)'),'household submit must lock before awaiting');
  assert(household.includes('finally{submitInFlight.current=false;setLoading(false);}'),'household submit must unlock in finally');
  const dashboard=fs.readFileSync(path.join(root,'src','screens','HouseholdDashboardScreen.tsx'),'utf8');
  assert(dashboard.includes('const inviteInFlight=useRef(false);'),'household invite must use a synchronous in-flight lock');
  assert(dashboard.includes('if(loading||inviteInFlight.current)return;'),'household invite must reject duplicate taps');
  assert(dashboard.includes('inviteInFlight.current=true;setLoading(true)'),'household invite must lock before awaiting');
  assert(dashboard.includes('finally{inviteInFlight.current=false;setLoading(false);}'),'household invite must unlock in finally');
  const privacy=fs.readFileSync(path.join(root,'src','screens','PrivacyDataScreen.tsx'),'utf8');
  assert(privacy.includes('const exportInFlight=useRef(false);'),'privacy export must use a synchronous in-flight lock');
  assert(privacy.includes("if(exportInFlight.current)return;exportInFlight.current=true;setBusy('export')"),'privacy export must lock before awaiting');
  assert(privacy.includes('finally{exportInFlight.current=false;setBusy(null);}'),'privacy export must unlock in finally');
  const light=fs.readFileSync(path.join(root,'src','screens','LightParticipationScreen.tsx'),'utf8');
  assert(light.includes('const actionInFlight=useRef(false);'),'light-member actions must share a synchronous in-flight lock');
  assert((light.match(/actionInFlight\.current=true;setBusy\(true\)/g)||[]).length>=4,'light-member mutations must lock before awaiting');
  assert((light.match(/actionInFlight\.current=false;setBusy\(false\)/g)||[]).length>=4,'light-member mutations must unlock in finally');
});

test('planning pantry and shopping side effects use synchronous single-flight guards',()=>{
  const planning=fs.readFileSync(path.join(root,'src','screens','PlanningScreen.tsx'),'utf8');
  assert(planning.includes('const mealMutationInFlight=useRef(false);'),'meal save/delete must share a synchronous lock');
  assert(planning.includes('const weekActionInFlight=useRef(false);'),'week copy/rebuild must share a synchronous lock');
  assert(planning.includes('const ideaActionInFlight=useRef(false);'),'meal idea mutations must share a synchronous lock');
  assert(planning.includes('if(!editing||mealMutationInFlight.current)return;'),'meal save/delete must reject duplicate taps');
  const pantry=fs.readFileSync(path.join(root,'src','screens','PantryScreen.tsx'),'utf8');
  assert(pantry.includes('const mutationInFlight=useRef(false);'),'pantry mutations must share a synchronous lock');
  assert(pantry.includes('if(!label.trim()||mutationInFlight.current)return;mutationInFlight.current=true;'),'pantry add must lock before awaiting');
  assert(pantry.includes('if(mutationInFlight.current)return;mutationInFlight.current=true;setError'), 'pantry delete must lock before awaiting');
  const shopping=fs.readFileSync(path.join(root,'src','screens','ShoppingScreen.tsx'),'utf8');
  assert(shopping.includes('const addInFlight=useRef(false);'),'shopping add must use a synchronous lock');
  assert(shopping.includes('const toolsInFlight=useRef(false);'),'shopping tool mutations must share a synchronous lock');
  assert(shopping.includes('if(!cleanLabel||addingItem||addInFlight.current)return;'),'shopping add must reject duplicate taps');
  assert((shopping.match(/toolsInFlight\.current=true/g)||[]).length>=5,'shopping clear/export/responsibility actions must lock before awaiting');
});

test('auth profile and sign-out actions use synchronous single-flight guards',()=>{
  const app=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
  assert(app.includes('const exitInFlightRef=useRef(false);'),'sign-out must use a synchronous in-flight lock');
  assert(app.includes('if(exitInFlightRef.current)return;'),'sign-out must reject duplicate taps');
  assert(app.includes('finally{exitInFlightRef.current=false;}'),'sign-out must unlock in finally');
  const auth=fs.readFileSync(path.join(root,'src','screens','AuthScreen.tsx'),'utf8');
  assert(auth.includes('const authInFlight=useRef(false);'),'auth submit/reset must share a synchronous in-flight lock');
  assert(auth.includes('password.length<6||authInFlight.current'),'auth submit must reject duplicate taps');
  assert(auth.includes('if(!supabase||authInFlight.current)return;'),'password reset must reject duplicate taps');
  assert.strictEqual((auth.match(/authInFlight\.current=false;setLoading\(false\)/g)||[]).length,2,'auth paths must unlock in finally');
  const recovery=fs.readFileSync(path.join(root,'src','screens','PasswordRecoveryScreen.tsx'),'utf8');
  assert(recovery.includes('const submitInFlight=useRef(false);'),'password update must use a synchronous in-flight lock');
  assert(recovery.includes('!valid||submitInFlight.current'),'password update must reject duplicate taps');
  assert(recovery.includes('submitInFlight.current=false;setLoading(false)'),'password update must unlock in finally');
  const dashboard=fs.readFileSync(path.join(root,'src','screens','HouseholdDashboardScreen.tsx'),'utf8');
  assert(dashboard.includes('const avatarInFlight=useRef(false);'),'avatar choose/delete must share a synchronous lock');
  assert.strictEqual((dashboard.match(/avatarInFlight\.current=false;setAvatarBusy\(false\)/g)||[]).length,2,'avatar paths must unlock in finally');
  assert(dashboard.includes('const prefsInFlight=useRef(false);'),'preference save must use a synchronous lock');
  assert(dashboard.includes('if(prefsInFlight.current)return;prefsInFlight.current=true;setPrefsSaving(true)'),'preference save must lock before awaiting');
  assert(dashboard.includes('accessibilityState={{disabled:prefsSaving,busy:prefsSaving}}'),'preference save must expose disabled/busy state');
});

test('recipe and presence mutations use synchronous single-flight guards',()=>{
  const recipes=fs.readFileSync(path.join(root,'src','screens','RecipesScreen.tsx'),'utf8');
  assert(recipes.includes('const importInFlight=useRef(false);'),'recipe URL import must use a synchronous lock');
  assert(recipes.includes('const photoImportInFlight=useRef(false);'),'recipe photo import must use a synchronous lock');
  assert(recipes.includes('const favoriteInFlight=useRef<Set<string>>(new Set());'),'favorite toggles must use per-recipe synchronous locks');
  assert(recipes.includes('const shoppingInFlight=useRef(false);'),'add-to-shopping must use a synchronous lock');
  assert(recipes.includes('const saveInFlight=useRef(false);'),'recipe save must use a synchronous lock');
  assert(recipes.includes('if (!importUrl.trim()||importInFlight.current) return;'),'URL import must reject a duplicate submission');
  assert(recipes.includes('if(photoImportInFlight.current)return;'),'photo import must reject a duplicate submission');
  assert(recipes.includes('if(favoriteInFlight.current.has(recipe.id))return;'),'favorite toggle must reject a duplicate mutation for the same recipe');
  assert(recipes.includes('if (!selected||shoppingInFlight.current) return;'),'add-to-shopping must reject a duplicate submission');
  assert(recipes.includes('if (!title.trim()||saveInFlight.current) return;'),'recipe save must reject a duplicate submission');
  const presence=fs.readFileSync(path.join(root,'src','screens','PresenceScreen.tsx'),'utf8');
  assert(presence.includes('const toggleInFlightRef=useRef(false);'),'presence mutations must use a synchronous lock');
  assert(presence.includes('if(busyKey||toggleInFlightRef.current)return;'),'presence toggle must reject a duplicate tap before rerender');
  assert(presence.includes("finally{toggleInFlightRef.current=false;setBusyKey('');}"),'presence toggle must unlock in finally');
  const taste=fs.readFileSync(path.join(root,'src','components','RecipeTasteCard.tsx'),'utf8');
  assert(taste.includes('const tasteInFlight=useRef(false);'),'recipe taste mutation must use a synchronous lock');
  assert(taste.includes('if(busy||tasteInFlight.current)return;'),'recipe taste choice must reject a duplicate tap before rerender');
  assert(taste.includes('finally{tasteInFlight.current=false;setBusy(false);}'),'recipe taste choice must unlock in finally');
});

let passed=0;
for(const {name,fn} of tests){
  try{fn();passed++;console.log(`PASS ${name}`);}catch(error){console.error(`FAIL ${name}`);console.error(error?.stack||error);process.exitCode=1;}
}
console.log(`Regression tests: ${passed}/${tests.length} passed`);
fs.rmSync(temp,{recursive:true,force:true});
if(process.exitCode)process.exit(process.exitCode);

