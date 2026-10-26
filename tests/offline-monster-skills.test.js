const assert=require('node:assert/strict');
const {loadGame}=require('../tools/headless-game-runtime');
const {member}=require('./offline-skill-fixture');
const P=require('../offline-party-policy');
const game=loadGame();
const maps=game.evaluate('mapProgression.filter(m=>m.id&&m.implemented!==false).map(m=>m.id)');
let cases=0;
for(const mapId of maps){
  game.context.testMap=mapId;
  const monsters=JSON.parse(game.evaluate(`JSON.stringify((()=>{
    getProgress=()=>({selectedMapId:testMap,level:30});
    getActiveMap=()=>mapProgression.find(m=>m.id===testMap);
    const pool=testMap==='goblin-camp'?[...new Set(Object.values(DungeonTicketCycle.GOBLIN_CAMP_WAVES).flat())]:getMonsterPool(30).normal||[];
    return pool.map(id=>getMonsterDefinitionForMap(id,testMap,30))
      .filter(m=>m&&!m.isBoss&&!m.isElite&&!m.isFacility);
  })())`));
  for(const monster of monsters){
    const party=[member('warrior',{stats:{attack:1}}),member('priest',{id:'priest',isMain:false,stats:{attack:1}}),member('mage',{id:'mage',isMain:false,stats:{attack:1}})];
    party[0].progress.potions=50;party[0].progress.manaPotions=50;
    const snapshot=P.capture({members:party,monsters:[monster],mapId,now:1000,fighting:true});
    const run=()=>P.simulate({snapshot,durationMs:60000,skills:true,survival:true,random:()=>.1,trace:true});
    try{
      const a=run(),b=run();assert.deepEqual(a,b,mapId+'/'+monster.id);
      assert.ok(a.consumables.potions>=0&&a.consumables.manaPotions>=0);
      cases++;
    }catch(error){error.message=mapId+'/'+monster.id+': '+error.message;throw error;}
  }
}
assert.ok(cases>=50);console.log('offline normal monsters: '+cases+' deterministic cases passed');
function quiet(job='warrior',options={}){
  const m=member(job,{hp:1000000,...options});m.nextAttackAt=100000000;
  m.skillCooldowns=Object.fromEntries(Object.keys(m.progress.skillLevels).map(k=>[k.split(':')[1],100000000]));return m;
}
function simulate(mapId,monster,party,ms,roll){
  return P.simulate({snapshot:P.capture({members:party,monsters:[monster],mapId,now:1000,fighting:true}),
    durationMs:ms,skills:true,survival:true,random:()=>roll,trace:true});
}
{
  // The formal beastmaster is elite and remains excluded from the departure pool.
  // A test-only rank override exercises the approved summon interface.
  const Trail=require('../black-forest-trail-policy');
  const monster={...Trail.getCombatMonster('blackstoneBeastmaster',17),isElite:false,maxHp:100000};
  const r=simulate('black-forest-trail',monster,[quiet()],3000,.5);
  const spider=r.enemies.find(e=>e.summoned);assert.ok(spider,'summon uses another enemy position');
  assert.equal(spider.id,'blackstonePoisonSpider');
  assert.equal(spider.hp,Math.round(Trail.getCombatMonster(spider.id).maxHp*.7));
  assert.ok(r.members[0].currentHp<1000000,'summoned monster attacks via simulation time');
  const excluded=simulate('black-forest-trail',Trail.getCombatMonster('blackstoneBeastmaster',17),[quiet()],3000,.5);
  assert.equal(excluded.effectiveMs,0,'formal elite cannot enter the normal offline pool');
}
{
  const Spirit=require('../black-forest-depths-policy').getCombatMonster('forestSpirit');
  const m=quiet();m.nextAttackAt=1000;
  const r=simulate('black-forest-depths',{...Spirit,maxHp:100000},[m],20000,.25);
  assert.ok(r.events.some(e=>e.category==='enemy-healing'&&e.message.includes('自然回響')),'normal monster self-heal actually executes');
}
{
  const Late=require('../chapter-three-late-combat-policy'),Map=require('../chapter-three-map-policy');
  const guard=Late.getMonster('ancient-altar',Map.getEnemy('rune-guard'));
  const m=quiet();m.nextAttackAt=1000;
  const r=simulate('ancient-altar',{...guard,maxHp:100000},[m],20000,.5);
  const telemetry=r.enemyStates[0].lateChapter.telemetry;
  assert.ok(Object.values(telemetry.shieldGenerated).some(n=>n>0),'rune shield generated');
  assert.ok(Object.values(telemetry.shieldAbsorbed).some(n=>n>0),'shield absorbs actual player damage');
  const wolf=Late.getMonster('skullcrusher-war-camp',Map.getEnemy('skullcrusher-wolf-rider'));
  const party=[quiet(),quiet('mage',{id:'mage',isMain:false}),quiet('priest',{id:'priest',isMain:false})];
  const hit=simulate('skullcrusher-war-camp',wolf,party,13000,.1);
  const skills=hit.enemyStates[0].lateChapter.telemetry;
  assert.ok(skills.wolfAssaultTargets>0);assert.equal(skills.wolfAssaultBacklineTargets,skills.wolfAssaultTargets,'warwolf targets an actual backline member');
}
console.log('offline monster mechanisms: summon/elite exclusion/self-heal/shield/designated target passed');
