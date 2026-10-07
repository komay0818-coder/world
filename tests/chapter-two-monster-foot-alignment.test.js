const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles', 'monster-slots.css'), 'utf8');

const expectedOffsets = {
  blackForestWolf: '0%',
  corruptedBoar: '8.6914%',
  shadowSpider: '10.6445%',
  corruptedTreant: '-8.0078%',
  blackForestHunter: '3.7109%',
  forestGuardianV2: '5.957%'
};

for (const [monsterId, offset] of Object.entries(expectedOffsets)) {
  assert.match(script, new RegExp(`${monsterId}: '${offset.replace('.', '\\.')}'`), `${monsterId} has an independent foot alignment offset`);
}

assert.match(script, /--unit-art-offset-y:\$\{visualVerticalOffset\}/, 'battle markup passes the per-monster offset to CSS');
assert.match(css, /translate: 0 var\(--unit-art-offset-y, 0%\) !important;/, 'monster artwork applies its vertical offset');
assert.match(script, /ChapterTwoBalancePlaytestPolicy\?\.isActive\(\)[\s\S]*?has\('showcase'\)/, 'visual showcase mode is detected for playtest protection');
assert.match(script, /return visualShowcase \|\|[\s\S]*?\? 1 : 0;/, 'visual showcase characters cannot drop below one HP');

console.log('chapter-two-monster-foot-alignment: assertions passed');
