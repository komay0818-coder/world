(function attachCollectiblePolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CollectiblePolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCollectiblePolicy() {
  function collectible(id, name, source, icon, bonuses) {
    const labels = {
      attack: '攻擊／法攻',
      defense: '防禦',
      hp: '最大生命',
      mana: '最大魔力',
      crit: '暴擊率',
      dodge: '閃避率'
    };
    const description = Object.entries(bonuses).map(([stat, value]) => {
      const displayedValue = ['crit', 'dodge'].includes(stat) ? `${Math.round(value * 100)}%` : value;
      return `${labels[stat]} +${displayedValue}`;
    }).join('、');
    return Object.freeze({ id, name, source, icon, ...bonuses, description });
  }

  const COLLECTIBLE_CATALOG = Object.freeze({
    plainsRabbit: collectible('rabbit-lucky-foot', '野兔幸運腳', '野兔', '♧', { dodge: .005 }),
    plainsWolfPup: collectible('wolf-pup-milk-tooth', '幼狼乳牙', '幼狼', '◔', { attack: 1 }),
    plainsSlime: collectible('slime-gel-core', '史萊姆凝膠核', '小史萊姆', '●', { hp: 8 }),
    plainsGoblinYoung: collectible('young-goblin-buckle', '幼年哥布林腰扣', '幼年哥布林', '♟', { defense: 1 }),
    lostGoblin: collectible('lost-goblin-compass', '迷途哥布林羅盤', '迷路的哥布林', '✥', { attack: 1, mana: 5 }),
    denForestWolf: collectible('forest-wolf-fang', '森林狼青牙', '森林狼', '☾', { crit: .005 }),
    ragingWolf: collectible('raging-wolf-bloodclaw', '狂暴狼血爪', '狂暴狼', '♨', { attack: 2 }),
    greatfangWolf: collectible('greatfang-wolf-crown', '巨牙狼王冠牙', '巨牙狼', '♛', { attack: 3, crit: .01 }),
    boarPiglet: collectible('piglet-round-tusk', '小野豬圓牙', '小野豬', '◡', { hp: 10 }),
    forestBoar: collectible('forest-boar-bristle', '森林野豬硬鬃', '森林野豬', '≋', { defense: 1, hp: 6 }),
    irritableBoar: collectible('irritable-boar-scar', '暴躁野豬戰痕', '暴躁野豬', '〽', { attack: 1, defense: 1 }),
    boarKing: collectible('giant-tusk-boar-heart', '巨牙野豬王心', '巨牙野豬', '◆', { defense: 3, hp: 25 }),
    goblin: collectible('goblin-copper-earring', '哥布林銅耳環', '哥布林', '◈', { attack: 1 }),
    goblinScout: collectible('goblin-scout-whistle', '斥候短哨', '哥布林斥候', '♪', { dodge: .005 }),
    goblinWarrior: collectible('goblin-warrior-badge', '戰士裂盾徽', '哥布林戰士', '⛨', { defense: 1 }),
    goblinSlinger: collectible('goblin-slinger-stone', '投石者百發石', '哥布林投石者', '◉', { crit: .005 }),
    goblinShaman: collectible('goblin-shaman-totem', '薩滿灰燼圖騰', '哥布林薩滿', '☽', { mana: 12 }),
    goblinGuard: collectible('goblin-guard-shield-nail', '護衛盾心釘', '哥布林護衛', '⬟', { defense: 2 }),
    goblinCaptain: collectible('goblin-captain-command-flag', '隊長號令旗', '哥布林隊長', '⚑', { attack: 2, defense: 2 }),
    goblinTreasureChest: collectible('goblin-chest-gold-lock', '寶箱黃金鎖', '哥布林寶箱', '▣', { hp: 18, mana: 12 }),
    goblinHighChief: collectible('goblin-high-chief-crown', '大酋長獠骨冠', '哥布林大酋長', '♚', { attack: 3, defense: 3, hp: 30 }),
    wolf: collectible('old-forest-wolf-talon', '老森林狼銳爪', '森林狼', '◑', { crit: .005 }),
    boar: collectible('wild-boar-heartstone', '野豬血心石', '野豬', '◇', { hp: 12 }),
    goblinOverlord: collectible('goblin-overlord-seal', '督軍鐵令印', '哥布林督軍', '⚔', { defense: 2, attack: 1 }),
    wolfAlpha: collectible('frostfang-alpha-mark', '霜牙狼王印', '霜牙狼王', '❄', { dodge: .01, crit: .005 }),
    boarTyrant: collectible('tusk-beast-core', '獠牙巨獸核心', '獠牙巨獸', '⬢', { attack: 2, hp: 20 }),
    goblinKing: collectible('red-crown-king-gem', '赤冠王權寶石', '赤冠哥布林王', '♜', { attack: 3, defense: 3, hp: 30 }),
    nightGoblin: collectible('night-goblin-shadow-lamp', '夜行者影燈', '夜行哥布林', '✦', { attack: 1, dodge: .005 }),
    shadowWolf: collectible('shadow-wolf-moon-pelt', '幽影月紋狼皮', '幽影森林狼', '◐', { crit: .01 }),
    thornBoar: collectible('thorn-boar-life-seed-v2', '荊棘野豬生命種', '荊棘野豬', '❈', { hp: 15 }),
    forestShaman: collectible('black-forest-shaman-charm', '黑林薩滿咒符', '黑林薩滿', '☿', { mana: 15, attack: 1 }),
    moonfangAlpha: collectible('moonfang-alpha-emblem', '月牙狼王銀徽', '月牙狼王', '☾', { dodge: .01, attack: 1 }),
    thornbackTyrant: collectible('thornback-tyrant-shell', '棘背暴君硬殼', '棘背暴君', '⬣', { defense: 3 }),
    forestGuardian: collectible('forest-guardian-moon-heart', '腐月森林守衛之心', '腐月森林守衛', '◉', { attack: 2, defense: 2, hp: 25 }),
    rootExecutioner: collectible('root-executioner-shackle', '根縛行刑者枷鎖', '根縛行刑者', '⌁', { defense: 2, hp: 12 }),
    altarNightblade: collectible('altar-nightblade-shard', '祭壇夜刃碎片', '祭壇夜刃', '◢', { attack: 2, crit: .01 }),
    moonboneSentinel: collectible('moonbone-sentinel-rune', '月骨守衛符骨', '月骨守衛', '✧', { defense: 3, mana: 10 }),
    blightOracle: collectible('blight-oracle-eye', '疫木神諭之眼', '疫木神諭', '◌', { attack: 2, mana: 15 }),
    eclipseSovereign: collectible('eclipse-sovereign-antler', '蝕月鹿王聖角', '蝕月鹿王', '♕', { attack: 4, defense: 4, hp: 40, mana: 20 })
  });

  function removeLegacyCollectibles(collection) {
    const validIds = new Set(Object.values(COLLECTIBLE_CATALOG).map((item) => item.id));
    return Object.fromEntries(Object.entries(collection && typeof collection === 'object' ? collection : {})
      .filter(([id]) => validIds.has(id)));
  }

  return { COLLECTIBLE_CATALOG, removeLegacyCollectibles };
}));
