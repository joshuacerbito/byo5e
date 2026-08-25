import { ABILITIES } from '../data/progression.js';
import { mod, fmt, groupWeapons, parseStartingGold, splitCastingTime, ACTION_ORDER, ACTION_LABELS,
  spellMark, spellMarkNotes, spellHitDC as hitDC, spellEffect, ABIL_LABEL } from './derive.js';
import { sheetFileBase } from '../pdf/saveFile.js';

/* Builds a standalone, printable HTML document for the character.
   Everything it needs is passed in explicitly.

   `interactive` controls the on-page toolbar at the top. The downloaded
   file keeps it, since someone opening that file needs a way to print.
   The copy printSheet() loads into its hidden iframe passes false: the
   print dialog is meant to be the first and only thing that appears, and
   a button nobody can click has no business rendering behind it. */
export function buildSheetHTML(ctx, { interactive = true } = {}) {
  const {
    ancestry, klass, level, subclass, subclassReady, background, name, resolved, armorClass, hitPoints, speed, initiative, passiveSkills, pb, armor, shieldOn, savingThrows, skillTable, casting, chosenSpells, otherSpells, appendix, bgChoice, finalScore, backstory,
    attackRows, masteryEnabled, carriedWeapons, actions, ancestrySpells, chosenFeats, classFeatures,
  } = ctx;

    const esc = (x) => String(x ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    const head = [ancestry?.name, klass ? `${klass.name} ${level}` : null,
      subclass && subclassReady ? subclass.name : null, background?.name]
      .filter(Boolean).join(" · ");

    const abils = ABILITIES.map(({ key, label }) =>
      `<div class="ab"><div class="ab-l">${label}</div><div class="ab-v">${fmt(mod(finalScore(key)))}</div>` +
      `<div class="ab-m">${finalScore(key)}</div></div>`).join("");

    const vitals = [
      ["AC", klass ? armorClass : "—"], ["HP", klass ? hitPoints : "—"],
      ["Initiative", fmt(initiative)], ["Speed", speed],
    ].map(([k, v]) => `<div class="vit"><div class="vit-n">${esc(v)}</div><div class="vit-l">${esc(k)}</div></div>`).join("");

    const core = [
      klass && ["Hit die", `d${klass.hitDie}`],
      ["Proficiency", fmt(pb)], ["Size", resolved.size],
      resolved.darkvision > 0 && ["Darkvision", `${resolved.darkvision} ft`],
      resolved.blindsight > 0 && ["Blindsight", `${resolved.blindsight} ft`],
      ["Languages", resolved.languages.join(", ")],
      armor.id !== "none" && ["Armor", armor.name + (shieldOn ? " + shield" : "")],
      armor.id === "none" && shieldOn && ["Armor", "Shield only"],
      ...passiveSkills.map((p) => [`Passive ${p.name}`, p.value]),
    ].filter(Boolean).map(([k, v]) => `<div class="ln"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("");

    const saves = savingThrows.map((s) =>
      `<div class="ln${s.proficient ? " p" : ""}"><span class="dot"></span>` +
      `<span>${s.label}</span><b>${fmt(s.value)}</b></div>`).join("");

    const skills = skillTable.map((s) =>
      `<div class="ln${s.proficient ? " p" : ""}"><span class="dot"></span>` +
      `<span>${s.name} <em>${s.ability}</em></span><b>${fmt(s.value)}</b></div>`).join("");

    const traits = resolved.traits.map((t) =>
      `<p><b>${esc(t.name)}.</b> ${esc(t.text)}</p>`).join("");
    const dropped = resolved.droppedTraits.length
      ? `<p class="mut">Replaced by this lineage: ${resolved.droppedTraits.map((t) => esc(t.name)).join(", ")}.</p>` : "";

    const classFeats = klass
      ? (classFeatures || []).filter((f) => f[0] <= level)
          .map((f) => `<p><b>${esc(f[1])}.</b> ${esc(f[2])}</p>`).join("")
      : "";

    const feats = subclass && subclassReady
      ? subclass.features.filter((f) => f[0] <= level)
          .map((f) => `<p><b>${esc(f[1])}.</b> ${esc(f[2] || `Gained at level ${f[0]}.${subclass.page ? ` See p.${subclass.page}.` : ""}`)}</p>`).join("")
      : "";

    const attacksHtml = attackRows?.length ? `
      <table class="atk"><thead><tr><th>Attack</th><th>Range</th><th>Hit/DC</th><th>Damage</th><th>Notes</th></tr></thead>
      <tbody>${attackRows.map((r) => `<tr><td>${esc(r.name)}${r.proficient ? "" : " <span class=\"mut\">(not proficient)</span>"}</td>` +
        `<td>${esc(r.range)}</td><td>${esc(r.hitOrDC)}</td>` +
        `<td>${esc(r.damage)}${r.dmgType ? ` ${esc(r.dmgType)}` : ""}</td><td>${esc(r.notes || "—")}</td></tr>`).join("")}</tbody></table>
      ${masteryEnabled ? `<p class="mut">Weapon Mastery notes are 2024, not the 2014 chassis this sheet otherwise uses — informational only.</p>` : ""}` : "";

    /* Actions / Bonus Actions / Reactions granted by ancestry, class, and
       subclass — name only, grouped by bucket, each pointing at the
       exact section further down ("Abayan — See Babaylan features.")
       that carries the full text, rather than repeating it up here.
       Headed "Class + Ancestry Actions": it has always collected all
       three sources, and plain "Actions" read as nothing next to the
       Attacks table. */
    const actionsHtml = actions?.length
      ? ACTION_ORDER.filter((k) => actions.some((a) => a.action === k)).map((k) => `
        <p class="mut">${esc(ACTION_LABELS[k])}</p>
        ${actions.filter((a) => a.action === k).map((a) => `<p><b>${esc(a.name)}</b> — See ${esc(a.section)}.</p>`).join("")}
      `).join("")
      : "";

    /* Feats: the Variant Human 1st-level pick and the level-4 "a feat
       instead of the ability increase" pick, whichever the character
       took. Name and where it came from only, pointing at the Reference
       section that carries the full text — the same treatment Other
       Actions gets, and for the same reason: the words appear once.
       The +1 is called out because it's already folded into the ability
       strip at the top, which is otherwise impossible to tell. */
    const featsHtml = (chosenFeats || []).map(({ feat, from, ability }) => {
      const key = feat.ability?.fixed || ability;
      const bonus = feat.ability && key
        ? ` <span class="mut">+${feat.ability.amount} ${key.toUpperCase()}, already in your scores.</span>` : "";
      return `<p><b>${esc(feat.name)}</b> — ${esc(from)}.${bonus} See Feats.</p>`;
    }).join("");

    const bg = background ? [
      `<p><b>${esc(background.feature.name)}.</b> ${esc(background.feature.text)}</p>`,
      bgChoice && background.choice ? `<p><b>${esc(background.choice.name)}.</b> ${esc(bgChoice)}</p>` : "",
      `<p><b>Equipment.</b> ${background.equipment.map(esc).join(", ")}.</p>`,
      background.tools?.length ? `<p><b>Tools.</b> ${background.tools.map(esc).join(", ")}.</p>` : "",
    ].join("") : "";

    /* Player-written prose. Blank lines separate paragraphs; a lone newline
       is a line break inside one, so a bullet list pasted in keeps its shape. */
    const backstoryHtml = (backstory || "").trim()
      ? (backstory || "").trim().split(/\n\s*\n/)
          .map((para) => `<p>${para.split("\n").map((l) => esc(l.trim())).join("<br>")}</p>`)
          .join("")
      : "";

    /* Everything the character starts with, in one place — weapons +
       armor + class/background gear + starting gold. Same at-a-glance
       intent as Attacks/Spellcasting, but this is background reading
       (what's in the pack), not per-turn info, so it sits after
       Background rather than up top. */
    const weaponRows = groupWeapons(carriedWeapons || []);
    const startingGold = parseStartingGold(background);
    const gearList = [...(klass?.startingEquipment?.gear || []), ...startingGold.items,
      ...(background?.tools || [])];
    const inventoryHtml = (weaponRows.length || armor?.id !== "none" || shieldOn || gearList.length || startingGold.gp) ? `
      ${weaponRows.length ? `<p><b>Weapons.</b> ${weaponRows.map((r) =>
        esc(r.weapon.name) + (r.qty > 1 ? ` ×${r.qty}` : "")).join(", ")}.</p>` : ""}
      <p><b>Armor.</b> ${armor && armor.id !== "none" ? esc(armor.name) : "None"}${shieldOn ? " + shield" : ""}.</p>
      ${gearList.length ? `<p><b>Gear.</b> ${gearList.map(esc).join(", ")}.</p>` : ""}
      <p><b>Currency.</b> ${startingGold.gp} gp.</p>` : "";

    /* Compact spell table — same at-a-glance intent as the Attacks table:
       Name/Time/Range/Hit-DC/Effect/Notes, no prose. Full descriptions are
       island/PHB text already carried into the Reference section below,
       not repeated here. */
    const spellHitDC = (sp) => hitDC(sp, casting);

    /* Legend for the Lvl column, assembled from what the character actually
       took — no note about cantrips for a paladin, none about upcasting for
       someone who picked nothing that scales. */
    const spellLegend = (() => {
      const bits = [
        chosenSpells.some((x) => x.level === 0) && "<b>C</b> is a cantrip",
        chosenSpells.some((x) => x.higher)
          && "a <b>+</b> means the spell does more cast with a higher slot — the reference below says what",
      ].filter(Boolean);
      return bits.length ? `<p class="mut">Lvl: ${bits.join("; ")}.</p>` : "";
    })();

    /* Ancestry spells sit in their own section rather than inside
       Spellcasting: a Balat-Kayo fighter has these and no spellcasting block
       at all, so nesting them there would hide them from exactly the
       characters who most need reminding. Each row carries its own DC and
       attack — the granting trait names the ability, which need not be the
       class's. */
    const ancestrySpellBlock = (ancestrySpells || []).length ? `
      <section><h4>Ancestry spells</h4>
      <table class="atk"><thead><tr><th>Name</th><th>Lvl</th><th>Time</th><th>Range</th><th>Hit/DC</th><th>Effect</th><th>Notes</th></tr></thead>
      <tbody>${ancestrySpells.map((sp) => {
        const { head, trigger } = splitCastingTime(sp.time);
        const hit = sp.atk ? (sp.attack == null ? "—" : fmt(sp.attack))
          : sp.save ? `${ABIL_LABEL[sp.save] || sp.save.toUpperCase()}${sp.saveDC == null ? "" : ` ${sp.saveDC}`}`
          : "—";
        return `<tr><td>${esc(sp.name)}</td><td>${sp.level === 0 ? "C" : sp.level}${sp.higher ? "+" : ""}</td>` +
          `<td>${esc(head)}</td><td>${esc(sp.range)}</td><td>${esc(hit)}</td><td>${esc(spellEffect(sp))}</td>` +
          `<td>${esc([sp.use, sp.from, sp.ability ? sp.ability.toUpperCase() : null,
            sp.ritual && "ritual", sp.conc && "conc",
            trigger && `trigger: ${trigger.toLowerCase()}`].filter(Boolean).join(", "))}</td></tr>`;
      }).join("")}</tbody></table>
      ${ancestrySpells.some((sp) => !sp.ability && (sp.atk || sp.save))
        ? `<p class="mut">A blank DC means the book names no spellcasting ability for the trait that grants the spell — ask your DM which one it uses.</p>` : ""}
      </section>` : "";

    const castBlock = casting && !casting.pending ? `
      <section><h4>Spellcasting — ${esc(casting.label)}</h4>
      <div class="inl">
        <span>Save DC <b>${casting.saveDC}</b></span>
        <span>Attack <b>${fmt(casting.attack)}</b></span>
        <span>Ability <b>${casting.ability.toUpperCase()}</b></span>
        ${(casting.slots || []).map((n, i) => `<span>${i + 1}${["st", "nd", "rd"][i] || "th"} <b>${n}</b></span>`).join("")}
        ${casting.pact ? `<span>Pact <b>${casting.pact.n} @ level ${casting.pact.lvl}</b></span>` : ""}
        ${casting.prepared != null ? `<span>Prepared <b>${casting.prepared}</b></span>` : ""}
        ${casting.known != null ? `<span>Known <b>${casting.known}</b></span>` : ""}
      </div>
      ${chosenSpells.length ? `
      <table class="atk"><thead><tr><th>Name</th><th>Lvl</th><th>Time</th><th>Range</th><th>Hit/DC</th><th>Effect</th><th>Notes</th></tr></thead>
      <tbody>${chosenSpells.map((sp) => `<tr><td>${esc(sp.name)}${spellMark(sp) ? ` ${spellMark(sp)}` : ""}</td>` +
        `<td>${sp.level === 0 ? "C" : sp.level}${sp.higher ? "+" : ""}</td>` +
        `<td>${esc(splitCastingTime(sp.time).head)}</td><td>${esc(sp.range)}</td><td>${esc(spellHitDC(sp))}</td>` +
        `<td>${esc(spellEffect(sp))}</td><td>${[sp.ritual && "ritual", sp.conc && "conc",
          splitCastingTime(sp.time).trigger && `trigger: ${splitCastingTime(sp.time).trigger.toLowerCase()}`,
        ].filter(Boolean).map(esc).join(", ") || "—"}</td></tr>`).join("")}</tbody></table>` : ""}
      ${otherSpells.trim() ? `<p><b>Other.</b> ${otherSpells.split("\n").map((x) => esc(x.trim())).filter(Boolean).join(", ")}</p>` : ""}
      ${spellLegend}
      ${spellMarkNotes(chosenSpells).map((n) => `<p class="mut">${esc(n)}</p>`).join("")}
      </section>` : "";

    const groups = [...new Set(appendix.map((a) => a.group))];
    const appx = groups.length ? `<h3>Reference</h3>` + groups.map((g) =>
      `<section><h4>${esc(g)}</h4>` +
      appendix.filter((a) => a.group === g).map((a) =>
        `<p><b>${esc(a.name)}.</b> ${esc(a.text)}</p>`).join("") + `</section>`).join("") : "";

    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(sheetFileBase(name))}</title>
<style>
  *{box-sizing:border-box}
  /* A4 all the way through: the on-screen column is a full 210mm wide
     with 14mm padding, which is exactly the 182mm content width @page's
     14mm margins leave on A4 paper. Screen and print stay in step, and
     the sheet doesn't reflow to a different measure when it prints. */
  body{font-family:Georgia,'Times New Roman',serif;color:#111;background:#fff;
    max-width:210mm;margin:0 auto;padding:14mm;font-size:10.5pt;line-height:1.45}
  .bar{background:#0B1622;color:#E8DEC9;padding:12px 16px;border-radius:3px;
    display:flex;align-items:center;gap:14px;margin-bottom:18px;font-family:system-ui,sans-serif}
  .bar p{margin:0;font-size:13px;flex:1}
  .bar button{font:inherit;font-weight:700;font-size:13px;background:#D4A537;color:#0B1622;
    border:none;border-radius:2px;padding:9px 18px;cursor:pointer}
  header{display:flex;justify-content:space-between;align-items:flex-end;
    border-bottom:2px solid #111;padding-bottom:7px;margin-bottom:13px}
  .nm{font-size:24pt;font-weight:700;line-height:1.05}
  .sb{font-size:10pt;color:#444;margin-top:3px}
  .br{font-size:8pt;letter-spacing:.22em;text-transform:uppercase;color:#777}
  .vits{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px}
  .vit{border:1px solid #111;border-left:3px solid #D4A537;border-radius:2px;padding:7px 3px;text-align:center}
  .vit-n{font-size:20pt;font-weight:700;line-height:1.1}
  .vit-l{font-size:6.5pt;letter-spacing:.1em;text-transform:uppercase;color:#555;margin-top:2px}
  .abils{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:13px}
  .ab{border:1px solid #111;border-radius:2px;padding:6px 3px;text-align:center}
  .ab-l{font-size:6.5pt;letter-spacing:.1em;text-transform:uppercase;color:#555}
  .ab-v{font-size:19pt;font-weight:700;line-height:1.1}
  .ab-m{font-size:9pt;color:#444}
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:11px}
  section{border:1px solid #999;border-radius:2px;padding:9px 11px;margin-bottom:11px;
    break-inside:avoid;page-break-inside:avoid}
  h3{font-size:13pt;border-bottom:2px solid #111;padding-bottom:5px;margin:0 0 11px}
  h4{font-size:9pt;letter-spacing:.13em;text-transform:uppercase;margin:0 0 7px;
    padding-bottom:4px;border-bottom:1px solid #ccc;color:#333}
  .ln{display:flex;align-items:baseline;gap:6px;padding:2px 0;font-size:9.5pt}
  .ln span:not(.dot){flex:1}
  .ln em{font-size:7pt;text-transform:uppercase;color:#888;font-style:normal;letter-spacing:.06em;margin-left:3px}
  /* Drawn, not typed: Windows renders ●/○ from a fallback face at a
     noticeably smaller size than macOS does. */
  .dot{width:7px;height:7px;flex:none!important;box-sizing:border-box;border-radius:50%;
    border:1px solid #bbb;align-self:center;
    -webkit-print-color-adjust:exact;print-color-adjust:exact}
  /* Filled by a border thick enough to close the circle, not by a
     background. Print engines drop background colours unless the user
     ticks "Background graphics", which turned every proficiency dot
     hollow on paper — the ring printed, the fill didn't. Borders always
     print. The background stays as well for the raster and screen
     routes, where it costs nothing. */
  .ln.p .dot{border:3.5px solid #111;background:#111}
  /* Grid, not column-count: CSS multi-column doesn't survive the
     rasteriser the iOS export runs the sheet through. */
  .sk{display:grid;grid-template-columns:1fr 1fr;column-gap:22px}
  p{margin:0 0 6px;font-size:9.5pt;text-align:justify}
  .mut{color:#666;font-style:italic;font-size:8.5pt}
  .actg{font-size:8pt;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
    color:#666;margin:8px 0 3px;border-top:1px solid #ccc;padding-top:6px}
  .actg:first-child{margin-top:0;border-top:none;padding-top:0}
  .inl{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:9.5pt;margin-bottom:7px}
  table.atk{width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:6px}
  table.atk th{text-align:left;font-size:7pt;letter-spacing:.08em;text-transform:uppercase;
    color:#555;border-bottom:1px solid #999;padding:3px 5px}
  table.atk td{padding:3px 5px;border-bottom:1px solid #ddd}
  /* 6mm, not the 14mm the design wants, because Chromium only draws the
     print dialog's date/title/URL headers when the page margin is big enough
     to hold them — measured threshold is 9mm, so anything at or below 8mm
     suppresses them with the checkbox still ticked. 6mm keeps headroom
     against that threshold drifting, and stays clear of the ~5mm most
     printers can't reach. The missing 8mm moves into the body box below, so
     the content measure is unchanged. */
  @page{size:A4 portrait;margin:6mm}
  /* 6mm page margin + 8mm padding = the same 14mm and 182mm measure the
     screen column has. Side margins hold on every page; the top and bottom
     of interior pages get the 6mm page margin alone, since padding only
     applies where the document itself starts and ends. */
  @media print{body{padding:8mm;max-width:none}.bar{display:none}}
</style></head><body>
${interactive ? `<div class="bar"><p>Choose <b>Save as PDF</b> as the destination to get a PDF file.</p>
<button onclick="window.print()">Print / Save as PDF</button></div>` : ""}
<header><div><div class="nm">${esc(name.trim() || "Unnamed")}</div>
<div class="sb">${esc(head)}</div></div><div class="br">Sina Una</div></header>
<div class="vits">${vitals}</div>
<div class="abils">${abils}</div>
<div class="cols"><section><h4>Core</h4>${core}</section>
<section><h4>Saving throws</h4>${saves}</section></div>
<section><h4>Skills</h4><div class="sk">${skills}</div></section>
${attacksHtml ? `<section><h4>Attacks</h4>${attacksHtml}</section>` : ""}
${actionsHtml ? `<section><h4>Class + Ancestry Actions</h4>${actionsHtml}</section>` : ""}
${castBlock}
${ancestrySpellBlock}
<section><h4>Ancestry traits — ${esc(ancestry.name)}</h4>${traits}${dropped}</section>
${classFeats ? `<section><h4>${esc(klass.name)} features</h4>${classFeats}</section>` : ""}
${feats ? `<section><h4>${esc(subclass.name)} — ${esc(subclass.group)}</h4>${feats}</section>` : ""}
${featsHtml ? `<section><h4>Feats</h4>${featsHtml}</section>` : ""}
${bg ? `<section><h4>Background — ${esc(background.name)}</h4>${bg}</section>` : ""}
${inventoryHtml ? `<section><h4>Inventory</h4>${inventoryHtml}</section>` : ""}
${backstoryHtml ? `<section><h4>Backstory</h4>${backstoryHtml}</section>` : ""}
${appx}
</body></html>`;
}
