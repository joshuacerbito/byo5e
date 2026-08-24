# Plan: Ability Score Improvement (level 4 feat/ASI picker)

## Status

Not started. `CLASS_FEATURES` (`src/data/classes.js`) already carries the level-4
"Ability Score Improvement" feature as **text only** for all 12 classes — it shows up
in the appendix and printable sheet as description, but nothing lets the player actually
apply it. This plan is scoped to close that gap.

## Why this matters for a level 1-5 app

Every class gets exactly one ASI, at level 4 — the only one reachable in this
campaign's 1-5 range (the next is level 8). So this isn't a "nice to have eventually"
feature, it's the single most common missing mechanical effect for any level 4-5
character: right now a level 5 fighter's ability scores are silently wrong.

## Current model (for reference)

- `scores` (point buy) / `arrayAssign` (standard array) hold the **base** score per
  ability, picked in the Abilities step.
- `baseScoreFor(k)` returns whichever mode is active.
- `resolved.asi[k]` is the **ancestry** bonus (from `resolveLineage`, baseRaces/lineages
  data), computed once ancestry is picked.
- `finalScore(k) = baseScoreFor(k) + (resolved.asi[k] || 0)`. This is what every
  derived stat (mod, AC, saves, skills, HP's CON mod, spell DC, etc.) reads.
- There is no class-granted bonus in this chain at all today.

## Data model additions

Add one new piece of state, sibling to `scores`/`arrayAssign`:

```js
const [classAsi, setClassAsi] = useState({}); // { con: 1, str: 1 } or { dex: 2 }, etc.
```

Shape: a partial `{ [ability]: amount }` map, amounts summing to 2 (either one ability
at +2, or two abilities at +1 each — the 2014 rule; feats are out of scope, see below).

`finalScore` becomes:

```js
const finalScore = (k) =>
  Math.min(20, baseScoreFor(k) + (resolved?.asi[k] || 0) + (classAsi[k] || 0));
```

The `Math.min(20, ...)` enforces the "can't raise a score above 20" rule from the
feature text itself.

## Gating: when does the picker apply

- Only relevant once `level >= 4` **and** `klass` is chosen (the feature is granted by
  class level, not character level in the abstract — but since this app has one class
  track, `level` doubles as class level).
- If `level` drops back below 4 (player moves the slider down), `classAsi` should
  reset to `{}` — same pattern as how curse/bgChoice already get cleared on upstream
  changes elsewhere in the file (e.g. `pickBase` resets `choicePicks`).
- Multiclassing is out of scope (app doesn't support it), so there's exactly one ASI
  slot to manage, not per-class tracking.

## UI/UX

Reuse the existing ancestry-ASI-choice interaction pattern (`needsChoice` /
`choicePicks` / `toggleChoice` around line 56-63) as the template — it already solves
"pick which of N abilities get a bonus" — but this one needs an **amount** dimension
(+2/one vs +1/two), which the ancestry version doesn't have (ancestry ASI choices are
always +1 each, fixed count).

Proposed shape:

```js
const [asiMode, setAsiMode] = useState("split"); // "split" (+1/+1) or "focus" (+2/one)
const [classAsi, setClassAsi] = useState({});
```

- **Placement**: a new block in the Abilities step (not Class step) — it's fundamentally
  an ability-score decision, and the Abilities step already owns that UI. Render it
  below the existing point-buy/array panel, gated on `level >= 4 && klass`.
  - Ordering wrinkle: class is picked in the *next* step (Class), so at the point the
    Abilities step renders, `klass` may not exist yet. Options:
    a) Show the block unconditionally once `level >= 4` (ASI is class-agnostic — every
       class gets it at 4), drop the `klass` gate entirely. **Recommended** — simpler,
       and matches the fact the amount/mechanic doesn't depend on which class.
    b) Move the block to the Class step instead, after class selection. Keeps the
       Abilities step "pure" but splits ability-score edits across two steps, which
       fights the existing model. Not recommended.
  - Go with (a).
- **Controls**: two pill buttons ("+2 to one score" / "+1 to two scores"), then below,
  ability buttons to click (same `su-opt` pill style used by the ancestry ASI choice
  and the subclass curse choice). Clicking in "+2" mode selects one ability and applies
  the whole bonus; clicking in "+1/+1" mode toggles up to two abilities.
- **Feats**: the book text says "if your DM allows feats, you may take one instead."
  This app has no feat data at all. Out of scope for this plan — leave the ASI-only
  path implemented, and leave the feat option as the sheet's already-present text
  ("If your DM allows the use of feats...") for the table to handle by hand. Do not
  build a feat picker.
- **Cap enforcement**: disable the +2/+1 buttons for an ability already at 20
  (`finalScore(k) - classAsi[k] >= 20` before applying), matching the point-buy pattern
  of disabling +/- buttons at their caps (see `setScore`, `su-btn-sq disabled`).

## Derivation changes

- `finalScore` — as above, add `classAsi` term + cap.
- `canAdvance()` for the Abilities step — currently `mode === "pointbuy" ? true : ...`.
  Decide whether the ASI pick is *required* to advance once `level >= 4`, or optional
  (defaulting to unspent). Recommend **optional but nagged** — same pattern as the
  `su-hint` nav-bar hints used elsewhere (e.g. "Assign all six") — rather than a hard
  block, since a table might legitimately dump the +2 into a score already at the
  softcap and that's a valid choice too. A hint like "2 points unassigned" if
  `level >= 4` and the sum of `classAsi` values < 2.

## Appendix / sheet text

Once a choice is made, replace the generic "Ability Score Improvement" feature text
(currently just the printed rules paragraph) with a concrete line reflecting the pick,
e.g. append `" You put +2 into Constitution."` or `" You put +1 into Strength and +1
into Dexterity."` — same treatment the subclass `choice` field already gets for
Graverobber's curse (`SinaUnaCreator.jsx` appendix block, `curse && subclass?.choice`).

## Where every derived stat re-reads this automatically

No changes needed beyond `finalScore` itself — `savingThrows`, `skillTable`,
`passiveSkills`, `hitPoints` (CON), `armorClass` (DEX/CON formulas), spellcasting DC/
attack, and the su-sum sidebar all already call `finalScore(k)`, not `baseScoreFor(k)`
directly, so they pick the class ASI up for free once it flows through `finalScore`.

## Implementation checklist

1. Add `classAsi` state + `asiMode` state.
2. Update `finalScore` to include `classAsi` and the 20 cap.
3. Reset `classAsi` to `{}` when `level` drops below 4 (in the level-change handler, or
   a `useEffect`/derived guard — check how `level` is currently set to find the right
   hook point).
4. Build the picker UI block in the Abilities step, gated on `level >= 4`.
5. Wire the concrete-choice text into the appendix (mirrors curse/bgChoice pattern).
6. Add a nav hint for "N points unassigned" when applicable.
7. `npm run check` after each edit, per project convention.
8. Manually verify: point-buy character, bump to level 4, apply +2 CON, confirm HP,
   CON save, and the sidebar's CON tile all update together.

## Explicitly out of scope

- Feats (no feat data exists in this app; the book text already tells the table to
  handle it manually if the DM allows feats).
- Multiclass ASI stacking (app has no multiclass support).
- Levels 8/12/16/19 ASIs (unreachable — level cap is 5).
