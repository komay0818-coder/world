const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'village.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(html, /styles\/village\.css\?v=20261025-mobile-village-fixed-window-v3/);
assert.match(html, /script\.js\?v=20261029-dungeon-map-progression-v1/);
assert.match(script, /Object\.values\(MagicTowerPolicy\.RECIPES\)\.filter/, 'mobile recipes derive from the centralized recipe registry');
assert.match(script, /page\?\.implemented !== false && book\?\.implemented !== false/, 'unimplemented ranks remain hidden');
assert.match(script, /data-view-magic-recipe="\$\{recipe\.id\}"/, 'tapping a tile only opens its details');
assert.match(script, /class="magic-detail-backdrop" role="dialog"/, 'details use a separate dialog');
assert.match(script, /MagicTowerPolicy\.canSynthesize\(progress, previewRecipe\.id, building\.level\)/, 'details revalidate quantity and tower level');
assert.match(script, /MagicTowerPolicy\.CONFIG\.successChance/, 'the displayed rate comes from the existing policy');
assert.match(script, /await commitEconomyProgress\('技能書合成'/, 'synthesis keeps the existing atomic transaction');
assert.match(script, /if \(magicSynthesisBusy\) return \{ ok: false, code: 'busy' \}/, 'duplicate submissions remain blocked');
assert.match(css, /\.magic-recipe-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/, 'mobile fragments use four equal columns');
assert.match(css, /\.magic-recipe-tile\{position:relative;display:flex;min-width:0;height:112px/, 'fragment cells keep one size');
assert.match(css, /\.magic-detail\{width:min\(354px,100%\);max-height:calc\(100dvh - 32px\)/, 'details scroll within the mobile viewport');
assert.match(css, /#village-building-modal\{align-items:end;padding:0!important\}/, 'mobile village windows remain bottom aligned');
assert.match(css, /#village-building-modal \.village-building-window\{display:flex;height:88dvh;max-height:88dvh!important;flex-direction:column;overflow:hidden\}/, 'all mobile village windows use one fixed height');
assert.match(css, /#village-building-modal \.village-building-content\{min-height:0;flex:1 1 auto;overflow-y:auto/, 'only building content scrolls when it exceeds the fixed window');

console.log('mobile-magic-tower-ui: assertions passed');
