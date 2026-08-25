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
  const walk = (bs) => {
    for (const b of bs || []) {
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
  return choices;
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
  const choices = collectChoices(blocks, reg, from, optionIdOf);
  return {
    id: `${opts.idPrefix ? `${opts.idPrefix}-` : ""}${opts.level ?? rec.level ?? 0}-${slugify(rec.name)}`,
    level: opts.level ?? rec.level ?? 1,
    name: rec.name,
    text,
    blocks,
    source: rec.source ?? null,
    page: rec.page ?? null,
    optional: !!opts.optional,
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
