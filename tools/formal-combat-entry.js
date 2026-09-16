'use strict';

const { loadGame } = require('./headless-game-runtime.js');
const HeadlessProgressionModel = require('./headless-progression-model.js');

const game = loadGame();

game.evaluate(`
let formalNow = 0;
let formalSeed = 1;
let formalProgress = null;
let formalEnemy = null;
let formalMap = null;
let formalEnemyDefinitions = null;
let formalPools = null;
let formalTestTelemetry = null;
let formalMonsterAttackMultiplier = 1;
let formalAutoBuyPotionAmount = null;
let formalAutoBuyPotionCost = 50;
let formalRequiredXpTable = null;
let formalChapterExpBands = null;
let formalMapExpMultiplier = 1;
let formalShamanHealCooldownMs = null;
let formalTimers = [];
let formalTimerSequence = 0;
let formalSensitivity = { petDamageMultiplier: 1, wildBondLv6Scale: 1 };
const productionGetMonsterDefinitionForMap = getMonsterDefinitionForMap;
const productionCreateEnemyLevels = createEnemyLevels;
const productionCreateEnemyTypes = createEnemyTypes;
const productionRandomEnemyId = randomEnemyId;
const productionRandomEliteId = randomEliteId;
const productionRandomBossId = randomBossId;
const productionUsePotion = usePotion;
const productionAutoBuyPotions = autoBuyPotions;
const productionRequiredXp = requiredXp;

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
getActiveMap = () => formalMap || ({ id: 'formal-headless', chapter: 1, min: 1, max: 45 });
getEnemyDefinition = (index = 0) => { const enemy=formalEnemyDefinitions
  ? productionGetMonsterDefinitionForMap(battle.enemyTypes[index], formalMap.id, battle.enemyLevels[index])
  : formalEnemy; return formalMonsterAttackMultiplier===1?enemy:{...enemy,attack:(Number(enemy.attack)||0)*formalMonsterAttackMultiplier}; };
function recordFormalSpawn(id) { if(formalTestTelemetry)formalTestTelemetry.spawns[id]=(formalTestTelemetry.spawns[id]||0)+1; return id; }
randomEnemyId = (level) => formalEnemyDefinitions ? recordFormalSpawn(productionRandomEnemyId(level)) : formalEnemy.id;
randomEliteId = (level) => formalEnemyDefinitions ? recordFormalSpawn(productionRandomEliteId(level)) : formalEnemy.id;
randomBossId = (level) => formalEnemyDefinitions ? recordFormalSpawn(productionRandomBossId(level)) : formalEnemy.id;
createEnemyLevels = (types, mapId) => formalEnemyDefinitions ? productionCreateEnemyLevels(types, mapId) : types.map(() => formalEnemy.level);
createEnemyAffixes = (types) => types.map(() => []);
updateBattleUI = () => {};
logBattle = (message, kind, meta = {}) => { if(!formalTestTelemetry)return;if(kind==='enemy-healing'&&String(message).includes('【哥布林薩滿】')){const match=String(message).match(/替【([^】]+)】恢復 ([0-9]+)/);formalTestTelemetry.shamanHeals.push({atMs:formalNow,target:match?.[1]||'unknown',amount:Number(match?.[2])||0});}if(!meta.aggregateKey?.startsWith('enemy-'))return;const id=meta.aggregateKey.slice(6);formalTestTelemetry.damageByMonster[id]=(formalTestTelemetry.damageByMonster[id]||0)+(Number(meta.damage)||0);formalTestTelemetry.lastDamageSource=id; };
showToast = () => {};
openVillage = () => {};
playPartyMemberCombatAnimation = () => {};
playBattleSkillEffect = () => {};
playMonsterAttackAnimation = () => {};
renderDamageNumber = () => {};
requiredXp = (level) => formalRequiredXpTable?.[level] ?? productionRequiredXp(level);
function formalChapterExpMultiplier(level){if(!formalChapterExpBands)return null;return formalChapterExpBands.find(band=>level<=band.maxLevel)?.multiplier??formalChapterExpBands[formalChapterExpBands.length-1]?.multiplier??1;}
rewardVictory = (index) => { if(!formalTestTelemetry)return; const enemy=getEnemyDefinition(index); formalTestTelemetry.kills[enemy.id]=(formalTestTelemetry.kills[enemy.id]||0)+1;formalTestTelemetry.killEvents.push({atMs:formalNow,id:enemy.id}); const policyReward=MapExpPolicy.calculate(enemy.xp||0,formalProgress.level,formalMap||{});const chapterMultiplier=formalChapterExpMultiplier(formalProgress.level);const earnedXp=Math.round((chapterMultiplier===null?policyReward.actualExp:(enemy.xp||0)*chapterMultiplier)*formalMapExpMultiplier*100)/100; const gold=Math.max(1,Math.floor((enemy.gold||0)*.55));formalProgress.xp+=earnedXp;formalProgress.gold+=gold;formalTestTelemetry.earnedXp+=earnedXp;formalTestTelemetry.earnedGold+=gold;if(!enemy.lootPending&&Math.random()<.10){formalProgress.potions+=1;const item=formalProgress.inventory.find(entry=>entry.id==='healing-potion');if(item)item.quantity+=1;else formalProgress.inventory.push({id:'healing-potion',kind:'consumable',quantity:1});formalTestTelemetry.healingPotionDrops+=1;formalTestTelemetry.potionDropEvents.push({atMs:formalNow});} const inventoryBefore=formalProgress.inventory.length;grantCraftingMaterialDrops(formalProgress,formalMap,enemy);BlackForestCorruptionPolicy.grantMapDrop(formalProgress,formalMap?.id,enemy);SkillUpgradePolicy.grantChapterDrops(formalProgress,formalMap?.chapter,enemy);ChapterOneRecipeDropPolicy.grantRecipeDrops(formalProgress,enemy,formalMap?.id);ChapterTwoRecipeDropPolicy.grantRecipeDrops(formalProgress,enemy,formalMap?.id);ChapterThreeRecipeDropPolicy.grantRecipeDrops(formalProgress,enemy,formalMap?.id);ChapterTwoRuneDropPolicy.grantRuneDrop(formalProgress,formalMap?.id,enemy);const equipmentDrop=EquipmentDropPolicy.grantEquipmentDrop(formalProgress,enemy,{chapter:formalMap?.chapter||enemy.chapter,mapId:formalMap?.id||enemy.mapId,jobId:getActiveCharacter()?.job,random:Math.random,obtainedAt:formalNow,warningHandler:()=>{}});if(equipmentDrop)formalTestTelemetry.equipmentDrops.push(equipmentDrop.instanceId||equipmentDrop.id);formalTestTelemetry.nonEquipmentDrops+=Math.max(0,formalProgress.inventory.length-inventoryBefore-(equipmentDrop?1:0)); while(formalProgress.xp>=requiredXp(formalProgress.level)){formalProgress.xp-=requiredXp(formalProgress.level);formalProgress.level+=1;formalTestTelemetry.levelsGained+=1;formalTestTelemetry.levelEvents.push({atMs:formalNow,level:formalProgress.level});syncMainBattleMemberProgression(getActiveCharacter(),formalProgress);} const requirement=ChapterOneProgressionPolicy.REQUIREMENTS[formalMap?.id];if(requirement){if(enemy.id===requirement.bossId)ChapterOneProgressionPolicy.recordBossKill(formalProgress,formalMap.id,enemy);else if(!enemy.isElite)ChapterOneProgressionPolicy.recordNormalKill(formalProgress,formalMap.id);} };
usePotion = (manual = false) => { const before=formalProgress?.potions||0;const result=productionUsePotion(manual);if(formalTestTelemetry&&(formalProgress?.potions||0)<before)formalTestTelemetry.potionUseEvents.push({atMs:formalNow});return result; };
autoBuyPotions = () => { const before=formalProgress?.potions||0;let result;if(formalAutoBuyPotionAmount===null)result=productionAutoBuyPotions();else if((formalProgress?.gold||0)<formalAutoBuyPotionCost)result=false;else{formalProgress.gold-=formalAutoBuyPotionCost;formalProgress.potions+=formalAutoBuyPotionAmount;addPotionItem(formalProgress,formalAutoBuyPotionAmount);result=true;}const purchased=Math.max(0,(formalProgress?.potions||0)-before);if(formalTestTelemetry&&purchased){formalTestTelemetry.potionsPurchased+=purchased;formalTestTelemetry.potionPurchaseEvents.push({atMs:formalNow,quantity:purchased});}return result; };
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
  const advancementIds = new Set(definitions.filter((skill) => WarriorAdvancementPolicy.getSkill(skill.id) || RogueAdvancementPolicy.getSkill(skill.id) || HunterAdvancementPolicy.getSkill(skill.id) || MageAdvancementPolicy.getSkill(skill.id) || PriestAdvancementPolicy.getSkill(skill.id)).map((skill) => skill.id));
  const levels = Object.fromEntries(definitions.map((skill) => [job + ':' + skill.id, 5]));
  const explicit = requested?.levels || {};
  for (const [rawId, rawLevel] of Object.entries(explicit)) {
    const id = rawId.includes(':') ? rawId.split(':').pop() : rawId;
    if (!byId[id]) throw new Error('Unknown ' + job + ' skill: ' + id);
    const level = Number(rawLevel);
    if (!Number.isInteger(level) || level < 1 || level > 6) throw new Error('Skill level must be an integer from 1 to 6: ' + id);
    levels[job + ':' + id] = level;
  }
  const requestedLv6 = [
    ['active', requested?.baseActiveLv6], ['passive', requested?.basePassiveLv6],
    ['active', requested?.advancedActiveLv6], ['passive', requested?.advancedPassiveLv6],
    ['active', requested?.activeLv6], ['passive', requested?.passiveLv6]
  ];
  for (const [type, id] of requestedLv6) {
    if (!id) continue;
    if (!byId[id] || byId[id].type !== type) throw new Error('Invalid ' + type + ' Lv6 skill: ' + id);
    levels[job + ':' + id] = 6;
  }
  for (const pool of ['base', 'advanced']) for (const type of ['active', 'passive']) {
    const specialized = definitions.filter((skill) => skill.type === type && (advancementIds.has(skill.id) ? 'advanced' : 'base') === pool && levels[job + ':' + skill.id] === 6);
    if (specialized.length > 1) throw new Error('Only one ' + type + ' skill may be Lv6 in ' + pool + ' pool: ' + specialized.map((skill) => skill.id).join(', '));
  }
  return levels;
}

function setupFormalCombat(config) {
  seedFormalCombat(config.seed);
  formalTimers=[];formalTimerSequence=0;formalMap=config.map||null;formalEnemyDefinitions=config.enemyDefinitions||null;formalPools=config.pools||null;formalMonsterAttackMultiplier=config.monsterAttackMultiplier||1;formalAutoBuyPotionAmount=config.autoBuyPotionAmount??null;formalAutoBuyPotionCost=config.autoBuyPotionCost??50;formalRequiredXpTable=config.requiredXpTable||null;formalChapterExpBands=config.chapterExpBands||null;formalMapExpMultiplier=config.mapExpMultiplier||1;formalShamanHealCooldownMs=config.shamanHealCooldownMs??null;GoblinCampPolicy.SHAMAN_HEAL_COOLDOWN_MS=formalShamanHealCooldownMs??GoblinCampPolicy.SHAMAN_HEAL_COOLDOWN_MS;
  formalTestTelemetry=config.enemyDefinitions?{spawns:{},kills:{},killEvents:[],levelEvents:[],shamanHeals:[],potionDropEvents:[],potionUseEvents:[],potionPurchaseEvents:[],equipmentDrops:[],nonEquipmentDrops:0,potionsPurchased:0,damageByMonster:{},lastDamageSource:null,deathSources:{},healingPotionDrops:0,levelsGained:0,earnedXp:0,earnedGold:0}:null;
  formalSensitivity={petDamageMultiplier:config.sensitivity?.petDamageMultiplier??1,wildBondLv6Scale:config.sensitivity?.wildBondLv6Scale??1};
  const character = { id: 'formal-' + config.job, name: 'Formal ' + config.job, job: config.job, race: config.race || 'human' };
  const formalEquipment = { ...emptyEquipment(), ...(config.equipment || {}) };
  if (config.job === 'hunter') HunterArrowPolicy.ensureStarterQuiver(formalEquipment);
  const initialProgress=config.initialProgress||{};
  formalProgress = {
    advancedClass: config.advancedClass || '',
    level: initialProgress.level||config.level||45, xp:Number(initialProgress.xp)||0, gold:Number(initialProgress.gold)||0, potions:initialProgress.potions??config.potions??0, initialPotions:initialProgress.potions??config.potions??0, manaPotions:Number(initialProgress.manaPotions)||0, inventory:JSON.parse(JSON.stringify(initialProgress.inventory||[])),mapKillProgress:{...(initialProgress.mapKillProgress||{})},mapBossCleared:{...(initialProgress.mapBossCleared||{})},mapUnlocked:{...(initialProgress.mapUnlocked||{})},selectedMapId:initialProgress.selectedMapId||config.mapId||formalMap?.id,
    equipment: formalEquipment,
    skillLevels: config.exactSkillLevels ? JSON.parse(JSON.stringify(initialProgress.skillLevels||config.skills?.levels||{})) : buildFormalSkillLevels(config.job, config.advancedClass, config.skills || {}),
    blackForestCorruption: JSON.parse(JSON.stringify(initialProgress.blackForestCorruption||null))
  };
  ChapterOneProgressionPolicy.normalize(formalProgress);
  if (config.job === 'assassin') {
    formalProgress.energy = config.initialResource ?? AssassinEnergyPolicy.MAX_ENERGY;
    formalProgress.maxEnergy = AssassinEnergyPolicy.MAX_ENERGY;
    formalProgress.energyUpdatedAt = 0;
  }
  const member = createBattlePartyMember({ character, progress: formalProgress }, 0, character.id, 0);
  if (config.initialResource !== null && config.initialResource !== undefined) member.resourceCurrent = Math.max(0, Math.min(member.resourceMax, Number(config.initialResource) || 0));
  formalEnemy = {
    id: config.enemy.id || 'formal-enemy', name: config.enemy.name || 'Formal Enemy', maxHp: config.enemy.hp,
    defense: config.enemy.defense || 0, attack: config.enemy.attack || 0,
    attackSpeed: config.enemy.attackSpeed || 1, level: config.enemy.level || 45,
    isBoss: config.mode === 'boss', evasion: config.enemy.evasion || 0,
    parry: config.enemy.parry || 0, damageReduction: config.enemy.damageReduction || 0,
    xp: config.enemy.xp || 0, gold: config.enemy.gold || 0, mapId: config.mapId || null, chapter:config.enemy.chapter||formalMap?.chapter||1,isElite:Boolean(config.enemy.isElite),lootConfig:config.enemy.lootConfig||null
  };
  const partyMembers=[member];
  for(const [offset,spec] of (config.party||[]).entries()){
    const partyCharacter={id:'formal-party-'+offset,name:spec.name||'Formal ally '+(offset+1),job:spec.job,race:spec.race||'human'};
    const partyEquipment={...emptyEquipment(),...(spec.equipment||{})};if(spec.job==='hunter')HunterArrowPolicy.ensureStarterQuiver(partyEquipment);
    const partyProgress={level:spec.level||config.level||45,advancedClass:spec.advancedClass||'',gold:0,potions:0,manaPotions:0,inventory:[],equipment:partyEquipment,skillLevels:spec.exactSkillLevels?JSON.parse(JSON.stringify(spec.skills?.levels||{})):buildFormalSkillLevels(spec.job,spec.advancedClass,spec.skills||{}),blackForestCorruption:JSON.parse(JSON.stringify(spec.blackForestCorruption||null)),selectedMapId:formalMap?.id||config.mapId};
    const ally=createBattlePartyMember({character:partyCharacter,progress:partyProgress},offset+1,character.id,0);if(spec.initialResource!==undefined)ally.resourceCurrent=Math.max(0,Math.min(ally.resourceMax,Number(spec.initialResource)||0));if(spec.currentHpRatio!==undefined)ally.currentHp=Math.max(1,Math.ceil(ally.maxHp*spec.currentHpRatio));partyMembers.push(ally);
  }
  const defaultCount=config.mode==='fixed-five'||config.mode==='party-four'?5:1;
  const generatedTypes=config.useProductionPool?productionCreateEnemyTypes(formalProgress.level):(config.initialTypes?.length?config.initialTypes:Array(defaultCount).fill(formalEnemy.id));
  const initialTypes=generatedTypes.slice(0,config.enemyCount||generatedTypes.length);
  if(formalTestTelemetry)formalTestTelemetry.spawns={};
  if(formalTestTelemetry)for(const id of initialTypes)formalTestTelemetry.spawns[id]=(formalTestTelemetry.spawns[id]||0)+1;
  const initialLevels=createEnemyLevels(initialTypes,formalMap?.id);
  const count = initialTypes.length || (config.mode === 'fixed-five' || config.mode === 'party-four' ? 5 : 1);
  battle = {
    enemyTypes: [...initialTypes], enemyLevels: initialLevels,
    enemyHps: initialTypes.map((type,index)=>formalEnemyDefinitions?productionGetMonsterDefinitionForMap(type,formalMap.id,initialLevels[index]).maxHp:formalEnemy.maxHp), enemyRespawns: Array(count).fill(null),
    enemySpawnedAt: Array.from({ length: count }, (_, index) => index),
    enemyNextAttackAt: Array(count).fill(1000), enemyDots: Array.from({ length: count }, () => []),
    enemyDamages: Array.from({ length: count }, () => []), enemySkillStates: Array(count).fill(null),
    enemySummonProfiles: Array(count).fill(null), enemyAffixes: Array.from({ length: count }, () => []),
    enemyAffixRegenAt: Array(count).fill(0), enemyBoarEnraged: Array(count).fill(false),
    enemyTrailSummoned: Array(count).fill(false), enemyAssassinDashUntil: Array(count).fill(0),
    enemySpiderNestPhase: Array(count).fill(1), enemyDepthsPhase: Array(count).fill(1),
    partyMembers, monsterMoveSpeed: 400, targetIndexes: [], damageTimers: [],
    rewardedEnemyIndexes: new Set(), roundLoot: {}, isDungeon: config.mode === 'boss' || config.dungeon,
    dungeonId: config.dungeon ? config.mapId : null, dungeonWave: config.dungeon ? 1 : 0, dungeonComplete: false, waveTransitioning: false,
    globalSkillReadyAt: 0, skillCooldowns: {}, lastStrongholdRegenAt: 0
  };
  if (member.job === 'hunter') {
    ensureHunterCompanions(member, 0);
    (config.petStates || []).forEach((state, index) => Object.assign(member.companions[index] || {}, state));
  }
  for(const ally of partyMembers.filter(candidate=>candidate.job==='hunter'&&candidate!==member))ensureHunterCompanions(ally,0);
  fighting = true;
  if (config.preserveDeath) endBattleAfterPlayerDefeat = () => { fighting = false; return true; };
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
  const dotSources = ['burn', 'dot', 'pet-bleed', 'bleed', 'poison', 'bleed-entry', 'bleed-trigger', 'poison-entry', 'coating-poison'];
  const dotDamage = dotSources.reduce((sum, source) => sum + (combat.damageBySource[source] || 0), 0);
  const activeSkillIds = new Set(formalSkillDefinitions(member.job, member.progress.advancedClass).filter((skill) => skill.type === 'active').map((skill) => skill.id));
  const activeSkillDamage = Object.fromEntries(Object.entries(combat.damageBySource).filter(([source]) => activeSkillIds.has(source)));
  const activeSkillTotal = Object.values(activeSkillDamage).reduce((sum, damage) => sum + damage, 0);
  const offhandDamage = combat.damageBySource.offhand || 0;
  const bleedTickDamage = combat.damageBySource.bleed || 0;
  const bleedSpecialDamage = (combat.damageBySource['bleed-entry'] || 0) + (combat.damageBySource['bleed-trigger'] || 0);
  const poisonTickDamage = combat.damageBySource.poison || 0;
  const poisonEntryDamage = (combat.damageBySource['poison-entry'] || 0) + (combat.damageBySource['coating-poison'] || 0);
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
    testTelemetry: formalTestTelemetry?{...JSON.parse(JSON.stringify(formalTestTelemetry)),potionsUsed:formalTestTelemetry.potionUseEvents.length}:null,
    progression: formalProgress?JSON.parse(JSON.stringify({level:formalProgress.level,xp:formalProgress.xp,gold:formalProgress.gold,potions:formalProgress.potions,manaPotions:formalProgress.manaPotions,inventory:formalProgress.inventory,equipment:formalProgress.equipment,skillLevels:formalProgress.skillLevels,advancedClass:formalProgress.advancedClass,selectedMapId:formalProgress.selectedMapId,mapKillProgress:formalProgress.mapKillProgress,mapBossCleared:formalProgress.mapBossCleared,mapUnlocked:formalProgress.mapUnlocked})):null,
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
    bleed: { damage: bleedTickDamage + bleedSpecialDamage, tickDamage: bleedTickDamage, specialDamage: bleedSpecialDamage, share: combat.totalDamage ? (bleedTickDamage + bleedSpecialDamage) / combat.totalDamage : 0, applications: combat.dotApplications.bleed || 0, refreshes: combat.dotRefreshes.bleed || 0, ticks: combat.dotTicksByType.bleed || 0, timeline: dotMonitor.timeline.filter((event) => event.targets.some((target) => target.bleed)) },
    poison: { damage: poisonTickDamage + poisonEntryDamage, tickDamage: poisonTickDamage, entryDamage: poisonEntryDamage, share: combat.totalDamage ? (poisonTickDamage + poisonEntryDamage) / combat.totalDamage : 0, applications: combat.dotApplications.poison || 0, refreshes: combat.dotRefreshes.poison || 0, ticks: combat.dotTicksByType.poison || 0, maxStacks: dotMonitor.maxPoisonStacks, averageStacks: dotMonitor.samples ? dotMonitor.poisonStackTotal / dotMonitor.samples : 0, timeline: dotMonitor.timeline.filter((event) => event.targets.some((target) => target.poison)) },
    skillCasts: combat.skillCasts,
    criticalRate: combat.criticalRolls ? combat.criticalHits / combat.criticalRolls : 0,
    aoeDamage: combat.aoeDamage, aoeShare: combat.totalDamage ? combat.aoeDamage / combat.totalDamage : 0,
    resource,
    arrows: member.resourceType === 'arrows' ? resource : null,
    energy: member.resourceType === 'energy' ? resource : null,
    mana: member.resourceType === 'mana' ? resource : null,
    mage: member.job==='mage'?JSON.parse(JSON.stringify(MageAdvancementPolicy.telemetry(member))):null,
    healing: member.job==='priest'?JSON.parse(JSON.stringify(PriestAdvancementPolicy.telemetry(member))):null,
    shield: member.job==='priest'?{generated:PriestAdvancementPolicy.telemetry(member).shieldGenerated,absorbed:PriestAdvancementPolicy.telemetry(member).shieldAbsorbed,expired:PriestAdvancementPolicy.telemetry(member).shieldExpired,remaining:(battle.partyMembers||[]).reduce((sum,ally)=>sum+(ally.priestShieldGrants||[]).filter(grant=>grant.owner===member).reduce((value,grant)=>value+grant.remaining,0),0),events:JSON.parse(JSON.stringify(PriestAdvancementPolicy.telemetry(member).shieldEvents))}:null,
    faith: member.job==='priest'?{end:PriestAdvancementPolicy.getFaithStacks(member,formalNow),maximum:PriestAdvancementPolicy.FAITH_MAX_STACKS,average:PriestAdvancementPolicy.telemetry(member).faithSamples?PriestAdvancementPolicy.telemetry(member).faithStackTotal/PriestAdvancementPolicy.telemetry(member).faithSamples:0,fullSamples:PriestAdvancementPolicy.telemetry(member).faithFullSamples,events:JSON.parse(JSON.stringify(PriestAdvancementPolicy.telemetry(member).faithEvents))}:null,
    party: partyMonitor?{minimumHpByMember:partyMonitor.minimumHpByMember,averageHpRatioByMember:Object.fromEntries((battle.partyMembers||[]).map(ally=>[ally.id,partyMonitor.samples?partyMonitor.hpRatioTotal[ally.id]/partyMonitor.samples:0])),averageHpRatio:partyMonitor.samples?Object.values(partyMonitor.hpRatioTotal).reduce((sum,value)=>sum+value,0)/(partyMonitor.samples*(battle.partyMembers||[]).length):0,deaths:partyMonitor.deaths,revives:partyMonitor.revives,firstDeathAtMs:partyMonitor.firstDeathAtMs,healthCurve:partyMonitor.healthCurve,statusTimeline:partyMonitor.statusTimeline,final:(battle.partyMembers||[]).map(ally=>({id:ally.id,job:ally.job,level:ally.level,attack:ally.attack,defense:ally.defense,hp:ally.currentHp,maxHp:ally.maxHp,alive:ally.alive,shield:ally.shield,resource:ally.resourceCurrent,equipment:JSON.parse(JSON.stringify(ally.progress.equipment||{})),damageTaken:CombatCorePolicy.telemetry(ally).damageTaken})),memberDamage:Object.fromEntries((battle.partyMembers||[]).map(ally=>[ally.id,CombatCorePolicy.telemetry(ally).totalDamage])),totalDamage:(battle.partyMembers||[]).reduce((sum,ally)=>sum+CombatCorePolicy.telemetry(ally).totalDamage,0),kills:(battle.partyMembers||[]).reduce((sum,ally)=>sum+CombatCorePolicy.telemetry(ally).kills,0),support:Object.fromEntries((battle.partyMembers||[]).filter(ally=>ally.job==='priest').map(ally=>[ally.id,JSON.parse(JSON.stringify(PriestAdvancementPolicy.telemetry(ally)))]))}:null,
    cycle, combat,
    final: {
      hp: member.currentHp, maxHp: member.maxHp, defense: member.stats.defense, resource: member.resourceCurrent, alive: member.alive,
      cooldowns: { ...member.skillCooldowns }, enemyHps: [...battle.enemyHps],
      enemyRespawns: [...battle.enemyRespawns], enemySkillStates: JSON.parse(JSON.stringify(battle.enemySkillStates)),
      companions: JSON.parse(JSON.stringify(member.companions || [])),
      hunterState: {
        galeUntil: member.galeUntil || 0, galeHitCount: member.galeHitCount || 0,
        beastFuryUntil: member.beastFuryUntil || 0, bloodyHuntUntil: member.bloodyHuntUntil || 0, petGuardReadyAt: member.petGuardReadyAt || 0,
        sniperBasicUntil: member.sniperBasicUntil || 0, eagleEyeUntil: member.eagleEyeUntil || 0,
        weaknessShotUntil: member.weaknessShotUntil || 0, nextHunterAttackBonus: member.nextHunterAttackBonus || 0
      },
      rogueState: {
        lethalTechniqueUntil: member.lethalTechniqueUntil || 0, shadowDanceUntil: member.shadowDanceUntil || 0,
        plagueSpreadPending: Boolean(member.plagueSpreadPending), desperateDodgeUntil: member.desperateDodgeUntil || 0,
        venomCoatingUntil: member.venomCoatingUntil || 0, venomCoatingEffect: JSON.parse(JSON.stringify(member.venomCoatingEffect || null))
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
      bloodVenomBleed: RogueAdvancementPolicy.bloodBleedStacks(dots),
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
    partyMonitor.samples++;for(const ally of battle.partyMembers){partyMonitor.minimumHpByMember[ally.id]=Math.min(partyMonitor.minimumHpByMember[ally.id],ally.currentHp);partyMonitor.hpRatioTotal[ally.id]+=ally.maxHp?ally.currentHp/ally.maxHp:0;if(partyMonitor.alive[ally.id]&&!ally.alive){partyMonitor.deaths++;if(partyMonitor.firstDeathAtMs===null)partyMonitor.firstDeathAtMs=formalNow;if(formalTestTelemetry&&formalTestTelemetry.lastDamageSource){const source=formalTestTelemetry.lastDamageSource;formalTestTelemetry.deathSources[source]=(formalTestTelemetry.deathSources[source]||0)+1;}}if(!partyMonitor.alive[ally.id]&&ally.alive)partyMonitor.revives++;partyMonitor.alive[ally.id]=ally.alive;}
    const partySignature=JSON.stringify(partyState);if(partySignature!==partyMonitor.lastSignature){partyMonitor.healthCurve.push({atMs:formalNow,members:partyState});partyMonitor.lastSignature=partySignature;}
    const statusState={allies:battle.partyMembers.map(ally=>({id:ally.id,sanctuary:formalNow<(ally.sanctuaryUntil||0),lightGrace:formalNow<(ally.lightGraceUntil||0),holyStormHaste:formalNow<(ally.holyStormHasteUntil||0),buffed:Object.entries(ally).some(([key,value])=>key.endsWith('Until')&&!key.startsWith('visual')&&Number(value)>formalNow)})),enemies:battle.enemySkillStates.map((state,index)=>({index,holyLightAttackDownUntil:state?.holyLightAttackDownUntil||0,controlled:['stunnedUntil','frozenUntil','paralyzedUntil','slowedUntil'].some(key=>Number(state?.[key])>formalNow),debuffed:Object.entries(state||{}).some(([key,value])=>key.endsWith('Until')&&!key.startsWith('visual')&&Number(value)>formalNow)}))};const statusSignature=JSON.stringify(statusState);if(statusSignature!==partyMonitor.lastStatusSignature){partyMonitor.statusTimeline.push({atMs:formalNow,...statusState});partyMonitor.lastStatusSignature=statusSignature;}
    const after = CombatCorePolicy.telemetry(member).skillCasts;
    for (const [id, casts] of Object.entries(after)) {
      if (casts > (before[id] || 0)) cycle.push({ atMs: formalNow, skill: id, cooldownReadyAt: member.skillCooldowns[id] || formalNow });
    }
    if (config.stopAtLevel && formalProgress.level >= config.stopAtLevel) fighting = false;
    if (config.stopWhenMapUnlocked && formalProgress.mapUnlocked?.[config.stopWhenMapUnlocked]) fighting = false;
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
    exactSkillLevels: Boolean(input.exactSkillLevels),
    initialResource: input.initialResource ?? null,
    petStates: input.petStates || [],
    party: input.party || [],
    potions: Math.max(0, Number(input.potions) || 0),
    sensitivity: { petDamageMultiplier: input.sensitivity?.petDamageMultiplier ?? 1, wildBondLv6Scale: input.sensitivity?.wildBondLv6Scale ?? 1 },
    seconds: input.seconds || 60, maxSeconds: input.maxSeconds || 600, entry: input.entry || 'headless',
    mapId: input.mapId || null, map: input.map || null, preserveDeath: Boolean(input.preserveDeath), dungeon: Boolean(input.dungeon),
    enemyCount: Math.max(0,Number(input.enemyCount)||0), monsterAttackMultiplier: Number(input.monsterAttackMultiplier)||1,
    autoBuyPotionAmount: input.autoBuyPotionAmount===undefined?null:Math.max(0,Number(input.autoBuyPotionAmount)||0), autoBuyPotionCost:input.autoBuyPotionCost===undefined?50:Math.max(0,Number(input.autoBuyPotionCost)||0),
    initialProgress: input.initialProgress || null, stopAtLevel: Math.max(0,Number(input.stopAtLevel)||0), stopWhenMapUnlocked: input.stopWhenMapUnlocked || null,
    requiredXpTable: input.requiredXpTable || null, chapterExpBands: input.chapterExpBands || null, mapExpMultiplier: Number(input.mapExpMultiplier)||1,
    shamanHealCooldownMs: input.shamanHealCooldownMs===undefined?null:Math.max(0,Number(input.shamanHealCooldownMs)||0),
    enemyDefinitions: input.enemyDefinitions || null, pools: input.pools || null, initialTypes: input.initialTypes || null, useProductionPool: Boolean(input.useProductionPool),
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

function runProgressionCombat(roster, leaderId, input = {}) {
  const leader = HeadlessProgressionModel.getCharacter(roster, leaderId);
  const inventoryBefore = new Set(leader.progress.inventory.map((item) => item?.instanceId || item?.id));
  const result = runCombat(HeadlessProgressionModel.createCombatConfig(roster, leaderId, input));
  HeadlessProgressionModel.applyCombatProgression(roster, leaderId, result.progression);
  const updatedLeader = HeadlessProgressionModel.getCharacter(roster, leaderId);
  const newEquipment = updatedLeader.progress.inventory.filter((item) => item?.kind === 'equipment' && !inventoryBefore.has(item.instanceId || item.id));
  result.equipmentDecisions = HeadlessProgressionModel.applyConservativeEquipmentUpgrades(updatedLeader, newEquipment);
  result.rosterLeader = JSON.parse(JSON.stringify(updatedLeader));
  return result;
}

module.exports = { runCombat, runProgressionCombat, listSkills };
