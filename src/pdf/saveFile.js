/* Hands a finished file to the user. Deliberately not a bare <a download>
   holding an application/pdf blob: iOS Safari treats a blob it can render —
   a PDF above all — as something to preview, ignores the download attribute,
   and drops the file in a tab, leaving the user to walk ... → Share → Save to
   Files by hand.

   So: hand the file to the share sheet where that exists, which puts "Save to
   Files" one tap away on iOS and Save/Share on Android. Everywhere else (and
   if the share is refused) fall back to an anchor download typed
   application/octet-stream, which Safari won't try to display inline.

   navigator.share needs transient user activation, and rendering the file eats
   into it, so callers must reach this straight from a click handler with only
   the render awaited ahead of it. Returns "shared" | "cancelled" | "downloaded"
   so the caller can word its confirmation correctly. */
export async function saveFile(blob, filename, type = 'application/pdf') {
  if (typeof File !== 'undefined' && navigator.canShare) {
    const file = new File([blob], filename, { type });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return 'shared';
      } catch (e) {
        // Dismissing the sheet is a normal outcome, not a failure to retry.
        if (e && e.name === 'AbortError') return 'cancelled';
      }
    }
  }

  const url = URL.createObjectURL(new Blob([blob], { type: 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'downloaded';
}

/* The file is named after the character and nothing else — every export
   route shares this, so a folder of saved sheets reads as a list of names.
   Anything a filesystem or a share sheet could choke on is dropped rather
   than substituted: letters, digits, spaces, hyphens and underscores
   survive, runs of whitespace collapse to one space, and case is kept as
   typed. A name made entirely of punctuation leaves nothing behind, hence
   the second fallback. */
export const sheetFileBase = (name) => (name || '')
  .replace(/[^\p{L}\p{N} _-]+/gu, '')
  .replace(/\s+/g, ' ')
  .trim() || 'Unnamed';

export const sheetFileName = (name, ext) => `${sheetFileBase(name)}.${ext}`;
