(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BlackstoneStrongholdPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RULES = Object.freeze({
    dungeonId: 'blackstone-stronghold',
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
      faction: 'blackstone-bandits',
      image: null,
      stats: null,
      dropTableId: null,
      skillIds: Object.freeze([]),
      aiProfileId: null,
      implemented: false,
      ...options
    });
  }

  const MONSTERS = Object.freeze([
    monster('blackstone-guard', '黑石守衛', 'normal', 'human', '重甲前排', { image: 'assets/blackstone-guard.png' }),
    monster('blackstone-crossbowman', '黑石弩手', 'normal', 'goblin', '遠程輸出', { image: 'assets/blackstone-crossbowman.png', faction: 'blackstone-goblins' }),
    monster('blackstone-berserker', '黑石狂戰士', 'normal', 'orc', '雙斧近戰', { image: 'assets/blackstone-berserker.png' }),
    monster('blackstone-warhound', '黑石戰犬', 'normal', 'beast', '高速近戰', { image: 'assets/blackstone-warhound.png', faction: 'blackstone-beasts' }),
    monster('blackstone-lion-guard', '黑石獅衛', 'elite', 'lionkin', '高攻擊近戰', { image: 'assets/blackstone-lion-guard.png' }),
    monster('blackstone-bullhorn-warrior', '黑石蠻角勇士', 'elite', 'bullkin', '高血量／重擊', { image: 'assets/blackstone-bullhorn-warrior.png' }),
    monster('blackstone-warlord', '黑石督軍', 'boss', 'orc', '據點指揮官', { image: 'assets/blackstone-warlord.png' })
  ]);

  const MONSTER_BY_ID = new Map(MONSTERS.map((entry) => [entry.id, entry]));
  function getMonster(monsterId) { return MONSTER_BY_ID.get(monsterId) || null; }
  function getMonstersByRank(rank) { return MONSTERS.filter((entry) => entry.rank === rank); }

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

  return Object.freeze({ RULES, MONSTERS, OUTPOSTS, getMonster, getMonstersByRank, getOutpost, getOutpostEffect, rollOutpostId, rollRequiredKills, createState, normalizeState, recordMonsterKill, destroyOutpost, getEnrage });
});
