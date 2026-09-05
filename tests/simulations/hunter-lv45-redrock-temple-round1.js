'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Hunter = require('../../hunter-advancement-policy.js');
const Skills = require('../../class-skill-policy.js');
const Defense = require('../../monster-defense.js');
const Temple = require('./chapter-three-36-rules.js');

const RUNS = 1000, FARM_RUNS = 500, LONG_RUNS = 100, STEP = 100;
const ATTACK = 200, CRIT = .20 + Skills.getEffect('hunter','precision-shot',6).crit;
const CRIT_MULT = 1.5 + Skills.getEffect('hunter','precision-shot',6).criticalDamage;
const SPEED = 1 * (1 + Skills.getEffect('hunter','quick-reload',6).attackSpeed);
const MAX_HP = 1800, DEFENSE = 95, DR = .08, ARROWS = 10;
const BASE_ACTIVE = Skills.getSkills('hunter').filter(x=>x.type==='active');
const SOURCES=['mainBasic','power-shot','multi-shot','piercing-shot','sniper-shot','windArrow','huntingInstinct','petA-basic','petB-basic','petC-basic','petA-slam','petB-slam','petC-slam','petA-bite','petB-bite','petC-bite','petA-bleed','petB-bleed','petC-bleed','other'];
const sum=a=>a.reduce((s,v)=>s+v,0), mean=a=>sum(a)/a.length, round=(n,d=4)=>Number(n.toFixed(d));
function rng(seed){let x=seed>>>0;return()=>{x+=0x6D2B79F5;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
function effect(member,id){return Hunter.getEffect(id,6)||Skills.getEffect('hunter',id,6);}
function skillsFor(spec){return [...BASE_ACTIVE,...Hunter.getSkills(spec).filter(x=>x.type==='active')];}
function fresh(template,now){return{...template,maxHp:template.hp,currentHp:template.hp,born:now,stunnedUntil:0,packStunReadyAt:0,shellHits:0,barrierUntil:0,barrierTriggered:false,dots:[]};}

function simulate(spec,seed,options={}){
  const random=rng(seed), skills=skillsFor(spec), totals=Object.fromEntries(SOURCES.map(x=>[x,0]));
  const member={progress:{advancedClass:spec,skillLevels:{}},skillCooldowns:{},currentHp:MAX_HP,maxHp:MAX_HP,resourceCurrent:ARROWS,resourceMax:ARROWS,nextAttackAt:0,globalSkillReadyAt:0,hunterCount:0,companions:[]};
  [...Skills.getSkills('hunter'),...Hunter.getSkills(spec)].forEach(x=>member.progress.skillLevels[`hunter:${x.id}`]=6);
  const petCount=Hunter.getPetCount(member), survival=Number(options.petHpRatio)>0,petRegen=options.petRegen==null?.01:Number(options.petRegen);
  const petMaxHp=MAX_HP*(options.petHpRatio||.6)*1.3;
  const petStats=Array.from({length:petCount},()=>({deaths:0,revives:0,firstDeath:null,aliveMs:0,deadMs:0,hpIntegral:0,minHp:petMaxHp,regen:0,guardDamage:0}));
  for(let i=0;i<petCount;i++)member.companions.push({id:i,nextAttackAt:0,attackCount:0,furyHitCount:0,wildAwakening:0,maxHp:petMaxHp,currentHp:petMaxHp,alive:true,reviveAt:0});
  const counts={crits:0,casts:{},sniperCasts:0,sniperCrits:0,sniperBuffs:0,sniperConsumes:0,galeCasts:0,windArrows:0,weaknessTriggers:0,weaknessConsumes:0,eagleTriggers:0,eagleConsumes:0,precisePursuit:0,petBasics:[0,0,0],petSlams:[0,0,0],petBites:[0,0,0],bleedApplies:0,bleedRefreshes:0,enemyDirectAttacks:0,protectRolls:0,protectSuccess:0,prevented:0,stunRollSuccess:0,stunIcdBlocks:0,stuns:0,enemyAttacksPreventedByStun:0};
  let target=fresh(options.template||Temple.normals[0],0), kills=0, done=false, lastDeath=0, damageTaken=0, potentialDamage=0, playerDeaths=0;
  const aliveGroupMs=[0,0,0,0];
  let enemyNextAttackAt=1000/(target.speed||1), galeMs=0, furyMs=0, bloodyMs=0, stunMs=0, bleedOne=0,bleedTwo=0,bleedThree=0;
  function hit(source,raw,{crit=false,armorIgnore=0,canEvade=true,damageType='physical'}={}){
    const result=Defense.resolveDamage({baseDamage:raw,monster:{defense:target.defense*(1-Math.min(.8,armorIgnore)),evasion:target.evasion,parry:0,damageReduction:(target.dr||0)+(target.barrierUntil>clock?8:0)},damageType,attackRange:damageType==='periodic'?'none':'ranged',canEvade,canParry:false,random});
    let dealt=result.finalDamage;if(target.shell36&&dealt>0&&++target.shellHits===5){target.shellHits=0;dealt=Math.max(1,Math.ceil(dealt*.7));}
    totals[source]=(totals[source]||0)+dealt;target.currentHp-=dealt;if(crit&&dealt>0)counts.crits++;
    if(target.currentHp<=0)kill();else if(target.barrier36&&!target.barrierTriggered&&target.currentHp/target.maxHp<=.5){target.barrierTriggered=true;target.barrierUntil=clock+6000;}
    return{hit:!result.evaded&&dealt>0,critical:crit&&dealt>0,dealt};
  }
  function kill(){lastDeath=clock;kills++;if(kills>=(options.killTarget||1)){done=true;return;}const pool=options.pool||Temple.normals;target=fresh(pool[Math.floor(random()*pool.length)],clock);enemyNextAttackAt=clock+1000/(target.speed||1);}
  function cast(skill){
    const e=effect(member,skill.id);counts.casts[skill.id]=(counts.casts[skill.id]||0)+1;
    if(skill.id==='gale-rapid-fire'||skill.id==='beast-fury'||skill.id==='bloody-hunt'){
      if(skill.id==='gale-rapid-fire')Hunter.applyGale(member,e,clock);else Hunter.applyPetBuff(member,skill.id,e,clock);
      if(skill.id==='gale-rapid-fire')counts.galeCasts++;member.skillCooldowns[skill.id]=clock+skill.cooldown*1000;member.globalSkillReadyAt=clock+1000;return;
    }
    const shooting=Hunter.getShootingBonuses(member,skill.id,clock), critical=random()<Math.min(.95,CRIT+(e.skillCrit||0));
    let power=e.power||1;if(skill.id==='piercing-shot')power*=1+(e.singleTargetBonus||0);
    const r=hit(skill.id,ATTACK*power*(critical?(CRIT_MULT+shooting.criticalDamage):1),{crit:critical,armorIgnore:(e.armorIgnore||0)+shooting.armorIgnore});
    const hadWeakness=clock<(member.weaknessShotUntil||0), hadEagle=clock<(member.eagleEyeUntil||0);
    Hunter.completeShootingSkill(member,skill.id,r.hit,r.critical,clock);
    if(spec==='marksman'&&hadWeakness&&r.hit)counts.weaknessConsumes++;if(spec==='marksman'&&r.critical&&effect(member,'lethal-aim').weaknessShot)counts.weaknessTriggers++;
    if(spec==='marksman'&&r.hit)counts.eagleTriggers++;
    if(skill.id==='sniper-shot'){counts.sniperCasts++;if(r.critical){counts.sniperCrits++;counts.sniperBuffs++;}Hunter.applySniperCritical(member,e,r.critical,clock);}
    member.resourceCurrent=Math.max(0,member.resourceCurrent+({'power-shot':-1,'multi-shot':-3,'piercing-shot':-2,'sniper-shot':-2}[skill.id]||0));
    member.skillCooldowns[skill.id]=clock+skill.cooldown*1000;member.globalSkillReadyAt=clock+1000;
  }
  function basic(){
    const ex=Hunter.getBasicExecution(member,clock), gale=clock<(member.galeUntil||0)?member.galeBasicDamage||0:0;
    const instinct=++member.hunterCount%6===0, critical=instinct||random()<CRIT;
    let bonus=(ex.sniper||0)+(ex.eagle||0)+gale;if(instinct)bonus+=effect(member,'hunting-instinct').power-1;
    const r=hit('mainBasic',ATTACK*(1+bonus)*(critical?CRIT_MULT:1),{crit:critical});
    if(instinct&&r.dealt){const share=r.dealt*((effect(member,'hunting-instinct').power-1)/(1+bonus));totals.mainBasic-=share;totals.huntingInstinct+=share;}
    const before=Object.values(member.skillCooldowns);const reduced=Hunter.consumeBasic(member,ex,r.hit,r.critical,clock);
    if(ex.sniper&&r.hit)counts.sniperConsumes++;if(ex.eagle&&r.hit)counts.eagleConsumes++;if(reduced)counts.precisePursuit++;
    if(r.hit){const wind=Hunter.resolveGaleBasicHit(member,true,clock);if(wind){counts.windArrows++;hit('windArrow',ATTACK*wind*(random()<CRIT?CRIT_MULT:1));}}
    member.nextAttackAt=clock+1000/(SPEED*(clock<(member.galeUntil||0)?1+(member.galeAttackSpeed||0):1));
  }
  function pets(){
    const bond=Skills.getEffect('hunter','wild-bond',6), b=Hunter.getPetBonuses(member,clock);
    member.companions.forEach((pet,i)=>{if((survival&&!pet.alive)||clock<pet.nextAttackAt||done)return;const label=`pet${'ABC'[i]}`, petAttack=ATTACK*bond.companionAttack*(1+b.damage), critical=random()<CRIT+b.crit;
      const r=hit(`${label}-basic`,petAttack*(critical?CRIT_MULT:1),{crit:critical});counts.petBasics[i]++;
      if(r.hit){if(clock<(member.bloodyHuntUntil||0)){const type=`${label}-bleed`,existing=target.dots.find(d=>d.type===type);if(existing){counts.bleedRefreshes++;existing.next=clock+2000;existing.ticks=2;existing.damage=petAttack*member.bloodyHuntEffect.bleedTick;}else{counts.bleedApplies++;target.dots.push({type,next:clock+2000,ticks:2,damage:petAttack*member.bloodyHuntEffect.bleedTick});}}
        if(spec==='beastmaster'&&effect(member,'pack-summoning').stunChance&&random()<.10){counts.stunRollSuccess++;if(clock<(target.packStunReadyAt||0))counts.stunIcdBlocks++;else{target.packStunReadyAt=clock+5000;target.stunnedUntil=Math.max(target.stunnedUntil,clock+1000);counts.stuns++;}}
        pet.furyHitCount++;if(b.biteEvery&&pet.furyHitCount%b.biteEvery===0){counts.petBites[i]++;hit(`${label}-bite`,petAttack*b.bitePower*(random()<CRIT+b.crit?CRIT_MULT:1));}
        pet.attackCount++;if(pet.attackCount%6===0){counts.petSlams[i]++;const slamCrit=random()<CRIT+b.crit;hit(`${label}-slam`,ATTACK*bond.companionAttack*bond.beastSlam*(1+b.damage)*(slamCrit?CRIT_MULT:1),{crit:slamCrit});}
      }pet.nextAttackAt=clock+1000/((1+(bond.companionSpeed||0))*(1+b.attackSpeed));});
  }
  function dots(){for(const d of [...target.dots])if(clock>=d.next){hit(d.type,d.damage,{canEvade:false,damageType:'periodic'});d.ticks--;d.next+=2000;}target.dots=target.dots.filter(d=>d.ticks>0);}
  function enemy(){if(clock<enemyNextAttackAt)return;if(clock<target.stunnedUntil){counts.enemyAttacksPreventedByStun++;enemyNextAttackAt=clock+1000/(target.speed||1);return;}counts.enemyDirectAttacks++;const raw=(target.attack||0), resolved=Defense.resolvePlayerDamage({baseDamage:raw,defense:DEFENSE,damageReduction:DR}).finalDamage;potentialDamage+=resolved;if(survival){const living=member.companions.filter(p=>p.alive);const hunterDamage=living.length?resolved*.7:resolved,petDamage=living.length?resolved*.3:0;member.currentHp-=hunterDamage;damageTaken+=hunterDamage;if(living.length)living.forEach(p=>{const amount=petDamage/living.length,i=p.id;p.currentHp=Math.max(0,p.currentHp-amount);petStats[i].guardDamage+=amount;if(p.currentHp<=0){p.alive=false;p.reviveAt=clock+30000;petStats[i].deaths++;if(petStats[i].firstDeath==null)petStats[i].firstDeath=clock/1000;}});if(member.currentHp<=0){playerDeaths++;member.currentHp=MAX_HP;}}else{let protectedHit=false;if(spec==='beastmaster'){counts.protectRolls++;protectedHit=random()<.10;}if(protectedHit){counts.protectSuccess++;counts.prevented+=resolved;}else{member.currentHp=Math.max(1,member.currentHp-resolved);damageTaken+=resolved;}}enemyNextAttackAt=clock+1000/(target.speed||1);}
  let clock=0;const max=(options.killTarget||1)*60000;
  for(clock=0;clock<=max&&!done;clock+=STEP){member.resourceCurrent=Math.min(ARROWS,member.resourceCurrent+STEP/1000);if(survival){for(const p of member.companions){const s=petStats[p.id];if(!p.alive&&clock>=p.reviveAt){p.alive=true;p.currentHp=p.maxHp*.5;p.nextAttackAt=clock;p.attackCount=0;p.furyHitCount=0;s.revives++;}if(p.alive){const healed=Math.min(p.maxHp-p.currentHp,p.maxHp*petRegen*STEP/1000);p.currentHp+=healed;s.regen+=healed;s.aliveMs+=STEP;s.hpIntegral+=p.currentHp/p.maxHp*STEP;s.minHp=Math.min(s.minHp,p.currentHp);}else{s.deadMs+=STEP;}}aliveGroupMs[member.companions.filter(p=>p.alive).length]+=STEP;}dots();if(done)break;
    if(clock>=member.globalSkillReadyAt){for(const s of skills){if((member.skillCooldowns[s.id]||0)>clock)continue;const cost={'power-shot':1,'multi-shot':3,'piercing-shot':2,'sniper-shot':2}[s.id]||0;if(member.resourceCurrent<cost)continue;cast(s);break;}}
    if(done)break;if(clock>=member.nextAttackAt)basic();if(done)break;pets();if(done)break;enemy();
    if(clock<(member.galeUntil||0))galeMs+=STEP;if(clock<(member.beastFuryUntil||0))furyMs+=STEP;if(clock<(member.bloodyHuntUntil||0))bloodyMs+=STEP;if(clock<target.stunnedUntil)stunMs+=STEP;
    const n=target.dots.filter(d=>d.type.endsWith('-bleed')).length;if(n===1)bleedOne+=STEP;if(n===2)bleedTwo+=STEP;if(n===3)bleedThree+=STEP;
  }
  const duration=lastDeath/1000,total=sum(Object.values(totals));return{duration,total,totals,counts,damageTaken,potentialDamage,playerDeaths,petMaxHp,petStats,aliveGroupMs,petShare:sum(Object.entries(totals).filter(([k])=>k.startsWith('pet')).map(([,v])=>v))/total,coverage:{gale:galeMs/lastDeath,fury:furyMs/lastDeath,bloody:bloodyMs/lastDeath,stun:stunMs/lastDeath,bleedOne:bleedOne/lastDeath,bleedTwo:bleedTwo/lastDeath,bleedThree:bleedThree/lastDeath}};
}
function aggregate(rows,count){const total=sum(rows.map(x=>x.total)), merged={};for(const key of SOURCES)merged[key]=sum(rows.map(x=>x.totals[key]))/rows.length;const counter={};for(const key of Object.keys(rows[0].counts)){if(Array.isArray(rows[0].counts[key]))counter[key]=rows[0].counts[key].map((_,i)=>round(mean(rows.map(x=>x.counts[key][i]))));else if(typeof rows[0].counts[key]==='object'){counter[key]={};for(const id of new Set(rows.flatMap(x=>Object.keys(x.counts[key]))))counter[key][id]=round(mean(rows.map(x=>x.counts[key][id]||0)));}else counter[key]=round(mean(rows.map(x=>x.counts[key])));}
  const duration=mean(rows.map(x=>x.duration));return{runs:rows.length,enemyCount:count,durationSeconds:round(duration),averageKillSeconds:round(duration/count),killsPerHour:round(count/duration*3600,2),averageDamageTaken:round(mean(rows.map(x=>x.damageTaken)),2),petDamageSharePercent:round(mean(rows.map(x=>x.petShare))*100,3),sources:Object.fromEntries(Object.entries(merged).map(([k,v])=>[k,round(v,2)])),shares:Object.fromEntries(SOURCES.map(k=>[k,round(sum(rows.map(x=>x.totals[k]))/total*100,3)])),counts:counter,coverage:Object.fromEntries(Object.keys(rows[0].coverage).map(k=>[k,round(mean(rows.map(x=>x.coverage[k]))*100,3)]))};}
function run(spec,count,runs,template){return aggregate(Array.from({length:runs},(_,i)=>simulate(spec,0x450000+(spec==='beastmaster'?0x100000:0)+count*100003+i*7919,{killTarget:count,template,pool:Temple.normals})),count);}
module.exports={simulate,aggregate};
if(require.main===module){const result={metadata:{generatedAt:new Date().toISOString(),commit:'f20179d',map:'3-6 赤岩聖殿',level:45,attack:ATTACK,maxHp:MAX_HP,defense:DEFENSE,damageReductionPercent:DR*100,baseCritPercent:20,precisionCritPercent:10,criticalDamagePercent:CRIT_MULT*100,baseAttackSpeed:SPEED,arrowCapacity:ARROWS,skillLevels:'全部 Lv6',sameEquipment:true,noPetPenalty:true,targetRuns:RUNS,farmRuns:FARM_RUNS,longRuns:LONG_RUNS},targets:{},farm10:{},farm100:{},farm500:{}};
for(const t of [...Temple.normals,Temple.elite])result.targets[t.id]={template:t,marksman:run('marksman',1,RUNS,t),beastmaster:run('beastmaster',1,RUNS,t)};
for(const spec of ['marksman','beastmaster']){result.farm10[spec]=run(spec,10,FARM_RUNS);result.farm100[spec]=run(spec,100,FARM_RUNS);result.farm500[spec]=run(spec,500,LONG_RUNS);}
const output=path.join(__dirname,'results','hunter-lv45-redrock-temple-round1.json');fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({output,targets:Object.fromEntries(Object.entries(result.targets).map(([id,x])=>[id,{name:x.template.name,marksman:x.marksman.durationSeconds,beastmaster:x.beastmaster.durationSeconds}])),farm10:{marksman:result.farm10.marksman.durationSeconds,beastmaster:result.farm10.beastmaster.durationSeconds},farm100:{marksman:result.farm100.marksman.durationSeconds,beastmaster:result.farm100.beastmaster.durationSeconds},farm500:{marksman:result.farm500.marksman.durationSeconds,beastmaster:result.farm500.beastmaster.durationSeconds}},null,2));}
