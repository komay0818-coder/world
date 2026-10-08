'use strict';
const assert=require('node:assert/strict');
const {loadGame}=require('../tools/headless-game-runtime');
const g=loadGame();
const output=JSON.parse(g.evaluate(`
requestAnimationFrame=()=>0;
window.location={hostname:'localhost',pathname:'/',search:'?playtest=chapter-three-36',href:'http://localhost/'};
const oldSlots=getCharacterSlots();
const oldKey=ChapterTwoBalancePlaytestPolicy.getSlotKey();
const oldSnapshot=sessionStorage.getItem(oldKey);
const summarize=slots=>slots.map(slot=>{const p=slot.progress;const stats=getCharacterStats(p.level,p,slot.character);return {job:slot.character.job,hp:stats.hp,maxHp:stats.maxHp,attack:stats.attack,defense:stats.defense,accuracy:stats.accuracy,criticalChance:stats.criticalChance,attackSpeed:stats.attackSpeed,stats,runes:RunePolicy.getBonuses(p.equipment),words:RunePolicy.getActiveWords(p.equipment).map(word=>word.id),equipment:p.equipment};});
const oldStats=summarize(oldSlots);
window.location.search='?playtest=chapter-three-36&loadout=rare-runes-v1';
const newSlots=getCharacterSlots();
const newKey=ChapterTwoBalancePlaytestPolicy.getSlotKey();
JSON.stringify({oldStats,newStats:summarize(newSlots),oldKey,newKey,oldPreserved:oldSnapshot===sessionStorage.getItem(oldKey),loadout:ChapterTwoBalancePlaytestPolicy.getLoadout(),boss:ChapterThreeLateCombatPolicy.getMonster('redrock-temple',ChapterThreeMapPolicy.getEnemy('redrock-ancient-god'))});
`));
assert.equal(output.loadout,'rare-runes-v1');assert.notEqual(output.oldKey,output.newKey);assert.equal(output.oldPreserved,true);
assert.equal(output.boss.maxHp,26000);assert.equal(output.boss.attack,198);
for(const member of output.newStats){
 assert.equal(Object.values(member.equipment).filter(Boolean).length,10);
 assert.ok(Object.values(member.equipment).filter(Boolean).every(item=>item.quality==='rare'));
 assert.ok(member.words.includes({warrior:'battle-will',hunter:'frenzy',priest:'meditation'}[member.job]));
 assert.ok(member.stats.attack > output.oldStats.find(old => old.job === member.job).stats.attack);
 assert.ok(member.stats.skillDamagePercent > 0);
 assert.equal(member.equipment.weapon.sockets,2);assert.equal(member.runes.defensePercent,.03);
}
const fs=require('fs');fs.mkdirSync('tmp',{recursive:true});fs.writeFileSync('tmp/rare-rune-stats.json',JSON.stringify(output,null,2));
console.log('chapter-three-36-rare-rune-playtest: assertions passed');

