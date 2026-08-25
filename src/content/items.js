/* ------------------------------------------------------------------
   WeaponView / ArmorView / GearView, split out of `items` by the
   `weapon` and `armor` flags (plus the "S" shield item type, which
   carries neither).

   Property codes carry a source suffix in 2024 ("V|XPHB") and none in
   2014 ("V"); both resolve through the registry, which indexes by
   abbreviation with and without the suffix. A property can also arrive
   as { uid, note } — the Lance's "2H unless mounted".

   Property display names are NOT on the property record. Only the 2014
   "special" property has a `name`; every other one puts its label on
   entries[0].name ("Ammunition", "Versatile"). Both are read here.

   maxDex is NOT in the source data. It is a rules constant of the armor
   CATEGORY (light: none, medium: +2, heavy: none applied), so it is
   derived from the item type rather than invented per item, and the raw
   `ac` is passed through untouched for anything that would rather
   compute it itself.
------------------------------------------------------------------- */
import { stripTags, flatten } from "./entries.js";
import { idMinter } from "./ids.js";

const CP_PER_GP = 100;

const DMG_TYPE = {
  B: "bludgeoning", P: "piercing", S: "slashing", A: "acid", C: "cold",
  F: "fire", O: "force", L: "lightning", N: "necrotic", I: "poison",
  Y: "psychic", R: "radiant", T: "thunder",
};

const ARMOR_CATEGORY = { LA: "light", MA: "medium", HA: "heavy", S: "shield" };
/* Rules constant, not pack data — see header. */
const MAX_DEX = { light: null, medium: 2, heavy: 0, shield: null };

const typeCode = (t) => String(t ?? "").split("|")[0];

const cost = (v) => (v == null ? null : { cp: v, gp: v / CP_PER_GP, label: `${v / CP_PER_GP} gp` });

function properties(item, reg) {
  return (item.property || []).map((p) => {
    const uid = typeof p === "object" ? p.uid : p;
    const rec = reg.resolveCode("itemProperty", uid, `item ${item.name}`);
    const label = rec ? (rec.name ? stripTags(rec.name) : stripTags(rec.entries?.[0]?.name || "")) : "";
    return {
      code: String(uid).split("|")[0],
      label: label || String(uid).split("|")[0],
      text: rec ? flatten(rec.entries || []).text : "",
      note: typeof p === "object" && p.note ? stripTags(p.note) : null,
    };
  });
}

function masteries(item, reg) {
  return (item.mastery || []).map((m) => {
    const rec = reg.resolveCode("itemMastery", m, `item ${item.name}`)
      || reg.index.itemMastery.get(String(m).split("|")[0].toLowerCase());
    return {
      name: rec ? rec.name : String(m).split("|")[0],
      text: rec ? flatten(rec.entries || []).text : "",
    };
  });
}

/* "150/600" -> { normal: 150, long: 600 } */
function parseRange(r) {
  if (r == null) return null;
  const [a, b] = String(r).split("/").map((n) => parseInt(n, 10));
  return { normal: a, long: Number.isFinite(b) ? b : null, label: String(r) };
}

export function buildItems(reg) {
  const mint = idMinter();
  const weapons = [];
  const armor = [];
  const gear = [];

  for (const it of reg.content.items || []) {
    const t = typeCode(it.type);
    const flat = flatten(it.entries || []);
    const base = {
      id: mint(it.name, it.source),
      name: it.name,
      nameOriginal: it.nameOriginal ?? null,
      source: it.source,
      page: it.page ?? null,
      typeCode: t,
      typeName: reg.resolveCode("itemType", it.type)?.name ?? null,
      weight: it.weight ?? null,
      cost: cost(it.value),
      text: flat.text,
      blocks: flat.blocks,
    };

    if (it.weapon) {
      weapons.push({
        ...base,
        kind: "weapon",
        category: it.weaponCategory || null,
        weaponKind: t === "R" ? "ranged" : "melee",
        dmg: it.dmg1 ?? null,
        dmgType: it.dmgType ? (DMG_TYPE[it.dmgType] || it.dmgType) : null,
        versatileDmg: it.dmg2 ?? null,
        properties: properties(it, reg),
        range: parseRange(it.range),
        ammoType: it.ammoType ? String(it.ammoType).split("|")[0] : null,
        mastery: masteries(it, reg),
      });
      continue;
    }

    if (it.armor || t === "S") {
      const category = ARMOR_CATEGORY[t] || null;
      armor.push({
        ...base,
        kind: "armor",
        category,
        ac: it.ac ?? null,
        maxDex: category ? MAX_DEX[category] : null,
        strReq: it.strength ? Number(it.strength) : null,
        stealthDisadvantage: !!it.stealth,
      });
      continue;
    }

    gear.push({
      ...base,
      kind: "gear",
      packContents: (it.packContents || []).map((p) =>
        (typeof p === "string"
          ? { name: reg.resolveItem(p)?.name ?? String(p).split("|")[0], quantity: 1 }
          : { name: reg.resolveItem(p.item || p.special)?.name ?? stripTags(String(p.item || p.special).split("|")[0]), quantity: p.quantity ?? 1 })),
      focusType: it.scfType ?? null,
    });
  }

  return { weapons, armor, gear };
}
