/* ------------------------------------------------------------------
   Regenerates src/data/optionalFeatures.js from a local 5etools-src
   checkout.  Run from the repo root:

     node scripts/extract-optional-features.mjs

   Two different things live in that file:

   1. OPTION_LISTS — lists of options a class feature says to choose
      from.  Most of these are already folded into the class feature's
      own prose (Fighting Style, Metamagic, Pact Boon, Battle Master
      maneuvers), so only the additions each book makes are emitted —
      plus the Handbook's eldritch invocations, which the warlock's
      feature text points at ("the Optional Features page") without
      ever listing, so the app had no invocation list at all.

   2. TCE_CLASS_FEATURES — Tasha's optional class features proper
      (Deft Explorer, Favored Foe, Steady Aim, Wild Companion, Harness
      Divine Power and the rest), which are extra class features
      offered as a variant rule rather than options within a feature.

   Everything sourced TCE is gated behind the app's opt-in toggle,
   because Tasha's itself frames these as optional rules a table
   adopts.  Xanathar's additions are not gated: XGE is an ordinary
   content book, the way the Handbook is.

   Invocations above 5th-level warlock are dropped — unreachable in
   this campaign's range — the same filter the spell pulls apply.
------------------------------------------------------------------- */
import { readJson, fmtEntries, stripTags, writeFile, q } from "./lib/fivetools.mjs";

const MAX_LEVEL = 5;

const opt = readJson("optionalfeatures.json").optionalfeature;

/* Which of this app's classes each 5etools featureType belongs to, and
   where in the class's level progression the choice is made. */
const GROUPS = [
  { type: "EI", cls: "warlock", level: 2, label: "Eldritch Invocations", srcs: ["PHB", "XGE", "TCE"] },
  { type: "MM", cls: "sorcerer", level: 3, label: "Metamagic", srcs: ["TCE"] },
  { type: "PB", cls: "warlock", level: 3, label: "Pact Boon", srcs: ["TCE"] },
  { type: "MV:B", cls: "fighter", level: 3, label: "Maneuvers", srcs: ["TCE"], subclass: "battle-master" },
  { type: "FS:F", cls: "fighter", level: 1, label: "Fighting Style", srcs: ["TCE"] },
  { type: "FS:P", cls: "paladin", level: 2, label: "Fighting Style", srcs: ["TCE"] },
  { type: "FS:R", cls: "ranger", level: 2, label: "Fighting Style", srcs: ["TCE"] },
];

const BOOK = { PHB: "phb", XGE: "xge", TCE: "tce" };
const BOOK_LABEL = { PHB: "Handbook", XGE: "Xanathar's", TCE: "Tasha's" };

/* Prerequisites, in the book's own shorthand, kept in the option's
   sentence so a reader can see why an option isn't for them. */
function prereqText(o) {
  const bits = [];
  for (const p of o.prerequisite || []) {
    if (p.level?.level) bits.push(`${p.level.level}th level`);
    if (p.pact) bits.push(`Pact of the ${p.pact}`);
    if (p.spell) bits.push(p.spell.map((s) => stripTags(s.split("#")[0])).join(" or "));
    if (p.patron) bits.push(stripTags(p.patron));
    if (p.otherSummary?.entry) bits.push(stripTags(p.otherSummary.entry));
  }
  return bits.join(", ");
}

const tooHigh = (o) => (o.prerequisite || [])
  .some((p) => (p.level?.level || 0) > MAX_LEVEL);

const lists = [];
for (const g of GROUPS) {
  for (const src of g.srcs) {
    const rows = opt.filter((o) => (o.featureType || []).includes(g.type)
      && o.source === src && !tooHigh(o))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!rows.length) continue;
    const text = rows.map((o) => {
      const pre = prereqText(o);
      return `${o.name}${pre ? ` (prerequisite: ${pre})` : ""}. ${fmtEntries(o.entries)}`;
    }).join(" ");
    lists.push({ cls: g.cls, src: BOOK[src], level: g.level, subclass: g.subclass || null,
      name: `${g.label} — ${BOOK_LABEL[src]} options`, text });
  }
}

/* ---- Tasha's optional class features ------------------------------ */

import fs from "node:fs";
const CLASS_FILES = fs.readdirSync("5etools-src/data/class").filter((f) => f.startsWith("class-"));
const SKIP = new Set(["Artificer", "Mystic", "Sidekick"]);

/* 5etools prefixes each of these with "3rd-level rogue optional
   feature", sometimes continuing ", which replaces the Favored Enemy
   feature". The level is already on the tuple, but which feature it
   replaces is the single most important thing about an optional
   feature, so that clause is kept and turned into its own sentence. */
const OPTIONAL_LEADIN =
  /^\d+(?:st|nd|rd|th)-level \w+ optional feature(?:,\s*which\s+(.*?))?\.?$/i;

function optionalText(f) {
  const entries = [...(f.entries || [])];
  /* The lead-in is its own entry string, so match it there rather than
     against the flattened prose — a sentence boundary is exactly what
     flattening throws away. */
  const first = typeof entries[0] === "string" ? stripTags(entries[0]) : null;
  const m = first && first.match(OPTIONAL_LEADIN);
  let clause = "";
  if (m) {
    entries.shift();
    if (m[1]) clause = `${m[1].charAt(0).toUpperCase()}${m[1].slice(1)}. `;
  }
  return (clause + fmtEntries(entries)).trim();
}

const tceFeatures = {};
for (const file of CLASS_FILES) {
  const d = readJson(`class/${file}`);
  for (const f of d.classFeature || []) {
    if (f.source !== "TCE" || f.classSource !== "PHB") continue;
    if (SKIP.has(f.className)) continue;
    if (f.level > MAX_LEVEL) continue;
    /* "Metamagic Options" is a pointer at a list, not a feature — the
       list itself is already emitted above as an OPTION_LISTS row. */
    if (f.name === "Metamagic Options") continue;
    const cls = f.className.toLowerCase();
    (tceFeatures[cls] ||= []).push([f.level, f.name, optionalText(f)]);
  }
}
for (const rows of Object.values(tceFeatures)) rows.sort((a, b) => a[0] - b[0]);

/* ---- emit ---------------------------------------------------------- */

const listBody = lists.map((l) => `  { cls: ${q(l.cls)}, src: ${q(l.src)}, level: ${l.level},` +
  `${l.subclass ? ` subclass: ${q(l.subclass)},` : ""}\n    name: ${q(l.name)},\n    text: ${q(l.text)} },`).join("\n");

const featBody = Object.entries(tceFeatures).map(([cls, rows]) =>
  `  ${cls}: [\n${rows.map(([lvl, name, text]) =>
    `    [${lvl}, ${q(name)}, ${q(text)}],`).join("\n")}\n  ],`).join("\n");

writeFile("src/data/optionalFeatures.js", `/* ------------------------------------------------------------------
   GENERATED by scripts/extract-optional-features.mjs — do not
   hand-edit. The action-economy tags for these features are
   hand-authored in classes.js (OPTIONAL_ACTION_TAGS) and merged on
   there, so regenerating this file never clobbers them.

   OPTION_LISTS       extra options for a feature that already says
                      "choose one of the following": invocations,
                      metamagic, fighting styles, maneuvers, pact
                      boons. Rendered as one extra class feature each.
   TCE_CLASS_FEATURES Tasha's optional class features — whole extra
                      features (Deft Explorer, Favored Foe, Steady
                      Aim, Wild Companion, Harness Divine Power).

   Anything with src "tce" appears only when the character's Tasha's
   optional-features toggle is on; Tasha's presents these as a variant
   the table opts into. Xanathar's additions are ungated — XGE is an
   ordinary content book. Handbook invocations are ungated too: the
   warlock's own feature text refers to a list the app never carried.

   Levels above ${MAX_LEVEL} are filtered out at extraction, matching the
   campaign ceiling everything else in the app respects.
------------------------------------------------------------------- */
export const OPTION_LISTS = [
${listBody}
];

export const TCE_CLASS_FEATURES = {
${featBody}
};
`);
console.log(`option lists: ${lists.length}`);
for (const [c, r] of Object.entries(tceFeatures)) console.log(`  ${c}: ${r.map((x) => `${x[0]} ${x[1]}`).join(", ")}`);
