'use strict';
const assert = require('node:assert/strict');
const Combat = require('../skullcrusher-dungeon-combat');
const Late = require('../chapter-three-late-combat-policy');
const Maps = require('../chapter-three-map-policy');
const {loadGame} = require('../tools/headless-game-runtime');
let checks = 0;
const check = (value,message) => {assert.ok(value,message);checks++;};
const sources = ['skullcrusher-war-camp','ancient-altar','redrock-temple'];
const before = sources.map(map=>JSON.stringify([...Maps.getMap(map).normalEnemyIds,Maps.getMap(map).eliteId,Maps.getMap(map).bossId].map(id=>Late.getMonster(map,Maps.getEnemy(id)))));
const expected = [
 [[1600,125,85],[1300,100,70],[1650,130,90]],
 [[2000,110,140],[1700,130,90],[1750,135,95],[1400,105,75]],
 [[2200,120,150],[2000,130,125],[1850,145,100],[2100,115,145],[1900,120,110]],
 [[6500,190,160]],[[7500,215,170],[8000,198,185]],[[35000,240,190]]
];
for(let step=0;step<6;step++) {
 const enemies=Combat.wave(step);
 assert.deepEqual(enemies.map(e=>[e.maxHp,e.attack,e.defense]),expected[step]);checks++;
 check(enemies.every(e=>e.level===(step<3?40:step<5?42:43)&&e.mapId===Combat.ID&&e.image===Maps.getEnemy(e.id).image),'instance identity, level, original art');
 check(enemies.every(e=>e.skillIds.length&&!e.skillIds.includes('fallen-warrior-rage')),'existing skills without fallen rage');
}
const elite=Combat.wave(4);assert.deepEqual(elite.map(e=>[e.attackSpeed,e.criticalRate,e.criticalDamageMultiplier,e.damageReduction]),[[.84,.1,1.5,26],[.78,.1,1.5,27]]);checks++;
const boss=Combat.wave(5)[0];assert.deepEqual([boss.attackSpeed,boss.criticalRate,boss.criticalDamageMultiplier,boss.damageReduction],[1,.15,1.5,28]);checks++;
let state={};check(Combat.summons(state,24501,35000,0).length===0,'above 70 no summons');
check(Combat.summons(state,24500,35000,0).length===2,'exact 70 summons two');
check(Combat.summons(state,20000,35000,0).length===0,'dead guards are not replenished before 40');
check(Combat.summons(state,14000,35000,1).length===1,'exact 40 fills one missing guard');
check(Combat.summons(state,10000,35000,0).length===0,'consumed 40 never delayed');
state={};check(Combat.summons(state,10000,35000,0).length===2&&Object.keys(state.thresholds).length===2,'one hit crosses both in order with cap');
check(Combat.summons(state,9000,35000,0).length===0,'skipped slots discarded');
state={};check(Combat.summons(state,0,35000,0).length===0&&!state.thresholds,'lethal hit never summons');
state={};Combat.summons(state,24000,35000,2);check(Combat.summons(state,14000,35000,2).length===0&&Object.keys(state.thresholds).length===2,'both full-cap triggers consumed');
state={thresholds:{'.7':true}};check(Combat.summons(state,14000,35000,1,['skullcrusher-berserker'])[0].id==='skullcrusher-wolf-rider','one living berserker replenishes the missing rider');
const guards=Combat.GUARDS.map(s=>Combat.monster(s,true));
assert.deepEqual(guards.map(e=>[e.level,e.maxHp,e.attack,e.defense,e.attackSpeed,e.criticalRate,e.damageReduction]),[[42,1800,135,85,.92,.05,10],[42,1800,140,90,1.05,.05,10]]);checks++;
const units=[boss,...guards].map((e,i)=>({...e,key:'unit-'+i,currentHp:e.maxHp,state:Late.createState(e.skillMapId,0)}));
units[1].currentHp=0;Late.death(Combat.ID,units[1],units,1000);Late.tick(Combat.ID,units,[],1000);
check(units[0].state.fallenRageStacks===0&&units[0].state.telemetry.fallenRageSources.length===0,'guard death has no rage event');
Late.tick(Combat.ID,units,[],7000);check(units[0].state.pendingActions.some(s=>s.id==='chieftain-earthsplitter'),'boss earthsplitter scheduled');
units[0].currentHp=9000;Late.thresholds(Combat.ID,units[0],8000);check(units[0].state.overlord,'overlord retained');
const doubles=elite.map((e,i)=>({...e,key:'elite-'+i,currentHp:e.maxHp,state:Late.createState(e.skillMapId,0)}));
Late.tick(Combat.ID,doubles,[],7000);check(doubles.every(e=>e.state.pendingActions.length),'dual elite simultaneous seven-second skills retained');
check(Combat.outcome({},[boss,...guards],[0,1800,1800],[{alive:true,currentHp:1}])==='succeeded','boss death wins with guards alive');
state={};check(Combat.outcome(state,[boss],[35000],[{alive:false,currentHp:0}])==='failed'&&Combat.outcome(state,[boss],[0],[{alive:false,currentHp:0}])===null,'terminal failure cannot become success');
state={};check(Combat.outcome(state,[boss],[0],[{alive:false,currentHp:0}])==='succeeded'&&Combat.outcome(state,[boss],[0],[{alive:false,currentHp:0}])===null,'single simultaneous observation is latched once');
check(sources.every((map,i)=>before[i]===JSON.stringify([...Maps.getMap(map).normalEnemyIds,Maps.getMap(map).eliteId,Maps.getMap(map).bossId].map(id=>Late.getMonster(map,Maps.getEnemy(id))))),'ordinary definitions unchanged');

(async()=>{
const g=loadGame();g.context.testAssert=assert;g.context.combatRoles=require('../tools/permanent-party-fixture').create().slots;
g.evaluate(`
requestAnimationFrame=()=>0;
localStorage.setItem('stardust-character-slots',JSON.stringify(combatRoles));
localStorage.setItem('stardust-character',JSON.stringify(combatRoles[0].character));
localStorage.setItem('stardust-progress',JSON.stringify(combatRoles[0].progress));setActiveCharacterSlotIndex(0);
const battleTasks=new Map();let taskId=0;setTimeout=(fn)=>{battleTasks.set(++taskId,fn);return taskId;};clearTimeout=id=>battleTasks.delete(id);
const runTasks=()=>{const tasks=[...battleTasks.values()];battleTasks.clear();tasks.forEach(fn=>fn());};
const combatMembers=getCharacterSlots().slice(0,3).map((slot,i)=>createBattlePartyMember(slot,i,combatRoles[0].character.id));
combatMembers.forEach(m=>{m.character.race='human';m.alive=true;m.currentHp=m.maxHp;});
const combatScene={run:{runId:'combat-test-run'},members:combatMembers,step:0,phase:1};let combatEnds=[];
window.skullcrusherLifecyclePreview={scene:combatScene,advance(){combatScene.step++;combatScene.phase=combatScene.step<4?1:combatScene.step===4?2:3;return combatScene;},end(status){combatEnds.push(status);return Promise.resolve();},checkDefeat(){if(combatMembers.every(m=>!m.alive)&&!battle.dungeonComplete){finishSkullcrusherCombat('failed');}return Promise.resolve();}};
function startCombat(step=0){combatScene.step=step;combatScene.phase=step<4?1:step===4?2:3;battle={sessionId:++battleSessionSequence,skullcrusherRunId:combatScene.run.runId,isDungeon:true,dungeonId:SkullcrusherDungeonCombat.ID,partyMembers:combatMembers,damageTimers:[],dungeonComplete:false,skullcrusherCombat:{thresholds:{}}};fighting=true;loadSkullcrusherEncounter(combatScene);}
startCombat();
`);
check(g.evaluate('battle.enemyTypes.length')===3,'live first wave');
g.evaluate(`combatMembers[0].currentHp=37;combatMembers[0].resourceCurrent=3;combatMembers[0].skillCooldowns.test=999999;combatMembers[0].chapterThreeDebuffs={'defense-down':{until:Date.now()+5000,value:.15}};`);
for(const [step,count] of [[1,4],[2,5],[3,1],[4,2],[5,1]]) {
 g.evaluate('battle.enemyHps=battle.enemyHps.map(()=>0);queueDefeatedEnemies();queueDefeatedEnemies();runTasks();');
 check(g.evaluate('combatScene.step')===step&&g.evaluate('battle.enemyTypes.length')===count,'single wave transition '+step);
}
check(g.evaluate(`combatMembers[0].currentHp===37&&combatMembers[0].resourceCurrent===3&&combatMembers[0].skillCooldowns.test===999999&&!!combatMembers[0].chapterThreeDebuffs['defense-down']`),'real wave loads retain actor hp/resource/cooldown/debuff');
g.evaluate(`battle.enemyHps[0]=24000;processSkullcrusherBoss();processSkullcrusherBoss();`);check(g.evaluate('battle.enemyTypes.length')===3,'live 70 summons once');
g.evaluate(`battle.enemyHps[1]=0;recordLateChapterEnemyDeath(1);battle.enemyHps[0]=14000;processSkullcrusherBoss();`);
check(g.evaluate('battle.skullcrusherEnemies.filter((e,i)=>e.isDungeonGuard&&battle.enemyHps[i]>0).length')===2,'live 40 cap fills missing guard');
check(g.evaluate('getLateChapterUnits()[0].state.fallenRageStacks')===0,'live death hook rage disabled');
g.evaluate(`battle.enemyHps[0]=0;processSkullcrusherBoss();queueDefeatedEnemies();`);await Promise.resolve();
check(g.evaluate(`!fighting&&battle.dungeonComplete&&combatEnds.length===1&&combatEnds[0]==='succeeded'`),'success immediately stops timers/combat with living guards, once');
g.evaluate(`combatMembers.forEach(m=>{m.alive=true;m.currentHp=m.maxHp;});combatEnds=[];startCombat(4);processLateChapterCombat(Date.now()+7001);`);
check(g.evaluate('getLateChapterUnits().every(u=>u.state.pendingActions.length>0)'),'live dual-elite skill integration');
// Execute real enemy and player combat handlers, not only the wave policy.
g.evaluate(`Math.random=()=>.5;battle.enemyNextAttackAt=[0,0];enemyAttackTick();battleTick();autoSkillTick();`);checks++;
const squad={innerHTML:'',style:{setProperty(){}}},query=g.context.document.querySelector;
g.context.document.querySelector=selector=>selector==='#enemy-squad'?squad:query(selector);
g.evaluate(`startCombat(2);renderEnemySquad();`);check((squad.innerHTML.match(/data-enemy-index=/g)||[]).length===5&&!squad.innerHTML.includes('reserve-indicator'),'all five monsters render without a hidden reserve');
g.context.document.querySelector=query;
g.evaluate(`combatMembers.forEach(m=>{m.alive=true;m.currentHp=m.maxHp;});combatEnds=[];startCombat(5);Math.random=()=>0;const rewardsBefore=JSON.stringify([getProgress().gold,getProgress().xp,getProgress().inventory]);applyDamageToMonster(0,1e9,{damageType:'physical',attackRange:'ranged'},{attacker:combatMembers[0],canEvade:false,canParry:false});queueDefeatedEnemies();testAssert.equal(battle.enemyTypes.length,1);testAssert.equal(JSON.stringify([getProgress().gold,getProgress().xp,getProgress().inventory]),rewardsBefore);`);await Promise.resolve();
check(g.evaluate(`combatEnds.length===1&&combatEnds[0]==='succeeded'`),'actual lethal damage neither summons nor grants formal rewards');
g.evaluate(`startCombat();const deadMage=combatMembers.find(m=>m.job==='mage');if(deadMage){deadMage.alive=false;deadMage.currentHp=0;const old=resolveFinishedMageResonance;resolveFinishedMageResonance=()=>{throw Error('dead mage cast');};testAssert.equal(useAutoSkillForMember(deadMage),false);resolveFinishedMageResonance=old;}`);checks++;
g.evaluate(`const healer=combatMembers[0],patient=combatMembers[2];patient.currentHp=1;patient.alive=true;queueClassHealAfterglow(healer,patient,{id:999,dueAt:0,amount:999});healer.pendingClassHeals=[{id:999}];fighting=false;runTasks();testAssert.equal(patient.currentHp,1);`);checks++;
g.evaluate(`startCombat();showEnemyDamage([0],12);battle={sessionId:++battleSessionSequence};fighting=false;runTasks();testAssert.deepEqual(Object.keys(battle),['sessionId']);`);checks++;
g.evaluate(`startCombat();let staleEventCalls=0;scheduleBattleVisualEvent(()=>staleEventCalls++,10);battle.sessionId++;runTasks();testAssert.equal(staleEventCalls,0);`);checks++;
g.evaluate(`startCombat();const healingSource=combatMembers[0],healingPatient=combatMembers[2];healingPatient.currentHp=1;healingPatient.alive=true;healingSource.pendingClassHeals=[{id:1000}];queueClassHealAfterglow(healingSource,healingPatient,{id:1000,dueAt:0,amount:10});combatScene.step=1;loadSkullcrusherEncounter(combatScene);runTasks();testAssert.equal(healingPatient.currentHp,11);`);checks++;
g.evaluate(`combatEnds=[];combatMembers.forEach(m=>{m.alive=true;m.currentHp=m.maxHp;});startCombat();combatMembers[0].currentHp=0;defeatPartyMember(combatMembers[0]);`);
check(g.evaluate('fighting&&combatEnds.length===0'),'main death continues actual combat');
g.evaluate(`combatMembers[1].currentHp=0;defeatPartyMember(combatMembers[1]);`);check(g.evaluate('fighting'),'two dead continues');
g.evaluate(`combatMembers[2].currentHp=0;defeatPartyMember(combatMembers[2]);`);await Promise.resolve();
check(g.evaluate(`combatEnds.length===1&&combatEnds[0]==='failed'&&!fighting`),'all dead fail once');
// Captured stale transition must be inert after the battle's generation changes.
g.evaluate(`combatMembers.forEach(m=>{m.alive=true;m.currentHp=m.maxHp;});startCombat();battle.enemyHps.fill(0);queueDefeatedEnemies();battle.sessionId++;const oldStep=combatScene.step;runTasks();testAssert.equal(combatScene.step,oldStep);`);checks++;
console.log('Skullcrusher combat: '+checks+' checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
