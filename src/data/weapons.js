/* ------------------------------------------------------------------
   Weapons: the 37 PHB simple and martial weapons, plus 18 of Sina
   Una's own (book p.207 — appended below, after this array closes).
   PHB source: 5etools-src/data/items-base.json, baseitem entries with
   weapon: true and source: "PHB" — the file interleaves 2014 and 2024
   (XPHB) data side by side, so every field below is read off the PHB
   side only. dmg1/dmg2 are dice strings; dmgType is a one-letter code
   (P piercing, S slashing, B bludgeoning); properties are 5etools'
   own codes (see PROPERTY_LABELS); range is "normal/long" in feet for
   ranged/thrown weapons, null for pure melee.
------------------------------------------------------------------- */
export const WEAPONS = [
  { id: "battleaxe", name: "Battleaxe", category: "martial", kind: "melee", dmg1: "1d8", dmgType: "S", dmg2: "1d10", properties: ["V"], range: null, weight: 4, cost: 1000 },
  { id: "blowgun", name: "Blowgun", category: "martial", kind: "ranged", dmg1: "1", dmgType: "P", dmg2: null, properties: ["A", "LD"], range: "25/100", weight: 1, cost: 1000 },
  { id: "club", name: "Club", category: "simple", kind: "melee", dmg1: "1d4", dmgType: "B", dmg2: null, properties: ["L"], range: null, weight: 2, cost: 10 },
  { id: "dagger", name: "Dagger", category: "simple", kind: "melee", dmg1: "1d4", dmgType: "P", dmg2: null, properties: ["F", "L", "T"], range: "20/60", weight: 1, cost: 200 },
  { id: "dart", name: "Dart", category: "simple", kind: "ranged", dmg1: "1d4", dmgType: "P", dmg2: null, properties: ["F", "T"], range: "20/60", weight: 0.25, cost: 5 },
  { id: "flail", name: "Flail", category: "martial", kind: "melee", dmg1: "1d8", dmgType: "B", dmg2: null, properties: [], range: null, weight: 2, cost: 1000 },
  { id: "glaive", name: "Glaive", category: "martial", kind: "melee", dmg1: "1d10", dmgType: "S", dmg2: null, properties: ["H", "R", "2H"], range: null, weight: 6, cost: 2000 },
  { id: "greataxe", name: "Greataxe", category: "martial", kind: "melee", dmg1: "1d12", dmgType: "S", dmg2: null, properties: ["H", "2H"], range: null, weight: 7, cost: 3000 },
  { id: "greatclub", name: "Greatclub", category: "simple", kind: "melee", dmg1: "1d8", dmgType: "B", dmg2: null, properties: ["2H"], range: null, weight: 10, cost: 20 },
  { id: "greatsword", name: "Greatsword", category: "martial", kind: "melee", dmg1: "2d6", dmgType: "S", dmg2: null, properties: ["H", "2H"], range: null, weight: 6, cost: 5000 },
  { id: "halberd", name: "Halberd", category: "martial", kind: "melee", dmg1: "1d10", dmgType: "S", dmg2: null, properties: ["H", "R", "2H"], range: null, weight: 6, cost: 2000 },
  { id: "hand-crossbow", name: "Hand Crossbow", category: "martial", kind: "ranged", dmg1: "1d6", dmgType: "P", dmg2: null, properties: ["A", "L", "LD"], range: "30/120", weight: 3, cost: 7500 },
  { id: "handaxe", name: "Handaxe", category: "simple", kind: "melee", dmg1: "1d6", dmgType: "S", dmg2: null, properties: ["L", "T"], range: "20/60", weight: 2, cost: 500 },
  { id: "heavy-crossbow", name: "Heavy Crossbow", category: "martial", kind: "ranged", dmg1: "1d10", dmgType: "P", dmg2: null, properties: ["A", "H", "LD", "2H"], range: "100/400", weight: 18, cost: 5000 },
  { id: "javelin", name: "Javelin", category: "simple", kind: "melee", dmg1: "1d6", dmgType: "P", dmg2: null, properties: ["T"], range: "30/120", weight: 2, cost: 50 },
  { id: "lance", name: "Lance", category: "martial", kind: "melee", dmg1: "1d12", dmgType: "P", dmg2: null, properties: ["R", "S"], range: null, weight: 6, cost: 1000 },
  { id: "light-crossbow", name: "Light Crossbow", category: "simple", kind: "ranged", dmg1: "1d8", dmgType: "P", dmg2: null, properties: ["A", "LD", "2H"], range: "80/320", weight: 5, cost: 2500 },
  { id: "light-hammer", name: "Light Hammer", category: "simple", kind: "melee", dmg1: "1d4", dmgType: "B", dmg2: null, properties: ["L", "T"], range: "20/60", weight: 2, cost: 200 },
  { id: "longbow", name: "Longbow", category: "martial", kind: "ranged", dmg1: "1d8", dmgType: "P", dmg2: null, properties: ["A", "H", "2H"], range: "150/600", weight: 2, cost: 5000 },
  { id: "longsword", name: "Longsword", category: "martial", kind: "melee", dmg1: "1d8", dmgType: "S", dmg2: "1d10", properties: ["V"], range: null, weight: 3, cost: 1500 },
  { id: "mace", name: "Mace", category: "simple", kind: "melee", dmg1: "1d6", dmgType: "B", dmg2: null, properties: [], range: null, weight: 4, cost: 500 },
  { id: "maul", name: "Maul", category: "martial", kind: "melee", dmg1: "2d6", dmgType: "B", dmg2: null, properties: ["H", "2H"], range: null, weight: 10, cost: 1000 },
  { id: "morningstar", name: "Morningstar", category: "martial", kind: "melee", dmg1: "1d8", dmgType: "P", dmg2: null, properties: [], range: null, weight: 4, cost: 1500 },
  { id: "net", name: "Net", category: "martial", kind: "ranged", dmg1: null, dmgType: null, dmg2: null, properties: ["S", "T"], range: "5/15", weight: 3, cost: 100 },
  { id: "pike", name: "Pike", category: "martial", kind: "melee", dmg1: "1d10", dmgType: "P", dmg2: null, properties: ["H", "R", "2H"], range: null, weight: 18, cost: 500 },
  { id: "quarterstaff", name: "Quarterstaff", category: "simple", kind: "melee", dmg1: "1d6", dmgType: "B", dmg2: "1d8", properties: ["V"], range: null, weight: 4, cost: 20 },
  { id: "rapier", name: "Rapier", category: "martial", kind: "melee", dmg1: "1d8", dmgType: "P", dmg2: null, properties: ["F"], range: null, weight: 2, cost: 2500 },
  { id: "scimitar", name: "Scimitar", category: "martial", kind: "melee", dmg1: "1d6", dmgType: "S", dmg2: null, properties: ["F", "L"], range: null, weight: 3, cost: 2500 },
  { id: "shortbow", name: "Shortbow", category: "simple", kind: "ranged", dmg1: "1d6", dmgType: "P", dmg2: null, properties: ["A", "2H"], range: "80/320", weight: 2, cost: 2500 },
  { id: "shortsword", name: "Shortsword", category: "martial", kind: "melee", dmg1: "1d6", dmgType: "P", dmg2: null, properties: ["F", "L"], range: null, weight: 2, cost: 1000 },
  { id: "sickle", name: "Sickle", category: "simple", kind: "melee", dmg1: "1d4", dmgType: "S", dmg2: null, properties: ["L"], range: null, weight: 2, cost: 100 },
  { id: "sling", name: "Sling", category: "simple", kind: "ranged", dmg1: "1d4", dmgType: "B", dmg2: null, properties: ["A"], range: "30/120", weight: 0, cost: 10 },
  { id: "spear", name: "Spear", category: "simple", kind: "melee", dmg1: "1d6", dmgType: "P", dmg2: "1d8", properties: ["T", "V"], range: "20/60", weight: 3, cost: 100 },
  { id: "trident", name: "Trident", category: "martial", kind: "melee", dmg1: "1d6", dmgType: "P", dmg2: "1d8", properties: ["T", "V"], range: "20/60", weight: 4, cost: 500 },
  { id: "war-pick", name: "War Pick", category: "martial", kind: "melee", dmg1: "1d8", dmgType: "P", dmg2: null, properties: [], range: null, weight: 2, cost: 500 },
  { id: "warhammer", name: "Warhammer", category: "martial", kind: "melee", dmg1: "1d8", dmgType: "B", dmg2: "1d10", properties: ["V"], range: null, weight: 2, cost: 1500 },
  { id: "whip", name: "Whip", category: "martial", kind: "melee", dmg1: "1d4", dmgType: "S", dmg2: null, properties: ["F", "R"], range: null, weight: 3, cost: 200 },
];

/* ------------------------------------------------------------------
   Sina Una's own weapons (book p.207), appended to the same WEAPONS
   array — the app doesn't distinguish PHB vs. setting-native weapons
   anywhere downstream (attack table, proficiency checks, Inventory),
   so one flat array keeps every consumer working unmodified. Verified
   visually against the rasterized page image, not the OCR markdown
   (see CLAUDE.md "don't trust OCR for mechanics"). "HP"/"SI" are two
   new weapon properties this book adds (p.206); their rules text is
   the same shape as WEAPON_MASTERY_2024's below, keyed by weapon id
   for the special-rule ones (Bangkaw/Bunang/Sumpit).
------------------------------------------------------------------- */
WEAPONS.push(
  { id: "bagakay-spear", name: "Bagakay spear", category: "simple", kind: "melee", dmg1: "1d6", dmgType: "P", dmg2: null, properties: ["T"], range: "30/120", weight: 2, cost: 50 },
  { id: "baladaw", name: "Baladaw", category: "simple", kind: "melee", dmg1: "1d4", dmgType: "P", dmg2: null, properties: ["F", "L"], range: null, weight: 1, cost: 200 },
  { id: "bangkaw", name: "Bangkaw", category: "simple", kind: "melee", dmg1: "1d8", dmgType: "P", dmg2: null, properties: ["2H", "S"], range: null, weight: 3, cost: 300 },
  { id: "bolo", name: "Bolo", category: "simple", kind: "melee", dmg1: "1d4", dmgType: "S", dmg2: null, properties: ["L"], range: null, weight: 1, cost: 100 },
  { id: "kris", name: "Kris", category: "simple", kind: "melee", dmg1: "1d6", dmgType: "S", dmg2: null, properties: ["F", "L"], range: null, weight: 2, cost: 1000 },
  { id: "busog", name: "Busog", category: "simple", kind: "ranged", dmg1: "1d6", dmgType: "P", dmg2: null, properties: ["A", "2H"], range: "80/320", weight: 2, cost: 2500 },
  { id: "kalawit", name: "Kalawit", category: "simple", kind: "ranged", dmg1: "1d4", dmgType: "P", dmg2: null, properties: ["HP", "T"], range: "30/120", weight: 1, cost: 1000 },
  { id: "bunang", name: "Bunang", category: "martial", kind: "melee", dmg1: "1d8", dmgType: "S", dmg2: null, properties: ["2H", "S"], range: null, weight: 4, cost: 2500 },
  { id: "coral-tipped-spear", name: "Coral-tipped spear", category: "martial", kind: "melee", dmg1: "1d6", dmgType: "P", dmg2: null, properties: ["SI", "T"], range: "20/60", weight: 2, cost: 500 },
  { id: "kampilan", name: "Kampilan", category: "martial", kind: "melee", dmg1: "1d8", dmgType: "S", dmg2: "1d10", properties: ["V"], range: null, weight: 3, cost: 1500 },
  { id: "panabas", name: "Panabas", category: "martial", kind: "melee", dmg1: "1d10", dmgType: "S", dmg2: "1d12", properties: ["H", "V"], range: null, weight: 6, cost: 3000 },
  { id: "sarapang", name: "Sarapang", category: "martial", kind: "melee", dmg1: "1d6", dmgType: "P", dmg2: "1d8", properties: ["T", "V"], range: "20/60", weight: 4, cost: 500 },
  { id: "songil", name: "Songil", category: "martial", kind: "melee", dmg1: "2d6", dmgType: "P", dmg2: null, properties: ["F", "R"], range: null, weight: 2, cost: 2000 },
  { id: "stingray-tail-whip", name: "Stingray tail whip", category: "martial", kind: "melee", dmg1: "1d4", dmgType: "S", dmg2: null, properties: ["F", "R", "SI"], range: null, weight: 3, cost: 300 },
  { id: "astinggal", name: "Astinggal", category: "martial", kind: "ranged", dmg1: "1d10", dmgType: "P", dmg2: null, properties: ["A", "H", "LD"], range: "100/400", weight: 7, cost: 7500 },
  { id: "bontal", name: "Bontal", category: "martial", kind: "ranged", dmg1: "1d10", dmgType: "P", dmg2: null, properties: ["HP", "T"], range: "20/60", weight: 3, cost: 2500 },
  { id: "lantaka", name: "Lantaka", category: "martial", kind: "ranged", dmg1: "2d8", dmgType: "P", dmg2: null, properties: ["A", "H", "LD", "2H"], range: "120/480", weight: 10, cost: 10000 },
  { id: "sumpit", name: "Sumpit", category: "martial", kind: "ranged", dmg1: "1d8", dmgType: "P", dmg2: null, properties: ["A", "S"], range: "80/320", weight: 1, cost: 5000 },
);

export const PROPERTY_LABELS = {
  A: "Ammunition", F: "Finesse", H: "Heavy", L: "Light", LD: "Loading",
  R: "Reach", S: "Special", T: "Thrown", V: "Versatile", "2H": "Two-handed",
  HP: "Harpoon", SI: "Salt-imbued",
};

export const DMG_TYPE_LABELS = { P: "piercing", S: "slashing", B: "bludgeoning" };

/* New weapon properties this book adds (p.206). Harpoon and
   Salt-imbued are self-explanatory riders; the three "Special"
   weapons need their own rules text, same shape as
   MASTERY_PROPERTY_TEXT below but keyed by weapon id. */
export const SINA_UNA_PROPERTY_TEXT = {
  HP: "A weapon with this property has a length of cord attached to its end. After making a ranged attack with a harpoon, you can use your bonus action to pull the cord and retrieve it, bringing the weapon back to you.",
  SI: "This weapon acts as if it is permanently coated in salt.",
};
export const SINA_UNA_SPECIAL_TEXT = {
  bangkaw: "The head of this spear can be removed and used independently. When wielded this way, the spearhead functions as a simple melee weapon with the finesse and light properties, and on a hit, it deals 1d6 piercing damage.",
  bunang: "Opposite the blade of this axe is a sharp metal point. When you use your action to make an attack with a bunang, you can use your bonus action to make one additional melee weapon attack using this pointed side. On a hit, it deals 1d6 piercing damage. You do not add your ability score modifier to the damage dealt by this bonus action attack.",
  sumpit: "Larger than an average blowgun, the barrel of a sumpit has a sharp blade affixed to it, allowing the sumpit to be used in melee combat once ammunition has run out. When used in this way, the sumpit is a martial melee weapon with the finesse property, and on a hit, it deals 1d6 piercing damage.",
};

/* ------------------------------------------------------------------
   Weapon Mastery — a 2024 (Player's Handbook, XPHB) mechanic, not part
   of Sina Una's 2014 chassis. It's wired in as an explicit opt-in
   toggle (off by default) purely for the Notes column of the Actions
   attack table: turning it on adds an informational tag naming each
   weapon's mastery property and what it does. It never feeds AC,
   attack bonus, damage, or any other derived stat, and no class in
   this app grants "you know N mastery properties" — every carried
   weapon just shows its property when the toggle is on. See CLAUDE.md.

   Source: 5etools-src/data/items-base.json (XPHB baseitem entries —
   mastery only exists on the 2024 side) for the weapon → property map,
   and 5etools-src/data/generated/gendata-variantrules.json ("Weapon
   Mastery Properties", p.214) for the property → effect text.
------------------------------------------------------------------- */
export const WEAPON_MASTERY_2024 = {
  battleaxe: "Topple", blowgun: "Vex", club: "Slow", dagger: "Nick", dart: "Vex",
  flail: "Sap", glaive: "Graze", greataxe: "Cleave", greatclub: "Push",
  greatsword: "Graze", halberd: "Cleave", "hand-crossbow": "Vex", handaxe: "Vex",
  "heavy-crossbow": "Push", javelin: "Slow", lance: "Topple", "light-crossbow": "Slow",
  "light-hammer": "Nick", longbow: "Slow", longsword: "Sap", mace: "Sap",
  maul: "Topple", morningstar: "Sap", net: null, pike: "Push", quarterstaff: "Topple",
  rapier: "Vex", scimitar: "Nick", shortbow: "Vex", shortsword: "Vex", sickle: "Nick",
  sling: "Slow", spear: "Sap", trident: "Topple", "war-pick": "Sap", warhammer: "Push",
  whip: "Slow",
};

export const MASTERY_PROPERTY_TEXT = {
  Cleave: "If you hit with a melee attack using this weapon, you can make a melee attack roll with it against a second creature within 5 feet of the first that's also within your reach. On a hit, that creature takes the weapon's damage, but don't add your ability modifier unless it's negative. Once per turn.",
  Graze: "If your attack roll with this weapon misses, you can deal damage equal to the ability modifier you used to make the attack roll (same damage type as the weapon).",
  Nick: "You can make the extra attack from this Light weapon as part of the Attack action instead of as a bonus action. Once per turn.",
  Push: "If you hit a creature with this weapon, you can push it up to 10 feet straight away from you if it's Large or smaller.",
  Sap: "If you hit a creature with this weapon, it has disadvantage on its next attack roll before the start of your next turn.",
  Slow: "If you hit and deal damage with this weapon, you can reduce the target's speed by 10 feet until the start of your next turn (doesn't stack past 10 feet).",
  Topple: "If you hit a creature with this weapon, you can force a Constitution save (DC 8 + your ability modifier + proficiency bonus). On a failure, the creature is knocked prone.",
  Vex: "If you hit and deal damage with this weapon, you have advantage on your next attack roll against that creature before the end of your next turn.",
};
