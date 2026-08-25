/* Level-driven arithmetic: proficiency bonus, spell slots, cantrips known,
   prepared-spell counts, and which levels offer an ability score improvement.

   Everything here reads a class's `casting` view model — the slot tables come
   from the pack's own class table, not from a table in this file. That is the
   difference from the old build, which hardcoded SLOTS_FULL/SLOTS_HALF/PACT
   for levels 1-5 and could not have gone past 5 without editing code.

   Where the two editions genuinely differ the rule takes `edition` as an
   argument. It never branches on a pack id. */

import { mod } from "./abilities.js";

export const MAX_LEVEL = 20;
export const LEVELS = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);

/* +2 at 1st, +1 every four levels after. Unchanged between editions. */
export const profBonus = (level) => 2 + Math.floor((Math.max(1, level) - 1) / 4);

/* Slots for a character of this level, as an array indexed by spell level - 1.
   `slotsByLevel` is the class table's own 20x9 matrix, so this is a lookup and
   a trim rather than a calculation. */
export function spellSlots(casting, level) {
  const row = casting?.slotsByLevel?.[level - 1];
  if (!row) return [];
  // Trim the trailing zeros: a 5th-level wizard has 4/3/2, not 4/3/2/0/0/0/0/0/0.
  const last = row.reduce((acc, n, i) => (n > 0 ? i : acc), -1);
  return last < 0 ? [] : row.slice(0, last + 1);
}

/* Warlock slots are a different resource — a small number of slots, all at the
   same level, back on a short rest — so they are reported separately rather
   than folded into the array above. */
export function pactSlots(casting, level) {
  const row = casting?.pactSlots?.[level - 1];
  return row && row.count ? { count: row.count, level: row.level } : null;
}

export const highestSpellLevel = (casting, level) => {
  const slots = spellSlots(casting, level);
  const pact = pactSlots(casting, level);
  return Math.max(slots.length, pact ? pact.level : 0);
};

export function cantripsKnown(casting, level) {
  const n = casting?.cantripsByLevel?.[level - 1];
  return n || 0;
}

export function spellsKnown(casting, level) {
  const n = casting?.spellsKnownByLevel?.[level - 1];
  return n || 0;
}

/* Prepared-spell count. The two editions encode this differently and the mapper
   normalises both into one of two shapes:

     { kind: "table", byLevel: [4, 5, 6, ...] }          2024
     { kind: "formula", base: "level"|"halfLevel",
       ability: "int" }                                  2014

   The 2014 formula is the class's own "your Intelligence modifier + your wizard
   level" wording; half-casters use half their level rounded down, minimum one
   spell either way. */
export function preparedCount(casting, level, abilityScore) {
  const p = casting?.prepared;
  if (!p) return null;
  if (p.kind === "table") return p.byLevel?.[level - 1] ?? null;
  if (p.kind === "formula") {
    const levelPart = p.base === "halfLevel" ? Math.floor(level / 2) : level;
    return Math.max(1, levelPart + mod(abilityScore));
  }
  return null;
}

/* A wizard's spellbook, which is not the same as what they can prepare:
   six at 1st level, two more each level after. Stated the same way in both
   editions; the mapper flags it with `prepares: "spellbook"`. */
export const spellbookSize = (level) => 6 + (level - 1) * 2;

/* Ability score improvements. The levels come from the class's own features —
   they differ per class (fighter and rogue get extra ones) and per edition
   (2024 drops the 19th-level ASI in favour of an Epic Boon), so reading them
   from data is the only way this stays correct.

   `asiLevels` is the class view model's list. This returns how many the
   character has had by now, which is what the UI needs to know how many
   pickers to render. */
export const asisEarned = (asiLevels, level) =>
  (asiLevels || []).filter((l) => l <= level).length;

export const nextAsiLevel = (asiLevels, level) =>
  (asiLevels || []).find((l) => l > level) ?? null;

/* Which subclass features are live at this level. The unlock level is the
   class's, not the subclass's — in 2024 every class unlocks at 3, in 2014 it
   ranges from 1 (cleric, sorcerer, warlock) to 3. */
export const subclassActive = (subclassLevel, level) =>
  subclassLevel != null && level >= subclassLevel;

/* Features of a class or subclass that a character of this level actually has.
   Sorted by level so the sheet reads in the order they were gained. */
export const featuresAtLevel = (features, level) =>
  (features || [])
    .filter((f) => f.level <= level)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
