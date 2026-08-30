(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RunePolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const RUNES = Object.freeze({
    strength: Object.freeze({ id: 'rune-strength', key: 'strength', name: '力量符文', chapter: 2, kind: 'rune', stat: 'attackPercent', value: .03, icon: '◆' }),
    guard: Object.freeze({ id: 'rune-guard', key: 'guard', name: '守護符文', chapter: 2, kind: 'rune', stat: 'defensePercent', value: .03, icon: '◇' }),
    life: Object.freeze({ id: 'rune-life', key: 'life', name: '生命符文', chapter: 2, kind: 'rune', stat: 'maxHpPercent', value: .04, icon: '♥' }),
    fatal: Object.freeze({ id: 'rune-fatal', key: 'fatal', name: '致命符文', chapter: 2, kind: 'rune', stat: 'criticalChance', value: .02, icon: '✦' }),
    psionic: Object.freeze({ id: 'rune-psionic', key: 'psionic', name: '靈能符文', chapter: 2, kind: 'rune', stat: 'resourceMaxPercent', value: .05, icon: '◉' })
  });
  const RUNE_BY_ID = new Map(Object.values(RUNES).map((rune) => [rune.id, rune]));
  const WORDS = Object.freeze({
    battleWill: Object.freeze({ id: 'battle-will', name: '戰意', sequence: ['strength', 'life'], effect: { highHpAttack: .08 } }),
    ironWall: Object.freeze({ id: 'iron-wall', name: '鐵壁', sequence: ['guard', 'life'], effect: { incomingTriggerChance: .15, incomingReduction: .20 } }),
    frenzy: Object.freeze({ id: 'frenzy', name: '狂擊', sequence: ['strength', 'fatal'], effect: { criticalAttackSpeed: .08, durationMs: 3000 } }),
    meditation: Object.freeze({ id: 'meditation', name: '冥想', sequence: ['psionic', 'life'], effect: { intervalMs: 5000, resourceRecovery: .03 } }),
    conquest: Object.freeze({ id: 'conquest', name: '征服', sequence: ['strength', 'life', 'fatal'], effect: { damagePerStack: .02, maxStacks: 5 } }),
    unyielding: Object.freeze({ id: 'unyielding', name: '不屈', sequence: ['guard', 'life', 'psionic'], effect: { hpThreshold: .30, incomingReduction: .20, durationMs: 5000, cooldownMs: 20000 } })
  });
  const NATURAL_SOCKET_WEIGHTS = Object.freeze({ weapon: Object.freeze([.85, .10, .04, .01]), armor: Object.freeze([.88, .10, .02]) });
  function isWeapon(item) { return item?.slot === 'weapon'; }
  function getMaxSockets(item) { return isWeapon(item) ? 3 : item?.kind === 'equipment' ? 2 : 0; }
  function rollNaturalSockets(item, chapter, random = Math.random) {
    if (Number(chapter) < 2) return 0;
    const weights = NATURAL_SOCKET_WEIGHTS[isWeapon(item) ? 'weapon' : 'armor'];
    const roll = Math.max(0, Math.min(.999999, Number(random()) || 0));
    let cumulative = 0;
    for (let sockets = 0; sockets < weights.length; sockets += 1) { cumulative += weights[sockets]; if (roll < Number(cumulative.toFixed(8))) return sockets; }
    return weights.length - 1;
  }
  function normalizeEquipment(item) {
    if (!item || item.kind !== 'equipment') return item;
    const max = getMaxSockets(item), sockets = Math.min(max, Math.max(0, Math.floor(Number(item.sockets) || 0)));
    return { ...item, sockets, socketedRunes: (Array.isArray(item.socketedRunes) ? item.socketedRunes : []).slice(0, sockets).filter((id) => RUNE_BY_ID.has(id)) };
  }
  function getWord(item) {
    const keys = (item?.socketedRunes || []).map((id) => RUNE_BY_ID.get(id)?.key).filter(Boolean);
    return Object.values(WORDS).find((word) => word.sequence.length === keys.length && word.sequence.every((key, index) => keys[index] === key)) || null;
  }
  function socketRune(progress, itemId, runeId) {
    const item = (progress?.inventory || []).find((entry) => entry.id === itemId) || Object.values(progress?.equipment || {}).find((entry) => entry?.id === itemId);
    const rune = RUNE_BY_ID.get(runeId), runeItem = (progress?.inventory || []).find((entry) => entry.id === runeId && Number(entry.quantity) > 0);
    if (!item || !rune || !runeItem) return { ok: false, reason: 'missing' };
    const normalized = normalizeEquipment(item); if (normalized.socketedRunes.length >= normalized.sockets) return { ok: false, reason: 'full' };
    item.sockets = normalized.sockets; item.socketedRunes = [...normalized.socketedRunes, runeId]; runeItem.quantity -= 1;
    if (runeItem.quantity <= 0) progress.inventory.splice(progress.inventory.indexOf(runeItem), 1);
    return { ok: true, item, rune, word: getWord(item) };
  }
  function requestSocket(item) { return getMaxSockets(item) <= Number(item?.sockets || 0) ? { ok: false, reason: 'max' } : { ok: false, reason: 'price-pending' }; }
  function getBonuses(equipment) {
    const totals = { attackPercent: 0, defensePercent: 0, maxHpPercent: 0, criticalChance: 0, resourceMaxPercent: 0 };
    Object.values(equipment || {}).filter(Boolean).forEach((item) => (item.socketedRunes || []).forEach((id) => { const rune = RUNE_BY_ID.get(id); if (rune) totals[rune.stat] += rune.value; }));
    return totals;
  }
  function getActiveWords(equipment) { return Object.values(equipment || {}).map(getWord).filter(Boolean); }
  function hasWord(equipment, id) { return getActiveWords(equipment).some((word) => word.id === id); }
  return Object.freeze({ RUNES, WORDS, NATURAL_SOCKET_WEIGHTS, RUNE_BY_ID, getMaxSockets, rollNaturalSockets, normalizeEquipment, getWord, socketRune, requestSocket, getBonuses, getActiveWords, hasWord });
});
