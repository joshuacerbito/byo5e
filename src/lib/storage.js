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

/* TEMPORARY — the rebuild onto SRD content packs changes what every saved
   id means, so a save written by yesterday's build would restore ids that
   no longer resolve and crash somewhere far from here. Until the save
   format is versioned against the loaded packs, every save is discarded and
   cleared on load. Restoring this is deliberate work, not a matter of
   deleting the flag: it needs the pack manifest in the envelope and the
   missing-content handling that goes with it.

   The `.json` export is unaffected — that is the way to keep a character
   across the rebuild. */
export const DISCARD_SAVES_ON_LOAD = true;

export function loadSaved() {
  if (DISCARD_SAVES_ON_LOAD) {
    clearSaved();
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
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
