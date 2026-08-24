/* Headless harness for the iOS raster export. Renders the PDF from a fixed
   fixture and leaves it in the DOM as base64 for scripts/check-exports.mjs to
   read back over CDP. Loaded only by /pdftest.html, which is not a build
   entry — nothing here ships. */
import { buildRasterPDF } from "./pdf/sheetRaster.js";
import { FIXTURE } from "./pdfTestFixture.js";

const out = document.getElementById("out");
buildRasterPDF(FIXTURE).then(async (blob) => {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  out.textContent = "PDF:" + btoa(bin);
}).catch((e) => { out.textContent = "ERR:" + (e && e.stack || e); });
