# Changelog

All notable changes to the Sina Una Character Creator, newest first. No formal versioning yet —
this is a personal-use tool, not a release.

## 2026-08-24

### Added

- **PHB spell descriptions.** All 198 PHB spells (levels 0-3) now carry full rules text —
  school, casting time, range, components, duration, ritual/concentration flags, description —
  sourced from `5etools-src/data/spells/spells-phb.json`. Previously `SpellRow` showed level
  only, with a placeholder ("Description not loaded — see the Player's Handbook.") for every
  PHB spell.
- **Sina Una subclass feature text.** All 12 Sina Una subclasses (52 features across levels
  1-20) now carry full rules text, transcribed by visual read of the source PDF (pp.176-196) —
  no OCR shortcuts, per the project's accuracy rule. Previously these were names and levels
  only; the appendix and printable sheet just said "Full text on p.N of the source."
- **Core class features for all 12 PHB classes.** `classes.js` had zero core class features
  before this — no Rage, Sneak Attack, Bardic Inspiration, Extra Attack, Fighting Style, any of
  it, for any class. Added 65 features (levels 1-5) from `5etools-src`'s class data, with
  Fighting Style / Metamagic / Pact Boon options resolved inline from `optionalfeatures.json`.
- **Actions / Bonus Actions / Reactions panel.** Feature tuples can now carry an explicit 4th
  "action" tag (`action` | `bonus` | `reaction` | `free`), hand-verified against each feature's
  actual text rather than pattern-matched. Powers a new "Actions" panel in the app (Defenses
  step) and a matching section in the printable sheet, grouped by bucket — the mid-turn
  quick-reference list, separate from the full feature writeups. Tagged 18 core class features,
  25 Sina Una subclass features, and 1 ancestry trait (Mangrove Halfling's Quick Thinker).
- **Passive Investigation and Passive Insight**, alongside the existing Passive Perception —
  generalized off the existing skill table so all three stay in sync with proficiency
  automatically.
- **One-click "Print / Save as PDF."** The app no longer runs inside an artifact's sandboxed
  iframe, so `window.print()` works directly now. `printSheet()` opens the sheet in a new tab
  and triggers the print dialog immediately — no more download-the-HTML-then-open-then-print
  detour. The old download-a-file flow is kept as a secondary option for anyone who wants the
  raw HTML (email to the DM, edit by hand, archive).
- **`plans/ability-score-improvement.md`** — implementation plan for the still-missing level-4
  ASI/feat picker (data model, UI placement, edge cases). Not implemented yet; every class's
  "Ability Score Improvement" feature currently renders as text only.
- Cloudflare Pages deployment scaffolding: `.node-version` (pins Node 20), `wrangler.toml`
  (`pages_build_output_dir`), `public/_headers` (immutable caching on hashed assets,
  must-revalidate on `index.html`), and a Deployment section in CLAUDE.md.

### Fixed

- **White-screen crash on load** (`Cannot access 'hitPoints' before initialization`) — `sheetCtx`
  was being built before the `hitPoints` `useMemo` it referenced was declared (a leftover from
  the sheet-context refactor). Reordered the two blocks.
- **PHB spells missing from the printed PDF's reference appendix.** The appendix builder still
  had the pre-full-text placeholder branch ("Full text in the Player's Handbook") even after PHB
  spell data grew full text — so the in-app spell list showed real descriptions but the exported
  sheet didn't. Unified the PHB and island-spell appendix branches, since both now carry the
  same fields.
- **Name field CSS overflow.** `.su-input` was missing `box-sizing: border-box`; text `<input>`
  elements default to `content-box` (unlike buttons), so its padding and border were adding on
  top of `width: 100%` and overflowing the panel, showing as a stray line under the box. Fixed
  the input directly and added a blanket `box-sizing: border-box` reset scoped to `.su-root *`
  so the same class of bug can't resurface elsewhere.
- Deleted stale `reference/phb_meta_1.js` / `phb_meta_2.js` (hand-written from model knowledge)
  now that real spell data comes from `5etools-src`.
- `.gitignore` now excludes `source/` (purchased-book PDFs + OCR passes, ~79MB) and `reference/`
  (extraction scratch), which were previously untracked-but-not-ignored — one `git add .` away
  from landing in a Cloudflare-connected repo. Also added `dist/` and `.DS_Store`.

### Changed

- **Ability score display now emphasizes the modifier over the raw score** — the number you
  actually add to rolls — in the sticky sidebar, the Abilities step, and the printable sheet's
  ability boxes. Matches how a physical character sheet's ability box reads (mod first, raw
  score small underneath).
- **HP, AC, Initiative, and Speed promoted to a 4-tile "vitals" band**, matching the visual
  weight AC alone used to get, in both the Defenses step and the printable sheet. Previously
  three of the four were buried in a plain "Also derived" row list at the bottom of the step.
