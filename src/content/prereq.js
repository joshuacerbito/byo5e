/* ------------------------------------------------------------------
   Prerequisites, structured rather than prose — so a picker can filter
   instead of warning. Same principle as the app's existing feat data:
   an illegal option is never rendered.

   5etools shape is an ARRAY of alternatives; satisfying any ONE entry
   satisfies the prerequisite. Within an entry every key must hold.
------------------------------------------------------------------- */
import { stripTags, splitUid } from "./entries.js";

const titleCase = (s) => String(s).replace(/\b[a-z]/g, (m) => m.toUpperCase());

export function normPrerequisite(arr, reg) {
  if (!arr || !arr.length) return null;
  const alternatives = arr.map((p) => {
    const out = {};
    if (p.ability) out.abilities = p.ability.map((a) => ({ ...a }));
    if (p.level != null) out.level = typeof p.level === "object" ? p.level.level : p.level;
    if (p.spellcasting) out.spellcasting = true;
    if (p.spellcasting2020) out.spellcasting = true;
    if (p.spellcastingFeature) out.spellcasting = true;
    if (p.pact) out.pact = p.pact;
    if (p.patron) out.patron = p.patron;
    if (p.spell) {
      /* "eldritch blast#c" — the #c suffix marks a cantrip. */
      out.spells = p.spell.map((s) => {
        const { name, flag } = splitUid(s);
        return { name: titleCase(name), cantrip: flag === "c" };
      });
    }
    if (p.feat) out.feats = p.feat.map((f) => splitUid(f).name);
    if (p.feature) out.features = p.feature.map((f) => stripTags(String(f).split("|")[0]));
    if (p.race) {
      out.races = p.race.map((r) => ({
        base: titleCase(String(r.name || "")),
        lineage: r.subrace ? titleCase(String(r.subrace)) : null,
      }));
    }
    if (p.proficiency) {
      out.proficiencies = p.proficiency.flatMap((x) =>
        Object.entries(x).map(([k, v]) => ({ kind: k, value: typeof v === "string" ? titleCase(v) : v })));
    }
    if (p.other) out.other = stripTags(p.other);
    if (p.otherSummary?.entry) out.other = stripTags(p.otherSummary.entry);
    if (p.background) out.backgrounds = p.background.map((b) => titleCase(String(b.name ?? b)));
    if (p.item) out.items = p.item.map((i) => (reg?.resolveItem(i)?.name) ?? splitUid(i).name);
    return out;
  });
  return { anyOf: alternatives };
}
