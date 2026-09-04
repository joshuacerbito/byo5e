/* ------------------------------------------------------------------
   Drives BOTH SRD packs through the content mapper from node:

     node scripts/check-content.mjs      (npm run check:content)

   The packs are read with fs and handed to the PURE builder as parsed
   objects — the same entry point the browser uses via a dynamic
   import(). That is the whole reason src/content/registry.js and
   index.js do no importing of their own.

   Findings vs failures: a failure is the layer being wrong. A finding
   is the CONTENT being incomplete — a level with no class feature, a
   reference the SRD subset genuinely lacks. Findings are printed, never
   suppressed, and never fail the run.
------------------------------------------------------------------- */
import fs from "node:fs";
import path from "node:path";
import { buildContent } from "../src/content/index.js";

const ROOT = path.resolve(process.cwd());
const PACKS = [
  { file: "src/packs/srd-5.1.json", edition: "2014", expectWarnings: 39 },
  { file: "src/packs/srd-5.2.json", edition: "2024", expectWarnings: 13 },
  /* The `test` branch's multi-source packs, checked the same way when
     they have been built. They are gitignored and optional, so an
     absent file is not a failure — and their dangling-ref count moves
     with the source books rather than being a fixed property of an SRD
     subset, so it is reported rather than asserted. */
  { file: "src/packs/test-2014.json", edition: "2014", expectWarnings: null, optional: true },
  { file: "src/packs/test-2024.json", edition: "2024", expectWarnings: null, optional: true },
].filter((p) => !p.optional || fs.existsSync(path.join(path.resolve(process.cwd()), p.file)));

let failures = 0;
const findings = [];
const fail = (m) => { console.log("  ✗ " + m); failures += 1; };
const ok = (m) => console.log("  ✓ " + m);
const note = (m) => { findings.push(m); console.log("  · " + m); };

const pad = (s, n) => String(s).padEnd(n);

/* ---- 8: no 5etools shape left anywhere in a view model ------------
   A surviving "{@" means tag stripping missed a field; a surviving
   pipe reference means a ref was passed through unresolved. Genuine
   prose can contain a pipe, so the test is for the REFERENCE shape:
   a pipe with no space on either side, inside a short-ish token. */
const TAG_RE = /\{@/;
const PIPE_RE = /[A-Za-z0-9')\]]\|[A-Za-z0-9(#|]/;

function scanShape(node, pathStr, out, depth = 0) {
  if (out.length >= 12 || depth > 12) return;
  if (typeof node === "string") {
    if (TAG_RE.test(node)) out.push({ kind: "tag", path: pathStr, sample: node.slice(0, 110) });
    else if (PIPE_RE.test(node)) out.push({ kind: "pipe", path: pathStr, sample: node.slice(0, 110) });
    return;
  }
  if (Array.isArray(node)) { node.forEach((v, i) => scanShape(v, `${pathStr}[${i}]`, out, depth + 1)); return; }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      /* `filter` holds a 5etools query string by design ("level=0|class=Wizard");
         it is machine data for the spell picker, not display text. `ref` on a
         block node is the raw pipe reference kept for traceability alongside
         the resolved name/source/resolved fields toFeature adds next to it —
         it is never rendered on its own. */
      if (k === "filter" || k === "ref" || k === "source" && typeof v === "string") continue;
      scanShape(v, `${pathStr}.${k}`, out, depth + 1);
    }
  }
}

/* ------------------------------------------------------------------ */
for (const p of PACKS) {
  console.log(`\n${"=".repeat(64)}\n${p.file}\n${"=".repeat(64)}`);

  /* 1 — builds with zero thrown errors */
  let content;
  try {
    const pack = JSON.parse(fs.readFileSync(path.join(ROOT, p.file), "utf8"));
    content = buildContent(pack);
    ok(`registry + view models built (${content.pack.name}, rules ${content.edition})`);
  } catch (e) {
    fail(`${p.file} threw: ${e.stack}`);
    continue;
  }
  if (content.edition !== p.edition) fail(`edition ${content.edition}, expected ${p.edition}`);

  /* 2 — census */
  console.log("\nCensus");
  for (const k of content.kinds) console.log(`  ${pad(k, 14)} ${content[k].length}`);

  /* 3 — classes */
  console.log("\nClasses");
  for (const c of content.classes) {
    if (!c.hitDie) fail(`${c.name}: no hit die`);
    if (c.saves.length !== 2) fail(`${c.name}: ${c.saves.length} saves, expected 2`);
    if (c.subclassLevel == null) fail(`${c.name}: no subclass level`);
    if (!c.asiLevels.length) fail(`${c.name}: no ASI levels`);
    if (!c.subclasses.length) note(`${c.name}: no subclasses in this pack`);
    const have = new Set(c.features.map((f) => f.level));
    const gaps = [];
    for (let l = 1; l <= 20; l += 1) if (!have.has(l)) gaps.push(l);
    if (gaps.length) note(`${c.name}: no feature at level ${gaps.join(", ")}`);
  }
  ok(`${content.classes.length} classes: hit die, 2 saves, subclass level, ASI levels`);
  console.log("  " + content.classes.map((c) => `${c.name} d${c.hitDie} sub@${c.subclassLevel} asi[${c.asiLevels}]`).join("\n  "));

  /* 4 — casters */
  console.log("\nCasting");
  for (const c of content.classes) {
    const cs = c.casting;
    if (!cs || !cs.progression) continue;
    if (!cs.ability) fail(`${c.name}: caster with no spellcasting ability`);
    if (cs.progression === "pact") {
      if (!cs.pactSlots || cs.pactSlots.length !== 20) fail(`${c.name}: pact caster without 20 rows of pact slots`);
      else if (!cs.pactSlots[0].count || !cs.pactSlots[0].level) fail(`${c.name}: no pact slot at level 1`);
    } else {
      if (!cs.slotsByLevel || cs.slotsByLevel.length !== 20) { fail(`${c.name}: no 20-level slot table`); continue; }
      const first = cs.slotsByLevel.findIndex((r) => r.some((n) => n > 0)) + 1;
      const expectFirst = cs.progression === "half" ? 2 : 1;
      if (first !== expectFirst) note(`${c.name} (${cs.progression}/${cs.progressionRaw}): first slot at level ${first}, ${expectFirst} expected for that progression`);
      if (!cs.slotsByLevel[19].some((n) => n > 0)) fail(`${c.name}: no slots at level 20`);
    }
    const prep = Array.isArray(cs.preparedByLevel) ? `array[${cs.preparedByLevel.length}]`
      : cs.preparedByLevel ? `formula(${cs.preparedByLevel.base}+${cs.preparedByLevel.ability})` : "-";
    console.log(`  ${pad(c.name, 10)} ${pad(cs.progression, 10)} ${pad(cs.ability, 4)} ${pad(cs.prepares, 10)} prepared=${prep}`);
  }
  ok("every caster has an ability and a slot table");

  /* 5 — spells resolve to a class list */
  const orphanSpells = content.spells.filter((s) => !s.classLists.length);
  console.log("\nSpells");
  if (orphanSpells.length) note(`${orphanSpells.length} spell(s) on no class list: ${orphanSpells.slice(0, 6).map((s) => s.name).join(", ")}`);
  else ok(`all ${content.spells.length} spells resolve to at least one class list`);
  const badSchool = content.spells.filter((s) => !s.school || s.school.length < 3);
  if (badSchool.length) fail(`${badSchool.length} spell(s) with an unmapped school`);
  const renamed = content.spells.filter((s) => s.nameOriginal);
  ok(`${renamed.length} SRD-renamed spells; ids taken from the emitted name (e.g. ${renamed[0]?.nameOriginal} -> ${renamed[0]?.id})`);

  /* 6 — items */
  console.log("\nItems");
  let unresolvedProps = 0;
  for (const w of content.weapons) {
    for (const pr of w.properties) if (pr.label === pr.code && !pr.text) { unresolvedProps += 1; note(`${w.name}: property "${pr.code}" resolved to nothing`); }
    if (!w.dmg && w.name !== "Net") note(`${w.name}: no damage die`);
    if (!w.category) fail(`${w.name}: no weapon category`);
  }
  if (!unresolvedProps) ok(`all property codes on ${content.weapons.length} weapons resolve`);
  for (const a of content.armor) if (a.ac == null) fail(`${a.name}: armor with no AC`);
  ok(`all ${content.armor.length} armor rows have an AC`);
  const masteryCount = content.weapons.filter((w) => w.mastery.length).length;
  console.log(`  weapons ${content.weapons.length} · armor ${content.armor.length} · gear ${content.gear.length} · with mastery ${masteryCount}`);

  /* 7 — dangling references */
  console.log("\nWarnings (dangling references)");
  const byKind = {};
  for (const w of content.warnings) byKind[w.kind] = (byKind[w.kind] || 0) + 1;
  console.log(`  total ${content.warnings.length} · ` + (Object.entries(byKind).map(([k, v]) => `${k} ${v}`).join(" · ") || "none"));
  const uniqRefs = new Set(content.warnings.map((w) => `${w.kind}|${w.ref}`));
  console.log(`  ${uniqRefs.size} distinct reference(s):`);
  for (const r of [...uniqRefs].sort()) console.log(`    ${r}`);
  if (p.expectWarnings == null) {
    note(`${uniqRefs.size} distinct dangling refs (not asserted for a test pack)`);
  } else if (uniqRefs.size !== p.expectWarnings) {
    note(`expected ${p.expectWarnings} distinct dangling refs, got ${uniqRefs.size}`);
  } else ok(`${p.expectWarnings} distinct dangling refs, as the pack build reported`);

  /* 8 — no 5etools shape survives */
  console.log("\nShape");
  const offenders = [];
  for (const k of content.kinds) scanShape(content[k], k, offenders);
  if (offenders.length) {
    for (const o of offenders) fail(`${o.kind} left in ${o.path}: ${o.sample}`);
  } else ok("no {@tag} and no pipe reference survives in any view model");
}

console.log(`\n${"=".repeat(64)}`);
console.log(findings.length ? `${findings.length} finding(s) reported above.` : "No findings.");
if (failures) { console.log(`${failures} FAILURE(S).`); process.exit(1); }
console.log("check:content OK");
