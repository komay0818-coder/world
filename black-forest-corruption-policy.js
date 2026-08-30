(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BlackForestCorruptionPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CHAPTER_ID = 'black-forest';
  const MAX_LAYERS = 6;
  const MATERIAL_COST = 20;
  const GOLD_COST = 1000;
  const SUCCESS_RATE = .10;
  const DROP_RATES = Object.freeze({ normal: .10, elite: .25, boss: 1 });
  const STAT_PENALTY_PER_LAYER = .08;
  const MAX_HP_LOSS_PER_SECOND_PER_LAYER = .01;

  const MAP_MATERIALS = Object.freeze({
    'black-forest-entrance': Object.freeze({ id: 'forest-purification-leaf', name: '森林淨化葉', mapId: 'black-forest-entrance', chapter: 2, kind: 'chapter-purification-material', icon: '🍃', image: 'assets/forest-purification-leaf.png', imageStatus: 'ready' }),
    'black-forest-trail': Object.freeze({ id: 'blackstone-cursebreaker-stone', name: '黑石破咒石', mapId: 'black-forest-trail', chapter: 2, kind: 'chapter-purification-material', icon: '◆', image: 'assets/blackstone-cursebreaker-stone.png', imageStatus: 'ready' }),
    'spider-nest': Object.freeze({ id: 'spider-venom-purification-sac', name: '蛛毒淨化囊', mapId: 'spider-nest', chapter: 2, kind: 'chapter-purification-material', icon: '◉', image: 'assets/spider-venom-purification-sac.png', imageStatus: 'ready' }),
    'blackstone-stronghold': Object.freeze({ id: 'warlord-insignia-fragment', name: '督軍徽記碎片', mapId: 'blackstone-stronghold', chapter: 2, kind: 'chapter-purification-material', icon: '✥', image: 'assets/warlord-insignia-fragment.png', imageStatus: 'ready' }),
    'forest-altar': Object.freeze({ id: 'altar-purification-crystal', name: '祭壇淨化結晶', mapId: 'forest-altar', chapter: 2, kind: 'chapter-purification-material', icon: '◇', image: 'assets/altar-purification-crystal.png', imageStatus: 'ready' }),
    'black-forest-depths': Object.freeze({ id: 'black-forest-heart-fragment', name: '黑森林之心碎片', mapId: 'black-forest-depths', chapter: 2, kind: 'chapter-purification-material', icon: '♥', image: 'assets/black-forest-heart-fragment.png', imageStatus: 'ready' })
  });

  function normalizeState(saved) {
    const source = saved && typeof saved === 'object' ? saved : {};
    const legacyRemoved = Array.isArray(source.purifiedMapIds) ? new Set(source.purifiedMapIds).size : 0;
    const removedLayers = Math.max(0, Math.min(MAX_LAYERS, Number.isFinite(Number(source.removedLayers)) ? Math.floor(Number(source.removedLayers)) : legacyRemoved));
    return { initialized: Boolean(source.initialized), removedLayers };
  }

  function enterChapter(progress) {
    if (!progress || typeof progress !== 'object') return null;
    progress.blackForestCorruption = normalizeState(progress.blackForestCorruption);
    progress.blackForestCorruption.initialized = true;
    return getEffect(progress.blackForestCorruption);
  }

  function getEffect(state) {
    const normalized = normalizeState(state);
    const level = normalized.initialized ? Math.max(0, MAX_LAYERS - normalized.removedLayers) : 0;
    return Object.freeze({ level, attackPenalty: level * STAT_PENALTY_PER_LAYER, defensePenalty: level * STAT_PENALTY_PER_LAYER, accuracyPenalty: level * STAT_PENALTY_PER_LAYER, maxHpLossPerSecond: level * MAX_HP_LOSS_PER_SECOND_PER_LAYER, fullyPurified: normalized.initialized && level === 0 });
  }

  function applyCombatStats(stats, state, active = true) {
    const source = stats && typeof stats === 'object' ? stats : {};
    if (!active) return { ...source };
    const effect = getEffect(state);
    return { ...source, attack: Math.max(0, (Number(source.attack) || 0) * (1 - effect.attackPenalty)), defense: Math.max(0, (Number(source.defense) || 0) * (1 - effect.defensePenalty)), accuracy: Math.max(0, (Number(source.accuracy) || 0) - effect.accuracyPenalty) };
  }

  function getHpLoss(maxHp, elapsedSeconds, state, active = true) {
    if (!active) return 0;
    return Math.max(0, Number(maxHp) || 0) * getEffect(state).maxHpLossPerSecond * Math.max(0, Number(elapsedSeconds) || 0);
  }

  function getQuantity(inventory, itemId) {
    return (Array.isArray(inventory) ? inventory : []).filter((item) => item?.id === itemId).reduce((total, item) => total + Math.max(0, Number(item.quantity) || 0), 0);
  }

  function consume(inventory, itemId, amount) {
    let remaining = amount;
    for (let index = inventory.length - 1; index >= 0 && remaining > 0; index -= 1) {
      const item = inventory[index];
      if (item?.id !== itemId) continue;
      const used = Math.min(remaining, Math.max(0, Number(item.quantity) || 0));
      item.quantity -= used;
      remaining -= used;
      if (item.quantity <= 0) inventory.splice(index, 1);
    }
    return remaining === 0;
  }

  function canPurify(progress, mapId) {
    const material = MAP_MATERIALS[mapId];
    if (!material) return { ok: false, reason: 'unknown-map', material: null };
    const state = normalizeState(progress?.blackForestCorruption);
    if (!state.initialized) return { ok: false, reason: 'not-initialized', material };
    if (getEffect(state).level <= 0) return { ok: false, reason: 'fully-purified', material };
    if (getQuantity(progress?.inventory, material.id) < MATERIAL_COST) return { ok: false, reason: 'material', material };
    if ((Number(progress?.gold) || 0) < GOLD_COST) return { ok: false, reason: 'gold', material };
    return { ok: true, reason: '', material };
  }

  function purify(progress, mapId, options = {}) {
    const validation = canPurify(progress, mapId);
    if (!validation.ok) return validation;
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    consume(progress.inventory, validation.material.id, MATERIAL_COST);
    progress.gold = Math.max(0, (Number(progress.gold) || 0) - GOLD_COST);
    const state = normalizeState(progress.blackForestCorruption);
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const success = random() < SUCCESS_RATE;
    if (success) state.removedLayers = Math.min(MAX_LAYERS, state.removedLayers + 1);
    state.initialized = true;
    progress.blackForestCorruption = state;
    return { ok: true, success, material: validation.material, materialCost: MATERIAL_COST, goldCost: GOLD_COST, effect: getEffect(state) };
  }

  function getRank(enemy) { return enemy?.isBoss ? 'boss' : enemy?.isElite ? 'elite' : 'normal'; }

  function createMapDrop(mapId, enemyOrRate, random = Math.random) {
    const material = MAP_MATERIALS[mapId];
    const rate = typeof enemyOrRate === 'number' ? enemyOrRate : DROP_RATES[getRank(enemyOrRate)];
    if (!material || random() >= rate) return null;
    return { ...material, category: 'material', typeLabel: 'Debuff 解除道具', quantity: 1 };
  }

  function grantMapDrop(progress, mapId, enemy, options = {}) {
    const drop = createMapDrop(mapId, enemy, typeof options.random === 'function' ? options.random : Math.random);
    if (!drop) return null;
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    const existing = progress.inventory.find((item) => item?.id === drop.id);
    if (existing) existing.quantity = Math.max(0, Number(existing.quantity) || 0) + 1;
    else progress.inventory.push({ ...drop });
    return drop;
  }

  return Object.freeze({ CHAPTER_ID, MAX_LAYERS, MATERIAL_COST, GOLD_COST, SUCCESS_RATE, DROP_RATES, STAT_PENALTY_PER_LAYER, MAX_HP_LOSS_PER_SECOND_PER_LAYER, MAP_MATERIALS, normalizeState, enterChapter, getEffect, applyCombatStats, getHpLoss, getQuantity, canPurify, purify, createMapDrop, grantMapDrop });
});
