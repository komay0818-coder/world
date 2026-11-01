'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','permanent-farming-bridge.js'),'utf8');
function harness({hasCharacters=false,mainId=null,parties={},fighting=false}={}){
 let visibilityHandler,deactivationHandler,starts=0,stops=[];
 const runtime={mainId,hasCharacters,model:{parties},busy:false,failure:null,getCommitted:()=>({farming:{owners:{}}}),getProgress:()=>({}),flush:async()=>{},onDeactivate:fn=>{deactivationHandler=fn;}};
 const coordinator={tokens:()=>({}),start:async()=>{starts++;},stop:async options=>{stops.push(options||{});},recover:async()=>{},settle:async()=>{},transition:async()=>{}};
 const context={PermanentPartyRuntime:{current:runtime},permanentFarmingCoordinator:coordinator,window:null,document:{visibilityState:'visible',addEventListener(type,fn){if(type==='click')return;if(type==='visibilitychange')visibilityHandler=fn;},removeEventListener(){}},battle:{partyMembers:[{id:mainId}]},openBattle(){},openVillage(){},addPartyMember(){},removePartyMember(){},battleTick(){},enemyAttackTick(){},autoSkillTick(){},clearInterval(){},setInterval(){return 1;},clearTimeout(){},permanentFarmingNativeTimeout:setTimeout,fighting,battleTimer:null,skillTimer:null,enemyAttackTimer:null,layoutEditMode:false,permanentResumeBattle:false,getProgress:()=>({requiresMapSelectionAfterDefeat:false}),buildBattlePartyMembers:()=>[],syncLegacyBattleStateFromMain(){},persistPartyRuntimeState(){},rebuildBattlePartyMembers(){},renderParty(){},showToast(){}};
 context.window=context;vm.runInNewContext(source,context,{filename:'permanent-farming-bridge.js'});
 return {context,runtime,stops,get visibilityHandler(){return visibilityHandler;},get deactivationHandler(){return deactivationHandler;},get starts(){return starts;}};
}
(async()=>{
 let checks=0,check=(value,label)=>{assert(value,label);checks++;};
 const empty=harness();
 const result=await empty.context.permanentFarmingVisibility();
 check(result.status==='no-character','valid zero-character account skips farming visibility work');
 check(empty.starts===0,'zero-character account never starts farming');
 const corrupted=harness({hasCharacters:true});
 await assert.rejects(()=>corrupted.context.permanentFarmingVisibility(),/Active character party missing/);checks++;
 const missingParty=harness({hasCharacters:true,mainId:'character-a',parties:{}});
 await assert.rejects(()=>missingParty.context.permanentFarmingVisibility(),/Active character party invalid/);checks++;
 const valid=harness({hasCharacters:true,mainId:'character-a',parties:{'character-a':{mainId:'character-a',memberIds:['character-a']}}});
 valid.context.document.visibilityState='hidden';await valid.context.permanentFarmingVisibility();
 check(valid.starts===0,'valid character visibility suspension does not create a second farming session');
 const switching=harness({hasCharacters:true,mainId:'character-a',parties:{'character-a':{mainId:'character-a',memberIds:['character-a']}},fighting:true});
 const first=switching.context.preparePermanentCharacterChange(),second=switching.context.preparePermanentCharacterChange();check(first===second,'rapid character-change preparation shares one operation');const plan=await first;check(plan.wasFighting&&plan.mode==='solo'&&switching.stops.length===1&&switching.stops[0].offline===true,'active solo role is stopped at a persisted offline boundary exactly once');await switching.context.cancelPermanentCharacterChange();check(switching.starts===1&&switching.context.fighting,'cancelling role selection resumes the same foreground role');
 const idle=harness({hasCharacters:true,mainId:'character-a',parties:{'character-a':{mainId:'character-a',memberIds:['character-a']}},fighting:false});await idle.context.preparePermanentCharacterChange();check(idle.stops.length===1&&idle.stops[0].offline===false,'changing from village or an idle battle creates no offline reward boundary');
 const party=harness({hasCharacters:true,mainId:'character-a',parties:{'character-a':{mainId:'character-a',memberIds:['character-a','character-b']}},fighting:true});const partyPlan=await party.context.preparePermanentCharacterChange();check(partyPlan.mode==='party'&&party.stops[0].offline===false,'active team obeys existing mutual exclusion and cannot become solo offline income');
 console.log('Permanent farming bridge empty account: '+checks+' checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
