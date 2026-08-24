import { BASE_RACES } from './baseRaces.js';

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
export const LINEAGES = [
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
      { name: "Quick Thinker", text: "Take the Help action as a bonus action.", action: "bonus" }] },
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

export const BASE_RACE_ORDER = ["dwarf", "elf", "gnome", "halfling", "half-orc", "dragonborn", "tiefling", "human", "half-elf"];
