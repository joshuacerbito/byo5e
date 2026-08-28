import { splitCastingTime } from "../lib/derive.js";
import FeatureBlocks from "./FeatureBlocks.jsx";

const ABIL_LABEL = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };

/* Hit/DC column: attack spells show the caster's flat spell attack bonus,
   save spells show the target's save (ability + DC), everything else — no
   attack roll, no forced save — shows an em dash rather than a guess. */
function hitOrDC(sp, casting) {
  if (sp.atk) return casting ? `${casting.attack >= 0 ? "+" : ""}${casting.attack}` : "—";
  if (sp.save) return `${ABIL_LABEL[sp.save] || sp.save.toUpperCase()} ${casting?.saveDC ?? ""}`.trim();
  return "—";
}

function effectCell(sp) {
  if (sp.heal) return { text: `${sp.heal}`, icon: "heal" };
  if (sp.dmg) return { text: `${sp.dmg}${sp.dmgType ? ` ${sp.dmgType}` : ""}`, icon: "dmg" };
  if (sp.cond) return { text: sp.cond[0].toUpperCase() + sp.cond.slice(1), icon: null };
  return { text: "—", icon: null };
}

/* The whole card is the toggle — same as before — but it's a <div
   role="button"> now, not a literal <button>: a <button>'s content
   model is phrasing content only, so FeatureBlocks' headings/lists/
   tables (block-level) couldn't legally go inside one. A div with the
   button role gets the same click/keyboard/AT behavior without that
   restriction. */
export default function SpellTableRow({ sp, on, full, onToggle, casting }) {
  const eff = effectCell(sp);
  const { head: time, trigger } = splitCastingTime(sp.time);
  /* Single letters, not words: the tags sit inline with the spell name in a
     1.5fr column, and "RITUAL CONC" pushed long names into a second line. */
  const tags = [sp.ritual && ["R", "Ritual"], sp.concentration && ["C", "Concentration"]].filter(Boolean);
  const activate = () => { if (!full) onToggle(); };
  return (
    <div className={`byo-sprow byo-sprow-tbl ${on ? "is-sel" : ""} ${full ? "is-full" : ""}`}
         role="button" tabIndex={full ? -1 : 0} aria-pressed={on} aria-disabled={full}
         onClick={activate}
         onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); } }}>
      <span className={`byo-dot at-top${on ? " is-on" : ""}`} aria-hidden="true" />
      <span className="byo-atk-table" style={{ flex: 1 }}>
        <span className="byo-atk-row byo-atk-row-spell">
          <span className="byo-spell-n">{sp.name}{tags.map(([short, full]) => (
            <span className="byo-tag one" key={short} title={full} aria-label={full}>{short}</span>
          ))}</span>
          <span>{time}</span>
          <span>{sp.range}</span>
          <span className="byo-atk-num">{hitOrDC(sp, casting)}</span>
          <span className={eff.icon === "heal" ? "byo-atk-num byo-heal" : "byo-atk-num"}>{eff.text}</span>
          <span className="byo-atk-notes">{sp.page ? `p.${sp.page}` : sp.source}</span>
        </span>
        {trigger ? <span className="byo-spell-trig">Trigger: {trigger}</span> : null}
        <div className="byo-spell-t"><FeatureBlocks blocks={sp.blocks} /></div>
        {sp.higherLevelBlocks?.length ? (
          <div className="byo-spell-hl">
            <b>At Higher Levels.</b>
            <FeatureBlocks blocks={sp.higherLevelBlocks} />
          </div>
        ) : null}
      </span>
    </div>
  );
}
