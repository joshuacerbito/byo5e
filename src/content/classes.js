/* ------------------------------------------------------------------
   ClassView + SubclassView.

   Everything a class knows about itself, with no pipe strings and no
   {@tag} left in it. The interesting normalisations:

   subclassLevel — read off the `gainSubclassFeature: true` entry in
     classFeatures[], NOT off a subclass record. Subclass records carry
     a level per feature, not a "you pick me here" level, and in 2024
     every class picks at 3 while in 2014 it ranges 1-3.

   asiLevels — read off the class's OWN feature list, by feature name.
     2024 ALSO ships an "Ability Score Improvement" record in `feats`
     (category "G"); reading the class list means that never double
     counts.

   casting.preparedByLevel — the two editions disagree in kind, not
     degree. 2014 gives a formula string ("<$level$> + <$int_mod$>");
     2024 gives a flat 20-entry array. Both normalise to something the
     rules layer can evaluate: an array, or
     { kind:"formula", base:"level"|"halfLevel", ability:"int", round }.

   casting.pactSlots — the warlock has no `rowsSpellProgression` at all.
     Its slots live in the ordinary class table under "Spell Slots" and
     "Slot Level" columns, and in 2014 the slot-level cell is a
     {@filter 1st|...} tag while in 2024 it is a bare number.
------------------------------------------------------------------- */
import { stripTags } from "./entries.js";
import { idMinter, slugify } from "./ids.js";
import { toFeature } from "./features.js";
import { unwrapClassFeatureEntry, unwrapSubclassFeatureEntry, parseClassFeatureRef } from "./refs.js";
import { normArmorProf, normWeaponProf, normClassTools, normSkills } from "./prof.js";
import { normClassEquipment } from "./equipment.js";
import { normAdditionalSpells } from "./additionalSpells.js";

const LEVELS = 20;
const blank = () => Array.from({ length: LEVELS }, () => 0);

const PROGRESSION = { full: "full", "1/2": "half", "1/3": "third", pact: "pact", artificer: "artificer" };

/* "<$level$> + <$int_mod$>" / "<$level$> / 2 + <$cha_mod$>" */
function parsePreparedFormula(s) {
  const ability = /<\$(\w{3})_mod\$>/.exec(s)?.[1] ?? null;
  const halved = /<\$level\$>\s*\/\s*2/.test(s);
  return { kind: "formula", base: halved ? "halfLevel" : "level", ability, round: halved ? "down" : null, source: s };
}

function slotsFromTable(groups) {
  const g = (groups || []).find((x) => x.rowsSpellProgression);
  if (!g) return null;
  return g.rowsSpellProgression.map((r) => r.slice());
}

/* Column index by stripped label, for the pact table. */
const colIndex = (labels, want) =>
  (labels || []).findIndex((l) => stripTags(l).toLowerCase() === want);

function pactFromTable(groups) {
  for (const g of groups || []) {
    const count = colIndex(g.colLabels, "spell slots");
    const lvl = colIndex(g.colLabels, "slot level");
    if (count < 0 || lvl < 0) continue;
    return (g.rows || []).map((row) => {
      const raw = row[lvl];
      const n = typeof raw === "number" ? raw : parseInt(stripTags(String(raw)), 10);
      return { count: Number(row[count]) || 0, level: Number.isFinite(n) ? n : 0 };
    });
  }
  return null;
}

/* 2024-only: how many weapons a class can have mastered, by level — a
   flat class-table column (not a classFeature record; see the header
   note on asiLevels for why that distinction matters here too). Absent
   entirely from 2014 data and from classes that never get the feature,
   so callers treat a null return as "this class has no weapon mastery",
   not "mastery count is zero". */
function weaponMasteryFromTable(groups) {
  for (const g of groups || []) {
    const idx = colIndex(g.colLabels, "weapon mastery");
    if (idx < 0) continue;
    return (g.rows || []).map((row) => {
      const raw = row[idx];
      const n = typeof raw === "number" ? raw : parseInt(stripTags(String(raw)), 10);
      return Number.isFinite(n) ? n : 0;
    });
  }
  return null;
}

function buildCasting(cl) {
  const prog = cl.casterProgression ? (PROGRESSION[cl.casterProgression] || cl.casterProgression) : null;
  if (!prog && !cl.spellcastingAbility) return null;

  let preparedByLevel = null;
  if (Array.isArray(cl.preparedSpellsProgression)) preparedByLevel = cl.preparedSpellsProgression.slice();
  else if (typeof cl.preparedSpells === "string") preparedByLevel = parsePreparedFormula(cl.preparedSpells);

  const spellbook = Array.isArray(cl.spellsKnownProgressionFixed);
  const prepares = spellbook ? "spellbook" : (preparedByLevel ? "prepared" : "known");

  return {
    progression: prog,
    /* 5etools files the 2024 paladin/ranger under "artificer", its code
       for a half caster that gets slots from level 1. Kept as found —
       `slotsByLevel` is the authority either way. */
    progressionRaw: cl.casterProgression ?? null,
    ability: cl.spellcastingAbility ?? null,
    prepares,
    preparedChange: cl.preparedSpellsChange ?? null,
    cantripsByLevel: cl.cantripProgression ? cl.cantripProgression.slice() : null,
    spellsKnownByLevel: cl.spellsKnownProgression ? cl.spellsKnownProgression.slice() : null,
    spellbookGainByLevel: spellbook ? cl.spellsKnownProgressionFixed.slice() : null,
    spellbookAllowsLowerLevel: !!cl.spellsKnownProgressionFixedAllowLowerLevel,
    preparedByLevel,
    slotsByLevel: slotsFromTable(cl.classTableGroups) || (prog === "pact" ? null : blank().map(() => Array(9).fill(0))),
    pactSlots: prog === "pact" ? pactFromTable(cl.classTableGroups) : null,
  };
}

/* Class table columns that aren't spell slots — Rages, Sneak Attack,
   Ki Points, Invocations Known. Kept as data so a level-by-level table
   can be rendered without re-reading the raw pack. */
function classTables(groups) {
  return (groups || []).map((g) => ({
    title: g.title ? stripTags(g.title) : null,
    colLabels: (g.colLabels || []).map(stripTags),
    rows: (g.rows || []).map((r) => r.map((c) => (typeof c === "number" ? c : stripTags(String(c))))),
    isSpellSlots: !!g.rowsSpellProgression,
  }));
}

/* multiclassing — { requirements, proficienciesGained }.

   requirements is bare ability-score minimums ({ str: 13 } or
   { or: [{ str: 13, dex: 13 }] }) in every class in both SRDs — no
   strings, nothing to strip.

   proficienciesGained.armor/weapons/tools/skills are the exact shapes
   startingProficiencies carries (mixed bare-category strings, {@item}
   tag strings, { proficiency, full } objects, choose blocks) — reuse
   the same normalisers so a multiclass tool grant like "Choose one
   {@item Musical Instrument|XPHB}" is stripped the same way the class's
   own starting tools are, and toolProficiencies (structured) is
   preferred over tools (prose) the same way too. */
function normMulticlassing(mc) {
  if (!mc) return null;
  const pg = mc.proficienciesGained || {};
  return {
    requirements: mc.requirements ?? null,
    proficienciesGained: {
      armor: normArmorProf(pg.armor),
      weapons: normWeaponProf(pg.weapons),
      tools: normClassTools(pg),
      skills: normSkills(pg.skills),
    },
  };
}

/* `p.progression` arrives two ways: an object keyed by the literal level
   ("3": 2 — Sorcerer's Metamagic), or a bare 20-entry array (Warlock's
   Eldritch Invocations) where the level is the 1-based POSITION, not the
   array index. Object.entries on an array yields 0-based indices, so
   without the +1 below every array-form table read one level low —
   Eldritch Invocations would report 2 known at 1st level instead of 2nd. */
function progressionBlock(arr, key) {
  return (arr || []).map((p) => {
    const isArray = Array.isArray(p.progression);
    return {
      name: p.name ?? null,
      [key]: (p.featureType || p.category || []).slice(),
      byLevel: Object.fromEntries(Object.entries(p.progression || {})
        .map(([k, v]) => [Number(k) + (isArray ? 1 : 0), v])),
    };
  });
}

function buildSubclass(sc, reg, classId, optionIdOf) {
  const scId = `${classId}-${slugify(sc.shortName || sc.name)}`;
  const from = `subclass ${sc.name} (${sc.className})`;
  const features = [];
  for (const e of sc.subclassFeatures || []) {
    const { ref } = unwrapSubclassFeatureEntry(e);
    const rec = reg.resolveRef("subclassFeature", ref, from);
    if (!rec) continue;
    features.push(toFeature(rec, reg, { idPrefix: scId, from, optionIdOf }));
  }
  features.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  return {
    kind: "subclass",
    id: scId,
    name: sc.name,
    shortName: sc.shortName ?? sc.name,
    classId,
    className: sc.className,
    source: sc.source,
    page: sc.page ?? null,
    features,
    additionalSpells: normAdditionalSpells(sc.additionalSpells),
    optionProgression: progressionBlock(sc.optionalfeatureProgression, "types"),
  };
}

export function buildClasses(reg, optionIdOf) {
  const mint = idMinter();
  const subsByClass = new Map();
  for (const sc of reg.content.subclasses || []) {
    const k = String(sc.className).toLowerCase();
    if (!subsByClass.has(k)) subsByClass.set(k, []);
    subsByClass.get(k).push(sc);
  }

  return (reg.content.classes || []).map((cl) => {
    const id = mint(cl.name, cl.source);
    const from = `class ${cl.name}`;
    const sp = cl.startingProficiencies || {};

    const features = [];
    const subclassLevels = [];
    for (const e of cl.classFeatures || []) {
      const { ref, gainSubclassFeature } = unwrapClassFeatureEntry(e);
      const parsed = parseClassFeatureRef(ref);
      if (gainSubclassFeature) subclassLevels.push(Number(parsed.level));
      const rec = reg.resolveRef("classFeature", ref, from);
      if (!rec) continue;
      features.push(toFeature(rec, reg, {
        idPrefix: id,
        from,
        optionIdOf,
        /* A feature whose own source differs from the class's book is a
           later book's optional add-on (Tasha's, bolted onto a Handbook
           class). None of those are in the SRD, so in practice these
           are exactly the refs that dangle. */
        optional: parsed.source !== cl.source,
        gainsSubclassFeature: gainSubclassFeature,
      }));
    }
    features.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

    /* ASI levels off the class's own feature list — see header note. */
    const asiLevels = [...new Set(
      (cl.classFeatures || [])
        .map((e) => parseClassFeatureRef(unwrapClassFeatureEntry(e).ref))
        .filter((p) => /^ability score improvement$/i.test(p.name))
        .map((p) => Number(p.level)),
    )].sort((a, b) => a - b);

    const skills = normSkills(sp.skills);
    const skillChoice = skills.choices[0] || null;

    return {
      kind: "class",
      id,
      name: cl.name,
      source: cl.source,
      page: cl.page ?? null,
      hitDie: cl.hd ? cl.hd.faces : null,
      hitDice: cl.hd ? { number: cl.hd.number, faces: cl.hd.faces } : null,
      saves: (cl.proficiency || []).slice(),
      primaryAbility: (cl.primaryAbility || []).flatMap((o) => Object.keys(o)),
      /* Same source, kept un-flattened for display: 5etools' shape is an
         array of alternative groups (Fighter: [{str},{dex}] = STR OR DEX)
         where a group with more than one key means AND, not OR (Monk:
         [{dex,wis}] = DEX AND WIS, one group). primaryAbility above loses
         that distinction — fine for classAbilityPriority's "which
         abilities matter, in some order" use, wrong for "Strength or
         Dexterity" prose. */
      primaryAbilityGroups: (cl.primaryAbility || []).map((o) => Object.keys(o)),
      skillChoices: skillChoice
        ? { count: skillChoice.count, from: skillChoice.from, any: skillChoice.any }
        : { count: 0, from: [], any: null },
      skillsFixed: skills.fixed,
      armorProf: normArmorProf(sp.armor),
      weaponProf: normWeaponProf(sp.weapons),
      toolProf: normClassTools(sp),
      startingEquipment: normClassEquipment(cl.startingEquipment, reg, from),
      multiclassing: normMulticlassing(cl.multiclassing),
      subclassLevel: subclassLevels.length ? Math.min(...subclassLevels) : null,
      subclassFeatureLevels: [...new Set(subclassLevels)].sort((a, b) => a - b),
      subclassTitle: cl.subclassTitle ? stripTags(cl.subclassTitle) : null,
      asiLevels,
      features,
      weaponMasteryByLevel: weaponMasteryFromTable(cl.classTableGroups),
      tables: classTables(cl.classTableGroups),
      optionProgression: progressionBlock(cl.optionalfeatureProgression, "types"),
      featProgression: progressionBlock(cl.featProgression, "categories"),
      casting: buildCasting(cl),
      subclasses: (subsByClass.get(String(cl.name).toLowerCase()) || [])
        .map((sc) => buildSubclass(sc, reg, id, optionIdOf)),
    };
  });
}
