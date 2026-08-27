/* Currency display, shared by the app and all three sheet renderers —
   see CLAUDE.md's warning about keeping those four in lockstep. Pure
   presentation, the same kind of helper as groupWeapons() in derive.js,
   not rules arithmetic: no ability scores or proficiency involved. */
export const formatCurrency = ({ cp, sp, gp, pp } = {}) =>
  [pp && `${pp} pp`, gp && `${gp} gp`, sp && `${sp} sp`, cp && `${cp} cp`].filter(Boolean).join(", ") || "None";
