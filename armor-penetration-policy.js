(function attachArmorPenetrationPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArmorPenetrationPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createArmorPenetrationPolicy() {
  'use strict';
  const ARMOR_IGNORE_CAP = .80;
  const EQUIPMENT_ELIGIBLE_ATTACK_KINDS = Object.freeze(['basic', 'skill', 'counter']);

  function clampRatio(value, maximum = 1) {
    return Math.max(0, Math.min(maximum, Number(value) || 0));
  }

  function appliesEquipmentPenetration(attackKind) {
    return EQUIPMENT_ELIGIBLE_ATTACK_KINDS.includes(attackKind);
  }

  function getTotalArmorIgnore({ skillArmorIgnore = 0, equipmentArmorPenetration = 0, attackKind } = {}) {
    const skill = clampRatio(skillArmorIgnore);
    const equipment = appliesEquipmentPenetration(attackKind) ? clampRatio(equipmentArmorPenetration) : 0;
    return Math.min(ARMOR_IGNORE_CAP, skill + equipment);
  }

  function getEffectiveDefense(defense, options = {}) {
    return Math.max(0, (Math.max(0, Number(defense) || 0)) * (1 - getTotalArmorIgnore(options)));
  }

  return Object.freeze({ ARMOR_IGNORE_CAP, EQUIPMENT_ELIGIBLE_ATTACK_KINDS, appliesEquipmentPenetration, getTotalArmorIgnore, getEffectiveDefense });
}));
