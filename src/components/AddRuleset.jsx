import React, { useState, useRef } from "react";

/* Provisional prompt text for generating a user ruleset JSON by hand,
   via the user's own LLM. Our ruleset JSON format doesn't exist yet —
   this is a placeholder shaped after src/packs/*.json's envelope +
   content categories (see CLAUDE.md's Architecture section) so the
   generated file has a fighting chance of matching once the real
   schema lands. Replace wholesale when the schema is finalized. */
const RULESET_PROMPT = `You are helping me draft a "ruleset JSON" for Bring Your Own 5e, a D&D 5e \
character builder that reads content packs shaped like its built-in SRD packs.

NOTE: this prompt is PROVISIONAL. The app's user-ruleset JSON format is not finalized yet — \
treat everything below as a rough sketch of what a ruleset should contain, not a spec to \
follow exactly. Re-check for an updated version of this prompt before relying on the output.

Produce a single JSON object containing whatever subset of the following categories my \
ruleset needs. Model each category on the shape of a normal 5e SRD data file:

- classes: name, hit die, saving throw proficiencies, armor/weapon/tool proficiencies,
  starting equipment, and a level-by-level feature list
- ancestries (species/races): name, size, speed, traits, languages, ability bonuses
- backgrounds: name, skill proficiencies, tool/language proficiencies, starting equipment,
  a feature
- spells: name, level, school, casting time, range, components, duration, ritual/concentration
  flags, description, which class lists it belongs to
- items (weapons, armor, gear): name, category, cost, weight, damage/AC/properties as relevant
- feats: name, prerequisites, description, any mechanical benefits

Keep names, numbers and rules text as close to official 5e conventions as you can, and call
out anywhere you had to invent something. Output JSON only, no commentary.`;

/* Standalone screen — NOT one of the 9 wizard steps (see src/lib/steps.js).
   Reached from the Ruleset step's "Add Ruleset" button; CharacterCreator
   swaps its whole body for this component while open, then swaps back. */
export default function AddRuleset({ onBack }) {
  const [choice, setChoice] = useState(null); // null | "upload" | "prompt"
  const [fileState, setFileState] = useState(null); // { name, status, detail }
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileState({ name: file.name, status: "reading" });
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      // TODO(user rulesets): hand `parsed` off to a future loader in
      // src/content/ — a sibling to buildContent() in src/content/index.js
      // that validates and normalises a user-supplied ruleset the same way
      // buildContent() does for the generated SRD packs, then merges or
      // registers it as a selectable ruleset. That loader, and the schema
      // it expects, don't exist yet — this screen only reads the file and
      // stops here.
      setFileState({ name: file.name, status: "parsed", detail: `${Object.keys(parsed).length} top-level key(s)` });
    } catch (err) {
      setFileState({ name: file.name, status: "error", detail: String(err.message || err) });
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(RULESET_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="byo-root">
      <div className="byo-wrap">
        <button className="byo-linkbtn" onClick={onBack} style={{ marginBottom: 14 }}>← Back to Ruleset</button>
        <h1 className="byo-h1">Add Ruleset</h1>
        <p className="byo-h2">User-supplied content</p>
        <p className="byo-sub">
          This is a scaffold. The ruleset JSON format isn't finalized, and nothing uploaded
          here is wired into character creation yet.
        </p>

        <div className="byo-panel">
          <h3>How do you want to start?</h3>
          <div className="byo-choice">
            <button className={`byo-opt ${choice === "upload" ? "is-sel" : ""}`}
                    onClick={() => setChoice("upload")} aria-pressed={choice === "upload"}>
              Add ruleset JSON file
            </button>
            <button className={`byo-opt ${choice === "prompt" ? "is-sel" : ""}`}
                    onClick={() => setChoice("prompt")} aria-pressed={choice === "prompt"}>
              I don't have a ruleset JSON
            </button>
          </div>
        </div>

        {choice === "upload" && (
          <div className="byo-panel">
            <h3>Add ruleset JSON file</h3>
            <p className="byo-note" style={{ marginBottom: 10 }}>
              Pick a .json file. It's read and parsed here in the browser only — the format
              isn't defined yet, so nothing is validated or handed off to the character
              builder.
            </p>
            <input ref={fileInputRef} className="byo-input" type="file" accept=".json,application/json"
                   onChange={handleFile} aria-label="Ruleset JSON file" />
            {fileState?.status === "reading" && <p className="byo-note" style={{ marginTop: 10 }}>Reading {fileState.name}…</p>}
            {fileState?.status === "parsed" && (
              <p className="byo-note" style={{ marginTop: 10 }}>
                Parsed {fileState.name} — {fileState.detail}. Stub only: this build doesn't yet
                do anything further with it.
              </p>
            )}
            {fileState?.status === "error" && (
              <p className="byo-warn">Couldn't parse {fileState.name} as JSON: {fileState.detail}</p>
            )}
          </div>
        )}

        {choice === "prompt" && (
          <div className="byo-panel">
            <h3>Generate one with your own LLM</h3>
            <p className="byo-note" style={{ marginBottom: 10 }}>
              Our ruleset JSON format doesn't exist yet, so this is a provisional prompt
              describing roughly what a ruleset should contain — classes, ancestries,
              backgrounds, spells, items, and feats, modeled on this app's own SRD packs.
              Copy it into an LLM of your choice, then revisit this page once the real
              schema is finalized.
            </p>
            <textarea className="byo-out" readOnly rows={12} value={RULESET_PROMPT}
                      onFocus={(e) => e.target.select()} aria-label="Ruleset generation prompt" />
            <button className="byo-btn" style={{ marginTop: 10 }} onClick={copyPrompt}>
              {copied ? "Copied" : "Copy prompt"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
