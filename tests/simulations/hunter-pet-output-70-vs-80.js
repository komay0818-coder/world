'use strict';
const fs=require('node:fs'),path=require('node:path'),Temple=require('./chapter-three-36-rules.js');
const {simulate,aggregate:balanceAggregate}=require('./hunter-lv45-redrock-temple-round1.js');
const {aggregate:survivalAggregate}=require('./hunter-pet-durability-round1.js');
const VERSIONS={p80:[1,.8,.8],p70:[1,.7,.7]};
const TARGET_RUNS=1000,LONG_RUNS=100,STEADY_RUNS=20;
function rows(spec,count,runs,template,multipliers){return Array.from({length:runs},(_,i)=>simulate(spec,0x705000+count*1009+i*7919,spec==='marksman'?{killTarget:count,pool:Temple.normals,template}:{killTarget:count,pool:Temple.normals,template,petDurability:10,petOutputMultipliers:multipliers}));}
function marksman(count,runs,template){return balanceAggregate(rows('marksman',count,runs,template),count);}
function beast(count,runs,multipliers,template){const samples=rows('beastmaster',count,runs,template,multipliers);return{balance:balanceAggregate(samples,count),survival:survivalAggregate(samples,count,10)};}
const result={metadata:{generatedAt:new Date().toISOString(),map:'3-6 赤岩聖殿',level:45,comparison:['marksman','100/80/80','100/70/70'],marksmanPet:'無HP／耐久／死亡',beastmasterDurability:10,beastmasterReviveSeconds:30,reductionScope:['pet basic','beast slam','wild bite','bloody hunt bleed'],noFormalValueChanges:true,runs:{target:TARGET_RUNS,farm500:LONG_RUNS,farm1000:LONG_RUNS,farm5000:STEADY_RUNS,farm10000:STEADY_RUNS}},targets:{},farm500:{},farm1000:{},farm5000:{},farm10000:{}};
for(const target of [...Temple.normals,Temple.elite]){const cell=result.targets[target.id]={template:target,marksman:marksman(1,TARGET_RUNS,target)};for(const [id,m] of Object.entries(VERSIONS))cell[id]=beast(1,TARGET_RUNS,m,target).balance;}
for(const count of [500,1000,5000,10000]){const runs=count<=1000?LONG_RUNS:STEADY_RUNS,cell=result[`farm${count}`]={marksman:marksman(count,runs)};for(const [id,m] of Object.entries(VERSIONS))cell[id]=beast(count,runs,m);}
const output=path.join(__dirname,'results','hunter-pet-output-70-vs-80.json');fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({output,efficiency:Object.fromEntries([500,1000,5000,10000].map(n=>{const x=result[`farm${n}`];return[n,{marksman:x.marksman.killsPerHour,p80:x.p80.balance.killsPerHour,p70:x.p70.balance.killsPerHour}]}))},null,2));
