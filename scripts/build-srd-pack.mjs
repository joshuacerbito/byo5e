/* ------------------------------------------------------------------
   Builds the two SRD content packs from a local 5etools-src checkout:

     node scripts/build-srd-pack.mjs      (npm run build:packs)

   Output: src/packs/srd-5.1.json and src/packs/srd-5.2.json — one per
   rules edition, each self-contained. The app bundles these and ships
   nothing else from 5etools; the checkout itself stays gitignored
   while the packs are committed.

   Records are emitted in 5etools shape, VERBATIM. Entry trees and
   {@tag} markup are left exactly as found, because the app has a
   mapper layer that consumes that shape and strips tags at runtime.
   The only edits are (a) dropping pure 5etools bookkeeping fields,
   (b) the SRD rename below, (c) a `classLists` array injected onto
   spells, which is the one piece of eligibility data 5etools keeps
   outside the record, and (d) backfilling `primaryAbility` onto 2014
   class records, which 5etools never populates for PHB (only XPHB) —
   see PRIMARY_ABILITY_2014 below.

   Deterministic by construction: every collection is sorted by a
   stable composite key and no build timestamp is written, so a re-run
   over the same checkout produces a byte-identical file.
------------------------------------------------------------------- */
import fs from "node:fs";
import path from "node:path";
import {
  DATA, ROOT, readJson, EDITIONS, keeps, applySrdName, stripBookkeeping,
  resolveCopies, parseClassFeatureRef, parseSubclassFeatureRef, parseOptionalFeatureRef,
  classFeatureKey, subclassFeatureKey, optionalFeatureKey, collectRefNodes,
  sortBy, recordKey, slug,
} from "./lib/fivetools-srd.mjs";

const OUT_DIR = path.join(ROOT, "src", "packs");

/* Verbatim attribution statements from each SRD PDF's own "Legal
   Information" page (not paraphrased — CC-BY-4.0's attribution
   condition requires the notice as the licensor specifies it):
     SRD 5.1:   https://media.dndbeyond.com/compendium-images/srd/5.1/SRD_CC_v5.1.pdf   (p.1)
     SRD 5.2.1: https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf (p.1)
   Both pages also say: "Please do not include any other attribution
   [to Wizards or its parent or affiliates] other than that provided
   above" — so this string is used as-is, nothing appended. */
/* A test pack carries the full text of books that are not open content,
   so it gets a notice that says exactly that rather than an SRD one. */
const TEST_NOTICE = "TEST BUILD — NOT FOR DISTRIBUTION. Contains the full text of "
  + "commercial products, which is not open content. Generated locally from a private "
  + "5etools-src checkout for QA against books the tester owns; never publish, deploy or "
  + "commit the resulting pack.";

const LICENSE_NOTICE = {
  "srd-5.1": "This work includes material taken from the System Reference Document 5.1 "
    + "(“SRD 5.1”) by Wizards of the Coast LLC and available at "
    + "https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed "
    + "under the Creative Commons Attribution 4.0 International License available at "
    + "https://creativecommons.org/licenses/by/4.0/legalcode.",
  "srd-5.2": "This work includes material from the System Reference Document 5.2.1 "
    + "(“SRD 5.2.1”) by Wizards of the Coast LLC, available at "
    + "https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons "
    + "Attribution 4.0 International License, available at "
    + "https://creativecommons.org/licenses/by/4.0/legalcode.",
};

const warnings = [];
const warn = (m) => warnings.push(m);

/* ------------------------------------------------------------------
   Sources of truth, per collection
------------------------------------------------------------------- */

function loadClassFiles() {
  /* _copy resolution happens per file, before any filtering: a copy's
     `_preserve` block can carry an `srd` flag onto the copied record,
     so filtering first would read half-built records. See
     _meta.internalCopies for which arrays resolve against the file. */
  const files = fs.readdirSync(path.join(DATA, "class"))
    .filter((f) => f.startsWith("class-") && f.endsWith(".json"))
    .sort();
  const all = { class: [], subclass: [], classFeature: [], subclassFeature: [] };
  for (const f of files) {
    const j = readJson(`class/${f}`);
    resolveCopies(j, j._meta?.internalCopies || [], (m) => warn(`class/${f}: ${m}`));
    for (const k of Object.keys(all)) all[k].push(...(j[k] || []));
  }
  return all;
}

/* Class-tied records need BOTH filters.

   `source` is what says which book printed the record. `classSource`
   says which edition of the class it hangs off — and 5etools re-files
   every 2014 subclass under the 2024 class as well, so 128 legacy
   subclasses carry classSource: "XPHB" while being 2014 records with
   source: "PHB". Filtering on classSource alone therefore pulls 2014
   content into the 2024 pack; filtering on source alone pulls in the
   XPHB-classSource duplicates of the very same 2014 subclasses (their
   _copy blocks _preserve the srd flag). Requiring both gives one
   record per subclass, filed against its own edition's class. */
const classTied = (arr, ed, classBooks = ed.classBooks) =>
  arr.filter((r) => keeps(ed, r) && ed.books.includes(r.source) && classBooks.includes(r.classSource));

/* Subclass FEATURES may be filed against a different edition of the class
   than the subclass record that points at them — see `featureBooks`. */
const featureTied = (arr, ed) => classTied(arr, ed, ed.featureBooks || ed.classBooks);

const plain = (arr, ed) => arr.filter((r) => keeps(ed, r) && ed.books.includes(r.source));

/* primaryAbility is an XPHB-only field in 5etools' own data — the 2014
   PHB class records never carry it, in the source files or upstream.
   The two editions assign the SAME primary abilities per class (this is
   unchanged rules text, not a 2024 revision), so backfill it onto the
   2014 records from the 2024 ones by class name rather than leaving the
   field silently absent from one pack and not the other. Shape matches
   5etools' own verbatim: an array of alternative groups, each group a
   {ability: true, ...} object (multiple keys in one group = both
   required; multiple groups = either satisfies it — see classes.js). */
const PRIMARY_ABILITY_2014 = {
  Barbarian: [{ str: true }],
  Bard: [{ cha: true }],
  Cleric: [{ wis: true }],
  Druid: [{ wis: true }],
  Fighter: [{ str: true }, { dex: true }],
  Monk: [{ dex: true, wis: true }],
  Paladin: [{ str: true, cha: true }],
  Ranger: [{ dex: true, wis: true }],
  Rogue: [{ dex: true }],
  Sorcerer: [{ cha: true }],
  Warlock: [{ cha: true }],
  Wizard: [{ int: true }],
};
/* Sidekick "classes" (TCE) are NPC companions, not player classes: no
   hit die, no saving throws, no subclass level. They are class-shaped
   records in the same file, so they have to be dropped by name of the
   flag 5etools marks them with rather than by any shape test. */
/* A later book that REPRINTS a class or subclass ships a second record
   under the same name — EFA reprints Tasha's Artificer and its four
   subclasses, so a naive union puts two Artificers in the class list and
   two Alchemists under each of them. The app mints ids from class and
   subclass names, so those duplicates also collide on id and make
   selection ambiguous. Keep one record per name, preferring the LAST
   book in the pack's own source order — later printing wins, which is
   what a player with all the books would use. A single-book pack has
   nothing to collapse, so the SRD packs are untouched. */
const dedupeByName = (rows, ed, keyOf) => {
  const rank = (r) => ed.books.indexOf(r.source);
  const best = new Map();
  for (const r of rows) {
    const k = keyOf(r).toLowerCase();
    const cur = best.get(k);
    if (!cur || rank(r) >= rank(cur)) best.set(k, r);
  }
  return rows.filter((r) => best.get(keyOf(r).toLowerCase()) === r);
};

const classesFor = (arr, ed) => dedupeByName(plain(arr, ed).filter((c) => !c.isSidekick), ed, (c) => c.name).map((c) => {
  if (c.primaryAbility || ed.rulesEdition !== "2014") return c;
  const fill = PRIMARY_ABILITY_2014[c.name];
  return fill ? { ...c, primaryAbility: fill } : c;
});

/* Items specifically: the equipment chapter is split across the Handbook
   and the DMG in 5etools' own data (see `itemBooks` on EDITIONS, used
   below for itemProperty/itemType/itemMastery already). `plain()` above
   filters on `ed.books`, which is fine for mundane PHB/XPHB
   gear but would silently drop almost every magic item — those are
   overwhelmingly DMG/XDMG-sourced. */
const itemsFor = (arr, ed) => arr.filter((r) => keeps(ed, r) && ed.itemBooks.includes(r.source));

/* ------------------------------------------------------------------
   Magic items

   items.json carries every magic item in the game; only two shapes of
   it are SRD content:
     - "static" records (+1 Wand of the War Mage, Bag of Holding, ...):
       pulled in below alongside the mundane rarity:"none" records,
       filtered the same way by their own srd/srd52 flag.
     - "generic variants" (magicvariants.json): templates applied to
       every matching base item rather than written out once each. The
       numeric-bonus families (+1/+2/+3 Weapon/Armor/Shield/Ammunition),
       XDMG's Enspelled Weapon/Armor families, and a handful of
       flavour-only armours (Adamantine, Mithral, Elven Chain, Dwarven
       Plate, Barding, the elemental-resistance armours) are expanded
       here. 5etools encodes narrative named weapons (Vorpal Sword, Holy
       Avenger, Flame Tongue, ...) the same mechanism, but their "bonus"
       is a special ability rather than a flat number — modelling that is
       a follow-up, not this.
------------------------------------------------------------------- */
const NUMBERED_VARIANT_RE = /^\+[123] (Weapon|Armor|Shield \(\*\)|Ammunition)$/;
/* XDMG's Enspelled families — one variant per spell level (Cantrip,
   Level 1..8) applied to every weapon, or to every armour. Unlike the
   narrative named weapons still left out below, these carry no special
   ability of their own: the item is a shell that casts a spell, so
   ...base plus the inherited rarity is the whole of it.

   The static "Enspelled Staff (Level N)" records in items.json are NOT
   these — a staff is its own item, not a generic variant — which is why
   the staff used to be the only enspelled thing in the packs. */
const ENSPELLED_VARIANT_RE = /^Enspelled (Weapon|Armor) \((Cantrip|Level [1-8])\)$/;
const FLAVOR_ARMOR_VARIANTS = new Set([
  "Adamantine Armor", "Mithral Armor", "Elven Chain", "Dwarven Plate", "Barding",
  "Armor of Acid Resistance", "Armor of Cold Resistance", "Armor of Fire Resistance",
  "Armor of Force Resistance", "Armor of Lightning Resistance", "Armor of Necrotic Resistance",
  "Armor of Poison Resistance", "Armor of Psychic Resistance", "Armor of Radiant Resistance",
  "Armor of Thunder Resistance",
]);
const isAllowedVariant = (name) => NUMBERED_VARIANT_RE.test(name)
  || ENSPELLED_VARIANT_RE.test(name) || FLAVOR_ARMOR_VARIANTS.has(name);

const typeCode = (t) => String(t ?? "").split("|")[0];

/* `requires`/`excludes` nodes only ever use the shapes the allowed
   variant families actually carry — weapon/armor flags, a type code, or
   a specific name+source (Elven Chain names "Chain Mail"/"Chain Shirt"
   rather than every medium+heavy armor). */
const matchesRequire = (base, req) => {
  if (req.armor) return !!base.armor;
  if (req.weapon) return !!base.weapon;
  /* Enspelled Weapon asks by category ("simple"/"martial") rather than
     the `weapon: true` flag the +1/+2/+3 families use. Unmatched keys
     fall through to false below, so leaving this out silently expanded
     the family against nothing at all.

     The weapon flag is still required: Staff and Wooden Staff are
     mundane records carrying weaponCategory without it, and letting
     them through would mint a second, different "Enspelled Staff"
     beside the static XDMG records of that name. */
  if (req.weaponCategory) return !!base.weapon && base.weaponCategory === req.weaponCategory;
  if (req.type) return typeCode(base.type) === typeCode(req.type);
  if (req.name) return base.name === req.name && (!req.source || base.source === req.source);
  return false;
};
const matchesExclude = (base, excl) => {
  if (!excl) return false;
  if (excl.net) return !!base.net;
  if (excl.name) return base.name === excl.name;
  return false;
};

/* "acid and cold" style join — one of the two {{...}} template
   substitutions any item pointing at a shared itemEntry record needs
   (see resolveItemEntries below). */
const resistJoin = (resist) => {
  const r = resist || [];
  if (r.length < 2) return r[0] || "";
  return `${r.slice(0, -1).join(", ")} and ${r[r.length - 1]}`;
};

/* `{=bonusWeapon}` / `{=bonusAc}` are the generic-variant mechanism's own
   inline placeholders — 5etools fills them from the record's own
   bonusWeapon/bonusAc when it applies a variant to a base item. */
const substituteBonusVars = (str, item) => str
  .replace(/\{=bonusWeapon\}/g, item.bonusWeapon || "")
  .replace(/\{=bonusAc\}/g, item.bonusAc || "");

/* A handful of items — generic-variant expansions AND static records
   alike (the ten Dragon Scale Mails, the Resistance armors) — don't
   spell their rules text out inline. They point at a SHARED record in
   items-base.json's itemEntry array via `{#itemEntry Name|Source}`,
   with `{{item.resist}}` / `{{item.detail1}}` filled in from the
   pointing item's own fields. Resolved here, at build time, because
   `{#itemEntry}` / `{{...}}` / `{=...}` are 5etools shapes the mapper
   layer must never see (it only ever strips `{@tag}`). */
function resolveItemEntries(item, itemEntryIndex) {
  const walk = (node) => {
    if (typeof node === "string") {
      const withVars = substituteBonusVars(node, item);
      const m = /^\{#itemEntry ([^|}]+)(?:\|([^}]+))?\}$/.exec(withVars);
      if (!m) return [withVars];
      const [, entryName, entrySource] = m;
      const rec = itemEntryIndex.get(`${entryName.toLowerCase()}|${(entrySource || item.source).toLowerCase()}`);
      if (!rec) return [withVars];
      /* Templates are usually plain strings, but a few outside the SRD
         slice (BMT/XDMG items reached by the test packs) nest a table
         or list node in there — pass those through untouched rather
         than trying to substitute into an object. */
      return (rec.entriesTemplate || []).map((t) => (typeof t !== "string" ? t : substituteBonusVars(t, item)
        .replace(/\{\{getFullImmRes item\.resist\}\}/g, resistJoin(item.resist))
        .replace(/\{\{item\.resist\}\}/g, resistJoin(item.resist))
        .replace(/\{\{item\.detail1\}\}/g, item.detail1 ?? "")));
    }
    if (Array.isArray(node)) return node.flatMap(walk);
    /* A nested { type:"entries", entries:[...] } node — resolve inside it
       without disturbing the wrapper. None of the allowed families nest
       this deep today, but a directive could in principle appear there. */
    if (node && typeof node === "object" && Array.isArray(node.entries)) {
      return [{ ...node, entries: node.entries.flatMap(walk) }];
    }
    return [node];
  };
  return (item.entries || []).flatMap(walk);
}

/* One merged record per (allowed variant x matching base item). `srcItems`
   is the edition's OWN already-SRD-filtered item list, so the expansion
   never reaches past the pack's own boundary — a non-SRD base item (a
   DMG optional firearm, say) can't grow a +1 version here. `entries` is
   copied verbatim from `inherits` — resolveItemEntries() below runs over
   every item, generated and static alike, in one pass. */
function expandVariants(variants, ed, srcItems) {
  const out = [];
  for (const v of variants) {
    if (!isAllowedVariant(v.name) || !keeps(ed, v.inherits)
        || !ed.itemBooks.includes(v.inherits.source)) continue;
    const inh = v.inherits;
    /* A generic variant dresses a MUNDANE item — the template supplies
       the magic, so applying one to a record that is already magic
       stacks two enchantments that were never meant to meet. srcItems
       carries both kinds, and a `requires` clause happily matches
       either: `type` matches a magic armour's type as readily as a
       plain one, which is how "Adamantine Armor of Invulnerability" and
       "Mithral Armor of Invulnerability" reached the packs, and
       weaponCategory would have produced "Enspelled +1 Moon Sickle".
       The rule belongs to the base pool rather than to any one
       requirement shape, so it sits here and covers every family. */
    const matched = srcItems.filter((b) =>
      (!b.rarity || b.rarity === "none")
      && (v.requires || []).some((r) => matchesRequire(b, r)) && !matchesExclude(b, v.excludes));
    for (const base of matched) {
      let baseName = base.name;
      if (inh.nameRemove) baseName = baseName.split(inh.nameRemove).join("");
      const rec = {
        ...base,
        name: `${inh.namePrefix || ""}${baseName}${inh.nameSuffix || ""}`,
        /* The mundane item this variant is built from — a +1/+2/+3
           Greatsword all carry the same mastery property as the plain
           Greatsword (5etools fixes mastery on the base weapon record,
           inherited via `...base` above same as every other untouched
           field), so the app needs a stable key to say "these are all
           the same weapon TYPE for mastery purposes" without parsing it
           back out of the display name. */
        baseItemName: baseName,
        rarity: inh.rarity,
        reqAttune: inh.reqAttune ?? null,
        bonusWeapon: inh.bonusWeapon ?? null,
        bonusAc: inh.bonusAc ?? null,
        resist: inh.resist ?? null,
        detail1: inh.detail1 ?? null,
        entries: inh.entries,
        source: inh.source,
        page: inh.page ?? null,
      };
      delete rec.srd; delete rec.srd52;
      if (ed.flag) rec[ed.flag] = true;
      out.push(rec);
    }
  }
  return out;
}

function spellsFor(ed, spellSources) {
  const raw = ed.spellFiles.flatMap((f) => readJson(f).spell);
  /* One lookup block per book the pack draws spells from, merged in the
     order the files were listed — the blocks are keyed by spell name and
     no two books print the same spell, so the merge is a union. */
  const block = Object.assign({}, ...ed.books.map((b) => spellSources[b] || {}));
  const classBooks = ed.spellClassBooks || ed.classBooks;
  return plain(raw, ed).map((sp) => {
    /* Class eligibility is not on the spell record — it lives in
       spells/sources.json, keyed by the spell's ORIGINAL name (so this
       lookup has to happen before the SRD rename). `classVariant`
       entries are lists a later book granted to a class that the
       Handbook did not; both keys are folded into one flat array of
       lowercase class slugs, filtered to this edition's own class
       source so e.g. artificer (TCE) never leaks in. */
    const e = block[sp.name] || {};
    const names = [...(e.class || []), ...(e.classVariant || [])]
      .filter((c) => classBooks.includes(c.source))
      .map((c) => slug(c.name));
    return { ...sp, classLists: [...new Set(names)].sort() };
  });
}

/* ------------------------------------------------------------------
   Build one pack
------------------------------------------------------------------- */
function buildPack(ed, shared) {
  const { classes, races, backgrounds, feats, optFeatures, itemsBase, magicvariants, itemEntryIndex,
    skills, languages, conditions, spellSources } = shared;

  /* Base items (mundane + static magic) for this edition, then the
     generic-variant expansion over that same set — see the "Magic items"
     block above. */
  const baseSrdItems = itemsFor(itemsBase.baseitem, ed);
  const itemsWithVariants = [...baseSrdItems, ...expandVariants(magicvariants.magicvariant, ed, baseSrdItems)];
  /* One pass, over every item (static and generated alike), resolving
     any {#itemEntry}/{{...}}/{=...} directive it carries — see
     resolveItemEntries() above. */
  const items = itemsWithVariants.map((it) => ({ ...it, entries: resolveItemEntries(it, itemEntryIndex) }));

  const content = {
    classes: classesFor(classes.class, ed),
    classFeatures: classTied(classes.classFeature, ed),
    subclasses: dedupeByName(
      classTied(classes.subclass, ed).filter((r) => r.subclassFeatures?.length),
      ed, (r) => `${r.className}|${r.shortName ?? r.name}`),
    subclassFeatures: featureTied(classes.subclassFeature, ed),

    races: plain(races.race, ed),
    /* 2024 folded subraces into species traits, so this is empty for
       5.2 by design, not by a filter bug. */
    subraces: plain(races.subrace || [], ed),
    backgrounds: plain(backgrounds.background, ed),
    feats: plain(feats.feat, ed),
    optionalFeatures: plain(optFeatures.optionalfeature, ed),

    spells: spellsFor(ed, spellSources),

    /* itemsBase.baseitem is the equipment table plus items.json's
       mundane (rarity:"none") and magic (rarity!=="none") records,
       merged above, plus the generic-variant expansion computed just
       above this object. */
    items,
    /* itemProperty / itemType / itemMastery carry no SRD flag of any
       kind, so `source` is the only filter that exists for them. */
    itemProperties: (itemsBase.itemProperty || []).filter((r) => ed.itemBooks.includes(r.source)),
    itemTypes: (itemsBase.itemType || []).filter((r) => ed.itemBooks.includes(r.source)),
    itemMasteries: (itemsBase.itemMastery || []).filter((r) => ed.itemBooks.includes(r.source)),

    skills: plain(skills.skill, ed),
    languages: plain(languages.language, ed),
    conditions: plain(conditions.condition, ed),
  };

  const renamed = [];
  for (const key of Object.keys(content)) {
    const rows = content[key].map((r) => {
      const next = applySrdName(r, ed.flag);
      if (next.nameOriginal) renamed.push({ collection: key, from: next.nameOriginal, to: next.name });
      return stripBookkeeping(next);
    });
    content[key] = sortBy(rows, recordKey);
  }

  const counts = Object.fromEntries(Object.entries(content).map(([k, v]) => [k, v.length]));
  const sourceBooks = [...new Set(Object.values(content).flat().map((r) => r.source).filter(Boolean))].sort();

  const pack = {
    packFormat: 1,
    id: ed.id,
    name: ed.name,
    abbrev: ed.test ? "TEST" : "SRD",
    rulesEdition: ed.rulesEdition,
    sourceBooks,
    license: ed.test
      ? { spdx: "LicenseRef-proprietary", holder: "Wizards of the Coast LLC", notice: TEST_NOTICE }
      : { spdx: "CC-BY-4.0", holder: "Wizards of the Coast LLC", notice: LICENSE_NOTICE[ed.id] },
    counts,
    content,
  };
  return { pack, renamed, dangling: auditRefs(pack) };
}

/* ------------------------------------------------------------------
   Reference audit

   Every classFeatures / subclassFeatures string and every ref* node in
   an entry tree must point at something the pack itself carries. A
   dangling one is reported, never dropped: it is a fact about what the
   SRD subset genuinely lacks, and silently pruning it would hide that.
------------------------------------------------------------------- */
function auditRefs(pack) {
  const c = pack.content;
  const have = {
    classFeature: new Set(c.classFeatures.map(classFeatureKey)),
    subclassFeature: new Set(c.subclassFeatures.map(subclassFeatureKey)),
    optionalfeature: new Set(c.optionalFeatures.map(optionalFeatureKey)),
  };
  const missing = new Map();
  const need = (kind, str, from) => {
    const p = kind === "classFeature" ? parseClassFeatureRef(str)
      : kind === "subclassFeature" ? parseSubclassFeatureRef(str)
        : parseOptionalFeatureRef(str);
    const key = kind === "classFeature" ? classFeatureKey(p)
      : kind === "subclassFeature" ? subclassFeatureKey(p)
        : optionalFeatureKey(p);
    if (have[kind].has(key)) return;
    const id = `${kind}|${str}`;
    if (!missing.has(id)) missing.set(id, { kind, ref: str, from: new Set() });
    missing.get(id).from.add(from);
  };

  for (const cl of c.classes) {
    for (const s of cl.classFeatures || []) need("classFeature", typeof s === "string" ? s : s.classFeature, `class ${cl.name}`);
  }
  for (const sc of c.subclasses) {
    for (const s of sc.subclassFeatures || []) need("subclassFeature", typeof s === "string" ? s : s.subclassFeature, `subclass ${sc.name} (${sc.className})`);
  }
  for (const key of Object.keys(c)) {
    for (const rec of c[key]) {
      for (const [kind, str] of collectRefNodes(rec.entries)) need(kind, str, `${key}: ${rec.name}`);
    }
  }
  return [...missing.values()]
    .map((m) => ({ kind: m.kind, ref: m.ref, from: [...m.from].sort() }))
    .sort((a, b) => (a.kind + a.ref < b.kind + b.ref ? -1 : 1));
}

/* ------------------------------------------------------------------
   Run
------------------------------------------------------------------- */
const shared = (() => {
  const races = readJson("races.json");
  resolveCopies(races, races._meta?.internalCopies || [], (m) => warn(`races.json: ${m}`));
  const backgrounds = readJson("backgrounds.json");
  resolveCopies(backgrounds, backgrounds._meta?.internalCopies || [], (m) => warn(`backgrounds.json: ${m}`));
  const itemsBase = readJson("items-base.json");
  resolveCopies(itemsBase, itemsBase._meta?.internalCopies || [], (m) => warn(`items-base.json: ${m}`));
  /* items.json is items-base's mundane gear (adventuring packs, tools,
     spellcasting foci, quivers, ...) mixed in with every magic item in
     the game. rarity:"none" records are the mundane ones; everything
     from "common" up is a magic item by 5etools convention. Everything
     is merged in unfiltered and buildPack's per-edition itemsFor() does
     the whole selection — an SRD pack still keeps only flagged records,
     while a test pack keeps every magic item its source list allows
     (BMT's decks, XDMG's magic items), which pre-filtering on the SRD
     flags here would have thrown away before the pack ever saw them.
     No name+source collides with items-base.json. */
  const items = readJson("items.json");
  resolveCopies(items, items._meta?.internalCopies || [], (m) => warn(`items.json: ${m}`));
  itemsBase.baseitem = [...itemsBase.baseitem, ...items.item];
  /* itemEntry: shared rules text a few generic variants point at via
     `{#itemEntry Name|Source}` rather than spelling out inline — see
     resolveItemEntry() above. */
  const itemEntryIndex = new Map((itemsBase.itemEntry || [])
    .map((e) => [`${e.name.toLowerCase()}|${e.source.toLowerCase()}`, e]));
  return {
    classes: loadClassFiles(),
    races, backgrounds, itemsBase,
    magicvariants: readJson("magicvariants.json"), itemEntryIndex,
    feats: readJson("feats.json"),
    optFeatures: readJson("optionalfeatures.json"),
    skills: readJson("skills.json"),
    languages: readJson("languages.json"),
    conditions: readJson("conditionsdiseases.json"),
    spellSources: readJson("spells/sources.json"),
  };
})();

fs.mkdirSync(OUT_DIR, { recursive: true });
const results = [];
for (const ed of EDITIONS) {
  const built = buildPack(ed, shared);
  const file = path.join(OUT_DIR, `${ed.id}.json`);
  /* Compact JSON: this is generated data, read by the app, not by a
     human, and pretty-printing it adds roughly a third to the size of
     a file that gets committed. */
  fs.writeFileSync(file, JSON.stringify(built.pack) + "\n");
  results.push({ ed, file, ...built });
}

/* ---- report ------------------------------------------------------ */
const COLS = Object.keys(results[0].pack.counts);
const pad = (s, n) => String(s).padEnd(n);
const w = Math.max(...COLS.map((c) => c.length)) + 2;
const cw = Math.max(12, ...results.map((r) => r.ed.id.length + 2));

console.log("\nContent packs\n");
console.log(pad("collection", w) + results.map((r) => pad(r.ed.id, cw)).join(""));
console.log("-".repeat(w + cw * results.length));
for (const c of COLS) {
  console.log(pad(c, w) + results.map((r) => pad(r.pack.counts[c], cw)).join(""));
}

for (const r of results) {
  const bytes = fs.statSync(r.file).size;
  console.log(`\n${r.ed.name}  ${path.relative(ROOT, r.file)}  ${(bytes / 1024).toFixed(1)} kB  sourceBooks=[${r.pack.sourceBooks}]`);
  console.log(`  SRD-renamed records: ${r.renamed.length}`);
  for (const x of r.renamed) console.log(`    ${x.collection}: ${x.from} -> ${x.to}`);
  console.log(`  dangling references: ${r.dangling.length}`);
  for (const d of r.dangling) console.log(`    [${d.kind}] ${d.ref}\n        from ${d.from.join(", ")}`);
}

if (warnings.length) {
  console.log(`\n_copy / _mod warnings (${warnings.length}):`);
  for (const m of [...new Set(warnings)]) console.log("  " + m);
}
console.log("");
