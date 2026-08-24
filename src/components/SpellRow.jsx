export default function SpellRow({ sp, on, full, onToggle }) {
  const meta = [
    sp.school,
    sp.level === 0 ? "cantrip" : `level ${sp.level}`,
    sp.time, sp.range, sp.comp, sp.dur,
  ].filter(Boolean);
  return (
    <button className={`su-sprow ${on ? "is-sel" : ""}`} onClick={onToggle}
            disabled={full} aria-pressed={on}>
      <span className="su-sprow-b" aria-hidden="true">{on ? "●" : "○"}</span>
      <span className="su-sprow-body">
        <span className="su-sprow-h">
          <span className="su-spell-n">{sp.name}</span>
          <span className="su-spell-tags">
            {sp.ritual && <span className="su-tag">ritual</span>}
            {sp.conc && <span className="su-tag">conc</span>}
            {sp.page
              ? <span className="su-tag alt">p.{sp.page}</span>
              : <span className="su-tag alt">PHB</span>}
          </span>
        </span>
        <span className="su-spell-m">{meta.join(" · ")}</span>
        {sp.text
          ? <span className="su-spell-t">{sp.text}</span>
          : <span className="su-spell-t su-spell-none">
              Description not loaded — see the Player's Handbook.
            </span>}
      </span>
    </button>
  );
}
