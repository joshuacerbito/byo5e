# Changelog

Notable changes to **Bring Your Own 5e**, newest first.

No formal versioning — this is a personal-use tool for one table, not a released product.
Dates are the day the work landed.

---

## 2026-09-02

Everything below is the Class step. Two features were built (Weapon Mastery, collapsible
sections), one panel was redesigned in stages (Core Traits), and a level 1-20 QA sweep
across both SRD editions turned up the fixes at the bottom.

### Added

- **Weapon Mastery (2024 rules), built from nothing** — the app previously printed every
  carried weapon's mastery property unconditionally, ignoring the 2/3/4 (Barbarian) or
  3/4/5/6 (Fighter) cap entirely. It is now a real, tracked choice:
  `weaponMasteryFromTable()` (`src/content/classes.js`) parses the class table's own
  "Weapon Mastery" column into a per-level count, and a new `MasteryPicker.jsx` offers a
  search-to-add field (the pool is the whole weapon list, so a toggle grid like Skills
  would have been a wall of buttons) with removable chips. `stepComplete("Class")` waits
  on it, and a weapon's "Mastery:" note on the sheet now appears only for weapons you
  actually mastered.
- Mastery is picked by weapon **type**, not by item: a `+2 Greatsword` shares the mundane
  Greatsword's mastery property, so mastering "Greatsword" covers every variant and the
  search returns one row instead of four. The link comes from `baseItemName`, written by
  the pack generator's variant expansion (`scripts/build-srd-pack.mjs`) where the base
  name is already known, rather than parsing "+N " back out of a display string.
- The picker is **split by level**: Core Traits asks only for the level 1 baseline, and
  each later level whose count rises (Barbarian 4/10, Fighter 4/10/16) gets its own
  bracket inside that level's own panel, asking only for the difference. Each bracket
  owns its own search state and shows only its own chips.
- **Multiclass entries earn their own Weapon Mastery.** A secondary class reads its own
  table at its own class level — a level 1 Rogue dipped into from Fighter 5 gets the
  Rogue table's row 1, not row 5 — into per-entry picks kept separate from the primary
  class's, because the slots are. Eligibility stays character-wide, since mastery
  requires proficiency and proficiency belongs to the character.
- **Collapsible sections on the Class step** (`src/components/Section.jsx`). A chevron in
  any section header shuts that section; Show More / Show Less at the foot of a long one
  is the same switch, reachable from the end you actually scrolled to. Collapsing strips
  a section back to its **headings** — a shut "Level 1" still reads Rage / Unarmored
  Defense / Weapon Mastery, and shut Core Traits still lists Primary Ability through
  Starting Equipment without their values — because a bar reading nothing but "Level 1"
  is a worse table of contents than the panel it replaced.
- A control that still **owes you a pick** survives the collapse (`byo-live`): the skill
  grid while skills are short, an option group under budget, the ASI feat pool on either
  tab, the mastery search. Shutting a section by mistake can't strand a pick you can no
  longer make. The marker comes off the moment the pick lands, so a finished section
  shuts flat, warning flag and all.
- **The class grid collapses to the class you picked**, under a "Change class" chip.
  Eleven rejected cards sat on top of a step that keeps growing. Clicking the selected
  card toggles the grid too, so there are two ways back; the selected card never re-picks
  itself, which would have reset that class's skill and option picks.

### Changed

- **Core Traits**, redesigned in stages into the layout the books and D&D Beyond use: the
  Class step's opening panel is now a collapsible header carrying the number of choices
  the section asks for, an "As a Level 1 Character" preamble, and a two-column traits
  table. Along the way it absorbed the separate Proficiencies panel, gained the class's
  primary ability, and lost three duplications — the skill pool printed both in the table
  and in the picker below it, the header's redundant "N to go" badge, and a table caption
  that repeated the section header directly above it.
- The table is **descriptive only**; the pickers sit below it under a rule, so everything
  above the line is reference and everything below it is the step.
- `primaryAbility` is **backfilled for SRD 5.1**. 5etools never encoded it for 2014
  classes at all (not something our generator was dropping), and both editions assign the
  same abilities, so `build-srd-pack.mjs` fills it in by class name. A new
  `primaryAbilityGroups` keeps 5etools' un-flattened shape, where a group with two keys
  means AND — so Monk reads "Dexterity and Wisdom", not "Dexterity or Wisdom".
- The **subclass panel now sits next to the level that earns it** instead of at the top of
  the step, where it put a choice you may not be able to make yet ahead of the traits you
  get immediately. The level is read from the pack, never hardcoded: 2024 unified every
  class on 3, but 2014 has Clerics, Sorcerers and Warlocks choosing at 1 and Wizards at 2.
- **Multiclass tabs collapse like the primary one.** Subclass, Skills and Proficiencies
  gained had been plain boxes with no chevron next to collapsible level panels. The class
  header card stays chevron-less on purpose — the primary tab's is the same, and
  everything in one is a control a collapse would leave standing anyway.
- Nothing on the page starts with its text hidden. Sections already defaulted open;
  Show More used to arrive clamped, so a level's features loaded half concealed. Every
  collapse on this page is now something the reader did on purpose.

### Fixed

- **Picking a Paladin or a Ranger at level 1 crashed the whole Character Creator** to its
  error boundary ("Cannot read properties of undefined (reading 'length')"). Their table
  has no spell slots until level 2, so casting came back as a pending stub and
  `highestSlot` read `.slots.length` off it without checking. The empty array is now
  carried on the stub itself, since every other consumer checks and a later reader would
  have hit the same edge.
- **The 2024 Warlock showed two Eldritch Invocation pickers side by side**, one of them
  claiming a budget of 1 where the class table says 5. The 2024 pack carries both an
  "Eldritch Invocations" progression and an "Eldritch Invocation Options" feature that
  lists the whole catalogue, and the dedup compared their names, which never matched.
  Sameness is decided on the option pools now, and the progression's count — the one the
  class table actually prints — wins. 5.1's Warlock legitimately has two choices (Pact
  Boon and Invocations) and still shows both.
- **Paladins, Rangers and Rogues could not pick their mastered weapons at all**, on any
  tab. Only Barbarian and Fighter print a Weapon Mastery table column, because only their
  count grows; the other three get a flat two stated in the feature's prose, so reading
  only the column left all three showing "you can use the mastery properties of two kinds
  of weapons of your choice" with no way to choose them. The count now falls back to the
  feature's own text.
- Every mastery picker was rendering the chips for the **whole** pick list rather than its
  own bracket, so filling the base 3 and a level 4 bonus showed all 4 chips in both
  sections. Each bracket now shows only its own slice, and removal works from whichever
  section shows the chip.
- The mastery chips rendered outside the picker's own bordered box, so they read as part
  of the Skills picker above them; and a level 4 panel's ASI content sat against the
  merged-in Weapon Mastery subsection with no divider. Both now use the same rule-and-gap
  treatment every other subsection on the step already had.
- A mastery bump rendered as its own standalone panel stacked above the level box that
  granted it; it is now inside that box, alongside Ability Score Improvement.
- 2014 starting equipment ran its choices together — "...or (b) a dagger (a) a component
  pouch..." — because those packs carry one prose line per choice and we joined on a
  space. They join on a middle dot now. 2024 packs carry structured groups and were
  already fine.

---

## 2026-08-31

### Added

- **A mobile-friendly `/sheet` character-sheet route** (`src/components/Sheet.jsx`, new
  `Drawer.jsx` slide-up panel) — a dedicated at-the-table view of a finished character,
  separate from the in-wizard Summary step, built for a phone screen rather than the
  desktop-oriented creator flow.
- The Summary step's combat panels are now shared components instead of living only in
  `SheetSummary.jsx`: `ActionsPanel.jsx` (the tabbed Attacks/Spells/Bonus Actions/
  Reactions/Other Actions panel) and `FeaturesPanel.jsx` (Class Features/Ancestry Traits/
  Feats/Background) are used by both the Summary step and the new `/sheet` route, so the
  two stay in sync instead of drifting.
- `ActionsPanel`'s Spells tab now segments spells into **Cantrips**, **Leveled Spells**,
  and **Limited Spells** (anything with a `use` cadence, e.g. an ancestry-granted spell
  that's 1/long rest) instead of one flat list — and the Bonus Actions/Reactions tabs
  get their own sublists (Class Features / Spells / Other) with each entry's source
  labeled, so a bonus action like a Barbarian's Rage sits clearly apart from a bonus-
  action spell.
- Class/subclass features that carry no structured action-economy field in the SRD pack
  (most of them — only ancestry traits do) are now sniffed for "as a bonus action" /
  "as a reaction" in their own text (`inferActionBucket`, `src/lib/derive.js`) so they
  actually show up in the Bonus Actions/Reactions tabs instead of only ancestry traits
  ever appearing there. Multiclass features were also never being collected into the
  actions list at all — fixed alongside this.
- The Summary/`/sheet` "Class Features" panel is now its own section (renamed from
  "Features"), tabbed per class when multiclassing, and every panel section heading
  across the Summary step is now consistently title-cased via CSS rather than
  case-by-case JSX text.
- New small supporting pieces: `DamageType.jsx` (damage-type tag styling), `Accordion.jsx`
  (collapsible section shell used by the new `/sheet` route), `content/basicActions.js`
  (the standard 5e actions — Dash, Dodge, Help, etc. — for the Other Actions tab), and
  `lib/sheetEntries.js` (shared row-building helpers for `ActionsPanel`/`FeaturesPanel`).

### Fixed

- The Summary step's identity line no longer shows a class's subclass twice (it was
  already baked into `classLabel`, e.g. "Fighter 3 (Champion)", and appended again
  separately) or the character's background (e.g. "Soldier") — background already has
  its own dedicated panel below.
- Spell rows granted with a choice-shaped ability (2024 lineages like Tiefling's
  Fiendish Legacy, where the ability is `{choose: [...]}` rather than a fixed string)
  now resolve to a real ability instead of `null` — this was showing as a literal
  `"+null"` Hit/DC on the granted spell (e.g. Fire Bolt from Tiefling). Spell name/source
  rendering was also fixed where it was concatenating with no separator ("Thaumaturgy
  Tiefling") and printing a cadence outside of parentheses ("Darkness Tiefling — 1/long
  rest" instead of "Darkness — Tiefling (1/long rest)").
- A `.byo-vitals` class name collision between the Summary step and the new `/sheet`
  route was making one restyle the other unintentionally — scoped apart.
- `ancestry.resist` printed the literal string `"[object Object]"` for choice-shaped
  resistances (a race that lets you pick your resistance, e.g. Dragonborn's breath-
  weapon-linked damage type or Tiefling) instead of the resistance's actual name.
- An inline `gridTemplateColumns` style was silently overriding the panel grid's own
  media-query breakpoints — removed so the responsive layout rules actually apply.

## 2026-08-27

### Added

- **Magic item bonuses that actually apply.** Rings/Cloaks of Protection and similar flat-bonus
  items now add to AC and saving throws for real, instead of just printing as inventory text —
  a small hand-authored overlay (`src/content/itemEffectsOverlay.js`) covers the common
  worn/attuned items whose bonus is a flat number the raw pack doesn't already encode.
- **Wands, staves and other spell-granting items show what they actually cast** — charges,
  recharge, and the spells they carry, read straight from the pack (wands/potions already encode
  this mechanically; no hand-authoring needed there, unlike the flat-bonus items above).
- **Currency formatting is one shared helper** (`src/lib/currency.js`) instead of copy-pasted
  across the app and all three sheet renderers.
- Google sign-in groundwork: `@supabase/supabase-js` added, `src/lib/sync.js` handles session
  tracking, Google OAuth, and pushing a character to Supabase while signed in. The sign-in button
  itself is hidden for now (`AUTH_UI_ENABLED = false` in `CharacterCreator.jsx`) — the schema
  underneath is mid-migration from one character per account to up to three, and the code hasn't
  caught up to that shape yet. Nothing here is reachable from the UI until it does.

### Changed

- `CLAUDE.md` is no longer tracked in git — stays on disk for local tooling, isn't published to
  the repo going forward.
- Free-tier character limit is now **2**, not three as earlier planning docs said — paid
  membership (not built yet) is what unlocks more slots. Account page groundwork for this is
  planned/in progress alongside the Google sign-in work above.

## 2026-08-26 (even later)

### Added

- **The step rail is clickable.** Every step is now a numbered button — jump straight to any
  step that's actually open to you, not just Back/Next one at a time. A step only locks when it
  truly can't render without something earlier (Defenses, Inventory and Sheet need a species
  picked; Spells needs a spellcasting class); Class, Abilities, Background and Advancement never
  needed the others done first and are open as soon as an edition's picked. Hovering a locked
  step's number shows what it's waiting on.

### Changed

- **The rail is wider and always one line.** Numbers replace the old chevron arrows, labels are
  always visible instead of only on the current step, and the page itself grows with the window
  on desktop instead of staying pinned to a phone-width column — the rail scrolls sideways on a
  narrow screen rather than wrapping into a tall stack.
- **Downloads are disabled until every step is finished.** All five sheet/character exports
  (three PDF routes, the raw HTML, the .json) refuse to run with a step still open, with a note
  pointing back at the rail.

### Fixed

- **A step could look "done" (jade) before you'd ever visited it.** Steps with no completeness
  rule of their own — Advancement at level 1, Defenses, Inventory, Sheet — used to fall through
  to "always complete," so the rail painted them jade from the very first screen while still
  correctly refusing to let you click them. Now a step only counts as done once you've actually
  reached it.

## 2026-08-26

### Changed

- **SRD only, both editions.** The character creator now builds exclusively from the SRD 5.1
  (2014) and SRD 5.2 (2024) content packs — no Sina Una, no Handbook, no Xanathar's, Tasha's or
  Strixhaven anywhere in the app. That's also what was showing Sina Una subclasses next to PHB
  ones in the Class step: the old build never filtered by source at all. `CharacterCreator.jsx`
  and the three sheet exporters now read from `src/content/` + `src/rules/` instead of
  `src/data/`, which is deleted along with the four `extract-*.mjs` scripts that fed it.
- **Levels 1–20**, not 1–5. New Advancement step: an Ability Score Improvement or a feat at every
  level a class actually grants one (both editions' own rules, not a hardcoded level 4).
- **"Bring Your Own 5e" is now the page's most prominent text** — a big gold headline, with "Make
  a character" demoted to a subline underneath. It used to be a 10px eyebrow above that headline.

### Added

- **Edition picker**, first step: SRD 5.1 (2014 rules) or SRD 5.2 (2024 rules).
- Generic pickers for Fighting Style, Metamagic, Eldritch Invocations and Pact Boon, driven off
  content rather than hardcoded per class.
- 2024's background ability-score choice and granted Origin feat.
- Real 2024 weapon mastery text on the Attacks table (informational; SRD 5.1 weapons carry none).

### Known gaps

- Subclass-granted spellcasting (Eldritch Knight, Arcane Trickster) isn't in the content layer
  yet — those subclasses build as non-casters; their feature text still prints in full.
- No hand-authored effects overlay exists yet, so subclass-granted AC formulas, bonus skills,
  resistances etc. aren't interactive — the book's prose still prints, nothing is invented.
- 2024 language selection ("Common + 2 of your choice") isn't wired up.

## 2026-08-26 (later)

### Changed

- Step order is now Species/Race, Class, Abilities, Background — ancestry and class come first
  since they drive what abilities matter, and the ancestry step is renamed "Species/Race" to
  match 2024 wording without losing the 2014 sense.
- The Edition selector — and every other in-step selector — no longer jumps to the next step on
  pick. Only **Next**/**Previous** move the wizard forward or back.
- **SRD 5.2 (2024 rules) is now the default and first-listed edition**, ahead of SRD 5.1. New
  characters start there; 5.1 is still one click away.
- Ancestry-granted "always prepared" spells (a Tiefling's Hellish Rebuke, a Cleric's domain
  spells, etc.) again show up as normal options in the Spells step, so a character can still
  choose the same spell the ordinary way. Grants that don't consume a spell slot now carry a
  cadence note ("1/long rest" and similar) in the Spellcasting table instead.

### Fixed

- **Crash when changing class after picking a subclass** — `Cannot access 'prereqCtx' before
  initialization`. One of the option-picker memos referenced a value declared later in the same
  function; it now builds its own prerequisite context from what's already in scope.
- **Prepared casters (Cleric, Druid, Paladin, Ranger in 2014; most classes in 2024) were only
  ever offered cantrips.** `preparedCount()` was reading a field name (`casting.prepared`) the
  content layer never writes; it reads `casting.preparedByLevel` now, for both the 2024 flat
  table and the 2014 formula shape.
- **Wizards had the same symptom for a different reason.** Wizards prepare from a spellbook, not
  a known/prepared list, and the Spells step's budget calculation never checked that field —
  budget came out 0, so the leveled-spell section never rendered. Fixed by including
  `casting.spellbook` in the budget.

## 2026-08-25 (last, again)

### Fixed

- **"Save on Android/Mac/PC" now suggests the character's name too.** The other export routes
  were fixed earlier the same day, but this one saves through the browser's own print dialog,
  which takes its filename from a page title rather than from anything the app hands it — and
  macOS Safari reads the app's title, not the sheet's, so every saved character came out called
  "Sina Una — Character Creator". The app now lends the print dialog the character's name and
  takes its own title back afterwards.

## 2026-08-25 (last)

### Changed

- **Saved sheets are named after the character.** Every download — both PDFs and the raw HTML —
  used to come out as `juan-dela-cruz-sheet.pdf`. It is now `Juan Dela Cruz.pdf`: the name as
  typed, with anything a filesystem would object to dropped and spare spaces tidied away. A
  folder of saved characters reads as a list of names. A name in any script survives; a blank
  one still saves as `Unnamed`.
- **The Sheet step's "Name" box is labelled "Character Name"**, which is what it always meant.

## 2026-08-25 (later still, again)

### Added

- **A backstory box.** The Sheet step now has a free-text field under the character's name for
  whoever they are, where they came from and why they left. It saves with the rest of the
  character and prints on every route — the HTML sheet, both PDFs and the plain-text copy —
  sitting after the Inventory, at the end of the character's own pages and before the Reference
  appendix, since it is the one section nobody looks up mid-turn. Blank lines start new
  paragraphs, so a few paragraphs stay a few paragraphs. Leave it empty and the section doesn't
  print at all.

## 2026-08-25 (content packs, phase 0)

Groundwork for content packs — the first phase of turning this into a builder that loads
whatever book you own, rather than one hardcoded to this campaign. Most of it is invisible
on purpose; the two things you can see are a new button and a screen you'd rather never meet.

### Added

- **Export your character as a `.json` file.** Every choice you made, as data rather than as a
  printout — it is the character, not a picture of one. The sheet exports are for reading at
  the table; this is the one to keep somewhere the browser can't clear. Loading a file back in
  is not built yet.
- **A crash screen that saves your character instead of eating it.** If the app hits an error
  it can't recover from, it now says so and offers a download of your saved character *before*
  it offers to start over. Previously a page-breaking error left a blank screen, and the only
  way back in was clearing site data — which took the character with it. Errors inside a single
  step are caught separately, so the header, the step rail and your ability scores stay put.

## 2026-08-25 (later still)

### Changed

- **Identical weapons are one row in the Attacks table**, the way they already were in the
  Inventory. A monk starts with ten darts and used to get ten separate Dart rows, each with
  the same to-hit and the same damage, pushing everything else off the page. It now reads
  `Dart ×10` on one line. Nothing about the numbers changes — copies of a weapon always had
  identical stats, so there was never anything to lose by collapsing them. The app, the
  printed sheet and both PDF routes all pick this up together.
- **The Sheet step's skills list is two columns**, the way it has always been on the printed
  sheet. Eighteen skills in one column meant scrolling past most of the character to reach
  Survival.
- **The save buttons moved below the sheet summary.** The step now reads as the character
  sheet first and what to do with it second: name, the whole sheet, then the three save
  buttons, then the plain-text copy. The line explaining that the file has no fixed page
  count went with the move — the summary above it is the explanation.

## 2026-08-25 (later)

Xanathar's Guide to Everything and Tasha's Cauldron of Everything, folded in. Both books
predate the 2024 revision, so all of this sits on the same 2014 chassis as the rest of the app —
none of it is an opt-in exception the way Weapon Mastery is. Magic items from both books are
deliberately out: this is a character builder.

### Added

- **59 more spells** — 46 from Xanathar's and 13 from Tasha's, levels 0–3. Every spell list now
  heads its groups by book, and the printed sheet marks island spells `*`, Xanathar's `‡`,
  Tasha's `§` and Strixhaven `†`.
- **57 more subclasses** — 31 from Xanathar's, 26 from Tasha's. Artificer's four are left out;
  there's no artificer here. Every one arrives with its full feature text.
- **Feature text for the 40 Player's Handbook subclasses.** They were names-only since the app
  was written — pick Champion and it told you nothing. Now every subclass in the app, all 115,
  carries the book's own words.
- **Feats, and the level-4 ability score improvement that was never wired up.** Every class gets
  one improvement at 4th level, the only one inside this campaign's range, and until now it was
  printed rules text that did nothing to your scores. You can now spend it as +2 to one ability,
  +1 to two, or a feat. 71 feats: the Handbook's 42, Xanathar's 15 racial ones, and 14 of
  Tasha's. Prerequisites filter the list rather than warning about it — an elf-only feat is
  simply not shown to a dwarf.
- **Variant Human's feat and free skill actually work now**, as does Half-Elf's Skill
  Versatility. All three were prose the app never acted on.
- **Tasha's optional class features**, behind a toggle on the Class step, off by default. Deft
  Explorer, Favored Foe, Steady Aim, Wild Companion, Harness Divine Power and the rest, plus
  Tasha's added fighting styles, metamagic, invocations and Battle Master maneuvers. The book
  calls these optional and several replace a feature you already have, hence the toggle.
- **The warlock's eldritch invocation list.** The feature text pointed at a list the app never
  carried. All of them are there now — the Handbook's and Xanathar's always, Tasha's with the
  toggle.
- **Extra skill picks from a subclass or ancestry are pickable.** College of Lore's three,
  Knowledge Domain's two, and one each from Order, Peace, Cavalier, Samurai, Arcane Archer and
  Fey Wanderer. The data for this existed; nothing ever read it.

### Changed

- **The Sheet step now shows the whole character**, not just a description of what the export
  will contain — every section the printed sheet has, in the app's own styling, with a rule
  before the plain-text box.
- **"Start over" is in the footer bar** on every step, anchored to the left with Back and Next
  paired on the right, so the destructive button isn't sitting among the step moves. Same
  confirmation as the one on the Sheet step.
- **The action list is called "Class + Ancestry Actions"** in the app and on the sheet, up from
  "Other Actions" — it collects class features, ancestry traits and subclass features, and now
  says so.

### Not included

- **Tasha's Custom Lineage** was built and then commented out before landing. It's in the data
  files behind comments if it's ever wanted. Note it is a standalone race in the book ("Instead
  of choosing one of the game's races…"), not a customisation applied to an existing one.
- **Customizing Your Origin** (Tasha's pp.7–8) — the variant that lets *any* race move its
  ability score increases around — isn't in. That's the rule most people mean by "the Tasha's
  race option", and it's a separate job.

### Fixed

- **Proficiency dots printed hollow.** Every filled dot on the sheet — saves and skills you're
  proficient in — was drawn with a background colour, and printers drop background colours
  unless you tick "Background graphics". They're drawn a different way now and print solid
  whatever that setting says.
- **Feats printed twice**, once in full on the sheet and again in the reference. The sheet now
  names the feat and points at the reference, the way the actions list already did.
- **Proficiencies a subclass grants now count.** A Hexblade's martial weapons and shields, a
  College of Valor bard's, Twilight Domain's — all of them were declared in the data and read by
  nothing, so the attack table gave you no proficiency bonus for them and the shield toggle
  never appeared.
- **A saved character built on content that later goes away no longer breaks the app.** It falls
  back to the first step instead of a blank screen.
- The printed vector PDF's action list was headed "Class actions" where every other route says
  "Other Actions" — the panel has always collected ancestry traits too.
- A subclass with no page number printed "p.undefined" in the text sheet.
- The text sheet's skill list left out skills picked from a subclass or ancestry grant.

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
- **The selection circles rendered smaller on Windows** — saving throws, skills and the spell
  picker. They were text characters, drawn at whatever size the OS's fallback font happened to
  use. They're drawn shapes now, one shared style everywhere, the same size on every platform.
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
