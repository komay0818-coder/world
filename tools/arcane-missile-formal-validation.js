'use strict';
const fs=require('node:fs'),path=require('node:path');
const {runFormalScenario,builds}=require('./mage-formal-consistency.js');
const SEARCH_RUNS=Math.max(1,Number(process.env.ARCANE_FORMAL_SEARCH_RUNS)||5),FINAL_RUNS=Math.max(1,Number(process.env.ARCANE_FORMAL_RUNS)||200);
const SCENARIOS=[{id:'boss',seconds:1800,hp:25000,count:1,continuous:false},{id:'continuous5',seconds:600,hp:2500,count:5,continuous:true}];
function add(target,value){for(const[key,item]of Object.entries(value)){if(typeof item==='number')target[key]=(target[key]||0)+item;else if(item&&typeof item==='object'){target[key]=target[key]||{};add(target[key],item);}}return target;}
function divide(target,n){for(const[key,item]of Object.entries(target)){if(typeof item==='number')target[key]=item/n;else if(item&&typeof item==='object')divide(item,n);}return target;}
function average(build,scenario,runs){const total={};for(let i=0;i<runs;i++)add(total,runFormalScenario('arcane-mage',build,scenario.seconds,scenario.hp,scenario.count,0xc45000+i*7919,scenario.continuous));return divide(total,runs);}
function winner(active,scenario,runs){let best=null;for(const build of builds('arcane-mage').filter(entry=>entry.advancedActive===active)){const metrics=average(build,scenario,runs);if(!best||metrics.dps>best.metrics.dps)best={build,metrics};}return best;}
const output={metadata:{searchRuns:SEARCH_RUNS,finalRuns:FINAL_RUNS,source:'formal shared combat resolver',boss:{maxHp:25000,endsOnDeath:true},continuous5:{seconds:600,enemyHp:2500,immediateReplacement:true}},scenarios:{}};
for(const scenario of SCENARIOS){output.scenarios[scenario.id]={};for(const active of ['arcane-missile','arcane-torrent']){const best=winner(active,scenario,SEARCH_RUNS);best.metrics=average(best.build,scenario,FINAL_RUNS);output.scenarios[scenario.id][active]=best;}}
const outputPath=path.join(__dirname,'..','tests','simulations','results','arcane-missile-formal-validation.json');
fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({output:outputPath,summary:Object.fromEntries(Object.entries(output.scenarios).map(([id,row])=>[id,Object.fromEntries(Object.entries(row).map(([active,x])=>[active,{dps:x.metrics.dps,ttk:x.metrics.ttk,kills:x.metrics.combat.kills,build:x.build,markShare:x.metrics.marks.damageShare,exhaustRate:x.metrics.exhaustRate}]))]))},null,2));
