(function (root, factory) {
  const defense = typeof module === 'object' && module.exports ? require('./monster-defense.js') : root.MonsterDefense;
  const api = factory(defense);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OfflineCombatPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MonsterDefense) {
  'use strict';

  function attacksPerSecond(combatant = {}) {
    const speed = Number(combatant.attackSpeed);
    if (speed > 0) return speed;
    const interval = Number(combatant.attackInterval);
    return interval > 0 ? 1000 / interval : 1;
  }

  function getPlayerDamage(player, monster) {
    return MonsterDefense.resolveDamage({
      baseDamage: player.attack,
      monster,
      damageType: player.damageType || 'physical',
      attackRange: player.attackRange || 'melee',
      canEvade: false,
      canParry: false
    }).finalDamage;
  }

  function getMonsterDamage(player, monster) {
    return MonsterDefense.resolvePlayerDamage({
      baseDamage: monster.attack,
      defense: player.defense,
      damageReduction: player.damageReduction
    }).finalDamage;
  }

  function simulate({ durationMs = 0, player = {}, monsters = [] } = {}) {
    const durationSeconds = Math.max(0, Number(durationMs) || 0) / 1000;
    const roster = monsters.filter((monster) => Number(monster?.maxHp) > 0 && Number(monster?.attack) >= 0);
    let hp = Math.max(0, Math.min(Number(player.maxHp) || 0, Number(player.currentHp ?? player.maxHp) || 0));
    let elapsedSeconds = 0;
    let defeated = 0;
    let deaths = 0;
    if (!durationSeconds || !roster.length || hp <= 0) {
      return { died: hp <= 0, defeated: 0, effectiveMs: 0, deathAtMs: hp <= 0 ? 0 : null, remainingHp: hp };
    }

    while (elapsedSeconds < durationSeconds) {
      const monster = roster[defeated % roster.length];
      const playerDamage = Math.max(1, getPlayerDamage(player, monster));
      const playerSpeed = attacksPerSecond(player);
      const hitsToKill = Math.max(1, Math.ceil(monster.maxHp / playerDamage));
      const killSeconds = hitsToKill / playerSpeed;
      const remainingSeconds = durationSeconds - elapsedSeconds;
      const encounterSeconds = Math.min(killSeconds, remainingSeconds);
      const monsterSpeed = attacksPerSecond(monster);
      const monsterDamage = Math.max(0, getMonsterDamage(player, monster));
      const attacksBeforeEnd = monsterDamage > 0 ? Math.floor(encounterSeconds * monsterSpeed + 1e-9) : 0;
      const attacksToDefeatPlayer = monsterDamage > 0 ? Math.ceil(hp / monsterDamage) : Infinity;
      const deathSeconds = attacksToDefeatPlayer / monsterSpeed;

      if (deathSeconds <= encounterSeconds) {
        elapsedSeconds += deathSeconds;
        hp = 0;
        deaths += 1;
        hp = Math.max(1, Number(player.maxHp) || 1);
        continue;
      }

      hp = Math.max(0, hp - attacksBeforeEnd * monsterDamage);
      elapsedSeconds += encounterSeconds;
      if (killSeconds <= remainingSeconds + 1e-9) defeated += 1;
      else break;
    }

    return { died: false, deaths, defeated, effectiveMs: Math.round(durationSeconds * 1000), deathAtMs: null, remainingHp: hp };
  }

  return Object.freeze({ attacksPerSecond, getPlayerDamage, getMonsterDamage, simulate });
});
