/* ------------------------------------------------------------------
   BackgroundView.

   2014: { skills, languages, tools, equipment, feature }.
     The feature is the entry whose data.isFeature is true ("Feature:
     Shelter of the Faithful").

   2024 adds { abilityChoices, feat }. The 2024 Acolyte's `ability`
     field is TWO alternative weighted blocks — +2/+1 across three
     abilities, or +1/+1/+1 — so it is modelled as an explicit choice
     the UI can render, never as prose. See normBackgroundAbility().
------------------------------------------------------------------- */
import { flatten, stripTags, splitUid } from "./entries.js";
import { idMinter } from "./ids.js";
import { entryToFeature } from "./features.js";
import { normSkills, normLanguages, normTools, normBackgroundAbility } from "./prof.js";
import { normBackgroundEquipment } from "./equipment.js";

/* "magic initiate; cleric|xphb" — the feat's uid carries its variant
   after a semicolon, which is display text, not part of the name. */
function normFeats(arr, reg, from) {
  const out = [];
  for (const blk of arr || []) {
    for (const [uid, on] of Object.entries(blk || {})) {
      if (!on) continue;
      const [rawName, variant] = String(uid).split("|")[0].split(";");
      const source = String(uid).split("|")[1];
      const rec = reg.resolveRef("feat", `${rawName}|${(source || "").toUpperCase()}`, from);
      out.push({
        name: rec ? rec.name : splitUid(rawName).name,
        variant: variant ? variant.trim().replace(/\b[a-z]/g, (m) => m.toUpperCase()) : null,
        source: rec ? rec.source : (source || "").toUpperCase() || null,
        resolved: !!rec,
      });
    }
  }
  return out;
}

export function buildBackgrounds(reg) {
  const mint = idMinter();
  return (reg.content.backgrounds || []).map((b) => {
    const from = `background ${b.name}`;
    const featureNode = (b.entries || []).find((e) => e?.data?.isFeature);
    const flat = flatten(b.entries || []);
    return {
      kind: "background",
      id: mint(b.name, b.source),
      name: b.name,
      source: b.source,
      page: b.page ?? null,
      skills: normSkills(b.skillProficiencies),
      languages: normLanguages(b.languageProficiencies),
      tools: normTools(b.toolProficiencies),
      equipment: normBackgroundEquipment(b.startingEquipment, reg, from),
      /* Prose version of the equipment line, as the book prints it. */
      equipmentText: ((b.entries || [])
        .flatMap((e) => (e.type === "list" ? e.items || [] : []))
        .find((it) => /^equipment/i.test(stripTags(it.name || ""))) || {}).entry
        ? stripTags(((b.entries || [])
          .flatMap((e) => (e.type === "list" ? e.items || [] : []))
          .find((it) => /^equipment/i.test(stripTags(it.name || "")))).entry)
        : null,
      feature: featureNode ? entryToFeature(featureNode, reg, { source: b.source, page: b.page, from }) : null,
      /* 2024 only. null in 2014, where ancestry carries the increases. */
      abilityChoices: normBackgroundAbility(b.ability),
      feat: normFeats(b.feats, reg, from)[0] ?? null,
      feats: normFeats(b.feats, reg, from),
      text: flat.text,
      blocks: flat.blocks,
    };
  });
}
