/* ------------------------------------------------------------------
   The half-dozen little proficiency/choice shapes 5etools uses, all
   normalised to one form:

     { fixed: [string], choices: [Choice] }
     Choice = { count, from: [string] | null, any: string | null }

   `from: null` with `any: "standard"` means "any standard language";
   `any: "*"` means any member of the kind (any skill, any tool).

   Every string that comes out of here is display text with no {@tag}
   and no pipe reference left in it.
------------------------------------------------------------------- */
import { stripTags, splitUid } from "./entries.js";

export const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];

const empty = () => ({ fixed: [], choices: [] });

/* The "any*" keys 5etools scatters through these blocks. */
const ANY_KEY = /^any([A-Z]\w*)?$/;
const anyLabel = (k) => (k === "any" ? "*" : k.slice(3).replace(/([A-Z])/g, " $1").trim().toLowerCase());

/* Shared walker for skillProficiencies / languageProficiencies /
   toolProficiencies / weaponProficiencies / armorProficiencies — all of
   which are arrays of objects whose truthy keys are the grants. */
function normBlocks(arr, label) {
  const out = empty();
  for (const blk of arr || []) {
    if (typeof blk === "string") { out.fixed.push(label(blk)); continue; }
    if (!blk || typeof blk !== "object") continue;
    for (const [k, v] of Object.entries(blk)) {
      if (k === "choose") {
        const from = Array.isArray(v.from) ? v.from.map(label) : null;
        out.choices.push({ count: v.count ?? 1, from, any: from ? null : "*" });
        continue;
      }
      if (ANY_KEY.test(k)) { out.choices.push({ count: typeof v === "number" ? v : 1, from: null, any: anyLabel(k) }); continue; }
      if (v === true) out.fixed.push(label(k));
      else if (typeof v === "number") out.choices.push({ count: v, from: null, any: label(k) });
    }
  }
  return out;
}

const titleCase = (s) => String(s).replace(/\b[a-z]/g, (m) => m.toUpperCase());

/* Skill/language/tool keys arrive lowercased ("animal handling"). */
export const normSkills = (arr) => normBlocks(arr, titleCase);
export const normLanguages = (arr) => normBlocks(arr, titleCase);
export const normTools = (arr) => normBlocks(arr, titleCase);

/* Race weapon proficiencies key on item uids ("battleaxe|phb"). */
export const normWeaponUids = (arr) => normBlocks(arr, (k) => splitUid(k).name);

/* Class startingProficiencies.armor is a mix of bare category strings
   and { proficiency, full } objects (the druid's metal-armour caveat). */
export function normArmorProf(arr) {
  const out = empty();
  for (const a of arr || []) {
    if (typeof a === "string") out.fixed.push(titleCase(a));
    else if (a && a.proficiency) out.fixed.push(stripTags(a.full || a.proficiency));
  }
  return out;
}

/* Class startingProficiencies.weapons is bare categories ("simple") mixed
   with {@item ...} tag strings whose alias is already plural prose. */
export function normWeaponProf(arr) {
  const out = empty();
  for (const w of arr || []) {
    if (typeof w === "string") out.fixed.push(titleCase(stripTags(w)));
    else if (w && w.proficiency) out.fixed.push(stripTags(w.full || w.proficiency));
  }
  return out;
}

/* Class startingProficiencies.tools is prose; `toolProficiencies` beside
   it is the structured version. Prefer the structured one. */
export function normClassTools(sp) {
  if (sp?.toolProficiencies) return normTools(sp.toolProficiencies);
  const out = empty();
  for (const t of sp?.tools || []) out.fixed.push(stripTags(t));
  return out;
}

/* ---- ability increases -------------------------------------------
   2014 races: [{ con: 2 }] or [{ cha: 2, choose: { from:[...], count:2 } }].
   Returns { fixed: {abil: n}, choices: [{ count, amount, from }] }.
   2024 species carry none at all — the increases moved to backgrounds. */
export function normAbilityIncrease(arr) {
  if (!arr || !arr.length) return null;
  const fixed = {};
  const choices = [];
  for (const blk of arr) {
    for (const [k, v] of Object.entries(blk || {})) {
      if (k === "choose") {
        if (v.weighted) {
          /* 2024 background form: pick from `from`, assigning `weights`
             one apiece — [2,1] is "+2 and +1", [1,1,1] is "+1/+1/+1". */
          choices.push({ kind: "weighted", from: v.weighted.from.slice(), weights: v.weighted.weights.slice() });
        } else {
          choices.push({ kind: "pick", count: v.count ?? 1, amount: v.amount ?? 1, from: (v.from || ABILITIES).slice() });
        }
        continue;
      }
      if (ABILITIES.includes(k)) fixed[k] = (fixed[k] || 0) + v;
    }
  }
  return { fixed, choices };
}

/* 2024 backgrounds present `ability` as TWO alternative weighted blocks
   (+2/+1 or +1/+1/+1). That is a choice between choices, and the UI has
   to render it as such rather than as prose. */
export function normBackgroundAbility(arr) {
  if (!arr || !arr.length) return null;
  const alternatives = arr.map((blk) => {
    const w = blk?.choose?.weighted;
    if (w) return { kind: "weighted", from: w.from.slice(), weights: w.weights.slice() };
    const one = normAbilityIncrease([blk]);
    return { kind: "fixed", fixed: one?.fixed || {} };
  });
  return { chooseOne: alternatives.length > 1, alternatives };
}

export function mergeProf(a, b) {
  return {
    fixed: [...new Set([...(a?.fixed || []), ...(b?.fixed || [])])],
    choices: [...(a?.choices || []), ...(b?.choices || [])],
  };
}
