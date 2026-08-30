(function attachChapterTwoRuneDropPolicy(root, factory) {
  const RunePolicy = typeof module === 'object' && module.exports ? require('./rune-policy.js') : root.RunePolicy;
  const api = factory(RunePolicy);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterTwoRuneDropPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterTwoRuneDropPolicy(RunePolicy) {
  'use strict';

  const MAP_DROP_CONFIGS = Object.freeze({
    'black-forest-entrance': Object.freeze({ runeId: 'rune-life', normalRate: .008 }),
    'black-forest-trail': Object.freeze({ runeId: 'rune-strength', normalRate: .008 }),
    'spider-nest': Object.freeze({ runeId: 'rune-fatal', normalRate: .005 }),
    'blackstone-stronghold': Object.freeze({ runeId: 'rune-guard', normalRate: .006 }),
    'forest-altar': Object.freeze({ runeId: 'rune-psionic', normalRate: .005 })
  });
  const RANK_RATES = Object.freeze({ elite: .02, boss: .08 });

  function getRank(enemy = {}) { return enemy.isBoss ? 'boss' : enemy.isElite ? 'elite' : 'normal'; }
  function getDropConfig(mapId, enemy = {}) {
    const map = MAP_DROP_CONFIGS[mapId];
    if (!map) return null;
    const rank = getRank(enemy);
    return Object.freeze({ runeId: map.runeId, rank, dropRate: rank === 'normal' ? map.normalRate : RANK_RATES[rank] });
  }
  function getRune(runeId) { return [...RunePolicy.RUNE_BY_ID.values()].find((rune) => rune.id === runeId) || null; }
  function rollDrop(mapId, enemy = {}, random = Math.random) {
    const config = getDropConfig(mapId, enemy);
    if (!config || Math.max(0, Math.min(.999999, Number(random()) || 0)) >= config.dropRate) return null;
    const rune = getRune(config.runeId);
    return rune ? { ...rune, quantity: 1, sourceMapId: mapId, sourceMonsterId: enemy.id, sourceRank: config.rank } : null;
  }
  function addStackedRune(progress, rune) {
    if (!progress || !rune || !RunePolicy.RUNE_BY_ID.has(rune.id)) return null;
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    const existing = progress.inventory.find((item) => item?.id === rune.id);
    if (existing) existing.quantity = Math.max(0, Number(existing.quantity) || 0) + 1;
    else progress.inventory.push({ ...rune, quantity: 1 });
    return existing || progress.inventory[progress.inventory.length - 1];
  }
  function grantRuneDrop(progress, mapId, enemy = {}, options = {}) {
    if (!progress || typeof progress !== 'object') return null;
    const drop = rollDrop(mapId, enemy, typeof options.random === 'function' ? options.random : Math.random);
    if (drop) addStackedRune(progress, drop);
    return drop;
  }

  return Object.freeze({ MAP_DROP_CONFIGS, RANK_RATES, getRank, getDropConfig, rollDrop, addStackedRune, grantRuneDrop });
}));
