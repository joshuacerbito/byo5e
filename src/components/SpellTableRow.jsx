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

export default function SpellTableRow({ sp, on, full, onToggle, casting }) {
  const eff = effectCell(sp);
  const tags = [sp.ritual && "ritual", sp.conc && "conc"].filter(Boolean);
  return (
    <button className={`su-sprow su-sprow-tbl ${on ? "is-sel" : ""}`} onClick={onToggle}
            disabled={full} aria-pressed={on}>
      <span className="su-sprow-b" aria-hidden="true">{on ? "●" : "○"}</span>
      <span className="su-atk-table" style={{ flex: 1 }}>
        <span className="su-atk-row" style={{ gridTemplateColumns: "1.5fr .7fr .8fr .7fr .9fr 1fr" }}>
          <span className="su-spell-n">{sp.name}{tags.map((t) => <span className="su-tag" key={t}>{t}</span>)}</span>
          <span>{sp.time}</span>
          <span>{sp.range}</span>
          <span className="su-atk-num">{hitOrDC(sp, casting)}</span>
          <span className={eff.icon === "heal" ? "su-atk-num su-heal" : "su-atk-num"}>{eff.text}</span>
          <span className="su-atk-notes">{sp.page ? `p.${sp.page}` : "PHB"}</span>
        </span>
        {sp.text
          ? <span className="su-spell-t">{sp.text}</span>
          : <span className="su-spell-t su-spell-none">Description not loaded — see the Player's Handbook.</span>}
      </span>
    </button>
  );
}
