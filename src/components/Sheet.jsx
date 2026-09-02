import { useState } from "react";
import { fmt, mod } from "../rules/abilities.js";
import { ABIL_LABEL } from "../lib/derive.js";
import { formatCurrency } from "../lib/currency.js";
import { abilityEntry, itemEntry, rarityOf } from "../lib/sheetEntries.js";
import ActionsPanel from "./ActionsPanel.jsx";
import FeaturesPanel from "./FeaturesPanel.jsx";
import Drawer from "./Drawer.jsx";
import Rule from "./Rule.jsx";
import FeatureBlocks from "./FeatureBlocks.jsx";

/* ------------------------------------------------------------------
   THE SHEET — where "Done" on the wizard's last step lands you.

   Not another rendering of the printed sheet (that's sheetHtml.js and
   src/pdf/); this is the thing you hold at the table, so it's built
   phone-first: a sticky identity + vitals header, one screen at a time,
   and a fixed bottom bar to move between them.

   "Screens", not tabs — the panels inside a screen (ActionsPanel's
   Attacks/Spells/Bonus Actions, FeaturesPanel's per-class strip) are
   the tabs, and they're the same components the wizard's Summary step
   renders. The rule that shapes this page: nothing here prints a wall
   of rules prose inline. Every description is one tap away in the
   right-hand Drawer, because a phone screen holds six rows of a
   feature's text but twenty rows of feature names, and mid-combat you
   need to find the name first and read the text second.

   Styling is deliberately the Summary step's own .byo-panel/.byo-row
   vocabulary rather than a second design — the only markup invented
   for this page is the header down to the ability grid, and the screen
   bar. It reads the same `sheetCtx` object the export routes read.
------------------------------------------------------------------- */

const ORDINAL = (n) => `${n}${["st", "nd", "rd"][n - 1] || "th"}`;

/* The Rest drawer, read-only for now — it describes what each rest
   restores, but nothing here spends or restores anything yet, because
   the sheet has no live state to spend (no current HP, no expended
   slots or hit dice) until it grows one. */
const REST_ENTRY = {
  title: "Rest",
  sub: "Coming soon",
  blocks: [
    { type: "section", name: "Long Rest",
      blocks: [{ type: "para", text: "8 hours. Regain all hit points and all spell slots, and half your total Hit Dice." }] },
    { type: "section", name: "Short Rest",
      blocks: [{ type: "para", text: "1 hour. Spend Hit Dice to regain hit points; some features recharge." }] },
  ],
  note: "Taking a rest doesn't change anything on this sheet yet — it's read-only until the sheet tracks current hit points, Hit Dice and expended slots.",
};

/* A Summary-style row that opens the drawer. Same markup as the inert
   .byo-row the Summary step prints, plus the button semantics — a div
   with role=button, not a <button>, so the .byo-dot/.byo-final spans
   inside keep the grid the class already defines. */
function TapRow({ label, meta, value, dot, onOpen }) {
  return (
    <div className="byo-row is-tap" role="button" tabIndex={0} onClick={onOpen}
         onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}>
      {dot !== undefined && <span className={`byo-dot${dot ? " is-on" : ""}`} aria-hidden="true" />}
      <span className="byo-row-label">{label}{meta ? <span className="byo-skab"> ({meta})</span> : null}</span>
      {value != null && <span className="byo-final">{value}</span>}
      <span className="byo-row-chev" aria-hidden="true">›</span>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="byo-row">
      <span className="byo-row-label">{label}</span>
      <span className="byo-mod" style={{ width: "auto" }}>{value}</span>
    </div>
  );
}

/* Drawer contents: the stat grid, the prose, any trailing named
   sections. See src/lib/sheetEntries.js for the entry shape. */
function DrawerBody({ entry }) {
  if (!entry) return null;
  const stats = (entry.stats || []).filter(([, v]) => v != null && v !== "" && v !== "—");
  return (
    <>
      {stats.length > 0 && (
        <div className="byo-dstats">
          {stats.map(([label, value]) => (
            <div className="byo-dstat" key={label}>
              <span className="byo-dstat-l">{label}</span>
              <span className="byo-dstat-v">{value}</span>
            </div>
          ))}
        </div>
      )}
      {entry.blocks?.length ? <FeatureBlocks blocks={entry.blocks} /> : null}
      {!entry.blocks?.length && entry.text ? <p className="byo-trait-t">{entry.text}</p> : null}
      {(entry.sections || []).map((s) => (
        <div className="byo-dsection" key={s.name}>
          <div className="byo-dsection-n">{s.name}</div>
          <FeatureBlocks blocks={s.blocks} />
        </div>
      ))}
      {entry.note ? <p className="byo-note byo-dnote">{entry.note}</p> : null}
    </>
  );
}

/* Screen-bar glyphs — Lucide (lucide.dev, ISC), inlined rather than
   pulled from the package: seven icons don't justify a dependency, and
   the app ships no other runtime assets. Paths are verbatim from the
   upstream 24x24 / stroke-2 sources, so `stroke-width` and the round
   caps below are Lucide's own geometry, not a re-draw.

   Names, as requested: list, swords, backpack, notebook-text,
   circle-user-round, ellipsis, and flame-kindling for Rest. */
const ICONS = {
  list: (
    <>
      <path d="M3 5h.01" /><path d="M3 12h.01" /><path d="M3 19h.01" />
      <path d="M8 5h13" /><path d="M8 12h13" /><path d="M8 19h13" />
    </>
  ),
  swords: (
    <>
      <path d="m13 19 6-6" />
      <path d="M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5" />
      <path d="m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586" />
      <path d="m16 16 4 4" /><path d="m19 21 2-2" /><path d="m5 14 4 4" />
      <path d="m5 21-2-2" /><path d="M7.5 16.5 4 20" />
    </>
  ),
  backpack: (
    <>
      <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M8 10h8" /><path d="M8 18h8" />
      <path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </>
  ),
  "notebook-text": (
    <>
      <path d="M2 6h4" /><path d="M2 10h4" /><path d="M2 14h4" /><path d="M2 18h4" />
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <path d="M9.5 8h5" /><path d="M9.5 12H16" /><path d="M9.5 16H14" />
    </>
  ),
  "circle-user-round": (
    <>
      <path d="M17.925 20.056a6 6 0 0 0-11.851.001" />
      <circle cx="12" cy="11" r="4" />
      <circle cx="12" cy="12" r="10" />
    </>
  ),
  ellipsis: (
    <>
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </>
  ),
  "flame-kindling": (
    <>
      <path d="M12 2c1 3 2.5 3.5 3.5 4.5A5 5 0 0 1 17 10a5 5 0 1 1-10 0c0-.3 0-.6.1-.9a2 2 0 1 0 3.3-2C8 4.5 11 2 12 2Z" />
      <path d="m5 22 14-4" /><path d="m5 18 14 4" />
    </>
  ),
};

const Icon = ({ name }) => (
  <svg className="byo-screen-i" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {ICONS[name]}
  </svg>
);

export default function Sheet({ ctx, onEdit, exportSection, rulesetSection, accountSection }) {
  const {
    ancestry, background, name, resolved, classLabel, classLabelShort, hitDieLabel, totalCharLevel,
    armorClass, hitPoints, speed, initiative, passiveSkills, pb, armor, shieldOn,
    savingThrows, skillTable, casting, abilities, currency, inventory, toolsList,
    backstory, defenses, bestAC, finalScore, totalCharLevel: charLevel,
  } = ctx;

  const [screen, setScreen] = useState("stats");
  const [entry, setEntry] = useState(null);

  /* A save row and a skill row both open the ability they key off — the
     ability drawer already spells out that save and every skill under
     it, so there's no second, thinner entry shape to maintain. */
  const openAbility = (key) => setEntry(
    abilityEntry((abilities || []).find((a) => a.key === key), { savingThrows, skillTable, pb }));

  const invByKind = (kind) => (inventory || []).filter((it) => it.kind === kind);

  /* Every tile in the header opens the arithmetic behind its number —
     the same "how did I get +7" question the ability drawer answers,
     for the five values you quote most often. The sheet computes these
     for you, which is exactly why it owes you the working. */
  const conMod = finalScore ? mod(finalScore("con")) : 0;
  const dexMod = finalScore ? mod(finalScore("dex")) : 0;
  const VITAL_ENTRIES = {
    AC: {
      title: "Armor Class", sub: bestAC?.label || (armor?.name ?? "Unarmoured"),
      stats: [["Armor Class", armorClass], ["From", bestAC?.parts],
        ["Shield", shieldOn ? "+2, included" : "None"]],
      blocks: [{ type: "para", text: "The best of every Armor Class your armor, class features and items offer — they don't stack, you use whichever is highest." }],
    },
    HP: {
      title: "Hit Points", sub: hitDieLabel || null,
      stats: [["Maximum", hitPoints], ["Hit dice", hitDieLabel],
        ["From Constitution", `${fmt(conMod)} per level (${fmt(conMod * (charLevel || 1))} total)`]],
      blocks: [{ type: "para", text: "Your hit die's full value at level 1, its average for every level after, plus your Constitution modifier once per level." }],
    },
    Speed: {
      title: "Speed", sub: ancestry?.name || null,
      stats: [["Walking speed", `${speed} ft`], ["From", ancestry?.name]],
      blocks: [{ type: "para", text: "How far you can move on your turn. The Dash action buys you this much again." }],
    },
    Init: {
      title: "Initiative", sub: "Dexterity",
      stats: [["Initiative", fmt(initiative)], ["Dexterity modifier", fmt(dexMod)]],
      blocks: [{ type: "para", text: "Roll d20 and add this at the start of a fight to set your place in the turn order." }],
    },
    Prof: {
      title: "Proficiency Bonus", sub: charLevel ? `Character level ${charLevel}` : null,
      stats: [["Bonus", fmt(pb)], ["Character level", charLevel]],
      blocks: [{ type: "para", text: "Added to anything you're proficient with — attack rolls, saving throws, skills and your spell save DC. It climbs with total character level, not with any one class." }],
    },
  };

  const STATS = (
    <>
      <div className="byo-abilgrid">
        {(abilities || []).map((a) => (
          <button type="button" className="byo-abilcard" key={a.key} onClick={() => openAbility(a.key)}>
            <span className="byo-abilcard-l">{a.label}</span>
            <span className="byo-abilcard-m">{a.mod}</span>
            <span className="byo-abilcard-s">{a.score}</span>
          </button>
        ))}
      </div>

      {/* Passive scores sit with the senses and damage defenses rather
          than in their own panel: they're all the same question at the
          table — "what do I notice, and what can hurt me". */}
      <div className="byo-panel">
        <h3>Passive & Senses</h3>
        {(passiveSkills || []).map((p) => <Row key={p.name} label={`Passive ${p.name}`} value={p.value} />)}
        {(defenses?.senses || []).map(([label, value]) => <Row key={label} label={label} value={value} />)}
        <Row label="Resistances" value={defenses?.resistances?.length
          ? defenses.resistances.map((r, i) => (
              <span key={r}>
                {i > 0 && ", "}
                {/* An unresolved choice ("one of acid, cold, ...") already
                    names itself; only a settled type gets the "Resistant
                    to" framing, with the type bolded. */}
                {r.startsWith("one of ") ? r : <>Resistant to <b>{r}</b></>}
              </span>
            ))
          : "None"} />
        <Row label="Immunities" value={defenses?.immunities?.length ? defenses.immunities.join(", ") : "None"} />
      </div>

      <div className="byo-panel">
        <h3>Saving throws</h3>
        {(savingThrows || []).map((s) => (
          <TapRow key={s.key} label={s.label} dot={s.proficient} value={fmt(s.value)}
                  onOpen={() => openAbility(s.key)} />
        ))}
      </div>

      <div className="byo-panel">
        <h3>Skills</h3>
        {(skillTable || []).map((s) => (
          <TapRow key={s.id} label={s.name} meta={ABIL_LABEL[s.ability] || s.ability.toUpperCase()}
                  dot={s.proficient} value={fmt(s.value)} onOpen={() => openAbility(s.ability)} />
        ))}
      </div>
    </>
  );

  const ACTIONS = (
    <>
      {casting && !casting.pending && (
        <>
          {/* The three numbers you actually quote out loud when you cast.
              Slots/prepared/known are a line of pills under them rather
              than three more tiles — they're reference, not the thing
              you're asked for across the table. */}
          <div className="byo-castgrid">
            <div className="byo-cast"><span className="byo-cast-n">{casting.saveDC}</span><span className="byo-cast-l">Save DC</span></div>
            <div className="byo-cast"><span className="byo-cast-n">{fmt(casting.attack)}</span><span className="byo-cast-l">Spell Attack</span></div>
            <div className="byo-cast"><span className="byo-cast-n">{casting.ability.toUpperCase()}</span><span className="byo-cast-l">Ability</span></div>
          </div>
          {(casting.slots?.length > 0 || casting.pact || casting.prepared != null || casting.known != null) && (
            <div className="byo-slots">
              {(casting.slots || []).map((n, i) => <span className="byo-slot" key={i}><b>{ORDINAL(i + 1)}</b> ×{n}</span>)}
              {casting.pact && <span className="byo-slot"><b>Pact</b> {casting.pact.count} @ {ORDINAL(casting.pact.level)}</span>}
              {casting.prepared != null && <span className="byo-slot"><b>Prepared</b> {casting.prepared}</span>}
              {casting.known != null && <span className="byo-slot"><b>Known</b> {casting.known}</span>}
              {casting.spellbook != null && <span className="byo-slot"><b>Spellbook</b> {casting.spellbook}</span>}
            </div>
          )}
        </>
      )}
      {/* .byo-flush drops the panel's card chrome on a phone: the Actions
          screen is one long table, and a border-plus-padding box around
          it only narrows the columns that already have the least room. */}
      <div className="byo-flush">
        <ActionsPanel ctx={ctx} onSelect={setEntry} header={null} />
      </div>
    </>
  );

  const INVENTORY = (
    <>
      {[["weapon", "Weapons"], ["armor", "Armor & shields"], ["gear", "Gear"]].map(([kind, label]) => {
        const rows = invByKind(kind);
        if (!rows.length) return null;
        return (
          <div className="byo-panel" key={kind}>
            <h3>{label} <span className="byo-count">{rows.length}</span></h3>
            {rows.map((it) => (
              <TapRow key={`${it.id}-${it.attuned}`} label={it.name}
                      meta={[rarityOf(it.item), it.attuned ? "attuned" : null].filter(Boolean).join(", ") || null}
                      value={it.qty > 1 ? `×${it.qty}` : null} onOpen={() => setEntry(itemEntry(it))} />
            ))}
          </div>
        );
      })}

      <div className="byo-panel">
        <h3>Carried</h3>
        <Row label="Armor worn" value={armor && armor.id !== "none"
          ? `${armor.name}${shieldOn ? " + shield" : ""}` : (shieldOn ? "Shield only" : "None")} />
        <Row label="Currency" value={formatCurrency(currency)} />
        {(toolsList || []).length > 0 && <Row label="Tools" value={toolsList.join(", ")} />}
      </div>

      {(inventory || []).length === 0 && <p className="byo-note">Nothing carried.</p>}
    </>
  );

  const BIO = (
    <>
      <div className="byo-panel">
        <h3>Character</h3>
        {[["Species", ancestry?.name], ["Class", classLabel], ["Background", background?.name],
          ["Total level", totalCharLevel], ["Hit dice", hitDieLabel], ["Size", resolved?.size],
          ["Speed", speed ? `${speed} ft` : null],
          ["Languages", resolved?.languages?.join(", ")]]
          .filter(([, v]) => v != null && v !== "")
          .map(([label, value]) => <Row key={label} label={label} value={value} />)}
      </div>
      {(backstory || "").trim() ? (
        <div className="byo-panel">
          <h3>Backstory</h3>
          {(backstory || "").trim().split(/\n\s*\n/).map((block, i) => (
            <p className="byo-trait-t" key={i} style={{ whiteSpace: "pre-line" }}>{block.trim()}</p>
          ))}
        </div>
      ) : <p className="byo-note">No backstory written.</p>}
    </>
  );

  /* Settings is a screen, not a modal: on a phone a modal over a modal
     (the export drawer over the sheet) is one dismiss gesture too many,
     and everything here — going back to the wizard, exporting, adding a
     ruleset, signing in — is a deliberate trip, not a glance. */
  const SETTINGS = (
    <>
      <div className="byo-export">
        <div>
          <div className="byo-export-t">Edit character</div>
          <div className="byo-export-s">Back to the creator, on the step you left.</div>
        </div>
        <button className="byo-btn byo-btn-go" onClick={onEdit}>Edit Character</button>
      </div>
      <Rule />
      {exportSection}
      {rulesetSection ? <Rule /> : null}
      {rulesetSection}
      {accountSection ? <Rule /> : null}
      {accountSection}
    </>
  );

  const SCREENS = [
    { key: "stats", label: "Stats", icon: "list", content: STATS },
    { key: "actions", label: "Actions", icon: "swords", content: ACTIONS },
    { key: "inventory", label: "Inventory", icon: "backpack", content: INVENTORY },
    { key: "features", label: "Features", icon: "notebook-text", content: <FeaturesPanel ctx={ctx} accordion /> },
    { key: "bio", label: "Bio", icon: "circle-user-round", content: BIO },
    { key: "settings", label: "Settings", icon: "ellipsis", content: SETTINGS },
  ];
  const active = SCREENS.find((s) => s.key === screen) || SCREENS[0];

  return (
    <div className="byo-root byo-sheetpage">
      <div className="byo-sheet">
        {/* Sticky: name and vitals stay put while the screen under them
            scrolls — the numbers you re-read every turn shouldn't need a
            scroll back to the top to find. */}
        <header className="byo-sheet-head">
          {/* No Back button: leaving the sheet is "Edit Character" on the
              Settings screen, and browser Back still works — a chrome
              button for it was a third way to do the same thing. The
              identity line drops the subclasses (classLabelShort) — the
              header is for what you check mid-turn — species and class,
              not the subclasses and not the background, both of which
              live a tap away on Features and Bio. */}
          <div className="byo-sheet-name">{(name || "").trim() || "Unnamed"}</div>
          <div className="byo-sheet-sub">
            {[ancestry?.name, classLabelShort].filter(Boolean).join(" · ")}
          </div>

          <div className="byo-shvitals">
            {[[armorClass, "AC"], [hitPoints, "HP"], [speed, "Speed"],
              [fmt(initiative), "Init"], [fmt(pb), "Prof"]]
              .map(([value, label]) => (
                <button type="button" className="byo-shvital byo-shvital-btn" key={label}
                        onClick={() => setEntry(VITAL_ENTRIES[label])}>
                  <span className="byo-shvital-n">{value}</span>
                  <span className="byo-shvital-l">{label}</span>
                </button>
              ))}
            {/* The sixth tile is the only one that does something: rests
                are the thing you reach for between fights, and they're
                the first bit of live sheet state this page will own. */}
            <button type="button" className="byo-shvital byo-shvital-btn" onClick={() => setEntry(REST_ENTRY)}>
              <Icon name="flame-kindling" />
              <span className="byo-shvital-l">Rest</span>
            </button>
          </div>
        </header>

        <div className="byo-sheet-body">{active.content}</div>
      </div>

      {/* Fixed to the bottom, thumb-height, icon-only below the phone
          breakpoint — the label is the first thing to go when six
          destinations have to fit across 390px. */}
      <nav className="byo-screens" aria-label="Sheet screens">
        {SCREENS.map((s) => (
          <button type="button" key={s.key} aria-current={active.key === s.key ? "page" : undefined}
                  className={`byo-screen ${active.key === s.key ? "is-sel" : ""}`}
                  onClick={() => { setScreen(s.key); window.scrollTo({ top: 0 }); }}>
            <Icon name={s.icon} />
            <span className="byo-screen-l">{s.label}</span>
          </button>
        ))}
      </nav>

      <Drawer open={!!entry} title={entry?.title} subtitle={entry?.sub} onClose={() => setEntry(null)}>
        <DrawerBody entry={entry} />
      </Drawer>
    </div>
  );
}
