'use strict';

const fs=require('node:fs'),path=require('node:path');
const {runCombat,listSkills}=require('./formal-combat-entry.js');
const SEEDS=Array.from({length:100},(_,i)=>(0xbea50000+i)>>>0);
const EQUIPMENT={chest:{id:'baseline-chest',slot:'chest',defense:12},weapon:{id:'baseline-bow',slot:'weapon',attack:24,attackMin:22,attackMax:26,criticalChance:.10,weaponType:'two-handed-bow'}};
const ENEMY_FIVE={hp:2500,defense:20,attack:.1,attackSpeed:1,level:45,evasion:0,parry:0};
const ENEMY_BOSS={hp:12000,defense:20,attack:.1,attackSpeed:1,level:45,evasion:0,parry:0};
const ENEMY_LONG={...ENEMY_BOSS,hp:60000};
const skills=listSkills('hunter','beastmaster'),active=skills.filter(x=>x.type==='active'),passive=skills.filter(x=>x.type==='passive');
const COMBOS=active.flatMap(a=>passive.map(p=>({activeLv6:a.id,passiveLv6:p.id})));
const mean=v=>v.reduce((a,b)=>a+b,0)/v.length;
const stat=v=>{const m=mean(v);return{mean:m,sd:Math.sqrt(mean(v.map(x=>(x-m)**2)))}};
const maps=ms=>{const o={};for(const m of ms)for(const[k,v]of Object.entries(m||{}))o[k]=(o[k]||0)+v;return Object.fromEntries(Object.entries(o).map(([k,v])=>[k,v/ms.length]));};
function petParts(result){const source=result.combat.damageBySource,total=result.totalDamage,petBasic=source['pet-basic']||0,bite=source['pet-bite']||0,slam=source['beast-slam']||0,bleed=source['pet-bleed']||0,petTotal=petBasic+bite+slam+bleed,perPet={};for(const event of result.combat.petEvents||[]){if(!(event.damage>0))continue;perPet[event.petId]=(perPet[event.petId]||0)+event.damage;}return{petBasic,bite,slam,bleed,petTotal,petShare:total?petTotal/total:0,perPet};}
function sample(result){const pet=petParts(result);return{dps:result.dps,ttk:result.ttk||0,kpm:result.killsPerMinute||0,total:result.totalDamage,basicShare:result.basicShare,skillShare:result.activeSkillShare,aoeShare:result.aoeShare,petDps:pet.petTotal/result.duration,petShare:pet.petShare,petBasicDps:pet.petBasic/result.duration,biteDps:pet.bite/result.duration,slamDps:pet.slam/result.duration,bleedDps:pet.bleed/result.duration,perPet:pet.perPet,resourceMin:result.arrows.minimum,zero:result.arrows.zeroDuration,blocked:result.arrows.blocked};}
function aggregate(runs,config){const keys=['dps','ttk','kpm','total','basicShare','skillShare','aoeShare','petDps','petShare','petBasicDps','biteDps','slamDps','bleedDps','resourceMin','zero','blocked'];return{config,...Object.fromEntries(keys.map(k=>[k,stat(runs.map(x=>x[k]))])),perPetDamage:maps(runs.map(x=>x.perPet))};}
function runScenario(kind,value){const sensitivity=kind==='pet'?{petDamageMultiplier:value,wildBondLv6Scale:1}:{petDamageMultiplier:1,wildBondLv6Scale:value};const five=[],boss=[];for(const config of COMBOS){five.push(aggregate(SEEDS.map(seed=>sample(runCombat({job:'hunter',advancedClass:'beastmaster',level:45,mode:'fixed-five',seconds:120,seed,equipment:EQUIPMENT,skills:config,enemy:ENEMY_FIVE,sensitivity}))),config));boss.push(aggregate(SEEDS.map(seed=>sample(runCombat({job:'hunter',advancedClass:'beastmaster',level:45,mode:'boss',maxSeconds:900,seed,equipment:EQUIPMENT,skills:config,enemy:ENEMY_BOSS,sensitivity}))),config));}five.sort((a,b)=>b.dps.mean-a.dps.mean);boss.sort((a,b)=>a.ttk.mean-b.ttk.mean);const long=aggregate(SEEDS.map(seed=>sample(runCombat({job:'hunter',advancedClass:'beastmaster',level:45,mode:'boss',maxSeconds:1800,seed,equipment:EQUIPMENT,skills:boss[0].config,enemy:ENEMY_LONG,sensitivity}))),boss[0].config);return{kind,value,seeds:100,combinations:COMBOS.length,sensitivity,five,boss,long};}
const kind=process.argv.find(x=>x.startsWith('--kind='))?.split('=')[1],value=Number(process.argv.find(x=>x.startsWith('--value='))?.split('=')[1]),output=process.argv.find(x=>x.startsWith('--output='))?.slice(9);
if(!['pet','wild-bond'].includes(kind)||!Number.isFinite(value)||!output)throw new Error('Required --kind=pet|wild-bond --value=<0..1> --output=<file>');
const report=runScenario(kind,value);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));console.log(kind,value,'complete');
