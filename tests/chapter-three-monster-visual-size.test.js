const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const chapterThree = require('../chapter-three-map-policy.js');
const bloodwar = require('../bloodwar-wastes-policy.js');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles', 'monster-slots.css'), 'utf8');
const chapterThreeIds = Object.values(chapterThree.ENEMIES).map((enemy) => enemy.id);

chapterThreeIds.forEach((enemyId) => {
  assert.match(script, new RegExp(`['"]${enemyId}['"]\\s*:\\s*(?:\\d|\\.)`), `${enemyId} has a visual-size correction`);
});

[
  ['wasteland-hyena', '.8302715'],
  ['redrock-lizard', '.973104'],
  ['wasteland-vulture', '1.05742125'],
  ['skullcrusher-scout', '.8708175'],
  ['skullcrusher-spearman', '.8708175'],
  ['skullcrusher-warrior', '.9888785825625'],
  ['brokenrock-brute', '.97'],
  ['canyon-warlord', '1.14639'],
  ['redrock-hornbeast', '1.04'],
  ['redrock-giant-lizard', '1.33'],
  ['temple-executioner', '1.38'],
  ['skullcrusher-berserker', '.9063'],
  ['skullcrusher-shieldguard', '.8721'],
  ['skullcrusher-hunter', '.94'],
  ['skullcrusher-shaman', '1.0857'],
  ['skullcrusher-centurion', '1.2012'],
  ['skullcrusher-vanguard-commander', '1.1088']
].forEach(([enemyId, expectedScale]) => {
  assert.match(
    script,
    new RegExp(`['"]${enemyId}['"]\\s*:\\s*${String(expectedScale).replace('.', '\\.')}`),
    `${enemyId} uses the corrected landscape-art scale`
  );
});

assert.deepEqual(bloodwar.getCombatPool(), {
  normal: ['skullcrusher-berserker', 'skullcrusher-shieldguard', 'skullcrusher-hunter', 'skullcrusher-shaman'],
  elite: ['skullcrusher-centurion'],
  boss: ['skullcrusher-vanguard-commander']
});
assert.ok([...bloodwar.getCombatPool().normal, ...bloodwar.getCombatPool().elite, ...bloodwar.getCombatPool().boss]
  .every((enemyId) => bloodwar.getCombatMonster(enemyId)?.image.includes(`assets/${enemyId}.png`)));

assert.match(
  css,
  /monster-battle-slot\[class\*="visual-size-"\] \.monster-slot-image \{\s*scale: var\(--unit-art-correction, 1\) !important;/,
  'the final battlefield rule applies each monster correction'
);
assert.match(css, /monster-battle-slot\.elite,[\s\S]*?monster-battle-slot\.boss \{[\s\S]*?--unit-rank-scale: 1;/, 'rank does not enlarge artwork');
assert.match(css, /monster-battle-slot\.elite \.monster-image-frame,[\s\S]*?monster-battle-slot\.boss \.monster-image-frame \{\s*filter: none !important;/, 'elite and boss frames do not render a second oversized glow');
assert.match(css, /monster-battle-slot\.elite \.monster-image-frame::after,[\s\S]*?width: 62%;[\s\S]*?height: 30%;[\s\S]*?transform: translateX\(-50%\) scale\(var\(--unit-art-correction, 1\)\)/, 'the single rank aura follows the rendered monster scale');

console.log('chapter-three-monster-visual-size: all assertions passed');
