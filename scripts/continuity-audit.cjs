#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const failures=[];
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const json=(p)=>JSON.parse(read(p));
const pkg=json('package.json');
const app=json('app.json');
const version=pkg.version;
const checkpoint=`V${version.replace(/\.0$/,'')}`;
const auditName=`docs/AUDIT_V${version.replace(/\.0$/,'').replace(/\./g,'')}.md`;

if(app?.expo?.version!==version) failures.push(`app.json version ${app?.expo?.version} != package.json ${version}`);
const readme=read('README.md');
const readmeTitle=(readme.match(/^#\s+Notre Table\s+—\s+(V[^\s]+)\s*$/m)||[])[1];
if(readmeTitle!==checkpoint) failures.push(`README title ${readmeTitle||'missing'} != ${checkpoint}`);
const currentSection=`## ${checkpoint} —`;
const currentIndex=readme.indexOf(currentSection);
const previous113=readme.indexOf('## V0.113 —');
if(currentIndex<0) failures.push(`README missing current checkpoint section ${currentSection}`);
if(currentIndex>2500) failures.push(`README current checkpoint section is too far from the top (${currentIndex} chars)`);
if(previous113>=0 && currentIndex>previous113) failures.push('README current checkpoint must appear before older V0.113 history.');

const project=read('docs/PROJECT_STATE.md');
if(!project.includes(`## ${checkpoint} —`)) failures.push(`PROJECT_STATE missing ${checkpoint}`);
const verification=read('docs/VERIFICATION.md');
if(!verification.startsWith(`# Vérifications techniques — état courant ${checkpoint}`)) failures.push(`VERIFICATION heading must announce ${checkpoint}`);
if(!fs.existsSync(path.join(root,auditName))) failures.push(`Missing current audit file ${auditName}`);
const betaExample=json('docs/beta-acceptance.example.json');
if(betaExample.app_version!==version) failures.push(`beta acceptance example version ${betaExample.app_version||'missing'} != package.json ${version}`);

const releaseAudit=read('scripts/release-audit.cjs');
if(!releaseAudit.includes("continuity:audit")) failures.push('release-audit must enforce continuity:audit wiring.');

console.log('Notre Table continuity audit');
console.log(`- Package/app checkpoint: ${checkpoint}`);
console.log(`- Expected audit: ${auditName}`);
if(failures.length){
  for(const failure of failures) console.error(`- FAIL: ${failure}`);
  process.exit(1);
}
console.log('PASS');
