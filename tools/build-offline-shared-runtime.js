// Generates an isolated copy of the ACTUAL online handlers, without rewriting skill formulas.
// Run with --check to reject drift after online changes. No minifier or external dependency.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.join(__dirname, '..');
const policies = ['monster-defense', 'chapter-one-level-policy', 'party-policy', 'equipment-policy', 'equipment-affix-policy',
  'armor-penetration-policy', 'conditional-damage-policy', 'critical-resource-recovery-policy',
  'direct-hit-health-recovery-policy', 'control-effect-policy', 'rune-policy',
  'chapter-three-crafted-epic-ability-policy', 'chapter-three-epic-weapon-policy',
  'chapter-two-special-equipment-policy', 'chapter-three-special-equipment-policy',
  'mana-regen-policy', 'warrior-resource-policy', 'warrior-advancement-policy',
  'assassin-energy-policy', 'assassin-offhand-policy', 'rogue-advancement-policy',
  'hunter-arrow-policy', 'hunter-advancement-policy', 'mage-advancement-policy',
  'combat-core-policy', 'priest-advancement-policy', 'skill-upgrade-policy', 'class-skill-policy'];
const names = ['getSkillKey', 'getSkillUpgradeLevel', 'getSkillEffect', 'getHunterInstinctEffect',
  'getKnownSkills', 'getSkillManaCost', 'getSkillResourceCost', 'usesManaResource', 'getPlayerAttackProfile',
  'applyDot', 'applyRogueDotEntryDamage', 'applyRoguePoison', 'applyPendingRoguePlagueSpread',
  'applyBloodVenomBleed', 'triggerRogueSymbiosisSettlement', 'processEnemyDots',
  'getEnemySkillState', 'getMageShockKey', 'getMageShockState', 'applyEnemySkillState',
  'extendElementalCollapseStatuses', 'applyDamageToMonster', 'getRuneOutgoingMultiplier',
  'triggerRuneFrenzy', 'tryApplyThornCorrosion', 'getMageSkillElement', 'applyElementalStormStatus',
  'resolveFinishedMageResonance', 'queueClassHealAfterglow', 'scheduleClassHealAfterglow',
  'useAutoSkillForMember', 'updatePartyMemberManaExhaustion',
  'updatePartyMemberResource', 'updatePartyMemberHealthRegeneration', 'performAssassinOffhandStrike',
  'processPartyMemberAttacks', 'ensureHunterCompanions', 'processHunterCompanionAttacks',
  'resolveEnemyDirectHitRecovery'];
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const normalizeGenerated = value => value.replace(/[ \t]+$/gm, '');
const script = read('script.js');
function extract(name) {
  const start = script.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing online handler ${name}`);
  const endings = /\}/g; endings.lastIndex = start;
  let match;
  while ((match = endings.exec(script))) {
    const candidate = script.slice(start, match.index + 1);
    try { new vm.Script(`(${candidate})`); return candidate; } catch (_) {}
  }
  throw new Error(`Cannot extract ${name}`);
}
const handlers = names.map(extract);
const enemyPolicies = ['wolf-den-policy','boar-woods-policy','plains-depths-policy','goblin-camp-policy','black-forest-entrance-policy',
  'black-forest-trail-policy','spider-nest-policy','blackstone-stronghold-policy','forest-altar-policy',
  'black-forest-depths-policy','redrock-wastes-policy','brokenrock-canyon-policy','bloodwar-wastes-policy',
  'skullcrusher-war-camp-policy','ancient-altar-policy','redrock-temple-policy','chapter-three-late-combat-policy','elite-affix-policy'];
const survivalNames = ['defeatPartyMember','reviveDefeatedTeammates','processPartyMemberBleed','applyControlEffectToPlayer',
  'applyBlackstoneAttackSpeedPenalty','activateBlackstoneCommand','inflictPartyMemberBleed','inflictForestAltarCorruptionFlame',
  'inflictBlackForestDot','inflictBlackForestTrailPoison','inflictBlackForestDepthsCorruption','getSpiderNestPoisonStacks',
  'inflictSpiderNestPoison','healBlackForestDepthsAlly','hasSummonedBlackstoneSpider','summonBlackstonePoisonSpider',
  'countAliveSpiderNestSummons','summonSpiderNestMonster','getRedrockEnemyState','getRedrockEnemyStateById',
  'getBrokenrockEnemyState','getBrokenrockEnemyStateById','getBloodwarEnemyState','getBloodwarEnemyStateById',
  'getLateChapterUnits','getLateChapterMonsterMultiplier','updateLateChapterThresholds','processLateChapterCombat',
  'getMonsterAttackPower','getMonsterAttackInterval','healGoblinAlly','useGoblinHealingTotem','enemyAttackTick'];
let survivalHandlers = survivalNames.map(extract).join('\n\n');
// Reads the simulation's live stop flag; the online handlers otherwise remain unchanged.
survivalHandlers = survivalHandlers.replace(/\bfighting\b/g,'env.fighting');
const survivalOutput = `// GENERATED from online survival/monster handlers.\n(function(root){function create(env){\n`+
  `const {module,globalThis,Date,Math,setTimeout,clearTimeout,battle,getProgress,getActiveMap,getEnemyDefinition,
getCharacterStats,getOnlineFacilityEffects,getPlaytestHpFloor,getBlackForestDepthsCombatContext,
aliveMonsterIndexesByAge,getWoundedEnemyIndexes,isPlayerBleeding,emitLateChapterSkill,
logBattle,logPartyDebug,playMonsterAttackAnimation,playPartyMemberHitAnimation,updateBattleUI,
removePotionItem,saveProgress,usePotion,useSharedHealingPotionForMember,syncLegacyBattleStateFromMain,
syncMainBattleMemberFromLegacy,endBattleAfterPlayerDefeat,resetPartyAfterDefeat,rebuildBattlePartyMembers,
isTimedChapterThreeVisualShowcase,isMonsterRotationPreview,battleScreen,ChapterTwoBalancePlaytestPolicy,
getEnemySkillState,getPlayerAttackProfile,applyDamageToMonster,ensureHunterCompanions,
resolveEnemyDirectHitRecovery,applyPendingRoguePlagueSpread,CombatCorePolicy,MonsterDefense,ChapterOneLevelPolicy,PartyPolicy,ClassSkillPolicy,
ControlEffectPolicy,RunePolicy,ChapterThreeCraftedEpicAbilityPolicy,ChapterThreeSpecialEquipmentPolicy,
ChapterThreeEpicWeaponPolicy,ChapterTwoSpecialEquipmentPolicy,WarriorAdvancementPolicy,RogueAdvancementPolicy,
HunterAdvancementPolicy,MageAdvancementPolicy,PriestAdvancementPolicy,WarriorResourcePolicy}=env;
const getBattleProgress=getProgress;
const PARTY_REVIVE_DELAY_MS=10000,PARTY_REVIVE_HEALTH_RATIO=.30,PARTY_AUTO_POTION_HEALTH_RATIO=.35;\n`+
  enemyPolicies.map(file=>read(file+'.js')).join('\n')+`\nconst {WolfDenPolicy,BoarWoodsPolicy,PlainsDepthsPolicy,GoblinCampPolicy,
BlackForestEntrancePolicy,BlackForestTrailPolicy,SpiderNestPolicy,BlackstoneStrongholdPolicy,ForestAltarPolicy,
BlackForestDepthsPolicy,RedrockWastesPolicy,BrokenrockCanyonPolicy,BloodwarWastesPolicy,SkullcrusherWarCampPolicy,
AncientAltarPolicy,RedrockTemplePolicy,ChapterThreeLateCombatPolicy,EliteAffixPolicy}=env;\n`+
  survivalHandlers+`\nreturn {${survivalNames.join(',')}};} const api={create};
if(typeof module==='object'&&module.exports)module.exports=api;else root.OfflineEnemyRuntime=api;
})(typeof globalThis!=='undefined'?globalThis:this);\n`;
new vm.Script(survivalOutput);
const survivalTarget=path.join(root,'offline-enemy-runtime.generated.js');
if(process.argv.includes('--check')){if(!fs.existsSync(survivalTarget)||read('offline-enemy-runtime.generated.js')!==normalizeGenerated(survivalOutput))throw new Error('Offline enemy runtime differs from online sources');}
else if(!process.argv.includes('--reference'))fs.writeFileSync(survivalTarget,normalizeGenerated(survivalOutput));
// Selection depends only on the frozen departure level/route. Preserve the
// original lookup and ordering policies, but avoid rebuilding the same lists.
const originalSelection = "getKnownSkills(member.job, member.level, progress).filter((skill) => skill.type === 'active' && skill.level <= member.level)";
const selectorIndex=names.indexOf('useAutoSkillForMember');
if(!handlers[selectorIndex].includes(originalSelection))throw new Error('Online active-skill selection changed');
handlers[selectorIndex]=handlers[selectorIndex].replace(originalSelection,'getOfflineSkillLists(member).active')
  .replace("unlocked.filter((entry) => ['light-fountain','guardian-sanctuary'].includes(entry.id))",'getOfflineSkillLists(member).support')
  .replace("RogueAdvancementPolicy.getAutoSkillPriority(progress, unlocked)\n    .filter((skill) => !['heal','light-fountain','guardian-sanctuary'].includes(skill.id) && (member.skillCooldowns[skill.id] || 0) <= now)","getOfflineSkillLists(member).attack.filter((skill)=>(member.skillCooldowns[skill.id]||0)<=now)");
const enemyTick = extract('enemyAttackTick');
function section(start, stop) {
  const from = enemyTick.indexOf(start), to = enemyTick.indexOf(stop, from);
  if (from < 0 || to < 0) throw new Error(`Incoming handler boundary changed: ${start}`);
  return enemyTick.slice(from, to);
}
// Only character reactions are extracted. Enemy map skills remain batch 3.
const incoming = `function applyOfflineIncoming(target, enemy, now) {
const enemyIndex=0, stats=target.stats;
${section('const lowHealthAssassin =', 'const redrockState =')}
const state=getEnemySkillState(0);
const rawDamage=enemy.attack*(now<state.attackDownUntil?1-state.attackDown:1);
const armorBreakMultiplier=1, spiderNestArmorMultiplier=1, piercingMultiplier=1;
${section('const parried =', 'const armorBreakMultiplier =')}
${section('const runeIronWallReduction =', 'const directDamageLeech =')}
${section("if (target.currentHp > 0 && target.currentHp / target.maxHp < .3 && target.job === 'mage'", "if (!dodged && damage > 0 && getActiveMap(progress).id === 'wolf-den'")}
defeatPartyMember(target,now);
return { damage, dodged, parried };
}`;
const skillCooldown = script.match(/^const skillCooldownMultiplier = ([^;]+);/m)?.[1];
if (!skillCooldown) throw new Error('Missing cooldown configuration');
const deadlineKeys = [...new Set([...policies.map(file=>read(file+'.js')), ...handlers, incoming].join('\n').match(/\b\w+Until\b/g))].sort();
let output = `// GENERATED by tools/build-offline-shared-runtime.js. Do not hand-edit.\n` +
  `(function(root){\nfunction create(env){\n` +
  `const {module,globalThis,Date,Math,setTimeout,clearTimeout,document,fighting,offlinePartyPreviewPausedAt,
getProgress,getActiveCharacter,getActiveMap,getMainBattleMember,getCharacterStats,getEnemyDefinition,
aliveEnemyIndexesByAge,aliveMonsterIndexesByAge,getOnlineFacilityEffects,getLateChapterUnits,
updateLateChapterThresholds,getBlackForestDepthsCombatContext,getRedrockEnemyState,getBrokenrockEnemyState,
getBloodwarEnemyState,BlackForestEntrancePolicy,BlackForestTrailPolicy,SpiderNestPolicy,
BlackstoneStrongholdPolicy,ForestAltarPolicy,BlackForestDepthsPolicy,RedrockWastesPolicy,BloodwarWastesPolicy,
ChapterThreeLateCombatPolicy,SkullcrusherWarCampPolicy,PlainsDepthsPolicy,getMonsterAttackPower,getPlaytestHpFloor,effectiveEquipmentStat,
logBattle,logPartyDebug,updateBattleUI,showEnemyDamage,captureBattleTargetAnchor,captureBattleAttackerAnchor,
captureBattleAllyAnchor,playPartyMemberCombatAnimation,playBattleSkillEffect,playCompanionAttackAnimation,
syncLegacyBattleStateFromMain,syncMainBattleMemberFromLegacy,useManaPotion,useSharedManaPotionForMember,
defeatPartyMember,battle}=env;\n` +
  policies.map(file => `// Source: ${file}.js\n${read(file + '.js')}`).join('\n') +
  `\nenv.preparePolicies?.(env);\n` +
  `const {MonsterDefense,ChapterOneLevelPolicy,PartyPolicy,EquipmentPolicy,EquipmentAffixPolicy,
ArmorPenetrationPolicy,ConditionalDamagePolicy,CriticalResourceRecoveryPolicy,DirectHitHealthRecoveryPolicy,
ControlEffectPolicy,RunePolicy,ChapterThreeCraftedEpicAbilityPolicy,ChapterThreeEpicWeaponPolicy,
ChapterTwoSpecialEquipmentPolicy,ChapterThreeSpecialEquipmentPolicy,ManaRegenPolicy,WarriorResourcePolicy,
WarriorAdvancementPolicy,AssassinEnergyPolicy,AssassinOffhandPolicy,RogueAdvancementPolicy,HunterArrowPolicy,
HunterAdvancementPolicy,MageAdvancementPolicy,CombatCorePolicy,PriestAdvancementPolicy,SkillUpgradePolicy,
ClassSkillPolicy}=env;\n` +
  `\nconst skillCooldownMultiplier = ${skillCooldown};\n` +
  `const skillProgression=Object.fromEntries(Object.keys(ClassSkillPolicy.SKILLS).map(job=>[job,ClassSkillPolicy.getSkills(job).map(entry=>({...entry,power:entry.levels[0]?.power,targets:entry.levels[0]?.targets||entry.targets}))]));\n` +
  handlers.join('\n\n') + '\n' + incoming + `
// Only immutable departure lookups are memoized; original implementations above
// remain the source of every cached value. Each create() owns fresh caches.
const originalKnownSkills=getKnownSkills, knownSkillsCache=new WeakMap();
getKnownSkills=function(job,level,progress=getProgress()){
  let cache=knownSkillsCache.get(progress);if(!cache){cache=new Map();knownSkillsCache.set(progress,cache);}
  const key=job+':'+level;if(!cache.has(key))cache.set(key,originalKnownSkills(job,level,progress));return cache.get(key);
};
const originalSkillEffect=getSkillEffect, skillEffectCache=new WeakMap();
getSkillEffect=function(progress,job,skill){
  let cache=skillEffectCache.get(progress);if(!cache){cache=new Map();skillEffectCache.set(progress,cache);}
  const key=job+':'+skill.id;if(!cache.has(key))cache.set(key,originalSkillEffect(progress,job,skill));return cache.get(key);
};
const skillListCache=new WeakMap();
function getOfflineSkillLists(member){
  let lists=skillListCache.get(member.progress);if(lists)return lists;
  const active=getKnownSkills(member.job,member.level,member.progress).filter(s=>s.type==='active'&&s.level<=member.level);
  lists={active,support:active.filter(s=>s.id==='light-fountain'||s.id==='guardian-sanctuary'),
    attack:RogueAdvancementPolicy.getAutoSkillPriority(member.progress,active).filter(s=>!['heal','light-fountain','guardian-sanctuary'].includes(s.id))};
  skillListCache.set(member.progress,lists);return lists;
}
\nreturn {${names.join(',')},applyOfflineIncoming, env};\n}\n` +
  `function getMemberDeadline(member,now){let next=Infinity,value;${deadlineKeys.map(key=>`value=member.${key};if(typeof value==='number'&&value>now&&value<next)next=value;`).join('')}return next;}\n` +
  `const api=Object.freeze({create,getMemberDeadline,deadlineKeys:${JSON.stringify(deadlineKeys)},handlers:${JSON.stringify(names)},policies:${JSON.stringify(policies)}});\n` +
  `if(typeof module==='object'&&module.exports)module.exports=api;else root.OfflineSharedRuntime=api;\n})(typeof globalThis!=='undefined'?globalThis:this);\n`;
const reference=process.argv.includes('--reference');
if(reference){
  output=output.replace(handlers[selectorIndex],extract('useAutoSkillForMember'));
  const from=output.indexOf('// Only immutable departure lookups'),to=output.indexOf('return {getSkillKey',from);
  if(from<0||to<0)throw new Error('Missing memoization boundaries');
  output=output.slice(0,from)+output.slice(to);
  fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
}
new vm.Script(output);
const target = path.join(root, reference?'tmp/offline-shared-runtime-before.js':'offline-shared-runtime.generated.js');
output=normalizeGenerated(output);
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || read('offline-shared-runtime.generated.js') !== output) {
    console.error('Offline runtime differs from online sources; regenerate before testing.'); process.exit(1);
  }
  console.log('offline shared runtime: online sources match');
} else { fs.writeFileSync(target, output); console.log(`Generated ${names.length} handlers, ${policies.length} policies (${Buffer.byteLength(output)} bytes).`); }
