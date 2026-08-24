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
export const SLOTS_THIRD = { 1: [], 2: [], 3: [2], 4: [3], 5: [3] };

export const BASE_STEPS = ["Ancestry", "Abilities", "Class", "Background", "Defenses"];
export const buildSteps = (hasSpells) =>
  hasSpells ? [...BASE_STEPS, "Spells", "Inventory", "Sheet"] : [...BASE_STEPS, "Inventory", "Sheet"];

export const SAVE_KEY = { Strength: "str", Dexterity: "dex", Constitution: "con",
  Intelligence: "int", Wisdom: "wis", Charisma: "cha" };

/* 2014 proficiency bonus by character level. */
export const profBonus = (lvl) => 2 + Math.floor((lvl - 1) / 4);
