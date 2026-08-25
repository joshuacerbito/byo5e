/* ------------------------------------------------------------------
   The small reference collections: skills, languages, conditions.
   Flat, no refs to resolve, but they still go through the mapper so
   nothing above it ever sees an entry tree.
------------------------------------------------------------------- */
import { flatten } from "./entries.js";
import { idMinter } from "./ids.js";

const simple = (rows, kind, extra = () => ({})) => {
  const mint = idMinter();
  return (rows || []).map((r) => {
    const flat = flatten(r.entries || []);
    return {
      kind,
      id: mint(r.name, r.source),
      name: r.name,
      source: r.source,
      page: r.page ?? null,
      text: flat.text,
      blocks: flat.blocks,
      ...extra(r),
    };
  });
};

export const buildSkills = (reg) => simple(reg.content.skills, "skill", (r) => ({ ability: r.ability ?? null }));
export const buildConditions = (reg) => simple(reg.content.conditions, "condition");
export const buildLanguages = (reg) => simple(reg.content.languages, "language", (r) => ({
  type: r.type ?? null,
  script: r.script ?? null,
}));
