/* All component styling. Imported as a template string into the
   root component's <style> tag. */
export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Karla:wght@400;500;700&family=JetBrains+Mono:wght@500;700&display=swap');

.su-root, .su-root *, .su-root *::before, .su-root *::after{box-sizing:border-box;}
.su-root{
  --abyss:#0B1622; --rock:#132436; --rock-2:#1B3145; --line:#26445F;
  --gold:#D4A537; --gold-dim:#8A6B1F; --jade:#3FA98A; --coral:#D9502F;
  --bone:#E8DEC9; --bone-dim:#93A3B4;
  background:var(--abyss); color:var(--bone);
  font-family:'Karla',system-ui,sans-serif; min-height:100vh;
  padding:28px 18px 120px; -webkit-font-smoothing:antialiased;
}
.su-wrap{max-width:800px;margin:0 auto;}
.su-eyebrow{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.22em;
  text-transform:uppercase;color:var(--gold-dim);margin:0 0 6px;}
.su-h1{font-family:'Fraunces',serif;font-weight:800;font-size:30px;line-height:1.1;
  margin:0 0 4px;color:var(--bone);letter-spacing:-.01em;}
.su-sub{color:var(--bone-dim);font-size:14px;margin:0 0 22px;}

/* batok rail — chevron linework, filled as you progress */
.su-rail{display:flex;gap:5px;align-items:center;margin:0 0 26px;flex-wrap:wrap;}
.su-chev{display:flex;align-items:center;gap:7px;}
.su-chev svg{display:block;}
.su-chev-label{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--bone-dim);}
.su-chev.is-now .su-chev-label{color:var(--gold);}
.su-chev.is-done .su-chev-label{color:var(--jade);}
.su-chev.is-todo .su-chev-label{color:#4C6076;}

.su-card{background:var(--rock);border:1px solid var(--line);border-radius:3px;
  padding:16px 18px;margin-bottom:10px;cursor:pointer;transition:border-color .14s,background .14s;
  text-align:left;width:100%;display:block;font:inherit;color:inherit;}
.su-card:hover{border-color:var(--gold-dim);background:var(--rock-2);}
.su-card.is-sel{border-color:var(--gold);background:var(--rock-2);
  box-shadow:inset 3px 0 0 var(--gold);}
.su-card:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.su-card-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}
.su-card-name{font-family:'Fraunces',serif;font-weight:600;font-size:19px;color:var(--bone);}
.su-card-kind{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--gold-dim);white-space:nowrap;}
.su-card-blurb{font-size:13px;color:var(--bone-dim);margin:6px 0 10px;line-height:1.45;}
.su-pills{display:flex;gap:5px;flex-wrap:wrap;}
.su-pill{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;
  border:1px solid var(--gold-dim);color:var(--gold);border-radius:2px;padding:2px 6px;}
.su-pill.alt{border-color:var(--line);color:var(--bone-dim);}

.su-panel{background:var(--rock);border:1px solid var(--line);border-radius:3px;padding:16px 18px;margin-bottom:14px;}
.su-panel h3{font-family:'Fraunces',serif;font-weight:600;font-size:16px;margin:0 0 10px;}
.su-note{font-size:13px;color:var(--bone-dim);line-height:1.5;margin:0;}

.su-choice{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;}
.su-opt{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.08em;
  background:transparent;border:1px solid var(--line);color:var(--bone-dim);
  padding:8px 14px;border-radius:2px;cursor:pointer;}
.su-opt:hover{border-color:var(--gold-dim);color:var(--bone);}
.su-opt.is-sel{border-color:var(--gold);color:var(--abyss);background:var(--gold);}
.su-opt:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}

.su-row{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--line);}
.su-row:last-child{border-bottom:none;}
.su-row-label{flex:1;font-size:14px;}
.su-step{display:flex;align-items:center;gap:8px;}
.su-btn-sq{width:26px;height:26px;border:1px solid var(--line);background:transparent;
  color:var(--bone);font-size:15px;line-height:1;border-radius:2px;cursor:pointer;}
.su-btn-sq:hover:not(:disabled){border-color:var(--gold);color:var(--gold);}
.su-btn-sq:disabled{opacity:.28;cursor:not-allowed;}
.su-num{font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;
  width:24px;text-align:center;}
.su-arrow{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gold-dim);width:34px;text-align:center;}
.su-final{font-family:'JetBrains Mono',monospace;font-size:17px;font-weight:700;
  color:var(--gold);width:26px;text-align:right;}
.su-mod{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--bone-dim);width:32px;text-align:right;}
.su-sel{background:var(--rock-2);border:1px solid var(--line);color:var(--bone);
  font-family:'JetBrains Mono',monospace;font-size:13px;padding:6px 8px;border-radius:2px;}

.su-budget{display:flex;justify-content:space-between;align-items:baseline;
  border:1px solid var(--line);border-radius:3px;padding:10px 14px;margin-bottom:12px;
  background:var(--rock);}
.su-budget-n{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;color:var(--gold);}
.su-budget-n.zero{color:var(--jade);}
.su-budget-l{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--bone-dim);}

.su-trait{padding:9px 0;border-bottom:1px solid var(--line);}
.su-trait:last-child{border-bottom:none;}
.su-trait-n{font-weight:700;font-size:13px;color:var(--bone);}
.su-trait-n .src{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--gold-dim);margin-left:7px;}
.su-trait-t{font-size:13px;color:var(--bone-dim);line-height:1.5;margin-top:2px;}
.su-struck{opacity:.34;}
.su-struck .su-trait-n{text-decoration:line-through;}

.su-actgroup-l{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--jade);margin:14px 0 4px;}
.su-actgroup-l:first-child{margin-top:0;}

.su-stub{border:1px dashed var(--line);border-radius:3px;padding:34px 20px;text-align:center;}
.su-stub-t{font-family:'Fraunces',serif;font-size:17px;color:var(--bone-dim);margin:0 0 6px;}
.su-stub-s{font-size:13px;color:#5C7086;margin:0;}

.su-input{width:100%;box-sizing:border-box;background:var(--rock-2);border:1px solid var(--line);color:var(--bone);
  font-family:'Fraunces',serif;font-size:19px;padding:11px 13px;border-radius:2px;}
.su-input:focus{outline:none;border-color:var(--gold);}

.su-nav{position:fixed;left:0;right:0;bottom:0;background:rgba(11,22,34,.96);
  border-top:1px solid var(--line);padding:13px 18px;backdrop-filter:blur(8px);}
.su-nav-in{max-width:800px;margin:0 auto;display:flex;gap:10px;align-items:center;}
.su-btn{font-family:'Karla',sans-serif;font-weight:700;font-size:14px;padding:11px 22px;
  border-radius:2px;cursor:pointer;border:1px solid var(--line);background:transparent;color:var(--bone-dim);}
.su-btn:hover:not(:disabled){border-color:var(--gold-dim);color:var(--bone);}
.su-btn-go{background:var(--gold);border-color:var(--gold);color:var(--abyss);margin-left:auto;}
.su-btn-go:hover:not(:disabled){background:#E4B747;border-color:#E4B747;color:var(--abyss);}
.su-btn:disabled{opacity:.32;cursor:not-allowed;}
.su-btn:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.su-hint{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--coral);
  letter-spacing:.08em;text-transform:uppercase;}
.su-linkbtn{font:inherit;background:none;border:none;padding:0;margin:0;cursor:pointer;
  color:var(--gold-dim);text-decoration:underline;text-underline-offset:2px;}
.su-linkbtn:hover{color:var(--gold);}
.su-linkbtn:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}

.su-btn-danger{border-color:var(--coral);color:var(--coral);}
.su-btn-danger:hover:not(:disabled){background:var(--coral);border-color:var(--coral);color:var(--bone);}

.su-modal-bg{position:fixed;inset:0;background:rgba(11,22,34,.82);display:flex;
  align-items:center;justify-content:center;padding:20px;z-index:50;}
.su-modal{max-width:400px;width:100%;background:var(--rock);border:1px solid var(--coral);
  border-radius:3px;padding:22px;}
.su-modal-t{font-family:'Fraunces',serif;font-size:19px;color:var(--bone);margin:0 0 10px;}
.su-modal-s{font-size:13.5px;color:var(--bone-dim);line-height:1.55;margin:0 0 18px;}
.su-modal-row{display:flex;gap:10px;justify-content:flex-end;}

.su-chip{display:flex;align-items:center;gap:10px;background:var(--rock);
  border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:2px;
  padding:9px 13px;margin-bottom:12px;}
.su-chip-k{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--bone-dim);}
.su-chip-v{font-family:'Fraunces',serif;font-size:15px;font-weight:600;color:var(--bone);flex:1;}
.su-chip-b{background:none;border:none;color:var(--gold);font-family:'Karla',sans-serif;
  font-size:12px;font-weight:700;cursor:pointer;padding:3px 5px;text-decoration:underline;
  text-underline-offset:3px;}
.su-chip-b:hover{color:#E4B747;}
.su-chip-b:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}

.su-suggest{display:flex;align-items:center;gap:14px;background:var(--rock);
  border:1px dashed var(--gold-dim);border-radius:3px;padding:13px 15px;margin-bottom:12px;}
.su-suggest-t{font-size:13px;font-weight:700;color:var(--bone);}
.su-suggest-s{font-size:12px;color:var(--bone-dim);line-height:1.45;margin-top:2px;}

.su-out{width:100%;background:var(--abyss);border:1px solid var(--line);color:var(--bone-dim);
  font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.6;padding:12px;
  border-radius:2px;resize:vertical;box-sizing:border-box;}
.su-out:focus{outline:none;border-color:var(--gold);color:var(--bone);}

.su-lvl{display:flex;gap:6px;flex-wrap:wrap;}
.su-count{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--gold);margin-left:8px;font-weight:400;}
.su-skills{display:flex;gap:6px;flex-wrap:wrap;}
.su-skill{font-family:'Karla',sans-serif;font-size:12.5px;font-weight:500;
  background:transparent;border:1px solid var(--line);color:var(--bone-dim);
  padding:7px 11px;border-radius:2px;cursor:pointer;transition:border-color .12s,color .12s;}
.su-skill:hover:not(:disabled){border-color:var(--gold-dim);color:var(--bone);}
.su-skill.is-sel{border-color:var(--gold);background:var(--gold);color:var(--abyss);font-weight:700;}
.su-skill:disabled{opacity:.3;cursor:not-allowed;}
.su-skill:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}

.su-skill.is-given{border-color:var(--jade);color:var(--jade);cursor:default;}
.su-skill.is-dupe{border-color:var(--coral);color:var(--coral);
  text-decoration:line-through;text-decoration-color:rgba(217,80,47,.6);}
.su-warn{font-size:12.5px;color:var(--bone-dim);line-height:1.55;margin:11px 0 0;
  border-left:2px solid var(--coral);padding-left:11px;}

.su-vitals{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;}
.su-vital{background:var(--rock);border:1px solid var(--line);border-left:3px solid var(--gold);
  border-radius:3px;padding:12px 8px;text-align:center;}
.su-vital-n{font-family:'JetBrains Mono',monospace;font-size:26px;font-weight:700;
  color:var(--gold);line-height:1.1;}
.su-vital-l{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--bone-dim);margin-top:4px;}
.su-vital-s{font-size:10px;color:var(--bone-dim);margin-top:3px;min-height:12px;}
@media(max-width:420px){.su-vitals{grid-template-columns:repeat(2,1fr);}}
.su-ac-parts{display:block;font-family:'JetBrains Mono',monospace;font-size:10.5px;
  color:var(--bone-dim);margin-top:2px;}
.su-prof{font-size:11px;color:var(--gold);width:14px;}
.su-dim{opacity:.45;}

.su-cast{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;}
.su-cast-c{background:var(--rock-2);border:1px solid var(--line);border-radius:2px;
  padding:11px 6px;text-align:center;}
.su-cast-l{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--bone-dim);}
.su-cast-v{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;
  color:var(--gold);line-height:1.3;}

.su-slots{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}
.su-slot{border:1px solid var(--gold-dim);border-radius:2px;padding:8px 14px;text-align:center;}
.su-slot-l{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--bone-dim);}
.su-slot-n{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;color:var(--gold);}

.su-rule{display:flex;align-items:center;gap:12px;margin:22px 0;color:var(--gold-dim);}
.su-rule-l{flex:1;height:1px;background:linear-gradient(to right,transparent,var(--line) 30%,var(--line) 70%,transparent);}

.su-src{display:flex;align-items:center;gap:9px;font-family:'JetBrains Mono',monospace;
  font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-dim);
  margin:18px 0 2px;}
.su-src:first-child{margin-top:6px;}
.su-src-n{border:1px solid var(--line);border-radius:2px;padding:1px 6px;
  color:var(--bone-dim);letter-spacing:.06em;}

.su-spell-n{font-family:'Fraunces',serif;font-size:15px;font-weight:600;color:var(--bone);}
.su-tag{font-family:'JetBrains Mono',monospace;font-size:8.5px;letter-spacing:.1em;
  text-transform:uppercase;border:1px solid var(--gold-dim);color:var(--gold);
  border-radius:2px;padding:1px 5px;}
.su-tag.alt{border-color:var(--line);color:var(--bone-dim);}
/* One-letter tags: the .1em tracking would sit as dead space after a lone
   glyph and knock it off-centre in the box. */
.su-tag.one{letter-spacing:0;padding:1px 4px;}

.su-atk-table{display:flex;flex-direction:column;}
.su-atk-row{display:grid;grid-template-columns:1.4fr .8fr .7fr .9fr 1.4fr;gap:8px;
  align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:12.5px;}
.su-atk-row:last-child{border-bottom:none;}
.su-atk-head{font-family:'JetBrains Mono',monospace;font-size:9.5px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--bone-dim);padding-bottom:8px;}
.su-atk-name{font-family:'Fraunces',serif;font-weight:600;color:var(--bone);
  display:flex;align-items:center;gap:6px;}
.su-atk-num{font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--gold);}
.su-atk-notes{color:var(--bone-dim);}
@media (max-width:520px){
  .su-atk-row{grid-template-columns:1.2fr .7fr .6fr;}
  .su-atk-row span:nth-child(4),.su-atk-row span:nth-child(5){grid-column:1/-1;}
}
.su-spell-t{display:block;font-size:12.5px;color:var(--bone-dim);line-height:1.5;
  margin-top:6px;}

.su-sprow{display:flex;gap:10px;width:100%;text-align:left;background:transparent;
  border:none;border-bottom:1px solid var(--line);padding:11px 0;cursor:pointer;
  color:inherit;font:inherit;align-items:flex-start;}
.su-sprow:last-child{border-bottom:none;}
.su-sprow:hover:not(:disabled) .su-spell-n{color:var(--gold);}
.su-sprow:disabled{opacity:.32;cursor:not-allowed;}
.su-sprow:focus-visible{outline:2px solid var(--jade);outline-offset:2px;}
.su-sprow-b{font-size:11px;color:var(--gold);padding-top:3px;flex-shrink:0;}
.su-sprow.is-sel .su-spell-n{color:var(--gold);}
.su-sprow-tbl .su-atk-row{border-bottom:none;padding:0;font-size:12px;}
.su-sprow-tbl .su-spell-n{display:flex;align-items:center;gap:5px;font-size:14px;}
.su-spell-trig{display:block;margin-top:6px;font-size:12px;color:var(--gold);
  font-style:italic;line-height:1.5;}
.su-heal{color:var(--jade);}

.su-export{display:flex;align-items:center;justify-content:space-between;gap:16px;
  flex-wrap:wrap;background:var(--rock);
  border:1px solid var(--gold-dim);border-radius:3px;padding:16px 18px;margin-bottom:10px;}
.su-export-t{font-family:'Fraunces',serif;font-size:17px;font-weight:600;color:var(--bone);}
.su-export-s{font-size:12.5px;color:var(--bone-dim);line-height:1.5;margin-top:4px;}
/* The sheet box stacks: title, then one full-width button per export route.
   Equal widths so no route reads as the "real" one — which platform you're on
   decides that, not us. Colour carries the difference instead: gold for the
   print route, jade for the iOS one, slate for the fallback. */
.su-export-stack{flex-direction:column;align-items:stretch;}
.su-export-alt{display:flex;flex-direction:column;gap:8px;margin-top:12px;}
.su-export-alt .su-btn{width:100%;margin-left:0;}
.su-btn-ios{background:var(--jade);border-color:var(--jade);color:var(--abyss);}
.su-btn-ios:hover:not(:disabled){background:#4FBF9C;border-color:#4FBF9C;color:var(--abyss);}
.su-btn-alt{background:var(--rock-2);border-color:var(--line);color:var(--bone);}
.su-btn-alt:hover:not(:disabled){background:#22405C;border-color:var(--bone-dim);color:var(--bone);}

.su-spell-none{font-style:italic;color:#5C7086;}
.su-lvlh{font-family:'Fraunces',serif;font-size:15px;font-weight:600;color:var(--bone);
  margin:18px 0 2px;padding-bottom:5px;border-bottom:1px solid var(--line);}

.su-sum{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:14px;}
.su-sum-c{background:var(--rock);border:1px solid var(--line);border-radius:2px;padding:9px 4px;text-align:center;}
.su-sum-k{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.1em;color:var(--bone-dim);}
.su-sum-v{font-family:'JetBrains Mono',monospace;font-size:19px;font-weight:700;color:var(--gold);line-height:1.3;}
.su-sum-m{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--bone-dim);}
@media(max-width:420px){.su-sum{grid-template-columns:repeat(3,1fr);}}
@media(prefers-reduced-motion:reduce){*{transition:none!important;}}
`;
