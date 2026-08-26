/* All component styling. Imported as a template string into the
   root component's <style> tag. */
export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Karla:wght@400;500;700&family=JetBrains+Mono:wght@500;700&display=swap');

.byo-root, .byo-root *, .byo-root *::before, .byo-root *::after{box-sizing:border-box;}
.byo-root{
  --abyss:#0B1622; --rock:#132436; --rock-2:#1B3145; --line:#26445F; --line-bright:#3C6488;
  --gold:#D4A537; --gold-dim:#8A6B1F; --jade:#3FA98A; --coral:#D9502F;
  --bone:#E8DEC9; --bone-dim:#93A3B4;
  background:var(--abyss); color:var(--bone);
  font-family:'Karla',system-ui,sans-serif; min-height:100vh;
  padding:28px 18px 120px; -webkit-font-smoothing:antialiased;
}
.byo-wrap{max-width:min(94vw,1180px);margin:0 auto;}
.byo-h1{font-family:'Fraunces',serif;font-weight:800;font-size:38px;line-height:1.05;
  margin:0 0 4px;color:var(--gold);letter-spacing:-.01em;}
.byo-h2{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--bone-dim);margin:10px 0 22px;}
.byo-sub{color:var(--bone-dim);font-size:14px;margin:0 0 22px;}

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
  width:20px;height:20px;border-radius:50%;border:1px solid #4C6076;
  font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:#4C6076;}
.byo-chev.is-now .byo-chev-n{border-color:var(--gold);color:var(--gold);}
.byo-chev.is-done .byo-chev-n{border-color:var(--jade);color:var(--jade);background:rgba(63,169,138,.12);}
.byo-chev-label{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.08em;
  text-transform:uppercase;color:var(--bone-dim);}
.byo-chev.is-now .byo-chev-label{color:var(--gold);}
.byo-chev.is-done .byo-chev-label{color:var(--jade);}
.byo-chev.is-todo .byo-chev-label{color:#4C6076;}
.byo-chev:disabled .byo-chev-label{opacity:.55;}

.byo-card{background:var(--rock);border:1px dashed var(--line-bright);border-radius:3px;
  padding:16px 18px;margin-bottom:10px;cursor:pointer;transition:border-color .14s,background .14s;
  text-align:left;width:100%;display:block;font:inherit;color:inherit;}
.byo-card:hover{border-color:var(--gold-dim);background:var(--rock-2);}
.byo-card.is-sel{border-style:solid;border-color:var(--gold);background:var(--rock-2);
  box-shadow:inset 3px 0 0 var(--gold);}
.byo-card:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.byo-card-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}
.byo-card-name{font-family:'Fraunces',serif;font-weight:600;font-size:19px;color:var(--bone);flex:1;}
.byo-card-top .byo-dot{align-self:center;}
.byo-card-kind{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--gold-dim);white-space:nowrap;}
.byo-card-blurb{font-size:13px;color:var(--bone-dim);margin:6px 0 10px;line-height:1.45;}
.byo-pills{display:flex;gap:5px;flex-wrap:wrap;}
.byo-pill{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;
  border:1px solid var(--gold-dim);color:var(--gold);border-radius:2px;padding:2px 6px;}
.byo-pill.alt{border-color:var(--line);color:var(--bone-dim);}

.byo-panel{background:var(--rock);border:1px solid var(--line);border-radius:3px;padding:16px 18px;margin-bottom:14px;}
.byo-panel h3{font-family:'Fraunces',serif;font-weight:600;font-size:16px;margin:0 0 10px;}

/* Fluid 2-up layout: falls back to a single column when the viewport
   doesn't have room for two, no media query needed. */
.byo-panel-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;align-items:start;}
.byo-panel-grid .byo-panel{margin-bottom:0;}
.byo-card-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;}
.byo-card-grid .byo-card{margin-bottom:0;}
.byo-note{font-size:13px;color:var(--bone-dim);line-height:1.5;margin:0;}

.byo-choice{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;}
.byo-opt{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.08em;
  background:transparent;border:1px solid var(--line);color:var(--bone-dim);
  padding:8px 14px;border-radius:2px;cursor:pointer;}
.byo-opt:hover{border-color:var(--gold-dim);color:var(--bone);}
.byo-opt.is-sel{border-color:var(--gold);color:var(--abyss);background:var(--gold);}
.byo-opt:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}

.byo-row{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);}
.byo-row:last-child{border-bottom:none;}
.byo-row-label{flex:1;font-size:14px;}
/* Skills on the Sheet step's summary, two tracks like the printed sheet's
   .sk grid. The column gap needs its own hairline-free edge, so the rows
   keep their own bottom border and only the true last row loses it. */
.byo-sk-grid{display:grid;grid-template-columns:1fr 1fr;column-gap:44px;}
.byo-sk-grid .byo-row{border-bottom:1px solid var(--line);}
.byo-sk-grid .byo-row:last-child,.byo-sk-grid .byo-row:nth-last-child(2):nth-child(odd){border-bottom:none;}
.byo-step{display:flex;align-items:center;gap:8px;}
.byo-btn-sq{width:26px;height:26px;border:1px solid var(--line);background:transparent;
  color:var(--bone);font-size:15px;line-height:1;border-radius:2px;cursor:pointer;}
.byo-btn-sq:hover:not(:disabled){border-color:var(--gold);color:var(--gold);}
.byo-btn-sq:disabled{opacity:.28;cursor:not-allowed;}
.byo-num{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;
  width:24px;text-align:center;}
.byo-arrow{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gold-dim);width:34px;text-align:center;}
.byo-final{font-family:'JetBrains Mono',monospace;font-size:17px;font-weight:700;
  color:var(--gold);width:26px;text-align:right;}
.byo-mod{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--bone-dim);width:32px;text-align:right;}
.byo-sel{background:var(--rock-2);border:1px solid var(--line);color:var(--bone);
  font-family:'JetBrains Mono',monospace;font-size:13px;padding:6px 8px;border-radius:2px;}

.byo-budget{display:flex;justify-content:space-between;align-items:baseline;
  border:1px solid var(--line);border-radius:3px;padding:10px 14px;margin-bottom:12px;
  background:var(--rock);}
.byo-budget-n{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:var(--gold);}
.byo-budget-n.zero{color:var(--jade);}
.byo-budget-l{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--bone-dim);}

.byo-trait{padding:9px 0;border-bottom:1px solid var(--line);}
.byo-trait:last-child{border-bottom:none;}
.byo-trait-n{font-weight:700;font-size:13px;color:var(--bone);}
.byo-trait-n .src{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--gold-dim);margin-left:7px;}
.byo-trait-t{font-size:13px;color:var(--bone-dim);line-height:1.5;margin-top:2px;}

.byo-actgroup-l{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--jade);margin:14px 0 4px;}
.byo-actgroup-l:first-child{margin-top:0;}

.byo-stub{border:1px dashed var(--line);border-radius:3px;padding:34px 20px;text-align:center;}
.byo-stub-t{font-family:'Fraunces',serif;font-size:17px;color:var(--bone-dim);margin:0 0 6px;}
.byo-stub-s{font-size:13px;color:#5C7086;margin:0;}

.byo-input{width:100%;box-sizing:border-box;background:var(--rock-2);border:1px solid var(--line);color:var(--bone);
  font-family:'Fraunces',serif;font-size:19px;padding:11px 13px;border-radius:2px;}
.byo-input:focus{outline:none;border-color:var(--gold);}

.byo-nav{position:fixed;left:0;right:0;bottom:0;background:rgba(11,22,34,.96);
  border-top:1px solid var(--line);padding:13px 18px;backdrop-filter:blur(8px);}
.byo-nav-in{max-width:min(94vw,1180px);margin:0 auto;display:flex;gap:10px;align-items:center;}
.byo-btn{font-family:'Karla',sans-serif;font-weight:700;font-size:14px;padding:11px 22px;
  border-radius:2px;cursor:pointer;border:1px solid var(--line);background:transparent;color:var(--bone-dim);}
.byo-btn:hover:not(:disabled){border-color:var(--gold-dim);color:var(--bone);}
.byo-btn-go{background:var(--gold);border-color:var(--gold);color:var(--abyss);margin-left:auto;}
.byo-btn-go:hover:not(:disabled){background:#E4B747;border-color:#E4B747;color:var(--abyss);}
.byo-btn:disabled{opacity:.32;cursor:not-allowed;}
.byo-btn:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.byo-hint{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--coral);
  letter-spacing:.08em;text-transform:uppercase;}
.byo-linkbtn{font:inherit;background:none;border:none;padding:0;margin:0;cursor:pointer;
  color:var(--gold-dim);text-decoration:underline;text-underline-offset:2px;}
.byo-linkbtn:hover{color:var(--gold);}
.byo-linkbtn:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.byo-linkbtn:disabled{color:#4C6076;text-decoration:none;cursor:default;}

/* Start over holds the left end and everything else is pushed right, so
   Back and Next end up adjacent as a pair. Scoped to the nav: the same
   button class is used on the Sheet step, where it must not stretch. */
.byo-nav .byo-btn-danger{margin-right:auto;}
/* .byo-btn-go carries margin-left:auto so it can push itself right in
   other rows; here Start over already owns the free space, and leaving
   it on split Back and Next apart by 150px on a wide screen. */
.byo-nav .byo-btn-go{margin-left:0;}

/* Three buttons now live in the footer — Back, Start over, Next — and at
   phone widths the default 22px side padding overflows the row. */
@media(max-width:430px){
  .byo-nav{padding:11px 12px;}
  .byo-nav-in{gap:6px;}
  .byo-nav .byo-btn{padding:11px 12px;font-size:13px;}
  /* Two skill tracks still fit a phone, but not at the desktop gap. */
  .byo-sk-grid{column-gap:18px;}
  .byo-sk-grid .byo-row{gap:7px;}
  .byo-sk-grid .byo-row-label{font-size:13px;}
}

/* The error-boundary fallback. It renders where the app would have been,
   so it carries its own page padding — there is no wizard chrome left to
   sit inside when the root boundary is the one that caught. */
.byo-crash{max-width:640px;margin:0 auto;padding:40px 18px;}
.byo-crash-msg{margin:14px 0 0;font-family:'JetBrains Mono',monospace;font-size:11.5px;
  color:var(--bone-dim);word-break:break-word;}

.byo-btn-danger{border-color:var(--coral);color:var(--coral);}
.byo-btn-danger:hover:not(:disabled){background:var(--coral);border-color:var(--coral);color:var(--bone);}

.byo-modal-bg{position:fixed;inset:0;background:rgba(11,22,34,.82);display:flex;
  align-items:center;justify-content:center;padding:20px;z-index:50;}
.byo-modal{max-width:400px;width:100%;background:var(--rock);border:1px solid var(--coral);
  border-radius:3px;padding:22px;}
.byo-modal-t{font-family:'Fraunces',serif;font-size:19px;color:var(--bone);margin:0 0 10px;}
.byo-modal-s{font-size:13.5px;color:var(--bone-dim);line-height:1.55;margin:0 0 18px;}
.byo-modal-row{display:flex;gap:10px;justify-content:flex-end;}

.byo-chip{display:flex;align-items:center;gap:10px;background:var(--rock);
  border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:2px;
  padding:9px 13px;margin-bottom:12px;}
.byo-chip-k{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--bone-dim);}
.byo-chip-v{font-family:'Fraunces',serif;font-size:15px;font-weight:600;color:var(--bone);flex:1;}
.byo-chip-b{background:none;border:none;color:var(--gold);font-family:'Karla',sans-serif;
  font-size:12px;font-weight:700;cursor:pointer;padding:3px 5px;text-decoration:underline;
  text-underline-offset:3px;}
.byo-chip-b:hover{color:#E4B747;}
.byo-chip-b:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}

.byo-suggest{display:flex;align-items:center;gap:14px;background:var(--rock);
  border:1px dashed var(--gold-dim);border-radius:3px;padding:13px 15px;margin-bottom:12px;}
.byo-suggest-t{font-size:13px;font-weight:700;color:var(--bone);}
.byo-suggest-s{font-size:12px;color:var(--bone-dim);line-height:1.45;margin-top:2px;}

.byo-out{width:100%;background:var(--abyss);border:1px solid var(--line);color:var(--bone-dim);
  font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.6;padding:12px;
  border-radius:2px;resize:vertical;box-sizing:border-box;}
.byo-out:focus{outline:none;border-color:var(--gold);color:var(--bone);}

.byo-count{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--gold);margin-left:8px;font-weight:400;}
.byo-skills{display:flex;gap:6px;flex-wrap:wrap;}
.byo-skill{font-family:'Karla',sans-serif;font-size:12.5px;font-weight:500;
  background:transparent;border:1px solid var(--line);color:var(--bone-dim);
  padding:7px 11px;border-radius:2px;cursor:pointer;transition:border-color .12s,color .12s;}
.byo-skill:hover:not(:disabled){border-color:var(--gold-dim);color:var(--bone);}
.byo-skill.is-sel{border-color:var(--gold);background:var(--gold);color:var(--abyss);font-weight:700;}
.byo-skill:disabled{opacity:.3;cursor:not-allowed;}
.byo-skill:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}

.byo-skill.is-given{border-color:var(--jade);color:var(--jade);cursor:default;}
.byo-skill.is-dupe{border-color:var(--coral);color:var(--coral);
  text-decoration:line-through;text-decoration-color:rgba(217,80,47,.6);}
.byo-warn{font-size:12.5px;color:var(--bone-dim);line-height:1.55;margin:11px 0 0;
  border-left:2px solid var(--coral);padding-left:11px;}

.byo-legal-draftnote{border-color:var(--coral);}
.byo-legal-list{margin:6px 0 0;padding-left:20px;}
.byo-legal-list li{margin-bottom:6px;}
.byo-legal-list li:last-child{margin-bottom:0;}

.byo-vitals{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;}
.byo-vital{background:var(--rock);border:1px solid var(--line);border-left:3px solid var(--gold);
  border-radius:3px;padding:12px 8px;text-align:center;}
.byo-vital-n{font-family:'JetBrains Mono',monospace;font-size:26px;font-weight:700;
  color:var(--gold);line-height:1.1;}
.byo-vital-l{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--bone-dim);margin-top:4px;}
.byo-vital-s{font-size:10px;color:var(--bone-dim);margin-top:3px;min-height:12px;}
@media(max-width:420px){.byo-vitals{grid-template-columns:repeat(2,1fr);}}
.byo-ac-parts{display:block;font-family:'JetBrains Mono',monospace;font-size:10.5px;
  color:var(--bone-dim);margin-top:2px;}
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
.byo-cast-l{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--bone-dim);}
.byo-cast-v{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;
  color:var(--gold);line-height:1.3;}

.byo-slots{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}
.byo-slot{border:1px solid var(--gold-dim);border-radius:2px;padding:8px 14px;text-align:center;}
.byo-slot-l{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--bone-dim);}
.byo-slot-n{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:var(--gold);}

.byo-rule{display:flex;align-items:center;gap:12px;margin:22px 0;color:var(--gold-dim);}
.byo-rule-l{flex:1;height:1px;background:linear-gradient(to right,transparent,var(--line) 30%,var(--line) 70%,transparent);}

.byo-spell-n{font-family:'Fraunces',serif;font-size:15px;font-weight:600;color:var(--bone);}
.byo-tag{font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.1em;
  text-transform:uppercase;border:1px solid var(--gold-dim);color:var(--gold);
  border-radius:2px;padding:1px 5px;}
.byo-tag.alt{border-color:var(--line);color:var(--bone-dim);}
/* One-letter tags: the .1em tracking would sit as dead space after a lone
   glyph and knock it off-centre in the box. */
.byo-tag.one{letter-spacing:0;padding:1px 4px;}
.byo-spell-hl{display:block;margin-top:5px;font-size:12.5px;color:var(--bone-dim);line-height:1.55;}
.byo-spell-hl b{color:var(--bone);}

.byo-atk-table{display:flex;flex-direction:column;}
.byo-atk-row{display:grid;grid-template-columns:1.4fr .8fr .7fr .9fr 1.4fr;gap:8px;
  align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:12.5px;}
.byo-atk-row:last-child{border-bottom:none;}
.byo-atk-head{font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--bone-dim);padding-bottom:8px;}
.byo-atk-name{font-family:'Fraunces',serif;font-weight:600;color:var(--bone);
  display:flex;align-items:center;gap:6px;}
.byo-atk-num{font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--gold);}
.byo-atk-notes{color:var(--bone-dim);}
@media (max-width:520px){
  .byo-atk-row{grid-template-columns:1.2fr .7fr .6fr;}
  .byo-atk-row span:nth-child(4),.byo-atk-row span:nth-child(5){grid-column:1/-1;}
}
.byo-spell-t{display:block;font-size:12.5px;color:var(--bone-dim);line-height:1.5;
  margin-top:6px;}

.byo-sprow{display:flex;gap:10px;width:100%;text-align:left;background:transparent;
  border:none;border-bottom:1px solid var(--line);padding:11px 0;cursor:pointer;
  color:inherit;font:inherit;align-items:flex-start;}
.byo-sprow:last-child{border-bottom:none;}
.byo-sprow:hover:not(:disabled) .byo-spell-n{color:var(--gold);}
.byo-sprow:disabled{opacity:.32;cursor:not-allowed;}
.byo-sprow:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.byo-sprow.is-sel .byo-spell-n{color:var(--gold);}
.byo-sprow-tbl .byo-atk-row{border-bottom:none;padding:0;font-size:12px;}
.byo-sprow-tbl .byo-spell-n{display:flex;align-items:center;gap:5px;font-size:14px;}
.byo-spell-trig{display:block;margin-top:6px;font-size:12px;color:var(--gold);
  font-style:italic;line-height:1.5;}
.byo-heal{color:var(--jade);}

.byo-export{display:flex;align-items:center;justify-content:space-between;gap:16px;
  flex-wrap:wrap;background:var(--rock);
  border:1px solid var(--gold-dim);border-radius:3px;padding:16px 18px;margin-bottom:10px;}
.byo-export-t{font-family:'Fraunces',serif;font-size:17px;font-weight:600;color:var(--bone);}
.byo-export-s{font-size:12.5px;color:var(--bone-dim);line-height:1.5;margin-top:4px;}
/* The sheet box stacks: title, then one full-width button per export route.
   Equal widths so no route reads as the "real" one — which platform you're on
   decides that, not us. Colour carries the difference instead: gold for the
   print route, jade for the iOS one, slate for the fallback. */
.byo-export-stack{flex-direction:column;align-items:stretch;}
.byo-export-alt{display:flex;flex-direction:column;gap:8px;margin-top:12px;}
.byo-export-alt .byo-btn{width:100%;margin-left:0;}
.byo-btn-ios{background:var(--jade);border-color:var(--jade);color:var(--abyss);}
.byo-btn-ios:hover:not(:disabled){background:#4FBF9C;border-color:#4FBF9C;color:var(--abyss);}
.byo-btn-alt{background:var(--rock-2);border-color:var(--line);color:var(--bone);}
.byo-btn-alt:hover:not(:disabled){background:#22405C;border-color:var(--bone-dim);color:var(--bone);}

.byo-lvlh{font-family:'Fraunces',serif;font-size:15px;font-weight:600;color:var(--bone);
  margin:18px 0 2px;padding-bottom:5px;border-bottom:1px solid var(--line);}

.byo-sum{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:14px;}
.byo-sum-c{background:var(--rock);border:1px solid var(--line);border-radius:2px;padding:9px 4px;text-align:center;}
.byo-sum-k{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.1em;color:var(--bone-dim);}
.byo-sum-v{font-family:'JetBrains Mono',monospace;font-size:19px;font-weight:700;color:var(--gold);line-height:1.3;}
.byo-sum-m{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--bone-dim);}
@media(max-width:420px){.byo-sum{grid-template-columns:repeat(3,1fr);}}
@media(prefers-reduced-motion:reduce){*{transition:none!important;}}
`;
