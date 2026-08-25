/* ------------------------------------------------------------------
   AncestryView — where the two editions differ most, absorbed here so
   nothing above this layer has to know which edition it is looking at.

   2014: a character's ancestry is a (race, subrace) PAIR. The mapper
     emits one selectable ancestry per pair, merging both records'
     ability increases, speeds, darkvision, proficiencies and traits.
     `baseName` / `lineageName` are kept so the UI can group the list by
     base race the way the existing two-stage picker does.

     A subrace record with NO name is not a lineage — it is the race's
     own remainder (Human's +1 to everything lives there). It merges
     into the base race and yields a single ancestry named for the race.

     `overwrite: { languageProficiencies: true }` on a subrace means
     REPLACE the race's block, not add to it. High Elf is the only SRD
     case and getting it wrong hands out Common twice.

   2024: species are flat. `abilityIncreases` is null for every one of
     them — the increases moved to the background — and the sub-choice
     that used to be a subrace is now a named block inside the species'
     own `additionalSpells` (Elven Lineage: Drow / High Elf / Wood Elf).
     Those surface in `choices` as kind "lineage".
------------------------------------------------------------------- */
import { flatten } from "./entries.js";
import { idMinter, slugify } from "./ids.js";
import { entryToFeature } from "./features.js";
import {
  normSkills, normLanguages, normTools, normWeaponUids,
  normAbilityIncrease, mergeProf,
} from "./prof.js";
import { normAdditionalSpells } from "./additionalSpells.js";

const SIZE_LABEL = { T: "Tiny", S: "Small", M: "Medium", L: "Large", H: "Huge", G: "Gargantuan" };

/* Merge two ability-increase blocks (race + subrace). */
function mergeAbility(a, b) {
  if (!a && !b) return null;
  const fixed = { ...(a?.fixed || {}) };
  for (const [k, v] of Object.entries(b?.fixed || {})) fixed[k] = (fixed[k] || 0) + v;
  return { fixed, choices: [...(a?.choices || []), ...(b?.choices || [])] };
}

const pick = (sub, race, key) =>
  (sub?.overwrite?.[key] ? sub[key] : undefined) ?? sub?.[key] ?? race?.[key];

const bothProf = (sub, race, key, norm) =>
  (sub?.overwrite?.[key] ? norm(sub[key]) : mergeProf(norm(race?.[key]), norm(sub?.[key])));

function traitsOf(rec, reg, source) {
  return (rec?.entries || [])
    .filter((e) => e && typeof e === "object" && e.name)
    .map((e) => entryToFeature(e, reg, { source: rec.source, page: rec.page, from: `ancestry ${source}` }));
}

/* The 2024 species lineage choice, read off named additionalSpells
   blocks. Their level-1 benefit text lives in the species' own trait
   table, which stays available as that trait's `blocks`. */
function lineageChoices(addl) {
  const named = (addl || []).filter((b) => b.name);
  if (named.length < 2) return [];
  return [{
    kind: "lineage",
    count: 1,
    options: named.map((b) => ({ id: slugify(b.name), name: b.name, ability: b.ability, grants: b.grants })),
  }];
}

function one(race, sub, reg, mint) {
  const named = !!sub?.name;
  const name = named ? `${sub.name} ${race.name}` : race.name;
  const source = sub?.source ?? race.source;
  const abilityRaw = mergeAbility(normAbilityIncrease(race.ability), normAbilityIncrease(sub?.ability));
  const addl = normAdditionalSpells([...(race.additionalSpells || []), ...(sub?.additionalSpells || [])]);
  const sizes = (pick(sub, race, "size") || []).map((s) => SIZE_LABEL[s] || s);
  const skills = bothProf(sub, race, "skillProficiencies", normSkills);

  const traits = [...traitsOf(race, reg, name), ...traitsOf(sub, reg, name)];
  const flat = flatten([...(race.entries || []), ...(sub?.entries || [])]);

  return {
    kind: "ancestry",
    id: mint(name, source),
    name,
    baseName: race.name,
    lineageName: named ? sub.name : null,
    source,
    page: sub?.page ?? race.page ?? null,
    creatureTypes: (pick(sub, race, "creatureTypes") || ["humanoid"]).slice(),
    size: sizes.length === 1 ? sizes[0] : sizes,
    sizes,
    speed: normSpeed(pick(sub, race, "speed")),
    darkvision: pick(sub, race, "darkvision") ?? null,
    /* null for 2024 — the increases live on the background. */
    abilityIncreases: abilityRaw && (Object.keys(abilityRaw.fixed).length || abilityRaw.choices.length) ? abilityRaw : null,
    languages: bothProf(sub, race, "languageProficiencies", normLanguages),
    skills,
    tools: bothProf(sub, race, "toolProficiencies", normTools),
    weapons: bothProf(sub, race, "weaponProficiencies", normWeaponUids),
    resist: (pick(sub, race, "resist") || []).map(String),
    traitTags: (pick(sub, race, "traitTags") || []).slice(),
    traits,
    text: flat.text,
    blocks: flat.blocks,
    additionalSpells: addl,
    choices: [
      ...lineageChoices(addl),
      ...skills.choices.map((c) => ({ kind: "skill", ...c })),
      ...(abilityRaw?.choices || []).map((c) => ({ kind: "ability", ...c })),
    ],
  };
}

/* `speed` is a number, or { walk, fly, swim, climb } with booleans for
   "equal to your walking speed". */
function normSpeed(sp) {
  if (sp == null) return { walk: 0 };
  if (typeof sp === "number") return { walk: sp };
  const out = {};
  for (const [k, v] of Object.entries(sp)) out[k] = v === true ? (typeof sp.walk === "number" ? sp.walk : true) : v;
  return out;
}

export function buildAncestries(reg) {
  const mint = idMinter();
  const subsByRace = new Map();
  for (const s of reg.content.subraces || []) {
    const k = String(s.raceName).toLowerCase();
    if (!subsByRace.has(k)) subsByRace.set(k, []);
    subsByRace.get(k).push(s);
  }

  const out = [];
  for (const race of reg.content.races || []) {
    const subs = subsByRace.get(String(race.name).toLowerCase()) || [];
    if (!subs.length) { out.push(one(race, null, reg, mint)); continue; }
    for (const sub of subs) out.push(one(race, sub, reg, mint));
  }
  return out;
}
