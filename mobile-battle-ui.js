(function initializeMobileBattleUi(global) {
  'use strict';

  const portraitQuery = global.matchMedia('(max-width: 700px) and (orientation: portrait)');
  const state = {
    active: false,
    infoTab: 'log',
    menuPage: '1',
    anchors: new Map()
  };

  function getElements() {
    return {
      battleBottom: document.querySelector('#battle-screen .battle-bottom'),
      battleMenu: document.querySelector('#battle-screen .battle-menu'),
      adventureInfo: document.querySelector('#battle-screen .battle-adventure-info'),
      combatLog: document.querySelector('#battle-screen .combat-log'),
      skillPanel: document.querySelector('#battle-screen .skill-panel'),
      info: document.querySelector('#mobile-battle-info'),
      logHost: document.querySelector('[data-mobile-info-panel="log"]'),
      lootHost: document.querySelector('[data-mobile-info-panel="loot"]'),
      skillModal: document.querySelector('#mobile-skill-modal'),
      skillHost: document.querySelector('#mobile-skill-content')
    };
  }

  function rememberPosition(node) {
    if (!node || state.anchors.has(node)) return;
    const anchor = document.createComment(`mobile-battle-anchor:${node.className || node.id}`);
    node.parentNode?.insertBefore(anchor, node);
    state.anchors.set(node, anchor);
  }

  function moveInto(node, host) {
    if (!node || !host || node.parentNode === host) return;
    rememberPosition(node);
    host.appendChild(node);
  }

  function restore(node) {
    const anchor = state.anchors.get(node);
    if (!node || !anchor?.parentNode) return;
    anchor.parentNode.insertBefore(node, anchor.nextSibling);
  }

  function setInfoTab(tab) {
    const nextTab = tab === 'loot' ? 'loot' : 'log';
    state.infoTab = nextTab;
    document.querySelectorAll('[data-mobile-info-tab]').forEach((button) => {
      button.setAttribute('aria-selected', String(button.dataset.mobileInfoTab === nextTab));
    });
    document.querySelectorAll('[data-mobile-info-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.mobileInfoPanel !== nextTab;
    });
  }

  function setMenuPage(page) {
    const elements = getElements();
    const nextPage = page === '2' ? '2' : '1';
    state.menuPage = nextPage;
    if (elements.battleMenu) {
      elements.battleMenu.dataset.mobilePage = nextPage;
      elements.battleMenu.setAttribute('aria-label', `遊戲選單，第 ${nextPage} 頁`);
    }
  }

  function closeSkillPanel() {
    const { skillModal } = getElements();
    skillModal?.classList.add('hidden');
  }

  function classifyBattleToast() {
    const toast = document.querySelector('#toast');
    if (!toast) return;
    const isLootNotice = /^(?:獲得裝備|獲得材料|獲得淨化道具|獲得技能材料|獲得配方|獲得符文|獲得副手|額外掉落藍色裝備|特殊紫裝掉落|專屬紫裝掉落)[：:]/.test(toast.textContent.trim());
    toast.classList.toggle('mobile-battle-loot-notice', isLootNotice);
  }

  function openSkillPanel() {
    if (!state.active) return;
    const { skillModal } = getElements();
    skillModal?.classList.remove('hidden');
  }

  function activate() {
    const elements = getElements();
    if (!elements.info || !elements.battleMenu) return;
    state.active = true;
    elements.info.hidden = false;
    moveInto(elements.combatLog, elements.logHost);
    moveInto(elements.skillPanel, elements.skillHost);
    classifyBattleToast();
    setInfoTab(state.infoTab);
    setMenuPage(state.menuPage);
  }

  function deactivate() {
    const elements = getElements();
    state.active = false;
    closeSkillPanel();
    restore(elements.combatLog);
    restore(elements.skillPanel);
    document.querySelector('#toast')?.classList.remove('mobile-battle-loot-notice');
    if (elements.info) elements.info.hidden = true;
    if (elements.battleMenu) {
      elements.battleMenu.dataset.mobilePage = '1';
      elements.battleMenu.setAttribute('aria-label', '遊戲選單');
    }
  }

  function syncLayout() {
    if (portraitQuery.matches) activate();
    else deactivate();
  }

  function bindEvents() {
    document.querySelectorAll('[data-mobile-info-tab]').forEach((button) => {
      button.addEventListener('click', () => setInfoTab(button.dataset.mobileInfoTab));
    });

    document.querySelector('[data-mobile-info-toggle]')?.addEventListener('click', (event) => {
      const info = document.querySelector('#mobile-battle-info');
      if (!info) return;
      const collapsed = info.classList.toggle('is-collapsed');
      event.currentTarget.setAttribute('aria-expanded', String(!collapsed));
      event.currentTarget.setAttribute('aria-label', collapsed ? '展開戰鬥資訊' : '收合戰鬥資訊');
      event.currentTarget.textContent = collapsed ? '⌄' : '⌃';
    });

    document.querySelectorAll('[data-mobile-menu-target]').forEach((button) => {
      button.addEventListener('click', () => setMenuPage(button.dataset.mobileMenuTarget));
    });

    document.querySelector('.mobile-skill-button')?.addEventListener('click', openSkillPanel);
    document.querySelector('#mobile-skill-close')?.addEventListener('click', closeSkillPanel);
    document.querySelector('#mobile-skill-modal')?.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) closeSkillPanel();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeSkillPanel();
    });

    const toast = document.querySelector('#toast');
    if (toast) new MutationObserver(classifyBattleToast).observe(toast, { childList: true, characterData: true, subtree: true });

    if (typeof portraitQuery.addEventListener === 'function') portraitQuery.addEventListener('change', syncLayout);
    else portraitQuery.addListener(syncLayout);
  }

  bindEvents();
  syncLayout();

  global.MobileBattleUI = Object.freeze({
    syncLayout,
    setInfoTab,
    setMenuPage,
    openSkillPanel,
    closeSkillPanel,
    classifyBattleToast,
    getState: () => ({ active: state.active, infoTab: state.infoTab, menuPage: state.menuPage })
  });
})(window);
