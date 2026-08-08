(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ChapterTwoMapPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CHAPTER = Object.freeze({
    id: 'black-forest',
    chapter: 2,
    name: '黑森林',
    minLevel: 15,
    maxLevel: 30,
    previousMapId: 'plains-depths',
    firstMapId: 'black-forest-entrance',
    finalMapId: 'black-forest-depths',
    primaryFaction: 'blackstone-bandits',
    alliedFaction: 'goblins',
    corruptionPolicyId: 'black-forest-corruption',
    background: 'assets/black-forest-background.png',
    implemented: false,
    summary: '追查平原深處的黑石山賊，深入其位於黑森林的真正據點。'
  });

  function map(id, order, name, options = {}) {
    return Object.freeze({
      id,
      order,
      name,
      chapter: 2,
      regionOf: CHAPTER.id,
      min: CHAPTER.minLevel,
      max: CHAPTER.maxLevel,
      implemented: false,
      contentStatus: 'planned',
      dungeon: false,
      isFinalMap: false,
      background: CHAPTER.background,
      enemyPoolId: null,
      bossId: null,
      dropTableId: null,
      materialTableId: `${id}-purification-material`,
      eventTableId: null,
      environmentEffects: Object.freeze([]),
      story: Object.freeze({ previousMapId: null, nextMapId: null, objectiveId: null }),
      ...options
    });
  }

  const MAPS = Object.freeze([
    map('black-forest-entrance', 1, '黑森林入口', {
      contentStatus: 'combat-ready',
      background: 'assets/black-forest-entrance-background.png',
      enemyPoolId: 'black-forest-entrance-enemies',
      bossId: 'forest-guardian',
      story: Object.freeze({ previousMapId: 'plains-depths', nextMapId: 'black-forest-trail', objectiveId: null })
    }),
    map('black-forest-trail', 2, '黑森林小徑', {
      min: 17,
      max: 17,
      implemented: true,
      contentStatus: 'combat-ready',
      background: 'assets/black-forest-trail-background.png',
      enemyPoolId: 'black-forest-trail-enemies',
      bossId: 'blackstone-centurion',
      primaryFaction: 'blackstone-bandits',
      story: Object.freeze({
        premise: '黑石山賊已深入黑森林，建立巡邏路線與臨時據點，持續將物資運送至森林深處。',
        discoveries: Object.freeze(['blackstone-invasion', 'patrol-and-supply-route', 'poison-spider-husbandry']),
        previousMapId: 'black-forest-entrance',
        nextMapId: 'spider-nest',
        completionObjectiveId: 'defeat-blackstone-centurion',
        completionClueId: 'spider-nest-route-clue'
      })
    }),
    map('spider-nest', 3, '蜘蛛巢穴', {
      min: 19,
      max: 19,
      implemented: true,
      contentStatus: 'combat-ready',
      background: 'assets/spider-nest-background.png',
      enemyPoolId: 'spider-nest-enemies',
      bossId: 'giant-spider',
      primaryFaction: 'blackstone-beasts',
      story: Object.freeze({
        premise: '黑石勢力在森林深處建立蜘蛛培育巢穴，利用毒液、蛛絲與圈養蜘蛛擴張軍備。',
        discoveries: Object.freeze(['blackstone-spider-breeding', 'venom-weapon-production', 'spider-silk-harvesting']),
        previousMapId: 'black-forest-trail',
        nextMapId: 'blackstone-stronghold',
        completionObjectiveId: 'defeat-giant-spider'
      })
    }),
    map('blackstone-stronghold', 4, '黑石據點', {
      dungeon: true,
      gameplayType: 'outpost-siege',
      objectiveCount: 5,
      enemyFactionIds: Object.freeze(['blackstone-bandits', 'goblins']),
      story: Object.freeze({ previousMapId: 'spider-nest', nextMapId: 'forest-altar', objectiveId: null })
    }),
    map('forest-altar', 5, '森林祭壇', {
      story: Object.freeze({ previousMapId: 'blackstone-stronghold', nextMapId: 'black-forest-depths', objectiveId: null })
    }),
    map('black-forest-depths', 6, '黑森林深處', {
      isFinalMap: true,
      environmentEffects: Object.freeze(['dense-fog']),
      bossAuraPolicyId: 'black-forest-depths-boss-aura',
      story: Object.freeze({ previousMapId: 'forest-altar', nextMapId: null, objectiveId: null })
    })
  ]);

  const DUNGEONS = Object.freeze({
    'blackstone-stronghold': Object.freeze({
      id: 'blackstone-stronghold',
      chapter: 2,
      name: '黑石據點',
      implemented: false,
      contentStatus: 'planned',
      primaryFaction: 'blackstone-bandits',
      alliedFaction: 'goblins',
      gameplayType: 'outpost-siege',
      objectiveCount: 5,
      encounterPolicyId: 'blackstone-stronghold',
      waveTableId: null,
      specialEventTableId: null,
      bossMechanicId: null,
      finalBossId: null,
      entryItemId: null,
      rewardTableId: null,
      environmentEffects: Object.freeze([])
    })
  });

  function getMap(mapId) {
    return MAPS.find((entry) => entry.id === mapId) || null;
  }

  function getDungeon(dungeonId) {
    return DUNGEONS[dungeonId] || null;
  }

  function canEnter(mapId) {
    return Boolean(getMap(mapId)?.implemented);
  }

  return Object.freeze({ CHAPTER, MAPS, DUNGEONS, getMap, getDungeon, canEnter });
});
