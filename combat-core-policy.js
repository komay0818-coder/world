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
      criticalRolls: 0, criticalHits: 0, aoeDamage: 0,
      dotTicks: 0, resourceSpent: 0, resourceRecovered: 0, resourceBlocked: 0,
      damageTaken: 0, shieldAbsorbed: 0,
      resourceBlockedBySkill: {}, petAttacks: 0, petCriticalRolls: 0, petCriticalHits: 0,
      petKills: 0, petGuardTriggers: 0, petGuardAbsorbed: 0, extraShots: 0, extraShotKills: 0, kills: 0, respawns: 0,
      offhandAttacks: 0, offhandCriticalRolls: 0, offhandCriticalHits: 0,
      dotApplications: {}, dotRefreshes: {}, dotTicksByType: {}, maxDotStacks: {},
      basicEvents: [], skillEvents: [], petEvents: [], extraShotEvents: [], offhandEvents: [], dotEvents: [], resourceEvents: [], assassinationEvents: []
    });
  }

  function recordDamage(member, source, amount, details = {}) {
    if (!member || !(amount > 0)) return;
    const stats = telemetry(member), key = source || 'other';
    stats.totalDamage += amount;
    stats.damageBySource[key] = (stats.damageBySource[key] || 0) + amount;
    if (details.aoe) stats.aoeDamage += amount;
  }

  function record(member, key, amount = 1) {
    const stats = telemetry(member);
    stats[key] = (stats[key] || 0) + amount;
  }

  function recordSkillCast(member, skillId, details = null) {
    const stats = telemetry(member);
    stats.skillCasts[skillId] = (stats.skillCasts[skillId] || 0) + 1;
    if (details) stats.skillEvents.push({ skill: skillId, ...details });
  }

  function recordCritical(member, critical) {
    if (!member) return;
    const stats = telemetry(member);
    stats.criticalRolls += 1;
    if (critical) stats.criticalHits += 1;
  }

  function recordResourceBlock(member, skillId, resourceCurrent) {
    if (!member) return false;
    const blocks = member.combatResourceBlockState || (member.combatResourceBlockState = {});
    if (Object.prototype.hasOwnProperty.call(blocks, skillId)) return false;
    blocks[skillId] = { resourceCurrent };
    const stats = telemetry(member);
    stats.resourceBlocked += 1;
    stats.resourceBlockedBySkill[skillId] = (stats.resourceBlockedBySkill[skillId] || 0) + 1;
    return true;
  }

  function clearResourceBlock(member, skillId) {
    if (member?.combatResourceBlockState) delete member.combatResourceBlockState[skillId];
  }

  function recordEvent(member, type, details) {
    if (!member || !Array.isArray(telemetry(member)[type])) return;
    telemetry(member)[type].push(details);
  }

  return Object.freeze({ PLAYER_TICK_ORDER, runPlayerTick, telemetry, recordDamage, record, recordSkillCast, recordCritical, recordResourceBlock, clearResourceBlock, recordEvent });
}));
