#!/usr/bin/env node
const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const matrix=JSON.parse(fs.readFileSync(path.join(root,'docs','FEATURE_ACCEPTANCE_MATRIX.json'),'utf8'));
const evidenceArg=process.argv[2]||'.validation/feature-beta-acceptance.json';
const evidencePath=path.isAbsolute(evidenceArg)?evidenceArg:path.join(root,evidenceArg);
function fail(message){console.error(`FEATURE_BETA_ACCEPTANCE_FAIL: ${message}`);process.exit(1);}
if(!fs.existsSync(evidencePath))fail(`missing evidence file ${path.relative(root,evidencePath)}. Real-device feature acceptance is not proven.`);
let evidence;try{evidence=JSON.parse(fs.readFileSync(evidencePath,'utf8'));}catch(error){fail(`invalid JSON: ${error.message}`);}
if(evidence.format_version!==1)fail('format_version must be 1.');
if(evidence.app_version!==pkg.version)fail(`app_version must match ${pkg.version}.`);
if(typeof evidence.source_revision!=='string'||evidence.source_revision.trim().length<7)fail('source_revision is required.');
if(typeof evidence.build_id!=='string'||!evidence.build_id.trim())fail('build_id is required.');
if(!evidence.tested_at||Number.isNaN(Date.parse(evidence.tested_at)))fail('tested_at must be an ISO date/time.');
if(!Array.isArray(evidence.devices)||evidence.devices.length<2)fail('at least two real devices are required.');
const labels=new Set();
for(const [i,d] of evidence.devices.entries()){
  if(!d||typeof d.label!=='string'||!d.label.trim())fail(`devices[${i}].label is required.`);
  if(labels.has(d.label))fail('device labels must be unique.');labels.add(d.label);
  if(!['ios','android'].includes(String(d.platform||'').toLowerCase()))fail(`devices[${i}].platform must be ios or android.`);
  if(typeof d.os_version!=='string'||!d.os_version.trim())fail(`devices[${i}].os_version is required.`);
}
if(!evidence.scenarios||typeof evidence.scenarios!=='object'||Array.isArray(evidence.scenarios))fail('scenarios object is required.');
const required=(matrix.scenarios||[]).filter(row=>row.status==='required');
for(const row of required){
  const result=evidence.scenarios[row.id];
  if(!result)fail(`missing scenario ${row.id}.`);
  if(result.status!=='pass')fail(`scenario ${row.id} is ${result.status||'unset'}, expected pass.`);
  if(typeof result.evidence!=='string'||!result.evidence.trim())fail(`scenario ${row.id} requires a short evidence note/reference.`);
}
const extras=Object.keys(evidence.scenarios).filter(id=>!required.some(row=>row.id===id));
const critical=required.filter(row=>row.critical).length;
console.log('NOTRE_TABLE_FEATURE_BETA_ACCEPTANCE_PASS');
console.log(`- App version: ${evidence.app_version}`);
console.log(`- Build: ${evidence.build_id}`);
console.log(`- Devices: ${evidence.devices.length}`);
console.log(`- Required scenarios: ${required.length}/${required.length}`);
console.log(`- Critical scenarios: ${critical}/${critical}`);
if(extras.length)console.log(`- Additional scenarios recorded: ${extras.length}`);
