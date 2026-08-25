/* ------------------------------------------------------------------
   Starting equipment, structured.

   5etools carries it twice: prose (`default` in 2014, `entries` in
   2024) and structured (`defaultData` on classes, `startingEquipment`
   itself on backgrounds). Both are kept — the prose is what a sheet
   prints, the structure is what a picker needs.

   A group is one line of the equipment list. Its keys are the option
   labels: "a"/"b" in 2014, "A"/"B" in 2024, and "_" for "you always
   get this, no choice".

   MONEY: `value` and `containsValue` are in COPPER (a 15 gp pouch is
   1500). `gp` is emitted alongside as value/100. Note the 2024 Cleric's
   option A carries value 7000 while its own prose says "7 GP" — the
   two disagree in the source data. The structured number is passed
   through as found rather than corrected; see check-content findings.
------------------------------------------------------------------- */
import { stripTags, splitUid } from "./entries.js";

const CP_PER_GP = 100;

function normItem(e, reg, from) {
  if (typeof e === "string") {
    const rec = reg.resolveItem(e);
    return { name: rec?.name ?? splitUid(e).name, itemId: rec ? rec.name : null, quantity: 1 };
  }
  if (!e || typeof e !== "object") return null;
  if (e.value != null && !e.item && !e.special) {
    return { name: `${e.value / CP_PER_GP} gp`, currency: true, valueCp: e.value, gp: e.value / CP_PER_GP, quantity: 1 };
  }
  const out = { quantity: e.quantity ?? 1 };
  if (e.item) {
    const rec = reg.resolveItem(e.item, from);
    out.name = e.displayName ? stripTags(e.displayName) : (rec?.name ?? splitUid(e.item).name);
    out.itemId = rec ? rec.name : null;
  } else if (e.special) {
    out.name = stripTags(e.special);
    out.special = true;
  } else if (e.equipmentType) {
    /* "focusSpellcastingArcane" — a category, not a specific item. */
    out.name = String(e.equipmentType).replace(/([A-Z])/g, " $1").trim().toLowerCase();
    out.equipmentType = e.equipmentType;
  } else {
    out.name = stripTags(JSON.stringify(e));
  }
  if (e.containsValue != null) {
    out.containsValueCp = e.containsValue;
    out.containsGp = e.containsValue / CP_PER_GP;
  }
  if (e.value != null) { out.valueCp = e.value; out.gp = e.value / CP_PER_GP; }
  return out;
}

function normGroups(groups, reg, from) {
  return (groups || []).map((g) => {
    const options = Object.entries(g || {}).map(([key, items]) => ({
      key,
      fixed: key === "_",
      items: [].concat(items).map((i) => normItem(i, reg, from)).filter(Boolean),
    }));
    return { choice: options.length > 1 || !options.every((o) => o.fixed), options };
  });
}

/* Classes: { additionalFromBackground, default|entries, goldAlternative, defaultData } */
export function normClassEquipment(se, reg, from) {
  if (!se) return { fromBackground: false, text: [], goldAlternative: null, groups: [] };
  return {
    fromBackground: !!se.additionalFromBackground,
    text: [...(se.default || []), ...(se.entries || [])].map(stripTags).filter(Boolean),
    goldAlternative: se.goldAlternative ? stripTags(se.goldAlternative) : null,
    groups: normGroups(se.defaultData, reg, from),
  };
}

/* Backgrounds: startingEquipment IS the group array. */
export function normBackgroundEquipment(se, reg, from) {
  return normGroups(se, reg, from);
}
