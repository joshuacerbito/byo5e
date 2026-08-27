/* The wizard's step list. Ruleset comes first — nothing downstream can
   render before content is loaded. Advancement (ASI/feat picking) lives
   inside the Class step now, since it's really "what did my class give
   me"; Defenses and the old read-only Inventory are one Inventory step,
   which also carries the add-item browser and the currency editor.
   Player Info (name, backstory) sits right before Summary, the last step —
   Summary is where "Done" leads to the read-only digital Sheet. */
export const BASE_STEPS = ["Ruleset", "Species/Race", "Class", "Abilities", "Background"];
export const buildSteps = (hasSpells) =>
  hasSpells
    ? [...BASE_STEPS, "Spells", "Inventory", "Player Info", "Summary"]
    : [...BASE_STEPS, "Inventory", "Player Info", "Summary"];
