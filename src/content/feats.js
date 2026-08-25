/* ------------------------------------------------------------------
   FeatView.

   2024 files feats under a `category` code: "G" general, "O" origin,
   "FS" fighting style, "EB" epic boon. The 2014 SRD has exactly one
   feat (Grappler) and no categories at all.

   NOTE: 2024's "Ability Score Improvement" is a FEAT record with
   category "G". It is emitted here as a feat like any other, and it is
   deliberately NOT what ClassView.asiLevels reads — see classes.js.
------------------------------------------------------------------- */
import { flatten } from "./entries.js";
import { idMinter } from "./ids.js";
import { normPrerequisite } from "./prereq.js";
import { normSkills, normLanguages, normTools, normAbilityIncrease } from "./prof.js";
import { normAdditionalSpells } from "./additionalSpells.js";

const CATEGORY_LABEL = { G: "General", O: "Origin", FS: "Fighting Style", EB: "Epic Boon" };

export function buildFeats(reg) {
  const mint = idMinter();
  return (reg.content.feats || []).map((f) => {
    const flat = flatten(f.entries || []);
    return {
      kind: "feat",
      id: mint(f.name, f.source),
      name: f.name,
      source: f.source,
      page: f.page ?? null,
      category: f.category ?? null,
      categoryLabel: f.category ? (CATEGORY_LABEL[f.category] || f.category) : null,
      repeatable: !!f.repeatable,
      prerequisite: normPrerequisite(f.prerequisite, reg),
      ability: normAbilityIncrease(f.ability),
      skills: normSkills(f.skillProficiencies),
      languages: normLanguages(f.languageProficiencies),
      tools: normTools(f.toolProficiencies),
      additionalSpells: normAdditionalSpells(f.additionalSpells),
      text: flat.text,
      blocks: flat.blocks,
    };
  });
}
