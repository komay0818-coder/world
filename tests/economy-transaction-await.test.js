'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{loadGame}=require('../tools/headless-game-runtime');
const source=fs.readFileSync(path.join(__dirname,'..','script.js'),'utf8');
for(const name of ['confirmAlchemy','craftChapterThreeEpicWeapon','craftWorkshopEquipment','upgradeVillageBuilding'])assert.match(source,new RegExp(`async function ${name}\\(`),name+' waits for persistence');
assert.match(source,/await commitEconomyProgress\('技能升級'/);
assert.match(source,/await commitEconomyProgress\('黑森林淨化'/);

const game=loadGame();
game.evaluate(`
 var economyMessages=[];
 showToast=message=>economyMessages.push(message);
 var economyPersisted={level:1,xp:0,gold:100,inventory:[{id:'iron-ore',kind:'material',quantity:3}],equipment:{},skillLevels:{},party:{activeMemberIds:[]}};
 var economyDraft=null,economyFail=false,economyCommits=0,economyHold=false,economyRelease=null;
 PermanentPartyRuntime={current:{active:true,mainId:'economy-character',
  getProgress(){return JSON.parse(JSON.stringify(economyPersisted));},
  saveProgress(id,value){if(!this.active)throw Error('stopped');economyDraft=JSON.parse(JSON.stringify(value));},
  async flush(){if(!this.active)throw Error('stopped');if(economyDraft){if(economyHold)await new Promise(resolve=>{economyRelease=resolve;});if(economyFail){economyDraft=null;throw Error('Injected IndexedDB failure');}economyPersisted=economyDraft;economyDraft=null;economyCommits++;}return economyPersisted;}
 }};
`);
(async()=>{
 let result=await game.evaluate(`commitEconomyProgress('測試購買',progress=>{progress.gold-=10;progress.inventory[0].quantity-=1;return {ok:true};})`);
 assert.equal(result.ok,true);assert.equal(game.evaluate('economyPersisted.gold'),90);assert.equal(game.evaluate('economyPersisted.inventory[0].quantity'),2);assert.equal(game.evaluate('economyCommits'),1);
 const before=game.evaluate('JSON.stringify(economyPersisted)');
 game.evaluate('economyFail=true');
 result=await game.evaluate(`commitEconomyProgress('測試製作',progress=>{progress.gold-=20;progress.inventory=[];return {ok:true};})`);
 assert.equal(result.ok,false);assert.equal(result.code,'save-failed');assert.equal(game.evaluate('JSON.stringify(economyPersisted)'),before,'failed IndexedDB commit rolls back gold and inventory');assert.match(game.evaluate('economyMessages.at(-1)'),/未成功保存/);
 game.evaluate(`economyFail=false;economyHold=true;var heldEconomy=commitEconomyProgress('連續點擊',progress=>{progress.gold-=5;return {ok:true};});`);
 await new Promise(resolve=>setImmediate(resolve));
 result=await game.evaluate(`commitEconomyProgress('連續點擊',progress=>{progress.gold-=5;return {ok:true};})`);
 assert.equal(result.ok,false);assert.equal(result.code,'busy','second click is rejected while IndexedDB commit is in flight');
 game.evaluate('economyHold=false;economyRelease();');
 result=await game.evaluate('heldEconomy');
 assert.equal(result.ok,true);assert.equal(game.evaluate('economyPersisted.gold'),85,'only one of two rapid operations is committed');assert.equal(game.evaluate('economyCommits'),2);
 const beforeStopped=game.evaluate('JSON.stringify(economyPersisted)');
 game.evaluate('PermanentPartyRuntime.current.active=false;economyFail=false');
 result=await game.evaluate(`commitEconomyProgress('登出期間交易',progress=>{progress.gold-=1;return {ok:true};})`);
 assert.equal(result.ok,false);assert.equal(game.evaluate('JSON.stringify(economyPersisted)'),beforeStopped,'stopped runtime cannot begin a new purchase');
 console.log('Economy transaction await: assertions passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
