import React from "react";
import { fmt, mod } from "../rules/abilities.js";
import { groupWeapons } from "../lib/derive.js";
import { formatCurrency } from "../lib/currency.js";
import FeatureBlocks from "./FeatureBlocks.jsx";
import ActionsPanel from "./ActionsPanel.jsx";
import FeaturesPanel from "./FeaturesPanel.jsx";

/* ------------------------------------------------------------------
   The Sheet step's on-screen summary: everything the printed sheet
   carries, in the app's own dark styling rather than the sheet's
   parchment. It reads the same `sheetCtx` object the three export
   routes read, so a field missing here is a field missing there — and
   nothing new has to be threaded through to keep it in step.

   Deliberately not an iframe of buildSheetHTML(): that sheet is a
   light-ground A4 document, and dropping one into a dark phone UI
   would be unreadable at the table, which is the whole reason the app
   is dark in the first place.

   The one thing it does NOT reproduce is the sheet's compact spell
   and attack columns at print widths — it reuses the app's own
   `byo-atk-row` grid, overriding the column template inline the way
   SpellTableRow already does.
------------------------------------------------------------------- */
export default function SheetSummary({ ctx }) {
  const {
    ancestry, klass, level, subclass, subclassReady, background, name, resolved,
    armorClass, hitPoints, speed, initiative, passiveSkills, pb, armor, shieldOn,
    savingThrows, skillTable, casting, appendix, backstory,
    finalScore, carriedWeapons, abilities,
    currency, gearList, toolsList, classLabel, hitDieLabel, totalCharLevel,
  } = ctx;

  // classLabel already carries each class's own subclass in parens
  // ("Fighter 3 (Champion)"), so don't append subclass again here — and
  // background isn't part of the identity line, it gets its own panel below.
  const head = [ancestry?.name, klass ? (classLabel || `${klass.name} ${level}`) : null]
    .filter(Boolean).join(" · ");

  const weaponRows = groupWeapons(carriedWeapons || []);
  const gear = [...(gearList || []), ...(toolsList || [])];

  const Row = ({ label, value }) => (
    <div className="byo-row">
      <span className="byo-row-label">{label}</span>
      <span className="byo-mod" style={{ width: "auto" }}>{value}</span>
    </div>
  );

  const appendixGroups = [...new Set((appendix || []).map((a) => a.group))];

  return (
    <>
      <div className="byo-panel">
        <h3 className="byo-sum-name">{name.trim() || "Unnamed"}</h3>
        <p className="byo-note byo-sum-head">{head}</p>
      </div>

      {abilities?.length > 0 && (
        <div className="byo-sum-block">
          <h3 className="byo-sum-h">Abilities</h3>
          <div className="byo-sum byo-sum-lg">
            {abilities.map((a) => (
              <div className="byo-sum-c" key={a.key}>
                <div className="byo-sum-k">{a.key.toUpperCase()}</div>
                <div className="byo-sum-v">{a.mod}</div>
                <div className="byo-sum-m">{a.score}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {klass && (
        <div className="byo-sum-block">
          <h3 className="byo-sum-h">Vitals</h3>
          <div className="byo-vitals byo-vitals-5">
            <div className="byo-vital byo-vital-ac"><div className="byo-vital-n">{armorClass}</div><div className="byo-vital-l">AC</div></div>
            <div className="byo-vital byo-vital-hp">
              <div className="byo-vital-n">{hitPoints}</div>
              {/* hitPoints() (rules/combat.js) is exactly hitDie + (level-1)×avg,
                  plus the Con modifier once per level — so that second term is
                  what actually adds up to the total above. */}
              <div className="byo-vital-l">HP ({hitDieLabel || `${level}d${klass.hitDie}`}{fmt(mod(finalScore("con")) * (totalCharLevel ?? level))})</div>
            </div>
            <div className="byo-vital byo-vital-pb"><div className="byo-vital-n">{fmt(pb)}</div><div className="byo-vital-l">Proficiency</div></div>
            <div className="byo-vital byo-vital-init"><div className="byo-vital-n">{fmt(initiative)}</div><div className="byo-vital-l">Initiative</div></div>
            <div className="byo-vital byo-vital-speed"><div className="byo-vital-n">{speed}</div><div className="byo-vital-l">Speed</div></div>
          </div>
        </div>
      )}

      {/* Skills gets its own half, spanning all three of the others stacked
          down the other half — eighteen skills in one column runs about as
          tall as those three panels combined, so the two halves read as
          roughly even. Four independent grid items (not skills-plus-a-
          wrapper) so mobile can reorder them individually below. */}
      {(skillTable.length > 0 || savingThrows.length > 0 || passiveSkills.length > 0) && (
        <div className="byo-summary-split">
          {skillTable.length > 0 && (
            <div className="byo-panel byo-sum-skills">
              <h3>Skills</h3>
              {skillTable.map((s) => (
                <div className="byo-row" key={s.name}>
                  <span className={`byo-dot${s.proficient ? " is-on" : ""}`} aria-hidden="true" />
                  <span className="byo-row-label">{s.name} <span className="byo-skab">({s.ability.toUpperCase()})</span></span>
                  <span className="byo-final">{fmt(s.value)}</span>
                </div>
              ))}
            </div>
          )}

          {savingThrows.length > 0 && (
            <div className="byo-panel byo-sum-saves">
              <h3>Saving throws</h3>
              {savingThrows.map((s) => (
                <div className="byo-row" key={s.key}>
                  <span className={`byo-dot${s.proficient ? " is-on" : ""}`} aria-hidden="true" />
                  <span className="byo-row-label">{s.label}</span>
                  <span className="byo-final">{fmt(s.value)}</span>
                </div>
              ))}
            </div>
          )}

          {passiveSkills.length > 0 && (
            <div className="byo-panel byo-sum-passive">
              <h3>Passive skills</h3>
              {passiveSkills.map((p) => (
                <Row key={p.name} label={`Passive ${p.name}`} value={p.value} />
              ))}
            </div>
          )}

          <div className="byo-panel byo-sum-core">
            <h3>Core</h3>
            <Row label="Size" value={resolved.size} />
            {resolved.darkvision > 0 && <Row label="Darkvision" value={`${resolved.darkvision} ft`} />}
            {resolved.blindsight > 0 && <Row label="Blindsight" value={`${resolved.blindsight} ft`} />}
            <Row label="Languages" value={resolved.languages.join(", ")} />
            {armor && (
              <Row label="Armor" value={armor.id === "none"
                ? (shieldOn ? "Shield only" : "None")
                : `${armor.name}${shieldOn ? " + shield" : ""}`} />
            )}
          </div>
        </div>
      )}

      {/* Everything you can spend an action, bonus action, or reaction on
          in a fight — weapon attacks, spells (sorted into their own tab
          by casting time), and class/ancestry actions — collected under
          one set of tabs so combat options read together instead of
          being scattered across the Attacks/Spellcasting/traits panels.
          Shared with the Sheet page (src/components/ActionsPanel.jsx);
          no onSelect here, so the rows stay inert. */}
      <ActionsPanel ctx={ctx} />

      {casting && !casting.pending && (
        <div className="byo-panel">
          <h3>Spellcasting <span className="byo-count">{casting.label}</span></h3>
          <Row label="Save DC" value={casting.saveDC} />
          <Row label="Attack" value={fmt(casting.attack)} />
          <Row label="Ability" value={casting.ability.toUpperCase()} />
          {casting.slots?.length > 0 && (
            <Row label="Slots" value={casting.slots
              .map((n, i) => `${i + 1}${["st", "nd", "rd"][i] || "th"} ×${n}`).join("  ")} />
          )}
          {casting.pact && (
            <Row label="Pact Magic" value={`${casting.pact.count} at level ${casting.pact.level}`} />
          )}
          {casting.prepared != null && <Row label="Prepared" value={casting.prepared} />}
          {casting.known != null && <Row label="Known" value={casting.known} />}
          {casting.spellbook != null && <Row label="Spellbook" value={casting.spellbook} />}
          {/* The spell list itself lives in the Actions panel's Spells /
              Bonus Actions / Reactions tabs, sorted by casting time. */}
        </div>
      )}

      {/* Class features (tabbed per class when multiclassed), ancestry
          traits, feats and the background feature — also shared with the
          Sheet page, and also inert without onSelect. */}
      <FeaturesPanel ctx={ctx} />

      <div className="byo-panel">
        <h3>Inventory</h3>
        {weaponRows.length > 0 && (
          <Row label="Weapons" value={weaponRows
            .map((r) => r.weapon.name + (r.qty > 1 ? ` ×${r.qty}` : "")).join(", ")} />
        )}
        <Row label="Armor" value={armor && armor.id !== "none"
          ? `${armor.name}${shieldOn ? " + shield" : ""}`
          : (shieldOn ? "Shield only" : "None")} />
        {gear.length > 0 && <Row label="Gear" value={gear.join(", ")} />}
        <Row label="Currency" value={formatCurrency(currency)} />
      </div>

      {(backstory || "").trim() && (
        <div className="byo-panel">
          <h3>Backstory</h3>
          {(backstory || "").trim().split(/\n\s*\n/).map((block, i) => (
            <p className="byo-trait-t" key={i} style={{ whiteSpace: "pre-line" }}>{block.trim()}</p>
          ))}
        </div>
      )}

      {appendixGroups.length > 0 && (
        <div className="byo-panel">
          <h3>Reference <span className="byo-count">{appendix.length}</span></h3>
          {appendixGroups.map((g) => (
            <div key={g}>
              <div className="byo-actgroup-l">{g}</div>
              {appendix.filter((a) => a.group === g).map((a, i) => (
                <div className="byo-trait" key={`${g}-${i}`}>
                  <div className="byo-trait-n">{a.name}</div>
                  <div className="byo-trait-t"><FeatureBlocks blocks={a.blocks} /></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
