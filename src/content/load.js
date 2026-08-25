/* ------------------------------------------------------------------
   The browser entry point for the content layer.

   The ONLY module here that does an import() of a pack. It is lazy and
   per edition, so an edition the user never picks is never downloaded —
   Vite emits each pack JSON as its own chunk. Everything below this
   file is pure and takes a parsed object, which is what lets
   scripts/check-content.mjs drive the same code from node with fs.

   Not wired into the UI yet. Nothing imports this module.
------------------------------------------------------------------- */
import { buildContent } from "./index.js";

export const EDITIONS = ["2014", "2024"];

export const EDITION_LABEL = { 2014: "SRD 5.1 (2014 rules)", 2024: "SRD 5.2 (2024 rules)" };

const LOADERS = {
  2014: () => import("../packs/srd-5.1.json"),
  2024: () => import("../packs/srd-5.2.json"),
};

const cache = new Map();

export function loadContent(edition = "2014") {
  const key = String(edition);
  if (!LOADERS[key]) return Promise.reject(new Error(`unknown rules edition: ${edition}`));
  if (!cache.has(key)) {
    cache.set(key, LOADERS[key]()
      .then((m) => buildContent(m.default ?? m))
      .catch((e) => { cache.delete(key); throw e; }));
  }
  return cache.get(key);
}

export function clearContentCache() { cache.clear(); }
