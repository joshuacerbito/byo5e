/* ------------------------------------------------------------------
   OptionView — optionalFeatures: eldritch invocations, fighting styles,
   metamagic, pact boons, and the 2024 equivalents.

   `featureType` codes are 5etools' own ("EI", "FS:F", "MM", "PB"). They
   are kept as `types` (raw codes, for matching a class's
   optionalfeatureProgression) alongside `typeLabels` for display.

   NOTE for 2024: the Fighting Styles moved OUT of optionalFeatures and
   INTO feats (category "FS"). The mapper does not paper over that —
   `content.options` is genuinely smaller in 5.2 and the fighting styles
   turn up in `content.feats` with `category: "FS"`. A UI that wants
   "pick a fighting style" must look in both places by edition.
------------------------------------------------------------------- */
import { flatten } from "./entries.js";
import { idMinter, slugify } from "./ids.js";
import { normSkills, normLanguages, normTools } from "./prof.js";
import { normPrerequisite } from "./prereq.js";

const TYPE_LABELS = {
  EI: "Eldritch Invocation",
  MM: "Metamagic",
  PB: "Pact Boon",
  "FS:F": "Fighting Style (Fighter)",
  "FS:R": "Fighting Style (Ranger)",
  "FS:P": "Fighting Style (Paladin)",
  "FS:B": "Fighting Style (Bard)",
  MV: "Maneuver",
  "MV:B": "Maneuver (Battle Master)",
  AI: "Arcane Shot",
  RN: "Rune",
  AS: "Arcane Shot",
};

export function buildOptions(reg) {
  const mint = idMinter();
  return (reg.content.optionalFeatures || []).map((o) => {
    const { text, blocks } = flatten(o.entries || []);
    const types = (o.featureType || []).slice();
    return {
      kind: "option",
      id: mint(o.name, o.source),
      name: o.name,
      nameOriginal: o.nameOriginal ?? null,
      source: o.source,
      page: o.page ?? null,
      types,
      typeLabels: types.map((t) => TYPE_LABELS[t] || t),
      prerequisite: normPrerequisite(o.prerequisite, reg),
      skills: normSkills(o.skillProficiencies),
      languages: normLanguages(o.languageProficiencies),
      tools: normTools(o.toolProficiencies),
      text,
      blocks,
    };
  });
}

/* Class features point at options by name; the option id is minted
   above, so callers get a resolver rather than re-deriving the slug. */
export function optionIdIndex(options) {
  const m = new Map();
  for (const o of options) {
    m.set(`${String(o.nameOriginal ?? o.name).toLowerCase()}|${String(o.source).toLowerCase()}`, o.id);
    m.set(String(o.nameOriginal ?? o.name).toLowerCase(), o.id);
  }
  return (name, source) =>
    m.get(`${String(name).toLowerCase()}|${String(source).toLowerCase()}`)
    || m.get(String(name).toLowerCase())
    || slugify(name);
}
