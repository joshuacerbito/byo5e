/* Armour class, attack rolls, saves and spell DCs.

   Pure arithmetic over view models and ability scores. Nothing here reads a
   pack, a class id or a source; a caller hands in the armour, the weapon and
   the numbers, and gets a number back. */

import { mod } from "./abilities.js";

/* Every AC a character could be using, best first. The caller supplies the
   armour they are wearing (or null for unarmoured) plus any alternative
   formulas granted by features — Barbarian's Unarmoured Defense, Draconic
   Resilience and the like arrive as {base, add:[abilityKeys], condition}.

   Returned as candidates rather than one number because the sheet shows the
   working: "16 = chain mail" beside "13 = 10 + DEX + CON". */
export function acCandidates({ armor, shield, scores, formulas = [] }) {
  const dex = mod(scores.dex);
  const out = [];

  if (armor) {
    const capped = armor.maxDex == null ? dex : Math.min(dex, armor.maxDex);
    const parts = [armor.name];
    if (armor.maxDex !== 0) parts.push(`DEX ${capped >= 0 ? `+${capped}` : capped}`);
    out.push({
      id: armor.id,
      label: armor.name,
      value: armor.ac + capped,
      parts: parts.join(" + "),
    });
  } else {
    out.push({ id: "unarmored", label: "Unarmoured", value: 10 + dex, parts: `10 + DEX ${dex >= 0 ? `+${dex}` : dex}` });
  }

  for (const f of formulas) {
    // An alternative formula that requires no armour is not available in it.
    if (f.condition === "unarmored" && armor) continue;
    const adds = (f.add || []).map((k) => mod(scores[k]));
    out.push({
      id: f.id || f.label,
      label: f.label,
      value: f.base + adds.reduce((a, b) => a + b, 0),
      parts: [`${f.base}`, ...(f.add || []).map((k, i) =>
        `${k.toUpperCase()} ${adds[i] >= 0 ? `+${adds[i]}` : adds[i]}`)].join(" + "),
    });
  }

  const shieldBonus = shield ? (shield.ac ?? 2) : 0;
  return out
    .map((c) => (shieldBonus && c.allowsShield !== false
      ? { ...c, value: c.value + shieldBonus, parts: `${c.parts} + ${shieldBonus} shield` }
      : c))
    .sort((a, b) => b.value - a.value);
}

/* Whether a character is proficient with a weapon, given the proficiencies
   their class and features grant. Categories are "simple"/"martial"; specific
   entries name an individual weapon id. */
export function isWeaponProficient(weapon, prof) {
  if (!weapon || !prof) return false;
  if ((prof.categories || []).includes(weapon.category)) return true;
  return (prof.specific || []).includes(weapon.id);
}

/* Which ability a weapon attacks with: Strength, unless it is ranged, and
   either way Finesse lets the wielder choose the better of the two. */
export function weaponAbility(weapon, scores) {
  const finesse = (weapon.properties || []).some((p) => p.code === "F");
  if (finesse) return mod(scores.dex) >= mod(scores.str) ? "dex" : "str";
  return weapon.kind === "ranged" ? "dex" : "str";
}

export function attackBonus(weapon, { scores, pb, proficient }) {
  const key = weaponAbility(weapon, scores);
  return mod(scores[key]) + (proficient ? pb : 0);
}

export const damageBonus = (weapon, scores) => mod(scores[weaponAbility(weapon, scores)]);

/* Saving throws for all six abilities. */
export function savingThrows({ scores, saves = [], pb }) {
  return Object.keys(scores).map((key) => ({
    key,
    proficient: saves.includes(key),
    value: mod(scores[key]) + (saves.includes(key) ? pb : 0),
  }));
}

/* Skill modifiers. `skills` is the content layer's list of {id, name, ability};
   `proficient` and `expertise` are sets of skill ids. */
export function skillTable({ skills, scores, pb, proficient = new Set(), expertise = new Set() }) {
  return skills.map((s) => {
    const times = expertise.has(s.id) ? 2 : proficient.has(s.id) ? 1 : 0;
    return {
      id: s.id,
      name: s.name,
      ability: s.ability,
      proficient: times > 0,
      expertise: times === 2,
      value: mod(scores[s.ability]) + pb * times,
    };
  });
}

export const passiveScore = (skillRow) => 10 + skillRow.value;

/* Spellcasting. `dcBase` exists because a feature may state a different base
   than the standard 8 — the app carries whatever the book prints rather than
   correcting it. */
export function spellcastingStats({ ability, scores, pb, dcBase = 8 }) {
  const abilityMod = mod(scores[ability]);
  return {
    ability,
    abilityMod,
    saveDC: dcBase + pb + abilityMod,
    attack: pb + abilityMod,
  };
}

/* Hit points: full hit die at 1st level, average rounded up thereafter, plus
   Constitution every level and anything a feature adds per level. */
export function hitPoints({ hitDie, level, conScore, perLevelBonus = 0 }) {
  if (!hitDie) return null;
  const con = mod(conScore);
  const average = Math.floor(hitDie / 2) + 1;
  return hitDie + con + perLevelBonus
    + (level - 1) * (average + con + perLevelBonus);
}
