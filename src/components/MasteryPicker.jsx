/* ------------------------------------------------------------------
   One "search to add" bracket of the Weapon Mastery pick — the Core
   Traits panel's level-1 baseline and each later level-up bump (see
   the loop in CharacterCreator.jsx that renders one of these per bump
   level) are the same control at a different `ceiling`. `ceiling` is
   the CUMULATIVE cap through that bracket's level, not the size of the
   bracket itself — masteryPicks is one flat array with no notion of
   which bracket a given pick "belongs to" (the rules don't distinguish
   that either), so every bracket's Add just fills toward its own
   ceiling and a lower bracket left unfilled simply gets borrowed from
   by a later one. Search state is local to each instance, so multiple
   brackets on screen at once don't fight over one input. */
import React, { useState, useMemo } from "react";

export default function MasteryPicker({ label, ceiling, floor = 0, eligibleWeapons, picks, onAdd }) {
  const [search, setSearch] = useState("");
  /* "To go" is bounded by this bracket's OWN size (ceiling - floor), not
     just the raw distance to the cumulative ceiling — otherwise a "+1"
     bump panel would show "4 to go" whenever earlier brackets are still
     unfilled, which reads as a contradiction next to its own "Choose 1
     more" label. Add still targets the true ceiling underneath (see
     onAdd), so filling an earlier bracket's slot from here still works;
     this only changes what the counter claims is left AT THIS PANEL. */
  const left = Math.max(0, Math.min(ceiling - picks.length, ceiling - floor));
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const pool = eligibleWeapons.filter((w) => !picks.includes(w.id));
    return q ? pool.filter((w) => w.name.toLowerCase().includes(q)) : [];
  }, [eligibleWeapons, picks, search]);

  return (
    <div className="byo-ct-picker">
      <div className="byo-ct-picker-h">
        <span className="byo-ct-picker-l">{label}</span>
        <span className="byo-count">{left > 0 ? `${left} to go` : "done"}</span>
      </div>
      {left > 0 && (
        <>
          <input className="byo-input" style={{ fontSize: 15, marginBottom: 10 }} value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search weapons you're proficient with…"
                 aria-label="Search mastered weapons" />
          {search.trim() && (
            <div className="byo-scroll-y">
              {results.slice(0, 20).map((w) => (
                <div className="byo-row" key={w.id}>
                  <span className="byo-row-label">{w.name}</span>
                  <button className="byo-chip-b" onClick={() => onAdd(w.id)}>Add</button>
                </div>
              ))}
              {results.length === 0 && (
                <p className="byo-note">No proficient weapons match "{search}".</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
