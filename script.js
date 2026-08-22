const loginScreen = document.querySelector('#login-screen');
const menuScreen = document.querySelector('#menu-screen');
const characterScreen = document.querySelector('#character-screen');
const battleScreen = document.querySelector('#battle-screen');
const villageScreen = document.querySelector('#village-screen');
const loginForm = document.querySelector('#login-form');
const nameInput = document.querySelector('#player-name');
const displayName = document.querySelector('#display-name');
const toast = document.querySelector('#toast');
const raceChoices = document.querySelector('#race-choices');
const classChoices = document.querySelector('#class-choices');
const characterName = document.querySelector('#character-name');
const skillTooltip = document.querySelector('#skill-tooltip');
let skillTooltipTimer;
let selectedSkillKey = '';
let villageData = null;
let villageReturnScreen = 'menu';

const factions = {
  light: [{ id: 'human', icon: '♙', portrait: 0, name: '人類', trait: '控制抗性 +20%' }, { id: 'elf', icon: '♧', portrait: 1, name: '精靈', trait: '暴擊率 +5%' }],
  dark: [{ id: 'orc', icon: '♜', portrait: 2, name: '半獸人', trait: '10% 機率狂暴' }, { id: 'undead', icon: '☠', portrait: 3, name: '不死族', trait: '持續傷害 +20%' }]
};
const classes = [{ id: 'warrior', icon: '⚔', portrait: 4, name: '戰士' }, { id: 'assassin', icon: '🗡', portrait: 5, name: '刺客' }, { id: 'hunter', icon: '🏹', portrait: 6, name: '獵人' }, { id: 'mage', icon: '✦', portrait: 7, name: '法師' }, { id: 'priest', icon: '✚', portrait: 8, name: '牧師' }];
const isJobHiddenForRace = (raceId, jobId) => raceId === 'elf' && jobId === 'priest';
const isJobUnavailableForRace = (raceId, jobId) => raceId === 'orc' && jobId === 'priest';
const canCreateRaceJob = (raceId, jobId) => !isJobHiddenForRace(raceId, jobId) && !isJobUnavailableForRace(raceId, jobId);
const classIcons = Object.fromEntries(classes.map((job) => [job.id, job.icon]));
const raceTotems = { human: '☀', elf: '❈', orc: '⛧', undead: '☾' };
const jobMarks = { warrior: '⛨', assassin: '◈', hunter: '➶', mage: '✦', priest: '✥' };
const PARTY_DEBUG = false;
const battleCharacterArt = {
  'human:warrior': 'assets/character-portraits/human-warrior.png',
  'human:assassin': 'assets/character-portraits/human-assassin.png',
  'human:hunter': 'assets/character-portraits/human-hunter.png',
  'human:mage': 'assets/character-portraits/human-mage.png',
  'human:priest': 'assets/character-portraits/human-priest.png',
  'elf:warrior': 'assets/character-portraits/elf-warrior.png',
  'elf:assassin': 'assets/character-portraits/elf-assassin.png',
  'elf:hunter': 'assets/character-portraits/elf-hunter.png',
  'elf:mage': 'assets/character-portraits/elf-mage.png',
  'elf:priest': 'assets/character-sprites/elf-priest.png',
  'orc:warrior': 'assets/character-portraits/orc-warrior.png',
  'orc:assassin': 'assets/character-portraits/orc-assassin.png',
  'orc:hunter': 'assets/character-portraits/orc-hunter.png',
  'orc:mage': 'assets/character-portraits/orc-mage.png',
  'orc:priest': 'assets/character-sprites/orc-priest.png',
  'undead:warrior': 'assets/character-portraits/undead-warrior.png',
  'undead:assassin': 'assets/character-portraits/undead-assassin.png',
  'undead:hunter': 'assets/character-portraits/undead-hunter.png',
  'undead:mage': 'assets/character-portraits/undead-mage.png',
  'undead:priest': 'assets/character-portraits/undead-priest.png'
};
const battleCharacterActionArt = (character) => {
  if (!character?.race || !character?.job || !canCreateRaceJob(character.race, character.job)) return '';
  return battleCharacterArt[`${character.race}:${character.job}`] || '';
};

function setBattleCharacterAction(art, character, state = 'idle') {
  if (!art || !character) return;
  const actionArt = battleCharacterActionArt(character, state);
  if (!actionArt) return;
  art.dataset.action = state;
  art.style.backgroundImage = `url('${actionArt}')`;
}
const racialCompanions = {
  human: { image: 'assets/companion-human-hunter.png', icon: 'assets/hunter-companion-human-icon.png', portrait: true, name: '王國獵犬' },
  elf: { image: 'assets/companion-elf.png', icon: 'assets/hunter-companion-elf-icon.png', portrait: true, name: '月光山貓' },
  orc: { image: 'assets/companion-orc.png', icon: 'assets/hunter-companion-orc-icon.png', portrait: true, name: '獠牙戰狼' },
  undead: { image: 'assets/companion-undead.png', icon: 'assets/hunter-companion-undead-icon.png', portrait: true, name: '亡靈獵犬' }
};
const classBaseStats = {
  warrior: { hp: 150, mana: 0, attack: 12, defense: 9, crit: .05, dodge: .03, attackSpeed: 1.0 },
  assassin: { hp: 95, mana: 80, attack: 14, defense: 3, crit: .15, dodge: .12, attackSpeed: 1.08 },
  hunter: { hp: 110, mana: 90, attack: 13, defense: 4, crit: .10, dodge: .07, attackSpeed: 1.0 },
  mage: { hp: 80, mana: 140, attack: 18, defense: 2, crit: .07, dodge: .05, attackSpeed: 1.0 },
  priest: { hp: 105, mana: 130, attack: 12, defense: 4, crit: .05, dodge: .04, attackSpeed: 1.0 }
};
const raceAdjustments = {
  human: { hp: 5, mana: 5, attack: 0, defense: 1, crit: 0, dodge: 0 },
  elf: { hp: -5, mana: 10, attack: 0, defense: -1, crit: .05, dodge: .02 },
  orc: { hp: 15, mana: -5, attack: 2, defense: 1, crit: 0, dodge: -.01 },
  undead: { hp: 8, mana: 8, attack: 1, defense: 0, crit: 0, dodge: 0 }
};
const raceTalents = {
  human: { name: '王國適性', icon: '☀', detail: '生命、魔力、攻擊與防禦提高 5%。' },
  elf: { name: '月裔敏銳', icon: '❈', detail: '暴擊率 +5%、閃避率 +2%，技能冷卻速度 +3%。' },
  orc: { name: '血性狂怒', icon: '⛧', detail: '體魄與攻擊較高；每次攻擊有 10% 機率進入狂怒，該次傷害 +10%。' },
  undead: { name: '不滅意志', icon: '☾', detail: '持續傷害 +20%；倒下時有 35% 機率以 35% 生命復活一次。' }
};
const mapProgression = [
  { id: 'beginner-plains', chapter: 1, min: 1, max: 5, chapterLevelRange: [1, 15], name: '初心者平原', background: 'assets/beginner-plains-background.png', implemented: true, normalXp: 4, eliteXp: 18, bossXp: 70, recommended: { attack: 14, defense: 3, hp: 100 } },
  { id: 'plains-entrance', chapter: 1, regionOf: 'beginner-plains', min: 1, max: 2, monsterMin: 1, monsterMax: 4, name: '平原入口', background: 'assets/plains-entrance-background.png', implemented: true, normalXp: 4, eliteXp: 10, bossXp: 0, recommended: { attack: 10, defense: 1, hp: 80 } },
  { id: 'wolf-den', chapter: 1, regionOf: 'beginner-plains', min: 2, max: 5, monsterMin: 3, monsterMax: 7, name: '狼穴', background: 'assets/wolf-den-background.png', implemented: true, normalXp: 6, eliteXp: 16, bossXp: 80, recommended: { attack: 16, defense: 4, hp: 110 } },
  { id: 'boar-woods', chapter: 1, regionOf: 'beginner-plains', min: 3, max: 5, monsterMin: 6, monsterMax: 10, name: '野豬林', background: 'assets/boar-woods-background.png', implemented: true, normalXp: 8, eliteXp: 20, bossXp: 95, recommended: { attack: 19, defense: 6, hp: 135 } },
  { id: 'plains-depths', chapter: 1, regionOf: 'beginner-plains', min: 4, max: 5, monsterMin: 12, monsterMax: 15, name: '平原深處', background: 'assets/plains-depths-background.png?v=20260728-user-image-v1', implemented: true, normalXp: 10, eliteXp: 26, bossXp: 110, recommended: { attack: 22, defense: 8, hp: 155 } },
  { id: 'goblin-camp', chapter: 1, regionOf: 'beginner-plains', min: 2, max: 5, monsterMin: 8, monsterMax: 12, name: '哥布林營地', background: 'assets/goblin-camp-background.png', implemented: true, dungeon: true, ticketItemId: 'goblin-camp-map', normalXp: 10, eliteXp: 28, bossXp: 120, recommended: { attack: 18, defense: 5, hp: 120 } },
  { id: ChapterTwoMapPolicy.CHAPTER.id, chapter: 2, min: 15, max: 30, chapterLevelRange: [15, 30], name: ChapterTwoMapPolicy.CHAPTER.name, background: ChapterTwoMapPolicy.CHAPTER.background, implemented: true, regionHub: true, contentStatus: 'planned', previousMapId: 'plains-depths', recommended: { attack: 0, defense: 0, hp: 0 } },
  ...ChapterTwoMapPolicy.MAPS,
  { min: 10, max: 15, name: '石牙山谷', normalXp: 8, eliteXp: 35, bossXp: 140 },
  { min: 15, max: 20, name: '荒蕪沙漠', normalXp: 18, eliteXp: 70, bossXp: 280 },
  { min: 20, max: 25, name: '冰霜高原', normalXp: 35, eliteXp: 140, bossXp: 560 },
  { min: 25, max: 30, name: '熔岩要塞', normalXp: 70, eliteXp: 280, bossXp: 1050 }
];
const beginnerPlainsRegions = [
  { id: 'plains-entrance', name: '平原入口' },
  { id: 'wolf-den', name: '狼穴' },
  { id: 'boar-woods', name: '野豬林' },
  { id: 'goblin-camp', name: '哥布林營地' },
  { id: 'plains-depths', name: '平原深處' }
];
const blackForestRegions = ChapterTwoMapPolicy.MAPS;
const skillCooldownMultiplier = 1.0;
const legacySkillProgression = {
  warrior: [
    { level: 1, type: 'active', id: 'heavy-strike', name: '重擊', detail: '160% 傷害 · 暈眩', power: 1.6, cooldown: 4 },
    { level: 3, type: 'passive', name: '鋼鐵意志', detail: '敵多時減傷' },
    { level: 5, type: 'active', id: 'whirlwind', name: '旋風斬', detail: '全體 70% 傷害', power: .7, targets: 5, cooldown: 7 },
    { level: 8, type: 'passive', name: '強健體魄', detail: '最大生命 +15%' },
    { level: 10, type: 'active', id: 'charge', name: '衝鋒', detail: '120% 傷害 · 加速', power: 1.2, cooldown: 9 },
    { level: 15, type: 'passive', name: '武器專精', detail: '武器傷害 +10%' },
    { level: 20, type: 'passive', name: '招架', detail: '10% 招架反擊' }
  ],
  mage: [
    { level: 1, type: 'active', id: 'fireball', name: '火球術', detail: '170% 傷害 · 燃燒', power: 1.7, cooldown: 4 },
    { level: 3, type: 'passive', name: '魔力增幅', detail: '魔法傷害 +15%' },
    { level: 5, type: 'active', id: 'blizzard', name: '暴風雪', detail: '全體 80% 傷害', power: .8, targets: 5, cooldown: 7 },
    { level: 8, type: 'passive', name: '閃現', detail: '受擊時機率無敵' },
    { level: 10, type: 'active', id: 'chain-lightning', name: '閃電鏈', detail: '最多 4 目標 · 麻痺', power: 1.3, targets: 4, cooldown: 9 },
    { level: 15, type: 'passive', name: '元素精通', detail: '元素傷害 +10%' },
    { level: 20, type: 'passive', name: '魔力護盾', detail: '低血量自動護盾' }
  ],
  assassin: [
    { level: 1, type: 'active', id: 'backstab', name: '背刺', detail: '180% 傷害 · 流血', power: 1.8, cooldown: 4 },
    { level: 3, type: 'passive', name: '致命一擊', detail: '暴擊 +10%' },
    { level: 5, type: 'active', id: 'shadow-dance', name: '影刃旋舞', detail: '全體 75% 傷害', power: .75, targets: 5, cooldown: 7 },
    { level: 8, type: 'passive', name: '閃避', detail: '10% 機率完全閃避' },
    { level: 10, type: 'active', id: 'poison-blade', name: '毒刃', detail: '強化攻擊 · 中毒', power: 1.25, cooldown: 9 },
    { level: 15, type: 'passive', name: '匕首專精', detail: '武器傷害 +10%' },
    { level: 20, type: 'passive', name: '絕境反擊', detail: '低血量攻擊、攻速提升' }
  ],
  hunter: [
    { level: 1, type: 'active', id: 'power-shot', name: '強力射擊', detail: '180% 傷害 · 緩攻', power: 1.8, cooldown: 4 },
    { level: 3, type: 'passive', name: '精準射擊', detail: '命中 +10%、暴擊 +5%' },
    { level: 5, type: 'active', id: 'companion', name: '戰寵召喚', detail: '戰寵協助攻擊', power: 1.5, cooldown: 9 },
    { level: 8, type: 'passive', name: '野性夥伴', detail: '戰寵生命、攻擊提升' },
    { level: 10, type: 'active', id: 'multi-shot', name: '多重箭', detail: '全體 75% 傷害', power: .75, targets: 5, cooldown: 7 },
    { level: 15, type: 'passive', name: '弓術專精', detail: '武器傷害 +10%' },
    { level: 20, type: 'passive', name: '獵人本能', detail: '第 6 次攻擊強化' }
  ],
  priest: [
    { level: 1, type: 'active', id: 'holy-light', name: '神聖之光', detail: '170% 傷害 · 降攻', power: 1.7, cooldown: 4 },
    { level: 3, type: 'passive', name: '神聖信仰', detail: '治療、魔法傷害提升' },
    { level: 5, type: 'active', id: 'holy-nova', name: '神聖新星', detail: '全體 80% 傷害', power: .8, targets: 5, cooldown: 7 },
    { level: 8, type: 'passive', name: '神聖庇護', detail: '低血量自動護盾' },
    { level: 10, type: 'active', id: 'heal', name: '治癒術', detail: '自動治療 · 過量護盾', cooldown: 9 },
    { level: 15, type: 'passive', name: '神恩', detail: '機率追加治療' },
    { level: 20, type: 'passive', name: '聖光恩典', detail: '治療後提升攻速' }
  ]
};
const skillProgression = Object.fromEntries(Object.keys(ClassSkillPolicy.SKILLS).map((job) => [
  job,
  ClassSkillPolicy.getSkills(job).map((entry) => ({
    ...entry,
    detail: entry.levels[0]?.breakthrough || entry.name,
    power: entry.levels[0]?.power,
    targets: entry.levels[0]?.targets || entry.targets
  }))
]));
const skillIcons = {
  'heavy-strike': '⚔', whirlwind: '🌀', charge: '➤', fireball: '🔥', blizzard: '❄', 'chain-lightning': '⚡',
  backstab: '🗡', 'shadow-dance': '✦', 'poison-blade': '☠', 'power-shot': '➶', companion: '🐺', 'multi-shot': '≋',
  'holy-light': '☀', 'holy-nova': '✣', heal: '✚'
};
function getSkillKey(job, skill) {
  return `${job}:${skill.id || `passive-${skill.level}`}`;
}

function getPassiveSkillUpgradeLevel(progress, job, name) {
  const skill = (skillProgression[job] || []).find((entry) => entry.type === 'passive' && entry.name === name);
  return skill ? getSkillUpgradeLevel(progress, job, skill) : 1;
}

function getSkillEffect(progress, job, skill) {
  return ClassSkillPolicy.getEffect(job, skill.id, getSkillUpgradeLevel(progress, job, skill)) || {};
}

function getHunterInstinctEffect(progress = getProgress()) {
  const definition = ClassSkillPolicy.getSkill('hunter', 'hunting-instinct');
  return ClassSkillPolicy.getEffect('hunter', 'hunting-instinct', getSkillUpgradeLevel(progress, 'hunter', definition));
}

function getPassiveSkillDetail(job, skill, progress = getProgress()) {
  const tier = getSkillUpgradeLevel(progress, job, skill);
  if (job === 'hunter' && skill.name === '精準射擊') return `命中 +${10 + (tier - 1) * 2}%、暴擊 +${5 + (tier - 1)}%`;
  if (job === 'hunter' && skill.name === '野性夥伴') return `戰寵生命提升、攻擊 +${15 + (tier - 1) * 10}%`;
  if (job === 'hunter' && skill.name === '弓術專精') return `武器傷害 +${10 + (tier - 1) * 2}%`;
  if (job === 'hunter' && skill.name === '獵人本能') {
    const effect = getHunterInstinctEffect(progress);
    return `每第 ${effect.interval} 次攻擊造成 ${Math.round(effect.multiplier * 100)}% 傷害${effect.extraAttack ? '，並額外攻擊 1 次' : ''}`;
  }
  return skill.detail;
}

function removeLegacySkillUpgradeMaterials(inventory) {
  return (Array.isArray(inventory) ? inventory : []).filter((item) => item?.id !== 'magic-crystal' && !/^magic-book-[2-6]$/.test(String(item?.id || '')));
}

function getSkillUpgradeLevel(progress, job, skill) {
  return Math.max(1, Math.min(SkillUpgradePolicy.MAX_SKILL_LEVEL, Number(progress?.skillLevels?.[getSkillKey(job, skill)]) || 1));
}

function getSkillPowerMultiplier(progress, job, skill) {
  const base = Number(skill.power) || 1;
  const power = Number(getSkillEffect(progress, job, skill).power);
  return power > 0 ? power / base : 1;
}

function getUnlockedChapter(progress) {
  return Math.max(1, Number(progress?.unlockedChapter) || 1);
}
let selection = { faction: 'light', race: 'human', job: 'warrior' };
let toastTimer;
let battleTimer;
let skillTimer;
let enemyAttackTimer;
let battleSessionSequence = 0;
let fighting = false;
let pendingOfflineReport = null;
let creationSlotIndex = 0;
let scrapSelection = new Set();
let inventoryCategory = 'weapon';
let workshopQuality = 'uncommon';
let workshopSlot = 'all';
let furnaceSelectedItemId = null;
let furnaceResult = null;
let furnaceBusy = false;
let alchemyInputItemIds = [null, null];
let alchemyCandidates = [];
let selectedAlchemyCandidate = null;
let alchemyBusy = false;
let battleLogMode = 'player';
let battleLogEntries = [];
let dropLookupCategory = 'all';
let dropLookupQuery = '';
let battle = { enemyTypes: ['goblin', 'wolf', 'boar', 'goblin', 'wolf'], enemyHps: [45, 68, 82, 45, 68], playerHp: 100, playerMana: 100, playerShield: 0, manaExhausted: false, playerAttackCharge: 0, globalSkillReadyAt: 0, undeadRevived: false, skillCooldowns: {}, enemyRespawns: [null, null, null, null, null], enemySpawnedAt: [0, 1, 2, 3, 4], enemyNextAttackAt: [0, 0, 0, 0, 0], enemyDots: [[], [], [], [], []], monsterMoveSpeed: 200, targetIndexes: [], enemyDamages: [[], [], [], [], []], damageTimers: [] };

function addRoundLoot(id, name, quantity = 1, icon = '◆', valuePrefix = '×') {
  if (!battle.roundLoot) battle.roundLoot = {};
  const key = String(id || name || 'loot');
  const current = battle.roundLoot[key] || { id: key, name: String(name || '未知物品'), quantity: 0, icon, valuePrefix, updatedAt: 0 };
  current.quantity += Math.max(0, Number(quantity) || 0);
  current.icon = icon || current.icon;
  current.valuePrefix = valuePrefix;
  current.updatedAt = Date.now();
  battle.roundLoot[key] = current;
}

function getNextAdventureMap(currentMap) {
  const nextId = ChapterOneProgressionPolicy.NEXT_MAP[currentMap.id];
  if (nextId) return mapProgression.find((map) => map.id === nextId) || (nextId === 'black-forest' ? mapProgression.find((map) => map.id === ChapterTwoMapPolicy.CHAPTER.id) : null);
  if (currentMap.chapter === 2) {
    const regions = mapProgression.filter((map) => map.chapter === 2 && map.regionOf && !map.dungeon);
    return regions[regions.findIndex((map) => map.id === currentMap.id) + 1] || null;
  }
  return null;
}

function renderBattleAdventureInfo(progress = getProgress()) {
  const currentMap = getActiveMap(progress);
  const requirement = ChapterOneProgressionPolicy.REQUIREMENTS[currentMap.id];
  const kills = Math.max(0, Number(progress.mapKillProgress?.[currentMap.id]) || 0);
  const target = Math.max(0, Number(requirement?.normalKills) || 0);
  const percent = target > 0 ? Math.min(100, Math.round(kills / target * 100)) : 0;
  const nextMap = getNextAdventureMap(currentMap);
  const name = document.querySelector('#region-progress-name');
  const chapter = document.querySelector('#region-progress-chapter');
  const count = document.querySelector('#region-progress-count');
  const bar = document.querySelector('#region-progress-bar');
  const track = document.querySelector('.region-progress-track');
  const next = document.querySelector('#region-progress-next');
  if (name) name.textContent = currentMap.name;
  if (chapter) chapter.textContent = `第 ${currentMap.chapter || 1} 章${requirement?.bossName ? `・區域首領 ${requirement.bossName}` : '・持續探索中'}`;
  if (count) count.textContent = target > 0 ? `${Math.min(kills, target)} / ${target}` : `${kills} 次擊殺`;
  if (bar) bar.style.width = target > 0 ? `${percent}%` : '0%';
  if (track) {
    track.setAttribute('aria-valuenow', String(percent));
    track.classList.toggle('is-open-ended', target <= 0);
  }
  if (next) next.textContent = nextMap?.name || '本章最終區域';

  const lootList = document.querySelector('#round-loot-list');
  if (!lootList) return;
  const entries = Object.values(battle.roundLoot || {}).sort((a, b) => (a.id === 'gold' ? -1 : b.id === 'gold' ? 1 : b.updatedAt - a.updatedAt)).slice(0, 8);
  lootList.innerHTML = entries.length ? entries.map((entry) => `<div class="round-loot-item"><span>${escapeBattleLogText(entry.icon)}</span><b>${escapeBattleLogText(entry.name)}</b><em>${entry.valuePrefix}${Math.floor(entry.quantity).toLocaleString('zh-TW')}</em></div>`).join('') : '<p>尚未獲得戰利品</p>';
}
let layoutEditMode = false;
let activeLayoutDrag = null;
let selectedLayoutTarget = 'hud';
const layoutTargets = [
  ['hud', '.battle-header'],
  ['map', '.battle-field'],
  ['back', '#leave-battle'],
  ['title', '#battle-title'],
  ['monster-level', '#map-level-text'],
  ['identity', '.map-identity'],
  ['race', '#race-totem'],
  ['job', '#job-mark'],
  ['log', '.combat-log'],
  ['skills', '.skill-panel'],
  ['menu', '.battle-menu'],
  ['bag', '[data-menu-action="背包"]'],
  ['equipment', '[data-menu-action="裝備"]'],
  ['party', '[data-menu-action="隊伍"]']
];
for (let skillIndex = 0; skillIndex < 7; skillIndex += 1) layoutTargets.push([`skill-${skillIndex}`, `#skill-${skillIndex}`]);

const defaultBattleLayout = {
  identity: { modified: true, left: 17, top: 74, width: 395, height: 209, fontSize: '', skillFontSize: '' },
  hud: { modified: true, left: 4, top: 4, width: 421, height: 290, fontSize: '', skillFontSize: '' },
  log: { modified: true, left: 4, top: 306, width: 410, height: 640, fontSize: '', skillFontSize: '' }
};

function repairCombatLogLayoutOnce() {
  const saved = JSON.parse(localStorage.getItem('stardust-battle-layout') || '{}');
  if (saved.combatLogFitVersion === 2) return;
  if (!saved.log || (saved.log.left === 4 && [254, 286].includes(saved.log.top))) {
    saved.log = { ...defaultBattleLayout.log };
  }
  saved.combatLogFitVersion = 2;
  localStorage.setItem('stardust-battle-layout', JSON.stringify(saved));
}

function repairSkillLayoutOnce() {
  const saved = JSON.parse(localStorage.getItem('stardust-battle-layout') || '{}');
  if (saved.skillLayoutVersion === 6) return;
  Object.keys(saved).filter((key) => key === 'skills' || key.startsWith('skill-')).forEach((key) => delete saved[key]);
  saved.skillLayoutVersion = 6;
  localStorage.setItem('stardust-battle-layout', JSON.stringify(saved));
}

function repairMenuLayoutOnce() {
  const saved = JSON.parse(localStorage.getItem('stardust-battle-layout') || '{}');
  if (saved.menuLayoutVersion === 1) return;
  ['menu', 'bag', 'equipment', 'party'].forEach((key) => delete saved[key]);
  saved.menuLayoutVersion = 1;
  localStorage.setItem('stardust-battle-layout', JSON.stringify(saved));
}

function repairHudLayoutOnce() {
  const saved = JSON.parse(localStorage.getItem('stardust-battle-layout') || '{}');
  if (saved.hudLayoutVersion === 3) return;
  if (!saved.hud || saved.hud.height === 250) saved.hud = { ...defaultBattleLayout.hud };
  if (!saved.identity || (saved.identity.left === 17 && saved.identity.top === 69)) {
    saved.identity = { ...defaultBattleLayout.identity };
  }
  saved.hudLayoutVersion = 3;
  localStorage.setItem('stardust-battle-layout', JSON.stringify(saved));
}

function getLayoutTargetElement(key) {
  const target = layoutTargets.find(([targetKey]) => targetKey === key);
  return target ? document.querySelector(target[1]) : null;
}

function prepareLayoutElement(element) {
  if (!element || element.style.position === 'fixed') return element;
  if (element.classList.contains('skill-chip')) {
    element.style.position = 'relative';
    element.style.zIndex = '10';
    return element;
  }
  const rect = element.getBoundingClientRect();
  element.style.position = 'fixed';
  element.style.left = `${rect.left}px`;
  element.style.top = `${rect.top}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
  element.style.margin = '0';
  element.style.zIndex = '20';
  return element;
}

function moveSelectedLayout(direction) {
  const element = prepareLayoutElement(getLayoutTargetElement(selectedLayoutTarget));
  if (!element) return;
  const step = 20;
  const moves = { up: [0, -step], down: [0, step], left: [-step, 0], right: [step, 0] };
  const [moveX, moveY] = moves[direction] || [0, 0];
  if (element.classList.contains('skill-chip')) {
    element.style.left = `${(Number.parseFloat(element.style.left) || 0) + moveX}px`;
    element.style.top = `${(Number.parseFloat(element.style.top) || 0) + moveY}px`;
    saveCurrentLayout();
    return;
  }
  const maxLeft = Math.max(0, window.innerWidth - element.offsetWidth);
  const maxTop = Math.max(0, window.innerHeight - element.offsetHeight);
  const left = Math.max(0, Math.min(maxLeft, element.getBoundingClientRect().left + moveX));
  const top = Math.max(0, Math.min(maxTop, element.getBoundingClientRect().top + moveY));
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  saveCurrentLayout();
}

function resizeSelectedLayout(sizeChange, axis = 'both') {
  const element = prepareLayoutElement(getLayoutTargetElement(selectedLayoutTarget));
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const multiplier = sizeChange === 'larger' ? 1.15 : 0.85;
  const width = axis === 'height' ? rect.width : Math.max(48, Math.min(window.innerWidth - rect.left, Math.round(rect.width * multiplier)));
  const height = axis === 'width' ? rect.height : Math.max(32, Math.min(window.innerHeight - rect.top, Math.round(rect.height * multiplier)));
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  saveCurrentLayout();
}

function resizeSelectedFont(sizeChange) {
  const element = getLayoutTargetElement(selectedLayoutTarget);
  if (!element) return;
  const currentSize = Number.parseFloat(getComputedStyle(element).fontSize) || 12;
  const newSize = Math.max(8, Math.min(60, currentSize + (sizeChange === 'larger' ? 2 : -2)));
  if (element.classList.contains('skill-chip')) {
    element.style.setProperty('--layout-skill-font-size', `${newSize}px`);
  } else {
    element.style.fontSize = `${newSize}px`;
  }
  saveCurrentLayout();
}

function applySavedLayout() {
  const saved = { ...defaultBattleLayout, ...JSON.parse(localStorage.getItem('stardust-battle-layout') || '{}') };
  layoutTargets.forEach(([key, selector]) => {
    const layout = saved[key];
    const element = document.querySelector(selector);
    if (!layout || !layout.modified || !element) return;
    if (key === 'log' && isMobileBattleLayout()) {
      ['position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'margin', 'z-index'].forEach((property) => {
        element.style.removeProperty(property);
      });
      return;
    }
    if (layout.skillRelative && element.classList.contains('skill-chip')) {
      element.style.position = 'relative';
      element.style.left = layout.leftOffset || '0px';
      element.style.top = layout.topOffset || '0px';
      element.style.width = `${layout.width}px`;
      element.style.height = layout.height ? `${layout.height}px` : '';
      element.style.zIndex = '10';
      if (layout.fontSize) element.style.fontSize = layout.fontSize;
      if (layout.skillFontSize) element.style.setProperty('--layout-skill-font-size', layout.skillFontSize);
      return;
    }
    element.style.position = 'fixed';
    element.style.left = `${layout.left}px`;
    element.style.top = `${layout.top}px`;
    element.style.width = `${layout.width}px`;
    element.style.height = layout.height ? `${layout.height}px` : '';
    element.style.margin = '0';
    element.style.zIndex = '20';
    if (key === 'log') {
      element.style.setProperty('position', 'fixed', 'important');
      element.style.setProperty('left', `${layout.left}px`, 'important');
      element.style.setProperty('top', `${layout.top}px`, 'important');
    }
    if (layout.fontSize) element.style.fontSize = layout.fontSize;
    if (layout.skillFontSize) element.style.setProperty('--layout-skill-font-size', layout.skillFontSize);
  });
}

function saveCurrentLayout() {
  const saved = JSON.parse(localStorage.getItem('stardust-battle-layout') || '{}');
  const changedElement = activeLayoutDrag?.element || getLayoutTargetElement(selectedLayoutTarget);
  const changedTarget = layoutTargets.find(([, selector]) => document.querySelector(selector) === changedElement);
  if (!changedElement || !changedTarget) return;
  const rect = changedElement.getBoundingClientRect();
  saved[changedTarget[0]] = changedElement.classList.contains('skill-chip')
    ? { modified: true, skillRelative: true, leftOffset: changedElement.style.left || '0px', topOffset: changedElement.style.top || '0px', width: Math.round(rect.width), height: Math.round(rect.height), fontSize: changedElement.style.fontSize || '', skillFontSize: changedElement.style.getPropertyValue('--layout-skill-font-size') || '' }
    : { modified: true, left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height), fontSize: changedElement.style.fontSize || '', skillFontSize: changedElement.style.getPropertyValue('--layout-skill-font-size') || '' };
  localStorage.setItem('stardust-battle-layout', JSON.stringify(saved));
}

function saveVisibleAdjustedLayout() {
  const saved = JSON.parse(localStorage.getItem('stardust-battle-layout') || '{}');
  layoutTargets.forEach(([key, selector]) => {
    const element = document.querySelector(selector);
    if (!element) return;
    const isSkill = element.classList.contains('skill-chip');
    const isChanged = element.style.position === 'fixed' || element.style.fontSize || element.style.width || element.style.height || (isSkill && (element.style.left || element.style.top || element.style.getPropertyValue('--layout-skill-font-size')));
    if (!isChanged) return;
    const rect = element.getBoundingClientRect();
    saved[key] = isSkill
      ? { modified: true, skillRelative: true, leftOffset: element.style.left || '0px', topOffset: element.style.top || '0px', width: Math.round(rect.width), height: Math.round(rect.height), fontSize: element.style.fontSize || '', skillFontSize: element.style.getPropertyValue('--layout-skill-font-size') || '' }
      : { modified: true, left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height), fontSize: element.style.fontSize || '', skillFontSize: element.style.getPropertyValue('--layout-skill-font-size') || '' };
  });
  localStorage.setItem('stardust-battle-layout', JSON.stringify(saved));
}

function setupLayoutDrag() {
  layoutTargets.forEach(([, selector]) => {
    const element = document.querySelector(selector);
    if (!element || element.dataset.layoutDragReady) return;
    element.dataset.layoutDragReady = 'true';
    element.addEventListener('pointerdown', (event) => {
      if (!layoutEditMode || (event.pointerType === 'mouse' && event.button !== 0)) return;
      if (event.target.closest('button, input, select, a')) return;
      const clickedTarget = layoutTargets.find(([, targetSelector]) => document.querySelector(targetSelector) === element);
      if (clickedTarget) {
        selectedLayoutTarget = clickedTarget[0];
        const skillSelect = document.querySelector('#layout-skill-select');
        if (clickedTarget[0].startsWith('skill-')) skillSelect.value = clickedTarget[0];
        document.querySelectorAll('[data-layout-target]').forEach((item) => item.classList.toggle('selected', item.dataset.layoutTarget === clickedTarget[0]));
      }
      event.stopPropagation();
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      if (element.classList.contains('skill-chip')) {
        element.style.position = 'relative';
        element.style.zIndex = '10';
        element.classList.add('layout-dragging');
        activeLayoutDrag = { element, skillRelative: true, startX: event.clientX, startY: event.clientY, startLeft: Number.parseFloat(element.style.left) || 0, startTop: Number.parseFloat(element.style.top) || 0 };
        element.setPointerCapture(event.pointerId);
        return;
      }
      if (element.classList.contains('combat-log') && isMobileBattleLayout()) return;
      element.style.position = 'fixed';
      element.style.left = `${rect.left}px`;
      element.style.top = `${rect.top}px`;
      element.style.width = `${rect.width}px`;
      element.style.height = `${rect.height}px`;
      element.style.margin = '0';
      element.style.zIndex = '30';
      element.classList.add('layout-dragging');
      activeLayoutDrag = { element, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
      element.setPointerCapture(event.pointerId);
    });
    element.addEventListener('pointermove', (event) => {
      if (!activeLayoutDrag || activeLayoutDrag.element !== element) return;
      if (activeLayoutDrag.skillRelative) {
        element.style.left = `${activeLayoutDrag.startLeft + event.clientX - activeLayoutDrag.startX}px`;
        element.style.top = `${activeLayoutDrag.startTop + event.clientY - activeLayoutDrag.startY}px`;
        return;
      }
      const isCombatLog = element.classList.contains('combat-log');
      const maxLeft = Math.max(0, window.innerWidth - (isCombatLog ? 80 : element.offsetWidth));
      const maxTop = Math.max(0, window.innerHeight - (isCombatLog ? 80 : element.offsetHeight));
      const left = Math.max(0, Math.min(maxLeft, event.clientX - activeLayoutDrag.offsetX));
      const top = Math.max(0, Math.min(maxTop, event.clientY - activeLayoutDrag.offsetY));
      element.style.setProperty('left', `${left}px`, element.classList.contains('combat-log') ? 'important' : '');
      element.style.setProperty('top', `${top}px`, element.classList.contains('combat-log') ? 'important' : '');
    });
    element.addEventListener('pointerup', (event) => {
      if (!activeLayoutDrag || activeLayoutDrag.element !== element) return;
      element.classList.remove('layout-dragging');
      element.releasePointerCapture(event.pointerId);
      activeLayoutDrag = null;
      saveCurrentLayout();
      if (element.classList.contains('combat-log')) {
        const rect = element.getBoundingClientRect();
        applyCombatLogPosition(Math.round(rect.left), Math.round(rect.top));
      }
    });
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function enterMenu(name) {
  displayName.textContent = name;
  loginScreen.classList.add('hidden');
  characterScreen.classList.add('hidden');
  battleScreen.classList.add('hidden');
  menuScreen.classList.remove('hidden');
}

function renderCreation() {
  const lockedFaction = getLockedFactionForCreation();
  document.querySelectorAll('[data-faction]').forEach((card) => {
    card.disabled = Boolean(lockedFaction && card.dataset.faction !== lockedFaction);
    card.classList.toggle('faction-locked', card.disabled);
    card.classList.toggle('selected', card.dataset.faction === selection.faction);
  });
  const lockNote = document.querySelector('#faction-lock-note');
  if (lockedFaction) {
    lockNote.textContent = `陣營已由第一角色鎖定為${lockedFaction === 'light' ? '光明陣營' : '暗影陣營'}，第二角色必須加入相同陣營。`;
    lockNote.classList.remove('hidden');
  } else lockNote.classList.add('hidden');
  raceChoices.innerHTML = factions[selection.faction].map((race) => `<button class="choice-card ${race.id === selection.race ? 'selected' : ''}" type="button" data-race="${race.id}"><span class="creation-race-icon race-${race.id}" aria-hidden="true"></span><strong>${race.name}</strong><small>${race.trait}</small></button>`).join('');
  classChoices.innerHTML = classes.filter((job) => !isJobHiddenForRace(selection.race, job.id)).map((job) => {
    const unavailable = isJobUnavailableForRace(selection.race, job.id);
    return `<button class="class-choice ${job.id === selection.job ? 'selected' : ''}" type="button" data-job="${job.id}" ${unavailable ? 'disabled aria-disabled="true" title="半獸人無法成為牧師"' : ''}><span class="creation-job-icon" aria-hidden="true">${jobMarks[job.id] || job.icon}</span><small>${job.name}${unavailable ? '（不可選）' : ''}</small></button>`;
  }).join('');
}

function openCreation(slotIndex = 0) {
  creationSlotIndex = slotIndex;
  const lockedFaction = getLockedFactionForCreation(slotIndex);
  if (lockedFaction) {
    selection.faction = lockedFaction;
    if (!factions[lockedFaction].some((race) => race.id === selection.race)) selection.race = factions[lockedFaction][0].id;
  }
  menuScreen.classList.add('hidden');
  characterScreen.classList.remove('hidden');
  characterName.value = '';
  document.querySelector('#character-title').textContent = slotIndex > 0 ? `建立第 ${slotIndex + 1} 角色` : '建立你的角色';
  renderCreation();
}

const monsterTypes = EquipmentDropPolicy.applyDefaultLootConfigs({
  plainsRabbit: { id: 'plainsRabbit', name: '野兔', maxHp: 24, attack: 5, defense: 0, evasion: 8, parry: 0, damageReduction: 0, artClass: 'plains-rabbit-art', xp: 4, gold: 1, lootConfig: EquipmentDropPolicy.TEST_LOOT_CONFIGS.normal },
  plainsWolfPup: { id: 'plainsWolfPup', name: '幼狼', maxHp: 34, attack: 7, defense: 1, evasion: 5, parry: 0, damageReduction: 0, artClass: 'plains-wolf-pup-art', xp: 4, gold: 2 },
  plainsSlime: { id: 'plainsSlime', name: '小史萊姆', maxHp: 30, attack: 6, defense: 0, evasion: 0, parry: 0, damageReduction: 5, artClass: 'plains-slime-art', xp: 4, gold: 1 },
  plainsGoblinYoung: { id: 'plainsGoblinYoung', name: '幼年哥布林', maxHp: 40, attack: 8, defense: 2, evasion: 2, parry: 3, damageReduction: 0, artClass: 'plains-goblin-young-art', xp: 4, gold: 2 },
  lostGoblin: { id: 'lostGoblin', name: '迷路的哥布林', maxHp: 62, attack: 10, defense: 4, evasion: 5, parry: 6, damageReduction: 2, artClass: 'lost-goblin-art', xp: 10, gold: 5, isRare: true },
  denForestWolf: { id: 'denForestWolf', name: '森林狼', maxHp: 58, attack: 11, defense: 3, evasion: 8, parry: 0, damageReduction: 0, artClass: 'den-forest-wolf-art', xp: 6, gold: 3, lootSource: 'wolf' },
  ragingWolf: { id: 'ragingWolf', name: '狂暴狼', maxHp: 125, attack: 16, defense: 6, evasion: 10, parry: 0, damageReduction: 4, artClass: 'den-raging-wolf-art', xp: 16, gold: 9, isElite: true, lootSource: 'wolf', lootConfig: EquipmentDropPolicy.TEST_LOOT_CONFIGS.elite },
  greatfangWolf: { id: 'greatfangWolf', name: '巨牙狼', maxHp: 480, attack: 21, defense: 12, evasion: 8, parry: 0, damageReduction: 8, artClass: 'den-greatfang-wolf-art', xp: 80, gold: 45, isBoss: true, lootSource: 'wolf', lootConfig: EquipmentDropPolicy.TEST_LOOT_CONFIGS.boss },
  boarPiglet: { id: 'boarPiglet', name: '小野豬', maxHp: 48, attack: 9, defense: 4, evasion: 3, parry: 0, damageReduction: 2, artClass: 'boar-woods-piglet-art', xp: 8, gold: 3, lootSource: 'boar' },
  forestBoar: { id: 'forestBoar', name: '森林野豬', maxHp: 78, attack: 13, defense: 8, evasion: 2, parry: 0, damageReduction: 5, artClass: 'boar-woods-forest-boar-art', xp: 8, gold: 5, lootSource: 'boar' },
  irritableBoar: { id: 'irritableBoar', name: '暴躁野豬', maxHp: 165, attack: 19, defense: 13, evasion: 2, parry: 0, damageReduction: 7, artClass: 'boar-woods-irritable-boar-art', xp: 20, gold: 12, isElite: true, lootSource: 'boar' },
  boarKing: { id: 'boarKing', name: '巨牙野豬', maxHp: 620, attack: 24, defense: 20, evasion: 1, parry: 0, damageReduction: 10, artClass: 'boar-woods-giant-tusk-boar-art', xp: 95, gold: 58, isBoss: true, lootSource: 'boar' },
  goblin: { id: 'goblin', name: '哥布林', maxHp: 45, attack: 11, defense: 3, evasion: 2, parry: 5, damageReduction: 0, artClass: 'goblin-art', xp: 10, gold: 3 },
  goblinScout: { id: 'goblinScout', name: '哥布林斥候', maxHp: 48, attack: 10, defense: 2, evasion: 7, parry: 3, damageReduction: 0, artClass: 'goblin-camp-scout-art', xp: 10, gold: 3, lootPending: true },
  goblinWarrior: { id: 'goblinWarrior', name: '哥布林戰士', maxHp: 82, attack: 13, defense: 7, evasion: 2, parry: 20, damageReduction: 3, artClass: 'goblin-camp-warrior-art', xp: 10, gold: 5, lootPending: true },
  goblinSlinger: { id: 'goblinSlinger', name: '哥布林投石者', maxHp: 58, attack: 14, defense: 3, evasion: 5, parry: 0, damageReduction: 1, artClass: 'goblin-camp-slinger-art', xp: 10, gold: 4, lootPending: true },
  goblinShaman: { id: 'goblinShaman', name: '哥布林薩滿', maxHp: 175, attack: 17, defense: 8, evasion: 5, parry: 2, damageReduction: 5, artClass: 'goblin-camp-shaman-art', xp: 28, gold: 12, isElite: true, lootPending: true },
  goblinGuard: { id: 'goblinGuard', name: '哥布林護衛', maxHp: 245, attack: 16, defense: 15, evasion: 2, parry: 13, damageReduction: 8, artClass: 'goblin-camp-guard-art', xp: 28, gold: 16, isElite: true, lootPending: true },
  goblinCaptain: { id: 'goblinCaptain', name: '哥布林隊長', maxHp: 720, attack: 21, defense: 19, evasion: 4, parry: 25, damageReduction: 18, artClass: 'goblin-camp-captain-art', xp: 120, gold: 65, isBoss: true, lootPending: true },
  goblinTreasureChest: { id: 'goblinTreasureChest', name: '哥布林寶箱', maxHp: 210, attack: 1, defense: 18, evasion: 0, parry: 0, damageReduction: 12, artClass: 'goblin-treasure-chest-art', xp: 28, gold: 45, isRare: true, lootPending: true },
  goblinHighChief: { id: 'goblinHighChief', name: '哥布林大酋長', maxHp: 1180, attack: 25, defense: 25, evasion: 4, parry: 15, damageReduction: 11, artClass: 'goblin-camp-high-chief-art', xp: 120, gold: 110, isBoss: true, lootPending: true },
  wolf: { id: 'wolf', name: '森林狼', maxHp: 68, attack: 14, defense: 2, evasion: 8, parry: 0, damageReduction: 0, artClass: 'wolf-art', xp: 14, gold: 4 },
  boar: { id: 'boar', name: '野豬', maxHp: 82, attack: 17, defense: 7, evasion: 1, parry: 0, damageReduction: 4, artClass: 'boar-art', xp: 18, gold: 5 },
  goblinOverlord: { id: 'goblinOverlord', name: '哥布林督軍', maxHp: 320, attack: 14, defense: 14, evasion: 4, parry: 10, damageReduction: 5, artClass: 'goblin-art', xp: 90, gold: 35, isElite: true, lootSource: 'goblin' },
  wolfAlpha: { id: 'wolfAlpha', name: '霜牙狼王', maxHp: 410, attack: 17, defense: 9, evasion: 12, parry: 0, damageReduction: 5, artClass: 'wolf-art', xp: 120, gold: 48, isElite: true, lootSource: 'wolf' },
  boarTyrant: { id: 'boarTyrant', name: '獠牙巨獸', maxHp: 520, attack: 20, defense: 20, evasion: 2, parry: 0, damageReduction: 8, artClass: 'boar-art', xp: 150, gold: 62, isElite: true, lootSource: 'boar' },
  goblinKing: { id: 'goblinKing', name: '赤冠哥布林王', maxHp: 1500, attack: 22, defense: 28, evasion: 6, parry: 15, damageReduction: 12, artClass: 'goblin-king-art', xp: 520, gold: 260, isBoss: true, lootSource: 'boss' },
  nightGoblin: { id: 'nightGoblin', name: '夜行哥布林', maxHp: 120, attack: 14, defense: 8, evasion: 7, parry: 7, damageReduction: 3, artClass: 'black-forest-goblin black-forest-monster', xp: 5, gold: 7, lootSource: 'blackGoblin' },
  shadowWolf: { id: 'shadowWolf', name: '幽影森林狼', maxHp: 150, attack: 17, defense: 6, evasion: 12, parry: 0, damageReduction: 3, artClass: 'black-forest-wolf black-forest-monster', xp: 5, gold: 8, lootSource: 'blackWolf' },
  thornBoar: { id: 'thornBoar', name: '荊棘野豬', maxHp: 185, attack: 20, defense: 16, evasion: 2, parry: 0, damageReduction: 8, artClass: 'black-forest-boar black-forest-monster', xp: 5, gold: 9, lootSource: 'blackBoar' },
  forestShaman: { id: 'forestShaman', name: '黑林薩滿', maxHp: 540, attack: 18, defense: 12, evasion: 8, parry: 4, damageReduction: 10, artClass: 'black-forest-goblin black-forest-elite', xp: 20, gold: 45, isElite: true, lootSource: 'blackGoblin' },
  moonfangAlpha: { id: 'moonfangAlpha', name: '月牙狼王', maxHp: 680, attack: 21, defense: 14, evasion: 15, parry: 0, damageReduction: 8, artClass: 'black-forest-wolf black-forest-elite', xp: 20, gold: 55, isElite: true, lootSource: 'blackWolf' },
  thornbackTyrant: { id: 'thornbackTyrant', name: '棘背暴君', maxHp: 820, attack: 24, defense: 25, evasion: 3, parry: 0, damageReduction: 12, artClass: 'black-forest-boar black-forest-elite', xp: 20, gold: 65, isElite: true, lootSource: 'blackBoar' },
  forestGuardian: { id: 'forestGuardian', name: '腐月森林守衛', maxHp: 2400, attack: 28, defense: 36, evasion: 5, parry: 8, damageReduction: 15, artClass: 'black-forest-guardian black-forest-boss', xp: 80, gold: 320, isBoss: true, lootSource: 'blackBoss' },
  rootExecutioner: { id: 'rootExecutioner', name: '根縛行刑者', maxHp: 920, attack: 27, defense: 24, evasion: 4, parry: 12, damageReduction: 10, artClass: 'dungeon-root-executioner dungeon-monster-art', xp: 32, gold: 70, isElite: true, lootSource: 'dungeonElite' },
  altarNightblade: { id: 'altarNightblade', name: '祭壇夜刃', maxHp: 820, attack: 31, defense: 14, evasion: 14, parry: 14, damageReduction: 8, artClass: 'dungeon-nightblade dungeon-monster-art', xp: 32, gold: 74, isElite: true, lootSource: 'dungeonElite' },
  moonboneSentinel: { id: 'moonboneSentinel', name: '月骨守衛', maxHp: 1120, attack: 25, defense: 32, evasion: 3, parry: 10, damageReduction: 14, artClass: 'dungeon-moonbone dungeon-monster-art', xp: 32, gold: 78, isElite: true, lootSource: 'dungeonElite' },
  blightOracle: { id: 'blightOracle', name: '疫木神諭', maxHp: 860, attack: 30, defense: 16, evasion: 10, parry: 3, damageReduction: 12, artClass: 'dungeon-oracle dungeon-monster-art', xp: 32, gold: 76, isElite: true, lootSource: 'dungeonElite' },
  eclipseSovereign: { id: 'eclipseSovereign', name: '蝕月鹿王', maxHp: 5200, attack: 39, defense: 45, evasion: 8, parry: 12, damageReduction: 18, artClass: 'dungeon-boss dungeon-monster-art', xp: 180, gold: 620, isBoss: true, lootSource: 'dungeonBoss' },
  ...PlainsDepthsPolicy.MONSTER_TYPES,
  ...Object.fromEntries(BlackForestEntrancePolicy.MONSTERS.map((entry) => [entry.combatId, BlackForestEntrancePolicy.toCombatMonster(entry)])),
  ...Object.fromEntries(BlackForestTrailPolicy.MONSTERS.map((entry) => [entry.combatId, BlackForestTrailPolicy.toCombatMonster(entry)])),
  ...Object.fromEntries(SpiderNestPolicy.MONSTERS.map((entry) => [entry.combatId, SpiderNestPolicy.toCombatMonster(entry)])),
  ...Object.fromEntries(BlackstoneStrongholdPolicy.MONSTERS.map((entry) => [entry.combatId, BlackstoneStrongholdPolicy.toCombatMonster(entry)])),
  ...Object.fromEntries(ForestAltarPolicy.MONSTERS.map((entry) => [entry.combatId, ForestAltarPolicy.toCombatMonster(entry)])),
  ...Object.fromEntries(BlackForestDepthsPolicy.MONSTERS.map((entry) => [entry.combatId, BlackForestDepthsPolicy.toCombatMonster(entry)]))
});
const normalMonsterIds = ['goblin', 'wolf', 'boar'];
const eliteMonsterIds = ['goblinOverlord', 'wolfAlpha', 'boarTyrant'];
const bossMonsterIds = ['goblinKing'];

// Visual-size categories describe the creature body, not its combat rank.
// CSS values compensate for the taller enemy image frame; 1.0 means the
// resulting visible body matches a standard humanoid player, not scale: 1.
const monsterVisualSizeOverrides = {
  plainsRabbit: 'small', plainsWolfPup: 'small', plainsSlime: 'small', plainsGoblinYoung: 'small',
  boarPiglet: 'small', goblinTreasureChest: 'small',
  boarTyrant: 'large', thornbackTyrant: 'large', forestGuardian: 'large',
  rootExecutioner: 'large', moonboneSentinel: 'large'
};

// Optional per-asset correction for unusual aspect ratios or transparent
// padding. New monsters can provide visualScaleCorrection on their definition.
const monsterVisualScaleCorrections = {
  plainsRabbit: 1.15,
  plainsGoblinYoung: .9
};

function getMonsterVisualSize(enemy = {}) {
  if (enemy.visualSize) return enemy.visualSize;
  if (monsterVisualSizeOverrides[enemy.id]) return monsterVisualSizeOverrides[enemy.id];
  const identity = `${enemy.id || ''} ${enemy.name || ''}`.toLowerCase();
  if (/rabbit|slime|pup|piglet|spider|幼狼|小野豬|史萊姆|野兔/.test(identity)) return 'small';
  if (/treant|guardian|tyrant|centurion|colossus|巨獸|暴君|古樹|樹人/.test(identity)) return 'large';
  if (enemy.race === 'beast' || /wolf|boar|beast|bear|狼|野豬|猛獸/.test(identity)) return 'beast';
  return 'humanoid';
}
const mapMonsterPools = {
  plainsEntrance: { normal: ['plainsRabbit', 'plainsWolfPup', 'plainsSlime', 'plainsGoblinYoung'], rare: ['lostGoblin'], rareChance: .10, elite: [], boss: [] },
  wolfDen: { normal: ['plainsWolfPup', 'denForestWolf'], rare: ['lostGoblin'], rareChance: .10, elite: ['ragingWolf'], boss: ['greatfangWolf'] },
  boarWoods: { normal: ['boarPiglet', 'forestBoar'], rare: ['lostGoblin'], rareChance: .10, elite: ['irritableBoar'], boss: ['boarKing'] },
  plainsDepths: PlainsDepthsPolicy.MONSTER_POOL,
  blackForestEntrance: BlackForestEntrancePolicy.getCombatPool(),
  blackForestTrail: BlackForestTrailPolicy.getCombatPool(),
  spiderNest: SpiderNestPolicy.getCombatPool(),
  blackstoneStronghold: BlackstoneStrongholdPolicy.getCombatPool(),
  forestAltar: ForestAltarPolicy.getCombatPool(),
  blackForestDepths: BlackForestDepthsPolicy.getCombatPool(),
  beginner: { normal: normalMonsterIds, elite: eliteMonsterIds, boss: bossMonsterIds },
  blackForest: { normal: ['nightGoblin', 'shadowWolf', 'thornBoar'], elite: ['forestShaman', 'moonfangAlpha', 'thornbackTyrant'], boss: ['forestGuardian'] }
};
const eliteSpawnChance = .08;
const bossSpawnChance = .03;
const dungeonEliteIds = ['rootExecutioner', 'altarNightblade', 'moonboneSentinel', 'blightOracle'];
const dungeonBossId = 'eclipseSovereign';
const GOBLIN_CAMP_TICKET_ID = 'goblin-camp-map';
const GOBLIN_CAMP_TICKET_DROP_RATE = .50;
const dungeonDefinitions = {
  'goblin-camp': { name: '哥布林營地', waves: 7, minWaves: 4, maxWaves: 7, ticketItemId: GOBLIN_CAMP_TICKET_ID, finalBossId: 'goblinHighChief' }
};
const dropLookupMapPools = {
  'plains-entrance': mapMonsterPools.plainsEntrance,
  'wolf-den': mapMonsterPools.wolfDen,
  'boar-woods': mapMonsterPools.boarWoods,
  'goblin-camp': { normal: [...new Set(Object.values(DungeonTicketCycle.GOBLIN_CAMP_WAVES).flat())], rare: [], elite: [], boss: [] },
  'plains-depths': mapMonsterPools.plainsDepths,
  'black-forest-entrance': mapMonsterPools.blackForestEntrance,
  'black-forest-trail': mapMonsterPools.blackForestTrail,
  'spider-nest': mapMonsterPools.spiderNest,
  'blackstone-stronghold': mapMonsterPools.blackstoneStronghold,
  'forest-altar': mapMonsterPools.forestAltar,
  'black-forest-depths': mapMonsterPools.blackForestDepths
};

const collectibleTemplates = CollectiblePolicy.COLLECTIBLE_CATALOG;
const collectibleDropRates = { normal: .01, elite: .08, boss: .30 };

const potionDropRate = .10;
const manaPotionDropRate = .07;
const PARTY_REVIVE_DELAY_MS = 10000;
const PARTY_REVIVE_HEALTH_RATIO = .30;
const PARTY_AUTO_POTION_HEALTH_RATIO = .35;

const equipmentSlots = {
  weapon: { label: '武器', icon: '⚔' },
  offhand: { label: '副手', icon: '🛡' },
  head: { label: '頭盔', icon: '⛑' },
  armor: { label: '盔甲', icon: '🦺' },
  pants: { label: '褲子', icon: '👖' },
  gloves: { label: '手套', icon: '🧤' },
  boots: { label: '鞋子', icon: '👢' },
  wrist: { label: '護腕', icon: '◌' },
  shoulders: { label: '肩甲', icon: '◈' },
  cloak: { label: '斗篷', icon: '🧣' },
  belt: { label: '腰帶', icon: '➿' },
  necklace: { label: '項鍊', icon: '📿' },
  ring1: { label: '戒指 1', icon: '💍' },
  ring2: { label: '戒指 2', icon: '💍' }
};

function emptyEquipment() { return Object.fromEntries(Object.keys(equipmentSlots).map((slot) => [slot, null])); }

function createStarterEquipment(job = 'warrior') {
  const starterSets = {
    warrior: [
      { name: '新兵鐵劍', slot: 'weapon', weaponType: 'sword', image: 'assets/goblin-short-sword.png', attack: 5, defense: 1, hp: 0 },
      { name: '新兵戰甲', slot: 'armor', armorType: 'heavy', image: 'assets/hardened-hide-armor.png', attack: 0, defense: 3, hp: 20 }
    ],
    assassin: [
      { name: '新兵匕首', slot: 'weapon', weaponType: 'dagger', image: 'assets/wolf-fang-dagger.png', attack: 6, defense: 0, hp: 0 },
      { name: '新兵夜行衣', slot: 'armor', armorType: 'leather', image: 'assets/hunter-leather-armor.png', attack: 1, defense: 2, hp: 14 }
    ],
    hunter: [
      { name: '新兵短弓', slot: 'weapon', weaponType: 'bow', image: 'assets/black-forest-bow.png', attack: 6, defense: 0, hp: 0 },
      { name: '新兵獵裝', slot: 'armor', armorType: 'leather', image: 'assets/hunter-leather-armor.png', attack: 0, defense: 2, hp: 16 },
      HunterArrowPolicy.createStarterQuiver()
    ],
    mage: [
      { name: '新兵法杖', slot: 'weapon', weaponType: 'staff', image: 'assets/boar-bone-staff.png', attack: 7, defense: 0, hp: 0 },
      { name: '新兵法袍', slot: 'armor', armorType: 'cloth', image: 'assets/rough-cloth-vest.png', attack: 1, defense: 2, hp: 12 }
    ],
    priest: [
      { name: '新兵聖杖', slot: 'weapon', weaponType: 'staff', image: 'assets/boar-bone-staff.png', attack: 5, defense: 1, hp: 8 },
      { name: '新兵祭袍', slot: 'armor', armorType: 'cloth', image: 'assets/rough-cloth-vest.png', attack: 0, defense: 3, hp: 18 }
    ]
  };
  const equipment = emptyEquipment();
  (starterSets[job] || starterSets.warrior).forEach((item, index) => {
    const allowedJobs = item.slot === 'weapon' && ['staff', 'one-handed-wand'].includes(item.weaponType)
      ? ['mage', 'priest']
      : [job];
    equipment[item.slot] = { ...item, id: `starter-${job}-${item.slot}-${index}`, kind: 'equipment', quality: '新兵', allowedJobs };
  });
  return equipment;
}

function normalizeCasterWeaponJobs(item) {
  if (!item || item.kind !== 'equipment' || item.slot !== 'weapon') return item;
  if (!['staff', 'one-handed-wand'].includes(item.weaponType)) return item;
  return { ...item, allowedJobs: ['mage', 'priest'] };
}

const equipmentVisualByTemplateId = {
  'logging-hatchet': 'assets/logging-hatchet.png',
  'warrior-hatchet': 'assets/warrior-hatchet.png',
  'rusty-dagger': 'assets/rusty-dagger.png',
  'assassin-shortblade': 'assets/assassin-shortblade.png',
  'apprentice-staff': 'assets/apprentice-staff.png',
  'arcane-staff': 'assets/arcane-staff.png',
  'battle-greataxe': 'assets/battle-greataxe.png',
  'rockbreaker-greataxe': 'assets/rockbreaker-greataxe.png',
  'short-iron-sword': 'assets/short-iron-sword.png',
  'knight-longsword': 'assets/knight-longsword.png',
  'hunter-shortbow': 'assets/hunter-shortbow.png',
  'long-hunting-bow': 'assets/long-hunting-bow.png',
  'mercenary-greatsword': 'assets/mercenary-greatsword.png',
  'giant-iron-sword': 'assets/giant-iron-sword.png',
  'forest-guard-longsword': 'assets/forest-guard-longsword.png',
  'mercenary-broadsword': 'assets/mercenary-broadsword.png',
  'woodcutter-greatsword': 'assets/woodcutter-greatsword.png',
  'black-iron-greatsword': 'assets/black-iron-greatsword.png',
  'forest-felling-axe': 'assets/forest-felling-axe.png',
  'bonebreaker-hatchet': 'assets/bonebreaker-hatchet.png',
  'greatwood-battleaxe': 'assets/greatwood-battleaxe.png',
  'armorbreaker-greataxe': 'assets/armorbreaker-greataxe.png',
  'longbranch-hunting-bow': 'assets/longbranch-hunting-bow.png',
  'forest-piercing-longbow': 'assets/forest-piercing-longbow.png',
  'venomfang-dagger': 'assets/venomfang-dagger.png',
  'darkwood-shortblade': 'assets/darkwood-shortblade.png',
  'ancient-wood-wand': 'assets/ancient-wood-wand.png',
  'spore-wand': 'assets/spore-wand.png',
  'blackstone-corrupted-plate': 'assets/blackstone-corrupted-plate.png',
  'blackstone-corrupted-helm': 'assets/blackstone-corrupted-helm.png',
  'blackstone-corrupted-legguards': 'assets/blackstone-corrupted-legguards.png',
  'blackstone-corrupted-gauntlets': 'assets/blackstone-corrupted-gauntlets.png',
  'blackstone-corrupted-warboots': 'assets/blackstone-corrupted-warboots.png',
  'deepwood-hunter-hood': 'assets/deepwood-hunter-hood.png',
  'deepwood-hunter-vest': 'assets/deepwood-hunter-vest.png',
  'deepwood-hunter-legguards': 'assets/deepwood-hunter-legguards.png',
  'deepwood-hunter-gloves': 'assets/deepwood-hunter-gloves.png',
  'deepwood-hunter-boots': 'assets/deepwood-hunter-boots.png'
};

function applyEquipmentVisual(item) {
  if (!item || item.kind !== 'equipment') return item;
  const templateId = item.templateId || item.baseItemId;
  const image = equipmentVisualByTemplateId[templateId]
    || (item.name === '伐木手斧' ? equipmentVisualByTemplateId['logging-hatchet'] : '')
    || (item.name === '戰士手斧' ? equipmentVisualByTemplateId['warrior-hatchet'] : '')
    || (item.name === '生鏽匕首' ? equipmentVisualByTemplateId['rusty-dagger'] : '')
    || (item.name === '刺客短刃' ? equipmentVisualByTemplateId['assassin-shortblade'] : '')
    || (item.name === '學徒法杖' ? equipmentVisualByTemplateId['apprentice-staff'] : '')
    || (item.name === '魔導法杖' ? equipmentVisualByTemplateId['arcane-staff'] : '')
    || (item.name === '戰鬥巨斧' ? equipmentVisualByTemplateId['battle-greataxe'] : '')
    || (item.name === '碎岩巨斧' ? equipmentVisualByTemplateId['rockbreaker-greataxe'] : '')
    || (item.name === '短鐵劍' ? equipmentVisualByTemplateId['short-iron-sword'] : '')
    || (item.name === '騎士長劍' ? equipmentVisualByTemplateId['knight-longsword'] : '')
    || (item.name === '獵人短弓' ? equipmentVisualByTemplateId['hunter-shortbow'] : '')
    || (item.name === '長獵弓' ? equipmentVisualByTemplateId['long-hunting-bow'] : '')
    || (item.name === '傭兵大劍' ? equipmentVisualByTemplateId['mercenary-greatsword'] : '')
    || (item.name === '巨鐵劍' ? equipmentVisualByTemplateId['giant-iron-sword'] : '')
    || (item.name === '林衛長劍' ? equipmentVisualByTemplateId['forest-guard-longsword'] : '')
    || (item.name === '傭兵闊劍' ? equipmentVisualByTemplateId['mercenary-broadsword'] : '')
    || (item.name === '斬木巨劍' ? equipmentVisualByTemplateId['woodcutter-greatsword'] : '')
    || (item.name === '黑鐵重劍' ? equipmentVisualByTemplateId['black-iron-greatsword'] : '')
    || (item.name === '伐林戰斧' ? equipmentVisualByTemplateId['forest-felling-axe'] : '')
    || (item.name === '裂骨手斧' ? equipmentVisualByTemplateId['bonebreaker-hatchet'] : '')
    || (item.name === '巨木戰斧' ? equipmentVisualByTemplateId['greatwood-battleaxe'] : '')
    || (item.name === '破甲重斧' ? equipmentVisualByTemplateId['armorbreaker-greataxe'] : '')
    || (item.name === '長枝獵弓' ? equipmentVisualByTemplateId['longbranch-hunting-bow'] : '')
    || (item.name === '穿林長弓' ? equipmentVisualByTemplateId['forest-piercing-longbow'] : '')
    || (item.name === '毒牙匕首' ? equipmentVisualByTemplateId['venomfang-dagger'] : '')
    || (item.name === '暗林短刃' ? equipmentVisualByTemplateId['darkwood-shortblade'] : '')
    || (item.name === '古木魔杖' ? equipmentVisualByTemplateId['ancient-wood-wand'] : '')
    || (item.name === '孢子魔杖' ? equipmentVisualByTemplateId['spore-wand'] : '');
  if (image) return { ...item, image, imageStatus: 'ready' };
  return item;
}

const wearableSeriesNames = Object.freeze({
  'recipe-green-wrist': '平原護腕配方',
  'recipe-green-cloak': '平原斗篷配方',
  'recipe-green-shoulders': '平原肩甲配方',
  'crafted-green-wrist': '平原護腕',
  'crafted-green-cloak': '平原斗篷',
  'crafted-green-shoulders': '平原肩甲',
  'recipe-chapter2-green-wrist': '黑森林護腕製作書',
  'recipe-chapter2-green-cloak': '黑森林斗篷製作書',
  'recipe-chapter2-green-shoulders': '黑森林肩甲製作書',
  'crafted-chapter2-green-wrist': '黑森林護腕',
  'crafted-chapter2-green-cloak': '黑森林斗篷',
  'crafted-chapter2-green-shoulders': '黑森林肩甲'
});
const wearableSeriesVisuals = Object.freeze({
  'recipe-green-wrist': 'assets/plains-wrist.png?v=20260815-user-image-v1',
  'recipe-green-cloak': 'assets/plains-cloak.png?v=20260815-user-image-v1',
  'recipe-green-shoulders': 'assets/plains-shoulders.png?v=20260815-user-image-v1',
  'crafted-green-wrist': 'assets/plains-wrist.png?v=20260815-user-image-v1',
  'crafted-green-cloak': 'assets/plains-cloak.png?v=20260815-user-image-v1',
  'crafted-green-shoulders': 'assets/plains-shoulders.png?v=20260815-user-image-v1',
  'recipe-goblin-rare-cloak': 'assets/goblin-rare-cloak.png?v=20260815-user-image-v1',
  'recipe-high-chief-rare-wrist': 'assets/high-chief-rare-wrist.png?v=20260815-user-image-v1',
  'recipe-black-knight-rare-shoulders': 'assets/black-knight-rare-shoulders.png?v=20260815-user-image-v1',
  'crafted-goblin-rare-cloak': 'assets/goblin-rare-cloak.png?v=20260815-user-image-v1',
  'crafted-high-chief-rare-wrist': 'assets/high-chief-rare-wrist.png?v=20260815-user-image-v1',
  'crafted-black-knight-rare-shoulders': 'assets/black-knight-rare-shoulders.png?v=20260815-user-image-v1'
});

function normalizeWearableSeriesName(item) {
  if (!item || typeof item !== 'object') return item;
  const catalogId = item.equipmentId || item.templateId || item.id;
  const name = wearableSeriesNames[catalogId];
  const image = wearableSeriesVisuals[catalogId];
  return name || image ? { ...item, ...(name ? { name } : {}), ...(image ? { image, imageStatus: 'ready' } : {}) } : item;
}

const TAB_ACTIVE_CHARACTER_SLOT_KEY = 'stardust-tab-active-character-slot';

function getActiveCharacterSlotIndex() {
  const slots = JSON.parse(localStorage.getItem('stardust-character-slots') || '[]');
  const legacyIndex = Number(localStorage.getItem('stardust-active-character-slot') || 0);
  const storedTabIndex = sessionStorage.getItem(TAB_ACTIVE_CHARACTER_SLOT_KEY);
  const tabIndex = storedTabIndex === null ? NaN : Number(storedTabIndex);
  const requestedIndex = Number.isInteger(tabIndex) && tabIndex >= 0 ? tabIndex : legacyIndex;
  return Array.isArray(slots) && slots[requestedIndex] ? requestedIndex : 0;
}

function setActiveCharacterSlotIndex(index) {
  sessionStorage.setItem(TAB_ACTIVE_CHARACTER_SLOT_KEY, String(index));
  localStorage.setItem('stardust-active-character-slot', String(index));
}

function getActiveCharacter() {
  const slots = JSON.parse(localStorage.getItem('stardust-character-slots') || '[]');
  return slots[getActiveCharacterSlotIndex()]?.character
    || JSON.parse(localStorage.getItem('stardust-character') || 'null');
}

function getProgress() {
  const slots = JSON.parse(localStorage.getItem('stardust-character-slots') || '[]');
  const slotProgress = Array.isArray(slots) ? slots[getActiveCharacterSlotIndex()]?.progress : null;
  const saved = JSON.parse(JSON.stringify(slotProgress || JSON.parse(localStorage.getItem('stardust-progress') || '{}')));
  if (['black-forest', 'black-forest-altar'].includes(saved.selectedMapId)) {
    saved.selectedMapId = 'plains-entrance';
    saved.dungeonAdmission = false;
    saved.dungeonReturnMapId = 'plains-entrance';
  }
  if (saved.magicCrystals === undefined && saved.skillEssence !== undefined) {
    saved.magicCrystals = Math.max(0, Number(saved.skillEssence) || 0);
    delete saved.skillEssence;
  }
  if (saved.starterGearVersion !== 'starter-gear-v1') {
    const character = getActiveCharacter();
    if (character?.job) {
      const starterEquipment = createStarterEquipment(character.job);
      saved.equipment = { ...emptyEquipment(), ...(saved.equipment || {}) };
      if (!saved.equipment.weapon) saved.equipment.weapon = starterEquipment.weapon;
      if (!saved.equipment.armor) saved.equipment.armor = starterEquipment.armor;
    }
    saved.starterGearVersion = 'starter-gear-v1';
    localStorage.setItem('stardust-progress', JSON.stringify(saved));
  }
  if (saved.equipmentRetentionVersion !== 'planned-catalog-and-starter-v2') {
    const character = getActiveCharacter();
    const starterEquipment = createStarterEquipment(character?.job || 'warrior');
    saved.inventory = EquipmentPolicy.removeLegacyEquipmentFromInventory(saved.inventory);
    saved.equipment = Object.fromEntries(Object.entries({
      ...emptyEquipment(),
      ...(saved.equipment || {})
    }).map(([slot, item]) => [slot, EquipmentPolicy.isPreservedEquipment(item) ? item : null]));
    if (!saved.equipment.weapon) saved.equipment.weapon = starterEquipment.weapon;
    if (!saved.equipment.armor) saved.equipment.armor = starterEquipment.armor;
    saved.equipmentRetentionVersion = 'planned-catalog-and-starter-v2';
    localStorage.setItem('stardust-progress', JSON.stringify(saved));
  }
  const activeCharacterForQuiver = getActiveCharacter();
  if (HunterArrowPolicy.isHunter(activeCharacterForQuiver?.job)) {
    saved.equipment = HunterArrowPolicy.ensureStarterQuiver({ ...emptyEquipment(), ...(saved.equipment || {}) });
    if (saved.hunterQuiverMigrationVersion !== 'hunter-quiver-resource-v1') {
      saved.hunterQuiverMigrationVersion = 'hunter-quiver-resource-v1';
      localStorage.setItem('stardust-progress', JSON.stringify(saved));
    }
  }
  if (saved.equipmentVisualMigrationVersion !== 'chapter-one-greatsword-images-v17') {
    saved.inventory = (Array.isArray(saved.inventory) ? saved.inventory : []).map(applyEquipmentVisual);
    saved.equipment = Object.fromEntries(Object.entries(saved.equipment || {}).map(([slot, item]) => [slot, applyEquipmentVisual(item)]));
    saved.equipmentVisualMigrationVersion = 'chapter-one-greatsword-images-v17';
    localStorage.setItem('stardust-progress', JSON.stringify(saved));
  }
  if (saved.bowVisualMigrationVersion !== 'hunter-bow-image-v1') {
    saved.inventory = (Array.isArray(saved.inventory) ? saved.inventory : []).map(applyEquipmentVisual);
    saved.equipment = Object.fromEntries(Object.entries(saved.equipment || {}).map(([slot, item]) => [slot, applyEquipmentVisual(item)]));
    saved.bowVisualMigrationVersion = 'hunter-bow-image-v1';
    localStorage.setItem('stardust-progress', JSON.stringify(saved));
  }
  if (saved.quiverVisualMigrationVersion !== 'hunter-quiver-image-v1') {
    saved.inventory = (Array.isArray(saved.inventory) ? saved.inventory : []).map(applyEquipmentVisual);
    saved.equipment = Object.fromEntries(Object.entries(saved.equipment || {}).map(([slot, item]) => [slot, applyEquipmentVisual(item)]));
    saved.quiverVisualMigrationVersion = 'hunter-quiver-image-v1';
    localStorage.setItem('stardust-progress', JSON.stringify(saved));
  }
  if (saved.qualityUnlockMigrationVersion !== 'quality-tier-map-gating-v1') {
    const downgradeLockedQuality = (item) => {
      if (!item || !['稀有', '王者'].includes(item.quality)) return item;
      return { ...item, quality: item.affix ? '優良' : '普通' };
    };
    saved.inventory = (Array.isArray(saved.inventory) ? saved.inventory : []).map(downgradeLockedQuality);
    saved.equipment = Object.fromEntries(Object.entries(saved.equipment || {}).map(([slot, item]) => [slot, downgradeLockedQuality(item)]));
    saved.qualityUnlockMigrationVersion = 'quality-tier-map-gating-v1';
    localStorage.setItem('stardust-progress', JSON.stringify(saved));
  }
  if (saved.equipmentAffixMigrationVersion !== 'green-affix-v1') {
    saved.inventory = (Array.isArray(saved.inventory) ? saved.inventory : []).map((item) => EquipmentAffixPolicy.normalizeEquipment(item));
    saved.equipment = Object.fromEntries(Object.entries({ ...emptyEquipment(), ...(saved.equipment || {}) })
      .map(([slot, item]) => [slot, EquipmentAffixPolicy.normalizeEquipment(item)]));
    saved.equipmentAffixMigrationVersion = 'green-affix-v1';
    localStorage.setItem('stardust-progress', JSON.stringify(saved));
  }
  if (saved.equipmentDropMigrationVersion !== 'equipment-drop-v1') {
    saved.inventory = Array.isArray(saved.inventory) ? saved.inventory : [];
    saved.equipmentDropMigrationVersion = 'equipment-drop-v1';
    localStorage.setItem('stardust-progress', JSON.stringify(saved));
  }
  if (saved.sharedCasterWeaponMigrationVersion !== 'mage-priest-weapons-v1') {
    saved.inventory = (Array.isArray(saved.inventory) ? saved.inventory : []).map(normalizeCasterWeaponJobs);
    saved.equipment = Object.fromEntries(Object.entries(saved.equipment || {})
      .map(([slot, item]) => [slot, normalizeCasterWeaponJobs(item)]));
    saved.sharedCasterWeaponMigrationVersion = 'mage-priest-weapons-v1';
    localStorage.setItem('stardust-progress', JSON.stringify(saved));
  }
  if (saved.jobRestrictionMigrationVersion !== 'job-restriction-v1') {
    const character = getActiveCharacter();
    const inventoryForRestrictions = Array.isArray(saved.inventory) ? saved.inventory : [];
    const equipmentForRestrictions = saved.equipment || {};
    Object.entries(equipmentForRestrictions).forEach(([slot, item]) => {
      if (item?.allowedJobs?.length && (!character || !item.allowedJobs.includes(character.job))) {
        inventoryForRestrictions.unshift(item);
        equipmentForRestrictions[slot] = null;
      }
    });
    saved.inventory = inventoryForRestrictions;
    saved.equipment = equipmentForRestrictions;
    saved.jobRestrictionMigrationVersion = 'job-restriction-v1';
    localStorage.setItem('stardust-progress', JSON.stringify(saved));
  }
  if (saved.collectibleMigrationVersion !== 'unique-monster-collectibles-v1') {
    saved.collection = CollectiblePolicy.removeLegacyCollectibles(saved.collection);
    saved.collectibleMigrationVersion = 'unique-monster-collectibles-v1';
    localStorage.setItem('stardust-progress', JSON.stringify(saved));
  }
  const inventory = SkillUpgradePolicy.normalizeMaterialInventory(SalvagePolicy.normalizeInventory(removeLegacySkillUpgradeMaterials(VillageUpgradePolicy.normalizeMaterialInventory(saved.inventory))))
    .map(normalizeWearableSeriesName);
  saved.equipment = Object.fromEntries(Object.entries(saved.equipment || {})
    .map(([slot, item]) => [slot, normalizeWearableSeriesName(item)]));
  saved.crafting = CraftingPolicy.normalizeCraftingState(saved.crafting);
  const existingHealingPotion = inventory.find((item) => item.id === 'healing-potion');
  if (existingHealingPotion) existingHealingPotion.description = '恢復最大生命 30%。';
  const existingManaPotion = inventory.find((item) => item.id === 'mana-potion');
  if (existingManaPotion) existingManaPotion.description = '恢復最大魔力 20%。';
  if ((saved.potions ?? 5) > 0 && !inventory.some((item) => item.id === 'healing-potion')) {
    inventory.push({ id: 'healing-potion', kind: 'consumable', icon: '🧪', name: '治癒藥水', description: '恢復最大生命 30%。', quantity: saved.potions ?? 5 });
  }
  if ((saved.manaPotions ?? 0) > 0 && !inventory.some((item) => item.id === 'mana-potion')) {
    inventory.push({ id: 'mana-potion', kind: 'consumable', icon: '🔷', name: '魔法藥水', description: '恢復最大魔力 20%。', quantity: saved.manaPotions ?? 0 });
  }
  const normalizedProgress = {
    level: 1,
    xp: 0,
    gold: 0,
    potions: 5,
    manaPotions: 0,
    magicCrystals: 0,
    skillBooks: {},
    skillLevels: {},
    blackForestCorruption: BlackForestCorruptionPolicy.normalizeState(null),
    unlockedChapter: 1,
    selectedMapId: 'beginner-plains',
    inventory: [],
    equipment: emptyEquipment(),
    collection: {},
    ...saved,
    inventory,
    equipment: { ...emptyEquipment(), ...(saved.equipment || {}) },
    collection: saved.collection && typeof saved.collection === 'object' ? saved.collection : {},
    skillBooks: saved.skillBooks && typeof saved.skillBooks === 'object' ? saved.skillBooks : {},
    skillLevels: ClassSkillPolicy.normalizeSkillLevels(saved.skillLevels),
    blackForestCorruption: BlackForestCorruptionPolicy.normalizeState(saved.blackForestCorruption),
    crafting: CraftingPolicy.normalizeCraftingState(saved.crafting),
    village: VillagePolicy.normalizeVillageData(saved.village)
  };
  ChapterOneProgressionPolicy.normalize(normalizedProgress);
  const activeCharacter = getActiveCharacter();
  const activeSlotIndex = getActiveCharacterSlotIndex();
  let partySlots = JSON.parse(localStorage.getItem('stardust-character-slots') || '[]');
  if (!Array.isArray(partySlots) || !partySlots.length) partySlots = activeCharacter ? [{ character: activeCharacter, progress: normalizedProgress }] : [];
  if (partySlots[activeSlotIndex]?.character) partySlots[activeSlotIndex] = { ...partySlots[activeSlotIndex], progress: normalizedProgress };
  normalizedProgress.party = PartyPolicy.normalizeParty(saved.party, {
    slots: partySlots,
    mainSlotIndex: activeSlotIndex,
    mainCharacter: activeCharacter,
    mainProgress: normalizedProgress
  });
  if (AssassinEnergyPolicy.isAssassin(activeCharacter?.job)) {
    AssassinEnergyPolicy.normalizeProgress(normalizedProgress);
  }
  return normalizedProgress;
}

function getCharacterSlots() {
  let slots = JSON.parse(localStorage.getItem('stardust-character-slots') || '[]');
  if (!Array.isArray(slots)) slots = [];
  const legacyCharacter = JSON.parse(localStorage.getItem('stardust-character') || 'null');
  if (!slots.length && legacyCharacter) {
    slots[0] = { character: legacyCharacter, progress: JSON.parse(localStorage.getItem('stardust-progress') || '{}') };
    localStorage.setItem('stardust-character-slots', JSON.stringify(slots));
    setActiveCharacterSlotIndex(0);
  }
  const idsBeforeRepair = slots.map((slot) => slot?.character?.id || '');
  PartyPolicy.ensureUniqueCharacterIds(slots);
  const changed = slots.some((slot, index) => (slot?.character?.id || '') !== idsBeforeRepair[index]);
  if (changed) localStorage.setItem('stardust-character-slots', JSON.stringify(slots));
  return slots;
}

function normalizeCurrentParty(progress = getProgress()) {
  const slots = getCharacterSlots();
  const mainSlotIndex = getActiveCharacterSlotIndex();
  const character = getActiveCharacter();
  if (slots[mainSlotIndex]?.character && character?.id !== slots[mainSlotIndex].character.id) {
    localStorage.setItem('stardust-character', JSON.stringify(slots[mainSlotIndex].character));
  }
  progress.party = PartyPolicy.normalizeParty(progress.party, {
    slots,
    mainSlotIndex,
    mainCharacter: character,
    mainProgress: progress
  });
  return progress.party;
}

function getLockedFactionForCreation(slotIndex = creationSlotIndex) {
  return getCharacterSlots().find((slot, index) => index !== slotIndex && slot?.character?.faction)?.character.faction || null;
}

function syncActiveCharacterSlot(progressOverride = null) {
  const character = getActiveCharacter();
  if (!character) return;
  const activeIndex = getActiveCharacterSlotIndex();
  const slots = JSON.parse(localStorage.getItem('stardust-character-slots') || '[]');
  slots[activeIndex] = { character, progress: progressOverride || slots[activeIndex]?.progress || JSON.parse(localStorage.getItem('stardust-progress') || '{}') };
  localStorage.setItem('stardust-character-slots', JSON.stringify(slots));
}

function saveProgress(progress) {
  normalizeCurrentParty(progress);
  progress.village = VillagePolicy.normalizeVillageData(progress.village);
  localStorage.setItem('stardust-progress', JSON.stringify(progress));
  syncActiveCharacterSlot(progress);
}

function getAccountResources() {
  const saved = JSON.parse(localStorage.getItem('stardust-account-resources') || '{}');
  return {
    starIron: Math.max(0, Number(saved.starIron) || 0),
    dungeonKeys: { blackForestAltar: 0, ...(saved.dungeonKeys || {}) }
  };
}

function saveAccountResources(resources) {
  localStorage.setItem('stardust-account-resources', JSON.stringify(resources));
}

function getAffixStatValue(item, stat) {
  if (!item?.affix) return 0;
  let value = item.affix.stat === stat ? (item.affix.value || 0) : 0;
  if (item.affix.secondaryStat === stat) value += item.affix.secondaryValue || 0;
  return value;
}

function effectiveEquipmentStat(item, stat) {
  const storedValue = item?.[stat] || 0;
  if (!storedValue) return 0;
  const affixValue = getAffixStatValue(item, stat);
  const baseValue = Math.max(0, storedValue - affixValue);
  return baseValue + affixValue;
}

function activateCharacterSlot(index) {
  syncActiveCharacterSlot();
  const slot = getCharacterSlots()[index];
  if (!slot) return;
  setActiveCharacterSlotIndex(index);
  localStorage.setItem('stardust-character', JSON.stringify(slot.character));
  localStorage.setItem('stardust-progress', JSON.stringify(slot.progress));
  document.querySelector('#character-roster-modal').classList.add('hidden');
  claimOfflineRewards();
  showToast(`已切換角色：${slot.character.name}`);
}

function renderCharacterRoster() {
  syncActiveCharacterSlot();
  const slots = getCharacterSlots();
  const activeIndex = getActiveCharacterSlotIndex();
  const content = document.querySelector('#character-roster-content');
  content.innerHTML = [0, 1, 2, 3].map((index) => {
    const slot = slots[index];
    if (!slot) return `<article class="character-slot empty"><div><b>角色欄位 ${index + 1}</b><small>尚未建立角色</small></div><button type="button" data-create-character-slot="${index}">＋ 建立角色</button></article>`;
    const raceName = Object.values(factions).flat().find((race) => race.id === slot.character.race)?.name || slot.character.race;
    const jobName = classes.find((job) => job.id === slot.character.job)?.name || slot.character.job;
    return `<article class="character-slot ${index === activeIndex ? 'active' : ''}"><span class="creation-race-icon race-${slot.character.race}" aria-hidden="true"></span><div><b>${slot.character.name}${index === activeIndex ? '　目前使用' : ''}</b><small>${raceName}・${jobName}・Lv. ${slot.progress.level || 1}</small></div>${index === activeIndex ? '<em>使用中</em>' : `<button type="button" data-activate-character-slot="${index}">切換角色</button>`}</article>`;
  }).join('');
  document.querySelector('#character-roster-modal').classList.remove('hidden');
}

function loadVillageData() {
  const progress = getProgress();
  villageData = VillagePolicy.normalizeVillageData(progress.village);
  return villageData;
}

function saveVillageData() {
  const progress = getProgress();
  progress.village = VillagePolicy.normalizeVillageData(villageData || progress.village);
  villageData = progress.village;
  saveProgress(progress);
  return villageData;
}

function getVillageBuildingData(buildingId) {
  if (!villageData) loadVillageData();
  return VillagePolicy.getVillageBuildingData(villageData, buildingId);
}

function renderVillage() {
  if (!villageData) loadVillageData();
  const progress = getProgress();
  document.querySelector('#village-level').textContent = `Lv${villageData.level}`;
  document.querySelector('#village-building-grid').innerHTML = Object.values(VillagePolicy.BUILDING_DEFINITIONS).map((definition) => {
    const building = getVillageBuildingData(definition.id);
    const requirement = VillageUpgradePolicy.getRequirement(building.id, building.level);
    const validation = VillageUpgradePolicy.canUpgrade(progress, villageData, building.id);
    const supportsUpgrade = Object.prototype.hasOwnProperty.call(VillageUpgradePolicy.LEVEL_TWO_COSTS, building.id);
    const unlockedChapter = getUnlockedChapter(progress);
    const displayedCap = VillageUpgradePolicy.CHAPTER_LEVEL_CAPS[Math.min(2, unlockedChapter)] || 2;
    const costs = requirement ? Object.entries(requirement.materials).map(([materialId, amount]) => {
      const material = VillageUpgradePolicy.getMaterial(materialId);
      const owned = VillageUpgradePolicy.getQuantity(progress.inventory, materialId);
      return `<li class="${owned < amount ? 'village-upgrade-insufficient' : ''}"><span>${material.icon} ${material.name}</span><b>${owned} / ${amount}</b></li>`;
    }).join('') : '';
    const upgradePanel = requirement
      ? `<ul class="village-upgrade-cost">${costs}<li class="${(Number(progress.gold) || 0) < requirement.gold ? 'village-upgrade-insufficient' : ''}"><span>金幣</span><b>${Number(progress.gold) || 0} / ${requirement.gold}</b></li></ul>`
      : supportsUpgrade ? (building.level >= 3 ? '<p class="village-upgrade-status">已達第二章上限 Lv3。</p>' : '<p class="village-upgrade-status">已達第一章上限；Lv3 將於第二章開放。</p>') : '<p class="village-upgrade-status">建築功能尚未開放。</p>';
    const upgradeLabel = requirement ? `升級至 Lv${requirement.targetLevel}` : supportsUpgrade ? `章節上限 Lv${displayedCap}` : '尚未開放';
    return `<article class="village-building-card" data-village-building="${building.id}">
      <div class="village-building-icon" aria-hidden="true">${building.icon}</div>
      <div class="village-building-copy"><h3>${building.name}</h3><small>Lv${building.level} / 目前上限 Lv${displayedCap}</small><p>${building.description}</p></div>
      ${upgradePanel}
      <div class="village-building-actions"><button class="village-enter" type="button" data-open-village-building="${building.id}">進入</button><button class="village-upgrade" type="button" data-upgrade-village-building="${building.id}" ${validation.ok ? '' : 'disabled'}>${upgradeLabel}</button></div>
    </article>`;
  }).join('');
}

function openVillage(forcedReturnScreen = null) {
  villageReturnScreen = typeof forcedReturnScreen === 'string' ? forcedReturnScreen : (!battleScreen.classList.contains('hidden') ? 'battle' : 'menu');
  battleScreen.classList.add('hidden');
  menuScreen.classList.add('hidden');
  loadVillageData();
  renderVillage();
  document.querySelector('#village-return').textContent = villageReturnScreen === 'battle' ? '返回戰鬥' : '返回主選單';
  document.querySelector('.app-shell').classList.add('village-open');
  villageScreen.classList.remove('hidden');
}

function closeVillage() {
  closeVillageBuilding();
  villageScreen.classList.add('hidden');
  document.querySelector('.app-shell').classList.remove('village-open');
  if (villageReturnScreen === 'battle' && localStorage.getItem('stardust-character')) battleScreen.classList.remove('hidden');
  else menuScreen.classList.remove('hidden');
}

function openVillageBuilding(buildingId) {
  const building = getVillageBuildingData(buildingId);
  if (!building || !building.unlocked) return;
  document.querySelector('#village-building-title').textContent = building.name;
  if (buildingId === 'furnace') renderFurnace(building);
  else if (buildingId === 'workshop') renderWorkshop(building);
  else if (buildingId === 'alchemy') renderAlchemy(building);
  else if (buildingId === 'rune') renderMagicTower(building);
  else document.querySelector('#village-building-content').innerHTML = `<div class="village-building-icon" aria-hidden="true">${building.icon}</div><h3>${building.name}</h3><small>建築等級 Lv${building.level} / ${building.maxLevel}</small><p>${building.description}</p><p class="village-placeholder">${building.name}功能尚未完成，將於後續版本加入。</p>`;
  document.querySelector('#village-building-modal').classList.remove('hidden');
}

function renderMagicTower(building = getVillageBuildingData('rune'), message = '') {
  const progress = getProgress();
  const recipes = MagicTowerPolicy.getAvailableRecipes(building.level);
  const recipeCards = recipes.map((recipe) => {
    const page = SkillUpgradePolicy.MATERIALS[recipe.pageMaterialId];
    const book = SkillUpgradePolicy.MATERIALS[recipe.bookMaterialId];
    const validation = MagicTowerPolicy.canSynthesize(progress, recipe.id, building.level);
    return `<article class="furnace-slot filled"><span class="item-icon">${page.icon}</span><h4>${page.name}</h4><p>持有：${validation.owned} / 需要：10</p><p>成功取得：${book.icon} ${book.name} ×1</p><strong>實際成功率：40%</strong><button type="button" data-synthesize-magic="${recipe.id}" ${validation.ok ? '' : 'disabled'}>${validation.ok ? `合成${book.name}` : `還缺 ${validation.missing} 個${page.name}`}</button></article>`;
  }).join('');
  document.querySelector('#village-building-content').innerHTML = `<div class="workshop-title"><div class="village-building-icon" aria-hidden="true">${building.icon}</div><div><h3>${building.name}</h3><small>建築 Lv${building.level}・成功率 40%</small></div></div>
    <p>每次消耗 10 個技能殘頁，成功時獲得 1 本同階技能書。合成失敗仍會消耗技能殘頁；魔法塔 Lv2 解鎖中級合成。</p>
    ${message ? `<p class="alchemy-message">${message}</p>` : ''}
    <section class="furnace-layout">${recipeCards}</section>`;
}

function synthesizeSkillBook(recipeId) {
  const progress = getProgress();
  const building = getVillageBuildingData('rune');
  const result = MagicTowerPolicy.synthesize(progress, recipeId, building.level, { materialDefinitions: SkillUpgradePolicy.MATERIALS });
  if (!result.ok) { renderMagicTower(building, result.reason === 'tower-level' ? '魔法塔等級不足。' : '技能殘頁不足，無法合成。'); return; }
  saveProgress(progress);
  const book = SkillUpgradePolicy.MATERIALS[result.recipe.bookMaterialId];
  renderMagicTower(building, result.success ? `合成成功！獲得${book.name} ×1。` : '合成失敗，技能殘頁已消耗。');
}

function resetFurnaceState() { furnaceSelectedItemId = null; furnaceResult = null; furnaceBusy = false; }

function renderFurnace(building = getVillageBuildingData('furnace'), message = '') {
  const progress = getProgress();
  const equipment = SalvagePolicy.getEligibleEquipment(progress);
  let selected = equipment.find((item) => SalvagePolicy.getItemId(item) === furnaceSelectedItemId) || null;
  if (furnaceSelectedItemId && !selected) { furnaceSelectedItemId = null; selected = null; message = message || '原先選擇的裝備已不存在或不可分解，請重新選擇。'; }
  const cards = equipment.map((item) => {
    const id = SalvagePolicy.getItemId(item);
    const quality = SalvagePolicy.normalizeQuality(item);
    const locked = SalvagePolicy.isProtected(item);
    return `<button type="button" class="furnace-item quality-${quality} ${id === furnaceSelectedItemId ? 'selected' : ''}" data-select-furnace-item="${id}" ${furnaceBusy ? 'disabled' : ''}><span class="item-icon"><img src="${itemImagePath(item)}" alt=""></span><span><b>${item.name}</b><small>${equipmentSlots[item.slot]?.label || item.slot}・${EquipmentAffixPolicy.getQualityLabel(item)}</small><em>${itemStatsText(item)}</em></span><mark>${locked ? '已鎖定' : '可分解'}</mark></button>`;
  }).join('');
  const rule = selected ? SalvagePolicy.getRule(selected) : null;
  const material = rule ? SalvagePolicy.getMaterial(rule.materialId) : null;
  const chance = selected ? SalvagePolicy.getChance(selected, building.level) : 0;
  const selectedPanel = selected ? `<article class="furnace-slot filled"><span class="item-icon"><img src="${itemImagePath(selected)}" alt=""></span><h4>${selected.name}</h4><p>品質：${EquipmentAffixPolicy.getQualityLabel(selected)}</p><p>${itemStatsText(selected)}</p><hr><p>可能取得：${material.icon} ${material.name} ×${rule.amount}</p><p>目前熔爐：Lv${building.level}</p><strong>實際成功率：${Math.round(chance * 100)}%</strong><button type="button" data-confirm-furnace ${furnaceBusy ? 'disabled' : ''}>${furnaceBusy ? '分解處理中…' : '分解裝備'}</button></article>` : '<article class="furnace-slot"><b>尚未選擇裝備</b><p>請從左側選擇一件綠色或藍色裝備。</p></article>';
  const resultPanel = furnaceResult ? `<article class="furnace-result ${furnaceResult.success ? 'success' : 'empty'}"><h4>分解完成</h4><p>${furnaceResult.success ? `取得：${furnaceResult.material.icon} ${furnaceResult.material.name} ×${furnaceResult.amount}` : '未取得精華石'}</p><small>「${furnaceResult.item.name}」已永久消耗。</small></article>` : '<article class="furnace-result"><b>等待分解結果</b><p>完成後會在這裡顯示是否取得精華石。</p></article>';
  const materialSummary = Object.values(SalvagePolicy.MATERIALS).map((entry) => `${entry.icon} ${entry.name} ${SalvagePolicy.getMaterialQuantity(progress.inventory, entry.id)}`).join('　');
  document.querySelector('#village-building-content').innerHTML = `<div class="workshop-title"><div class="village-building-icon" aria-hidden="true">${building.icon}</div><div><h3>${building.name}</h3><small>建築 Lv${building.level}・可分解裝備 ${equipment.length} 件</small></div></div><p>綠色與藍色裝備分解後必定消失，並依熔爐等級機率取得對應精華石。白色、紫色以上、已穿戴與鎖定裝備不會列出。</p><p class="furnace-material-summary">${materialSummary}</p>${message ? `<p class="alchemy-message">${message}</p>` : ''}<section class="furnace-layout"><section class="furnace-column"><h4>可分解裝備</h4><div class="furnace-items">${cards || '<p class="village-placeholder">目前沒有符合條件的裝備。</p>'}</div></section><section class="furnace-column"><h4>分解槽</h4>${selectedPanel}</section><section class="furnace-column"><h4>結果</h4>${resultPanel}</section></section>`;
}

function selectFurnaceItem(itemId) {
  if (furnaceBusy) return;
  const progress = getProgress();
  const validation = SalvagePolicy.validate(progress, itemId);
  if (!validation.ok) { furnaceSelectedItemId = null; renderFurnace(undefined, validation.reason); return; }
  furnaceSelectedItemId = validation.itemId;
  furnaceResult = null;
  renderFurnace();
}

function confirmFurnaceSalvage() {
  if (furnaceBusy || !furnaceSelectedItemId) return;
  const progress = getProgress();
  const building = getVillageBuildingData('furnace');
  const validation = SalvagePolicy.validate(progress, furnaceSelectedItemId);
  if (!validation.ok) { furnaceSelectedItemId = null; renderFurnace(building, validation.reason); return; }
  const rule = validation.rule;
  const material = SalvagePolicy.getMaterial(rule.materialId);
  const chance = SalvagePolicy.getChance(validation.item, building.level);
  if (!window.confirm(`確定要分解「${validation.item.name}」嗎？\n\n分解後裝備將永久消失。\n取得${material.name}的機率為 ${Math.round(chance * 100)}%。`)) return;
  furnaceBusy = true;
  renderFurnace(building);
  const result = SalvagePolicy.salvage(progress, furnaceSelectedItemId, { furnaceLevel: building.level });
  if (!result.ok) { furnaceBusy = false; furnaceSelectedItemId = null; renderFurnace(building, result.reason); return; }
  saveProgress(progress);
  furnaceResult = result;
  furnaceSelectedItemId = null;
  furnaceBusy = false;
  renderFurnace(building);
  showToast(result.success ? `分解完成：取得 ${result.material.name} ×${result.amount}` : '分解完成：未取得精華石');
}

function alchemyItemDescription(item) {
  const slot = equipmentSlots[item?.slot]?.label || item?.slot || '未知部位';
  return `${slot}・${itemStatsText(item)}`;
}

function resetAlchemyState() {
  alchemyInputItemIds = [null, null];
  alchemyCandidates = [];
  selectedAlchemyCandidate = null;
  alchemyBusy = false;
}

function renderAlchemy(building = getVillageBuildingData('alchemy'), message = '') {
  const progress = getProgress();
  const inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
  const selectedItems = alchemyInputItemIds.map((id) => inventory.find((item) => AlchemyPolicy.getItemId(item) === id) || null);
  const selectingSecond = Boolean(selectedItems[0]);
  const eligible = AlchemyPolicy.getEligibleInputs(progress, selectingSecond ? alchemyInputItemIds[0] : '');
  const available = eligible.map((item) => {
    const id = AlchemyPolicy.getItemId(item);
    const selectedSlot = alchemyInputItemIds.indexOf(id);
    return `<button type="button" class="alchemy-inventory-item ${selectedSlot >= 0 ? 'selected' : ''}" data-alchemy-item="${id}">
      <span class="item-icon"><img src="${itemImagePath(item)}" alt=""></span><span><b>${item.name}</b><small>${alchemyItemDescription(item)}</small></span>
    </button>`;
  }).join('');
  const slots = selectedItems.map((item, index) => `<article class="alchemy-input ${item ? 'filled' : ''}">
    <small>材料 ${index + 1}</small>${item ? `<b>${item.name}</b><span>${alchemyItemDescription(item)}</span><button type="button" data-clear-alchemy-input="${index}">移除</button>` : '<b>尚未放入裝備</b><span>請從下方選擇綠色裝備</span>'}
  </article>`).join('');
  const validation = AlchemyPolicy.validateInputs(progress, alchemyInputItemIds);
  const candidates = alchemyCandidates.map((item) => {
    const id = AlchemyPolicy.getItemId(item);
    return `<button type="button" class="alchemy-candidate ${selectedAlchemyCandidate === id ? 'selected' : ''}" data-select-alchemy-candidate="${id}">
      <b>${item.name}</b><small>${alchemyItemDescription(item)}</small><span>${item.primaryStat ? `<strong>主能力</strong> ${CraftingPolicy.formatStat(item.primaryStat)}<br>${item.affixes.map((entry) => `<strong>額外詞綴</strong> ${CraftingPolicy.formatStat(entry)}`).join('<br>')}` : (item.affixes || []).map((entry) => EquipmentAffixPolicy.formatAffix(entry)).filter(Boolean).join('<br>')}</span>
    </button>`;
  }).join('');
  const helper = message || (alchemyCandidates.length
    ? '請選擇一件結果；確認後其餘候選裝備會消失。'
    : validation.ok ? '材料符合規則，可以開始煉金。' : validation.reason);
  document.querySelector('#village-building-content').innerHTML = `<div class="workshop-title"><div class="village-building-icon" aria-hidden="true">${building.icon}</div><div><h3>${building.name}</h3><small>建築 Lv${building.level}・產生 ${AlchemyPolicy.getCandidateCount(building.level)} 件候選裝備</small></div></div>
    <p>消耗兩件相同部位的綠色裝備，重新產生一件相同部位的綠色裝備。詞綴、數值與插槽不會繼承。</p>
    <p class="alchemy-gold-cost">煉金費用：<b>${AlchemyPolicy.ALCHEMY_RULES.goldCost} 金幣</b>・目前持有 ${Number(progress.gold) || 0} 金幣</p>
    <section class="alchemy-inputs">${slots}</section><p class="alchemy-message ${validation.ok || alchemyCandidates.length ? 'ok' : ''}">${helper}</p>
    <div class="alchemy-actions"><button type="button" data-start-alchemy ${validation.ok && !alchemyCandidates.length && !alchemyBusy ? '' : 'disabled'}>開始煉金</button><button type="button" data-confirm-alchemy ${selectedAlchemyCandidate && !alchemyBusy ? '' : 'disabled'}>確認選擇</button><button type="button" data-return-alchemy>返回村莊</button></div>
    ${alchemyCandidates.length ? `<section class="alchemy-results"><h4>煉金結果候選</h4><div>${candidates}</div></section>` : `<section class="alchemy-available"><h4>${selectingSecond ? `可用的第二件材料（${equipmentSlots[selectedItems[0].slot]?.label || selectedItems[0].slot}）` : '可使用裝備'}</h4><div>${available || '<p>目前沒有符合條件的綠色裝備。</p>'}</div></section>`}`;
}

function selectAlchemyInput(itemId) {
  if (alchemyCandidates.length || alchemyBusy) return;
  const progress = getProgress();
  const item = progress.inventory.find((entry) => AlchemyPolicy.getItemId(entry) === itemId);
  if (!AlchemyPolicy.isEligibleInput(item, progress)) { renderAlchemy(undefined, '此裝備已不存在、已穿戴或受保護，請重新選擇。'); return; }
  if (!alchemyInputItemIds[0]) alchemyInputItemIds[0] = itemId;
  else if (!alchemyInputItemIds[1] && itemId !== alchemyInputItemIds[0] && item.slot === progress.inventory.find((entry) => AlchemyPolicy.getItemId(entry) === alchemyInputItemIds[0])?.slot) alchemyInputItemIds[1] = itemId;
  renderAlchemy();
}

function startAlchemy() {
  if (alchemyBusy || alchemyCandidates.length) return;
  const progress = getProgress();
  const validation = AlchemyPolicy.validateInputs(progress, alchemyInputItemIds);
  if (!validation.ok) { renderAlchemy(undefined, validation.reason); return; }
  if (!window.confirm(`煉金將消耗這兩件裝備，完成時扣除 ${AlchemyPolicy.ALCHEMY_RULES.goldCost} 金幣，是否繼續？`)) return;
  alchemyBusy = true;
  const building = getVillageBuildingData('alchemy');
  const character = getActiveCharacter();
  const result = AlchemyPolicy.beginAlchemy(progress, alchemyInputItemIds, { buildingLevel: building.level, jobId: character?.job || null });
  alchemyBusy = false;
  if (!result.ok) { renderAlchemy(building, result.reason); return; }
  alchemyCandidates = result.session.candidates;
  alchemyInputItemIds = result.session.inputIds;
  selectedAlchemyCandidate = null;
  renderAlchemy(building);
}

function confirmAlchemy() {
  if (alchemyBusy || !selectedAlchemyCandidate || !alchemyCandidates.length) return;
  if (!window.confirm('確定選擇這件裝備嗎？其餘煉金結果將會消失。')) return;
  alchemyBusy = true;
  const progress = getProgress();
  const session = { inputIds: [...alchemyInputItemIds], candidates: alchemyCandidates, goldCost: AlchemyPolicy.ALCHEMY_RULES.goldCost };
  const result = AlchemyPolicy.confirmAlchemy(progress, session, selectedAlchemyCandidate);
  if (!result.ok) { alchemyBusy = false; resetAlchemyState(); renderAlchemy(undefined, result.reason); return; }
  saveProgress(progress);
  const item = result.item;
  resetAlchemyState();
  renderAlchemy(undefined, `煉金完成：${item.name} 已放入背包，消耗 ${result.goldCost} 金幣。`);
  showToast(`煉金完成：${item.name}，消耗 ${result.goldCost} 金幣。`);
}

function renderWorkshop(building = getVillageBuildingData('workshop'), craftedItem = null) {
  const progress = getProgress();
  const inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
  const materialName = (id) => Object.values(CraftingPolicy.MATERIALS).find((entry) => entry.id === id)?.name || id;
  const quantity = (id) => CraftingPolicy.getItemQuantity(inventory, id);
  const visibleRecipes = Object.values(CraftingPolicy.RECIPES).filter((recipe) => recipe.quality === workshopQuality
    && (workshopSlot === 'all' || recipe.equipmentSlot === workshopSlot));
  const cards = visibleRecipes.map((recipe) => {
    const rarity = CraftingPolicy.RARITIES[recipe.quality];
    const recipeQuantity = CraftingPolicy.getRecipeQuantity(progress, recipe.recipeId);
    const known = recipeQuantity > 0;
    const eligibility = CraftingPolicy.canCraft(progress, recipe.recipeId, building.level);
    const materials = Object.entries(recipe.materials).map(([id, amount]) => {
      const owned = quantity(id);
      return `<li class="${owned < amount ? 'workshop-insufficient' : ''}"><span>${materialName(id)}</span><b>${owned} / ${amount}</b></li>`;
    }).join('');
    const primaryOptions = CraftingPolicy.PRIMARY_STAT_POOLS[recipe.equipmentSlot].map((stat) => CraftingPolicy.STAT_DEFINITIONS[stat].label).join('、');
    const goldEnough = (Number(progress.gold) || 0) >= recipe.goldCost;
    return `<article class="workshop-recipe quality-${recipe.quality} ${known ? '' : 'workshop-locked'}">
      <div class="workshop-recipe-head"><div><h4>${recipe.name}</h4><small>製作結果：${recipe.resultName}・${equipmentSlots[recipe.equipmentSlot].label}・${rarity.label}</small></div><span>${known ? `配方 ${recipeQuantity} 張` : '🔒 未持有配方'}</span></div>
      <ul><li class="${known ? '' : 'workshop-insufficient'}"><span>${recipe.name}</span><b>${recipeQuantity} / 1</b></li>${materials}</ul>
      <p class="workshop-gold ${goldEnough ? '' : 'workshop-insufficient'}"><span>所需金幣</span><b>${Number(progress.gold) || 0} / ${recipe.goldCost}</b></p>
      <p><b>固定詞綴：</b>${rarity.fixedAffixCount} 條</p><p><b>隨機詞綴：</b>${rarity.randomAffixCount} 條（種類隨機、數值固定）</p>
      <button type="button" data-craft-recipe="${recipe.recipeId}" ${eligibility.ok ? '' : 'disabled'}>${eligibility.ok ? '製作裝備' : eligibility.reason}</button>
    </article>`;
  }).join('');
  const result = craftedItem ? `<section class="workshop-result"><h4>製作完成：${craftedItem.name}</h4>${craftedItem.affixes.map((entry) => `<p><b>${entry.source === 'fixed' ? '固定詞綴' : '隨機詞綴'}</b>　${EquipmentAffixPolicy.formatAffix(entry)}</p>`).join('')}</section>` : '';
  document.querySelector('#village-building-content').innerHTML = `<div class="workshop-title"><div class="village-building-icon" aria-hidden="true">${building.icon}</div><div><h3>${building.name}</h3><small>第一、二章裝備製作・背包 ${inventory.length} / ${CraftingPolicy.INVENTORY_CAPACITY}</small></div></div><p>製作前只顯示可能能力；實際能力與數值會在製作成功時生成並永久保存。</p>
    <div class="workshop-filters"><div><b>品質</b><button type="button" data-workshop-quality="uncommon" class="${workshopQuality === 'uncommon' ? 'selected' : ''}">綠色</button><button type="button" data-workshop-quality="rare" class="${workshopQuality === 'rare' ? 'selected' : ''}">藍色</button></div><div><b>部位</b><button type="button" data-workshop-slot="all" class="${workshopSlot === 'all' ? 'selected' : ''}">全部</button><button type="button" data-workshop-slot="wrist" class="${workshopSlot === 'wrist' ? 'selected' : ''}">護腕</button><button type="button" data-workshop-slot="cloak" class="${workshopSlot === 'cloak' ? 'selected' : ''}">斗篷</button><button type="button" data-workshop-slot="shoulders" class="${workshopSlot === 'shoulders' ? 'selected' : ''}">肩甲</button></div></div>
    ${result}<section class="workshop-recipes">${cards || '<p class="village-placeholder">此分類目前沒有可製作配方。</p>'}</section>`;
}

function craftWorkshopEquipment(recipeId) {
  const progress = getProgress();
  const workshop = getVillageBuildingData('workshop');
  const result = CraftingPolicy.craftEquipment(progress, recipeId, { workshopLevel: workshop.level });
  if (!result.ok) { showToast(result.reason); renderWorkshop(workshop); return; }
  saveProgress(progress);
  renderWorkshop(workshop, result.item);
  showToast(`製作完成：${result.item.name}，已放入背包。`);
}

function closeVillageBuilding() {
  resetFurnaceState();
  resetAlchemyState();
  document.querySelector('#village-building-modal')?.classList.add('hidden');
}

function upgradeVillageBuilding(buildingId) {
  const building = getVillageBuildingData(buildingId);
  if (!building) return;
  const progress = getProgress();
  const validation = VillageUpgradePolicy.canUpgrade(progress, villageData, buildingId);
  if (!validation.ok) { showToast(validation.reason); return; }
  const materialText = Object.entries(validation.requirement.materials).map(([materialId, amount]) => `${VillageUpgradePolicy.getMaterial(materialId).name} ×${amount}`).join('、');
  if (!window.confirm(`確定將${building.name}升級至 Lv2？\n\n需要：${materialText}、金幣 ×${validation.requirement.gold}`)) return;
  const result = VillageUpgradePolicy.upgrade(progress, villageData, buildingId);
  if (!result.ok) { showToast(result.reason); return; }
  progress.village = VillagePolicy.normalizeVillageData(villageData);
  villageData = progress.village;
  saveProgress(progress);
  renderVillage();
  showToast(`${building.name}已升級至 Lv${result.level}！`);
}

function getPartyMemberDisplayStats(memberRecord, slots = getCharacterSlots()) {
  const slot = slots[memberRecord.slotIndex] || slots.find((entry) => entry?.character?.id === memberRecord.id);
  if (!slot?.character) return { ...memberRecord, currentHp: 0, maxHp: 1 };
  const stats = getCharacterStats(slot.progress.level || 1, slot.progress, slot.character);
  return {
    ...memberRecord,
    level: slot.progress.level || 1,
    currentHp: stats.hp,
    maxHp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    attackSpeed: stats.attackSpeed
  };
}

function renderParty() {
  const progress = getProgress();
  const party = normalizeCurrentParty(progress);
  saveProgress(progress);
  const slots = getCharacterSlots();
  const activeMembers = party.activeMemberIds
    .map((id) => party.members.find((member) => member.id === id))
    .filter(Boolean)
    .map((member) => getPartyMemberDisplayStats(member, slots));
  const availableMembers = party.members.filter((member) => !party.activeMemberIds.includes(member.id));
  const jobName = (job) => classes.find((entry) => entry.id === job)?.name || job;
  const slotCards = Array.from({ length: PartyPolicy.MAX_PARTY_SIZE }, (_, index) => {
    const unlockLevel = PartyPolicy.getPartySlotUnlockLevel(index);
    if (index >= party.unlockedSlots) {
      return `<article class="party-slot locked"><span class="party-slot-number">${index + 1}</span><div><b>尚未解鎖</b><small>主角色達到指定等級後開放</small></div><em>Lv${unlockLevel} 解鎖</em></article>`;
    }
    const member = activeMembers[index];
    if (!member) {
      return `<article class="party-slot empty"><span class="party-slot-number">${index + 1}</span><div><b>空隊伍欄位</b><small>可從下方帳號角色加入</small></div></article>`;
    }
    return `<article class="party-slot"><span class="party-slot-number">${index + 1}</span><div><b>${member.name}${index === 0 ? '（主角色）' : ''}</b><small>${jobName(member.job)}・Lv. ${member.level}・HP ${member.currentHp}/${member.maxHp}</small></div>${index === 0 ? '<em>固定隊員</em>' : `<button type="button" data-party-remove="${member.id}">移出隊伍</button>`}</article>`;
  }).join('');
  const candidates = availableMembers.length
    ? availableMembers.map((member) => `<article class="party-candidate"><div><b>${member.name}</b><small>${jobName(member.job)}・Lv. ${member.level}</small></div><button type="button" data-party-add="${member.id}" ${party.activeMemberIds.length >= party.unlockedSlots ? 'disabled' : ''}>加入隊伍</button></article>`).join('')
    : '<p class="empty-inventory">目前沒有其他可加入的帳號角色。請先到「我的角色」建立角色。</p>';
  document.querySelector('#party-content').innerHTML = `<p class="party-summary">主角色 Lv.${progress.level}・已開放 ${party.unlockedSlots}/4 個隊伍欄位</p><section class="party-slot-grid">${slotCards}</section><section class="party-candidates"><h3>可加入角色</h3>${candidates}</section>`;
  document.querySelector('#party-modal').classList.remove('hidden');
}

function addPartyMember(memberId) {
  const progress = getProgress();
  const party = normalizeCurrentParty(progress);
  if (party.activeMemberIds.includes(memberId)) return;
  if (party.activeMemberIds.length >= party.unlockedSlots) {
    showToast(`目前隊伍上限為 ${party.unlockedSlots} 人。`);
    return;
  }
  if (!PartyPolicy.addActiveMember(party, memberId)) return;
  saveProgress(progress);
  logPartyDebug('隊員加入', { memberId, activeMemberIds: party.activeMemberIds.join(',') });
  renderParty();
  if (fighting) rebuildBattlePartyMembers();
}

function removePartyMember(memberId) {
  const progress = getProgress();
  const party = normalizeCurrentParty(progress);
  if (memberId === party.activeMemberIds[0]) {
    showToast('主角色不能移出隊伍。');
    return;
  }
  if (!PartyPolicy.removeActiveMember(party, memberId)) return;
  saveProgress(progress);
  logPartyDebug('隊員移除', { memberId, activeMemberIds: party.activeMemberIds.join(',') });
  renderParty();
  if (fighting) rebuildBattlePartyMembers();
}

function requiredXp(level) {
  const beginnerCurve = { 1: 40, 2: 70, 3: 110, 4: 160 };
  if (beginnerCurve[level]) return beginnerCurve[level];
  return level < 15 ? level * 100 : Math.ceil(1400 * Math.pow(1.2, level - 15));
}

const offlineLimitMs = 12 * 60 * 60 * 1000;
const offlineMinimumMs = 60 * 1000;
const offlineEquipmentRateMultiplier = .10;

function formatOfflineDuration(milliseconds) {
  const totalMinutes = Math.floor(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours} 小時 ${minutes} 分鐘` : `${minutes} 分鐘`;
}

function markPlayerActive() {
  const character = localStorage.getItem('stardust-character');
  if (!character) return;
  if (fighting && battle.partyMembers?.length) persistPartyRuntimeState();
  const progress = getProgress();
  progress.lastActiveAt = Date.now();
  saveProgress(progress);
}

function getOfflineCombatMonsters(map, playerLevel) {
  const pool = map.id === 'goblin-camp'
    ? [...new Set(Object.values(DungeonTicketCycle.GOBLIN_CAMP_WAVES).flat())]
    : [...new Set(getMonsterPool(playerLevel).normal || [])];
  const levels = createEnemyLevels(pool, map.id, () => .5);
  const normalMonsters = pool.map((type, index) => map.chapter === 1
    ? ChapterOneLevelPolicy.scaleMonster(monsterTypes[type] || monsterTypes.goblin, map.id, levels[index])
    : getMonsterDefinitionForMap(type, map.id, levels[index]))
    .filter((monster) => monster && !monster.isElite && !monster.isBoss);
  return normalMonsters.length ? normalMonsters : [monsterTypes.goblin];
}

function claimOfflineRewards() {
  const character = getActiveCharacter();
  if (!character) return null;
  const progress = getProgress();
  const now = Date.now();
  const lastActiveAt = Number(progress.lastActiveAt || now);
  const offlineMs = Math.min(offlineLimitMs, Math.max(0, now - lastActiveAt));
  progress.lastActiveAt = now;
  if (offlineMs < offlineMinimumMs) {
    saveProgress(progress);
    return null;
  }

  const stats = getCharacterStats(progress.level, progress, character);
  const activeMap = getActiveMap(progress);
  const attackProfile = getPlayerAttackProfile(character);
  const savedHp = Number(progress.partyMemberState?.currentHp);
  const simulation = OfflineCombatPolicy.simulate({
    durationMs: offlineMs,
    player: {
      maxHp: stats.hp,
      currentHp: Number.isFinite(savedHp) ? Math.max(0, Math.min(stats.hp, savedHp)) : stats.hp,
      attack: stats.attack,
      defense: stats.defense,
      damageReduction: stats.damageReduction,
      attackSpeed: stats.attackSpeed,
      hpRegeneration: stats.hpRegeneration,
      healingPotions: progress.potions,
      ...attackProfile
    },
    monsters: getOfflineCombatMonsters(activeMap, progress.level)
  });
  const defeated = simulation.defeated;
  let gainedXp = 0;
  let levelsGained = 0;
  for (let kill = 0; kill < defeated; kill += 1) {
    const gained = MapExpPolicy.calculate(activeMap.normalXp, progress.level, activeMap).actualExp;
    progress.xp += gained;
    gainedXp += gained;
    while (progress.level < 30 && progress.xp >= requiredXp(progress.level)) {
      progress.xp -= requiredXp(progress.level);
      progress.level += 1;
      levelsGained += 1;
    }
    if (progress.level >= 30) {
      progress.level = 30;
      progress.xp = Math.min(progress.xp, requiredXp(30));
    }
    ChapterOneProgressionPolicy.recordNormalKill(progress, activeMap.id);
  }
  const gainedGold = defeated * 2;
  progress.gold += gainedGold;
  const potionsUsed = Math.min(progress.potions, simulation.potionsUsed || 0);
  progress.potions -= potionsUsed;
  for (let potion = 0; potion < potionsUsed; potion += 1) removePotionItem(progress);
  const finalStats = getCharacterStats(progress.level, progress, character);
  progress.partyMemberState = {
    ...(progress.partyMemberState || {}),
    currentHp: simulation.died ? finalStats.hp : Math.max(1, Math.min(finalStats.hp, simulation.remainingHp)),
    maxHp: finalStats.hp
  };
  if (simulation.died) {
    if (activeMap.dungeon) {
      progress.selectedMapId = progress.dungeonReturnMapId || (activeMap.id === 'black-forest-altar' ? 'black-forest' : 'plains-entrance');
      progress.dungeonAdmission = false;
    }
    progress.requiresMapSelectionAfterDefeat = true;
  }
  saveProgress(progress);
  pendingOfflineReport = { duration: formatOfflineDuration(simulation.effectiveMs), offlineDuration: formatOfflineDuration(offlineMs), defeated, gainedXp, gainedGold, levelsGained, equipmentFound: 0, capped: now - lastActiveAt > offlineLimitMs, potionsUsed, died: simulation.died };
  if (simulation.died) {
    openVillage('menu');
    showToast(`角色在離線戰鬥中戰敗，本次掛機已結束。有效掛機時間：${pendingOfflineReport.duration}`);
  } else showToast(`離線掛機 ${pendingOfflineReport.duration}：獲得 ${gainedXp} EXP、${gainedGold} 金幣`);
  return pendingOfflineReport;
}

function getBattleLogType(message) {
  if (/掉落|獲得物品/.test(message)) return 'loot';
  if (/擊敗|倒下|死亡/.test(message)) return 'death';
  if (/出現|回到戰場/.test(message)) return 'spawn';
  if (/對你造成|受到.*傷害/.test(message)) return 'damage-taken';
  if (/戰寵攻擊/.test(message)) return 'pet-damage';
  if (/你對.*造成|施放.*造成/.test(message)) return 'damage-dealt';
  if (/恢復|治癒|補血|復活/.test(message)) return 'healing';
  return 'system';
}

function formatBattleLogTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function escapeBattleLogText(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function renderBattleLog() {
  const container = document.querySelector('#combat-log-lines');
  if (!container) return;
  let entries = battleLogEntries.filter((entry) => PARTY_DEBUG || !entry.partyDebug);
  if (battleLogMode === 'player') entries = entries.filter((entry) => entry.partyDebug || ['damage-dealt', 'pet-damage'].includes(entry.type));
  if (battleLogMode === 'enemy') entries = entries.filter((entry) => entry.partyDebug || ['damage-taken', 'enemy-healing'].includes(entry.type));
  if (battleLogMode === 'loot') entries = entries.filter((entry) => entry.partyDebug || ['loot', 'reward', 'progress'].includes(entry.type));
  container.innerHTML = entries.slice(0, 100).map((entry) => {
    const message = entry.count > 1 ? `${entry.summary || entry.message}：${entry.damage} 總傷害 ×${entry.count}` : entry.message;
    return `<span class="combat-log-entry log-${entry.type}"><time>${formatBattleLogTime(entry.timestamp)}</time><b>${escapeBattleLogText(message)}</b></span>`;
  }).join('') || '<span class="combat-log-empty">目前沒有這個分類的紀錄。</span>';
}

function logBattle(message, type = getBattleLogType(message), details = {}) {
  battleLogEntries.unshift({ id: `${Date.now()}-${Math.random()}`, message, type, timestamp: Date.now(), ...details });
  battleLogEntries = battleLogEntries.slice(0, 100);
  renderBattleLog();
}

function clearBattleLog() {
  battleLogEntries = [];
  renderBattleLog();
}

function setupBattleLogControls() {
  const log = document.querySelector('.combat-log');
  const title = log?.querySelector(':scope > p');
  const lines = document.querySelector('#combat-log-lines');
  if (!log || !title || !lines || log.querySelector('.combat-log-head')) return;
  const header = document.createElement('header');
  header.className = 'combat-log-head';
  header.append(title);
  header.insertAdjacentHTML('beforeend', '<nav aria-label="戰鬥紀錄篩選"><button type="button" data-log-mode="player" class="selected">玩家</button><button type="button" data-log-mode="enemy">敵人</button><button type="button" data-log-mode="loot">戰利品</button></nav>');
  log.insertBefore(header, lines);
}

function getMonsterPool(level = getProgress().level) {
  const mapId = getActiveMap(getProgress()).id;
  if (mapId === 'plains-entrance') return mapMonsterPools.plainsEntrance;
  if (mapId === 'wolf-den') return mapMonsterPools.wolfDen;
  if (mapId === 'boar-woods') return mapMonsterPools.boarWoods;
  if (mapId === 'plains-depths') return mapMonsterPools.plainsDepths;
  if (mapId === 'black-forest-entrance') return mapMonsterPools.blackForestEntrance;
  if (mapId === 'black-forest-trail') return mapMonsterPools.blackForestTrail;
  if (mapId === 'spider-nest') return mapMonsterPools.spiderNest;
  if (mapId === 'blackstone-stronghold') return mapMonsterPools.blackstoneStronghold;
  if (mapId === 'forest-altar') return mapMonsterPools.forestAltar;
  if (mapId === 'black-forest-depths') return mapMonsterPools.blackForestDepths;
  return mapId === 'black-forest' ? mapMonsterPools.blackForest : mapMonsterPools.beginner;
}

function randomEnemyId(level = getProgress().level) {
  const pool = getMonsterPool(level);
  if (pool.rare?.length && Math.random() < pool.rareChance) return pool.rare[Math.floor(Math.random() * pool.rare.length)];
  return pool.normal[Math.floor(Math.random() * pool.normal.length)];
}
function randomEliteId(level = getProgress().level) { const pool = getMonsterPool(level).elite; return pool[Math.floor(Math.random() * pool.length)]; }
function randomBossId(level = getProgress().level) { const pool = getMonsterPool(level).boss; return pool[Math.floor(Math.random() * pool.length)]; }

function createEnemyTypes(playerLevel = 1) {
  if (getActiveMap(getProgress()).id === 'plains-entrance') {
    return Array.from({ length: 5 }, () => randomEnemyId(playerLevel));
  }
  const types = [...getMonsterPool(playerLevel).normal];
  while (types.length < 5) types.push(randomEnemyId(playerLevel));
  const specialRoll = Math.random();
  if (specialRoll < bossSpawnChance) types[Math.floor(Math.random() * types.length)] = randomBossId(playerLevel);
  else if (specialRoll < bossSpawnChance + eliteSpawnChance) types[Math.floor(Math.random() * types.length)] = randomEliteId(playerLevel);
  return types.sort(() => Math.random() - .5);
}

function getDungeonDefinition(mapId = battle.dungeonId || getActiveMap(getProgress()).id) {
  return dungeonDefinitions[mapId] || dungeonDefinitions['goblin-camp'];
}

function createDungeonWaveTypes(wave, mapId = battle.dungeonId || getActiveMap(getProgress()).id) {
  const definition = getDungeonDefinition(mapId);
  if (mapId === 'goblin-camp') return DungeonTicketCycle.getGoblinCampWaveTypes(wave);
  const enemyCount = wave <= 3 ? 3 : wave <= 6 ? 4 : 5;
  const eliteCount = wave === definition.waves ? 4 : enemyCount;
  const types = Array.from({ length: eliteCount }, () => dungeonEliteIds[Math.floor(Math.random() * dungeonEliteIds.length)]);
  if (wave === definition.waves) types.push(dungeonBossId);
  return types;
}

function getMonsterDefinitionForMap(type, mapId = battle.dungeonId || getActiveMap(getProgress()).id, level = null) {
  if (mapId === 'black-forest-entrance') return BlackForestEntrancePolicy.getCombatMonster(type, level) || monsterTypes.goblin;
  if (mapId === 'black-forest-trail') return BlackForestTrailPolicy.getCombatMonster(type, level) || monsterTypes.goblin;
  if (mapId === 'spider-nest') return SpiderNestPolicy.getCombatMonster(type, level) || monsterTypes.goblin;
  if (mapId === 'blackstone-stronghold') {
    const monster = BlackstoneStrongholdPolicy.getCombatMonster(type) || monsterTypes.goblin;
    return BlackstoneStrongholdPolicy.applyOutpostEffect(monster, battle.blackstoneStrongholdState?.activeOutpostId);
  }
  if (mapId === 'forest-altar') return ForestAltarPolicy.getCombatMonster(type) || monsterTypes.goblin;
  if (mapId === 'black-forest-depths') return BlackForestDepthsPolicy.getCombatMonster(type) || monsterTypes.goblin;
  const monster = monsterTypes[type] || monsterTypes.goblin;
  const chapterMonster = ChapterOneLevelPolicy.scaleMonster(monster, mapId, level);
  const dungeonMonster = GoblinCampPolicy.scaleMonster(chapterMonster, mapId === 'goblin-camp');
  const wolfMonster = WolfDenPolicy.applyWolfDenPassive(dungeonMonster, mapId);
  const boarMonster = BoarWoodsPolicy.applyBoarWoodsPassive(wolfMonster, mapId);
  const plainsMonster = PlainsDepthsPolicy.applyPlainsDepthsPassive(boarMonster, mapId);
  if (mapId !== 'plains-depths') return plainsMonster;
  const aliveTypes = (battle.enemyTypes || []).filter((_, index) => !battle.enemyHps || battle.enemyHps[index] > 0);
  return PlainsDepthsPolicy.applyBlackstoneAura(plainsMonster, aliveTypes, Date.now() < (battle.blackstoneRoarUntil || 0));
}

function createEnemyLevels(enemyTypes, mapId, random = Math.random) {
  return enemyTypes.map((type) => mapId === 'black-forest-entrance'
    ? BlackForestEntrancePolicy.rollLevel(type, random())
    : mapId === 'black-forest-trail'
      ? BlackForestTrailPolicy.rollLevel(type, random())
      : mapId === 'spider-nest'
        ? SpiderNestPolicy.rollLevel(type, random())
        : mapId === 'blackstone-stronghold'
          ? BlackstoneStrongholdPolicy.rollLevel(type)
        : mapId === 'forest-altar'
          ? ForestAltarPolicy.rollLevel(type)
        : mapId === 'black-forest-depths'
          ? BlackForestDepthsPolicy.rollLevel(type)
      : ChapterOneLevelPolicy.rollLevel(mapId, type, random()) ?? null);
}

function loadDungeonWave(wave) {
  const definition = getDungeonDefinition();
  const enemyTypes = createDungeonWaveTypes(wave, battle.dungeonId);
  const now = Date.now();
  battle.dungeonWave = wave;
  battle.enemyTypes = enemyTypes;
  battle.enemyLevels = createEnemyLevels(enemyTypes, battle.dungeonId);
  battle.enemyAffixes = createEnemyAffixes(enemyTypes, battle.dungeonId, battle.enemyLevels);
  battle.enemyHps = enemyTypes.map((_, index) => getEnemyDefinition(index).maxHp);
  battle.enemyRespawns = enemyTypes.map(() => null);
  battle.enemySpawnedAt = enemyTypes.map((_, index) => now + index);
  battle.enemyDots = enemyTypes.map(() => []);
  battle.enemyDamages = enemyTypes.map(() => []);
  battle.enemyAffixRegenAt = enemyTypes.map(() => now);
  battle.enemyBoarEnraged = enemyTypes.map(() => false);
  battle.goblinScoutSummons = 0;
  battle.enemyNextAttackAt = createEnemyAttackSchedule(enemyTypes, now, battle.dungeonId, battle.enemyLevels);
  battle.targetIndexes = [];
  battle.waveTransitioning = false;
  const waveRange = battle.dungeonId === 'goblin-camp' ? `第 ${wave} 波` : `第 ${wave}／${definition.waves} 波`;
  logBattle(`◆ ${definition.name}${waveRange}開始：${enemyTypes.length} 名敵人來襲。`, 'system');
  showToast(`副本${waveRange}`);
  updateBattleUI();
}

function completeDungeon() {
  const progress = getProgress();
  const dungeonId = battle.dungeonId || getActiveMap(progress).id;
  const definition = getDungeonDefinition(dungeonId);
  const returnMapId = progress.dungeonReturnMapId || (dungeonId === 'black-forest-altar' ? 'black-forest' : 'plains-entrance');
  let restartDungeon = false;
  let returnDelay = 1200;
  if (definition.ticketItemId) {
    const result = DungeonTicketCycle.resolveCompletion({
      ticketCount: getInventoryItemQuantity(progress, definition.ticketItemId),
      dungeonId,
      returnMapId
    });
    if (result.consumed) consumeInventoryItem(progress, definition.ticketItemId, result.consumed);
    restartDungeon = result.restartDungeon;
    returnDelay = result.delayMs;
    progress.selectedMapId = result.nextMapId;
    progress.dungeonAdmission = result.nextAdmission;
  } else {
    progress.selectedMapId = returnMapId;
  }
  saveProgress(progress);
  battle.dungeonComplete = true;
  battle.waveTransitioning = false;
  fighting = false;
  clearInterval(battleTimer);
  clearInterval(skillTimer);
  clearInterval(enemyAttackTimer);
  document.querySelector('#battle-toggle').textContent = '副本完成';
  const ticketsLeft = definition.ticketItemId ? getInventoryItemQuantity(progress, definition.ticketItemId) : 0;
  logBattle(`♛ ${definition.name}攻略完成！${definition.ticketItemId ? `已消耗 1 張哥布林營地地圖，剩餘 ${ticketsLeft} 張。` : ''}`, 'progress');
  showToast(restartDungeon ? `通關完成，剩餘 ${ticketsLeft} 張地圖，即將重新開始。` : `${definition.name}攻略完成！`);
  const completedSessionId = battle.sessionId;
  setTimeout(() => {
    if (battle.sessionId !== completedSessionId || !battle.dungeonComplete) return;
    openBattle();
    showToast(restartDungeon ? `再次進入${definition.name}。` : `已返回${mapProgression.find((map) => map.id === returnMapId)?.name || '原地圖'}，繼續自動戰鬥。`);
  }, returnDelay);
}

function hasAliveBoss(excludeIndex = -1) {
  return battle.enemyTypes.some((type, index) => index !== excludeIndex && battle.enemyHps[index] > 0 && monsterTypes[type]?.isBoss);
}

function getEnemyDefinition(index) {
  const enemy = getMonsterDefinitionForMap(battle.enemyTypes[index], battle.dungeonId || getActiveMap(getProgress()).id, battle.enemyLevels?.[index]);
  const summonProfile = battle.enemySummonProfiles?.[index];
  const summonedEnemy = !summonProfile ? enemy : { ...enemy, name: summonProfile.name || enemy.name, maxHp: Math.max(1, Math.round(enemy.maxHp * summonProfile.hpRatio)), attack: Math.max(1, Math.round(enemy.attack * summonProfile.attackRatio)) };
  return EliteAffixPolicy.applyAffixes(summonedEnemy, battle.enemyAffixes?.[index] || []);
}

function createEnemyAffixes(enemyTypes, mapId, enemyLevels = [], random = Math.random) {
  const chapter = mapProgression.find((map) => map.id === mapId)?.chapter || 1;
  return enemyTypes.map((type, index) => EliteAffixPolicy.rollAffixes(getMonsterDefinitionForMap(type, mapId, enemyLevels[index]), chapter, random));
}

function isPlayerBleeding(now = Date.now()) {
  return Boolean(battle.playerBleed && battle.playerBleed.expiresAt > now);
}

function getBlackForestDepthsCombatContext() {
  const aliveCount = (battle.enemyHps || []).filter((hp) => hp > 0).length;
  const forestSpiritAlive = (battle.enemyTypes || []).some((type, index) => type === 'forestSpirit' && battle.enemyHps[index] > 0);
  return { aliveAllies: Math.max(0, aliveCount - 1), bossAuraActive: hasAliveBoss(), forestSpiritAlive };
}

function getMonsterAttackPower(enemy, progress = getProgress(), currentHp = enemy.maxHp) {
  const randomMultiplier = .9 + Math.random() * .2;
  const bloodFrenzy = WolfDenPolicy.getBloodFrenzyMultiplier(enemy.id, isPlayerBleeding());
  const irritable = BoarWoodsPolicy.getIrritableMultiplier(enemy.id, currentHp, enemy.maxHp);
  const plainsIrritable = PlainsDepthsPolicy.getIrritableMultiplier(enemy.id, currentHp, enemy.maxHp);
  const blackForestMultiplier = BlackForestEntrancePolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attack;
  const blackForestTrailMultiplier = BlackForestTrailPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attack;
  const spiderNestMultiplier = SpiderNestPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attack;
  const strongholdMultiplier = BlackstoneStrongholdPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attack;
  const forestAltarMultiplier = ForestAltarPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attack;
  const depthsMultiplier = BlackForestDepthsPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp, getBlackForestDepthsCombatContext()).attack;
  const strongholdCommandMultiplier = enemy.mapId === 'blackstone-stronghold' && Date.now() < (battle.strongholdCommandUntil || 0)
    ? 1 + BlackstoneStrongholdPolicy.LION_GUARD.roarAttackBonus : 1;
  const strongholdEnrageMultiplier = enemy.mapId === 'blackstone-stronghold'
    ? 1 + BlackstoneStrongholdPolicy.getEnrage(battle.blackstoneStrongholdState, Date.now()).attackBonus : 1;
  const commandMultiplier = enemy.mapId === 'black-forest-trail' && Date.now() < (battle.blackstoneCommandUntil || 0)
    ? 1 + BlackForestTrailPolicy.CAPTAIN.commandAttackBonus : 1;
  const beastCommandMultiplier = enemy.id === 'blackstonePoisonSpider' && Date.now() < (battle.blackstoneSpiderCommandUntil || 0)
    ? 1 + BlackForestTrailPolicy.BEASTMASTER.spiderAttackBonus : 1;
  const nestSpiderCommandMultiplier = ['spiderNestBlackstonePoisonSpider', 'venomSpitterSpider', 'webWeaver', 'giantSpider'].includes(enemy.id)
    && Date.now() < (battle.spiderNestCommandUntil || 0) ? 1 + SpiderNestPolicy.BEASTMASTER.spiderAttackBonus : 1;
  if (enemy.mapId) return Math.max(1, Math.round((enemy.attack || 1) * randomMultiplier * bloodFrenzy * irritable * plainsIrritable * blackForestMultiplier * blackForestTrailMultiplier * spiderNestMultiplier * strongholdMultiplier * forestAltarMultiplier * depthsMultiplier * strongholdCommandMultiplier * strongholdEnrageMultiplier * commandMultiplier * beastCommandMultiplier * nestSpiderCommandMultiplier));
  const map = getActiveMap(progress);
  const monsterLevel = Math.min(map.max, Math.max(map.min, progress.level));
  const levelMultiplier = 1 + (monsterLevel - 1) * .10;
  const rankMultiplier = enemy.isBoss ? 2.4 : enemy.isElite ? 1.65 : 1;
  return Math.max(1, Math.round((enemy.attack || 10) * levelMultiplier * rankMultiplier * randomMultiplier * 1.25 * bloodFrenzy * irritable * plainsIrritable));
}

function getMonsterAttackInterval(enemy, currentHp = enemy.maxHp) {
  const bloodFrenzy = WolfDenPolicy.getBloodFrenzyMultiplier(enemy.id, isPlayerBleeding());
  const irritable = BoarWoodsPolicy.getIrritableMultiplier(enemy.id, currentHp, enemy.maxHp);
  const plainsIrritable = PlainsDepthsPolicy.getIrritableMultiplier(enemy.id, currentHp, enemy.maxHp);
  const blackForestMultiplier = BlackForestEntrancePolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attackSpeed;
  const blackForestTrailMultiplier = BlackForestTrailPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attackSpeed;
  const spiderNestMultiplier = SpiderNestPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attackSpeed;
  const strongholdMultiplier = BlackstoneStrongholdPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attackSpeed;
  const forestAltarMultiplier = ForestAltarPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp).attackSpeed;
  const depthsMultiplier = BlackForestDepthsPolicy.getCombatMultipliers(enemy.id, currentHp, enemy.maxHp, getBlackForestDepthsCombatContext()).attackSpeed;
  const strongholdEnrageMultiplier = enemy.mapId === 'blackstone-stronghold'
    ? 1 + BlackstoneStrongholdPolicy.getEnrage(battle.blackstoneStrongholdState, Date.now()).attackSpeedBonus : 1;
  const beastCommandMultiplier = enemy.id === 'blackstonePoisonSpider' && Date.now() < (battle.blackstoneSpiderCommandUntil || 0)
    ? 1 + BlackForestTrailPolicy.BEASTMASTER.spiderAttackSpeedBonus : 1;
  const nestSpiderCommandMultiplier = ['spiderNestBlackstonePoisonSpider', 'venomSpitterSpider', 'webWeaver', 'giantSpider'].includes(enemy.id)
    && Date.now() < (battle.spiderNestCommandUntil || 0) ? 1 + SpiderNestPolicy.BEASTMASTER.spiderAttackSpeedBonus : 1;
  return Math.max(250, (enemy.attackInterval || (1000 / (enemy.attackSpeed || 1))) / bloodFrenzy / irritable / plainsIrritable / blackForestMultiplier / blackForestTrailMultiplier / spiderNestMultiplier / strongholdMultiplier / forestAltarMultiplier / depthsMultiplier / strongholdEnrageMultiplier / beastCommandMultiplier / nestSpiderCommandMultiplier);
}

function createEnemyAttackSchedule(enemyTypes, startAt = Date.now(), mapId = getActiveMap(getProgress()).id, enemyLevels = []) {
  return enemyTypes.map((type, index) => startAt + getMonsterAttackInterval(getMonsterDefinitionForMap(type, mapId, enemyLevels[index])));
}

function resetAliveEnemyAttackSchedule(startAt = Date.now()) {
  battle.enemyNextAttackAt = battle.enemyTypes.map((type, index) => (
    battle.enemyHps[index] > 0
      ? startAt + getMonsterAttackInterval(getEnemyDefinition(index))
      : null
  ));
}

function aliveEnemyIndexesByAge() {
  return battle.enemyHps
    .map((hp, index) => ({ hp, index, spawnedAt: battle.enemySpawnedAt[index] ?? Number.MAX_SAFE_INTEGER }))
    .filter((enemy) => enemy.hp > 0)
    .sort((first, second) => first.spawnedAt - second.spawnedAt || first.index - second.index)
    .map((enemy) => enemy.index);
}

function oldestAliveEnemyIndex() {
  return aliveEnemyIndexesByAge()[0] ?? -1;
}

function getEquipmentStats(progress = getProgress()) {
  const fixed = Object.values(progress.equipment || {}).filter(Boolean).reduce((stats, item) => ({
    attack: stats.attack + effectiveEquipmentStat(item, 'attack'),
    defense: stats.defense + effectiveEquipmentStat(item, 'defense'),
    hp: stats.hp + effectiveEquipmentStat(item, 'hp'),
    mana: stats.mana + effectiveEquipmentStat(item, 'mana'),
    strength: stats.strength + effectiveEquipmentStat(item, 'strength'),
    intelligence: stats.intelligence + effectiveEquipmentStat(item, 'intelligence'),
    accuracy: stats.accuracy + effectiveEquipmentStat(item, 'accuracy'),
    dodge: stats.dodge + effectiveEquipmentStat(item, 'dodge'),
    attackSpeedBonus: stats.attackSpeedBonus + effectiveEquipmentStat(item, 'attackSpeedBonus'),
    cooldownSpeedBonus: stats.cooldownSpeedBonus + effectiveEquipmentStat(item, 'cooldownSpeedBonus'),
    manaRegenBonus: stats.manaRegenBonus + effectiveEquipmentStat(item, 'manaRegenBonus'),
    manaRegenFlat: stats.manaRegenFlat + effectiveEquipmentStat(item, 'manaRegenFlat'),
    hpRegeneration: stats.hpRegeneration + effectiveEquipmentStat(item, 'hpRegeneration'),
    magicDamageBonus: stats.magicDamageBonus + effectiveEquipmentStat(item, 'magicDamageBonus'),
    parry: stats.parry + effectiveEquipmentStat(item, 'parry'),
    damageReduction: stats.damageReduction + effectiveEquipmentStat(item, 'damageReduction'),
    movementSpeedBonus: stats.movementSpeedBonus + effectiveEquipmentStat(item, 'movementSpeedBonus')
  }), { attack: 0, defense: 0, hp: 0, mana: 0, strength: 0, intelligence: 0, accuracy: 0, dodge: 0, attackSpeedBonus: 0, cooldownSpeedBonus: 0, manaRegenBonus: 0, manaRegenFlat: 0, hpRegeneration: 0, magicDamageBonus: 0, parry: 0, damageReduction: 0, movementSpeedBonus: 0 });
  const affixes = EquipmentAffixPolicy.getEquippedAffixStats(progress.equipment);
  return {
    ...fixed,
    attackFlat: affixes.attackFlat || 0,
    maxHp: affixes.maxHp || 0,
    hpRegeneration: fixed.hpRegeneration + (affixes.hpRegeneration || 0),
    skillDamagePercent: (affixes.skillDamagePercent || 0) / 100,
    eliteDamagePercent: (affixes.eliteDamagePercent || 0) / 100,
    bossDamagePercent: (affixes.bossDamagePercent || 0) / 100,
    basicAttackDamagePercent: (affixes.basicAttackDamagePercent || 0) / 100,
    killHealthRecoveryPercent: (affixes.killHealthRecoveryPercent || 0) / 100,
    killResourceRecoveryPercent: (affixes.killResourceRecoveryPercent || 0) / 100,
    poisonResistancePercent: (affixes.poisonResistancePercent || 0) / 100,
    maxHpPercent: (affixes.maxHpPercent || 0) / 100,
    defensePercent: (affixes.defensePercent || 0) / 100,
    accuracyPercent: (affixes.accuracyPercent || 0) / 100,
    dodgePercent: (affixes.dodgePercent || 0) / 100,
    attackSpeedPercent: (affixes.attackSpeedPercent || 0) / 100,
    criticalChance: (affixes.criticalChance || 0) / 100,
    criticalDamagePercent: (affixes.criticalDamagePercent || 0) / 100,
    cooldownSpeedPercent: (affixes.cooldownSpeedPercent || 0) / 100,
    manaRegenerationPercent: (affixes.manaRegenerationPercent || 0) / 100
  };
}

function getCollectionStats(progress = getProgress()) {
  return Object.values(progress.collection || {}).reduce((stats, item) => ({
    attack: stats.attack + (item.attack || 0), defense: stats.defense + (item.defense || 0), hp: stats.hp + (item.hp || 0), mana: stats.mana + (item.mana || 0),
    crit: stats.crit + (item.crit || 0), dodge: stats.dodge + (item.dodge || 0)
  }), { attack: 0, defense: 0, hp: 0, mana: 0, crit: 0, dodge: 0 });
}

function getCurrentMap(level) {
  return mapProgression.find((map) => map.id === 'beginner-plains' && level >= map.min) || mapProgression[0];
}

function getActiveMap(progress = getProgress()) {
  const selected = mapProgression.find((map) => map.id === progress.selectedMapId && map.implemented
    && (map.chapter !== 1 || ChapterOneProgressionPolicy.isUnlocked(progress, map.id))
    && (map.chapter !== 2 || (ChapterOneProgressionPolicy.isUnlocked(progress, 'black-forest') && progress.level >= map.min)));
  if (selected?.id === 'beginner-plains') return mapProgression.find((map) => map.id === 'plains-entrance');
  if (selected) return selected;
  return mapProgression.find((map) => map.id === 'plains-entrance') || mapProgression[0];
}

function getUnlockedPassiveEffects(level, progress, character) {
  return ClassSkillPolicy.getSkills(character?.job)
    .filter((skill) => skill.type === 'passive' && level >= skill.level)
    .map((skill) => ClassSkillPolicy.getEffect(character.job, skill.id, getSkillUpgradeLevel(progress, character.job, skill)) || {});
}

function getCharacterStats(level, progress = getProgress(), character = getActiveCharacter()) {
  const base = classBaseStats[character?.job] || classBaseStats.warrior;
  const race = raceAdjustments[character?.race] || raceAdjustments.human;
  const equipment = getEquipmentStats(progress);
  const collection = getCollectionStats(progress);
  const humanMultiplier = character?.race === 'human' ? 1.05 : 1;
  const equippedWeapon = progress.equipment?.weapon;
  const passives = getUnlockedPassiveEffects(level, progress, character);
  const passiveTotal = (key) => passives.reduce((total, effect) => total + (Number(effect[key]) || 0), 0);
  const lowHealth = Number(progress.currentHpRatio) <= .3;
  const lowHealthAttack = lowHealth ? passiveTotal('attack') : 0;
  const lowHealthSpeed = lowHealth ? passiveTotal('speed') : 0;
  const lowHealthCrit = lowHealth ? passiveTotal('crit') : 0;
  const stats = {
    hp: Math.round((base.hp + race.hp + (level - 1) * 12 + equipment.hp + equipment.maxHp + collection.hp) * (1 + equipment.maxHpPercent + passiveTotal('maxHp')) * humanMultiplier),
    mana: ['warrior', 'assassin'].includes(character?.job) ? 0 : Math.round((base.mana + race.mana + (level - 1) * 6 + equipment.mana + collection.mana) * humanMultiplier),
    attack: Math.round((base.attack + race.attack + (level - 1) + equipment.attack + equipment.attackFlat + equipment.strength + equipment.intelligence + collection.attack) * humanMultiplier * (1 + passiveTotal('weaponDamage') + lowHealthAttack)),
    defense: Math.round((base.defense + race.defense + Math.floor((level - 1) / 5) + equipment.defense + collection.defense) * (1 + equipment.defensePercent) * humanMultiplier),
    crit: Math.min(.60, base.crit + race.crit + collection.crit + equipment.criticalChance + passiveTotal('crit') + lowHealthCrit),
    dodge: Math.min(.45, Math.max(0, base.dodge + race.dodge + collection.dodge + equipment.dodge + equipment.dodgePercent + passiveTotal('dodge'))),
    accuracy: Math.min(1.30, 1.05 + equipment.accuracy + equipment.accuracyPercent + (character?.job === 'hunter' ? .05 : 0)),
    attackSpeed: EquipmentPolicy.getAttacksPerSecond(equippedWeapon, base.attackSpeed * 1.15) * (1 + equipment.attackSpeedBonus + equipment.attackSpeedPercent + passiveTotal('attackSpeed') + lowHealthSpeed),
    cooldownSpeed: (character?.race === 'elf' ? 1.03 : 1) * (1 + equipment.cooldownSpeedBonus + equipment.cooldownSpeedPercent),
    manaRegen: 1 + equipment.manaRegenBonus + equipment.manaRegenerationPercent,
    manaRegenFlat: equipment.manaRegenFlat,
    magicDamageBonus: Math.max(0, equipment.magicDamageBonus + passiveTotal('magicDamage') + passiveTotal('elementDamage')),
    parry: Math.min(.50, Math.max(0, equipment.parry + passiveTotal('parry'))),
    damageReduction: Math.min(.50, Math.max(0, equipment.damageReduction)),
    movementSpeedBonus: Math.max(0, equipment.movementSpeedBonus),
    hpRegeneration: Math.max(0, equipment.hpRegeneration),
    skillDamagePercent: Math.max(0, equipment.skillDamagePercent),
    eliteDamagePercent: Math.max(0, equipment.eliteDamagePercent),
    bossDamagePercent: Math.max(0, equipment.bossDamagePercent),
    basicAttackDamagePercent: Math.max(0, equipment.basicAttackDamagePercent),
    killHealthRecoveryPercent: Math.max(0, equipment.killHealthRecoveryPercent),
    killResourceRecoveryPercent: Math.max(0, equipment.killResourceRecoveryPercent),
    poisonResistancePercent: Math.min(1, Math.max(0, equipment.poisonResistancePercent)),
    criticalDamageMultiplier: 1.5 + Math.max(0, equipment.criticalDamagePercent + passiveTotal('criticalDamage') + passiveTotal('skillCriticalDamage')),
    dotMultiplier: character?.race === 'undead' ? 1.20 : 1
  };
  const activeMap = getActiveMap(progress);
  const corruptedStats = BlackForestCorruptionPolicy.applyCombatStats(stats, progress.blackForestCorruption, activeMap.chapter === 2);
  return { ...corruptedStats, accuracy: BlackForestDepthsPolicy.applyDenseFogAccuracy(corruptedStats.accuracy, activeMap.id) };
}

function getMaxHp(level, progress = getProgress(), character = getActiveCharacter()) {
  return getCharacterStats(level, progress, character).hp;
}

function logPartyDebug(event, details = {}) {
  if (!PARTY_DEBUG) return;
  const fields = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${value}`)
    .join(' | ');
  logBattle(`[PARTY DEBUG] ${event}${fields ? ` | ${fields}` : ''}`, 'system', { partyDebug: true });
}

function addPotionItem(progress, amount = 1) {
  const potion = progress.inventory.find((item) => item.kind === 'consumable' && item.id === 'healing-potion');
  if (potion) potion.quantity += amount;
  else progress.inventory.push({ id: 'healing-potion', kind: 'consumable', icon: '🧪', name: '治癒藥水', description: '恢復最大生命 30%。', quantity: amount });
}

function addManaPotionItem(progress, amount = 1) {
  const potion = progress.inventory.find((item) => item.kind === 'consumable' && item.id === 'mana-potion');
  if (potion) potion.quantity += amount;
  else progress.inventory.push({ id: 'mana-potion', kind: 'consumable', icon: '🔷', name: '魔法藥水', description: '恢復最大魔力 20%。', quantity: amount });
}

function removePotionItem(progress) {
  const potion = progress.inventory.find((item) => item.kind === 'consumable' && item.id === 'healing-potion');
  if (!potion) return;
  potion.quantity -= 1;
  if (potion.quantity <= 0) progress.inventory = progress.inventory.filter((item) => item !== potion);
}

function removeManaPotionItem(progress) {
  const potion = progress.inventory.find((item) => item.kind === 'consumable' && item.id === 'mana-potion');
  if (!potion) return;
  potion.quantity -= 1;
  if (potion.quantity <= 0) progress.inventory = progress.inventory.filter((item) => item !== potion);
}

function getInventoryItemQuantity(progress, itemId) {
  return Math.max(0, Number(progress.inventory.find((item) => item.id === itemId)?.quantity) || 0);
}

function addGoblinCampMap(progress, amount = 1) {
  const existing = progress.inventory.find((item) => item.id === GOBLIN_CAMP_TICKET_ID);
  if (existing) existing.quantity = getInventoryItemQuantity(progress, GOBLIN_CAMP_TICKET_ID) + amount;
  else progress.inventory.push({
    id: GOBLIN_CAMP_TICKET_ID,
    kind: 'material',
    icon: '🗺️',
    quality: '稀有',
    name: '哥布林營地地圖',
    description: '進入哥布林營地副本的門票；每次完整通關消耗 1 張。',
    quantity: amount
  });
}

function consumeInventoryItem(progress, itemId, amount = 1) {
  const item = progress.inventory.find((entry) => entry.id === itemId);
  if (!item || (Number(item.quantity) || 0) < amount) return false;
  item.quantity -= amount;
  if (item.quantity <= 0) progress.inventory = progress.inventory.filter((entry) => entry !== item);
  return true;
}

function addLoot(progress, enemy) {
  if (enemy.lootPending) return null;
  const roll = Math.random();
  if (roll < potionDropRate) {
    progress.potions += 1;
    addPotionItem(progress);
    return { kind: 'consumable', name: '治癒藥水', quantity: 1 };
  }
  if (roll < potionDropRate + manaPotionDropRate) {
    progress.manaPotions = (progress.manaPotions || 0) + 1;
    addManaPotionItem(progress);
    return { kind: 'consumable', name: '魔法藥水', quantity: 1 };
  }
  return null;
}

function addCollectibleLoot(progress, enemy) {
  const collectible = collectibleTemplates[enemy.id];
  if (!collectible || progress.collection?.[collectible.id]) return null;
  const rate = enemy.isBoss ? collectibleDropRates.boss : enemy.isElite ? collectibleDropRates.elite : collectibleDropRates.normal;
  if (Math.random() >= rate) return null;
  if (!progress.collection) progress.collection = {};
  progress.collection[collectible.id] = { ...collectible, obtainedAt: Date.now() };
  return collectible;
}

function itemStatsText(item) {
  const parts = [];
  if (item.series) parts.push(item.series);
  const armorCategory = EquipmentPolicy.getArmorCategory(item);
  if (armorCategory) parts.push(({ plate: '鎧甲', leather: '皮甲', cloth: '布甲' })[armorCategory]);
  if (Number.isFinite(Number(item.attackMin)) && Number.isFinite(Number(item.attackMax))) parts.push(`攻擊 ${item.attackMin}～${item.attackMax}`);
  else if (item.attack) parts.push(`攻擊 +${effectiveEquipmentStat(item, 'attack')}`);
  if (Number(item.attackSpeed) > 0) parts.push(`攻速 ${Number(item.attackSpeed).toFixed(2)} 次／秒`);
  if (item.defense) parts.push(`防禦 +${effectiveEquipmentStat(item, 'defense')}`);
  if (item.hp) parts.push(`生命 +${effectiveEquipmentStat(item, 'hp')}`);
  if (item.mana) parts.push(`最大魔力 +${effectiveEquipmentStat(item, 'mana')}`);
  if (item.strength) parts.push(`力量 +${effectiveEquipmentStat(item, 'strength')}`);
  if (item.intelligence) parts.push(`智力 +${effectiveEquipmentStat(item, 'intelligence')}`);
  if (item.accuracy) parts.push(`命中率 +${Math.round(effectiveEquipmentStat(item, 'accuracy') * 100)}%`);
  if (item.dodge) parts.push(`閃避率 +${Math.round(effectiveEquipmentStat(item, 'dodge') * 100)}%`);
  if (item.attackSpeedBonus) parts.push(`攻擊速度 +${Math.round(effectiveEquipmentStat(item, 'attackSpeedBonus') * 100)}%`);
  if (item.cooldownSpeedBonus) parts.push(`冷卻速度 +${Math.round(effectiveEquipmentStat(item, 'cooldownSpeedBonus') * 100)}%`);
  if (item.manaRegenBonus) parts.push(`魔力恢復 +${Math.round(effectiveEquipmentStat(item, 'manaRegenBonus') * 100)}%`);
  if (item.manaRegenFlat) parts.push(`每秒回魔 +${effectiveEquipmentStat(item, 'manaRegenFlat')}`);
  if (item.hpRegeneration) parts.push(`每秒生命恢復 +${effectiveEquipmentStat(item, 'hpRegeneration')}`);
  if (item.magicDamageBonus) parts.push(`魔法傷害 +${Math.round(effectiveEquipmentStat(item, 'magicDamageBonus') * 100)}%`);
  if (item.parry) parts.push(`招架 +${Math.round(effectiveEquipmentStat(item, 'parry') * 100)}%`);
  if (item.damageReduction) parts.push(`傷害減免 +${Math.round(effectiveEquipmentStat(item, 'damageReduction') * 100)}%`);
  if (item.movementSpeedBonus) parts.push(`移動速度 +${Math.round(effectiveEquipmentStat(item, 'movementSpeedBonus') * 100)}%`);
  if (item.maxArrows) parts.push(`最大箭矢 ${Math.floor(Number(item.maxArrows))}`);
  if (item.arrowRecoveryInterval) parts.push(`每 ${(Number(item.arrowRecoveryInterval) / 1000).toFixed(1).replace(/\.0$/, '')} 秒恢復 1 支箭矢`);
  if (item.arrowRecoverySpeedBonus) parts.push(`箭矢恢復速度 +${Math.round(Number(item.arrowRecoverySpeedBonus) * 100)}%`);
  if (item.affix) parts.push(`詞綴【${item.affix.name}】：${item.affix.text}`);
  if (item.primaryStat) parts.push(`主能力【${CraftingPolicy.formatStat(item.primaryStat)}】`);
  (Array.isArray(item.affixes) ? item.affixes : []).forEach((entry) => {
    if (item.primaryStat) { parts.push(`額外詞綴【${CraftingPolicy.formatStat(entry)}】`); return; }
    const text = EquipmentAffixPolicy.formatAffix(entry);
    if (text) parts.push(`${entry.source === 'fixed' ? '固定' : '隨機'}詞綴【${text}】`);
  });
  if (item.specialAbility) parts.push(`特殊能力【${item.specialAbility.description || item.specialAbility.name}】`);
  if (item.legendaryAbility) parts.push(`傳奇能力【${item.legendaryAbility.description || item.legendaryAbility.name}】`);
  if (item.allowedJobs?.length) parts.push(`職業：${item.allowedJobs.map((job) => ({ warrior: '戰士', assassin: '刺客', hunter: '獵人', mage: '法師', priest: '牧師' })[job] || job).join('、')}`);
  return parts.join('　') || item.description || '';
}

function equipmentAffixLineHtml(entry, item) {
  const text = EquipmentAffixPolicy.formatAffix(entry);
  if (!text) return '';
  const valueMatch = text.match(/^(.*?)(\s+\+[^\s]+)$/);
  const name = valueMatch ? valueMatch[1] : text;
  const value = valueMatch ? valueMatch[2].trim() : '';
  const fixedIds = new Set((item.fixedAffixes || []).map((affix) => affix.id));
  const source = entry.source === 'fixed' || fixedIds.has(entry.id) ? '固定' : '隨機';
  return `<div class="equipment-affix-line"><span class="equipment-affix-source ${source === '固定' ? 'is-fixed' : 'is-random'}">${source}</span><span class="equipment-affix-name">${name}</span>${value ? `<strong class="equipment-affix-value">${value}</strong>` : ''}</div>`;
}

function equipmentDetailsHtml(item) {
  if (item?.kind !== 'equipment') return itemStatsText(item);
  const baseText = itemStatsText({ ...item, affix: null, affixes: [], fixedAffixes: [], randomAffixes: [], specialAbility: null, legendaryAbility: null });
  const baseStats = baseText.split('　').filter(Boolean).map((part) => {
    const statMatch = part.match(/^(.+?)(\s+)([-+]?\d.*)$/);
    return statMatch ? `<span class="equipment-base-stat"><strong>${statMatch[1]}</strong><span>${statMatch[3]}</span></span>` : `<span class="equipment-base-stat">${part}</span>`;
  }).join('');
  const affixLines = (item.affixes || []).map((entry) => equipmentAffixLineHtml(entry, item)).filter(Boolean);
  return `<span class="equipment-base-stats">${baseStats}</span>${affixLines.length ? `<span class="equipment-affix-section"><span class="equipment-affix-title">裝備詞綴</span>${affixLines.join('')}</span>` : ''}`;
}

function itemCategory(item) {
  if (item.kind === 'consumable' || item.kind === 'material' || item.kind === 'recipe') return 'consumable';
  if (item.kind === 'equipment' && ['weapon', 'offhand'].includes(item.slot)) return 'weapon';
  if (item.kind === 'equipment') return 'armor';
  return 'other';
}

function isItemWearableByCharacter(item, character, level = 1) {
  if (item.kind !== 'equipment') return true;
  if (item.durability !== undefined && Number(item.durability) <= 0) return false;
  if ((Number(item.requiredLevel) || 0) > (Number(level) || 1)) return false;
  return Boolean(character && EquipmentPolicy.getEquipSlots(item, character.job).length);
}

function getItemJunkContext(item, character, progress) {
  return { level: progress.level, canEquip: Boolean(character && EquipmentPolicy.getEquipSlots(item, character.job).length) };
}

function equipmentStackKey(item) {
  return JSON.stringify({
    name: item.name,
    quality: item.quality || '普通',
    slot: item.slot,
    weaponType: item.weaponType || '',
    attackMin: item.attackMin || 0,
    attackMax: item.attackMax || 0,
    attackSpeed: item.attackSpeed || 0,
    armorType: item.armorType || '',
    attack: item.attack || 0,
    defense: item.defense || 0,
    hp: item.hp || 0,
    mana: item.mana || 0,
    accuracy: item.accuracy || 0,
    manaRegenFlat: item.manaRegenFlat || 0,
    hpRegeneration: item.hpRegeneration || 0,
    magicDamageBonus: item.magicDamageBonus || 0,
    maxArrows: item.maxArrows || 0,
    arrowRecoverySpeedBonus: item.arrowRecoverySpeedBonus || 0,
    parry: item.parry || 0,
    damageReduction: item.damageReduction || 0,
    movementSpeedBonus: item.movementSpeedBonus || 0,
    affix: item.affix || null,
    affixes: item.affixes || [],
    durability: item.durability ?? null,
    requiredLevel: item.requiredLevel || 0,
    isJunk: item.isJunk === true,
    allowedJobs: [...(item.allowedJobs || [])].sort()
  });
}

function stackIdenticalEquipment(items) {
  const stacks = new Map();
  items.forEach((item) => {
    if (item.kind !== 'equipment') {
      stacks.set(`item:${item.id}`, { ...item, stackIds: [item.id], stackQuantity: item.quantity || 1 });
      return;
    }
    const key = equipmentStackKey(item);
    const stack = stacks.get(key);
    if (stack) {
      stack.stackIds.push(item.id);
      stack.stackQuantity += 1;
    } else {
      stacks.set(key, { ...item, stackIds: [item.id], stackQuantity: 1 });
    }
  });
  return [...stacks.values()];
}

function itemImagePath(item) {
  return item.image || (['weapon', 'offhand'].includes(item.slot) ? 'assets/equipment-weapon.png' : 'assets/equipment-armor.png');
}

function itemQualityClass(item) {
  const quality = EquipmentAffixPolicy.normalizeQuality(item?.quality);
  return quality === 'epic' ? 'quality-epic' : quality === 'rare' ? 'quality-rare' : quality === 'uncommon' ? 'quality-excellent' : 'quality-normal';
}

function itemQualityLabel(item) {
  return item?.kind === 'equipment' ? EquipmentAffixPolicy.getQualityLabel(item) : item?.quality || '道具';
}

function renderInventory(view = 'inventory') {
  const progress = getProgress();
  const character = getActiveCharacter();
  const modal = document.querySelector('#inventory-modal');
  const title = document.querySelector('#inventory-title');
  const content = document.querySelector('#inventory-content');
  title.textContent = view === 'equipment' ? '裝備' : '背包';
  const accountResources = getAccountResources();
  const resourceBar = `<section class="account-resource-bar"><span>◆ 星鐵碎片 <b>${accountResources.starIron}</b></span></section>`;
  const renderItemCard = (item, options = {}) => {
    const equipped = Boolean(options.equipped);
    const wearable = isItemWearableByCharacter(item, character, progress.level);
    const slot = options.slot ? `・${options.slot}` : '';
    const stackIds = item.stackIds || [item.id];
    const stackQuantity = item.kind === 'equipment' ? (item.stackQuantity || 1) : item.quantity;
    const stackItems = stackIds.map((id) => progress.inventory.find((entry) => entry.id === id)).filter(Boolean);
    const selectedCount = stackIds.filter((id) => scrapSelection.has(id)).length;
    const junkCandidate = stackItems.some((entry) => InventorySalePolicy.isJunkCandidate(entry, getItemJunkContext(entry, character, progress)));
    const junkBadge = junkCandidate ? '<span class="junk-badge" title="不能裝備的廢品" aria-label="不能裝備的廢品">🗑</span>' : '';
    const visual = item.image
      ? `<img src="${itemImagePath(item)}" alt="" class="inventory-item-image">`
      : item.icon || '◈';
    const currentItem = item.kind === 'equipment' ? progress.equipment[item.slot] : null;
    const comparison = item.kind === 'equipment' && !equipped ? `<aside class="equipment-compare-tooltip"><strong>目前穿戴・${equipmentSlots[item.slot]?.label || item.slot}</strong>${currentItem ? `<div><span class="compare-item-icon"><img src="${itemImagePath(currentItem)}" alt=""></span><p><b>${currentItem.name}</b><small>${equipmentDetailsHtml(currentItem)}</small></p></div>` : '<p class="compare-empty">此欄位目前沒有穿戴裝備</p>'}</aside>` : '';
    const equipSlots = item.kind === 'equipment' ? EquipmentPolicy.getEquipSlots(item, character?.job) : [];
    const equipControls = equipSlots.map((targetSlot) => `<button type="button" data-equip-id="${item.id}" data-equip-slot="${targetSlot}">${equipSlots.length > 1 ? targetSlot === 'weapon' ? '裝主手' : '裝副手' : '穿戴'}</button>`).join('');
    return `<article class="inventory-item ${itemQualityClass(item)} ${equipped ? 'is-equipped' : ''} ${!wearable ? 'incompatible' : ''} ${selectedCount === stackIds.length && selectedCount ? 'sale-selected' : selectedCount ? 'sale-partial' : ''}" tabindex="${item.kind === 'equipment' && !equipped ? '0' : '-1'}">${junkBadge}<span class="item-icon">${visual}</span><div><b>${item.name}${stackQuantity > 1 ? ` ×${stackQuantity}` : ''}${equipped ? '<mark>已穿戴</mark>' : ''}</b><small>${slot}${slot ? '　' : ''}${item.kind === 'equipment' ? equipmentDetailsHtml(item) : itemStatsText(item)}</small></div>${item.kind === 'equipment' && !equipped ? wearable && equipControls ? equipControls : '<span class="equip-blocked">無法穿戴</span>' : ''}${comparison}</article>`;
  };
  const categoryTabs = [
    ['weapon', '武器'],
    ['armor', '防具'],
    ['consumable', '道具']
  ];
  const categoryCounts = Object.fromEntries(categoryTabs.map(([id]) => [id, progress.inventory.filter((item) => itemCategory(item) === id).length]));
  const inventoryTabs = `<nav class="inventory-tabs" aria-label="背包分類">${categoryTabs.map(([id, label]) => `<button type="button" data-inventory-category="${id}" class="${inventoryCategory === id ? 'selected' : ''}">${label}<b>${categoryCounts[id]}</b></button>`).join('')}</nav>`;
  const filteredItems = progress.inventory
    .filter((item) => itemCategory(item) === inventoryCategory)
    .sort((first, second) => {
      if (!['weapon', 'armor'].includes(inventoryCategory)) return 0;
      const wearableDifference = Number(isItemWearableByCharacter(second, character, progress.level)) - Number(isItemWearableByCharacter(first, character, progress.level));
      return wearableDifference || first.name.localeCompare(second.name, 'zh-Hant');
    });
  const stackedItems = stackIdenticalEquipment(filteredItems);
  const itemCards = stackedItems.length
    ? stackedItems.map(renderItemCard).join('')
    : '<p class="empty-inventory">這個分類目前沒有物品。</p>';
  const selectedScrapCount = [...scrapSelection].filter((id) => progress.inventory.some((item) => item.id === id && item.kind === 'equipment')).length;
  const saleSummary = InventorySalePolicy.summarizeSelection(progress.inventory, scrapSelection, (item) => getItemJunkContext(item, character, progress));
  const scrappableItems = progress.inventory.filter((item) => item.kind === 'equipment' && itemCategory(item) === inventoryCategory);
  const allScrapSelected = scrappableItems.length > 0 && scrappableItems.every((item) => scrapSelection.has(item.id));
  const categoryLabel = inventoryCategory === 'weapon' ? '武器' : inventoryCategory === 'armor' ? '防具' : '裝備';
  const scrapTools = `<section class="scrap-tools"><div><b>批次販賣</b><small>已選擇 ${saleSummary.count} 件・預計獲得 ${saleSummary.gold} 金幣</small></div><label class="scrap-select select-all-scrap"><input type="checkbox" data-select-all-scrap ${allScrapSelected ? 'checked' : ''} ${scrappableItems.length ? '' : 'disabled'}><span>全部勾選${categoryLabel}</span></label><button type="button" class="select-junk-button" data-select-common-equipment>勾選全部白色裝備</button><button type="button" data-open-sell-confirm ${selectedScrapCount ? '' : 'disabled'}>確認販賣（${selectedScrapCount}）</button></section>`;
  const paperDoll = Object.entries(equipmentSlots).map(([slot, info]) => {
    const item = progress.equipment[slot];
    const visual = item ? `<img src="${itemImagePath(item)}" alt="" class="paper-doll-item-image">` : info.icon;
    const unequipButton = item ? `<button class="unequip-button" type="button" data-unequip-slot="${slot}">卸下</button>` : '';
    return `<article class="equipment-frame slot-${slot} ${item ? `equipped ${itemQualityClass(item)}` : ''}"><span class="equipment-frame-icon">${visual}</span><b>${info.label}</b><small>${item ? item.name : '空欄位'}</small>${item ? `<em>${itemStatsText(item)}</em>${unequipButton}` : ''}</article>`;
  }).join('');
  content.innerHTML = view === 'equipment'
    ? `${resourceBar}<section class="paper-doll" aria-label="角色裝備紙娃娃"><span class="paper-doll-silhouette" aria-hidden="true">🧍</span>${paperDoll}</section>`
    : `${resourceBar}${inventoryTabs}${scrapTools}<section class="inventory-list">${itemCards}</section>`;
  modal.classList.remove('hidden');
  modal.dataset.view = view;
}

function renderCharacterAbilities() {
  const character = getActiveCharacter();
  if (!character) return;
  const progress = getProgress();
  const stats = getCharacterStats(progress.level, progress, character);
  const equipment = getEquipmentStats(progress);
  const collection = getCollectionStats(progress);
  const race = Object.values(factions).flat().find((item) => item.id === character.race);
  const job = classes.find((item) => item.id === character.job);
  const usesRage = WarriorResourcePolicy.isWarrior(character.job);
  const usesEnergy = AssassinEnergyPolicy.isAssassin(character.job);
  const modal = document.querySelector('#inventory-modal');
  document.querySelector('#inventory-title').textContent = '角色能力';
  document.querySelector('#inventory-content').innerHTML = `
    <section class="ability-summary">
      <div class="ability-identity"><span class="creation-race-icon race-${character.race}" aria-hidden="true"></span><div><h3>${character.name}</h3><p>${race?.name || character.race}・${job?.name || character.job}・Lv. ${progress.level}</p><small>${race?.trait || ''}</small></div></div>
      <div class="ability-grid">
        <article><small>最大生命</small><b>${stats.hp}</b><em>裝備 +${equipment.hp}・收藏 +${collection.hp}</em></article>
        <article><small>${usesRage ? '最大怒氣' : usesEnergy ? '最大能量' : '最大魔力'}</small><b>${usesRage ? WarriorResourcePolicy.MAX_RAGE : usesEnergy ? AssassinEnergyPolicy.MAX_ENERGY : stats.mana}</b><em>${usesRage ? '攻擊與受到攻擊時取得' : usesEnergy ? `固定恢復 ${AssassinEnergyPolicy.ENERGY_REGEN_PER_SECOND}／秒` : `收藏 +${collection.mana}`}</em></article>
        <article><small>攻擊／法攻</small><b>${stats.attack}</b><em>裝備 +${equipment.attack}・收藏 +${collection.attack}</em></article>
        <article><small>防禦</small><b>${stats.defense}</b><em>裝備 +${equipment.defense}・收藏 +${collection.defense}</em></article>
        <article><small>暴擊率</small><b>${(stats.crit * 100).toFixed(1)}%</b><em>上限 60%</em></article>
        <article><small>閃避率</small><b>${(stats.dodge * 100).toFixed(1)}%</b><em>上限 45%</em></article>
        <article><small>命中能力</small><b>${Math.round(stats.accuracy * 100)}%</b><em>${character.job === 'hunter' && progress.level >= 3 ? '精準射擊加成' : '基礎命中加成'}</em></article>
        <article><small>招架率</small><b>${(stats.parry * 100).toFixed(1)}%</b><em>成功時傷害減半</em></article>
        ${usesRage || usesEnergy ? '' : `<article><small>額外回魔</small><b>+${stats.manaRegenFlat.toFixed(1)}／秒</b><em>裝備固定回復</em></article>`}
        <article><small>攻擊速度</small><b>${stats.attackSpeed.toFixed(2)}</b><em>次／秒倍率</em></article>
        <article><small>技能冷卻速度</small><b>${Math.round(stats.cooldownSpeed * 100)}%</b><em>${character.race === 'elf' ? '種族加成' : '基礎值'}</em></article>
      </div>
    </section>`;
  modal.dataset.view = 'abilities';
  modal.classList.remove('hidden');
}

function renderCollection() {
  const progress = getProgress();
  const owned = progress.collection || {};
  const templates = Object.values(collectibleTemplates);
  const modal = document.querySelector('#inventory-modal');
  document.querySelector('#inventory-title').textContent = `收藏品 ${Object.keys(owned).length} / ${templates.length}`;
  document.querySelector('#inventory-content').innerHTML = `<section class="collection-grid">${templates.map((item, index) => {
    const obtained = Boolean(owned[item.id]);
    const iconX = index % 4;
    const iconY = Math.floor(index / 4);
    return `<article class="collection-card ${obtained ? 'obtained' : 'locked'}"><span class="collection-icon" style="--icon-x:${iconX};--icon-y:${iconY}" aria-label="${obtained ? item.name : '尚未取得'}"></span><div><b>${obtained ? item.name : '尚未發現'}</b><small>來源：${item.source}</small><em>${obtained ? item.description : '擊敗此怪物時有機率獲得'}</em></div></article>`;
  }).join('')}</section>`;
  modal.dataset.view = 'collection';
  modal.classList.remove('hidden');
}

function getDropLookupItems() {
  return DropLookupPolicy.buildIndex({
    maps: mapProgression,
    mapPools: dropLookupMapPools,
    monsters: monsterTypes,
    materialPolicies: [ChapterOneMaterialDropPolicy, ChapterTwoMaterialDropPolicy],
    recipePolicies: [ChapterOneRecipeDropPolicy, ChapterTwoRecipeDropPolicy],
    skillPolicy: SkillUpgradePolicy,
    bossPolicy: ChapterBossDropPolicy,
    purificationPolicy: BlackForestCorruptionPolicy,
    specialEquipmentPolicy: ChapterTwoSpecialEquipmentPolicy
  });
}

function isDropLookupMapUnlocked(map, progress = getProgress()) {
  if (!map?.implemented) return false;
  if (map.chapter === 1 && !ChapterOneProgressionPolicy.isUnlocked(progress, map.id)) return false;
  if (map.chapter === 2 && (!ChapterOneProgressionPolicy.isUnlocked(progress, 'black-forest') || progress.level < map.min)) return false;
  if (map.ticketItemId && getInventoryItemQuantity(progress, map.ticketItemId) < 1) return false;
  if (map.dungeon && !map.ticketItemId && (getAccountResources().dungeonKeys?.blackForestAltar || 0) < 1) return false;
  return true;
}

function renderDropLookup() {
  const progress = getProgress();
  const activeMap = getActiveMap(progress);
  const items = getDropLookupItems();
  const filtered = DropLookupPolicy.filterItems(items, dropLookupQuery, dropLookupCategory, activeMap.id);
  const categories = [['all', '全部'], ['equipment', '裝備'], ['material', '材料'], ['recipe', '配方'], ['skill', '技能材料']];
  const resultCards = filtered.map((item) => {
    const visual = item.image
      ? `<img src="${item.image}" alt="" class="drop-result-image">`
      : item.icon || (item.category === 'equipment' ? '⚔' : '◆');
    return `<article class="drop-result-card"><span>${visual}</span><div><b>${item.name}</b><small>${item.typeLabel}</small></div></article>`;
  }).join('');
  const purificationMaterial = BlackForestCorruptionPolicy.MAP_MATERIALS[activeMap.id];
  const corruption = BlackForestCorruptionPolicy.getEffect(progress.blackForestCorruption);
  const owned = purificationMaterial ? BlackForestCorruptionPolicy.getQuantity(progress.inventory, purificationMaterial.id) : 0;
  const purificationPanel = purificationMaterial ? `<section class="drop-purification-panel"><div><b>黑森林 Debuff：${corruption.level} 層</b><small>${purificationMaterial.name} ${owned} / ${BlackForestCorruptionPolicy.MATERIAL_COST}・金幣 ${progress.gold} / ${BlackForestCorruptionPolicy.GOLD_COST}</small><em>每次成功率 10%；無論成功或失敗皆消耗材料與金幣。</em></div><button type="button" data-attempt-purification="${activeMap.id}" ${corruption.level <= 0 || owned < BlackForestCorruptionPolicy.MATERIAL_COST || progress.gold < BlackForestCorruptionPolicy.GOLD_COST ? 'disabled' : ''}>嘗試解除 1 層</button></section>` : '';
  document.querySelector('#drop-lookup-content').innerHTML = `${purificationPanel}<div class="drop-lookup-toolbar"><label><span>搜尋物品名稱</span><input type="search" data-drop-search value="${dropLookupQuery.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" placeholder="例如：狼牙、技能殘頁、配方"></label><nav>${categories.map(([id, label]) => `<button type="button" data-drop-category="${id}" class="${dropLookupCategory === id ? 'selected' : ''}">${label}</button>`).join('')}</nav></div><main class="drop-lookup-simple"><p class="drop-result-count"><strong>目前地圖：${activeMap.name}</strong>・共 ${filtered.length} 種掉落物</p><div class="drop-result-list">${resultCards || '<p class="drop-empty-result">此地圖沒有符合條件的掉落物。</p>'}</div></main>`;
  document.querySelector('#drop-lookup-modal').classList.remove('hidden');
}

function renderMapSelector() {
  const progress = getProgress();
  const resources = getAccountResources();
  const character = getActiveCharacter();
  const stats = getCharacterStats(progress.level, progress, character);
  const activeMap = getActiveMap(progress);
  const maps = mapProgression.filter((map) => map.implemented && !map.regionOf);
  const modal = document.querySelector('#inventory-modal');
  document.querySelector('#inventory-title').textContent = '選擇冒險地圖';
  document.querySelector('#inventory-content').innerHTML = `<section class="map-selection-grid">${maps.map((map) => {
    const unlocked = map.id === 'beginner-plains'
      || (map.chapter === 1 && ChapterOneProgressionPolicy.isUnlocked(progress, map.id))
      || (map.chapter === 2 && ChapterOneProgressionPolicy.isUnlocked(progress, 'black-forest') && progress.level >= map.min);
    const isRegionHub = map.id === 'beginner-plains' || map.regionHub;
    const regionCount = map.id === 'black-forest' ? blackForestRegions.length : beginnerPlainsRegions.length;
    const recommended = map.recommended || { attack: 0, defense: 0, hp: 0 };
    const ready = stats.attack >= recommended.attack && stats.defense >= recommended.defense && stats.hp >= recommended.hp;
    const recommendation = `<strong class="map-recommendation ${ready ? 'ready' : 'danger'}">${ready ? '✓ 能力達標' : '⚠ 建議整備'}　攻 ${recommended.attack}・防 ${recommended.defense}・生命 ${recommended.hp}</strong>`;
    const dungeonDefinition = map.dungeon ? dungeonDefinitions[map.id] : null;
    const dungeonPasses = map.ticketItemId ? getInventoryItemQuantity(progress, map.ticketItemId) : resources.dungeonKeys?.blackForestAltar || 0;
    const dungeonPassName = map.ticketItemId ? '哥布林營地地圖' : '祭壇鑰匙';
    const detail = isRegionHub
      ? map.id === 'black-forest'
        ? '<em>第二章 Lv15～30・承接平原深處的黑石山賊主線・目前僅完成地圖架構</em>'
        : `<em>包含 ${regionCount} 個探索區域・怪物與掉落物將陸續追加</em>`
      : map.dungeon ? `<em>${map.id === 'goblin-camp' ? '清場後留意哥布林號角' : `${dungeonDefinition?.waves || 10} 波戰鬥・最終波 BOSS・職業套裝`}${map.ticketItemId ? '・可連續自動挑戰' : ''}</em><strong class="dungeon-key-count">${dungeonPassName}：${dungeonPasses}</strong>` : `<em>普通 ${map.normalXp} EXP・精英 ${map.eliteXp} EXP・Boss ${map.bossXp} EXP</em>`;
    const action = isRegionHub
      ? unlocked ? `<button type="button" data-open-map-region="${map.id}">查看 ${regionCount} 個區域</button>` : `<span>Lv. ${map.min} 解鎖</span>`
      : map.dungeon
      ? unlocked ? `<button type="button" data-select-map="${map.id}" ${dungeonPasses < 1 ? 'disabled' : ''}>${dungeonPasses > 0 ? map.ticketItemId ? '使用地圖進入' : '消耗鑰匙進入' : `需要${dungeonPassName}`}</button>` : `<span>Lv. ${map.min} 解鎖</span>`
      : unlocked ? map.id === activeMap.id ? '<span>目前地圖</span>' : `<button type="button" data-select-map="${map.id}">前往地圖</button>` : `<span>Lv. ${map.min} 解鎖</span>`;
    return `<article class="map-selection-card ${isRegionHub ? 'region-hub-card' : ''} ${map.dungeon ? 'dungeon-card' : ''} ${map.id === activeMap.id ? 'selected' : ''} ${unlocked ? '' : 'locked'}" style="--map-preview:url('${map.background}')"><div><b>${map.dungeon ? '◆ ' : ''}${map.name}</b><small>${isRegionHub ? `第 ${map.chapter} 章探索地區` : `怪物等級 Lv. ${map.monsterMin || map.min}～${map.monsterMax || map.max}`}</small>${detail}${isRegionHub ? '' : recommendation}</div>${action}</article>`;
  }).join('')}</section>`;
  modal.dataset.view = 'maps';
  modal.classList.remove('hidden');
}

function renderBeginnerPlainsRegions() {
  const progress = getProgress();
  const activeMap = getActiveMap(progress);
  const modal = document.querySelector('#inventory-modal');
  document.querySelector('#inventory-title').textContent = '初心者平原・區域選擇';
  document.querySelector('#inventory-content').innerHTML = `
    <button type="button" class="map-region-back" data-map-region-back>← 返回地區選擇</button>
    <section class="region-overview-card" style="--map-preview:url('assets/beginner-plains-background.png')">
      <div><b>初心者平原</b><small>第一章探索地區</small></div>
      <em>區域架構已建立，怪物、圖片與個別掉落物將於後續逐區追加。</em>
    </section>
    <section class="map-region-grid">${beginnerPlainsRegions.map((region, index) => {
      const available = ['plains-entrance', 'wolf-den', 'boar-woods', 'goblin-camp', 'plains-depths'].includes(region.id);
      const regionMap = mapProgression.find((map) => map.id === region.id);
      const unlocked = available && ChapterOneProgressionPolicy.isUnlocked(progress, region.id);
      const unlockStatus = ChapterOneProgressionPolicy.getUnlockStatus(progress, region.id);
      const condition = unlockStatus.completion;
      const isGoblinCamp = region.id === 'goblin-camp';
      const goblinMaps = getInventoryItemQuantity(progress, GOBLIN_CAMP_TICKET_ID);
      const regionDetail = isGoblinCamp
        ? `號角將決定是否繼續深入・哥布林營地地圖 ${goblinMaps} 張`
        : region.id === 'plains-depths' ? '怪物 7 種・已完成圖片 7 種' : available ? '怪物 5 種・稀有怪物機率 10%' : '怪物與掉落物：尚未設定';
      const lockedDetail = condition ? `<div class="map-unlock-progress"><b>${region.name}－尚未解鎖</b><small>角色等級：Lv${condition.level} / Lv${condition.requirement.level}</small><small>區域壓制：${Math.min(condition.normalKills, condition.requirement.normalKills)} / ${condition.requirement.normalKills}</small><small>Boss（${condition.requirement.bossName}）：${condition.bossCleared ? '已擊敗' : '尚未擊敗'}</small></div>` : '';
      return `
      <article class="map-region-card ${available ? 'available' : 'pending'} ${unlocked ? '' : 'locked'} ${activeMap.id === region.id ? 'selected' : ''}">
        <span>${String(index + 1).padStart(2, '0')}</span>
        <div><b>${region.name}</b><small>${regionDetail}</small>${unlocked ? '' : lockedDetail}</div>
        ${available
          ? !unlocked ? '<em>完成前一區域三項條件後解鎖</em>' : activeMap.id === region.id && !progress.requiresMapSelectionAfterDefeat ? '<em class="current-region">目前區域</em>' : `<button type="button" data-select-map="${region.id}" ${isGoblinCamp && goblinMaps < 1 ? 'disabled' : ''}>${isGoblinCamp ? goblinMaps > 0 ? '使用地圖進入副本' : '需要哥布林營地地圖' : progress.requiresMapSelectionAfterDefeat ? '重新進入區域' : '進入區域'}</button>`
          : '<em>準備中</em>'}
      </article>`;
    }).join('')}
    </section>`;
  modal.dataset.view = 'map-regions';
  modal.classList.remove('hidden');
}

function selectAdventureMap(mapId) {
  const progress = getProgress();
  const map = mapProgression.find((item) => item.id === mapId && item.implemented);
  if (!map) return;
  if (map.chapter === 1 && !ChapterOneProgressionPolicy.isUnlocked(progress, map.id)) {
    const status = ChapterOneProgressionPolicy.getUnlockStatus(progress, map.id).completion;
    if (status) showToast(`${map.name}尚未解鎖：Lv${status.level}/${status.requirement.level}・壓制 ${status.normalKills}/${status.requirement.normalKills}・Boss ${status.bossCleared ? '完成' : '未完成'}`);
    return;
  }
  if (map.chapter === 2 && (!ChapterOneProgressionPolicy.isUnlocked(progress, 'black-forest') || progress.level < map.min)) return;
  if (map.chapter === 2) BlackForestCorruptionPolicy.enterChapter(progress);
  if (map.dungeon) {
    if (map.ticketItemId) {
      if (getInventoryItemQuantity(progress, map.ticketItemId) < 1) { showToast('需要哥布林營地地圖才能進入。'); return; }
    } else {
      const resources = getAccountResources();
      const keys = resources.dungeonKeys?.blackForestAltar || 0;
      if (keys < 1) { showToast('需要黑森林祭壇鑰匙才能進入。'); return; }
      resources.dungeonKeys.blackForestAltar = keys - 1;
      saveAccountResources(resources);
    }
    const activeMap = getActiveMap(progress);
    if (!activeMap.dungeon) progress.dungeonReturnMapId = activeMap.id;
    progress.dungeonAdmission = true;
  }
  progress.selectedMapId = map.id;
  progress.requiresMapSelectionAfterDefeat = false;
  progress.unlockedChapter = Math.max(getUnlockedChapter(progress), Number(map.chapter) || 1);
  saveProgress(progress);
  if (!document.querySelector('#drop-lookup-modal')?.classList.contains('hidden')) renderDropLookup();
  document.querySelector('#inventory-modal').classList.add('hidden');
  showToast(map.dungeon ? map.ticketItemId ? `持有地圖，進入：${map.name}` : `已消耗 1 把鑰匙，進入：${map.name}` : `已前往：${map.name}`);
  openBattle();
}

function equipItem(itemId, preferredSlot = null) {
  const progress = getProgress();
  const itemIndex = progress.inventory.findIndex((item) => item.id === itemId && item.kind === 'equipment');
  if (itemIndex < 0) return;
  const item = progress.inventory[itemIndex];
  const character = getActiveCharacter();
  const targetSlot = preferredSlot || item.slot;
  if (!character || !isItemWearableByCharacter(item, character, progress.level) || !EquipmentPolicy.canEquipInSlot(item, character.job, targetSlot)) {
    showToast('這件裝備不適合目前職業。');
    return;
  }
  progress.inventory.splice(itemIndex, 1);
  if (!equipmentSlots[targetSlot]) {
    progress.inventory.unshift(item);
    return;
  }
  Object.entries(progress.equipment).forEach(([slot, equipped]) => {
    if (slot !== targetSlot && equipped?.id === item.id) progress.equipment[slot] = null;
  });
  const previous = progress.equipment[targetSlot];
  if (previous) progress.inventory.unshift(previous);
  progress.equipment[targetSlot] = item;
  scrapSelection.delete(item.id);
  saveProgress(progress);
  showToast(`已穿戴：${item.name}`);
  logBattle(`⚙ 已穿戴【${item.name}】。`);
  renderInventory(document.querySelector('#inventory-modal').dataset.view || 'inventory');
  if (fighting) {
    clearInterval(battleTimer);
    battleTimer = setInterval(battleTick, Math.round(1000 / getCharacterStats(progress.level, progress, character).attackSpeed));
    updateBattleUI();
  }
}

function unequipItem(slot) {
  const progress = getProgress();
  const item = progress.equipment?.[slot];
  if (!item) return;
  progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
  progress.inventory.unshift(item);
  progress.equipment[slot] = null;
  saveProgress(progress);
  showToast(`已卸下：${item.name}`);
  logBattle(`⚙ 已卸下【${item.name}】。`);
  renderInventory('equipment');
  if (fighting) {
  const character = getActiveCharacter();
    clearInterval(battleTimer);
    battleTimer = setInterval(battleTick, Math.round(1000 / getCharacterStats(progress.level, progress, character).attackSpeed));
    updateBattleUI();
  }
}

function renderBlackForestRegions() {
  const modal = document.querySelector('#inventory-modal');
  document.querySelector('#inventory-title').textContent = '第二章・黑森林';
  document.querySelector('#inventory-content').innerHTML = `
    <button type="button" class="map-region-back" data-map-region-back>← 返回地區選擇</button>
    <section class="region-overview-card" style="--map-preview:url('${ChapterTwoMapPolicy.CHAPTER.background}')">
      <div><b>黑森林</b><small>第二章・Lv15～30</small></div>
      <em>${ChapterTwoMapPolicy.CHAPTER.summary}</em>
    </section>
    <section class="map-region-grid">${blackForestRegions.map((region) => {
      const dungeon = region.dungeon ? ChapterTwoMapPolicy.getDungeon(region.id) : null;
      const detail = region.id === 'blackstone-stronghold'
        ? `副本骨架・${dungeon.primaryFaction === 'blackstone-bandits' ? '黑石山賊' : dungeon.primaryFaction}與哥布林合作勢力`
        : region.isFinalMap ? '第二章最終地圖' : '怪物、Boss、掉落、材料、事件與環境效果待後續設定';
      return `
      <article class="map-region-card pending locked ${region.dungeon ? 'dungeon-card' : ''}">
        <span>${String(region.order).padStart(2, '0')}</span>
        <div><b>${region.dungeon ? '◆ ' : ''}${region.name}</b><small>${detail}</small></div>
        <em>規劃中</em>
      </article>`;
    }).join('')}
    </section>`;
  modal.dataset.view = 'black-forest-regions';
  modal.classList.remove('hidden');
}

function selectAllCommonEquipment() {
  const progress = getProgress();
  progress.inventory.filter((item) => InventorySalePolicy.isCommonEquipment(item))
    .forEach((item) => scrapSelection.add(item.id));
  renderInventory('inventory');
}

function openSellConfirmation() {
  const progress = getProgress();
  const character = getActiveCharacter();
  const summary = InventorySalePolicy.summarizeSelection(progress.inventory, scrapSelection, (item) => getItemJunkContext(item, character, progress));
  if (!summary.count) return;
  document.querySelector('#sell-confirm-content').innerHTML = `<p>您選擇了 <b>${summary.count}</b> 件物品。</p><p>預計可獲得 <b>${summary.gold}</b> 金幣。</p><p>確定要販賣這些物品嗎？販賣後將無法復原。</p>${summary.containsJunkCandidate ? '<p class="sell-warning">⚠ 選擇的物品中包含「不能裝備的廢品」，販賣後將無法復原。</p>' : ''}<div class="sell-confirm-actions"><button type="button" data-cancel-sale>取消</button><button type="button" class="confirm-sale-button" data-confirm-sale>確認販賣</button></div>`;
  document.querySelector('#sell-confirm-modal').classList.remove('hidden');
}

function closeSellConfirmation() {
  document.querySelector('#sell-confirm-modal').classList.add('hidden');
}

function confirmSelectedEquipmentSale() {
  const progress = getProgress();
  const result = InventorySalePolicy.sellSelection(progress, scrapSelection);
  if (!result.ok) { closeSellConfirmation(); return; }
  scrapSelection.clear();
  saveProgress(progress);
  closeSellConfirmation();
  showToast(`已販賣 ${result.count} 件裝備，獲得 ${result.gold} 金幣。`);
  logBattle(`💰 已販賣 ${result.count} 件裝備，獲得 ${result.gold} 金幣。`, 'loot');
  renderInventory('inventory');
}

function renderEnemySquad() {
  const squad = document.querySelector('#enemy-squad');
  const visibleIndexes = aliveEnemyIndexesByAge().slice(0, 4);
  const focusIndex = visibleIndexes[0] ?? -1;
  const reserveCount = Math.max(0, battle.enemyHps.filter((hp) => hp > 0).length - visibleIndexes.length);
  const visibleEnemies = Array.from({ length: 4 }, (_, displaySlot) => {
    const index = visibleIndexes[displaySlot];
    if (index === undefined) {
      return `<div class="monster-battle-slot empty-slot" data-display-slot="${displaySlot}" role="gridcell"><div class="monster-empty-slot">等待怪物</div></div>`;
    }
    const hp = battle.enemyHps[index];
    const enemy = getEnemyDefinition(index);
    const monsterLevel = enemy.level || MonsterDisplayPolicy.getMonsterLevel(getActiveMap(getProgress()), getProgress().level);
    const damageEvents = (battle.enemyDamages[index] || []).map((event, eventIndex) => `<b class="enemy-damage ${event.type || 'normal'}" style="--damage-offset:${eventIndex * 18}px">-${event.damage}</b>`).join('');
    const rank = MonsterDisplayPolicy.getRankDisplay(enemy);
    const statusDisplays = MonsterDisplayPolicy.getStatusDisplays(battle.enemyDots[index]);
    const enemySkillState = getEnemySkillState(index);
    const stunned = Date.now() < enemySkillState.stunnedUntil && Date.now() >= (enemySkillState.visualStunAt || 0);
    const stunIndicator = stunned
      ? `<span class="enemy-stun-indicator" role="img" aria-label="暈眩中" style="--stun-remaining:${Math.max(0, enemySkillState.stunnedUntil - Date.now())}ms"><i>★</i><i>★</i><i>★</i></span>`
      : '';
    const slowed = Date.now() < enemySkillState.slowedUntil && Date.now() >= (enemySkillState.visualSlowAt || 0);
    const marked = Date.now() < enemySkillState.markedUntil && Date.now() >= (enemySkillState.visualMarkAt || 0);
    const bleeding = (battle.enemyDots[index] || []).some((dot) => dot.type === 'bleed') && Date.now() >= (enemySkillState.visualBleedAt || 0);
    const burning = (battle.enemyDots[index] || []).some((dot) => dot.type === 'burn') && Date.now() >= (enemySkillState.visualBurnAt || 0);
    const paralyzed = Date.now() < (enemySkillState.paralyzedUntil || 0) && Date.now() >= (enemySkillState.visualParalyzedAt || 0);
    const attackDown = Date.now() < enemySkillState.attackDownUntil && Date.now() >= (enemySkillState.visualAttackDownAt || 0);
    const hunterStatusIndicators = `${slowed ? '<span class="enemy-slow-indicator" role="img" aria-label="緩速中">❄</span><span class="enemy-slow-airflow"></span>' : ''}${marked ? '<span class="enemy-hunter-mark" role="img" aria-label="獵殺標記">◎</span>' : ''}${bleeding ? '<span class="enemy-bleed-indicator" role="img" aria-label="流血中">🩸</span><span class="enemy-bleed-wound"></span>' : ''}${burning ? '<span class="enemy-burn-flames" role="img" aria-label="燃燒中"><i></i><i></i><i></i></span>' : ''}${paralyzed ? '<span class="enemy-paralysis-indicator" role="img" aria-label="麻痺中">⚡</span><span class="enemy-paralysis-arcs"><i></i><i></i></span>' : ''}${attackDown ? '<span class="enemy-attack-down-indicator" role="img" aria-label="攻擊力下降">⚔<i>↓</i></span>' : ''}`;
    const statusIcons = statusDisplays.length
      ? statusDisplays.map((status) => `<span class="monster-status-icon" title="${status.label}" aria-label="${status.label}">${status.icon}</span>`).join('')
      : '<span class="monster-status-empty">無異常狀態</span>';
    const focusClass = index === focusIndex ? 'focus-target' : 'support-target';
    const rankBadge = rank.label ? `<span class="monster-rank-badge">${rank.icon} ${rank.label}</span>` : '';
    const affixBadges = (enemy.eliteAffixes || []).map((affix) => `<span class="monster-affix-badge" title="【${affix.name}】${affix.description}">【${affix.name}】</span>`).join('');
    const imagePath = enemy.image || MonsterDisplayPolicy.MONSTER_IMAGE_BY_TYPE[enemy.id] || MonsterDisplayPolicy.MONSTER_IMAGE_BY_TYPE.goblin;
    const visualSize = getMonsterVisualSize(enemy);
    const visualScaleCorrection = enemy.visualScaleCorrection || monsterVisualScaleCorrections[enemy.id] || 1;
    const hpPercent = Math.max(0, hp / enemy.maxHp * 100);
    return `<article id="enemy-${index}" class="enemy-unit monster-battle-slot visual-size-${visualSize} ${focusClass} ${rank.className} ${battle.targetIndexes.includes(index) ? 'targeted hit' : ''}" data-visual-size="${visualSize}" style="--unit-art-correction:${visualScaleCorrection}" data-display-slot="${displaySlot}" data-enemy-index="${index}" role="gridcell" aria-label="${enemy.name}，等級 ${monsterLevel}">${stunIndicator}${hunterStatusIndicators}<header class="monster-slot-header"><div class="monster-slot-title"><b>${enemy.name}</b><small>Lv. ${monsterLevel}</small></div>${rankBadge}${affixBadges}</header><div class="monster-image-frame"><img class="monster-slot-image" src="${imagePath}" alt="${enemy.name}" draggable="false">${damageEvents}</div><div class="monster-status-row" aria-label="異常狀態">${statusIcons}</div><div class="hp-track enemy-track monster-slot-hp" role="progressbar" aria-label="${enemy.name}生命" aria-valuemin="0" aria-valuemax="${enemy.maxHp}" aria-valuenow="${Math.max(0, hp)}"><i style="width:${hpPercent}%"></i></div></article>`;
  }).join('');
  const reserveLabel = reserveCount > 0
    ? `<div class="reserve-indicator"><b>其餘 ${reserveCount}</b><span>等待顯示</span></div>`
    : '';
  squad.innerHTML = visibleEnemies + reserveLabel;
}

function playMonsterAttackAnimation(enemyIndex, playerWasHit, targetMember = null) {
  const enemy = document.querySelector(`#enemy-${enemyIndex}`);
  if (enemy) {
    enemy.classList.remove('attacking');
    requestAnimationFrame(() => enemy.classList.add('attacking'));
    setTimeout(() => enemy.classList.remove('attacking'), 780);
  }
  if (!playerWasHit || (targetMember && !targetMember.isMain)) return;
  const player = document.querySelector('#player-fighter');
  const playerArt = document.querySelector('#battle-player-art');
  const field = document.querySelector('.battle-field');
  player?.classList.remove('hit');
  field?.classList.remove('impact');
  requestAnimationFrame(() => {
    player?.classList.add('hit');
    field?.classList.add('impact');
    setBattleCharacterAction(playerArt, getActiveCharacter(), 'hit');
  });
  setTimeout(() => setBattleCharacterAction(playerArt, getActiveCharacter(), 'idle'), 520);
}

function playPartyMemberHitAnimation(member) {
  if (!member) return;
  const fighter = member.isMain
    ? document.querySelector('#player-fighter')
    : document.querySelector(`[data-member-id="${member.id}"]`);
  const art = member.isMain
    ? document.querySelector('#battle-player-art')
    : fighter?.querySelector('.player-stage-art');
  if (!art) return;
  fighter?.classList.remove('is-hit');
  requestAnimationFrame(() => {
    fighter?.classList.add('is-hit');
    setBattleCharacterAction(art, member.character, 'hit');
  });
  setTimeout(() => {
    fighter?.classList.remove('is-hit');
    setBattleCharacterAction(art, member.character, 'idle');
  }, 520);
}

function playShadowTeleportSequence(art, points = [], duration = 980) {
  if (!art || !points.length) return null;
  art.shadowTeleportAnimation?.cancel();
  const visits = points.length === 1 ? [points[0], points[0]] : points;
  const keyframes = [
    { transform: 'translate(0,0)', opacity: 1, filter: 'none', offset: 0 },
    { transform: 'translate(-6px,0)', opacity: .18, filter: 'brightness(.35) sepia(.45) hue-rotate(225deg)', offset: .1 },
    { transform: 'translate(-6px,0)', opacity: 0, filter: 'brightness(.3)', offset: .14 }
  ];
  const start = .16;
  const finish = .7;
  const step = (finish - start) / Math.max(1, visits.length);
  visits.forEach((point, index) => {
    const arrival = start + index * step;
    const departure = Math.min(.74, arrival + step * .72);
    const transform = `translate(${point.x}px,${point.y}px)`;
    keyframes.push({ transform, opacity: 0, filter: 'brightness(.35)', offset: Math.max(.141, arrival - .018) });
    keyframes.push({ transform, opacity: 1, filter: 'none', offset: arrival });
    keyframes.push({ transform, opacity: 1, filter: 'none', offset: Math.max(arrival, departure - .025) });
    keyframes.push({ transform, opacity: 0, filter: 'brightness(.35)', offset: departure });
  });
  keyframes.push(
    { transform: 'translate(0,0)', opacity: 0, filter: 'brightness(.35)', offset: .82 },
    { transform: 'translate(0,0)', opacity: 1, filter: 'none', offset: 1 }
  );
  const animation = art.animate(keyframes, { duration, easing: 'linear', fill: 'both' });
  art.shadowTeleportAnimation = animation;
  animation.finished.catch(() => {}).finally(() => {
    if (art.shadowTeleportAnimation === animation) {
      animation.cancel();
      art.shadowTeleportAnimation = null;
    }
  });
  return animation;
}

function playPartyMemberCombatAnimation(member, targetIndexes = [], options = {}) {
  const { kind = 'basic', area = false, skillId = '', targetPositions = null } = options;
  requestAnimationFrame(() => {
    const field = document.querySelector('.battle-field');
    const fighter = member.isMain
      ? document.querySelector('#player-fighter')
      : document.querySelector(`[data-member-id="${member.id}"]`);
    const art = member.isMain
      ? document.querySelector('#battle-player-art')
      : fighter?.querySelector('.player-stage-art');
    const target = kind === 'skill' && (!area || skillId === 'chain-lightning')
      ? document.querySelector(`#enemy-${targetIndexes[0]}`)
      : null;
    const enemyFormation = kind === 'skill' && area
      ? document.querySelector('#enemy-squad')
      : null;
    if (!field || !art) return;
    if (kind === 'basic' && Number(art.combatAnimationLockUntil || 0) > Date.now()) return;
    if (art.combatAnimationTimer) clearTimeout(art.combatAnimationTimer);
    art.combatAnimationSequence = Number(art.combatAnimationSequence || 0) + 1;
    const animationSequence = art.combatAnimationSequence;
    const animationDuration = kind === 'basic' ? 420 : skillId === 'shadow-dance' ? 1000 : skillId === 'blizzard' ? 1120 : skillId === 'chain-lightning' ? 900 : skillId === 'holy-nova' ? 1000 : 720;
    if (kind === 'skill') art.combatAnimationLockUntil = Date.now() + animationDuration;
    const actionClass = skillId === 'heavy-strike' ? 'is-heavy-strike' : skillId === 'whirlwind' ? 'is-whirlwind' : skillId === 'charge' ? 'is-charge' : skillId === 'power-shot' ? 'is-power-shot' : skillId === 'multi-shot' ? 'is-multi-shot' : skillId === 'piercing-shot' ? 'is-piercing-shot' : skillId === 'backstab' ? 'is-backstab' : skillId === 'shadow-dance' ? 'is-shadow-dance' : skillId === 'fireball' ? 'is-fireball' : skillId === 'blizzard' ? 'is-blizzard' : skillId === 'chain-lightning' ? 'is-chain-lightning' : skillId === 'holy-light' ? 'is-holy-light' : skillId === 'holy-nova' ? 'is-holy-nova' : kind === 'basic' ? 'is-attacking' : area ? 'is-area-skill' : 'is-target-skill';
    fighter?.classList.remove('is-attacking', 'is-target-skill', 'is-single-target-skill', 'is-area-skill', 'is-heavy-strike', 'is-whirlwind', 'is-charge', 'is-power-shot', 'is-multi-shot', 'is-piercing-shot', 'is-backstab', 'is-shadow-dance', 'is-fireball', 'is-blizzard', 'is-chain-lightning', 'is-holy-light', 'is-holy-nova');
    art.classList.remove('is-attacking', 'is-target-skill', 'is-single-target-skill', 'is-area-skill', 'is-heavy-strike', 'is-whirlwind', 'is-charge', 'is-power-shot', 'is-multi-shot', 'is-piercing-shot', 'is-backstab', 'is-shadow-dance', 'is-fireball', 'is-blizzard', 'is-chain-lightning', 'is-holy-light', 'is-holy-nova');
    void art.offsetWidth;
    art.dataset.job = member.job || member.character?.job || 'warrior';
    setBattleCharacterAction(art, member.character, 'active');
    if (skillId === 'whirlwind') fighter?.style.setProperty('--whirlwind-portrait', art.style.backgroundImage);
    const fieldRect = field.getBoundingClientRect();
    const artRect = art.getBoundingClientRect();
    const targetRect = target?.getBoundingClientRect();
    const targetAnchor = targetPositions?.get(targetIndexes[0]);
    const enemyFormationRect = enemyFormation?.getBoundingClientRect();
    if (kind === 'skill') {
      const destinationX = skillId === 'chain-lightning'
        ? targetRect ? targetRect.left + targetRect.width * .5 : targetAnchor ? fieldRect.left + targetAnchor.x : fieldRect.left + fieldRect.width * .5
        : area
        ? enemyFormationRect ? enemyFormationRect.left + enemyFormationRect.width * .5 : fieldRect.left + fieldRect.width * .5
        : targetRect ? targetRect.left + targetRect.width * .5 : targetAnchor ? fieldRect.left + targetAnchor.x : artRect.left + artRect.width * .5;
      const destinationY = skillId === 'chain-lightning'
        ? targetRect ? targetRect.top + targetRect.height * .62 : targetAnchor ? fieldRect.top + targetAnchor.y : fieldRect.top + fieldRect.height * .42
        : area
        ? enemyFormationRect ? enemyFormationRect.bottom + artRect.height * .2 : fieldRect.top + fieldRect.height * .48
        : targetRect ? targetRect.top + targetRect.height * .55 : targetAnchor ? fieldRect.top + targetAnchor.y : artRect.top + artRect.height * .5;
      art.style.setProperty('--skill-move-x', `${destinationX - (artRect.left + artRect.width / 2)}px`);
      art.style.setProperty('--skill-move-y', `${destinationY - (artRect.top + artRect.height / 2)}px`);
      if (skillId === 'heavy-strike') {
        const deltaX = destinationX - (artRect.left + artRect.width / 2);
        const deltaY = destinationY - (artRect.top + artRect.height / 2);
        const distance = Math.max(1, Math.hypot(deltaX, deltaY));
        const lungeDistance = Math.min(48, Math.max(26, fieldRect.width * .045));
        art.style.setProperty('--heavy-lunge-x', `${deltaX / distance * lungeDistance}px`);
        art.style.setProperty('--heavy-lunge-y', `${deltaY / distance * lungeDistance}px`);
      }
      if (skillId === 'whirlwind') {
        const moveX = destinationX - (artRect.left + artRect.width / 2);
        const moveY = destinationY - (artRect.top + artRect.height / 2);
        art.style.setProperty('--whirlwind-move-x', `${moveX * .62}px`);
        art.style.setProperty('--whirlwind-move-y', `${moveY * .62}px`);
      }
      if (skillId === 'charge') {
        const deltaX = destinationX - (artRect.left + artRect.width / 2);
        const deltaY = destinationY - (artRect.top + artRect.height / 2);
        const distance = Math.max(1, Math.hypot(deltaX, deltaY));
        const stopShort = Math.min(72, targetRect?.width * .55 || 48);
        art.style.setProperty('--charge-move-x', `${deltaX - deltaX / distance * stopShort}px`);
        art.style.setProperty('--charge-move-y', `${deltaY - deltaY / distance * stopShort}px`);
        art.style.setProperty('--charge-pull-x', `${-deltaX / distance * 9}px`);
        art.style.setProperty('--charge-pull-y', `${-deltaY / distance * 9}px`);
        fighter?.style.setProperty('--charge-portrait', art.style.backgroundImage);
      }
      if (skillId === 'power-shot') {
        const deltaX = destinationX - (artRect.left + artRect.width / 2);
        const deltaY = destinationY - (artRect.top + artRect.height / 2);
        const distance = Math.max(1, Math.hypot(deltaX, deltaY));
        art.style.setProperty('--power-shot-pull-x', `${-deltaX / distance * 10}px`);
        art.style.setProperty('--power-shot-pull-y', `${-deltaY / distance * 10}px`);
      }
      if (skillId === 'multi-shot') {
        const deltaX = destinationX - (artRect.left + artRect.width / 2);
        const deltaY = destinationY - (artRect.top + artRect.height / 2);
        const distance = Math.max(1, Math.hypot(deltaX, deltaY));
        art.style.setProperty('--multi-shot-pull-x', `${-deltaX / distance * 8}px`);
        art.style.setProperty('--multi-shot-pull-y', `${-deltaY / distance * 8}px`);
      }
      if (skillId === 'piercing-shot') {
        const deltaX = destinationX - (artRect.left + artRect.width / 2);
        const deltaY = destinationY - (artRect.top + artRect.height / 2);
        const distance = Math.max(1, Math.hypot(deltaX, deltaY));
        art.style.setProperty('--piercing-pull-x', `${-deltaX / distance * 11}px`);
        art.style.setProperty('--piercing-pull-y', `${-deltaY / distance * 11}px`);
      }
      if (skillId === 'backstab') {
        const deltaX = destinationX - (artRect.left + artRect.width / 2);
        const deltaY = destinationY - (artRect.top + artRect.height / 2);
        const side = deltaX >= 0 ? 1 : -1;
        art.style.setProperty('--backstab-x', `${deltaX + side * Math.min(48, (targetRect?.width || 80) * .42)}px`);
        art.style.setProperty('--backstab-y', `${deltaY - artRect.height * .12}px`);
      }
      if (skillId === 'shadow-dance') {
        const points = targetIndexes.slice(0, 5).map((index) => {
          const anchor = targetPositions?.get(index);
          const rect = document.querySelector(`#enemy-${index}`)?.getBoundingClientRect();
          if (!anchor && !rect) return null;
          const targetX = anchor ? fieldRect.left + anchor.x : rect.left + rect.width / 2;
          const targetY = anchor ? fieldRect.top + anchor.y : rect.top + rect.height * .56;
          const targetWidth = anchor?.width || rect?.width || 80;
          const deltaX = targetX - (artRect.left + artRect.width / 2);
          const deltaY = targetY - (artRect.top + artRect.height / 2);
          const side = deltaX >= 0 ? 1 : -1;
          return { x: deltaX + side * Math.min(42, targetWidth * .38), y: deltaY - artRect.height * .1 };
        });
        playShadowTeleportSequence(art, points.filter(Boolean));
      }
      if (skillId === 'blizzard') {
        art.style.setProperty('--blizzard-move-x', `${fieldRect.left + fieldRect.width * .5 - (artRect.left + artRect.width / 2)}px`);
        art.style.setProperty('--blizzard-move-y', `${fieldRect.top + fieldRect.height * .54 - (artRect.top + artRect.height / 2)}px`);
      }
      if (skillId === 'chain-lightning') {
        const deltaX = destinationX - (artRect.left + artRect.width / 2);
        const deltaY = destinationY - (artRect.top + artRect.height / 2);
        const distance = Math.max(1, Math.hypot(deltaX, deltaY));
        const stopShort = Math.min(72, (targetRect?.width || 90) * .58);
        art.style.setProperty('--chain-move-x', `${deltaX - deltaX / distance * stopShort}px`);
        art.style.setProperty('--chain-move-y', `${deltaY - deltaY / distance * stopShort}px`);
      }
      if (skillId === 'holy-light') {
        const deltaX = destinationX - (artRect.left + artRect.width / 2);
        const deltaY = destinationY - (artRect.top + artRect.height / 2);
        const distance = Math.max(1, Math.hypot(deltaX, deltaY));
        const stopShort = Math.min(68, (targetRect?.width || 86) * .55);
        art.style.setProperty('--holy-light-x', `${deltaX - deltaX / distance * stopShort}px`);
        art.style.setProperty('--holy-light-y', `${deltaY - deltaY / distance * stopShort}px`);
      }
      if (skillId === 'holy-nova') {
        art.style.setProperty('--holy-nova-x', `${fieldRect.left + fieldRect.width * .5 - (artRect.left + artRect.width / 2)}px`);
        art.style.setProperty('--holy-nova-y', `${fieldRect.top + fieldRect.height * .54 - (artRect.top + artRect.height / 2)}px`);
      }
    }
    fighter?.classList.add(actionClass);
    art.classList.add(actionClass);
    if (kind === 'skill' && !area && (targetRect || targetAnchor) && skillId !== 'shadow-dance') {
      fighter?.classList.add('is-single-target-skill');
      art.classList.add('is-single-target-skill');
    }
    art.combatAnimationTimer = setTimeout(() => {
      if (art.combatAnimationSequence !== animationSequence) return;
      fighter?.classList.remove(actionClass);
      art.classList.remove(actionClass);
      fighter?.classList.remove('is-single-target-skill');
      art.classList.remove('is-single-target-skill');
      art.style.removeProperty('--skill-move-x');
      art.style.removeProperty('--skill-move-y');
      art.style.removeProperty('--heavy-lunge-x');
      art.style.removeProperty('--heavy-lunge-y');
      art.style.removeProperty('--whirlwind-move-x');
      art.style.removeProperty('--whirlwind-move-y');
      art.style.removeProperty('--charge-move-x');
      art.style.removeProperty('--charge-move-y');
      art.style.removeProperty('--charge-pull-x');
      art.style.removeProperty('--charge-pull-y');
      art.style.removeProperty('--power-shot-pull-x');
      art.style.removeProperty('--power-shot-pull-y');
      art.style.removeProperty('--multi-shot-pull-x');
      art.style.removeProperty('--multi-shot-pull-y');
      art.style.removeProperty('--piercing-pull-x');
      art.style.removeProperty('--piercing-pull-y');
      art.style.removeProperty('--backstab-x');
      art.style.removeProperty('--backstab-y');
      art.style.removeProperty('--blizzard-move-x');
      art.style.removeProperty('--blizzard-move-y');
      art.style.removeProperty('--chain-move-x');
      art.style.removeProperty('--chain-move-y');
      art.style.removeProperty('--holy-light-x');
      art.style.removeProperty('--holy-light-y');
      art.style.removeProperty('--holy-nova-x');
      art.style.removeProperty('--holy-nova-y');
      if (skillId === 'shadow-dance') {
        art.shadowTeleportAnimation?.cancel();
        art.shadowTeleportAnimation = null;
      }
      art.combatAnimationLockUntil = 0;
      art.combatAnimationTimer = null;
      setBattleCharacterAction(art, member.character, 'idle');
    }, animationDuration);
  });
}

const battleSkillEffectPresets = Object.freeze({
  'heavy-strike': { duration: 680, impactAt: 350, className: 'battle-effect-heavy-strike' },
  whirlwind: { duration: 1000, impactAt: 350, className: 'battle-effect-whirlwind' },
  charge: { duration: 780, impactAt: 400, className: 'battle-effect-charge' },
  'power-shot': { duration: 760, impactAt: 400, className: 'battle-effect-power-shot' },
  'multi-shot': { duration: 880, impactAt: 450, className: 'battle-effect-multi-shot' },
  'piercing-shot': { duration: 960, impactAt: 400, className: 'battle-effect-piercing-shot' },
  backstab: { duration: 680, impactAt: 350, className: 'battle-effect-backstab' },
  'shadow-dance': { duration: 980, impactAt: 180, className: 'battle-effect-shadow-dance' },
  fireball: { duration: 680, impactAt: 320, className: 'battle-effect-fireball' },
  blizzard: { duration: 1100, impactAt: 350, className: 'battle-effect-blizzard' },
  'chain-lightning': { duration: 880, impactAt: 230, className: 'battle-effect-chain-lightning' },
  'holy-light': { duration: 680, impactAt: 300, className: 'battle-effect-holy-light' },
  'holy-nova': { duration: 980, impactAt: 300, className: 'battle-effect-holy-nova' },
  heal: { duration: 900, impactAt: 300, className: 'battle-effect-heal' }
});

function captureBattleTargetAnchor(index) {
  const target = document.querySelector(`#enemy-${index}`);
  const field = document.querySelector('.battle-field');
  if (!target || !field) return null;
  const targetRect = target.getBoundingClientRect();
  const fieldRect = field.getBoundingClientRect();
  return { index, x: targetRect.left - fieldRect.left + targetRect.width / 2, y: targetRect.top - fieldRect.top + targetRect.height * .62, width: targetRect.width };
}

function captureBattleAttackerAnchor(member) {
  const field = document.querySelector('.battle-field');
  const art = member?.isMain ? document.querySelector('#battle-player-art') : document.querySelector(`[data-member-id="${member?.id}"] .player-stage-art`);
  if (!field || !art) return null;
  const fieldRect = field.getBoundingClientRect();
  const artRect = art.getBoundingClientRect();
  return { x: artRect.left - fieldRect.left + artRect.width / 2, y: artRect.top - fieldRect.top + artRect.height / 2 };
}

function captureBattleAllyAnchor(member) {
  const field = document.querySelector('.battle-field');
  const selector = member?.isMain ? '#battle-player-art' : `[data-member-id="${member?.id}"] .player-stage-art`;
  const art = document.querySelector(selector);
  if (!field || !art) return null;
  const fieldRect = field.getBoundingClientRect();
  const artRect = art.getBoundingClientRect();
  return { index: member.id, selector, x: artRect.left - fieldRect.left + artRect.width / 2, y: artRect.top - fieldRect.top + artRect.height / 2, width: artRect.width };
}

function animatePiercingProjectile(effect, origin, targets) {
  const arrow = effect.querySelector('.piercing-shot-arrow');
  if (!arrow || !targets.length) return;
  const points = [origin, ...targets.map((target) => target.anchor)];
  const previous = points[points.length - 2] || origin;
  const last = points[points.length - 1];
  const dx = last.x - previous.x;
  const dy = last.y - previous.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  points.push({ x: last.x + dx / length * 150, y: last.y + dy / length * 150 });
  const segments = points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y));
  const total = segments.reduce((sum, value) => sum + value, 0) || 1;
  let traveled = 0;
  const keyframes = points.map((point, index) => {
    if (index) traveled += segments[index - 1];
    const next = points[Math.min(points.length - 1, index + 1)];
    return { transform: `translate(${point.x - origin.x}px,${point.y - origin.y}px) rotate(${Math.atan2(next.y - point.y, next.x - point.x)}rad)`, opacity: index === points.length - 1 ? 0 : 1, offset: traveled / total };
  });
  arrow.animate(keyframes, { duration: 650, delay: 250, easing: 'linear', fill: 'forwards' });
}

function playBattleSkillEffect(skillId, targetAnchor, options = {}) {
  const preset = battleSkillEffectPresets[skillId];
  const field = document.querySelector('.battle-field');
  if (!preset || !field || !targetAnchor) return;
  let layer = field.querySelector('.battle-skill-effect-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'battle-skill-effect-layer';
    layer.setAttribute('aria-hidden', 'true');
    field.append(layer);
  }
  const effect = document.createElement('div');
  effect.className = `battle-skill-effect ${preset.className}`;
  effect.dataset.targetIndex = String(targetAnchor.index);
  effect.style.setProperty('--effect-x', `${targetAnchor.x}px`);
  effect.style.setProperty('--effect-y', `${targetAnchor.y}px`);
  effect.style.setProperty('--target-width', `${targetAnchor.width}px`);
  if (options.radius) effect.style.setProperty('--effect-radius', `${options.radius}px`);
  effect.innerHTML = skillId === 'whirlwind'
    ? `<span class="whirlwind-speed-trails"><i></i><i></i></span><span class="whirlwind-ring"></span><span class="whirlwind-afterimages"><i></i><i></i><i></i></span><span class="whirlwind-finisher"></span>${(options.targets || []).map((target, order) => `<span class="whirlwind-target-hit" data-effect-target="${target.index}" style="--hit-order:${order};--hit-x:${(target.anchor?.x || targetAnchor.x) - targetAnchor.x}px;--hit-y:${(target.anchor?.y || targetAnchor.y) - targetAnchor.y}px"><i></i><b>-${target.damage}</b></span>`).join('')}`
    : skillId === 'charge'
      ? `<span class="charge-airflow"><i></i><i></i><i></i></span><span class="charge-cone"></span><span class="charge-sparks"></span>${options.damage > 0 ? `<b class="charge-impact-damage">-${options.damage}</b>` : ''}`
    : skillId === 'power-shot'
      ? `<span class="power-shot-charge"></span><span class="power-shot-arrow" style="--arrow-start-x:${(options.origin?.x || targetAnchor.x) - targetAnchor.x}px;--arrow-start-y:${(options.origin?.y || targetAnchor.y) - targetAnchor.y}px"><i></i></span><span class="power-shot-burst"></span><span class="power-shot-sparks"></span>${options.damage > 0 ? `<b class="power-shot-damage">-${options.damage}</b>` : ''}`
    : skillId === 'multi-shot'
      ? `<span class="multi-shot-charge"></span>${(options.targets || []).map((target, order) => `<span class="multi-shot-projectile" data-effect-target="${target.index}" style="--hit-order:${order};--hit-x:${target.anchor.x - targetAnchor.x}px;--hit-y:${target.anchor.y - targetAnchor.y}px"><i></i><em></em>${target.damage > 0 ? `<b>-${target.damage}</b>` : ''}</span>`).join('')}`
    : skillId === 'piercing-shot'
      ? `<span class="piercing-shot-charge"><i></i><i></i><i></i></span><span class="piercing-shot-arrow"><i></i></span>${(options.targets || []).map((target, order) => `<span class="piercing-shot-hit" data-effect-target="${target.index}" style="--hit-order:${order};--hit-x:${target.anchor.x - targetAnchor.x}px;--hit-y:${target.anchor.y - targetAnchor.y}px"><i></i><em>◫</em>${target.damage > 0 ? `<b>-${target.damage}</b>` : ''}</span>`).join('')}`
    : skillId === 'backstab'
      ? `<span class="backstab-shadow"></span><span class="backstab-slash"></span><span class="backstab-sparks"></span>${options.damage > 0 ? `<b class="backstab-damage">-${options.damage}</b>` : ''}`
    : skillId === 'shadow-dance'
      ? `<span class="shadow-dance-origin"></span>${(options.targets || []).map((target, order, targets) => {
        const previous = order ? targets[order - 1].anchor : targetAnchor;
        const trailX = target.anchor.x - previous.x;
        const trailY = target.anchor.y - previous.y;
        return `<span class="shadow-dance-hit${order === targets.length - 1 ? ' is-finisher' : ''}${targets.length === 1 ? ' is-solo' : ''}" data-effect-target="${target.index}" style="--hit-order:${order};--hit-count:${targets.length};--slash-angle:${order % 2 ? 38 : -38}deg;--trail-length:${Math.min(150, Math.max(28, Math.hypot(trailX, trailY)))}px;--trail-angle:${Math.atan2(trailY, trailX)}rad;--hit-x:${target.anchor.x - targetAnchor.x}px;--hit-y:${target.anchor.y - targetAnchor.y}px"><i></i><em></em><strong></strong>${target.damage > 0 ? `<b>-${target.damage}</b>` : ''}</span>`;
      }).join('')}`
    : skillId === 'fireball'
      ? `<span class="fireball-core"></span><span class="fireball-burst"></span><span class="fireball-sparks"><i></i><i></i><i></i><i></i></span>${options.damage > 0 ? `<b class="fireball-damage">-${options.damage}</b>` : ''}`
    : skillId === 'blizzard'
      ? `<span class="blizzard-cast-aura"><i></i><i></i><i></i></span>${(options.targets || []).map((target) => `<span class="blizzard-target" data-effect-target="${target.index}" style="--hit-size:${target.anchor.width}px;--hit-x:${target.anchor.x - targetAnchor.x}px;--hit-y:${target.anchor.y - targetAnchor.y}px"><i></i><i></i><i></i><em></em><strong></strong>${target.damage > 0 ? `<b>-${target.damage}</b>` : ''}</span>`).join('')}`
    : skillId === 'chain-lightning'
      ? (options.targets || []).map((target, order, targets) => {
        const previous = order ? targets[order - 1].anchor : targetAnchor;
        const dx = target.anchor.x - previous.x;
        const dy = target.anchor.y - previous.y;
        return `<span class="chain-lightning-link" data-link-target="${target.index}" data-link-from="${order ? targets[order - 1].index : -1}" style="--link-order:${order};--link-x:${previous.x - targetAnchor.x}px;--link-y:${previous.y - targetAnchor.y}px;--link-length:${Math.hypot(dx, dy)}px;--link-angle:${Math.atan2(dy, dx)}rad"></span><span class="chain-lightning-hit" data-effect-target="${target.index}" style="--hit-order:${order};--hit-size:${target.anchor.width}px;--hit-x:${target.anchor.x - targetAnchor.x}px;--hit-y:${target.anchor.y - targetAnchor.y}px"><i></i><em></em>${target.damage > 0 ? `<b>-${target.damage}</b>` : ''}</span>`;
      }).join('')
    : skillId === 'holy-light'
      ? `<span class="holy-light-mark">✦</span><span class="holy-light-beam"></span><span class="holy-light-flash"></span><span class="holy-light-ring"></span><span class="holy-light-particles"><i></i><i></i><i></i><i></i></span>${options.damage > 0 ? `<b class="holy-light-damage">-${options.damage}</b>` : ''}`
    : skillId === 'holy-nova'
      ? `<span class="holy-nova-gather"><i></i><i></i><i></i></span><span class="holy-nova-ring"></span>${(options.targets || []).map((target) => `<span class="holy-nova-hit" data-effect-target="${target.index}" style="--hit-delay:${target.delay}ms;--hit-size:${target.anchor.width}px;--hit-x:${target.anchor.x - targetAnchor.x}px;--hit-y:${target.anchor.y - targetAnchor.y}px"><i></i><em></em>${target.damage > 0 ? `<b>-${target.damage}</b>` : ''}</span>`).join('')}`
    : skillId === 'heal'
      ? `<span class="heal-aura"></span><span class="heal-soft-glow"></span><span class="heal-particles"><i>+</i><i>✦</i><i></i><i>+</i></span>${options.heal > 0 ? `<b class="heal-number">+${options.heal} HP</b>` : ''}`
    : `<span class="smash-trail"></span><span class="impact-shockwave"></span><span class="impact-crack"></span><span class="impact-sparks"></span><span class="impact-debris">${Array.from({ length: 6 }, (_, index) => `<i style="--debris-index:${index}"></i>`).join('')}</span>${options.damage > 0 ? `<b class="skill-impact-damage">-${options.damage}</b>` : ''}`;
  layer.append(effect);
  if (skillId === 'piercing-shot') animatePiercingProjectile(effect, targetAnchor, options.targets || []);
  const startedAt = performance.now();
  const followTarget = () => {
    if (!effect.isConnected || performance.now() - startedAt >= preset.duration) return;
    const currentTarget = document.querySelector(targetAnchor.selector || `#enemy-${targetAnchor.index}`);
    let currentEffectX = targetAnchor.x;
    let currentEffectY = targetAnchor.y;
    if (currentTarget) {
      const targetRect = currentTarget.getBoundingClientRect();
      const fieldRect = field.getBoundingClientRect();
      currentEffectX = targetRect.left - fieldRect.left + targetRect.width / 2;
      currentEffectY = targetRect.top - fieldRect.top + targetRect.height * .62;
      effect.style.setProperty('--effect-x', `${currentEffectX}px`);
      effect.style.setProperty('--effect-y', `${currentEffectY}px`);
      effect.style.setProperty('--target-width', `${targetRect.width}px`);
    }
    effect.querySelectorAll('[data-effect-target]').forEach((hit) => {
      const hitTarget = document.querySelector(`#enemy-${hit.dataset.effectTarget}`);
      if (!hitTarget) return;
      const hitRect = hitTarget.getBoundingClientRect();
      const fieldRect = field.getBoundingClientRect();
      hit.style.setProperty('--hit-x', `${hitRect.left - fieldRect.left + hitRect.width / 2 - currentEffectX}px`);
      hit.style.setProperty('--hit-y', `${hitRect.top - fieldRect.top + hitRect.height * .55 - currentEffectY}px`);
    });
    effect.querySelectorAll('[data-link-target]').forEach((link) => {
      const toTarget = document.querySelector(`#enemy-${link.dataset.linkTarget}`);
      const fromTarget = Number(link.dataset.linkFrom) >= 0 ? document.querySelector(`#enemy-${link.dataset.linkFrom}`) : null;
      if (!toTarget) return;
      const fieldRect = field.getBoundingClientRect();
      const toRect = toTarget.getBoundingClientRect();
      const fromRect = fromTarget?.getBoundingClientRect();
      const fromX = fromRect ? fromRect.left - fieldRect.left + fromRect.width / 2 : targetAnchor.x;
      const fromY = fromRect ? fromRect.top - fieldRect.top + fromRect.height * .55 : targetAnchor.y;
      const toX = toRect.left - fieldRect.left + toRect.width / 2;
      const toY = toRect.top - fieldRect.top + toRect.height * .55;
      link.style.setProperty('--link-x', `${fromX - targetAnchor.x}px`);
      link.style.setProperty('--link-y', `${fromY - targetAnchor.y}px`);
      link.style.setProperty('--link-length', `${Math.hypot(toX - fromX, toY - fromY)}px`);
      link.style.setProperty('--link-angle', `${Math.atan2(toY - fromY, toX - fromX)}rad`);
    });
    requestAnimationFrame(followTarget);
  };
  requestAnimationFrame(followTarget);
  if (skillId === 'heavy-strike') setTimeout(() => {
    const target = document.querySelector(`#enemy-${targetAnchor.index}`);
    target?.classList.add('heavy-strike-hit');
    setTimeout(() => target?.classList.remove('heavy-strike-hit'), 220);
  }, preset.impactAt);
  if (skillId === 'charge') setTimeout(() => {
    const target = document.querySelector(`#enemy-${targetAnchor.index}`);
    target?.classList.add('charge-hit');
    field.classList.add('charge-impact');
    setTimeout(() => { target?.classList.remove('charge-hit'); field.classList.remove('charge-impact'); }, 170);
  }, preset.impactAt);
  if (skillId === 'power-shot') setTimeout(() => {
    const target = document.querySelector(`#enemy-${targetAnchor.index}`);
    target?.classList.add('power-shot-hit');
    setTimeout(() => target?.classList.remove('power-shot-hit'), 170);
  }, preset.impactAt);
  if (skillId === 'fireball') setTimeout(() => {
    const target = document.querySelector(`#enemy-${targetAnchor.index}`);
    target?.classList.add('fireball-hit');
    setTimeout(() => target?.classList.remove('fireball-hit'), 170);
  }, preset.impactAt);
  if (skillId === 'blizzard') setTimeout(() => {
    (options.targets || []).forEach((visualTarget) => {
      const target = document.querySelector(`#enemy-${visualTarget.index}`);
      target?.classList.add('blizzard-hit');
      setTimeout(() => target?.classList.remove('blizzard-hit'), 180);
    });
  }, preset.impactAt);
  if (skillId === 'chain-lightning') (options.targets || []).forEach((visualTarget, order) => {
    setTimeout(() => {
      const target = document.querySelector(`#enemy-${visualTarget.index}`);
      target?.classList.add('chain-lightning-hit');
      setTimeout(() => target?.classList.remove('chain-lightning-hit'), 150);
    }, preset.impactAt + order * 100);
  });
  if (skillId === 'holy-light') setTimeout(() => {
    const target = document.querySelector(`#enemy-${targetAnchor.index}`);
    target?.classList.add('holy-light-hit');
    setTimeout(() => target?.classList.remove('holy-light-hit'), 170);
  }, preset.impactAt);
  if (skillId === 'holy-nova') (options.targets || []).forEach((visualTarget) => {
    setTimeout(() => {
      const target = document.querySelector(`#enemy-${visualTarget.index}`);
      target?.classList.add('holy-nova-hit');
      setTimeout(() => target?.classList.remove('holy-nova-hit'), 160);
    }, visualTarget.delay);
  });
  if (skillId === 'shadow-dance') (options.targets || []).forEach((visualTarget, order, visualTargets) => {
    const delay = preset.impactAt + order * (visualTargets.length > 1 ? 85 : 0);
    setTimeout(() => {
      const target = document.querySelector(`#enemy-${visualTarget.index}`);
      target?.classList.add('shadow-dance-hit');
      setTimeout(() => target?.classList.remove('shadow-dance-hit'), 130);
    }, delay);
  });
  setTimeout(() => {
    effect.remove();
    if (!layer.childElementCount) layer.remove();
  }, preset.duration);
}

function playCompanionAttackAnimation(targetIndexes = []) {
  const companionIcon = document.querySelector('#battle-companion-icons .battle-companion-icon');
  if (!companionIcon) return;
  companionIcon.classList.remove('attacking');
  void companionIcon.offsetWidth;
  companionIcon.classList.add('attacking');
  setTimeout(() => companionIcon.classList.remove('attacking'), 520);
}

function showEnemyDamage(indexes, damage, type = 'normal') {
  if (type === 'normal') battle.targetIndexes = indexes;
  indexes.forEach((index) => {
    const event = { id: `${Date.now()}-${Math.random()}`, damage, type };
    battle.enemyDamages[index] = [...(battle.enemyDamages[index] || []), event];
    setTimeout(() => {
      battle.enemyDamages[index] = (battle.enemyDamages[index] || []).filter((entry) => entry.id !== event.id);
      if (type === 'normal') battle.targetIndexes = battle.targetIndexes.filter((target) => target !== index);
      if (fighting) updateBattleUI();
    }, 650);
  });
}

function applyDot(index, type, damage, duration, maxStacks = 1, options = {}) {
  if (battle.enemyHps[index] <= 0) return;
  const dots = battle.enemyDots[index] || [];
  const sameType = dots.filter((dot) => dot.type === type);
  const existing = sameType.length >= maxStacks ? sameType.sort((a, b) => a.remaining - b.remaining)[0] : null;
  if (existing) {
    existing.damage = Math.max(existing.damage, damage);
    existing.remaining = Math.max(existing.remaining, duration);
    existing.defenseReduction = Math.max(existing.defenseReduction || 0, options.defenseReduction || 0);
    return;
  }
  dots.push({ type, damage, remaining: duration, source: options.source || null, defenseReduction: options.defenseReduction || 0 });
  battle.enemyDots[index] = dots;
}

function processEnemyDots() {
  battle.enemyDots.forEach((dots, index) => {
    if (battle.enemyHps[index] <= 0 || !dots.length) return;
    let damage = 0;
    dots.forEach((dot) => {
      damage += dot.damage;
      dot.remaining -= 1;
    });
    battle.enemyDots[index] = dots.filter((dot) => dot.remaining > 0);
    if (damage <= 0) return;
    const source = dots.find((dot) => dot.source)?.source || null;
    const sourceMastery = source?.job === 'mage' && source.level >= 15
      ? ClassSkillPolicy.getEffect('mage', 'elemental-mastery', Number(source.progress.skillLevels?.['mage:elemental-mastery']) || 1)
      : null;
    applyDamageToMonster(index, damage * (sourceMastery?.resonance && dots.some((dot) => dot.type === 'burn') ? 1.2 : 1), { damageType: 'periodic', attackRange: 'none' }, {
      attacker: source,
      canEvade: false,
      canParry: false,
      logDefense: false,
      effectType: 'dot'
    });
  });
}

function getKnownSkills(job, level) { return skillProgression[job] || []; }

function getMaxMana(job, level) {
  return getCharacterStats(level, getProgress(), { ...(getActiveCharacter() || {}), job }).mana;
}

function getMaxCombatResource(job, level) {
  if (WarriorResourcePolicy.isWarrior(job)) return WarriorResourcePolicy.MAX_RAGE;
  if (AssassinEnergyPolicy.isAssassin(job)) return AssassinEnergyPolicy.MAX_ENERGY;
  if (HunterArrowPolicy.isHunter(job)) return HunterArrowPolicy.getMaxArrows(getProgress().equipment);
  return getMaxMana(job, level);
}

function getMaxCombatResourceForMember(character, progress) {
  if (WarriorResourcePolicy.isWarrior(character.job)) return WarriorResourcePolicy.MAX_RAGE;
  if (AssassinEnergyPolicy.isAssassin(character.job)) return AssassinEnergyPolicy.MAX_ENERGY;
  if (HunterArrowPolicy.isHunter(character.job)) return HunterArrowPolicy.getMaxArrows(progress.equipment);
  return getCharacterStats(progress.level || 1, progress, character).mana;
}

function createBattlePartyMember(slot, slotIndex, mainId, now = Date.now()) {
  if (!slot?.character) return null;
  PartyPolicy.ensureCharacterId(slot.character, slotIndex);
  const character = { ...slot.character };
  const progress = {
    level: 1,
    equipment: emptyEquipment(),
    collection: {},
    skillLevels: {},
    ...slot.progress,
    equipment: { ...emptyEquipment(), ...(slot.progress?.equipment || {}) },
    skillLevels: ClassSkillPolicy.normalizeSkillLevels(slot.progress?.skillLevels)
  };
  const stats = getCharacterStats(progress.level, progress, character);
  const maxResource = getMaxCombatResourceForMember(character, progress);
  const savedState = progress.partyMemberState && typeof progress.partyMemberState === 'object' ? progress.partyMemberState : {};
  const initialResource = WarriorResourcePolicy.isWarrior(character.job)
    ? 0
    : AssassinEnergyPolicy.isAssassin(character.job)
      ? AssassinEnergyPolicy.clampEnergy(savedState.resource?.current ?? progress.energy)
      : maxResource;
  return {
    id: character.id,
    slotIndex,
    isMain: character.id === mainId,
    character,
    progress,
    name: character.name,
    race: character.race,
    job: character.job,
    level: progress.level,
    currentHp: Math.max(1, Math.min(stats.hp, Number(savedState.currentHp) || stats.hp)),
    maxHp: stats.hp,
    resourceType: PartyPolicy.getResourceType(character.job),
    resourceCurrent: Math.max(0, Math.min(maxResource, Number(savedState.resource?.current ?? initialResource) || 0)),
    resourceMax: maxResource,
    attack: stats.attack,
    defense: stats.defense,
    attackSpeed: stats.attackSpeed,
    stats,
    equipment: progress.equipment,
    alive: true,
    nextAttackAt: now,
    targetIndex: -1,
    globalSkillReadyAt: 0,
    skillCooldowns: {},
    manaExhausted: false,
    shield: 0,
    stunnedUntil: 0,
    bleed: null,
    blackstoneMarkedUntil: 0,
    blackstoneArmorBreakUntil: 0,
    spiderNestArmorBreakUntil: 0,
    blackstoneAttackSpeedPenaltyUntil: 0,
    blackstoneAttackSpeedPenalty: 0,
    reviveAt: null,
    undeadRevived: false,
    hunterAttackCount: 0,
    lastManaRegenAt: now,
    lastHpRegenerationAt: now,
    lastResourceUpdatedAt: now,
    lastArrowRecoveryAt: now
  };
}

function buildBattlePartyMembers(now = Date.now()) {
  const progress = getProgress();
  const party = normalizeCurrentParty(progress);
  const slots = getCharacterSlots();
  const mainId = party.activeMemberIds[0];
  return party.activeMemberIds.map((memberId) => {
    const slotIndex = slots.findIndex((slot) => slot?.character?.id === memberId);
    if (slotIndex < 0) return null;
    const slot = memberId === mainId
      ? { character: getActiveCharacter(), progress }
      : slots[slotIndex];
    return createBattlePartyMember(slot, slotIndex, mainId, now);
  }).filter(Boolean);
}

function getMainBattleMember() {
  return battle.partyMembers?.find((member) => member.isMain) || battle.partyMembers?.[0] || null;
}

function syncLegacyBattleStateFromMain() {
  const main = getMainBattleMember();
  if (!main) return;
  battle.playerHp = main.currentHp;
  battle.playerMana = main.resourceCurrent;
  battle.playerArrows = main.resourceType === 'arrows' ? main.resourceCurrent : 0;
  battle.playerShield = main.shield;
  battle.playerStunnedUntil = main.stunnedUntil;
  battle.playerBleed = main.bleed;
  battle.manaExhausted = main.manaExhausted;
  battle.globalSkillReadyAt = main.globalSkillReadyAt;
  battle.skillCooldowns = main.skillCooldowns;
  battle.undeadRevived = main.undeadRevived;
}

function syncMainBattleMemberFromLegacy() {
  const main = getMainBattleMember();
  if (!main) return;
  main.currentHp = battle.playerHp;
  main.resourceCurrent = main.resourceType === 'arrows' ? battle.playerArrows : battle.playerMana;
  main.shield = battle.playerShield;
  main.stunnedUntil = battle.playerStunnedUntil;
  main.bleed = battle.playerBleed;
  main.manaExhausted = battle.manaExhausted;
  main.globalSkillReadyAt = battle.globalSkillReadyAt;
  main.skillCooldowns = battle.skillCooldowns;
  main.undeadRevived = battle.undeadRevived;
  main.alive = main.currentHp > 0;
}

function syncMainBattleMemberProgression(character, progress) {
  const main = getMainBattleMember();
  if (!main || !character || !progress) return;
  const stats = getCharacterStats(progress.level, progress, character);
  const maxResource = getMaxCombatResourceForMember(character, progress);
  main.level = progress.level;
  main.progress.level = progress.level;
  main.stats = stats;
  main.attack = stats.attack;
  main.defense = stats.defense;
  main.attackSpeed = stats.attackSpeed;
  main.maxHp = stats.hp;
  main.currentHp = Math.min(main.currentHp, main.maxHp);
  main.resourceMax = maxResource;
  main.resourceCurrent = Math.min(main.resourceCurrent, main.resourceMax);
  syncLegacyBattleStateFromMain();
}

function persistPartyRuntimeState() {
  if (!battle.partyMembers?.length) return;
  const slots = getCharacterSlots();
  const activeIndex = getActiveCharacterSlotIndex();
  const mainProgress = getProgress();
  battle.partyMembers.forEach((member) => {
    const state = {
      currentHp: Math.max(0, member.currentHp),
      maxHp: member.maxHp,
      resource: { type: member.resourceType, current: Math.max(0, member.resourceCurrent), max: member.resourceMax },
      attack: member.attack,
      defense: member.defense,
      attackSpeed: member.attackSpeed
    };
    member.progress.partyMemberState = state;
    if (member.slotIndex === activeIndex) mainProgress.partyMemberState = state;
    if (slots[member.slotIndex]) slots[member.slotIndex].progress = { ...slots[member.slotIndex].progress, partyMemberState: state };
  });
  localStorage.setItem('stardust-character-slots', JSON.stringify(slots));
  saveProgress(mainProgress);
}

function rebuildBattlePartyMembers() {
  if (!fighting) return;
  persistPartyRuntimeState();
  battle.partyMembers = buildBattlePartyMembers(Date.now());
  logPartyDebug('戰鬥隊伍同步', { members: battle.partyMembers.map((member) => `${member.id}:${member.name}`).join(',') });
  syncLegacyBattleStateFromMain();
  updateBattleUI();
}

function getCombatResourceUnit(job) {
  if (WarriorResourcePolicy.isWarrior(job)) return '怒氣';
  if (AssassinEnergyPolicy.isAssassin(job)) return '能量';
  if (HunterArrowPolicy.isHunter(job)) return '支箭矢';
  return 'MP';
}

function getSkillManaCost(skill) {
  if (skill.id === 'heal') return 28;
  if (skill.targets && skill.targets > 1) return 26;
  if (skill.id === 'companion') return 24;
  return 18;
}

function getSkillResourceCost(job, skill) {
  if (HunterArrowPolicy.isHunter(job)) {
    return HunterArrowPolicy.getSkillCost(skill.id) ?? 0;
  }
  if (AssassinEnergyPolicy.isAssassin(job)) {
    return AssassinEnergyPolicy.getSkillCost(skill.id) ?? getSkillManaCost(skill);
  }
  return getSkillManaCost(skill);
}

function usesManaResource(job) {
  return !WarriorResourcePolicy.isWarrior(job)
    && !AssassinEnergyPolicy.isAssassin(job)
    && !HunterArrowPolicy.isHunter(job);
}

function formatCombatResourceStatus(character, progress, maximum) {
  if (WarriorResourcePolicy.isWarrior(character.job)) {
    return `怒氣 ${Math.floor(battle.playerMana)} / ${maximum}`;
  }
  if (AssassinEnergyPolicy.isAssassin(character.job)) {
    return `能量 ${Math.floor(battle.playerMana)} / ${maximum}・恢復 ${AssassinEnergyPolicy.ENERGY_REGEN_PER_SECOND}／秒`;
  }
  if (HunterArrowPolicy.isHunter(character.job)) {
    return `箭矢 ${battle.playerArrows} / ${maximum}・每 ${HunterArrowPolicy.getRecoveryInterval(progress.equipment) / 1000} 秒恢復 1 支`;
  }
  return battle.manaExhausted
    ? `魔力枯竭中・恢復至 ${Math.ceil(maximum * .45)} MP`
    : `魔力 ${Math.ceil(battle.playerMana)} / ${maximum} MP`;
}

function persistAssassinEnergy(progress, now = Date.now()) {
  progress.energy = AssassinEnergyPolicy.clampEnergy(battle.playerMana);
  progress.maxEnergy = AssassinEnergyPolicy.MAX_ENERGY;
  progress.energyUpdatedAt = now;
  saveProgress(progress);
}

function updateManaExhaustion(maxMana) {
  const ratio = maxMana > 0 ? battle.playerMana / maxMana : 0;
  if (!battle.manaExhausted && ratio <= .15) {
    battle.manaExhausted = true;
    logBattle('◇ 魔力枯竭：停止施放技能，普通攻擊速度降低 20%。', 'system');
  } else if (battle.manaExhausted && ratio >= .45) {
    battle.manaExhausted = false;
    logBattle('◆ 魔力恢復至 45%，重新開始自動施放技能。', 'system');
  }
}

function renderSkills(character, level) {
  const skillList = document.querySelector('#skill-list');
  const progress = getProgress();
  const skills = skillProgression[character.job] || [];
  const activeSkills = skills.filter((skill) => skill.type === 'active');
  const passiveSkills = skills.filter((skill) => skill.type === 'passive');
  const orderedSkills = [...activeSkills, ...passiveSkills];
  const maxMana = getMaxCombatResource(character.job, level);
  const raceInfo = Object.values(factions).flat().find((race) => race.id === character.race);
  const raceTalent = raceTalents[character.race] || raceTalents.human;
  const renderSkill = (skill) => {
    const unlocked = level >= skill.level;
    const upgradeLevel = getSkillUpgradeLevel(progress, character.job, skill);
    const icon = skill.type === 'active' ? (skillIcons[skill.id] || '✦') : '◆';
    if (!unlocked) return `<div class="skill-chip ${skill.type} locked"><span class="skill-lock">🔒 Lv${skill.level} 解鎖</span></div>`;
    const cooldownText = skill.type === 'active' ? `${Math.round(skill.cooldown * skillCooldownMultiplier)}秒` : '常駐';
    return `<button class="skill-chip ${skill.type} compact-skill" type="button" data-skill-key="${getSkillKey(character.job, skill)}"><span class="skill-icon">${icon}</span><b>${skill.name}</b><small>技能 Lv${upgradeLevel}</small><em class="skill-cooldown">${cooldownText}</em></button>`;
  };
  skillList.innerHTML = `<section class="skill-group active-group"><h3>主動技能</h3><div class="skill-row">${activeSkills.map((skill) => renderSkill(skill)).join('')}</div></section><section class="skill-group passive-group"><h3>被動技能</h3><div class="skill-row">${passiveSkills.map((skill) => renderSkill(skill)).join('')}</div></section><section class="race-talent-group"><h3>種族天賦</h3><article class="race-talent-card race-talent-${character.race}"><span>${raceTalent.icon}</span><div><b>${raceInfo?.name || character.race}・${raceTalent.name}</b><small>${raceTalent.detail}</small></div><em>永久生效</em></article></section>`;
  skillList.dataset.level = String(level);
  skillList.dataset.job = character.job;
  skillList.dataset.race = character.race;
  document.querySelectorAll('#skill-list .skill-chip').forEach((chip, index) => { chip.id = `skill-${index}`; });
  document.querySelectorAll('#layout-skill-select option').forEach((option, index) => {
    option.textContent = orderedSkills[index] ? `單一技能：${orderedSkills[index].name}` : `單一技能：技能 ${index + 1}`;
  });
  const resourceStatus = document.querySelector('#skill-resource-status');
  if (resourceStatus) resourceStatus.textContent = formatCombatResourceStatus(character, progress, maxMana);
}

function refreshSkills(character, level) {
  const skillList = document.querySelector('#skill-list');
  const progress = getProgress();
  if (skillList.dataset.level !== String(level) || skillList.dataset.job !== character.job || skillList.dataset.race !== character.race || !skillList.querySelector('.skill-chip')) {
    renderSkills(character, level);
    return;
  }

  const maxMana = getMaxCombatResource(character.job, level);
  const resourceStatus = document.querySelector('#skill-resource-status');
  if (resourceStatus) resourceStatus.textContent = formatCombatResourceStatus(character, progress, maxMana);
}

function getSkillEffectPercent(skill, upgradeLevel = 1) {
  const effect = ClassSkillPolicy.getEffect(getActiveCharacter()?.job, skill.id, upgradeLevel) || {};
  if (effect.power) return Math.round(effect.power * 100);
  if (effect.healPower) return Math.round(effect.healPower * 100);
  return 0;
}

function getSkillDescription(job, skill) {
  const level = getSkillUpgradeLevel(getProgress(), job, skill);
  const effect = ClassSkillPolicy.getEffect(job, skill.id, level) || {};
  const parts = [];
  if (effect.power) parts.push(`造成 ${Math.round(effect.power * 100)}% 傷害`);
  if (effect.healPower) parts.push(`治療量為魔法攻擊 ${Math.round(effect.healPower * 100)}%`);
  if (effect.targets) parts.push(`最多 ${effect.targets} 個目標`);
  if (effect.stun) parts.push(`曈眩 ${effect.stun} 秒`);
  if (effect.slow) parts.push(`緩速 ${Math.round(effect.slow * 100)}%`);
  if (effect.attackDown) parts.push(`降低攻擊 ${Math.round(effect.attackDown * 100)}%`);
  if (effect.breakthrough) parts.push(`Lv6 突破：${effect.breakthrough}`);
  return parts.join('；') || getPassiveSkillDetail(job, skill) || skill.detail;
}

function closeSkillDetailModal() {
  selectedSkillKey = '';
  document.querySelector('#skill-detail-modal')?.classList.add('hidden');
}

function renderSkillDetailModal() {
  const modal = document.querySelector('#skill-detail-modal');
  const content = document.querySelector('#skill-detail-content');
  const character = getActiveCharacter();
  const progress = getProgress();
  const skill = (skillProgression[character?.job] || []).find((entry) => getSkillKey(character.job, entry) === selectedSkillKey);
  if (!modal || !content || !character || !skill || progress.level < skill.level) {
    closeSkillDetailModal();
    return;
  }

  const upgradeLevel = getSkillUpgradeLevel(progress, character.job, skill);
  const requirement = SkillUpgradePolicy.getUpgradeRequirement(upgradeLevel);
  const upgradeProgress = { ...progress, unlockedChapter: getUnlockedChapter(progress) };
  const validation = SkillUpgradePolicy.canUpgrade(upgradeProgress, upgradeLevel);
  const specialization = upgradeLevel === 5 ? ClassSkillPolicy.canSpecialize(progress.skillLevels, character.job, skill.id) : { ok: true };
  const cooldown = skill.type === 'active' ? Math.round(skill.cooldown * skillCooldownMultiplier) : 0;
  const manaCost = skill.type === 'active' ? getSkillResourceCost(character.job, skill) : 0;
  const currentEffect = getSkillEffectPercent(skill, upgradeLevel);
  const materialStatus = requirement ? requirement.materials.map((material) => `${material.icon} ${material.name} ${SkillUpgradePolicy.getQuantity(progress.inventory, material.id)}/${material.amount}`).join('、') : '';
  const upgradeStatus = !requirement
    ? '<p>目前已達技能最高等級。</p>'
    : !specialization.ok
      ? `<p>已選擇其他${skill.type === 'active' ? '主動' : '被動'}技能突破：${specialization.occupied.name}。</p>`
    : getUnlockedChapter(progress) < requirement.chapter
      ? `<p>需要解鎖第 ${requirement.chapter} 章才能繼續升級。</p>`
      : `<p>${materialStatus}</p><p>金幣 ${progress.gold}/${requirement.gold}・成功率 ${Math.round(requirement.successRate * 100)}%</p>`;

  content.innerHTML = `
    <header><h2 id="skill-detail-title">${skill.name}</h2></header>
    <dl class="skill-detail-stats">
      <div><dt>冷卻時間</dt><dd>${skill.type === 'active' ? `${cooldown}秒` : '常駐'}</dd></div>
      <div><dt>${skill.id === 'heal' ? '恢復' : skill.type === 'active' ? '傷害' : '效果'}</dt><dd>${currentEffect ? `${currentEffect}%` : '專屬效果'}</dd></div>
      <div><dt>消耗</dt><dd>${skill.type === 'active' && manaCost > 0 ? `${manaCost} ${getCombatResourceUnit(character.job)}` : '無'}</dd></div>
    </dl>
    <section class="skill-detail-copy"><h3>技能說明</h3><p>${getSkillDescription(character.job, skill)}</p></section>
    <section class="skill-upgrade-summary"><h3>技能 Lv${upgradeLevel}</h3>${upgradeStatus}<button id="skill-detail-upgrade" type="button" ${validation.ok && specialization.ok ? '' : 'disabled'}>${requirement ? `升級至 Lv${requirement.targetLevel}` : '已達上限'}</button></section>`;
  modal.classList.remove('hidden');
}

function renderBattlePartyStatus() {
  const container = document.querySelector('#battle-party-status');
  if (!container) return;
  const teammates = (battle.partyMembers || []).filter((member) => !member.isMain);
  container.classList.toggle('hidden', teammates.length === 0);
  container.innerHTML = teammates.map(member => {
    const resourceMax = Math.max(1, getMaxCombatResourceForMember(member.character, member.progress));
    const resourcePercent = Math.max(0, Math.min(100, member.resourceCurrent / resourceMax * 100));
    const hpPercent = Math.max(0, Math.min(100, member.currentHp / member.maxHp * 100));
    const jobName = classes.find(job => job.id === member.character.job)?.name || member.character.job;
    const reviveSeconds = member.alive || !Number.isFinite(member.reviveAt) ? 0 : Math.max(0, Math.ceil((member.reviveAt - Date.now()) / 1000));
    const lifeStatus = member.alive
      ? `${Math.max(0, member.currentHp)} / ${member.maxHp}`
      : reviveSeconds > 0 ? `${reviveSeconds} 秒後復活` : '等待治癒藥水';
    return `<article class="battle-party-member${member.alive ? '' : ' is-dead'}">
      <div><strong>${member.name}</strong><small>${jobName} Lv.${member.level}</small></div>
      <span class="party-mini-track hp"><i style="width:${hpPercent}%"></i></span>
      <span class="party-mini-track resource"><i style="width:${resourcePercent}%"></i></span>
      <em>${lifeStatus}</em>
    </article>`;
  }).join('');
  const playerStage = document.querySelector('#player-battle-stage');
  if (playerStage) {
    playerStage.dataset.count = String(teammates.length);
    playerStage.innerHTML = teammates.map((member) => {
      const hpPercent = Math.max(0, Math.min(100, member.currentHp / member.maxHp * 100));
      const resourceMax = Math.max(1, getMaxCombatResourceForMember(member.character, member.progress));
      const resourcePercent = Math.max(0, Math.min(100, member.resourceCurrent / resourceMax * 100));
      const art = battleCharacterActionArt(member.character, 'idle') || battleCharacterArt[`${member.character.race}:${member.character.job}`] || '';
      const jobName = classes.find((job) => job.id === member.character.job)?.name || member.character.job;
      const chargeBuffClass = Date.now() < (member.skillHasteUntil || 0) ? ' has-charge-buff' : '';
      const poisonBlade = getPoisonBladeVisualState(member);
      const poisonBladeClass = poisonBlade.active ? ` has-poison-blade${poisonBlade.activating ? ' is-poison-blade-cast' : ''}` : '';
      const poisonBladeIndicator = poisonBlade.active ? `<span class="poison-blade-aura" aria-hidden="true"><i></i><i></i><i></i></span><span class="poison-blade-indicator" role="img" aria-label="毒刃效果${poisonBlade.stacks > 1 ? `，${poisonBlade.stacks} 層` : ''}"><i>🗡</i>${poisonBlade.stacks > 1 ? `<b>×${poisonBlade.stacks}</b>` : ''}</span>` : '';
      return `<article class="player-stage-unit ${member.alive ? '' : 'is-dead'}${chargeBuffClass}${poisonBladeClass}" data-visual-size="humanoid" data-member-id="${member.id}" data-job="${member.character.job}"><div class="player-stage-floating"><b>${member.name}</b><small>${jobName}・Lv.${member.level}</small><span class="player-stage-hp"><i style="width:${hpPercent}%"></i></span><span class="player-stage-resource"><i style="width:${resourcePercent}%"></i></span></div><div class="player-stage-art" style="background-image:url('${art}')" aria-label="${member.name}"></div>${poisonBladeIndicator}</article>`;
    }).join('');
  }
}

function getPoisonBladeVisualState(member, now = Date.now()) {
  const activating = Boolean(member?.alive && now < (member.poisonBladeVisualUntil || 0));
  let stacks = 0;
  (battle.enemyDots || []).forEach((dots, index) => {
    if ((battle.enemyHps?.[index] || 0) <= 0) return;
    const targetStacks = (dots || []).filter((dot) => dot.type === 'poison' && (dot.source === member || dot.source?.id === member?.id)).length;
    stacks = Math.max(stacks, targetStacks);
  });
  return { active: Boolean(member?.alive && (activating || stacks > 0)), activating, stacks: Math.max(1, stacks) };
}

function renderMainPoisonBladeVisual(member) {
  const art = document.querySelector('#battle-player-art');
  const field = document.querySelector('.battle-field');
  if (!art || !field) return;
  const state = getPoisonBladeVisualState(member);
  art.classList.toggle('has-poison-blade', state.active);
  art.classList.toggle('is-poison-blade-cast', state.activating);
  field.classList.toggle('main-has-poison-blade', state.active);
  field.classList.toggle('main-is-poison-blade-cast', state.activating);
  let aura = field.querySelector('.main-poison-blade-aura');
  let indicator = field.querySelector('.main-poison-blade-indicator');
  if (!state.active) {
    aura?.remove();
    indicator?.remove();
    return;
  }
  if (!aura) {
    aura = document.createElement('span');
    aura.className = 'poison-blade-aura main-poison-blade-aura';
    aura.setAttribute('aria-hidden', 'true');
    aura.innerHTML = '<i></i><i></i><i></i>';
    art.append(aura);
  }
  if (!indicator) {
    indicator = document.createElement('span');
    indicator.className = 'poison-blade-indicator main-poison-blade-indicator';
    indicator.setAttribute('role', 'img');
    art.append(indicator);
  }
  indicator.setAttribute('aria-label', `毒刃效果${state.stacks > 1 ? `，${state.stacks} 層` : ''}`);
  indicator.innerHTML = `<i>🗡</i>${state.stacks > 1 ? `<b>×${state.stacks}</b>` : ''}`;
  const artRect = art.getBoundingClientRect();
  const fieldRect = field.getBoundingClientRect();
  field.style.setProperty('--main-poison-x', `${artRect.left - fieldRect.left + artRect.width / 2}px`);
  field.style.setProperty('--main-poison-y', `${artRect.top - fieldRect.top + artRect.height / 2}px`);
  field.style.setProperty('--main-poison-size', `${artRect.width}px`);
}

function renderStrongholdObjective(currentMap = getActiveMap(getProgress())) {
  const field = document.querySelector('.battle-field');
  if (!field) return;
  let panel = document.querySelector('#stronghold-objective');
  if (!panel) {
    panel = document.createElement('aside');
    panel.id = 'stronghold-objective';
    panel.className = 'stronghold-objective hidden';
    field.appendChild(panel);
  }
  const state = battle.blackstoneStrongholdState;
  const visible = currentMap.id === 'blackstone-stronghold' && Boolean(state);
  panel.classList.toggle('hidden', !visible);
  if (!visible) return;
  const outpost = state.outpostActive ? BlackstoneStrongholdPolicy.getOutpost(state.activeOutpostId) : null;
  const enrage = BlackstoneStrongholdPolicy.getEnrage(state);
  const hpPercent = outpost && state.activeOutpostMaxHp > 0 ? Math.max(0, state.activeOutpostHp / state.activeOutpostMaxHp * 100) : 0;
  panel.innerHTML = outpost ? `<img src="${outpost.image}" alt="${outpost.name}"><div class="stronghold-objective-copy"><small>據點 ${state.destroyedOutposts + 1}／${BlackstoneStrongholdPolicy.RULES.objectiveCount}</small><strong>${outpost.name}</strong><span>${outpost.effect.label}</span><div class="stronghold-outpost-hp"><i style="width:${hpPercent}%"></i></div><em>${state.activeOutpostHp}／${state.activeOutpostMaxHp} 耐久・隊伍自動集中攻擊</em></div>`
    : `<div class="stronghold-objective-copy waiting"><small>黑石據點攻城</small><strong>${state.destroyedOutposts}／${BlackstoneStrongholdPolicy.RULES.objectiveCount} 座已摧毀</strong><span>${state.bossSpawned ? '黑石督軍已現身' : `再擊殺 ${Math.max(0, state.nextOutpostAtKills - state.killsSinceOutpost)} 隻怪物後發現下一座據點`}</span>${enrage.active ? `<em class="stronghold-enrage">敵軍狂暴 ${Math.ceil(enrage.remainingMs / 1000)} 秒</em>` : ''}</div>`;
}

function updateBattleUI() {
  syncLegacyBattleStateFromMain();
  const character = getActiveCharacter();
  const progress = getProgress();
  const maxHp = getMaxHp(progress.level, progress);
  const maxMana = getMaxCombatResource(character.job, progress.level);
  const usesRage = WarriorResourcePolicy.isWarrior(character.job);
  const usesEnergy = AssassinEnergyPolicy.isAssassin(character.job);
  const usesArrows = HunterArrowPolicy.isHunter(character.job);
  document.querySelector('#battle-player-name').textContent = character.name;
  const playerSprite = document.querySelector('#player-sprite');
  if (playerSprite) {
    const playerClass = classes.find((job) => job.id === character.job);
    playerSprite.textContent = '';
    playerSprite.className = `fighter-sprite player-art portrait-${playerClass?.portrait ?? 4}`;
  }
  document.querySelector('#battle-race').textContent = factions[character.faction].find((race) => race.id === character.race)?.name || character.race;
  document.querySelector('#battle-job').textContent = classes.find((job) => job.id === character.job)?.name || character.job;
  const raceTotem = document.querySelector('#race-totem');
  raceTotem.textContent = '';
  raceTotem.className = `race-totem race-${character.race}`;
  document.querySelector('#job-mark').textContent = jobMarks[character.job] || '✦';
  document.querySelector('#battle-level').textContent = progress.level;
  const playerStageInfo = document.querySelector('#player-stage-info');
  if (playerStageInfo) {
    const hpPercent = Math.max(0, Math.min(100, battle.playerHp / maxHp * 100));
    const resourceCurrent = usesArrows ? battle.playerArrows : battle.playerMana;
    const resourcePercent = Math.max(0, Math.min(100, resourceCurrent / Math.max(1, maxMana) * 100));
    playerStageInfo.innerHTML = `<b>${character.name}</b><small>${classes.find((job) => job.id === character.job)?.name || character.job}・Lv.${progress.level}</small><span class="player-stage-hp"><i style="width:${hpPercent}%"></i></span><span class="player-stage-resource"><i style="width:${resourcePercent}%"></i></span>`;
  }
  const currentMap = getActiveMap(progress);
  const mapName = document.querySelector('#battle-title');
  if (mapName) mapName.textContent = currentMap.dungeon ? `${currentMap.name}・第 ${battle.dungeonWave || 1} 波` : currentMap.name;
  const battleField = document.querySelector('.battle-field');
  if (battleField) {
    battleField.dataset.mapId = currentMap.id;
    battleField.style.backgroundImage = `linear-gradient(rgba(13,29,36,.12),rgba(11,35,29,.22)), url('${currentMap.background || 'assets/beginner-plains-background.png'}')`;
  }
  const companionIcons = document.querySelector('#battle-companion-icons');
  const racialCompanion = racialCompanions[character.race] || racialCompanions.human;
  const activeBattleCompanions = character.job === 'hunter' && progress.level >= 8
    ? [{ id: 'hunter-companion', image: racialCompanion.icon || racialCompanion.image, portrait: racialCompanion.portrait, name: racialCompanion.name }]
    : [];
  if (companionIcons) {
    companionIcons.classList.toggle('hidden', activeBattleCompanions.length === 0);
    companionIcons.innerHTML = activeBattleCompanions.map((unit) => `<span class="battle-companion-icon ${unit.portrait ? 'portrait' : ''}" data-companion-id="${unit.id}" role="img" aria-label="${unit.name}" style="--companion-icon:url('${unit.image}')"></span>`).join('');
  }
  const currentDungeonDefinition = currentMap.dungeon ? getDungeonDefinition(currentMap.id) : null;
  const dungeonWaveText = currentMap.id === 'goblin-camp'
    ? `第 ${battle.dungeonWave || 1} 波`
    : `第 ${battle.dungeonWave || 1}／${currentDungeonDefinition?.waves || 10} 波`;
  const displayedMonsterMin = currentMap.monsterMin || currentMap.min;
  const displayedMonsterMax = currentMap.monsterMax || currentMap.max;
  document.querySelector('#map-level-text').textContent = currentMap.dungeon ? `特殊副本・${dungeonWaveText}・Lv. ${displayedMonsterMin}–${displayedMonsterMax}` : `怪物等級：Lv. ${displayedMonsterMin}–${displayedMonsterMax}`;
  document.querySelector('#player-hp-text').textContent = `${Math.max(0, battle.playerHp)} / ${maxHp}${battle.playerShield > 0 ? `　護盾 ${battle.playerShield}` : ''}`;
  document.querySelector('#player-hp-bar').style.width = `${Math.max(0, battle.playerHp / maxHp * 100)}%`;
  document.querySelector('#player-mp-text').textContent = usesRage
    ? `${Math.floor(battle.playerMana)} / ${maxMana} 怒氣`
    : usesEnergy
      ? `能量：${Math.floor(battle.playerMana)} / ${maxMana}　恢復：${AssassinEnergyPolicy.ENERGY_REGEN_PER_SECOND}／秒`
      : usesArrows
        ? `箭矢：${battle.playerArrows} / ${maxMana}`
        : `${Math.ceil(battle.playerMana)} / ${maxMana} MP`;
  const displayedResource = usesArrows ? battle.playerArrows : battle.playerMana;
  document.querySelector('#player-mp-bar').style.width = `${Math.max(0, displayedResource / maxMana * 100)}%`;
  document.querySelector('#player-mp-text').textContent += usesManaResource(character.job) && battle.manaExhausted ? '　魔力枯竭' : '';
  document.querySelector('.mana-track')?.classList.toggle('exhausted', usesManaResource(character.job) && battle.manaExhausted);
  document.querySelector('.mana-track')?.classList.toggle('rage-resource', usesRage);
  document.querySelector('.mana-track')?.classList.toggle('energy-resource', usesEnergy);
  document.querySelector('.mana-track')?.classList.toggle('arrow-resource', usesArrows);
  document.querySelector('#enemy-count').textContent = battle.enemyHps.filter((hp) => hp > 0).length;
  renderEnemySquad();
  document.querySelector('#gold-count').textContent = progress.gold;
  document.querySelector('#potion-count').textContent = progress.potions;
  document.querySelector('#mana-potion-count').textContent = progress.manaPotions || 0;
  document.querySelector('#mana-potion-button')?.classList.toggle('hidden', usesRage || usesEnergy || usesArrows);
  document.querySelector('#exp-text').textContent = `${progress.xp} / ${requiredXp(progress.level)}`;
  document.querySelector('#xp-bar').style.width = `${progress.xp / requiredXp(progress.level) * 100}%`;
  renderBattlePartyStatus();
  renderMainPoisonBladeVisual(getMainBattleMember());
  refreshSkills(character, progress.level);
}

function autoBuyPotions() {
  const progress = getProgress();
  const purchaseAmount = 50;
  const purchaseCost = 50;
  if (progress.gold < purchaseCost) return false;
  progress.gold -= purchaseCost;
  progress.potions += purchaseAmount;
  addPotionItem(progress, purchaseAmount);
  saveProgress(progress);
  logBattle(`🛒 自動購買 ${purchaseAmount} 瓶補血罐，花費 ${purchaseCost} 金幣。`);
  return true;
}

function usePotion(manual = false) {
  let progress = getProgress();
  const maxHp = getMaxHp(progress.level, progress);
  if (progress.potions <= 0) {
    if (!autoBuyPotions()) {
      if (manual) showToast('補血罐與金幣都不足。');
      return false;
    }
    progress = getProgress();
  }
  if (battle.playerHp >= maxHp) {
    if (manual) showToast('生命值已滿。');
    return false;
  }
  progress.potions -= 1;
  removePotionItem(progress);
  battle.playerHp = Math.min(maxHp, battle.playerHp + Math.ceil(maxHp * 0.30));
  syncMainBattleMemberFromLegacy();
  saveProgress(progress);
  logBattle(`🧪 ${manual ? '手動' : '自動'}使用治癒藥水，恢復 30% 生命。`);
  updateBattleUI();
  return true;
}

function useManaPotion(manual = false) {
  const progress = getProgress();
  const character = getActiveCharacter();
  if (!character) return false;
  if (WarriorResourcePolicy.isWarrior(character.job)) {
    if (manual) showToast('戰士使用怒氣，無法使用魔法藥水。');
    return false;
  }
  if (AssassinEnergyPolicy.isAssassin(character.job)) {
    if (manual) showToast('盜賊使用能量，無法使用魔法藥水。');
    return false;
  }
  if (HunterArrowPolicy.isHunter(character.job)) {
    if (manual) showToast('獵人使用箭矢，無法使用魔法藥水。');
    return false;
  }
  const maxMana = getMaxMana(character.job, progress.level);
  if ((progress.manaPotions || 0) <= 0) {
    if (manual) showToast('魔法藥水不足。');
    return false;
  }
  if (battle.playerMana >= maxMana) {
    if (manual) showToast('魔力值已滿。');
    return false;
  }
  progress.manaPotions -= 1;
  removeManaPotionItem(progress);
  battle.playerMana = Math.min(maxMana, battle.playerMana + Math.ceil(maxMana * .20));
  updateManaExhaustion(maxMana);
  syncMainBattleMemberFromLegacy();
  saveProgress(progress);
  logBattle(`🔷 ${manual ? '手動' : '自動'}使用魔法藥水，恢復 20% 魔力。`);
  updateBattleUI();
  return true;
}

function floatDamage(value) {
  const float = document.querySelector('#damage-float');
  float.textContent = `-${value}`;
  float.classList.remove('show');
  requestAnimationFrame(() => float.classList.add('show'));
}

function rewardVictory(index) {
  if (!battle.rewardedEnemyIndexes) battle.rewardedEnemyIndexes = new Set();
  const rewardClaim = PartyPolicy.claimEnemyReward(battle.rewardedEnemyIndexes, index, battle.enemySpawnedAt?.[index]);
  const rewardKey = rewardClaim.rewardKey;
  if (!rewardClaim.claimed) {
    logPartyDebug('重複掉落事件已阻擋', { targetId: battle.enemyTypes?.[index], rewardKey });
    return;
  }
  battle.rewardedEnemyIndexes.add(rewardKey);
  const progress = getProgress();
  const mainChargeBuffActive = Date.now() < (getMainBattleMember()?.skillHasteUntil || 0);
  document.querySelector('#player-fighter')?.classList.toggle('has-charge-buff', mainChargeBuffActive);
  document.querySelector('#battle-player-art')?.classList.toggle('has-charge-buff', mainChargeBuffActive);
  const enemy = getEnemyDefinition(index);
  const currentMap = getActiveMap(progress);
  renderStrongholdObjective(currentMap);
  if (currentMap.id === 'blackstone-stronghold' && battle.blackstoneStrongholdState) {
    const previousActive = battle.blackstoneStrongholdState.outpostActive;
    battle.blackstoneStrongholdState = BlackstoneStrongholdPolicy.recordMonsterKill(battle.blackstoneStrongholdState);
    if (!previousActive && battle.blackstoneStrongholdState.outpostActive) {
      const outpost = BlackstoneStrongholdPolicy.getOutpost(battle.blackstoneStrongholdState.activeOutpostId);
      if (outpost) logBattle(`🏴 黑石${outpost.name}出現：${outpost.effect.label}。`, 'system');
    }
  }
  const baseXp = enemy.mapId ? enemy.xp : enemy.isBoss ? currentMap.bossXp : enemy.isElite ? currentMap.eliteXp : currentMap.normalXp;
  const expReward = MapExpPolicy.calculate(baseXp, progress.level, currentMap);
  const earnedXp = expReward.actualExp;
  progress.xp += earnedXp;
  const earnedGold = Math.max(1, Math.floor(enemy.gold * .55));
  progress.gold += earnedGold;
  const loot = addLoot(progress, enemy);
  const collectible = addCollectibleLoot(progress, enemy);
  const affixDropBonus = EliteAffixPolicy.getDropBonus(enemy.eliteAffixes, currentMap.chapter);
  const materialDrops = ChapterOneMaterialDropPolicy.grantMaterialDrops(progress, currentMap.id, enemy);
  materialDrops.push(...ChapterTwoMaterialDropPolicy.grantMaterialDrops(progress, currentMap.id, enemy, { dropRateMultiplier: affixDropBonus.materialMultiplier }));
  materialDrops.push(...VillageUpgradePolicy.grantMapDrops(progress, currentMap.id));
  const purificationDrop = BlackForestCorruptionPolicy.grantMapDrop(progress, currentMap.id, enemy);
  const skillMaterialDrops = SkillUpgradePolicy.grantChapterDrops(progress, currentMap.chapter, enemy);
  const recipeDrops = ChapterOneRecipeDropPolicy.grantRecipeDrops(progress, enemy, currentMap.id);
  recipeDrops.push(...ChapterTwoRecipeDropPolicy.grantRecipeDrops(progress, enemy, currentMap.id));
  let equipmentDrop = null;
  try {
    equipmentDrop = EquipmentDropPolicy.grantEquipmentDrop(progress, enemy, { chapter: currentMap.chapter, dropRateMultiplier: affixDropBonus.equipmentMultiplier });
  } catch (error) {
    console.warn('[EquipmentDrop] 裝備掉落處理發生未預期錯誤，戰鬥獎勵將繼續結算。', error);
  }
  const finalBossId = currentMap.dungeon
    ? getDungeonDefinition(currentMap.id).finalBossId
    : getMonsterPool(progress.level).boss?.[0] || null;
  let blueBossDrop = null;
  try {
    blueBossDrop = ChapterBossDropPolicy.grantChapterBossBlueDrop(progress, enemy, {
      chapter: currentMap.chapter,
      finalBossId
    });
  } catch (error) {
    console.warn('[ChapterBossDrop] 藍色裝備掉落處理發生未預期錯誤，其他戰鬥獎勵將繼續結算。', error);
  }
  let offhandDrop = null;
  if (currentMap.id === 'plains-depths' && Math.random() < EquipmentPolicy.getPlainsDepthsOffhandDropRate(enemy)) {
    offhandDrop = EquipmentPolicy.createRandomOffhandDrop(Math.random(), Math.random(), `${Date.now()}-${Math.floor(Math.random() * 1000000)}`);
    progress.inventory.push(offhandDrop);
  }
  const accountDrops = [];
  let goblinCampMapDropped = false;
  if (enemy.id === 'lostGoblin' && DungeonTicketCycle.shouldDropTicket(Math.random(), GOBLIN_CAMP_TICKET_DROP_RATE)) {
    addGoblinCampMap(progress);
    goblinCampMapDropped = true;
  }
  const dungeonItemDropsEnabled = currentMap.dungeon && currentMap.id !== 'goblin-camp';
  if (dungeonItemDropsEnabled) {
    const resources = getAccountResources();
    const ironChance = enemy.isBoss ? 1 : .22;
    if (Math.random() < ironChance) {
      const amount = enemy.isBoss ? 2 : 1;
      resources.starIron += amount;
      accountDrops.push(`星鐵碎片 ×${amount}`);
      addRoundLoot('star-iron', '星鐵碎片', amount, '✦');
    }
    saveAccountResources(resources);
  } else if (enemy.isBoss) {
    const resources = getAccountResources();
    if (Math.random() < .12) { resources.starIron += 1; accountDrops.push('星鐵碎片 ×1'); addRoundLoot('star-iron', '星鐵碎片', 1, '✦'); }
    saveAccountResources(resources);
  }
  const levelBeforeRewards = progress.level;
  while (progress.xp >= requiredXp(progress.level)) {
    progress.xp -= requiredXp(progress.level);
    progress.level += 1;
    showToast(`升級！已到達 Lv. ${progress.level}`);
    logBattle(`✦ 冒險者升至 Lv. ${progress.level}`, 'progress');
    const character = getActiveCharacter();
    const learned = (skillProgression[character.job] || []).find((skill) => skill.level === progress.level);
    if (learned) {
      showToast(`學會${learned.type === 'active' ? '主動' : '被動'}技能：${learned.name}`);
      logBattle(`★ 自動學會${learned.type === 'active' ? '主動' : '被動'}技能【${learned.name}】`, 'progress');
    }
  }
  if (progress.level !== levelBeforeRewards) syncMainBattleMemberProgression(getActiveCharacter(), progress);
  const newlyUnlockedMaps = enemy.isBoss || enemy.id === ChapterOneProgressionPolicy.REQUIREMENTS[currentMap.id]?.bossId
    ? ChapterOneProgressionPolicy.recordBossKill(progress, currentMap.id, enemy)
    : enemy.isElite ? [] : ChapterOneProgressionPolicy.recordNormalKill(progress, currentMap.id);
  newlyUnlockedMaps.forEach((mapId) => {
    const unlockedMap = mapProgression.find((map) => map.id === mapId);
    const name = unlockedMap?.name || (mapId === 'black-forest' ? '第二章' : mapId);
    showToast(`${name}已解鎖`);
    logBattle(`◆ 區域推進完成：${name}已解鎖`, 'progress');
  });
  addRoundLoot('gold', '金幣', earnedGold, '🪙', '+');
  if (loot) addRoundLoot(`loot:${loot.name}`, loot.name, loot.quantity || 1, loot.kind === 'consumable' ? '🧪' : '◆');
  materialDrops.forEach((material) => addRoundLoot(`material:${material.id || material.name}`, material.name, material.quantity || 1, material.icon || '◆'));
  if (purificationDrop) addRoundLoot(`purification:${purificationDrop.id || purificationDrop.name}`, purificationDrop.name, purificationDrop.quantity || 1, purificationDrop.icon || '◇');
  skillMaterialDrops.forEach((material) => addRoundLoot(`skill:${material.id || material.name}`, material.name, material.quantity || 1, material.icon || '📜'));
  recipeDrops.forEach((recipe) => addRoundLoot(`recipe:${recipe.id || recipe.name}`, recipe.name, recipe.quantity || 1, recipe.icon || '📜'));
  if (equipmentDrop) addRoundLoot(`equipment:${equipmentDrop.name}`, equipmentDrop.name, 1, '⚔');
  if (blueBossDrop) addRoundLoot(`equipment:${blueBossDrop.name}`, blueBossDrop.name, 1, '🔷');
  if (offhandDrop) addRoundLoot(`equipment:${offhandDrop.name}`, offhandDrop.name, 1, '🛡');
  if (goblinCampMapDropped) addRoundLoot('goblin-camp-map', '哥布林營地地圖', 1, '🗺️');
  if (collectible) addRoundLoot(`collectible:${collectible.id || collectible.name}`, collectible.name, 1, '♛');
  saveProgress(progress);
  renderBattleAdventureInfo(progress);
  logBattle(`✦ 擊敗${enemy.name}！獲得 ${earnedXp} EXP、${earnedGold} 金幣`, 'reward');
  if (loot) logBattle(`🎁 掉落【${loot.name}】${loot.quantity ? ` ×${loot.quantity}` : ''}`);
  materialDrops.forEach((material) => {
    showToast(`獲得材料：${material.name}`);
    logBattle(`◆ 材料掉落【${material.name} ×${material.quantity}】`, 'loot');
  });
  if (purificationDrop) {
    showToast(`獲得淨化道具：${purificationDrop.name}`);
    logBattle(`◇ 淨化道具掉落【${purificationDrop.name} ×1】`, 'loot');
  }
  skillMaterialDrops.forEach((material) => {
    showToast(`獲得技能材料：${material.name}`);
    logBattle(`📜 技能材料掉落【${material.name} ×${material.quantity}】`, 'loot');
  });
  recipeDrops.forEach((recipe) => {
    showToast(`獲得配方：${recipe.name}`);
    logBattle(`◆ 配方掉落【${recipe.name} ×${recipe.quantity}】`, 'loot');
  });
  if (equipmentDrop) {
    const rarityLabel = EquipmentAffixPolicy.getQualityLabel(equipmentDrop);
    showToast(`獲得裝備：${equipmentDrop.name}`);
    logBattle(`◆ 獲得裝備：【${rarityLabel}】${equipmentDrop.name}`, 'loot');
  }
  if (blueBossDrop) {
    showToast(`BOSS 掉落藍色裝備：${blueBossDrop.name}`);
    logBattle(`◆ 第一章 BOSS 稀有掉落：【藍色】${blueBossDrop.name}`, 'loot');
  }
  if (offhandDrop) {
    showToast(`獲得副手：${offhandDrop.name}【${offhandDrop.affix.name}】`);
    logBattle(`🎁 掉落【${offhandDrop.name}】－${offhandDrop.affix.text}`, 'loot');
  }
  if (goblinCampMapDropped) logBattle('🗺 迷路的哥布林掉落【哥布林營地地圖 ×1】', 'loot');
  accountDrops.forEach((drop) => logBattle(`◆ BOSS掉落【${drop}】`, 'loot'));
  if (collectible) {
    showToast(`獲得收藏品：${collectible.name}`);
    logBattle(`♛ 收藏品掉落【${collectible.name}】－${collectible.description}`, 'loot');
  }
  logPartyDebug('掉落事件', {
    targetId: enemy.id,
    targetName: enemy.name,
    rewardKey,
    xp: earnedXp,
    gold: earnedGold,
    loot: [loot?.name, ...materialDrops.map((material) => material.name), ...recipeDrops.map((recipe) => recipe.name), equipmentDrop?.name, blueBossDrop?.name, offhandDrop?.name, collectible?.name, ...accountDrops].filter(Boolean).join(',') || 'none'
  });
}

function useSharedHealingPotionForMember(member) {
  if (!member?.alive || member.isMain || member.currentHp <= 0 || member.currentHp >= member.maxHp) return false;
  const progress = getProgress();
  if ((progress.potions || 0) <= 0) return false;
  progress.potions -= 1;
  removePotionItem(progress);
  member.currentHp = Math.min(member.maxHp, member.currentHp + Math.ceil(member.maxHp * .30));
  saveProgress(progress);
  logBattle(`🧪 ${member.name}使用主要角色背包的治癒藥水，恢復 30% 生命。`, 'healing');
  return true;
}

function useSharedManaPotionForMember(member) {
  if (!member?.alive || member.isMain || !usesManaResource(member.job) || member.resourceCurrent >= member.resourceMax) return false;
  const progress = getProgress();
  if ((progress.manaPotions || 0) <= 0) return false;
  progress.manaPotions -= 1;
  removeManaPotionItem(progress);
  member.resourceCurrent = Math.min(member.resourceMax, member.resourceCurrent + Math.ceil(member.resourceMax * .20));
  saveProgress(progress);
  logBattle(`🔷 ${member.name}使用主要角色背包的魔力藥水，恢復 20% 魔力。`, 'healing');
  return true;
}

function getMonsterRespawnTicks() {
  // 移動速度越高，怪物越快回到戰場；100% 時為 4 秒。
  return Math.max(1, Math.round(4 * (100 / battle.monsterMoveSpeed)));
}

function processEnemyRespawns() {
  if (battle.isDungeon) return;
  const playerLevel = getProgress().level;
  battle.enemyRespawns.forEach((timer, index) => {
    if (timer === null || timer === -1) return;
    const nextTimer = timer - 1;
    if (nextTimer <= 0) {
    const currentMapId = getActiveMap(getProgress()).id;
    const specialRoll = Math.random();
    const bossAllowed = currentMapId !== 'plains-entrance' && !hasAliveBoss(index);
    battle.enemyTypes[index] = currentMapId === 'plains-entrance'
      ? randomEnemyId(playerLevel)
      : bossAllowed && specialRoll < bossSpawnChance ? randomBossId(playerLevel) : specialRoll < bossSpawnChance + eliteSpawnChance ? randomEliteId(playerLevel) : randomEnemyId(playerLevel);
      battle.enemyRespawns[index] = null;
      if (!battle.enemyLevels) battle.enemyLevels = battle.enemyTypes.map(() => null);
      battle.enemyLevels[index] = createEnemyLevels([battle.enemyTypes[index]], currentMapId)[0];
      if (!battle.enemyAffixes) battle.enemyAffixes = battle.enemyTypes.map(() => []);
      battle.enemyAffixes[index] = createEnemyAffixes([battle.enemyTypes[index]], currentMapId, [battle.enemyLevels[index]])[0];
      if (!battle.enemyAffixRegenAt) battle.enemyAffixRegenAt = battle.enemyTypes.map(() => Date.now());
      battle.enemyAffixRegenAt[index] = Date.now();
      if (battle.enemyTrailSummoned) battle.enemyTrailSummoned[index] = false;
      if (battle.enemySummonProfiles) battle.enemySummonProfiles[index] = null;
      if (battle.enemyAssassinDashUntil) battle.enemyAssassinDashUntil[index] = 0;
      if (battle.enemySpiderNestPhase) battle.enemySpiderNestPhase[index] = 1;
      if (battle.enemyDepthsPhase) battle.enemyDepthsPhase[index] = 1;
      battle.enemyHps[index] = getEnemyDefinition(index).maxHp;
      battle.enemySpawnedAt[index] = Date.now();
      battle.enemyDots[index] = [];
      if (battle.enemySkillStates) battle.enemySkillStates[index] = null;
      if (battle.enemyBoarEnraged) battle.enemyBoarEnraged[index] = false;
      battle.enemyNextAttackAt[index] = Date.now() + getMonsterAttackInterval(getEnemyDefinition(index));
      if (getEnemyDefinition(index).isBoss) {
        showToast(`⚠ BOSS 出現：${getEnemyDefinition(index).name}`);
        logBattle(`⚠ BOSS【${getEnemyDefinition(index).name}】出現！`);
      }
    } else {
      battle.enemyRespawns[index] = nextTimer;
    }
  });
}

function queueDefeatedEnemies() {
  if (battle.isDungeon) {
    battle.enemyHps.forEach((hp, index) => {
      if (hp > 0 || battle.enemyRespawns[index] !== null) return;
      battle.enemyHps[index] = 0;
      battle.enemyRespawns[index] = -1;
      battle.enemyNextAttackAt[index] = null;
      rewardVictory(index);
    });
    const waveCleared = battle.enemyHps.every((hp) => hp <= 0) && battle.enemyRespawns.every((timer) => timer === -1);
    if (waveCleared && !battle.waveTransitioning && !battle.dungeonComplete) {
      battle.waveTransitioning = true;
      const clearedWave = battle.dungeonWave;
      const definition = getDungeonDefinition();
      logBattle(`✓ 第 ${clearedWave} 波全滅。`, 'progress');
      if (battle.dungeonId === 'goblin-camp') {
        const outcome = DungeonTicketCycle.resolveGoblinCampWaveClear({
          wave: clearedWave,
          randomValue: Math.random(),
          minWave: definition.minWaves,
          maxWave: definition.maxWaves
        });
        if (outcome.horn) logBattle('📯 哥布林號角響起！', 'system');
        const transitionSessionId = battle.sessionId;
        setTimeout(() => {
          if (battle.sessionId !== transitionSessionId || !battle.isDungeon || battle.dungeonWave !== clearedWave) return;
          if (!outcome.continueDungeon) {
            if (outcome.escaped) logBattle('🏃 哥布林撤退，離開副本。', 'progress');
            else logBattle('哥布林營地已被完全清空，副本結束。', 'progress');
            completeDungeon();
            return;
          }
          if (outcome.horn) logBattle('⚔ 更多的哥布林到來，繼續副本！', 'spawn');
          loadDungeonWave(outcome.nextWave);
        }, outcome.horn ? 1200 : 650);
        return;
      }
      const transitionSessionId = battle.sessionId;
      setTimeout(() => {
        if (battle.sessionId !== transitionSessionId || !battle.isDungeon || battle.dungeonWave !== clearedWave) return;
        if (clearedWave >= definition.waves) completeDungeon();
        else loadDungeonWave(clearedWave + 1);
      }, 650);
    }
    return;
  }
  battle.enemyHps.forEach((hp, index) => {
    if (hp > 0 || battle.enemyRespawns[index] !== null) return;
    if (battle.enemyTrailSummoned?.[index]) {
      battle.enemyHps[index] = 0;
      battle.enemyNextAttackAt[index] = null;
      battle.enemyRespawns[index] = -1;
      return;
    }
    battle.enemyHps[index] = 0;
    battle.enemyNextAttackAt[index] = null;
    const respawnTicks = getMonsterRespawnTicks() + battle.enemyRespawns.filter((timer) => timer !== null).length;
    battle.enemyRespawns[index] = respawnTicks;
    rewardVictory(index);
  });
}

function getPlayerAttackProfile(character, skill = null) {
  if (skill?.id === 'companion') return { damageType: 'physical', attackRange: 'melee' };
  const magicJob = character.job === 'mage' || character.job === 'priest';
  const meleeJob = character.job === 'warrior' || character.job === 'assassin';
  return {
    damageType: magicJob ? 'magic' : 'physical',
    attackRange: meleeJob ? 'melee' : 'ranged'
  };
}

function getEnemySkillState(index) {
  battle.enemySkillStates = Array.isArray(battle.enemySkillStates) ? battle.enemySkillStates : [];
  battle.enemySkillStates[index] = battle.enemySkillStates[index] || {
    stunnedUntil: 0, slowedUntil: 0, frozenUntil: 0, markedUntil: 0, markBonus: 0,
    magicVulnerabilityUntil: 0, magicVulnerability: 0, attackDownUntil: 0, attackDown: 0
  };
  return battle.enemySkillStates[index];
}

function applyEnemySkillState(index, effect, now = Date.now()) {
  const state = getEnemySkillState(index);
  if (effect.stun) state.stunnedUntil = Math.max(state.stunnedUntil, now + effect.stun * 1000);
  if (effect.freezeChance && Math.random() < effect.freezeChance) state.frozenUntil = Math.max(state.frozenUntil, now + effect.freezeDuration * 1000);
  if (effect.slow) state.slowedUntil = Math.max(state.slowedUntil, now + (effect.duration || 3) * 1000);
  if (effect.mark) { state.markedUntil = now + (effect.duration || 6) * 1000; state.markBonus = effect.mark; }
  if (effect.magicVulnerability) { state.magicVulnerabilityUntil = now + effect.vulnerabilityDuration * 1000; state.magicVulnerability = effect.magicVulnerability; }
  if (effect.attackDown) { state.attackDownUntil = now + effect.duration * 1000; state.attackDown = effect.attackDown; }
  if (effect.enhancedParalysis) state.paralyzedUntil = now + 4000;
}

function applyDamageToMonster(index, baseDamage, profile, options = {}) {
  const enemy = getEnemyDefinition(index);
  const attacker = options.attacker || null;
  const progress = attacker?.progress || getProgress();
  const character = attacker?.character || getActiveCharacter();
  const attackerStats = attacker?.stats || getCharacterStats(progress.level, progress, character);
  const skillState = getEnemySkillState(index);
  const now = Date.now();
  const elementalMastery = attacker?.job === 'mage' && attacker.level >= 15
    ? ClassSkillPolicy.getEffect('mage', 'elemental-mastery', Number(progress.skillLevels?.['mage:elemental-mastery']) || 1)
    : null;
  const magicDamageBonus = profile.damageType === 'magic' ? attackerStats.magicDamageBonus : 0;
  const rankMultiplier = enemy.isBoss ? 1 + (attackerStats.bossDamagePercent || 0) : enemy.isElite ? 1 + (attackerStats.eliteDamagePercent || 0) : 1;
  const attackKindMultiplier = options.attackKind === 'skill' ? 1 + (attackerStats.skillDamagePercent || 0) : options.attackKind === 'basic' ? 1 + (attackerStats.basicAttackDamagePercent || 0) : 1;
  const magicAdjustedDamage = EquipmentPolicy.applyMagicDamageBonus(baseDamage, magicDamageBonus);
  const markMultiplier = now < skillState.markedUntil && attacker?.job === 'hunter' ? 1 + skillState.markBonus : 1;
  const vulnerabilityMultiplier = profile.damageType === 'magic' && now < skillState.magicVulnerabilityUntil ? 1 + skillState.magicVulnerability : 1;
  const controlledMultiplier = options.controlledBonus && (now < skillState.stunnedUntil || now < skillState.frozenUntil) ? 1 + options.controlledBonus : 1;
  const statusElementMultiplier = elementalMastery && (battle.enemyDots[index] || []).length ? 1 + elementalMastery.elementDamage : 1;
  const frostResonanceMultiplier = elementalMastery?.resonance && (now < skillState.slowedUntil || now < skillState.frozenUntil) && Math.random() < .1 ? attackerStats.criticalDamageMultiplier : 1;
  const lightningResonanceMultiplier = elementalMastery?.resonance && now < (skillState.paralyzedUntil || 0) && options.attackKind !== 'resonance' && Math.random() < .1 ? 1.3 : 1;
  const adjustedBaseDamage = magicAdjustedDamage * rankMultiplier * attackKindMultiplier * markMultiplier * vulnerabilityMultiplier * controlledMultiplier * statusElementMultiplier * frostResonanceMultiplier * lightningResonanceMultiplier;
  if (enemy.mapId) {
    const hitChance = ChapterOneLevelPolicy.getPlayerHitChance(progress.level, enemy.level, attackerStats.accuracy, 0);
    if (Math.random() >= hitChance) {
      if (options.logDefense !== false) logBattle(`你的攻擊未能命中【${enemy.name}】！`, 'damage-dealt');
      return { finalDamage: 0, missed: true, evaded: true, parried: false };
    }
  }
  const trailMultipliers = BlackForestTrailPolicy.getCombatMultipliers(enemy.id, battle.enemyHps[index], enemy.maxHp);
  const spiderNestMultipliers = SpiderNestPolicy.getCombatMultipliers(enemy.id, battle.enemyHps[index], enemy.maxHp);
  const strongholdMultipliers = BlackstoneStrongholdPolicy.getCombatMultipliers(enemy.id, battle.enemyHps[index], enemy.maxHp);
  const forestAltarMultipliers = ForestAltarPolicy.getCombatMultipliers(enemy.id, battle.enemyHps[index], enemy.maxHp);
  const depthsMultipliers = BlackForestDepthsPolicy.getCombatMultipliers(enemy.id, battle.enemyHps[index], enemy.maxHp, getBlackForestDepthsCombatContext());
  const captainShieldActive = enemy.id === 'blackstoneCaptain' && Date.now() < (battle.enemyCaptainShieldUntil?.[index] || 0);
  const assassinDashActive = enemy.id === 'blackstoneVenombladeAssassin' && Date.now() < (battle.enemyAssassinDashUntil?.[index] || 0);
  const defendedEnemy = {
    ...enemy,
    defense: Math.max(0, Math.round(enemy.defense * (1 - (options.armorIgnore || 0)) * (1 - Math.min(.9, (battle.enemyDots[index] || []).filter((dot) => dot.type === 'poison').reduce((total, dot) => total + (dot.defenseReduction || 0), 0))) * trailMultipliers.defense * spiderNestMultipliers.defense * strongholdMultipliers.defense * forestAltarMultipliers.defense * depthsMultipliers.defense)),
    evasion: (enemy.evasion || 0) + (trailMultipliers.evasion || 0) + (spiderNestMultipliers.evasion || 0) + (strongholdMultipliers.evasion || 0) + (forestAltarMultipliers.evasion || 0) + (depthsMultipliers.evasion || 0) + (assassinDashActive ? SpiderNestPolicy.ASSASSIN.dashEvasionBonus : 0),
    parry: (enemy.parry || 0) + (captainShieldActive ? BlackForestTrailPolicy.CAPTAIN.shieldParryBonus : 0)
  };
  const result = MonsterDefense.resolveDamage({
    baseDamage: adjustedBaseDamage,
    monster: defendedEnemy,
    damageType: profile.damageType,
    attackRange: profile.attackRange,
    canEvade: options.canEvade !== false,
    canParry: options.canParry !== false
  });

  if (result.evaded) {
    if (options.logDefense !== false) logBattle(`${enemy.name}閃避了你的攻擊！`, 'damage-dealt');
    return result;
  }
  if (result.parried && options.logDefense !== false) {
    logBattle(`${enemy.name}招架了你的攻擊！`, 'damage-dealt');
  }
  if (result.parried && enemy.id === 'wanderingBlackKnight' && attacker?.alive) {
    const counterStats = getCharacterStats(attacker.level, attacker.progress, attacker.character);
    const counterRaw = Math.max(1, getMonsterAttackPower(enemy, progress, battle.enemyHps[index]) * PlainsDepthsPolicy.COUNTER_DAMAGE_MULTIPLIER);
    const counterDamage = MonsterDefense.resolvePlayerDamage({ baseDamage: counterRaw, defense: counterStats.defense, damageReduction: counterStats.damageReduction }).finalDamage;
    const absorbed = Math.min(attacker.shield || 0, counterDamage);
    attacker.shield = Math.max(0, (attacker.shield || 0) - absorbed);
    attacker.currentHp = Math.max(0, attacker.currentHp - (counterDamage - absorbed));
    logBattle(`↩【${enemy.name}】招架後反擊，對${attacker.name}造成 ${counterDamage - absorbed} 傷害。`, 'damage-taken');
    defeatPartyMember(attacker);
  }
  if (result.parried && captainShieldActive && attacker?.alive) {
    const counterStats = getCharacterStats(attacker.level, attacker.progress, attacker.character);
    const counterRaw = Math.max(1, getMonsterAttackPower(enemy, progress, battle.enemyHps[index]) * BlackForestTrailPolicy.CAPTAIN.counterDamageMultiplier);
    const counterDamage = MonsterDefense.resolvePlayerDamage({ baseDamage: counterRaw, defense: counterStats.defense, damageReduction: counterStats.damageReduction }).finalDamage;
    const absorbed = Math.min(attacker.shield || 0, counterDamage);
    attacker.shield = Math.max(0, (attacker.shield || 0) - absorbed);
    attacker.currentHp = Math.max(0, attacker.currentHp - (counterDamage - absorbed));
    logBattle(`↩【${enemy.name}】以【盾架反擊】對${attacker.name}造成 ${counterDamage - absorbed} 傷害。`, 'damage-taken');
    defeatPartyMember(attacker);
  }
  const wasAlive = battle.enemyHps[index] > 0;
  battle.enemyHps[index] -= result.finalDamage;
  if (wasAlive && battle.enemyHps[index] <= 0 && attacker?.alive) {
    const hpRecovery = Math.ceil((attacker.maxHp || 0) * (attackerStats.killHealthRecoveryPercent || 0));
    const resourceRecovery = Math.ceil((attacker.resourceMax || 0) * (attackerStats.killResourceRecoveryPercent || 0));
    if (hpRecovery > 0) attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + hpRecovery);
    if (resourceRecovery > 0) attacker.resourceCurrent = Math.min(attacker.resourceMax, attacker.resourceCurrent + resourceRecovery);
    if (attacker.job === 'assassin' && attacker.level >= 20 && attacker.currentHp / attacker.maxHp <= .3) {
      const desperate = ClassSkillPolicy.getEffect('assassin', 'desperate-counter', Number(progress.skillLevels?.['assassin:desperate-counter']) || 1);
      if (desperate.killHeal) attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + attacker.maxHp * desperate.killHeal);
    }
  }
  if (options.showDamage !== false) showEnemyDamage([index], result.finalDamage, options.effectType || 'normal');
  return result;
}

function updatePartyMemberManaExhaustion(member) {
  if (!usesManaResource(member.job) || member.resourceMax <= 0) return;
  const ratio = member.resourceCurrent / member.resourceMax;
  if (!member.manaExhausted && ratio <= .15) {
    member.manaExhausted = true;
    logBattle(`◇ ${member.name}魔力枯竭，暫停施放技能。`, 'system');
    if (member.isMain) {
      syncLegacyBattleStateFromMain();
      useManaPotion();
      syncMainBattleMemberFromLegacy();
    } else useSharedManaPotionForMember(member);
  } else if (member.manaExhausted && ratio >= .45) {
    member.manaExhausted = false;
    logBattle(`◆ ${member.name}魔力恢復，重新開始施放技能。`, 'system');
  }
}

function useAutoSkillForMember(member, now = Date.now()) {
  if (!member?.alive || now < member.stunnedUntil || now < member.globalSkillReadyAt) return false;
  const { character, progress, stats } = member;
  if (usesManaResource(member.job) && member.manaExhausted) return false;
  const unlocked = getKnownSkills(member.job, member.level).filter((skill) => skill.type === 'active' && skill.level <= member.level);
  const attackSkills = unlocked.filter((skill) => skill.id !== 'heal' && (member.skillCooldowns[skill.id] || 0) <= now);
  for (const skill of attackSkills) {
    const skillEffect = getSkillEffect(progress, member.job, skill);
    const cost = getSkillResourceCost(member.job, skill);
    if (member.resourceType === 'arrows' && !HunterArrowPolicy.canUseSkill(member.resourceCurrent, skill.id, progress.equipment)) continue;
    if (member.resourceType !== 'arrows' && member.resourceCurrent < cost) continue;
    const targets = aliveEnemyIndexesByAge().slice(0, skillEffect.targets || skill.targets || 1);
    if (!targets.length) continue;
    const critical = Math.random() < stats.crit;
    let damagePower = Number(skillEffect.power) || Number(skill.power) || 1;
    if (skill.id === 'piercing-shot' && aliveEnemyIndexesByAge().length === 1) damagePower *= skillEffect.singleTargetBonus ? 1 + skillEffect.singleTargetBonus : 1;
    if (skill.id === 'whirlwind') damagePower *= 1 + Math.min(skillEffect.maxTargetBonus || 0, Math.max(0, targets.length - 1) * (skillEffect.perExtraTargetBonus || 0));
    const damage = Math.max(1, Math.ceil(stats.attack * damagePower * (critical ? stats.criticalDamageMultiplier : 1)));
    const profile = getPlayerAttackProfile(character, skill);
    const targetAnchors = ['heavy-strike', 'whirlwind', 'charge', 'power-shot', 'multi-shot', 'piercing-shot', 'backstab', 'shadow-dance', 'fireball', 'blizzard', 'chain-lightning', 'holy-light', 'holy-nova'].includes(skill.id)
      ? new Map(targets.map((index) => [index, captureBattleTargetAnchor(index)]))
      : null;
    const attackerAnchor = ['power-shot', 'multi-shot', 'piercing-shot', 'chain-lightning'].includes(skill.id) ? captureBattleAttackerAnchor(member) : null;
    const resolvedTargets = targets.map((index, targetOrder) => {
      const chainMultiplier = skill.id === 'chain-lightning' ? 1 + targetOrder * (skillEffect.bounceBonus || 0) : 1;
      const piercingMultiplier = skill.id === 'piercing-shot' ? Math.max(.1, 1 - targetOrder * .1) : 1;
      return { index, result: applyDamageToMonster(index, damage * chainMultiplier * piercingMultiplier, profile, {
        attacker: member,
        attackKind: 'skill',
        armorIgnore: skillEffect.armorIgnore,
        controlledBonus: skillEffect.controlledBonus,
        showDamage: !['heavy-strike', 'whirlwind', 'charge', 'power-shot', 'multi-shot', 'piercing-shot', 'backstab', 'shadow-dance', 'poison-blade', 'fireball', 'blizzard', 'chain-lightning', 'holy-light', 'holy-nova'].includes(skill.id)
      }) };
    });
    const hits = resolvedTargets.filter((target) => !target.result.evaded);
    hits.forEach((target) => applyEnemySkillState(target.index, skillEffect, now));
    if (skill.id === 'chain-lightning') hits.forEach((target, order) => {
      const state = getEnemySkillState(target.index);
      if (state.paralyzedUntil > now) state.visualParalyzedAt = now + 330 + order * 100;
    });
    if (skill.id === 'holy-light') hits.forEach((target) => {
      const state = getEnemySkillState(target.index);
      if (state.attackDownUntil > now) state.visualAttackDownAt = now + 480;
    });
    if (skill.id === 'heavy-strike') hits.forEach((target) => { getEnemySkillState(target.index).visualStunAt = now + 550; });
    if (skill.id === 'power-shot') hits.forEach((target) => {
      const state = getEnemySkillState(target.index);
      if (skillEffect.slow) state.visualSlowAt = now + 550;
      if (skillEffect.mark) state.visualMarkAt = now + 550;
    });
    if (skill.id === 'fireball') hits.forEach((target) => {
      applyDot(target.index, 'burn', Math.max(1, Math.ceil(target.result.finalDamage * .18 * (1 + (skillEffect.burnBonus || 0)) * stats.dotMultiplier)), 4 + (skillEffect.burnDuration || 0), 1, { source: member });
      getEnemySkillState(target.index).visualBurnAt = now + 500;
    });
    if (skill.id === 'backstab') hits.forEach((target) => {
      const bleeding = (battle.enemyDots[target.index] || []).find((dot) => dot.type === 'bleed');
      if (bleeding && skillEffect.bleedTrigger) applyDamageToMonster(target.index, bleeding.damage * skillEffect.bleedTrigger, { damageType: 'periodic', attackRange: 'none' }, { attacker: member, attackKind: 'bleed-trigger', canEvade: false, canParry: false });
      applyDot(target.index, 'bleed', Math.max(1, Math.ceil(target.result.finalDamage * .12 * (1 + (skillEffect.bleedBonus || 0)))), 5, 1, { source: member });
      getEnemySkillState(target.index).visualBleedAt = now + 500;
    });
    if (skill.id === 'poison-blade') {
      member.poisonBladeVisualUntil = now + 800;
      hits.forEach((target) => applyDot(target.index, 'poison', Math.max(1, Math.ceil(target.result.finalDamage * .15 * (1 + (skillEffect.poisonBonus || 0)) * stats.dotMultiplier)), 5 + (skillEffect.poisonDuration || 0), skillEffect.poisonStacks || 1, { source: member, defenseReduction: skillEffect.defensePerStack || 0 }));
    }
    if (skill.id === 'fireball' && skillEffect.explosionPower && hits.length) {
      aliveEnemyIndexesByAge().filter((index) => index !== hits[0].index).slice(0, skillEffect.explosionTargets).forEach((index) => applyDamageToMonster(index, stats.attack * skillEffect.explosionPower, profile, { attacker: member, attackKind: 'skill', effectType: 'magic' }));
    }
    if (skill.id === 'charge') {
      member.skillHasteUntil = now + (skillEffect.duration || 3) * 1000;
      member.skillHasteBonus = skillEffect.attackSpeed || 0;
      member.skillBasicDamageBonus = skillEffect.basicDamage || 0;
    }
    if (skill.id === 'shadow-dance') {
      member.shadowDanceUntil = now + 4000;
      member.shadowDanceOffhandChance = (skillEffect.offhandChance || 0) + Math.min(.25, hits.length * (skillEffect.offhandPerTarget || 0));
    }
    if (skill.id === 'multi-shot' && skillEffect.nextBasicPerTarget) member.nextBasicDamageBonus = Math.min(skillEffect.maxNextBasic, hits.length * skillEffect.nextBasicPerTarget);
    if (skill.id === 'multi-shot' && skillEffect.killCooldownReduction) {
      const killed = resolvedTargets.filter(({ index, result }) => !result.evaded && battle.enemyHps[index] <= 0).length;
      const reduction = Math.min(skillEffect.maxCooldownReduction, killed * skillEffect.killCooldownReduction) * 1000;
      member.pendingSkillCooldownReduction = reduction;
    }
    if (skill.id === 'holy-nova' && hits.length) {
      member.currentHp = Math.min(member.maxHp, member.currentHp + member.maxHp * (skillEffect.selfHealPerTarget || 0) * hits.length);
      if (skillEffect.shield && hits.length >= skillEffect.shieldAtTargets) member.shield += member.maxHp * skillEffect.shield;
    }
    if (member.job === 'priest' && member.level >= 3) {
      const faith = ClassSkillPolicy.getEffect('priest', 'holy-faith', Number(progress.skillLevels?.['priest:holy-faith']) || 1);
      if (faith.faith) { member.faithStacks = Math.min(3, (member.faithStacks || 0) + 1); member.faithUntil = now + 6000; }
    }
    member.resourceCurrent = member.resourceType === 'arrows'
      ? HunterArrowPolicy.spendArrows(member.resourceCurrent, skill.id, progress.equipment)
      : Math.max(0, member.resourceCurrent - cost);
    const blinkCooldownMultiplier = member.blinkCooldownReduction ? 1 - member.blinkCooldownReduction : 1;
    const blessingCooldownSpeed = now < (member.lightGraceUntil || 0) ? 1 + (member.lightGraceCooldownSpeed || 0) : 1;
    member.skillCooldowns[skill.id] = now + (skillEffect.cooldown || skill.cooldown) * blinkCooldownMultiplier * skillCooldownMultiplier * 1000 / (stats.cooldownSpeed * blessingCooldownSpeed);
    if (member.pendingSkillCooldownReduction) {
      member.skillCooldowns[skill.id] = Math.max(now, member.skillCooldowns[skill.id] - member.pendingSkillCooldownReduction);
      member.pendingSkillCooldownReduction = 0;
    }
    member.blinkCooldownReduction = 0;
    member.globalSkillReadyAt = now + 1000;
    const totalDamage = hits.reduce((total, target) => total + target.result.finalDamage, 0);
    if (skill.id !== 'companion') playPartyMemberCombatAnimation(member, (skill.id === 'shadow-dance' ? resolvedTargets : (hits.length ? hits : resolvedTargets)).map((target) => target.index), {
      kind: 'skill',
      area: Number(skillEffect.targets || skill.targets || 1) > 1,
      skillId: skill.id,
      targetPositions: targetAnchors
    });
    if (skill.id === 'heavy-strike') {
      const struckTarget = hits[0];
      const displayedTarget = struckTarget || resolvedTargets[0];
      playBattleSkillEffect(skill.id, targetAnchors.get(displayedTarget.index), { damage: struckTarget?.result.finalDamage || 0 });
    }
    if (skill.id === 'power-shot') {
      const struckTarget = hits[0];
      const displayedTarget = struckTarget || resolvedTargets[0];
      playBattleSkillEffect(skill.id, targetAnchors.get(displayedTarget.index), { damage: struckTarget?.result.finalDamage || 0, origin: attackerAnchor });
    }
    if (skill.id === 'backstab') {
      const struckTarget = hits[0];
      const displayedTarget = struckTarget || resolvedTargets[0];
      playBattleSkillEffect(skill.id, targetAnchors.get(displayedTarget.index), { damage: struckTarget?.result.finalDamage || 0 });
    }
    if (skill.id === 'fireball') {
      const struckTarget = hits[0];
      const displayedTarget = struckTarget || resolvedTargets[0];
      playBattleSkillEffect(skill.id, targetAnchors.get(displayedTarget.index), { damage: struckTarget?.result.finalDamage || 0 });
    }
    if (skill.id === 'blizzard') {
      const field = document.querySelector('.battle-field');
      const fieldRect = field?.getBoundingClientRect();
      const centerAnchor = fieldRect ? { index: -1, x: fieldRect.width * .5, y: fieldRect.height * .54, width: Math.min(fieldRect.width * .22, 150) } : targetAnchors.get((hits[0] || resolvedTargets[0]).index);
      const visualTargets = hits.slice(0, 5).map((target) => ({ index: target.index, damage: target.result.finalDamage, anchor: targetAnchors.get(target.index) })).filter((target) => target.anchor);
      playBattleSkillEffect(skill.id, centerAnchor, { targets: visualTargets });
    }
    if (skill.id === 'chain-lightning') {
      const visualTargets = resolvedTargets.map((target) => ({ index: target.index, damage: target.result.evaded ? 0 : target.result.finalDamage, anchor: targetAnchors.get(target.index) })).filter((target) => target.anchor);
      if (attackerAnchor && visualTargets.length) playBattleSkillEffect(skill.id, { index: -1, ...attackerAnchor, width: 1 }, { targets: visualTargets });
    }
    if (skill.id === 'holy-light') {
      const struckTarget = hits[0];
      const displayedTarget = struckTarget || resolvedTargets[0];
      playBattleSkillEffect(skill.id, targetAnchors.get(displayedTarget.index), { damage: struckTarget?.result.finalDamage || 0 });
    }
    if (skill.id === 'holy-nova') {
      const field = document.querySelector('.battle-field');
      const fieldRect = field?.getBoundingClientRect();
      const centerAnchor = fieldRect ? { index: -1, x: fieldRect.width * .5, y: fieldRect.height * .54, width: 1 } : targetAnchors.get((hits[0] || resolvedTargets[0]).index);
      const hitTargets = hits.map((target) => ({ index: target.index, damage: target.result.finalDamage, anchor: targetAnchors.get(target.index) })).filter((target) => target.anchor);
      const radius = Math.max(90, ...hitTargets.map((target) => Math.hypot(target.anchor.x - centerAnchor.x, target.anchor.y - centerAnchor.y) + target.anchor.width * .36));
      const visualTargets = hitTargets.map((target) => ({ ...target, delay: Math.round(300 + Math.hypot(target.anchor.x - centerAnchor.x, target.anchor.y - centerAnchor.y) / radius * 400) }));
      playBattleSkillEffect(skill.id, centerAnchor, { targets: visualTargets, radius });
    }
    if (skill.id === 'shadow-dance') {
      const visualTargets = resolvedTargets.slice(0, 5).map((target) => ({
        index: target.index,
        damage: target.result.evaded ? 0 : target.result.finalDamage,
        anchor: targetAnchors.get(target.index)
      })).filter((target) => target.anchor);
      if (visualTargets.length) playBattleSkillEffect(skill.id, visualTargets[0].anchor, { targets: visualTargets });
    }
    if (skill.id === 'multi-shot') {
      const visualTargets = resolvedTargets.map((target) => ({
        index: target.index,
        damage: target.result.evaded ? 0 : target.result.finalDamage,
        anchor: targetAnchors.get(target.index)
      })).filter((target) => target.anchor);
      if (attackerAnchor && visualTargets.length) playBattleSkillEffect(skill.id, { index: -1, ...attackerAnchor, width: 1 }, { targets: visualTargets });
    }
    if (skill.id === 'piercing-shot') {
      const visualTargets = resolvedTargets.slice(0, 4).map((target) => ({
        index: target.index,
        damage: target.result.evaded ? 0 : target.result.finalDamage,
        anchor: targetAnchors.get(target.index)
      })).filter((target) => target.anchor);
      if (attackerAnchor && visualTargets.length) playBattleSkillEffect(skill.id, { index: -1, ...attackerAnchor, width: 1 }, { targets: visualTargets });
    }
    if (skill.id === 'whirlwind') {
      const field = document.querySelector('.battle-field');
      const fieldRect = field?.getBoundingClientRect();
      const formationRect = document.querySelector('#enemy-squad')?.getBoundingClientRect();
      const centerAnchor = fieldRect && formationRect ? {
        index: -1,
        x: formationRect.left - fieldRect.left + formationRect.width / 2,
        y: formationRect.top - fieldRect.top + formationRect.height * .58,
        width: Math.min(formationRect.width, fieldRect.width * .56)
      } : targetAnchors.get((hits[0] || resolvedTargets[0]).index);
      playBattleSkillEffect(skill.id, centerAnchor, {
        targets: hits.map((target) => ({ index: target.index, damage: target.result.finalDamage, anchor: targetAnchors.get(target.index) }))
      });
    }
    if (skill.id === 'charge') {
      const struckTarget = hits[0];
      const displayedTarget = struckTarget || resolvedTargets[0];
      playBattleSkillEffect(skill.id, targetAnchors.get(displayedTarget.index), { damage: struckTarget?.result.finalDamage || 0 });
    }
    if (member.isMain && skill.id === 'companion') playCompanionAttackAnimation((hits.length ? hits : resolvedTargets).map((target) => target.index));
    if (hits.length) logBattle(`✦ ${member.name}施放【${skill.name}】，造成 ${totalDamage}${critical ? ' 暴擊' : ''}傷害。`, 'damage-dealt');
    logPartyDebug('技能施放', {
      attackerId: member.id,
      attackerName: member.name,
      targetIds: resolvedTargets.map(({ index }) => battle.enemyTypes[index]).join(','),
      targetNames: resolvedTargets.map(({ index }) => getEnemyDefinition(index).name).join(','),
      damage: totalDamage,
      skill: skill.name,
      resource: `${member.resourceType}:${Math.floor(member.resourceCurrent)}/${member.resourceMax}`,
      cooldownUntil: Math.round(member.skillCooldowns[skill.id])
    });
    updatePartyMemberManaExhaustion(member);
    return true;
  }
  const healSkill = unlocked.find((skill) => skill.id === 'heal' && (member.skillCooldowns[skill.id] || 0) <= now);
  const healTarget = (battle.partyMembers || []).filter((candidate) => candidate.alive).sort((a, b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp)[0] || member;
  if (!healSkill || member.resourceCurrent < getSkillManaCost(healSkill) || healTarget.currentHp / healTarget.maxHp > .7) return false;
  const cost = getSkillManaCost(healSkill);
  const healEffect = getSkillEffect(progress, member.job, healSkill);
  const grace = member.level >= 15 ? ClassSkillPolicy.getEffect('priest', 'divine-grace', Number(progress.skillLevels?.['priest:divine-grace']) || 1) : null;
  member.effectiveHealCount = (member.effectiveHealCount || 0) + 1;
  const graceTriggered = Boolean(grace && member.effectiveHealCount % grace.count === 0);
  const heal = Math.ceil(stats.attack * (healEffect.healPower || 1.5) * (graceTriggered ? 1 + grace.bonus : 1));
  const missing = healTarget.maxHp - healTarget.currentHp;
  const actualHeal = Math.min(missing, heal);
  const healTargetAnchor = captureBattleAllyAnchor(healTarget);
  healTarget.currentHp = Math.min(healTarget.maxHp, healTarget.currentHp + heal);
  healTarget.shield += Math.max(0, heal - missing) * (healEffect.overhealShield || 0);
  if (healTargetAnchor && actualHeal > 0) playBattleSkillEffect('heal', healTargetAnchor, { heal: actualHeal });
  if (graceTriggered && grace.spread && actualHeal > 0) {
    (battle.partyMembers || []).filter((ally) => ally.alive && ally.id !== healTarget.id).slice(0, grace.maxAllies).forEach((ally) => {
      ally.currentHp = Math.min(ally.maxHp, ally.currentHp + actualHeal * grace.spread);
    });
  }
  if (actualHeal > 0 && member.level >= 20) {
    const blessing = ClassSkillPolicy.getEffect('priest', 'light-grace', Number(progress.skillLevels?.['priest:light-grace']) || 1);
    const blessed = blessing.party ? (battle.partyMembers || []).filter((ally) => ally.alive) : [healTarget];
    blessed.forEach((ally) => { ally.lightGraceUntil = now + blessing.duration * 1000; ally.lightGraceAttackSpeed = blessing.attackSpeed; ally.lightGraceCooldownSpeed = blessing.cooldownSpeed || 0; });
  }
  member.resourceCurrent -= cost;
  member.globalSkillReadyAt = now + 1000;
  member.skillCooldowns[healSkill.id] = now + (healEffect.cooldown || healSkill.cooldown) * skillCooldownMultiplier * 1000 / stats.cooldownSpeed;
  if (healEffect.afterglow && actualHeal > 0) setTimeout(() => {
    if (!healTarget.alive) return;
    healTarget.currentHp = Math.min(healTarget.maxHp, healTarget.currentHp + Math.ceil(actualHeal * healEffect.afterglow));
    if (fighting) updateBattleUI();
  }, 3000);
  logBattle(`✦ ${member.name}施放【${healSkill.name}】，為 ${healTarget.name}恢復 ${actualHeal} 生命。`);
  logPartyDebug('技能施放', {
    attackerId: member.id,
    attackerName: member.name,
    targetId: healTarget.id,
    targetName: healTarget.name,
    damage: -actualHeal,
    skill: healSkill.name,
    resource: `${member.resourceType}:${Math.floor(member.resourceCurrent)}/${member.resourceMax}`,
    cooldownUntil: Math.round(member.skillCooldowns[healSkill.id])
  });
  updatePartyMemberManaExhaustion(member);
  return true;
}

function autoSkillTick() {
  if (!fighting) return;
  const now = Date.now();
  let casted = false;
  (battle.partyMembers || []).forEach((member) => {
    if (useAutoSkillForMember(member, now)) casted = true;
  });
  queueDefeatedEnemies();
  syncLegacyBattleStateFromMain();
  if (casted) updateBattleUI();
}

function updatePartyMemberResource(member, now) {
  if (!member.alive) return;
  if (usesManaResource(member.job)) {
    const elapsed = ManaRegenPolicy.getElapsedSeconds(now, member.lastManaRegenAt);
    member.lastManaRegenAt = now;
    member.resourceCurrent = Math.min(member.resourceMax, member.resourceCurrent + ManaRegenPolicy.calculateRegenAmount({
      maxMana: member.resourceMax,
      regenMultiplier: member.stats.manaRegen,
      flatPerSecond: member.stats.manaRegenFlat,
      elapsedSeconds: elapsed
    }));
    updatePartyMemberManaExhaustion(member);
  } else if (member.resourceType === 'energy') {
    const elapsed = AssassinEnergyPolicy.getElapsedSeconds(now, member.lastResourceUpdatedAt);
    member.lastResourceUpdatedAt = now;
    member.resourceCurrent = AssassinEnergyPolicy.getRegeneratedEnergy(member.resourceCurrent, elapsed);
    member.progress.energy = member.resourceCurrent;
    member.progress.energyUpdatedAt = now;
  } else if (member.resourceType === 'arrows') {
    const recovery = HunterArrowPolicy.recoverArrows(member.resourceCurrent, now - member.lastArrowRecoveryAt, member.progress.equipment);
    member.resourceCurrent = recovery.arrows;
    member.lastArrowRecoveryAt = now - recovery.remainder;
  }
}

function updatePartyMemberHealthRegeneration(member, now) {
  if (!member.alive) return;
  const elapsedSeconds = Math.max(0, now - member.lastHpRegenerationAt) / 1000;
  member.lastHpRegenerationAt = now;
  if (elapsedSeconds <= 0 || member.currentHp >= member.maxHp) return;
  member.currentHp = Math.min(member.maxHp, member.currentHp + member.stats.hpRegeneration * elapsedSeconds);
}

function processPartyMemberAttacks(now = Date.now()) {
  for (const member of battle.partyMembers || []) {
    if (!PartyPolicy.canMemberAttack(member, now)) continue;
    const targetIndex = PartyPolicy.getFrontAliveEnemyIndex(battle.enemyHps, battle.enemySpawnedAt);
    member.targetIndex = targetIndex;
    if (targetIndex < 0) continue;
    const equippedWeapon = member.progress.equipment?.weapon;
    const rolledWeaponAttack = EquipmentPolicy.rollWeaponAttack(equippedWeapon, Math.random());
    const displayedWeaponAttack = rolledWeaponAttack === null ? 0 : effectiveEquipmentStat(equippedWeapon, 'attack');
    const attackWithWeaponRoll = member.stats.attack + (rolledWeaponAttack === null ? 0 : rolledWeaponAttack - displayedWeaponAttack);
    const orcRage = member.race === 'orc' && Math.random() < .10;
    const desperate = member.job === 'assassin' && member.level >= 20 && member.currentHp / member.maxHp <= .3
      ? ClassSkillPolicy.getEffect('assassin', 'desperate-counter', Number(member.progress.skillLevels?.['assassin:desperate-counter']) || 1)
      : null;
    const hunterInstinct = member.job === 'hunter' && member.level >= 20 ? getHunterInstinctEffect(member.progress) : null;
    member.hunterAttackCount += 1;
    const instinctTriggered = Boolean(hunterInstinct && member.hunterAttackCount % hunterInstinct.interval === 0);
    const critical = instinctTriggered && hunterInstinct.guaranteedCrit ? true : Math.random() < Math.min(.95, member.stats.crit + (desperate?.crit || 0));
    const temporaryBasicBonus = (now < (member.skillHasteUntil || 0) ? member.skillBasicDamageBonus || 0 : 0) + (member.nextBasicDamageBonus || 0) + (member.nextHunterAttackBonus || 0) + (desperate?.attack || 0);
    const baseHit = Math.max(1, Math.ceil(attackWithWeaponRoll * (1 + temporaryBasicBonus) * (orcRage ? 1.10 : 1) * (critical ? member.stats.criticalDamageMultiplier : 1)));
    member.nextBasicDamageBonus = 0;
    member.nextHunterAttackBonus = 0;
    const hit = Math.max(1, Math.ceil(baseHit * (instinctTriggered ? hunterInstinct.power : 1)));
    const enemy = getEnemyDefinition(targetIndex);
    const profile = getPlayerAttackProfile(member.character);
    const result = applyDamageToMonster(targetIndex, hit, profile, { attacker: member, attackKind: 'basic' });
    playPartyMemberCombatAnimation(member, [targetIndex], { kind: 'basic' });
    if (!result.evaded) {
      if (member.resourceType === 'rage') member.resourceCurrent = WarriorResourcePolicy.gainFromAttack(member.resourceCurrent);
      logBattle(`⚔ ${member.name}對【${enemy.name}】造成 ${result.finalDamage} 傷害${critical ? '（暴擊）' : ''}${orcRage ? '（狂怒）' : ''}${instinctTriggered ? '（獵人本能）' : ''}`, 'damage-dealt', { aggregateKey: `member-${member.id}-${battle.enemyTypes[targetIndex]}`, damage: result.finalDamage, summary: `⚔ ${member.name}攻擊【${enemy.name}】` });
      if (member.job === 'hunter' && member.level >= 8 && battle.enemyHps[targetIndex] > 0) {
        const bond = ClassSkillPolicy.getEffect('hunter', 'wild-bond', Number(member.progress.skillLevels?.['hunter:wild-bond']) || 1);
        const pet = applyDamageToMonster(targetIndex, member.stats.attack * bond.companionAttack, { damageType: 'physical', attackRange: 'melee' }, { attacker: member, attackKind: 'companion', canParry: false });
        if (!pet.evaded) playCompanionAttackAnimation([targetIndex]);
        member.petAttackCount = (member.petAttackCount || 0) + 1;
        if (bond.beastSlam && member.petAttackCount % 6 === 0 && battle.enemyHps[targetIndex] > 0) {
          applyDamageToMonster(targetIndex, member.stats.attack * bond.companionAttack * bond.beastSlam, { damageType: 'physical', attackRange: 'melee' }, { attacker: member, attackKind: 'beast-slam', canParry: false });
          member.nextHunterAttackBonus = bond.nextHunterAttack || 0;
          logBattle(`🐾 ${member.name}的寵物發動【野獸猛擊】！`, 'damage-dealt');
        }
      }
      if (member.job === 'hunter' && member.level >= 15) {
        const reload = ClassSkillPolicy.getEffect('hunter', 'quick-reload', Number(member.progress.skillLevels?.['hunter:quick-reload']) || 1);
        if (reload.basicArrowRecoveryChance && Math.random() < reload.basicArrowRecoveryChance) member.resourceCurrent = Math.min(member.resourceMax, member.resourceCurrent + 1);
      }
      if (member.job === 'assassin' && battle.enemyHps[targetIndex] > 0) {
        const mastery = member.level >= 15 ? ClassSkillPolicy.getEffect('assassin', 'dagger-mastery', Number(member.progress.skillLevels?.['assassin:dagger-mastery']) || 1) : {};
        const masteryProc = mastery.offhandChance && Math.random() < mastery.offhandChance;
        const danceProc = now < (member.shadowDanceUntil || 0) && Math.random() < (member.shadowDanceOffhandChance || 0);
        if (masteryProc || danceProc) applyDamageToMonster(targetIndex, member.stats.attack * .5, profile, { attacker: member, attackKind: 'offhand', canParry: false });
      }
    }
    logPartyDebug('普通攻擊', {
      attackerId: member.id,
      attackerName: member.name,
      targetId: battle.enemyTypes[targetIndex],
      targetName: enemy.name,
      damage: result.evaded ? 0 : result.finalDamage,
      skill: '普通攻擊',
      resource: `${member.resourceType}:${Math.floor(member.resourceCurrent)}/${member.resourceMax}`
    });
    const exhaustedMultiplier = member.manaExhausted ? 1.25 : 1;
    const trailSlowMultiplier = now < (member.blackstoneAttackSpeedPenaltyUntil || 0)
      ? 1 / Math.max(.1, 1 - (member.blackstoneAttackSpeedPenalty || 0))
      : 1;
    const skillHasteMultiplier = now < (member.skillHasteUntil || 0) ? 1 + (member.skillHasteBonus || 0) : 1;
    const blessingSpeedMultiplier = now < (member.lightGraceUntil || 0) ? 1 + (member.lightGraceAttackSpeed || 0) : 1;
    PartyPolicy.scheduleNextAttack(member, now, member.attackSpeed * skillHasteMultiplier * blessingSpeedMultiplier * (1 + (desperate?.speed || 0)), exhaustedMultiplier * trailSlowMultiplier);
  }
}

function processBlackForestCorruption(now = Date.now()) {
  const previousTick = Number(battle.lastCorruptionTickAt) || now;
  battle.lastCorruptionTickAt = now;
  const progress = getProgress();
  if (getActiveMap(progress).chapter !== 2) return;
  const elapsedSeconds = Math.max(0, now - previousTick) / 1000;
  (battle.partyMembers || []).forEach((member) => {
    if (!member.alive || member.currentHp <= 0) return;
    const hpLoss = BlackForestCorruptionPolicy.getHpLoss(member.maxHp, elapsedSeconds, progress.blackForestCorruption);
    member.currentHp = Math.max(0, member.currentHp - hpLoss);
    if (member.currentHp <= 0) defeatPartyMember(member, now);
  });
}

function spawnStrongholdWarlord(now = Date.now()) {
  if (battle.enemyTypes.includes('blackstoneStrongholdWarlord')) return false;
  const type = 'blackstoneStrongholdWarlord';
  const enemy = BlackstoneStrongholdPolicy.getCombatMonster(type);
  battle.enemyTypes.push(type);
  battle.enemyLevels.push(BlackstoneStrongholdPolicy.RULES.level);
  battle.enemyHps.push(enemy.maxHp);
  battle.enemyRespawns.push(null);
  battle.enemySpawnedAt.push(now);
  battle.enemyDots.push([]);
  battle.enemyDamages.push([]);
  battle.enemyNextAttackAt.push(now + getMonsterAttackInterval(enemy));
  battle.enemyBoarEnraged?.push(false);
  battle.enemyTrailSummoned?.push(false);
  battle.enemySummonProfiles?.push(null);
  battle.enemyCaptainShieldUntil?.push(0);
  battle.enemyAssassinDashUntil?.push(0);
  battle.enemySpiderNestPhase?.push(1);
  logBattle('♛ 五座據點皆已摧毀，【黑石督軍】率軍現身！', 'spawn');
  showToast('⚠ BOSS 出現：黑石督軍');
  return true;
}

function processStrongholdOutpost(now = Date.now()) {
  if (getActiveMap(getProgress()).id !== 'blackstone-stronghold') return false;
  const state = battle.blackstoneStrongholdState;
  if (!state?.outpostActive || now - (battle.lastStrongholdOutpostAttackAt || 0) < 1000) return false;
  battle.lastStrongholdOutpostAttackAt = now;
  const damage = Math.max(1, Math.round((battle.partyMembers || []).filter((member) => member.alive).reduce((total, member) => total + member.stats.attack, 0) * .65));
  const result = BlackstoneStrongholdPolicy.damageOutpost(state, damage, { now });
  battle.blackstoneStrongholdState = result.state;
  if (!result.ok) return false;
  const outpost = BlackstoneStrongholdPolicy.getOutpost(result.destroyedOutpostId || state.activeOutpostId);
  if (!result.destroyed) {
    logBattle(`🏹 隊伍集中攻擊【${outpost?.name || '黑石據點'}】，造成 ${result.damage} 點耐久傷害。`, 'damage-dealt', { aggregateKey: 'stronghold-outpost', damage: result.damage, summary: '🏹 隊伍攻擊黑石據點' });
    return true;
  }
  logBattle(`💥【${outpost?.name || '黑石據點'}】已摧毀，敵軍失去「${outpost?.effect.label || '據點增益'}」並狂暴 15 秒！`, 'progress');
  if (result.spawnBoss) spawnStrongholdWarlord(now);
  return true;
}

function battleTick() {
  if (!fighting) return;
  processEnemyRespawns();
  processEnemyDots();
  const now = Date.now();
  processBlackForestCorruption(now);
  if (!fighting) return;
  processStrongholdOutpost(now);
  reviveDefeatedTeammates(now);
  (battle.partyMembers || []).forEach((member) => {
    updatePartyMemberResource(member, now);
    updatePartyMemberHealthRegeneration(member, now);
  });
  processPartyMemberAttacks(now);
  queueDefeatedEnemies();
  syncLegacyBattleStateFromMain();
  updateBattleUI();
}

function getWoundedEnemyIndexes() {
  return aliveEnemyIndexesByAge().filter((index) => battle.enemyHps[index] < getEnemyDefinition(index).maxHp);
}

function healGoblinAlly(healerIndex, now = Date.now()) {
  const wounded = getWoundedEnemyIndexes();
  if (!wounded.length) return false;
  const targetIndex = wounded.sort((first, second) => (
    battle.enemyHps[first] / getEnemyDefinition(first).maxHp
    - battle.enemyHps[second] / getEnemyDefinition(second).maxHp
  ))[0];
  const target = getEnemyDefinition(targetIndex);
  const heal = Math.max(1, Math.ceil(target.maxHp * GoblinCampPolicy.SHAMAN_HEAL_RATIO));
  const restored = Math.min(heal, target.maxHp - battle.enemyHps[targetIndex]);
  battle.enemyHps[targetIndex] += restored;
  getEnemySkillState(healerIndex).shamanHealReadyAt = now + GoblinCampPolicy.SHAMAN_HEAL_COOLDOWN_MS;
  playMonsterAttackAnimation(healerIndex, false);
  logBattle(`✨【哥布林薩滿】施放治療術，替【${target.name}】恢復 ${restored} 生命。`, 'enemy-healing');
  return true;
}

function useGoblinHealingTotem(chiefIndex) {
  const wounded = getWoundedEnemyIndexes();
  if (!wounded.length) return false;
  let totalRestored = 0;
  wounded.forEach((index) => {
    const target = getEnemyDefinition(index);
    const heal = Math.max(1, Math.ceil(target.maxHp * .20));
    const restored = Math.min(heal, target.maxHp - battle.enemyHps[index]);
    battle.enemyHps[index] += restored;
    totalRestored += restored;
  });
  playMonsterAttackAnimation(chiefIndex, false);
  logBattle(`🗿【哥布林大酋長】立起治療圖騰，為自己與隊友共恢復 ${totalRestored} 生命。`, 'system');
  return true;
}

function summonGoblinScout(chiefIndex, now = Date.now()) {
  if (aliveEnemyIndexesByAge().length >= 4 || (battle.goblinScoutSummons || 0) >= 2) return false;
  const type = 'goblinScout';
  const scoutLevel = ChapterOneLevelPolicy.rollLevel('goblin-camp', type, Math.random());
  const scout = getMonsterDefinitionForMap(type, 'goblin-camp', scoutLevel);
  battle.enemyTypes.push(type);
  if (!battle.enemyLevels) battle.enemyLevels = [];
  battle.enemyLevels.push(scoutLevel);
  battle.enemyHps.push(scout.maxHp);
  battle.enemyRespawns.push(null);
  battle.enemySpawnedAt.push(now);
  battle.enemyDots.push([]);
  battle.enemyDamages.push([]);
  battle.enemyNextAttackAt.push(now + getMonsterAttackInterval(scout));
  battle.goblinScoutSummons = (battle.goblinScoutSummons || 0) + 1;
  playMonsterAttackAnimation(chiefIndex, false);
  logBattle('📯【哥布林大酋長】發出召喚，一名【哥布林斥候】加入戰鬥！', 'spawn');
  return true;
}

function inflictPlayerBleed(enemy, now = Date.now()) {
  const tickDamage = Math.max(2, Math.ceil((Number(enemy.attack) || 1) * .25));
  battle.playerBleed = {
    tickDamage,
    nextTickAt: now + WolfDenPolicy.BLEED_TICK_MS,
    expiresAt: now + WolfDenPolicy.BLEED_DURATION_MS
  };
  logBattle(`🩸【${enemy.name}】撕裂傷口，你陷入流血狀態！`, 'system');
}

function processPlayerBleed(now = Date.now()) {
  const bleed = battle.playerBleed;
  if (!bleed) return false;
  if (now >= bleed.expiresAt) {
    battle.playerBleed = null;
    logBattle('✚ 流血效果結束。', 'system');
    return true;
  }
  if (now < bleed.nextTickAt) return false;
  const ticks = Math.max(1, Math.floor((now - bleed.nextTickAt) / WolfDenPolicy.BLEED_TICK_MS) + 1);
  const damage = bleed.tickDamage * ticks;
  bleed.nextTickAt += WolfDenPolicy.BLEED_TICK_MS * ticks;
  battle.playerHp = Math.max(1, battle.playerHp - damage);
  logBattle(`🩸 流血造成 ${damage} 點持續傷害。`, 'damage-taken', {
    aggregateKey: 'enemy-bleed',
    damage,
    summary: '🩸 流血持續傷害'
  });
  return true;
}

function legacyEnemyAttackTick() {
  if (!fighting || battleScreen.classList.contains('hidden') || battle.dungeonComplete) return;
  const progress = getProgress();
  const character = getActiveCharacter();
  if (!character) return;
  const now = Date.now();
  const stats = getCharacterStats(progress.level, progress, character);
  const maxHp = getMaxHp(progress.level, progress);
  let attackOccurred = processPlayerBleed(now);

  for (const attackingEnemyIndex of aliveEnemyIndexesByAge()) {
    if (battle.enemyHps[attackingEnemyIndex] <= 0) continue;
    const attackingEnemy = getEnemyDefinition(attackingEnemyIndex);
    const nextAttackAt = battle.enemyNextAttackAt?.[attackingEnemyIndex];
    if (!Number.isFinite(nextAttackAt)) {
      battle.enemyNextAttackAt[attackingEnemyIndex] = now + getMonsterAttackInterval(attackingEnemy);
      continue;
    }
    if (nextAttackAt > now) continue;

    const enemyCurrentHp = battle.enemyHps[attackingEnemyIndex];
    const irritableActive = getActiveMap(progress).id === 'boar-woods'
      && BoarWoodsPolicy.isIrritableActive(attackingEnemy.id, enemyCurrentHp, attackingEnemy.maxHp);
    if (!battle.enemyBoarEnraged) battle.enemyBoarEnraged = battle.enemyTypes.map(() => false);
    if (irritableActive && !battle.enemyBoarEnraged?.[attackingEnemyIndex]) {
      battle.enemyBoarEnraged[attackingEnemyIndex] = true;
      logBattle(`💢【${attackingEnemy.name}】陷入暴躁，攻擊與攻速提高 15%！`, 'system');
    }
    battle.enemyNextAttackAt[attackingEnemyIndex] = now + getMonsterAttackInterval(attackingEnemy, enemyCurrentHp);
    attackOccurred = true;
    const attackingEnemyName = attackingEnemy.name;
    if (battle.dungeonId === 'goblin-camp') {
      const action = GoblinCampPolicy.resolveAction({
        type: battle.enemyTypes[attackingEnemyIndex],
        randomValue: Math.random(),
        hasWoundedAlly: getWoundedEnemyIndexes().length > 0,
        canHeal: now >= (getEnemySkillState(attackingEnemyIndex).shamanHealReadyAt || 0),
        canSummon: aliveEnemyIndexesByAge().length < 4 && (battle.goblinScoutSummons || 0) < 2
      });
      if (action === 'heal' && healGoblinAlly(attackingEnemyIndex, now)) continue;
      if (action === 'healing-totem' && useGoblinHealingTotem(attackingEnemyIndex)) continue;
      if (action === 'summon-scout' && summonGoblinScout(attackingEnemyIndex, now)) continue;
    }
    const monsterHitChance = attackingEnemy.mapId
      ? ChapterOneLevelPolicy.getMonsterHitChance(attackingEnemy.level, progress.level, stats.dodge)
      : 1 - stats.dodge;
    const dodged = Math.random() >= monsterHitChance;
    const monsterCritRate = attackingEnemy.isBoss ? .15 : attackingEnemy.isElite ? .10 : .05;
    const monsterCritical = !dodged && Math.random() < monsterCritRate;
    const rawEnemyHit = getMonsterAttackPower(attackingEnemy, progress, enemyCurrentHp) * (monsterCritical ? 1.5 : 1);
    const parried = !dodged && Math.random() < stats.parry;
    let enemyHit = dodged ? 0 : MonsterDefense.resolvePlayerDamage({
      baseDamage: rawEnemyHit,
      defense: stats.defense,
      damageReduction: stats.damageReduction
    }).finalDamage;
    if (parried) {
      enemyHit = Math.max(1, Math.ceil(enemyHit * .5));
      logBattle(`你招架了【${attackingEnemyName}】的攻擊，傷害降低 50%！`, 'damage-taken');
    }
    const absorbed = Math.min(battle.playerShield, enemyHit);
    battle.playerShield -= absorbed;
    enemyHit -= absorbed;
    battle.playerHp -= enemyHit;
    if (!dodged && WarriorResourcePolicy.isWarrior(character.job)) {
      battle.playerMana = WarriorResourcePolicy.gainFromHitTaken(battle.playerMana);
    }
    if (!dodged && enemyHit > 0 && getActiveMap(progress).id === 'wolf-den'
      && WolfDenPolicy.shouldInflictBleed(attackingEnemy.id, Math.random())) {
      inflictPlayerBleed(attackingEnemy, now);
      battle.enemyNextAttackAt[attackingEnemyIndex] = now + getMonsterAttackInterval(attackingEnemy);
    }
    if (!dodged && enemyHit > 0 && battle.dungeonId === 'goblin-camp'
      && GoblinCampPolicy.shouldStun(battle.enemyTypes[attackingEnemyIndex], Math.random())) {
      battle.playerStunnedUntil = Math.max(battle.playerStunnedUntil || 0, now + 1500);
      logBattle('💫【哥布林投石者】的投石命中要害，你陷入暈眩 1.5 秒！', 'system');
    }
    if (!dodged && enemyHit > 0 && getActiveMap(progress).id === 'boar-woods'
      && BoarWoodsPolicy.shouldCharge(attackingEnemy.id, Math.random())) {
      battle.playerStunnedUntil = Math.max(battle.playerStunnedUntil || 0, now + BoarWoodsPolicy.BOSS_CHARGE_STUN_MS);
      logBattle('💥【巨牙野豬】施放【衝撞】，你陷入暈眩 2 秒！', 'system');
    }

    if (dodged) logBattle(`【${attackingEnemyName}】發動攻擊，你成功閃避。`, 'damage-taken');
    else logBattle(`🩸【${attackingEnemyName}】對你造成 ${enemyHit} 傷害${monsterCritical ? '（暴擊）' : ''}${absorbed ? `，護盾吸收 ${absorbed}` : ''}。`, 'damage-taken', { aggregateKey: `enemy-${battle.enemyTypes[attackingEnemyIndex]}`, damage: enemyHit, summary: `🩸【${attackingEnemyName}】攻擊你${monsterCritical ? '（暴擊）' : ''}` });

    playMonsterAttackAnimation(attackingEnemyIndex, !dodged && enemyHit > 0);
    if (battle.playerHp > 0 && battle.playerHp / maxHp < 0.35) usePotion();
    if (battle.playerHp > 0) continue;

    endBattleAfterPlayerDefeat(now);
    return;
  }

  if (attackOccurred) updateBattleUI();
}

function inflictPartyMemberBleed(member, enemy, now = Date.now()) {
  member.bleed = {
    tickDamage: Math.max(2, Math.ceil((Number(enemy.attack) || 1) * .25)),
    nextTickAt: now + WolfDenPolicy.BLEED_TICK_MS,
    expiresAt: now + WolfDenPolicy.BLEED_DURATION_MS
  };
  logBattle(`${member.name} 受到 ${enemy.name} 的流血效果。`, 'system');
}

function healBlackForestDepthsAlly(healerIndex) {
  const wounded = getWoundedEnemyIndexes();
  if (!wounded.length) return false;
  const targetIndex = wounded.sort((first, second) => (
    battle.enemyHps[first] / getEnemyDefinition(first).maxHp
    - battle.enemyHps[second] / getEnemyDefinition(second).maxHp
  ))[0];
  const target = getEnemyDefinition(targetIndex);
  const heal = Math.max(1, Math.ceil(target.maxHp * BlackForestDepthsPolicy.SKILLS.forestSpirit.healRatio));
  const restored = Math.min(heal, target.maxHp - battle.enemyHps[targetIndex]);
  battle.enemyHps[targetIndex] += restored;
  playMonsterAttackAnimation(healerIndex, false);
  logBattle(`🌿【森林之魂】施放【自然回響】，替【${target.name}】恢復 ${restored} 生命。`, 'enemy-healing');
  return true;
}

function inflictBlackForestDot(member, enemy, effect, now = Date.now()) {
  const rule = effect === 'poison' ? BlackForestEntrancePolicy.POISON : BlackForestEntrancePolicy.BLEED;
  const poisonMultiplier = effect === 'poison' ? Math.max(0, 1 - (member.stats?.poisonResistancePercent || 0)) : 1;
  member.bleed = {
    effectName: effect === 'poison' ? '中毒' : '流血',
    tickMs: rule.tickMs,
    tickDamage: Math.max(1, Math.ceil((Number(enemy.attack) || 1) * rule.attackRatio * poisonMultiplier)),
    nextTickAt: now + rule.tickMs,
    expiresAt: now + rule.durationMs
  };
  logBattle(`${member.name} 受到 ${enemy.name} 的${member.bleed.effectName}效果。`, 'system');
}

function inflictBlackForestTrailPoison(member, enemy, now = Date.now()) {
  const rule = BlackForestTrailPolicy.POISON;
  const existingStacks = member.bleed?.effectName === '黑石毒素' ? member.bleed.stacks || 1 : 0;
  const stacks = Math.min(rule.maxStacks, existingStacks + 1);
  const baseTickDamage = Math.max(1, Math.ceil((Number(enemy.attack) || 1) * rule.attackRatio * Math.max(0, 1 - (member.stats?.poisonResistancePercent || 0))));
  member.bleed = {
    effectName: '黑石毒素',
    tickMs: rule.tickMs,
    stacks,
    tickDamage: baseTickDamage * stacks,
    nextTickAt: now + rule.tickMs,
    expiresAt: now + rule.durationMs
  };
  logBattle(`${member.name} 受到 ${enemy.name} 的黑石毒素效果（${stacks}／${rule.maxStacks} 層）。`, 'system');
}

function inflictBlackForestDepthsCorruption(member, enemy, now = Date.now()) {
  member.bleed = {
    effectName: '深林腐化',
    tickMs: 1000,
    tickDamage: Math.max(2, Math.ceil((Number(enemy.attack) || 1) * .16)),
    nextTickAt: now + 1000,
    expiresAt: now + 5000
  };
  logBattle(`${member.name} 受到 ${enemy.name} 的深林腐化效果。`, 'system');
}

function getSpiderNestPoisonStacks(member) {
  return member.bleed?.effectName === '蛛巢毒素' ? Number(member.bleed.stacks) || 0 : 0;
}

function inflictSpiderNestPoison(member, enemy, stackCount = 1, now = Date.now()) {
  const rule = SpiderNestPolicy.POISON;
  const existingStacks = getSpiderNestPoisonStacks(member);
  const maxStacks = enemy.id === 'giantSpider' ? rule.bossMaxStacks : rule.maxStacks;
  const stacks = Math.min(maxStacks, existingStacks + Math.max(1, stackCount));
  const baseTickDamage = Math.max(1, Math.ceil((Number(enemy.attack) || 1) * rule.attackRatio));
  member.bleed = {
    effectName: '蛛巢毒素', tickMs: rule.tickMs, stacks,
    tickDamage: baseTickDamage * stacks,
    nextTickAt: now + rule.tickMs,
    expiresAt: now + rule.durationMs
  };
  logBattle(`${member.name} 受到 ${enemy.name} 的蛛巢毒素（${stacks}／${maxStacks} 層）。`, 'system');
}

function countAliveSpiderNestSummons(type = null) {
  return (battle.enemyTrailSummoned || []).filter((summoned, index) => summoned && battle.enemyHps[index] > 0
    && (!type || battle.enemyTypes[index] === type)).length;
}

function summonSpiderNestMonster(type, summonerIndex, hpRatio, attackRatio, limit, message, now = Date.now()) {
  if (countAliveSpiderNestSummons(type) >= limit) return false;
  const base = SpiderNestPolicy.getCombatMonster(type);
  if (!base) return false;
  if (!battle.enemyTrailSummoned) battle.enemyTrailSummoned = battle.enemyTypes.map(() => false);
  if (!battle.enemySummonProfiles) battle.enemySummonProfiles = battle.enemyTypes.map(() => null);
  const profile = { hpRatio, attackRatio };
  const reusedIndex = battle.enemyTrailSummoned.findIndex((summoned, index) => summoned && battle.enemyHps[index] <= 0);
  const index = reusedIndex >= 0 ? reusedIndex : battle.enemyTypes.length;
  if (reusedIndex >= 0) {
    battle.enemyTypes[index] = type;
    battle.enemyLevels[index] = SpiderNestPolicy.MAP.level;
    battle.enemyRespawns[index] = null;
    battle.enemySpawnedAt[index] = now;
    battle.enemyDots[index] = [];
    battle.enemyDamages[index] = [];
    battle.enemyTrailSummoned[index] = true;
    battle.enemySummonProfiles[index] = profile;
  } else {
    battle.enemyTypes.push(type);
    battle.enemyLevels.push(SpiderNestPolicy.MAP.level);
    battle.enemyRespawns.push(null);
    battle.enemySpawnedAt.push(now);
    battle.enemyDots.push([]);
    battle.enemyDamages.push([]);
    battle.enemyTrailSummoned.push(true);
    battle.enemySummonProfiles.push(profile);
    battle.enemyBoarEnraged.push(false);
    battle.enemyNextAttackAt.push(null);
  }
  const summoned = getEnemyDefinition(index);
  battle.enemyHps[index] = summoned.maxHp;
  battle.enemyNextAttackAt[index] = now + getMonsterAttackInterval(summoned);
  playMonsterAttackAnimation(summonerIndex, false);
  logBattle(message, 'spawn');
  return true;
}

function summonBlackForestDepthsRoot(summonerIndex, now = Date.now()) {
  const type = 'corruptedTreant';
  const summonCount = (battle.enemyTrailSummoned || []).filter((summoned, index) => summoned
    && battle.enemyTypes[index] === type && battle.enemyHps[index] > 0).length;
  if (summonCount >= BlackForestDepthsPolicy.BOSS.rootSummonLimit) return false;
  if (!battle.enemyTrailSummoned) battle.enemyTrailSummoned = battle.enemyTypes.map(() => false);
  if (!battle.enemySummonProfiles) battle.enemySummonProfiles = battle.enemyTypes.map(() => null);
  const profile = { hpRatio: BlackForestDepthsPolicy.BOSS.rootSummonHpRatio, attackRatio: BlackForestDepthsPolicy.BOSS.rootSummonAttackRatio, name: '腐化根鬚' };
  const reusedIndex = battle.enemyTrailSummoned.findIndex((summoned, index) => summoned && battle.enemyHps[index] <= 0);
  const index = reusedIndex >= 0 ? reusedIndex : battle.enemyTypes.length;
  if (reusedIndex >= 0) {
    battle.enemyTypes[index] = type;
    battle.enemyLevels[index] = BlackForestDepthsPolicy.RULES.level;
    battle.enemyRespawns[index] = null;
    battle.enemySpawnedAt[index] = now;
    battle.enemyDots[index] = [];
    battle.enemyDamages[index] = [];
    battle.enemyTrailSummoned[index] = true;
    battle.enemySummonProfiles[index] = profile;
  } else {
    battle.enemyTypes.push(type);
    battle.enemyLevels.push(BlackForestDepthsPolicy.RULES.level);
    battle.enemyRespawns.push(null);
    battle.enemySpawnedAt.push(now);
    battle.enemyDots.push([]);
    battle.enemyDamages.push([]);
    battle.enemyTrailSummoned.push(true);
    battle.enemySummonProfiles.push(profile);
    battle.enemyBoarEnraged.push(false);
    battle.enemyNextAttackAt.push(null);
    battle.enemyDepthsPhase?.push(1);
  }
  const summoned = getEnemyDefinition(index);
  battle.enemyHps[index] = summoned.maxHp;
  battle.enemyNextAttackAt[index] = now + getMonsterAttackInterval(summoned);
  playMonsterAttackAnimation(summonerIndex, false);
  logBattle('🌑【黑森林之心】喚醒【腐化根鬚】，深林的根系加入戰鬥！', 'spawn');
  return true;
}

function processPartyMemberBleed(member, now = Date.now()) {
  const bleed = member.bleed;
  if (!bleed) return false;
  if (now >= bleed.expiresAt) {
    member.bleed = null;
    return true;
  }
  if (now < bleed.nextTickAt) return false;
  const tickMs = bleed.tickMs || WolfDenPolicy.BLEED_TICK_MS;
  const ticks = Math.max(1, Math.floor((now - bleed.nextTickAt) / tickMs) + 1);
  const damage = bleed.tickDamage * ticks;
  bleed.nextTickAt += tickMs * ticks;
  member.currentHp = Math.max(0, member.currentHp - damage);
  const effectName = bleed.effectName || '流血';
  logBattle(`${member.name} 因${effectName}受到 ${damage} 點傷害。`, 'damage-taken', {
    aggregateKey: `enemy-bleed-${member.id}`,
    damage,
    summary: `${member.name} 的${effectName}傷害`
  });
  return true;
}

function hasSummonedBlackstoneSpider() {
  return (battle.enemyTrailSummoned || []).some((summoned, index) => summoned
    && battle.enemyTypes[index] === 'blackstonePoisonSpider' && battle.enemyHps[index] > 0);
}

function summonBlackstonePoisonSpider(beastmasterIndex, now = Date.now()) {
  if (hasSummonedBlackstoneSpider()) return false;
  const type = 'blackstonePoisonSpider';
  const spider = BlackForestTrailPolicy.getCombatMonster(type);
  if (!spider) return false;
  if (!battle.enemyTrailSummoned) battle.enemyTrailSummoned = battle.enemyTypes.map(() => false);
  const reusedIndex = battle.enemyTrailSummoned.findIndex((summoned, index) => summoned && battle.enemyHps[index] <= 0);
  if (reusedIndex >= 0) {
    battle.enemyTypes[reusedIndex] = type;
    battle.enemyLevels[reusedIndex] = 17;
    battle.enemyHps[reusedIndex] = Math.max(1, Math.round(spider.maxHp * .70));
    battle.enemyRespawns[reusedIndex] = null;
    battle.enemySpawnedAt[reusedIndex] = now;
    battle.enemyDots[reusedIndex] = [];
    battle.enemyDamages[reusedIndex] = [];
    battle.enemyNextAttackAt[reusedIndex] = now + getMonsterAttackInterval(spider);
    battle.enemyBoarEnraged[reusedIndex] = false;
    playMonsterAttackAnimation(beastmasterIndex, false);
    logBattle('🕷【黑石訓獸師】施放【放養蜘蛛】，一隻削弱版黑石毒蜘蛛加入戰鬥！', 'spawn');
    return true;
  }
  battle.enemyTypes.push(type);
  battle.enemyLevels.push(17);
  battle.enemyHps.push(Math.max(1, Math.round(spider.maxHp * .70)));
  battle.enemyRespawns.push(null);
  battle.enemySpawnedAt.push(now);
  battle.enemyDots.push([]);
  battle.enemyDamages.push([]);
  battle.enemyNextAttackAt.push(now + getMonsterAttackInterval(spider));
  battle.enemyBoarEnraged.push(false);
  battle.enemyTrailSummoned.push(true);
  playMonsterAttackAnimation(beastmasterIndex, false);
  logBattle('🕷【黑石訓獸師】施放【放養蜘蛛】，一隻削弱版黑石毒蜘蛛加入戰鬥！', 'spawn');
  return true;
}

function applyBlackstoneAttackSpeedPenalty(member, penalty, durationMs, now, sourceName) {
  const activePenalty = now < (member.blackstoneAttackSpeedPenaltyUntil || 0) ? member.blackstoneAttackSpeedPenalty || 0 : 0;
  member.blackstoneAttackSpeedPenalty = Math.min(1 - SpiderNestPolicy.CONTROL.minimumAttackSpeedRatio, Math.max(activePenalty, penalty));
  member.blackstoneAttackSpeedPenaltyUntil = Math.max(member.blackstoneAttackSpeedPenaltyUntil || 0, now + durationMs);
  logBattle(`${member.name} 受到【${sourceName}】，攻擊速度降低 ${Math.round(penalty * 100)}%！`, 'system');
}

function activateBlackstoneCommand(durationMs, now, sourceName) {
  battle.blackstoneCommandUntil = Math.max(battle.blackstoneCommandUntil || 0, now + durationMs);
  logBattle(`📣【${sourceName}】施放【隊長號令】，全體黑石怪攻擊提高 15%，持續 6 秒！`, 'system');
}

function endBattleAfterPlayerDefeat(now = Date.now()) {
  if (battle.defeatHandled) return false;
  battle.defeatHandled = true;
  fighting = false;
  clearInterval(battleTimer);
  clearInterval(skillTimer);
  clearInterval(enemyAttackTimer);
  battle.sessionId = ++battleSessionSequence;
  battle.dungeonComplete = true;
  (battle.partyMembers || []).forEach((member) => {
    member.currentHp = member.maxHp;
    member.resourceCurrent = member.resourceType === 'rage' ? 0 : getMaxCombatResourceForMember(member.character, member.progress);
    member.shield = 0;
    member.alive = true;
    member.undeadRevived = false;
    member.bleed = null;
    member.stunnedUntil = 0;
    member.targetIndex = -1;
    member.reviveAt = null;
  });
  syncLegacyBattleStateFromMain();
  persistPartyRuntimeState();
  const progress = getProgress();
  if (battle.isDungeon) {
    progress.selectedMapId = progress.dungeonReturnMapId || (battle.dungeonId === 'black-forest-altar' ? 'black-forest' : 'plains-entrance');
    progress.dungeonAdmission = false;
  }
  progress.requiresMapSelectionAfterDefeat = true;
  saveProgress(progress);
  logPartyDebug('主角色戰敗結束掛機', { at: now });
  openVillage('menu');
  showToast('角色已戰敗，本次掛機已結束。');
  return true;
}

function defeatPartyMember(member, now = Date.now()) {
  if (member.currentHp > 0 || !member.alive) return false;
  if (!member.isMain && member.character.race === 'undead' && !member.undeadRevived && Math.random() < .35) {
    member.undeadRevived = true;
    member.currentHp = Math.ceil(member.maxHp * .35);
    logBattle(`${member.name} 以不死族之力重新站起。`, 'system');
    return false;
  }
  member.currentHp = 0;
  member.alive = false;
  member.targetIndex = -1;
  member.bleed = null;
  member.stunnedUntil = 0;
  member.blackstoneMarkedUntil = 0;
  member.blackstoneArmorBreakUntil = 0;
  member.spiderNestArmorBreakUntil = 0;
  member.blackstoneAttackSpeedPenaltyUntil = 0;
  member.blackstoneAttackSpeedPenalty = 0;
  member.nextAttackAt = Number.POSITIVE_INFINITY;
  member.reviveAt = member.isMain ? null : now + PARTY_REVIVE_DELAY_MS;
  logPartyDebug('死亡事件', { memberId: member.id, memberName: member.name, at: now });
  logBattle(`${member.name} 已倒下。`, 'system');
  if (member.isMain) endBattleAfterPlayerDefeat(now);
  return true;
}

function reviveDefeatedTeammates(now = Date.now()) {
  const progress = getProgress();
  let revived = 0;
  for (const member of battle.partyMembers || []) {
    if (member.isMain || member.alive || !Number.isFinite(member.reviveAt) || now < member.reviveAt) continue;
    if ((progress.potions || 0) <= 0) continue;
    progress.potions -= 1;
    removePotionItem(progress);
    member.currentHp = Math.max(1, Math.ceil(member.maxHp * PARTY_REVIVE_HEALTH_RATIO));
    member.alive = true;
    member.shield = 0;
    member.bleed = null;
    member.stunnedUntil = 0;
    member.blackstoneMarkedUntil = 0;
    member.blackstoneArmorBreakUntil = 0;
    member.spiderNestArmorBreakUntil = 0;
    member.blackstoneAttackSpeedPenaltyUntil = 0;
    member.blackstoneAttackSpeedPenalty = 0;
    member.nextAttackAt = now + 1000;
    member.targetIndex = -1;
    member.reviveAt = null;
    revived += 1;
    logBattle(`🧪 使用主要角色的治癒藥水，${member.name}以 30% 生命復活。`, 'healing');
  }
  if (revived) saveProgress(progress);
  return revived;
}

function resetPartyAfterDefeat(now = Date.now()) {
  if (!PartyPolicy.isPartyDefeated(battle.partyMembers)) return false;
  logPartyDebug('戰鬥失敗事件', {
    members: battle.partyMembers.map((member) => `${member.id}:${member.name}:dead`).join(',')
  });
  battle.partyMembers.forEach(member => {
    member.currentHp = member.maxHp;
    member.resourceCurrent = member.resourceType === 'rage' ? 0 : getMaxCombatResourceForMember(member.character, member.progress);
    member.shield = 0;
    member.alive = true;
    member.undeadRevived = false;
    member.bleed = null;
    member.stunnedUntil = 0;
    member.blackstoneMarkedUntil = 0;
    member.blackstoneArmorBreakUntil = 0;
    member.spiderNestArmorBreakUntil = 0;
    member.blackstoneAttackSpeedPenaltyUntil = 0;
    member.blackstoneAttackSpeedPenalty = 0;
    member.nextAttackAt = now + 1000;
    member.targetIndex = -1;
    member.reviveAt = null;
  });
  resetAliveEnemyAttackSchedule(now);
  syncLegacyBattleStateFromMain();
  persistPartyRuntimeState();
  logBattle('全隊倒下，已撤退並恢復隊伍狀態。', 'system');
  return true;
}

function enemyAttackTick() {
  if (!fighting || battleScreen.classList.contains('hidden') || battle.dungeonComplete) return;
  if (!battle.partyMembers?.length) rebuildBattlePartyMembers();
  const progress = getProgress();
  const now = Date.now();
  let attackOccurred = false;

  if (!battle.enemyAffixRegenAt) battle.enemyAffixRegenAt = battle.enemyTypes.map(() => now);
  battle.enemyHps.forEach((hp, index) => {
    if (hp <= 0) return;
    const regeneration = EliteAffixPolicy.getRegeneration(battle.enemyAffixes?.[index] || []);
    if (!regeneration || now - (battle.enemyAffixRegenAt[index] || now) < regeneration.regenerationIntervalMs) return;
    battle.enemyAffixRegenAt[index] = now;
    const enemy = getEnemyDefinition(index);
    const restored = Math.min(Math.max(1, Math.ceil(enemy.maxHp * regeneration.regenerationRatio)), enemy.maxHp - hp);
    if (restored > 0) {
      battle.enemyHps[index] += restored;
      logBattle(`♻【${enemy.name}】觸發【再生】，恢復 ${restored} 生命。`, 'enemy-healing');
      attackOccurred = true;
    }
  });

  if (getActiveMap(progress).id === 'blackstone-stronghold' && now - (battle.lastStrongholdRegenAt || 0) >= 1000) {
    battle.lastStrongholdRegenAt = now;
    battle.enemyHps.forEach((hp, index) => {
      if (hp <= 0) return;
      const enemy = getEnemyDefinition(index);
      if (!(enemy.healthRegenPerSecond > 0)) return;
      battle.enemyHps[index] = Math.min(enemy.maxHp, hp + Math.max(1, Math.ceil(enemy.maxHp * enemy.healthRegenPerSecond)));
    });
  }

  reviveDefeatedTeammates(now);

  battle.partyMembers.filter(member => member.alive).forEach(member => {
    attackOccurred = processPartyMemberBleed(member, now) || attackOccurred;
    if (!member.isMain && member.currentHp > 0 && member.currentHp / member.maxHp < PARTY_AUTO_POTION_HEALTH_RATIO) {
      useSharedHealingPotionForMember(member);
    }
    defeatPartyMember(member, now);
  });
  if (!fighting) return;
  if (resetPartyAfterDefeat(now)) {
    updateBattleUI();
    return;
  }

  for (const enemyIndex of aliveEnemyIndexesByAge()) {
    if (battle.enemyHps[enemyIndex] <= 0) continue;
    const enemy = getEnemyDefinition(enemyIndex);
    const nextAttackAt = battle.enemyNextAttackAt?.[enemyIndex];
    if (!Number.isFinite(nextAttackAt)) {
      battle.enemyNextAttackAt[enemyIndex] = now + getMonsterAttackInterval(enemy);
      continue;
    }
    if (nextAttackAt > now) continue;

    const enemySkillState = getEnemySkillState(enemyIndex);
    if (now < enemySkillState.stunnedUntil || now < enemySkillState.frozenUntil) {
      battle.enemyNextAttackAt[enemyIndex] = now + 250;
      continue;
    }

    const enemyCurrentHp = battle.enemyHps[enemyIndex];
    battle.enemyNextAttackAt[enemyIndex] = now + getMonsterAttackInterval(enemy, enemyCurrentHp);
    attackOccurred = true;

    const plainsAction = getActiveMap(progress).id === 'plains-depths'
      ? PlainsDepthsPolicy.resolveActiveSkill(enemy.id, Math.random(), enemyCurrentHp < enemy.maxHp)
      : 'attack';
    if (plainsAction === 'heal') {
      const restored = Math.min(Math.ceil(enemy.maxHp * PlainsDepthsPolicy.KNIGHT_HEAL_RATIO), enemy.maxHp - enemyCurrentHp);
      battle.enemyHps[enemyIndex] += restored;
      logBattle(`✚【${enemy.name}】施放治療，恢復 ${restored} 生命。`, 'enemy-healing');
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }
    if (plainsAction === 'roar') {
      battle.blackstoneRoarUntil = now + PlainsDepthsPolicy.ROAR_DURATION_MS;
      logBattle('📣【黑石頭目】施放【怒吼】，黑石系列怪物攻擊提高 10%！', 'system');
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }

    if (battle.dungeonId === 'goblin-camp') {
      const action = GoblinCampPolicy.resolveAction({
        type: battle.enemyTypes[enemyIndex],
        randomValue: Math.random(),
        hasWoundedAlly: getWoundedEnemyIndexes().length > 0,
        canHeal: now >= (getEnemySkillState(enemyIndex).shamanHealReadyAt || 0),
        canSummon: aliveEnemyIndexesByAge().length < 4 && (battle.goblinScoutSummons || 0) < 2
      });
      if (action === 'heal' && healGoblinAlly(enemyIndex, now)) continue;
      if (action === 'healing-totem' && useGoblinHealingTotem(enemyIndex)) continue;
      if (action === 'summon-scout' && summonGoblinScout(enemyIndex, now)) continue;
    }

    const aliveMembers = battle.partyMembers.filter((member) => member.alive);
    const target = ['blackForestHunter', 'blackstoneCaptain', 'blackstoneCenturion', 'blackstoneVenomHunter', 'blackstoneVenombladeAssassin', 'blackstoneStrongholdCrossbowman', 'blackstoneStrongholdWarlord'].includes(enemy.id)
      ? aliveMembers.sort((first, second) => first.currentHp / first.maxHp - second.currentHp / second.maxHp)[0]
      : PartyPolicy.chooseRandomAliveMember(battle.partyMembers, Math.random);
    if (!target) break;
    logPartyDebug('怪物選擇隊員', {
      attackerId: battle.enemyTypes[enemyIndex],
      attackerName: enemy.name,
      targetId: target.id,
      targetName: target.name
    });
    const stats = getCharacterStats(target.level, target.progress, target.character);
    const lowHealthAssassin = target.job === 'assassin' && target.level >= 20 && target.currentHp / target.maxHp <= .3;
    if (!lowHealthAssassin) target.desperateLowActive = false;
    if (lowHealthAssassin && !target.desperateLowActive) {
      target.desperateLowActive = true;
      const desperate = ClassSkillPolicy.getEffect('assassin', 'desperate-counter', Number(target.progress.skillLevels?.['assassin:desperate-counter']) || 1);
      if (!target.desperateEntryTriggered && desperate.entryDodge) {
        target.desperateEntryTriggered = true;
        target.desperateDodgeUntil = now + (desperate.entryDuration || 3) * 1000;
        target.desperateEntryDodge = desperate.entryDodge;
      }
    }
    const transientDodge = now < (target.desperateDodgeUntil || 0) ? target.desperateEntryDodge || 0 : 0;
    const monsterHitChance = enemy.mapId
      ? ChapterOneLevelPolicy.getMonsterHitChance(enemy.level, target.level, Math.min(.9, stats.dodge + transientDodge))
      : 1 - Math.min(.9, stats.dodge + transientDodge);
    let dodged = Math.random() >= monsterHitChance;
    if (!dodged && target.job === 'mage' && target.level >= 8) {
      const blink = ClassSkillPolicy.getEffect('mage', 'blink', Number(target.progress.skillLevels?.['mage:blink']) || 1);
      if (now >= (target.blinkReadyAt || 0) && Math.random() < blink.chance) {
        dodged = true;
        target.blinkReadyAt = now + (blink.internalCooldown || 10) * 1000;
        target.blinkCooldownReduction = blink.nextCooldownReduction || 0;
        logBattle(`💨 ${target.name}觸發【閃現】，完全避開攻擊！`, 'system');
      }
    }
    const critical = !dodged && Math.random() < (enemy.criticalChance ?? (enemy.isBoss ? .15 : enemy.isElite ? .10 : .05));
    const blackForestAction = getActiveMap(progress).id === 'black-forest-entrance'
      ? BlackForestEntrancePolicy.resolveAction(enemy.id, Math.random(), target.currentHp / target.maxHp, enemyCurrentHp, enemy.maxHp)
      : 'attack';
    let blackForestTrailAction = getActiveMap(progress).id === 'black-forest-trail'
      ? BlackForestTrailPolicy.resolveAction(enemy.id, Math.random(), target.currentHp / target.maxHp, enemyCurrentHp, enemy.maxHp)
      : 'attack';
    const spiderNestActive = getActiveMap(progress).id === 'spider-nest';
    const poisonStacks = getSpiderNestPoisonStacks(target);
    const currentBossPhase = SpiderNestPolicy.getBossPhase(enemy.id, enemyCurrentHp, enemy.maxHp);
    if (spiderNestActive && enemy.id === 'giantSpider') {
      if (!battle.enemySpiderNestPhase) battle.enemySpiderNestPhase = battle.enemyTypes.map(() => 1);
      const previousPhase = battle.enemySpiderNestPhase[enemyIndex] || 1;
      battle.enemySpiderNestPhase[enemyIndex] = currentBossPhase;
      if (currentBossPhase === 2 && previousPhase < 2) {
        summonSpiderNestMonster('spiderNestBlackstonePoisonSpider', enemyIndex, SpiderNestPolicy.BOSS.summonHpRatio, SpiderNestPolicy.BOSS.summonAttackRatio, SpiderNestPolicy.BOSS.summonLimit, '🥚【巨大蜘蛛】進入孵化階段，一隻削弱版黑石毒蜘蛛破卵而出！', now);
      }
      if (currentBossPhase === 3 && previousPhase < 3) logBattle('🕷【巨大蜘蛛】進入【巢穴狂暴】，攻擊與攻速提高，但防禦降低！', 'system');
    }
    let spiderNestAction = spiderNestActive
      ? SpiderNestPolicy.resolveAction(enemy.id, Math.random(), poisonStacks, enemyCurrentHp, enemy.maxHp,
        enemy.id === 'spiderNestBlackstoneBeastmaster'
          ? countAliveSpiderNestSummons('venomSpitterSpider') < SpiderNestPolicy.BEASTMASTER.summonLimit
          : countAliveSpiderNestSummons('spiderNestBlackstonePoisonSpider') < SpiderNestPolicy.BOSS.summonLimit)
      : 'attack';
    const blackForestDepthsActive = getActiveMap(progress).id === 'black-forest-depths';
    if (blackForestDepthsActive && enemy.id === 'heartOfTheBlackForest') {
      if (!battle.enemyDepthsPhase) battle.enemyDepthsPhase = battle.enemyTypes.map(() => 1);
      const depthsPhase = BlackForestDepthsPolicy.getBossPhase(enemy.id, enemyCurrentHp, enemy.maxHp);
      const previousDepthsPhase = battle.enemyDepthsPhase[enemyIndex] || 1;
      battle.enemyDepthsPhase[enemyIndex] = depthsPhase;
      if (depthsPhase >= 2 && previousDepthsPhase < 2) {
        logBattle('🌑【黑森林之心】進入第二階段【根脈甦醒】，攻擊提高 15%！', 'system');
        summonBlackForestDepthsRoot(enemyIndex, now);
      }
      if (depthsPhase >= 3 && previousDepthsPhase < 3) {
        logBattle('💜【黑森林之心】進入第三階段【核心崩裂】，攻擊與攻速大幅提高，但防禦降低！', 'system');
        summonBlackForestDepthsRoot(enemyIndex, now);
      }
    }
    const strongholdAction = getActiveMap(progress).id === 'blackstone-stronghold'
      ? BlackstoneStrongholdPolicy.resolveAction(enemy.id, Math.random(), target.currentHp / target.maxHp, enemyCurrentHp, enemy.maxHp)
      : 'attack';
    const forestAltarAction = getActiveMap(progress).id === 'forest-altar'
      ? ForestAltarPolicy.resolveAction(enemy.id, Math.random())
      : 'attack';
    const blackForestDepthsAction = getActiveMap(progress).id === 'black-forest-depths'
      ? BlackForestDepthsPolicy.resolveAction(enemy.id, Math.random(), getWoundedEnemyIndexes().length > 0)
      : 'attack';
    if (blackForestDepthsAction === 'nature-echo' && healBlackForestDepthsAlly(enemyIndex)) continue;
    if (strongholdAction === 'lion-roar' || strongholdAction === 'warlord-command') {
      battle.strongholdCommandUntil = Math.max(battle.strongholdCommandUntil || 0, now + BlackstoneStrongholdPolicy.LION_GUARD.roarDurationMs);
      logBattle(`📣【${enemy.name}】施放【${strongholdAction === 'lion-roar' ? '獅吼' : '督軍號令'}】，黑石據點敵軍攻擊提高 15%，持續 6 秒！`, 'system');
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }
    if (spiderNestAction === 'whip-spiders') {
      battle.spiderNestCommandUntil = Math.max(battle.spiderNestCommandUntil || 0, now + SpiderNestPolicy.BEASTMASTER.commandDurationMs);
      logBattle('⛓【黑石訓獸師】施放【鞭策蜘蛛】，蜘蛛攻擊提高 25%、攻速提高 20%，持續 7 秒！', 'system');
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }
    if (spiderNestAction === 'release-spitter') {
      if (summonSpiderNestMonster('venomSpitterSpider', enemyIndex, SpiderNestPolicy.BEASTMASTER.summonHpRatio, SpiderNestPolicy.BEASTMASTER.summonAttackRatio, SpiderNestPolicy.BEASTMASTER.summonLimit, '🕷【黑石訓獸師】施放【放養蜘蛛】，一隻削弱版噴毒蜘蛛加入戰鬥！', now)) continue;
      spiderNestAction = 'attack';
    }
    if (spiderNestAction === 'hatch-spider-eggs') {
      if (summonSpiderNestMonster('spiderNestBlackstonePoisonSpider', enemyIndex, SpiderNestPolicy.BOSS.summonHpRatio, SpiderNestPolicy.BOSS.summonAttackRatio, SpiderNestPolicy.BOSS.summonLimit, '🥚【巨大蜘蛛】施放【孵化蛛卵】，一隻削弱版黑石毒蜘蛛加入戰鬥！', now)) continue;
      spiderNestAction = 'attack';
    }
    if (spiderNestAction === 'shadow-dash') {
      if (!battle.enemyAssassinDashUntil) battle.enemyAssassinDashUntil = battle.enemyTypes.map(() => 0);
      battle.enemyAssassinDashUntil[enemyIndex] = now + SpiderNestPolicy.ASSASSIN.dashDurationMs;
    }
    if (spiderNestAction === 'web-entangle') {
      applyBlackstoneAttackSpeedPenalty(target, SpiderNestPolicy.CONTROL.webPenalty, SpiderNestPolicy.CONTROL.webDurationMs, now, '蛛絲纏繞');
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }
    if (blackForestTrailAction === 'beast-command') {
      battle.blackstoneSpiderCommandUntil = Math.max(battle.blackstoneSpiderCommandUntil || 0, now + BlackForestTrailPolicy.BEASTMASTER.commandDurationMs);
      logBattle('⛓【黑石訓獸師】施放【鞭策】，黑石毒蜘蛛攻擊與攻速提高 20%，持續 6 秒！', 'system');
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }
    if (blackForestTrailAction === 'release-spider') {
      if (summonBlackstonePoisonSpider(enemyIndex, now)) continue;
      blackForestTrailAction = 'attack';
    }
    if (blackForestTrailAction === 'captain-command') {
      activateBlackstoneCommand(BlackForestTrailPolicy.CAPTAIN.commandDurationMs, now, enemy.name);
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }
    if (blackForestTrailAction === 'shield-counter') {
      if (!battle.enemyCaptainShieldUntil) battle.enemyCaptainShieldUntil = battle.enemyTypes.map(() => 0);
      battle.enemyCaptainShieldUntil[enemyIndex] = now + BlackForestTrailPolicy.CAPTAIN.shieldDurationMs;
      logBattle(`🛡【${enemy.name}】進入【盾架反擊】，招架提高並會反擊，持續 5 秒！`, 'system');
      playMonsterAttackAnimation(enemyIndex, false);
      continue;
    }
    const activeDamageMultiplier = PlainsDepthsPolicy.getActiveDamageMultiplier(plainsAction)
      * BlackForestEntrancePolicy.getDamageMultiplier(blackForestAction)
      * BlackForestTrailPolicy.getDamageMultiplier(blackForestTrailAction)
      * SpiderNestPolicy.getDamageMultiplier(spiderNestAction, poisonStacks)
      * BlackstoneStrongholdPolicy.getDamageMultiplier(strongholdAction)
      * ForestAltarPolicy.getDamageMultiplier(forestAltarAction)
      * BlackForestDepthsPolicy.getDamageMultiplier(blackForestDepthsAction);
    const marked = now < (target.blackstoneMarkedUntil || 0);
    const markedHumanBonus = marked && enemy.faction === 'blackstone-bandits'
      ? 1 + BlackForestTrailPolicy.MARK.blackstoneHumanDamageBonus : 1;
    const markedArcherBonus = marked && enemy.id === 'blackstoneArcher'
      ? 1 + BlackForestTrailPolicy.MARK.archerDamageBonus : 1;
    const holyAttackMultiplier = now < enemySkillState.attackDownUntil ? 1 - enemySkillState.attackDown : 1;
    const eliteAffixDamageMultiplier = EliteAffixPolicy.getDamageMultiplier(enemy.eliteAffixes, target.currentHp / target.maxHp);
    const rawDamage = getMonsterAttackPower(enemy, progress, enemyCurrentHp) * holyAttackMultiplier * activeDamageMultiplier * markedHumanBonus * markedArcherBonus * eliteAffixDamageMultiplier * (critical ? 1.5 : 1);
    const parried = !dodged && Math.random() < stats.parry;
    const armorBreakMultiplier = now < (target.blackstoneArmorBreakUntil || 0)
      ? 1 - BlackForestTrailPolicy.RAIDER.armorBreakPenalty : 1;
    const spiderNestArmorMultiplier = now < (target.spiderNestArmorBreakUntil || 0) ? .90 : 1;
    const piercingMultiplier = (1 - BlackForestTrailPolicy.getDefenseIgnore(blackForestTrailAction))
      * (1 - BlackstoneStrongholdPolicy.getDefenseIgnore(strongholdAction));
    let damage = dodged ? 0 : MonsterDefense.resolvePlayerDamage({
      baseDamage: rawDamage,
      defense: Math.max(0, Math.round(stats.defense * armorBreakMultiplier * spiderNestArmorMultiplier * piercingMultiplier)),
      damageReduction: Math.min(.9, stats.damageReduction + (now < (target.manaShieldReductionUntil || 0) ? target.manaShieldDamageReduction || 0 : 0))
    }).finalDamage;
    if (parried) damage = Math.max(1, Math.ceil(damage * .5));
    const absorbed = Math.min(target.shield || 0, damage);
    target.shield = Math.max(0, (target.shield || 0) - absorbed);
    damage -= absorbed;
    target.currentHp = Math.max(0, target.currentHp - damage);
    const directDamageLeech = EliteAffixPolicy.getDirectDamageLeech(enemy.eliteAffixes);
    if (damage > 0 && directDamageLeech > 0) {
      const restored = Math.min(Math.max(1, Math.floor(damage * directDamageLeech)), enemy.maxHp - battle.enemyHps[enemyIndex]);
      if (restored > 0) {
        battle.enemyHps[enemyIndex] += restored;
        logBattle(`🩸【${enemy.name}】觸發【嗜血】，恢復 ${restored} 生命。`, 'enemy-healing');
      }
    }

    if (target.currentHp > 0 && target.currentHp / target.maxHp < .3 && target.job === 'mage' && target.level >= 20 && now >= (target.manaShieldReadyAt || 0)) {
      const shield = ClassSkillPolicy.getEffect('mage', 'mana-shield', Number(target.progress.skillLevels?.['mage:mana-shield']) || 1);
      const manaCost = target.resourceMax * shield.manaCost;
      if (target.resourceCurrent >= manaCost) {
        target.resourceCurrent -= manaCost;
        target.shield += target.maxHp * shield.shield;
        target.manaShieldReadyAt = now + shield.internalCooldown * 1000;
        target.manaShieldReductionUntil = now + 6000;
        target.manaShieldDamageReduction = shield.damageReduction || 0;
        logBattle(`🛡 ${target.name}觸發【魔力護盾】！`, 'system');
      }
    }
    if (target.currentHp > 0 && target.currentHp / target.maxHp < .3 && target.job === 'priest' && target.level >= 8 && now >= (target.holyProtectionReadyAt || 0)) {
      const protection = ClassSkillPolicy.getEffect('priest', 'holy-protection', Number(target.progress.skillLevels?.['priest:holy-protection']) || 1);
      target.shield += target.maxHp * protection.shield;
      target.holyProtectionReadyAt = now + protection.cooldown * 1000;
      target.holyProtectionUntil = now + 6000;
      if (protection.cleanse) target.bleed = null;
      logBattle(`✨ ${target.name}觸發【神聖庇護】！`, 'system');
    }

    const counterTargetAlive = battle.enemyHps[enemyIndex] > 0;
    if (counterTargetAlive && target.job === 'warrior' && target.level >= 20 && parried) {
      const counter = ClassSkillPolicy.getEffect('warrior', 'parry', Number(target.progress.skillLevels?.['warrior:parry']) || 1);
      applyDamageToMonster(enemyIndex, target.stats.attack * counter.counterPower, getPlayerAttackProfile(target.character), { attacker: target, attackKind: 'counter', canParry: false });
    }
    if (counterTargetAlive && target.job === 'assassin' && target.level >= 8 && dodged) {
      const counter = ClassSkillPolicy.getEffect('assassin', 'evasion', Number(target.progress.skillLevels?.['assassin:evasion']) || 1);
      if (counter.counterPower) applyDamageToMonster(enemyIndex, target.stats.attack * counter.counterPower, getPlayerAttackProfile(target.character), { attacker: target, attackKind: 'counter', canParry: false });
    }

    if (!dodged && WarriorResourcePolicy.isWarrior(target.character.job)) {
      target.resourceCurrent = WarriorResourcePolicy.gainFromHitTaken(target.resourceCurrent);
    }
    if (!dodged && damage > 0 && getActiveMap(progress).id === 'wolf-den'
      && WolfDenPolicy.shouldInflictBleed(enemy.id, Math.random())) {
      inflictPartyMemberBleed(target, enemy, now);
      battle.enemyNextAttackAt[enemyIndex] = now + getMonsterAttackInterval(enemy);
    }
    if (!dodged && damage > 0 && battle.dungeonId === 'goblin-camp'
      && GoblinCampPolicy.shouldStun(battle.enemyTypes[enemyIndex], Math.random())) {
      target.stunnedUntil = Math.max(target.stunnedUntil || 0, now + 1500);
    }
    if (!dodged && damage > 0 && getActiveMap(progress).id === 'boar-woods'
      && BoarWoodsPolicy.shouldCharge(enemy.id, Math.random())) {
      target.stunnedUntil = Math.max(target.stunnedUntil || 0, now + BoarWoodsPolicy.BOSS_CHARGE_STUN_MS);
    }
    if (!dodged && damage > 0 && plainsAction === 'rend') inflictPartyMemberBleed(target, enemy, now);
    if (!dodged && damage > 0 && plainsAction === 'charge') {
      target.stunnedUntil = Math.max(target.stunnedUntil || 0, now + PlainsDepthsPolicy.CHARGE_STUN_MS);
      logBattle(`💥【${enemy.name}】施放【衝撞】，${target.name}暈眩 2 秒！`, 'system');
    }
    if (!dodged && damage > 0 && plainsAction === 'dive') logBattle(`🦅【${enemy.name}】施放【俯衝】，造成雙倍傷害！`, 'system');
    if (!dodged && damage > 0 && plainsAction === 'smash') logBattle(`💢【${enemy.name}】施放【猛擊】，攻擊傷害提高！`, 'system');
    if (!dodged && damage > 0 && blackForestAction === 'shadow-bite') inflictBlackForestDot(target, enemy, 'bleed', now);
    if (!dodged && damage > 0 && blackForestAction === 'venom-fang') inflictBlackForestDot(target, enemy, 'poison', now);
    if (!dodged && damage > 0 && blackForestAction === 'charge') {
      target.stunnedUntil = Math.max(target.stunnedUntil || 0, now + BlackForestEntrancePolicy.CONTROL.chargeStunMs);
      logBattle(`💥【${enemy.name}】施放【衝撞】，${target.name}暈眩 1 秒！`, 'system');
    }
    if (!dodged && damage > 0 && blackForestAction === 'entangling-roots') {
      target.stunnedUntil = Math.max(target.stunnedUntil || 0, now + BlackForestEntrancePolicy.CONTROL.rootDurationMs);
      logBattle(`🌿【${enemy.name}】施放【纏繞根鬚】，${target.name}受困 4 秒！`, 'system');
    }
    if (!dodged && damage > 0 && blackForestAction === 'binding-arrow') logBattle(`🏹【${enemy.name}】施放【束縛箭】！`, 'system');
    if (!dodged && damage > 0 && blackForestAction === 'execution-arrow') logBattle(`🏹【${enemy.name}】對低生命目標施放【處決箭】！`, 'system');
    if (!dodged && damage > 0 && blackForestAction === 'root-strike') logBattle(`🌳【${enemy.name}】施放【根鬚重擊】！`, 'system');
    if (!dodged && damage > 0 && blackForestAction === 'leaf-storm') logBattle(`🍃【${enemy.name}】施放【落葉風暴】！`, 'system');
    if (!dodged && damage > 0 && ['venom-fang', 'venom-flask'].includes(blackForestTrailAction)) inflictBlackForestTrailPoison(target, enemy, now);
    if (!dodged && damage > 0 && blackForestTrailAction === 'webbed-strike') {
      applyBlackstoneAttackSpeedPenalty(target, BlackForestTrailPolicy.CONTROL.webAttackSpeedPenalty, BlackForestTrailPolicy.CONTROL.webDurationMs, now, '蛛絲纏繞');
    }
    if (!dodged && damage > 0 && blackForestTrailAction === 'scouting-mark') {
      target.blackstoneMarkedUntil = now + BlackForestTrailPolicy.MARK.durationMs;
      logBattle(`🎯【${enemy.name}】施放【偵察標記】，${target.name}受到黑石人形怪傷害提高 12%，持續 5 秒！`, 'system');
    }
    if (!dodged && damage > 0 && blackForestTrailAction === 'armor-break') {
      target.blackstoneArmorBreakUntil = now + BlackForestTrailPolicy.RAIDER.armorBreakDurationMs;
      logBattle(`🪓【${enemy.name}】施放【破甲劈砍】，${target.name}防禦降低 15%，持續 5 秒！`, 'system');
    }
    if (!dodged && damage > 0 && blackForestTrailAction === 'intercept') {
      applyBlackstoneAttackSpeedPenalty(target, BlackForestTrailPolicy.RAIDER.interceptAttackSpeedPenalty, BlackForestTrailPolicy.RAIDER.interceptDurationMs, now, '攔截');
    }
    const blackForestTrailActionNames = { 'piercing-arrow': '穿甲箭', 'aimed-shot': '狙擊', 'venom-flask': '毒液瓶', 'captain-execution': '斬首', 'centurion-cleave': '破甲重斧', 'centurion-command': '百夫長號令', 'execution-axe': '處刑重斧' };
    if (!dodged && damage > 0 && blackForestTrailActionNames[blackForestTrailAction]) logBattle(`⚔【${enemy.name}】施放【${blackForestTrailActionNames[blackForestTrailAction]}】！`, 'system');
    if (!dodged && damage > 0 && ['nest-venom-fang', 'venom-spray', 'poisoned-arrow', 'twin-poison-blades', 'boss-venom-spray'].includes(spiderNestAction)) inflictSpiderNestPoison(target, enemy, 1, now);
    if (!dodged && damage > 0 && ['nest-venom-flask', 'toxic-bite', 'deadly-fang'].includes(spiderNestAction)) inflictSpiderNestPoison(target, enemy, 2, now);
    if (!dodged && damage > 0 && spiderNestAction === 'corrosive-venom') {
      target.spiderNestArmorBreakUntil = now + 4000;
      logBattle(`☣【${enemy.name}】施放【腐蝕毒液】，${target.name}防禦降低 10%，持續 4 秒！`, 'system');
    }
    if (!dodged && damage > 0 && spiderNestAction === 'sticky-web-bite') applyBlackstoneAttackSpeedPenalty(target, SpiderNestPolicy.CONTROL.stickyPenalty, SpiderNestPolicy.CONTROL.stickyDurationMs, now, '黏網撕咬');
    if (!dodged && damage > 0 && spiderNestAction === 'web-entangle') applyBlackstoneAttackSpeedPenalty(target, SpiderNestPolicy.CONTROL.webPenalty, SpiderNestPolicy.CONTROL.webDurationMs, now, '蛛絲纏繞');
    if (!dodged && damage > 0 && spiderNestAction === 'suffocating-web') applyBlackstoneAttackSpeedPenalty(target, SpiderNestPolicy.CONTROL.suffocatingPenalty, SpiderNestPolicy.CONTROL.suffocatingDurationMs, now, '窒息蛛網');
    if (!dodged && damage > 0 && spiderNestAction === 'web-restraint') applyBlackstoneAttackSpeedPenalty(target, .25, 5000, now, '蛛網束縛');
    const spiderNestActionNames = { 'venom-hunt-shot': '獵毒射擊', 'venom-whip': '毒鞭', 'twin-poison-blades': '雙重毒刃', 'shadow-dash': '暗影突進', 'lethal-venom-cut': '致命毒割', 'toxic-bite': '劇毒撕咬', 'deadly-fang': '致命毒牙', 'boss-venom-spray': '毒液噴射' };
    if (!dodged && damage > 0 && spiderNestActionNames[spiderNestAction]) logBattle(`⚔【${enemy.name}】施放【${spiderNestActionNames[spiderNestAction]}】！`, 'system');
    if (!dodged && damage > 0 && strongholdAction === 'rending-bite') inflictPartyMemberBleed(target, enemy, now);
    if (!dodged && damage > 0 && strongholdAction === 'shield-bash') {
      target.stunnedUntil = Math.max(target.stunnedUntil || 0, now + BlackstoneStrongholdPolicy.GUARD.bashStunMs);
      logBattle(`💫【${enemy.name}】以盾擊使 ${target.name} 暈眩 1 秒！`, 'system');
    }
    if (!dodged && damage > 0 && strongholdAction === 'bullhorn-stampede') {
      target.stunnedUntil = Math.max(target.stunnedUntil || 0, now + BlackstoneStrongholdPolicy.BULLHORN.stampedeStunMs);
      logBattle(`💥【${enemy.name}】衝鋒命中，${target.name} 暈眩 1.2 秒！`, 'system');
    }
    const strongholdActionNames = { 'armor-piercing-bolt': '穿甲弩箭', 'aimed-volley': '瞄準齊射', 'twin-axe-cleave': '雙斧橫掃', 'hunting-pounce': '狩獵撲擊', 'crushing-hammer': '碎甲重錘', 'seismic-smash': '震地重擊', 'warhammer-sweep': '戰錘橫掃', 'warlord-execution': '督軍處決' };
    if (!dodged && damage > 0 && strongholdActionNames[strongholdAction]) logBattle(`⚔【${enemy.name}】施放【${strongholdActionNames[strongholdAction]}】！`, 'system');
    if (!dodged && damage > 0 && ['corrupted-bite', 'corruption-flame'].includes(forestAltarAction)) inflictPartyMemberBleed(target, enemy, now);
    const forestAltarControl = ForestAltarPolicy.getControlEffect(forestAltarAction);
    if (!dodged && damage > 0 && forestAltarControl) {
      const forestAltarControlNames = { 'thorn-entangle': '荊棘纏繞', 'rune-shock': '符文震擊', 'withering-touch': '凋零之觸', 'root-sweep': '根鬚橫掃' };
      applyBlackstoneAttackSpeedPenalty(target, forestAltarControl.attackSpeedPenalty, forestAltarControl.durationMs, now, forestAltarControlNames[forestAltarAction]);
    }
    const forestAltarActionNames = { 'corrupted-bite': '腐化撕咬', 'blackstone-heavy-slash': '黑石重斬', 'corruption-flame': '腐化之焰' };
    if (!dodged && damage > 0 && forestAltarActionNames[forestAltarAction]) logBattle(`⚔【${enemy.name}】施放【${forestAltarActionNames[forestAltarAction]}】！`, 'system');
    if (!dodged && damage > 0 && blackForestDepthsAction === 'depths-shadow-bite') inflictPartyMemberBleed(target, enemy, now);
    if (!dodged && damage > 0 && ['spore-eruption', 'corruption-pulse'].includes(blackForestDepthsAction)) inflictBlackForestDepthsCorruption(target, enemy, now);
    if (!dodged && damage > 0 && blackForestDepthsAction === 'corrupted-heavy-axe') {
      target.blackstoneArmorBreakUntil = now + BlackForestDepthsPolicy.SKILLS.corruptedBlackstoneCenturion.durationMs;
      logBattle(`🪓【${enemy.name}】施放【腐化重斧】，${target.name}防禦降低 15%，持續 5 秒！`, 'system');
    }
    const depthsControl = BlackForestDepthsPolicy.getControlEffect(blackForestDepthsAction);
    if (!dodged && damage > 0 && depthsControl) {
      const depthsControlNames = { 'corrupted-root-entangle': '腐根纏繞', 'withering-storm': '凋零風暴' };
      applyBlackstoneAttackSpeedPenalty(target, depthsControl.attackSpeedPenalty, depthsControl.durationMs, now, depthsControlNames[blackForestDepthsAction]);
    }
    const depthsActionNames = { 'depths-shadow-bite': '暗影撕咬', 'spore-eruption': '孢子噴發', 'corruption-pulse': '腐化脈衝' };
    if (!dodged && damage > 0 && depthsActionNames[blackForestDepthsAction]) logBattle(`⚔【${enemy.name}】施放【${depthsActionNames[blackForestDepthsAction]}】！`, 'system');

    if (dodged) {
      logBattle(`${target.name} 閃避了 ${enemy.name} 的攻擊。`, 'damage-taken');
    } else {
      logBattle(`${enemy.name} 對 ${target.name} 造成 ${damage} 點傷害${critical ? '（暴擊）' : ''}${absorbed ? `，護盾吸收 ${absorbed}` : ''}。`, 'damage-taken', {
        aggregateKey: `enemy-${battle.enemyTypes[enemyIndex]}-${target.id}`,
        damage,
        summary: `${enemy.name} 攻擊 ${target.name}${critical ? '（暴擊）' : ''}`
      });
    }
    playMonsterAttackAnimation(enemyIndex, !dodged && damage > 0, target);
    if (!dodged && damage > 0) playPartyMemberHitAnimation(target);

    if (target.currentHp > 0 && target.currentHp / target.maxHp < PARTY_AUTO_POTION_HEALTH_RATIO) {
      if (target.isMain) {
        syncLegacyBattleStateFromMain();
        usePotion();
        syncMainBattleMemberFromLegacy();
      } else useSharedHealingPotionForMember(target);
    }
    defeatPartyMember(target, now);
    if (!fighting) return;
    if (resetPartyAfterDefeat(now)) {
      updateBattleUI();
      return;
    }
  }

  syncLegacyBattleStateFromMain();
  if (attackOccurred) updateBattleUI();
}

function openBattle() {
  const character = getActiveCharacter();
  if (!character) { openCreation(); return; }
  const battlePlayerArt = document.querySelector('#battle-player-art');
  const characterArt = battleCharacterActionArt(character, 'idle') || battleCharacterArt[`${character.race}:${character.job}`];
  if (battlePlayerArt) {
    battlePlayerArt.classList.toggle('hidden', !characterArt);
    battlePlayerArt.classList.toggle('undead-art', character.race === 'undead' && Boolean(characterArt));
    battlePlayerArt.dataset.job = character.job;
    battlePlayerArt.dataset.race = character.race;
    battlePlayerArt.dataset.visualSize = 'humanoid';
    setBattleCharacterAction(battlePlayerArt, character, 'idle');
    const raceName = Object.values(factions).flat().find((race) => race.id === character.race)?.name || character.race;
    battlePlayerArt.setAttribute('aria-label', `${raceName}${classes.find((job) => job.id === character.job)?.name || ''}`);
  }
  menuScreen.classList.add('hidden');
  battleScreen.classList.remove('hidden');
  repairSkillLayoutOnce();
  repairHudLayoutOnce();
  repairCombatLogLayoutOnce();
  applySavedLayout();
  const progress = getProgress();
  let currentMap = getActiveMap(progress);
  if (currentMap.dungeon && !progress.dungeonAdmission) {
    progress.selectedMapId = progress.dungeonReturnMapId || (currentMap.id === 'black-forest-altar' ? 'black-forest' : 'plains-entrance');
    saveProgress(progress);
    currentMap = getActiveMap(progress);
  }
  const isDungeon = Boolean(currentMap.dungeon);
  if (isDungeon) {
    progress.dungeonAdmission = false;
    saveProgress(progress);
  }
  const dungeonDefinition = isDungeon ? getDungeonDefinition(currentMap.id) : null;
  const enemyTypes = isDungeon ? createDungeonWaveTypes(1, currentMap.id) : createEnemyTypes(progress.level);
  const enemyLevels = createEnemyLevels(enemyTypes, currentMap.id);
  const enemyAffixes = createEnemyAffixes(enemyTypes, currentMap.id, enemyLevels);
  const enemyHps = enemyTypes.map((type, index) => EliteAffixPolicy.applyAffixes(getMonsterDefinitionForMap(type, currentMap.id, enemyLevels[index]), enemyAffixes[index]).maxHp);
  const battleStart = Date.now();
  const sessionId = ++battleSessionSequence;
  const partyMembers = buildBattlePartyMembers(battleStart);
  const mainMember = partyMembers.find((member) => member.isMain) || partyMembers[0];
  battle = { enemyTypes, enemyLevels, enemyHps, partyMembers, playerHp: mainMember?.currentHp || getMaxHp(progress.level, progress), playerMana: mainMember?.resourceCurrent || 0, playerArrows: mainMember?.resourceType === 'arrows' ? mainMember.resourceCurrent : 0, playerShield: 0, playerStunnedUntil: 0, playerBleed: null, manaExhausted: false, playerAttackCharge: 0, hunterAttackCount: 0, lastManaRegenAt: battleStart, lastResourceUpdatedAt: battleStart, lastArrowRecoveryAt: battleStart, lastCorruptionTickAt: battleStart, lastStrongholdRegenAt: battleStart, enemyNextAttackAt: createEnemyAttackSchedule(enemyTypes, battleStart, currentMap.id, enemyLevels), enemyBoarEnraged: enemyTypes.map(() => false), enemyTrailSummoned: enemyTypes.map(() => false), enemySummonProfiles: enemyTypes.map(() => null), enemyCaptainShieldUntil: enemyTypes.map(() => 0), enemyAssassinDashUntil: enemyTypes.map(() => 0), enemySpiderNestPhase: enemyTypes.map(() => 1), blackstoneRoarUntil: 0, blackstoneCommandUntil: 0, blackstoneSpiderCommandUntil: 0, spiderNestCommandUntil: 0, strongholdCommandUntil: 0, blackstoneStrongholdState: BlackstoneStrongholdPolicy.createState(), globalSkillReadyAt: 0, undeadRevived: false, skillCooldowns: {}, enemyRespawns: enemyTypes.map(() => null), enemySpawnedAt: enemyTypes.map((_, index) => battleStart + index), enemyDots: enemyTypes.map(() => []), enemySkillStates: enemyTypes.map(() => null), monsterMoveSpeed: 200, targetIndexes: [], enemyDamages: enemyTypes.map(() => []), damageTimers: [], rewardedEnemyIndexes: new Set(), roundLoot: {}, isDungeon, dungeonId: isDungeon ? currentMap.id : null, dungeonWave: isDungeon ? 1 : 0, dungeonComplete: false, waveTransitioning: false, goblinScoutSummons: 0 };
  battle.enemyAffixes = enemyAffixes;
  battle.sessionId = sessionId;
  clearBattleLog();
  if (pendingOfflineReport) {
    logBattle(`☾ 離線掛機 ${pendingOfflineReport.duration}${pendingOfflineReport.capped ? '（已達 12 小時上限）' : ''}，擊敗約 ${pendingOfflineReport.defeated} 隻怪物。`, 'system');
    logBattle(`🎁 離線收益：${pendingOfflineReport.gainedXp} EXP、${pendingOfflineReport.gainedGold} 金幣${pendingOfflineReport.levelsGained ? `，提升 ${pendingOfflineReport.levelsGained} 級` : ''}。`, 'loot');
    pendingOfflineReport = null;
  }
  const openingSpecial = enemyTypes.map((_, index) => getEnemyDefinition(index)).find((enemy) => enemy.isBoss || enemy.isElite);
  if (openingSpecial) {
    const rank = openingSpecial.isBoss ? 'BOSS' : '菁英怪';
    showToast(`⚠ ${rank} 出現：${openingSpecial.name}`);
    logBattle(`⚠ ${rank}【${openingSpecial.name}】已出現在地圖！`);
  }
  const dungeonOpening = currentMap.id === 'goblin-camp'
    ? `◆ 進入${currentMap.name}。清場後若哥布林號角響起，將顯示哥布林撤退或更多哥布林到來。`
    : `◆ 進入${currentMap.name}，第 1／${dungeonDefinition?.waves || 10} 波：${enemyTypes.length} 名敵人來襲。全滅後自動進入下一波。`;
  logBattle(isDungeon ? dungeonOpening : `進入${currentMap.name}，${character.name}開始自動戰鬥。怪物移動速度 200%，重生約 2 秒。`);
  fighting = true;
  document.querySelector('#battle-toggle').textContent = 'Ⅱ 暫停攻擊';
  updateBattleUI();
  renderBattleAdventureInfo(progress);
  clearInterval(battleTimer);
  clearInterval(skillTimer);
  clearInterval(enemyAttackTimer);
  logBattle('✦ 即時自動施放已啟動。');
  requestAnimationFrame(autoSkillTick);
  skillTimer = setInterval(autoSkillTick, 100);
  battleTimer = setInterval(battleTick, 100);
  enemyAttackTimer = setInterval(enemyAttackTick, 100);
  logPartyDebug('戰鬥計時器註冊', {
    mapId: currentMap.id,
    partyMembers: partyMembers.map((member) => member.id).join(','),
    battleIntervalMs: 100,
    skillIntervalMs: 100,
    enemyIntervalMs: 100
  });
}

const savedName = localStorage.getItem('stardust-player-name');
if (savedName) {
  enterMenu(savedName);
  claimOfflineRewards();
}

window.addEventListener('beforeunload', markPlayerActive);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') markPlayerActive();
  else if (document.visibilityState === 'visible') claimOfflineRewards();
});
setInterval(() => {
  if (document.visibilityState === 'visible') markPlayerActive();
}, 30000);

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;
  localStorage.setItem('stardust-player-name', name);
  enterMenu(name);
  showToast(`歡迎回來，${name}！`);
});

document.querySelector('#profile-button').addEventListener('click', () => { nameInput.value = displayName.textContent; menuScreen.classList.add('hidden'); loginScreen.classList.remove('hidden'); nameInput.focus(); });
document.querySelector('#reset-button').addEventListener('click', () => { localStorage.removeItem('stardust-player-name'); localStorage.removeItem('stardust-character'); localStorage.removeItem('stardust-progress'); localStorage.removeItem('stardust-character-slots'); localStorage.removeItem('stardust-active-character-slot'); sessionStorage.removeItem(TAB_ACTIVE_CHARACTER_SLOT_KEY); nameInput.value = ''; enterMenu(''); menuScreen.classList.add('hidden'); loginScreen.classList.remove('hidden'); nameInput.focus(); });
document.querySelector('#adventure-button').addEventListener('click', () => {
  if (getProgress().requiresMapSelectionAfterDefeat) renderMapSelector();
  else openBattle();
});
document.querySelector('#village-menu-button').addEventListener('click', openVillage);
document.querySelectorAll('[data-faction]').forEach((card) => card.addEventListener('click', () => { selection.faction = card.dataset.faction; selection.race = factions[selection.faction][0].id; document.querySelectorAll('[data-faction]').forEach((item) => item.classList.toggle('selected', item === card)); renderCreation(); }));
raceChoices.addEventListener('click', (event) => { const choice = event.target.closest('[data-race]'); if (choice) { selection.race = choice.dataset.race; if (!canCreateRaceJob(selection.race, selection.job)) selection.job = 'warrior'; renderCreation(); } });
classChoices.addEventListener('click', (event) => { const choice = event.target.closest('[data-job]'); if (!choice) return; if (!canCreateRaceJob(selection.race, choice.dataset.job)) { showToast(selection.race === 'elf' ? '夜精靈沒有牧師職業。' : '半獸人無法創立牧師職業。'); return; } selection.job = choice.dataset.job; renderCreation(); });
document.querySelector('#back-to-menu').addEventListener('click', () => { characterScreen.classList.add('hidden'); menuScreen.classList.remove('hidden'); });
document.querySelector('#create-character').addEventListener('click', (event) => {
  if (canCreateRaceJob(selection.race, selection.job)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  showToast(selection.race === 'elf' ? '夜精靈沒有牧師職業。' : '半獸人無法創立牧師職業。');
}, true);
document.querySelector('#create-character').addEventListener('click', () => { const name = characterName.value.trim(); if (!name) { showToast('請先為角色取名。'); characterName.focus(); return; } const lockedFaction = getLockedFactionForCreation(); if (lockedFaction && selection.faction !== lockedFaction) { selection.faction = lockedFaction; selection.race = factions[lockedFaction][0].id; renderCreation(); showToast('帳號角色必須選擇相同陣營。'); return; } const race = factions[selection.faction].find((item) => item.id === selection.race); const job = classes.find((item) => item.id === selection.job)?.name || selection.job; const character = { ...selection, id: `character-slot-${creationSlotIndex + 1}`, name }; const progress = { level: 1, xp: 0, gold: 0, potions: 5, manaPotions: 0, selectedMapId: 'beginner-plains', inventory: [], equipment: selection.job === 'hunter' ? createStarterEquipment('hunter') : emptyEquipment(), lastActiveAt: Date.now(), ...(selection.job === 'assassin' ? { energy: 100, maxEnergy: 100, energyUpdatedAt: Date.now() } : {}) }; const slots = getCharacterSlots(); slots[creationSlotIndex] = { character, progress }; progress.party = PartyPolicy.normalizeParty(null, { slots, mainSlotIndex: creationSlotIndex, mainCharacter: character, mainProgress: progress }); localStorage.setItem('stardust-character-slots', JSON.stringify(slots)); setActiveCharacterSlotIndex(creationSlotIndex); localStorage.setItem('stardust-character', JSON.stringify(character)); localStorage.setItem('stardust-progress', JSON.stringify(progress)); characterScreen.classList.add('hidden'); menuScreen.classList.remove('hidden'); document.querySelector('#character-title').textContent = '建立你的角色'; showToast(`${race.name}${job}「${name}」已儲存至角色欄位 ${creationSlotIndex + 1}！`); });
document.querySelector('#character-roster-button').addEventListener('click', renderCharacterRoster);
document.querySelector('#character-roster-close').addEventListener('click', () => document.querySelector('#character-roster-modal').classList.add('hidden'));
document.querySelector('#character-roster-modal').addEventListener('click', (event) => {
  if (event.target === event.currentTarget) event.currentTarget.classList.add('hidden');
  const createButton = event.target.closest('[data-create-character-slot]');
  if (createButton) {
    document.querySelector('#character-roster-modal').classList.add('hidden');
    openCreation(Number(createButton.dataset.createCharacterSlot));
    return;
  }
  const activateButton = event.target.closest('[data-activate-character-slot]');
  if (activateButton) activateCharacterSlot(Number(activateButton.dataset.activateCharacterSlot));
});
document.querySelector('#leave-battle').addEventListener('click', () => {
  if (layoutEditMode) {
    showToast('調整版面中：返回箭頭只會移動，不會離開戰鬥。');
    return;
  }
  const leavingCharacter = getActiveCharacter();
  if (AssassinEnergyPolicy.isAssassin(leavingCharacter?.job)) {
    const energyNow = Date.now();
    battle.playerMana = AssassinEnergyPolicy.getRegeneratedEnergy(
      battle.playerMana,
      AssassinEnergyPolicy.getElapsedSeconds(energyNow, battle.lastResourceUpdatedAt)
    );
    persistAssassinEnergy(getProgress(), energyNow);
  }
  syncMainBattleMemberFromLegacy();
  persistPartyRuntimeState();
  clearInterval(battleTimer);
  clearInterval(skillTimer);
  clearInterval(enemyAttackTimer);
  if (battle.isDungeon) {
    const progress = getProgress();
    progress.selectedMapId = progress.dungeonReturnMapId || (battle.dungeonId === 'black-forest-altar' ? 'black-forest' : 'plains-entrance');
    progress.dungeonAdmission = false;
    saveProgress(progress);
  }
  fighting = false;
  battleScreen.classList.add('hidden');
  menuScreen.classList.remove('hidden');
});
document.querySelector('#battle-toggle').addEventListener('click', () => {
  if (battle.dungeonComplete) return;
  const character = getActiveCharacter();
  const now = Date.now();
  if (AssassinEnergyPolicy.isAssassin(character?.job)) {
    battle.playerMana = AssassinEnergyPolicy.getRegeneratedEnergy(
      battle.playerMana,
      AssassinEnergyPolicy.getElapsedSeconds(now, battle.lastResourceUpdatedAt)
    );
    persistAssassinEnergy(getProgress(), now);
  }
  fighting = !fighting;
  battle.lastManaRegenAt = now;
  battle.lastResourceUpdatedAt = now;
  document.querySelector('#battle-toggle').textContent = fighting ? 'Ⅱ 暫停攻擊' : '▶ 繼續攻擊';
  logBattle(fighting ? '玩家自動攻擊已繼續。' : '玩家自動攻擊已暫停；怪物仍會持續攻擊。');
  updateBattleUI();
});
document.querySelector('#potion-button').addEventListener('click', () => usePotion(true));
document.querySelector('#mana-potion-button').addEventListener('click', () => useManaPotion(true));
document.querySelector('#skill-list').addEventListener('click', (event) => {
  const chip = event.target.closest('.skill-chip[data-skill-key]');
  if (!chip) return;
  selectedSkillKey = chip.dataset.skillKey;
  skillTooltip.classList.remove('show');
  renderSkillDetailModal();
});
document.querySelector('#skill-detail-close').addEventListener('click', closeSkillDetailModal);
document.querySelector('#skill-detail-modal').addEventListener('click', (event) => {
  if (event.target === event.currentTarget) closeSkillDetailModal();
});
document.querySelector('#skill-detail-modal').addEventListener('click', (event) => {
  const button = event.target.closest('#skill-detail-upgrade');
  if (!button || button.disabled) return;
  button.disabled = true;
  const character = getActiveCharacter();
  const progress = getProgress();
  const skill = (skillProgression[character?.job] || []).find((entry) => getSkillKey(character.job, entry) === selectedSkillKey);
  if (!skill || progress.level < skill.level) return;
  progress.unlockedChapter = getUnlockedChapter(progress);
  const currentLevel = getSkillUpgradeLevel(progress, character.job, skill);
  const specialization = currentLevel === 5 ? ClassSkillPolicy.canSpecialize(progress.skillLevels, character.job, skill.id) : { ok: true };
  if (!specialization.ok) {
    showToast(`已選擇其他${skill.type === 'active' ? '主動' : '被動'}技能突破。`);
    renderSkillDetailModal();
    return;
  }
  const result = SkillUpgradePolicy.attemptUpgrade(progress, currentLevel);
  if (!result.ok) {
    renderSkillDetailModal();
    return;
  }
  if (result.succeeded) {
    progress.skillLevels = { ...(progress.skillLevels || {}), [getSkillKey(character.job, skill)]: result.level };
  }
  saveProgress(progress);
  renderSkills(character, progress.level);
  renderSkillDetailModal();
  showToast(result.succeeded ? `${skill.name} 升級至 Lv${result.level}！` : `${skill.name} 升級失敗，材料與金幣已消耗。`);
  logBattle(result.succeeded ? `✦ 技能【${skill.name}】升級至 Lv${result.level}` : `◇ 技能【${skill.name}】升級失敗`, 'progress');
});
document.querySelector('#layout-toggle').addEventListener('click', () => {
  layoutEditMode = !layoutEditMode;
  if (!layoutEditMode) saveVisibleAdjustedLayout();
  battleScreen.classList.toggle('layout-editing', layoutEditMode);
  document.querySelector('#layout-toggle').textContent = layoutEditMode ? '✓ 完成調整' : '✥ 調整版面';
  showToast(layoutEditMode ? '先選一個區塊，再按方向鍵移動；也可直接拖曳。' : '版面位置已儲存。');
});
document.querySelectorAll('[data-layout-target]').forEach((button) => button.addEventListener('click', () => {
  selectedLayoutTarget = button.dataset.layoutTarget;
  document.querySelectorAll('[data-layout-target]').forEach((item) => item.classList.toggle('selected', item === button));
  showToast(`已選擇：${button.textContent}`);
}));
document.querySelector('#layout-skill-select').addEventListener('change', (event) => {
  selectedLayoutTarget = event.target.value;
  document.querySelectorAll('[data-layout-target]').forEach((item) => item.classList.remove('selected'));
  showToast(`已選擇：${event.target.selectedOptions[0].textContent}`);
});
document.querySelectorAll('[data-layout-move]').forEach((button) => button.addEventListener('click', () => moveSelectedLayout(button.dataset.layoutMove)));
document.querySelectorAll('[data-layout-size]').forEach((button) => button.addEventListener('click', () => resizeSelectedLayout(button.dataset.layoutSize, button.dataset.layoutAxis || 'both')));
document.querySelectorAll('[data-layout-font]').forEach((button) => button.addEventListener('click', () => resizeSelectedFont(button.dataset.layoutFont)));
document.querySelector('#layout-skills-stack').addEventListener('click', () => {
  const saved = JSON.parse(localStorage.getItem('stardust-battle-layout') || '{}');
  Object.keys(saved).filter((key) => key.startsWith('skill-')).forEach((key) => delete saved[key]);
  localStorage.setItem('stardust-battle-layout', JSON.stringify(saved));
  const character = getActiveCharacter();
  if (character) renderSkills(character, getProgress().level);
  showToast('所有技能已統一為由上往下排列。');
});
document.querySelector('#layout-reset').addEventListener('click', () => {
  localStorage.removeItem('stardust-battle-layout');
  localStorage.removeItem('stardust-battle-columns');
  localStorage.removeItem('stardust-combat-log-size');
  window.location.reload();
});
setupLayoutDrag();
document.querySelectorAll('[data-menu-action]').forEach((button) => button.addEventListener('click', () => {
  if (layoutEditMode) return;
  if (button.dataset.menuAction === '能力') { renderCharacterAbilities(); return; }
  if (button.dataset.menuAction === '收藏品') { renderCollection(); return; }
  if (button.dataset.menuAction === '背包') { renderInventory('inventory'); return; }
  if (button.dataset.menuAction === '裝備') { renderInventory('equipment'); return; }
  if (button.dataset.menuAction === '隊伍') { renderParty(); return; }
  if (button.dataset.menuAction === '村莊') { openVillage(); return; }
  if (button.dataset.menuAction === '掉落') { renderDropLookup(); return; }
}));
document.querySelector('#village-return').addEventListener('click', closeVillage);
document.querySelector('#village-building-grid').addEventListener('click', (event) => {
  const openButton = event.target.closest('[data-open-village-building]');
  if (openButton) { openVillageBuilding(openButton.dataset.openVillageBuilding); return; }
  const upgradeButton = event.target.closest('[data-upgrade-village-building]');
  if (upgradeButton) upgradeVillageBuilding(upgradeButton.dataset.upgradeVillageBuilding);
});
document.querySelector('#village-building-close').addEventListener('click', closeVillageBuilding);
document.querySelector('#village-building-modal').addEventListener('click', (event) => {
  if (event.target === event.currentTarget) closeVillageBuilding();
  const qualityButton = event.target.closest('[data-workshop-quality]');
  if (qualityButton) { workshopQuality = qualityButton.dataset.workshopQuality; renderWorkshop(); return; }
  const slotButton = event.target.closest('[data-workshop-slot]');
  if (slotButton) { workshopSlot = slotButton.dataset.workshopSlot; renderWorkshop(); return; }
  const craftButton = event.target.closest('[data-craft-recipe]');
  if (craftButton) craftWorkshopEquipment(craftButton.dataset.craftRecipe);
  const furnaceItem = event.target.closest('[data-select-furnace-item]');
  if (furnaceItem) { selectFurnaceItem(furnaceItem.dataset.selectFurnaceItem); return; }
  if (event.target.closest('[data-confirm-furnace]')) { confirmFurnaceSalvage(); return; }
  const alchemyItem = event.target.closest('[data-alchemy-item]');
  if (alchemyItem) { selectAlchemyInput(alchemyItem.dataset.alchemyItem); return; }
  const clearAlchemyInput = event.target.closest('[data-clear-alchemy-input]');
  if (clearAlchemyInput && !alchemyCandidates.length) { const index = Number(clearAlchemyInput.dataset.clearAlchemyInput); alchemyInputItemIds[index] = null; if (index === 0) alchemyInputItemIds[1] = null; renderAlchemy(); return; }
  const candidate = event.target.closest('[data-select-alchemy-candidate]');
  if (candidate) { selectedAlchemyCandidate = candidate.dataset.selectAlchemyCandidate; renderAlchemy(); return; }
  if (event.target.closest('[data-start-alchemy]')) { startAlchemy(); return; }
  if (event.target.closest('[data-confirm-alchemy]')) { confirmAlchemy(); return; }
  const magicSynthesis = event.target.closest('[data-synthesize-magic]');
  if (magicSynthesis) { synthesizeSkillBook(magicSynthesis.dataset.synthesizeMagic); return; }
  if (event.target.closest('[data-return-alchemy]')) closeVillageBuilding();
});
document.querySelector('#party-close').addEventListener('click', () => document.querySelector('#party-modal').classList.add('hidden'));
document.querySelector('#party-modal').addEventListener('click', (event) => {
  if (event.target === event.currentTarget) event.currentTarget.classList.add('hidden');
  const addButton = event.target.closest('[data-party-add]');
  if (addButton) { addPartyMember(addButton.dataset.partyAdd); return; }
  const removeButton = event.target.closest('[data-party-remove]');
  if (removeButton) removePartyMember(removeButton.dataset.partyRemove);
});
document.querySelector('#drop-lookup-close').addEventListener('click', () => document.querySelector('#drop-lookup-modal').classList.add('hidden'));
document.querySelector('#drop-lookup-modal').addEventListener('click', (event) => {
  if (event.target === event.currentTarget) { event.currentTarget.classList.add('hidden'); return; }
  const category = event.target.closest('[data-drop-category]');
  if (category) { dropLookupCategory = category.dataset.dropCategory; renderDropLookup(); }
  const purificationButton = event.target.closest('[data-attempt-purification]');
  if (purificationButton) {
    const progress = getProgress();
    const result = BlackForestCorruptionPolicy.purify(progress, purificationButton.dataset.attemptPurification);
    if (!result.ok) { showToast('解除條件不足，請確認材料、金幣與 Debuff 層數。'); return; }
    saveProgress(progress);
    showToast(result.success ? `淨化成功！Debuff 降至 ${result.effect.level} 層。` : '淨化失敗，材料與金幣已消耗。');
    renderDropLookup();
  }
});
document.querySelector('#drop-lookup-modal').addEventListener('input', (event) => {
  if (!event.target.matches('[data-drop-search]')) return;
  dropLookupQuery = event.target.value;
  const cursor = event.target.selectionStart;
  renderDropLookup();
  const input = document.querySelector('[data-drop-search]');
  input.focus(); input.setSelectionRange(cursor, cursor);
});
document.querySelector('#inventory-close').addEventListener('click', () => document.querySelector('#inventory-modal').classList.add('hidden'));
document.querySelector('#sell-confirm-close').addEventListener('click', closeSellConfirmation);
document.querySelector('#sell-confirm-modal').addEventListener('click', (event) => {
  if (event.target === event.currentTarget || event.target.closest('[data-cancel-sale]')) { closeSellConfirmation(); return; }
  if (event.target.closest('[data-confirm-sale]')) confirmSelectedEquipmentSale();
});
document.querySelector('#inventory-modal').addEventListener('click', (event) => {
  if (event.target === event.currentTarget) event.currentTarget.classList.add('hidden');
  const regionHubButton = event.target.closest('[data-open-map-region]');
  if (regionHubButton) {
    if (regionHubButton.dataset.openMapRegion === 'black-forest') renderBlackForestRegions();
    else renderBeginnerPlainsRegions();
    return;
  }
  if (event.target.closest('[data-map-region-back]')) { renderMapSelector(); return; }
  const mapButton = event.target.closest('[data-select-map]');
  if (mapButton) { selectAdventureMap(mapButton.dataset.selectMap); return; }
  const categoryButton = event.target.closest('[data-inventory-category]');
  if (categoryButton) {
    inventoryCategory = categoryButton.dataset.inventoryCategory;
    renderInventory('inventory');
    return;
  }
  if (event.target.closest('[data-select-common-equipment]')) { selectAllCommonEquipment(); return; }
  if (event.target.closest('[data-open-sell-confirm]')) { openSellConfirmation(); return; }
  const equipButton = event.target.closest('[data-equip-id]');
  if (equipButton) { equipItem(equipButton.dataset.equipId, equipButton.dataset.equipSlot || null); return; }
  const unequipButton = event.target.closest('[data-unequip-slot]');
  if (unequipButton) { unequipItem(unequipButton.dataset.unequipSlot); return; }
});
document.querySelector('#battle-title').addEventListener('click', () => { if (!layoutEditMode) renderMapSelector(); });
document.querySelector('#battle-title').addEventListener('keydown', (event) => { if (!layoutEditMode && ['Enter', ' '].includes(event.key)) { event.preventDefault(); renderMapSelector(); } });

const layoutColumnStorageKey = 'stardust-battle-columns';
const layoutLeftWidth = document.querySelector('#layout-left-width');
const layoutRightWidth = document.querySelector('#layout-right-width');
const layoutLeftValue = document.querySelector('#layout-left-value');
const layoutRightValue = document.querySelector('#layout-right-value');
const layoutLogWidth = document.querySelector('#layout-log-width');
const layoutLogHeight = document.querySelector('#layout-log-height');
const layoutLogWidthValue = document.querySelector('#layout-log-width-value');
const layoutLogHeightValue = document.querySelector('#layout-log-height-value');
const layoutLogX = document.querySelector('#layout-log-x');
const layoutLogY = document.querySelector('#layout-log-y');
const layoutLogXValue = document.querySelector('#layout-log-x-value');
const layoutLogYValue = document.querySelector('#layout-log-y-value');
const layoutToggleButton = document.querySelector('#layout-toggle');

layoutToggleButton.hidden = false;
layoutToggleButton.textContent = '✥ 調整版面';
layoutToggleButton.addEventListener('click', () => {
  layoutToggleButton.textContent = layoutEditMode ? '✓ 完成調整' : '✥ 調整版面';
});

function applyBattleColumnWidths(left, right, persist = true) {
  const safeLeft = Math.max(22, Math.min(38, Number(left) || 30));
  const safeRight = Math.max(12, Math.min(26, Number(right) || 16));
  const limitedLeft = Math.min(safeLeft, 72 - safeRight);
  battleScreen.style.setProperty('--battle-left-column', `${limitedLeft}%`);
  battleScreen.style.setProperty('--battle-right-column', `${safeRight}%`);
  layoutLeftWidth.value = String(limitedLeft);
  layoutRightWidth.value = String(safeRight);
  layoutLeftValue.value = `${limitedLeft}%`;
  layoutRightValue.value = `${safeRight}%`;
  if (persist) localStorage.setItem(layoutColumnStorageKey, JSON.stringify({ left: limitedLeft, right: safeRight }));
}

try {
  const savedColumns = JSON.parse(localStorage.getItem(layoutColumnStorageKey) || '{}');
  applyBattleColumnWidths(savedColumns.left ?? 22, savedColumns.right ?? 15, false);
} catch {
  applyBattleColumnWidths(22, 15, false);
}

layoutLeftWidth.addEventListener('input', () => applyBattleColumnWidths(layoutLeftWidth.value, layoutRightWidth.value));
layoutRightWidth.addEventListener('input', () => applyBattleColumnWidths(layoutLeftWidth.value, layoutRightWidth.value));

const combatLogSizeStorageKey = 'stardust-combat-log-size';

function applyCombatLogSize(width, height, persist = true) {
  const safeWidth = Math.max(240, Math.min(600, Number(width) || 360));
  const safeHeight = Math.max(220, Math.min(850, Number(height) || 520));
  battleScreen.style.setProperty('--combat-log-width', `${safeWidth}px`);
  battleScreen.style.setProperty('--combat-log-height', `${safeHeight}px`);
  layoutLogWidth.value = String(safeWidth);
  layoutLogHeight.value = String(safeHeight);
  layoutLogWidthValue.value = `${safeWidth}px`;
  layoutLogHeightValue.value = `${safeHeight}px`;
  if (persist) localStorage.setItem(combatLogSizeStorageKey, JSON.stringify({ width: safeWidth, height: safeHeight }));
}

try {
  const savedCombatLogSize = JSON.parse(localStorage.getItem(combatLogSizeStorageKey) || '{}');
  if (savedCombatLogSize.fitVersion !== 1 && (savedCombatLogSize.height == null || savedCombatLogSize.height === 700)) {
    savedCombatLogSize.height = 640;
  }
  savedCombatLogSize.fitVersion = 1;
  localStorage.setItem(combatLogSizeStorageKey, JSON.stringify(savedCombatLogSize));
  applyCombatLogSize(savedCombatLogSize.width ?? 410, savedCombatLogSize.height ?? 640, false);
} catch {
  applyCombatLogSize(410, 640, false);
}

layoutLogWidth.addEventListener('input', () => applyCombatLogSize(layoutLogWidth.value, layoutLogHeight.value));
layoutLogHeight.addEventListener('input', () => applyCombatLogSize(layoutLogWidth.value, layoutLogHeight.value));

function applyCombatLogPosition(left, top, persist = true) {
  const combatLog = document.querySelector('.combat-log');
  const safeLeft = Math.max(0, Math.min(1400, Number(left) || 0));
  const safeTop = Math.max(0, Math.min(900, Number(top) || 0));
  if (isMobileBattleLayout()) {
    ['position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'margin', 'z-index'].forEach((property) => {
      combatLog.style.removeProperty(property);
    });
    layoutLogX.value = String(safeLeft);
    layoutLogY.value = String(safeTop);
    layoutLogXValue.value = `${safeLeft}px`;
    layoutLogYValue.value = `${safeTop}px`;
    return;
  }
  combatLog.style.setProperty('position', 'fixed', 'important');
  combatLog.style.setProperty('left', `${safeLeft}px`, 'important');
  combatLog.style.setProperty('top', `${safeTop}px`, 'important');
  combatLog.style.margin = '0';
  layoutLogX.value = String(safeLeft);
  layoutLogY.value = String(safeTop);
  layoutLogXValue.value = `${safeLeft}px`;
  layoutLogYValue.value = `${safeTop}px`;
  if (!persist) return;
  const saved = JSON.parse(localStorage.getItem('stardust-battle-layout') || '{}');
  const rect = combatLog.getBoundingClientRect();
  saved.log = {
    ...(saved.log || defaultBattleLayout.log),
    modified: true,
    left: safeLeft,
    top: safeTop,
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
  localStorage.setItem('stardust-battle-layout', JSON.stringify(saved));
}

try {
  const savedLayoutPosition = JSON.parse(localStorage.getItem('stardust-battle-layout') || '{}').log || defaultBattleLayout.log;
  applyCombatLogPosition(savedLayoutPosition.left, savedLayoutPosition.top, false);
} catch {
  applyCombatLogPosition(defaultBattleLayout.log.left, defaultBattleLayout.log.top, false);
}

layoutLogX.addEventListener('input', () => applyCombatLogPosition(layoutLogX.value, layoutLogY.value));
layoutLogY.addEventListener('input', () => applyCombatLogPosition(layoutLogX.value, layoutLogY.value));

function isMobileBattleLayout() {
  return window.matchMedia('(max-width: 700px)').matches;
}

window.matchMedia('(max-width: 700px)').addEventListener('change', () => {
  try {
    const savedLayoutPosition = JSON.parse(localStorage.getItem('stardust-battle-layout') || '{}').log || defaultBattleLayout.log;
    applyCombatLogPosition(savedLayoutPosition.left, savedLayoutPosition.top, false);
  } catch {
    applyCombatLogPosition(defaultBattleLayout.log.left, defaultBattleLayout.log.top, false);
  }
});

document.querySelector('#layout-export').addEventListener('click', async () => {
  saveVisibleAdjustedLayout();
  const readSavedSetting = (key) => {
    try {
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  };
  const exportedLayout = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    windows: readSavedSetting('stardust-battle-layout'),
    columns: readSavedSetting(layoutColumnStorageKey),
    combatLog: readSavedSetting(combatLogSizeStorageKey)
  }, null, 2);
  try {
    await navigator.clipboard.writeText(exportedLayout);
    showToast('版面設定已複製，請直接貼給 Codex。');
  } catch {
    const file = new Blob([exportedLayout], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `battle-layout-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
    showToast('瀏覽器禁止複製，已改為下載設定檔。');
  }
});
document.querySelector('#inventory-modal').addEventListener('change', (event) => {
  const selectAllCheckbox = event.target.closest('[data-select-all-scrap]');
  if (selectAllCheckbox) {
    const progress = getProgress();
    progress.inventory.filter((item) => item.kind === 'equipment' && itemCategory(item) === inventoryCategory).forEach((item) => {
      if (selectAllCheckbox.checked) scrapSelection.add(item.id);
      else scrapSelection.delete(item.id);
    });
    renderInventory('inventory');
    return;
  }
});
setupBattleLogControls();
document.querySelector('.combat-log')?.addEventListener('click', (event) => {
  const modeButton = event.target.closest('[data-log-mode]');
  if (!modeButton) return;
  battleLogMode = modeButton.dataset.logMode;
  document.querySelectorAll('[data-log-mode]').forEach((button) => button.classList.toggle('selected', button === modeButton));
  renderBattleLog();
});
document.querySelectorAll('.menu-card:not(#adventure-button)').forEach((card) => card.addEventListener('click', () => showToast(card.dataset.message)));
