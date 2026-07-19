const loginScreen = document.querySelector('#login-screen');
const menuScreen = document.querySelector('#menu-screen');
const characterScreen = document.querySelector('#character-screen');
const battleScreen = document.querySelector('#battle-screen');
const loginForm = document.querySelector('#login-form');
const nameInput = document.querySelector('#player-name');
const displayName = document.querySelector('#display-name');
const toast = document.querySelector('#toast');
const raceChoices = document.querySelector('#race-choices');
const classChoices = document.querySelector('#class-choices');
const characterName = document.querySelector('#character-name');
const skillTooltip = document.querySelector('#skill-tooltip');
let skillTooltipTimer;

const factions = {
  light: [{ id: 'human', icon: '♙', portrait: 0, name: '人類', trait: '控制抗性 +20%' }, { id: 'elf', icon: '♧', portrait: 1, name: '精靈', trait: '暴擊率 +5%' }],
  dark: [{ id: 'orc', icon: '♜', portrait: 2, name: '半獸人', trait: '10% 機率狂暴' }, { id: 'undead', icon: '☠', portrait: 3, name: '不死族', trait: '持續傷害 +20%' }]
};
const classes = [{ id: 'warrior', icon: '⚔', portrait: 4, name: '戰士' }, { id: 'assassin', icon: '🗡', portrait: 5, name: '刺客' }, { id: 'hunter', icon: '🏹', portrait: 6, name: '獵人' }, { id: 'mage', icon: '✦', portrait: 7, name: '法師' }, { id: 'priest', icon: '✚', portrait: 8, name: '牧師' }];
const classIcons = Object.fromEntries(classes.map((job) => [job.id, job.icon]));
const raceTotems = { human: '☀', elf: '❈', orc: '⛧', undead: '☾' };
const jobMarks = { warrior: '⛨', assassin: '◈', hunter: '➶', mage: '✦', priest: '✥' };
const battleCharacterArt = {
  'human:warrior': 'assets/human-warrior.png',
  'human:assassin': 'assets/human-assassin.png',
  'human:hunter': 'assets/human-hunter.png',
  'human:mage': 'assets/human-mage.png',
  'human:priest': 'assets/human-priest.png',
  'elf:warrior': 'assets/elf-warrior.png',
  'elf:assassin': 'assets/elf-assassin.png',
  'elf:hunter': 'assets/elf-hunter.png',
  'elf:mage': 'assets/elf-mage.png',
  'elf:priest': 'assets/elf-priest.png',
  'orc:warrior': 'assets/orc-warrior-battle.png',
  'orc:assassin': 'assets/orc-assassin.png',
  'orc:hunter': 'assets/orc-hunter.png',
  'orc:mage': 'assets/orc-mage.png',
  'orc:priest': 'assets/orc-priest.png',
  'undead:warrior': 'assets/undead-warrior.png',
  'undead:assassin': 'assets/undead-assassin.png',
  'undead:hunter': 'assets/undead-hunter.png',
  'undead:mage': 'assets/undead-mage.png',
  'undead:priest': 'assets/undead-priest.png'
};
const racialCompanions = {
  human: { image: 'assets/companion-human.png', name: '王國獵犬' },
  elf: { image: 'assets/companion-elf.png', name: '月光山貓' },
  orc: { image: 'assets/companion-orc.png', name: '獠牙戰狼' },
  undead: { image: 'assets/companion-undead.png', name: '亡靈獵犬' }
};
const classBaseStats = {
  warrior: { hp: 150, mana: 70, attack: 12, defense: 9, crit: .05, dodge: .03, attackSpeed: 1.0 },
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
  { id: 'beginner-plains', min: 1, max: 5, name: '初心者平原', background: 'assets/beginner-plains-background.png', implemented: true, normalXp: 5, eliteXp: 25, bossXp: 100, recommended: { attack: 14, defense: 3, hp: 100 } },
  { id: 'black-forest', min: 5, max: 10, name: '黑森林', background: 'assets/black-forest-background.png', implemented: true, normalXp: 5, eliteXp: 20, bossXp: 80, recommended: { attack: 26, defense: 8, hp: 180 } },
  { id: 'black-forest-altar', min: 5, max: 10, name: '黑森林祭壇', background: 'assets/black-forest-background.png', implemented: true, dungeon: true, normalXp: 0, eliteXp: 32, bossXp: 180, recommended: { attack: 34, defense: 11, hp: 230 } },
  { min: 10, max: 15, name: '石牙山谷', normalXp: 12, eliteXp: 50, bossXp: 200 },
  { min: 15, max: 20, name: '荒蕪沙漠', normalXp: 25, eliteXp: 100, bossXp: 400 },
  { min: 20, max: 25, name: '冰霜高原', normalXp: 50, eliteXp: 200, bossXp: 800 },
  { min: 25, max: 30, name: '熔岩要塞', normalXp: 100, eliteXp: 400, bossXp: 1500 }
];
const skillCooldownMultiplier = 1.0;
const skillProgression = {
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
const skillIcons = {
  'heavy-strike': '⚔', whirlwind: '🌀', charge: '➤', fireball: '🔥', blizzard: '❄', 'chain-lightning': '⚡',
  backstab: '🗡', 'shadow-dance': '✦', 'poison-blade': '☠', 'power-shot': '➶', companion: '🐺', 'multi-shot': '≋',
  'holy-light': '☀', 'holy-nova': '✣', heal: '✚'
};
const maxSkillUpgradeLevel = 6;
const skillUpgradeCosts = { 2: 5, 3: 10, 4: 15, 5: 25, 6: 40 };
const skillBookCosts = { 2: 2, 3: 4, 4: 6, 5: 8, 6: 10 };
const skillUpgradeSuccessRates = { 2: .85, 3: .70, 4: .55, 5: .40, 6: .35 };
const skillUpgradeGoldCosts = { 2: 200, 3: 500, 4: 1000, 5: 2000, 6: 4000 };

function getSkillUpgradeKey(job, skill) {
  return `${job}:${skill.id || `passive-${skill.level}`}`;
}

function getSkillUpgradeLevel(progress, job, skill) {
  return Math.max(1, Math.min(maxSkillUpgradeLevel, Number(progress.skillLevels?.[getSkillUpgradeKey(job, skill)]) || 1));
}

function getSkillPowerMultiplier(progress, job, skill) {
  return 1 + (getSkillUpgradeLevel(progress, job, skill) - 1) * .12;
}

function syncSkillMaterialInventory(progress) {
  progress.inventory = Array.isArray(progress.inventory) ? progress.inventory : [];
  const upsert = (id, icon, name, description, quantity) => {
    const existing = progress.inventory.find((item) => item.id === id);
    if (existing) Object.assign(existing, { kind: 'material', icon, name, description, quantity });
    else progress.inventory.push({ id, kind: 'material', icon, name, description, quantity });
  };
  upsert('magic-crystal', '💎', '魔法結晶', '技能升階的核心材料。', Math.max(0, Number(progress.magicCrystals) || 0));
  for (let tier = 2; tier <= 6; tier += 1) {
    const quantity = Math.max(0, Number(progress.skillBooks?.[tier]) || 0);
    const itemId = `magic-book-${tier}`;
    if (quantity > 0) upsert(itemId, '📘', `${tier}階魔法書`, `技能升至 ${tier} 階時使用。`, quantity);
    else progress.inventory = progress.inventory.filter((item) => item.id !== itemId);
  }
}
let selection = { faction: 'light', race: 'human', job: 'warrior' };
let toastTimer;
let battleTimer;
let skillTimer;
let enemyAttackTimer;
let fighting = false;
let pendingOfflineReport = null;
let creationSlotIndex = 0;
let scrapSelection = new Set();
let inventoryCategory = 'weapon';
let battleLogMode = 'player';
let battleLogEntries = [];
let battle = { enemyTypes: ['goblin', 'wolf', 'boar', 'goblin', 'wolf'], enemyHps: [45, 68, 82, 45, 68], playerHp: 100, playerMana: 100, playerShield: 0, manaExhausted: false, playerAttackCharge: 0, globalSkillReadyAt: 0, undeadRevived: false, skillCooldowns: {}, enemyRespawns: [null, null, null, null, null], enemySpawnedAt: [0, 1, 2, 3, 4], enemyDots: [[], [], [], [], []], monsterMoveSpeed: 200, targetIndexes: [], enemyDamages: [[], [], [], [], []], damageTimers: [] };
let layoutEditMode = false;
let activeLayoutDrag = null;
let selectedLayoutTarget = 'map';
const layoutTargets = [
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
  if (saved.hudLayoutVersion === 1) return;
  ['back', 'title', 'monster-level', 'identity', 'race', 'job'].forEach((key) => delete saved[key]);
  saved.hudLayoutVersion = 1;
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
  const saved = JSON.parse(localStorage.getItem('stardust-battle-layout') || '{}');
  layoutTargets.forEach(([key, selector]) => {
    const layout = saved[key];
    const element = document.querySelector(selector);
    if (!layout || !layout.modified || !element) return;
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
      const maxLeft = Math.max(0, window.innerWidth - element.offsetWidth);
      const maxTop = Math.max(0, window.innerHeight - element.offsetHeight);
      const left = Math.max(0, Math.min(maxLeft, event.clientX - activeLayoutDrag.offsetX));
      const top = Math.max(0, Math.min(maxTop, event.clientY - activeLayoutDrag.offsetY));
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
    });
    element.addEventListener('pointerup', (event) => {
      if (!activeLayoutDrag || activeLayoutDrag.element !== element) return;
      element.classList.remove('layout-dragging');
      element.releasePointerCapture(event.pointerId);
      activeLayoutDrag = null;
      saveCurrentLayout();
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
  classChoices.innerHTML = classes.map((job) => `<button class="class-choice ${job.id === selection.job ? 'selected' : ''}" type="button" data-job="${job.id}"><span class="creation-job-icon" aria-hidden="true">${jobMarks[job.id] || job.icon}</span><small>${job.name}</small></button>`).join('');
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
  document.querySelector('#character-title').textContent = slotIndex === 1 ? '建立第二角色' : '建立你的角色';
  renderCreation();
}

const monsterTypes = {
  goblin: { id: 'goblin', name: '哥布林', maxHp: 45, attack: 11, artClass: 'goblin-art', xp: 10, gold: 3 },
  wolf: { id: 'wolf', name: '森林狼', maxHp: 68, attack: 14, artClass: 'wolf-art', xp: 14, gold: 4 },
  boar: { id: 'boar', name: '野豬', maxHp: 82, attack: 17, artClass: 'boar-art', xp: 18, gold: 5 },
  goblinOverlord: { id: 'goblinOverlord', name: '哥布林督軍', maxHp: 320, attack: 14, artClass: 'goblin-art', xp: 90, gold: 35, isElite: true, lootSource: 'goblin' },
  wolfAlpha: { id: 'wolfAlpha', name: '霜牙狼王', maxHp: 410, attack: 17, artClass: 'wolf-art', xp: 120, gold: 48, isElite: true, lootSource: 'wolf' },
  boarTyrant: { id: 'boarTyrant', name: '獠牙巨獸', maxHp: 520, attack: 20, artClass: 'boar-art', xp: 150, gold: 62, isElite: true, lootSource: 'boar' },
  goblinKing: { id: 'goblinKing', name: '赤冠哥布林王', maxHp: 1500, attack: 22, artClass: 'goblin-king-art', xp: 520, gold: 260, isBoss: true, lootSource: 'boss' },
  nightGoblin: { id: 'nightGoblin', name: '夜行哥布林', maxHp: 120, attack: 14, artClass: 'black-forest-goblin black-forest-monster', xp: 5, gold: 7, lootSource: 'blackGoblin' },
  shadowWolf: { id: 'shadowWolf', name: '幽影森林狼', maxHp: 150, attack: 17, artClass: 'black-forest-wolf black-forest-monster', xp: 5, gold: 8, lootSource: 'blackWolf' },
  thornBoar: { id: 'thornBoar', name: '荊棘野豬', maxHp: 185, attack: 20, artClass: 'black-forest-boar black-forest-monster', xp: 5, gold: 9, lootSource: 'blackBoar' },
  forestShaman: { id: 'forestShaman', name: '黑林薩滿', maxHp: 540, attack: 18, artClass: 'black-forest-goblin black-forest-elite', xp: 20, gold: 45, isElite: true, lootSource: 'blackGoblin' },
  moonfangAlpha: { id: 'moonfangAlpha', name: '月牙狼王', maxHp: 680, attack: 21, artClass: 'black-forest-wolf black-forest-elite', xp: 20, gold: 55, isElite: true, lootSource: 'blackWolf' },
  thornbackTyrant: { id: 'thornbackTyrant', name: '棘背暴君', maxHp: 820, attack: 24, artClass: 'black-forest-boar black-forest-elite', xp: 20, gold: 65, isElite: true, lootSource: 'blackBoar' },
  forestGuardian: { id: 'forestGuardian', name: '腐月森林守衛', maxHp: 2400, attack: 28, artClass: 'black-forest-guardian black-forest-boss', xp: 80, gold: 320, isBoss: true, lootSource: 'blackBoss' },
  rootExecutioner: { id: 'rootExecutioner', name: '根縛行刑者', maxHp: 920, attack: 27, artClass: 'dungeon-root-executioner dungeon-monster-art', xp: 32, gold: 70, isElite: true, lootSource: 'dungeonElite' },
  altarNightblade: { id: 'altarNightblade', name: '祭壇夜刃', maxHp: 820, attack: 31, artClass: 'dungeon-nightblade dungeon-monster-art', xp: 32, gold: 74, isElite: true, lootSource: 'dungeonElite' },
  moonboneSentinel: { id: 'moonboneSentinel', name: '月骨守衛', maxHp: 1120, attack: 25, artClass: 'dungeon-moonbone dungeon-monster-art', xp: 32, gold: 78, isElite: true, lootSource: 'dungeonElite' },
  blightOracle: { id: 'blightOracle', name: '疫木神諭', maxHp: 860, attack: 30, artClass: 'dungeon-oracle dungeon-monster-art', xp: 32, gold: 76, isElite: true, lootSource: 'dungeonElite' },
  eclipseSovereign: { id: 'eclipseSovereign', name: '蝕月鹿王', maxHp: 5200, attack: 39, artClass: 'dungeon-boss dungeon-monster-art', xp: 180, gold: 620, isBoss: true, lootSource: 'dungeonBoss' }
};
const normalMonsterIds = ['goblin', 'wolf', 'boar'];
const eliteMonsterIds = ['goblinOverlord', 'wolfAlpha', 'boarTyrant'];
const bossMonsterIds = ['goblinKing'];
const mapMonsterPools = {
  beginner: { normal: normalMonsterIds, elite: eliteMonsterIds, boss: bossMonsterIds },
  blackForest: { normal: ['nightGoblin', 'shadowWolf', 'thornBoar'], elite: ['forestShaman', 'moonfangAlpha', 'thornbackTyrant'], boss: ['forestGuardian'] }
};
const eliteSpawnChance = .08;
const bossSpawnChance = .015;
const dungeonEliteIds = ['rootExecutioner', 'altarNightblade', 'moonboneSentinel', 'blightOracle'];
const dungeonBossId = 'eclipseSovereign';

const collectibleTemplates = {
  goblin: { id: 'goblin-badge', name: '哥布林斥候徽記', source: '哥布林', icon: '♟', attack: 1, description: '攻擊／法攻 +1' },
  wolf: { id: 'wolf-moon-fang', name: '月痕狼牙', source: '森林狼', icon: '☾', crit: .01, description: '暴擊率 +1%' },
  boar: { id: 'boar-heart-stone', name: '野豬心石', source: '野豬', icon: '◆', hp: 12, description: '最大生命 +12' },
  goblinOverlord: { id: 'overlord-command-token', name: '督軍號令牌', source: '哥布林督軍', icon: '⚑', defense: 2, description: '防禦 +2' },
  wolfAlpha: { id: 'alpha-frost-claw', name: '狼王霜爪', source: '霜牙狼王', icon: '❄', dodge: .01, description: '閃避率 +1%' },
  boarTyrant: { id: 'tyrant-tusk-core', name: '巨獸獠牙核心', source: '獠牙巨獸', icon: '◇', attack: 2, hp: 20, description: '攻擊／法攻 +2、最大生命 +20' },
  goblinKing: { id: 'red-crown-relic', name: '赤冠王之遺珍', source: '赤冠哥布林王', icon: '♛', attack: 3, defense: 3, hp: 30, description: '攻擊／法攻 +3、防禦 +3、最大生命 +30' },
  nightGoblin: { id: 'night-goblin-lantern', name: '夜行者微光燈', source: '夜行哥布林', icon: '✦', attack: 1, description: '攻擊／法攻 +1' },
  shadowWolf: { id: 'shadow-wolf-pelt', name: '幽影狼皮', source: '幽影森林狼', icon: '◐', crit: .01, description: '暴擊率 +1%' },
  thornBoar: { id: 'thorn-boar-seed', name: '荊棘生命種', source: '荊棘野豬', icon: '❈', hp: 15, description: '最大生命 +15' },
  forestShaman: { id: 'forest-shaman-charm', name: '黑林薩滿符', source: '黑林薩滿', icon: '☽', mana: 12, description: '最大魔力 +12' },
  moonfangAlpha: { id: 'moonfang-emblem', name: '月牙狼王印', source: '月牙狼王', icon: '☾', dodge: .01, description: '閃避率 +1%' },
  thornbackTyrant: { id: 'thornback-shell', name: '棘背硬殼', source: '棘背暴君', icon: '⬟', defense: 2, description: '防禦 +2' },
  forestGuardian: { id: 'corrupt-moon-heart', name: '腐月森林之心', source: '腐月森林守衛', icon: '◉', attack: 2, defense: 2, hp: 25, description: '攻擊／法攻 +2、防禦 +2、最大生命 +25' }
};
const collectibleDropRates = { normal: .01, elite: .08, boss: .30 };

const lootTemplates = {
  goblin: [
    { name: '哥布林短劍', slot: 'weapon', weaponType: 'sword', image: 'assets/goblin-short-sword.png', allowedJobs: ['warrior', 'assassin'], attack: 5, defense: 0, hp: 0 },
    { name: '粗布背心', slot: 'armor', armorType: 'cloth', image: 'assets/rough-cloth-vest.png', allowedJobs: ['mage', 'priest'], attack: 0, defense: 2, hp: 12 },
    { name: '補丁布帽', slot: 'head', armorType: 'cloth', image: 'assets/patchwork-cap.png', allowedJobs: ['mage', 'priest'], attack: 0, defense: 2, hp: 8 },
    { name: '秘法織紋手套', slot: 'gloves', armorType: 'cloth', image: 'assets/arcane-weave-gloves.png', allowedJobs: ['mage'], attack: 3, defense: 2, hp: 10 }
  ],
  wolf: [
    { name: '狼牙匕首', slot: 'weapon', weaponType: 'dagger', image: 'assets/wolf-fang-dagger.png', allowedJobs: ['assassin'], attack: 8, defense: 0, hp: 0 },
    { name: '森林獵弓', slot: 'weapon', weaponType: 'bow', image: 'assets/black-forest-bow.png', allowedJobs: ['hunter'], attack: 8, defense: 0, hp: 0 },
    { name: '獵人皮甲', slot: 'armor', armorType: 'leather', image: 'assets/hunter-leather-armor.png', allowedJobs: ['hunter', 'assassin'], attack: 0, defense: 4, hp: 24 },
    { name: '森林獵手手套', slot: 'gloves', armorType: 'leather', image: 'assets/forest-hunter-gloves.png', allowedJobs: ['hunter', 'assassin'], attack: 2, defense: 2, hp: 10 },
    { name: '聖紋手套', slot: 'gloves', armorType: 'cloth', image: 'assets/holy-sigil-gloves.png', allowedJobs: ['priest'], attack: 2, defense: 2, hp: 16 }
  ],
  boar: [
    { name: '野豬骨法杖', slot: 'weapon', weaponType: 'staff', image: 'assets/boar-bone-staff.png', allowedJobs: ['mage', 'priest'], attack: 10, defense: 0, hp: 0 },
    { name: '獠牙箭筒', slot: 'offhand', weaponType: 'quiver', image: 'assets/hunter-quiver.png', allowedJobs: ['hunter'], attack: 5, defense: 2, hp: 14 },
    { name: '硬皮護甲', slot: 'armor', armorType: 'reinforced-leather', image: 'assets/hardened-hide-armor.png', allowedJobs: ['warrior', 'hunter'], attack: 0, defense: 5, hp: 32 },
    { name: '野豬皮長靴', slot: 'boots', armorType: 'hide', image: 'assets/boarhide-boots.png', allowedJobs: ['warrior', 'hunter'], attack: 0, defense: 3, hp: 22 },
    { name: '獠牙肩甲', slot: 'shoulders', armorType: 'hide', image: 'assets/hunter-shoulders.png', allowedJobs: ['warrior', 'hunter'], attack: 0, defense: 4, hp: 18 },
    { name: '星輝肩飾', slot: 'shoulders', armorType: 'cloth', image: 'assets/starfall-mantle.png', allowedJobs: ['mage'], attack: 4, defense: 2, hp: 14 },
    { name: '聖光披肩', slot: 'shoulders', armorType: 'cloth', image: 'assets/radiant-shoulders.png', allowedJobs: ['priest'], attack: 0, defense: 4, hp: 24 }
  ],
  blackGoblin: [
    { name: '黑林戰刃', slot: 'weapon', weaponType: 'sword', image: 'assets/goblin-short-sword.png', allowedJobs: ['warrior', 'assassin'], attack: 14, defense: 0, hp: 0 },
    { name: '黯影布袍', slot: 'armor', armorType: 'cloth', image: 'assets/rough-cloth-vest.png', allowedJobs: ['mage', 'priest'], attack: 3, defense: 7, hp: 48 },
    { name: '薩滿符印', slot: 'offhand', weaponType: 'focus', image: 'assets/equipment-weapon.png', allowedJobs: ['mage', 'priest'], attack: 9, defense: 4, hp: 24 }
  ],
  blackWolf: [
    { name: '幽影獵弓', slot: 'weapon', weaponType: 'bow', image: 'assets/black-forest-bow.png', allowedJobs: ['hunter'], attack: 16, defense: 0, hp: 0 },
    { name: '月牙匕首', slot: 'weapon', weaponType: 'dagger', image: 'assets/wolf-fang-dagger.png', allowedJobs: ['assassin'], attack: 15, defense: 0, hp: 0 },
    { name: '影狼皮甲', slot: 'armor', armorType: 'leather', image: 'assets/hunter-leather-armor.png', allowedJobs: ['hunter', 'assassin'], attack: 3, defense: 8, hp: 58 }
  ],
  blackBoar: [
    { name: '棘木法杖', slot: 'weapon', weaponType: 'staff', image: 'assets/boar-bone-staff.png', allowedJobs: ['mage', 'priest'], attack: 18, defense: 0, hp: 0 },
    { name: '荊棘重甲', slot: 'armor', armorType: 'heavy', image: 'assets/hardened-hide-armor.png', allowedJobs: ['warrior', 'hunter'], attack: 0, defense: 11, hp: 82 },
    { name: '腐月箭筒', slot: 'offhand', weaponType: 'quiver', image: 'assets/hunter-quiver.png', allowedJobs: ['hunter'], attack: 9, defense: 4, hp: 28 }
  ],
  blackBoss: [
    { name: '腐月核心', slot: 'necklace', armorType: 'relic', image: 'assets/red-crown-amulet.png', allowedJobs: ['warrior', 'assassin', 'hunter', 'mage', 'priest'], attack: 12, defense: 12, hp: 100 },
    { name: '森林守衛根戒', slot: 'ring1', armorType: 'relic', image: 'assets/red-crown-amulet.png', allowedJobs: ['warrior', 'assassin', 'hunter', 'mage', 'priest'], attack: 7, defense: 7, hp: 60 }
  ],
  boss: [
    { name: '赤冠王印', slot: 'necklace', armorType: 'royal', image: 'assets/red-crown-amulet.png', allowedJobs: ['warrior', 'assassin', 'hunter', 'mage', 'priest'], attack: 8, defense: 8, hp: 70 }
  ]
};
const potionDropRate = .10;
const manaPotionDropRate = .07;
const equipmentDropRate = .08;
const eliteEquipmentDropRate = .25;
const bossEquipmentDropRate = .35;

function equipmentDropTier(source = '') {
  if (source === 'dungeonBoss' || source === 'dungeonElite') return 3;
  if (String(source).startsWith('black')) return 2;
  return 1;
}

function rollEquipmentBase(value, stat, tier = 1) {
  if (!value) return 0;
  const multiplier = .80 + Math.random() * .50;
  const tierSwing = stat === 'hp' ? tier * 4 : tier;
  return Math.max(1, Math.round(value * multiplier + Math.random() * tierSwing));
}

const dungeonClassSets = {
  warrior: [
    { name: '暮衛戰刃', slot: 'weapon', weaponType: 'sword', image: 'assets/goblin-short-sword.png', attack: 26, defense: 4, hp: 34 },
    { name: '暮衛重甲', slot: 'armor', armorType: 'heavy', image: 'assets/hardened-hide-armor.png', attack: 4, defense: 16, hp: 120 }
  ],
  assassin: [
    { name: '影祭雙刃', slot: 'weapon', weaponType: 'dagger', image: 'assets/wolf-fang-dagger.png', attack: 29, defense: 3, hp: 28 },
    { name: '影祭夜衣', slot: 'armor', armorType: 'leather', image: 'assets/hunter-leather-armor.png', attack: 7, defense: 13, hp: 88 }
  ],
  hunter: [
    { name: '月痕長弓', slot: 'weapon', weaponType: 'bow', image: 'assets/black-forest-bow.png', attack: 29, defense: 3, hp: 30 },
    { name: '月痕獵裝', slot: 'armor', armorType: 'leather', image: 'assets/hunter-leather-armor.png', attack: 6, defense: 14, hp: 96 }
  ],
  mage: [
    { name: '星蝕法杖', slot: 'weapon', weaponType: 'staff', image: 'assets/boar-bone-staff.png', attack: 32, defense: 2, hp: 24 },
    { name: '星蝕法袍', slot: 'armor', armorType: 'cloth', image: 'assets/rough-cloth-vest.png', attack: 9, defense: 11, hp: 82 }
  ],
  priest: [
    { name: '靈木聖杖', slot: 'weapon', weaponType: 'staff', image: 'assets/boar-bone-staff.png', attack: 27, defense: 4, hp: 48 },
    { name: '靈木祭袍', slot: 'armor', armorType: 'cloth', image: 'assets/rough-cloth-vest.png', attack: 6, defense: 13, hp: 104 }
  ]
};

function createDungeonSetDrop(enemy) {
  const character = JSON.parse(localStorage.getItem('stardust-character') || 'null');
  const choices = dungeonClassSets[character?.job] || dungeonClassSets.warrior;
  const base = choices[Math.floor(Math.random() * choices.length)];
  return { ...base, id: `altar-set-${Date.now()}-${Math.floor(Math.random() * 100000)}`, kind: 'equipment', quality: '套裝', attack: rollEquipmentBase(base.attack, 'attack', 3), defense: rollEquipmentBase(base.defense, 'defense', 3), hp: rollEquipmentBase(base.hp, 'hp', 3), setId: `${character?.job || 'warrior'}-altar`, setName: '黑森林祭壇套裝', allowedJobs: [character?.job || 'warrior'] };
}

const equipmentSlots = {
  weapon: { label: '武器', icon: '⚔' },
  offhand: { label: '副手', icon: '🛡' },
  head: { label: '頭盔', icon: '⛑' },
  armor: { label: '盔甲', icon: '🦺' },
  pants: { label: '褲子', icon: '👖' },
  gloves: { label: '手套', icon: '🧤' },
  boots: { label: '鞋子', icon: '👢' },
  wrist: { label: '手環', icon: '◌' },
  shoulders: { label: '肩膀', icon: '◈' },
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
      { name: '見習鐵劍', slot: 'weapon', weaponType: 'sword', image: 'assets/goblin-short-sword.png', attack: 5, defense: 1, hp: 0 },
      { name: '見習戰甲', slot: 'armor', armorType: 'heavy', image: 'assets/hardened-hide-armor.png', attack: 0, defense: 3, hp: 20 }
    ],
    assassin: [
      { name: '見習匕首', slot: 'weapon', weaponType: 'dagger', image: 'assets/wolf-fang-dagger.png', attack: 6, defense: 0, hp: 0 },
      { name: '見習夜行衣', slot: 'armor', armorType: 'leather', image: 'assets/hunter-leather-armor.png', attack: 1, defense: 2, hp: 14 }
    ],
    hunter: [
      { name: '見習短弓', slot: 'weapon', weaponType: 'bow', image: 'assets/black-forest-bow.png', attack: 6, defense: 0, hp: 0 },
      { name: '見習獵裝', slot: 'armor', armorType: 'leather', image: 'assets/hunter-leather-armor.png', attack: 0, defense: 2, hp: 16 }
    ],
    mage: [
      { name: '見習法杖', slot: 'weapon', weaponType: 'staff', image: 'assets/boar-bone-staff.png', attack: 7, defense: 0, hp: 0 },
      { name: '見習法袍', slot: 'armor', armorType: 'cloth', image: 'assets/rough-cloth-vest.png', attack: 1, defense: 2, hp: 12 }
    ],
    priest: [
      { name: '見習聖杖', slot: 'weapon', weaponType: 'staff', image: 'assets/boar-bone-staff.png', attack: 5, defense: 1, hp: 8 },
      { name: '見習祭袍', slot: 'armor', armorType: 'cloth', image: 'assets/rough-cloth-vest.png', attack: 0, defense: 3, hp: 18 }
    ]
  };
  const equipment = emptyEquipment();
  (starterSets[job] || starterSets.warrior).forEach((item, index) => {
    equipment[item.slot] = { ...item, id: `starter-${job}-${item.slot}-${index}`, kind: 'equipment', quality: '普通', allowedJobs: [job] };
  });
  return equipment;
}

function applyEquipmentVisual(item) {
  if (!item || item.kind !== 'equipment') return item;
  if (item.name === '野豬獠牙槍') return { ...item, name: '野豬骨法杖', weaponType: 'staff', image: 'assets/boar-bone-staff.png' };
  const template = Object.values(lootTemplates).flat().find((entry) => entry.name === item.name);
  return template ? { ...item, image: template.image, weaponType: template.weaponType, armorType: template.armorType, allowedJobs: template.allowedJobs } : item;
}

function getProgress() {
  const saved = JSON.parse(localStorage.getItem('stardust-progress') || '{}');
  if (saved.magicCrystals === undefined && saved.skillEssence !== undefined) {
    saved.magicCrystals = Math.max(0, Number(saved.skillEssence) || 0);
    delete saved.skillEssence;
  }
  if (saved.starterGearVersion !== 'starter-gear-v1') {
    const character = JSON.parse(localStorage.getItem('stardust-character') || 'null');
    if (character?.job) {
      const starterEquipment = createStarterEquipment(character.job);
      saved.equipment = { ...emptyEquipment(), ...(saved.equipment || {}) };
      if (!saved.equipment.weapon) saved.equipment.weapon = starterEquipment.weapon;
      if (!saved.equipment.armor) saved.equipment.armor = starterEquipment.armor;
    }
    saved.starterGearVersion = 'starter-gear-v1';
    localStorage.setItem('stardust-progress', JSON.stringify(saved));
  }
  if (saved.inventoryCleanupVersion !== 'equipment-clean-v1') {
    saved.inventory = (Array.isArray(saved.inventory) ? saved.inventory : []).filter((item) => item.kind !== 'equipment');
    saved.inventoryCleanupVersion = 'equipment-clean-v1';
    localStorage.setItem('stardust-progress', JSON.stringify(saved));
  }
  if (saved.equipmentVisualMigrationVersion !== 'individual-item-images-v3') {
    saved.inventory = (Array.isArray(saved.inventory) ? saved.inventory : []).map(applyEquipmentVisual);
    saved.equipment = Object.fromEntries(Object.entries(saved.equipment || {}).map(([slot, item]) => [slot, applyEquipmentVisual(item)]));
    saved.equipmentVisualMigrationVersion = 'individual-item-images-v3';
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
  if (saved.jobRestrictionMigrationVersion !== 'job-restriction-v1') {
    const character = JSON.parse(localStorage.getItem('stardust-character') || 'null');
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
  const inventory = Array.isArray(saved.inventory) ? saved.inventory : [];
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
    selectedMapId: 'beginner-plains',
    inventory: [],
    equipment: emptyEquipment(),
    collection: {},
    ...saved,
    inventory,
    equipment: { ...emptyEquipment(), ...(saved.equipment || {}) },
    collection: saved.collection && typeof saved.collection === 'object' ? saved.collection : {},
    skillBooks: saved.skillBooks && typeof saved.skillBooks === 'object' ? saved.skillBooks : {}
  };
  syncSkillMaterialInventory(normalizedProgress);
  return normalizedProgress;
}

function getCharacterSlots() {
  let slots = JSON.parse(localStorage.getItem('stardust-character-slots') || '[]');
  if (!Array.isArray(slots)) slots = [];
  const legacyCharacter = JSON.parse(localStorage.getItem('stardust-character') || 'null');
  if (!slots.length && legacyCharacter) {
    slots[0] = { character: legacyCharacter, progress: getProgress() };
    localStorage.setItem('stardust-character-slots', JSON.stringify(slots));
    localStorage.setItem('stardust-active-character-slot', '0');
  }
  return slots;
}

function getLockedFactionForCreation(slotIndex = creationSlotIndex) {
  return getCharacterSlots().find((slot, index) => index !== slotIndex && slot?.character?.faction)?.character.faction || null;
}

function syncActiveCharacterSlot(progressOverride = null) {
  const character = JSON.parse(localStorage.getItem('stardust-character') || 'null');
  if (!character) return;
  const activeIndex = Number(localStorage.getItem('stardust-active-character-slot') || 0);
  const slots = JSON.parse(localStorage.getItem('stardust-character-slots') || '[]');
  slots[activeIndex] = { character, progress: progressOverride || JSON.parse(localStorage.getItem('stardust-progress') || '{}') };
  localStorage.setItem('stardust-character-slots', JSON.stringify(slots));
}

function saveProgress(progress) {
  syncSkillMaterialInventory(progress);
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
  const enhancementBonus = Math.round(baseValue * .05 * Math.max(0, Math.min(3, item.enhanceLevel || 0)));
  return baseValue + affixValue + enhancementBonus;
}

const enhancementRules = {
  1: { successRate: 1, starIron: 1, gold: 100 },
  2: { successRate: .8, starIron: 2, gold: 250 },
  3: { successRate: .6, starIron: 3, gold: 500 }
};

function enhanceEquipment(slot) {
  const progress = getProgress();
  const item = progress.equipment?.[slot];
  if (!item) return;
  const currentLevel = Math.max(0, Math.min(3, item.enhanceLevel || 0));
  if (currentLevel >= 3) { showToast('這件裝備已強化至最高 +3。'); return; }
  const targetLevel = currentLevel + 1;
  const rule = enhancementRules[targetLevel];
  const resources = getAccountResources();
  if (resources.starIron < rule.starIron) { showToast(`星鐵碎片不足，需要 ${rule.starIron} 個。`); return; }
  if (progress.gold < rule.gold) { showToast(`金幣不足，需要 ${rule.gold} 金幣。`); return; }
  resources.starIron -= rule.starIron;
  progress.gold -= rule.gold;
  const succeeded = Math.random() < rule.successRate;
  if (succeeded) item.enhanceLevel = targetLevel;
  saveAccountResources(resources);
  saveProgress(progress);
  if (succeeded) {
    showToast(`強化成功！${item.name} +${targetLevel}`);
    logBattle(`⚒ 強化成功【${item.name} +${targetLevel}】`, 'progress');
  } else {
    showToast(`強化失敗，${item.name} 維持 +${currentLevel}。`);
    logBattle(`⚒ 強化失敗【${item.name}】維持 +${currentLevel}`, 'system');
  }
  renderInventory('equipment');
  if (fighting) updateBattleUI();
}

function activateCharacterSlot(index) {
  syncActiveCharacterSlot();
  const slot = getCharacterSlots()[index];
  if (!slot) return;
  localStorage.setItem('stardust-active-character-slot', String(index));
  localStorage.setItem('stardust-character', JSON.stringify(slot.character));
  localStorage.setItem('stardust-progress', JSON.stringify(slot.progress));
  document.querySelector('#character-roster-modal').classList.add('hidden');
  claimOfflineRewards();
  showToast(`已切換角色：${slot.character.name}`);
}

function renderCharacterRoster() {
  syncActiveCharacterSlot();
  const slots = getCharacterSlots();
  const activeIndex = Number(localStorage.getItem('stardust-active-character-slot') || 0);
  const content = document.querySelector('#character-roster-content');
  content.innerHTML = [0, 1].map((index) => {
    const slot = slots[index];
    if (!slot) return `<article class="character-slot empty"><div><b>角色欄位 ${index + 1}</b><small>尚未建立角色</small></div><button type="button" data-create-character-slot="${index}">＋ 建立角色</button></article>`;
    const raceName = Object.values(factions).flat().find((race) => race.id === slot.character.race)?.name || slot.character.race;
    const jobName = classes.find((job) => job.id === slot.character.job)?.name || slot.character.job;
    return `<article class="character-slot ${index === activeIndex ? 'active' : ''}"><span class="creation-race-icon race-${slot.character.race}" aria-hidden="true"></span><div><b>${slot.character.name}${index === activeIndex ? '　目前使用' : ''}</b><small>${raceName}・${jobName}・Lv. ${slot.progress.level || 1}</small></div>${index === activeIndex ? '<em>使用中</em>' : `<button type="button" data-activate-character-slot="${index}">切換角色</button>`}</article>`;
  }).join('');
  document.querySelector('#character-roster-modal').classList.remove('hidden');
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
  const progress = getProgress();
  progress.lastActiveAt = Date.now();
  saveProgress(progress);
}

function claimOfflineRewards() {
  const character = JSON.parse(localStorage.getItem('stardust-character') || 'null');
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
  const killsPerMinute = Math.max(2, Math.round(6 * stats.attackSpeed));
  const defeated = Math.floor(offlineMs / 60000 * killsPerMinute);
  let gainedXp = 0;
  let levelsGained = 0;
  let equipmentFound = 0;
  for (let kill = 0; kill < defeated; kill += 1) {
    const gained = getActiveMap(progress).normalXp;
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
    if (Math.random() < equipmentDropRate * offlineEquipmentRateMultiplier) {
      const enemy = monsterTypes[randomEnemyId()];
      progress.inventory.unshift(createEquipmentDrop(enemy));
      equipmentFound += 1;
    }
  }
  const gainedGold = defeated * 2;
  progress.gold += gainedGold;
  saveProgress(progress);
  pendingOfflineReport = { duration: formatOfflineDuration(offlineMs), defeated, gainedXp, gainedGold, levelsGained, equipmentFound, capped: now - lastActiveAt > offlineLimitMs };
  showToast(`離線掛機 ${pendingOfflineReport.duration}：獲得 ${gainedXp} EXP、${gainedGold} 金幣、${equipmentFound} 件裝備`);
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
  let entries = battleLogEntries;
  if (battleLogMode === 'player') entries = entries.filter((entry) => ['damage-dealt', 'pet-damage'].includes(entry.type));
  if (battleLogMode === 'enemy') entries = entries.filter((entry) => entry.type === 'damage-taken');
  if (battleLogMode === 'loot') entries = entries.filter((entry) => ['loot', 'reward', 'progress'].includes(entry.type));
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
  return getActiveMap(getProgress()).id === 'black-forest' ? mapMonsterPools.blackForest : mapMonsterPools.beginner;
}

function randomEnemyId(level = getProgress().level) { const pool = getMonsterPool(level).normal; return pool[Math.floor(Math.random() * pool.length)]; }
function randomEliteId(level = getProgress().level) { const pool = getMonsterPool(level).elite; return pool[Math.floor(Math.random() * pool.length)]; }
function randomBossId(level = getProgress().level) { const pool = getMonsterPool(level).boss; return pool[Math.floor(Math.random() * pool.length)]; }

function createEnemyTypes(playerLevel = 1) {
  const types = [...getMonsterPool(playerLevel).normal];
  while (types.length < 5) types.push(randomEnemyId(playerLevel));
  const specialRoll = Math.random();
  if (playerLevel >= 4 && specialRoll < bossSpawnChance) types[Math.floor(Math.random() * types.length)] = randomBossId(playerLevel);
  else if (specialRoll < bossSpawnChance + eliteSpawnChance) types[Math.floor(Math.random() * types.length)] = randomEliteId(playerLevel);
  return types.sort(() => Math.random() - .5);
}

function createDungeonWaveTypes(wave) {
  const enemyCount = wave <= 3 ? 3 : wave <= 6 ? 4 : 5;
  const eliteCount = wave === 10 ? 4 : enemyCount;
  const types = Array.from({ length: eliteCount }, () => dungeonEliteIds[Math.floor(Math.random() * dungeonEliteIds.length)]);
  if (wave === 10) types.push(dungeonBossId);
  return types;
}

function loadDungeonWave(wave) {
  const enemyTypes = createDungeonWaveTypes(wave);
  const now = Date.now();
  battle.dungeonWave = wave;
  battle.enemyTypes = enemyTypes;
  battle.enemyHps = enemyTypes.map((type) => monsterTypes[type].maxHp);
  battle.enemyRespawns = enemyTypes.map(() => null);
  battle.enemySpawnedAt = enemyTypes.map((_, index) => now + index);
  battle.enemyDots = enemyTypes.map(() => []);
  battle.enemyDamages = enemyTypes.map(() => []);
  battle.targetIndexes = [];
  battle.waveTransitioning = false;
  logBattle(`◆ 黑森林祭壇第 ${wave}／10 波開始：${enemyTypes.length} 名精英來襲。`, 'system');
  showToast(`副本第 ${wave}／10 波`);
  updateBattleUI();
}

function completeDungeon() {
  const progress = getProgress();
  progress.selectedMapId = 'black-forest';
  saveProgress(progress);
  battle.dungeonComplete = true;
  battle.waveTransitioning = false;
  fighting = false;
  clearInterval(battleTimer);
  clearInterval(skillTimer);
  clearInterval(enemyAttackTimer);
  document.querySelector('#battle-toggle').textContent = '副本完成';
  logBattle('♛ 黑森林祭壇攻略完成！你已擊破全部 10 波精英。', 'progress');
  showToast('黑森林祭壇攻略完成！');
  setTimeout(() => {
    if (!battle.dungeonComplete) return;
    openBattle();
    showToast('已返回黑森林，掛機戰鬥繼續');
  }, 1200);
}

function hasAliveBoss(excludeIndex = -1) {
  return battle.enemyTypes.some((type, index) => index !== excludeIndex && battle.enemyHps[index] > 0 && monsterTypes[type]?.isBoss);
}

function getEnemyDefinition(index) { return monsterTypes[battle.enemyTypes[index]] || monsterTypes.goblin; }

function getMonsterAttackPower(enemy, progress = getProgress()) {
  const map = getActiveMap(progress);
  const monsterLevel = Math.min(map.max, Math.max(map.min, progress.level));
  const levelMultiplier = 1 + (monsterLevel - 1) * .10;
  const rankMultiplier = enemy.isBoss ? 2.4 : enemy.isElite ? 1.65 : 1;
  const randomMultiplier = .9 + Math.random() * .2;
  return Math.max(1, Math.round((enemy.attack || 10) * levelMultiplier * rankMultiplier * randomMultiplier));
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
  return Object.values(progress.equipment || {}).filter(Boolean).reduce((stats, item) => ({
    attack: stats.attack + effectiveEquipmentStat(item, 'attack'),
    defense: stats.defense + effectiveEquipmentStat(item, 'defense'),
    hp: stats.hp + effectiveEquipmentStat(item, 'hp')
  }), { attack: 0, defense: 0, hp: 0 });
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
  const selected = mapProgression.find((map) => map.id === progress.selectedMapId && map.implemented && progress.level >= map.min);
  if (selected) return selected;
  return mapProgression.find((map) => map.id === 'beginner-plains') || mapProgression[0];
}

function getCharacterStats(level, progress = getProgress(), character = JSON.parse(localStorage.getItem('stardust-character') || 'null')) {
  const base = classBaseStats[character?.job] || classBaseStats.warrior;
  const race = raceAdjustments[character?.race] || raceAdjustments.human;
  const equipment = getEquipmentStats(progress);
  const collection = getCollectionStats(progress);
  const humanMultiplier = character?.race === 'human' ? 1.05 : 1;
  const passiveUpgradeLevels = (skillProgression[character?.job] || [])
    .filter((skill) => skill.type === 'passive' && level >= skill.level)
    .reduce((total, skill) => total + getSkillUpgradeLevel(progress, character.job, skill) - 1, 0);
  const passiveMultiplier = 1 + passiveUpgradeLevels * .015;
  return {
    hp: Math.round((base.hp + race.hp + (level - 1) * 12 + equipment.hp + collection.hp) * humanMultiplier * passiveMultiplier),
    mana: Math.round((base.mana + race.mana + (level - 1) * 6 + collection.mana) * humanMultiplier),
    attack: Math.round((base.attack + race.attack + (level - 1) + equipment.attack + collection.attack) * humanMultiplier * passiveMultiplier),
    defense: Math.round((base.defense + race.defense + Math.floor((level - 1) / 5) + equipment.defense + collection.defense) * humanMultiplier * passiveMultiplier),
    crit: Math.min(.60, base.crit + race.crit + collection.crit),
    dodge: Math.min(.45, Math.max(0, base.dodge + race.dodge + collection.dodge)),
    attackSpeed: base.attackSpeed,
    cooldownSpeed: character?.race === 'elf' ? 1.03 : 1,
    dotMultiplier: character?.race === 'undead' ? 1.20 : 1
  };
}

function getMaxHp(level, progress = getProgress()) { return getCharacterStats(level, progress).hp; }

function createEquipmentDrop(enemy) {
  const choices = lootTemplates[enemy.lootSource || enemy.id] || lootTemplates.goblin;
  const base = choices[Math.floor(Math.random() * choices.length)];
  const source = enemy.lootSource || enemy.id;
  const tier = equipmentDropTier(source);
  const blackForestDrop = String(source).startsWith('black');
  const isExcellent = blackForestDrop && Math.random() < .40;
  const item = {
    ...base,
    id: `${enemy.id}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    kind: 'equipment',
    allowedJobs: base.allowedJobs,
    quality: isExcellent ? '優良' : '普通',
    attack: rollEquipmentBase(base.attack, 'attack', tier),
    defense: rollEquipmentBase(base.defense, 'defense', tier),
    hp: rollEquipmentBase(base.hp, 'hp', tier)
  };
  if (isExcellent) {
    const affixPool = ['weapon', 'offhand'].includes(item.slot)
      ? [{ name: '鋒利', stat: 'attack', value: 5, text: '攻擊 +5' }, { name: '獵殺', stat: 'attack', value: 7, text: '攻擊 +7' }, { name: '活力', stat: 'hp', value: 30, text: '生命 +30' }]
      : [{ name: '堅固', stat: 'defense', value: 4, text: '防禦 +4' }, { name: '活力', stat: 'hp', value: 45, text: '生命 +45' }, { name: '守護', stat: 'defense', value: 3, secondaryStat: 'hp', secondaryValue: 30, text: '防禦 +3、生命 +30' }];
    const affix = affixPool[Math.floor(Math.random() * affixPool.length)];
    item[affix.stat] = (item[affix.stat] || 0) + affix.value;
    if (affix.secondaryStat) item[affix.secondaryStat] = (item[affix.secondaryStat] || 0) + affix.secondaryValue;
    item.affix = affix;
  }
  return item;
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

function addLoot(progress, enemy) {
  if (enemy.lootSource === 'dungeonBoss' || (enemy.lootSource === 'dungeonElite' && Math.random() < .12)) {
    const item = createDungeonSetDrop(enemy);
    progress.inventory.unshift(item);
    return item;
  }
  if (enemy.isBoss) {
    if (Math.random() >= bossEquipmentDropRate) return null;
    const item = createEquipmentDrop(enemy);
    progress.inventory.unshift(item);
    return item;
  }
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
  const equipmentChance = enemy.isElite ? eliteEquipmentDropRate : equipmentDropRate;
  if (roll < potionDropRate + manaPotionDropRate + equipmentChance) {
    const item = createEquipmentDrop(enemy);
    progress.inventory.unshift(item);
    return item;
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
  if (item.attack) parts.push(`攻擊 +${effectiveEquipmentStat(item, 'attack')}`);
  if (item.defense) parts.push(`防禦 +${effectiveEquipmentStat(item, 'defense')}`);
  if (item.hp) parts.push(`生命 +${effectiveEquipmentStat(item, 'hp')}`);
  if (item.affix) parts.push(`詞綴【${item.affix.name}】：${item.affix.text}`);
  if (item.allowedJobs?.length) parts.push(`職業：${item.allowedJobs.map((job) => ({ warrior: '戰士', assassin: '刺客', hunter: '獵人', mage: '法師', priest: '牧師' })[job] || job).join('、')}`);
  return parts.join('　') || item.description || '';
}

function itemCategory(item) {
  if (item.kind === 'consumable' || item.kind === 'material') return 'consumable';
  if (item.kind === 'equipment' && ['weapon', 'offhand'].includes(item.slot)) return 'weapon';
  if (item.kind === 'equipment') return 'armor';
  return 'other';
}

function isItemWearableByCharacter(item, character) {
  return item.kind !== 'equipment' || !item.allowedJobs?.length || Boolean(character && item.allowedJobs.includes(character.job));
}

function equipmentValue(item) {
  return equipmentScore(item);
}

function equipmentScore(item) {
  if (!item || item.kind !== 'equipment') return 0;
  return Math.round(effectiveEquipmentStat(item, 'attack') * 4 + effectiveEquipmentStat(item, 'defense') * 6 + effectiveEquipmentStat(item, 'hp') * .25);
}

function equipmentStackKey(item) {
  return JSON.stringify({
    name: item.name,
    quality: item.quality || '普通',
    slot: item.slot,
    weaponType: item.weaponType || '',
    armorType: item.armorType || '',
    attack: item.attack || 0,
    defense: item.defense || 0,
    hp: item.hp || 0,
    enhanceLevel: item.enhanceLevel || 0,
    affix: item.affix || null,
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

function itemQualityClass(item) { return item.quality === '優良' ? 'quality-excellent' : item.quality === '稀有' ? 'quality-rare' : 'quality-normal'; }

function renderInventory(view = 'inventory') {
  const progress = getProgress();
  const character = JSON.parse(localStorage.getItem('stardust-character') || 'null');
  const modal = document.querySelector('#inventory-modal');
  const title = document.querySelector('#inventory-title');
  const content = document.querySelector('#inventory-content');
  title.textContent = view === 'equipment' ? '裝備' : '背包';
  const accountResources = getAccountResources();
  const resourceBar = `<section class="account-resource-bar"><span>◆ 星鐵碎片 <b>${accountResources.starIron}</b></span><span>🗝 黑森林祭壇鑰匙 <b>${accountResources.dungeonKeys.blackForestAltar || 0}</b></span></section>`;
  const renderItemCard = (item, options = {}) => {
    const equipped = Boolean(options.equipped);
    const wearable = isItemWearableByCharacter(item, character);
    const slot = options.slot ? `・${options.slot}` : '';
    const stackIds = item.stackIds || [item.id];
    const stackQuantity = item.kind === 'equipment' ? (item.stackQuantity || 1) : item.quantity;
    const scrapControl = item.kind === 'equipment' && !equipped && options.allowScrap !== false
      ? `<label class="scrap-select"><input type="checkbox" data-scrap-ids="${stackIds.join(',')}" ${stackIds.every((id) => scrapSelection.has(id)) ? 'checked' : ''}><span>廢品${stackIds.length > 1 ? '（整疊）' : ''}</span></label>`
      : '';
    const visual = item.kind === 'equipment' ? `<img src="${itemImagePath(item)}" alt="" class="equipment-item-image">` : item.icon || '◈';
    const currentItem = item.kind === 'equipment' ? progress.equipment[item.slot] : null;
    const score = equipmentScore(item);
    const scoreDifference = score - equipmentScore(currentItem);
    const scoreText = item.kind === 'equipment' ? `<em class="equipment-score">評分 ${score}${!equipped ? `<span class="score-difference ${scoreDifference >= 0 ? 'upgrade' : 'downgrade'}">${scoreDifference >= 0 ? '▲' : '▼'} ${Math.abs(scoreDifference)}</span>` : ''}</em>` : '';
    const comparison = item.kind === 'equipment' && !equipped ? `<aside class="equipment-compare-tooltip"><strong>目前穿戴・${equipmentSlots[item.slot]?.label || item.slot}</strong>${currentItem ? `<div><span class="compare-item-icon"><img src="${itemImagePath(currentItem)}" alt=""></span><p><b>${currentItem.name}</b><small>評分 ${equipmentScore(currentItem)}　${currentItem.quality || '裝備'}　${itemStatsText(currentItem)}</small></p></div>` : '<p class="compare-empty">此欄位目前沒有穿戴裝備</p>'}</aside>` : '';
    return `<article class="inventory-item ${itemQualityClass(item)} ${equipped ? 'is-equipped' : ''} ${!wearable ? 'incompatible' : ''}" tabindex="${item.kind === 'equipment' && !equipped ? '0' : '-1'}"><span class="item-icon">${visual}</span><div><b>${item.name}${stackQuantity > 1 ? ` ×${stackQuantity}` : ''}${equipped ? '<mark>已穿戴</mark>' : ''}</b><small><span class="item-quality">${item.quality || '道具'}</span>${slot}　${itemStatsText(item)}</small>${scoreText}</div>${item.kind === 'equipment' && !equipped ? wearable ? `<button type="button" data-equip-id="${item.id}">穿戴</button>` : '<span class="equip-blocked">無法穿戴</span>' : ''}${scrapControl}${comparison}</article>`;
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
      const wearableDifference = Number(isItemWearableByCharacter(second, character)) - Number(isItemWearableByCharacter(first, character));
      return wearableDifference || equipmentValue(second) - equipmentValue(first) || first.name.localeCompare(second.name, 'zh-Hant');
    });
  const stackedItems = stackIdenticalEquipment(filteredItems);
  const itemCards = stackedItems.length
    ? stackedItems.map(renderItemCard).join('')
    : '<p class="empty-inventory">這個分類目前沒有物品。</p>';
  const selectedScrapCount = [...scrapSelection].filter((id) => progress.inventory.some((item) => item.id === id && item.kind === 'equipment')).length;
  const scrappableItems = progress.inventory.filter((item) => item.kind === 'equipment' && itemCategory(item) === inventoryCategory);
  const allScrapSelected = scrappableItems.length > 0 && scrappableItems.every((item) => scrapSelection.has(item.id));
  const categoryLabel = inventoryCategory === 'weapon' ? '武器' : inventoryCategory === 'armor' ? '防具' : '裝備';
  const scrapTools = `<section class="scrap-tools"><div><b>廢品整理</b><small>目前分類：${categoryLabel}。武器與防具分開勾選。</small></div><label class="scrap-select select-all-scrap"><input type="checkbox" data-select-all-scrap ${allScrapSelected ? 'checked' : ''} ${scrappableItems.length ? '' : 'disabled'}><span>全部勾選${categoryLabel}</span></label><button type="button" data-delete-scrap ${selectedScrapCount ? '' : 'disabled'}>刪除已勾選（${selectedScrapCount}）</button></section>`;
  const paperDoll = Object.entries(equipmentSlots).map(([slot, info]) => {
    const item = progress.equipment[slot];
    const visual = item ? `<img src="${itemImagePath(item)}" alt="" class="paper-doll-item-image">` : info.icon;
    const enhanceLevel = item?.enhanceLevel || 0;
    const nextRule = enhancementRules[enhanceLevel + 1];
    const enhanceButton = item ? enhanceLevel >= 3 ? '<button class="enhance-button maxed" type="button" disabled>強化 +3（最高）</button>' : `<button class="enhance-button" type="button" data-enhance-slot="${slot}">強化至 +${enhanceLevel + 1}<small>${nextRule.starIron} 碎片・${nextRule.gold} 金幣・${Math.round(nextRule.successRate * 100)}%</small></button>` : '';
    return `<article class="equipment-frame slot-${slot} ${item ? `equipped ${itemQualityClass(item)}` : ''}"><span class="equipment-frame-icon">${visual}</span><b>${info.label}</b><small>${item ? `${item.name}${enhanceLevel ? ` +${enhanceLevel}` : ''}` : '空欄位'}</small>${item ? `<em><span class="item-quality">${item.quality}</span>　${itemStatsText(item)}</em>${enhanceButton}` : ''}</article>`;
  }).join('');
  content.innerHTML = view === 'equipment'
    ? `${resourceBar}<section class="paper-doll" aria-label="角色裝備紙娃娃"><span class="paper-doll-silhouette" aria-hidden="true">🧍</span>${paperDoll}</section>`
    : `${resourceBar}${inventoryTabs}${scrapTools}<section class="inventory-list">${itemCards}</section>`;
  modal.classList.remove('hidden');
  modal.dataset.view = view;
}

function renderCharacterAbilities() {
  const character = JSON.parse(localStorage.getItem('stardust-character') || 'null');
  if (!character) return;
  const progress = getProgress();
  const stats = getCharacterStats(progress.level, progress, character);
  const equipment = getEquipmentStats(progress);
  const collection = getCollectionStats(progress);
  const race = Object.values(factions).flat().find((item) => item.id === character.race);
  const job = classes.find((item) => item.id === character.job);
  const modal = document.querySelector('#inventory-modal');
  document.querySelector('#inventory-title').textContent = '角色能力';
  document.querySelector('#inventory-content').innerHTML = `
    <section class="ability-summary">
      <div class="ability-identity"><span class="creation-race-icon race-${character.race}" aria-hidden="true"></span><div><h3>${character.name}</h3><p>${race?.name || character.race}・${job?.name || character.job}・Lv. ${progress.level}</p><small>${race?.trait || ''}</small></div></div>
      <div class="ability-grid">
        <article><small>最大生命</small><b>${stats.hp}</b><em>裝備 +${equipment.hp}・收藏 +${collection.hp}</em></article>
        <article><small>最大魔力</small><b>${stats.mana}</b><em>收藏 +${collection.mana}</em></article>
        <article><small>攻擊／法攻</small><b>${stats.attack}</b><em>裝備 +${equipment.attack}・收藏 +${collection.attack}</em></article>
        <article><small>防禦</small><b>${stats.defense}</b><em>裝備 +${equipment.defense}・收藏 +${collection.defense}</em></article>
        <article><small>暴擊率</small><b>${(stats.crit * 100).toFixed(1)}%</b><em>上限 60%</em></article>
        <article><small>閃避率</small><b>${(stats.dodge * 100).toFixed(1)}%</b><em>上限 45%</em></article>
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

function renderMapSelector() {
  const progress = getProgress();
  const resources = getAccountResources();
  const character = JSON.parse(localStorage.getItem('stardust-character') || 'null');
  const stats = getCharacterStats(progress.level, progress, character);
  const activeMap = getActiveMap(progress);
  const maps = mapProgression.filter((map) => map.implemented);
  const modal = document.querySelector('#inventory-modal');
  document.querySelector('#inventory-title').textContent = '選擇冒險地圖';
  document.querySelector('#inventory-content').innerHTML = `<section class="map-selection-grid">${maps.map((map) => {
    const unlocked = progress.level >= map.min;
    const recommended = map.recommended || { attack: 0, defense: 0, hp: 0 };
    const ready = stats.attack >= recommended.attack && stats.defense >= recommended.defense && stats.hp >= recommended.hp;
    const recommendation = `<strong class="map-recommendation ${ready ? 'ready' : 'danger'}">${ready ? '✓ 能力達標' : '⚠ 建議整備'}　攻 ${recommended.attack}・防 ${recommended.defense}・生命 ${recommended.hp}</strong>`;
    const dungeonKeys = resources.dungeonKeys?.blackForestAltar || 0;
    const detail = map.dungeon ? `<em>10 波精英・第 10 波最終 BOSS・職業套裝</em><strong class="dungeon-key-count">祭壇鑰匙：${dungeonKeys}</strong>` : `<em>普通 ${map.normalXp} EXP・精英 ${map.eliteXp} EXP・Boss ${map.bossXp} EXP</em>`;
    const action = map.dungeon
      ? unlocked ? `<button type="button" data-select-map="${map.id}" ${dungeonKeys < 1 ? 'disabled' : ''}>${dungeonKeys > 0 ? '消耗鑰匙進入' : '需要祭壇鑰匙'}</button>` : `<span>Lv. ${map.min} 解鎖</span>`
      : unlocked ? map.id === activeMap.id ? '<span>目前地圖</span>' : `<button type="button" data-select-map="${map.id}">前往地圖</button>` : `<span>Lv. ${map.min} 解鎖</span>`;
    return `<article class="map-selection-card ${map.dungeon ? 'dungeon-card' : ''} ${map.id === activeMap.id ? 'selected' : ''} ${unlocked ? '' : 'locked'}" style="--map-preview:url('${map.background}')"><div><b>${map.dungeon ? '◆ ' : ''}${map.name}</b><small>怪物等級 Lv. ${map.min}～${map.max}</small>${detail}${recommendation}</div>${action}</article>`;
  }).join('')}</section>`;
  modal.dataset.view = 'maps';
  modal.classList.remove('hidden');
}

function selectAdventureMap(mapId) {
  const progress = getProgress();
  const map = mapProgression.find((item) => item.id === mapId && item.implemented);
  if (!map || progress.level < map.min) return;
  if (map.dungeon) {
    const resources = getAccountResources();
    const keys = resources.dungeonKeys?.blackForestAltar || 0;
    if (keys < 1) { showToast('需要黑森林祭壇鑰匙才能進入。'); return; }
    resources.dungeonKeys.blackForestAltar = keys - 1;
    saveAccountResources(resources);
    progress.dungeonAdmission = true;
  }
  progress.selectedMapId = map.id;
  saveProgress(progress);
  document.querySelector('#inventory-modal').classList.add('hidden');
  showToast(map.dungeon ? `已消耗 1 把鑰匙，進入：${map.name}` : `已前往：${map.name}`);
  openBattle();
}

function equipItem(itemId) {
  const progress = getProgress();
  const itemIndex = progress.inventory.findIndex((item) => item.id === itemId && item.kind === 'equipment');
  if (itemIndex < 0) return;
  const item = progress.inventory[itemIndex];
  const character = JSON.parse(localStorage.getItem('stardust-character') || 'null');
  if (item.allowedJobs?.length && (!character || !item.allowedJobs.includes(character.job))) {
    showToast('這件裝備不適合目前職業。');
    return;
  }
  progress.inventory.splice(itemIndex, 1);
  if (!equipmentSlots[item.slot]) {
    progress.inventory.unshift(item);
    return;
  }
  Object.entries(progress.equipment).forEach(([slot, equipped]) => {
    if (slot !== item.slot && equipped?.id === item.id) progress.equipment[slot] = null;
  });
  const previous = progress.equipment[item.slot];
  if (previous) progress.inventory.unshift(previous);
  progress.equipment[item.slot] = item;
  scrapSelection.delete(item.id);
  saveProgress(progress);
  showToast(`已穿戴：${item.name}`);
  logBattle(`⚙ 已穿戴【${item.name}】。`);
  renderInventory(document.querySelector('#inventory-modal').dataset.view || 'inventory');
  if (fighting) updateBattleUI();
}

function discardSelectedEquipment() {
  const progress = getProgress();
  const selectedIds = new Set([...scrapSelection].filter((id) => progress.inventory.some((item) => item.id === id && item.kind === 'equipment')));
  if (!selectedIds.size) return;
  progress.inventory = progress.inventory.filter((item) => !(item.kind === 'equipment' && selectedIds.has(item.id)));
  scrapSelection.clear();
  saveProgress(progress);
  showToast(`已刪除 ${selectedIds.size} 件廢品裝備。`);
  logBattle(`🗑 已刪除 ${selectedIds.size} 件多餘裝備。`);
  renderInventory('inventory');
}

function renderEnemySquad() {
  const squad = document.querySelector('#enemy-squad');
  squad.innerHTML = battle.enemyHps.map((hp, index) => {
    const enemy = getEnemyDefinition(index);
    const damageEvents = (battle.enemyDamages[index] || []).map((event, eventIndex) => `<b class="enemy-damage ${event.type || 'normal'}" style="--damage-offset:${eventIndex * 18}px">-${event.damage}</b>`).join('');
    const rankClass = enemy.isBoss ? 'boss' : enemy.isElite ? 'elite' : '';
    const rankName = enemy.isBoss ? `♛ BOSS・${enemy.name}` : enemy.isElite ? `◆ 菁英・${enemy.name}` : enemy.name;
    return `<div id="enemy-${index}" class="enemy-unit ${rankClass} ${hp <= 0 ? 'defeated' : ''} ${battle.targetIndexes.includes(index) ? 'targeted hit' : ''}"><span class="enemy-art ${enemy.artClass}"></span>${damageEvents}<small>${rankName}</small><div class="hp-track enemy-track"><i style="width:${Math.max(0, hp / enemy.maxHp * 100)}%"></i></div></div>`;
  }).join('');
}

function playMonsterAttackAnimation(enemyIndex, playerWasHit) {
  const enemy = document.querySelector(`#enemy-${enemyIndex}`);
  if (enemy) {
    enemy.classList.remove('attacking');
    requestAnimationFrame(() => enemy.classList.add('attacking'));
  }
  if (!playerWasHit) return;
  const player = document.querySelector('#player-fighter');
  const field = document.querySelector('.battle-field');
  player?.classList.remove('hit');
  field?.classList.remove('impact');
  requestAnimationFrame(() => {
    player?.classList.add('hit');
    field?.classList.add('impact');
  });
}

function playPlayerProjectile(targetIndex) {
  const field = document.querySelector('.battle-field');
  const target = document.querySelector(`#enemy-${targetIndex}`);
  if (!field || !target) return;
  const fieldRect = field.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const projectile = document.createElement('i');
  projectile.className = 'player-projectile';
  projectile.style.setProperty('--shot-x', `${targetRect.left + targetRect.width * .5 - fieldRect.left - 82}px`);
  projectile.style.setProperty('--shot-y', `${targetRect.top + targetRect.height * .45 - fieldRect.top - (fieldRect.height - 72)}px`);
  field.appendChild(projectile);
  setTimeout(() => projectile.remove(), 520);
}

function playPlayerAttackAnimation() {
  const fighter = document.querySelector('#player-fighter');
  const art = document.querySelector('#battle-player-art');
  fighter?.classList.remove('attack');
  art?.classList.remove('attack');
  requestAnimationFrame(() => {
    fighter?.classList.add('attack');
    art?.classList.add('attack');
  });
  setTimeout(() => art?.classList.remove('attack'), 520);
}

function playCompanionAttackAnimation(targetIndexes = []) {
  const companion = document.querySelector('#hunter-companion');
  const field = document.querySelector('.battle-field');
  const target = document.querySelector(`#enemy-${targetIndexes[0]}`);
  if (!companion || companion.classList.contains('hidden')) return;
  let strikeX = Math.min(240, Math.max(82, (field?.clientWidth || 420) * .24));
  let strikeY = -28;
  if (field && target) {
    const companionRect = companion.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    strikeX = Math.min(260, Math.max(76, targetRect.left - companionRect.right + targetRect.width * .32));
    strikeY = Math.min(34, Math.max(-105, targetRect.top + targetRect.height * .55 - (companionRect.top + companionRect.height * .5)));
  }
  companion.style.setProperty('--pet-strike-x', `${strikeX}px`);
  companion.style.setProperty('--pet-strike-y', `${strikeY}px`);
  companion.classList.remove('attacking');
  void companion.offsetWidth;
  companion.classList.add('attacking');
  setTimeout(() => companion.classList.remove('attacking'), 720);
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

function applyDot(index, type, damage, duration) {
  if (battle.enemyHps[index] <= 0) return;
  const dots = battle.enemyDots[index] || [];
  const existing = dots.find((dot) => dot.type === type);
  if (existing) {
    existing.damage = Math.max(existing.damage, damage);
    existing.remaining = Math.max(existing.remaining, duration);
    return;
  }
  dots.push({ type, damage, remaining: duration });
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
    battle.enemyHps[index] -= damage;
    showEnemyDamage([index], damage, 'dot');
  });
}

function getKnownSkills(job, level) { return skillProgression[job] || []; }

function getMaxMana(job, level) {
  return getCharacterStats(level, getProgress(), { ...(JSON.parse(localStorage.getItem('stardust-character') || '{}')), job }).mana;
}

function getSkillManaCost(skill) {
  if (skill.id === 'heal') return 28;
  if (skill.targets && skill.targets > 1) return 26;
  if (skill.id === 'companion') return 24;
  return 18;
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
  const maxMana = getMaxMana(character.job, level);
  const raceInfo = Object.values(factions).flat().find((race) => race.id === character.race);
  const raceTalent = raceTalents[character.race] || raceTalents.human;
  const renderSkill = (skill, activeIndex = -1) => {
    const unlocked = level >= skill.level;
    const upgradeLevel = getSkillUpgradeLevel(progress, character.job, skill);
    const nextCost = skillUpgradeCosts[upgradeLevel + 1] || 0;
    const nextBookCost = skillBookCosts[upgradeLevel + 1] || 0;
    const nextGoldCost = skillUpgradeGoldCosts[upgradeLevel + 1] || 0;
    const ownedBooks = Number(progress.skillBooks?.[upgradeLevel + 1]) || 0;
    const cooldown = skill.type === 'active' && unlocked ? Math.max(0, Math.ceil(((battle.skillCooldowns[skill.id] || 0) - Date.now()) / 1000)) : 0;
    const manaCost = skill.type === 'active' ? getSkillManaCost(skill) : 0;
    const stateClass = !unlocked ? 'locked' : skill.type === 'passive' ? 'enabled' : battle.manaExhausted ? 'exhausted' : battle.playerMana < manaCost ? 'no-mana' : cooldown > 0 ? 'cooling' : 'ready';
    const statusText = !unlocked ? `Lv.${skill.level} 解鎖` : skill.type === 'passive' ? '已生效' : battle.manaExhausted ? '魔力枯竭' : battle.playerMana < manaCost ? '魔力不足' : cooldown > 0 ? `${cooldown} 秒` : '可施放';
    const metaText = skill.type === 'active' ? `技能 ${upgradeLevel}/${maxSkillUpgradeLevel}・${manaCost} MP` : `技能 ${upgradeLevel}/${maxSkillUpgradeLevel}・被動`;
    const icon = skill.type === 'active' ? (skillIcons[skill.id] || '✦') : '◆';
    const priority = activeIndex >= 0 ? `<i class="skill-priority">${activeIndex + 1}</i>` : '';
    const detail = unlocked ? `${skill.detail}｜${skill.type === 'active' ? `消耗 ${manaCost} MP｜冷卻 ${Math.round(skill.cooldown * skillCooldownMultiplier)} 秒` : '被動技能'}` : `Lv.${skill.level} 解鎖`;
    const upgradeButton = unlocked ? `<button class="skill-upgrade-button" type="button" data-upgrade-skill="${getSkillUpgradeKey(character.job, skill)}" ${upgradeLevel >= maxSkillUpgradeLevel || progress.magicCrystals < nextCost || ownedBooks < nextBookCost || progress.gold < nextGoldCost ? 'disabled' : ''}>${upgradeLevel >= maxSkillUpgradeLevel ? '已滿級' : `升階・💎${nextCost}＋${upgradeLevel + 1}階書×${nextBookCost}＋${nextGoldCost}金・${Math.round(skillUpgradeSuccessRates[upgradeLevel + 1] * 100)}%`}</button>` : '';
    return `<div class="skill-chip ${skill.type} ${stateClass}" data-skill-detail="${detail}">${priority}<span class="skill-icon">${icon}</span><b>${unlocked ? skill.name : '未解鎖'}</b><small>${metaText}</small><em class="skill-cooldown ${stateClass}">${statusText}</em>${upgradeButton}</div>`;
  };
  skillList.innerHTML = `<section class="skill-group active-group"><h3>主動技能</h3><div class="skill-row">${activeSkills.map((skill, index) => renderSkill(skill, index)).join('')}</div></section><section class="skill-group passive-group"><h3>被動技能</h3><div class="skill-row">${passiveSkills.map((skill) => renderSkill(skill)).join('')}</div></section><section class="race-talent-group"><h3>種族天賦</h3><article class="race-talent-card race-talent-${character.race}"><span>${raceTalent.icon}</span><div><b>${raceInfo?.name || character.race}・${raceTalent.name}</b><small>${raceTalent.detail}</small></div><em>永久生效</em></article></section>`;
  skillList.dataset.level = String(level);
  skillList.dataset.job = character.job;
  skillList.dataset.race = character.race;
  document.querySelectorAll('#skill-list .skill-chip').forEach((chip, index) => { chip.id = `skill-${index}`; });
  document.querySelectorAll('#layout-skill-select option').forEach((option, index) => {
    option.textContent = orderedSkills[index] ? `單一技能：${orderedSkills[index].name}` : `單一技能：技能 ${index + 1}`;
  });
  setupLayoutDrag();
  applySavedLayout();
  setupSkillTooltips();
  const resourceStatus = document.querySelector('#skill-resource-status');
  if (resourceStatus) resourceStatus.textContent = `魔法結晶 ${progress.magicCrystals}・${battle.manaExhausted ? `枯竭中・${Math.ceil(maxMana * .45)} MP 恢復` : `${Math.ceil(battle.playerMana)} / ${maxMana} MP`}`;
}

function refreshSkills(character, level) {
  const skillList = document.querySelector('#skill-list');
  const progress = getProgress();
  if (skillList.dataset.level !== String(level) || skillList.dataset.job !== character.job || skillList.dataset.race !== character.race || !skillList.querySelector('.skill-chip')) {
    renderSkills(character, level);
    return;
  }

  const skills = skillProgression[character.job] || [];
  const orderedSkills = [...skills.filter((skill) => skill.type === 'active'), ...skills.filter((skill) => skill.type === 'passive')];
  const maxMana = getMaxMana(character.job, level);
  const resourceStatus = document.querySelector('#skill-resource-status');
  if (resourceStatus) resourceStatus.textContent = `魔法結晶 ${progress.magicCrystals}・${battle.manaExhausted ? `枯竭中・${Math.ceil(maxMana * .45)} MP 恢復` : `${Math.ceil(battle.playerMana)} / ${maxMana} MP`}`;
  orderedSkills.forEach((skill, index) => {
    const chip = document.querySelector(`#skill-${index}`);
    if (!chip) return;
    const upgradeLevel = getSkillUpgradeLevel(progress, character.job, skill);
    const upgradeButton = chip.querySelector('.skill-upgrade-button');
    if (upgradeButton) {
      const nextCost = skillUpgradeCosts[upgradeLevel + 1] || 0;
      const nextBookCost = skillBookCosts[upgradeLevel + 1] || 0;
      const nextGoldCost = skillUpgradeGoldCosts[upgradeLevel + 1] || 0;
      const ownedBooks = Number(progress.skillBooks?.[upgradeLevel + 1]) || 0;
      upgradeButton.disabled = upgradeLevel >= maxSkillUpgradeLevel || progress.magicCrystals < nextCost || ownedBooks < nextBookCost || progress.gold < nextGoldCost;
      upgradeButton.textContent = upgradeLevel >= maxSkillUpgradeLevel ? '已滿級' : `升階・💎${nextCost}＋${upgradeLevel + 1}階書×${nextBookCost}＋${nextGoldCost}金・${Math.round(skillUpgradeSuccessRates[upgradeLevel + 1] * 100)}%`;
    }
    if (skill.type !== 'active' || level < skill.level) return;
    const cooldown = Math.max(0, Math.ceil(((battle.skillCooldowns[skill.id] || 0) - Date.now()) / 1000));
    const manaCost = getSkillManaCost(skill);
    const stateClass = battle.manaExhausted ? 'exhausted' : battle.playerMana < manaCost ? 'no-mana' : cooldown > 0 ? 'cooling' : 'ready';
    chip.classList.remove('ready', 'cooling', 'no-mana', 'exhausted');
    chip.classList.add(stateClass);
    const cooldownText = chip.querySelector('.skill-cooldown');
    if (cooldownText) {
      cooldownText.textContent = battle.manaExhausted ? '魔力枯竭' : battle.playerMana < manaCost ? '魔力不足' : cooldown > 0 ? `${cooldown} 秒` : '可施放';
      cooldownText.className = `skill-cooldown ${stateClass}`;
    }
  });
}

function setupSkillTooltips() {
  document.querySelectorAll('#skill-list .skill-chip').forEach((chip) => {
    if (chip.dataset.tooltipReady) return;
    chip.dataset.tooltipReady = 'true';

    chip.addEventListener('mouseenter', () => {
      clearTimeout(skillTooltipTimer);
      skillTooltipTimer = setTimeout(() => {
        const rect = chip.getBoundingClientRect();
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - 320));
        const top = Math.max(8, Math.min(rect.top - 100, window.innerHeight - 130));
        skillTooltip.textContent = `技能說明：${chip.dataset.skillDetail}`;
        skillTooltip.style.left = `${left}px`;
        skillTooltip.style.top = `${top}px`;
        skillTooltip.classList.add('show');
      }, 2000);
    });

    chip.addEventListener('mouseleave', () => {
      clearTimeout(skillTooltipTimer);
      skillTooltip.classList.remove('show');
    });
  });
}

function updateBattleUI() {
  const character = JSON.parse(localStorage.getItem('stardust-character'));
  const progress = getProgress();
  const maxHp = getMaxHp(progress.level, progress);
  const maxMana = getMaxMana(character.job, progress.level);
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
  const currentMap = getActiveMap(progress);
  const mapName = document.querySelector('#battle-title');
  if (mapName) mapName.textContent = currentMap.dungeon ? `${currentMap.name}・第 ${battle.dungeonWave || 1} 波` : currentMap.name;
  const battleField = document.querySelector('.battle-field');
  if (battleField) {
    battleField.dataset.mapId = currentMap.id;
    battleField.style.backgroundImage = `linear-gradient(rgba(13,29,36,.12),rgba(11,35,29,.22)), url('${currentMap.background || 'assets/beginner-plains-background.png'}')`;
  }
  const companion = document.querySelector('#hunter-companion');
  companion?.classList.toggle('hidden', character.job !== 'hunter' || progress.level < 5);
  const racialCompanion = racialCompanions[character.race] || racialCompanions.human;
  const companionArt = companion?.querySelector('span');
  const companionName = companion?.querySelector('small');
  if (companionArt) {
    const companionImage = `url("${racialCompanion.image}")`;
    companionArt.style.setProperty('--companion-art', companionImage);
    companionArt.style.backgroundImage = companionImage;
  }
  if (companionName) companionName.textContent = racialCompanion.name;
  document.querySelector('#map-level-text').textContent = currentMap.dungeon ? `特殊副本・第 ${battle.dungeonWave || 1}／10 波・全員精英 Lv. ${currentMap.min}–${currentMap.max}` : `怪物等級：Lv. ${currentMap.min}–${currentMap.max}`;
  document.querySelector('#player-hp-text').textContent = `${Math.max(0, battle.playerHp)} / ${maxHp}${battle.playerShield > 0 ? `　護盾 ${battle.playerShield}` : ''}`;
  document.querySelector('#player-hp-bar').style.width = `${Math.max(0, battle.playerHp / maxHp * 100)}%`;
  document.querySelector('#player-mp-text').textContent = `${Math.ceil(battle.playerMana)} / ${maxMana} MP`;
  document.querySelector('#player-mp-bar').style.width = `${Math.max(0, battle.playerMana / maxMana * 100)}%`;
  document.querySelector('#player-mp-text').textContent += battle.manaExhausted ? '　魔力枯竭' : '';
  document.querySelector('.mana-track')?.classList.toggle('exhausted', battle.manaExhausted);
  document.querySelector('#enemy-count').textContent = battle.enemyHps.filter((hp) => hp > 0).length;
  renderEnemySquad();
  document.querySelector('#gold-count').textContent = progress.gold;
  document.querySelector('#potion-count').textContent = progress.potions;
  document.querySelector('#mana-potion-count').textContent = progress.manaPotions || 0;
  document.querySelector('#exp-text').textContent = `${progress.xp} / ${requiredXp(progress.level)}`;
  document.querySelector('#xp-bar').style.width = `${progress.xp / requiredXp(progress.level) * 100}%`;
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
  saveProgress(progress);
  logBattle(`🧪 ${manual ? '手動' : '自動'}使用治癒藥水，恢復 30% 生命。`);
  updateBattleUI();
  return true;
}

function useManaPotion(manual = false) {
  const progress = getProgress();
  const character = JSON.parse(localStorage.getItem('stardust-character'));
  if (!character) return false;
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
  const progress = getProgress();
  const enemy = getEnemyDefinition(index);
  const currentMap = getActiveMap(progress);
  const earnedXp = enemy.isBoss ? currentMap.bossXp : enemy.isElite ? currentMap.eliteXp : currentMap.normalXp;
  progress.xp += earnedXp;
  const earnedGold = Math.max(1, Math.floor(enemy.gold * .55));
  progress.gold += earnedGold;
  const loot = addLoot(progress, enemy);
  const collectible = addCollectibleLoot(progress, enemy);
  const accountDrops = [];
  const skillMaterialChance = currentMap.dungeon ? (enemy.isBoss ? 1 : .24) : currentMap.min >= 5 ? (enemy.isBoss ? .18 : enemy.isElite ? .08 : .03) : 0;
  if (skillMaterialChance > 0 && Math.random() < skillMaterialChance) {
    const amount = currentMap.dungeon && enemy.isBoss ? 2 : 1;
    progress.magicCrystals = (progress.magicCrystals || 0) + amount;
    accountDrops.push(`魔法結晶 ×${amount}`);
  }
  const bookTier = Math.min(6, Math.max(2, Math.floor(currentMap.min / 5) + 1));
  const bookDropChance = currentMap.dungeon ? (enemy.isBoss ? .60 : .15) : currentMap.min >= 5 ? (enemy.isBoss ? .12 : enemy.isElite ? .04 : .01) : 0;
  if (bookDropChance > 0 && Math.random() < bookDropChance) {
    progress.skillBooks = { ...(progress.skillBooks || {}), [bookTier]: (Number(progress.skillBooks?.[bookTier]) || 0) + 1 };
    accountDrops.push(`${bookTier}階魔法書 ×1`);
  }
  if (currentMap.dungeon) {
    const resources = getAccountResources();
    const ironChance = enemy.isBoss ? 1 : .22;
    if (Math.random() < ironChance) {
      const amount = enemy.isBoss ? 2 : 1;
      resources.starIron += amount;
      accountDrops.push(`星鐵碎片 ×${amount}`);
    }
    saveAccountResources(resources);
  } else if (enemy.isBoss) {
    const resources = getAccountResources();
    if (Math.random() < .12) { resources.starIron += 1; accountDrops.push('星鐵碎片 ×1'); }
    if (currentMap.id === 'black-forest' && Math.random() < .15) { resources.dungeonKeys.blackForestAltar = (resources.dungeonKeys.blackForestAltar || 0) + 1; accountDrops.push('黑森林祭壇鑰匙 ×1'); }
    saveAccountResources(resources);
  }
  while (progress.xp >= requiredXp(progress.level)) {
    progress.xp -= requiredXp(progress.level);
    progress.level += 1;
    showToast(`升級！已到達 Lv. ${progress.level}`);
    logBattle(`✦ 冒險者升至 Lv. ${progress.level}`, 'progress');
    const character = JSON.parse(localStorage.getItem('stardust-character'));
    const learned = (skillProgression[character.job] || []).find((skill) => skill.level === progress.level);
    if (learned) {
      showToast(`學會${learned.type === 'active' ? '主動' : '被動'}技能：${learned.name}`);
      logBattle(`★ 自動學會${learned.type === 'active' ? '主動' : '被動'}技能【${learned.name}】`, 'progress');
    }
  }
  saveProgress(progress);
  logBattle(`✦ 擊敗${enemy.name}！獲得 ${earnedXp} EXP、${earnedGold} 金幣`, 'reward');
  if (loot) logBattle(`🎁 掉落【${loot.name}】${loot.quantity ? ` ×${loot.quantity}` : ''}`);
  accountDrops.forEach((drop) => logBattle(`◆ BOSS掉落【${drop}】`, 'loot'));
  if (collectible) {
    showToast(`獲得收藏品：${collectible.name}`);
    logBattle(`♛ 收藏品掉落【${collectible.name}】－${collectible.description}`, 'loot');
  }
}

function getMonsterRespawnTicks() {
  // 移動速度越高，怪物越快回到戰場；100% 時為 6 秒。
  return Math.max(2, Math.round(6 * (100 / battle.monsterMoveSpeed)));
}

function processEnemyRespawns() {
  if (battle.isDungeon) return;
  const playerLevel = getProgress().level;
  battle.enemyRespawns.forEach((timer, index) => {
    if (timer === null) return;
    const nextTimer = timer - 1;
    if (nextTimer <= 0) {
    const specialRoll = Math.random();
    const bossAllowed = playerLevel >= 4 && !hasAliveBoss(index);
    battle.enemyTypes[index] = bossAllowed && specialRoll < bossSpawnChance ? randomBossId(playerLevel) : specialRoll < bossSpawnChance + eliteSpawnChance ? randomEliteId(playerLevel) : randomEnemyId(playerLevel);
      battle.enemyRespawns[index] = null;
      battle.enemyHps[index] = getEnemyDefinition(index).maxHp;
    battle.enemySpawnedAt[index] = Date.now();
    battle.enemyDots[index] = [];
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
      rewardVictory(index);
    });
    const waveCleared = battle.enemyHps.every((hp) => hp <= 0) && battle.enemyRespawns.every((timer) => timer === -1);
    if (waveCleared && !battle.waveTransitioning && !battle.dungeonComplete) {
      battle.waveTransitioning = true;
      const clearedWave = battle.dungeonWave;
      logBattle(`✓ 第 ${clearedWave} 波全滅。`, 'progress');
      setTimeout(() => {
        if (!battle.isDungeon || battle.dungeonWave !== clearedWave) return;
        if (clearedWave >= 10) completeDungeon();
        else loadDungeonWave(clearedWave + 1);
      }, 650);
    }
    return;
  }
  battle.enemyHps.forEach((hp, index) => {
    if (hp > 0 || battle.enemyRespawns[index] !== null) return;
    battle.enemyHps[index] = 0;
    const respawnTicks = getMonsterRespawnTicks() + battle.enemyRespawns.filter((timer) => timer !== null).length;
    battle.enemyRespawns[index] = respawnTicks;
    rewardVictory(index);
  });
}

function useAutoSkill(character, progress) {
  if (battle.manaExhausted) return false;
  const unlocked = getKnownSkills(character.job, progress.level).filter((skill) => skill.type === 'active' && skill.level <= progress.level);
  const now = Date.now();
  if (now < (battle.globalSkillReadyAt || 0)) return false;
  const attackSkills = unlocked.filter((skill) => skill.id !== 'heal' && (battle.skillCooldowns[skill.id] || 0) <= now);
  let casted = false;

  for (const skill of attackSkills) {
    const manaCost = getSkillManaCost(skill);
    if (battle.playerMana < manaCost) continue;
    const targets = aliveEnemyIndexesByAge().slice(0, skill.targets || 1).map((index) => ({ hp: battle.enemyHps[index], index }));
    if (!targets.length) continue;
    const stats = getCharacterStats(progress.level, progress, character);
    const critical = Math.random() < stats.crit;
    const damage = Math.max(1, Math.ceil(stats.attack * skill.power * getSkillPowerMultiplier(progress, character.job, skill) * (critical ? 1.5 : 1)));
    targets.forEach((enemy) => { battle.enemyHps[enemy.index] -= damage; });
    showEnemyDamage(targets.map((enemy) => enemy.index), damage);
    if (skill.id !== 'companion') playPlayerAttackAnimation();
    if (skill.id === 'fireball') targets.forEach((enemy) => applyDot(enemy.index, 'burn', Math.max(1, Math.ceil(damage * .18 * stats.dotMultiplier)), 4));
    if (skill.id === 'poison-blade') targets.forEach((enemy) => applyDot(enemy.index, 'poison', Math.max(1, Math.ceil(damage * .15 * stats.dotMultiplier)), 5));
    battle.playerMana -= manaCost;
    battle.skillCooldowns[skill.id] = now + skill.cooldown * skillCooldownMultiplier * 1000 / stats.cooldownSpeed;
    battle.globalSkillReadyAt = now + 1000;
    if (skill.id === 'companion') {
      playCompanionAttackAnimation(targets.map((enemy) => enemy.index));
      const targetNames = targets.map((enemy) => getEnemyDefinition(enemy.index).name).join('、');
      logBattle(`🐺 戰寵攻擊【${targetNames}】，造成 ${damage} 傷害${critical ? '（暴擊）' : ''}。`, 'pet-damage', { aggregateKey: `pet-${targets.map((enemy) => enemy.index).join('-')}`, damage, summary: `🐺 戰寵攻擊【${targetNames}】` });
    } else {
      logBattle(`✦ 立即施放【${skill.name}】（-${manaCost} MP），造成 ${damage}${critical ? ' 暴擊' : ''}${targets.length > 1 ? ` × ${targets.length}` : ''} 傷害。`);
    }
    casted = true;
    updateManaExhaustion(getMaxMana(character.job, progress.level));
    break;
  }

  if (casted) return true;

  const healSkill = unlocked.find((skill) => skill.id === 'heal' && (battle.skillCooldowns[skill.id] || 0) <= now);
  if (!healSkill) return casted;
  const manaCost = getSkillManaCost(healSkill);
  if (battle.playerMana < manaCost) return casted;
  const maxHp = getMaxHp(progress.level, progress);
  if (battle.playerHp / maxHp > .7) return casted;
  const heal = Math.ceil(maxHp * .4 * getSkillPowerMultiplier(progress, character.job, healSkill));
  const missingHp = maxHp - battle.playerHp;
  battle.playerHp = Math.min(maxHp, battle.playerHp + heal);
  battle.playerShield += Math.max(0, heal - missingHp);
  battle.playerMana -= manaCost;
  battle.globalSkillReadyAt = now + 1000;
  updateManaExhaustion(getMaxMana(character.job, progress.level));
  battle.skillCooldowns[healSkill.id] = now + healSkill.cooldown * skillCooldownMultiplier * 1000 / getCharacterStats(progress.level, progress, character).cooldownSpeed;
  logBattle(`✦ 立即施放【${healSkill.name}】（-${manaCost} MP），恢復 ${heal} 生命。`);
  return true;
}

function autoSkillTick() {
  if (!fighting) return;
  const character = JSON.parse(localStorage.getItem('stardust-character'));
  if (!character) return;
  if (useAutoSkill(character, getProgress())) updateBattleUI();
}

function battleTick() {
  if (!fighting) return;
  const progress = getProgress();
  const character = JSON.parse(localStorage.getItem('stardust-character'));
  processEnemyRespawns();
  processEnemyDots();
  const maxMana = getMaxMana(character.job, progress.level);
  battle.playerMana = Math.min(maxMana, battle.playerMana + Math.max(.5, maxMana * .008));
  if (battle.playerMana / maxMana <= .20) useManaPotion();
  updateManaExhaustion(maxMana);
  autoSkillTick();
  queueDefeatedEnemies();
  const stats = getCharacterStats(progress.level, progress, character);
  const orcRage = character.race === 'orc' && Math.random() < .10;
  const critical = Math.random() < stats.crit;
  const playerHit = Math.max(1, Math.ceil(stats.attack * (orcRage ? 1.10 : 1) * (critical ? 1.5 : 1)));
  let targetIndex = oldestAliveEnemyIndex();
  if (targetIndex === -1) {
    updateBattleUI();
    return;
  }
  battle.playerAttackCharge = (battle.playerAttackCharge || 0) + (battle.manaExhausted ? .8 : 1);
  if (battle.playerAttackCharge >= 1) {
    battle.playerAttackCharge -= 1;
    battle.enemyHps[targetIndex] -= playerHit;
    playPlayerAttackAnimation();
    playPlayerProjectile(targetIndex);
    showEnemyDamage([targetIndex], playerHit);
    logBattle(`⚔ 你對【${getEnemyDefinition(targetIndex).name}】造成 ${playerHit} 傷害${critical ? '（暴擊）' : ''}${orcRage ? '（狂怒）' : ''}`, 'damage-dealt', { aggregateKey: `player-${battle.enemyTypes[targetIndex]}`, damage: playerHit, summary: `⚔ 你攻擊【${getEnemyDefinition(targetIndex).name}】` });
    queueDefeatedEnemies();
  }
  updateBattleUI();
}

function enemyAttackTick() {
  if (!fighting) return;
  const progress = getProgress();
  const character = JSON.parse(localStorage.getItem('stardust-character'));
  if (!character) return;
  const attackingEnemyIndex = oldestAliveEnemyIndex();
  if (attackingEnemyIndex === -1) return;
  const attackingEnemyName = getEnemyDefinition(attackingEnemyIndex).name;
  const attackingEnemy = getEnemyDefinition(attackingEnemyIndex);
  const now = Date.now();
  if ((battle.nextEnemyAttackAt || 0) > now) return;
  const attackInterval = Math.max(250, attackingEnemy.attackInterval || (1000 / (attackingEnemy.attackSpeed || 1)));
  battle.nextEnemyAttackAt = now + attackInterval;
  const stats = getCharacterStats(progress.level, progress, character);
  const dodged = Math.random() < stats.dodge;
  const rawEnemyHit = getMonsterAttackPower(attackingEnemy, progress);
  let enemyHit = dodged ? 0 : Math.max(1, Math.ceil(rawEnemyHit * (100 / (100 + stats.defense * 8))));
  const absorbed = Math.min(battle.playerShield, enemyHit);
  battle.playerShield -= absorbed;
  enemyHit -= absorbed;
  battle.playerHp -= enemyHit;
  if (dodged) logBattle(`【${attackingEnemyName}】發動攻擊，你成功閃避。`, 'damage-taken');
  else logBattle(`🩸【${attackingEnemyName}】對你造成 ${enemyHit} 傷害${absorbed ? `，護盾吸收 ${absorbed}` : ''}。`, 'damage-taken', { aggregateKey: `enemy-${battle.enemyTypes[attackingEnemyIndex]}`, damage: enemyHit, summary: `🩸【${attackingEnemyName}】攻擊你` });
  const maxHp = getMaxHp(progress.level, progress);
  if (battle.playerHp > 0 && battle.playerHp / maxHp < 0.35) usePotion();
  if (battle.playerHp <= 0) {
    if (character.race === 'undead' && !battle.undeadRevived && Math.random() < .35) {
      battle.undeadRevived = true;
      battle.playerHp = Math.ceil(maxHp * .35);
      logBattle('☾ 不死族天賦觸發：從死亡中復活！');
      updateBattleUI();
      return;
    }
    battle.playerHp = getMaxHp(progress.level, progress);
    battle.playerMana = getMaxMana(character.job, progress.level);
    battle.playerShield = 0;
    battle.undeadRevived = false;
    logBattle('你暫時撤退並恢復了生命。');
  }
  updateBattleUI();
  if (attackingEnemyIndex !== -1) playMonsterAttackAnimation(attackingEnemyIndex, !dodged && enemyHit > 0);
}

function openBattle() {
  const character = JSON.parse(localStorage.getItem('stardust-character'));
  if (!character) { openCreation(); return; }
  const battlePlayerArt = document.querySelector('#battle-player-art');
  const characterArt = battleCharacterArt[`${character.race}:${character.job}`];
  if (battlePlayerArt) {
    battlePlayerArt.classList.toggle('hidden', !characterArt);
    battlePlayerArt.classList.toggle('undead-art', character.race === 'undead' && Boolean(characterArt));
    battlePlayerArt.style.backgroundImage = characterArt ? `url('${characterArt}')` : '';
    const raceName = Object.values(factions).flat().find((race) => race.id === character.race)?.name || character.race;
    battlePlayerArt.setAttribute('aria-label', `${raceName}${classes.find((job) => job.id === character.job)?.name || ''}`);
  }
  menuScreen.classList.add('hidden');
  battleScreen.classList.remove('hidden');
  repairSkillLayoutOnce();
  repairHudLayoutOnce();
  applySavedLayout();
  const progress = getProgress();
  let currentMap = getActiveMap(progress);
  if (currentMap.dungeon && !progress.dungeonAdmission) {
    progress.selectedMapId = 'black-forest';
    saveProgress(progress);
    currentMap = getActiveMap(progress);
  }
  const isDungeon = Boolean(currentMap.dungeon);
  if (isDungeon) {
    progress.dungeonAdmission = false;
    saveProgress(progress);
  }
  const enemyTypes = isDungeon ? createDungeonWaveTypes(1) : createEnemyTypes(progress.level);
  const battleStart = Date.now();
  battle = { enemyTypes, enemyHps: enemyTypes.map((type) => monsterTypes[type].maxHp), playerHp: getMaxHp(progress.level, progress), playerMana: getMaxMana(character.job, progress.level), playerShield: 0, manaExhausted: false, playerAttackCharge: 0, nextEnemyAttackAt: 0, globalSkillReadyAt: 0, undeadRevived: false, skillCooldowns: {}, enemyRespawns: enemyTypes.map(() => null), enemySpawnedAt: enemyTypes.map((_, index) => battleStart + index), enemyDots: enemyTypes.map(() => []), monsterMoveSpeed: 200, targetIndexes: [], enemyDamages: enemyTypes.map(() => []), damageTimers: [], isDungeon, dungeonWave: isDungeon ? 1 : 0, dungeonComplete: false, waveTransitioning: false };
  clearBattleLog();
  if (pendingOfflineReport) {
    logBattle(`☾ 離線掛機 ${pendingOfflineReport.duration}${pendingOfflineReport.capped ? '（已達 12 小時上限）' : ''}，擊敗約 ${pendingOfflineReport.defeated} 隻怪物。`, 'system');
    logBattle(`🎁 離線收益：${pendingOfflineReport.gainedXp} EXP、${pendingOfflineReport.gainedGold} 金幣、${pendingOfflineReport.equipmentFound} 件裝備${pendingOfflineReport.levelsGained ? `，提升 ${pendingOfflineReport.levelsGained} 級` : ''}。`, 'loot');
    pendingOfflineReport = null;
  }
  const openingSpecial = enemyTypes.map((type) => monsterTypes[type]).find((enemy) => enemy.isBoss || enemy.isElite);
  if (openingSpecial) {
    const rank = openingSpecial.isBoss ? 'BOSS' : '菁英怪';
    showToast(`⚠ ${rank} 出現：${openingSpecial.name}`);
    logBattle(`⚠ ${rank}【${openingSpecial.name}】已出現在地圖！`);
  }
  logBattle(isDungeon ? `◆ 進入${currentMap.name}，第 1／10 波：3 名精英來襲。全滅後自動進入下一波。` : `進入${currentMap.name}，${character.name}開始自動戰鬥。怪物移動速度 200%，重生約 3 秒。`);
  fighting = true;
  document.querySelector('#battle-toggle').textContent = 'Ⅱ 暫停';
  updateBattleUI();
  clearInterval(battleTimer);
  clearInterval(skillTimer);
  clearInterval(enemyAttackTimer);
  logBattle('✦ 即時自動施放已啟動。');
  requestAnimationFrame(autoSkillTick);
  skillTimer = setInterval(autoSkillTick, 100);
  battleTimer = setInterval(battleTick, Math.round(1000 / getCharacterStats(progress.level, progress, character).attackSpeed));
  enemyAttackTimer = setInterval(enemyAttackTick, 100);
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
document.querySelector('#reset-button').addEventListener('click', () => { localStorage.removeItem('stardust-player-name'); localStorage.removeItem('stardust-character'); localStorage.removeItem('stardust-progress'); localStorage.removeItem('stardust-character-slots'); localStorage.removeItem('stardust-active-character-slot'); nameInput.value = ''; enterMenu(''); menuScreen.classList.add('hidden'); loginScreen.classList.remove('hidden'); nameInput.focus(); });
document.querySelector('#adventure-button').addEventListener('click', openBattle);
document.querySelectorAll('[data-faction]').forEach((card) => card.addEventListener('click', () => { selection.faction = card.dataset.faction; selection.race = factions[selection.faction][0].id; document.querySelectorAll('[data-faction]').forEach((item) => item.classList.toggle('selected', item === card)); renderCreation(); }));
raceChoices.addEventListener('click', (event) => { const choice = event.target.closest('[data-race]'); if (choice) { selection.race = choice.dataset.race; renderCreation(); } });
classChoices.addEventListener('click', (event) => { const choice = event.target.closest('[data-job]'); if (choice) { selection.job = choice.dataset.job; renderCreation(); } });
document.querySelector('#back-to-menu').addEventListener('click', () => { characterScreen.classList.add('hidden'); menuScreen.classList.remove('hidden'); });
document.querySelector('#create-character').addEventListener('click', () => { const name = characterName.value.trim(); if (!name) { showToast('請先為角色取名。'); characterName.focus(); return; } const lockedFaction = getLockedFactionForCreation(); if (lockedFaction && selection.faction !== lockedFaction) { selection.faction = lockedFaction; selection.race = factions[lockedFaction][0].id; renderCreation(); showToast('兩名角色必須選擇相同陣營。'); return; } const race = factions[selection.faction].find((item) => item.id === selection.race); const job = classes.find((item) => item.id === selection.job); const character = { ...selection, name }; const progress = { level: 1, xp: 0, gold: 0, potions: 5, manaPotions: 0, selectedMapId: 'beginner-plains', inventory: [], equipment: emptyEquipment(), lastActiveAt: Date.now() }; const slots = getCharacterSlots(); slots[creationSlotIndex] = { character, progress }; localStorage.setItem('stardust-character-slots', JSON.stringify(slots)); localStorage.setItem('stardust-active-character-slot', String(creationSlotIndex)); localStorage.setItem('stardust-character', JSON.stringify(character)); localStorage.setItem('stardust-progress', JSON.stringify(progress)); characterScreen.classList.add('hidden'); menuScreen.classList.remove('hidden'); document.querySelector('#character-title').textContent = '建立你的角色'; showToast(`${race.name}${job.name}「${name}」已儲存至角色欄位 ${creationSlotIndex + 1}！`); });
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
  clearInterval(battleTimer);
  clearInterval(skillTimer);
  clearInterval(enemyAttackTimer);
  if (battle.isDungeon) {
    const progress = getProgress();
    progress.selectedMapId = 'black-forest';
    saveProgress(progress);
  }
  fighting = false;
  battleScreen.classList.add('hidden');
  menuScreen.classList.remove('hidden');
});
document.querySelector('#battle-toggle').addEventListener('click', () => { if (battle.dungeonComplete) return; fighting = !fighting; document.querySelector('#battle-toggle').textContent = fighting ? 'Ⅱ 暫停' : '▶ 繼續'; logBattle(fighting ? '自動戰鬥已繼續。' : '自動戰鬥已暫停。'); });
document.querySelector('#potion-button').addEventListener('click', () => usePotion(true));
document.querySelector('#mana-potion-button').addEventListener('click', () => useManaPotion(true));
document.querySelector('#skill-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-upgrade-skill]');
  if (!button) return;
  const character = JSON.parse(localStorage.getItem('stardust-character') || 'null');
  const progress = getProgress();
  const skill = (skillProgression[character?.job] || []).find((entry) => getSkillUpgradeKey(character.job, entry) === button.dataset.upgradeSkill);
  if (!skill || progress.level < skill.level) return;
  const currentLevel = getSkillUpgradeLevel(progress, character.job, skill);
  if (currentLevel >= maxSkillUpgradeLevel) return;
  const cost = skillUpgradeCosts[currentLevel + 1];
  const targetTier = currentLevel + 1;
  const bookCost = skillBookCosts[targetTier];
  const goldCost = skillUpgradeGoldCosts[targetTier];
  const ownedBooks = Number(progress.skillBooks?.[targetTier]) || 0;
  if ((progress.magicCrystals || 0) < cost) { showToast(`魔法結晶不足，需要 ${cost} 個。`); return; }
  if (ownedBooks < bookCost) { showToast(`${targetTier}階魔法書不足，需要 ${bookCost} 本。`); return; }
  if ((progress.gold || 0) < goldCost) { showToast(`金幣不足，需要 ${goldCost} 金幣。`); return; }
  progress.magicCrystals -= cost;
  progress.gold -= goldCost;
  progress.skillBooks = { ...(progress.skillBooks || {}), [targetTier]: ownedBooks - bookCost };
  const succeeded = Math.random() < skillUpgradeSuccessRates[targetTier];
  if (succeeded) progress.skillLevels = { ...(progress.skillLevels || {}), [getSkillUpgradeKey(character.job, skill)]: targetTier };
  saveProgress(progress);
  renderSkills(character, progress.level);
  showToast(succeeded ? `【${skill.name}】成功升至 ${targetTier} 階！` : `【${skill.name}】升階失敗，材料已消耗。`);
  logBattle(succeeded ? `◆ 技能升階成功【${skill.name}】→ ${targetTier} 階` : `◇ 技能升階失敗【${skill.name}】・維持 ${currentLevel} 階`, 'progress');
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
  const character = JSON.parse(localStorage.getItem('stardust-character'));
  if (character) renderSkills(character, getProgress().level);
  showToast('所有技能已統一為由上往下排列。');
});
document.querySelector('#layout-reset').addEventListener('click', () => {
  localStorage.removeItem('stardust-battle-layout');
  window.location.reload();
});
setupLayoutDrag();
document.querySelectorAll('[data-menu-action]').forEach((button) => button.addEventListener('click', () => {
  if (layoutEditMode) return;
  if (button.dataset.menuAction === '能力') { renderCharacterAbilities(); return; }
  if (button.dataset.menuAction === '收藏品') { renderCollection(); return; }
  if (button.dataset.menuAction === '背包') { renderInventory('inventory'); return; }
  if (button.dataset.menuAction === '裝備') { renderInventory('equipment'); return; }
  showToast('隊伍系統將在 Lv10 解鎖第二名角色後開放。');
}));
document.querySelector('#inventory-close').addEventListener('click', () => document.querySelector('#inventory-modal').classList.add('hidden'));
document.querySelector('#inventory-modal').addEventListener('click', (event) => {
  if (event.target === event.currentTarget) event.currentTarget.classList.add('hidden');
  const mapButton = event.target.closest('[data-select-map]');
  if (mapButton) { selectAdventureMap(mapButton.dataset.selectMap); return; }
  const categoryButton = event.target.closest('[data-inventory-category]');
  if (categoryButton) {
    inventoryCategory = categoryButton.dataset.inventoryCategory;
    renderInventory('inventory');
    return;
  }
  if (event.target.closest('[data-delete-scrap]')) { discardSelectedEquipment(); return; }
  const equipButton = event.target.closest('[data-equip-id]');
  if (equipButton) { equipItem(equipButton.dataset.equipId); return; }
  const enhanceButton = event.target.closest('[data-enhance-slot]');
  if (enhanceButton) enhanceEquipment(enhanceButton.dataset.enhanceSlot);
});
document.querySelector('#battle-title').addEventListener('click', () => { if (!layoutEditMode) renderMapSelector(); });
document.querySelector('#battle-title').addEventListener('keydown', (event) => { if (!layoutEditMode && ['Enter', ' '].includes(event.key)) { event.preventDefault(); renderMapSelector(); } });
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
  const checkbox = event.target.closest('[data-scrap-ids]');
  if (!checkbox) return;
  checkbox.dataset.scrapIds.split(',').filter(Boolean).forEach((id) => {
    if (checkbox.checked) scrapSelection.add(id);
    else scrapSelection.delete(id);
  });
  renderInventory('inventory');
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
