const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /hunter-arrow-policy\.js/, 'the arrow policy loads before the game script');
assert.match(script, /HunterArrowPolicy\.createStarterQuiver\(\)/, 'starter hunter equipment includes a quiver');
assert.match(script, /selection\.job === 'hunter' \? createStarterEquipment\('hunter'\) : emptyEquipment\(\)/, 'new hunters are saved with starter equipment immediately');
assert.match(script, /HunterArrowPolicy\.ensureStarterQuiver/, 'old hunter saves are migrated to a starter quiver');
assert.match(script, /playerArrows: HunterArrowPolicy\.isHunter\(character\.job\) \? HunterArrowPolicy\.getMaxArrows\(progress\.equipment\) : 0/, 'each new battle starts with a full quiver');
assert.match(script, /usesArrows && !HunterArrowPolicy\.canUseSkill/, 'hunter skills skip when arrows are insufficient');
assert.match(script, /if \(!usesArrows && battle\.playerMana < manaCost\) continue;/, 'other jobs keep their existing resource checks');
assert.match(script, /if \(usesArrows\) battle\.playerArrows = HunterArrowPolicy\.spendArrows/, 'successful hunter skills spend arrows');
assert.match(script, /const displayedResource = usesArrows \? battle\.playerArrows : battle\.playerMana;/, 'the hunter resource bar reads arrows');
assert.match(script, /if \(usesArrows\) \{[\s\S]*HunterArrowPolicy\.recoverArrows/, 'battle ticks recover hunter arrows');
assert.doesNotMatch(script, /battle\.playerArrows\s*[-+]=[\s\S]{0,100}playerAttackCharge/, 'ordinary attack flow does not spend arrows');
assert.match(script, /currentMap\.id === 'plains-depths'[\s\S]*getPlainsDepthsOffhandDropRate/, 'plains-depths victories roll the new offhand drop rates');
assert.match(script, /applyMagicDamageBonus\(baseDamage, magicDamageBonus\)/, 'magic damage offhands increase resolved magic damage');

console.log('hunter-arrow-integration: assertions passed');
