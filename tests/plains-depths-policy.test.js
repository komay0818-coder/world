const assert = require('assert');
const policy = require('../plains-depths-policy');

const expectedNames = [
  '高地野狼', '岩背野豬', '黑石斥侯', '草原禿鷹',
  '黑石掠奪者', '流浪黑騎士', '黑石頭目'
];
const monsters = Object.values(policy.MONSTER_TYPES);
const closeTo = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} should equal ${expected}`);

assert.deepEqual(monsters.map((monster) => monster.name), expectedNames, 'all requested monsters are defined');
assert.deepEqual(policy.MONSTER_POOL.normal, ['highlandWolf', 'rockbackBoar', 'blackstoneScout', 'grasslandVulture']);
assert.deepEqual(policy.MONSTER_POOL.elite, ['blackstoneRaider', 'wanderingBlackKnight']);
assert.deepEqual(policy.MONSTER_POOL.boss, ['blackstoneLeader']);
assert.ok(policy.MONSTER_POOL.normal.every((id) => !policy.MONSTER_TYPES[id].isElite && !policy.MONSTER_TYPES[id].isBoss));
assert.ok(policy.MONSTER_POOL.elite.every((id) => policy.MONSTER_TYPES[id].isElite && !policy.MONSTER_TYPES[id].isBoss));
assert.ok(policy.MONSTER_POOL.boss.every((id) => policy.MONSTER_TYPES[id].isBoss));
assert.equal(policy.MONSTER_TYPES.blackstoneScout.artClass, 'plains-depths-blackstone-scout-art');
assert.equal(policy.MONSTER_TYPES.blackstoneRaider.artClass, 'plains-depths-blackstone-raider-art');
assert.equal(policy.MONSTER_TYPES.blackstoneLeader.artClass, 'plains-depths-blackstone-leader-art');
assert.equal(policy.MONSTER_TYPES.grasslandVulture.artClass, 'plains-depths-grassland-vulture-art');
assert.equal(policy.MONSTER_TYPES.highlandWolf.artClass, 'plains-depths-highland-wolf-art');
assert.equal(policy.MONSTER_TYPES.rockbackBoar.artClass, 'plains-depths-rockback-boar-art');
assert.equal(policy.MONSTER_TYPES.wanderingBlackKnight.artClass, 'plains-depths-wandering-black-knight-art');
assert.ok(monsters.every((monster) => monster.artClass !== 'monster-placeholder-art'));
assert.ok(monsters.every((monster) => monster.lootPending));
assert.equal(new Set(monsters.map((monster) => monster.id)).size, 7, 'monster IDs are unique');

const wolf = policy.applyPlainsDepthsPassive(policy.MONSTER_TYPES.highlandWolf, 'plains-depths');
assert.equal(wolf.evasion, 20, 'wolf pack agility adds ten evasion');
assert.equal(policy.resolveActiveSkill('highlandWolf', .29), 'rend');
assert.equal(policy.resolveActiveSkill('highlandWolf', .30), 'attack');

const boar = policy.applyPlainsDepthsPassive(policy.MONSTER_TYPES.rockbackBoar, 'plains-depths');
assert.equal(boar.damageReduction, 13, 'thick hide adds five damage reduction');
assert.equal(policy.getIrritableMultiplier('rockbackBoar', 39, 100), 1.15);
assert.equal(policy.getIrritableMultiplier('rockbackBoar', 40, 100), 1);
assert.equal(policy.resolveActiveSkill('rockbackBoar', .1), 'charge');

const vulture = policy.applyPlainsDepthsPassive(policy.MONSTER_TYPES.grasslandVulture, 'plains-depths');
assert.equal(vulture.evasion, 24, 'vulture passive adds ten evasion');
assert.equal(policy.resolveActiveSkill('grasslandVulture', .1), 'dive');
assert.equal(policy.getActiveDamageMultiplier('dive'), 2);

assert.equal(policy.getBlackstoneAuraBonus(['blackstoneScout', 'blackstoneRaider', 'highlandWolf']), .15);
const auraScout = policy.applyBlackstoneAura(policy.MONSTER_TYPES.blackstoneScout, ['blackstoneScout', 'blackstoneRaider'], false);
closeTo(auraScout.attack, 19.55);
closeTo(auraScout.defense, 9.2);
const roaredScout = policy.applyBlackstoneAura(policy.MONSTER_TYPES.blackstoneScout, ['blackstoneScout'], true);
closeTo(roaredScout.attack, 19.55);
closeTo(roaredScout.defense, 8.4);
assert.equal(policy.applyBlackstoneAura(policy.MONSTER_TYPES.highlandWolf, ['blackstoneLeader'], true), policy.MONSTER_TYPES.highlandWolf, 'blackstone buffs do not affect other families');

assert.equal(policy.resolveActiveSkill('blackstoneRaider', .1), 'smash');
assert.equal(policy.getActiveDamageMultiplier('smash'), 1.5);
assert.equal(policy.resolveActiveSkill('wanderingBlackKnight', .24, true), 'heal');
assert.equal(policy.resolveActiveSkill('wanderingBlackKnight', .24, false), 'attack');
assert.equal(policy.KNIGHT_HEAL_RATIO, .10);
assert.equal(policy.COUNTER_DAMAGE_MULTIPLIER, .5);
assert.equal(policy.resolveActiveSkill('blackstoneLeader', .19), 'roar');
assert.equal(policy.resolveActiveSkill('blackstoneLeader', .20), 'smash');
assert.equal(policy.resolveActiveSkill('blackstoneLeader', .50), 'attack');
assert.equal(policy.ROAR_ATTACK_BONUS, .10);
assert.equal(policy.ROAR_DURATION_MS, 5000);

console.log('plains-depths-policy: assertions passed');
