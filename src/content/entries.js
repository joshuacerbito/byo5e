/* ------------------------------------------------------------------
   5etools entry trees -> plain text + renderable blocks.

   This is the ONLY place in src/ that knows what a {@tag} is. Nothing
   above src/content/ should ever see one.

   PORTED, DELIBERATELY DUPLICATED: `stripTags` and `entriesText` are
   the same logic as `stripTags` / `fmtEntries` in
   scripts/lib/fivetools.mjs. The duplication is on purpose — scripts/
   is node-only build tooling and must never be imported from src/,
   which ships to the browser. If you fix a tag-handling bug in one,
   fix it in the other; the two are meant to produce identical prose.
------------------------------------------------------------------- */

/* 5etools wraps cross-references in {@tag display|source|alias} forms.
   Which pipe-separated field is the human-readable one varies by tag. */
const TAG_FIELD = {
  /* {@scaledamage 2d6|2-9|1d6} — the LAST field is the per-slot
     increment, which is what "At Higher Levels" prose is talking about. */
  scaledamage: (p) => p[p.length - 1],
  scaledice: (p) => p[p.length - 1],
  /* {@book chapter 10|PHB|10|rituals} — first field is the display text. */
  book: (p) => p[0],
  adventure: (p) => p[0],
  /* {@quickref Cover||3||total cover} vs {@quickref difficult terrain||3} */
  quickref: (p) => p[4] || p[0],
  filter: (p) => p[0],
};

/* Everything else that links somewhere puts its display alias in the
   third field when it has one: {@item Holy Water (flask)|phb|holy water}. */
const ALIAS_THIRD = new Set(["item", "spell", "creature", "classFeature",
  "subclassFeature", "optfeature", "feat", "language", "class", "status",
  "variantrule", "race", "background", "condition", "skill", "sense",
  "action", "hazard", "table", "object", "vehicle", "reward", "disease",
  "charoption", "itemType", "deck", "card", "trap", "legroup", "psionic"]);

/* {@deity Azuth|Faerunian|SCAG|display} */
const ALIAS_FOURTH = new Set(["deity"]);

const TAG_PREFIX = { dc: "DC ", chance: "", recharge: "Recharge " };

export function stripTags(s) {
  if (typeof s !== "string") return "";
  let out = s;
  /* Innermost-first, since a few tags nest. */
  for (let i = 0; i < 8; i++) {
    const next = out.replace(/\{@(\w+)\s*([^{}]*)\}/g, (_, tag, body) => {
      const parts = body.split("|");
      const pick = TAG_FIELD[tag]
        || (ALIAS_THIRD.has(tag) ? (p) => p[2] || p[0] : null)
        || (ALIAS_FOURTH.has(tag) ? (p) => p[3] || p[0] : null);
      const val = pick ? pick(parts) : parts[0];
      return (TAG_PREFIX[tag] || "") + (val ?? "").trim();
    });
    if (next === out) break;
    out = next;
  }
  return out.replace(/\s+/g, " ").trim();
}

/* A few 5etools strings are bare "name|SOURCE" pointers rather than
   tagged text — item ids in startingEquipment, weapon-proficiency keys,
   spell names in additionalSpells. `#c` marks a cantrip. */
export function splitUid(uid) {
  const [name, source] = String(uid).split("|");
  const [bare, flag] = String(name).split("#");
  return { name: titleish(bare), source: source ? source.toUpperCase() : null, flag: flag || null };
}

/* Item uids arrive lowercased ("quarterstaff|phb"). Real display names
   are looked up in the pack where possible; this is the fallback. */
function titleish(s) {
  return String(s).replace(/\b[a-z]/g, (m) => m.toUpperCase());
}

/* ---- prose ------------------------------------------------------- */

const cellText = (c) => {
  if (typeof c === "string") return stripTags(c);
  if (c == null) return "";
  if (typeof c === "number") return String(c);
  if (c.roll) {
    if (c.roll.exact != null) return String(c.roll.exact);
    return `${c.roll.min}-${c.roll.max}`;
  }
  if (c.entry) return stripTags(c.entry);
  if (c.entries) return entriesText(c.entries);
  return "";
};

const tableRows = (e) => (e.rows || []).map((r) => (Array.isArray(r) ? r : r.row || []).map(cellText));

/* Flatten a nested entry tree into one prose paragraph. Named
   sub-entries become "Name. text." sentences; tables are flattened into
   "col value / col value; ..." runs. Same output as fmtEntries(). */
export function entriesText(entries) {
  const out = [];
  const walk = (e) => {
    if (e == null) return;
    if (typeof e === "string") { out.push(stripTags(e)); return; }
    if (typeof e === "number") { out.push(String(e)); return; }
    if (Array.isArray(e)) { e.forEach(walk); return; }
    switch (e.type) {
      case "entries":
      case "inset":
      case "section":
      case "options": {
        const name = e.name ? stripTags(e.name).replace(/\.$/, "") : "";
        const body = entriesText(e.entries || []);
        out.push(name ? `${name}. ${body}` : body);
        break;
      }
      case "list":
        (e.items || []).forEach(walk);
        break;
      case "item":
      case "itemSpell":
      case "itemSub": {
        const name = e.name ? stripTags(e.name).replace(/[.:]$/, "") : "";
        const body = [e.entry, ...(e.entries || [])].filter(Boolean).map((x) =>
          (typeof x === "string" ? stripTags(x) : entriesText([x]))).join(" ");
        out.push(name ? `${name}. ${body}` : body);
        break;
      }
      case "table": {
        const cap = e.caption ? `${stripTags(e.caption)} — ` : "";
        const labels = (e.colLabels || []).map(stripTags);
        const rows = tableRows(e).map((r) =>
          r.map((v, i) => (labels[i] ? `${labels[i]} ${v}` : v)).join(" / "));
        out.push(`${cap}${rows.join("; ")}.`);
        break;
      }
      case "quote":
        out.push(entriesText(e.entries || []));
        break;
      /* Rendered numbers the app computes itself, and reference nodes,
         which are resolved structurally rather than inlined as prose. */
      case "abilityDc":
      case "abilityAttackMod":
      case "refOptionalfeature":
      case "refClassFeature":
      case "refSubclassFeature":
      case "refFeat":
        break;
      default:
        if (e.entries) out.push(entriesText(e.entries));
        else if (e.entry) out.push(stripTags(e.entry));
    }
  };
  walk(entries);
  return out.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

/* ---- blocks ------------------------------------------------------
   Structure the UI actually wants to render. Tables in particular MUST
   survive as data: Draconic Ancestry and every class table are tables,
   and prose-flattening them makes them unreadable.

   Block shapes:
     { type:"para",    text }
     { type:"section", name, text, blocks }     (5etools "entries")
     { type:"inset",   name, text, blocks }
     { type:"list",    style, items:[{ name, text, blocks }] }
     { type:"table",   caption, colLabels, rows:[[string]] }
     { type:"options", count, blocks }          (choose N of the following)
     { type:"ref",     refKind, ref }           (unresolved pointer; the
                                                 view-model layer swaps
                                                 these for real options)
     { type:"note",    kind, text }             (abilityDc / abilityAttackMod)
------------------------------------------------------------------- */

const REF_NODES = {
  refClassFeature: ["classFeature", "classFeature"],
  refSubclassFeature: ["subclassFeature", "subclassFeature"],
  refOptionalfeature: ["optionalFeature", "optionalfeature"],
  refFeat: ["feat", "feat"],
};

export function toBlocks(entries, refs = []) {
  const out = [];
  const push = (b) => { if (b) out.push(b); };
  const walk = (e) => {
    if (e == null) return;
    if (typeof e === "string") { const t = stripTags(e); if (t) push({ type: "para", text: t }); return; }
    if (typeof e === "number") { push({ type: "para", text: String(e) }); return; }
    if (Array.isArray(e)) { e.forEach(walk); return; }

    const refDef = REF_NODES[e.type];
    if (refDef) {
      const [refKind, field] = refDef;
      const ref = e[field];
      if (ref) { refs.push({ kind: refKind, ref }); push({ type: "ref", refKind, ref }); }
      return;
    }

    switch (e.type) {
      case "entries":
      case "section":
      case "inset":
      case "quote": {
        const kind = e.type === "inset" ? "inset" : "section";
        push({
          type: kind,
          name: e.name ? stripTags(e.name) : null,
          text: entriesText(e.entries || []),
          blocks: toBlocks(e.entries || [], refs),
        });
        break;
      }
      case "options":
        push({
          type: "options",
          count: e.count ?? 1,
          blocks: toBlocks(e.entries || [], refs),
        });
        break;
      case "list":
        push({
          type: "list",
          style: e.style || null,
          items: (e.items || []).map((it) => {
            if (typeof it === "string") return { name: null, text: stripTags(it), blocks: [] };
            const body = [it.entry, ...(it.entries || [])].filter(Boolean);
            return {
              name: it.name ? stripTags(it.name).replace(/[:.]$/, "") : null,
              text: entriesText(body),
              blocks: toBlocks(body, refs),
            };
          }),
        });
        break;
      case "table":
        push({
          type: "table",
          caption: e.caption ? stripTags(e.caption) : null,
          colLabels: (e.colLabels || []).map(stripTags),
          rows: tableRows(e),
        });
        break;
      case "abilityDc":
      case "abilityAttackMod":
        push({ type: "note", kind: e.type, text: stripTags(e.name || "") });
        break;
      default:
        if (e.entries) walk(e.entries);
        else if (e.entry) walk(e.entry);
    }
  };
  walk(entries);
  return out;
}

/* The one call everything else uses. */
export function flatten(entries) {
  const refs = [];
  const blocks = toBlocks(entries || [], refs);
  return { text: entriesText(entries || []), blocks, refs };
}
