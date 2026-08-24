import React, { useState, useMemo } from "react";

/* ------------------------------------------------------------------
   SRD base races (SRD 5.1, CC-BY-4.0, Wizards of the Coast).
   Only the fields the creator needs. Sina Una variants subtract from
   these via `replaces`.
------------------------------------------------------------------- */
const BASE_RACES = {
  "half-orc": {
    name: "Half-Orc", speed: 30, size: "Medium", darkvision: 60,
    asi: { str: 2, con: 1 },
    traits: [
      { name: "Darkvision", text: "See in dim light within 60 feet as if bright light." },
      { name: "Menacing", text: "Proficiency in Intimidation.", skills: ["Intimidation"] },
      { name: "Relentless Endurance", text: "Drop to 1 hit point instead of 0 once per long rest." },
      { name: "Savage Attacks", text: "Roll one extra weapon damage die on a melee critical hit." },
    ],
    languages: ["Common", "Orc"],
  },
  dragonborn: {
    name: "Dragonborn", speed: 30, size: "Medium", darkvision: 0,
    asi: { str: 2, cha: 1 },
    traits: [
      { name: "Draconic Ancestry", text: "Choose a dragon type; sets breath weapon and resistance." },
      { name: "Breath Weapon", text: "Exhale destructive energy in a line or cone." },
      { name: "Damage Resistance", text: "Resistance to your ancestry's damage type." },
    ],
    languages: ["Common", "Draconic"],
  },
  dwarf: {
    name: "Dwarf", speed: 25, size: "Medium", darkvision: 60,
    asi: { con: 2 },
    traits: [
      { name: "Darkvision", text: "See in dim light within 60 feet as if bright light." },
      { name: "Dwarven Resilience", text: "Advantage on saves against poison; resistance to poison damage." },
      { name: "Dwarven Combat Training", text: "Proficiency with battleaxe, handaxe, light hammer, warhammer." },
      { name: "Stonecunning", text: "Doubled proficiency on History checks about stonework." },
    ],
    languages: ["Common", "Dwarvish"],
  },
  elf: {
    name: "Elf", speed: 30, size: "Medium", darkvision: 60,
    asi: { dex: 2 },
    traits: [
      { name: "Darkvision", text: "See in dim light within 60 feet as if bright light." },
      { name: "Keen Senses", text: "Proficiency in Perception.", skills: ["Perception"] },
      { name: "Fey Ancestry", text: "Advantage on saves against being charmed; magic can't put you to sleep." },
      { name: "Trance", text: "Meditate 4 hours instead of sleeping 8." },
    ],
    languages: ["Common", "Elvish"],
  },
  gnome: {
    name: "Gnome", speed: 25, size: "Small", darkvision: 60,
    asi: { int: 2 },
    traits: [
      { name: "Darkvision", text: "See in dim light within 60 feet as if bright light." },
      { name: "Gnome Cunning", text: "Advantage on Int, Wis, and Cha saves against magic." },
    ],
    languages: ["Common", "Gnomish"],
  },
  halfling: {
    name: "Halfling", speed: 25, size: "Small", darkvision: 0,
    asi: { dex: 2 },
    traits: [
      { name: "Lucky", text: "Reroll a 1 on an attack roll, ability check, or save." },
      { name: "Brave", text: "Advantage on saves against being frightened." },
      { name: "Halfling Nimbleness", text: "Move through the space of any larger creature." },
    ],
    languages: ["Common", "Halfling"],
  },
  tiefling: {
    name: "Tiefling", speed: 30, size: "Medium", darkvision: 60,
    asi: { int: 1, cha: 2 },
    traits: [
      { name: "Darkvision", text: "See in dim light within 60 feet as if bright light." },
      { name: "Hellish Resistance", text: "Resistance to fire damage." },
      { name: "Infernal Legacy", text: "Know thaumaturgy; later hellish rebuke and darkness." },
    ],
    languages: ["Common", "Infernal"],
  },
  human: {
    name: "Human", speed: 30, size: "Medium", darkvision: 0,
    asi: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    traits: [],
    languages: ["Common", "+1 of your choice"],
  },
  "half-elf": {
    name: "Half-Elf", speed: 30, size: "Medium", darkvision: 60,
    asi: {},
    traits: [
      { name: "Darkvision", text: "See in dim light within 60 feet as if bright light." },
      { name: "Fey Ancestry", text: "Advantage on saves against being charmed; magic can't put you to sleep." },
      { name: "Skill Versatility", text: "Proficiency in two skills of your choice." },
    ],
    languages: ["Common", "Elvish", "+1 of your choice"],
  },
};

/* ------------------------------------------------------------------
   Sina Una ancestries — extracted from book pp. 158-161.
------------------------------------------------------------------- */
/* ------------------------------------------------------------------
   LINEAGES
   Sina Una doesn't define standalone races — every option modifies a
   PHB race, either as a subrace (additive) or a race variant
   (substitutive, via `replaces`). PHB subraces occupy the same slot,
   so both sources merge into one pool per base race.

   kind: "subrace"  — stacks on the base race
         "variant"  — replaces the listed base traits
         "standard" — the base race unmodified
------------------------------------------------------------------- */
const LINEAGES = [
  /* ---- DWARF ---- */
  { id: "volcano-dwarf", base: "dwarf", name: "Volcano Dwarf", src: "sinauna",
    kind: "subrace", page: 159,
    blurb: "Magma formations rise on their skin; their hair trails like ash.",
    asi: { fixed: { int: 1 } }, replaces: [],
    traits: [{ name: "Molten Armor", text: "Bonus action: temporary hit points equal to your level for 1 hour. Melee attackers take fire damage equal to your level. Once per long rest." }] },
  { id: "hill-dwarf", base: "dwarf", name: "Hill Dwarf", src: "phb", kind: "subrace",
    asi: { fixed: { wis: 1 } }, replaces: [],
    traits: [{ name: "Dwarven Toughness", text: "Your hit point maximum increases by 1 per level." }],
    effects: [{ type: "hpPerLevel", value: 1 }] },
  { id: "mountain-dwarf", base: "dwarf", name: "Mountain Dwarf", src: "phb", kind: "subrace",
    asi: { fixed: { str: 2 } }, replaces: [],
    traits: [{ name: "Dwarven Armor Training", text: "Proficiency with light and medium armor." }],
    effects: [{ type: "armorProf", value: ["light", "medium"] }] },

  /* ---- ELF ---- */
  { id: "balete-elf", base: "elf", name: "Balete Elf", src: "sinauna", kind: "subrace", page: 160,
    blurb: "Plant roots, like those of a balete tree, grow throughout their hair.",
    asi: { fixed: { wis: 1 } }, replaces: [],
    traits: [
      { name: "Verdant Intuition", text: "Add 1d4 to Intelligence (Nature) and Wisdom (Survival) checks." },
      { name: "Spirit of Nature", text: "Know druidcraft. Cast entangle at 3rd level and barkskin at 5th, once each per long rest." }] },
  { id: "high-elf", base: "elf", name: "High Elf", src: "phb", kind: "subrace",
    asi: { fixed: { int: 1 } }, replaces: [],
    traits: [
      { name: "Elf Weapon Training", text: "Proficiency with longsword, shortsword, shortbow, longbow." },
      { name: "Cantrip", text: "You know one cantrip from the wizard spell list. Intelligence is your spellcasting ability." },
      { name: "Extra Language", text: "You can speak, read, and write one extra language." }],
    effects: [{ type: "bonusCantrips", count: 1, from: "wizard" }] },
  { id: "wood-elf", base: "elf", name: "Wood Elf", src: "phb", kind: "subrace",
    asi: { fixed: { wis: 1 } }, replaces: [],
    traits: [
      { name: "Elf Weapon Training", text: "Proficiency with longsword, shortsword, shortbow, longbow." },
      { name: "Fleet of Foot", text: "Your base walking speed increases to 35 feet." },
      { name: "Mask of the Wild", text: "You can attempt to hide when lightly obscured by natural phenomena." }],
    effects: [{ type: "speed", value: 35 }] },
  { id: "dark-elf", base: "elf", name: "Dark Elf (Drow)", src: "phb", kind: "subrace",
    asi: { fixed: { cha: 1 } }, replaces: [],
    traits: [
      { name: "Superior Darkvision", text: "Your darkvision has a radius of 120 feet." },
      { name: "Sunlight Sensitivity", text: "Disadvantage on attack rolls and Perception checks in direct sunlight." },
      { name: "Drow Magic", text: "Know dancing lights. Faerie fire at 3rd level, darkness at 5th, once each per long rest." },
      { name: "Drow Weapon Training", text: "Proficiency with rapiers, shortswords, hand crossbows." }],
    effects: [{ type: "darkvision", value: 120 }, { type: "bonusCantrips", count: 1, from: "drow" }] },

  /* ---- GNOME ---- */
  { id: "gold-gnome", base: "gnome", name: "Gold Gnome", src: "sinauna", kind: "subrace", page: 160,
    blurb: "Born with tattoo-like patterns that take on the lustrous hue of their namesake.",
    asi: { fixed: { cha: 1 } }, replaces: [],
    traits: [
      { name: "Keen Eyes", text: "Proficiency in Perception.", skills: ["Perception"] },
      { name: "Gilded Gifts", text: "During a long rest, gild armor, tools, or a weapon for 24 hours." }] },
  { id: "forest-gnome", base: "gnome", name: "Forest Gnome", src: "phb", kind: "subrace",
    asi: { fixed: { dex: 1 } }, replaces: [],
    traits: [
      { name: "Natural Illusionist", text: "You know the minor illusion cantrip. Intelligence is your spellcasting ability." },
      { name: "Speak with Small Beasts", text: "You can communicate simple ideas to Small or smaller beasts." }],
    effects: [{ type: "bonusCantrips", count: 1, from: "wizard" }] },
  { id: "rock-gnome", base: "gnome", name: "Rock Gnome", src: "phb", kind: "subrace",
    asi: { fixed: { con: 1 } }, replaces: [],
    traits: [
      { name: "Artificer's Lore", text: "Double proficiency on History checks about magic or technological items." },
      { name: "Tinker", text: "Proficiency with tinker's tools; construct tiny clockwork devices." }] },

  /* ---- HALFLING ---- */
  { id: "mangrove-halfling", base: "halfling", name: "Mangrove Halfling", src: "sinauna", kind: "subrace", page: 161,
    blurb: "Mangrove-root patterns mark their hands, chin, or back.",
    asi: { fixed: { int: 1 } }, replaces: [],
    traits: [
      { name: "Natural Craftsmanship", text: "You know the mending cantrip." },
      { name: "Quick Thinker", text: "Take the Help action as a bonus action." }] },
  { id: "lightfoot-halfling", base: "halfling", name: "Lightfoot Halfling", src: "phb", kind: "subrace",
    asi: { fixed: { cha: 1 } }, replaces: [],
    traits: [{ name: "Naturally Stealthy", text: "You can hide even when obscured only by a creature at least one size larger." }] },
  { id: "stout-halfling", base: "halfling", name: "Stout Halfling", src: "phb", kind: "subrace",
    asi: { fixed: { con: 1 } }, replaces: [],
    traits: [{ name: "Stout Resilience", text: "Advantage on saves against poison; resistance to poison damage." }] },

  /* ---- HALF-ORC ---- */
  { id: "balat-kayo", base: "half-orc", name: "Balat-Kayo", src: "sinauna", kind: "variant", page: 158,
    blurb: "Made in the image of Haliya's tusked mask. Starlight traces their skin; their eyes are silver.",
    asi: { fixed: { cha: 2 }, choice: { count: 1, amount: 1, from: ["str", "dex"] } },
    replaces: ["Ability Score Increase", "Menacing", "Savage Attacks", "Languages"],
    traits: [
      { name: "Weapon Training", text: "Proficiency with simple and martial weapons." },
      { name: "Blessing of Haliya", text: "Cast alarm, detect poison and disease, and identify as rituals, once each per long rest. A further ritual spell at 3rd and 5th level. Charisma is your spellcasting ability." }],
    languages: ["Common", "Sylvan"] },
  { id: "half-orc-standard", base: "half-orc", name: "Half-Orc", src: "phb", kind: "standard",
    asi: { fixed: {} }, replaces: [], traits: [] },

  /* ---- DRAGONBORN ---- */
  { id: "umalagad-dragonborn", base: "dragonborn", name: "Umalagad Dragonborn", src: "sinauna", kind: "variant", page: 159,
    blurb: "Albino, python- and crocodile-aspected, living a second life with nothing of the first but a name.",
    asi: { fixed: { wis: 2, con: 1 } },
    replaces: ["Ability Score Increase", "Draconic Ancestry", "Breath Weapon", "Damage Resistance", "Languages"],
    traits: [
      { name: "Blindsight", text: "Blindsight out to 30 feet.", blindsight: 30 },
      { name: "Ancestral Protection", text: "Know guidance. Cast sanctuary at 3rd level and warding bond at 5th, once each per long rest. Wisdom is your spellcasting ability." }],
    languages: ["Common", "+1 of your choice"] },
  { id: "dragonborn-standard", base: "dragonborn", name: "Dragonborn", src: "phb", kind: "standard",
    asi: { fixed: {} }, replaces: [], traits: [] },

  /* ---- TIEFLING ---- */
  { id: "carabao-tiefling", base: "tiefling", name: "Carabao Tiefling", src: "sinauna", kind: "variant", page: 161,
    blurb: "Horned like the water buffalo, strong and resilient, close to the land they steward.",
    asi: { fixed: { str: 2, con: 1 } },
    replaces: ["Ability Score Increase", "Hellish Resistance", "Infernal Legacy", "Languages"],
    traits: [
      { name: "Immovable", text: "Advantage on saves against being knocked prone, pushed, grappled, or restrained." },
      { name: "Legacy of Might", text: "Proficiency in Athletics. Deal maximum melee weapon damage a number of times equal to your Strength modifier per long rest.", skills: ["Athletics"] }],
    languages: ["Common", "+1 of your choice"] },
  { id: "tiefling-standard", base: "tiefling", name: "Tiefling", src: "phb", kind: "standard",
    blurb: "Deer tieflings use the standard tiefling as printed.",
    asi: { fixed: {} }, replaces: [], traits: [] },

  /* ---- HUMAN / HALF-ELF — Sina Una gives lore only, so PHB stands ---- */
  { id: "human-standard", base: "human", name: "Human", src: "phb", kind: "standard",
    asi: { fixed: {} }, replaces: [], traits: [] },
  { id: "human-variant", base: "human", name: "Variant Human", src: "phb", kind: "variant",
    replaces: ["Ability Score Increase"],
    asi: { fixed: {}, choice: { count: 2, amount: 1, from: ["str", "dex", "con", "int", "wis", "cha"] } },
    traits: [
      { name: "Skills", text: "Proficiency in one skill of your choice." },
      { name: "Feat", text: "You gain one feat of your choice." }] },
  { id: "half-elf-standard", base: "half-elf", name: "Half-Elf", src: "phb", kind: "standard",
    blurb: "In the islands, half-elves are nature spirits from wild flowers rather than elf offspring — flavour only, no new mechanics.",
    asi: { fixed: { cha: 2 }, choice: { count: 2, amount: 1, from: ["str", "dex", "con", "int", "wis"] } },
    replaces: [], traits: [] },
];

const BASE_RACE_ORDER = ["dwarf", "elf", "gnome", "halfling", "half-orc", "dragonborn", "tiefling", "human", "half-elf"];

/* ------------------------------------------------------------------
   Class chassis (SRD 5.1, CC-BY-4.0). Level 1 only.
------------------------------------------------------------------- */
const CLASSES = {
  barbarian: { name: "Barbarian", hitDie: 12, saves: ["Strength", "Constitution"], skillCount: 2,
    skills: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"],
    armor: "Light, medium, shields", weapons: "Simple, martial",
    armorProf: ["light", "medium"], shield: true, unarmored: { name: "Unarmored Defense", add: "con" } },
  bard: { name: "Bard", hitDie: 8, saves: ["Dexterity", "Charisma"], skillCount: 3, skills: "any",
    armor: "Light", weapons: "Simple, hand crossbow, longsword, rapier, shortsword",
    armorProf: ["light"], shield: false },
  cleric: { name: "Cleric", hitDie: 8, saves: ["Wisdom", "Charisma"], skillCount: 2,
    skills: ["History", "Insight", "Medicine", "Persuasion", "Religion"],
    armor: "Light, medium, shields", weapons: "Simple",
    armorProf: ["light", "medium"], shield: true },
  druid: { name: "Druid", hitDie: 8, saves: ["Intelligence", "Wisdom"], skillCount: 2,
    skills: ["Arcana", "Animal Handling", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"],
    armor: "Light, medium, shields (nonmetal)", weapons: "Clubs, daggers, darts, javelins, maces, quarterstaffs, scimitars, sickles, slings, spears",
    armorProf: ["light", "medium"], shield: true, noMetal: true },
  fighter: { name: "Fighter", hitDie: 10, saves: ["Strength", "Constitution"], skillCount: 2,
    skills: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
    armor: "All armor, shields", weapons: "Simple, martial",
    armorProf: ["light", "medium", "heavy"], shield: true },
  monk: { name: "Monk", hitDie: 8, saves: ["Strength", "Dexterity"], skillCount: 2,
    skills: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"],
    armor: "None", weapons: "Simple, shortswords",
    armorProf: [], shield: false, unarmored: { name: "Unarmored Defense", add: "wis", noShield: true } },
  paladin: { name: "Paladin", hitDie: 10, saves: ["Wisdom", "Charisma"], skillCount: 2,
    skills: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"],
    armor: "All armor, shields", weapons: "Simple, martial",
    armorProf: ["light", "medium", "heavy"], shield: true },
  ranger: { name: "Ranger", hitDie: 10, saves: ["Strength", "Dexterity"], skillCount: 3,
    skills: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"],
    armor: "Light, medium, shields", weapons: "Simple, martial",
    armorProf: ["light", "medium"], shield: true },
  rogue: { name: "Rogue", hitDie: 8, saves: ["Dexterity", "Intelligence"], skillCount: 4,
    skills: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"],
    armor: "Light", weapons: "Simple, hand crossbow, longsword, rapier, shortsword",
    armorProf: ["light"], shield: false },
  sorcerer: { name: "Sorcerer", hitDie: 6, saves: ["Constitution", "Charisma"], skillCount: 2,
    skills: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"],
    armor: "None", weapons: "Daggers, darts, slings, quarterstaffs, light crossbows",
    armorProf: [], shield: false },
  warlock: { name: "Warlock", hitDie: 8, saves: ["Wisdom", "Charisma"], skillCount: 2,
    skills: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"],
    armor: "Light", weapons: "Simple",
    armorProf: ["light"], shield: false },
  wizard: { name: "Wizard", hitDie: 6, saves: ["Intelligence", "Wisdom"], skillCount: 2,
    skills: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
    armor: "None", weapons: "Daggers, darts, slings, quarterstaffs, light crossbows",
    armorProf: [], shield: false },
};

/* Armor (SRD 5.1, CC-BY-4.0). maxDex null = no cap. */
const ARMOR = [
  { id: "none", name: "No armor", cat: "none", base: 10, maxDex: null },
  { id: "padded", name: "Padded", cat: "light", base: 11, maxDex: null, stealth: true },
  { id: "leather", name: "Leather", cat: "light", base: 11, maxDex: null },
  { id: "studded", name: "Studded leather", cat: "light", base: 12, maxDex: null },
  { id: "hide", name: "Hide", cat: "medium", base: 12, maxDex: 2 },
  { id: "chain-shirt", name: "Chain shirt", cat: "medium", base: 13, maxDex: 2, metal: true },
  { id: "scale", name: "Scale mail", cat: "medium", base: 14, maxDex: 2, stealth: true, metal: true },
  { id: "breastplate", name: "Breastplate", cat: "medium", base: 14, maxDex: 2, metal: true },
  { id: "half-plate", name: "Half plate", cat: "medium", base: 15, maxDex: 2, stealth: true, metal: true },
  { id: "ring", name: "Ring mail", cat: "heavy", base: 14, maxDex: 0, stealth: true, metal: true },
  { id: "chain-mail", name: "Chain mail", cat: "heavy", base: 16, maxDex: 0, stealth: true, metal: true, strReq: 13 },
  { id: "splint", name: "Splint", cat: "heavy", base: 17, maxDex: 0, stealth: true, metal: true, strReq: 15 },
  { id: "plate", name: "Plate", cat: "heavy", base: 18, maxDex: 0, stealth: true, metal: true, strReq: 15 },
];

const ALL_SKILLS = ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History",
  "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance",
  "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"];

/* ------------------------------------------------------------------
   Sina Una subclasses — book pp. 176-196.
------------------------------------------------------------------- */
const SINA_UNA_SUBCLASSES = [
  { id: "path-of-the-black-river", cls: "barbarian", name: "Path of the Black River", src: "sinauna",
    group: "Primal Path", unlock: 3, page: 176,
    blurb: "Not the river's attendant or its traveller, but its servant.",
    features: [[3, "Isolation of the Soul"], [6, "Treading Rampage"], [10, "Living Tide"], [14, "Burial Shroud"]] },
  { id: "college-of-siday", cls: "bard", name: "College of Siday", src: "sinauna",
    group: "Bard College", unlock: 3, page: 177,
    blurb: "Keepers of the epic poem, dancing to the heartbeat of history.",
    features: [[3, "Noble Fortitude"], [3, "Folkloric Epics"], [6, "Bolstering Verse"], [14, "The Footsteps of Heroes"]] },
  { id: "volcano-domain", cls: "cleric", name: "Volcano Domain", src: "sinauna",
    group: "Divine Domain", unlock: 1, page: 178,
    blurb: "To see only destruction is fear; to see only growth is naive. You are ruled by neither.",
    features: [[1, "Domain Cleric spells"], [1, "Volcanic Calling"], [2, "Channel Divinity"], [6, "Revitalize and Renew"], [8, "Divine Strike"], [17, "Igneous Scion"]] },
  { id: "circle-of-tides", cls: "druid", name: "Circle of Tides", src: "sinauna",
    group: "Druid Circle", unlock: 2, page: 180,
    blurb: "The sea does not care who it harms. The only way to survive is to adapt and grow.",
    features: [[2, "Quiet Undercurrent"], [2, "Adaptation"], [6, "Ebb and Flow"], [10, "Shifting Sands"], [14, "Increased Adaptation"]] },
  { id: "kawal", cls: "fighter", name: "Kawal", src: "sinauna",
    group: "Martial Archetype", unlock: 3, page: 181,
    blurb: "A battle is not just a fight. It is a thundering race to ward away all harm.",
    features: [[3, "Steadfast Protector"], [3, "Guardian Roar"], [7, "Counter Destruction"], [10, "Resolute Loyalty"], [15, "Warrior's Legacy"], [18, "Peerless Defense"]] },
  { id: "way-of-kaluluwa", cls: "monk", name: "Way of Kaluluwa", src: "sinauna",
    group: "Monastic Tradition", unlock: 3, page: 183,
    blurb: "Split body and soul willingly, and have both fight alongside each other.",
    features: [[3, "Schism of Self"], [3, "Temperament of the Soul"], [6, "Diversion of Magic"], [11, "Refinement of Aspects"], [17, "Untethered Forms"]] },
  { id: "oath-of-blood", cls: "paladin", name: "Oath of Blood", src: "sinauna",
    group: "Sacred Oath", unlock: 3, page: 185,
    blurb: "You become a part of the one you swear to, and they become a part of you.",
    features: [[3, "Oath Spells"], [3, "Channel Divinity"], [7, "Sanguine Light (10 ft.)"], [15, "Resilient Guardian"], [18, "Sanguine Light (30 ft.)"], [20, "Avatar of Sacrifice"]] },
  { id: "mangangayaw", cls: "ranger", name: "Mangangayaw", src: "sinauna",
    group: "Ranger Archetype", unlock: 3, page: 186,
    blurb: "Always faster to embrace the fight, always ready to cut them all down.",
    features: [[3, "Innate Speech"], [3, "Striker's March"], [7, "Lowering Strikes"], [11, "Undertow"], [15, "Eternal March"]] },
  { id: "graverobber", cls: "rogue", name: "Graverobber", src: "sinauna",
    group: "Roguish Archetype", unlock: 3, page: 188,
    blurb: "You took the malignant nature of a curse and turned it into a gift.",
    features: [[3, "Cursed Magic"], [3, "Anathema"], [9, "Eldritch Secrets"], [13, "Afflict Ruin"], [17, "Shroud of Desecration"]],
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
    features: [[1, "Spirit's Cunning"], [1, "Sorcerous Nature"], [6, "Icon of the Spirit"], [14, "Icon's Territory"], [18, "Nature's Unending Reach"]],
    grants: { skills: ["Nature"], languages: ["Sylvan"] } },
  { id: "mooneater-patron", cls: "warlock", name: "Mooneater Patron", src: "sinauna",
    group: "Otherworldly Patron", unlock: 1, page: 192,
    blurb: "The Celestial Eaters loom over the islands, waiting to incite the end of the world.",
    features: [[1, "Expanded Spell List"], [1, "Celestial Yearning"], [1, "Agent of Destruction"], [6, "Devour Essence"], [10, "Eclipsing Fear"], [14, "Cataclysmic Hunger"]] },
  { id: "mentala", cls: "wizard", name: "Mentala", src: "sinauna",
    group: "Arcane Tradition", unlock: 2, page: 196,
    blurb: "The art of scribing spells onto bamboo scrolls.",
    features: [[2, "Durability"], [2, "Shared Scrolls"], [6, "Scribe's Malediction"], [10, "Bendable Magic"], [14, "Primordial Conduit"]],
    effects: [
      { type: "acFormula", base: 10, add: ["dex", "int"], condition: "unarmored",
        label: "Durability (Mentala)", atLevel: 2 },
    ] },
];

/* ------------------------------------------------------------------
   PHB (2014) subclasses.
   Compact form: [id, class, name, [[level, "Feature"], ...], effects?]
   Feature names are from knowledge, not extracted from a source file —
   worth spot-checking against the book before a campaign relies on them.
------------------------------------------------------------------- */
const PHB_GROUPS = {
  barbarian: "Primal Path", bard: "Bard College", cleric: "Divine Domain",
  druid: "Druid Circle", fighter: "Martial Archetype", monk: "Monastic Tradition",
  paladin: "Sacred Oath", ranger: "Ranger Archetype", rogue: "Roguish Archetype",
  sorcerer: "Sorcerous Origin", warlock: "Otherworldly Patron", wizard: "Arcane Tradition",
};
const PHB_UNLOCK = { barbarian: 3, bard: 3, cleric: 1, druid: 2, fighter: 3, monk: 3,
  paladin: 3, ranger: 3, rogue: 3, sorcerer: 1, warlock: 1, wizard: 2 };

const PHB_RAW = [
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

const PHB_SUBCLASSES = PHB_RAW.map(([id, cls, name, features, effects]) => ({
  id, cls, name, src: "phb",
  group: PHB_GROUPS[cls], unlock: PHB_UNLOCK[cls],
  blurb: "", features, effects: effects || [],
}));

const ALL_SUBCLASSES = [...SINA_UNA_SUBCLASSES, ...PHB_SUBCLASSES];

/* ------------------------------------------------------------------
   Sina Una backgrounds — book pp. 198-202.
------------------------------------------------------------------- */
const BACKGROUNDS = [
  { id: "lorechanter", name: "Lorechanter", page: 198,
    blurb: "History is no mere thing to let slip by, but something to be celebrated.",
    skills: { choose: 2, from: ["History", "Nature", "Religion"] },
    tools: [], langs: 2,
    equipment: ["A bamboo scroll", "A set of writing implements", "A token from your home village", "Common clothes", "10 gp"],
    feature: { name: "Living Memory", text: "Advantage on all checks to recall histories or legends from or related to your home island." } },
  { id: "mangangalakal", name: "Mangangalakal", page: 199,
    blurb: "Well versed in trade and worth, travelling the routes that connect one community to another.",
    skills: { choose: 2, from: ["Deception", "Investigation", "Insight", "Persuasion"] },
    tools: ["Vehicles (Water)"], langs: 1,
    equipment: ["A betel nut kit", "Merchant's scales", "A vial of perfume", "Fine clothes", "20 gp"],
    feature: { name: "Shrewd Tongue", text: "Advantage on all checks made to haggle or discern the true value of a good or service." } },
  { id: "panday", name: "Panday", page: 199,
    blurb: "A crafter of dedicated skill, on the road to total mastery.",
    skills: { fixed: ["Perception", "Performance", "Sleight of Hand"] },
    tools: ["One set of artisan's tools"], langs: 0,
    equipment: ["Artisan's tools of your choice", "A hammer", "A whetstone", "Common clothes", "15 gp"],
    feature: { name: "Skilled Artisan", text: "Crafting or repairing something related to your specialization costs half the usual materials." },
    choice: { id: "specialization", name: "Specialization",
      note: "Pandays dedicate their lifetimes to perfecting one particular craft.",
      options: ["Weapons Smith", "Shipwright", "Carpenter", "Goldworker"] } },
  { id: "sea-raider", name: "Sea Raider", page: 200,
    blurb: "You began sailing when others first learn to farm, and learned the ways of combat at sea.",
    skills: { fixed: ["Athletics", "Intimidation"] },
    tools: ["Vehicles (Water)"], langs: 1,
    equipment: ["A bolo or bangkaw", "A grappling hook", "Common clothes", "10 gp"],
    feature: { name: "Fearsome Sailor", text: "When you hit a boat and roll damage, you can reroll one damage die. You must use the second roll." } },
  { id: "voyager", name: "Voyager", page: 201,
    blurb: "Where others visit the sea and return to land, you are a mere visitor on the ground.",
    skills: { fixed: ["Perception", "Survival"] },
    tools: ["Hunter's kit", "Vehicles (Water)"], langs: 0,
    equipment: ["Fishing tackle", "A hunter's kit", "Traveler's clothes", "10 gp"],
    feature: { name: "Uncharted Depths", text: "You can hold your breath for a minimum of 5 minutes, regardless of your Constitution modifier." } },
  { id: "aswang-lineage", name: "Aswang Lineage", page: 202,
    blurb: "One member of your family is taboo personified. You are related to an aswang.",
    skills: { fixed: ["Deception", "Stealth"] },
    tools: ["One of your choice"], langs: 0, fixedLangs: ["Abyssal"],
    equipment: ["A bronze mirror", "A flask of saltwater", "Traveler's clothes", "10 gp"],
    feature: { name: "Sinister Visage", text: "Advantage on any check made to terrify or unnerve someone." },
    choice: { id: "embodiment", name: "Embodiment of Wrong",
      note: "Every aswang embodies one of a society's most sinister desires.",
      options: ["Irreverence", "Uncleanliness", "Dishonesty", "Violence", "Greed", "Gluttony"] } },
];

/* ------------------------------------------------------------------
   PHB (2014) spells, levels 0-3 — the reachable range at level 5.
   Extracted from the class spell lists: name, level, and which classes
   may take it. Casting time, components and rules text are NOT in the
   source file, so they are deliberately absent rather than guessed —
   look those up in the book. Island spells carry full detail.

   Class codes: b bard · c cleric · d druid · p paladin
                r ranger · s sorcerer · k warlock · w wizard
------------------------------------------------------------------- */
const PHB_SPELL_RAW = [
  ["Acid Splash",0,"sw"],
  ["Blade Ward",0,"bskw"],
  ["Chill Touch",0,"skw"],
  ["Dancing Lights",0,"bsw"],
  ["Druidcraft",0,"d"],
  ["Eldritch Blast",0,"k"],
  ["Fire Bolt",0,"sw"],
  ["Friends",0,"bskw"],
  ["Guidance",0,"cd"],
  ["Light",0,"bcsw"],
  ["Mage Hand",0,"bskw"],
  ["Mending",0,"bcdsw"],
  ["Message",0,"bsw"],
  ["Minor Illusion",0,"bskw"],
  ["Poison Spray",0,"dskw"],
  ["Prestidigitation",0,"bskw"],
  ["Produce Flame",0,"d"],
  ["Ray of Frost",0,"sw"],
  ["Resistance",0,"cd"],
  ["Sacred Flame",0,"c"],
  ["Shillelagh",0,"d"],
  ["Shocking Grasp",0,"sw"],
  ["Spare the Dying",0,"c"],
  ["Thaumaturgy",0,"c"],
  ["Thorn Whip",0,"d"],
  ["True Strike",0,"bskw"],
  ["Vicious Mockery",0,"b"],
  ["Alarm",1,"rw"],
  ["Animal Friendship",1,"bdr"],
  ["Armor of Agathys",1,"k"],
  ["Arms of Hadar",1,"k"],
  ["Bane",1,"bc"],
  ["Bless",1,"cp"],
  ["Burning Hands",1,"sw"],
  ["Charm Person",1,"bdskw"],
  ["Chromatic Orb",1,"sw"],
  ["Color Spray",1,"sw"],
  ["Command",1,"cp"],
  ["Compelled Duel",1,"p"],
  ["Comprehend Languages",1,"bskw"],
  ["Create or Destroy Water",1,"cd"],
  ["Cure Wounds",1,"bcdpr"],
  ["Detect Evil and Good",1,"cp"],
  ["Detect Magic",1,"bcdprsw"],
  ["Detect Poison and Disease",1,"cdpr"],
  ["Disguise Self",1,"bsw"],
  ["Dissonant Whispers",1,"b"],
  ["Divine Favor",1,"p"],
  ["Ensnaring Strike",1,"r"],
  ["Entangle",1,"d"],
  ["Expeditious Retreat",1,"skw"],
  ["Faerie Fire",1,"bd"],
  ["False Life",1,"sw"],
  ["Feather Fall",1,"bsw"],
  ["Find Familiar",1,"w"],
  ["Fog Cloud",1,"drsw"],
  ["Goodberry",1,"dr"],
  ["Grease",1,"w"],
  ["Guiding Bolt",1,"c"],
  ["Hail of Thorns",1,"r"],
  ["Healing Word",1,"bcd"],
  ["Hellish Rebuke",1,"k"],
  ["Heroism",1,"bp"],
  ["Hex",1,"k"],
  ["Hunter's Mark",1,"r"],
  ["Identify",1,"bw"],
  ["Illusory Script",1,"bkw"],
  ["Inflict Wounds",1,"c"],
  ["Jump",1,"drsw"],
  ["Longstrider",1,"bdrw"],
  ["Mage Armor",1,"sw"],
  ["Magic Missile",1,"sw"],
  ["Protection from Evil and Good",1,"cpkw"],
  ["Purify Food and Drink",1,"cdp"],
  ["Ray of Sickness",1,"sw"],
  ["Sanctuary",1,"c"],
  ["Searing Smite",1,"p"],
  ["Shield",1,"sw"],
  ["Shield of Faith",1,"cp"],
  ["Silent Image",1,"bsw"],
  ["Sleep",1,"bsw"],
  ["Speak with Animals",1,"bdr"],
  ["Tasha's Hideous Laughter",1,"bw"],
  ["Tenser's Floating Disk",1,"w"],
  ["Thunderous Smite",1,"p"],
  ["Thunderwave",1,"bdsw"],
  ["Unseen Servant",1,"bkw"],
  ["Witch Bolt",1,"skw"],
  ["Wrathful Smite",1,"p"],
  ["Aid",2,"cp"],
  ["Alter Self",2,"sw"],
  ["Animal Messenger",2,"bdr"],
  ["Arcane Lock",2,"w"],
  ["Augury",2,"c"],
  ["Barkskin",2,"dr"],
  ["Beast Sense",2,"dr"],
  ["Blindness/Deafness",2,"bcsw"],
  ["Blur",2,"sw"],
  ["Branding Smite",2,"p"],
  ["Calm Emotions",2,"bc"],
  ["Cloud of Daggers",2,"bskw"],
  ["Continual Flame",2,"cw"],
  ["Cordon of Arrows",2,"r"],
  ["Crown of Madness",2,"bskw"],
  ["Darkness",2,"skw"],
  ["Darkvision",2,"drsw"],
  ["Detect Thoughts",2,"bsw"],
  ["Enhance Ability",2,"bcds"],
  ["Enlarge/Reduce",2,"sw"],
  ["Enthrall",2,"bk"],
  ["Find Steed",2,"p"],
  ["Find Traps",2,"cdr"],
  ["Flame Blade",2,"d"],
  ["Flaming Sphere",2,"dw"],
  ["Gentle Repose",2,"cw"],
  ["Gust of Wind",2,"dsw"],
  ["Heat Metal",2,"bd"],
  ["Hold Person",2,"bcdskw"],
  ["Invisibility",2,"bskw"],
  ["Knock",2,"bsw"],
  ["Lesser Restoration",2,"bcdpr"],
  ["Levitate",2,"sw"],
  ["Locate Animals or Plants",2,"bdr"],
  ["Locate Object",2,"bcdprw"],
  ["Magic Mouth",2,"bw"],
  ["Magic Weapon",2,"pw"],
  ["Melf's Acid Arrow",2,"w"],
  ["Mirror Image",2,"skw"],
  ["Misty Step",2,"skw"],
  ["Moonbeam",2,"d"],
  ["Nystul's Magic Aura",2,"w"],
  ["Pass without Trace",2,"dr"],
  ["Phantasmal Force",2,"bsw"],
  ["Prayer of Healing",2,"c"],
  ["Protection from Poison",2,"cdpr"],
  ["Ray of Enfeeblement",2,"kw"],
  ["Rope Trick",2,"w"],
  ["Scorching Ray",2,"sw"],
  ["See Invisibility",2,"bsw"],
  ["Shatter",2,"bskw"],
  ["Silence",2,"bcr"],
  ["Spider Climb",2,"skw"],
  ["Spike Growth",2,"dr"],
  ["Spiritual Weapon",2,"c"],
  ["Suggestion",2,"bskw"],
  ["Warding Bond",2,"c"],
  ["Web",2,"sw"],
  ["Zone of Truth",2,"bcp"],
  ["Animate Dead",3,"cw"],
  ["Aura of Vitality",3,"p"],
  ["Beacon of Hope",3,"c"],
  ["Bestow Curse",3,"bcw"],
  ["Blinding Smite",3,"p"],
  ["Blink",3,"sw"],
  ["Call Lightning",3,"d"],
  ["Clairvoyance",3,"bcsw"],
  ["Conjure Animals",3,"dr"],
  ["Conjure Barrage",3,"r"],
  ["Counterspell",3,"skw"],
  ["Create Food and Water",3,"cp"],
  ["Crusader's Mantle",3,"p"],
  ["Daylight",3,"cdprs"],
  ["Dispel Magic",3,"bcdpskw"],
  ["Elemental Weapon",3,"p"],
  ["Fear",3,"bskw"],
  ["Feign Death",3,"bcdw"],
  ["Fireball",3,"sw"],
  ["Fly",3,"skw"],
  ["Gaseous Form",3,"skw"],
  ["Glyph of Warding",3,"bcw"],
  ["Haste",3,"sw"],
  ["Hunger of Hadar",3,"k"],
  ["Hypnotic Pattern",3,"bskw"],
  ["Leomund's Tiny Hut",3,"bw"],
  ["Lightning Arrow",3,"r"],
  ["Lightning Bolt",3,"sw"],
  ["Magic Circle",3,"cpkw"],
  ["Major Image",3,"bskw"],
  ["Mass Healing Word",3,"c"],
  ["Meld into Stone",3,"cd"],
  ["Nondetection",3,"brw"],
  ["Phantom Steed",3,"w"],
  ["Plant Growth",3,"bdr"],
  ["Protection from Energy",3,"cdrsw"],
  ["Remove Curse",3,"cpkw"],
  ["Revivify",3,"cp"],
  ["Sending",3,"bcw"],
  ["Sleet Storm",3,"dsw"],
  ["Slow",3,"sw"],
  ["Speak with Dead",3,"bc"],
  ["Speak with Plants",3,"bdr"],
  ["Spirit Guardians",3,"c"],
  ["Stinking Cloud",3,"bsw"],
  ["Tongues",3,"bcskw"],
  ["Vampiric Touch",3,"kw"],
  ["Water Breathing",3,"drsw"],
  ["Water Walk",3,"cdrs"],
  ["Wind Wall",3,"dr"],
];

const CLS_CODE = { bard: "b", cleric: "c", druid: "d", paladin: "p",
  ranger: "r", sorcerer: "s", warlock: "k", wizard: "w" };

const PHB_SPELLS = PHB_SPELL_RAW.map(([name, level, cls]) => ({
  name, level, cls, src: "phb",
}));

/* ------------------------------------------------------------------
   Sina Una spells — book pp. 226-233.
   Only levels 0-3 are listed: at character level 5 a full caster or
   warlock tops out at 3rd-level slots, a half caster at 2nd, and a
   third caster at 1st. The 4th-9th level spells exist in the source
   data but are unreachable in this campaign's range.
------------------------------------------------------------------- */
const SPELLS = [
  { name: "Lava Plume", level: 0, school: "evocation", page: 229, time: "1 action", range: "120 ft",
    comp: "V, S", dur: "Instantaneous",
    text: "A 5-foot fountain of lava bursts up. Creatures within 5 feet make a Dexterity save or take 1d6 fire damage. Scales at 5th, 11th, 17th level." },
  { name: "Spirit Dart", level: 0, school: "evocation", page: 231, time: "1 action", range: "120 ft",
    comp: "V, S", dur: "Instantaneous", table: true,
    text: "Ranged spell attack for 1d8. Damage type set by the nature spirit that answers — roll or choose on the spirit table. Extra darts at 5th, 11th, 17th level." },

  { name: "Apolaki's Light", level: 1, school: "abjuration", page: 226,
    time: "1 reaction, when damaged by a creature within 30 ft you can see", range: "30 ft",
    comp: "V, S", dur: "Instantaneous",
    text: "Solar light lashes back. Constitution save or 1d12 radiant and blinded until the start of its next turn; half and no blinding on a success. +1d12 per slot above 1st." },
  { name: "Create or Harden Lava", level: 1, school: "transmutation", page: 228, time: "1 action",
    range: "30 ft", comp: "V, S, M (obsidian shard, or volcanic rock)", dur: "Instantaneous",
    text: "Melt a 10-foot cube of stone into lava (Dexterity save, 2d10 fire) or harden lava into rock (Constitution save or restrained). Cube grows 5 ft per slot above 1st." },
  { name: "False Self", level: 1, school: "transmutation", page: 229,
    time: "1 reaction, when grappled or restrained", range: "Self",
    comp: "V, S, M (a lizard's tail)", dur: "Instantaneous",
    text: "Swap places with an effigy of yourself. The grapple or restraint transfers to the effigy, which lasts until the start of your next turn." },
  { name: "Viper's Eyes", level: 1, school: "divination", page: 233, time: "1 action", range: "Touch",
    comp: "S, M (the eye of a snake)", dur: "8 hours",
    text: "60-foot blindsight via heat detection. On fire or radiant damage the target makes a Constitution save (DC 10 or half the damage, whichever is higher) or the spell ends early." },

  { name: "Bonded Spirits", level: 2, school: "enchantment", page: 226, time: "1 action", range: "Touch",
    comp: "V, S, M (a small offering of food)", dur: "1 hour", ritual: true, table: true,
    text: "A nature spirit bonds to a willing creature: +1 to all saves and +1d6 damage on weapon attacks, type set by the spirit table. +1d6 per slot above 2nd." },
  { name: "Colors of Hanan", level: 2, school: "transmutation", page: 226, time: "10 minutes",
    range: "Touch", comp: "V, S, M (gold dust and pigments)", dur: "1 hour", ritual: true,
    text: "A golden tattoo the target shifts as a bonus action — Gold (+1 AC), Orange (attacks count as magical), Pink (regain 1d4+1 hit points each turn), Purple (advantage on Dex and Con saves)." },
  { name: "Lizard Skin", level: 2, school: "abjuration", page: 229, time: "1 action", range: "Touch",
    comp: "V, M (a reptile scale)", dur: "1 hour",
    text: "5 temporary hit points and +1 AC. As a reaction the target can shed the skin to end a grapple or restraint and move 5 feet. +5 temporary hit points per slot above 2nd." },
  { name: "Molten Shell", level: 2, school: "abjuration", page: 231, time: "1 action", range: "Self",
    comp: "V, S, M (a shard of obsidian)", dur: "1 hour",
    text: "Fire resistance and 10 temporary hit points; melee attackers take 10 fire. Once spent, the rock hardens and halves the next weapon attack dealing bludgeoning, piercing or slashing." },

  { name: "Aqueous Affinity", level: 3, school: "transmutation", page: 226, time: "1 action",
    range: "Touch", comp: "V, S, M (fish bones)", dur: "8 hours", ritual: true,
    text: "Swimming speed equal to movement, no disadvantage on underwater weapon attacks, and advantage on Dexterity saves while submerged." },
  { name: "Coral Cage", level: 3, school: "transmutation", page: 228, time: "1 action", range: "30 ft",
    comp: "V, S, M (a piece of coral)", dur: "Concentration, up to 10 min", conc: true,
    text: "Coral erupts around one creature. Dexterity save or 3d8 force and restrained. An aswang automatically fails, and repeats the save at disadvantage. +1d8 per slot above 3rd." },
  { name: "Eruption", level: 3, school: "evocation", page: 228, time: "1 action", range: "120 ft",
    comp: "V, S, M (a piece of igneous rock)", dur: "Instantaneous",
    text: "The ground explodes. Creatures within 30 feet make a Dexterity save for 4d6 fire plus 4d6 thunder, leaving difficult terrain until the end of your next turn. +1d6 thunder per slot above 3rd." },
  { name: "Shape Light", level: 3, school: "transmutation", page: 231, time: "1 action", range: "60 ft",
    comp: "V, S, M (a light source and clear crystal)", dur: "Concentration, 1 min", conc: true,
    text: "Choose Moonlight (a weapon becomes magical, +1d8 radiant, three-quarters cover), Starlight (a five-panel wall, -1d4 to ranged attacks, 2d8 radiant), or Sunlight (a bright sphere, 3d8 radiant and blinded)." },
];

const SPIRIT_TABLE = [["1", "Lava", "Fire"], ["2", "Water", "Cold"], ["3", "Wind", "Thunder"],
  ["4", "Rock", "Force"], ["5", "Vine", "Poison"], ["6", "Storm", "Lightning"]];

/* Which Sina Una spells each class may take (book pp. 224-225),
   trimmed to the levels reachable at 5th. */
const SPELL_LISTS = {
  babaylan: ["Spirit Dart", "Apolaki's Light", "Create or Harden Lava", "Bonded Spirits", "Coral Cage"],
  bard: ["Lava Plume", "Apolaki's Light", "False Self", "Viper's Eyes", "Lizard Skin", "Eruption", "Shape Light"],
  cleric: ["Spirit Dart", "Apolaki's Light", "Bonded Spirits", "Colors of Hanan", "Shape Light"],
  druid: ["Lava Plume", "Spirit Dart", "Create or Harden Lava", "False Self", "Viper's Eyes", "Lizard Skin", "Molten Shell", "Aqueous Affinity", "Coral Cage", "Eruption"],
  paladin: ["Apolaki's Light", "Bonded Spirits", "Colors of Hanan", "Shape Light"],
  ranger: ["False Self", "Viper's Eyes", "Lizard Skin", "Aqueous Affinity"],
  sorcerer: ["Lava Plume", "Create or Harden Lava", "Viper's Eyes", "Colors of Hanan", "Lizard Skin", "Aqueous Affinity", "Eruption", "Shape Light"],
  warlock: ["Lava Plume", "False Self", "Viper's Eyes", "Lizard Skin", "Molten Shell", "Eruption"],
  wizard: ["Lava Plume", "Create or Harden Lava", "Viper's Eyes", "Colors of Hanan", "Lizard Skin", "Aqueous Affinity", "Coral Cage", "Eruption", "Shape Light"],
};

const ABILITIES = [
  { key: "str", label: "Strength" }, { key: "dex", label: "Dexterity" },
  { key: "con", label: "Constitution" }, { key: "int", label: "Intelligence" },
  { key: "wis", label: "Wisdom" }, { key: "cha", label: "Charisma" },
];

const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const POINT_BUDGET = 27;
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

const SKILL_ABILITY = {
  "Acrobatics": "dex", "Animal Handling": "wis", "Arcana": "int", "Athletics": "str",
  "Deception": "cha", "History": "int", "Insight": "wis", "Intimidation": "cha",
  "Investigation": "int", "Medicine": "wis", "Nature": "int", "Perception": "wis",
  "Performance": "cha", "Persuasion": "cha", "Religion": "int", "Sleight of Hand": "dex",
  "Stealth": "dex", "Survival": "wis",
};

/* Spell slots, levels 1-5 (SRD 5.1). Index 0 = 1st-level slots. */
const SLOTS_FULL = { 1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2] };
const SLOTS_HALF = { 1: [], 2: [2], 3: [3], 4: [3], 5: [4, 2] };
/* Warlock Pact Magic: all slots are the same level and recover on a short rest. */
const PACT = { 1: { n: 1, lvl: 1 }, 2: { n: 2, lvl: 1 }, 3: { n: 2, lvl: 2 },
  4: { n: 2, lvl: 2 }, 5: { n: 2, lvl: 3 } };

const CASTING = {
  bard: { ability: "cha", type: "full", prep: "known",
    cantrips: { 1: 2, 4: 3 }, known: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8 } },
  cleric: { ability: "wis", type: "full", prep: "prepared", prepFormula: "mod+level",
    cantrips: { 1: 3, 4: 4 } },
  druid: { ability: "wis", type: "full", prep: "prepared", prepFormula: "mod+level",
    cantrips: { 1: 2, 4: 3 } },
  paladin: { ability: "cha", type: "half", prep: "prepared", prepFormula: "mod+halflevel",
    cantrips: {}, startsAt: 2 },
  ranger: { ability: "wis", type: "half", prep: "known",
    cantrips: {}, known: { 2: 2, 3: 3, 4: 3, 5: 4 }, startsAt: 2 },
  sorcerer: { ability: "cha", type: "full", prep: "known",
    cantrips: { 1: 4, 4: 5 }, known: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 } },
  warlock: { ability: "cha", type: "pact", prep: "known",
    cantrips: { 1: 2, 4: 3 }, known: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 } },
  wizard: { ability: "int", type: "full", prep: "prepared", prepFormula: "mod+level",
    cantrips: { 1: 3, 4: 4 }, spellbook: true },
};

/* ------------------------------------------------------------------
   EFFECTS LAYER
   Subclasses declare what they change; the derived-stat functions read
   these rather than special-casing individual subclasses.

     acFormula     { base, add:[abilities], condition:"unarmored", label }
     armorProf     { value:["heavy"] }
     weaponProf    { value:["martial"] }
     skillProf     { value:["Nature"] }
     languages     { value:["Sylvan"] }
     hpPerLevel    { value:1 }
     casting       { ability, progression:"third"|"none", dcBase, cantrips, label, from }
     bonusCantrips { count, from }
     preparedBonus { value }

   Every effect may carry `atLevel`; it applies once the character
   reaches it. Defaults to the subclass unlock level.
------------------------------------------------------------------- */

/* Third-caster slots (Eldritch Knight, Arcane Trickster), levels 1-20
   compressed to the 1-5 range this app supports. */
const SLOTS_THIRD = { 1: [], 2: [], 3: [2], 4: [3], 5: [3] };

const BASE_STEPS = ["Ancestry", "Abilities", "Class", "Background", "Defenses"];
const buildSteps = (hasSpells) =>
  hasSpells ? [...BASE_STEPS, "Spells", "Sheet"] : [...BASE_STEPS, "Sheet"];

const SAVE_KEY = { Strength: "str", Dexterity: "dex", Constitution: "con",
  Intelligence: "int", Wisdom: "wis", Charisma: "cha" };

/* 2014 proficiency bonus by character level. */
const profBonus = (lvl) => 2 + Math.floor((lvl - 1) / 4);

const mod = (n) => Math.floor((n - 10) / 2);
const fmt = (n) => (n >= 0 ? `+${n}` : `${n}`);

/* Point-buy spread that leans into whatever the ancestry already boosts.
   Ranks abilities by their ancestry bonus, then pours the budget in that
   order. Class isn't chosen yet, so this is a starting point, not a build. */
const RECOMMENDED_BASE = [15, 14, 13, 12, 10, 8];
function recommendedSpread(asi) {
  const ranked = [...ABILITIES]
    .map(({ key }) => ({ key, bonus: asi[key] || 0 }))
    .sort((a, b) => b.bonus - a.bonus);
  const out = {};
  ranked.forEach((r, i) => { out[r.key] = RECOMMENDED_BASE[i]; });
  return out;
}

/* ------------------------------------------------------------------
   Resolve an ancestry against its base race, honouring `replaces`.
------------------------------------------------------------------- */
function resolveLineage(lineage, choicePicks) {
  if (!lineage) return null;
  const base = BASE_RACES[lineage.base];
  const dropped = new Set(lineage.replaces || []);

  /* Base ability increases survive unless the variant replaces them. */
  const asi = {};
  if (!dropped.has("Ability Score Increase")) {
    for (const [k, v] of Object.entries(base.asi)) asi[k] = (asi[k] || 0) + v;
  }
  for (const [k, v] of Object.entries(lineage.asi.fixed || {})) asi[k] = (asi[k] || 0) + v;
  if (lineage.asi.choice) {
    for (const k of choicePicks || []) {
      asi[k] = (asi[k] || 0) + lineage.asi.choice.amount;
    }
  }

  const keptBase = base.traits.filter((t) => !dropped.has(t.name));
  const traits = [...keptBase, ...(lineage.traits || [])];

  const skills = new Set();
  traits.forEach((t) => (t.skills || []).forEach((sk) => skills.add(sk)));

  /* Lineage effects can override speed and darkvision. */
  const lfx = lineage.effects || [];
  const speedFx = lfx.find((e) => e.type === "speed");
  const dvFx = lfx.find((e) => e.type === "darkvision");
  const blindsight = (lineage.traits || []).find((t) => t.blindsight)?.blindsight || 0;
  const languages = lineage.languages || base.languages;

  return {
    base, asi, traits, keptBase, skills: [...skills], languages,
    speed: speedFx ? speedFx.value : base.speed,
    size: base.size,
    darkvision: dropped.has("Darkvision") ? 0 : (dvFx ? dvFx.value : base.darkvision),
    blindsight,
    effects: lfx,
    droppedTraits: base.traits.filter((t) => dropped.has(t.name)),
  };
}

/* ================================================================ */
/* One selectable spell. Renders whatever fields are present — island
   spells carry full detail, PHB entries currently only name and level. */
function SpellRow({ sp, on, full, onToggle }) {
  const meta = [
    sp.school,
    sp.level === 0 ? "cantrip" : `level ${sp.level}`,
    sp.time, sp.range, sp.comp, sp.dur,
  ].filter(Boolean);
  return (
    <button className={`su-sprow ${on ? "is-sel" : ""}`} onClick={onToggle}
            disabled={full} aria-pressed={on}>
      <span className="su-sprow-b" aria-hidden="true">{on ? "●" : "○"}</span>
      <span className="su-sprow-body">
        <span className="su-sprow-h">
          <span className="su-spell-n">{sp.name}</span>
          <span className="su-spell-tags">
            {sp.ritual && <span className="su-tag">ritual</span>}
            {sp.conc && <span className="su-tag">conc</span>}
            {sp.page
              ? <span className="su-tag alt">p.{sp.page}</span>
              : <span className="su-tag alt">PHB</span>}
          </span>
        </span>
        <span className="su-spell-m">{meta.join(" · ")}</span>
        {sp.text
          ? <span className="su-spell-t">{sp.text}</span>
          : <span className="su-spell-t su-spell-none">
              Description not loaded — see the Player's Handbook.
            </span>}
      </span>
    </button>
  );
}

/* Divider between groups of choices — batok chevron at the centre. */
function Rule() {
  return (
    <div className="su-rule" role="separator">
      <span className="su-rule-l" />
      <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
        <path d="M1 1L5.5 4.5L1 8" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5.5 1L10 4.5L5.5 8" stroke="currentColor" strokeWidth="1.3" />
      </svg>
      <span className="su-rule-l" />
    </div>
  );
}

export default function SinaUnaCreator() {
  const [step, setStep] = useState(0);
  const [baseId, setBaseId] = useState(null);
  const [lineageId, setLineageId] = useState(null);
  const [choicePicks, setChoicePicks] = useState([]);
  const [mode, setMode] = useState("pointbuy");
  const [scores, setScores] = useState({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });
  const [arrayAssign, setArrayAssign] = useState({});
  const [name, setName] = useState("");
  const [classId, setClassId] = useState(null);
  const [level, setLevel] = useState(1);
  const [subclassId, setSubclassId] = useState(null);
  const [curse, setCurse] = useState(null);
  const [skillPicks, setSkillPicks] = useState([]);
  const [bgId, setBgId] = useState(null);
  const [bgSkillPicks, setBgSkillPicks] = useState([]);
  const [bgChoice, setBgChoice] = useState(null);

  const ancestry = LINEAGES.find((a) => a.id === lineageId) || null;
  const baseRace = baseId ? BASE_RACES[baseId] : null;
  const baseLineages = LINEAGES.filter((l) => l.base === baseId);
  const resolved = useMemo(() => resolveLineage(ancestry, choicePicks), [ancestry, choicePicks]);

  const spent = useMemo(
    () => Object.values(scores).reduce((s, v) => s + (POINT_COST[v] ?? 0), 0),
    [scores]
  );
  const remaining = POINT_BUDGET - spent;

  const baseScoreFor = (k) =>
    mode === "pointbuy" ? scores[k] : (arrayAssign[k] ?? 8);

  const finalScore = (k) => baseScoreFor(k) + (resolved?.asi[k] || 0);

  const needsChoice = !!ancestry?.asi.choice;
  const choiceCount = ancestry?.asi.choice?.count ?? 0;
  const choiceMade = !needsChoice || choicePicks.length === choiceCount;

  const toggleChoice = (k) => {
    setChoicePicks((p) => p.includes(k) ? p.filter((x) => x !== k)
      : p.length < choiceCount ? [...p, k] : p);
  };

  const pickBase = (id) => { setBaseId(id); setLineageId(null); setChoicePicks([]); };
  const pickLineage = (id) => { setLineageId(id); setChoicePicks([]); };

  const canAdvance = () => {
    if (here === "Ancestry") return !!baseId && !!ancestry && choiceMade;
    if (here === "Abilities") return mode === "pointbuy" ? true : Object.keys(arrayAssign).length === 6;
    if (here === "Class") {
      if (!klass) return false;
      if (skillPicks.length !== klass.skillCount) return false;
      if (subclassReady && !subclass) return false;
      if (subclass?.choice && level >= subclass.choice.atLevel && !curse) return false;
      return true;
    }
    if (here === "Background") {
      if (!background) return false;
      if (background.skills.choose && bgSkillPicks.length !== background.skills.choose
          && bgPool.length >= background.skills.choose) return false;
      if (background.choice && !bgChoice) return false;
      return true;
    }
    return true;
  };

  const setScore = (k, v) => {
    if (v < 8 || v > 15) return;
    const next = { ...scores, [k]: v };
    const cost = Object.values(next).reduce((s, x) => s + (POINT_COST[x] ?? 0), 0);
    if (cost > POINT_BUDGET) return;
    setScores(next);
  };

  const assignArray = (k, val) => {
    const next = { ...arrayAssign };
    for (const key of Object.keys(next)) if (next[key] === val) delete next[key];
    if (val === "") delete next[k]; else next[k] = Number(val);
    setArrayAssign(next);
  };

  const klass = classId ? CLASSES[classId] : null;
  const subclass = ALL_SUBCLASSES.find((s) => s.id === subclassId) || null;
  const classSubclasses = ALL_SUBCLASSES.filter((s) => s.cls === classId);
  /* 2014 rules: subclass unlocks at different levels per class. */
  const subclassReady = klass && classSubclasses.length > 0 && level >= classSubclasses[0].unlock;
  const subclassUnlock = classSubclasses[0]?.unlock ?? 1;

  /* Skills you already have for free — from ancestry, and from a subclass
     that grants one. These are removed from the class skill list entirely. */
  const freeSkills = useMemo(() => {
    const s = new Set(resolved?.skills || []);
    if (subclass?.grants?.skills && subclassReady) subclass.grants.skills.forEach((x) => s.add(x));
    if (subclass && subclassReady) {
      (subclass.effects || [])
        .filter((e) => e.type === "skillProf" && level >= (e.atLevel ?? subclass.unlock))
        .forEach((e) => e.value.forEach((x) => s.add(x)));
    }
    return s;
  }, [resolved, subclass, subclassReady, level]);

  const skillPool = useMemo(() => {
    if (!klass) return [];
    const base = klass.skills === "any" ? ALL_SKILLS : klass.skills;
    return base.filter((s) => !freeSkills.has(s));
  }, [klass, freeSkills]);

  const skillsLeft = klass ? klass.skillCount - skillPicks.length : 0;

  const toggleSkill = (s) => {
    setSkillPicks((p) => p.includes(s) ? p.filter((x) => x !== s)
      : p.length < klass.skillCount ? [...p, s] : p);
  };

  const pickClass = (id) => {
    setClassId(id);
    setSubclassId(null);
    setCurse(null);
    setSkillPicks([]);
    setArmorId("none");
    setHasShield(false);
    setPickedSpells([]);
    setOtherSpells("");
  };

  const background = BACKGROUNDS.find((b) => b.id === bgId) || null;

  /* Skills already locked in before the background is applied. */
  const priorSkills = useMemo(
    () => new Set([...freeSkills, ...skillPicks]),
    [freeSkills, skillPicks]
  );

  /* For "choose N from" backgrounds, drop anything already held. */
  const bgPool = useMemo(() => {
    if (!background?.skills.choose) return [];
    return background.skills.from.filter((s) => !priorSkills.has(s));
  }, [background, priorSkills]);

  /* Fixed-skill backgrounds can collide with class picks. 2014 has no
     official swap rule, so surface it rather than silently wasting it. */
  const bgOverlap = useMemo(() => {
    if (!background?.skills.fixed) return [];
    return background.skills.fixed.filter((s) => priorSkills.has(s));
  }, [background, priorSkills]);

  const bgSkills = background
    ? (background.skills.fixed || bgSkillPicks)
    : [];

  const bgSkillsLeft = background?.skills.choose
    ? background.skills.choose - bgSkillPicks.length
    : 0;

  const toggleBgSkill = (s) => {
    const max = background.skills.choose;
    setBgSkillPicks((p) => p.includes(s) ? p.filter((x) => x !== s)
      : p.length < max ? [...p, s] : p);
  };

  const pickBackground = (id) => {
    setBgId(id);
    setBgSkillPicks([]);
    setBgChoice(null);
  };

  const [armorId, setArmorId] = useState("none");
  const [hasShield, setHasShield] = useState(false);
  const [pickedSpells, setPickedSpells] = useState([]);
  const [otherSpells, setOtherSpells] = useState("");

  /* Effects currently in play, given the character's level. */
  const effects = useMemo(() => {
    if (!subclass || !subclassReady) return [];
    return (subclass.effects || []).filter((e) => level >= (e.atLevel ?? subclass.unlock));
  }, [subclass, subclassReady, level]);

  const fx = (type) => effects.filter((e) => e.type === type);

  const pb = profBonus(level);

  /* Armor you're actually proficient with. Druids avoid metal. */
  const armorOptions = useMemo(() => {
    if (!klass) return [ARMOR[0]];
    const granted = fx("armorProf").flatMap((e) => e.value);
    const prof = new Set([...klass.armorProf, ...granted]);
    return ARMOR.filter((a) => {
      if (a.cat === "none") return true;
      if (!prof.has(a.cat)) return false;
      if (klass.noMetal && a.metal) return false;
      return true;
    });
  }, [klass, effects]);

  const armor = armorOptions.find((a) => a.id === armorId) || ARMOR[0];
  const shieldAllowed = !!klass?.shield;
  const shieldOn = shieldAllowed && hasShield;

  /* Every AC formula that could apply, so we can show the reasoning
     rather than just a number. Highest wins, as per 5e. */
  const acCandidates = useMemo(() => {
    if (!resolved) return [];
    const dex = mod(finalScore("dex"));
    const out = [];

    if (armor.id === "none") {
      out.push({ label: "Unarmored", parts: `10 + ${fmt(dex)} Dex`, value: 10 + dex });
    } else {
      const capped = armor.maxDex === null ? dex : Math.min(dex, armor.maxDex);
      out.push({
        label: armor.name,
        parts: `${armor.base}${capped ? ` + ${fmt(capped)} Dex` : ""}` +
          (armor.maxDex !== null && dex > armor.maxDex ? ` · Dex capped at +${armor.maxDex}` : ""),
        value: armor.base + capped,
      });
    }

    /* Class unarmored defenses — only with no armor worn. */
    if (klass?.unarmored && armor.id === "none") {
      const add = mod(finalScore(klass.unarmored.add));
      if (!(klass.unarmored.noShield && shieldOn)) {
        out.push({
          label: `${klass.name} Unarmored Defense`,
          parts: `10 + ${fmt(dex)} Dex + ${fmt(add)} ${klass.unarmored.add.toUpperCase()}`,
          value: 10 + dex + add,
        });
      }
    }

    /* Any subclass AC formula, read from the effects layer. */
    for (const e of fx("acFormula")) {
      if (e.condition === "unarmored" && armor.id !== "none") continue;
      const adds = e.add.map((k) => mod(finalScore(k)));
      out.push({
        label: e.label,
        parts: `${e.base}${e.add.map((k, i) => ` + ${fmt(adds[i])} ${k.toUpperCase()}`).join("")}`,
        value: e.base + adds.reduce((a, b) => a + b, 0),
      });
    }
    return out;
  }, [resolved, armor, klass, subclass, subclassReady, level, shieldOn, effects, scores, arrayAssign, mode]);

  const bestAC = acCandidates.reduce((a, b) => (b.value > a.value ? b : a), acCandidates[0] || { value: 10 });
  const armorClass = (bestAC?.value ?? 10) + (shieldOn ? 2 : 0);

  /* Heavy armor below its Strength requirement costs 10 feet of speed. */
  const strShortfall = armor.strReq && resolved && finalScore("str") < armor.strReq ? armor.strReq : null;
  const speed = resolved ? resolved.speed - (strShortfall ? 10 : 0) : 0;

  const allSkills = useMemo(
    () => [...new Set([...(resolved?.skills || []), ...skillPicks, ...bgSkills])].sort(),
    [resolved, skillPicks, bgSkills]
  );

  const savingThrows = useMemo(() => {
    if (!resolved) return [];
    return ABILITIES.map(({ key, label }) => {
      const proficient = !!klass?.saves.includes(label);
      return { key, label, proficient, value: mod(finalScore(key)) + (proficient ? pb : 0) };
    });
  }, [resolved, klass, pb, scores, arrayAssign, mode]);

  const initiative = resolved ? mod(finalScore("dex")) : 0;
  const passivePerception = resolved
    ? 10 + mod(finalScore("wis")) + (allSkills.includes("Perception") ? pb : 0)
    : 10;

  const skillTable = useMemo(() => {
    if (!resolved) return [];
    return Object.keys(SKILL_ABILITY).sort().map((s) => {
      const ab = SKILL_ABILITY[s];
      const proficient = allSkills.includes(s);
      return { name: s, ability: ab, proficient,
        value: mod(finalScore(ab)) + (proficient ? pb : 0) };
    });
  }, [resolved, allSkills, pb, scores, arrayAssign, mode]);

  /* Spellcasting can come from the class, from a subclass, or neither. */
  const casting = useMemo(() => {
    if (!resolved || !klass) return null;
    const subCast = fx("casting")[0] || null;
    const cls = CASTING[classId];
    if (!cls && !subCast) return null;

    /* Half casters have no spells at 1st level. */
    if (cls && cls.startsAt && level < cls.startsAt && !subCast) {
      return { pending: true, startsAt: cls.startsAt, label: klass.name };
    }

    const src = subCast || cls;
    const ability = src.ability;
    const abMod = mod(finalScore(ability));
    const dcBase = src.dcBase ?? 8;
    const saveDC = dcBase + pb + abMod;
    const attack = pb + abMod;

    const pick = (tbl) => {
      if (!tbl) return null;
      let v = null;
      for (const k of Object.keys(tbl).map(Number).sort((a, b) => a - b)) {
        if (level >= k) v = tbl[k];
      }
      return v;
    };

    const bonusCantrips = fx("bonusCantrips").reduce((a, e) => a + e.count, 0);
    const baseCantrips = pick(src.cantrips);

    const out = {
      label: src.label || `${klass.name} spellcasting`,
      ability, abMod, saveDC, attack, dcBase,
      cantrips: baseCantrips == null ? (bonusCantrips || null) : baseCantrips + bonusCantrips,
      bonusCantrips: bonusCantrips || null,
      cantripsFrom: src.from,
      note: src.note,
      known: pick(src.known),
      slots: null, pact: null, prepared: null, spellbook: null,
      thirdCaster: subCast?.progression === "third",
    };

    if (subCast?.progression === "third") {
      out.slots = SLOTS_THIRD[level] || [];
    } else if (cls && !subCast) {
      if (cls.type === "full") out.slots = SLOTS_FULL[level] || [];
      if (cls.type === "half") out.slots = SLOTS_HALF[level] || [];
      if (cls.type === "pact") out.pact = PACT[level];
      if (cls.prepFormula === "mod+level") out.prepared = Math.max(1, abMod + level);
      if (cls.prepFormula === "mod+halflevel") out.prepared = Math.max(1, abMod + Math.floor(level / 2));
      if (cls.spellbook) out.spellbook = 6 + (level - 1) * 2;
    }
    return out;
  }, [resolved, klass, classId, subclass, subclassReady, level, pb, effects, scores, arrayAssign, mode]);

  /* Sina Una spells this character can reach: on their list, and at or
     below the highest slot level they have. Cantrips always count. */
  const availableSpells = useMemo(() => {
    if (!casting || casting.pending) return null;
    const key = casting.cantripsFrom || classId;
    const maxLvl = casting.pact ? casting.pact.lvl : (casting.slots?.length || 0);

    /* Island spells with full detail. */
    const island = (SPELL_LISTS[key] || []).length
      ? SPELLS.filter((sp) => SPELL_LISTS[key].includes(sp.name) && (sp.level === 0 || sp.level <= maxLvl))
      : [];

    /* PHB spells — name and level only. */
    const code = CLS_CODE[key];
    const phb = code
      ? PHB_SPELLS.filter((sp) => sp.cls.includes(code) && (sp.level === 0 || sp.level <= maxLvl))
      : [];

    return { key, maxLvl, rows: island, phb, all: [...island, ...phb] };
  }, [casting, classId]);

  const hasSpellStep = !!(casting && !casting.pending);
  const STEPS = useMemo(() => buildSteps(hasSpellStep), [hasSpellStep]);

  /* How many cantrips and how many spells this character gets. */
  const cantripBudget = casting?.cantrips ?? 0;
  const spellBudget = casting?.known ?? casting?.prepared ?? 0;

  const spellLevelOf = (n) =>
    (SPELLS.find((s) => s.name === n) || PHB_SPELLS.find((s) => s.name === n))?.level ?? 0;
  const pickedCantrips = pickedSpells.filter((n) => spellLevelOf(n) === 0);
  const pickedLeveled = pickedSpells.filter((n) => spellLevelOf(n) > 0);

  const findSpell = (nm) =>
    SPELLS.find((x) => x.name === nm) || PHB_SPELLS.find((x) => x.name === nm);

  const toggleSpell = (nm) => {
    const sp = findSpell(nm);
    if (!sp) return;
    const isCantrip = sp.level === 0;
    const budget = isCantrip ? cantripBudget : spellBudget;
    const current = isCantrip ? pickedCantrips : pickedLeveled;
    setPickedSpells((p) => {
      if (p.includes(nm)) return p.filter((x) => x !== nm);
      if (current.length >= budget) return p;
      return [...p, nm];
    });
  };

  /* Full records for whatever was picked, sorted for display. */
  const chosenSpells = useMemo(
    () => [...SPELLS, ...PHB_SPELLS].filter((s) => pickedSpells.includes(s.name))
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
    [pickedSpells]
  );

  const here = STEPS[step] || STEPS[STEPS.length - 1];
  const at = (nm) => STEPS.indexOf(nm);

  /* Everything that needs a full write-up in the printed appendix. */
  const appendix = useMemo(() => {
    const out = [];
    if (resolved) {
      resolved.traits.forEach((t) =>
        out.push({ group: "Ancestry traits", name: t.name, text: t.text }));
    }
    if (subclass && subclassReady) {
      subclass.features.filter((f) => f[0] <= level).forEach((f) =>
        out.push({ group: `${subclass.name} features`, name: f[1],
          text: `Gained at ${klass.name} level ${f[0]}. Full text on p.${subclass.page || "—"} of the source.` }));
    }
    if (background) {
      out.push({ group: "Background", name: background.feature.name, text: background.feature.text });
      if (background.choice && bgChoice) {
        out.push({ group: "Background", name: background.choice.name,
          text: `${bgChoice}. ${background.choice.note}` });
      }
    }
    if (curse && subclass?.choice) {
      const o = subclass.choice.options.find((x) => x.id === curse);
      out.push({ group: "Subclass choice", name: subclass.choice.name,
        text: `${o.name} — ${o.sub}. ${subclass.choice.note}` });
    }
    chosenSpells.filter((sp) => sp.src === "phb").forEach((sp) =>
      out.push({ group: "Handbook spells", name: sp.name,
        text: `${sp.level === 0 ? "Cantrip" : `Level ${sp.level}`}. Full text in the Player's Handbook.` }));
    chosenSpells.filter((sp) => sp.src !== "phb").forEach((sp) =>
      out.push({ group: "Island spells", name: sp.name,
        text: `${sp.level === 0 ? "Cantrip" : `Level ${sp.level}`} ${sp.school}. ` +
          `Casting time ${sp.time}. Range ${sp.range}. Components ${sp.comp}. Duration ${sp.dur}.` +
          `${sp.ritual ? " Ritual." : ""}${sp.conc ? " Concentration." : ""} ${sp.text}` }));
    return out;
  }, [resolved, subclass, subclassReady, level, klass, background, bgChoice, curse, chosenSpells]);

  /* Artifacts run in a sandboxed iframe, so window.print() targets the
     host page rather than this sheet. Instead we build a standalone
     document and hand it over as a file the browser can print properly. */
  const buildSheetHTML = () => {
    const esc = (x) => String(x ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const head = [ancestry?.name, klass ? `${klass.name} ${level}` : null,
      subclass && subclassReady ? subclass.name : null, background?.name]
      .filter(Boolean).join(" · ");

    const abils = ABILITIES.map(({ key, label }) =>
      `<div class="ab"><div class="ab-l">${label}</div><div class="ab-v">${finalScore(key)}</div>` +
      `<div class="ab-m">${fmt(mod(finalScore(key)))}</div></div>`).join("");

    const core = [
      klass && ["Armor Class", armorClass], klass && ["Hit points", hitPoints],
      klass && ["Hit die", `d${klass.hitDie}`], ["Speed", speed],
      ["Initiative", fmt(initiative)], ["Passive Perception", passivePerception],
      ["Proficiency", fmt(pb)], ["Size", resolved.size],
      resolved.darkvision > 0 && ["Darkvision", `${resolved.darkvision} ft`],
      resolved.blindsight > 0 && ["Blindsight", `${resolved.blindsight} ft`],
      ["Languages", resolved.languages.join(", ")],
      armor.id !== "none" && ["Armor", armor.name + (shieldOn ? " + shield" : "")],
      armor.id === "none" && shieldOn && ["Armor", "Shield only"],
    ].filter(Boolean).map(([k, v]) => `<div class="ln"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("");

    const saves = savingThrows.map((s) =>
      `<div class="ln${s.proficient ? " p" : ""}"><span class="dot">${s.proficient ? "●" : "○"}</span>` +
      `<span>${s.label}</span><b>${fmt(s.value)}</b></div>`).join("");

    const skills = skillTable.map((s) =>
      `<div class="ln${s.proficient ? " p" : ""}"><span class="dot">${s.proficient ? "●" : "○"}</span>` +
      `<span>${s.name} <em>${s.ability}</em></span><b>${fmt(s.value)}</b></div>`).join("");

    const traits = resolved.traits.map((t) =>
      `<p><b>${esc(t.name)}.</b> ${esc(t.text)}</p>`).join("");
    const dropped = resolved.droppedTraits.length
      ? `<p class="mut">Replaced by this lineage: ${resolved.droppedTraits.map((t) => esc(t.name)).join(", ")}.</p>` : "";

    const feats = subclass && subclassReady
      ? subclass.features.filter((f) => f[0] <= level)
          .map((f) => `<p><b>${esc(f[1])}.</b> Gained at level ${f[0]}.${subclass.page ? ` See p.${subclass.page}.` : ""}</p>`).join("")
      : "";

    const bg = background ? [
      `<p><b>${esc(background.feature.name)}.</b> ${esc(background.feature.text)}</p>`,
      bgChoice && background.choice ? `<p><b>${esc(background.choice.name)}.</b> ${esc(bgChoice)}</p>` : "",
      `<p><b>Equipment.</b> ${background.equipment.map(esc).join(", ")}.</p>`,
      background.tools?.length ? `<p><b>Tools.</b> ${background.tools.map(esc).join(", ")}.</p>` : "",
    ].join("") : "";

    const castBlock = casting && !casting.pending ? `
      <section><h4>Spellcasting — ${esc(casting.label)}</h4>
      <div class="inl">
        <span>Save DC <b>${casting.saveDC}</b></span>
        <span>Attack <b>${fmt(casting.attack)}</b></span>
        <span>Ability <b>${casting.ability.toUpperCase()}</b></span>
        ${(casting.slots || []).map((n, i) => `<span>${i + 1}${["st", "nd", "rd"][i] || "th"} <b>${n}</b></span>`).join("")}
        ${casting.pact ? `<span>Pact <b>${casting.pact.n} @ level ${casting.pact.lvl}</b></span>` : ""}
        ${casting.prepared != null ? `<span>Prepared <b>${casting.prepared}</b></span>` : ""}
        ${casting.known != null ? `<span>Known <b>${casting.known}</b></span>` : ""}
      </div>
      ${[0, 1, 2, 3].map((lvl) => {
        const r = chosenSpells.filter((x) => x.level === lvl);
        if (!r.length) return "";
        return `<p><b>${lvl === 0 ? "Cantrips" : `Level ${lvl}`}.</b> ` +
          r.map((x) => esc(x.name) + (x.src === "phb" ? "" : " *")).join(", ") + `</p>`;
      }).join("")}
      ${otherSpells.trim() ? `<p><b>Other.</b> ${otherSpells.split("\n").map((x) => esc(x.trim())).filter(Boolean).join(", ")}</p>` : ""}
      ${chosenSpells.some((x) => x.src !== "phb") ? `<p class="mut">* island spell — full text in the reference below.</p>` : ""}
      </section>` : "";

    const groups = [...new Set(appendix.map((a) => a.group))];
    const appx = groups.length ? `<div class="brk"></div><h3>Reference</h3>` + groups.map((g) =>
      `<section><h4>${esc(g)}</h4>` +
      appendix.filter((a) => a.group === g).map((a) =>
        `<p><b>${esc(a.name)}.</b> ${esc(a.text)}</p>`).join("") + `</section>`).join("") : "";

    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>${esc(name.trim() || "Unnamed")} — character sheet</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Georgia,'Times New Roman',serif;color:#111;background:#fff;
    max-width:190mm;margin:0 auto;padding:14mm;font-size:10.5pt;line-height:1.45}
  .bar{background:#0B1622;color:#E8DEC9;padding:12px 16px;border-radius:3px;
    display:flex;align-items:center;gap:14px;margin-bottom:18px;font-family:system-ui,sans-serif}
  .bar p{margin:0;font-size:13px;flex:1}
  .bar button{font:inherit;font-weight:700;font-size:13px;background:#D4A537;color:#0B1622;
    border:none;border-radius:2px;padding:9px 18px;cursor:pointer}
  header{display:flex;justify-content:space-between;align-items:flex-end;
    border-bottom:2px solid #111;padding-bottom:7px;margin-bottom:13px}
  .nm{font-size:24pt;font-weight:700;line-height:1.05}
  .sb{font-size:10pt;color:#444;margin-top:3px}
  .br{font-size:8pt;letter-spacing:.22em;text-transform:uppercase;color:#777}
  .abils{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:13px}
  .ab{border:1px solid #111;border-radius:2px;padding:6px 3px;text-align:center}
  .ab-l{font-size:6.5pt;letter-spacing:.1em;text-transform:uppercase;color:#555}
  .ab-v{font-size:19pt;font-weight:700;line-height:1.1}
  .ab-m{font-size:9pt;color:#444}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:11px}
  section{border:1px solid #999;border-radius:2px;padding:9px 11px;margin-bottom:11px;
    break-inside:avoid;page-break-inside:avoid}
  h3{font-size:13pt;border-bottom:2px solid #111;padding-bottom:5px;margin:0 0 11px}
  h4{font-size:9pt;letter-spacing:.13em;text-transform:uppercase;margin:0 0 7px;
    padding-bottom:4px;border-bottom:1px solid #ccc;color:#333}
  .ln{display:flex;align-items:baseline;gap:6px;padding:2px 0;font-size:9.5pt}
  .ln span:not(.dot){flex:1}
  .ln em{font-size:7pt;text-transform:uppercase;color:#888;font-style:normal;letter-spacing:.06em;margin-left:3px}
  .dot{font-size:8pt;width:9px;flex:none!important;color:#bbb}
  .ln.p .dot{color:#111}
  .sk{column-count:2;column-gap:22px}
  p{margin:0 0 6px;font-size:9.5pt;text-align:justify}
  .mut{color:#666;font-style:italic;font-size:8.5pt}
  .inl{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:9.5pt;margin-bottom:7px}
  .brk{break-after:page;page-break-after:always}
  @page{margin:14mm}
  @media print{body{padding:0;max-width:none}.bar{display:none}}
</style></head><body>
<div class="bar"><p>Choose <b>Save as PDF</b> as the destination to get a PDF file.</p>
<button onclick="window.print()">Print / Save as PDF</button></div>
<header><div><div class="nm">${esc(name.trim() || "Unnamed")}</div>
<div class="sb">${esc(head)}</div></div><div class="br">Sina Una</div></header>
<div class="abils">${abils}</div>
<div class="cols"><section><h4>Core</h4>${core}</section>
<section><h4>Saving throws</h4>${saves}</section></div>
<section><h4>Skills</h4><div class="sk">${skills}</div></section>
<div class="brk"></div>
<section><h4>Ancestry traits — ${esc(ancestry.name)}</h4>${traits}${dropped}</section>
${feats ? `<section><h4>${esc(subclass.name)} — ${esc(subclass.group)}</h4>${feats}</section>` : ""}
${bg ? `<section><h4>Background — ${esc(background.name)}</h4>${bg}</section>` : ""}
${castBlock}
${appx}
</body></html>`;
  };

  const downloadSheet = () => {
    const blob = new Blob([buildSheetHTML()], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(name.trim() || "unnamed").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-sheet.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const usedArrayVals = Object.values(arrayAssign);

  /* 2014: max hit die at 1st level, then average+1 per level after. */
  const hitPoints = useMemo(() => {
    if (!klass || !resolved) return 0;
    const conMod = mod(finalScore("con"));
    const perLevel = Math.floor(klass.hitDie / 2) + 1;
    const bonus = fx("hpPerLevel").reduce((a, e) => a + e.value, 0) * level;
    return klass.hitDie + conMod + (level - 1) * (perLevel + conMod) + bonus;
  }, [klass, resolved, level, effects, scores, arrayAssign, mode]);

  const sheetText = useMemo(() => {
    if (!resolved) return "";
    const L = [];
    const head = klass ? `${ancestry.name} ${klass.name} ${level}` : `${ancestry.name}`;
    L.push(`${name || "Unnamed"} — ${head}${background ? ` · ${background.name}` : ""}`);
    if (subclass && subclassReady) L.push(`${subclass.group}: ${subclass.name} (p.${subclass.page})`);
    L.push("");
    L.push(ABILITIES.map(({ key }) =>
      `${key.toUpperCase()} ${finalScore(key)} (${fmt(mod(finalScore(key)))})`).join("   "));
    L.push("");
    if (klass) {
      L.push(`Hit points ${hitPoints}   Hit die d${klass.hitDie}   Proficiency ${fmt(pb)}`);
      L.push(`AC ${armorClass} (${bestAC?.parts}${shieldOn ? " + 2 shield" : ""})` +
        `   Initiative ${fmt(initiative)}   Passive Perception ${passivePerception}`);
      L.push("");
      L.push("SAVING THROWS");
      L.push(savingThrows.map((s) => `${s.label.slice(0, 3).toUpperCase()} ${fmt(s.value)}${s.proficient ? "*" : " "}`).join("   "));
      L.push("(* = proficient)");
    }
    L.push(`Speed ${speed}   Size ${resolved.size}` +
      (resolved.darkvision ? `   Darkvision ${resolved.darkvision}` : "") +
      (resolved.blindsight ? `   Blindsight ${resolved.blindsight}` : ""));
    L.push(`Languages: ${resolved.languages.join(", ")}`);
    const allSk = [...new Set([...freeSkills, ...skillPicks, ...bgSkills])].sort();
    if (allSk.length) L.push(`Skills: ${allSk.join(", ")}`);
    if (skillTable.length) {
      L.push("");
      L.push("SKILL MODIFIERS");
      const rows = skillTable.map((s) =>
        `${s.proficient ? "*" : " "}${s.name.padEnd(16)}${fmt(s.value)}`);
      for (let i = 0; i < rows.length; i += 2) {
        L.push(rows.slice(i, i + 2).join("   "));
      }
    }
    if (casting && !casting.pending) {
      L.push("");
      L.push(casting.label.toUpperCase());
      L.push(`Save DC ${casting.saveDC}   Attack ${fmt(casting.attack)}   Ability ${casting.ability.toUpperCase()}`);
      if (casting.cantrips != null) L.push(`Cantrips known ${casting.cantrips}`);
      if (casting.known != null) L.push(`Spells known ${casting.known}`);
      if (casting.prepared != null) L.push(`Spells prepared ${casting.prepared}`);
      if (casting.spellbook != null) L.push(`Spellbook holds ${casting.spellbook}`);
      if (casting.slots?.length) {
        L.push(`Slots: ${casting.slots.map((n, i) => `${i + 1}${["st", "nd", "rd"][i] || "th"} x${n}`).join("   ")}`);
      }
      if (casting.pact) L.push(`Pact Magic: ${casting.pact.n} slots at level ${casting.pact.lvl} (short rest)`);
    }
    if (availableSpells?.rows.length) {
      L.push("");
      L.push("ISLAND SPELLS AVAILABLE");
      [0, 1, 2, 3].forEach((lvl) => {
        const r = availableSpells.rows.filter((x) => x.level === lvl);
        if (r.length) L.push(`${lvl === 0 ? "Cantrips" : "Level " + lvl}: ${r.map((x) => x.name).join(", ")}`);
      });
    }
    if (background) {
      const tools = [...(background.tools || [])];
      if (tools.length) L.push(`Tools: ${tools.join(", ")}`);
    }
    if (curse && subclass?.choice) {
      const o = subclass.choice.options.find((x) => x.id === curse);
      L.push(`${subclass.choice.name}: ${o.name} (${o.sub})`);
    }
    if (bgChoice && background?.choice) L.push(`${background.choice.name}: ${bgChoice}`);
    L.push("");
    L.push("ANCESTRY TRAITS");
    resolved.traits.forEach((t) => L.push(`• ${t.name}`));
    if (subclass && subclassReady) {
      const now = subclass.features.filter((f) => f[0] <= level);
      if (now.length) {
        L.push("");
        L.push(`${subclass.name.toUpperCase()} FEATURES`);
        now.forEach((f) => L.push(`• ${f[1]}`));
      }
    }
    if (background) {
      L.push("");
      L.push("BACKGROUND");
      L.push(`• ${background.feature.name} — ${background.name}`);
      L.push("");
      L.push("STARTING EQUIPMENT");
      background.equipment.forEach((e) => L.push(`• ${e}`));
    }
    L.push("");
    L.push("Still to choose: weapons and gear.");
    return L.join("\n");
  }, [resolved, ancestry, name, scores, arrayAssign, mode, klass, level, subclass,
      subclassReady, skillPicks, freeSkills, curse, hitPoints, background, bgSkills, bgChoice,
      armorClass, bestAC, shieldOn, savingThrows, initiative, passivePerception, speed, pb,
      skillTable, casting, availableSpells]);

  return (
    <div className="su-root">
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Karla:wght@400;500;700&family=JetBrains+Mono:wght@500;700&display=swap');

.su-root{
  --abyss:#0B1622; --rock:#132436; --rock-2:#1B3145; --line:#26445F;
  --gold:#D4A537; --gold-dim:#8A6B1F; --jade:#3FA98A; --coral:#D9502F;
  --bone:#E8DEC9; --bone-dim:#93A3B4;
  background:var(--abyss); color:var(--bone);
  font-family:'Karla',system-ui,sans-serif; min-height:100vh;
  padding:28px 18px 120px; -webkit-font-smoothing:antialiased;
}
.su-wrap{max-width:660px;margin:0 auto;}
.su-eyebrow{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.22em;
  text-transform:uppercase;color:var(--gold-dim);margin:0 0 6px;}
.su-h1{font-family:'Fraunces',serif;font-weight:800;font-size:30px;line-height:1.1;
  margin:0 0 4px;color:var(--bone);letter-spacing:-.01em;}
.su-sub{color:var(--bone-dim);font-size:14px;margin:0 0 22px;}

/* batok rail — chevron linework, filled as you progress */
.su-rail{display:flex;gap:5px;align-items:center;margin:0 0 26px;flex-wrap:wrap;}
.su-chev{display:flex;align-items:center;gap:7px;}
.su-chev svg{display:block;}
.su-chev-label{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--bone-dim);}
.su-chev.is-now .su-chev-label{color:var(--gold);}
.su-chev.is-done .su-chev-label{color:var(--jade);}
.su-chev.is-todo .su-chev-label{color:#4C6076;}

.su-card{background:var(--rock);border:1px solid var(--line);border-radius:3px;
  padding:16px 18px;margin-bottom:10px;cursor:pointer;transition:border-color .14s,background .14s;
  text-align:left;width:100%;display:block;font:inherit;color:inherit;}
.su-card:hover{border-color:var(--gold-dim);background:var(--rock-2);}
.su-card.is-sel{border-color:var(--gold);background:var(--rock-2);
  box-shadow:inset 3px 0 0 var(--gold);}
.su-card:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.su-card-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}
.su-card-name{font-family:'Fraunces',serif;font-weight:600;font-size:19px;color:var(--bone);}
.su-card-kind{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--gold-dim);white-space:nowrap;}
.su-card-blurb{font-size:13px;color:var(--bone-dim);margin:6px 0 10px;line-height:1.45;}
.su-pills{display:flex;gap:5px;flex-wrap:wrap;}
.su-pill{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;
  border:1px solid var(--gold-dim);color:var(--gold);border-radius:2px;padding:2px 6px;}
.su-pill.alt{border-color:var(--line);color:var(--bone-dim);}

.su-panel{background:var(--rock);border:1px solid var(--line);border-radius:3px;padding:16px 18px;margin-bottom:14px;}
.su-panel h3{font-family:'Fraunces',serif;font-weight:600;font-size:16px;margin:0 0 10px;}
.su-note{font-size:13px;color:var(--bone-dim);line-height:1.5;margin:0;}

.su-choice{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;}
.su-opt{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.08em;
  background:transparent;border:1px solid var(--line);color:var(--bone-dim);
  padding:8px 14px;border-radius:2px;cursor:pointer;}
.su-opt:hover{border-color:var(--gold-dim);color:var(--bone);}
.su-opt.is-sel{border-color:var(--gold);color:var(--abyss);background:var(--gold);}
.su-opt:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}

.su-row{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);}
.su-row:last-child{border-bottom:none;}
.su-row-label{flex:1;font-size:14px;}
.su-step{display:flex;align-items:center;gap:8px;}
.su-btn-sq{width:26px;height:26px;border:1px solid var(--line);background:transparent;
  color:var(--bone);font-size:15px;line-height:1;border-radius:2px;cursor:pointer;}
.su-btn-sq:hover:not(:disabled){border-color:var(--gold);color:var(--gold);}
.su-btn-sq:disabled{opacity:.28;cursor:not-allowed;}
.su-num{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;
  width:24px;text-align:center;}
.su-arrow{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gold-dim);width:34px;text-align:center;}
.su-final{font-family:'JetBrains Mono',monospace;font-size:17px;font-weight:700;
  color:var(--gold);width:26px;text-align:right;}
.su-mod{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--bone-dim);width:32px;text-align:right;}
.su-sel{background:var(--rock-2);border:1px solid var(--line);color:var(--bone);
  font-family:'JetBrains Mono',monospace;font-size:13px;padding:6px 8px;border-radius:2px;}

.su-budget{display:flex;justify-content:space-between;align-items:baseline;
  border:1px solid var(--line);border-radius:3px;padding:10px 14px;margin-bottom:12px;
  background:var(--rock);}
.su-budget-n{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:var(--gold);}
.su-budget-n.zero{color:var(--jade);}
.su-budget-l{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--bone-dim);}

.su-trait{padding:9px 0;border-bottom:1px solid var(--line);}
.su-trait:last-child{border-bottom:none;}
.su-trait-n{font-weight:700;font-size:13px;color:var(--bone);}
.su-trait-n .src{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--gold-dim);margin-left:7px;}
.su-trait-t{font-size:13px;color:var(--bone-dim);line-height:1.5;margin-top:2px;}
.su-struck{opacity:.34;}
.su-struck .su-trait-n{text-decoration:line-through;}

.su-stub{border:1px dashed var(--line);border-radius:3px;padding:34px 20px;text-align:center;}
.su-stub-t{font-family:'Fraunces',serif;font-size:17px;color:var(--bone-dim);margin:0 0 6px;}
.su-stub-s{font-size:13px;color:#5C7086;margin:0;}

.su-input{width:100%;background:var(--rock-2);border:1px solid var(--line);color:var(--bone);
  font-family:'Fraunces',serif;font-size:19px;padding:11px 13px;border-radius:2px;}
.su-input:focus{outline:none;border-color:var(--gold);}

.su-nav{position:fixed;left:0;right:0;bottom:0;background:rgba(11,22,34,.96);
  border-top:1px solid var(--line);padding:13px 18px;backdrop-filter:blur(8px);}
.su-nav-in{max-width:660px;margin:0 auto;display:flex;gap:10px;align-items:center;}
.su-btn{font-family:'Karla',sans-serif;font-weight:700;font-size:14px;padding:11px 22px;
  border-radius:2px;cursor:pointer;border:1px solid var(--line);background:transparent;color:var(--bone-dim);}
.su-btn:hover:not(:disabled){border-color:var(--gold-dim);color:var(--bone);}
.su-btn-go{background:var(--gold);border-color:var(--gold);color:var(--abyss);margin-left:auto;}
.su-btn-go:hover:not(:disabled){background:#E4B747;border-color:#E4B747;color:var(--abyss);}
.su-btn:disabled{opacity:.32;cursor:not-allowed;}
.su-btn:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.su-hint{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--coral);
  letter-spacing:.08em;text-transform:uppercase;}

.su-chip{display:flex;align-items:center;gap:10px;background:var(--rock);
  border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:2px;
  padding:9px 13px;margin-bottom:12px;}
.su-chip-k{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--bone-dim);}
.su-chip-v{font-family:'Fraunces',serif;font-size:15px;font-weight:600;color:var(--bone);flex:1;}
.su-chip-b{background:none;border:none;color:var(--gold);font-family:'Karla',sans-serif;
  font-size:12px;font-weight:700;cursor:pointer;padding:3px 5px;text-decoration:underline;
  text-underline-offset:3px;}
.su-chip-b:hover{color:#E4B747;}
.su-chip-b:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}

.su-suggest{display:flex;align-items:center;gap:14px;background:var(--rock);
  border:1px dashed var(--gold-dim);border-radius:3px;padding:13px 15px;margin-bottom:12px;}
.su-suggest-t{font-size:13px;font-weight:700;color:var(--bone);}
.su-suggest-s{font-size:12px;color:var(--bone-dim);line-height:1.45;margin-top:2px;}

.su-out{width:100%;background:var(--abyss);border:1px solid var(--line);color:var(--bone-dim);
  font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.6;padding:12px;
  border-radius:2px;resize:vertical;box-sizing:border-box;}
.su-out:focus{outline:none;border-color:var(--gold);color:var(--bone);}

.su-lvl{display:flex;gap:6px;flex-wrap:wrap;}
.su-count{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--gold);margin-left:8px;font-weight:400;}
.su-skills{display:flex;gap:6px;flex-wrap:wrap;}
.su-skill{font-family:'Karla',sans-serif;font-size:12.5px;font-weight:500;
  background:transparent;border:1px solid var(--line);color:var(--bone-dim);
  padding:7px 11px;border-radius:2px;cursor:pointer;transition:border-color .12s,color .12s;}
.su-skill:hover:not(:disabled){border-color:var(--gold-dim);color:var(--bone);}
.su-skill.is-sel{border-color:var(--gold);background:var(--gold);color:var(--abyss);font-weight:700;}
.su-skill:disabled{opacity:.3;cursor:not-allowed;}
.su-skill:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}

.su-skill.is-given{border-color:var(--jade);color:var(--jade);cursor:default;}
.su-skill.is-dupe{border-color:var(--coral);color:var(--coral);
  text-decoration:line-through;text-decoration-color:rgba(217,80,47,.6);}
.su-warn{font-size:12.5px;color:var(--bone-dim);line-height:1.55;margin:11px 0 0;
  border-left:2px solid var(--coral);padding-left:11px;}

.su-ac{display:flex;align-items:center;gap:16px;background:var(--rock);
  border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:3px;
  padding:16px 20px;margin-bottom:14px;}
.su-ac-n{font-family:'JetBrains Mono',monospace;font-size:40px;font-weight:700;
  color:var(--gold);line-height:1;}
.su-ac-l{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--bone-dim);}
.su-ac-s{font-size:13px;color:var(--bone);margin-top:3px;}
.su-ac-parts{display:block;font-family:'JetBrains Mono',monospace;font-size:10.5px;
  color:var(--bone-dim);margin-top:2px;}
.su-prof{font-size:11px;color:var(--gold);width:14px;}
.su-dim{opacity:.45;}

.su-sk-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px 18px;}
@media(max-width:480px){.su-sk-grid{grid-template-columns:1fr;}}
.su-sk{display:flex;align-items:center;gap:8px;padding:6px 0;
  border-bottom:1px solid var(--line);opacity:.55;}
.su-sk.is-prof{opacity:1;}
.su-sk-n{flex:1;font-size:13px;}
.su-sk-a{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.1em;
  color:var(--bone-dim);margin-left:6px;}
.su-sk-v{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;
  color:var(--bone);width:28px;text-align:right;}
.su-sk.is-prof .su-sk-v{color:var(--gold);}

.su-cast{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;}
.su-cast-c{background:var(--rock-2);border:1px solid var(--line);border-radius:2px;
  padding:11px 6px;text-align:center;}
.su-cast-l{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--bone-dim);}
.su-cast-v{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;
  color:var(--gold);line-height:1.3;}

.su-slots{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}
.su-slot{border:1px solid var(--gold-dim);border-radius:2px;padding:8px 14px;text-align:center;}
.su-slot-l{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--bone-dim);}
.su-slot-n{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:var(--gold);}

.su-rule{display:flex;align-items:center;gap:12px;margin:22px 0;color:var(--gold-dim);}
.su-rule-l{flex:1;height:1px;background:linear-gradient(to right,transparent,var(--line) 30%,var(--line) 70%,transparent);}

.su-src{display:flex;align-items:center;gap:9px;font-family:'JetBrains Mono',monospace;
  font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-dim);
  margin:18px 0 2px;}
.su-src:first-child{margin-top:6px;}
.su-src-n{border:1px solid var(--line);border-radius:2px;padding:1px 6px;
  color:var(--bone-dim);letter-spacing:.06em;}

.su-spell{padding:10px 0;border-bottom:1px solid var(--line);}
.su-spell:last-child{border-bottom:none;}
.su-spell-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}
.su-spell-n{font-family:'Fraunces',serif;font-size:15px;font-weight:600;color:var(--bone);}
.su-spell-tags{display:flex;gap:4px;flex-shrink:0;}
.su-tag{font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.1em;
  text-transform:uppercase;border:1px solid var(--gold-dim);color:var(--gold);
  border-radius:2px;padding:1px 5px;}
.su-tag.alt{border-color:var(--line);color:var(--bone-dim);}
.su-spell-m{display:block;font-family:'JetBrains Mono',monospace;font-size:10px;
  color:var(--bone-dim);margin-top:4px;line-height:1.55;}
.su-spell-t{display:block;font-size:12.5px;color:var(--bone-dim);line-height:1.5;
  margin-top:6px;}

.su-tbl{display:grid;grid-template-columns:auto 1fr 1fr;gap:0 12px;margin-top:6px;}
.su-tbl-r{display:contents;}
.su-tbl-r>span{padding:4px 0;border-bottom:1px solid var(--line);font-size:12px;}
.su-tbl-d{font-family:'JetBrains Mono',monospace;color:var(--gold);}
.su-tbl-s{color:var(--bone);}
.su-tbl-x{color:var(--bone-dim);}

.su-sprow{display:flex;gap:10px;width:100%;text-align:left;background:transparent;
  border:none;border-bottom:1px solid var(--line);padding:11px 0;cursor:pointer;
  color:inherit;font:inherit;align-items:flex-start;}
.su-sprow:last-child{border-bottom:none;}
.su-sprow:hover:not(:disabled) .su-spell-n{color:var(--gold);}
.su-sprow:disabled{opacity:.32;cursor:not-allowed;}
.su-sprow:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.su-sprow-b{font-size:11px;color:var(--gold);padding-top:3px;flex-shrink:0;}
.su-sprow-body{display:block;flex:1;}
.su-sprow-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}
.su-sprow.is-sel .su-spell-n{color:var(--gold);}

.su-export{display:flex;align-items:center;gap:16px;background:var(--rock);
  border:1px solid var(--gold-dim);border-radius:3px;padding:16px 18px;margin-bottom:12px;}
.su-export-t{font-family:'Fraunces',serif;font-size:17px;font-weight:600;color:var(--bone);}
.su-export-s{font-size:12.5px;color:var(--bone-dim);line-height:1.5;margin-top:4px;}

.su-spell-none{font-style:italic;color:#5C7086;}
.su-lvlh{font-family:'Fraunces',serif;font-size:15px;font-weight:600;color:var(--bone);
  margin:18px 0 2px;padding-bottom:5px;border-bottom:1px solid var(--line);}

.su-sum{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:14px;}
.su-sum-c{background:var(--rock);border:1px solid var(--line);border-radius:2px;padding:9px 4px;text-align:center;}
.su-sum-k{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.1em;color:var(--bone-dim);}
.su-sum-v{font-family:'JetBrains Mono',monospace;font-size:19px;font-weight:700;color:var(--gold);line-height:1.3;}
.su-sum-m{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--bone-dim);}
@media(max-width:420px){.su-sum{grid-template-columns:repeat(3,1fr);}}
@media(prefers-reduced-motion:reduce){*{transition:none!important;}}
      `}</style>

      <div className="su-wrap">
        <p className="su-eyebrow">The Islands of Sina Una</p>
        <h1 className="su-h1">Make a character</h1>
        <p className="su-sub">Six steps. Only legal options are shown.</p>

        {/* batok chevron rail */}
        <div className="su-rail">
          {STEPS.map((s, i) => {
            const state = i < step ? "is-done" : i === step ? "is-now" : "is-todo";
            const stroke = i < step ? "#3FA98A" : i === step ? "#D4A537" : "#4C6076";
            return (
              <div key={s} className={`su-chev ${state}`}>
                <svg width="13" height="15" viewBox="0 0 13 15" fill="none" aria-hidden="true">
                  <path d="M1 1.5L6.5 7.5L1 13.5" stroke={stroke} strokeWidth="1.6" />
                  <path d="M6 1.5L11.5 7.5L6 13.5" stroke={stroke} strokeWidth="1.6"
                        opacity={i <= step ? "1" : "0.4"} />
                </svg>
                {i === step && <span className="su-chev-label">{s}</span>}
              </div>
            );
          })}
        </div>

        {/* what you've locked in so far — always reversible */}
        {ancestry && step >= at("Abilities") && (
          <div className="su-chip">
            <span className="su-chip-k">Ancestry</span>
            <span className="su-chip-v">{ancestry.name}</span>
            <button className="su-chip-b" onClick={() => setStep(0)}>Change</button>
          </div>
        )}
        {klass && step >= at("Background") && (
          <div className="su-chip">
            <span className="su-chip-k">Class</span>
            <span className="su-chip-v">
              {klass.name} {level}{subclass && subclassReady ? ` · ${subclass.name}` : ""}
            </span>
            <button className="su-chip-b" onClick={() => setStep(2)}>Change</button>
          </div>
        )}

        {background && step >= at("Defenses") && (
          <div className="su-chip">
            <span className="su-chip-k">Background</span>
            <span className="su-chip-v">{background.name}</span>
            <button className="su-chip-b" onClick={() => setStep(3)}>Change</button>
          </div>
        )}

        {/* live ability summary once an ancestry exists */}
        {resolved && step >= at("Abilities") && (
          <div className="su-sum">
            {ABILITIES.map(({ key }) => (
              <div className="su-sum-c" key={key}>
                <div className="su-sum-k">{key.toUpperCase()}</div>
                <div className="su-sum-v">{finalScore(key)}</div>
                <div className="su-sum-m">{fmt(mod(finalScore(key)))}</div>
              </div>
            ))}
          </div>
        )}

        {/* ---------------- STEP 0 — ANCESTRY ---------------- */}
        {here === "Ancestry" && (
          <>
            {BASE_RACE_ORDER.map((id) => {
              const b = BASE_RACES[id];
              const sel = id === baseId;
              const opts = LINEAGES.filter((l) => l.base === id);
              const sina = opts.filter((l) => l.src === "sinauna").length;
              const asiStr = Object.entries(b.asi).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(" ");
              return (
                <button key={id} className={`su-card ${sel ? "is-sel" : ""}`}
                        onClick={() => pickBase(id)} aria-pressed={sel}>
                  <div className="su-card-top">
                    <span className="su-card-name">{b.name}</span>
                    <span className="su-card-kind">
                      {opts.length} option{opts.length > 1 ? "s" : ""}
                      {sina > 0 ? ` · ${sina} island` : ""}
                    </span>
                  </div>
                  <div className="su-pills" style={{ marginTop: 8 }}>
                    {asiStr
                      ? <span className="su-pill">{asiStr}</span>
                      : <span className="su-pill alt">increases come from lineage</span>}
                    <span className="su-pill alt">speed {b.speed}</span>
                    {b.darkvision > 0 && <span className="su-pill alt">darkvision {b.darkvision}</span>}
                  </div>
                </button>
              );
            })}

            {baseId && (
              <>
                <Rule />

                <div className="su-panel">
                  <h3>
                    {baseLineages.some((l) => l.kind === "subrace") ? "Subrace" : "Lineage"}
                  </h3>
                  <p className="su-note" style={{ marginBottom: 4 }}>
                    Island options modify the {baseRace.name.toLowerCase()} rather than replacing it —
                    subraces add to it, variants swap specific traits out.
                  </p>
                  {["sinauna", "phb"].map((source) => {
                    const list = baseLineages.filter((l) => l.src === source);
                    if (!list.length) return null;
                    return (
                      <div key={source}>
                        <div className="su-src">
                          {source === "sinauna" ? "Sina Una" : "Player's Handbook"}
                          <span className="su-src-n">{list.length}</span>
                        </div>
                        {list.map((l) => {
                          const sel = l.id === lineageId;
                          const parts = Object.entries(l.asi.fixed || {}).map(([k, v]) => `${k.toUpperCase()} +${v}`);
                          if (l.asi.choice) {
                            parts.push(`+${l.asi.choice.amount} to ${l.asi.choice.count} of ` +
                              (l.asi.choice.from.length > 4 ? "any" : l.asi.choice.from.map((x) => x.toUpperCase()).join("/")));
                          }
                          return (
                            <button key={l.id} className={`su-card ${sel ? "is-sel" : ""}`}
                                    style={{ marginTop: 8 }}
                                    onClick={() => pickLineage(l.id)} aria-pressed={sel}>
                              <div className="su-card-top">
                                <span className="su-card-name">{l.name}</span>
                                <span className="su-card-kind">
                                  {l.kind}{l.page ? ` · p.${l.page}` : ""}
                                </span>
                              </div>
                              {l.blurb && <p className="su-card-blurb">{l.blurb}</p>}
                              <div className="su-pills" style={{ marginTop: l.blurb ? 0 : 8 }}>
                                {parts.length
                                  ? parts.map((x) => <span className="su-pill" key={x}>{x}</span>)
                                  : <span className="su-pill alt">no extra increases</span>}
                                {(l.replaces || []).length > 0 &&
                                  <span className="su-pill alt">replaces {l.replaces.length} traits</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {needsChoice && (
              <>
                <Rule />
                <div className="su-panel">
                  <h3>
                    Ability increases
                    <span className="su-count">
                      {choicePicks.length}/{choiceCount} chosen
                    </span>
                  </h3>
                  <p className="su-note" style={{ marginBottom: 10 }}>
                    {ancestry.name} gives {choiceCount === 1 ? "one more point" : `${choiceCount} more points`}.
                    Pick {choiceCount === 1 ? "where it goes" : "different abilities for each"}.
                  </p>
                  <div className="su-skills">
                    {ancestry.asi.choice.from.map((k) => {
                      const on = choicePicks.includes(k);
                      const full = !on && choicePicks.length >= choiceCount;
                      return (
                        <button key={k} className={`su-skill ${on ? "is-sel" : ""}`}
                                onClick={() => toggleChoice(k)} disabled={full}
                                aria-pressed={on}>
                          {ABILITIES.find((a) => a.key === k).label} +{ancestry.asi.choice.amount}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {resolved && (
              <>
                <Rule />
                <div className="su-panel">
                  <h3>What you get</h3>
                  {resolved.keptBase.map((t) => (
                    <div className="su-trait" key={t.name}>
                      <div className="su-trait-n">{t.name}<span className="src">{resolved.base.name}</span></div>
                      <div className="su-trait-t">{t.text}</div>
                    </div>
                  ))}
                  {(ancestry.traits || []).map((t) => (
                    <div className="su-trait" key={t.name}>
                      <div className="su-trait-n">{t.name}
                        <span className="src">{ancestry.src === "sinauna" ? "Sina Una" : ancestry.name}</span></div>
                      <div className="su-trait-t">{t.text}</div>
                    </div>
                  ))}
                  {resolved.droppedTraits.map((t) => (
                    <div className="su-trait su-struck" key={t.name}>
                      <div className="su-trait-n">{t.name}<span className="src">Replaced</span></div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ---------------- STEP 1 — ABILITIES ---------------- */}
        {here === "Abilities" && resolved && (
          <>
            <div className="su-choice" style={{ marginBottom: 14 }}>
              <button className={`su-opt ${mode === "pointbuy" ? "is-sel" : ""}`} onClick={() => setMode("pointbuy")}>Point buy</button>
              <button className={`su-opt ${mode === "array" ? "is-sel" : ""}`} onClick={() => setMode("array")}>Standard array</button>
            </div>

            {mode === "pointbuy" && (
              <>
                <div className={`su-budget`}>
                  <span className="su-budget-l">Points left</span>
                  <span className={`su-budget-n ${remaining === 0 ? "zero" : ""}`}>{remaining}</span>
                </div>
                <div className="su-suggest">
                  <div>
                    <div className="su-suggest-t">Not sure where to put these?</div>
                    <div className="su-suggest-s">
                      Start with a spread that leans into what {ancestry.name} already boosts. You can change it after.
                    </div>
                  </div>
                  <button className="su-opt" onClick={() => setScores(recommendedSpread(resolved.asi))}>
                    Use it
                  </button>
                </div>
              </>
            )}

            <div className="su-panel">
              {ABILITIES.map(({ key, label }) => {
                const bonus = resolved.asi[key] || 0;
                const base = baseScoreFor(key);
                return (
                  <div className="su-row" key={key}>
                    <span className="su-row-label">{label}</span>
                    {mode === "pointbuy" ? (
                      <div className="su-step">
                        <button className="su-btn-sq" onClick={() => setScore(key, base - 1)}
                                disabled={base <= 8} aria-label={`Lower ${label}`}>−</button>
                        <span className="su-num">{base}</span>
                        <button className="su-btn-sq" onClick={() => setScore(key, base + 1)}
                                disabled={base >= 15 || (POINT_COST[base + 1] - POINT_COST[base]) > remaining}
                                aria-label={`Raise ${label}`}>+</button>
                      </div>
                    ) : (
                      <select className="su-sel" value={arrayAssign[key] ?? ""}
                              onChange={(e) => assignArray(key, e.target.value)} aria-label={label}>
                        <option value="">—</option>
                        {STANDARD_ARRAY.map((v, i) => (
                          <option key={i} value={v}
                                  disabled={usedArrayVals.includes(v) && arrayAssign[key] !== v}>{v}</option>
                        ))}
                      </select>
                    )}
                    <span className="su-arrow">{bonus ? `+${bonus} →` : "→"}</span>
                    <span className="su-final">{base + bonus}</span>
                    <span className="su-mod">{fmt(mod(base + bonus))}</span>
                  </div>
                );
              })}
            </div>
            <p className="su-note">Ancestry bonuses are already applied. Point buy caps each score at 15 before bonuses.</p>
          </>
        )}

        {/* ---------------- STEP 2 — CLASS ---------------- */}
        {here === "Class" && (
          <>
            <div className="su-panel">
              <h3>Level</h3>
              <p className="su-note" style={{ marginBottom: 10 }}>
                Sets which features you have and whether you pick a subclass yet.
              </p>
              <div className="su-lvl">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} className={`su-opt ${level === n ? "is-sel" : ""}`}
                          onClick={() => setLevel(n)} aria-pressed={level === n}>{n}</button>
                ))}
              </div>
            </div>

            {Object.entries(CLASSES).map(([id, c]) => {
              const sel = id === classId;
              const subs = ALL_SUBCLASSES.filter((s) => s.cls === id);
              return (
                <button key={id} className={`su-card ${sel ? "is-sel" : ""}`}
                        onClick={() => pickClass(id)} aria-pressed={sel}>
                  <div className="su-card-top">
                    <span className="su-card-name">{c.name}</span>
                    <span className="su-card-kind">d{c.hitDie} hit die</span>
                  </div>
                  <p className="su-card-blurb">
                    Saves: {c.saves.join(", ")} · {c.skillCount} skills ·{" "}
                    {subs.length ? `${subs[0].name} available at ${subs[0].unlock}` : "no Sina Una option"}
                  </p>
                </button>
              );
            })}

            {klass && (
              <>
                <Rule />

                {/* subclass — only once the level unlocks it */}
                <div className="su-panel">
                  <h3>{classSubclasses[0]?.group || "Subclass"}</h3>
                  {!subclassReady ? (
                    <p className="su-note">
                      {klass.name}s choose at level {subclassUnlock}. You're level {level}, so this comes later —
                      nothing to decide now.
                    </p>
                  ) : (
                    <>
                      {["sinauna", "phb"].map((source) => {
                        const list = classSubclasses.filter((s) => s.src === source);
                        if (!list.length) return null;
                        return (
                          <div key={source}>
                            <div className="su-src">
                              {source === "sinauna" ? "Sina Una" : "Player's Handbook"}
                              <span className="su-src-n">{list.length}</span>
                            </div>
                            {list.map((s) => {
                              const sel = s.id === subclassId;
                              const now = s.features.filter((f) => f[0] <= level);
                              return (
                                <button key={s.id} className={`su-card ${sel ? "is-sel" : ""}`}
                                        style={{ marginTop: 8 }}
                                        onClick={() => { setSubclassId(s.id); setCurse(null); }}
                                        aria-pressed={sel}>
                                  <div className="su-card-top">
                                    <span className="su-card-name">{s.name}</span>
                                    {s.page && <span className="su-card-kind">p.{s.page}</span>}
                                  </div>
                                  {s.blurb && <p className="su-card-blurb">{s.blurb}</p>}
                                  <div className="su-pills" style={{ marginTop: s.blurb ? 0 : 8 }}>
                                    {now.map((f, i) => <span className="su-pill" key={i}>{f[1]}</span>)}
                                    {now.length === 0 && <span className="su-pill alt">no features yet</span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* subclass-specific choice, e.g. Graverobber's curse */}
                {subclass?.choice && level >= subclass.choice.atLevel && (
                  <div className="su-panel">
                    <h3>{subclass.choice.name}</h3>
                    <p className="su-note">{subclass.choice.note}</p>
                    <div className="su-choice">
                      {subclass.choice.options.map((o) => (
                        <button key={o.id} className={`su-opt ${curse === o.id ? "is-sel" : ""}`}
                                onClick={() => setCurse(o.id)} aria-pressed={curse === o.id}>
                          {o.name} · {o.sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* skills — anything already free is not in this list */}
                <div className="su-panel">
                  <h3>Skills <span className="su-count">{skillsLeft > 0 ? `${skillsLeft} to go` : "done"}</span></h3>
                  {freeSkills.size > 0 && (
                    <p className="su-note" style={{ marginBottom: 10 }}>
                      You already have {[...freeSkills].join(" and ")} for free, so {freeSkills.size > 1 ? "they aren't" : "it isn't"} listed below.
                    </p>
                  )}
                  <div className="su-skills">
                    {skillPool.map((s) => {
                      const on = skillPicks.includes(s);
                      const full = !on && skillPicks.length >= klass.skillCount;
                      return (
                        <button key={s} className={`su-skill ${on ? "is-sel" : ""}`}
                                onClick={() => toggleSkill(s)} disabled={full}
                                aria-pressed={on}>{s}</button>
                      );
                    })}
                  </div>
                </div>

                <div className="su-panel">
                  <h3>Proficiencies</h3>
                  <div className="su-row"><span className="su-row-label">Armor</span>
                    <span className="su-mod" style={{ width: "auto" }}>{klass.armor}</span></div>
                  <div className="su-row"><span className="su-row-label">Weapons</span>
                    <span className="su-mod" style={{ width: "auto" }}>{klass.weapons}</span></div>
                  <div className="su-row"><span className="su-row-label">Saving throws</span>
                    <span className="su-mod" style={{ width: "auto" }}>{klass.saves.join(", ")}</span></div>
                </div>
              </>
            )}
          </>
        )}

        {/* ---------------- STEP 3 — BACKGROUND ---------------- */}
        {here === "Background" && (
          <>
            {BACKGROUNDS.map((b) => {
              const sel = b.id === bgId;
              const sk = b.skills.fixed
                ? b.skills.fixed.join(", ")
                : `${b.skills.choose} from ${b.skills.from.join(", ")}`;
              return (
                <button key={b.id} className={`su-card ${sel ? "is-sel" : ""}`}
                        onClick={() => pickBackground(b.id)} aria-pressed={sel}>
                  <div className="su-card-top">
                    <span className="su-card-name">{b.name}</span>
                    <span className="su-card-kind">p.{b.page}</span>
                  </div>
                  <p className="su-card-blurb">{b.blurb}</p>
                  <div className="su-pills">
                    <span className="su-pill">{b.feature.name}</span>
                    <span className="su-pill alt">{sk}</span>
                  </div>
                </button>
              );
            })}

            {background && (
              <>
                <Rule />

                <div className="su-panel">
                  <h3>Feature: {background.feature.name}</h3>
                  <p className="su-note">{background.feature.text}</p>
                </div>

                {/* choose-from backgrounds: pool already excludes held skills */}
                {background.skills.choose && (
                  <div className="su-panel">
                    <h3>Skills <span className="su-count">
                      {bgPool.length < background.skills.choose ? "limited" :
                       bgSkillsLeft > 0 ? `${bgSkillsLeft} to go` : "done"}
                    </span></h3>
                    {bgPool.length < background.skills.from.length && (
                      <p className="su-note" style={{ marginBottom: 10 }}>
                        {background.skills.from.filter((s) => priorSkills.has(s)).join(" and ")} already
                        covered, so {background.skills.from.filter((s) => priorSkills.has(s)).length > 1 ? "they're" : "it's"} not
                        listed.
                      </p>
                    )}
                    {bgPool.length === 0 ? (
                      <p className="su-note">
                        You already have everything this background offers. Nothing to choose — worth
                        considering a different background, or different class skills.
                      </p>
                    ) : (
                      <div className="su-skills">
                        {bgPool.map((s) => {
                          const on = bgSkillPicks.includes(s);
                          const full = !on && bgSkillPicks.length >= background.skills.choose;
                          return (
                            <button key={s} className={`su-skill ${on ? "is-sel" : ""}`}
                                    onClick={() => toggleBgSkill(s)} disabled={full}
                                    aria-pressed={on}>{s}</button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* fixed-skill backgrounds: flag collisions honestly */}
                {background.skills.fixed && (
                  <div className="su-panel">
                    <h3>Skills</h3>
                    <div className="su-skills">
                      {background.skills.fixed.map((s) => (
                        <span key={s} className={`su-skill is-given ${bgOverlap.includes(s) ? "is-dupe" : ""}`}>
                          {s}{bgOverlap.includes(s) ? " · duplicate" : ""}
                        </span>
                      ))}
                    </div>
                    {bgOverlap.length > 0 && (
                      <p className="su-warn">
                        You already have {bgOverlap.join(" and ")} from your class or ancestry. The 2014 rules
                        don't let you swap a duplicate for something else, so it's wasted — go back and pick
                        different class skills if you'd rather not lose {bgOverlap.length > 1 ? "them" : "it"}.
                        <button className="su-chip-b" onClick={() => setStep(2)}>Change class skills</button>
                      </p>
                    )}
                  </div>
                )}

                {background.choice && (
                  <div className="su-panel">
                    <h3>{background.choice.name}</h3>
                    <p className="su-note">{background.choice.note}</p>
                    <div className="su-skills" style={{ marginTop: 10 }}>
                      {background.choice.options.map((o) => (
                        <button key={o} className={`su-skill ${bgChoice === o ? "is-sel" : ""}`}
                                onClick={() => setBgChoice(o)} aria-pressed={bgChoice === o}>{o}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="su-panel">
                  <h3>You start with</h3>
                  {background.equipment.map((e) => (
                    <div className="su-row" key={e}><span className="su-row-label">{e}</span></div>
                  ))}
                  {background.tools.length > 0 && (
                    <div className="su-row"><span className="su-row-label">Tools</span>
                      <span className="su-mod" style={{ width: "auto" }}>{background.tools.join(", ")}</span></div>
                  )}
                  {(background.langs > 0 || background.fixedLangs) && (
                    <div className="su-row"><span className="su-row-label">Languages</span>
                      <span className="su-mod" style={{ width: "auto" }}>
                        {background.fixedLangs ? background.fixedLangs.join(", ")
                          : `${background.langs} of your choice`}
                      </span></div>
                  )}
                </div>

                <p className="su-note">
                  Personality traits, ideals, bonds, and flaws are on p.{background.page} — roll or pick
                  those at the table.
                </p>
              </>
            )}
          </>
        )}

        {/* ---------------- STEP 4 — DEFENSES ---------------- */}
        {here === "Defenses" && resolved && (
          <>
            <div className="su-ac">
              <div className="su-ac-n">{armorClass}</div>
              <div>
                <div className="su-ac-l">Armor Class</div>
                <div className="su-ac-s">
                  {bestAC?.parts}{shieldOn ? " + 2 shield" : ""}
                </div>
              </div>
            </div>

            {!klass ? (
              <div className="su-stub">
                <p className="su-stub-t">Pick a class first</p>
                <p className="su-stub-s">Armor proficiency decides what you can wear.</p>
              </div>
            ) : (
              <>
                <div className="su-panel">
                  <h3>Armor</h3>
                  {armorOptions.length === 1 ? (
                    <p className="su-note">
                      {klass.name}s aren't proficient with any armor
                      {klass.unarmored ? `, and don't need it — ${klass.unarmored.name} is usually better anyway.` : "."}
                    </p>
                  ) : (
                    <>
                      {klass.noMetal && (
                        <p className="su-note" style={{ marginBottom: 10 }}>
                          Metal armor is left out — druids won't wear it. Studded leather is included, though
                          whether its rivets count is a table-by-table call.
                        </p>
                      )}
                      <div className="su-skills">
                        {armorOptions.map((a) => (
                          <button key={a.id} className={`su-skill ${armor.id === a.id ? "is-sel" : ""}`}
                                  onClick={() => setArmorId(a.id)} aria-pressed={armor.id === a.id}>
                            {a.name}{a.cat !== "none" ? ` ${a.base}` : ""}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {shieldAllowed && (
                    <div className="su-row" style={{ marginTop: 12 }}>
                      <span className="su-row-label">Shield <span className="su-count">+2 AC</span></span>
                      <button className={`su-opt ${shieldOn ? "is-sel" : ""}`}
                              onClick={() => setHasShield((v) => !v)} aria-pressed={shieldOn}>
                        {shieldOn ? "Carrying" : "No shield"}
                      </button>
                    </div>
                  )}
                  {strShortfall && (
                    <p className="su-warn">
                      {armor.name} needs Strength {strShortfall} and you have {finalScore("str")}, so your
                      speed drops by 10 feet — {resolved.speed} down to {speed}.
                    </p>
                  )}
                  {armor.stealth && (
                    <p className="su-warn">{armor.name} gives disadvantage on Stealth checks.</p>
                  )}
                  {klass.unarmored && armor.id !== "none" && (
                    <p className="su-warn">
                      Wearing armor switches off {klass.unarmored.name}.
                    </p>
                  )}
                  {klass.unarmored?.noShield && shieldOn && armor.id === "none" && (
                    <p className="su-warn">
                      {klass.name} Unarmored Defense doesn't work with a shield, so you're on plain 10 + Dex.
                    </p>
                  )}
                </div>

                {acCandidates.length > 1 && (
                  <div className="su-panel">
                    <h3>Why that number</h3>
                    <p className="su-note" style={{ marginBottom: 10 }}>
                      More than one formula applies. You use the best one.
                    </p>
                    {acCandidates.map((c) => {
                      const best = c.value === bestAC.value;
                      return (
                        <div className={`su-row ${best ? "" : "su-dim"}`} key={c.label}>
                          <span className="su-row-label">{c.label}
                            <span className="su-ac-parts">{c.parts}</span></span>
                          <span className={best ? "su-final" : "su-mod"}>{c.value}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="su-panel">
                  <h3>Saving throws <span className="su-count">proficiency {fmt(pb)}</span></h3>
                  {savingThrows.map((s) => (
                    <div className="su-row" key={s.key}>
                      <span className="su-prof" aria-hidden="true">{s.proficient ? "●" : "○"}</span>
                      <span className="su-row-label">{s.label}</span>
                      <span className="su-final">{fmt(s.value)}</span>
                    </div>
                  ))}
                  <p className="su-note" style={{ marginTop: 10 }}>
                    Filled circles are the two your class is proficient in.
                  </p>
                </div>

                <div className="su-panel">
                  <h3>Also derived</h3>
                  <div className="su-row"><span className="su-row-label">Initiative</span>
                    <span className="su-final">{fmt(initiative)}</span></div>
                  <div className="su-row"><span className="su-row-label">Passive Perception</span>
                    <span className="su-final">{passivePerception}</span></div>
                  <div className="su-row"><span className="su-row-label">Speed</span>
                    <span className="su-final">{speed}</span></div>
                  <div className="su-row"><span className="su-row-label">Hit points</span>
                    <span className="su-final">{hitPoints}</span></div>
                </div>
              </>
            )}
          </>
        )}

        {/* ---------------- SPELLS ---------------- */}
        {here === "Spells" && casting && !casting.pending && (
          <>
            <div className="su-cast">
              <div className="su-cast-c">
                <div className="su-cast-l">Save DC</div>
                <div className="su-cast-v">{casting.saveDC}</div>
              </div>
              <div className="su-cast-c">
                <div className="su-cast-l">Attack</div>
                <div className="su-cast-v">{fmt(casting.attack)}</div>
              </div>
              <div className="su-cast-c">
                <div className="su-cast-l">{casting.ability.toUpperCase()}</div>
                <div className="su-cast-v">{fmt(casting.abMod)}</div>
              </div>
            </div>

            {casting.slots?.length > 0 && (
              <div className="su-slots" style={{ marginBottom: 14 }}>
                {casting.slots.map((n, i) => (
                  <div className="su-slot" key={i}>
                    <div className="su-slot-l">{i + 1}{["st", "nd", "rd"][i] || "th"}</div>
                    <div className="su-slot-n">{n}</div>
                  </div>
                ))}
              </div>
            )}
            {casting.pact && (
              <div className="su-slots" style={{ marginBottom: 14 }}>
                <div className="su-slot">
                  <div className="su-slot-l">Pact slots</div>
                  <div className="su-slot-n">{casting.pact.n}</div>
                </div>
                <div className="su-slot">
                  <div className="su-slot-l">at level</div>
                  <div className="su-slot-n">{casting.pact.lvl}</div>
                </div>
              </div>
            )}

            {cantripBudget > 0 && (
              <>
                <div className="su-panel">
                  <h3>Cantrips
                    <span className="su-count">{pickedCantrips.length}/{cantripBudget}</span></h3>
                  {availableSpells?.rows.filter((x) => x.level === 0).length ? (
                    <>
                      <p className="su-note" style={{ marginBottom: 10 }}>
                        Island cantrips open to you. Anything from your usual list goes in the box below.
                      </p>
                      <div className="su-src">Sina Una
                        <span className="su-src-n">{availableSpells.rows.filter((x) => x.level === 0).length}</span></div>
                      {availableSpells.rows.filter((x) => x.level === 0).map((sp) => (
                        <SpellRow key={sp.name} sp={sp}
                                  on={pickedSpells.includes(sp.name)}
                                  full={!pickedSpells.includes(sp.name) && pickedCantrips.length >= cantripBudget}
                                  onToggle={() => toggleSpell(sp.name)} />
                      ))}
                    </>
                  ) : null}
                  {availableSpells?.phb.filter((x) => x.level === 0).length > 0 && (
                    <>
                      <div className="su-src">Player's Handbook
                        <span className="su-src-n">{availableSpells.phb.filter((x) => x.level === 0).length}</span></div>
                      {availableSpells.phb.filter((x) => x.level === 0).map((sp) => (
                        <SpellRow key={sp.name} sp={sp}
                                  on={pickedSpells.includes(sp.name)}
                                  full={!pickedSpells.includes(sp.name) && pickedCantrips.length >= cantripBudget}
                                  onToggle={() => toggleSpell(sp.name)} />
                      ))}
                    </>
                  )}
                </div>
                <Rule />
              </>
            )}

            {spellBudget > 0 && (
              <>
                <div className="su-panel">
                  <h3>{casting.prepared != null ? "Prepared spells" : "Spells known"}
                    <span className="su-count">{pickedLeveled.length}/{spellBudget}</span></h3>
                  {availableSpells?.rows.filter((x) => x.level > 0).length ? (
                    <>
                      <p className="su-note" style={{ marginBottom: 10 }}>
                        {casting.prepared != null
                          ? "You can swap these after a long rest."
                          : "These are locked in until you level up."}{" "}
                        Only spells at or below your highest slot level appear.
                      </p>
                      {[1, 2, 3].map((lvl) => {
                        const rows = availableSpells.rows.filter((x) => x.level === lvl);
                        const phb = availableSpells.phb.filter((x) => x.level === lvl);
                        if (!rows.length && !phb.length) return null;
                        return (
                          <div key={lvl}>
                            <div className="su-lvlh">Level {lvl}</div>
                            {rows.length > 0 && (
                              <>
                                <div className="su-src">Sina Una
                                  <span className="su-src-n">{rows.length}</span></div>
                                {rows.map((sp) => (
                                  <SpellRow key={sp.name} sp={sp}
                                            on={pickedSpells.includes(sp.name)}
                                            full={!pickedSpells.includes(sp.name) && pickedLeveled.length >= spellBudget}
                                            onToggle={() => toggleSpell(sp.name)} />
                                ))}
                              </>
                            )}
                            {phb.length > 0 && (
                              <>
                                <div className="su-src">Player's Handbook
                                  <span className="su-src-n">{phb.length}</span></div>
                                {phb.map((sp) => (
                                  <SpellRow key={sp.name} sp={sp}
                                            on={pickedSpells.includes(sp.name)}
                                            full={!pickedSpells.includes(sp.name) && pickedLeveled.length >= spellBudget}
                                            onToggle={() => toggleSpell(sp.name)} />
                                ))}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ) : null}
                </div>
                <Rule />
              </>
            )}

            <div className="su-panel">
              <h3>Anything else</h3>
              <p className="su-note" style={{ marginBottom: 10 }}>
                Everything from the Handbook and the islands is listed above. If your table uses spells
                from another book, add them here — one per line.
              </p>
              <textarea className="su-out" rows={4} value={otherSpells}
                        onChange={(e) => setOtherSpells(e.target.value)}
                        placeholder={"Healing Spirit\nShadow Blade"}
                        aria-label="Other spells" />
            </div>
          </>
        )}

        {/* ---------------- SHEET / EXPORT ---------------- */}
        {here === "Sheet" && resolved && (
          <>
            <div className="su-panel">
              <h3>Name</h3>
              <input className="su-input" value={name} onChange={(e) => setName(e.target.value)}
                     placeholder="Unnamed" aria-label="Character name" />
            </div>

            <Rule />

            <div className="su-export">
              <div>
                <div className="su-export-t">Character sheet</div>
                <div className="su-export-s">
                  Downloads a self-contained HTML file: two pages of sheet, then a reference appendix.
                  Open it and press the print button inside, then choose <em>Save as PDF</em>.
                </div>
              </div>
              <button className="su-btn su-btn-go" onClick={downloadSheet}>Download sheet</button>
            </div>

            {!name.trim() && (
              <p className="su-warn">The sheet will say "Unnamed" unless you fill in a name first.</p>
            )}

            <Rule />

            <div className="su-panel">
              <h3>What goes in the file</h3>
              <div className="su-row"><span className="su-row-label">Page 1</span>
                <span className="su-mod" style={{ width: "auto" }}>Abilities, saves, skills, defenses</span></div>
              <div className="su-row"><span className="su-row-label">Page 2</span>
                <span className="su-mod" style={{ width: "auto" }}>Traits, features, equipment, spells</span></div>
              <div className="su-row"><span className="su-row-label">Appendix</span>
                <span className="su-mod" style={{ width: "auto" }}>
                  {appendix.length} full description{appendix.length === 1 ? "" : "s"}
                </span></div>
            </div>

            <div className="su-panel">
              <h3>Plain text</h3>
              <textarea className="su-out" readOnly rows={10} value={sheetText}
                        onFocus={(e) => e.target.select()} aria-label="Character summary" />
            </div>
          </>
        )}
      </div>

      {/* nav */}
      <div className="su-nav">
        <div className="su-nav-in">
          <button className="su-btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
          {here === "Ancestry" && ancestry && needsChoice && !choiceMade && (
            <span className="su-hint">
              {choiceCount - choicePicks.length} more increase{choiceCount - choicePicks.length > 1 ? "s" : ""}
            </span>
          )}
          {here === "Ancestry" && !baseId && <span className="su-hint">Pick a race</span>}
          {here === "Ancestry" && baseId && !ancestry && <span className="su-hint">Pick a lineage</span>}
          {here === "Abilities" && mode === "array" && Object.keys(arrayAssign).length < 6 && (
            <span className="su-hint">Assign all six</span>
          )}
          {here === "Class" && !klass && <span className="su-hint">Pick a class</span>}
          {here === "Class" && klass && subclassReady && !subclass && (
            <span className="su-hint">Pick a {classSubclasses[0].group.toLowerCase()}</span>
          )}
          {here === "Class" && klass && subclass?.choice && level >= subclass.choice.atLevel && !curse && (
            <span className="su-hint">Pick how your curse manifests</span>
          )}
          {here === "Class" && klass && skillsLeft > 0 && (
            <span className="su-hint">{skillsLeft} more skill{skillsLeft > 1 ? "s" : ""}</span>
          )}
          {here === "Background" && !background && <span className="su-hint">Pick a background</span>}
          {here === "Background" && background?.skills.choose && bgSkillsLeft > 0 && bgPool.length >= background.skills.choose && (
            <span className="su-hint">{bgSkillsLeft} more skill{bgSkillsLeft > 1 ? "s" : ""}</span>
          )}
          {here === "Background" && background?.choice && !bgChoice && (
            <span className="su-hint">Pick a {background.choice.name.toLowerCase()}</span>
          )}
          {here === "Spells" && cantripBudget > 0 && pickedCantrips.length === 0 && (
            <span className="su-hint">Pick your cantrips</span>
          )}
          <button className="su-btn su-btn-go" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                  disabled={step === STEPS.length - 1 || !canAdvance()}>
            {step === STEPS.length - 1 ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
