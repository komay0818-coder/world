(function(){
'use strict';
if(typeof getPermanentPartyRuntime!=='function'||!getPermanentPartyRuntime()||!(window.permanentCharacterInventoryEnabled===true||location.pathname.endsWith('/tools/permanent-party-playtest.html')))return;
const desktop=matchMedia('(min-width: 1200px)'),modal=document.querySelector('#inventory-modal'),content=document.querySelector('#inventory-content');
const originalInventory=renderInventory,originalTooltip=renderInventoryTooltip;
let viewedCharacterId=null,pendingOperation=Promise.resolve(),saleMode=false,saleBusy=false,discardBusy=false,goldUnsubscribe=null,mobileBagCategory='equipment',mobileEquipmentCategory='wearable';
const saleSelections=new Map();
const mobileBagCategories=Object.freeze([
 {id:'equipment',label:'裝備'},
 {id:'material',label:'材料'},
 {id:'consumable',label:'消耗品'},
 {id:'other',label:'其他'}
]);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const active=()=>modal.dataset.view==='party-inventory';
const runtime=()=>getPermanentPartyRuntime();
const formatGold=value=>Number(value).toLocaleString('en-US');
function sharedGold(){try{return {ready:true,value:runtime().getSharedGold()};}catch(error){return {ready:false,value:null,error};}}
function inventorySnapshot(service=runtime()){return typeof service.getInventorySnapshot==='function'?service.getInventorySnapshot():{items:service.model.bag.items,equipmentOwners:service.model.equipmentOwners};}
function saleKey(value){return value.kind==='equipment'?'equipment:'+value.instanceId:'material:'+value.itemId;}
function saleBagIndex(snapshot=inventorySnapshot()){
 const equipment=new Map(),materials=new Map();
 for(const item of snapshot.items){
  if(item?.kind==='equipment')equipment.set(item.instanceId,item);
  else if(item?.kind==='material'){const id=ItemRarityPolicy.canonicalId(item),items=materials.get(id)||[];items.push(item);materials.set(id,items);}
 }
 return {equipment,materials,owners:snapshot.equipmentOwners};
}
function saleEligibility(entry,index=saleBagIndex()){
 if(entry?.item?.kind==='equipment'){
  const items=(entry.stackIds||[entry.item.instanceId||entry.item.id]).map(id=>index.equipment.get(id)).filter(Boolean);
  if(!items.length||items.length!==(entry.stackIds||[entry.item.instanceId||entry.item.id]).length)return {ok:false,reason:'裝備資料已變更'};
  if(items.some(item=>index.owners[item.instanceId]?.kind!=='bag'))return {ok:false,reason:'已穿戴'};
  if(items.some(InventorySalePolicy.isProtected))return {ok:false,reason:'已保護'};
  if(items.some(item=>!ItemRarityPolicy.normalizeRarity(item.rarity||item.quality)))return {ok:false,reason:'品質未確認'};
  return {ok:true,kind:'equipment',items};
 }
 if(entry?.item?.kind!=='material')return {ok:false,reason:'不可販賣'};
 const classification=ItemRarityPolicy.classifyForSale(entry.item);
 if(!classification.sellable||classification.saleGroup!=='material')return {ok:false,reason:'不可販賣'};
 const items=index.materials.get(classification.id)||[];
 if(items.some(InventorySalePolicy.isProtected))return {ok:false,reason:'已保護'};
 const quantity=items.reduce((sum,item)=>sum+(Number(item.quantity)||0),0);
 return quantity>0?{ok:true,kind:'material',itemId:classification.id,quantity,rarity:classification.rarity}:{ok:false,reason:'數量不足'};
}
function discardEligibility(entry,snapshot=inventorySnapshot()){
 const instanceId=entry?.item?.instanceId||entry?.item?.id,item=snapshot.items.find(value=>value?.kind==='equipment'&&value.instanceId===instanceId);
 if(!item||snapshot.equipmentOwners[item.instanceId]?.kind!=='bag')return {ok:false,reason:'已穿戴或不在背包'};
 if(InventorySalePolicy.isProtected(item))return {ok:false,reason:'已保護'};
 if(!InventorySalePolicy.isStarterGiftEquipment(item))return {ok:false,reason:'僅初始贈送裝備可丟棄'};
 return {ok:true,item};
}
function pruneSaleSelections(snapshot=inventorySnapshot()){
 const bag=snapshot.items;
 for(const [key,selection]of saleSelections){
  if(selection.kind==='equipment'){const item=bag.find(entry=>entry?.kind==='equipment'&&entry.instanceId===selection.instanceId);if(!item||InventorySalePolicy.isProtected(item)||snapshot.equipmentOwners[selection.instanceId]?.kind!=='bag')saleSelections.delete(key);}
  else{const classification=ItemRarityPolicy.classifyForSale(selection.itemId),available=bag.filter(item=>item?.kind==='material'&&ItemRarityPolicy.canonicalId(item)===selection.itemId&&!InventorySalePolicy.isProtected(item)).reduce((sum,item)=>sum+(Number(item.quantity)||0),0);if(!classification.sellable||classification.saleGroup!=='material'||available<selection.quantity)saleSelections.delete(key);}
 }
}
function saleSummary(){
 const snapshot=inventorySnapshot();pruneSaleSelections(snapshot);const bag=snapshot.items;let proceeds=0,equipment=0,materials=0;
 for(const selection of saleSelections.values())if(selection.kind==='equipment'){const item=bag.find(entry=>entry?.kind==='equipment'&&entry.instanceId===selection.instanceId);if(item){proceeds+=InventorySalePolicy.QUALITY_SELL_PRICES[ItemRarityPolicy.normalizeRarity(item.rarity||item.quality)];equipment++;}}else{const classification=ItemRarityPolicy.classifyForSale(selection.itemId);proceeds+=InventorySalePolicy.MATERIAL_SELL_PRICES[classification.rarity]*selection.quantity;materials+=selection.quantity;}
 return {proceeds,equipment,materials,units:equipment+materials,selections:[...saleSelections.values()].map(value=>({...value}))};
}
function selected(){const service=runtime(),ids=service.getPartyMemberIds(service.mainId);if(!ids.includes(viewedCharacterId))viewedCharacterId=ids[0];return service.view(viewedCharacterId);}
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
function mobileCategoryFor(item){
 if(item?.kind==='equipment')return 'equipment';
 if(item?.kind==='consumable')return 'consumable';
 if(item?.kind==='material'){
  const catalog=ItemRarityPolicy.get(item),materialType=String(item.materialType||catalog?.materialType||'');
  return ['page','book','divine-book','dungeon-ticket'].includes(materialType)?'other':'material';
 }
 return 'other';
}
function applyMobileBagCategory(root=content){
 root.querySelectorAll('[data-party-bag-category]').forEach(button=>{const selected=button.dataset.partyBagCategory===mobileBagCategory;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
 root.querySelectorAll('[data-party-bag-panel]').forEach(panel=>{panel.hidden=panel.dataset.partyBagPanel!==mobileBagCategory;});
 const equipmentTabs=root.querySelector('.party-equipment-category-tabs');if(equipmentTabs)equipmentTabs.hidden=mobileBagCategory!=='equipment';
 root.querySelectorAll('[data-party-equipment-category]').forEach(button=>{const selected=button.dataset.partyEquipmentCategory===mobileEquipmentCategory;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
 root.querySelectorAll('[data-party-equipment-panel]').forEach(panel=>{panel.hidden=panel.dataset.partyEquipmentPanel!==mobileEquipmentCategory;});
}
function buildMobileBagCategories(right){
 if(desktop.matches)return;
 const scroll=right.querySelector('.inventory-scroll-area');if(!scroll)return;
 const originalSections=new Map([...scroll.querySelectorAll(':scope > [data-inventory-section]')].map(section=>[section.dataset.inventorySection,section]));
 const panels=document.createElement('div');panels.className='party-mobile-category-panels';
 const equipment=document.createElement('section');equipment.className='party-mobile-category-panel';equipment.dataset.partyBagPanel='equipment';
 for(const id of ['wearable','other-equipment']){const section=originalSections.get(id);if(section){section.dataset.partyEquipmentPanel=id;equipment.appendChild(section);}}
 panels.appendChild(equipment);
 const source=originalSections.get('other-items'),cards=[...(source?.querySelectorAll('[data-inventory-item-id]')||[])];
 for(const category of mobileBagCategories.slice(1)){
  const panel=document.createElement('section');panel.className='party-mobile-category-panel';panel.dataset.partyBagPanel=category.id;
  const grid=document.createElement('div');grid.className='inventory-list inventory-grid';grid.setAttribute('role','grid');grid.setAttribute('aria-label',category.label);
  const matches=cards.filter(card=>mobileCategoryFor(inventoryTooltipEntries.get(card.dataset.inventoryItemId)?.item)===category.id);
  if(matches.length)matches.forEach(card=>grid.appendChild(card));else grid.innerHTML='<p class="empty-inventory">目前沒有物品。</p>';
  panel.appendChild(grid);panels.appendChild(panel);
 }
 const tabs=document.createElement('div');tabs.className='party-bag-category-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','背包分類');tabs.innerHTML=mobileBagCategories.map(category=>`<button type="button" role="tab" data-party-bag-category="${category.id}">${category.label}</button>`).join('');
 const equipmentTabs=document.createElement('div');equipmentTabs.className='party-equipment-category-tabs';equipmentTabs.setAttribute('role','tablist');equipmentTabs.setAttribute('aria-label','裝備資格分類');equipmentTabs.innerHTML='<button type="button" role="tab" data-party-equipment-category="wearable">可裝備</button><button type="button" role="tab" data-party-equipment-category="other-equipment">不可裝備</button>';
 scroll.replaceChildren(panels);scroll.insertAdjacentElement('beforebegin',tabs);tabs.insertAdjacentElement('afterend',equipmentTabs);applyMobileBagCategory(right);
}
function queueOperation(action){pendingOperation=pendingOperation.then(action,action);return pendingOperation;}
function operate(command,label){
 return queueOperation(async()=>{const service=runtime();try{
   await service.flush();const role=service.view(viewedCharacterId),item=command.type==='equip'?inventorySnapshot(service).items.find(entry=>entry.instanceId===command.instanceId):role.progress.equipment?.[command.slot];
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
function updateGoldDisplay(){const node=content.querySelector('[data-shared-gold]'),button=content.querySelector('[data-toggle-party-sale]'),gold=sharedGold();if(node){node.classList.toggle('unready',!gold.ready);node.innerHTML=gold.ready?`<span aria-hidden="true">●</span><b>${formatGold(gold.value)}</b>`:'<b>金幣未就緒</b>';}if(button)button.disabled=!gold.ready||saleBusy;}
function decorateSaleCards(){
 const index=saleMode?saleBagIndex():null;
 content.querySelectorAll('[data-inventory-item-id]').forEach(card=>{const previous=card.querySelector('.party-sale-badge');if(!saleMode){card.classList.remove('party-sale-disabled','party-sale-selected');card.removeAttribute('aria-disabled');delete card.dataset.partySaleEligible;previous?.remove();return;}const entry=inventoryTooltipEntries.get(card.dataset.inventoryItemId),eligible=saleEligibility(entry,index);card.classList.toggle('party-sale-disabled',!eligible.ok);card.toggleAttribute('aria-disabled',!eligible.ok);card.dataset.partySaleEligible=eligible.ok?'true':'false';
  let selected=0;if(eligible.kind==='equipment')selected=eligible.items.filter(item=>saleSelections.has('equipment:'+item.instanceId)).length;else if(eligible.kind==='material')selected=saleSelections.get('material:'+eligible.itemId)?.quantity||0;
  card.classList.toggle('party-sale-selected',selected>0);const badge=previous||document.createElement('span'),label=eligible.ok?(selected?`✓ ${selected}`:'可販賣'):eligible.reason;badge.className='party-sale-badge';if(badge.textContent!==label)badge.textContent=label;if(!previous)card.appendChild(badge);
 });
}
function saleToolbar(){const summary=saleSummary();return `<section class="party-sale-toolbar" ${saleMode?'':'hidden'}><div><b>販賣模式</b><small>已選 ${summary.units} 件物品・預計獲得 <strong>${formatGold(summary.proceeds)}</strong> 金幣</small></div><div><button type="button" data-confirm-party-sale ${summary.units&&!saleBusy?'':'disabled'}>${saleBusy?'處理中…':'確認販賣'}</button><button type="button" data-cancel-party-sale ${saleBusy?'disabled':''}>取消</button></div></section>`;}
function refreshSaleUi(){
 const current=content.querySelector('.party-sale-toolbar');if(current){const template=document.createElement('template');template.innerHTML=saleToolbar();current.replaceWith(template.content.firstElementChild);}
 const toggle=content.querySelector('[data-toggle-party-sale]');if(toggle){toggle.textContent=saleMode?'結束販賣':'販賣物品';toggle.disabled=!sharedGold().ready||saleBusy;}
 modal.classList.toggle('party-sale-mode',saleMode);decorateSaleCards();
}
function toggleSaleMode(enabled){if(saleBusy)return;saleMode=Boolean(enabled);if(!saleMode)saleSelections.clear();hideInventoryTooltip(true);refreshSaleUi();}
function selectSaleEntry(entry){
 const eligible=saleEligibility(entry);if(!eligible.ok){showToast(`不可販賣：${eligible.reason}`);return;}
 if(eligible.kind==='equipment'){
  const keys=eligible.items.map(item=>'equipment:'+item.instanceId),all=keys.every(key=>saleSelections.has(key));for(const item of eligible.items){const key='equipment:'+item.instanceId;if(all)saleSelections.delete(key);else saleSelections.set(key,{kind:'equipment',instanceId:item.instanceId});}
 }else{
  const key='material:'+eligible.itemId,current=saleSelections.get(key)?.quantity||eligible.quantity,text=window.prompt(`請輸入販賣數量（1～${eligible.quantity}；輸入 0 可取消選取）`,String(current));if(text===null)return;const quantity=Number(text);if(!Number.isSafeInteger(quantity)||quantity<0||quantity>eligible.quantity){showToast('販賣數量不正確。');return;}if(quantity===0)saleSelections.delete(key);else saleSelections.set(key,{kind:'material',itemId:eligible.itemId,quantity});
 }
 refreshSaleUi();
}
function confirmSale(){
 return queueOperation(async()=>{if(saleBusy)return {ok:false,busy:true};const summary=saleSummary();if(!summary.units)return {ok:false,empty:true};if(!window.confirm(`確定販賣 ${summary.units} 件物品，取得 ${formatGold(summary.proceeds)} 金幣嗎？`))return {ok:false,cancelled:true};saleBusy=true;refreshSaleUi();const service=runtime();try{const transactionId='inventory-sale:'+crypto.randomUUID();const result=await service.sellItems(transactionId,summary.selections);saleSelections.clear();saleMode=false;showToast(`販賣完成，獲得 ${formatGold(result.summary?.proceeds||summary.proceeds)} 金幣。`);return {ok:true,result};}catch(error){showToast(`販賣失敗：${error.message}`);return {ok:false,error};}finally{saleBusy=false;if(active())renderInventory('inventory');}});
}
function discardStarter(instanceId){
 if(discardBusy)return Promise.resolve({ok:false,busy:true});discardBusy=true;
 return queueOperation(async()=>{const service=runtime();try{
   await service.flush();const snapshot=inventorySnapshot(service),item=snapshot.items.find(entry=>entry?.kind==='equipment'&&entry.instanceId===instanceId),eligible=discardEligibility({item},snapshot);
   if(!eligible.ok)throw Error(eligible.reason);
   if(!window.confirm(`確定要永久丟棄「${item.name}」嗎？此操作不會獲得金幣或材料。`))return {ok:false,cancelled:true};
   const transactionId='inventory-discard:'+crypto.randomUUID(),result=await service.discardStarterEquipment(transactionId,instanceId);hideInventoryTooltip(true);showToast(`已丟棄：${item.name}`);return {ok:true,result};
  }catch(error){showToast(`丟棄失敗：${error.message}`);return {ok:false,error};}finally{discardBusy=false;if(active())renderInventory('inventory');}});
}
function left(){
 const service=runtime(),ids=service.getPartyMemberIds(service.mainId);
 if(!ids.includes(viewedCharacterId))viewedCharacterId=ids[0];
 const tabs=content.querySelector('.party-character-tabs'),tabHtml=Array.from({length:3},(_,i)=>{const id=ids[i],character=id?service.getCharacter(id):null;return `<button type="button" role="tab" aria-selected="${id===viewedCharacterId}" data-view-character="${escape(id||'')}" ${character?'':'disabled'}><small>隊伍 ${i+1}</small><b>${character?escape(character.name):'空位'}</b></button>`;}).join('');if(tabs.dataset.signature!==tabHtml){tabs.dataset.signature=tabHtml;tabs.innerHTML=tabHtml;}
 const role=service.view(viewedCharacterId),character=role.character,progress=role.progress,stats=getCharacterStats(progress.level,progress,character);
 const race=Object.values(factions).flat().find(r=>r.id===character.race),policies=[WarriorAdvancementPolicy,RogueAdvancementPolicy,HunterAdvancementPolicy,MageAdvancementPolicy,PriestAdvancementPolicy],advanced=policies.flatMap(p=>Object.values(p.ADVANCED_CLASSES)).find(c=>c.id===progress.advancedClass),job=advanced?.name||classes.find(c=>c.id===character.job)?.name||character.job;
 const target=content.querySelector('.party-character-scroll'),scroll=target.scrollTop,expanded=target.querySelector('details')?.open||false,signature=JSON.stringify([viewedCharacterId,character,progress.level,progress.advancedClass,progress.equipment,stats]);if(target.dataset.signature===signature)return;target.dataset.signature=signature;
 const equipment=document.createElement('div');renderEquipment(progress,{classList:{remove(){}},dataset:{}},{textContent:''},equipment);
 equipment.querySelectorAll('.equipment-frame').forEach(frame=>{const slot=Object.keys(equipmentSlots).find(s=>frame.classList.contains('slot-'+s));if(progress.equipment[slot]){frame.dataset.viewEquippedSlot=slot;frame.tabIndex=0;}});
 const fields=[['攻擊／法攻',stats.attack],['防禦',stats.defense],['暴擊率',(stats.crit*100).toFixed(1)+'%'],['閃避率',(stats.dodge*100).toFixed(1)+'%'],['命中能力',Math.round(stats.accuracy*100)+'%'],['招架率',(stats.parry*100).toFixed(1)+'%'],['攻擊速度',stats.attackSpeed.toFixed(2)],['技能冷卻速度',Math.round(stats.cooldownSpeed*100)+'%'],['生命恢復',stats.hpRegeneration??0],['額外回魔',Number(stats.manaRegenFlat||0).toFixed(1)]];
 target.innerHTML=`<section class="party-character-identity"><h3>${escape(character.name)}</h3><p>${escape(race?.name||character.race)}・${escape(job)}・Lv. ${progress.level}</p></section><div class="party-basic-stats"><span>攻擊 <b>${stats.attack}</b></span><span>防禦 <b>${stats.defense}</b></span></div><h3 class="party-equipment-title">穿戴裝備</h3>${equipment.innerHTML}<details ${expanded?'open':''}><summary>詳細屬性</summary><div class="party-detail-stats">${fields.map(([name,value])=>`<span>${name}<b>${escape(value)}</b></span>`).join('')}</div></details>`;
 target.scrollTop=scroll;modal.dataset.viewedCharacterId=viewedCharacterId;
}
renderInventory=function(view='inventory'){
 if(!['inventory','equipment','party-inventory'].includes(view)||(view==='equipment'&&!desktop.matches)){document.querySelector('#inventory-close').setAttribute('aria-label','關閉背包');return originalInventory(view==='party-inventory'?'inventory':view);}
 selected();renderViewedBag();const right=document.createElement('section');right.className='party-bag-column';right.innerHTML='<header><h3>帳號共用背包</h3><small>裝備操作套用至左側目前查看的角色</small></header>';while(content.firstChild)right.appendChild(content.firstChild);
 right.querySelector('.scrap-tools')?.remove();right.querySelector('[data-inventory-section="wearable"] h3').textContent='目前角色可裝備';
 const header=right.querySelector(':scope>header');header.innerHTML='<div><h3>帳號共用背包</h3><small>裝備操作套用至左側目前查看的角色</small></div><div class="party-bag-actions"><span class="party-shared-gold" data-shared-gold aria-live="polite"></span><button type="button" data-toggle-party-sale>'+ (saleMode?'結束販賣':'販賣物品') +'</button></div>';
 right.querySelector('.inventory-scroll-area')?.insertAdjacentHTML('beforebegin',saleToolbar());
 buildMobileBagCategories(right);
 content.replaceChildren();content.innerHTML='<section class="party-character-column"><div class="party-character-tabs" role="tablist" aria-label="查看隊伍角色"></div><div class="party-character-scroll"></div></section>';content.appendChild(right);
 modal.dataset.view='party-inventory';modal.classList.toggle('party-sale-mode',saleMode);document.querySelector('#inventory-title').textContent='角色與背包';document.querySelector('#inventory-close').setAttribute('aria-label','關閉角色與背包');left();updateGoldDisplay();decorateSaleCards();
};
renderInventoryTooltip=function(...args){if(active()&&args[2]!==true)return;originalTooltip(...args);if(!active())return;const tooltip=document.querySelector('#inventory-shared-tooltip'),entry=inventoryTooltipEntries.get(args[0]);tooltip?.querySelector('.inventory-tooltip-equipped')?.remove();tooltip?.classList.remove('has-comparison');tooltip?.classList.add('single-column');const footer=tooltip?.querySelector('footer');if(!footer)return;footer.querySelectorAll('[data-socket-item]').forEach(node=>node.remove());footer.querySelector('[data-select-scrap-stack]')?.closest('label')?.remove();if(entry?.viewedEquippedSlot){const item=entry.item,socketed=item.socketedRunes||[],capacity=Number(item.sockets)||0,runes=[...entry.availableRuneIds].map(id=>RunePolicy.RUNE_BY_ID.get(id)).filter(Boolean),buttons=socketed.length<capacity?runes.map(rune=>`<button type="button" data-party-socket-rune="${escape(rune.id)}" data-party-socket-slot="${escape(entry.viewedEquippedSlot)}" data-party-socket-item="${escape(item.instanceId||item.id)}">鑲嵌${escape(rune.name)}</button>`).join(''):'';footer.innerHTML=`<button type="button" data-unequip-slot="${escape(entry.viewedEquippedSlot)}">卸下裝備</button><section class="party-rune-actions"><b>符文插槽 ${socketed.length}/${capacity}</b>${buttons||`<small>${capacity===0?'此裝備沒有符文插槽。':socketed.length>=capacity?'符文插槽已滿。':'共用背包沒有可用符文。'}</small>`}${socketed.length?'<button type="button" disabled>拆卸符文尚未開放（費用待定）</button><button type="button" disabled>更換符文尚未開放（費用待定）</button>':''}</section>`;}else if(entry?.item?.kind==='equipment'&&!entry.wearable)footer.innerHTML=`<span class="equip-blocked">${escape(restriction(entry.item,selected()))}</span>`;const discard=discardEligibility(entry);if(discard.ok)footer.insertAdjacentHTML('beforeend',`<button type="button" data-party-discard="${escape(discard.item.instanceId)}" ${discardBusy?'disabled':''}>丟棄裝備</button>`);};
const blockedMutations='[data-socket-item],[data-select-scrap-stack],[data-select-all-scrap],[data-open-sell-confirm],[data-select-common-equipment]';
modal.addEventListener('click',event=>{if(!active())return;const equipmentCategory=event.target.closest('[data-party-equipment-category]');if(equipmentCategory){event.preventDefault();event.stopImmediatePropagation();mobileEquipmentCategory=equipmentCategory.dataset.partyEquipmentCategory;hideInventoryTooltip(true);applyMobileBagCategory();return;}const category=event.target.closest('[data-party-bag-category]');if(category){event.preventDefault();event.stopImmediatePropagation();mobileBagCategory=category.dataset.partyBagCategory;hideInventoryTooltip(true);applyMobileBagCategory();return;}const toggle=event.target.closest('[data-toggle-party-sale]');if(toggle){event.preventDefault();event.stopImmediatePropagation();toggleSaleMode(!saleMode);return;}const cancel=event.target.closest('[data-cancel-party-sale]');if(cancel){event.preventDefault();event.stopImmediatePropagation();toggleSaleMode(false);return;}const confirm=event.target.closest('[data-confirm-party-sale]');if(confirm){event.preventDefault();event.stopImmediatePropagation();confirmSale();return;}const card=saleMode&&event.target.closest('[data-inventory-item-id]');if(card){event.preventDefault();event.stopImmediatePropagation();if(!saleBusy)selectSaleEntry(inventoryTooltipEntries.get(card.dataset.inventoryItemId));}},true);
 for(const type of ['click','change'])modal.addEventListener(type,event=>{if(!active())return;const blocked=event.target.closest(blockedMutations);if(blocked){event.preventDefault();event.stopImmediatePropagation();return;}const tab=event.target.closest('[data-view-character]');if(tab){event.preventDefault();event.stopImmediatePropagation();if(tab.dataset.viewCharacter){viewedCharacterId=tab.dataset.viewCharacter;hideInventoryTooltip(true);renderInventory('inventory');}return;}const discard=event.target.closest('[data-party-discard]');if(discard){event.preventDefault();event.stopImmediatePropagation();discardStarter(discard.dataset.partyDiscard);return;}const rune=event.target.closest('[data-party-socket-rune]');if(rune){event.preventDefault();event.stopImmediatePropagation();socketViewedRune(rune.dataset.partySocketSlot,rune.dataset.partySocketItem,rune.dataset.partySocketRune);return;}const equip=event.target.closest('[data-equip-id]');if(equip){event.preventDefault();event.stopImmediatePropagation();const entry=inventoryTooltipEntries.get(equip.dataset.equipId),instanceId=entry?.stackIds?.find(id=>inventorySnapshot().equipmentOwners[id]?.kind==='bag')||entry?.item?.instanceId||equip.dataset.equipId;operate({type:'equip',characterId:viewedCharacterId,slot:equip.dataset.equipSlot,instanceId},'已穿戴');return;}const unequip=event.target.closest('[data-unequip-slot]');if(unequip){event.preventDefault();event.stopImmediatePropagation();operate({type:'unequip',characterId:viewedCharacterId,slot:unequip.dataset.unequipSlot},'已卸下');return;}const equipped=event.target.closest('[data-view-equipped-slot]');if(equipped){event.preventDefault();event.stopImmediatePropagation();const slot=equipped.dataset.viewEquippedSlot,item=runtime().view(viewedCharacterId).progress.equipment[slot],id=item.instanceId||item.id,available=new Set(inventorySnapshot().items.filter(entry=>entry.kind==='rune'&&Number(entry.quantity)>0).map(entry=>entry.id));inventoryTooltipEntries.set(id,{item,stackIds:[id],stackQuantity:1,wearable:false,equipSlots:[],availableRuneIds:available,viewedEquippedSlot:slot});renderInventoryTooltip(id,equipped,true);}},true);
desktop.addEventListener('change',()=>{menu();if(!modal.classList.contains('hidden')&&['party-inventory','inventory','equipment'].includes(modal.dataset.view))renderInventory('inventory');});
 window.PartyInventoryView={get viewedCharacterId(){return viewedCharacterId;},get saleMode(){return saleMode;},get saleSummary(){return saleSummary();},get mobileBagCategory(){return mobileBagCategory;},get mobileEquipmentCategory(){return mobileEquipmentCategory;},select(id){viewedCharacterId=id;renderInventory('inventory');},selectMobileCategory(id){if(mobileBagCategories.some(category=>category.id===id)){mobileBagCategory=id;applyMobileBagCategory();}},selectMobileEquipmentCategory(id){if(['wearable','other-equipment'].includes(id)){mobileEquipmentCategory=id;applyMobileBagCategory();}},equip(instanceId,slot){return operate({type:'equip',characterId:viewedCharacterId,slot,instanceId},'已穿戴');},unequip(slot){return operate({type:'unequip',characterId:viewedCharacterId,slot},'已卸下');},socket(slot,instanceId,runeId){return socketViewedRune(slot,instanceId,runeId);},discard:discardStarter,startSale(){toggleSaleMode(true);},cancelSale(){toggleSaleMode(false);},confirmSale,whenIdle:()=>pendingOperation};
goldUnsubscribe=runtime().onSharedGoldChanged(()=>{if(active())updateGoldDisplay();});
menu();setInterval(()=>{if(active()&&!modal.classList.contains('hidden')&&!runtime().busy)left();},500);
})();
