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
  'src/lib/cookWithPantry.ts',
  'src/lib/lia.ts',
  'src/lib/liaIdentity.ts',
  'src/lib/liaEconomics.ts',
  'src/lib/liaAgentRouting.ts',
  'src/lib/liaAgentTurnClassifier.ts',
  'src/lib/liaAgentRequest.ts',
  'src/lib/liaAgentProviderExecution.ts',
  'src/lib/liaAgentFailureReply.ts',
  'src/lib/liaAssistantObjective.ts',
  'src/lib/liaAssistantActionPolicy.ts',
  'src/lib/liaAssistantDirectAction.ts',
  'src/lib/liaDiscovery.ts',
  'src/lib/liaSocialPresence.ts',
  'src/lib/liaAudioRuntime.ts',
  'src/lib/liaFamilyForm.ts',
  'src/lib/liaConversationPolicy.ts',
  'src/domain/commanderLia.ts',
  'src/domain/familyMessageEligibility.ts',
  'src/lib/liaCookingCompanion.ts',
  'src/lib/liaRelationship.ts',
  'src/lib/liaKnowledgeGuard.ts',
  'src/lib/liaOpenLoops.ts',
  'src/lib/liaRightHand.ts',
  'src/lib/liaAssistantVoice.ts',
  'src/lib/liaMusicCommand.ts',
  'src/lib/liaMusicPresence.ts',
  'src/lib/liaReminderRequest.ts',
  'src/lib/liaAssistantTimer.ts',
  'src/lib/liaPersonalPresence.ts',
  'src/lib/liaBirthdayAwareness.ts',
  'src/lib/liaProfileFacts.ts',
  'src/lib/liaHomeMealStyle.ts',
  'src/lib/liaFamilyFollowthrough.ts',
  'src/services/liaNavigationLiveSession.ts',
  'src/lib/liaPhoneContactResolver.ts',
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
const navigationLive=require(path.join(temp,'src/services/liaNavigationLiveSession.js'));
const runtimeConfig=require(path.join(temp,'src/lib/runtimeConfig.js'));
const storageCodec=require(path.join(temp,'src/lib/storageCodec.js'));
const requestGate=require(path.join(temp,'src/lib/requestGate.js'));
const offlineQueue=require(path.join(temp,'src/lib/offlineQueue.js'));
const authLinks=require(path.join(temp,'src/lib/authLinks.js'));
const premiumGate=require(path.join(temp,'src/lib/premiumGate.js'));
const structuredInput=require(path.join(temp,'src/lib/structuredInput.js'));
const cookWithPantry=require(path.join(temp,'src/lib/cookWithPantry.js'));
const lia=require(path.join(temp,'src/lib/lia.js'));
const liaIdentity=require(path.join(temp,'src/lib/liaIdentity.js'));
const liaEconomics=require(path.join(temp,'src/lib/liaEconomics.js'));
const liaAgentRouting=require(path.join(temp,'src/lib/liaAgentRouting.js'));
const liaAgentTurnClassifier=require(path.join(temp,'src/lib/liaAgentTurnClassifier.js'));
const liaAgentRequest=require(path.join(temp,'src/lib/liaAgentRequest.js'));
const liaAgentProviderExecution=require(path.join(temp,'src/lib/liaAgentProviderExecution.js'));
const liaAgentFailureReply=require(path.join(temp,'src/lib/liaAgentFailureReply.js'));
const liaAssistantObjective=require(path.join(temp,'src/lib/liaAssistantObjective.js'));
const liaAssistantActionPolicy=require(path.join(temp,'src/lib/liaAssistantActionPolicy.js'));
const liaAssistantDirectAction=require(path.join(temp,'src/lib/liaAssistantDirectAction.js'));
const liaDiscovery=require(path.join(temp,'src/lib/liaDiscovery.js'));
const liaSocial=require(path.join(temp,'src/lib/liaSocialPresence.js'));
const liaAudioRuntime=require(path.join(temp,'src/lib/liaAudioRuntime.js'));
const liaFamilyForm=require(path.join(temp,'src/lib/liaFamilyForm.js'));
const liaConversationPolicy=require(path.join(temp,'src/lib/liaConversationPolicy.js'));
const commanderLia=require(path.join(temp,'src/domain/commanderLia.js'));
const familyMessageEligibility=require(path.join(temp,'src/domain/familyMessageEligibility.js'));
const liaCookingCompanion=require(path.join(temp,'src/lib/liaCookingCompanion.js'));
const liaRelationship=require(path.join(temp,'src/lib/liaRelationship.js'));
const liaKnowledgeGuard=require(path.join(temp,'src/lib/liaKnowledgeGuard.js'));
const liaOpenLoops=require(path.join(temp,'src/lib/liaOpenLoops.js'));
const liaRightHand=require(path.join(temp,'src/lib/liaRightHand.js'));
const liaAssistantVoice=require(path.join(temp,'src/lib/liaAssistantVoice.js'));
const liaMusicCommand=require(path.join(temp,'src/lib/liaMusicCommand.js'));
const liaMusicPresence=require(path.join(temp,'src/lib/liaMusicPresence.js'));
const liaReminderRequest=require(path.join(temp,'src/lib/liaReminderRequest.js'));
const liaAssistantTimer=require(path.join(temp,'src/lib/liaAssistantTimer.js'));
const liaPersonalPresence=require(path.join(temp,'src/lib/liaPersonalPresence.js'));
const liaBirthdayAwareness=require(path.join(temp,'src/lib/liaBirthdayAwareness.js'));
const liaProfileFacts=require(path.join(temp,'src/lib/liaProfileFacts.js'));
const liaHomeMealStyle=require(path.join(temp,'src/lib/liaHomeMealStyle.js'));
const liaFamilyFollowthrough=require(path.join(temp,'src/lib/liaFamilyFollowthrough.js'));
const liaPhoneContactResolver=require(path.join(temp,'src/lib/liaPhoneContactResolver.js'));
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

test('light-member tokens remain cryptographically random and stored only as hashes while V0.294 keeps a valid bearer editable until expiry',()=>{
  const foundation=fs.readFileSync(path.join(root,'supabase','migrations','202609150012_light_members_response_foundation.sql'),'utf8');
  const current=fs.readFileSync(path.join(root,'supabase','migrations','202609190029_lia_contextual_family_guidance.sql'),'utf8');
  assert.ok(foundation.includes("encode(gen_random_bytes(32),'hex')"));
  assert.ok(foundation.includes("encode(digest(v_token,'sha256'),'hex')"));
  assert.ok(!/create table[^;]+light_response_tokens[\s\S]*?\btoken\s+text\b/i.test(foundation));
  assert.ok(current.includes('Keep the same opaque token alive until its existing expiry'));
  assert.ok(current.includes('update public.light_response_tokens set consumed_at=null'));
  assert.ok(!/v_token_row\.consumed_at\s+is\s+not\s+null/i.test((current.match(/create or replace function public\.submit_light_response[\s\S]*?end; \$\$;/i)||[])[0]||''));
});

test('V0.294 token-scoped family context exposes names and choices but never phone numbers',()=>{
  const sql=fs.readFileSync(path.join(root,'supabase','migrations','202609190029_lia_contextual_family_guidance.sql'),'utf8');
  const context=(sql.match(/create or replace function public\.get_light_response_context[\s\S]*?end; \$\$;/i)||[])[0]||'';
  const board=(sql.match(/create or replace function public\.get_light_family_decisions[\s\S]*?end; \$\$;/i)||[])[0]||'';
  assert.ok(context.includes("'member_name'")&&context.includes("'household_name'")&&context.includes("'recipients'"));
  assert.ok(board.includes("'member_name'")&&board.includes("'desire'")&&board.includes("'takes_charge'"));
  assert.ok(!context.includes("'phone_number'"));
  assert.ok(!board.includes("'phone_number'"));
});

test('V0.294 organizer controls only the five active meal choices and reconfiguring the question resets stale answers',()=>{
  const sql=fs.readFileSync(path.join(root,'supabase','migrations','202609190029_lia_contextual_family_guidance.sql'),'utf8');
  assert.ok(sql.includes('p_desire_options text[]'));
  assert.ok(sql.includes("desire_options <@ array['home','pizza','pasta','sushi','chinese']::text[]"));
  assert.ok(sql.includes('cardinality(desire_options)<=5'));
  assert.ok(sql.includes('delete from public.light_response_tokens where question_id=v_id'));
  assert.ok(sql.includes('delete from public.light_meal_responses where question_id=v_id'));
  assert.ok(sql.includes('v_desire=any(v_question.desire_options)'));
  assert.ok(!/desire_options <@ array\[[^\]]*surprise/i.test(sql));
});

test('V0.294 take-charge is a separate editable checkbox with a single concurrent winner',()=>{
  const sql=fs.readFileSync(path.join(root,'supabase','migrations','202609190029_lia_contextual_family_guidance.sql'),'utf8');
  const edge=fs.readFileSync(path.join(root,'supabase','functions','light-response','index.ts'),'utf8');
  assert.ok(sql.includes('takes_charge boolean not null default false'));
  assert.ok(sql.includes('light_meal_responses_one_take_charge_idx'));
  assert.ok(sql.includes("raise exception 'QUESTION_TAKEN_OVER:%'"));
  assert.ok(edge.includes("takes_charge:takesCharge"));
  assert.ok(edge.includes("takesCharge=!takesCharge"));
  assert.ok(edge.includes("☑ "));
});

test('V0.294 retired surprise choice is migrated to home and absent from the active UI/type contract',()=>{
  const sql=fs.readFileSync(path.join(root,'supabase','migrations','202609190029_lia_contextual_family_guidance.sql'),'utf8');
  const edge=fs.readFileSync(path.join(root,'supabase','functions','light-response','index.ts'),'utf8');
  const service=fs.readFileSync(path.join(root,'src','services','lightParticipation.ts'),'utf8');
  assert.ok(sql.includes("update public.light_meal_responses set desire='home' where desire='surprise'"));
  assert.ok(!service.includes("|'surprise'"));
  assert.ok(!edge.includes("surprise:'"));
  assert.ok(!edge.includes("data-choice=\"surprise\""));
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
  assert.ok(edge.includes("admin.rpc('get_light_family_decisions'"));
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
  assert.ok(smoke.includes("replay.status!==200"));
  assert.ok(smoke.includes("takes_charge:true"));
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
  const result=spawnSync(process.execPath,[path.join(root,'scripts','release-doctor.cjs'),'--json'],{cwd:root,env,encoding:'utf8',timeout:15000});
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
  for(const marker of ["'App.tsx'","'index.ts'","...listFiles('src')","...listFiles('modules')","...listFiles('languages')"]) assert.ok(source.includes(marker));
  const runtimeFiles=[];
  const walk=(dir)=>{for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const rel=path.join(dir,entry.name);if(entry.isDirectory())walk(rel);else if(entry.isFile())runtimeFiles.push(rel);}};
  walk('src');
  walk('modules');
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


test('iOS household reminder permission stays alert-only while explicit LIA alarms use a separate sound permission path',()=>{
  const source=fs.readFileSync(path.join(root,'src','services','notifications.ts'),'utf8');
  const reminderStart=source.indexOf('async function requestReminderPermission()');
  const assistantStart=source.indexOf('async function requestLiaAssistantAlarmPermission()');
  const reminder=source.slice(reminderStart,source.indexOf('async function clearOurScheduledNotifications',reminderStart));
  const assistant=source.slice(assistantStart,source.indexOf('export async function cancelLiaAssistantAlarm',assistantStart));
  assert(reminder.includes('allowAlert:true'),'household reminders must request alert display');
  assert(reminder.includes('allowBadge:false'),'household reminders must not request badge permission');
  assert(reminder.includes('allowSound:false'),'household reminders must remain silent');
  assert(!reminder.includes('allowSound:true'),'existing household reminder behavior must not change');
  assert(assistant.includes('allowSound:true'),'only an explicitly accepted LIA assistant alarm may request sound');
  assert(source.includes('permission=await requestReminderPermission()'),'legacy household scheduling must keep the minimized helper');
  assert(!source.includes('allowBadge:true'),'no reminder path may request badge permission');
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
  assert.strictEqual(count,197,'known Pressable surface changed; audit and classify the new controls');
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
  assert.strictEqual(disabledCount,57,'known disabled Pressable surface changed; audit the new controls');
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
  assert.strictEqual(selectedCount,37,'known selected Pressable surface changed; classify new persistent selection controls');
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
  assert.strictEqual(count,38,'known TextInput surface changed; label new fields explicitly');
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
  assert.strictEqual(expandedCount,13,'known disclosure-control surface changed; classify new expandable controls');
  assert(fs.readFileSync(path.join(root,'src','screens','CookingModeScreen.tsx'),'utf8').includes('expanded:ingredientsOpen'));
  assert(fs.readFileSync(path.join(root,'src','screens','RecipesScreen.tsx'),'utf8').includes('expanded:filtersOpen'));
  assert(fs.readFileSync(path.join(root,'src','screens','PlanningScreen.tsx'),'utf8').includes('expanded:mealDetailsOpen'));
  assert(fs.readFileSync(path.join(root,'src','screens','CookWithWhatIHaveScreen.tsx'),'utf8').includes('expanded:partyEntryOpen'));
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
  assert.strictEqual(busyCount,38,'known busy-control surface changed; classify new asynchronous controls');
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
  assert.strictEqual(assertive,25,'known assertive feedback surface changed; classify new error announcements');
  assert.strictEqual(alerts,26,'every assertive error must retain alert semantics');
  assert.strictEqual(polite,7,'known polite feedback surface changed; classify new status announcements');
  const navigation=fs.readFileSync(path.join(root,'src','screens','LiaNavigationScreen.tsx'),'utf8');
  assert(navigation.includes('accessibilityLiveRegion="polite" style={styles.instructionText}'),'navigation maneuver changes must remain politely announced');
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
  assert.strictEqual(progress,19,'known standalone loader surface changed; classify new loaders explicitly');
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


test('cook-with pantry quantities scale to the actual dinner party',()=>{
  const recipe={id:'r1',title:'Dinner',prep_minutes:10,cook_minutes:20,portions:2,tags:[],ingredients:[
    {name:'Tomatoes',ingredient_key:'tomato',quantity:4,unit:'piece'},
    {name:'Rice',ingredient_key:'rice',quantity:200,unit:'g'},
    {name:'Cream',ingredient_key:'cream',quantity:100,unit:'ml'},
  ]};
  const pantry=[
    {label:'Tomatoes',ingredient_key:'tomato',quantity:6,unit:'piece'},
    {label:'Rice',ingredient_key:'rice',quantity:500,unit:'g'},
    {label:'Cream',ingredient_key:'cream',quantity:null,unit:'ml'},
  ];
  const [forTwo]=cookWithPantry.rankRecipesForPantry([recipe],pantry,3,2);
  assert.strictEqual(forTwo.insufficient.length,0,'six tomatoes and 500g rice should cover the base 2 portions');
  assert.strictEqual(forTwo.quantityUnknown.length,1,'unknown cream quantity must remain explicit');
  const [forFour]=cookWithPantry.rankRecipesForPantry([recipe],pantry,3,4);
  assert.deepStrictEqual(forFour.insufficient.map(item=>item.ingredient_key),['tomato'],'recipe quantities must scale from 2 to 4 people before claiming enough stock');
  assert.strictEqual(forFour.quantityUnknown.length,1,'unknown quantities must never become sufficient merely because the ingredient exists');
});

test('cook-with-what-I-have keeps photo batches cumulative and international-ready',()=>{
  const screen=fs.readFileSync(path.join(root,'src','screens','CookWithWhatIHaveScreen.tsx'),'utf8');
  const vision=fs.readFileSync(path.join(root,'src','lib','pantryVision.ts'),'utf8');
  const recipes=fs.readFileSync(path.join(root,'src','screens','RecipesScreen.tsx'),'utf8');
  const types=fs.readFileSync(path.join(root,'src','types.ts'),'utf8');
  assert(recipes.includes('CookWithWhatIHaveScreen'),'the flow must stay inside Recipes/Cooking instead of adding a main tab');
  assert.strictEqual(types.includes("'pantry' |"),false,'the pantry-photo flow must not add a pantry main tab');
  assert(screen.includes('mergePantryVisionItems(current,next)'),'a new photo must merge with the current batch instead of replacing it');
  assert(screen.includes('photoIndex:photoCount+1'),'each additional photo must keep its position in the same scan session');
  assert(screen.includes('sessionId:visionSessionId'),'all photos in one flow must share a stable vision session id');
  assert(screen.includes('displayLanguage:locale.language'),'vision must receive the display language as context, not as a recognition limit');
  assert(screen.includes('regionCode:locale.regionCode'),'vision must receive region context for product lookup');
  assert(vision.includes("capabilities:['vision','ocr','barcode','catalog','memory']"),'the international recognition contract must support visual, OCR, barcode, catalog and learned-memory layers');
  assert(vision.includes("ingredientKey:'language-neutral'"),'the backend contract must request language-neutral ingredient keys');
  assert(vision.includes("PantryRecognitionLevel='exact_product'|'ingredient'|'category'|'unknown'"),'recognition must degrade gracefully from exact product to category/unknown');
  assert(vision.includes('needsConfirmation'),'uncertain recognition must be representable without pretending certainty');
  assert(vision.includes('productCode'),'barcode/GTIN identity must be representable when available');
  assert(screen.includes("locale.t('cookWith.completeQuestion')"),'after a photo Notre Table must ask conversationally whether the organizer wants to add more');
  assert(screen.includes("locale.t('cookWith.addManual')"),'the organizer must be able to complement photos manually without leaving the flow');
  assert(screen.includes('uncertainDetected'),'uncertain products must be separated from usable ingredients');
  assert(screen.includes('detected.filter(item=>!item.needsConfirmation)'),'unconfirmed recognition must not drive recipe suggestions');
  assert(screen.includes('partySize?<Ideas'),'recipe ideas must stay hidden until the dinner headcount is known');
  assert(screen.includes('onAskFamily={()=>setFamilyOpen(true)}'),'unknown headcount must connect directly to family participation');
  assert(screen.includes('rankRecipesForPantry(recipes,sourceItems,3,partySize)'),'recipe matching must receive the actual party size');
  assert(vision.includes('quantityConfidence'),'vision recognition must represent quantity uncertainty instead of inventing precision');
  assert(screen.includes('item.quantityConfidence>=.7?item.quantity:null'),'low-confidence photo quantities must not drive portion calculations');
  assert(vision.includes('otherQuantityConfidence>bestQuantityConfidence'),'duplicate photos must keep the more reliable quantity estimate instead of summing views');
  assert(screen.includes('accessibilityState={{expanded:manualOpen}}'),'the conversational manual-entry disclosure must expose its expanded state');
});


test('first launch chooses language before LIA introduces the app',()=>{
  const app=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src','screens','LanguageFirstScreen.tsx'),'utf8');
  const prefs=fs.readFileSync(path.join(root,'src','services','appPreferences.ts'),'utf8');
  const onboarding=fs.readFileSync(path.join(root,'src','screens','OnboardingScreen.tsx'),'utf8');
  assert(app.indexOf('if(!languageChosen)')<app.indexOf('if(!onboardingSeen)'),'language selection must precede LIA introduction');
  assert(app.includes('await locale.setLanguage(language);await markLanguageChosen();'),'chosen language must be persisted before leaving the first screen');
  assert(prefs.includes("@notre-table/language-chosen-v1"),'explicit first-language completion must have its own durable preference');
  assert(screen.includes('supportedLanguages.map'),'the first screen must show the actual supported language list');
  assert(screen.includes('accessibilityRole="radio"')&&screen.includes('accessibilityState={{checked:active}}'),'language choices must expose single-selection semantics');
  assert(onboarding.includes('liaBadge'),'LIA must visibly introduce herself immediately after the language choice');
});

test('LIA is a persistent global confidante with guarded social behavior',()=>{
  const main=fs.readFileSync(path.join(root,'src','screens','MainScreen.tsx'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src','components','LiaOrb.tsx'),'utf8');
  const contract=fs.readFileSync(path.join(root,'docs','LIA_CONFIDANTE_V0156.md'),'utf8');
  assert(main.includes('<LiaOrb'),'LIA must live above the tab screens instead of inside a single page');
  assert(orb.includes("'cooking','table','idle'"),'LIA surface must expose cooking, table and quiet modes');
  assert(orb.includes("'discreet','present','host'"),'LIA must expose a bounded social-presence control');
  assert(orb.includes("accessibilityState={{expanded:open}}"),'the persistent LIA control must expose its expanded state');
  assert(contract.includes('humain en train de parler → LIA se tait'),'the product contract must forbid LIA from talking over people');
  assert(contract.includes('organizer')&&contract.includes('member_private')&&contract.includes('household'),'family memory must have explicit visibility levels');
});

test('LIA asks only useful missing questions and yields to humans',()=>{
  assert.strictEqual(lia.liaMayAskQuestion({answerAlreadyKnown:false,answerWouldChangeDecision:true,askedRecently:false,sensitiveWithoutConsent:false}),true);
  assert.strictEqual(lia.liaMayAskQuestion({answerAlreadyKnown:true,answerWouldChangeDecision:true,askedRecently:false,sensitiveWithoutConsent:false}),false);
  assert.strictEqual(lia.liaMayAskQuestion({answerAlreadyKnown:false,answerWouldChangeDecision:false,askedRecently:false,sensitiveWithoutConsent:false}),false);
  assert.strictEqual(lia.liaMaySpeak({enabled:true,mode:'table',socialLevel:'present',directAddressed:false,humanSpeechActive:true,silenceMs:3000,hasUsefulIntervention:true}),false,'human speech must always win');
  assert.strictEqual(lia.liaMaySpeak({enabled:true,mode:'table',socialLevel:'present',directAddressed:false,humanSpeechActive:false,silenceMs:900,hasUsefulIntervention:true}),false,'table mode must wait for a real silence');
  assert.strictEqual(lia.liaMaySpeak({enabled:true,mode:'table',socialLevel:'present',directAddressed:false,humanSpeechActive:false,silenceMs:1600,hasUsefulIntervention:true}),true);
  assert.strictEqual(lia.liaMustYieldToHuman(true),true);
});

test('LIA memory respects confirmation, expiry and household privacy',()=>{
  const base={id:'m1',householdId:'h1',kind:'nutrition_goal',subjectUserId:'u1',value:{calories:1800},visibility:'member_private',confirmed:true};
  assert.strictEqual(lia.liaMemoryIsActive(base,'2026-09-16T12:00:00Z'),true);
  assert.strictEqual(lia.liaMemoryIsActive({...base,validUntil:'2026-09-15T00:00:00Z'},'2026-09-16T12:00:00Z'),false);
  assert.strictEqual(lia.liaMemoryIsActive({...base,confirmed:false},'2026-09-16T12:00:00Z'),false);
  assert.strictEqual(lia.liaCanSayMemoryToHousehold(base),false,'private nutrition goals must not be announced to the table');
  assert.strictEqual(lia.liaCanSayMemoryToHousehold({...base,visibility:'household'}),true);
  assert.strictEqual(lia.liaShouldOfferLeftover({availablePortions:1,expectedEaters:1,memberCookingComfort:'low',memberAlone:true}),true,'LIA should notice an easy leftover fit for a person eating alone');
});


test('LIA turns organizer intent into a small ranked set of concrete help',()=>{
  const shopping=lia.liaSuggestHelp({domain:'shopping',goal:'buy dinner groceries',hasKnownStock:true,multipleStops:true});
  assert.deepStrictEqual(shopping.map(item=>item.action),['check_stock','compare_prices','optimize_route']);
  assert.strictEqual(shopping.length,3,'LIA must never flood the organizer with more than three help proposals');
  assert.strictEqual(shopping[1].requiresLiveData,true,'price comparison must be treated as current external data');

  const purchase=lia.liaSuggestHelp({domain:'purchase',goal:'buy a handbag'});
  assert.deepStrictEqual(purchase.map(item=>item.action),['compare_options','compare_prices','locate_place']);

  const meal=lia.liaSuggestHelp({domain:'meal',goal:'decide dinner',headcountKnown:false,hasKnownStock:true,mode:'idle'});
  assert.strictEqual(meal[0].action,'ask_family','unknown headcount must be resolved before pretending to optimize dinner');
  assert(meal.some(item=>item.action==='check_stock'),'known stock should be used rather than asking the organizer to repeat it');
});

test('LIA follows up conversationally without becoming an interrogation',()=>{
  assert.strictEqual(lia.liaMayAskGoalFollowUp({questionsAlreadyAsked:0,answerNeededForGoal:true,userEngaged:true}),true);
  assert.strictEqual(lia.liaMayAskGoalFollowUp({questionsAlreadyAsked:2,answerNeededForGoal:true,userEngaged:true}),true);
  assert.strictEqual(lia.liaMayAskGoalFollowUp({questionsAlreadyAsked:3,answerNeededForGoal:true,userEngaged:true}),false,'three useful follow-ups is the ceiling for one intent');
  assert.strictEqual(lia.liaMayAskGoalFollowUp({questionsAlreadyAsked:0,answerNeededForGoal:true,userEngaged:false}),false,'LIA must back off when the organizer is not engaging');
});

test('LIA never turns fatigue into unsafe unattended cooking advice',()=>{
  const tiredCooking=lia.liaSuggestHelp({domain:'rest',goal:'rest a little',userTired:true,mode:'cooking',activeHeat:true});
  assert.strictEqual(tiredCooking[0].action,'safe_pause');
  assert(tiredCooking.some(item=>item.action==='manage_timers'));
  assert.strictEqual(lia.liaCanSuggestRestDuringCooking({activeHeat:true,applianceCanBeSafelyLeft:true}),false,'active heat must block a rest suggestion');
  assert.strictEqual(lia.liaCanSuggestRestDuringCooking({activeHeat:false,applianceCanBeSafelyLeft:true}),true);
});


test('subscription offers one LIA with three duration-only reference prices',()=>{
  const service=fs.readFileSync(path.join(root,'src','services','subscription.ts'),'utf8');
  const paywall=fs.readFileSync(path.join(root,'src','screens','PaywallScreen.tsx'),'utf8');
  assert(service.includes('monthly: 6.99'),'monthly reference price must match the validated business model');
  assert(service.includes('semiannual: 34.99'),'six-month reference price must match the validated business model');
  assert(service.includes('annual: 59.99'),'annual reference price must match the validated business model');
  assert(paywall.includes("type Billing=SubscriptionBillingPeriod"),'the three offers must be duration choices of the same subscription');
  assert(paywall.includes('storeOffer?.semiannual'),'production must support a Store-localized six-month package');
  assert(paywall.includes("storeOffer?.monthly&&storeOffer?.semiannual&&storeOffer?.annual"),'production must fail closed until all intended Store packages are available');
});

test('LIA economics keeps the same assistant while routing expensive work behind the scenes',()=>{
  const rates={inputUsdPerMillionTokens:.2,outputUsdPerMillionTokens:1.2,webSearchUsd:.01,transcriptionUsdPerMinute:.0045,ttsUsdPerMillionCharacters:15,imageAnalysisUsd:.01};
  const cost=liaEconomics.estimateLiaUsageUsd({inputTokens:1_000_000,outputTokens:100_000,webSearches:10,transcriptionMinutes:20,ttsCharacters:10_000,imageAnalyses:5},rates);
  assert(Math.abs(cost-.71)<1e-9,'the cost meter must account for text, search, transcription, TTS and images');
  assert.strictEqual(liaEconomics.liaCostBand(.2),'normal');
  assert.strictEqual(liaEconomics.liaCostBand(.8),'economize');
  assert.strictEqual(liaEconomics.liaCostBand(1.2),'protect_margin');
  assert.strictEqual(liaEconomics.liaMayUseExpensiveRoute({monthToDateUsd:1.2,essential:true,complexity:'simple'}),true,'essential LIA help must never be cut by the margin guard');
  assert.strictEqual(liaEconomics.liaMayUseExpensiveRoute({monthToDateUsd:1.2,essential:false,complexity:'complex'}),false,'nonessential expensive routes may be suppressed after the target is exceeded');
});

test('LIA economics projects fleet cost without hidden per-user limits',()=>{
  assert.strictEqual(liaEconomics.projectedMonthlyLiaCostUsd(10_000,1),10_000);
  assert.strictEqual(liaEconomics.projectedMonthlyLiaCostUsd(100_000,.5),50_000);
  assert.strictEqual(liaEconomics.LIA_MONTHLY_COST_TARGET_USD,1);
});


test('LIA discovery costs nothing before auth and becomes full subscriber LIA after purchase',()=>{
  assert.strictEqual(liaDiscovery.liaDiscoveryMode({authenticated:false,hasFamilyAccess:false,spentUsd:0}),'local_intro','pre-auth introduction must not require paid AI');
  assert.strictEqual(liaDiscovery.liaDiscoveryMode({authenticated:true,hasFamilyAccess:false,spentUsd:.01}),'cloud_normal');
  assert.strictEqual(liaDiscovery.liaDiscoveryMode({authenticated:true,hasFamilyAccess:false,spentUsd:.04}),'cloud_economy');
  assert.strictEqual(liaDiscovery.liaDiscoveryMode({authenticated:true,hasFamilyAccess:false,spentUsd:.05}),'local_only','free cloud discovery must stop at the acquisition ceiling');
  assert.strictEqual(liaDiscovery.liaDiscoveryMode({authenticated:true,hasFamilyAccess:true,spentUsd:999}),'subscriber','a paid household must use the normal subscriber policy, not the discovery cap');
});

test('LIA discovery ceiling is five cents per authenticated non-subscriber account',()=>{
  assert.strictEqual(liaDiscovery.LIA_DISCOVERY_BUDGET_USD,.05);
  assert.strictEqual(liaDiscovery.LIA_DISCOVERY_BUDGET_MICROUSD,50_000);
  assert.strictEqual(liaDiscovery.liaDiscoveryMayReserve({spentMicrousd:49_000,requestedMicrousd:1_000}),true);
  assert.strictEqual(liaDiscovery.liaDiscoveryMayReserve({spentMicrousd:49_001,requestedMicrousd:1_000}),false);
  assert.strictEqual(liaDiscovery.maximumDiscoveryAcquisitionCostUsd(90_000),4_500);
});

test('pre-subscription LIA budget is enforced only by a trusted server RPC and is idempotent',()=>{
  const sql=fs.readFileSync(path.join(root,'supabase','migrations','202609160014_lia_discovery_budget.sql'),'utf8').toLowerCase();
  assert(sql.includes('v_limit constant bigint := 50000'),'server cap must be hard-coded at five cents in micro-USD');
  assert(sql.includes('for update'),'budget consumption must serialize concurrent requests');
  assert(sql.includes('request_id uuid primary key'),'request id must make retries idempotent');
  assert(sql.includes('idempotent_replay'),'server must explicitly handle retried requests');
  for(const role of ['public','anon','authenticated'])assert(sql.includes(`revoke all on function public.reserve_lia_discovery_budget(uuid,uuid,bigint) from ${role}`),`mobile role ${role} must not reserve its own budget`);
  assert(sql.includes('grant execute on function public.reserve_lia_discovery_budget(uuid,uuid,bigint) to service_role'),'only trusted server code may reserve discovery spend');
});


test('LIA social laughter is opt-in, local-first and never talks over humans',()=>{
  const base={sessionExplicitlyActive:true,microphoneConsent:true,localSoundClassifierAvailable:true,mode:'table',socialLevel:'present',laughterConfidence:.95,laughterIntensity:.75,groupLaughter:true,directAddressed:false,humanSpeechActive:false,liaSpeaking:false,silenceAfterLaughterMs:500,msSinceLastReaction:60_000,reactionsLast10Minutes:0,sensitiveMoment:false};
  assert.strictEqual(liaSocial.liaChooseLaughterReaction(base),'chuckle','group laughter may get a restrained shared chuckle');
  assert.strictEqual(liaSocial.liaChooseLaughterReaction({...base,humanSpeechActive:true}),'none','human speech must cancel any social reaction');
  assert.strictEqual(liaSocial.liaChooseLaughterReaction({...base,microphoneConsent:false}),'none','no consent means no listening reaction');
  assert.strictEqual(liaSocial.liaChooseLaughterReaction({...base,localSoundClassifierAvailable:false}),'none','social laughter must not silently fall back to cloud ambient listening');
  assert.strictEqual(liaSocial.liaChooseLaughterReaction({...base,mode:'idle'}),'none','quiet mode must not listen socially');
  assert.strictEqual(liaSocial.liaChooseLaughterReaction({...base,msSinceLastReaction:10_000}),'none','LIA must not laugh mechanically at every laugh');
  assert.strictEqual(liaSocial.liaChooseLaughterReaction({...base,reactionsLast10Minutes:2}),'none','present mode has a bounded social-reaction budget');
  assert.strictEqual(liaSocial.liaChooseLaughterReaction({...base,sensitiveMoment:true}),'none','sensitive moments must suppress playful reactions');
  assert.strictEqual(liaSocial.liaMustCancelQueuedSocialReaction({humanSpeechActive:true,liaInterrupted:false,sessionExplicitlyActive:true}),true);
  assert.strictEqual(liaSocial.LIA_SOCIAL_AUDIO_POLICY.ambientCloudUpload,false,'ambient family audio must not be uploaded merely to detect laughter');
});

test('LIA can laugh more warmly when directly addressed without becoming a laugh track',()=>{
  const base={sessionExplicitlyActive:true,microphoneConsent:true,localSoundClassifierAvailable:true,mode:'table',socialLevel:'host',laughterConfidence:.95,laughterIntensity:.9,groupLaughter:true,directAddressed:true,humanSpeechActive:false,liaSpeaking:false,silenceAfterLaughterMs:500,msSinceLastReaction:60_000,reactionsLast10Minutes:0,sensitiveMoment:false};
  assert.strictEqual(liaSocial.liaChooseLaughterReaction(base),'laugh');
  assert.strictEqual(liaSocial.liaChooseLaughterReaction({...base,laughterIntensity:.65}),'chuckle');
  assert.strictEqual(liaSocial.liaChooseLaughterReaction({...base,laughterConfidence:.5}),'none','low-confidence sound must be ignored');
  assert.strictEqual(liaSocial.liaSocialAudioMayStart({sessionExplicitlyActive:true,microphoneConsent:true,mode:'table'}),true);
  assert.strictEqual(liaSocial.liaSocialAudioMayStart({sessionExplicitlyActive:false,microphoneConsent:true,mode:'table'}),false);
});

test('LIA audio runtime waits for a real laughter burst and yields to renewed speech',()=>{
  let state={recentLaughterAtMs:[],lastHumanSpeechAtMs:null};
  state=liaAudioRuntime.nextLiaAudioRuntimeState(state,{label:'laughter',confidence:.91,atMs:1_000},'laughter');
  assert.strictEqual(liaAudioRuntime.liaAudioLooksLikeGroupLaughter(state,1_200),false,'one laughter classification must not trigger a group reaction');
  state=liaAudioRuntime.nextLiaAudioRuntimeState(state,{label:'laughter',confidence:.9,atMs:1_450},'laughter');
  assert.strictEqual(liaAudioRuntime.liaAudioLooksLikeGroupLaughter(state,1_500),true,'a short repeated burst may count as group laughter');
  state=liaAudioRuntime.nextLiaAudioRuntimeState(state,{label:'speech',confidence:.8,atMs:1_700},'speech');
  assert.strictEqual(liaAudioRuntime.liaAudioHumanSpeechActive(state,2_000),true,'human speech must hold the floor');
  assert.strictEqual(liaAudioRuntime.liaAudioHumanSpeechActive(state,2_700),false,'speech hold expires instead of muting LIA forever');
});

test('V0.162 keeps LIA audio local on iOS and Android',()=>{
  const config=JSON.parse(fs.readFileSync(path.join(root,'modules','lia-sound-analysis','expo-module.config.json'),'utf8'));
  const swift=fs.readFileSync(path.join(root,'modules','lia-sound-analysis','ios','LiaSoundAnalysisModule.swift'),'utf8');
  const kotlin=fs.readFileSync(path.join(root,'modules','lia-sound-analysis','android','src','main','java','com','notretable','lia','LiaSoundAnalysisModule.kt'),'utf8');
  const gradle=fs.readFileSync(path.join(root,'modules','lia-sound-analysis','android','build.gradle'),'utf8');
  const listening=fs.readFileSync(path.join(root,'src','services','liaListening.ts'),'utf8');
  assert(config.apple.modules.includes('LiaSoundAnalysisModule'));
  assert(config.android.modules.includes('com.notretable.lia.LiaSoundAnalysisModule'));
  assert(swift.includes('SNClassifySoundRequest')&&swift.includes('SNAudioStreamAnalyzer'),'iOS ear must use on-device Sound Analysis');
  assert(swift.includes('AVSpeechSynthesizer'),'iOS voice must use device speech synthesis');
  assert(kotlin.includes('TextToSpeech'),'Android voice must use device speech synthesis');
  assert(kotlin.includes('AudioClassifier.createFromFile')&&kotlin.includes('createInputTensorAudio')&&kotlin.includes('createAudioRecord'),'Android ear must use an on-device audio event classifier');
  assert(gradle.includes('tensorflow-lite-task-audio:0.4.4'),'Android classifier dependency must be pinned');
  assert(kotlin.includes('hasModelAsset() && isRecordAudioDeclared()'),'Android ear must fail closed until model + permission are actually packaged');
  assert(!swift.includes('URLSession')&&!kotlin.includes('HttpURLConnection')&&!kotlin.includes('OkHttp')&&!listening.includes('fetch('),'ambient laughter analysis must not upload room audio to a cloud endpoint');
});

test('V0.162 pins the Android YAMNet asset before it can be activated',()=>{
  const vendor=fs.readFileSync(path.join(root,'scripts','vendor-yamnet-model.cjs'),'utf8');
  const readme=fs.readFileSync(path.join(root,'modules','lia-sound-analysis','android','src','main','assets','README.md'),'utf8');
  assert(vendor.includes('10c95ea3eb9a7bb4cb8bddf6feb023250381008177ac162ce169694d05c317de'));
  assert(vendor.includes('4126810'));
  assert(vendor.includes('SHA-256 mismatch'));
  assert(readme.includes('Apache-2.0'));
  assert(!fs.existsSync(path.join(root,'modules','lia-sound-analysis','android','src','main','assets','yamnet.tflite')),'checkpoint must not pretend the model was vendored when this environment could not fetch it');
});

test('V0.162 Android recording remains blocked until the local audio model is vendored',()=>{
  const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
  assert(app.expo.android.blockedPermissions.includes('android.permission.RECORD_AUDIO'),'Android microphone must remain blocked until the checksum-verified local model is vendored');
});

test('LIA device voice stops when human speech resumes',()=>{
  const orb=fs.readFileSync(path.join(root,'src','components','LiaOrb.tsx'),'utf8');
  assert(orb.includes('if(voiceSpeaking)void stopLiaVoice()'),'human speech classification must interrupt LIA speech immediately');
  const voice=fs.readFileSync(path.join(root,'src','services','liaVoice.ts'),'utf8');
  assert(voice.includes('stopNativeLiaSpeech'),'LIA speech must expose an immediate native stop');
});


test('V0.163 auditions three LIA voice candidates before choosing one',()=>{
  const orb=fs.readFileSync(path.join(root,'src','components','LiaOrb.tsx'),'utf8');
  assert(orb.includes('setVoiceOptions(options.slice(0,3))'),'voice lab must expose only three candidate voices');
  assert(orb.includes("locale.t('lia.voiceSampleLong')"),'all candidates must use the same long audition phrase');
  assert(orb.includes("(['smile','chuckle','laugh'] as const)"),'voice lab must audition all three laughter intensities');
  assert(orb.includes("locale.t('lia.voiceCandidate',{letter:String.fromCharCode(65+index)})"),'candidates must be presented as A/B/C');
});

test('V0.163 changing LIA voice revokes laughter approval until revalidated',()=>{
  const voice=fs.readFileSync(path.join(root,'src','services','liaVoice.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src','components','LiaOrb.tsx'),'utf8');
  assert(voice.includes("LAUGHTER_APPROVED_KEY='notre-table:lia-laughter-approved:v1'"),'laughter approval must persist separately');
  assert(voice.includes("if(previous!==identifier)await writeStoredJson(LAUGHTER_APPROVED_KEY,false)"),'changing voice must reset laugh approval');
  assert(orb.includes("reaction==='none'||reaction==='smile'||!laughterApproved"),'social laughter must stay disabled until approved');
  assert(orb.includes('setLiaLaughterApproved(true)'),'the voice lab must require explicit laughter approval');
});


test('V0.164 first contact stays language then spoken LIA then account',()=>{
  const app=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
  const onboarding=fs.readFileSync(path.join(root,'src','screens','OnboardingScreen.tsx'),'utf8');
  const languageIndex=app.indexOf('if(!languageChosen)');
  const onboardingIndex=app.indexOf('if(!onboardingSeen)');
  const authIndex=app.indexOf('if(!demo&&!session)');
  assert(languageIndex>=0&&onboardingIndex>languageIndex&&authIndex>onboardingIndex,'startup order must remain language → LIA onboarding → auth');
  assert(onboarding.includes("locale.t('onboarding.voiceIntro')"),'LIA must introduce herself in the selected language');
  assert(onboarding.includes("locale.t('onboarding.next')"),'first contact must explain that account and household come next');
  assert(!onboarding.toLowerCase().includes('paywall'),'first contact must not inject a paywall before discovery');
});

test('V0.164 LIA welcome voice respects assistive tech and stops on exit',()=>{
  const onboarding=fs.readFileSync(path.join(root,'src','screens','OnboardingScreen.tsx'),'utf8');
  assert(onboarding.includes('AccessibilityInfo.isScreenReaderEnabled()'),'automatic welcome speech must check screen-reader state');
  assert(onboarding.includes('if(cancelled||enabled||autoAttempted.current||!liaVoiceAvailable())return;'),'VoiceOver/TalkBack must suppress automatic welcome speech');
  assert(onboarding.includes('return()=>{cancelled=true;activeRef.current=false;void stopLiaVoice();};'),'unmount must stop any orphaned LIA speech');
  assert(onboarding.includes('await stopLiaVoice();'),'continuing must stop LIA before navigation');
  assert(onboarding.includes("voiceSpeaking?'onboarding.stopVoice':'onboarding.listenVoice'"),'visible listen/stop control must remain available');
});


test('V0.165 new households enter a short LIA setup while existing households stay unblocked',()=>{
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609160015_household_lia_setup.sql'),'utf8').toLowerCase();
  const app=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
  const service=fs.readFileSync(path.join(root,'src','services','households.ts'),'utf8');
  assert(migration.includes('setup_completed boolean not null default true'),'existing households must default to completed when the column is added');
  assert(migration.includes('values(trim(p_name),auth.uid(),false)'),'newly created households must explicitly enter guided setup');
  assert(migration.includes('complete_household_setup'),'setup completion must be server-backed');
  assert(service.includes('households(id, name, setup_completed, default_party_size, delivery_address)'),'household boot must load guided-setup state and the additive delivery address');
  const setupIndex=app.indexOf("household.setup_completed===false");
  const mainIndex=app.indexOf('<MainScreen household={household}');
  assert(setupIndex>=0&&mainIndex>setupIndex,'new admin households must complete LIA setup before the main app');
});

test('V0.166 LIA opens one structured family sheet instead of interrogating the organizer',()=>{
  const screen=fs.readFileSync(path.join(root,'src','screens','HouseholdSetupScreen.tsx'),'utf8');
  const service=fs.readFileSync(path.join(root,'src','services','households.ts'),'utf8');
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609160016_family_roster_form.sql'),'utf8').toLowerCase();
  assert(screen.includes("locale.t('householdSetup.formTitle')"),'LIA must open a family form instead of a question-by-question wizard');
  assert(screen.includes("addMember('spouse')")&&screen.includes("addMember('child')")&&screen.includes("addMember('other')"),'family form must support spouse children and other household people');
  assert(screen.includes('validateLiaFamilyForm(draft)'),'LIA must validate the completed sheet before continuing');
  assert(service.includes('completeHouseholdFamilySetup'),'family sheet must be persisted through one server-backed operation');
  assert(migration.includes('delete from public.light_members where household_id=p_household_id'),'new household sheet must feed the existing lightweight family roster instead of creating a second member list');
});

test('V0.195 family ages and phones are optional while supplied values and duplicate phones stay validated',()=>{
  const incomplete={salutation:'mrs',firstName:'Marie',age:'',phone:'',relationshipStatus:'',members:[{relation:'child',relationLabel:'',salutation:'other',firstName:'Lina',age:'',phone:''}]};
  const missing=liaFamilyForm.validateLiaFamilyForm(incomplete);
  assert(!missing.some(issue=>issue.code==='age_missing'||issue.code==='phone_missing'),'blank optional age/phone fields must not block the family sheet');
  const gaps=liaFamilyForm.liaFamilyFormSoftGaps(incomplete);
  assert(gaps.includes('organizer_age')&&gaps.includes('organizer_phone')&&gaps.includes('child_age')&&gaps.includes('family_phone'),'missing context must remain visible to LIA as soft gaps');
  const duplicate={...incomplete,phone:'06 12 34 56 78',members:[{...incomplete.members[0],phone:'0612345678'}]};
  assert(liaFamilyForm.validateLiaFamilyForm(duplicate).some(issue=>issue.code==='duplicate_phone'),'a duplicate family phone must be flagged when phones are supplied');
  const impossible={...incomplete,members:[{...incomplete.members[0],age:'250'}]};
  assert(liaFamilyForm.validateLiaFamilyForm(impossible).some(issue=>issue.code==='age_invalid'),'an impossible child age must still be reported when supplied');
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609170022_lia_relational_foundation.sql'),'utf8').toLowerCase();
  assert(migration.includes('p_age is not null and p_age not between 0 and 120'),'server must keep organizer age optional but validate a supplied value');
  assert(migration.includes('v_age is not null and v_age not between 0 and 120'),'server must keep member ages optional but validate a supplied value');
});

test('V0.167 LIA exposes Mémos and Commander without replacing the existing tab navigation',()=>{
  const main=fs.readFileSync(path.join(root,'src','screens','MainScreen.tsx'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src','components','LiaOrb.tsx'),'utf8');
  const commander=fs.readFileSync(path.join(root,'src','domain','commander.ts'),'utf8');
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609160017_lia_memos_child_age_optional.sql'),'utf8').toLowerCase();
  assert(main.includes("liaSurface==='commander'")&&main.includes("liaSurface==='memos'"),'Commander and Mémos must open as additive LIA surfaces');
  assert(orb.includes('onOpenCommander')&&orb.includes('onOpenMemos'),'the persistent LIA surface must expose the two validated shortcuts');
  assert(commander.includes('COMMANDER_MAX_RADIUS_KM=10'),'Commander must keep the validated maximum 10 km radius');
  assert(migration.includes('create table if not exists public.lia_memos'),'Mémos must have private server persistence');
  assert(migration.includes('user_id=auth.uid()'),'Mémos RLS must stay private to the authenticated user');
});

test('V0.167 second LIA presentation follows the completed family sheet once',()=>{
  const app=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
  const prefs=fs.readFileSync(path.join(root,'src','services','appPreferences.ts'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src','screens','LiaSecondIntroScreen.tsx'),'utf8');
  assert(app.includes('LiaSecondIntroScreen')&&app.includes('markLiaSecondIntroSeen'),'family setup must lead to the validated second presentation');
  assert(prefs.includes('@notre-table/lia-second-intro-seen-v1'),'the second presentation must not repeat forever');
  assert(screen.includes("locale.t('lia.secondIntro')"),'the second presentation text must stay localized');
});

test('V0.168 Commander carousel follows the validated swipe, dots, autoplay and reduced-motion rules',()=>{
  const carousel=fs.readFileSync(path.join(root,'src','components','CommanderCarousel.tsx'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src','screens','CommanderScreen.tsx'),'utf8');
  assert(carousel.includes('pagingEnabled')&&carousel.includes('6500'),'Commander cards must swipe horizontally and may auto-advance at a human pace');
  assert(carousel.includes('isReduceMotionEnabled')&&carousel.includes('reduceMotionChanged'),'Commander autoplay must respect reduced-motion accessibility');
  assert(carousel.includes('onTouchStart={()=>{setInteracted(true);onInteract?.();}}'),'touching the carousel must stop automatic motion for the session while reporting explicit user interaction');
  assert(carousel.includes("accessibilityState={{selected:i===index}}"),'pagination dots must expose the selected card');
  assert(screen.includes('filtered.length<3'),'one or two useful restaurants must render as a short list instead of a fake thin carousel');
});

test('V0.168 Commander detail never invents an order path',()=>{
  const detail=fs.readFileSync(path.join(root,'src','screens','CommanderDetailScreen.tsx'),'utf8');
  const service=fs.readFileSync(path.join(root,'src','services','commander.ts'),'utf8');
  assert(detail.includes('if(!place.orderUrl')&&detail.includes('Linking.canOpenURL(place.orderUrl)'),'the order action must only use a supplied verified link');
  assert(detail.includes("locale.t('commander.noOrderLink')"),'a missing verified order route must be stated instead of fabricated');
  assert(service.includes('return []'),'until a verified provider exists, Commander must continue returning no invented restaurants');
});

test('V0.169 household creation can keep an optional default delivery address without blocking setup',()=>{
  const householdScreen=fs.readFileSync(path.join(root,'src','screens','HouseholdScreen.tsx'),'utf8');
  const householdService=fs.readFileSync(path.join(root,'src','services','households.ts'),'utf8');
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609160018_household_delivery_address.sql'),'utf8').toLowerCase();
  assert(householdScreen.includes("locale.t('household.deliveryAddress')")&&householdScreen.includes("deliveryAddress.trim()||undefined"),'household creation must expose a non-blocking default delivery address');
  assert(householdService.includes('p_delivery_address')&&householdService.includes('delivery_address'),'the default delivery address must flow through the household service');
  assert(migration.includes('add column if not exists delivery_address text'),'the backend must persist the optional household delivery address');
  assert(migration.includes('p_delivery_address text default null'),'existing households and address-less creation must stay valid');
});

test('V0.169 Commander receives the household address but still refuses to invent a provider',()=>{
  const main=fs.readFileSync(path.join(root,'src','screens','MainScreen.tsx'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src','screens','CommanderScreen.tsx'),'utf8');
  const service=fs.readFileSync(path.join(root,'src','services','commander.ts'),'utf8');
  assert(main.includes('deliveryAddress={household.delivery_address??null}'),'Commander must receive the saved household delivery address');
  assert(screen.includes("loadCommanderPlaces({deliveryAddress:activeAddress,maxRadiusKm:COMMANDER_MAX_RADIUS_KM})"),'Commander must search against the active delivery address and the validated 10 km cap');
  assert(service.includes('if(!safe||liveProviders.length===0)return []')&&service.includes('if(!deliveryAddress)return null'),'without a verified provider or usable address, Commander must remain empty');
  assert(service.includes('Math.min(COMMANDER_MAX_RADIUS_KM'),'a provider can never be asked for a radius above the validated 10 km maximum');
});

test('V0.170 Commander lets the user override the address for the current search without rewriting the household address',()=>{
  const screen=fs.readFileSync(path.join(root,'src','screens','CommanderScreen.tsx'),'utf8');
  assert(screen.includes('const[activeAddress,setActiveAddress]')&&screen.includes('const[addressDraft,setAddressDraft]'),'Commander must keep a distinct active session address');
  assert(screen.includes("setActiveAddress(addressDraft.trim())"),'a confirmed manual address must immediately become the active Commander destination');
  assert(!screen.includes('updateHouseholdDeliveryAddress'),'the session override must not silently overwrite the saved household address');
  assert(screen.includes("locale.t('commander.addressSessionHint')"),'the UI must explain that the saved household address remains unchanged');
});

test('V0.170 Commander address editor is optional accessible and refreshes provider search',()=>{
  const screen=fs.readFileSync(path.join(root,'src','screens','CommanderScreen.tsx'),'utf8');
  assert(screen.includes('accessibilityState={{expanded:addressEditing}}'),'the address editor must expose expanded state');
  assert(screen.includes("accessibilityLabel={locale.t('commander.addressField')}"),'the manual address field must have a localized accessible label');
  assert(screen.includes('disabled={!addressDraft.trim()}')&&screen.includes('accessibilityState={{disabled:!addressDraft.trim()}}'),'an empty session address must not be applied');
  assert(/\},\[activeAddress(?:,destinationChoicePending)?,networkNonce\]\);/.test(screen),'changing the active address or resolving the destination choice must reload the Commander provider context');
});

test('V0.166 LIA can pause proactive reminders and joke only after a voluntary early return',()=>{
  const proactive=fs.readFileSync(path.join(root,'src','services','liaProactivity.ts'),'utf8');
  const notifications=fs.readFileSync(path.join(root,'src','services','notifications.ts'),'utf8');
  const main=fs.readFileSync(path.join(root,'src','screens','MainScreen.tsx'),'utf8');
  assert(proactive.includes("mode:'indefinite'")&&proactive.includes('pauseLiaForDays'),'quiet mode must support both multi-day and indefinite pauses');
  assert(proactive.includes("quiet.mode==='until'")&&proactive.includes('liaQuietNow(quiet,now)'),'comic return copy must only be eligible when the user reopens before the end of a timed pause');
  assert(notifications.includes('refreshLiaNoonNudgesAfterOpen'),'noon nudges must be refreshed when the organizer actually opens the app');
  assert(main.includes('chooseLiaEarlyReturnVariant'),'a voluntary early return may trigger a comic confidante/housekeeper greeting');
});

test('V0.166 confidante can bridge a personal problem to dinner only when it genuinely helps',()=>{
  assert.strictEqual(liaConversationPolicy.liaSupportLane({emotionalTopic:true,practicalHouseholdNeed:false,mealCouldHelp:false,userRejectedMealHelp:false}),'confidante');
  assert.strictEqual(liaConversationPolicy.liaSupportLane({emotionalTopic:true,practicalHouseholdNeed:false,mealCouldHelp:true,userRejectedMealHelp:false}),'both');
  assert.strictEqual(liaConversationPolicy.liaMayOfferDinnerBridge({emotionalTopic:true,mealCouldCreateConnection:true,userRejectedMealHelp:false}),true);
  assert.strictEqual(liaConversationPolicy.liaMayOfferDinnerBridge({emotionalTopic:true,mealCouldCreateConnection:true,userRejectedMealHelp:true}),false,'LIA must stop pushing dinner after the user declines that bridge');
});

test('V0.171 Commander favorites stay private and separate from Mémos',()=>{
  const service=fs.readFileSync(path.join(root,'src','services','commanderFavorites.ts'),'utf8');
  const detail=fs.readFileSync(path.join(root,'src','screens','CommanderDetailScreen.tsx'),'utf8');
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609160019_commander_favorites.sql'),'utf8').toLowerCase();
  assert(service.includes("from('commander_favorites')"),'favorites must use their own persistence surface');
  assert(!service.includes('lia_memos'),'restaurant favorites must never be stored as Mémos');
  assert(migration.includes('user_id=auth.uid()'),'favorite RLS must remain private to the user');
  assert(migration.includes('unique(user_id,provider,place_key)'),'favorite identity must be stable per provider/place');
  assert(detail.includes("accessibilityState={{selected:favorite,busy:favoriteBusy,disabled:favoriteBusy}}"),'favorite control must expose selected and busy state');
});

test('V0.171 Commander favorites work in demo mode without inventing restaurant data',()=>{
  const service=fs.readFileSync(path.join(root,'src','services','commanderFavorites.ts'),'utf8');
  const commander=fs.readFileSync(path.join(root,'src','services','commander.ts'),'utf8');
  assert(service.includes("@notre-table/commander-favorites-demo-v1"),'demo favorites need local persistence');
  assert(service.includes("place.source?.trim()||'commander'"),'favorites must retain provider identity when available');
  assert(/return\s+\[\]/.test(commander),'Commander must still return no invented restaurants without a provider');
});


test('V0.172 Commander keeps sponsored inventory outside the natural provider ranking',()=>{
  const service=fs.readFileSync(path.join(root,'src','services','commander.ts'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src','screens','CommanderScreen.tsx'),'utf8');
  assert(service.includes('CommanderSponsoredProvider'),'sponsored inventory must have its own provider contract');
  assert(service.includes('configureCommanderSponsoredProvider'),'sponsored inventory must remain disabled until explicitly configured');
  assert(service.includes('.filter(row=>!row.sponsored)'),'the organic provider must never feed paid rows into natural ranking');
  assert(service.includes('return rows.filter(row=>row.sponsored===true)'),'the sponsored provider must only feed explicitly sponsored rows');
  assert(screen.includes('loadCommanderSponsoredPlaces'),'Commander may load sponsored inventory only through the separate boundary');
});

test('V0.172 Commander still renders no sponsored content without a verified sponsored provider',()=>{
  const service=fs.readFileSync(path.join(root,'src','services','commander.ts'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src','screens','CommanderScreen.tsx'),'utf8');
  assert(service.includes('if(!sponsoredProvider||!safe)return []'),'no sponsored provider means no sponsored cards');
  assert(screen.includes("titleKey:'commander.section.offers'"),'sponsored inventory remains visibly separated as offers');
  assert(screen.includes("row.sponsored?<Text style={styles.sponsored}>{locale.t('commander.sponsored')}</Text>:null"),'every sponsored compact card must remain visibly labeled');
});


test('V0.172 Google Places key stays server-only and provider remains opt-in',()=>{
  const edge=fs.readFileSync(path.join(root,'supabase','functions','commander-search','index.ts'),'utf8');
  const runtime=fs.readFileSync(path.join(root,'src','lib','runtimeConfig.ts'),'utf8');
  const provider=fs.readFileSync(path.join(root,'src','services','commanderGoogleProvider.ts'),'utf8');
  assert(edge.includes("Deno.env.get('GOOGLE_MAPS_API_KEY')"),'Google Maps key must be read only by the server function');
  assert(!runtime.includes('GOOGLE_MAPS_API_KEY'),'mobile runtime config must never expose the Google server key');
  assert(runtime.includes("EXPO_PUBLIC_COMMANDER_LIVE_PROVIDER")&&runtime.includes("'supabase-edge'"),'mobile activation must be an explicit provider switch');
  assert(provider.includes("runtimeConfig.commanderLiveProvider!=='supabase-edge'"),'Commander live discovery must remain disabled by default');
});

test('V0.172 Google discovery clamps radius and never claims delivery',()=>{
  const edge=fs.readFileSync(path.join(root,'supabase','functions','commander-search','index.ts'),'utf8');
  assert(edge.includes('Math.min(10,Math.max(0.25,requestedKm))'),'server must clamp requested discovery radius to 10 km');
  assert(edge.includes("includedTypes:['restaurant']"),'live discovery must remain scoped to restaurants');
  assert(edge.includes("delivery:'unknown'"),'Google discovery must never become delivery confirmation');
  assert(edge.includes('orderUrl:null'),'Google discovery must never fabricate an ordering route');
  assert(!edge.includes('places.photos')&&!edge.includes('places.reviews'),'V0.172 must not request photos or reviews that need extra attribution/storage handling');
});

test('V0.172 Google content is attributed and not mixed with non-Google content silently',()=>{
  const domain=fs.readFileSync(path.join(root,'src','domain','commander.ts'),'utf8');
  const edge=fs.readFileSync(path.join(root,'supabase','functions','commander-search','index.ts'),'utf8');
  const carousel=fs.readFileSync(path.join(root,'src','components','CommanderCarousel.tsx'),'utf8');
  const detail=fs.readFileSync(path.join(root,'src','screens','CommanderDetailScreen.tsx'),'utf8');
  assert(domain.includes('sourceAttribution?:string|null'),'provider attribution must travel with each place');
  assert(edge.includes("sourceAttribution:'Google Maps'"),'Google content must identify its provider');
  assert(carousel.includes('row.sourceAttribution')&&detail.includes('place.sourceAttribution'),'Google attribution must remain visible near Google content');
});

test('V0.172 Google favorites persist place identity without caching provider content',()=>{
  const favorite=fs.readFileSync(path.join(root,'src','services','commanderFavorites.ts'),'utf8');
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609160020_google_place_favorite_storage.sql'),'utf8').toLowerCase();
  assert(favorite.includes("const googlePlace=provider==='google-places'"),'favorites must recognize Google provider rows');
  assert(favorite.includes('display_name:googlePlace?null:displayName')&&favorite.includes('categories:googlePlace?[]:place.categories.slice(0,12)'),'Google favorites must persist only provider/place identity, not copied Places content');
  assert(migration.includes('alter column display_name drop not null'),'favorite schema must allow provider-content-free Google favorites');
});



test('V0.173 delivery verification is separate from restaurant discovery',()=>{
  const service=fs.readFileSync(path.join(root,'src','services','commander.ts'),'utf8');
  assert(service.includes('CommanderDeliveryProvider'),'delivery confirmation needs a dedicated provider contract');
  assert(service.includes('configureCommanderDeliveryProvider'),'delivery provider must be explicitly configured');
  assert(service.includes('verifyDelivery(safe,pending)')&&service.includes("const pending=organic.filter(row=>row.delivery==='unknown')"),'delivery verification must only run after organic discovery and only for unresolved rows');
  assert(service.includes('for(const provider of deliveryProviders)')&&service.includes('return organic;'),'without a delivery provider, discovery truth must pass through unchanged instead of inventing confirmation');
});

test('V0.173 delivery verification cannot create restaurants and removes confirmed non-deliverable rows',()=>{
  const service=fs.readFileSync(path.join(root,'src','services','commander.ts'),'utf8');
  assert(service.includes('const byId=new Map(checks.map(check=>[check.placeId,check]))'),'delivery results must merge only by ids from discovered places');
  assert(service.includes('organic=organic.map(row=>'),'delivery verification must transform the existing organic set rather than create a new restaurant set');
  assert(service.includes(".filter(row=>row.delivery!=='unavailable')"),'a restaurant confirmed unavailable for the active address must be removed');
});

test('V0.173 delivery provider failure fails honest and keeps discovery state',()=>{
  const service=fs.readFileSync(path.join(root,'src','services','commander.ts'),'utf8');
  assert(service.includes('catch{continue;}')&&service.includes('return organic;'),'delivery provider outage must not become fake delivery confirmation or erase valid discovery');
  assert(service.includes('orderUrl:check.orderUrl??row.orderUrl'),'a verified order path may only arrive through explicit provider data or an already verified source value');
});



test('V0.174 Google discovery returns real distance from the active destination',()=>{
  const edge=fs.readFileSync(path.join(root,'supabase','functions','commander-search','index.ts'),'utf8');
  const domain=fs.readFileSync(path.join(root,'src','domain','commander.ts'),'utf8');
  assert(domain.includes('distanceKm?:number|null'),'Commander place contract must carry optional distance');
  assert(edge.includes('function distanceKm(')&&edge.includes('distanceKm:distanceKm(center,{latitude,longitude})'),'Google discovery must compute distance from the geocoded active address');
});

test('V0.174 Commander exposes the validated within-3-km carousel only from measured distance',()=>{
  const screen=fs.readFileSync(path.join(root,'src','screens','CommanderScreen.tsx'),'utf8');
  assert(screen.includes("row.distanceKm==='number'&&row.distanceKm<=3"),'nearby carousel must use measured distance and the validated 3 km threshold');
  assert(screen.includes("titleKey:'commander.section.nearby'"),'Commander must expose the nearby carousel as its own section');
  assert(screen.includes("locale.t('commander.distance'"),'compact cards must show provider-computed distance when available');
});

test('V0.174 distance is visible in carousel and detail without pretending it is delivery proof',()=>{
  const carousel=fs.readFileSync(path.join(root,'src','components','CommanderCarousel.tsx'),'utf8');
  const detail=fs.readFileSync(path.join(root,'src','screens','CommanderDetailScreen.tsx'),'utf8');
  assert(carousel.includes("locale.t('commander.distance'"),'carousel cards must surface distance');
  assert(detail.includes("locale.t('commander.distanceLabel')")&&detail.includes("locale.t('commander.distance'"),'detail must surface distance explicitly');
  assert(carousel.includes("row.delivery==='confirmed'?locale.t('commander.deliveryConfirmed'):locale.t('commander.deliveryUnknown')"),'distance must remain separate from delivery truth');
});


test('V0.175 restaurant detail exposes only verified order and contact paths',()=>{
  const detail=fs.readFileSync(path.join(root,'src','screens','CommanderDetailScreen.tsx'),'utf8');
  const domain=fs.readFileSync(path.join(root,'src','domain','commander.ts'),'utf8');
  assert(domain.includes('phone?:string|null')&&domain.includes('imageUrl?:string|null')&&domain.includes('currencyCode?:string|null'),'restaurant detail contract must keep optional verified contact/media/currency fields');
  assert(detail.includes("place.orderUrl?<Pressable")&&detail.includes("place.phone?<Pressable"),'order and call controls must only render when their verified source data exists');
  assert(detail.includes("place.currencyCode?locale.formatCurrency")&&detail.includes("commander.deliveryFee")&&detail.includes("commander.minimumOrder"),'fees and minimum order must only be formatted when provider currency is known');
  assert(detail.includes("phone.replace(/[^+\\d]/g,''"),'phone handoff must sanitize the provider phone target before opening tel:');
});

test('V0.175 delivery enrichment carries currency without inventing commercial values',()=>{
  const service=fs.readFileSync(path.join(root,'src','services','commander.ts'),'utf8');
  assert(service.includes('currencyCode?:string|null'),'delivery verification can attach the currency that belongs to fee/minimum data');
  assert(service.includes('currencyCode:check.currencyCode??row.currencyCode'),'delivery enrichment must preserve provider truth rather than synthesize a currency');
});

test('V0.175 returning from restaurant detail preserves Commander context',()=>{
  const screen=fs.readFileSync(path.join(root,'src','screens','CommanderScreen.tsx'),'utf8');
  const carousel=fs.readFileSync(path.join(root,'src','components','CommanderCarousel.tsx'),'utf8');
  assert(screen.includes('carouselIndexes')&&screen.includes('scrollYRef'),'Commander must retain carousel and vertical context while detail is open');
  assert(screen.includes('initialIndex={carouselIndexes[section.key]??0}')&&screen.includes('onIndexChange={index=>setCarouselIndexes'),'each carousel must restore its last card');
  assert(carousel.includes('initialIndex=0')&&carousel.includes('contentOffset={{x:cardWidth*index,y:0}}')&&carousel.includes('onIndexChange?.(next)'),'carousel component must accept and report persisted position');
  assert(screen.includes("const[query,setQuery]")&&screen.includes("const[category,setCategory]")&&screen.includes("const[activeAddress,setActiveAddress]"),'query category and active delivery address remain stateful across detail navigation');
});


test('V0.176 Commander supports multiple organic sources without mixing sponsored inventory',()=>{
  const service=fs.readFileSync(path.join(root,'src','services','commander.ts'),'utf8');
  assert(service.includes('configureCommanderPlaceProviders')&&service.includes('let liveProviders:CommanderPlaceProvider[]'),'multi-source discovery must remain additive to the historical single-provider setter');
  assert(service.includes('Promise.allSettled(liveProviders.map(provider=>provider.search(safe)))'),'one failing catalog source must not cancel other verified sources');
  assert(service.includes("result.value.filter(row=>!row.sponsored)"),'sponsored rows must stay outside organic multi-provider discovery');
  assert(service.includes('if(fulfilled.length===0)')&&service.includes('throw rejected.reason'),'all-provider failure must surface honestly instead of becoming fabricated emptiness');
});

test('V0.176 exact restaurant identities dedupe without overwriting delivery truth',()=>{
  const merge=fs.readFileSync(path.join(root,'src','domain','commanderProviders.ts'),'utf8');
  assert(merge.includes('source:${source}:${id}')&&merge.includes('phone:${phone}')&&merge.includes('name-address:${name}|${address}'),'dedupe must use strong exact provider phone or name-address identities');
  assert(merge.includes('const base=result[index]'),'the first source must remain the canonical row');
  assert(!merge.includes('delivery:base.delivery??row.delivery'),'secondary catalog rows must not silently replace delivery truth');
  assert(merge.includes('orderPaths:mergeOrderPaths(base.orderPaths,row.orderPaths)'),'verified alternative order paths may be retained without duplicating restaurant cards');
});

test('V0.176 delivery providers resolve only still-unknown restaurants',()=>{
  const service=fs.readFileSync(path.join(root,'src','services','commander.ts'),'utf8');
  assert(service.includes('configureCommanderDeliveryProviders')&&service.includes('let deliveryProviders:CommanderDeliveryProvider[]'),'delivery verification must support more than one provider while preserving the single-provider API');
  assert(service.includes("const pending=organic.filter(row=>row.delivery==='unknown')"),'later delivery sources may only inspect unresolved restaurants');
  assert(service.includes("if(row.delivery!=='unknown')return row"),'a later source must not overwrite an earlier explicit delivery decision');
  assert(service.includes('catch{continue;}'),'one delivery provider outage must allow the next configured provider to try');
});

test('V0.176 order path priority follows the validated direct handoff rule',()=>{
  const merge=fs.readFileSync(path.join(root,'src','domain','commanderProviders.ts'),'utf8');
  assert(merge.includes('preferredId')&&merge.includes("path.kind==='official'")&&merge.includes("path.kind==='platform'")&&merge.includes("path.kind==='phone'"),'order path selection must prefer known user choice then official platform and phone fallback');
});


test('V0.177 sponsored eligibility uses only Commander-safe commercial signals',()=>{
  const ads=fs.readFileSync(path.join(root,'src','domain','commanderAds.ts'),'utf8');
  assert(ads.includes('COMMANDER_MAX_RADIUS_KM')&&ads.includes('campaign.place.distanceKm>campaign.radiusKm'),'sponsored campaigns must remain bounded by measured delivery-area distance and the global 10 km cap');
  assert(ads.includes('scheduleEligible')&&ads.includes('budgetEligible')&&ads.includes('impressionCapReached'),'budget schedule and global caps must arrive as trusted provider decisions');
  assert(ads.includes('frequencyCapPerDay')&&ads.includes('sameUtcDay'),'per-campaign frequency must be enforceable without personal profiling');
  const context=(ads.match(/export type CommanderSponsoredContext=\{([\s\S]*?)\};/)||[])[1]||'';
  for(const forbidden of ['health','diagnosis','confidenceText','relationshipStatus','sexuality'])assert(!context.includes(forbidden),'sponsored eligibility must not accept sensitive targeting inputs');
});

test('V0.177 sponsored cards never lead or appear consecutively in the mixed engine',()=>{
  const ads=fs.readFileSync(path.join(root,'src','domain','commanderAds.ts'),'utf8');
  assert(ads.includes('naturalSinceAd>=2'),'a sponsor must wait for at least two natural cards');
  assert(ads.includes("if(row.sponsored)continue"),'the natural input lane must discard sponsored rows');
  assert(ads.includes("if(ad?.sponsored===true){result.push(ad);naturalSinceAd=0;}"),'only explicit sponsored rows may enter the paid slot and the natural gap resets afterward');
});

test('V0.177 sponsored impressions require an explicit visibility event',()=>{
  const session=fs.readFileSync(path.join(root,'src','services','commanderAdSession.ts'),'utf8');
  assert(session.includes('Record only after a sponsored card has actually become visible'),'the impression API must document the real-visibility boundary');
  assert(session.includes('recordCommanderSponsoredImpression')&&session.includes('commanderSponsoredExposures'),'impressions must have an explicit event boundary instead of being counted during provider load');
  const screen=fs.readFileSync(path.join(root,'src','screens','CommanderScreen.tsx'),'utf8');
  const service=fs.readFileSync(path.join(root,'src','services','commander.ts'),'utf8');
  assert(!service.includes('recordCommanderSponsoredImpression'),'provider loading must never fabricate impressions; viewability is wired separately at the screen/carousel boundary');
  assert(screen.includes('noteSponsoredVisible'),'the screen may only record impressions through an explicit visibility handler');
});


test('V0.178 sensitive LIA content never becomes social voice',()=>{
  const privacy=fs.readFileSync(path.join(root,'src','lib','liaPrivacyChannel.ts'),'utf8');
  assert(privacy.includes("if(input.sensitive){")&&privacy.includes("return input.appOpen?'private_screen':'private_notification'"),'sensitive content must always use a private surface');
  assert(privacy.includes('socialModeCanOverrideSensitivity:false'),'table/social mode must never override sensitivity');
  assert(privacy.includes('sensitiveVoice:false'),'the privacy contract must explicitly forbid sensitive voice');
});

test('V0.178 LIA private notification exposes only a generic preview',()=>{
  const notifications=fs.readFileSync(path.join(root,'src','services','notifications.ts'),'utf8');
  const i18n=fs.readFileSync(path.join(root,'src','i18n','index.ts'),'utf8');
  assert(notifications.includes("data:{screen:'lia-private',messageId:safeId,source:'lia-private'}"),'notification payload must carry only the private message identifier');
  assert(!notifications.includes('privateText'),'notification scheduling must never receive private text');
  assert(i18n.includes("'lia.privateNotificationPreview':'J’ai trouvé quelque chose pour toi 👀'"),'French lock-screen preview must remain the validated generic copy');
});

test('V0.178 private LIA inbox remains scoped to its owner',()=>{
  const inbox=fs.readFileSync(path.join(root,'src','services','liaPrivateInbox.ts'),'utf8');
  assert(inbox.includes("message.ownerId===ownerId")||inbox.includes("message.ownerId!==ownerId"),'private messages must be filtered by owner');
  assert(inbox.includes('openedAtIso'),'private opening state must stay separate from lock-screen notification state');
  assert(inbox.includes("slice(0,100)"),'local private inbox must stay bounded');
});

test('V0.178 quiet mode still blocks proactive LIA delivery',()=>{
  const privacy=fs.readFileSync(path.join(root,'src','lib','liaPrivacyChannel.ts'),'utf8');
  assert(privacy.includes("if(input.quiet&&input.proactive&&!input.userInitiated)return 'silent'"),'requested silence must remain stronger than proactive delivery');
});


test('V0.179 Mémos can keep an optional structured link without storing a transcript',()=>{
  const service=fs.readFileSync(path.join(root,'src','services','memos.ts'),'utf8');
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609160021_lia_memo_links.sql'),'utf8').toLowerCase();
  assert(service.includes("LiaMemoLinkKind='restaurant'|'recipe'|'meal'|'shopping'|'commander'|'family'|'other'"),'Memo links must stay on a small structured allowlist');
  assert(service.includes('link_kind')&&service.includes('link_ref')&&service.includes('link_label'),'Memo persistence must carry only structured link metadata');
  assert(!migration.includes('transcript')||migration.includes('never stores conversation transcripts'),'migration must not create transcript storage');
  assert(migration.includes("link_kind in ('restaurant','recipe','meal','shopping','commander','family','other')"),'database must enforce the structured Memo link allowlist');
});

test('V0.179 linked Mémos remain optional and private',()=>{
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609160021_lia_memo_links.sql'),'utf8').toLowerCase();
  const base=fs.readFileSync(path.join(root,'supabase','migrations','202609160017_lia_memos_child_age_optional.sql'),'utf8').toLowerCase();
  assert(migration.includes('(link_kind is null and link_ref is null and link_label is null)'),'a Memo must remain valid with no linked object');
  assert(base.includes('lia_memos_select_own')&&base.includes('user_id=auth.uid()'),'linked Mémos must inherit the existing owner-only RLS');
  assert(!migration.includes('commander_favorites'),'Memo links must stay independent from restaurant Favorites');
});

test('V0.179 Mémos show linked context as metadata, not as an automatic action',()=>{
  const screen=fs.readFileSync(path.join(root,'src','screens','MemosScreen.tsx'),'utf8');
  assert(screen.includes("row.link_label?<Text")&&screen.includes("locale.t('memos.related'"),'linked context must be visible when present');
  assert(!screen.includes('Linking.openURL')&&!screen.includes('setCommanderFavorite'),'a linked Memo must not silently launch an external action or become a Favorite');
});


test('V0.180 linked Mémos navigate only after an explicit user press',()=>{
  const screen=fs.readFileSync(path.join(root,'src','screens','MemosScreen.tsx'),'utf8');
  assert(screen.includes("row.link_kind&&row.link_kind!=='other'&&onOpenLinkedContext?<Pressable"),'only known linked Memo contexts may expose the explicit navigation control');
  assert(screen.includes('onPress={()=>onOpenLinkedContext(row)}'),'linked navigation must be triggered only by the user pressing the button');
  assert(!screen.includes('useEffect(()=>onOpenLinkedContext'),'opening Mémos must never auto-navigate');
});

test('V0.180 Memo navigation reuses existing app surfaces instead of parallel flows',()=>{
  const main=fs.readFileSync(path.join(root,'src','screens','MainScreen.tsx'),'utf8');
  assert(main.includes("memo.link_kind==='restaurant'||memo.link_kind==='commander'")&&main.includes("setLiaSurface('commander')"),'restaurant/Commander Mémos must reuse Commander');
  assert(main.includes("memo.link_kind==='recipe'")&&main.includes("setTab('recipes')"),'recipe Mémos must reuse Recipes');
  assert(main.includes("memo.link_kind==='meal'")&&main.includes("setTab('planning')"),'meal Mémos must reuse Planning');
  assert(main.includes("memo.link_kind==='shopping'")&&main.includes("setTab('shopping')"),'shopping Mémos must reuse Shopping');
  assert(main.includes("memo.link_kind==='family'")&&main.includes("setTab('household')"),'family Mémos must reuse Household');
});



test('V0.181 Commander handles missing address and offline state without inventing availability',()=>{
  const screen=fs.readFileSync(path.join(root,'src','screens','CommanderScreen.tsx'),'utf8');
  assert(screen.includes("!activeAddress.trim()?<EmptyState"),'Commander must stop before provider discovery when no address is available');
  assert(screen.includes("offline?<EmptyState"),'Commander must expose an explicit offline state');
  assert(screen.includes('Network.getNetworkStateAsync')&&screen.includes('Network.addNetworkStateListener'),'Commander must observe connectivity instead of treating network failure as restaurant truth');
  assert(screen.includes('setRows([]);setSponsoredRows([])'),'offline/missing-address states must not leave unverifiable current availability on screen');
});

test('V0.181 Commander retries after connectivity returns and localizes the new states',()=>{
  const screen=fs.readFileSync(path.join(root,'src','screens','CommanderScreen.tsx'),'utf8');
  const i18n=fs.readFileSync(path.join(root,'src','i18n','index.ts'),'utf8');
  assert(screen.includes('wasOfflineRef.current&&!nextOffline')&&screen.includes('setNetworkNonce(value=>value+1)'),'reconnection must trigger a fresh provider verification');
  for(const key of ['commander.addressRequiredTitle','commander.addressRequiredText','commander.offlineTitle','commander.offlineText']) assert(i18n.includes(`'${key}'`),`missing localized Commander state ${key}`);
});



test('V0.182 product telemetry is opt-in and strips non-commercial metadata',()=>{
  const telemetry=fs.readFileSync(path.join(root,'src','services','productTelemetry.ts'),'utf8');
  assert(telemetry.includes('let provider:ProductTelemetryProvider|null=null'),'telemetry must remain disabled until a provider is explicitly configured');
  assert(telemetry.includes('configureProductTelemetryProvider'),'telemetry needs an explicit provider boundary');
  assert(telemetry.includes("commander_open:new Set(['address_present'])"),'Commander open telemetry must use only coarse commercial state');
  for(const forbidden of ['message_text','transcript','confidence','health','medical','religion','sexuality']) assert(!telemetry.includes(`'${forbidden}'`),`telemetry allowlist must not include sensitive field ${forbidden}`);
  assert(telemetry.includes('if(!allowed.has(key))continue'),'unknown metadata must be dropped instead of forwarded');
});

test('V0.182 Commander measures explicit commercial actions without fabricating sponsored impressions',()=>{
  const screen=fs.readFileSync(path.join(root,'src','screens','CommanderScreen.tsx'),'utf8');
  const detail=fs.readFileSync(path.join(root,'src','screens','CommanderDetailScreen.tsx'),'utf8');
  assert(screen.includes("emitProductTelemetry('commander_open'")&&screen.includes("emitProductTelemetry('restaurant_open'"),'Commander must measure only explicit product navigation events');
  assert(screen.includes("emitProductTelemetry('sponsored_click'"),'a sponsored click may be measured only after an explicit restaurant open action');
  assert(detail.includes("emitProductTelemetry('outbound_order_click'"),'verified order handoff clicks need a revenue-quality event boundary');
  assert(screen.includes("emitProductTelemetry('sponsored_impression'")&&screen.includes('noteSponsoredVisible'),'sponsored impressions may be measured only through the explicit V0.190 visibility boundary');
});



test('V0.183 analytics precise location and ad personalization default to no consent',()=>{
  const consent=fs.readFileSync(path.join(root,'src','domain','privacyConsent.ts'),'utf8');
  assert(consent.includes("analytics:'unknown'")&&consent.includes("adsPersonalization:'unknown'")&&consent.includes("preciseLocation:'unknown'"),'privacy-sensitive capabilities must not default to granted');
  assert(consent.includes("consent.analytics==='granted'")&&consent.includes("consent.adsPersonalization==='granted'")&&consent.includes("consent.preciseLocation==='granted'"),'every privacy capability must require explicit granted consent');
});

test('V0.183 Commander current-location choice never blocks the household fallback',()=>{
  const location=fs.readFileSync(path.join(root,'src','domain','commanderLocation.ts'),'utf8');
  assert(location.includes("if(!input.useCurrentLocation&&home)return{source:'household'"),'household address remains the default destination');
  assert(location.includes("mayUsePreciseLocation(input.consent)"),'current location must require precise-location consent');
  assert(location.includes("if(home)return{source:'household'"),'refusing or lacking precise location must fall back to the household address');
  assert(location.includes("source:'missing',address:null"),'no address remains a truthful missing state instead of a forced permission prompt');
});

test('V0.183 product telemetry requires consent in addition to an explicit provider',()=>{
  const telemetry=fs.readFileSync(path.join(root,'src','services','productTelemetry.ts'),'utf8');
  assert(telemetry.includes('let hasAnalyticsConsent=()=>false'),'analytics consent must fail closed by default');
  assert(telemetry.includes('configureProductTelemetryConsent'),'consent must be an explicit runtime boundary');
  assert(telemetry.includes('if(!provider||!hasAnalyticsConsent())return;'),'configured telemetry alone must never bypass user consent');
});



test('V0.184 feature acceptance matrix keeps 53 scenarios across all validated Commander and LIA groups',()=>{
  const matrix=JSON.parse(fs.readFileSync(path.join(root,'docs','FEATURE_ACCEPTANCE_MATRIX.json'),'utf8'));
  assert.equal(matrix.scenarios.length,53,'feature acceptance matrix must keep exactly 53 scenarios');
  const groups=new Set(matrix.scenarios.map(row=>row.group));
  for(const group of ['location','delivery','carousel','sponsored','lia_privacy','memos_favorites','network_rtl_accessibility']) assert(groups.has(group),`missing acceptance group ${group}`);
  assert(matrix.scenarios.filter(row=>row.critical===true).length>=20,'critical invariants must remain explicitly identified');
});

test('V0.184 feature acceptance audit is mandatory in verify without pretending to be device evidence',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const audit=fs.readFileSync(path.join(root,'scripts','feature-acceptance-audit.cjs'),'utf8');
  assert(pkg.scripts.verify.includes('feature:acceptance:audit'),'verify must enforce the feature acceptance matrix');
  assert(audit.includes('expected 53 scenarios')&&audit.includes('critical coverage'),'feature audit must verify count and critical coverage');
  assert(!audit.includes('device')&&!audit.includes('build_id'),'feature matrix must not masquerade as real-device beta evidence');
});


test('V0.185 feature beta template starts pending and mirrors all 53 required scenarios',()=>{
  const matrix=JSON.parse(fs.readFileSync(path.join(root,'docs','FEATURE_ACCEPTANCE_MATRIX.json'),'utf8'));
  const template=fs.readFileSync(path.join(root,'scripts','feature-beta-template.cjs'),'utf8');
  assert(template.includes("status:'pending'")&&template.includes("matrix.scenarios.map"),'feature beta template must generate pending rows from the acceptance matrix');
  assert(template.includes("app_version:pkg.version")&&template.includes("devices:[]"),'feature beta template must bind evidence to the current app version and start with no fake devices');
  assert.equal(matrix.scenarios.filter(row=>row.status==='required').length,53,'all 53 matrix scenarios must remain required');
});

test('V0.185 feature beta audit requires physical evidence and stays outside local verify',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const audit=fs.readFileSync(path.join(root,'scripts','feature-beta-acceptance-audit.cjs'),'utf8');
  assert.equal(pkg.scripts['feature:beta:audit'],'node scripts/feature-beta-acceptance-audit.cjs','feature beta audit script must remain explicitly callable');
  assert(!pkg.scripts.verify.includes('feature:beta:audit'),'local verify must not masquerade as physical beta evidence');
  assert(audit.includes('at least two real devices are required')&&audit.includes("result.status!=='pass'"),'feature beta audit must require physical devices and explicit PASS for every required scenario');
  assert(audit.includes('source_revision is required')&&audit.includes('build_id is required'),'feature beta proof must be bound to source and build identity');
});


test('V0.186 release doctor keeps physical beta evidence separate and fail-closed',()=>{
  const doctor=fs.readFileSync(path.join(root,'scripts','release-doctor.cjs'),'utf8');
  assert(doctor.includes("stage('Physical beta evidence'"),'release doctor must expose a dedicated physical beta stage');
  assert(doctor.includes("beta-acceptance-audit.cjs")&&doctor.includes("feature-beta-acceptance-audit.cjs"),'release doctor must verify both physical beta evidence contracts');
  assert(doctor.includes('16 required scenarios')&&doctor.includes('53 required scenarios'),'doctor must identify the two independent evidence scopes');
});

test('V0.186 release doctor never treats missing physical evidence as ready',()=>{
  const result=spawnSync(process.execPath,[path.join(root,'scripts','release-doctor.cjs'),'--json'],{cwd:root,env:{...process.env,RELEASE_DOCTOR_NETWORK_TIMEOUT_MS:'20'},encoding:'utf8',timeout:15000});
  assert.strictEqual(result.status,0,result.stderr);
  const report=JSON.parse(result.stdout);
  const stage=report.stages.find(row=>row.name==='Physical beta evidence');
  assert(stage,'physical beta evidence stage must exist');
  assert.strictEqual(stage.status,'blocked');
  assert(stage.checks.every(row=>row.status==='block'),'both beta proof checks must fail closed when evidence is absent');
});


test('V0.187 Commander keeps carousel previews capped and exposes explicit View all',()=>{
  const screen=fs.readFileSync(path.join(root,'src','screens','CommanderScreen.tsx'),'utf8');
  const carousel=fs.readFileSync(path.join(root,'src','components','CommanderCarousel.tsx'),'utf8');
  assert(screen.includes("const take=(source:CommanderPlace[],count=8)"),'carousel preview cap must remain 8');
  assert(screen.includes('allRows:')&&screen.includes("section.allRows.length>section.rows.length"),'Commander must preserve the full eligible section separately from its preview');
  assert(carousel.includes('onViewAll&&viewAllLabel?<Pressable'),'View all must remain an explicit user action');
});

test('V0.187 View all returns to the same Commander context without changing ranking rules',()=>{
  const screen=fs.readFileSync(path.join(root,'src','screens','CommanderScreen.tsx'),'utf8');
  assert(screen.includes('if(selected||viewAllSection)return')&&screen.includes("setViewAllSection(null)"),'returning from View all must restore the stored Commander scroll context');
  assert(screen.includes('carouselIndexes')&&screen.includes('scrollYRef'),'carousel index and vertical context must remain stored while the full list is open');
  assert(screen.includes('COMMANDER_MAX_RADIUS_KM'),'View all must stay inside the same Commander radius contract');
});



test('V0.188 LIA resolves contextual Commander carousel commands without changing ranking',()=>{
  assert.deepStrictEqual(commanderLia.parseCommanderLiaCommand('suivant'),{kind:'next'});
  assert.deepStrictEqual(commanderLia.parseCommanderLiaCommand('précédent'),{kind:'previous'});
  assert.deepStrictEqual(commanderLia.parseCommanderLiaCommand('ouvre celui-là'),{kind:'open_current'});
  assert.deepStrictEqual(commanderLia.parseCommanderLiaCommand('le troisième'),{kind:'open_index',index:2});
  assert.deepStrictEqual(commanderLia.parseCommanderLiaCommand('another'),{kind:'another'});
  assert.deepStrictEqual(commanderLia.parseCommanderLiaCommand('משהו אחר'),{kind:'another'});
  assert.deepStrictEqual(commanderLia.parseCommanderLiaCommand('commande-moi le meilleur'),{kind:'unknown'});
  assert.equal(commanderLia.nextCommanderIndex(7,8,'next'),0);
  assert.equal(commanderLia.nextCommanderIndex(0,8,'previous'),7);
});

test('V0.188 Commander keeps an explicit active carousel and lets LIA move only that carousel',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/CommanderScreen.tsx'),'utf8');
  const carousel=fs.readFileSync(path.join(root,'src/components/CommanderCarousel.tsx'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(screen.includes("const[activeCarouselKey,setActiveCarouselKey]=useState('')"),'Commander must retain one explicit active carousel');
  assert(screen.includes('onInteract={()=>{setActiveCarouselKey(section.key);markCommanderSeen(section.key,section.rows[carouselIndexes[section.key]??0]);}}'),'only user interaction should activate a carousel and mark its visible card as seen');
  assert(screen.includes('requestedIndex={carouselIndexes[section.key]??0}'),'LIA must be able to request a visible carousel index');
  assert(screen.includes('parseCommanderLiaCommand(command)'),'Commander must route contextual LIA commands through the deterministic parser');
  assert(carousel.includes("typeof requestedIndex!=='number'"),'carousel must support a controlled requested index without becoming fully controlled');
  assert(orb.includes('onCommanderCommand?:(command:string)=>boolean'),'the persistent LIA control must expose an optional Commander command channel');
});



test('V0.189 LIA autre chose prefers an unseen card in the active Commander session',()=>{
  const rows=[{id:'a'},{id:'b'},{id:'c'},{id:'d'}];
  assert.equal(commanderLia.nextUnseenCommanderIndex(rows,0,['a','b']),2);
  assert.equal(commanderLia.nextUnseenCommanderIndex(rows,2,['a','b','c']),3);
  assert.equal(commanderLia.nextUnseenCommanderIndex(rows,3,['a','b','c','d']),0,'once all cards were seen the carousel may cycle normally');
  const screen=fs.readFileSync(path.join(root,'src/screens/CommanderScreen.tsx'),'utf8');
  assert(screen.includes('seenPlaceIdsBySection'),'Commander must keep seen-card state local to the current Commander session');
  assert(screen.includes("action.kind==='another'"),'LIA autre chose must have its own anti-repeat branch');
  assert(screen.includes('nextUnseenCommanderIndex(activeCarousel.rows,current'),'LIA autre chose must prefer unseen cards from the active carousel only');
});



test('V0.190 sponsored impressions require real carousel visibility or an explicit open',()=>{
  const carousel=fs.readFileSync(path.join(root,'src/components/CommanderCarousel.tsx'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/CommanderScreen.tsx'),'utf8');
  const service=fs.readFileSync(path.join(root,'src/services/commander.ts'),'utf8');
  assert(carousel.includes("if(!interacted)return;const row=rows[index];if(row?.sponsored)onSponsoredVisible?.(row)"),'a loaded sponsored card must not count until the carousel has actual user interaction');
  assert(carousel.includes("if(row.sponsored)onSponsoredVisible?.(row);onOpen(row)"),'an explicitly opened sponsored card must count as visible even for accessibility activation');
  assert(screen.includes('sponsoredImpressionKeysRef=useRef(new Set<string>())'),'Commander must dedupe sponsored impressions conservatively within one screen session');
  assert(screen.includes("recordCommanderSponsoredImpression(key)"),'the explicit viewability boundary must feed the sponsored frequency session');
  assert(screen.includes("emitProductTelemetry('sponsored_impression'"),'only the explicit visibility boundary may emit sponsored impression telemetry');
  assert(!service.includes('sponsored_impression'),'provider loading must remain completely separate from impression measurement');
});



test('V0.191 Commander asks home or here only when precise location is already allowed and differs',()=>{
  const locationSource=fs.readFileSync(path.join(root,'src/domain/commanderLocation.ts'),'utf8');
  assert(locationSource.includes('commanderNeedsDestinationChoice'),'Commander must keep the ambiguity decision in a deterministic domain helper');
  assert(locationSource.includes("home!==current&&mayUsePreciseLocation(input.consent)"),'current-vs-home choice must require different addresses and granted precise-location consent');
});

test('V0.191 Commander blocks provider search until an explicit destination choice when ambiguity exists',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/CommanderScreen.tsx'),'utf8');
  assert(screen.includes("destinationChoiceRequired&&!destinationChoiceMade"),'Commander must retain an explicit pending destination choice');
  assert(screen.includes("if(destinationChoicePending){setRows([]);setSponsoredRows([]);setLoading(false);return;}"),'provider search must wait for the user choice');
  assert(screen.includes("locale.t('commander.locationQuestion')"),'the current-vs-home question must be visible and localized');
  assert(screen.includes("locale.t('commander.locationHome')")&&screen.includes("locale.t('commander.locationHere')"),'both explicit destination choices must be available');
});



test('V0.192 sponsored provider failure cannot take down organic Commander results',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/CommanderScreen.tsx'),'utf8');
  assert(screen.includes('Promise.allSettled([loadCommanderPlaces'),'organic and sponsored provider calls must settle independently');
  assert(screen.includes("if(naturalResult.status==='rejected')throw naturalResult.reason"),'organic provider failure must still surface as a real Commander error');
  assert(screen.includes("setSponsoredRows(sponsoredResult.status==='fulfilled'?sponsoredResult.value:[]);"),'sponsored provider failure must degrade to no sponsored rows');
});



test('V0.193 private LIA delivery stores detail before sending only a generic notification reference',()=>{
  const delivery=fs.readFileSync(path.join(root,'src/services/liaPrivateDelivery.ts'),'utf8');
  assert(delivery.includes('saveLiaPrivateMessage({ownerId:input.ownerId,text:input.privateText'),'private detail must be stored in the owner-scoped inbox');
  assert(delivery.includes('scheduleLiaPrivateNotification(message.id,input.notificationCopy)'),'notification scheduling must receive only the stored message id plus generic copy');
  assert(!delivery.includes('scheduleLiaPrivateNotification(input.privateText'),'private text must never cross into notification scheduling');
});

test('V0.193 private LIA delivery keeps quiet mode and existing notification permission behavior fail-closed',()=>{
  const delivery=fs.readFileSync(path.join(root,'src/services/liaPrivateDelivery.ts'),'utf8');
  const notifications=fs.readFileSync(path.join(root,'src/services/notifications.ts'),'utf8');
  assert(delivery.includes("if(channel==='silent')return{status:'silent'"),'quiet/proactive policy must be respected before storage or notification');
  assert(delivery.includes("if(channel==='private_screen')return{status:'stored'"),'open-app private delivery must not create a lock-screen notification');
  assert(notifications.includes('const permission=await Notifications.getPermissionsAsync()'),'private notification must inspect existing permission');
  const privateStart=notifications.indexOf('export async function scheduleLiaPrivateNotification');const privateEnd=notifications.indexOf('async function requestReminderPermission',privateStart);const privateBlock=notifications.slice(privateStart,privateEnd);assert(privateStart>=0&&privateEnd>privateStart&&!privateBlock.includes('requestReminderPermission')&&!privateBlock.includes('requestPermissionsAsync'),'private notification must never trigger a surprise permission request');
});



test('V0.194 private notification routing accepts only an explicit private message reference',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaPrivateNotificationRoute.ts'),'utf8');
  assert(source.includes("value.screen!=='lia-private'"),'notification routing must reject every unrelated notification screen');
  assert(source.includes("typeof value.messageId!=='string'"),'notification routing must require a string message id');
  assert(source.includes('const messageId=value.messageId.trim()'),'blank private message ids must not route');
});

test('V0.194 notification tap opens only the owner-scoped private message and consumes the response',()=>{
  const app=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaPrivateMessageScreen.tsx'),'utf8');
  const notifications=fs.readFileSync(path.join(root,'src/services/notifications.ts'),'utf8');
  assert(app.includes('Notifications.getLastNotificationResponseAsync().then(handle)'),'cold-start notification response must be inspected');
  assert(app.includes('Notifications.addNotificationResponseReceivedListener(handle)'),'foreground/background notification taps must be observed');
  assert(app.includes('Notifications.clearLastNotificationResponseAsync()'),'handled private notification response must be consumed');
  assert(app.includes('ownerId={sessionUserId} messageId={pendingLiaPrivateMessageId}'),'private screen must receive the authenticated owner id plus referenced message id');
  assert(screen.includes('openLiaPrivateMessage(ownerId,messageId)'),'private screen must use the owner-scoped inbox lookup');
  assert(notifications.includes("data:{screen:'lia-private',messageId:safeId,source:'lia-private'}"),'system notification payload must remain reference-only');
  assert(!notifications.includes("data:{screen:'lia-private',messageId:safeId,source:'lia-private',text"),'system notification payload must never include private text');
});


test('V0.195 LIA never invents relationship or family-structure facts',()=>{
  assert.equal(liaKnowledgeGuard.liaMayReferenceStructuredFact({reference:'relationship',relationshipStatus:'',source:'profile_form'}),false);
  assert.equal(liaKnowledgeGuard.liaMayReferenceStructuredFact({reference:'divorce',relationshipStatus:'married',source:'profile_form'}),false);
  assert.equal(liaKnowledgeGuard.liaMayReferenceStructuredFact({reference:'divorce',relationshipStatus:'divorced',source:'profile_form'}),true);
  assert.equal(liaKnowledgeGuard.liaMayReferenceStructuredFact({reference:'relationship',relationshipStatus:'married',source:'confirmed_conversation'}),false,'conversation alone must not silently become structured family truth');
});

test('V0.195 family message capabilities follow the validated child age rules',()=>{
  const caps=familyMessageEligibility.familyMessageCapabilities;
  assert.deepStrictEqual(caps({relation:'child',age:12,phoneNumber:'0501234567'}),{canReceiveMessage:true,canChooseMeal:false,canAnswerPresence:false,canTakeCharge:false,canWriteNote:true,ageKnown:true});
  assert.deepStrictEqual(caps({relation:'child',age:16,phoneNumber:'0501234567'}),{canReceiveMessage:true,canChooseMeal:true,canAnswerPresence:false,canTakeCharge:false,canWriteNote:true,ageKnown:true});
  assert.deepStrictEqual(caps({relation:'child',age:17,phoneNumber:'0501234567'}),{canReceiveMessage:true,canChooseMeal:true,canAnswerPresence:true,canTakeCharge:true,canWriteNote:true,ageKnown:true});
  assert.equal(caps({relation:'child',age:17,phoneNumber:''}).canReceiveMessage,false,'a member without a phone must not receive an external link');
  assert.equal(caps({relation:'spouse',age:null,phoneNumber:'0501234567'}).canAnswerPresence,true,'reachable spouse keeps the full meal-response surface');
});

test('V0.195 LIA guides age-incoherent family message choices without overriding the organizer',()=>{
  const guide=familyMessageEligibility.liaFamilyMessageGuidance;
  assert(guide({relation:'child',age:12,phoneNumber:'0501234567',presenceQuestionEnabled:true,mealChoicesEnabled:true,takeChargeEnabled:true}).includes('presence_not_needed'));
  assert(guide({relation:'child',age:16,phoneNumber:'0501234567',presenceQuestionEnabled:false,mealChoicesEnabled:true,takeChargeEnabled:true}).includes('take_charge_not_allowed'));
  assert(guide({relation:'child',age:17,phoneNumber:'0501234567',presenceQuestionEnabled:false,mealChoicesEnabled:true,takeChargeEnabled:true}).includes('presence_suggested'));
});

test('V0.195 light-response backend enforces age capabilities and accepts a free family note',()=>{
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609170023_family_message_age_rules.sql'),'utf8').toLowerCase();
  const edge=fs.readFileSync(path.join(root,'supabase','functions','light-response','index.ts'),'utf8');
  assert(migration.includes("v_member.age>=17")&&migration.includes("v_member.age>=16"),'server must enforce the 16/17 age boundaries');
  assert(migration.includes("p_presence<>'yes'")&&migration.includes('response_not_allowed_for_age'),'under-17 presence must stay implicit rather than being asked');
  assert(migration.includes('light_member_not_reachable'),'server must refuse a share token when no phone exists');
  assert(migration.includes('add column if not exists note text')&&migration.includes('char_length(note) <= 500'),'free family notes must be stored with a bounded length');
  assert(edge.includes("p_note:note")&&edge.includes("id=\"note\"")&&edge.includes('allow_take_charge'),'public response UI must carry the free note and recipient-specific capabilities');
});

test('V0.195 cooking companion extracts only explicit recipe timings and never invents one',()=>{
  assert.equal(liaCookingCompanion.extractCookingDurationSeconds('Cuire les pâtes 9 minutes.'),540);
  assert.equal(liaCookingCompanion.extractCookingDurationSeconds('Laisser mijoter 1 h 30 min.'),5400);
  assert.equal(liaCookingCompanion.extractCookingDurationSeconds('Ajouter la sauce et mélanger.'),null);
  assert.equal(liaCookingCompanion.liaCookingCue('Ajouter le sel progressivement.',0,3).kind,'salt');
  assert.equal(liaCookingCompanion.liaCookingMayOfferConversation({timerRunning:true,remainingSeconds:300,humanSpeechActive:false,sensitiveMoment:false,questionRecentlyAsked:false}),true);
  assert.equal(liaCookingCompanion.liaCookingMayOfferConversation({timerRunning:true,remainingSeconds:300,humanSpeechActive:true,sensitiveMoment:false,questionRecentlyAsked:false}),false,'LIA must not start a relational question over human speech');
});

test('V0.195 cooking screen keeps LIA beside the recipe with an explicit in-app timer',()=>{
  const screen=fs.readFileSync(path.join(root,'src','screens','CookingModeScreen.tsx'),'utf8');
  assert(screen.includes('liaCookingCue(current,index,steps.length)'),'cooking mode must derive guidance from the actual current recipe step');
  assert(screen.includes("locale.t('cooking.liaWithYou')"),'cooking mode must visibly present LIA as cooking with the organizer');
  assert(screen.includes('setTimerEndsAt(Date.now()+cue.seconds!*1000)'),'timer must start only from an explicit duration found in the recipe step');
});


test('V0.196 LIA open loops surface only when due and never harass',()=>{
  const now=new Date('2026-09-17T10:00:00Z');
  const base={id:'l1',householdId:'h1',kind:'follow_up',topic:'plans',subjectLabel:'Sarah',summary:'pickup follow-up',appPrompt:'Alors, mission Sarah terminée ?',sensitivity:'ordinary',action:'check_in',dueAtIso:'2026-09-17T09:00:00Z',expiresAtIso:null,notificationPreview:'Sarah approche',notificationPreviewSafe:true,status:'open',surfaceCount:0,lastSurfacedAtIso:null,createdAtIso:'2026-09-17T08:00:00Z',updatedAtIso:'2026-09-17T08:00:00Z'};
  assert.equal(liaOpenLoops.liaOpenLoopDue(base,now),true);
  assert.equal(liaOpenLoops.liaOpenLoopMaySurface(base,{now,quiet:false,mode:'idle',humanSpeechActive:false,organizerEngaged:true}),true);
  assert.equal(liaOpenLoops.liaOpenLoopMaySurface({...base,lastSurfacedAtIso:'2026-09-17T08:30:00Z'},{now,quiet:false,mode:'idle',humanSpeechActive:false,organizerEngaged:true}),false,'a surfaced thread must cool down for four hours');
  assert.equal(liaOpenLoops.liaOpenLoopMaySurface({...base,surfaceCount:3},{now,quiet:false,mode:'idle',humanSpeechActive:false,organizerEngaged:true}),false,'LIA must stop after three ignored surfaces');
  assert.equal(liaOpenLoops.liaOpenLoopMaySurface(base,{now,quiet:true,mode:'idle',humanSpeechActive:false,organizerEngaged:true}),false,'quiet mode must win');
});

test('V0.196 LIA open loops keep personal and sensitive threads off shared surfaces',()=>{
  const ordinary={id:'o',householdId:'h1',kind:'offer_help',topic:'shopping',subjectLabel:null,summary:'shoe idea',appPrompt:'J’ai une idée pour tes chaussures.',sensitivity:'ordinary',action:'search',dueAtIso:'2026-09-17T09:00:00Z',expiresAtIso:null,notificationPreview:'J’ai une idée pour tes chaussures 👀',notificationPreviewSafe:true,status:'open',surfaceCount:0,lastSurfacedAtIso:null,createdAtIso:'2026-09-17T08:00:00Z',updatedAtIso:'2026-09-17T08:00:00Z'};
  assert.equal(liaOpenLoops.liaOpenLoopCanShowInSharedAppSurface(ordinary),true);
  assert.equal(liaOpenLoops.liaOpenLoopCanShowInSharedAppSurface({...ordinary,sensitivity:'personal'}),false);
  assert.equal(liaOpenLoops.liaOpenLoopCanShowInSharedAppSurface({...ordinary,sensitivity:'sensitive'}),false);
  assert.equal(liaOpenLoops.liaOpenLoopNotificationBody({...ordinary,sensitivity:'sensitive',notificationPreviewSafe:false},'J’ai pensé à quelque chose pour toi 👀'),'J’ai pensé à quelque chose pour toi 👀');
  assert.equal(liaOpenLoops.liaOpenLoopNotificationBody(ordinary,'générique'),'J’ai une idée pour tes chaussures 👀');
});

test('V0.196 LIA chooses the most useful due thread instead of the loudest thread',()=>{
  const now=new Date('2026-09-17T10:00:00Z');
  const mk=(id,kind,action,surfaceCount=0)=>({id,householdId:'h1',kind,topic:'day',subjectLabel:null,summary:id,appPrompt:id,sensitivity:'ordinary',action,dueAtIso:'2026-09-17T09:00:00Z',expiresAtIso:null,notificationPreview:null,notificationPreviewSafe:false,status:'open',surfaceCount,lastSurfacedAtIso:null,createdAtIso:'2026-09-17T08:00:00Z',updatedAtIso:'2026-09-17T08:00:00Z'});
  const chosen=liaOpenLoops.chooseLiaOpenLoopCandidate([mk('offer','offer_help','search'),mk('reminder','reminder','alarm'),mk('follow','follow_up','check_in')],{now,quiet:false,mode:'idle',humanSpeechActive:false,organizerEngaged:true});
  assert.equal(chosen?.id,'reminder','time-bound reminders must outrank a casual follow-up when both are due');
});

test('V0.196 open-loop persistence is owner-private and stores structured threads rather than transcripts',()=>{
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609170024_lia_open_loops.sql'),'utf8').toLowerCase();
  const service=fs.readFileSync(path.join(root,'src','services','liaOpenLoops.ts'),'utf8');
  const main=fs.readFileSync(path.join(root,'src','screens','MainScreen.tsx'),'utf8');
  const notifications=fs.readFileSync(path.join(root,'src','services','notifications.ts'),'utf8');
  assert(migration.includes('create table if not exists public.lia_open_loops'),'open loops need durable owner-scoped storage');
  assert(migration.includes('user_id=auth.uid()'),'open-loop RLS must stay private to the authenticated owner');
  assert(!/\btranscript\s+text\b/.test(migration),'the open-loop table must not store a conversation transcript column');
  assert(service.includes('nextDueLiaOpenLoopForSharedSurface'),'runtime needs a shared-surface selector that filters private threads');
  assert(main.includes('runLiaOpenLoopReengagement({'),'app reopen must let LIA resume a due ordinary thread through the unified runtime');
  assert(notifications.includes("return 'private-required'"),'personal/sensitive open-loop notifications must be forced to the private channel');
  assert(notifications.includes("requestPermission")===false||notifications.includes('never turns a follow-up into a surprise OS permission prompt'),'open-loop nudges must not surprise-request notification permission');
});


test('V0.197 LIA right-hand policy turns daily events into concrete help without acting silently',()=>{
  const pickup=liaRightHand.liaRightHandOffers({eventKind:'child_pickup',timeKnown:false,recurring:true,sensitivity:'ordinary'});
  assert.deepStrictEqual(pickup.map(x=>x.kind),['ask_time','set_recurring_alarm','follow_up']);
  assert.equal(pickup[0].requiresConfirmation,false,'LIA may ask for the missing time without permission');
  assert.equal(pickup[1].requiresConfirmation,true,'recurring reminders must require explicit organizer confirmation');
  const doctor=liaRightHand.liaRightHandOffers({eventKind:'appointment',timeKnown:true,recurring:false,notesPrepared:false,sensitivity:'sensitive'});
  assert.deepStrictEqual(doctor.map(x=>x.kind),['prepare_notes','set_alarm','follow_up']);
  assert(doctor.every(x=>x.private),'a sensitive appointment must keep every follow-up private');
});

test('V0.197 assistant alarms require confirmation and support selected weekly days without exact-alarm permission',()=>{
  const notifications=fs.readFileSync(path.join(root,'src','services','notifications.ts'),'utf8');
  assert(notifications.includes("return input.confirmed?'invalid':'confirmation-required'"),'LIA must not schedule an alarm before explicit confirmation');
  assert(notifications.includes('new Set(input.weekly.weekdays)'),'weekly reminders must dedupe selected days');
  assert(notifications.includes('SchedulableTriggerInputTypes.WEEKLY'),'recurring LIA reminders must use supported weekly notification triggers');
  assert(!notifications.includes('SCHEDULE_EXACT_ALARM'),'LIA reminders must not request restricted Android exact-alarm permission');
  assert(notifications.includes("sound:'default'")&&notifications.includes('allowSound:true'),'explicitly accepted LIA alarms may use an audible reminder channel');
});

test('V0.197 sensitive assistant alarms keep lock-screen text generic',()=>{
  const notifications=fs.readFileSync(path.join(root,'src','services','notifications.ts'),'utf8');
  assert(notifications.includes("const body=input.sensitivity==='ordinary'?input.body:input.genericPrivateBody"),'personal/sensitive alarm copy must never expose the detailed body');
  assert(notifications.includes("source:'lia-assistant-alarm'"),'assistant alarm notifications must be distinguishable from meal reminders and private inbox notifications');
  assert(notifications.includes('cancelLiaAssistantAlarm(key)'),'rescheduling the same assistant alarm must replace the old schedule instead of duplicating it');
});


test('V0.198 cooking gaps choose curiosity without interrupting or harassing',()=>{
  const choose=liaCookingCompanion.chooseLiaCookingGapActivity;
  assert.equal(choose({timerRunning:true,remainingSeconds:420,humanSpeechActive:false,sensitiveMoment:false,questionRecentlyAsked:false,organizerEngaged:true,interventionsLast30Min:0,musicAlreadyOffered:false}),'relational_question');
  assert.equal(choose({timerRunning:true,remainingSeconds:420,humanSpeechActive:true,sensitiveMoment:false,questionRecentlyAsked:false,organizerEngaged:true,interventionsLast30Min:0,musicAlreadyOffered:false}),'none');
  assert.equal(choose({timerRunning:true,remainingSeconds:420,humanSpeechActive:false,sensitiveMoment:false,questionRecentlyAsked:true,organizerEngaged:true,interventionsLast30Min:2,musicAlreadyOffered:false}),'quiet_company');
});

test('V0.198 cooking curiosity is driven by missing knowledge, not a questionnaire',()=>{
  const choose=liaCookingCompanion.chooseLiaCookingQuestion;
  const first=choose({knownFactKeys:[],recentlyAskedIds:[],privateContext:true,preferredDomains:['nutrition']});
  assert(first&&first.domain==='nutrition','a relevant missing nutrition fact may be learned during a calm cooking gap');
  const next=choose({knownFactKeys:[first.learnsFact],recentlyAskedIds:[first.id],privateContext:true,preferredDomains:['nutrition']});
  assert(next===null||next.id!==first.id,'LIA must not repeat a fact she already learned or a question she just asked');
  const publicChoice=choose({knownFactKeys:[],recentlyAskedIds:['family_gluten'],privateContext:false,preferredDomains:['nutrition']});
  assert(publicChoice===null||publicChoice.sensitive===false,'sensitive allergy questions must not be surfaced outside a private context');
});


test('V0.199 LIA relationship curiosity selects one useful unknown gap and yields to tension',()=>{
  const gaps=[
    {factKey:'sarah_favorite_meal',topic:'family',subjectLabel:'Sarah',sensitivity:'ordinary',householdSafe:true,prompt:"Et Sarah, qu’est-ce qu’elle adore manger ?",priority:8},
    {factKey:'couple_story',topic:'personal_history',subjectLabel:null,sensitivity:'personal',householdSafe:false,prompt:"Comment vous vous êtes rencontrés ?",priority:9},
  ];
  const choose=liaRelationship.chooseLiaRelationshipGap;
  assert.equal(choose({gaps,knownFactKeys:[],recentlyAskedFactKeys:[],mode:'cooking',tone:'warm',privateContext:true})?.factKey,'couple_story');
  assert.equal(choose({gaps,knownFactKeys:['couple_story'],recentlyAskedFactKeys:[],mode:'cooking',tone:'warm',privateContext:true})?.factKey,'sarah_favorite_meal');
  assert.equal(choose({gaps,knownFactKeys:[],recentlyAskedFactKeys:[],mode:'table',tone:'tense',privateContext:false}),null);
});

test('V0.199 relationship answers respect consent and table privacy before becoming memory or callbacks',()=>{
  const sensitive=liaRelationship.liaRelationshipAnswerMemoryProposal({meaningful:true,sensitivity:'sensitive',householdSafe:false,personalMemoryEnabled:true});
  assert.equal(sensitive.shouldProposeSave,true);
  assert.equal(sensitive.requiresExplicitConsent,true);
  assert.equal(sensitive.householdSafe,false);
  assert.equal(liaRelationship.liaLaterDelightKind({topic:'personal_history',sensitivity:'personal',householdSafe:false,mode:'table',needsCurrentExternalData:false}),'none');
  assert.equal(liaRelationship.liaLaterDelightKind({topic:'food',sensitivity:'ordinary',householdSafe:true,mode:'table',needsCurrentExternalData:false}),'family_touch');
  assert.equal(liaRelationship.liaLaterDelightKind({topic:'style',sensitivity:'ordinary',householdSafe:false,mode:'idle',needsCurrentExternalData:true}),'offer_help');
});


test('V0.200 table mode lets the family lead and accepts long silence',()=>{
  const choose=liaSocial.chooseLiaTableIntervention;
  const base={sessionExplicitlyActive:true,tone:'warm',humanSpeechActive:false,liaSpeaking:false,silenceMs:5000,interventionsLast20Minutes:0,sensitiveConversation:false,hasHouseholdSafeCallback:false,mealFeedbackMoment:false,afterMeal:false};
  assert.equal(choose(base),'light_question');
  assert.equal(choose({...base,humanSpeechActive:true}),'none','LIA must yield immediately to human conversation');
  assert.equal(choose({...base,tone:'tense'}),'none','tension must silence proactive table behavior');
  assert.equal(choose({...base,interventionsLast20Minutes:2,silenceMs:20*60*1000}),'none','twenty minutes of silence is valid; LIA must not fill it');
});

test('V0.200 table humor and anecdotes require real safe context',()=>{
  const allowed={id:'h1',text:'running gag',basedOnRealEvent:true,sensitivity:'ordinary',householdSafe:true,targetReactedPositivelyBefore:true,attacksBodyWeightHealth:false};
  assert.equal(liaSocial.liaTableHumorAllowed(allowed),true);
  assert.equal(liaSocial.liaTableHumorAllowed({...allowed,basedOnRealEvent:false}),false,'LIA must not invent the premise of a family joke');
  assert.equal(liaSocial.liaTableHumorAllowed({...allowed,attacksBodyWeightHealth:true}),false,'body weight and health stay outside table humor');
  assert.equal(liaSocial.liaTableAnecdoteAllowed({hasSpecificRealEvent:true,hasConcreteDetail:true,inventedOrInferred:false,sensitivity:'ordinary',householdSafe:true}),true);
  assert.equal(liaSocial.liaTableAnecdoteAllowed({hasSpecificRealEvent:true,hasConcreteDetail:false,inventedOrInferred:false,sensitivity:'ordinary',householdSafe:true}),false,'a vague anecdote without a real concrete detail must not be used');
});


test('V0.201 LIA re-engagement uses a real due thread and slows down after ignored nudges',()=>{
  const loop={id:'l1',householdId:null,kind:'follow_up',topic:'shoes',subjectLabel:null,summary:'chaussures',appPrompt:"J’ai repensé à tes chaussures…",sensitivity:'ordinary',action:'search',dueAtIso:'2026-09-17T08:00:00.000Z',expiresAtIso:null,notificationPreview:"J’ai repensé à tes chaussures… j’ai une idée 👀",notificationPreviewSafe:true,status:'open',surfaceCount:0,lastSurfacedAtIso:null,createdAtIso:'2026-09-16T08:00:00.000Z',updatedAtIso:'2026-09-16T08:00:00.000Z'};
  const decide=liaOpenLoops.liaOpenLoopReengagement;
  assert.equal(decide({loop,now:new Date('2026-09-17T12:00:00.000Z'),quiet:false,appForeground:false,ignoredReengagements:0,lastReengagementAtIso:null}).bodyMode,'contextual');
  assert.equal(decide({loop,now:new Date('2026-09-17T12:00:00.000Z'),quiet:false,appForeground:false,ignoredReengagements:2,lastReengagementAtIso:null}).channel,'none');
  assert.equal(decide({loop,now:new Date('2026-09-17T12:00:00.000Z'),quiet:true,appForeground:false,ignoredReengagements:0,lastReengagementAtIso:null}).channel,'none');
});

test('V0.201 private re-engagement never leaks the thread on the lock screen',()=>{
  const loop={id:'l2',householdId:null,kind:'follow_up',topic:'doctor',subjectLabel:null,summary:'private',appPrompt:'private detail',sensitivity:'sensitive',action:'check_in',dueAtIso:'2026-09-17T08:00:00.000Z',expiresAtIso:null,notificationPreview:'secret detail',notificationPreviewSafe:false,status:'open',surfaceCount:0,lastSurfacedAtIso:null,createdAtIso:'2026-09-16T08:00:00.000Z',updatedAtIso:'2026-09-16T08:00:00.000Z'};
  const decision=liaOpenLoops.liaOpenLoopReengagement({loop,now:new Date('2026-09-17T12:00:00.000Z'),quiet:false,appForeground:false,ignoredReengagements:0,lastReengagementAtIso:null});
  assert.equal(decision.bodyMode,'generic_private');
  assert.equal(liaOpenLoops.liaOpenLoopReengagementBody({decision,loop,genericPrivatePreview:"J’ai trouvé quelque chose pour toi 👀"}),"J’ai trouvé quelque chose pour toi 👀");
  const foreground=liaOpenLoops.liaOpenLoopReengagement({loop,now:new Date('2026-09-17T12:00:00.000Z'),quiet:false,appForeground:true,ignoredReengagements:0,lastReengagementAtIso:null});
  assert.equal(foreground.channel,'none','a sensitive thread must not pop onto a potentially shared main app surface');
});


test('V0.202 LIA day brief focuses on the next useful open thread instead of dumping a to-do list',()=>{
  const threads=[
    {id:'later',eventKind:'errand',label:'courses',timeIso:'2026-09-17T19:00:00.000Z',recurring:false,sensitivity:'ordinary',completed:false,followUpDue:false,needsCurrentExternalData:false},
    {id:'sarah',eventKind:'child_pickup',label:'récupérer Sarah',timeIso:'2026-09-17T15:30:00.000Z',recurring:true,sensitivity:'ordinary',completed:false,followUpDue:false,needsCurrentExternalData:false},
    {id:'done',eventKind:'work',label:'appel',timeIso:'2026-09-17T14:00:00.000Z',recurring:false,sensitivity:'ordinary',completed:true,followUpDue:false,needsCurrentExternalData:false},
  ];
  const brief=liaRightHand.liaBuildDayBrief({threads,nowIso:'2026-09-17T15:00:00.000Z'});
  assert.equal(brief.nextThread?.id,'sarah');
  assert.equal(brief.offer?.kind,'set_alarm');
  assert.equal(brief.remainingOpenCount,2);
});

test('V0.202 day brief asks for a missing time and keeps private threads off the family table',()=>{
  const thread={id:'doctor',eventKind:'appointment',label:'médecin',timeIso:null,recurring:false,sensitivity:'sensitive',completed:false,followUpDue:false,needsCurrentExternalData:false};
  const brief=liaRightHand.liaBuildDayBrief({threads:[thread],nowIso:'2026-09-17T15:00:00.000Z'});
  assert.equal(brief.askForMissingTime,true);
  assert.equal(brief.offer?.kind,'prepare_notes');
  assert.equal(liaRightHand.liaDayBriefMaySurface({brief,quiet:false,humanSpeechActive:false,mode:'table'}),false);
  assert.equal(liaRightHand.liaDayBriefMaySurface({brief,quiet:false,humanSpeechActive:false,mode:'idle'}),true);
});


test('V0.203 LIA closes daily loops with one adaptive follow-up instead of nagging',()=>{
  const decide=liaRightHand.liaFollowUpDecision;
  assert.deepEqual(decide({eventFinished:true,outcome:'unknown',followUpAlreadyAsked:false,userDismissed:false,sensitivity:'ordinary'}),{askHowItWent:true,proposeMemo:false,proposeNextStep:false,closeThread:false});
  assert.deepEqual(decide({eventFinished:true,outcome:'went_well',followUpAlreadyAsked:true,userDismissed:false,sensitivity:'ordinary'}),{askHowItWent:false,proposeMemo:false,proposeNextStep:false,closeThread:true});
  const action=decide({eventFinished:true,outcome:'needs_action',followUpAlreadyAsked:true,userDismissed:false,sensitivity:'sensitive'});
  assert.equal(action.proposeMemo,true);assert.equal(action.proposeNextStep,true);assert.equal(action.closeThread,false);
  assert.equal(decide({eventFinished:true,outcome:'unknown',followUpAlreadyAsked:false,userDismissed:true,sensitivity:'ordinary'}).closeThread,true);
});


test('V0.204 LIA voice turn-taking always yields to a human and cancels queued speech',()=>{
  const decide=liaSocial.liaVoiceTurnDecision;
  assert.equal(decide({sessionExplicitlyActive:true,microphoneConsent:true,mode:'table',directAddressed:false,humanSpeechActive:true,liaSpeaking:false,queuedSpeech:true,silenceMs:0,sensitiveMoment:false}),'cancel_queued');
  assert.equal(decide({sessionExplicitlyActive:true,microphoneConsent:true,mode:'cooking',directAddressed:true,humanSpeechActive:false,liaSpeaking:false,queuedSpeech:false,silenceMs:300,sensitiveMoment:false}),'answer');
  assert.equal(liaSocial.liaVoiceMustStopImmediately({humanSpeechStarted:true,sessionEnded:false,microphoneConsentRevoked:false}),true);
});

test('V0.204 table voice waits for a real pause while cooking can answer faster',()=>{
  const base={sessionExplicitlyActive:true,microphoneConsent:true,directAddressed:false,humanSpeechActive:false,liaSpeaking:false,queuedSpeech:false,sensitiveMoment:false};
  assert.equal(liaSocial.liaVoiceTurnDecision({...base,mode:'table',silenceMs:2500}),'wait');
  assert.equal(liaSocial.liaVoiceTurnDecision({...base,mode:'table',silenceMs:3100}),'answer');
  assert.equal(liaSocial.liaVoiceTurnDecision({...base,mode:'cooking',silenceMs:1000}),'answer');
  assert.equal(liaSocial.liaVoiceTurnDecision({...base,mode:'cooking',silenceMs:1000,microphoneConsent:false}),'listen');
});


test('V0.205 cooking voice recognizes core hands-free intents without inventing actions',()=>{
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('LIA, lance 9 minutes'),'start_timer');
  assert.equal(liaCookingCompanion.liaHandsFreeTimerSeconds('LIA, lance 9 minutes'),540);
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent("LIA, c’est quoi la prochaine étape ?"),'next_step');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('LIA répète'),'repeat_step');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('mets-moi de la musique italienne'),'music');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('arrête de parler'),'stop_voice');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('bonjour LIA'),'unknown');
});
test('V0.205 hands-free timer accepts only explicit durations',()=>{
  assert.equal(liaCookingCompanion.liaHandsFreeTimerSeconds('lance un timer'),null);
  assert.equal(liaCookingCompanion.liaHandsFreeTimerSeconds('7 minutes 30 secondes'),450);
});


test('V0.206 hands-free cooking converts speech into bounded executable actions',()=>{
  const timer=liaCookingCompanion.liaHandsFreeCookingAction('LIA, lance 8 minutes');
  assert.equal(timer.kind,'start_timer');assert.equal(timer.timerSeconds,480);assert.equal(timer.safeToExecuteLocally,true);
  const missing=liaCookingCompanion.liaHandsFreeCookingAction('LIA lance le minuteur');
  assert.equal(missing.kind,'start_timer');assert.equal(missing.timerSeconds,null);assert.equal(missing.safeToExecuteLocally,false);
  const music=liaCookingCompanion.liaHandsFreeCookingAction('LIA mets de la musique italienne');
  assert.equal(music.needsStreamingIntegration,true);assert.equal(music.safeToExecuteLocally,false);
  assert.equal(liaCookingCompanion.liaHandsFreeCookingAction('prochaine étape').safeToExecuteLocally,true);
});


test('V0.207 hands-free cooking actions update only bounded local runtime state',()=>{
  const state={stepIndex:1,stepCount:3,timerEndsAtMs:null,voiceShouldStop:false};
  const timer=liaCookingCompanion.liaHandsFreeCookingAction('lance 2 minutes');
  assert.equal(liaCookingCompanion.applyLiaHandsFreeCookingAction({state,action:timer,nowMs:1000}).timerEndsAtMs,121000);
  const next=liaCookingCompanion.liaHandsFreeCookingAction('prochaine étape');
  assert.equal(liaCookingCompanion.applyLiaHandsFreeCookingAction({state:{...state,stepIndex:2},action:next,nowMs:1000}).stepIndex,2);
  const music=liaCookingCompanion.liaHandsFreeCookingAction('mets de la musique');
  assert.deepEqual(liaCookingCompanion.applyLiaHandsFreeCookingAction({state,action:music,nowMs:1000}),state);
});


test('V0.208 cooking voice can answer repeat and timer-remaining requests from real runtime state',()=>{
  const repeat=liaCookingCompanion.liaCookingVoiceReply({action:liaCookingCompanion.liaHandsFreeCookingAction('répète'),currentStep:'Ajoute les tomates.',stepIndex:1,stepCount:3,timerRemainingSeconds:75});
  assert.equal(repeat.kind,'repeat_step');assert.equal(repeat.textValue,'Ajoute les tomates.');
  const remaining=liaCookingCompanion.liaCookingVoiceReply({action:liaCookingCompanion.liaHandsFreeCookingAction('combien de temps il reste ?'),currentStep:'',stepIndex:1,stepCount:3,timerRemainingSeconds:75});
  assert.equal(remaining.kind,'timer_remaining');assert.equal(remaining.textValue,'01:15');
  const none=liaCookingCompanion.liaCookingVoiceReply({action:liaCookingCompanion.liaHandsFreeCookingAction('combien de temps il reste ?'),currentStep:'',stepIndex:1,stepCount:3,timerRemainingSeconds:null});
  assert.equal(none.kind,'timer_not_running');
});


test('V0.209 timer completion never speaks over a person',()=>{
  const decide=liaCookingCompanion.liaCookingTimerCompletionDecision;
  assert.equal(decide({timerWasRunning:true,remainingSeconds:0,humanSpeechActive:false,liaSpeaking:false,sessionActive:true}),'announce');
  assert.equal(decide({timerWasRunning:true,remainingSeconds:0,humanSpeechActive:true,liaSpeaking:false,sessionActive:true}),'silent');
  assert.equal(decide({timerWasRunning:true,remainingSeconds:10,humanSpeechActive:false,liaSpeaking:false,sessionActive:true}),'silent');
  assert.equal(decide({timerWasRunning:true,remainingSeconds:0,humanSpeechActive:false,liaSpeaking:false,sessionActive:false}),'silent');
});


test('V0.210 persisted open-loop service wires the V0.201 re-engagement policy instead of parallel notification logic',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaOpenLoops.ts'),'utf8');
  assert.ok(source.includes('nextLiaOpenLoopReengagement'));
  assert.ok(source.includes('liaOpenLoopReengagement({'));
  assert.ok(source.includes('liaOpenLoopReengagementBody({'));
  assert.ok(source.includes("return{loop:null,channel:'none',body:null,reason:'no_thread'}"));
});


test('V0.211 notification runtime delivers only the re-engagement channel already decided by policy',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/notifications.ts'),'utf8');
  assert.ok(source.includes('deliverLiaOpenLoopReengagement'));
  assert.ok(source.includes("if(input.decision.channel==='none'||!input.body)return'none'"));
  assert.ok(source.includes("if(input.decision.channel==='in_app')return'in-app'"));
  assert.ok(source.includes("source:'lia-open-loop-reengagement'"));
  assert.ok(source.includes("if(!notificationPermissionAllowsScheduling(permission))return'permission-denied'"));
});


test('V0.212 re-engagement history resets after an open and counts ignored dismissals',()=>{
  const update=liaOpenLoops.liaReengagementHistoryAfterEvent;
  const base={lastSentAtIso:null,ignoredCount:0};
  const sent=update({history:base,event:'sent',now:new Date('2026-09-17T10:00:00Z')});
  assert.equal(sent.lastSentAtIso,'2026-09-17T10:00:00.000Z');assert.equal(sent.ignoredCount,0);
  const ignored=update({history:sent,event:'dismissed',now:new Date('2026-09-17T11:00:00Z')});
  assert.equal(ignored.ignoredCount,1);
  const opened=update({history:ignored,event:'opened',now:new Date('2026-09-17T12:00:00Z')});
  assert.equal(opened.ignoredCount,0);assert.equal(opened.lastSentAtIso,sent.lastSentAtIso);
});


test('V0.213 open-loop service persists the re-engagement history through existing storage',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaOpenLoops.ts'),'utf8');
  assert.ok(source.includes("LIA_REENGAGEMENT_HISTORY_KEY='@notre-table/lia-reengagement-history-v1'"));
  assert.ok(source.includes('getLiaReengagementHistory'));
  assert.ok(source.includes('noteLiaReengagementEvent'));
  assert.ok(source.includes('liaReengagementHistoryAfterEvent({history,event,now,openLoopId})'));
});


test('V0.214 re-engagement selector automatically consumes persisted history when caller omits it',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaOpenLoops.ts'),'utf8');
  assert.ok(source.includes('const history=await getLiaReengagementHistory()'));
  assert.ok(source.includes('input.ignoredReengagements??history.ignoredCount'));
  assert.ok(source.includes('input.lastReengagementAtIso===undefined?history.lastSentAtIso'));
  assert.ok(source.includes('ignoredReengagements,lastReengagementAtIso,'));
});


test('V0.215 app lifecycle records an opened re-engagement notification',()=>{
  const source=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
  assert.ok(source.includes("data?.source==='lia-open-loop-reengagement'"));
  assert.ok(source.includes("noteLiaReengagementEvent('opened')"));
  assert.ok(source.includes('clearLastNotificationResponseAsync'));
});


test('V0.216 re-engagement runtime records sent only after a real notification schedule succeeds',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/notifications.ts'),'utf8');
  const schedule=source.indexOf("content:{title:input.title,body:input.body,data:{source:'lia-open-loop-reengagement'");
  const sent=source.indexOf("await noteLiaReengagementEvent('sent',new Date(),input.loop.id)");
  assert.ok(schedule>=0&&sent>schedule);
  assert.ok(source.indexOf("if(!notificationPermissionAllowsScheduling(permission))return'permission-denied'")<sent);
});


test('V0.217 orchestration uses real quiet state, persisted selector and delivery without duplicate policy',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaReengagementRuntime.ts'),'utf8');
  assert.ok(source.includes('getLiaQuietState'));
  assert.ok(source.includes('nextLiaOpenLoopReengagement'));
  assert.ok(source.includes('deliverLiaOpenLoopReengagement'));
  assert.ok(source.includes("delivery==='scheduled'||delivery==='in-app'"));
  assert.ok(source.includes('noteLiaOpenLoopSurfaced'));
  assert.ok(!source.includes('ignoredReengagements:'));
});


test('V0.218 app lifecycle invokes the re-engagement runtime on real foreground activation',()=>{
  const source=fs.readFileSync(path.join(root,'src/screens/MainScreen.tsx'),'utf8');
  assert.ok(source.includes("AppState.addEventListener('change'"));
  assert.ok(source.includes("if(state==='active')void refresh()"));
  assert.ok(source.includes('runLiaOpenLoopReengagement({'));
  assert.ok(source.includes('appForeground:true'));
});


test('V0.219 in-app re-engagement has one lifecycle owner and renders the runtime body through LIA',()=>{
  const main=fs.readFileSync(path.join(root,'src/screens/MainScreen.tsx'),'utf8');
  const app=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
  const runtime=fs.readFileSync(path.join(root,'src/services/liaReengagementRuntime.ts'),'utf8');
  assert.ok(main.includes("reengagement?.delivery==='in-app'&&reengagement.body"));
  assert.ok(main.includes('setLiaReturnGreeting(reengagement.body)'));
  assert.ok(runtime.includes("body:delivery==='in-app'?decision.body:null"));
  assert.ok(!app.includes('runForegroundReengagement'));
  assert.ok(!main.includes('nextDueLiaOpenLoopForSharedSurface'));
});


test('V0.220 re-engagement history tracks one pending sent thread and clears it on open',()=>{
  const lib=fs.readFileSync(path.join(root,'src/lib/liaOpenLoops.ts'),'utf8');
  const service=fs.readFileSync(path.join(root,'src/services/liaOpenLoops.ts'),'utf8');
  const notifications=fs.readFileSync(path.join(root,'src/services/notifications.ts'),'utf8');
  assert.ok(lib.includes('pendingOpenLoopId?:string|null'));
  assert.ok(lib.includes('pendingSentAtIso?:string|null'));
  assert.ok(lib.includes('pendingOpenLoopId:null,pendingSentAtIso:null'));
  assert.ok(service.includes('value.pendingOpenLoopId===undefined'));
  assert.ok(notifications.includes("noteLiaReengagementEvent('sent',new Date(),input.loop.id)"));
});


test('V0.221 unopened pending re-engagement becomes ignored once after a bounded timeout',()=>{
  const lib=fs.readFileSync(path.join(root,'src/lib/liaOpenLoops.ts'),'utf8');
  const service=fs.readFileSync(path.join(root,'src/services/liaOpenLoops.ts'),'utf8');
  assert.ok(lib.includes('liaReengagementHistoryAfterPendingTimeout'));
  assert.ok(lib.includes('timeoutMs??24*60*60*1000'));
  assert.ok(lib.includes('pendingOpenLoopId:null'));
  assert.ok(service.includes('reconcileLiaPendingReengagement(input.now)'));
  assert.ok(service.includes('if(next!==history)await writeStoredJson'));
});


test('V0.222 CookingModeScreen connects hands-free actions to its real step and timer state',()=>{
  const source=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert.ok(source.includes('const handleHandsFreeCommand=(text:string)=>'));
  assert.ok(source.includes('runLiaCookingCommand({'));
  assert.ok(source.includes('currentStep:current'));
  assert.ok(source.includes('state:{stepIndex:index'));
  assert.ok(source.includes('setIndex(result.state.stepIndex)'));
  assert.ok(source.includes('setTimerEndsAt(result.state.timerEndsAtMs)'));
  assert.ok(!source.includes('SpeechRecognition'));
});


test('V0.223 cooking command controller is reusable by UI and a future speech adapter',()=>{
  const service=fs.readFileSync(path.join(root,'src/services/liaCookingRuntime.ts'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert.ok(service.includes('export function runLiaCookingCommand'));
  assert.ok(service.includes('liaHandsFreeCookingAction(input.text)'));
  assert.ok(service.includes('liaCookingVoiceReply({'));
  assert.ok(service.includes('applyLiaHandsFreeCookingAction({state:input.state'));
  assert.ok(screen.includes('runLiaCookingCommand({'));
});


test('V0.224 cooking voice UI exists only behind a real available speech adapter',()=>{
  const runtime=fs.readFileSync(path.join(root,'src/services/liaCookingRuntime.ts'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert.ok(runtime.includes('export type LiaCookingSpeechAdapter'));
  assert.ok(runtime.includes('available:boolean'));
  assert.ok(runtime.includes('createUnavailableCookingSpeechAdapter'));
  assert.ok(screen.includes('speechAdapter?.available?<Pressable'));
  assert.ok(screen.includes('speechAdapter.start(text=>{handleHandsFreeCommand(text);}'));
  assert.ok(screen.includes('speechAdapter.stop()'));
});


test('V0.225 LIA keeps the screen awake only while her surface or explicit listening is active',()=>{
  const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert.ok(source.includes("activateKeepAwakeAsync('notre-table-lia-active')"));
  assert.ok(source.includes("deactivateKeepAwake('notre-table-lia-active')"));
  assert.ok(source.includes('const keepAwake=enabled&&(open||listening)'));
  assert.ok(source.includes('},[enabled,open,listening]);'));
});


test('V0.226 ordinary backgrounding still releases active audio while V0.251 external assistant handoffs are preserved',()=>{
  const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert.ok(source.includes("AppState.addEventListener('change',state=>"));
  assert.ok(source.includes("if(listening&&(liaExternalHandoffActive()||nativePhoneCallActive))return;"));
  assert.ok(source.includes('setListening(false);void stopLiaListening()'));
  assert.ok(source.includes('setVoiceSpeaking(false);void stopLiaVoice()'));
});


test('V0.227 LIA active surface closes when the app backgrounds so keep-awake cannot linger',()=>{
  const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert.ok(source.includes('if(open)setOpen(false);'));
  assert.ok(source.includes('},[open,listening,voiceSpeaking]);'));
  assert.ok(source.includes('const keepAwake=enabled&&(open||listening)'));
});


test('V0.228 LIA may naturally join a verified table topic without talking over the family',()=>{
  const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
  assert.ok(source.includes("export function liaTableTopicParticipationDecision"));
  assert.ok(source.includes("input.mode!=='table'"));
  assert.ok(source.includes('input.humanSpeechActive||input.liaSpeaking'));
  assert.ok(source.includes('!input.hasUsefulContribution||!input.contributionVerified'));
  assert.ok(source.includes('input.silenceMs<1800'));
  assert.ok(source.includes('input.msSinceLastTopicContribution<120_000'));
});


test('V0.228 LIA can offer practical help after a family member expresses a concrete wish',()=>{
  const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
  assert.ok(source.includes('export function liaTableOpportunityDecision'));
  assert.ok(source.includes('!input.familyHadResponseWindow'));
  assert.ok(source.includes('!input.concreteRequestDetected||!input.canOfferUsefulHelp'));
  assert.ok(source.includes("input.subjectAge<18&&input.requiresGuardianDecision"));
  assert.ok(source.includes("export function liaTableNextClarification"));
  assert.ok(source.includes("return'activity_type'"));
});


test('V0.228 LIA may offer a busy parent help with a safe family task while leaving the decision to the parent',()=>{
  const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
  assert.ok(source.includes('export function liaFamilyAssistHandoffDecision'));
  assert.ok(source.includes('!input.parentExpressedIntentToHelp'));
  assert.ok(source.includes('!input.parentExpressedTimeConstraint||!input.taskCanBeDelegatedSafely'));
  assert.ok(source.includes("return'offer_parent_assistance'"));
  assert.ok(source.includes('approval-gated'));
});




test('V0.228 family assistance can finish in Memos only after the parent accepts and memo consent is given',()=>{
  const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
  assert.ok(source.includes('export function liaFamilyHelpMemoDecision'));
  assert.ok(source.includes("if(!input.parentAcceptedLiaHelp)return'offer_research'"));
  assert.ok(source.includes("if(!input.researchCompleted)return'wait'"));
  assert.ok(source.includes("if(!input.memoConsent)return'offer_memo'"));
  assert.ok(source.includes("return'save_memo'"));
});


test('V0.228 LIA may move from practical help to light humor while the same safe table topic continues',()=>{
  const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
  assert.ok(source.includes('export function liaTopicHumorContinuationDecision'));
  assert.ok(source.includes("input.tone!=='warm'||!input.targetComfortKnown"));
  assert.ok(source.includes('input.sensitiveTopic||input.jokeTargetsVulnerability'));
  assert.ok(source.includes("return'light_humor'"));
});


test('V0.228 LIA can contribute brief everyday knowledge at table but clarifies ambiguous terms instead of inventing',()=>{
  const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
  assert.ok(source.includes('export function liaEverydayKnowledgeDecision'));
  assert.ok(source.includes('!input.familyHadResponseWindow'));
  assert.ok(source.includes("input.termAmbiguous||input.answerConfidence<.82"));
  assert.ok(source.includes("return'answer_briefly'"));
});


test('V0.229 LIA can answer an understood speaker turn without risking a wrong first name',()=>{
  const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
  assert.ok(source.includes('export function liaSpeakerAddressing'));
  assert.ok(source.includes("speakerIdentityConfidence>=.90?'named':'unnamed'"));
  assert.ok(source.includes('export function liaMayAnswerSpeakerTurn'));
  assert.ok(source.includes('naturalGapAvailable&&!input.humanSpeechActive'));
});


test('V0.229 LIA asks an adult once before switching to remembered tutoiement',()=>{
  const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
  assert.ok(source.includes("if(input.audience==='group')return'vous_collective'"));
  assert.ok(source.includes("tutoiementPreference==='accepted'"));
  assert.ok(source.includes("if(input.firstDirectExchange)return'ask_tutoiement'"));
});


test('V0.229 LIA keeps a topic thread attached to the speaker track even before identity is certain',()=>{
  const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
  assert.ok(source.includes('export type LiaConversationThread'));
  assert.ok(source.includes('x.speakerTrackId===input.speakerTrackId&&x.topicKey===input.topicKey'));
  assert.ok(source.includes('export function liaSpeakerIdentityConfidence'));
  assert.ok(source.includes("input.kinshipAddress!=='none'"));
});


test('V0.229 LIA respects table rhythm and does not force herself into rapid family exchanges',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaTableRhythmDecision'));
 assert.ok(source.includes("if(input.rapidBackAndForth)return'hold'"));
 assert.ok(source.includes('liaInterventionsLast10Minutes>=3'));
 assert.ok(source.includes("input.directlyAskedLia)return'speak'"));
});


test('V0.229 an everyday need heard at table becomes an appropriate next step rather than an automatic action',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaHeardNeedNextStep'));
 assert.ok(source.includes("requiresAdultApproval&&!input.adultApproved"));
 assert.ok(source.includes("requiresConsent&&!input.consentGiven"));
 assert.ok(source.includes("return'leave_in_conversation'"));
});


test('V0.229 Papa and Maman are conversation clues, not automatic speaker identity',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaKinshipAddressee'));
 assert.ok(source.includes("return'father'"));
 assert.ok(source.includes('export function liaKinshipClueMayNarrowSpeaker'));
 assert.ok(source.includes("candidateRelationshipToAddressee==='child'"));
});


test('V0.229 crossed family conversations do not get merged only because the same person speaks',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaThreadAttachmentDecision'));
 assert.ok(source.includes("if(!input.sameSpeakerTrack)return'new_thread'"));
 assert.ok(source.includes('semanticSimilarity>=.74'));
});


test('V0.229 LIA does not expose a private remembered detail just because the topic returns at table',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMayRecallAtTable'));
 assert.ok(source.includes("if(input.sensitive)return false"));
 assert.ok(source.includes("visibility==='household_shared'"));
 assert.ok(source.includes('return input.explicitShareConsent'));
});


test('V0.229 LIA keeps spontaneous table answers short unless the family wants more',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaTableReplyDepth'));
 assert.ok(source.includes("return'one_liner'"));
 assert.ok(source.includes("familyRequestsDetails||input.uncertaintyNeedsExplanation"));
});


test('V0.229 LIA withdraws from spontaneous table participation when a conversation turns sensitive',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaTableSensitivityShift'));
 assert.ok(source.includes("financialOrVulnerabilityTopic)return'withdraw'"));
 assert.ok(source.includes("speakerLowersVoiceOrRequestsPrivacy)return'withdraw'"));
});


test('V0.229 LIA gives the family first chance to answer an open table question',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaOpenQuestionDecision'));
 assert.ok(source.includes("if(input.familyResponseStarted)return'wait_for_family'"));
 assert.ok(source.includes("if(input.waitMs<2200)return'wait_for_family'"));
});


test('V0.229 LIA yields the floor after a short contribution instead of monopolizing the table',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaFollowupTurnDecision'));
 assert.ok(source.includes("liaConsecutiveTurns>=2"));
 assert.ok(source.includes("clarificationNecessary?'one_followup':'yield_to_family'"));
});


test('V0.229 a table research task proceeds only after acceptance and any required adult approval',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export type LiaAcceptedTableTask'));
 assert.ok(source.includes('export function liaAcceptedTableTaskMayProceed'));
 assert.ok(source.includes("!input.task.accepted||input.task.status!=='pending'"));
 assert.ok(source.includes("requiresAdultApproval&&!input.adultApproved"));
});


test('V0.229 LIA returns an accepted task only when the result is ready verified and the moment is appropriate',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaTaskReturnDecision'));
 assert.ok(source.includes("taskStatus!=='ready'||!input.appActive||!input.resultVerified"));
 assert.ok(source.includes("familyConversationBusy||input.sensitiveMoment"));
 assert.ok(source.includes("return'return_result'"));
});


test('V0.229 a useful research result is offered to Memos but saved only with explicit consent',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaResultMemoDecision'));
 assert.ok(source.includes("explicitMemoConsent?'save_memo':'offer_memo'"));
 assert.ok(source.includes("userDeclinedMemo||!input.usefulBeyondConversation"));
});


test('V0.229 LIA drops humor immediately when the joke does not land',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaHumorAftermath'));
 assert.ok(source.includes("awkwardSilence||input.targetPushesBack||input.repeatedJokeOnSamePerson"));
 assert.ok(source.includes("laughterOrWarmResponse?'continue_lightly':'drop_humor'"));
});


test('V0.229 LIA respects stay-out requests for a conversation thread until explicitly reinvited',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaThreadParticipationPermission'));
 assert.ok(source.includes("if(input.explicitReinvite)return'allowed'"));
 assert.ok(source.includes("explicitStayOutRequest||input.previouslyExcluded"));
});


test('V0.229 LIA rechecks gracefully when the family corrects or challenges an answer',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaCorrectionDecision'));
 assert.ok(source.includes("authoritativeFamilyContext)return'acknowledge_and_recheck'"));
 assert.ok(source.includes("externalFactConfidence<.95?'acknowledge_and_recheck':'keep_answer'"));
});


test('V0.229 ordinary table threads expire while accepted unfinished tasks remain open',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaThreadLifecycle'));
 assert.ok(source.includes("if(input.taskStillOpen)return'keep_open'"));
 assert.ok(source.includes("msSinceLastRelevantTurn>=20*60_000?'close':'keep_open'"));
});


test('V0.229 an unknown or guest voice never inherits a household member memory by guesswork',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaSpeakerMembership'));
 assert.ok(source.includes("if(input.introducedAsGuest)return'guest'"));
 assert.ok(source.includes("membership==='household'&&input.identityConfidence>=.90"));
});


test('V0.229 overlapping voices are not merged into a fabricated family utterance',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaOverlappingSpeechDecision'));
 assert.ok(source.includes("simultaneousSpeakers<=1)return'process_turn'"));
 assert.ok(source.includes("return'wait'"));
});


test('V0.229 table presence can change without resetting the other tracked speakers',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaApplyTablePresenceEvent'));
 assert.ok(source.includes("filter(x=>x.speakerTrackId!==input.speakerTrackId)"));
 assert.ok(source.includes("present:input.event==='join'"));
});


test('V0.229 a direct LIA question gets priority but uncertainty still triggers clarification',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaDirectCallDecision'));
 assert.ok(source.includes("ambiguousRequest||input.answerConfidence<.80"));
 assert.ok(source.includes("return'answer'"));
});


test('V0.229 pronouns like that or it reuse only a sufficiently recent matching speaker context',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaContextCarryDecision'));
 assert.ok(source.includes("msSinceRelevantTurn>5*60_000"));
 assert.ok(source.includes("semanticContinuity>=.78?'use_recent_context':'ask_what_they_mean'"));
});


test('V0.229 LIA does not steal a reply that was addressed to another family member',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaTurnAddressee'));
 assert.ok(source.includes("if(input.memberNamed)return'member'"));
 assert.ok(source.includes("input.liaAskedQuestion&&input.addressee==='lia'"));
});


test('V0.229 stable relationship preferences can persist while a temporary mood stays session-only',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaRelationshipSignalPersistence'));
 assert.ok(source.includes("signal==='tutoiement'&&input.explicitPreference"));
 assert.ok(source.includes("return'session_only'"));
});


test('V0.229 future family events may trigger an offer but never an unsolicited reminder action',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaFutureEventDecision'));
 assert.ok(source.includes("explicitNeedToRemember)return'offer_reminder'"));
 assert.ok(source.includes("planningProblemDetected)return'offer_planning_help'"));
});


test('V0.229 a genuinely shared discussion becomes a family thread without erasing individual threads',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaTopicScope'));
 assert.ok(source.includes("explicitlyCollective||input.sharedDecisionDetected"));
 assert.ok(source.includes("distinctMembersContributed>=3?'family':'individual'"));
});


test('V0.229 short replies attach to the right open question instead of the last arbitrary sentence',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaShortReplyAttachment'));
 assert.ok(source.includes("addressedToLia&&input.liaQuestionOpen"));
 assert.ok(source.includes("return'unclear'"));
});


test('V0.229 an ignored LIA offer quietly disappears instead of being repeated at table',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaIgnoredOfferDecision'));
 assert.ok(source.includes("familyContinuedOtherTopic||input.msSinceOffer>=45_000"));
 assert.ok(source.includes("return'drop_offer'"));
});


test('V0.229 LIA can answer playful remarks socially without requiring an information request',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaSocialReplyDecision'));
 assert.ok(source.includes("!input.playfulTone||!input.safeTopic||input.liaRecentlyOveractive"));
 assert.ok(source.includes("return'reply_lightly'"));
});


test('V0.229 LIA understands meal attendance replies and can surface the result conversationally',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMealMissingReply'));
 assert.ok(source.includes('export function liaMealMessageOffer'));
 assert.ok(source.includes('export function liaMealReplyAnnouncement'));
 assert.ok(source.includes("attendance==='yes'?'coming':'not_coming'"));
});


test('V0.229 LIA sends a meal check only after organizer approval and may announce the reply during an active kitchen conversation',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMealMessageMaySend'));
 assert.ok(source.includes('organizerApproved&&input.memberHasMessagingPhone&&input.messageAllowedForMemberAge'));
 assert.ok(source.includes('export function liaMealReplySurface'));
 assert.ok(source.includes("liaConversationActive&&input.appForeground)return'voice'"));
});


test('V0.229 LIA can build a family meal poll conversationally and send only the organizer-approved final draft',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMealPollNextQuestion'));
 assert.ok(source.includes("return'recipients'"));
 assert.ok(source.includes("return'meal_options'"));
 assert.ok(source.includes('export function liaMealPollMaySend'));
 assert.ok(source.includes('organizerApprovedFinalDraft&&input.eligibleRecipientCount>0'));
});


test('V0.229 LIA aggregates meal replies so the organizer can hear the result without opening Messages',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaSummarizeMealPoll'));
 assert.ok(source.includes("attendance==='yes'"));
 assert.ok(source.includes("attendance==='no'"));
 assert.ok(source.includes("attendance==='unknown'"));
 assert.ok(source.includes('mealChoices:responses.filter'));
});


test('V0.229 a new meal reply may be announced as a small conversational update without opening the screen',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMealReplyDeltaDecision'));
 assert.ok(source.includes("!input.newlyReceived||!input.liaConversationActive||!input.organizerIsCurrentSpeakerPartner"));
 assert.ok(source.includes("return'announce_delta'"));
});


test('V0.229 LIA counts meal votes and may suggest a combined order without deciding for the family',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaCountMealChoices'));
 assert.ok(source.includes("attendance!=='yes'||!r.mealChoice"));
 assert.ok(source.includes('export function liaMealResolutionSuggestion'));
 assert.ok(source.includes("oneProviderCanCoverTopChoices)return'combine_order'"));
 assert.ok(source.includes("return'ask_organizer'"));
});


test('V0.229 playful majority framing never overrides the organizer or a dietary constraint',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMealDecisionOwner'));
 assert.ok(source.includes("familyRuleExplicitlySet==='majority'"));
 assert.ok(source.includes('export function liaMayUsePlayfulMealFraming'));
 assert.ok(source.includes('!input.sensitiveDietaryConstraint'));
});


test('V0.229 meal compromise can flow into Commander but a combined restaurant claim requires verification',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMealOrderNextStep'));
 assert.ok(source.includes("organizerDecision==='order'?'search_commander':'prepare_home_meal'"));
 assert.ok(source.includes('export function liaMayClaimProviderCanCombine'));
 assert.ok(source.includes('providerVerified&&input.deliversToActiveAddress&&input.allRequestedCategoriesVerified'));
});


test('V0.229 cooking path checks pantry feasibility and never silently substitutes a family meal choice',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaHomeMealFeasibility'));
 assert.ok(source.includes("missingIngredientCount===0?'can_make':'missing_items'"));
 assert.ok(source.includes('export function liaMaySubstituteMealChoice'));
 assert.ok(source.includes('return input.substituteAccepted'));
});


test('V0.229 resolved meal polls stop nagging pending family members unless the organizer explicitly asks',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMealPollLifecycle'));
 assert.ok(source.includes("if(input.decisionMade)return'resolved'"));
 assert.ok(source.includes('export function liaMayPromptPendingMealReplies'));
 assert.ok(source.includes("input.lifecycle==='open'&&input.pendingCount>0&&input.organizerAskedToFollowUp"));
});


test('V0.229 a late meal reply can reopen an unconfirmed choice without undoing an already confirmed order',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaLateMealReplyImpact'));
 assert.ok(source.includes("replyIntroducesNewMealChoice&&!input.orderAlreadyConfirmed"));
 assert.ok(source.includes("pollLifecycle==='closed'&&input.orderAlreadyConfirmed"));
});


test('V0.229 LIA turns the resolved family choice into a concrete cook order shop or wait brief',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMealExecutionBrief'));
 assert.ok(source.includes("input.missingItems.length>0?'shop':'cook'"));
 assert.ok(source.includes("input.orderingChosen?'order':'wait'"));
});


test('V0.229 LIA may decide a delegated meal only under an explicit existing family rule',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMayResolveDelegatedMealChoice'));
 assert.ok(source.includes('organizerExplicitlyDelegated'));
 assert.ok(source.includes("savedFamilyRule!=='none'"));
 assert.ok(source.includes('dietaryConstraintsSatisfied'));
});


test('V0.229 dietary and religious constraints are separated from ordinary meal preferences',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMealRequirementPriority'));
 assert.ok(source.includes("kind==='preference'?'preference':'hard_constraint'"));
 assert.ok(source.includes('export function liaMealOptionIsCompatible'));
 assert.ok(source.includes("r.confirmed&&r.kind!=='preference'"));
});


test('V0.229 attendance changes trigger a portion check but LIA does not silently alter the meal',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaPortionCheck'));
 assert.ok(source.includes("plannedPortions>=input.attendingCount?'enough':'recalculate'"));
 assert.ok(source.includes('recalculationProposed&&input.organizerApproved'));
});


test('V0.229 several incoming meal replies are bundled instead of repeatedly interrupting cooking conversation',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMealReplyDelivery'));
 assert.ok(source.includes("pendingNewReplies>=2)return'bundle_updates'"));
 assert.ok(source.includes("if(input.humanSpeechActive)return'hold'"));
});


test('V0.229 a family member changing their meal answer replaces the old answer instead of double counting',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaLatestMealReplies'));
 assert.ok(source.includes('latest.get(reply.memberId)'));
 assert.ok(source.includes('reply.receivedAt>=previous.receivedAt'));
});


test('V0.229 ambiguous free-text meal replies are clarified instead of being forced into the wrong choice',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaFreeMealReplyInterpretation'));
 assert.ok(source.includes("attendanceConfidence<.85"));
 assert.ok(source.includes("containsQualifier&&input.mealChoiceConfidence<.90"));
});


test('V0.229 personal meal instructions remain attached to the right member after the family summary',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMealPersonalInstructionsForMember'));
 assert.ok(source.includes('x.memberId===input.memberId&&x.confirmed'));
});


test('V0.229 one family reply may contain attendance choice and a personal instruction without losing any part',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export type LiaMealReplyParts'));
 assert.ok(source.includes('export function liaMealReplyPartsComplete'));
 assert.ok(source.includes('instructionDetected&&input.instructionConfidence<.90'));
});


test('V0.229 execution check catches a forgotten confirmed personal meal instruction',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMealExecutionHasAllPersonalInstructions'));
 assert.ok(source.includes('confirmedInstructions.every'));
 assert.ok(source.includes('included.has(x.memberId)'));
});


test('V0.229 no response is never silently converted into not coming',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaPendingAttendanceHandling'));
 assert.ok(source.includes("return'do_not_assume_absent'"));
});


test('V0.229 a familiar non-responder may be included as a practical buffer without being falsely marked confirmed',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaPendingMemberPracticalHandling'));
 assert.ok(source.includes("attendancePatternConfidence>=.90"));
 assert.ok(source.includes("return'include_as_buffer'"));
 assert.ok(source.includes('export function liaMayUsePlayfulPendingMemberRemark'));
});


test('V0.229 LIA states a low-risk practical plan instead of asking the organizer another unnecessary question',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaPendingMemberConversationMove'));
 assert.ok(source.includes("practicalHandling==='include_as_buffer'"));
 assert.ok(source.includes("return'state_practical_plan'"));
});


test('V0.229 a familiar non-responder can simply share the family meal when no special constraint is known',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaPendingMemberMealChoice'));
 assert.ok(source.includes("return'shared_family_meal'"));
 assert.ok(source.includes('!input.knownDietaryConstraint'));
 assert.ok(source.includes('!input.specialMealInstructionKnown'));
});


test('V0.229 LIA learns ordinary meal habits gradually instead of turning one evening into a permanent family rule',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMealHabitConfidence'));
 assert.ok(source.includes("matchingObservations>=4&&input.contradictingObservations===0"));
 assert.ok(source.includes('export function liaMayUseMealHabitWithoutQuestion'));
 assert.ok(source.includes("confidence==='established'&&input.lowConsequence&&!input.conflictsWithKnownConstraint"));
});


test('V0.229 LIA distinguishes what someone answered today from what she merely knows as a family habit',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 assert.ok(source.includes('export function liaMealKnowledgeBasis'));
 assert.ok(source.includes("if(input.repliedToday)return'today_reply'"));
 assert.ok(source.includes("if(input.establishedHabitAvailable)return'established_habit'"));
 assert.ok(source.includes("basis==='established_habit')return'state_as_habit'"));
});


test('V0.229 Papa et Maman is resolved as both parents before single-parent kinship matches',()=>{
 const source=fs.readFileSync(path.join(root,'src/lib/liaSocialPresence.ts'),'utf8');
 const both=source.indexOf("if(/^(papa et maman|maman et papa|les parents)");
 const father=source.indexOf("if(/^(papa|p'pa)");
 const mother=source.indexOf("if(/^(maman|m'man)");
 assert.ok(both>=0&&father>both&&mother>both);
});


test('V0.229 meal conversation orchestration combines replies counts resolution and delivery timing',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaMealConversation.ts'),'utf8');
 assert.ok(source.includes('export function buildLiaMealConversationSnapshot'));
 assert.ok(source.includes('liaSummarizeMealPoll(input.responses)'));
 assert.ok(source.includes('liaCountMealChoices(input.responses)'));
 assert.ok(source.includes('liaMealResolutionSuggestion'));
 assert.ok(source.includes('liaMealReplyDelivery'));
});


test('V0.229 meal orchestrator emits a usable conversational turn for voice or UI',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaMealConversation.ts'),'utf8');
 assert.ok(source.includes('export function buildLiaMealConversationTurn'));
 assert.ok(source.includes("kind:'reply_update'"));
 assert.ok(source.includes("kind:'decision_prompt'"));
 assert.ok(source.includes("kind:'execution_update'"));
 assert.ok(source.includes("shouldSpeak:false"));
});


test('V0.229 spoken meal turns resolve household names instead of exposing technical member ids',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaMealConversation.ts'),'utf8');
 assert.ok(source.includes('export function liaMealSpokenNames'));
 assert.ok(source.includes('.map(id=>input.memberNames[id])'));
 assert.ok(source.includes("turn.shouldSpeak&&turn.kind!=='none'"));
});


test('V0.229 spoken meal plan stays brief while carrying names counts pending replies and compromise',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaMealConversation.ts'),'utf8');
 assert.ok(source.includes('export function buildLiaMealSpeechPlan'));
 assert.ok(source.includes("offerCompromise:input.resolution==='combine_order'"));
 assert.ok(source.includes('mentionPending:input.pendingCount>0'));
 assert.ok(source.includes('keepBrief:true'));
});


test('V0.229 meal announcements are deduplicated when the meaningful family result has not changed',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaMealConversation.ts'),'utf8');
 assert.ok(source.includes('export function liaMealAnnouncementFingerprint'));
 assert.ok(source.includes('export function liaMealAnnouncementChanged'));
 assert.ok(source.includes('a.choiceSignature!==b.choiceSignature'));
});


test('V0.229 complete meal context moves to action without asking the organizer for information LIA already has',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaMealConversation.ts'),'utf8');
 assert.ok(source.includes('export function liaMealConversationCompleteness'));
 assert.ok(source.includes("return'waiting_replies'"));
 assert.ok(source.includes("return'needs_decision'"));
 assert.ok(source.includes("return'ready_to_act'"));
});


test('V0.229 LIA asks final confirmation only for a real external commitment, not every internal meal step',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaMealConversation.ts'),'utf8');
 assert.ok(source.includes('export function liaMealActionConfirmation'));
 assert.ok(source.includes("causesExternalCommitment)return'confirm_external_action'"));
 assert.ok(source.includes("return'proceed_internal'"));
});


test('V0.229 a late changed meal reply never silently rewrites an already confirmed external action',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaMealConversation.ts'),'utf8');
 assert.ok(source.includes('export function liaLateMealChangeAction'));
 assert.ok(source.includes("return'update_before_commitment'"));
 assert.ok(source.includes("return'offer_add_on'"));
 assert.ok(source.includes("return'inform_only'"));
});


test('V0.229 low consequence established family habits do not trigger another unnecessary organizer question',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaMealConversation.ts'),'utf8');
 assert.ok(source.includes('export function liaShouldAskOrganizer'));
 assert.ok(source.includes("externalCommitment||input.consequence==='high'"));
 assert.ok(source.includes("return input.reversible?'act_without_question':'state_plan'"));
});


test('V0.230 table speech is exposed only through a real available adapter',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableSpeechAdapter.ts'),'utf8');
 assert.ok(source.includes('export interface LiaTableSpeechAdapter'));
 assert.ok(source.includes('speakerTrackId:string'));
 assert.ok(source.includes('memberId:string|null'));
 assert.ok(source.includes('return adapter?.isAvailable()?adapter:null'));
 assert.ok(source.includes('export function liaTableSpeechAvailable'));
});


test('V0.230 table speech keeps understanding separate from uncertain speaker identity',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableSpeechAdapter.ts'),'utf8');
 assert.ok(source.includes('export function liaResolveTableSpeechTurn'));
 assert.ok(source.includes('memberId:string|null'));
 assert.ok(source.includes("mayUseMemberName:liaSpeakerIdentityPolicy({memberId,identityConfidence,overlappingSpeech:segment.overlappingSpeech,context:'table'}).mayUseName"));
 assert.ok(source.includes('text:segment.text.trim()'));
});


test('V0.230 table conversation session tracks several voices and expires inactive tracks',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableConversationSession.ts'),'utf8');
 assert.ok(source.includes('export function applyLiaTableSpeechSegment'));
 assert.ok(source.includes('recentTurns:[...input.session.recentTurns,turn].slice(-max)'));
 assert.ok(source.includes('export function pruneInactiveTableTracks'));
 assert.ok(source.includes('export function activeTableMemberIds'));
 assert.ok(source.includes('track.identityConfidence>=.9'));
});


test('V0.230 table conversation runtime starts only with a real adapter and feeds resolved turns into the session',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableConversationRuntime.ts'),'utf8');
 assert.ok(source.includes('const adapter=getLiaTableSpeechAdapter()'));
 assert.ok(source.includes('if(!adapter)return null'));
 assert.ok(source.includes('await adapter.startSession'));
 assert.ok(source.includes('identities.get(segment.speakerTrackId)??null'));
 assert.ok(source.includes('input.onTurn?.'));
 assert.ok(source.includes('await adapter.stopSession()'));
 assert.ok(source.includes('session=clearLiaTableConversationSession()'));
});


test('V0.230 resolved table speech is gated by natural participation rules before LIA speaks',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableParticipationRuntime.ts'),'utf8');
 assert.ok(source.includes('export function decideLiaTableParticipation'));
 assert.ok(source.includes('input.naturalGapMs<1800'));
 assert.ok(source.includes('input.interventionsLast20Min>=3'));
 assert.ok(source.includes("reason:'sensitive'"));
 assert.ok(source.includes("return{action:'speak'"));
});
test('V0.230 a direct call to LIA bypasses spontaneous rate limits but not sensitivity or overlapping speech',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableParticipationRuntime.ts'),'utf8');
 assert.ok(source.includes('export function decideDirectLiaTableReply'));
 assert.ok(source.includes('directlyAddressed:boolean'));
 assert.ok(source.includes("reason:'human_speaking'"));
});


test('V0.230 live table coordinator forwards only speech turns that pass LIA participation policy',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableLiveCoordinator.ts'),'utf8');
 assert.ok(source.includes('startLiaTableConversationRuntime'));
 assert.ok(source.includes('decideLiaTableParticipation'));
 assert.ok(source.includes("if(decision.action==='speak'){"));
});


test('V0.230 live coordinator prioritizes a direct call to LIA over spontaneous participation gating',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableLiveCoordinator.ts'),'utf8');
 assert.ok(source.includes('directCallForTurn?'));
 assert.ok(source.includes('decideDirectLiaTableReply'));
 assert.ok(source.includes("direct.directlyAddressed"));
});


test('V0.230 direct address detection requires LIA at the start and preserves the actual request',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaDirectAddress.ts'),'utf8');
 assert.ok(source.includes('export function detectLiaDirectAddress'));
 assert.ok(source.includes('detectLiaDirectAddress'));
 assert.ok(source.includes('addressed:cleanedText.length>0'));
});


test('V0.230 table intervention history derives spontaneous rate limits from actual LIA interventions',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableInterventionHistory.ts'),'utf8');
 assert.ok(source.includes('export function noteLiaTableIntervention'));
 assert.ok(source.includes('export function liaTableRhythmFromHistory'));
 assert.ok(source.includes("!x.direct"));
 assert.ok(source.includes('20*60*1000'));
});
test('V0.230 participation can consume intervention history instead of trusting UI supplied counters',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableParticipationRuntime.ts'),'utf8');
 assert.ok(source.includes('export function decideLiaTableParticipationWithHistory'));
 assert.ok(source.includes('liaTableRhythmFromHistory'));
 assert.ok(source.includes('...rhythm'));
});


test('V0.230 live coordinator records its own interventions and can attach them to the current topic',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableLiveCoordinator.ts'),'utf8');
 assert.ok(source.includes('noteLiaTableIntervention'));
 assert.ok(source.includes('topicKeyForTurn?'));
 assert.ok(source.includes('direct:direct.directlyAddressed'));
});
test('V0.230 short conversational replies can remain attached to the same fresh speaker topic',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableTopicTracker.ts'),'utf8');
 assert.ok(source.includes('export function updateLiaTableTopic'));
 assert.ok(source.includes('5*60*1000'));
 assert.ok(source.includes('shortContinuation&&sameSpeaker&&fresh'));
});


test('V0.230 a short reply from another speaker joins the family thread only when explicitly group-or-LIA addressed and very fresh',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableTopicTracker.ts'),'utf8');
 assert.ok(source.includes('export function mayAttachCrossSpeakerContinuation'));
 assert.ok(source.includes('30_000'));
 assert.ok(source.includes('input.addressedToGroupOrLia'));
});
test('V0.230 an open LIA question accepts a fresh reply but does not steal a reply from another identified family member',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaOpenTableQuestion.ts'),'utf8');
 assert.ok(source.includes('export function liaOpenTableQuestionMayAcceptReply'));
 assert.ok(source.includes('60_000'));
 assert.ok(source.includes('q.targetMemberId!==input.replyingMemberId'));
 assert.ok(source.includes('export function closeLiaOpenTableQuestion'));
});


test('V0.230 table dialogue consumes an open LIA question once and records which question was resolved',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableDialogueState.ts'),'utf8');
 assert.ok(source.includes('export function consumeLiaTableQuestionReply'));
 assert.ok(source.includes('liaOpenTableQuestionMayAcceptReply'));
 assert.ok(source.includes('lastResolvedQuestionId:closed.id'));
});
test('V0.230 stale open table questions expire instead of hijacking later yes-no replies',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableDialogueState.ts'),'utf8');
 assert.ok(source.includes('export function expireLiaTableQuestion'));
 assert.ok(source.includes('now-q.askedAt<=ttlMs'));
});


test('V0.230 after asking a question LIA leaves room for the family answer instead of filling the silence herself',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableSilencePolicy.ts'),'utf8');
 assert.ok(source.includes('export function liaTableSilenceDecision'));
 assert.ok(source.includes("return'wait_for_reply'"));
 assert.ok(source.includes("return'may_participate'"));
});


test('V0.230 table intent routing separates immediate answers research reminders actions silence and clarification',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableIntentRouter.ts'),'utf8');
 assert.ok(source.includes("'answer_now'|'research'|'reminder'|'prepare_action'|'listen_only'|'clarify'"));
 assert.ok(source.includes("input.sensitive)return{intent:'listen_only'"));
 assert.ok(source.includes("input.explicitResearchRequest"));
});
test('V0.230 understood external actions wait for approval instead of executing from speech alone',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableActionPlan.ts'),'utf8');
 assert.ok(source.includes("'await_confirmation'"));
 assert.ok(source.includes('organizerApprovedExternalAction'));
});
test('V0.230 table research results reach Memos only after an explicit offer and acceptance',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableResearchResult.ts'),'utf8');
 assert.ok(source.includes("input.memoAccepted&&input.state==='memo_offered'"));
 assert.ok(source.includes("return'memo_saved'"));
});


test('V0.230 a resolved speech turn now flows through one intent-to-action pipeline',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableTurnPipeline.ts'),'utf8');
 assert.ok(source.includes('export function processLiaTableTurn'));
 assert.ok(source.includes('routeLiaTableIntent'));
 assert.ok(source.includes('buildLiaTableActionPlan'));
});
test('V0.230 common spoken requests are detected locally before intent routing',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableRequestSignals.ts'),'utf8');
 assert.ok(source.includes('export function detectLiaTableRequestSignals'));
 assert.ok(source.includes('research:'));
 assert.ok(source.includes('reminder:'));
 assert.ok(source.includes('action:'));
});
test('V0.230 speech pipeline derives request signals from recognized text instead of requiring UI flags',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableTurnPipeline.ts'),'utf8');
 assert.ok(source.includes('export function processLiaTableTurnFromSpeech'));
 assert.ok(source.includes('detectLiaTableRequestSignals(input.turn.text)'));
});


test('V0.230 table intents become typed commands that real app services can consume',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableCommand.ts'),'utf8');
 assert.ok(source.includes("type:'research'"));
 assert.ok(source.includes("type:'reminder'"));
 assert.ok(source.includes("type:'prepare_action'"));
});
test('V0.230 command dispatch never fakes a missing capability and reports unavailable instead',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableCommandDispatcher.ts'),'utf8');
 assert.ok(source.includes("return'unavailable'"));
 assert.ok(source.includes('if(!handlers.research)'));
 assert.ok(source.includes('if(!handlers.reminder)'));
});
test('V0.230 voice execution connects recognized speech through pipeline command building and real handlers',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableVoiceExecution.ts'),'utf8');
 assert.ok(source.includes('processLiaTableTurnFromSpeech'));
 assert.ok(source.includes('buildLiaTableCommand'));
 assert.ok(source.includes('dispatchLiaTableCommand'));
});


test('V0.230 table reminders bridge to the existing real assistant alarm scheduler only with structured confirmed input',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableReminderBridge.ts'),'utf8');
 assert.ok(source.includes("from './notifications'"));
 assert.ok(source.includes('scheduleLiaAssistantAlarm'));
 assert.ok(source.includes('confirmed:reminder.confirmed'));
 assert.ok(source.includes('oneTimeAt:reminder.oneTimeAt'));
});
test('V0.230 accepted table research can persist through the existing Memos service without bypassing consent state',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableMemoBridge.ts'),'utf8');
 assert.ok(source.includes("from './memos'"));
 assert.ok(source.includes("researchState!=='memo_saved'"));
 assert.ok(source.includes('createLiaMemo'));
});


test('V0.230 LiaOrb starts real table conversation runtime only for an explicitly active table listening session',()=>{
 const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
 assert.ok(source.includes("(mode==='table'||mode==='cooking')&&liaTableConversationAvailable()"));
 assert.ok(source.includes('startLiaTableLiveCoordinator'));
 assert.ok(source.includes('enabled&&open&&listening'));
});
test('V0.230 LiaOrb stops table conversation runtime when eligibility changes or the surface unmounts',()=>{
 const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
 assert.ok(source.includes('tableConversationRuntimeRef.current=null'));
 assert.ok(source.includes('if(runtime)void runtime.stop()'));
});


test('V0.230 live coordinator derives spontaneous rhythm from its own intervention history and topic tracker',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableLiveCoordinator.ts'),'utf8');
 assert.ok(source.includes('decideLiaTableParticipationWithHistory'));
 assert.ok(source.includes('createLiaTableTopicState'));
 assert.ok(source.includes('updateLiaTableTopic'));
 assert.ok(source.includes('history:interventionHistory'));
});
test('V0.230 LiaOrb now starts the complete live table coordinator rather than the raw speech runtime',()=>{
 const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
 assert.ok(source.includes('startLiaTableLiveCoordinator'));
 assert.ok(!source.includes("import {startLiaTableConversationRuntime"));
 assert.ok(source.includes('liaAudioHumanSpeechActive'));
});


test('V0.230 table response generation is exposed only through a registered available real adapter',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableResponseAdapter.ts'),'utf8');
 assert.ok(source.includes('export interface LiaTableResponseAdapter'));
 assert.ok(source.includes('adapter?.isAvailable()?adapter:null'));
});
test('V0.230 response runtime reports unavailable rather than inventing an answer without a response engine',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableResponseRuntime.ts'),'utf8');
 assert.ok(source.includes("if(!adapter)return failure('unavailable')"));
});
test('V0.230 eligible LiaOrb table turns can reach the real response adapter and existing LIA voice while sensitive results stay silent',()=>{
 const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
 assert.ok(source.includes('generateLiaTableResponse'));
 assert.ok(source.includes("result.status!=='ready'"));
 assert.ok(source.includes('speakIfStillFree(result.text,result.sensitive)'));
 assert.ok(source.includes('speakLia(text'));
});


test('V0.230 generated table speech is gated again at playback time so LIA yields if a human resumed speaking',()=>{
 const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
 assert.ok(source.includes('maySpeakGeneratedTableResponse'));
 assert.ok(source.includes('humanSpeechActive:liaAudioHumanSpeechActive'));
 assert.ok(source.includes('sessionStillActive:Boolean(tableConversationRuntimeRef.current)'));
});
test('V0.230 a newer eligible family turn invalidates an older pending generated response',()=>{
 const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
 assert.ok(source.includes('tableResponseGenerationRef'));
 assert.ok(source.includes('generation!==tableResponseGenerationRef.current'));
});


test('V0.230 stopping a table speech runtime clears raw turns and speaker identities before adapter shutdown',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableConversationRuntime.ts'),'utf8');
 assert.ok(source.includes('identities.clear()'));
 assert.ok(source.includes('session=clearLiaTableConversationSession()'));
 assert.ok(source.includes('if(stopped)return'));
});
test('V0.230 raw table speech and speaker tracks are explicitly non-persistent while confirmed facts and accepted Memos may persist',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTablePrivacy.ts'),'utf8');
 assert.ok(source.includes("kind==='confirmed_fact'||kind==='accepted_memo'"));
 assert.ok(source.includes("scope:'memory_only'"));
 assert.ok(source.includes("until:'session_stop'"));
});


test('V0.231 direct voice requests recognize LIA only when she is explicitly addressed',()=>{
  assert.deepStrictEqual(liaAssistantVoice.stripLiaDirectAddress('LIA, appelle Raphaël'),{directAddressed:true,cleanedText:'appelle Raphaël'});
  assert.equal(liaAssistantVoice.stripLiaDirectAddress('on appelle Raphaël demain').directAddressed,false);
});
test('V0.231 ambient table speech can never become a phone call command',()=>{
  const request=liaAssistantVoice.routeLiaAssistantVoiceRequest('appelle Raphaël');
  assert.equal(request.intent,'listen_only');assert.equal(request.directAddressed,false);
});
test('V0.231 French phone call commands extract only the requested contact name',()=>{
  assert.equal(liaAssistantVoice.extractLiaPhoneCallTarget('LIA, appelle Raphaël'),'Raphaël');
});
test('V0.231 English phone call commands are routed through the same assistant boundary',()=>{
  const request=liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, call Raphael');
  assert.equal(request.intent,'phone_call');assert.equal(request.target,'Raphael');
});
test('V0.231 explicit message requests are separated from generic actions',()=>{
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, envoie un message à David').intent,'message');
});
test('V0.231 reminder requests cannot be mistaken for a call',()=>{
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, rappelle-moi le four dans dix minutes').intent,'reminder');
});
test('V0.231 research requests keep their dedicated assistant intent',()=>{
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, cherche si ce restaurant est ouvert').intent,'research');
});
test('V0.231 ordinary explicit questions fall back to the response engine',()=>{
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, tu en penses quoi ?').intent,'answer');
});
test('V0.231 contact names are compared accent-insensitively without changing the stored display name',()=>{
  assert.equal(liaPhoneContactResolver.normalizeLiaContactName('  Raphaël Amsellem '),'raphael amsellem');
});
test('V0.231 phone sanitization preserves one leading plus and strips formatting',()=>{
  assert.equal(liaPhoneContactResolver.sanitizeLiaPhoneNumber('+972 50-123-4567'),'+972501234567');
});
test('V0.231 unusable short phone strings are rejected before the dialer',()=>{
  assert.equal(liaPhoneContactResolver.sanitizeLiaPhoneNumber('12-34'),null);
});
test('V0.231 one exact contact with one valid number resolves without a redundant confirmation',()=>{
  const result=liaPhoneContactResolver.resolveLiaPhoneContact('Raphaël',[{id:'1',displayName:'Raphaël',phoneNumbers:[{label:'mobile',number:'0501234567'}]}]);
  assert.equal(result.status,'resolved');assert.equal(result.confidence,1);
});
test('V0.231 duplicate exact contact names force clarification instead of guessing',()=>{
  const result=liaPhoneContactResolver.resolveLiaPhoneContact('David',[{id:'1',displayName:'David',phoneNumbers:[{label:null,number:'0501111111'}]},{id:'2',displayName:'David',phoneNumbers:[{label:null,number:'0502222222'}]}]);
  assert.equal(result.status,'ambiguous_contact');
});
test('V0.231 one contact with several distinct numbers requires choosing a number',()=>{
  const result=liaPhoneContactResolver.resolveLiaPhoneContact('David',[{id:'1',displayName:'David',phoneNumbers:[{label:'mobile',number:'0501111111'},{label:'work',number:'039999999'}]}]);
  assert.equal(result.status,'choose_number');
});
test('V0.231 a matching contact without a usable number is reported explicitly',()=>{
  const result=liaPhoneContactResolver.resolveLiaPhoneContact('David',[{id:'1',displayName:'David',phoneNumbers:[]}]);
  assert.equal(result.status,'no_number');
});
test('V0.231 a single fuzzy contact match asks for confirmation before calling',()=>{
  const result=liaPhoneContactResolver.resolveLiaPhoneContact('Raphael',[{id:'1',displayName:'Raphael Amsellem',phoneNumbers:[{label:null,number:'0501234567'}]}]);
  assert.equal(result.status,'confirm_contact');
});
test('V0.231 several fuzzy contact matches remain ambiguous',()=>{
  const result=liaPhoneContactResolver.resolveLiaPhoneContact('David',[{id:'1',displayName:'David Cohen',phoneNumbers:[{label:null,number:'0501111111'}]},{id:'2',displayName:'David Levy',phoneNumbers:[{label:null,number:'0502222222'}]}]);
  assert.equal(result.status,'ambiguous_contact');
});
test('V0.231 missing phone contacts return no-match instead of inventing a family member',()=>{
  assert.equal(liaPhoneContactResolver.resolveLiaPhoneContact('Inconnu',[]).status,'no_match');
});
test('V0.231 duplicate formatting variants of the same number do not create false ambiguity',()=>{
  const result=liaPhoneContactResolver.resolveLiaPhoneContact('David',[{id:'1',displayName:'David',phoneNumbers:[{label:'a',number:'050-123-4567'},{label:'b',number:'0501234567'}]}]);
  assert.equal(result.status,'resolved');
});
test('V0.231 phone Contacts adapter defaults to the real local native provider and remains injectable for tests',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaPhoneContactsAdapter.ts'),'utf8');
  assert(source.includes("from '../../modules/lia-device-contacts'"));assert(source.includes('registerLiaPhoneContactsAdapter'));assert(source.includes('candidate.isAvailable()?candidate:null'));
});
test('V0.231 iPhone contacts lookup uses the native Contacts framework and matching-name predicate',()=>{
  const source=fs.readFileSync(path.join(root,'modules/lia-device-contacts/ios/LiaDeviceContactsModule.swift'),'utf8');
  assert(source.includes('import Contacts'));assert(source.includes('predicateForContacts(matchingName: clean)'));assert(source.includes('CNContactPhoneNumbersKey'));
});
test('V0.231 Android contacts lookup uses ContactsContract only after READ_CONTACTS permission',()=>{
  const source=fs.readFileSync(path.join(root,'modules/lia-device-contacts/android/src/main/java/com/notretable/contacts/LiaDeviceContactsModule.kt'),'utf8');
  assert(source.includes('ContactsContract.CommonDataKinds.Phone.CONTENT_URI'));assert(source.includes('Manifest.permission.READ_CONTACTS'));assert(source.includes('checkSelfPermission'));
});
test('V0.231 contact permission explains that access follows an explicit LIA call request',()=>{
  const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
  assert(app.expo.ios.infoPlist.NSContactsUsageDescription.includes('explicitly ask her to call'));
});
test('V0.231 the phone call coordinator refuses every ambient non-direct request before touching Contacts',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaPhoneCallCoordinator.ts'),'utf8');
  assert(source.includes("if(!input.directAddressed)return{status:'ignored'}"));
  assert(source.indexOf("if(!input.directAddressed)")<source.indexOf('getLiaPhoneContactsAdapter()'));
});
test('V0.231 contact permission is requested only inside the explicit phone-call coordinator',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaPhoneCallCoordinator.ts'),'utf8');
  assert(source.includes("if(adapter.permissionStatus()!=='granted')"));assert(source.includes('await adapter.requestPermission()'));
});
test('V0.231 a high-confidence exact contact reaches the dialer without mandatory second confirmation',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaPhoneCallCoordinator.ts'),'utf8');
  assert(source.includes("resolution.status==='resolved'"));assert(source.includes('openResolvedPhone(contact,phone,input.openDialer)'));assert(source.includes('openDialer??openLiaPhoneDialer'));
});
test('V0.231 uncertain contacts and multi-number contacts cannot reach the dialer without user choice',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaPhoneCallCoordinator.ts'),'utf8');
  assert(source.includes("resolution.status==='confirm_contact'"));assert(source.includes("resolution.status==='choose_number'"));assert(source.includes('if(!input.selectedPhoneNumber){'));assert(source.includes("kind:'number'"));
});
test('V0.231 the real phone handoff sanitizes a tel URL before opening the operating-system dialer',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaPhoneDialer.ts'),'utf8');
  assert(source.includes('sanitizeLiaPhoneNumber'));assert(source.includes('const url=`tel:${clean}`'));assert(source.includes('Linking.openURL(url)'));
});
test('V0.231 calls use device Contacts as the sole source of phone identity, never light_members',()=>{
  const files=['src/services/liaPhoneContactsAdapter.ts','src/services/liaPhoneCallCoordinator.ts','src/services/liaPhoneDialer.ts','src/lib/liaPhoneContactResolver.ts'];
  const joined=files.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n');
  assert(!joined.includes('light_members'));assert(!joined.includes('lightParticipation'));assert(joined.includes('lia-device-contacts'));
});
test('V0.231 message commands fail closed when no real messaging provider is connected',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaMessageActionAdapter.ts'),'utf8');
  assert(source.includes("if(!current)return{status:'unavailable'}"));assert(!source.includes("status:'sent'"));
});
test('V0.231 old table request signals no longer create a second message-send pipeline',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaTableRequestSignals.ts'),'utf8');
  assert(!source.includes('envoie|prepare'));assert(source.includes('prepare|ajoute|mets|commande|reserve'));
});
test('V0.231 conversational table mode requires both real speech recognition and a real response engine',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaTableConversationCapability.ts'),'utf8');
  assert(source.includes('liaTableSpeechAvailable()&&liaTableResponseAvailable()'));
});
test('V0.231 LiaOrb routes eligible direct requests through the assistant layer before normal generated conversation',()=>{
  const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  const assistant=source.indexOf('executeLiaAssistantVoiceRequest');const response=source.indexOf('generateLiaTableResponse({',assistant);
  assert(assistant>=0&&response>assistant);assert(source.includes("assistant.status==='phone'"));
});
test('V0.231 LiaOrb starts table conversation only through the combined real-capability gate',()=>{
  const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(source.includes("(mode==='table'||mode==='cooking')&&liaTableConversationAvailable()"));assert(!source.includes("mode==='table'&&liaTableSpeechAvailable()"));
});

test('V0.232 a bare direct call request asks for the missing first name instead of entering normal conversation',()=>{
  const routed=liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, appelle');
  assert.equal(routed.intent,'phone_call');assert.equal(routed.target,null);
});
test('V0.232 first pronunciation failure asks naturally for the first name again',()=>{
  assert.equal(liaAssistantVoice.liaPhonePronunciationRetryReply(1,'fr-FR'),'Je n’ai pas bien compris le prénom. Redis-le-moi.');
});
test('V0.232 second consecutive pronunciation failure uses Walter’s approved humorous line',()=>{
  assert.equal(liaAssistantVoice.liaPhonePronunciationRetryReply(2,'fr-FR'),'Tu peux arrêter de bafouiller ? Allez, redis-moi le prénom.');
  const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(source.includes('phoneNameRetryRef.current+=1'));assert(source.includes('awaitingPhoneName:phoneNameRetryRef.current>0'));
});

test('V0.233 LIA extracts one explicit SMS recipient and exact body from direct French speech',()=>{
  assert.deepStrictEqual(liaAssistantVoice.parseLiaMessageDraft('LIA, envoie un message à Raphaël : je rentre à 19 heures'),{recipientName:'Raphaël',body:'je rentre à 19 heures'});
});
test('V0.233 an incomplete SMS request remains a clarification instead of inventing text',()=>{
  assert.equal(liaAssistantVoice.parseLiaMessageDraft('LIA, envoie un message à Raphaël'),null);
});
test('V0.233 native SMS handoff opens a populated composer and never claims automatic sending',()=>{
  const service=fs.readFileSync(path.join(root,'src/services/liaMessageActionAdapter.ts'),'utf8');
  const ios=fs.readFileSync(path.join(root,'modules/lia-device-contacts/ios/LiaDeviceContactsModule.swift'),'utf8');
  const android=fs.readFileSync(path.join(root,'modules/lia-device-contacts/android/src/main/java/com/notretable/contacts/LiaDeviceContactsModule.kt'),'utf8');
  assert(service.includes('composeLiaDeviceMessage'));assert(service.includes('appuie toi-même sur Envoyer'));
  assert(ios.includes('MFMessageComposeViewController'));assert(ios.includes('composer.recipients = recipients'));assert(ios.includes('composer.body = body'));
  assert(android.includes('Intent.ACTION_SENDTO'));assert(android.includes('sms_body'));
  assert(!service.includes("status:'sent'"));
});
test('V0.233 SMS recipient identity still fails closed on missing ambiguous or multi-number contacts',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaMessageActionAdapter.ts'),'utf8');
  for(const status of ["'no_match'","'ambiguous_contact'","'confirm_contact'","'choose_number'"])assert(source.includes(status));
});

test('V0.234 SMS clarification keeps the draft only in session and accepts a short follow-up answer',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaMessageActionAdapter.ts'),'utf8');
  assert(source.includes('let pendingMessage:PendingMessageClarification|null=null'));
  assert(source.includes('continueLiaMessageClarification(answer:string)'));
  assert(source.includes("pending.kind==='confirm'"));assert(source.includes("pending.kind==='ambiguous'"));assert(source.includes("pending.kind==='number'"));
  assert(!source.includes('writeStoredJson'));assert(!source.includes('AsyncStorage'));
});
test('V0.234 LiaOrb treats the answer to an SMS clarification as a continuation without another LIA prefix',()=>{
  const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(source.includes('liaMessageClarificationPending()||'));
  assert(source.includes('awaitingMessageClarification:liaMessageClarificationPending()'));
});
test('V0.234 SMS continuation still opens only the composer and never sends by itself',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaMessageActionAdapter.ts'),'utf8');
  assert(source.includes('return openMessageDraft'));
  assert(source.includes('appuie toi-même sur Envoyer'));
  assert(!source.includes("status:'sent'"));
});

test('V0.235 incomplete SMS with a known recipient preserves the recipient and asks only for text',()=>{
  assert.deepStrictEqual(liaAssistantVoice.parseLiaPartialMessageDraft('LIA, envoie un message à Raphaël'),{recipientName:'Raphaël',body:null});
});
test('V0.235 incomplete SMS with known text preserves the text and asks only for recipient',()=>{
  assert.deepStrictEqual(liaAssistantVoice.parseLiaPartialMessageDraft('LIA, envoie un message : je rentre à 19 heures'),{recipientName:null,body:'je rentre à 19 heures'});
});
test('V0.235 SMS incomplete state stays session-only and completes without restarting the command',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaMessageActionAdapter.ts'),'utf8');
  assert(source.includes('let pendingIncompleteMessage:LiaPartialMessageDraft|null=null'));
  assert(source.includes('Qu’est-ce que tu veux écrire à'));
  assert(source.includes('À qui veux-tu envoyer ce message ?'));
  assert(source.includes('recipientName:incomplete.recipientName,body:clean'));
  assert(source.includes('recipientName:clean,body:incomplete.body'));
  assert(!source.includes('writeStoredJson'));
});

test('V0.236 phone call clarification remains session-only and accepts a short follow-up answer',()=>{
  const coordinator=fs.readFileSync(path.join(root,'src/services/liaPhoneCallCoordinator.ts'),'utf8');
  assert(coordinator.includes('let pendingPhoneCall:PendingPhoneCallClarification|null=null'));
  assert(coordinator.includes('continueLiaPhoneCallClarification(answer:string)'));
  assert(coordinator.includes("pending.kind==='confirm'"));
  assert(coordinator.includes("pending.kind==='ambiguous'"));
  assert(coordinator.includes("pending.kind==='number'"));
  assert(!coordinator.includes('AsyncStorage'));assert(!coordinator.includes('writeStoredJson'));
});
test('V0.236 LiaOrb keeps a phone clarification direct without another LIA prefix',()=>{
  const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(source.includes('phoneNameRetryRef.current>0||liaPhoneCallClarificationPending()||'));
  assert(source.includes('awaitingPhoneClarification:liaPhoneCallClarificationPending()'));
});
test('V0.236 French phone choices match native English contact labels without guessing',()=>{
  assert.equal(liaPhoneContactResolver.liaPhoneLabelMatchesAnswer('mobile','portable'),true);
  assert.equal(liaPhoneContactResolver.liaPhoneLabelMatchesAnswer('work','travail'),true);
  assert.equal(liaPhoneContactResolver.liaPhoneLabelMatchesAnswer('home','domicile'),true);
  assert.equal(liaPhoneContactResolver.liaPhoneLabelMatchesAnswer('work','portable'),false);
  const message=fs.readFileSync(path.join(root,'src/services/liaMessageActionAdapter.ts'),'utf8');
  const call=fs.readFileSync(path.join(root,'src/services/liaPhoneCallCoordinator.ts'),'utf8');
  assert(message.includes('liaPhoneLabelMatchesAnswer(phone.label,clean)'));
  assert(call.includes('liaPhoneLabelMatchesAnswer(phone.label,clean)'));
});
test('V0.236 LIA speaks the actual contact and phone-label choices before waiting',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaPhoneCallCoordinator.ts'),'utf8');
  assert(source.includes("result.contacts.map(contact=>contact.displayName).join(', ')"));
  assert(source.includes("result.phoneNumbers.map((phone,index)=>phone.label?.trim()||`numéro ${index+1}`)"));
});

test('V0.237 a pending voice action accepts explicit cancellation without inventing a new recipient',()=>{
  assert.equal(liaAssistantVoice.isLiaAssistantActionCancellation('annule'),true);
  assert.equal(liaAssistantVoice.isLiaAssistantActionCancellation('LIA, laisse tomber'),true);
  assert.equal(liaAssistantVoice.isLiaAssistantActionCancellation('oublie ça'),true);
  assert.equal(liaAssistantVoice.isLiaAssistantActionCancellation('appelle Raphaël'),false);
});
test('V0.237 cancelling clears both phone and message pending state',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  assert(source.includes('isLiaAssistantActionCancellation(input.text)'));
  assert(source.includes('clearLiaPhoneCallClarification()'));
  assert(source.includes('clearLiaMessageClarification()'));
  assert(source.includes("status:'action_cancelled'"));
});
test('V0.237 action clarification cannot survive ordinary backgrounding or an ended listening session',()=>{
  const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(source.includes("if(listening&&(liaExternalHandoffActive()||nativePhoneCallActive))return;"));
  assert((source.match(/clearLiaPhoneCallClarification\(\)/g)||[]).length>=3);
  assert((source.match(/clearLiaMessageClarification\(\)/g)||[]).length>=3);
  assert(source.includes("if(enabled&&!manualListeningPaused)return;"));
});

test('V0.238 a new explicit call replaces an older pending phone or message action',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  const replacement=source.indexOf("actionPending&&request.directAddressed&&request.intent==='phone_call'");
  const messageContinuation=source.indexOf('if(input.awaitingMessageClarification)');
  assert(replacement>=0&&replacement<messageContinuation);
  assert(source.slice(replacement,messageContinuation).includes('clearLiaPhoneCallClarification()'));
  assert(source.slice(replacement,messageContinuation).includes('clearLiaMessageClarification()'));
  assert(source.slice(replacement,messageContinuation).includes('requestedName:request.target'));
});
test('V0.238 a new explicit SMS replaces an older clarification instead of becoming its answer',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  const replacement=source.indexOf("actionPending&&request.directAddressed&&request.intent==='message'");
  const messageContinuation=source.indexOf('if(input.awaitingMessageClarification)');
  assert(replacement>=0&&replacement<messageContinuation);
  assert(source.slice(replacement,messageContinuation).includes('prepareLiaMessageFromSpeech(request.cleanedText)'));
});
test('V0.238 an explicit reminder research or action exits stale phone and SMS clarification',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  assert(source.includes("actionPending&&request.directAddressed&&request.intent==='reminder'"));
  assert(source.includes("actionPending&&request.directAddressed&&request.intent==='action'"));
  assert(source.includes("actionPending&&request.directAddressed&&request.intent==='research'"));
  assert(source.includes('clearLiaPhoneCallClarification()'));
  assert(source.includes('clearLiaMessageClarification()'));
});

test('V0.239 deterministic LIA actions stay local and consume no model route',()=>{
  const route=liaAgentRouting.selectLiaAgentRoute({task:'local_action',monthToDateUsd:0,essential:true,sensitive:false});
  assert.equal(route.execution,'local');assert.equal(route.modelTier,'none');assert.equal(route.allowWeb,false);assert.equal(route.maxOutputTokens,0);
});
test('V0.239 ordinary LIA conversation uses the economy tier while keeping confirmed context',()=>{
  const route=liaAgentRouting.selectLiaAgentRoute({task:'simple_conversation',monthToDateUsd:.2,essential:false,sensitive:false});
  assert.equal(route.execution,'model');assert.equal(route.modelTier,'economy');assert.equal(route.memoryScope,'relevant_confirmed');
});
test('V0.239 complex reasoning uses stronger models only while the cost band allows it',()=>{
  assert.equal(liaAgentRouting.selectLiaAgentRoute({task:'complex_reasoning',monthToDateUsd:.2,essential:false,sensitive:false}).modelTier,'reasoning');
  assert.equal(liaAgentRouting.selectLiaAgentRoute({task:'complex_reasoning',monthToDateUsd:.8,essential:false,sensitive:false}).modelTier,'standard');
  assert.equal(liaAgentRouting.selectLiaAgentRoute({task:'complex_reasoning',monthToDateUsd:1.2,essential:false,sensitive:false}).modelTier,'economy');
});
test('V0.239 current-information research never falls back to an unverified model answer',()=>{
  const normal=liaAgentRouting.selectLiaAgentRoute({task:'verified_research',monthToDateUsd:.2,essential:false,sensitive:false});
  const protectedRoute=liaAgentRouting.selectLiaAgentRoute({task:'verified_research',monthToDateUsd:1.2,essential:false,sensitive:false});
  assert.equal(normal.execution,'model_with_tools');assert.equal(normal.allowWeb,true);
  assert.equal(protectedRoute.execution,'defer');assert.equal(protectedRoute.allowWeb,false);
});
test('V0.239 sensitive LIA turns forbid web tools and broad persistent memory',()=>{
  const route=liaAgentRouting.selectLiaAgentRoute({task:'complex_reasoning',monthToDateUsd:.2,essential:true,sensitive:true});
  assert.equal(route.allowWeb,false);assert.equal(route.memoryScope,'session');assert.equal(route.reason,'sensitive_private_context');
});
test('V0.239 the real response adapter receives the selected route without pretending a provider exists',()=>{
  const adapter=fs.readFileSync(path.join(root,'src/services/liaTableResponseAdapter.ts'),'utf8');
  const runtime=fs.readFileSync(path.join(root,'src/services/liaTableResponseRuntime.ts'),'utf8');
  assert(adapter.includes('request:LiaAgentRequest'));
  assert(runtime.includes('selectLiaAgentRoute({'));
  assert(runtime.includes("if(route.execution==='defer')return failure('deferred_cost_guard')"));
  assert(runtime.includes('adapter.generate({request,signal})'));
  assert(adapter.includes('return adapter?.isAvailable()?adapter:null'));
});

test('V0.240 an explicit current-information request automatically requires verified research',()=>{
  const result=liaAgentTurnClassifier.classifyLiaAgentTurn('LIA, vérifie si ce restaurant est ouvert maintenant');
  assert.equal(result.task,'verified_research');assert.equal(result.sensitive,false);
});
test('V0.240 an analytical decision automatically reaches the complex reasoning route',()=>{
  const result=liaAgentTurnClassifier.classifyLiaAgentTurn('LIA, compare les deux options et aide-moi à décider');
  assert.equal(result.task,'complex_reasoning');assert.equal(result.reason,'complex_request');
});
test('V0.240 ordinary family conversation remains on the low-cost conversation route',()=>{
  const result=liaAgentTurnClassifier.classifyLiaAgentTurn('LIA, tu en penses quoi pour le dîner ?');
  assert.equal(result.task,'simple_conversation');assert.equal(result.sensitive,false);
  assert.equal(liaAgentTurnClassifier.classifyLiaAgentTurn('On mange maintenant ?').task,'simple_conversation');
});
test('V0.240 private health relationship and financial topics are detected before provider execution',()=>{
  for(const text of ['Mon traitement médical me fatigue','Je pense au divorce','Mon compte bancaire est à découvert']){
    assert.equal(liaAgentTurnClassifier.classifyLiaAgentTurn(text).sensitive,true);
  }
});
test('V0.240 explicit caller task remains possible while automatic privacy is a non-bypassable floor',()=>{
  const runtime=fs.readFileSync(path.join(root,'src/services/liaTableResponseRuntime.ts'),'utf8');
  assert(runtime.includes('input.context.agentTask??classification.task'));
  assert(runtime.includes('Boolean(input.context.sensitiveInput)||classification.sensitive'));
});
test('V0.240 sensitive input forces silent output even if a future adapter labels its answer non-sensitive',()=>{
  const runtime=fs.readFileSync(path.join(root,'src/services/liaTableResponseRuntime.ts'),'utf8');
  assert(runtime.includes("result.sensitive||route.reason==='sensitive_private_context'"));
});

test('V0.241 provider requests carry LIA identity and forbid invented actions or family facts',()=>{
  const route=liaAgentRouting.selectLiaAgentRoute({task:'simple_conversation',monthToDateUsd:0,essential:true,sensitive:false});
  const request=liaAgentRequest.buildLiaAgentRequest({userText:'Que proposes-tu ?',languageTag:'fr-FR',topicKey:null,mayUseMemberName:false,route});
  assert(request.policy.some(rule=>rule.includes('family assistant, housekeeper and confidante')));
  assert(request.policy.some(rule=>rule.includes('Never claim that an action')));
  assert(request.policy.some(rule=>rule.includes('Never invent current information')));
});
test('V0.241 only confirmed relevant facts enter a provider request',()=>{
  const route=liaAgentRouting.selectLiaAgentRoute({task:'simple_conversation',monthToDateUsd:0,essential:true,sensitive:false});
  const request=liaAgentRequest.buildLiaAgentRequest({userText:'Une idée ?',languageTag:'fr-FR',topicKey:'dinner',mayUseMemberName:false,route,confirmedFacts:[
    {key:'meal.preference',value:'végétarien',scope:'persistent',confirmed:true,relevant:true,sensitive:false},
    {key:'guess',value:'aime le piment',scope:'persistent',confirmed:false,relevant:true,sensitive:false},
    {key:'unrelated',value:'Paris',scope:'persistent',confirmed:true,relevant:false,sensitive:false},
    {key:'health.detail',value:'privé',scope:'persistent',confirmed:true,relevant:true,sensitive:true},
  ]});
  assert.deepStrictEqual(request.confirmedFacts,[{key:'meal.preference',value:'végétarien'}]);
});
test('V0.241 sensitive routes accept only session facts and never enable web search',()=>{
  const route=liaAgentRouting.selectLiaAgentRoute({task:'complex_reasoning',monthToDateUsd:0,essential:true,sensitive:true});
  const request=liaAgentRequest.buildLiaAgentRequest({userText:'Aide-moi',languageTag:'fr-FR',topicKey:null,mayUseMemberName:false,route,confirmedFacts:[
    {key:'session.concern',value:'fatigue',scope:'session',confirmed:true,relevant:true,sensitive:true},
    {key:'profile.history',value:'ancien',scope:'persistent',confirmed:true,relevant:true,sensitive:true},
  ]});
  assert.deepStrictEqual(request.confirmedFacts,[{key:'session.concern',value:'fatigue'}]);
  assert.deepStrictEqual(request.allowedTools,[]);
});
test('V0.241 provider requests omit raw speaker track member id and confidence metadata',()=>{
  const adapter=fs.readFileSync(path.join(root,'src/services/liaTableResponseAdapter.ts'),'utf8');
  const request=fs.readFileSync(path.join(root,'src/lib/liaAgentRequest.ts'),'utf8');
  assert(!request.includes('speakerTrackId'));assert(!request.includes('identityConfidence'));assert(!request.includes('memberId'));
  assert(adapter.includes('generate(input:{request:LiaAgentRequest;signal:AbortSignal})'));
});
test('V0.241 current research enables only web search and requires verified evidence',()=>{
  const route=liaAgentRouting.selectLiaAgentRoute({task:'verified_research',monthToDateUsd:0,essential:true,sensitive:false});
  const request=liaAgentRequest.buildLiaAgentRequest({userText:'Vérifie',languageTag:'fr-FR',topicKey:null,mayUseMemberName:false,route});
  assert.deepStrictEqual(request.allowedTools,['web_search']);assert.equal(request.requireVerifiedSources,true);
});
test('V0.241 runtime rejects an unverified research answer instead of speaking it as fact',()=>{
  const runtime=fs.readFileSync(path.join(root,'src/services/liaTableResponseRuntime.ts'),'utf8');
  assert(runtime.includes("if(request.requireVerifiedSources&&result.evidence!=='verified_sources')return failure('unverified')"));
});

test('V0.242 simple complex and researched requests have bounded route-specific deadlines',()=>{
  const simple=liaAgentRouting.selectLiaAgentRoute({task:'simple_conversation',monthToDateUsd:0,essential:true,sensitive:false});
  const complex=liaAgentRouting.selectLiaAgentRoute({task:'complex_reasoning',monthToDateUsd:0,essential:true,sensitive:false});
  const research=liaAgentRouting.selectLiaAgentRoute({task:'verified_research',monthToDateUsd:0,essential:true,sensitive:false});
  assert.equal(liaAgentProviderExecution.liaAgentDeadlineMs(simple),8000);
  assert.equal(liaAgentProviderExecution.liaAgentDeadlineMs(complex),15000);
  assert.equal(liaAgentProviderExecution.liaAgentDeadlineMs(research),20000);
});
test('V0.242 the provider contract receives an abort signal',()=>{
  const adapter=fs.readFileSync(path.join(root,'src/services/liaTableResponseAdapter.ts'),'utf8');
  const runtime=fs.readFileSync(path.join(root,'src/services/liaTableResponseRuntime.ts'),'utf8');
  assert(adapter.includes('signal:AbortSignal'));
  assert(runtime.includes('run:signal=>adapter.generate({request,signal})'));
});
test('V0.242 a provider timeout aborts the request and resolves to a typed failure',()=>{
  const source=fs.readFileSync(path.join(root,'src/lib/liaAgentProviderExecution.ts'),'utf8');
  assert(source.includes('controller.abort()'));
  assert(source.includes("reason:'timed_out'"));
  assert(source.includes('Promise.race([provider,timeout])'));
});
test('V0.242 provider rejection is contained instead of escaping the table conversation',()=>{
  const source=fs.readFileSync(path.join(root,'src/lib/liaAgentProviderExecution.ts'),'utf8');
  const runtime=fs.readFileSync(path.join(root,'src/services/liaTableResponseRuntime.ts'),'utf8');
  assert(source.includes(".catch(()=>({ok:false,reason:'provider_error'} as const))"));
  assert(runtime.includes('if(!execution.ok)return failure(execution.reason)'));
});
test('V0.242 one user turn launches exactly one provider request with no automatic paid retry',()=>{
  const runtime=fs.readFileSync(path.join(root,'src/services/liaTableResponseRuntime.ts'),'utf8');
  assert.equal((runtime.match(/adapter\.generate\(/g)||[]).length,1);
  assert(!runtime.includes('retry'));assert(!runtime.includes('for('));
});
test('V0.242 deterministic local actions never require an available model provider',()=>{
  const runtime=fs.readFileSync(path.join(root,'src/services/liaTableResponseRuntime.ts'),'utf8');
  assert(runtime.indexOf("if(route.execution==='local')return failure('local_action_required')")<runtime.indexOf('const adapter=getLiaTableResponseAdapter()'));
});

test('V0.243 a direct timeout gets Walter’s honest non-technical French reply',()=>{
  assert.equal(liaAgentFailureReply.liaAgentFailureReply('timed_out','fr-FR'),'Ça prend trop de temps. Je préfère ne pas t’inventer une réponse.');
});
test('V0.243 unverified research says no reliable source instead of improvising',()=>{
  assert.equal(liaAgentFailureReply.liaAgentFailureReply('unverified','fr-FR'),'Je n’ai pas trouvé de source assez sûre pour te répondre.');
});
test('V0.243 failure replies cover every supported language without technical jargon',()=>{
  for(const language of ['fr-FR','en-US','es-ES','he-IL']){
    const reply=liaAgentFailureReply.liaAgentFailureReply('provider_error',language);
    assert(reply&&reply.length>10);assert(!/provider|timeout|erreur|error/i.test(reply));
  }
});
test('V0.243 local actions never receive a misleading model-failure reply',()=>{
  assert.equal(liaAgentFailureReply.liaAgentFailureReply('local_action_required','fr-FR'),null);
});
test('V0.243 only a directly addressed response request may speak a failure acknowledgement',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(orb.includes("assistant.status==='defer_to_response'&&!result.sensitive"));
  assert(orb.includes('liaAgentFailureReply(result.status,locale.languageTag)'));
});
test('V0.243 sensitive or stale failed turns remain silent at the family table',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  const stale=orb.indexOf('if(generation!==tableResponseGenerationRef.current)return;',orb.indexOf('const result=await generateLiaTableResponse'));
  const failure=orb.indexOf("if(result.status!=='ready')",stale);
  assert(stale>=0&&failure>stale);assert(orb.slice(failure,failure+260).includes('!result.sensitive'));
  const runtime=fs.readFileSync(path.join(root,'src/services/liaTableResponseRuntime.ts'),'utf8');
  assert(runtime.includes('({status,sensitive,task})'));
});


test('V0.244 LIA keeps LIA as her canonical identity even when a nickname exists',()=>{
  assert.equal(liaIdentity.LIA_CANONICAL_NAME,'LIA');
  const policy=liaIdentity.liaIdentityAgentPolicy({liaNickname:'Coco',userNickname:null,userNicknameApproved:false});
  assert(policy.some(rule=>rule.includes('canonical first name is LIA')));
  assert(policy.some(rule=>rule.includes('currently accepted nickname for LIA is "Coco"')));
});
test('V0.244 an accepted nickname becomes a real direct-address alias without replacing LIA',()=>{
  assert.deepStrictEqual(liaIdentity.liaDirectAddressNames('Coco'),['LIA','Coco']);
  assert.deepStrictEqual(liaAssistantVoice.stripLiaDirectAddress('Coco, mets de la musique',['LIA','Coco']),{directAddressed:true,cleanedText:'mets de la musique'});
  assert.deepStrictEqual(liaAssistantVoice.stripLiaDirectAddress('LIA, mets de la musique',['LIA','Coco']),{directAddressed:true,cleanedText:'mets de la musique'});
});
test('V0.244 nickname proposals are explicit and user nicknames require direct consent',()=>{
  assert.equal(liaIdentity.extractProposedLiaNickname("LIA, je vais t'appeler Coco",['LIA']),'Coco');
  assert.equal(liaIdentity.extractApprovedUserNickname('LIA, appelle-moi Boubou',['LIA']),'Boubou');
  assert.equal(liaIdentity.extractApprovedUserNickname('Boubou est drôle',['LIA']),null);
});
test('V0.244 playful name mirroring is blocked in tense sensitive or vulnerable moments',()=>{
  assert.equal(liaIdentity.liaMayPlayfullyMirrorNameTease({tone:'warm',sensitiveMoment:false,targetComfortKnown:true,jokeTargetsVulnerability:false}),true);
  assert.equal(liaIdentity.liaMayPlayfullyMirrorNameTease({tone:'tense',sensitiveMoment:false,targetComfortKnown:true,jokeTargetsVulnerability:false}),false);
  assert.equal(liaIdentity.liaMayPlayfullyMirrorNameTease({tone:'warm',sensitiveMoment:true,targetComfortKnown:true,jokeTargetsVulnerability:false}),false);
  assert.equal(liaIdentity.liaMayPlayfullyMirrorNameTease({tone:'warm',sensitiveMoment:false,targetComfortKnown:true,jokeTargetsVulnerability:true}),false);
});
test('V0.244 provider contract keeps wit respectful and nickname consent reciprocal',()=>{
  const route=liaAgentRouting.selectLiaAgentRoute({task:'simple_conversation',monthToDateUsd:0,essential:true,sensitive:false});
  const request=liaAgentRequest.buildLiaAgentRequest({userText:'Coucou',languageTag:'fr-FR',topicKey:null,mayUseMemberName:false,route,naming:{liaNickname:'Coco',userNickname:'Boubou',userNicknameApproved:true}});
  assert.equal(request.identity.canonicalName,'LIA');
  assert.equal(request.identity.liaNickname,'Coco');
  assert(request.policy.some(rule=>rule.includes('playful mirror nickname')));
  assert(request.policy.some(rule=>rule.includes('consent-based')));
  assert(request.policy.some(rule=>rule.includes('Boubou')));
});
test('V0.244 LIA is explicitly an active multi-step assistant, not generic chat',()=>{
  const route=liaAgentRouting.selectLiaAgentRoute({task:'complex_reasoning',monthToDateUsd:0,essential:true,sensitive:false});
  const request=liaAgentRequest.buildLiaAgentRequest({userText:'Organise-moi ça',languageTag:'fr-FR',topicKey:null,mayUseMemberName:false,route});
  assert(request.policy.some(rule=>rule.includes('modern active assistant')));
  assert(request.policy.some(rule=>rule.includes('multi-step requests')));
  assert(request.policy.some(rule=>rule.includes('next useful step')));
});
test('V0.244 LiaOrb loads naming preferences, handles naming turns and forwards aliases to actions',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(orb.includes('getLiaNamingPreferences'));
  assert(orb.includes('handleLiaNamingTurn'));
  assert(orb.includes('directNames,householdId,weekStart,demo'));
  assert(orb.includes('naming,'));
});


test('V0.245 a pantry dinner request becomes one multi-step assistant objective',()=>{
  const plan=liaAssistantObjective.planLiaAssistantObjective("LIA, organise le dîner de demain avec ce qu'on a dans les placards et ajoute ce qui manque aux courses");
  assert(plan.reads.includes('pantry.read'));
  assert(plan.reads.includes('recipes.read'));
  assert(plan.reads.includes('planning.read'));
  assert(plan.reads.includes('shopping.read'));
  assert(plan.proposedActions.some(item=>item.action==='planning.set_meal'&&item.requiresConfirmation));
  assert(plan.proposedActions.some(item=>item.action==='shopping.add_missing'&&item.requiresConfirmation));
  assert.equal(plan.multiStep,true);
});
test('V0.245 a simple pantry question reads context without inventing a write',()=>{
  const plan=liaAssistantObjective.planLiaAssistantObjective("Qu'est-ce qu'on a dans les placards ?");
  assert.deepStrictEqual(plan.reads,['pantry.read']);
  assert.deepStrictEqual(plan.proposedActions,[]);
});
test('V0.245 Memo and family-message writes remain confirmation-bound proposals',()=>{
  const plan=liaAssistantObjective.planLiaAssistantObjective('Mets ça dans Mémos et préviens la famille');
  assert(plan.proposedActions.some(item=>item.action==='memo.create'&&item.requiresConfirmation));
  assert(plan.proposedActions.some(item=>item.action==='family.prepare_message'&&item.requiresConfirmation));
});
test('V0.245 response runtime gathers read-only Notre Table context before the model request',()=>{
  const runtime=fs.readFileSync(path.join(root,'src/services/liaTableResponseRuntime.ts'),'utf8');
  assert(runtime.includes('planLiaAssistantObjective(input.turn.text)'));
  assert(runtime.includes('collectLiaAssistantAppFacts'));
  assert(runtime.includes('confirmedFacts:[...(input.context.confirmedFacts??[]),...relationshipFacts,...appFacts]'));
  assert(runtime.indexOf('collectLiaAssistantAppFacts')<runtime.indexOf('buildLiaAgentRequest({'));
});
test('V0.245 app context bridge is read-only and uses existing pantry recipe planning shopping and Memo services',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaAssistantAppContext.ts'),'utf8');
  for(const expected of ['fetchPantry','fetchRecipes','fetchMeals','fetchShopping','listLiaMemos','rankRecipesForPantry'])assert(source.includes(expected));
  for(const forbidden of ['addPantryItem(','setMealSlot(','addShoppingItem(','createLiaMemo('])assert(!source.includes(forbidden));
  assert(source.includes('Promise.allSettled'));
});
test('V0.245 the provider sees the objective but cannot treat proposed writes as completed actions',()=>{
  const route=liaAgentRouting.selectLiaAgentRoute({task:'complex_reasoning',monthToDateUsd:0,essential:true,sensitive:false});
  const objective=liaAssistantObjective.planLiaAssistantObjective("Organise le dîner de demain avec ce qu'on a");
  const request=liaAgentRequest.buildLiaAgentRequest({userText:'Organise le dîner',languageTag:'fr-FR',topicKey:'dinner',mayUseMemberName:false,route,assistantObjective:objective});
  assert.equal(request.assistantObjective.multiStep,true);
  assert(request.policy.some(rule=>rule.includes('proposed write')));
  assert(request.policy.some(rule=>rule.includes('one objective')));
});
test('V0.245 MainScreen gives LIA the active household and week instead of a detached generic context',()=>{
  const source=fs.readFileSync(path.join(root,'src/screens/MainScreen.tsx'),'utf8');
  assert(source.includes('householdId={household.id}'));
  assert(source.includes('weekStart={localIsoDate(weekStart)}'));
  assert(source.includes('demo={demo}'));
});


test('V0.246 an assistant write without explicit confirmation fails closed',()=>{
  const result=liaAssistantActionPolicy.validateLiaAssistantApprovedAction({type:'shopping.add_item',householdId:'h1',weekStart:'2026-09-14',label:'Tomates',confirmed:false});
  assert.deepStrictEqual(result,{ok:false,reason:'confirmation_required'});
});
test('V0.246 malformed assistant actions are rejected instead of guessed',()=>{
  const badMeal=liaAssistantActionPolicy.validateLiaAssistantApprovedAction({type:'planning.set_meal',householdId:'h1',date:'demain',mealType:'dinner',customTitle:'Pâtes',confirmed:true});
  const emptyMemo=liaAssistantActionPolicy.validateLiaAssistantApprovedAction({type:'memo.create',title:'',summary:'quelque chose',demo:true,confirmed:true});
  assert.deepStrictEqual(badMeal,{ok:false,reason:'invalid_payload'});
  assert.deepStrictEqual(emptyMemo,{ok:false,reason:'invalid_payload'});
});
test('V0.246 valid confirmed actions cross the policy boundary with sanitized payloads',()=>{
  const result=liaAssistantActionPolicy.validateLiaAssistantApprovedAction({type:'planning.set_meal',householdId:'  h1  ',date:'2026-09-19',mealType:'dinner',customTitle:'  Pâtes   tomate  ',confirmed:true});
  assert.equal(result.ok,true);
  assert.equal(result.action.householdId,'h1');
  assert.equal(result.action.customTitle,'Pâtes tomate');
});
test('V0.246 the executor reuses existing Notre Table write services and never reports pre-service success',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaAssistantActionExecutor.ts'),'utf8');
  for(const expected of ['addShoppingItem','setMealSlot','createLiaMemo','validateLiaAssistantApprovedAction'])assert(source.includes(expected));
  assert(source.includes("if(!checked.ok)return{status:checked.reason}"));
  assert(source.includes("catch{return{status:'failed'}"));
  assert(source.indexOf('await addShoppingItem')<source.indexOf("return{status:'completed',actionType:checked.action.type}"));
});



test('V0.248 a family-message objective reads the reachable family before proposing a confirmation-bound draft',()=>{
  const plan=liaAssistantObjective.planLiaAssistantObjective('LIA, préviens la famille pour le dîner de demain');
  assert(plan.reads.includes('family.read'));
  assert(plan.proposedActions.some(item=>item.action==='family.prepare_message'&&item.requiresConfirmation));
});
test('V0.248 family-message action fails closed without confirmation or exact recipients',()=>{
  const noConfirm=liaAssistantActionPolicy.validateLiaAssistantApprovedAction({type:'family.prepare_message',householdId:'h1',recipientMemberIds:['m1'],body:'Dîner à 20 h',confirmed:false});
  const noRecipient=liaAssistantActionPolicy.validateLiaAssistantApprovedAction({type:'family.prepare_message',householdId:'h1',recipientMemberIds:[],body:'Dîner à 20 h',confirmed:true});
  const noBody=liaAssistantActionPolicy.validateLiaAssistantApprovedAction({type:'family.prepare_message',householdId:'h1',recipientMemberIds:['m1'],body:'   ',confirmed:true});
  assert.deepStrictEqual(noConfirm,{ok:false,reason:'confirmation_required'});
  assert.deepStrictEqual(noRecipient,{ok:false,reason:'invalid_payload'});
  assert.deepStrictEqual(noBody,{ok:false,reason:'invalid_payload'});
});
test('V0.248 confirmed family-message payload is sanitized and duplicate recipients are removed',()=>{
  const result=liaAssistantActionPolicy.validateLiaAssistantApprovedAction({type:'family.prepare_message',householdId:' h1 ',recipientMemberIds:[' m1 ','m1',' m2 '],body:'  On mange   à 20 h  ',confirmed:true});
  assert.equal(result.ok,true);
  assert.equal(result.action.householdId,'h1');
  assert.deepStrictEqual(result.action.recipientMemberIds,['m1','m2']);
  assert.equal(result.action.body,'On mange à 20 h');
});
test('V0.248 family context and executor reuse existing members and native composer without auto-send',()=>{
  const context=fs.readFileSync(path.join(root,'src/services/liaAssistantAppContext.ts'),'utf8');
  const executor=fs.readFileSync(path.join(root,'src/services/liaAssistantActionExecutor.ts'),'utf8');
  assert(context.includes("case'family.read'"));
  assert(context.includes('fetchLightMembers'));
  assert(context.includes("confirmed('app.family_members'"));
  for(const expected of ['fetchLightMembers','familyMessageCapabilities','sanitizeLiaPhoneNumber','liaDeviceMessageComposerAvailable','composeLiaDeviceMessage'])assert(executor.includes(expected));
  assert(executor.includes("status:'prepared'"));
  assert(!executor.includes('sendLiaDeviceMessage'));
  assert(executor.indexOf('await composeLiaDeviceMessage')<executor.indexOf("return opened?{status:'prepared'"));
});

test('V0.247 second validated LIA presentation uses the same preferred voice without new copy',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaSecondIntroScreen.tsx'),'utf8');
  assert(screen.includes("getPreferredLiaVoice(locale.languageTag)"));
  assert(screen.includes("speakLia(locale.t('lia.secondIntro')"));
  assert(screen.includes("locale.t(voiceSpeaking?'onboarding.stopVoice':'onboarding.listenVoice')"));
  assert(!screen.includes('Coco'));
  assert(!screen.includes('Boubou'));
});
test('V0.247 second intro never auto-speaks over a screen reader and stops before leaving',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaSecondIntroScreen.tsx'),'utf8');
  assert(screen.includes('AccessibilityInfo.isScreenReaderEnabled()'));
  assert(screen.includes('if(cancelled||enabled||autoAttempted.current||!liaVoiceAvailable())return;'));
  assert(screen.includes('await stopLiaVoice();'));
  assert(screen.indexOf('await stopLiaVoice();')<screen.lastIndexOf('await onDone();'));
});
test('V0.247 approved French introduction texts remain unchanged',()=>{
  const i18n=fs.readFileSync(path.join(root,'src/i18n/index.ts'),'utf8');
  assert(i18n.includes("'onboarding.voiceIntro':'Bonjour, moi c’est LIA. On m’a créée pour devenir ta confidente ménagère et soulager tes journées en cuisine et bien plus encore. On fait connaissance ?'"));
  assert(i18n.includes("'lia.secondIntro':'Bon… maintenant je sais un peu mieux avec qui je vais vivre 😏. je peux t’aider à organiser les repas, les courses, le quotidien… mais tu peux aussi simplement me parler, je peux etre ta confidente et te faciliter la vie sur tes choix, tes envies et bien plus encore, tu le decouvriras. Ouvre moi ton coeur,  laisses l’appli ouvert et plus je te surprendrai! Tu verras, on apprendra à se connaître en avançant.'"));
});


test('V0.249 reminder parser understands the natural French forms used by LIA',()=>{
  const now=new Date(2026,8,18,15,0,0);
  const tomorrow=liaReminderRequest.parseLiaReminderRequest('rappelle-moi demain à 10 h d’acheter du pain',now);
  assert.equal(tomorrow.body,'acheter du pain');
  assert.equal(tomorrow.displayWhen,'demain à 10 h');
  assert.equal(tomorrow.target.getFullYear(),2026);assert.equal(tomorrow.target.getMonth(),8);assert.equal(tomorrow.target.getDate(),19);assert.equal(tomorrow.target.getHours(),10);
  const relative=liaReminderRequest.parseLiaReminderRequest('rappelle-moi dans 10 minutes de sortir le gâteau',now);
  assert.equal(relative.body,'sortir le gâteau');assert.equal(relative.displayWhen,'dans 10 minutes');assert.equal(relative.target.getTime(),now.getTime()+600000);
});

test('V0.249 reminder parser preserves understood context across a one-question clarification',()=>{
  const now=new Date(2026,8,18,15,0,0);
  const first=liaReminderRequest.parseLiaReminderRequest('rappelle-moi demain d’acheter du pain',now);
  assert.equal(first.body,'acheter du pain');assert.equal(first.target,null);assert(first.day instanceof Date);
  const completed=liaReminderRequest.parseLiaReminderRequest('à 10 h',now,{body:first.body,day:first.day,displayDay:first.displayDay});
  assert.equal(completed.body,'acheter du pain');assert.equal(completed.displayWhen,'demain à 10 h');assert.equal(completed.target.getHours(),10);
});

test('V0.249 explicit voice reminders execute locally instead of becoming model prose',()=>{
  const voice=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(voice.includes("if(request.intent==='reminder')"));
  assert(voice.includes('prepareLiaReminderFromSpeech(request.cleanedText,input.languageTag)'));
  assert(voice.includes("status:result.status==='scheduled'?'reminder_scheduled'"));
  assert(orb.includes("assistant.status==='reminder_scheduled'"));
  assert(orb.includes('await speakIfStillFree(assistant.spokenReply)'));
});

test('V0.249 an explicit reminder order is the confirmation and LIA confirms only after native scheduling succeeds',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaAssistantReminderExecution.ts'),'utf8');
  assert(source.includes("confirmed:true"));
  const scheduled=source.indexOf("if(result==='scheduled')");
  const reply=source.indexOf("status:'scheduled',spokenReply:scheduledReply",scheduled);
  assert(scheduled>=0&&reply>scheduled);
  assert(source.includes("C’est fait, je te le rappellerai"));
  assert(source.includes("if(result==='permission-denied')"));
});

test('V0.249 reminder clarification keeps the understood parts and asks only for what is missing',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaAssistantReminderExecution.ts'),'utf8');
  assert(source.includes('let pendingReminder:PendingReminder|null=null'));
  assert(source.includes('if(!parsed.body)return'));
  assert(source.includes("'Qu’est-ce que tu veux que je te rappelle ?'"));
  assert(source.includes("'À quelle heure je te le rappelle ?'"));
  assert(source.includes("'Quand veux-tu que je te le rappelle ?'"));
  assert(source.includes('continueLiaReminderClarification'));
});

test('V0.249 reminder clarification is cancellable and cleared when the voice session ends',()=>{
  const voice=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(voice.includes('liaReminderClarificationPending()'));
  assert((voice.match(/clearLiaReminderClarification\(\)/g)||[]).length>=4);
  assert(orb.includes('clearLiaReminderClarification()'));
});

test('V0.249 a successfully launched phone call gets a short spoken confirmation from LIA',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaPhoneCallCoordinator.ts'),'utf8');
  assert(source.includes("case'dialer_opened':return fr?`J’appelle ${result.contact.displayName}.`"));
});


test('V0.250 direct LIA shopping order is parsed locally with the useful item only',()=>{
  const parsed=liaAssistantDirectAction.parseLiaDirectAppAction('ajoute du lait aux courses',new Date(2026,8,18,16,40,0));
  assert.equal(parsed.recognized,true);assert.equal(parsed.missing,null);
  assert.deepStrictEqual(parsed.draft,{type:'shopping.add_item',label:'lait'});
});
test('V0.250 direct LIA planning order resolves tomorrow dinner without sending it to generic chat',()=>{
  const parsed=liaAssistantDirectAction.parseLiaDirectAppAction('mets des lasagnes demain soir au planning',new Date(2026,8,18,16,40,0));
  assert.equal(parsed.recognized,true);assert.equal(parsed.missing,null);
  assert.equal(parsed.draft.type,'planning.set_meal');assert.equal(parsed.draft.date,'2026-09-19');assert.equal(parsed.draft.mealType,'dinner');assert.equal(parsed.draft.customTitle,'lasagnes');
});
test('V0.250 direct LIA planning keeps understood fields across a one-question clarification',()=>{
  const now=new Date(2026,8,18,16,40,0);
  const first=liaAssistantDirectAction.parseLiaDirectAppAction('planifie demain soir',now);
  assert.equal(first.recognized,true);assert.equal(first.missing,'meal_title');
  const completed=liaAssistantDirectAction.parseLiaDirectAppAction('lasagnes',now,first.draft);
  assert.equal(completed.recognized,true);assert.equal(completed.missing,null);assert.equal(completed.draft.customTitle,'lasagnes');assert.equal(completed.draft.date,'2026-09-19');assert.equal(completed.draft.mealType,'dinner');
});
test('V0.250 Memo command never guesses what deictic ça refers to',()=>{
  const parsed=liaAssistantDirectAction.parseLiaDirectAppAction('garde-moi ça dans Mémos',new Date(2026,8,18,16,40,0));
  assert.equal(parsed.recognized,true);assert.equal(parsed.draft.type,'memo.create');assert.equal(parsed.draft.content,null);assert.equal(parsed.missing,'content');
});
test('V0.250 direct app actions cross the existing guarded executor only after an explicit addressed order',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaAssistantDirectActionExecution.ts'),'utf8');
  for(const expected of ["type:'shopping.add_item'","type:'planning.set_meal'","type:'memo.create'",'executeLiaAssistantApprovedAction'])assert(source.includes(expected));
  assert((source.match(/confirmed:true/g)||[]).length>=3);
  assert(source.includes("C’est fait, j’ai ajouté"));
  assert(source.includes("C’est fait, j’ai mis"));
  assert(source.includes("C’est fait, je l’ai mis dans Mémos."));
});
test('V0.250 main LIA voice flow executes recognized internal actions before generic model response',()=>{
  const voice=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  const direct=voice.indexOf('prepareLiaDirectAppActionFromSpeech');
  const defer=voice.lastIndexOf("return{status:'defer_to_response',intent:request.intent}");
  assert(direct>=0&&direct<defer);
  assert(orb.includes("assistant.status==='app_action_completed'"));
  assert(orb.includes('householdId,weekStart,demo'));
});
test('V0.250 pending internal action clarification stays eligible without repeating LIA and is cleared with the session',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(orb.includes('liaDirectAppActionClarificationPending()||liaMusicClarificationPending()||liaNavigationClarificationPending()||detectLiaDirectAddress'));
  assert((orb.match(/clearLiaDirectAppActionClarification\(\)/g)||[]).length>=3);
  assert(orb.includes('liaReminderClarificationPending()||liaTimerClarificationPending()||liaDirectAppActionClarificationPending()'));
});


test('V0.251 music commands are routed as real assistant actions without stealing ordinary app writes',()=>{
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, mets de la musique').intent,'music');
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, joue la chanson Imagine sur Spotify').intent,'music');
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, mets les lasagnes demain soir au planning').intent,'action');
  const parsed=liaMusicCommand.parseLiaMusicCommand('mets la chanson Imagine sur Spotify');
  assert.equal(parsed.recognized,true);assert.equal(parsed.query,'Imagine');assert.equal(parsed.service,'spotify');
});

test('V0.251 LIA stays quiet while identified music is active unless the user addresses her',()=>{
  const track={title:'Imagine',artist:'John Lennon',identifier:'track-1',matchedAtMs:1000};
  let state=liaMusicPresence.noteLiaMusicMatch(liaMusicPresence.createLiaMusicPresenceState(),track,1000);
  assert.equal(state.musicActive,true);
  assert.equal(liaMusicPresence.liaMaySpeakDuringMusic({musicActive:true,directlyAddressed:false,userExplicitlyRequestedComment:false}),false);
  assert.equal(liaMusicPresence.liaMaySpeakDuringMusic({musicActive:true,directlyAddressed:true,userExplicitlyRequestedComment:false}),true);
  state=liaMusicPresence.noteLiaMusicAudioEvidence(state,false,8000,6500);
  assert.equal(state.musicActive,false);assert.equal(state.discussionReady.title,'Imagine');
});

test('V0.251 music recognition is wired to ShazamKit on iOS and never invents a match in JS',()=>{
  const swift=fs.readFileSync(path.join(root,'modules/lia-sound-analysis/ios/LiaSoundAnalysisModule.swift'),'utf8');
  const wrapper=fs.readFileSync(path.join(root,'src/services/liaMusicRecognition.ts'),'utf8');
  assert(swift.includes('import ShazamKit'));
  assert(swift.includes('matchStreamingBuffer'));
  assert(swift.includes('onMusicRecognition'));
  assert(wrapper.includes('addLiaMusicRecognitionListener'));
});

test('V0.251 external phone and music handoffs preserve LIA session instead of forcing AppState shutdown',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  const dialer=fs.readFileSync(path.join(root,'src/services/liaPhoneDialer.ts'),'utf8');
  const music=fs.readFileSync(path.join(root,'src/services/liaMusicActionAdapter.ts'),'utf8');
  assert(orb.includes("if(listening&&(liaExternalHandoffActive()||nativePhoneCallActive))return;"));
  assert(dialer.includes("markLiaExternalHandoff('phone')"));
  assert(music.includes("markLiaExternalHandoff('music')"));
});

test('V0.251 iOS declares background audio mode for a user-started LIA listening session',()=>{
  const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
  assert(app.expo.ios.infoPlist.UIBackgroundModes.includes('audio'));
});

test('V0.251 cooking mode accepts direct LIA requests but does not create spontaneous kitchen chatter',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(orb.includes("(mode==='table'||mode==='cooking')"));
  assert(orb.includes("contributionUseful:mode==='table'&&!musicPresenceRef.current.musicActive"));
});

test('V0.251 recognized music becomes confirmed session context and artist anecdotes require verified research',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(orb.includes("key:'ambient_music_track'"));
  assert.equal(liaAgentTurnClassifier.classifyLiaAgentTurn('LIA, raconte-moi une anecdote sur ce chanteur').task,'verified_research');
});


test('V0.252 iOS observes real phone-call state and suspends every LIA audio path while a call exists',()=>{
  const swift=fs.readFileSync(path.join(root,'modules/lia-sound-analysis/ios/LiaSoundAnalysisModule.swift'),'utf8');
  for(const expected of ['import CallKit','CXCallObserver','CXCallObserverDelegate','systemCallActive','suspendForSystemCall','self.stopAnalysis()','self.stopRecognition(restartAnalysis: false)','self.synthesizer.stopSpeaking(at: .immediate)'])assert(swift.includes(expected));
  assert(swift.includes('self.callObserver.calls.filter { !$0.hasEnded }'));
  assert(swift.includes('if self.systemCallActive {'));
  assert(swift.includes('speech_blocked_by_call'));
});

test('V0.252 LIA never resumes from an audio interruption while the phone call is still active',()=>{
  const swift=fs.readFileSync(path.join(root,'modules/lia-sound-analysis/ios/LiaSoundAnalysisModule.swift'),'utf8');
  assert(swift.includes('interruption_ended_but_call_active'));
  assert(swift.includes('guard !self.systemCallActive else'));
  assert(swift.includes('if wasActive {'));
  assert(swift.includes('self.resumeAfterSystemCall(reason: "call_ended")'));
  assert(swift.includes('speech_recognition_resumed'));
});

test('V0.252 iPhone diagnostic exposes call suspension and resume state without changing LIA behaviour',()=>{
  const types=fs.readFileSync(path.join(root,'modules/lia-sound-analysis/src/LiaSoundAnalysis.types.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  const i18n=fs.readFileSync(path.join(root,'src/i18n/index.ts'),'utf8');
  for(const expected of ['systemCallActive:boolean','activeSystemCallCount:number','systemCallState:string'])assert(types.includes(expected));
  assert(orb.includes("locale.t('lia.audioDiagnosticCall')"));
  assert(orb.includes("getLiaAudioDiagnosticSnapshot()?.systemCallActive"));
  assert(orb.includes('liaExternalHandoffActive()||nativePhoneCallActive'));
  assert.equal((i18n.match(/'lia.audioDiagnosticCall':/g)||[]).length,4);
  assert.equal((i18n.match(/'lia.audioDiagnosticCallActive':/g)||[]).length,4);
  assert.equal((i18n.match(/'lia.audioDiagnosticCallIdle':/g)||[]).length,4);
});


test('V0.253 iPhone audio diagnostic can be exported as a bounded local trace',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaNativeAudioDiagnostics.ts'),'utf8');
  for(const expected of ["checkpoint:'V0.253'",'const TRACE_LIMIT=80','trace.splice(0,trace.length-TRACE_LIMIT)','shareLiaAudioDiagnosticReport','Paths.cache','Sharing.shareAsync'])assert(source.includes(expected));
  assert(!source.includes('householdId'));
  assert(!source.includes('phoneNumber'));
  assert(!source.includes('contact'));
});

test('V0.253 LIA diagnostic surface exposes one explicit report-share control',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  const i18n=fs.readFileSync(path.join(root,'src/i18n/index.ts'),'utf8');
  assert(orb.includes('shareLiaAudioDiagnosticReport'));
  assert(orb.includes("locale.t('lia.audioDiagnosticExport')"));
  assert.equal((i18n.match(/'lia.audioDiagnosticExport':/g)||[]).length,4);
  assert.equal((i18n.match(/'lia.audioDiagnosticExportError':/g)||[]).length,4);
});

test('V0.253 diagnostic export remains observational and cannot alter call or audio state',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaNativeAudioDiagnostics.ts'),'utf8');
  for(const forbidden of ['startLiaSoundAnalysis','stopLiaSoundAnalysis','startLiaSpeechRecognition','speakNativeLia','openURL','tel:'])assert(!source.includes(forbidden));
});


test('V0.254 LIA routes a global timer before generic app actions',()=>{
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, mets un minuteur de 12 minutes').intent,'timer');
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, arrête le minuteur').intent,'timer');
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, mets les lasagnes demain soir au planning').intent,'action');
});

test('V0.254 global timer parser understands digits and common spoken French numbers',()=>{
  assert.equal(liaAssistantTimer.parseLiaTimerCommand('mets un minuteur de 12 minutes').durationSeconds,720);
  assert.equal(liaAssistantTimer.parseLiaTimerCommand('lance un timer de dix minutes').durationSeconds,600);
  assert.equal(liaAssistantTimer.parseLiaTimerCommand('mets un minuteur de 1 heure 20 minutes').durationSeconds,4800);
  assert.equal(liaAssistantTimer.parseLiaTimerCommand('combien reste sur le minuteur').kind,'remaining');
  assert.equal(liaAssistantTimer.parseLiaTimerCommand('arrête le minuteur').kind,'cancel');
});

test('V0.254 general LIA timers persist, notify, can be queried and can be cancelled',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaAssistantTimerExecution.ts'),'utf8');
  for(const expected of ['@notre-table/lia-assistant-timers-v1','scheduleLiaAssistantAlarm','cancelLiaAssistantAlarm','listActiveLiaAssistantTimers','consumeRecentlyExpiredLiaTimers'])assert(source.includes(expected));
  assert(source.includes("status:'needs_clarification'"));
  assert(source.includes("Tu as ${rows.length} minuteurs en cours. Lequel"));
});

test('V0.254 foreground timer completion speaks only when LIA is free and never over human speech',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(orb.includes('consumeRecentlyExpiredLiaTimers(new Date())'));
  assert(orb.includes("!voiceSpeaking&&!liaAudioHumanSpeechActive(audioStateRef.current,Date.now())"));
  assert(orb.includes("assistant.status==='timer_started'"));
  assert(orb.includes('liaTimerClarificationPending()'));
});

test('V0.254 LIA keeps a creative spark without turning surprise into silent action',()=>{
  const source=fs.readFileSync(path.join(root,'src/lib/liaAgentRequest.ts'),'utf8');
  assert(source.includes('surprise the user with a smart angle'));
  assert(source.includes('Tu veux faire classique ou épater la galerie ?'));
  assert(source.includes('never turn surprise into an unrequested external or destructive action'));
});

test('V0.254 playful initiative is gated away from sensitive urgent repetitive or strict-execution moments',()=>{
  const base={sessionExplicitlyActive:true,humanSpeechActive:false,sensitiveConversation:false,urgentMoment:false,userAskedForStrictExecution:false,usefulAlternativeExists:true,creativePromptRecentlyUsed:false};
  assert.equal(liaSocial.liaCreativeInitiativeDecision(base),'offer_playful_choice');
  assert.equal(liaSocial.liaCreativeInitiativeDecision({...base,sensitiveConversation:true}),'stay_practical');
  assert.equal(liaSocial.liaCreativeInitiativeDecision({...base,urgentMoment:true}),'stay_practical');
  assert.equal(liaSocial.liaCreativeInitiativeDecision({...base,userAskedForStrictExecution:true}),'stay_practical');
  assert.equal(liaSocial.liaCreativeInitiativeDecision({...base,creativePromptRecentlyUsed:true}),'stay_practical');
  assert.equal(liaSocial.liaCreativeInitiativeDecision({...base,humanSpeechActive:true}),'stay_practical');
});



test('V0.256 direct navigation requests are routed before generic action chat',()=>{
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, emmène-moi à l’aéroport').intent,'navigation');
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, guide-moi vers Tel Aviv').intent,'navigation');
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, ajoute du lait aux courses').intent,'action');
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  assert(execution.includes("status:'navigation_requested'"));
  assert(execution.includes('liaNavigationClarificationPending()'));
});

test('V0.256 En route avec LIA opens inside Notre Table and never fabricates a route without an engine',()=>{
  const main=fs.readFileSync(path.join(root,'src/screens/MainScreen.tsx'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaNavigationScreen.tsx'),'utf8');
  const engine=fs.readFileSync(path.join(root,'src/services/liaNavigationEngine.ts'),'utf8');
  const swift=fs.readFileSync(path.join(root,'modules/lia-navigation/ios/LiaNavigationModule.swift'),'utf8');
  assert(main.includes('onNavigationRequested={destination=>setLiaNavigationDestination(destination)}'));
  assert(main.includes('<LiaNavigationScreen destination={liaNavigationDestination}'));
  assert(engine.includes("return{status:'engine_unavailable'}"));
  assert(screen.includes('Je ne vais pas inventer un itinéraire.'));
  assert(swift.includes('CLLocationManager')&&swift.includes('requestWhenInUseAuthorization')&&swift.includes('requestLocation()'));
});

test('V0.256 LIA small talk varies without turning every reply into another question',()=>{
  const a=liaPersonalPresence.liaPersonalPresenceReply('LIA, comment ça va ?','fr-FR',0);
  const b=liaPersonalPresence.liaPersonalPresenceReply('LIA, comment ça va ?','fr-FR',3*60*60*1000);
  assert(a&&b&&a!==b);
  assert(!a.includes('?')&&!b.includes('?'));
  const limitsA=liaPersonalPresence.liaPersonalPresenceReply("LIA, qu’est-ce que tu ne peux pas faire ?",'fr-FR',0);
  const limitsB=liaPersonalPresence.liaPersonalPresenceReply("LIA, qu’est-ce que tu ne peux pas faire ?",'fr-FR',6*60*60*1000);
  assert(limitsA&&limitsB&&limitsA!==limitsB);
  assert(/lacets|cheveux|parfum|café/.test(limitsA));
});

test('V0.256 provider personality avoids interrogating ordinary small talk and keeps physical-limit imagery truthful',()=>{
  const source=fs.readFileSync(path.join(root,'src/lib/liaAgentRequest.ts'),'utf8');
  assert(source.includes('Do not turn ordinary small talk into a question-and-answer interview.'));
  assert(source.includes('you cannot tie shoelaces, touch hair, smell perfume or coffee'));
});

test('V0.255 primary LIA automatically arms foreground listening while the app is active',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(orb.includes('const shouldListen=enabled&&appActive&&!manualListeningPaused&&!fullConversationOwnsSpeech;'));
  assert(orb.includes('const ambientStarted=listening||await startLiaListening();'));
  assert(orb.includes('startLiaForegroundAssistantListening(locale.languageTag,{onFinal:handleForegroundAssistantTranscript})'));
  assert(orb.includes('primaryAssistant={false} commanderContextLabel')===false);
  const commander=fs.readFileSync(path.join(root,'src/screens/CommanderScreen.tsx'),'utf8');
  assert(commander.includes('<LiaOrb primaryAssistant={false}'));
});

test('V0.255 foreground listener ignores room chatter unless LIA is addressed or a clarification is pending',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(orb.includes('if(!clarificationPending&&!directlyAddressed)return;'));
  assert(orb.includes('detectLiaDirectAddress(text,directNames).addressed'));
  assert(orb.includes('liaReminderClarificationPending()'));
  assert(orb.includes('liaTimerClarificationPending()'));
});

test('V0.255 iOS shares one live microphone stream across Sound Analysis Shazam and direct speech recognition',()=>{
  const swift=fs.readFileSync(path.join(root,'modules/lia-sound-analysis/ios/LiaSoundAnalysisModule.swift'),'utf8');
  assert(swift.includes('onForegroundSpeechTranscript'));
  assert(swift.includes('self?.foregroundRecognitionRequest?.append(buffer)'));
  assert(swift.includes('shazamSession?.matchStreamingBuffer(buffer, at: when)'));
  assert(swift.includes('analyzer.analyze(buffer, atAudioFramePosition: when.sampleTime)'));
  assert(swift.includes('foregroundAssistantEnabled'));
});

test('V0.255 LIA cannot hear her own synthesized reply as a fresh command',()=>{
  const swift=fs.readFileSync(path.join(root,'modules/lia-sound-analysis/ios/LiaSoundAnalysisModule.swift'),'utf8');
  assert(swift.includes('if state == "start"'));
  assert(swift.includes('self.stopForegroundSpeechRecognition(keepEnabled: true)'));
  assert(swift.includes('self.scheduleForegroundRecognitionRestart(afterMs: 180)'));
  assert(swift.includes('self?.synthesizer.isSpeaking != true'));
});

test('V0.255 system-call suspension remains stronger than always-ready foreground listening',()=>{
  const swift=fs.readFileSync(path.join(root,'modules/lia-sound-analysis/ios/LiaSoundAnalysisModule.swift'),'utf8');
  assert(swift.includes('foreground_assistant_waiting_for_call_end'));
  assert(swift.includes('self.stopForegroundSpeechRecognition(keepEnabled: true)'));
  assert(swift.includes('guard self.foregroundAssistantEnabled, !self.systemCallActive'));
  assert(swift.includes('self.resumeAfterSystemCall(reason: "call_ended")'));
});

test('V0.255 Android global speech recognition stays fail-closed until native audio permissions are validated',()=>{
  const android=fs.readFileSync(path.join(root,'modules/lia-sound-analysis/android/src/main/java/com/notretable/lia/LiaSoundAnalysisModule.kt'),'utf8');
  assert(android.includes('Function("isForegroundAssistantAvailable") { false }'));
  assert(android.includes('AsyncFunction("startForegroundAssistant") { _: String -> false }'));
});

test('V0.255 iOS permission copy truthfully explains foreground LIA readiness',()=>{
  const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
  const info=app.expo.ios.infoPlist;
  assert(info.NSMicrophoneUsageDescription.includes('while the app is open'));
  assert(info.NSMicrophoneUsageDescription.includes('voice commands'));
  assert(info.NSSpeechRecognitionUsageDescription.includes('voice commands'));
  assert(info.NSSpeechRecognitionUsageDescription.includes('while Notre Table is open'));
});

test('V0.257 navigation quota is thirty trips per household month and shared server-side',()=>{
  const service=fs.readFileSync(path.join(root,'src/services/liaNavigationQuota.ts'),'utf8');
  const migration=fs.readFileSync(path.join(root,'supabase/migrations/202609180025_lia_navigation_monthly_quota.sql'),'utf8');
  assert(service.includes('LIA_NAVIGATION_MONTHLY_TRIP_LIMIT=30'));
  assert(migration.includes('primary key (household_id, month_start)'));
  assert(migration.includes('trips_used >= 0 and trips_used <= 30'));
  assert(migration.includes('public.is_household_member(p_household_id)'));
  assert(migration.includes('public.family_feature_allowed(p_household_id)'));
});

test('V0.257 navigation quota cannot be forged by an authenticated mobile client',()=>{
  const migration=fs.readFileSync(path.join(root,'supabase/migrations/202609180025_lia_navigation_monthly_quota.sql'),'utf8');
  assert(migration.includes('revoke insert, update, delete on table public.lia_navigation_monthly_usage from anon, authenticated'));
  assert(migration.includes('security definer'));
  assert(migration.includes('for update'));
  assert(migration.includes('grant execute on function public.reserve_lia_navigation_trip(uuid) to authenticated'));
});

test('V0.257 a trip is never consumed while the real navigation engine is unavailable',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaNavigationScreen.tsx'),'utf8');
  const readiness=fs.readFileSync(path.join(root,'src/services/liaGoogleNavigationReadiness.ts'),'utf8');
  const readyGate=screen.indexOf("readiness?.status!=='ready'");
  const reserve=screen.indexOf('reserveLiaNavigationTrip({householdId');
  assert(readyGate>=0&&reserve>readyGate);
  assert(readiness.includes("if(!liaGoogleNavigationSdkAvailable())return{status:'sdk_unavailable'}"));
  assert(screen.includes("reservation.status==='exhausted'"));
  assert(screen.includes("reservation.status==='family_plan_required'"));
});

test('V0.257 LIA keeps quota warnings discreet instead of showing a permanent counter',()=>{
  const quota=fs.readFileSync(path.join(root,'src/services/liaNavigationQuota.ts'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaNavigationScreen.tsx'),'utf8');
  assert(quota.includes('remaining===5')&&quota.includes('remaining===2')&&quota.includes('remaining===1'));
  assert(!screen.includes('30 trajets')&&!screen.includes('/30'));
  assert(screen.includes('reservation.notice'));
});


test('V0.258 Google navigation config is optional and centralized in runtimeConfig',()=>{
  const source=fs.readFileSync(path.join(root,'src/lib/runtimeConfig.ts'),'utf8');
  assert(source.includes('EXPO_PUBLIC_GOOGLE_NAVIGATION_IOS_API_KEY'));
  assert(source.includes("reason:'GOOGLE_NAVIGATION_NOT_CONFIGURED'"));
  assert(source.includes("GOOGLE_NAVIGATION_IOS_KEY_INVALID"));
});

test('V0.258 iOS declares Google turn-by-turn background location and motion privacy requirements',()=>{
  const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
  const info=app.expo.ios.infoPlist;
  assert(info.NSLocationAlwaysAndWhenInUseUsageDescription.includes('turn-by-turn navigation'));
  assert(info.NSMotionUsageDescription.includes('routing accuracy'));
  assert(info.UIBackgroundModes.includes('audio'));
  assert(info.UIBackgroundModes.includes('location'));
});

test('V0.258 native navigation preflight is conditional on the real Google SDK and mandatory terms',()=>{
  const swift=fs.readFileSync(path.join(root,'modules/lia-navigation/ios/LiaNavigationModule.swift'),'utf8');
  assert(swift.includes('#if canImport(GoogleMaps) && canImport(GoogleNavigation)'));
  assert(swift.includes('GMSServices.provideAPIKey(apiKey)'));
  assert(swift.includes('GMSNavigationTermsAndConditionsOptions'));
  assert(swift.includes('showTermsAndConditionsDialogIfNeeded'));
  assert(swift.includes('requestAlwaysAuthorization()'));
});

test('V0.258 Google navigation readiness fails closed before SDK key terms and Always location are ready',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaGoogleNavigationReadiness.ts'),'utf8');
  assert(source.includes("status:'not_configured'"));
  assert(source.includes("status:'sdk_unavailable'"));
  assert(source.includes("status:'location_permission_denied'"));
  assert(source.includes("status:'terms_declined'"));
  assert(source.includes("status:'ready'"));
});



test('V0.259 native Expo map view is registered and remains conditional on the real Google SDK',()=>{
  const module=fs.readFileSync(path.join(root,'modules/lia-navigation/ios/LiaNavigationModule.swift'),'utf8');
  const view=fs.readFileSync(path.join(root,'modules/lia-navigation/ios/LiaNavigationMapView.swift'),'utf8');
  assert(module.includes('View(LiaNavigationMapView.self)'));
  assert(module.includes('Events("onReady", "onUnavailable", "onRouteStatus", "onProgress", "onArrival")'));
  assert(view.includes('#if canImport(GoogleMaps) && canImport(GoogleNavigation)'));
  assert(view.includes('GMSMapView(options: GMSMapViewOptions())'));
  assert(view.includes('googleMapView.isNavigationEnabled = true'));
  assert(view.includes('onUnavailable(["reason": "sdk_unavailable"])'));
});

test('V0.259 React Native map surface uses Expo native view manager instead of a web-map fallback',()=>{
  const view=fs.readFileSync(path.join(root,'modules/lia-navigation/src/LiaNavigationMapView.tsx'),'utf8');
  const index=fs.readFileSync(path.join(root,'modules/lia-navigation/index.ts'),'utf8');
  assert(view.includes("requireNativeViewManager('LiaNavigation')"));
  assert(index.includes("export {LiaNavigationMapView}"));
  assert(!view.includes('WebView'));
  assert(!view.includes('maps.google.com'));
});



test('V0.260 destination resolution stays server-side and bounded',()=>{
  const edge=fs.readFileSync(path.join(root,'supabase/functions/lia-navigation-resolve/index.ts'),'utf8');
  const service=fs.readFileSync(path.join(root,'src/services/liaNavigationDestination.ts'),'utf8');
  assert(edge.includes("Deno.env.get('GOOGLE_MAPS_API_KEY')"));
  assert(edge.includes("https://places.googleapis.com/v1/places:searchText"));
  assert(edge.includes("pageSize:3"));
  assert(edge.includes("x-goog-fieldmask"));
  assert(service.includes("supabase.functions.invoke('lia-navigation-resolve'"));
  assert(!service.includes('GOOGLE_MAPS_API_KEY'));
});

test('V0.260 ambiguous navigation destinations are surfaced instead of guessed',()=>{
  const service=fs.readFileSync(path.join(root,'src/services/liaNavigationDestination.ts'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaNavigationScreen.tsx'),'utf8');
  assert(service.includes("status:'ambiguous'"));
  assert(screen.includes("resolution?.status==='ambiguous'"));
  assert(screen.includes('resolution.candidates.map'));
});

test('V0.260 iOS starts real Google guidance only after a successful route',()=>{
  const view=fs.readFileSync(path.join(root,'modules/lia-navigation/ios/LiaNavigationMapView.swift'),'utf8');
  assert(view.includes('navigator.setDestinations(waypoints)'));
  assert(view.includes('waypoints.append(waypoint)'));
  assert(view.includes('guard status == .OK'));
  assert(view.includes('navigator.isGuidanceActive = true'));
  assert(view.includes('navigator.sendsBackgroundNotifications = true'));
  assert(view.includes('UIApplication.shared.isIdleTimerDisabled = true'));
});

test('V0.260 live navigation progress returns ETA distance and arrival to Notre Table',()=>{
  const view=fs.readFileSync(path.join(root,'modules/lia-navigation/ios/LiaNavigationMapView.swift'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaNavigationScreen.tsx'),'utf8');
  assert(view.includes('didUpdate navInfo'));
  assert(view.includes('timeToFinalDestinationSeconds'));
  assert(view.includes('distanceToFinalDestinationMeters'));
  assert(view.includes('didArriveAt waypoint'));
  assert(screen.includes('setProgress(event.nativeEvent)'));
  assert(screen.includes('updateLiaNavigationLiveSession(event.nativeEvent)'));
});

test('V0.261 native navigation publishes real maneuver instructions and rerouting state',()=>{
  const view=fs.readFileSync(path.join(root,'modules/lia-navigation/ios/LiaNavigationMapView.swift'),'utf8');
  const types=fs.readFileSync(path.join(root,'modules/lia-navigation/src/LiaNavigationMapView.tsx'),'utf8');
  assert(view.includes('instructions(forStep: step, options: options)'));
  assert(view.includes('"stepDistanceMeters": navInfo.distanceToCurrentStepMeters'));
  assert(view.includes('case .rerouting: state = "rerouting"'));
  assert(view.includes('"routeChanged": navInfo.routeChanged'));
  assert(types.includes("navState:'enroute'|'rerouting'|'stopped'|'unknown'"));
});

test('V0.261 Google guidance audio is explicit while LIA screen owns the visual experience',()=>{
  const view=fs.readFileSync(path.join(root,'modules/lia-navigation/ios/LiaNavigationMapView.swift'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaNavigationScreen.tsx'),'utf8');
  assert(view.includes('navigator.voiceGuidance = .alertsAndGuidance'));
  assert(view.includes('navigator.audioDeviceType = .bluetooth'));
  assert(view.includes('navigator.volumeLevel = .normal'));
  assert(screen.includes("progress?.navState==='rerouting'?c.rerouting"));
  assert(screen.includes('styles.instructionOverlay'));
  assert(screen.includes('progress?.instruction||progress?.roadName'));
});


test('V0.262 live navigation answers ETA distance and next maneuver from native session state',()=>{
  navigationLive.endLiaNavigationLiveSession(0);
  navigationLive.beginLiaNavigationLiveSession('Aéroport Ben Gourion',1_000_000);
  navigationLive.updateLiaNavigationLiveSession({etaSeconds:1080,distanceMeters:12400,instruction:'Tournez à droite vers Route 1',stepDistanceMeters:320,navState:'enroute'},1_000_000);
  const eta=navigationLive.liaNavigationLiveReply('on arrive quand ?', 'fr-FR',1_000_000);
  const distance=navigationLive.liaNavigationLiveReply('il reste combien de kilomètres ?', 'fr-FR',1_000_000);
  const instruction=navigationLive.liaNavigationLiveReply('je tourne où ?', 'fr-FR',1_000_000);
  assert(eta&&eta.kind==='eta'&&eta.spokenReply.includes('18 minutes'));
  assert(distance&&distance.kind==='distance'&&distance.spokenReply.includes('12,4 kilomètres'));
  assert(instruction&&instruction.kind==='instruction'&&instruction.spokenReply.includes('320 mètres')&&instruction.spokenReply.includes('Tournez à droite'));
  navigationLive.endLiaNavigationLiveSession(1_000_000);
  assert.strictEqual(navigationLive.liaNavigationLiveReply('on arrive quand ?', 'fr-FR',1_000_000),null);
});

test('V0.262 rerouting never repeats a stale maneuver and stale route data fails honestly',()=>{
  navigationLive.beginLiaNavigationLiveSession('Maison',2_000_000);
  navigationLive.updateLiaNavigationLiveSession({etaSeconds:600,distanceMeters:5000,instruction:'Tournez à gauche',stepDistanceMeters:80,navState:'rerouting'},2_000_000);
  const rerouting=navigationLive.liaNavigationLiveReply('je tourne où ?', 'fr-FR',2_000_000);
  assert(rerouting&&rerouting.kind==='instruction'&&rerouting.spokenReply.includes('recalcule'));
  const stale=navigationLive.liaNavigationLiveReply('on arrive quand ?', 'fr-FR',2_121_000);
  assert(stale&&stale.kind==='status'&&stale.spokenReply.includes('position assez récente'));
  navigationLive.endLiaNavigationLiveSession(2_121_000);
});

test('V0.262 driving suppresses spontaneous social chatter but keeps direct assistant listening',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaNavigationScreen.tsx'),'utf8');
  const voice=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  assert(orb.includes("!liaNavigationLiveSessionActive()&&(mode==='table'||mode==='cooking')"));
  assert(orb.includes('if(liaNavigationLiveSessionActive()||musicPresenceRef.current.musicActive'));
  assert(screen.includes('beginLiaNavigationLiveSession({title:selected?.title??destination'));
  assert(screen.includes('updateLiaNavigationLiveSession(event.nativeEvent)'));
  assert(screen.includes('endLiaNavigationLiveSession();setGuidanceRequested(false)'));
  assert(voice.includes("status:'navigation_status'"));
  assert(voice.includes('liaNavigationLiveReply(request.cleanedText,input.languageTag)'));
});


test('V0.263 active navigation can be stopped directly without a generic AI round trip',()=>{
  const voice=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  const control=fs.readFileSync(path.join(root,'src/services/liaNavigationLiveControl.ts'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaNavigationScreen.tsx'),'utf8');
  assert(voice.includes('requestLiaNavigationStop()'));
  assert(voice.includes("status:'navigation_stopped'"));
  assert(control.includes("kind:'stop'"));
  assert(screen.includes("if(command.kind==='stop')"));
  assert(screen.includes('endLiaNavigationLiveSession();onClose()'));
});

test('V0.263 search along route stays server-side and uses the real route polyline',()=>{
  const edge=fs.readFileSync(path.join(root,'supabase/functions/lia-navigation-along-route/index.ts'),'utf8');
  const service=fs.readFileSync(path.join(root,'src/services/liaNavigationAlongRoute.ts'),'utf8');
  const config=fs.readFileSync(path.join(root,'supabase/config.toml'),'utf8');
  assert(edge.includes('https://routes.googleapis.com/directions/v2:computeRoutes'));
  assert(edge.includes('routes.polyline.encodedPolyline'));
  assert(edge.includes('searchAlongRouteParameters'));
  assert(edge.includes('routingSummaries'));
  assert(edge.includes("Deno.env.get('GOOGLE_MAPS_API_KEY')"));
  assert(service.includes("supabase.functions.invoke('lia-navigation-along-route'"));
  assert(!service.includes('GOOGLE_MAPS_API_KEY'));
  assert(config.includes('[functions.lia-navigation-along-route]'));
  assert(config.includes('verify_jwt = true'));
});

test('V0.263 LIA asks before adding an along-route stop and native navigation resumes final destination',()=>{
  const service=fs.readFileSync(path.join(root,'src/services/liaNavigationAlongRoute.ts'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaNavigationScreen.tsx'),'utf8');
  const view=fs.readFileSync(path.join(root,'modules/lia-navigation/ios/LiaNavigationMapView.swift'),'utf8');
  assert(service.includes("status:'needs_confirmation'"));
  assert(service.includes('requestLiaNavigationStopover(candidate)'));
  assert(screen.includes('stopoverLatitude={stopover?.latitude}'));
  assert(view.includes('waypoints.append(stopWaypoint)'));
  assert(view.includes('waypoints.append(waypoint)'));
  assert(view.includes('continueToNextDestination()'));
  assert(view.includes('navigator.isGuidanceActive = true'));
});


test('V0.264 calendar is private per user and stored inside Notre Table',()=>{
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609180026_lia_personal_calendar.sql'),'utf8').toLowerCase();
  const service=fs.readFileSync(path.join(root,'src/services/liaCalendar.ts'),'utf8');
  assert(migration.includes('create table if not exists public.lia_calendar_events'));
  assert(migration.includes('user_id=auth.uid()'));
  assert(migration.includes('lia_calendar_end_after_start'));
  assert(service.includes("from('lia_calendar_events')"));
  assert(service.includes("DEMO_KEY='@notre-table/lia-calendar-demo-v1'"));
});

test('V0.264 calendar is a real LIA surface instead of an external app handoff',()=>{
  const main=fs.readFileSync(path.join(root,'src/screens/MainScreen.tsx'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaCalendarScreen.tsx'),'utf8');
  assert(main.includes("liaSurface==='calendar'?<LiaCalendarScreen"));
  assert(orb.includes('onOpenCalendar'));
  assert(screen.includes('listLiaCalendarEvents'));
  assert(!screen.includes('Linking.openURL'));
});

test('V0.264 LIA routes calendar commands before generic app actions',()=>{
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, ajoute dentiste demain à 10h dans mon calendrier').intent,'calendar');
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, qu est ce que j ai demain ?').intent,'calendar');
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  assert(execution.includes("request.intent==='calendar'"));
  assert(execution.includes("status:'calendar_open_requested'"));
  assert(execution.includes('prepareLiaCalendarFromSpeech'));
});


test('V0.265 calendar reminders belong to the event and follow its lifecycle',()=>{
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609180027_lia_calendar_reminders.sql'),'utf8').toLowerCase();
  const calendar=fs.readFileSync(path.join(root,'src/services/liaCalendar.ts'),'utf8');
  const reminder=fs.readFileSync(path.join(root,'src/services/liaCalendarReminder.ts'),'utf8');
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantCalendarExecution.ts'),'utf8');
  assert(migration.includes('reminder_minutes_before'));
  assert(migration.includes('between 0 and 10080'));
  assert(calendar.includes('reminder_minutes_before'));
  assert(reminder.includes('lia-calendar-${eventId.trim()}'));
  assert(reminder.includes('scheduleLiaAssistantAlarm'));
  assert(execution.includes('syncLiaCalendarEventReminder(event)'));
  assert(execution.includes('syncLiaCalendarEventReminder(updated,now)'));
  assert(execution.includes('cancelLiaCalendarEventReminder(rows[0].id)'));
});

test('V0.265 one calendar sentence can create an event and request its reminder',()=>{
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantCalendarExecution.ts'),'utf8');
  assert(execution.includes('parseReminderOffset'));
  assert(execution.includes('reminderMinutesBefore:reminder.minutes'));
  assert(execution.includes('notifications sont désactivées'));
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, mets dentiste demain à 10h dans mon calendrier et rappelle-moi 30 minutes avant').intent,'calendar');
});

test('V0.266 existing calendar reminder commands stay in the calendar action lane',()=>{
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantCalendarExecution.ts'),'utf8');
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, rappelle-moi 30 minutes avant mon rendez-vous dentiste').intent,'calendar');
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, rappelle-moi demain à 10 h d acheter du pain').intent,'reminder');
  assert(execution.includes('function reminderMutation'));
  assert(execution.includes('reminderMinutesBefore:rm.remove?null:rm.minutes'));
  assert(execution.includes('j’ai retiré le rappel'));
});

test('V0.266 deleting a calendar event from the visual surface also cancels its linked alarm',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaCalendarScreen.tsx'),'utf8');
  assert(screen.includes('cancelLiaCalendarEventReminder(id)'));
  assert(screen.includes('row.reminder_minutes_before!==null'));
});


test('V0.267 calendar event location can start En route avec LIA without an external app',()=>{
  const main=fs.readFileSync(path.join(root,'src/screens/MainScreen.tsx'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaCalendarScreen.tsx'),'utf8');
  assert(screen.includes('onNavigate?:(destination:string)=>void'));
  assert(screen.includes('onNavigate(row.location!)'));
  assert(main.includes('setLiaNavigationDestination(destination)'));
  assert(!screen.includes('Linking.openURL'));
});

test('V0.267 voice navigation resolves a calendar appointment before generic destination search',()=>{
  const resolver=fs.readFileSync(path.join(root,'src/services/liaCalendarNavigation.ts'),'utf8');
  const voice=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  assert(resolver.includes("status:'missing_location'"));
  assert(resolver.includes("status:'ambiguous'"));
  assert(resolver.includes('listLiaCalendarEvents'));
  assert(voice.includes('prepareLiaCalendarNavigationFromSpeech'));
  assert(voice.indexOf('prepareLiaCalendarNavigationFromSpeech')<voice.lastIndexOf('prepareLiaNavigationFromSpeech'));
});

test('V0.267 next appointment is explicit while ambiguous ordinary appointment requests fail closed',()=>{
  const resolver=fs.readFileSync(path.join(root,'src/services/liaCalendarNavigation.ts'),'utf8');
  assert(resolver.includes("if(parsed.next)event=matched[0]"));
  assert(resolver.includes("else if(matched.length===1)event=matched[0]"));
  assert(resolver.includes("J’en trouve ${matched.length}. Dis-moi lequel."));
});

test('V0.268 calendar voice writes detect certain conflicts before creating or moving',()=>{
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantCalendarExecution.ts'),'utf8');
  assert(execution.includes('async function findConflict'));
  assert(execution.includes('eventConflictsAt'));
  assert(execution.includes("kind:'conflict_create'"));
  assert(execution.includes("kind:'conflict_move'"));
  assert(execution.includes('Tu as déjà ${conflict.title}'));
  assert(execution.includes('Je mets quand même ce rendez-vous'));
});

test('V0.268 a calendar conflict requires an explicit yes or no instead of guessing',()=>{
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantCalendarExecution.ts'),'utf8');
  assert(execution.includes("if(current.kind==='conflict_create')"));
  assert(execution.includes("if(current.kind==='conflict_move')"));
  assert(execution.includes('if(no(text))'));
  assert(execution.includes('if(!yes(text))'));
  assert(execution.includes('je ne l’ajoute pas'));
  assert(execution.includes('je ne le déplace pas'));
});

test('V0.268 calendar conflict detection never invents an end time for undated-duration events',()=>{
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantCalendarExecution.ts'),'utf8');
  assert(execution.includes('row.ends_at?new Date(row.ends_at).getTime():null'));
  assert(execution.includes('return Math.abs(candidateStart-rowStart)<60_000'));
  assert(!execution.includes('candidateStart+60*60*1000'));
});


test('V0.269 calendar understands an explicit time range or duration without inventing one',()=>{
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantCalendarExecution.ts'),'utf8');
  assert(execution.includes('function parseTimeRange'));
  assert(execution.includes('function parseDuration'));
  assert(execution.includes('endTime:range.end'));
  assert(execution.includes('durationMinutes:duration.minutes'));
  assert(execution.includes('const endsAt=draftEnd(draft,startsAt)'));
});

test('V0.269 calendar conflict detection uses real interval overlap when an end is known',()=>{
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantCalendarExecution.ts'),'utf8');
  assert(execution.includes('candidateStart<rowEnd&&candidateEnd>rowStart'));
  assert(execution.includes('rowStart>=candidateStart&&rowStart<candidateEnd'));
  assert(execution.includes('findConflict(startsAt,endsAt,demo)'));
});

test('V0.269 moving a timed appointment preserves its real duration',()=>{
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantCalendarExecution.ts'),'utf8');
  assert(execution.includes('previousEnd.getTime()-previousStart.getTime()'));
  assert(execution.includes('updateLiaCalendarEvent(rows[0].id,{startsAt,endsAt},demo)'));
  assert(execution.includes('endsAt:current.endsAt'));
});


test('V0.270 bounded weekly recurrence is explicit and never infinite',()=>{
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantCalendarExecution.ts'),'utf8');
  const service=fs.readFileSync(path.join(root,'src/services/liaCalendar.ts'),'utf8');
  assert(execution.includes('function parseRecurrence'));
  assert(execution.includes('Pendant combien de semaines, ou combien de fois ?'));
  assert(execution.includes('count>=1&&count<=24'));
  assert(service.includes('count<2||count>24'));
  assert(service.includes('createLiaCalendarSeries'));
});

test('V0.270 recurring series is stored as linked concrete events and inserted atomically',()=>{
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609180028_lia_calendar_series.sql'),'utf8').toLowerCase();
  const service=fs.readFileSync(path.join(root,'src/services/liaCalendar.ts'),'utf8');
  assert(migration.includes('recurrence_series_id'));
  assert(migration.includes('recurrence_index'));
  assert(service.includes("recurrence_series_id:seriesId"));
  assert(service.includes("insert(payload).select(fields)"));
});

test('V0.270 LIA checks the whole recurring window once and asks before conflicting series',()=>{
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantCalendarExecution.ts'),'utf8');
  assert(execution.includes('async function findSeriesConflict'));
  assert(execution.includes("kind:'conflict_series_create'"));
  assert(execution.includes('Je crée quand même toute la série ?'));
  assert(execution.includes('listLiaCalendarEvents({from,to,limit:200,demo})'));
});

test('V0.270 calendar visibly identifies recurring occurrences',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/LiaCalendarScreen.tsx'),'utf8');
  assert(screen.includes('row.recurrence_series_id'));
  assert(screen.includes('↻ {c.series}'));
});


test('V0.271 deleting a recurring appointment asks scope instead of listing every occurrence',()=>{
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantCalendarExecution.ts'),'utf8');
  assert(execution.includes("kind:'delete_series_scope'"));
  assert(execution.includes('seulement le prochain rendez-vous ou toute la série'));
  assert(execution.includes("current.kind==='delete_series_scope'"));
});

test('V0.271 deleting a whole series preserves past history and removes only future occurrences',()=>{
  const service=fs.readFileSync(path.join(root,'src/services/liaCalendar.ts'),'utf8');
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantCalendarExecution.ts'),'utf8');
  assert(service.includes('deleteLiaCalendarSeries'));
  assert(service.includes(".gte('starts_at',from.toISOString())"));
  assert(execution.includes('listLiaCalendarSeriesEvents'));
  assert(execution.includes('cancelLiaCalendarEventReminder(row.id)'));
});

test('V0.271 explicit whole-series deletion remains atomic at the calendar storage boundary',()=>{
  const service=fs.readFileSync(path.join(root,'src/services/liaCalendar.ts'),'utf8');
  assert(service.includes(".eq('recurrence_series_id',clean).gte('starts_at',from.toISOString()).select('id')"));
});


test('V0.272 calendar day and week briefs stay local and deterministic',()=>{
  const brief=fs.readFileSync(path.join(root,'src/services/liaCalendarBrief.ts'),'utf8');
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantCalendarExecution.ts'),'utf8');
  assert(brief.includes("LiaCalendarBriefPeriod='today'|'week'|'next'"));
  assert(brief.includes('listLiaCalendarEvents'));
  assert(execution.includes('periodBriefReply'));
  assert(execution.includes('loadLiaCalendarBriefEvents'));
});

test('V0.272 voice routes natural day-week-next appointment questions to the calendar',()=>{
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, fais-moi le point sur ma journée').intent,'calendar');
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, qu est ce que j ai cette semaine ?').intent,'calendar');
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, c est quoi mon prochain rendez vous ?').intent,'calendar');
});

test('V0.272 real calendar appointments feed the existing Right Hand engine privately',()=>{
  const brief=fs.readFileSync(path.join(root,'src/services/liaCalendarBrief.ts'),'utf8');
  assert(brief.includes("eventKind:'appointment'"));
  assert(brief.includes("sensitivity:'personal'"));
  assert(brief.includes('liaBuildDayBrief'));
  assert(brief.includes('recurring:Boolean(event.recurrence_series_id)'));
});


test('V0.273 calendar proactivity is private bounded and never a question',()=>{
  const proactive=fs.readFileSync(path.join(root,'src/services/liaCalendarProactive.ts'),'utf8');
  assert(proactive.includes("KEY='@notre-table/lia-calendar-proactive-v1'"));
  assert(proactive.includes('state.count>=2'));
  assert(proactive.includes('delta<10*60_000||delta>3*60*60_000'));
  assert(proactive.includes('Petit rappel :'));
  assert(!proactive.includes('Tu veux'));
});

test('V0.273 proactive calendar nudge respects quiet and active navigation before surfacing',()=>{
  const proactive=fs.readFileSync(path.join(root,'src/services/liaCalendarProactive.ts'),'utf8');
  assert(proactive.includes('input.quiet||liaNavigationLiveSessionActive()'));
  assert(proactive.includes('liaDayBriefMaySurface'));
});

test('V0.273 MainScreen uses calendar nudge only when stronger reengagement did not already win',()=>{
  const main=fs.readFileSync(path.join(root,'src/screens/MainScreen.tsx'),'utf8');
  assert(main.includes('maybeLiaCalendarForegroundNudge'));
  const reengagement=main.indexOf("if(reengagement?.delivery==='in-app'&&reengagement.body)setLiaReturnGreeting(reengagement.body)");
  const nudge=main.indexOf('const calendarNudge=await maybeLiaCalendarForegroundNudge');
  assert(reengagement>=0&&nudge>reengagement);
});


test('V0.274 LIA routes fridge and pantry vision requests before generic app actions',()=>{
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, regarde ce que j ai dans le frigo').intent,'pantry_vision');
  assert.equal(liaAssistantVoice.routeLiaAssistantVoiceRequest('LIA, scanne le placard').intent,'pantry_vision');
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  assert(execution.includes("status:'pantry_vision_requested'"));
  assert(execution.includes("request.intent==='pantry_vision'"));
});

test('V0.274 a pantry vision request opens the existing cook-with flow and starts the camera once',()=>{
  const main=fs.readFileSync(path.join(root,'src/screens/MainScreen.tsx'),'utf8');
  const recipes=fs.readFileSync(path.join(root,'src/screens/RecipesScreen.tsx'),'utf8');
  const cook=fs.readFileSync(path.join(root,'src/screens/CookWithWhatIHaveScreen.tsx'),'utf8');
  assert(main.includes('onPantryVisionRequested'));
  assert(main.includes("setTab('recipes')"));
  assert(recipes.includes('liaPantryVisionRequestId'));
  assert(recipes.includes('autoStartCamera={cookWithAutoCamera}'));
  assert(cook.includes('autoCameraStarted.current=true'));
  assert(cook.includes("void runPhoto('camera')"));
});

test('V0.274 voice-triggered pantry vision reuses the guarded photo pipeline and does not auto-write pantry',()=>{
  const cook=fs.readFileSync(path.join(root,'src/screens/CookWithWhatIHaveScreen.tsx'),'utf8');
  const vision=fs.readFileSync(path.join(root,'src/lib/pantryVision.ts'),'utf8');
  assert(cook.includes('scanPantryPhoto({'));
  assert(cook.includes('mergePantryVisionItems(current,next)'));
  assert(vision.includes("if(!endpoint)throw new AppError('pantry.photo.visionNotConfigured')"));
  assert(!cook.includes('upsertPantry'));
  assert(!cook.includes('savePantry'));
});


test('V0.275 pantry vision session stores only confirmed text facts and expires',()=>{
  const session=fs.readFileSync(path.join(root,'src/services/liaPantryVisionSession.ts'),'utf8');
  assert(session.includes('TTL_MS=30*60_000'));
  assert(session.includes('filter(item=>!item.needsConfirmation)'));
  assert(session.includes('items:Array<{label:string;ingredientKey:string;quantity:number|null;unit:string|null;aisle:AisleCode}>'));
  assert(!session.includes('base64'));
  assert(!session.includes('photoUri'));
});

test('V0.275 direct followups about what LIA saw are resolved locally before generic response',()=>{
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert(execution.includes('liaPantryVisionFollowupReply'));
  assert(execution.includes("status:'pantry_vision_context'"));
  assert(orb.includes("assistant.status==='pantry_vision_context'"));
});

test('V0.275 cook-with flow updates visual session from confirmed detections and ranked recipes',()=>{
  const cook=fs.readFileSync(path.join(root,'src/screens/CookWithWhatIHaveScreen.tsx'),'utf8');
  assert(cook.includes('updateLiaPantryVisionSession({items:detected,matches})'));
  assert(cook.includes('clearLiaPantryVisionSession()'));
  assert(cook.includes("if(mode!=='photo'||photoCount<1)return"));
});


test('V0.276 pantry scan never writes without an explicit save-to-stock command',()=>{
  const stock=fs.readFileSync(path.join(root,'src/services/liaPantryVisionStock.ts'),'utf8');
  const cook=fs.readFileSync(path.join(root,'src/screens/CookWithWhatIHaveScreen.tsx'),'utf8');
  assert(stock.includes('isSaveCommand'));
  assert(stock.includes("confirmed:true"));
  assert(!cook.includes('addPantryItem('));
  assert(!cook.includes('addCachedPantryItem('));
});

test('V0.276 pantry stock write crosses the guarded assistant action boundary',()=>{
  const policy=fs.readFileSync(path.join(root,'src/lib/liaAssistantActionPolicy.ts'),'utf8');
  const executor=fs.readFileSync(path.join(root,'src/services/liaAssistantActionExecutor.ts'),'utf8');
  assert(policy.includes("type:'pantry.add_items'"));
  assert(policy.includes("if(action.type==='pantry.add_items')"));
  assert(executor.includes("checked.action.type==='pantry.add_items'"));
  assert(executor.includes('addCachedPantryItem'));
  assert(executor.includes('addPantryItem'));
});

test('V0.276 uncertain visual products and weak quantity estimates cannot silently enter stock',()=>{
  const session=fs.readFileSync(path.join(root,'src/services/liaPantryVisionSession.ts'),'utf8');
  assert(session.includes('filter(item=>!item.needsConfirmation)'));
  assert(session.includes('item.quantityConfidence>=.7?item.quantity:null'));
  assert(session.includes('item.quantityConfidence>=.7?(item.unit?.trim()||null):null'));
});

test('V0.276 partial pantry writes are reported honestly',()=>{
  const executor=fs.readFileSync(path.join(root,'src/services/liaAssistantActionExecutor.ts'),'utf8');
  const stock=fs.readFileSync(path.join(root,'src/services/liaPantryVisionStock.ts'),'utf8');
  assert(executor.includes("status:'partial'"));
  assert(stock.includes("pantry.add_items"));
  assert(stock.includes('n’ont pas pu être ajoutés'));
});


test('V0.277 visual recipe missing items can be added to shopping only by explicit command',()=>{
  const service=fs.readFileSync(path.join(root,'src/services/liaPantryVisionShopping.ts'),'utf8');
  assert(service.includes('addMissingCommand'));
  assert(service.includes("type:'shopping.add_items'"));
  assert(service.includes('confirmed:true'));
});

test('V0.277 ambiguous visual recipe shopping request asks which recipe instead of guessing',()=>{
  const service=fs.readFileSync(path.join(root,'src/services/liaPantryVisionShopping.ts'),'utf8');
  assert(service.includes('if(!match){'));
  assert(service.includes('Pour laquelle :'));
  assert(service.includes('focusedMatchTitle'));
});

test('V0.277 shopping batch action is guarded and reports partial writes honestly',()=>{
  const policy=fs.readFileSync(path.join(root,'src/lib/liaAssistantActionPolicy.ts'),'utf8');
  const executor=fs.readFileSync(path.join(root,'src/services/liaAssistantActionExecutor.ts'),'utf8');
  assert(policy.includes("type:'shopping.add_items'"));
  assert(policy.includes("if(action.type==='shopping.add_items')"));
  assert(executor.includes("checked.action.type==='shopping.add_items'"));
  assert(executor.includes("status:'partial'"));
});

test('V0.277 LIA keeps a focused visual recipe after explaining ideas or missing items',()=>{
  const session=fs.readFileSync(path.join(root,'src/services/liaPantryVisionSession.ts'),'utf8');
  assert(session.includes('focusedMatchTitle:string|null'));
  assert(session.includes('focusLiaPantryVisionMatch(best.title)'));
});


test('V0.278 a focused visual recipe can be planned without repeating its title',()=>{
  const planning=fs.readFileSync(path.join(root,'src/services/liaPantryVisionPlanning.ts'),'utf8');
  assert(planning.includes('parseDeicticPlanning'));
  assert(planning.includes('focusedMatchTitle'));
  assert(planning.includes('prepareLiaDirectAppActionFromSpeech'));
  assert(planning.includes('`mets ${title} ${rest}`'));
});

test('V0.278 ambiguous deictic recipe planning asks which recipe',()=>{
  const planning=fs.readFileSync(path.join(root,'src/services/liaPantryVisionPlanning.ts'),'utf8');
  assert(planning.includes("status:'needs_recipe'"));
  assert(planning.includes('Laquelle :'));
  assert(planning.includes('liaPantryVisionPlanningClarificationPending'));
});

test('V0.278 pantry planning reuses the existing direct planning clarification lane',()=>{
  const planning=fs.readFileSync(path.join(root,'src/services/liaPantryVisionPlanning.ts'),'utf8');
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  assert(planning.includes("result.status==='needs_clarification'"));
  assert(execution.includes('pantryPlanningPending'));
  assert(execution.includes('prepareLiaPantryVisionPlanningFromSpeech'));
});


test('V0.279 focused visual recipe can open its real Notre Table recipe surface',()=>{
  const open=fs.readFileSync(path.join(root,'src/services/liaPantryVisionRecipeOpen.ts'),'utf8');
  const main=fs.readFileSync(path.join(root,'src/screens/MainScreen.tsx'),'utf8');
  const recipes=fs.readFileSync(path.join(root,'src/screens/RecipesScreen.tsx'),'utf8');
  assert(open.includes("status:'open_requested'"));
  assert(main.includes('onPantryRecipeRequested'));
  assert(recipes.includes('liaRecipeOpenRequest'));
  assert(recipes.includes('recipes.find(item=>item.id===liaRecipeOpenRequest.recipeId)'));
});

test('V0.279 start recipe request enters the existing cooking mode instead of creating a parallel screen',()=>{
  const recipes=fs.readFileSync(path.join(root,'src/screens/RecipesScreen.tsx'),'utf8');
  assert(recipes.includes('if(liaRecipeOpenRequest.startCooking)setCooking(recipe)'));
  assert(recipes.includes('<CookingModeScreen recipe={cooking}'));
});

test('V0.279 ambiguous open-or-start recipe request asks which recipe',()=>{
  const open=fs.readFileSync(path.join(root,'src/services/liaPantryVisionRecipeOpen.ts'),'utf8');
  assert(open.includes("status:'needs_recipe'"));
  assert(open.includes('Laquelle :'));
  assert(open.includes('liaPantryVisionRecipeOpenClarificationPending'));
});


test('V0.280 cooking session is controlled through the global LIA voice lane',()=>{
  const session=fs.readFileSync(path.join(root,'src/services/liaCookingSession.ts'),'utf8');
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert(session.includes('setLiaCookingSessionVoiceHandler'));
  assert(execution.includes('runLiaCookingSessionVoiceCommand'));
  assert(screen.includes('setLiaCookingSessionVoiceHandler'));
});

test('V0.280 cooking commands reuse existing bounded recipe navigation and timer runtime',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert(screen.includes('runLiaCookingCommand'));
  assert(screen.includes("result.action.kind==='repeat_step'"));
  assert(screen.includes("result.action.kind==='next_step'"));
  assert(screen.includes("result.action.kind==='timer_remaining'"));
  assert(screen.includes("result.action.kind==='start_timer'"));
});

test('V0.280 cooking music falls through to global music and silence does not answer back',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert(screen.includes("result.action.kind==='unknown'||result.action.kind==='music'"));
  assert(screen.includes("result.action.kind==='stop_voice')return{handled:true,spokenReply:null}"));
});


test('V0.281 recipe timer cancellation wins over generic silence and stays local',()=>{
  const action=liaCookingCompanion.liaHandsFreeCookingAction('LIA, annule le minuteur');
  assert.equal(action.kind,'cancel_timer');
  assert.equal(action.safeToExecuteLocally,true);
  const state={stepIndex:1,stepCount:3,timerEndsAtMs:121000,voiceShouldStop:false};
  const next=liaCookingCompanion.applyLiaHandsFreeCookingAction({state,action,nowMs:1000});
  assert.equal(next.timerEndsAtMs,null);
  assert.equal(next.voiceShouldStop,false);
  const reply=liaCookingCompanion.liaCookingVoiceReply({action,currentStep:'',stepIndex:1,stepCount:3,timerRemainingSeconds:120});
  assert.equal(reply.kind,'timer_cancelled');
});

test('V0.281 cooking understands natural remaining-time and previous-step commands',()=>{
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('LIA, il reste combien ?'),'timer_remaining');
  const previous=liaCookingCompanion.liaHandsFreeCookingAction("LIA, étape précédente");
  assert.equal(previous.kind,'previous_step');
  assert.equal(liaCookingCompanion.applyLiaHandsFreeCookingAction({state:{stepIndex:2,stepCount:4,timerEndsAtMs:null,voiceShouldStop:false},action:previous,nowMs:1000}).stepIndex,1);
  assert.equal(liaCookingCompanion.applyLiaHandsFreeCookingAction({state:{stepIndex:0,stepCount:4,timerEndsAtMs:null,voiceShouldStop:false},action:previous,nowMs:1000}).stepIndex,0);
  const first=liaCookingCompanion.liaCookingVoiceReply({action:previous,currentStep:'Première étape',stepIndex:0,stepCount:4,timerRemainingSeconds:null});
  assert.equal(first.kind,'first_step');
});

test('V0.281 global LIA cooking handler exposes previous step and recipe-timer cancellation',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert(screen.includes("result.action.kind==='cancel_timer'"));
  assert(screen.includes("result.action.kind==='previous_step'"));
  assert(screen.includes("j’annule le minuteur de la recette"));
  assert(screen.includes("C’est la première étape."));
});


test('V0.282 cooking voice controls the ingredient panel hands-free',()=>{
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('LIA, montre-moi les ingrédients'),'show_ingredients');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('cache les ingrédients'),'hide_ingredients');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('show the ingredients'),'show_ingredients');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingAction('montre les ingrédients').safeToExecuteLocally,true);
});

test('V0.282 cooking voice can request the real ingredient list without inventing data',()=>{
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('LIA, lis-moi les ingrédients'),'list_ingredients');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('quels sont les ingrédients ?'),'list_ingredients');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent("c'est quoi les ingrédients ?"),'list_ingredients');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingAction('read the ingredients').safeToExecuteLocally,true);
});

test('V0.282 cooking screen applies ingredient voice commands inside the existing global LIA session',()=>{
  const source=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert.ok(source.includes("result.action.kind==='show_ingredients'||result.action.kind==='list_ingredients'"));
  assert.ok(source.includes("if(result.action.kind==='hide_ingredients')setIngredientsOpen(false)"));
  assert.ok(source.includes("if(result.action.kind==='list_ingredients')"));
  assert.ok(source.includes('setLiaCookingSessionVoiceHandler'));
});

test('V0.283 cooking understands natural recipe-progress questions before timer shortcuts',()=>{
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent("LIA, on en est où ?"),'step_status');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent("je suis à quelle étape ?"),'step_status');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent("il reste combien d'étapes ?"),'step_status');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('LIA, il reste combien ?'),'timer_remaining');
});

test('V0.283 recipe-progress status is local and returns the real current step',()=>{
  const action=liaCookingCompanion.liaHandsFreeCookingAction('quelle étape ?');
  assert.equal(action.kind,'step_status');assert.equal(action.safeToExecuteLocally,true);
  const reply=liaCookingCompanion.liaCookingVoiceReply({action,currentStep:'Ajoute les tomates.',stepIndex:1,stepCount:4,timerRemainingSeconds:null});
  assert.equal(reply.kind,'step_status');assert.equal(reply.textValue,'Ajoute les tomates.');
});

test('V0.283 global cooking handler speaks real step index and instruction',()=>{
  const source=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert.ok(source.includes("if(result.action.kind==='step_status')"));
  assert.ok(source.includes('Tu es à l’étape ${stepNumber} sur ${steps.length}'));
  assert.ok(source.includes('No steps are entered for this recipe.'));
});

test('V0.284 cooking understands natural completed-step phrases',()=>{
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent("LIA, j’ai fini cette étape"),'complete_step');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent("étape terminée"),'complete_step');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('done with this step'),'complete_step');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingAction("j'ai terminé l'étape").safeToExecuteLocally,true);
});

test('V0.284 completed step advances only within real recipe bounds',()=>{
  const action=liaCookingCompanion.liaHandsFreeCookingAction("j'ai fini cette étape");
  const advanced=liaCookingCompanion.applyLiaHandsFreeCookingAction({state:{stepIndex:1,stepCount:4,timerEndsAtMs:null,voiceShouldStop:false},action,nowMs:1000});
  assert.equal(advanced.stepIndex,2);
  const bounded=liaCookingCompanion.applyLiaHandsFreeCookingAction({state:{stepIndex:3,stepCount:4,timerEndsAtMs:null,voiceShouldStop:false},action,nowMs:1000});
  assert.equal(bounded.stepIndex,3);
  const reply=liaCookingCompanion.liaCookingVoiceReply({action,currentStep:'Terminer.',stepIndex:3,stepCount:4,timerRemainingSeconds:null});
  assert.equal(reply.kind,'last_step');
});

test('V0.284 global cooking handler narrates the next real step after completion',()=>{
  const source=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert.ok(source.includes("if(result.action.kind==='complete_step')"));
  assert.ok(source.includes("C’était la dernière étape."));
  assert.ok(source.includes('return{handled:true,spokenReply:steps[nextIndex]??null}'));
});

test('V0.285 cooking closes only on an explicit recipe-finish command',()=>{
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent("LIA, j’ai fini la recette"),'finish_recipe');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('termine la recette'),'finish_recipe');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('quitte le mode cuisine'),'finish_recipe');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('finish the recipe'),'finish_recipe');
  assert.notEqual(liaCookingCompanion.liaHandsFreeCookingIntent("j’ai fini"),'finish_recipe');
});

test('V0.285 recipe-finish command is local and does not invent recipe state',()=>{
  const action=liaCookingCompanion.liaHandsFreeCookingAction('ferme la recette');
  assert.equal(action.kind,'finish_recipe');assert.equal(action.safeToExecuteLocally,true);
  const state={stepIndex:2,stepCount:5,timerEndsAtMs:10000,voiceShouldStop:false};
  assert.deepEqual(liaCookingCompanion.applyLiaHandsFreeCookingAction({state,action,nowMs:1000}),state);
});

test('V0.285 global cooking handler exits the existing surface hands-free',()=>{
  const source=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert.ok(source.includes("if(result.action.kind==='finish_recipe')"));
  assert.ok(source.includes('onClose();'));
  assert.ok(source.includes("C’est terminé. Bon appétit !"));
});

test('V0.286 cooking can target a real step by number or spoken number',()=>{
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent("LIA, va à l’étape 4"),'go_to_step');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent("reviens à l’étape deux"),'go_to_step');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('go to step three'),'go_to_step');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingStepNumber('va à l’étape 12'),12);
  assert.equal(liaCookingCompanion.liaHandsFreeCookingStepNumber('reviens à l’étape deux'),2);
});

test('V0.286 direct step navigation never clamps an invalid requested step',()=>{
  const valid=liaCookingCompanion.liaHandsFreeCookingAction("va à l'étape 3");
  assert.equal(valid.kind,'go_to_step');assert.equal(valid.stepNumber,3);
  const state={stepIndex:0,stepCount:4,timerEndsAtMs:null,voiceShouldStop:false};
  assert.equal(liaCookingCompanion.applyLiaHandsFreeCookingAction({state,action:valid,nowMs:1000}).stepIndex,2);
  const invalid={...valid,stepNumber:9};
  assert.equal(liaCookingCompanion.applyLiaHandsFreeCookingAction({state,action:invalid,nowMs:1000}).stepIndex,0);
});

test('V0.286 global cooking handler reads the targeted step and reports real bounds',()=>{
  const source=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert.ok(source.includes("if(result.action.kind==='go_to_step')"));
  assert.ok(source.includes('Cette recette a ${steps.length} étape'));
  assert.ok(source.includes('spokenReply:steps[target-1]??null'));
});


test('V0.287 cooking recognizes a precise ingredient quantity question without stealing timer or step questions',()=>{
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('LIA, combien de farine ?'),'ingredient_quantity');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent("il faut combien d’œufs ?"),'ingredient_quantity');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('how much milk do I need?'),'ingredient_quantity');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('il reste combien ?'),'timer_remaining');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent("il reste combien d'étapes ?"),'step_status');
});

test('V0.287 ingredient quantity lookup matches only the real recipe ingredient key',()=>{
  const items=[
    {name:'Farine',quantity:250,unit:'g',ingredient_key:'flour'},
    {name:'Lait',quantity:300,unit:'ml',ingredient_key:'milk'},
  ];
  const flour=liaCookingCompanion.liaCookingIngredientMatches('farine',items);
  assert.equal(flour.length,1);assert.equal(flour[0].quantity,250);
  assert.equal(liaCookingCompanion.liaCookingIngredientMatches('sucre',items).length,0);
  const action=liaCookingCompanion.liaHandsFreeCookingAction('quelle quantité de farine ?');
  assert.equal(action.kind,'ingredient_quantity');assert.equal(action.ingredientQuery,'farine');assert.equal(action.safeToExecuteLocally,true);
});

test('V0.287 cooking screen answers from the recipe and refuses to invent or merge ambiguous quantities',()=>{
  const source=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert.ok(source.includes("if(result.action.kind==='ingredient_quantity')"));
  assert.ok(source.includes('liaCookingIngredientMatches(query,recipe.ingredients??[])'));
  assert.ok(source.includes("Je ne vois pas ${query||'cet ingrédient'} dans cette recette."));
  assert.ok(source.includes('apparaît plusieurs fois dans la recette'));
  assert.ok(source.includes('mais sans quantité précise.'));
});


test('V0.288 cooking extracts a bounded serving target without polluting the ingredient name',()=>{
  assert.equal(liaCookingCompanion.liaHandsFreeCookingServingTarget('combien de farine pour 6 personnes ?'),6);
  assert.equal(liaCookingCompanion.liaHandsFreeCookingServingTarget('how much milk for six people?'),6);
  assert.equal(liaCookingCompanion.liaHandsFreeCookingServingTarget('cuanta harina para 8 personas?'),8);
  assert.equal(liaCookingCompanion.liaHandsFreeCookingServingTarget('combien de farine pour 99 personnes ?'),null);
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIngredientQuery('combien de farine pour 6 personnes ?'),'farine');
  const action=liaCookingCompanion.liaHandsFreeCookingAction('combien de farine pour 6 personnes ?');
  assert.equal(action.kind,'ingredient_quantity');assert.equal(action.ingredientQuery,'farine');assert.equal(action.targetServings,6);
});

test('V0.288 serving scaling stays a pure proportion from the real recipe base',()=>{
  const baseQuantity=250,baseServings=4,targetServings=6;
  assert.equal(baseQuantity*targetServings/baseServings,375);
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('combien de farine pour 6 personnes ?'),'ingredient_quantity');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent("il reste combien d'étapes ?"),'step_status');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('il reste combien ?'),'timer_remaining');
});

test('V0.288 cooking screen scales exact data and asks permission before any approximation',()=>{
  const source=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert.ok(source.includes('ingredient.quantity*targetServings/recipe.portions'));
  assert.ok(source.includes('recipe.portions<=0'));
  assert.ok(source.includes('Tu veux que je te fasse une approximation ?'));
  assert.ok(source.includes('approximationPendingRef.current=approximationRequest'));
  assert.ok(source.includes('clarificationPending:true'));
  assert.ok(source.includes('Pour ${targetServings} personnes, il faut ${scaledLabel} de ${ingredient.name}.'));
});

test('V0.288 cooking approximation requires an explicit yes and accepts a clear no',()=>{
  assert.equal(liaCookingCompanion.liaCookingApproximationConsent('oui'),'yes');
  assert.equal(liaCookingCompanion.liaCookingApproximationConsent('vas-y'),'yes');
  assert.equal(liaCookingCompanion.liaCookingApproximationConsent('yes'),'yes');
  assert.equal(liaCookingCompanion.liaCookingApproximationConsent('non'),'no');
  assert.equal(liaCookingCompanion.liaCookingApproximationConsent('peut-être'),'unknown');
});

test('V0.288 approximation consent stays inside the global LIA clarification lane',()=>{
  const session=fs.readFileSync(path.join(root,'src/services/liaCookingSession.ts'),'utf8');
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert.ok(session.includes('liaCookingSessionClarificationPending'));
  assert.ok(session.includes('clearLiaCookingSessionClarification'));
  assert.ok(execution.includes("status:'cooking_approximation_requested'"));
  assert.ok(orb.includes('liaCookingSessionClarificationPending()'));
  assert.ok(orb.includes("key:'cooking_approximation_permission',value:'explicit_yes'"));
  assert.ok(orb.includes('Ne présente jamais cette estimation comme une quantité écrite dans la recette.'));
});


test('V0.289 cooking recognizes full ingredient-list scaling without stealing single-ingredient queries',()=>{
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('LIA, adapte les ingrédients pour 6 personnes'),'scale_ingredients');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('adjust the ingredients for 8 servings'),'scale_ingredients');
  assert.equal(liaCookingCompanion.liaHandsFreeCookingScaleIngredientsTarget('adapte les ingrédients pour 6 personnes'),6);
  const action=liaCookingCompanion.liaHandsFreeCookingAction('adapte les ingrédients pour 6 personnes');
  assert.equal(action.kind,'scale_ingredients');assert.equal(action.targetServings,6);assert.equal(action.safeToExecuteLocally,true);
  assert.equal(liaCookingCompanion.liaHandsFreeCookingIntent('combien de farine pour 6 personnes ?'),'ingredient_quantity');
});

test('V0.289 full-list scaling keeps exact values local and asks before approximating missing quantities',()=>{
  const source=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert.ok(source.includes("if(result.action.kind==='scale_ingredients')"));
  assert.ok(source.includes('ingredient.quantity*targetServings/recipe.portions'));
  assert.ok(source.includes("scope:'ingredient_list'"));
  assert.ok(source.includes('Je peux calculer exactement :'));
  assert.ok(source.includes('Tu veux que je fasse une approximation pour ce qui manque ?'));
  assert.ok(source.includes('clarificationPending:true'));
});

test('V0.289 list approximation carries real recipe data and remains explicitly consent-gated',()=>{
  const session=fs.readFileSync(path.join(root,'src/services/liaCookingSession.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert.ok(session.includes("scope:'ingredient'|'ingredient_list'"));
  assert.ok(session.includes('ingredients?:LiaCookingApproximationItem[]'));
  assert.ok(orb.includes("const listScope=approximation.scope==='ingredient_list'"));
  assert.ok(orb.includes('N’approxime que les quantités manquantes'));
  assert.ok(orb.includes("key:'cooking_approximation_permission',value:'explicit_yes'"));
});


test('V0.290 cooking parses short serving follow-ups without treating bare numbers as commands',()=>{
  assert.equal(liaCookingCompanion.liaCookingServingFollowupTarget('et pour 8 ?'),8);
  assert.equal(liaCookingCompanion.liaCookingServingFollowupTarget('and for six?'),6);
  assert.equal(liaCookingCompanion.liaCookingServingFollowupTarget('y para 10 personas?'),10);
  assert.equal(liaCookingCompanion.liaCookingServingFollowupTarget('8'),null);
  assert.equal(liaCookingCompanion.liaCookingServingFollowupTarget('il reste 8 minutes'),null);
});

test('V0.290 cooking reuses only a recent ingredient-or-list serving context',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert.ok(screen.includes("lastServingQueryRef=useRef<{kind:'ingredient_quantity'|'scale_ingredients'"));
  assert.ok(screen.includes('now-previousServingQuery.atMs<=120_000'));
  assert.ok(screen.includes('adapte les ingrédients pour ${followupTarget} personnes'));
  assert.ok(screen.includes('combien de ${previousServingQuery.ingredientQuery} pour ${followupTarget} personnes'));
  assert.ok(screen.includes('Tu veux adapter quel ingrédient, ou toute la liste ?'));
});

test('V0.290 brief serving follow-up is accepted by the global LIA lane and expires instead of becoming permanent listening context',()=>{
  const session=fs.readFileSync(path.join(root,'src/services/liaCookingSession.ts'),'utf8');
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert.ok(session.includes('liaCookingSessionFollowupActive'));
  assert.ok(session.includes('markLiaCookingSessionFollowupWindow'));
  assert.ok(session.includes('followupUntilMs=0;\n  const result=handler?await handler'));
  assert.ok(execution.includes('cookingFollowupActive&&!cookingPending&&!request.directAddressed'));
  assert.ok(orb.includes('liaCookingSessionFollowupActive()'));
});


test('V0.291 cooking parses connected ingredient follow-ups but not arbitrary bare ingredient phrases',()=>{
  assert.equal(liaCookingCompanion.liaCookingIngredientFollowupQuery('et le lait ?'),'lait');
  assert.equal(liaCookingCompanion.liaCookingIngredientFollowupQuery('and the milk?'),'milk');
  assert.equal(liaCookingCompanion.liaCookingIngredientFollowupQuery('y la leche?'),'leche');
  assert.equal(liaCookingCompanion.liaCookingIngredientFollowupQuery('le lait'),null);
  assert.equal(liaCookingCompanion.liaCookingIngredientFollowupQuery('et pour 8 ?'),null);
});

test('V0.291 short ingredient follow-up reuses the previous serving target only for a real recipe ingredient',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert.ok(screen.includes('targetServings:number|null;atMs:number'));
  assert.ok(screen.includes('liaCookingIngredientMatches(followupIngredient,recipe.ingredients??[]).length>0'));
  assert.ok(screen.includes('previousServingQuery.targetServings!==null'));
  assert.ok(screen.includes('combien de ${realFollowupIngredient} pour ${previousServingQuery.targetServings} personnes'));
});

test('V0.291 a recognized ingredient follow-up refreshes the same bounded serving context instead of creating new state',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/CookingModeScreen.tsx'),'utf8');
  assert.ok(screen.includes("lastServingQueryRef.current={kind:'ingredient_quantity'"));
  assert.ok(screen.includes('targetServings:result.action.targetServings??null'));
  assert.ok(screen.includes('markLiaCookingSessionFollowupWindow()'));
  assert.ok(!screen.includes('AsyncStorage'));
});


test('V0.292 LIA recognizes an explicit natural missing-item request to shopping',()=>{
  const parsed=liaAssistantDirectAction.parseLiaDirectAppAction('il me manque du lait, ajoute-le aux courses');
  assert.equal(parsed.recognized,true);
  if(!parsed.recognized)throw new Error('expected recognized shopping action');
  assert.equal(parsed.draft.type,'shopping.add_item');
  if(parsed.draft.type!=='shopping.add_item')throw new Error('expected shopping.add_item');
  assert.equal(parsed.draft.label,'lait');
  assert.equal(parsed.missing,null);
});

test('V0.292 natural shopping phrasing keeps write intent explicit and does not act on a plain shortage statement',()=>{
  assert.equal(liaAssistantDirectAction.parseLiaDirectAppAction('il me manque du lait').recognized,false);
  assert.equal(liaAssistantDirectAction.parseLiaDirectAppAction("je n'ai plus d'œufs").recognized,false);
  const parsed=liaAssistantDirectAction.parseLiaDirectAppAction("je n'ai plus d'œufs, mets-les dans la liste de courses");
  assert.equal(parsed.recognized,true);
  if(!parsed.recognized||parsed.draft.type!=='shopping.add_item')throw new Error('expected shopping add');
  assert.equal(parsed.draft.label,'œufs');
});

test('V0.292 natural missing-item command still uses the existing approved shopping action executor',()=>{
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantDirectActionExecution.ts'),'utf8');
  assert.ok(execution.includes("draft.type==='shopping.add_item'"));
  assert.ok(execution.includes("type:'shopping.add_item'"));
  assert.ok(execution.includes('executeLiaAssistantApprovedAction'));
});


test('V0.293 a plain shortage is context only and a reference add remains an explicit write request',()=>{
  assert.equal(liaAssistantDirectAction.liaShoppingShortageMention('il me manque du lait'),'lait');
  assert.equal(liaAssistantDirectAction.liaShoppingShortageMention("je n'ai plus d'œufs"),'œufs');
  assert.equal(liaAssistantDirectAction.liaShoppingShortageMention('il me manque du lait, ajoute-le aux courses'),null);
  assert.equal(liaAssistantDirectAction.liaShoppingReferenceAddRequested('ajoute-le aux courses'),true);
  assert.equal(liaAssistantDirectAction.liaShoppingReferenceAddRequested('mets-les dans la liste de courses'),true);
  const unresolved=liaAssistantDirectAction.parseLiaDirectAppAction('ajoute-le aux courses');
  assert.equal(unresolved.recognized,true);
  if(!unresolved.recognized)throw new Error('expected shopping reference action');
  assert.equal(unresolved.draft.type,'shopping.add_item');
  assert.equal(unresolved.missing,'label');
});

test('V0.293 shortage context is ephemeral and execution still crosses the approved shopping action boundary',()=>{
  const execution=fs.readFileSync(path.join(root,'src/services/liaAssistantDirectActionExecution.ts'),'utf8');
  assert.ok(execution.includes('expiresAtMs:nowMs+120_000'));
  assert.ok(execution.includes('liaShoppingShortageFollowupActive'));
  assert.ok(execution.includes('liaShoppingReferenceAddRequested(text)'));
  assert.ok(execution.includes("draft:{type:'shopping.add_item',label:current.label}"));
  assert.ok(execution.includes('executeLiaAssistantApprovedAction'));
  assert.ok(!execution.includes('AsyncStorage'));
});

test('V0.293 the global LIA lane accepts only the brief explicit shortage follow-up without a second microphone pipeline',()=>{
  const voice=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert.ok(voice.includes('noteLiaShoppingShortageFromSpeech'));
  assert.ok(voice.includes('continueLiaShoppingShortageFollowup'));
  assert.ok(voice.includes("status:'app_action_context_noted'"));
  assert.ok(voice.includes('if(request.directAddressed)clearLiaShoppingShortageFollowup()'));
  assert.ok(voice.includes('clearLiaShoppingShortageFollowup()'));
  assert.ok(orb.includes('liaShoppingShortageFollowupActive()'));
});


test('V0.294 family board shows the five named meal columns with live green ticks and recipient rows',()=>{
  const screen=fs.readFileSync(path.join(root,'src/screens/LightParticipationScreen.tsx'),'utf8');
  assert.ok(screen.includes("icon:'🍲'")&&screen.includes("icon:'🍕'")&&screen.includes("icon:'🍝'")&&screen.includes("icon:'🍣'")&&screen.includes("icon:'🥡'"));
  assert.ok(screen.includes('summary.recipients.map'));
  assert.ok(screen.includes('recipient.desire===option.key'));
  assert.ok(screen.includes("color:'#2f8a4b'"));
  assert.ok(screen.includes('summary.desires[option.key]'));
});

test('V0.294 public family response link is editable until expiry with free note and separate take-charge checkbox',()=>{
  const edge=fs.readFileSync(path.join(root,'supabase','functions','light-response','index.ts'),'utf8');
  const sql=fs.readFileSync(path.join(root,'supabase','migrations','202609190029_lia_contextual_family_guidance.sql'),'utf8');
  assert.ok(edge.includes("selected=selected===o?null:o"));
  assert.ok(edge.includes("takesCharge=!takesCharge"));
  assert.ok(edge.includes("id=\"note\""));
  assert.ok(edge.includes("setInterval(()=>void refreshBoard(),4000)"));
  assert.ok(sql.includes('takes_charge boolean not null default false'));
  assert.ok(sql.includes('Keep the same opaque token alive until its existing expiry'));
  assert.ok(sql.includes('set consumed_at=null'));
});

test('V0.294 family members see the same token-scoped named board without phone numbers',()=>{
  const edge=fs.readFileSync(path.join(root,'supabase','functions','light-response','index.ts'),'utf8');
  const sql=fs.readFileSync(path.join(root,'supabase','migrations','202609190029_lia_contextual_family_guidance.sql'),'utf8');
  assert.ok(edge.includes("action:'board'"));
  assert.ok(edge.includes("admin.rpc('get_light_family_decisions'"));
  assert.ok(sql.includes("'recipients',v_recipients"));
  assert.ok(sql.includes("'member_name',m.display_name"));
  const board=(sql.match(/create or replace function public\.get_light_family_decisions[\s\S]*?end; \$\$;/i)||[])[0]||'';
  assert.ok(!board.includes("'phone_number'"));
});

test('V0.294 LIA explains Family Message once, then can guide a stuck organizer one step at a time',()=>{
  const guidance=fs.readFileSync(path.join(root,'src/services/liaContextualGuidance.ts'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/LightParticipationScreen.tsx'),'utf8');
  assert.ok(guidance.includes('@notre-table/lia-contextual-guidance-seen-v1'));
  assert.ok(guidance.includes('family_message_first_use'));
  assert.ok(guidance.includes("step:'prepare'|'share'"));
  assert.ok(screen.includes('emitLiaFamilyMessageFirstUse'));
  assert.ok(screen.includes('25_000'));
  assert.ok(screen.includes("kind:'family_message_help'"));
});

test('V0.294 LIA reacts to a real home-cooked choice with the agreed easy-or-impress tone',()=>{
  const guidance=fs.readFileSync(path.join(root,'src/services/liaContextualGuidance.ts'),'utf8');
  const screen=fs.readFileSync(path.join(root,'src/screens/LightParticipationScreen.tsx'),'utf8');
  assert.ok(guidance.includes('faire facile ou épater la galerie'));
  assert.ok(guidance.includes('attendre les autres'));
  assert.ok(screen.includes("kind:'family_choice_changed'"));
  assert.ok(screen.includes('before?.desire!==recipient.desire'));
});

test('V0.294 take-charge informs the organizer, suppresses organizational prompting in LIA context, and keeps humor optional',()=>{
  const guidance=fs.readFileSync(path.join(root,'src/services/liaContextualGuidance.ts'),'utf8');
  const appContext=fs.readFileSync(path.join(root,'src/services/liaAssistantAppContext.ts'),'utf8');
  const objective=fs.readFileSync(path.join(root,'src/lib/liaAssistantObjective.ts'),'utf8');
  assert.ok(guidance.includes('évite les relances d’organisation'));
  assert.ok(guidance.includes('n’oubliez pas de m’inviter à table'));
  assert.ok(guidance.includes('pas systématiquement'));
  assert.ok(appContext.includes('app.family_meal_decisions'));
  assert.ok(appContext.includes('pris en charge par'));
  assert.ok(objective.includes("if(planning){addRead(reads,'planning.read');addRead(reads,'family.read');}"));
});

test('V0.294 global family monitor keeps LIA aware of replies even when Message famille is closed',()=>{
  const monitor=fs.readFileSync(path.join(root,'src/services/liaFamilyMealMonitor.ts'),'utf8');
  const main=fs.readFileSync(path.join(root,'src/screens/MainScreen.tsx'),'utf8');
  assert.ok(monitor.includes('fetchLightMealDecisionSnapshots'));
  assert.ok(monitor.includes('subscribeLightMealResponses'));
  assert.ok(monitor.includes("kind:'family_take_charge_changed'"));
  assert.ok(main.includes('startLiaFamilyMealDecisionMonitor'));
});

test('V0.294 contextual guidance uses the existing LIA voice and model lane, not a parallel assistant',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert.ok(orb.includes('addLiaContextualGuidanceListener'));
  assert.ok(orb.includes('generateLiaTableResponse'));
  assert.ok(orb.includes('liaContextualGuidanceFallback'));
  assert.ok(orb.includes('speakLia(reply'));
});


test('V0.294 progressive profile keeps birthdays out of mandatory onboarding and stores year only when provided',()=>{
  const legacyForm=fs.readFileSync(path.join(root,'supabase','migrations','202609160016_family_roster_form.sql'),'utf8');
  const progressive=fs.readFileSync(path.join(root,'supabase','migrations','202609190030_lia_progressive_profile_enrichment.sql'),'utf8');
  assert.ok(!legacyForm.includes('birthday_month'));
  assert.ok(progressive.includes('birthday_month smallint'));
  assert.ok(progressive.includes('birthday_day smallint'));
  assert.ok(progressive.includes('birth_year smallint'));
  assert.ok(progressive.includes('p_year integer default null'));
  assert.ok(progressive.includes("p_subject_kind not in ('profile','light_member')"));
});

test('V0.294 LIA enriches one family detail slowly and respects later or refusal instead of interrogating',()=>{
  const enrichment=fs.readFileSync(path.join(root,'src/services/liaProfileEnrichment.ts'),'utf8');
  const main=fs.readFileSync(path.join(root,'src/screens/MainScreen.tsx'),'utf8');
  assert.ok(enrichment.includes('GLOBAL_GAP_MS=48*60*60*1000'));
  assert.ok(enrichment.includes('TARGET_REASK_MS=14*24*60*60*1000'));
  assert.ok(enrichment.includes('LATER_SNOOZE_MS=30*24*60*60*1000'));
  assert.ok(enrichment.includes('plus tard'));
  assert.ok(enrichment.includes('je ne veux pas'));
  assert.ok(main.includes('90_000'));
  assert.ok(main.includes('liaCookingSessionActive()'));
  assert.ok(main.includes('liaQuietNow(quiet)'));
});

test('V0.294 birthday question stays simple, then LIA may joke only after the answer is saved',()=>{
  const guidance=fs.readFileSync(path.join(root,'src/services/liaContextualGuidance.ts'),'utf8');
  const enrichment=fs.readFileSync(path.join(root,'src/services/liaProfileEnrichment.ts'),'utf8');
  const voice=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert.ok(guidance.includes('Ne fais pas encore la blague : attends d’abord la réponse.'));
  assert.ok(!guidance.includes('Le jour et le mois me suffisent. Et le poids'));
  assert.ok(enrichment.includes('Et le poids aussi ?… Non, je plaisante 😏'));
  assert.ok(enrichment.includes('Et la couleur de ses cheveux aussi ?… Je plaisante 😏'));
  assert.ok(enrichment.includes('const variant=sum%3'));
  assert.ok(voice.includes('liaProfileEnrichmentClarificationPending'));
  assert.ok(voice.includes('continueLiaProfileEnrichmentClarification'));
  assert.ok(orb.includes('liaProfileEnrichmentClarificationPending()'));
});


test('V0.295 birthday distance handles today, upcoming dates, year rollover and leap-day families',()=>{
  assert.deepStrictEqual(liaBirthdayAwareness.liaDaysUntilBirthday(9,19,new Date(2026,8,19)),{days:0,year:2026});
  assert.deepStrictEqual(liaBirthdayAwareness.liaDaysUntilBirthday(9,20,new Date(2026,8,19)),{days:1,year:2026});
  assert.deepStrictEqual(liaBirthdayAwareness.liaDaysUntilBirthday(1,1,new Date(2026,11,31)),{days:1,year:2027});
  assert.deepStrictEqual(liaBirthdayAwareness.liaDaysUntilBirthday(2,29,new Date(2027,1,27)),{days:1,year:2027});
  assert.strictEqual(liaBirthdayAwareness.liaDaysUntilBirthday(13,1,new Date(2026,8,19)),null);
});

test('V0.295 birthday awareness speaks at most once per upcoming stage and once on the birthday itself',()=>{
  const service=fs.readFileSync(path.join(root,'src/services/liaBirthdayAwareness.ts'),'utf8');
  assert.ok(service.includes('UPCOMING_DAYS=7'));
  assert.ok(service.includes("candidate.when.days===0?'today':'upcoming'"));
  assert.ok(service.includes('@notre-table/lia-birthday-awareness-v1'));
  assert.ok(service.includes('if(ledger.shown[key])continue'));
  assert.ok(service.includes("kind:'birthday_awareness'"));
});

test('V0.295 birthday awareness is useful but non-autonomous and wins over a new profile question in the same calm moment',()=>{
  const guidance=fs.readFileSync(path.join(root,'src/services/liaContextualGuidance.ts'),'utf8');
  const main=fs.readFileSync(path.join(root,'src/screens/MainScreen.tsx'),'utf8');
  assert.ok(guidance.includes('Ne mentionne jamais son âge'));
  assert.ok(guidance.includes('sans créer de rappel, achat, réservation ou planning sans demande explicite'));
  const birthdayCall=main.indexOf('const birthdaySurfaced=await maybeEmitLiaBirthdayAwareness');
  const enrichmentCall=main.indexOf('await maybeEmitLiaProfileEnrichmentQuestion');
  assert.ok(birthdayCall>=0&&enrichmentCall>birthdayCall);
  assert.ok(main.includes('if(cancelled||birthdaySurfaced)return'));
});


test('V0.296 favorite-meal parsing accepts a real dish and rejects vague non-answers',()=>{
  assert.equal(liaProfileFacts.parseLiaFavoriteMealAnswer('elle adore les lasagnes.'),'lasagnes');
  assert.equal(liaProfileFacts.parseLiaFavoriteMealAnswer("son plat préféré c'est le couscous"),'couscous');
  assert.equal(liaProfileFacts.parseLiaFavoriteMealAnswer('my favorite meal is sushi'),'sushi');
  assert.equal(liaProfileFacts.parseLiaFavoriteMealAnswer('je sais pas'),null);
  assert.equal(liaProfileFacts.parseLiaFavoriteMealAnswer('oui'),null);
});

test('V0.296 progressive learning asks favorite meals only through the existing slow enrichment lane',()=>{
  const enrichment=fs.readFileSync(path.join(root,'src/services/liaProfileEnrichment.ts'),'utf8');
  const guidance=fs.readFileSync(path.join(root,'src/services/liaContextualGuidance.ts'),'utf8');
  assert.ok(enrichment.includes("fact:'birthday'|'favorite_meal'"));
  assert.ok(enrichment.includes('GLOBAL_GAP_MS=48*60*60*1000'));
  assert.ok(enrichment.includes('favorite_meal,created_at'));
  assert.ok(enrichment.includes("p_favorite_meal:favoriteMeal"));
  assert.ok(guidance.includes("event.fact==='favorite_meal'"));
  assert.ok(guidance.includes('quel est le plat que'));
});

test('V0.296 favorite meals are explicit backend facts, not onboarding fields or inferred app behavior',()=>{
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609190031_lia_progressive_favorite_meal.sql'),'utf8');
  const legacyForm=fs.readFileSync(path.join(root,'supabase','migrations','202609160016_family_roster_form.sql'),'utf8');
  assert.ok(migration.includes('favorite_meal text'));
  assert.ok(migration.includes('set_lia_family_favorite_meal'));
  assert.ok(migration.includes("p_subject_kind not in ('profile','light_member')"));
  assert.ok(migration.includes('PROFILE_NOT_SELF'));
  assert.ok(migration.includes('ADMIN_REQUIRED'));
  assert.ok(!legacyForm.includes('favorite_meal'));
});

test('V0.296 birthday awareness can use a learned favorite meal as an idea but never as an automatic decision',()=>{
  const awareness=fs.readFileSync(path.join(root,'src/services/liaBirthdayAwareness.ts'),'utf8');
  const guidance=fs.readFileSync(path.join(root,'src/services/liaContextualGuidance.ts'),'utf8');
  assert.ok(awareness.includes('favorite_meal'));
  assert.ok(awareness.includes('favoriteMeal:candidate.person.favoriteMeal'));
  assert.ok(guidance.includes('tu peux t’en servir comme piste, sans présenter ça comme une décision'));
  assert.ok(guidance.includes('sans créer de rappel, achat, réservation ou planning sans demande explicite'));
});


test('V0.297 easy-or-impress follow-up recognizes useful answers and leaves vague yes unresolved',()=>{
  assert.equal(liaHomeMealStyle.parseLiaHomeMealStyleAnswer('facile et rapide'),'easy');
  assert.equal(liaHomeMealStyle.parseLiaHomeMealStyleAnswer('on épate la galerie'),'impress');
  assert.equal(liaHomeMealStyle.parseLiaHomeMealStyleAnswer('attends les autres'),'later');
  assert.equal(liaHomeMealStyle.parseLiaHomeMealStyleAnswer('on verra plus tard'),'later');
  assert.equal(liaHomeMealStyle.parseLiaHomeMealStyleAnswer('oui'),null);
});

test('V0.297 a home choice opens one bounded clarification and a saved direction prevents the same question repeating',()=>{
  const guidance=fs.readFileSync(path.join(root,'src/services/liaContextualGuidance.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  const voice=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  assert.ok(guidance.includes("homeStyle:LightHomeStyle|null"));
  assert.ok(guidance.includes('Ne repose surtout pas la question'));
  assert.ok(orb.includes('beginLiaHomeMealStyleClarification'));
  assert.ok(orb.includes("event.desire==='home'&&!event.homeStyle"));
  assert.ok(voice.includes('liaHomeMealStyleClarificationPending'));
  assert.ok(voice.includes('continueLiaHomeMealStyleClarification'));
});

test('V0.297 meal direction is a real family-question fact, resets on reconfiguration and reaches LIA planning context',()=>{
  const migration=fs.readFileSync(path.join(root,'supabase','migrations','202609190032_lia_home_style_followup.sql'),'utf8');
  const participation=fs.readFileSync(path.join(root,'src/services/lightParticipation.ts'),'utf8');
  const appContext=fs.readFileSync(path.join(root,'src/services/liaAssistantAppContext.ts'),'utf8');
  assert.ok(migration.includes('lia_home_style text'));
  assert.ok(migration.includes("p_style not in ('easy','impress')"));
  assert.ok(migration.includes("where question_id=p_question_id and desire='home'"));
  assert.ok(migration.includes('lia_home_style=null'));
  assert.ok(participation.includes('set_lia_family_home_style'));
  assert.ok(participation.includes('lia_home_style,lia_home_style_updated_at'));
  assert.ok(appContext.includes('direction fait maison='));
  assert.ok(appContext.includes("question.lia_home_style==='easy'?'facile':'épater la galerie'"));
});


test('V0.298 family follow-through waits for every actual recipient and never competes with take-charge',()=>{
  assert.equal(liaFamilyFollowthrough.liaFamilyRepliesReady({recipients:[],takeChargeName:null}),false);
  assert.equal(liaFamilyFollowthrough.liaFamilyRepliesReady({recipients:[{responded:true,takesCharge:false},{responded:false,takesCharge:false}],takeChargeName:null}),false);
  assert.equal(liaFamilyFollowthrough.liaFamilyRepliesReady({recipients:[{responded:true,takesCharge:false},{responded:true,takesCharge:false}],takeChargeName:null}),true);
  assert.equal(liaFamilyFollowthrough.liaFamilyRepliesReady({recipients:[{responded:true,takesCharge:true}],takeChargeName:'Paul'}),false);
});

test('V0.298 global family monitor resumes a completed thread once and rearms only after a new incomplete round',()=>{
  const monitor=fs.readFileSync(path.join(root,'src/services/liaFamilyMealMonitor.ts'),'utf8');
  assert.ok(monitor.includes("FOLLOWTHROUGH_SEEN_KEY='@notre-table/lia-family-followthrough-seen-v1'"));
  assert.ok(monitor.includes("kind:'family_replies_ready'"));
  assert.ok(monitor.includes('if(!complete){'));
  assert.ok(monitor.includes('delete next[key]'));
  assert.ok(monitor.includes('if(next[key])continue;'));
  assert.ok(monitor.includes('await emitReadyRepliesOnce'));
});

test('V0.298 completed family replies are summarized without LIA choosing a winner or taking an autonomous action',()=>{
  const guidance=fs.readFileSync(path.join(root,'src/services/liaContextualGuidance.ts'),'utf8');
  assert.ok(guidance.includes("kind:'family_replies_ready'"));
  assert.ok(guidance.includes('ne désigne pas arbitrairement un gagnant'));
  assert.ok(guidance.includes('sans commander, planifier ou acheter automatiquement'));
  assert.ok(guidance.includes('Tu veux qu’on s’y mette maintenant, ou on reprend ça plus tard ?'));
  assert.ok(guidance.includes("event.homeStyle==='easy'"));
  assert.ok(guidance.includes("event.homeStyle==='impress'"));
});


test('V0.299 contextual guidance adds one-time app feature introductions without replacing family follow-through',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaContextualGuidance.ts'),'utf8');
  assert.ok(source.includes("export type LiaAppFeature='planning'|'shopping'|'recipes'|'household'|'commander'|'memos'"));
  assert.ok(source.includes("kind:'app_feature_first_use'"));
  assert.ok(source.includes("kind:'app_feature_help'"));
  assert.ok(source.includes("kind:'family_replies_ready'"));
  assert.ok(source.includes("const key=\`feature:\${input.householdId}:\${input.feature}\`"));
});

test('V0.299 stuck-step guidance resets on real progress and targets exact screen states',()=>{
  const hook=fs.readFileSync(path.join(root,'src/hooks/useLiaFeatureHelp.ts'),'utf8');
  assert.ok(hook.includes('progressKey:string'));
  assert.ok(hook.includes('setTimeout'));
  assert.ok(hook.includes('Math.max(12_000,input.delayMs??35_000)'));
  assert.ok(hook.includes('emitLiaAppFeatureHelp'));
  assert.ok(hook.includes('useRef(new Set<string>())'));
  assert.ok(hook.includes('emittedRef.current.has(key)'));
  const planning=fs.readFileSync(path.join(root,'src/screens/PlanningScreen.tsx'),'utf8');
  const shopping=fs.readFileSync(path.join(root,'src/screens/ShoppingScreen.tsx'),'utf8');
  const memos=fs.readFileSync(path.join(root,'src/screens/MemosScreen.tsx'),'utf8');
  const commander=fs.readFileSync(path.join(root,'src/screens/CommanderScreen.tsx'),'utf8');
  assert.ok(planning.includes("feature:'planning'"));
  assert.ok(shopping.includes("feature:'shopping'"));
  assert.ok(memos.includes("feature:'memos'"));
  assert.ok(commander.includes("feature:'commander'"));
});

test('V0.299 first-use guidance waits for the real organizer name and covers the main app surfaces',()=>{
  const main=fs.readFileSync(path.join(root,'src/screens/MainScreen.tsx'),'utf8');
  assert.ok(main.includes("if(!demo&&!organizerName.trim())return;"));
  assert.ok(main.includes("tab==='planning'?'planning':tab==='recipes'?'recipes':tab==='shopping'?'shopping':'household'"));
  assert.ok(main.includes("liaSurface!=='commander'&&liaSurface!=='memos'"));
  assert.ok(main.includes('organizerName={organizerName}'));
});


test('V0.300 progressive curiosity uses only quick concrete profile facts and existing relationship memory',()=>{
  const enrichment=fs.readFileSync(path.join(root,'src/services/liaProfileEnrichment.ts'),'utf8');
  assert.ok(enrichment.includes("'favorite_color'|'hair_color'|'perfume'|'shampoo'"));
  assert.ok(enrichment.includes("quickFacts:LiaProfileQuickFact[]=['favorite_color','hair_color','perfume','shampoo']"));
  assert.ok(enrichment.includes("saveLiaRelationshipFact({topic:'style'"));
  assert.ok(enrichment.includes("sensitivity:'ordinary',householdSafe:false,confirmed:true"));
  assert.ok(enrichment.includes("quickFactStorageKey(target.subjectKind,target.subjectId,target.fact)"));
  assert.ok(!enrichment.includes("qu'est-ce qui te fait plaisir après une grosse journée"));
});

test('V0.300 personal curiosity is blocked at table and requires a real silent listening gap',()=>{
  const gate=fs.readFileSync(path.join(root,'src/services/liaPrivateCuriosityContext.ts'),'utf8');
  const enrichment=fs.readFileSync(path.join(root,'src/services/liaProfileEnrichment.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert.ok(gate.includes("if(state.mode==='table')return false"));
  assert.ok(gate.includes('!state.appActive||!state.listening||state.liaSpeaking||state.musicActive'));
  assert.ok(gate.includes('minimumSilenceMs=15_000'));
  assert.ok(gate.includes('nowMs-quietSince>=minimumSilenceMs'));
  assert.ok(enrichment.includes('!liaPrivateCuriosityMayPrompt()'));
  assert.ok(orb.includes("if(mode==='table')clearLiaProfileEnrichmentClarification()"));
  assert.ok(orb.includes("event.kind==='profile_enrichment_question'&&mode==='table'"));
});

test('V0.300 LIA waits for a blank instead of missing the question window or interrupting active speech',()=>{
  const main=fs.readFileSync(path.join(root,'src/screens/MainScreen.tsx'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert.ok(main.includes('setTimeout(poll,90_000)'));
  assert.ok(main.includes('retryTimer=setTimeout(poll,30_000)'));
  assert.ok(main.includes('if(profileSurfaced)sessionProactivityUsed=true'));
  assert.ok(orb.includes('noteLiaPrivateCuriosityHumanSpeech(now)'));
  assert.ok(orb.includes('updateLiaPrivateCuriosityContext({musicActive:musicPresenceRef.current.musicActive})'));
});

test('V0.300 a saved quick fact gets conversational follow-up with factuality guard and no immediate new profile question',()=>{
  const voice=fs.readFileSync(path.join(root,'src/services/liaAssistantVoiceExecution.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  const enrichment=fs.readFileSync(path.join(root,'src/services/liaProfileEnrichment.ts'),'utf8');
  assert.ok(enrichment.includes('savedFact:{subjectName:target.subjectName,fact:target.fact,value}'));
  assert.ok(voice.includes("status:'profile_enrichment_saved';spokenReply:string;savedFact?:LiaProfileSavedFact"));
  assert.ok(orb.includes("assistant.status==='profile_enrichment_saved'&&assistant.savedFact"));
  assert.ok(orb.includes('Une ou deux phrases maximum. Ne pose pas une nouvelle question de profil maintenant.'));
  assert.ok(orb.includes("n’invente jamais une gamme, un produit, une histoire ou une qualité pour meubler"));
  assert.ok(orb.includes("tu as bon goût 😏"));
});


test('V0.301 relationship recall is opt-in at response-context level and private by default',()=>{
  const adapter=fs.readFileSync(path.join(root,'src/services/liaTableResponseAdapter.ts'),'utf8');
  const runtime=fs.readFileSync(path.join(root,'src/services/liaTableResponseRuntime.ts'),'utf8');
  assert.ok(adapter.includes("relationshipMemoryAccess?:'none'|'private'"));
  assert.ok(runtime.includes("input.context.relationshipMemoryAccess==='private'"));
  assert.ok(runtime.includes("route.memoryScope==='relevant_confirmed'"));
  assert.ok(runtime.includes('collectLiaPrivateRelationshipRecall'));
  assert.ok(runtime.includes('...relationshipFacts,...appFacts'));
});

test('V0.301 direct non-table conversation may use private memory while table conversation gets none',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert.ok(orb.includes("relationshipMemoryAccess:mode==='table'?'none':'private'"));
  const occurrences=(orb.match(/relationshipMemoryAccess:/g)||[]).length;
  assert.equal(occurrences,1);
});

test('V0.301 private recall scopes named people correctly and throttles spontaneous delight to once per day',()=>{
  const recall=fs.readFileSync(path.join(root,'src/services/liaRelationshipRecall.ts'),'utf8');
  assert.ok(recall.includes('const SPONTANEOUS_GAP_MS=24*60*60*1000'));
  assert.ok(recall.includes("fact.confirmed&&fact.sensitivity==='ordinary'"));
  assert.ok(recall.includes("item.parts.subjectKind==='profile'||input.demo||memberIds.has(item.parts.subjectId)"));
  assert.ok(recall.includes('if(subjectMentioned)return subjectMention'));
  assert.ok(recall.includes("return item.parts.subjectKind==='profile'"));
  assert.ok(recall.includes("'memory.private_delight'"));
  assert.ok(recall.includes('lastFactId:candidate.fact.id'));
});

test('V0.301 remembered delight stays optional, factual and never becomes a new interrogation',()=>{
  const request=fs.readFileSync(path.join(root,'src/lib/liaAgentRequest.ts'),'utf8');
  assert.ok(request.includes('Persistent personal memory is private by default.'));
  assert.ok(request.includes('memory.private_delight is an optional affectionate callback'));
  assert.ok(request.includes('never force it into the reply or expose it as gossip'));
  assert.ok(request.includes('never turn one remembered detail into a new interrogation'));
});


test('V0.302 interrupted research becomes a bounded search continuation, not forgotten work',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaResearchContinuity.ts'),'utf8');
  assert.ok(source.includes("kind:'follow_up'"));
  assert.ok(source.includes("action:'search'"));
  assert.ok(source.includes('30*60*1000'));
  assert.ok(source.includes('14*24*60*60*1000'));
});

test('V0.302 promising research may propose a linked Memo but never silently persists one',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaResearchContinuity.ts'),'utf8');
  assert.ok(source.includes('memoSuggestion'));
  assert.ok(source.includes("kind:'other' as const"));
  assert.ok(source.includes('liaResearchContinuationCanAutoPersistMemo():false'));
  assert.ok(!source.includes('createLiaMemo('));
});

test('V0.302 contextual lock-screen copy is allowed only for ordinary research',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaResearchContinuity.ts'),'utf8');
  assert.ok(source.includes("input.sensitivity==='ordinary'"));
  assert.ok(source.includes('notificationPreviewSafe:Boolean(notificationPreview)'));
});


test('V0.303 keeps written name distinct from corrected spoken pronunciation',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaNameVoicePreference.ts'),'utf8');
  assert.ok(source.includes("factKey:'name_pronunciation'"));
  assert.ok(source.includes('displayName,spokenName'));
  assert.ok(source.includes("householdSafe:false"));
});

test('V0.303 pronunciation correction replaces the stable person fact instead of changing display name',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaNameVoicePreference.ts'),'utf8');
  const memory=fs.readFileSync(path.join(root,'src/services/liaRelationshipMemory.ts'),'utf8');
  assert.ok(source.includes("row.subjectLabel===subjectLabel&&row.factKey==='name_pronunciation'"));
  assert.ok(memory.includes("onConflict:'user_id,topic,subject_label,fact_key'"));
  assert.ok(!source.includes('updateMyDisplayName'));
});

test('V0.303 user name is an opening-address option, not a repeated conversational tic',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaNameVoicePreference.ts'),'utf8');
  assert.ok(source.includes('isConversationStart&&input.turnsSinceStart===0&&!input.usedNameThisConversation'));
});


test('V0.303 asks pronunciation only when genuinely uncertain and not already known',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaNameVoicePreference.ts'),'utf8');
  assert.ok(source.includes("pronunciationConfidence==='uncertain'"));
  assert.ok(source.includes('input.hasConfirmedPronunciation||input.alreadyAsked'));
  assert.ok(source.includes('Je veux être sûre de bien dire ton prénom'));
});


test('V0.304 preferred pronunciation is applied only at speech rendering',()=>{
  const preference=fs.readFileSync(path.join(root,'src/services/liaNameVoicePreference.ts'),'utf8');
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert.ok(preference.includes('applyPreferredSpokenNameToSpeech'));
  assert.ok(orb.includes('const voiceReply=nameVoice?applyPreferredSpokenNameToSpeech'));
  assert.ok(orb.includes('await speakLia(voiceReply'));
  assert.ok(!preference.includes('updateMyDisplayName'));
});

test('V0.304 LIA loads private relationship pronunciation for the signed-in profile',()=>{
  const orb=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
  assert.ok(orb.includes('getMyDisplayName()'));
  assert.ok(orb.includes('listLiaRelationshipFacts(demo)'));
  assert.ok(orb.includes('resolvePreferredSpokenName({displayName,subjectLabel:displayName,relationshipFacts:facts})'));
});


test('V0.304 conversational boundaries vary replies and pause only after repeated hostility',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaConversationBoundaries.ts'),'utf8');
  assert.ok(source.includes('recentReplies'));
  assert.ok(source.includes('priorHostility>=1'));
  assert.ok(source.includes('now+3*60_000'));
  assert.ok(source.includes("Pas besoin de me le répéter"));
});

test('V0.304 uncertain table or kitchen speaker is never named or assigned personal memory',()=>{
  const policy=fs.readFileSync(path.join(root,'src/services/liaSpeakerIdentityPolicy.ts'),'utf8');
  const table=fs.readFileSync(path.join(root,'src/services/liaTableSpeechAdapter.ts'),'utf8');
  assert.ok(policy.includes("input.identityConfidence>=.9&&!input.overlappingSpeech"));
  assert.ok(policy.includes('mayAttributeMemory:known'));
  assert.ok(policy.includes('shouldAskIdentity:socialContext&&!known'));
  assert.ok(policy.includes("return 'Au fait, qui me parle ?'"));
  assert.ok(table.includes('liaSpeakerIdentityPolicy'));
});

test('V0.304 family pronunciation is scoped to stable member identity',()=>{
  const source=fs.readFileSync(path.join(root,'src/services/liaNameVoicePreference.ts'),'utf8');
  assert.ok(source.includes('resolveFamilySpokenNames'));
  assert.ok(source.includes('subjectLabel:member.memberId'));
  assert.ok(source.includes('familyNamePronunciationCorrectionFact'));
  assert.ok(source.includes('familyPronunciationQuestion'));
});


test('V0.305 explicit speaker answer can become a stable confirmed session identity',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaSpeakerIdentitySession.ts'),'utf8');
 assert.ok(source.includes('rememberLiaSpeakerIdentity'));
 assert.ok(source.includes("subjectKind:'profile'|'light_member'"));
 assert.ok(source.includes('subjectId:string'));
 assert.ok(source.includes('liaIdentityAnswerName'));
 assert.ok(source.includes('liaSpeakerGreeting'));
});

test('V0.305 table session can bind a speaker track after explicit identification',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableConversationSession.ts'),'utf8');
 assert.ok(source.includes('confirmTableSpeakerIdentity'));
 assert.ok(source.includes('trackId:string'));
 assert.ok(source.includes('memberId:string'));
 assert.ok(source.includes('identityConfidence:confidence'));
 assert.ok(source.includes('mayUseMemberName:true'));
});


test('V0.306 speaker names resolve only to one stable family person',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaSpeakerRosterResolution.ts'),'utf8');
 assert.ok(source.includes('resolveLiaSpeakerFromRoster'));
 assert.ok(source.includes("status:'ambiguous'"));
 assert.ok(source.includes("subjectKind:'profile'"));
 assert.ok(source.includes("subjectKind:'light_member'"));
 assert.ok(source.includes('fetchLiaSpeakerRoster'));
});

test('V0.306 duplicate family names require clarification instead of guessed attribution',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaSpeakerRosterResolution.ts'),'utf8');
 assert.ok(source.includes("if(exact.length>1)return{status:'ambiguous'"));
 assert.ok(source.includes("if(byFirst.length>1)return{status:'ambiguous'"));
 assert.ok(source.includes('liaSpeakerDisambiguationQuestion'));
});

test('V0.306 identity question is tied to the exact pending speaker track',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaSpeakerIdentitySession.ts'),'utf8');
 assert.ok(source.includes('beginLiaSpeakerIdentification'));
 assert.ok(source.includes('pendingLiaSpeakerIdentification'));
 assert.ok(source.includes('consumeLiaSpeakerIdentification'));
 assert.ok(source.includes('trackId:string'));
});


test('V0.307 explicit speaker confirmation updates the live table runtime',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableConversationRuntime.ts'),'utf8');
 assert.ok(source.includes('confirmSpeaker:(trackId:string,memberId:string)'));
 assert.ok(source.includes('confirmTableSpeakerIdentity({session,trackId,memberId,confidence:1})'));
 assert.ok(source.includes('identities.set(trackId,{memberId,confidence:1})'));
});


test('V0.308 unknown table or cooking speaker triggers one identification flow',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaSpeakerIdentificationFlow.ts'),'utf8');
 assert.ok(source.includes('maybeAskLiaSpeakerIdentity'));
 assert.ok(source.includes("kind:'ask_identity'"));
 assert.ok(source.includes('beginLiaSpeakerIdentification(input.trackId)'));
 assert.ok(source.includes('answerFirst:policy.answerBeforeIdentityQuestion'));
});

test('V0.308+ pending identity answer resolves, clarifies, or becomes a session guest',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaSpeakerIdentificationFlow.ts'),'utf8');
 assert.ok(source.includes('resolvePendingLiaSpeakerIdentity'));
 assert.ok(source.includes("resolution.status==='matched'"));
 assert.ok(source.includes("resolution.status==='ambiguous'"));
 assert.ok(source.includes("kind:'session_guest'"));
 assert.ok(source.includes('rememberLiaSessionGuest(pending.trackId,name)'));
});


test('V0.309 live coordinator lets identity flow intercept every speaker turn',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaTableLiveCoordinator.ts'),'utf8');
 assert.ok(source.includes('onEveryTurn?'));
 assert.ok(source.includes("input.onEveryTurn?.(turn,runtime)===true"));
});

test('V0.309 LiaOrb asks, resolves and binds unknown live speakers before normal replies',()=>{
 const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
 assert.ok(source.includes('pendingLiaSpeakerIdentification()'));
 assert.ok(source.includes('fetchLiaSpeakerRoster(householdId)'));
 assert.ok(source.includes('resolvePendingLiaSpeakerIdentity'));
 assert.ok(source.includes('runtime.confirmSpeaker(resolved.trackId,resolved.memberId)'));
 assert.ok(source.includes('maybeAskLiaSpeakerIdentity'));
});


test('V0.310 confirmed speaker tracks persist with bounded lifetime',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaSpeakerIdentitySession.ts'),'utf8');
 assert.ok(source.includes('12*60*60_000'));
 assert.ok(source.includes('forgetLiaSpeakerTrack'));
 assert.ok(source.includes('touchLiaSpeakerTrack'));
});

test('V0.310 LiaOrb stores confirmed identities and can restore a known track',()=>{
 const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
 assert.ok(source.includes('rememberLiaSpeakerIdentity'));
 assert.ok(source.includes('knownLiaSpeaker(turn.speakerTrackId)'));
 assert.ok(source.includes('runtime.confirmSpeaker(turn.speakerTrackId,known.subjectId)'));
});


test('V0.311 restored speaker identity is discarded on overlap or weak speech evidence',()=>{
 const source=fs.readFileSync(path.join(root,'src/components/LiaOrb.tsx'),'utf8');
 assert.ok(source.includes('turn.overlappingSpeech||turn.speechConfidence<.9'));
 assert.ok(source.includes('forgetLiaSpeakerTrack(turn.speakerTrackId)'));
 assert.ok(source.indexOf('forgetLiaSpeakerTrack(turn.speakerTrackId)')<source.indexOf('runtime.confirmSpeaker(turn.speakerTrackId,known.subjectId)'));
});


test('V0.312 speaker identity prompt is throttled per track',()=>{
 const session=fs.readFileSync(path.join(root,'src/services/liaSpeakerIdentitySession.ts'),'utf8');
 const flow=fs.readFileSync(path.join(root,'src/services/liaSpeakerIdentificationFlow.ts'),'utf8');
 assert.ok(session.includes('IDENTITY_ASK_COOLDOWN_MS=90_000'));
 assert.ok(session.includes('mayAskLiaSpeakerIdentityAgain'));
 assert.ok(session.includes('noteLiaSpeakerIdentityAsked'));
 assert.ok(flow.includes('!mayAskLiaSpeakerIdentityAgain(input.trackId)'));
 assert.ok(flow.includes('noteLiaSpeakerIdentityAsked(input.trackId)'));
});


test('V0.313 identity clarification keeps the same speaker track pending',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaSpeakerIdentificationFlow.ts'),'utf8');
 const matches=source.match(/beginLiaSpeakerIdentification\(pending\.trackId\)/g)??[];
 assert.ok(matches.length>=2);
 assert.ok(source.includes("if(!name){beginLiaSpeakerIdentification(pending.trackId)"));
 assert.ok(source.includes("resolution.status==='ambiguous'){beginLiaSpeakerIdentification(pending.trackId)"));
});


test('V0.314 family and guest social greetings stay separate',()=>{
 const session=fs.readFileSync(path.join(root,'src/services/liaSpeakerIdentitySession.ts'),'utf8');
 const flow=fs.readFileSync(path.join(root,'src/services/liaSpeakerIdentificationFlow.ts'),'utf8');
 assert.ok(session.includes('liaFamilyMemberGreeting'));
 assert.ok(session.includes('liaReturningGuestGreeting'));
 assert.ok(session.includes('liaUnknownGuestIntroductionQuestion'));
 assert.ok(session.includes('rememberLiaKnownGuest'));
 assert.ok(session.includes('knownLiaGuestByName'));
 assert.ok(flow.includes('liaFamilyMemberGreeting(resolution.person.displayName'));
 assert.ok(flow.includes("kind:'session_guest'"));
 assert.ok(!flow.includes("kind:'unknown_name'"));
});


test('V0.314 birthday messages are varied, multilingual, and require a known date',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaBirthdayGreeting.ts'),'utf8');
 assert.ok(source.includes("surface:BirthdaySurface"));
 assert.ok(source.includes('if(!input.birthdayKnown)return null'));
 assert.ok(source.includes('liaBirthdayOrganizerReminder'));
 assert.ok((source.match(/\(n:string\)=>/g)??[]).length>=36);
 assert.ok(source.includes('daysUntil:number'));
 assert.ok(source.includes('input.daysUntil>7'));
});


test('V0.314 birthday greetings have six variants per language and separate notification surface',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaBirthdayGreeting.ts'),'utf8');
 assert.ok(source.includes("type BirthdaySurface='spoken'|'notification'"));
 assert.ok(source.includes('birthdayKnown:boolean'));
 assert.ok(source.includes("if(!input.birthdayKnown)return null"));
 assert.ok(source.includes('liaBirthdayOrganizerReminder'));
 const french=(source.match(/Joyeux anniversaire|Bon anniversaire|anniversaire de/g)??[]).length;
 assert.ok(french>=6);
});


test('V0.314 birthday greetings provide six spoken and notification variants per language',()=>{
 const source=fs.readFileSync(path.join(root,'src/services/liaBirthdayGreeting.ts'),'utf8');
 assert.ok(source.includes("type BirthdaySurface='spoken'|'notification'"));
 assert.ok(source.includes('if(!input.birthdayKnown)return null'));
 assert.ok(source.includes('liaBirthdayOrganizerReminder'));
 assert.ok(source.includes("LiaBirthdayReminderStage='advance'|'today'"));
 const spoken=source.slice(source.indexOf('const spoken='),source.indexOf('const notification='));
 const notification=source.slice(source.indexOf('const notification='),source.indexOf('function language'));
 for(const section of [spoken,notification])for(const lang of ['fr:[','en:[','he:['])assert.ok(section.includes(lang));
});


let passed=0;
for(const {name,fn} of tests){
  try{fn();passed++;console.log(`PASS ${name}`);}catch(error){console.error(`FAIL ${name}`);console.error(error?.stack||error);process.exitCode=1;}
}
console.log(`Regression tests: ${passed}/${tests.length} passed`);
fs.rmSync(temp,{recursive:true,force:true});
if(process.exitCode)process.exit(process.exitCode);
