import { useState } from "react";
import FeatureBlocks from "./FeatureBlocks.jsx";
import Accordion, { AccordionSection } from "./Accordion.jsx";

/* ------------------------------------------------------------------
   Class/subclass features (tabbed per class once multiclassed),
   ancestry traits, feats and the background feature — the four panels
   the Summary step has always printed, shared with the Sheet page.

   `accordion` decides how an entry reads. Without it (the Summary step)
   every entry prints its full text inline, as that page always has.
   With it (the Sheet) each entry is collapsed to its name until you
   open it. Features are read several at a time when you're
   learning a character, which a drawer turns into a tap-read-dismiss
   loop per entry — so this one list expands in place instead.
------------------------------------------------------------------- */
function Entry({ name, meta, blocks, text, accordion }) {
  const body = blocks?.length ? <FeatureBlocks blocks={blocks} /> : text;
  if (accordion) return <Accordion title={name} meta={meta}>{body}</Accordion>;
  return (
    <div className="byo-trait">
      <div className="byo-trait-n">{name}{meta ? <span className="src">{meta}</span> : null}</div>
      <div className="byo-trait-t">{body}</div>
    </div>
  );
}

/* The panel heading, with the section's expand/collapse-all chevron
   beside it when these entries are accordions. Plain <h3> otherwise —
   the Summary step's entries are always open, so there'd be nothing
   for the control to do. */
function Head({ accordion, title, children }) {
  if (!accordion) return <><h3>{title}</h3>{children}</>;
  return <AccordionSection title={title}>{children}</AccordionSection>;
}

export default function FeaturesPanel({ ctx, accordion }) {
  const { ancestry, background, resolved, chosenFeats, classFeatureGroups } = ctx;

  /* One tab per class only when multiclassed — a single-class character
     just gets the flat list, no tab strip. */
  const classGroups = (classFeatureGroups || []).filter((g) => g.features.length > 0);
  const [tab, setTab] = useState(null);
  const activeTab = classGroups.some((g) => g.classId === tab) ? tab : classGroups[0]?.classId;

  return (
    <>
      {classGroups.length > 0 && (
        <div className="byo-panel">
          <Head accordion={accordion} title="Class Features">
          {classGroups.length > 1 && (
            <div className="byo-actiontabs" role="tablist">
              {classGroups.map((g) => (
                <button type="button" key={g.classId} role="tab"
                        className={`byo-actiontab ${activeTab === g.classId ? "is-sel" : ""}`}
                        onClick={() => setTab(g.classId)} aria-selected={activeTab === g.classId}>
                  {g.className}
                </button>
              ))}
            </div>
          )}
          {classGroups.find((g) => g.classId === activeTab)?.features.map((f, i) => (
            <Entry key={`${f.level}-${f.name}-${i}`} name={f.name} meta={`level ${f.level}`}
                   blocks={f.blocks} text={f.text} accordion={accordion} />
          ))}
          </Head>
        </div>
      )}

      {resolved?.traits?.length > 0 && (
        <div className="byo-panel">
          <Head accordion={accordion}
                title={<>Ancestry Traits <span className="byo-count">{ancestry.name}</span></>}>
          {resolved.traits.map((t) => (
            <Entry key={t.name} name={t.name} blocks={t.blocks} text={t.text} accordion={accordion} />
          ))}
          </Head>
          {resolved.droppedTraits?.length > 0 && (
            <p className="byo-note" style={{ marginTop: 10 }}>
              Replaced by this lineage: {resolved.droppedTraits.map((t) => t.name).join(", ")}.
            </p>
          )}
        </div>
      )}

      {chosenFeats?.length > 0 && (
        <div className="byo-panel">
          <Head accordion={accordion} title="Feats">
          {chosenFeats.map(({ feat, from, bonus }) => (
            <Entry key={feat.id} name={feat.name} meta={`${from}${bonus ? ` · ${bonus}` : ""}`}
                   blocks={feat.blocks} text={feat.text} accordion={accordion} />
          ))}
          </Head>
        </div>
      )}

      {background?.feature && (
        <div className="byo-panel">
          <Head accordion={accordion}
                title={<>Background <span className="byo-count">{background.name}</span></>}>
          <Entry name={background.feature.name} blocks={background.feature.blocks}
                 text={background.feature.text} accordion={accordion} />
          </Head>
        </div>
      )}
    </>
  );
}
