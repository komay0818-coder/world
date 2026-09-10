(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RedrockWastesPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAP_ID = 'redrock-wastes-entrance';
  const SKILLS = Object.freeze({
    'rend-bite': Object.freeze({ id:'rend-bite', name:'撕咬', triggerChance:.20, dot:Object.freeze({ type:'bleed', attackRatio:.20, durationMs:4000, tickMs:2000, ticks:2, stacking:'refresh-by-source' }) }),
    'hardened-scales': Object.freeze({ id:'hardened-scales', name:'硬化鱗片', passive:true, defenseBonus:.20 }),
    dive: Object.freeze({ id:'dive', name:'俯衝', cooldownMs:8000, damageMultiplier:1.50, criticalBonus:.15, target:'random-alive' }),
    'armor-breaking-throw': Object.freeze({ id:'armor-breaking-throw', name:'破甲投擲', cooldownMs:7000, damageMultiplier:1.20, target:'random-alive', debuff:Object.freeze({ type:'defense-down', value:.15, durationMs:5000, stacking:'refresh-by-source' }) }),
    'frenzied-charge': Object.freeze({ id:'frenzied-charge', name:'狂暴衝撞', cooldownMs:8000, damageMultiplier:1.80, target:'primary', stunChance:.30, stunMs:1000 }),
    'wounded-frenzy': Object.freeze({ id:'wounded-frenzy', name:'受傷狂暴', passive:true, threshold:.40, attackBonus:.15, attackSpeedBonus:.25, permanent:true }),
    'giant-jaw-rend': Object.freeze({ id:'giant-jaw-rend', name:'巨顎撕咬', cooldownMs:6000, damageMultiplier:1.70, target:'primary', dot:Object.freeze({ type:'rend', attackRatio:.25, durationMs:6000, tickMs:2000, ticks:3, stacking:'refresh-by-source' }) }),
    'rock-armor': Object.freeze({ id:'rock-armor', name:'岩甲', passive:true, threshold:.50, defenseBonus:.25, weakenedDefenseBonus:.10, permanentTransition:true }),
    'wasteland-fury': Object.freeze({ id:'wasteland-fury', name:'荒原狂怒', passive:true, threshold:.30, attackBonus:.25, attackSpeedBonus:.20, permanent:true })
  });
  const ENEMY_SKILLS = Object.freeze({
    'wasteland-hyena': Object.freeze(['rend-bite']), 'redrock-lizard': Object.freeze(['hardened-scales']),
    'wasteland-vulture': Object.freeze(['dive']), 'skullcrusher-scout': Object.freeze(['armor-breaking-throw']),
    'redrock-hornbeast': Object.freeze(['frenzied-charge','wounded-frenzy']),
    'redrock-giant-lizard': Object.freeze(['giant-jaw-rend','rock-armor','wasteland-fury'])
  });
  const ACTIVE_SKILL_BY_ENEMY = Object.freeze({ 'wasteland-vulture':'dive', 'skullcrusher-scout':'armor-breaking-throw', 'redrock-hornbeast':'frenzied-charge', 'redrock-giant-lizard':'giant-jaw-rend' });
  function telemetry(){return {skillCasts:{},dotApplications:{},dotTicks:{},debuffApplications:{},stuns:0,thresholdTriggers:{woundedFrenzy:0,rockArmorWeakened:0,wastelandFury:0},rockArmorTransitions:0};}
  function createState(now=0){return {nextSkillAt:{},woundedFrenzy:false,rockArmorWeakened:false,wastelandFury:false,previousHpRatio:1,telemetry:telemetry(),startedAt:now};}
  function record(bucket,key,amount=1){bucket[key]=(bucket[key]||0)+amount;}
  function getSkill(id){return SKILLS[id]||null;} function getEnemySkills(enemyId){return ENEMY_SKILLS[enemyId]||Object.freeze([]);}
  function initializeSchedule(enemyId,state,now=0){const id=ACTIVE_SKILL_BY_ENEMY[enemyId];if(id&&!Number.isFinite(state.nextSkillAt[id]))state.nextSkillAt[id]=now+SKILLS[id].cooldownMs;return state;}
  function resolveScheduledAction(enemyId,state,now=0){initializeSchedule(enemyId,state,state.startedAt||0);const id=ACTIVE_SKILL_BY_ENEMY[enemyId];if(!id||now<state.nextSkillAt[id])return null;state.nextSkillAt[id]=now+SKILLS[id].cooldownMs;record(state.telemetry.skillCasts,id);return SKILLS[id];}
  function resolveHyenaBasicHit(state,randomValue){if(Number(randomValue)>=SKILLS['rend-bite'].triggerChance)return null;record(state.telemetry.skillCasts,'rend-bite');return SKILLS['rend-bite'];}
  function createDot(skillId,sourceId,attack){const dot=SKILLS[skillId]?.dot;if(!dot)return null;return {type:dot.type,sourceId,skillId,damage:Math.max(0,Number(attack)||0)*dot.attackRatio,durationMs:dot.durationMs,tickMs:dot.tickMs,ticks:dot.ticks,stacking:dot.stacking};}
  function recordDotApplication(state,skillId){record(state.telemetry.dotApplications,skillId);} function recordDotTick(state,skillId){record(state.telemetry.dotTicks,skillId);} function recordDebuff(state,skillId){record(state.telemetry.debuffApplications,skillId);}
  function resolveStun(state,randomValue){if(Number(randomValue)>=SKILLS['frenzied-charge'].stunChance)return null;state.telemetry.stuns++;return {type:'stun',durationMs:SKILLS['frenzied-charge'].stunMs};}
  function updateThresholds(enemyId,state,currentHp,maxHp){const ratio=Number(maxHp)>0?Math.max(0,Number(currentHp)||0)/Number(maxHp):1,previous=Number.isFinite(state.previousHpRatio)?state.previousHpRatio:1,events=[];
    if(enemyId==='redrock-hornbeast'&&!state.woundedFrenzy&&previous>=.40&&ratio<.40){state.woundedFrenzy=true;state.telemetry.thresholdTriggers.woundedFrenzy++;events.push('wounded-frenzy');}
    if(enemyId==='redrock-giant-lizard'&&!state.rockArmorWeakened&&previous>=.50&&ratio<.50){state.rockArmorWeakened=true;state.telemetry.thresholdTriggers.rockArmorWeakened++;state.telemetry.rockArmorTransitions++;events.push('rock-armor-weakened');}
    if(enemyId==='redrock-giant-lizard'&&!state.wastelandFury&&previous>=.30&&ratio<.30){state.wastelandFury=true;state.telemetry.thresholdTriggers.wastelandFury++;events.push('wasteland-fury');}
    state.previousHpRatio=ratio;return events;}
  function getCombatMultipliers(enemyId,state){return {attack:1+(enemyId==='redrock-hornbeast'&&state?.woundedFrenzy?SKILLS['wounded-frenzy'].attackBonus:0)+(enemyId==='redrock-giant-lizard'&&state?.wastelandFury?SKILLS['wasteland-fury'].attackBonus:0),attackSpeed:1+(enemyId==='redrock-hornbeast'&&state?.woundedFrenzy?SKILLS['wounded-frenzy'].attackSpeedBonus:0)+(enemyId==='redrock-giant-lizard'&&state?.wastelandFury?SKILLS['wasteland-fury'].attackSpeedBonus:0),defense:enemyId==='redrock-lizard'?1+SKILLS['hardened-scales'].defenseBonus:enemyId==='redrock-giant-lizard'?1+(state?.rockArmorWeakened?SKILLS['rock-armor'].weakenedDefenseBonus:SKILLS['rock-armor'].defenseBonus):1};}
  return Object.freeze({MAP_ID,SKILLS,ENEMY_SKILLS,getSkill,getEnemySkills,createState,initializeSchedule,resolveScheduledAction,resolveHyenaBasicHit,createDot,recordDotApplication,recordDotTick,recordDebuff,resolveStun,updateThresholds,getCombatMultipliers});
});
