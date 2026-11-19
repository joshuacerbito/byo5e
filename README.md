# Bring Your Own 5e

> [!NOTE]
> **Active personal project.** Built for one table and updated as that table needs it, so expect rough edges and changes without notice. This is an unofficial fan tool, not affiliated with or endorsed by Wizards of the Coast. It ships only SRD content released under CC-BY-4.0.

A D&D 5e character builder that runs entirely on content packs. The app ships no rules of its own: classes, species, spells, items and features all arrive as data, so a new rulebook is a new pack, not a code change.

It ships with two packs built from the free System Reference Documents, one per rules edition (SRD 5.1 for 2014, SRD 5.2.1 for 2024), and supports multiclassing, Weapon Mastery, magic item effects and three PDF export routes.

**Live example:** [https://byo5e.joshuacerbito.workers.dev](https://byo5e.joshuacerbito.workers.dev)

It is a personal tool for one table, not a released product. See [CHANGELOG.md](CHANGELOG.md) for what changed and why.

## Where to look first

If you have ten minutes, these two files say the most about how the app is built.

**[`scripts/build-srd-pack.mjs`](scripts/build-srd-pack.mjs): the data pipeline.**
Turns a local 5etools checkout into the two committed packs. The source data is large and inconsistent, and most of the file is about not trusting it:

- `_copy` records are resolved before anything is filtered, because a copy can carry the SRD flag onto the record it copies. Filtering first would read half-built records.
- Class-tied records are filtered on both `source` and `classSource`. 5etools files 128 legacy subclasses under the 2024 class as well, so either filter alone pulls in the wrong edition or duplicates.
- Fields the source never populated (2014 primary abilities) are backfilled, so the two packs have the same shape.
- Magic item variants (+1/+2/+3 weapons and armour) are expanded from templates, and each expanded item keeps a link to its base item.
- Output is deterministic: stable sort keys and no build timestamp, so a re-run over the same checkout is byte-identical and a diff only ever shows real content changes.
- The CC-BY attribution text is reproduced exactly as each SRD's legal page specifies.

**[`src/rules/effects.js`](src/rules/effects.js): the rules layer.**
Content declares what it changes, and derived stats read those declarations. There is no branch anywhere in the app on an individual class, species or subclass. That is what keeps a builder from rotting as content grows. Effects of a type the app does not implement are kept and shown to the pack author rather than silently ignored.

## How it fits together

```
5etools checkout
  -> scripts/build-srd-pack.mjs   builds the packs
  -> src/packs/*.json             committed content packs, one per edition
  -> src/content                  mappers: pack records into app shapes
  -> src/rules                    effects, progression, prerequisites, multiclass, combat
  -> src/components               the step-by-step creator and the sheet
  -> src/pdf                      print, rasterised HTML for iOS, vector PDF
```

- **Packs** keep 5etools' record shape verbatim. Tag markup is stripped at runtime by the mapper layer, so the pipeline never has to guess what the app will need.
- **Content mappers** (`src/content`) are the only code that knows the pack format. Everything above them works with the app's own shapes.
- **Rules** (`src/rules`) compute what a character can choose and what they end up with, from effects collected across every source: class features, subclasses, species, backgrounds, feats and items.

## Stack

React 18, Vite 5, deployed on Cloudflare Pages. PDF export uses pdfmake, jsPDF and html2canvas. Supabase is wired in as groundwork for Google sign-in.

## Running it

```
npm install
npm run dev            # local dev server
npm run build          # production build
npm run build:packs    # rebuild the SRD packs (needs a local 5etools-src checkout)
npm run check          # project checks
npm run check:content  # content pack checks
npm run check:export   # PDF export checks
```

## How it was built

I designed the architecture and the rules, and built it with Claude Code as a pair: it writes alongside me, and every change is reviewed against the rules text before it lands. The commit history shows both of us as authors.

## Licensing

The app's own code is MIT ([LICENSE.md](LICENSE.md)). The SRD content in `src/packs` is CC-BY-4.0 from Wizards of the Coast ([NOTICE.md](NOTICE.md)). The pack build tooling derived from 5etools is covered in [THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md).
