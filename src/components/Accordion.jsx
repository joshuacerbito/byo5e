import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";

/* ------------------------------------------------------------------
   Rows that expand in place, and the section header that opens or
   closes all of them at once.

   The Sheet's other lists open the drawer, which is right for anything
   you tap mid-turn: it covers the page, so it can't push the row you
   were looking at somewhere else. Features and the standard-actions
   list are different — they're read in order, several at a time, when
   you're learning the character rather than acting with it, and a
   drawer makes that a tap-read-dismiss loop per entry.

   Collapsed by default: a Features screen that opened with every
   feature's prose already printed is the Summary step, and the whole
   point of this page is that it isn't.
------------------------------------------------------------------- */

/* Section state, rather than each row owning a boolean: the header's
   chevron has to say whether everything under it is open, which means
   somebody has to know how many rows there are and how many are open.
   Rows register themselves on mount, so a section never has to be told
   its own contents. */
const SectionCtx = createContext(null);

export function AccordionSection({ title, heading: Heading = "h3", className, children }) {
  const [openIds, setOpenIds] = useState(() => new Set());
  const ids = useRef(new Set());
  /* Bumped on register/unregister so the header re-renders and
     recomputes allOpen — a ref alone would leave the chevron stale on
     the first paint, before any row has been opened. */
  const [, bump] = useState(0);

  const register = useCallback((id) => {
    ids.current.add(id);
    bump((n) => n + 1);
    return () => {
      ids.current.delete(id);
      setOpenIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      bump((n) => n + 1);
    };
  }, []);

  const setOpen = useCallback((id, on) => setOpenIds((prev) => {
    const next = new Set(prev);
    if (on) next.add(id); else next.delete(id);
    return next;
  }), []);

  const total = ids.current.size;
  const allOpen = total > 0 && openIds.size >= total;

  return (
    <SectionCtx.Provider value={{ openIds, register, setOpen }}>
      <div className={`byo-accsec-h ${className || ""}`}>
        <Heading>{title}</Heading>
        {total > 0 && (
          /* Labelled, not icon-only: a bare chevron beside a heading
             reads as decoration on a page whose rows already have
             chevrons of their own. The word says what it does; the
             accessible name keeps the "all", which the visible label
             drops for width. */
          <button type="button" className="byo-accsec-t" aria-expanded={allOpen}
                  aria-label={allOpen ? "Collapse all" : "Expand all"}
                  onClick={() => setOpenIds(allOpen ? new Set() : new Set(ids.current))}>
            <span>{allOpen ? "Collapse" : "Expand"}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
      </div>
      {children}
    </SectionCtx.Provider>
  );
}

export default function Accordion({ title, meta, children }) {
  const id = useId();
  const section = useContext(SectionCtx);
  /* Standalone rows keep their own state, so an Accordion outside a
     section still works — the section is an enhancement, not a
     requirement. */
  const [own, setOwn] = useState(false);
  const open = section ? section.openIds.has(id) : own;

  const { register } = section || {};
  useEffect(() => (register ? register(id) : undefined), [register, id]);

  const toggle = () => (section ? section.setOpen(id, !open) : setOwn(!open));

  return (
    <div className={`byo-acc ${open ? "is-open" : ""}`}>
      <button type="button" className="byo-acc-h" aria-expanded={open} onClick={toggle}>
        <span className="byo-acc-n">{title}{meta ? <span className="src">{meta}</span> : null}</span>
        <span className="byo-acc-i" aria-hidden="true">›</span>
      </button>
      {/* Unmounted rather than hidden when collapsed: a feature's blocks
          can be a whole table, and a screen holding twenty of those in
          the DOM for nothing is the one place this page could get
          slow on a phone. */}
      {open && <div className="byo-acc-b">{children}</div>}
    </div>
  );
}
