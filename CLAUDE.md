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
pdftest.html                harness page for `npm run check:export` — not a build entry
vite.config.js
wrangler.toml               pages_build_output_dir for `wrangler pages deploy`
public/_headers              Cloudflare Pages cache rules — copied into dist/ verbatim by Vite
scripts/check.mjs          static checks — run `npm run check` after every edit
scripts/check-exports.mjs  headless-browser check of the iOS raster export — `npm run check:export`
scripts/build-pdf-fonts.sh regenerates src/pdf/vfsFonts.js (needs python3 + fonttools)
scripts/lib/fivetools.mjs  shared 5etools extraction helpers (tag stripping, entry flattening)
scripts/extract-spells.mjs           regenerates src/data/{xge,tce}Spells.js
scripts/extract-subclasses.mjs       regenerates expandedSubclasses.js + phbSubclassText.js
scripts/extract-feats.mjs            regenerates src/data/feats.js
scripts/extract-optional-features.mjs  regenerates src/data/optionalFeatures.js
src/
  main.jsx                 entry point
  SinaUnaCreator.jsx       root component: state, derivation, step rendering (~1700 lines)
  styles.js                all CSS as one exported template string
  components/
    Rule.jsx               group divider — hairline + batok chevron
    SpellTableRow.jsx      one selectable spell, table-row layout (name/time/range/hit-DC/effect/notes)
  lib/
    derive.js              mod, fmt, attackBonus, isWeaponProficient, BASIC_ACTIONS, groupWeapons, parseStartingGold, recommendedSpread, resolveLineage, spellHitDC, spellEffect, spellMark(Notes), SOURCE_LABEL, CONTENT_SOURCES
    steps.js               step list, buildSteps, profBonus, SLOTS_THIRD
    sheetHtml.js           buildSheetHTML(ctx, {interactive}) — standalone A4 HTML sheet
  pdf/
    sheetRaster.js         the HTML sheet photographed into an A4 PDF — the iOS route
    sheetPdf.js            pdfmake vector PDF — the fallback route
    saveFile.js            share-sheet-or-download delivery, shared by both
    vfsFonts.js            GENERATED — base64 Fraunces/Karla subsets pdfmake embeds
  pdfTest.js               harness for npm run check:export (not a build entry)
  pdfTestFixture.js        fixed character it renders
  data/
    baseRaces.js           9 PHB base races
    lineages.js            22 lineages (7 Sina Una, 15 PHB)
    classes.js             CLASSES (incl. weaponProf, startingEquipment), ARMOR, ALL_SKILLS
    subclasses.js          18 Sina Una + 40 PHB
    backgrounds.js         6 Sina Una
    weapons.js             WEAPONS (37 PHB + 18 Sina Una), PROPERTY_LABELS, WEAPON_MASTERY_2024 (opt-in, see below)
    islandSpells.js        SPELLS, SPIRIT_TABLE, SPELL_LISTS
    phbSpells.js           198 PHB spells, levels 0-3
    sccSpells.js           5 Strixhaven (SCC) spells, levels 0-3 — the book's whole set
    xgeSpells.js           GENERATED — 46 Xanathar's (XGE) spells, levels 0-3
    tceSpells.js           GENERATED — 13 Tasha's (TCE) spells, levels 0-3
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

Every effect may carry `atLevel`. It defaults to the subclass unlock level for a subclass
effect and to 1 for a lineage effect. Collected in the `effects` memo, read via the `fx(type)`
helper. The memo used to collect subclass effects **only**, which silently dropped Hill Dwarf's
`hpPerLevel` and Mountain Dwarf's `armorProf` — the docs claimed lineage effects worked long
before they did. Both sources are folded in now; if you add an effect type, check it reads
sensibly from either.

Three Sina Una subclasses use it: Mentala (`acFormula`), Graverobber (`casting`, `dcBase: 10`),
and Omen of Swiftness (headhunter) (`casting`, third-caster from the cleric list — same shape
as the PHB's Eldritch Knight/Arcane Trickster).
Lineages use it too — Wood Elf `speed`, Drow `darkvision`, Hill Dwarf `hpPerLevel`,
Mountain Dwarf `armorProf`.
Twelve of the forty PHB subclasses carry effects.

**Ancestry spells.** A trait can grant spells outright — Balat-Kayo's Blessing of Haliya,
Drow Magic, Infernal Legacy, Balete Elf's Spirit of Nature, Umalagad's Ancestral Protection,
Mangrove Halfling's Natural Craftsmanship, Forest Gnome's Natural Illusionist. These hang off
the **trait**, not the lineage's `effects` array:

```js
{ name: "Blessing of Haliya", text: "…", ability: "cha", spells: [
  { name: "Alarm", atLevel: 1, use: "as a ritual, 1/long rest" }, … ] }
```

Trait-level is what makes replacement free: `resolveLineage` already filters base-race traits
through `replaces`, so Carabao Tiefling dropping Infernal Legacy drops its three spells with
it, no extra code. Spell stats are looked up by name in the ordinary spell data, so these rows
carry the same Lvl/Time/Range/Hit-DC/Effect columns as chosen spells. `ability` is the trait's
own spellcasting ability, which need not be the class's — and is deliberately absent where the
book never names one (see Outstanding work), in which case the DC column prints blank rather
than a guess.

They render in **their own section, never inside Spellcasting** — a Balat-Kayo fighter has these
and no spellcasting block at all, so nesting them there would hide them from exactly the
characters who most need reminding. Present in the app's Defenses step, all three export routes,
and the Reference appendix (they are not in `chosenSpells`, so nothing else would carry their
text). Note that High Elf's Cantrip stays a `bonusCantrips` effect: it is a free pick from the
wizard list, not a fixed spell. Drow Magic's was removed — its three spells are fixed, and the
effect would have handed out a fourth.

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
"Class + Ancestry Actions" — name only, grouped by bucket, each entry pointing at the section further down
that has the full text ("Abayan — See Babaylan features.") rather than repeating it up top,
which is why an earlier pass removed a fuller excerpt from here. It was headed "Class Actions"
until a Volcano Dwarf's Molten Armor turned up in it, which is an ancestry trait, not a class
feature — the panel has always collected all three sources. Plain "Actions" replaced that
briefly and was too general to mean anything next to the "Actions in Combat" panel; both the
panel and the printed section were headed "Other Actions" for a while, and are
"Class + Ancestry Actions" now — it collects class features, ancestry traits and subclass
features, and says so.

**Feats print once.** The sheet's Feats section is name + where it came from + "See Feats.",
pointing at the Reference appendix that carries the rules text — the same pattern as the actions
panel above, and for the same reason. The half-feat's +1 is called out on that line because it
is already folded into the ability strip at the top of the sheet, which nothing else reveals.

**Attack table.** The Actions panel also carries a weapon attack table, sitting above the
action-economy list. It's driven by `CLASSES[id].startingEquipment` (weapon choice groups +
fixed weapons, resolved via `equipmentChoices` state the same way `armorOptions` resolves
armor) and `CLASSES[id].weaponProf` (`{ categories, specific }`, checked by
`isWeaponProficient()` in `derive.js`). Weapon stats live in `src/data/weapons.js`
(`WEAPONS`, 37 PHB + 18 Sina Una weapons — one flat array, the app never distinguishes the two
sources downstream). Unarmed Strike (1 + Str mod, the 2014 damage — not 2024's d4) is
always listed. Rows are built from `groupWeapons(carriedWeapons)`, not the flat list, so a
monk's ten darts are one `Dart ×10` row rather than ten identical ones — same dedupe the
Inventory step uses. Background `equipment` stays prose-only, shown on the Background step — it was
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

**Spell level and upcasting.** Every spell table — app, HTML sheet, both PDF routes — carries a
`Lvl` column: `C` for a cantrip, otherwise the number, with a `+` when the spell does more from a
higher slot. The `+` reads a `higher` field holding the "At Higher Levels" text. That field is
new: the original PHB extraction pulled `entries` but not `entriesHigherLevel`, so all 198 PHB
spells shipped without their upcast rules. Re-pulled from 5etools-src for the 67 PHB spells that
have it, and note that `{@scaledamage 2d6|2-9|1d6}` renders as its **last** field (the per-slot
increment, "1d6"), not its first. The two SCC spells and six island spells that upcast had the
clause inline in `text`; it was moved out to `higher` so nothing is printed twice. The text shows
in the picker, in the Reference appendix, and nowhere in the compact tables — the `+` is the
pointer. Cantrip scaling ("at 5th, 11th, 17th level") is character-level, not slot-level, and
stays in `text` where it always was.

**Strixhaven spells.** `src/data/sccSpells.js` holds all five spells from *Strixhaven: A
Curriculum of Chaos* (SCC) — Silvery Barbs, Borrowed Knowledge, Kinetic Jaunt, Vortex Warp,
Wither and Bloom. Same shape as `phbSpells.js` (raw tuples + a combat-metadata map + a mapped
export), so the two pools concatenate; text and class eligibility pulled from 5etools-src
(`data/spells/spells-scc.json` and the `SCC` block of `data/spells/sources.json`, taking the
2014 `PHB`-source class entries, not the XPHB ones), not hand-guessed. All five are level 1–2,
so nothing was filtered out by the level-5 ceiling. It is **2014-compatible content, not 2024**
— SCC predates the revision — so this is an ordinary content add, not an exception like Weapon
Mastery. Artificer tags in the source data are dropped (no artificer in this app), and none of
the five is on the babaylan list (book p.224), so none carries the `y` code.

Provenance is the `src` field, which is what every downstream branch reads: `"phb"`, `"scc"`,
or absent for island spells. The Spells step heads each pool with its book ("Sina Una" /
"Player's Handbook" / "Strixhaven"), the appendix groups them the same way (island → Handbook →
Strixhaven), and the printed spell table marks island spells `*` and Strixhaven spells `†`.
Note that `availableSpells.phb` and `.scc` are deliberately separate lists rather than one
merged pool — the picker needs to head them separately. `BOOK_SPELLS` (top of
`SinaUnaCreator.jsx`) is the merged lookup list used by name-resolution helpers only.

**Xanathar's and Tasha's.** Both books are 2014 content — they predate the 2024 revision — so
they are ordinary content adds sitting on the same chassis as the Handbook, **not** opt-in
exceptions like Weapon Mastery. Magic items from both are deliberately absent: this is a
character builder. Everything is pulled from 5etools-src by the four `scripts/extract-*.mjs`
scripts, which share `scripts/lib/fivetools.mjs` (tag stripping, entry flattening, spell field
formatting). Those scripts are the source of truth for the generated files; hand-editing a
generated file is a mistake that survives exactly until the next run.

- **Spells** (`xgeSpells.js`, `tceSpells.js`) — same shape as `phbSpells.js`, `src: "xge"` /
  `"tce"`, class eligibility from `sources.json`'s 2014 `PHB`-source class entries. Neither
  book's spells are on the babaylan list (p.224 lists only Handbook and island spells), so none
  carries the `y` code.
- **Subclasses** (`expandedSubclasses.js`) — 57 records, each with the book's full feature text.
  `effects` is *not* in that file: it lives in `subclasses.js` as `EXPANDED_EFFECTS`, hand-
  authored and merged on, so regenerating never clobbers it. Only grants that map cleanly onto
  an existing effect type are modelled; fixed bonus cantrips, expanded spell lists, tool
  proficiencies, swim speeds and extra save proficiencies stay in the feature text, which is
  what the PHB subclasses already do with their own expanded spell lists.
- **PHB subclass text** (`phbSubclassText.js`) — the same pull, filling the gap that made
  picking Champion tell you nothing. Keyed `"level|Feature Name"` and merged onto `PHB_RAW` in
  `subclasses.js`, again so the hand-authored `effects` arrays are never in the script's way.
  Where 5etools files an option under a parent (Sacred Weapon under Channel Divinity) the
  extractor falls back to a flat index; warlock Expanded Spell Lists have no text in 5etools at
  all and are rebuilt from the structured `additionalSpells` field.

**Feats and the level-4 improvement.** `src/data/feats.js` holds 71 feats. The Handbook's 42 are
in alongside Xanathar's 15 and Tasha's 14 — a "feat instead of an ability score improvement"
choice offering only the two new books would be a stranger thing than having no feats at all.
Artificer Initiate is dropped (no artificer, same call the SCC pull made about artificer class
tags).

Prerequisites are **structured, not prose**, so the picker filters rather than warns — an
elf-only feat is never rendered for a dwarf, per the non-negotiable above. `prereq` carries
`abilities` (any one satisfies), `races` (`{ base, lineage }`, lineage null meaning any lineage
of that base), `small`, `spellcasting`, `armor`, `weapon`. A half-feat's +1 is the `ability`
field, either fixed or a choice; the choice is a hard block on advancing, since an unassigned
+1 would silently vanish.

Two slots feed it, and **both live on the Class step**: the 1st-level feat from Variant Human or
Custom Lineage, and the level-4 Ability Score Improvement (`asiMode` = `"focus"` / `"split"` /
`"feat"`, with `classAsi` holding the +2 or +1/+1). The Class step is the wrong-looking home for
an ability-score decision and the right one anyway: half the feats in the books have a
prerequisite only the class can answer — spellcasting, heavy armour, martial weapons — so a
picker on the Ancestry or Abilities step could not filter honestly. `plans/ability-score-
improvement.md` proposed the Abilities step back when feats were out of scope; that's why this
differs from it.

All of it flows through `scoreAdj`, which `finalScore` adds on top of ancestry, capped at 20 by
the feature's own wording. `prereqScore` is the same sum *without* the feat's own bonus, so a
half-feat can never qualify itself.

**Tasha's optional class features.** `optionalFeatures.js` carries two things: `OPTION_LISTS`
(extra options for a feature that already says "choose one of the following" — invocations,
metamagic, fighting styles, maneuvers, pact boons) and `TCE_CLASS_FEATURES` (whole extra
features: Deft Explorer, Favored Foe, Steady Aim, Wild Companion, Harness Divine Power…).
`classFeaturesFor(classId, { tceOptional, subclassId })` in `classes.js` merges them into the
class's own features in level order; everything downstream reads that, not `klass.features`, so
one toggle reaches the app, the appendix and all three export routes at once.

Anything sourced `tce` is gated on the toggle (`tceOptional` state, off by default) because
Tasha's itself frames these as a variant a table adopts, and several replace a feature the class
already has. Xanathar's additions are **not** gated — XGE is an ordinary content book. Nor are
the Handbook's eldritch invocations, which are in there because the warlock's feature text
points at a list the app never carried at all. Action-economy tags for these features are
hand-authored in `classes.js` (`OPTIONAL_ACTION_TAGS`), by the same read-the-text rule as every
other `action` tag.

**Custom Lineage is commented out** — built, then held back. Don't re-add it without reading
this. It genuinely is its own race, not a modifier on one: TCE p.8 opens with "Instead of
choosing one of the game's races for your character at 1st level" and closes with "Your race is
considered to be a Custom Lineage for any game feature that requires a certain race", and
5etools files it in `races.json` as a race. So it was modelled as a base race —
`BASE_RACES["custom-lineage"]` — with the book's one variable trait (darkvision, or a skill
proficiency) split into the two lineage records under it, which keeps the two-stage ancestry UI
intact and makes an illegal Custom Lineage unrepresentable.

The confusion it caused is the point of this note: what people usually mean by "the Tasha's
race option" is **Customizing Your Origin** (TCE pp.7-8), a different and separate variant rule
that applies to *any* race. That one is not implemented — see Outstanding work. The commented-out
blocks live in `baseRaces.js` and `lineages.js`, with a restore checklist in the former.

Because a saved character can outlive the content it was built on, `baseRace` resolves to `null`
rather than `undefined` for an unknown `baseId`, and the lineage panel keys off `baseRace` rather
than `baseId`. Anything else removed from `BASE_RACES` gets the same protection for free.

**Effects that finally have consumers.** Three effect types were documented and read by nothing:
`weaponProf` and `shieldProf` (declared by College of Valor since it was written, and now by
Hexblade, Twilight Domain and College of Swords) and `bonusSkills` (College of Lore's three,
Knowledge Domain's two, and one each from Order, Peace, Cavalier, Samurai, Arcane Archer, Fey
Wanderer — plus Variant Human's and Half-Elf's, which were prose-only traits). `bonusSkills`
reads from **both** lineage and subclass effects and has its own picker on the Class step.
`spellMark` / `spellMarkNotes` (`derive.js`) own the printed sheet's provenance footnotes —
`*` island, `‡` Xanathar's, `§` Tasha's, `†` Strixhaven, nothing for the Handbook — shared by
`sheetHtml.js` and `sheetPdf.js`. `SOURCE_LABEL` / `CONTENT_SOURCES` in the same file are what
every picker heads its groups with; don't reintroduce inline `src === "sinauna" ? … : …`
ternaries.

**Reaction triggers live outside the Time column.** Seven spells (PHB's Shield, Counterspell,
Feather Fall, Hellish Rebuke; Silvery Barbs; the island Apolaki's Light and False Self) carry
their trigger inside the casting-time string — "1 reaction, which you take when you are hit by
an attack". Rendered into the narrow Time cell of the spell table that wrapped to ten lines and
swallowed the row. `splitCastingTime()` (`src/lib/derive.js`) splits the head from the trigger:
the column shows "1 reaction", the app row shows "Trigger: …" above the description, and the
printed sheet folds it into the Notes cell beside ritual/conc. It splits only on a comma after
a "reaction" head — Plant Growth's "1 action, 8 hours" is two genuine casting times and stays
whole — and drops the PHB's "which you take " filler lead-in. The underlying `time` data is
untouched, so the Reference appendix still prints the full string.

**The Sheet step shows the whole sheet on screen.** `components/SheetSummary.jsx` renders every
section the printed sheet carries — vitals, core, saves, skills, attacks, actions, spellcasting,
traits, class and subclass features, feats, background, inventory, reference — from the same
`sheetCtx` object the three export routes read. That shared input is the point: a field missing
from the summary is a field missing from the file, so the two can't drift.

It is deliberately **not** an iframe of `buildSheetHTML()`. That sheet is a light-ground A4
document; dropping one into the dark UI would be unreadable on a phone at a table, which is the
reason the app is dark at all. Two things it does not repeat: the ability strip (the app's own
live `su-sum` bar is pinned above the step content from the Abilities step onward and shows the
same six numbers) and the print-width column layout (it reuses `su-atk-row`, overriding
`gridTemplateColumns` inline the way `SpellTableRow` does). The skills list *is* two-track like
the print sheet's `.sk` grid — eighteen rows is a long single column to scan — via `.su-sk-grid`,
which tightens its gap under the 430px breakpoint rather than collapsing to one column.

The export buttons sit **below** the summary, not above it: the page reads as the sheet itself,
then what to do with it. Order on the step is name → summary → export buttons → plain text →
start over.

`spellHitDC` / `spellEffect` moved to `derive.js` when this landed — they existed as three
identical copies in `sheetHtml.js`, `sheetPdf.js` and here. `SpellTableRow` keeps its own, since
the picker's version also returns an icon flag.

**"Start over" sits in the footer nav as well as on the Sheet step.** Both open the same
`showResetConfirm` modal — one reset path, so the wording can't drift. It anchors the **left**
end of the bar (`.su-nav .su-btn-danger{margin-right:auto}`) with Back and Next paired at the
right, so the destructive button is nowhere near the two step-moves. That pairing needs
`.su-nav .su-btn-go{margin-left:0}`: the class carries `margin-left:auto` for other rows, and
leaving it on split Back and Next 150px apart on a wide screen. Three buttons overflow a phone
row at the default padding, hence the `@media(max-width:430px)` block in `styles.js`.

**The printable sheet has no fixed page count.** It flows to however many pages the character
needs — don't reintroduce "Page 1 / Page 2" framing in the UI or docs (a "two pages, then an
appendix" claim briefly existed in the Sheet step's copy and was wrong even before the Attacks/
Spells tables made the sheet longer).

### Wizard steps

Built by `buildSteps(hasSpellStep)`. The Spells step **only appears for casters**, so step
indices shift. Always compare against `here` (the step name), never a numeric index.

`Ancestry → Abilities → Class → Background → Defenses → [Spells] → Inventory → Sheet`

**The Class step carries more than the class.** Below the subclass picker it holds the class
skill picks, any extra skill picks a subclass or ancestry grants (`bonusSkills`), the Tasha's
optional-features toggle, the 1st-level feat slot for Variant Human / Custom Lineage, and the
level-4 Ability Score Improvement. The last two are there because feat prerequisites need the
class — see the feats section above.

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

Two-stage UI: pick base race, then pick lineage from a merged pool, headed by book in
`CONTENT_SOURCES` order — Sina Una, Handbook, Xanathar's, Tasha's, Strixhaven.

### Export

Three buttons, because no single route works everywhere. All three read the same `sheetCtx`
object assembled in the root component.

| Button | Route | Why |
|---|---|---|
| Save on Android/Mac/PC | `printSheet()` — `buildSheetHTML()` in a hidden iframe, `window.print()` | Best output. Those platforms' print dialogs offer a Save as PDF destination |
| Save on iOS | `saveSheetRasterPDF()` — `src/pdf/sheetRaster.js` | iOS can't print this: Safari renders the print preview then blanks it, and there's no Save as PDF destination to pick anyway |
| Save for other devices | `saveSheetPDF()` — `src/pdf/sheetPdf.js`, pdfmake | Vector fallback: small, selectable, searchable |

A fourth, quieter link still downloads the raw `.html` for hand-editing or mailing to the DM.

**The print route.** `buildSheetHTML(ctx, { interactive })` — the toolbar at the top of the sheet
(its own "Print / Save as PDF" button) renders only when `interactive` is true. The downloaded
file keeps it; the print iframe passes false, so the OS dialog is the first and only thing a
click produces. The sheet is A4 throughout: the body column is a full 210mm wide with 14mm
padding (leaving a 182mm measure) and the iframe is 794×1123px — 210×297mm at 96dpi. Screen and
print share one measure, so nothing reflows when it prints, and the sized iframe also stops
mobile Safari printing a squished sheet.

That 14mm is **split** in print: `@page` takes 6mm and the body box takes the other 8mm. The
reason is the print dialog's date/title/URL headers — Chromium draws them only when the page
margin is big enough to hold them, and drops them when it isn't, whatever the "Headers and
footers" checkbox says. Measured against headless Chromium: 9mm and up prints them, 8mm and
below doesn't. 6mm leaves headroom in case that threshold moves and still clears the ~5mm most
printers can't reach. Side margins hold on every page; interior pages get the 6mm page margin
alone at top and bottom, since padding applies only where the document starts and ends.

**The raster route (iOS).** `sheetRaster.js` lays `buildSheetHTML()` out in an offscreen
A4-wide iframe and photographs it into an A4 PDF with html2canvas + jsPDF. Fidelity is perfect
by construction — it *is* the HTML sheet, no second layout engine to keep in step — at the cost
of image text rather than glyphs, and ~1 MB per few pages. Blocks are captured individually,
not sliced out of one tall screenshot, so a page break lands between sections instead of through
a line; a block taller than a page is replaced by its children recursively, and only a leaf
that's still too tall gets its bitmap sliced. Two things this route dictated: the iframe must
wait for a document that's `complete` **and** populated (`load` fires for the initial
about:blank, and capturing there gives an empty page), and the skills list is a two-track grid
rather than `column-count`, which html2canvas doesn't render.

**The vector route.** `sheetPdf.js` builds a pdfmake document definition. Its layout deliberately
differs from the HTML sheet — pdfmake has no CSS and no break-inside rule that survives long
content, so section boxes become heading + hairline, kept boxed only for the vitals and ability
strips (short enough to mark `unbreakable`). Body text is left-aligned, not justified: pdfmake
doesn't hyphenate, so a justified line in a narrow measure gets filled by splitting a word across
two lines. Proficiency dots are canvas ellipses (● isn't in Karla) and rules are explicit-width
canvas lines (`FULL`/`HALF`), since a pdfmake canvas can't auto-size to its column.
`src/pdf/vfsFonts.js` is **generated** — `scripts/build-pdf-fonts.sh` rebuilds it (needs
`python3 -m pip install fonttools brotli`): Fraunces and Karla ship from Google Fonts as variable
fonts, pdfkit can't read a variable axis, so each weight is instanced to a static TTF, subset to
Latin + punctuation, and base64'd.

**Delivery.** `src/pdf/saveFile.js` is shared by both PDF routes. It does *not* use a bare
`<a download>` on an `application/pdf` blob — iOS Safari previews a blob it can render, ignores
the download attribute, and drops the file in a tab. It hands the file to
`navigator.share({ files })` where that exists (making "Save to Files" one tap on iOS) and falls
back to an anchor download typed `application/octet-stream`, which Safari won't display inline.
`navigator.share` needs transient user activation, so nothing may be awaited ahead of the render.

**Both PDF paths are lazy.** pdfmake, the fonts, html2canvas and jsPDF are `import()`ed on first
use, so the wizard's initial load is unchanged and Vite emits each as its own chunk.

**Verifying it.** `npm run check:export` drives headless Chromium (Brave, Chrome or Chromium —
`BROWSER=` overrides the path) over CDP, runs the raster export against a fixture, and asserts
the result is a multi-page A4 PDF that isn't blank. `--keep` prints where the file landed so it
can be eyeballed. The harness is `/pdftest.html` + `src/pdfTest.js` + `src/pdfTestFixture.js`;
none of it is a build entry, so nothing ships. It exists because both raster bugs above were
invisible to any check that didn't run a real layout engine.

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
| Subclasses | 115 | 18 Sina Una, 40 PHB, 31 XGE, 26 TCE |
| Backgrounds | 6 | Sina Una only |
| Island spells | 14 in app | levels 0–3; 24 total in `spells.json` |
| PHB spells | 198 | levels 0–3 |
| Xanathar's spells | 46 | levels 0–3; 95 in the book |
| Tasha's spells | 13 | levels 0–3; 21 in the book |
| Strixhaven spells | 5 | levels 0–3; whole book |
| Feats | 71 | 42 PHB, 15 XGE, 14 TCE |
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

Two of the three gaps below are now closed — PHB subclass text was pulled in the
Xanathar's/Tasha's pass (`scripts/extract-subclasses.mjs`, `src/data/phbSubclassText.js`), and
core class features were filled in when the babaylan/headhunter work landed. What remains:
- ~~**Core class features are entirely absent**~~ — no Rage, Second Wind, Sneak Attack, Extra
  Attack, Fighting Style, etc. for any of the 12 PHB classes. Not documented anywhere before
  now; found while wiring subclass text. `5etools-src/data/class/class-<name>.json` has full
  text for all of it (`classFeature` array, `source: "PHB"`, `level <= 5`) — scriptable the
  same way the PHB spells were.
- ~~**PHB subclass features (40 subclasses) are still names-only.**~~ Done — all 198 feature
  names matched, with `refOptionalfeature` / `refSubclassFeature` links resolved against
  `data/optionalfeatures.json` as this predicted.
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

### 3. ~~Persistence~~ — DONE

The whole character mirrors to `localStorage` under `sina-una-character` and restores on load;
the Sheet step has a confirmed "Create new character" reset. A shareable-with-the-DM ID is still
an open idea, but nothing depends on it.

### 4. Carried forward from the Xanathar's / Tasha's pass

- **Expanded spell lists aren't modelled.** Oath Spells, Circle Spells, Gloom Stalker Magic,
  Psionic Spells and the warlock patrons' Expanded Spell List all arrive as feature *text* with
  their table flattened into prose. Nothing marks them always-prepared or adds them to the
  picker. The `preparedBonus` effect type has existed unused since the effects layer was
  written and is the obvious hook. Doing it for the new books alone would have been worse than
  not doing it, since PHB domain spells have always been prose too — so it's all or nothing.
- **Invocations, metamagic, fighting styles and maneuvers are lists, not picks.** They render as
  feature text you read and choose from at the table; the app doesn't track which ones you took.
  Same for Arcane Shot options and Rune Knight's runes, which are folded into their parent
  feature's prose.
- **Customizing Your Origin (TCE pp.7-8) is not implemented.** The variant that lets any race
  reassign the increases from its Ability Score Increase trait, plus the same freedom over the
  Languages trait and certain proficiencies. It is 2014-era and explicitly optional in the book,
  so it belongs behind a toggle on the Ancestry step alongside the Tasha's optional class
  features — not as a chassis change, which the first non-negotiable rules out. The reassignable
  pool would reuse the `choicePicks` machinery that already handles Variant Human's and
  Half-Elf's floating +1s; the proficiency swap touches tools, which the app doesn't model, so
  that part stays prose.
- **Custom Lineage is built but commented out.** See the note above. Restoring it is uncommenting
  two data blocks and putting two counts back in `scripts/check.mjs`.
- **Feats can't grant anything mechanical.** A feat's `ability` half-point feeds `finalScore`,
  and that's the whole of it — Skill Expert's proficiency and expertise, Fey Touched's and
  Shadow Touched's spells, Moderately Armored's armour proficiency, Resilient's save
  proficiency all exist only as text. The effects layer is the right home if this ever matters;
  a feat would carry an `effects` array like a subclass does.
- **PHB feats came along uninvited.** The ask was Xanathar's and Tasha's; the Handbook's 42 are
  in because a feat picker without them is a stranger artifact than no feat picker. Worth a
  second opinion at the table.
- **The main bundle is ~990 kB (267 kB gzipped)**, up from roughly two thirds of that — 97
  subclasses' worth of feature text and 71 feats' worth of rules prose now ship on first load.
  If that starts to matter, feature/appendix text is the natural thing to split out behind an
  `import()`, the way both PDF routes already are.
- **Only one ASI.** Level 4 is the only improvement in a 1–5 game, so `classAsi` is a single
  slot, not a per-level record. Raising the level ceiling would need that to change.

### 5. Smaller items

- Ancestry spellcasting abilities: Balat-Kayo says Charisma, Umalagad says Wisdom, but Balete
  Elf's *entangle*/*barkskin* and Mangrove Halfling's *mending* specify none. May be a book
  omission — worth a look before it becomes a table argument. The app now surfaces this rather
  than hiding it: those spells print with a blank Hit/DC column and a line saying the book names
  no ability, instead of a guessed DC.
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
