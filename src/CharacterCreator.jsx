import React, { useState, useMemo, useEffect } from "react";

import { loadContent, EDITIONS, EDITION_LABEL } from "./content/load.js";
import {
  ABILITIES, ABILITY_KEYS, mod, fmt, POINT_COST, POINT_BUDGET, STANDARD_ARRAY,
  finalScore as sumFinalScore, sumIncreases, classAbilityPriority,
} from "./rules/abilities.js";
import {
  MAX_LEVEL, LEVELS, profBonus, spellSlots, pactSlots, cantripsKnown, spellsKnown,
  preparedCount, spellbookSize, asisEarned, nextAsiLevel, subclassActive, featuresAtLevel,
  progressionAt,
} from "./rules/progression.js";
import {
  acCandidates, isWeaponProficient, weaponAbility, attackBonus, damageBonus,
  savingThrows as savingThrowsOf, skillTable as skillTableOf, passiveScore,
  spellcastingStats, hitPoints as hitPointsOf,
} from "./rules/combat.js";
import { deriveClassArmorProf, deriveClassWeaponProf, mergeArmorProf, mergeWeaponProf } from "./rules/effects.js";
import { abilityChoiceSlots, resolveAbilityChoice } from "./rules/choices.js";
import { meetsPrerequisite } from "./rules/prereq.js";
import { buildSteps } from "./lib/steps.js";
import {
  groupWeapons, spellHitDC, spellEffect, ACTION_ORDER, ACTION_LABELS, BASIC_ACTIONS,
  recommendedSpread, splitCastingTime,
} from "./lib/derive.js";
import { buildSheetHTML } from "./lib/sheetHtml.js";
import { saveSheetPDF } from "./pdf/sheetPdf.js";
import { saveSheetRasterPDF } from "./pdf/sheetRaster.js";
import { sheetFileName, sheetFileBase } from "./pdf/saveFile.js";
import { loadSaved, saveSnapshot, clearSaved, buildCharacterExport, characterFileName }
  from "./lib/storage.js";
import Rule from "./components/Rule.jsx";
import SpellTableRow from "./components/SpellTableRow.jsx";
import SheetSummary from "./components/SheetSummary.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

const APP_TITLE = document.title;
const saved = loadSaved();

const DEFAULTS = {
  edition: "2024", step: 0,
  ancestryId: null, ancestryPicks: {}, ancestrySpellPicks: {},
  mode: "pointbuy", scores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }, arrayAssign: {},
  name: "", backstory: "",
  classId: null, level: 1, subclassId: null,
  skillPicks: [], optionPicks: {}, asiPicks: {},
  bgId: null, bgSkillPicks: [], bgAbilityAlt: 0, bgAbilityPicks: [],
  armorId: null, hasShield: false, classEquipPicks: {}, bgEquipPicks: {},
  pickedSpellIds: [], otherSpells: "",
};

/* A feature's own optionalFeature/feat choices resolve through the
   mapper (src/content/features.js). One class in the SRD does not:
   2014's Warlock lists its Eldritch Invocations by a `{@filter}` page
   reference rather than an enumerated list, so there is nothing for
   `toFeature` to resolve. The real option pool and the real per-level
   count both still exist in the data — types on `content.options`, the
   count in the class's own table — just not wired to that one feature.
   This is the one place that gap is bridged by hand. */
const GROWING_CHOICE_KEYWORDS = { "eldritch invocations": "invocation" };

function tableColumnAt(tables, keyword, level) {
  for (const t of tables || []) {
    const idx = (t.colLabels || []).findIndex((l) => l.toLowerCase().includes(keyword));
    if (idx < 0) continue;
    const row = t.rows?.[level - 1];
    const v = row?.[idx];
    if (typeof v === "number") return v;
  }
  return null;
}

/* additionalSpells choice filters are raw "level=0|class=Wizard" strings
   (see src/content/additionalSpells.js) — the mapper keeps them as text
   rather than resolving them, since resolving needs the full spell list
   it doesn't have in scope. Only two keys appear anywhere in the SRD. */
/* additionalSpells grants come in two shapes that matter here (see
   src/content/additionalSpells.js): mode "known"/"prepared" just adds a
   spell to what the character has, same as any other — casting it still
   spends a slot. Mode "innate" is the free-cast racial trait (Tiefling's
   Hellish Rebuke, "once, then no more until a long rest") and carries
   `cast`/`uses`; that's the only case with a cadence worth printing, and
   the only one that never touches a spell slot. */
function grantCadence(g) {
  if (!g.cast) return null;
  const n = (g.uses || "1").replace(/\D/g, "") || "1";
  const per = { daily: "long rest", rest: "rest", resource: "rest" }[g.cast] || g.cast;
  return `${n}/${per}`;
}

function spellsMatchingFilter(spells, filter) {
  const want = {};
  for (const part of String(filter || "").split("|")) {
    const [k, v] = part.split("=");
    if (k === "level") want.level = Number(v);
    if (k === "class") want.classSlug = v.toLowerCase();
  }
  return spells.filter((sp) =>
    (want.level == null || sp.level === want.level) &&
    (!want.classSlug || sp.classLists.includes(want.classSlug)));
}

export default function CharacterCreator() {
  const [edition, setEdition] = useState(saved?.edition ?? DEFAULTS.edition);
  const [content, setContent] = useState(null);
  const [contentError, setContentError] = useState(null);

  useEffect(() => {
    let live = true;
    setContent(null);
    setContentError(null);
    loadContent(edition).then((c) => { if (live) setContent(c); })
      .catch((e) => { if (live) setContentError(e); });
    return () => { live = false; };
  }, [edition]);

  const [step, setStep] = useState(saved?.step ?? DEFAULTS.step);
  /* Furthest step reached so far — the rail lets you jump freely to any
     step you've already visited, even if something picked later would,
     recomputed live, make an earlier step look incomplete again (e.g. a
     class feature unlocked by a level gained on Advancement). Only the
     Next button's forward move is gated on live completeness. */
  const [maxStep, setMaxStep] = useState(saved?.maxStep ?? saved?.step ?? DEFAULTS.step);
  useEffect(() => { setMaxStep((m) => Math.max(m, step)); }, [step]);
  const [ancestryId, setAncestryId] = useState(saved?.ancestryId ?? DEFAULTS.ancestryId);
  const [ancestryPicks, setAncestryPicks] = useState(saved?.ancestryPicks ?? DEFAULTS.ancestryPicks);
  const [ancestrySpellPicks, setAncestrySpellPicks] = useState(saved?.ancestrySpellPicks ?? DEFAULTS.ancestrySpellPicks);
  const [mode, setMode] = useState(saved?.mode ?? DEFAULTS.mode);
  const [scores, setScores] = useState(saved?.scores ?? DEFAULTS.scores);
  const [arrayAssign, setArrayAssign] = useState(saved?.arrayAssign ?? DEFAULTS.arrayAssign);
  const [name, setName] = useState(saved?.name ?? DEFAULTS.name);
  const [backstory, setBackstory] = useState(saved?.backstory ?? DEFAULTS.backstory);
  const [classId, setClassId] = useState(saved?.classId ?? DEFAULTS.classId);
  const [level, setLevel] = useState(saved?.level ?? DEFAULTS.level);
  const [subclassId, setSubclassId] = useState(saved?.subclassId ?? DEFAULTS.subclassId);
  const [skillPicks, setSkillPicks] = useState(saved?.skillPicks ?? DEFAULTS.skillPicks);
  const [optionPicks, setOptionPicks] = useState(saved?.optionPicks ?? DEFAULTS.optionPicks);
  const [asiPicks, setAsiPicks] = useState(saved?.asiPicks ?? DEFAULTS.asiPicks);
  const [bgId, setBgId] = useState(saved?.bgId ?? DEFAULTS.bgId);
  const [bgSkillPicks, setBgSkillPicks] = useState(saved?.bgSkillPicks ?? DEFAULTS.bgSkillPicks);
  const [bgAbilityAlt, setBgAbilityAlt] = useState(saved?.bgAbilityAlt ?? DEFAULTS.bgAbilityAlt);
  const [bgAbilityPicks, setBgAbilityPicks] = useState(saved?.bgAbilityPicks ?? DEFAULTS.bgAbilityPicks);
  const [armorId, setArmorId] = useState(saved?.armorId ?? DEFAULTS.armorId);
  const [hasShield, setHasShield] = useState(saved?.hasShield ?? DEFAULTS.hasShield);
  const [classEquipPicks, setClassEquipPicks] = useState(saved?.classEquipPicks ?? DEFAULTS.classEquipPicks);
  const [bgEquipPicks, setBgEquipPicks] = useState(saved?.bgEquipPicks ?? DEFAULTS.bgEquipPicks);
  const [pickedSpellIds, setPickedSpellIds] = useState(saved?.pickedSpellIds ?? DEFAULTS.pickedSpellIds);
  const [otherSpells, setOtherSpells] = useState(saved?.otherSpells ?? DEFAULTS.otherSpells);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const pickEdition = (ed) => {
    setEdition(ed);
    setAncestryId(DEFAULTS.ancestryId); setAncestryPicks(DEFAULTS.ancestryPicks);
    setAncestrySpellPicks(DEFAULTS.ancestrySpellPicks);
    setMode(DEFAULTS.mode); setScores(DEFAULTS.scores); setArrayAssign(DEFAULTS.arrayAssign);
    setClassId(DEFAULTS.classId); setLevel(DEFAULTS.level); setSubclassId(DEFAULTS.subclassId);
    setSkillPicks(DEFAULTS.skillPicks); setOptionPicks(DEFAULTS.optionPicks); setAsiPicks(DEFAULTS.asiPicks);
    setBgId(DEFAULTS.bgId); setBgSkillPicks(DEFAULTS.bgSkillPicks);
    setBgAbilityAlt(DEFAULTS.bgAbilityAlt); setBgAbilityPicks(DEFAULTS.bgAbilityPicks);
    setArmorId(DEFAULTS.armorId); setHasShield(DEFAULTS.hasShield);
    setClassEquipPicks(DEFAULTS.classEquipPicks); setBgEquipPicks(DEFAULTS.bgEquipPicks);
    setPickedSpellIds(DEFAULTS.pickedSpellIds); setOtherSpells(DEFAULTS.otherSpells);
  };

  /* ------------------------------------------------------------------
     ANCESTRY
  ------------------------------------------------------------------- */
  const ancestry = content?.ancestries.find((a) => a.id === ancestryId) || null;
  const pickAncestry = (id) => { setAncestryId(id); setAncestryPicks({}); setAncestrySpellPicks({}); };

  const toggleAncestryPick = (ci, value, max) => {
    setAncestryPicks((prev) => {
      const cur = prev[ci] || [];
      const next = cur.includes(value) ? cur.filter((x) => x !== value)
        : cur.length < max ? [...cur, value] : cur;
      return { ...prev, [ci]: next };
    });
  };

  /* Every ancestry choice group, normalised to one shape a picker can
     render without knowing which of the three kinds it is. */
  const ancestryChoiceGroups = useMemo(() => {
    if (!ancestry) return [];
    return ancestry.choices.map((c, ci) => {
      if (c.kind === "skill") {
        return { ci, kind: "skill", label: "Skills", count: c.count,
          pool: c.any ? (content?.skills.map((s) => s.name) || []) : c.from };
      }
      if (c.kind === "lineage") {
        return { ci, kind: "lineage", label: "Lineage", count: c.count,
          pool: c.options.map((o) => o.id), optionsById: Object.fromEntries(c.options.map((o) => [o.id, o])) };
      }
      const slots = abilityChoiceSlots(c.spec);
      return { ci, kind: "ability", label: "Ability increases", count: slots.auto ? 0 : slots.count,
        pool: slots.from, slots, auto: slots.auto };
    });
  }, [ancestry, content]);

  const ancestryChoiceMade = ancestryChoiceGroups.every((g) =>
    g.auto || (ancestryPicks[g.ci] || []).length === g.count);

  const chosenLineagePick = useMemo(() => {
    const g = ancestryChoiceGroups.find((x) => x.kind === "lineage");
    if (!g) return null;
    const id = (ancestryPicks[g.ci] || [])[0];
    return id ? g.optionsById[id] : null;
  }, [ancestryChoiceGroups, ancestryPicks]);

  const ancestryAbilityBonuses = useMemo(() => {
    const out = { ...(ancestry?.abilityIncreases?.fixed || {}) };
    for (const g of ancestryChoiceGroups) {
      if (g.kind !== "ability") continue;
      const spec = ancestry.choices[g.ci].spec;
      Object.assign(out, sumIncreases(out, resolveAbilityChoice(spec, ancestryPicks[g.ci] || [])));
    }
    return out;
  }, [ancestry, ancestryChoiceGroups, ancestryPicks]);

  const ancestrySkillsGranted = useMemo(() => {
    const out = new Set(ancestry?.skills.fixed || []);
    for (const g of ancestryChoiceGroups) {
      if (g.kind !== "skill") continue;
      (ancestryPicks[g.ci] || []).forEach((s) => out.add(s));
    }
    return out;
  }, [ancestry, ancestryChoiceGroups, ancestryPicks]);

  /* additionalSpells blocks: unnamed ones (2014, and the always-on part
     of a 2024 species) plus whichever named lineage the character picked. */
  const activeAdditionalSpells = useMemo(() =>
    (ancestry?.additionalSpells || []).filter((b) => !b.name || b.name === chosenLineagePick?.name),
    [ancestry, chosenLineagePick]);

  /* ------------------------------------------------------------------
     ABILITIES
  ------------------------------------------------------------------- */
  const spent = useMemo(
    () => ABILITY_KEYS.reduce((s, k) => s + (POINT_COST[scores[k]] ?? 0), 0), [scores]);
  const remaining = POINT_BUDGET - spent;
  const baseScoreFor = (k) => (mode === "pointbuy" ? scores[k] : (arrayAssign[k] ?? 8));

  const setScore = (k, v) => {
    if (v < 8 || v > 15) return;
    const next = { ...scores, [k]: v };
    const cost = ABILITY_KEYS.reduce((s, x) => s + (POINT_COST[next[x]] ?? 0), 0);
    if (cost > POINT_BUDGET) return;
    setScores(next);
  };
  const assignArray = (k, val) => {
    const next = { ...arrayAssign };
    for (const key of Object.keys(next)) if (next[key] === val) delete next[key];
    if (val === "") delete next[k]; else next[k] = Number(val);
    setArrayAssign(next);
  };
  const usedArrayVals = Object.values(arrayAssign);

  /* ------------------------------------------------------------------
     CLASS + SUBCLASS
  ------------------------------------------------------------------- */
  const klass = content?.classes.find((c) => c.id === classId) || null;
  const subclass = klass?.subclasses.find((s) => s.id === subclassId) || null;
  const subclassOn = subclassActive(klass?.subclassLevel, level);

  const pickClass = (id) => {
    setClassId(id); setSubclassId(null); setSkillPicks([]); setOptionPicks({});
    setAsiPicks({}); setArmorId(null); setHasShield(false);
    setClassEquipPicks({}); setPickedSpellIds([]); setOtherSpells("");
  };

  const activeClassFeatures = useMemo(() => featuresAtLevel(klass?.features, level), [klass, level]);
  const activeSubclassFeatures = useMemo(
    () => (subclass && subclassOn ? featuresAtLevel(subclass.features, level) : []),
    [subclass, subclassOn, level]);

  const skillPool = useMemo(() => {
    if (!klass) return [];
    const from = klass.skillChoices.any ? (content?.skills.map((s) => s.name) || []) : klass.skillChoices.from;
    return from.filter((s) => !ancestrySkillsGranted.has(s));
  }, [klass, content, ancestrySkillsGranted]);
  const classSkillCount = klass?.skillChoices.count || 0;
  const skillsLeft = classSkillCount - skillPicks.length;
  const toggleSkill = (s) => {
    setSkillPicks((p) => p.includes(s) ? p.filter((x) => x !== s)
      : p.length < classSkillCount ? [...p, s] : p);
  };

  /* Fighting Style, Pact Boon, Metamagic, Eldritch Invocations and the
     rest — every currently-active feature that offers a pick, plus the
     one growing count the mapper can't yet resolve on its own (see the
     GROWING_CHOICE_KEYWORDS note above). */
  const optionChoiceGroups = useMemo(() => {
    if (!klass) return [];
    const groups = [];
    const seen = new Set();
    for (const f of [...activeClassFeatures, ...activeSubclassFeatures]) {
      f.choices.forEach((c, ci) => {
        const pool = c.options.filter((o) => o.resolved);
        if (!pool.length) return;
        groups.push({ key: `${f.id}-${ci}`, label: f.name, budget: c.count,
          pool: pool.map((o) => ({ id: o.id, name: o.name })) });
        seen.add(f.name.toLowerCase());
      });
    }
    for (const [label, keyword] of Object.entries(GROWING_CHOICE_KEYWORDS)) {
      if (seen.has(label)) continue;
      const entry = (klass.optionProgression || []).find((p) => p.name?.toLowerCase() === label);
      if (!entry) continue;
      const budget = tableColumnAt(klass.tables, keyword, level) ?? progressionAt(entry.byLevel, level);
      if (!budget) continue;
      /* Background and Advancement haven't happened yet at this step (Class
         now comes before both), so prerequisites are checked against
         ancestry-only scores rather than the full `prereqCtx` below —
         that one isn't assembled until Advancement, and referencing it
         here would be a forward reference (and the wrong number besides:
         no SRD option a class offers this early gates on an ability
         score background/leveling hasn't touched yet). */
      const pool = (content?.options || [])
        .filter((o) => o.types.some((t) => entry.types.includes(t)))
        .filter((o) => meetsPrerequisite(o.prerequisite, {
          level, abilityScore: (k) => baseScoreFor(k) + (ancestryAbilityBonuses[k] || 0),
          hasSpellcasting: false, pact: null, knownSpells: new Set(),
          ancestryBase: ancestry?.baseName, ancestryLineage: ancestry?.lineageName, proficient: () => true,
        }));
      if (pool.length) groups.push({ key: `growing-${keyword}`, label: entry.name, budget, pool });
    }
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klass, activeClassFeatures, activeSubclassFeatures, content, level, scores, arrayAssign, mode, ancestryAbilityBonuses]);

  const toggleOptionPick = (groupKey, id, max) => {
    setOptionPicks((prev) => {
      const cur = prev[groupKey] || [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id)
        : cur.length < max ? [...cur, id] : cur;
      return { ...prev, [groupKey]: next };
    });
  };

  /* Drop picks that stopped being legal — a class or subclass swap can
     take a choice group away entirely. */
  useEffect(() => {
    const validKeys = new Set(optionChoiceGroups.map((g) => g.key));
    setOptionPicks((prev) => {
      let changed = false;
      const next = {};
      for (const [k, v] of Object.entries(prev)) {
        if (!validKeys.has(k)) { changed = true; continue; }
        const g = optionChoiceGroups.find((x) => x.key === k);
        const validIds = new Set(g.pool.map((o) => o.id));
        const kept = v.filter((id) => validIds.has(id)).slice(0, g.budget);
        if (kept.length !== v.length) changed = true;
        next[k] = kept;
      }
      return changed ? next : prev;
    });
  }, [optionChoiceGroups]);

  const armorProfDerived = useMemo(
    () => deriveClassArmorProf(klass?.armorProf.fixed), [klass]);
  const armorProfCats = mergeArmorProf(armorProfDerived.categories, []);
  const weaponProf = useMemo(
    () => mergeWeaponProf(deriveClassWeaponProf(klass?.weaponProf.fixed, content?.weapons), []),
    [klass, content]);

  const armorOptions = useMemo(() => {
    const list = (content?.armor || []).filter((a) => armorProfCats.includes(a.category));
    return [null, ...list];
  }, [content, armorProfCats]);
  const armor = armorOptions.find((a) => a?.id === armorId) || null;
  const shieldAllowed = armorProfCats.includes("shield");
  const shieldOn = shieldAllowed && hasShield;

  /* ------------------------------------------------------------------
     BACKGROUND
  ------------------------------------------------------------------- */
  const background = content?.backgrounds.find((b) => b.id === bgId) || null;
  const pickBackground = (id) => { setBgId(id); setBgSkillPicks([]); setBgAbilityAlt(0); setBgAbilityPicks([]); setBgEquipPicks({}); };

  const bgSkillsGranted = useMemo(() => {
    const out = new Set(background?.skills.fixed || []);
    (background?.skills.choices[0] ? bgSkillPicks : []).forEach((s) => out.add(s));
    return out;
  }, [background, bgSkillPicks]);
  const bgSkillChoice = background?.skills.choices[0] || null;
  const bgSkillPool = useMemo(() => {
    if (!bgSkillChoice) return [];
    const already = new Set([...ancestrySkillsGranted, ...skillPicks]);
    const from = bgSkillChoice.any ? (content?.skills.map((s) => s.name) || []) : bgSkillChoice.from;
    return from.filter((s) => !already.has(s));
  }, [bgSkillChoice, ancestrySkillsGranted, skillPicks, content]);
  const bgSkillsLeft = bgSkillChoice ? bgSkillChoice.count - bgSkillPicks.length : 0;
  const toggleBgSkill = (s) => {
    setBgSkillPicks((p) => p.includes(s) ? p.filter((x) => x !== s)
      : p.length < bgSkillChoice.count ? [...p, s] : p);
  };
  /* The one deliberate exception to "filter, don't validate" — see
     CLAUDE.md. A fixed-skill background can collide with a class pick
     already made two steps earlier; that can't be filtered away, so it
     is surfaced instead. */
  const bgSkillOverlap = useMemo(() => {
    if (!background?.skills.fixed.length) return [];
    const already = new Set([...ancestrySkillsGranted, ...skillPicks]);
    return background.skills.fixed.filter((s) => already.has(s));
  }, [background, ancestrySkillsGranted, skillPicks]);

  const bgAbilitySpec = background?.abilityChoices?.alternatives[bgAbilityAlt] || null;
  const bgAbilitySlots = abilityChoiceSlots(bgAbilitySpec);
  const bgAbilityBonuses = useMemo(() =>
    background?.abilityChoices ? resolveAbilityChoice(bgAbilitySpec, bgAbilityPicks) : {},
    [background, bgAbilitySpec, bgAbilityPicks]);
  const bgFeat = useMemo(() => background?.feat
    ? content?.feats.find((f) => f.name === background.feat.name) || null : null,
    [background, content]);

  /* ------------------------------------------------------------------
     STARTING EQUIPMENT — one generic renderer for class and background
     groups alike. A "you get X of your choice" slot with no enumerated
     item (a weapon category, a focus type) is shown as its category
     text rather than drilled into a specific item — the app doesn't
     invent which one, it just doesn't invent one for you either.
  ------------------------------------------------------------------- */
  const resolveEquipItem = (it) => {
    if (it.currency) return { ...it, kind: "currency" };
    const rec = it.itemId
      ? (content?.weapons.find((w) => w.name === it.itemId)
        || content?.armor.find((a) => a.name === it.itemId)
        || content?.gear.find((g) => g.name === it.itemId))
      : null;
    return { ...it, resolved: rec || null };
  };

  const equipPickList = (groups, picks) => (groups || []).flatMap((g, gi) => {
    const key = picks[gi];
    const opt = g.options.find((o) => o.key === key) || g.options.find((o) => o.fixed) || g.options[0];
    return (opt?.items || []).map(resolveEquipItem);
  });

  const classEquipItems = useMemo(
    () => equipPickList(klass?.startingEquipment.groups, classEquipPicks), [klass, classEquipPicks]);
  const bgEquipItems = useMemo(
    () => equipPickList(background?.equipment, bgEquipPicks), [background, bgEquipPicks]);

  const carriedWeapons = useMemo(
    () => [...classEquipItems, ...bgEquipItems]
      .filter((it) => it.resolved?.kind === "weapon")
      .flatMap((it) => Array.from({ length: it.quantity || 1 }, () => it.resolved)),
    [classEquipItems, bgEquipItems]);

  const startingGold = useMemo(() => {
    const cp = [...classEquipItems, ...bgEquipItems]
      .filter((it) => it.currency).reduce((s, it) => s + it.valueCp, 0);
    return cp / 100;
  }, [classEquipItems, bgEquipItems]);

  /* ------------------------------------------------------------------
     ABILITY SCORES, all sources merged
  ------------------------------------------------------------------- */
  const asiBonuses = useMemo(() => {
    let out = {};
    for (const p of Object.values(asiPicks)) {
      if (p.abilityPicks?.length || p.abilityAuto) {
        out = sumIncreases(out, resolveAbilityChoice(p.abilitySpec, p.abilityPicks));
      }
    }
    return out;
  }, [asiPicks]);

  const allBonuses = useMemo(
    () => sumIncreases(ancestryAbilityBonuses, bgAbilityBonuses, asiBonuses),
    [ancestryAbilityBonuses, bgAbilityBonuses, asiBonuses]);

  const finalScore = (k) => sumFinalScore(k, baseScoreFor(k), allBonuses);
  const prereqScoreExcluding = (k, exclude) => sumFinalScore(k, baseScoreFor(k),
    Object.fromEntries(Object.entries(allBonuses).filter(([, v]) => v !== exclude)));

  /* ------------------------------------------------------------------
     ADVANCEMENT — Ability Score Improvement or a feat, at every level
     the class's own feature list says so (src/rules/progression.js
     asisEarned/nextAsiLevel read class.asiLevels, which the mapper
     already carries per-class and per-edition).
  ------------------------------------------------------------------- */
  const asiLevelsReached = (klass?.asiLevels || []).filter((l) => l <= level);
  const hasRealAsiFeat = !!content?.feats.some((f) => /^ability score improvement$/i.test(f.name));
  const SYNTHETIC_ASI = useMemo(() => ({
    id: "__asi", name: "Ability Score Improvement", source: null, page: null, category: null,
    repeatable: true, prerequisite: null, skills: { fixed: [], choices: [] },
    languages: { fixed: [], choices: [] }, tools: { fixed: [], choices: [] }, additionalSpells: [],
    text: "Increase one ability score by 2, or two ability scores by 1 each. Neither can go above 20.",
    blocks: [],
    ability: { fixed: {}, choices: [
      { kind: "pick", count: 1, amount: 2, from: ABILITY_KEYS },
      { kind: "pick", count: 2, amount: 1, from: ABILITY_KEYS },
    ] },
  }), []);

  const prereqCtx = {
    level, abilityScore: (k) => finalScore(k), hasSpellcasting: false, pact: null,
    knownSpells: new Set(pickedSpellIds), ancestryBase: ancestry?.baseName, ancestryLineage: ancestry?.lineageName,
    proficient: () => true,
  };

  const asiFeatPool = (excludeLevel) => {
    const taken = new Set(Object.entries(asiPicks)
      .filter(([lvl]) => Number(lvl) !== excludeLevel).map(([, p]) => p.featId));
    const base = hasRealAsiFeat ? content.feats.filter((f) => f.category === "G") : [SYNTHETIC_ASI, ...(content?.feats || [])];
    return base.filter((f) => (f.repeatable || !taken.has(f.id)) && meetsPrerequisite(f.prerequisite, prereqCtx));
  };

  const pickAsiFeat = (atLevel, featId) => {
    setAsiPicks((prev) => {
      const feat = asiFeatPool(atLevel).find((f) => f.id === featId);
      const next = { ...prev };
      if (!feat) { delete next[atLevel]; return next; }
      const slots = abilityChoiceSlots(feat.ability?.choices?.[0]);
      next[atLevel] = { featId, abilitySpec: feat.ability?.choices?.[0] || null,
        abilityAlt: 0, abilityPicks: [], abilityAuto: !feat.ability };
      return next;
    });
  };
  const pickAsiAlt = (atLevel, altIndex) => {
    setAsiPicks((prev) => {
      const feat = asiFeatPool(atLevel).find((f) => f.id === prev[atLevel]?.featId);
      const spec = feat?.ability?.choices?.[altIndex];
      return { ...prev, [atLevel]: { ...prev[atLevel], abilitySpec: spec, abilityAlt: altIndex, abilityPicks: [] } };
    });
  };
  const toggleAsiAbilityPick = (atLevel, key) => {
    setAsiPicks((prev) => {
      const entry = prev[atLevel];
      if (!entry) return prev;
      const slots = abilityChoiceSlots(entry.abilitySpec);
      const cur = entry.abilityPicks || [];
      const next = cur.includes(key) ? cur.filter((x) => x !== key)
        : cur.length < slots.count && prereqScoreExcluding(key, 0) + slots.amountAt(cur.length) <= 20
          ? [...cur, key] : cur;
      return { ...prev, [atLevel]: { ...entry, abilityPicks: next } };
    });
  };

  const asiComplete = (atLevel) => {
    const entry = asiPicks[atLevel];
    if (!entry) return false;
    if (entry.abilityAuto) return true;
    const slots = abilityChoiceSlots(entry.abilitySpec);
    return (entry.abilityPicks || []).length === slots.count;
  };
  const asiIncomplete = asiLevelsReached.some((l) => !asiComplete(l));

  /* ------------------------------------------------------------------
     DEFENSES — AC, saves, passives, attacks
  ------------------------------------------------------------------- */
  const scoresForRules = Object.fromEntries(ABILITY_KEYS.map((k) => [k, finalScore(k)]));
  const acRows = useMemo(() => {
    if (!ancestry) return [];
    return acCandidates({ armor, shield: shieldOn ? { ac: 2 } : null, scores: scoresForRules, formulas: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancestry, armor, shieldOn, scores, arrayAssign, mode, allBonuses]);
  const bestAC = acRows[0] || { value: 10, label: "Unarmoured", parts: "" };
  const armorClass = bestAC.value;

  const speed = ancestry?.speed.walk || 0;
  const pb = profBonus(level);

  const saveThrowRows = useMemo(() => klass
    ? savingThrowsOf({ scores: scoresForRules, saves: klass.saves, pb })
    : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [klass, pb, scores, arrayAssign, mode, allBonuses]);

  const allSkills = useMemo(
    () => new Set([...ancestrySkillsGranted, ...skillPicks, ...bgSkillsGranted]),
    [ancestrySkillsGranted, skillPicks, bgSkillsGranted]);

  const skillRows = useMemo(() => content
    ? skillTableOf({ skills: content.skills, scores: scoresForRules, pb, proficient: allSkills })
    : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content, pb, allSkills, scores, arrayAssign, mode, allBonuses]);

  const PASSIVE_NAMES = ["Perception", "Investigation", "Insight"];
  const passiveSkills = PASSIVE_NAMES.map((name) => {
    const row = skillRows.find((s) => s.name === name);
    return { name, value: row ? passiveScore(row) : 10 };
  });
  const initiative = ancestry ? finalScore("dex") - 10 : 0; // placeholder, replaced below

  const hitPoints = useMemo(() => klass
    ? hitPointsOf({ hitDie: klass.hitDie, level, conScore: finalScore("con") })
    : 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [klass, level, scores, arrayAssign, mode, allBonuses]);

  const attackRows = useMemo(() => {
    if (!klass) return [];
    const grouped = groupWeapons(carriedWeapons);
    const rows = grouped.map(({ weapon: w, qty }) => {
      const proficient = isWeaponProficient(w, weaponProf);
      const abKey = weaponAbility(w, scoresForRules);
      const atk = attackBonus(w, { scores: scoresForRules, pb, proficient });
      const dmgMod = damageBonus(w, scoresForRules);
      const notes = (w.properties || []).map((p) => p.label);
      if (w.versatileDmg) notes.push(`Versatile — ${w.versatileDmg}${fmt(dmgMod)} two-handed`);
      (w.mastery || []).forEach((m) => notes.push(`Mastery: ${m.name}`));
      return {
        key: w.id, name: qty > 1 ? `${w.name} ×${qty}` : w.name,
        range: w.range ? `${w.range.label.replace("/", " / ")} ft` : (w.weaponKind === "ranged" ? "—" : "5 ft"),
        hitOrDC: fmt(atk), damage: w.dmg ? `${w.dmg}${fmt(dmgMod)}` : "—",
        dmgType: w.dmgType, notes: notes.join(", "), proficient,
      };
    });
    const strMod = mod(finalScore("str"));
    rows.push({ key: "unarmed", name: "Unarmed Strike", range: "5 ft",
      hitOrDC: fmt(strMod + pb), damage: `${1 + strMod}`, dmgType: "bludgeoning", notes: "", proficient: true });
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klass, carriedWeapons, weaponProf, pb, scores, arrayAssign, mode, allBonuses]);

  /* ------------------------------------------------------------------
     SPELLCASTING
  ------------------------------------------------------------------- */
  const casting = useMemo(() => {
    if (!klass?.casting) return null;
    const cst = klass.casting;
    const ability = cst.ability;
    const stats = spellcastingStats({ ability, scores: scoresForRules, pb });
    const slots = spellSlots(cst, level);
    const pact = pactSlots(cst, level);
    if (!slots.length && !pact) return { pending: true, label: `${klass.name} spellcasting` };
    return {
      label: `${klass.name} spellcasting`, ability, abMod: stats.abilityMod,
      saveDC: stats.saveDC, attack: stats.attack,
      cantrips: cantripsKnown(cst, level) || null,
      known: cst.prepares === "known" ? (spellsKnown(cst, level) || null) : null,
      prepared: cst.prepares === "prepared" ? preparedCount(cst, level, scoresForRules[ability]) : null,
      spellbook: cst.prepares === "spellbook" ? spellbookSize(level) : null,
      slots, pact,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klass, level, pb, scores, arrayAssign, mode, allBonuses]);

  /* Ancestry-granted spells — fixed and (High Elf's bonus cantrip, the
     2024 lineage traits) picked. Never spend a slot, never touch the
     Spells step's budget — a character is free to also learn the same
     spell the ordinary way (a Cleric who happens to be a Tiefling can
     still put Thaumaturgy on their prepared list), so this never filters
     `availableSpells`. Computed before it only because a few other memos
     below read `ancestry.name`/`finalScore` and want it defined early. */
  const ancestrySpellGrants = useMemo(() => {
    if (!content) return [];
    const rows = [];
    activeAdditionalSpells.forEach((block, bi) => {
      const abilityMod = block.ability && typeof block.ability === "string" ? mod(finalScore(block.ability)) : null;
      block.grants.forEach((g, gi) => {
        if (level < (g.atLevel ?? 1)) return;
        g.spells.forEach((s) => {
          const sp = content.spells.find((x) => x.name.toLowerCase() === s.name.toLowerCase());
          if (sp) rows.push({ sp, from: ancestry.name, use: grantCadence(g), abilityMod, key: `${bi}-fixed-${s.name}` });
        });
        g.choices.forEach((c, ci) => {
          const key = `${bi}-${gi}-${ci}`;
          const picks = ancestrySpellPicks[key] || [];
          const pool = spellsMatchingFilter(content.spells, c.filter);
          picks.forEach((id) => {
            const sp = pool.find((x) => x.id === id);
            if (sp) rows.push({ sp, from: ancestry.name, use: grantCadence(g), abilityMod, key: `${key}-${id}`, chosen: true });
          });
        });
      });
    });
    return rows.sort((a, b) => a.sp.level - b.sp.level || a.sp.name.localeCompare(b.sp.name));
  }, [content, activeAdditionalSpells, ancestry, level, ancestrySpellPicks]); // eslint-disable-line react-hooks/exhaustive-deps

  const highestSlot = casting ? (casting.pact ? casting.pact.level : casting.slots.length) : 0;
  const availableSpells = useMemo(() => {
    if (!content || !klass || !casting || casting.pending) return [];
    return content.spells.filter((sp) => sp.classLists.includes(klass.id)
      && (sp.level === 0 || sp.level <= highestSlot));
  }, [content, klass, casting, highestSlot]);

  const cantripBudget = casting?.cantrips ?? 0;
  const spellBudget = casting?.known ?? casting?.prepared ?? casting?.spellbook ?? 0;
  const pickedSpells = useMemo(
    () => (content?.spells || []).filter((sp) => pickedSpellIds.includes(sp.id))
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
    [content, pickedSpellIds]);
  const pickedCantrips = pickedSpells.filter((sp) => sp.level === 0);
  const pickedLeveled = pickedSpells.filter((sp) => sp.level > 0);
  const toggleSpell = (id) => {
    const sp = content?.spells.find((x) => x.id === id);
    if (!sp) return;
    const isCantrip = sp.level === 0;
    const current = isCantrip ? pickedCantrips.length : pickedLeveled.length;
    const budget = isCantrip ? cantripBudget : spellBudget;
    setPickedSpellIds((p) => p.includes(id) ? p.filter((x) => x !== id)
      : current >= budget ? p : [...p, id]);
  };

  const ancestrySpellChoiceGroups = useMemo(() => {
    if (!content) return [];
    const groups = [];
    activeAdditionalSpells.forEach((block, bi) => {
      block.grants.forEach((g, gi) => {
        if (level < (g.atLevel ?? 1)) return;
        g.choices.forEach((c, ci) => {
          const key = `${bi}-${gi}-${ci}`;
          groups.push({ key, count: c.count, pool: spellsMatchingFilter(content.spells, c.filter) });
        });
      });
    });
    return groups;
  }, [content, activeAdditionalSpells, level]);

  const toggleAncestrySpellPick = (key, id, max) => {
    setAncestrySpellPicks((prev) => {
      const cur = prev[key] || [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < max ? [...cur, id] : cur;
      return { ...prev, [key]: next };
    });
  };

  /* ------------------------------------------------------------------
     FEATURES, ACTIONS, APPENDIX
  ------------------------------------------------------------------- */
  const chosenFeats = useMemo(() => {
    const out = [];
    for (const [atLevel, entry] of Object.entries(asiPicks)) {
      const feat = asiFeatPool(Number(atLevel)).find((f) => f.id === entry.featId)
        || (entry.featId === "__asi" ? SYNTHETIC_ASI : null);
      if (!feat) continue;
      const slots = abilityChoiceSlots(entry.abilitySpec);
      const bonus = entry.abilityPicks?.length
        ? entry.abilityPicks.map((k, i) => `+${slots.amountAt(i)} ${k.toUpperCase()}`).join(", ") : null;
      out.push({ feat, from: `Level ${atLevel}`, abilityPicks: entry.abilityPicks, bonus });
    }
    if (bgFeat) out.push({ feat: bgFeat, from: background.name, abilityPicks: [], bonus: null });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asiPicks, bgFeat, background]);

  const actions = useMemo(() => {
    const out = [];
    (ancestry?.traits || []).forEach((t) => {
      if (t.action) out.push({ name: t.name, source: ancestry.name, action: t.action, text: t.text,
        section: `Ancestry traits — ${ancestry.name}` });
    });
    activeClassFeatures.forEach((f) => {
      if (f.action) out.push({ name: f.name, source: klass.name, action: f.action, text: f.text,
        section: `${klass.name} features` });
    });
    activeSubclassFeatures.forEach((f) => {
      if (f.action) out.push({ name: f.name, source: subclass.name, action: f.action, text: f.text,
        section: `${subclass.name}` });
    });
    return out;
  }, [ancestry, klass, activeClassFeatures, subclass, activeSubclassFeatures]);

  const appendix = useMemo(() => {
    const out = [];
    for (const { feat, from, bonus } of chosenFeats) {
      out.push({ group: "Feats", name: `${feat.name}${bonus ? ` (${bonus})` : ""}`, text: `${from}. ${feat.text}` });
    }
    const spellEntry = (sp) => ({ group: "Spells", name: sp.name,
      text: `${sp.level === 0 ? "Cantrip" : `Level ${sp.level}`} ${sp.school}. ` +
        `Casting time ${sp.time}. Range ${sp.range}. Components ${sp.components}. Duration ${sp.duration}.` +
        `${sp.ritual ? " Ritual." : ""}${sp.concentration ? " Concentration." : ""} ${sp.text}` +
        `${sp.higherLevels ? ` At Higher Levels. ${sp.higherLevels}` : ""}` });
    pickedSpells.forEach((sp) => out.push(spellEntry(sp)));
    ancestrySpellGrants
      .filter((g) => !pickedSpells.some((c) => c.id === g.sp.id))
      .forEach((g) => out.push({ ...spellEntry(g.sp), group: "Ancestry spells" }));
    return out;
  }, [chosenFeats, pickedSpells, ancestrySpellGrants]);

  /* ------------------------------------------------------------------
     STEPS, NAV, VALIDATION
  ------------------------------------------------------------------- */
  const hasSpellStep = !!(casting && !casting.pending);
  const STEPS = useMemo(() => buildSteps(hasSpellStep), [hasSpellStep]);
  const here = STEPS[step] || STEPS[STEPS.length - 1];
  const at = (nm) => STEPS.indexOf(nm);

  /* Whether a named step (not necessarily the current one) is complete —
     drives both the Next button and which rail steps are done/jumpable. */
  const stepComplete = (name) => {
    if (name === "Edition") return !!content;
    if (name === "Species/Race") return !!ancestry && ancestryChoiceMade;
    if (name === "Abilities") return mode === "pointbuy" ? true : Object.keys(arrayAssign).length === 6;
    if (name === "Class") {
      if (!klass) return false;
      if (skillsLeft > 0) return false;
      if (optionChoiceGroups.some((g) => (optionPicks[g.key] || []).length < g.budget)) return false;
      if (klass.subclassLevel != null && subclassOn && !subclass) return false;
      return true;
    }
    if (name === "Background") {
      if (!background) return false;
      if (bgSkillChoice && bgSkillPicks.length !== bgSkillChoice.count && bgSkillPool.length >= bgSkillChoice.count) return false;
      if (background.abilityChoices && !bgAbilitySlots.auto && bgAbilityPicks.length !== bgAbilitySlots.count) return false;
      return true;
    }
    if (name === "Advancement") return !asiIncomplete;
    return true;
  };
  const canAdvance = () => stepComplete(here);
  /* Reachable by clicking a rail step directly: whatever that step's own
     render actually needs to show something, not "every step before it
     is done" — Class and Abilities only read `content` (an ancestry
     bonus is just +0 until one's picked) and Advancement/Background
     degrade to their own "pick X first" stub when visited early, so none
     of those gate on anything upstream. Defenses, Inventory and Sheet do
     read ancestry-derived numbers (AC, proficiencies, the whole sheet)
     and render nothing without it, so those stay gated on ancestry;
     Spells on having a caster. */
  const stepPrereqOk = (name) => {
    if (name === "Edition") return true;
    if (name === "Defenses" || name === "Inventory" || name === "Sheet") return !!ancestry;
    if (name === "Spells") return !!casting;
    return !!content;
  };
  const stepReachable = (i) => stepPrereqOk(STEPS[i]);
  /* What the rail tooltip says on a step it won't let you jump to yet —
     names the actual missing thing, same list stepPrereqOk checks. */
  const stepLockedReason = (name) => {
    if (name === "Edition") return null;
    if (name === "Defenses" || name === "Inventory" || name === "Sheet") return ancestry ? null : "Pick a species first";
    if (name === "Spells") return casting ? null : "Pick a spellcasting class first";
    return content ? null : "Pick an edition first";
  };
  /* Gate every download on the whole character being finished, not just
     reached — the Sheet step itself has no completeness rule of its own
     (stepComplete falls through to true for it), so it's excluded here. */
  const allStepsDone = STEPS.every((s) => s === "Sheet" || stepComplete(s));

  /* ------------------------------------------------------------------
     PERSISTENCE
  ------------------------------------------------------------------- */
  const snapshot = useMemo(() => ({
    edition, step, maxStep, ancestryId, ancestryPicks, ancestrySpellPicks, mode, scores, arrayAssign,
    name, backstory, classId, level, subclassId, skillPicks, optionPicks, asiPicks,
    bgId, bgSkillPicks, bgAbilityAlt, bgAbilityPicks, armorId, hasShield,
    classEquipPicks, bgEquipPicks, pickedSpellIds, otherSpells,
  }), [edition, step, maxStep, ancestryId, ancestryPicks, ancestrySpellPicks, mode, scores, arrayAssign,
    name, backstory, classId, level, subclassId, skillPicks, optionPicks, asiPicks,
    bgId, bgSkillPicks, bgAbilityAlt, bgAbilityPicks, armorId, hasShield,
    classEquipPicks, bgEquipPicks, pickedSpellIds, otherSpells]);

  useEffect(() => { saveSnapshot(snapshot); }, [snapshot]);

  const resetAll = () => {
    clearSaved();
    pickEdition(DEFAULTS.edition);
    setStep(DEFAULTS.step);
    setMaxStep(DEFAULTS.step);
    setName(DEFAULTS.name); setBackstory(DEFAULTS.backstory);
    setShowResetConfirm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ------------------------------------------------------------------
     SHEET CONTEXT + EXPORT — same contract all three routes and the
     on-screen summary read. See CLAUDE.md's Export section.
  ------------------------------------------------------------------- */
  const resolved = ancestry ? {
    size: ancestry.size, darkvision: ancestry.darkvision || 0, blindsight: 0,
    speed: ancestry.speed.walk || 0,
    languages: ancestry.languages.fixed,
    traits: ancestry.traits,
    droppedTraits: [],
    asi: allBonuses,
  } : null;

  const sheetCtx = {
    ancestry, klass, level, subclass, subclassReady: subclassOn, background, name, resolved,
    armorClass, hitPoints, speed, initiative: mod(finalScore("dex")), passivePerception: passiveSkills[0]?.value ?? 10,
    passiveSkills, actions, pb, armor: armor || { id: "none", name: "None" }, shieldOn,
    savingThrows: saveThrowRows.map((s) => ({ key: s.key, label: ABILITIES.find((a) => a.key === s.key)?.label || s.key,
      proficient: s.proficient, value: s.value })),
    skillTable: skillRows, casting, chosenSpells: pickedSpells, otherSpells, appendix,
    bgChoice: null, finalScore, attackRows, carriedWeapons, masteryEnabled: true,
    startingGold,
    gearList: [...classEquipItems, ...bgEquipItems]
      .filter((it) => !it.currency && it.resolved?.kind !== "weapon" && it.resolved?.kind !== "armor")
      .map((it) => `${it.name}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`),
    toolsList: background?.tools.fixed || [],
    ancestrySpells: ancestrySpellGrants.map((g) => ({ ...g.sp, key: g.key, from: g.from, use: g.use,
      ability: g.abilityMod != null ? casting?.ability : null,
      saveDC: g.abilityMod != null ? 8 + pb + g.abilityMod : null,
      attack: g.abilityMod != null ? pb + g.abilityMod : null })),
    chosenFeats: chosenFeats.map(({ feat, from, bonus }) => ({ id: feat.id, name: feat.name, text: feat.text, feat, from, bonus })),
    classFeatures: [...activeClassFeatures, ...activeSubclassFeatures].map((f) => ({ level: f.level, name: f.name, text: f.text })),
    backstory,
  };

  const downloadSheet = () => {
    const blob = new Blob([buildSheetHTML(sheetCtx)], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = sheetFileName(name, "html");
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportCharacter = () => {
    const blob = new Blob([buildCharacterExport(snapshot)], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = characterFileName(name);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const [pdfState, setPdfState] = useState("idle");
  const runPdf = async (fn) => {
    setPdfState("working");
    try { await fn(); setPdfState("idle"); }
    catch (e) { console.error(e); setPdfState("error"); }
  };
  const saveForIOS = () => runPdf(() => saveSheetRasterPDF(sheetCtx));
  const saveVector = () => runPdf(() => saveSheetPDF(sheetCtx));

  const printSheet = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed"; iframe.style.left = "-10000px"; iframe.style.top = "0";
    iframe.style.width = "794px"; iframe.style.height = "1123px"; iframe.style.border = "0";
    document.body.appendChild(iframe);
    document.title = sheetFileBase(name);
    const cleanup = () => {
      document.title = APP_TITLE;
      if (iframe.parentNode) document.body.removeChild(iframe);
    };
    iframe.onload = () => {
      iframe.contentWindow.addEventListener("afterprint", cleanup);
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(cleanup, 60000);
    };
    iframe.srcdoc = buildSheetHTML(sheetCtx, { interactive: false });
  };

  /* A copy-pasteable plain-text summary — same information as the sheet,
     no layout, for pasting into a chat or a VTT character bio. */
  const sheetText = useMemo(() => {
    if (!ancestry) return "";
    const L = [];
    const head = klass ? `${ancestry.name} ${klass.name} ${level}` : ancestry.name;
    L.push(`${name || "Unnamed"} — ${head}${background ? ` · ${background.name}` : ""}`);
    if (subclass && subclassOn) L.push(`${klass.subclassTitle || "Subclass"}: ${subclass.name}`);
    L.push("");
    L.push(ABILITIES.map(({ key }) =>
      `${key.toUpperCase()} ${finalScore(key)} (${fmt(mod(finalScore(key)))})`).join("   "));
    L.push("");
    if (klass) {
      L.push(`Hit points ${hitPoints}   Hit die d${klass.hitDie}   Proficiency ${fmt(pb)}`);
      L.push(`AC ${armorClass} (${bestAC.label})   Initiative ${fmt(mod(finalScore("dex")))}`);
      L.push(saveThrowRows.map((s) => `${s.key.toUpperCase()} ${fmt(s.value)}${s.proficient ? "*" : " "}`).join("   "));
      L.push("(* = proficient)");
    }
    L.push(`Speed ${speed}   Size ${ancestry.size}${ancestry.darkvision ? `   Darkvision ${ancestry.darkvision}` : ""}`);
    L.push(`Languages: ${ancestry.languages.fixed.join(", ")}`);
    if (allSkills.size) L.push(`Skills: ${[...allSkills].join(", ")}`);
    if (casting && !casting.pending) {
      L.push("");
      L.push(casting.label.toUpperCase());
      L.push(`Save DC ${casting.saveDC}   Attack ${fmt(casting.attack)}   Ability ${casting.ability.toUpperCase()}`);
      if (casting.slots.length) L.push(`Slots: ${casting.slots.map((n, i) => `${i + 1}${["st", "nd", "rd"][i] || "th"} x${n}`).join("   ")}`);
      if (casting.pact) L.push(`Pact Magic: ${casting.pact.count} slots at level ${casting.pact.level}`);
    }
    if (chosenFeats.length) {
      L.push("");
      L.push("FEATS");
      chosenFeats.forEach(({ feat, from, bonus }) => L.push(`• ${feat.name}${bonus ? ` (${bonus})` : ""} — ${from}`));
    }
    L.push("");
    L.push("ANCESTRY TRAITS");
    ancestry.traits.forEach((t) => L.push(`• ${t.name}`));
    if (klass) {
      L.push("");
      L.push(`${klass.name.toUpperCase()} FEATURES`);
      [...activeClassFeatures, ...activeSubclassFeatures].forEach((f) => L.push(`• ${f.name}`));
    }
    if (background) {
      L.push("");
      L.push("BACKGROUND");
      if (background.feature) L.push(`• ${background.feature.name}`);
      L.push(`Starting gold: ${startingGold} gp`);
    }
    if (backstory.trim()) { L.push(""); L.push("BACKSTORY"); L.push(backstory.trim()); }
    return L.join("\n");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancestry, klass, level, subclass, subclassOn, background, name, scores, arrayAssign, mode, allBonuses,
    hitPoints, pb, armorClass, bestAC, saveThrowRows, speed, allSkills, casting, chosenFeats,
    activeClassFeatures, activeSubclassFeatures, startingGold, backstory]);

  /* ------------------------------------------------------------------
     RENDER
  ------------------------------------------------------------------- */
  return (
    <div className="byo-root">
      <div className="byo-wrap">
        <h1 className="byo-h1">Bring Your Own 5e</h1>
        <p className="byo-h2">Character Creator</p>
        <p className="byo-sub">{STEPS.length} steps. Only legal options are shown.</p>

        <div className="byo-rail">
          {STEPS.map((s, i) => {
            /* A step with no completeness rule of its own (Advancement at
               level 1, Defenses, Inventory, Sheet) falls through to "true"
               in stepComplete — right for gating Next, wrong for the rail:
               it would show jade before you've ever been there. Only count
               a step done once you've actually reached it. */
            const state = i === step ? "is-now" : i <= maxStep && stepComplete(s) ? "is-done" : "is-todo";
            const jumpable = i !== step && stepReachable(i);
            const lockedReason = !jumpable && i !== step ? stepLockedReason(s) : null;
            return (
              <button key={s} type="button" className={`byo-chev ${state}`} title={lockedReason || s}
                      disabled={!jumpable}
                      onClick={() => { setStep(i); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <span className="byo-chev-n">{i + 1}</span>
                <span className="byo-chev-label">{s}</span>
              </button>
            );
          })}
        </div>

        {ancestry && step > at("Species/Race") && (
          <div className="byo-chip">
            <span className="byo-chip-k">Species/Race</span>
            <span className="byo-chip-v">{ancestry.name}</span>
            <button className="byo-chip-b" onClick={() => setStep(at("Species/Race"))}>Change</button>
          </div>
        )}
        {klass && step > at("Class") && (
          <div className="byo-chip">
            <span className="byo-chip-k">Class</span>
            <span className="byo-chip-v">{klass.name} {level}{subclass && subclassOn ? ` · ${subclass.name}` : ""}</span>
            <button className="byo-chip-b" onClick={() => setStep(at("Class"))}>Change</button>
          </div>
        )}
        {background && step > at("Background") && (
          <div className="byo-chip">
            <span className="byo-chip-k">Background</span>
            <span className="byo-chip-v">{background.name}</span>
            <button className="byo-chip-b" onClick={() => setStep(at("Background"))}>Change</button>
          </div>
        )}

        {ancestry && step >= at("Abilities") && (
          <div className="byo-sum">
            {ABILITIES.map(({ key }) => (
              <div className="byo-sum-c" key={key}>
                <div className="byo-sum-k">{key.toUpperCase()}</div>
                <div className="byo-sum-v">{fmt(mod(finalScore(key)))}</div>
                <div className="byo-sum-m">{finalScore(key)}</div>
              </div>
            ))}
          </div>
        )}

        <ErrorBoundary key={here} title="This step hit an error">
          {/* ---------------- EDITION ---------------- */}
          {here === "Edition" && (
            <div className="byo-panel">
              <h3>Ruleset</h3>
              <p className="byo-note" style={{ marginBottom: 10 }}>
                Both are the free System Reference Document — CC-BY-4.0, no other content is
                shipped. Pick one to build against; switching later restarts the character.
              </p>
              <div className="byo-choice">
                {EDITIONS.map((ed) => (
                  <button key={ed} className={`byo-opt ${edition === ed ? "is-sel" : ""}`}
                          onClick={() => pickEdition(ed)} aria-pressed={edition === ed}>
                    {EDITION_LABEL[ed]}
                  </button>
                ))}
              </div>
              {contentError && (
                <p className="byo-warn">Couldn't load {EDITION_LABEL[edition]}: {String(contentError.message || contentError)}.</p>
              )}
              {!content && !contentError && <p className="byo-note" style={{ marginTop: 10 }}>Loading…</p>}
            </div>
          )}

          {/* ---------------- SPECIES/RACE ---------------- */}
          {here === "Species/Race" && content && (
            <>
              {content.ancestries.map((a) => {
                const sel = a.id === ancestryId;
                const asiStr = a.abilityIncreases
                  ? Object.entries(a.abilityIncreases.fixed).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(" ")
                  : null;
                return (
                  <button key={a.id} className={`byo-card ${sel ? "is-sel" : ""}`}
                          onClick={() => pickAncestry(a.id)} aria-pressed={sel}>
                    <div className="byo-card-top">
                      <span className="byo-card-name">{a.name}</span>
                      <span className="byo-card-kind">{a.size}{a.page ? ` · p.${a.page}` : ""}</span>
                    </div>
                    <div className="byo-pills" style={{ marginTop: 8 }}>
                      {asiStr ? <span className="byo-pill">{asiStr}</span>
                        : <span className="byo-pill alt">increases come from background</span>}
                      <span className="byo-pill alt">speed {a.speed.walk}</span>
                      {a.darkvision > 0 && <span className="byo-pill alt">darkvision {a.darkvision}</span>}
                    </div>
                  </button>
                );
              })}

              {ancestry && ancestryChoiceGroups.filter((g) => !g.auto).map((g) => (
                <React.Fragment key={g.ci}>
                  <Rule />
                  <div className="byo-panel">
                    <h3>{g.label} <span className="byo-count">{(ancestryPicks[g.ci] || []).length}/{g.count} chosen</span></h3>
                    <div className="byo-skills">
                      {g.pool.map((v) => {
                        const id = g.kind === "lineage" ? v : v;
                        const label = g.kind === "lineage" ? g.optionsById[v].name : v;
                        const on = (ancestryPicks[g.ci] || []).includes(id);
                        const full = !on && (ancestryPicks[g.ci] || []).length >= g.count;
                        return (
                          <button key={id} className={`byo-skill ${on ? "is-sel" : ""}`}
                                  onClick={() => toggleAncestryPick(g.ci, id, g.count)} disabled={full}
                                  aria-pressed={on}>{label}{g.kind === "ability" ? ` +${g.slots.amountAt((ancestryPicks[g.ci] || []).indexOf(id) >= 0 ? (ancestryPicks[g.ci] || []).indexOf(id) : (ancestryPicks[g.ci] || []).length)}` : ""}</button>
                        );
                      })}
                    </div>
                  </div>
                </React.Fragment>
              ))}

              {ancestry && (
                <>
                  <Rule />
                  <div className="byo-panel">
                    <h3>Traits</h3>
                    {ancestry.traits.map((t) => (
                      <div className="byo-trait" key={t.name}>
                        <div className="byo-trait-n">{t.name}</div>
                        <div className="byo-trait-t">{t.text}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ---------------- ABILITIES ---------------- */}
          {here === "Abilities" && content && (
            <>
              {!ancestry && (
                <p className="byo-note" style={{ marginBottom: 14 }}>
                  No species picked yet — any ability bonuses it grants will show up here once you pick one.
                </p>
              )}
              <div className="byo-choice" style={{ marginBottom: 14 }}>
                <button className={`byo-opt ${mode === "pointbuy" ? "is-sel" : ""}`} onClick={() => setMode("pointbuy")}>Point buy</button>
                <button className={`byo-opt ${mode === "array" ? "is-sel" : ""}`} onClick={() => setMode("array")}>Standard array</button>
              </div>

              {mode === "pointbuy" && (
                <>
                  <div className="byo-budget">
                    <span className="byo-budget-l">Points left</span>
                    <span className={`byo-budget-n ${remaining === 0 ? "zero" : ""}`}>{remaining}</span>
                  </div>
                  <div className="byo-suggest">
                    <div>
                      <div className="byo-suggest-t">Not sure where to put these?</div>
                      <div className="byo-suggest-s">
                        {klass ? `Leans into what a ${klass.name} needs most.` : "Pick a class first for a spread built around it."} You can change it after.
                      </div>
                    </div>
                    <button className="byo-opt" disabled={!klass}
                            onClick={() => setScores(recommendedSpread(classAbilityPriority(klass)))}>Use it</button>
                  </div>
                </>
              )}

              <div className="byo-panel">
                {ABILITIES.map(({ key, label }) => {
                  const bonus = allBonuses[key] || 0;
                  const base = baseScoreFor(key);
                  return (
                    <div className="byo-row" key={key}>
                      <span className="byo-row-label">{label}</span>
                      {mode === "pointbuy" ? (
                        <div className="byo-step">
                          <button className="byo-btn-sq" onClick={() => setScore(key, base - 1)} disabled={base <= 8} aria-label={`Lower ${label}`}>−</button>
                          <span className="byo-num">{base}</span>
                          <button className="byo-btn-sq" onClick={() => setScore(key, base + 1)}
                                  disabled={base >= 15 || (POINT_COST[base + 1] - POINT_COST[base]) > remaining}
                                  aria-label={`Raise ${label}`}>+</button>
                        </div>
                      ) : (
                        <select className="byo-sel" value={arrayAssign[key] ?? ""} onChange={(e) => assignArray(key, e.target.value)} aria-label={label}>
                          <option value="">—</option>
                          {STANDARD_ARRAY.map((v, i) => (
                            <option key={i} value={v} disabled={usedArrayVals.includes(v) && arrayAssign[key] !== v}>{v}</option>
                          ))}
                        </select>
                      )}
                      <span className="byo-arrow">{bonus ? `+${bonus} →` : "→"}</span>
                      <span className="byo-final">{fmt(mod(base + bonus))}</span>
                      <span className="byo-mod">{base + bonus}</span>
                    </div>
                  );
                })}
              </div>
              <p className="byo-note">Ancestry/background bonuses already applied. Point buy caps each score at 15 before bonuses.</p>
            </>
          )}

          {/* ---------------- CLASS ---------------- */}
          {here === "Class" && content && (
            <>
              <div className="byo-panel">
                <h3>Level</h3>
                <div className="byo-step">
                  <button className="byo-btn-sq" onClick={() => setLevel((l) => Math.max(1, l - 1))} disabled={level <= 1} aria-label="Lower level">−</button>
                  <span className="byo-num">{level}</span>
                  <button className="byo-btn-sq" onClick={() => setLevel((l) => Math.min(MAX_LEVEL, l + 1))} disabled={level >= MAX_LEVEL} aria-label="Raise level">+</button>
                </div>
              </div>

              {content.classes.map((c) => {
                const sel = c.id === classId;
                return (
                  <button key={c.id} className={`byo-card ${sel ? "is-sel" : ""}`} style={{ marginTop: 8 }}
                          onClick={() => pickClass(c.id)} aria-pressed={sel}>
                    <div className="byo-card-top">
                      <span className="byo-card-name">{c.name}</span>
                      <span className="byo-card-kind">d{c.hitDie} hit die</span>
                    </div>
                    <p className="byo-card-blurb">
                      Saves: {c.saves.map((s) => s.toUpperCase()).join(", ")} · {c.skillChoices.count} skills ·{" "}
                      {c.subclasses.length ? `${c.subclassTitle || "subclass"} at ${c.subclassLevel}` : "no subclass"}
                    </p>
                  </button>
                );
              })}

              {klass && (
                <>
                  <Rule />
                  <div className="byo-panel">
                    <h3>{klass.subclassTitle || "Subclass"}</h3>
                    {!subclassOn ? (
                      <p className="byo-note">{klass.name}s choose at level {klass.subclassLevel}. You're level {level}, so nothing to decide yet.</p>
                    ) : (
                      klass.subclasses.map((s) => {
                        const sel = s.id === subclassId;
                        const now = featuresAtLevel(s.features, level);
                        return (
                          <button key={s.id} className={`byo-card ${sel ? "is-sel" : ""}`} style={{ marginTop: 8 }}
                                  onClick={() => { setSubclassId(s.id); setOptionPicks({}); }} aria-pressed={sel}>
                            <div className="byo-card-top">
                              <span className="byo-card-name">{s.name}</span>
                              {s.page && <span className="byo-card-kind">p.{s.page}</span>}
                            </div>
                            <div className="byo-pills" style={{ marginTop: 8 }}>
                              {now.length ? now.map((f) => <span className="byo-pill" key={f.id}>{f.name}</span>)
                                : <span className="byo-pill alt">no features yet</span>}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="byo-panel">
                    <h3>Skills <span className="byo-count">{skillsLeft > 0 ? `${skillsLeft} to go` : "done"}</span></h3>
                    {ancestrySkillsGranted.size > 0 && (
                      <p className="byo-note" style={{ marginBottom: 10 }}>
                        You already have {[...ancestrySkillsGranted].join(" and ")} for free, so {ancestrySkillsGranted.size > 1 ? "they aren't" : "it isn't"} listed below.
                      </p>
                    )}
                    <div className="byo-skills">
                      {skillPool.map((s) => {
                        const on = skillPicks.includes(s);
                        const full = !on && skillPicks.length >= classSkillCount;
                        return (
                          <button key={s} className={`byo-skill ${on ? "is-sel" : ""}`} onClick={() => toggleSkill(s)}
                                  disabled={full} aria-pressed={on}>{s}</button>
                        );
                      })}
                    </div>
                  </div>

                  {optionChoiceGroups.map((g) => (
                    <div className="byo-panel" key={g.key}>
                      <h3>{g.label} <span className="byo-count">
                        {(optionPicks[g.key] || []).length}/{g.budget}
                      </span></h3>
                      <div className="byo-skills">
                        {g.pool.map((o) => {
                          const on = (optionPicks[g.key] || []).includes(o.id);
                          const full = !on && (optionPicks[g.key] || []).length >= g.budget;
                          return (
                            <button key={o.id} className={`byo-skill ${on ? "is-sel" : ""}`}
                                    onClick={() => toggleOptionPick(g.key, o.id, g.budget)} disabled={full}
                                    aria-pressed={on}>{o.name}</button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="byo-panel">
                    <h3>Proficiencies</h3>
                    <div className="byo-row"><span className="byo-row-label">Armor</span>
                      <span className="byo-mod" style={{ width: "auto" }}>{klass.armorProf.fixed.join(", ") || "None"}</span></div>
                    <div className="byo-row"><span className="byo-row-label">Weapons</span>
                      <span className="byo-mod" style={{ width: "auto" }}>{klass.weaponProf.fixed.join(", ") || "None"}</span></div>
                    <div className="byo-row"><span className="byo-row-label">Saving throws</span>
                      <span className="byo-mod" style={{ width: "auto" }}>{klass.saves.map((s) => s.toUpperCase()).join(", ")}</span></div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ---------------- BACKGROUND ---------------- */}
          {here === "Background" && content && (
            <>
              {content.backgrounds.map((b) => {
                const sel = b.id === bgId;
                const sk = b.skills.fixed.length ? b.skills.fixed.join(", ")
                  : b.skills.choices[0] ? `${b.skills.choices[0].count} of your choice` : "";
                return (
                  <button key={b.id} className={`byo-card ${sel ? "is-sel" : ""}`}
                          onClick={() => pickBackground(b.id)} aria-pressed={sel}>
                    <div className="byo-card-top">
                      <span className="byo-card-name">{b.name}</span>
                      <span className="byo-card-kind">p.{b.page}</span>
                    </div>
                    <div className="byo-pills">
                      {b.feature && <span className="byo-pill">{b.feature.name}</span>}
                      {sk && <span className="byo-pill alt">{sk}</span>}
                    </div>
                  </button>
                );
              })}

              {background && (
                <>
                  <Rule />
                  {/* 2024 backgrounds carry no named feature — the Origin
                      feat below replaced it. */}
                  {background.feature && (
                    <div className="byo-panel">
                      <h3>Feature: {background.feature.name}</h3>
                      <p className="byo-note">{background.feature.text}</p>
                    </div>
                  )}

                  {bgSkillChoice && (
                    <div className="byo-panel">
                      <h3>Skills <span className="byo-count">
                        {bgSkillPool.length < bgSkillChoice.count ? "limited" : bgSkillsLeft > 0 ? `${bgSkillsLeft} to go` : "done"}
                      </span></h3>
                      {bgSkillPool.length === 0 ? (
                        <p className="byo-note">You already have everything this background offers.</p>
                      ) : (
                        <div className="byo-skills">
                          {bgSkillPool.map((s) => {
                            const on = bgSkillPicks.includes(s);
                            const full = !on && bgSkillPicks.length >= bgSkillChoice.count;
                            return (
                              <button key={s} className={`byo-skill ${on ? "is-sel" : ""}`} onClick={() => toggleBgSkill(s)}
                                      disabled={full} aria-pressed={on}>{s}</button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {background.skills.fixed.length > 0 && (
                    <div className="byo-panel">
                      <h3>Skills</h3>
                      <div className="byo-skills">
                        {background.skills.fixed.map((s) => (
                          <span key={s} className={`byo-skill is-given ${bgSkillOverlap.includes(s) ? "is-dupe" : ""}`}>
                            {s}{bgSkillOverlap.includes(s) ? " · duplicate" : ""}
                          </span>
                        ))}
                      </div>
                      {bgSkillOverlap.length > 0 && (
                        <p className="byo-warn">
                          You already have {bgSkillOverlap.join(" and ")} from your class or ancestry — that's wasted.
                          <button className="byo-chip-b" onClick={() => setStep(at("Class"))}>Change class skills</button>
                        </p>
                      )}
                    </div>
                  )}

                  {background.abilityChoices && (
                    <div className="byo-panel">
                      <h3>Ability increases</h3>
                      <div className="byo-choice" style={{ marginBottom: 10 }}>
                        {background.abilityChoices.alternatives.map((alt, i) => {
                          const slots = abilityChoiceSlots(alt);
                          const label = slots.auto ? `+1 to all ${slots.from.length}`
                            : `${slots.amountAt(0)}/${slots.amountAt(1) || slots.amountAt(0)} split`;
                          return (
                            <button key={i} className={`byo-opt ${bgAbilityAlt === i ? "is-sel" : ""}`}
                                    onClick={() => { setBgAbilityAlt(i); setBgAbilityPicks([]); }} aria-pressed={bgAbilityAlt === i}>{label}</button>
                          );
                        })}
                      </div>
                      {!bgAbilitySlots.auto && (
                        <div className="byo-choice">
                          {bgAbilitySlots.from.map((k) => {
                            const idx = bgAbilityPicks.indexOf(k);
                            const on = idx >= 0;
                            const full = !on && bgAbilityPicks.length >= bgAbilitySlots.count;
                            return (
                              <button key={k} className={`byo-opt ${on ? "is-sel" : ""}`} disabled={full}
                                      onClick={() => setBgAbilityPicks((p) => on ? p.filter((x) => x !== k) : [...p, k])}
                                      aria-pressed={on}>
                                {ABILITIES.find((a) => a.key === k)?.label}{on ? ` +${bgAbilitySlots.amountAt(idx)}` : ""}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {bgFeat && (
                    <div className="byo-panel">
                      <h3>Feat <span className="byo-count">granted</span></h3>
                      <div className="byo-row"><span className="byo-row-label">{bgFeat.name}</span>
                        {background.feat.variant && <span className="byo-mod" style={{ width: "auto" }}>{background.feat.variant}</span>}</div>
                      <p className="byo-note">{bgFeat.text}</p>
                    </div>
                  )}

                  {background.equipment.length > 0 && (
                    <div className="byo-panel">
                      <h3>Starting equipment</h3>
                      {background.equipment.map((g, gi) => (
                        <div key={gi} style={{ marginBottom: 8 }}>
                          <div className="byo-skills">
                            {g.options.map((o) => {
                              const sel = (bgEquipPicks[gi] ?? g.options.find((x) => x.fixed)?.key) === o.key;
                              const label = o.items.map((it) => `${it.name}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`).join(" + ");
                              return (
                                <button key={o.key} className={`byo-skill ${sel ? "is-sel" : ""}`}
                                        onClick={() => setBgEquipPicks((p) => ({ ...p, [gi]: o.key }))}
                                        disabled={o.fixed} aria-pressed={sel}>{label}</button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {background.tools.fixed.length > 0 && (
                    <div className="byo-panel">
                      <h3>Tools</h3>
                      <p className="byo-note">{background.tools.fixed.join(", ")}</p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ---------------- ADVANCEMENT ---------------- */}
          {here === "Advancement" && (
            <>
              {asiLevelsReached.length === 0 ? (
                <div className="byo-stub">
                  <p className="byo-stub-t">Nothing yet</p>
                  <p className="byo-stub-s">
                    {klass ? `${klass.name}s get their first Ability Score Improvement at level ${klass.asiLevels[0] ?? "—"}.`
                      : "Pick a class first."}
                  </p>
                </div>
              ) : asiLevelsReached.map((atLevel) => {
                const entry = asiPicks[atLevel];
                const pool = asiFeatPool(atLevel);
                const feat = pool.find((f) => f.id === entry?.featId);
                return (
                  <div className="byo-panel" key={atLevel}>
                    <h3>Level {atLevel} <span className="byo-count">{asiComplete(atLevel) ? "done" : "to pick"}</span></h3>
                    <div className="byo-skills">
                      {pool.map((f) => {
                        const sel = entry?.featId === f.id;
                        return (
                          <button key={f.id} className={`byo-skill ${sel ? "is-sel" : ""}`}
                                  onClick={() => pickAsiFeat(atLevel, f.id)} aria-pressed={sel}>{f.name}</button>
                        );
                      })}
                    </div>
                    {feat && (
                      <div style={{ marginTop: 10 }}>
                        <p className="byo-note">{feat.text}</p>
                        {feat.ability && (
                          <>
                            <div className="byo-choice" style={{ margin: "8px 0" }}>
                              {feat.ability.choices.map((alt, ai) => {
                                const slots = abilityChoiceSlots(alt);
                                const label = `${slots.amountAt(0)}${slots.count > 1 ? ` to ${slots.count}` : " to one"}`;
                                return (
                                  <button key={ai} className={`byo-opt ${entry.abilityAlt === ai ? "is-sel" : ""}`}
                                          onClick={() => pickAsiAlt(atLevel, ai)} aria-pressed={entry.abilityAlt === ai}>+{label}</button>
                                );
                              })}
                            </div>
                            <div className="byo-choice">
                              {abilityChoiceSlots(entry.abilitySpec).from.map((k) => {
                                const idx = (entry.abilityPicks || []).indexOf(k);
                                const on = idx >= 0;
                                const maxed = !on && prereqScoreExcluding(k, 0) + abilityChoiceSlots(entry.abilitySpec).amountAt((entry.abilityPicks || []).length) > 20;
                                return (
                                  <button key={k} className={`byo-opt ${on ? "is-sel" : ""}`} disabled={maxed}
                                          onClick={() => toggleAsiAbilityPick(atLevel, k)} aria-pressed={on}>
                                    {ABILITIES.find((a) => a.key === k)?.label}{on ? ` +${abilityChoiceSlots(entry.abilitySpec).amountAt(idx)}` : maxed ? " · at 20" : ""}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* ---------------- DEFENSES ---------------- */}
          {here === "Defenses" && ancestry && (
            <>
              <div className="byo-vitals">
                <div className="byo-vital"><div className="byo-vital-n">{armorClass}</div><div className="byo-vital-l">Armor Class</div>
                  <div className="byo-vital-s">{bestAC.label}{shieldOn ? " + shield" : ""}</div></div>
                <div className="byo-vital"><div className="byo-vital-n">{klass ? hitPoints : "—"}</div><div className="byo-vital-l">Hit Points</div></div>
                <div className="byo-vital"><div className="byo-vital-n">{fmt(mod(finalScore("dex")))}</div><div className="byo-vital-l">Initiative</div></div>
                <div className="byo-vital"><div className="byo-vital-n">{speed}</div><div className="byo-vital-l">Speed</div></div>
              </div>

              {!klass ? (
                <div className="byo-stub">
                  <p className="byo-stub-t">Pick a class first</p>
                  <p className="byo-stub-s">Armor proficiency decides what you can wear.</p>
                </div>
              ) : (
                <>
                  <div className="byo-panel">
                    <h3>Armor</h3>
                    {armorOptions.length === 1 ? (
                      <p className="byo-note">{klass.name}s aren't proficient with any armor.</p>
                    ) : (
                      <div className="byo-skills">
                        {armorOptions.map((a) => (
                          <button key={a?.id ?? "none"} className={`byo-skill ${(armor?.id ?? null) === (a?.id ?? null) ? "is-sel" : ""}`}
                                  onClick={() => setArmorId(a?.id ?? null)} aria-pressed={(armor?.id ?? null) === (a?.id ?? null)}>
                            {a ? `${a.name} ${a.ac}` : "None"}
                          </button>
                        ))}
                      </div>
                    )}
                    {armorProfDerived.noMetal && (
                      <p className="byo-note" style={{ marginTop: 10 }}>{klass.name}s traditionally refuse metal armor and shields — a table-by-table call, not enforced here.</p>
                    )}
                    {shieldAllowed && (
                      <div className="byo-row" style={{ marginTop: 12 }}>
                        <span className="byo-row-label">Shield <span className="byo-count">+2 AC</span></span>
                        <button className={`byo-opt ${shieldOn ? "is-sel" : ""}`} onClick={() => setHasShield((v) => !v)} aria-pressed={shieldOn}>
                          {shieldOn ? "Carrying" : "No shield"}
                        </button>
                      </div>
                    )}
                    {armor?.strReq && finalScore("str") < armor.strReq && (
                      <p className="byo-warn">{armor.name} needs Strength {armor.strReq} and you have {finalScore("str")} — check whether your table applies the speed penalty.</p>
                    )}
                    {armor?.stealthDisadvantage && <p className="byo-warn">{armor.name} gives disadvantage on Stealth checks.</p>}
                  </div>

                  {acRows.length > 1 && (
                    <div className="byo-panel">
                      <h3>Why that number</h3>
                      {acRows.map((c) => (
                        <div className={`byo-row ${c.value === bestAC.value ? "" : "byo-dim"}`} key={c.id}>
                          <span className="byo-row-label">{c.label}<span className="byo-ac-parts">{c.parts}</span></span>
                          <span className={c.value === bestAC.value ? "byo-final" : "byo-mod"}>{c.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="byo-panel">
                    <h3>Saving throws <span className="byo-count">proficiency {fmt(pb)}</span></h3>
                    {saveThrowRows.map((s) => (
                      <div className="byo-row" key={s.key}>
                        <span className={`byo-dot${s.proficient ? " is-on" : ""}`} aria-hidden="true" />
                        <span className="byo-row-label">{ABILITIES.find((a) => a.key === s.key)?.label}</span>
                        <span className="byo-final">{fmt(s.value)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="byo-panel">
                    <h3>Passive skills</h3>
                    {passiveSkills.map((p) => (
                      <div className="byo-row" key={p.name}><span className="byo-row-label">Passive {p.name}</span><span className="byo-final">{p.value}</span></div>
                    ))}
                  </div>

                  {klass.startingEquipment.groups.length > 0 && (
                    <div className="byo-panel">
                      <h3>Starting Equipment</h3>
                      {klass.startingEquipment.groups.map((g, gi) => (
                        <div key={gi} style={{ marginBottom: 8 }}>
                          <div className="byo-skills">
                            {g.options.map((o) => {
                              const sel = (classEquipPicks[gi] ?? g.options.find((x) => x.fixed)?.key) === o.key;
                              const label = o.items.map((it) => `${it.name}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`).join(" + ");
                              return (
                                <button key={o.key} className={`byo-skill ${sel ? "is-sel" : ""}`}
                                        onClick={() => setClassEquipPicks((p) => ({ ...p, [gi]: o.key }))}
                                        disabled={o.fixed} aria-pressed={sel}>{label}</button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="byo-panel">
                    <h3>Attacks</h3>
                    <div className="byo-atk-table">
                      <div className="byo-atk-row byo-atk-head"><span>Attack</span><span>Range</span><span>Hit / DC</span><span>Damage</span><span>Notes</span></div>
                      {attackRows.map((r) => (
                        <div className="byo-atk-row" key={r.key}>
                          <span className="byo-atk-name">{r.name}{!r.proficient && <span className="byo-tag alt">not proficient</span>}</span>
                          <span>{r.range}</span><span className="byo-atk-num">{r.hitOrDC}</span>
                          <span className="byo-atk-num">{r.damage}{r.dmgType ? ` ${r.dmgType}` : ""}</span>
                          <span className="byo-atk-notes">{r.notes || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {actions.length > 0 && (
                    <div className="byo-panel">
                      <h3>Class + Ancestry Actions</h3>
                      {ACTION_ORDER.filter((k) => actions.some((a) => a.action === k)).map((k) => (
                        <div key={k}>
                          <div className="byo-actgroup-l">{ACTION_LABELS[k]}</div>
                          {actions.filter((a) => a.action === k).map((a, i) => (
                            <div className="byo-trait" key={i}>
                              <div className="byo-trait-n">{a.name} <span className="src">{a.source}</span></div>
                              <div className="byo-trait-t">{a.text}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {ancestrySpellGrants.length > 0 && (
                    <div className="byo-panel">
                      <h3>Ancestry spells</h3>
                      <p className="byo-note" style={{ marginBottom: 10 }}>Granted by your ancestry, not picked on the Spells step — they don't spend a slot.</p>
                      {ancestrySpellGrants.map((g) => (
                        <div className="byo-trait" key={g.key}>
                          <div className="byo-trait-n">{g.sp.name}<span className="src">{g.from}{g.use ? ` — ${g.use}` : ""}</span></div>
                          <div className="byo-trait-t">{g.sp.level === 0 ? "Cantrip" : `Level ${g.sp.level}`}. {splitCastingTime(g.sp.time).head}, {g.sp.range}. {g.sp.text}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {ancestrySpellChoiceGroups.map((g) => (
                    <div className="byo-panel" key={g.key}>
                      <h3>Bonus spell <span className="byo-count">{(ancestrySpellPicks[g.key] || []).length}/{g.count}</span></h3>
                      <div className="byo-skills">
                        {g.pool.map((sp) => {
                          const on = (ancestrySpellPicks[g.key] || []).includes(sp.id);
                          const full = !on && (ancestrySpellPicks[g.key] || []).length >= g.count;
                          return (
                            <button key={sp.id} className={`byo-skill ${on ? "is-sel" : ""}`}
                                    onClick={() => toggleAncestrySpellPick(g.key, sp.id, g.count)} disabled={full}
                                    aria-pressed={on}>{sp.name}</button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {chosenFeats.length > 0 && (
                    <div className="byo-panel">
                      <h3>Feats</h3>
                      {chosenFeats.map(({ feat, from }) => (
                        <div key={feat.id} style={{ marginBottom: 10 }}>
                          <div className="byo-row"><span className="byo-row-label">{feat.name}</span>
                            <span className="byo-mod" style={{ width: "auto" }}>{from}</span></div>
                          <p className="byo-note">{feat.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="byo-panel">
                    <h3>Actions in Combat</h3>
                    <p className="byo-note">{BASIC_ACTIONS.join(", ")}.</p>
                  </div>
                </>
              )}
            </>
          )}

          {/* ---------------- SPELLS ---------------- */}
          {here === "Spells" && casting && !casting.pending && (
            <>
              <div className="byo-cast">
                <div className="byo-cast-c"><div className="byo-cast-l">Save DC</div><div className="byo-cast-v">{casting.saveDC}</div></div>
                <div className="byo-cast-c"><div className="byo-cast-l">Attack</div><div className="byo-cast-v">{fmt(casting.attack)}</div></div>
                <div className="byo-cast-c"><div className="byo-cast-l">{casting.ability.toUpperCase()}</div><div className="byo-cast-v">{fmt(casting.abMod)}</div></div>
              </div>

              {casting.slots.length > 0 && (
                <div className="byo-slots" style={{ marginBottom: 14 }}>
                  {casting.slots.map((n, i) => (
                    <div className="byo-slot" key={i}><div className="byo-slot-l">{i + 1}{["st", "nd", "rd"][i] || "th"}</div><div className="byo-slot-n">{n}</div></div>
                  ))}
                </div>
              )}
              {casting.pact && (
                <div className="byo-slots" style={{ marginBottom: 14 }}>
                  <div className="byo-slot"><div className="byo-slot-l">Pact slots</div><div className="byo-slot-n">{casting.pact.count}</div></div>
                  <div className="byo-slot"><div className="byo-slot-l">at level</div><div className="byo-slot-n">{casting.pact.level}</div></div>
                </div>
              )}

              {cantripBudget > 0 && (
                <>
                  <div className="byo-panel">
                    <h3>Cantrips <span className="byo-count">{pickedCantrips.length}/{cantripBudget}</span></h3>
                    {availableSpells.filter((s) => s.level === 0).map((sp) => (
                      <SpellTableRow key={sp.id} sp={sp} casting={casting} on={pickedSpellIds.includes(sp.id)}
                                     full={!pickedSpellIds.includes(sp.id) && pickedCantrips.length >= cantripBudget}
                                     onToggle={() => toggleSpell(sp.id)} />
                    ))}
                  </div>
                  <Rule />
                </>
              )}

              {spellBudget > 0 && (
                <>
                  <div className="byo-panel">
                    <h3>{casting.prepared != null ? "Prepared spells" : casting.spellbook != null ? "Spellbook" : "Spells known"}
                      <span className="byo-count">{pickedLeveled.length}/{spellBudget}</span></h3>
                    <p className="byo-note" style={{ marginBottom: 10 }}>Only spells at or below your highest slot level appear.</p>
                    {Array.from({ length: highestSlot }, (_, i) => i + 1).map((lvl) => {
                      const rows = availableSpells.filter((s) => s.level === lvl);
                      if (!rows.length) return null;
                      return (
                        <div key={lvl}>
                          <div className="byo-lvlh">Level {lvl}
                            {casting.slots[lvl - 1] != null && <span className="byo-count">{casting.slots[lvl - 1]} slot{casting.slots[lvl - 1] === 1 ? "" : "s"}</span>}
                          </div>
                          {rows.map((sp) => (
                            <SpellTableRow key={sp.id} sp={sp} casting={casting} on={pickedSpellIds.includes(sp.id)}
                                           full={!pickedSpellIds.includes(sp.id) && pickedLeveled.length >= spellBudget}
                                           onToggle={() => toggleSpell(sp.id)} />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                  <Rule />
                </>
              )}

              {casting.spellbook != null && (
                <p className="byo-note">A wizard's spellbook holds {casting.spellbook} spells — more than you'll prepare at once. Everything on your class list up to your highest slot is browsable above; add whichever ones you own to the spellbook in play.</p>
              )}

              <div className="byo-panel">
                <h3>Anything else</h3>
                <p className="byo-note" style={{ marginBottom: 10 }}>Every SRD spell your class can reach is listed above. Add anything from outside the SRD here, one per line.</p>
                <textarea className="byo-out" rows={4} value={otherSpells} onChange={(e) => setOtherSpells(e.target.value)}
                          placeholder={"Healing Spirit\nShadow Blade"} aria-label="Other spells" />
              </div>
            </>
          )}

          {/* ---------------- INVENTORY ---------------- */}
          {here === "Inventory" && ancestry && (
            <>
              <div className="byo-panel">
                <h3>Weapons</h3>
                {groupWeapons(carriedWeapons).length > 0 ? groupWeapons(carriedWeapons).map(({ weapon, qty }) => (
                  <div className="byo-row" key={weapon.id}><span className="byo-row-label">{weapon.name}</span>
                    {qty > 1 && <span className="byo-mod" style={{ width: "auto" }}>×{qty}</span>}</div>
                )) : (
                  <p className="byo-note">Nothing picked yet. <button className="byo-linkbtn" onClick={() => setStep(at("Defenses"))}>Choose starting weapons</button> on the Defenses step.</p>
                )}
              </div>

              <div className="byo-panel">
                <h3>Armor</h3>
                <div className="byo-row"><span className="byo-row-label">Worn</span><span className="byo-mod" style={{ width: "auto" }}>{armor ? armor.name : "None"}</span></div>
                <div className="byo-row"><span className="byo-row-label">Shield</span><span className="byo-mod" style={{ width: "auto" }}>{shieldOn ? "Carrying" : "None"}</span></div>
                <p className="byo-note" style={{ marginTop: 6 }}><button className="byo-linkbtn" onClick={() => setStep(at("Defenses"))}>Change armor</button> on the Defenses step.</p>
              </div>

              <div className="byo-panel">
                <h3>Gear</h3>
                {[...classEquipItems, ...bgEquipItems].filter((it) => !it.currency && it.resolved?.kind !== "weapon" && it.resolved?.kind !== "armor").map((it, i) => (
                  <div className="byo-row" key={i}><span className="byo-row-label">{it.name}{it.quantity > 1 ? ` ×${it.quantity}` : ""}{!it.resolved && !it.currency ? " (choose specific item at the table)" : ""}</span></div>
                ))}
                {!klass && !background && <p className="byo-note">Pick a class and background to see starting gear.</p>}
              </div>

              <div className="byo-panel">
                <h3>Currency</h3>
                {background ? (
                  <div className="byo-vitals" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="byo-vital"><div className="byo-vital-n">{startingGold} gp</div><div className="byo-vital-l">Starting gold</div></div>
                  </div>
                ) : <p className="byo-note">Pick a background to see starting gold.</p>}
              </div>
            </>
          )}

          {/* ---------------- SHEET / EXPORT ---------------- */}
          {here === "Sheet" && ancestry && (
            <>
              <div className="byo-panel">
                <h3>Character Name</h3>
                <input className="byo-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Unnamed" aria-label="Character name" />
              </div>

              <div className="byo-panel">
                <h3>Backstory</h3>
                <p className="byo-note">Free text — who they are, where they come from, why they left. Prints with the sheet.</p>
                <textarea className="byo-out" rows={6} value={backstory} onChange={(e) => setBackstory(e.target.value)} placeholder="Optional." aria-label="Backstory" />
              </div>

              <Rule />
              <SheetSummary ctx={sheetCtx} />
              <Rule />

              {!allStepsDone && (
                <p className="byo-warn">Finish every earlier step before saving — check the rail above for anything
                  still gold or grey.</p>
              )}

              <div className="byo-export byo-export-stack">
                <div className="byo-export-t">Character sheet</div>
                <div className="byo-export-alt">
                  <button className="byo-btn byo-btn-go" onClick={printSheet} disabled={!allStepsDone}>Save on Android/Mac/PC</button>
                  <button className="byo-btn byo-btn-ios" onClick={saveForIOS} disabled={!allStepsDone || pdfState === "working"}>
                    {pdfState === "working" ? "Building…" : "Save on iOS"}
                  </button>
                  <button className="byo-btn byo-btn-alt" onClick={saveVector} disabled={!allStepsDone || pdfState === "working"}>Save for other devices</button>
                </div>
              </div>
              <p className="byo-note" style={{ marginTop: -2 }}>
                <button className="byo-linkbtn" onClick={downloadSheet} disabled={!allStepsDone}>Download the raw HTML</button> instead.
              </p>

              <div className="byo-export byo-export-stack">
                <div>
                  <div className="byo-export-t">Character data</div>
                  <div className="byo-export-s">A .json file of every choice you made. Keep it somewhere the browser can't clear.</div>
                </div>
                <button className="byo-btn byo-btn-alt" onClick={exportCharacter} disabled={!allStepsDone}>Export .json</button>
              </div>
              {pdfState === "error" && <p className="byo-warn">That export failed. Try one of the other buttons.</p>}
              {!name.trim() && <p className="byo-warn">The sheet will say "Unnamed" unless you fill in a name first.</p>}

              <Rule />
              <div className="byo-panel">
                <h3>Plain text</h3>
                <textarea className="byo-out" readOnly rows={10} value={sheetText}
                          onFocus={(e) => e.target.select()} aria-label="Character summary" />
              </div>

              <Rule />
              <div className="byo-export">
                <div><div className="byo-export-t">Start over</div><div className="byo-export-s">Wipes this character and every saved field.</div></div>
                <button className="byo-btn byo-btn-danger" onClick={() => setShowResetConfirm(true)}>Create new character</button>
              </div>
            </>
          )}
        </ErrorBoundary>
      </div>

      {showResetConfirm && (
        <div className="byo-modal-bg" role="dialog" aria-modal="true" aria-label="Confirm new character">
          <div className="byo-modal">
            <h3 className="byo-modal-t">Create new character?</h3>
            <p className="byo-modal-s">This clears every field and starts a blank character from the first step. This can't be undone.</p>
            <div className="byo-modal-row">
              <button className="byo-btn" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="byo-btn byo-btn-danger" onClick={resetAll}>Create New</button>
            </div>
          </div>
        </div>
      )}

      <div className="byo-nav">
        <div className="byo-nav-in">
          <button className="byo-btn byo-btn-danger" onClick={() => setShowResetConfirm(true)}>Start over</button>
          {here === "Species/Race" && !ancestry && <span className="byo-hint">Pick an ancestry</span>}
          {here === "Species/Race" && ancestry && !ancestryChoiceMade && <span className="byo-hint">Finish your choices</span>}
          {here === "Abilities" && mode === "array" && Object.keys(arrayAssign).length < 6 && <span className="byo-hint">Assign all six</span>}
          {here === "Class" && !klass && <span className="byo-hint">Pick a class</span>}
          {here === "Class" && klass && subclassOn && !subclass && <span className="byo-hint">Pick a subclass</span>}
          {here === "Class" && klass && skillsLeft > 0 && <span className="byo-hint">{skillsLeft} more skill{skillsLeft > 1 ? "s" : ""}</span>}
          {here === "Background" && !background && <span className="byo-hint">Pick a background</span>}
          {here === "Advancement" && asiIncomplete && <span className="byo-hint">Finish your improvement</span>}
          {here === "Spells" && cantripBudget > 0 && pickedCantrips.length === 0 && <span className="byo-hint">Pick your cantrips</span>}
          <button className="byo-btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
          <button className="byo-btn byo-btn-go"
                  onClick={() => { setStep((s) => Math.min(STEPS.length - 1, s + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  disabled={step === STEPS.length - 1 || !canAdvance()}>
            {step === STEPS.length - 1 ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
