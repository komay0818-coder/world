'use strict';

const { loadGame } = require('./headless-game-runtime.js');

const game = loadGame();

game.evaluate(`
let formalNow = 0;
let formalSeed = 1;
let formalProgress = null;
let formalEnemy = null;

Date.now = () => formalNow;

function seedFormalCombat(seed) {
  formalSeed = seed >>> 0;
  Math.random = () => {
    formalSeed ^= formalSeed << 13;
    formalSeed ^= formalSeed >>> 17;
    formalSeed ^= formalSeed << 5;
    return (formalSeed >>> 0) / 4294967296;
  };
}

getProgress = () => formalProgress || getMainBattleMember()?.progress || { level: 45, equipment: emptyEquipment(), skillLevels: {} };
getActiveCharacter = () => getMainBattleMember()?.character || null;
getActiveMap = () => ({ id: 'formal-headless', chapter: 1, min: 1, max: 45 });
getEnemyDefinition = () => formalEnemy;
randomEnemyId = () => formalEnemy.id;
randomEliteId = () => formalEnemy.id;
randomBossId = () => formalEnemy.id;
createEnemyLevels = (types) => types.map(() => formalEnemy.level);
createEnemyAffixes = (types) => types.map(() => []);
updateBattleUI = () => {};
logBattle = () => {};
showToast = () => {};
playPartyMemberCombatAnimation = () => {};
playBattleSkillEffect = () => {};
playMonsterAttackAnimation = () => {};
renderDamageNumber = () => {};
rewardVictory = () => {};
saveProgress = () => {};

function formalSkillDefinitions(job, advancedClass) {
  const base = ClassSkillPolicy.getSkills(job);
  if (job === 'warrior') return [...base, ...WarriorAdvancementPolicy.getSkills(advancedClass)];
  if (job === 'mage') return [...base, ...MageAdvancementPolicy.getSkills(advancedClass)];
  return base;
}

function buildFormalSkillLevels(job, advancedClass, requested) {
  const definitions = formalSkillDefinitions(job, advancedClass);
  const byId = Object.fromEntries(definitions.map((skill) => [skill.id, skill]));
  const levels = Object.fromEntries(definitions.map((skill) => [job + ':' + skill.id, 5]));
  const explicit = requested?.levels || {};
  for (const [rawId, rawLevel] of Object.entries(explicit)) {
    const id = rawId.includes(':') ? rawId.split(':').pop() : rawId;
    if (!byId[id]) throw new Error('Unknown ' + job + ' skill: ' + id);
    const level = Number(rawLevel);
    if (!Number.isInteger(level) || level < 1 || level > 6) throw new Error('Skill level must be an integer from 1 to 6: ' + id);
    levels[job + ':' + id] = level;
  }
  for (const [type, id] of [['active', requested?.activeLv6], ['passive', requested?.passiveLv6]]) {
    if (!id) continue;
    if (!byId[id] || byId[id].type !== type) throw new Error('Invalid ' + type + ' Lv6 skill: ' + id);
    levels[job + ':' + id] = 6;
  }
  for (const type of ['active', 'passive']) {
    const specialized = definitions.filter((skill) => skill.type === type && levels[job + ':' + skill.id] === 6);
    if (specialized.length > 1) throw new Error('Only one ' + type + ' skill may be Lv6: ' + specialized.map((skill) => skill.id).join(', '));
  }
  return levels;
}

function setupFormalCombat(config) {
  seedFormalCombat(config.seed);
  const character = { id: 'formal-' + config.job, name: 'Formal ' + config.job, job: config.job, race: config.race || 'human' };
  formalProgress = {
    level: config.level || 45,
    advancedClass: config.advancedClass || '',
    gold: 0, potions: 0, manaPotions: 0, inventory: [],
    equipment: { ...emptyEquipment(), ...(config.equipment || {}) },
    skillLevels: buildFormalSkillLevels(config.job, config.advancedClass, config.skills || {})
  };
  const member = createBattlePartyMember({ character, progress: formalProgress }, 0, character.id, 0);
  formalEnemy = {
    id: 'formal-enemy', name: 'Formal Enemy', maxHp: config.enemy.hp,
    defense: config.enemy.defense || 0, attack: config.enemy.attack || 0,
    attackSpeed: config.enemy.attackSpeed || 1, level: config.enemy.level || 45,
    isBoss: config.mode === 'boss', evasion: config.enemy.evasion || 0,
    parry: config.enemy.parry || 0, damageReduction: config.enemy.damageReduction || 0,
    xp: 0, gold: 0
  };
  const count = config.mode === 'fixed-five' ? 5 : 1;
  battle = {
    enemyTypes: Array(count).fill(formalEnemy.id), enemyLevels: Array(count).fill(formalEnemy.level),
    enemyHps: Array(count).fill(formalEnemy.maxHp), enemyRespawns: Array(count).fill(null),
    enemySpawnedAt: Array.from({ length: count }, (_, index) => index),
    enemyNextAttackAt: Array(count).fill(1000), enemyDots: Array.from({ length: count }, () => []),
    enemyDamages: Array.from({ length: count }, () => []), enemySkillStates: Array(count).fill(null),
    enemySummonProfiles: Array(count).fill(null), enemyAffixes: Array.from({ length: count }, () => []),
    enemyAffixRegenAt: Array(count).fill(0), enemyBoarEnraged: Array(count).fill(false),
    enemyTrailSummoned: Array(count).fill(false), enemyAssassinDashUntil: Array(count).fill(0),
    enemySpiderNestPhase: Array(count).fill(1), enemyDepthsPhase: Array(count).fill(1),
    partyMembers: [member], monsterMoveSpeed: 400, targetIndexes: [], damageTimers: [],
    rewardedEnemyIndexes: new Set(), roundLoot: {}, isDungeon: config.mode === 'boss',
    dungeonId: null, dungeonWave: 1, dungeonComplete: false, waveTransitioning: false,
    globalSkillReadyAt: 0, skillCooldowns: {}, lastStrongholdRegenAt: 0
  };
  fighting = true;
  return member;
}

function formalSnapshot(member, duration, cycle) {
  const combat = JSON.parse(JSON.stringify(CombatCorePolicy.telemetry(member)));
  const basicDamage = combat.damageBySource['basic-attack'] || 0;
  const skillDamage = {};
  for (const [source, damage] of Object.entries(combat.damageBySource)) {
    if (source !== 'basic-attack') skillDamage[source] = damage;
  }
  return {
    duration, ttk: battle.isDungeon ? duration : null, totalDamage: combat.totalDamage,
    dps: combat.totalDamage / Math.max(.1, duration), killsPerMinute: battle.isDungeon ? null : combat.kills / Math.max(.1, duration) * 60,
    basicDamage, basicShare: combat.totalDamage ? basicDamage / combat.totalDamage : 0,
    skillDamage, skillShares: Object.fromEntries(Object.entries(skillDamage).map(([id, damage]) => [id, combat.totalDamage ? damage / combat.totalDamage : 0])),
    skillCasts: combat.skillCasts,
    criticalRate: combat.criticalRolls ? combat.criticalHits / combat.criticalRolls : 0,
    aoeDamage: combat.aoeDamage, aoeShare: combat.totalDamage ? combat.aoeDamage / combat.totalDamage : 0,
    cycle, combat,
    final: {
      hp: member.currentHp, maxHp: member.maxHp, defense: member.stats.defense, resource: member.resourceCurrent, alive: member.alive,
      cooldowns: { ...member.skillCooldowns }, enemyHps: [...battle.enemyHps],
      enemyRespawns: [...battle.enemyRespawns], enemySkillStates: JSON.parse(JSON.stringify(battle.enemySkillStates)),
      warriorState: {
        skillHasteUntil: member.skillHasteUntil || 0, bloodRageUntil: member.bloodRageUntil || 0,
        weaponStanceUntil: member.weaponStanceUntil || 0, unyieldingUntil: member.unyieldingUntil || 0,
        fatalSlashUntil: member.fatalSlashUntil || 0, weaponGrandmasterBasicUntil: member.weaponGrandmasterBasicUntil || 0,
        weaponGrandmasterSkillUntil: member.weaponGrandmasterSkillUntil || 0
      }
    }
  };
}

function runFormalCombat(config) {
  const member = setupFormalCombat(config);
  const cycle = [];
  const limitMs = (config.mode === 'boss' ? config.maxSeconds : config.seconds) * 1000;
  for (formalNow = 0; formalNow < limitMs && fighting && (config.mode !== 'boss' || battle.enemyHps[0] > 0); formalNow += 100) {
    const before = { ...CombatCorePolicy.telemetry(member).skillCasts };
    autoSkillTick();
    if (config.entry === 'ui') battleTick();
    else CombatCorePolicy.runPlayerTick(createBattleTickRuntime(), formalNow);
    enemyAttackTick();
    const after = CombatCorePolicy.telemetry(member).skillCasts;
    for (const [id, casts] of Object.entries(after)) {
      if (casts > (before[id] || 0)) cycle.push({ atMs: formalNow, skill: id, cooldownReadyAt: member.skillCooldowns[id] || formalNow });
    }
  }
  if (config.mode === 'boss' && battle.enemyHps[0] > 0) throw new Error('Boss did not die within maxSeconds');
  return formalSnapshot(member, formalNow / 1000, cycle);
}
`);

function normalizeConfig(input = {}) {
  const mode = input.mode || 'fixed-five';
  if (!['fixed-five', 'boss'].includes(mode)) throw new Error(`Unsupported mode: ${mode}`);
  if (!input.job) throw new Error('job is required');
  return {
    job: input.job, advancedClass: input.advancedClass || '', race: input.race || 'human', level: input.level || 45,
    equipment: input.equipment || {}, skills: input.skills || {}, mode, seed: input.seed ?? 1,
    seconds: input.seconds || 60, maxSeconds: input.maxSeconds || 600, entry: input.entry || 'headless',
    enemy: { hp: mode === 'boss' ? 25000 : 1200, defense: 20, attack: 8, attackSpeed: 1, level: 45, ...(input.enemy || {}) }
  };
}

function runCombat(input) {
  const config = normalizeConfig(input);
  return game.evaluate(`runFormalCombat(${JSON.stringify(config)})`);
}

function listSkills(job, advancedClass = '') {
  return game.evaluate(`formalSkillDefinitions(${JSON.stringify(job)}, ${JSON.stringify(advancedClass)}).map(({id,name,type,cooldown})=>({id,name,type,cooldown}))`);
}

module.exports = { runCombat, listSkills };
