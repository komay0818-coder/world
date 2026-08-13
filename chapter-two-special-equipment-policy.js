(function attachChapterTwoSpecialEquipmentPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ChapterTwoSpecialEquipmentPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createChapterTwoSpecialEquipmentPolicy() {
  'use strict';
  function template(definition) {
    return Object.freeze({
      kind: 'equipment', chapter: 2, affixChapter: 2, quality: 'epic', rarity: 'epic', image: null,
      imageStatus: 'pending', directDrop: true, implementationStatus: 'pending-balance', ...definition,
      allowedJobs: Object.freeze(definition.allowedJobs || [])
    });
  }
  const TEMPLATES = Object.freeze({
    blackstoneWarlordHelm: template({ id: 'blackstone-warlord-warhelm', name: '黑石督軍戰盔', slot: 'head', series: '鎧甲', armorType: 'heavy', allowedJobs: ['warrior'] }),
    corruptedGuardianLeatherBoots: template({ id: 'corrupted-guardian-leather-boots', name: '腐化守護者皮靴', slot: 'boots', series: '皮甲', armorType: 'leather', allowedJobs: ['hunter', 'assassin'] }),
    deepForestMagicOrb: template({ id: 'deep-forest-magic-orb', name: '幽森魔珠', slot: 'offhand', series: '魔珠', offhandType: 'magic-orb', allowedJobs: ['mage', 'priest'] }),
    fallenThornWand: template({ id: 'fallen-thorn-wand', name: '墮落荊棘魔杖', slot: 'weapon', series: '魔杖', weaponType: 'one-handed-wand', allowedJobs: ['mage', 'priest'] })
  });
  const DROP_SOURCES = Object.freeze({
    blackstoneStrongholdWarlord: Object.freeze({ mapId: 'blackstone-stronghold', monsterId: 'blackstoneStrongholdWarlord', templateId: TEMPLATES.blackstoneWarlordHelm.id, dropRate: null, enabled: false }),
    corruptedAltarGuardian: Object.freeze({ mapId: 'forest-altar', monsterId: 'corruptedAltarGuardian', templateId: TEMPLATES.corruptedGuardianLeatherBoots.id, dropRate: null, enabled: false }),
    heartOfTheBlackForest: Object.freeze({ mapId: 'black-forest-depths', monsterId: 'heartOfTheBlackForest', templateId: TEMPLATES.deepForestMagicOrb.id, dropRate: null, enabled: false }),
    fallenDruid: Object.freeze({ mapId: 'forest-altar', monsterId: 'fallenDruid', templateId: TEMPLATES.fallenThornWand.id, dropRate: null, enabled: false })
  });
  const TEMPLATE_BY_ID = new Map(Object.values(TEMPLATES).map((entry) => [entry.id, entry]));
  function getTemplate(templateId) { return TEMPLATE_BY_ID.get(templateId) || null; }
  function getDropSource(monsterId) { return DROP_SOURCES[monsterId] || null; }
  function grantSpecialDrop() { return null; }
  return Object.freeze({ TEMPLATES, DROP_SOURCES, getTemplate, getDropSource, grantSpecialDrop });
}));
