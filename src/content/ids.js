/* ------------------------------------------------------------------
   Stable, collision-proof slugs.

   Ids are derived from the EMITTED name, never from `nameOriginal`:
   an SRD-renamed record (Bigby's Hand -> Arcane Hand) is published
   under the new name, and that is what a saved character must key on.
   `nameOriginal` still drives cross-reference resolution, because
   every 5etools ref string uses the original.
------------------------------------------------------------------- */

export const slugify = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* One minter per kind. Packs are emitted in a stable sort order, so the
   disambiguation suffixes are deterministic across runs. */
export function idMinter() {
  const taken = new Map();
  return function mint(name, hint) {
    const base = slugify(name) || "unnamed";
    if (!taken.has(base)) { taken.set(base, 1); return base; }
    const withHint = hint ? `${base}-${slugify(hint)}` : null;
    if (withHint && !taken.has(withHint)) { taken.set(withHint, 1); return withHint; }
    let n = taken.get(base) + 1;
    while (taken.has(`${base}-${n}`)) n += 1;
    taken.set(base, n);
    taken.set(`${base}-${n}`, 1);
    return `${base}-${n}`;
  };
}
