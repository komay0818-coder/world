(function (root, factory) {
  const dependency = typeof module === 'object' && module.exports ? require('./redrock-wastes-policy.js') : root.RedrockWastesPolicy;
  const api = factory(dependency);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BrokenrockCanyonPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (RedrockWastesPolicy) {
  'use strict';
  const MAP_ID='brokenrock-canyon';
  const SKILLS=Object.freeze({
    'armor-piercing-spear':Object.freeze({id:'armor-piercing-spear',name:'穿甲投矛',cooldownMs:7000,damageMultiplier:1.50,defenseIgnore:.20,target:'random-alive'}),
    'battle-cry':Object.freeze({id:'battle-cry',name:'戰鬥怒吼',cooldownMs:10000,target:'all-alive-skullcrusher',buff:Object.freeze({type:'attack-up',attackBonus:.10,durationMs:5000,stacking:'refresh-by-name',includesCaster:true})}),
    'brute-smash':Object.freeze({id:'brute-smash',name:'蠻力重擊',cooldownMs:7000,damageMultiplier:1.90,target:'primary',debuff:Object.freeze({type:'attack-speed-down',value:.15,durationMs:4000,stacking:'refresh-by-source'})}),
    bloodlust:Object.freeze({id:'bloodlust',name:'嗜戰',passive:true,thresholds:Object.freeze([.80,.60,.40,.20]),attackBonusPerStack:.05,maxStacks:4,permanent:true}),
    'warlord-slash':Object.freeze({id:'warlord-slash',name:'督軍斬擊',cooldownMs:6000,damageMultiplier:1.80,target:'primary',debuff:Object.freeze({type:'defense-down',value:.15,durationMs:5000,stacking:'refresh-by-source'})}),
    'offensive-command':Object.freeze({id:'offensive-command',name:'進攻號令',cooldownMs:12000,target:'all-other-alive',buff:Object.freeze({type:'offensive-command',attackBonus:.15,attackSpeedBonus:.15,durationMs:5000,stacking:'refresh-by-name',excludeCaster:true})}),
    'execution-command':Object.freeze({id:'execution-command',name:'處決號令',threshold:.30,damageMultiplier:2.20,target:'lowest-hp-ratio-alive',once:true})
  });
  const ENEMY_SKILLS=Object.freeze({
    'wasteland-hyena':RedrockWastesPolicy.getEnemySkills('wasteland-hyena'),
    'skullcrusher-scout':RedrockWastesPolicy.getEnemySkills('skullcrusher-scout'),
    'skullcrusher-spearman':Object.freeze(['armor-piercing-spear']),
    'skullcrusher-warrior':Object.freeze(['battle-cry']),
    'brokenrock-brute':Object.freeze(['brute-smash','bloodlust']),
    'canyon-warlord':Object.freeze(['warlord-slash','offensive-command','execution-command'])
  });
  const ACTIVE_SKILLS=Object.freeze({'skullcrusher-spearman':['armor-piercing-spear'],'skullcrusher-warrior':['battle-cry'],'brokenrock-brute':['brute-smash'],'canyon-warlord':['warlord-slash','offensive-command']});
  function freshTelemetry(){return {skillAttempts:{},skillCasts:{},skillDamage:{},buffTargets:{},battleCryActiveMs:0,warlordDefenseDownActiveMs:0,bloodlustThresholds:{80:0,60:0,40:0,20:0},executionTriggers:0,executionKills:0};}
  function createState(now=0){return {startedAt:now,nextSkillAt:{},previousHpRatio:1,bloodlustStacks:0,bloodlustTriggered:{},executionTriggered:false,telemetry:freshTelemetry()};}
  function record(bucket,key,amount=1){bucket[key]=(bucket[key]||0)+amount;}
  function getSkill(id){return SKILLS[id]||RedrockWastesPolicy.getSkill(id)||null;} function getEnemySkills(id){return ENEMY_SKILLS[id]||Object.freeze([]);}
  function initializeSchedule(enemyId,state,now=0){for(const id of ACTIVE_SKILLS[enemyId]||[])if(!Number.isFinite(state.nextSkillAt[id]))state.nextSkillAt[id]=now+SKILLS[id].cooldownMs;return state;}
  function resolveScheduledActions(enemyId,state,now=0,context={}){initializeSchedule(enemyId,state,state.startedAt||0);const actions=[];for(const id of ACTIVE_SKILLS[enemyId]||[]){if(now<state.nextSkillAt[id])continue;state.nextSkillAt[id]=now+SKILLS[id].cooldownMs;record(state.telemetry.skillAttempts,id);if(id==='offensive-command'&&!(Number(context.otherAliveEnemies)>0))continue;record(state.telemetry.skillCasts,id);actions.push(SKILLS[id]);}return actions;}
  function updateThresholds(enemyId,state,currentHp,maxHp){const ratio=Number(maxHp)>0?Math.max(0,Number(currentHp)||0)/Number(maxHp):1,previous=Number.isFinite(state.previousHpRatio)?state.previousHpRatio:1,events=[];
    if(enemyId==='brokenrock-brute')for(const threshold of SKILLS.bloodlust.thresholds)if(!state.bloodlustTriggered[threshold]&&previous>=threshold&&ratio<threshold){state.bloodlustTriggered[threshold]=true;state.bloodlustStacks=Math.min(SKILLS.bloodlust.maxStacks,state.bloodlustStacks+1);state.telemetry.bloodlustThresholds[Math.round(threshold*100)]++;events.push({id:'bloodlust',threshold,stacks:state.bloodlustStacks});}
    if(enemyId==='canyon-warlord'&&!state.executionTriggered&&previous>=SKILLS['execution-command'].threshold&&ratio<SKILLS['execution-command'].threshold){state.executionTriggered=true;state.telemetry.executionTriggers++;events.push(SKILLS['execution-command']);}
    state.previousHpRatio=ratio;return events;}
  function getCombatMultipliers(enemyId,state){return {attack:enemyId==='brokenrock-brute'?1+state.bloodlustStacks*SKILLS.bloodlust.attackBonusPerStack:1,attackSpeed:1,defense:1};}
  function recordSkillDamage(state,id,damage){record(state.telemetry.skillDamage,id,Math.max(0,Number(damage)||0));} function recordBuffTargets(state,id,count){record(state.telemetry.buffTargets,id,Math.max(0,Math.floor(Number(count)||0)));}
  function recordCoverage(state,{battleCry=false,warlordDefenseDown=false}={},elapsedMs=0){if(battleCry)state.telemetry.battleCryActiveMs+=Math.max(0,elapsedMs);if(warlordDefenseDown)state.telemetry.warlordDefenseDownActiveMs+=Math.max(0,elapsedMs);}
  function recordExecutionOutcome(state,killed){if(killed)state.telemetry.executionKills++;}
  return Object.freeze({MAP_ID,SKILLS,ENEMY_SKILLS,getSkill,getEnemySkills,createState,initializeSchedule,resolveScheduledActions,updateThresholds,getCombatMultipliers,recordSkillDamage,recordBuffTargets,recordCoverage,recordExecutionOutcome});
});
