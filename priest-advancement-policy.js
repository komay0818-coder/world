(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PriestAdvancementPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FIRST_JOB_CHANGE_LEVEL = 45;
  const FAITH_MAX_STACKS = 3;
  const FAITH_DURATION_MS = 6000;
  const SACRED_GUARDIAN_ICD_MS = 120000;
  const ADVANCED_CLASSES = Object.freeze({
    holyPriest: Object.freeze({ id: 'holy-priest', name: '神聖祭司' }),
    battlePriest: Object.freeze({ id: 'battle-priest', name: '戰鬥牧師' })
  });
  const active = (id, name, manaCost, cooldown, levels, advancedClass, detail) => Object.freeze({ level: 45, type: 'active', id, name, manaCost, cooldown, advancedClass, detail, levels: Object.freeze(levels.map(Object.freeze)) });
  const passive = (id, name, levels, advancedClass, detail) => Object.freeze({ level: 45, type: 'passive', id, name, cooldown: 0, advancedClass, detail, levels: Object.freeze(levels.map(Object.freeze)) });
  const HOLY_PRIEST_SKILLS = Object.freeze([
    active('light-fountain', '聖光湧泉', 34, 12, [80,85,90,95,100,110].map((power,i)=>({ healPower:power/100,midHpBonus:[10,10,12,12,15,15][i]/100,lowHpBonus:[20,20,25,25,30,35][i]/100,cooldown:[12,12,12,11,11,10][i],lowHpShield:i===5?.08:0,shieldDuration:i===5?6:0,breakthrough:i===5?'聖光眷顧：治療 HP 低於 40% 的隊員時，獲得最大 HP 8% 護盾 6 秒':''})), 'holy-priest', '治療全體存活隊員，低生命目標獲得額外治療。'),
    active('guardian-sanctuary', '守護聖域', 40, 20, [8,9,10,11,12,15].map((reduction,i)=>({ damageReduction:reduction/100,tickHealPower:[15,17,19,21,23,25][i]/100,duration:6,tickInterval:2,cooldown:[20,20,19,19,18,18][i],cleanseOnCast:i===5,breakthrough:i===5?'神聖領域：施放瞬間淨化所有存活隊員各 1 個可淨化負面狀態':''})), 'holy-priest', '為全隊提供短時減傷，並每 2 秒治療一次。'),
    passive('prayer-of-life', '生命禱言', [10,12,14,17,20,25].map((bonus,i)=>({ lowHpThreshold:.30,healingBonus:bonus/100,sacredGuardian:i===5,guardianHeal:.15,guardianIcd:SACRED_GUARDIAN_ICD_MS/1000,breakthrough:i===5?'神聖守護：全隊共用 120 秒內置冷卻，阻止致命傷害並恢復最大 HP 15%':''})), 'holy-priest', '治療 HP 低於 30% 的隊員時，提高該次治療效果。'),
    passive('light-echo', '聖光回響', [6,7,8,9,10,12].map((ratio,i)=>({ effectiveHealingRatio:ratio/100,thresholdPower:1,extraTargets:i===5?2:0,extraRatio:i===5?.30:0,breakthrough:i===5?'聖光共鳴：觸發時額外治療最多 2 名隊員，各為主治療量 30%':''})), 'holy-priest', '有效治療累積聖光值，達到門檻後自動治療最低 HP 隊員。')
  ]);
  const BATTLE_PRIEST_SKILLS = Object.freeze([
    active('holy-smite', '神聖懲擊', 24, 6, [190,200,210,220,230,245].map((power,i)=>({ power:power/100,damageHealing:[8,8,10,10,12,15][i]/100,cooldown:[6,6,6,6,5,5][i],executeThreshold:i===5?.30:0,executeBonus:i===5?.20:0,breakthrough:i===5?'神聖裁決：命中 HP 低於 30% 的敵人時，本次傷害 +20%':''})), 'battle-priest', '單體神聖魔法攻擊，依實際傷害治療最低 HP 隊員。'),
    active('holy-storm', '神聖風暴', 32, 9, [75,80,85,90,95,105].map((power,i)=>({ power:power/100,targets:5,partyHealPerHit:[2,2,3,3,4,5][i]/100,cooldown:[9,9,9,8,8,8][i],hasteMinTargets:i===5?3:0,attackSpeed:i===5?.08:0,hasteDuration:i===5?5:0,breakthrough:i===5?'聖光風暴：命中至少 3 名敵人時，全體攻速 +8%，持續 5 秒':''})), 'battle-priest', '最多攻擊 5 名敵人，每命中 1 名就治療全隊。'),
    passive('fanatical-faith', '狂熱信仰', [2,3,4,5,6,7].map((damage,i)=>({ magicDamagePerStack:damage/100,maxStacks:3,fullStackCooldownSpeed:i===5?.10:0,breakthrough:i===5?'狂熱：信仰 3 層時技能冷卻速度 +10%':''})), 'battle-priest', '每層信仰額外提高魔法傷害。'),
    passive('light-devotion', '光明奉獻', [3,4,5,6,7,8].map((ratio,i)=>({ directDamageHealing:ratio/100,secondaryRatio:i===5?.25:0,breakthrough:i===5?'奉獻之光：有效治療時，另一名最低 HP 隊員恢復主治療量 25%':''})), 'battle-priest', '主動技能造成的直接魔法傷害會轉化為治療。')
  ]);
  const SKILLS=Object.freeze([...HOLY_PRIEST_SKILLS,...BATTLE_PRIEST_SKILLS]);
  const BY_ID=new Map(SKILLS.map(skill=>[skill.id,skill]));
  const clampLevel=value=>Math.max(1,Math.min(6,Math.floor(Number(value)||1)));
  function getSkill(id){return BY_ID.get(id)||null;} function getSkills(id){return SKILLS.filter(skill=>skill.advancedClass===id);} function getEffect(id,level){return getSkill(id)?.levels[clampLevel(level)-1]||null;}
  function isAdvanced(progress,id){return progress?.advancedClass===id;} function canAdvance(character,progress){return character?.job==='priest'&&Number(progress?.level)>=FIRST_JOB_CHANGE_LEVEL&&[1,2,3].every(tier=>progress?.preJobTrial?.proofTiers?.includes(tier));}
  function advance(character,progress,id){if(!Object.values(ADVANCED_CLASSES).some(entry=>entry.id===id))return{ok:false,code:'unknown-class'};if(progress?.advancedClass)return{ok:false,code:'already-advanced'};if(!canAdvance(character,progress))return{ok:false,code:'requirements'};progress.advancedClass=id;return{ok:true,advancedClass:id};}
  function level(member,id){return Number(member?.progress?.skillLevels?.[`priest:${id}`])||1;}
  function telemetry(member){return member.priestTelemetry||(member.priestTelemetry={effectiveHealing:0,overhealing:0,echoHealing:0,echoTriggers:0,guardianTriggers:0,preventedDeaths:0,smiteHealing:0,devotionHealing:0,stormHealing:0,sanctuaryHealing:0,faithSamples:0,faithStackTotal:0,faithFullSamples:0});}
  function addFaith(member,now=Date.now()){member.faithStacks=Math.min(FAITH_MAX_STACKS,(member.faithStacks||0)+1);member.faithUntil=now+FAITH_DURATION_MS;return member.faithStacks;}
  function getFaithStacks(member,now=Date.now()){if(now>=(member?.faithUntil||0)){if(member){member.faithStacks=0;member.faithUntil=0;}return 0;}return Math.min(FAITH_MAX_STACKS,member?.faithStacks||0);}
  function getFaithBonuses(member,now=Date.now()){const stacks=getFaithStacks(member,now),faithLv6=Number(member?.progress?.skillLevels?.['priest:holy-faith'])>=6;const fanatic=isAdvanced(member?.progress,'battle-priest')?getEffect('fanatical-faith',level(member,'fanatical-faith')):null;return{stacks,healing:faithLv6?stacks*.03:0,selfDamageReduction:faithLv6?stacks*.02:0,magicDamage:stacks*(fanatic?.magicDamagePerStack||0),cooldownSpeed:stacks===3?(fanatic?.fullStackCooldownSpeed||0):0};}
  function getLifePrayerBonus(member,target){if(!isAdvanced(member?.progress,'holy-priest')||!target?.maxHp)return 0;const effect=getEffect('prayer-of-life',level(member,'prayer-of-life'));return target.currentHp/target.maxHp<effect.lowHpThreshold?effect.healingBonus:0;}
  function heal(member,target,amount,source='other'){if(!target?.alive||amount<=0)return 0;const actual=Math.min(Math.max(0,target.maxHp-target.currentHp),amount);target.currentHp+=actual;const stats=telemetry(member);stats.effectiveHealing+=actual;stats.overhealing+=Math.max(0,amount-actual);if(stats[source]!==undefined)stats[source]+=actual;if(source!=='echoHealing'&&isAdvanced(member?.progress,'holy-priest')){const effect=getEffect('light-echo',level(member,'light-echo'));member.lightValue=(member.lightValue||0)+actual*effect.effectiveHealingRatio;}return actual;}
  function resolveLightEcho(member,allies){if(!isAdvanced(member?.progress,'holy-priest'))return 0;const effect=getEffect('light-echo',level(member,'light-echo')),threshold=(member.stats?.attack||member.attack||0)*effect.thresholdPower;if(!threshold||member.lightValue<threshold)return 0;let triggers=0;while(member.lightValue>=threshold){member.lightValue-=threshold;const targets=(allies||[]).filter(ally=>ally.alive).sort((a,b)=>a.currentHp/a.maxHp-b.currentHp/b.maxHp),primary=targets[0];if(!primary)break;const main=heal(member,primary,threshold,'echoHealing');targets.slice(1,1+effect.extraTargets).forEach(target=>heal(member,target,main*effect.extraRatio,'echoHealing'));triggers++;telemetry(member).echoTriggers++;}return triggers;}
  function trySacredGuardian(priest,target,partyState,now=Date.now()){if(!isAdvanced(priest?.progress,'holy-priest')||Number(priest?.progress?.skillLevels?.['priest:prayer-of-life'])<6||now<(partyState.sacredGuardianReadyAt||0))return false;target.currentHp=1;target.alive=true;heal(priest,target,target.maxHp*.15);partyState.sacredGuardianReadyAt=now+SACRED_GUARDIAN_ICD_MS;telemetry(priest).guardianTriggers++;telemetry(priest).preventedDeaths++;return true;}
  function getSpecialization(skillLevels,advancedClass,type){return getSkills(advancedClass).find(skill=>skill.type===type&&Number(skillLevels?.[`priest:${skill.id}`])>=6)||null;}
  function canSpecialize(skillLevels,advancedClass,id){const skill=getSkill(id);if(!skill||skill.advancedClass!==advancedClass)return{ok:false,reason:'unknown-skill'};const occupied=getSpecialization(skillLevels,advancedClass,skill.type);return occupied&&occupied.id!==id?{ok:false,reason:'specialization-occupied',occupied}:{ok:true,reason:'',occupied};}
  function normalizeSkillLevels(skillLevels,advancedClass){const normalized={...(skillLevels||{})};for(const type of ['active','passive']){let kept=false;for(const skill of getSkills(advancedClass).filter(entry=>entry.type===type)){const key=`priest:${skill.id}`,value=clampLevel(normalized[key]);normalized[key]=value===6&&kept?5:value;if(value===6&&!kept)kept=true;}}return normalized;}
  function clear(member){if(!member)return;member.faithStacks=0;member.faithUntil=0;member.sanctuaryUntil=0;member.sanctuaryNextTickAt=0;member.lightValue=0;}
  return Object.freeze({FIRST_JOB_CHANGE_LEVEL,FAITH_MAX_STACKS,FAITH_DURATION_MS,SACRED_GUARDIAN_ICD_MS,ADVANCED_CLASSES,HOLY_PRIEST_SKILLS,BATTLE_PRIEST_SKILLS,SKILLS,getSkill,getSkills,getEffect,isAdvanced,canAdvance,advance,getSpecialization,canSpecialize,normalizeSkillLevels,telemetry,addFaith,getFaithStacks,getFaithBonuses,getLifePrayerBonus,heal,resolveLightEcho,trySacredGuardian,clear});
}));
