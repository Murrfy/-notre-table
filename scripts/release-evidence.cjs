#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const root=path.resolve(__dirname,'..');
const outputDir=path.join(root,'.validation');
const outputPath=path.join(outputDir,'release-evidence.json');
const sha256=(buffer)=>crypto.createHash('sha256').update(buffer).digest('hex');
const normalize=(p)=>p.split(path.sep).join('/');

function listFiles(dir){
  const absolute=path.join(root,dir);
  if(!fs.existsSync(absolute))return [];
  const out=[];
  for(const entry of fs.readdirSync(absolute,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    const relative=path.join(dir,entry.name);
    if(entry.isDirectory())out.push(...listFiles(relative));
    else if(entry.isFile())out.push(normalize(relative));
  }
  return out;
}

const fixed=[
  'package.json','app.json','eas.json','tsconfig.json','.gitignore','.env.example','README.md',
  '.github/workflows/validate.yml','.github/workflows/bootstrap-lockfile.yml',
  'docs/RELEASE_LANE.md','docs/BETA_ACCEPTANCE.md','docs/VERIFICATION.md',
  'supabase/config.toml','supabase/schema.sql','supabase/assert_backend.sql','supabase/verify_backend.sql',
];
const files=[
  ...fixed,
  'App.tsx','index.ts',
  ...listFiles('src'),
  ...listFiles('languages'),
  ...listFiles('docs'),
  ...listFiles('.github'),
  ...listFiles('supabase/migrations'),
  ...listFiles('supabase/functions'),
  ...listFiles('scripts'),
].filter((v,i,a)=>a.indexOf(v)===i).sort();

const entries=[];
for(const relative of files){
  const absolute=path.join(root,relative);
  if(!fs.existsSync(absolute))throw new Error(`Release evidence source missing: ${relative}`);
  const bytes=fs.readFileSync(absolute);
  entries.push({path:relative,bytes:bytes.length,sha256:sha256(bytes)});
}
const lockPath=path.join(root,'package-lock.json');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const contractMaterial=entries.map(x=>`${x.path}\0${x.sha256}`).join('\n');
const manifest={
  format_version:1,
  app_version:pkg.version,
  source_revision:process.env.GITHUB_SHA||null,
  github_run_id:process.env.GITHUB_RUN_ID||null,
  node_version:process.versions.node,
  npm_version:(String(process.env.npm_config_user_agent||'').match(/(?:^|\s)npm\/([^\s]+)/)||[])[1]||null,
  package_lock_sha256:fs.existsSync(lockPath)?sha256(fs.readFileSync(lockPath)):null,
  release_contract_sha256:sha256(Buffer.from(contractMaterial,'utf8')),
  files:entries,
};
fs.mkdirSync(outputDir,{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(manifest,null,2)+'\n');
console.log(`Release evidence written: ${path.relative(root,outputPath)}`);
console.log(`- Version: ${manifest.app_version}`);
console.log(`- Files hashed: ${entries.length}`);
console.log(`- Contract SHA-256: ${manifest.release_contract_sha256}`);
if(!manifest.package_lock_sha256)console.log('- NOTE: package-lock.json absent in this environment; CI evidence must include it after bootstrap.');
