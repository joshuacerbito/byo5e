import { ABILITIES } from '../data/progression.js';
import { mod, fmt, ACTION_ORDER, ACTION_LABELS } from './derive.js';

/* Builds a standalone, printable HTML document for the character.
   window.print() can't be used from inside a sandboxed iframe, so the
   sheet is generated as a self-contained file and handed over as a
   download. Everything it needs is passed in explicitly. */
export function buildSheetHTML(ctx) {
  const {
    ancestry, klass, level, subclass, subclassReady, background, name, resolved, armorClass, hitPoints, speed, initiative, passiveSkills, actions, pb, armor, shieldOn, savingThrows, skillTable, casting, chosenSpells, otherSpells, appendix, bgChoice, finalScore,
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

    const actionsHtml = actions.length ? ACTION_ORDER.filter((k) => actions.some((a) => a.action === k))
      .map((k) => `<p class="actg">${esc(ACTION_LABELS[k])}</p>` +
        actions.filter((a) => a.action === k)
          .map((a) => `<p><b>${esc(a.name)}</b> <span class="mut">(${esc(a.source)})</span>. ${esc(a.text)}</p>`).join(""))
      .join("") : "";

    const bg = background ? [
      `<p><b>${esc(background.feature.name)}.</b> ${esc(background.feature.text)}</p>`,
      bgChoice && background.choice ? `<p><b>${esc(background.choice.name)}.</b> ${esc(bgChoice)}</p>` : "",
      `<p><b>Equipment.</b> ${background.equipment.map(esc).join(", ")}.</p>`,
      background.tools?.length ? `<p><b>Tools.</b> ${background.tools.map(esc).join(", ")}.</p>` : "",
    ].join("") : "";

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
      ${[0, 1, 2, 3].map((lvl) => {
        const r = chosenSpells.filter((x) => x.level === lvl);
        if (!r.length) return "";
        return `<p><b>${lvl === 0 ? "Cantrips" : `Level ${lvl}`}.</b> ` +
          r.map((x) => esc(x.name) + (x.src === "phb" ? "" : " *")).join(", ") + `</p>`;
      }).join("")}
      ${otherSpells.trim() ? `<p><b>Other.</b> ${otherSpells.split("\n").map((x) => esc(x.trim())).filter(Boolean).join(", ")}</p>` : ""}
      ${chosenSpells.some((x) => x.src !== "phb") ? `<p class="mut">* island spell — full text in the reference below.</p>` : ""}
      </section>` : "";

    const groups = [...new Set(appendix.map((a) => a.group))];
    const appx = groups.length ? `<div class="brk"></div><h3>Reference</h3>` + groups.map((g) =>
      `<section><h4>${esc(g)}</h4>` +
      appendix.filter((a) => a.group === g).map((a) =>
        `<p><b>${esc(a.name)}.</b> ${esc(a.text)}</p>`).join("") + `</section>`).join("") : "";

    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>${esc(name.trim() || "Unnamed")} — character sheet</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Georgia,'Times New Roman',serif;color:#111;background:#fff;
    max-width:190mm;margin:0 auto;padding:14mm;font-size:10.5pt;line-height:1.45}
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
  .sk{column-count:2;column-gap:22px}
  p{margin:0 0 6px;font-size:9.5pt;text-align:justify}
  .mut{color:#666;font-style:italic;font-size:8.5pt}
  .actg{font-size:8pt;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
    color:#666;margin:8px 0 3px;border-top:1px solid #ccc;padding-top:6px}
  .actg:first-child{margin-top:0;border-top:none;padding-top:0}
  .inl{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:9.5pt;margin-bottom:7px}
  .brk{break-after:page;page-break-after:always}
  @page{margin:14mm}
  @media print{body{padding:0;max-width:none}.bar{display:none}}
</style></head><body>
<div class="bar"><p>Choose <b>Save as PDF</b> as the destination to get a PDF file.</p>
<button onclick="window.print()">Print / Save as PDF</button></div>
<header><div><div class="nm">${esc(name.trim() || "Unnamed")}</div>
<div class="sb">${esc(head)}</div></div><div class="br">Sina Una</div></header>
<div class="vits">${vitals}</div>
<div class="abils">${abils}</div>
<div class="cols"><section><h4>Core</h4>${core}</section>
<section><h4>Saving throws</h4>${saves}</section></div>
<section><h4>Skills</h4><div class="sk">${skills}</div></section>
${actionsHtml ? `<section><h4>Actions</h4>${actionsHtml}</section>` : ""}
<div class="brk"></div>
<section><h4>Ancestry traits — ${esc(ancestry.name)}</h4>${traits}${dropped}</section>
${classFeats ? `<section><h4>${esc(klass.name)} features</h4>${classFeats}</section>` : ""}
${feats ? `<section><h4>${esc(subclass.name)} — ${esc(subclass.group)}</h4>${feats}</section>` : ""}
${bg ? `<section><h4>Background — ${esc(background.name)}</h4>${bg}</section>` : ""}
${castBlock}
${appx}
</body></html>`;
}
