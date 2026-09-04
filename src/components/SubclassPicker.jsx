/* ------------------------------------------------------------------
   The subclass card grid, shared by the primary class's Class step and
   each multiclass entry card. Those two were near-identical copies of
   the same markup, differing only in the pick handler, which entry's
   level decides the "features you get now" pills, and the wording of
   the not-yet-eligible note — so all three are props and the markup
   lives here once.

   Two things exist here that the copies did not have, both driven by
   volume: the SRD packs carry one subclass per class, but a
   multi-source pack carries 8-12 for the fat classes (Cleric, Wizard),
   and at ~90px a card that is several phone screens of nothing but
   cards sitting between the level panels.

   1. Collapse-on-pick, the same pattern (and the same .byo-classpick
      CSS) the Species, Class and Background grids already use: once
      something is picked the grid shows only that card, with a chip to
      reopen it.
   2. A name filter, but only past FILTER_FROM options — below that the
      list is shorter than the control explaining itself, and the SRD
      packs would grow a search box for a single card.

   No virtualization on purpose: even 16 buttons is nothing for the DOM.
   The cost here is scroll distance for a person, which neither a
   window nor a fixed height would fix.
------------------------------------------------------------------- */
import React, { useState, useMemo } from "react";
import Section from "./Section.jsx";
import { featuresAtLevel } from "../rules/progression.js";

const FILTER_FROM = 8;

export default function SubclassPicker({ title, subclasses, selectedId, level, subclassOn, note, onPick, style }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = subclasses.find((s) => s.id === selectedId) || null;
  const showsAll = !selected || open;

  const shown = useMemo(() => {
    if (!showsAll) return selected ? [selected] : [];
    const t = q.trim().toLowerCase();
    return t ? subclasses.filter((s) => s.name.toLowerCase().includes(t)) : subclasses;
  }, [showsAll, selected, subclasses, q]);

  return (
    <Section style={style} title={title} flag={subclassOn && !selected}>
      {!subclassOn ? (
        <p className="byo-note">{note}</p>
      ) : (
        <div className="byo-classpick">
          {selected && (
            <div className="byo-classpick-head">
              <span className="byo-classpick-l">{title}</span>
              <button type="button" className="byo-chip-b"
                      onClick={() => setOpen((o) => !o)} aria-expanded={showsAll}>
                {showsAll ? `Keep ${selected.name}` : `Change ${String(title).toLowerCase()}`}
              </button>
            </div>
          )}

          {/* byo-live so the filter survives a shut Section — same
              exemption every other pending pick control carries. */}
          {showsAll && subclasses.length > FILTER_FROM && (
            <input className="byo-input byo-live" style={{ fontSize: 15, margin: "8px 0 0" }}
                   value={q} onChange={(e) => setQ(e.target.value)}
                   placeholder={`Filter ${subclasses.length} options by name`}
                   aria-label={`Filter ${title} options`} />
          )}

          <div className={`byo-card-grid${showsAll ? "" : " is-one"}`} style={{ marginTop: 8 }}>
            {shown.map((s) => {
              const sel = s.id === selectedId;
              const now = featuresAtLevel(s.features, level);
              return (
                <button key={s.id} className={`byo-card ${sel ? "is-sel" : ""}`}
                        onClick={() => {
                          /* Re-picking what you already have would clear the
                             option picks the subclass granted, so the selected
                             card only toggles the grid — same guard the
                             species and class grids use. */
                          if (sel) setOpen((o) => !o);
                          else { onPick(s.id); setOpen(false); }
                        }} aria-pressed={sel}>
                  <div className="byo-card-top">
                    <span className={`byo-dot${sel ? " is-on" : ""}`} aria-hidden="true" />
                    <span className="byo-card-name">{s.name}</span>
                    {s.page && <span className="byo-card-kind">p.{s.page}</span>}
                  </div>
                  <div className="byo-pills" style={{ marginTop: 8 }}>
                    {now.length ? now.map((f) => <span className="byo-pill" key={f.id}>{f.name}</span>)
                      : <span className="byo-pill alt">no features yet</span>}
                  </div>
                </button>
              );
            })}
            {!shown.length && <p className="byo-note">Nothing matches “{q.trim()}”.</p>}
          </div>
        </div>
      )}
    </Section>
  );
}
