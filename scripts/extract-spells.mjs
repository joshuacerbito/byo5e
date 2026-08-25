/* ------------------------------------------------------------------
   Regenerates src/data/xgeSpells.js and src/data/tceSpells.js from a
   local 5etools-src checkout.  Run from the repo root:

     node scripts/extract-spells.mjs

   Levels 0-3 only (the reachable range at level 5).  Class eligibility
   comes from data/spells/sources.json, taking the 2014 "PHB"-source
   class entries and ignoring the XPHB ones, exactly as the SCC pull
   did.  Artificer tags are dropped — this app has no artificer.
------------------------------------------------------------------- */
import { readJson, fmtEntries, fmtTime, fmtRange, fmtComponents, fmtDuration,
  combatMeta, SCHOOLS, stripTags, writeFile, q } from "./lib/fivetools.mjs";

const CODE = { Bard: "b", Cleric: "c", Druid: "d", Paladin: "p", Ranger: "r",
  Sorcerer: "s", Warlock: "k", Wizard: "w" };
const ORDER = "bcdprskw";

const BOOKS = {
  xge: { file: "spells/spells-xge.json", key: "XGE", label: "Xanathar's Guide to Everything" },
  tce: { file: "spells/spells-tce.json", key: "TCE", label: "Tasha's Cauldron of Everything" },
};

const sources = readJson("spells/sources.json");

function classCode(bookKey, name) {
  const rec = sources[bookKey]?.[name] || {};
  const names = new Set();
  for (const k of ["class", "classVariant"])
    for (const c of rec[k] || [])
      if (c.source === "PHB" && CODE[c.name]) names.add(CODE[c.name]);
  return [...names].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).join("");
}

function spellRow(sp, bookKey) {
  const meta = {
    school: SCHOOLS[sp.school] || sp.school,
    page: sp.page,
    time: fmtTime(sp.time),
    range: fmtRange(sp.range),
    comp: fmtComponents(sp.components),
    dur: fmtDuration(sp.duration),
  };
  if (sp.meta?.ritual) meta.ritual = true;
  if (sp.duration?.[0]?.concentration) meta.conc = true;
  meta.text = fmtEntries(sp.entries);
  const hl = fmtEntries((sp.entriesHigherLevel || []).flatMap((e) => e.entries || []));
  if (hl) meta.higher = hl;
  return { name: sp.name, level: sp.level, cls: classCode(bookKey, sp.name), meta,
    combat: combatMeta(sp) };
}

const HEADER = {
  xge: `/* ------------------------------------------------------------------
   Xanathar's Guide to Everything (XGE) spells, levels 0-3 — the
   reachable range at level 5.  XGE has 95 spells in total; the 49
   above 3rd level exist in the source data but are unreachable here.

   Text pulled from 5etools-src (data/spells/spells-xge.json) by
   scripts/extract-spells.mjs, class eligibility from the XGE block of
   data/spells/sources.json (the 2014 "PHB"-source class entries, not
   the XPHB ones).  Same shape as phbSpells.js so the pools concatenate.

   XGE is 2014 content — it predates the 2024 revision — so this is an
   ordinary content add, not an opt-in exception like Weapon Mastery.

   None of these is on the babaylan spell list (book p.224, which lists
   only Handbook and island spells), so none carries the "y" code.

   Class codes: b bard · c cleric · d druid · p paladin
                r ranger · s sorcerer · k warlock · w wizard
------------------------------------------------------------------- */`,
  tce: `/* ------------------------------------------------------------------
   Tasha's Cauldron of Everything (TCE) spells, levels 0-3 — the
   reachable range at level 5.  TCE has 21 spells; the 8 above 3rd
   level exist in the source data but are unreachable here.

   Text pulled from 5etools-src (data/spells/spells-tce.json) by
   scripts/extract-spells.mjs, class eligibility from the TCE block of
   data/spells/sources.json (the 2014 "PHB"-source class entries, not
   the XPHB ones).  Same shape as phbSpells.js so the pools concatenate.

   TCE is 2014 content — it predates the 2024 revision — so this is an
   ordinary content add, not an opt-in exception like Weapon Mastery.
   Four of the cantrips (Booming Blade, Green-Flame Blade, Lightning
   Lure, Sword Burst) first appeared in SCAG; TCE is the printing this
   app follows, which is why they carry a material component and the
   5th/11th/17th-level scaling the reprint added.

   None of these is on the babaylan spell list (book p.224, which lists
   only Handbook and island spells), so none carries the "y" code.

   Class codes: b bard · c cleric · d druid · p paladin
                r ranger · s sorcerer · k warlock · w wizard
------------------------------------------------------------------- */`,
};

for (const [id, book] of Object.entries(BOOKS)) {
  const all = readJson(book.file).spell;
  const rows = all.filter((s) => s.level <= 3)
    .map((s) => spellRow(s, book.key))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  const upper = id.toUpperCase();
  const body = rows.map((r) => {
    const m = r.meta;
    const lines = [
      `    school: ${q(m.school)}, page: ${m.page},`,
      `    time: ${q(m.time)}, range: ${q(m.range)},`,
      `    comp: ${q(m.comp)}, dur: ${q(m.dur)},`,
    ];
    if (m.ritual) lines.push(`    ritual: true,`);
    if (m.conc) lines.push(`    conc: true,`);
    lines.push(`    text: ${q(m.text)},`);
    if (m.higher) lines.push(`    higher: ${q(m.higher)},`);
    return `  [${q(r.name)},${r.level},${q(r.cls)},{\n${lines.join("\n")}\n  }],`;
  }).join("\n");

  const combat = rows.filter((r) => Object.keys(r.combat).length)
    .map((r) => `  ${q(r.name)}: { ${Object.entries(r.combat)
      .map(([k, v]) => `${k}: ${q(v)}`).join(", ")} },`).join("\n");

  const out = `${HEADER[id]}
export const ${upper}_SPELL_RAW = [
${body}
];

/* Combat-table metadata, same fields and same provenance as
   phbSpells.js's PHB_COMBAT — spellAttack / savingThrow /
   damageInflict / conditionInflict read off the 5etools entries, the
   dice expression read out of the spell's own text.  Spells that make
   no attack, force no save and deal no damage carry nothing. */
const ${upper}_COMBAT = {
${combat}
};

export const ${upper}_SPELLS = ${upper}_SPELL_RAW.map(([name, level, cls, meta]) => ({
  name, level, cls, src: ${q(id)}, ...meta, ...(${upper}_COMBAT[name] || {}),
}));
`;
  writeFile(`src/data/${id}Spells.js`, out);
  console.log(`  ${upper}: ${rows.length} spells, ${rows.filter((r) => !r.cls).length} with no class list`);
}
