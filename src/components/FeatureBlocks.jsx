/* ------------------------------------------------------------------
   FeatureBlocks — renders a feature's `blocks` tree (see
   src/content/entries.js's toBlocks doc comment for the shapes) instead
   of its flattened `text`, so multi-section features like Pact Magic
   or Draconic Ancestry keep their headings, lists, and tables instead
   of reading as one run-on paragraph.

   `options` blocks are skipped: those are choice pickers (Fighting
   Style, Metamagic, Pact Boon, ...) already surfaced by the caller via
   feature.choices and its own picker UI — rendering them here too
   would just duplicate that.
------------------------------------------------------------------- */
import React from "react";

/* PHB/XPHB are each edition's own default core rulebook — every ref in
   this SRD-only app already lives in one of those two, so citing it back
   is always redundant noise ("(XPHB)" on a feature the app itself only
   has XPHB content for). Only a genuinely different sourcebook would be
   worth surfacing, and the SRD packs this app ships don't carry any. */
const DEFAULT_HANDBOOKS = new Set(["phb", "xphb"]);

function RefBlock({ block }) {
  const showSource = block.source && !DEFAULT_HANDBOOKS.has(block.source.toLowerCase());
  return (
    <p className="byo-fb-ref">
      See <b>{block.name}</b>{showSource ? ` (${block.source})` : ""}.
    </p>
  );
}

function ListBlock({ block }) {
  const Tag = block.style === "ordered" ? "ol" : "ul";
  return (
    <Tag className="byo-fb-list">
      {block.items.map((it, i) => (
        <li className="byo-fb-item" key={i}>
          {it.name && <b>{it.name}. </b>}
          {it.blocks.length ? <FeatureBlocks blocks={it.blocks} inline /> : it.text}
        </li>
      ))}
    </Tag>
  );
}

function TableBlock({ block }) {
  return (
    <div className="byo-fb-table-wrap">
      {block.caption && <div className="byo-fb-caption">{block.caption}</div>}
      <table className="byo-fb-table">
        {block.colLabels.length > 0 && (
          <thead>
            <tr>{block.colLabels.map((c, i) => <th key={i}>{c}</th>)}</tr>
          </thead>
        )}
        <tbody>
          {block.rows.map((row, ri) => (
            <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionBlock({ block }) {
  return (
    <div className="byo-fb-section">
      {block.name && <h4 className="byo-fb-h">{block.name}</h4>}
      <FeatureBlocks blocks={block.blocks} />
    </div>
  );
}

/* `inline` renders bare paragraphs (no section/list wrapper markup) for
   use inside a list item, which supplies its own <li>. */
export default function FeatureBlocks({ blocks, inline }) {
  if (!blocks?.length) return null;
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "para": return <p className="byo-fb-p" key={i}>{b.text}</p>;
          case "section":
          case "inset":
            return inline
              ? (
                <React.Fragment key={i}>
                  {b.name && <b>{b.name}. </b>}
                  <FeatureBlocks blocks={b.blocks} inline />
                </React.Fragment>
              )
              : <SectionBlock block={b} key={i} />;
          case "list": return <ListBlock block={b} key={i} />;
          case "table": return <TableBlock block={b} key={i} />;
          case "ref": return <RefBlock block={b} key={i} />;
          case "note": return <p className="byo-fb-note" key={i}>{b.text}</p>;
          case "options": return null;
          default: return null;
        }
      })}
    </>
  );
}
