/* Static checks for the character creator.
   Run with `npm run check`. These exist because four separate bugs in this
   project came from trusting a confident assumption instead of a tool:
   a misread stat block, a false-positive syntax error, a wrong test
   expectation, and a print function that never worked. */

import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import fs from "fs";
import path from "path";

const traverse = _traverse.default ?? _traverse;
const SRC = "src";

const files = [];
(function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const q = path.join(dir, f);
    if (fs.statSync(q).isDirectory()) walk(q);
    else if (/\.(js|jsx)$/.test(f)) files.push(q);
  }
})(SRC);

let failures = 0;
const fail = (msg) => { console.log("  ✗ " + msg); failures++; };

/* 1 — everything parses as ESM + JSX */
console.log("Parsing");
const asts = {};
for (const f of files) {
  try {
    asts[f] = parse(fs.readFileSync(f, "utf8"), { sourceType: "module", plugins: ["jsx"] });
  } catch (e) {
    fail(`${f}: ${e.message}`);
  }
}
if (!failures) console.log(`  ✓ ${files.length} modules parse`);

/* 2 — every named import resolves to a real export */
console.log("Imports");
const exports = {}, imports = {};
for (const f of files) {
  if (!asts[f]) continue;
  exports[f] = new Set();
  imports[f] = [];
  traverse(asts[f], {
    ExportNamedDeclaration(p) {
      const d = p.node.declaration;
      if (d?.declarations) d.declarations.forEach((x) => exports[f].add(x.id.name));
      if (d?.id) exports[f].add(d.id.name);
      (p.node.specifiers || []).forEach((sp) => exports[f].add(sp.exported.name));
    },
    ExportDefaultDeclaration() { exports[f].add("default"); },
    ImportDeclaration(p) {
      p.node.specifiers.forEach((sp) => imports[f].push({
        src: p.node.source.value,
        name: sp.type === "ImportDefaultSpecifier" ? "default" : sp.imported.name,
      }));
    },
  });
}
let importIssues = 0;
for (const f of files) {
  for (const im of imports[f] || []) {
    if (!im.src.startsWith(".")) continue;
    const t = path.normalize(path.join(path.dirname(f), im.src));
    if (!fs.existsSync(t)) { fail(`${f} -> missing ${im.src}`); importIssues++; }
    else if (!exports[t]?.has(im.name)) { fail(`${f} imports {${im.name}} from ${im.src}, not exported`); importIssues++; }
  }
}
if (!importIssues) console.log("  ✓ every cross-module import resolves");

/* 3 — no identifier used without being imported or declared */
console.log("Bindings");
const GLOBALS = new Set(["React", "window", "document", "Blob", "URL", "setTimeout",
  "console", "Math", "Object", "Array", "JSON", "Set", "Map", "Number", "String",
  "Boolean", "undefined", "isNaN", "parseInt", "parseFloat", "localStorage",
  "Promise", "Error", "File", "navigator", "Date", "Uint8Array", "btoa"]);
let unbound = 0;
for (const f of files) {
  if (!asts[f]) continue;
  const missing = new Set();
  traverse(asts[f], {
    Program(p) {
      p.traverse({
        ReferencedIdentifier(q) {
          const n = q.node.name;
          if (!GLOBALS.has(n) && !q.scope.hasBinding(n, true)) missing.add(n);
        },
      });
    },
  });
  if (missing.size) { fail(`${f} unbound: ${[...missing].join(", ")}`); unbound++; }
}
if (!unbound) console.log("  ✓ no unbound identifiers");

/* 4 — every className has a matching rule in styles.js */
console.log("Styles");
const css = fs.readFileSync("src/styles.js", "utf8");
const defined = new Set([...css.matchAll(/\.((?:byo|ps)-[a-z0-9-]+)/g)].map((m) => m[1]));
const used = new Set();
for (const f of files) {
  const code = fs.readFileSync(f, "utf8");
  /* className can be a plain string, a template literal with ${...}
     interpolation, or a ternary — so scan for byo-/ps- tokens directly
     rather than trying to parse the attribute value. */
  for (const m of code.matchAll(/\b((?:byo|ps)-[a-z0-9-]+)\b/g)) {
    if (f.endsWith("styles.js")) continue;
    used.add(m[1]);
  }
}
const orphanUse = [...used].filter((c) => !defined.has(c));
if (orphanUse.length) fail("className with no rule: " + orphanUse.join(", "));
else console.log(`  ✓ all ${used.size} classNames have rules`);

const orphanDef = [...defined].filter((c) => !used.has(c));
if (orphanDef.length) console.log(`  · ${orphanDef.length} unused rule(s): ${orphanDef.slice(0, 8).join(", ")}${orphanDef.length > 8 ? "…" : ""}`);

/* 5 — the data refers only to things that exist.

   This used to assert row counts against the numbers in CLAUDE.md, which
   caught a truncated file and nothing else: every content addition failed
   the check by design, so the expected numbers were edited to match the
   data as a matter of routine — an assertion you always update is an
   assertion that never fires. What actually breaks the app is a dangling
   reference: a subclass on a class that isn't there, a lineage under a
   base race that was removed, a spell list naming a spell nobody wrote.
   Those are checked here instead, and the counts are printed as a census
   rather than enforced. */
console.log("Data");
const data = await (async () => {
  const [{ BASE_RACES }, { LINEAGES }, { CLASSES, ARMOR, ALL_SKILLS }, { ALL_SUBCLASSES },
         { BACKGROUNDS }, { PHB_SPELLS }, { SCC_SPELLS }, { XGE_SPELLS }, { TCE_SPELLS },
         { SPELLS, SPELL_LISTS }, { WEAPONS }, { FEATS }] = await Promise.all([
    import("../src/data/baseRaces.js"), import("../src/data/lineages.js"),
    import("../src/data/classes.js"), import("../src/data/subclasses.js"),
    import("../src/data/backgrounds.js"), import("../src/data/phbSpells.js"),
    import("../src/data/sccSpells.js"), import("../src/data/xgeSpells.js"),
    import("../src/data/tceSpells.js"),
    import("../src/data/islandSpells.js"), import("../src/data/weapons.js"),
    import("../src/data/feats.js"),
  ]);
  return { BASE_RACES, LINEAGES, CLASSES, ARMOR, ALL_SKILLS, ALL_SUBCLASSES, BACKGROUNDS,
           PHB_SPELLS, SCC_SPELLS, XGE_SPELLS, TCE_SPELLS, SPELLS, SPELL_LISTS, WEAPONS, FEATS };
})();

const { BASE_RACES, LINEAGES, CLASSES, ARMOR, ALL_SKILLS, ALL_SUBCLASSES, BACKGROUNDS,
        PHB_SPELLS, SCC_SPELLS, XGE_SPELLS, TCE_SPELLS, SPELLS, SPELL_LISTS,
        WEAPONS, FEATS } = data;

const classIds = new Set(Object.keys(CLASSES));
const baseIds = new Set(Object.keys(BASE_RACES));
const lineageIds = new Set(LINEAGES.map((l) => l.id));
const weaponIds = new Set(WEAPONS.map((w) => w.id));
const skillNames = new Set(ALL_SKILLS);
const islandSpellNames = new Set(SPELLS.map((s) => s.name));

/* The effect types the app actually reads. A typo here is silent at
   runtime — fx("armourProf") simply returns nothing — so it is worth
   a check even though it costs a list to maintain. */
const EFFECT_TYPES = new Set(["acFormula", "armorProf", "shieldProf", "weaponProf",
  "skillProf", "languages", "hpPerLevel", "casting", "bonusCantrips", "bonusSkills",
  "preparedBonus", "speed", "darkvision"]);

let dataIssues = 0;
const bad = (msg) => { fail(msg); dataIssues++; };

for (const sc of ALL_SUBCLASSES) {
  if (!classIds.has(sc.cls)) bad(`subclass ${sc.id}: cls "${sc.cls}" is not a class`);
  if (typeof sc.unlock !== "number") bad(`subclass ${sc.id}: unlock is not a number`);
}

for (const l of LINEAGES) {
  if (!baseIds.has(l.base)) bad(`lineage ${l.id}: base "${l.base}" is not a base race`);
  for (const t of l.traits || []) {
    for (const sk of t.skills || []) {
      if (!skillNames.has(sk)) bad(`lineage ${l.id}, trait ${t.name}: unknown skill "${sk}"`);
    }
  }
}

for (const [cls, list] of Object.entries(SPELL_LISTS)) {
  if (!classIds.has(cls)) bad(`SPELL_LISTS: "${cls}" is not a class`);
  for (const n of list) {
    if (!islandSpellNames.has(n)) bad(`SPELL_LISTS.${cls}: no spell named "${n}"`);
  }
}

for (const [id, k] of Object.entries(CLASSES)) {
  /* The bard's list is the string "any" rather than an array — a sentinel
     the app reads as "every skill". Anything else non-array is a mistake. */
  if (Array.isArray(k.skills)) {
    for (const sk of k.skills) {
      if (!skillNames.has(sk)) bad(`class ${id}: unknown skill "${sk}"`);
    }
  } else if (k.skills !== "any") {
    bad(`class ${id}: skills is neither a list nor "any"`);
  }
  const eq = k.startingEquipment || {};
  const picks = [...(eq.weaponChoices || []).flat(), ...(eq.fixedWeapons || [])];
  for (const opt of picks) {
    if (opt.weapon && !weaponIds.has(opt.weapon)) {
      bad(`class ${id}: startingEquipment names unknown weapon "${opt.weapon}"`);
    }
  }
  for (const w of k.weaponProf?.specific || []) {
    if (!weaponIds.has(w)) bad(`class ${id}: weaponProf names unknown weapon "${w}"`);
  }
}

for (const bg of BACKGROUNDS) {
  for (const sk of [...(bg.skills?.fixed || []), ...(bg.skills?.from || [])]) {
    if (!skillNames.has(sk)) bad(`background ${bg.id}: unknown skill "${sk}"`);
  }
}

for (const [where, effects] of [
  ...LINEAGES.map((l) => [`lineage ${l.id}`, l.effects]),
  ...ALL_SUBCLASSES.map((sc) => [`subclass ${sc.id}`, sc.effects]),
]) {
  for (const e of effects || []) {
    if (!EFFECT_TYPES.has(e.type)) bad(`${where}: unknown effect type "${e.type}"`);
    /* `from` means a skill pool on bonusSkills and a spell list name on
       casting — only the first is a list of skills. */
    if (e.type === "bonusSkills") {
      for (const sk of e.from || []) {
        if (!skillNames.has(sk)) bad(`${where}: bonusSkills names unknown skill "${sk}"`);
      }
    }
  }
}

for (const ft of FEATS) {
  for (const r of ft.prereq?.races || []) {
    if (!baseIds.has(r.base)) bad(`feat ${ft.id}: prereq base "${r.base}" is not a base race`);
    if (r.lineage && !lineageIds.has(r.lineage)) {
      bad(`feat ${ft.id}: prereq lineage "${r.lineage}" is not a lineage`);
    }
  }
}

if (!dataIssues) console.log("  ✓ every cross-reference in the data resolves");

/* Census — printed, never asserted. Losing half a file shows up here as a
   number that dropped, without failing a build for adding content. */
const census = {
  "base races": Object.keys(BASE_RACES).length, lineages: LINEAGES.length,
  classes: classIds.size, subclasses: ALL_SUBCLASSES.length,
  backgrounds: BACKGROUNDS.length, "armor rows": ARMOR.length, weapons: WEAPONS.length,
  feats: FEATS.length,
  spells: SPELLS.length + PHB_SPELLS.length + SCC_SPELLS.length + XGE_SPELLS.length + TCE_SPELLS.length,
};
console.log("  · " + Object.entries(census).map(([k, v]) => `${v} ${k}`).join(", "));

console.log();
console.log(failures ? `${failures} FAILURE(S)` : "All checks passed");
process.exit(failures ? 1 : 0);
