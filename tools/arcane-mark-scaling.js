'use strict';
const fs=require('node:fs'),path=require('node:path');
const {runMissileExperiment,builds}=require('./mage-formal-consistency.js');
const SEARCH_RUNS=Math.max(1,Number(process.env.ARCANE_MARK_SCALING_SEARCH_RUNS)||5),FINAL_RUNS=Math.max(1,Number(process.env.ARCANE_MARK_SCALING_RUNS)||200);
const GROUPS={A:.01,B:.015,C:.02};
const SCENARIOS=[
  {id:'normal',seconds:120,hp:2500,count:1},{id:'boss180',seconds:180,hp:1e9,count:1},
  {id:'three',seconds:120,hp:2500,count:3},{id:'five',seconds:120,hp:2500,count:5},
  {id:'boss300',seconds:300,hp:1e9,count:1},{id:'burst20',seconds:20,hp:1e9,count:1},
  {id:'continuous3',seconds:600,hp:2500,count:3,continuous:true},{id:'continuous5',seconds:600,hp:2500,count:5,continuous:true}
];
function add(target,value){for(const[key,item]of Object.entries(value)){if(typeof item==='number')target[key]=(target[key]||0)+item;else if(item&&typeof item==='object'){target[key]=target[key]||{};add(target[key],item);}}return target;}
function divide(target,n){for(const[key,item]of Object.entries(target)){if(typeof item==='number')target[key]=item/n;else if(item&&typeof item==='object')divide(item,n);}return target;}
function average(group,build,scenario,runs){const total={};for(let i=0;i<runs;i++)add(total,runMissileExperiment('A','arcane-mage',build,scenario.seconds,scenario.hp,scenario.count,0xb45000+i*7919,Boolean(scenario.continuous),GROUPS[group]));return divide(total,runs);}
function winner(group,scenario,runs){let best=null;for(const build of builds('arcane-mage')){const metrics=average(group,build,scenario,runs);if(!best||metrics.dps>best.metrics.dps)best={build,metrics};}return best;}
const formal=JSON.parse(fs.readFileSync(path.join(__dirname,'..','tests','simulations','results','mage-formal-baseline.json'),'utf8'));
const previous=JSON.parse(fs.readFileSync(path.join(__dirname,'..','tests','simulations','results','arcane-missile-experiment.json'),'utf8'));
const output={metadata:{searchRuns:SEARCH_RUNS,finalRuns:FINAL_RUNS,source:'formal shared combat resolver with headless-only four-missile mark scaling',formalSkillDataModified:false,groups:GROUPS},scenarios:{}};
for(const scenario of SCENARIOS){const prior=previous.scenarios[scenario.id];output.scenarios[scenario.id]={elementalist:prior.elementalist,halfPercent:prior.A};for(const group of Object.keys(GROUPS)){const searched=winner(group,scenario,SEARCH_RUNS);searched.metrics=average(group,searched.build,scenario,FINAL_RUNS);output.scenarios[scenario.id][group]=searched;}if(!scenario.continuous&&formal.scenarios[scenario.id])output.scenarios[scenario.id].formalArcane=formal.scenarios[scenario.id]['arcane-mage'];}
const outputPath=path.join(__dirname,'..','tests','simulations','results','arcane-mark-scaling.json');
fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({output:outputPath,summary:Object.fromEntries(Object.entries(output.scenarios).map(([id,row])=>[id,{elementalist:row.elementalist.metrics.dps,halfPercent:row.halfPercent.metrics.dps,A:row.A.metrics.dps,B:row.B.metrics.dps,C:row.C.metrics.dps}]))},null,2));
