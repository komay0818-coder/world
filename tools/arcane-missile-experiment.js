'use strict';
const fs=require('node:fs'),path=require('node:path');
const {runMissileExperiment,builds}=require('./mage-formal-consistency.js');
const SEARCH_RUNS=Math.max(1,Number(process.env.ARCANE_MARK_SEARCH_RUNS)||5),FINAL_RUNS=Math.max(1,Number(process.env.ARCANE_MARK_RUNS)||200);
const SCENARIOS=[
  {id:'normal',seconds:120,hp:2500,count:1},
  {id:'boss180',seconds:180,hp:1e9,count:1},
  {id:'three',seconds:120,hp:2500,count:3},
  {id:'five',seconds:120,hp:2500,count:5},
  {id:'boss300',seconds:300,hp:1e9,count:1},
  {id:'burst20',seconds:20,hp:1e9,count:1},
  {id:'continuous3',seconds:600,hp:2500,count:3,continuous:true},
  {id:'continuous5',seconds:600,hp:2500,count:5,continuous:true}
];
function add(target,value){for(const[key,item]of Object.entries(value)){if(typeof item==='number')target[key]=(target[key]||0)+item;else if(item&&typeof item==='object'){target[key]=target[key]||{};add(target[key],item);}}return target;}
function divide(target,n){for(const[key,item]of Object.entries(target)){if(typeof item==='number')target[key]=item/n;else if(item&&typeof item==='object')divide(item,n);}return target;}
function average(variant,spec,build,scenario,runs){const total={};for(let i=0;i<runs;i++)add(total,runMissileExperiment(variant,spec,build,scenario.seconds,scenario.hp,scenario.count,0xa45000+i*7919,Boolean(scenario.continuous)));return divide(total,runs);}
function winner(variant,spec,scenario,runs){let best=null;for(const build of builds(spec)){const metrics=average(variant,spec,build,scenario,runs);if(!best||metrics.dps>best.metrics.dps)best={build,metrics};}return best;}
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,'..','tests','simulations','results','mage-formal-baseline.json'),'utf8'));
const output={metadata:{searchRuns:SEARCH_RUNS,finalRuns:FINAL_RUNS,source:'formal shared combat resolver with headless-only arcane missile overlay',formalSkillDataModified:false,variants:{A:'four missiles plus marks; no Lv6 repeat',B:'A plus 30% fifth missile at 32%'}},scenarios:{}};
for(const scenario of SCENARIOS){output.scenarios[scenario.id]={};let elementalist;
  if(baseline.scenarios[scenario.id]?.elementalist&&!scenario.continuous)elementalist={...baseline.scenarios[scenario.id].elementalist,source:'8650eb8 formal baseline'};
  else {const searched=winner('A','elementalist',scenario,SEARCH_RUNS);searched.metrics=average('A','elementalist',searched.build,scenario,FINAL_RUNS);elementalist={...searched,source:'formal continuous baseline'};}
  output.scenarios[scenario.id].elementalist=elementalist;
  for(const variant of ['A','B']){const searched=winner(variant,'arcane-mage',scenario,SEARCH_RUNS);searched.metrics=average(variant,'arcane-mage',searched.build,scenario,FINAL_RUNS);output.scenarios[scenario.id][variant]=searched;}
}
const outputPath=path.join(__dirname,'..','tests','simulations','results','arcane-missile-experiment.json');
fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({output:outputPath,summary:Object.fromEntries(Object.entries(output.scenarios).map(([id,row])=>[id,{elementalist:row.elementalist.metrics.dps,A:row.A.metrics.dps,B:row.B.metrics.dps,Amarks:row.A.metrics.marks.damageShare,Bmarks:row.B.metrics.marks.damageShare}]))},null,2));
