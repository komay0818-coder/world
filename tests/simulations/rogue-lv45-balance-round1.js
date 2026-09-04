'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Rogue = require('../../rogue-advancement-policy.js');
const ClassSkills = require('../../class-skill-policy.js');
const Offhand = require('../../assassin-offhand-policy.js');

const RUNS = 1000;
const FARM_RUNS = 500;
const STEP = 100;
const ATTACK = 200;
const BASE_CRIT = .20;
const CRIT_DAMAGE = 1.50;
const BASE_SPEED = 1.0;
const FARM_HP = 2400;
const SOURCES = ['mainBasic','offhand','backstabDirect','backstabBleed','shadowDance','poisonBladeDirect','shadowAssassination','corrosiveStrike','bloodVenomRendDirect','poison','rupture','other'];
const LABELS = { assassination: '刺殺系', venom: '劇毒系' };
const SKILL_NAMES = { backstab:'背刺', 'shadow-dance':'影刃旋舞', 'poison-blade':'毒刃', 'shadow-assassination':'暗影刺殺', 'death-mark':'死亡標記', 'corrosive-strike':'腐蝕刺擊', 'blood-venom-rend':'血毒割裂' };

function rng(seed) {
  let x = seed >>> 0;
  return () => { x += 0x6D2B79F5; let t=x; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
}
const mean = a => a.reduce((s,v)=>s+v,0)/a.length;
const sum = a => a.reduce((s,v)=>s+v,0);
const pct = (a,b) => b ? a/b : 0;
const round = (n,d=2) => Number(n.toFixed(d));

function makeSkills(spec) {
  const base = ClassSkills.getSkills('assassin').filter(s=>s.type==='active');
  return [...base, ...Rogue.getSkills(spec).filter(s=>s.type==='active')];
}

function simulate(spec, durationSeconds, seed, options={}) {
  const random = rng(seed);
  const skills = makeSkills(spec);
  const member = {
    id:'rogue', progress:{advancedClass:spec,skillLevels:{}}, skillCooldowns:{}, energy:100,
    globalReady:0, nextAttackAt:0, plagueSpreadPending:false, lethalTechniqueUntil:0
  };
  [...ClassSkills.getSkills('assassin'), ...Rogue.getSkills(spec)].forEach(s=>member.progress.skillLevels[`assassin:${s.id}`]=6);
  const stats = { attack:ATTACK, crit:BASE_CRIT + .10, criticalDamageMultiplier:CRIT_DAMAGE, attackSpeed:BASE_SPEED*(1+.08) };
  const mastery = ClassSkills.getEffect('assassin','dagger-mastery',6);
  const totals = Object.fromEntries(SOURCES.map(k=>[k,0]));
  const counts = { crits:0, skillCasts:0, deathMarkCasts:0, markedDeaths:0, markCdReductions:0, markSecondsAdvanced:0, shadowAssassinations:0, shadowAssassinationCrits:0, shadowOffhands:0, lethalTechniqueTriggers:0, lethalComboOffhands:0, plagueTriggers:0, plagueTransfers:0 };
  const casts=[]; const checkpoints={}; const timeline=[]; const enemyStarts=[]; const threeStackTimes=[];
  let target = freshTarget(options.farm ? FARM_HP : 1e12, 0);
  let elapsed=0, kills=0, done=false, lastDeath=0;
  let threeStackCoverage=0, coexistCoverage=0, symbiosisCoverage=0, corrosionCoverage=0;

  function freshTarget(hp, now) {
    return { hp, maxHp:hp, dots:[], state:{}, born:now, threeAt:null };
  }
  function addDamage(source, amount, now, critical=false) {
    const mark = Rogue.getDeathMarkDamageMultiplier(member,target.state,now);
    const dealt = Math.max(1, Math.ceil(amount * mark));
    totals[source]=(totals[source]||0)+dealt;
    target.hp-=dealt;
    if (critical) counts.crits++;
    if (target.hp<=0 && options.farm) kill(now);
    return dealt;
  }
  function poisonStacks(){ return Rogue.poisonStacks(target.dots); }
  function bleeding(){ return Rogue.hasBleedingStatus(target.dots); }
  function addDot(type,damage,duration,maxStacks,now,refreshOnly=false,refreshAll=false) {
    const same=target.dots.filter(d=>d.type===type);
    if(refreshAll) same.forEach(d=>{d.remaining=duration;d.extendedSeconds=0;d.nextTickAt=now+2000;});
    const existing=same.length>=maxStacks?same.sort((a,b)=>a.remaining-b.remaining)[0]:null;
    if(existing){ if(!refreshOnly)existing.damage=Math.max(existing.damage,damage); existing.remaining=duration; existing.extendedSeconds=0; existing.nextTickAt=now+2000; }
    else target.dots.push({type,damage,remaining:duration,nextTickAt:now+2000,extendedSeconds:0,source:member});
    if(poisonStacks()>=3 && target.threeAt===null){target.threeAt=now;threeStackTimes.push((now-target.born)/1000);}
  }
  function kill(now){
    if(done)return;
    if(target.state.deathMarkOwner===member.id && now<target.state.deathMarkUntil){
      counts.markedDeaths++; const before=member.skillCooldowns['death-mark']||now;
      if(Rogue.resolveMarkedKill(member,target.state,now)){counts.markCdReductions++;counts.markSecondsAdvanced+=(before-Math.max(now,before-2000))/1000;}
    }
    if(target.dots.some(d=>d.type==='poison')) if(Rogue.resolvePlagueDeath(member,target.dots)) counts.plagueTriggers++;
    kills++; lastDeath=now;
    if(kills>=10){done=true;return;}
    target=freshTarget(FARM_HP,now); enemyStarts.push(poisonStacks());
    if(Rogue.consumePlague(member)){
      addDot('poison',Math.ceil(ATTACK*.12),3,3,now,false,true);counts.plagueTransfers++;
      enemyStarts[enemyStarts.length-1]=poisonStacks();
    }
  }
  function critChance(skillEffect={},now=0){
    const b=Rogue.getTargetBonuses(member,target.dots,target.state,target.hp/target.maxHp,'skill',now);
    return Math.min(.95,stats.crit+b.crit+(skillEffect.skillCrit||0));
  }
  function directSkill(skill,now){
    const e = skill.levels[5];
    if(skill.id==='death-mark'){
      Rogue.markTarget(member,target.state,6,now); counts.deathMarkCasts++; casts.push([now/1000,SKILL_NAMES[skill.id]]);
      member.skillCooldowns[skill.id]=now+skill.cooldown*1000;member.globalReady=now+1000;return;
    }
    const critical=random()<critChance(e,now); const bonus=Rogue.getTargetBonuses(member,target.dots,target.state,target.hp/target.maxHp,'skill',now);
    let power=e.power||1; if(skill.id==='shadow-assassination'&&bleeding())power*=1+e.bleedingDamage;
    const source={backstab:'backstabDirect','shadow-dance':'shadowDance','poison-blade':'poisonBladeDirect','shadow-assassination':'shadowAssassination','corrosive-strike':'corrosiveStrike','blood-venom-rend':'bloodVenomRendDirect'}[skill.id]||'other';
    addDamage(source,ATTACK*power*(critical?(CRIT_DAMAGE+bonus.criticalDamage):1),now,critical);
    counts.skillCasts++; casts.push([now/1000,SKILL_NAMES[skill.id]]);
    if(skill.id==='backstab'){
      if(critical&&Rogue.resolveBackstabCrit(member,true,6,now))counts.lethalTechniqueTriggers++;
      const existingBleed=target.dots.find(d=>d.type==='bleed');
      if(existingBleed&&e.bleedTrigger)addDamage('backstabBleed',existingBleed.damage*e.bleedTrigger,now);
      addDot('bleed',Math.ceil(ATTACK*.18),3,1,now,true);
    }
    if(skill.id==='poison-blade') addDot('poison',Math.ceil(ATTACK*.12),3,e.poisonStacks,now,false,true);
    if(skill.id==='shadow-assassination'){
      counts.shadowAssassinations++;if(critical)counts.shadowAssassinationCrits++;
      if(critical&&e.offhandOnCrit&&target.hp>0){const strike=Offhand.calculateOffhandStrike(stats,mastery,random());addDamage('offhand',strike.damage,now,strike.critical);counts.shadowOffhands++;}
    }
    if(skill.id==='corrosive-strike'){
      const stacks=poisonStacks(); if(!stacks)addDot('poison',Math.ceil(ATTACK*.12),3,1,now);
      else target.dots.filter(d=>d.type==='poison').forEach(d=>{d.remaining=3;d.nextTickAt=now+2000;d.extendedSeconds=0;});
      if(stacks>=3){target.state.dotVulnerability=.08;target.state.dotVulnerabilityUntil=now+5000;}
    }
    if(skill.id==='blood-venom-rend') addDot('rupture',Math.ceil(ATTACK*.21*(poisonStacks()?1.2:1)),3,1,now,true);
    if(skill.id==='shadow-dance'){member.shadowDanceUntil=now+4000;member.shadowDanceOffhandChance=.20+.05;}
    if(critical)Rogue.extendDotsOnCrit(member,target.dots,true);
    member.energy=Math.max(0,member.energy-({backstab:35,'shadow-dance':60,'poison-blade':25}[skill.id]||0));
    member.skillCooldowns[skill.id]=now+(e.cooldown||skill.cooldown)*1000;member.globalReady=now+1000;
  }
  function basic(now){
    const b=Rogue.getTargetBonuses(member,target.dots,target.state,target.hp/target.maxHp,'basic',now);
    const execution=Rogue.getBasicExecution(member,now); const critical=random()<Math.min(.95,stats.crit+b.crit);
    addDamage('mainBasic',ATTACK*(1+(execution?.damage||0))*(critical?(CRIT_DAMAGE+b.criticalDamage):1),now,critical);
    Rogue.consumeBasic(member,execution,true); Rogue.extendDotsOnCrit(member,target.dots,critical);
    if(target.hp<=0)return;
    const masteryChance=(mastery.offhandChance||0)+(execution?.extraOffhandChance||0);
    const masteryProc=random()<masteryChance; const danceProc=now<(member.shadowDanceUntil||0)&&random()<(member.shadowDanceOffhandChance||0);
    if(masteryProc||danceProc){const strike=Offhand.calculateOffhandStrike({...stats,criticalDamageMultiplier:CRIT_DAMAGE+b.criticalDamage},mastery,random());addDamage('offhand',strike.damage,now,strike.critical);if(execution?.extraOffhandChance&&masteryProc)counts.lethalComboOffhands++;}
    member.nextAttackAt=now+1000/stats.attackSpeed;
  }
  function tickDots(now){
    const snapshot=[...target.dots];
    for(const d of snapshot){
      if(now+1e-9<d.nextTickAt)continue;
      const ticks=Math.min(d.remaining,Math.floor((now-d.nextTickAt)/2000)+1);d.remaining-=ticks;d.nextTickAt+=2000*ticks;
      let mult=1;if(d.type==='poison'&&spec==='venom')mult+=.18;
      mult+=Rogue.getTargetBonuses(member,target.dots,target.state,target.hp/target.maxHp,'dot',now).dotDamage;
      addDamage(d.type==='bleed'?'backstabBleed':d.type, d.damage*ticks*mult,now);
      if(done)return;
    }
    target.dots=target.dots.filter(d=>d.remaining>0);
  }
  enemyStarts.push(0);
  const maxMs=options.farm?180000:durationSeconds*1000;
  for(let now=0;now<=maxMs&&!done;now+=STEP){
    elapsed=now; member.energy=Math.min(100,member.energy+10*STEP/1000);
    tickDots(now); if(done)break;
    if(now>=member.globalReady){
      for(const skill of skills){if((member.skillCooldowns[skill.id]||0)>now)continue;const cost={backstab:35,'shadow-dance':60,'poison-blade':25}[skill.id]||0;if(member.energy<cost)continue;directSkill(skill,now);break;}
    }
    if(done)break;
    if(now+1e-9>=member.nextAttackAt)basic(now);
    const seconds=now/1000;
    timeline.push(sum(Object.values(totals)));
    if([5,10,12,15,20,25,30].includes(seconds))checkpoints[seconds]=sum(Object.values(totals));
    if(spec==='venom'&&target.hp>0){
      if(poisonStacks()>=3)threeStackCoverage+=STEP; if(poisonStacks()&&bleeding()){coexistCoverage+=STEP;symbiosisCoverage+=STEP;} if(now<(target.state.dotVulnerabilityUntil||0))corrosionCoverage+=STEP;
    }
  }
  const total=sum(Object.values(totals));
  return {spec,total,dps:total/(options.farm?(lastDeath/1000):durationSeconds),sources:totals,counts,casts,checkpoints,timeline,
    duration:options.farm?lastDeath/1000:durationSeconds,kills,enemyStarts,threeStackTimes,
    coverage:{threeStack:threeStackCoverage/(options.farm?lastDeath:durationSeconds*1000),coexist:coexistCoverage/(options.farm?lastDeath:durationSeconds*1000),symbiosis:symbiosisCoverage/(options.farm?lastDeath:durationSeconds*1000),corrosion:corrosionCoverage/(options.farm?lastDeath:durationSeconds*1000)}};
}

function aggregate(rows,duration,farm=false){
  const total=rows.map(r=>r.total), totalSum=sum(total);
  const sources=Object.fromEntries(SOURCES.map(k=>[k,round(sum(rows.map(r=>r.sources[k]))/rows.length)]));
  const counts={};Object.keys(rows[0].counts).forEach(k=>counts[k]=round(sum(rows.map(r=>r.counts[k]))/rows.length,4));
  const checkpoints={};for(const t of [5,10,12,15,20,25,30])if(rows[0].checkpoints[t]!=null)checkpoints[t]=round(mean(rows.map(r=>r.checkpoints[t])));
  const stackTimes=rows.flatMap(r=>r.threeStackTimes);
  return { runs:rows.length, durationSeconds:farm?round(mean(rows.map(r=>r.duration)),4):duration, averageTotalDamage:round(mean(total)), averageDps:round(mean(rows.map(r=>r.dps))), minimumDamage:round(Math.min(...total)), maximumDamage:round(Math.max(...total)),
    averageCriticalCount:round(mean(rows.map(r=>r.counts.crits)),4), totalCriticalCount:sum(rows.map(r=>r.counts.crits)), checkpoints, sources,
    shares:Object.fromEntries(SOURCES.map(k=>[k,round(sum(rows.map(r=>r.sources[k]))/totalSum*100,4)])), counts,
    averageFirstThreeStackSeconds:stackTimes.length?round(mean(stackTimes),4):null,
    coverage:Object.fromEntries(Object.keys(rows[0].coverage).map(k=>[k,round(mean(rows.map(r=>r.coverage[k]))*100,4)])),
    averageEnemyStartStacks:farm?round(mean(rows.flatMap(r=>r.enemyStarts)),4):undefined,
    zeroStackStartPercent:farm?round(rows.flatMap(r=>r.enemyStarts).filter(x=>x===0).length/rows.flatMap(r=>r.enemyStarts).length*100,4):undefined,
    threeStackDeathPercent:farm?round(rows.reduce((s,r)=>s+r.counts.plagueTriggers,0)/(rows.length*10)*100,4):undefined,
    averageKillSeconds:farm?round(mean(rows.map(r=>r.duration/10)),4):undefined,
    averageDamagePerEnemy:farm?round(mean(total)/10):undefined,
    averageTimeline:farm?undefined:Array.from({length:rows[0].timeline.length},(_,i)=>round(mean(rows.map(r=>r.timeline[i])))), sampleAiOrder:rows[0].casts.slice(0,15)
  };
}

function runSet(spec,duration,count,farm=false){return aggregate(Array.from({length:count},(_,i)=>simulate(spec,duration,0x450000+(spec==='venom'?0x100000:0)+i*7919,{farm})),duration,farm);}
const result={metadata:{generatedAt:new Date().toISOString(),attack:ATTACK,baseCritPercent:20,criticalDamagePercent:150,baseAttackSpeed:BASE_SPEED,hitChancePercent:100,weapon:'fixed deterministic daggers; total attack already fixed at 200',skillLevels:'all base rogue and advancement skills Lv6',timing:'production 100ms auto-skill/battle ticks; list-order priority; 1s skill GCD',timedRunsPerSpec:RUNS,farmGroupsPerSpec:FARM_RUNS,farmHp:FARM_HP},tests:{}};
for(const seconds of [5,12,30]){result.tests[`${seconds}s`]={};for(const spec of ['assassination','venom'])result.tests[`${seconds}s`][spec]=runSet(spec,seconds,RUNS);}
result.tests.farm10={};for(const spec of ['assassination','venom'])result.tests.farm10[spec]=runSet(spec,180,FARM_RUNS,true);

const a30=result.tests['30s'].assassination,v30=result.tests['30s'].venom;let catchUp=null;
for(let i=1;i<a30.averageTimeline.length;i++)if(v30.averageTimeline[i]>=a30.averageTimeline[i]){catchUp=i/10;break;}
result.observations={venomCatchUpSeconds:catchUp,venomCaughtWithin30Seconds:catchUp!==null};
const output=path.join(__dirname,'results','rogue-lv45-balance-round1.json');fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({output,headline:{five:result.tests['5s'],twelve:result.tests['12s'],thirty:result.tests['30s'],farm:result.tests.farm10,catchUp}},null,2));
