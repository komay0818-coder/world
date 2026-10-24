'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','permanent-farming-bridge.js'),'utf8');
function harness({hasCharacters=false,mainId=null,parties={}}={}){
 let visibilityHandler,deactivationHandler,starts=0;
 const runtime={mainId,hasCharacters,model:{parties},busy:false,failure:null,getCommitted:()=>({farming:{owners:{}}}),getProgress:()=>({}),flush:async()=>{},onDeactivate:fn=>{deactivationHandler=fn;}};
 const coordinator={tokens:()=>({}),start:async()=>{starts++;},stop:async()=>{},recover:async()=>{},settle:async()=>{},transition:async()=>{}};
 const context={PermanentPartyRuntime:{current:runtime},permanentFarmingCoordinator:coordinator,window:null,document:{visibilityState:'visible',addEventListener(type,fn){if(type==='click')return;if(type==='visibilitychange')visibilityHandler=fn;},removeEventListener(){}},battle:{partyMembers:[]},openBattle(){},openVillage(){},addPartyMember(){},removePartyMember(){},battleTick(){},enemyAttackTick(){},autoSkillTick(){},clearInterval(){},setInterval(){return 1;},clearTimeout(){},permanentFarmingNativeTimeout:setTimeout,fighting:false,battleTimer:null,skillTimer:null,enemyAttackTimer:null,layoutEditMode:false,permanentResumeBattle:false,getProgress:()=>({requiresMapSelectionAfterDefeat:false}),buildBattlePartyMembers:()=>[],syncLegacyBattleStateFromMain(){},persistPartyRuntimeState(){},rebuildBattlePartyMembers(){},renderParty(){},showToast(){}};
 context.window=context;vm.runInNewContext(source,context,{filename:'permanent-farming-bridge.js'});
 return {context,runtime,get visibilityHandler(){return visibilityHandler;},get deactivationHandler(){return deactivationHandler;},get starts(){return starts;}};
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
 console.log('Permanent farming bridge empty account: '+checks+' checks passed');
})().catch(error=>{console.error(error);process.exitCode=1;});