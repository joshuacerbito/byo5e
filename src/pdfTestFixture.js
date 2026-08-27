/* Fixture used by the headless export check (scripts/check-exports.mjs).
   Not imported by the app. Hand-literal — not built from src/content/,
   since the point is to exercise the three sheet renderers' own field
   contract in isolation from the wizard that normally produces it. */

const scores = { str: 10, dex: 14, con: 14, int: 16, wis: 12, cha: 8 };

const spell = (name, level, over = {}) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name, level, school: "evocation", time: "1 action", range: "60 ft",
  components: "V, S", duration: "Instantaneous", ritual: false, concentration: false,
  atk: null, save: "dex", dmg: "3d6", dmgType: "fire", heal: null, cond: null,
  text: `${name} does something notable in combat.`, higherLevels: null, page: 241, source: "SRD",
  ...over,
});

export const FIXTURE = {
  ancestry: { name: "Elf" },
  klass: { name: "Wizard", hitDie: 6, subclassTitle: "Arcane Tradition" },
  level: 5,
  subclass: { name: "School of Evocation" },
  subclassReady: true,
  background: { name: "Sage" },
  name: "Fixture Test",
  resolved: { size: "Medium", darkvision: 60, blindsight: 0, languages: ["Common", "Elvish"],
    traits: [{ name: "Fey Ancestry", text: "You have advantage on saving throws against being charmed, and magic cannot put you to sleep." }],
    droppedTraits: [] },
  armorClass: 12, hitPoints: 32, speed: 30, initiative: 2, passivePerception: 11,
  passiveSkills: [{ name: "Perception", value: 11 }], pb: 3,
  armor: { id: "none", name: "None" }, shieldOn: true,
  savingThrows: [{ key: "str", label: "Strength", value: 0, proficient: false },
    { key: "int", label: "Intelligence", value: 6, proficient: true }],
  skillTable: ["Acrobatics", "Arcana", "Deception", "History", "Insight", "Investigation", "Medicine", "Nature", "Perception", "Stealth"]
    .map((n, i) => ({ name: n, ability: "int", value: i % 3, proficient: i % 2 === 0 })),
  casting: { label: "Wizard spellcasting", saveDC: 14, attack: 6, ability: "int",
    slots: [4, 3, 2], pact: null, prepared: 8, known: null, spellbook: 14, pending: false },
  chosenSpells: [spell("Fire Bolt", 0), spell("Magic Missile", 1, { atk: null, save: null, dmg: "3d4", dmgType: "force" }),
    spell("Fireball", 3, { save: "dex", higherLevels: "The damage increases by 1d6 for each slot level above 3rd." })],
  otherSpells: "",
  appendix: [
    { group: "Spells", name: "Fireball", text: "A bright streak flashes from your pointing finger to a point you choose." },
    { group: "Feats", name: "Alert", text: "Always on the lookout for danger, you gain the following benefits." },
    { group: "Feats", name: "Telekinetic (+1 INT)", text: "You learn the mage hand cantrip." },
  ],
  bgChoice: null,
  finalScore: (k) => scores[k],
  attackRows: [{ key: "quarterstaff", name: "Quarterstaff", proficient: true, range: "5 ft",
    hitOrDC: "+3", damage: "1d6", dmgType: "bludgeoning", notes: "Versatile — 1d8 two-handed" }],
  masteryEnabled: true,
  classFeatures: [
    { level: 1, name: "Spellcasting", text: "You have a spellbook containing spells." },
    { level: 2, name: "Arcane Tradition", text: "You join a school of magic." },
  ],
  chosenFeats: [
    { id: "alert", feat: { id: "alert", name: "Alert", text: "Always on the lookout for danger, you gain the following benefits." }, from: "Variant Human", bonus: null },
    { id: "telekinetic", feat: { id: "telekinetic", name: "Telekinetic", text: "You learn the mage hand cantrip." }, from: "Level 4", bonus: "+1 INT" },
  ],
  carriedWeapons: [{ id: "quarterstaff", name: "Quarterstaff" }, { id: "quarterstaff", name: "Quarterstaff" }],
  actions: [{ action: "action", name: "Dash", source: "Wizard", section: "Wizard features", text: "Move up to your speed." }],
  ancestrySpells: [spell("Druidcraft", 0, { key: "spirit-of-nature-druidcraft", from: "Spirit of Nature", use: "at will", ability: null, saveDC: null, attack: null }),
    spell("Entangle", 1, { key: "spirit-of-nature-entangle", from: "Spirit of Nature", use: "1/long rest", ability: null, saveDC: null, attack: null })],
  currency: { cp: 0, sp: 0, gp: 25, pp: 0 },
  gearList: ["Scholar's pack", "Ink pen"],
  toolsList: ["Calligrapher's supplies"],
  backstory: "Raised in the Feywild, came to the material plane to study at a college of magic.",
};
