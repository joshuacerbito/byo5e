/* ------------------------------------------------------------------
   SpellView.

   PORTED, DELIBERATELY DUPLICATED: fmtTime / fmtRange / fmtComponents /
   fmtDuration / combatMeta / SCHOOLS are the same logic as
   scripts/lib/fivetools.mjs. Same reason as entries.js — scripts/ is
   node-only build tooling. Keep the two in step.

   `classLists` is injected by the pack builder (5etools keeps class
   eligibility outside the spell record, in spells/sources.json) and is
   already a flat array of lowercase class slugs.

   Ids come from the EMITTED name: 17 SRD spells are renamed to drop
   product identity (Bigby's Hand -> Arcane Hand) and `nameOriginal` is
   kept only so cross-references still resolve.
------------------------------------------------------------------- */
import { stripTags, flatten } from "./entries.js";
import { idMinter } from "./ids.js";

export const SCHOOLS = {
  A: "abjuration", C: "conjuration", D: "divination", E: "enchantment",
  V: "evocation", I: "illusion", N: "necromancy", T: "transmutation",
};

export function fmtTime(time) {
  return (time || []).map((t) => {
    const unit = t.unit === "bonus" ? "bonus action" : t.unit;
    const head = `${t.number} ${unit}${t.number > 1 ? "s" : ""}`;
    return t.condition ? `${head}, ${stripTags(t.condition)}` : head;
  }).join(", ");
}

export function fmtRange(range) {
  if (!range) return "";
  const d = range.distance || {};
  const amt = d.amount;
  switch (range.type) {
    case "point":
      if (d.type === "self") return "Self";
      if (d.type === "touch") return "Touch";
      if (d.type === "sight") return "Sight";
      if (d.type === "unlimited" || d.type === "unlimited (same plane)") return "Unlimited";
      if (d.type === "miles") return `${amt} mile${amt === 1 ? "" : "s"}`;
      return `${amt} ft`;
    case "special": return "Special";
    default: {
      const shape = range.type;
      return amt ? `Self (${amt}-foot ${shape})` : `Self (${shape})`;
    }
  }
}

export function fmtComponents(c) {
  if (!c) return "";
  const parts = [];
  if (c.v) parts.push("V");
  if (c.s) parts.push("S");
  if (c.m) {
    const t = typeof c.m === "string" ? c.m : c.m.text;
    parts.push(t ? `M (${stripTags(t)})` : "M");
  }
  if (c.r) parts.push("R");
  return parts.join(", ");
}

const DUR_UNIT = (n, u) => `${n} ${u}${n === 1 ? "" : "s"}`;

export function fmtDuration(dur) {
  if (!dur || !dur.length) return "";
  const d = dur[0];
  if (d.type === "instant") return "Instantaneous";
  if (d.type === "permanent") {
    const ends = (d.ends || []).map((e) => (e === "dispel" ? "dispelled" : e === "trigger" ? "triggered" : e));
    return ends.length ? `Until ${ends.join(" or ")}` : "Permanent";
  }
  if (d.type === "special") return "Special";
  const body = DUR_UNIT(d.duration.amount, d.duration.type);
  return d.concentration ? `Concentration, up to ${body}` : body;
}

const DICE = /\{@(?:damage|dice|scaledamage) ([0-9]+d[0-9]+(?:\s*\+\s*[0-9]+d[0-9]+)?)/;

/* spellAttack / savingThrow / damageInflict / conditionInflict off the
   record, with the dice expression read out of the entry text. `heal`
   keys off the "HL" miscTag rather than being guessed from wording. */
export function combatMeta(sp) {
  const raw = JSON.stringify(sp.entries || []);
  const dice = raw.match(DICE)?.[1]?.replace(/\s+/g, " ");
  const out = { atk: null, save: null, dmg: null, dmgType: null, heal: null, cond: null };
  if (sp.spellAttack?.length) out.atk = sp.spellAttack[0] === "R" ? "ranged" : "melee";
  if (sp.savingThrow?.length) out.save = sp.savingThrow[0].slice(0, 3);
  if (sp.damageInflict?.length && dice) {
    out.dmg = dice;
    out.dmgType = sp.damageInflict.length > 1 ? "varies" : sp.damageInflict[0];
  }
  if (!sp.damageInflict?.length && sp.miscTags?.includes("HL") && dice) out.heal = dice;
  if (sp.conditionInflict?.length) out.cond = sp.conditionInflict[0];
  return out;
}

const isConcentration = (dur) => (dur || []).some((d) => d.concentration);

export function buildSpells(reg) {
  const mint = idMinter();
  return (reg.content.spells || []).map((sp) => {
    const flat = flatten(sp.entries || []);
    const higher = sp.entriesHigherLevel ? flatten(sp.entriesHigherLevel) : null;
    return {
      kind: "spell",
      id: mint(sp.name, sp.source),
      name: sp.name,
      nameOriginal: sp.nameOriginal ?? null,
      source: sp.source,
      page: sp.page ?? null,
      level: sp.level,
      school: SCHOOLS[sp.school] || sp.school,
      schoolCode: sp.school,
      time: fmtTime(sp.time),
      range: fmtRange(sp.range),
      components: fmtComponents(sp.components),
      duration: fmtDuration(sp.duration),
      ritual: !!sp.meta?.ritual,
      concentration: isConcentration(sp.duration),
      text: flat.text,
      blocks: flat.blocks,
      higherLevels: higher ? higher.text : null,
      higherLevelBlocks: higher ? higher.blocks : [],
      classLists: (sp.classLists || []).slice(),
      ...combatMeta(sp),
    };
  });
}
