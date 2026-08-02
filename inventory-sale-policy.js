(function attachInventorySalePolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.InventorySalePolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createInventorySalePolicy() {
  const QUALITY_SELL_PRICES = Object.freeze({ common: 10, uncommon: 25, rare: 60, epic: 150 });

  function normalizeQuality(item) {
    const value = String(item?.rarity || item?.quality || '').toLowerCase();
    if (value === 'epic' || value === '紫色') return 'epic';
    if (value === 'rare' || value === '藍色' || value === '稀有') return 'rare';
    if (value === 'uncommon' || value === '綠色' || value === '優良') return 'uncommon';
    return 'common';
  }

  function getJunkReasons(item, context = {}) {
    if (!item || item.kind !== 'equipment') return [];
    const reasons = [];
    if (item.durability !== undefined && Number(item.durability) <= 0) reasons.push('damaged');
    if ((Number(item.requiredLevel) || 0) > (Number(context.level) || 1)) reasons.push('level');
    if (context.canEquip === false) reasons.push('job');
    if (item.isJunk === true) reasons.push('marked');
    return reasons;
  }

  function isJunkCandidate(item, context = {}) { return getJunkReasons(item, context).length > 0; }

  function getSellPrice(item) {
    if (!item || item.kind !== 'equipment') return 0;
    const base = QUALITY_SELL_PRICES[normalizeQuality(item)] || QUALITY_SELL_PRICES.common;
    return Math.max(1, base);
  }

  function summarizeSelection(inventory, selectedIds, contextFactory = () => ({})) {
    const selected = (Array.isArray(inventory) ? inventory : []).filter((item) => item?.kind === 'equipment' && selectedIds?.has(item.id));
    return {
      count: selected.length,
      gold: selected.reduce((total, item) => total + getSellPrice(item), 0),
      containsJunkCandidate: selected.some((item) => isJunkCandidate(item, contextFactory(item))),
      items: selected
    };
  }

  function sellSelection(progress, selectedIds) {
    if (!progress || !Array.isArray(progress.inventory)) return { ok: false, count: 0, gold: 0 };
    const summary = summarizeSelection(progress.inventory, selectedIds);
    if (!summary.count) return { ok: false, ...summary };
    const soldIds = new Set(summary.items.map((item) => item.id));
    progress.inventory = progress.inventory.filter((item) => !soldIds.has(item.id));
    progress.gold = Math.max(0, Number(progress.gold) || 0) + summary.gold;
    return { ok: true, ...summary };
  }

  return Object.freeze({ QUALITY_SELL_PRICES, normalizeQuality, getJunkReasons, isJunkCandidate, getSellPrice, summarizeSelection, sellSelection });
}));
