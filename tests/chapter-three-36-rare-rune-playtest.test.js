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
 // The fixture uses fixed seeds 304/305/306. V5 grade-first draws intentionally
 // produce different equipment from V4; rarity alone does not guarantee attack
 // or skill damage increases. Pin each offensive channel independently.
 const expected={
  warrior:{attack:68,basicAttackDamagePercent:.20,skillDamagePercent:.08},
  hunter:{attack:84,basicAttackDamagePercent:.18,skillDamagePercent:0},
  priest:{attack:71,basicAttackDamagePercent:.10,skillDamagePercent:.10}
 }[member.job];
 assert.ok(expected,'unexpected fixture job');
 for(const [stat,value] of Object.entries(expected)) {
  assert.ok(Math.abs(member.stats[stat]-value)<1e-9,
   member.job+' fixed V5 loadout '+stat+': expected '+value+', got '+member.stats[stat]);
 }
 for(const item of Object.values(member.equipment).filter(Boolean)) {
  assert.equal(item.affixSchemaVersion,5,'the fixture uses formal V5 generation');
  assert.equal(item.randomAffixes.length,3,'rare equipment keeps three random slots');
 }
 assert.equal(member.equipment.weapon.sockets,2);assert.equal(member.runes.defensePercent,.03);
}
console.log('chapter-three-36-rare-rune-playtest: assertions passed');

