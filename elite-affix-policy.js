(function attachEliteAffixPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EliteAffixPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createEliteAffixPolicy() {
  'use strict';

  const AFFIXES = Object.freeze({
    frenzy: Object.freeze({ id: 'frenzy', name: '狂暴', description: '攻擊速度 +20%', weight: 30, attackSpeedMultiplier: 1.20 }),
    bloodthirst: Object.freeze({ id: 'bloodthirst', name: '嗜血', description: '直接傷害的 10% 恢復自身生命', weight: 18, directDamageLeech: .10 }),
    ironWall: Object.freeze({ id: 'ironWall', name: '鐵壁', description: '防禦 +20%', weight: 30, defenseMultiplier: 1.20 }),
    tenacious: Object.freeze({ id: 'tenacious', name: '強韌', description: '最大生命 +30%', weight: 30, maxHpMultiplier: 1.30 }),
    regeneration: Object.freeze({ id: 'regeneration', name: '再生', description: '每 5 秒恢復最大生命 3%', weight: 18, regenerationIntervalMs: 5000, regenerationRatio: .03 }),
    executioner: Object.freeze({ id: 'executioner', name: '處刑者', description: '對生命低於 35% 的角色傷害 +20%', weight: 8, targetHpThreshold: .35, damageMultiplier: 1.20 })
  });
  const CHAPTER_CONFIGS = Object.freeze({
    2: Object.freeze({ affixChance: .40, maxAffixes: 1, affixPool: Object.freeze(Object.keys(AFFIXES)), dropBonus: Object.freeze({ equipmentMultiplier: 1.10, materialMultiplier: 1.10 }) })
  });
  const MONSTER_COMPATIBILITY = Object.freeze({
    blackstoneVenombladeAssassin: Object.freeze({ blockedAffixes: Object.freeze(['executioner']) }),
    altarGuard: Object.freeze({ blockedAffixes: Object.freeze(['ironWall']) })
  });

  function clampRoll(value) { return Math.max(0, Math.min(.999999, Number(value) || 0)); }
  function getChapterConfig(chapter) { return CHAPTER_CONFIGS[Number(chapter)] || null; }
  function getAllowedAffixIds(enemy, chapter = enemy?.chapter) {
    const config = getChapterConfig(chapter);
    if (!config || !enemy?.isElite || enemy?.isBoss) return [];
    const compatibility = MONSTER_COMPATIBILITY[enemy.id] || MONSTER_COMPATIBILITY[enemy.policyId] || {};
    const allowed = Array.isArray(compatibility.allowedAffixes) ? compatibility.allowedAffixes : config.affixPool;
    const blocked = new Set(compatibility.blockedAffixes || []);
    return allowed.filter((id) => AFFIXES[id] && !blocked.has(id));
  }
  function weightedPick(ids, randomValue) {
    const entries = ids.map((id) => AFFIXES[id]).filter((entry) => entry && entry.weight > 0);
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
    if (!total) return null;
    let cursor = clampRoll(randomValue) * total;
    return entries.find((entry) => ((cursor -= entry.weight) < 0)) || entries[entries.length - 1];
  }
  function rollAffixes(enemy, chapter = enemy?.chapter, random = Math.random) {
    const config = getChapterConfig(chapter);
    if (!config || !enemy?.isElite || enemy?.isBoss || clampRoll(random()) >= config.affixChance) return Object.freeze([]);
    const available = [...getAllowedAffixIds(enemy, chapter)];
    const selected = [];
    while (available.length && selected.length < config.maxAffixes) {
      const affix = weightedPick(available, random());
      if (!affix) break;
      selected.push(affix);
      available.splice(available.indexOf(affix.id), 1);
    }
    return Object.freeze(selected);
  }
  function applyAffixes(enemy, affixes = []) {
    if (!enemy || !affixes.length) return enemy;
    const multiply = (key) => affixes.reduce((value, affix) => value * (affix[key] || 1), 1);
    return { ...enemy, name: `${enemy.name}${affixes.map((affix) => `【${affix.name}】`).join('')}`, maxHp: Math.max(1, Math.round(enemy.maxHp * multiply('maxHpMultiplier'))), defense: Math.max(0, Math.round(enemy.defense * multiply('defenseMultiplier'))), attackSpeed: enemy.attackSpeed * multiply('attackSpeedMultiplier'), eliteAffixes: affixes };
  }
  function getDamageMultiplier(affixes = [], targetHpRatio = 1) { return affixes.reduce((value, affix) => value * (affix.targetHpThreshold != null && targetHpRatio < affix.targetHpThreshold ? affix.damageMultiplier : 1), 1); }
  function getDirectDamageLeech(affixes = []) { return affixes.reduce((sum, affix) => sum + (affix.directDamageLeech || 0), 0); }
  function getRegeneration(affixes = []) { return affixes.find((affix) => affix.regenerationIntervalMs && affix.regenerationRatio) || null; }
  function getDropBonus(affixes = [], chapter = 2) { const config = getChapterConfig(chapter); return affixes.length && config ? config.dropBonus : Object.freeze({ equipmentMultiplier: 1, materialMultiplier: 1 }); }
  function createBonusRandom(random, multiplier = 1) { const source = typeof random === 'function' ? random : Math.random; const bonus = Math.max(1, Number(multiplier) || 1); return () => clampRoll(source()) / bonus; }

  return Object.freeze({ AFFIXES, CHAPTER_CONFIGS, MONSTER_COMPATIBILITY, getChapterConfig, getAllowedAffixIds, rollAffixes, applyAffixes, getDamageMultiplier, getDirectDamageLeech, getRegeneration, getDropBonus, createBonusRandom });
}));
