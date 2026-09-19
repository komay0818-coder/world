(function attachMonsterDisplayPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MonsterDisplayPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createMonsterDisplayPolicy() {
  const MONSTER_IMAGE_BY_TYPE = Object.freeze({
    plainsRabbit: 'assets/plains-rabbit.png?v=20260831-size-normalized-v1',
    plainsWolfPup: 'assets/plains-wolf-pup.png?v=20260831-monster-style-v1',
    plainsSlime: 'assets/plains-slime.png?v=20260831-size-normalized-v1',
    plainsGoblinYoung: 'assets/plains-goblin-young.png?v=20260831-size-normalized-v1',
    lostGoblin: 'assets/lost-goblin.png?v=20260831-size-normalized-v1',
    denForestWolf: 'assets/wolf-den-forest-wolf.png?v=20260831-monster-style-v1',
    ragingWolf: 'assets/wolf-den-raging-wolf.png?v=20260831-monster-style-v1',
    greatfangWolf: 'assets/wolf-den-greatfang-wolf.png?v=20260831-monster-style-v1',
    boarPiglet: 'assets/boar-woods-piglet.png?v=20260831-monster-style-v1',
    forestBoar: 'assets/boar-woods-forest-boar.png?v=20260831-monster-style-v1',
    irritableBoar: 'assets/boar-woods-irritable-boar.png?v=20260831-monster-style-v1',
    boarKing: 'assets/boar-woods-giant-tusk-boar-v2.png?v=20260831-monster-style-v1',
    goblin: 'assets/goblin-transparent.png',
    goblinScout: 'assets/goblin-camp-scout-transparent.png?v=20260831-monster-style-v1',
    goblinWarrior: 'assets/goblin-camp-warrior-transparent.png?v=20260831-monster-style-v1',
    goblinSlinger: 'assets/goblin-camp-slinger-transparent.png?v=20260831-monster-style-v1',
    goblinShaman: 'assets/goblin-camp-shaman-transparent.png?v=20260831-monster-style-v1',
    goblinGuard: 'assets/goblin-camp-guard-transparent.png?v=20260831-monster-style-v1',
    goblinCaptain: 'assets/goblin-camp-captain-transparent.png?v=20260831-monster-style-v1',
    goblinTreasureChest: 'assets/goblin-treasure-chest.png?v=20260831-monster-style-v1',
    goblinHighChief: 'assets/goblin-camp-high-chief-transparent.png?v=20260831-monster-style-v1',
    wolf: 'assets/forest-wolf.png',
    boar: 'assets/wild-boar.png',
    goblinOverlord: 'assets/goblin-transparent.png',
    wolfAlpha: 'assets/forest-wolf.png',
    boarTyrant: 'assets/wild-boar.png',
    goblinKing: 'assets/goblin-king.png',
    nightGoblin: 'assets/night-goblin.png',
    shadowWolf: 'assets/shadow-wolf.png',
    thornBoar: 'assets/thorn-boar.png',
    forestShaman: 'assets/night-goblin.png',
    moonfangAlpha: 'assets/shadow-wolf.png',
    thornbackTyrant: 'assets/thorn-boar.png',
    forestGuardian: 'assets/forest-guardian-v2.png',
    highlandWolf: 'assets/plains-depths-highland-wolf.png?v=20260831-monster-style-v1',
    rockbackBoar: 'assets/plains-depths-rockback-boar.png?v=20260831-monster-style-v1',
    blackstoneScout: 'assets/plains-depths-blackstone-scout.png?v=20260920-shared-plains-depths-v2',
    grasslandVulture: 'assets/plains-depths-grassland-vulture.png?v=20260831-monster-style-v1',
    blackstoneRaider: 'assets/plains-depths-blackstone-raider.png?v=20260920-shared-plains-depths-v2',
    wanderingBlackKnight: 'assets/plains-depths-wandering-black-knight.png?v=20260831-monster-style-v1',
    blackstoneLeader: 'assets/plains-depths-blackstone-leader.png?v=20260831-monster-style-v1',
    'wasteland-hyena': 'assets/wasteland-hyena.png?v=20260912-redrock-monsters-v1',
    'redrock-lizard': 'assets/redrock-lizard.png?v=20260912-redrock-monsters-v1',
    'wasteland-vulture': 'assets/wasteland-vulture.png?v=20260912-redrock-monsters-v1',
    'skullcrusher-scout': 'assets/skullcrusher-scout.png?v=20260912-redrock-monsters-v1',
    'redrock-hornbeast': 'assets/redrock-hornbeast.png?v=20260912-redrock-monsters-v1',
    'redrock-giant-lizard': 'assets/redrock-giant-lizard.png?v=20260912-redrock-monsters-v1',
    'skullcrusher-spearman': 'assets/skullcrusher-spearman.png?v=20260912-brokenrock-monsters-v1',
    'skullcrusher-warrior': 'assets/skullcrusher-warrior.png?v=20260912-brokenrock-monsters-v1',
    'brokenrock-brute': 'assets/brokenrock-brute.png?v=20260912-brokenrock-monsters-v1',
    'canyon-warlord': 'assets/canyon-warlord.png?v=20260912-brokenrock-monsters-v1',
    'skullcrusher-berserker': 'assets/skullcrusher-berserker.png?v=20260912-bloodwar-monsters-v1',
    'skullcrusher-shieldguard': 'assets/skullcrusher-shieldguard.png?v=20260912-bloodwar-monsters-v1',
    'skullcrusher-hunter': 'assets/skullcrusher-hunter.png?v=20260912-bloodwar-monsters-v1',
    'skullcrusher-shaman': 'assets/skullcrusher-shaman.png?v=20260912-bloodwar-monsters-v1',
    'skullcrusher-centurion': 'assets/skullcrusher-centurion.png?v=20260912-bloodwar-monsters-v1',
    'skullcrusher-vanguard-commander': 'assets/skullcrusher-vanguard-commander.png?v=20260912-bloodwar-monsters-v1',
    'skullcrusher-heavy-guard': 'assets/skullcrusher-heavy-guard.png?v=20260912-war-camp-monsters-v1',
    'skullcrusher-wolf-rider': 'assets/skullcrusher-wolf-rider.png?v=20260912-war-camp-monsters-v1',
    'skullcrusher-champion': 'assets/skullcrusher-champion.png?v=20260912-war-camp-monsters-v1',
    'skullcrusher-great-chieftain': 'assets/skullcrusher-great-chieftain.png?v=20260912-war-camp-monsters-v1',
    'skullcrusher-priest': 'assets/skullcrusher-priest.png?v=20260912-ancient-altar-monsters-v1',
    'skullcrusher-fanatic': 'assets/skullcrusher-fanatic.png?v=20260912-ancient-altar-monsters-v1',
    'ancient-stoneguard': 'assets/ancient-stoneguard.png?v=20260912-ancient-altar-monsters-v1',
    'rune-guard': 'assets/rune-guard.png?v=20260912-ancient-altar-monsters-v1',
    'awakened-guard': 'assets/awakened-guard.png?v=20260912-ancient-altar-monsters-v1',
    'fallen-high-priest': 'assets/fallen-high-priest.png?v=20260912-ancient-altar-monsters-v1',
    'temple-stoneguard': 'assets/temple-stoneguard.png?v=20260912-redrock-temple-monsters-v1',
    'rune-golem': 'assets/rune-golem.png?v=20260912-redrock-temple-monsters-v1',
    'temple-executioner': 'assets/temple-executioner.png?v=20260912-redrock-temple-monsters-v1',
    'ancient-priest': 'assets/ancient-priest.png?v=20260912-redrock-temple-monsters-v1',
    'temple-guardian': 'assets/temple-guardian.png?v=20260912-redrock-temple-monsters-v1',
    'redrock-ancient-god': 'assets/redrock-ancient-god.png?v=20260912-redrock-temple-monsters-v1'
  });

  const STATUS_DISPLAY = Object.freeze({
    burn: Object.freeze({ icon: '🔥', label: '燃燒' }),
    poison: Object.freeze({ icon: '☠', label: '中毒' })
  });

  function getMonsterLevel(map, playerLevel) {
    const minimum = Math.max(1, Number(map?.min) || 1);
    const maximum = Math.max(minimum, Number(map?.max) || minimum);
    return Math.min(maximum, Math.max(minimum, Number(playerLevel) || minimum));
  }

  function getRankDisplay(monster) {
    if (monster?.isBoss) return { className: 'boss', label: 'BOSS', icon: '♛' };
    if (monster?.isElite) return { className: 'elite', label: '菁英', icon: '◆' };
    if (monster?.isRare) return { className: 'rare', label: '稀有', icon: '✦' };
    return { className: 'normal', label: '', icon: '' };
  }

  function getStatusDisplays(dots) {
    const seen = new Set();
    return (Array.isArray(dots) ? dots : []).map((dot) => STATUS_DISPLAY[dot?.type])
      .filter((status) => status && !seen.has(status.label) && seen.add(status.label));
  }

  return { MONSTER_IMAGE_BY_TYPE, getMonsterLevel, getRankDisplay, getStatusDisplays };
}));
