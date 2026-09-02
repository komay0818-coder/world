(function attachChapterThreeWeaponRecipeFragmentPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterThreeWeaponRecipeFragmentPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterThreeWeaponRecipeFragmentPolicy() {
  'use strict';

  const ARMORY_FRAGMENT_DROP_RATE = .05;
  const FRAGMENTS_PER_RECIPE = 7;
  const INVENTORY_CAPACITY = 1000;
  const FRAGMENT = Object.freeze({
    id: 'epic-weapon-recipe-fragment', kind: 'recipe-fragment', itemType: 'weapon-recipe-fragment', chapter: 3,
    name: '紫色武器配方殘頁', icon: '📜', quality: 'epic', rarity: 'epic', quantity: 1,
    stackable: true, consumable: true, isCompleteRecipe: false, materialType: null, weaponCore: false
  });
  const FORGING_RECIPE = Object.freeze({
    id: 'epic-weapon-forging-recipe', itemId: 'epic-weapon-forging-recipe', kind: 'recipe', itemType: 'weapon-forging-recipe', chapter: 3,
    name: '紫色武器鍛造配方', icon: '📜', quality: 'epic', rarity: 'epic', quantity: 1,
    stackable: true, consumable: true, consumeOnCraft: true, permanentUnlock: false, craftingStatus: 'weapon-formulas-pending'
  });

  function getQuantity(inventory, itemId) {
    return (Array.isArray(inventory) ? inventory : []).filter((item) => item?.id === itemId)
      .reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
  }
  function addStackedItem(progress, definition, amount = 1) {
    if (!progress || !definition) return null;
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    const quantity = Math.max(1, Math.floor(Number(amount) || 1));
    const existing = progress.inventory.find((item) => item?.id === definition.id && item?.kind === definition.kind);
    if (existing) existing.quantity = Math.max(0, Number(existing.quantity) || 0) + quantity;
    else progress.inventory.push({ ...definition, quantity });
    return existing || progress.inventory[progress.inventory.length - 1];
  }
  function rollArmoryFragmentDrop(facilityId, random = Math.random) {
    if (facilityId !== 'armory') return [];
    const roll = Math.max(0, Math.min(.999999, Number(random()) || 0));
    return roll < ARMORY_FRAGMENT_DROP_RATE ? [{ ...FRAGMENT, quantity: 1 }] : [];
  }
  function grantArmoryFragmentDrop(progress, facilityId, options = {}) {
    if (!progress || typeof progress !== 'object') return [];
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const drops = rollArmoryFragmentDrop(facilityId, random);
    drops.forEach((item) => addStackedItem(progress, item, item.quantity));
    return drops;
  }
  function deductItems(inventory, itemId, amount) {
    let remaining = amount;
    return inventory.map((item) => {
      if (item?.id !== itemId || remaining <= 0) return { ...item };
      const used = Math.min(remaining, Math.max(0, Number(item.quantity) || 0));
      remaining -= used;
      return { ...item, quantity: Math.max(0, Number(item.quantity) || 0) - used };
    }).filter((item) => item.kind === 'equipment' || (Number(item.quantity) || 0) > 0);
  }
  function canAssemble(progress, options = {}) {
    if (!progress || typeof progress !== 'object') return { ok: false, code: 'invalid-progress', reason: '無法讀取背包。' };
    const owned = getQuantity(progress.inventory, FRAGMENT.id);
    if (owned < FRAGMENTS_PER_RECIPE) return { ok: false, code: 'insufficient-fragments', owned, required: FRAGMENTS_PER_RECIPE, reason: `需要 ${FRAGMENTS_PER_RECIPE} 張紫色武器配方殘頁。` };
    const itemFactory = typeof options.itemFactory === 'function' ? options.itemFactory : () => ({ ...FORGING_RECIPE, quantity: 1 });
    const item = itemFactory(FORGING_RECIPE);
    if (!item?.id || item.id !== FORGING_RECIPE.id) return { ok: false, code: 'generation-failed', reason: '鍛造配方生成失敗。' };
    const projected = deductItems(Array.isArray(progress.inventory) ? progress.inventory : [], FRAGMENT.id, FRAGMENTS_PER_RECIPE);
    if (!projected.some((entry) => entry.id === FORGING_RECIPE.id && entry.kind === FORGING_RECIPE.kind)) projected.push(item);
    if (projected.length > Math.max(1, Number(options.inventoryCapacity) || INVENTORY_CAPACITY)) return { ok: false, code: 'inventory-full', reason: '背包空間不足。' };
    return { ok: true, owned, required: FRAGMENTS_PER_RECIPE, item };
  }
  function assembleForgingRecipe(progress, options = {}) {
    const validation = canAssemble(progress, options);
    if (!validation.ok) return validation;
    const nextInventory = deductItems(progress.inventory, FRAGMENT.id, FRAGMENTS_PER_RECIPE);
    const existing = nextInventory.find((item) => item.id === FORGING_RECIPE.id && item.kind === FORGING_RECIPE.kind);
    if (existing) existing.quantity = Math.max(0, Number(existing.quantity) || 0) + 1;
    else nextInventory.push({ ...validation.item, quantity: 1 });
    progress.inventory = nextInventory;
    return { ok: true, consumed: FRAGMENTS_PER_RECIPE, item: existing || nextInventory[nextInventory.length - 1] };
  }

  return Object.freeze({ ARMORY_FRAGMENT_DROP_RATE, FRAGMENTS_PER_RECIPE, INVENTORY_CAPACITY, FRAGMENT, FORGING_RECIPE, getQuantity, addStackedItem, rollArmoryFragmentDrop, grantArmoryFragmentDrop, canAssemble, assembleForgingRecipe });
}));
