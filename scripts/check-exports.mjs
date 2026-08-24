/* Renders the iOS raster export end to end in a real browser and reports what
   came out. The pipeline can only be exercised where there's a layout engine —
   an iframe, html2canvas and a canvas — so this drives headless Chromium over
   CDP rather than faking any of it.

   Two bugs that unit-level checks couldn't have caught were found this way:
   the iframe's load event fires for the initial about:blank document (giving
   an empty capture), and CSS multi-column doesn't survive html2canvas.

     npm run check:export            page count + size, writes the PDF
     npm run check:export -- --keep  ...and prints where, to eyeball it

   Needs a Chromium-family browser installed; set BROWSER=/path/to/binary if
   it isn't at one of the paths below. */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CANDIDATES = [
  process.env.BROWSER,
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const browser = CANDIDATES.find((p) => fs.existsSync(p));
if (!browser) {
  console.error('No Chromium-family browser found. Set BROWSER=/path/to/binary.');
  process.exit(2);
}

const PORT = 5199;
const CDP = 9333;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sina-export-'));
const outFile = path.join(tmp, 'sheet.pdf');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const chrome = spawn(browser, ['--headless=new', '--disable-gpu', '--no-sandbox',
  `--remote-debugging-port=${CDP}`, `--user-data-dir=${path.join(tmp, 'profile')}`, 'about:blank'],
  { stdio: 'ignore' });

const done = (code, msg) => {
  if (msg) console.log(msg);
  chrome.kill();
  vite.kill();
  if (!process.argv.includes('--keep')) fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(code);
};

try {
  let targets = [];
  for (let i = 0; i < 60; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json();
      if (targets.some((t) => t.type === 'page')) break;
    } catch { /* not up yet */ }
    await wait(300);
  }
  const page = targets.find((t) => t.type === 'page');
  if (!page) done(1, 'browser never exposed a page target');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  };
  const send = (method, params = {}) => new Promise((r) => {
    const i = ++id;
    pending.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: `http://localhost:${PORT}/pdftest.html` });

  let text = '';
  for (let i = 0; i < 120; i++) {
    await wait(500);
    const r = await send('Runtime.evaluate',
      { expression: "document.getElementById('out')?.textContent || ''", returnByValue: true });
    text = r.result?.result?.value || '';
    if (text.startsWith('PDF:') || text.startsWith('ERR:')) break;
  }

  if (text.startsWith('ERR:')) done(1, `✗ export threw\n${text.slice(4, 1200)}`);
  if (!text.startsWith('PDF:')) done(1, '✗ export never finished (60s)');

  const buf = Buffer.from(text.slice(4), 'base64');
  fs.writeFileSync(outFile, buf);
  const head = buf.subarray(0, 5).toString('latin1');
  const pages = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (head !== '%PDF-') done(1, '✗ output is not a PDF');
  if (pages < 1) done(1, '✗ PDF has no pages');
  if (buf.length < 50_000) done(1, `✗ PDF is ${buf.length} bytes — the capture is probably blank`);

  done(0, `  ✓ raster export: ${pages} A4 pages, ${(buf.length / 1024 / 1024).toFixed(2)} MB` +
    (process.argv.includes('--keep') ? `\n  ${outFile}` : ''));
} catch (e) {
  done(1, `✗ ${e && e.stack || e}`);
}
