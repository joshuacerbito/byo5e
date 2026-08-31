/* ------------------------------------------------------------------
   Drawer entries — the one shape every tappable thing on the Sheet
   page opens into:

     { title, sub, stats: [[label, value], ...], blocks, sections, note }

   `stats` is the definition grid at the top of the drawer (Range,
   Damage, Casting time...), `blocks` the structured prose FeatureBlocks
   renders, `sections` any trailing named block ("At Higher Levels", a
   weapon property). Keeping the builders here rather than in the Sheet
   component is what lets the shared panels (ActionsPanel,
   FeaturesPanel) hand one back to whichever screen owns the drawer,
   without importing the screen.
------------------------------------------------------------------- */
import { fmt, mod } from "../rules/abilities.js";
import { splitCastingTime, spellHitDC, spellEffect } from "./derive.js";

/* Every mundane item carries rarity "none" rather than no rarity at all
   (see content/items.js), so an unfiltered read labels a torch
   "Rarity: none". */
export const rarityOf = (item) => {
  const r = item?.rarity;
  return r && r !== "none" && r !== "unknown" ? r : null;
};

export function weaponEntry(row) {
  const w = row.weapon;
  return {
    title: row.name,
    sub: w ? [w.weaponKind, w.category].filter(Boolean).join(" · ") : "Weapon",
    stats: [
      ["Attack", row.hitOrDC], ["Damage", `${row.damage}${row.dmgType ? ` ${row.dmgType}` : ""}`],
      ["Range", row.range], ["Proficient", row.proficient ? "Yes" : "No — no proficiency bonus"],
      ["Weight", w?.weight ? `${w.weight} lb` : null], ["Cost", w?.cost?.label],
    ],
    /* A weapon has no prose entry of its own in the pack — what it
       "does" is its properties and masteries, so those carry the drawer
       instead of an empty body. */
    sections: [
      ...(w?.properties || []).filter((p) => p.text || p.note).map((p) => ({
        name: p.label + (p.note ? ` (${p.note})` : ""),
        blocks: [{ type: "para", text: p.text || p.note }],
      })),
      ...(w?.mastery || []).map((m) => ({ name: `Mastery: ${m.name}`, blocks: [{ type: "para", text: m.text }] })),
    ],
    note: row.notes && !w ? row.notes : null,
  };
}

/* An ancestry/feat-granted spell carries its own attack/DC (it can cast
   off a different ability than the class does); a chosen spell reads the
   character's casting stats. Same drawer either way. */
export function spellEntry(sp, casting) {
  const { head: time, trigger } = splitCastingTime(sp.time);
  const hitDC = sp.from ? spellHitDC(sp, { attack: sp.attack, saveDC: sp.saveDC }) : spellHitDC(sp, casting);
  return {
    title: sp.name,
    sub: `${sp.level === 0 ? "Cantrip" : `Level ${sp.level}`}${sp.school ? ` · ${sp.school}` : ""}${sp.from ? ` · ${sp.from}` : ""}`,
    stats: [
      ["Casting time", time], ["Trigger", trigger], ["Range", sp.range],
      ["Components", sp.components], ["Duration", sp.duration],
      ["Hit / DC", hitDC], ["Effect", spellEffect(sp)],
      ["Tags", [sp.ritual && "Ritual", sp.concentration && "Concentration"].filter(Boolean).join(", ")],
      ["Uses", sp.use],
    ],
    blocks: sp.blocks,
    sections: sp.higherLevelBlocks?.length
      ? [{ name: "At Higher Levels", blocks: sp.higherLevelBlocks }] : [],
  };
}

export function featureEntry(f, sub) {
  return {
    title: f.name, sub: sub || (f.level != null ? `Level ${f.level}` : null),
    blocks: f.blocks, text: f.text,
  };
}

export function itemEntry(it) {
  return {
    title: it.name,
    sub: [it.kind, it.attuned ? "attuned" : null].filter(Boolean).join(" · "),
    stats: [
      ["Quantity", it.qty > 1 ? `×${it.qty}` : null],
      ["Weight", it.item?.weight ? `${it.item.weight} lb` : null],
      ["Cost", it.item?.cost?.label],
      ["AC", it.item?.ac != null ? `${it.item.ac}${it.item.category ? ` (${it.item.category})` : ""}` : null],
      ["Attunement", it.item?.reqAttune ? "Required" : null],
      ["Rarity", rarityOf(it.item)],
      ["Charges", it.item?.charges],
      ["Contains", (it.item?.packContents || [])
        .map((c) => `${c.name}${c.quantity > 1 ? ` ×${c.quantity}` : ""}`).join(", ")],
    ],
    blocks: it.item?.blocks, text: it.item?.text,
    note: it.item ? null : "This one came with your starting kit — no entry for it in the loaded ruleset.",
  };
}

/* Tapping an ability (or any save/skill that keys off it) opens the
   arithmetic behind it: the score, the save, and every skill under it
   with its own breakdown. This is the "how did I get +7" question the
   printed sheet can never answer. */
export function abilityEntry(a, { savingThrows, skillTable, pb }) {
  if (!a) return null;
  const save = (savingThrows || []).find((s) => s.key === a.key);
  const skills = (skillTable || []).filter((s) => s.ability === a.key);
  const abilityMod = mod(a.score);
  const line = (label, value, proficient, expertise) =>
    `${label} ${fmt(value)} = ${fmt(abilityMod)} ${a.key.toUpperCase()}`
    + (proficient ? ` + ${expertise ? pb * 2 : pb} proficiency${expertise ? " (expertise)" : ""}` : "");
  return {
    title: a.label,
    sub: `Score ${a.score} · modifier ${a.mod}`,
    stats: [
      ["Score", a.score], ["Modifier", a.mod],
      ["Saving throw", save ? `${fmt(save.value)}${save.proficient ? " (proficient)" : ""}` : null],
      ["Proficiency bonus", fmt(pb)],
    ],
    blocks: [
      ...(save ? [{ type: "para", text: line("Saving throw", save.value, save.proficient, false) }] : []),
      /* ListBlock's items are { name, text, blocks } records, not bare
         strings — see FeatureBlocks. */
      ...(skills.length
        ? [{ type: "list", items: skills.map((s) => ({ name: null, text: line(s.name, s.value, s.proficient, s.expertise), blocks: [] })) }]
        : []),
    ],
  };
}
