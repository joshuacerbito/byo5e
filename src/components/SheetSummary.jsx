import React from "react";
import { fmt, mod } from "../rules/abilities.js";
import { groupWeapons, splitCastingTime, ACTION_ORDER, ACTION_LABELS, spellHitDC, spellEffect } from "../lib/derive.js";
import { formatCurrency } from "../lib/currency.js";
import FeatureBlocks from "./FeatureBlocks.jsx";

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
    savingThrows, skillTable, casting, chosenSpells, appendix, backstory,
    finalScore, attackRows, carriedWeapons, actions, ancestrySpells, abilities,
    chosenFeats, classFeatures, currency, gearList, toolsList, classLabel, hitDieLabel, totalCharLevel,
  } = ctx;

  const head = [ancestry?.name, klass ? (classLabel || `${klass.name} ${level}`) : null,
    subclass && subclassReady ? subclass.name : null, background?.name]
    .filter(Boolean).join(" · ");

  const weaponRows = groupWeapons(carriedWeapons || []);
  const gear = [...(gearList || []), ...(toolsList || [])];

  const classNow = classFeatures || [];
  const appendixGroups = [...new Set((appendix || []).map((a) => a.group))];

  /* Same column template for both tables so they read as one family. */
  const SPELL_COLS = "1.5fr .7fr .8fr .7fr .9fr .8fr";

  const Row = ({ label, value }) => (
    <div className="byo-row">
      <span className="byo-row-label">{label}</span>
      <span className="byo-mod" style={{ width: "auto" }}>{value}</span>
    </div>
  );

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

      {attackRows?.length > 0 && (
        <div className="byo-panel">
          <h3>Attacks</h3>
          <div className="byo-atk-table">
            <div className="byo-atk-row byo-atk-head">
              <span>Attack</span><span>Range</span><span>Hit / DC</span><span>Damage</span><span>Notes</span>
            </div>
            {attackRows.map((r) => (
              <div className="byo-atk-row" key={r.key}>
                <span className="byo-atk-name">{r.name}
                  {!r.proficient && <span className="byo-tag alt">not proficient</span>}</span>
                <span>{r.range}</span>
                <span className="byo-atk-num">{r.hitOrDC}</span>
                <span className="byo-atk-num">{r.damage}{r.dmgType ? ` ${r.dmgType}` : ""}</span>
                <span className="byo-atk-notes">{r.notes || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Name only, grouped by bucket, exactly as the printed sheet does
          it — the full text is in the feature sections further down. */}
      {actions?.length > 0 && (
        <div className="byo-panel">
          <h3>Class + Ancestry Actions</h3>
          {ACTION_ORDER.filter((k) => actions.some((a) => a.action === k)).map((k) => (
            <div key={k}>
              <div className="byo-actgroup-l">{ACTION_LABELS[k]}</div>
              {actions.filter((a) => a.action === k).map((a, i) => (
                <div className="byo-row" key={i}>
                  <span className="byo-row-label">{a.name}</span>
                  <span className="byo-mod" style={{ width: "auto" }}>{a.section}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

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

          {chosenSpells.length > 0 && (
            <div className="byo-atk-table" style={{ marginTop: 10 }}>
              <div className="byo-atk-row byo-atk-head" style={{ gridTemplateColumns: SPELL_COLS }}>
                <span>Spell</span><span>Lvl</span><span>Time</span><span>Range</span>
                <span>Hit / DC</span><span>Effect</span>
              </div>
              {chosenSpells.map((sp) => {
                const { head: time } = splitCastingTime(sp.time);
                return (
                  <div className="byo-atk-row" key={sp.name} style={{ gridTemplateColumns: SPELL_COLS }}>
                    <span className="byo-atk-name">{sp.name}</span>
                    <span className="byo-atk-num">{sp.level === 0 ? "C" : sp.level}{sp.higherLevels ? "+" : ""}</span>
                    <span>{time}</span>
                    <span>{sp.range}</span>
                    <span className="byo-atk-num">{spellHitDC(sp, casting)}</span>
                    <span className="byo-atk-num">{spellEffect(sp)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {ancestrySpells?.length > 0 && (
        <div className="byo-panel">
          <h3>Ancestry spells</h3>
          {ancestrySpells.map((sp) => (
            <div className="byo-trait" key={sp.key}>
              <div className="byo-trait-n">{sp.name}
                <span className="src">{sp.from}{sp.use ? ` — ${sp.use}` : ""}</span></div>
              <div className="byo-trait-t">
                {sp.level === 0 ? "Cantrip" : `Level ${sp.level}`}. {splitCastingTime(sp.time).head}, {sp.range}.
                {sp.ability ? ` DC ${sp.saveDC}, attack ${fmt(sp.attack)} (${sp.ability.toUpperCase()}).` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="byo-panel">
        <h3>Ancestry traits <span className="byo-count">{ancestry.name}</span></h3>
        {resolved.traits.map((t) => (
          <div className="byo-trait" key={t.name}>
            <div className="byo-trait-n">{t.name}</div>
            <div className="byo-trait-t"><FeatureBlocks blocks={t.blocks} /></div>
          </div>
        ))}
        {resolved.droppedTraits.length > 0 && (
          <p className="byo-note" style={{ marginTop: 10 }}>
            Replaced by this lineage: {resolved.droppedTraits.map((t) => t.name).join(", ")}.
          </p>
        )}
      </div>

      {classNow.length > 0 && (
        <div className="byo-panel">
          <h3>Features</h3>
          {classNow.map((f, i) => (
            <div className="byo-trait" key={`${f.level}-${f.name}-${i}`}>
              <div className="byo-trait-n">{f.name} <span className="src">level {f.level}</span></div>
              <div className="byo-trait-t"><FeatureBlocks blocks={f.blocks} /></div>
            </div>
          ))}
        </div>
      )}

      {chosenFeats?.length > 0 && (
        <div className="byo-panel">
          <h3>Feats</h3>
          {chosenFeats.map(({ feat, from, bonus }) => (
            <div className="byo-trait" key={feat.id}>
              <div className="byo-trait-n">{feat.name}
                <span className="src">{from}{bonus ? ` · ${bonus}` : ""}</span></div>
              <div className="byo-trait-t"><FeatureBlocks blocks={feat.blocks} /></div>
            </div>
          ))}
        </div>
      )}

      {background?.feature && (
        <div className="byo-panel">
          <h3>Background <span className="byo-count">{background.name}</span></h3>
          <div className="byo-trait">
            <div className="byo-trait-n">{background.feature.name}</div>
            <div className="byo-trait-t"><FeatureBlocks blocks={background.feature.blocks} /></div>
          </div>
        </div>
      )}

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
