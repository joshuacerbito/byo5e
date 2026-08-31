import { useState } from "react";
import { splitCastingTime, spellHitDC } from "../lib/derive.js";
import { spellEntry, weaponEntry, featureEntry } from "../lib/sheetEntries.js";
import DamageType from "./DamageType.jsx";
import { basicActions } from "../content/basicActions.js";
import Accordion, { AccordionSection } from "./Accordion.jsx";
import FeatureBlocks from "./FeatureBlocks.jsx";

/* ------------------------------------------------------------------
   Everything you can spend an action, bonus action or reaction on —
   weapon attacks, spells (sorted into their own tab by casting time),
   and class/ancestry actions — under one set of tabs, so combat options
   read together instead of being scattered across separate panels.

   Shared by the wizard's Summary step and the Sheet page. The only
   difference between the two is `onSelect`: pass it (the Sheet) and
   every row becomes a button that opens the description drawer; leave
   it off (Summary) and the rows are inert, exactly as they were before
   this panel was pulled out of SheetSummary.
------------------------------------------------------------------- */

/* Which action-economy bucket a spell falls in, from its casting time
   text — "1 bonus action" / "1 reaction, which you take when..." sort
   the spell into the matching tab. Anything else (1 action, 1 minute,
   rituals) reads as a plain action. */
/* The Effect cell, as markup rather than derive.js's spellEffect()
   string: the damage type becomes a glyph, which a string can't carry.
   spellEffect() itself stays exactly as it is — the printed sheet and
   both PDF routes render it, and those have no icons. */
const EffectCell = ({ sp }) => {
  if (sp.heal) return <>{sp.heal}</>;
  if (sp.dmg) return <>{sp.dmg}{sp.dmgType ? <DamageType type={sp.dmgType} /> : null}</>;
  if (sp.cond) return <>{sp.cond[0].toUpperCase() + sp.cond.slice(1)}</>;
  return <>—</>;
};

/* D&D Beyond's trick for fitting six columns on one line is mostly
   abbreviation: "1A", not "1 action". Both forms are rendered and CSS
   picks one (see the byo-abbr-full/byo-abbr-short rules in styles.js) —
   the alternative is
   matchMedia state in a component that otherwise has none, and a
   breakpoint that could then disagree with the grid's own.

   Only the units 5e actually prints as a casting time are mapped;
   anything else (a condition-laden head, a homebrew unit) falls back to
   the full text, which is never wrong, only wider. */
const TIME_UNITS = { action: "A", "bonus action": "BA", reaction: "R", round: "rd",
  minute: "m", hour: "h", day: "d", week: "w" };

const abbrTime = (time) => {
  const m = /^(\d+)\s+(bonus action|action|reaction|round|minute|hour|day|week)s?$/i.exec((time || "").trim());
  if (!m) return time;
  return `${m[1]}${TIME_UNITS[m[2].toLowerCase()]}`;
};

/* "Self (30-foot sphere)" -> "Self", "20 / 60 ft" -> "20/60": the shape
   is in the drawer, and the unit is already named by the column header,
   so both are width spent on nothing. Miles keep their unit — those
   would read as feet otherwise — just shortened. Touch/Self/Sight and
   the rest are words, and pass through untouched. */
const abbrRange = (range) => (range || "")
  .replace(/\s*\(.*\)\s*$/, "")
  .replace(/\bmiles?\b/i, "mi")
  .replace(/\s*\bft\b\.?$/i, "")
  .replace(/\s*\/\s*/g, "/");

/* "1/long rest" -> "1/LR". Unlike time and range this one is
   abbreviated at every width, not just in the dense band: it rides
   inside the name cell, which is the column under pressure in BOTH
   narrow layouts, and 1/LR is how a character sheet has always written
   it. The drawer still spells the cadence out in full. */
const abbrUse = (use) => (use || "")
  .replace(/\blong rest\b/i, "LR")
  .replace(/\bshort rest\b/i, "SR");

/* One cell, both widths — see abbrTime. */
const Abbr = ({ full, short }) => (short === full ? full : (
  <>
    <span className="byo-abbr-full">{full}</span>
    <span className="byo-abbr-short">{short}</span>
  </>
));

const spellBucket = (time) => {
  const head = splitCastingTime(time).head || "";
  if (/bonus action/i.test(head)) return "bonus";
  if (/reaction/i.test(head)) return "reaction";
  return "action";
};

/* A row that's a button on the Sheet and a plain div on Summary. Not a
   literal <button> even when interactive: the spell/attack rows are
   grid containers full of spans, and a <button>'s content model is
   phrasing content only — same reasoning as SpellTableRow. */
function Clickable({ className, style, onOpen, children }) {
  if (!onOpen) return <div className={className} style={style}>{children}</div>;
  return (
    <div className={`${className} is-tap`} style={style} role="button" tabIndex={0}
         onClick={onOpen}
         onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}>
      {children}
    </div>
  );
}

export default function ActionsPanel({ ctx, onSelect, header = "Actions", extraTabs = [] }) {
  const { casting, chosenSpells, ancestrySpells, actions, attackRows, attacksPerAction, edition } = ctx;

  const spellsIn = (bucket) => (chosenSpells || []).filter((sp) => spellBucket(sp.time) === bucket);
  const ancestrySpellsIn = (bucket) => (ancestrySpells || []).filter((sp) => spellBucket(sp.time) === bucket);
  const actionsIn = (bucket) => (actions || []).filter((a) => a.action === bucket);

  /* A chosen (class) spell reads its Hit/DC off the character's own
     casting stats; an ancestry-granted spell carries its own ability/DC
     on the entry itself, so spellHitDC just gets handed a stand-in
     `casting` shaped from those instead. Same row shape either way —
     that's the whole point, one table format for every spell. */
  const spellTable = (list) => (
    /* .byo-atk-row-spell, not an inline grid-template-columns: an inline
       style outranks every media query, which is what pinned this table
       at six cramped columns on a phone. The class carries the same
       six-column desktop ratio AND the 3-across mobile regroup the spell
       picker already uses. */
    <div className="byo-atk-table" style={{ marginTop: 10 }}>
      <div className="byo-atk-row byo-atk-row-spell byo-atk-head">
        <span>Spell</span><span>Lvl</span><span>Time</span><span>Range</span>
        <span><Abbr full="Hit / DC" short="Hit/DC" /></span><span>Effect</span>
      </div>
      {list.map((sp) => {
        const { head: time } = splitCastingTime(sp.time);
        const hitDC = sp.from ? spellHitDC(sp, { attack: sp.attack, saveDC: sp.saveDC }) : spellHitDC(sp, casting);
        return (
          <Clickable className="byo-atk-row byo-atk-row-spell" key={sp.key || sp.name}
                     onOpen={onSelect && (() => onSelect(spellEntry(sp, casting)))}>
            {/* Name only — no "— Tiefling" source qualifier. The sublists
                above already say where a spell came from, and the
                repeated tag was the widest thing in the narrowest
                column. The use cadence stays: that's a resource you
                spend, not a label. */}
            <span className="byo-atk-name">{sp.name}
              {sp.use && <span className="src" title={sp.use}>{abbrUse(sp.use)}</span>}</span>
            {/* Own class so the phone layout can turn the level column
                into a badge in the row's left gutter — the slot D&D
                Beyond gives its Cast/Use button. */}
            <span className="byo-atk-num byo-atk-lvl">{sp.level === 0 ? "C" : sp.level}{sp.higherLevels ? "+" : ""}</span>
            <span><Abbr full={time} short={abbrTime(time)} /></span>
            <span><Abbr full={sp.range} short={abbrRange(sp.range)} /></span>
            <span className="byo-atk-num">{hitDC}</span>
            <span className={`byo-atk-num byo-atk-eff${sp.heal || sp.dmg || sp.cond ? " is-boxed" : ""}`}>
              <EffectCell sp={sp} />
            </span>
          </Clickable>
        );
      })}
    </div>
  );

  const actionRows = (list) => list.map((a, i) => (
    <Clickable className="byo-row" key={i} onOpen={onSelect && (() => onSelect(featureEntry(a, a.section)))}>
      <span className="byo-row-label">{a.name}</span>
      <span className="byo-mod" style={{ width: "auto" }}>{a.section}</span>
    </Clickable>
  ));

  /* Bonus Actions / Reactions mix three kinds of source — class/subclass
     features, spells, and ancestry traits — so instead of one flat list,
     break them into labeled sublists. Each row still carries its own
     source, this just groups them. */
  const actionSublist = (bucket) => {
    const spellsAll = [...spellsIn(bucket), ...ancestrySpellsIn(bucket)];
    const ac = actionsIn(bucket);
    const classFeats = ac.filter((a) => a.category === "class");
    const other = ac.filter((a) => a.category !== "class");
    if (!spellsAll.length && !ac.length) return null;
    return (
      <>
        {classFeats.length > 0 && (
          <div className="byo-actionsub"><h4>Class Features</h4>{actionRows(classFeats)}</div>
        )}
        {spellsAll.length > 0 && (
          <div className="byo-actionsub"><h4>Spells</h4>{spellTable(spellsAll)}</div>
        )}
        {other.length > 0 && (
          <div className="byo-actionsub"><h4>Other</h4>{actionRows(other)}</div>
        )}
      </>
    );
  };

  /* Cantrips, leveled spells that spend a slot, and limited-use grants
     (Tiefling's Fiendish Legacy, etc. — anything with a `use` cadence)
     read as three different things at the table, so they get their own
     sublists. `use` wins over level: a limited-use spell is never "just"
     a cantrip or a leveled spell, however it's costed. */
  const spellSublists = (list) => {
    const limited = list.filter((sp) => sp.use);
    const rest = list.filter((sp) => !sp.use);
    const cantrips = rest.filter((sp) => sp.level === 0);
    const leveled = rest.filter((sp) => sp.level > 0);
    if (!list.length) return null;
    return (
      <>
        {cantrips.length > 0 && <div className="byo-actionsub"><h4>Cantrips</h4>{spellTable(cantrips)}</div>}
        {leveled.length > 0 && <div className="byo-actionsub"><h4>Leveled Spells</h4>{spellTable(leveled)}</div>}
        {limited.length > 0 && <div className="byo-actionsub"><h4>Limited Spells</h4>{spellTable(limited)}</div>}
      </>
    );
  };

  const TABS = [
    {
      key: "attacks", label: "Attacks",
      content: attackRows?.length > 0 && (
        <div className="byo-atk-table">
          {attacksPerAction > 1 && (
            <p className="byo-note" style={{ marginBottom: 10 }}>
              Extra Attack: {attacksPerAction} attacks with the Attack action.
            </p>
          )}
          <div className="byo-atk-row byo-atk-head">
            <span>Attack</span><span>Range</span>
            <span><Abbr full="Hit / DC" short="Hit/DC" /></span>
            <span>Damage</span><span>Notes</span>
          </div>
          {attackRows.map((r) => (
            <Clickable className="byo-atk-row" key={r.key} onOpen={onSelect && (() => onSelect(weaponEntry(r)))}>
              <span className="byo-atk-name">{r.name}
                {!r.proficient && <span className="byo-tag alt">not proficient</span>}</span>
              <span><Abbr full={r.range} short={abbrRange(r.range)} /></span>
              <span className="byo-atk-num">{r.hitOrDC}</span>
              <span className={`byo-atk-num byo-atk-eff${r.damage && r.damage !== "—" ? " is-boxed" : ""}`}>
                {r.damage}{r.dmgType ? <DamageType type={r.dmgType} /> : null}</span>
              <span className="byo-atk-notes">{r.notes || "—"}</span>
            </Clickable>
          ))}
        </div>
      ),
    },
    { key: "spells", label: "Spells", content: spellSublists([...spellsIn("action"), ...ancestrySpellsIn("action")]) },
    { key: "bonus", label: "Bonus", content: actionSublist("bonus") },
    { key: "reactions", label: "Reactions", content: actionSublist("reaction") },
    {
      /* Everything a turn can be spent on that isn't an attack, a spell
         or a bonus action/reaction: this character's own leftover
         actions first, then the ones every character has (Dash,
         Disengage, ...). The standard list is edition-specific and
         hand-authored — see src/content/basicActions.js. */
      key: "other", label: "Other",
      content: (() => {
        const ac = [...actionsIn("action"), ...actionsIn("free")];
        const basics = basicActions(edition);
        /* Accordions rather than drawer rows here: this is the tab you
           read down when you're learning what a turn can hold, not one
           you tap once mid-combat, and a drawer makes reading four
           entries a four-times tap-read-dismiss loop. */
        const accRows = (list, meta) => list.map((a, i) => (
          <Accordion key={a.name + i} title={a.name} meta={meta ? meta(a) : null}>
            {a.blocks?.length ? <FeatureBlocks blocks={a.blocks} /> : a.text}
          </Accordion>
        ));
        return (
          <>
            {ac.length > 0 && (
              <div className="byo-actionsub">
                <AccordionSection heading="h4" title="From your character">
                  {accRows(ac, (a) => a.section)}
                </AccordionSection>
              </div>
            )}
            <div className="byo-actionsub">
              <AccordionSection heading="h4" title="Standard Actions">{accRows(basics)}</AccordionSection>
            </div>
          </>
        );
      })(),
    },
    ...extraTabs,
  ].filter((t) => t.content);

  const [tab, setTab] = useState(null);
  const active = TABS.some((t) => t.key === tab) ? tab : TABS[0]?.key;

  if (TABS.length === 0) return null;

  return (
    <div className="byo-panel">
      {header ? <h3>{header}</h3> : null}
      <div className="byo-actiontabs" role="tablist">
        {TABS.map((t) => (
          <button type="button" key={t.key} role="tab" className={`byo-actiontab ${active === t.key ? "is-sel" : ""}`}
                  onClick={() => setTab(t.key)} aria-selected={active === t.key}>
            {t.label}
          </button>
        ))}
      </div>
      {TABS.find((t) => t.key === active)?.content}
    </div>
  );
}
