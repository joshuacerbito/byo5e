/* ------------------------------------------------------------------
   One collapsible wizard panel, and the "Show More" clamp for long
   body content inside one.

   Two separate affordances on purpose. The chevron in the header strips
   a section back to its HEADINGS — every feature name, label and title
   inside it stays on screen, and only the explanatory prose and the
   controls under them go. Collapsing "Level 1" should still tell you
   what you get at level 1; a bar reading nothing but "Level 1" is a
   worse table of contents than the panel it replaced.
   Show More clamps a run of body text INSIDE a section you're keeping
   open, so a level panel whose feature happens to print a full table
   doesn't push the next level off the screen. Collapsing everything
   with one control would have meant choosing between those.

   Core Traits owned the header treatment first (the rotating chevron,
   the mono subtitle under the title); it now renders through this
   component instead of keeping a second copy of it.

   The Sheet's Accordion is a different animal and stays where it is:
   it's a ROW that expands, several to a list, with a section header
   that opens all of them at once. These are page sections.
------------------------------------------------------------------- */
import React, { useLayoutEffect, useRef, useState } from "react";

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
  );
}

/* Clamp long body content to `max` px with a fade, and offer the
   toggle only when there is actually something hidden — a two-line
   feature with a "Show More" under it is noise. Measured rather than
   guessed from a character count, because a feature's blocks can be a
   table or a list, not just a paragraph. */
export function ShowMore({ max = 168, label = "body text", children }) {
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(false);
  const ref = useRef(null);

  /* No dependency list: the content can change height without this
     component's props changing (a feature block finishing layout, a
     pick revealing more prose). setOver with the same value is a
     no-op re-render bail-out in React, so this is cheap. */
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setOver(el.scrollHeight > max + 24);
  });

  const clamped = over && !open;
  return (
    <div className="byo-more">
      <div ref={ref} className={`byo-more-b${clamped ? " is-clamped" : ""}`}
           style={clamped ? { maxHeight: max } : undefined}>
        {children}
      </div>
      {over && (
        <button type="button" className="byo-more-t" aria-expanded={open}
                aria-label={open ? `Show less ${label}` : `Show more ${label}`}
                onClick={() => setOpen((o) => !o)}>
          {open ? "Show Less" : "Show More"}
        </button>
      )}
    </div>
  );
}
