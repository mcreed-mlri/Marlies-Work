# Archived screener designs

Two earlier designs of the SNAP ABAWD screening, kept because they are worth looking at, not
because they are maintained. Archived 2026-07-30.

They are frozen. Nothing here is tested, nothing here should be edited, and nothing here
should be linked to as though it were current. The live screening is
`masslegalhelp/index.html`.

| File | What it was |
|---|---|
| `snap-abawd.html` | The original design, mirroring how Court Forms Online is set up today. |
| `snap-screening-v2.html` | An accessible redesign: plain language, picture cues, big Yes/No tiles. |

## Why they stopped

MLRI is hosting the screening on MassLegalHelp and owning the whole pipeline, so a Court
Forms Online styled page is no longer a deliverable. Court Forms Online requires a
Docassemble interview rather than a static page, and MLRI's team needs to review before
launch, which does not fit handing a package to another organisation to upload.

Keeping three variants alive meant every change to the shared logic had to not break all
three. That cost was worth paying while the destination was undecided. It is not any more.

`snap-screening-v2.html` is the one to look at if you want the tiles. CLAUDE.md points here
for that pattern: the big Yes/No tiles are better than stock interview screens, and if the
live design ever grows them, this is the reference.

## Self-contained on purpose

`snap-screening-logic.js`, `fonts/`, and `vendor/` are frozen copies, not shared with the
live builds. An archive that breaks when current code moves is not an archive. Two
consequences:

The logic module here will drift from `court-forms/snap-screening-logic.js` and
`masslegalhelp/snap-screening-logic.js` as those change, and that is correct. The drift test
in `tests/render-smoke.test.js` deliberately does not look at this copy.

These pages are not in `scripts/check-pages.js` or any test. If one of them breaks, nothing
will say so. That is the trade for not maintaining them.

The service worker registration was removed from both, since it belongs to the preview site
shell rather than to a frozen page.

## If you need one of these back

Take it out of here rather than editing in place, and give it a current copy of the logic
module. Its own copy is a snapshot of 30 July 2026 and predates whatever has changed since.
