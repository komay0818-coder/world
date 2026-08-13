(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MagicTowerPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CONFIG = Object.freeze({ pageCost: 10, successChance: .4, rewardAmount: 1 });
  const RECIPES = Object.freeze({
    beginner: Object.freeze({ id: 'beginner', requiredTowerLevel: 1, pageMaterialId: 'beginner_skill_page', bookMaterialId: 'beginner_skill_book' }),
    intermediate: Object.freeze({ id: 'intermediate', requiredTowerLevel: 2, pageMaterialId: 'intermediate_skill_page', bookMaterialId: 'intermediate_skill_book' })
  });

  function getQuantity(inventory, materialId) {
    return (Array.isArray(inventory) ? inventory : [])
      .filter((item) => item?.id === materialId)
      .reduce((total, item) => total + Math.max(0, Number(item.quantity) || 0), 0);
  }

  function getAvailableRecipes(towerLevel = 1) {
    const level = Math.max(1, Math.floor(Number(towerLevel) || 1));
    return Object.values(RECIPES).filter((recipe) => level >= recipe.requiredTowerLevel);
  }

  function canSynthesize(progress, recipeId, towerLevel = 1) {
    const recipe = RECIPES[recipeId];
    if (!recipe) return { ok: false, reason: 'invalid-recipe', recipe: null };
    if (!getAvailableRecipes(towerLevel).includes(recipe)) return { ok: false, reason: 'tower-level', recipe };
    const owned = getQuantity(progress?.inventory, recipe.pageMaterialId);
    return { ok: owned >= CONFIG.pageCost, reason: owned >= CONFIG.pageCost ? '' : 'insufficient-pages', recipe, owned, required: CONFIG.pageCost, missing: Math.max(0, CONFIG.pageCost - owned) };
  }

  function consumeMaterial(inventory, materialId, amount) {
    let remaining = amount;
    for (let index = inventory.length - 1; index >= 0 && remaining > 0; index -= 1) {
      const item = inventory[index];
      if (item?.id !== materialId) continue;
      const quantity = Math.max(0, Number(item.quantity) || 0);
      const consumed = Math.min(quantity, remaining);
      item.quantity = quantity - consumed;
      remaining -= consumed;
      if (item.quantity <= 0) inventory.splice(index, 1);
    }
  }

  function addMaterial(inventory, materialId, amount, materialDefinitions = {}) {
    const definition = materialDefinitions[materialId];
    if (!definition) return false;
    const existing = inventory.find((item) => item?.id === materialId);
    if (existing) existing.quantity = Math.max(0, Number(existing.quantity) || 0) + amount;
    else inventory.push({ ...definition, quantity: amount });
    return true;
  }

  function synthesize(progress, recipeId, towerLevel = 1, options = {}) {
    if (!progress || typeof progress !== 'object') return { ok: false, reason: 'invalid-progress' };
    const validation = canSynthesize(progress, recipeId, towerLevel);
    if (!validation.ok) return validation;
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    consumeMaterial(progress.inventory, validation.recipe.pageMaterialId, CONFIG.pageCost);
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const success = Number(random()) < CONFIG.successChance;
    if (success) addMaterial(progress.inventory, validation.recipe.bookMaterialId, CONFIG.rewardAmount, options.materialDefinitions);
    return { ok: true, success, recipe: validation.recipe, consumed: CONFIG.pageCost, rewarded: success ? CONFIG.rewardAmount : 0 };
  }

  return Object.freeze({ CONFIG, RECIPES, getQuantity, getAvailableRecipes, canSynthesize, synthesize });
});
