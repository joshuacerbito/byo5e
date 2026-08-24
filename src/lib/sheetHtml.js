import { ABILITIES } from '../data/progression.js';
import { mod, fmt, groupWeapons, parseStartingGold, ACTION_ORDER, ACTION_LABELS } from './derive.js';

/* Builds a standalone, printable HTML document for the character.
   Everything it needs is passed in explicitly.

   `interactive` controls the on-page toolbar at the top. The downloaded
   file keeps it, since someone opening that file needs a way to print.
   The copy printSheet() loads into its hidden iframe passes false: the
   print dialog is meant to be the first and only thing that appears, and
   a button nobody can click has no business rendering behind it. */
export function buildSheetHTML(ctx, { interactive = true } = {}) {
  const {
    ancestry, klass, level, subclass, subclassReady, background, name, resolved, armorClass, hitPoints, speed, initiative, passiveSkills, pb, armor, shieldOn, savingThrows, skillTable, casting, chosenSpells, otherSpells, appendix, bgChoice, finalScore,
    attackRows, masteryEnabled, carriedWeapons, actions,
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
      `<div class="ln${s.proficient ? " p" : ""}"><span class="dot">${s.proficient ? "●" : "○"}</span>` +
      `<span>${s.label}</span><b>${fmt(s.value)}</b></div>`).join("");

    const skills = skillTable.map((s) =>
      `<div class="ln${s.proficient ? " p" : ""}"><span class="dot">${s.proficient ? "●" : "○"}</span>` +
      `<span>${s.name} <em>${s.ability}</em></span><b>${fmt(s.value)}</b></div>`).join("");

    const traits = resolved.traits.map((t) =>
      `<p><b>${esc(t.name)}.</b> ${esc(t.text)}</p>`).join("");
    const dropped = resolved.droppedTraits.length
      ? `<p class="mut">Replaced by this lineage: ${resolved.droppedTraits.map((t) => esc(t.name)).join(", ")}.</p>` : "";

    const classFeats = klass
      ? (klass.features || []).filter((f) => f[0] <= level)
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
       that carries the full text, rather than repeating it up here. */
    const actionsHtml = actions?.length
      ? ACTION_ORDER.filter((k) => actions.some((a) => a.action === k)).map((k) => `
        <p class="mut">${esc(ACTION_LABELS[k])}</p>
        ${actions.filter((a) => a.action === k).map((a) => `<p><b>${esc(a.name)}</b> — See ${esc(a.section)}.</p>`).join("")}
      `).join("")
      : "";

    const bg = background ? [
      `<p><b>${esc(background.feature.name)}.</b> ${esc(background.feature.text)}</p>`,
      bgChoice && background.choice ? `<p><b>${esc(background.choice.name)}.</b> ${esc(bgChoice)}</p>` : "",
      `<p><b>Equipment.</b> ${background.equipment.map(esc).join(", ")}.</p>`,
      background.tools?.length ? `<p><b>Tools.</b> ${background.tools.map(esc).join(", ")}.</p>` : "",
    ].join("") : "";

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
    const ABIL_LABEL = { str: "STR", dex: "DEX", con: "CON", int: "INT", wis: "WIS", cha: "CHA" };
    const spellHitDC = (sp) => {
      if (sp.atk) return fmt(casting.attack);
      if (sp.save) return `${ABIL_LABEL[sp.save] || sp.save.toUpperCase()} ${casting.saveDC}`;
      return "—";
    };
    const spellEffect = (sp) => {
      if (sp.heal) return sp.heal;
      if (sp.dmg) return `${sp.dmg}${sp.dmgType ? ` ${sp.dmgType}` : ""}`;
      if (sp.cond) return sp.cond[0].toUpperCase() + sp.cond.slice(1);
      return "—";
    };

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
      <table class="atk"><thead><tr><th>Name</th><th>Time</th><th>Range</th><th>Hit/DC</th><th>Effect</th><th>Notes</th></tr></thead>
      <tbody>${chosenSpells.map((sp) => `<tr><td>${esc(sp.name)}${sp.src === "phb" ? "" : " *"}</td>` +
        `<td>${esc(sp.time)}</td><td>${esc(sp.range)}</td><td>${esc(spellHitDC(sp))}</td>` +
        `<td>${esc(spellEffect(sp))}</td><td>${[sp.ritual && "ritual", sp.conc && "conc"].filter(Boolean).map(esc).join(", ") || "—"}</td></tr>`).join("")}</tbody></table>` : ""}
      ${otherSpells.trim() ? `<p><b>Other.</b> ${otherSpells.split("\n").map((x) => esc(x.trim())).filter(Boolean).join(", ")}</p>` : ""}
      ${chosenSpells.some((x) => x.src !== "phb") ? `<p class="mut">* island spell — full text in the reference below.</p>` : ""}
      </section>` : "";

    const groups = [...new Set(appendix.map((a) => a.group))];
    const appx = groups.length ? `<h3>Reference</h3>` + groups.map((g) =>
      `<section><h4>${esc(g)}</h4>` +
      appendix.filter((a) => a.group === g).map((a) =>
        `<p><b>${esc(a.name)}.</b> ${esc(a.text)}</p>`).join("") + `</section>`).join("") : "";

    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(name.trim() || "Unnamed")} — character sheet</title>
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
  .dot{font-size:8pt;width:9px;flex:none!important;color:#bbb}
  .ln.p .dot{color:#111}
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
  @page{size:A4 portrait;margin:14mm}
  @media print{body{padding:0;max-width:none}.bar{display:none}}
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
${actionsHtml ? `<section><h4>Other Actions</h4>${actionsHtml}</section>` : ""}
${castBlock}
<section><h4>Ancestry traits — ${esc(ancestry.name)}</h4>${traits}${dropped}</section>
${classFeats ? `<section><h4>${esc(klass.name)} features</h4>${classFeats}</section>` : ""}
${feats ? `<section><h4>${esc(subclass.name)} — ${esc(subclass.group)}</h4>${feats}</section>` : ""}
${bg ? `<section><h4>Background — ${esc(background.name)}</h4>${bg}</section>` : ""}
${inventoryHtml ? `<section><h4>Inventory</h4>${inventoryHtml}</section>` : ""}
${appx}
</body></html>`;
}
