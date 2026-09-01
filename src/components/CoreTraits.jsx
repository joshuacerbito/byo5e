/* ------------------------------------------------------------------
   Core Traits — the Class step's opening panel, laid out the way the
   book (and D&D Beyond) prints it: a collapsible header carrying the
   number of choices this section asks for, the "As a Level 1
   Character" preamble, then a two-column table of everything the class
   grants at level 1.

   The table is DESCRIPTIVE ONLY. Its "Skill Proficiencies" row states
   the size of the choice ("Choose 2") but NOT the pool — the picker
   passed in as children sits a few lines below and already spells every
   option out, and printing the same six names twice in a row taught the
   reader nothing. Starting equipment is different: its picker lives on
   the Inventory step, off this screen entirely, so that row carries the
   book's full prose line.
------------------------------------------------------------------- */
import React, { useState } from "react";
import { ABILITY_LABEL } from "../rules/abilities.js";

/* Full ability words, not the STR/DEX shorts primaryAbilityLabel emits:
   this table is prose, and the reference layout spells them out. The
   group shape is 5etools': an array of alternatives, where a group with
   more than one key means AND (Monk: DEX and WIS), not OR. */
const abilityWords = (groups) => (groups || [])
  .map((g) => g.map((k) => ABILITY_LABEL[k] || k.toUpperCase()).join(" and "))
  .join(" or ");

const listWords = (arr) => {
  const a = (arr || []).filter(Boolean);
  if (a.length <= 1) return a.join("");
  return `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;
};

/* One equipment line, as the book prints it. Prefer the source's own
   prose (`text`), which already reads "(a) a greataxe or (b) any
   martial melee weapon"; fall back to labelling the structured groups
   ourselves when a pack carries only those. */
function equipmentText(se) {
  if (!se) return null;
  if (se.text?.length) return se.text.join(" ");
  const lines = (se.groups || []).map((g) => {
    const opts = g.options.filter((o) => !o.fixed);
    const label = (o) => o.items.map((it) => `${it.name}${it.quantity > 1 ? ` ×${it.quantity}` : ""}`).join(" + ");
    if (!opts.length) return g.options.map(label).join(" + ");
    return `Choose ${opts.map((o) => o.key.toUpperCase()).join(" or ")}: ${opts.map((o) => `${o.key.toUpperCase()}) ${label(o)}`).join("; ")}`;
  });
  return lines.length ? lines.join(" ") : null;
}

const Chevron = ({ up }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
       style={{ transform: up ? "rotate(180deg)" : "none" }}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default function CoreTraits({ klass, skillChoiceText, skillsLeft, masteryChoiceText, masteryLeft, children }) {
  const [open, setOpen] = useState(true);
  const equip = equipmentText(klass.startingEquipment);
  /* Choices this section asks the player to make: the skill picker is
     always one, weapon mastery is one more when the class has the
     2024-only feature (masteryChoiceText only arrives non-null then —
     see weaponMasteryByLevel in content/classes.js), and starting
     equipment is one more whenever the class actually offers
     alternatives (its picker lives on Inventory, but the table row
     still announces the choice). */
  const choices = (klass.skillChoices?.count > 0 ? 1 : 0)
    + (masteryChoiceText ? 1 : 0)
    + ((klass.startingEquipment?.groups || []).some((g) => g.choice) ? 1 : 0);

  const rows = [
    ["Primary Ability", abilityWords(klass.primaryAbilityGroups)],
    ["Hit Point Die", klass.hitDie ? `D${klass.hitDie} per ${klass.name} level` : null],
    ["Saving Throw Proficiencies", listWords((klass.saves || []).map((s) => ABILITY_LABEL[s] || s.toUpperCase()))],
    ["Skill Proficiencies", skillChoiceText],
    ["Weapon Proficiencies", klass.weaponProf.fixed.join(", ") || "None"],
    ["Weapon Mastery", masteryChoiceText],
    ["Armor Training", klass.armorProf.fixed.join(", ") || "None"],
    ["Starting Equipment", equip],
  ].filter(([, v]) => v);

  return (
    <div className="byo-panel">
      {(skillsLeft > 0 || masteryLeft > 0) && <span className="byo-panel-flag" title="Needs your pick">⚠</span>}
      <button type="button" className="byo-ct-head" aria-expanded={open}
              onClick={() => setOpen((o) => !o)}>
        <span className="byo-ct-title">
          <span className="byo-ct-h3">Core {klass.name} Traits</span>
          <span className="byo-ct-sub">
            {choices} {choices === 1 ? "Choice" : "Choices"} · 1st level
          </span>
        </span>
        <span className="byo-ct-chev"><Chevron up={open} /></span>
      </button>

      {open && (
        <>
          <p className="byo-note byo-ct-lead">As a Level 1 Character:</p>
          <ul className="byo-ct-bullets">
            <li>Gain all the traits in the Core {klass.name} Traits table.</li>
            <li>Gain the {klass.name}'s level 1 features.</li>
          </ul>

          <div className="byo-ct-table">
            {rows.map(([label, value]) => (
              <div className="byo-ct-row" key={label}>
                <span className="byo-ct-k">{label}</span>
                <span className="byo-ct-v">{value}</span>
              </div>
            ))}
          </div>

          {children}
        </>
      )}
    </div>
  );
}
