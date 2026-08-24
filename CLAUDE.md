# Sina Una Character Creator

A single-page character builder for **Sina Una**, a 5e-compatible sourcebook set in a
precolonial Philippine-inspired archipelago. Built for one table running a short campaign,
**levels 1–5 only**.

Personal-use project. Josh owns physical copies of both source books.

---

## Non-negotiables

**5e 2014 rules, not 2024.** Sina Una predates the revision and is built on subraces and
racial ability score increases, both of which 2024 removed. Do not "modernise" the chassis.

**Level 5 is the ceiling.** The level picker stops at 5. Proficiency bonus never exceeds +3.
Max spell level is 3 (full casters and warlocks), 2 (half casters), 1 (third casters).
Data for higher levels exists in the JSON files — the app filters it out rather than deleting it.

**Filter, don't validate.** Illegal options are never rendered. If a Gold Gnome already has
Perception, it does not appear in the ranger's skill list. No red error text, no "you already
have this" warnings. An invalid character should be unrepresentable, not merely flagged.

There is exactly **one deliberate exception**: fixed-skill backgrounds that collide with
already-chosen class skills. That collision depends on choices made two steps earlier, so it
is surfaced with a struck-through duplicate and a "Change class skills" link rather than
filtered away. Don't "fix" this by reordering the wizard.

**Book errata are recorded, never silently corrected.** Where the source contradicts itself
we use one reading and note the other in an `errata` field. Known cases:

| Where | Issue |
|---|---|
| Circle of Tides (druid) | Feature table is headed "College of Tides Features" |
| Diwata Bloodline (sorcerer) | L18 feature is "Nature's Unending Reach" in the table, "One with Nature" in the body |
| Mist of the Moon Twins | Called "Mischievous Mist of the Moon Twins" on cleric and warlock lists |
| Graverobber (rogue) | Save DC is **10** + proficiency + Charisma. Standard 5e is 8. Implemented as printed |
| Panday (background) | Grants **three** fixed skills where 5e backgrounds grant two. As printed |

---

## Layout

Vite + React. No router, no persistence. All state is `useState` in the root component.

```
index.html
vite.config.js
wrangler.toml               pages_build_output_dir for `wrangler pages deploy`
public/_headers              Cloudflare Pages cache rules — copied into dist/ verbatim by Vite
scripts/check.mjs          static checks — run `npm run check` after every edit
src/
  main.jsx                 entry point
  SinaUnaCreator.jsx       root component: state, derivation, step rendering (~1480 lines)
  styles.js                all CSS as one exported template string
  components/
    Rule.jsx               group divider — hairline + batok chevron
    SpellRow.jsx           one selectable spell; renders whatever fields exist
  lib/
    derive.js              mod, fmt, recommendedSpread, resolveLineage
    steps.js               step list, buildSteps, profBonus, SLOTS_THIRD
    sheetHtml.js           buildSheetHTML(ctx) — standalone printable document
  data/
    baseRaces.js           9 PHB base races
    lineages.js            22 lineages (7 Sina Una, 15 PHB)
    classes.js             CLASSES, ARMOR, ALL_SKILLS
    subclasses.js          12 Sina Una + 40 PHB
    backgrounds.js         6 Sina Una
    islandSpells.js        SPELLS, SPIRIT_TABLE, SPELL_LISTS
    phbSpells.js           198 PHB spells, levels 0-3
    progression.js         ABILITIES, point buy, slots, CASTING, SKILL_ABILITY
```

`buildSheetHTML` used to close over ~20 component variables. It now takes an explicit
`sheetCtx` object assembled in the root component — if you add a field to the sheet, add it
to that object too or it'll be `undefined` rather than throw.

### The effects layer — read this before adding content

Subclasses and lineages **declare** what they change; derived-stat functions read those
declarations. Do not add special cases for individual subclasses. Adding Draconic Bloodline's
13+Dex AC and +1 HP/level required zero new code, only data.

```js
effects: [
  { type: "acFormula", base: 13, add: ["dex"], condition: "unarmored", label: "…", atLevel: 1 },
  { type: "hpPerLevel", value: 1 },
]
```

Supported types: `acFormula`, `armorProf`, `shieldProf`, `weaponProf`, `skillProf`,
`languages`, `hpPerLevel`, `casting`, `bonusCantrips`, `bonusSkills`, `preparedBonus`,
`speed`, `darkvision`.

Every effect may carry `atLevel`, defaulting to the subclass unlock level. Collected in the
`effects` memo, read via the `fx(type)` helper.

Two Sina Una subclasses use it: Mentala (`acFormula`) and Graverobber (`casting`, `dcBase: 10`).
Lineages use it too — Wood Elf `speed`, Drow `darkvision`, Hill Dwarf `hpPerLevel`,
Mountain Dwarf `armorProf`.
Twelve of the forty PHB subclasses carry effects.

**Action-economy tags.** Feature tuples (`CLASS_FEATURES`, `SINA_UNA_SUBCLASSES` features,
ancestry `traits`) are `[level, name, text]` — or `[level, name, text, action]` when the feature
is something you spend an action/bonus action/reaction to use. `action` is one of `"action"` |
`"bonus"` | `"reaction"` | `"free"` (Action Surge-style — grants a turn effect for no cost),
defined in `ACTION_ORDER`/`ACTION_LABELS` (`src/lib/derive.js`). This is an explicit editorial
tag, not text-pattern-matched — most features are passive and carry none; only tag a feature
after reading its text and confirming what it costs to use. Powers the "Actions" panel
(Defenses step) and printable-sheet section, both grouped by bucket. Currently populated for
all 12 core classes and the 12 Sina Una subclasses (both have full text); PHB subclasses don't
have feature text yet (see Outstanding work) so aren't tagged.

### Wizard steps

Built by `buildSteps(hasSpellStep)`. The Spells step **only appears for casters**, so step
indices shift. Always compare against `here` (the step name), never a numeric index.

`Ancestry → Abilities → Class → Background → Defenses → [Spells] → Sheet`

### Ancestry model

Sina Una defines no standalone races. Every option modifies a PHB base race:

- **subrace** — additive. Volcano Dwarf = dwarf's CON +2 *plus* INT +1.
- **variant** — substitutive via `replaces`. Carabao Tiefling drops the tiefling's INT +1/CHA +2
  entirely and replaces Hellish Resistance and Infernal Legacy.
- **standard** — the base race unmodified.

Two-stage UI: pick base race, then pick lineage from a merged pool with Sina Una listed above PHB.

### Export

The app runs as a real Vite page now (not an artifact iframe), so `window.print()` works
directly — no need for `react-to-print` or jsPDF. `buildSheetHTML()` generates a self-contained
HTML document with its own print stylesheet; `printSheet()` opens it in a new tab via
`window.open` + `document.write` and calls `.print()` once it loads, landing the user straight
in the OS print dialog (`Save as PDF` from there). `downloadSheet()` still exists as a secondary
path — Blob download of the same HTML, for anyone who wants the raw file instead (email to the
DM, edit by hand, archive). Both build off the same `sheetCtx` object and `buildSheetHTML()`.

### Deployment — Cloudflare Pages

Static build, no server, no API — `npm run build` outputs `dist/` and that's the whole deploy.

- **Build command** `npm run build` · **Output directory** `dist` · **Node version** pinned by
  `.node-version` (20) — Cloudflare Pages reads it automatically.
- `wrangler.toml` sets `pages_build_output_dir` for CLI deploys (`wrangler pages deploy`); the
  dashboard's git-connected build ignores it and uses the project's own build-settings fields —
  set them to match if configuring there instead.
- `public/_headers` is copied into `dist/` by Vite and read natively by Pages: hashed files under
  `/assets/*` get a year-long immutable cache, `index.html` gets `must-revalidate` so a new deploy
  is picked up on next load instead of served stale.
- No router — one `index.html`, no client-side routes to redirect — so no `_redirects` file is
  needed.
- `5etools-src/`, `source/`, and `reference/` are gitignored: `5etools-src` is a ~550MB 5etools
  data checkout used only to extract spell/feature text during development (see Working practice
  below); `source/` holds the purchased Sina Una PDFs and OCR passes; `reference/` holds
  intermediate JSON pulled from both. None of the three is imported by anything under `src/` —
  only `src/data/*.js` ships — and the PDFs in particular are copyrighted material that must
  never end up in the deployed bundle or the git history Cloudflare builds from.

---

## Content inventory

| Content | Count | Source |
|---|---|---|
| Lineages | 22 | 7 Sina Una, 15 PHB, across 9 base races |
| Subclasses | 52 | 12 Sina Una, 40 PHB |
| Backgrounds | 6 | Sina Una only |
| Island spells | 14 in app | levels 0–3; 24 total in `spells.json` |
| PHB spells | 198 | levels 0–3 |

---

## Outstanding work, in priority order

### 1. ~~Wire in the PHB spell descriptions~~ — DONE

`src/data/phbSpells.js` now carries full metadata (school, page, time, range, comp, dur,
ritual, conc, text) for all 198 PHB spells, levels 0-3. Source is
`5etools-src/data/spells/spells-phb.json` (source: PHB, level ≤ 3), not the old hand-written
`reference/phb_meta_1.js`/`phb_meta_2.js` — those are stale and can be deleted. Name set
verified 198/198 against the existing roster, no missing/extra. `{@tag}` markup stripped;
named sub-options (e.g. Command's Approach/Drop/Flee, Enhance Ability's Bear's Endurance etc.)
are folded into `text` as "Name. effect." sentences; one 5etools editorial `{@note}` aside
(Find Familiar) was dropped as non-book text.

### 1b. ~~Sina Una subclass feature text~~ — DONE

All 12 Sina Una subclasses (52 features total) now carry full `text` on every feature tuple —
`features: [[level, name, text], ...]` — transcribed by visual read of PDF part 4 pp.41-45 and
part 5 pp.1-17 (book pp.176-196), per the project's no-OCR-for-mechanics rule. Wired into both
the in-app appendix (`SinaUnaCreator.jsx`) and the printable sheet (`sheetHtml.js`), replacing
the old "Full text on p.N of the source" placeholder. Two new `errata` fields recorded along
the way, matching the two Circle of Tides / Diwata Bloodline rows already in the table above.

Two gaps remain, deliberately out of scope for this pass:
- **Core class features are entirely absent** — no Rage, Second Wind, Sneak Attack, Extra
  Attack, Fighting Style, etc. for any of the 12 PHB classes. Not documented anywhere before
  now; found while wiring subclass text. `5etools-src/data/class/class-<name>.json` has full
  text for all of it (`classFeature` array, `source: "PHB"`, `level <= 5`) — scriptable the
  same way the PHB spells were.
- **PHB subclass features (40 subclasses) are still names-only.** Same 5etools files carry
  `subclassFeature` entries with full text — also scriptable, but `refOptionalfeature` /
  `refSubclassFeature` links (e.g. Fighting Style's options) need resolving against
  `data/optionalfeatures.json` first.
- Mooneater Patron's page 195 ("Mooneater Eldritch Invocations" — 5 patron-flavored eldritch
  invocation options) was read but not transcribed in — the app doesn't track invocation picks
  at all yet, PHB or Sina Una.

### 2. The Babaylan class — MISSING ENTIRELY

Sina Una has a **thirteenth class**, the babaylan (priest-shaman), which the app does not
implement at all. It was missed because the initial class-chapter scan searched only for the
twelve PHB class names.

Evidence: a full babaylan spell list on p.224 running cantrips through 9th level — the second
longest in the book — sitting alongside the PHB classes as a peer. "Babaylan" appears 213 times
across the OCR markdown, concentrated in files 2–4.

`SPELL_LISTS.babaylan` already exists in the app, so the spell side is half-ready. The class
chassis, hit die, proficiencies, and subclasses all still need extracting from PDF parts 4–5.
Given the babaylan is the figure the whole setting revolves around, this is the biggest gap.

### 3. Persistence

No `localStorage` yet — it's blocked in artifacts, not out of the sandbox. Open question:
device-local blob, or an ID shareable with the DM.

### 4. Smaller items

- Ancestry spellcasting abilities: Balat-Kayo says Charisma, Umalagad says Wisdom, but Balete
  Elf's *entangle*/*barkskin* and Mangrove Halfling's *mending* specify none. May be a book
  omission — worth a look before it becomes a table argument.
- Equipment beyond armor was explicitly descoped.
- Bestiary never extracted.

---

## Working practice

**Verify with a tool, not by eye.** Four times in this build a confident assumption was wrong
and a script caught it:

- Volcano Dwarf's INT +1 was called a scan error; the book says INT +1
- A syntax checker flagged a mismatch that was an apostrophe in `you've` inside a JSX comment
- A passive Perception "failure" was a wrong expected value in the test, not a bug
- `window.print()` was asserted to work because the CSS existed; it never entered the print pipeline

```bash
npm install
npm run check      # after every edit
npm run dev
```

`npm run check` does five things: parses every module, verifies each cross-module import
resolves to a real export, finds identifiers used without being imported or declared,
confirms every `className` has a matching CSS rule (and lists dead ones), and asserts the data
counts still match this document. It caught a dangling `.su-sk.is-prof` selector with no body
during the module split — one that would have silently swallowed the rule after it.

**Don't trust the OCR markdown for mechanics.** `Sina_una_5e-pages-*.md` were produced by an
OCR pass that did not respect the book's two-column layout. Columns interleave mid-sentence,
tables are destroyed, and seven spells vanished entirely. Two ancestries had no ability score
increase at all. Use the markdown only for *locating* content, then read the PDF pages visually
to extract it.

**Rasterise before reading.** The PDFs are image-only, ~106 DPI, no text layer.

```bash
pdftoppm -jpeg -r 150 -f <page> -l <page> input.pdf /tmp/out
```

`tesseract` at 200 DPI grayscale is fine for *indexing* which page holds what — cheap and fast.
It is not good enough for extracting stat blocks or tables.

---

## Design

Dark UI, deliberately not imitating the book's parchment — this is a working tool used on a
phone at a table, and dark ground keeps numbers legible.

- Ground `#0B1622`, surfaces `#132436` / `#1B3145`, hairlines `#26445F`
- Gold `#D4A537` for the active state and key numbers, jade `#3FA98A` for completion,
  coral `#D9502F` for warnings only
- Fraunces (display), Karla (body), JetBrains Mono (all numbers)
- Signature element: **batok chevrons**, drawn from the tattoo linework in the ancestry
  portraits. Used in the step rail and as the group divider (`<Rule />`)
- Groups of choices are separated by `<Rule />` — a hairline gradient with a centred chevron

Spell metadata and description are separate `display:block` spans. They were inline spans once,
which ran `Instantaneous` straight into the description text. Keep them block.
