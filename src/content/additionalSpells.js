/* ------------------------------------------------------------------
   `additionalSpells` — the block that hangs off a race, subrace,
   subclass, optional feature or (2024) feat and says "you also get
   these spells".

   Its native shape is four nested maps keyed by mode, character level,
   cast-kind and uses. Flattened here into a list of grants:

     { mode: "known"|"prepared"|"innate"|"expanded",
       atLevel,          // number, or null for "_" (always / on gain)
       cast,             // null | "daily" | "rest" | "resource" | "ritual"
       uses,             // "1", "1e" (once each) … as printed
       spells: [{ name, id, cantrip }],
       choices: [{ count, filter }] }   // "level=0|class=Wizard"

   `expanded` keys are "s1".."s9" — a warlock patron's expanded list by
   SPELL level, not character level; that number lands in `spellLevel`.

   The 2024 records give each block a `name` ("Drow", "High Elf",
   "Wood Elf"): those are the species lineages, and AncestryView surfaces
   them as a choice.
------------------------------------------------------------------- */
import { splitUid } from "./entries.js";
import { slugify } from "./ids.js";

const spellRef = (s) => {
  if (typeof s === "string") {
    const { name, flag } = splitUid(s);
    return { name, id: slugify(name), cantrip: flag === "c" };
  }
  return null;
};

function pushList(out, base, list) {
  const spells = [];
  const choices = [];
  for (const s of [].concat(list || [])) {
    if (typeof s === "string") { spells.push(spellRef(s)); continue; }
    if (s && s.choose) choices.push({ count: s.count ?? 1, filter: String(s.choose) });
  }
  out.push({ ...base, spells, choices });
}

/* One level bucket is either a flat list, or { "_": list }, or
   { daily: { "1": list } } / { ritual: [...] } / { resource: {...} }. */
function walkBucket(out, base, bucket) {
  if (Array.isArray(bucket)) { pushList(out, { ...base, cast: null, uses: null }, bucket); return; }
  if (!bucket || typeof bucket !== "object") return;
  for (const [k, v] of Object.entries(bucket)) {
    if (k === "_") { pushList(out, { ...base, cast: null, uses: null }, v); continue; }
    if (Array.isArray(v)) { pushList(out, { ...base, cast: k, uses: null }, v); continue; }
    for (const [uses, list] of Object.entries(v || {})) {
      pushList(out, { ...base, cast: k, uses }, list);
    }
  }
}

export function normAdditionalSpells(arr) {
  if (!arr || !arr.length) return [];
  return arr.map((blk) => {
    const grants = [];
    for (const mode of ["known", "prepared", "innate", "expanded"]) {
      const byLevel = blk[mode];
      if (!byLevel) continue;
      for (const [lvlKey, bucket] of Object.entries(byLevel)) {
        const isSpellLevel = /^s\d$/.test(lvlKey);
        walkBucket(grants, {
          mode,
          atLevel: lvlKey === "_" ? null : (isSpellLevel ? null : Number(lvlKey)),
          spellLevel: isSpellLevel ? Number(lvlKey.slice(1)) : null,
        }, bucket);
      }
    }
    const ab = blk.ability;
    return {
      name: blk.name ?? null,
      ability: ab == null ? null : (typeof ab === "string" ? ab : { choose: ab.choose || [] }),
      grants,
    };
  });
}
