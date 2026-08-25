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
      { name: "Infernal Legacy", text: "Know thaumaturgy; later hellish rebuke and darkness.",
        ability: "cha", spells: [
          { name: "Thaumaturgy", atLevel: 1, use: "at will" },
          { name: "Hellish Rebuke", atLevel: 3, use: "1/long rest, cast at 2nd level" },
          { name: "Darkness", atLevel: 5, use: "1/long rest" }] },
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
  /* ------------------------------------------------------------------
     COMMENTED OUT — Tasha's Custom Lineage (TCE p.8).

     Held back on purpose, not abandoned. It is genuinely its own race:
     the book opens it with "Instead of choosing one of the game's races
     for your character at 1st level", and closes it with "Your race is
     considered to be a Custom Lineage for any game feature that
     requires a certain race" — so modelling it as a base race with its
     variable trait split across two lineages beneath it was right.

     What it is NOT is Tasha's *Customizing Your Origin* (TCE pp.7-8),
     the separate variant rule that lets any race reassign the ability
     increases from its Ability Score Increase trait. That rule is the
     one people usually mean by "the Tasha's race option", and it isn't
     implemented — see Outstanding work in CLAUDE.md.

     To restore: uncomment this block, the two lineage records and the
     BASE_RACE_ORDER entry in lineages.js, and put the base-race count
     back to 10 and the lineage count to 24 in scripts/check.mjs.
  ------------------------------------------------------------------- */
  // "custom-lineage": {
  //   name: "Custom Lineage", speed: 30, size: "Medium", darkvision: 0,
  //   asi: {},
  //   traits: [
  //     { name: "Creature Type", text: "You are a humanoid. You choose whether you are Small or Medium at character creation." },
  //   ],
  //   languages: ["Common", "One other of your choice"],
  // },
};
