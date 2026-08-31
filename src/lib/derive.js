/* Small, edition-independent presentation helpers still shared by the app
   and the three sheet renderers. `mod`/`fmt`/point-buy/ability arithmetic
   now live in src/rules/abilities.js; class/race/spell content lookups
   live in src/content/ — nothing book-specific belongs here any more. */

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

export const ABIL_LABEL = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };

/* Hit/DC column: an attack spell shows the caster's flat spell attack
   bonus, a save spell shows the target's save (ability + DC), and
   anything that forces neither shows an em dash rather than a guess.
   Shared by the app's Sheet summary and both printed routes — it lived
   as three identical copies before. SpellTableRow keeps its own, since
   the picker's version also returns an icon flag. */
export const spellHitDC = (sp, casting) => {
  // `casting?.attack`/`saveDC` can be null (an ancestry/feat grant with no
  // resolvable ability) rather than just absent — `null >= 0` is true in
  // JS, so a loose truthy check here printed a literal "+null". Require an
  // actual number before formatting either one.
  if (sp.atk) {
    if (typeof casting?.attack !== "number") return "—";
    return casting.attack >= 0 ? `+${casting.attack}` : `${casting.attack}`;
  }
  if (sp.save) {
    if (typeof casting?.saveDC !== "number") return "—";
    return `${ABIL_LABEL[sp.save] || sp.save.toUpperCase()} ${casting.saveDC}`;
  }
  return "—";
};

export const spellEffect = (sp) => {
  if (sp.heal) return sp.heal;
  if (sp.dmg) return `${sp.dmg}${sp.dmgType ? ` ${sp.dmgType}` : ""}`;
  if (sp.cond) return sp.cond[0].toUpperCase() + sp.cond.slice(1);
  return "—";
};

/* Action-economy buckets, in the order a turn actually goes. Shared by
   the app and the printable sheet. */
export const ACTION_ORDER = ["action", "bonus", "reaction", "free"];
export const ACTION_LABELS = { action: "Actions", bonus: "Bonus Actions",
  reaction: "Reactions", free: "No Action Required" };

/* Most class/subclass features (Rage, Second Wind, Flurry of Blows, ...)
   carry no structured action field in the SRD pack — only ancestry traits
   do. Rather than leave every one of them untagged (and silently missing
   from the Bonus Actions / Reactions tabs), sniff the feature's own prose
   for the standard "as a bonus action" / "as a reaction" phrasing 5e text
   always uses when a feature is actually one of those. Anything that
   doesn't match reads as a plain action, same as before. */
export function inferActionBucket(text) {
  if (!text) return null;
  if (/\bas a bonus action\b/i.test(text)) return "bonus";
  if (/\bas a reaction\b/i.test(text)) return "reaction";
  return null;
}

/* Point-buy spread that leans into whatever the chosen class actually
   wants — its primary ability highest, then down through its saves and
   the rest. `priority` is a full ordering of all six ability keys, from
   src/rules/abilities.js classAbilityPriority(klass). A starting point,
   not a build: nothing stops the player from moving it around after. */
export const RECOMMENDED_BASE = [15, 14, 13, 12, 10, 8];
export function recommendedSpread(priority) {
  const out = {};
  priority.forEach((key, i) => { out[key] = RECOMMENDED_BASE[i]; });
  return out;
}

/* "1 action, which you take when you are hit by an attack" -> head "1
   action", trigger "You take when you are hit by an attack". Only a
   reaction's clause is split out — everything else prints as one line.
   The "which you take " lead-in is dropped as filler. */
export function splitCastingTime(time) {
  const i = (time || "").indexOf(",");
  if (i < 0) return { head: time || "", trigger: "" };
  const head = time.slice(0, i);
  if (!/reaction/i.test(head)) return { head: time, trigger: "" };
  const rest = time.slice(i + 1).trim().replace(/^which you take\s+/i, "");
  return { head, trigger: rest.charAt(0).toUpperCase() + rest.slice(1) };
}
