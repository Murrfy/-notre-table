#!/usr/bin/env node
const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const app=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8'));
const failures=[];
const notes=[];

function parse(v){
  const m=String(v).replace(/^[~^]/,'').match(/^(\d+)\.(\d+)\.(\d+)/);
  return m?m.slice(1).map(Number):null;
}
function atLeast(actual,min){
  const a=parse(actual),b=parse(min); if(!a||!b)return false;
  for(let i=0;i<3;i++){if(a[i]>b[i])return true;if(a[i]<b[i])return false;}return true;
}
function expect(section,name,value){
  const actual=pkg[section]?.[name];
  if(actual!==value) failures.push(`${name}: expected ${value}, found ${actual??'missing'}`);
}

const expectedNode='22.16.0';
const expectedNpm='10.9.2';
if(process.versions.node!==expectedNode) failures.push(`Node ${process.versions.node} does not match the release toolchain ${expectedNode}.`);
const npmUserAgent=String(process.env.npm_config_user_agent||'');
const npmMatch=npmUserAgent.match(/(?:^|\s)npm\/([^\s]+)/);
if(npmMatch&&npmMatch[1]!==expectedNpm) failures.push(`npm ${npmMatch[1]} does not match the release toolchain ${expectedNpm}.`);
if(pkg.version!==app.expo?.version) failures.push(`Version mismatch: package.json=${pkg.version}, app.json=${app.expo?.version}`);

// SDK 57 compatibility floor / current recommended patch line verified against Expo docs on 2026-09-14.
expect('dependencies','expo','~57.0.17');
expect('dependencies','react','19.2.3');
expect('dependencies','react-native','0.86.3');
expect('dependencies','expo-status-bar','~57.0.1');
expect('dependencies','expo-notifications','~57.0.18');
expect('dependencies','expo-print','~57.0.2');
expect('dependencies','expo-sharing','~57.0.19');
expect('dependencies','expo-image-picker','~57.0.17');
expect('dependencies','expo-keep-awake','~57.0.2');
expect('dependencies','expo-localization','~57.0.2');
expect('dependencies','expo-file-system','~57.0.7');
expect('dependencies','expo-linking','~57.0.10');
expect('dependencies','expo-network','~57.0.2');
expect('dependencies','expo-system-ui','~57.0.4');
expect('dependencies','react-native-safe-area-context','~5.7.0');

const modulesDir=path.join(root,'node_modules');
if(!fs.existsSync(modulesDir)) notes.push('node_modules absent: full typecheck / Expo bundle validation cannot run in this environment yet.');
else notes.push('node_modules present: run npm run validate:installed before claiming a validated bundle.');

console.log('Notre Table environment preflight');
console.log(`- Node: ${process.versions.node}`);
console.log(`- npm: ${npmMatch?.[1]||'not detected (run through npm for full toolchain proof)'}`);
console.log(`- App version: ${pkg.version}`);
console.log(`- Dependency installation: ${fs.existsSync(modulesDir)?'present':'not installed'}`);
for(const n of notes) console.log(`- NOTE: ${n}`);
if(failures.length){for(const f of failures) console.error(`- FAIL: ${f}`);process.exit(1);} 
console.log('PASS');
