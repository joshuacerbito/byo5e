# Bring Your Own 5e

A web-based D&D 5e character builder. Ships **SRD content only** — SRD 5.1 (2014) and SRD 5.2
(2024), both CC-BY-4.0 — with the edition selectable at character creation. User-supplied content
packs arrive later.

---

## Architecture — four layers

```
5etools-src/            gitignored checkout, development input, never shipped
   │
   │  scripts/build-srd-pack.mjs          ← Pack Generator
   ▼
src/packs/*.json        generated, committed, 5etools-shaped records + envelope
   │
   │  src/content/                        ← Mapper ("back-end")
   ▼
view models             plain objects — no {@tag}, no pipe strings, no entry trees
   │
   │  src/rules/                          ← edition-independent 5e arithmetic
   ▼
src/ui/*, src/sheet/*   ← step components and export renderers
```

**Mapper** (`src/content/`) is the only layer that knows 5etools shape. It loads packs, indexes
records, resolves pipe-string references, strips `{@tag}` markup, and normalises edition
differences. Output is the contract: named fields, no markup, no positional tuples, no entry
trees except pre-structured `blocks`.

**Rules** (`src/rules/`) — ability modifiers, proficiency bonus, AC formulas, attack and damage
bonuses, spell save DC, slot counts. Reads view models, produces numbers. Takes edition as an
argument where the two SRDs disagree arithmetically; never branches on a pack id.

**UI** (`src/ui/`, `src/sheet/`) renders view models. Holds no lookup tables, no source
literals, no level constants.

---

## Non-negotiables

**Filter, don't validate.** Illegal options are never rendered. No red error text, no "you
already have this" warnings. An invalid character must be unrepresentable, not merely flagged.

There is exactly **one deliberate exception**: a fixed-skill background that collides with an
already-chosen class skill. That collision depends on choices made two steps earlier, so it is
surfaced with a struck-through duplicate and a "Change class skills" link rather than filtered.

---

## File layout

```
index.html
pdftest.html              harness for `npm run check:export` — not a build entry
vite.config.js
wrangler.toml             pages_build_output_dir for `wrangler pages deploy`
public/_headers           Cloudflare Pages cache rules — copied into dist/ by Vite
scripts/
  build-srd-pack.mjs      generates src/packs/*.json from 5etools-src
  check.mjs               static + import-resolution checks — run after every edit
  check-content.mjs       drives packs through mapper, verifies view-model shapes
  check-exports.mjs       headless-browser check of the iOS raster export
  build-pdf-fonts.sh      regenerates src/pdf/vfsFonts.js (python3 + fonttools)
  lib/
    fivetools-srd.mjs     5etools tag stripping + entry flattening (build-time only)
src/
  main.jsx                entry point — mounts stylesheet + outer error boundary
  CharacterCreator.jsx    root component: state, derivation, step rendering
  styles.js               all CSS as one exported template string
  packs/
    srd-5.1.json          GENERATED — SRD 5.1 (2014), CC-BY-4.0
    srd-5.2.json          GENERATED — SRD 5.2 (2024), CC-BY-4.0
  content/
    index.js              buildContent(pack) — pure entry point, no imports of its own
    registry.js           indexed pack; resolveRef / resolveItem / resolveCode
    entries.js            stripTags, entriesText, toBlocks, flatten
    refs.js               pipe-string parsers and key functions (mirrored from scripts/)
    features.js           toFeature, entryToFeature → FeatureView
    classes.js            buildClasses → ClassView + SubclassView
    ancestry.js           buildAncestries → AncestryView
    backgrounds.js        buildBackgrounds → BackgroundView
    spells.js             buildSpells → SpellView
    items.js              buildItems → WeaponView / ArmorView / GearView
    feats.js              buildFeats → FeatView
    options.js            buildOptions → OptionView
    rules.js              buildSkills / buildConditions / buildLanguages
    additionalSpells.js   normAdditionalSpells
    equipment.js          normClassEquipment
    prof.js               normArmorProf / normWeaponProf / normSkills
    ids.js                slugify, idMinter
    prereq.js             normPrereq
    load.js               loadPack(edition) — async wrapper for the browser
  rules/
    mod.js                ability modifier, proficiency bonus, spell DC, ...
  components/
    Rule.jsx              group divider — hairline + batok chevron
    SpellTableRow.jsx     one selectable spell, table-row layout
    SheetSummary.jsx      whole printed sheet rendered in app styling
    ErrorBoundary.jsx     crash fallback — rescue the save, or reset
  lib/
    storage.js            STORAGE_KEY, load/save/clear, .json export envelope
    derive.js             legacy derive helpers (being replaced by src/rules/)
    steps.js              step list, buildSteps
    sheetHtml.js          buildSheetHTML(ctx, {interactive}) — standalone A4 HTML sheet
  pdf/
    sheetRaster.js        HTML sheet → A4 PDF via html2canvas + jsPDF — iOS route
    sheetPdf.js           pdfmake vector PDF — fallback route
    saveFile.js           share-sheet-or-download + sheetFileName(), shared by both
    vfsFonts.js           GENERATED — base64 Fraunces/Karla subsets for pdfmake
  data/                   LEGACY — being replaced by src/packs/ + src/content/
```

`buildSheetHTML` takes an explicit `sheetCtx` object assembled in the root component. A field
added to the sheet must go into that object — missing fields are `undefined`, not thrown.

`SheetSummary.jsx` renders every section the printed sheet carries, from the same `sheetCtx`.
That shared input is the point: a field missing from the summary is missing from the file, so
the two cannot drift.

**Two error boundaries, and the fallback rescues the save.** `ErrorBoundary.jsx` is mounted
twice: once in `main.jsx` around the whole app, once around the wizard body (keyed on step name,
so moving away clears it). The fallback offers a raw download of the localStorage save *before*
it offers the reset — the failure mode was a character whose saved state crashed the app on every
load, leaving "clear site data" as the only way back. That is also why `main.jsx` mounts
`<style>` rather than the root component: the crash screen needs the stylesheet from above the
thing that might fail.

---

## Export

Three buttons; no single route works everywhere. All three read the same `sheetCtx` object.

| Button | Route | Why |
|---|---|---|
| Save (Android/Mac/PC) | `printSheet()` — `buildSheetHTML()` in hidden iframe, `window.print()` | Best output; those platforms' print dialogs offer Save as PDF |
| Save (iOS) | `saveSheetRasterPDF()` — `sheetRaster.js`, html2canvas + jsPDF | iOS Safari blanks the print preview; no Save as PDF destination |
| Save (other devices) | `saveSheetPDF()` — `sheetPdf.js`, pdfmake | Vector fallback: small, selectable, searchable |

A fourth quieter link downloads the raw `.html` for hand-editing.

**The print route.** Sheet is A4: body 210mm wide, 14mm padding (182mm measure), iframe
794×1123px (210×297mm at 96dpi). The 14mm splits in print: `@page` takes 6mm, body takes 8mm.
Chromium drops its date/title/URL headers below 9mm page margin; 6mm leaves headroom. Side
margins hold on every page; interior pages get only the `@page` margin at top and bottom.

`printSheet()` swaps `document.title` to the character name for the dialog duration — macOS
Safari reads the host page's title, not the iframe's. It restores from `APP_TITLE`, captured at
module load, so a second print started before the first dialog closes cannot leave the title
stuck.

**The raster route (iOS).** Captures `buildSheetHTML()` block-by-block, not as one tall
screenshot, so page breaks land between sections. The iframe must wait for `complete` AND
populated — `load` fires for the initial `about:blank`. Skills list is a two-track grid rather
than `column-count` (html2canvas does not render `column-count`).

**The vector route.** pdfmake layout differs from the HTML sheet — no `break-inside` — so
section boxes become heading + hairline. Body text is left-aligned (pdfmake does not
hyphenate). `vfsFonts.js` is generated: `scripts/build-pdf-fonts.sh` (needs
`python3 -m pip install fonttools brotli`) instances variable font axes to static TTFs, subsets
to Latin + punctuation, and base64-encodes them.

**Delivery.** `saveFile.js` hands the file to `navigator.share({ files })` where available
(iOS "Save to Files"), falls back to an `application/octet-stream` anchor download (Safari will
not inline it). `navigator.share` needs transient user activation — nothing may be awaited
before the render. `sheetFileName(name, ext)` keeps Unicode letters, digits, spaces, hyphens
and underscores; drops everything else; falls back to `Unnamed`.

**Both PDF paths lazy.** pdfmake, fonts, html2canvas and jsPDF are `import()`ed on first use.

**Verifying it.** `npm run check:export` drives headless Chromium (set `BROWSER=` to override)
over CDP, runs the raster export against a fixture, asserts the result is a multi-page A4 PDF
that is not blank. `--keep` prints where the file landed.

---

## Deployment — Cloudflare Pages

Static build — `npm run build` outputs `dist/`, that is the whole deploy.

- Build command `npm run build` · Output directory `dist` · Node version pinned by `.node-version` (20)
- `wrangler.toml` sets `pages_build_output_dir` for CLI deploys; the dashboard's build-settings
  fields override it for git-connected builds — keep them in sync
- `public/_headers`: hashed assets under `/assets/*` get a one-year immutable cache;
  `index.html` gets `must-revalidate` so a new deploy is picked up on next load
- No router — one `index.html`, no client-side routes — so no `_redirects` is needed
- `5etools-src/` gitignored (~550MB 5etools data checkout, dev input only); never imported
  from `src/`, never enters the bundle or git history Cloudflare builds from

---

## Working practice

**Verify with a tool, not by eye.**

```bash
npm install
npm run check          # after every edit
npm run check:content  # after any src/content/ or src/packs/ change
npm run dev
```

`npm run check` parses every module, verifies cross-module imports resolve to real exports,
finds identifiers used without being declared, confirms every `className` has a matching CSS
rule (and lists dead ones), and checks data cross-references.

`npm run check:content` builds view models from both SRD packs, reports dangling references by
kind, and scans every view-model field for surviving `{@tag}` markup or pipe strings. Expected
dangling-ref counts are declared in the script — a deviation is a finding, not a failure.

---

## Design

Dark UI — working tool on a phone at a table; dark ground keeps numbers legible.

- Ground `#0B1622`, surfaces `#132436` / `#1B3145`, hairlines `#26445F`
- Gold `#D4A537` active state and key numbers · jade `#3FA98A` completion · coral `#D9502F` warnings only
- Fraunces (display), Karla (body), JetBrains Mono (all numbers)
- Batok chevrons: step rail + `<Rule />` group divider (hairline gradient + centred chevron)
- Spell metadata and description are separate `display:block` spans — inline runs metadata into
  description text
