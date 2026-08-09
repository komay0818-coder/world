(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BlackstoneStrongholdPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RULES = Object.freeze({
    dungeonId: 'blackstone-stronghold',
    level: 21,
    gameplayType: 'outpost-siege',
    objectiveCount: 5,
    minKillsPerOutpost: 10,
    maxKillsPerOutpost: 70,
    outpostDamageReduction: null,
    outpostShield: null,
    enrageAttackBonus: .30,
    enrageAttackSpeedBonus: .30,
    enrageDurationMs: 15000
  });

  function monster(id, name, rank, race, role, options = {}) {
    return Object.freeze({
      id,
      name,
      rank,
      race,
      role,
      chapter: 2,
      mapId: RULES.dungeonId,
      level: RULES.level,
      faction: 'blackstone-bandits',
      image: null,
      stats: null,
      dropTableId: 'blackstone-stronghold-pending',
      skillIds: Object.freeze([]),
      aiProfileId: null,
      implemented: false,
      ...options
    });
  }

  const MONSTERS = Object.freeze([
    monster('blackstone-guard', '黑石守衛', 'normal', 'human', '重甲前排', { combatId: 'blackstoneStrongholdGuard', image: 'assets/blackstone-guard.png', stats: Object.freeze({ maxHp: 520, attack: 54, defense: 48, evasion: 2, parry: 18, damageReduction: 14, attackSpeed: .78, xp: 55, gold: 28 }), skillIds: Object.freeze(['shield-wall', 'shield-bash']), aiProfileId: 'stronghold-armored-guardian', implemented: true }),
    monster('blackstone-crossbowman', '黑石弩手', 'normal', 'goblin', '遠程輸出', { combatId: 'blackstoneStrongholdCrossbowman', image: 'assets/blackstone-crossbowman.png', faction: 'blackstone-goblins', stats: Object.freeze({ maxHp: 340, attack: 66, defense: 25, evasion: 10, parry: 3, damageReduction: 3, attackSpeed: 1, xp: 54, gold: 29 }), skillIds: Object.freeze(['armor-piercing-bolt', 'aimed-volley']), aiProfileId: 'stronghold-ranged-burst', implemented: true }),
    monster('blackstone-berserker', '黑石狂戰士', 'normal', 'orc', '雙斧近戰', { combatId: 'blackstoneStrongholdBerserker', image: 'assets/blackstone-berserker.png', stats: Object.freeze({ maxHp: 440, attack: 62, defense: 28, evasion: 6, parry: 8, damageReduction: 5, attackSpeed: 1.15, xp: 58, gold: 31 }), skillIds: Object.freeze(['blood-frenzy', 'twin-axe-cleave']), aiProfileId: 'stronghold-low-health-berserker', implemented: true }),
    monster('blackstone-warhound', '黑石戰犬', 'normal', 'beast', '高速近戰', { combatId: 'blackstoneStrongholdWarhound', image: 'assets/blackstone-warhound.png', faction: 'blackstone-beasts', stats: Object.freeze({ maxHp: 380, attack: 55, defense: 24, evasion: 17, parry: 0, damageReduction: 4, attackSpeed: 1.4, xp: 56, gold: 27 }), skillIds: Object.freeze(['rending-bite', 'hunting-pounce']), aiProfileId: 'stronghold-fast-bleeder', implemented: true }),
    monster('blackstone-lion-guard', '黑石獅衛', 'elite', 'lionkin', '高攻擊近戰', { combatId: 'blackstoneStrongholdLionGuard', image: 'assets/blackstone-lion-guard.png', stats: Object.freeze({ maxHp: 1250, attack: 82, defense: 58, evasion: 8, parry: 14, damageReduction: 12, attackSpeed: .9, xp: 180, gold: 105 }), skillIds: Object.freeze(['lion-roar', 'crushing-hammer']), aiProfileId: 'stronghold-elite-bruiser', implemented: true }),
    monster('blackstone-bullhorn-warrior', '黑石蠻角勇士', 'elite', 'bullkin', '高血量／重擊', { combatId: 'blackstoneStrongholdBullhornWarrior', image: 'assets/blackstone-bullhorn-warrior.png', stats: Object.freeze({ maxHp: 1550, attack: 78, defense: 64, evasion: 3, parry: 8, damageReduction: 16, attackSpeed: .75, xp: 195, gold: 115 }), skillIds: Object.freeze(['bullhorn-stampede', 'seismic-smash']), aiProfileId: 'stronghold-elite-charger', implemented: true }),
    monster('blackstone-warlord', '黑石督軍', 'boss', 'orc', '據點指揮官', { combatId: 'blackstoneStrongholdWarlord', image: 'assets/blackstone-warlord.png', stats: Object.freeze({ maxHp: 6200, attack: 96, defense: 78, evasion: 4, parry: 16, damageReduction: 18, attackSpeed: .88, xp: 750, gold: 450 }), skillIds: Object.freeze(['warlord-command', 'warhammer-sweep', 'warlord-execution', 'last-stand']), aiProfileId: 'stronghold-three-phase-warlord', implemented: true })
  ]);

  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));
  function getMonster(monsterId) { return MONSTER_BY_ID.get(monsterId) || null; }
  function getMonstersByRank(rank) { return MONSTERS.filter((entry) => entry.rank === rank); }

  const GUARD = Object.freeze({ shieldWallThreshold: .50, shieldWallDefenseBonus: .25, bashChance: .20, bashDamageMultiplier: 1.10, bashStunMs: 1000 });
  const CROSSBOWMAN = Object.freeze({ piercingChance: .30, piercingDefenseIgnore: .35, volleyChance: .12, volleyDamageMultiplier: 1.65 });
  const BERSERKER = Object.freeze({ frenzyThreshold: .40, attackBonus: .25, attackSpeedBonus: .20, defensePenalty: .15, cleaveChance: .30, cleaveDamageMultiplier: 1.35 });
  const WARHOUND = Object.freeze({ bleedChance: .30, bleedDurationMs: 4000, bleedTickMs: 1000, bleedAttackRatio: .07, pounceChance: .18, pounceDamageMultiplier: 1.45 });
  const LION_GUARD = Object.freeze({ roarChance: .20, roarDurationMs: 6000, roarAttackBonus: .15, hammerChance: .30, hammerDamageMultiplier: 1.55 });
  const BULLHORN = Object.freeze({ stampedeChance: .22, stampedeDamageMultiplier: 1.50, stampedeStunMs: 1200, smashChance: .22, smashDamageMultiplier: 1.70 });
  const WARLORD = Object.freeze({ phaseTwoThreshold: .70, phaseThreeThreshold: .35, phaseTwoAttackBonus: .10, phaseThreeAttackBonus: .25, phaseThreeAttackSpeedBonus: .15, phaseThreeDefensePenalty: .10, commandChance: .18, sweepChance: .28, executionThreshold: .30, executionChance: .18 });

  function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, Number(value) || 0)); }
  function rollLevel(monsterId) { return MONSTERS.some((entry) => entry.id === monsterId || entry.combatId === monsterId) ? RULES.level : null; }
  function toCombatMonster(entry) {
    if (!entry?.stats) return null;
    return { id: entry.combatId, policyId: entry.id, name: entry.name, level: RULES.level, mapId: RULES.dungeonId, ...entry.stats,
      isElite: entry.rank === 'elite', isBoss: entry.rank === 'boss', faction: entry.faction,
      artClass: `monster-image-art ${entry.combatId}`, image: entry.image, skillIds: entry.skillIds };
  }
  function getCombatMonster(monsterId) { return toCombatMonster(MONSTERS.find((entry) => entry.id === monsterId || entry.combatId === monsterId)); }
  function getCombatPool() {
    return Object.freeze({
      normal: Object.freeze(getMonstersByRank('normal').map((entry) => entry.combatId)),
      elite: Object.freeze(getMonstersByRank('elite').map((entry) => entry.combatId)),
      boss: Object.freeze(getMonstersByRank('boss').map((entry) => entry.combatId))
    });
  }
  function getBossPhase(monsterId, currentHp, maxHp) {
    if (!['blackstone-warlord', 'blackstoneStrongholdWarlord'].includes(monsterId) || !(Number(maxHp) > 0)) return 1;
    const ratio = Math.max(0, Number(currentHp) || 0) / Number(maxHp);
    return ratio <= WARLORD.phaseThreeThreshold ? 3 : ratio <= WARLORD.phaseTwoThreshold ? 2 : 1;
  }
  function getCombatMultipliers(monsterId, currentHp, maxHp) {
    const ratio = Number(maxHp) > 0 ? Math.max(0, Number(currentHp) || 0) / Number(maxHp) : 1;
    if (['blackstone-guard', 'blackstoneStrongholdGuard'].includes(monsterId) && ratio <= GUARD.shieldWallThreshold) return { attack: 1, attackSpeed: 1, defense: 1 + GUARD.shieldWallDefenseBonus, evasion: 0 };
    if (['blackstone-berserker', 'blackstoneStrongholdBerserker'].includes(monsterId) && ratio <= BERSERKER.frenzyThreshold) return { attack: 1 + BERSERKER.attackBonus, attackSpeed: 1 + BERSERKER.attackSpeedBonus, defense: 1 - BERSERKER.defensePenalty, evasion: 0 };
    const phase = getBossPhase(monsterId, currentHp, maxHp);
    if (phase === 3) return { attack: 1 + WARLORD.phaseThreeAttackBonus, attackSpeed: 1 + WARLORD.phaseThreeAttackSpeedBonus, defense: 1 - WARLORD.phaseThreeDefensePenalty, evasion: 0 };
    if (phase === 2) return { attack: 1 + WARLORD.phaseTwoAttackBonus, attackSpeed: 1, defense: 1, evasion: 0 };
    return { attack: 1, attackSpeed: 1, defense: 1, evasion: 0 };
  }
  function resolveAction(monsterId, randomValue, targetHpRatio = 1, currentHp = 1, maxHp = 1) {
    const roll = clamp(randomValue, 0, .999999);
    if (['blackstone-guard', 'blackstoneStrongholdGuard'].includes(monsterId)) return roll < GUARD.bashChance ? 'shield-bash' : 'attack';
    if (['blackstone-crossbowman', 'blackstoneStrongholdCrossbowman'].includes(monsterId)) return roll < CROSSBOWMAN.volleyChance ? 'aimed-volley' : roll < CROSSBOWMAN.volleyChance + CROSSBOWMAN.piercingChance ? 'armor-piercing-bolt' : 'attack';
    if (['blackstone-berserker', 'blackstoneStrongholdBerserker'].includes(monsterId)) return roll < BERSERKER.cleaveChance ? 'twin-axe-cleave' : 'attack';
    if (['blackstone-warhound', 'blackstoneStrongholdWarhound'].includes(monsterId)) return roll < WARHOUND.pounceChance ? 'hunting-pounce' : roll < WARHOUND.pounceChance + WARHOUND.bleedChance ? 'rending-bite' : 'attack';
    if (['blackstone-lion-guard', 'blackstoneStrongholdLionGuard'].includes(monsterId)) return roll < LION_GUARD.roarChance ? 'lion-roar' : roll < LION_GUARD.roarChance + LION_GUARD.hammerChance ? 'crushing-hammer' : 'attack';
    if (['blackstone-bullhorn-warrior', 'blackstoneStrongholdBullhornWarrior'].includes(monsterId)) return roll < BULLHORN.stampedeChance ? 'bullhorn-stampede' : roll < BULLHORN.stampedeChance + BULLHORN.smashChance ? 'seismic-smash' : 'attack';
    if (['blackstone-warlord', 'blackstoneStrongholdWarlord'].includes(monsterId)) {
      const phase = getBossPhase(monsterId, currentHp, maxHp);
      if (phase === 3 && targetHpRatio <= WARLORD.executionThreshold && roll < WARLORD.executionChance) return 'warlord-execution';
      if (phase >= 2 && roll < WARLORD.commandChance) return 'warlord-command';
      if (roll < WARLORD.commandChance + WARLORD.sweepChance) return 'warhammer-sweep';
    }
    return 'attack';
  }
  function getDamageMultiplier(action) {
    return ({ 'shield-bash': GUARD.bashDamageMultiplier, 'aimed-volley': CROSSBOWMAN.volleyDamageMultiplier,
      'twin-axe-cleave': BERSERKER.cleaveDamageMultiplier, 'hunting-pounce': WARHOUND.pounceDamageMultiplier,
      'crushing-hammer': LION_GUARD.hammerDamageMultiplier, 'bullhorn-stampede': BULLHORN.stampedeDamageMultiplier,
      'seismic-smash': BULLHORN.smashDamageMultiplier, 'warhammer-sweep': 1.50, 'warlord-command': 1.25, 'warlord-execution': 2.10 })[action] || 1;
  }
  function getDefenseIgnore(action) { return action === 'armor-piercing-bolt' ? CROSSBOWMAN.piercingDefenseIgnore : 0; }

  function outpost(id, name, image, effect) {
    return Object.freeze({ id, name, image, effect: Object.freeze(effect), implemented: true });
  }

  const OUTPOSTS = Object.freeze([
    outpost('blackstone-supply-station', '補給站', 'assets/blackstone-supply-station.png', { stat: 'healthRegenPerSecond', operation: 'add-max-health-ratio', value: .01, label: '敵軍每秒恢復 1% 最大生命' }),
    outpost('blackstone-barracks', '兵營', 'assets/blackstone-barracks.png', { stat: 'maxHealth', operation: 'multiply', value: .20, label: '敵軍最大生命提高 20%' }),
    outpost('blackstone-armory', '軍械庫', 'assets/blackstone-armory.png', { stat: 'attack', operation: 'multiply', value: .15, label: '敵軍攻擊提高 15%' }),
    outpost('blackstone-watchtower', '哨塔', 'assets/blackstone-watchtower.png', { stat: 'criticalChance', operation: 'add', value: .10, label: '敵軍暴擊率提高 10%' }),
    outpost('blackstone-command-tent', '指揮帳篷', 'assets/blackstone-command-tent.png', { stat: 'attackSpeed', operation: 'multiply', value: .15, label: '敵軍攻速提高 15%' })
  ]);
  const OUTPOST_BY_ID = new Map(OUTPOSTS.map((entry) => [entry.id, entry]));
  function getOutpost(outpostId) { return OUTPOST_BY_ID.get(outpostId) || null; }
  function getOutpostEffect(outpostId) { return getOutpost(outpostId)?.effect || null; }

  function normalizeRandom(random = Math.random) {
    return Math.max(0, Math.min(.999999, Number(random()) || 0));
  }

  function rollOutpostId(availableOutpostIds = OUTPOSTS.map((entry) => entry.id), random = Math.random) {
    const available = [...new Set(availableOutpostIds)].filter((id) => OUTPOST_BY_ID.has(id));
    if (!available.length) return null;
    return available[Math.floor(normalizeRandom(random) * available.length)];
  }

  function rollRequiredKills(random = Math.random) {
    const roll = normalizeRandom(random);
    return RULES.minKillsPerOutpost + Math.floor(roll * (RULES.maxKillsPerOutpost - RULES.minKillsPerOutpost + 1));
  }

  function createState(random = Math.random) {
    return { destroyedOutposts: 0, destroyedOutpostIds: [], availableOutpostIds: OUTPOSTS.map((entry) => entry.id), activeOutpostId: null, killsSinceOutpost: 0, nextOutpostAtKills: rollRequiredKills(random), outpostActive: false, bossSpawned: false, enragedUntil: 0 };
  }

  function normalizeState(saved, random = Math.random) {
    const source = saved && typeof saved === 'object' ? saved : {};
    const destroyedOutposts = Math.min(RULES.objectiveCount, Math.max(0, Math.floor(Number(source.destroyedOutposts) || 0)));
    const destroyedOutpostIds = [...new Set(Array.isArray(source.destroyedOutpostIds) ? source.destroyedOutpostIds : [])].filter((id) => OUTPOST_BY_ID.has(id)).slice(0, destroyedOutposts);
    const availableOutpostIds = OUTPOSTS.map((entry) => entry.id).filter((id) => !destroyedOutpostIds.includes(id));
    const sourceActiveOutpostId = OUTPOST_BY_ID.has(source.activeOutpostId) && availableOutpostIds.includes(source.activeOutpostId) ? source.activeOutpostId : null;
    const outpostActive = destroyedOutposts < RULES.objectiveCount && Boolean(source.outpostActive);
    const activeOutpostId = outpostActive ? (sourceActiveOutpostId || rollOutpostId(availableOutpostIds, random)) : null;
    const nextOutpostAtKills = Math.min(RULES.maxKillsPerOutpost, Math.max(RULES.minKillsPerOutpost, Math.floor(Number(source.nextOutpostAtKills) || rollRequiredKills(random))));
    return {
      destroyedOutposts,
      destroyedOutpostIds,
      availableOutpostIds,
      activeOutpostId,
      killsSinceOutpost: Math.max(0, Math.floor(Number(source.killsSinceOutpost) || 0)),
      nextOutpostAtKills,
      outpostActive,
      bossSpawned: destroyedOutposts >= RULES.objectiveCount || Boolean(source.bossSpawned),
      enragedUntil: Math.max(0, Number(source.enragedUntil) || 0)
    };
  }

  function recordMonsterKill(state, random = Math.random) {
    const next = normalizeState(state, random);
    if (next.bossSpawned || next.outpostActive) return next;
    next.killsSinceOutpost += 1;
    if (next.killsSinceOutpost >= next.nextOutpostAtKills || next.killsSinceOutpost >= RULES.maxKillsPerOutpost) {
      next.outpostActive = true;
      next.activeOutpostId = rollOutpostId(next.availableOutpostIds, random);
    }
    return next;
  }

  function destroyOutpost(state, options = {}) {
    const next = normalizeState(state, options.random);
    if (!next.outpostActive || next.bossSpawned) return { ok: false, reason: 'no-active-outpost', state: next };
    next.destroyedOutposts += 1;
    if (next.activeOutpostId && !next.destroyedOutpostIds.includes(next.activeOutpostId)) next.destroyedOutpostIds.push(next.activeOutpostId);
    next.availableOutpostIds = OUTPOSTS.map((entry) => entry.id).filter((id) => !next.destroyedOutpostIds.includes(id));
    const destroyedOutpostId = next.activeOutpostId;
    next.activeOutpostId = null;
    next.outpostActive = false;
    next.killsSinceOutpost = 0;
    next.enragedUntil = Math.max(0, Number(options.now) || Date.now()) + RULES.enrageDurationMs;
    next.bossSpawned = next.destroyedOutposts >= RULES.objectiveCount;
    next.nextOutpostAtKills = next.bossSpawned ? 0 : rollRequiredKills(options.random);
    return { ok: true, state: next, destroyedOutpostId, effectRemoved: getOutpostEffect(destroyedOutpostId), triggerEnrage: true, spawnBoss: next.bossSpawned };
  }

  function getEnrage(state, now = Date.now()) {
    const active = (Number(state?.enragedUntil) || 0) > now;
    return { active, attackBonus: active ? RULES.enrageAttackBonus : 0, attackSpeedBonus: active ? RULES.enrageAttackSpeedBonus : 0, remainingMs: active ? state.enragedUntil - now : 0 };
  }

  return Object.freeze({ RULES, GUARD, CROSSBOWMAN, BERSERKER, WARHOUND, LION_GUARD, BULLHORN, WARLORD, MONSTERS, OUTPOSTS,
    getMonster, getMonstersByRank, rollLevel, toCombatMonster, getCombatMonster, getCombatPool, getBossPhase, getCombatMultipliers,
    resolveAction, getDamageMultiplier, getDefenseIgnore, getOutpost, getOutpostEffect, rollOutpostId, rollRequiredKills,
    createState, normalizeState, recordMonsterKill, destroyOutpost, getEnrage });
});
