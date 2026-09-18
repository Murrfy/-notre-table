#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');

const root=path.resolve(__dirname,'..');
const outDir=path.join(root,'.validation');
const outPath=path.join(outDir,'release-doctor.json');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));

const args=new Set(process.argv.slice(2));
const strict=args.has('--strict');
const jsonOnly=args.has('--json');
const timeoutMs=Number(process.env.RELEASE_DOCTOR_NETWORK_TIMEOUT_MS||3500);

function commandVersion(command,args=['--version']){
  const r=spawnSync(command,args,{encoding:'utf8',timeout:2500});
  if(r.error||r.status!==0)return null;
  return String(r.stdout||r.stderr||'').trim().split(/\r?\n/)[0]||null;
}
function envSet(name){return Boolean(String(process.env[name]||'').trim());}
function publicSupabaseKeyLooksSafe(){
  const key=String(process.env.SUPABASE_PUBLISHABLE_KEY||'').trim();
  return !key||/^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
}
function httpsConfigured(name){
  const value=String(process.env[name]||'').trim();
  return !value||/^https:\/\//i.test(value);
}
async function registryReachable(){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch('https://registry.npmjs.org/-/ping',{signal:controller.signal,headers:{accept:'application/json'}});
    return response.ok;
  }catch{return false;}finally{clearTimeout(timer);}
}
function check(id,status,message){return {id,status,message};}
function auditEvidence(scriptName,evidenceName){
  const evidencePath=path.join(root,'.validation',evidenceName);
  if(!fs.existsSync(evidencePath))return false;
  const result=spawnSync(process.execPath,[path.join(root,'scripts',scriptName),evidencePath],{cwd:root,encoding:'utf8',timeout:5000});
  return result.status===0;
}
function stage(name,checks){
  const hasBlock=checks.some(x=>x.status==='block');
  const hasManual=checks.some(x=>x.status==='manual');
  return {name,status:hasBlock?'blocked':hasManual?'manual':'ready',checks};
}
function printStage(s){
  const icon={pass:'PASS',block:'BLOCK',manual:'MANUAL',note:'NOTE'};
  console.log(`\n[${s.status.toUpperCase()}] ${s.name}`);
  for(const c of s.checks)console.log(`- ${icon[c.status]||c.status}: ${c.message}`);
}

(async()=>{
  const npmUa=String(process.env.npm_config_user_agent||'');
  const npmUaVersion=(npmUa.match(/(?:^|\s)npm\/([^\s]+)/)||[])[1]||null;
  const npmVersion=npmUaVersion||commandVersion('npm',['--version']);
  const gitVersion=commandVersion('git',['--version']);
  const supabaseVersion=commandVersion('supabase',['--version']);
  const denoVersion=commandVersion('deno',['--version']);
  const dockerVersion=commandVersion('docker',['--version']);
  const easVersion=commandVersion('eas',['--version']);
  const registryOk=await registryReachable();
  const lockfile=fs.existsSync(path.join(root,'package-lock.json'));
  const gitDir=fs.existsSync(path.join(root,'.git'));
  const projectId=app?.expo?.extra?.eas?.projectId;
  const lightFn=fs.existsSync(path.join(root,'supabase','functions','light-response','index.ts'));
  const lightPublic=/\[functions\.light-response\][\s\S]*?verify_jwt\s*=\s*false/.test(fs.readFileSync(path.join(root,'supabase','config.toml'),'utf8'));
  const revenueCatAdapter=fs.existsSync(path.join(root,'src','services','revenuecat.ts'));
  const revenueCatDependency=Boolean(pkg?.dependencies?.['react-native-purchases']||pkg?.devDependencies?.['react-native-purchases']);
  const blockedAudio=Boolean(app?.expo?.android?.blockedPermissions?.includes('android.permission.RECORD_AUDIO'));
  const iosExportCompliance=app?.expo?.ios?.config?.usesNonExemptEncryption===false;
  const iosTabletSupported=app?.expo?.ios?.supportsTablet===true;
  const localAsset=(value)=>Boolean(value&&!/^https?:\/\//i.test(String(value))&&fs.existsSync(path.resolve(root,String(value))));
  const adaptive=app?.expo?.android?.adaptiveIcon;
  const brandAssets=localAsset(app?.expo?.icon)&&localAsset(adaptive?.foregroundImage)&&/^#[0-9A-Fa-f]{6}$/.test(String(adaptive?.backgroundColor||''));

  const stages=[];
  stages.push(stage('Installed validation / CI',[
    check('node',process.versions.node==='22.16.0'?'pass':'block',`Node release toolchain ${process.versions.node} (expected 22.16.0).`),
    check('npm',npmVersion==='10.9.2'?'pass':'block',`npm release toolchain ${npmVersion||'unavailable'} (expected 10.9.2).`),
    check('lockfile',lockfile?'pass':'block',lockfile?'Committed package-lock.json present.':'package-lock.json absent; bootstrap on a networked runner is still required.'),
    check('registry',registryOk?'pass':'block',registryOk?'npm registry reachable.':'npm registry unreachable from this environment.'),
    check('git',gitVersion?'pass':'block',gitVersion?`${gitVersion} available.`:'git CLI unavailable.'),
    check('repository',gitDir?'pass':'manual',gitDir?'Working tree has Git metadata.':'Archive copy has no .git metadata; repository access must be proven on the connected GitHub runner.'),
  ]));
  stages.push(stage('Supabase development backend',[
    check('supabase-cli',supabaseVersion?'pass':'block',supabaseVersion?`Supabase CLI available (${supabaseVersion}).`:'Supabase CLI unavailable.'),
    check('deno',denoVersion?'pass':'manual',denoVersion?`Deno available (${denoVersion}).`:'Deno unavailable; local Edge execution is not independently proven.'),
    check('docker',dockerVersion?'pass':'manual',dockerVersion?`Docker available (${dockerVersion}).`:'Docker unavailable; local Supabase stack cannot be started here.'),
    check('url',envSet('SUPABASE_URL')&&httpsConfigured('SUPABASE_URL')?'pass':'block',envSet('SUPABASE_URL')?(httpsConfigured('SUPABASE_URL')?'SUPABASE_URL configured with HTTPS.':'SUPABASE_URL is configured but not HTTPS.'):'SUPABASE_URL is not configured.'),
    check('publishable',envSet('SUPABASE_PUBLISHABLE_KEY')&&publicSupabaseKeyLooksSafe()?'pass':'block',envSet('SUPABASE_PUBLISHABLE_KEY')?(publicSupabaseKeyLooksSafe()?'Supabase publishable key configured with modern public-key format.':'Supabase publishable key format is unsafe or legacy.'):'SUPABASE_PUBLISHABLE_KEY is not configured.'),
    check('service-role',envSet('SUPABASE_SERVICE_ROLE_KEY')?'pass':'block',envSet('SUPABASE_SERVICE_ROLE_KEY')?'Server-only Supabase credential is configured.':'SUPABASE_SERVICE_ROLE_KEY is not configured.'),
    check('smoke-target',['development','staging'].includes(String(process.env.SUPABASE_SMOKE_TARGET||'').trim().toLowerCase())?'pass':'block','Destructive smoke target must be explicitly development or staging.'),
    check('smoke-optin',process.env.SUPABASE_SMOKE_ALLOW_DESTRUCTIVE==='1'?'pass':'block','Destructive live smoke requires SUPABASE_SMOKE_ALLOW_DESTRUCTIVE=1.'),
    check('light-response',lightFn&&lightPublic?'pass':'block',lightFn&&lightPublic?'light-response source exists and is versioned public (verify_jwt=false).':'light-response source/config contract is incomplete.'),
  ]));
  stages.push(stage('EAS preview build',[
    check('eas-cli',easVersion?'pass':'block',easVersion?`EAS CLI available (${easVersion}).`:'EAS CLI unavailable.'),
    check('project-id',projectId?'pass':'block',projectId?'Real Expo/EAS projectId is configured.':'Expo/EAS projectId is intentionally not configured yet.'),
    check('expo-auth',envSet('EXPO_TOKEN')?'pass':'manual',envSet('EXPO_TOKEN')?'Non-interactive Expo authentication token is configured.':'EXPO_TOKEN absent; interactive login or CI secret is still required.'),
    check('preview-backend',envSet('EXPO_PUBLIC_SUPABASE_URL')&&envSet('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY')?'pass':'block','Preview build requires real public Supabase URL + publishable key in the EAS preview environment.'),
  ]));
  const betaAcceptanceOk=auditEvidence('beta-acceptance-audit.cjs','beta-acceptance.json');
  const featureBetaAcceptanceOk=auditEvidence('feature-beta-acceptance-audit.cjs','feature-beta-acceptance.json');
  stages.push(stage('Physical beta evidence',[
    check('beta-core',betaAcceptanceOk?'pass':'block',betaAcceptanceOk?'Core two-device beta evidence passes all 16 required scenarios.':'Core two-device beta evidence is not proven (16 required scenarios).'),
    check('beta-commander-lia',featureBetaAcceptanceOk?'pass':'block',featureBetaAcceptanceOk?'Commander + LIA physical beta evidence passes all 53 required scenarios.':'Commander + LIA physical beta evidence is not proven (53 required scenarios).'),
  ]));
  stages.push(stage('Production billing / Stores',[
    check('android-audio',blockedAudio?'pass':'block',blockedAudio?'Android RECORD_AUDIO is explicitly blocked.':'Android RECORD_AUDIO is not explicitly blocked.'),
    check('ios-export-compliance',iosExportCompliance?'pass':'block',iosExportCompliance?'iOS export compliance explicitly declares no non-exempt encryption.':'iOS usesNonExemptEncryption must be explicitly false for the current runtime before Production.'),
    check('ios-tablet-qa',iosTabletSupported?'manual':'pass',iosTabletSupported?'iPad support is declared; a physical iPad critical-path check is still required before App Store Production.':'iPad support is not declared.'),
    check('brand-assets',brandAssets?'pass':'block',brandAssets?'Versioned local app icon + Android adaptive icon are configured.':'Production brand assets are not complete yet (local expo.icon + adaptive icon foreground/background required).'),
    check('revenuecat-adapter',revenueCatAdapter&&revenueCatDependency?'pass':'block',revenueCatAdapter&&revenueCatDependency?'RevenueCat native adapter and dependency are both present.':'Real RevenueCat native adapter/dependency are not wired yet; production remains fail-closed.'),
    check('revenuecat-public',envSet('EXPO_PUBLIC_REVENUECAT_IOS_API_KEY')&&envSet('EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY')&&envSet('EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID')?'pass':'block','Production requires platform SDK keys and entitlement id in the EAS production environment.'),
    check('compliance',envSet('EXPO_PUBLIC_PRIVACY_POLICY_URL')&&envSet('EXPO_PUBLIC_ACCOUNT_DELETION_WEB_URL')?'pass':'block','Production requires privacy and account-deletion HTTPS URLs.'),
    check('server-revenuecat',envSet('REVENUECAT_SECRET_API_KEY')&&envSet('REVENUECAT_ENTITLEMENT_ID')?'pass':'block','Server-side RevenueCat sync requires secret API key and entitlement id only in trusted backend secrets.'),
  ]));

  const report={
    format_version:1,
    app_version:pkg.version,
    generated_at:new Date().toISOString(),
    strict,
    stages,
    next_stage:stages.find(s=>s.status!=='ready')?.name||'All modeled release stages ready',
  };
  fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(outPath,JSON.stringify(report,null,2)+'\n');
  if(!jsonOnly){
    console.log(`Notre Table release doctor — v${pkg.version}`);
    for(const s of stages)printStage(s);
    console.log(`\nNext unresolved stage: ${report.next_stage}`);
    console.log(`Report: ${path.relative(root,outPath)}`);
  }else process.stdout.write(JSON.stringify(report,null,2)+'\n');
  if(strict&&stages.some(s=>s.status==='blocked'))process.exit(1);
})().catch(error=>{console.error(`release:doctor failed: ${error?.message||error}`);process.exit(2);});
