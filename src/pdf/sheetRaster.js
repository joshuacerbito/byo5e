import { buildSheetHTML } from '../lib/sheetHtml.js';
import { saveFile, sheetFileName } from './saveFile.js';

/* PDF that looks exactly like the HTML sheet, because it *is* the HTML sheet:
   buildSheetHTML() is laid out by the browser in an offscreen A4-wide iframe,
   then photographed block by block into an A4 PDF. Fidelity is perfect by
   construction — no second layout engine to keep in step with the CSS — at
   the cost of the text being an image rather than selectable glyphs.

   This exists for iOS, where the print route is a dead end: Safari's print
   preview renders the sheet and then goes blank, and there is no Save as PDF
   destination to pick even when it doesn't.

   Blocks are captured individually rather than slicing one tall screenshot,
   so a page break lands between sections instead of through a line of text. */

const PX_PER_MM = 96 / 25.4;          // CSS pixel per mm at the 96dpi the iframe lays out at
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const MARGIN_MM = 14;                  // matches @page margin in the sheet's own stylesheet
const CONTENT_H_MM = PAGE_H_MM - MARGIN_MM * 2;
const CONTENT_W_MM = PAGE_W_MM - MARGIN_MM * 2;
const SCALE = 2;                       // 192dpi — sharp on screen and in print without ballooning the file

/* An A4-wide iframe, off-screen but genuinely laid out. It has to have real
   dimensions: a 0-width iframe lays the sheet out at 0 and everything captured
   from it comes back squished. */
function mountSheet(html) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = `${Math.round(PAGE_W_MM * PX_PER_MM)}px`;
    iframe.style.height = `${Math.round(PAGE_H_MM * PX_PER_MM)}px`;
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    /* load fires for the initial about:blank document too, before srcdoc has
       been parsed — capturing there yields an empty page. Poll for a document
       that is actually complete and populated, then wait on its webfonts so
       nothing is photographed mid-swap. */
    const started = Date.now();
    const check = async () => {
      const doc = iframe.contentDocument;
      if (doc && doc.readyState === 'complete' && doc.body && doc.body.children.length) {
        try { await doc.fonts?.ready; } catch { /* no font API: nothing to wait for */ }
        resolve(iframe);
        return;
      }
      if (Date.now() - started > 5000) {
        iframe.remove();
        reject(new Error('sheet iframe never finished loading'));
        return;
      }
      setTimeout(check, 50);
    };

    iframe.srcdoc = html;
    check();
  });
}

/* Flattens the sheet into a list of elements that each fit on one page.
   A block taller than the page — a long features section, the appendix —
   is replaced by its own children, recursively, so the split happens between
   paragraphs. A single paragraph taller than a page (none exist today, but
   a very long feature text could) is kept whole and sliced as a bitmap. */
function paginatable(el, maxHeightPx, out = []) {
  for (const child of el.children) {
    if (child.offsetHeight === 0) continue;
    if (child.offsetHeight <= maxHeightPx || !child.children.length) out.push(child);
    else paginatable(child, maxHeightPx, out);
  }
  return out;
}

/* Returns the finished PDF as a Blob. Split out from the save step so the
   pipeline can be exercised headlessly without a download. */
export async function buildRasterPDF(ctx) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const iframe = await mountSheet(buildSheetHTML(ctx, { interactive: false }));
  try {
    const doc = iframe.contentDocument;
    const contentHpx = CONTENT_H_MM * PX_PER_MM;
    const blocks = paginatable(doc.body, contentHpx);

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    let y = MARGIN_MM;
    let firstPage = true;

    for (const block of blocks) {
      const canvas = await html2canvas(block, {
        scale: SCALE,
        backgroundColor: '#ffffff',
        logging: false,
        // The block is inside the iframe, so html2canvas has to be told the
        // window it belongs to — otherwise it measures against the host page.
        windowWidth: doc.documentElement.clientWidth,
        windowHeight: doc.documentElement.clientHeight,
      });

      const wMm = CONTENT_W_MM;
      const hMm = (canvas.height / canvas.width) * wMm;
      const img = canvas.toDataURL('image/jpeg', 0.92);

      if (hMm > CONTENT_H_MM) {
        // Taller than a whole page even on its own: slice the bitmap. Only
        // reachable for an unsplittable leaf, so it can't cut between sections.
        let offsetMm = 0;
        while (offsetMm < hMm - 0.5) {
          if (!firstPage) pdf.addPage();
          firstPage = false;
          // Draw the full image shifted up, clipped by the page edges.
          pdf.addImage(img, 'JPEG', MARGIN_MM, MARGIN_MM - offsetMm, wMm, hMm);
          // Mask whatever spills past the bottom margin of this page.
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, PAGE_H_MM - MARGIN_MM, PAGE_W_MM, MARGIN_MM, 'F');
          pdf.rect(0, 0, PAGE_W_MM, MARGIN_MM, 'F');
          offsetMm += CONTENT_H_MM;
        }
        y = MARGIN_MM + (hMm % CONTENT_H_MM);
        continue;
      }

      if (!firstPage && y + hMm > PAGE_H_MM - MARGIN_MM) {
        pdf.addPage();
        y = MARGIN_MM;
      }
      firstPage = false;
      pdf.addImage(img, 'JPEG', MARGIN_MM, y, wMm, hMm);
      y += hMm;
    }

    pdf.setProperties({ title: `${ctx.name.trim() || 'Unnamed'} — character sheet` });
    return pdf.output('blob');
  } finally {
    iframe.remove();
  }
}

export async function saveSheetRasterPDF(ctx) {
  const blob = await buildRasterPDF(ctx);
  return saveFile(blob, sheetFileName(ctx.name, 'pdf'));
}
