(function attachSalvagePolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SalvagePolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createSalvagePolicy() {
  const MATERIALS = Object.freeze({
    green_essence_stone: Object.freeze({ id: 'green_essence_stone', kind: 'material', materialType: 'crafting', quality: 'uncommon', stackable: true, icon: '🟢', name: '綠色精華石', description: '由綠色裝備分解後取得，可用於工坊製作裝備。' }),
    blue_essence_stone: Object.freeze({ id: 'blue_essence_stone', kind: 'material', materialType: 'crafting', quality: 'rare', stackable: true, icon: '🔵', name: '藍色精華石', description: '由藍色裝備分解後取得，可用於工坊製作高品質裝備。' }),
    purple_essence_stone: Object.freeze({ id: 'purple_essence_stone', kind: 'material', materialType: 'crafting', quality: 'epic', stackable: true, icon: '🟣', name: '紫色精華石', description: '保留給未來紫色裝備分解與製作。' })
  });
  const FURNACE_CONFIG = Object.freeze({
    green: Object.freeze({ quality: 'uncommon', materialId: 'green_essence_stone', baseChance: .40, chanceCap: .80, amount: 1 }),
    blue: Object.freeze({ quality: 'rare', materialId: 'blue_essence_stone', baseChance: .25, chanceCap: .65, amount: 1 }),
    chanceBonusPerLevel: .05
  });
  const LEGACY_ESSENCE_IDS = Object.freeze({
    'equipment-stone-uncommon': 'green_essence_stone',
    'equipment-stone-rare': 'blue_essence_stone',
    'equipment-stone-epic': 'purple_essence_stone'
  });

  function getItemId(item) { return String(item?.instanceId || item?.id || ''); }
  function normalizeQuality(itemOrQuality) {
    const value = String(typeof itemOrQuality === 'object' ? itemOrQuality?.rarity || itemOrQuality?.quality || '' : itemOrQuality || '').toLowerCase();
    if (['uncommon', 'green', '綠色', '優良'].includes(value)) return 'uncommon';
    if (['rare', 'blue', '藍色', '稀有'].includes(value)) return 'rare';
    if (['epic', 'purple', '紫色'].includes(value)) return 'epic';
    return 'common';
  }
  function getRule(item) { return Object.values(FURNACE_CONFIG).find((entry) => entry?.quality === normalizeQuality(item)) || null; }
  function getMaterial(materialId) { return MATERIALS[materialId] || null; }
  function isProtected(item) { return Boolean(item?.locked || item?.isLocked || item?.protected || item?.isProtected || item?.favorite || item?.isFavorite); }
  function isEquipped(item, equipment) {
    const id = getItemId(item);
    return Object.values(equipment || {}).some((entry) => entry === item || (id && getItemId(entry) === id));
  }
  function getChance(itemOrQuality, furnaceLevel = 1) {
    const rule = getRule(typeof itemOrQuality === 'object' ? itemOrQuality : { quality: itemOrQuality });
    if (!rule) return 0;
    const level = Math.max(1, Math.floor(Number(furnaceLevel) || 1));
    return Math.min(rule.chanceCap, rule.baseChance + (level - 1) * FURNACE_CONFIG.chanceBonusPerLevel);
  }
  function validate(progress, itemId) {
    if (!progress || !Array.isArray(progress.inventory)) return { ok: false, code: 'invalid-progress', reason: '背包資料異常，無法分解。' };
    const id = String(itemId || '');
    if (!id) return { ok: false, code: 'missing-id', reason: '裝備缺少唯一識別碼，無法分解。' };
    const matches = progress.inventory.filter((item) => item?.kind === 'equipment' && getItemId(item) === id);
    if (matches.length !== 1) return { ok: false, code: matches.length ? 'ambiguous-id' : 'missing-item', reason: '裝備已不存在或識別資料異常，請重新選擇。' };
    const item = matches[0];
    if (isEquipped(item, progress.equipment)) return { ok: false, code: 'equipped', reason: '已穿戴的裝備不可分解。' };
    if (isProtected(item)) return { ok: false, code: 'protected', reason: '已鎖定或受保護的裝備不可分解。' };
    const rule = getRule(item);
    if (!rule) return { ok: false, code: 'unsupported-quality', reason: '目前只能分解綠色或藍色裝備。' };
    return { ok: true, item, itemId: id, rule };
  }
  function getEligibleEquipment(progress) {
    return (Array.isArray(progress?.inventory) ? progress.inventory : []).filter((item) => item?.kind === 'equipment' && getItemId(item) && getRule(item) && !isProtected(item) && !isEquipped(item, progress?.equipment) && progress.inventory.filter((entry) => entry?.kind === 'equipment' && getItemId(entry) === getItemId(item)).length === 1);
  }
  function addMaterialStack(inventory, materialId, amount) {
    const material = getMaterial(materialId);
    if (!material || amount <= 0) return inventory.map((item) => ({ ...item }));
    const next = inventory.map((item) => ({ ...item }));
    const stack = next.find((item) => item?.id === materialId && item.kind !== 'equipment');
    if (stack) Object.assign(stack, material, { quantity: Math.max(0, Number(stack.quantity) || 0) + amount });
    else next.push({ ...material, quantity: amount });
    return next;
  }
  function normalizeInventory(inventory) {
    const normalized = [];
    (Array.isArray(inventory) ? inventory : []).forEach((item) => {
      const canonicalId = LEGACY_ESSENCE_IDS[item?.id] || item?.id;
      const material = getMaterial(canonicalId);
      if (!material) { normalized.push(item); return; }
      const quantity = Math.max(0, Number(item.quantity) || 0);
      const existing = normalized.find((entry) => entry?.id === canonicalId && entry?.kind === 'material');
      if (existing) existing.quantity += quantity;
      else normalized.push({ ...item, ...material, id: canonicalId, quantity });
    });
    return normalized;
  }
  function getMaterialQuantity(inventory, materialId) {
    return (Array.isArray(inventory) ? inventory : []).filter((item) => item?.id === materialId && item.kind !== 'equipment').reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
  }
  function salvage(progress, itemId, options = {}) {
    const validation = validate(progress, itemId);
    if (!validation.ok) return validation;
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const chance = getChance(validation.item, options.furnaceLevel);
    const roll = Math.min(.999999, Math.max(0, Number(random()) || 0));
    const success = roll < chance;
    let nextInventory = progress.inventory.filter((item) => item !== validation.item);
    if (success) nextInventory = addMaterialStack(nextInventory, validation.rule.materialId, validation.rule.amount);
    progress.inventory = nextInventory;
    return { ok: true, item: validation.item, consumedId: validation.itemId, success, chance, roll, material: getMaterial(validation.rule.materialId), amount: success ? validation.rule.amount : 0 };
  }

  return Object.freeze({ MATERIALS, FURNACE_CONFIG, LEGACY_ESSENCE_IDS, getItemId, normalizeQuality, getRule, getMaterial, isProtected, isEquipped, getChance, validate, getEligibleEquipment, addMaterialStack, normalizeInventory, getMaterialQuantity, salvage });
}));
