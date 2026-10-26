const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'mobile-battle-portrait.css'), 'utf8');
const controller = fs.readFileSync(path.join(root, 'mobile-battle-ui.js'), 'utf8');

assert.match(html, /styles\/mobile-battle-portrait\.css\?v=20261023-mobile-loot-toast-v1/, 'portrait overrides load after the established desktop styles');
assert.match(html, /mobile-battle-ui\.js\?v=20261023-mobile-loot-toast-v1/, 'mobile controller cache version matches the portrait stylesheet');
assert.match(html, /id="mobile-battle-log-tab"[\s\S]*id="mobile-battle-loot-tab"/, 'mobile battle information exposes log and loot tabs');
assert.match(html, /id="mobile-battle-loot-panel"[\s\S]*id="mobile-drop-history"/, 'mobile loot tab owns an independent per-kill drop history');
assert.match(html, /data-mobile-menu-page="1"[\s\S]*data-mobile-menu-target="2"[\s\S]*class="battle-menu-button mobile-skill-button"[\s\S]*data-mobile-menu-target="1"/, 'mobile navigation contains two explicit five-cell pages');
assert.equal((html.match(/data-mobile-menu-page="1"/g) || []).length, 5, 'first mobile menu page has four actions and one arrow');
assert.equal((html.match(/data-mobile-menu-page="2"/g) || []).length, 5, 'second mobile menu page has four actions and one arrow');
assert.match(html, /id="mobile-skill-modal"[\s\S]*id="mobile-skill-content"/, 'skills have a dedicated mobile dialog');

assert.match(css, /@media \(max-width: 700px\) and \(orientation: portrait\)/, 'changes are scoped to portrait phones');
assert.match(css, /#battle-screen #map-travel-panel\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/, 'chapter and map selectors share the top row');
assert.match(css, /#battle-screen \.map-current-location,[\s\S]*display: none !important/, 'the duplicate current-location block is hidden on phones');
assert.match(css, /#battle-screen \.battle-center > \.battle-field[\s\S]*min-height: 365px !important/, 'the battlefield cannot collapse to zero height');
assert.match(css, /#enemy-squad\.monster-slot-grid[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/, 'up to four enemies remain in one row');
assert.match(css, /#enemy-squad \.monster-slot-image[\s\S]*height: 96px !important/, 'monster artwork remains visible instead of shrinking to a few pixels');
assert.match(css, /data-player-party-size="3"[\s\S]*left: 17%[\s\S]*data-party-slot="2"[\s\S]*left: 50%[\s\S]*data-party-slot="3"[\s\S]*left: 83%/, 'three party slots are evenly distributed');
assert.match(css, /#mobile-battle-info\.mobile-battle-info[\s\S]*flex: 1 1 auto !important/, 'shared information panel fills the space above the fixed navigation');
assert.match(css, /\.mobile-battle-info-body[\s\S]*flex: 1 1 auto[\s\S]*height: auto/, 'both information tabs share the enlarged flexible body');
assert.match(css, /#mobile-battle-info #combat-log-lines[\s\S]*height: calc\(100% - 30px\)[\s\S]*#mobile-battle-info #mobile-drop-history[\s\S]*height: 100%/, 'log and per-kill loot history scroll inside the full enlarged panel');
assert.match(css, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/, 'bottom navigation is one five-cell row');
assert.match(css, /env\(safe-area-inset-bottom\)/, 'bottom navigation accounts for the device safe area');
assert.match(css, /\.player-stage-info,[\s\S]*?\.player-stage-floating[\s\S]*?height: 76px !important/, 'all three player information cards share one fixed height');
assert.match(css, /\.player-stage-floating[\s\S]*?top: calc\(100% \+ 29px\) !important/, 'teammate cards share the main card top baseline');
assert.match(css, /#mobile-skill-content \.potion-button[\s\S]*?display: none !important/, 'mobile skill sheet hides potion controls and counts');
assert.match(css, /#toast\.mobile-battle-loot-notice[\s\S]*?display: none !important/, 'duplicate mobile loot notices do not cover the information panel');
assert.doesNotMatch(css, /body:has\(#battle-screen:not\(\.hidden\)\) #toast\.mobile-battle-loot-notice/, 'loot notice suppression is not limited to the battle screen');

assert.match(controller, /moveInto\(elements\.combatLog, elements\.logHost\)/, 'existing combat log data is reused');
assert.doesNotMatch(controller, /moveInto\(elements\.lootCard/, 'desktop cumulative loot card stays in its original desktop layout');
assert.match(controller, /moveInto\(elements\.skillPanel, elements\.skillHost\)/, 'existing active, passive and racial skill content is reused');
assert.match(controller, /function restore\(node\)/, 'desktop nodes can be restored to their original positions');
assert.match(controller, /setInfoTab\(state\.infoTab\)/, 'battle log is the default tab and state remains deterministic');
assert.match(controller, /MutationObserver\(classifyBattleToast\)/, 'live toast updates are classified without changing drop data');
assert.match(controller, /獲得裝備\|獲得材料\|獲得淨化道具\|獲得技能材料\|獲得配方\|獲得符文\|獲得副手\|額外掉落藍色裝備\|特殊紫裝掉落\|專屬紫裝掉落/, 'all item-drop toast variants are hidden on portrait phones');
assert.match(controller, /classList\.toggle\('mobile-battle-loot-notice', isLootNotice\)/, 'loot classification remains active after leaving the battle screen');

console.log('mobile battle portrait layout: assertions passed');
