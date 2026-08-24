export const ABILITIES = [
  { key: "str", label: "Strength" }, { key: "dex", label: "Dexterity" },
  { key: "con", label: "Constitution" }, { key: "int", label: "Intelligence" },
  { key: "wis", label: "Wisdom" }, { key: "cha", label: "Charisma" },
];

export const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const POINT_BUDGET = 27;
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export const SKILL_ABILITY = {
  "Acrobatics": "dex", "Animal Handling": "wis", "Arcana": "int", "Athletics": "str",
  "Deception": "cha", "History": "int", "Insight": "wis", "Intimidation": "cha",
  "Investigation": "int", "Medicine": "wis", "Nature": "int", "Perception": "wis",
  "Performance": "cha", "Persuasion": "cha", "Religion": "int", "Sleight of Hand": "dex",
  "Stealth": "dex", "Survival": "wis",
};

/* Spell slots, levels 1-5 (SRD 5.1). Index 0 = 1st-level slots. */
export const SLOTS_FULL = { 1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2] };
export const SLOTS_HALF = { 1: [], 2: [2], 3: [3], 4: [3], 5: [4, 2] };
/* Warlock Pact Magic: all slots are the same level and recover on a short rest. */
export const PACT = { 1: { n: 1, lvl: 1 }, 2: { n: 2, lvl: 1 }, 3: { n: 2, lvl: 2 },
  4: { n: 2, lvl: 2 }, 5: { n: 2, lvl: 3 } };

export const CASTING = {
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
  babaylan: { ability: "int", type: "full", prep: "prepared", prepFormula: "mod+level",
    cantrips: { 1: 3, 4: 4 } },
};
