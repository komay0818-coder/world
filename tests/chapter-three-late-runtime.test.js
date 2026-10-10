'use strict';
const assert = require('node:assert/strict');
const { loadGame } = require('../tools/headless-game-runtime');
const game = loadGame();
game.evaluate(`
requestAnimationFrame = () => 0;
window.location = { hostname:'localhost', pathname:'/', search:'?playtest=chapter-three-34', href:'http://localhost/' };
const initialLateSlots = getCharacterSlots();
window.location.search = '';
localStorage.setItem('stardust-character-slots', JSON.stringify(initialLateSlots));
localStorage.setItem('stardust-character', JSON.stringify(initialLateSlots[0].character));
localStorage.setItem('stardust-progress', JSON.stringify(initialLateSlots[0].progress));
setActiveCharacterSlotIndex(0);
let lateTestNow = Date.now();
const originalDateNow = Date.now;
Date.now = () => lateTestNow;
Math.random = () => .5;
`);
try {
  assert.equal(game.evaluate(`selectAdventureMap('ancient-altar'); getActiveMap(getProgress()).id`), 'skullcrusher-war-camp', 'locked 3-5 cannot be selected');
  for (const mapId of ['skullcrusher-war-camp', 'ancient-altar', 'redrock-temple']) {
    const result = JSON.parse(game.evaluate(`
      Math.random = () => 0;
      selectAdventureMap('${mapId}');
      Math.random = () => .5;
      const liveBossIndex${mapId.replaceAll('-', '')} = battle.enemyTypes.findIndex((_, index) => getEnemyDefinition(index).isBoss);
      queueDefeatedEnemies();
      JSON.stringify({ map:getActiveMap(getProgress()).id, dungeon:battle.isDungeon,
        bossIndex:liveBossIndex${mapId.replaceAll('-', '')}, cleared:getProgress().chapterThreeProgress.cleared['${mapId}'],
        monsters:battle.enemyTypes.map((_, index) => ({ hp:getEnemyDefinition(index).maxHp, map:getEnemyDefinition(index).mapId, facility:getEnemyDefinition(index).isFacility })) });
    `));
    assert.equal(result.map, mapId);
    assert.equal(result.dungeon, false);
    assert.ok(result.bossIndex >= 0, 'formal random encounter generates the boss');
    assert.equal(result.cleared, false, 'a living boss never completes the area');
    assert.ok(result.monsters.every(monster => monster.map === mapId && (monster.facility ? monster.hp === require('../chapter-three-facility-policy').CONFIG[mapId].hp : monster.hp >= 960)), 'no beginner monster fallback');
    const skillChecks = JSON.parse(game.evaluate(`
      lateTestNow += 16000;
      processLateChapterCombat(lateTestNow);
      var lateUnitsForCheck = getLateChapterUnits(lateTestNow);
      JSON.stringify(lateUnitsForCheck.map(unit => ({ id:unit.id, pending:unit.state.pendingActions.map(skill => skill.id), telemetry:unit.state.telemetry })));
    `));
    assert.ok(skillChecks.some(unit => unit.pending.length > 0), 'formal boss skill is scheduled');
    // Exercise the production attack path, including target choice, shared hit chance and debuffs.
    game.evaluate(`battle.partyMembers.forEach(member => { member.currentHp = member.maxHp * 100; }); enemyAttackTick();`);
    assert.equal(game.evaluate(`getProgress().chapterThreeProgress.cleared['${mapId}']`), false);
    game.evaluate(`
      var defeatedBossIndex = battle.enemyTypes.findIndex((_, index) => getEnemyDefinition(index).isBoss);
      applyDamageToMonster(defeatedBossIndex, 10000000, { damageType:'physical', attackRange:'ranged' },
        { attacker:getMainBattleMember(), canEvade:false, canParry:false });
      queueDefeatedEnemies();
    `);
    assert.equal(game.evaluate(`getProgress().chapterThreeProgress.cleared['${mapId}']`), true, 'actual damage and reward settlement record first clear');
    const next = { 'skullcrusher-war-camp':'ancient-altar', 'ancient-altar':'redrock-temple' }[mapId];
    if (next) assert.equal(game.evaluate(`getProgress().chapterThreeProgress.unlocked['${next}']`), true);
    assert.equal(game.evaluate(`JSON.parse(localStorage.getItem('stardust-progress')).chapterThreeProgress.cleared['${mapId}']`), true, 'clear persists to ordinary storage');
  }
  assert.equal(game.evaluate('getProgress().chapterThreeProgress.completed'), true);
  const storage = JSON.parse(game.evaluate(`JSON.stringify(Object.fromEntries(['stardust-progress','stardust-character','stardust-character-slots'].map(key=>[key,localStorage.getItem(key)])))`));
  const reloaded = loadGame();
  for (const [key, value] of Object.entries(storage)) reloaded.context.localStorage.setItem(key, value);
  assert.equal(reloaded.evaluate('getProgress().chapterThreeProgress.completed'), true, 'fresh runtime preserves chapter completion');
  assert.equal(reloaded.evaluate("getActiveMap(getProgress()).id"), 'redrock-temple');
  game.evaluate(`
    openVillage = () => {};
    battle.partyMembers.forEach(member => { member.currentHp = 0; member.chapterThreeBurn = { ticks:3 }; });
    defeatPartyMember(getMainBattleMember(), lateTestNow);
  `);
  assert.equal(game.evaluate('getProgress().requiresMapSelectionAfterDefeat'), true, 'main death ends combat and requires explicit re-entry');
  assert.equal(game.evaluate('fighting'), false);
  assert.equal(game.evaluate('getProgress().chapterThreeProgress.completed'), true, 'defeat preserves progression');
  assert.equal(game.evaluate('getMainBattleMember().chapterThreeBurn'), null);
  assert.equal(game.evaluate(`ChapterThreeProgressionPolicy.canEnter(getProgress(), 'bloodwar-wastes', true)`), true, '3-1 through 3-3 progression survives');
} finally { game.evaluate('Date.now = originalDateNow;'); }
console.log('chapter-three-late-runtime: assertions passed');
