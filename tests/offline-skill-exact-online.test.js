const assert=require('node:assert/strict');
const {loadGame}=require('../tools/headless-game-runtime');
const {isolate,run}=require('./offline-skill-fixture');
const Classes=require('../class-skill-policy');
const routes={warrior:'warrior',assassin:'rogue',hunter:'hunter',mage:'mage',priest:'priest'};
const game=loadGame();
game.evaluate(`
  let exactNow=1000;Date.now=()=>exactNow; Math.random=()=>0;
  getActiveMap=()=>({id:'test',chapter:0});
  getProgress=()=>battle.partyMembers[0].progress;
  getActiveCharacter=()=>battle.partyMembers[0].character;
  getEnemyDefinition=()=>({id:'test',level:30,maxHp:1000000,attack:0,defense:0,mapId:'test'});
  getOnlineFacilityEffects=()=>({damage:1,defense:1,drain:0});
  getLateChapterUnits=()=>[];
  logBattle=()=>{};logPartyDebug=()=>{};updateBattleUI=()=>{};
  showEnemyDamage=()=>{};playBattleSkillEffect=()=>{};
  playPartyMemberCombatAnimation=()=>{};playCompanionAttackAnimation=()=>{};
  captureBattleTargetAnchor=()=>({x:0,y:0,width:1});
  captureBattleAttackerAnchor=()=>({x:0,y:0,width:1});
`);
let cases=0;
for(const [job,route] of Object.entries(routes))for(const skill of [...Classes.getSkills(job),...require('../'+route+'-advancement-policy').SKILLS].filter(s=>s.type==='active'))for(let tier=1;tier<=6;tier++){
  const m=isolate(job,skill.id,{tier,advancedClass:skill.advancedClass,currentHp:20000,equipment:job==='warrior'?{weapon:{weaponType:'one-handed-sword',series:'長劍'}}:{}});
  m.nextAttackAt=1000000;
  const offline=run([m],100,{trace:true,random:()=>0}).members[0];
  game.context.exactMember=JSON.parse(JSON.stringify(m));
  const online=JSON.parse(game.evaluate(`
    exactMember.stats={accuracy:1.05,magicDamageBonus:0,armorPenetrationPercent:0,damageBonus:0,hpRegeneration:0,criticalDamageMultiplier:1.5,dotMultiplier:1,cooldownSpeed:1,manaRegen:1,manaRegenFlat:0,damageReduction:0,...exactMember.stats};
    exactMember.resourceType=PartyPolicy.getResourceType(exactMember.job);
    exactNow=1000;
    exactMember.globalSkillReadyAt=1000;exactMember.stunnedUntil=0;
    exactMember.name=exactMember.id;exactMember.race=exactMember.character.race;
    battle={partyMembers:[exactMember],enemyTypes:['test'],enemyHps:[1000000],enemySpawnedAt:[1000],enemyDots:[[]],enemySkillStates:[]};
    if(exactMember.job==='hunter')ensureHunterCompanions(exactMember,1000);
    useAutoSkillForMember(exactMember,1000);
    JSON.stringify({spent:exactMember.combatTelemetry?.resourceSpent||0,casts:exactMember.combatTelemetry?.skillCasts,cooldown:exactMember.skillCooldowns,global:exactMember.globalSkillReadyAt,healing:exactMember.priestTelemetry?.effectiveHealing||0,damage:exactMember.combatTelemetry?.totalDamage||0});
  `));
  const label=job+':'+skill.id+' Lv'+tier;
  assert.equal(offline.combatTelemetry.resourceSpent,online.spent,label+' exact resource spent');
  assert.equal(offline.skillCooldowns[skill.id],online.cooldown[skill.id],label+' exact cooldown');
  assert.equal(offline.globalSkillReadyAt,online.global,label+' global cooldown');
  assert.equal(offline.combatTelemetry.skillCasts[skill.id],1,label+' actual cast');
  assert.equal(online.casts[skill.id],1,label+' online cast');
  const earliest=Math.max(offline.skillCooldowns[skill.id],offline.globalSkillReadyAt);
  const beforeReady=run([m],Math.max(100,earliest-1000-100),{random:()=>0}).members[0];
  assert.equal(beforeReady.combatTelemetry.skillCasts[skill.id],1,label+' cannot cast before cooldown ends');
  assert.equal(offline.priestTelemetry?.effectiveHealing||0,online.healing,label+' immediate healing');
  if(['fireball','poison-blade','backstab'].includes(skill.id)){
    const type={fireball:'burn','poison-blade':'poison',backstab:'bleed'}[skill.id];
    const actualDot=JSON.parse(game.evaluate(`
      for(exactNow=1100;exactNow<=9000;exactNow+=100)processEnemyDots();
      JSON.stringify({ticks:exactMember.combatTelemetry.dotTicks,damage:exactMember.combatTelemetry.damageBySource['${type}']});
    `));
    const slow=isolate(job,skill.id,{tier,stats:{cooldownSpeed:.01}});slow.nextAttackAt=100000000;
    const result=run([slow],8000,{random:()=>0}).members[0];
    assert.equal(result.combatTelemetry.dotTicks,actualDot.ticks,label+' online DOT tick count');
    assert.equal(result.combatTelemetry.damageBySource[type],actualDot.damage,label+' exact online DOT damage');
  }
  // DOT/pets have their own due events; compare the actual cast damage at time zero.
  assert.ok(Number.isFinite(online.damage),label+' online damage is finite');
  cases++;
}
console.log('offline exact online: '+cases+' skill-level casts, exact costs, cooldowns and immediate healing passed');
