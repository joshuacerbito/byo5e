// Recon utility: concatenate every 5etools-src/data/spells/spells-*.json
// "spell" array into one file, joining in each spell's eligible classes from
// sources.json (keyed by [book][spellName] -> {class:[{name,source}], ...}).
// No dedupe/merge — each spell already carries its own "source" field.
// Not wired into build-srd-pack.mjs.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "5etools-src/data/spells";
const outPath = "5etools-src/data/spells/all-spells.json";

const sources = JSON.parse(readFileSync(join(dir, "sources.json"), "utf8"));

const files = readdirSync(dir)
  .filter((f) => /^spells-.*\.json$/.test(f))
  .sort();

const spell = files.flatMap((f) => {
  const data = JSON.parse(readFileSync(join(dir, f), "utf8"));
  return data.spell ?? [];
}).map((sp) => {
  const entry = sources[sp.source]?.[sp.name];
  // class = spell's home class list; classVariant = added to a class by an
  // optional/variant rule (e.g. XGE's expanded spell lists) — both count.
  const names = [...(entry?.class ?? []), ...(entry?.classVariant ?? [])].map((c) => c.name);
  const classes = [...new Set(names)];
  return { ...sp, classes };
});

writeFileSync(outPath, JSON.stringify({ spell }));

const missing = spell.filter((sp) => sp.classes.length === 0).length;
console.log(`wrote ${outPath}`);
console.log(`files combined: ${files.length}`);
console.log(`total spells: ${spell.length}`);
console.log(`spells with no classes found in sources.json: ${missing}`);
