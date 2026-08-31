import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------
   The Sheet page's right-hand detail drawer.

   The Sheet replaced the old Summary step's stack of always-open
   explanatory panels (Class Features, Ancestry Traits, Feats,
   Reference) with tappable rows — so the prose those panels used to
   print has to land somewhere, and on a phone that somewhere is a
   sheet-over-content panel rather than an inline expander: expanding
   in place pushes every row below it off-screen and loses your place
   in the list, which is exactly what you do NOT want mid-turn at the
   table.

   Deliberately not a <dialog>: Safari on iOS only grew ::backdrop and
   showModal() recently enough that the app still supports phones
   without it, and the app already hand-rolls its modal (.byo-modal-bg)
   the same way. Same reasoning as the hand-rolled router.

   Mounted only while open, so the slide-in animation runs on the
   element's first paint and there's no hidden panel in the a11y tree
   the rest of the time.
------------------------------------------------------------------- */
export default function Drawer({ open, title, subtitle, onClose, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    /* Lock the page behind the drawer: without this, a scroll gesture
       that runs past the end of the drawer's own content keeps going
       in the list underneath, so closing the drawer drops you
       somewhere you never scrolled to. */
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="byo-drawer-bg" role="presentation"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="byo-drawer" role="dialog" aria-modal="true" aria-label={title || "Details"}
           tabIndex={-1} ref={panelRef}>
        <div className="byo-drawer-head">
          <div className="byo-drawer-headtext">
            <div className="byo-drawer-t">{title}</div>
            {subtitle ? <div className="byo-drawer-s">{subtitle}</div> : null}
          </div>
          <button type="button" className="byo-drawer-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="byo-drawer-body">{children}</div>
      </div>
    </div>
  );
}
