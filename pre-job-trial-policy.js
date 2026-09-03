(function attachPreJobTrialPolicy(root, factory) {
  const epicWeapons = typeof module === 'object' && module.exports ? require('./chapter-three-epic-weapon-policy.js') : root.ChapterThreeEpicWeaponPolicy;
  const api = factory(epicWeapons);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PreJobTrialPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createPreJobTrialPolicy(EpicWeapons) {
  'use strict';

  const DURATION_MS = 60000;
  const ENTRY = Object.freeze({ id: 'pre-job-trial', name: '轉職前試煉', bossName: '遠古試煉守護者', standalone: true });
  const MARKS = Object.freeze({
    wasteland: Object.freeze({ id: 'wasteland-trial-mark', name: '荒原試煉印記', mapIds: Object.freeze(['redrock-wastes-entrance', 'brokenrock-canyon']) }),
    war: Object.freeze({ id: 'war-trial-mark', name: '戰爭試煉印記', mapIds: Object.freeze(['bloodwar-wastes', 'skullcrusher-war-camp']) }),
    temple: Object.freeze({ id: 'temple-trial-mark', name: '聖殿試煉印記', mapIds: Object.freeze(['ancient-altar', 'redrock-temple']) })
  });
  const MARK_BY_MAP = new Map(Object.values(MARKS).flatMap((mark) => mark.mapIds.map((mapId) => [mapId, mark])));
  const MARK_DROP_RATES = Object.freeze({ normal: .03, elite: .08, boss: .15 });
  const PROOFS = Object.freeze([1, 2, 3].map((tier) => Object.freeze({ id: `hero-proof-${tier}`, name: `英雄之證${['','Ⅰ','Ⅱ','Ⅲ'][tier]}`, kind: 'progression-item', stackable: false, tier })));
  const CHESTS = Object.freeze([null,
    Object.freeze({ id: 'trial-chest-1', name: '試煉寶箱Ⅰ', tier: 1, coreChance: .35, tomeChance: .15, gold: null }),
    Object.freeze({ id: 'trial-chest-2', name: '試煉寶箱Ⅱ', tier: 2, coreChance: .50, tomeChance: .25, gold: null }),
    Object.freeze({ id: 'trial-chest-3', name: '試煉寶箱Ⅲ', tier: 3, coreChance: .70, tomeChance: .35, gold: null })
  ]);
  const THRESHOLDS = Object.freeze([null, null, null]);
  const BOSS_V1 = Object.freeze({ basicAttack: null, defense: null, maxHp: null, heavyMultiplier: 1.8, heavyCooldownMs: 10000, shockwaveMultiplier: 1, shockwaveCooldownMs: 15000, traumaDurationMs: 5000, traumaTickMultiplier: .20, intimidation: Object.freeze([{ atMs: 20000, damageMultiplier: 1.10 }, { atMs: 40000, damageMultiplier: 1.20 }]) });
  const CORE_EXCHANGE_COST = 5;

  function quantity(inventory, id) { return (inventory || []).filter((item) => item?.id === id).reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0); }
  function addStack(inventory, item, amount = 1) { const existing = inventory.find((entry) => entry?.id === item.id); if (existing) existing.quantity = quantity([existing], item.id) + amount; else inventory.push({ ...item, quantity: amount }); }
  function consume(inventory, id, amount) { let left = amount; inventory.filter((item) => item?.id === id).forEach((item) => { const used = Math.min(left, Math.max(0, Number(item.quantity) || 0)); item.quantity -= used; left -= used; }); return inventory.filter((item) => item?.kind === 'equipment' || Math.max(0, Number(item.quantity) || 0) > 0); }
  function rankOf(enemy) { return enemy?.isBoss || enemy?.rank === 'boss' ? 'boss' : enemy?.isElite || enemy?.rank === 'elite' ? 'elite' : 'normal'; }
  function rollMarkDrop(mapId, enemy = {}, random = Math.random) { const mark = MARK_BY_MAP.get(mapId); if (!mark) return null; return Number(random()) < MARK_DROP_RATES[rankOf(enemy)] ? Object.freeze({ ...mark, kind: 'trial-mark', stackable: true, quantity: 1, sourceMapId: mapId }) : null; }
  function grantMarkDrop(progress, mapId, enemy = {}, options = {}) { const drop = rollMarkDrop(mapId, enemy, options.random || Math.random); if (!drop) return null; progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : []; addStack(progress.inventory, drop, 1); return drop; }
  function getTier(damage, thresholds = THRESHOLDS) { let tier = 0; thresholds.forEach((value, index) => { if (Number.isFinite(value) && damage >= value) tier = index + 1; }); return tier; }
  function isCalibrated(config = {}) { const thresholds = config.thresholds || THRESHOLDS; const boss = config.boss || BOSS_V1; return thresholds.length === 3 && thresholds.every((value) => Number.isFinite(value) && value > 0) && Number.isFinite(boss.basicAttack) && Number.isFinite(boss.defense) && Number.isFinite(boss.maxHp); }
  function startTrial(progress, markId, now = Date.now(), config = {}) { if (!isCalibrated(config)) return { ok: false, code: 'balance-tbd' }; const mark = Object.values(MARKS).find((entry) => entry.id === markId); if (!mark || quantity(progress?.inventory, markId) < 1) return { ok: false, code: 'missing-mark' }; progress.inventory = consume(progress.inventory, markId, 1); return { ok: true, state: { id: `${now}`, startedAt: now, endsAt: now + DURATION_MS, damage: 0, tier: 0, finished: false, finishReason: null } }; }
  function recordDamage(state, actualDamage, thresholds = THRESHOLDS) { if (!state || state.finished) return state; state.damage += Math.max(0, Number(actualDamage) || 0); state.tier = getTier(state.damage, thresholds); if (state.tier >= 3) { state.finished = true; state.finishReason = 'tier-3'; } return state; }
  function shouldFinish(state, now = Date.now(), partyDefeated = false) { return Boolean(state?.finished || partyDefeated || now >= Number(state?.endsAt)); }
  function normalizeTrialProgress(value) { const source = value && typeof value === 'object' ? value : {}; return { proofTiers: [1,2,3].filter((tier) => source.proofTiers?.includes(tier)), bestDamage: Math.max(0, Number(source.bestDamage) || 0), bestTier: Math.max(0, Math.min(3, Number(source.bestTier) || 0)) }; }
  function finishTrial(progress, state) { const trial = normalizeTrialProgress(progress.preJobTrial); const tier = Math.max(0, Math.min(3, Number(state?.tier) || 0)); const newProofs = PROOFS.filter((proof) => proof.tier <= tier && !trial.proofTiers.includes(proof.tier)); trial.proofTiers.push(...newProofs.map((proof) => proof.tier)); trial.proofTiers.sort(); trial.bestDamage = Math.max(trial.bestDamage, Math.max(0, Number(state?.damage) || 0)); trial.bestTier = Math.max(trial.bestTier, tier); progress.preJobTrial = trial; progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : []; newProofs.forEach((proof) => addStack(progress.inventory, proof, 1)); const chest = tier > 0 ? CHESTS[tier] : null; if (chest) addStack(progress.inventory, chest, 1); return Object.freeze({ tier, damage: state?.damage || 0, proofs: newProofs, chest }); }
  function openChest(progress, tier, options = {}) { const chest = CHESTS[tier]; if (!chest || quantity(progress?.inventory, chest.id) < 1) return { ok: false, code: 'missing-chest' }; if (!Number.isFinite(chest.gold)) return { ok: false, code: 'gold-tbd' }; const random = options.random || Math.random; const cores = Object.values(EpicWeapons?.WEAPON_CORES || {}); const core = random() < chest.coreChance && cores.length ? cores[Math.min(cores.length - 1, Math.floor(random() * cores.length))] : null; const tome = random() < chest.tomeChance ? { id: 'divine-tome-tier-1', name: '神聖法書（一階）', kind: 'skill-material', stackable: true } : null; progress.inventory = consume(progress.inventory, chest.id, 1); if (core) addStack(progress.inventory, core, 1); if (tome) addStack(progress.inventory, tome, 1); progress.gold = (Number(progress.gold) || 0) + chest.gold; return { ok: true, core, tome, gold: chest.gold };
  }
  function exchangeCores(progress, targetCoreId, offered = {}) { const cores = Object.values(EpicWeapons?.WEAPON_CORES || {}); if (!cores.some((core) => core.id === targetCoreId)) return { ok: false, code: 'invalid-target' }; if (Number(offered[targetCoreId]) > 0) return { ok: false, code: 'target-core-as-material' }; const entries = Object.entries(offered).filter(([id, amount]) => cores.some((core) => core.id === id) && Number(amount) > 0); if (entries.reduce((sum, [, amount]) => sum + Math.floor(Number(amount)), 0) !== CORE_EXCHANGE_COST) return { ok: false, code: 'invalid-cost' }; const missing = entries.find(([id, amount]) => quantity(progress?.inventory, id) < Math.floor(Number(amount))); if (missing) return { ok: false, code: 'missing-core', itemId: missing[0] }; let next = [...progress.inventory]; entries.forEach(([id, amount]) => { next = consume(next, id, Math.floor(Number(amount))); }); addStack(next, cores.find((core) => core.id === targetCoreId), 1); progress.inventory = next; return { ok: true, targetCoreId };
  }
  return Object.freeze({ DURATION_MS, ENTRY, MARKS, MARK_DROP_RATES, PROOFS, CHESTS, THRESHOLDS, BOSS_V1, CORE_EXCHANGE_COST, rollMarkDrop, grantMarkDrop, getTier, isCalibrated, startTrial, recordDamage, shouldFinish, normalizeTrialProgress, finishTrial, openChest, exchangeCores });
}));
