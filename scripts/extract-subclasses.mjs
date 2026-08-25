/* ------------------------------------------------------------------
   Regenerates the two subclass files that are pulled from 5etools-src
   rather than typed by hand:

     src/data/expandedSubclasses.js  XGE + TCE subclasses (57 of them)
     src/data/phbSubclassText.js     feature text for the 40 PHB ones

   Run from the repo root:  node scripts/extract-subclasses.mjs

   Neither file carries an `effects` array.  Effects are hand-authored
   in subclasses.js and merged in there, so re-running this script can
   never clobber them.

   Shape of a 5etools subclass, and what we do with it:

   - `subclassFeatures` lists what the subclass grants, level by level.
     The first entry is always eponymous ("Forge Domain", "The Genie")
     and holds the book's flavor paragraphs.  Its first sentence
     becomes the `blurb`; its refSubclassFeature children are promoted
     to top-level features, since that's where the actual level-1
     mechanics live.
   - Every other entry becomes one [level, name, text] feature tuple.
     Nested refSubclassFeature / refOptionalfeature children are folded
     into the parent's prose as "Name. effect." sentences — the same
     treatment the PHB spell pull gave Command's Approach/Drop/Flee,
     and what keeps Psi Warrior's three psionic options attached to
     Psionic Power instead of floating as three bare features.
   - Expanded spell lists (Oath Spells, Circle Spells, Gloom Stalker
     Magic, Psionic Spells) come through as features with their table
     flattened into the text.  They are NOT modelled as an effect: the
     app has never modelled PHB domain spells either, and adding a
     half-working "these are always prepared" rule for the new books
     only would be worse than leaving both to the reader.
------------------------------------------------------------------- */
import { readJson, fmtEntries, stripTags, writeFile, q } from "./lib/fivetools.mjs";
import fs from "node:fs";
import { PHB_RAW, PHB_UNLOCK } from "../src/data/subclasses.js";

const CLASS_FILES = fs.readdirSync("5etools-src/data/class").filter((f) => f.startsWith("class-"));

/* ---- ref resolution ---------------------------------------------- */

const optFeatures = readJson("optionalfeatures.json").optionalfeature;
const optIndex = new Map();
for (const o of optFeatures) optIndex.set(`${o.name.toLowerCase()}|${o.source}`, o);

/* "Psionic Strike|Fighter||Psi Warrior|TCE|3" */
const parseSubRef = (s) => {
  const [name, className, classSource, subShort, subSource, level] = s.split("|");
  return { name, className, classSource: classSource || "PHB", subShort,
    subSource: subSource || classSource || "PHB", level: +level };
};

/* Strip the "3rd-level Psi Warrior feature" lead-in 5etools prefixes
   onto every subclass feature; the app already shows the level. */
const LEADIN = /^\d+(?:st|nd|rd|th)-level [^.]*? feature(?: \([^)]*\))?[,.]?\s*/i;
const dropLeadIn = (t) => t.replace(LEADIN, "").trim();

function makeResolver(featIndex) {
  /* Replaces ref nodes with the referenced entry, so fmtEntries folds
     it into the parent's prose as a named sentence. */
  const expand = (node, depth = 0) => {
    if (node == null || depth > 6) return node;
    if (Array.isArray(node)) return node.map((n) => expand(n, depth));
    if (typeof node !== "object") return node;
    if (node.type === "refSubclassFeature") {
      const r = parseSubRef(node.subclassFeature);
      const hit = featIndex.get(`${r.subShort}|${r.subSource}|${r.level}|${r.name}`);
      if (!hit) return null;
      return { type: "entries", name: hit.name,
        entries: expand(hit.entries, depth + 1) };
    }
    if (node.type === "refOptionalfeature") {
      const [name, source] = node.optionalfeature.split("|");
      const hit = optIndex.get(`${name.toLowerCase()}|${source || "PHB"}`)
        || optIndex.get(`${name.toLowerCase()}|XGE`)
        || optIndex.get(`${name.toLowerCase()}|TCE`);
      if (!hit) { console.warn(`  ! unresolved optional feature: ${node.optionalfeature}`); return null; }
      return { type: "entries", name: hit.name, entries: expand(hit.entries, depth + 1) };
    }
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = expand(v, depth + 1);
    return out;
  };
  return expand;
}

/* ---- one subclass ------------------------------------------------- */

function buildSubclass(d, sc) {
  const feats = (d.subclassFeature || []).filter((f) =>
    f.subclassShortName === sc.shortName && f.subclassSource === sc.source
    && f.classSource === sc.classSource);
  const featIndex = new Map(feats.map((f) =>
    [`${f.subclassShortName}|${f.subclassSource}|${f.level}|${f.name}`, f]));
  const expand = makeResolver(featIndex);

  const refs = (sc.subclassFeatures || []).map(parseSubRef);
  const rows = [];
  let blurb = "";

  for (const r of refs) {
    const f = featIndex.get(`${r.subShort}|${r.subSource}|${r.level}|${r.name}`);
    if (!f) { console.warn(`  ! missing feature ${sc.name} / ${r.name}`); continue; }
    const own = (f.entries || []).filter((e) => !e?.type?.startsWith("ref"));
    const kids = (f.entries || []).filter((e) => e?.type === "refSubclassFeature");

    if (f.name === sc.name) {
      /* Eponymous entry: flavor to the blurb, children promoted. */
      const flavor = fmtEntries(own.filter((e) => typeof e === "string"));
      blurb = firstSentence(flavor);
      for (const k of kids) {
        const kr = parseSubRef(k.subclassFeature);
        const kf = featIndex.get(`${kr.subShort}|${kr.subSource}|${kr.level}|${kr.name}`);
        if (!kf) { console.warn(`  ! missing child ${sc.name} / ${kr.name}`); continue; }
        rows.push([kf.level, kf.name, dropLeadIn(fmtEntries(expand(kf.entries)))]);
      }
      continue;
    }
    rows.push([f.level, f.name, dropLeadIn(fmtEntries(expand(f.entries)))]);
  }

  rows.sort((a, b) => a[0] - b[0]);

  /* Every feature record, hierarchy ignored.  The PHB backfill uses
     this as a fallback: PHB_RAW lists some options as features in
     their own right (Sacred Weapon, Abjure Enemy) where 5etools files
     them as children of Channel Divinity, so they have no top-level
     row of their own but do have text. */
  const flat = {};
  for (const f of feats) flat[`${f.level}|${f.name}`] = dropLeadIn(fmtEntries(expand(f.entries)));

  return { blurb, rows, flat, expandedSpells: fmtAdditionalSpells(sc) };
}

/* Warlock patrons' Expanded Spell List is the one PHB feature with no
   text of its own in 5etools — the spells live in structured
   `additionalSpells` instead.  Rebuild the book's sentence from it. */
const ORDINAL = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th",
  6: "6th", 7: "7th", 8: "8th", 9: "9th" };

function fmtAdditionalSpells(sc) {
  const rows = [];
  for (const blk of sc.additionalSpells || []) {
    for (const [key, list] of Object.entries(blk.expanded || {})) {
      const lvl = +key.replace(/^s/, "");
      if (!lvl) continue;
      rows.push(`${ORDINAL[lvl]} ${(list || []).map(cleanSpell).join(", ")}`);
    }
  }
  return rows.length ? rows.join("; ") : "";
}

/* "mind sliver|tce#c" / "Evard's black tentacles" -> display name */
const cleanSpell = (s) => stripTags(String(s).split("|")[0].split("#")[0]).trim();

const firstSentence = (t) => {
  const m = t.match(/^.*?[.!?](?=\s|$)/);
  return (m ? m[0] : t).trim();
};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ---- walk every class ---------------------------------------------- */

const expanded = [];
const phbText = {};
const phbNames = new Map(); // "cls|Name" -> { level|feature: text }

for (const file of CLASS_FILES) {
  const d = readJson(`class/${file}`);
  for (const sc of d.subclass || []) {
    if (sc.classSource !== "PHB") continue;
    if (sc.className === "Artificer" || sc.className === "Mystic") continue;
    const cls = sc.className.toLowerCase();
    if (["XGE", "TCE"].includes(sc.source)) {
      const { blurb, rows } = buildSubclass(d, sc);
      expanded.push({ id: slug(sc.name), cls, name: sc.name, src: sc.source.toLowerCase(),
        page: sc.page, blurb, rows });
    } else if (sc.source === "PHB") {
      const { rows, flat, expandedSpells } = buildSubclass(d, sc);
      const map = {};
      for (const [lvl, name, text] of rows) map[`${lvl}|${name}`] = text;
      phbNames.set(`${cls}|${sc.name}`, { map, flat, expandedSpells });
    }
  }
}

/* ---- ids must be unique against what's already in subclasses.js ---- */
const takenIds = new Set(PHB_RAW.map((r) => r[0]));
for (const e of expanded) {
  if (takenIds.has(e.id)) throw new Error(`id collision: ${e.id}`);
  takenIds.add(e.id);
  if (PHB_UNLOCK[e.cls] == null) throw new Error(`no unlock level for ${e.cls}`);
}

/* ---- PHB text: keep only what PHB_RAW actually lists --------------- */

/* PHB_RAW's feature names are the ones the app shows; 5etools' don't
   always agree.  Try the exact level+name, then the same name at any
   level, then the flat index (which sees options filed under a parent),
   then a prefix-insensitive match ("Read Thoughts" vs "Channel
   Divinity: Read Thoughts", "Improved Combat Superiority" vs the same
   with a "(d10)" suffix). */
const norm = (s) => s.toLowerCase().replace(/^channel divinity:\s*/, "")
  .replace(/\s*\([^)]*\)\s*$/, "").trim();

function lookupPhb(rec, lvl, fname) {
  const pools = [rec.map, rec.flat];
  for (const pool of pools) {
    if (pool[`${lvl}|${fname}`]) return pool[`${lvl}|${fname}`];
  }
  for (const pool of pools) {
    const hit = Object.entries(pool).find(([k]) => k.split("|").slice(1).join("|") === fname);
    if (hit) return hit[1];
  }
  for (const pool of pools) {
    const hit = Object.entries(pool).find(([k]) => norm(k.split("|").slice(1).join("|")) === norm(fname));
    if (hit) return hit[1];
  }
  if (/expanded spell list|domain spells|oath spells|circle spells/i.test(fname) && rec.expandedSpells)
    return `The following spells are added to your spell list, one pair becoming available at each of these spell levels: ${rec.expandedSpells}.`;
  return "";
}
let matched = 0;
const missing = [];
for (const [id, cls, name, features] of PHB_RAW) {
  const rec = phbNames.get(`${cls}|${name}`);
  if (!rec) { missing.push(`${name} (whole subclass)`); continue; }
  const out = {};
  for (const [lvl, fname] of features) {
    const key = `${lvl}|${fname}`;
    const text = lookupPhb(rec, lvl, fname);
    if (text) { out[key] = text; matched++; }
    else missing.push(`${name}: ${lvl} ${fname}`);
  }
  phbText[id] = out;
}

console.log(`PHB feature text: ${matched} matched, ${missing.length} unmatched`);
missing.forEach((m) => console.log(`  - ${m}`));

/* ---- emit ----------------------------------------------------------- */

const featTuples = (rows) => rows.map(([lvl, name, text]) =>
  `      [${lvl}, ${q(name)}, ${q(text)}],`).join("\n");

const expandedBody = expanded
  .sort((a, b) => a.cls.localeCompare(b.cls) || a.src.localeCompare(b.src) || a.name.localeCompare(b.name))
  .map((e) => `  { id: ${q(e.id)}, cls: ${q(e.cls)}, name: ${q(e.name)}, src: ${q(e.src)}, page: ${e.page},
    blurb: ${q(e.blurb)},
    features: [
${featTuples(e.rows)}
    ] },`).join("\n");

writeFile("src/data/expandedSubclasses.js", `/* ------------------------------------------------------------------
   GENERATED by scripts/extract-subclasses.mjs — do not hand-edit.

   Xanathar's Guide to Everything (${expanded.filter((e) => e.src === "xge").length}) and Tasha's Cauldron of
   Everything (${expanded.filter((e) => e.src === "tce").length}) subclasses, pulled from 5etools-src's
   class/class-*.json.  Artificer's four TCE subclasses are dropped —
   this app has no artificer.

   Both books are 2014 content, so these sit on the same chassis as the
   PHB subclasses with no special handling.  Feature text is the book's
   own, with nested sub-features and optional-feature options folded
   into the parent's prose as "Name. effect." sentences.

   \`effects\` lives in subclasses.js, hand-authored, and is merged onto
   these records there — so regenerating this file never touches it.
------------------------------------------------------------------- */
export const EXPANDED_SUBCLASS_RAW = [
${expandedBody}
];
`);

const phbBody = Object.entries(phbText).map(([id, map]) => {
  const lines = Object.entries(map).map(([k, v]) => `    ${q(k)}: ${q(v)},`).join("\n");
  return `  ${q(id)}: {\n${lines}\n  },`;
}).join("\n");

writeFile("src/data/phbSubclassText.js", `/* ------------------------------------------------------------------
   GENERATED by scripts/extract-subclasses.mjs — do not hand-edit.

   Feature text for the 40 PHB subclasses, pulled from 5etools-src's
   class/class-*.json (subclassFeature entries, source PHB).  It lives
   in its own file, keyed "level|Feature Name", rather than inside
   PHB_RAW, so that regenerating it can't disturb the hand-authored
   \`effects\` arrays sitting next to those feature tuples.

   Fighting Style / Maneuver / Pact Boon style option lists are folded
   into their parent feature's prose, the same treatment the class
   feature pull in classes.js used.
------------------------------------------------------------------- */
export const PHB_SUBCLASS_TEXT = {
${phbBody}
};
`);

console.log(`expanded subclasses: ${expanded.length}`);
