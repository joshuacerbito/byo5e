import { sheetFileName } from "../pdf/saveFile.js";

/* The character save, in one place: the localStorage key, the read/write
   pair around it, and the export envelope.

   localStorage is a cache, not the record — it is per-device, per-browser,
   and one "clear site data" from being gone. The `.json` export is the
   portable form, and it is deliberately the same field set: an exported
   file is a snapshot plus a header saying what shape it is in.

   `saveFormat` is that header. It is 1 today, meaning "bare ids, whatever
   content the app happened to ship". A later format will qualify every id
   with the pack it came from, and a reader can only tell the two apart if
   today's files say which one they are. */

export const STORAGE_KEY = "byo5e-character";
export const SAVE_FORMAT = 1;

/* The localStorage entry is versioned against SAVE_FORMAT the same way the
   `.json` export is: a save written under a different format means ids
   were minted by a content-pack shape this build no longer understands
   (the SRD-pack rebuild was the first such break), and restoring it would
   crash somewhere far from here. Anything that doesn't match today's
   format — including a bare pre-versioning snapshot, or garbage — is
   discarded rather than trusted. Bump SAVE_FORMAT the next time a pack
   rebuild changes what a saved id means.

   The `.json` export is the durable form across a break like that; this
   is just the auto-resume cache. */
export function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.saveFormat !== SAVE_FORMAT || !parsed.character) {
      clearSaved();
      return null;
    }
    return parsed.character;
  } catch {
    clearSaved();
    return null;
  }
}

export function saveSnapshot(snapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ saveFormat: SAVE_FORMAT, character: snapshot }));
  } catch {
    /* storage full or unavailable — silently skip, nothing else depends on it */
  }
}

export function clearSaved() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/* The exported file. `app` and `exportedAt` are for the human opening it
   in a text editor months later; `saveFormat` is the only field a reader
   is required to understand. */
export function buildCharacterExport(snapshot) {
  return JSON.stringify({
    saveFormat: SAVE_FORMAT,
    app: "byo5e-character-creator",
    exportedAt: new Date().toISOString(),
    character: snapshot,
  }, null, 2);
}

/* Named after the character, the same as every sheet export — a folder of
   saved files reads as a list of names. The `.json` is what distinguishes
   the character from the sheet beside it, so no suffix is added. */
export const characterFileName = (name) => sheetFileName(name, "json");
