(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BlackForestDepthsPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RULES = Object.freeze({
    mapId: 'black-forest-depths',
    denseFogAccuracyPenalty: .15,
    denseFogUnavoidable: true,
    bossAuraModifiers: null
  });

  function applyDenseFogAccuracy(accuracy, mapId) {
    const normalized = Math.max(0, Number(accuracy) || 0);
    return mapId === RULES.mapId ? Math.max(0, normalized - RULES.denseFogAccuracyPenalty) : normalized;
  }

  function getBossAura(enemies) {
    const roster = Array.isArray(enemies) ? enemies : [];
    const bossAlive = roster.some((enemy) => enemy?.isBoss && enemy.currentHp > 0);
    return {
      active: bossAlive,
      affectedEnemyIds: bossAlive ? roster.filter((enemy) => !enemy?.isBoss && enemy?.currentHp > 0).map((enemy) => enemy.id) : [],
      modifiers: bossAlive ? RULES.bossAuraModifiers : null
    };
  }

  return Object.freeze({ RULES, applyDenseFogAccuracy, getBossAura });
});
