/* ------------------------------------------------------------------
   Sina Una subclasses — book pp. 176-196. Feature text transcribed
   from the source PDF (visual read, not OCR — see CLAUDE.md). Each
   feature is [level, name, text]. Table-shaped features (domain
   spells, oath spells, expanded spell lists) have their tables
   flattened into the prose, the same treatment PHB spell text got.
------------------------------------------------------------------- */
import { EXPANDED_SUBCLASS_RAW } from "./expandedSubclasses.js";
import { PHB_SUBCLASS_TEXT } from "./phbSubclassText.js";

export const SINA_UNA_SUBCLASSES = [
  { id: "path-of-the-black-river", cls: "barbarian", name: "Path of the Black River", src: "sinauna",
    group: "Primal Path", unlock: 3, page: 176,
    blurb: "Not the river's attendant or its traveller, but its servant.",
    features: [
      [3, "Isolation of the Soul", "Upon selecting this path, you are able to impart an image of the Black River into those you strike. When you successfully hit a creature while raging, you can force it to make a Wisdom saving throw (DC 8 + your Wisdom modifier + your proficiency modifier). An undead creature automatically fails this saving throw. On a failure, the creature loses sight of anything beyond 30 feet of itself; this affects other methods of awareness including tremorsense or blindsight. If you move beyond 30 feet of the creature, it is still aware of where you are. While its vision is limited in this way, every time you make a successful attack against this creature you also regain a number of hit points equal to your proficiency modifier. Only one creature can be under the effect of this feature at a time. You can use this ability a number of times equal to your Strength modifier. You can recover one use after a short rest, and all uses after a long rest."],
      [6, "Treading Rampage", "Beginning at 6th level, the Black River permits you to ebb away your life to keep yourself from being halted or slowed. As a reaction to being affected by the blinded, charmed, deafened, frightened, paralyzed, or poisoned condition, you can choose to lose a number of hit points equal to 1d6 + your proficiency bonus and then immediately end the condition. Beginning at 10th level, as a reaction to being affected by the petrified or stunned condition, you can choose to lose a number of hit points equal to 2d6 + your proficiency bonus and then immediately end the condition.", "reaction"],
      [10, "Living Tide", "Beginning at 10th level, the Black River permits you to travel unhindered by the physical world. As an action, you are able to cast dimension door. You can take more than one willing creature with you, but in order to do so you must lose a number of hit points equal to your Strength modifier for each creature you take. You regain use of this feature after a long rest.", "action"],
      [14, "Burial Shroud", "Beginning at 14th level, the Black River now sees you as a true disciple, and permits you to wear its visage when you rage. While raging, you assume a spectral appearance, and gain the following benefits: Your movement no longer provokes attacks of opportunity. You can move through creatures and objects as if they were difficult terrain. If you end your turn inside a creature, the creature takes 4d6 psychic damage and is forcibly moved into an unoccupied space within 5 feet of its original location. The first creature you hit on each of your turns with a melee weapon attack must make a Constitution saving throw (DC 8 + Proficiency Bonus + Wisdom modifier). On a failure, the creature's maximum hit points is reduced by 1d6 + half your barbarian level. If this attack reduces their hit point maximum to 0, the creature is unable to be resurrected except through a wish spell."],
    ] },
  { id: "college-of-siday", cls: "bard", name: "College of Siday", src: "sinauna",
    group: "Bard College", unlock: 3, page: 177,
    blurb: "Keepers of the epic poem, dancing to the heartbeat of history.",
    features: [
      [3, "Noble Fortitude", "When you join the College of Siday at 3rd level, your dedication to the performance of history strengthens your endurance. Receiving levels of exhaustion never imposes disadvantage on your ability checks, attack rolls, or saving throws. Additionally, you can extend some of this endurance to your companions. Whenever you use your Song of Rest feature, affected creatures can add your Charisma modifier to the extra hit points regained."],
      [3, "Folkloric Epics", "At 3rd level, you can use the chronicles of the past to strengthen the heroes of the present. As a bonus action, you can expend one use of your Bardic Inspiration to begin performing one of the following Folkloric Epics. A Folkloric Epic lasts for 1 minute, or until you end it as a bonus action. While performing a Folkloric Epic, you cannot cast a spell that requires concentration. Poem of the Ancients. This Folkloric Epic calls upon the spirits of those who came before, requesting their help and guidance in this time of need. For the duration of the Folkloric Epic, you and friendly creatures within 15 feet of you add your Charisma modifier (minimum of 1) to all attack rolls. Tale of the Warriors. This Folkloric Epic inspires others with the ferocity and valor of past warriors. Once per turn, you and friendly creatures within 15 feet of you can add extra force damage to the damage of a successful attack. The amount of extra damage is equal to your bard level. Visage of the Sun. This Folkloric Epic extols the fearsome beauty of nature to astonish opponents. For the duration of the Folkloric Epic, you and friendly creatures within 15 feet of you gain a +1 bonus to AC. Additionally, whenever a hostile creature makes a melee attack against a creature with this bonus, the hostile creature must make a successful Constitution saving throw against your spell save DC or be blinded. The creature can attempt this saving throw again at the start of each of their turns, ending the effect on a success.", "bonus"],
      [6, "Bolstering Verse", "Starting at 6th level, your performances inspire others to embody the heroes of legend. While performing a Folkloric Epic, you and friendly creatures within 15 feet of you have advantage on saving throws against being charmed or frightened. Additionally, you gain the ability to cast enhance ability without expending a spell slot or material components. You can do this a number of times equal to your Charisma modifier, and regain all uses after you finish a long rest."],
      [14, "The Footsteps of Heroes", "At 14th level, your time spent chronicling the escapades of adventurers have strengthened your own abilities as a storyteller and hero in your own right. While performing a Folkloric Epic, you now gain the following benefits: You are resistant to all damage. You have advantage on Dexterity saving throws. Once on each of your turns, when a friendly creature affected by the Folkloric Epic makes a weapon attack and misses, you can cause that attack to hit instead."],
    ] },
  { id: "volcano-domain", cls: "cleric", name: "Volcano Domain", src: "sinauna",
    group: "Divine Domain", unlock: 1, page: 178,
    blurb: "To see only destruction is fear; to see only growth is naive. You are ruled by neither.",
    features: [
      [1, "Domain Cleric spells", "You gain the following domain spells at the cleric levels listed in the Volcano Domain Spells table. Once you gain a domain spell, the spell is always prepared and does not count against the number of spells you can prepare each day. These spells are considered cleric spells for you regardless of whether they are on the cleric spell list. Volcano Domain Spells — 1st level: create or harden lava, purify food and drink. 3rd level: lesser restoration, molten shell. 5th level: beacon of hope, eruption. 7th level: control lava, fire shield. 9th level: greater restoration, volcanic wall."],
      [1, "Volcanic Calling", "At 1st level, you learn the light and mending cantrips. You also gain proficiency in one of the following skills of your choice: Medicine, Nature, or Survival."],
      [2, "Channel Divinity: Pyroclasm", "Starting at 2nd level, you can use your Channel Divinity to call forth a surge of volcanic energy. As an action, you present your holy symbol and summon an eruption of molten ash and lava. Each hostile creature within 15 feet of you must make a Dexterity saving throw against your spell save DC, taking fire damage equal to 3d6 + your cleric level on a failure and half as much on a success. Additionally, each friendly creature within 15 feet of you then regains hit points equal to your cleric level, as the volcanic ash from your eruption revitalizes your allies' strength.", "action"],
      [6, "Revitalize and Renew", "At 6th level, you can transform your destructive energies into revitalizing light. When you score a critical hit, choose one creature within 30 feet of you that you can see. That creature then immediately regains hit points equal to half the damage dealt by the critical hit."],
      [8, "Divine Strike", "At 8th level, you gain the ability to infuse your weapon strikes with divine energy. Once on each of your turns when you hit a creature with a weapon attack, you can cause the attack to deal an extra 1d8 fire damage to the target. When you reach 14th level, the extra damage increases to 2d8."],
      [17, "Igneous Scion", "Starting at 17th level, you can use your action to activate a 30-foot aura of volcanic energy centered on yourself. This aura lasts for one minute or until you are incapacitated, during which you gain the following benefits: Ash begins to spew forth around you, disorienting your enemies — when a hostile creature begins its turn within the aura, it must make a successful Constitution saving throw or become stunned until the start of their next turn. Magma shields erupt from the area around you — you and friendly creatures within the aura gain a +2 bonus to AC. You immediately cast beacon of hope without expending a spell slot; casting the spell in this manner does not require your concentration, and the spell remains active for the duration of the aura. Once you use this ability, you cannot do so again until you finish a long rest.", "action"],
    ] },
  { id: "circle-of-tides", cls: "druid", name: "Circle of Tides", src: "sinauna",
    group: "Druid Circle", unlock: 2, page: 180,
    blurb: "The sea does not care who it harms. The only way to survive is to adapt and grow.",
    errata: "The feature table on p.180 is headed \"College of Tides Features\" though the subclass and every heading around it say Circle of Tides. Recorded as printed.",
    features: [
      [2, "Quiet Undercurrent", "Starting at 2nd level, you learn to listen to the spirits of nature running through the world and work alongside them rather than against them. As an action, you commune with the world around you. For one hour, you cannot be surprised while conscious, and difficult terrain doesn't reduce your movement speed or the movement speed of creatures traveling with you. Additionally, for the duration of the hour, you and allied creatures within 15 feet of you gain a bonus to any Dexterity (Stealth) check made to hide in natural terrain, equal to your Wisdom modifier (minimum of +1). When you use your action to activate this ability, choose one of the following damage types: acid, cold, fire, lightning, or thunder. You have resistance to this damage type until the effect ends. If you expend another use of Wild Shape to use this ability again, the new damage type resistance replaces the previous one. The effect ends early if you are incapacitated.", "action"],
      [2, "Adaptation", "Also starting at 2nd level, you can harness nature's ever-changing energy to alter the world around you and even your own form. As an action, you can expend a use of your Wild Shape feature to adopt one of the following adaptations rather than transforming into a beast form. An adaptation lasts for 1 minute, or until you expend another use of your Wild Shape feature. You cannot have more than one adaptation active at a time. Alacrity. You can use a bonus action on your turn to take the Dodge action. Balm. Choose a creature you can see (this can be yourself). The first time the chosen creature drops to 0 hit points as a result of taking damage, the creature automatically has one successful death saving throw. Earthquake. You gain tremorsense out to 60 feet. Shell. Choose a creature you can see (this can be yourself). The chosen creature gains a bonus to their AC equal to half your Wisdom modifier, rounded down (minimum of +1). Tidal Wave. Swirling energy surrounds you. At the end of your turn, each creature within 5 feet of you must make a successful Constitution saving throw against your spell save DC or take force damage equal to 1d8 + your level in this class.", "action"],
      [6, "Ebb and Flow", "At 6th level, your awareness of nature's waxing and waning power allows you to shift even detrimental happenings to your benefit. When you are hit with an attack, you can use your reaction to take no damage and instead regain a number of hit points equal to half the damage dealt (rounded up). You can use this feature a number of times equal to your Wisdom modifier, and regain all uses after a short or long rest.", "reaction"],
      [10, "Shifting Sands", "When conflict strikes, your adaptability grants you an edge in combat. Starting at 10th level, you can swap initiative counts with a hostile creature you can see. You can choose to do this after rolling initiative but before the first round of combat."],
      [14, "Increased Adaptation", "Starting at 14th level, when you expend a use of your Wild Shape to use your Adaptation feature, you can also choose from one of the following options. As stated previously, an adaptation lasts for 1 minute or until you expend another use of your Wild Shape feature, and you cannot have more than one adaptation active at a time. Regrowth. Choose a creature you can see (this can be yourself). You immediately end one condition afflicting the chosen creature, and for the duration, the creature gains immunity to that condition. Roots. For the duration, you can use your movement on your turn to instead disappear into the earth. You then emerge out of the ground at a point of your choosing within 30 feet of your original location. You have advantage on your first attack roll after moving in this manner. Wind. You gain a flying speed equal to your movement speed. If you already have a flying speed, this adaptation increases your flying speed by 15 feet."],
    ] },
  { id: "kawal", cls: "fighter", name: "Kawal", src: "sinauna",
    group: "Martial Archetype", unlock: 3, page: 181,
    blurb: "A battle is not just a fight. It is a thundering race to ward away all harm.",
    features: [
      [3, "Steadfast Protector", "Starting when you choose this archetype at 3rd level, you gain advantage on all ability checks and saving throws against being grappled, poisoned, pushed, or restrained. Additionally, whenever you use your Second Wind feature, you regain the maximum number of hit points possible."],
      [3, "Guardian Roar", "Also starting at 3rd level, you can draw your foes' attention from your allies to yourself. As a bonus action on your turn, choose up to three creatures within 30 feet of you that can hear you. Each creature must then immediately make a Wisdom saving throw (DC = 8 + your proficiency bonus + your Constitution modifier). On a failure, the creature is inexorably drawn to you in combat, and for 1 minute, the creature has disadvantage on attack rolls against targets other than you. On a success, the creature only has disadvantage until the end of your next turn. Once you use this feature, you cannot do so again until you finish a short or long rest.", "bonus"],
      [7, "Counter Destruction", "At 7th level, you learn to parry gouts of damage back at your opponents. When you are subjected to damage, you can use your reaction to make a Constitution saving throw. The DC for this saving throw equals 10 or half the total amount of damage, whichever number is higher. On a success, you take no damage and instead reflect it back at the creature that originated the attack or effect. That creature then takes the full amount of damage you would have received. You can parry damage in this manner a number of times equal to your Constitution modifier (minimum of once), and regain all uses after a short or long rest.", "reaction"],
      [10, "Resolute Loyalty", "Beginning at 10th level, your drive to protect your allies in battle renders your dedication unshakable. You are immune to being charmed or frightened. Additionally, you can take up to two reactions per turn instead of one."],
      [15, "Warrior's Legacy", "At 15th level, your litany of deeds blesses you with your ancestor's protection, allowing you to even better defend your people. When you are targeted with an attack, you can use your reaction to call upon the aid of kawals who came before. For 1 minute, or until you are incapacitated, you gain the following benefits: You can add your proficiency bonus to the damage dealt by your weapon attacks. You and all allied creatures within 10 feet of you gain a +1 bonus to AC. You and all allied creatures within 10 feet of you have advantage on Strength, Dexterity, and Constitution saving throws. Once you use this feature, you cannot do so again until you finish a long rest.", "reaction"],
      [18, "Peerless Defense", "Your swiftness in protecting your allies is matched by none. Starting at 18th level, you can take up to three reactions per turn instead of one."],
    ] },
  { id: "way-of-kaluluwa", cls: "monk", name: "Way of Kaluluwa", src: "sinauna",
    group: "Monastic Tradition", unlock: 3, page: 183,
    blurb: "Split body and soul willingly, and have both fight alongside each other.",
    features: [
      [3, "Temperament of the Soul", "Starting when you choose this tradition at 3rd level, your unarmed strikes deal psychic damage instead of bludgeoning damage."],
      [3, "Schism of Self", "Additionally, starting at 3rd level you learn how to divide your soul from your body. As an action, you can spend 2 ki points to manifest your soul in an unoccupied space within 5 feet of your body. Your soul appears as an identical copy of your physical body, but translucent and blue, and uses the same movement speed, AC, size, and saving throw bonuses as your physical form. However, your soul does not have its own unique pool of hit points; if your soul is hit with an attack, the damage is subtracted from your own hit points, and effects targeting your soul that grant temporary hit points or reduce hit point maximum alter your hit points instead. If both your soul and physical form are caught in the same area of effect, only one is affected. While split in this way, on your turn you can move your soul a number of feet equal to your movement speed (no action required). Your physical form and soul act on the same initiative count and share the same turn; your physical form can use your action while your soul can use your bonus action, or vice versa. Your soul can also use a reaction provided that you have not already used your reaction this turn. Additionally, when both your physical form and your soul are within 10 feet of each other, you have advantage on attack rolls, as well as Strength-based and Dexterity-based skill checks. This split lasts for 1 minute, or until you are incapacitated.", "action"],
      [6, "Diversion of Magic", "Starting at 6th level, your command of the soul extends to your reflexes and defensive training. When you are hit with a ranged spell attack, you can use your reaction to divert the spell, reducing the damage taken from the attack by 1d10 + your Wisdom modifier + your monk level. You can spend additional ki points to increase the amount of damage reduced, adding 1d10 to the total damage reduced for each ki point spent.", "reaction"],
      [11, "Refinement of Aspects", "At 11th level, you learn to bolster your body and soul against the fraught nature of battle. While your physical form and soul are split, you can use your bonus action to spend 1 ki point and grant yourself one of the following benefits: Refinement of the Soul. Your soul gains resistance to fire, lightning, cold, thunder, radiant, and necrotic damage. Refinement of the Body. Your physical form gains resistance to piercing, slashing, bludgeoning, poison, acid, force, and psychic damage. These benefits last until the start of your next turn.", "bonus"],
      [17, "Untethered Forms", "At 17th level, you have learned how to push your soul and body to new heights. At the start of your turn while your physical form and soul are split, you can spend 3 ki points to give your physical form and soul each their own separate action, bonus action, and reaction for the round.", "free"],
    ] },
  { id: "oath-of-blood", cls: "paladin", name: "Oath of Blood", src: "sinauna",
    group: "Sacred Oath", unlock: 3, page: 185,
    blurb: "You become a part of the one you swear to, and they become a part of you.",
    features: [
      [3, "Oath Spells", "You gain oath spells at the paladin levels listed in the Oath of Blood Spells table. See the Sacred Oath class feature for how oath spells work. Oath of Blood Spells — 3rd level: sanctuary, bless. 5th level: revivify, warding bond. 9th level: protection from energy, remove curse. 13th level: death ward, stoneskin. 17th level: dispel evil and good, wall of force."],
      [3, "Channel Divinity", "When you take this oath at 3rd level, you gain the following two Channel Divinity options. My Shield Is For Others. Choose an ally. For 1 minute, whenever a creature targets that ally with an attack and that creature is a number of feet from you less than or equal to your movement speed, you can use your reaction to move towards that creature and make one melee attack. Under My Light. As a bonus action, you present your holy symbol and can grant temporary hit points to an ally that you choose, equal to 2d8 + your level in this class."],
      [7, "Sanguine Light", "Beginning at 7th level, you emanate a 10-foot aura of retribution. Whenever an ally within the aura takes damage, your next successful attack deals an additional 3 points of damage. This effect is cumulative; when two allies within the aura take damage your next attack deals 6 points of damage, three allies hurt increases the effect to an additional 9 points of damage, and so on. At 18th level, the range of this aura increases to 30 feet."],
      [15, "Resilient Guardian", "The ardor of your promise has given you the strength to keep powering through, no matter what stands in your path. Starting at 15th level, you can use your action to designate an ally. For the next minute, whenever both you and the ally have fewer than half of your maximum hit points remaining at the end of your turn, you both automatically regain a number of hit points equal to 2d8 + your level in this class. Any hit points regained that exceed your hit point maximum are lost. Once you use this feature, you cannot use it again until you complete a short or long rest.", "action"],
      [18, "Sanguine Light (30 ft.)", "The range of your Sanguine Light aura increases from 10 feet to 30 feet (folded into the 7th-level feature above)."],
      [20, "Avatar of Sacrifice", "At 20th level, you have learned how to give entirely into your oath, temporarily forgoing your mortal limits. As a bonus action, you gain the following benefits: When asked to make a Dexterity or Constitution saving throw to avoid taking damage, you can make a Charisma saving throw instead, with advantage. As a bonus action, you can lose 10 hit points to regain one use of Channel Divinity. Any spell slots expended to use your Divine Smite feature are treated as one spell level higher. These benefits last for 1 minute, or until you are incapacitated. Once you use this feature, you cannot use it again until you finish a long rest.", "bonus"],
    ] },
  { id: "mangangayaw", cls: "ranger", name: "Mangangayaw", src: "sinauna",
    group: "Ranger Archetype", unlock: 3, page: 186,
    blurb: "Always faster to embrace the fight, always ready to cut them all down.",
    features: [
      [3, "Innate Speech", "You know your way through speech through insight and understanding, rather than pure force of personality. When you choose this archetype at 3rd level, you gain proficiency in one of the following skills: Deception, Intimidation, or Persuasion. Additionally, whenever an ability check would normally use your Charisma modifier, you can use your Wisdom modifier instead."],
      [3, "Striker's March", "To fight against you is to give you the ability to adapt. Whenever a creature targets you with an attack, your movement speed increases by 15 feet until the end of your next turn. While your movement is increased in this way, your movement does not provoke attacks of opportunity, and you may re-roll one weapon attack roll."],
      [7, "Lowering Strikes", "Starting at 7th level, the speed of your strikes leaves lasting wounds on your opponent. Once per turn, when you make a successful attack against a creature, you can choose to make it a bleeding strike. The target immediately takes an extra 1d4 damage, and at the start of its turn, it must take an additional 1d4 damage unless it uses its action to staunch the wound. You can strike in this manner a number of times equal to your Wisdom modifier (minimum of once) and regain all uses after a short or long rest. The damage dealt by these strikes increases to 2d4 at 11th level, and 3d4 at 15th level."],
      [11, "Undertow", "Beginning at 11th level, your mobility has improved to grant others protection. Dragging, pushing, or lifting an object no longer reduces your movement speed. Additionally, when you are subjected to an effect that allows you to make a Dexterity or Constitution saving throw to take only half damage, instead of rolling a saving throw you can use your reaction to move a number of feet equal to your movement speed and shield one creature also caught in the effect. When you do so, you automatically fail the saving throw against the effect, but the shielded creature takes no damage. You can choose to use this ability after you roll the saving throw but before you know if you passed or failed.", "reaction"],
      [15, "Eternal March", "Starting at 15th level, you are permanently under the effect of Striker's March, and while wearing medium armor, you may add your Wisdom modifier to your Armor Class."],
    ] },
  { id: "graverobber", cls: "rogue", name: "Graverobber", src: "sinauna",
    group: "Roguish Archetype", unlock: 3, page: 188,
    blurb: "You took the malignant nature of a curse and turned it into a gift.",
    features: [
      [3, "Cursed Magic", "Your desecration of a venerated burial place has cursed you with powerful dark magic. When you reach 3rd level, you learn three cantrips of your choice from the warlock spell list. You learn another warlock cantrip of your choice at 9th level. Charisma is your spellcasting ability for this subclass; you use it whenever a spell refers to your spellcasting ability, and when setting the saving throw DC for a spell you cast or making an attack roll with one. Spell save DC = 10 + your proficiency bonus + your Charisma modifier. Spell attack modifier = your proficiency bonus + your Charisma modifier."],
      [3, "Anathema", "You have learned to harness the malicious nature of your curse to aid in your exploits. Immediately after you use your Cunning Action, you can target a creature within 30 feet of you, provided you haven't yet used your Sneak Attack this turn. The targeted creature must make a Wisdom saving throw against your spell save DC, taking damage equal to your Sneak Attack on a failure and half as much damage on a success. You can use this feature regardless of whether you have made a weapon attack this turn. The type of damage dealt by this feature depends on how your curse manifests in you, and can be changed whenever you gain a level in this class. Pestilence. The damage type is poison. Avarice. The damage type is psychic. Destruction. The damage type is force."],
      [9, "Eldritch Secrets", "At 9th level, the curse you carry seeps further into your blood. You learn one additional cantrip of your choice from the warlock spell list, and you gain new features depending on your choice of curse manifestation. Pestilence. You have advantage on saving throws against being poisoned, and the poison damage from your Anathema ignores resistances and immunities. Additionally, you can cast stinking cloud once without material components, regaining the ability after a short or long rest. Avarice. You gain proficiency in Wisdom saving throws (or, if you already have it, Constitution or Charisma, your choice). Additionally, you can cast haste on yourself once, regaining the ability after a short or long rest. Destruction. You gain resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons. Additionally, you can cast lightning bolt once without material components, regaining the ability after a short or long rest."],
      [13, "Afflict Ruin", "Starting at 13th level, you learn how to plague opponents with a curse of your own. As a bonus action, choose one creature within 30 feet who can hear you. This creature is afflicted by a ruinous curse for 1 minute, or until you are incapacitated. Until the curse ends, you gain the following benefits: You score a critical hit against the cursed target on a roll of 19 or 20. The cursed target has disadvantage on saving throws against your Anathema. When you use your Anathema against the cursed target, you can use your reaction to regain a number of hit points equal to half the amount of damage dealt. If the target drops to 0 hit points before the ruinous curse ends, you can use a bonus action on a subsequent turn to transfer the curse to a new creature.", "bonus"],
      [17, "Shroud of Desecration", "At 17th level, the malignant power of your curse engulfs you. The effect is based on your choice of curse manifestation. Pestilence. When you hit a creature with a weapon attack, you can use your reaction to force it to make a Constitution saving throw against your spell save DC. On a failure, the target takes another 3d6 poison damage (ignoring resistances and immunities) and is paralyzed until the start of your next turn; on a success it takes half as much damage and isn't paralyzed. Avarice. When a creature hits you with an attack, you can use your reaction to choose another creature within 30 feet (this can include the attacker); it must make a Wisdom saving throw against your spell save DC, taking the attack's damage instead of you on a failure, or half on a success while you take the rest. Destruction. When you use your Anathema, you can force the target and any creatures of your choice within 10 feet of it to make a Dexterity saving throw against your spell save DC, taking 6d6 force damage on a failure or half as much on a success.", "reaction"],
    ],
    effects: [
      { type: "casting", ability: "cha", progression: "none", dcBase: 10,
        label: "Cursed Magic", from: "warlock", cantrips: { 3: 3, 9: 4 },
        note: "The book sets the save DC at 10 + proficiency + Charisma. Standard 5e uses 8. Recorded as printed." },
    ],
    choice: { id: "curse", name: "How your curse manifests", atLevel: 3,
      note: "Sets your Anathema damage type. You can change it whenever you gain a level in this class.",
      options: [
        { id: "pestilence", name: "Pestilence", sub: "poison damage" },
        { id: "avarice", name: "Avarice", sub: "psychic damage" },
        { id: "destruction", name: "Destruction", sub: "force damage" },
      ] } },
  { id: "diwata-bloodline", cls: "sorcerer", name: "Diwata Bloodline", src: "sinauna",
    group: "Sorcerous Origin", unlock: 1, page: 190,
    blurb: "You herald from a nature spirit — the sun, the moon, a volcano, an ocean.",
    errata: "The 18th-level feature is \"Nature's Unending Reach\" in the feature table but \"One with Nature\" in the body text. Recorded as printed.",
    features: [
      [1, "Spirit's Cunning", "At 1st level, you gain proficiency in the Nature skill. Additionally, you can speak, understand, and write Sylvan. Whenever you are conversing with another creature that also understands Sylvan, you have advantage on all Charisma skill checks made towards that creature."],
      [1, "Sorcerous Nature", "The magic of nature flows in your very being. Beginning at 1st level, when your Spellcasting feature lets you learn or replace a sorcerer cantrip or a sorcerer spell of 1st level or higher, you can choose the new spell from the druid spell list or the sorcerer spell list. You must otherwise obey all the restrictions for selecting the spell, and it becomes a sorcerer spell for you."],
      [6, "Icon of the Spirit", "Starting at 6th level, you are able to call upon the nature spirit within your bloodline to aid and enhance your power. As a bonus action on your turn, you can spend 2 sorcery points to summon an Icon of your ancestral nature spirit in an unoccupied space that you can see within 30 feet. While you are within 30 feet of the Icon, any spell you cast that has a range of touch can instead target any creature or object so long as it is also within 30 feet of the icon. The Icon is immune to all damage and cannot be dispelled by magical means. On subsequent turns, you must spend 1 sorcery point to maintain the icon's presence — a free action. The icon disappears early if you are incapacitated.", "bonus"],
      [14, "Icon's Territory", "Within the territory of your icon, your form becomes unfettered by physical steps. Starting at 14th level, while you are within 30 feet of your Icon, you can use your movement to instead teleport to any other unoccupied space within 30 feet of the icon. Moving in this way does not provoke attacks of opportunity."],
      [18, "Nature's Unending Reach", "Beginning at 18th level, your connection to that mighty spirit which flows in your blood allows you to assume aspects of its immense power. When you use your bonus action to summon your Icon, you can spend an additional 5 sorcery points to channel some of the Icon's power directly into your physical form as well. While imbued with power in this manner, you gain the following benefits: You are immune to bludgeoning, piercing, and slashing damage, and you cannot lose concentration on a spell as a result of taking damage. At the start of your turn, you and all allied creatures within 30 feet of you or your Icon regain a number of hit points equal to 1d8 + your Charisma modifier. Each hostile creature that starts its turn within 30 feet of you or your Icon must make a successful Wisdom saving throw against your spell save DC or be frightened until the start of their next turn. This state lasts until you are incapacitated or you no longer choose to maintain the Icon's presence."],
    ],
    grants: { skills: ["Nature"], languages: ["Sylvan"] } },
  { id: "mooneater-patron", cls: "warlock", name: "Mooneater Patron", src: "sinauna",
    group: "Otherworldly Patron", unlock: 1, page: 192,
    blurb: "The Celestial Eaters loom over the islands, waiting to incite the end of the world.",
    features: [
      [1, "Expanded Spell List", "The Mooneater lets you choose from an expanded list of spells when you learn a warlock spell. The following spells are added to the warlock spell list for you. Mooneater Expanded Spells — 1st level: inflict wounds, thunderwave. 2nd level: enlarge/reduce, pass without trace. 3rd level: call lightning, water walk. 4th level: dominate beast, phantasmal killer. 5th level: planar binding, telekinesis."],
      [1, "Celestial Yearning", "The gnawing hunger you have bound yourself to propels you to the forefront of confrontation. You can give yourself a bonus to your initiative rolls equal to your Charisma modifier."],
      [1, "Agent of Destruction", "At 1st level, you can channel your patron's catastrophic power. You have a pool of d6s that you can use to fuel this damage. The number of dice in this pool equals 1 + your warlock level. Once per turn, when you make a weapon attack or cast a spell that requires an attack roll, you can charge the attack via spending dice from this pool. The maximum number of dice you can spend at once equals your Charisma modifier (minimum of one die). Roll the dice you spend, add them together, and add force damage equal to the total rolled to the attack. Your pool regains all expended dice when you finish a long rest."],
      [6, "Devour Essence", "Starting at 6th level, your connection to the Celestial Eaters allows you to consume the spirits of others to strengthen yourself. When a creature dies within 60 feet of you, you can use your bonus action to absorb the creature's essence. After consuming a creature in this way, you gain the following benefits for one minute: You have resistance to bludgeoning, piercing, and slashing damage. You gain a bonus to attack rolls equal to half your warlock level, rounded up. When you cast a spell that deals damage and requires a saving throw, you can add your Charisma modifier to the total damage dealt. Once you consume a creature's essence in this manner, you cannot do so again until you finish a short or long rest.", "bonus"],
      [10, "Eclipsing Fear", "Beginning at 10th level, you entwine yourself with your patron's terrifying presence looming over the inevitable end. You are immune to being frightened, and when another creature attempts to frighten you, you can use your reaction to attempt to turn the effect back on that creature. The creature must make a Charisma saving throw against your warlock spell save DC. On a failure, the creature takes psychic damage equal to your warlock level and is frightened of you for 1 minute. On a success, the creature takes psychic damage equal to half your warlock level and is not frightened.", "reaction"],
      [14, "Cataclysmic Hunger", "At 14th level, you learn to manifest your gnawing greed into apocalyptic devastation. You now have advantage on initiative rolls. On your first turn of combat, you can use your action to target a number of creatures that haven't taken a turn in combat yet, equal to your Charisma modifier. Each creature must make a Constitution saving throw against your spell save DC, taking 8d8 force damage on a failure and half as much on a success. Once you use this feature, you can't use it again until you finish a long rest.", "action"],
    ] },
  { id: "mentala", cls: "wizard", name: "Mentala", src: "sinauna",
    group: "Arcane Tradition", unlock: 2, page: 196,
    blurb: "The art of scribing spells onto bamboo scrolls.",
    features: [
      [2, "Durability", "When you choose this tradition at 2nd level, the bamboo upon which you scribe your spells begins to lend its hardy nature to your magic. While you are not wearing armor, your Armor Class equals 10 + your Dexterity modifier + your Intelligence modifier. Additionally, you gain a bonus to any Constitution saving throw you make to maintain your concentration on a spell, equal to your Intelligence modifier (minimum of +1)."],
      [2, "Shared Scrolls", "Also at 2nd level, you learn how to scribe bamboo scrolls for your companions to use. During a long rest, you can scribe a number of scrolls up to an amount equal to your spellcasting modifier. Each scroll must contain a spell you know how to cast, though you do not need to have the spell prepared in order to scribe it. Scrolls last until they are used or destroyed, but the combined levels of all spells scribed on your current existing scrolls must be less than or equal to half your wizard level, rounded down (a cantrip counts as a 0th-level spell). Expending a scroll takes the same amount of time as casting the spell normally. A creature does not need to know the spell nor be a spellcaster to use one of your bamboo scrolls — it uses your spell attack bonus for an attack roll and your spell save DC for a saving throw. If a spell requires concentration, the creature follows the rules for concentration as normal, but when making a saving throw to maintain it, the creature may use your saving throw bonus as granted by your Durability feature instead. Casting the spell uses the scroll; you can also destroy a scroll without casting its spell as an action. Once a scroll is used or destroyed, the bamboo crumbles to ash."],
      [6, "Scribe's Malediction", "Starting at 6th level, you can create scrolls for your enemies as well, carving lasting curses into lengths of bamboo. As an action, choose a number of creatures equal to your Intelligence modifier that you can see. Each creature immediately takes 2d4 psychic damage and must make a Wisdom saving throw against your spell save DC. On a failure, the creature is cursed, and whenever it makes an attack roll or a saving throw before the curse ends, it must roll a d6 and subtract the number rolled from the attack roll or saving throw. The curse lasts for one hour. A remove curse spell or similar effect ends it early. Once you use this feature, you cannot use it again until you have finished a short or long rest.", "action"],
      [10, "Bendable Magic", "Through your persistent practice of scribing your bamboo scrolls, you have learned how to combine your arcane inscriptions with the plant's natural flexibility to enhance your spells. Starting at 10th level, when you cast a spell, you can apply one of the following alterations to modify the spell's effects. A spell can only benefit from one alteration at a time. You can use this feature a number of times equal to your Intelligence modifier (minimum of once) and regain all uses when you finish a long rest. Potency. The damage dealt by the spell ignores all resistances. If a creature is immune to the type of damage dealt, the creature instead takes half damage. Field. The spell's area of effect increases by 10 feet. A 5-foot cube becomes a 15-foot cube, a sphere with a 20-foot radius grows to a 30-foot radius, and so on. Distance. If the spell has a range of touch, the range extends to 60 feet."],
      [14, "Primordial Conduit", "At 14th level, you learn how to harness the latent creation magic from the dawn of time still present within your scrolls' bamboo. When you cast a spell of 1st level or higher, you can use your bonus action to channel forth this primordial energy through your scrolls. For 1 minute, you gain the following benefits: An iridescent aura of sunlight forms around you — a 10-foot radius sphere centered on you. At the start of your turn, any hostile creatures within the aura must make a Constitution saving throw against your spell save DC, taking 4d8 radiant damage on a failure and half as much on a success. Your movement speed is doubled, and you gain a flying speed of 30 feet. When a creature you can see within 30 feet of you is reduced to 0 hit points, you can use your reaction to heal them; the creature immediately regains a number of hit points equal to your wizard level. Once you use this feature, you cannot use it again until you have finished a long rest.", "bonus"],
    ],
    effects: [
      { type: "acFormula", base: 10, add: ["dex", "int"], condition: "unarmored",
        label: "Durability (Mentala)", atLevel: 2 },
    ] },
  /* Babaylan Callings — book pp.168-169. Chosen at 1st level, like
     Diwata Bloodline / Volcano Domain above. */
  { id: "call-of-clairvoyance", cls: "babaylan", name: "Call of Clairvoyance", src: "sinauna",
    group: "Babaylan Calling", unlock: 1, page: 168,
    blurb: "Steeped in the unseen spirit world, learning to open their bodies as vessels.",
    features: [
      [1, "Divining Eye", "When you choose this calling at 1st level, you learn the true strike cantrip, which doesn't count against the number of babaylan cantrips you know. You can cast this cantrip as a bonus action, and you cannot lose concentration on this cantrip as a result of taking damage.", "bonus"],
      [2, "Vessel for the Spirits", "At 2nd level, you learn to open your mind and body to your abayan, allowing them to momentarily inhabit your physical form. As an action, you call upon your abayan and open yourself as a vessel for them. The abayan then enters your body. While you and your abayan share your physical form, you still have full control over your movements and actions and can still use your abayan as a spellcasting focus. Additionally, you gain advantage on all Intelligence checks to recall past knowledge or information, you add your Intelligence modifier to any saving throws made to maintain concentration on a spell or similar effect, and you can cast the spells detect evil and good, detect poison and disease, and identify once each without expending a spell slot. This state lasts for 10 minutes, or until you use your action to ask your abayan to leave your physical form, whichever happens first. Once you use this feature, you cannot do so again until you finish a short or long rest.", "action"],
      [6, "Clarity of Mind", "Starting at 6th level, you are immune to being charmed or frightened, as your connection with your abayan strengthens your mind against invasive forces."],
      [11, "Piercing Sight", "Starting at 11th level, you gain truesight out to 30 feet when using your Vessel for the Spirits feature."],
      [15, "Living Memory", "At 15th level, you learn to commune with the spirit of an object or creature and uncover their history. To do so, you must be able to touch the object or creature in question. If the spirit of the object or creature is hostile towards you, you must first succeed on an Intelligence check; you are proficient with this check. The DC for this check begins at 15, but the DM can increase or decrease this depending on your interactions towards the spirit and other outside factors. If the spirit is friendly towards you, you automatically succeed on this check. On a success, you receive glimpses of significant events in the spirit's past, beginning with the most recent. Significant events typically involve powerful emotions, such as battles and betrayals, marriages and murders, births and funerals, and other moments that may be pertinent to your current situation. The number of events you glean through this feature is equal to your Intelligence modifier (minimum of one). Once you use this feature, you cannot use it again until you finish a short or long rest."],
    ] },
  { id: "call-of-sacrifice", cls: "babaylan", name: "Call of Sacrifice", src: "sinauna",
    group: "Babaylan Calling", unlock: 1, page: 168,
    blurb: "Experts in healing and herbalism, giving up parts of themselves to restore others.",
    features: [
      [1, "Undaunted Healer", "At 1st level, your connection to the spirits bolsters your healing prowess. Whenever your abayan is within 30 feet of you and you cast a spell to restore hit points to at least one creature, you can add your proficiency bonus to the number of hit points regained by each creature."],
      [2, "Absolve Hurt", "Starting at 2nd level, all friendly creatures within 10 feet of your abayan gain a +2 bonus to saving throws made against spells and effects that deal damage. Additionally, your abayan begins to teach you how to magically seize the pain of others and pull it away. Whenever a creature other than yourself that is within 30 feet of your abayan takes damage, you can use your reaction to expend a spell slot and reduce the amount of damage the creature takes. The amount of damage reduced by this feature is equal to your babaylan level + 1d6 per spell slot level.", "reaction"],
      [6, "Yield Vitality", "At 6th level, you learn how to sacrifice some of your own vitality to restore magical energy. As an action, you can choose a creature within 30 feet of your abayan that has the ability to cast spells (including yourself). You immediately lose a number of hit points, and the chosen creature recovers one expended spell slot of a level of your choice. The number of hit points you lose when using this feature is equal to 10 × the recovered spell slot's level. If the number of hit points lost via this feature exceeds your remaining hit points by an amount greater than or equal to your hit point maximum, you die instantly. Else, if the number of hit points lost via this feature exceeds your remaining hit points but does not kill you, you fall unconscious and automatically receive one failed death saving throw.", "action"],
      [11, "Hale of Body", "Your time spent communing with spirits as a healer has strengthened your own physical form against toxins. Starting at 11th level, you are immune to all poison and disease."],
      [15, "Banish Affliction", "At 15th level, you learn to cleanse a creature of afflictions. As an action, you end one condition on yourself or on one willing creature that you touch. The condition can be blinded, cursed, deafened, frightened, paralyzed, or poisoned. You can do this a number of times equal to your Intelligence modifier (minimum of once), and regain all uses after you finish a long rest.", "action"],
    ] },
  { id: "call-of-wrath", cls: "babaylan", name: "Call of Wrath", src: "sinauna",
    group: "Babaylan Calling", unlock: 1, page: 169,
    blurb: "Wielding menacing martial prowess alongside powerful sorcery.",
    features: [
      [1, "Bonus Proficiencies", "At 1st level, you gain proficiency with medium armor, shields, and martial weapons."],
      [1, "Guided Strikes", "Also starting at 1st level, whenever you are within 10 feet of your abayan, you can use your Intelligence modifier for weapon attack and damage rolls, instead of Strength or Dexterity. At 6th level, the range of this ability increases to 30 feet from your abayan. At 15th level, you can use your Intelligence modifier for weapon attack and damage rolls regardless of how far you are from your abayan."],
      [2, "Fury of the Spirits", "Starting at 2nd level, when you take the Attack action on your turn, your abayan can also make one melee spell attack against a hostile creature within 5 feet of them. This attack uses your spell attack modifier, and on a hit, the attack deals 2d6 force damage. This damage increases when you reach certain levels in this class, increasing to 3d6 at 5th level, 4d6 at 11th level, and 6d6 at 17th level."],
      [6, "Magic Warrior", "Starting at 6th level, your weapon attacks count as magical for the purpose of overcoming resistances and immunities. Additionally, when you use your Spirit Conduit feature, you can apply the Precision and Vehemence conduit options to weapon attacks and weapon damage respectively."],
      [11, "Tempered Will", "At 11th level, your experience in battle has toughened your mind. You can no longer lose concentration on a spell as a result of taking damage."],
      [15, "Armor of Ancients", "Starting at 15th level, you can use your action to call upon the spirits of warrior babaylan past to aid you in combat. This armor lasts for 1 minute, or until you are incapacitated, during which you gain the following benefits: You are immune to bludgeoning, piercing, and slashing damage from nonmagical weapons. You gain resistance to all other types of damage. You gain a number of temporary hit points equal to your Intelligence modifier + your proficiency bonus + your level in this class. These temporary hit points can be combined with temporary hit points received from other spells and abilities. Whenever a creature hits you with a successful melee attack, they take force damage equal to 1d6 + your level in this class. Once you use this feature, you can't use it again until you finish a short or long rest.", "action"],
    ] },
  /* Headhunter Omens — book pp.173-175. Chosen at 3rd level, like the
     PHB's Ranger Archetype / Otherworldly Patron. Feature levels are
     3, 7, 14, 18 per the class table (Hunter's Omen Feature rows). */
  { id: "omen-of-knowledge", cls: "headhunter", name: "Omen of Knowledge", src: "sinauna",
    group: "Hunter's Omen", unlock: 3, page: 173,
    blurb: "Grief, but not mourning — carrying the memories of the dead as a solemn recognition of the hunt.",
    features: [
      [3, "Lessons of the Departed", "Following this Omen at 3rd level, you gain the ability to draw knowledge from those who have since passed from the mortal world. When you finish a long rest, you can gain proficiency in saving throws with one ability of your choice. You can also gain one skill or tool proficiency. These proficiencies last until you take a long rest, at the end of which you can choose to keep the same proficiencies or select new ones."],
      [3, "Memories of War", "Also at 3rd level, echoes of those you've fought still linger around you, informing your next steps along this path. When you gain this feature, choose two Memory options from the list below. You gain an additional Memory option of your choice when you reach certain levels in this class: 7th, 10th, 14th, and 18th. Memory options (presented alphabetically; a saving throw DC equals 8 + your proficiency bonus + your Intelligence modifier). The Assured Mark. When you use your Conviction feature, you gain a bonus to the force damage equal to your Intelligence modifier (minimum of +1). The Cloaked Terror. You gain darkvision out to a range of 60 feet. If you already have darkvision from another source, its range increases by 30 feet. Magical darkness no longer impedes your darkvision. The Cycle Breaker. You can add your Intelligence modifier to your initiative. As a reaction to rolling initiative, you can make one weapon attack against a creature you can see. The Guardian. When you take the Attack action on your turn, you can attack twice instead of once. You can do this a number of times equal to your Intelligence modifier (minimum of once), and regain all uses after a short or long rest. The Living Shield. You can use your bonus action to momentarily bolster your own defenses. Until the end of your next turn, you can add your Intelligence modifier (minimum of +1) to your AC. You can do this twice, and regain all uses after a long rest. The Nimble Warrior. You can use your bonus action to take either the Dash or Dodge action. The Pinning Strike. When you hit a creature with a weapon attack, you can force the creature to make a Dexterity saving throw. On a failure, the creature is restrained until the start of your next turn. You can do this a number of times equal to your Intelligence modifier (minimum of once), and regain all uses after a long rest. The Rending Blow. When you hit a creature with a weapon attack, you can force the creature to make a Constitution saving throw. On a failure, the creature has disadvantage on all attacks until the end of its next turn. You can do this a number of times equal to your Intelligence modifier (minimum of once), and regain all uses after a long rest. The Silent One. You gain proficiency in the Stealth skill, and you can use your bonus action to take the Hide action. The Unerring Eye. You can use your bonus action to center your aim, gaining advantage on the first attack roll you make this turn. You can do this twice, and regain all uses after a long rest. The Waning Might. When you hit a creature with a weapon attack, you can force the creature to make a Strength saving throw. On a failure, the damage dealt by the creature's weapon attacks is halved until the end of its next turn. You can do this a number of times equal to your Intelligence modifier (minimum of once), and regain all uses after a long rest."],
      [7, "Study Remembrance", "Starting at 7th level, when you finish a short or long rest, you can choose one damage type. You gain resistance to that damage type. This resistance lasts until you use this feature again."],
      [14, "Inescapable End", "At 14th level, you've begun to accept your role in this world as a harbinger of death — and that acceptance allows you to steel yourself even when battered down. If you roll initiative and have fewer than half your hit points remaining, you can regain hit points equal to 10 × your Intelligence modifier (minimum of 1). Once you use this feature, you can't use it again until you finish a long rest."],
      [18, "Memoriam", "As time goes on, the solemn memories you carry no longer weigh as heavy on your heart, and you can listen to their lessons more clearly. Starting at 18th level, whenever you finish a long rest, you can replace one Memory option with another option."],
      [18, "Retribution", "At 18th level, you become an avatar of violence, dealing judgement upon those who have wronged you. When you hit a creature with a weapon attack, you can deal a number of extra points of damage equal to the amount of hit points you are currently missing. Once you use this feature, you cannot use it again until you finish a short or long rest."],
    ] },
  { id: "omen-of-strife", cls: "headhunter", name: "Omen of Strife", src: "sinauna",
    group: "Hunter's Omen", unlock: 3, page: 174,
    blurb: "Some of the most formidable forces in combat, loath to let anything escape their dreadful purview.",
    errata: "The class table lists a \"Hunter's Omen Feature\" for every subclass at 18th level (matching Omen of Knowledge's Memoriam/Retribution and Omen of Swiftness's Many-Limbed Silhouette), but no 18th-level feature text for Omen of Strife appears on p.174-175 — the prose runs Bonus Proficiencies/Awestriking Presence (3rd) → Formidable Conviction (7th) → The Cost of Fear (14th) straight into the Omen of Swiftness section. Recorded as printed; possibly a book layout gap.",
    features: [
      [3, "Bonus Proficiencies", "When you choose this Omen at 3rd level, you gain proficiency with heavy armor and the Intimidation skill."],
      [3, "Awestriking Presence", "Also starting at 3rd level, your ferocity in combat brings fear into your enemies. As a bonus action, choose one creature within 30 feet that can see you. The creature must immediately make a Wisdom saving throw (DC 8 + your proficiency bonus + your Charisma modifier). On a failure, the creature's speed is reduced by 10 feet, and you have advantage on all weapon attacks against the creature; these effects last until the start of your next turn. Additionally, on a failure, you have advantage on all Charisma (Intimidation) checks made to interact with the affected creature for 10 minutes. You can use this feature a number of times equal to your Charisma modifier (minimum of once), and regain all uses after a long rest.", "bonus"],
      [7, "Formidable Conviction", "Beginning at 7th level, your might becomes an even more ominous presage of death. When you use your Conviction feature, you can add an additional 1d8 to the force damage rolled."],
      [14, "The Cost of Fear", "At 14th level, you learn to chip away at the defenses of your target, preventing their escape. When you hit a creature with a weapon attack, you can also choose to deal a −1 penalty to its AC. If this feature is used against the same creature multiple times, the penalty is cumulative. This penalty fades after 1 hour. You can do this a number of times equal to your Charisma modifier, and regain all uses after a short or long rest."],
    ] },
  { id: "omen-of-swiftness", cls: "headhunter", name: "Omen of Swiftness", src: "sinauna",
    group: "Hunter's Omen", unlock: 3, page: 175,
    blurb: "Pulled towards Amanikabli, the god of the swift hunt, becoming a channel for divine magic.",
    features: [
      [3, "Spellcasting", "When you reach 3rd level, you call upon the spirits of the hunt to augment your combat capabilities. Cantrips. You learn two cantrips of your choice from the cleric spell list. You learn an additional cleric cantrip of your choice at 10th level. Spell Slots. The Omen of Swiftness Spellcasting table shows how many spell slots you have to cast your cleric spells of 1st level and higher. To cast one of these spells, you must expend a slot of the spell's level or higher. You regain all expended spell slots when you finish a long rest. Spells Known of 1st Level and Higher. You know three 1st-level cleric spells of your choice. The Spells Known column of the Omen of Swiftness Spellcasting table shows when you learn more cleric spells of 1st level or higher. Each of these spells must be of a level for which you have spell slots. Whenever you gain a level in this class, you can replace one of the cleric spells you know with another spell of your choice from the cleric spell list. The new spell must be of a level for which you have spell slots. Spellcasting Ability. Wisdom is your spellcasting ability for your cleric spells, since your power is derived from prayer and offerings to the god Amanikabli and other spirits of the hunt. You use your Wisdom whenever a spell refers to your spellcasting ability. In addition, you use your Wisdom modifier when setting the saving throw DC for a cleric spell you cast and when making an attack roll with one. Spell save DC = 8 + your proficiency bonus + your Wisdom modifier. Spell attack modifier = your proficiency bonus + your Wisdom modifier."],
      [3, "Devoted Soul", "Also at 3rd level, your dedication to the hunt begins to shield you from harm. When you use your Conviction feature, you also gain a number of temporary hit points equal to half the force damage rolled (rounded down, minimum of 1 temporary hit point)."],
      [7, "Blessed Warrior", "Beginning at 7th level, your weapon attacks count as magical for the purposes of overcoming resistances and immunities."],
      [14, "Grim Persistence", "At 14th level, the spirits of the hunt allow you to pursue your target against all odds. On your turn, you can use your bonus action to teleport to an unoccupied space within 30 feet of your quarry as designated by your Rite of the Ancestors feature; you must be able to see your quarry in order to do this. After teleporting in this manner, you can immediately make one weapon attack against your quarry at advantage. Once you use this feature, you cannot do so again until you finish a long rest.", "bonus"],
      [18, "Many-Limbed Silhouette", "At 18th level, the legacy of the hunt flows through your blood, manifesting as a menacing shadow of violence. On your turn, when you score a critical hit with a weapon attack, you can use your bonus action to make two weapon attacks with advantage.", "bonus"],
    ],
    effects: [
      { type: "casting", ability: "wis", progression: "third", dcBase: 8,
        label: "Omen of Swiftness spellcasting", from: "cleric",
        cantrips: { 3: 2, 10: 3 }, known: { 3: 3, 4: 4, 7: 5 }, atLevel: 3 },
    ] },
];

/* ------------------------------------------------------------------
   PHB (2014) subclasses.
   Compact form: [id, class, name, [[level, "Feature"], ...], effects?]
   Feature names are from knowledge, not extracted from a source file —
   worth spot-checking against the book before a campaign relies on them.
------------------------------------------------------------------- */
export const PHB_GROUPS = {
  barbarian: "Primal Path", bard: "Bard College", cleric: "Divine Domain",
  druid: "Druid Circle", fighter: "Martial Archetype", monk: "Monastic Tradition",
  paladin: "Sacred Oath", ranger: "Ranger Archetype", rogue: "Roguish Archetype",
  sorcerer: "Sorcerous Origin", warlock: "Otherworldly Patron", wizard: "Arcane Tradition",
};
export const PHB_UNLOCK = { barbarian: 3, bard: 3, cleric: 1, druid: 2, fighter: 3, monk: 3,
  paladin: 3, ranger: 3, rogue: 3, sorcerer: 1, warlock: 1, wizard: 2 };

export const PHB_RAW = [
  ["berserker", "barbarian", "Path of the Berserker",
    [[3, "Frenzy"], [6, "Mindless Rage"], [10, "Intimidating Presence"], [14, "Retaliation"]]],
  ["totem-warrior", "barbarian", "Path of the Totem Warrior",
    [[3, "Spirit Seeker"], [3, "Totem Spirit"], [6, "Aspect of the Beast"], [10, "Spirit Walker"], [14, "Totemic Attunement"]]],

  ["college-of-lore", "bard", "College of Lore",
    [[3, "Bonus Proficiencies"], [3, "Cutting Words"], [6, "Additional Magical Secrets"], [14, "Peerless Skill"]],
    [{ type: "bonusSkills", count: 3, atLevel: 3 }]],
  ["college-of-valor", "bard", "College of Valor",
    [[3, "Bonus Proficiencies"], [3, "Combat Inspiration"], [6, "Extra Attack"], [14, "Battle Magic"]],
    [{ type: "armorProf", value: ["medium"], atLevel: 3 },
     { type: "shieldProf", atLevel: 3 },
     { type: "weaponProf", value: ["martial"], atLevel: 3 }]],

  ["knowledge-domain", "cleric", "Knowledge Domain",
    [[1, "Blessings of Knowledge"], [2, "Channel Divinity: Knowledge of the Ages"], [6, "Read Thoughts"], [8, "Potent Spellcasting"], [17, "Visions of the Past"]],
    [{ type: "bonusSkills", count: 2, atLevel: 1 }]],
  ["life-domain", "cleric", "Life Domain",
    [[1, "Bonus Proficiency"], [1, "Disciple of Life"], [2, "Channel Divinity: Preserve Life"], [6, "Blessed Healer"], [8, "Divine Strike"], [17, "Supreme Healing"]],
    [{ type: "armorProf", value: ["heavy"], atLevel: 1 }]],
  ["light-domain", "cleric", "Light Domain",
    [[1, "Bonus Cantrip"], [1, "Warding Flare"], [2, "Channel Divinity: Radiance of the Dawn"], [6, "Improved Flare"], [8, "Potent Spellcasting"], [17, "Corona of Light"]],
    [{ type: "bonusCantrips", count: 1, from: "cleric", atLevel: 1 }]],
  ["nature-domain", "cleric", "Nature Domain",
    [[1, "Acolyte of Nature"], [1, "Bonus Proficiency"], [2, "Channel Divinity: Charm Animals and Plants"], [6, "Dampen Elements"], [8, "Divine Strike"], [17, "Master of Nature"]],
    [{ type: "armorProf", value: ["heavy"], atLevel: 1 },
     { type: "bonusCantrips", count: 1, from: "druid", atLevel: 1 }]],
  ["tempest-domain", "cleric", "Tempest Domain",
    [[1, "Bonus Proficiencies"], [1, "Wrath of the Storm"], [2, "Channel Divinity: Destructive Wrath"], [6, "Thunderbolt Strike"], [8, "Divine Strike"], [17, "Stormborn"]],
    [{ type: "armorProf", value: ["heavy"], atLevel: 1 },
     { type: "weaponProf", value: ["martial"], atLevel: 1 }]],
  ["trickery-domain", "cleric", "Trickery Domain",
    [[1, "Blessing of the Trickster"], [2, "Channel Divinity: Invoke Duplicity"], [6, "Channel Divinity: Cloak of Shadows"], [8, "Divine Strike"], [17, "Improved Duplicity"]]],
  ["war-domain", "cleric", "War Domain",
    [[1, "Bonus Proficiencies"], [1, "War Priest"], [2, "Channel Divinity: Guided Strike"], [6, "Channel Divinity: War God's Blessing"], [8, "Divine Strike"], [17, "Avatar of Battle"]],
    [{ type: "armorProf", value: ["heavy"], atLevel: 1 },
     { type: "weaponProf", value: ["martial"], atLevel: 1 }]],

  ["circle-of-the-land", "druid", "Circle of the Land",
    [[2, "Bonus Cantrip"], [2, "Natural Recovery"], [6, "Land's Stride"], [10, "Nature's Ward"], [14, "Nature's Sanctuary"]],
    [{ type: "bonusCantrips", count: 1, from: "druid", atLevel: 2 }]],
  ["circle-of-the-moon", "druid", "Circle of the Moon",
    [[2, "Combat Wild Shape"], [2, "Circle Forms"], [6, "Primal Strike"], [10, "Elemental Wild Shape"], [14, "Thousand Forms"]]],

  ["champion", "fighter", "Champion",
    [[3, "Improved Critical"], [7, "Remarkable Athlete"], [10, "Additional Fighting Style"], [15, "Superior Critical"], [18, "Survivor"]]],
  ["battle-master", "fighter", "Battle Master",
    [[3, "Combat Superiority"], [3, "Student of War"], [7, "Know Your Enemy"], [10, "Improved Combat Superiority"], [15, "Relentless"]]],
  ["eldritch-knight", "fighter", "Eldritch Knight",
    [[3, "Spellcasting"], [3, "Weapon Bond"], [7, "War Magic"], [10, "Eldritch Strike"], [15, "Arcane Charge"], [18, "Improved War Magic"]],
    [{ type: "casting", ability: "int", progression: "third", dcBase: 8,
       label: "Eldritch Knight spellcasting", from: "wizard",
       cantrips: { 3: 2, 10: 3 }, known: { 3: 3, 4: 4, 7: 5 }, atLevel: 3 }]],

  ["open-hand", "monk", "Way of the Open Hand",
    [[3, "Open Hand Technique"], [6, "Wholeness of Body"], [11, "Tranquility"], [17, "Quivering Palm"]]],
  ["way-of-shadow", "monk", "Way of Shadow",
    [[3, "Shadow Arts"], [6, "Shadow Step"], [11, "Cloak of Shadows"], [17, "Opportunist"]]],
  ["four-elements", "monk", "Way of the Four Elements",
    [[3, "Disciple of the Elements"], [6, "Elemental Disciplines"], [11, "Elemental Disciplines"], [17, "Elemental Disciplines"]]],

  ["oath-of-devotion", "paladin", "Oath of Devotion",
    [[3, "Oath Spells"], [3, "Channel Divinity: Sacred Weapon"], [7, "Aura of Devotion"], [15, "Purity of Spirit"], [20, "Holy Nimbus"]]],
  ["oath-of-the-ancients", "paladin", "Oath of the Ancients",
    [[3, "Oath Spells"], [3, "Channel Divinity: Nature's Wrath"], [7, "Aura of Warding"], [15, "Undying Sentinel"], [20, "Elder Champion"]]],
  ["oath-of-vengeance", "paladin", "Oath of Vengeance",
    [[3, "Oath Spells"], [3, "Channel Divinity: Abjure Enemy"], [7, "Relentless Avenger"], [15, "Soul of Vengeance"], [20, "Avenging Angel"]]],

  ["hunter", "ranger", "Hunter",
    [[3, "Hunter's Prey"], [7, "Defensive Tactics"], [11, "Multiattack"], [15, "Superior Hunter's Defense"]]],
  ["beast-master", "ranger", "Beast Master",
    [[3, "Ranger's Companion"], [7, "Exceptional Training"], [11, "Bestial Fury"], [15, "Share Spells"]]],

  ["thief", "rogue", "Thief",
    [[3, "Fast Hands"], [3, "Second-Story Work"], [9, "Supreme Sneak"], [13, "Use Magic Device"], [17, "Thief's Reflexes"]]],
  ["assassin", "rogue", "Assassin",
    [[3, "Bonus Proficiencies"], [3, "Assassinate"], [9, "Infiltration Expertise"], [13, "Impostor"], [17, "Death Strike"]]],
  ["arcane-trickster", "rogue", "Arcane Trickster",
    [[3, "Spellcasting"], [3, "Mage Hand Legerdemain"], [9, "Magical Ambush"], [13, "Versatile Trickster"], [17, "Spell Thief"]],
    [{ type: "casting", ability: "int", progression: "third", dcBase: 8,
       label: "Arcane Trickster spellcasting", from: "wizard",
       cantrips: { 3: 3, 10: 4 }, known: { 3: 3, 4: 4, 7: 5 }, atLevel: 3 }]],

  ["draconic-bloodline", "sorcerer", "Draconic Bloodline",
    [[1, "Dragon Ancestor"], [1, "Draconic Resilience"], [6, "Elemental Affinity"], [14, "Dragon Wings"], [18, "Draconic Presence"]],
    [{ type: "acFormula", base: 13, add: ["dex"], condition: "unarmored",
       label: "Draconic Resilience", atLevel: 1 },
     { type: "hpPerLevel", value: 1, atLevel: 1 }]],
  ["wild-magic", "sorcerer", "Wild Magic",
    [[1, "Wild Magic Surge"], [1, "Tides of Chaos"], [6, "Bend Luck"], [14, "Controlled Chaos"], [18, "Spell Bombardment"]]],

  ["archfey", "warlock", "The Archfey",
    [[1, "Expanded Spell List"], [1, "Fey Presence"], [6, "Misty Escape"], [10, "Beguiling Defenses"], [14, "Dark Delirium"]]],
  ["fiend", "warlock", "The Fiend",
    [[1, "Expanded Spell List"], [1, "Dark One's Blessing"], [6, "Dark One's Own Luck"], [10, "Fiendish Resilience"], [14, "Hurl Through Hell"]]],
  ["great-old-one", "warlock", "The Great Old One",
    [[1, "Expanded Spell List"], [1, "Awakened Mind"], [6, "Entropic Ward"], [10, "Thought Shield"], [14, "Create Thrall"]]],

  ["abjuration", "wizard", "School of Abjuration",
    [[2, "Abjuration Savant"], [2, "Arcane Ward"], [6, "Projected Ward"], [10, "Improved Abjuration"], [14, "Spell Resistance"]]],
  ["conjuration", "wizard", "School of Conjuration",
    [[2, "Conjuration Savant"], [2, "Minor Conjuration"], [6, "Benign Transposition"], [10, "Focused Conjuration"], [14, "Durable Summons"]]],
  ["divination", "wizard", "School of Divination",
    [[2, "Divination Savant"], [2, "Portent"], [6, "Expert Divination"], [10, "The Third Eye"], [14, "Greater Portent"]]],
  ["enchantment", "wizard", "School of Enchantment",
    [[2, "Enchantment Savant"], [2, "Hypnotic Gaze"], [6, "Instinctive Charm"], [10, "Split Enchantment"], [14, "Alter Memories"]]],
  ["evocation", "wizard", "School of Evocation",
    [[2, "Evocation Savant"], [2, "Sculpt Spells"], [6, "Potent Cantrip"], [10, "Empowered Evocation"], [14, "Overchannel"]]],
  ["illusion", "wizard", "School of Illusion",
    [[2, "Illusion Savant"], [2, "Improved Minor Illusion"], [6, "Malleable Illusions"], [10, "Illusory Self"], [14, "Illusory Reality"]]],
  ["necromancy", "wizard", "School of Necromancy",
    [[2, "Necromancy Savant"], [2, "Grim Harvest"], [6, "Undead Thralls"], [10, "Inured to Undeath"], [14, "Command Undead"]]],
  ["transmutation", "wizard", "School of Transmutation",
    [[2, "Transmutation Savant"], [2, "Minor Alchemy"], [6, "Transmuter's Stone"], [10, "Shapechanger"], [14, "Master Transmuter"]]],
];

/* Feature text lives in phbSubclassText.js, generated by
   scripts/extract-subclasses.mjs and keyed "level|Feature Name". It is
   merged in here rather than typed into PHB_RAW so that regenerating
   it can never disturb the hand-authored `effects` arrays above. A
   feature with no text falls back to "" and renders as a bare name,
   which is what every PHB subclass did before the text was pulled. */
export const PHB_SUBCLASSES = PHB_RAW.map(([id, cls, name, features, effects]) => ({
  id, cls, name, src: "phb",
  group: PHB_GROUPS[cls], unlock: PHB_UNLOCK[cls],
  blurb: "",
  features: features.map(([lvl, fname, ...rest]) =>
    [lvl, fname, PHB_SUBCLASS_TEXT[id]?.[`${lvl}|${fname}`] || "", ...rest]),
  effects: effects || [],
}));

/* ------------------------------------------------------------------
   XGE + TCE subclasses.

   The records themselves are generated (expandedSubclasses.js); only
   the effects are hand-authored, and only where a grant maps cleanly
   onto an existing effect type. Everything else — fixed bonus cantrips
   (the Celestial's sacred flame and light), expanded spell lists (oath
   spells, circle spells, Psionic Spells), tool proficiencies, swim
   speeds, extra saving-throw proficiencies — stays in the feature text
   the reader gets, exactly as the PHB subclasses already leave their
   own expanded spell lists to prose. Inventing half-modelled versions
   of those for the new books only would make the app less predictable,
   not more capable.
------------------------------------------------------------------- */
const EXPANDED_EFFECTS = {
  /* Bard */
  "college-of-swords": [
    { type: "armorProf", value: ["medium"] },
    { type: "weaponProf", specific: ["scimitar"] },
  ],
  /* Cleric */
  "forge-domain": [{ type: "armorProf", value: ["heavy"] }],
  "order-domain": [
    { type: "armorProf", value: ["heavy"] },
    { type: "bonusSkills", count: 1, from: ["Intimidation", "Persuasion"] },
  ],
  "peace-domain": [
    { type: "bonusSkills", count: 1, from: ["Insight", "Performance", "Persuasion"] },
  ],
  "twilight-domain": [
    { type: "armorProf", value: ["heavy"] },
    { type: "weaponProf", value: ["martial"] },
  ],
  /* Fighter */
  "arcane-archer": [{ type: "bonusSkills", count: 1, from: ["Arcana", "Nature"] }],
  "cavalier": [{ type: "bonusSkills", count: 1,
    from: ["Animal Handling", "History", "Insight", "Performance", "Persuasion"] }],
  /* Samurai's alternative is a language rather than a skill; the skill
     is the branch worth modelling, and the feature text carries both. */
  "samurai": [{ type: "bonusSkills", count: 1,
    from: ["History", "Insight", "Performance", "Persuasion"] }],
  "rune-knight": [{ type: "languages", value: ["Giant"] }],
  /* Monk */
  "way-of-the-drunken-master": [{ type: "skillProf", value: ["Performance"] }],
  "way-of-mercy": [{ type: "skillProf", value: ["Insight", "Medicine"] }],
  /* Ranger */
  "fey-wanderer": [{ type: "bonusSkills", count: 1,
    from: ["Deception", "Performance", "Persuasion"] }],
  /* Rogue */
  "scout": [{ type: "skillProf", value: ["Nature", "Survival"] }],
  /* Sorcerer */
  "shadow-magic": [{ type: "darkvision", value: 120 }],
  "storm-sorcery": [{ type: "languages", value: ["Primordial"] }],
  /* Warlock */
  "the-hexblade": [
    { type: "armorProf", value: ["medium"] },
    { type: "shieldProf" },
    { type: "weaponProf", value: ["martial"] },
  ],
  /* Wizard */
  "bladesinging": [
    { type: "armorProf", value: ["light"] },
    { type: "skillProf", value: ["Performance"] },
  ],
};

export const EXPANDED_SUBCLASSES = EXPANDED_SUBCLASS_RAW.map((s) => ({
  ...s,
  group: PHB_GROUPS[s.cls],
  unlock: PHB_UNLOCK[s.cls],
  effects: EXPANDED_EFFECTS[s.id] || [],
}));

export const ALL_SUBCLASSES = [
  ...SINA_UNA_SUBCLASSES, ...PHB_SUBCLASSES, ...EXPANDED_SUBCLASSES,
];
