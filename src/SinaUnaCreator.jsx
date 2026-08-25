import React, { useState, useMemo, useEffect } from "react";

import { BASE_RACES } from "./data/baseRaces.js";
import { LINEAGES, BASE_RACE_ORDER } from "./data/lineages.js";
import { CLASSES, ARMOR, ALL_SKILLS } from "./data/classes.js";
import { WEAPONS, PROPERTY_LABELS, DMG_TYPE_LABELS, WEAPON_MASTERY_2024, MASTERY_PROPERTY_TEXT } from "./data/weapons.js";
import { ALL_SUBCLASSES } from "./data/subclasses.js";
import { BACKGROUNDS } from "./data/backgrounds.js";
import { PHB_SPELLS, CLS_CODE } from "./data/phbSpells.js";
import { SCC_SPELLS } from "./data/sccSpells.js";
import { SPELLS, SPIRIT_TABLE, SPELL_LISTS } from "./data/islandSpells.js";
import {
  ABILITIES, POINT_COST, POINT_BUDGET, STANDARD_ARRAY,
  SKILL_ABILITY, SLOTS_FULL, SLOTS_HALF, PACT, CASTING,
} from "./data/progression.js";
import { SLOTS_THIRD, buildSteps, profBonus } from "./lib/steps.js";
import { mod, fmt, recommendedSpread, resolveLineage, splitCastingTime, ACTION_ORDER, ACTION_LABELS,
  attackBonus, isWeaponProficient, BASIC_ACTIONS, groupWeapons, parseStartingGold } from "./lib/derive.js";
import { buildSheetHTML } from "./lib/sheetHtml.js";
import { saveSheetPDF } from "./pdf/sheetPdf.js";
import { saveSheetRasterPDF } from "./pdf/sheetRaster.js";
import { STYLES } from "./styles.js";
import Rule from "./components/Rule.jsx";
import SpellTableRow from "./components/SpellTableRow.jsx";

/* Both non-island pools in one list. Strixhaven's five spells sit on the
   ordinary 2014 class lists, so they're offered wherever a class code
   matches — the app never needs to treat them as a separate pool, only
   to label where they came from (`src: "scc"`). */
const BOOK_SPELLS = [...PHB_SPELLS, ...SCC_SPELLS];

const STORAGE_KEY = "sina-una-character";

/* Read once per page load — this is a single-page app with no client routing,
   so a fresh parse per mount would never see a different value anyway. */
function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
const saved = loadSaved();

const DEFAULTS = {
  step: 0, baseId: null, lineageId: null, choicePicks: [], mode: "pointbuy",
  scores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }, arrayAssign: {},
  name: "", classId: null, level: 1, subclassId: null, curse: null, skillPicks: [],
  bgId: null, bgSkillPicks: [], bgChoice: null, armorId: "none", hasShield: false,
  equipmentChoices: {}, masteryEnabled: false, pickedSpells: [], otherSpells: "",
};

export default function SinaUnaCreator() {
  const [step, setStep] = useState(saved?.step ?? DEFAULTS.step);
  const [baseId, setBaseId] = useState(saved?.baseId ?? DEFAULTS.baseId);
  const [lineageId, setLineageId] = useState(saved?.lineageId ?? DEFAULTS.lineageId);
  const [choicePicks, setChoicePicks] = useState(saved?.choicePicks ?? DEFAULTS.choicePicks);
  const [mode, setMode] = useState(saved?.mode ?? DEFAULTS.mode);
  const [scores, setScores] = useState(saved?.scores ?? DEFAULTS.scores);
  const [arrayAssign, setArrayAssign] = useState(saved?.arrayAssign ?? DEFAULTS.arrayAssign);
  const [name, setName] = useState(saved?.name ?? DEFAULTS.name);
  const [classId, setClassId] = useState(saved?.classId ?? DEFAULTS.classId);
  const [level, setLevel] = useState(saved?.level ?? DEFAULTS.level);
  const [subclassId, setSubclassId] = useState(saved?.subclassId ?? DEFAULTS.subclassId);
  const [curse, setCurse] = useState(saved?.curse ?? DEFAULTS.curse);
  const [skillPicks, setSkillPicks] = useState(saved?.skillPicks ?? DEFAULTS.skillPicks);
  const [bgId, setBgId] = useState(saved?.bgId ?? DEFAULTS.bgId);
  const [bgSkillPicks, setBgSkillPicks] = useState(saved?.bgSkillPicks ?? DEFAULTS.bgSkillPicks);
  const [bgChoice, setBgChoice] = useState(saved?.bgChoice ?? DEFAULTS.bgChoice);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const ancestry = LINEAGES.find((a) => a.id === lineageId) || null;
  const baseRace = baseId ? BASE_RACES[baseId] : null;
  const baseLineages = LINEAGES.filter((l) => l.base === baseId);
  const resolved = useMemo(() => resolveLineage(ancestry, choicePicks), [ancestry, choicePicks]);

  const spent = useMemo(
    () => Object.values(scores).reduce((s, v) => s + (POINT_COST[v] ?? 0), 0),
    [scores]
  );
  const remaining = POINT_BUDGET - spent;

  const baseScoreFor = (k) =>
    mode === "pointbuy" ? scores[k] : (arrayAssign[k] ?? 8);

  const finalScore = (k) => baseScoreFor(k) + (resolved?.asi[k] || 0);

  const needsChoice = !!ancestry?.asi.choice;
  const choiceCount = ancestry?.asi.choice?.count ?? 0;
  const choiceMade = !needsChoice || choicePicks.length === choiceCount;

  const toggleChoice = (k) => {
    setChoicePicks((p) => p.includes(k) ? p.filter((x) => x !== k)
      : p.length < choiceCount ? [...p, k] : p);
  };

  const pickBase = (id) => { setBaseId(id); setLineageId(null); setChoicePicks([]); };
  const pickLineage = (id) => { setLineageId(id); setChoicePicks([]); };

  const canAdvance = () => {
    if (here === "Ancestry") return !!baseId && !!ancestry && choiceMade;
    if (here === "Abilities") return mode === "pointbuy" ? true : Object.keys(arrayAssign).length === 6;
    if (here === "Class") {
      if (!klass) return false;
      if (skillPicks.length !== klass.skillCount) return false;
      if (subclassReady && !subclass) return false;
      if (subclass?.choice && level >= subclass.choice.atLevel && !curse) return false;
      return true;
    }
    if (here === "Background") {
      if (!background) return false;
      if (background.skills.choose && bgSkillPicks.length !== background.skills.choose
          && bgPool.length >= background.skills.choose) return false;
      if (background.choice && !bgChoice) return false;
      return true;
    }
    return true;
  };

  const setScore = (k, v) => {
    if (v < 8 || v > 15) return;
    const next = { ...scores, [k]: v };
    const cost = Object.values(next).reduce((s, x) => s + (POINT_COST[x] ?? 0), 0);
    if (cost > POINT_BUDGET) return;
    setScores(next);
  };

  const assignArray = (k, val) => {
    const next = { ...arrayAssign };
    for (const key of Object.keys(next)) if (next[key] === val) delete next[key];
    if (val === "") delete next[k]; else next[k] = Number(val);
    setArrayAssign(next);
  };

  const klass = classId ? CLASSES[classId] : null;
  const subclass = ALL_SUBCLASSES.find((s) => s.id === subclassId) || null;
  const classSubclasses = ALL_SUBCLASSES.filter((s) => s.cls === classId);
  /* 2014 rules: subclass unlocks at different levels per class. */
  const subclassReady = klass && classSubclasses.length > 0 && level >= classSubclasses[0].unlock;
  const subclassUnlock = classSubclasses[0]?.unlock ?? 1;

  /* Skills you already have for free — from ancestry, and from a subclass
     that grants one. These are removed from the class skill list entirely. */
  const freeSkills = useMemo(() => {
    const s = new Set(resolved?.skills || []);
    if (subclass?.grants?.skills && subclassReady) subclass.grants.skills.forEach((x) => s.add(x));
    if (subclass && subclassReady) {
      (subclass.effects || [])
        .filter((e) => e.type === "skillProf" && level >= (e.atLevel ?? subclass.unlock))
        .forEach((e) => e.value.forEach((x) => s.add(x)));
    }
    return s;
  }, [resolved, subclass, subclassReady, level]);

  const skillPool = useMemo(() => {
    if (!klass) return [];
    const base = klass.skills === "any" ? ALL_SKILLS : klass.skills;
    return base.filter((s) => !freeSkills.has(s));
  }, [klass, freeSkills]);

  const skillsLeft = klass ? klass.skillCount - skillPicks.length : 0;

  const toggleSkill = (s) => {
    setSkillPicks((p) => p.includes(s) ? p.filter((x) => x !== s)
      : p.length < klass.skillCount ? [...p, s] : p);
  };

  const pickClass = (id) => {
    setClassId(id);
    setSubclassId(null);
    setCurse(null);
    setSkillPicks([]);
    setArmorId("none");
    setHasShield(false);
    setEquipmentChoices({});
    setPickedSpells([]);
    setOtherSpells("");
  };

  const background = BACKGROUNDS.find((b) => b.id === bgId) || null;

  /* Skills already locked in before the background is applied. */
  const priorSkills = useMemo(
    () => new Set([...freeSkills, ...skillPicks]),
    [freeSkills, skillPicks]
  );

  /* For "choose N from" backgrounds, drop anything already held. */
  const bgPool = useMemo(() => {
    if (!background?.skills.choose) return [];
    return background.skills.from.filter((s) => !priorSkills.has(s));
  }, [background, priorSkills]);

  /* Fixed-skill backgrounds can collide with class picks. 2014 has no
     official swap rule, so surface it rather than silently wasting it. */
  const bgOverlap = useMemo(() => {
    if (!background?.skills.fixed) return [];
    return background.skills.fixed.filter((s) => priorSkills.has(s));
  }, [background, priorSkills]);

  const bgSkills = background
    ? (background.skills.fixed || bgSkillPicks)
    : [];

  const bgSkillsLeft = background?.skills.choose
    ? background.skills.choose - bgSkillPicks.length
    : 0;

  const toggleBgSkill = (s) => {
    const max = background.skills.choose;
    setBgSkillPicks((p) => p.includes(s) ? p.filter((x) => x !== s)
      : p.length < max ? [...p, s] : p);
  };

  const pickBackground = (id) => {
    setBgId(id);
    setBgSkillPicks([]);
    setBgChoice(null);
  };

  const [armorId, setArmorId] = useState(saved?.armorId ?? DEFAULTS.armorId);
  const [hasShield, setHasShield] = useState(saved?.hasShield ?? DEFAULTS.hasShield);
  const [equipmentChoices, setEquipmentChoices] = useState(saved?.equipmentChoices ?? DEFAULTS.equipmentChoices);
  const [masteryEnabled, setMasteryEnabled] = useState(saved?.masteryEnabled ?? DEFAULTS.masteryEnabled);
  const [pickedSpells, setPickedSpells] = useState(saved?.pickedSpells ?? DEFAULTS.pickedSpells);
  const [otherSpells, setOtherSpells] = useState(saved?.otherSpells ?? DEFAULTS.otherSpells);

  /* Persist the whole character to localStorage on every change. */
  useEffect(() => {
    const snapshot = {
      step, baseId, lineageId, choicePicks, mode, scores, arrayAssign, name,
      classId, level, subclassId, curse, skillPicks, bgId, bgSkillPicks, bgChoice,
      armorId, hasShield, equipmentChoices, masteryEnabled, pickedSpells, otherSpells,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      /* storage full or unavailable — silently skip, nothing else depends on it */
    }
  }, [step, baseId, lineageId, choicePicks, mode, scores, arrayAssign, name,
      classId, level, subclassId, curse, skillPicks, bgId, bgSkillPicks, bgChoice,
      armorId, hasShield, equipmentChoices, masteryEnabled, pickedSpells, otherSpells]);

  /* Wipes the saved character and every field back to its default, then
     returns to the first step. */
  const resetAll = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setStep(DEFAULTS.step);
    setBaseId(DEFAULTS.baseId);
    setLineageId(DEFAULTS.lineageId);
    setChoicePicks(DEFAULTS.choicePicks);
    setMode(DEFAULTS.mode);
    setScores(DEFAULTS.scores);
    setArrayAssign(DEFAULTS.arrayAssign);
    setName(DEFAULTS.name);
    setClassId(DEFAULTS.classId);
    setLevel(DEFAULTS.level);
    setSubclassId(DEFAULTS.subclassId);
    setCurse(DEFAULTS.curse);
    setSkillPicks(DEFAULTS.skillPicks);
    setBgId(DEFAULTS.bgId);
    setBgSkillPicks(DEFAULTS.bgSkillPicks);
    setBgChoice(DEFAULTS.bgChoice);
    setArmorId(DEFAULTS.armorId);
    setHasShield(DEFAULTS.hasShield);
    setEquipmentChoices(DEFAULTS.equipmentChoices);
    setMasteryEnabled(DEFAULTS.masteryEnabled);
    setPickedSpells(DEFAULTS.pickedSpells);
    setOtherSpells(DEFAULTS.otherSpells);
    setShowResetConfirm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Effects currently in play, given the character's level. Lineage effects
     are in here too: they default to atLevel 1, where a subclass effect
     defaults to the level its subclass unlocks at. Leaving them out was
     silently dropping Hill Dwarf's +1 HP a level and Mountain Dwarf's
     medium-armour proficiency, both of which only ever existed as effects. */
  const effects = useMemo(() => {
    const lineage = (resolved?.effects || []).filter((e) => level >= (e.atLevel ?? 1));
    if (!subclass || !subclassReady) return lineage;
    return [...lineage,
      ...(subclass.effects || []).filter((e) => level >= (e.atLevel ?? subclass.unlock))];
  }, [resolved, subclass, subclassReady, level]);

  const fx = (type) => effects.filter((e) => e.type === type);

  const pb = profBonus(level);

  /* Armor you're actually proficient with. Druids avoid metal. */
  const armorOptions = useMemo(() => {
    if (!klass) return [ARMOR[0]];
    const granted = fx("armorProf").flatMap((e) => e.value);
    const prof = new Set([...klass.armorProf, ...granted]);
    return ARMOR.filter((a) => {
      if (a.cat === "none") return true;
      if (!prof.has(a.cat)) return false;
      if (klass.noMetal && a.metal) return false;
      return true;
    });
  }, [klass, effects]);

  const armor = armorOptions.find((a) => a.id === armorId) || ARMOR[0];
  const shieldAllowed = !!klass?.shield;
  const shieldOn = shieldAllowed && hasShield;

  /* Every AC formula that could apply, so we can show the reasoning
     rather than just a number. Highest wins, as per 5e. */
  const acCandidates = useMemo(() => {
    if (!resolved) return [];
    const dex = mod(finalScore("dex"));
    const out = [];

    if (armor.id === "none") {
      out.push({ label: "Unarmored", parts: `10 + ${fmt(dex)} Dex`, value: 10 + dex });
    } else {
      const capped = armor.maxDex === null ? dex : Math.min(dex, armor.maxDex);
      out.push({
        label: armor.name,
        parts: `${armor.base}${capped ? ` + ${fmt(capped)} Dex` : ""}` +
          (armor.maxDex !== null && dex > armor.maxDex ? ` · Dex capped at +${armor.maxDex}` : ""),
        value: armor.base + capped,
      });
    }

    /* Class unarmored defenses — only with no armor worn. */
    if (klass?.unarmored && armor.id === "none") {
      const add = mod(finalScore(klass.unarmored.add));
      if (!(klass.unarmored.noShield && shieldOn)) {
        out.push({
          label: `${klass.name} Unarmored Defense`,
          parts: `10 + ${fmt(dex)} Dex + ${fmt(add)} ${klass.unarmored.add.toUpperCase()}`,
          value: 10 + dex + add,
        });
      }
    }

    /* Any subclass AC formula, read from the effects layer. */
    for (const e of fx("acFormula")) {
      if (e.condition === "unarmored" && armor.id !== "none") continue;
      const adds = e.add.map((k) => mod(finalScore(k)));
      out.push({
        label: e.label,
        parts: `${e.base}${e.add.map((k, i) => ` + ${fmt(adds[i])} ${k.toUpperCase()}`).join("")}`,
        value: e.base + adds.reduce((a, b) => a + b, 0),
      });
    }
    return out;
  }, [resolved, armor, klass, subclass, subclassReady, level, shieldOn, effects, scores, arrayAssign, mode]);

  const bestAC = acCandidates.reduce((a, b) => (b.value > a.value ? b : a), acCandidates[0] || { value: 10 });
  const armorClass = (bestAC?.value ?? 10) + (shieldOn ? 2 : 0);

  /* Heavy armor below its Strength requirement costs 10 feet of speed. */
  const strShortfall = armor.strReq && resolved && finalScore("str") < armor.strReq ? armor.strReq : null;
  const speed = resolved ? resolved.speed - (strShortfall ? 10 : 0) : 0;

  /* Starting-weapon choice groups, straight off the class chassis. Each
     group is an array of options; an option is either a fixed weapon
     (`weapon`), an open pick from a category (`filter`, resolved to a
     concrete weapon via a second click), or a non-weapon package
     (`special`) that may still carry its own fixed `weapon`. */
  const weaponChoiceGroups = klass?.startingEquipment?.weaponChoices || [];

  const carriedWeapons = useMemo(() => {
    const out = [];
    const add = (id, qty) => {
      const w = WEAPONS.find((x) => x.id === id);
      if (w) for (let i = 0; i < (qty || 1); i++) out.push(w);
    };
    weaponChoiceGroups.forEach((group, gi) => {
      const choice = equipmentChoices[gi];
      if (choice == null) return;
      const opt = group[choice.optIdx];
      if (!opt) return;
      if (opt.weapon) add(opt.weapon, opt.qty);
      else if (opt.filter && choice.weaponId) add(choice.weaponId, opt.qty);
    });
    (klass?.startingEquipment?.fixedWeapons || []).forEach((fw) => add(fw.weapon, fw.qty));
    return out;
  }, [klass, weaponChoiceGroups, equipmentChoices]);

  const groupedWeapons = useMemo(() => groupWeapons(carriedWeapons), [carriedWeapons]);
  const startingGold = useMemo(() => parseStartingGold(background), [background]);

  /* Attack table: proficiency (klass.weaponProf) drives whether pb
     applies; finesse/ranged weapons use the better of Str/Dex. Unarmed
     Strike (1 + Str mod, 2014 rule — not the 2024 d4) is always listed. */
  const attackRows = useMemo(() => {
    if (!resolved || !klass) return [];
    const str = mod(finalScore("str"));
    const dex = mod(finalScore("dex"));
    const rows = [];
    carriedWeapons.forEach((w, i) => {
      const proficient = isWeaponProficient(w, klass.weaponProf);
      const finesse = w.properties.includes("F");
      const ranged = w.kind === "ranged";
      const abilityMod = finesse ? Math.max(str, dex) : ranged ? dex : str;
      const atk = attackBonus(pb, abilityMod, proficient);
      const notes = w.properties.map((p) => PROPERTY_LABELS[p] || p);
      if (w.dmg2) notes.push(`Versatile — ${w.dmg2}${fmt(abilityMod)} two-handed`);
      if (masteryEnabled && WEAPON_MASTERY_2024[w.id]) notes.push(`Mastery: ${WEAPON_MASTERY_2024[w.id]}`);
      rows.push({
        key: `${w.id}-${i}`, name: w.name, range: w.range ? w.range.replace("/", " / ") + " ft" : (ranged ? "—" : "5 ft"),
        hitOrDC: fmt(atk),
        damage: w.dmg1 ? `${w.dmg1}${fmt(abilityMod)}` : "—",
        dmgType: w.dmgType ? DMG_TYPE_LABELS[w.dmgType] : null,
        notes: notes.join(", "), proficient,
      });
    });
    rows.push({
      key: "unarmed", name: "Unarmed Strike", range: "5 ft",
      hitOrDC: fmt(attackBonus(pb, str, true)),
      damage: `${1 + str}`, dmgType: "bludgeoning", notes: "", proficient: true,
    });
    return rows;
  }, [resolved, klass, carriedWeapons, pb, masteryEnabled, scores, arrayAssign, mode]);

  /* Spells granted by ancestry, not chosen on the Spells step — Blessing of
     Haliya's rituals, Drow Magic, Infernal Legacy and the rest. They hang off
     the trait that grants them (`spells` + `ability`), so a variant that
     replaces the trait drops its spells with it, and they show up whether or
     not the class casts at all. Full stats are looked up by name in the
     ordinary spell data, so these rows carry the same Time/Range/Hit-DC/Effect
     columns as everything else. */
  const ancestrySpells = useMemo(() => {
    if (!resolved) return [];
    const rows = [];
    for (const t of resolved.traits) {
      for (const g of t.spells || []) {
        if (level < (g.atLevel ?? 1)) continue;
        const sp = BOOK_SPELLS.find((x) => x.name === g.name) || SPELLS.find((x) => x.name === g.name);
        if (!sp) continue;
        /* No ability means the book never named one for this trait — see the
           Balete Elf / Mangrove Halfling note in the docs. Without it there is
           no honest DC or attack bonus to print, so the column stays an em dash. */
        const abilityMod = t.ability ? mod(finalScore(t.ability)) : null;
        rows.push({
          ...sp,
          key: `${t.name}-${g.name}`,
          from: t.name,
          use: g.use,
          ability: t.ability || null,
          saveDC: abilityMod == null ? null : 8 + pb + abilityMod,
          attack: abilityMod == null ? null : pb + abilityMod,
        });
      }
    }
    return rows.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [resolved, level, pb, scores, arrayAssign, mode]);

  const allSkills = useMemo(
    () => [...new Set([...(resolved?.skills || []), ...skillPicks, ...bgSkills])].sort(),
    [resolved, skillPicks, bgSkills]
  );

  const savingThrows = useMemo(() => {
    if (!resolved) return [];
    return ABILITIES.map(({ key, label }) => {
      const proficient = !!klass?.saves.includes(label);
      return { key, label, proficient, value: mod(finalScore(key)) + (proficient ? pb : 0) };
    });
  }, [resolved, klass, pb, scores, arrayAssign, mode]);

  const initiative = resolved ? mod(finalScore("dex")) : 0;

  const skillTable = useMemo(() => {
    if (!resolved) return [];
    return Object.keys(SKILL_ABILITY).sort().map((s) => {
      const ab = SKILL_ABILITY[s];
      const proficient = allSkills.includes(s);
      return { name: s, ability: ab, proficient,
        value: mod(finalScore(ab)) + (proficient ? pb : 0) };
    });
  }, [resolved, allSkills, pb, scores, arrayAssign, mode]);

  /* The three passives a table actually leans on mid-scene. */
  const PASSIVE_SKILLS = ["Perception", "Investigation", "Insight"];
  const passiveSkills = PASSIVE_SKILLS.map((name) => ({
    name, value: 10 + (skillTable.find((s) => s.name === name)?.value ?? 0),
  }));
  const passivePerception = passiveSkills[0].value;

  /* Spellcasting can come from the class, from a subclass, or neither. */
  const casting = useMemo(() => {
    if (!resolved || !klass) return null;
    const subCast = fx("casting")[0] || null;
    const cls = CASTING[classId];
    if (!cls && !subCast) return null;

    /* Half casters have no spells at 1st level. */
    if (cls && cls.startsAt && level < cls.startsAt && !subCast) {
      return { pending: true, startsAt: cls.startsAt, label: klass.name };
    }

    const src = subCast || cls;
    const ability = src.ability;
    const abMod = mod(finalScore(ability));
    const dcBase = src.dcBase ?? 8;
    const saveDC = dcBase + pb + abMod;
    const attack = pb + abMod;

    const pick = (tbl) => {
      if (!tbl) return null;
      let v = null;
      for (const k of Object.keys(tbl).map(Number).sort((a, b) => a - b)) {
        if (level >= k) v = tbl[k];
      }
      return v;
    };

    const bonusCantrips = fx("bonusCantrips").reduce((a, e) => a + e.count, 0);
    const baseCantrips = pick(src.cantrips);

    const out = {
      label: src.label || `${klass.name} spellcasting`,
      ability, abMod, saveDC, attack, dcBase,
      cantrips: baseCantrips == null ? (bonusCantrips || null) : baseCantrips + bonusCantrips,
      bonusCantrips: bonusCantrips || null,
      cantripsFrom: src.from,
      note: src.note,
      known: pick(src.known),
      slots: null, pact: null, prepared: null, spellbook: null,
      thirdCaster: subCast?.progression === "third",
    };

    if (subCast?.progression === "third") {
      out.slots = SLOTS_THIRD[level] || [];
    } else if (cls && !subCast) {
      if (cls.type === "full") out.slots = SLOTS_FULL[level] || [];
      if (cls.type === "half") out.slots = SLOTS_HALF[level] || [];
      if (cls.type === "pact") out.pact = PACT[level];
      if (cls.prepFormula === "mod+level") out.prepared = Math.max(1, abMod + level);
      if (cls.prepFormula === "mod+halflevel") out.prepared = Math.max(1, abMod + Math.floor(level / 2));
      if (cls.spellbook) out.spellbook = 6 + (level - 1) * 2;
    }
    return out;
  }, [resolved, klass, classId, subclass, subclassReady, level, pb, effects, scores, arrayAssign, mode]);

  /* Sina Una spells this character can reach: on their list, and at or
     below the highest slot level they have. Cantrips always count. */
  const availableSpells = useMemo(() => {
    if (!casting || casting.pending) return null;
    const key = casting.cantripsFrom || classId;
    const maxLvl = casting.pact ? casting.pact.lvl : (casting.slots?.length || 0);

    /* Island spells with full detail. */
    const island = (SPELL_LISTS[key] || []).length
      ? SPELLS.filter((sp) => SPELL_LISTS[key].includes(sp.name) && (sp.level === 0 || sp.level <= maxLvl))
      : [];

    /* Handbook spells, then Strixhaven's — kept in separate lists so the
       picker can head each with the book it came from, the same way the
       island rows are headed. Both are filtered by the same class code. */
    const code = CLS_CODE[key];
    const byCode = (pool) => (code
      ? pool.filter((sp) => sp.cls.includes(code) && (sp.level === 0 || sp.level <= maxLvl))
      : []);
    const phb = byCode(PHB_SPELLS);
    const scc = byCode(SCC_SPELLS);

    return { key, maxLvl, rows: island, phb, scc, all: [...island, ...phb, ...scc] };
  }, [casting, classId]);

  const hasSpellStep = !!(casting && !casting.pending);
  const STEPS = useMemo(() => buildSteps(hasSpellStep), [hasSpellStep]);

  /* How many cantrips and how many spells this character gets. */
  const cantripBudget = casting?.cantrips ?? 0;
  const spellBudget = casting?.known ?? casting?.prepared ?? 0;

  const spellLevelOf = (n) =>
    (SPELLS.find((s) => s.name === n) || BOOK_SPELLS.find((s) => s.name === n))?.level ?? 0;
  const pickedCantrips = pickedSpells.filter((n) => spellLevelOf(n) === 0);
  const pickedLeveled = pickedSpells.filter((n) => spellLevelOf(n) > 0);

  const findSpell = (nm) =>
    SPELLS.find((x) => x.name === nm) || BOOK_SPELLS.find((x) => x.name === nm);

  const toggleSpell = (nm) => {
    const sp = findSpell(nm);
    if (!sp) return;
    const isCantrip = sp.level === 0;
    const budget = isCantrip ? cantripBudget : spellBudget;
    const current = isCantrip ? pickedCantrips : pickedLeveled;
    setPickedSpells((p) => {
      if (p.includes(nm)) return p.filter((x) => x !== nm);
      if (current.length >= budget) return p;
      return [...p, nm];
    });
  };

  /* Full records for whatever was picked, sorted for display. */
  const chosenSpells = useMemo(
    () => [...SPELLS, ...BOOK_SPELLS].filter((s) => pickedSpells.includes(s.name))
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
    [pickedSpells]
  );

  const here = STEPS[step] || STEPS[STEPS.length - 1];
  const at = (nm) => STEPS.indexOf(nm);

  /* Everything that needs a full write-up in the printed appendix. */
  const appendix = useMemo(() => {
    const out = [];
    /* Ancestry traits, class/subclass features, and Background are all
       already written out in full on the Sheet itself — not repeated
       here. Only what the Sheet doesn't already say in full goes in the
       Reference. */
    if (curse && subclass?.choice) {
      const o = subclass.choice.options.find((x) => x.id === curse);
      out.push({ group: "Subclass choice", name: subclass.choice.name,
        text: `${o.name} — ${o.sub}. ${subclass.choice.note}` });
    }
    const SPELL_GROUP = { phb: "Handbook spells", scc: "Strixhaven spells" };
    const spellEntry = (sp) => ({ group: SPELL_GROUP[sp.src] || "Island spells", name: sp.name,
      text: `${sp.level === 0 ? "Cantrip" : `Level ${sp.level}`} ${sp.school}. ` +
        `Casting time ${sp.time}. Range ${sp.range}. Components ${sp.comp}. Duration ${sp.dur}.` +
        `${sp.ritual ? " Ritual." : ""}${sp.conc ? " Concentration." : ""} ${sp.text}` +
        `${sp.higher ? ` At Higher Levels. ${sp.higher}` : ""}` });
    /* Island spells first, then Handbook, then Strixhaven. */
    for (const src of [undefined, "phb", "scc"])
      chosenSpells.filter((sp) => sp.src === src).forEach((sp) => out.push(spellEntry(sp)));
    /* Ancestry spells are never in chosenSpells — nobody picked them — so
       their text would otherwise be missing from the reference entirely. */
    ancestrySpells
      .filter((sp) => !chosenSpells.some((c) => c.name === sp.name))
      .forEach((sp) => out.push({ ...spellEntry(sp), group: "Ancestry spells" }));
    return out;
  }, [subclass, curse, chosenSpells, ancestrySpells]);

  /* Actions / Bonus Actions / Reactions granted by ancestry, class, and
     subclass — the mid-turn "what can I press" list, kept separate from
     the appendix since that's background reading and this isn't.
     Sourced from an explicit `action` tag on each feature/trait, not
     guessed from wording — most features are passive and carry none. */
  const actions = useMemo(() => {
    const out = [];
    if (resolved) {
      resolved.traits.forEach((t) => {
        if (t.action) out.push({ name: t.name, source: ancestry.name, action: t.action, text: t.text,
          section: `Ancestry traits — ${ancestry.name}` });
      });
    }
    if (klass) {
      (klass.features || []).filter((f) => f[0] <= level && f[3]).forEach((f) =>
        out.push({ name: f[1], source: klass.name, action: f[3], text: f[2],
          section: `${klass.name} features` }));
    }
    if (subclass && subclassReady) {
      subclass.features.filter((f) => f[0] <= level && f[3]).forEach((f) =>
        out.push({ name: f[1], source: subclass.name, action: f[3], text: f[2],
          section: `${subclass.name} — ${subclass.group}` }));
    }
    return out;
  }, [resolved, ancestry, klass, subclass, subclassReady, level]);

  const usedArrayVals = Object.values(arrayAssign);

  /* 2014: max hit die at 1st level, then average+1 per level after. */
  const hitPoints = useMemo(() => {
    if (!klass || !resolved) return 0;
    const conMod = mod(finalScore("con"));
    const perLevel = Math.floor(klass.hitDie / 2) + 1;
    const bonus = fx("hpPerLevel").reduce((a, e) => a + e.value, 0) * level;
    return klass.hitDie + conMod + (level - 1) * (perLevel + conMod) + bonus;
  }, [klass, resolved, level, effects, scores, arrayAssign, mode]);

  /* Artifacts run in a sandboxed iframe, so window.print() targets the
     host page rather than this sheet. Instead we build a standalone
     document and hand it over as a file the browser can print properly. */

  const sheetCtx = {
    ancestry, klass, level, subclass, subclassReady, background, name, resolved,
    armorClass, hitPoints, speed, initiative, passivePerception, passiveSkills, actions, pb, armor, shieldOn,
    savingThrows, skillTable, casting, chosenSpells, otherSpells, appendix, bgChoice,
    finalScore, attackRows, carriedWeapons, masteryEnabled, ancestrySpells,
  };

  const downloadSheet = () => {
    const blob = new Blob([buildSheetHTML(sheetCtx)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(name.trim() || "unnamed").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-sheet.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  /* Three ways out, because no single one works everywhere.

     printSheet() is the browser's own print pipeline — best output, and the
     right answer on Android, macOS and Windows, where the print dialog offers
     a Save as PDF destination.

     saveSheetRasterPDF() exists for iOS, where printing is a dead end: Safari
     renders the print preview and then blanks it, and there is no Save as PDF
     destination to choose anyway. It photographs the same HTML sheet into an
     A4 PDF, so what comes out matches the print output exactly.

     saveSheetPDF() draws the sheet a third time as vector text via pdfmake —
     a small, selectable, searchable file for anything the other two miss. */
  const [pdfState, setPdfState] = useState("idle"); // idle | working | error

  const runPdf = async (fn) => {
    setPdfState("working");
    try {
      await fn();
      setPdfState("idle");
    } catch (e) {
      console.error(e);
      setPdfState("error");
    }
  };

  const saveForIOS = () => runPdf(() => saveSheetRasterPDF(sheetCtx));
  const saveVector = () => runPdf(() => saveSheetPDF(sheetCtx));

  /* Runs as a real page now (not an artifact iframe), so window.print()
     works. Printing via a script-opened tab (window.open + document.write)
     is unreliable on iOS/iPadOS Safari — the print dialog often never
     appears there. A hidden same-page iframe prints reliably on iOS as
     well as desktop, so use that instead.

     The iframe copy is built with interactive:false, so the sheet's own
     "Print / Save as PDF" toolbar isn't in it: the OS dialog is the first
     and only thing the click produces. */
  const printSheet = () => {
    // Zero-size iframes get laid out at 0 width before mobile Safari's
    // print pipeline reflows them, squishing the sheet. Give it a real
    // A4 box — 210mm at 96dpi — parked off-screen, so what gets laid out
    // is the width it will actually print at.
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = "794px";
    iframe.style.height = "1123px";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const cleanup = () => { if (iframe.parentNode) document.body.removeChild(iframe); };
    iframe.onload = () => {
      iframe.contentWindow.addEventListener("afterprint", cleanup);
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // afterprint doesn't fire on iOS (Print goes through the share sheet,
      // not window.print's dialog), so also fall back to a generous timer.
      setTimeout(cleanup, 60000);
    };
    iframe.srcdoc = buildSheetHTML(sheetCtx, { interactive: false });
  };

  const sheetText = useMemo(() => {
    if (!resolved) return "";
    const L = [];
    const head = klass ? `${ancestry.name} ${klass.name} ${level}` : `${ancestry.name}`;
    L.push(`${name || "Unnamed"} — ${head}${background ? ` · ${background.name}` : ""}`);
    if (subclass && subclassReady) L.push(`${subclass.group}: ${subclass.name} (p.${subclass.page})`);
    L.push("");
    L.push(ABILITIES.map(({ key }) =>
      `${key.toUpperCase()} ${finalScore(key)} (${fmt(mod(finalScore(key)))})`).join("   "));
    L.push("");
    if (klass) {
      L.push(`Hit points ${hitPoints}   Hit die d${klass.hitDie}   Proficiency ${fmt(pb)}`);
      L.push(`AC ${armorClass} (${bestAC?.parts}${shieldOn ? " + 2 shield" : ""})   Initiative ${fmt(initiative)}`);
      L.push(passiveSkills.map((p) => `Passive ${p.name} ${p.value}`).join("   "));
      L.push("");
      L.push("SAVING THROWS");
      L.push(savingThrows.map((s) => `${s.label.slice(0, 3).toUpperCase()} ${fmt(s.value)}${s.proficient ? "*" : " "}`).join("   "));
      L.push("(* = proficient)");
    }
    L.push(`Speed ${speed}   Size ${resolved.size}` +
      (resolved.darkvision ? `   Darkvision ${resolved.darkvision}` : "") +
      (resolved.blindsight ? `   Blindsight ${resolved.blindsight}` : ""));
    L.push(`Languages: ${resolved.languages.join(", ")}`);
    const allSk = [...new Set([...freeSkills, ...skillPicks, ...bgSkills])].sort();
    if (allSk.length) L.push(`Skills: ${allSk.join(", ")}`);
    if (skillTable.length) {
      L.push("");
      L.push("SKILL MODIFIERS");
      const rows = skillTable.map((s) =>
        `${s.proficient ? "*" : " "}${s.name.padEnd(16)}${fmt(s.value)}`);
      for (let i = 0; i < rows.length; i += 2) {
        L.push(rows.slice(i, i + 2).join("   "));
      }
    }
    if (casting && !casting.pending) {
      L.push("");
      L.push(casting.label.toUpperCase());
      L.push(`Save DC ${casting.saveDC}   Attack ${fmt(casting.attack)}   Ability ${casting.ability.toUpperCase()}`);
      if (casting.cantrips != null) L.push(`Cantrips known ${casting.cantrips}`);
      if (casting.known != null) L.push(`Spells known ${casting.known}`);
      if (casting.prepared != null) L.push(`Spells prepared ${casting.prepared}`);
      if (casting.spellbook != null) L.push(`Spellbook holds ${casting.spellbook}`);
      if (casting.slots?.length) {
        L.push(`Slots: ${casting.slots.map((n, i) => `${i + 1}${["st", "nd", "rd"][i] || "th"} x${n}`).join("   ")}`);
      }
      if (casting.pact) L.push(`Pact Magic: ${casting.pact.n} slots at level ${casting.pact.lvl} (short rest)`);
    }
    if (availableSpells?.rows.length) {
      L.push("");
      L.push("ISLAND SPELLS AVAILABLE");
      [0, 1, 2, 3].forEach((lvl) => {
        const r = availableSpells.rows.filter((x) => x.level === lvl);
        if (r.length) L.push(`${lvl === 0 ? "Cantrips" : "Level " + lvl}: ${r.map((x) => x.name).join(", ")}`);
      });
    }
    if (background) {
      const tools = [...(background.tools || [])];
      if (tools.length) L.push(`Tools: ${tools.join(", ")}`);
    }
    if (curse && subclass?.choice) {
      const o = subclass.choice.options.find((x) => x.id === curse);
      L.push(`${subclass.choice.name}: ${o.name} (${o.sub})`);
    }
    if (bgChoice && background?.choice) L.push(`${background.choice.name}: ${bgChoice}`);
    L.push("");
    L.push("ANCESTRY TRAITS");
    resolved.traits.forEach((t) => L.push(`• ${t.name}`));
    if (subclass && subclassReady) {
      const now = subclass.features.filter((f) => f[0] <= level);
      if (now.length) {
        L.push("");
        L.push(`${subclass.name.toUpperCase()} FEATURES`);
        now.forEach((f) => L.push(`• ${f[1]}`));
      }
    }
    if (background) {
      L.push("");
      L.push("BACKGROUND");
      L.push(`• ${background.feature.name} — ${background.name}`);
      L.push("");
      L.push("STARTING EQUIPMENT");
      background.equipment.forEach((e) => L.push(`• ${e}`));
    }
    L.push("");
    L.push("Still to choose: weapons and gear.");
    return L.join("\n");
  }, [resolved, ancestry, name, scores, arrayAssign, mode, klass, level, subclass,
      subclassReady, skillPicks, freeSkills, curse, hitPoints, background, bgSkills, bgChoice,
      armorClass, bestAC, shieldOn, savingThrows, initiative, passiveSkills, speed, pb,
      skillTable, casting, availableSpells]);

  return (
    <div className="su-root">
      <style>{STYLES}</style>

      <div className="su-wrap">
        <p className="su-eyebrow">The Islands of Sina Una</p>
        <h1 className="su-h1">Make a character</h1>
        <p className="su-sub">{STEPS.length} steps. Only legal options are shown.</p>

        {/* batok chevron rail */}
        <div className="su-rail">
          {STEPS.map((s, i) => {
            const state = i < step ? "is-done" : i === step ? "is-now" : "is-todo";
            const stroke = i < step ? "#3FA98A" : i === step ? "#D4A537" : "#4C6076";
            return (
              <div key={s} className={`su-chev ${state}`}>
                <svg width="13" height="15" viewBox="0 0 13 15" fill="none" aria-hidden="true">
                  <path d="M1 1.5L6.5 7.5L1 13.5" stroke={stroke} strokeWidth="1.6" />
                  <path d="M6 1.5L11.5 7.5L6 13.5" stroke={stroke} strokeWidth="1.6"
                        opacity={i <= step ? "1" : "0.4"} />
                </svg>
                {i === step && <span className="su-chev-label">{s}</span>}
              </div>
            );
          })}
        </div>

        {/* what you've locked in so far — always reversible */}
        {ancestry && step >= at("Abilities") && (
          <div className="su-chip">
            <span className="su-chip-k">Ancestry</span>
            <span className="su-chip-v">{ancestry.name}</span>
            <button className="su-chip-b" onClick={() => setStep(0)}>Change</button>
          </div>
        )}
        {klass && step >= at("Background") && (
          <div className="su-chip">
            <span className="su-chip-k">Class</span>
            <span className="su-chip-v">
              {klass.name} {level}{subclass && subclassReady ? ` · ${subclass.name}` : ""}
            </span>
            <button className="su-chip-b" onClick={() => setStep(2)}>Change</button>
          </div>
        )}

        {background && step >= at("Defenses") && (
          <div className="su-chip">
            <span className="su-chip-k">Background</span>
            <span className="su-chip-v">{background.name}</span>
            <button className="su-chip-b" onClick={() => setStep(3)}>Change</button>
          </div>
        )}

        {/* live ability summary once an ancestry exists */}
        {resolved && step >= at("Abilities") && (
          <div className="su-sum">
            {ABILITIES.map(({ key }) => (
              <div className="su-sum-c" key={key}>
                <div className="su-sum-k">{key.toUpperCase()}</div>
                <div className="su-sum-v">{fmt(mod(finalScore(key)))}</div>
                <div className="su-sum-m">{finalScore(key)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ---------------- STEP 0 — ANCESTRY ---------------- */}
        {here === "Ancestry" && (
          <>
            {BASE_RACE_ORDER.map((id) => {
              const b = BASE_RACES[id];
              const sel = id === baseId;
              const opts = LINEAGES.filter((l) => l.base === id);
              const sina = opts.filter((l) => l.src === "sinauna").length;
              const asiStr = Object.entries(b.asi).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(" ");
              return (
                <button key={id} className={`su-card ${sel ? "is-sel" : ""}`}
                        onClick={() => pickBase(id)} aria-pressed={sel}>
                  <div className="su-card-top">
                    <span className="su-card-name">{b.name}</span>
                    <span className="su-card-kind">
                      {opts.length} option{opts.length > 1 ? "s" : ""}
                      {sina > 0 ? ` · ${sina} island` : ""}
                    </span>
                  </div>
                  <div className="su-pills" style={{ marginTop: 8 }}>
                    {asiStr
                      ? <span className="su-pill">{asiStr}</span>
                      : <span className="su-pill alt">increases come from lineage</span>}
                    <span className="su-pill alt">speed {b.speed}</span>
                    {b.darkvision > 0 && <span className="su-pill alt">darkvision {b.darkvision}</span>}
                  </div>
                </button>
              );
            })}

            {baseId && (
              <>
                <Rule />

                <div className="su-panel">
                  <h3>
                    {baseLineages.some((l) => l.kind === "subrace") ? "Subrace" : "Lineage"}
                  </h3>
                  <p className="su-note" style={{ marginBottom: 4 }}>
                    Island options modify the {baseRace.name.toLowerCase()} rather than replacing it —
                    subraces add to it, variants swap specific traits out.
                  </p>
                  {["sinauna", "phb"].map((source) => {
                    const list = baseLineages.filter((l) => l.src === source);
                    if (!list.length) return null;
                    return (
                      <div key={source}>
                        <div className="su-src">
                          {source === "sinauna" ? "Sina Una" : "Player's Handbook"}
                          <span className="su-src-n">{list.length}</span>
                        </div>
                        {list.map((l) => {
                          const sel = l.id === lineageId;
                          const parts = Object.entries(l.asi.fixed || {}).map(([k, v]) => `${k.toUpperCase()} +${v}`);
                          if (l.asi.choice) {
                            parts.push(`+${l.asi.choice.amount} to ${l.asi.choice.count} of ` +
                              (l.asi.choice.from.length > 4 ? "any" : l.asi.choice.from.map((x) => x.toUpperCase()).join("/")));
                          }
                          return (
                            <button key={l.id} className={`su-card ${sel ? "is-sel" : ""}`}
                                    style={{ marginTop: 8 }}
                                    onClick={() => pickLineage(l.id)} aria-pressed={sel}>
                              <div className="su-card-top">
                                <span className="su-card-name">{l.name}</span>
                                <span className="su-card-kind">
                                  {l.kind}{l.page ? ` · p.${l.page}` : ""}
                                </span>
                              </div>
                              {l.blurb && <p className="su-card-blurb">{l.blurb}</p>}
                              <div className="su-pills" style={{ marginTop: l.blurb ? 0 : 8 }}>
                                {parts.length
                                  ? parts.map((x) => <span className="su-pill" key={x}>{x}</span>)
                                  : <span className="su-pill alt">no extra increases</span>}
                                {(l.replaces || []).length > 0 &&
                                  <span className="su-pill alt">replaces {l.replaces.length} traits</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {needsChoice && (
              <>
                <Rule />
                <div className="su-panel">
                  <h3>
                    Ability increases
                    <span className="su-count">
                      {choicePicks.length}/{choiceCount} chosen
                    </span>
                  </h3>
                  <p className="su-note" style={{ marginBottom: 10 }}>
                    {ancestry.name} gives {choiceCount === 1 ? "one more point" : `${choiceCount} more points`}.
                    Pick {choiceCount === 1 ? "where it goes" : "different abilities for each"}.
                  </p>
                  <div className="su-skills">
                    {ancestry.asi.choice.from.map((k) => {
                      const on = choicePicks.includes(k);
                      const full = !on && choicePicks.length >= choiceCount;
                      return (
                        <button key={k} className={`su-skill ${on ? "is-sel" : ""}`}
                                onClick={() => toggleChoice(k)} disabled={full}
                                aria-pressed={on}>
                          {ABILITIES.find((a) => a.key === k).label} +{ancestry.asi.choice.amount}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {resolved && (
              <>
                <Rule />
                <div className="su-panel">
                  <h3>What you get</h3>
                  {resolved.keptBase.map((t) => (
                    <div className="su-trait" key={t.name}>
                      <div className="su-trait-n">{t.name}<span className="src">{resolved.base.name}</span></div>
                      <div className="su-trait-t">{t.text}</div>
                    </div>
                  ))}
                  {(ancestry.traits || []).map((t) => (
                    <div className="su-trait" key={t.name}>
                      <div className="su-trait-n">{t.name}
                        <span className="src">{ancestry.src === "sinauna" ? "Sina Una" : ancestry.name}</span></div>
                      <div className="su-trait-t">{t.text}</div>
                    </div>
                  ))}
                  {resolved.droppedTraits.map((t) => (
                    <div className="su-trait su-struck" key={t.name}>
                      <div className="su-trait-n">{t.name}<span className="src">Replaced</span></div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ---------------- STEP 1 — ABILITIES ---------------- */}
        {here === "Abilities" && resolved && (
          <>
            <div className="su-choice" style={{ marginBottom: 14 }}>
              <button className={`su-opt ${mode === "pointbuy" ? "is-sel" : ""}`} onClick={() => setMode("pointbuy")}>Point buy</button>
              <button className={`su-opt ${mode === "array" ? "is-sel" : ""}`} onClick={() => setMode("array")}>Standard array</button>
            </div>

            {mode === "pointbuy" && (
              <>
                <div className={`su-budget`}>
                  <span className="su-budget-l">Points left</span>
                  <span className={`su-budget-n ${remaining === 0 ? "zero" : ""}`}>{remaining}</span>
                </div>
                <div className="su-suggest">
                  <div>
                    <div className="su-suggest-t">Not sure where to put these?</div>
                    <div className="su-suggest-s">
                      Start with a spread that leans into what {ancestry.name} already boosts. You can change it after.
                    </div>
                  </div>
                  <button className="su-opt" onClick={() => setScores(recommendedSpread(resolved.asi))}>
                    Use it
                  </button>
                </div>
              </>
            )}

            <div className="su-panel">
              {ABILITIES.map(({ key, label }) => {
                const bonus = resolved.asi[key] || 0;
                const base = baseScoreFor(key);
                return (
                  <div className="su-row" key={key}>
                    <span className="su-row-label">{label}</span>
                    {mode === "pointbuy" ? (
                      <div className="su-step">
                        <button className="su-btn-sq" onClick={() => setScore(key, base - 1)}
                                disabled={base <= 8} aria-label={`Lower ${label}`}>−</button>
                        <span className="su-num">{base}</span>
                        <button className="su-btn-sq" onClick={() => setScore(key, base + 1)}
                                disabled={base >= 15 || (POINT_COST[base + 1] - POINT_COST[base]) > remaining}
                                aria-label={`Raise ${label}`}>+</button>
                      </div>
                    ) : (
                      <select className="su-sel" value={arrayAssign[key] ?? ""}
                              onChange={(e) => assignArray(key, e.target.value)} aria-label={label}>
                        <option value="">—</option>
                        {STANDARD_ARRAY.map((v, i) => (
                          <option key={i} value={v}
                                  disabled={usedArrayVals.includes(v) && arrayAssign[key] !== v}>{v}</option>
                        ))}
                      </select>
                    )}
                    <span className="su-arrow">{bonus ? `+${bonus} →` : "→"}</span>
                    <span className="su-final">{fmt(mod(base + bonus))}</span>
                    <span className="su-mod">{base + bonus}</span>
                  </div>
                );
              })}
            </div>
            <p className="su-note">Ancestry bonuses are already applied. Point buy caps each score at 15 before bonuses.</p>
          </>
        )}

        {/* ---------------- STEP 2 — CLASS ---------------- */}
        {here === "Class" && (
          <>
            <div className="su-panel">
              <h3>Level</h3>
              <p className="su-note" style={{ marginBottom: 10 }}>
                Sets which features you have and whether you pick a subclass yet.
              </p>
              <div className="su-lvl">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} className={`su-opt ${level === n ? "is-sel" : ""}`}
                          onClick={() => setLevel(n)} aria-pressed={level === n}>{n}</button>
                ))}
              </div>
            </div>

            {["sinauna", "phb"].map((source) => {
              const list = Object.entries(CLASSES).filter(([, c]) => c.src === source);
              if (!list.length) return null;
              return (
                <div key={source}>
                  <div className="su-src">
                    {source === "sinauna" ? "Sina Una" : "Player's Handbook"}
                    <span className="su-src-n">{list.length}</span>
                  </div>
                  {list.map(([id, c]) => {
                    const sel = id === classId;
                    const subs = ALL_SUBCLASSES.filter((s) => s.cls === id);
                    return (
                      <button key={id} className={`su-card ${sel ? "is-sel" : ""}`}
                              style={{ marginTop: 8 }}
                              onClick={() => pickClass(id)} aria-pressed={sel}>
                        <div className="su-card-top">
                          <span className="su-card-name">{c.name}</span>
                          <span className="su-card-kind">d{c.hitDie} hit die</span>
                        </div>
                        <p className="su-card-blurb">
                          Saves: {c.saves.join(", ")} · {c.skillCount} skills ·{" "}
                          {subs.length ? `${subs[0].name} available at ${subs[0].unlock}` : "no Sina Una option"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {klass && (
              <>
                <Rule />

                {/* subclass — only once the level unlocks it */}
                <div className="su-panel">
                  <h3>{classSubclasses[0]?.group || "Subclass"}</h3>
                  {!subclassReady ? (
                    <p className="su-note">
                      {klass.name}s choose at level {subclassUnlock}. You're level {level}, so this comes later —
                      nothing to decide now.
                    </p>
                  ) : (
                    <>
                      {["sinauna", "phb"].map((source) => {
                        const list = classSubclasses.filter((s) => s.src === source);
                        if (!list.length) return null;
                        return (
                          <div key={source}>
                            <div className="su-src">
                              {source === "sinauna" ? "Sina Una" : "Player's Handbook"}
                              <span className="su-src-n">{list.length}</span>
                            </div>
                            {list.map((s) => {
                              const sel = s.id === subclassId;
                              const now = s.features.filter((f) => f[0] <= level);
                              return (
                                <button key={s.id} className={`su-card ${sel ? "is-sel" : ""}`}
                                        style={{ marginTop: 8 }}
                                        onClick={() => { setSubclassId(s.id); setCurse(null); }}
                                        aria-pressed={sel}>
                                  <div className="su-card-top">
                                    <span className="su-card-name">{s.name}</span>
                                    {s.page && <span className="su-card-kind">p.{s.page}</span>}
                                  </div>
                                  {s.blurb && <p className="su-card-blurb">{s.blurb}</p>}
                                  <div className="su-pills" style={{ marginTop: s.blurb ? 0 : 8 }}>
                                    {now.map((f, i) => <span className="su-pill" key={i}>{f[1]}</span>)}
                                    {now.length === 0 && <span className="su-pill alt">no features yet</span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* subclass-specific choice, e.g. Graverobber's curse */}
                {subclass?.choice && level >= subclass.choice.atLevel && (
                  <div className="su-panel">
                    <h3>{subclass.choice.name}</h3>
                    <p className="su-note">{subclass.choice.note}</p>
                    <div className="su-choice">
                      {subclass.choice.options.map((o) => (
                        <button key={o.id} className={`su-opt ${curse === o.id ? "is-sel" : ""}`}
                                onClick={() => setCurse(o.id)} aria-pressed={curse === o.id}>
                          {o.name} · {o.sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* skills — anything already free is not in this list */}
                <div className="su-panel">
                  <h3>Skills <span className="su-count">{skillsLeft > 0 ? `${skillsLeft} to go` : "done"}</span></h3>
                  {freeSkills.size > 0 && (
                    <p className="su-note" style={{ marginBottom: 10 }}>
                      You already have {[...freeSkills].join(" and ")} for free, so {freeSkills.size > 1 ? "they aren't" : "it isn't"} listed below.
                    </p>
                  )}
                  <div className="su-skills">
                    {skillPool.map((s) => {
                      const on = skillPicks.includes(s);
                      const full = !on && skillPicks.length >= klass.skillCount;
                      return (
                        <button key={s} className={`su-skill ${on ? "is-sel" : ""}`}
                                onClick={() => toggleSkill(s)} disabled={full}
                                aria-pressed={on}>{s}</button>
                      );
                    })}
                  </div>
                </div>

                <div className="su-panel">
                  <h3>Proficiencies</h3>
                  <div className="su-row"><span className="su-row-label">Armor</span>
                    <span className="su-mod" style={{ width: "auto" }}>{klass.armor}</span></div>
                  <div className="su-row"><span className="su-row-label">Weapons</span>
                    <span className="su-mod" style={{ width: "auto" }}>{klass.weapons}</span></div>
                  <div className="su-row"><span className="su-row-label">Saving throws</span>
                    <span className="su-mod" style={{ width: "auto" }}>{klass.saves.join(", ")}</span></div>
                </div>
              </>
            )}
          </>
        )}

        {/* ---------------- STEP 3 — BACKGROUND ---------------- */}
        {here === "Background" && (
          <>
            {BACKGROUNDS.map((b) => {
              const sel = b.id === bgId;
              const sk = b.skills.fixed
                ? b.skills.fixed.join(", ")
                : `${b.skills.choose} from ${b.skills.from.join(", ")}`;
              return (
                <button key={b.id} className={`su-card ${sel ? "is-sel" : ""}`}
                        onClick={() => pickBackground(b.id)} aria-pressed={sel}>
                  <div className="su-card-top">
                    <span className="su-card-name">{b.name}</span>
                    <span className="su-card-kind">p.{b.page}</span>
                  </div>
                  <p className="su-card-blurb">{b.blurb}</p>
                  <div className="su-pills">
                    <span className="su-pill">{b.feature.name}</span>
                    <span className="su-pill alt">{sk}</span>
                  </div>
                </button>
              );
            })}

            {background && (
              <>
                <Rule />

                <div className="su-panel">
                  <h3>Feature: {background.feature.name}</h3>
                  <p className="su-note">{background.feature.text}</p>
                </div>

                {/* choose-from backgrounds: pool already excludes held skills */}
                {background.skills.choose && (
                  <div className="su-panel">
                    <h3>Skills <span className="su-count">
                      {bgPool.length < background.skills.choose ? "limited" :
                       bgSkillsLeft > 0 ? `${bgSkillsLeft} to go` : "done"}
                    </span></h3>
                    {bgPool.length < background.skills.from.length && (
                      <p className="su-note" style={{ marginBottom: 10 }}>
                        {background.skills.from.filter((s) => priorSkills.has(s)).join(" and ")} already
                        covered, so {background.skills.from.filter((s) => priorSkills.has(s)).length > 1 ? "they're" : "it's"} not
                        listed.
                      </p>
                    )}
                    {bgPool.length === 0 ? (
                      <p className="su-note">
                        You already have everything this background offers. Nothing to choose — worth
                        considering a different background, or different class skills.
                      </p>
                    ) : (
                      <div className="su-skills">
                        {bgPool.map((s) => {
                          const on = bgSkillPicks.includes(s);
                          const full = !on && bgSkillPicks.length >= background.skills.choose;
                          return (
                            <button key={s} className={`su-skill ${on ? "is-sel" : ""}`}
                                    onClick={() => toggleBgSkill(s)} disabled={full}
                                    aria-pressed={on}>{s}</button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* fixed-skill backgrounds: flag collisions honestly */}
                {background.skills.fixed && (
                  <div className="su-panel">
                    <h3>Skills</h3>
                    <div className="su-skills">
                      {background.skills.fixed.map((s) => (
                        <span key={s} className={`su-skill is-given ${bgOverlap.includes(s) ? "is-dupe" : ""}`}>
                          {s}{bgOverlap.includes(s) ? " · duplicate" : ""}
                        </span>
                      ))}
                    </div>
                    {bgOverlap.length > 0 && (
                      <p className="su-warn">
                        You already have {bgOverlap.join(" and ")} from your class or ancestry. The 2014 rules
                        don't let you swap a duplicate for something else, so it's wasted — go back and pick
                        different class skills if you'd rather not lose {bgOverlap.length > 1 ? "them" : "it"}.
                        <button className="su-chip-b" onClick={() => setStep(2)}>Change class skills</button>
                      </p>
                    )}
                  </div>
                )}

                {background.choice && (
                  <div className="su-panel">
                    <h3>{background.choice.name}</h3>
                    <p className="su-note">{background.choice.note}</p>
                    <div className="su-skills" style={{ marginTop: 10 }}>
                      {background.choice.options.map((o) => (
                        <button key={o} className={`su-skill ${bgChoice === o ? "is-sel" : ""}`}
                                onClick={() => setBgChoice(o)} aria-pressed={bgChoice === o}>{o}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="su-panel">
                  <h3>You start with</h3>
                  {background.equipment.map((e) => (
                    <div className="su-row" key={e}><span className="su-row-label">{e}</span></div>
                  ))}
                  {background.tools.length > 0 && (
                    <div className="su-row"><span className="su-row-label">Tools</span>
                      <span className="su-mod" style={{ width: "auto" }}>{background.tools.join(", ")}</span></div>
                  )}
                  {(background.langs > 0 || background.fixedLangs) && (
                    <div className="su-row"><span className="su-row-label">Languages</span>
                      <span className="su-mod" style={{ width: "auto" }}>
                        {background.fixedLangs ? background.fixedLangs.join(", ")
                          : `${background.langs} of your choice`}
                      </span></div>
                  )}
                </div>

                <p className="su-note">
                  Personality traits, ideals, bonds, and flaws are on p.{background.page} — roll or pick
                  those at the table.
                </p>
              </>
            )}
          </>
        )}

        {/* ---------------- STEP 4 — DEFENSES ---------------- */}
        {here === "Defenses" && resolved && (
          <>
            <div className="su-vitals">
              <div className="su-vital">
                <div className="su-vital-n">{armorClass}</div>
                <div className="su-vital-l">Armor Class</div>
                <div className="su-vital-s">{bestAC?.parts}{shieldOn ? " + 2 shield" : ""}</div>
              </div>
              <div className="su-vital">
                <div className="su-vital-n">{klass ? hitPoints : "—"}</div>
                <div className="su-vital-l">Hit Points</div>
              </div>
              <div className="su-vital">
                <div className="su-vital-n">{fmt(initiative)}</div>
                <div className="su-vital-l">Initiative</div>
              </div>
              <div className="su-vital">
                <div className="su-vital-n">{speed}</div>
                <div className="su-vital-l">Speed</div>
              </div>
            </div>

            {!klass ? (
              <div className="su-stub">
                <p className="su-stub-t">Pick a class first</p>
                <p className="su-stub-s">Armor proficiency decides what you can wear.</p>
              </div>
            ) : (
              <>
                <div className="su-panel">
                  <h3>Armor</h3>
                  {armorOptions.length === 1 ? (
                    <p className="su-note">
                      {klass.name}s aren't proficient with any armor
                      {klass.unarmored ? `, and don't need it — ${klass.unarmored.name} is usually better anyway.` : "."}
                    </p>
                  ) : (
                    <>
                      {klass.noMetal && (
                        <p className="su-note" style={{ marginBottom: 10 }}>
                          Metal armor is left out — druids won't wear it. Studded leather is included, though
                          whether its rivets count is a table-by-table call.
                        </p>
                      )}
                      <div className="su-skills">
                        {armorOptions.map((a) => (
                          <button key={a.id} className={`su-skill ${armor.id === a.id ? "is-sel" : ""}`}
                                  onClick={() => setArmorId(a.id)} aria-pressed={armor.id === a.id}>
                            {a.name}{a.cat !== "none" ? ` ${a.base}` : ""}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {shieldAllowed && (
                    <div className="su-row" style={{ marginTop: 12 }}>
                      <span className="su-row-label">Shield <span className="su-count">+2 AC</span></span>
                      <button className={`su-opt ${shieldOn ? "is-sel" : ""}`}
                              onClick={() => setHasShield((v) => !v)} aria-pressed={shieldOn}>
                        {shieldOn ? "Carrying" : "No shield"}
                      </button>
                    </div>
                  )}
                  {strShortfall && (
                    <p className="su-warn">
                      {armor.name} needs Strength {strShortfall} and you have {finalScore("str")}, so your
                      speed drops by 10 feet — {resolved.speed} down to {speed}.
                    </p>
                  )}
                  {armor.stealth && (
                    <p className="su-warn">{armor.name} gives disadvantage on Stealth checks.</p>
                  )}
                  {klass.unarmored && armor.id !== "none" && (
                    <p className="su-warn">
                      Wearing armor switches off {klass.unarmored.name}.
                    </p>
                  )}
                  {klass.unarmored?.noShield && shieldOn && armor.id === "none" && (
                    <p className="su-warn">
                      {klass.name} Unarmored Defense doesn't work with a shield, so you're on plain 10 + Dex.
                    </p>
                  )}
                </div>

                {acCandidates.length > 1 && (
                  <div className="su-panel">
                    <h3>Why that number</h3>
                    <p className="su-note" style={{ marginBottom: 10 }}>
                      More than one formula applies. You use the best one.
                    </p>
                    {acCandidates.map((c) => {
                      const best = c.value === bestAC.value;
                      return (
                        <div className={`su-row ${best ? "" : "su-dim"}`} key={c.label}>
                          <span className="su-row-label">{c.label}
                            <span className="su-ac-parts">{c.parts}</span></span>
                          <span className={best ? "su-final" : "su-mod"}>{c.value}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="su-panel">
                  <h3>Saving throws <span className="su-count">proficiency {fmt(pb)}</span></h3>
                  {savingThrows.map((s) => (
                    <div className="su-row" key={s.key}>
                      <span className={`su-dot${s.proficient ? " is-on" : ""}`} aria-hidden="true" />
                      <span className="su-row-label">{s.label}</span>
                      <span className="su-final">{fmt(s.value)}</span>
                    </div>
                  ))}
                  <p className="su-note" style={{ marginTop: 10 }}>
                    Filled circles are the two your class is proficient in.
                  </p>
                </div>

                <div className="su-panel">
                  <h3>Passive skills</h3>
                  {passiveSkills.map((p) => (
                    <div className="su-row" key={p.name}>
                      <span className="su-row-label">Passive {p.name}</span>
                      <span className="su-final">{p.value}</span>
                    </div>
                  ))}
                </div>

                {weaponChoiceGroups.length > 0 && (
                  <div className="su-panel">
                    <h3>Starting Equipment <span className="su-count">weapons</span></h3>
                    <p className="su-note" style={{ marginBottom: 10 }}>
                      {klass.name}'s starting gear. Background gear — packs, tools, trinkets — is on the Background step.
                    </p>
                    {weaponChoiceGroups.length > 1 && (
                      <p className="su-note" style={{ marginBottom: 4 }}>
                        You get one pick from <em>each</em> row below — {weaponChoiceGroups.length} weapons total, not one.
                      </p>
                    )}
                    {weaponChoiceGroups.map((group, gi) => {
                      const choice = equipmentChoices[gi];
                      const ordinal = ["1st", "2nd", "3rd", "4th"][gi] || `${gi + 1}th`;
                      return (
                        <div key={gi} style={{ marginBottom: 10 }}>
                          {weaponChoiceGroups.length > 1 && (
                            <span className="su-row-label" style={{ display: "block", marginBottom: 4 }}>
                              {ordinal} weapon
                            </span>
                          )}
                          <div className="su-skills">
                            {group.map((opt, oi) => {
                              const sel = choice?.optIdx === oi;
                              const label = opt.label || WEAPONS.find((w) => w.id === opt.weapon)?.name || opt.weapon;
                              return (
                                <button key={oi} className={`su-skill ${sel ? "is-sel" : ""}`}
                                        onClick={() => setEquipmentChoices((prev) => ({ ...prev, [gi]: { optIdx: oi, weaponId: null } }))}
                                        aria-pressed={sel}>
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                          {choice != null && group[choice.optIdx]?.filter && (() => {
                            const optQty = group[choice.optIdx].qty || 1;
                            return (
                              <>
                                {optQty > 1 && (
                                  <p className="su-note" style={{ marginTop: 6, marginBottom: 4 }}>
                                    Pick one — you get {optQty} of it.
                                  </p>
                                )}
                                <div className="su-skills" style={{ marginTop: 6 }}>
                                  {WEAPONS.filter((w) => {
                                    const f = group[choice.optIdx].filter;
                                    if (f.category && w.category !== f.category) return false;
                                    if (f.melee && w.kind !== "melee") return false;
                                    return true;
                                  }).map((w) => (
                                    <button key={w.id} className={`su-skill ${choice.weaponId === w.id ? "is-sel" : ""}`}
                                            onClick={() => setEquipmentChoices((prev) => ({ ...prev, [gi]: { ...prev[gi], weaponId: w.id } }))}
                                            aria-pressed={choice.weaponId === w.id}>
                                      {w.name}{optQty > 1 ? ` ×${optQty}` : ""}
                                    </button>
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      );
                    })}
                    {klass.startingEquipment?.gear?.length > 0 && (
                      <p className="su-note" style={{ marginTop: 4 }}>
                        Also: {klass.startingEquipment.gear.join(", ")}.
                      </p>
                    )}
                  </div>
                )}

                <div className="su-panel">
                  <h3>Attacks</h3>
                  <div className="su-atk-table">
                    <div className="su-atk-row su-atk-head">
                      <span>Attack</span><span>Range</span><span>Hit / DC</span><span>Damage</span><span>Notes</span>
                    </div>
                    {attackRows.map((r) => (
                      <div className="su-atk-row" key={r.key}>
                        <span className="su-atk-name">{r.name}{!r.proficient && <span className="su-tag alt">not proficient</span>}</span>
                        <span>{r.range}</span>
                        <span className="su-atk-num">{r.hitOrDC}</span>
                        <span className="su-atk-num">{r.damage}{r.dmgType ? ` ${r.dmgType}` : ""}</span>
                        <span className="su-atk-notes">{r.notes || "—"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="su-row" style={{ marginTop: 10 }}>
                    <span className="su-row-label">Weapon Mastery <span className="su-count">2024, optional</span></span>
                    <button className={`su-opt ${masteryEnabled ? "is-sel" : ""}`}
                            onClick={() => setMasteryEnabled((v) => !v)} aria-pressed={masteryEnabled}>
                      {masteryEnabled ? "On" : "Off"}
                    </button>
                  </div>
                  {masteryEnabled && (
                    <p className="su-warn">
                      Off the 2014 chassis Sina Una uses — an informational tag only, in the Notes column above.
                      It doesn't change AC, attack bonus, or damage, and this app doesn't track which masteries
                      you'd actually know. {[...new Set(carriedWeapons.map((w) => WEAPON_MASTERY_2024[w.id]).filter(Boolean))]
                        .map((m) => `${m} — ${MASTERY_PROPERTY_TEXT[m]}`).join(" ")}
                    </p>
                  )}
                </div>

                {actions.length > 0 && (
                  <div className="su-panel">
                    <h3>Other Actions</h3>
                    {ACTION_ORDER.filter((k) => actions.some((a) => a.action === k)).map((k) => (
                      <div key={k}>
                        <div className="su-actgroup-l">{ACTION_LABELS[k]}</div>
                        {actions.filter((a) => a.action === k).map((a, i) => (
                          <div className="su-trait" key={i}>
                            <div className="su-trait-n">{a.name} <span className="src">{a.source}</span></div>
                            <div className="su-trait-t">{a.text}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {ancestrySpells.length > 0 && (
                  <div className="su-panel">
                    <h3>Ancestry spells</h3>
                    <p className="su-note" style={{ marginBottom: 10 }}>
                      Granted by your lineage, not picked on the Spells step — and they don't
                      spend your slots.
                    </p>
                    {ancestrySpells.map((sp) => (
                      <div className="su-trait" key={sp.key}>
                        <div className="su-trait-n">{sp.name}
                          <span className="src">{sp.from}{sp.use ? ` — ${sp.use}` : ""}</span></div>
                        <div className="su-trait-t">
                          {sp.level === 0 ? "Cantrip" : `Level ${sp.level}`}. {splitCastingTime(sp.time).head}, {sp.range}.
                          {sp.ability ? ` DC ${sp.saveDC}, attack ${fmt(sp.attack)} (${sp.ability.toUpperCase()}).` : ""} {sp.text}
                        </div>
                      </div>
                    ))}
                    {ancestrySpells.some((sp) => !sp.ability && (sp.atk || sp.save)) && (
                      <p className="su-warn">
                        The book names no spellcasting ability for one of these traits, so there's no
                        DC to show — ask your DM which ability it uses.
                      </p>
                    )}
                  </div>
                )}

                <div className="su-panel">
                  <h3>Actions in Combat</h3>
                  <p className="su-note">{BASIC_ACTIONS.join(", ")}.</p>
                </div>
              </>
            )}
          </>
        )}

        {/* ---------------- SPELLS ---------------- */}
        {here === "Spells" && casting && !casting.pending && (
          <>
            <div className="su-cast">
              <div className="su-cast-c">
                <div className="su-cast-l">Save DC</div>
                <div className="su-cast-v">{casting.saveDC}</div>
              </div>
              <div className="su-cast-c">
                <div className="su-cast-l">Attack</div>
                <div className="su-cast-v">{fmt(casting.attack)}</div>
              </div>
              <div className="su-cast-c">
                <div className="su-cast-l">{casting.ability.toUpperCase()}</div>
                <div className="su-cast-v">{fmt(casting.abMod)}</div>
              </div>
            </div>

            {casting.slots?.length > 0 && (
              <div className="su-slots" style={{ marginBottom: 14 }}>
                {casting.slots.map((n, i) => (
                  <div className="su-slot" key={i}>
                    <div className="su-slot-l">{i + 1}{["st", "nd", "rd"][i] || "th"}</div>
                    <div className="su-slot-n">{n}</div>
                  </div>
                ))}
              </div>
            )}
            {casting.pact && (
              <div className="su-slots" style={{ marginBottom: 14 }}>
                <div className="su-slot">
                  <div className="su-slot-l">Pact slots</div>
                  <div className="su-slot-n">{casting.pact.n}</div>
                </div>
                <div className="su-slot">
                  <div className="su-slot-l">at level</div>
                  <div className="su-slot-n">{casting.pact.lvl}</div>
                </div>
              </div>
            )}

            {cantripBudget > 0 && (
              <>
                <div className="su-panel">
                  <h3>Cantrips
                    <span className="su-count">{pickedCantrips.length}/{cantripBudget}</span></h3>
                  {availableSpells?.rows.filter((x) => x.level === 0).length ? (
                    <>
                      <p className="su-note" style={{ marginBottom: 10 }}>
                        Island cantrips open to you. Anything from your usual list goes in the box below.
                      </p>
                      <div className="su-src">Sina Una
                        <span className="su-src-n">{availableSpells.rows.filter((x) => x.level === 0).length}</span></div>
                      {availableSpells.rows.filter((x) => x.level === 0).map((sp) => (
                        <SpellTableRow key={sp.name} sp={sp} casting={casting}
                                  on={pickedSpells.includes(sp.name)}
                                  full={!pickedSpells.includes(sp.name) && pickedCantrips.length >= cantripBudget}
                                  onToggle={() => toggleSpell(sp.name)} />
                      ))}
                    </>
                  ) : null}
                  {availableSpells?.phb.filter((x) => x.level === 0).length > 0 && (
                    <>
                      <div className="su-src">Player's Handbook
                        <span className="su-src-n">{availableSpells.phb.filter((x) => x.level === 0).length}</span></div>
                      {availableSpells.phb.filter((x) => x.level === 0).map((sp) => (
                        <SpellTableRow key={sp.name} sp={sp} casting={casting}
                                  on={pickedSpells.includes(sp.name)}
                                  full={!pickedSpells.includes(sp.name) && pickedCantrips.length >= cantripBudget}
                                  onToggle={() => toggleSpell(sp.name)} />
                      ))}
                    </>
                  )}
                  {availableSpells?.scc.filter((x) => x.level === 0).length > 0 && (
                    <>
                      <div className="su-src">Strixhaven
                        <span className="su-src-n">{availableSpells.scc.filter((x) => x.level === 0).length}</span></div>
                      {availableSpells.scc.filter((x) => x.level === 0).map((sp) => (
                        <SpellTableRow key={sp.name} sp={sp} casting={casting}
                                  on={pickedSpells.includes(sp.name)}
                                  full={!pickedSpells.includes(sp.name) && pickedCantrips.length >= cantripBudget}
                                  onToggle={() => toggleSpell(sp.name)} />
                      ))}
                    </>
                  )}
                </div>
                <Rule />
              </>
            )}

            {spellBudget > 0 && (
              <>
                <div className="su-panel">
                  <h3>{casting.prepared != null ? "Prepared spells" : "Spells known"}
                    <span className="su-count">{pickedLeveled.length}/{spellBudget}</span></h3>
                  {availableSpells?.rows.filter((x) => x.level > 0).length ? (
                    <>
                      <p className="su-note" style={{ marginBottom: 10 }}>
                        {casting.prepared != null
                          ? "You can swap these after a long rest."
                          : "These are locked in until you level up."}{" "}
                        Only spells at or below your highest slot level appear.
                      </p>
                      {[1, 2, 3].map((lvl) => {
                        const rows = availableSpells.rows.filter((x) => x.level === lvl);
                        const phb = availableSpells.phb.filter((x) => x.level === lvl);
                        const scc = availableSpells.scc.filter((x) => x.level === lvl);
                        if (!rows.length && !phb.length && !scc.length) return null;
                        return (
                          <div key={lvl}>
                            <div className="su-lvlh">Level {lvl}
                              {casting.slots?.[lvl - 1] != null && (
                                <span className="su-count">{casting.slots[lvl - 1]} slot{casting.slots[lvl - 1] === 1 ? "" : "s"}</span>
                              )}
                            </div>
                            {rows.length > 0 && (
                              <>
                                <div className="su-src">Sina Una
                                  <span className="su-src-n">{rows.length}</span></div>
                                {rows.map((sp) => (
                                  <SpellTableRow key={sp.name} sp={sp} casting={casting}
                                            on={pickedSpells.includes(sp.name)}
                                            full={!pickedSpells.includes(sp.name) && pickedLeveled.length >= spellBudget}
                                            onToggle={() => toggleSpell(sp.name)} />
                                ))}
                              </>
                            )}
                            {phb.length > 0 && (
                              <>
                                <div className="su-src">Player's Handbook
                                  <span className="su-src-n">{phb.length}</span></div>
                                {phb.map((sp) => (
                                  <SpellTableRow key={sp.name} sp={sp} casting={casting}
                                            on={pickedSpells.includes(sp.name)}
                                            full={!pickedSpells.includes(sp.name) && pickedLeveled.length >= spellBudget}
                                            onToggle={() => toggleSpell(sp.name)} />
                                ))}
                              </>
                            )}
                            {scc.length > 0 && (
                              <>
                                <div className="su-src">Strixhaven
                                  <span className="su-src-n">{scc.length}</span></div>
                                {scc.map((sp) => (
                                  <SpellTableRow key={sp.name} sp={sp} casting={casting}
                                            on={pickedSpells.includes(sp.name)}
                                            full={!pickedSpells.includes(sp.name) && pickedLeveled.length >= spellBudget}
                                            onToggle={() => toggleSpell(sp.name)} />
                                ))}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ) : null}
                </div>
                <Rule />
              </>
            )}

            <div className="su-panel">
              <h3>Anything else</h3>
              <p className="su-note" style={{ marginBottom: 10 }}>
                Everything from the Handbook, Strixhaven, and the islands is listed above. If your table uses spells
                from another book, add them here — one per line.
              </p>
              <textarea className="su-out" rows={4} value={otherSpells}
                        onChange={(e) => setOtherSpells(e.target.value)}
                        placeholder={"Healing Spirit\nShadow Blade"}
                        aria-label="Other spells" />
            </div>
          </>
        )}

        {/* ---------------- INVENTORY ---------------- */}
        {here === "Inventory" && resolved && (
          <>
            <div className="su-panel">
              <h3>Weapons</h3>
              {groupedWeapons.length > 0 ? groupedWeapons.map(({ weapon, qty }) => (
                <div className="su-row" key={weapon.id}>
                  <span className="su-row-label">{weapon.name}</span>
                  {qty > 1 && <span className="su-mod" style={{ width: "auto" }}>×{qty}</span>}
                </div>
              )) : (
                <p className="su-note">
                  Nothing picked yet. <button className="su-linkbtn" onClick={() => setStep(at("Defenses"))}>
                    Choose starting weapons
                  </button> on the Defenses step.
                </p>
              )}
            </div>

            <div className="su-panel">
              <h3>Armor</h3>
              <div className="su-row">
                <span className="su-row-label">Worn</span>
                <span className="su-mod" style={{ width: "auto" }}>{armor.id === "none" ? "None" : armor.name}</span>
              </div>
              <div className="su-row">
                <span className="su-row-label">Shield</span>
                <span className="su-mod" style={{ width: "auto" }}>{shieldOn ? "Carrying" : "None"}</span>
              </div>
              <p className="su-note" style={{ marginTop: 6 }}>
                <button className="su-linkbtn" onClick={() => setStep(at("Defenses"))}>Change armor</button> on the Defenses step.
              </p>
            </div>

            <div className="su-panel">
              <h3>Gear</h3>
              {[...(klass?.startingEquipment?.gear || []), ...startingGold.items,
                ...(background?.tools || [])].map((g) => (
                <div className="su-row" key={g}><span className="su-row-label">{g}</span></div>
              ))}
              {!klass && !background && (
                <p className="su-note">Pick a class and background to see starting gear.</p>
              )}
            </div>

            <div className="su-panel">
              <h3>Currency</h3>
              {background ? (
                <div className="su-vitals" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="su-vital">
                    <div className="su-vital-n">{startingGold.gp} gp</div>
                    <div className="su-vital-l">Starting gold — {background.name}</div>
                  </div>
                </div>
              ) : (
                <p className="su-note">Pick a background to see starting gold.</p>
              )}
            </div>
          </>
        )}

        {/* ---------------- SHEET / EXPORT ---------------- */}
        {here === "Sheet" && resolved && (
          <>
            <div className="su-panel">
              <h3>Name</h3>
              <input className="su-input" value={name} onChange={(e) => setName(e.target.value)}
                     placeholder="Unnamed" aria-label="Character name" />
            </div>

            <Rule />

            <div className="su-export su-export-stack">
              <div className="su-export-t">Character sheet</div>
              <div className="su-export-alt">
                <button className="su-btn su-btn-go" onClick={printSheet}>Save on Android/Mac/PC</button>
                <button className="su-btn su-btn-ios" onClick={saveForIOS} disabled={pdfState === "working"}>
                  {pdfState === "working" ? "Building…" : "Save on iOS"}
                </button>
                <button className="su-btn su-btn-alt" onClick={saveVector} disabled={pdfState === "working"}>
                  Save for other devices
                </button>
              </div>
            </div>
            <p className="su-note" style={{ marginTop: -2 }}>
              <button className="su-linkbtn" onClick={downloadSheet}>Download the raw HTML</button> instead.
            </p>
            {pdfState === "error" && (
              <p className="su-warn">That export failed. Try one of the other buttons.</p>
            )}

            {!name.trim() && (
              <p className="su-warn">The sheet will say "Unnamed" unless you fill in a name first.</p>
            )}

            <Rule />

            <div className="su-panel">
              <h3>What goes in the file</h3>
              <p className="su-note" style={{ marginBottom: 10 }}>
                Length isn't fixed to a page count — it flows to however many pages the
                character actually needs.
              </p>
              <div className="su-row"><span className="su-row-label">Sheet</span>
                <span className="su-mod" style={{ width: "auto" }}>
                  Abilities, saves, skills, defenses, traits, features, attacks, spells
                </span></div>
              <div className="su-row"><span className="su-row-label">Appendix</span>
                <span className="su-mod" style={{ width: "auto" }}>
                  {appendix.length} full description{appendix.length === 1 ? "" : "s"}
                </span></div>
            </div>

            <div className="su-panel">
              <h3>Plain text</h3>
              <textarea className="su-out" readOnly rows={10} value={sheetText}
                        onFocus={(e) => e.target.select()} aria-label="Character summary" />
            </div>

            <Rule />

            <div className="su-export">
              <div>
                <div className="su-export-t">Start over</div>
                <div className="su-export-s">Wipes this character and every saved field.</div>
              </div>
              <button className="su-btn su-btn-danger" onClick={() => setShowResetConfirm(true)}>
                Create new character
              </button>
            </div>
          </>
        )}
      </div>

      {showResetConfirm && (
        <div className="su-modal-bg" role="dialog" aria-modal="true" aria-label="Confirm new character">
          <div className="su-modal">
            <h3 className="su-modal-t">Create new character?</h3>
            <p className="su-modal-s">
              This clears every field — ancestry, abilities, class, background, and spells —
              and starts a blank character from the first step. This can't be undone.
            </p>
            <div className="su-modal-row">
              <button className="su-btn" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="su-btn su-btn-danger" onClick={resetAll}>Create New</button>
            </div>
          </div>
        </div>
      )}

      {/* nav */}
      <div className="su-nav">
        <div className="su-nav-in">
          <button className="su-btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
          {here === "Ancestry" && ancestry && needsChoice && !choiceMade && (
            <span className="su-hint">
              {choiceCount - choicePicks.length} more increase{choiceCount - choicePicks.length > 1 ? "s" : ""}
            </span>
          )}
          {here === "Ancestry" && !baseId && <span className="su-hint">Pick a race</span>}
          {here === "Ancestry" && baseId && !ancestry && <span className="su-hint">Pick a lineage</span>}
          {here === "Abilities" && mode === "array" && Object.keys(arrayAssign).length < 6 && (
            <span className="su-hint">Assign all six</span>
          )}
          {here === "Class" && !klass && <span className="su-hint">Pick a class</span>}
          {here === "Class" && klass && subclassReady && !subclass && (
            <span className="su-hint">Pick a {classSubclasses[0].group.toLowerCase()}</span>
          )}
          {here === "Class" && klass && subclass?.choice && level >= subclass.choice.atLevel && !curse && (
            <span className="su-hint">Pick how your curse manifests</span>
          )}
          {here === "Class" && klass && skillsLeft > 0 && (
            <span className="su-hint">{skillsLeft} more skill{skillsLeft > 1 ? "s" : ""}</span>
          )}
          {here === "Background" && !background && <span className="su-hint">Pick a background</span>}
          {here === "Background" && background?.skills.choose && bgSkillsLeft > 0 && bgPool.length >= background.skills.choose && (
            <span className="su-hint">{bgSkillsLeft} more skill{bgSkillsLeft > 1 ? "s" : ""}</span>
          )}
          {here === "Background" && background?.choice && !bgChoice && (
            <span className="su-hint">Pick a {background.choice.name.toLowerCase()}</span>
          )}
          {here === "Spells" && cantripBudget > 0 && pickedCantrips.length === 0 && (
            <span className="su-hint">Pick your cantrips</span>
          )}
          <button className="su-btn su-btn-go" onClick={() => {
                    setStep((s) => Math.min(STEPS.length - 1, s + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={step === STEPS.length - 1 || !canAdvance()}>
            {step === STEPS.length - 1 ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
