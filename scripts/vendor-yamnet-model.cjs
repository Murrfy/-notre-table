#!/usr/bin/env node
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const EXPECTED_SHA='10c95ea3eb9a7bb4cb8bddf6feb023250381008177ac162ce169694d05c317de';
const EXPECTED_BYTES=4126810;
const root=path.resolve(__dirname,'..');
const target=path.join(root,'modules','lia-sound-analysis','android','src','main','assets','yamnet.tflite');
const source=process.argv[2];

if(!source){
  console.error('Usage: node scripts/vendor-yamnet-model.cjs /absolute/path/to/1.tflite');
  console.error('Expected upstream: Google YAMNet LiteRT classification-tflite v1 (Apache-2.0).');
  process.exit(2);
}
const absolute=path.resolve(source);
if(!fs.existsSync(absolute))throw new Error(`YAMNet source not found: ${absolute}`);
const bytes=fs.readFileSync(absolute);
const sha=crypto.createHash('sha256').update(bytes).digest('hex');
if(bytes.length!==EXPECTED_BYTES)throw new Error(`YAMNet size mismatch: got ${bytes.length}, expected ${EXPECTED_BYTES}`);
if(sha!==EXPECTED_SHA)throw new Error(`YAMNet SHA-256 mismatch: got ${sha}, expected ${EXPECTED_SHA}`);
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,bytes);
console.log(`Vendored verified YAMNet: ${path.relative(root,target)}`);
console.log(`- bytes: ${bytes.length}`);
console.log(`- sha256: ${sha}`);
