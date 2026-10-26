const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const result=spawnSync(process.execPath,[path.join(__dirname,'../tools/build-offline-shared-runtime.js'),'--check'],{encoding:'utf8'});
assert.equal(result.status,0,result.stdout+result.stderr);
console.log('offline-shared-runtime-source: copied online policies and handlers match');
