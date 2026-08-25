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

/* Which book a piece of content came from, and what to call it in a
   heading. Every content record carries `src`; island content carries
   "sinauna", and the three 2014-compatible imports carry their book's
   own code. Kept here so the ancestry, class, subclass and spell
   pickers all head their groups with the same words.

   XGE and TCE are 2014 content — both predate the 2024 revision — so
   they sit on the same chassis as the Handbook with no opt-in gate,
   unlike Weapon Mastery (see CLAUDE.md). */
export const SOURCE_LABEL = {
  sinauna: "Sina Una",
  phb: "Player's Handbook",
  scc: "Strixhaven",
  xge: "Xanathar's Guide",
  tce: "Tasha's Cauldron",
};

/* Display order: the campaign's own book first, then the Handbook,
   then the supplements in publication order. */
export const CONTENT_SOURCES = ["sinauna", "phb", "xge", "tce", "scc"];

export const ABIL_LABEL = { str: "STR", dex: "DEX", con: "CON",
  int: "INT", wis: "WIS", cha: "CHA" };

/* Hit/DC column: an attack spell shows the caster's flat spell attack
   bonus, a save spell shows the target's save (ability + DC), and
   anything that forces neither shows an em dash rather than a guess.
   Shared by the app's Sheet summary and both printed routes — it lived
   as three identical copies before. SpellTableRow keeps its own, since
   the picker's version also returns an icon flag. */
export const spellHitDC = (sp, casting) => {
  if (sp.atk) return casting ? fmt(casting.attack) : "\u2014";
  if (sp.save) return `${ABIL_LABEL[sp.save] || sp.save.toUpperCase()} ${casting?.saveDC ?? ""}`.trim();
  return "\u2014";
};

export const spellEffect = (sp) => {
  if (sp.heal) return sp.heal;
  if (sp.dmg) return `${sp.dmg}${sp.dmgType ? ` ${sp.dmgType}` : ""}`;
  if (sp.cond) return sp.cond[0].toUpperCase() + sp.cond.slice(1);
  return "\u2014";
};

/* The compact spell tables on the printed sheet have no room for a
   source column, so provenance is a footnote mark instead. Handbook
   spells carry none — they're the default — and island spells have no
   `src` field at all, which is what the undefined entry matches.
   Shared by sheetHtml.js and sheetPdf.js so the two agree. */
export const SPELL_MARKS = [
  { src: undefined, mark: "*", label: "island spell" },
  { src: "xge", mark: "\u2021", label: "Xanathar's spell" },
  { src: "tce", mark: "\u00a7", label: "Tasha's spell" },
  { src: "scc", mark: "\u2020", label: "Strixhaven spell" },
];

export const spellMark = (sp) =>
  SPELL_MARKS.find((m) => m.src === (sp.src || undefined))?.mark || "";

/* One footnote line per book the character actually drew from. */
export const spellMarkNotes = (spells) => SPELL_MARKS
  .filter((m) => spells.some((sp) => (sp.src || undefined) === m.src))
  .map((m) => `${m.mark} ${m.label} — full text in the reference below.`);

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

/* Reaction spells carry their trigger inside the casting-time string —
   "1 reaction, which you take when you are hit by an attack". In a narrow
   table column that wraps to ten lines and buries the rest of the row, so
   the trigger is split off and shown beside the description instead. Only
   a comma after a "reaction" head splits: Plant Growth's "1 action, 8
   hours" is two real casting times and stays whole. The stock PHB
   "which you take " lead-in is dropped as filler; Sina Una and SCC phrase
   theirs without it. */
export function splitCastingTime(time) {
  const i = (time || "").indexOf(",");
  if (i < 0) return { head: time || "", trigger: "" };
  const head = time.slice(0, i);
  if (!/reaction/i.test(head)) return { head: time, trigger: "" };
  const rest = time.slice(i + 1).trim().replace(/^which you take\s+/i, "");
  return { head, trigger: rest.charAt(0).toUpperCase() + rest.slice(1) };
}
