(function(){
'use strict';const r=PermanentPartyRuntime.current,c=window.permanentFarmingCoordinator;if(!r||!c)throw Error('Permanent farming coordinator missing');let disposed=false;
window.permanentFarmingEventIdentity=()=>({mainId:r.mainId,battle});
const originalOpenBattle=openBattle,originalVillage=openVillage,originalAddPartyMember=addPartyMember,originalRemovePartyMember=removePartyMember;
function timers(){clearInterval(battleTimer);clearInterval(skillTimer);clearInterval(enemyAttackTimer);skillTimer=setInterval(autoSkillTick,100);battleTimer=setInterval(battleTick,100);enemyAttackTimer=setInterval(enemyAttackTick,100);}
function restoreSavedPlayers(){const prior=new Map((battle.partyMembers||[]).map(member=>[member.id,member]));battle.partyMembers=buildBattlePartyMembers(Date.now()).map(fresh=>{const member=PermanentOnlinePolicy.refreshMember(prior.get(fresh.id),fresh);PermanentOnlinePolicy.restoreMember(member,(r.getBattleProgress?.(fresh.id)||r.getProgress(fresh.id)).partyMemberState);return member;});syncLegacyBattleStateFromMain();}
function mode(){
 const mainId=r.mainId;
 if(!mainId){if(r.hasCharacters)throw Error('Active character party missing');return null;}
 const party=r.model.parties[mainId];
 if(!party||!Array.isArray(party.memberIds)||party.memberIds[0]!==mainId)throw Error('Active character party invalid');
 return party.memberIds.length>1?'party':'solo';
}
const CHECKPOINT_INTERVAL_MS=1000;
let checkpointQueued=false,lastCheckpoint=0,checkpointTimer=null,characterChange=null,characterChangePromise=null;
function queueCheckpoint(){if(disposed||!fighting||r.busy||r.failure||checkpointQueued||Date.now()-lastCheckpoint<CHECKPOINT_INTERVAL_MS)return;const identity=window.permanentFarmingEventIdentity(),token=c.tokens()[r.mainId];if(!token)return;checkpointQueued=true;checkpointTimer=permanentFarmingNativeTimeout(()=>{checkpointTimer=null;checkpointQueued=false;if(disposed)return;const current=window.permanentFarmingEventIdentity();if(!fighting||r.busy||r.failure||current.mainId!==identity.mainId||current.battle!==identity.battle||c.tokens()[r.mainId]!==token)return;try{const saved=persistPartyRuntimeState();lastCheckpoint=Date.now();Promise.resolve(saved).catch(error=>showToast('戰鬥保存未完成：'+error.message));}catch(error){showToast('戰鬥保存未完成：'+error.message);}},5);}
window.queuePermanentFarmingCheckpoint=queueCheckpoint;
const originalBattleTick=battleTick,originalEnemyTick=enemyAttackTick,originalSkillTick=autoSkillTick;
battleTick=function(...args){const result=originalBattleTick(...args);queueCheckpoint();return result;};enemyAttackTick=function(...args){const result=originalEnemyTick(...args);queueCheckpoint();return result;};autoSkillTick=function(...args){const result=originalSkillTick(...args);queueCheckpoint();return result;};
openBattle=async function(){try{const currentMode=mode();if(!currentMode)throw Error('Create a character before starting battle');const owner=r.getCommitted().farming?.owners[r.mainId];if(owner&&c.tokens()[r.mainId]===owner)await c.stop();await c.start(currentMode);originalOpenBattle();await r.flush();}catch(error){showToast('掛機未開始：'+error.message);}};
openVillage=async function(...args){try{await c.stop();originalVillage(...args);}catch(error){showToast('返回村莊未完成：'+error.message);}};
let partyTransitionBusy=false;
function partyTransitionError(error){return /in flight|transition in progress|conflict/i.test(error?.message||'')?'目前正在保存資料，請稍後再試。':error.message;}
async function changeParty(type,id){if(partyTransitionBusy){showToast('隊伍調整處理中，請稍候。');return;}partyTransitionBusy=true;const running=fighting;try{await c.transition({type,mainId:r.mainId,characterId:id});if(running){await c.start(mode());fighting=true;rebuildBattlePartyMembers();await r.flush();timers();}renderParty();}catch(error){showToast((type==='recruit'?'入隊':'離隊')+'未完成：'+partyTransitionError(error));}finally{partyTransitionBusy=false;}}
addPartyMember=function(id){return changeParty('recruit',id);};
removePartyMember=function(id){return changeParty('leave',id);};
let passLeave=false;const battleControlHandler=event=>{if(disposed)return;const leaving=event.target?.closest?.('#leave-battle'),toggle=event.target?.closest?.('#battle-toggle');if(characterChange&&(leaving||toggle)){event.preventDefault();event.stopImmediatePropagation();showToast('角色切換處理中，請先完成或取消角色選擇。');return;}if(leaving){if(passLeave){passLeave=false;return;}if(layoutEditMode)return;event.preventDefault();event.stopImmediatePropagation();c.stop().then(()=>{passLeave=true;leaving.click();}).catch(error=>showToast('停止掛機未完成：'+error.message));return;}if(!toggle||battle.dungeonComplete)return;event.preventDefault();event.stopImmediatePropagation();(async()=>{if(fighting){await c.stop();document.querySelector('#battle-toggle').textContent='▶ 繼續攻擊';}else{await c.start(mode());if(battle.partyMembers?.length){restoreSavedPlayers();fighting=true;timers();}else originalOpenBattle();}})().catch(error=>showToast('掛機狀態未變更：'+error.message));};document.addEventListener('click',battleControlHandler,true);
window.permanentFarmingVisibility=async()=>{const currentMode=mode();if(!currentMode)return {status:'no-character'};if(document.visibilityState==='hidden'){permanentResumeBattle=fighting;await c.stop({offline:currentMode==='solo'});}else{await c.recover();if(currentMode==='solo')await c.settle();if(permanentResumeBattle&&!getProgress().requiresMapSelectionAfterDefeat){await c.start(mode());restoreSavedPlayers();fighting=true;timers();}}};
window.preparePermanentCharacterChange=()=>{
 if(characterChangePromise)return characterChangePromise;
 if(characterChange)return Promise.resolve(characterChange);
 const mainId=r.mainId,currentMode=mode(),wasFighting=Boolean(fighting);characterChange={mainId,mode:currentMode,wasFighting,ready:false};
 characterChangePromise=(async()=>{
  if(wasFighting&&battle.partyMembers?.length)persistPartyRuntimeState();
  fighting=false;permanentResumeBattle=false;clearInterval(battleTimer);clearInterval(skillTimer);clearInterval(enemyAttackTimer);battleTimer=skillTimer=enemyAttackTimer=null;
  await r.flush();await c.stop({offline:wasFighting&&currentMode==='solo'});await r.flush();
  characterChange=Object.freeze({mainId,mode:currentMode,wasFighting,ready:true});return characterChange;
 })().finally(()=>{characterChangePromise=null;});
 return characterChangePromise;
};
window.completePermanentCharacterChange=()=>{const prepared=characterChange;characterChange=null;permanentResumeBattle=false;return prepared;};
window.cancelPermanentCharacterChange=async()=>{
 if(characterChangePromise)await characterChangePromise;
 const prepared=characterChange;characterChange=null;
 if(!prepared?.wasFighting||r.mainId!==prepared.mainId)return {resumed:false};
 const owner=r.getCommitted().farming?.owners?.[r.mainId],localToken=c.tokens()[r.mainId];if(!owner||owner!==localToken)await c.start(mode());restoreSavedPlayers();fighting=true;timers();await r.flush();return {resumed:true};
};
window.restorePermanentFarmingPlayers=restoreSavedPlayers;window.permanentFarmingReady=true;
r.onDeactivate(()=>{disposed=true;characterChange=null;characterChangePromise=null;checkpointQueued=false;if(checkpointTimer!==null){clearTimeout(checkpointTimer);checkpointTimer=null;}fighting=false;permanentResumeBattle=false;clearInterval(battleTimer);clearInterval(skillTimer);clearInterval(enemyAttackTimer);battleTimer=skillTimer=enemyAttackTimer=null;if(battle?.partyMembers)battle.partyMembers=[];document.removeEventListener('click',battleControlHandler,true);battleTick=originalBattleTick;enemyAttackTick=originalEnemyTick;autoSkillTick=originalSkillTick;openBattle=originalOpenBattle;openVillage=originalVillage;addPartyMember=originalAddPartyMember;removePartyMember=originalRemovePartyMember;delete window.queuePermanentFarmingCheckpoint;delete window.permanentFarmingEventIdentity;delete window.permanentFarmingVisibility;delete window.preparePermanentCharacterChange;delete window.completePermanentCharacterChange;delete window.cancelPermanentCharacterChange;delete window.restorePermanentFarmingPlayers;window.permanentFarmingReady=false;window.permanentFarmingCoordinator=null;});
})();
