(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(
  node?require('./crafting-policy'):root.CraftingPolicy,
  node?require('./skill-upgrade-policy'):root.SkillUpgradePolicy,
  node?require('./black-forest-corruption-policy'):root.BlackForestCorruptionPolicy,
  node?require('./chapter-three-epic-weapon-policy'):root.ChapterThreeEpicWeaponPolicy,
  node?require('./rune-policy'):root.RunePolicy,
  node?require('./chapter-three-weapon-recipe-fragment-policy'):root.ChapterThreeWeaponRecipeFragmentPolicy,
  node?require('./pre-job-trial-policy'):root.PreJobTrialPolicy,
  node?require('./village-upgrade-policy'):root.VillageUpgradePolicy,
  node?require('./salvage-policy'):root.SalvagePolicy
 );
 if(node)module.exports=api;else root.ItemRarityPolicy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Crafting,Skills,Corruption,EpicWeapons,Runes,WeaponRecipes,Trials,Village,Salvage){
'use strict';
const RARITIES=Object.freeze(['common','uncommon','rare','epic']);
const ALIASES=Object.freeze({
 ...(Village?.LEGACY_MATERIAL_IDS||{}),
 ...(Salvage?.LEGACY_ESSENCE_IDS||{})
});
const rarityAliases=Object.freeze({
 common:'common',white:'common','白':'common','白色':'common','普通':'common',
 uncommon:'uncommon',green:'uncommon','綠':'uncommon','綠色':'uncommon','優良':'uncommon',
 rare:'rare',blue:'rare','藍':'rare','藍色':'rare','稀有':'rare',
 epic:'epic',purple:'epic','紫':'epic','紫色':'epic','史詩':'epic'
});
function normalizeRarity(value){return rarityAliases[String(value??'').trim().toLowerCase()]||null;}
const mutable=new Map();
function register(definition,{source,saleGroup=null,disposition='review-required',kind}={}){
 if(!definition?.id)return;
 const id=String(definition.id),rarity=normalizeRarity(definition.rarity??definition.quality),itemKind=String(kind||definition.kind||'unknown');
 const existing=mutable.get(id);
 if(existing){
  if(existing.rarity&&rarity&&existing.rarity!==rarity)throw Error('Conflicting rarity for '+id);
  if(!existing.rarity&&rarity)existing.rarity=rarity;
  if(!existing.kinds.includes(itemKind))existing.kinds.push(itemKind);
  if(source&&!existing.sources.includes(source))existing.sources.push(source);
  if(existing.disposition==='ready'&&disposition!=='ready')existing.disposition=disposition;
  if(existing.saleGroup&&saleGroup&&existing.saleGroup!==saleGroup)throw Error('Conflicting sale group for '+id);
  existing.saleGroup=existing.saleGroup||saleGroup;
  return;
 }
 mutable.set(id,{id,name:String(definition.name||id),kinds:[itemKind],materialType:definition.materialType||null,rarity,saleGroup,disposition,sources:source?[source]:[]});
}
for(const item of Object.values(Crafting?.MATERIALS||{}))register(item,{source:'CraftingPolicy.MATERIALS',saleGroup:'material',disposition:'ready'});
for(const item of Object.values(Skills?.MATERIALS||{}))register(item,{source:'SkillUpgradePolicy.MATERIALS',disposition:'review-required'});
for(const item of Object.values(Corruption?.MAP_MATERIALS||{}))register(item,{source:'BlackForestCorruptionPolicy.MAP_MATERIALS',disposition:'review-required'});
for(const item of Object.values(EpicWeapons?.WEAPON_CORES||{}))register(item,{source:'ChapterThreeEpicWeaponPolicy.WEAPON_CORES',disposition:'review-required'});
for(const item of Object.values(Runes?.RUNES||{}))register(item,{source:'RunePolicy.RUNES',disposition:'forbidden'});
for(const item of Object.values(Crafting?.RECIPES||{}))register(item,{source:'CraftingPolicy.RECIPES',disposition:'forbidden'});
if(WeaponRecipes?.FRAGMENT)register(WeaponRecipes.FRAGMENT,{source:'ChapterThreeWeaponRecipeFragmentPolicy.FRAGMENT',disposition:'forbidden'});
if(WeaponRecipes?.FORGING_RECIPE)register(WeaponRecipes.FORGING_RECIPE,{source:'ChapterThreeWeaponRecipeFragmentPolicy.FORGING_RECIPE',disposition:'forbidden'});
register({id:'healing-potion',kind:'consumable',name:'治癒藥水'},{source:'script potion inventory',saleGroup:'consumable',disposition:'missing-rarity'});
register({id:'mana-potion',kind:'consumable',name:'魔法藥水'},{source:'script potion inventory',saleGroup:'consumable',disposition:'missing-rarity'});
register({id:'goblin-camp-map',kind:'material',materialType:'dungeon-ticket',quality:'稀有',name:'哥布林營地地圖'},{source:'script addGoblinCampMap',disposition:'review-required'});
register({id:'divine-tome-tier-1',kind:'skill-material',materialType:'divine-book',name:'神聖法書（一階）'},{source:'PreJobTrialPolicy.openChest',disposition:'review-required'});
for(const item of Object.values(Trials?.MARKS||{}))register({...item,kind:'trial-mark'},{source:'PreJobTrialPolicy.MARKS',disposition:'review-required'});
for(const item of Trials?.PROOFS||[])register(item,{source:'PreJobTrialPolicy.PROOFS',disposition:'review-required'});
for(const item of (Trials?.CHESTS||[]).filter(Boolean))register({...item,kind:'trial-chest'},{source:'PreJobTrialPolicy.CHESTS',disposition:'review-required'});
const CATALOG=Object.freeze(Object.fromEntries([...mutable].map(([id,item])=>[id,Object.freeze({...item,kinds:Object.freeze([...item.kinds]),sources:Object.freeze([...item.sources])})])));
const UNRESOLVED_IDS=Object.freeze(Object.values(CATALOG).filter(item=>item.disposition==='missing-rarity'||item.disposition==='review-required').map(item=>item.id));
function canonicalId(value){const id=String(typeof value==='object'?value?.id||'':value||'');return ALIASES[id]||id;}
function get(value){return CATALOG[canonicalId(value)]||null;}
function getRarity(value){return get(value)?.rarity||null;}
function classifyForSale(value){
 const item=get(value);
 if(!item)return Object.freeze({sellable:false,code:'unknown-item',id:canonicalId(value),rarity:null,saleGroup:null});
 if(item.disposition==='forbidden')return Object.freeze({sellable:false,code:'forbidden-kind',id:item.id,rarity:item.rarity,saleGroup:null});
 if(item.disposition==='review-required')return Object.freeze({sellable:false,code:'review-required',id:item.id,rarity:item.rarity,saleGroup:null});
 if(!item.rarity)return Object.freeze({sellable:false,code:'missing-rarity',id:item.id,rarity:null,saleGroup:item.saleGroup});
 if(!RARITIES.includes(item.rarity)||!['material','consumable'].includes(item.saleGroup))return Object.freeze({sellable:false,code:'unsupported-item',id:item.id,rarity:item.rarity,saleGroup:item.saleGroup});
 return Object.freeze({sellable:true,code:'ready',id:item.id,rarity:item.rarity,saleGroup:item.saleGroup});
}
return Object.freeze({RARITIES,ALIASES,CATALOG,UNRESOLVED_IDS,normalizeRarity,canonicalId,get,getRarity,classifyForSale});
});
