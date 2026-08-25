import React from "react";
import { fmt, groupWeapons, parseStartingGold, splitCastingTime,
  ACTION_ORDER, ACTION_LABELS, spellHitDC, spellEffect, spellMark,
  spellMarkNotes } from "../lib/derive.js";

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
   `su-atk-row` grid, overriding the column template inline the way
   SpellTableRow already does.
------------------------------------------------------------------- */
export default function SheetSummary({ ctx }) {
  const {
    ancestry, klass, level, subclass, subclassReady, background, name, resolved,
    armorClass, hitPoints, speed, initiative, passiveSkills, pb, armor, shieldOn,
    savingThrows, skillTable, casting, chosenSpells, otherSpells, appendix,
    bgChoice, finalScore, attackRows, carriedWeapons, actions, ancestrySpells,
    chosenFeats, classFeatures,
  } = ctx;

  const head = [ancestry?.name, klass ? `${klass.name} ${level}` : null,
    subclass && subclassReady ? subclass.name : null, background?.name]
    .filter(Boolean).join(" · ");

  const weaponRows = groupWeapons(carriedWeapons || []);
  const gold = parseStartingGold(background);
  const gear = [...(klass?.startingEquipment?.gear || []), ...gold.items,
    ...(background?.tools || [])];

  const classNow = (classFeatures || []).filter((f) => f[0] <= level);
  const subNow = subclass && subclassReady
    ? subclass.features.filter((f) => f[0] <= level) : [];
  const appendixGroups = [...new Set((appendix || []).map((a) => a.group))];

  /* Same column template for both tables so they read as one family. */
  const SPELL_COLS = "1.5fr .7fr .8fr .7fr .9fr .8fr";

  const Row = ({ label, value }) => (
    <div className="su-row">
      <span className="su-row-label">{label}</span>
      <span className="su-mod" style={{ width: "auto" }}>{value}</span>
    </div>
  );

  return (
    <>
      <div className="su-panel">
        <h3>{name.trim() || "Unnamed"}</h3>
        <p className="su-note">{head}</p>
      </div>

      {klass && (
        <div className="su-vitals">
          {[["AC", armorClass], ["HP", hitPoints], ["Initiative", fmt(initiative)],
            ["Speed", speed]].map(([l, v]) => (
            <div className="su-vital" key={l}>
              <div className="su-vital-n">{v}</div>
              <div className="su-vital-l">{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* No ability strip here: the app's own live one (SinaUnaCreator's
          `su-sum` block) is pinned above the step content from the
          Abilities step onward and shows the identical six numbers. The
          printed sheet has its own because it has no such running
          header. */}

      <div className="su-panel">
        <h3>Core</h3>
        {klass && <Row label="Hit die" value={`d${klass.hitDie}`} />}
        <Row label="Proficiency" value={fmt(pb)} />
        <Row label="Size" value={resolved.size} />
        {resolved.darkvision > 0 && <Row label="Darkvision" value={`${resolved.darkvision} ft`} />}
        {resolved.blindsight > 0 && <Row label="Blindsight" value={`${resolved.blindsight} ft`} />}
        <Row label="Languages" value={resolved.languages.join(", ")} />
        {armor && (
          <Row label="Armor" value={armor.id === "none"
            ? (shieldOn ? "Shield only" : "None")
            : `${armor.name}${shieldOn ? " + shield" : ""}`} />
        )}
        {passiveSkills.map((p) => (
          <Row key={p.name} label={`Passive ${p.name}`} value={p.value} />
        ))}
      </div>

      {savingThrows.length > 0 && (
        <div className="su-panel">
          <h3>Saving throws</h3>
          {savingThrows.map((s) => (
            <div className="su-row" key={s.key}>
              <span className={`su-dot${s.proficient ? " is-on" : ""}`} aria-hidden="true" />
              <span className="su-row-label">{s.label}</span>
              <span className="su-final">{fmt(s.value)}</span>
            </div>
          ))}
        </div>
      )}

      {skillTable.length > 0 && (
        <div className="su-panel">
          <h3>Skills</h3>
          {/* Two tracks, the same shape the printed sheet's .sk grid uses —
              eighteen skills is a long single column to scan. */}
          <div className="su-sk-grid">
            {skillTable.map((s) => (
              <div className="su-row" key={s.name}>
                <span className={`su-dot${s.proficient ? " is-on" : ""}`} aria-hidden="true" />
                <span className="su-row-label">{s.name}
                  <span className="su-ac-parts">{s.ability}</span></span>
                <span className="su-final">{fmt(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {attackRows?.length > 0 && (
        <div className="su-panel">
          <h3>Attacks</h3>
          <div className="su-atk-table">
            <div className="su-atk-row su-atk-head">
              <span>Attack</span><span>Range</span><span>Hit / DC</span><span>Damage</span><span>Notes</span>
            </div>
            {attackRows.map((r) => (
              <div className="su-atk-row" key={r.key}>
                <span className="su-atk-name">{r.name}
                  {!r.proficient && <span className="su-tag alt">not proficient</span>}</span>
                <span>{r.range}</span>
                <span className="su-atk-num">{r.hitOrDC}</span>
                <span className="su-atk-num">{r.damage}{r.dmgType ? ` ${r.dmgType}` : ""}</span>
                <span className="su-atk-notes">{r.notes || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Name only, grouped by bucket, exactly as the printed sheet does
          it — the full text is in the feature sections further down. */}
      {actions?.length > 0 && (
        <div className="su-panel">
          <h3>Class + Ancestry Actions</h3>
          {ACTION_ORDER.filter((k) => actions.some((a) => a.action === k)).map((k) => (
            <div key={k}>
              <div className="su-actgroup-l">{ACTION_LABELS[k]}</div>
              {actions.filter((a) => a.action === k).map((a, i) => (
                <div className="su-row" key={i}>
                  <span className="su-row-label">{a.name}</span>
                  <span className="su-mod" style={{ width: "auto" }}>{a.section}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {casting && !casting.pending && (
        <div className="su-panel">
          <h3>Spellcasting <span className="su-count">{casting.label}</span></h3>
          <Row label="Save DC" value={casting.saveDC} />
          <Row label="Attack" value={fmt(casting.attack)} />
          <Row label="Ability" value={casting.ability.toUpperCase()} />
          {casting.slots?.length > 0 && (
            <Row label="Slots" value={casting.slots
              .map((n, i) => `${i + 1}${["st", "nd", "rd"][i] || "th"} ×${n}`).join("  ")} />
          )}
          {casting.pact && (
            <Row label="Pact Magic" value={`${casting.pact.n} at level ${casting.pact.lvl}`} />
          )}
          {casting.prepared != null && <Row label="Prepared" value={casting.prepared} />}
          {casting.known != null && <Row label="Known" value={casting.known} />}
          {casting.spellbook != null && <Row label="Spellbook" value={casting.spellbook} />}

          {chosenSpells.length > 0 && (
            <div className="su-atk-table" style={{ marginTop: 10 }}>
              <div className="su-atk-row su-atk-head" style={{ gridTemplateColumns: SPELL_COLS }}>
                <span>Spell</span><span>Lvl</span><span>Time</span><span>Range</span>
                <span>Hit / DC</span><span>Effect</span>
              </div>
              {chosenSpells.map((sp) => {
                const { head: time } = splitCastingTime(sp.time);
                const mark = spellMark(sp);
                return (
                  <div className="su-atk-row" key={sp.name} style={{ gridTemplateColumns: SPELL_COLS }}>
                    <span className="su-atk-name">{sp.name}{mark ? ` ${mark}` : ""}</span>
                    <span className="su-atk-num">{sp.level === 0 ? "C" : sp.level}{sp.higher ? "+" : ""}</span>
                    <span>{time}</span>
                    <span>{sp.range}</span>
                    <span className="su-atk-num">{spellHitDC(sp, casting)}</span>
                    <span className="su-atk-num">{spellEffect(sp)}</span>
                  </div>
                );
              })}
            </div>
          )}
          {spellMarkNotes(chosenSpells).map((n) => (
            <p className="su-note" key={n} style={{ marginTop: 6 }}>{n}</p>
          ))}
          {otherSpells.trim() && (
            <p className="su-note" style={{ marginTop: 6 }}>
              Other: {otherSpells.split("\n").map((x) => x.trim()).filter(Boolean).join(", ")}.
            </p>
          )}
        </div>
      )}

      {ancestrySpells?.length > 0 && (
        <div className="su-panel">
          <h3>Ancestry spells</h3>
          {ancestrySpells.map((sp) => (
            <div className="su-trait" key={sp.key}>
              <div className="su-trait-n">{sp.name}
                <span className="src">{sp.from}{sp.use ? ` — ${sp.use}` : ""}</span></div>
              <div className="su-trait-t">
                {sp.level === 0 ? "Cantrip" : `Level ${sp.level}`}. {splitCastingTime(sp.time).head}, {sp.range}.
                {sp.ability ? ` DC ${sp.saveDC}, attack ${fmt(sp.attack)} (${sp.ability.toUpperCase()}).` : ""}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="su-panel">
        <h3>Ancestry traits <span className="su-count">{ancestry.name}</span></h3>
        {resolved.traits.map((t) => (
          <div className="su-trait" key={t.name}>
            <div className="su-trait-n">{t.name}</div>
            <div className="su-trait-t">{t.text}</div>
          </div>
        ))}
        {resolved.droppedTraits.length > 0 && (
          <p className="su-note" style={{ marginTop: 10 }}>
            Replaced by this lineage: {resolved.droppedTraits.map((t) => t.name).join(", ")}.
          </p>
        )}
      </div>

      {classNow.length > 0 && (
        <div className="su-panel">
          <h3>{klass.name} features</h3>
          {classNow.map((f, i) => (
            <div className="su-trait" key={`${f[0]}-${f[1]}-${i}`}>
              <div className="su-trait-n">{f[1]} <span className="src">level {f[0]}</span></div>
              <div className="su-trait-t">{f[2]}</div>
            </div>
          ))}
        </div>
      )}

      {subNow.length > 0 && (
        <div className="su-panel">
          <h3>{subclass.name} <span className="su-count">{subclass.group}</span></h3>
          {subNow.map((f, i) => (
            <div className="su-trait" key={`${f[0]}-${f[1]}-${i}`}>
              <div className="su-trait-n">{f[1]} <span className="src">level {f[0]}</span></div>
              <div className="su-trait-t">
                {f[2] || `Gained at level ${f[0]}.${subclass.page ? ` See p.${subclass.page}.` : ""}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {chosenFeats?.length > 0 && (
        <div className="su-panel">
          <h3>Feats</h3>
          {chosenFeats.map(({ feat, from, ability }) => {
            const key = feat.ability?.fixed || ability;
            return (
              <div className="su-trait" key={feat.id}>
                <div className="su-trait-n">{feat.name}
                  <span className="src">{from}
                    {feat.ability && key ? ` · +${feat.ability.amount} ${key.toUpperCase()}` : ""}</span></div>
                <div className="su-trait-t">{feat.text}</div>
              </div>
            );
          })}
        </div>
      )}

      {background && (
        <div className="su-panel">
          <h3>Background <span className="su-count">{background.name}</span></h3>
          <div className="su-trait">
            <div className="su-trait-n">{background.feature.name}</div>
            <div className="su-trait-t">{background.feature.text}</div>
          </div>
          {bgChoice && background.choice && (
            <div className="su-trait">
              <div className="su-trait-n">{background.choice.name}</div>
              <div className="su-trait-t">{bgChoice}</div>
            </div>
          )}
        </div>
      )}

      <div className="su-panel">
        <h3>Inventory</h3>
        {weaponRows.length > 0 && (
          <Row label="Weapons" value={weaponRows
            .map((r) => r.weapon.name + (r.qty > 1 ? ` ×${r.qty}` : "")).join(", ")} />
        )}
        <Row label="Armor" value={armor && armor.id !== "none"
          ? `${armor.name}${shieldOn ? " + shield" : ""}`
          : (shieldOn ? "Shield only" : "None")} />
        {gear.length > 0 && <Row label="Gear" value={gear.join(", ")} />}
        <Row label="Currency" value={`${gold.gp} gp`} />
      </div>

      {appendixGroups.length > 0 && (
        <div className="su-panel">
          <h3>Reference <span className="su-count">{appendix.length}</span></h3>
          {appendixGroups.map((g) => (
            <div key={g}>
              <div className="su-actgroup-l">{g}</div>
              {appendix.filter((a) => a.group === g).map((a, i) => (
                <div className="su-trait" key={`${g}-${i}`}>
                  <div className="su-trait-n">{a.name}</div>
                  <div className="su-trait-t">{a.text}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
