const assert = require('assert');
const policy = require('../equipment-policy.js');

const inventory = [
  { id: 'healing-potion', kind: 'consumable' },
  { id: 'goblin-camp-map', kind: 'material' },
  { id: 'starter-warrior-weapon-0', kind: 'equipment', name: '新兵鐵劍' },
  { id: 'short-iron-sword', kind: 'equipment', name: '短鐵劍' },
  { id: 'guard-plate-armor', kind: 'equipment', name: '守衛鎧甲' },
  { id: 'goblin-sword-123', kind: 'equipment', name: '哥布林短劍' },
  { id: 'altar-set-456', kind: 'equipment', name: '暮衛戰刃' }
];

assert.equal(policy.isRecruitEquipment(inventory[2]), true, 'starter equipment is retained');
assert.equal(policy.isRecruitEquipment(inventory[3]), false, 'planned catalog weapon is not classified as starter gear');
assert.deepEqual(policy.removeLegacyEquipmentFromInventory(inventory).map((item) => item.id), [
  'healing-potion',
  'goblin-camp-map',
  'starter-warrior-weapon-0',
  'short-iron-sword',
  'guard-plate-armor'
], 'materials, consumables, starter gear and planned catalog equipment survive cleanup');
assert.equal(policy.isPreservedEquipment(inventory[3]), true, 'planned weapons are retained');
assert.equal(policy.isPreservedEquipment(inventory[4]), true, 'planned armor is retained');
assert.equal(policy.isPreservedEquipment(inventory[5]), false, 'legacy monster equipment is removed');

const offhands = policy.OFFHAND_CATALOG;
assert.deepEqual(policy.getEquipSlots(offhands.woodenRoundShield, 'warrior'), ['offhand'], 'warriors can equip wooden round shields');
assert.deepEqual(policy.getEquipSlots(offhands.woodenRoundShield, 'hunter'), [], 'hunters cannot equip wooden round shields');
assert.deepEqual(policy.getEquipSlots(offhands.roughQuiver, 'hunter'), ['offhand'], 'hunters can equip rough quivers');
assert.deepEqual(policy.getEquipSlots(offhands.beginnerSpellbook, 'mage'), ['offhand'], 'mages can equip beginner spellbooks');
assert.deepEqual(policy.getEquipSlots(offhands.beginnerSpellbook, 'priest'), ['offhand'], 'priests can equip beginner spellbooks');
assert.deepEqual(policy.getEquipSlots(offhands.beginnerSpellbook, 'warrior'), [], 'warriors cannot equip beginner spellbooks');
assert.equal(policy.getPlainsDepthsOffhandDropRate({}), .03, 'normal plains-depths monsters have a 3% offhand drop rate');
assert.equal(policy.getPlainsDepthsOffhandDropRate({ isElite: true }), .08, 'elite plains-depths monsters have an 8% offhand drop rate');
assert.equal(policy.getPlainsDepthsOffhandDropRate({ isBoss: true }), .15, 'boss plains-depths monsters have a 15% offhand drop rate');
const sturdyShield = policy.createRandomOffhandDrop(0, 0, 'shield-test');
const parryShield = policy.createRandomOffhandDrop(0, .9, 'parry-test');
const expandedQuiver = policy.createRandomOffhandDrop(.4, 0, 'quiver-test');
const quickQuiver = policy.createRandomOffhandDrop(.4, .9, 'quick-test');
const magicBook = policy.createRandomOffhandDrop(.8, 0, 'book-test');
const regenBook = policy.createRandomOffhandDrop(.8, .9, 'regen-test');
assert.equal(sturdyShield.damageReduction, .03, 'wooden round shield can roll 3% damage reduction');
assert.equal(parryShield.parry, .03, 'wooden round shield can roll 3% parry');
assert.deepEqual([expandedQuiver.maxArrows, expandedQuiver.arrowRecoveryInterval], [12, 1000], 'expanded rough quiver holds twelve arrows');
assert.deepEqual([quickQuiver.maxArrows, quickQuiver.arrowRecoverySpeedBonus], [10, .10], 'quick rough quiver starts at ten arrows and gains 10% recovery speed');
assert.equal(magicBook.magicDamageBonus, .05, 'beginner spellbook can roll 5% magic damage');
assert.equal(regenBook.manaRegenFlat, 3, 'beginner spellbook can roll 3 mana per second');
assert.equal(policy.applyMagicDamageBonus(100, magicBook.magicDamageBonus), 105, 'the magic damage affix increases magic damage by 5%');
assert.equal(policy.isPreservedEquipment(sturdyShield), true, 'random offhand variants survive save cleanup');

const weapons = policy.WEAPON_CATALOG;
assert.deepEqual([weapons.shortIronSword.attackMin, weapons.shortIronSword.attackMax, weapons.shortIronSword.attackSpeed], [8, 11, 1.40], 'short iron sword stats match the design');
assert.deepEqual([weapons.knightLongsword.attackMin, weapons.knightLongsword.attackMax, weapons.knightLongsword.attackSpeed], [10, 14, 1.20], 'knight longsword stats match the design');
assert.deepEqual([weapons.mercenaryGreatsword.attackMin, weapons.mercenaryGreatsword.attackMax, weapons.mercenaryGreatsword.attackSpeed], [18, 24, .80], 'mercenary greatsword stats match the design');
assert.deepEqual([weapons.giantIronSword.attackMin, weapons.giantIronSword.attackMax, weapons.giantIronSword.attackSpeed], [21, 28, .65], 'giant iron sword stats match the design');
assert.equal(policy.rollWeaponAttack(weapons.shortIronSword, 0), 8, 'minimum roll uses the lower attack bound');
assert.equal(policy.rollWeaponAttack(weapons.shortIronSword, .999), 11, 'maximum roll uses the upper attack bound');
assert.equal(policy.getAttacksPerSecond(weapons.giantIronSword, 1), .65, 'weapon speed is measured in attacks per second');

assert.deepEqual([weapons.loggingHatchet.attackMin, weapons.loggingHatchet.attackMax, weapons.loggingHatchet.attackSpeed], [9, 12, 1.10], 'logging hatchet stats match the design');
assert.deepEqual([weapons.warriorHatchet.attackMin, weapons.warriorHatchet.attackMax, weapons.warriorHatchet.attackSpeed], [11, 15, .95], 'warrior hatchet stats match the design');
assert.deepEqual([weapons.battleGreataxe.attackMin, weapons.battleGreataxe.attackMax, weapons.battleGreataxe.attackSpeed], [20, 26, .70], 'battle greataxe stats match the design');
assert.deepEqual([weapons.rockbreakerGreataxe.attackMin, weapons.rockbreakerGreataxe.attackMax, weapons.rockbreakerGreataxe.attackSpeed], [23, 30, .55], 'rockbreaker greataxe stats match the design');
assert.deepEqual(policy.getEquipSlots(weapons.shortIronSword, 'assassin'), ['weapon', 'offhand'], 'assassins can equip one-handed swords in either hand');
assert.deepEqual(policy.getEquipSlots(weapons.loggingHatchet, 'assassin'), ['weapon', 'offhand'], 'assassins can equip one-handed axes in either hand');
assert.deepEqual(policy.getEquipSlots(weapons.battleGreataxe, 'assassin'), [], 'assassins cannot equip two-handed axes');
assert.deepEqual(policy.getEquipSlots(weapons.giantIronSword, 'warrior'), ['weapon'], 'warriors equip two-handed weapons in the main-hand slot');

assert.deepEqual([weapons.hunterShortbow.attackMin, weapons.hunterShortbow.attackMax, weapons.hunterShortbow.attackSpeed], [9, 13, 1.10], 'hunter shortbow stats match the design');
assert.deepEqual([weapons.longHuntingBow.attackMin, weapons.longHuntingBow.attackMax, weapons.longHuntingBow.attackSpeed], [11, 15, .90], 'long hunting bow stats match the design');
assert.deepEqual([weapons.rustyDagger.attackMin, weapons.rustyDagger.attackMax, weapons.rustyDagger.attackSpeed], [6, 9, 1.80], 'rusty dagger stats match the design');
assert.deepEqual([weapons.assassinShortblade.attackMin, weapons.assassinShortblade.attackMax, weapons.assassinShortblade.attackSpeed], [8, 11, 1.60], 'assassin shortblade stats match the design');
assert.deepEqual([weapons.apprenticeStaff.attackMin, weapons.apprenticeStaff.attackMax, weapons.apprenticeStaff.attackSpeed], [10, 15, 1.00], 'apprentice staff stats match the design');
assert.deepEqual([weapons.arcaneStaff.attackMin, weapons.arcaneStaff.attackMax, weapons.arcaneStaff.attackSpeed], [13, 18, .85], 'arcane staff stats match the design');
assert.deepEqual(policy.getEquipSlots(weapons.hunterShortbow, 'hunter'), ['weapon'], 'hunters equip bows in the main-hand slot');
assert.deepEqual(policy.getEquipSlots(weapons.rustyDagger, 'assassin'), ['weapon', 'offhand'], 'assassins can equip daggers in either hand');
assert.deepEqual(policy.getEquipSlots(weapons.apprenticeStaff, 'mage'), ['weapon'], 'mages equip staves in the main-hand slot');
assert.deepEqual(policy.getEquipSlots(weapons.apprenticeStaff, 'priest'), [], 'priests cannot equip mage staves');

const plateArmor = { id: 'plate-test', kind: 'equipment', slot: 'armor', armorType: 'heavy' };
const leatherArmor = { id: 'leather-test', kind: 'equipment', slot: 'armor', armorType: 'leather' };
const hideArmor = { id: 'hide-test', kind: 'equipment', slot: 'boots', armorType: 'hide' };
const clothArmor = { id: 'cloth-test', kind: 'equipment', slot: 'armor', armorType: 'cloth' };
const legacyRestrictedLeather = { id: 'legacy-leather-test', kind: 'equipment', slot: 'boots', armorType: 'hide', allowedJobs: ['warrior', 'hunter'] };
assert.equal(policy.getArmorCategory(plateArmor), 'plate', 'heavy armor is normalized as plate armor');
assert.equal(policy.getArmorCategory(hideArmor), 'leather', 'hide armor is normalized as leather armor');
assert.deepEqual(policy.getEquipSlots(plateArmor, 'warrior'), ['armor'], 'warriors can equip plate armor');
assert.deepEqual(policy.getEquipSlots(plateArmor, 'hunter'), [], 'hunters cannot equip plate armor');
assert.deepEqual(policy.getEquipSlots(leatherArmor, 'hunter'), ['armor'], 'hunters can equip leather armor');
assert.deepEqual(policy.getEquipSlots(leatherArmor, 'assassin'), ['armor'], 'assassins can equip leather armor');
assert.deepEqual(policy.getEquipSlots(leatherArmor, 'warrior'), [], 'warriors cannot equip leather armor');
assert.deepEqual(policy.getEquipSlots(clothArmor, 'mage'), ['armor'], 'mages can equip cloth armor');
assert.deepEqual(policy.getEquipSlots(clothArmor, 'priest'), ['armor'], 'priests can equip cloth armor');
assert.deepEqual(policy.getEquipSlots(clothArmor, 'assassin'), [], 'assassins cannot equip cloth armor');
assert.deepEqual(policy.getEquipSlots(legacyRestrictedLeather, 'assassin'), ['boots'], 'armor category rules replace legacy per-item job restrictions');

const armor = policy.ARMOR_CATALOG;
assert.deepEqual([armor.recruitPlateArmor.defense, armor.recruitPlateArmor.hp], [8, 20], 'recruit plate armor stats match the design');
assert.deepEqual([armor.guardPlateArmor.defense, armor.guardPlateArmor.hp], [5, 50], 'guard plate armor stats match the design');
assert.equal(armor.recruitPlateArmor.image.split('?')[0], 'assets/recruit-plate-armor.png', 'recruit plate armor uses its dedicated image');
assert.equal(armor.guardPlateArmor.image.split('?')[0], 'assets/guard-plate-armor.png', 'guard plate armor uses its dedicated image');
assert.deepEqual([armor.leatherVest.defense, armor.leatherVest.dodge], [4, .03], 'leather vest stats match the design');
assert.deepEqual([armor.huntingLeatherArmor.defense, armor.huntingLeatherArmor.accuracy], [3, .04], 'hunting leather armor stats match the design');
assert.equal(armor.leatherVest.image.split('?')[0], 'assets/leather-vest.png', 'leather vest uses its dedicated image');
assert.equal(armor.huntingLeatherArmor.image.split('?')[0], 'assets/hunting-leather-armor.png', 'hunting leather armor uses its dedicated image');
assert.deepEqual([armor.apprenticeRobe.defense, armor.apprenticeRobe.mana], [3, 50], 'apprentice robe stats match the design');
assert.deepEqual([armor.novicePriestRobe.defense, armor.novicePriestRobe.mana, armor.novicePriestRobe.manaRegenFlat], [2, 15, 1], 'novice priest robe stats match the design');
assert.equal(armor.apprenticeRobe.name, '新兵布衣', 'the first chapter recruit cloth armor uses its requested name');
assert.equal(armor.novicePriestRobe.name, '守衛法袍', 'the first chapter guard cloth armor uses its requested name');
assert.equal(armor.apprenticeRobe.image.split('?')[0], 'assets/recruit-cloth-robe.png', 'the recruit cloth armor uses the first supplied image');
assert.equal(armor.novicePriestRobe.image.split('?')[0], 'assets/guard-cloth-robe.png', 'the guard cloth armor uses the second supplied image');
assert.deepEqual(policy.getEquipSlots(armor.recruitPlateArmor, 'warrior'), ['armor'], 'warriors can equip recruit plate armor');
assert.deepEqual(policy.getEquipSlots(armor.recruitPlateArmor, 'hunter'), [], 'hunters cannot equip recruit plate armor');
assert.deepEqual(policy.getEquipSlots(armor.leatherVest, 'hunter'), ['armor'], 'hunters can equip leather vests');
assert.deepEqual(policy.getEquipSlots(armor.leatherVest, 'assassin'), ['armor'], 'assassins can equip leather vests');
assert.deepEqual(policy.getEquipSlots(armor.apprenticeRobe, 'mage'), ['armor'], 'mages can equip apprentice robes');
assert.deepEqual(policy.getEquipSlots(armor.novicePriestRobe, 'priest'), ['armor'], 'priests can equip novice priest robes');
assert.equal(policy.isRecruitEquipment(armor.recruitPlateArmor), true, 'recruit plate armor survives recruit-only inventory migration');
assert.deepEqual([armor.recruitIronHelmet.defense, armor.recruitIronHelmet.hp], [5, 25], 'recruit iron helmet stats match the design');
assert.deepEqual([armor.guardHelmet.defense, armor.guardHelmet.strength], [3, 2], 'guard helmet stats match the design');
assert.equal(armor.recruitIronHelmet.image.split('?')[0], 'assets/recruit-iron-helmet.png', 'recruit iron helmet uses its dedicated image');
assert.equal(armor.guardHelmet.image.split('?')[0], 'assets/guard-helmet.png', 'guard helmet uses its dedicated image');
assert.deepEqual([armor.leatherHood.accuracy, armor.leatherHood.defense], [.02, 2], 'leather hood stats match the design');
assert.deepEqual([armor.huntingHood.attackSpeedBonus, armor.huntingHood.defense], [.02, 2], 'hunting hood stats match the design');
assert.equal(armor.leatherHood.image.split('?')[0], 'assets/leather-hood.png', 'leather hood uses its dedicated image');
assert.equal(armor.huntingHood.image.split('?')[0], 'assets/hunting-hood.png', 'hunting hood uses its dedicated image');
assert.deepEqual([armor.apprenticeMageHat.mana, armor.apprenticeMageHat.intelligence], [20, 2], 'apprentice mage hat stats match the design');
assert.deepEqual([armor.noviceHeadscarf.cooldownSpeedBonus, armor.noviceHeadscarf.intelligence], [.02, 1], 'novice headscarf stats match the design');
assert.equal(armor.apprenticeMageHat.name, '新兵布兜帽', 'the first chapter recruit cloth head item uses its requested name');
assert.equal(armor.noviceHeadscarf.name, '守衛法帽', 'the first chapter guard cloth head item uses its requested name');
assert.equal(armor.apprenticeMageHat.image.split('?')[0], 'assets/recruit-cloth-hood.png', 'the recruit cloth hood uses the first supplied image');
assert.equal(armor.noviceHeadscarf.image.split('?')[0], 'assets/guard-cloth-hat.png', 'the guard cloth hat uses the second supplied image');
assert.deepEqual(policy.getEquipSlots(armor.guardHelmet, 'warrior'), ['head'], 'warriors can equip plate helmets');
assert.deepEqual(policy.getEquipSlots(armor.guardHelmet, 'hunter'), [], 'hunters cannot equip plate helmets');
assert.deepEqual(policy.getEquipSlots(armor.leatherHood, 'hunter'), ['head'], 'hunters can equip leather hoods');
assert.deepEqual(policy.getEquipSlots(armor.leatherHood, 'assassin'), ['head'], 'assassins can equip leather hoods');
assert.deepEqual(policy.getEquipSlots(armor.apprenticeMageHat, 'mage'), ['head'], 'mages can equip cloth hats');
assert.deepEqual(policy.getEquipSlots(armor.apprenticeMageHat, 'priest'), ['head'], 'priests can equip cloth hats');
assert.equal(policy.isRecruitEquipment(armor.recruitIronHelmet), true, 'recruit iron helmet survives recruit-only inventory migration');
assert.deepEqual([armor.recruitIronLegguards.defense, armor.recruitIronLegguards.hp], [10, 18], 'recruit iron legguards stats match the design');
assert.deepEqual([armor.guardLegguards.defense, armor.guardLegguards.parry], [12, .01], 'guard legguards stats match the design');
assert.equal(armor.recruitIronLegguards.image.split('?')[0], 'assets/recruit-iron-legguards.png', 'recruit iron legguards use their dedicated image');
assert.equal(armor.guardLegguards.image.split('?')[0], 'assets/guard-legguards.png', 'guard legguards use their dedicated image');
assert.deepEqual([armor.leatherPants.defense, armor.leatherPants.hp], [6, 12], 'leather pants stats match the design');
assert.deepEqual([armor.huntingLegguards.defense, armor.huntingLegguards.accuracy], [4, .01], 'hunting legguards stats match the design');
assert.deepEqual([armor.apprenticeClothPants.defense, armor.apprenticeClothPants.mana], [3, 40], 'apprentice cloth pants stats match the design');
assert.deepEqual([armor.novicePriestPants.defense, armor.novicePriestPants.hp, armor.novicePriestPants.manaRegenFlat], [2, 10, 1], 'novice priest pants stats match the design');
assert.equal(armor.apprenticeClothPants.name, '新兵布褲', 'the first chapter recruit cloth pants use their requested name');
assert.equal(armor.novicePriestPants.name, '守衛法褲', 'the first chapter guard cloth pants use their requested name');
assert.equal(armor.apprenticeClothPants.image.split('?')[0], 'assets/recruit-cloth-pants.png', 'the recruit cloth pants use the first supplied image');
assert.equal(armor.novicePriestPants.image.split('?')[0], 'assets/guard-cloth-pants.png', 'the guard cloth pants use the second supplied image');
assert.deepEqual(policy.getEquipSlots(armor.recruitIronLegguards, 'warrior'), ['pants'], 'warriors can equip plate legguards');
assert.deepEqual(policy.getEquipSlots(armor.guardLegguards, 'hunter'), [], 'hunters cannot equip plate legguards');
assert.deepEqual(policy.getEquipSlots(armor.leatherPants, 'hunter'), ['pants'], 'hunters can equip leather pants');
assert.deepEqual(policy.getEquipSlots(armor.leatherPants, 'assassin'), ['pants'], 'assassins can equip leather pants');
assert.deepEqual(policy.getEquipSlots(armor.apprenticeClothPants, 'mage'), ['pants'], 'mages can equip cloth pants');
assert.deepEqual(policy.getEquipSlots(armor.novicePriestPants, 'priest'), ['pants'], 'priests can equip priest pants');
assert.equal(policy.isRecruitEquipment(armor.recruitIronLegguards), true, 'recruit iron legguards survive recruit-only inventory migration');
assert.deepEqual([armor.recruitIronGauntlets.defense, armor.recruitIronGauntlets.hp], [8, 10], 'recruit iron gauntlets stats match the design');
assert.deepEqual([armor.guardIronGauntlets.defense, armor.guardIronGauntlets.hp], [5, 30], 'guard iron gauntlets stats match the design');
assert.equal(armor.recruitIronGauntlets.image.split('?')[0], 'assets/recruit-iron-gauntlets.png', 'recruit iron gauntlets use their dedicated image');
assert.equal(armor.guardIronGauntlets.image.split('?')[0], 'assets/guard-iron-gauntlets.png', 'guard iron gauntlets use their dedicated image');
assert.deepEqual([armor.roughLeatherGloves.defense, armor.roughLeatherGloves.hp], [5, 10], 'rough leather gloves stats match the design');
assert.deepEqual([armor.huntingGloves.defense, armor.huntingGloves.hp], [3, 20], 'hunting gloves stats match the design');
assert.equal(armor.roughLeatherGloves.image.split('?')[0], 'assets/rough-leather-gloves.png', 'rough leather gloves use their dedicated image');
assert.equal(armor.huntingGloves.image.split('?')[0], 'assets/hunting-gloves.png', 'hunting gloves use their dedicated image');
assert.deepEqual([armor.apprenticeGloves.defense, armor.apprenticeGloves.hp], [5, 10], 'apprentice gloves stats match the design');
assert.deepEqual([armor.noviceGloves.defense, armor.noviceGloves.hp], [3, 15], 'novice gloves stats match the design');
assert.equal(armor.apprenticeGloves.name, '新兵布手套', 'the first chapter recruit cloth gloves use their requested name');
assert.equal(armor.noviceGloves.name, '守衛法術手套', 'the first chapter guard cloth gloves use their requested name');
assert.equal(armor.apprenticeGloves.image.split('?')[0], 'assets/recruit-cloth-gloves.png', 'the recruit cloth gloves use the first supplied image');
assert.equal(armor.noviceGloves.image.split('?')[0], 'assets/guard-cloth-gloves.png', 'the guard cloth gloves use the second supplied image');
assert.deepEqual(policy.getEquipSlots(armor.recruitIronGauntlets, 'warrior'), ['gloves'], 'warriors can equip plate gauntlets');
assert.deepEqual(policy.getEquipSlots(armor.recruitIronGauntlets, 'hunter'), [], 'hunters cannot equip plate gauntlets');
assert.deepEqual(policy.getEquipSlots(armor.roughLeatherGloves, 'hunter'), ['gloves'], 'hunters can equip leather gloves');
assert.deepEqual(policy.getEquipSlots(armor.roughLeatherGloves, 'assassin'), ['gloves'], 'assassins can equip leather gloves');
assert.deepEqual(policy.getEquipSlots(armor.apprenticeGloves, 'mage'), ['gloves'], 'mages can equip cloth gloves');
assert.deepEqual(policy.getEquipSlots(armor.noviceGloves, 'priest'), ['gloves'], 'priests can equip cloth gloves');
assert.equal(policy.isRecruitEquipment(armor.recruitIronGauntlets), true, 'recruit iron gauntlets survive starter inventory cleanup');
assert.deepEqual([armor.recruitIronBoots.defense, armor.recruitIronBoots.hp], [15, 40], 'recruit iron boots stats match the design');
assert.deepEqual([armor.guardWarBoots.defense, armor.guardWarBoots.damageReduction], [10, .02], 'guard war boots stats match the design');
assert.equal(armor.recruitIronBoots.image.split('?')[0], 'assets/recruit-iron-boots.png', 'recruit iron boots use their dedicated image');
assert.equal(armor.guardWarBoots.image.split('?')[0], 'assets/guard-war-boots.png', 'guard war boots use their dedicated image');
assert.deepEqual([armor.leatherShortBoots.defense, armor.leatherShortBoots.dodge], [8, .03], 'leather short boots stats match the design');
assert.deepEqual([armor.travelLongBoots.defense, armor.travelLongBoots.movementSpeedBonus], [6, .08], 'travel long boots stats match the design');
assert.deepEqual([armor.apprenticeClothShoes.defense, armor.apprenticeClothShoes.mana], [4, 40], 'apprentice cloth shoes stats match the design');
assert.deepEqual([armor.arcaneLongBoots.defense, armor.arcaneLongBoots.manaRegenFlat], [3, 2], 'arcane long boots stats match the design');
assert.equal(armor.apprenticeClothShoes.name, '新兵布鞋', 'chapter one recruit cloth shoes use the recruit-series name');
assert.equal(armor.arcaneLongBoots.name, '守衛法靴', 'chapter one guard cloth boots use the guard-series name');
assert.equal(armor.apprenticeClothShoes.image.split('?')[0], 'assets/recruit-cloth-shoes.png', 'recruit cloth shoes use their dedicated image');
assert.equal(armor.arcaneLongBoots.image.split('?')[0], 'assets/guard-cloth-boots.png', 'guard cloth boots use their dedicated image');
assert.deepEqual(policy.getEquipSlots(armor.recruitIronBoots, 'warrior'), ['boots'], 'warriors can equip plate boots');
assert.deepEqual(policy.getEquipSlots(armor.leatherShortBoots, 'assassin'), ['boots'], 'assassins can equip leather boots');
assert.deepEqual(policy.getEquipSlots(armor.travelLongBoots, 'hunter'), ['boots'], 'hunters can equip leather boots');
assert.deepEqual(policy.getEquipSlots(armor.apprenticeClothShoes, 'mage'), ['boots'], 'mages can equip cloth shoes');
assert.deepEqual(policy.getEquipSlots(armor.arcaneLongBoots, 'priest'), ['boots'], 'priests can equip cloth boots');
assert.equal(policy.isRecruitEquipment(armor.recruitIronBoots), true, 'recruit iron boots survive starter inventory cleanup');

console.log('equipment-policy: assertions passed');
