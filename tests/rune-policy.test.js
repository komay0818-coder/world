const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const policy = require('../rune-policy.js');
const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

assert.equal(Object.keys(policy.RUNES).length, 5);
assert.deepEqual(Object.values(policy.RUNES).map((rune) => [rune.name, rune.stat, rune.value]), [
  ['力量符文', 'attackPercent', .03], ['守護符文', 'defensePercent', .03], ['生命符文', 'maxHpPercent', .04], ['致命符文', 'criticalChance', .02], ['靈能符文', 'resourceMaxPercent', .05]
]);
assert.equal(Object.keys(policy.WORDS).length, 6);
assert.equal(policy.getMaxSockets({ kind: 'equipment', slot: 'weapon' }), 3);
assert.equal(policy.getMaxSockets({ kind: 'equipment', slot: 'head' }), 2);
assert.deepEqual([.84, .85, .949, .95, .989, .99].map((roll) => policy.rollNaturalSockets({ kind: 'equipment', slot: 'weapon' }, 2, () => roll)), [0, 1, 1, 2, 2, 3]);
assert.deepEqual([.879, .88, .979, .98].map((roll) => policy.rollNaturalSockets({ kind: 'equipment', slot: 'head' }, 2, () => roll)), [0, 1, 1, 2]);
assert.equal(policy.rollNaturalSockets({ kind: 'equipment', slot: 'weapon' }, 1, () => .999), 0, '第一章不產生天然插槽');

const item = { id: 'weapon-1', kind: 'equipment', slot: 'weapon', sockets: 3, socketedRunes: [] };
const progress = { inventory: [item, { ...policy.RUNES.strength, quantity: 1 }, { ...policy.RUNES.life, quantity: 1 }, { ...policy.RUNES.fatal, quantity: 1 }] };
assert.equal(policy.socketRune(progress, item.id, policy.RUNES.strength.id).ok, true);
assert.equal(policy.socketRune(progress, item.id, policy.RUNES.life.id).word.name, '戰意');
assert.equal(policy.socketRune(progress, item.id, policy.RUNES.fatal.id).word.name, '征服');
assert.deepEqual(item.socketedRunes, ['rune-strength', 'rune-life', 'rune-fatal'], '鑲嵌順序永久記錄');
const wrongOrder = { kind: 'equipment', slot: 'weapon', sockets: 3, socketedRunes: ['rune-life', 'rune-strength', 'rune-fatal'] };
assert.equal(policy.getWord(wrongOrder), null, '順序錯誤時不啟動符文之語');
assert.deepEqual(policy.getBonuses({ weapon: wrongOrder }), { attackPercent: .03, defensePercent: 0, maxHpPercent: .04, criticalChance: .02, resourceMaxPercent: 0 }, '順序錯誤仍保留單顆效果');
assert.deepEqual(policy.requestSocket({ kind: 'equipment', slot: 'weapon', sockets: 0 }), { ok: false, reason: 'price-pending' }, '未確認價格前不會自行打洞或扣款');
assert.match(script, /runeAttackPercent[\s\S]*runeDefensePercent[\s\S]*runeMaxHpPercent[\s\S]*runeCriticalChance[\s\S]*runeResourceMaxPercent/, '五種單顆符文效果接入角色數值');
assert.match(script, /hasWord\(member\.progress\.equipment, 'battle-will'\)[\s\S]*> \.70 \? 1\.08/, '戰意在生命高於 70% 時增加 8% 攻擊');
assert.match(script, /hasWord\(target\.progress\.equipment, 'iron-wall'\)[\s\S]*Math\.random\(\) < \.15 \? \.20/, '鐵壁 15% 機率降低該次傷害 20%');
assert.match(script, /triggerRuneFrenzy[\s\S]*runeFrenzyUntil = now \+ 3000[\s\S]*runeFrenzyMultiplier[\s\S]*1\.08/, '狂擊暴擊後加速 8% 三秒且刷新時間');
assert.match(script, /hasWord\(member\.progress\.equipment, 'meditation'\)[\s\S]*resourceMax \* \.03[\s\S]*now \+ 5000/, '冥想每五秒恢復 3% 最大資源');
assert.match(script, /hasWord\(member\.progress\.equipment, 'conquest'\)[\s\S]*runeConquestTarget[\s\S]*Math\.min\(5[\s\S]*\.02/, '征服同目標累積五層並在換目標時重置');
assert.match(script, /hasWord\(target\.progress\.equipment, 'unyielding'\)[\s\S]*< \.30[\s\S]*now \+ 5000[\s\S]*now \+ 20000/, '不屈具備低血量、五秒減傷與二十秒冷卻');
assert.match(script, /價格尚未設定[\s\S]*不會消耗金幣或增加插槽/, '鐵匠在價格確認前不會免費或錯誤打洞');

console.log('rune-policy: assertions passed');
