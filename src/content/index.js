/* ------------------------------------------------------------------
   src/content — the content mapper layer.

   This is the ONLY part of the app that knows 5etools shape exists.
   Above it, everything consumes plain view models: named fields, no
   {@tag} markup, no pipe-delimited reference strings, no positional
   tuples, no entry trees except as pre-structured `blocks`.

   `buildContent(pack)` is PURE: hand it a parsed pack object and it
   hands back the view models. It does no importing of its own, so the
   same code path serves the browser (load.js) and node
   (scripts/check-content.mjs).

   Warnings, not throws. A reference the pack cannot satisfy lands in
   `content.warnings` and the record around it is still emitted.
------------------------------------------------------------------- */
import { buildRegistry } from "./registry.js";
import { buildOptions, optionIdIndex } from "./options.js";
import { slugify } from "./ids.js";
import { buildClasses } from "./classes.js";
import { buildAncestries } from "./ancestry.js";
import { buildBackgrounds } from "./backgrounds.js";
import { buildSpells } from "./spells.js";
import { buildItems } from "./items.js";
import { buildFeats } from "./feats.js";
import { buildSkills, buildConditions, buildLanguages } from "./rules.js";

export function buildContent(pack) {
  const reg = buildRegistry(pack);

  /* Options first: class features reference them by name, and the
     feature builder needs their minted ids. */
  const options = buildOptions(reg);
  const lookupOptionId = optionIdIndex(options);
  /* Divine Order, Rune Knight's rune choices, and the like point their
     "options" block at refClassFeature/refClassFeatureVariant nodes
     rather than optionalFeatures — those never touch lookupOptionId, and
     falling through to `null` gave every option in the group the same
     id, so picking one silently "picked" all of them. slugify(name+source)
     is unique across any such group; optionalFeature keeps the minted id
     since several features share a name across sources (e.g. Metamagic
     options), where the source-qualified slug alone isn't guaranteed
     stable against the id that feats.js/options.js already minted. */
  const optionIdOf = (kind, rec) =>
    kind === "optionalFeature"
      ? lookupOptionId(rec.nameOriginal ?? rec.name, rec.source)
      : slugify(`${rec.name}-${rec.source}`);

  const classes = buildClasses(reg, optionIdOf);
  const ancestries = buildAncestries(reg);
  const backgrounds = buildBackgrounds(reg);
  const spells = buildSpells(reg);
  const { weapons, armor, gear } = buildItems(reg);
  const feats = buildFeats(reg);
  const skills = buildSkills(reg);
  const conditions = buildConditions(reg);
  const languages = buildLanguages(reg);

  const subclasses = classes.flatMap((c) => c.subclasses);

  const kinds = {
    classes, subclasses, ancestries, backgrounds, spells,
    weapons, armor, gear, feats, options, skills, conditions, languages,
  };

  const indexes = {};
  for (const [k, rows] of Object.entries(kinds)) {
    indexes[k] = new Map(rows.map((r) => [r.id, r]));
  }

  return {
    edition: pack.rulesEdition,
    pack: reg.meta,
    warnings: reg.warnings,
    ...kinds,
    /* byId("spells", "fireball") — kind is the collection name. */
    byId: (kind, id) => indexes[kind]?.get(id) ?? null,
    /* Every collection name, for a census or a generic walker. */
    kinds: Object.keys(kinds),
  };
}

export { buildRegistry };
