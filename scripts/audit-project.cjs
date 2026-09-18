#!/usr/bin/env node

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

const fs=require('fs');
const path=require('path');
const {builtinModules}=require('module');
const ts=require('typescript');

const root=path.resolve(__dirname,'..');
const srcRoot=path.join(root,'src');
const failures=[];
const warnings=[];

function walk(dir){
  const out=[];
  for(const name of fs.readdirSync(dir)){
    const file=path.join(dir,name);
    const stat=fs.statSync(file);
    if(stat.isDirectory())out.push(...walk(file));
    else out.push(file);
  }
  return out;
}

const edgeFunctionsRoot=path.join(root,'supabase','functions');
const edgeFunctionFiles=fs.existsSync(edgeFunctionsRoot)?walk(edgeFunctionsRoot).filter(f=>/\.(ts|tsx)$/.test(f)):[];
const sourceFiles=[...walk(srcRoot).filter(f=>/\.(ts|tsx)$/.test(f)),...edgeFunctionFiles,path.join(root,'App.tsx'),path.join(root,'index.ts')].filter(fs.existsSync);
let transpileErrors=0;
for(const file of sourceFiles){
  const source=fs.readFileSync(file,'utf8');
  const result=ts.transpileModule(source,{
    fileName:file,
    compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext},
    reportDiagnostics:true,
  });
  for(const diagnostic of result.diagnostics||[]){
    if(diagnostic.category===ts.DiagnosticCategory.Error){
      transpileErrors++;
      failures.push(`${path.relative(root,file)}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')}`);
    }
  }
}

// Presence helpers are meal-specific; accidental two-argument calls would silently reintroduce all-day semantics.
const planningFile=path.join(srcRoot,'screens','PlanningScreen.tsx');
const planningText=fs.readFileSync(planningFile,'utf8');
const planningSf=ts.createSourceFile(planningFile,planningText,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function visitPresenceCalls(node){
  if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)){
    if(node.expression.text==='isAway'&&node.arguments.length!==3)failures.push(`Presence invariant: isAway call must receive user, date and meal type (found ${node.arguments.length}).`);
    if(node.expression.text==='availableMemberIds'&&node.arguments.length!==2)failures.push(`Presence invariant: availableMemberIds call must receive date and meal type (found ${node.arguments.length}).`);
  }
  ts.forEachChild(node,visitPresenceCalls);
}
visitPresenceCalls(planningSf);

// Simplicity guardrail: presence belongs in the meal-planning context, not duplicated in household settings.
const dashboardFile=path.join(srcRoot,'screens','HouseholdDashboardScreen.tsx');
const dashboardText=fs.readFileSync(dashboardFile,'utf8');
if(dashboardText.includes('PresenceScreen'))failures.push('Simplicity invariant: presence must stay contextual in PlanningScreen, not duplicated in the household dashboard.');
if(!dashboardText.includes('activityExpanded'))failures.push('Simplicity invariant: household activity must remain collapsed by default.');
if(!dashboardText.includes("locale.t('dashboard.settings')"))failures.push('Simplicity invariant: secondary household options must remain grouped in one settings card.');
for(const noisyKey of ["dashboard.alertsTitle","dashboard.dataTitle"]){if(dashboardText.includes(noisyKey))failures.push(`Simplicity invariant: explanatory card ${noisyKey} must not clutter the main household dashboard.`);}

// Friction-zero guardrails: secondary recipe/shopping controls stay collapsed until requested.
const recipesText=fs.readFileSync(path.join(srcRoot,'screens','RecipesScreen.tsx'),'utf8');
if(!recipesText.includes('addMenuOpen'))failures.push('Simplicity invariant: recipe creation/import choices must stay behind one add action.');
if(!recipesText.includes('filtersOpen'))failures.push('Simplicity invariant: advanced recipe filters must stay collapsed by default.');
if(recipesText.includes('styles.importCard'))failures.push('Simplicity invariant: URL/photo import cards must not permanently occupy the recipe library.');
if(recipesText.includes("recipe.tags.slice(0, 2)"))failures.push('Recipe-library invariant: tags must stay out of the primary recipe list and remain contextual in recipe detail/filters.');
if(recipesText.includes('actionChoiceIcon'))failures.push('Recipe-library invariant: add/import sheet should use calm text hierarchy instead of decorative platform icons.');
if(!recipesText.includes('activeFilterCount'))failures.push('Recipe-library invariant: advanced filter state must remain compact and summarized.');
const shoppingText=fs.readFileSync(path.join(srcRoot,'screens','ShoppingScreen.tsx'),'utf8');
if(!shoppingText.includes('toolsOpen'))failures.push('Simplicity invariant: secondary shopping tools must stay collapsed by default.');
if(shoppingText.includes('styles.offlineBox'))failures.push('Simplicity invariant: offline capability explanation must not block the shopping list; sync status is sufficient.');
if(!shoppingText.includes('const [checkedExpanded,setCheckedExpanded]=useState(false)'))failures.push('Shopping friction invariant: completed items must stay collapsed by default.');
if(!shoppingText.includes('items.filter(item=>!item.checked)'))failures.push('Shopping friction invariant: the primary shopping list must contain unchecked items only.');
if(shoppingText.indexOf('styles.toolsToggle')<shoppingText.indexOf('activeSections.map'))failures.push('Shopping friction invariant: secondary shopping tools must come after the active list, not before it.');
if(!shoppingText.includes('styles.rowRtl')||!shoppingText.includes('styles.checkRtl'))failures.push('International UX invariant: shopping rows must preserve RTL row/check spacing.');
if(!shoppingText.includes('Network.addNetworkStateListener'))failures.push('Offline sync invariant: shopping must replay the queue when connectivity returns.');
if(!shoppingText.includes('shouldReplayShoppingQueue'))failures.push('Offline sync invariant: reconnect replay must be edge-triggered, including first reachable startup observation.');
if(!shoppingText.includes('pendingShoppingQueueCount'))failures.push('Offline sync invariant: UI must not claim synced while shopping mutations remain queued.');
const shoppingServiceText=fs.readFileSync(path.join(srcRoot,'services','shopping.ts'),'utf8');
if(!shoppingServiceText.includes('replayBelongsToCurrentUser(context.userId,replayUserId)'))failures.push('Offline sync invariant: a queued replay must stop when the authenticated user changes.');
if(planningText.includes('styles.summary'))failures.push('Simplicity invariant: explanatory planning summary card must remain removed from the main flow.');
if(!planningText.includes('(cookingLoad.concentrated||cookingLoad.unassigned>0)'))failures.push('Simplicity invariant: cooking-load details should surface only when there is something actionable.');
if(!planningText.includes('const [weekExpanded,setWeekExpanded]=useState(false)'))failures.push('Daily-focus invariant: the weekly planner must remain collapsed by default.');
if(planningText.includes('style={styles.todayHub}'))failures.push('Daily-focus invariant: the old large today hub must not return alongside the focused meal card.');
if(planningText.includes('style={styles.ideasCard}'))failures.push('Daily-focus invariant: family ideas must stay contextual instead of permanently occupying the home screen.');
if(!planningText.includes('onOpenShopping'))failures.push('Daily-focus invariant: shopping must remain one tap away from Today.');
if(!planningText.includes('const [mealDetailsOpen,setMealDetailsOpen]=useState(false)'))failures.push('Meal-planning friction invariant: optional meal details must stay collapsed by default.');
if(planningText.includes("locale.t('planning.freeMeal')"))failures.push('Meal-planning friction invariant: do not restore the redundant free-meal selector; the direct meal text field is sufficient.');
if(!/currentEditingMeal\?<Pressable\b[^>]*\bonPress=\{remove\}/.test(planningText))failures.push('Meal-planning friction invariant: delete must only appear when editing an existing meal.');
// First-contact guardrails: language is chosen before LIA introduces Notre Table.
const languageFirstText=fs.readFileSync(path.join(srcRoot,'screens','LanguageFirstScreen.tsx'),'utf8');
const appEntryText=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
if(!languageFirstText.includes('supportedLanguages.map'))failures.push('First-contact invariant: the first screen must expose the supported language choices.');
if(!languageFirstText.includes('accessibilityRole="radio"')||!languageFirstText.includes('accessibilityState={{checked:active}}'))failures.push('First-contact invariant: language selection must remain an accessible single-choice control.');
if(!appEntryText.includes('if(!languageChosen)')||!appEntryText.includes('<LanguageFirstScreen'))failures.push('First-contact invariant: explicit language selection must happen before LIA onboarding.');
if(!appEntryText.includes('await locale.setLanguage(language);await markLanguageChosen();'))failures.push('First-contact invariant: first-language choice must be persisted before continuing.');
const onboardingText=fs.readFileSync(path.join(srcRoot,'screens','OnboardingScreen.tsx'),'utf8');
if(/\b(setStep|currentStep|pageIndex|setPage|onboardingPage)\b/.test(onboardingText))failures.push('First-contact invariant: LIA introduction must stay one-step and must not reintroduce carousel/page navigation state.');
if(!onboardingText.includes('TableMark')||!onboardingText.includes('liaBadge'))failures.push('First-contact invariant: LIA introduction must keep Notre Table identity and visible LIA identity.');
if(/🗓️|🛒|🍲|🍽️|👨‍🍳/.test(onboardingText))failures.push('First-contact invariant: onboarding must not use platform emoji as primary product identity.');
if(!onboardingText.includes("'onboarding.promise1'")||!onboardingText.includes("'onboarding.promise2'")||!onboardingText.includes("'onboarding.promise3'"))failures.push('First-contact invariant: LIA introduction must keep three concise help promises.');
const householdEntryText=fs.readFileSync(path.join(srcRoot,'screens','HouseholdScreen.tsx'),'utf8');
if(householdEntryText.includes('styles.preview'))failures.push('First-contact invariant: household entry must not restore the redundant educational preview card.');

// Visual-coherence guardrails: core daily surfaces use the shared lightweight icon/header system, not platform emoji decoration.
const presenceText=fs.readFileSync(path.join(srcRoot,'screens','PresenceScreen.tsx'),'utf8');
const coreMealEmoji=/☕|🥗|🍽|🍎|👩‍🍳|👥/u;
if(coreMealEmoji.test(planningText)||coreMealEmoji.test(presenceText))failures.push('Visual invariant: Today/Presence must keep meal and metadata iconography platform-neutral instead of emoji.');
if(!planningText.includes('MealGlyph')||!presenceText.includes('MealGlyph'))failures.push('Visual invariant: Today and Presence must share MealGlyph iconography.');
for(const screen of ['RecipesScreen.tsx','ShoppingScreen.tsx','HouseholdDashboardScreen.tsx']){
  const text=fs.readFileSync(path.join(srcRoot,'screens',screen),'utf8');
  if(!text.includes('ScreenHeader'))failures.push(`Visual invariant: ${screen} must use the shared ScreenHeader hierarchy.`);
}

// Household simplicity guardrails: administrative options stay secondary.
const householdDashboardText=fs.readFileSync(path.join(srcRoot,'screens','HouseholdDashboardScreen.tsx'),'utf8');
if(!householdDashboardText.includes('const [settingsExpanded,setSettingsExpanded]=useState(false)'))failures.push('Household simplicity invariant: app settings must stay collapsed by default.');
if(householdDashboardText.includes('styles.memberPrefs'))failures.push('Household simplicity invariant: dietary details must not clutter the household member list.');
if(!householdDashboardText.includes("locale.t('dashboard.settingsSummary')"))failures.push('Household simplicity invariant: collapsed settings need a concise summary.');
if(!householdDashboardText.includes('style={styles.accountRow}'))failures.push('Household simplicity invariant: subscription status must stay a compact account row instead of a promotional card.');

// Empty-state guardrails: core surfaces should guide the user instead of ending in a lone grey sentence.
for(const screen of ['RecipesScreen.tsx','ShoppingScreen.tsx','PantryScreen.tsx','HouseholdDashboardScreen.tsx']){
  const text=fs.readFileSync(path.join(srcRoot,'screens',screen),'utf8');
  if(!text.includes('EmptyState'))failures.push(`Polish invariant: ${screen} must use the shared EmptyState component for calm, actionable empty states.`);
}

// Translation dictionaries must expose exactly the same keys.
const i18nFile=path.join(srcRoot,'i18n','index.ts');
const i18nText=fs.readFileSync(i18nFile,'utf8');
const sf=ts.createSourceFile(i18nFile,i18nText,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const dictKeys={};
const dictValues={};
function collectObjectKeys(node,name){
  if(!ts.isObjectLiteralExpression(node))return;
  const keys=[];
  const values={};
  for(const property of node.properties){
    if(!ts.isPropertyAssignment(property))continue;
    const n=property.name;
    if(ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)){keys.push(n.text);if(ts.isStringLiteral(property.initializer)||ts.isNoSubstitutionTemplateLiteral(property.initializer))values[n.text]=property.initializer.text;}
  }
  dictKeys[name]=new Set(keys);
  dictValues[name]=values;
}
for(const stmt of sf.statements){
  if(!ts.isVariableStatement(stmt))continue;
  for(const decl of stmt.declarationList.declarations){
    if(!ts.isIdentifier(decl.name)||!decl.initializer)continue;
    if(['en','fr','es','he'].includes(decl.name.text))collectObjectKeys(decl.initializer,decl.name.text);
  }
}
const base=dictKeys.en||new Set();
for(const lang of ['fr','es','he']){
  const set=dictKeys[lang]||new Set();
  const missing=[...base].filter(k=>!set.has(k));
  const extra=[...set].filter(k=>!base.has(k));
  if(missing.length)failures.push(`i18n ${lang}: missing ${missing.length} keys: ${missing.slice(0,12).join(', ')}`);
  if(extra.length)failures.push(`i18n ${lang}: extra ${extra.length} keys: ${extra.slice(0,12).join(', ')}`);
}

for(const lang of ['en','fr','es','he']){
  if(dictValues[lang]?.brand!=='NOTRE TABLE')failures.push(`Brand invariant: ${lang} must keep the global product name NOTRE TABLE.`);
}
const translatedBrandPatterns=[/Our Table/iu,/Nuestra Mesa/iu,/השולחן שלנו/u];
for(const [lang,values] of Object.entries(dictValues)){
  for(const [key,value] of Object.entries(values||{})){
    if(translatedBrandPatterns.some(pattern=>pattern.test(String(value))))failures.push(`Brand invariant: ${lang}.${key} translates the product name instead of keeping Notre Table.`);
  }
}

const schema=fs.readFileSync(path.join(root,'supabase','schema.sql'),'utf8');
for(const required of ['create table if not exists public.recipe_translations','alter table public.recipe_translations enable row level security','create policy recipe_translations_select']){
  if(!schema.includes(required))failures.push(`International schema invariant missing: ${required}`);
}
if(!schema.includes("'recipe_favorites','recipe_translations'"))failures.push('Schema idempotence: recipe_favorites and recipe_translations must be included in the policy cleanup list.');
if(/week_start date not null default date_trunc\('week'/.test(schema))failures.push('International schema invariant: shopping week_start must not silently default to PostgreSQL Monday weeks.');
if(!schema.includes("meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack'))"))failures.push('Presence invariant: member_absences must be meal-specific.');
if(!schema.includes('member_absences_household_user_date_meal_unique'))failures.push('Presence invariant: member_absences unique index must include meal_type.');
// Resilience guardrails: startup must fail visibly and recoverably instead of hanging or surfacing raw backend errors.
const appEntry=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
const boundarySource=fs.readFileSync(path.join(srcRoot,'components','AppErrorBoundary.tsx'),'utf8');
const recoverySource=fs.readFileSync(path.join(srcRoot,'components','RecoveryScreen.tsx'),'utf8');
const asyncSource=fs.readFileSync(path.join(srcRoot,'lib','async.ts'),'utf8');
if(!appEntry.includes('<AppErrorBoundary><AppContent/></AppErrorBoundary>'))failures.push('Resilience invariant: AppContent must remain protected by AppErrorBoundary.');
if(!appEntry.includes('withTimeout(client.auth.getSession(),AUTH_BOOT_TIMEOUT_MS)'))failures.push('Resilience invariant: auth session restore must have a bounded timeout.');
if(!appEntry.includes('withTimeout(getMyHousehold(),HOUSEHOLD_BOOT_TIMEOUT_MS)'))failures.push('Resilience invariant: household boot must have a bounded timeout.');
if(!appEntry.includes('setSessionFailure(true)')||!appEntry.includes('setHouseholdFailure(true)'))failures.push('Resilience invariant: startup failures must reach a recoverable UI state.');
if(!appEntry.includes('try{configureNotificationHandler();}catch{}'))failures.push('Resilience invariant: notification handler setup must not be able to crash app startup.');
if(!boundarySource.includes('componentDidCatch')||!boundarySource.includes('UnexpectedFailure'))failures.push('Resilience invariant: unexpected render failures need a calm recovery surface.');
if(!recoverySource.includes('accessibilityRole="button"'))failures.push('Resilience invariant: recovery actions must remain accessible buttons.');
if(!asyncSource.includes('Promise.race')||!asyncSource.includes('clearTimeout'))failures.push('Resilience invariant: timeout helper must race and clean up its timer.');

const appConfig=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
const packageJson=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const revenueCatAdapterPath=path.join(root,'src','services','revenuecat.ts');
const hasRevenueCatAdapter=fs.existsSync(revenueCatAdapterPath);
const hasRevenueCatDependency=Boolean(packageJson?.dependencies?.['react-native-purchases']||packageJson?.devDependencies?.['react-native-purchases']);
if(hasRevenueCatAdapter!==hasRevenueCatDependency)failures.push('RevenueCat invariant: adapter and react-native-purchases dependency must appear together; orphan test fixtures are forbidden.');
if(appConfig?.expo?.scheme!=='notretable')failures.push('Deep-link invariant: app scheme must remain notretable until a universal-link domain is configured.');
if(appConfig?.expo?.ios?.config?.usesNonExemptEncryption!==false)failures.push('iOS release invariant: usesNonExemptEncryption must stay explicitly false while runtime has no non-exempt application cryptography.');
const sdk57Recommended={
  expo:'~57.0.24',
  react:'19.2.3',
  'react-native':'0.86.3',
  'expo-status-bar':'~57.0.1',
  'expo-notifications':'~57.0.20',
  'expo-print':'~57.0.2',
  'expo-sharing':'~57.0.21',
  'expo-image-picker':'~57.0.19',
  'expo-keep-awake':'~57.0.2',
  'expo-localization':'~57.0.2',
  'expo-file-system':'~57.0.7',
  'expo-linking':'~57.0.10',
  'expo-network':'~57.0.2',
  'expo-system-ui':'~57.0.4',
  'react-native-safe-area-context':'~5.7.0',
};
for(const [name,expected] of Object.entries(sdk57Recommended)){
  if(packageJson?.dependencies?.[name]!==expected)failures.push(`SDK 57 dependency invariant: ${name} must be ${expected}, found ${packageJson?.dependencies?.[name]??'missing'}.`);
}
if(appConfig?.expo?.version!==packageJson?.version)failures.push(`Version invariant: app.json (${appConfig?.expo?.version}) and package.json (${packageJson?.version}) must match.`);
if(appConfig?.expo?.userInterfaceStyle==='automatic'){
  const hasSystemUiPlugin=(appConfig?.expo?.plugins||[]).some(p=>(Array.isArray(p)?p[0]:p)==='expo-system-ui');
  if(packageJson?.dependencies?.['expo-system-ui']!=='~57.0.4'||!hasSystemUiPlugin)failures.push('Native theme invariant: automatic userInterfaceStyle on Android requires expo-system-ui ~57.0.4 and its config plugin.');
}

// Safe-area invariant: React Native core SafeAreaView is deprecated/iOS-only; SDK 57 uses safe-area-context.
if(packageJson?.dependencies?.['react-native-safe-area-context']!=='~5.7.0')failures.push('Safe-area invariant: react-native-safe-area-context must be ~5.7.0 for Expo SDK 57.');
const appSource=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
if(!appSource.includes("from 'react-native-safe-area-context'")||!appSource.includes('<SafeAreaProvider>'))failures.push('Safe-area invariant: App.tsx must provide SafeAreaProvider from react-native-safe-area-context.');
const safeAreaSourceFiles=[path.join(root,'App.tsx'),...walk(path.join(root,'src')).filter(file=>/\.(?:ts|tsx)$/.test(file))];
for(const file of safeAreaSourceFiles){
  const source=fs.readFileSync(file,'utf8');
  if(/import\s*\{[^}]*\bSafeAreaView\b[^}]*\}\s*from\s*['"]react-native['"]/.test(source))failures.push(`Safe-area invariant: legacy react-native SafeAreaView import remains in ${path.relative(root,file)}.`);
}

// Interactive Text nodes must expose button semantics to assistive technologies.
const accessibilitySourceFiles=[path.join(root,'App.tsx'),...walk(path.join(root,'src')).filter(file=>/\.tsx$/.test(file))];
for(const file of accessibilitySourceFiles){
  const source=fs.readFileSync(file,'utf8');
  const interactiveTextTags=source.match(/<Text\b[^>]*\bonPress=[^>]*>/g)||[];
  for(const tag of interactiveTextTags){
    if(!/accessibilityRole=['"]button['"]/.test(tag))failures.push(`Accessibility invariant: interactive Text is missing accessibilityRole=button in ${path.relative(root,file)}.`);
  }
}

// Native locale snapshot must refresh when Android/app language settings change while backgrounded.
const localeContextSource=fs.readFileSync(path.join(root,'src','context','LocaleContext.tsx'),'utf8');
if(!localeContextSource.includes("AppState.addEventListener('change'")||!localeContextSource.includes("state==='active'")||!localeContextSource.includes('environmentRevision'))failures.push('Localization invariant: LocaleContext must refresh native locale/calendar data when the app returns active.');

// Native app metadata and permission prompts must be localized too, not only React UI.
const requiredLocales=['en','fr','es','he'];
const configuredLocales=appConfig?.expo?.locales||{};
if(appConfig?.expo?.ios?.infoPlist?.CFBundleAllowMixedLocalizations!==true)failures.push('Native localization invariant: ios.infoPlist.CFBundleAllowMixedLocalizations must be true.');
for(const lang of requiredLocales){
  const localePath=configuredLocales[lang];
  if(!localePath){failures.push(`Native localization invariant: app.json locales is missing ${lang}.`);continue;}
  const absolute=path.resolve(root,localePath);
  if(!fs.existsSync(absolute)){failures.push(`Native localization invariant: missing locale file ${localePath}.`);continue;}
  let nativeLocale;
  try{nativeLocale=JSON.parse(fs.readFileSync(absolute,'utf8'));}catch{failures.push(`Native localization invariant: invalid JSON in ${localePath}.`);continue;}
  if(nativeLocale?.ios?.CFBundleDisplayName!=='Notre Table')failures.push(`Native localization invariant: ${lang} display name must keep Notre Table.`);
  if(!nativeLocale?.ios?.NSPhotoLibraryUsageDescription)failures.push(`Native localization invariant: ${lang} is missing NSPhotoLibraryUsageDescription.`);
  if(!nativeLocale?.ios?.NSCameraUsageDescription)failures.push(`Native localization invariant: ${lang} is missing NSCameraUsageDescription.`);
  if(nativeLocale?.android?.app_name!=='Notre Table')failures.push(`Native localization invariant: ${lang} Android app_name must keep Notre Table.`);
}
const localizationPlugin=(appConfig?.expo?.plugins||[]).find(p=>Array.isArray(p)&&p[0]==='expo-localization');
const supported=localizationPlugin?.[1]?.supportedLocales;
for(const platform of ['ios','android']) for(const lang of requiredLocales){
  if(!supported?.[platform]?.includes(lang))failures.push(`Native localization invariant: expo-localization ${platform} supportedLocales is missing ${lang}.`);
}
const imagePickerPlugin=(appConfig?.expo?.plugins||[]).find(p=>Array.isArray(p)&&p[0]==='expo-image-picker');
if(imagePickerPlugin?.[1]?.microphonePermission!==false)failures.push('Privacy invariant: image picker microphonePermission must remain false; the app imports still images only.');
if(!appConfig?.expo?.android?.blockedPermissions?.includes('android.permission.RECORD_AUDIO'))failures.push('Privacy invariant: Android RECORD_AUDIO must stay explicitly blocked; Notre Table has no audio feature.');
for(const permission of ['android.permission.SCHEDULE_EXACT_ALARM','android.permission.USE_EXACT_ALARM']){
  if(!appConfig?.expo?.android?.blockedPermissions?.includes(permission))failures.push(`Privacy invariant: ${permission} must stay explicitly blocked; reminders are not a core exact-alarm use case.`);
}
if(packageJson?.scripts?.regression!=='node scripts/regression-tests.cjs')failures.push('Quality invariant: regression test script must remain wired in package.json.');
if(packageJson?.scripts?.preflight!=='node scripts/environment-preflight.cjs')failures.push('Quality invariant: environment preflight must remain wired in package.json.');
if(packageJson?.scripts?.verify!=='npm run preflight && npm run continuity:audit && npm run source:hygiene:audit && npm run backend:audit && npm run release:audit && npm run release:gate-test && npm run feature:acceptance:audit && npm run audit && npm run regression')failures.push('Quality invariant: verify must run preflight, continuity audit, source hygiene audit, backend contract audit, release audit, EAS release gate tests, feature acceptance audit, product audit and regression tests.');
if(packageJson?.scripts?.['validate:expo-deps']!=='expo install --check')failures.push('Quality invariant: Expo SDK dependency compatibility check must remain wired in package.json.');
if(packageJson?.scripts?.['validate:installed']!=='npm run validate:expo-deps && npm run typecheck && npm run verify && npm run validate:bundle:android && npm run validate:bundle:ios')failures.push('Quality invariant: installed validation must include Expo dependency check, typecheck, verify and iOS/Android JS bundle exports in order.');
for(const required of ["alter table public.profiles add column if not exists avatar_path text","'profile-avatars','profile-avatars',false",'create policy profile_avatars_select','create policy profile_avatars_insert','create policy profile_avatars_delete']){
  if(!schema.includes(required))failures.push(`Avatar privacy invariant missing: ${required}`);
}
for(const required of ['create table if not exists public.household_activity','alter table public.household_activity enable row level security','create policy household_activity_select','create trigger meal_plans_activity','create trigger shopping_items_activity','create trigger recipes_activity','create trigger meal_ideas_activity']){
  if(!schema.includes(required))failures.push(`Household activity invariant missing: ${required}`);
}
for(const required of ['create table if not exists public.member_absences','alter table public.member_absences enable row level security','create policy member_absences_select','create policy member_absences_insert','create policy member_absences_update','create policy member_absences_delete','member_absences_household_user_date_unique']){
  if(!schema.includes(required))failures.push(`Presence invariant missing: ${required}`);
}

for(const required of ['expires_on date','pantry_household_expiry_idx','p_expires_on date default null','grant execute on function public.upsert_pantry_item(uuid,text,text,numeric,text,text,date) to authenticated']){
  if(!schema.includes(required))failures.push(`Pantry freshness invariant missing: ${required}`);
}

for(const required of ['create table if not exists public.shopping_responsibilities','alter table public.shopping_responsibilities enable row level security','create policy shopping_responsibilities_select','create policy shopping_responsibilities_insert','create policy shopping_responsibilities_update','create policy shopping_responsibilities_delete']){
  if(!schema.includes(required))failures.push(`Shopping responsibility invariant missing: ${required}`);
}

for(const required of ['create table if not exists public.recipe_feedback','alter table public.recipe_feedback enable row level security','create policy recipe_feedback_select','create policy recipe_feedback_insert','create policy recipe_feedback_update','create policy recipe_feedback_delete']){
  if(!schema.includes(required))failures.push(`Recipe taste invariant missing: ${required}`);
}
if(!schema.includes("reaction in ('again','ok','skip')"))failures.push('Recipe taste invariant: only canonical reaction codes are allowed.');
if(!schema.includes('primary key (recipe_id,user_id)'))failures.push('Recipe taste invariant: one reaction per member and recipe is required.');
const privacySource=fs.readFileSync(path.join(srcRoot,'services','privacy.ts'),'utf8');
if(!privacySource.includes('format_version: 2'))failures.push('Privacy invariant: portable export format must be version 2 after household taste data.');
for(const personalTable of ["rows('recipe_favorites'","rows('recipe_feedback'","rows('meal_idea_votes'","rows('member_absences'"]){if(!privacySource.includes(personalTable))failures.push(`Privacy export invariant missing: ${personalTable}`);}
if(!privacySource.includes("signOut({scope:'local'})"))failures.push('Privacy invariant: permanent account deletion must clear the current device session after server success.');


// Shopping mutation guardrails: rapid taps must not create concurrent mutations.
if(!shoppingText.includes('toggleBusyRef')||!shoppingText.includes('toggleBusyIds'))failures.push('Shopping mutation invariant: per-item toggle lock is missing.');
if(!shoppingText.includes('if(toggleBusyRef.current.has(item.id))return;'))failures.push('Shopping mutation invariant: repeated taps on one item must be ignored while its mutation is in flight.');
if(!shoppingText.includes('if(!cleanLabel||addingItem||addInFlight.current)return;'))failures.push('Shopping mutation invariant: manual add must reject a second in-flight submission.');
const shoppingServiceSource=fs.readFileSync(path.join(srcRoot,'services','shopping.ts'),'utf8');
if(!shoppingServiceSource.includes('shoppingQueueStorageKey(householdId,weekStart,userId)'))failures.push('Offline identity invariant: pending shopping writes must be scoped by authenticated user.');

// Realtime lifecycle guardrails: channel topics must be scoped and cleaned up.
const presenceRealtimeSource=fs.readFileSync(path.join(srcRoot,'screens','PresenceScreen.tsx'),'utf8');
const tasteRealtimeSource=fs.readFileSync(path.join(srcRoot,'components','RecipeTasteCard.tsx'),'utf8');
const householdRealtimeSource=fs.readFileSync(path.join(srcRoot,'screens','HouseholdDashboardScreen.tsx'),'utf8');
if(!planningText.includes('planning-${householdId}-${weekKey}'))failures.push('Realtime invariant: planning channel must be week-scoped to avoid topic reuse across fast week changes.');
if(!planningText.includes('planning-presence-${householdId}-${todayIso}'))failures.push('Realtime invariant: planning presence channel must be date-scoped.');
if(!presenceRealtimeSource.includes('presence-${householdId}-${todayDate}'))failures.push('Realtime invariant: PresenceScreen channel must be date-scoped.');
if(!tasteRealtimeSource.includes('recipe-taste-${householdId}-${recipeId}'))failures.push('Realtime invariant: recipe taste channel must include household and recipe identity.');
if(tasteRealtimeSource.includes('.unsubscribe()'))failures.push('Realtime invariant: recipe taste must remove its channel from the Supabase client, not only unsubscribe the socket.');
for(const [label,source] of [
  ['Planning',planningText],
  ['Presence',presenceRealtimeSource],
  ['RecipeTaste',tasteRealtimeSource],
  ['HouseholdActivity',householdRealtimeSource],
  ['Shopping',shoppingText],
]){
  if(source.includes('.channel(')&&!source.includes('removeChannel(channel)'))failures.push(`Realtime invariant: ${label} must remove Supabase channels on cleanup.`);
}

// Release/session safety guardrails.
const runtimeConfigSource=fs.readFileSync(path.join(srcRoot,'lib','runtimeConfig.ts'),'utf8');
if(!runtimeConfigSource.includes('SUPABASE_PUBLISHABLE_KEY_REQUIRED')||!runtimeConfigSource.includes('sb_publishable_'))failures.push('Security invariant: shipped Supabase config must require the modern sb_publishable_* key format.');
const authScreenSource=fs.readFileSync(path.join(srcRoot,'screens','AuthScreen.tsx'),'utf8');
if(!appEntry.includes("signOut({scope:'local'})"))failures.push('Session invariant: sign-out must affect only the current device session, never default to global sign-out.');
if(!appEntry.includes('activeUserIdRef')||!appEntry.includes('householdGateRef'))failures.push('Session invariant: account switches must invalidate stale household loads.');
if(!appEntry.includes('authVersionRef'))failures.push('Session invariant: initial getSession must not overwrite a newer auth event.');
if(!runtimeConfigSource.includes("allowDemo = environment !== 'production'"))failures.push('Production invariant: demo mode must be disabled in production.');
if(!appEntry.includes("runtimeConfig.allowDemo?enterDemo:undefined"))failures.push('Production invariant: public builds must not expose a demo entry point.');
if(!authScreenSource.includes('onDemo?<Text'))failures.push('Production invariant: AuthScreen demo action must be optional.');
const easPath=path.join(root,'eas.json');
if(!fs.existsSync(easPath))failures.push('Release invariant: eas.json is missing.');
else{
  const eas=JSON.parse(fs.readFileSync(easPath,'utf8'));
  if(eas?.build?.production?.environment!=='production')failures.push('Release invariant: EAS production profile must use production environment.');
  if(eas?.build?.production?.env?.EXPO_PUBLIC_APP_ENV!=='production')failures.push('Release invariant: EAS production must set EXPO_PUBLIC_APP_ENV=production.');
  if(eas?.build?.preview?.environment!=='preview')failures.push('Release invariant: EAS preview profile must use preview environment.');
}
if(!fs.existsSync(path.join(root,'.github','workflows','validate.yml')))failures.push('Release invariant: networked CI validation workflow is missing.');
for(const required of ['prevent_last_household_admin_loss','household_members_keep_admin','HOUSEHOLD_REQUIRES_ADMIN']){
  if(!schema.includes(required))failures.push(`Household integrity invariant missing: ${required}`);
}

// Every external runtime import must be declared. This catches accidental local-success / clean-install failures.
const declaredDependencies=new Set([...Object.keys(packageJson.dependencies||{}),...Object.keys(packageJson.devDependencies||{})]);
const builtins=new Set([...builtinModules,...builtinModules.map(x=>`node:${x}`)]);
const importPattern=/(?:import\s+(?:[^'\"]+?\s+from\s+)?|require\s*\()\s*['\"]([^'\"]+)['\"]/g;
for(const file of sourceFiles){
  const text=fs.readFileSync(file,'utf8');
  let match;
  while((match=importPattern.exec(text))){
    const spec=match[1];
    if(spec.startsWith('.')||spec.startsWith('/')||builtins.has(spec))continue;
    // Supabase Edge Functions run on Deno and may use Deno's npm: resolver; those imports are
    // deliberately not mobile package.json dependencies. They are still syntax-transpiled above.
    if(file.startsWith(edgeFunctionsRoot)&&spec.startsWith('npm:'))continue;
    const packageName=spec.startsWith('@')?spec.split('/').slice(0,2).join('/'):spec.split('/')[0];
    if(!declaredDependencies.has(packageName))failures.push(`Dependency invariant: ${path.relative(root,file)} imports ${packageName}, but it is not declared in package.json.`);
  }
}



// Async freshness guardrails: changing week/context must invalidate older fetch results.
const requestGateSource=fs.readFileSync(path.join(srcRoot,'lib','requestGate.ts'),'utf8');
if(!requestGateSource.includes('beginRequest')||!requestGateSource.includes('isCurrentRequest')||!requestGateSource.includes('invalidateRequests'))failures.push('Async freshness invariant: request gate helpers must remain available.');
if(!planningText.includes('const loadGate=useRef(createRequestGate()).current'))failures.push('Async freshness invariant: Planning must guard week loads against stale responses.');
if(!planningText.includes('isCurrentRequest(loadGate,token)'))failures.push('Async freshness invariant: Planning must ignore stale week results.');
if(!planningText.includes('invalidateRequests(loadGate)'))failures.push('Async freshness invariant: Planning must invalidate in-flight loads on unmount.');
if(!shoppingText.includes('const loadGate=useRef(createRequestGate()).current'))failures.push('Async freshness invariant: Shopping must guard week loads against stale responses.');
if(!shoppingText.includes('isCurrentRequest(loadGate,token)'))failures.push('Async freshness invariant: Shopping must ignore stale week results.');
if(!shoppingText.includes('invalidateRequests(loadGate)'))failures.push('Async freshness invariant: Shopping must invalidate in-flight loads on unmount.');

// Local-storage resilience: service code must go through the shared safe storage boundary.
const serviceSourceFiles=walk(path.join(srcRoot,'services')).filter(f=>/\.(ts|tsx)$/.test(f));
for(const file of serviceSourceFiles){
  const text=fs.readFileSync(file,'utf8');
  if(text.includes("@react-native-async-storage/async-storage"))failures.push(`Storage invariant: ${path.relative(root,file)} bypasses the shared storage boundary.`);
  if(/JSON\.parse\s*\(/.test(text))failures.push(`Storage invariant: ${path.relative(root,file)} parses persisted JSON directly instead of using readStoredJson.`);
}
const storageSource=fs.readFileSync(path.join(srcRoot,'lib','storage.ts'),'utf8');
const storageCodecSource=fs.readFileSync(path.join(srcRoot,'lib','storageCodec.ts'),'utf8');
if(!storageSource.includes('removeBrokenKey(key)'))failures.push('Storage invariant: corrupt persisted JSON must trigger single-key recovery.');
if(storageSource.includes('.clear('))failures.push('Storage invariant: recovery must never clear all application storage.');
if(!storageCodecSource.includes('decodeStoredJson'))failures.push('Storage invariant: persisted JSON decoding must remain independently testable.');
if(!shoppingServiceSource.includes('isPendingToggleArray'))failures.push('Storage invariant: offline shopping queue must validate its shape before replay.');

// Monetization safety: preview can test Family, production cannot use local billing simulation.
const subscriptionSource=fs.readFileSync(path.join(srcRoot,'services','subscription.ts'),'utf8');
const mainScreenSource=fs.readFileSync(path.join(srcRoot,'screens','MainScreen.tsx'),'utf8');
if(!subscriptionSource.includes("environment === 'preview'"))failures.push('Billing invariant: preview builds must receive beta family access.');
if(!subscriptionSource.includes("environment === 'production'"))failures.push('Billing invariant: local trial helper must guard production.');
if(!mainScreenSource.includes("runtimeConfig.environment==='production'?undefined:startTrial"))failures.push('Billing invariant: production UI must not expose the local trial callback.');
const paywallSource=fs.readFileSync(path.join(srcRoot,'screens','PaywallScreen.tsx'),'utf8');
const recipesSource=fs.readFileSync(path.join(srcRoot,'screens','RecipesScreen.tsx'),'utf8');
if(!paywallSource.includes("const production=runtimeConfig.environment==='production'"))failures.push('Billing invariant: paywall must branch explicitly for production Store pricing.');
if(!paywallSource.includes("monthlyPrice=production?storeOffer?.monthly?.localizedPrice:monthlyReference"))failures.push('Billing invariant: production monthly price must come from the Store offer, never the preview reference.');
if(!paywallSource.includes("annualPrice=production?storeOffer?.annual?.localizedPrice:annualReference"))failures.push('Billing invariant: production annual price must come from the Store offer, never the preview reference.');
if(!paywallSource.includes("production&&!storeReady"))failures.push('Billing invariant: production paywall must fail closed when Store pricing is unavailable.');
if(!recipesSource.includes('onStartTrial?: () => void | Promise<void>;'))failures.push('Billing invariant: RecipesScreen trial callback must remain optional because production does not expose local trial simulation.');
const privacyDataSource=fs.readFileSync(path.join(srcRoot,'screens','PrivacyDataScreen.tsx'),'utf8');
const deleteAccountEdgeSource=fs.readFileSync(path.join(root,'supabase','functions','delete-account','index.ts'),'utf8');
if(!privacyDataSource.includes('privacy.subscriptionWarning')||!privacyDataSource.includes('privacy.manageSubscription'))failures.push('Account deletion invariant: users must be warned that account deletion does not cancel Store subscriptions.');
if(!deleteAccountEdgeSource.includes('REVENUECAT_CUSTOMER_DELETION_ENABLED')||!deleteAccountEdgeSource.includes('REVENUECAT_SECRET_API_KEY'))failures.push('Account deletion invariant: RevenueCat erasure must be server-controlled and fail closed when enabled.');
if(!deleteAccountEdgeSource.includes('status!==200&&response.status!==404'))failures.push('Account deletion invariant: RevenueCat erase retry must treat 404 as already deleted.');
const notificationPrefsSource=fs.readFileSync(path.join(srcRoot,'services','appPreferences.ts'),'utf8');
const notificationScreenSource=fs.readFileSync(path.join(srcRoot,'screens','NotificationSettingsScreen.tsx'),'utf8');
const notificationsSource=fs.readFileSync(path.join(srcRoot,'services','notifications.ts'),'utf8');
if(!notificationPrefsSource.includes('planningChanges: false')||!notificationPrefsSource.includes('shoppingChecks: false'))failures.push('Notification invariant: unavailable collaborative push toggles must persist false in the first beta.');
if(!notificationScreenSource.includes("locale.t('notifications.remoteUnavailable')")||!notificationScreenSource.includes('disabled rtl={rtl}'))failures.push('Notification invariant: unavailable collaborative push controls must be visibly disabled, not presented as working toggles.');
if(!notificationsSource.includes('allowAlert:true')||!notificationsSource.includes('allowBadge:false')||!notificationsSource.includes('allowSound:false'))failures.push('Notification privacy invariant: iOS reminder permission request must remain alert-only without badge or sound.');

// Invitation UI must not issue duplicate RPCs under repeated taps.
const householdDashboardSource=fs.readFileSync(path.join(srcRoot,'screens','HouseholdDashboardScreen.tsx'),'utf8');
if(!householdDashboardSource.includes('if(loading||inviteInFlight.current)return;'))failures.push('Invitation mutation invariant: invitation creation must ignore a second tap while pending.');
if(!householdDashboardSource.includes('disabled={loading}'))failures.push('Invitation mutation invariant: invite action must be disabled while pending.');

const recipeImportSource=fs.readFileSync(path.join(srcRoot,'lib','recipeImport.ts'),'utf8');
const photoRecipeImportSource=fs.readFileSync(path.join(srcRoot,'lib','photoRecipeImport.ts'),'utf8');
if(!recipeImportSource.includes('fetchWithTimeout')||!recipeImportSource.includes('15000'))failures.push('External import invariant: recipe URL import must use a bounded network timeout.');
if(!photoRecipeImportSource.includes('fetchWithTimeout')||!photoRecipeImportSource.includes('20000'))failures.push('External import invariant: photo OCR must use a bounded network timeout.');
if(recipeImportSource.includes('await fetch(')||photoRecipeImportSource.includes('await fetch('))failures.push('External import invariant: recipe imports must not call unbounded fetch directly.');
if(!deleteAccountEdgeSource.includes('AbortController')||!deleteAccountEdgeSource.includes('10000'))failures.push('Account deletion invariant: RevenueCat server erase must have a bounded upstream timeout.');

// Public environment values have one validation boundary. Runtime modules must not bypass runtimeConfig.
for(const file of sourceFiles){
  if(file===path.join(srcRoot,'lib','runtimeConfig.ts'))continue;
  const text=fs.readFileSync(file,'utf8');
  if(text.includes('process.env.EXPO_PUBLIC_'))failures.push(`Runtime config invariant: ${path.relative(root,file)} reads EXPO_PUBLIC_* directly instead of using runtimeConfig.`);
}

// Runtime code must not depend on competitor branding. Research references belong in docs only.
const competitorPattern=/\b(Mealime|AnyList|Paprika|Samsung Food|Jow)\b/i;
for(const file of sourceFiles){
  const text=fs.readFileSync(file,'utf8');
  if(competitorPattern.test(text))failures.push(`IP guardrail: competitor name found in runtime source: ${path.relative(root,file)}`);
}

// Warn about obvious hard-coded French UI text in screen JSX. This is heuristic, not a legal/type check.
const frenchUiPattern=/\b(Impossible|Fermer|Ajouter|Supprimer|Aucun|Aucune|Enregistrer|Importer|recette|courses|foyer|famille|semaine|repas|ingrédient|Préparation|Cuisson|Favoris|Démo|Choisir|Autorisation)\b/i;
for(const file of sourceFiles.filter(f=>f.includes(`${path.sep}screens${path.sep}`))){
  const text=fs.readFileSync(file,'utf8');
  const lines=text.split(/\r?\n/);
  lines.forEach((line,index)=>{
    if(frenchUiPattern.test(line)&&/(<Text|placeholder=|setError\(|setMessage\()/.test(line)&&!line.includes("locale.t(")){
      warnings.push(`${path.relative(root,file)}:${index+1}: possible hard-coded UI text`);
    }
  });
}

const authRecoveryScreenSource=fs.readFileSync(path.join(srcRoot,'screens','AuthScreen.tsx'),'utf8');
const authRecoveryServiceSource=fs.readFileSync(path.join(srcRoot,'services','auth.ts'),'utf8');
const authRecoveryLinksSource=fs.readFileSync(path.join(srcRoot,'lib','authLinks.ts'),'utf8');
if(!authRecoveryScreenSource.includes('resetPasswordForEmail')||!authRecoveryScreenSource.includes("from 'expo-linking'"))failures.push('Auth recovery invariant: reset email must redirect through Expo Linking.');
if(!authRecoveryServiceSource.includes('exchangeCodeForSession')||!authRecoveryServiceSource.includes('setSession')||!authRecoveryServiceSource.includes('verifyOtp'))failures.push('Auth deep-link invariant: native callbacks must support PKCE, implicit tokens and token hashes.');
if(!authRecoveryLinksSource.includes('parsed.hostname')||!authRecoveryLinksSource.includes('parsed.pathname'))failures.push('Auth deep-link invariant: custom URL scheme routing must include hostname and pathname.');

console.log(`Notre Table audit`);
console.log(`- TypeScript/TSX files transpiled: ${sourceFiles.length}`);
console.log(`- Transpile errors: ${transpileErrors}`);
console.log(`- English translation keys: ${base.size}`);
console.log(`- IP runtime competitor-name violations: ${failures.filter(x=>x.startsWith('IP guardrail')).length}`);
console.log(`- Localization heuristic warnings: ${warnings.length}`);
if(warnings.length)warnings.slice(0,20).forEach(w=>console.log(`  WARN ${w}`));

const pressableFiles=[path.join(root,'App.tsx'),...walk(path.join(root,'src')).filter(file=>/\.tsx$/.test(file))];
let pressableCount=0, hiddenPressableCount=0;
for(const file of pressableFiles){
  const source=fs.readFileSync(file,'utf8');
  for(const tag of pressableOpeningTags(source)){
    pressableCount++;
    const semantic=/accessibilityRole=['"][^'"]+['"]/.test(tag);
    const hidden=/accessible=\{false\}/.test(tag);
    if(!semantic&&!hidden)failures.push(`Accessibility invariant: Pressable is missing native semantics in ${path.relative(root,file)}.`);
    if(hidden)hiddenPressableCount++;
  }
}
if(pressableCount!==197)failures.push(`Accessibility invariant: expected 197 Pressable controls, found ${pressableCount}; classify new controls explicitly.`);
if(hiddenPressableCount!==1)failures.push(`Accessibility invariant: expected one intentionally hidden Pressable backdrop, found ${hiddenPressableCount}.`);

let disabledPressableCount=0;
for(const file of pressableFiles){
  const source=fs.readFileSync(file,'utf8');
  for(const tag of pressableOpeningTags(source)){
    if(!/\bdisabled=/.test(tag))continue;
    disabledPressableCount++;
    if(!/accessibilityState=\{\{[^}]*\bdisabled\s*:/.test(tag))failures.push(`Accessibility invariant: disabled Pressable is missing accessibilityState.disabled in ${path.relative(root,file)}.`);
  }
}
if(disabledPressableCount!==57)failures.push(`Accessibility invariant: expected 57 disabled Pressable controls, found ${disabledPressableCount}; classify new controls explicitly.`);

let busyPressableCount=0;
for(const file of pressableFiles){
  const source=fs.readFileSync(file,'utf8');
  for(const tag of pressableOpeningTags(source)){
    if(/accessibilityState=/.test(tag)&&/\bbusy\s*:/.test(tag))busyPressableCount++;
  }
}
if(busyPressableCount!==38)failures.push(`Accessibility invariant: expected 38 Pressable controls with busy state, found ${busyPressableCount}; classify asynchronous controls explicitly.`);

let selectedPressableCount=0;
for(const file of pressableFiles){
  const source=fs.readFileSync(file,'utf8');
  for(const tag of pressableOpeningTags(source)){
    if(/accessibilityState=/.test(tag)&&/\bselected\b/.test(tag))selectedPressableCount++;
  }
}
if(selectedPressableCount!==37)failures.push(`Accessibility invariant: expected 37 Pressable controls with selected state, found ${selectedPressableCount}; classify persistent selection controls explicitly.`);

const notificationSettings=fs.readFileSync(path.join(root,'src','screens','NotificationSettingsScreen.tsx'),'utf8');
if(!notificationSettings.includes('const saveInFlight=useRef(false);')||!notificationSettings.includes('if(saveInFlight.current)return;')) failures.push('Notification invariant: reminder save must retain a synchronous single-flight guard.');
if(!notificationSettings.includes('accessibilityState={{disabled:saving,busy:saving}} disabled={saving}')) failures.push('Notification invariant: reminder save button must expose busy/disabled state while scheduling.');

const paywallSingleFlight=fs.readFileSync(path.join(root,'src','screens','PaywallScreen.tsx'),'utf8');
if(!paywallSingleFlight.includes('const billingInFlight=useRef(false);')||!paywallSingleFlight.includes("billingInFlight.current=true;setBusy('purchase')")||!paywallSingleFlight.includes("billingInFlight.current=true;setBusy('restore')")) failures.push('Billing invariant: purchase and restore actions must retain a synchronous single-flight guard.');
const privacySingleFlight=fs.readFileSync(path.join(root,'src','screens','PrivacyDataScreen.tsx'),'utf8');
if(!privacySingleFlight.includes('const deleteInFlight=useRef(false);')||!privacySingleFlight.includes("if(deleteInFlight.current)return;deleteInFlight.current=true;setBusy('delete')")) failures.push('Privacy invariant: account deletion must retain a synchronous single-flight guard.');

const householdSubmitSource=fs.readFileSync(path.join(root,'src','screens','HouseholdScreen.tsx'),'utf8');
if(!householdSubmitSource.includes('const submitInFlight=useRef(false);')||!householdSubmitSource.includes('if(submitInFlight.current)return;submitInFlight.current=true;setLoading(true)')) failures.push('Household invariant: create/join submit must retain a synchronous single-flight guard.');
const householdInviteSource=fs.readFileSync(path.join(root,'src','screens','HouseholdDashboardScreen.tsx'),'utf8');
if(!householdInviteSource.includes('const inviteInFlight=useRef(false);')||!householdInviteSource.includes('if(loading||inviteInFlight.current)return;')) failures.push('Household invariant: invitation creation must retain a synchronous single-flight guard.');
if(!privacySingleFlight.includes('const exportInFlight=useRef(false);')||!privacySingleFlight.includes("if(exportInFlight.current)return;exportInFlight.current=true;setBusy('export')")) failures.push('Privacy invariant: data export must retain a synchronous single-flight guard.');
const lightParticipationSource=fs.readFileSync(path.join(root,'src','screens','LightParticipationScreen.tsx'),'utf8');
if(!lightParticipationSource.includes('const actionInFlight=useRef(false);')||(lightParticipationSource.match(/actionInFlight\.current=true;setBusy\(true\)/g)||[]).length<4) failures.push('Light-member invariant: organizer mutations must retain the shared synchronous single-flight guard.');

const planningMutationSource=fs.readFileSync(path.join(root,'src','screens','PlanningScreen.tsx'),'utf8');
if(!planningMutationSource.includes('const mealMutationInFlight=useRef(false);')||!planningMutationSource.includes('const weekActionInFlight=useRef(false);')||!planningMutationSource.includes('const ideaActionInFlight=useRef(false);')) failures.push('Planning invariant: meal/week/idea side effects must retain synchronous single-flight guards.');
const pantryMutationSource=fs.readFileSync(path.join(root,'src','screens','PantryScreen.tsx'),'utf8');
if(!pantryMutationSource.includes('const mutationInFlight=useRef(false);')||!pantryMutationSource.includes('if(!label.trim()||mutationInFlight.current)return;mutationInFlight.current=true;')) failures.push('Pantry invariant: add/delete mutations must retain the synchronous single-flight guard.');
const shoppingMutationSource=fs.readFileSync(path.join(root,'src','screens','ShoppingScreen.tsx'),'utf8');
if(!shoppingMutationSource.includes('const addInFlight=useRef(false);')||!shoppingMutationSource.includes('const toolsInFlight=useRef(false);')||(shoppingMutationSource.match(/toolsInFlight\.current=true/g)||[]).length<5) failures.push('Shopping invariant: add/tools side effects must retain synchronous single-flight guards.');

const appSingleFlightSource=fs.readFileSync(path.join(root,'App.tsx'),'utf8');
if(!appSingleFlightSource.includes('const exitInFlightRef=useRef(false);')||!appSingleFlightSource.includes('if(exitInFlightRef.current)return;')) failures.push('Session invariant: sign-out must retain a synchronous single-flight guard.');
const authSingleFlightSource=fs.readFileSync(path.join(root,'src','screens','AuthScreen.tsx'),'utf8');
if(!authSingleFlightSource.includes('const authInFlight=useRef(false);')||!authSingleFlightSource.includes('password.length<6||authInFlight.current')||!authSingleFlightSource.includes('if(!supabase||authInFlight.current)return;')) failures.push('Auth invariant: sign-in/sign-up/reset must retain the shared synchronous single-flight guard.');
const recoverySingleFlightSource=fs.readFileSync(path.join(root,'src','screens','PasswordRecoveryScreen.tsx'),'utf8');
if(!recoverySingleFlightSource.includes('const submitInFlight=useRef(false);')||!recoverySingleFlightSource.includes('!valid||submitInFlight.current')) failures.push('Auth invariant: password recovery update must retain a synchronous single-flight guard.');
const profileSingleFlightSource=fs.readFileSync(path.join(root,'src','screens','HouseholdDashboardScreen.tsx'),'utf8');
if(!profileSingleFlightSource.includes('const avatarInFlight=useRef(false);')||!profileSingleFlightSource.includes('const prefsInFlight=useRef(false);')||!profileSingleFlightSource.includes('accessibilityState={{disabled:prefsSaving,busy:prefsSaving}}')) failures.push('Profile invariant: avatar and preference mutations must retain synchronous locks and visible busy state.');

const recipeMutationSource=fs.readFileSync(path.join(root,'src','screens','RecipesScreen.tsx'),'utf8');
if(!recipeMutationSource.includes('const importInFlight=useRef(false);')||!recipeMutationSource.includes('const photoImportInFlight=useRef(false);')||!recipeMutationSource.includes('const favoriteInFlight=useRef<Set<string>>(new Set());')||!recipeMutationSource.includes('const shoppingInFlight=useRef(false);')||!recipeMutationSource.includes('const saveInFlight=useRef(false);')) failures.push('Recipe invariant: import/favorite/shopping/save mutations must retain synchronous single-flight guards.');
const presenceMutationSource=fs.readFileSync(path.join(root,'src','screens','PresenceScreen.tsx'),'utf8');
if(!presenceMutationSource.includes('const toggleInFlightRef=useRef(false);')||!presenceMutationSource.includes('if(busyKey||toggleInFlightRef.current)return;')) failures.push('Presence invariant: meal presence mutations must retain a synchronous single-flight guard.');
const recipeTasteMutationSource=fs.readFileSync(path.join(root,'src','components','RecipeTasteCard.tsx'),'utf8');
if(!recipeTasteMutationSource.includes('const tasteInFlight=useRef(false);')||!recipeTasteMutationSource.includes('if(busy||tasteInFlight.current)return;')||!recipeTasteMutationSource.includes('finally{tasteInFlight.current=false;setBusy(false);}')) failures.push('Recipe taste invariant: reaction mutations must retain a synchronous single-flight guard.');
if(!recipeTasteMutationSource.includes('accessibilityState={{disabled:busy,selected:active,busy:busy}}')) failures.push('Accessibility invariant: recipe taste choices must announce busy state while saving.');

const pantryScreen=fs.readFileSync(path.join(root,'src','screens','PantryScreen.tsx'),'utf8');
if(notificationSettings.includes('keyboardType="numbers-and-punctuation"')||pantryScreen.includes('keyboardType="numbers-and-punctuation"')) failures.push('Input invariant: iOS-only numbers-and-punctuation keyboard must not be used for shared time/date fields.');
if(!notificationSettings.includes('keyboardType="number-pad" maxLength={5}')||!notificationSettings.includes('formatTimeInput(v)')) failures.push('Input invariant: reminder time must use cross-platform numeric entry plus HH:MM formatting.');
if(!pantryScreen.includes('keyboardType="number-pad" maxLength={10}')||!pantryScreen.includes('formatIsoDateInput(v)')) failures.push('Input invariant: pantry expiry must use cross-platform numeric entry plus YYYY-MM-DD formatting.');

const recipesScreen=fs.readFileSync(path.join(root,'src','screens','RecipesScreen.tsx'),'utf8');
if(!recipesScreen.includes('accessibilityState={{selected:recipe.favorite}} hitSlop={5}')) failures.push('Accessibility invariant: recipe favorite heart must retain hitSlop={5} so the 34x34 visual target has a 44x44 effective touch area.');




let expandedPressableCount=0;
for(const file of pressableFiles){
  const source=fs.readFileSync(file,'utf8');
  for(const tag of pressableOpeningTags(source)){
    if(/accessibilityState=/.test(tag)&&/\bexpanded\s*:/.test(tag))expandedPressableCount++;
  }
}
if(expandedPressableCount!==13)failures.push(`Accessibility invariant: expected 13 disclosure controls with expanded state, found ${expandedPressableCount}; classify expandable controls explicitly.`);

let textInputCount=0;
for(const file of pressableFiles){
  const source=fs.readFileSync(file,'utf8');
  for(const tag of textInputOpeningTags(source)){
    textInputCount++;
    if(!/\baccessibilityLabel=/.test(tag))failures.push(`Accessibility invariant: TextInput is missing accessibilityLabel in ${path.relative(root,file)}.`);
  }
}
if(textInputCount!==38)failures.push(`Accessibility invariant: expected 38 TextInput controls, found ${textInputCount}; label new fields explicitly.`);
const authInputSource=fs.readFileSync(path.join(root,'src','screens','AuthScreen.tsx'),'utf8');
const recoveryInputSource=fs.readFileSync(path.join(root,'src','screens','PasswordRecoveryScreen.tsx'),'utf8');
const householdInputSource=fs.readFileSync(path.join(root,'src','screens','HouseholdScreen.tsx'),'utf8');
if(!authInputSource.includes('autoComplete="email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address"')) failures.push('Input invariant: auth email must disable auto-correction/capitalization.');
if(!authInputSource.includes("autoComplete={mode==='signin'?'current-password':'new-password'} value={password} onChangeText={setPassword} autoCapitalize=\"none\" autoCorrect={false} secureTextEntry")) failures.push('Input invariant: auth password must disable auto-correction/capitalization.');
if((recoveryInputSource.match(/autoCapitalize="none" autoCorrect=\{false\} secureTextEntry/g)||[]).length!==2) failures.push('Input invariant: both recovery password fields must disable auto-correction/capitalization.');
if(!householdInputSource.includes("setCode(v.replace(/[^a-zA-Z0-9]/g,'').toUpperCase().slice(0,6))")) failures.push('Input invariant: household invitation code must normalize explicitly to uppercase.');
if(!householdInputSource.includes('autoCapitalize="characters" autoCorrect={false}')) failures.push('Input invariant: household invitation code must disable auto-correction.');
let accessibleProgressCount=0;
for(const file of accessibilitySourceFiles){
  const source=fs.readFileSync(file,'utf8');
  accessibleProgressCount+=(source.match(/<ActivityIndicator\b[^>]*accessibilityRole=[\'"]progressbar[\'"][^>]*accessibilityLabel=\{locale\.t\([\'"]common\.loading[\'"]\)\}/g)||[]).length;
}
if(accessibleProgressCount!==19) failures.push(`Accessibility invariant: expected 19 standalone accessible progress indicators, found ${accessibleProgressCount}; classify new loaders explicitly.`);
const notificationSettingsSource=fs.readFileSync(path.join(root,'src','screens','NotificationSettingsScreen.tsx'),'utf8');
if(!notificationSettingsSource.includes("try{\n      await saveNotificationPreferences(prefs);")) failures.push('Notification resilience invariant: settings save must catch storage/native scheduling failures.');
if(!notificationSettingsSource.includes("setError(locale.t('notifications.scheduleError'))")) failures.push('Notification resilience invariant: settings save must surface localized scheduling failure.');
const authScreenAccessibility=fs.readFileSync(path.join(srcRoot,'screens','AuthScreen.tsx'),'utf8');
if(!authScreenAccessibility.includes("locale.t('auth.email')"))failures.push('Accessibility/localization invariant: auth email field must use localized auth.email label.');

if(failures.length){
  failures.forEach(f=>console.error(`FAIL ${f}`));
  process.exit(1);
}
console.log('PASS');
