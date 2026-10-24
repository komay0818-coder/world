'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Contract=require('../account-api-contract.js');
const root=path.join(__dirname,'..'),sources=['account-auth-entry.js','account-session-controller.js','cloud-save-sync.js','play-lease-client.js'].map(name=>fs.readFileSync(path.join(root,name),'utf8')).join('\n');
let passed=0;const check=(value,label)=>{assert(value,label);passed++;};
const literalPaths=[...sources.matchAll(/['"](\/v1\/[^'"]+)['"]/g)].map(match=>match[1]);
for(const pathName of new Set(literalPaths))check(Contract.capabilities.some(value=>value.endsWith(' '+pathName)),`${pathName} is registered in the browser API contract`);
for(const value of Contract.capabilities){const split=value.indexOf(' '),method=value.slice(0,split),pathName=value.slice(split+1);check(Contract.allows(pathName,method),`${value} is accepted by the whitelist`);}
check(!Contract.allows('/v1/play-lease/acquire','GET'),'wrong method is rejected even for a registered path');
check(!Contract.allows('/v1/not-registered','POST'),'unregistered API is rejected');
assert.throws(()=>Contract.validateServer({apiContractVersion:'old',apiCapabilities:Contract.capabilities}),/版本不相容/);passed++;
assert.throws(()=>Contract.validateServer({apiContractVersion:Contract.VERSION,apiCapabilities:Contract.capabilities.filter(value=>!value.includes('play-lease\/acquire'))}),/缺少必要帳號 API/);passed++;
check(Contract.validateServer({apiContractVersion:Contract.VERSION,apiCapabilities:Contract.capabilities})===true,'matching frontend and backend contracts pass startup validation');
const backend=fs.readFileSync(path.join(root,'apps','api','src','api-contract.ts'),'utf8');
check(backend.includes(`API_CONTRACT_VERSION = '${Contract.VERSION}'`),'backend and browser expose the same contract version');
for(const route of Object.values(Contract.ROUTES))check(backend.includes(`method: '${route.method}', path: '${route.path}'`),`${route.method} ${route.path} exists in the backend contract`);
console.log('Account API contract: '+passed+' checks passed');
