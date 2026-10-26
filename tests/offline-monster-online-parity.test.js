const assert=require('node:assert/strict');
const {loadGame}=require('../tools/headless-game-runtime');
const {member}=require('./offline-skill-fixture');
const P=require('../offline-party-policy');
const game=loadGame();let clock=1000;
class Clock extends Date{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
game.context.Date=Clock;
game.evaluate(`logBattle=()=>{};logPartyDebug=()=>{};updateBattleUI=()=>{};
playMonsterAttackAnimation=()=>{};playPartyMemberHitAnimation=()=>{};
isTimedChapterThreeVisualShowcase=()=>false;isMonsterRotationPreview=()=>false;
getActiveMap=()=>mapProgression.find(m=>m.id===testMap);
getProgress=()=>testMember.progress;getCharacterStats=()=>testMember.stats;
getOnlineFacilityEffects=()=>({damage:1,defense:1,drain:0});
getPlaytestHpFloor=()=>0;syncLegacyBattleStateFromMain=()=>{};syncMainBattleMemberFromLegacy=()=>{};`);
game.context.testMap='plains-entrance';game.context.testMember={progress:{}};
const scenarios=JSON.parse(game.evaluate(`JSON.stringify(mapProgression.filter(m=>m.id&&m.implemented!==false).flatMap(map=>{
  testMap=map.id;const pool=map.id==='goblin-camp'?[...new Set(Object.values(DungeonTicketCycle.GOBLIN_CAMP_WAVES).flat())]:getMonsterPool(30).normal||[];
  return pool.map(id=>[map.id,id]);
}))`));
let count=0;
for(const [mapId,id]of scenarios){
  game.context.testMap=mapId;
  game.context.testId=id;
  const monster=JSON.parse(game.evaluate(`JSON.stringify(getActiveMap().chapter===1
    ? ChapterOneLevelPolicy.scaleMonster(monsterTypes[testId],testMap,30)
    : getMonsterDefinitionForMap(testId,testMap,30))`));
  if(!monster||monster.id!==id||monster.isElite||monster.isBoss)continue;
  for(const roll of [.1,.3,.6]){
    const m=member('warrior',{hp:1000000000,stats:{attack:0,parry:0,dodge:0}});
    m.nextAttackAt=1000000000;m.skillCooldowns=Object.fromEntries(Object.keys(m.progress.skillLevels).map(k=>[k.split(':')[1],1000000000]));
    m.lastManaRegenAt=m.lastResourceUpdatedAt=m.lastHpRegenerationAt=1000;
    m.name='main';m.race='human';m.progress.level=30;m.progress.potions=0;
    game.context.testMember=JSON.parse(JSON.stringify(m));game.context.testMonster=monster;
    game.context.Math.random=()=>roll;clock=1000;
    game.evaluate(`battle={partyMembers:[testMember],enemyTypes:[testId],enemyHps:[testMonster.maxHp],
      enemyLevels:[30],enemySpawnedAt:[1000],enemyNextAttackAt:[Infinity],
      enemySkillStates:[],enemyDots:[[]],enemyDamages:[[]],enemyTrailSummoned:[false],enemySummonProfiles:[null],
      enemyRespawns:[null],enemyBoarEnraged:[false],sessionId:'offline',lastStrongholdRegenAt:1000,sacredGuardianReadyAt:1000,
      dungeonId:testMap==='goblin-camp'?'goblin-camp':null};
      fighting=true; battle.enemyNextAttackAt[0]=1000+getMonsterAttackInterval(getEnemyDefinition(0));`);
    for(clock=1000;clock<=13000;clock+=100)game.evaluate('enemyAttackTick()');
    const online=game.context.testMember;
    const off=P.simulate({snapshot:P.capture({members:[m],monsters:[monster],mapId,map:game.evaluate('getActiveMap()'),chapterOneBase:game.evaluate('getActiveMap().chapter===1'),now:1000,fighting:true}),
      durationMs:12000,skills:true,survival:true,random:()=>roll});
    const actual=off.members[0];
    for(const field of ['currentHp','shield','stunnedUntil','boundUntil','blackstoneMarkedUntil','blackstoneArmorBreakUntil',
      'spiderNestArmorBreakUntil','blackstoneAttackSpeedPenaltyUntil','blackstoneAttackSpeedPenalty','redrockDefenseDownUntil'])
      assert.equal(actual[field]||0,online[field]||0,`${mapId}/${id}/${roll}/${field}`);
    assert.deepEqual(actual.bleed||null,JSON.parse(JSON.stringify(online.bleed||null)),`${mapId}/${id}/${roll}/DOT`);count++;
  }
}
assert.ok(count>=30);console.log('offline monster exact online parity: '+count+' HP/shield/DOT/control comparisons passed');
