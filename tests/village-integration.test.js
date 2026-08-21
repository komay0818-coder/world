const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles', 'village.css'), 'utf8');

['openVillage', 'closeVillage', 'renderVillage', 'openVillageBuilding', 'closeVillageBuilding', 'upgradeVillageBuilding', 'getVillageBuildingData', 'saveVillageData', 'loadVillageData'].forEach((name) => {
  assert.match(script, new RegExp(`function ${name}\\(`), `${name} is available as a dedicated village entry point`);
});
assert.match(html, /id="village-screen"/);
assert.match(html, /id="village-menu-button"/);
assert.match(html, /data-menu-action="村莊"/);
assert.equal((html.match(/id="village-building-modal"/g) || []).length, 1, 'all buildings share one modal');
assert.match(script, /Object\.values\(VillagePolicy\.BUILDING_DEFINITIONS\)/, 'building cards render from centralized data');
assert.match(html, /village-upgrade-policy\.js[\s\S]*script\.js/, 'building upgrade policy loads before the main game script');
assert.match(html, /world\/6bd12564a8f40c65e2637a87045a4bfe863f9475\/village-upgrade-policy\.js/, 'building materials load the immutable artwork definition');
assert.match(script, /VillageUpgradePolicy\.grantMapDrops\(progress, currentMap\.id\)/, 'battle rewards include map-based building materials');
assert.match(script, /VillageUpgradePolicy\.upgrade\(progress, villageData, buildingId\)/, 'the village action uses the centralized upgrade policy');
assert.match(script, /升級至 Lv2/, 'the village shows the chapter-one upgrade action');
assert.match(script, /village: VillagePolicy\.normalizeVillageData\(saved\.village\)/, 'legacy progress is normalized on load');
assert.match(script, /progress\.village = VillagePolicy\.normalizeVillageData\(progress\.village\)/, 'village state is normalized on save');
assert.match(script, /else if \(buildingId === 'rune'\) renderMagicTower\(building\)/, 'magic tower opens its synthesis interface');
assert.match(script, /MagicTowerPolicy\.synthesize\(progress, recipeId, building\.level/, 'magic tower synthesis uses the centralized policy and building level');
assert.match(script, /villageReturnScreen = typeof forcedReturnScreen === 'string' \? forcedReturnScreen : \(!battleScreen\.classList\.contains\('hidden'\) \? 'battle' : 'menu'\)/, 'village supports an explicit post-defeat return destination');
assert.match(script, /if \(villageReturnScreen === 'battle'[\s\S]*battleScreen\.classList\.remove\('hidden'\)/, 'closing village reveals the existing battle screen');
assert.doesNotMatch(script.match(/function closeVillage\(\) \{[\s\S]*?\n\}/)?.[0] || '', /openBattle|clearInterval/, 'village close neither regenerates battle nor changes its timers');
assert.match(css, /grid-template-columns:repeat\(auto-fit,minmax\(230px,1fr\)\)/, 'building cards use a responsive grid');
assert.match(css, /\.app-shell\.village-open\{width:100%;max-width:none;padding:0\}/, 'the village can use the desktop viewport width');
assert.match(css, /grid-template-columns:repeat\(6,minmax\(0,1fr\)\)!important/, 'the battle menu accommodates the village entry');

console.log('village-integration: assertions passed');
