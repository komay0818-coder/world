'use strict';
const assert=require('node:assert/strict');
const Offline=require('../offline-settlement-store');
const Store=require('../permanent-party-store');
const Policy=require('../permanent-party-policy');
const Farming=require('../permanent-farming-policy');
const Cloud=require('../cloud-save-sync');
const memoryIndexedDB=require('./helpers/memory-indexeddb');

const user='cccccccc-cccc-4ccc-8ccc-cccccccccccc',accountId='supabase:'+user;
const lease=()=>({assertValid(){},identity(){return {leaseId:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',deviceId:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'};},invalidate(){}});
function jsonbRoundTrip(value){
 if(Array.isArray(value))return value.map(jsonbRoundTrip);
 if(!value||typeof value!=='object')return value;
 const result={};for(const key of Object.keys(value).sort((a,b)=>a.length-b.length||a.localeCompare(b)))result[key]=jsonbRoundTrip(value[key]);return result;
}
function server(){
 let save=null;return {get save(){return save;},controller:{verification:{userId:user},isCurrent(){return true;},async requestApi(_verification,route,options={}){
  if(route==='/v1/save'&&options.method==='GET')return save?{status:200,ok:true,body:{save:structuredClone(save)}}:{status:404,ok:false,body:{error:{code:'SAVE_NOT_FOUND'}}};
  if(route==='/v1/save/commit'&&options.method==='POST'){
   const input=options.body,current=save?.revision||0;if(current!==input.baseRevision)return {status:409,ok:false,body:{error:{code:'REVISION_CONFLICT'}}};
   save={schemaVersion:input.schemaVersion,revision:current+1,snapshot:jsonbRoundTrip(input.snapshot),contentHash:input.contentHash,updatedAt:'2026-10-22T00:00:00.000Z'};
   return {status:201,ok:true,body:{duplicate:false,save:{...save,snapshot:undefined}}};
  }
  throw Error('unexpected request');
 }}};
}
async function open(indexedDB,name){return Store.wrap(await Offline.open({indexedDB,name,version:2}));}
async function seeded(store){
 let result=await store.initializeSupabaseAccount(accountId,{now:1000});
 const characterId='character-cloud-owner';
 result=await store.execute(accountId,result.account.revision,'create-cloud-owner',{type:'create',id:characterId,slotIndex:0,character:{id:characterId,name:'跨瀏覽器測試',job:'warrior'},progress:{level:7,xp:12.5,gold:0,equipment:{},skillLevels:{},lastActiveAt:1000}},{coordinated:true,now:1000});
 result=await store.execute(accountId,result.account.revision,'switch-cloud-owner',{type:'switch-main',characterId},{coordinated:true,now:1001});
 let model=structuredClone(result.account.permanent);
 const weapon={id:'equipment-cloud-weapon',instanceId:'equipment-cloud-weapon',kind:'equipment',slot:'weapon',quality:'common'},armor={id:'equipment-cloud-armor',instanceId:'equipment-cloud-armor',kind:'equipment',slot:'armor',quality:'common'},bagItem={id:'equipment-cloud-bag',instanceId:'equipment-cloud-bag',kind:'equipment',slot:'weapon',quality:'common'};
 model.characters[characterId].progress.equipment={weapon,armor};model.bag.items.push(bagItem,{id:'wolf-fur',kind:'material',quantity:12});
 model.equipmentOwners[weapon.instanceId]={kind:'equipped',characterId,slot:'weapon'};model.equipmentOwners[armor.instanceId]={kind:'equipped',characterId,slot:'armor'};model.equipmentOwners[bagItem.instanceId]={kind:'bag'};Policy.validate(model);
 return (await store.commitOnline(accountId,result.account.revision,'online-v2:2:cloud-owner-seed',model,{}, {coordinated:true})).account;
}

(async()=>{
 let checks=0;const check=(value,label)=>{assert(value,label);checks++;};
 const source=Policy.createEmptyModel(),item={id:'equipment-order',instanceId:'equipment-order',kind:'equipment',slot:'weapon'};
 source.characters['character-order']={character:{id:'character-order',job:'warrior'},progress:{level:1,xp:0,gold:0,equipment:{weapon:item},skillLevels:{}}};source.slotOrder[0]='character-order';source.activeMainId='character-order';source.parties['character-order']={mainId:'character-order',memberIds:['character-order']};source.equipmentOwners[item.instanceId]={slot:'weapon',characterId:'character-order',kind:'equipped'};
 check(Policy.validate(source),'equivalent owner fields remain valid after JSONB key reordering');
 const wrong=structuredClone(source);wrong.equipmentOwners[item.instanceId].characterId='character-other';assert.throws(()=>Policy.validate(wrong),/Ownership index mismatch/);checks++;
 const extra=structuredClone(source);extra.equipmentOwners[item.instanceId].unexpected=true;assert.throws(()=>Policy.validate(extra),/Ownership index mismatch/);checks++;

 const remote=server(),chromeDb=memoryIndexedDB(),chrome=await open(chromeDb,'chrome-cloud-owner');await seeded(chrome);
 const chromeSync=Cloud.create({controller:remote.controller,store:chrome,authUserId:user,lease:lease()}),uploaded=await chromeSync.upload();
 check(uploaded.save.revision===1,'Chrome uploads the complete snapshot');
 check(Object.keys(remote.save.snapshot.permanent.equipmentOwners).length===3,'cloud snapshot keeps every ownership entry');
 check(Object.keys(remote.save.snapshot.farming.owners).length===0,'non-farming snapshot has no false occupation');

 const edgeDb=memoryIndexedDB(),edge=await open(edgeDb,'edge-cloud-owner'),edgeSync=Cloud.create({controller:remote.controller,store:edge,authUserId:user,lease:lease()});
 const downloaded=await edgeSync.download(),edgeAccount=await edge.read(accountId);
 check(downloaded.status==='downloaded'&&Policy.validate(edgeAccount.permanent),'Edge restores the JSONB-reordered snapshot');
 check(edgeAccount.permanent.characters['character-cloud-owner'].progress.equipment.weapon.instanceId==='equipment-cloud-weapon','equipped item and its owner survive Chrome to Edge restore');
 edge.close();const edgeReloaded=await open(edgeDb,'edge-cloud-owner'),afterF5=await edgeReloaded.read(accountId);
 check(Policy.validate(afterF5.permanent)&&afterF5.permanent.bag.items.find(value=>value.id==='wolf-fur').quantity===12,'F5 keeps the restored character, equipment and bag');

 let chromeAccount=await chrome.read(accountId);
 chromeAccount=(await chrome.farmingAction(accountId,chromeAccount.revision,'farming-test-active-session',{type:'start',leaderId:'character-cloud-owner',mode:'solo',token:'isolated-active-session',now:2000})).account;
 await assert.rejects(()=>chromeSync.upload(),error=>error.code==='ACTIVE_FARMING');checks++;
 check(remote.save.revision===1&&Object.keys(remote.save.snapshot.farming.owners).length===0,'active farming defers cloud upload instead of publishing partial ownership state');
 check(chromeAccount.farming.owners['character-cloud-owner']==='isolated-active-session'&&chromeAccount.farming.sessions['isolated-active-session'].status==='online','deferred upload does not stop or settle the local farming session');
 chromeAccount=(await chrome.farmingAction(accountId,chromeAccount.revision,'farming-test-stop-session',{type:'stop',token:'isolated-active-session',now:2100,offline:false})).account;
 const stoppedUpload=await chromeSync.upload();
 check(stoppedUpload.save.revision===2&&Object.keys(remote.save.snapshot.farming.owners).length===0&&remote.save.snapshot.farming.sessions['isolated-active-session'].status==='stopped','stopped farming metadata uploads only after ownership is safely released');
 const edgeAfterFarming=await open(memoryIndexedDB(),'edge-after-farming'),edgeAfterSync=Cloud.create({controller:remote.controller,store:edgeAfterFarming,authUserId:user,lease:lease()});await edgeAfterSync.download();const restoredAfterFarming=await edgeAfterFarming.read(accountId);
 check(Policy.validate(restoredAfterFarming.permanent)&&restoredAfterFarming.farming.sessions['isolated-active-session'].status==='stopped'&&!Object.keys(restoredAfterFarming.farming.owners).length,'another browser restores the stopped session without inventing occupation or rewards');

 chrome.close();edgeReloaded.close();edgeAfterFarming.close();
 console.log('Cloud ownership order restore: '+checks+' checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
