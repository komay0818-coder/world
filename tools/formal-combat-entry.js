'use strict';

const { loadGame } = require('./headless-game-runtime.js');

const game = loadGame();

game.evaluate(`
let formalNow = 0;
let formalSeed = 1;
let formalProgress = null;
let formalEnemy = null;
let formalTimers = [];
let formalTimerSequence = 0;
let formalSensitivity = { petDamageMultiplier: 1, wildBondLv6Scale: 1 };

Date.now = () => formalNow;
setTimeout = (callback, delay = 0) => { const id = ++formalTimerSequence; formalTimers.push({ id, at: formalNow + Math.max(0, Number(delay) || 0), callback }); return id; };
clearTimeout = (id) => { formalTimers = formalTimers.filter((timer) => timer.id !== id); };
function runFormalTimers() { for (;;) { const due = formalTimers.filter((timer) => timer.at <= formalNow).sort((a,b)=>a.at-b.at||a.id-b.id)[0]; if (!due) break; formalTimers = formalTimers.filter((timer) => timer.id !== due.id); due.callback(); } }
getCombatSensitivityDamageMultiplier = (source) => ['pet-basic','pet-bite','beast-slam'].includes(source) ? formalSensitivity.petDamageMultiplier : 1;
getCombatSensitivityWildBondLv6Scale = () => formalSensitivity.wildBondLv6Scale;

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
openVillage = () => {};
playPartyMemberCombatAnimation = () => {};
playBattleSkillEffect = () => {};
playMonsterAttackAnimation = () => {};
renderDamageNumber = () => {};
rewardVictory = () => {};
saveProgress = () => {};

function formalSkillDefinitions(job, advancedClass) {
  const base = ClassSkillPolicy.getSkills(job);
  if (job === 'warrior') return [...base, ...WarriorAdvancementPolicy.getSkills(advancedClass)];
  if (job === 'assassin') return [...base, ...RogueAdvancementPolicy.getSkills(advancedClass)];
  if (job === 'hunter') return [...base, ...HunterAdvancementPolicy.getSkills(advancedClass)];
  if (job === 'mage') return [...base, ...MageAdvancementPolicy.getSkills(advancedClass)];
  if (job === 'priest') return [...base, ...PriestAdvancementPolicy.getSkills(advancedClass)];
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
  formalTimers=[];formalTimerSequence=0;
  formalSensitivity={petDamageMultiplier:config.sensitivity?.petDamageMultiplier??1,wildBondLv6Scale:config.sensitivity?.wildBondLv6Scale??1};
  const character = { id: 'formal-' + config.job, name: 'Formal ' + config.job, job: config.job, race: config.race || 'human' };
  const formalEquipment = { ...emptyEquipment(), ...(config.equipment || {}) };
  if (config.job === 'hunter') HunterArrowPolicy.ensureStarterQuiver(formalEquipment);
  formalProgress = {
    level: config.level || 45,
    advancedClass: config.advancedClass || '',
    gold: 0, potions: config.potions || 0, manaPotions: 0, inventory: config.potions ? [{ id:'healing-potion',kind:'consumable',quantity:config.potions }] : [],
    equipment: formalEquipment,
    skillLevels: buildFormalSkillLevels(config.job, config.advancedClass, config.skills || {})
  };
  if (config.job === 'assassin') {
    formalProgress.energy = config.initialResource ?? AssassinEnergyPolicy.MAX_ENERGY;
    formalProgress.maxEnergy = AssassinEnergyPolicy.MAX_ENERGY;
    formalProgress.energyUpdatedAt = 0;
  }
  const member = createBattlePartyMember({ character, progress: formalProgress }, 0, character.id, 0);
  if (config.initialResource !== null && config.initialResource !== undefined) member.resourceCurrent = Math.max(0, Math.min(member.resourceMax, Number(config.initialResource) || 0));
  formalEnemy = {
    id: 'formal-enemy', name: 'Formal Enemy', maxHp: config.enemy.hp,
    defense: config.enemy.defense || 0, attack: config.enemy.attack || 0,
    attackSpeed: config.enemy.attackSpeed || 1, level: config.enemy.level || 45,
    isBoss: config.mode === 'boss', evasion: config.enemy.evasion || 0,
    parry: config.enemy.parry || 0, damageReduction: config.enemy.damageReduction || 0,
    xp: 0, gold: 0
  };
  const partyMembers=[member];
  for(const [offset,spec] of (config.party||[]).entries()){
    const partyCharacter={id:'formal-party-'+offset,name:spec.name||'Formal ally '+(offset+1),job:spec.job,race:spec.race||'human'};
    const partyEquipment={...emptyEquipment(),...(spec.equipment||{})};if(spec.job==='hunter')HunterArrowPolicy.ensureStarterQuiver(partyEquipment);
    const partyProgress={level:spec.level||config.level||45,advancedClass:spec.advancedClass||'',gold:0,potions:0,manaPotions:0,inventory:[],equipment:partyEquipment,skillLevels:buildFormalSkillLevels(spec.job,spec.advancedClass,spec.skills||{})};
    const ally=createBattlePartyMember({character:partyCharacter,progress:partyProgress},offset+1,character.id,0);if(spec.initialResource!==undefined)ally.resourceCurrent=Math.max(0,Math.min(ally.resourceMax,Number(spec.initialResource)||0));if(spec.currentHpRatio!==undefined)ally.currentHp=Math.max(1,Math.ceil(ally.maxHp*spec.currentHpRatio));partyMembers.push(ally);
  }
  const count = config.mode === 'fixed-five' || config.mode === 'party-four' ? 5 : 1;
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
    partyMembers, monsterMoveSpeed: 400, targetIndexes: [], damageTimers: [],
    rewardedEnemyIndexes: new Set(), roundLoot: {}, isDungeon: config.mode === 'boss',
    dungeonId: null, dungeonWave: 1, dungeonComplete: false, waveTransitioning: false,
    globalSkillReadyAt: 0, skillCooldowns: {}, lastStrongholdRegenAt: 0
  };
  if (member.job === 'hunter') {
    ensureHunterCompanions(member, 0);
    (config.petStates || []).forEach((state, index) => Object.assign(member.companions[index] || {}, state));
  }
  for(const ally of partyMembers.filter(candidate=>candidate.job==='hunter'&&candidate!==member))ensureHunterCompanions(ally,0);
  fighting = true;
  return member;
}

function formalSnapshot(member, duration, cycle, resourceMonitor, dotMonitor, partyMonitor) {
  const combat = JSON.parse(JSON.stringify(CombatCorePolicy.telemetry(member)));
  const basicDamage = combat.damageBySource['basic-attack'] || 0;
  const skillDamage = {};
  for (const [source, damage] of Object.entries(combat.damageBySource)) {
    if (source !== 'basic-attack') skillDamage[source] = damage;
  }
  const petSources = ['pet-basic', 'pet-bite', 'beast-slam', 'pet-bleed'];
  const petDamage = petSources.reduce((sum, source) => sum + (combat.damageBySource[source] || 0), 0);
  const extraShotDamage = combat.damageBySource['extra-shot'] || 0;
  const dotSources = ['burn', 'dot', 'pet-bleed', 'bleed', 'rupture', 'poison', 'bleed-entry', 'bleed-trigger', 'rupture-entry', 'poison-entry'];
  const dotDamage = dotSources.reduce((sum, source) => sum + (combat.damageBySource[source] || 0), 0);
  const activeSkillIds = new Set(formalSkillDefinitions(member.job, member.progress.advancedClass).filter((skill) => skill.type === 'active').map((skill) => skill.id));
  const activeSkillDamage = Object.fromEntries(Object.entries(combat.damageBySource).filter(([source]) => activeSkillIds.has(source)));
  const activeSkillTotal = Object.values(activeSkillDamage).reduce((sum, damage) => sum + damage, 0);
  const offhandDamage = combat.damageBySource.offhand || 0;
  const bleedTickDamage = (combat.damageBySource.bleed || 0) + (combat.damageBySource.rupture || 0);
  const bleedSpecialDamage = (combat.damageBySource['bleed-entry'] || 0) + (combat.damageBySource['bleed-trigger'] || 0) + (combat.damageBySource['rupture-entry'] || 0);
  const poisonTickDamage = combat.damageBySource.poison || 0;
  const poisonEntryDamage = combat.damageBySource['poison-entry'] || 0;
  const classifiedSources = new Set(['basic-attack', 'offhand', 'extra-shot', ...petSources, ...dotSources, ...activeSkillIds]);
  const specialDamage = Object.entries(combat.damageBySource).filter(([source]) => !classifiedSources.has(source)).reduce((sum, [, damage]) => sum + damage, 0);
  const naturalRecovery = combat.resourceEvents.filter((event) => event.type === 'natural').reduce((sum, event) => sum + event.amount, 0);
  const specialRecovery = combat.resourceRecovered - naturalRecovery;
  const resource = ['arrows', 'energy', 'mana'].includes(member.resourceType) ? {
    type: member.resourceType, initial: resourceMonitor.initial, maximum: member.resourceMax,
    minimum: resourceMonitor.minimum, end: member.resourceCurrent, spent: combat.resourceSpent,
    recovered: combat.resourceRecovered, naturalRecovery, specialRecovery,
    blocked: combat.resourceBlocked, blockedBySkill: combat.resourceBlockedBySkill,
    zeroDuration: resourceMonitor.zeroMs / 1000, lowDuration: resourceMonitor.lowMs / 1000, exhaustionDuration: resourceMonitor.exhaustedMs / 1000, exhaustionEpisodes: resourceMonitor.exhaustionEpisodes, curve: resourceMonitor.curve
  } : null;
  return {
    duration, ttk: battle.isDungeon ? duration : null, totalDamage: combat.totalDamage,
    dps: combat.totalDamage / Math.max(.1, duration), killsPerMinute: battle.isDungeon ? null : combat.kills / Math.max(.1, duration) * 60,
    basicDamage, basicShare: combat.totalDamage ? basicDamage / combat.totalDamage : 0,
    skillDamage, skillShares: Object.fromEntries(Object.entries(skillDamage).map(([id, damage]) => [id, combat.totalDamage ? damage / combat.totalDamage : 0])),
    activeSkillDamage, activeSkillTotal, activeSkillShare: combat.totalDamage ? activeSkillTotal / combat.totalDamage : 0,
    petDamage, petDps: petDamage / Math.max(.1, duration), petShare: combat.totalDamage ? petDamage / combat.totalDamage : 0,
    petAttacks: combat.petAttacks, petCriticalRate: combat.petCriticalRolls ? combat.petCriticalHits / combat.petCriticalRolls : null, petKills: combat.petKills,
    extraShotDamage, extraShotShare: combat.totalDamage ? extraShotDamage / combat.totalDamage : 0, extraShots: combat.extraShots,
    dotDamage, specialDamage,
    offhandDamage, offhandDps: offhandDamage / Math.max(.1, duration), offhandShare: combat.totalDamage ? offhandDamage / combat.totalDamage : 0,
    offhandAttacks: combat.offhandAttacks, offhandCriticalRate: combat.offhandCriticalRolls ? combat.offhandCriticalHits / combat.offhandCriticalRolls : null,
    bleed: { damage: bleedTickDamage + bleedSpecialDamage, tickDamage: bleedTickDamage, specialDamage: bleedSpecialDamage, share: combat.totalDamage ? (bleedTickDamage + bleedSpecialDamage) / combat.totalDamage : 0, applications: (combat.dotApplications.bleed || 0) + (combat.dotApplications.rupture || 0), refreshes: (combat.dotRefreshes.bleed || 0) + (combat.dotRefreshes.rupture || 0), ticks: (combat.dotTicksByType.bleed || 0) + (combat.dotTicksByType.rupture || 0), timeline: dotMonitor.timeline.filter((event) => event.targets.some((target) => target.bleed || target.rupture)) },
    poison: { damage: poisonTickDamage + poisonEntryDamage, tickDamage: poisonTickDamage, entryDamage: poisonEntryDamage, share: combat.totalDamage ? (poisonTickDamage + poisonEntryDamage) / combat.totalDamage : 0, applications: combat.dotApplications.poison || 0, refreshes: combat.dotRefreshes.poison || 0, ticks: combat.dotTicksByType.poison || 0, maxStacks: dotMonitor.maxPoisonStacks, averageStacks: dotMonitor.samples ? dotMonitor.poisonStackTotal / dotMonitor.samples : 0, timeline: dotMonitor.timeline.filter((event) => event.targets.some((target) => target.poison)) },
    skillCasts: combat.skillCasts,
    criticalRate: combat.criticalRolls ? combat.criticalHits / combat.criticalRolls : 0,
    aoeDamage: combat.aoeDamage, aoeShare: combat.totalDamage ? combat.aoeDamage / combat.totalDamage : 0,
    resource,
    arrows: member.resourceType === 'arrows' ? resource : null,
    energy: member.resourceType === 'energy' ? resource : null,
    mana: member.resourceType === 'mana' ? resource : null,
    healing: member.job==='priest'?JSON.parse(JSON.stringify(PriestAdvancementPolicy.telemetry(member))):null,
    shield: member.job==='priest'?{generated:PriestAdvancementPolicy.telemetry(member).shieldGenerated,absorbed:PriestAdvancementPolicy.telemetry(member).shieldAbsorbed,expired:PriestAdvancementPolicy.telemetry(member).shieldExpired,remaining:(battle.partyMembers||[]).reduce((sum,ally)=>sum+(ally.priestShieldGrants||[]).filter(grant=>grant.owner===member).reduce((value,grant)=>value+grant.remaining,0),0),events:JSON.parse(JSON.stringify(PriestAdvancementPolicy.telemetry(member).shieldEvents))}:null,
    faith: member.job==='priest'?{end:PriestAdvancementPolicy.getFaithStacks(member,formalNow),maximum:PriestAdvancementPolicy.FAITH_MAX_STACKS,average:PriestAdvancementPolicy.telemetry(member).faithSamples?PriestAdvancementPolicy.telemetry(member).faithStackTotal/PriestAdvancementPolicy.telemetry(member).faithSamples:0,fullSamples:PriestAdvancementPolicy.telemetry(member).faithFullSamples,events:JSON.parse(JSON.stringify(PriestAdvancementPolicy.telemetry(member).faithEvents))}:null,
    party: partyMonitor?{minimumHpByMember:partyMonitor.minimumHpByMember,averageHpRatioByMember:Object.fromEntries((battle.partyMembers||[]).map(ally=>[ally.id,partyMonitor.samples?partyMonitor.hpRatioTotal[ally.id]/partyMonitor.samples:0])),averageHpRatio:partyMonitor.samples?Object.values(partyMonitor.hpRatioTotal).reduce((sum,value)=>sum+value,0)/(partyMonitor.samples*(battle.partyMembers||[]).length):0,deaths:partyMonitor.deaths,revives:partyMonitor.revives,firstDeathAtMs:partyMonitor.firstDeathAtMs,healthCurve:partyMonitor.healthCurve,statusTimeline:partyMonitor.statusTimeline,final:(battle.partyMembers||[]).map(ally=>({id:ally.id,job:ally.job,hp:ally.currentHp,maxHp:ally.maxHp,alive:ally.alive,shield:ally.shield,resource:ally.resourceCurrent,damageTaken:CombatCorePolicy.telemetry(ally).damageTaken})),memberDamage:Object.fromEntries((battle.partyMembers||[]).map(ally=>[ally.id,CombatCorePolicy.telemetry(ally).totalDamage])),totalDamage:(battle.partyMembers||[]).reduce((sum,ally)=>sum+CombatCorePolicy.telemetry(ally).totalDamage,0),kills:(battle.partyMembers||[]).reduce((sum,ally)=>sum+CombatCorePolicy.telemetry(ally).kills,0),support:Object.fromEntries((battle.partyMembers||[]).filter(ally=>ally.job==='priest').map(ally=>[ally.id,JSON.parse(JSON.stringify(PriestAdvancementPolicy.telemetry(ally)))]))}:null,
    cycle, combat,
    final: {
      hp: member.currentHp, maxHp: member.maxHp, defense: member.stats.defense, resource: member.resourceCurrent, alive: member.alive,
      cooldowns: { ...member.skillCooldowns }, enemyHps: [...battle.enemyHps],
      enemyRespawns: [...battle.enemyRespawns], enemySkillStates: JSON.parse(JSON.stringify(battle.enemySkillStates)),
      companions: JSON.parse(JSON.stringify(member.companions || [])),
      petGuardUsesRemaining: member.petGuardUsesRemaining || 0,
      hunterState: {
        galeUntil: member.galeUntil || 0, galeHitCount: member.galeHitCount || 0,
        beastFuryUntil: member.beastFuryUntil || 0, bloodyHuntUntil: member.bloodyHuntUntil || 0,
        sniperBasicUntil: member.sniperBasicUntil || 0, eagleEyeUntil: member.eagleEyeUntil || 0,
        weaknessShotUntil: member.weaknessShotUntil || 0, nextHunterAttackBonus: member.nextHunterAttackBonus || 0
      },
      rogueState: {
        lethalTechniqueUntil: member.lethalTechniqueUntil || 0, shadowDanceUntil: member.shadowDanceUntil || 0,
        plagueSpreadPending: Boolean(member.plagueSpreadPending), desperateDodgeUntil: member.desperateDodgeUntil || 0
      },
      priestState: {faithStacks:member.faithStacks||0,faithUntil:member.faithUntil||0,lightValue:member.lightValue||0,sanctuaryUntil:member.sanctuaryUntil||0,sanctuaryNextTickAt:member.sanctuaryNextTickAt||0,sacredGuardianReadyAt:battle.sacredGuardianReadyAt||0},
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
  const resourceMonitor = { initial: member.resourceCurrent, minimum: member.resourceCurrent, zeroMs: 0, lowMs:0, exhaustedMs:0, exhaustionEpisodes:0, wasExhausted:Boolean(member.manaExhausted), curve: [{ atMs: 0, value: member.resourceCurrent }] };
  const dotMonitor = { samples: 0, poisonStackTotal: 0, maxPoisonStacks: 0, timeline: [], lastSignature: '' };
  const partyMonitor={minimumHpByMember:Object.fromEntries(battle.partyMembers.map(ally=>[ally.id,ally.currentHp])),hpRatioTotal:Object.fromEntries(battle.partyMembers.map(ally=>[ally.id,0])),samples:0,deaths:0,revives:0,firstDeathAtMs:null,healthCurve:[],statusTimeline:[],alive:Object.fromEntries(battle.partyMembers.map(ally=>[ally.id,ally.alive])),lastSignature:'',lastStatusSignature:''};
  let resourceEventCursor = 0;
  const limitMs = (config.mode === 'boss' ? config.maxSeconds : config.seconds) * 1000;
  for (formalNow = 0; formalNow < limitMs && fighting && (config.mode !== 'boss' || battle.enemyHps[0] > 0); formalNow += 100) {
    const before = { ...CombatCorePolicy.telemetry(member).skillCasts };
    autoSkillTick();
    if (config.entry === 'ui') battleTick();
    else CombatCorePolicy.runPlayerTick(createBattleTickRuntime(), formalNow);
    enemyAttackTick();
    runFormalTimers();
    resourceMonitor.minimum = Math.min(resourceMonitor.minimum, member.resourceCurrent);
    if (['arrows', 'energy', 'mana'].includes(member.resourceType) && member.resourceCurrent === 0) resourceMonitor.zeroMs += 100;
    if(member.resourceType==='mana'&&member.resourceCurrent<=member.resourceMax*.25)resourceMonitor.lowMs+=100;
    if(member.resourceType==='mana'&&member.manaExhausted)resourceMonitor.exhaustedMs+=100;if(!resourceMonitor.wasExhausted&&member.manaExhausted)resourceMonitor.exhaustionEpisodes++;resourceMonitor.wasExhausted=Boolean(member.manaExhausted);
    const resourceEvents = CombatCorePolicy.telemetry(member).resourceEvents;
    while (resourceEventCursor < resourceEvents.length) {
      const event = resourceEvents[resourceEventCursor++];
      resourceMonitor.minimum = Math.min(resourceMonitor.minimum, event.current);
      resourceMonitor.curve.push({ atMs: event.atMs, value: event.current, type: event.type });
    }
    const dotState = battle.enemyDots.map((dots, targetIndex) => ({
      targetIndex,
      bleed: dots.filter((dot) => dot.type === 'bleed').length,
      rupture: dots.filter((dot) => dot.type === 'rupture').length,
      poison: RogueAdvancementPolicy.poisonStacks(dots)
    }));
    dotMonitor.samples += dotState.length;
    dotMonitor.poisonStackTotal += dotState.reduce((sum, state) => sum + state.poison, 0);
    dotMonitor.maxPoisonStacks = Math.max(dotMonitor.maxPoisonStacks, ...dotState.map((state) => state.poison));
    const dotSignature = JSON.stringify(dotState);
    if (dotSignature !== dotMonitor.lastSignature) {
      dotMonitor.timeline.push({ atMs: formalNow, targets: dotState });
      dotMonitor.lastSignature = dotSignature;
    }
    const partyState=battle.partyMembers.map(ally=>({id:ally.id,hp:ally.currentHp,alive:ally.alive,shield:ally.shield}));
    partyMonitor.samples++;for(const ally of battle.partyMembers){partyMonitor.minimumHpByMember[ally.id]=Math.min(partyMonitor.minimumHpByMember[ally.id],ally.currentHp);partyMonitor.hpRatioTotal[ally.id]+=ally.maxHp?ally.currentHp/ally.maxHp:0;if(partyMonitor.alive[ally.id]&&!ally.alive){partyMonitor.deaths++;if(partyMonitor.firstDeathAtMs===null)partyMonitor.firstDeathAtMs=formalNow;}if(!partyMonitor.alive[ally.id]&&ally.alive)partyMonitor.revives++;partyMonitor.alive[ally.id]=ally.alive;}
    const partySignature=JSON.stringify(partyState);if(partySignature!==partyMonitor.lastSignature){partyMonitor.healthCurve.push({atMs:formalNow,members:partyState});partyMonitor.lastSignature=partySignature;}
    const statusState={allies:battle.partyMembers.map(ally=>({id:ally.id,sanctuary:formalNow<(ally.sanctuaryUntil||0),lightGrace:formalNow<(ally.lightGraceUntil||0),holyStormHaste:formalNow<(ally.holyStormHasteUntil||0),buffed:Object.entries(ally).some(([key,value])=>key.endsWith('Until')&&!key.startsWith('visual')&&Number(value)>formalNow)})),enemies:battle.enemySkillStates.map((state,index)=>({index,holyLightAttackDownUntil:state?.holyLightAttackDownUntil||0,controlled:['stunnedUntil','frozenUntil','paralyzedUntil','slowedUntil'].some(key=>Number(state?.[key])>formalNow),debuffed:Object.entries(state||{}).some(([key,value])=>key.endsWith('Until')&&!key.startsWith('visual')&&Number(value)>formalNow)}))};const statusSignature=JSON.stringify(statusState);if(statusSignature!==partyMonitor.lastStatusSignature){partyMonitor.statusTimeline.push({atMs:formalNow,...statusState});partyMonitor.lastStatusSignature=statusSignature;}
    const after = CombatCorePolicy.telemetry(member).skillCasts;
    for (const [id, casts] of Object.entries(after)) {
      if (casts > (before[id] || 0)) cycle.push({ atMs: formalNow, skill: id, cooldownReadyAt: member.skillCooldowns[id] || formalNow });
    }
  }
  if (config.mode === 'boss' && battle.enemyHps[0] > 0) throw new Error('Boss did not die within maxSeconds');
  return formalSnapshot(member, formalNow / 1000, cycle, resourceMonitor, dotMonitor, partyMonitor);
}
`);

function normalizeConfig(input = {}) {
  const mode = input.mode || 'fixed-five';
  if (!['fixed-five', 'boss', 'party-four'].includes(mode)) throw new Error(`Unsupported mode: ${mode}`);
  if (!input.job) throw new Error('job is required');
  return {
    job: input.job, advancedClass: input.advancedClass || '', race: input.race || 'human', level: input.level || 45,
    equipment: input.equipment || {}, skills: input.skills || {}, mode, seed: input.seed ?? 1,
    initialResource: input.initialResource ?? null,
    petStates: input.petStates || [],
    party: input.party || [],
    potions: Math.max(0, Number(input.potions) || 0),
    sensitivity: { petDamageMultiplier: input.sensitivity?.petDamageMultiplier ?? 1, wildBondLv6Scale: input.sensitivity?.wildBondLv6Scale ?? 1 },
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
