import React, { useEffect, useState } from "react";
import { signOut, listCharacters, deleteCharacter, getProfile } from "../lib/sync.js";

/* Standalone screen — NOT one of the wizard steps. Reached only from the
   header's "My Account" button, which only renders when a session exists
   (CharacterCreator.jsx), so a signed-out visitor has no way to land here —
   there is no URL routing in this app for one to slip in through either.
   Same swap-the-whole-body pattern as Terms.jsx/Privacy.jsx/AddRuleset.jsx.

   What this does NOT do yet: open a saved character back into the wizard.
   That needs an "apply this snapshot to every field" function the app
   doesn't have — CharacterCreator.jsx only ever hydrates state once, at
   first mount, from whatever's in localStorage. Building that safely is
   flagged as the next real step, not rushed in here. This screen only
   lists what's saved and lets you delete one; "save what I'm working on
   right now" lives on the Sheet step, right next to the other exports. */
export default function Account({ session, onBack }) {
  const userId = session?.user?.id;
  const [characters, setCharacters] = useState(null); // null = loading
  const [limit, setLimit] = useState(2);
  const [showList, setShowList] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let live = true;
    if (!userId) return;
    getProfile(userId).then((p) => { if (live) setLimit(p.characterLimit); });
    listCharacters(userId).then((rows) => { if (live) setCharacters(rows); });
    return () => { live = false; };
  }, [userId]);

  const refresh = () => { listCharacters(userId).then(setCharacters); };

  const remove = async (id) => {
    setBusyId(id);
    const ok = await deleteCharacter(id);
    setBusyId(null);
    if (ok) refresh();
  };

  return (
    <div className="byo-root">
      <div className="byo-wrap">
        <button className="byo-linkbtn" onClick={onBack} style={{ marginBottom: 14 }}>← Back</button>
        <h1 className="byo-h1">My Account</h1>
        <p className="byo-h2">Bring Your Own 5e</p>

        <div className="byo-panel">
          <h3>Email</h3>
          <p className="byo-note">{session?.user?.email || "—"}</p>
          <p className="byo-note" style={{ marginTop: 10, fontSize: 12 }}>
            You signed in with Google, so this app doesn't manage your email — it's whatever
            Google account you used. Change it there (or sign in with a different Google account)
            rather than here; there's no separate "change email" step for a Google-linked account.
          </p>
        </div>

        <div className="byo-panel">
          <button className="byo-btn byo-btn-alt" style={{ width: "100%", textAlign: "left" }}
                  onClick={() => setShowList((s) => !s)} aria-expanded={showList}>
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>My Characters</span>
              <span className="byo-count">
                {characters ? `${characters.length}/${limit}` : "…"} {showList ? "▲" : "▼"}
              </span>
            </span>
          </button>

          {showList && (
            <div style={{ marginTop: 14 }}>
              {characters === null && <p className="byo-note">Loading…</p>}
              {characters?.length === 0 && (
                <p className="byo-note">
                  Nothing saved yet. Build a character, then use "Save to my account" on its
                  Sheet step.
                </p>
              )}
              {characters?.map((c) => (
                <div className="byo-row" key={c.id}>
                  <span className="byo-row-label">
                    {c.name || "Unnamed"}
                    <span className="byo-item-mech">
                      saved {new Date(c.updated_at).toLocaleDateString()}
                    </span>
                  </span>
                  <button className="byo-linkbtn" disabled={busyId === c.id} onClick={() => remove(c.id)}>
                    {busyId === c.id ? "Removing…" : "Delete"}
                  </button>
                </div>
              ))}
              {characters && characters.length >= limit && (
                <p className="byo-note" style={{ marginTop: 10, fontSize: 12 }}>
                  You've used all {limit} character slots on the free plan. Delete one to save a
                  new one, or wait for paid plans with more slots (not available yet).
                </p>
              )}
            </div>
          )}
        </div>

        <div className="byo-panel">
          <button className="byo-btn byo-btn-danger" onClick={signOut}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
