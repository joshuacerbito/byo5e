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
const defined = new Set([...css.matchAll(/\.((?:su|ps)-[a-z0-9-]+)/g)].map((m) => m[1]));
const used = new Set();
for (const f of files) {
  const code = fs.readFileSync(f, "utf8");
  /* className can be a plain string, a template literal with ${...}
     interpolation, or a ternary — so scan for su-/ps- tokens directly
     rather than trying to parse the attribute value. */
  for (const m of code.matchAll(/\b((?:su|ps)-[a-z0-9-]+)\b/g)) {
    if (f.endsWith("styles.js")) continue;
    used.add(m[1]);
  }
}
const orphanUse = [...used].filter((c) => !defined.has(c));
if (orphanUse.length) fail("className with no rule: " + orphanUse.join(", "));
else console.log(`  ✓ all ${used.size} classNames have rules`);

const orphanDef = [...defined].filter((c) => !used.has(c));
if (orphanDef.length) console.log(`  · ${orphanDef.length} unused rule(s): ${orphanDef.slice(0, 8).join(", ")}${orphanDef.length > 8 ? "…" : ""}`);

/* 5 — data volumes match what the docs claim */
console.log("Data");
const counts = await (async () => {
  const [{ BASE_RACES }, { LINEAGES }, { CLASSES, ARMOR }, { ALL_SUBCLASSES },
         { BACKGROUNDS }, { PHB_SPELLS }, { SPELLS }, { WEAPONS }] = await Promise.all([
    import("../src/data/baseRaces.js"), import("../src/data/lineages.js"),
    import("../src/data/classes.js"), import("../src/data/subclasses.js"),
    import("../src/data/backgrounds.js"), import("../src/data/phbSpells.js"),
    import("../src/data/islandSpells.js"), import("../src/data/weapons.js"),
  ]);
  return {
    "base races": [Object.keys(BASE_RACES).length, 9],
    "lineages": [LINEAGES.length, 22],
    "classes": [Object.keys(CLASSES).length, 14],
    "armor rows": [ARMOR.length, 19],
    "subclasses": [ALL_SUBCLASSES.length, 58],
    "backgrounds": [BACKGROUNDS.length, 6],
    "island spells": [SPELLS.length, 14],
    "phb spells": [PHB_SPELLS.length, 198],
    "weapons": [WEAPONS.length, 55],
  };
})();
for (const [k, [got, want]] of Object.entries(counts)) {
  if (got !== want) fail(`${k}: ${got}, expected ${want}`);
}
if (Object.values(counts).every(([g, w]) => g === w)) console.log("  ✓ all data counts as expected");

console.log();
console.log(failures ? `${failures} FAILURE(S)` : "All checks passed");
process.exit(failures ? 1 : 0);
