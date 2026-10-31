(function attachEquipmentReforgePolicy(root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./equipment-affix-policy') : root.EquipmentAffixPolicy);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EquipmentReforgePolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createEquipmentReforgePolicy(Affixes) {
  'use strict';

  const TYPE_GRADE_WEIGHTS = Object.freeze({
    1: Object.freeze({ 1: .40, 2: .40, 3: .20 }),
    2: Object.freeze({ 1: .30, 2: .35, 3: .28, 4: .07 }),
    3: Object.freeze({ 1: .25, 2: .35, 3: .30, 4: .10 })
  });
  const VALUE_QUALITY_WEIGHTS = Object.freeze({
    1: Object.freeze({ 1: .55, 2: .35, 3: .10 }),
    2: Object.freeze({ 1: .45, 2: .35, 3: .17, 4: .03 }),
    3: Object.freeze({ 1: .40, 2: .35, 3: .20, 4: .05 })
  });
  const VALUE_MULTIPLIERS = Object.freeze({
    1: Object.freeze([1.00, 1.09]),
    2: Object.freeze([1.10, 1.19]),
    3: Object.freeze([1.20, 1.29]),
    4: Object.freeze([1.30, 1.40])
  });
  const COSTS = Object.freeze({
    type: Object.freeze({
      1: Object.freeze({ uncommon: Object.freeze({ materialId: 'green_essence_stone', material: 1, gold: 100 }), rare: Object.freeze({ materialId: 'blue_essence_stone', material: 1, gold: 300 }) }),
      2: Object.freeze({ uncommon: Object.freeze({ materialId: 'green_essence_stone', material: 1, gold: 200 }), rare: Object.freeze({ materialId: 'blue_essence_stone', material: 1, gold: 600 }) }),
      3: Object.freeze({ uncommon: Object.freeze({ materialId: 'green_essence_stone', material: 1, gold: 400 }), rare: Object.freeze({ materialId: 'blue_essence_stone', material: 1, gold: 1200 }) })
    }),
    value: Object.freeze({
      1: Object.freeze({ uncommon: Object.freeze({ materialId: 'green_essence_stone', material: 1, gold: 50 }), rare: Object.freeze({ materialId: 'blue_essence_stone', material: 1, gold: 150 }) }),
      2: Object.freeze({ uncommon: Object.freeze({ materialId: 'green_essence_stone', material: 1, gold: 100 }), rare: Object.freeze({ materialId: 'blue_essence_stone', material: 1, gold: 300 }) }),
      3: Object.freeze({ uncommon: Object.freeze({ materialId: 'green_essence_stone', material: 1, gold: 200 }), rare: Object.freeze({ materialId: 'blue_essence_stone', material: 1, gold: 600 }) })
    })
  });
  const REQUIRED_LEVEL = Object.freeze({ type: 8, value: 10 });
  const copy = value => JSON.parse(JSON.stringify(value));
  const clampRoll = value => Math.min(.999999999999, Math.max(0, Number(value) || 0));

  function normalizeOperation(operation) {
    if (!operation || typeof operation !== 'object' || Array.isArray(operation)) throw Error('Reforge operation required');
    const type = operation.type;
    if (!Object.prototype.hasOwnProperty.call(REQUIRED_LEVEL, type)) throw Error('Invalid reforge operation type');
    const instanceId = String(operation.instanceId || '');
    const slotKey = String(operation.slotKey || '');
    const characterId = String(operation.characterId || '');
    if (!instanceId || instanceId.length > 160 || !slotKey.match(/^random-[0-9]+$/) || !characterId || characterId.length > 160) throw Error('Invalid reforge operation identity');
    return Object.freeze({ type, instanceId, slotKey, characterId });
  }

  function isProtected(item) {
    return Boolean(item?.locked || item?.isLocked || item?.protected || item?.isProtected || item?.favorite || item?.isFavorite);
  }

  function getCost(type, chapter, quality) {
    const normalizedChapter = Number(chapter), normalizedQuality = Affixes.normalizeQuality(quality);
    const cost = COSTS[type]?.[normalizedChapter]?.[normalizedQuality];
    if (!cost) throw Error('Equipment quality or chapter is not eligible for reforge');
    return { ...cost };
  }

  function weightedPick(entries, random, getWeight = entry => entry.weight) {
    const total = entries.reduce((sum, entry) => sum + Math.max(0, Number(getWeight(entry)) || 0), 0);
    if (!entries.length || total <= 0) return null;
    let cursor = clampRoll(random()) * total;
    for (const entry of entries) {
      cursor -= Math.max(0, Number(getWeight(entry)) || 0);
      if (cursor < 0) return entry;
    }
    return entries[entries.length - 1] || null;
  }

  function rollWeightedGrade(candidates, weights, random) {
    const groups = Object.entries(weights).map(([grade, weight]) => ({
      grade: Number(grade), weight, candidates: candidates.filter(entry => Affixes.getAffixGrade(entry) === Number(grade))
    })).filter(group => group.candidates.length && group.weight > 0);
    const group = weightedPick(groups, random);
    return group ? weightedPick(group.candidates, random) : null;
  }

  function rollValueQuality(chapter, random = Math.random) {
    const entry = weightedPick(Object.entries(VALUE_QUALITY_WEIGHTS[chapter] || {}).map(([quality, weight]) => ({ quality: Number(quality), weight })), random);
    if (!entry) throw Error('No legal value quality for reforge');
    return entry.quality;
  }

  function rollValueMultiplier(valueQuality, random = Math.random) {
    const range = VALUE_MULTIPLIERS[valueQuality];
    if (!range) throw Error('Invalid value quality for reforge');
    return range[0] + clampRoll(random()) * (range[1] - range[0]);
  }

  function rollTypeAffix(item, slotIndex, random) {
    const chapter = Number(item.affixChapter);
    const selected = [...item.fixedAffixes, ...item.randomAffixes.filter((_entry, index) => index !== slotIndex)];
    const candidates = Affixes.getAvailableAffixes(item, selected, { chapter, quality: item.quality });
    const candidate = rollWeightedGrade(candidates, TYPE_GRADE_WEIGHTS[chapter], random);
    if (!candidate) throw Error('No legal affix candidate for reforge');
    const materialized = Affixes.getCanonicalAffix(candidate.id, chapter, 'random');
    if (!materialized) throw Error('Invalid affix candidate for reforge');
    return {
      ...materialized,
      slotKey: item.randomAffixes[slotIndex].slotKey,
      affixGrade: Affixes.getAffixGrade(candidate),
      valueQuality: 1,
      components: materialized.components.map(component => ({ ...component }))
    };
  }

  function rollValueAffix(item, slotIndex, random) {
    const chapter = Number(item.affixChapter), current = item.randomAffixes[slotIndex];
    const valueQuality = rollValueQuality(chapter, random);
    const multiplier = rollValueMultiplier(valueQuality, random);
    const canonical = Affixes.getCanonicalAffix(current.id, chapter, 'random');
    if (!canonical) throw Error('Invalid affix for value reforge');
    const components = canonical.components.map(component => ({
      ...component,
      value: String(component.unit || '') === '%'
        ? Math.round(component.value * multiplier * 10) / 10
        : Math.round(component.value * multiplier)
    }));
    return {
      affix: {
        ...canonical,
        slotKey: current.slotKey,
        affixGrade: current.affixGrade,
        valueQuality,
        value: components.length === 1 ? components[0].value : canonical.value,
        components
      },
      multiplier
    };
  }

  function getMaterialQuantity(items, materialId) {
    return items.filter(item => item?.kind !== 'equipment' && item?.id === materialId).reduce((sum, item) => {
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 0) throw Error('Invalid essence quantity');
      return sum + item.quantity;
    }, 0);
  }

  function deductMaterial(items, materialId, amount) {
    let remaining = amount;
    for (let index = 0; index < items.length && remaining > 0; index++) {
      const item = items[index];
      if (item?.kind === 'equipment' || item?.id !== materialId) continue;
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 0) throw Error('Invalid essence quantity');
      const used = Math.min(item.quantity, remaining);
      item.quantity -= used;
      remaining -= used;
    }
    if (remaining) throw Error('Insufficient essence stones');
    for (let index = items.length - 1; index >= 0; index--) {
      if (items[index]?.kind !== 'equipment' && items[index]?.id === materialId && items[index].quantity === 0) items.splice(index, 1);
    }
  }

  function applyAccountReforgeOwned(model, operation, PermanentPolicy, options = {}) {
    if (!model || !PermanentPolicy) throw Error('Permanent authority required');
    const normalizedOperation = normalizeOperation(operation);
    PermanentPolicy.validate(model);
    const character = model.characters?.[normalizedOperation.characterId];
    if (!character || model.activeMainId !== normalizedOperation.characterId) throw Error('Active character identity mismatch');
    const level = Number(character.progress?.level);
    if (!Number.isSafeInteger(level) || level < REQUIRED_LEVEL[normalizedOperation.type]) throw Error(`Reforge requires level ${REQUIRED_LEVEL[normalizedOperation.type]}`);
    const owner = model.equipmentOwners?.[normalizedOperation.instanceId];
    if (!owner || owner.kind !== 'bag' || Object.keys(owner).length !== 1) throw Error('Equipment must be in the shared bag for reforge');
    const matches = model.bag?.items?.filter(item => item?.kind === 'equipment' && item.instanceId === normalizedOperation.instanceId) || [];
    if (matches.length !== 1) throw Error('Equipment ownership mismatch');
    if (isProtected(matches[0])) throw Error('Protected equipment cannot be reforged');
    if (!Affixes.canReforgeEquipment(matches[0])) throw Error('Equipment is not eligible for reforge');

    const convertedLegacy = Number(matches[0].affixSchemaVersion) < Affixes.SCHEMA_VERSION;
    const equipment = convertedLegacy ? Affixes.convertEquipmentForReforge(matches[0]) : Affixes.normalizeEquipment(matches[0]);
    const chapter = Number(equipment.affixChapter);
    if (!Number.isSafeInteger(chapter) || chapter < 1 || chapter > 3) throw Error('Equipment chapter is not eligible for reforge');
    const slotIndex = equipment.randomAffixes.findIndex(entry => entry.slotKey === normalizedOperation.slotKey);
    if (slotIndex < 0) throw Error('Unknown random affix slot');
    if (normalizedOperation.type === 'type' && equipment.reforgeState.lockedTypeSlotKey !== null && equipment.reforgeState.lockedTypeSlotKey !== normalizedOperation.slotKey) throw Error('Equipment type reforge slot is permanently locked');

    const cost = getCost(normalizedOperation.type, chapter, equipment.quality);
    const beforeGold = PermanentPolicy.getSharedGold(model);
    if (beforeGold < cost.gold) throw Error('Insufficient shared gold');
    const beforeMaterial = getMaterialQuantity(model.bag.items, cost.materialId);
    if (beforeMaterial < cost.material) throw Error('Insufficient essence stones');

    const random = typeof options.random === 'function' ? options.random : Math.random;
    const previousAffix = copy(equipment.randomAffixes[slotIndex]);
    let nextAffix, multiplier = null;
    if (normalizedOperation.type === 'type') nextAffix = rollTypeAffix(equipment, slotIndex, random);
    else ({ affix: nextAffix, multiplier } = rollValueAffix(equipment, slotIndex, random));

    const nextEquipment = copy(equipment);
    nextEquipment.randomAffixes[slotIndex] = nextAffix;
    if (normalizedOperation.type === 'type' && nextEquipment.reforgeState.lockedTypeSlotKey === null) nextEquipment.reforgeState.lockedTypeSlotKey = normalizedOperation.slotKey;
    nextEquipment.affixes = [...nextEquipment.fixedAffixes, ...nextEquipment.randomAffixes];
    const verifiedEquipment = Affixes.normalizeEquipment(nextEquipment);

    deductMaterial(model.bag.items, cost.materialId, cost.material);
    const equipmentIndex = model.bag.items.findIndex(item => item?.kind === 'equipment' && item.instanceId === normalizedOperation.instanceId);
    if (equipmentIndex < 0) throw Error('Equipment disappeared during reforge');
    model.bag.items[equipmentIndex] = verifiedEquipment;
    const gold = PermanentPolicy.applySharedGoldTransactionOwned(model, { type: 'debit', amount: cost.gold }, { validateModel: false });
    PermanentPolicy.validate(model);
    return {
      model,
      type: normalizedOperation.type,
      instanceId: normalizedOperation.instanceId,
      slotKey: normalizedOperation.slotKey,
      chapter,
      quality: equipment.quality,
      cost,
      beforeGold,
      afterGold: gold.after,
      beforeMaterial,
      afterMaterial: beforeMaterial - cost.material,
      previousAffix,
      affix: copy(verifiedEquipment.randomAffixes[slotIndex]),
      multiplier,
      convertedLegacy,
      lockedTypeSlotKey: verifiedEquipment.reforgeState.lockedTypeSlotKey
    };
  }

  function applyAccountReforge(model, operation, PermanentPolicy, options = {}) {
    return applyAccountReforgeOwned(copy(model), operation, PermanentPolicy, options);
  }

  function createDeterministicRandom(seed) {
    let state = 2166136261;
    for (const char of String(seed || '')) { state ^= char.charCodeAt(0); state = Math.imul(state, 16777619); }
    return function random() {
      state |= 0; state = state + 0x6D2B79F5 | 0;
      let value = Math.imul(state ^ state >>> 15, 1 | state);
      value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  return Object.freeze({
    TYPE_GRADE_WEIGHTS, VALUE_QUALITY_WEIGHTS, VALUE_MULTIPLIERS, COSTS, REQUIRED_LEVEL,
    normalizeOperation, isProtected, getCost, rollWeightedGrade, rollValueQuality, rollValueMultiplier, rollTypeAffix, rollValueAffix, applyAccountReforgeOwned,
    applyAccountReforge, createDeterministicRandom
  });
}));
