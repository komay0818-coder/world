const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const policy = require('../black-forest-trail-policy.js');
const chapterOne = require('../chapter-one-level-policy.js');

assert.equal(policy.MAP.id, 'black-forest-trail');
assert.equal(policy.MAP.chapter, 2);
assert.equal(policy.MAP.order, 2);
assert.equal(policy.MAP.level, 17);
assert.equal(policy.MAP.enemyPoolId, 'black-forest-trail-enemies');
assert.equal(policy.MAP.bossId, 'blackstone-centurion');
assert.equal(policy.MAP.background, 'assets/black-forest-trail-background.png');
assert.equal(policy.MAP.implemented, true);
assert.equal(policy.MAP.contentStatus, 'combat-ready');
assert.deepEqual(policy.MONSTERS.map((monster) => monster.name), [
  '黑石斥候', '黑石掠奪者', '黑石弓箭手', '黑石毒蜘蛛', '黑石訓獸師', '黑石隊長', '黑石百夫長'
]);
assert.deepEqual(policy.MONSTERS.map((monster) => monster.rank), ['normal', 'normal', 'normal', 'normal', 'elite', 'elite', 'boss']);
assert.equal(policy.getMonstersByRank('normal').length, 4);
assert.equal(policy.getMonstersByRank('elite').length, 2);
assert.equal(policy.getMonstersByRank('boss').length, 1);
assert.equal(policy.getMonster('blackstone-poison-spider').ownerFaction, 'blackstone-bandits');
assert.deepEqual(policy.getMonster('blackstone-poison-spider').tags, ['beast', 'poison', 'spider']);
assert.equal(policy.getMonster('blackstone-poison-spider').image, 'assets/blackstone-poison-spider.png');
assert.equal(policy.getMonster('blackstone-archer').image, 'assets/blackstone-archer.png');
assert.equal(policy.getMonster('blackstone-beastmaster').image, 'assets/blackstone-beastmaster.png');
assert.equal(policy.getMonster('blackstone-captain').image, 'assets/blackstone-captain.png');
assert.equal(policy.getMonster('blackstone-centurion').image, 'assets/blackstone-centurion.png');
assert.equal(policy.STORY.previousMapId, 'black-forest-entrance');
assert.equal(policy.STORY.nextMapId, 'spider-nest');
assert.equal(policy.STORY.completionObjectiveId, 'defeat-blackstone-centurion');
assert.equal(policy.STORY.completionClueId, 'spider-nest-route-clue');
assert.ok(policy.STORY.discoveries.includes('patrol-and-supply-route'));
assert.ok(policy.STORY.discoveries.includes('poison-spider-husbandry'));
assert.ok(policy.MONSTERS.every((monster) => monster.level[0] === 17 && monster.level[1] === 17 && monster.stats.maxHp > 0
  && monster.stats.attack > 0 && monster.stats.defense >= 0 && monster.stats.attackSpeed > 0
  && monster.dropTableId === 'black-forest-trail-pending' && monster.aiProfileId !== null
  && monster.skillIds.length > 0 && monster.implemented === true));
assert.ok(policy.MONSTERS.filter((monster) => !['blackstone-poison-spider', 'blackstone-archer', 'blackstone-beastmaster', 'blackstone-captain', 'blackstone-centurion'].includes(monster.id)).every((monster) => monster.image === null));
assert.equal(policy.getMonster('unknown'), null);
assert.deepEqual(policy.getCombatPool(), {
  normal: ['blackstoneTrailScout', 'blackstoneTrailRaider', 'blackstoneArcher', 'blackstonePoisonSpider'],
  elite: ['blackstoneBeastmaster', 'blackstoneCaptain'],
  boss: ['blackstoneCenturion']
});
assert.equal(policy.getCombatMonster('blackstoneTrailScout').maxHp, 230);
assert.equal(policy.getCombatMonster('blackstoneTrailRaider').defense, 25);
assert.equal(policy.getCombatMonster('blackstoneArcher').attack, 39);
assert.equal(policy.getCombatMonster('blackstonePoisonSpider').attackSpeed, 1.15);
assert.equal(policy.getCombatMonster('blackstoneBeastmaster').isElite, true);
assert.equal(policy.getCombatMonster('blackstoneBeastmaster').attack, 50);
assert.equal(policy.getCombatMonster('blackstoneCaptain').maxHp, 880);
assert.equal(policy.getCombatMonster('blackstoneCaptain').defense, 40);
assert.equal(policy.getCombatMonster('blackstoneCenturion').maxHp, 2800);
assert.equal(policy.getCombatMonster('blackstoneCenturion').attack, 64);
assert.equal(policy.getCombatMonster('blackstoneCenturion').defense, 53);
assert.equal(policy.resolveAction('blackstoneTrailScout', .29), 'scouting-mark');
assert.equal(policy.resolveAction('blackstoneTrailScout', .30), 'attack');
assert.equal(policy.resolveAction('blackstoneTrailRaider', .24), 'armor-break');
assert.equal(policy.resolveAction('blackstoneTrailRaider', .25), 'intercept');
assert.equal(policy.resolveAction('blackstoneTrailRaider', .35), 'attack');
assert.equal(policy.resolveAction('blackstoneArcher', .09), 'aimed-shot');
assert.equal(policy.resolveAction('blackstoneArcher', .10), 'piercing-arrow');
assert.equal(policy.resolveAction('blackstoneArcher', .35), 'attack');
assert.equal(policy.resolveAction('blackstonePoisonSpider', .29), 'venom-fang');
assert.equal(policy.resolveAction('blackstonePoisonSpider', .35), 'webbed-strike');
assert.equal(policy.resolveAction('blackstonePoisonSpider', .40), 'attack');
assert.equal(policy.resolveAction('blackstoneBeastmaster', .24), 'venom-flask');
assert.equal(policy.resolveAction('blackstoneBeastmaster', .44), 'beast-command');
assert.equal(policy.resolveAction('blackstoneBeastmaster', .54), 'release-spider');
assert.equal(policy.resolveAction('blackstoneBeastmaster', .55), 'attack');
assert.equal(policy.resolveAction('blackstoneCaptain', .19, .34), 'captain-command');
assert.equal(policy.resolveAction('blackstoneCaptain', .39, .34), 'shield-counter');
assert.equal(policy.resolveAction('blackstoneCaptain', .49, .34), 'captain-execution');
assert.equal(policy.resolveAction('blackstoneCaptain', .49, .35), 'attack');
assert.equal(policy.resolveAction('blackstoneCaptain', .50, .34), 'attack');
assert.equal(policy.getPhase('blackstoneCenturion', 1900, 2800), 2);
assert.equal(policy.getPhase('blackstoneCenturion', 900, 2800), 3);
assert.deepEqual(policy.getCombatMultipliers('blackstoneCenturion', 1900, 2800), { attack: 1.1, attackSpeed: 1.05, defense: 1, evasion: 0 });
assert.equal(policy.resolveAction('blackstoneCenturion', .14, .34, 900, 2800), 'execution-axe');
assert.deepEqual(policy.getCombatMultipliers('blackstoneCenturion', 900, 2800), { attack: 1.2, attackSpeed: 1.15, defense: .85, evasion: 0 });
assert.equal(policy.getDamageMultiplier('execution-axe'), 2.1);
assert.equal(policy.getDamageMultiplier('armor-break'), 1.2);
assert.equal(policy.getDefenseIgnore('piercing-arrow'), .30);
assert.equal(policy.POISON.maxStacks, 3);
assert.equal(policy.CONTROL.webDurationMs, 4000);
assert.equal(policy.MARK.durationMs, 5000);
assert.equal(policy.RAIDER.armorBreakPenalty, .15);
assert.equal(policy.CAPTAIN.commandAttackBonus, .15);
assert.deepEqual(policy.getCombatMultipliers('blackstoneTrailScout', 50, 230), { attack: 1, attackSpeed: 1.25, defense: 1, evasion: 15 });

const plainsDepths = Object.values(chapterOne.MONSTER_PROFILES['plains-depths']).map((profile) => chapterOne.scaleMonster(
  { id: profile.monsterType }, 'plains-depths', profile.level[1]
));
const average = (entries, key) => entries.reduce((sum, entry) => sum + entry[key], 0) / entries.length;
const chapterOneByRank = {
  normal: plainsDepths.filter((entry) => !entry.isElite && !entry.isBoss),
  elite: plainsDepths.filter((entry) => entry.isElite),
  boss: plainsDepths.filter((entry) => entry.isBoss)
};
for (const rank of ['normal', 'elite', 'boss']) {
  const trail = policy.getMonstersByRank(rank).map((entry) => policy.toCombatMonster(entry));
  for (const stat of ['maxHp', 'attack', 'defense']) {
    assert.ok(average(trail, stat) >= average(chapterOneByRank[rank], stat), `trail ${rank} ${stat} does not regress below the chapter-one finale`);
  }
}
const background = fs.readFileSync(path.join(__dirname, '..', policy.MAP.background));
assert.equal(background.subarray(1, 4).toString(), 'PNG', 'the Black Forest trail background is a PNG asset');
assert.equal(background[25], 2, 'the Black Forest trail background uses RGB color');
const poisonSpider = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('blackstone-poison-spider').image));
assert.equal(poisonSpider.subarray(1, 4).toString(), 'PNG', 'the Blackstone poison spider is a PNG asset');
assert.equal(poisonSpider[25], 6, 'the Blackstone poison spider uses RGBA color with transparency');
const archer = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('blackstone-archer').image));
assert.equal(archer.subarray(1, 4).toString(), 'PNG', 'the Blackstone archer is a PNG asset');
assert.equal(archer[25], 6, 'the Blackstone archer uses RGBA color with transparency');
const beastmaster = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('blackstone-beastmaster').image));
assert.equal(beastmaster.subarray(1, 4).toString(), 'PNG', 'the Blackstone beastmaster is a PNG asset');
assert.equal(beastmaster[25], 6, 'the Blackstone beastmaster uses RGBA color with transparency');
const captain = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('blackstone-captain').image));
assert.equal(captain.subarray(1, 4).toString(), 'PNG', 'the Blackstone captain is a PNG asset');
assert.equal(captain[25], 6, 'the Blackstone captain uses RGBA color with transparency');
const centurion = fs.readFileSync(path.join(__dirname, '..', policy.getMonster('blackstone-centurion').image));
assert.equal(centurion.subarray(1, 4).toString(), 'PNG', 'the Blackstone centurion is a PNG asset');
assert.equal(centurion[25], 6, 'the Blackstone centurion uses RGBA color with transparency');

console.log('black-forest-trail-policy: assertions passed');
