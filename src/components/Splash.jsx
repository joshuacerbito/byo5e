import React from "react";

/* The app's front door — its own real route ("/", src/lib/router.js),
   not a local boolean. Not one of the 9 wizard steps (see
   src/lib/steps.js), not one of the standalone scratch screens either
   (AddRuleset/Terms/Privacy/Account) — those replace the wizard body
   from *inside* it; this is what's home before you've picked a path in
   at all. */
export default function Splash({
  onNewCharacter, onAddRuleset,
  session, syncEnabled, authUiEnabled, onSignIn, onAccount,
  onTerms, onPrivacy,
}) {
  const loginLabel = session ? "My Account" : "Login / Register";
  const loginAction = session ? onAccount : onSignIn;
  /* Same honesty rule as the rest of the app (see AUTH_UI_ENABLED in
     CharacterCreator.jsx): don't show a button that would error if
     clicked. Sync is real but gated off until the multi-character DB
     migration lands, so the card explains why instead of pretending. */
  const loginDisabled = !(authUiEnabled && syncEnabled);

  return (
    <div className="byo-root">
      <div className="byo-wrap byo-splash-wrap">
        <h1 className="byo-h1">Bring Your Own 5e</h1>
        <p className="byo-sub">
          A 5e character creator that starts from the free SRD (2014 or 2024 rules) and lets you
          bring your own homebrew content alongside it. Build a character, add your own ruleset,
          or both.
        </p>

        <div className="byo-splash-stack">
          <div className="byo-panel byo-splash-card">
            <h3>Create a New Character</h3>
            <p className="byo-note">
              Build a character sheet from the SRD, or from a ruleset you've added. Saves to
              this browser as you go.
            </p>
            <button className="byo-btn byo-btn-go" onClick={onNewCharacter}>Start building</button>
          </div>

          <div className="byo-panel byo-splash-card">
            <h3>5e Ruleset Maker</h3>
            <p className="byo-note">
              Bring your own homebrew content, like spells, items, and classes, then use them in the character creator!
            </p>
            <button className="byo-btn" onClick={onAddRuleset}>Add a ruleset</button>
          </div>

          <div className="byo-panel byo-splash-card">
            <h3>Login / Register</h3>
            <p className="byo-note">
              {loginDisabled
                ? "Coming soon. Account sync isn't live yet, so for now your characters stay in this browser only."
                : "Sync characters and rulesets across devices."}
            </p>
            <button className="byo-btn" disabled={loginDisabled} onClick={loginAction}>{loginLabel}</button>
          </div>
        </div>

        <p className="byo-splash-footnote">
          Everything you build here stays in this browser until you choose to sign in and sync it.
        </p>
        <p className="byo-splash-footnote">
          <button className="byo-linkbtn" onClick={onTerms}>Terms of Service</button>
          {" · "}
          <button className="byo-linkbtn" onClick={onPrivacy}>Privacy Policy</button>
        </p>
      </div>
    </div>
  );
}
