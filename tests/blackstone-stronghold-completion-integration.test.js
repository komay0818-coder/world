const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const stronghold = require('../blackstone-stronghold-policy.js');
const progression = require('../chapter-two-progression-policy.js');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const branchStart = script.indexOf("if (battle.dungeonId === 'blackstone-stronghold')");
const completionBranch = script.slice(branchStart, branchStart + 1200);

function createStrongholdProgress() {
  const progress = { unlockedChapter: 2 };
  ['black-forest-entrance', 'black-forest-trail', 'spider-nest'].forEach((mapId) => {
    progression.recordBossKill(progress, mapId, { id: progression.BOSS_IDS[mapId] });
  });
  return progress;
}

function destroyOutposts(count) {
  let state = stronghold.createState(() => 0);
  for (let index = 0; index < count; index += 1) {
    const threshold = stronghold.getRequiredKills(index);
    while (state.killsSinceOutpost < threshold) state = stronghold.recordMonsterKill(state, () => 0);
    state = stronghold.destroyOutpost(state, { now: (index + 1) * 1000, random: () => 0 }).state;
  }
  return state;
}

const bossAliveProgress = createStrongholdProgress();
const fiveOutposts = destroyOutposts(5);
assert.equal(fiveOutposts.bossSpawned, true, 'the fifth outpost spawns the Blackstone Warlord');
assert.equal(progression.getMapState(bossAliveProgress, 'blackstone-stronghold', true).bossFirstKilled, false);
assert.equal(progression.getMapState(bossAliveProgress, 'blackstone-stronghold', true).cleared, false);
assert.equal(progression.canEnter(bossAliveProgress, 'forest-altar', true), false, 'a living boss does not unlock 2-5');
assert.match(completionBranch, /strongholdProgress\.bossFirstKilled[\s\S]*completeDungeon\(\)/,
  'the dungeon completion call is guarded by formal boss-kill progress');
assert.match(completionBranch, /if \(battle\.blackstoneStrongholdState\?\.bossSpawned\) \{[\s\S]*battle\.waveTransitioning = false;[\s\S]*return;/,
  'a spawned living boss remains in combat instead of completing the dungeon');

const bossKill = progression.recordBossKill(bossAliveProgress, 'blackstone-stronghold', { id: 'blackstoneStrongholdWarlord' });
assert.equal(bossKill.firstClear, true, 'the actual Blackstone Warlord death records the first clear');
assert.equal(progression.getMapState(bossAliveProgress, 'blackstone-stronghold', true).bossFirstKilled, true);
assert.equal(progression.getMapState(bossAliveProgress, 'blackstone-stronghold', true).cleared, true);
assert.equal(progression.canEnter(bossAliveProgress, 'forest-altar', true), true, 'the actual boss death unlocks 2-5');

const fourOutpostsProgress = createStrongholdProgress();
const fourOutposts = destroyOutposts(4);
assert.equal(fourOutposts.bossSpawned, false, 'four outposts do not spawn the boss');
assert.equal(progression.getMapState(fourOutpostsProgress, 'blackstone-stronghold', true).cleared, false);
assert.equal(progression.canEnter(fourOutpostsProgress, 'forest-altar', true), false);

console.log('blackstone-stronghold-completion-integration: assertions passed');
