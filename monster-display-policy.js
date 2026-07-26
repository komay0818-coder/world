(function attachMonsterDisplayPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MonsterDisplayPolicy = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createMonsterDisplayPolicy() {
  const MONSTER_IMAGE_BY_TYPE = Object.freeze({
    plainsRabbit: 'assets/plains-rabbit.png?v=20260724-transparent-v1',
    plainsWolfPup: 'assets/plains-wolf-pup.png?v=20260724-user-image-v2',
    plainsSlime: 'assets/plains-slime.png?v=20260724-transparent-v1',
    plainsGoblinYoung: 'assets/plains-goblin-young.png?v=20260724-user-image-v1',
    lostGoblin: 'assets/lost-goblin.png?v=20260724-user-image-v1',
    denForestWolf: 'assets/wolf-den-forest-wolf.png?v=20260725-user-image-v1',
    ragingWolf: 'assets/wolf-den-raging-wolf.png?v=20260725-user-image-v1',
    greatfangWolf: 'assets/wolf-den-greatfang-wolf.png?v=20260725-user-image-v1',
    boarPiglet: 'assets/boar-woods-piglet.png?v=20260725-user-image-v1',
    forestBoar: 'assets/boar-woods-forest-boar.png?v=20260725-user-image-v1',
    irritableBoar: 'assets/boar-woods-irritable-boar.png?v=20260726-user-image-v1',
    boarKing: 'assets/boar-woods-giant-tusk-boar-v2.png?v=20260726-user-image-v2',
    goblin: 'assets/goblin-transparent.png',
    goblinScout: 'assets/goblin-transparent.png',
    goblinWarrior: 'assets/goblin-transparent.png',
    goblinSlinger: 'assets/goblin-transparent.png',
    goblinShaman: 'assets/goblin-transparent.png',
    goblinGuard: 'assets/goblin-transparent.png',
    goblinCaptain: 'assets/goblin-transparent.png',
    goblinTreasureChest: 'assets/goblin-transparent.png',
    goblinHighChief: 'assets/goblin-transparent.png',
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
    rootExecutioner: 'assets/dungeon-root-executioner.png',
    altarNightblade: 'assets/dungeon-nightblade.png',
    moonboneSentinel: 'assets/dungeon-moonbone.png',
    blightOracle: 'assets/dungeon-oracle.png',
    eclipseSovereign: 'assets/dungeon-boss.png'
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
