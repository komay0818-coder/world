(function attachChapterThreeRecipeDropPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterThreeRecipeDropPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterThreeRecipeDropPolicy() {
  'use strict';

  const BLUE_RECIPE_DROP_RATE = .08;
  const BLUE_CRAFT_GOLD_COST = 18000;

  function recipe(definition) {
    return Object.freeze({
      kind: 'recipe', itemType: 'recipe', icon: '📜', consumable: true, stackable: true,
      consumeOnCraft: true, quantity: 1, chapter: 3, craftingStatus: 'ready',
      quality: 'rare', rarity: 'rare', baseStatsStatus: 'pending', affixContentStatus: 'use-existing-general-pool',
      ...definition
    });
  }

  const RECIPES = Object.freeze({
    redrockRefinedShoulders: recipe({
      id: 'recipe-redrock-refined-shoulders', itemId: 'recipe-redrock-refined-shoulders', recipeId: 'chapter3-redrock-refined-shoulders',
      name: '赤岩精製肩甲配方', equipmentSlot: 'shoulders', resultItemId: 'crafted-redrock-refined-shoulders',
      resultEquipmentId: 'crafted-redrock-refined-shoulders', resultName: '赤岩精製肩甲', baseStats: Object.freeze({}),
      materials: Object.freeze({ 'redrock-ore': 30, 'skullcrusher-iron-scrap': 18 }),
      materialRequirements: Object.freeze({ 'redrock-ore': 30, 'skullcrusher-iron-scrap': 18 }), goldCost: BLUE_CRAFT_GOLD_COST
    }),
    wastelandRefinedWrist: recipe({
      id: 'recipe-wasteland-refined-wrist', itemId: 'recipe-wasteland-refined-wrist', recipeId: 'chapter3-wasteland-refined-wrist',
      name: '荒原精製護腕配方', equipmentSlot: 'wrist', resultItemId: 'crafted-wasteland-refined-wrist',
      resultEquipmentId: 'crafted-wasteland-refined-wrist', resultName: '荒原精製護腕', baseStats: Object.freeze({}),
      materials: Object.freeze({ 'wasteland-thick-hide': 24, 'warpattern-cloth': 18 }),
      materialRequirements: Object.freeze({ 'wasteland-thick-hide': 24, 'warpattern-cloth': 18 }), goldCost: BLUE_CRAFT_GOLD_COST
    }),
    skullcrusherWarpatternCloak: recipe({
      id: 'recipe-skullcrusher-warpattern-cloak', itemId: 'recipe-skullcrusher-warpattern-cloak', recipeId: 'chapter3-skullcrusher-warpattern-cloak',
      name: '碎顱戰紋披風配方', equipmentSlot: 'cloak', resultItemId: 'crafted-skullcrusher-warpattern-cloak',
      resultEquipmentId: 'crafted-skullcrusher-warpattern-cloak', resultName: '碎顱戰紋披風', baseStats: Object.freeze({}),
      materials: Object.freeze({ 'vulture-hard-feather': 20, 'warpattern-cloth': 24 }),
      materialRequirements: Object.freeze({ 'vulture-hard-feather': 20, 'warpattern-cloth': 24 }), goldCost: BLUE_CRAFT_GOLD_COST
    })
  });

  const RARE_DROP_SOURCES = Object.freeze({
    'canyon-warlord': Object.freeze({ mapId: 'brokenrock-canyon', recipeItemId: RECIPES.redrockRefinedShoulders.id, dropRate: BLUE_RECIPE_DROP_RATE }),
    'skullcrusher-centurion': Object.freeze({ mapId: 'bloodwar-wastes', recipeItemId: RECIPES.wastelandRefinedWrist.id, dropRate: BLUE_RECIPE_DROP_RATE }),
    'skullcrusher-heavy-guard': Object.freeze({ mapId: 'skullcrusher-war-camp', recipeItemId: RECIPES.skullcrusherWarpatternCloak.id, dropRate: BLUE_RECIPE_DROP_RATE })
  });
  const RECIPE_BY_ITEM_ID = new Map(Object.values(RECIPES).map((entry) => [entry.id, entry]));
  function clampRoll(value) { return Math.max(0, Math.min(.999999, Number(value) || 0)); }
  function addStackedRecipe(progress, recipeItem, amount = 1) {
    if (!progress || !recipeItem || !RECIPE_BY_ITEM_ID.has(recipeItem.id)) return null;
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    const quantity = Math.max(1, Math.floor(Number(amount) || 1));
    const existing = progress.inventory.find((item) => item?.kind === 'recipe' && item.id === recipeItem.id);
    if (existing) existing.quantity = Math.max(0, Number(existing.quantity) || 0) + quantity;
    else progress.inventory.push({ ...recipeItem, quantity });
    return existing || progress.inventory[progress.inventory.length - 1];
  }
  function rollRecipeDrops(enemy, mapId, random = Math.random) {
    const source = RARE_DROP_SOURCES[enemy?.id];
    if (!source || source.mapId !== mapId || clampRoll(random()) >= source.dropRate) return [];
    const recipeItem = RECIPE_BY_ITEM_ID.get(source.recipeItemId);
    return recipeItem ? [{ ...recipeItem, quantity: 1 }] : [];
  }
  function grantRecipeDrops(progress, enemy, mapId, options = {}) {
    if (!progress || typeof progress !== 'object') return [];
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const results = rollRecipeDrops(enemy, mapId, random);
    results.forEach((item) => addStackedRecipe(progress, item, item.quantity));
    return results;
  }

  return Object.freeze({ BLUE_RECIPE_DROP_RATE, BLUE_CRAFT_GOLD_COST, RECIPES, RARE_DROP_SOURCES, addStackedRecipe, rollRecipeDrops, grantRecipeDrops });
}));
