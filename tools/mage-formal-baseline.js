'use strict';
const fs=require('node:fs'),path=require('node:path');
const {run,builds}=require('./mage-formal-consistency.js');
const SEARCH_RUNS=Math.max(1,Number(process.env.MAGE_FORMAL_SEARCH_RUNS)||10),FINAL_RUNS=Math.max(1,Number(process.env.MAGE_FORMAL_RUNS)||200);
const SCENARIOS=[['normal',120,2500,1],['boss180',180,1e9,1],['three',120,2500,3],['five',120,2500,5],['boss300',300,1e9,1],['burst20',20,1e9,1]];
function add(a,b){for(const[k,v]of Object.entries(b)){if(typeof v==='number')a[k]=(a[k]||0)+v;else if(v&&typeof v==='object'){a[k]=a[k]||{};add(a[k],v);}}return a;}function divide(a,n){for(const[k,v]of Object.entries(a)){if(typeof v==='number')a[k]=v/n;else if(v&&typeof v==='object')divide(v,n);}return a;}
function average(spec,build,sc,runs){const total={};for(let i=0;i<runs;i++)add(total,run(spec,build,sc[1],sc[2],sc[3],0x450000+i*7919));return divide(total,runs);}
const output={metadata:{searchRuns:SEARCH_RUNS,finalRuns:FINAL_RUNS,source:'formal script.js combat resolver',tickMs:100},scenarios:{}};
for(const sc of SCENARIOS){output.scenarios[sc[0]]={};for(const spec of ['elementalist','arcane-mage']){let winner=null;for(const build of builds(spec)){const metrics=average(spec,build,sc,SEARCH_RUNS);if(!winner||metrics.dps>winner.metrics.dps)winner={build,metrics};}winner.metrics=average(spec,winner.build,sc,FINAL_RUNS);output.scenarios[sc[0]][spec]=winner;}}
const outputPath=path.join(__dirname,'..','tests','simulations','results','mage-formal-baseline.json');
fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({output:outputPath,summary:Object.fromEntries(Object.entries(output.scenarios).map(([name,specs])=>[name,Object.fromEntries(Object.entries(specs).map(([spec,x])=>[spec,{dps:x.metrics.dps,build:x.build}]))]))},null,2));
