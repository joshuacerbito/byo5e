/* The wizard's step list. Ruleset comes first — nothing downstream can
   render before content is loaded — and Advancement is new: level 1-20
   means multiple Ability Score Improvements over a character's life,
   not the old build's single hardcoded level-4 stop. */
export const BASE_STEPS = ["Ruleset", "Species/Race", "Class", "Abilities", "Background", "Advancement", "Defenses"];
export const buildSteps = (hasSpells) =>
  hasSpells ? [...BASE_STEPS, "Spells", "Inventory", "Sheet"] : [...BASE_STEPS, "Inventory", "Sheet"];
