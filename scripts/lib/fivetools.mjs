/* ------------------------------------------------------------------
   Shared helpers for the one-off extraction scripts that pull book
   text out of a local 5etools-src checkout (gitignored, ~550MB — see
   CLAUDE.md). Nothing here ships: only the generated src/data/*.js
   files do.

   The formatting choices all match what the earlier PHB spell pull
   produced by hand, so a re-run of that extraction would reproduce
   the file already in the tree rather than churn it.
------------------------------------------------------------------- */
import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(process.cwd());
export const DATA = path.join(ROOT, "5etools-src", "data");

export const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(DATA, rel), "utf8"));

/* ---- {@tag} markup ---------------------------------------------- */

/* 5etools wraps cross-references in {@tag display|source|alias} forms.
   Which pipe-separated field is the human-readable one varies by tag;
   these are the ones that actually occur in the data we pull. */
const TAG_FIELD = {
  /* {@scaledamage 2d6|2-9|1d6} — the LAST field is the per-slot
     increment, which is what "At Higher Levels" prose is talking
     about. Taking the first would print the base damage twice. */
  scaledamage: (p) => p[p.length - 1],
  scaledice: (p) => p[p.length - 1],
  /* {@book chapter 10|PHB|10|rituals} — for these two the FIRST field
     is already the display text, unlike every other reference tag. */
  book: (p) => p[0],
  adventure: (p) => p[0],
  /* {@quickref Cover||3||total cover} vs {@quickref difficult terrain||3} */
  quickref: (p) => p[4] || p[0],
  filter: (p) => p[0],
};

/* Everything else that links somewhere puts its display alias in the
   third field when it has one: {@item Holy Water (flask)|phb|holy
   water}, {@language Primordial||Aquan}, {@status concentration||
   concentrating}. Tags not listed anywhere here fall through to the
   first field, which is right for {@damage 2d6}, {@skill Insight} and
   the rest of the plain ones. */
const ALIAS_THIRD = new Set(["item", "spell", "creature", "classFeature",
  "subclassFeature", "optfeature", "feat", "language", "class", "status",
  "variantrule", "race", "background", "condition", "skill", "sense",
  "action", "hazard", "table", "object", "vehicle", "reward", "disease",
  "charoption", "itemType", "deck", "card", "trap", "legroup", "psionic"]);

/* {@deity Azuth|Faerunian|SCAG|display} */
const ALIAS_FOURTH = new Set(["deity"]);


const TAG_PREFIX = { dc: "DC ", chance: "", recharge: "Recharge " };

export function stripTags(s) {
  if (typeof s !== "string") return "";
  let out = s;
  /* Innermost-first, since a few tags nest. */
  for (let i = 0; i < 8; i++) {
    const next = out.replace(/\{@(\w+)\s*([^{}]*)\}/g, (_, tag, body) => {
      const parts = body.split("|");
      const pick = TAG_FIELD[tag]
        || (ALIAS_THIRD.has(tag) ? (p) => p[2] || p[0] : null)
        || (ALIAS_FOURTH.has(tag) ? (p) => p[3] || p[0] : null);
      const val = pick ? pick(parts) : parts[0];
      return (TAG_PREFIX[tag] || "") + (val ?? "").trim();
    });
    if (next === out) break;
    out = next;
  }
  return out.replace(/\s+/g, " ").trim();
}

/* ---- entry trees ------------------------------------------------- */

/* Flatten 5etools' nested entry structure into one prose paragraph.
   Named sub-entries become "Name. text." sentences (the treatment the
   PHB pull gave Command's Approach/Drop/Flee); tables are flattened
   into "col: value / col: value; ..." runs, since neither the app's
   spell rows nor the printed sheet has a table cell to put them in. */
export function fmtEntries(entries) {
  const out = [];
  const walk = (e) => {
    if (e == null) return;
    if (typeof e === "string") { out.push(stripTags(e)); return; }
    if (Array.isArray(e)) { e.forEach(walk); return; }
    switch (e.type) {
      case "entries":
      case "inset":
      case "section": {
        const name = e.name ? stripTags(e.name).replace(/\.$/, "") : "";
        const body = fmtEntries(e.entries || []);
        out.push(name ? `${name}. ${body}` : body);
        break;
      }
      case "list":
        (e.items || []).forEach(walk);
        break;
      case "item":
      case "itemSpell":
      case "itemSub": {
        const name = e.name ? stripTags(e.name).replace(/\.$/, "") : "";
        const body = [e.entry, ...(e.entries || [])].filter(Boolean).map((x) =>
          typeof x === "string" ? stripTags(x) : fmtEntries([x])).join(" ");
        out.push(name ? `${name}. ${body}` : body);
        break;
      }
      case "table": {
        const cap = e.caption ? `${stripTags(e.caption)} — ` : "";
        const labels = (e.colLabels || []).map(stripTags);
        const rows = (e.rows || []).map((r) =>
          (Array.isArray(r) ? r : r.row || []).map(cellText)
            .map((v, i) => (labels[i] ? `${labels[i]} ${v}` : v)).join(" / "));
        out.push(`${cap}${rows.join("; ")}.`);
        break;
      }
      case "quote":
        out.push(fmtEntries(e.entries || []));
        break;
      case "abilityDc":
      case "abilityAttackMod":
        break;
      case "refOptionalfeature":
      case "refClassFeature":
      case "refSubclassFeature":
        break;
      default:
        if (e.entries) out.push(fmtEntries(e.entries));
        else if (e.entry) out.push(stripTags(e.entry));
    }
  };
  walk(entries);
  return out.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function cellText(c) {
  if (typeof c === "string") return stripTags(c);
  if (c == null) return "";
  if (c.roll) {
    if (c.roll.exact != null) return String(c.roll.exact);
    return `${c.roll.min}-${c.roll.max}`;
  }
  if (c.entry) return stripTags(c.entry);
  if (c.entries) return fmtEntries(c.entries);
  return "";
}

/* ---- spell field formatting -------------------------------------- */

export const SCHOOLS = { A: "abjuration", C: "conjuration", D: "divination",
  E: "enchantment", V: "evocation", I: "illusion", N: "necromancy", T: "transmutation" };

export function fmtTime(time) {
  return (time || []).map((t) => {
    const unit = t.unit === "bonus" ? "bonus action" : t.unit;
    const head = `${t.number} ${unit}${t.number > 1 ? "s" : ""}`.replace(/actions$/, "actions");
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
      /* radius / cone / line / cube / hemisphere, all self-originating */
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

/* ---- combat metadata --------------------------------------------- */

const DICE = /\{@(?:damage|dice|scaledamage) ([0-9]+d[0-9]+(?:\s*\+\s*[0-9]+d[0-9]+)?)/;

/* Same fields, same provenance as the PHB pull: spellAttack /
   savingThrow / damageInflict / conditionInflict off the entry, with
   the dice expression read out of the entry text. `heal` keys off the
   "HL" (healing) miscTag rather than being guessed from wording. */
export function combatMeta(sp) {
  const raw = JSON.stringify(sp.entries || []);
  const dice = raw.match(DICE)?.[1]?.replace(/\s+/g, " ");
  const out = {};
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

/* ---- emit ---------------------------------------------------------- */

export const q = (s) => JSON.stringify(s);

export function writeFile(rel, body) {
  const p = path.join(ROOT, rel);
  fs.writeFileSync(p, body);
  console.log(`wrote ${rel} (${body.length} bytes)`);
}
