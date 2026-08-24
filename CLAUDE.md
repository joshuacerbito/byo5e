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
| Headhunter (class) | "Inevitable" is 17th level in the class table but "At 18th level" in the body text. Implemented at 18, as the body text states |
| Omen of Strife (headhunter) | No 18th-level feature text appears, though the class table implies one (matching Omen of Knowledge and Omen of Swiftness's 18th-level features). Possibly a book layout gap — recorded, not invented |

**Weapon Mastery is a second deliberate exception — 2024 content, opt-in, off by default.**
The Actions attack table carries a "Weapon Mastery" toggle (`masteryEnabled` state) that adds
each carried weapon's 2024 (XPHB) mastery property as an informational tag in the Notes
column, with the property's effect text available underneath. It is explicitly not part of
the 2014 chassis: it never feeds AC, attack bonus, damage, or any other derived stat, and the
app doesn't model "which masteries you know" the way 2024 classes do — every carried weapon
just shows its property when the toggle is on. Data source: `src/data/weapons.js`
(`WEAPON_MASTERY_2024`, `MASTERY_PROPERTY_TEXT`), pulled from 5etools-src's XPHB baseitem
entries and the "Weapon Mastery Properties" variant rule (p.214), not hand-guessed. If this
ever needs to come out, it's isolated to that toggle, those two exports, and the Notes-column
line that reads them — nothing else depends on it.

---

## Layout

Vite + React. No router. All state is `useState` in the root component, mirrored to
`localStorage`.

```
index.html
vite.config.js
wrangler.toml               pages_build_output_dir for `wrangler pages deploy`
public/_headers              Cloudflare Pages cache rules — copied into dist/ verbatim by Vite
scripts/check.mjs          static checks — run `npm run check` after every edit
scripts/build-pdf-fonts.sh regenerates src/pdf/vfsFonts.js (needs python3 + fonttools)
src/
  main.jsx                 entry point
  SinaUnaCreator.jsx       root component: state, derivation, step rendering (~1700 lines)
  styles.js                all CSS as one exported template string
  components/
    Rule.jsx               group divider — hairline + batok chevron
    SpellTableRow.jsx      one selectable spell, table-row layout (name/time/range/hit-DC/effect/notes)
  lib/
    derive.js              mod, fmt, attackBonus, isWeaponProficient, BASIC_ACTIONS, groupWeapons, parseStartingGold, recommendedSpread, resolveLineage
    steps.js               step list, buildSteps, profBonus, SLOTS_THIRD
    sheetHtml.js           buildSheetHTML(ctx) — standalone HTML sheet, secondary export
  pdf/
    sheetPdf.js            buildSheetDocDefinition(ctx) + downloadSheetPDF/openSheetPDF — primary export
    vfsFonts.js            GENERATED — base64 Fraunces/Karla subsets pdfmake embeds
  data/
    baseRaces.js           9 PHB base races
    lineages.js            22 lineages (7 Sina Una, 15 PHB)
    classes.js             CLASSES (incl. weaponProf, startingEquipment), ARMOR, ALL_SKILLS
    subclasses.js          18 Sina Una + 40 PHB
    backgrounds.js         6 Sina Una
    weapons.js             WEAPONS (37 PHB + 18 Sina Una), PROPERTY_LABELS, WEAPON_MASTERY_2024 (opt-in, see below)
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

Three Sina Una subclasses use it: Mentala (`acFormula`), Graverobber (`casting`, `dcBase: 10`),
and Omen of Swiftness (headhunter) (`casting`, third-caster from the cleric list — same shape
as the PHB's Eldritch Knight/Arcane Trickster).
Lineages use it too — Wood Elf `speed`, Drow `darkvision`, Hill Dwarf `hpPerLevel`,
Mountain Dwarf `armorProf`.
Twelve of the forty PHB subclasses carry effects.

**Action-economy tags.** Feature tuples (`CLASS_FEATURES`, `SINA_UNA_SUBCLASSES` features,
ancestry `traits`) are `[level, name, text]` — or `[level, name, text, action]` when the feature
is something you spend an action/bonus action/reaction to use. `action` is one of `"action"` |
`"bonus"` | `"reaction"` | `"free"` (Action Surge-style — grants a turn effect for no cost),
defined in `ACTION_ORDER`/`ACTION_LABELS` (`src/lib/derive.js`). This is an explicit editorial
tag, not text-pattern-matched — most features are passive and carry none; only tag a feature
after reading its text and confirming what it costs to use. Powers the "Actions" panel in the
app's Defenses step, grouped by bucket. Currently populated for all 14 core classes and the 18
Sina Una subclasses (both have full text); PHB subclasses don't have feature text yet (see
Outstanding work) so aren't tagged. The printable sheet carries a compact version too, titled
"Class Actions" — name only, grouped by bucket, each entry pointing at the section further down
that has the full text ("Abayan — See Babaylan features.") rather than repeating it up top,
which is why an earlier pass removed a fuller excerpt from here.

**Attack table.** The Actions panel also carries a weapon attack table, sitting above the
action-economy list. It's driven by `CLASSES[id].startingEquipment` (weapon choice groups +
fixed weapons, resolved via `equipmentChoices` state the same way `armorOptions` resolves
armor) and `CLASSES[id].weaponProf` (`{ categories, specific }`, checked by
`isWeaponProficient()` in `derive.js`). Weapon stats live in `src/data/weapons.js`
(`WEAPONS`, 37 PHB + 18 Sina Una weapons — one flat array, the app never distinguishes the two
sources downstream). Unarmed Strike (1 + Str mod, the 2014 damage — not 2024's d4) is
always listed. Background `equipment` stays prose-only, shown on the Background step — it was
never wired into the attack table (see Weapon Mastery note above for the one 2024 add-on this
table carries). The printable sheet gets the same table (`attackRows` from `sheetCtx`), on the
main pages rather than the appendix — it's meant for at-a-glance use during play.

**Spell table.** The Spells step's cantrip/leveled lists render through
`components/SpellTableRow.jsx` instead of a plain description list — one row per spell with
Name/Time/Range/Hit-DC/Effect/Notes columns, full description underneath (this view is for
picking spells, so the description stays). Hit/DC and Effect come from per-spell
`atk`/`save`/`dmg`/`dmgType`/`heal`/`cond` fields added to `phbSpells.js` (98 of 198 spells —
the rest are pure utility, no attack/save/damage to show) and to all 14 `islandSpells.js`
entries. The PHB fields were script-pulled from 5etools-src's
`spellAttack`/`savingThrow`/`damageInflict`/`miscTags` ("HL")/`conditionInflict` fields, not
hand-guessed — same verify-with-a-tool practice as the rest of the spell/feature text. The
printable sheet has its own compact version of this table (name/time/range/hit-DC/effect/
notes, no description) built straight from `chosenSpells` in `sheetHtml.js` — same
at-a-glance intent as the Attacks table, sitting on the main pages. Full spell text stays where
it always was, in the Reference appendix.

**The printable sheet has no fixed page count.** It flows to however many pages the character
needs — don't reintroduce "Page 1 / Page 2" framing in the UI or docs (a "two pages, then an
appendix" claim briefly existed in the Sheet step's copy and was wrong even before the Attacks/
Spells tables made the sheet longer).

### Wizard steps

Built by `buildSteps(hasSpellStep)`. The Spells step **only appears for casters**, so step
indices shift. Always compare against `here` (the step name), never a numeric index.

`Ancestry → Abilities → Class → Background → Defenses → [Spells] → Inventory → Sheet`

**Inventory step.** Consolidated "what do I own" view — weapons (`groupWeapons()`, dedupes
`carriedWeapons` into `{ weapon, qty }` rows), current armor/shield, gear (class
`startingEquipment.gear` + background `equipment` + background `tools`), and starting
currency. Currency is parsed off each background's flavor-text "N gp" equipment line
(`parseStartingGold()`, `src/lib/derive.js`) rather than being a structured field — no class
in this app grants extra starting gold, only backgrounds do, and always as one flat gp figure.
Read-only: no persistence, no in-session spend/earn tracking. Both `groupWeapons()`/
`parseStartingGold()` are shared by the app step and `sheetHtml.js`'s own Inventory section
(placed after Background on the printed sheet — background reading, not per-turn combat
info like Attacks/Spellcasting).

### Ancestry model

Sina Una defines no standalone races. Every option modifies a PHB base race:

- **subrace** — additive. Volcano Dwarf = dwarf's CON +2 *plus* INT +1.
- **variant** — substitutive via `replaces`. Carabao Tiefling drops the tiefling's INT +1/CHA +2
  entirely and replaces Hellish Resistance and Infernal Legacy.
- **standard** — the base race unmodified.

Two-stage UI: pick base race, then pick lineage from a merged pool with Sina Una listed above PHB.

### Export

Two paths out, both built from the same `sheetCtx` object assembled in the root component.

**PDF (primary) — `src/pdf/sheetPdf.js`.** `buildSheetDocDefinition(ctx)` turns `sheetCtx` into
a pdfmake document definition and pdfmake renders a real vector PDF in the browser:
`saveSheetPDF(ctx)` saves it, `openSheetPDF(ctx, win)` shows it in a tab (the tab must be
opened synchronously in the click handler and passed in, or the popup blocker eats it while the
PDF renders).

Saving does **not** go through pdfmake's own `.download()`, or any `<a download>` holding an
`application/pdf` blob: iOS Safari previews a blob it can render and ignores the download
attribute, dumping the file in a tab and leaving the user to walk ... → Share → Save to Files
by hand. `saveSheetPDF` hands the file to `navigator.share({ files })` where that exists —
"Save to Files" is then one tap on iOS — and falls back to an anchor download typed
`application/octet-stream`, which Safari won't try to display inline. `navigator.share` needs
transient user activation, so it must be reached from the click handler with nothing awaited
ahead of the render. This replaced the old hidden-iframe `window.print()` route, which worked on
desktop and was unreliable everywhere else — mobile Safari routes printing through the share
sheet and frequently never showed a dialog, and most Android print targets offer no "Save as
PDF" destination at all. Generating the PDF ourselves removes the OS print pipeline from the
loop; the same bytes come out on a phone as on a laptop.

pdfmake (~1 MB) and the embedded fonts (~150 KB) are `import()`ed on first export, not at page
load, and Vite emits them as separate chunks. Fonts are Fraunces (display) and Karla (body),
embedded so the PDF matches the app's type on machines that don't have them.
`src/pdf/vfsFonts.js` is **generated** — run `scripts/build-pdf-fonts.sh` to rebuild it (needs
`python3 -m pip install fonttools brotli`). Both families ship from Google Fonts as variable
fonts and pdfkit can't read a variable axis, so the script instances each weight to a static
TTF, subsets it to Latin + the punctuation the sheet uses, and base64s the result. Fraunces is
display-only, so all four pdfmake slots point at the single 700 instance rather than shipping
three more weights nothing draws.

The PDF layout deliberately differs from the HTML sheet: pdfmake has no CSS and no
break-inside rule that survives long content, so bordered section boxes become heading +
hairline. Boxes are kept only for the vitals and ability strips, which are short enough to mark
`unbreakable`. Two things are drawn rather than typed for the same reason the fonts are subset:
proficiency dots are canvas ellipses (● / ○ aren't in Karla), and every rule is an
explicit-width canvas line (`FULL` / `HALF` constants) because a pdfmake canvas can't auto-size
to its column — a full-width rule inside a half-width column overflows the page.

**HTML (secondary) — `src/lib/sheetHtml.js`.** `buildSheetHTML()` still generates the
self-contained document with its own print stylesheet, offered as a Blob download for anyone who
wants the raw file to hand-edit, mail to the DM, or archive. It carries the same content as the
PDF; the two builders are parallel and both read `sheetCtx`, so a field added to the sheet needs
adding in both places.

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
| Classes | 14 | 12 PHB, 2 Sina Una (Babaylan, Headhunter) |
| Lineages | 22 | 7 Sina Una, 15 PHB, across 9 base races |
| Subclasses | 58 | 18 Sina Una, 40 PHB |
| Backgrounds | 6 | Sina Una only |
| Island spells | 14 in app | levels 0–3; 24 total in `spells.json` |
| PHB spells | 198 | levels 0–3 |
| Weapons | 55 | 37 PHB + 18 Sina Una, simple + martial |
| Armor rows | 19 | 13 PHB + 6 Sina Una |

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

### 2. ~~The Babaylan and Headhunter classes~~ — DONE

Sina Una has a **13th and 14th class** — babaylan (priest-shaman) and headhunter — neither of
which the app implemented. Babaylan was flagged in this doc; headhunter wasn't documented
anywhere (the original class-chapter scan searched only for the twelve PHB class names, and
whatever found babaylan still missed headhunter).

Both now have full chassis (`CLASSES.babaylan`/`.headhunter`, `CLASS_FEATURES`, levels 1-5,
same treatment as the 12 PHB classes) and all 6 subclasses with full feature text through
level 20 (3 Babaylan Callings chosen at 1st level, 3 Headhunter Omens chosen at 3rd —
transcribed by visual read of book pp.164-175, the same practice as 1b). Omen of Swiftness
grants third-caster cleric-list spellcasting via the effects layer (see above). Babaylan's PHB
spell-list eligibility was cross-referenced against the class list on p.224 and tagged onto the
relevant `phbSpells.js` entries with a new `y` class code — `SPELL_LISTS.babaylan` (the
island-only spells) needed no changes, it was already correct.

Along the way, Sina Una's own weapon and armor tables (book pp.204-207 — 18 weapons, 6 armor
rows) turned out to be missing too, even though `backgrounds.js` already referenced a couple of
them by name. Added to the same `WEAPONS`/`ARMOR` arrays the PHB set lives in.

Two gaps carried forward from 1b, still out of scope: Memory Options (Omen of Knowledge's
pick-and-swap feature list) is folded into that feature's prose rather than modeled as its own
effect type — no other subclass needs that shape yet, and almost none of the existing 52
features feed derived stats either. And the "Memoriam"-only omen (Strife) 18th-level gap is
recorded in the errata table above, not invented.

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
