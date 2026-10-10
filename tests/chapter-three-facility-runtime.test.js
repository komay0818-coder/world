'use strict';
const assert=require('node:assert/strict'),{loadGame}=require('../tools/headless-game-runtime');
const g=loadGame();g.evaluate(`requestAnimationFrame=()=>0;window.location={hostname:'localhost',pathname:'/',search:'?playtest=chapter-three-36&loadout=rare-runes-v1&facility=armory',href:'http://localhost/'};Math.random=()=>.5;openBattle();`);
assert.equal(g.evaluate(`battle.enemyTypes.filter(ChapterThreeFacilityPolicy.facilityId).length`),1);
assert.equal(g.evaluate(`getOnlineFacilityEffects().damage`),.8);
assert.equal(g.evaluate(`getOnlineFacilityEffects().defense`),.8);
assert.equal(g.evaluate(`getOnlineFacilityEffects().drain`),20);
g.evaluate(`var buildingIndex=battle.enemyTypes.findIndex(ChapterThreeFacilityPolicy.facilityId);var building=getEnemyDefinition(buildingIndex);var main=getMainBattleMember();var originalNow=Date.now;var testNow=Date.now();Date.now=()=>testNow;`);
try {
 assert.equal(g.evaluate('building.maxHp'),6000);assert.equal(g.evaluate('building.defense'),96);
 const damage=g.evaluate(`applyDamageToMonster(buildingIndex,100,{damageType:'physical',attackRange:'ranged'},{attacker:main,canEvade:false,canParry:false}).finalDamage`);assert.ok(damage>0);
 g.evaluate(`battle.lastFacilityDrainAt=testNow;main.shield=1000;var hpBefore=main.currentHp;processOnlineFacilityDrain(testNow+1000);`);
 assert.equal(g.evaluate('hpBefore-main.currentHp'),20);assert.equal(g.evaluate('main.shield'),1000);
 const result=JSON.parse(g.evaluate(`
 main.currentHp=main.maxHp/2;main.resourceCurrent=0;main.stats.killHealthRecoveryPercent=1;main.stats.killResourceRecoveryPercent=1;
 var hpBeforeKill=main.currentHp;var beforeProgress=getProgress();var goldBefore=beforeProgress.gold;var xpBefore=beforeProgress.xp;
 Math.random=()=>0;
 applyDamageToMonster(buildingIndex,10000000,{damageType:'physical',attackRange:'ranged'},{attacker:main,canEvade:false,canParry:false});
 var hpAfterHit=main.currentHp;queueDefeatedEnemies();queueDefeatedEnemies();
 JSON.stringify({hpBeforeKill,hpAfterHit,resource:main.resourceCurrent,gold:getProgress().gold-goldBefore,xp:getProgress().xp-xpBefore,count:getProgress().chapterThreeFacilities['redrock-temple'].armory,inventory:getProgress().inventory.map(x=>x.id),cleared:getProgress().chapterThreeProgress.cleared['redrock-temple'],damage:getOnlineFacilityEffects().damage});`));
 assert.equal(result.hpBeforeKill,result.hpAfterHit);assert.equal(result.resource,0);assert.equal(result.gold,45);assert.equal(result.xp,0);assert.equal(result.count,1);assert.equal(result.cleared,false);assert.equal(result.damage,1-.2*(34/35));
 assert.ok(result.inventory.includes('recipe-ancient-warpattern-shoulders'));assert.ok(result.inventory.includes('epic-weapon-recipe-fragment'));
 assert.equal(g.evaluate(`JSON.parse(sessionStorage.getItem(ChapterTwoBalancePlaytestPolicy.getProgressKey())).chapterThreeFacilities['redrock-temple'].armory`),1);
 g.evaluate(`var savedFacilitySlots=getCharacterSlots();var savedFacilityProgress=getProgress();`); // Reload persistence is tested below using actual captured progress.
} finally {g.evaluate('Date.now=originalNow;');}
// Ordinary local storage re-entry: no isolated preview storage involved.
const captured=g.evaluate(`JSON.stringify({...savedFacilityProgress,chapterThreeFacilities:{'redrock-temple':{'supply-station':40,armory:35,'shaman-altar':35}}})`);
const fresh=loadGame();fresh.context.localStorage.setItem('stardust-character-slots',g.evaluate('JSON.stringify(savedFacilitySlots)'));
fresh.context.localStorage.setItem('stardust-progress',captured);
fresh.evaluate(`var persistedSlots=JSON.parse(localStorage.getItem('stardust-character-slots'));persistedSlots[0].progress=JSON.parse(localStorage.getItem('stardust-progress'));localStorage.setItem('stardust-character-slots',JSON.stringify(persistedSlots));`);
assert.equal(fresh.evaluate(`getProgress().chapterThreeFacilities['redrock-temple']['supply-station']`),40);
assert.equal(fresh.evaluate(`ChapterThreeFacilityPolicy.effects(getProgress(),'redrock-temple').drain`),0);
g.evaluate(`openVillage=()=>{};battle.partyMembers.forEach(member=>{member.currentHp=1;member.shield=10000;member.stats.hpRegeneration=10000;});battle.lastFacilityDrainAt=Date.now();processOnlineFacilityDrain(battle.lastFacilityDrainAt+1000);`);
assert.equal(g.evaluate('fighting'),false,'supply drain can end the main battle before regeneration');
assert.equal(g.evaluate('getProgress().requiresMapSelectionAfterDefeat'),true);
assert.equal(g.evaluate(`getProgress().chapterThreeFacilities['redrock-temple'].armory`),1,'defeat preserves building progress');
console.log('chapter-three-facility-runtime: assertions passed');
