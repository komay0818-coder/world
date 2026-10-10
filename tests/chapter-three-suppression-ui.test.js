const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{loadGame}=require('../tools/headless-game-runtime');
const F=require('../chapter-three-facility-policy');
const source=fs.readFileSync(path.join(__dirname,'..','script.js'),'utf8');
const suppressionCss=fs.readFileSync(path.join(__dirname,'..','styles','adventure-info.css'),'utf8');
const expected=[[4163,57],[4388,61],[4600,72],[5000,78],[5500,86],[6000,96]];
Object.keys(F.CONFIG).forEach((map,i)=>F.TYPES.forEach(type=>{const d=F.definition('facility:'+type,map);assert.equal(d.maxHp,expected[i][0]);assert.equal(d.defense,expected[i][1]);}));
const g=loadGame(),panel={hidden:true,open:true},rows={innerHTML:''},region={textContent:''},unresolved={textContent:'',classList:{toggle(){}}};
const original=g.context.document.querySelector;
g.context.document.querySelector=selector=>({'#chapter-three-suppression':panel,'#suppression-rows':rows,'#suppression-region-name':region,'#suppression-unresolved-count':unresolved}[selector]||original(selector));
for(const [map,c] of Object.entries(F.CONFIG)){
 const progress={chapterThreeFacilities:{[map]:{'supply-station':1,armory:Math.floor(c.required/2),'shaman-altar':c.required+3}}};
 g.context.panelProgress=progress;g.context.panelMap={id:map,name:map};g.evaluate('renderChapterThreeSuppression(panelProgress,panelMap)');
 const effects=F.effects(progress,map),format=n=>Number(n.toFixed(2));
 assert.equal(panel.hidden,false);assert.equal(panel.open,true,'updates preserve expanded state');
 assert.equal(unresolved.textContent,'2 項未解除');
 assert.match(rows.innerHTML,new RegExp('1 / '+c.required));
 assert.ok(rows.innerHTML.includes('每秒扣血 '+format(effects.drain)+' HP'));
 assert.ok(rows.innerHTML.includes('傷害降低 '+format((1-effects.damage)*100)+'%'));
 assert.ok(rows.innerHTML.includes((c.required+3)+' / '+c.required));
 assert.ok(rows.innerHTML.includes('value="'+c.required+'"'));assert.ok(rows.innerHTML.includes('已解除'));
 g.context.panelProgress={};g.evaluate('renderChapterThreeSuppression(panelProgress,panelMap)');assert.ok(rows.innerHTML.includes('0 / '+c.required),'switching to independent progress resets display');
}
assert.match(source,/showToast\(`特殊紫裝掉落：\$\{specialEquipmentDrop\.name\}`\)/,'rare equipment notices remain unchanged');
assert.match(suppressionCss,/#chapter-three-suppression \.suppression-rows \{[^}]*background: #07151d/,'expanded rows retain the dark panel background');
assert.match(suppressionCss,/#chapter-three-suppression \.suppression-row \{[^}]*grid-template-columns: minmax\(0,1fr\)/,'facilities use a compact vertical layout');
assert.match(suppressionCss,/#chapter-three-suppression \.suppression-row \{[^}]*border-bottom: 1px solid rgba\(203,160,70,\.2\)/,'facility rows use a subtle gold separator');
assert.match(suppressionCss,/#chapter-three-suppression \.suppression-row-head \{[^}]*background: transparent/,'legacy white nested cards are reset');
assert.match(suppressionCss,/progress::-webkit-progress-value \{ background: linear-gradient\(90deg,#9d6f20,#efc95e\)/,'suppression progress uses a gold fill');
assert.match(suppressionCss,/\.chapter-three-suppression\[open\] \{[^}]*overflow-y: auto/,'expanded content scrolls independently when necessary');
g.context.panelMap={id:'plains-entrance'};g.evaluate('renderChapterThreeSuppression({},panelMap)');assert.equal(panel.hidden,true);
// Real destruction settlement updates the panel and persisted counts immediately.
g.evaluate(`requestAnimationFrame=()=>0;window.location={hostname:'localhost',pathname:'/',search:'?playtest=chapter-three-36&facility=armory',href:'http://localhost/'};Math.random=()=>.5;openBattle();var idx=battle.enemyTypes.findIndex(ChapterThreeFacilityPolicy.facilityId);applyDamageToMonster(idx,10000000,{damageType:'physical',attackRange:'ranged'},{attacker:getMainBattleMember(),canEvade:false,canParry:false});queueDefeatedEnemies();`);
assert.ok(rows.innerHTML.includes('1 / 35'));assert.ok(rows.innerHTML.includes('傷害降低 19.43%'));
const persisted=JSON.parse(g.context.sessionStorage.getItem(g.evaluate('ChapterTwoBalancePlaytestPolicy.getProgressKey()')));
g.context.panelProgress=JSON.parse(JSON.stringify(persisted));g.context.panelMap={id:'redrock-temple',name:'赤岩聖殿'};g.evaluate('renderChapterThreeSuppression(panelProgress,panelMap)');assert.ok(rows.innerHTML.includes('1 / 35'));
console.log('chapter-three-suppression-ui: assertions passed');
