(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RogueAdvancementPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FIRST_JOB_CHANGE_LEVEL = 45;
  const ADVANCED_CLASSES = Object.freeze({ assassination: Object.freeze({ id: 'assassination', name: '刺殺系' }), venom: Object.freeze({ id: 'venom', name: '劇毒系' }) });
  const SKILL_DETAILS = Object.freeze({
    'shadow-assassination':'單體刺殺；流血目標傷害提高，Lv6 暴擊追加副手攻擊。','death-mark':'標記目標5秒，提高自身對其傷害；擊殺縮短冷卻。','lethal-technique':'提高暴擊傷害；背刺暴擊強化下一次主手普通攻擊。','weakness-insight':'攻擊流血目標時提高暴擊率。','corrosive-strike':'直接傷害並施毒或刷新現有毒層。','blood-venom-rend':'直接傷害並施加割裂流血；中毒目標承受更高割裂傷害。','venom-mastery':'提高中毒傷害。','toxic-blood-symbiosis':'目標同時中毒與流血時提高持續傷害。'
  });
  const active = (id,name,cooldown,levels,advancedClass) => Object.freeze({ level:45,type:'active',id,name,detail:SKILL_DETAILS[id],cooldown,advancedClass,levels:Object.freeze(levels.map(Object.freeze)) });
  const passive = (id,name,levels,advancedClass) => Object.freeze({ level:45,type:'passive',id,name,detail:SKILL_DETAILS[id],cooldown:0,advancedClass,levels:Object.freeze(levels.map(Object.freeze)) });
  const ASSASSINATION_SKILLS = Object.freeze([
    active('shadow-assassination','暗影刺殺',6,[190,205,220,235,250,270].map((power,i)=>({power:power/100,skillCrit:[5,6,7,8,10,12][i]/100,bleedingDamage:.15,offhandOnCrit:i===5})),'assassination'),
    active('death-mark','死亡標記',7,[5,6,7,8,10,12].map((damage,i)=>({duration:5,damage:damage/100,killCooldownReduction:2,executeCritDamage:i===5?.25:0})),'assassination'),
    passive('lethal-technique','致命技巧',[5,7,9,11,13,15].map((criticalDamage,i)=>({criticalDamage:criticalDamage/100,nextBasic:[10,12,14,16,18,20][i]/100,extraOffhandChance:i===5?.20:0})),'assassination'),
    passive('weakness-insight','弱點洞察',[3,4,5,6,7,8].map((crit,i)=>({bleedingCrit:crit/100,bleedingCritDamage:i===5?.15:0})),'assassination')
  ]);
  const VENOM_SKILLS = Object.freeze([
    active('corrosive-strike','腐蝕刺擊',6,[165,175,185,195,210,225].map((power,i)=>({power:power/100,dotVulnerability:i===5?.08:0,dotVulnerabilityDuration:5})),'venom'),
    active('blood-venom-rend','血毒割裂',8,[140,150,160,170,185,200].map((power,i)=>({power:power/100,ruptureTick:[14,15,16,17,19,21][i]/100,poisonedRuptureBonus:.20,toxicBloodDefense:i===5?.06:0})),'venom'),
    passive('venom-mastery','劇毒精通',[6,8,10,12,15,18].map((poisonDamage,i)=>({poisonDamage:poisonDamage/100,plagueSpread:i===5})),'venom'),
    passive('toxic-blood-symbiosis','血毒共生',[5,7,9,11,13,15].map((dotDamage,i)=>({dotDamage:dotDamage/100,extendOnDirectCrit:i===5?1:0,maxExtension:i===5?3:0})),'venom')
  ]);
  const SKILLS=Object.freeze([...ASSASSINATION_SKILLS,...VENOM_SKILLS]); const BY_ID=new Map(SKILLS.map(s=>[s.id,s]));
  const levelOf=(n)=>Math.max(1,Math.min(6,Math.floor(Number(n)||1)));
  function getSkill(id){return BY_ID.get(id)||null;} function getSkills(id){return SKILLS.filter(s=>s.advancedClass===id);} function getEffect(id,level){const s=getSkill(id);return s?.levels[levelOf(level)-1]||null;}
  function isAdvanced(progress,id){return progress?.advancedClass===id;} function canAdvance(character,progress){return character?.job==='assassin'&&Number(progress?.level)>=45&&[1,2,3].every(t=>progress?.preJobTrial?.proofTiers?.includes(t));}
  function advance(character,progress,id){if(!Object.values(ADVANCED_CLASSES).some(x=>x.id===id))return{ok:false,code:'unknown-class'};if(progress?.advancedClass)return{ok:false,code:'already-advanced'};if(!canAdvance(character,progress))return{ok:false,code:'requirements'};progress.advancedClass=id;return{ok:true,advancedClass:id};}
  function hasDot(dots,type){return(dots||[]).some(dot=>dot?.type===type&&dot.remaining>0);} function hasBleedingStatus(dots){return hasDot(dots,'bleed')||hasDot(dots,'rupture');} function poisonStacks(dots){return(dots||[]).filter(d=>d?.type==='poison'&&d.remaining>0).reduce((n,d)=>n+Math.max(1,Number(d.stacks)||1),0);}
  function getDeathMarkDamageMultiplier(member,state={},now=Date.now()){return state.deathMarkOwner===member?.id&&now<state.deathMarkUntil?1+(state.deathMarkDamage||0):1;}
  function getTargetDefenseReduction(dots){if(!poisonStacks(dots)||!hasBleedingStatus(dots))return 0;const venomOwner=(dots||[]).map(dot=>dot?.source).find(source=>isAdvanced(source?.progress,'venom')&&getEffect('blood-venom-rend',source.progress.skillLevels?.['assassin:blood-venom-rend'])?.toxicBloodDefense);return venomOwner?getEffect('blood-venom-rend',venomOwner.progress.skillLevels?.['assassin:blood-venom-rend']).toxicBloodDefense:0;}
  function getTargetBonuses(member,dots,state={},hpRatio=1,attackKind='skill',now=Date.now()){const out={damage:0,crit:0,criticalDamage:0,dotDamage:0,defenseReduction:0};const bleeding=hasBleedingStatus(dots);const poisoned=hasDot(dots,'poison');if(isAdvanced(member?.progress,'assassination')&&bleeding){const e=getEffect('weakness-insight',member.progress.skillLevels?.['assassin:weakness-insight']);out.crit+=e?.bleedingCrit||0;out.criticalDamage+=e?.bleedingCritDamage||0;}if(state.deathMarkOwner===member?.id&&now<state.deathMarkUntil&&hpRatio<.30)out.criticalDamage+=state.deathMarkExecuteCritDamage||0;if(isAdvanced(member?.progress,'venom')&&poisoned&&bleeding){const e=getEffect('toxic-blood-symbiosis',member.progress.skillLevels?.['assassin:toxic-blood-symbiosis']);out.dotDamage+=e?.dotDamage||0;}out.defenseReduction=getTargetDefenseReduction(dots);if(now<(state.dotVulnerabilityUntil||0))out.dotDamage+=state.dotVulnerability||0;return out;}
  function markTarget(member,state,level,now=Date.now()){const e=getEffect('death-mark',level);state.deathMarkOwner=member.id;state.deathMarkUntil=now+e.duration*1000;state.deathMarkDamage=e.damage;state.deathMarkExecuteCritDamage=e.executeCritDamage;return e;}
  function resolveMarkedKill(member,state,now=Date.now()){if(state?.deathMarkOwner!==member?.id||now>=state.deathMarkUntil)return false;member.skillCooldowns['death-mark']=Math.max(now,(member.skillCooldowns['death-mark']||now)-2000);state.deathMarkUntil=0;return true;}
  function resolveBackstabCrit(member,critical,level,now=Date.now()){if(!critical||!isAdvanced(member?.progress,'assassination'))return false;const e=getEffect('lethal-technique',level);member.lethalTechniqueUntil=now+5000;member.lethalTechniqueDamage=e.nextBasic;member.lethalTechniqueOffhand=e.extraOffhandChance;return true;}
  function getBasicExecution(member,now=Date.now()){return now<(member?.lethalTechniqueUntil||0)?{damage:member.lethalTechniqueDamage||0,extraOffhandChance:member.lethalTechniqueOffhand||0}:null;} function consumeBasic(member,execution,hit){if(execution&&hit){member.lethalTechniqueUntil=0;member.lethalTechniqueDamage=0;member.lethalTechniqueOffhand=0;}}
  function resolvePlagueDeath(member,dots){const e=getEffect('venom-mastery',member?.progress?.skillLevels?.['assassin:venom-mastery']);if(isAdvanced(member?.progress,'venom')&&e?.plagueSpread&&poisonStacks(dots)>=3){member.plagueSpreadPending=true;return true;}return false;}
  function consumePlague(member){if(!member?.plagueSpreadPending)return false;member.plagueSpreadPending=false;return true;}
  function extendDotsOnCrit(member,dots,critical){const e=getEffect('toxic-blood-symbiosis',member?.progress?.skillLevels?.['assassin:toxic-blood-symbiosis']);if(!critical||!e?.extendOnDirectCrit||!hasDot(dots,'poison')||!hasBleedingStatus(dots))return false;let changed=false;(dots||[]).filter(d=>['poison','bleed','rupture'].includes(d.type)).forEach(d=>{const added=Math.min(1,Math.max(0,e.maxExtension-(d.extendedSeconds||0)));if(!added)return;d.extendedSeconds=(d.extendedSeconds||0)+added;if(d.nextTickAt)d.nextTickAt+=added*1000;changed=true;});return changed;}
  function clear(member,leaveBattle=false){if(!member)return;['lethalTechniqueUntil','lethalTechniqueDamage','lethalTechniqueOffhand'].forEach(k=>member[k]=0);if(leaveBattle)member.plagueSpreadPending=false;}
  return Object.freeze({FIRST_JOB_CHANGE_LEVEL,ADVANCED_CLASSES,ASSASSINATION_SKILLS,VENOM_SKILLS,SKILLS,getSkill,getSkills,getEffect,isAdvanced,canAdvance,advance,hasDot,hasBleedingStatus,poisonStacks,getDeathMarkDamageMultiplier,getTargetDefenseReduction,getTargetBonuses,markTarget,resolveMarkedKill,resolveBackstabCrit,getBasicExecution,consumeBasic,resolvePlagueDeath,consumePlague,extendDotsOnCrit,clear});
}));
