import { ABILITIES } from '../data/progression.js';
import { mod, fmt, groupWeapons, parseStartingGold, ACTION_ORDER, ACTION_LABELS } from '../lib/derive.js';

/* Real vector PDF, built in the browser from the same sheetCtx that feeds
   buildSheetHTML(). This exists because the print route was never reliable
   on phones: mobile Safari's share-sheet print often swallowed the dialog,
   and most Android print targets offer no "Save as PDF" destination at all.
   Generating the PDF ourselves takes the OS print pipeline out of the loop
   entirely — the same bytes come out on a phone as on a desktop.

   Layout differs from the HTML sheet on purpose. pdfmake has no CSS and no
   break-inside rules that survive long content, so bordered section boxes
   (fine in a browser, fragile across a page break) are replaced by a
   heading + hairline. Boxes are kept only for the vitals and ability rows,
   which are short enough to mark unbreakable. */

const INK = '#111111';
const MUTE = '#666666';
const HAIR = '#BBBBBB';
const GOLD = '#D4A537';
const DARK = '#0B1622';

/* Hairline-only table layout: one rule under the header row, one under
   each body row, no verticals. Used for every data table on the sheet. */
const ROWS = {
  hLineWidth: (i, node) => (i === 0 ? 0 : i === 1 ? 0.7 : 0.35),
  vLineWidth: () => 0,
  hLineColor: (i) => (i === 1 ? '#999999' : '#DDDDDD'),
  paddingLeft: (i) => (i === 0 ? 0 : 4),
  paddingRight: () => 4,
  paddingTop: () => 2.5,
  paddingBottom: () => 2.5,
};

/* Boxed cells for the vitals / ability score strips. */
const BOXES = {
  hLineWidth: () => 0.8,
  vLineWidth: () => 0.8,
  hLineColor: () => INK,
  vLineColor: () => INK,
  paddingLeft: () => 3,
  paddingRight: () => 3,
  paddingTop: () => 5,
  paddingBottom: () => 5,
};

/* A4 minus the 36pt page margins; the two-column blocks get half of what's
   left after the gutter. pdfmake canvases can't auto-size to their column,
   so every rule is drawn at an explicit width. */
const FULL = 523;
const HALF = (FULL - 18) / 2;

const rule = (color = HAIR, w = 0.6, width = FULL) => ({
  canvas: [{ type: 'line', x1: 0, y1: 0, x2: width, y2: 0, lineWidth: w, lineColor: color }],
  margin: [0, 1, 0, 5],
});

/* Section heading: uppercase label, gold tick, hairline under it. Replaces
   the HTML sheet's bordered <section> — survives page breaks intact. */
const heading = (title, width = FULL) => [
  { text: title, style: 'h4', margin: [0, 9, 0, 3] },
  {
    canvas: [
      { type: 'line', x1: 0, y1: 0, x2: 22, y2: 0, lineWidth: 1.6, lineColor: GOLD },
      { type: 'line', x1: 22, y1: 0, x2: width, y2: 0, lineWidth: 0.6, lineColor: HAIR },
    ],
    margin: [0, 0, 0, 5],
  },
];

/* "Name. Body text." paragraph — the shape every feature, trait and
   appendix entry uses. */
const para = (name, text) => ({
  text: [{ text: `${name}. `, bold: true }, String(text ?? '')],
  style: 'p',
});

/* One "Label ....... value" line, optionally with a proficiency dot. */
const line = (label, value, opts = {}) => {
  const { dot = null, sub = null } = opts;
  const cells = [];
  if (dot !== null) {
    // Drawn, not typed: ● and ○ aren't in the subset the PDF embeds (and
    // aren't in Karla at all), so a glyph here renders as nothing.
    cells.push({
      width: 9,
      margin: [0, 3.8, 0, 0],
      canvas: [{
        type: 'ellipse', x: 2.4, y: 0, r1: 2.4, r2: 2.4,
        ...(dot ? { color: INK } : { lineWidth: 0.7, lineColor: '#BBBBBB' }),
      }],
    });
  }
  cells.push({
    width: '*',
    text: sub ? [String(label), { text: `  ${sub}`, fontSize: 5.6, color: '#999999', characterSpacing: 0.4 }] : String(label),
  });
  cells.push({ width: 'auto', text: String(value), bold: true, alignment: 'right' });
  return { columns: cells, columnGap: 4, fontSize: 8.2, margin: [0, 1, 0, 1], color: dot === false ? '#333333' : INK };
};

const ABIL_LABEL = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

export function buildSheetDocDefinition(ctx) {
  const {
    ancestry, klass, level, subclass, subclassReady, background, name, resolved,
    armorClass, hitPoints, speed, initiative, passiveSkills, pb, armor, shieldOn,
    savingThrows, skillTable, casting, chosenSpells, otherSpells, appendix, bgChoice,
    finalScore, attackRows, masteryEnabled, carriedWeapons, actions,
  } = ctx;

  const charName = name.trim() || 'Unnamed';
  const head = [ancestry?.name, klass ? `${klass.name} ${level}` : null,
    subclass && subclassReady ? subclass.name : null, background?.name]
    .filter(Boolean).join('  ·  ');

  const content = [];

  /* ---- header ---- */
  content.push({
    columns: [
      {
        width: '*',
        stack: [
          { text: charName, font: 'Fraunces', fontSize: 21, lineHeight: 1, color: INK },
          { text: head, fontSize: 8.5, color: '#444444', margin: [0, 3, 0, 0] },
        ],
      },
      { width: 'auto', text: 'SINA UNA', fontSize: 6.5, characterSpacing: 2, color: '#888888', margin: [0, 0, 0, 2] },
    ],
    columnGap: 12,
    margin: [0, 0, 0, 5],
  });
  content.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: FULL, y2: 0, lineWidth: 1.6, lineColor: INK }],
    margin: [0, 0, 0, 9],
  });

  /* ---- vitals + abilities ---- */
  const boxCell = (label, value, big) => ({
    stack: [
      { text: String(value), fontSize: big, bold: true, alignment: 'center', lineHeight: 1 },
      { text: String(label).toUpperCase(), fontSize: 5.6, characterSpacing: 0.7, color: '#555555', alignment: 'center', margin: [0, 3, 0, 0] },
    ],
  });

  const vitals = [['AC', klass ? armorClass : '—'], ['HP', klass ? hitPoints : '—'],
    ['Initiative', fmt(initiative)], ['Speed', speed]];
  content.push({
    unbreakable: true,
    table: { widths: ['*', '*', '*', '*'], body: [vitals.map(([k, v]) => boxCell(k, v, 16))] },
    layout: BOXES,
    margin: [0, 0, 0, 6],
  });
  content.push({
    unbreakable: true,
    table: {
      widths: ['*', '*', '*', '*', '*', '*'],
      body: [ABILITIES.map(({ key, label }) => ({
        stack: [
          { text: label.toUpperCase(), fontSize: 5.6, characterSpacing: 0.7, color: '#555555', alignment: 'center' },
          { text: fmt(mod(finalScore(key))), fontSize: 15, bold: true, alignment: 'center', lineHeight: 1, margin: [0, 1, 0, 0] },
          { text: String(finalScore(key)), fontSize: 8, color: '#444444', alignment: 'center' },
        ],
      }))],
    },
    layout: BOXES,
    margin: [0, 0, 0, 4],
  });

  /* ---- core / saves, side by side ---- */
  const core = [
    klass && ['Hit die', `d${klass.hitDie}`],
    ['Proficiency', fmt(pb)],
    ['Size', resolved.size],
    resolved.darkvision > 0 && ['Darkvision', `${resolved.darkvision} ft`],
    resolved.blindsight > 0 && ['Blindsight', `${resolved.blindsight} ft`],
    ['Languages', resolved.languages.join(', ')],
    armor.id !== 'none' && ['Armor', armor.name + (shieldOn ? ' + shield' : '')],
    armor.id === 'none' && shieldOn && ['Armor', 'Shield only'],
    ...passiveSkills.map((p) => [`Passive ${p.name}`, p.value]),
  ].filter(Boolean);

  content.push({
    columns: [
      { width: HALF, stack: [...heading('Core', HALF), ...core.map(([k, v]) => line(k, v))] },
      { width: HALF, stack: [...heading('Saving throws', HALF), ...savingThrows.map((s) => line(s.label, fmt(s.value), { dot: s.proficient }))] },
    ],
    columnGap: 18,
  });

  /* ---- skills, two columns ---- */
  const half = Math.ceil(skillTable.length / 2);
  const skillCol = (arr) => arr.map((s) => line(s.name, fmt(s.value), { dot: s.proficient, sub: s.ability.toUpperCase() }));
  content.push(...heading('Skills'));
  content.push({
    columns: [
      { width: HALF, stack: skillCol(skillTable.slice(0, half)) },
      { width: HALF, stack: skillCol(skillTable.slice(half)) },
    ],
    columnGap: 18,
  });

  /* ---- attacks ---- */
  if (attackRows?.length) {
    content.push(...heading('Attacks'));
    content.push({
      table: {
        headerRows: 1,
        widths: ['*', 52, 40, 74, 118],
        body: [
          ['Attack', 'Range', 'Hit/DC', 'Damage', 'Notes'].map((t) => ({ text: t, style: 'th' })),
          ...attackRows.map((r) => [
            { text: r.proficient ? r.name : [r.name, { text: '  not proficient', style: 'mutInline' }] },
            r.range, r.hitOrDC,
            `${r.damage}${r.dmgType ? ` ${r.dmgType}` : ''}`,
            r.notes || '—',
          ]),
        ],
      },
      layout: ROWS,
      style: 'tbl',
    });
    if (masteryEnabled) {
      content.push({ text: 'Weapon Mastery notes are 2024, not the 2014 chassis this sheet otherwise uses — informational only.', style: 'mut' });
    }
  }

  /* ---- class actions: name only, pointing at the full text further down ---- */
  if (actions?.length) {
    content.push(...heading('Class actions'));
    ACTION_ORDER.filter((k) => actions.some((a) => a.action === k)).forEach((k) => {
      content.push({ text: ACTION_LABELS[k], style: 'actg' });
      actions.filter((a) => a.action === k).forEach((a) => {
        content.push({ text: [{ text: a.name, bold: true }, ` — See ${a.section}.`], style: 'p' });
      });
    });
  }

  /* ---- spellcasting ---- */
  if (casting && !casting.pending) {
    const spellHitDC = (sp) => (sp.atk ? fmt(casting.attack)
      : sp.save ? `${ABIL_LABEL[sp.save] || sp.save.toUpperCase()} ${casting.saveDC}` : '—');
    const spellEffect = (sp) => (sp.heal ? sp.heal
      : sp.dmg ? `${sp.dmg}${sp.dmgType ? ` ${sp.dmgType}` : ''}`
      : sp.cond ? sp.cond[0].toUpperCase() + sp.cond.slice(1) : '—');

    content.push(...heading(`Spellcasting — ${casting.label}`));
    const stats = [['Save DC', casting.saveDC], ['Attack', fmt(casting.attack)], ['Ability', casting.ability.toUpperCase()],
      ...(casting.slots || []).map((n, i) => [`${i + 1}${['st', 'nd', 'rd'][i] || 'th'}`, n]),
      casting.pact && ['Pact', `${casting.pact.n} @ level ${casting.pact.lvl}`],
      casting.prepared != null && ['Prepared', casting.prepared],
      casting.known != null && ['Known', casting.known],
    ].filter(Boolean);
    content.push({
      text: stats.map(([k, v], i) => [i ? { text: '     ' } : '', `${k} `, { text: String(v), bold: true }]).flat(),
      fontSize: 8.2, margin: [0, 0, 0, 5],
    });

    if (chosenSpells.length) {
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', 46, 52, 44, 86, 52],
          body: [
            ['Name', 'Time', 'Range', 'Hit/DC', 'Effect', 'Notes'].map((t) => ({ text: t, style: 'th' })),
            ...chosenSpells.map((sp) => [
              sp.name + (sp.src === 'phb' ? '' : ' *'),
              sp.time, sp.range, spellHitDC(sp), spellEffect(sp),
              [sp.ritual && 'ritual', sp.conc && 'conc'].filter(Boolean).join(', ') || '—',
            ]),
          ],
        },
        layout: ROWS,
        style: 'tbl',
      });
    }
    if (otherSpells.trim()) {
      content.push(para('Other', otherSpells.split('\n').map((x) => x.trim()).filter(Boolean).join(', ')));
    }
    if (chosenSpells.some((x) => x.src !== 'phb')) {
      content.push({ text: '* island spell — full text in the reference below.', style: 'mut' });
    }
  }

  /* ---- ancestry / class / subclass / background ---- */
  content.push(...heading(`Ancestry traits — ${ancestry.name}`));
  resolved.traits.forEach((t) => content.push(para(t.name, t.text)));
  if (resolved.droppedTraits.length) {
    content.push({ text: `Replaced by this lineage: ${resolved.droppedTraits.map((t) => t.name).join(', ')}.`, style: 'mut' });
  }

  if (klass) {
    const feats = (klass.features || []).filter((f) => f[0] <= level);
    if (feats.length) {
      content.push(...heading(`${klass.name} features`));
      feats.forEach((f) => content.push(para(f[1], f[2])));
    }
  }

  if (subclass && subclassReady) {
    const feats = subclass.features.filter((f) => f[0] <= level);
    if (feats.length) {
      content.push(...heading(`${subclass.name} — ${subclass.group}`));
      feats.forEach((f) => content.push(para(f[1],
        f[2] || `Gained at level ${f[0]}.${subclass.page ? ` See p.${subclass.page}.` : ''}`)));
    }
  }

  if (background) {
    content.push(...heading(`Background — ${background.name}`));
    content.push(para(background.feature.name, background.feature.text));
    if (bgChoice && background.choice) content.push(para(background.choice.name, bgChoice));
    content.push(para('Equipment', `${background.equipment.join(', ')}.`));
    if (background.tools?.length) content.push(para('Tools', `${background.tools.join(', ')}.`));
  }

  /* ---- inventory ---- */
  const weaponRows = groupWeapons(carriedWeapons || []);
  const startingGold = parseStartingGold(background);
  const gearList = [...(klass?.startingEquipment?.gear || []), ...startingGold.items, ...(background?.tools || [])];
  if (weaponRows.length || armor?.id !== 'none' || shieldOn || gearList.length || startingGold.gp) {
    content.push(...heading('Inventory'));
    if (weaponRows.length) {
      content.push(para('Weapons', `${weaponRows.map((r) => r.weapon.name + (r.qty > 1 ? ` ×${r.qty}` : '')).join(', ')}.`));
    }
    content.push(para('Armor', `${armor && armor.id !== 'none' ? armor.name : 'None'}${shieldOn ? ' + shield' : ''}.`));
    if (gearList.length) content.push(para('Gear', `${gearList.join(', ')}.`));
    content.push(para('Currency', `${startingGold.gp} gp.`));
  }

  /* ---- reference appendix ---- */
  const groups = [...new Set(appendix.map((a) => a.group))];
  if (groups.length) {
    content.push({ text: 'Reference', style: 'h3', pageBreak: 'before' });
    content.push(rule(INK, 1.4));
    groups.forEach((g) => {
      content.push(...heading(g));
      appendix.filter((a) => a.group === g).forEach((a) => content.push(para(a.name, a.text)));
    });
  }

  return {
    pageSize: 'A4',
    pageMargins: [36, 34, 36, 34],
    info: { title: `${charName} — character sheet`, author: 'Sina Una character creator' },
    content,
    footer: (page, pages) => ({
      columns: [
        { text: charName, fontSize: 6.5, color: '#999999' },
        { text: `${page} / ${pages}`, fontSize: 6.5, color: '#999999', alignment: 'right' },
      ],
      margin: [36, 6, 36, 0],
    }),
    defaultStyle: { font: 'Karla', fontSize: 8.4, lineHeight: 1.25, color: INK },
    styles: {
      h3: { font: 'Fraunces', fontSize: 13, color: INK, margin: [0, 0, 0, 2] },
      h4: { fontSize: 7, bold: true, characterSpacing: 1.1, color: '#333333' },
      p: { fontSize: 8.2, alignment: 'justify', margin: [0, 0, 0, 4] },
      th: { fontSize: 6.2, bold: true, characterSpacing: 0.6, color: '#555555' },
      tbl: { fontSize: 8, margin: [0, 0, 0, 4] },
      mut: { fontSize: 7.4, italics: true, color: MUTE, margin: [0, 1, 0, 4] },
      mutInline: { fontSize: 7, italics: true, color: MUTE },
      actg: { fontSize: 6.4, bold: true, characterSpacing: 0.9, color: MUTE, margin: [0, 5, 0, 2] },
    },
  };
}

/* pdfmake plus the embedded fonts is ~1.2 MB of JS the wizard never needs
   until the last step, so both are pulled in on first export rather than
   at page load. */
let ready = null;
async function loadPdfMake() {
  if (!ready) {
    ready = (async () => {
      const [{ default: pdfMake }, { VFS }] = await Promise.all([
        import('pdfmake/build/pdfmake.js'),
        import('./vfsFonts.js'),
      ]);
      pdfMake.addVirtualFileSystem(VFS);
      pdfMake.setFonts({
        // Fraunces is display-only here — one 700 instance covers every use,
        // so all four slots point at the same file rather than shipping
        // three more weights nothing draws.
        Fraunces: {
          normal: 'Fraunces-Bold.ttf', bold: 'Fraunces-Bold.ttf',
          italics: 'Fraunces-Bold.ttf', bolditalics: 'Fraunces-Bold.ttf',
        },
        Karla: {
          normal: 'Karla-Regular.ttf', bold: 'Karla-Bold.ttf',
          italics: 'Karla-Italic.ttf', bolditalics: 'Karla-BoldItalic.ttf',
        },
      });
      return pdfMake;
    })();
  }
  return ready;
}

export const pdfFileName = (name) =>
  `${(name.trim() || 'unnamed').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-sheet.pdf`;

export async function downloadSheetPDF(ctx) {
  const pdfMake = await loadPdfMake();
  pdfMake.createPdf(buildSheetDocDefinition(ctx)).download(pdfFileName(ctx.name));
}

/* Opens the finished PDF in a tab instead of saving it — the reliable route
   on iOS, where a download lands in Files with no preview. The window has to
   be opened synchronously inside the click handler and handed over, or the
   popup blocker eats it while the PDF is still rendering. */
export async function openSheetPDF(ctx, win) {
  const pdfMake = await loadPdfMake();
  pdfMake.createPdf(buildSheetDocDefinition(ctx)).open(win || null);
}
