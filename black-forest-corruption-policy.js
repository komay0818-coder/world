(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BlackForestCorruptionPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CHAPTER_ID = 'black-forest';
  const MAX_LAYERS = 6;
  const STAT_PENALTY_PER_LAYER = .08;
  const MAX_HP_LOSS_PER_SECOND_PER_LAYER = .01;

  const MAP_MATERIALS = Object.freeze({
    'black-forest-entrance': Object.freeze({ id: 'black-forest-entrance-purifier', name: '入口淨化結晶', mapId: 'black-forest-entrance', chapter: 2, kind: 'chapter-purification-material', dropRate: null, amount: 1 }),
    'black-forest-trail': Object.freeze({ id: 'black-forest-trail-purifier', name: '小徑淨化結晶', mapId: 'black-forest-trail', chapter: 2, kind: 'chapter-purification-material', dropRate: null, amount: 1 }),
    'spider-nest': Object.freeze({ id: 'spider-nest-purifier', name: '蛛巢淨化結晶', mapId: 'spider-nest', chapter: 2, kind: 'chapter-purification-material', dropRate: null, amount: 1 }),
    'blackstone-stronghold': Object.freeze({ id: 'blackstone-stronghold-purifier', name: '據點淨化結晶', mapId: 'blackstone-stronghold', chapter: 2, kind: 'chapter-purification-material', dropRate: null, amount: 1 }),
    'forest-altar': Object.freeze({ id: 'forest-altar-purifier', name: '祭壇淨化結晶', mapId: 'forest-altar', chapter: 2, kind: 'chapter-purification-material', dropRate: null, amount: 1 }),
    'black-forest-depths': Object.freeze({ id: 'black-forest-depths-purifier', name: '深處淨化結晶', mapId: 'black-forest-depths', chapter: 2, kind: 'chapter-purification-material', dropRate: null, amount: 1 })
  });

  function normalizeState(saved) {
    const source = saved && typeof saved === 'object' ? saved : {};
    const purifiedMapIds = [...new Set((Array.isArray(source.purifiedMapIds) ? source.purifiedMapIds : [])
      .filter((mapId) => Object.prototype.hasOwnProperty.call(MAP_MATERIALS, mapId)))].slice(0, MAX_LAYERS);
    return { initialized: Boolean(source.initialized), purifiedMapIds };
  }

  function enterChapter(progress) {
    if (!progress || typeof progress !== 'object') return null;
    progress.blackForestCorruption = normalizeState(progress.blackForestCorruption);
    progress.blackForestCorruption.initialized = true;
    return getEffect(progress.blackForestCorruption);
  }

  function getEffect(state) {
    const normalized = normalizeState(state);
    const level = normalized.initialized ? Math.max(0, MAX_LAYERS - normalized.purifiedMapIds.length) : 0;
    return Object.freeze({
      level,
      attackPenalty: level * STAT_PENALTY_PER_LAYER,
      defensePenalty: level * STAT_PENALTY_PER_LAYER,
      accuracyPenalty: level * STAT_PENALTY_PER_LAYER,
      maxHpLossPerSecond: level * MAX_HP_LOSS_PER_SECOND_PER_LAYER,
      fullyPurified: normalized.initialized && level === 0
    });
  }

  function applyCombatStats(stats, state, active = true) {
    const source = stats && typeof stats === 'object' ? stats : {};
    if (!active) return { ...source };
    const effect = getEffect(state);
    return {
      ...source,
      attack: Math.max(0, (Number(source.attack) || 0) * (1 - effect.attackPenalty)),
      defense: Math.max(0, (Number(source.defense) || 0) * (1 - effect.defensePenalty)),
      accuracy: Math.max(0, (Number(source.accuracy) || 0) - effect.accuracyPenalty)
    };
  }

  function getHpLoss(maxHp, elapsedSeconds, state, active = true) {
    if (!active) return 0;
    const effect = getEffect(state);
    return Math.max(0, Number(maxHp) || 0) * effect.maxHpLossPerSecond * Math.max(0, Number(elapsedSeconds) || 0);
  }

  function getQuantity(inventory, itemId) {
    return (Array.isArray(inventory) ? inventory : []).filter((item) => item?.id === itemId)
      .reduce((total, item) => total + Math.max(0, Number(item.quantity) || 0), 0);
  }

  function consumeOne(inventory, itemId) {
    const index = inventory.findIndex((item) => item?.id === itemId && (Number(item.quantity) || 0) > 0);
    if (index < 0) return false;
    inventory[index].quantity -= 1;
    if (inventory[index].quantity <= 0) inventory.splice(index, 1);
    return true;
  }

  function canPurify(progress, mapId) {
    const material = MAP_MATERIALS[mapId];
    if (!material) return { ok: false, reason: 'unknown-map', material: null };
    const state = normalizeState(progress?.blackForestCorruption);
    if (!state.initialized) return { ok: false, reason: 'not-initialized', material };
    if (state.purifiedMapIds.includes(mapId)) return { ok: false, reason: 'already-purified', material };
    if (getQuantity(progress?.inventory, material.id) < material.amount) return { ok: false, reason: 'material', material };
    return { ok: true, reason: '', material };
  }

  function purify(progress, mapId) {
    const validation = canPurify(progress, mapId);
    if (!validation.ok) return validation;
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    consumeOne(progress.inventory, validation.material.id);
    const state = normalizeState(progress.blackForestCorruption);
    state.purifiedMapIds.push(mapId);
    state.initialized = true;
    progress.blackForestCorruption = state;
    return { ok: true, material: validation.material, effect: getEffect(state) };
  }

  function createMapDrop(mapId, configuredDropRate, random = Math.random) {
    const material = MAP_MATERIALS[mapId];
    const rate = Number(configuredDropRate);
    if (!material || !Number.isFinite(rate) || rate <= 0 || random() >= Math.min(1, rate)) return null;
    return { ...material, quantity: material.amount };
  }

  return Object.freeze({ CHAPTER_ID, MAX_LAYERS, STAT_PENALTY_PER_LAYER, MAX_HP_LOSS_PER_SECOND_PER_LAYER, MAP_MATERIALS, normalizeState, enterChapter, getEffect, applyCombatStats, getHpLoss, canPurify, purify, createMapDrop });
});
