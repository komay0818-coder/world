const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(html, /elite-affix-policy\.js[\s\S]*script\.js/, '詞綴政策先於主程式載入');
assert.match(script, /function createEnemyAffixes/);
assert.match(script, /EliteAffixPolicy\.applyAffixes/);
assert.match(script, /EliteAffixPolicy\.getDirectDamageLeech/);
assert.match(script, /EliteAffixPolicy\.getRegeneration/);
assert.match(script, /affixDropBonus\.materialMultiplier/);
assert.match(script, /affixDropBonus\.equipmentMultiplier/);
assert.match(script, /ChapterTwoRecipeDropPolicy\.grantRecipeDrops\(progress, enemy, currentMap\.id\)/, '配方掉落未套用詞綴 Bonus');
assert.match(script, /monster-affix-badge/);

console.log('elite-affix-integration: assertions passed');
