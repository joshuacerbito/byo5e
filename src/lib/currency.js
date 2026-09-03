/* Currency display, shared by the app and all three sheet renderers —
   see CLAUDE.md's warning about keeping those four in lockstep. Pure
   presentation, the same kind of helper as groupWeapons() in derive.js,
   not rules arithmetic: no ability scores or proficiency involved. */
export const formatCurrency = ({ cp, sp, gp, pp } = {}) =>
  [pp && `${pp} pp`, gp && `${gp} gp`, sp && `${sp} sp`, cp && `${cp} cp`].filter(Boolean).join(", ") || "None";

/* Starting gold arrives as a copper value (every structured equipment
   entry is in copper — see content/equipment.js) and has to be added to
   a purse the player typed themselves. It is folded in as GOLD, not
   re-denominated into platinum: the line above the total says "84 gp",
   and a total that answered "8 pp, 4 gp" would be arithmetically right
   and unrecognisable. The remainder below a gold piece still lands in
   silver and copper rather than being dropped, so nothing is lost on an
   amount that isn't whole gold.

   The player's own denominations are left exactly as entered for the
   same reason: 15 sp stays 15 sp in the total, not 1 gp 5 sp. This is a
   sum, not a money-changer. */
export function addGold(purse, valueCp) {
  const c = purse || {};
  return {
    pp: c.pp || 0,
    gp: (c.gp || 0) + Math.floor(valueCp / 100),
    sp: (c.sp || 0) + Math.floor((valueCp % 100) / 10),
    cp: (c.cp || 0) + (valueCp % 10),
  };
}
