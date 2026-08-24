/* ------------------------------------------------------------------
   SRD base races (SRD 5.1, CC-BY-4.0, Wizards of the Coast).
   Only the fields the creator needs. Sina Una variants subtract from
   these via `replaces`.
------------------------------------------------------------------- */
export const BASE_RACES = {
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
