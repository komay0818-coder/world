(function attachSalvagePolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SalvagePolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createSalvagePolicy() {
  const REWARDS = Object.freeze({
    common: Object.freeze({ id: 'iron-ore', quantity: 1 }),
    uncommon: Object.freeze({ id: 'equipment-stone-uncommon', quantity: 1 }),
    rare: Object.freeze({ id: 'equipment-stone-rare', quantity: 1 }),
    epic: Object.freeze({ id: 'equipment-stone-epic', quantity: 1 })
  });

  function getItemId(item) { return String(item?.instanceId || item?.id || ''); }
  function normalizeQuality(item) {
    const quality = String(item?.rarity || item?.quality || 'common').toLowerCase();
    return REWARDS[quality] ? quality : 'common';
  }
  function getReward(item) { return item?.kind === 'equipment' ? { ...REWARDS[normalizeQuality(item)] } : null; }
  function addStack(inventory, reward) {
    const next = inventory.map((item) => ({ ...item }));
    const stack = next.find((item) => item?.id === reward.id && item.kind !== 'equipment');
    if (stack) stack.quantity = Math.max(0, Number(stack.quantity) || 0) + reward.quantity;
    else next.push({ id: reward.id, kind: 'material', quantity: reward.quantity });
    return next;
  }
  function salvage(progress, itemId) {
    if (!progress || !Array.isArray(progress.inventory)) return { ok: false, code: 'invalid-progress' };
    const index = progress.inventory.findIndex((item) => item?.kind === 'equipment' && getItemId(item) === itemId);
    if (index < 0) return { ok: false, code: 'missing-item' };
    const item = progress.inventory[index];
    const reward = getReward(item);
    const remaining = progress.inventory.filter((_, itemIndex) => itemIndex !== index);
    progress.inventory = addStack(remaining, reward);
    return { ok: true, item, reward };
  }
  return Object.freeze({ REWARDS, getItemId, normalizeQuality, getReward, salvage });
}));
