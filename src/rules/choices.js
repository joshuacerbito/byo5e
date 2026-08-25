/* Ability-increase choices, unified.

   Content ships two shapes for "pick some abilities and raise them"
   (src/content/prof.js normAbilityIncrease / normBackgroundAbility):

     { kind: "pick", count, amount, from }        every pick gets the same
                                                    bump — ancestry choice
                                                    ("+1 to two of your
                                                    choice"), one half of
                                                    the ASI feat's pair
     { kind: "weighted", from, weights }           each pick gets the NEXT
                                                    weight in order — the
                                                    2024 background's
                                                    "+2/+1" alternative

   When a weighted spec's weights cover every entry in `from` there is
   nothing to choose — Acolyte's "+1 to all three" — so `auto` is true and
   the caller can apply it without asking. */
export function abilityChoiceSlots(spec) {
  if (!spec) return { count: 0, from: [], amountAt: () => 0, auto: true };
  if (spec.kind === "weighted") {
    return {
      count: spec.weights.length,
      from: spec.from,
      amountAt: (i) => spec.weights[i] ?? 0,
      auto: spec.weights.length >= spec.from.length,
    };
  }
  return { count: spec.count, from: spec.from, amountAt: () => spec.amount, auto: false };
}

/* `picks` is an ordered array of ability keys — order matters for a
   weighted spec (first pick gets the first weight). Returns a plain
   { key: amount } map, summed if a key is somehow picked twice. */
export function resolveAbilityChoice(spec, picks) {
  const slots = abilityChoiceSlots(spec);
  const chosen = slots.auto ? slots.from : (picks || []);
  const out = {};
  chosen.forEach((k, i) => { out[k] = (out[k] || 0) + slots.amountAt(i); });
  return out;
}
