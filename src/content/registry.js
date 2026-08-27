/* ------------------------------------------------------------------
   A parsed pack -> an indexed, resolvable registry.

   PURE. It takes the parsed pack OBJECT, never a path and never an
   import specifier, so the same code drives the browser (load.js hands
   it a dynamic import) and node (scripts/check-content.mjs hands it
   fs.readFileSync + JSON.parse). Nothing in here touches the network,
   the filesystem, or a bundler.

   Resolution never throws. A ref that points at nothing returns null
   and lands in `warnings`.
------------------------------------------------------------------- */
import {
  REF_PARSERS, classFeatureKey, subclassFeatureKey, optionalFeatureKey, featKey,
} from "./refs.js";
import { splitUid } from "./entries.js";

const byKey = (rows, keyFn) => {
  const m = new Map();
  for (const r of rows || []) m.set(keyFn(r), r);
  return m;
};

/* Item/type/property lookups key on lowercased name+source, with a
   name-only alias so a ref that omits the source still lands. */
function byNameSource(rows) {
  const m = new Map();
  for (const r of rows || []) {
    const n = String(r.nameOriginal ?? r.name ?? "").toLowerCase();
    m.set(`${n}|${String(r.source ?? "").toLowerCase()}`, r);
    if (!m.has(n)) m.set(n, r);
  }
  return m;
}

/* itemProperty / itemType / itemMastery are keyed by abbreviation, and
   2024 codes carry a source suffix ("V|XPHB") where 2014 ones don't. */
function byAbbrev(rows) {
  const m = new Map();
  for (const r of rows || []) {
    const a = String(r.abbreviation ?? r.name ?? "").toLowerCase();
    m.set(`${a}|${String(r.source ?? "").toLowerCase()}`, r);
    if (!m.has(a)) m.set(a, r);
  }
  return m;
}

export function buildRegistry(pack) {
  if (!pack || !pack.content) throw new Error("buildRegistry: not a content pack");
  const c = pack.content;

  const warnings = [];
  const seen = new Set();
  const warn = (kind, ref, from) => {
    const id = `${kind}|${ref}|${from}`;
    if (seen.has(id)) return;
    seen.add(id);
    warnings.push({ kind, ref, from });
  };

  const index = {
    classFeature: byKey(c.classFeatures, classFeatureKey),
    subclassFeature: byKey(c.subclassFeatures, subclassFeatureKey),
    optionalFeature: byKey(c.optionalFeatures, optionalFeatureKey),
    feat: byKey(c.feats, featKey),
    item: byNameSource(c.items),
    spell: byNameSource(c.spells),
    skill: byNameSource(c.skills),
    condition: byNameSource(c.conditions),
    language: byNameSource(c.languages),
    itemProperty: byAbbrev(c.itemProperties),
    itemType: byAbbrev(c.itemTypes),
    itemMastery: byNameSource(c.itemMasteries),
  };

  /* Resolve one pipe-string reference of a given kind. `from` is a
     human-readable breadcrumb that goes into the warning. */
  function resolveRef(kind, ref, from) {
    const def = REF_PARSERS[kind];
    if (!def || !ref) { warn(kind || "unknown", String(ref), from); return null; }
    const parsed = def.parse(ref);
    const hit = index[kind]?.get(def.key(parsed));
    if (!hit) { warn(kind, ref, from); return null; }
    return hit;
  }

  /* Item uids ("longsword|phb", "Chain Shirt|XPHB"). */
  function resolveItem(uid, from) {
    const { name, source } = splitUid(uid);
    const n = name.toLowerCase();
    const hit = index.item.get(`${n}|${String(source ?? "").toLowerCase()}`) || index.item.get(n);
    if (!hit && from) warn("item", String(uid), from);
    return hit || null;
  }

  /* Spell uids ("fireball|xphb"), same shape as item uids — used by a
     magic item's attachedSpells (a wand naming what it casts). */
  function resolveSpell(uid, from) {
    const { name, source } = splitUid(uid);
    const n = name.toLowerCase();
    const hit = index.spell.get(`${n}|${String(source ?? "").toLowerCase()}`) || index.spell.get(n);
    if (!hit && from) warn("spell", String(uid), from);
    return hit || null;
  }

  /* Property/type/mastery codes, with or without a "|SOURCE" suffix. */
  function resolveCode(kind, code, from) {
    if (code == null) return null;
    const raw = typeof code === "object" ? code.uid : code;
    const [abbr, src] = String(raw).split("|");
    const a = abbr.toLowerCase();
    const hit = index[kind]?.get(`${a}|${String(src ?? "").toLowerCase()}`) || index[kind]?.get(a);
    if (!hit && from) warn(kind, String(raw), from);
    return hit || null;
  }

  return {
    packFormat: pack.packFormat,
    edition: pack.rulesEdition,
    meta: {
      id: pack.id, name: pack.name, abbrev: pack.abbrev,
      rulesEdition: pack.rulesEdition, sourceBooks: pack.sourceBooks || [],
      license: pack.license || null, counts: pack.counts || {},
    },
    content: c,
    index,
    warnings,
    warn,
    resolveRef,
    resolveItem,
    resolveSpell,
    resolveCode,
  };
}
