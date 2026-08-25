/* ------------------------------------------------------------------
   The 5etools reference grammar, resolved.

   Features are pointed at by pipe-joined strings. A blank source field
   means the Handbook — 5etools' own default, and the reason 2014 refs
   read "Rage|Barbarian||1" while 2024 ones spell out "|XPHB|". The
   2024 pack always writes XPHB explicitly, so the PHB default is safe
   for both.

   PORTED, DELIBERATELY DUPLICATED: the parsers and key functions match
   parseClassFeatureRef / parseSubclassFeatureRef / parseOptionalFeatureRef
   and the *Key helpers in scripts/lib/fivetools-srd.mjs, which the pack
   builder uses for its own dangling-reference audit. Same reason as
   entries.js: scripts/ is node-only and must not be imported from src/.

   NOTHING HERE THROWS. An unresolvable reference is recorded as a
   warning and returns null. The SRD genuinely lacks some of what its
   own records point at (38 refs in 5.1, 9 in 5.2), and pruning those
   silently would hide a fact about the content.
------------------------------------------------------------------- */

const DEF = (v) => (v && v.length ? v : "PHB");
const low = (...p) => p.map((v) => String(v ?? "").toLowerCase()).join("|");

/* name|className|classSource|level|source — the trailing source is the
   feature's OWN book, present only when it differs from the class's. */
export function parseClassFeatureRef(s) {
  const [name, className, classSource, level, source] = String(s).split("|");
  const cs = DEF(classSource);
  return { name, className, classSource: cs, level: String(level ?? ""), source: source || cs };
}

/* name|className|classSource|subclassShortName|subclassSource|level|source */
export function parseSubclassFeatureRef(s) {
  const [name, className, classSource, subclassShortName, subclassSource, level, source] = String(s).split("|");
  const cs = DEF(classSource);
  return {
    name, className, classSource: cs, subclassShortName,
    subclassSource: subclassSource || cs, level: String(level ?? ""), source: source || cs,
  };
}

/* name|source */
export function parseOptionalFeatureRef(s) {
  const [name, source] = String(s).split("|");
  return { name, source: DEF(source) };
}

export const parseFeatRef = parseOptionalFeatureRef;

/* Keys are built from `nameOriginal` where one exists: every ref string
   in the data uses the pre-SRD-rename name. */
export const classFeatureKey = (r) => low(r.nameOriginal ?? r.name, r.className, r.classSource, r.level, r.source);
export const subclassFeatureKey = (r) =>
  low(r.nameOriginal ?? r.name, r.className, r.classSource, r.subclassShortName, r.subclassSource, r.level, r.source);
export const optionalFeatureKey = (r) => low(r.nameOriginal ?? r.name, r.source);
export const featKey = optionalFeatureKey;

/* A classFeatures[] entry is either a bare string or
   { classFeature, gainSubclassFeature }. Same for subclassFeatures[]. */
export function unwrapClassFeatureEntry(e) {
  if (typeof e === "string") return { ref: e, gainSubclassFeature: false };
  return { ref: e.classFeature, gainSubclassFeature: !!e.gainSubclassFeature };
}
export function unwrapSubclassFeatureEntry(e) {
  if (typeof e === "string") return { ref: e, gainSubclassFeature: false };
  return { ref: e.subclassFeature, gainSubclassFeature: !!e.gainSubclassFeature };
}

export const REF_PARSERS = {
  classFeature: { parse: parseClassFeatureRef, key: classFeatureKey },
  subclassFeature: { parse: parseSubclassFeatureRef, key: subclassFeatureKey },
  optionalFeature: { parse: parseOptionalFeatureRef, key: optionalFeatureKey },
  feat: { parse: parseFeatRef, key: featKey },
};
