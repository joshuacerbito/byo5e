/* Multiclassing math — the parts that don't already live in progression.js.

   A character's classes are modelled as one "primary" class (the existing
   classId/level/subclassId state, untouched) plus zero or more additional
   class entries. Everything here is pure and content-shape-agnostic: it
   takes the already-normalised view models progression.js and
   content/classes.js hand back (`casting`, `multiclassing`, `hitDie`) and
   combines them per the SRD multiclassing rules.

   Rules encoded (see plans/multiclass-srd-rules.md):
   - Ability-score prerequisites to multiclass in/out exist only in the
     2014 SRD; 2024 dropped them entirely — callers gate `requirements`
     checks on edition themselves, this module just evaluates the shape.
   - Multiclass spell slots: full casters count their class level, half
     casters count level/2 (floor), third casters level/3 (floor); the sum
     is looked up on the standard full-caster slot table. Warlock Pact
     Magic is a separate resource and never enters this sum.
   - Hit points: only the very first class level a character ever took
     rolls (here: takes) its hit die at maximum; every other level —
     including level 1 of every class picked up afterward — uses the
     class's own average, same as leveling up normally. */
import { mod } from "./abilities.js";

/* `progression` is casting.progression from content/classes.js's
   buildCasting(): "full" | "half" | "third" | "pact" | "artificer" | null.
   2024 files some half-casters (Paladin/Ranger) under "artificer" — see
   that function's own note — so it counts as a half caster here too. */
export function multiclassCasterLevel(progression, level) {
  if (progression === "full") return level;
  if (progression === "half" || progression === "artificer") return Math.floor(level / 2);
  if (progression === "third") return Math.floor(level / 3);
  return 0;
}

/* entries: [{ progression, level }], Pact Magic already excluded by the
   caller (its slots never join this pool). */
export function combinedCasterLevel(entries) {
  return (entries || []).reduce((sum, e) => sum + multiclassCasterLevel(e.progression, e.level), 0);
}

/* Same trim-the-trailing-zeros behaviour as progression.js's spellSlots,
   applied to the combined caster level against the standard full-caster
   table (identical across every full-caster class, so any one of them —
   picked by the caller — serves as "the" table). */
export function combinedSpellSlots(entries, fullCasterSlotsByLevel) {
  const total = combinedCasterLevel(entries);
  if (total <= 0) return [];
  const row = fullCasterSlotsByLevel?.[total - 1];
  if (!row) return [];
  const last = row.reduce((acc, n, i) => (n > 0 ? i : acc), -1);
  return last < 0 ? [] : row.slice(0, last + 1);
}

export const totalCharacterLevel = (entries) => (entries || []).reduce((s, e) => s + (e.level || 0), 0);

/* `requirements` is the bare shape normMulticlassing() passes through:
   { str: 13 }, or { or: [{ str: 13 }, { dex: 13 }] } (Fighter's "Str 13
   or Dex 13"). `abilityScore` reads a character's own final score for a
   3-letter key. Returns true (no gate) when there's nothing to check —
   callers only pass a real `requirements` value in 2014-SRD edition mode. */
export function meetsMulticlassRequirement(requirements, abilityScore) {
  if (!requirements) return true;
  if (requirements.or) return requirements.or.some((combo) => meetsMulticlassRequirement(combo, abilityScore));
  return Object.entries(requirements).every(([ab, min]) => (abilityScore(ab) || 0) >= min);
}

/* entries: [{ hitDie, level }], in the order the classes were taken —
   entries[0] is whichever class the character has held the longest
   (the app's existing single "primary" class), so only its first level
   takes the max-hit-die treatment; everything else averages. */
export function hitPointsMulticlass(entries, conScore) {
  const con = mod(conScore);
  let total = 0;
  let totalLevels = 0;
  (entries || []).forEach((e, i) => {
    if (!e.hitDie || !e.level) return;
    const average = Math.floor(e.hitDie / 2) + 1;
    totalLevels += e.level;
    total += i === 0 ? e.hitDie + average * (e.level - 1) : average * e.level;
  });
  return total + con * totalLevels;
}
