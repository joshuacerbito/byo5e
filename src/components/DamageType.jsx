/* ------------------------------------------------------------------
   The thirteen 5e damage types, as icons.

   Thirteen is the whole set, in both SRD packs and in every edition
   since 5e's first printing — acid, bludgeoning, cold, fire, force,
   lightning, necrotic, piercing, poison, psychic, radiant, slashing,
   thunder. It's the same list src/content/items.js maps its single
   letter codes onto (DMG_TYPE there), so a type arriving here that
   isn't in this map is a pack carrying something new rather than a
   spelling to guess at — those fall back to printing the word.

   Why icons: "1d6-1 bludgeoning" is the longest cell in the attack
   table and wraps to two lines on a phone; the glyph says the same
   thing in 14px. The word is still available to anyone who needs it —
   as the accessible name, as the hover tooltip, and in full in the
   detail drawer.

   Glyphs are Lucide (lucide.dev, ISC), inlined verbatim, same as the
   screen-bar icons in Sheet.jsx.
------------------------------------------------------------------- */

/* type -> [lucide name, glyph] — the name is kept because it's the
   only way back to the upstream source when one needs redrawing. */
const GLYPHS = {
  acid: ["droplets", (
    <>
      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
    </>
  )],
  bludgeoning: ["hammer", (
    <>
      <path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9" />
      <path d="m18 15 4-4" />
      <path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" />
    </>
  )],
  cold: ["snowflake", (
    <>
      <path d="m10 20-1.25-2.5L6 18" /><path d="M10 4 8.75 6.5 6 6" />
      <path d="m14 20 1.25-2.5L18 18" /><path d="m14 4 1.25 2.5L18 6" />
      <path d="m17 21-3-6h-4" /><path d="m17 3-3 6 1.5 3" />
      <path d="M2 12h6.5L10 9" /><path d="m20 10-1.5 2 1.5 2" />
      <path d="M22 12h-6.5L14 15" /><path d="m4 10 1.5 2L4 14" />
      <path d="m7 21 3-6-1.5-3" /><path d="m7 3 3 6h4" />
    </>
  )],
  fire: ["flame", (
    <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
  )],
  force: ["disc-2", (
    <>
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
      <path d="M12 12h.01" />
    </>
  )],
  lightning: ["zap", (
    <path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" />
  )],
  necrotic: ["skull", (
    <>
      <path d="m12.5 17-.5-1-.5 1h1z" />
      <path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z" />
      <circle cx="15" cy="12" r="1" /><circle cx="9" cy="12" r="1" />
    </>
  )],
  piercing: ["mouse-pointer-click", (
    <>
      <path d="M14 4.1 12 6" /><path d="m5.1 8-2.9-.8" /><path d="m6 12-1.9 2" />
      <path d="M7.2 2.2 8 5.1" />
      <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" />
    </>
  )],
  poison: ["biohazard", (
    <>
      <circle cx="12" cy="11.9" r="2" />
      <path d="M6.7 3.4c-.9 2.5 0 5.2 2.2 6.7C6.5 9 3.7 9.6 2 11.6" />
      <path d="m8.9 10.1 1.4.8" />
      <path d="M17.3 3.4c.9 2.5 0 5.2-2.2 6.7 2.4-1.2 5.2-.6 6.9 1.5" />
      <path d="m15.1 10.1-1.4.8" />
      <path d="M16.7 20.8c-2.6-.4-4.6-2.6-4.7-5.3-.2 2.6-2.1 4.8-4.7 5.2" />
      <path d="M12 13.9v1.6" /><path d="M13.5 5.4c-1-.2-2-.2-3 0" />
      <path d="M17 16.4c.7-.7 1.2-1.6 1.5-2.5" /><path d="M5.5 13.9c.3.9.8 1.8 1.5 2.5" />
    </>
  )],
  psychic: ["brain", (
    <>
      <path d="M12 18V5" />
      <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
      <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
      <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
      <path d="M18 18a4 4 0 0 0 2-7.464" />
      <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
      <path d="M6 18a4 4 0 0 1-2-7.464" />
      <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
    </>
  )],
  radiant: ["sparkles", (
    <>
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4" /><path d="M22 4h-4" /><circle cx="4" cy="20" r="2" />
    </>
  )],
  slashing: ["sword", (
    <>
      <path d="m11 19-6-6" /><path d="m5 21-2-2" /><path d="m8 16-4 4" />
      <path d="M9.5 17.5 20.414 6.586A2 2 0 0021 5.172V3h-2.172a2 2 0 00-1.414.586L6.5 14.5" />
    </>
  )],
  thunder: ["audio-waveform", (
    <path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2" />
  )],
};

export const DAMAGE_TYPES = Object.keys(GLYPHS);

/* The word is never actually lost: it's the accessible name, the
   tooltip, and what an unmapped type prints instead of a glyph. */
export default function DamageType({ type }) {
  if (!type) return null;
  const glyph = GLYPHS[String(type).toLowerCase()]?.[1];
  if (!glyph) return <span className="byo-dmg-t">{type}</span>;
  /* The wrapper, not the <svg>, carries the tooltip: the glyphs are
     stroked outlines with fill="none", so hovering an <svg title> only
     registers on the 2px lines themselves — you have to land on the
     stroke to get a tooltip. A span with padding is a solid target,
     and its ::after (see .byo-dmg in styles.js) is on-brand and
     immediate where the native title attribute is OS-styled and
     delayed. Desktop-only, gated on `hover: hover` — on a touch screen
     there's no hover to trigger it and the label would be dead weight
     in the tap target of a row that already opens a drawer. */
  return (
    <span className="byo-dmg" data-label={type}>
      <svg className="byo-dmg-i" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
           role="img" aria-label={type}>
        {glyph}
      </svg>
    </span>
  );
}
