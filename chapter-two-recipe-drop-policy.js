(function attachChapterTwoRecipeDropPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterTwoRecipeDropPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterTwoRecipeDropPolicy() {
  'use strict';
  const RECIPE_DROP_RATE = .01;
  function recipe(definition) {
    return Object.freeze({
      kind: 'recipe', itemType: 'recipe', icon: '📜', consumable: true, stackable: true,
      consumeOnCraft: true, quantity: 1, chapter: 2, craftingStatus: 'pending-material-requirements',
      materials: null, materialRequirements: null, goldCost: null, ...definition
    });
  }
  const RECIPES = Object.freeze({
    greenCloak: recipe({ id: 'recipe-chapter2-green-cloak', itemId: 'recipe-chapter2-green-cloak', recipeId: 'chapter2-green-cloak', name: '綠色披風製作書', equipmentSlot: 'cloak', quality: 'uncommon', rarity: 'uncommon', resultItemId: 'crafted-chapter2-green-cloak', resultEquipmentId: 'crafted-chapter2-green-cloak', resultName: '第二章綠色披風' }),
    greenWrist: recipe({ id: 'recipe-chapter2-green-wrist', itemId: 'recipe-chapter2-green-wrist', recipeId: 'chapter2-green-wrist', name: '綠色護腕製作書', equipmentSlot: 'wrist', quality: 'uncommon', rarity: 'uncommon', resultItemId: 'crafted-chapter2-green-wrist', resultEquipmentId: 'crafted-chapter2-green-wrist', resultName: '第二章綠色護腕' }),
    greenShoulders: recipe({ id: 'recipe-chapter2-green-shoulders', itemId: 'recipe-chapter2-green-shoulders', recipeId: 'chapter2-green-shoulders', name: '綠色肩甲製作書', equipmentSlot: 'shoulders', quality: 'uncommon', rarity: 'uncommon', resultItemId: 'crafted-chapter2-green-shoulders', resultEquipmentId: 'crafted-chapter2-green-shoulders', resultName: '第二章綠色肩甲' }),
    blackstoneBullhornShoulders: recipe({ id: 'recipe-blackstone-bullhorn-shoulders', itemId: 'recipe-blackstone-bullhorn-shoulders', recipeId: 'chapter2-blackstone-bullhorn-shoulders', name: '黑石牛角肩甲配方', equipmentSlot: 'shoulders', quality: 'rare', rarity: 'rare', resultItemId: 'crafted-blackstone-bullhorn-shoulders', resultEquipmentId: 'crafted-blackstone-bullhorn-shoulders', resultName: '黑石牛角肩甲' }),
    sturdyGuardianWrist: recipe({ id: 'recipe-sturdy-guardian-wrist', itemId: 'recipe-sturdy-guardian-wrist', recipeId: 'chapter2-sturdy-guardian-wrist', name: '堅硬守衛護腕配方', equipmentSlot: 'wrist', quality: 'rare', rarity: 'rare', resultItemId: 'crafted-sturdy-guardian-wrist', resultEquipmentId: 'crafted-sturdy-guardian-wrist', resultName: '堅硬守衛護腕' }),
    corruptedCenturionCloak: recipe({ id: 'recipe-corrupted-centurion-cloak', itemId: 'recipe-corrupted-centurion-cloak', recipeId: 'chapter2-corrupted-centurion-cloak', name: '腐化百夫長披風配方', equipmentSlot: 'cloak', quality: 'rare', rarity: 'rare', resultItemId: 'crafted-corrupted-centurion-cloak', resultEquipmentId: 'crafted-corrupted-centurion-cloak', resultName: '腐化百夫長披風' })
  });
  const RARE_DROP_SOURCES = Object.freeze({
    forestGuardianV2: Object.freeze({ mapId: 'black-forest-entrance', recipeItemId: RECIPES.greenCloak.id, dropRate: RECIPE_DROP_RATE }),
    blackstoneCenturion: Object.freeze({ mapId: 'black-forest-trail', recipeItemId: RECIPES.greenWrist.id, dropRate: RECIPE_DROP_RATE }),
    giantSpider: Object.freeze({ mapId: 'spider-nest', recipeItemId: RECIPES.greenShoulders.id, dropRate: RECIPE_DROP_RATE }),
    blackstoneStrongholdBullhornWarrior: Object.freeze({ mapId: 'blackstone-stronghold', recipeItemId: RECIPES.blackstoneBullhornShoulders.id, dropRate: RECIPE_DROP_RATE }),
    altarGuard: Object.freeze({ mapId: 'forest-altar', recipeItemId: RECIPES.sturdyGuardianWrist.id, dropRate: RECIPE_DROP_RATE }),
    corruptedBlackstoneCenturion: Object.freeze({ mapId: 'black-forest-depths', recipeItemId: RECIPES.corruptedCenturionCloak.id, dropRate: RECIPE_DROP_RATE })
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
  return Object.freeze({ RECIPE_DROP_RATE, RECIPES, RARE_DROP_SOURCES, addStackedRecipe, rollRecipeDrops, grantRecipeDrops });
}));
