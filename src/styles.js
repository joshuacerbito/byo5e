/* All component styling. Imported as a template string into the
   root component's <style> tag.

   Palette + type is "homebrewed sourcebook page": parchment ground, ink
   text, oxblood accent — deliberately not WotC's specific PHB red/trade
   dress, same reasoning as avoiding the dragon-ampersand mark elsewhere
   (see plans/legal-aspects.md §5). Every rule below still reads its
   color/font through the --tokens and 3 font-family strings on .byo-root,
   so this is a token swap, not a component-by-component rewrite — the
   one deliberate exception is print/PDF export (src/pdf/, sheetHtml.js),
   which is a separate styling system and out of scope here. */
export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Vollkorn:ital,wght@0,400;0,600;0,700;1,400&family=Courier+Prime:wght@400;700&display=swap');

.byo-root, .byo-root *, .byo-root *::before, .byo-root *::after{box-sizing:border-box;}
.byo-root{
  --abyss:#EAE0BE; --rock:#F3EAD1; --rock-2:#E4D6A7; --line:#B79F6B; --line-bright:#8C6E38;
  --gold:#7A2E2E; --gold-dim:#A6673D; --jade:#3F6B3F; --coral:#B33A15;
  --bone:#2B1D0E; --bone-dim:#6B5A3E;
  /* Paper grain: a tiled SVG feTurbulence filter, inlined as a data URI
     so there's no external asset — same self-contained rule as the
     Google Fonts @import above. feColorMatrix's alpha row (the last one)
     is what turns turbulence into speckle rather than a visible cloud:
     it drives opacity off the turbulence's own red channel instead of
     passing a flat alpha through, so the tint varies pixel to pixel. */
  background-color:var(--abyss);
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.3 0 0 0 0 0.22 0 0 0 0 0.1 0.4 0 0 0 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
    radial-gradient(circle at 15% 20%, rgba(139,111,58,.14), transparent 42%),
    radial-gradient(circle at 85% 15%, rgba(139,111,58,.11), transparent 46%),
    radial-gradient(circle at 60% 85%, rgba(139,111,58,.13), transparent 50%),
    radial-gradient(circle at 10% 90%, rgba(139,111,58,.10), transparent 40%);
  background-repeat:repeat, no-repeat, no-repeat, no-repeat, no-repeat;
  background-blend-mode:multiply, normal, normal, normal, normal;
  color:var(--bone);
  font-family:'Vollkorn',serif; min-height:100vh;
  padding:28px 18px 120px; -webkit-font-smoothing:antialiased;
}
.byo-wrap{max-width:min(94vw,1180px);margin:0 auto;}
.byo-account{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-bottom:8px;}
.byo-h1{font-family:'Cinzel',serif;font-weight:900;font-size:34px;line-height:1.15;
  margin:0 0 4px;color:var(--gold);letter-spacing:.01em;}
/* The wizard header's h1 doubles as a "back to Splash" link — this just
   strips button chrome so <button class="byo-h1 byo-h1-link"> reads
   identically to the plain <h1> Splash itself uses. */
.byo-h1-link{background:none;border:none;padding:0;display:block;cursor:pointer;
  text-align:left;}
.byo-h1-link:hover{color:#9C3A3A;}
.byo-h1-link:focus-visible{outline:2px solid var(--jade);outline-offset:3px;}
.byo-h2{font-family:'Courier Prime',monospace;font-size:12px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--bone-dim);margin:10px 0 22px;}
/* Total Level, Class step once multiclassed — the single most prominent
   thing on the page, same weight class as the app's own h1 but its own
   color/font so it doesn't read as the app title. */
.byo-totallevel-row{display:flex;align-items:center;justify-content:space-between;
  gap:14px;margin:0 0 14px;flex-wrap:wrap;}
.byo-totallevel{font-family:'Cinzel',serif;font-weight:900;font-size:24px;
  line-height:1.1;margin:0;color:var(--bone);letter-spacing:.01em;}
.byo-sub{color:var(--bone-dim);font-size:15.5px;margin:0 0 22px;}
@media(max-width:430px){
  /* Top padding was 20px here, less than the 28px desktop gets — backwards
     for a phone, where the title sat right at the glass edge with the big
     Cinzel caps making it read even tighter. Give mobile more headroom, not
     less; side padding trims a bit to keep content width reasonable. */
  .byo-root{padding:36px 14px 130px;}
  .byo-h1{font-size:29px;}
}

/* Step rail — numbered, one line always. Fits flat on a wide viewport
   since .byo-wrap grows with it; too narrow for that and it scrolls
   sideways as one row rather than wrapping into a tall stack. */
.byo-rail{display:flex;gap:4px;align-items:center;margin:0 0 26px;flex-wrap:nowrap;
  overflow-x:auto;overflow-y:hidden;scrollbar-width:thin;-webkit-overflow-scrolling:touch;
  padding-bottom:2px;}
.byo-chev{display:flex;align-items:center;gap:8px;background:none;border:1px solid transparent;
  padding:8px 10px;margin:0;font:inherit;cursor:pointer;border-radius:7px;min-height:36px;
  flex:none;white-space:nowrap;-webkit-tap-highlight-color:transparent;}
.byo-chev:disabled{cursor:default;}
.byo-chev:not(:disabled):hover{background:var(--rock-2);border-color:var(--line);}
.byo-chev:not(:disabled):active{background:var(--rock-2);}
.byo-chev.is-now{background:var(--rock-2);border-color:var(--gold-dim);}
.byo-chev-n{display:flex;align-items:center;justify-content:center;flex:none;
  width:20px;height:20px;border-radius:50%;border:1px solid var(--bone-dim);
  font-family:'Courier Prime',monospace;font-size:11px;font-weight:700;color:var(--bone-dim);}
.byo-chev.is-now .byo-chev-n{border-color:var(--gold);color:var(--gold);}
.byo-chev.is-done .byo-chev-n{border-color:var(--jade);color:var(--jade);background:rgba(63,107,63,.12);}
.byo-chev-label{font-family:'Courier Prime',monospace;font-size:12px;letter-spacing:.08em;
  text-transform:uppercase;color:var(--bone-dim);}
.byo-chev.is-now .byo-chev-label{color:var(--gold);}
.byo-chev.is-done .byo-chev-label{color:var(--jade);}
.byo-chev.is-todo .byo-chev-label{color:var(--bone-dim);}
.byo-chev:disabled .byo-chev-label{opacity:.55;}

/* Below the phone breakpoint the rail becomes a native select — one
   thumb-reachable row instead of a horizontally-scrolling strip of
   12+ chevrons that hides most of its own state off-screen. */
.byo-rail-select{display:none;}
@media(max-width:640px){
  .byo-rail{display:none;}
  .byo-rail-select{display:block;width:100%;margin:0 0 22px;appearance:none;
    background:var(--rock) url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="6"><path d="M0 0l5 6 5-6z" fill="%237A2E2E"/></svg>') no-repeat right 14px center;
    border:1px solid var(--gold-dim);border-radius:3px;color:var(--gold);
    font-family:'Courier Prime',monospace;font-size:13px;letter-spacing:.05em;
    padding:12px 34px 12px 14px;min-height:44px;}
  .byo-rail-select:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
}

.byo-card{background:var(--rock);border:1px dashed var(--line-bright);border-radius:3px;
  padding:16px 18px;margin-bottom:10px;cursor:pointer;transition:border-color .14s,background .14s;
  text-align:left;width:100%;display:block;font:inherit;color:inherit;}
.byo-card:hover{border-color:var(--gold-dim);background:var(--rock-2);}
.byo-card.is-sel{border-style:solid;border-color:var(--gold);background:var(--rock-2);
  box-shadow:inset 3px 0 0 var(--gold);}
.byo-card:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.byo-card-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}
.byo-card-name{font-family:'Vollkorn',serif;font-weight:600;font-size:21px;color:var(--bone);flex:1;}
.byo-card-top .byo-dot{align-self:center;}
.byo-card-kind{font-family:'Courier Prime',monospace;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--gold-dim);white-space:nowrap;}
.byo-card-blurb{font-size:14.5px;color:var(--bone-dim);margin:6px 0 10px;line-height:1.45;}
.byo-pills{display:flex;gap:5px;flex-wrap:wrap;}
.byo-pill{font-family:'Courier Prime',monospace;font-size:11px;font-weight:700;
  border:1px solid var(--gold-dim);color:var(--gold);border-radius:2px;padding:2px 6px;}
.byo-pill.alt{border-color:var(--line);color:var(--bone-dim);}

.byo-panel{position:relative;background:var(--rock);border:1px solid var(--line);border-radius:2px;padding:16px 18px;
  margin-bottom:14px;box-shadow:0 1px 0 rgba(139,111,58,.35),inset 0 0 0 1px rgba(243,234,209,.4);}
.byo-panel h3{font-family:'Vollkorn',serif;font-weight:600;font-size:17.5px;margin:0 0 10px;}
/* Header row with a right-aligned action (e.g. the Level panel's "Add new
   Multiclass" CTA) — h3's own bottom margin already spaces it from the
   panel body below, so it's zeroed here to avoid doubling up. */
.byo-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.byo-panel-head h3{margin:0 0 10px;}
.byo-panel-flag{position:absolute;top:-12px;left:-12px;width:26px;height:26px;border-radius:50%;
  background:var(--rock);border:1px solid var(--coral);color:var(--coral);
  display:flex;align-items:center;justify-content:center;font-size:14px;cursor:help;}

/* Fluid 2-up layout: falls back to a single column when the viewport
   doesn't have room for two, no media query needed. */
.byo-panel-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;align-items:start;}
.byo-panel-grid .byo-panel{margin-bottom:0;}
.byo-card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;}
.byo-card-grid .byo-card{margin-bottom:0;}
/* Splash screen — its own narrower, centered wrap rather than the
   wizard's near-full-width one, and its 3 entry options stacked in a
   single column rather than the grid other multi-panel screens use:
   this is a front door with one decision to make at a time, not a
   dense data step. */
.byo-splash-wrap{max-width:520px;}
.byo-splash-stack{display:flex;flex-direction:column;gap:14px;}
/* Deliberately quiet — fine print under the options, not part of the
   pitch above them. Same info as before, just no longer competing with
   the intro blurb for attention. */
.byo-splash-footnote{font-size:12.5px;color:var(--bone-dim);text-align:center;
  margin:16px 0 0;opacity:.75;}
.byo-splash-card{display:flex;flex-direction:column;}
.byo-splash-card .byo-note{flex:1;margin-bottom:14px;}
.byo-splash-card .byo-btn{width:100%;margin-left:0;}
.byo-note{font-size:14.5px;color:var(--bone-dim);line-height:1.5;margin:0;}

.byo-choice{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;}
.byo-opt{font-family:'Courier Prime',monospace;font-size:12px;font-weight:700;letter-spacing:.08em;
  background:transparent;border:1px solid var(--line);color:var(--bone-dim);
  padding:8px 14px;border-radius:2px;cursor:pointer;}
.byo-opt:hover{border-color:var(--gold-dim);color:var(--bone);}
.byo-opt.is-sel{border-color:var(--gold);color:var(--abyss);background:var(--gold);}
.byo-opt:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
/* Class tabs (Class step, once multiclassed) reuse .byo-opt's selected/hover
   behavior but read as a class name first, not a small option toggle — bigger,
   serif, normal case. */
.byo-opt.byo-tab-class{font-family:'Vollkorn',serif;font-size:16px;font-weight:700;
  letter-spacing:0;text-transform:none;padding:9px 16px;}

.byo-row{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);}
.byo-row:last-child{border-bottom:none;}
.byo-row-label{flex:1;font-size:15.5px;}
/* A wand's charges/casts-what line, under its name in the Gear row —
   same treatment as .byo-note but block-level so it wraps onto its own
   line rather than running into the name on a narrow screen. */
.byo-item-mech{display:block;font-size:12.5px;color:var(--gold-dim);margin-top:2px;}
.byo-step{display:flex;align-items:center;gap:8px;}
.byo-btn-sq{width:26px;height:26px;border:1px solid var(--line);background:transparent;
  color:var(--bone);font-size:16.5px;line-height:1;border-radius:2px;cursor:pointer;}
.byo-btn-sq:hover:not(:disabled){border-color:var(--gold);color:var(--gold);}
.byo-btn-sq:disabled{opacity:.28;cursor:not-allowed;}
.byo-num{font-family:'Courier Prime',monospace;font-size:16.5px;font-weight:700;
  width:24px;text-align:center;}
.byo-arrow{font-family:'Courier Prime',monospace;font-size:12px;color:var(--gold-dim);width:34px;text-align:center;}
.byo-final{font-family:'Courier Prime',monospace;font-size:18.5px;font-weight:700;
  color:var(--gold);width:26px;text-align:right;}
.byo-mod{font-family:'Courier Prime',monospace;font-size:13px;color:var(--bone-dim);width:32px;text-align:right;}
.byo-sel{background:var(--rock-2);border:1px solid var(--line);color:var(--bone);
  font-family:'Courier Prime',monospace;font-size:14.5px;padding:6px 8px;border-radius:2px;}

/* pp/gp/sp/cp fields — four-across on a wide panel, but the panel itself
   narrows to a phone's width long before the row does, so at 4-up each
   field's label gets crushed against the next field's input. 2-up keeps
   every field readable at any width. */
.byo-currency{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
.byo-currency-f{display:flex;align-items:center;gap:6px;}
.byo-currency-f .byo-sel{width:100%;min-width:0;}
@media(max-width:480px){.byo-currency{grid-template-columns:repeat(2,1fr);}}

.byo-budget{display:flex;justify-content:space-between;align-items:baseline;
  border:1px solid var(--line);border-radius:3px;padding:10px 14px;margin-bottom:12px;
  background:var(--rock);}
.byo-budget-n{font-family:'Courier Prime',monospace;font-size:24px;font-weight:700;color:var(--gold);}
.byo-budget-n.zero{color:var(--jade);}
.byo-budget-l{font-family:'Courier Prime',monospace;font-size:11px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--bone-dim);}

.byo-trait{padding:9px 0;border-bottom:1px solid var(--line);}
.byo-trait:last-child{border-bottom:none;}
.byo-trait-n{font-weight:700;font-size:14.5px;color:var(--bone);}
.byo-trait-n .src{font-family:'Courier Prime',monospace;font-size:10px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--gold-dim);margin-left:7px;}
.byo-trait-t{font-size:14.5px;color:var(--bone-dim);line-height:1.5;margin-top:2px;}

/* FeatureBlocks — structured feature text (sections, lists, tables)
   instead of one flattened paragraph. Sits wherever .byo-note used to. */
.byo-fb-p{font-size:14.5px;color:var(--bone-dim);line-height:1.5;margin:0 0 8px;}
.byo-fb-p:last-child{margin-bottom:0;}
.byo-fb-section{margin:10px 0;}
.byo-fb-section:first-child{margin-top:0;}
.byo-fb-section:last-child{margin-bottom:0;}
.byo-fb-h{font-family:'Courier Prime',monospace;font-size:11.5px;letter-spacing:.08em;
  text-transform:uppercase;color:var(--gold-dim);margin:0 0 4px;}
.byo-fb-list{margin:0 0 8px;padding-left:18px;}
.byo-fb-list:last-child{margin-bottom:0;}
.byo-fb-item{font-size:14.5px;color:var(--bone-dim);line-height:1.5;margin-bottom:4px;}
.byo-fb-item:last-child{margin-bottom:0;}
.byo-fb-note{font-size:13px;color:var(--bone-dim);font-style:italic;margin:0 0 8px;}
.byo-fb-ref{font-size:14.5px;color:var(--bone-dim);line-height:1.5;margin:0 0 8px;}
.byo-fb-table-wrap{overflow-x:auto;margin:0 0 8px;-webkit-overflow-scrolling:touch;}
.byo-fb-caption{font-size:12.5px;color:var(--bone-dim);margin:0 0 4px;}
.byo-fb-table{border-collapse:collapse;width:100%;font-size:13.5px;color:var(--bone-dim);}
.byo-fb-table th{font-family:'Courier Prime',monospace;font-size:10.5px;letter-spacing:.08em;
  text-transform:uppercase;color:var(--bone-dim);text-align:left;padding:4px 10px 4px 0;
  border-bottom:1px solid var(--line);white-space:nowrap;}
.byo-fb-table td{padding:5px 10px 5px 0;border-bottom:1px solid var(--line);white-space:nowrap;}
.byo-fb-table tr:last-child td{border-bottom:none;}

.byo-actgroup-l{font-family:'Courier Prime',monospace;font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--jade);margin:14px 0 4px;}
.byo-actgroup-l:first-child{margin-top:0;}

.byo-stub{border:1px dashed var(--line);border-radius:3px;padding:34px 20px;text-align:center;}
.byo-stub-t{font-family:'Vollkorn',serif;font-size:18.5px;color:var(--bone-dim);margin:0 0 6px;}
.byo-stub-s{font-size:14.5px;color:var(--bone-dim);margin:0;}

.byo-input{width:100%;box-sizing:border-box;background:var(--rock-2);border:1px solid var(--line);color:var(--bone);
  font-family:'Vollkorn',serif;font-size:21px;padding:11px 13px;border-radius:2px;}
.byo-input:focus{outline:none;border-color:var(--gold);}

.byo-filter-row{display:flex;flex-wrap:wrap;gap:16px;margin-bottom:10px;}
.byo-filter-grp{display:flex;flex-direction:column;}
.byo-filter-lbl{display:block;font-family:'Courier Prime',monospace;font-size:10px;letter-spacing:.12em;
  color:var(--bone-dim);margin-bottom:4px;}

.byo-nav{position:fixed;left:0;right:0;bottom:0;background:rgba(234,224,190,.94);
  border-top:1px solid var(--line);padding:13px 18px;backdrop-filter:blur(8px);}
.byo-nav-in{max-width:min(94vw,1180px);margin:0 auto;display:flex;gap:10px;align-items:center;}
.byo-btn{font-family:'Vollkorn',serif;font-weight:700;font-size:15.5px;padding:11px 22px;
  border-radius:2px;cursor:pointer;border:1px solid var(--line);background:transparent;color:var(--bone-dim);}
.byo-btn:hover:not(:disabled){border-color:var(--gold-dim);color:var(--bone);}
.byo-btn-go{background:var(--gold);border-color:var(--gold);color:var(--abyss);margin-left:auto;}
.byo-btn-go:hover:not(:disabled){background:#9C3A3A;border-color:#9C3A3A;color:var(--abyss);}
.byo-btn:disabled{opacity:.32;cursor:not-allowed;}
.byo-btn:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.byo-hint{font-family:'Courier Prime',monospace;font-size:11px;color:var(--coral);
  letter-spacing:.08em;text-transform:uppercase;}
.byo-linkbtn{font:inherit;background:none;border:none;padding:0;margin:0;cursor:pointer;
  color:var(--gold-dim);text-decoration:underline;text-underline-offset:2px;}
.byo-linkbtn:hover{color:var(--gold);}
.byo-linkbtn:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.byo-linkbtn:disabled{color:var(--bone-dim);text-decoration:none;cursor:default;}

/* Start over holds the left end and everything else is pushed right, so
   Back and Next end up adjacent as a pair. Scoped to the nav: the same
   button class is used on the Sheet step, where it must not stretch. */
.byo-nav .byo-btn-danger{margin-right:auto;}
/* .byo-btn-go carries margin-left:auto so it can push itself right in
   other rows; here Start over already owns the free space, and leaving
   it on split Back and Next apart by 150px on a wide screen. */
.byo-nav .byo-btn-go{margin-left:0;}

/* Three buttons now live in the footer — Back, Start over, Next — and at
   phone widths the default 22px side padding overflows the row. 480px, not
   430: a 440px-wide phone (a real, common width, not just small ones) was
   still hitting the full-size row and clipping "Done" off the edge. */
@media(max-width:480px){
  .byo-nav{padding:11px 12px;}
  .byo-nav-in{gap:6px;}
  .byo-nav .byo-btn{padding:11px 12px;font-size:14.5px;}
}

/* The error-boundary fallback. It renders where the app would have been,
   so it carries its own page padding — there is no wizard chrome left to
   sit inside when the root boundary is the one that caught. */
.byo-crash{max-width:640px;margin:0 auto;padding:40px 18px;}
.byo-crash-msg{margin:14px 0 0;font-family:'Courier Prime',monospace;font-size:12.5px;
  color:var(--bone-dim);word-break:break-word;}

.byo-btn-danger{border-color:var(--coral);color:var(--coral);}
.byo-btn-danger:hover:not(:disabled){background:var(--coral);border-color:var(--coral);color:var(--bone);}

.byo-modal-bg{position:fixed;inset:0;background:rgba(43,29,14,.55);display:flex;
  align-items:center;justify-content:center;padding:20px;z-index:50;}
.byo-modal{max-width:400px;width:100%;background:var(--rock);border:1px solid var(--coral);
  border-radius:3px;padding:22px;}
.byo-modal-t{font-family:'Vollkorn',serif;font-size:21px;color:var(--bone);margin:0 0 10px;}
.byo-modal-s{font-size:15px;color:var(--bone-dim);line-height:1.55;margin:0 0 18px;}
.byo-modal-row{display:flex;gap:10px;justify-content:flex-end;}
/* Wider, non-danger variant for picking-something modals (Add new
   Multiclass) rather than a yes/no confirm — plain border, room for a
   card grid. */
.byo-modal-lg{max-width:640px;border-color:var(--line-bright);max-height:85vh;overflow-y:auto;}

.byo-chip{display:flex;align-items:center;gap:10px;background:var(--rock);
  border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:2px;
  padding:9px 13px;margin-bottom:12px;}
.byo-chip-k{font-family:'Courier Prime',monospace;font-size:10px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--bone-dim);}
.byo-chip-v{font-family:'Vollkorn',serif;font-size:16.5px;font-weight:600;color:var(--bone);flex:1;}
.byo-chip-b{background:none;border:none;color:var(--gold);font-family:'Vollkorn',serif;
  font-size:13px;font-weight:700;cursor:pointer;padding:3px 5px;text-decoration:underline;
  text-underline-offset:3px;}
.byo-chip-b:hover{color:#9C3A3A;}
.byo-chip-b:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}

.byo-suggest{display:flex;align-items:center;gap:14px;background:var(--rock);
  border:1px dashed var(--gold-dim);border-radius:3px;padding:13px 15px;margin-bottom:12px;}
.byo-suggest-t{font-size:14.5px;font-weight:700;color:var(--bone);}
.byo-suggest-s{font-size:13px;color:var(--bone-dim);line-height:1.45;margin-top:2px;}

.byo-out{width:100%;background:var(--abyss);border:1px solid var(--line);color:var(--bone-dim);
  font-family:'Courier Prime',monospace;font-size:12.5px;line-height:1.6;padding:12px;
  border-radius:2px;resize:vertical;box-sizing:border-box;}
.byo-out:focus{outline:none;border-color:var(--gold);color:var(--bone);}

.byo-count{font-family:'Courier Prime',monospace;font-size:11px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--gold);margin-left:8px;font-weight:400;}
.byo-skills{display:flex;gap:6px;flex-wrap:wrap;}
.byo-scroll-y{max-height:280px;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;
  -webkit-overflow-scrolling:touch;padding-right:2px;}
.byo-skill{font-family:'Vollkorn',serif;font-size:14px;font-weight:500;
  background:transparent;border:1px solid var(--line);color:var(--bone-dim);
  padding:7px 11px;border-radius:2px;cursor:pointer;transition:border-color .12s,color .12s;}
.byo-skill:hover:not(:disabled){border-color:var(--gold-dim);color:var(--bone);}
.byo-skill.is-sel{border-color:var(--gold);background:var(--gold);color:var(--abyss);font-weight:700;}
.byo-skill.is-sel:hover:not(:disabled){color:var(--abyss);}
.byo-skill:disabled{opacity:.3;cursor:not-allowed;}
.byo-skill:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}

.byo-skill.is-given{border-color:var(--jade);color:var(--jade);cursor:default;}
.byo-skill.is-dupe{border-color:var(--coral);color:var(--coral);
  text-decoration:line-through;text-decoration-color:rgba(179,58,21,.6);}
.byo-warn{font-size:14px;color:var(--bone-dim);line-height:1.55;margin:11px 0 0;
  border-left:2px solid var(--coral);padding-left:11px;}

.byo-legal-draftnote{border-color:var(--coral);}
.byo-legal-list{margin:6px 0 0;padding-left:20px;}
.byo-legal-list li{margin-bottom:6px;}
.byo-legal-list li:last-child{margin-bottom:0;}

.byo-vitals{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;}
.byo-vital{background:var(--rock);border:1px solid var(--line);border-left:3px solid var(--gold);
  border-radius:3px;padding:12px 8px;text-align:center;}
.byo-vital-n{font-family:'Courier Prime',monospace;font-size:28.5px;font-weight:700;
  color:var(--gold);line-height:1.1;}
.byo-vital-l{font-family:'Courier Prime',monospace;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--bone-dim);margin-top:4px;}
.byo-vital-s{font-size:11px;color:var(--bone-dim);margin-top:3px;min-height:12px;}
.byo-vital-s u{text-decoration-color:var(--gold-dim);}
.byo-vitals-5{grid-template-columns:repeat(5,1fr);}
/* 480px, not 420: a 440px-wide phone was landing between this and the
   generic .byo-vitals collapse below, staying at 5-up and overflowing. */
@media(max-width:480px){
  .byo-vitals{grid-template-columns:repeat(2,1fr);}
  /* 3-up then 2-up: AC/HP/Speed on top (2 of 6 cols each), Proficiency and
     Initiative split the row below them (3 of 6 cols each). */
  .byo-vitals.byo-vitals-5{grid-template-columns:repeat(6,1fr);}
  .byo-vitals-5 .byo-vital{grid-column:span 2;}
  .byo-vital-ac{order:1;} .byo-vital-hp{order:2;} .byo-vital-speed{order:3;}
  .byo-vitals-5 .byo-vital-pb{order:4;grid-column:span 3;}
  .byo-vitals-5 .byo-vital-init{order:5;grid-column:span 3;}
}
.byo-ac-parts{display:block;font-family:'Courier Prime',monospace;font-size:11.5px;
  color:var(--bone-dim);margin-top:2px;}
.byo-skab{font-family:'Courier Prime',monospace;font-size:11.5px;color:var(--bone-dim);}
/* The one selection/proficiency circle, shared by saving throws, skills and
   the spell picker. Drawn, not typed: Windows renders ●/○ from a fallback
   face at a noticeably smaller size than macOS does. */
.byo-dot{width:14px;flex:none;display:inline-flex;align-items:center;justify-content:center;}
.byo-dot::before{content:"";width:9px;height:9px;box-sizing:border-box;border-radius:50%;
  border:1.5px solid var(--gold);}
.byo-dot.is-on::before{background:var(--gold);}
/* Rows whose text is taller than one line align the dot to the first line. */
.byo-dot.at-top{align-self:flex-start;padding-top:5px;}
.byo-dim{opacity:.45;}

.byo-cast{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;}
.byo-cast-c{background:var(--rock-2);border:1px solid var(--line);border-radius:2px;
  padding:11px 6px;text-align:center;}
.byo-cast-l{font-family:'Courier Prime',monospace;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--bone-dim);}
.byo-cast-v{font-family:'Courier Prime',monospace;font-size:24px;font-weight:700;
  color:var(--gold);line-height:1.3;}

.byo-slots{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}
.byo-slot{border:1px solid var(--gold-dim);border-radius:2px;padding:8px 14px;text-align:center;}
.byo-slot-l{font-family:'Courier Prime',monospace;font-size:10px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--bone-dim);}
.byo-slot-n{font-family:'Courier Prime',monospace;font-size:20px;font-weight:700;color:var(--gold);}

.byo-rule{display:flex;align-items:center;gap:12px;margin:22px 0;color:var(--gold-dim);}
.byo-rule-l{flex:1;height:1px;background:linear-gradient(to right,transparent,var(--line) 30%,var(--line) 70%,transparent);}

.byo-spell-n{font-family:'Vollkorn',serif;font-size:16.5px;font-weight:600;color:var(--bone);}
.byo-tag{font-family:'Courier Prime',monospace;font-size:9.5px;letter-spacing:.1em;
  text-transform:uppercase;border:1px solid var(--gold-dim);color:var(--gold);
  border-radius:2px;padding:1px 5px;}
.byo-tag.alt{border-color:var(--line);color:var(--bone-dim);}
/* One-letter tags: the .1em tracking would sit as dead space after a lone
   glyph and knock it off-centre in the box. */
.byo-tag.one{letter-spacing:0;padding:1px 4px;}
.byo-spell-hl{display:block;margin-top:5px;font-size:14px;color:var(--bone-dim);line-height:1.55;}
.byo-spell-hl b{color:var(--bone);}

.byo-atk-table{display:flex;flex-direction:column;}
.byo-atk-row{display:grid;grid-template-columns:1.4fr .8fr .7fr .9fr 1.4fr;gap:8px;
  align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:14px;}
.byo-atk-row:last-child{border-bottom:none;}
.byo-atk-head{font-family:'Courier Prime',monospace;font-size:10.5px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--bone-dim);padding-bottom:8px;}
.byo-atk-name{font-family:'Vollkorn',serif;font-weight:600;color:var(--bone);
  display:flex;align-items:center;gap:6px;}
.byo-atk-num{font-family:'Courier Prime',monospace;font-weight:700;color:var(--gold);}
.byo-atk-notes{color:var(--bone-dim);}
@media (max-width:520px){
  /* Weapon attack table only — :not() keeps this off spell rows, which
     carry .byo-atk-row too but define their own mobile layout below;
     without it this used to win anyway (same specificity, wrong cells
     forced full-width) and broke the spell table's 3-across regroup. */
  .byo-atk-row:not(.byo-atk-row-spell){grid-template-columns:1.2fr .7fr .6fr;}
  .byo-atk-row:not(.byo-atk-row-spell) span:nth-child(4),
  .byo-atk-row:not(.byo-atk-row-spell) span:nth-child(5){grid-column:1/-1;}
}
.byo-spell-t{display:block;font-size:14px;color:var(--bone-dim);line-height:1.5;
  margin-top:6px;}

/* The whole row is the toggle (role="button", not a literal <button> —
   see SpellTableRow.jsx for why). .byo-atk-table needs flex:1 so the
   name/time/range/etc grid actually spans the row instead of shrinking
   to its content width. */
.byo-sprow{display:flex;gap:10px;width:100%;border-bottom:1px solid var(--line);
  padding:11px 0;cursor:pointer;align-items:flex-start;}
.byo-sprow:last-child{border-bottom:none;}
.byo-sprow:hover:not([aria-disabled="true"]) .byo-spell-n{color:var(--gold);}
.byo-sprow.is-full{opacity:.32;cursor:not-allowed;}
.byo-sprow:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.byo-sprow.is-sel .byo-spell-n{color:var(--gold);}
.byo-sprow-tbl .byo-atk-row{border-bottom:none;padding:0;font-size:13px;}
.byo-sprow-tbl .byo-spell-n{display:flex;align-items:center;gap:5px;font-size:15.5px;}
/* Spell rows carry one more column than the weapon attack table (time
   AND range, not just range), so they get their own ratio rather than
   the shared 5-up .byo-atk-row default — this used to be an inline
   style, which no media query can ever win against, so the table stayed
   stuck at 6 cramped columns on a phone no matter what. */
.byo-atk-row.byo-atk-row-spell{grid-template-columns:1.5fr .7fr .8fr .7fr .9fr 1fr;}
@media(max-width:640px){
  /* 6 columns of a phone's width each fit only a couple of characters,
     wrapping every cell onto its own stack of lines. 3-across regroups
     name on its own full-width row, then two rows of three — every cell
     gets enough room for its longest value ("1 action", "Touch"). */
  .byo-atk-row.byo-atk-row-spell{grid-template-columns:repeat(3,1fr);row-gap:5px;column-gap:6px;}
  .byo-atk-row.byo-atk-row-spell>*:first-child{grid-column:1/-1;}
}
.byo-spell-trig{display:block;margin-top:6px;font-size:13px;color:var(--gold);
  font-style:italic;line-height:1.5;}
.byo-heal{color:var(--jade);}

.byo-export{display:flex;align-items:center;justify-content:space-between;gap:16px;
  flex-wrap:wrap;background:var(--rock);
  border:1px solid var(--gold-dim);border-radius:3px;padding:16px 18px;margin-bottom:10px;}
.byo-export-t{font-family:'Vollkorn',serif;font-size:18.5px;font-weight:600;color:var(--bone);}
.byo-export-s{font-size:14px;color:var(--bone-dim);line-height:1.5;margin-top:4px;}
/* The sheet box stacks: title, then one full-width button per export route.
   Equal widths so no route reads as the "real" one — which platform you're on
   decides that, not us. Colour carries the difference instead: gold for the
   print route, jade for the iOS one, slate for the fallback. */
.byo-export-stack{flex-direction:column;align-items:stretch;}
.byo-export-alt{display:flex;flex-direction:column;gap:8px;margin-top:12px;}
.byo-export-alt .byo-btn{width:100%;margin-left:0;}
.byo-btn-ios{background:var(--jade);border-color:var(--jade);color:var(--abyss);}
.byo-btn-ios:hover:not(:disabled){background:#5A8F5A;border-color:#5A8F5A;color:var(--abyss);}
.byo-btn-alt{background:var(--rock-2);border-color:var(--line);color:var(--bone);}
.byo-btn-alt:hover:not(:disabled){background:#DDCB98;border-color:var(--bone-dim);color:var(--bone);}

.byo-lvlh{font-family:'Vollkorn',serif;font-size:16.5px;font-weight:600;color:var(--bone);
  margin:18px 0 2px;padding-bottom:5px;border-bottom:1px solid var(--line);}

.byo-sum{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:14px;}
.byo-sum-c{background:var(--rock);border:1px solid var(--line);border-radius:2px;padding:9px 4px;text-align:center;}
.byo-sum-k{font-family:'Courier Prime',monospace;font-size:10px;letter-spacing:.1em;color:var(--bone-dim);}
.byo-sum-v{font-family:'Courier Prime',monospace;font-size:21px;font-weight:700;color:var(--gold);line-height:1.3;}
.byo-sum-m{font-family:'Courier Prime',monospace;font-size:12px;color:var(--bone-dim);}
@media(max-width:480px){.byo-sum{grid-template-columns:repeat(3,1fr);}}

.byo-sum-block{margin-bottom:14px;}
.byo-sum-block .byo-sum,.byo-sum-block .byo-vitals{margin-bottom:0;}
.byo-sum-h{font-family:'Vollkorn',serif;font-weight:600;font-size:17.5px;margin:0 0 10px;}

/* Summary step's ability grid, sized to match the vitals cards it sits
   next to (byo-vital-n/-l) rather than the smaller running-header size
   byo-sum was originally built for. */
.byo-sum-lg .byo-sum-c{padding:12px 8px;}
.byo-sum-lg .byo-sum-v{font-size:28.5px;line-height:1.1;}
.byo-sum-lg .byo-sum-m{font-size:11px;margin-top:2px;}

.byo-sum-name{font-size:23px;}
.byo-sum-head{font-size:16px;}

/* Skills fills column 1 top-to-bottom; Saving throws/Passive skills/Core
   stack column 2, in that order — named areas (not DOM order plus a CSS
   order override) because mobile needs Skills to slot in between Saving
   throws and Passive skills, not just move as a block. */
.byo-summary-split{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start;
  grid-template-areas:"skills saves" "skills passive" "skills core";}
.byo-sum-skills{grid-area:skills;}
.byo-sum-saves{grid-area:saves;}
.byo-sum-passive{grid-area:passive;}
.byo-sum-core{grid-area:core;}
@media(max-width:480px){
  .byo-summary-split{grid-template-columns:1fr;
    grid-template-areas:"saves" "skills" "passive" "core";}
}
@media(prefers-reduced-motion:reduce){*{transition:none!important;}}
`;
