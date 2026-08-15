(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SkillUpgradePolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SKILL_BOOK_RANKS = Object.freeze({
    beginner: Object.freeze({ id: 'beginner_skill_book', rank: '初階', image: 'assets/skill-book-beginner.png?v=20260815-user-image-v1', imageStatus: 'ready', implemented: true }),
    intermediate: Object.freeze({ id: 'intermediate_skill_book', rank: '中階', image: 'assets/skill-book-intermediate.png?v=20260815-user-image-v1', imageStatus: 'ready', implemented: true }),
    advanced: Object.freeze({ id: 'advanced_skill_book', rank: '高階', image: 'assets/skill-book-advanced.png?v=20260815-user-image-v1', imageStatus: 'ready', implemented: true }),
    specialization: Object.freeze({ id: 'specialization_skill_book', rank: '專精', image: 'assets/skill-book-specialization.png?v=20260815-user-image-v1', imageStatus: 'ready', implemented: false }),
    master: Object.freeze({ id: 'master_skill_book', rank: '大師', image: 'assets/skill-book-master.png?v=20260815-user-image-v1', imageStatus: 'ready', implemented: false }),
    grandmaster: Object.freeze({ id: 'grandmaster_skill_book', rank: '宗師', image: 'assets/skill-book-grandmaster.png?v=20260815-user-image-v1', imageStatus: 'ready', implemented: false }),
    legacy: Object.freeze({ id: 'legacy_skill_book', rank: '傳承', image: 'assets/skill-book-legacy.png?v=20260815-user-image-v1', imageStatus: 'ready', implemented: false })
  });

  const MATERIALS = Object.freeze({
    beginner_skill_page: Object.freeze({ id: 'beginner_skill_page', kind: 'material', icon: '📜', name: '初級技能殘頁', chapter: 1, materialType: 'page', stackable: true }),
    beginner_skill_book: Object.freeze({ ...SKILL_BOOK_RANKS.beginner, kind: 'material', icon: '📕', name: '初級技能書', chapter: 1, materialType: 'book', stackable: true }),
    intermediate_skill_page: Object.freeze({ id: 'intermediate_skill_page', kind: 'material', icon: '📜', name: '中級技能殘頁', chapter: 2, materialType: 'page', stackable: true }),
    intermediate_skill_book: Object.freeze({ ...SKILL_BOOK_RANKS.intermediate, kind: 'material', icon: '📘', name: '中級技能書', chapter: 2, materialType: 'book', stackable: true }),
    advanced_skill_page: Object.freeze({ id: 'advanced_skill_page', kind: 'material', icon: '📜', name: '高級技能殘頁', chapter: 3, materialType: 'page', stackable: true }),
    advanced_skill_book: Object.freeze({ ...SKILL_BOOK_RANKS.advanced, kind: 'material', icon: '📙', name: '高級技能書', chapter: 3, materialType: 'book', stackable: true })
  });

  const CHAPTERS = Object.freeze([
    Object.freeze({ chapter: 1, minSkillLevel: 1, maxSkillLevel: 4, pageMaterialId: 'beginner_skill_page', bookMaterialId: 'beginner_skill_book' }),
    Object.freeze({ chapter: 2, minSkillLevel: 4, maxSkillLevel: 5, pageMaterialId: 'intermediate_skill_page', bookMaterialId: 'intermediate_skill_book' }),
    Object.freeze({ chapter: 3, minSkillLevel: 5, maxSkillLevel: 6, pageMaterialId: 'advanced_skill_page', bookMaterialId: 'advanced_skill_book' })
  ]);

  const TARGET_LEVEL_COSTS = Object.freeze({
    2: Object.freeze({ pages: 5, books: 2, gold: 2000, successRate: .85 }),
    3: Object.freeze({ pages: 10, books: 4, gold: 5000, successRate: .70 }),
    4: Object.freeze({ pages: 15, books: 6, gold: 10000, successRate: .55 }),
    5: Object.freeze({ pages: 25, books: 8, gold: 20000, successRate: .40 }),
    6: Object.freeze({ pages: 40, books: 10, gold: 40000, successRate: .35 })
  });

  const DROP_CONFIG = Object.freeze({
    1: Object.freeze({
      materials: Object.freeze([
        Object.freeze({ materialId: 'beginner_skill_page', chance: .08, amount: 1 }),
        Object.freeze({ materialId: 'beginner_skill_book', chance: .02, amount: 1, bossOnly: true })
      ])
    }),
    2: Object.freeze({
      materials: Object.freeze([
        Object.freeze({ materialId: 'intermediate_skill_page', chance: .08, amount: 1 }),
        Object.freeze({ materialId: 'intermediate_skill_book', chance: .02, amount: 1, bossOnly: true })
      ])
    }),
    3: Object.freeze({
      materials: Object.freeze([
        Object.freeze({ materialId: 'advanced_skill_page', chance: .08, amount: 1 }),
        Object.freeze({ materialId: 'advanced_skill_book', chance: .02, amount: 1, bossOnly: true })
      ])
    })
  });

  const MAX_SKILL_LEVEL = Math.max(...CHAPTERS.map((entry) => entry.maxSkillLevel));

  function getChapterForUpgrade(currentLevel) {
    const level = Math.max(1, Number(currentLevel) || 1);
    return CHAPTERS.find((entry) => level >= entry.minSkillLevel && level < entry.maxSkillLevel) || null;
  }

  function getUpgradeRequirement(currentLevel) {
    const chapter = getChapterForUpgrade(currentLevel);
    const targetLevel = Math.max(1, Number(currentLevel) || 1) + 1;
    const cost = TARGET_LEVEL_COSTS[targetLevel];
    if (!chapter || !cost) return null;
    return {
      chapter: chapter.chapter,
      currentLevel: targetLevel - 1,
      targetLevel,
      successRate: cost.successRate,
      gold: cost.gold,
      materials: [
        { ...MATERIALS[chapter.pageMaterialId], amount: cost.pages },
        { ...MATERIALS[chapter.bookMaterialId], amount: cost.books }
      ]
    };
  }

  function getQuantity(inventory, materialId) {
    return (Array.isArray(inventory) ? inventory : [])
      .filter((item) => item?.id === materialId)
      .reduce((total, item) => total + Math.max(0, Number(item.quantity) || 0), 0);
  }

  function normalizeMaterialInventory(inventory) {
    return (Array.isArray(inventory) ? inventory : []).map((item) => {
      const material = MATERIALS[item?.id];
      return material ? { ...item, ...material, quantity: Math.max(0, Number(item.quantity) || 0) } : item;
    });
  }

  function canUpgrade(progress, currentLevel) {
    const requirement = getUpgradeRequirement(currentLevel);
    if (!requirement) return { ok: false, reason: 'max-level', requirement: null };
    if ((Number(progress?.unlockedChapter) || 1) < requirement.chapter) return { ok: false, reason: 'chapter-locked', requirement };
    if ((Number(progress?.gold) || 0) < requirement.gold) return { ok: false, reason: 'gold', requirement };
    const missing = requirement.materials.find((material) => getQuantity(progress?.inventory, material.id) < material.amount);
    if (missing) return { ok: false, reason: 'material', material: missing, requirement };
    return { ok: true, reason: '', requirement };
  }

  function consumeInventoryMaterial(inventory, materialId, amount) {
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

  function attemptUpgrade(progress, currentLevel, options = {}) {
    const validation = canUpgrade(progress, currentLevel);
    if (!validation.ok) return validation;
    const requirement = validation.requirement;
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    requirement.materials.forEach((material) => consumeInventoryMaterial(progress.inventory, material.id, material.amount));
    progress.gold = Math.max(0, (Number(progress.gold) || 0) - requirement.gold);
    const succeeded = (options.random || Math.random)() < requirement.successRate;
    return { ok: true, succeeded, requirement, level: succeeded ? requirement.targetLevel : requirement.currentLevel };
  }

  function addMaterial(inventory, materialId, amount) {
    const material = MATERIALS[materialId];
    if (!material || amount <= 0) return null;
    const existing = inventory.find((item) => item?.id === materialId);
    if (existing) existing.quantity = Math.max(0, Number(existing.quantity) || 0) + amount;
    else inventory.push({ ...material, quantity: amount });
    return { ...material, quantity: amount };
  }

  function grantChapterDrops(progress, chapter, enemy = {}, options = {}) {
    const config = DROP_CONFIG[Number(chapter)];
    if (!config) return [];
    progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
    const random = options.random || Math.random;
    return config.materials
      .filter((drop) => !drop.bossOnly || enemy.isBoss)
      .filter((drop) => random() < drop.chance)
      .map((drop) => addMaterial(progress.inventory, drop.materialId, drop.amount));
  }

  return Object.freeze({ SKILL_BOOK_RANKS, MATERIALS, CHAPTERS, TARGET_LEVEL_COSTS, DROP_CONFIG, MAX_SKILL_LEVEL, normalizeMaterialInventory, getChapterForUpgrade, getUpgradeRequirement, getQuantity, canUpgrade, attemptUpgrade, grantChapterDrops });
});
