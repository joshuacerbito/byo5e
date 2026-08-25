/* The effects layer.

   Content declares what it changes; derived stats read the declarations. The
   alternative — a special case per feature — is what makes a builder rot as
   content is added, so there is deliberately no branch anywhere in this app on
   an individual class, species or subclass.

   What is new here versus the old build: effects are collected from EVERY
   source, not just subclasses and species. A class feature, a background, a
   feat and a species trait all declare the same way and all reach the same
   collector. The old memo read subclasses only, which silently dropped the
   effects that species had been declaring for months.

   Where the declarations come from is the mapper's problem. The SRD ships
   prose, not machine-readable mechanics — 5etools has no effects vocabulary —
   so the content layer carries a hand-authored overlay keyed by feature id,
   and a pack may declare its own. Either way it arrives here as this shape:

     { type, atLevel?, ...fields }

   Anything with a type this app does not know is kept and surfaced, never
   swallowed. A pack author whose effect does nothing needs to be told. */

export const EFFECT_TYPES = [
  "acFormula",      // { base, add: [abilityKeys], condition?: "unarmored", label }
  "armorProf",      // { value: ["light","medium","heavy","shield"] }
  "weaponProf",     // { categories: [...], specific: [weaponIds] }
  "skillProf",      // { value: [skillIds] }
  "expertise",      // { value: [skillIds] } | { count, from }
  "bonusSkills",    // { count, from?: [skillIds] }
  "languages",      // { value: [...] }
  "hpPerLevel",     // { value }
  "speed",          // { value }
  "darkvision",     // { value }
  "resistance",     // { value: [damageTypes] }
  "casting",        // { ability, progression, dcBase?, from }
  "bonusCantrips",  // { count, from }
  "preparedBonus",  // { value }
  "grantedSpells",  // { spells: [{ id, atLevel, use }] }
  "abilityIncrease",// { key, amount } — feats and ASIs
];

const KNOWN = new Set(EFFECT_TYPES);

/* Collect every effect in play at this level.

   `sources` is a list of { effects, atLevel, label } — the caller says where
   each group came from and what level it was gained, which is what lets a
   subclass effect default to the subclass's unlock level while a species trait
   defaults to 1. An effect may override with its own `atLevel`. */
export function collectEffects(sources, level) {
  const out = [];
  for (const src of sources || []) {
    const base = src.atLevel ?? 1;
    for (const fx of src.effects || []) {
      const at = fx.atLevel ?? base;
      if (level >= at) out.push({ ...fx, atLevel: at, from: src.label });
    }
  }
  return out;
}

export const effectsOfType = (effects, type) => (effects || []).filter((e) => e.type === type);

/* Effects whose type this build does not implement. The Content screen shows
   these; a pack author reading "3 effects on Path of the Storm do nothing"
   can act on it, where silence would just look like a bug in their book. */
export const unknownEffects = (effects) => (effects || []).filter((e) => !KNOWN.has(e.type));

/* The common reductions, so callers do not each write the same fold. */
export const sumEffect = (effects, type, field = "value") =>
  effectsOfType(effects, type).reduce((n, e) => n + (e[field] || 0), 0);

export const maxEffect = (effects, type, field = "value") =>
  effectsOfType(effects, type).reduce((n, e) => Math.max(n, e[field] || 0), 0);

export const unionEffect = (effects, type, field = "value") => {
  const out = new Set();
  for (const e of effectsOfType(effects, type)) for (const v of e[field] || []) out.add(v);
  return out;
};

/* Weapon and armour proficiency merge from the class's own grants plus any
   effect that adds more. */
export function mergeWeaponProf(classProf, effects) {
  const categories = new Set(classProf?.categories || []);
  const specific = new Set(classProf?.specific || []);
  for (const e of effectsOfType(effects, "weaponProf")) {
    for (const c of e.categories || []) categories.add(c);
    for (const w of e.specific || []) specific.add(w);
  }
  return { categories: [...categories], specific: [...specific] };
}

export function mergeArmorProf(classProf, effects) {
  const out = new Set(classProf || []);
  for (const e of effectsOfType(effects, "armorProf")) for (const v of e.value || []) out.add(v);
  return [...out];
}
