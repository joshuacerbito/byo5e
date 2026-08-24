/* Fixture used by the headless export check (scripts/check-exports.mjs).
   Not imported by the app. */
import { CLASSES, ARMOR } from "./data/classes.js";
import { BACKGROUNDS } from "./data/backgrounds.js";
import { PHB_SPELLS } from "./data/phbSpells.js";
import { WEAPONS } from "./data/weapons.js";

const scores = { str: 10, dex: 14, con: 14, int: 16, wis: 12, cha: 8 };

export const FIXTURE = {
  ancestry: { name: "Balete Elf" },
  klass: CLASSES.wizard,
  level: 5,
  subclass: { name: "Circle of Tides", group: "Druid Circle",
    features: [[1, "Tidecaller", "You can speak to water."], [3, "Undertow", "You drag a creature toward you."]] },
  subclassReady: true,
  background: BACKGROUNDS[0],
  name: "Bakunawa Test",
  resolved: { size: "Medium", darkvision: 60, blindsight: 0, languages: ["Common", "Elvish"],
    traits: [{ name: "Fey Ancestry", text: "You have advantage on saving throws against being charmed, and magic cannot put you to sleep." }],
    droppedTraits: [{ name: "Keen Senses" }] },
  armorClass: 12, hitPoints: 32, speed: 30, initiative: 2,
  passiveSkills: [{ name: "Perception", value: 11 }], pb: 3,
  armor: ARMOR[0], shieldOn: true,
  savingThrows: [{ label: "Strength", value: 0, proficient: false }, { label: "Intelligence", value: 6, proficient: true }],
  skillTable: ["Acrobatics", "Arcana", "Deception", "History", "Insight", "Investigation", "Medicine", "Nature", "Perception", "Stealth"]
    .map((n, i) => ({ name: n, ability: "int", value: i % 3, proficient: i % 2 === 0 })),
  casting: { label: "Wizard", saveDC: 14, attack: 6, ability: "int", slots: [4, 3, 2], prepared: 8, pending: false },
  chosenSpells: PHB_SPELLS.slice(0, 10).map((s) => ({ ...s, src: "phb" })),
  otherSpells: "",
  appendix: PHB_SPELLS.slice(0, 4).map((s) => ({ group: "Spells", name: s.name, text: s.text })),
  bgChoice: "",
  finalScore: (k) => scores[k],
  attackRows: [{ name: "Quarterstaff", proficient: true, range: "Melee 5 ft", hitOrDC: "+3", damage: "1d6", dmgType: "bludgeoning", notes: "versatile (1d8)" }],
  masteryEnabled: false,
  carriedWeapons: [WEAPONS[0], WEAPONS[0]],
  actions: [{ action: "action", name: "Dash", section: "Wizard features" }],
  /* Balete Elf's real grants, ability included — the book names none for this
     trait, so this also exercises the blank-DC branch of the table. */
  ancestrySpells: ["Druidcraft", "Entangle", "Barkskin"].map((n) => {
    const sp = PHB_SPELLS.find((x) => x.name === n);
    return { ...sp, key: `Spirit of Nature-${n}`, from: "Spirit of Nature",
      use: sp.level === 0 ? "at will" : "1/long rest", ability: null, saveDC: null, attack: null };
  }),
};
