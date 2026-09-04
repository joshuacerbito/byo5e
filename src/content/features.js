/* ------------------------------------------------------------------
   FeatureView — the one shape every "thing your character gains" uses:
   class features, subclass features, ancestry traits, background
   features.

     { id, level, name, text, blocks, source, page,
       optional,        // came from a later book bolted onto the class
       choices,         // [{ kind, count, options:[OptionRef] }]
       references }     // [{ kind, name, source, resolved }] — a pointer
                        // the feature's own text makes to another feature

   `choices` exists because several features ARE a list to pick from —
   Fighting Style, Metamagic, Eldritch Invocations, Pact Boon. The list
   lives in optionalFeatures, pointed at by refOptionalfeature nodes
   inside an `options` block. Where a ref does not resolve (Tasha's
   options the SRD never printed) the option is still emitted, flagged
   `resolved: false`, and a warning is recorded — dropping it would make
   the SRD's gaps invisible.
------------------------------------------------------------------- */
import { flatten } from "./entries.js";
import { REF_PARSERS } from "./refs.js";
import { slugify } from "./ids.js";

const REF_KINDS = Object.keys(REF_PARSERS);

function collectChoices(blocks, reg, from, optionIdOf) {
  const choices = [];
  /* Prose from the sub-features walked below, kept because it can carry
     rules the wrapper's own text never states — the sentence saying a
     pick list GROWS with level lives in a sibling of the one holding the
     list (see growthIncrements in classes.js). */
  const refText = [];
  /* A feature can hold its pick list at one remove: 5etools files a
     subclass as a short wrapper whose entries are refClassFeature /
     refSubclassFeature nodes pointing at the real sub-features, and the
     `options` block lives inside one of THOSE. Battle Master is the
     clearest case — the subclass record lists only "Battle Master", which
     refs Combat Superiority, Student of War and Maneuver Options, and the
     maneuver list is inside the last of them. Walking only the wrapper's
     own blocks found no choice at all, so the subclass rendered its prose
     with no picker. Follow those two ref kinds into the record they name
     and keep walking. `seen` is per call and keyed on the raw ref string:
     the same sub-feature can be referenced twice, and a cycle would
     otherwise not terminate. */
  const seen = new Set();
  const walk = (bs) => {
    for (const b of bs || []) {
      if (b.type === "ref" && (b.refKind === "classFeature" || b.refKind === "subclassFeature")) {
        if (!seen.has(b.ref)) {
          seen.add(b.ref);
          const rec = reg.resolveRef(b.refKind, b.ref, from);
          if (rec) {
            const f = flatten(rec.entries || []);
            refText.push(f.text);
            walk(f.blocks);
          }
        }
        continue;
      }
      if (b.type === "options") {
        const refs = [];
        const gather = (inner) => {
          for (const x of inner || []) {
            if (x.type === "ref") refs.push(x);
            if (x.blocks) gather(x.blocks);
            if (x.items) x.items.forEach((it) => gather(it.blocks));
          }
        };
        gather(b.blocks);
        if (refs.length) {
          const kind = refs[0].refKind;
          choices.push({
            kind,
            count: b.count ?? 1,
            options: refs.map((r) => {
              const rec = reg.resolveRef(r.refKind, r.ref, from);
              const parsed = REF_PARSERS[r.refKind].parse(r.ref);
              return {
                id: rec ? optionIdOf(r.refKind, rec) : null,
                name: rec ? rec.name : parsed.name,
                source: rec ? rec.source : parsed.source,
                resolved: !!rec,
                /* What picking this one actually grants — e.g. Divine
                   Order's Protector vs Thaumaturge are each a full
                   classFeature record with their own entries, same as
                   any other feature; flatten it the same way toFeature
                   does rather than leaving the pick unexplained. */
                text: rec ? flatten(rec.entries || []).text : null,
                blocks: rec ? flatten(rec.entries || []).blocks : [],
              };
            }),
          });
        }
        walk(b.blocks);
        continue;
      }
      if (b.blocks) walk(b.blocks);
      if (b.items) b.items.forEach((it) => walk(it.blocks));
    }
  };
  walk(blocks);
  return { choices, refText: refText.join(" ") };
}

/* Rewrite every `{ type:"ref", refKind, ref }` node found anywhere in
   the block tree (blocks, block.blocks, block.items[].blocks — nested
   to any depth, e.g. inside a section/options/list that itself sits
   inside another section/options/list) into a resolved version. `ref`
   itself is left untouched (raw pipe string, kept for traceability);
   name/source/resolved are added alongside it, mirroring how
   collectChoices resolves the same refs for `choices[].options[]`. */
function resolveRefBlocks(blocks, reg, from, seen = new Set()) {
  const walk = (bs) => {
    for (const b of bs || []) {
      if (b.type === "ref") {
        const rec = reg.resolveRef(b.refKind, b.ref, from);
        const parsed = REF_PARSERS[b.refKind].parse(b.ref);
        b.name = rec ? rec.name : parsed.name;
        b.source = rec ? rec.source : parsed.source;
        b.resolved = !!rec;
        /* A ref outside an options block is the feature's own prose
           continuing somewhere else — 5etools files Battle Master as a
           wrapper that refs Combat Superiority, Student of War and
           Maneuver Options. Rendering the pointer ("See Combat
           Superiority.") shows the reader nothing, so carry the target's
           own blocks along and let FeatureBlocks print them in place.
           `seen` is keyed on the raw ref string so a feature that points
           back at an ancestor terminates instead of recursing forever. */
        if (rec && !seen.has(b.ref)) {
          seen.add(b.ref);
          const inner = flatten(rec.entries || []).blocks;
          resolveRefBlocks(inner, reg, from, seen);
          b.blocks = inner;
        }
        continue;
      }
      if (b.blocks) walk(b.blocks);
      if (b.items) b.items.forEach((it) => walk(it.blocks));
    }
  };
  walk(blocks);
}

/* Refs that are NOT inside an options block are cross-pointers ("as
   described in the Rage feature"), not picks. */
function collectReferences(blocks, refs, reg, from, choices) {
  const chosen = new Set(choices.flatMap((c) => c.options.map((o) => `${c.kind}|${o.name}`)));
  const out = [];
  const seen = new Set();
  for (const r of refs) {
    if (!REF_KINDS.includes(r.kind)) continue;
    const parsed = REF_PARSERS[r.kind].parse(r.ref);
    if (chosen.has(`${r.kind}|${parsed.name}`)) continue;
    const key = `${r.kind}|${r.ref}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const rec = reg.resolveRef(r.kind, r.ref, from);
    out.push({ kind: r.kind, name: rec ? rec.name : parsed.name, source: rec ? rec.source : parsed.source, resolved: !!rec });
  }
  return out;
}

/* `rec` is a raw classFeature / subclassFeature / trait record.
   `opts.idPrefix` namespaces the id; `opts.level` overrides the record's
   own (ancestry traits have no level of their own). */
export function toFeature(rec, reg, opts = {}) {
  const { text, blocks, refs } = flatten(rec.entries || []);
  const from = opts.from || `feature ${rec.name}`;
  const optionIdOf = opts.optionIdOf || ((kind, r) => slugify(r.name));
  const { choices, refText } = collectChoices(blocks, reg, from, optionIdOf);
  resolveRefBlocks(blocks, reg, from);
  return {
    id: `${opts.idPrefix ? `${opts.idPrefix}-` : ""}${opts.level ?? rec.level ?? 0}-${slugify(rec.name)}`,
    level: opts.level ?? rec.level ?? 1,
    name: rec.name,
    text,
    refText,
    blocks,
    source: rec.source ?? null,
    page: rec.page ?? null,
    optional: !!opts.optional,
    gainsSubclassFeature: !!opts.gainsSubclassFeature,
    choices,
    references: collectReferences(blocks, refs, reg, from, choices),
  };
}

/* An ancestry trait / background feature is an inline entry node rather
   than its own record, so it has a name + entries and nothing else. */
export function entryToFeature(node, reg, opts = {}) {
  return toFeature(
    { name: node.name || opts.name || "Trait", entries: node.entries || (node.entry ? [node.entry] : []), source: opts.source, page: opts.page },
    reg,
    { level: 1, ...opts },
  );
}
