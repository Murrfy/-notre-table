#!/usr/bin/env node
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const failures=[];
const notes=[];
const normalize=p=>p.split(path.sep).join('/');

const skipDirs=new Set(['.git','node_modules','.expo','.validation','dist','web-build']);
const allowedSensitiveBasenames=new Set(['.env.example']);
const forbiddenBasenames=new Set([
  '.env','.npmrc','.yarnrc','credentials.json','service-account.json','service_account.json',
  'google-service-account.json','auth.json','secrets.json','secret.json'
]);
const forbiddenExts=new Set(['.pem','.key','.p8','.p12','.pfx','.jks','.keystore','.mobileprovision']);
const forbiddenNamePatterns=[
  /(^|[-_.])service[-_.]?account($|[-_.])/i,
  /(^|[-_.])credentials?($|[-_.])/i,
  /(^|[-_.])secrets?($|[-_.])/i,
  /(^|[-_.])private[-_.]?key($|[-_.])/i,
];
const generatedNamePatterns=[/\.zip$/i,/\.tgz$/i,/\.tar\.gz$/i,/\.log$/i,/\.tmp$/i,/\.swp$/i,/~$/];

function walk(dir='.'){
  const absolute=path.join(root,dir);
  const out=[];
  for(const entry of fs.readdirSync(absolute,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    if(dir==='.' && entry.name==='.git') continue;
    const relative=dir==='.'?entry.name:path.join(dir,entry.name);
    if(entry.isDirectory()){
      if(skipDirs.has(entry.name)) continue;
      out.push(...walk(relative));
    } else if(entry.isFile()) out.push(normalize(relative));
  }
  return out;
}

const files=walk();
for(const relative of files){
  const base=path.basename(relative);
  const lower=base.toLowerCase();
  if(allowedSensitiveBasenames.has(base)) continue;
  if(forbiddenBasenames.has(lower)) failures.push(`${relative}: forbidden sensitive filename`);
  if(base.startsWith('.env.')) failures.push(`${relative}: environment file must never be versioned (only .env.example is allowed)`);
  if(forbiddenExts.has(path.extname(lower))) failures.push(`${relative}: credential/private-key file extension is forbidden`);
  if(forbiddenNamePatterns.some(re=>re.test(base))) failures.push(`${relative}: suspicious credential/secret filename`);
  if(generatedNamePatterns.some(re=>re.test(base))) failures.push(`${relative}: generated/archive artifact must not live in the source checkpoint`);
}

const gitignore=fs.readFileSync(path.join(root,'.gitignore'),'utf8').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
for(const required of ['node_modules/','.expo/','dist/','web-build/','.env','.env.*','!.env.example','.validation/']){
  if(!gitignore.includes(required)) failures.push(`.gitignore missing required rule: ${required}`);
}

// Public/mobile source may mention key *names* but must not contain actual privileged key values.
const secretPatterns=[
  {name:'private key block',re:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/},
  {name:'Supabase secret key',re:/\bsb_secret_[A-Za-z0-9_-]{16,}\b/},
  {name:'RevenueCat secret key',re:/\bsk_[A-Za-z0-9_-]{20,}\b/},
  {name:'GitHub token',re:/\bgh[opusr]_[A-Za-z0-9]{20,}\b/},
];
const textExtensions=new Set(['.js','.cjs','.mjs','.ts','.tsx','.json','.md','.yml','.yaml','.toml','.sql','.txt','.example']);
const contentSkipPrefixes=['docs/AUDIT_'];
const contentSkipFiles=new Set([
  'scripts/regression-tests.cjs','scripts/eas-build-pre-install-tests.cjs','scripts/source-hygiene-audit.cjs'
]);
for(const relative of files){
  if(contentSkipFiles.has(relative)||contentSkipPrefixes.some(p=>relative.startsWith(p))) continue;
  const ext=path.extname(relative).toLowerCase();
  if(!textExtensions.has(ext) && path.basename(relative)!=='.env.example') continue;
  const stat=fs.statSync(path.join(root,relative));
  if(stat.size>2_000_000) continue;
  const text=fs.readFileSync(path.join(root,relative),'utf8');
  for(const pattern of secretPatterns){
    if(pattern.re.test(text)) failures.push(`${relative}: possible ${pattern.name} value detected`);
  }
}

notes.push(`Source files inspected: ${files.length}`);
notes.push('Ignored build/cache dirs: .git, node_modules, .expo, .validation, dist, web-build');
console.log('Notre Table source hygiene audit');
for(const note of notes) console.log(`- ${note}`);
if(failures.length){
  for(const failure of failures) console.error(`- FAIL: ${failure}`);
  process.exit(1);
}
console.log('PASS');
