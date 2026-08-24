# Babaylan & Headhunter — missing 13th/14th classes

## Finding

CLAUDE.md's outstanding-work list only flagged **Babaylan** as missing (#2). **Headhunter**
is a second Sina Una class, not documented anywhere in CLAUDE.md, not in `src/data/classes.js`.
Both were missed by the original class-chapter scan (searched only for the 12 PHB class names).

`SPELL_LISTS.babaylan` already exists in `islandSpells.js` — spell side is half-ready for
Babaylan. Headhunter has no spell-side prep at all (it's mostly non-caster, except one subclass
option that borrows the cleric list).

A related, previously-undocumented gap surfaced while locating these: **Sina Una's own
weapon and armor tables (book pp.204, 207) aren't in `weapons.js` either.** Both new classes'
starting equipment references them (kampilan, bangkaw, busog, bolo, etc.), and backgrounds.js
already references "a bolo or bangkaw" that don't exist in `WEAPONS`.

## Page map (book pages, verified visually — pdf `source/Sina una 5e-pages-4.pdf`, offset +135
from pdftoppm index, i.e. book page = pdf page − 135)

- **Class: Babaylan** — pp.164–169 (6 pages)
  - 164: flavor/art
  - 165: class table (levels 1–20, prof bonus, spirit dice, cantrips/spell slots), Creating a Babaylan
  - 166: Quick Build, Class Features (hit die d8, light armor, simple weapons + coral-tipped
    spear/kampilan/songil, Herbalism Kit, Int/Con saves, 2 of Arcana/History/Insight/Medicine/
    Nature/Perception/Persuasion/Religion), Equipment, Spellcasting (Int-based)
  - 167: Abayan (spirit companion/focus), Babaylan Calling (chosen at 1st level), Spirit Conduit
    (L3, Spirit Dice pool, conduit options: Persistence/Precision/Vehemence), ASI, Spirit
    Recovery (L7), Preternatural Speaker (L10)
  - 168: Walker Between Worlds (L14), Mythic Reverence (L20), **Callings** intro, **Call of
    Clairvoyance** (Divining Eye L1, Vessel for the Spirits L2, Clarity of Mind L6, Piercing
    Sight L11, Living Memory L15), **Call of Sacrifice** (name only so far, page cut off)
  - 169: Call of Sacrifice features (Undaunted Healer, Absolve Hurt, Yield Vitality, Hale of
    Body, Banish Affliction), **Call of Wrath** (Bonus Proficiencies, Guided Strikes, Fury of
    the Spirits, Magic Warrior, Tempered Will, Armor of Ancients)
  - **3 callings total**: Clairvoyance, Sacrifice, Wrath — all chosen at 1st level, matching
    the app's existing "subclass chosen at level 1" pattern (Cleric/Sorcerer-style).

- **Class: Headhunter** — pp.170–175 (6 pages)
  - 170: flavor/art
  - 171: class table (Focused Hunter/Conviction L1; Rites of the Ancestors + Fighting Style L2;
    Hunter's Omen L3; ASI at 4/8/12/16/19; Forgiveness for the Slain L6; ...; Inevitable L17)
  - 172: Quick Build, Class Features (hit die d10, light+medium armor+shields, simple+martial
    weapons, Hunter's Kit, Str/Wis saves, 2 of Athletics/History/Insight/Intimidation/
    Investigation/Perception/Religion/Survival), Equipment, Focused Hunter, Conviction
    (force-damage rider, scales via Conviction Damage column), Rite of the Ancestors (quarry +
    3 questions per long rest), Fighting Style (Defense/Distance/Great Weapon Fighting/
    Protection/Pursuant — note: 2014-style, reuses the standard FS list plus one bespoke option)
  - 173: Skirmisher (opportunity-attack move), **Hunter's Omen** intro (chosen L3, features at
    3/7/14/18), ASI, Forgiveness for the Slain (L6), Unwavering Hunter (L9), Tireless Pursuit
    (L11), Dread Presence (L13), Inevitable (L18 crit 18-20 — errata check: table says L17,
    body text says L18, **record as errata**), **Omen of Knowledge** (Lessons of the Departed,
    Memories of War → pick "Memory options" from a shared list, Study Remembrance)
  - 174: Memoriam (L18, swap a Memory option), full **Memory Options** list (~9 options: Assured
    Mark, Cloaked Terror, Cycle Breaker, Guardian, Living Shield, Nimble Warrior, Pinning
    Strike, Silent One, Rending Blow), **Omen of Strife** start (Bonus Proficiencies, Awestriking
    Presence, Formidable Conviction L7, The Cost of Fear L14)
  - 175: Omen of Swiftness (full 3rd-caster cleric-list spellcasting subsystem — its own
    spellcasting table L3-20, Devoted Soul, Blessed Warrior L7, Grim Persistence L14,
    Many-Limbed Silhouette L18), Retribution (Omen of Knowledge capstone, L18)
  - **3 Omens total**: Knowledge, Strife, Swiftness — chosen at 3rd level (Ranger Conclave/
    Warlock Patron-style, later than Babaylan's L1 pick).
  - Omen of Knowledge's "Memory Options" sub-picklist is a **new mechanic shape** the app's
    effects layer doesn't have a slot for yet (closest precedent: Fighting Style, or the
    already-descoped eldritch invocations). Needs a design decision, not just data entry.

- **Sina Una weapons/armor** — book pp.204 (armor), 207 (weapons), part of the equipment
  chapter, `source/Sina una 5e-pages-5.pdf` (need to re-locate exact pdf-page offset the same
  way — not yet done, only found via OCR grep). New items: Habay-habay (light armor), Barote
  (medium), Pakil (heavy), Kalasag/Palisay (shields); Bagakay spear, Baladaw, Bangkaw, Bolo,
  Kris, Busog, Kalawit, Bunang, Coral-tipped spear, Panabas, Sarapang, Songil, Stingray tail
  whip, Astinggal, Bontal, Lantaka, Sumpit. OCR is legible enough here to use as a first pass
  but **stats must still be verified against the rasterized page image** per the project's
  "don't trust OCR for mechanics" rule before going in `weapons.js`.

## What "done" looks like (mirrors how the 12 Sina Una subclasses were done in 1b)

1. `src/data/weapons.js` — add the Sina Una weapon/armor tables (verified via image, not OCR).
2. `src/data/classes.js` — add `babaylan` and `headhunter` to `CLASSES`: hit die, saves,
   skills, armor/weapon prof, starting equipment, `CLASS_FEATURES` tuples (full text,
   action-economy tags per the existing convention) for levels 1–20 (data kept full even
   though the app only renders through 5, per "Level 5 is the ceiling" — filter, don't delete).
3. `src/data/subclasses.js` — add the 3 Callings + 3 Omens as `SINA_UNA_SUBCLASSES` entries,
   full feature text. Omen of Swiftness needs an `effects: [{ type: "casting", ... }]` entry
   (third-caster, cleric list, Wisdom) — same shape as Graverobber's. Omen of Knowledge's
   Memory Options need a scoping decision (see below).
4. `src/data/islandSpells.js` — `SPELL_LISTS.babaylan` already exists; verify it's complete/
   correct against p.224's list (per Outstanding Work #4, not yet spot-checked).
5. `errata` table in CLAUDE.md — add the Inevitable L17-vs-L18 table/body mismatch found above.
6. Content-inventory table + `scripts/check.mjs` counts — update (classes 12→14, subclasses
   52→58).
7. Sheet/Actions-panel wiring — same treatment as the other 12 core classes already get.

## Open decision before implementing

**Memory Options** (Omen of Knowledge) is a "pick N from a shared list, one list shared across
multiple unlock levels" shape that has no existing analog in the effects layer (Fighting Style
is pick-1-once; this is pick-then-grow-then-swap). Options:
- (a) treat it like Fighting Style is currently handled — flavor text only, not modeled in derived
  stats, shown as prose in the appendix (fastest, matches how most subclass features already
  work — most are prose, not derived-stat effects)
- (b) build a small new effect type for it (more faithful, more app work, no other subclass
  needs it yet)

Recommend (a): almost none of the existing 52 subclasses' features feed derived stats either
(only Mentala/Graverobber do, via the effects layer) — Memory Options can just be prose blocks
under the Omen of Knowledge feature list, consistent with everything else.

## Scope / sequencing question for Josh

This is comparable in size to the 1b pass (12 subclasses, full text) plus a new weapons/armor
table — realistically a multi-session effort, not a single edit. Options:
1. Do it in one long pass, both classes + weapons table, now.
2. Weapons/armor table first (small, self-contained, unblocks both classes' equipment/attack
   tables), then Babaylan, then Headhunter as separate passes.
3. Something narrower — e.g. chassis + levels 1–5 text only for now (matches the app's actual
   level ceiling), defer 6–20 text to a later pass the way core-class features (Rage, Sneak
   Attack, etc.) are already deferred for the 12 PHB classes.
