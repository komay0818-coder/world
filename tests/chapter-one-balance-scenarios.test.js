const assert = require('assert');
const policy = require('../chapter-one-level-policy');
const defense = require('../monster-defense');

const levelOneWarrior = { hp: 163, attack: 12, defense: 10, accuracy: 1.05, dodge: .03 };

function estimateEncounter(mapId, monsterType, monsterLevel, monsterBase, player = levelOneWarrior) {
  const monster = policy.scaleMonster({ id: monsterType, ...monsterBase }, mapId, monsterLevel);
  const playerHitChance = policy.getPlayerHitChance(1, monsterLevel, player.accuracy);
  const playerDamage = Math.max(1, Math.ceil(
    player.attack * (100 / (100 + monster.defense)) * (1 - (monster.damageReduction || 0) / 100)
  ));
  const secondsToDefeat = monster.maxHp / (playerDamage * playerHitChance);
  const monsterHitChance = policy.getMonsterHitChance(monsterLevel, 1, player.dodge);
  const incomingDamage = defense.resolvePlayerDamage({
    baseDamage: monster.attack,
    defense: player.defense
  }).finalDamage;
  const secondsToFallAgainstFour = player.hp / (incomingDamage * monsterHitChance * 4);
  return { monster, playerHitChance, secondsToDefeat, monsterHitChance, secondsToFallAgainstFour };
}

const entrance = estimateEncounter('plains-entrance', 'plainsRabbit', 1, { evasion: 8, damageReduction: 0 });
const wolfDen = estimateEncounter('wolf-den', 'plainsWolfPup', 3, { evasion: 5, damageReduction: 0 });
const boarWoods = estimateEncounter('boar-woods', 'boarPiglet', 6, { evasion: 3, damageReduction: 2 });

assert.ok(entrance.playerHitChance >= .95, 'test 1: Lv1 reliably hits plains entrance monsters');
assert.ok(entrance.secondsToFallAgainstFour > entrance.secondsToDefeat * 4, 'test 1: Lv1 has a wide survival margin at plains entrance');
assert.ok(wolfDen.playerHitChance < entrance.playerHitChance, 'test 2: Lv1 accuracy is lower in wolf den');
assert.ok(wolfDen.secondsToDefeat > entrance.secondsToDefeat * 1.5, 'test 2: wolf den kill efficiency is clearly lower');
assert.ok(wolfDen.secondsToFallAgainstFour > wolfDen.secondsToDefeat, 'test 2: Lv1 can still fight in wolf den');
assert.ok(boarWoods.playerHitChance <= .70, 'test 3: Lv1 accuracy is inadequate in boar woods');
assert.ok(boarWoods.secondsToFallAgainstFour < boarWoods.secondsToDefeat, 'test 3: Lv1 cannot safely idle in boar woods');
assert.equal(policy.canEnterMap('boar-woods'), true, 'test 3: boar woods entry remains allowed');
assert.ok(policy.getPlayerHitChance(6, 6, 1.05) >= .95, 'test 4: accuracy returns to normal near monster level');
assert.ok(policy.getMonsterHitChance(6, 6, .03) < policy.getMonsterHitChance(6, 1, .03), 'test 4: monster hit advantage shrinks near equal level');

console.log('chapter-one-balance-scenarios: 10 assertions passed');
