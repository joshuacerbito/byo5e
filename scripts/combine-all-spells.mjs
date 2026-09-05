// Recon utility: concatenate every 5etools-src/data/spells/spells-*.json
// "spell" array into one file. No dedupe/merge — each spell already carries
// its own "source" field. Not wired into build-srd-pack.mjs.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "5etools-src/data/spells";
const outPath = "5etools-src/data/spells/all-spells.json";

const files = readdirSync(dir)
  .filter((f) => /^spells-.*\.json$/.test(f))
  .sort();

const spell = files.flatMap((f) => {
  const data = JSON.parse(readFileSync(join(dir, f), "utf8"));
  return data.spell ?? [];
});

writeFileSync(outPath, JSON.stringify({ spell }));

console.log(`wrote ${outPath}`);
console.log(`files combined: ${files.length}`);
console.log(`total spells: ${spell.length}`);
