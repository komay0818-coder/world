'use strict';
const {runCombat}=require('./formal-combat-entry.js');
const {MAPS,config}=require('./chapter-one-balance-playtest.js');
const targets=MAPS.filter(map=>['plains-entrance','wolf-den'].includes(map.id));
const versions=[
  {id:'baseline',name:'基準',attack:1,counts:{'plains-entrance':5,'wolf-den':5}},
  {id:'A',name:'ATK -15%',attack:.85,counts:{'plains-entrance':5,'wolf-den':5}},
  {id:'B',name:'ATK -25%',attack:.75,counts:{'plains-entrance':5,'wolf-den':5}},
  {id:'C',name:'敵人數 3／4',attack:1,counts:{'plains-entrance':3,'wolf-den':4}},
  {id:'D',name:'ATK -15%＋四敵',attack:.85,counts:{'plains-entrance':4,'wolf-den':4}}
];
const sum=xs=>xs.reduce((a,b)=>a+b,0),mean=xs=>xs.length?sum(xs)/xs.length:null;
function run(version,map){const rows=[];for(let seed=1;seed<=20;seed++){const c=config(map,seed);c.monsterAttackMultiplier=version.attack;c.enemyCount=version.counts[map.id];rows.push(runCombat(c));}const dead=rows.filter(row=>row.party.final.find(member=>member.id==='formal-warrior')?.alive===false);const kills=sum(rows.map(row=>Object.values(row.testTelemetry.kills).reduce((a,b)=>a+b,0)));return{map:map.name,level:map.level,enemyCount:version.counts[map.id],attackMultiplier:version.attack,survivors:20-dead.length,survivalRate:(20-dead.length)/20,averageDeathSeconds:mean(dead.map(row=>row.duration)),minimumHp:Math.min(...rows.flatMap(row=>Object.values(row.party.minimumHpByMember))),potionsUsed:sum(rows.map(row=>row.testTelemetry.potionsUsed)),potionDrops:sum(rows.map(row=>row.testTelemetry.healingPotionDrops)),kills,killsPerMinute:kills/100,earnedXp:sum(rows.map(row=>row.testTelemetry.earnedXp)),earnedGold:sum(rows.map(row=>row.testTelemetry.earnedGold))};}
const output={metadata:{generatedAt:new Date().toISOString(),runsPerScenario:20,secondsPerRun:300,seeds:'1..20',temporaryOverridesOnly:true},versions:versions.map(version=>({id:version.id,name:version.name,maps:targets.map(map=>run(version,map))}))};
process.stdout.write(JSON.stringify(output,null,2));
