/* The six ability scores and the arithmetic on them.

   This is chassis, not content: every 5e edition has these six, in this
   order, with this modifier formula. A content pack cannot add a seventh,
   so the "str"/"dex"/"con" literals live here and are never looked up.

   Point buy and the standard array are here for the same reason — they are
   character-creation procedure rather than book content, and both SRDs
   describe the same numbers. */

export const ABILITIES = [
  { key: "str", label: "Strength", short: "STR" },
  { key: "dex", label: "Dexterity", short: "DEX" },
  { key: "con", label: "Constitution", short: "CON" },
  { key: "int", label: "Intelligence", short: "INT" },
  { key: "wis", label: "Wisdom", short: "WIS" },
  { key: "cha", label: "Charisma", short: "CHA" },
];

export const ABILITY_KEYS = ABILITIES.map((a) => a.key);

export const ABILITY_LABEL = Object.fromEntries(ABILITIES.map((a) => [a.key, a.label]));

/* Which abilities a class actually cares about, highest first: its own
   primary ability first (what its damage/DC runs on), then its
   spellcasting ability if that's a different stat, then its two saving
   throw proficiencies, then everything else in the fixed order above.
   Character-creation procedure, not content — every field it reads
   (primaryAbility, casting.ability, saves) is already on the class view
   model, so this never branches on a class name. */
export function classAbilityPriority(klass) {
  const order = [];
  const add = (k) => { if (k && !order.includes(k)) order.push(k); };
  (klass?.primaryAbility || []).forEach(add);
  add(klass?.casting?.ability);
  (klass?.saves || []).forEach(add);
  ABILITY_KEYS.forEach(add);
  return order;
}

/* "STR or DEX", "DEX & WIS" — primaryAbilityGroups is 5etools' own
   shape (array of alternative groups, multiple keys in one group means
   both required), turned into the short prose the Core Traits panel
   shows next to a class. */
const ABILITY_SHORT = Object.fromEntries(ABILITIES.map((a) => [a.key, a.short]));
export function primaryAbilityLabel(groups) {
  return (groups || [])
    .map((g) => g.map((k) => ABILITY_SHORT[k] || k.toUpperCase()).join(" & "))
    .join(" or ");
}

/* The modifier table, as arithmetic rather than as a lookup: scores below 10
   round the same way, so Math.floor over the halved difference covers 1-30
   without a table to keep in sync. */
export const mod = (score) => Math.floor((score - 10) / 2);

/* Signed, for display. A +0 reads better than a 0 next to a list of +N. */
export const fmt = (n) => (n >= 0 ? `+${n}` : `${n}`);

/* Point buy: 27 points, scores 8-15 before any increase. */
export const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const POINT_BUDGET = 27;
export const POINT_MIN = 8;
export const POINT_MAX = 15;

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export const pointsSpent = (scores) =>
  ABILITY_KEYS.reduce((sum, k) => sum + (POINT_COST[scores[k]] ?? 0), 0);

/* An ability score is a base (point buy, array or roll) plus every increase
   the character has picked up, capped at 20 — the cap every source of an
   increase states in its own wording, so it belongs to the sum rather than
   to any one source.

   `increases` is a list of {key: amount} maps rather than one merged map so
   that callers can hand over ancestry, background, ASI and feat separately
   and get the order-independent total without merging first. */
export const ABILITY_CAP = 20;

export function finalScore(key, base, ...increases) {
  const total = increases.reduce((sum, inc) => sum + (inc?.[key] ?? 0), base ?? 0);
  return Math.min(total, ABILITY_CAP);
}

/* The same sum without one named source, so a half-feat's own +1 can be
   excluded when testing whether the character qualifies for that feat. */
export function scoreWithout(key, base, increases, exclude) {
  return finalScore(key, base, ...increases.filter((inc) => inc !== exclude));
}

/* Merge a list of {key: amount} maps into one. */
export function sumIncreases(...increases) {
  const out = {};
  for (const inc of increases) {
    for (const [k, v] of Object.entries(inc || {})) out[k] = (out[k] || 0) + v;
  }
  return out;
}
