/* ------------------------------------------------------------------
   Helpers for scripts/build-srd-pack.mjs — the SRD content-pack
   generator.

   Deliberately separate from ./fivetools.mjs: that module exists to
   flatten 5etools entry trees into the prose strings src/data/*.js
   ships. The pack generator does the opposite — it keeps records in
   5etools shape, tags and all, because the app's mapper layer consumes
   that shape and strips tags at runtime. Nothing here formats text.

   5etools-src is gitignored (~550MB checkout). The packs it produces
   are committed.
------------------------------------------------------------------- */
import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(process.cwd());
export const DATA = path.join(ROOT, "5etools-src", "data");

export const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(DATA, rel), "utf8"));

export const clone = (v) => JSON.parse(JSON.stringify(v));

/* ---- editions ---------------------------------------------------
   The whole generator is parameterised by these two records. `flag`
   is the SRD marker on a record; `book` is the source abbreviation
   that record must carry to belong to this edition.
------------------------------------------------------------------- */
export const EDITIONS = [
  {
    id: "srd-5.1", name: "SRD 5.1", rulesEdition: "2014",
    flag: "srd", book: "PHB", spellFile: "spells/spells-phb.json",
    /* items-base.json's itemProperty/itemType/itemMastery records carry
       no SRD flag at all, so `source` is the only filter available. The
       equipment chapter is split across the Handbook and the DMG in
       5etools' own data, hence two books rather than one. */
    itemBooks: ["PHB", "DMG"],
  },
  {
    id: "srd-5.2", name: "SRD 5.2", rulesEdition: "2024",
    flag: "srd52", book: "XPHB", spellFile: "spells/spells-xphb.json",
    itemBooks: ["XPHB", "XDMG"],
  },
];

/* ---- the SRD selection rule -------------------------------------

   A record is in the pack when its edition flag is present — but the
   flag's *value* matters as well as its presence. `srd: true` means
   "published in the SRD under this name"; `srd: "Arcane Hand"` means
   the SRD publishes Bigby's Hand under a name that carries no product
   identity. Emitting the original name in that case would republish
   the part of the record that is NOT open content, so the rename is a
   legal requirement, not a nicety. The original is kept as
   `nameOriginal` so cross-references (which all use it) still resolve.
------------------------------------------------------------------- */
export const isSrd = (rec, flag) => rec[flag] != null;

export function applySrdName(rec, flag) {
  const v = rec[flag];
  if (typeof v !== "string") return rec;
  return { ...rec, name: v, nameOriginal: rec.name };
}

/* ---- bookkeeping fields -----------------------------------------
   Pure 5etools plumbing: image/audio presence flags, cross-book
   reprint pointers, the basic-rules markers we deliberately don't
   filter on, and the Foundry VTT export hints. None of it is rules
   content and all of it is bulk. Stripped at every depth, since
   `foundry*` keys turn up inside nested entries too.
------------------------------------------------------------------- */
const DROP_KEYS = new Set([
  "hasFluff", "hasFluffImages", "soundClip", "otherSources", "referenceSources",
  "reprintedAs", "basicRules", "basicRules2024", "additionalSources", "_versions",
  "_copy", "_mod", "_preserve",
]);

export function stripBookkeeping(v) {
  if (Array.isArray(v)) return v.map(stripBookkeeping);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v)) {
      if (DROP_KEYS.has(k)) continue;
      if (k.startsWith("foundry")) continue;
      out[k] = stripBookkeeping(v[k]);
    }
    return out;
  }
  return v;
}

/* ---- _copy / _mod resolution -------------------------------------

   No SRD record is itself a `_copy`, but a copy's `_preserve` block
   can carry an `srd` flag forward onto the copied record — so the set
   has to be resolved before it is filtered, or the filter is reading
   half-built records. `_meta.internalCopies` names the arrays whose
   copies resolve against the same file.
------------------------------------------------------------------- */

/* Fields a copy does NOT inherit unless _preserve asks for them. */
const COPY_VOLATILE = ["page", "otherSources", "srd", "srd52", "basicRules",
  "basicRules2024", "reprintedAs", "referenceSources", "hasFluff",
  "hasFluffImages", "additionalSources", "_versions"];

/* A record's identity, for matching a _copy pointer to its target.
   Class-tied records need the full tuple: three books all define a
   "Champion" subclass feature named the same thing.

   itemType records have no `name` of their own worth matching on —
   they are identified by `abbreviation`, which is what their _copy
   pointers use. */
const ID_FIELDS = ["name", "source", "abbreviation", "className", "classSource",
  "subclassShortName", "subclassSource", "level"];

const idOf = (rec) => ID_FIELDS.map((f) => String(rec[f] ?? "").toLowerCase()).join("|");

function replaceTxt(node, find, wth) {
  if (typeof node === "string") return node.split(find).join(wth);
  if (Array.isArray(node)) return node.map((n) => replaceTxt(n, find, wth));
  if (node && typeof node === "object") {
    const out = {};
    for (const k of Object.keys(node)) out[k] = replaceTxt(node[k], find, wth);
    return out;
  }
  return node;
}

const nameOf = (it) => (typeof it === "string" ? it : it && it.name);

function applyOneMod(rec, key, mod, warn) {
  if (mod === "*" || typeof mod === "string") return;
  const arr = key === "*" ? null : rec[key];
  switch (mod.mode) {
    case "replaceArr": {
      if (!Array.isArray(arr)) return warn(`replaceArr on non-array ${key}`);
      const target = nameOf(mod.replace);
      const i = arr.findIndex((it) => nameOf(it) === target);
      if (i < 0) return warn(`replaceArr target "${target}" not found in ${key}`);
      arr.splice(i, 1, ...[].concat(mod.items));
      return;
    }
    case "appendArr":
      if (!Array.isArray(arr)) return warn(`appendArr on non-array ${key}`);
      arr.push(...[].concat(mod.items));
      return;
    case "prependArr":
      if (!Array.isArray(arr)) return warn(`prependArr on non-array ${key}`);
      arr.unshift(...[].concat(mod.items));
      return;
    case "insertArr":
      if (!Array.isArray(arr)) return warn(`insertArr on non-array ${key}`);
      arr.splice(mod.index, 0, ...[].concat(mod.items));
      return;
    case "removeArr": {
      if (!Array.isArray(arr)) return warn(`removeArr on non-array ${key}`);
      const names = new Set([].concat(mod.names || []));
      rec[key] = arr.filter((it) => !names.has(nameOf(it)));
      return;
    }
    case "replaceTxt": {
      /* Always keyed "*" in the data — a blanket string substitution
         over the whole copied record. */
      const next = replaceTxt(rec, mod.replace, mod.with);
      for (const k of Object.keys(rec)) delete rec[k];
      Object.assign(rec, next);
      return;
    }
    default:
      warn(`unhandled _mod mode "${mod.mode}"`);
  }
}

/* Resolve every `_copy` in `arrays` of one parsed file, in place.
   Copies can chain, so resolution is recursive with a memo. Targets
   that live in another file (a few non-SRD races copy Monsters of the
   Multiverse entries) are left unresolved and reported. */
export function resolveCopies(file, arrays, warn = () => {}) {
  const index = new Map();
  /* itemType copy pointers identify their target by abbreviation +
     source and omit the name, so records carrying an abbreviation get
     a second, shorter alias in the index. */
  const abbrOf = (r) => (r.abbreviation ? `${String(r.abbreviation).toLowerCase()}@${String(r.source ?? "").toLowerCase()}` : null);
  for (const key of arrays) {
    for (const rec of file[key] || []) {
      index.set(idOf(rec), rec);
      const a = abbrOf(rec);
      if (a && !index.has(a)) index.set(a, rec);
    }
  }

  const done = new WeakSet();
  const resolve = (rec, seen = new Set()) => {
    if (!rec._copy || done.has(rec)) return rec;
    const key = idOf(rec._copy);
    if (seen.has(key)) { warn(`circular _copy at ${idOf(rec)}`); return rec; }
    const target = index.get(key) || index.get(abbrOf(rec._copy));
    if (!target) { warn(`_copy target not in file: ${key} (from ${idOf(rec)})`); return rec; }
    resolve(target, new Set([...seen, key]));

    const out = clone(target);
    const preserve = rec._copy._preserve || {};
    for (const k of COPY_VOLATILE) if (!preserve[k]) delete out[k];
    for (const [k, mod] of Object.entries(rec._copy._mod || {})) {
      for (const m of [].concat(mod)) applyOneMod(out, k, m, warn);
    }
    /* The copying record's own explicit fields win over the target's. */
    for (const [k, v] of Object.entries(rec)) if (k !== "_copy") out[k] = v;

    for (const k of Object.keys(rec)) delete rec[k];
    Object.assign(rec, out);
    done.add(rec);
    return rec;
  };

  for (const key of arrays) for (const rec of file[key] || []) resolve(rec);
  return file;
}

/* ---- reference strings ------------------------------------------
   5etools points at features with pipe-joined strings, and the pack
   keeps them verbatim so the app can resolve them the same way. These
   parsers exist only for the build's own dangling-reference audit.

   A blank source field means the Handbook — 5etools' own default, and
   the reason 2014 refs read "Rage|Barbarian||1" while 2024 ones spell
   out "|XPHB|".
------------------------------------------------------------------- */
const DEF = (v) => (v && v.length ? v : "PHB");

export function parseClassFeatureRef(s) {
  /* name|className|classSource|level|source — the trailing source is
     the feature's OWN book, present only when it differs from the
     class's (a Tasha's feature bolted onto a Handbook class). It
     defaults to the class source, and it belongs in the key: it is
     what distinguishes an optional-rules feature from a core one of
     the same name. */
  const [name, className, classSource, level, source] = String(s).split("|");
  const cs = DEF(classSource);
  return { name, className, classSource: cs, level: String(level ?? ""), source: source || cs };
}

export function parseSubclassFeatureRef(s) {
  /* name|className|classSource|subclassShortName|subclassSource|level|source */
  const [name, className, classSource, subclassShortName, subclassSource, level, source] = String(s).split("|");
  const cs = DEF(classSource);
  return {
    name, className, classSource: cs, subclassShortName,
    subclassSource: subclassSource || cs, level: String(level ?? ""), source: source || cs,
  };
}

export function parseOptionalFeatureRef(s) {
  const [name, source] = String(s).split("|");
  return { name, source: DEF(source) };
}

const low = (...p) => p.map((v) => String(v ?? "").toLowerCase()).join("|");
export const classFeatureKey = (r) => low(r.nameOriginal ?? r.name, r.className, r.classSource, r.level, r.source);
export const subclassFeatureKey = (r) =>
  low(r.nameOriginal ?? r.name, r.className, r.classSource, r.subclassShortName, r.subclassSource, r.level, r.source);
export const optionalFeatureKey = (r) => low(r.nameOriginal ?? r.name, r.source);

/* Walk every entry tree looking for the three ref node types. */
export function collectRefNodes(node, out = []) {
  if (Array.isArray(node)) { node.forEach((n) => collectRefNodes(n, out)); return out; }
  if (node && typeof node === "object") {
    if (node.type === "refClassFeature" && node.classFeature) out.push(["classFeature", node.classFeature]);
    if (node.type === "refSubclassFeature" && node.subclassFeature) out.push(["subclassFeature", node.subclassFeature]);
    if (node.type === "refOptionalfeature" && node.optionalfeature) out.push(["optionalfeature", node.optionalfeature]);
    for (const k of Object.keys(node)) collectRefNodes(node[k], out);
  }
  return out;
}

/* ---- determinism -------------------------------------------------
   Same input, byte-identical output: every collection is sorted by a
   stable composite key and nothing stamps a build time into the file.
------------------------------------------------------------------- */
export const sortBy = (arr, keyFn) =>
  [...arr].sort((a, b) => {
    const ka = keyFn(a), kb = keyFn(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });

export const recordKey = (r) =>
  ID_FIELDS.map((f) => String(f === "level" ? String(r[f] ?? "").padStart(3, "0") : r[f] ?? "")).join("|");

export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
