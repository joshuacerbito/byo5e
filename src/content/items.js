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
import { stripTags, flatten, splitUid } from "./entries.js";
import { idMinter } from "./ids.js";
import { ITEM_EFFECTS_OVERLAY } from "./itemEffectsOverlay.js";

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

/* A wand/staff/rod/potion's attachedSpells is already machine-readable in
   the raw pack — unlike a feature's prose, nothing here needs
   hand-authoring, just reading. Three shapes turn up:
     ["spellUid", ...]                                 — a potion/scroll
       IS the spell, no cost of any kind (Potion of Heroism -> Bless)
     { will: ["spellUid", ...] }                       — at-will, no cost
       (Boots of Levitation), also seen as "other"
     { charges: { "<n>": ["spellUid", ...] } }         — Wand of Fireballs
     { limited: { "<n>": ["spellUid", ...] } }         — Necklace of Fireballs
   The middle two both carry a mode key but differ in whether the value is
   a bare list or a cost-keyed object, so both are handled rather than
   assuming every mode looks like "charges". */
function resolveSpellRef(uid, reg, itemName, mode, cost) {
  const rec = reg.resolveSpell(uid, `item ${itemName}`);
  return { mode, cost, name: rec ? rec.name : splitUid(uid).name, level: rec ? rec.level : null };
}

function attachedSpells(raw, reg, itemName) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((uid) => resolveSpellRef(uid, reg, itemName, "cast", 0));
  const out = [];
  for (const [mode, val] of Object.entries(raw)) {
    if (Array.isArray(val)) {
      for (const uid of val) out.push(resolveSpellRef(uid, reg, itemName, mode, 0));
      continue;
    }
    for (const [cost, uids] of Object.entries(val || {})) {
      for (const uid of uids || []) out.push(resolveSpellRef(uid, reg, itemName, mode, Number(cost) || 0));
    }
  }
  return out;
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
      /* Magic-item metadata. Absent/"none"/null on every mundane record,
         which is most of them — see header. */
      rarity: it.rarity ?? "none",
      reqAttune: typeof it.reqAttune === "string" ? stripTags(it.reqAttune) : (it.reqAttune ?? null),
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
        /* "+1" -> 1, from the generic-variant expansion's bonusWeapon
           field (scripts/build-srd-pack.mjs). null on every ordinary
           weapon. */
        magicBonus: it.bonusWeapon ? parseInt(it.bonusWeapon, 10) : null,
        /* Mastery is picked/tracked by weapon TYPE, not specific item —
           a +2 Greatsword shares its mastery property with the plain
           one, so "mastered Greatsword" should cover both without the
           player ever picking the magic version separately. baseItemName
           (build-srd-pack.mjs's variant expansion) links a magic variant
           back to the mundane record it inherits mastery from; a mundane
           weapon has no baseItemName and IS its own type. */
        masteryKey: it.baseItemName || it.name,
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
        /* Same parse as weapons, off bonusAc — covers shields too, since
           they arrive here via the "S" typeCode branch above. */
        magicBonus: it.bonusAc ? parseInt(it.bonusAc, 10) : null,
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
      /* A wand's charges are as mechanical as a weapon's damage die —
         the raw record already carries them, so this is a straight read,
         not the hand-authored overlay a feature's prose would need. */
      charges: it.charges ?? null,
      recharge: it.recharge ?? null,
      rechargeAmount: it.rechargeAmount ? stripTags(it.rechargeAmount) : null,
      attachedSpells: attachedSpells(it.attachedSpells, reg, it.name),
      /* Flat-bonus items (Ring of Protection and the like) — see
         itemEffectsOverlay.js. Empty for the overwhelming majority of
         gear, same as `choices`/`references` are empty on most features. */
      effects: ITEM_EFFECTS_OVERLAY[base.id]?.effects || [],
    });
  }

  return { weapons, armor, gear };
}
