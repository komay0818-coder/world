(function attachEquipmentPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EquipmentPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createEquipmentPolicy() {
  const WEAPON_CATALOG = Object.freeze({
    shortIronSword: Object.freeze({
      id: 'short-iron-sword',
      kind: 'equipment',
      series: '單手劍',
      name: '短鐵劍',
      slot: 'weapon',
      weaponType: 'one-handed-sword',
      image: 'assets/goblin-short-sword.png',
      attackMin: 8,
      attackMax: 11,
      attack: 10,
      attackSpeed: 1.40,
      allowedJobs: ['warrior', 'assassin'],
      quality: '普通'
    }),
    knightLongsword: Object.freeze({
      id: 'knight-longsword',
      kind: 'equipment',
      series: '單手劍',
      name: '騎士長劍',
      slot: 'weapon',
      weaponType: 'one-handed-sword',
      image: 'assets/goblin-short-sword.png',
      attackMin: 10,
      attackMax: 14,
      attack: 12,
      attackSpeed: 1.20,
      allowedJobs: ['warrior', 'assassin'],
      quality: '普通'
    }),
    mercenaryGreatsword: Object.freeze({
      id: 'mercenary-greatsword',
      kind: 'equipment',
      series: '雙手劍',
      name: '傭兵大劍',
      slot: 'weapon',
      weaponType: 'two-handed-sword',
      image: 'assets/equipment-weapon.png',
      attackMin: 18,
      attackMax: 24,
      attack: 21,
      attackSpeed: .80,
      allowedJobs: ['warrior'],
      quality: '普通'
    }),
    giantIronSword: Object.freeze({
      id: 'giant-iron-sword',
      kind: 'equipment',
      series: '雙手劍',
      name: '巨鐵劍',
      slot: 'weapon',
      weaponType: 'two-handed-sword',
      image: 'assets/equipment-weapon.png',
      attackMin: 21,
      attackMax: 28,
      attack: 25,
      attackSpeed: .65,
      allowedJobs: ['warrior'],
      quality: '普通'
    }),
    loggingHatchet: Object.freeze({
      id: 'logging-hatchet',
      kind: 'equipment',
      series: '單手斧',
      name: '伐木手斧',
      slot: 'weapon',
      weaponType: 'one-handed-axe',
      image: 'assets/equipment-weapon.png',
      attackMin: 9,
      attackMax: 12,
      attack: 11,
      attackSpeed: 1.10,
      allowedJobs: ['warrior', 'assassin'],
      quality: '普通'
    }),
    warriorHatchet: Object.freeze({
      id: 'warrior-hatchet',
      kind: 'equipment',
      series: '單手斧',
      name: '戰士手斧',
      slot: 'weapon',
      weaponType: 'one-handed-axe',
      image: 'assets/equipment-weapon.png',
      attackMin: 11,
      attackMax: 15,
      attack: 13,
      attackSpeed: .95,
      allowedJobs: ['warrior', 'assassin'],
      quality: '普通'
    }),
    battleGreataxe: Object.freeze({
      id: 'battle-greataxe',
      kind: 'equipment',
      series: '雙手斧',
      name: '戰鬥巨斧',
      slot: 'weapon',
      weaponType: 'two-handed-axe',
      image: 'assets/equipment-weapon.png',
      attackMin: 20,
      attackMax: 26,
      attack: 23,
      attackSpeed: .70,
      allowedJobs: ['warrior'],
      quality: '普通'
    }),
    rockbreakerGreataxe: Object.freeze({
      id: 'rockbreaker-greataxe',
      kind: 'equipment',
      series: '雙手斧',
      name: '碎岩巨斧',
      slot: 'weapon',
      weaponType: 'two-handed-axe',
      image: 'assets/equipment-weapon.png',
      attackMin: 23,
      attackMax: 30,
      attack: 27,
      attackSpeed: .55,
      allowedJobs: ['warrior'],
      quality: '普通'
    }),
    hunterShortbow: Object.freeze({
      id: 'hunter-shortbow',
      kind: 'equipment',
      series: '弓箭',
      name: '獵人短弓',
      slot: 'weapon',
      weaponType: 'bow',
      image: 'assets/black-forest-bow.png',
      attackMin: 9,
      attackMax: 13,
      attack: 11,
      attackSpeed: 1.10,
      allowedJobs: ['hunter'],
      quality: '普通'
    }),
    longHuntingBow: Object.freeze({
      id: 'long-hunting-bow',
      kind: 'equipment',
      series: '弓箭',
      name: '長獵弓',
      slot: 'weapon',
      weaponType: 'bow',
      image: 'assets/black-forest-bow.png',
      attackMin: 11,
      attackMax: 15,
      attack: 13,
      attackSpeed: .90,
      allowedJobs: ['hunter'],
      quality: '普通'
    }),
    rustyDagger: Object.freeze({
      id: 'rusty-dagger',
      kind: 'equipment',
      series: '匕首',
      name: '生鏽匕首',
      slot: 'weapon',
      weaponType: 'one-handed-dagger',
      image: 'assets/wolf-fang-dagger.png',
      attackMin: 6,
      attackMax: 9,
      attack: 8,
      attackSpeed: 1.80,
      allowedJobs: ['assassin'],
      quality: '普通'
    }),
    assassinShortblade: Object.freeze({
      id: 'assassin-shortblade',
      kind: 'equipment',
      series: '匕首',
      name: '刺客短刃',
      slot: 'weapon',
      weaponType: 'one-handed-dagger',
      image: 'assets/wolf-fang-dagger.png',
      attackMin: 8,
      attackMax: 11,
      attack: 10,
      attackSpeed: 1.60,
      allowedJobs: ['assassin'],
      quality: '普通'
    }),
    apprenticeStaff: Object.freeze({
      id: 'apprentice-staff',
      kind: 'equipment',
      series: '法杖',
      name: '學徒法杖',
      slot: 'weapon',
      weaponType: 'staff',
      image: 'assets/boar-bone-staff.png',
      attackMin: 10,
      attackMax: 15,
      attack: 13,
      attackSpeed: 1.00,
      allowedJobs: ['mage'],
      quality: '普通'
    }),
    arcaneStaff: Object.freeze({
      id: 'arcane-staff',
      kind: 'equipment',
      series: '法杖',
      name: '魔導法杖',
      slot: 'weapon',
      weaponType: 'staff',
      image: 'assets/boar-bone-staff.png',
      attackMin: 13,
      attackMax: 18,
      attack: 16,
      attackSpeed: .85,
      allowedJobs: ['mage'],
      quality: '普通'
    })
  });

  const ARMOR_CATALOG = Object.freeze({
    recruitPlateArmor: Object.freeze({
      id: 'starter-recruit-plate-armor',
      kind: 'equipment',
      series: '鎧甲',
      name: '新兵鎧甲',
      slot: 'armor',
      armorType: 'plate',
      image: 'assets/hardened-hide-armor.png',
      defense: 8,
      hp: 20,
      quality: '普通'
    }),
    guardPlateArmor: Object.freeze({
      id: 'guard-plate-armor',
      kind: 'equipment',
      series: '鎧甲',
      name: '守衛鎧甲',
      slot: 'armor',
      armorType: 'plate',
      image: 'assets/hardened-hide-armor.png',
      defense: 5,
      hp: 50,
      quality: '普通'
    }),
    leatherVest: Object.freeze({
      id: 'leather-vest',
      kind: 'equipment',
      series: '皮甲',
      name: '皮革背心',
      slot: 'armor',
      armorType: 'leather',
      image: 'assets/hunter-leather-armor.png',
      defense: 4,
      dodge: .03,
      quality: '普通'
    }),
    huntingLeatherArmor: Object.freeze({
      id: 'hunting-leather-armor',
      kind: 'equipment',
      series: '皮甲',
      name: '狩獵皮甲',
      slot: 'armor',
      armorType: 'leather',
      image: 'assets/hunter-leather-armor.png',
      defense: 3,
      accuracy: .04,
      quality: '普通'
    }),
    apprenticeRobe: Object.freeze({
      id: 'apprentice-robe',
      kind: 'equipment',
      series: '布甲',
      name: '學徒長袍',
      slot: 'armor',
      armorType: 'cloth',
      image: 'assets/rough-cloth-vest.png',
      defense: 3,
      mana: 50,
      quality: '普通'
    }),
    novicePriestRobe: Object.freeze({
      id: 'novice-priest-robe',
      kind: 'equipment',
      series: '布甲',
      name: '見習祭司袍',
      slot: 'armor',
      armorType: 'cloth',
      image: 'assets/rough-cloth-vest.png',
      defense: 2,
      mana: 15,
      manaRegenBonus: .03,
      quality: '普通'
    }),
    recruitIronHelmet: Object.freeze({
      id: 'starter-recruit-iron-helmet',
      kind: 'equipment',
      series: '鎧甲',
      name: '新兵鐵盔',
      slot: 'head',
      armorType: 'plate',
      image: 'assets/patchwork-cap.png',
      defense: 5,
      hp: 25,
      quality: '普通'
    }),
    guardHelmet: Object.freeze({
      id: 'guard-helmet',
      kind: 'equipment',
      series: '鎧甲',
      name: '守衛頭盔',
      slot: 'head',
      armorType: 'plate',
      image: 'assets/patchwork-cap.png',
      defense: 3,
      strength: 2,
      quality: '普通'
    }),
    leatherHood: Object.freeze({
      id: 'leather-hood',
      kind: 'equipment',
      series: '皮甲',
      name: '皮革兜帽',
      slot: 'head',
      armorType: 'leather',
      image: 'assets/patchwork-cap.png',
      accuracy: .02,
      defense: 2,
      quality: '普通'
    }),
    huntingHood: Object.freeze({
      id: 'hunting-hood',
      kind: 'equipment',
      series: '皮甲',
      name: '狩獵頭罩',
      slot: 'head',
      armorType: 'leather',
      image: 'assets/patchwork-cap.png',
      attackSpeedBonus: .02,
      defense: 2,
      quality: '普通'
    }),
    apprenticeMageHat: Object.freeze({
      id: 'apprentice-mage-hat',
      kind: 'equipment',
      series: '布甲',
      name: '學徒法帽',
      slot: 'head',
      armorType: 'cloth',
      image: 'assets/patchwork-cap.png',
      mana: 20,
      intelligence: 2,
      quality: '普通'
    }),
    noviceHeadscarf: Object.freeze({
      id: 'novice-headscarf',
      kind: 'equipment',
      series: '布甲',
      name: '見習者頭巾',
      slot: 'head',
      armorType: 'cloth',
      image: 'assets/patchwork-cap.png',
      cooldownSpeedBonus: .02,
      intelligence: 1,
      quality: '普通'
    })
  });

  const ARMOR_CATEGORY_JOBS = Object.freeze({
    plate: Object.freeze(['warrior']),
    leather: Object.freeze(['hunter', 'assassin']),
    cloth: Object.freeze(['mage', 'priest'])
  });

  const ARMOR_TYPE_CATEGORY = Object.freeze({
    plate: 'plate',
    heavy: 'plate',
    mail: 'plate',
    leather: 'leather',
    'reinforced-leather': 'leather',
    hide: 'leather',
    cloth: 'cloth'
  });

  function getArmorCategory(item) {
    return ARMOR_TYPE_CATEGORY[String(item?.armorType || '')] || null;
  }

  function isArmorCompatible(item, job) {
    const category = getArmorCategory(item);
    return !category || ARMOR_CATEGORY_JOBS[category].includes(job);
  }

  function isRecruitEquipment(item) {
    return Boolean(item && item.kind === 'equipment' && String(item.id || '').startsWith('starter-'));
  }

  function removeLegacyEquipmentFromInventory(inventory) {
    return (Array.isArray(inventory) ? inventory : []).filter((item) => item?.kind !== 'equipment' || isRecruitEquipment(item));
  }

  function rollWeaponAttack(item, randomValue = Math.random()) {
    if (!item || !Number.isFinite(Number(item.attackMin)) || !Number.isFinite(Number(item.attackMax))) return null;
    const minimum = Math.floor(Math.min(Number(item.attackMin), Number(item.attackMax)));
    const maximum = Math.floor(Math.max(Number(item.attackMin), Number(item.attackMax)));
    const roll = Math.min(.999999, Math.max(0, Number(randomValue) || 0));
    return minimum + Math.floor(roll * (maximum - minimum + 1));
  }

  function getAttacksPerSecond(item, fallback = 1) {
    const weaponSpeed = Number(item?.attackSpeed);
    return weaponSpeed > 0 ? weaponSpeed : Math.max(.01, Number(fallback) || 1);
  }

  function isOneHandedWeapon(item) {
    return String(item?.weaponType || '').startsWith('one-handed-');
  }

  function getEquipSlots(item, job) {
    if (!item || item.kind !== 'equipment') return [];
    const armorCategory = getArmorCategory(item);
    if (armorCategory && !isArmorCompatible(item, job)) return [];
    if (!armorCategory && item.allowedJobs?.length && !item.allowedJobs.includes(job)) return [];
    const slots = [item.slot];
    if (job === 'assassin' && item.slot === 'weapon' && isOneHandedWeapon(item)) slots.push('offhand');
    return [...new Set(slots)];
  }

  function canEquipInSlot(item, job, slot) {
    return getEquipSlots(item, job).includes(slot);
  }

  return {
    WEAPON_CATALOG,
    ARMOR_CATALOG,
    ARMOR_CATEGORY_JOBS,
    getArmorCategory,
    isArmorCompatible,
    isRecruitEquipment,
    removeLegacyEquipmentFromInventory,
    rollWeaponAttack,
    getAttacksPerSecond,
    isOneHandedWeapon,
    getEquipSlots,
    canEquipInSlot
  };
}));
