(function(){
'use strict';
if(typeof getPermanentPartyRuntime!=='function'||!getPermanentPartyRuntime()||!(window.permanentCharacterInventoryEnabled===true||location.pathname.endsWith('/tools/permanent-party-playtest.html')))return;
const desktop=matchMedia('(min-width: 1200px)'),modal=document.querySelector('#inventory-modal'),content=document.querySelector('#inventory-content');
const originalInventory=renderInventory,originalTooltip=renderInventoryTooltip;
let viewedCharacterId=null,pendingOperation=Promise.resolve();
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const active=()=>desktop.matches&&modal.dataset.view==='party-inventory';
const runtime=()=>getPermanentPartyRuntime();
function selected(){const service=runtime(),ids=service.model.parties[service.mainId].memberIds;if(!ids.includes(viewedCharacterId))viewedCharacterId=ids[0];return service.view(viewedCharacterId);}
function restriction(item,role,slot){
 if(item?.kind!=='equipment')return '這不是可穿戴裝備。';
 if(item.durability!==undefined&&Number(item.durability)<=0)return '裝備耐久為 0，無法穿戴。';
 if(Number(item.requiredLevel||0)>Number(role.progress.level))return `需要 Lv. ${Number(item.requiredLevel)}，目前為 Lv. ${role.progress.level}。`;
 const slots=getCompatibleEquipSlots(item,role.character,role.progress);
 if(!slots.length)return `「${classes.find(c=>c.id===role.character.job)?.name||role.character.job}」無法穿戴這件裝備。`;
 if(slot&&!slots.includes(slot))return '這件裝備不能穿戴在該欄位。';
 return '';
}
function renderViewedBag(){
 const role=selected(),normalCharacter=getActiveCharacter,normalProgress=getProgress;
 getActiveCharacter=()=>role.character;getProgress=()=>runtime().getProgress(viewedCharacterId);
 try{originalInventory('inventory');}finally{getActiveCharacter=normalCharacter;getProgress=normalProgress;}
}
function queueOperation(action){pendingOperation=pendingOperation.then(action,action);return pendingOperation;}
function operate(command,label){
 return queueOperation(async()=>{const service=runtime();try{
   await service.flush();const role=service.view(viewedCharacterId),item=command.type==='equip'?service.model.bag.items.find(entry=>entry.instanceId===command.instanceId):role.progress.equipment?.[command.slot];
   if(command.characterId!==viewedCharacterId)throw Error('查看角色已變更，請重新操作。');
   if(!item)throw Error(command.type==='equip'?'裝備已不在共用背包中。':'該欄位目前沒有裝備。');
   const blocked=command.type==='equip'?restriction(item,role,command.slot):'';if(blocked)throw Error(blocked);
   service.command(command);await service.flush();hideInventoryTooltip(true);renderInventory('inventory');showToast(`${label}：${item.name}`);return {ok:true,item};
  }catch(error){hideInventoryTooltip(true);if(!service.failure)renderInventory('inventory');showToast(`操作失敗：${error.message}`);return {ok:false,error};}});
}
function socketViewedRune(slot,instanceId,runeId){
 return queueOperation(async()=>{const service=runtime();try{
   await service.flush();const role=service.view(viewedCharacterId),equipped=role.progress.equipment?.[slot];
   if(!equipped||equipped.instanceId!==instanceId)throw Error('裝備已變更，請重新選擇。');
   if((equipped.socketedRunes||[]).length>=Number(equipped.sockets||0))throw Error('符文插槽已滿。');
   if(!RunePolicy.RUNE_BY_ID.has(runeId))throw Error('未知的符文。');
   const progress=service.getProgress(viewedCharacterId),result=RunePolicy.socketRune(progress,instanceId,runeId);
   if(!result.ok)throw Error(result.reason==='missing'?'共用背包沒有這顆符文。':result.reason==='full'?'符文插槽已滿。':'無法鑲嵌符文。');
   service.saveProgress(viewedCharacterId,progress);await service.flush();hideInventoryTooltip(true);renderInventory('inventory');showToast(`已鑲嵌：${result.rune.name}`);return {ok:true,item:result.item,rune:result.rune};
  }catch(error){hideInventoryTooltip(true);if(!service.failure)renderInventory('inventory');showToast(`鑲嵌失敗：${error.message}`);return {ok:false,error};}});
}
function menu(){const bag=document.querySelector('[data-menu-action="背包"]'),equipment=document.querySelector('[data-menu-action="裝備"]');if(!bag||!equipment)return;equipment.hidden=desktop.matches;bag.querySelector('b').textContent=desktop.matches?'角色與背包':'背包';bag.querySelector('small').textContent=desktop.matches?'角色・道具':'道具';}
function left(){
 const service=runtime(),model=service.model,ids=model.parties[service.mainId].memberIds;
 if(!ids.includes(viewedCharacterId))viewedCharacterId=ids[0];
 const tabs=content.querySelector('.party-character-tabs'),tabHtml=Array.from({length:3},(_,i)=>{const id=ids[i],role=model.characters[id];return `<button type="button" role="tab" aria-selected="${id===viewedCharacterId}" data-view-character="${escape(id||'')}" ${role?'':'disabled'}><small>隊伍 ${i+1}</small><b>${role?escape(role.character.name):'空位'}</b></button>`;}).join('');if(tabs.dataset.signature!==tabHtml){tabs.dataset.signature=tabHtml;tabs.innerHTML=tabHtml;}
 const role=service.view(viewedCharacterId),character=role.character,progress=role.progress,stats=getCharacterStats(progress.level,progress,character);
 const race=Object.values(factions).flat().find(r=>r.id===character.race),policies=[WarriorAdvancementPolicy,RogueAdvancementPolicy,HunterAdvancementPolicy,MageAdvancementPolicy,PriestAdvancementPolicy],advanced=policies.flatMap(p=>Object.values(p.ADVANCED_CLASSES)).find(c=>c.id===progress.advancedClass),job=advanced?.name||classes.find(c=>c.id===character.job)?.name||character.job;
 const target=content.querySelector('.party-character-scroll'),scroll=target.scrollTop,expanded=target.querySelector('details')?.open||false,signature=JSON.stringify([viewedCharacterId,character,progress,stats]);if(target.dataset.signature===signature)return;target.dataset.signature=signature;
 const equipment=document.createElement('div');renderEquipment(progress,{classList:{remove(){}},dataset:{}},{textContent:''},equipment);
 equipment.querySelectorAll('.equipment-frame').forEach(frame=>{const slot=Object.keys(equipmentSlots).find(s=>frame.classList.contains('slot-'+s));if(progress.equipment[slot]){frame.dataset.viewEquippedSlot=slot;frame.tabIndex=0;}});
 const fields=[['攻擊／法攻',stats.attack],['防禦',stats.defense],['暴擊率',(stats.crit*100).toFixed(1)+'%'],['閃避率',(stats.dodge*100).toFixed(1)+'%'],['命中能力',Math.round(stats.accuracy*100)+'%'],['招架率',(stats.parry*100).toFixed(1)+'%'],['攻擊速度',stats.attackSpeed.toFixed(2)],['技能冷卻速度',Math.round(stats.cooldownSpeed*100)+'%'],['生命恢復',stats.hpRegeneration??0],['額外回魔',Number(stats.manaRegenFlat||0).toFixed(1)]];
 target.innerHTML=`<section class="party-character-identity"><h3>${escape(character.name)}</h3><p>${escape(race?.name||character.race)}・${escape(job)}・Lv. ${progress.level}</p></section><div class="party-basic-stats"><span>攻擊 <b>${stats.attack}</b></span><span>防禦 <b>${stats.defense}</b></span></div><h3 class="party-equipment-title">穿戴裝備</h3>${equipment.innerHTML}<details ${expanded?'open':''}><summary>詳細屬性</summary><div class="party-detail-stats">${fields.map(([name,value])=>`<span>${name}<b>${escape(value)}</b></span>`).join('')}</div></details>`;
 target.scrollTop=scroll;modal.dataset.viewedCharacterId=viewedCharacterId;
}
renderInventory=function(view='inventory'){
 if(!desktop.matches||!['inventory','equipment','party-inventory'].includes(view)){document.querySelector('#inventory-close').setAttribute('aria-label','關閉背包');return originalInventory(view==='party-inventory'?'inventory':view);}
 selected();renderViewedBag();const right=document.createElement('section');right.className='party-bag-column';right.innerHTML='<header><h3>帳號共用背包</h3><small>裝備操作套用至左側目前查看的角色</small></header>'+content.innerHTML;
 right.querySelector('.scrap-tools')?.remove();right.querySelector('[data-inventory-section="wearable"] h3').textContent='目前角色可裝備';
 content.replaceChildren();content.innerHTML='<section class="party-character-column"><div class="party-character-tabs" role="tablist" aria-label="查看隊伍角色"></div><div class="party-character-scroll"></div></section>';content.appendChild(right);
 modal.dataset.view='party-inventory';document.querySelector('#inventory-title').textContent='角色與背包';document.querySelector('#inventory-close').setAttribute('aria-label','關閉角色與背包');left();
};
renderInventoryTooltip=function(...args){if(active()&&args[2]!==true)return;originalTooltip(...args);if(!active())return;const tooltip=document.querySelector('#inventory-shared-tooltip'),entry=inventoryTooltipEntries.get(args[0]);tooltip?.querySelector('.inventory-tooltip-equipped')?.remove();tooltip?.classList.remove('has-comparison');tooltip?.classList.add('single-column');const footer=tooltip?.querySelector('footer');if(!footer)return;footer.querySelectorAll('[data-socket-item]').forEach(node=>node.remove());footer.querySelector('[data-select-scrap-stack]')?.closest('label')?.remove();if(entry?.viewedEquippedSlot){const item=entry.item,socketed=item.socketedRunes||[],capacity=Number(item.sockets)||0,runes=[...entry.availableRuneIds].map(id=>RunePolicy.RUNE_BY_ID.get(id)).filter(Boolean),buttons=socketed.length<capacity?runes.map(rune=>`<button type="button" data-party-socket-rune="${escape(rune.id)}" data-party-socket-slot="${escape(entry.viewedEquippedSlot)}" data-party-socket-item="${escape(item.instanceId||item.id)}">鑲嵌${escape(rune.name)}</button>`).join(''):'';footer.innerHTML=`<button type="button" data-unequip-slot="${escape(entry.viewedEquippedSlot)}">卸下裝備</button><section class="party-rune-actions"><b>符文插槽 ${socketed.length}/${capacity}</b>${buttons||`<small>${capacity===0?'此裝備沒有符文插槽。':socketed.length>=capacity?'符文插槽已滿。':'共用背包沒有可用符文。'}</small>`}${socketed.length?'<button type="button" disabled>拆卸符文尚未開放（費用待定）</button><button type="button" disabled>更換符文尚未開放（費用待定）</button>':''}</section>`;}else if(entry?.item?.kind==='equipment'&&!entry.wearable)footer.innerHTML=`<span class="equip-blocked">${escape(restriction(entry.item,selected()))}</span>`;};
const blockedMutations='[data-socket-item],[data-select-scrap-stack],[data-select-all-scrap],[data-open-sell-confirm],[data-select-common-equipment]';
for(const type of ['click','change'])modal.addEventListener(type,event=>{if(!active())return;const blocked=event.target.closest(blockedMutations);if(blocked){event.preventDefault();event.stopImmediatePropagation();return;}const tab=event.target.closest('[data-view-character]');if(tab){event.preventDefault();event.stopImmediatePropagation();if(tab.dataset.viewCharacter){viewedCharacterId=tab.dataset.viewCharacter;hideInventoryTooltip(true);renderInventory('inventory');}return;}const rune=event.target.closest('[data-party-socket-rune]');if(rune){event.preventDefault();event.stopImmediatePropagation();socketViewedRune(rune.dataset.partySocketSlot,rune.dataset.partySocketItem,rune.dataset.partySocketRune);return;}const equip=event.target.closest('[data-equip-id]');if(equip){event.preventDefault();event.stopImmediatePropagation();const entry=inventoryTooltipEntries.get(equip.dataset.equipId),instanceId=entry?.stackIds?.find(id=>runtime().model.equipmentOwners[id]?.kind==='bag')||entry?.item?.instanceId||equip.dataset.equipId;operate({type:'equip',characterId:viewedCharacterId,slot:equip.dataset.equipSlot,instanceId},'已穿戴');return;}const unequip=event.target.closest('[data-unequip-slot]');if(unequip){event.preventDefault();event.stopImmediatePropagation();operate({type:'unequip',characterId:viewedCharacterId,slot:unequip.dataset.unequipSlot},'已卸下');return;}const equipped=event.target.closest('[data-view-equipped-slot]');if(equipped){event.preventDefault();event.stopImmediatePropagation();const slot=equipped.dataset.viewEquippedSlot,item=runtime().view(viewedCharacterId).progress.equipment[slot],id=item.instanceId||item.id,available=new Set(runtime().model.bag.items.filter(entry=>entry.kind==='rune'&&Number(entry.quantity)>0).map(entry=>entry.id));inventoryTooltipEntries.set(id,{item,stackIds:[id],stackQuantity:1,wearable:false,equipSlots:[],availableRuneIds:available,viewedEquippedSlot:slot});renderInventoryTooltip(id,equipped,true);}},true);
desktop.addEventListener('change',()=>{menu();if(!modal.classList.contains('hidden')&&['party-inventory','inventory','equipment'].includes(modal.dataset.view))renderInventory('inventory');});
window.PartyInventoryView={get viewedCharacterId(){return viewedCharacterId;},select(id){viewedCharacterId=id;renderInventory('inventory');},equip(instanceId,slot){return operate({type:'equip',characterId:viewedCharacterId,slot,instanceId},'已穿戴');},unequip(slot){return operate({type:'unequip',characterId:viewedCharacterId,slot},'已卸下');},socket(slot,instanceId,runeId){return socketViewedRune(slot,instanceId,runeId);},whenIdle:()=>pendingOperation};
menu();setInterval(()=>{if(active()&&!modal.classList.contains('hidden')&&!runtime().busy)left();},500);
})();
