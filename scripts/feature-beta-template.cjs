#!/usr/bin/env node
const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const matrix=JSON.parse(fs.readFileSync(path.join(root,'docs','FEATURE_ACCEPTANCE_MATRIX.json'),'utf8'));
const outArg=process.argv[2]||'.validation/feature-beta-acceptance.json';
const out=path.isAbsolute(outArg)?outArg:path.join(root,outArg);
const template={
  format_version:1,
  app_version:pkg.version,
  source_revision:'',
  build_id:'',
  tested_at:'',
  devices:[],
  scenarios:Object.fromEntries(matrix.scenarios.map(row=>[row.id,{status:'pending',evidence:''}]))
};
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(template,null,2)+'\n');
console.log(`FEATURE_BETA_TEMPLATE_WRITTEN ${path.relative(root,out)}`);
console.log(`- Scenarios: ${matrix.scenarios.length}`);
