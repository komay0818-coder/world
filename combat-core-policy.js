(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CombatCorePolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PLAYER_TICK_ORDER = Object.freeze([
    'enemyRespawns', 'enemyDots', 'environment', 'outpost', 'revive',
    'resources', 'healthRegen', 'partyAttacks', 'companions', 'queueDefeated',
    'syncLegacy', 'render'
  ]);

  function runPlayerTick(runtime, now) {
    if (!runtime?.isFighting()) return false;
    runtime.enemyRespawns(now);
    runtime.enemyDots(now);
    runtime.environment(now);
    if (!runtime.isFighting()) return false;
    runtime.outpost(now);
    runtime.revive(now);
    for (const member of runtime.members()) {
      runtime.resources(member, now);
      runtime.healthRegen(member, now);
    }
    runtime.partyAttacks(now);
    runtime.companions(now);
    runtime.queueDefeated(now);
    runtime.syncLegacy(now);
    runtime.render(now);
    return true;
  }

  function telemetry(member) {
    return member.combatTelemetry || (member.combatTelemetry = {
      totalDamage: 0, damageBySource: {}, skillCasts: {}, basicAttacks: 0,
      dotTicks: 0, resourceSpent: 0, resourceRecovered: 0, kills: 0, respawns: 0
    });
  }

  function recordDamage(member, source, amount) {
    if (!member || !(amount > 0)) return;
    const stats = telemetry(member), key = source || 'other';
    stats.totalDamage += amount;
    stats.damageBySource[key] = (stats.damageBySource[key] || 0) + amount;
  }

  function record(member, key, amount = 1) {
    const stats = telemetry(member);
    stats[key] = (stats[key] || 0) + amount;
  }

  function recordSkillCast(member, skillId) {
    const stats = telemetry(member);
    stats.skillCasts[skillId] = (stats.skillCasts[skillId] || 0) + 1;
  }

  return Object.freeze({ PLAYER_TICK_ORDER, runPlayerTick, telemetry, recordDamage, record, recordSkillCast });
}));
