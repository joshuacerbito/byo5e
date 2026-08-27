/* ------------------------------------------------------------------
   Hand-authored mechanical effects for magic items whose bonus is a
   flat number, not something the raw pack already encodes (contrast
   items.js's `attachedSpells`/`charges`, which ARE already structured
   in 5etools' data and need no overlay at all).

   Keyed by the item id `idMinter` mints in items.js (name-based, stable
   across both SRD packs — verified: same id in 5.1 and 5.2 for every
   entry below, since none of these items were renamed between
   editions). One overlay entry serves both packs.

   Scope: only items that grant a bonus while worn/attuned with no
   condition this app can't already represent, and that are common
   enough to be worth hand-authoring first — see
   plans/mechanical-effects-extraction.md for what's deliberately left
   out (e.g. Bracers of Defense's "no armor AND no shield" condition has
   nowhere to plug in yet; Robe of Stars only needed saveBonus).
------------------------------------------------------------------- */

export const ITEM_EFFECTS_OVERLAY = {
  "ring-of-protection": {
    effects: [
      { type: "acBonus", value: 1 },
      { type: "saveBonus", value: 1 },
    ],
  },
  "cloak-of-protection": {
    effects: [
      { type: "acBonus", value: 1 },
      { type: "saveBonus", value: 1 },
    ],
  },
  "robe-of-stars": {
    effects: [
      { type: "saveBonus", value: 1 },
    ],
  },
  "stone-of-good-luck": {
    effects: [
      { type: "saveBonus", value: 1 },
      { type: "abilityCheckBonus", value: 1 },
    ],
  },
};
