(function attachAlchemyPolicy(root, factory) {
  const affixPolicy = typeof module === 'object' && module.exports
    ? require('./equipment-affix-policy.js')
    : root.EquipmentAffixPolicy;
  const craftingPolicy = typeof module === 'object' && module.exports
    ? require('./crafting-policy.js')
    : root.CraftingPolicy;
  const api = factory(affixPolicy, craftingPolicy);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AlchemyPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createAlchemyPolicy(EquipmentAffixPolicy, CraftingPolicy) {
  const ALCHEMY_RULES = Object.freeze({
    quality: 'uncommon',
    inputCount: 2,
    candidateCountByLevel: Object.freeze({ 1: 1, 2: 2, 3: 3 }),
    maxCandidateCount: 3
  });
  const GENERIC_CRAFTED_RECIPE_BY_SLOT = Object.freeze({
    wrist: 'chapter1-green-wrist',
    cloak: 'chapter1-green-cloak',
    shoulders: 'chapter1-green-shoulders'
  });

  function getItemId(item) { return String(item?.instanceId || item?.id || ''); }
  function getCandidateCount(level) {
    const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
    return ALCHEMY_RULES.candidateCountByLevel[Math.min(3, safeLevel)] || ALCHEMY_RULES.maxCandidateCount;
  }
  function isProtected(item) {
    return Boolean(item?.locked || item?.isLocked || item?.protected || item?.isProtected || item?.favorite || item?.isFavorite);
  }
  function isEquipped(item, equipment) {
    const id = getItemId(item);
    return Object.values(equipment || {}).some((entry) => entry === item || (id && getItemId(entry) === id));
  }
  function isEligibleInput(item, progress = {}) {
    if (!item || item.kind !== 'equipment') return false;
    if (EquipmentAffixPolicy.normalizeQuality(item.quality || item.rarity) !== ALCHEMY_RULES.quality) return false;
    if (!getItemId(item) || isProtected(item) || isEquipped(item, progress.equipment)) return false;
    return Array.isArray(progress.inventory) && progress.inventory.some((entry) => entry === item || getItemId(entry) === getItemId(item));
  }
  function getEligibleInputs(progress, firstInputId = '') {
    const first = (progress?.inventory || []).find((item) => getItemId(item) === String(firstInputId));
    return (Array.isArray(progress?.inventory) ? progress.inventory : []).filter((item) => {
      if (!isEligibleInput(item, progress) || getItemId(item) === String(firstInputId)) return false;
      return !first || item.slot === first.slot;
    });
  }
  function validateInputs(progress, inputIds) {
    if (!Array.isArray(inputIds) || inputIds.length !== ALCHEMY_RULES.inputCount || inputIds.some((id) => !id)) {
      return { ok: false, code: 'missing-inputs', reason: '請放入兩件裝備。' };
    }
    if (new Set(inputIds.map(String)).size !== ALCHEMY_RULES.inputCount) {
      return { ok: false, code: 'duplicate-input', reason: '同一件裝備不能重複放入。' };
    }
    const inventory = Array.isArray(progress?.inventory) ? progress.inventory : [];
    const items = inputIds.map((id) => inventory.find((item) => getItemId(item) === String(id)));
    if (items.some((item) => !item)) return { ok: false, code: 'missing-item', reason: '裝備已不存在，請重新選擇。' };
    if (items.some((item) => item.kind !== 'equipment')) return { ok: false, code: 'not-equipment', reason: '只能使用裝備進行煉金。' };
    if (items.some((item) => EquipmentAffixPolicy.normalizeQuality(item.quality || item.rarity) !== ALCHEMY_RULES.quality)) {
      return { ok: false, code: 'invalid-quality', reason: '只能使用綠色裝備進行煉金。' };
    }
    if (items[0].slot !== items[1].slot) return { ok: false, code: 'slot-mismatch', reason: '兩件裝備必須是相同部位。' };
    if (items.some((item) => isEquipped(item, progress.equipment))) return { ok: false, code: 'equipped', reason: '已裝備的物品不可作為材料。' };
    if (items.some(isProtected)) return { ok: false, code: 'protected', reason: '已鎖定或受保護的裝備不可作為材料。' };
    const projectedSlots = inventory.length - ALCHEMY_RULES.inputCount + 1;
    if (projectedSlots > CraftingPolicy.INVENTORY_CAPACITY) return { ok: false, code: 'inventory-full', reason: '背包空間不足。' };
    return { ok: true, items, slot: items[0].slot };
  }
  function createInstanceId(now = Date.now(), random = Math.random, index = 0) {
    return `alchemy-${now}-${index}-${Math.floor(Math.max(0, Math.min(.999999, Number(random()) || 0)) * 0x100000000).toString(36)}`;
  }
  function createStandardCandidate(source, instanceId, random, createdAt) {
    const baseStats = source.baseStats && typeof source.baseStats === 'object' ? { ...source.baseStats } : {};
    const template = {
      id: source.templateId || source.baseItemId || source.equipmentId || source.id,
      baseItemId: source.baseItemId || source.templateId || source.equipmentId || source.id,
      kind: 'equipment', name: source.name, slot: source.slot,
      image: source.image, icon: source.icon,
      weaponType: source.weaponType, armorType: source.armorType, equipmentType: source.equipmentType,
      allowedJobs: [...(source.allowedJobs || source.allowedClasses || [])],
      ...baseStats
    };
    const generated = EquipmentAffixPolicy.createEquipmentInstance(template, { quality: 'uncommon', uniqueId: instanceId, random });
    return {
      ...generated, id: instanceId, instanceId, templateId: template.id, baseItemId: template.baseItemId,
      rarity: 'uncommon', quality: 'uncommon', baseStats, sockets: 0,
      sourceType: 'alchemy', acquisitionType: 'alchemy', alchemyAt: createdAt
    };
  }
  function generateCandidate(source, options = {}) {
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const createdAt = Number(options.createdAt) || Date.now();
    const instanceId = String(options.instanceId || createInstanceId(createdAt, random, options.index));
    const craftedRecipeId = GENERIC_CRAFTED_RECIPE_BY_SLOT[source?.slot];
    if (source?.primaryStat && craftedRecipeId) {
      const generated = CraftingPolicy.generateCraftedEquipment(craftedRecipeId, { random, craftedAt: createdAt, instanceId });
      return generated ? {
        ...generated, id: instanceId, instanceId, sourceType: 'crafted', acquisitionType: 'alchemy', recipeId: null,
        sockets: 0, craftedAt: undefined, alchemyAt: createdAt
      } : null;
    }
    return createStandardCandidate(source, instanceId, random, createdAt);
  }
  function beginAlchemy(progress, inputIds, options = {}) {
    const validation = validateInputs(progress, inputIds);
    if (!validation.ok) return validation;
    const random = typeof options.random === 'function' ? options.random : Math.random;
    const createdAt = Number(options.createdAt) || Date.now();
    const count = getCandidateCount(options.buildingLevel);
    const candidates = Array.from({ length: count }, (_, index) => generateCandidate(validation.items[0], {
      random, createdAt, index,
      instanceId: typeof options.instanceIdFactory === 'function' ? options.instanceIdFactory(index) : undefined
    }));
    if (candidates.some((item) => !item) || new Set(candidates.map(getItemId)).size !== candidates.length) {
      return { ok: false, code: 'generation-failed', reason: '煉金資料產生失敗，材料未被消耗。' };
    }
    return { ok: true, session: { version: 1, inputIds: inputIds.map(String), slot: validation.slot, candidates, createdAt } };
  }
  function confirmAlchemy(progress, session, candidateId) {
    if (!session || !Array.isArray(session.candidates)) return { ok: false, code: 'missing-session', reason: '煉金資料已失效，請重新開始。' };
    const validation = validateInputs(progress, session.inputIds);
    if (!validation.ok) return validation;
    const selected = session.candidates.find((item) => getItemId(item) === String(candidateId));
    if (!selected || selected.slot !== validation.slot || EquipmentAffixPolicy.normalizeQuality(selected.quality) !== 'uncommon') {
      return { ok: false, code: 'invalid-candidate', reason: '選擇的煉金結果無效，材料未被消耗。' };
    }
    const existingIds = new Set([...(progress.inventory || []), ...Object.values(progress.equipment || {})].filter(Boolean).map(getItemId));
    if (existingIds.has(getItemId(selected))) return { ok: false, code: 'duplicate-instance', reason: '煉金結果編號重複，材料未被消耗。' };
    const consumed = new Set(session.inputIds.map(String));
    const nextInventory = progress.inventory.filter((item) => !consumed.has(getItemId(item)));
    nextInventory.push(JSON.parse(JSON.stringify(selected)));
    progress.inventory = nextInventory;
    return { ok: true, item: progress.inventory[progress.inventory.length - 1], consumedIds: [...consumed] };
  }

  return Object.freeze({
    ALCHEMY_RULES, GENERIC_CRAFTED_RECIPE_BY_SLOT, getItemId, getCandidateCount, isProtected, isEquipped,
    isEligibleInput, getEligibleInputs, validateInputs, generateCandidate, beginAlchemy, confirmAlchemy
  });
}));
