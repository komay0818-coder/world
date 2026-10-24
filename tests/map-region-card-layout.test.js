const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadGame } = require('../tools/headless-game-runtime');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'dungeon.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.equal((script.match(/return renderMapRegionCard\(\{/g) || []).length, 3, 'all three chapter region views use the shared card renderer');
const sharedRenderer = script.slice(
  script.indexOf('function renderMapRegionCard('),
  script.indexOf('function renderBeginnerPlainsRegions()')
);
assert.match(sharedRenderer, /map-region-card-header/, 'shared cards expose one header');
assert.match(sharedRenderer, /map-region-facts/, 'shared cards expose one facts section');
assert.match(sharedRenderer, /map-region-unlock/, 'shared cards expose one independent unlock section');
assert.match(sharedRenderer, /map-region-action/, 'shared cards expose one action section');
const chapterOneRenderer = script.slice(
  script.indexOf('function renderBeginnerPlainsRegions()'),
  script.indexOf('function renderRedrockWastesRegions()')
);
assert.doesNotMatch(chapterOneRenderer, /unlockFacts\s*:/, 'chapter one omits the expanded unlock-condition panel to match later chapters');
assert.match(script, /怪物數量[\s\S]*稀有機率[\s\S]*需求等級[\s\S]*區域壓制[\s\S]*Boss/, 'shared facts keep the requested information order');
assert.match(css, /\.map-region-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/, 'desktop cards use an aligned two-column grid');
assert.match(css, /@media\(max-width:760px\)[\s\S]*\.map-region-grid\{grid-template-columns:1fr\}/, 'narrow screens safely collapse to one column');
assert.match(css, /\.map-region-name\{[^}]*text-wrap:balance;word-break:keep-all;overflow-wrap:anywhere/, 'long map names remain whole when possible and wrap safely when required');
assert.match(html, /dungeon\.css\?v=20261018-shared-map-cards-v1/, 'the browser receives the shared card stylesheet without a stale cache');

const game = loadGame(root);
const card = game.evaluate(`renderMapRegionCard({
  number: 7,
  region: { id: 'future-long-map', name: '失落王國北境古代守護者聖殿迴廊' },
  stateClass: 'available',
  statusLabel: '已解鎖',
  statusTone: 'unlocked',
  requirementLevel: 45,
  suppressionLabel: '12 / 30',
  bossLabel: '遠古守護者・尚未擊敗',
  unlockFacts: [['解鎖條件', '擊敗上一區域 Boss']],
  actionHtml: '<button type="button">進入區域</button>'
})`);
assert.match(card, /失落王國北境古代守護者聖殿迴廊/, 'future long names are preserved without truncation');
assert.match(card, /map-region-status unlocked[\s\S]*怪物數量[\s\S]*解鎖條件[\s\S]*進入區域/, 'future cards inherit the complete shared structure');

console.log('map region card layout: assertions passed');
