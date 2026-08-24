import { BASE_RACES } from '../data/baseRaces.js';
import { ABILITIES } from '../data/progression.js';

export const mod = (n) => Math.floor((n - 10) / 2);
export const fmt = (n) => (n >= 0 ? `+${n}` : `${n}`);

/* Weapon attack math (2014 rules) — proficiency bonus only applies if
   proficient, ability mod is Strength unless the weapon is finesse or
   ranged (which use the higher of Str/Dex, or Dex outright). */
export const attackBonus = (pb, abilityMod, proficient) => pb * (proficient ? 1 : 0) + abilityMod;

export function isWeaponProficient(weapon, weaponProf) {
  if (!weapon || !weaponProf) return false;
  if (weaponProf.categories?.includes(weapon.category)) return true;
  return !!weaponProf.specific?.includes(weapon.id);
}

/* Static 2014 PHB basic actions (PHB p.192) — deliberately not the 2024
   action list (Grapple/Influence/Study/Utilize are 2024-only verbs). */
export const BASIC_ACTIONS = ["Attack", "Cast a Spell", "Dash", "Disengage", "Dodge",
  "Help", "Hide", "Ready", "Search", "Use an Object"];

/* Dedupe a flat weapon-instance array (carriedWeapons has one entry per
   copy, e.g. two Handaxe entries for a qty-2 pick) into { weapon, qty }
   rows, first-seen order. */
export function groupWeapons(weapons) {
  const out = [];
  const byId = new Map();
  for (const w of weapons) {
    const row = byId.get(w.id);
    if (row) row.qty += 1;
    else { const r = { weapon: w, qty: 1 }; byId.set(w.id, r); out.push(r); }
  }
  return out;
}

/* Backgrounds carry their starting gold as a plain "N gp" string inside
   the equipment array (e.g. backgrounds.js:9) rather than a structured
   field. Pull it out as a number, and return the rest of the equipment
   list with that line removed so it isn't shown twice. */
export function parseStartingGold(background) {
  if (!background) return { gp: 0, items: [] };
  const items = [];
  let gp = 0;
  for (const line of background.equipment) {
    const m = /(\d+)\s*gp/i.exec(line);
    if (m && !gp) gp = Number(m[1]);
    else items.push(line);
  }
  return { gp, items };
}

/* Action-economy buckets, in the order a turn actually goes. Shared by
   the app (SinaUnaCreator.jsx) and the printable sheet (sheetHtml.js). */
export const ACTION_ORDER = ["action", "bonus", "reaction", "free"];
export const ACTION_LABELS = { action: "Actions", bonus: "Bonus Actions",
  reaction: "Reactions", free: "No Action Required" };

/* Point-buy spread that leans into whatever the ancestry already boosts.
   Ranks abilities by their ancestry bonus, then pours the budget in that
   order. Class isn't chosen yet, so this is a starting point, not a build. */
export const RECOMMENDED_BASE = [15, 14, 13, 12, 10, 8];
export function recommendedSpread(asi) {
  const ranked = [...ABILITIES]
    .map(({ key }) => ({ key, bonus: asi[key] || 0 }))
    .sort((a, b) => b.bonus - a.bonus);
  const out = {};
  ranked.forEach((r, i) => { out[r.key] = RECOMMENDED_BASE[i]; });
  return out;
}

/* ------------------------------------------------------------------
   Resolve an ancestry against its base race, honouring `replaces`.
------------------------------------------------------------------- */
export function resolveLineage(lineage, choicePicks) {
  if (!lineage) return null;
  const base = BASE_RACES[lineage.base];
  const dropped = new Set(lineage.replaces || []);

  /* Base ability increases survive unless the variant replaces them. */
  const asi = {};
  if (!dropped.has("Ability Score Increase")) {
    for (const [k, v] of Object.entries(base.asi)) asi[k] = (asi[k] || 0) + v;
  }
  for (const [k, v] of Object.entries(lineage.asi.fixed || {})) asi[k] = (asi[k] || 0) + v;
  if (lineage.asi.choice) {
    for (const k of choicePicks || []) {
      asi[k] = (asi[k] || 0) + lineage.asi.choice.amount;
    }
  }

  const keptBase = base.traits.filter((t) => !dropped.has(t.name));
  const traits = [...keptBase, ...(lineage.traits || [])];

  const skills = new Set();
  traits.forEach((t) => (t.skills || []).forEach((sk) => skills.add(sk)));

  /* Lineage effects can override speed and darkvision. */
  const lfx = lineage.effects || [];
  const speedFx = lfx.find((e) => e.type === "speed");
  const dvFx = lfx.find((e) => e.type === "darkvision");
  const blindsight = (lineage.traits || []).find((t) => t.blindsight)?.blindsight || 0;
  const languages = lineage.languages || base.languages;

  return {
    base, asi, traits, keptBase, skills: [...skills], languages,
    speed: speedFx ? speedFx.value : base.speed,
    size: base.size,
    darkvision: dropped.has("Darkvision") ? 0 : (dvFx ? dvFx.value : base.darkvision),
    blindsight,
    effects: lfx,
    droppedTraits: base.traits.filter((t) => dropped.has(t.name)),
  };
}
