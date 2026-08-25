/* ------------------------------------------------------------------
   Builds the two SRD content packs from a local 5etools-src checkout:

     node scripts/build-srd-pack.mjs      (npm run build:packs)

   Output: src/packs/srd-5.1.json and src/packs/srd-5.2.json — one per
   rules edition, each self-contained. The app bundles these and ships
   nothing else from 5etools; the checkout itself stays gitignored
   while the packs are committed.

   Records are emitted in 5etools shape, VERBATIM. Entry trees and
   {@tag} markup are left exactly as found, because the app has a
   mapper layer that consumes that shape and strips tags at runtime.
   The only edits are (a) dropping pure 5etools bookkeeping fields,
   (b) the SRD rename below, and (c) a `classLists` array injected onto
   spells, which is the one piece of eligibility data 5etools keeps
   outside the record.

   Deterministic by construction: every collection is sorted by a
   stable composite key and no build timestamp is written, so a re-run
   over the same checkout produces a byte-identical file.
------------------------------------------------------------------- */
import fs from "node:fs";
import path from "node:path";
import {
  DATA, ROOT, readJson, EDITIONS, isSrd, applySrdName, stripBookkeeping,
  resolveCopies, parseClassFeatureRef, parseSubclassFeatureRef, parseOptionalFeatureRef,
  classFeatureKey, subclassFeatureKey, optionalFeatureKey, collectRefNodes,
  sortBy, recordKey, slug,
} from "./lib/fivetools-srd.mjs";

const OUT_DIR = path.join(ROOT, "src", "packs");

/* No CC-BY-4.0 attribution text exists anywhere in the 5etools-src
   checkout (grepped for "Creative Commons" and "CC-BY" across data/
   and books.json — the only hit is package-lock.json's license fields).
   Rather than paraphrase a legal notice from memory, this ships as a
   placeholder to be pasted in from the SRD PDFs. */
const LICENSE_NOTICE = "TODO: paste the SRD 5.1 / 5.2 CC-BY-4.0 attribution notice verbatim";

const warnings = [];
const warn = (m) => warnings.push(m);

/* ------------------------------------------------------------------
   Sources of truth, per collection
------------------------------------------------------------------- */

function loadClassFiles() {
  /* _copy resolution happens per file, before any filtering: a copy's
     `_preserve` block can carry an `srd` flag onto the copied record,
     so filtering first would read half-built records. See
     _meta.internalCopies for which arrays resolve against the file. */
  const files = fs.readdirSync(path.join(DATA, "class"))
    .filter((f) => f.startsWith("class-") && f.endsWith(".json"))
    .sort();
  const all = { class: [], subclass: [], classFeature: [], subclassFeature: [] };
  for (const f of files) {
    const j = readJson(`class/${f}`);
    resolveCopies(j, j._meta?.internalCopies || [], (m) => warn(`class/${f}: ${m}`));
    for (const k of Object.keys(all)) all[k].push(...(j[k] || []));
  }
  return all;
}

/* Class-tied records need BOTH filters.

   `source` is what says which book printed the record. `classSource`
   says which edition of the class it hangs off — and 5etools re-files
   every 2014 subclass under the 2024 class as well, so 128 legacy
   subclasses carry classSource: "XPHB" while being 2014 records with
   source: "PHB". Filtering on classSource alone therefore pulls 2014
   content into the 2024 pack; filtering on source alone pulls in the
   XPHB-classSource duplicates of the very same 2014 subclasses (their
   _copy blocks _preserve the srd flag). Requiring both gives one
   record per subclass, filed against its own edition's class. */
const classTied = (arr, ed) =>
  arr.filter((r) => isSrd(r, ed.flag) && r.source === ed.book && r.classSource === ed.book);

const plain = (arr, ed) => arr.filter((r) => isSrd(r, ed.flag) && r.source === ed.book);

function spellsFor(ed, spellSources) {
  const raw = readJson(ed.spellFile).spell;
  const block = spellSources[ed.book] || {};
  return plain(raw, ed).map((sp) => {
    /* Class eligibility is not on the spell record — it lives in
       spells/sources.json, keyed by the spell's ORIGINAL name (so this
       lookup has to happen before the SRD rename). `classVariant`
       entries are lists a later book granted to a class that the
       Handbook did not; both keys are folded into one flat array of
       lowercase class slugs, filtered to this edition's own class
       source so e.g. artificer (TCE) never leaks in. */
    const e = block[sp.name] || {};
    const names = [...(e.class || []), ...(e.classVariant || [])]
      .filter((c) => c.source === ed.book)
      .map((c) => slug(c.name));
    return { ...sp, classLists: [...new Set(names)].sort() };
  });
}

/* ------------------------------------------------------------------
   Build one pack
------------------------------------------------------------------- */
function buildPack(ed, shared) {
  const { classes, races, backgrounds, feats, optFeatures, itemsBase, skills, languages, conditions, spellSources } = shared;

  const content = {
    classes: plain(classes.class, ed),
    classFeatures: classTied(classes.classFeature, ed),
    subclasses: classTied(classes.subclass, ed),
    subclassFeatures: classTied(classes.subclassFeature, ed),

    races: plain(races.race, ed),
    /* 2024 folded subraces into species traits, so this is empty for
       5.2 by design, not by a filter bug. */
    subraces: plain(races.subrace || [], ed),
    backgrounds: plain(backgrounds.background, ed),
    feats: plain(feats.feat, ed),
    optionalFeatures: plain(optFeatures.optionalfeature, ed),

    spells: spellsFor(ed, spellSources),

    /* itemsBase.baseitem is the equipment table plus items.json's
       mundane (rarity:"none") records, merged above — see there. */
    items: plain(itemsBase.baseitem, ed),
    /* itemProperty / itemType / itemMastery carry no SRD flag of any
       kind, so `source` is the only filter that exists for them. */
    itemProperties: (itemsBase.itemProperty || []).filter((r) => ed.itemBooks.includes(r.source)),
    itemTypes: (itemsBase.itemType || []).filter((r) => ed.itemBooks.includes(r.source)),
    itemMasteries: (itemsBase.itemMastery || []).filter((r) => ed.itemBooks.includes(r.source)),

    skills: plain(skills.skill, ed),
    languages: plain(languages.language, ed),
    conditions: plain(conditions.condition, ed),
  };

  const renamed = [];
  for (const key of Object.keys(content)) {
    const rows = content[key].map((r) => {
      const next = applySrdName(r, ed.flag);
      if (next.nameOriginal) renamed.push({ collection: key, from: next.nameOriginal, to: next.name });
      return stripBookkeeping(next);
    });
    content[key] = sortBy(rows, recordKey);
  }

  const counts = Object.fromEntries(Object.entries(content).map(([k, v]) => [k, v.length]));
  const sourceBooks = [...new Set(Object.values(content).flat().map((r) => r.source).filter(Boolean))].sort();

  const pack = {
    packFormat: 1,
    id: ed.id,
    name: ed.name,
    abbrev: "SRD",
    rulesEdition: ed.rulesEdition,
    sourceBooks,
    license: { spdx: "CC-BY-4.0", holder: "Wizards of the Coast LLC", notice: LICENSE_NOTICE },
    counts,
    content,
  };
  return { pack, renamed, dangling: auditRefs(pack) };
}

/* ------------------------------------------------------------------
   Reference audit

   Every classFeatures / subclassFeatures string and every ref* node in
   an entry tree must point at something the pack itself carries. A
   dangling one is reported, never dropped: it is a fact about what the
   SRD subset genuinely lacks, and silently pruning it would hide that.
------------------------------------------------------------------- */
function auditRefs(pack) {
  const c = pack.content;
  const have = {
    classFeature: new Set(c.classFeatures.map(classFeatureKey)),
    subclassFeature: new Set(c.subclassFeatures.map(subclassFeatureKey)),
    optionalfeature: new Set(c.optionalFeatures.map(optionalFeatureKey)),
  };
  const missing = new Map();
  const need = (kind, str, from) => {
    const p = kind === "classFeature" ? parseClassFeatureRef(str)
      : kind === "subclassFeature" ? parseSubclassFeatureRef(str)
        : parseOptionalFeatureRef(str);
    const key = kind === "classFeature" ? classFeatureKey(p)
      : kind === "subclassFeature" ? subclassFeatureKey(p)
        : optionalFeatureKey(p);
    if (have[kind].has(key)) return;
    const id = `${kind}|${str}`;
    if (!missing.has(id)) missing.set(id, { kind, ref: str, from: new Set() });
    missing.get(id).from.add(from);
  };

  for (const cl of c.classes) {
    for (const s of cl.classFeatures || []) need("classFeature", typeof s === "string" ? s : s.classFeature, `class ${cl.name}`);
  }
  for (const sc of c.subclasses) {
    for (const s of sc.subclassFeatures || []) need("subclassFeature", typeof s === "string" ? s : s.subclassFeature, `subclass ${sc.name} (${sc.className})`);
  }
  for (const key of Object.keys(c)) {
    for (const rec of c[key]) {
      for (const [kind, str] of collectRefNodes(rec.entries)) need(kind, str, `${key}: ${rec.name}`);
    }
  }
  return [...missing.values()]
    .map((m) => ({ kind: m.kind, ref: m.ref, from: [...m.from].sort() }))
    .sort((a, b) => (a.kind + a.ref < b.kind + b.ref ? -1 : 1));
}

/* ------------------------------------------------------------------
   Run
------------------------------------------------------------------- */
const shared = (() => {
  const races = readJson("races.json");
  resolveCopies(races, races._meta?.internalCopies || [], (m) => warn(`races.json: ${m}`));
  const backgrounds = readJson("backgrounds.json");
  resolveCopies(backgrounds, backgrounds._meta?.internalCopies || [], (m) => warn(`backgrounds.json: ${m}`));
  const itemsBase = readJson("items-base.json");
  resolveCopies(itemsBase, itemsBase._meta?.internalCopies || [], (m) => warn(`items-base.json: ${m}`));
  /* items.json is items-base's mundane gear (adventuring packs, tools,
     spellcasting foci, quivers, ...) mixed in with every magic item in
     the game. Magic items are deliberately out of scope — this is a
     character builder — so only rarity:"none" records are pulled in;
     everything from "common" up is a magic item by 5etools convention
     and stays excluded. No name+source collides with items-base.json. */
  const items = readJson("items.json");
  resolveCopies(items, items._meta?.internalCopies || [], (m) => warn(`items.json: ${m}`));
  itemsBase.baseitem = [...itemsBase.baseitem, ...items.item.filter((r) => r.rarity === "none")];
  return {
    classes: loadClassFiles(),
    races, backgrounds, itemsBase,
    feats: readJson("feats.json"),
    optFeatures: readJson("optionalfeatures.json"),
    skills: readJson("skills.json"),
    languages: readJson("languages.json"),
    conditions: readJson("conditionsdiseases.json"),
    spellSources: readJson("spells/sources.json"),
  };
})();

fs.mkdirSync(OUT_DIR, { recursive: true });
const results = [];
for (const ed of EDITIONS) {
  const built = buildPack(ed, shared);
  const file = path.join(OUT_DIR, `${ed.id}.json`);
  /* Compact JSON: this is generated data, read by the app, not by a
     human, and pretty-printing it adds roughly a third to the size of
     a file that gets committed. */
  fs.writeFileSync(file, JSON.stringify(built.pack) + "\n");
  results.push({ ed, file, ...built });
}

/* ---- report ------------------------------------------------------ */
const COLS = Object.keys(results[0].pack.counts);
const pad = (s, n) => String(s).padEnd(n);
const w = Math.max(...COLS.map((c) => c.length)) + 2;

console.log("\nSRD content packs\n");
console.log(pad("collection", w) + pad("5.1", 8) + "5.2");
console.log("-".repeat(w + 14));
for (const c of COLS) console.log(pad(c, w) + pad(results[0].pack.counts[c], 8) + results[1].pack.counts[c]);

for (const r of results) {
  const bytes = fs.statSync(r.file).size;
  console.log(`\n${r.ed.name}  ${path.relative(ROOT, r.file)}  ${(bytes / 1024).toFixed(1)} kB  sourceBooks=[${r.pack.sourceBooks}]`);
  console.log(`  SRD-renamed records: ${r.renamed.length}`);
  for (const x of r.renamed) console.log(`    ${x.collection}: ${x.from} -> ${x.to}`);
  console.log(`  dangling references: ${r.dangling.length}`);
  for (const d of r.dangling) console.log(`    [${d.kind}] ${d.ref}\n        from ${d.from.join(", ")}`);
}

if (warnings.length) {
  console.log(`\n_copy / _mod warnings (${warnings.length}):`);
  for (const m of [...new Set(warnings)]) console.log("  " + m);
}
console.log("");
