/* ------------------------------------------------------------------
   One collapsible wizard panel, and the "Show More" clamp for long
   body content inside one.

   Collapsing a section strips it back to its HEADINGS — every feature
   name, label and title inside it stays on screen, and only the
   explanatory prose and the controls under them go. Collapsing "Level 1"
   should still tell you what you get at level 1; a bar reading nothing
   but "Level 1" is a worse table of contents than the panel it replaced.

   Two controls drive that one state: the chevron in the header, and the
   Show More / Show Less toggle at the foot of a long section, so a
   section you have scrolled to the bottom of can be closed without
   scrolling back up. They are the same switch, not two depths of
   collapse.

   Core Traits owned the header treatment first (the rotating chevron,
   the mono subtitle under the title); it now renders through this
   component instead of keeping a second copy of it.

   The Sheet's Accordion is a different animal and stays where it is:
   it's a ROW that expands, several to a list, with a section header
   that opens all of them at once. These are page sections.
------------------------------------------------------------------- */
import React, { createContext, useContext, useLayoutEffect, useRef, useState } from "react";

/* Lets a ShowMore inside a section drive that section's own open state
   instead of its local clamp — see the note on ShowMore below. */
const SectionCtx = createContext(null);

const Chevron = ({ up }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
       style={{ transform: up ? "rotate(180deg)" : "none" }}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default function Section({
  title, meta, count, flag, defaultOpen = true, style, children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <SectionCtx.Provider value={{ open, setOpen }}>
    <div className="byo-panel" style={style}>
      {/* Outside the collapsed body: a section that still needs a pick
          has to say so while it's shut, or the player closes it and
          loses the only prompt telling them to come back. */}
      {flag && <span className="byo-panel-flag" title="Needs your pick">⚠</span>}
      <button type="button" className="byo-sec-head" aria-expanded={open}
              onClick={() => setOpen((o) => !o)}>
        <span className="byo-sec-title">
          <span className="byo-sec-h3">
            {title}
            {count ? <span className="byo-count">{count}</span> : null}
          </span>
          {meta ? <span className="byo-sec-sub">{meta}</span> : null}
        </span>
        <span className="byo-sec-chev"><Chevron up={open} /></span>
      </button>
      {/* Rendered whether open or shut. The shut state is a CSS
          treatment (.byo-sec-b.is-shut in styles.js) that hides
          description-level content and leaves the headings standing —
          unmounting the body would take the headings with it. */}
      <div className={`byo-sec-b${open ? "" : " is-shut"}`}>{children}</div>
    </div>
    </SectionCtx.Provider>
  );
}

/* The Show More / Show Less control for a long run of body content.

   Inside a Section it is the header chevron's twin at the foot of the
   panel: same state, same shut treatment (headings stay, descriptions
   go), same label direction. Two controls that both said "less" and
   then collapsed to different depths was the confusing part; one
   behaviour, reachable from either end of a long section, is not.

   Standalone — no Section around it — it falls back to what it was: a
   local clamp to `max` px behind a fade, for body text that needs
   shortening without a section to close.

   Either way the control only appears once the content is actually
   taller than `max`, measured rather than guessed from a character
   count, because a feature's blocks can be a table or a list, not just
   a paragraph. And it starts expanded: nothing on the page arrives with
   text already hidden. */
export function ShowMore({ max = 168, label = "body text", children }) {
  const [own, setOwn] = useState(true);
  const [over, setOver] = useState(false);
  const ref = useRef(null);
  /* Inside a Section, this toggle IS that section's chevron: same state,
     same shut treatment, same everything — Josh asked for one behaviour
     rather than two collapses that look alike and do different things.
     The local clamp is what a ShowMore does on its own, outside a
     section, where there is no header to defer to. */
  const section = useContext(SectionCtx);
  const open = section ? section.open : own;
  const setOpen = section ? (v) => section.setOpen(v) : setOwn;

  /* No dependency list: the content can change height without this
     component's props changing (a feature block finishing layout, a
     pick revealing more prose). setOver with the same value is a
     no-op re-render bail-out in React, so this is cheap. */
  useLayoutEffect(() => {
    const el = ref.current;
    /* Not while the section is shut: the body is a short list of
       headings then, and re-measuring it would decide there is nothing
       worth a toggle and take away the way back open. */
    if (el && (!section || section.open)) setOver(el.scrollHeight > max + 24);
  });

  /* Only the standalone case clamps. In a section, "closed" is the
     section's own shut treatment, which keeps the headings — clamping
     the same content on top of that would fight it. */
  const clamped = over && !open && !section;
  return (
    <div className="byo-more">
      <div ref={ref} className={`byo-more-b${clamped ? " is-clamped" : ""}`}
           style={clamped ? { maxHeight: max } : undefined}>
        {children}
      </div>
      {over && (
        <button type="button" className="byo-more-t" aria-expanded={open}
                aria-label={open ? `Show less ${label}` : `Show more ${label}`}
                onClick={() => setOpen(!open)}>
          {open ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
}
