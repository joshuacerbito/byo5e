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
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Vollkorn:ital,wght@0,400;0,600;0,700;1,400&family=Space+Mono:wght@400;700&display=swap');

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
.byo-h2{font-family:'Space Mono',monospace;font-size:12px;letter-spacing:.18em;
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
  font-family:'Space Mono',monospace;font-size:11px;font-weight:700;color:var(--bone-dim);}
.byo-chev.is-now .byo-chev-n{border-color:var(--gold);color:var(--gold);}
.byo-chev.is-done .byo-chev-n{border-color:var(--jade);color:var(--jade);background:rgba(63,107,63,.12);}
.byo-chev-label{font-family:'Space Mono',monospace;font-size:12px;letter-spacing:.08em;
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
    font-family:'Space Mono',monospace;font-size:13px;letter-spacing:.05em;
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
.byo-card-kind{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--gold-dim);white-space:nowrap;}
.byo-card-blurb{font-size:14.5px;color:var(--bone-dim);margin:6px 0 10px;line-height:1.45;}
.byo-pills{display:flex;gap:5px;flex-wrap:wrap;}
.byo-pill{font-family:'Space Mono',monospace;font-size:11px;font-weight:700;
  border:1px solid var(--gold-dim);color:var(--gold);border-radius:2px;padding:2px 6px;}
.byo-pill.alt{border-color:var(--line);color:var(--bone-dim);}

.byo-panel{position:relative;background:var(--rock);border:1px solid var(--line);border-radius:2px;padding:16px 18px;
  margin-bottom:14px;box-shadow:0 1px 0 rgba(139,111,58,.35),inset 0 0 0 1px rgba(243,234,209,.4);}
.byo-panel h3{font-family:'Vollkorn',serif;font-weight:600;font-size:17.5px;margin:0 0 10px;
  text-transform:capitalize;}
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
/* ---- Core Traits (Class step) ----------------------------------
   Book-page layout: a collapsible header carrying the choice count,
   the level-1 preamble, then the traits table. The table is prose;
   the skill picker under it is the only interactive part. --------- */
.byo-ct-head{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;
  background:none;border:none;padding:0;margin:0 0 10px;color:inherit;text-align:left;cursor:pointer;}
.byo-ct-head:hover .byo-ct-h3{color:var(--gold);}
.byo-ct-head:focus-visible{outline:2px solid var(--jade);outline-offset:3px;}
.byo-ct-title{display:flex;flex-direction:column;gap:2px;min-width:0;}
.byo-ct-h3{font-family:'Vollkorn',serif;font-weight:600;font-size:17.5px;}
.byo-ct-sub{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--bone-dim);}
.byo-ct-sub .byo-count{margin-left:10px;}
.byo-ct-chev{flex:none;color:var(--line-bright);display:flex;align-items:center;}
.byo-ct-chev svg{width:20px;height:20px;transition:transform .15s ease-out;}
.byo-ct-lead{margin:0 0 4px;}
.byo-ct-bullets{margin:0 0 14px;padding-left:18px;font-size:14.5px;color:var(--bone-dim);line-height:1.5;}
.byo-ct-bullets li{margin:2px 0;}
.byo-ct-table{border:1px solid var(--line);border-radius:2px;overflow:hidden;}
.byo-ct-row{display:grid;grid-template-columns:200px 1fr;gap:12px;padding:9px 12px;
  border-bottom:1px solid var(--line);font-size:14.5px;line-height:1.45;}
.byo-ct-row:last-child{border-bottom:none;}
/* Alternating shade, as the reference prints it. Odd, not even: the
   caption row that used to be the table's first child is gone (the
   section header above says the same thing), so the first trait row is
   now child 1 and would otherwise come out unshaded. */
.byo-ct-row:nth-child(odd){background:var(--rock-2);}
.byo-ct-k{font-weight:600;}
.byo-ct-v{color:var(--bone-dim);min-width:0;overflow-wrap:anywhere;}
/* The picker is the one thing on this panel the player has to ACT on,
   so it gets a rule and a wide gap above it: everything over the line is
   reference, everything under it is the step. */
.byo-ct-picker{margin-top:22px;padding-top:18px;border-top:1px solid var(--line-bright);}
.byo-ct-picker-h{display:flex;align-items:baseline;justify-content:space-between;
  gap:12px;margin-bottom:10px;}
.byo-ct-picker-l{font-family:'Vollkorn',serif;font-weight:600;font-size:16px;}
.byo-ct-picker-h .byo-count{margin-left:0;}
.byo-ct-picker-note{margin:-4px 0 10px;}
@media(max-width:560px){
  /* One column under a phone width: a 200px label column leaves the
     value cell too narrow to read the equipment line. */
  .byo-ct-row{grid-template-columns:1fr;gap:2px;}
}

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
.byo-opt{font-family:'Space Mono',monospace;font-size:12px;font-weight:700;letter-spacing:.08em;
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

/* Real tab strip (Summary step's Actions panel) — underline style, not
   the pill-choice look .byo-opt uses elsewhere, so it reads as switching
   a view rather than picking an option. */
.byo-actiontabs{display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid var(--line);margin-bottom:14px;}
.byo-actiontab{font-family:'Space Mono',monospace;font-size:12px;font-weight:700;letter-spacing:.06em;
  background:transparent;border:none;border-bottom:2px solid transparent;color:var(--bone-dim);
  padding:8px 12px;margin-bottom:-1px;cursor:pointer;}
.byo-actiontab:hover{color:var(--bone);}
.byo-actiontab.is-sel{color:var(--gold);border-bottom-color:var(--gold);}
.byo-actiontab:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}

/* Bonus Actions / Reactions tabs: sublists grouping class features,
   spells, and everything else, each under its own small heading. */
.byo-actionsub + .byo-actionsub{margin-top:16px;}
.byo-actionsub h4{font-family:'Space Mono',monospace;font-size:11px;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;color:var(--bone-dim);margin:0 0 6px;}

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
.byo-num{font-family:'Space Mono',monospace;font-size:16.5px;font-weight:700;
  width:24px;text-align:center;}
.byo-arrow{font-family:'Space Mono',monospace;font-size:12px;color:var(--gold-dim);width:34px;text-align:center;}
.byo-final{font-family:'Space Mono',monospace;font-size:18.5px;font-weight:700;
  color:var(--gold);width:26px;text-align:right;}
.byo-mod{font-family:'Space Mono',monospace;font-size:13px;color:var(--bone-dim);width:32px;text-align:right;}
.byo-sel{background:var(--rock-2);border:1px solid var(--line);color:var(--bone);
  font-family:'Space Mono',monospace;font-size:14.5px;padding:6px 8px;border-radius:2px;}

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
.byo-budget-n{font-family:'Space Mono',monospace;font-size:24px;font-weight:700;color:var(--gold);}
.byo-budget-n.zero{color:var(--jade);}
.byo-budget-l{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--bone-dim);}

.byo-trait{padding:9px 0;border-bottom:1px solid var(--line);}
.byo-trait:last-child{border-bottom:none;}
.byo-trait-n{font-weight:700;font-size:14.5px;color:var(--bone);}
.byo-trait-n .src{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--gold-dim);margin-left:7px;}
.byo-trait-t{font-size:14.5px;color:var(--bone-dim);line-height:1.5;margin-top:2px;}

/* FeatureBlocks — structured feature text (sections, lists, tables)
   instead of one flattened paragraph. Sits wherever .byo-note used to. */
.byo-fb-p{font-size:14.5px;color:var(--bone-dim);line-height:1.5;margin:0 0 8px;}
.byo-fb-p:last-child{margin-bottom:0;}
.byo-fb-section{margin:10px 0;}
.byo-fb-section:first-child{margin-top:0;}
.byo-fb-section:last-child{margin-bottom:0;}
.byo-fb-h{font-family:'Space Mono',monospace;font-size:11.5px;letter-spacing:.08em;
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
.byo-fb-table th{font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.08em;
  text-transform:uppercase;color:var(--bone-dim);text-align:left;padding:4px 10px 4px 0;
  border-bottom:1px solid var(--line);white-space:nowrap;}
.byo-fb-table td{padding:5px 10px 5px 0;border-bottom:1px solid var(--line);white-space:nowrap;}
.byo-fb-table tr:last-child td{border-bottom:none;}

.byo-actgroup-l{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.14em;
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
.byo-filter-lbl{display:block;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.12em;
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
.byo-hint{font-family:'Space Mono',monospace;font-size:11px;color:var(--coral);
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
.byo-crash-msg{margin:14px 0 0;font-family:'Space Mono',monospace;font-size:12.5px;
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
.byo-chip-k{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.16em;
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
  font-family:'Space Mono',monospace;font-size:12.5px;line-height:1.6;padding:12px;
  border-radius:2px;resize:vertical;box-sizing:border-box;}
.byo-out:focus{outline:none;border-color:var(--gold);color:var(--bone);}

.byo-count{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.12em;
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
.byo-vital-n{font-family:'Space Mono',monospace;font-size:28.5px;font-weight:700;
  color:var(--gold);line-height:1.1;}
.byo-vital-l{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.14em;
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
.byo-ac-parts{display:block;font-family:'Space Mono',monospace;font-size:11.5px;
  color:var(--bone-dim);margin-top:2px;}
.byo-skab{font-family:'Space Mono',monospace;font-size:11.5px;color:var(--bone-dim);}
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
.byo-cast-l{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--bone-dim);}
.byo-cast-v{font-family:'Space Mono',monospace;font-size:24px;font-weight:700;
  color:var(--gold);line-height:1.3;}

.byo-slots{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}
.byo-slot{border:1px solid var(--gold-dim);border-radius:2px;padding:8px 14px;text-align:center;}
.byo-slot-l{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--bone-dim);}
.byo-slot-n{font-family:'Space Mono',monospace;font-size:20px;font-weight:700;color:var(--gold);}

.byo-rule{display:flex;align-items:center;gap:12px;margin:22px 0;color:var(--gold-dim);}
.byo-rule-l{flex:1;height:1px;background:linear-gradient(to right,transparent,var(--line) 30%,var(--line) 70%,transparent);}

.byo-spell-n{font-family:'Vollkorn',serif;font-size:16.5px;font-weight:600;color:var(--bone);}
.byo-tag{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.1em;
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
.byo-atk-head{font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--bone-dim);padding-bottom:8px;}
.byo-atk-name{font-family:'Vollkorn',serif;font-weight:600;color:var(--bone);
  display:flex;align-items:center;gap:6px;}
.byo-atk-name .src{font-family:'Space Mono',monospace;font-size:11px;font-weight:400;color:var(--bone-dim);}
.byo-atk-num{font-family:'Space Mono',monospace;font-weight:700;color:var(--gold);}
/* Damage-type glyph, sitting inline after the dice ("1d6-1 <flame>").
   Optically centred on the numeral's x-height rather than its baseline,
   which is what -.15em buys. An unmapped type falls back to the word. */
/* Abbreviated cell text is opt-in: full text everywhere until a
   layout asks for the short form (see the 430-560 block). */
.byo-abbr-short{display:none;}
.byo-dmg{position:relative;display:inline-block;}
.byo-dmg-i{width:14px;height:14px;margin-left:5px;vertical-align:-.15em;flex:none;}
.byo-dmg-t{margin-left:5px;font-weight:400;}
/* Damage-type tooltip, desktop only. hover:hover keeps it off touch
   screens, where a :hover state sticks after a tap and would leave the
   label hanging over the row you just opened. */
@media(hover:hover){
  .byo-dmg::after{content:attr(data-label);position:absolute;bottom:calc(100% + 6px);left:50%;
    transform:translateX(-50%);white-space:nowrap;pointer-events:none;opacity:0;
    background:var(--bone);color:var(--rock);border-radius:3px;padding:3px 7px;
    font-family:'Space Mono',monospace;font-size:10.5px;font-weight:400;letter-spacing:.06em;
    text-transform:uppercase;box-shadow:0 2px 6px rgba(43,29,14,.28);
    transition:opacity .12s ease-out;z-index:5;}
  .byo-dmg:hover::after{opacity:1;}
}
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
.byo-sum-k{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.1em;color:var(--bone-dim);}
.byo-sum-v{font-family:'Space Mono',monospace;font-size:21px;font-weight:700;color:var(--gold);line-height:1.3;}
.byo-sum-m{font-family:'Space Mono',monospace;font-size:12px;color:var(--bone-dim);}
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

/* ==================================================================
   THE SHEET PAGE (/sheet) + its detail drawer.

   Phone-first, and the one screen in the app that breaks the wizard's
   page rhythm: .byo-sheetpage drops the root's 28px/120px padding so
   the sticky header sits flush against the top of the viewport and the
   fixed screen bar sits flush against the bottom.

   Everything BETWEEN those two is deliberately the Summary step's own
   vocabulary — .byo-panel, .byo-row, .byo-trait, .byo-atk-table — so
   there is one set of rules for how a character sheet looks, not two.
   The only markup invented here is the header, the ability grid, the
   spellcasting trio, the screen bar and the drawer.

   NOTE the header's stat strip is .byo-shvital*, NOT .byo-vital*: the
   latter is the Summary step's five-up Vitals block and redefining it
   here silently restyled that page.
================================================================== */
.byo-sheetpage{padding:0;}
.byo-sheet{max-width:820px;margin:0 auto;min-height:100vh;
  border-left:1px solid var(--line);border-right:1px solid var(--line);}
@media(max-width:880px){.byo-sheet{border-left:none;border-right:none;}}

.byo-sheet-head{position:sticky;top:0;z-index:20;background:var(--rock);
  border-bottom:1px solid var(--line-bright);padding:10px 14px;
  box-shadow:0 6px 14px rgba(43,29,14,.10);}
.byo-sheet-name{font-family:'Cinzel',serif;font-weight:900;font-size:21px;line-height:1.15;
  color:var(--gold);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.byo-sheet-sub{font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--bone-dim);margin-top:2px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
/* The numbers re-read every turn, sticky with the header. Its own class
   family, not the Summary step's .byo-vital — that one is a five-up
   block with 28px numerals and a left rule, far too tall to sit under a
   name on a phone. */
.byo-shvitals{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:10px;}
.byo-shvital{display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:2px;padding:6px 2px;
  border:1px solid var(--line);border-radius:8px;background:var(--abyss);}
/* Fixed-height top row across all six tiles, so the Rest tile's icon
   sits on the same baseline as the others' numerals instead of riding
   low against a numeral's shorter line box. */
.byo-shvital-n,.byo-shvital .byo-screen-i{height:20px;display:flex;align-items:center;justify-content:center;}
.byo-shvital-n{font-family:'Cinzel',serif;font-weight:700;font-size:18px;color:var(--bone);line-height:1;}
.byo-shvital-l{font-family:'Space Mono',monospace;font-size:8.5px;letter-spacing:.08em;
  text-transform:uppercase;color:var(--bone-dim);text-align:center;}
/* The Rest tile is a button; everything else in the strip is a readout,
   so it gets the affordances and the same box. Its icon sits where the
   others' numeral does, at the numeral's own optical size. */
.byo-shvital-btn{cursor:pointer;color:var(--gold);font:inherit;}
.byo-shvital-btn:hover{border-color:var(--line-bright);background:var(--rock-2);}
.byo-shvital-btn:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.byo-shvital-btn .byo-screen-i{width:20px;}
@media(max-width:400px){.byo-shvital-n{font-size:16px;}.byo-shvital-l{font-size:8px;}}

/* Bottom padding clears the fixed screen bar (plus the iOS home
   indicator, via the safe-area inset). */
.byo-sheet-body{padding:14px 14px calc(96px + env(safe-area-inset-bottom));}

.byo-abilgrid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:0 0 16px;}
@media(max-width:520px){.byo-abilgrid{grid-template-columns:repeat(3,1fr);}}
.byo-abilcard{display:flex;flex-direction:column;align-items:center;gap:2px;
  padding:9px 4px;border:1px solid var(--line);border-radius:9px;background:var(--rock);
  cursor:pointer;color:var(--bone);}
.byo-abilcard:hover{border-color:var(--line-bright);background:var(--rock-2);}
.byo-abilcard:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.byo-abilcard-l{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--bone-dim);}
.byo-abilcard-m{font-family:'Cinzel',serif;font-weight:900;font-size:22px;line-height:1;color:var(--gold);}
.byo-abilcard-s{font-family:'Space Mono',monospace;font-size:11px;color:var(--bone-dim);}

/* Save DC / Spell Attack / Ability — the three numbers you say out loud
   when you cast, above the Actions panel's own tabs. */
.byo-castgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 12px;}
.byo-cast{display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 4px;
  border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:2px;background:var(--rock);}
.byo-cast-n{font-family:'Space Mono',monospace;font-weight:700;font-size:24px;color:var(--gold);line-height:1.1;}
.byo-cast-l{font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--bone-dim);text-align:center;}

.byo-slots{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px;}
.byo-slot{border:1px solid var(--line);border-radius:999px;padding:4px 10px;
  background:var(--rock);font-family:'Space Mono',monospace;font-size:11px;color:var(--bone-dim);}
.byo-slot b{color:var(--bone);font-weight:700;}

/* A row/trait/table-row that opens the drawer. Same box as its inert
   twin on the Summary step — only the affordances are added, so the two
   pages stay one design. */
.byo-row.is-tap,.byo-trait.is-tap,.byo-atk-row.is-tap{cursor:pointer;}
.byo-row.is-tap:hover,.byo-trait.is-tap:hover,.byo-atk-row.is-tap:hover{background:var(--rock-2);}
.byo-row.is-tap:focus-visible,.byo-trait.is-tap:focus-visible,.byo-atk-row.is-tap:focus-visible{
  outline:2px solid var(--jade);outline-offset:2px;}
.byo-row-chev,.byo-trait-chev{color:var(--line-bright);font-size:18px;line-height:1;margin-left:8px;}
.byo-trait.is-tap{display:flex;align-items:center;justify-content:space-between;gap:8px;}
/* Tap targets: a 15px row is fine to read and too small to hit. */
.byo-row.is-tap{min-height:42px;}
.byo-trait.is-tap{min-height:44px;}

/* THE ACTIONS TABLE, THREE WAYS.

   Above 560px it's the plain six-column table the Summary step has
   always printed. Below that the room runs out, and the split is where
   it actually runs out rather than at one convenient number:

     430-560px  every column still fits on one line — but only with
                D&D Beyond's abbreviations ("1A", not "1 action") and
                the name column squeezed. This is a big phone in
                portrait and a small tablet.
     under 430  no arrangement fits six columns and a readable spell
                name, so the row goes two-line: what you act on up top,
                the descriptive cells small underneath.

   Everything both narrow modes share lives in the 560 block; the two
   layouts then override the grid. */
@media(max-width:560px){
  /* Full-bleed light band, not a transparent one: .byo-panel's paper
     ground is what makes small type readable, and the page ground under
     it is the darker, noisier --abyss. So the card keeps its background
     and loses everything that made it a card — border, radius, and the
     box-shadow whose inset 1px rgba(243,234,209,.4) highlight
     was the pale line still drawing itself around the section. The
     negative margin cancels .byo-sheet-body's 14px so the band runs to
     both screen edges. */
  .byo-sheetpage .byo-flush .byo-panel{background:var(--rock);border:none;box-shadow:none;
    border-radius:0;padding:12px 14px;margin:0 -14px 14px;}
  /* A weapon's properties and mastery notes are the widest cell in the
     table and the least useful mid-turn — they're the first thing in
     the drawer instead. Sheet only; the Summary step still prints them,
     since that page is the one you read before play. */
  .byo-sheetpage .byo-atk-notes,
  .byo-sheetpage .byo-atk-head:not(.byo-atk-row-spell) span:nth-child(5){display:none;}
  .byo-sheetpage .byo-atk-row{padding:11px 0;align-items:baseline;}
  /* Fixed, not auto, widths in both layouts: every row is its own grid,
     so content-sized columns land in a different place on each one and
     the numbers come out ragged down the page. */
  .byo-sheetpage .byo-atk-row>*{font-family:'Space Mono',monospace;
    font-size:11.5px;color:var(--bone-dim);}
  .byo-sheetpage .byo-atk-row>.byo-atk-name{font-family:'Vollkorn',serif;color:var(--bone);}
  .byo-sheetpage .byo-atk-row>.byo-atk-num{color:var(--gold);font-weight:700;}
  /* The spell level as a badge in the row's left gutter — the slot D&D
     Beyond puts its Cast/Use button in. */
  .byo-sheetpage .byo-atk-row-spell>.byo-atk-lvl{grid-column:1;align-self:center;
    display:flex;align-items:center;justify-content:center;height:22px;
    border:1px solid var(--line-bright);border-radius:3px;background:var(--abyss);
    color:var(--gold);}
  .byo-sheetpage .byo-atk-row-spell>.byo-atk-name{grid-column:2;}
  /* The one cell you read mid-cast gets a box around it, same as the
     reference. Only when there's something in it — an outlined em dash
     is worse than a bare one. */
  .byo-sheetpage .byo-atk-eff.is-boxed{display:inline-flex;align-items:center;
    justify-self:start;border:1px solid var(--line-bright);border-radius:3px;
    padding:2px 6px;background:var(--abyss);}
}

/* ---- 430-560px: one line, abbreviated ---- */
@media(min-width:430px) and (max-width:560px){
  /* Six columns, in D&D Beyond's order: level badge, name, time, range,
     hit/DC, effect. The header row earns its place again here — it's
     one line, and it labels columns narrow enough to be ambiguous. */
  .byo-sheetpage .byo-atk-row-spell{grid-template-columns:24px 1fr 34px 54px 56px 78px;
    column-gap:6px;}
  /* Every cell placed by position, not by class, so the header row —
     whose cells carry no classes — lands in the same columns as the
     rows under it. Placement is also not optional here: two older
     narrow-width rules are still in force at this width (the picker's
     3-across spell regroup at 640, the weapon table's stack at 520) and
     would otherwise throw the first cell full-width. */
  .byo-sheetpage .byo-atk-row-spell>*{grid-row:1;}
  .byo-sheetpage .byo-atk-row-spell>*:nth-child(1){grid-column:2;}
  .byo-sheetpage .byo-atk-row-spell>*:nth-child(2){grid-column:1;}
  .byo-sheetpage .byo-atk-row-spell>*:nth-child(3){grid-column:3;}
  .byo-sheetpage .byo-atk-row-spell>*:nth-child(4){grid-column:4;}
  .byo-sheetpage .byo-atk-row-spell>*:nth-child(5){grid-column:5;}
  .byo-sheetpage .byo-atk-row-spell>*:nth-child(6){grid-column:6;}
  /* Weapons have no level, so they keep four: name, range, hit, damage. */
  .byo-sheetpage .byo-atk-row:not(.byo-atk-row-spell){grid-template-columns:1fr 60px 60px 84px;
    column-gap:6px;}
  .byo-sheetpage .byo-atk-row:not(.byo-atk-row-spell)>*{grid-row:1;}
  .byo-sheetpage .byo-atk-row:not(.byo-atk-row-spell)>*:nth-child(1){grid-column:1;}
  .byo-sheetpage .byo-atk-row:not(.byo-atk-row-spell)>*:nth-child(2){grid-column:2;}
  .byo-sheetpage .byo-atk-row:not(.byo-atk-row-spell)>*:nth-child(3){grid-column:3;}
  .byo-sheetpage .byo-atk-row:not(.byo-atk-row-spell)>*:nth-child(4){grid-column:4;}
  .byo-sheetpage .byo-atk-row>.byo-atk-name{font-size:14.5px;}
  .byo-sheetpage .byo-atk-eff.is-boxed{padding:1px 5px;}
  /* This is the whole reason the row fits: "1A" for "1 action", "Self"
     for "Self (30-foot sphere)". Both strings are in the markup (see
     Abbr in ActionsPanel.jsx); the layout picks. */
  .byo-abbr-full{display:none;}
  .byo-abbr-short{display:inline;}
}

/* ---- under 430px: two lines ---- */
@media(max-width:429px){
  /* The column header goes: five labels stacked four lines deep cost
     more room than the rows they described. Explicit row/column
     placement per cell, because the cells are separate spans shared
     with the desktop table and can't be wrapped into one without
     forking the markup. */
  .byo-sheetpage .byo-atk-head{display:none;}
  .byo-sheetpage .byo-atk-row{grid-template-columns:1fr 80px 96px;
    row-gap:2px;column-gap:8px;}
  .byo-sheetpage .byo-atk-row>*{grid-row:2;}
  .byo-sheetpage .byo-atk-row>.byo-atk-name{grid-row:1;grid-column:1;font-size:16px;}
  .byo-sheetpage .byo-atk-row>.byo-atk-num{font-size:12.5px;}
  /* Weapons: name / hit / damage up top, range underneath. */
  .byo-sheetpage .byo-atk-row:not(.byo-atk-row-spell)>*:nth-child(2){grid-row:2;grid-column:1;}
  .byo-sheetpage .byo-atk-row:not(.byo-atk-row-spell)>*:nth-child(3){grid-row:1;grid-column:2;}
  .byo-sheetpage .byo-atk-row:not(.byo-atk-row-spell)>*:nth-child(4){grid-row:1;grid-column:3;}
  /* Spells:
       [C]  Fireball        DEX 15   [8d6 <fire>]
            1 action  150 ft                       */
  .byo-sheetpage .byo-atk-row-spell{grid-template-columns:26px 1fr 62px 86px;column-gap:6px;}
  .byo-sheetpage .byo-atk-row-spell>.byo-atk-lvl{grid-row:1/3;}
  /* Re-asserted after the generic name rule above, which puts every
     other table's name in column 1 — a spell's column 1 is the badge. */
  .byo-sheetpage .byo-atk-row-spell>.byo-atk-name{grid-row:1;grid-column:2;}
  .byo-sheetpage .byo-atk-row-spell>*:nth-child(3){grid-row:2;grid-column:2;}
  .byo-sheetpage .byo-atk-row-spell>*:nth-child(4){grid-row:2;grid-column:3;}
  .byo-sheetpage .byo-atk-row-spell>*:nth-child(5){grid-row:1;grid-column:3;}
  .byo-sheetpage .byo-atk-row-spell>*:nth-child(6){grid-row:1;grid-column:4;}
}

/* ---------------- accordion rows ---------------- */
/* Section header: the panel's own h3/h4, plus one control that opens or
   closes every row under it. The chevron points down when the section
   is closed and flips up once everything in it is open — the same
   language as the rows' own chevrons, one level up. */
.byo-accsec-h{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.byo-accsec-h h3,.byo-accsec-h h4{margin-bottom:6px;}
.byo-accsec-t{flex:none;display:flex;align-items:center;gap:4px;height:30px;
  margin:-4px -6px 2px 0;padding:0 6px;border:none;background:none;
  color:var(--bone-dim);cursor:pointer;border-radius:6px;
  font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.08em;
  text-transform:uppercase;}
.byo-accsec-t:hover{color:var(--gold);background:var(--rock-2);}
.byo-accsec-t:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.byo-accsec-t svg{width:18px;height:18px;transition:transform .15s ease-out;}
.byo-accsec-t[aria-expanded="true"] svg{transform:rotate(180deg);}

/* Same box as the .byo-row / .byo-trait it replaces, so the Features
   and Other lists still read as the same family as everything else on
   the page — it just expands instead of opening the drawer. */
.byo-acc{border-bottom:1px solid var(--line);}
.byo-acc:last-child{border-bottom:none;}
.byo-acc-h{display:flex;align-items:center;gap:10px;width:100%;min-height:46px;
  padding:9px 0;background:none;border:none;cursor:pointer;text-align:left;
  color:var(--bone);font-family:'Vollkorn',serif;font-size:16px;font-weight:600;}
.byo-acc-h:hover{color:var(--gold);}
.byo-acc-h:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.byo-acc-n{flex:1;min-width:0;}
.byo-acc-n .src{margin-left:8px;font-family:'Space Mono',monospace;font-size:10.5px;
  font-weight:400;letter-spacing:.06em;text-transform:uppercase;color:var(--bone-dim);}
/* The chevron IS the open/closed state — points right when collapsed,
   down when open. */
.byo-acc-i{flex:none;color:var(--line-bright);font-size:20px;line-height:1;
  transition:transform .15s ease-out;}
.byo-acc.is-open .byo-acc-i{transform:rotate(90deg);}
.byo-acc.is-open .byo-acc-h{color:var(--gold);}
.byo-acc-b{padding:0 0 12px;font-size:15px;line-height:1.6;color:var(--bone);}
.byo-acc-b>*:first-child{margin-top:0;}

/* ---------------- the screen bar ---------------- */
.byo-screens{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;
  background:var(--rock);border-top:1px solid var(--line-bright);
  padding-bottom:env(safe-area-inset-bottom);
  box-shadow:0 -6px 14px rgba(43,29,14,.10);}
.byo-screen{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:3px;min-height:56px;padding:6px 2px;background:none;border:none;cursor:pointer;
  color:var(--bone-dim);font-family:'Space Mono',monospace;font-size:9.5px;letter-spacing:.08em;
  text-transform:uppercase;border-top:2px solid transparent;margin-top:-1px;}
.byo-screen:hover{color:var(--bone);}
.byo-screen.is-sel{color:var(--gold);border-top-color:var(--gold);}
.byo-screen:focus-visible{outline:2px solid var(--jade);outline-offset:-3px;}
.byo-screen-i{width:22px;height:22px;}
/* Icon-only on a phone: six labels don't fit across 390px without
   truncating to noise. The label stays in the DOM for screen readers. */
@media(max-width:560px){
  .byo-screen-l{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);
    clip-path:inset(50%);white-space:nowrap;}
  .byo-screen{min-height:54px;}
  .byo-screen-i{width:24px;height:24px;}
}

/* ---------------- detail drawer ---------------- */
.byo-drawer-bg{position:fixed;inset:0;z-index:60;background:rgba(43,29,14,.5);
  display:flex;justify-content:flex-end;animation:byo-fade .16s ease-out;}
.byo-drawer{width:min(460px,100%);max-height:100%;background:var(--rock);
  border-left:1px solid var(--line-bright);display:flex;flex-direction:column;
  animation:byo-slidein .2s cubic-bezier(.2,.7,.3,1);}
/* Below the phone breakpoint the drawer is a bottom sheet instead: a
   full-height side panel on a 390px-wide screen is just a second page
   with none of a sheet's "the list is still there behind me" cue. */
@media(max-width:560px){
  .byo-drawer-bg{align-items:flex-end;}
  .byo-drawer{width:100%;max-height:88vh;border-left:none;
    border-top:1px solid var(--line-bright);border-radius:14px 14px 0 0;
    animation:byo-slideup .2s cubic-bezier(.2,.7,.3,1);}
}
@keyframes byo-fade{from{opacity:0;}to{opacity:1;}}
@keyframes byo-slidein{from{transform:translateX(18px);opacity:.4;}to{transform:none;opacity:1;}}
@keyframes byo-slideup{from{transform:translateY(24px);opacity:.4;}to{transform:none;opacity:1;}}
.byo-drawer:focus{outline:none;}
.byo-drawer-head{display:flex;align-items:flex-start;gap:10px;padding:14px 16px 10px;
  border-bottom:1px solid var(--line);flex:none;}
.byo-drawer-headtext{flex:1;min-width:0;}
.byo-drawer-t{font-family:'Cinzel',serif;font-weight:700;font-size:20px;line-height:1.2;color:var(--gold);}
.byo-drawer-s{font-family:'Space Mono',monospace;font-size:10.5px;letter-spacing:.08em;
  text-transform:uppercase;color:var(--bone-dim);margin-top:3px;}
.byo-drawer-x{flex:none;width:36px;height:36px;border-radius:8px;border:1px solid var(--line);
  background:var(--rock-2);color:var(--bone);font-size:14px;cursor:pointer;}
.byo-drawer-x:hover{border-color:var(--line-bright);}
.byo-drawer-x:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.byo-drawer-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;
  padding:14px 16px calc(40px + env(safe-area-inset-bottom));font-size:15.5px;line-height:1.6;}

.byo-dstats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));
  gap:6px;margin:0 0 14px;}
.byo-dstat{display:flex;flex-direction:column;gap:1px;padding:6px 9px;
  border:1px solid var(--line);border-radius:8px;background:var(--abyss);}
.byo-dstat-l{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--bone-dim);}
.byo-dstat-v{font-size:14.5px;color:var(--bone);}
.byo-dsection{margin-top:14px;padding-top:12px;border-top:1px solid var(--line);}
.byo-dsection-n{font-family:'Cinzel',serif;font-weight:700;font-size:15px;color:var(--bone);margin-bottom:4px;}
.byo-dnote{margin-top:14px;}

@media(prefers-reduced-motion:reduce){*{transition:none!important;}}
`;
