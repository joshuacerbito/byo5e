# Inventory step: starting equipment + currency

## Status

Done. New `Inventory` wizard step (Defenses → [Spells] → Inventory → Sheet), `groupWeapons()`/
`parseStartingGold()` helpers in `derive.js` shared by the app step and `sheetHtml.js`'s own
Inventory section on the printable sheet (placed after Background).

## Context

Starting gear currently lives scattered across the wizard with no single "what do I own"
view: weapons are picked in the Defenses step's "Starting Equipment" panel, armor is a
separate picker in the same step, class gear (packs/tools/focus) is a one-line note under
that weapon picker, and background gear (including each background's starting gp, e.g.
`backgrounds.js:9`) only shows up as flavor text on the Background step. Nothing surfaces
starting currency as a number, and nothing brings it all together. User wants a dedicated
Inventory step that does both: lists everything the character starts with, and shows the
gp total.

Confirmed with user: new top-level wizard step (not a panel bolted onto Defenses), and
currency is read-only — parsed from the background's "N gp" flavor string, not editable
in-session.

## Design

**Two small helpers in `src/lib/derive.js`** (reused by both the app step and the printable
sheet, same pattern as `mod`/`fmt`):

- `groupWeapons(weapons)` — dedupes a flat weapon-instance array (what `carriedWeapons`
  already is, e.g. two `Handaxe` entries for a qty-2 pick) into `[{ weapon, qty }]`, first-seen
  order.
- `parseStartingGold(background)` — scans `background.equipment` (array of strings, e.g.
  `backgrounds.js:9`) for a `/(\d+)\s*gp/i` match, returns `{ gp, items }` where `items` is
  the equipment array with that one gp string filtered out (so it isn't double-listed as a
  "gear" line). `gp` is `0` if no background chosen yet or no match.

**`src/lib/steps.js`**: add `"Inventory"` to `buildSteps`, after `Spells` (or straight after
`Defenses` when there's no Spells step) and before `Sheet`:
```js
export const buildSteps = (hasSpells) =>
  hasSpells ? [...BASE_STEPS, "Spells", "Inventory", "Sheet"] : [...BASE_STEPS, "Inventory", "Sheet"];
```
No other step-rail changes needed — `STEPS.map` (`SinaUnaCreator.jsx:675`) and the `here`
lookup (`:477`) are already name-driven, not hardcoded per step. The "Six steps." sub-header
(`:671`) is already stale once a caster adds the Spells step — switch it to
`` `${STEPS.length} steps.` `` while touching this.

**`SinaUnaCreator.jsx`** new step render block (`here === "Inventory"`), placed after the
Spells block and before Sheet, reusing `su-panel`/`su-row`/`su-skills` primitives (no new
CSS needed beyond maybe one currency tile, styled like the existing `su-vitals` tiles):

- **Weapons** — `groupWeapons(carriedWeapons)`, name + qty, reusing the same row style as
  the Attacks table's name column (no combat stats here, this is inventory not the attack
  table).
- **Armor & Shield** — current `armor.name` + shield on/off, read-only with a "Change" link
  back to Defenses (same `su-chip`-style back-link the step rail already uses elsewhere).
- **Gear** — merges `klass.startingEquipment.gear` (class packs/focus/tools) with
  `parseStartingGold(background).items` (background flavor gear minus the gp line) and
  `background.tools` into one list.
- **Currency** — `parseStartingGold(background).gp` shown as a single prominent number
  ("12 gp"), or a note to pick a background first if none chosen yet.

**`sheetCtx`** (`:557` area): no new fields needed — `carriedWeapons`, `armor`, `shieldOn`,
`klass`, `background` are already passed through; `sheetHtml.js` imports the same
`groupWeapons`/`parseStartingGold` helpers and builds its own Inventory section from them,
same division of labor as the existing Attacks/Spellcasting sections.

**`src/lib/sheetHtml.js`**: new `<section><h4>Inventory</h4>...</section>` on the printable
sheet, placed after the Background section (gear is background reading, not per-turn combat
info like Attacks/Spellcasting) — same compact-table look as the Attacks section (weapon
name + qty; armor/gear/currency as simple label:value lines, not a table).

## Verification

- `npm run check` after every edit.
- `npm run dev`, walk a full build for a class with multiple weapon choices (e.g. Fighter)
  and a background with a distinctive gp figure (e.g. Mangangalakal, 20 gp) — confirm the
  Inventory step shows the right weapon counts, armor, merged gear list (no duplicate gp
  line), and 20 gp. Confirm the step only appears once, in the right rail position, for both
  caster and non-caster classes (Spells step present/absent). Print the sheet and confirm
  the Inventory section renders with the same data.
