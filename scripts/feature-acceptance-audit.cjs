#!/usr/bin/env node
const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');const file=path.join(root,'docs','FEATURE_ACCEPTANCE_MATRIX.json');
const failures=[];const requiredGroups=['location','delivery','carousel','sponsored','lia_privacy','memos_favorites','network_rtl_accessibility'];
let matrix;try{matrix=JSON.parse(fs.readFileSync(file,'utf8'));}catch(error){console.error(`FEATURE_ACCEPTANCE_FAIL: ${error.message}`);process.exit(1);}
if(matrix.format_version!==1)failures.push('format_version must be 1');
if(matrix.checkpoint!=='V0.184')failures.push('checkpoint must be V0.184');
if(!Array.isArray(matrix.scenarios)||matrix.scenarios.length!==53)failures.push(`expected 53 scenarios, found ${matrix.scenarios?.length??'invalid'}`);
const ids=new Set();const groups=new Map(requiredGroups.map(group=>[group,0]));let critical=0;
for(const [index,row] of (matrix.scenarios||[]).entries()){
  if(!row||typeof row.id!=='string'||!row.id.trim())failures.push(`scenario ${index} missing id`);
  if(ids.has(row.id))failures.push(`duplicate scenario ${row.id}`);ids.add(row.id);
  if(!groups.has(row.group))failures.push(`unknown group ${row.group}`);else groups.set(row.group,groups.get(row.group)+1);
  if(row.status!=='required')failures.push(`scenario ${row.id} must remain required`);
  if(typeof row.critical!=='boolean')failures.push(`scenario ${row.id} critical must be boolean`);else if(row.critical)critical++;
}
for(const [group,count] of groups)if(count===0)failures.push(`missing group ${group}`);
if(critical<20)failures.push(`critical coverage too small: ${critical}`);
console.log('Notre Table feature acceptance matrix');console.log(`- Scenarios: ${matrix.scenarios?.length??0}`);console.log(`- Critical invariants: ${critical}`);console.log(`- Groups: ${[...groups.entries()].map(([g,c])=>`${g}=${c}`).join(', ')}`);
if(failures.length){for(const failure of failures)console.error(`- FAIL: ${failure}`);process.exit(1);}console.log('PASS');
