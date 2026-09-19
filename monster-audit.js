(function initializeMonsterAudit() {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  if (params.get('monsterAudit') !== '1') return;

  const rankLabels = Object.freeze({ normal: '普通怪', rare: '稀有怪', elite: '菁英怪', boss: 'Boss', finalBoss: '最終 Boss' });
  const state = { chapterIndex: 0, mapIndex: 0, monsterIndex: 0, battlePreview: false };

  function unique(values) {
    return [...new Set((values || []).filter(Boolean))];
  }

  function getRank(monster, map) {
    if (monster?.isBoss || monster?.rank === 'boss') return map.isFinalMap ? 'finalBoss' : 'boss';
    if (monster?.isElite || monster?.rank === 'elite') return 'elite';
    if (monster?.isRare || monster?.rank === 'rare') return 'rare';
    return 'normal';
  }

  function imagePathFor(monsterId, monster) {
    return MonsterDisplayPolicy.MONSTER_IMAGE_BY_TYPE[monsterId]
      || MonsterDisplayPolicy.MONSTER_IMAGE_BY_TYPE[monster?.id]
      || monster?.image
      || '';
  }

  function firstTwoChapterMonster(mapId, monsterId) {
    try {
      return getMonsterDefinitionForMap(monsterId, mapId, null);
    } catch {
      return monsterTypes[monsterId] || null;
    }
  }

  function catalogMonster(map, monsterId, sourceMonster = null) {
    const monster = sourceMonster || firstTwoChapterMonster(map.id, monsterId);
    if (!monster) return null;
    return Object.freeze({
      id: monsterId,
      name: monster.name || monsterId,
      rank: getRank(monster, map),
      image: imagePathFor(monsterId, monster),
      visualSize: typeof getMonsterVisualSize === 'function' ? getMonsterVisualSize(monster) : 'humanoid',
      visualScale: monster.visualScaleCorrection || monsterVisualScaleCorrections[monster.id] || monsterVisualScaleCorrections[monsterId] || 1
    });
  }

  function poolIds(pool) {
    return unique([...(pool?.normal || []), ...(pool?.rare || []), ...(pool?.elite || []), ...(pool?.boss || [])]);
  }

  function chapterOneMaps() {
    return mapProgression.filter((map) => map.chapter === 1 && map.regionOf === 'beginner-plains').map((map) => {
      let ids = poolIds(dropLookupMapPools[map.id]);
      if (map.id === 'goblin-camp') {
        ids = unique([
          ...ids,
          ...Object.values(DungeonTicketCycle.GOBLIN_CAMP_WAVES || {}).flat(),
          dungeonDefinitions['goblin-camp']?.finalBossId
        ]);
      }
      const auditMap = { ...map, isFinalMap: map.id === 'plains-depths' };
      return { ...auditMap, monsters: ids.map((id) => catalogMonster(auditMap, id)).filter(Boolean) };
    });
  }

  function chapterTwoMaps() {
    return ChapterTwoMapPolicy.MAPS.map((map) => ({
      ...map,
      monsters: poolIds(dropLookupMapPools[map.id]).map((id) => catalogMonster(map, id)).filter(Boolean)
    }));
  }

  function chapterThreeMaps() {
    return ChapterThreeMapPolicy.MAPS.map((map) => {
      const ids = unique([...(map.normalEnemyIds || []), map.eliteId, map.bossId]);
      return {
        ...map,
        monsters: ids.map((id) => catalogMonster(map, id, ChapterThreeMapPolicy.getEnemy(id))).filter(Boolean)
      };
    });
  }

  const chapters = [
    { number: 1, name: '初心者平原', maps: chapterOneMaps() },
    { number: 2, name: ChapterTwoMapPolicy.CHAPTER.name, maps: chapterTwoMaps() },
    { number: 3, name: ChapterThreeMapPolicy.CHAPTER.name, maps: chapterThreeMaps() }
  ];

  const root = document.createElement('section');
  root.id = 'monster-audit';
  root.className = 'monster-audit';
  root.setAttribute('aria-label', '怪物圖片巡檢模式');
  document.body.append(root);

  function current() {
    const chapter = chapters[state.chapterIndex];
    const map = chapter.maps[state.mapIndex];
    const monster = map.monsters[state.monsterIndex];
    return { chapter, map, monster };
  }

  function move(scope, direction) {
    if (scope === 'chapter') {
      state.chapterIndex = (state.chapterIndex + direction + chapters.length) % chapters.length;
      state.mapIndex = 0;
      state.monsterIndex = 0;
    } else if (scope === 'map') {
      const maps = chapters[state.chapterIndex].maps;
      state.mapIndex = (state.mapIndex + direction + maps.length) % maps.length;
      state.monsterIndex = 0;
    } else {
      const monsters = chapters[state.chapterIndex].maps[state.mapIndex].monsters;
      state.monsterIndex = (state.monsterIndex + direction + monsters.length) % monsters.length;
    }
    render();
  }

  function renderNavigator(chapter, map) {
    const mapOptions = chapter.maps.map((entry, index) => `<option value="${index}" ${index === state.mapIndex ? 'selected' : ''}>${entry.name}</option>`).join('');
    const monsterOptions = map.monsters.map((entry, index) => `<option value="${index}" ${index === state.monsterIndex ? 'selected' : ''}>${entry.name}・${rankLabels[entry.rank]}</option>`).join('');
    return `<aside class="monster-audit-nav">
      <div class="monster-audit-brand"><span>DEV ONLY</span><strong>怪物圖片巡檢</strong><button type="button" data-audit-close aria-label="關閉巡檢模式">×</button></div>
      <label>章節<select data-audit-select="chapter">${chapters.map((entry, index) => `<option value="${index}" ${index === state.chapterIndex ? 'selected' : ''}>第 ${entry.number} 章・${entry.name}</option>`).join('')}</select></label>
      <label>地圖<select data-audit-select="map">${mapOptions}</select></label>
      <label>怪物<select data-audit-select="monster">${monsterOptions}</select></label>
      <div class="monster-audit-index">第 ${state.monsterIndex + 1} / ${map.monsters.length} 隻</div>
      <nav class="monster-audit-step" aria-label="怪物巡檢導覽">
        <button type="button" data-audit-move="chapter:-1">上一章</button><button type="button" data-audit-move="chapter:1">下一章</button>
        <button type="button" data-audit-move="map:-1">上一張地圖</button><button type="button" data-audit-move="map:1">下一張地圖</button>
        <button type="button" data-audit-move="monster:-1">上一隻</button><button type="button" data-audit-move="monster:1">下一隻</button>
      </nav>
      <p>鍵盤：← → 切換怪物，↑ ↓ 切換地圖，Shift + ↑ ↓ 切換章節。</p>
    </aside>`;
  }

  function renderGallery(map, monster) {
    return `<main class="monster-audit-main">
      <header><div><span>第 ${chapters[state.chapterIndex].number} 章</span><h1>${map.name}</h1></div><button class="monster-audit-battle-button" type="button" data-audit-battle>進入實際戰鬥預覽</button></header>
      <article class="monster-audit-card rank-${monster.rank}">
        <div class="monster-audit-art"><img src="${monster.image}" alt="${monster.name}" draggable="false"><span>${rankLabels[monster.rank]}</span></div>
        <div class="monster-audit-details"><p>${rankLabels[monster.rank]}</p><h2>${monster.name}</h2><dl><div><dt>怪物 ID</dt><dd>${monster.id}</dd></div><div><dt>圖片資源路徑</dt><dd><code>${monster.image || '未接線'}</code></dd></div><div><dt>正式戰鬥尺寸分類</dt><dd>${monster.visualSize}・倍率 ${monster.visualScale}</dd></div></dl>${monster.image ? '' : '<strong class="monster-audit-error">找不到正式圖片接線</strong>'}</div>
      </article>
      <section class="monster-audit-strip" aria-label="本地圖怪物清單">${map.monsters.map((entry, index) => `<button type="button" class="${index === state.monsterIndex ? 'selected' : ''}" data-audit-monster="${index}"><img src="${entry.image}" alt=""><span>${entry.name}</span><small>${rankLabels[entry.rank]}</small></button>`).join('')}</section>
    </main>`;
  }

  function renderBattlePreview(map, monster) {
    const rank = monster.rank === 'finalBoss' ? 'boss' : monster.rank;
    return `<main class="monster-audit-main monster-audit-battle" style="--audit-map-background:url('${map.background || 'assets/beginner-plains-background.png'}')">
      <header><div><span>實際戰鬥 UI 預覽</span><h1>${map.name}</h1></div><button class="monster-audit-battle-button" type="button" data-audit-battle>返回單圖巡檢</button></header>
      <section class="monster-audit-battlefield">
        <div class="monster-audit-player"><div class="monster-audit-player-art">✦</div><strong>測試冒險者</strong><small>僅預覽畫面，不啟動戰鬥</small><div class="hp-track"><i style="width:100%"></i></div></div>
        <div class="enemy-squad monster-slot-grid" role="grid" aria-label="敵方戰場預覽">
          <article class="enemy-unit monster-battle-slot visual-size-${monster.visualSize} ${rank}" data-visual-size="${monster.visualSize}" style="--unit-art-correction:${monster.visualScale}" role="gridcell" aria-label="${monster.name}">
            <header class="monster-slot-header"><div class="monster-slot-title"><b>${monster.name}</b><small>預覽</small></div><span class="monster-rank-badge">${rankLabels[monster.rank]}</span></header>
            <div class="monster-image-frame"><img class="monster-slot-image" src="${monster.image}" alt="${monster.name}" draggable="false"></div>
            <div class="monster-status-row"><span class="monster-status-empty">無異常狀態</span></div>
            <div class="hp-track enemy-track monster-slot-hp"><i style="width:100%"></i></div>
          </article>
        </div>
      </section>
      <footer><strong>${monster.name}</strong><code>${monster.image}</code><span>正式圖片、尺寸分類與校正倍率</span></footer>
    </main>`;
  }

  function render() {
    const { chapter, map, monster } = current();
    root.innerHTML = `${renderNavigator(chapter, map)}${state.battlePreview ? renderBattlePreview(map, monster) : renderGallery(map, monster)}`;
  }

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-audit-close]')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('monsterAudit');
      window.location.replace(url);
      return;
    }
    const movement = event.target.closest('[data-audit-move]')?.dataset.auditMove;
    if (movement) {
      const [scope, direction] = movement.split(':');
      move(scope, Number(direction));
      return;
    }
    const monsterButton = event.target.closest('[data-audit-monster]');
    if (monsterButton) {
      state.monsterIndex = Number(monsterButton.dataset.auditMonster);
      render();
      return;
    }
    if (event.target.closest('[data-audit-battle]')) {
      state.battlePreview = !state.battlePreview;
      render();
    }
  });

  root.addEventListener('change', (event) => {
    const scope = event.target.dataset.auditSelect;
    if (!scope) return;
    state[`${scope}Index`] = Number(event.target.value);
    if (scope === 'chapter') state.mapIndex = 0;
    if (scope !== 'monster') state.monsterIndex = 0;
    render();
  });

  window.addEventListener('keydown', (event) => {
    if (event.target.matches('select, input, textarea')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') move('monster', event.key === 'ArrowLeft' ? -1 : 1);
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      move(event.shiftKey ? 'chapter' : 'map', event.key === 'ArrowUp' ? -1 : 1);
    }
    if (event.key === 'Escape' && state.battlePreview) { state.battlePreview = false; render(); }
  });

  render();
}());
