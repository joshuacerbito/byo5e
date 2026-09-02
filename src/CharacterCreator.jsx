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
  combinedCasterLevel, combinedSpellSlots, totalCharacterLevel, meetsMulticlassRequirement,
  hitPointsMulticlass,
} from "./rules/multiclass.js";
import {
  acCandidates, isWeaponProficient, weaponAbility, attackBonus, damageBonus,
  savingThrows as savingThrowsOf, skillTable as skillTableOf, passiveScore,
  spellcastingStats,
} from "./rules/combat.js";
import {
  deriveClassArmorProf, deriveClassWeaponProf, mergeArmorProf, mergeWeaponProf,
  collectEffects, effectsOfType, sumEffect,
} from "./rules/effects.js";
import { abilityChoiceSlots, resolveAbilityChoice } from "./rules/choices.js";
import { meetsPrerequisite } from "./rules/prereq.js";
import { buildSteps } from "./lib/steps.js";
import {
  groupWeapons, spellHitDC, spellEffect, ACTION_ORDER, ACTION_LABELS,
  recommendedSpread, splitCastingTime, inferActionBucket,
} from "./lib/derive.js";
import { basicActionNames } from "./content/basicActions.js";
import { buildSheetHTML } from "./lib/sheetHtml.js";
import { saveSheetPDF } from "./pdf/sheetPdf.js";
import { saveSheetRasterPDF } from "./pdf/sheetRaster.js";
import { sheetFileName, sheetFileBase } from "./pdf/saveFile.js";
import { loadSaved, saveSnapshot, clearSaved, buildCharacterExport, characterFileName }
  from "./lib/storage.js";
import { syncEnabled, onSessionChange, signInWithGoogle, createCharacter, updateCharacter } from "./lib/sync.js";
import Account from "./components/Account.jsx";
import { formatCurrency } from "./lib/currency.js";
import Rule from "./components/Rule.jsx";
import FeatureBlocks from "./components/FeatureBlocks.jsx";
import SpellTableRow from "./components/SpellTableRow.jsx";
import SheetSummary from "./components/SheetSummary.jsx";
import Sheet from "./components/Sheet.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { useRoute, navigate, goBack } from "./lib/router.js";
import Splash from "./components/Splash.jsx";
import AddRuleset from "./components/AddRuleset.jsx";
import Terms from "./components/Terms.jsx";
import Privacy from "./components/Privacy.jsx";
import CoreTraits from "./components/CoreTraits.jsx";
import Section, { ShowMore } from "./components/Section.jsx";
import MasteryPicker from "./components/MasteryPicker.jsx";

const APP_TITLE = document.title;
const saved = loadSaved();

/* Sign-in UI. Off until the database side of the multi-character schema
   (profiles table + character_limit, characters.name, the split RLS
   policies — see plans/user-accounts-auth.md) has actually been applied
   in Supabase; the app degrades gracefully without it (getProfile/
   listCharacters just come back empty), but "Save to my account" would
   error until the migration's run. Flip to true once it's confirmed run. */
const AUTH_UI_ENABLED = false;

const DEFAULTS = {
  edition: "2024", step: 0,
  ancestryId: null, ancestryPicks: {}, ancestrySpellPicks: {},
  mode: "pointbuy", scores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }, arrayAssign: {},
  name: "", backstory: "",
  classId: null, level: 1, subclassId: null,
  skillPicks: [], optionPicks: {}, asiPicks: {}, masteryPicks: [],
  multiclasses: [], mcSkillPicks: {}, mcAsiPicks: {},
  bgId: null, bgSkillPicks: [], bgAbilityAlt: 0, bgAbilityPicks: [],
  armorId: null, hasShield: false, classEquipPicks: {}, bgEquipPicks: {},
  pickedSpellIds: [],
  customItems: [], currency: { cp: 0, sp: 0, gp: 0, pp: 0 },
};

/* Collection a customItems row's `kind` (the item view model's own
   `.kind` field — "weapon"/"armor"/"gear") resolves against via
   content.byId(). Only "weapon" differs from its collection name. */
const KIND_COLLECTION = { weapon: "weapons", armor: "armor", gear: "gear" };

/* A feature's own optionalFeature/feat choices resolve through the
   mapper (src/content/features.js). One class in the SRD does not:
   2014's Warlock lists its Eldritch Invocations by a `{@filter}` page
   reference rather than an enumerated list, so there is nothing for
   `toFeature` to resolve. The real option pool and the real per-level
   count both still exist in the data — types on `content.options`, the
   count in the class's own table — just not wired to that one feature.
   This is the one place that gap is bridged by hand. */
const GROWING_CHOICE_KEYWORDS = { "eldritch invocations": "invocation" };

/* Every choose-up-to-N-of-many picker (a species' lineage table, Fighting
   Style, class/background skills, ...) shares this shape. For a 1/1
   choice — pick exactly one of these — clicking a different option once
   one is already selected used to just do nothing (the button is
   disabled); that reads as broken, not "full", so it swaps the
   selection instead. A 2+/N choice keeps the old toggle-to-unselect
   behavior: which of several already-picked options to give up for a
   new one isn't this component's call to make for the user. */
const swapPick = (cur, value, max) =>
  cur.includes(value) ? cur.filter((x) => x !== value)
    : cur.length < max ? [...cur, value]
    : max === 1 ? [value] : cur;

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

/* "(uncommon, attuned)" — the same treatment weapon properties already
   get appended to their name. Nothing for a mundane (rarity "none") item. */
function magicSuffix(resolved, attuned) {
  if (!resolved?.rarity || resolved.rarity === "none") return "";
  return ` (${resolved.rarity}${attuned ? ", attuned" : ""})`;
}

/* "+1 AC, +1 saving throws" — the flat-bonus half of an item's effects
   (itemEffectsOverlay.js), same summarizing job attachedSpells does for
   the charges half. Not gated on attunement here — this is "what the
   item does", the attunement toggle next to it is "is it doing it". */
function itemEffectSummary(effects) {
  const parts = [];
  const ac = (effects || []).filter((e) => e.type === "acBonus").reduce((n, e) => n + (e.value || 0), 0);
  if (ac) parts.push(`+${ac} AC`);
  const save = (effects || []).filter((e) => e.type === "saveBonus").reduce((n, e) => n + (e.value || 0), 0);
  if (save) parts.push(`+${save} saving throws`);
  const check = (effects || []).filter((e) => e.type === "abilityCheckBonus").reduce((n, e) => n + (e.value || 0), 0);
  if (check) parts.push(`+${check} ability checks`);
  return parts.join(", ");
}

/* "7 charges (regains 1d6 + 1 daily at dawn) — casts Fireball (1+ charges)
   — +1 AC, +1 saving throws" — a magic item's mechanics, read straight off
   the item (charges/attachedSpells: items.js reads them off the raw pack
   verbatim; acBonus/saveBonus/abilityCheckBonus: itemEffectsOverlay.js,
   hand-authored). null when the item has none of the above, which is most
   gear. */
function chargesLine(resolved) {
  if (!resolved || (resolved.charges == null && !resolved.attachedSpells?.length && !resolved.effects?.length)) return null;
  const parts = [];
  if (resolved.charges != null) {
    parts.push(`${resolved.charges} charge${resolved.charges === 1 ? "" : "s"}`
      + (resolved.rechargeAmount ? ` (regains ${resolved.rechargeAmount}${resolved.recharge ? ` at ${resolved.recharge}` : ""})` : ""));
  }
  for (const sp of resolved.attachedSpells || []) {
    /* Only "charges" mode's number is a per-cast cost (Wand of
       Fireballs: 1+ charges). "limited"'s number is a pool size, not a
       cost — Necklace of Fireballs' 9 is how many beads it has, not how
       many it takes to detonate one — so it's left unstated rather than
       guessed at. */
    const costNote = sp.mode === "charges" && sp.cost ? ` (${sp.cost}+ charge${sp.cost === 1 ? "" : "s"})` : "";
    parts.push(`casts ${sp.name}${costNote}`);
  }
  const effectSummary = itemEffectSummary(resolved.effects);
  if (effectSummary) parts.push(`${effectSummary}${resolved.reqAttune ? " (while attuned)" : ""}`);
  return parts.join(" — ");
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
  /* Each standalone screen (Splash, AddRuleset, Terms, Privacy, Account)
     is a real route now (src/lib/router.js), not a local boolean — real
     URLs, back/forward, bookmarkable/shareable, and a screen's own
     "Back" is just goBack() (real browser Back), which naturally
     returns to whatever pushed it — Splash or mid-wizard — without
     either screen needing to know which. */
  const route = useRoute();
  const showAddRuleset = route === "/rulesets";
  const showTerms = route === "/terms";
  const showPrivacy = route === "/privacy";
  const showAccount = route === "/account";
  const showSplash = route === "/";
  /* The finished character sheet — where the wizard's last step "Done"
     leads. A real route like the rest, so it's bookmarkable and
     browser-Back returns you to the step you left. */
  const showSheet = route === "/sheet";

  /* Account sync — fully inert with no Supabase env vars set (syncEnabled
     false), same "lazy/optional" shape as PDF export. session is null both
     while signed out and while sync is disabled outright, so nothing else
     needs to branch on syncEnabled directly. */
  const [session, setSession] = useState(null);
  useEffect(() => onSessionChange(setSession), []);
  /* /account typed or bookmarked while signed out (or before onSessionChange
     has resolved) bounces home rather than rendering nothing forever — see
     the render guard just above the JSX return. */
  useEffect(() => {
    if (route === "/account" && !session) navigate("/", { replace: true });
  }, [route, session]);

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
  const [level, rawSetLevel] = useState(saved?.level ?? DEFAULTS.level);
  /* Dropping level must drop ASI/feat picks (and the ability bonuses they
     grant) for any level no longer reached — otherwise a pick made at, say,
     level 12 keeps boosting scores after stepping back down to level 4. */
  const setLevel = (updater) => {
    rawSetLevel((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (next < prev) {
        setAsiPicks((picks) => {
          const kept = Object.fromEntries(Object.entries(picks).filter(([lvl]) => Number(lvl) <= next));
          return Object.keys(kept).length === Object.keys(picks).length ? picks : kept;
        });
      }
      return next;
    });
  };
  const [subclassId, setSubclassId] = useState(saved?.subclassId ?? DEFAULTS.subclassId);
  const [multiclasses, setMulticlasses] = useState(saved?.multiclasses ?? DEFAULTS.multiclasses);
  const [mcSkillPicks, setMcSkillPicks] = useState(saved?.mcSkillPicks ?? DEFAULTS.mcSkillPicks);
  // ASI/feat picks for multiclass entries, keyed classId -> level -> the
  // same pick-entry shape asiPicks uses for the primary class (see below).
  const [mcAsiPicks, setMcAsiPicks] = useState(saved?.mcAsiPicks ?? DEFAULTS.mcAsiPicks);
  const [skillPicks, setSkillPicks] = useState(saved?.skillPicks ?? DEFAULTS.skillPicks);
  const [optionPicks, setOptionPicks] = useState(saved?.optionPicks ?? DEFAULTS.optionPicks);
  const [asiPicks, setAsiPicks] = useState(saved?.asiPicks ?? DEFAULTS.asiPicks);
  // Which weapon ids are mastered — 2024-only, capped per level by the
  // class's own weaponMasteryByLevel table (see content/classes.js). A
  // save written before this field existed has no masteryPicks at all,
  // same backward-compat pattern as every other array field here.
  const [masteryPicks, setMasteryPicks] = useState(saved?.masteryPicks ?? DEFAULTS.masteryPicks);
  const [bgId, setBgId] = useState(saved?.bgId ?? DEFAULTS.bgId);
  const [bgSkillPicks, setBgSkillPicks] = useState(saved?.bgSkillPicks ?? DEFAULTS.bgSkillPicks);
  const [bgAbilityAlt, setBgAbilityAlt] = useState(saved?.bgAbilityAlt ?? DEFAULTS.bgAbilityAlt);
  const [bgAbilityPicks, setBgAbilityPicks] = useState(saved?.bgAbilityPicks ?? DEFAULTS.bgAbilityPicks);
  const [armorId, setArmorId] = useState(saved?.armorId ?? DEFAULTS.armorId);
  const [hasShield, setHasShield] = useState(saved?.hasShield ?? DEFAULTS.hasShield);
  const [classEquipPicks, setClassEquipPicks] = useState(saved?.classEquipPicks ?? DEFAULTS.classEquipPicks);
  const [bgEquipPicks, setBgEquipPicks] = useState(saved?.bgEquipPicks ?? DEFAULTS.bgEquipPicks);
  const [pickedSpellIds, setPickedSpellIds] = useState(saved?.pickedSpellIds ?? DEFAULTS.pickedSpellIds);
  const [customItems, setCustomItems] = useState(saved?.customItems ?? DEFAULTS.customItems);
  const [currency, setCurrency] = useState(saved?.currency ?? DEFAULTS.currency);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  // Which class's panels (Subclass/Skills/Proficiencies/etc) the Class step
  // is showing, once multiclassing puts more than one class in play: 0 is
  // the primary class, 1..n index into mcEntries. Transient UI state only —
  // not persisted, and clamped back to 0 below if its entry disappears.
  const [classTab, setClassTab] = useState(0);
  const [showAddMcModal, setShowAddMcModal] = useState(false);
  // Once a class is picked the 12-card grid collapses to the chosen card
  // alone — the rest of the Class step (Core Traits, levels) is long, and
  // eleven rejected cards push all of it below the fold. Transient: reopened
  // by the "Change class" chip or by clicking the selected card again.
  const [classGridOpen, setClassGridOpen] = useState(false);

  const pickEdition = (ed) => {
    setEdition(ed);
    setAncestryId(DEFAULTS.ancestryId); setAncestryPicks(DEFAULTS.ancestryPicks);
    setAncestrySpellPicks(DEFAULTS.ancestrySpellPicks);
    setMode(DEFAULTS.mode); setScores(DEFAULTS.scores); setArrayAssign(DEFAULTS.arrayAssign);
    setClassId(DEFAULTS.classId); setLevel(DEFAULTS.level); setSubclassId(DEFAULTS.subclassId);
    setMulticlasses(DEFAULTS.multiclasses); setMcSkillPicks(DEFAULTS.mcSkillPicks); setMcAsiPicks(DEFAULTS.mcAsiPicks);
    setSkillPicks(DEFAULTS.skillPicks); setOptionPicks(DEFAULTS.optionPicks); setAsiPicks(DEFAULTS.asiPicks);
    setMasteryPicks(DEFAULTS.masteryPicks);
    setBgId(DEFAULTS.bgId); setBgSkillPicks(DEFAULTS.bgSkillPicks);
    setBgAbilityAlt(DEFAULTS.bgAbilityAlt); setBgAbilityPicks(DEFAULTS.bgAbilityPicks);
    setArmorId(DEFAULTS.armorId); setHasShield(DEFAULTS.hasShield);
    setClassEquipPicks(DEFAULTS.classEquipPicks); setBgEquipPicks(DEFAULTS.bgEquipPicks);
    setPickedSpellIds(DEFAULTS.pickedSpellIds);
    setCustomItems(DEFAULTS.customItems); setCurrency(DEFAULTS.currency);
  };

  /* ------------------------------------------------------------------
     ANCESTRY
  ------------------------------------------------------------------- */
  const ancestry = content?.ancestries.find((a) => a.id === ancestryId) || null;
  const pickAncestry = (id) => { setAncestryId(id); setAncestryPicks({}); setAncestrySpellPicks({}); };

  const toggleAncestryPick = (ci, value, max) => {
    setAncestryPicks((prev) => ({ ...prev, [ci]: swapPick(prev[ci] || [], value, max) }));
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
        return { ci, kind: "lineage", label: c.label || "Lineage", count: c.count,
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
  // With nothing picked there is nothing to collapse to, so the grid is
  // always full until a class exists.
  const classGridShowsAll = !klass || classGridOpen;
  const subclassOn = subclassActive(klass?.subclassLevel, level);

  const pickClass = (id) => {
    setClassId(id); setSubclassId(null); setSkillPicks([]); setOptionPicks({});
    setAsiPicks({}); setArmorId(null); setHasShield(false);
    setClassEquipPicks({}); setPickedSpellIds([]); setMasteryPicks([]);
    // A class can't be both the primary class and a multiclass entry.
    setMulticlasses((prev) => prev.filter((m) => m.classId !== id));
  };

  /* ------------------------------------------------------------------
     MULTICLASSING — additional classes beyond the primary one above.
     Each entry is independent: its own level, its own subclass once it
     reaches that class's subclassLevel, its own multiclass-in
     proficiencies and (2014 SRD only) ability-score prerequisite. */
  const mcEntries = useMemo(() => (multiclasses || [])
    .map((m) => {
      const mKlass = content?.classes.find((c) => c.id === m.classId) || null;
      if (!mKlass) return null;
      const mSubclassOn = subclassActive(mKlass.subclassLevel, m.level);
      const mSubclass = mSubclassOn ? mKlass.subclasses.find((s) => s.id === m.subclassId) || null : null;
      return { classId: m.classId, level: m.level, subclassId: m.subclassId, klass: mKlass, subclass: mSubclass, subclassOn: mSubclassOn };
    })
    .filter(Boolean), [multiclasses, content]);

  const totalCharLevel = totalCharacterLevel([{ level }, ...mcEntries.map((e) => ({ level: e.level }))]);

  const addableClasses = useMemo(() => {
    // No primary class yet means nothing to multiclass alongside — without
    // this guard, "+ Add new Multiclass" was reachable before picking a
    // primary class, which sets mcEntries.length > 0 while klass stays
    // null and blanks the whole Class step (both the class-picker grid and
    // the {klass && ...} panel are hidden in that state, with no way back).
    if (!classId) return [];
    const taken = new Set([classId, ...multiclasses.map((m) => m.classId)]);
    return (content?.classes || []).filter((c) => !taken.has(c.id));
  }, [classId, content, multiclasses]);

  const addMulticlass = (id) => {
    setMulticlasses((prev) => [...prev, { classId: id, level: 1, subclassId: null }]);
  };
  // "+ Add new Multiclass" beside the class tabs opens a modal with the same
  // card-grid picker the primary class uses at the start — this is the only
  // place a class gets picked for multiclassing now. Jumps the class tabs to
  // the new entry once picked.
  const addMulticlassFromHeader = (id) => {
    if (!id) return;
    setClassTab(mcEntries.length + 1);
    addMulticlass(id);
    setShowAddMcModal(false);
  };
  const removeMulticlass = (id) => {
    setMulticlasses((prev) => prev.filter((m) => m.classId !== id));
    setMcSkillPicks((prev) => { const { [id]: _drop, ...rest } = prev; return rest; });
    setMcAsiPicks((prev) => { const { [id]: _drop, ...rest } = prev; return rest; });
  };
  // Keep the active class tab pointing at a real entry (or the primary
  // class) whenever a multiclass entry disappears out from under it.
  useEffect(() => {
    setClassTab((t) => (t > mcEntries.length ? 0 : t));
  }, [mcEntries.length]);
  const setMcLevel = (id, lvl) => {
    const capped = Math.max(1, Math.min(MAX_LEVEL, lvl));
    setMulticlasses((prev) => prev.map((m) => (m.classId === id ? { ...m, level: capped } : m)));
    // Dropping a multiclass entry's level must drop its ASI/feat picks (and
    // the ability bonuses they grant) for any level it no longer reaches —
    // same reasoning as the primary class's setLevel above.
    setMcAsiPicks((prev) => {
      const byLevel = prev[id];
      if (!byLevel) return prev;
      const kept = Object.fromEntries(Object.entries(byLevel).filter(([lvl2]) => Number(lvl2) <= capped));
      return Object.keys(kept).length === Object.keys(byLevel).length ? prev : { ...prev, [id]: kept };
    });
  };
  const setMcSubclass = (id, subId) => {
    setMulticlasses((prev) => prev.map((m) => (m.classId === id ? { ...m, subclassId: subId } : m)));
  };
  const toggleMcSkill = (classId2, s, max) => {
    setMcSkillPicks((prev) => ({ ...prev, [classId2]: swapPick(prev[classId2] || [], s, max) }));
  };
  const mcSkillPoolFor = (mKlass) => {
    const choice = mKlass?.multiclassing?.proficienciesGained.skills.choices[0];
    if (!choice) return { count: 0, pool: [] };
    const from = choice.any ? (content?.skills.map((s) => s.name) || []) : (choice.from || []);
    return { count: choice.count, pool: from };
  };
  // Drop a class's skill picks once it's no longer multiclassed in, or
  // once a pick falls outside that class's own gained-skills pool (e.g.
  // an edition switch changed what it offers).
  useEffect(() => {
    setMcSkillPicks((prev) => {
      let changed = false;
      const next = {};
      for (const e of mcEntries) {
        const { count, pool } = mcSkillPoolFor(e.klass);
        const kept = (prev[e.classId] || []).filter((s) => pool.includes(s)).slice(0, count);
        if (kept.length) next[e.classId] = kept;
        if (kept.length !== (prev[e.classId] || []).length) changed = true;
      }
      if (Object.keys(prev).some((k) => !next[k] && prev[k]?.length)) changed = true;
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcEntries, content]);

  const activeClassFeatures = useMemo(() => {
    const feats = featuresAtLevel(klass?.features, level);
    // Once a subclass is picked, its real features (activeSubclassFeatures)
    // replace this "you gain a feature from your subclass" placeholder.
    return subclass && subclassOn ? feats.filter((f) => !f.gainsSubclassFeature) : feats;
  }, [klass, level, subclass, subclassOn]);
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
    setSkillPicks((p) => swapPick(p, s, classSkillCount));
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
          pool: pool.map((o) => ({ id: o.id, name: o.name, text: o.text, blocks: o.blocks })) });
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
    setOptionPicks((prev) => ({ ...prev, [groupKey]: swapPick(prev[groupKey] || [], id, max) }));
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

  // A multiclass entry's "proficiencies gained" armor/weapons are the
  // reduced multiclassing-in subset (normMulticlassing() in
  // content/classes.js), not the full starting-class list — folded in
  // here the same way the primary class's own fixed list is.
  const mcArmorFixed = useMemo(
    () => mcEntries.flatMap((e) => e.klass.multiclassing?.proficienciesGained.armor.fixed || []),
    [mcEntries]);
  const mcWeaponFixed = useMemo(
    () => mcEntries.flatMap((e) => e.klass.multiclassing?.proficienciesGained.weapons.fixed || []),
    [mcEntries]);
  const armorProfDerived = useMemo(
    () => deriveClassArmorProf([...(klass?.armorProf.fixed || []), ...mcArmorFixed]), [klass, mcArmorFixed]);
  const armorProfCats = mergeArmorProf(armorProfDerived.categories, []);
  const weaponProf = useMemo(
    () => mergeWeaponProf(deriveClassWeaponProf([...(klass?.weaponProf.fixed || []), ...mcWeaponFixed], content?.weapons), []),
    [klass, mcWeaponFixed, content]);

  /* Weapon Mastery — 2024-only, a flat class-table column rather than a
     classFeature (see weaponMasteryFromTable in content/classes.js), so
     there's nothing here for `activeClassFeatures` to have already
     surfaced. masteryCount is null for a class/edition that never gets
     the feature (2014 classes, and every 2024 class besides Barbarian/
     Fighter in this SRD slice) — that's "no picker", not "cap of 0".

     One flat masteryPicks array, no bracket-ownership tracking: the
     rules don't care WHICH level a mastered weapon was picked at, only
     that the running total never exceeds the cumulative cap for the
     character's current level. So the UI is split across level panels
     (masteryBumpLevels below — Core Traits gets the level-1 baseline,
     each later bump level a small extra panel, same placement pattern
     Dwight's subclassAnchor uses) purely by giving each bracket its own
     CUMULATIVE ceiling to fill toward; a bracket left unfilled just
     gets borrowed from by a later one, same as the total cap either
     way. masteryCount/masteryLeft (the character's full current-level
     cap) stay exactly as they were — still what gates stepComplete and
     the attackRows note — only the picker's own rendering is split. */
  const masteryCount = klass?.weaponMasteryByLevel ? (klass.weaponMasteryByLevel[level - 1] ?? 0) : null;
  /* Mastery is picked by weapon TYPE, not specific item — a +1/+2/+3
     Greatsword all share the mundane Greatsword's mastery property (see
     masteryKey in content/items.js), so masteryPicks stores type keys
     ("Greatsword"), not item ids, and the pool below is deduped down to
     one entry per type rather than one per magic variant. The `id`/`name`
     shape here is only so MasteryPicker (built against weapon-record-
     shaped rows) doesn't need to know the difference — masteryKey IS
     already the display name, so no separate lookup is needed anywhere
     downstream to show it. */
  const masteryEligibleWeapons = useMemo(() => {
    const proficient = (content?.weapons || []).filter((w) => isWeaponProficient(w, weaponProf));
    const byKey = new Map();
    for (const w of proficient) {
      /* Prefer the mundane record as the type's representative — its
         own rarity/magicBonus don't matter for mastery, but if every
         proficient copy happened to be a magic variant this still
         works fine since the key (and its display name) is the same
         either way. */
      const existing = byKey.get(w.masteryKey);
      if (!existing || (existing.rarity !== "none" && w.rarity === "none")) byKey.set(w.masteryKey, w);
    }
    return [...byKey.values()].map((w) => ({ id: w.masteryKey, name: w.masteryKey }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [content, weaponProf]);
  useEffect(() => {
    if (masteryCount == null) { if (masteryPicks.length) setMasteryPicks([]); return; }
    const eligibleKeys = new Set(masteryEligibleWeapons.map((w) => w.id));
    setMasteryPicks((prev) => {
      const kept = prev.filter((key) => eligibleKeys.has(key)).slice(0, masteryCount);
      return kept.length === prev.length && kept.every((key, i) => key === prev[i]) ? prev : kept;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masteryCount, masteryEligibleWeapons]);
  const masteryLeft = masteryCount == null ? 0 : masteryCount - masteryPicks.length;
  const addMastery = (key, ceiling) => {
    setMasteryPicks((p) => (p.includes(key) || p.length >= ceiling ? p : [...p, key]));
  };
  const removeMastery = (key) => {
    setMasteryPicks((p) => p.filter((x) => x !== key));
  };
  /* Every level (up to the character's current one) where the table's
     cumulative count actually goes up — level 1 is always first (the
     baseline, off `from: 0`), a class with no such level ever again
     (most of them — masteryCount stays null) yields an empty array. */
  const masteryBumpLevels = useMemo(() => {
    const byLevel = klass?.weaponMasteryByLevel;
    if (!byLevel) return [];
    const out = [];
    let prev = 0;
    for (let l = 1; l <= level; l++) {
      const to = byLevel[l - 1] ?? prev;
      if (to > prev) out.push({ level: l, from: prev, to });
      prev = to;
    }
    return out;
  }, [klass, level]);
  const masteryBaseCount = masteryBumpLevels[0]?.level === 1 ? masteryBumpLevels[0].to : null;
  /* Level 1's entry is the baseline Core Traits already renders — only
     the LATER bumps (Barbarian L4/L10, Fighter L4/L10/L16) render as
     content inside the level panel that grants them. */
  const masteryExtraBumps = masteryBumpLevels.filter((b) => b.level > 1);

  const armorOptions = useMemo(() => {
    const list = (content?.armor || []).filter((a) => armorProfCats.includes(a.category));
    return [null, ...list];
  }, [content, armorProfCats]);
  const armor = armorOptions.find((a) => a?.id === armorId) || null;
  /* Magic armor swelled armorOptions well past a button-grid's comfort
     zone (216 armor records vs. a dozen mundane ones). The grid stays
     small by default — mundane armor only, same shape this UI was
     built for — and magic armor surfaces solely through search, capped
     like the item browser below. Whatever's actually equipped stays
     pinned in so switching away from a magic piece doesn't hide it. */
  const mundaneArmorOptions = useMemo(
    () => armorOptions.filter((a) => a === null || a.rarity === "none"),
    [armorOptions]);
  const [armorSearch, setArmorSearch] = useState("");
  const ARMOR_RESULTS_CAP = 20;
  const armorResults = useMemo(() => {
    const q = armorSearch.trim().toLowerCase();
    const magicMatches = q
      ? armorOptions.filter((a) => a && a.rarity !== "none" && a.name.toLowerCase().includes(q))
      : [];
    const pinned = armor && armor.rarity !== "none" && !magicMatches.includes(armor) ? [armor] : [];
    return {
      rows: [...pinned, ...magicMatches.slice(0, ARMOR_RESULTS_CAP)],
      total: magicMatches.length,
    };
  }, [armorOptions, armorSearch, armor]);
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
    setBgSkillPicks((p) => swapPick(p, s, bgSkillChoice.count));
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

  /* ------------------------------------------------------------------
     CUSTOM ITEMS + CURRENCY — the Inventory step's add-item browser and
     4-coin editor. Independent of class/background/ancestry: a picked-up
     magic sword doesn't unpick itself when you change class.
  ------------------------------------------------------------------- */
  const customResolved = useMemo(() => customItems.map((ci) => ({
    ...ci,
    resolved: content?.byId(KIND_COLLECTION[ci.kind], ci.itemId) ?? null,
  })), [customItems, content]);

  const attunedCount = customItems.filter((ci) => ci.attuned).length;

  /* Only attuned custom gear contributes — Ring/Cloak of Protection and
     the like require attunement to work at all, and fixed class/background
     starting equipment never includes an item this overlay covers (all
     rare+, none are SRD starting kit). See itemEffectsOverlay.js. */
  const activeItemEffects = useMemo(
    () => collectEffects(
      customResolved
        .filter((ci) => ci.attuned && ci.resolved?.effects?.length)
        .map((ci) => ({ effects: ci.resolved.effects, atLevel: 1, label: ci.resolved.name })),
      level),
    [customResolved, level]);

  const addCustomItem = (item) => {
    setCustomItems((prev) => {
      const i = prev.findIndex((ci) => ci.itemId === item.id && ci.kind === item.kind);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + 1 };
        return next;
      }
      return [...prev, { itemId: item.id, kind: item.kind, quantity: 1, attuned: false }];
    });
  };
  const setCustomQty = (idx, qty) => {
    setCustomItems((prev) => (qty <= 0 ? prev.filter((_, i) => i !== idx)
      : prev.map((ci, i) => (i === idx ? { ...ci, quantity: qty } : ci))));
  };
  /* The cap is enforced by disabling the control below, not by a warning
     — "filter, don't validate" per CLAUDE.md. */
  const toggleAttune = (idx) => {
    setCustomItems((prev) => {
      const cur = prev[idx];
      if (!cur.attuned && attunedCount >= 3) return prev;
      return prev.map((ci, i) => (i === idx ? { ...ci, attuned: !ci.attuned } : ci));
    });
  };

  const itemBrowsePool = useMemo(
    () => content ? [...content.weapons, ...content.armor, ...content.gear] : [],
    [content]);
  const [itemSearch, setItemSearch] = useState("");
  const [itemKindFilter, setItemKindFilter] = useState("all");
  const ITEM_RESULTS_CAP = 60;
  const itemResults = useMemo(() => {
    const pool = itemKindFilter === "all" ? itemBrowsePool
      : itemKindFilter === "weapon" ? (content?.weapons || [])
        : itemKindFilter === "armor" ? (content?.armor || []) : (content?.gear || []);
    const q = itemSearch.trim().toLowerCase();
    const matches = (q ? pool.filter((it) => it.name.toLowerCase().includes(q)) : pool)
      .slice().sort((a, b) => a.name.localeCompare(b.name));
    return { rows: matches.slice(0, ITEM_RESULTS_CAP), total: matches.length };
  }, [itemBrowsePool, itemKindFilter, itemSearch, content]);

  const setCurrencyField = (k, v) => {
    const n = Math.max(0, parseInt(v, 10) || 0);
    setCurrency((prev) => ({ ...prev, [k]: n }));
  };
  const carriedWeapons = useMemo(
    () => [...classEquipItems, ...bgEquipItems, ...customResolved]
      .filter((it) => it.resolved?.kind === "weapon")
      .flatMap((it) => Array.from({ length: it.quantity || 1 }, () => it.resolved)),
    [classEquipItems, bgEquipItems, customResolved]);

  /* Everything carried, as resolved items rather than the flat display
     strings `gearList` hands the printed sheet — the Sheet page opens a
     drawer on each one, which needs the item's own text/blocks, rarity
     and attunement. Same three sources as gearList, deduped by id (and
     by attunement, so an attuned Ring of Protection doesn't merge with
     a spare unattuned one). Starting-kit entries the loaded ruleset
     can't resolve still get a row, with `item` null. */
  const inventory = useMemo(() => {
    const out = [];
    const push = (res, qty, { attuned = false, fallbackName = null } = {}) => {
      if (!res) {
        if (fallbackName) out.push({ id: `raw:${fallbackName}`, name: fallbackName, kind: "gear", qty, attuned: false, item: null });
        return;
      }
      const prev = out.find((r) => r.id === res.id && r.attuned === attuned);
      if (prev) { prev.qty += qty; return; }
      out.push({ id: res.id, name: res.name, kind: res.kind, qty, attuned, item: res });
    };
    [...classEquipItems, ...bgEquipItems]
      .filter((it) => !it.currency)
      .forEach((it) => push(it.resolved, it.quantity || 1, { fallbackName: it.name }));
    customResolved.forEach((ci) => push(ci.resolved, ci.quantity || 1, { attuned: !!ci.attuned }));
    return out;
  }, [classEquipItems, bgEquipItems, customResolved]);

  const startingGold = useMemo(() => {
    const cp = [...classEquipItems, ...bgEquipItems]
      .filter((it) => it.currency).reduce((s, it) => s + it.valueCp, 0);
    return cp / 100;
  }, [classEquipItems, bgEquipItems]);

  /* One-shot: fills the gp field from the derived class/background total
     but never re-syncs on its own, so it can't clobber a manual edit. */
  const useStartingGold = () => setCurrency((prev) => ({ ...prev, gp: startingGold }));

  /* ------------------------------------------------------------------
     ABILITY SCORES, all sources merged
  ------------------------------------------------------------------- */
  const asiBonuses = useMemo(() => {
    let out = {};
    const allPicks = [...Object.values(asiPicks),
      ...Object.values(mcAsiPicks).flatMap((byLevel) => Object.values(byLevel))];
    for (const p of allPicks) {
      if (p.abilityPicks?.length || p.abilityAuto) {
        out = sumIncreases(out, resolveAbilityChoice(p.abilitySpec, p.abilityPicks));
      }
    }
    return out;
  }, [asiPicks, mcAsiPicks]);

  const allBonuses = useMemo(
    () => sumIncreases(ancestryAbilityBonuses, bgAbilityBonuses, asiBonuses),
    [ancestryAbilityBonuses, bgAbilityBonuses, asiBonuses]);

  const finalScore = (k) => sumFinalScore(k, baseScoreFor(k), allBonuses);
  const prereqScoreExcluding = (k, exclude) => sumFinalScore(k, baseScoreFor(k),
    Object.fromEntries(Object.entries(allBonuses).filter(([, v]) => v !== exclude)));

  /* Ability-score multiclass prerequisites — 2014 SRD only (2024 dropped
     them entirely, see plans/multiclass-srd-rules.md). Only the "class
     being multiclassed into" side is checked: the app never lets a
     character drop below the levels they already have in their primary
     class, so there's no "am I still allowed to have left it" case to
     surface as a picker gate. */
  const meetsMcPrereq = (mKlass) =>
    edition !== "2014" || meetsMulticlassRequirement(mKlass?.multiclassing?.requirements, finalScore);

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

  // Every ASI/feat pick made anywhere on the sheet — primary class or any
  // multiclass entry — tagged with where it came from, so a repeatable-only
  // feat can't be taken twice across the whole character.
  const allAsiEntries = () => {
    const out = [];
    for (const [lvl, p] of Object.entries(asiPicks)) out.push({ source: "primary", level: Number(lvl), p });
    for (const [cid, byLevel] of Object.entries(mcAsiPicks)) {
      for (const [lvl, p] of Object.entries(byLevel)) out.push({ source: cid, level: Number(lvl), p });
    }
    return out;
  };
  const asiFeatPoolCore = (taken) => {
    const base = hasRealAsiFeat ? content.feats.filter((f) => f.category === "G") : [SYNTHETIC_ASI, ...(content?.feats || [])];
    return base.filter((f) => (f.repeatable || !taken.has(f.id)) && meetsPrerequisite(f.prerequisite, prereqCtx));
  };
  const asiFeatPool = (excludeLevel) => asiFeatPoolCore(new Set(allAsiEntries()
    .filter((x) => !(x.source === "primary" && x.level === excludeLevel)).map((x) => x.p.featId)));
  // Same feat-pool logic, scoped to one multiclass entry's own class+level.
  const mcAsiFeatPool = (classId, excludeLevel) => asiFeatPoolCore(new Set(allAsiEntries()
    .filter((x) => !(x.source === classId && x.level === excludeLevel)).map((x) => x.p.featId)));

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
      if (cur.includes(key)) {
        return { ...prev, [atLevel]: { ...entry, abilityPicks: cur.filter((x) => x !== key) } };
      }
      if (cur.length >= slots.count && slots.count !== 1) return prev;
      /* At budget on a 1-slot spec: swap in for the existing pick instead
         of no-op'ing (see swapPick above), but only if that doesn't push
         the new ability over the +20 cap — a hard rule, not a "pick a
         different one instead" situation like the plain swapPick cases. */
      const withRoom = cur.length < slots.count ? cur : cur.slice(1);
      if (prereqScoreExcluding(key, 0) + slots.amountAt(withRoom.length) > 20) return prev;
      return { ...prev, [atLevel]: { ...entry, abilityPicks: [...withRoom, key] } };
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

  // Same picker mechanics as pickAsiFeat/pickAsiAlt/toggleAsiAbilityPick/
  // asiComplete above, scoped to one multiclass entry's own class+level
  // (mcAsiPicks[classId][level] instead of asiPicks[level]).
  const mcAsiLevelsReached = (e) => (e.klass.asiLevels || []).filter((l) => l <= e.level);

  const pickMcAsiFeat = (classId, atLevel, featId) => {
    setMcAsiPicks((prev) => {
      const feat = mcAsiFeatPool(classId, atLevel).find((f) => f.id === featId);
      const byLevel = { ...(prev[classId] || {}) };
      if (!feat) { delete byLevel[atLevel]; return { ...prev, [classId]: byLevel }; }
      byLevel[atLevel] = { featId, abilitySpec: feat.ability?.choices?.[0] || null, abilityAlt: 0, abilityPicks: [], abilityAuto: !feat.ability };
      return { ...prev, [classId]: byLevel };
    });
  };
  const pickMcAsiAlt = (classId, atLevel, altIndex) => {
    setMcAsiPicks((prev) => {
      const entry = prev[classId]?.[atLevel];
      const feat = mcAsiFeatPool(classId, atLevel).find((f) => f.id === entry?.featId);
      const spec = feat?.ability?.choices?.[altIndex];
      return { ...prev, [classId]: { ...(prev[classId] || {}), [atLevel]: { ...entry, abilitySpec: spec, abilityAlt: altIndex, abilityPicks: [] } } };
    });
  };
  const toggleMcAsiAbilityPick = (classId, atLevel, key) => {
    setMcAsiPicks((prev) => {
      const entry = prev[classId]?.[atLevel];
      if (!entry) return prev;
      const slots = abilityChoiceSlots(entry.abilitySpec);
      const cur = entry.abilityPicks || [];
      const withEntry = (next) => ({ ...prev, [classId]: { ...(prev[classId] || {}), [atLevel]: next } });
      if (cur.includes(key)) return withEntry({ ...entry, abilityPicks: cur.filter((x) => x !== key) });
      if (cur.length >= slots.count && slots.count !== 1) return prev;
      const withRoom = cur.length < slots.count ? cur : cur.slice(1);
      if (prereqScoreExcluding(key, 0) + slots.amountAt(withRoom.length) > 20) return prev;
      return withEntry({ ...entry, abilityPicks: [...withRoom, key] });
    });
  };
  const mcAsiComplete = (classId, atLevel) => {
    const entry = mcAsiPicks[classId]?.[atLevel];
    if (!entry) return false;
    if (entry.abilityAuto) return true;
    const slots = abilityChoiceSlots(entry.abilitySpec);
    return (entry.abilityPicks || []).length === slots.count;
  };

  /* Every level up to the character's, sourcebook-style: class/subclass
     features earned at that level, plus the ASI/feat picker where the
     class's asiLevels say one lands. */
  const featuresByLevel = useMemo(() => {
    const map = new Map();
    for (const f of [...activeClassFeatures, ...activeSubclassFeatures]) {
      if (!map.has(f.level)) map.set(f.level, []);
      map.get(f.level).push(f);
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [activeClassFeatures, activeSubclassFeatures]);
  const levelsShown = useMemo(() => {
    const set = new Set([...featuresByLevel.keys(), ...asiLevelsReached]);
    return [...set].filter((l) => l <= level).sort((a, b) => a - b);
  }, [featuresByLevel, asiLevelsReached, level]);
  /* Which level panel the subclass choice sits above. Comes from the
     pack, never from a hardcoded 3: the 2024 classes all say 3, but 2014
     Clerics/Sorcerers/Warlocks say 1 and Wizards say 2. Null when that
     level isn't on screen yet — the panel then goes last. */
  const subclassAnchor = useMemo(
    () => (klass?.subclassLevel != null && levelsShown.includes(klass.subclassLevel)
      ? klass.subclassLevel : null),
    [klass, levelsShown]);


  /* ------------------------------------------------------------------
     DEFENSES — AC, saves, passives, attacks
  ------------------------------------------------------------------- */
  const scoresForRules = Object.fromEntries(ABILITY_KEYS.map((k) => [k, finalScore(k)]));
  const acRows = useMemo(() => {
    if (!ancestry) return [];
    return acCandidates({
      armor, shield: shieldOn ? { ac: 2 } : null, scores: scoresForRules, formulas: [],
      bonus: sumEffect(activeItemEffects, "acBonus"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancestry, armor, shieldOn, scores, arrayAssign, mode, allBonuses, activeItemEffects]);
  const bestAC = acRows[0] || { value: 10, label: "Unarmoured", parts: "" };
  const armorClass = bestAC.value;

  const speed = ancestry?.speed.walk || 0;
  // Proficiency bonus is the one number the SRD keys off TOTAL character
  // level rather than any one class's own level (progression.js:profBonus
  // already takes a bare level, so multiclassing needed no change there).
  const pb = profBonus(totalCharLevel);

  /* Raw ability scores with none of the ancestry/background/ASI bonuses
     applied — the "base" half of the base-vs-your-level comparison shown
     on saving throws and passives, next to the already-bonused scores. */
  const baseScoresForRules = Object.fromEntries(ABILITY_KEYS.map((k) => [k, baseScoreFor(k)]));

  const saveThrowRows = useMemo(
    () => savingThrowsOf({
      scores: scoresForRules, saves: klass?.saves || [], pb,
      bonus: sumEffect(activeItemEffects, "saveBonus"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [klass, pb, scores, arrayAssign, mode, allBonuses, activeItemEffects]);
  const baseSaveThrowRows = useMemo(
    () => savingThrowsOf({ scores: baseScoresForRules, saves: klass?.saves || [], pb, bonus: 0 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [klass, pb, scores, arrayAssign, mode]);

  const allSkills = useMemo(
    () => new Set([...ancestrySkillsGranted, ...skillPicks, ...bgSkillsGranted, ...Object.values(mcSkillPicks).flat()]),
    [ancestrySkillsGranted, skillPicks, bgSkillsGranted, mcSkillPicks]);

  /* abilityCheckBonus with no `skills` list (Stone of Good Luck: "ability
     checks" broadly) applies to every skill row; one that names specific
     skills (a future Thaumaturge-shaped effect: Arcana/Religion only)
     applies to just those. Post-processed onto skillTableOf's output
     rather than threaded through it — the rule itself has no notion of
     "item effects", only ability score + proficiency. */
  const skillRows = useMemo(() => {
    if (!content) return [];
    const base = skillTableOf({ skills: content.skills, scores: scoresForRules, pb, proficient: allSkills });
    const checkEffects = effectsOfType(activeItemEffects, "abilityCheckBonus");
    if (!checkEffects.length) return base;
    return base.map((row) => {
      const add = checkEffects
        .filter((e) => !e.skills || e.skills.includes(row.id))
        .reduce((n, e) => n + (e.value || 0), 0);
      return add ? { ...row, value: row.value + add } : row;
    });
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content, pb, allSkills, scores, arrayAssign, mode, allBonuses, activeItemEffects]);

  const baseSkillRows = useMemo(() => {
    if (!content) return [];
    return skillTableOf({ skills: content.skills, scores: baseScoresForRules, pb, proficient: allSkills });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, pb, allSkills, scores, arrayAssign, mode]);

  const PASSIVE_NAMES = ["Perception", "Investigation", "Insight"];
  const passiveSkills = PASSIVE_NAMES.map((name) => {
    const row = skillRows.find((s) => s.name === name);
    const baseRow = baseSkillRows.find((s) => s.name === name);
    return { name, value: row ? passiveScore(row) : 10, baseValue: baseRow ? passiveScore(baseRow) : 10 };
  });
  const initiative = ancestry ? finalScore("dex") - 10 : 0; // placeholder, replaced below

  const hitPoints = useMemo(() => klass
    ? hitPointsMulticlass(
      [{ hitDie: klass.hitDie, level }, ...mcEntries.map((e) => ({ hitDie: e.klass.hitDie, level: e.level }))],
      finalScore("con"))
    : 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [klass, level, mcEntries, scores, arrayAssign, mode, allBonuses]);

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
      /* Only the weapon TYPES actually picked in the Core Traits mastery
         picker, not every carried weapon's intrinsic mastery property —
         see masteryPicks/masteryKey above. Matched by masteryKey, not
         item id, so a +2 Greatsword correctly shows Graze once
         "Greatsword" is mastered without the player ever picking the
         magic version specifically. A weapon's mastery text is what it
         WOULD grant if mastered, not something every wielder gets for
         free just by carrying it. */
      if (masteryPicks.includes(w.masteryKey)) (w.mastery || []).forEach((m) => notes.push(`Mastery: ${m.name}`));
      return {
        key: w.id, name: qty > 1 ? `${w.name} ×${qty}` : w.name,
        range: w.range ? `${w.range.label.replace("/", " / ")} ft` : (w.weaponKind === "ranged" ? "—" : "5 ft"),
        hitOrDC: fmt(atk), damage: w.dmg ? `${w.dmg}${fmt(dmgMod)}` : "—",
        dmgType: w.dmgType, notes: notes.join(", "), proficient,
        /* The Sheet's weapon drawer prints the properties and
           masteries in full, not just their labels, so it needs the
           resolved item rather than the flattened `notes` string.
           Unused by the print routes, which only read the columns. */
        weapon: w,
      };
    });
    const strMod = mod(finalScore("str"));
    rows.push({ key: "unarmed", name: "Unarmed Strike", range: "5 ft",
      hitOrDC: fmt(strMod + pb), damage: `${1 + strMod}`, dmgType: "bludgeoning", notes: "", proficient: true });
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klass, carriedWeapons, weaponProf, pb, scores, arrayAssign, mode, allBonuses, masteryPicks]);

  /* How many attacks the Attack action itself makes, from Extra Attack.
     Multiclassing doesn't add Extra Attacks together — you use whichever
     single class's own feature is best, so this is a max across classes,
     not a sum. Fighter is the only SRD class whose count keeps climbing
     (2 at 5th, 3 at 11th, 4 at 20th, all *in that class*); every other
     class granting Extra Attack tops out at 2. */
  const extraAttackCount = (k, lvl) => {
    if (!featuresAtLevel(k?.features, lvl).some((f) => f.name === "Extra Attack")) return 1;
    if (k.name === "Fighter") return lvl >= 20 ? 4 : lvl >= 11 ? 3 : 2;
    return 2;
  };
  const attacksPerAction = useMemo(() => Math.max(
    klass ? extraAttackCount(klass, level) : 1,
    ...mcEntries.map((e) => extraAttackCount(e.klass, e.level)),
  ), [klass, level, mcEntries]);

  /* ------------------------------------------------------------------
     SPELLCASTING
  ------------------------------------------------------------------- */
  /* Every caster class the character has, primary first — a single-class
     character's list is just [klass]. Warlock Pact Magic is split off
     separately below since it never joins the shared multiclass slot
     pool (see plans/multiclass-srd-rules.md). */
  const casterList = useMemo(() => {
    const list = [];
    if (klass?.casting) list.push({ classId: klass.id, className: klass.name, casting: klass.casting, level });
    mcEntries.forEach((e) => {
      if (e.klass.casting) list.push({ classId: e.klass.id, className: e.klass.name, casting: e.klass.casting, level: e.level });
    });
    return list;
  }, [klass, level, mcEntries]);

  const fullCasterSlotTable = useMemo(
    () => content?.classes.find((c) => c.casting?.progression === "full")?.casting.slotsByLevel || null,
    [content]);

  const casting = useMemo(() => {
    if (!casterList.length) return null;
    const nonPact = casterList.filter((c) => c.casting.progression !== "pact");
    const pactCaster = casterList.find((c) => c.casting.progression === "pact") || null;
    const slots = combinedSpellSlots(
      nonPact.map((c) => ({ progression: c.casting.progression, level: c.level })), fullCasterSlotTable);
    const pact = pactCaster ? pactSlots(pactCaster.casting, pactCaster.level) : null;
    // Ability/save DC/attack are shown for whichever caster class comes
    // first in the list (the primary class if it casts, else the first
    // multiclass caster) — a genuinely multiclass caster has one of these
    // per class in play, but the sheet has one "spellcasting" block; each
    // class's own is still listed in `sources` below.
    const primaryCaster = casterList[0];
    const stats = spellcastingStats({ ability: primaryCaster.casting.ability, scores: scoresForRules, pb });
    const label = casterList.length > 1
      ? `Multiclass spellcasting (${casterList.map((c) => `${c.className} ${c.level}`).join(" / ")})`
      : `${primaryCaster.className} spellcasting`;
    /* A caster who has no slots yet — a half caster at level 1, whose
       class table starts at 2. Every consumer below checks `pending`
       first, except highestSlot, which read casting.slots.length and
       crashed the whole step; the empty array is carried here rather
       than guarded there so no future reader can trip on it either. */
    if (!slots.length && !pact) return { pending: true, label, slots: [], pact: null };
    const cantrips = casterList.reduce((n, c) => n + (cantripsKnown(c.casting, c.level) || 0), 0) || null;
    const known = casterList.filter((c) => c.casting.prepares === "known")
      .reduce((n, c) => n + (spellsKnown(c.casting, c.level) || 0), 0) || null;
    const prepared = casterList.filter((c) => c.casting.prepares === "prepared")
      .reduce((n, c) => n + (preparedCount(c.casting, c.level, scoresForRules[c.casting.ability]) || 0), 0) || null;
    const spellbook = casterList.filter((c) => c.casting.prepares === "spellbook")
      .reduce((n, c) => n + (spellbookSize(c.level) || 0), 0) || null;
    return {
      label, ability: primaryCaster.casting.ability, abMod: stats.abilityMod,
      saveDC: stats.saveDC, attack: stats.attack,
      cantrips, known, prepared, spellbook, slots, pact,
      sources: casterList.map((c) => ({ classId: c.classId, className: c.className, level: c.level, ability: c.casting.ability })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casterList, fullCasterSlotTable, pb, scores, arrayAssign, mode, allBonuses]);

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
      // 2024 lineages (Tiefling's Fiendish Legacy, etc.) let the player
      // pick which of a few abilities powers this spellcasting rather
      // than fixing one — there's no picker UI for that choice yet, so
      // default to whichever candidate is actually highest, which is
      // what an optimal pick lands on anyway.
      let abilityKey = null, abilityMod = null;
      if (typeof block.ability === "string") {
        abilityKey = block.ability;
        abilityMod = mod(finalScore(block.ability));
      } else if (block.ability?.choose?.length) {
        abilityKey = block.ability.choose.reduce(
          (best, k) => (mod(finalScore(k)) > mod(finalScore(best)) ? k : best), block.ability.choose[0]);
        abilityMod = mod(finalScore(abilityKey));
      }
      block.grants.forEach((g, gi) => {
        if (level < (g.atLevel ?? 1)) return;
        g.spells.forEach((s) => {
          const sp = content.spells.find((x) => x.name.toLowerCase() === s.name.toLowerCase());
          if (sp) rows.push({ sp, from: ancestry.name, use: grantCadence(g), abilityMod, abilityKey, key: `${bi}-fixed-${s.name}` });
        });
        g.choices.forEach((c, ci) => {
          const key = `${bi}-${gi}-${ci}`;
          const picks = ancestrySpellPicks[key] || [];
          const pool = spellsMatchingFilter(content.spells, c.filter);
          picks.forEach((id) => {
            const sp = pool.find((x) => x.id === id);
            if (sp) rows.push({ sp, from: ancestry.name, use: grantCadence(g), abilityMod, abilityKey, key: `${key}-${id}`, chosen: true });
          });
        });
      });
    });
    return rows.sort((a, b) => a.sp.level - b.sp.level || a.sp.name.localeCompare(b.sp.name));
  }, [content, activeAdditionalSpells, ancestry, level, ancestrySpellPicks]); // eslint-disable-line react-hooks/exhaustive-deps

  const highestSlot = casting ? Math.max(casting.slots.length, casting.pact ? casting.pact.level : 0) : 0;
  const availableSpells = useMemo(() => {
    if (!content || !casterList.length || !casting || casting.pending) return [];
    const casterClassIds = new Set(casterList.map((c) => c.classId));
    return content.spells.filter((sp) => sp.classLists.some((id) => casterClassIds.has(id))
      && (sp.level === 0 || sp.level <= highestSlot));
  }, [content, casterList, casting, highestSlot]);

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

  /* Spells step search/filter — pure narrowing layer over `availableSpells`.
     Filtering never touches `pickedSpellIds`/budgets, so a spell picked while
     a filter hid it stays picked. Cantrips and leveled spells get separate
     state since they're two independent lists on the same step. A Class or
     Level control only renders when its section's pool actually has more
     than one distinct value — a single-class character or the cantrip list
     (always level 0) would otherwise show a dead, single-option filter. */
  const [cantripSearch, setCantripSearch] = useState("");
  const [cantripClassFilter, setCantripClassFilter] = useState("all");
  const [cantripSchoolFilter, setCantripSchoolFilter] = useState("all");
  const [spellSearch, setSpellSearch] = useState("");
  const [spellClassFilter, setSpellClassFilter] = useState("all");
  const [spellSchoolFilter, setSpellSchoolFilter] = useState("all");
  const [spellLevelFilter, setSpellLevelFilter] = useState("all");

  const availableCantrips = useMemo(() => availableSpells.filter((s) => s.level === 0), [availableSpells]);
  const availableLeveledSpells = useMemo(() => availableSpells.filter((s) => s.level > 0), [availableSpells]);
  const cantripSchools = useMemo(
    () => Array.from(new Set(availableCantrips.map((s) => s.school))).sort(), [availableCantrips]);
  const spellSchools = useMemo(
    () => Array.from(new Set(availableLeveledSpells.map((s) => s.school))).sort(), [availableLeveledSpells]);
  const spellLevels = useMemo(
    () => Array.from(new Set(availableLeveledSpells.map((s) => s.level))).sort((a, b) => a - b), [availableLeveledSpells]);

  const filteredCantrips = useMemo(() => {
    const q = cantripSearch.trim().toLowerCase();
    return availableCantrips.filter((sp) =>
      (cantripClassFilter === "all" || sp.classLists.includes(cantripClassFilter))
      && (cantripSchoolFilter === "all" || sp.school === cantripSchoolFilter)
      && (!q || sp.name.toLowerCase().includes(q)));
  }, [availableCantrips, cantripSearch, cantripClassFilter, cantripSchoolFilter]);

  const filteredLeveledSpells = useMemo(() => {
    const q = spellSearch.trim().toLowerCase();
    return availableLeveledSpells.filter((sp) =>
      (spellClassFilter === "all" || sp.classLists.includes(spellClassFilter))
      && (spellSchoolFilter === "all" || sp.school === spellSchoolFilter)
      && (spellLevelFilter === "all" || sp.level === Number(spellLevelFilter))
      && (!q || sp.name.toLowerCase().includes(q)));
  }, [availableLeveledSpells, spellSearch, spellClassFilter, spellSchoolFilter, spellLevelFilter]);

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
    setAncestrySpellPicks((prev) => ({ ...prev, [key]: swapPick(prev[key] || [], id, max) }));
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
    for (const e of mcEntries) {
      for (const [atLevel, entry] of Object.entries(mcAsiPicks[e.classId] || {})) {
        const feat = mcAsiFeatPool(e.classId, Number(atLevel)).find((f) => f.id === entry.featId)
          || (entry.featId === "__asi" ? SYNTHETIC_ASI : null);
        if (!feat) continue;
        const slots = abilityChoiceSlots(entry.abilitySpec);
        const bonus = entry.abilityPicks?.length
          ? entry.abilityPicks.map((k, i) => `+${slots.amountAt(i)} ${k.toUpperCase()}`).join(", ") : null;
        out.push({ feat, from: `${e.klass.name} level ${atLevel}`, abilityPicks: entry.abilityPicks, bonus });
      }
    }
    if (bgFeat) out.push({ feat: bgFeat, from: background.name, abilityPicks: [], bonus: null });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asiPicks, mcAsiPicks, mcEntries, bgFeat, background]);

  const actions = useMemo(() => {
    const out = [];
    // Ancestry traits carry a structured `action` field from the pack;
    // class/subclass features don't, so those fall back to sniffing the
    // feature's own prose (inferActionBucket) for "as a bonus action" /
    // "as a reaction" — otherwise things like Rage or Second Wind would
    // never surface here at all.
    // `category` splits the Summary step's Bonus/Reaction tabs into
    // sublists (class features vs. everything else) — spells get their
    // own sublist there straight from chosenSpells/ancestrySpells.
    (ancestry?.traits || []).forEach((t) => {
      const action = t.action || inferActionBucket(t.text);
      if (action) out.push({ name: t.name, source: ancestry.name, action, category: "other", text: t.text, blocks: t.blocks,
        section: `Ancestry traits — ${ancestry.name}` });
    });
    activeClassFeatures.forEach((f) => {
      const action = f.action || inferActionBucket(f.text);
      if (action) out.push({ name: f.name, source: klass.name, action, category: "class", text: f.text, blocks: f.blocks,
        section: `${klass.name} features` });
    });
    activeSubclassFeatures.forEach((f) => {
      const action = f.action || inferActionBucket(f.text);
      if (action) out.push({ name: f.name, source: subclass.name, action, category: "class", text: f.text, blocks: f.blocks,
        section: `${subclass.name}` });
    });
    mcEntries.forEach((e) => {
      featuresAtLevel(e.klass.features, e.level).forEach((f) => {
        const action = f.action || inferActionBucket(f.text);
        if (action) out.push({ name: f.name, source: e.klass.name, action, category: "class", text: f.text, blocks: f.blocks,
          section: `${e.klass.name} features` });
      });
      if (e.subclass && e.subclassOn) {
        featuresAtLevel(e.subclass.features, e.level).forEach((f) => {
          const action = f.action || inferActionBucket(f.text);
          if (action) out.push({ name: f.name, source: e.subclass.name, action, category: "class", text: f.text, blocks: f.blocks,
            section: `${e.subclass.name}` });
        });
      }
    });
    return out;
  }, [ancestry, klass, activeClassFeatures, subclass, activeSubclassFeatures, mcEntries]);

  const appendix = useMemo(() => {
    const out = [];
    for (const { feat, from, bonus } of chosenFeats) {
      out.push({ group: "Feats", name: `${feat.name}${bonus ? ` (${bonus})` : ""}`, text: `${from}. ${feat.text}`,
        /* `text` stays flat for the printed sheet (sheetHtml.js); `blocks`
           is the structured version SheetSummary's interactive view
           renders instead, so it doesn't collapse to one paragraph. */
        blocks: [{ type: "para", text: `${from}.` }, ...feat.blocks] });
    }
    const spellEntry = (sp) => ({ group: "Spells", name: sp.name,
      text: `${sp.level === 0 ? "Cantrip" : `Level ${sp.level}`} ${sp.school}. ` +
        `Casting time ${sp.time}. Range ${sp.range}. Components ${sp.components}. Duration ${sp.duration}.` +
        `${sp.ritual ? " Ritual." : ""}${sp.concentration ? " Concentration." : ""} ${sp.text}` +
        `${sp.higherLevels ? ` At Higher Levels. ${sp.higherLevels}` : ""}`,
      blocks: [
        { type: "para", text: `${sp.level === 0 ? "Cantrip" : `Level ${sp.level}`} ${sp.school}. ` +
          `Casting time ${sp.time}. Range ${sp.range}. Components ${sp.components}. Duration ${sp.duration}.` +
          `${sp.ritual ? " Ritual." : ""}${sp.concentration ? " Concentration." : ""}` },
        ...sp.blocks,
        ...(sp.higherLevelBlocks?.length ? [{ type: "section", name: "At Higher Levels", blocks: sp.higherLevelBlocks }] : []),
      ] });
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
    if (name === "Ruleset") return !!content;
    if (name === "Species/Race") return !!ancestry && ancestryChoiceMade;
    if (name === "Abilities") return mode === "pointbuy" ? true : Object.keys(arrayAssign).length === 6;
    if (name === "Class") {
      if (!klass) return false;
      if (skillsLeft > 0) return false;
      if (masteryLeft > 0) return false;
      if (optionChoiceGroups.some((g) => (optionPicks[g.key] || []).length < g.budget)) return false;
      if (klass.subclassLevel != null && subclassOn && !subclass) return false;
      if (asiIncomplete) return false;
      for (const e of mcEntries) {
        if (!meetsMcPrereq(e.klass)) return false;
        if (e.klass.subclassLevel != null && e.subclassOn && !e.subclass) return false;
        const { count } = mcSkillPoolFor(e.klass);
        if ((mcSkillPicks[e.classId] || []).length < count) return false;
        if (mcAsiLevelsReached(e).some((l) => !mcAsiComplete(e.classId, l))) return false;
      }
      return true;
    }
    if (name === "Background") {
      if (!background) return false;
      if (bgSkillChoice && bgSkillPicks.length !== bgSkillChoice.count && bgSkillPool.length >= bgSkillChoice.count) return false;
      if (background.abilityChoices && !bgAbilitySlots.auto && bgAbilityPicks.length !== bgAbilitySlots.count) return false;
      return true;
    }
    return true;
  };
  const canAdvance = () => stepComplete(here);
  /* Reachable by clicking a rail step directly: whatever that step's own
     render actually needs to show something, not "every step before it
     is done" — Class and Abilities only read `content` (an ancestry
     bonus is just +0 until one's picked) and Background degrades to its
     own "pick X first" stub when visited early, so neither gates on
     anything upstream. Inventory, Player Info and Summary do read
     ancestry-derived numbers (AC, proficiencies, the whole sheet) and
     render nothing without it, so those stay gated on ancestry; Spells
     on having a caster. */
  const stepPrereqOk = (name) => {
    if (name === "Ruleset") return true;
    if (name === "Inventory" || name === "Player Info" || name === "Summary") return !!ancestry;
    if (name === "Spells") return !!casting;
    return !!content;
  };
  const stepReachable = (i) => stepPrereqOk(STEPS[i]);
  /* What the rail tooltip says on a step it won't let you jump to yet —
     names the actual missing thing, same list stepPrereqOk checks. */
  const stepLockedReason = (name) => {
    if (name === "Ruleset") return null;
    if (name === "Inventory" || name === "Player Info" || name === "Summary") return ancestry ? null : "Pick a species first";
    if (name === "Spells") return casting ? null : "Pick a spellcasting class first";
    return content ? null : "Pick a ruleset first";
  };
  /* Gate every download on the whole character being finished, not just
     reached — the Summary step itself has no completeness rule of its own
     (stepComplete falls through to true for it), so it's excluded here. */
  const allStepsDone = STEPS.every((s) => s === "Summary" || stepComplete(s));

  /* ------------------------------------------------------------------
     PERSISTENCE
  ------------------------------------------------------------------- */
  const snapshot = useMemo(() => ({
    edition, step, maxStep, ancestryId, ancestryPicks, ancestrySpellPicks, mode, scores, arrayAssign,
    name, backstory, classId, level, subclassId, skillPicks, optionPicks, asiPicks, masteryPicks,
    multiclasses, mcSkillPicks, mcAsiPicks,
    bgId, bgSkillPicks, bgAbilityAlt, bgAbilityPicks, armorId, hasShield,
    classEquipPicks, bgEquipPicks, pickedSpellIds, customItems, currency,
  }), [edition, step, maxStep, ancestryId, ancestryPicks, ancestrySpellPicks, mode, scores, arrayAssign,
    name, backstory, classId, level, subclassId, skillPicks, optionPicks, asiPicks, masteryPicks,
    multiclasses, mcSkillPicks, mcAsiPicks,
    bgId, bgSkillPicks, bgAbilityAlt, bgAbilityPicks, armorId, hasShield,
    classEquipPicks, bgEquipPicks, pickedSpellIds, customItems, currency]);

  useEffect(() => { saveSnapshot(snapshot); }, [snapshot]);

  /* Saving to an account is now an explicit action (the Sheet step's "Save
     to my account" button), not automatic — with several characters
     possible per account, silently pushing every edit would need to know
     WHICH of the account's saved characters this session's edits belong
     to, and there's no such link yet (this in-progress character may not
     even be one of them). See Account.jsx's own note on what's deferred. */
  const [savedCharacterId, setSavedCharacterId] = useState(null);
  const [saveAccountState, setSaveAccountState] = useState("idle"); // idle | working | done | limit_reached | error
  const saveToAccount = async () => {
    if (!session?.user?.id) return;
    setSaveAccountState("working");
    if (savedCharacterId) {
      const ok = await updateCharacter(savedCharacterId, snapshot, name);
      setSaveAccountState(ok ? "done" : "error");
      return;
    }
    const result = await createCharacter(session.user.id, name, snapshot);
    if (result.character) {
      setSavedCharacterId(result.character.id);
      setSaveAccountState("done");
    } else {
      setSaveAccountState(result.error === "limit_reached" ? "limit_reached" : "error");
    }
  };

  const resetAll = () => {
    clearSaved();
    pickEdition(DEFAULTS.edition);
    setStep(DEFAULTS.step);
    setMaxStep(DEFAULTS.step);
    setName(DEFAULTS.name); setBackstory(DEFAULTS.backstory);
    setSavedCharacterId(null); setSaveAccountState("idle");
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

  // "Fighter 3 (Champion) / Rogue 2 (Thief)" — each class carries its OWN
  // subclass in parens right after its level, not one subclass tacked onto
  // the end of the whole label (that misattributed it when multiclassed).
  // Single-class characters just get "Fighter 3" or "Fighter 3 (Champion)",
  // same as before — mcEntries is [] for them so this collapses to a
  // single-element join.
  const classLabel = klass
    ? [{ name: klass.name, level, sub: subclass && subclassOn ? subclass.name : null },
        ...mcEntries.map((e) => ({ name: e.klass.name, level: e.level, sub: e.subclass && e.subclassOn ? e.subclass.name : null }))]
      .map((c) => `${c.name} ${c.level}${c.sub ? ` (${c.sub})` : ""}`).join(" / ")
    : null;
  /* Same label with the subclasses dropped — "Fighter 3 / Rogue 2". The
     Sheet's header identity line wants the classes only; which Martial
     Archetype you took isn't what you're checking mid-turn, and it's a
     tap away on the Features screen. */
  const classLabelShort = klass
    ? [{ name: klass.name, level }, ...mcEntries.map((e) => ({ name: e.klass.name, level: e.level }))]
      .map((c) => `${c.name} ${c.level}`).join(" / ")
    : null;
  const hitDieLabel = klass
    ? [{ hitDie: klass.hitDie, level }, ...mcEntries.map((e) => ({ hitDie: e.klass.hitDie, level: e.level }))]
      .map((c) => `${c.level}d${c.hitDie}`).join(" + ")
    : null;

  const sheetCtx = {
    ancestry, klass, level, subclass, subclassReady: subclassOn, background, name, resolved,
    classLabel, classLabelShort, hitDieLabel, totalCharLevel,
    armorClass, hitPoints, speed, initiative: mod(finalScore("dex")), passivePerception: passiveSkills[0]?.value ?? 10,
    /* The winning AC candidate, not just its number — {label, parts}
       is the arithmetic ("Chain Mail + DEX +0"), which the Sheet's
       header opens in a drawer. */
    bestAC,
    passiveSkills, actions, pb, armor: armor || { id: "none", name: "None" }, shieldOn,
    savingThrows: saveThrowRows.map((s) => ({ key: s.key, label: ABILITIES.find((a) => a.key === s.key)?.label || s.key,
      proficient: s.proficient, value: s.value })),
    abilities: ABILITIES.map(({ key, label }) => ({ key, label,
      mod: fmt(mod(finalScore(key))), score: finalScore(key) })),
    skillTable: skillRows, casting, chosenSpells: pickedSpells, appendix,
    bgChoice: null, finalScore, attackRows, attacksPerAction, carriedWeapons, masteryEnabled: true,
    startingGold, currency,
    gearList: [
      ...[...classEquipItems, ...bgEquipItems]
        .filter((it) => !it.currency && it.resolved?.kind !== "weapon" && it.resolved?.kind !== "armor")
        .map((it) => `${it.name}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`),
      ...customResolved.filter((ci) => ci.resolved?.kind === "gear")
        .map((ci) => `${ci.resolved.name}${ci.quantity > 1 ? ` ×${ci.quantity}` : ""}${magicSuffix(ci.resolved, ci.attuned)}`),
    ],
    toolsList: background?.tools.fixed || [],
    edition,
    inventory,
    /* Senses and damage defenses, for the Sheet's Stats screen. Damage
       immunities aren't a thing any SRD species or class grants a
       player character, so `immunities` is an empty list the UI still
       prints a row for ("None") rather than a field that only appears
       once some future pack has one. */
    defenses: {
      senses: [
        ...(resolved?.darkvision > 0 ? [["Darkvision", `${resolved.darkvision} ft`]] : []),
        ...(resolved?.blindsight > 0 ? [["Blindsight", `${resolved.blindsight} ft`]] : []),
      ],
      /* A species resistance can be a straight type (Dwarf's poison) or
         a choice the pack doesn't tie back to a pick (Dragonborn's
         Draconic Ancestry) — say which choice it is rather than guess a
         type or drop the row. */
      resistances: [...new Set([
        ...(ancestry?.resist || []).map((r) => (r.type
          ? r.type
          : `one of ${(r.from || []).join(", ")}`)),
        ...effectsOfType(activeItemEffects, "resistance").flatMap((e) => e.value || []),
      ])],
      immunities: [],
    },
    ancestrySpells: ancestrySpellGrants.map((g) => ({ ...g.sp, key: g.key, from: g.from, use: g.use,
      ability: g.abilityMod != null ? g.abilityKey : null,
      saveDC: g.abilityMod != null ? 8 + pb + g.abilityMod : null,
      attack: g.abilityMod != null ? pb + g.abilityMod : null })),
    chosenFeats: chosenFeats.map(({ feat, from, bonus }) => ({ id: feat.id, name: feat.name, text: feat.text, feat, from, bonus })),
    classFeatures: [
      ...activeClassFeatures, ...activeSubclassFeatures,
      ...mcEntries.flatMap((e) => [
        ...featuresAtLevel(e.klass.features, e.level).filter((f) => !(e.subclass && e.subclassOn && f.gainsSubclassFeature)),
        ...(e.subclass && e.subclassOn ? featuresAtLevel(e.subclass.features, e.level) : []),
      ]),
    ].map((f) => ({ level: f.level, name: f.name, text: f.text, blocks: f.blocks })),
    // Same features as `classFeatures` above, kept per-class instead of
    // merged flat — only the Summary step's tabbed Class Features panel
    // reads this; the print routes still use the flat `classFeatures`.
    classFeatureGroups: klass ? [
      { classId: klass.id, className: klass.name,
        features: [...activeClassFeatures, ...activeSubclassFeatures]
          .map((f) => ({ level: f.level, name: f.name, text: f.text, blocks: f.blocks })) },
      ...mcEntries.map((e) => ({
        classId: e.klass.id, className: e.klass.name,
        features: [
          ...featuresAtLevel(e.klass.features, e.level).filter((f) => !(e.subclass && e.subclassOn && f.gainsSubclassFeature)),
          ...(e.subclass && e.subclassOn ? featuresAtLevel(e.subclass.features, e.level) : []),
        ].map((f) => ({ level: f.level, name: f.name, text: f.text, blocks: f.blocks })),
      })),
    ] : [],
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
    const head = klass ? `${ancestry.name} ${classLabel}` : ancestry.name;
    L.push(`${name || "Unnamed"} — ${head}${background ? ` · ${background.name}` : ""}`);
    if (subclass && subclassOn) L.push(`${klass.subclassTitle || "Subclass"}: ${subclass.name}`);
    mcEntries.forEach((e) => {
      if (e.subclass && e.subclassOn) L.push(`${e.klass.subclassTitle || "Subclass"}: ${e.subclass.name} (${e.klass.name})`);
    });
    L.push("");
    L.push(ABILITIES.map(({ key }) =>
      `${key.toUpperCase()} ${finalScore(key)} (${fmt(mod(finalScore(key)))})`).join("   "));
    L.push("");
    if (klass) {
      L.push(`Hit points ${hitPoints}   Hit die ${hitDieLabel}   Proficiency ${fmt(pb)}`);
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
      L.push(mcEntries.length ? "CLASS FEATURES" : `${klass.name.toUpperCase()} FEATURES`);
      [...activeClassFeatures, ...activeSubclassFeatures].forEach((f) => L.push(`• ${f.name} (${klass.name})`));
      mcEntries.forEach((e) => {
        featuresAtLevel(e.klass.features, e.level)
          .filter((f) => !(e.subclass && e.subclassOn && f.gainsSubclassFeature))
          .forEach((f) => L.push(`• ${f.name} (${e.klass.name})`));
        if (e.subclass && e.subclassOn) featuresAtLevel(e.subclass.features, e.level).forEach((f) => L.push(`• ${f.name} (${e.klass.name})`));
      });
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
    activeClassFeatures, activeSubclassFeatures, mcEntries, classLabel, hitDieLabel, startingGold, backstory]);

  // One multiclass entry's card — level stepper, ability-score prereq,
  // subclass picker, proficiencies gained, features. Used by the Class
  // step's per-class tabs (one call per active tab) once there's at least
  // one multiclass entry; the entry-picker under the Multiclass panel calls
  // addMulticlass directly instead of going through here.
  /* The subclass panel renders next to the level that actually earns it,
     which is class- AND edition-dependent: 2024 unified every class on
     level 3, but 2014 has Clerics/Sorcerers/Warlocks choosing at 1 and
     Wizards at 2. klass.subclassLevel already carries that number (it's
     read off the pack's own subclass feature levels in content/classes.js),
     so nothing here hardcodes a level. */
  const renderSubclassPanel = () => (
    <Section title={klass.subclassTitle || "Subclass"}
             flag={subclassOn && !subclass}>
      {!subclassOn ? (
        <p className="byo-note">{klass.name}s choose at level {klass.subclassLevel}. You're level {level}, so nothing to decide yet.</p>
      ) : (
        <div className="byo-card-grid" style={{ marginTop: 8 }}>
          {klass.subclasses.map((s) => {
            const sel = s.id === subclassId;
            const now = featuresAtLevel(s.features, level);
            return (
              <button key={s.id} className={`byo-card ${sel ? "is-sel" : ""}`}
                      onClick={() => { setSubclassId(s.id); setOptionPicks({}); }} aria-pressed={sel}>
                <div className="byo-card-top">
                  <span className={`byo-dot${sel ? " is-on" : ""}`} aria-hidden="true" />
                  <span className="byo-card-name">{s.name}</span>
                  {s.page && <span className="byo-card-kind">p.{s.page}</span>}
                </div>
                <div className="byo-pills" style={{ marginTop: 8 }}>
                  {now.length ? now.map((f) => <span className="byo-pill" key={f.id}>{f.name}</span>)
                    : <span className="byo-pill alt">no features yet</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Section>
  );

  /* One of masteryExtraBumps — a level where the class's Weapon Mastery
     table count goes up (not a classFeature, so featuresByLevel never
     surfaces it on its own). Same one flat masteryPicks array as the
     Core Traits baseline picker, just filling toward THIS bracket's own
     cumulative ceiling — see the note above masteryBumpLevels.

     Unlike the subclass panel (its own byo-panel box, positioned above
     the level it belongs to), this renders WITHOUT an outer box — the
     caller drops it straight inside that level's own panel, alongside
     Ability Score Improvement, the same way a feature entry sits inside
     the level box rather than getting a box of its own. */
  const renderMasteryBumpContent = (bump) => (
    /* byo-ct-picker, same class the picker below (and every merged-in
       subsection on this step) uses for its own divider — not a bare
       margin, so a merged subsection always gets the established rule
       + wide gap treatment rather than looking butted against whatever
       came before it. */
    <div className="byo-ct-picker">
      <p className="byo-note byo-feat-n" style={{ marginBottom: 4 }}><b>Weapon Mastery.</b></p>
      <p className="byo-note" style={{ marginBottom: 10 }}>
        {klass.name}s can master {bump.to} weapons at level {bump.level}, up from {bump.from}.
      </p>
      <MasteryPicker label={`Choose ${bump.to - bump.from} more`} ceiling={bump.to} floor={bump.from}
                      eligibleWeapons={masteryEligibleWeapons} picks={masteryPicks}
                      onAdd={(id) => addMastery(id, bump.to)} onRemove={removeMastery} />
    </div>
  );

  const renderMcEntryCard = (e) => {
    const req = e.klass.multiclassing?.requirements;
    const ok = meetsMcPrereq(e.klass);
    const pg = e.klass.multiclassing?.proficienciesGained;
    const { count: mcSkillCount, pool: mcSkillPool } = mcSkillPoolFor(e.klass);
    const picks = mcSkillPicks[e.classId] || [];
    const feats = featuresAtLevel(e.klass.features, e.level)
      .filter((f) => !(e.subclass && e.subclassOn && f.gainsSubclassFeature));
    const subFeats = e.subclass && e.subclassOn ? featuresAtLevel(e.subclass.features, e.level) : [];
    // Same per-level split as the primary class's Level-by-level section:
    // group every earned feature (class + subclass) by the level it's
    // gained at, one byo-panel per level, instead of one box holding
    // everything earned so far.
    const mcFeaturesByLevel = new Map();
    for (const f of [...feats, ...subFeats]) {
      if (!mcFeaturesByLevel.has(f.level)) mcFeaturesByLevel.set(f.level, []);
      mcFeaturesByLevel.get(f.level).push(f);
    }
    for (const list of mcFeaturesByLevel.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    const mcAsiLvls = mcAsiLevelsReached(e);
    const mcLevelsShown = [...new Set([...mcFeaturesByLevel.keys(), ...mcAsiLvls])]
      .filter((l) => l <= e.level).sort((a, b) => a - b);
    return (
      <>
      {/* Level lives in its own panel, separate from the class-details
          panel below — mirrors the primary class's tab layout, and keeps
          "how many levels do I have" visually apart from "what do I get". */}
      <div className="byo-panel" style={{ marginBottom: 12 }}>
        {mcAsiLevelsReached(e).some((l) => !mcAsiComplete(e.classId, l)) &&
          <span className="byo-panel-flag" title="Needs your pick">⚠</span>}
        <div className="byo-panel-head">
          <span className="byo-card-name">{e.klass.name}</span>
          <button type="button" className="byo-chip-b" onClick={() => removeMulticlass(e.classId)}>Remove</button>
        </div>
        <span className="byo-card-kind">d{e.klass.hitDie} hit die</span>

        <div className="byo-step" style={{ marginTop: 10 }}>
          <button className="byo-btn-sq" onClick={() => setMcLevel(e.classId, e.level - 1)}
                  disabled={e.level <= 1} aria-label={`Lower ${e.klass.name} level`}>−</button>
          <span className="byo-num">{e.level}</span>
          <button className="byo-btn-sq" onClick={() => setMcLevel(e.classId, e.level + 1)}
                  disabled={totalCharLevel >= MAX_LEVEL} aria-label={`Raise ${e.klass.name} level`}>+</button>
        </div>

        {req && edition === "2014" && (
          <div className="byo-choice" style={{ marginTop: 8 }}>
            {(req.or || [req]).map((combo, ci) => (
              <React.Fragment key={ci}>
                {ci > 0 && <span className="byo-mod" style={{ alignSelf: "center" }}>or</span>}
                {Object.entries(combo).map(([ab, min]) => {
                  const have = finalScore(ab);
                  const metOne = have >= min;
                  return (
                    <span key={ab} className="byo-pill"
                          style={{ borderColor: metOne ? "var(--jade)" : "var(--coral)", color: metOne ? "var(--jade)" : "var(--coral)" }}>
                      {ab.toUpperCase()} {min}+ <span style={{ opacity: 0.7 }}>(have {have})</span>
                    </span>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        )}
        {!ok && <p className="byo-warn" style={{ marginTop: 6 }}>Doesn't meet the ability-score prerequisite to multiclass into {e.klass.name}.</p>}
      </div>

      {/* Every section below is its own separate byo-panel — the exact
          same sectioned layout the primary class's Class step always uses
          (Subclass panel, Skills panel, Proficiencies panel, one panel per
          level with a feature/ASI to show), not one merged box. */}
      {e.klass.subclassLevel != null && (
        <div className="byo-panel" style={{ marginBottom: 12 }}>
          <h3>{e.klass.subclassTitle || "Subclass"}</h3>
          {e.subclassOn ? (
            <div className="byo-card-grid" style={{ marginTop: 8 }}>
              {e.klass.subclasses.map((s) => {
                const sel = s.id === e.subclassId;
                const now = featuresAtLevel(s.features, e.level);
                return (
                  <button key={s.id} className={`byo-card ${sel ? "is-sel" : ""}`}
                          onClick={() => setMcSubclass(e.classId, s.id)} aria-pressed={sel}>
                    <div className="byo-card-top">
                      <span className={`byo-dot${sel ? " is-on" : ""}`} aria-hidden="true" />
                      <span className="byo-card-name">{s.name}</span>
                      {s.page && <span className="byo-card-kind">p.{s.page}</span>}
                    </div>
                    <div className="byo-pills" style={{ marginTop: 8 }}>
                      {now.length ? now.map((f) => <span className="byo-pill" key={f.id}>{f.name}</span>)
                        : <span className="byo-pill alt">no features yet</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="byo-note">
              {e.klass.name}s choose at level {e.klass.subclassLevel}. This entry is level {e.level}.
            </p>
          )}
        </div>
      )}

      {/* Skills is its own top-level panel here, same as the primary
          class's "Skills" panel — not nested under Proficiencies gained,
          so the two tabs read the same way. */}
      {mcSkillCount > 0 && (
        <div className="byo-panel" style={{ marginBottom: 12 }}>
          <h3>Skills <span className="byo-count">{picks.length}/{mcSkillCount}</span></h3>
          <div className="byo-skills">
            {mcSkillPool.map((s) => {
              const on = picks.includes(s);
              const full = !on && mcSkillCount !== 1 && picks.length >= mcSkillCount;
              return (
                <button key={s} className={`byo-skill ${on ? "is-sel" : ""}`}
                        onClick={() => toggleMcSkill(e.classId, s, mcSkillCount)}
                        disabled={full} aria-pressed={on}>{s}</button>
              );
            })}
          </div>
        </div>
      )}

      {pg && (
        <div className="byo-panel" style={{ marginBottom: 12 }}>
          <h3>Proficiencies gained (multiclassing in)</h3>
          {pg.armor.fixed.length === 0 && pg.weapons.fixed.length === 0 && pg.tools.fixed.length === 0 ? (
            <p className="byo-note">Nothing beyond what you already have.</p>
          ) : (
            <>
              {/* Same labeled-row shape as the primary class's own
                  Proficiencies panel (Armor/Weapons/Saving throws). */}
              <div className="byo-row"><span className="byo-row-label">Armor</span>
                <span className="byo-mod" style={{ width: "auto" }}>{pg.armor.fixed.join(", ") || "None"}</span></div>
              <div className="byo-row"><span className="byo-row-label">Weapons</span>
                <span className="byo-mod" style={{ width: "auto" }}>{pg.weapons.fixed.join(", ") || "None"}</span></div>
              <div className="byo-row"><span className="byo-row-label">Tools</span>
                <span className="byo-mod" style={{ width: "auto" }}>{pg.tools.fixed.join(", ") || "None"}</span></div>
            </>
          )}
        </div>
      )}

      {/* Level-by-level, same as the primary class's own section below:
          one byo-panel per level, holding whatever features that level
          earns plus the ASI/feat picker where this class's own asiLevels
          say one lands — instead of one box for all features and a
          separate run of boxes for ASI. */}
      {mcLevelsShown.map((atLevel) => {
        const levelFeats = mcFeaturesByLevel.get(atLevel) || [];
        const isAsi = mcAsiLvls.includes(atLevel);
        const entry = mcAsiPicks[e.classId]?.[atLevel];
        const pool = isAsi ? mcAsiFeatPool(e.classId, atLevel) : [];
        const asiFeat = isAsi ? pool.find((f) => f.id === entry?.featId) : null;
        const complete = isAsi ? mcAsiComplete(e.classId, atLevel) : true;
        return (
          <Section key={atLevel} style={{ marginBottom: 12 }} title={`Level ${atLevel}`}
                   count={isAsi ? (complete ? "done" : "to pick") : null}
                   flag={isAsi && !complete}>
            <ShowMore label={`level ${atLevel} features`}>
              {levelFeats.map((f) => (
                <div key={f.id} style={{ marginBottom: 10 }}>
                  <p className="byo-note byo-feat-n" style={{ marginBottom: f.blocks?.length ? 4 : 0 }}><b>{f.name}.</b></p>
                  <FeatureBlocks blocks={f.blocks} />
                </div>
              ))}
            </ShowMore>
            {isAsi && (
            <>
            <div className={`byo-skills${complete ? "" : " byo-live"}`}>
              {pool.map((f) => {
                const sel = entry?.featId === f.id;
                return (
                  <button key={f.id} className={`byo-skill ${sel ? "is-sel" : ""}`}
                          onClick={() => pickMcAsiFeat(e.classId, atLevel, f.id)} aria-pressed={sel}>{f.name}</button>
                );
              })}
            </div>
            {asiFeat && (
              <div style={{ marginTop: 10 }}>
                <FeatureBlocks blocks={asiFeat.blocks} />
                {asiFeat.ability && (
                  <>
                    <div className={`byo-choice${complete ? "" : " byo-live"}`} style={{ margin: "8px 0" }}>
                      {asiFeat.ability.choices.map((alt, ai) => {
                        const slots = abilityChoiceSlots(alt);
                        const label = `${slots.amountAt(0)}${slots.count > 1 ? ` to ${slots.count}` : " to one"}`;
                        return (
                          <button key={ai} className={`byo-opt ${entry.abilityAlt === ai ? "is-sel" : ""}`}
                                  onClick={() => pickMcAsiAlt(e.classId, atLevel, ai)} aria-pressed={entry.abilityAlt === ai}>+{label}</button>
                        );
                      })}
                    </div>
                    <div className={`byo-choice${complete ? "" : " byo-live"}`}>
                      {abilityChoiceSlots(entry.abilitySpec).from.map((k) => {
                        const slots = abilityChoiceSlots(entry.abilitySpec);
                        const picks = entry.abilityPicks || [];
                        const idx = picks.indexOf(k);
                        const on = idx >= 0;
                        const nextIdx = picks.length < slots.count ? picks.length : slots.count - 1;
                        const full = !on && picks.length >= slots.count && slots.count !== 1;
                        const maxed = !on && !full && prereqScoreExcluding(k, 0) + slots.amountAt(nextIdx) > 20;
                        return (
                          <button key={k} className={`byo-opt ${on ? "is-sel" : ""}`} disabled={maxed || full}
                                  onClick={() => toggleMcAsiAbilityPick(e.classId, atLevel, k)} aria-pressed={on}>
                            {ABILITIES.find((a) => a.key === k)?.label}{on ? ` +${slots.amountAt(idx)}` : maxed ? " · at 20" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
            </>
            )}
          </Section>
        );
      })}
      </>
    );
  };

  /* Every save/export action, as one block — rendered inline on the
     wizard's Summary step and again inside the Sheet page's ⋯ drawer,
     so there's one definition of "the things you can do with a
     finished character" rather than two that drift apart. */
  const exportActions = (
    <>
      {!allStepsDone && (
        <p className="byo-warn">Finish every earlier step before saving — check the rail for anything
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

      {AUTH_UI_ENABLED && syncEnabled && session && (
        <div className="byo-export byo-export-stack">
          <div>
            <div className="byo-export-t">Your account</div>
            <div className="byo-export-s">
              {savedCharacterId ? "Saved to your account — save again to update it there."
                : "Back this character up to your account so it's there on another device."}
            </div>
          </div>
          <button className="byo-btn byo-btn-alt" onClick={saveToAccount}
                  disabled={!allStepsDone || saveAccountState === "working"}>
            {saveAccountState === "working" ? "Saving…" : savedCharacterId ? "Update in account" : "Save to my account"}
          </button>
        </div>
      )}
      {saveAccountState === "done" && <p className="byo-note">Saved.</p>}
      {saveAccountState === "limit_reached" && (
        <p className="byo-warn">
          Your account already has its full 2 characters. Delete one from
          {" "}<button className="byo-linkbtn" onClick={() => navigate("/account")}>My Account</button> first.
        </p>
      )}
      {saveAccountState === "error" && <p className="byo-warn">Couldn't save that — try again in a moment.</p>}
      {pdfState === "error" && <p className="byo-warn">That export failed. Try one of the other buttons.</p>}
      {!name.trim() && <p className="byo-warn">The sheet will say "Unnamed" unless you fill in a name first.</p>}
    </>
  );

  /* ------------------------------------------------------------------
     RENDER
  ------------------------------------------------------------------- */
  if (showAddRuleset) return <AddRuleset onBack={goBack} />;
  if (showTerms) return <Terms onBack={goBack} />;
  if (showPrivacy) return <Privacy onBack={goBack} />;
  /* /account is reachable by typed/bookmarked URL even signed-out now that
     it's a real route (unlike the old button-gated boolean) — the effect
     above bounces that case home; render guard here is the synchronous
     backstop so nothing signed-out-shaped ever flashes on screen first. */
  if (showAccount) return session ? <Account session={session} onBack={goBack} /> : null;
  /* /sheet needs a character to render at all — a fresh tab deep-linked
     to it (or one whose saved state was cleared) has no ancestry, so it
     falls through to the wizard rather than rendering an empty sheet.
     Same synchronous-guard shape as /account above. */
  if (showSheet && ancestry) {
    return (
      <Sheet ctx={sheetCtx} onEdit={() => navigate("/create")}
             exportSection={exportActions}
             rulesetSection={(
               <div className="byo-export">
                 <div>
                   <div className="byo-export-t">Rulesets</div>
                   <div className="byo-export-s">Load another SRD-compatible pack to build from.</div>
                 </div>
                 <button className="byo-btn byo-btn-alt" onClick={() => navigate("/rulesets")}>Add a ruleset</button>
               </div>
             )}
             accountSection={AUTH_UI_ENABLED && syncEnabled ? (
               <div className="byo-export">
                 <div>
                   <div className="byo-export-t">Account</div>
                   <div className="byo-export-s">
                     {session ? "Signed in — your saved characters live here."
                       : "Sign in to keep characters across devices."}
                   </div>
                 </div>
                 {session
                   ? <button className="byo-btn byo-btn-alt" onClick={() => navigate("/account")}>My Account</button>
                   : <button className="byo-btn byo-btn-alt" onClick={signInWithGoogle}>Sign in with Google</button>}
               </div>
             ) : null} />
    );
  }
  if (showSplash) return (
    <Splash
      onNewCharacter={() => navigate("/create")}
      onAddRuleset={() => navigate("/rulesets")}
      session={session}
      syncEnabled={syncEnabled}
      authUiEnabled={AUTH_UI_ENABLED}
      onSignIn={signInWithGoogle}
      onAccount={() => navigate("/account")}
      onTerms={() => navigate("/terms")}
      onPrivacy={() => navigate("/privacy")}
    />
  );

  return (
    <div className="byo-root">
      <div className="byo-wrap">
        {AUTH_UI_ENABLED && syncEnabled && (
          <div className="byo-account">
            {session ? (
              <button className="byo-btn byo-btn-alt" onClick={() => navigate("/account")}>My Account</button>
            ) : (
              <button className="byo-btn byo-btn-alt" onClick={signInWithGoogle}>Sign in with Google</button>
            )}
          </div>
        )}

        <button type="button" className="byo-h1 byo-h1-link" onClick={() => navigate("/")}>Bring Your Own 5e</button>
        <p className="byo-h2">Character Creator</p>

        <div className="byo-rail">
          {STEPS.map((s, i) => {
            /* A step with no completeness rule of its own (Inventory, Sheet)
               falls through to "true" in stepComplete — right for gating
               Next, wrong for the rail:
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

        {/* Same step list, collapsed to a native <select> — swapped in for
            .byo-rail below the phone breakpoint (CSS-only toggle, so there's
            no layout flash and no matchMedia state to keep in sync). A
            native select is also the one control that gets a free, fully
            accessible picker UI on a phone for nothing. */}
        <select className="byo-rail-select" aria-label="Jump to step" value={step}
                onChange={(e) => {
                  const i = Number(e.target.value);
                  if (i === step || !stepReachable(i)) return;
                  setStep(i);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>
          {STEPS.map((s, i) => {
            const state = i === step ? "is-now" : i <= maxStep && stepComplete(s) ? "is-done" : "is-todo";
            const jumpable = i === step || stepReachable(i);
            const mark = state === "is-done" ? "✓ " : state === "is-now" ? "› " : "";
            return (
              <option key={s} value={i} disabled={!jumpable}>
                {mark}{i + 1}. {s}
              </option>
            );
          })}
        </select>

        {/* These recap chips repeat what the Summary step's own name panel
            already says ("Dragonborn · Barbarian 20 · ... · Criminal"), so
            they're skipped there — everywhere else they're still the only
            recap of choices made on earlier steps. */}
        {ancestry && step > at("Species/Race") && here !== "Summary" && (
          <div className="byo-chip">
            <span className="byo-chip-k">Species/Race</span>
            <span className="byo-chip-v">{ancestry.name}</span>
            <button className="byo-chip-b" onClick={() => setStep(at("Species/Race"))}>Change</button>
          </div>
        )}
        {klass && step > at("Class") && here !== "Summary" && (
          <div className="byo-chip">
            <span className="byo-chip-k">Class</span>
            <span className="byo-chip-v">{classLabel}</span>
            <button className="byo-chip-b" onClick={() => setStep(at("Class"))}>Change</button>
          </div>
        )}
        {background && step > at("Background") && here !== "Summary" && (
          <div className="byo-chip">
            <span className="byo-chip-k">Background</span>
            <span className="byo-chip-v">{background.name}</span>
            <button className="byo-chip-b" onClick={() => setStep(at("Background"))}>Change</button>
          </div>
        )}

        {here !== "Summary" && ((ancestry && step > at("Species/Race")) || (klass && step > at("Class"))
          || (background && step > at("Background"))) && <Rule />}

        <ErrorBoundary key={here} title="This step hit an error">
          {/* ---------------- RULESET ---------------- */}
          {here === "Ruleset" && (
            <div className="byo-panel">
              <h3>Ruleset</h3>
              <p className="byo-note" style={{ marginBottom: 10 }}>
                Both defaults are the free System Reference Document — CC-BY-4.0, no other
                content is shipped. Pick one to build against; switching later restarts the
                character.
              </p>
              <div className="byo-choice">
                {EDITIONS.map((ed) => (
                  <button key={ed} className={`byo-opt ${edition === ed ? "is-sel" : ""}`}
                          onClick={() => pickEdition(ed)} aria-pressed={edition === ed}>
                    {EDITION_LABEL[ed]}
                  </button>
                ))}
                <button className="byo-opt" onClick={() => navigate("/rulesets")}>
                  Add Ruleset
                </button>
              </div>
              {contentError && (
                <p className="byo-warn">Couldn't load {EDITION_LABEL[edition]}: {String(contentError.message || contentError)}.</p>
              )}
              {!content && !contentError && <p className="byo-note" style={{ marginTop: 10 }}>Loading…</p>}
            </div>
          )}

          {here === "Ruleset" && (
            <div className="byo-panel" style={{ marginTop: 10 }}>
              {content?.pack?.license?.notice && (
                <p className="byo-note" style={{ fontSize: 11 }}>{content.pack.license.notice}</p>
              )}
              <p className="byo-note" style={{ marginTop: content?.pack?.license?.notice ? 10 : 0, fontSize: 11 }}>
                Bring Your Own 5e is an unofficial, fan-made tool. It is not affiliated with,
                endorsed, sponsored, or specifically approved by Wizards of the Coast LLC.
              </p>
              <p className="byo-note" style={{ marginTop: 10, fontSize: 11 }}>
                <button className="byo-linkbtn" onClick={() => navigate("/terms")}>Terms of Service</button>
                {" · "}
                <button className="byo-linkbtn" onClick={() => navigate("/privacy")}>Privacy Policy</button>
              </p>
            </div>
          )}

          {/* ---------------- SPECIES/RACE ---------------- */}
          {here === "Species/Race" && content && (
            <>
              <div className="byo-card-grid">
                {content.ancestries.map((a) => {
                  const sel = a.id === ancestryId;
                  const asiStr = a.abilityIncreases
                    ? Object.entries(a.abilityIncreases.fixed).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(" ")
                    : null;
                  return (
                    <button key={a.id} className={`byo-card ${sel ? "is-sel" : ""}`}
                            onClick={() => pickAncestry(a.id)} aria-pressed={sel}>
                      <div className="byo-card-top">
                        <span className={`byo-dot${sel ? " is-on" : ""}`} aria-hidden="true" />
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
              </div>

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
                        const full = !on && g.count !== 1 && (ancestryPicks[g.ci] || []).length >= g.count;
                        return (
                          <button key={id} className={`byo-skill ${on ? "is-sel" : ""}`}
                                  onClick={() => toggleAncestryPick(g.ci, id, g.count)} disabled={full}
                                  aria-pressed={on}>{label}{g.kind === "ability" ? ` +${g.slots.amountAt((ancestryPicks[g.ci] || []).indexOf(id) >= 0 ? (ancestryPicks[g.ci] || []).indexOf(id) : (ancestryPicks[g.ci] || []).length)}` : ""}</button>
                        );
                      })}
                    </div>
                    {g.kind === "lineage" && (ancestryPicks[g.ci] || []).map((id) => (
                      <div key={id} style={{ marginTop: 10 }}>
                        <FeatureBlocks blocks={g.optionsById[id].blocks} />
                      </div>
                    ))}
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
                        <div className="byo-trait-t"><FeatureBlocks blocks={t.blocks} /></div>
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

              <div className="byo-panel-grid">
                <div className="byo-panel">
                  <h3>Saving throws <span className="byo-count">proficiency {fmt(pb)}</span></h3>
                  {!klass && <p className="byo-note" style={{ marginBottom: 10 }}>No class picked yet — shown below without proficiency.</p>}
                  {saveThrowRows.map((s) => {
                    const baseVal = baseSaveThrowRows.find((b) => b.key === s.key)?.value ?? s.value;
                    return (
                      <div className="byo-row" key={s.key}>
                        <span className={`byo-dot${s.proficient ? " is-on" : ""}`} aria-hidden="true" />
                        <span className="byo-row-label">{ABILITIES.find((a) => a.key === s.key)?.label}</span>
                        {baseVal !== s.value && <span className="byo-mod">{fmt(baseVal)}</span>}
                        {baseVal !== s.value && <span className="byo-arrow">→</span>}
                        <span className="byo-final">{fmt(s.value)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="byo-panel">
                  <h3>Passive skills</h3>
                  {passiveSkills.map((p) => (
                    <div className="byo-row" key={p.name}>
                      <span className="byo-row-label">Passive {p.name}</span>
                      {p.baseValue !== p.value && <span className="byo-mod">{p.baseValue}</span>}
                      {p.baseValue !== p.value && <span className="byo-arrow">→</span>}
                      <span className="byo-final">{p.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ---------------- CLASS ---------------- */}
          {here === "Class" && content && (
            <>
              {/* Once multiclassed, this whole panel is gone — the primary
                  class's own level moved into its tab (below, next to every
                  other class's stepper), and "+ Add new Multiclass" moved
                  next to the class tabs themselves. Nothing left here to
                  show. */}
              {mcEntries.length === 0 && (
                <div className="byo-panel">
                  <div className="byo-panel-head">
                    <h3>Level</h3>
                    {addableClasses.length > 0 && (
                      <button type="button" className="byo-btn byo-btn-go" onClick={() => setShowAddMcModal(true)}>
                        + Add new Multiclass
                      </button>
                    )}
                  </div>
                  <div className="byo-step">
                    <button className="byo-btn-sq" onClick={() => setLevel((l) => Math.max(1, l - 1))} disabled={level <= 1} aria-label="Lower level">−</button>
                    <span className="byo-num">{level}</span>
                    <button className="byo-btn-sq" onClick={() => setLevel((l) => Math.min(MAX_LEVEL, l + 1))} disabled={level >= MAX_LEVEL} aria-label="Raise level">+</button>
                  </div>
                </div>
              )}

              {/* Once multiclassed, "primary class" is fixed and shown as
                  the first tab below instead — swapping it here would orphan
                  every multiclass entry's own prereqs/levels, so the picker
                  only makes sense pre-multiclass. */}
              {mcEntries.length === 0 && (
                <div className="byo-classpick">
                  {klass && (
                    <div className="byo-classpick-head">
                      <span className="byo-classpick-l">Class</span>
                      <button type="button" className="byo-chip-b"
                              onClick={() => setClassGridOpen((o) => !o)}
                              aria-expanded={classGridShowsAll}>
                        {classGridShowsAll ? `Keep ${klass.name}` : "Change class"}
                      </button>
                    </div>
                  )}
                  <div className={`byo-card-grid${classGridShowsAll ? "" : " is-one"}`}>
                    {(classGridShowsAll ? content.classes : content.classes.filter((c) => c.id === classId)).map((c) => {
                      const sel = c.id === classId;
                      return (
                        <button key={c.id} className={`byo-card ${sel ? "is-sel" : ""}`}
                                onClick={() => {
                                  // Re-picking the class already chosen would wipe its
                                  // skill/option picks, so the selected card only toggles
                                  // the grid open or shut.
                                  if (sel) setClassGridOpen((o) => !o);
                                  else { pickClass(c.id); setClassGridOpen(false); }
                                }} aria-pressed={sel}>
                          <div className="byo-card-top">
                            <span className={`byo-dot${sel ? " is-on" : ""}`} aria-hidden="true" />
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
                  </div>
                </div>
              )}

              {klass && (
                <>
                  {/* Only when single-class — separates the class-picker grid
                     above from the panels below. Once multiclassed that grid
                     is hidden entirely, so there's nothing left to rule off. */}
                  {mcEntries.length === 0 && <Rule />}

                  {/* ---- Class tabs — once multiclassing is in play, each
                      class (primary + every mcEntry) gets its own tab over
                      the same Subclass/Skills/Proficiencies-shaped panels
                      below, instead of stacking every class inline. With a
                      single class there's nothing to switch between, so no
                      tab strip renders and classTab (default 0) always
                      resolves to the primary class's panels — unchanged
                      from before tabs existed. ---- */}
                  {mcEntries.length > 0 && (
                    <>
                      {/* The single most prominent thing on this page once
                          multiclassed — bigger than any panel heading here,
                          same weight class as the app's own h1. */}
                      <div className="byo-totallevel-row">
                        <p className="byo-totallevel">Total Level {totalCharLevel}</p>
                        {addableClasses.length > 0 && (
                          <button type="button" className="byo-btn byo-btn-go" onClick={() => setShowAddMcModal(true)}>
                            + Add new Multiclass
                          </button>
                        )}
                      </div>
                      <div className="byo-choice" style={{ marginBottom: 14 }}>
                        <button type="button" className={`byo-opt byo-tab-class ${classTab === 0 ? "is-sel" : ""}`}
                                onClick={() => setClassTab(0)} aria-pressed={classTab === 0}>
                          {klass.name} {level}
                          {asiLevelsReached.some((l) => !asiComplete(l)) &&
                            <span title="Needs your pick"> ⚠</span>}
                        </button>
                        {mcEntries.map((e, i) => (
                          <button key={e.classId} type="button" className={`byo-opt byo-tab-class ${classTab === i + 1 ? "is-sel" : ""}`}
                                  onClick={() => setClassTab(i + 1)} aria-pressed={classTab === i + 1}>
                            {e.klass.name} {e.level}
                            {mcAsiLevelsReached(e).some((l) => !mcAsiComplete(e.classId, l)) &&
                              <span title="Needs your pick"> ⚠</span>}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {classTab > 0 && mcEntries[classTab - 1] && renderMcEntryCard(mcEntries[classTab - 1])}

                  {classTab === 0 && (
                    <>
                  {/* Once multiclassed, the primary class's own level moved
                      into its own small panel here (name + hit die +
                      stepper) — everything else below is the SAME sectioned
                      layout (separate byo-panel per section) as the
                      single-class case always used, unconditionally, so a
                      multiclassed primary tab and mc entry tabs both look
                      exactly like the original single-class Class step —
                      never one big merged box. */}
                  {mcEntries.length > 0 && (
                    <div className="byo-panel" style={{ marginBottom: 12 }}>
                      <span className="byo-card-name" style={{ display: "block" }}>{klass.name}</span>
                      <span className="byo-card-kind">d{klass.hitDie} hit die</span>
                      <div className="byo-step" style={{ marginTop: 10 }}>
                        <button className="byo-btn-sq" onClick={() => setLevel((l) => Math.max(1, l - 1))} disabled={level <= 1} aria-label={`Lower ${klass.name} level`}>−</button>
                        <span className="byo-num">{level}</span>
                        <button className="byo-btn-sq" onClick={() => setLevel((l) => Math.min(MAX_LEVEL, l + 1))} disabled={level >= MAX_LEVEL || totalCharLevel >= MAX_LEVEL} aria-label={`Raise ${klass.name} level`}>+</button>
                      </div>
                    </div>
                  )}
                  <CoreTraits klass={klass} skillsLeft={skillsLeft}
                              skillChoiceText={classSkillCount > 0 ? `Choose ${classSkillCount}` : null}
                              masteryLeft={masteryBaseCount != null ? Math.max(0, masteryBaseCount - masteryPicks.length) : 0}
                              masteryChoiceText={masteryBaseCount != null ? `Choose ${masteryBaseCount}` : null}>
                    {/* The functional control. The table row above only says
                        how many skills to choose — the options themselves are
                        these buttons, so the list isn't printed twice. */}
                    <div className="byo-ct-picker">
                      <div className="byo-ct-picker-h">
                        <span className="byo-ct-picker-l">Choose {classSkillCount} skill{classSkillCount === 1 ? "" : "s"}</span>
                        <span className="byo-count">{skillsLeft > 0 ? `${skillsLeft} to go` : "done"}</span>
                      </div>
                      {ancestrySkillsGranted.size > 0 && (
                        <p className="byo-note byo-ct-picker-note">
                          {[...ancestrySkillsGranted].join(" and ")} {ancestrySkillsGranted.size > 1 ? "are" : "is"} already yours from your species, so {ancestrySkillsGranted.size > 1 ? "they're" : "it's"} not offered here.
                        </p>
                      )}
                      <div className={`byo-skills${skillsLeft > 0 ? " byo-live" : ""}`}>
                        {skillPool.map((s) => {
                          const on = skillPicks.includes(s);
                          const full = !on && classSkillCount !== 1 && skillPicks.length >= classSkillCount;
                          return (
                            <button key={s} className={`byo-skill ${on ? "is-sel" : ""}`} onClick={() => toggleSkill(s)}
                                    disabled={full} aria-pressed={on}>{s}</button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Weapon Mastery — 2024-only (masteryBaseCount null on
                        every other class/edition, so this whole block is
                        absent there). Level-1 baseline only: the L4/L10/L16
                        bumps Barbarian/Fighter get later render as content
                        INSIDE that level's own panel (renderMasteryBumpContent,
                        alongside Ability Score Improvement), not inflated
                        into this level-1 section — see masteryBumpLevels.
                        This section's own mastered weapons show here as
                        removable chips — each bracket (this one, and every
                        bump panel below) shows only ITS OWN slice of
                        masteryPicks (see MasteryPicker's ownPicks), not the
                        full array. Not a toggle grid like Skills above: with
                        the full weapon list as the
                        pool, a search-to-add field reads better than a wall
                        of buttons — Josh's call, same shape the Armor/
                        Inventory search-and-add pickers already use
                        elsewhere on this step (see MasteryPicker). */}
                    {masteryBaseCount != null && (
                      <div style={{ marginTop: 14 }}>
                        <MasteryPicker label="Weapon Mastery"
                                       note={`Choose ${masteryBaseCount} mastered weapon${masteryBaseCount === 1 ? "" : "s"}`}
                                       ceiling={masteryBaseCount} eligibleWeapons={masteryEligibleWeapons}
                                       picks={masteryPicks} onAdd={(id) => addMastery(id, masteryBaseCount)}
                                       onRemove={removeMastery} />
                      </div>
                    )}
                  </CoreTraits>

                  {optionChoiceGroups.map((g) => (
                    <Section key={g.key} title={g.label}
                             count={`${(optionPicks[g.key] || []).length}/${g.budget}`}
                             flag={(optionPicks[g.key] || []).length < g.budget}>
                      <div className={`byo-skills${(optionPicks[g.key] || []).length < g.budget ? " byo-live" : ""}`}>
                        {g.pool.map((o) => {
                          const on = (optionPicks[g.key] || []).includes(o.id);
                          const full = !on && g.budget !== 1 && (optionPicks[g.key] || []).length >= g.budget;
                          return (
                            <button key={o.id} className={`byo-skill ${on ? "is-sel" : ""}`}
                                    onClick={() => toggleOptionPick(g.key, o.id, g.budget)} disabled={full}
                                    aria-pressed={on}>{o.name}</button>
                          );
                        })}
                      </div>
                      {/* What each pick actually grants — shown for whichever
                          option(s) are currently selected, not the whole pool,
                          so this stays short even for a big list like Fighting
                          Style. */}
                      {(optionPicks[g.key] || []).map((id) => {
                        const o = g.pool.find((x) => x.id === id);
                        if (!o?.text) return null;
                        return (
                          <div key={id} style={{ marginTop: 10 }}>
                            <p className="byo-note byo-feat-n" style={{ marginBottom: 4 }}><b>{o.name}.</b></p>
                            <FeatureBlocks blocks={o.blocks} />
                          </div>
                        );
                      })}
                    </Section>
                  ))}

                    </>
                  )}

                  {/* ---- Level-by-level: every class/subclass feature earned
                      so far, sourcebook-style, plus the ASI/feat picker at
                      every level the class's own feature list earns one.
                      This is all primary-class data (klass/levelsShown/ASI
                      picks), so it only belongs under the primary tab — a
                      multiclass entry's own features already show in its
                      own tab via renderMcEntryCard. ---- */}
                  {classTab === 0 && (levelsShown.length === 0 ? (
                    <>
                      {klass.subclassLevel != null && renderSubclassPanel()}
                      <div className="byo-stub">
                        <p className="byo-stub-t">Nothing yet</p>
                        <p className="byo-stub-s">
                          {klass.name}s get their first feature at level {(klass.features?.[0]?.level) ?? 1}.
                        </p>
                      </div>
                    </>
                  ) : levelsShown.map((atLevel) => {
                    const feats = featuresByLevel.get(atLevel) || [];
                    const isAsi = asiLevelsReached.includes(atLevel);
                    const entry = asiPicks[atLevel];
                    const pool = isAsi ? asiFeatPool(atLevel) : [];
                    const asiFeat = isAsi ? pool.find((f) => f.id === entry?.featId) : null;
                    return (
                      <React.Fragment key={atLevel}>
                      {/* The subclass choice belongs to one specific level,
                          so it renders directly above that level's panel
                          rather than at the top of the step. When the
                          character hasn't reached it yet there is no such
                          panel, so it goes last instead (see below). */}
                      {atLevel === subclassAnchor && renderSubclassPanel()}
                      <Section title={`Level ${atLevel}`}
                               count={isAsi ? (asiComplete(atLevel) ? "done" : "to pick") : null}
                               flag={isAsi && !asiComplete(atLevel)}>
                        {/* The features are the long part of a level — a
                            single one can print a whole table. Clamped so a
                            level you've read doesn't push the next one off
                            the screen; the toggle only appears when there is
                            something actually hidden. */}
                        <ShowMore label={`level ${atLevel} features`}>
                          {feats.map((f) => (
                            <div key={f.id} style={{ marginBottom: 10 }}>
                              <p className="byo-note byo-feat-n" style={{ marginBottom: f.blocks?.length ? 4 : 0 }}><b>{f.name}.</b></p>
                              <FeatureBlocks blocks={f.blocks} />
                            </div>
                          ))}
                        </ShowMore>
                        {isAsi && (
                          <>
                            <div className={`byo-skills${asiComplete(atLevel) ? "" : " byo-live"}`}>
                              {pool.map((f) => {
                                const sel = entry?.featId === f.id;
                                return (
                                  <button key={f.id} className={`byo-skill ${sel ? "is-sel" : ""}`}
                                          onClick={() => pickAsiFeat(atLevel, f.id)} aria-pressed={sel}>{f.name}</button>
                                );
                              })}
                            </div>
                            {asiFeat && (
                              <div style={{ marginTop: 10 }}>
                                <FeatureBlocks blocks={asiFeat.blocks} />
                                {asiFeat.ability && (
                                  <>
                                    <div className={`byo-choice${asiComplete(atLevel) ? "" : " byo-live"}`} style={{ margin: "8px 0" }}>
                                      {asiFeat.ability.choices.map((alt, ai) => {
                                        const slots = abilityChoiceSlots(alt);
                                        const label = `${slots.amountAt(0)}${slots.count > 1 ? ` to ${slots.count}` : " to one"}`;
                                        return (
                                          <button key={ai} className={`byo-opt ${entry.abilityAlt === ai ? "is-sel" : ""}`}
                                                  onClick={() => pickAsiAlt(atLevel, ai)} aria-pressed={entry.abilityAlt === ai}>+{label}</button>
                                        );
                                      })}
                                    </div>
                                    <div className={`byo-choice${asiComplete(atLevel) ? "" : " byo-live"}`}>
                                      {abilityChoiceSlots(entry.abilitySpec).from.map((k) => {
                                        const slots = abilityChoiceSlots(entry.abilitySpec);
                                        const picks = entry.abilityPicks || [];
                                        const idx = picks.indexOf(k);
                                        const on = idx >= 0;
                                        const nextIdx = picks.length < slots.count ? picks.length : slots.count - 1;
                                        const full = !on && picks.length >= slots.count && slots.count !== 1;
                                        const maxed = !on && !full && prereqScoreExcluding(k, 0) + slots.amountAt(nextIdx) > 20;
                                        return (
                                          <button key={k} className={`byo-opt ${on ? "is-sel" : ""}`} disabled={maxed || full}
                                                  onClick={() => toggleAsiAbilityPick(atLevel, k)} aria-pressed={on}>
                                            {ABILITIES.find((a) => a.key === k)?.label}{on ? ` +${slots.amountAt(idx)}` : maxed ? " · at 20" : ""}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        )}
                        {masteryExtraBumps.filter((b) => b.level === atLevel).map((b) => (
                          <React.Fragment key={`mastery-${b.level}`}>{renderMasteryBumpContent(b)}</React.Fragment>
                        ))}
                      </Section>
                      </React.Fragment>
                    );
                  }))}
                  {/* Below the class's own subclass level (2014 Wizards at 1,
                      say): there's no level panel to sit above, so the "you
                      choose at level N" note lands at the end of the list,
                      which is where the next level would appear. */}
                  {classTab === 0 && klass.subclassLevel != null
                    && subclassAnchor == null && levelsShown.length > 0
                    && renderSubclassPanel()}
                </>
              )}
            </>
          )}

          {/* ---------------- BACKGROUND ---------------- */}
          {here === "Background" && content && (
            <>
              <div className="byo-card-grid">
                {content.backgrounds.map((b) => {
                  const sel = b.id === bgId;
                  const sk = b.skills.fixed.length ? b.skills.fixed.join(", ")
                    : b.skills.choices[0] ? `${b.skills.choices[0].count} of your choice` : "";
                  return (
                    <button key={b.id} className={`byo-card ${sel ? "is-sel" : ""}`}
                            onClick={() => pickBackground(b.id)} aria-pressed={sel}>
                      <div className="byo-card-top">
                        <span className={`byo-dot${sel ? " is-on" : ""}`} aria-hidden="true" />
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
              </div>

              {background && (
                <>
                  <Rule />
                  {/* 2024 backgrounds carry no named feature — the Origin
                      feat below replaced it. */}
                  {background.feature && (
                    <div className="byo-panel">
                      <h3>Feature: {background.feature.name}</h3>
                      <FeatureBlocks blocks={background.feature.blocks} />
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
                            const full = !on && bgSkillChoice.count !== 1 && bgSkillPicks.length >= bgSkillChoice.count;
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
                            const full = !on && bgAbilitySlots.count !== 1 && bgAbilityPicks.length >= bgAbilitySlots.count;
                            return (
                              <button key={k} className={`byo-opt ${on ? "is-sel" : ""}`} disabled={full}
                                      onClick={() => setBgAbilityPicks((p) => swapPick(p, k, bgAbilitySlots.count))}
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
                      <FeatureBlocks blocks={bgFeat.blocks} />
                    </div>
                  )}

                  {/* Starting equipment for this background is chosen on the
                      Inventory step now, alongside the class's own pick — one
                      combined panel instead of two steps each holding half. */}

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

          {/* ---------------- INVENTORY ---------------- */}
          {here === "Inventory" && ancestry && (
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
                      <>
                        {armor && armor.rarity !== "none" && (
                          <p className="byo-note" style={{ marginBottom: 10 }}>Wearing <b>{armor.name}</b> — search below to change it.</p>
                        )}
                        <div className="byo-skills">
                          {mundaneArmorOptions.map((a) => (
                            <button key={a?.id ?? "none"} className={`byo-skill ${(armor?.id ?? null) === (a?.id ?? null) ? "is-sel" : ""}`}
                                    onClick={() => setArmorId(a?.id ?? null)} aria-pressed={(armor?.id ?? null) === (a?.id ?? null)}>
                              {a ? `${a.name} ${a.ac}` : "None"}
                            </button>
                          ))}
                        </div>
                        <input className="byo-input" style={{ fontSize: 15, margin: "12px 0 10px" }} value={armorSearch}
                               onChange={(e) => setArmorSearch(e.target.value)} placeholder="Search magic armor…"
                               aria-label="Search magic armor" />
                        {armorSearch.trim() && (
                          <div className="byo-skills byo-scroll-y">
                            {armorResults.rows.map((a) => (
                              <button key={a.id} className={`byo-skill ${armor?.id === a.id ? "is-sel" : ""}`}
                                      onClick={() => setArmorId(a.id)} aria-pressed={armor?.id === a.id}>
                                {a.name} {a.ac}
                              </button>
                            ))}
                            {armorResults.rows.length === 0 && <p className="byo-note">No magic armor matches "{armorSearch}".</p>}
                            {armorResults.total > ARMOR_RESULTS_CAP && (
                              <p className="byo-note" style={{ width: "100%" }}>
                                {armorResults.total - ARMOR_RESULTS_CAP} more — narrow your search to see them.
                              </p>
                            )}
                          </div>
                        )}
                      </>
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

                  {/* Class and background each grant their own starting-equipment
                      choice — two independent picks, not one merged pool — but
                      they used to live on two different steps (this one, and
                      Background), so a player working through Inventory never
                      saw the background half at all. One panel, two labelled
                      groups, each still keyed to its own pick state. */}
                  {(klass.startingEquipment.groups.length > 0 || background) && (
                    <div className="byo-panel">
                      <h3>Starting Equipment</h3>
                      {klass.startingEquipment.groups.length > 0 && (
                        <div style={{ marginBottom: background?.equipment.length ? 14 : 0 }}>
                          <div className="byo-actgroup-l">Class — {klass.name}</div>
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
                      {background && background.equipment.length > 0 && (
                        <div>
                          <div className="byo-actgroup-l">Background — {background.name}</div>
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
                      {!background && (
                        <p className="byo-note" style={{ marginTop: 10 }}>Pick a background to see its starting equipment options too.</p>
                      )}
                    </div>
                  )}

                  <div className="byo-panel">
                    <h3>Weapons</h3>
                    {groupWeapons(carriedWeapons).length > 0 ? groupWeapons(carriedWeapons).map(({ weapon, qty }) => {
                      const custom = customItems.find((ci) => ci.itemId === weapon.id && ci.kind === "weapon");
                      return (
                        <div className="byo-row" key={weapon.id}>
                          <span className="byo-row-label">{weapon.name}{magicSuffix(weapon, custom?.attuned)}</span>
                          {qty > 1 && <span className="byo-mod" style={{ width: "auto" }}>×{qty}</span>}
                        </div>
                      );
                    }) : <p className="byo-note">Nothing yet — pick starting equipment above, or add one below.</p>}
                  </div>

                  <div className="byo-panel">
                    <h3>Gear <span className="byo-count">{attunedCount}/3 attuned</span></h3>
                    {[...classEquipItems, ...bgEquipItems].filter((it) => !it.currency && it.resolved?.kind !== "weapon" && it.resolved?.kind !== "armor").map((it, i) => (
                      <div className="byo-row" key={`fixed-${i}`} style={{ flexWrap: "wrap" }}>
                        <span className="byo-row-label">{it.name}{it.quantity > 1 ? ` ×${it.quantity}` : ""}{!it.resolved && !it.currency ? " (choose specific item at the table)" : ""}
                          {chargesLine(it.resolved) && <span className="byo-item-mech">{chargesLine(it.resolved)}</span>}
                        </span>
                      </div>
                    ))}
                    {customResolved.map((ci, idx) => {
                      if (!ci.resolved || ci.kind === "weapon") return null;
                      const attunable = !!ci.resolved.reqAttune;
                      return (
                        <div className="byo-row" key={`custom-${idx}`} style={{ flexWrap: "wrap" }}>
                          <span className="byo-row-label">{ci.resolved.name}{ci.quantity > 1 ? ` ×${ci.quantity}` : ""}{magicSuffix(ci.resolved, ci.attuned)}
                            {chargesLine(ci.resolved) && <span className="byo-item-mech">{chargesLine(ci.resolved)}</span>}
                          </span>
                          <div className="byo-step">
                            <button className="byo-btn-sq" onClick={() => setCustomQty(idx, ci.quantity - 1)} aria-label={`Fewer ${ci.resolved.name}`}>−</button>
                            <span className="byo-num">{ci.quantity}</span>
                            <button className="byo-btn-sq" onClick={() => setCustomQty(idx, ci.quantity + 1)} aria-label={`More ${ci.resolved.name}`}>+</button>
                          </div>
                          {attunable && (
                            <button className={`byo-opt ${ci.attuned ? "is-sel" : ""}`}
                                    disabled={!ci.attuned && attunedCount >= 3}
                                    onClick={() => toggleAttune(idx)} aria-pressed={ci.attuned}>
                              {ci.attuned ? "Attuned" : "Attune"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {!klass && !background && !customItems.length && <p className="byo-note">Pick a class and background to see starting gear.</p>}
                  </div>

                  <div className="byo-panel">
                    <h3>Add an item</h3>
                    <input className="byo-input" style={{ fontSize: 15, marginBottom: 10 }} value={itemSearch}
                           onChange={(e) => setItemSearch(e.target.value)} placeholder="Search weapons, armor, gear…"
                           aria-label="Search items" />
                    <div className="byo-choice" style={{ marginTop: 0, marginBottom: 10 }}>
                      {[["all", "All"], ["weapon", "Weapons"], ["armor", "Armor"], ["gear", "Gear"]].map(([k, kLabel]) => (
                        <button key={k} className={`byo-opt ${itemKindFilter === k ? "is-sel" : ""}`}
                                onClick={() => setItemKindFilter(k)} aria-pressed={itemKindFilter === k}>{kLabel}</button>
                      ))}
                    </div>
                    <div className="byo-scroll-y">
                      {itemResults.rows.map((it) => (
                        <div className="byo-row" key={it.id}>
                          <span className="byo-row-label">{it.name}
                            {it.rarity !== "none" && <span className="byo-tag" style={{ marginLeft: 8 }}>{it.rarity}{it.reqAttune ? " · attunement" : ""}</span>}
                          </span>
                          <button className="byo-chip-b" onClick={() => addCustomItem(it)}>Add</button>
                        </div>
                      ))}
                      {itemResults.total > itemResults.rows.length && (
                        <p className="byo-note" style={{ marginTop: 8 }}>
                          {itemResults.total - itemResults.rows.length} more — narrow your search to see them.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="byo-panel">
                    <h3>Currency</h3>
                    <div className="byo-currency">
                      {[["pp", "Platinum"], ["gp", "Gold"], ["sp", "Silver"], ["cp", "Copper"]].map(([k, label]) => (
                        <span key={k} className="byo-currency-f">
                          <input className="byo-sel" type="number" min={0} value={currency[k]}
                                 onChange={(e) => setCurrencyField(k, e.target.value)} aria-label={label} />
                          <span className="byo-note">{k}</span>
                        </span>
                      ))}
                    </div>
                    {background && (
                      <p className="byo-note" style={{ marginTop: 10 }}>
                        Starting gold from class + background: <b>{startingGold} gp</b>.{" "}
                        <button className="byo-linkbtn" onClick={useStartingGold}>Use this</button>
                      </p>
                    )}
                  </div>

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
                              <div className="byo-trait-t"><FeatureBlocks blocks={a.blocks} /></div>
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
                          <div className="byo-trait-t">
                            <p className="byo-fb-p" style={{ marginBottom: 4 }}>
                              {g.sp.level === 0 ? "Cantrip" : `Level ${g.sp.level}`}. {splitCastingTime(g.sp.time).head}, {g.sp.range}.
                            </p>
                            <FeatureBlocks blocks={g.sp.blocks} />
                          </div>
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
                          const full = !on && g.count !== 1 && (ancestrySpellPicks[g.key] || []).length >= g.count;
                          return (
                            <button key={sp.id} className={`byo-skill ${on ? "is-sel" : ""}`}
                                    onClick={() => toggleAncestrySpellPick(g.key, sp.id, g.count)} disabled={full}
                                    aria-pressed={on}>{sp.name}</button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="byo-panel">
                    <h3>Actions in Combat</h3>
                    <p className="byo-note">{basicActionNames(edition).join(", ")}.</p>
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
                    <input className="byo-input" style={{ fontSize: 15, marginBottom: 10 }} value={cantripSearch}
                           onChange={(e) => setCantripSearch(e.target.value)} placeholder="Search cantrips…"
                           aria-label="Search cantrips" />
                    <div className="byo-filter-row">
                      {casterList.length > 1 && (
                        <div className="byo-filter-grp">
                          <span className="byo-filter-lbl">Class</span>
                          <div className="byo-choice" style={{ marginTop: 0 }}>
                            <button className={`byo-opt ${cantripClassFilter === "all" ? "is-sel" : ""}`}
                                    onClick={() => setCantripClassFilter("all")} aria-pressed={cantripClassFilter === "all"}>All</button>
                            {casterList.map((c) => (
                              <button key={c.classId} className={`byo-opt ${cantripClassFilter === c.classId ? "is-sel" : ""}`}
                                      onClick={() => setCantripClassFilter(c.classId)} aria-pressed={cantripClassFilter === c.classId}>{c.className}</button>
                            ))}
                          </div>
                        </div>
                      )}
                      {cantripSchools.length > 1 && (
                        <div className="byo-filter-grp">
                          <span className="byo-filter-lbl">Type</span>
                          <div className="byo-choice" style={{ marginTop: 0 }}>
                            <button className={`byo-opt ${cantripSchoolFilter === "all" ? "is-sel" : ""}`}
                                    onClick={() => setCantripSchoolFilter("all")} aria-pressed={cantripSchoolFilter === "all"}>All</button>
                            {cantripSchools.map((sc) => (
                              <button key={sc} className={`byo-opt ${cantripSchoolFilter === sc ? "is-sel" : ""}`}
                                      onClick={() => setCantripSchoolFilter(sc)} aria-pressed={cantripSchoolFilter === sc}>{sc}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {filteredCantrips.map((sp) => (
                      <SpellTableRow key={sp.id} sp={sp} casting={casting} on={pickedSpellIds.includes(sp.id)}
                                     full={!pickedSpellIds.includes(sp.id) && pickedCantrips.length >= cantripBudget}
                                     onToggle={() => toggleSpell(sp.id)} />
                    ))}
                    {!filteredCantrips.length && <p className="byo-note">No cantrips match.</p>}
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
                    <input className="byo-input" style={{ fontSize: 15, marginBottom: 10 }} value={spellSearch}
                           onChange={(e) => setSpellSearch(e.target.value)} placeholder="Search spells…"
                           aria-label="Search spells" />
                    <div className="byo-filter-row">
                      {casterList.length > 1 && (
                        <div className="byo-filter-grp">
                          <span className="byo-filter-lbl">Class</span>
                          <div className="byo-choice" style={{ marginTop: 0 }}>
                            <button className={`byo-opt ${spellClassFilter === "all" ? "is-sel" : ""}`}
                                    onClick={() => setSpellClassFilter("all")} aria-pressed={spellClassFilter === "all"}>All</button>
                            {casterList.map((c) => (
                              <button key={c.classId} className={`byo-opt ${spellClassFilter === c.classId ? "is-sel" : ""}`}
                                      onClick={() => setSpellClassFilter(c.classId)} aria-pressed={spellClassFilter === c.classId}>{c.className}</button>
                            ))}
                          </div>
                        </div>
                      )}
                      {spellSchools.length > 1 && (
                        <div className="byo-filter-grp">
                          <span className="byo-filter-lbl">Type</span>
                          <div className="byo-choice" style={{ marginTop: 0 }}>
                            <button className={`byo-opt ${spellSchoolFilter === "all" ? "is-sel" : ""}`}
                                    onClick={() => setSpellSchoolFilter("all")} aria-pressed={spellSchoolFilter === "all"}>All</button>
                            {spellSchools.map((sc) => (
                              <button key={sc} className={`byo-opt ${spellSchoolFilter === sc ? "is-sel" : ""}`}
                                      onClick={() => setSpellSchoolFilter(sc)} aria-pressed={spellSchoolFilter === sc}>{sc}</button>
                            ))}
                          </div>
                        </div>
                      )}
                      {spellLevels.length > 1 && (
                        <div className="byo-filter-grp">
                          <span className="byo-filter-lbl">Level</span>
                          <div className="byo-choice" style={{ marginTop: 0 }}>
                            <button className={`byo-opt ${spellLevelFilter === "all" ? "is-sel" : ""}`}
                                    onClick={() => setSpellLevelFilter("all")} aria-pressed={spellLevelFilter === "all"}>All</button>
                            {spellLevels.map((lvl) => (
                              <button key={lvl} className={`byo-opt ${spellLevelFilter === String(lvl) ? "is-sel" : ""}`}
                                      onClick={() => setSpellLevelFilter(String(lvl))} aria-pressed={spellLevelFilter === String(lvl)}>{lvl}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {Array.from({ length: highestSlot }, (_, i) => i + 1).map((lvl) => {
                      const rows = filteredLeveledSpells.filter((s) => s.level === lvl);
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
                    {!filteredLeveledSpells.length && <p className="byo-note">No spells match.</p>}
                  </div>
                  <Rule />
                </>
              )}

              {casting.spellbook != null && (
                <p className="byo-note">A wizard's spellbook holds {casting.spellbook} spells — more than you'll prepare at once. Everything on your class list up to your highest slot is browsable above; add whichever ones you own to the spellbook in play.</p>
              )}
            </>
          )}

          {/* ---------------- PLAYER INFO ---------------- */}
          {here === "Player Info" && ancestry && (
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
            </>
          )}

          {/* ---------------- SUMMARY / EXPORT ---------------- */}
          {here === "Summary" && ancestry && (
            <>
              <SheetSummary ctx={sheetCtx} />
              <Rule />

              {exportActions}

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

      {showAddMcModal && (
        <div className="byo-modal-bg" role="dialog" aria-modal="true" aria-label="Add new Multiclass"
             onClick={(ev) => { if (ev.target === ev.currentTarget) setShowAddMcModal(false); }}>
          <div className="byo-modal byo-modal-lg">
            <h3 className="byo-modal-t">Add new Multiclass</h3>
            {/* Same card-grid shape as the primary class picker at the top
                of the Class step — pick which class to multiclass into. */}
            <div className="byo-card-grid">
              {addableClasses.map((c) => (
                <button key={c.id} type="button" className="byo-card" onClick={() => addMulticlassFromHeader(c.id)}>
                  <div className="byo-card-top">
                    <span className="byo-card-name">{c.name}</span>
                    <span className="byo-card-kind">d{c.hitDie} hit die</span>
                  </div>
                  <p className="byo-card-blurb">
                    Saves: {c.saves.map((s) => s.toUpperCase()).join(", ")} · {c.skillChoices.count} skills ·{" "}
                    {c.subclasses.length ? `${c.subclassTitle || "subclass"} at ${c.subclassLevel}` : "no subclass"}
                  </p>
                </button>
              ))}
            </div>
            <div className="byo-modal-row" style={{ marginTop: 16 }}>
              <button className="byo-btn" onClick={() => setShowAddMcModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

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
          {/* Class step can be unfinished for several independent reasons now
              (subclass, skills, option picks, an ASI at any level) — rather
              than enumerate them all here, point at the ⚠ marks below. */}
          {here === "Class" && !klass && <span className="byo-hint">Pick a class</span>}
          {here === "Class" && klass && !stepComplete("Class") && <span className="byo-hint">⚠ Some choices left below</span>}
          {here === "Background" && !background && <span className="byo-hint">Pick a background</span>}
          {here === "Spells" && cantripBudget > 0 && pickedCantrips.length === 0 && <span className="byo-hint">Pick your cantrips</span>}
          <button className="byo-btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
          {/* "Done" on the last step isn't a dead end any more — it leaves
              the wizard for the Sheet (/sheet), the interactive character
              sheet you actually play from. Gated on every earlier step
              being finished, the same bar the exports are held to. */}
          <button className="byo-btn byo-btn-go"
                  onClick={() => {
                    if (step === STEPS.length - 1) { navigate("/sheet"); return; }
                    setStep((s) => Math.min(STEPS.length - 1, s + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={step === STEPS.length - 1 ? !allStepsDone : !canAdvance()}>
            {step === STEPS.length - 1 ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
