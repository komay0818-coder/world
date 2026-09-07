'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { runCombat } = require('./formal-combat-entry.js');

const ROOT = path.join(__dirname, '..', 'reports', 'five-class-baseline');
const SEEDS = Array.from({ length: 100 }, (_, index) => (0x7ea00000 + index) >>> 0);
const JOB = { 'weapon-master':'warrior',berserker:'warrior',marksman:'hunter',beastmaster:'hunter',assassination:'assassin',venom:'assassin',elementalist:'mage','arcane-mage':'mage','holy-priest':'priest','battle-priest':'priest' };
const ARMOR = { chest: { id: 'baseline-chest', slot: 'chest', defense: 12 } };
function equipment(branch) { const job=JOB[branch],w={id:'baseline-weapon',slot:'weapon',attack:24,attackMin:22,attackMax:26,criticalChance:.10};if(job==='assassin')return{...ARMOR,weapon:{...w,attack:15,attackMin:13,attackMax:17,weaponType:'one-handed-dagger',series:'匕首'},offhand:{id:'baseline-offhand-dagger',slot:'offhand',attack:18,attackMin:16,attackMax:20,weaponType:'one-handed-dagger',series:'匕首'}};if(job==='hunter')return{...ARMOR,weapon:{...w,weaponType:'two-handed-bow'}};if(branch==='berserker')return{...ARMOR,weapon:{...w,attack:16,attackMin:14,attackMax:18,weaponType:'two-handed-axe',series:'雙手斧'},offhand:{id:'baseline-offhand-axe',slot:'offhand',attack:16,attackMin:14,attackMax:18,weaponType:'two-handed-axe',series:'雙手斧'}};if(job==='warrior')return{...ARMOR,weapon:{...w,weaponType:'one-handed-sword',series:'劍'},offhand:{id:'baseline-shield',slot:'offhand',series:'盾牌'}};return{...ARMOR,weapon:{...w,weaponType:'two-handed-staff',magicPower:0},offhand:{id:'baseline-focus',slot:'offhand'}};}
function best(branch,mode='five'){return JSON.parse(fs.readFileSync(path.join(ROOT,branch+'.json')))[mode][0].config;}
function spec(branch){return{job:JOB[branch],advancedClass:branch,level:45,equipment:equipment(branch),skills:best(branch,'five')};}
function mean(v){return v.reduce((a,b)=>a+b,0)/v.length;}function stat(v){const m=mean(v);return{mean:m,sd:Math.sqrt(mean(v.map(x=>(x-m)**2)))}}function maps(ms){const o={};for(const m of ms)for(const[k,v]of Object.entries(m||{}))o[k]=(o[k]||0)+v;return Object.fromEntries(Object.entries(o).map(([k,v])=>[k,v/ms.length]));}
function coverage(timeline,duration,predicate){let covered=0;for(let i=0;i<timeline.length;i++){const start=timeline[i].atMs,end=i+1<timeline.length?timeline[i+1].atMs:duration*1000;if(predicate(timeline[i]))covered+=Math.max(0,end-start);}return covered/(duration*1000);}

const mode=process.argv.find(x=>x.startsWith('--mode='))?.split('=')[1],id=process.argv.find(x=>x.startsWith('--id='))?.split('=')[1],output=process.argv.find(x=>x.startsWith('--output='))?.slice(9);
if(!mode||!id||!output)throw new Error('Required: --mode=party|long-boss --id=<template-or-branch> --output=<file>');
let report;
if(mode==='long-boss'){
  const branch=id,job=JOB[branch],config=best(branch,'boss');
  const runs=SEEDS.map(seed=>runCombat({job,advancedClass:branch,level:45,mode:'boss',maxSeconds:1800,seed,skills:config,equipment:equipment(branch),enemy:{hp:60000,defense:20,attack:.1,attackSpeed:1,level:45,evasion:0,parry:0}}));
  report={mode,id,job,config,seeds:100,ttk:stat(runs.map(r=>r.ttk)),dps:stat(runs.map(r=>r.dps)),resourceMinimum:stat(runs.map(r=>r.resource?.minimum||0)),resourceBlocked:stat(runs.map(r=>r.resource?.blocked||0)),resourceZeroDuration:stat(runs.map(r=>r.resource?.zeroDuration||0)),resourceExhaustionDuration:stat(runs.map(r=>r.resource?.exhaustionDuration||0)),resourceExhaustionEpisodes:stat(runs.map(r=>r.resource?.exhaustionEpisodes||0)),damageBySource:maps(runs.map(r=>r.combat.damageBySource)),skillCasts:maps(runs.map(r=>r.skillCasts))};
}else{
  const templates={WHMP:['weapon-master','beastmaster','arcane-mage','holy-priest'],WAMP:['weapon-master','assassination','arcane-mage','holy-priest'],WHAP:['weapon-master','beastmaster','assassination','holy-priest'],AHMP:['assassination','beastmaster','arcane-mage','holy-priest'],WHMA:['weapon-master','beastmaster','arcane-mage','assassination'],WHmP:['weapon-master','marksman','arcane-mage','holy-priest'],WHEP:['weapon-master','beastmaster','elementalist','holy-priest'],WHMBP:['weapon-master','beastmaster','arcane-mage','battle-priest'],BHMP:['berserker','beastmaster','arcane-mage','holy-priest'],WVMP:['weapon-master','venom','arcane-mage','holy-priest']};
  const branches=templates[id];if(!branches)throw new Error('Unknown party template '+id);const members=branches.map(spec),main=members[0],party=members.slice(1);
  const runs=SEEDS.map(seed=>runCombat({...main,mode:'party-four',seconds:120,seed,party,potions:3,enemy:{hp:2500,defense:20,attack:12,attackSpeed:1,level:45,evasion:0,parry:0}}));
  const support=runs.map(r=>Object.values(r.party.support||{})[0]||{});
  report={mode,id,branches,seeds:100,teamDps:stat(runs.map(r=>r.party.totalDamage/r.duration)),killsPerMinute:stat(runs.map(r=>r.party.kills/r.duration*60)),averageHpRatio:stat(runs.map(r=>r.party.averageHpRatio)),deathRate:runs.filter(r=>r.party.deaths>0).length/100,deaths:stat(runs.map(r=>r.party.deaths)),firstDeathAt:stat(runs.filter(r=>r.party.firstDeathAtMs!==null).map(r=>r.party.firstDeathAtMs/1000).concat(runs.every(r=>r.party.firstDeathAtMs===null)?[0]:[])),effectiveHealing:stat(support.map(s=>s.effectiveHealing||0)),hps:stat(support.map(s=>(s.effectiveHealing||0)/120)),overhealing:stat(support.map(s=>s.overhealing||0)),shieldAbsorbed:stat(support.map(s=>s.shieldAbsorbed||0)),revives:stat(runs.map(r=>r.party.revives)),buffCoverage:stat(runs.map(r=>coverage(r.party.statusTimeline,r.duration,state=>state.allies.some(ally=>ally.buffed)))),controlCoverage:stat(runs.map(r=>coverage(r.party.statusTimeline,r.duration,state=>state.enemies.some(enemy=>enemy.controlled)))),debuffCoverage:stat(runs.map(r=>coverage(r.party.statusTimeline,r.duration,state=>state.enemies.some(enemy=>enemy.debuffed)))),memberDamage:maps(runs.map(r=>r.party.memberDamage))};
}
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(mode,id,'complete');
