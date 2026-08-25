/* Prerequisite checking against a character in progress.

   `src/content/prereq.js` turns 5etools' prerequisite blocks into
   { anyOf: [{ abilities?, level?, spellcasting?, pact?, spells?, races?,
   proficiencies?, ... }] } — satisfying any ONE alternative satisfies the
   whole thing. This is the other half: given that shape and what the
   character currently has, is it satisfied?

   Only the kinds SRD content actually uses are checked (verified against
   both packs: level, ability minimums, spellcasting, a warlock pact
   name, a known cantrip, race, and armor/weapon proficiency). A kind
   this app doesn't evaluate is treated as satisfied rather than hidden —
   the alternative is refusing to ever offer content the mapper cannot
   fully describe, which is worse than the rare case where this app is
   slightly too permissive. */
export function meetsPrerequisite(prereq, ctx) {
  if (!prereq) return true;
  return prereq.anyOf.some((alt) => meetsAlternative(alt, ctx));
}

function meetsAlternative(alt, ctx) {
  if (alt.level != null && ctx.level < alt.level) return false;
  if (alt.abilities && !alt.abilities.some((a) =>
    Object.entries(a).every(([k, min]) => (ctx.abilityScore?.(k) ?? 0) >= min))) return false;
  if (alt.spellcasting && !ctx.hasSpellcasting) return false;
  if (alt.pact && ctx.pact !== alt.pact) return false;
  if (alt.spells && !alt.spells.every((s) => ctx.knownSpells?.has(s.name.toLowerCase()))) return false;
  if (alt.races && !alt.races.some((r) => r.base === ctx.ancestryBase
    && (!r.lineage || r.lineage === ctx.ancestryLineage))) return false;
  if (alt.proficiencies && !alt.proficiencies.every((p) => ctx.proficient?.(p.kind, p.value))) return false;
  return true;
}
