# Changelog

Notable changes to the **Sina Una Character Creator**, newest first.

No formal versioning — this is a personal-use tool for one table, not a released product.
Dates are the day the work landed.

---

## 2026-08-25

### Added

- **Save your character.** The builder now remembers everything you've picked, on this device,
  and restores it when you come back. The Sheet step has a "Create new character" button
  (with a confirmation) to start over.
- **Three ways to save the sheet**, because no single one works everywhere:
  - **Android / Mac / PC** — prints the sheet through your browser's Save-as-PDF. Best output.
  - **iOS** — iOS can't print this sheet at all (Safari renders the preview, then blanks it,
    and offers no Save-as-PDF destination), so this route photographs the sheet into a PDF
    instead. Looks identical to the printed one; larger file, text is an image.
  - **Other devices** — a small, selectable, searchable vector PDF as a fallback.

  On iOS the file is handed to the share sheet, so "Save to Files" is one tap. Downloading the
  raw HTML sheet is still there as a quieter fourth option.
- **The five Strixhaven spells** — Silvery Barbs, Borrowed Knowledge, Kinetic Jaunt, Vortex
  Warp, Wither and Bloom. The book's whole set, all level 1–2. Each spell list now says which
  book a spell comes from, and the printed sheet marks Sina Una spells `*` and Strixhaven `†`.
- **Spell level and upcasting in every spell table.** A `Lvl` column: `C` for a cantrip,
  otherwise the number, with a `+` when a higher slot does more. The "At Higher Levels" text was
  missing from all 198 Player's Handbook spells — it was never pulled in the original import —
  and has been added for the 67 that have it.
- **Ancestry spells now appear as spells.** Blessing of Haliya, Drow Magic, Infernal Legacy,
  Spirit of Nature, Ancestral Protection, Natural Craftsmanship and Natural Illusionist granted
  spells that existed only as buried trait prose. They get their own section with full stats,
  including for characters with no spellcasting of their own — a Balat-Kayo fighter, say. Where
  the book names no spellcasting ability (Balete Elf, Mangrove Halfling), the save DC prints
  blank and says so, rather than guessing.

### Fixed

- **Hill Dwarf and Mountain Dwarf weren't getting their traits.** Hill Dwarf's +1 hit point per
  level and Mountain Dwarf's medium-armour proficiency were silently dropped — the code that
  applies these read subclasses only, never ancestries. Both work now.
- **Drow was granting a spell too many** — its three fixed spells plus a free extra cantrip.
- **Volcano Dwarf's Molten Armor** was missing from the Actions list. It costs a bonus action.
- **Printing on mobile Safari.** The sheet is printed through a hidden, correctly sized frame
  rather than a pop-up tab, which iOS wouldn't reliably print, and which printed a squished
  layout when it did.
- **The printed sheet is A4 end to end**, so the on-screen measure and the printed one match
  and nothing reflows when you print.
- **No more date/title/URL stamped across your printed sheet.** That's the browser's own
  header — no page can switch it off, but Chromium drops it when the page margin is too small
  to hold it, so the margin is now split between the page and the sheet body. Content width is
  unchanged.
- **Reaction spells no longer break the spell table.** Shield, Counterspell, Feather Fall,
  Hellish Rebuke, Silvery Barbs, Apolaki's Light and False Self carry their trigger inside the
  casting time ("1 reaction, which you take when…"), which wrapped to ten lines in a narrow
  column. The column shows "1 reaction" and the trigger is shown beside the description.
- **Proficiency circles rendered smaller on Windows.** They were text characters, drawn by
  whatever font the OS fell back to. They're drawn shapes now, same size everywhere.
- Cloudflare deployment config fixed after the dashboard picked the project up as a Workers
  build rather than a Pages one.

### Changed

- **The desktop column is wider** — 660px to 800px. Narrow screens are unchanged.
- **The three save buttons are stacked, full-width, one colour each** (gold, jade, slate), in
  one box. Which platform you're on decides the route, so no one of them is "the" button.
- **The action list is called "Other Actions"** in the app and on the sheet. It was "Class
  Actions", which misled the moment an ancestry trait turned up in it, then plain "Actions",
  which sat confusingly next to the "Actions in Combat" panel.
- Ritual and concentration tags shortened to `R` and `C` in the app's spell list, so long spell
  names stay on one line. The printed sheet keeps the full words.
- The wizard scrolls to the top when you advance a step, so the step rail is visible on mobile.

---

## 2026-08-24

### Added

- **The Babaylan and Headhunter classes.** Sina Una's own two classes, neither previously in
  the app — full chassis for levels 1–5, plus all 6 subclasses (3 Babaylan Callings, 3
  Headhunter Omens) with feature text through level 20, transcribed by reading the book.
- **Sina Una's weapons and armour** — 18 weapons and 6 armour rows from the book's own tables,
  which were missing even though backgrounds already referenced some by name.
- **An attack table.** Every weapon you're carrying, with attack bonus, damage and properties,
  plus Unarmed Strike. In the app and on the printed sheet.
- **An Inventory step** — weapons, armour, gear, tools and starting gold in one place.
- **A spell table** replacing the old plain list: Name / Time / Range / Hit-DC / Effect / Notes
  per spell, with the full description underneath. The printed sheet gets a compact version.
- **Weapon Mastery (2024), opt-in and off by default.** A toggle on the attack table that shows
  each weapon's 2024 mastery property as an informational note. It never affects any derived
  stat — the rest of the app is 2014 rules throughout.
- **Full rules text for all 198 Player's Handbook spells** (levels 0–3), replacing a placeholder
  that just said to look it up in the book.
- **Full rules text for all 12 Sina Una subclasses** — 52 features across levels 1–20 — replacing
  "Full text on p.N of the source."
- **Core class features for all 12 PHB classes.** There were none at all before this: no Rage,
  no Sneak Attack, no Bardic Inspiration, no Extra Attack, no Fighting Style. 65 features across
  levels 1–5, with Fighting Style, Metamagic and Pact Boon options resolved inline.
- **An Actions / Bonus Actions / Reactions panel** — the mid-turn quick-reference list, grouped
  by what each thing costs to use, in the app and on the sheet. Each feature was tagged by
  reading its text, not by pattern-matching.
- **Passive Investigation and Passive Insight**, alongside Passive Perception.
- **One-click Print / Save as PDF**, replacing a download-then-open-then-print detour.
- Cloudflare Pages deployment setup: pinned Node version, asset caching rules, build config.

### Fixed

- **White screen on load** (`Cannot access 'hitPoints' before initialization`) — a block was
  being built before something it depended on existed.
- **PHB spells printed without descriptions** on the exported sheet even after the full text
  landed in the app, because the export still had the old placeholder branch.
- **Name field overflowed its panel**, showing a stray line underneath — a missing
  `box-sizing: border-box`, now reset app-wide so it can't resurface.
- The purchased-book PDFs and extraction scratch files are now properly gitignored — they were
  untracked but not ignored, one `git add .` away from landing in a public repo.

### Changed

- **Ability scores lead with the modifier**, the number you actually add to rolls, with the raw
  score small underneath — the way a physical sheet's ability box reads.
- **HP, AC, Initiative and Speed promoted to a four-tile band** in the Defenses step and on the
  sheet. Three of the four used to be buried in a list at the bottom of the step.
