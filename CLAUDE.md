# MLRI preview site

Static prototypes for MLRI, no build step. Plain HTML, hand-written CSS, vanilla JS.

## Commits

Do not add `Co-Authored-By` or "Generated with" trailers to commit messages.

Keep commit bodies substantive. Recording why an approach was rejected is worth the
lines; a future maintainer needs that more than a short subject line.

## Running things

There is no `npm` on this machine, so the `package.json` scripts are for CI only. Run
Node directly with the bundled binary:

```
"$LOCALAPPDATA/OpenAI/Codex/bin/node.exe" scripts/check-pages.js
"$LOCALAPPDATA/OpenAI/Codex/bin/node.exe" --test tests/snap-screening-logic.test.js tests/render-smoke.test.js
```

The Playwright suite (`tests/snap-screening.spec.js`) cannot run locally.

CI runs five jobs on every push: the unit and render tests, the page checks, the
JavaScript-to-Python decision parity, a check that every generated file is current,
and the publish guards on the shipping build. The last two exist because both
failures are silent. A stale `SCREENER-COPY.md` means the author reviews copy the
tool no longer has, and a parent-relative path works in the preview site and 404s
in production.

Generators and the publish path, same binary. All four are safe to re-run; each
overwrites its own output and nothing else:

```
scripts/copy-doc.js                 regenerates SCREENER-COPY.md from the code
scripts/decision-spec.js            regenerates DECISION-SPEC.md and decision-spec.json
scripts/gen-docassemble.js          regenerates the interview YAML and ALKiln feature file
scripts/publish-mlh.js --check      guards on the shipping build, changes nothing
scripts/publish-mlh.js              guards, then split the deploy branch
```

Run `decision-spec.js` before `gen-docassemble.js`: the second reads the JSON the
first writes.

The Docassemble port has its own tests, and there IS a Python on this machine
(3.12), so unlike Playwright these do run locally:

```
python docassemble-snap-abawd/tests/test_snap_abawd_parity.py
python docassemble-snap-abawd/tests/test_good_cause_text.py
```

They read `decision-spec.json`, so regenerating the spec after a logic change makes
them check the new behaviour automatically. If you change a rule in the JavaScript
and not the Python, that is where it surfaces.

`publish-mlh.js` never pushes. It prints the push command and stops. Run it with `--check`
after any change to `masslegalhelp/`; it catches the failures that look fine in the preview
site and 404 at the deploy root, mainly parent-relative and rooted paths.

## Writing style

No em dashes. Use a colon, semicolon, or a second sentence instead. Keep prose short and
direct.

Avoid the `**Thing** — short gloss` bullet shape. If a bullet needs a bold lead-in, follow
it with a real sentence and let bullet lengths vary.

## Icons

No emoji in UI. Use Lucide line glyphs in a filled circle, white stroke on
`--navy` / `--blue` / `--green` / `#9a6a00`, matching the result screens in
`archive/snap-screening-v2.html`.

Only the archived `archive/snap-screening-v2.html` loads `vendor/lucide.min.js` and calls
`lucide.createIcons()`. Every other page, including both classic builds and the shipping
`masslegalhelp/index.html`, inlines the SVG instead, to avoid a 361KB dependency that would
blank the icons if it failed to load. Do not add the vendored copy to a page that does not
already need it.

## One build

`masslegalhelp/index.html` is the screener. It is what reviewers look at and what the public
gets, and there is exactly one copy of `snap-screening-logic.js`, next to it. Read
`masslegalhelp/README.md` before touching it; it carries the deploy contract.

`court-forms/` is gone as of 2026-07-30. Court Forms Online requires a Docassemble interview,
so a Court Forms styled static page shipped nowhere, and the three earlier designs are frozen
in `archive/`. Two guards went with it: a drift test between the two copies of the logic
module, and the same check in the publish script. They caught a real one-sided edit twice, and
are unnecessary now that there is nothing to drift against.

If a second build ever appears, bring the drift guard back before the second copy does.

## MassLegalHelp look

The shipping build wears MassLegalHelp's chrome, measured off their live article pages and
recorded with contrast ratios in `MASSLEGALHELP-BRAND.md`. Read the "what we deliberately do
not copy" section there before adding any of their chrome that is missing: the language strip,
breadcrumbs, Print, Share, and Listen are all absent on purpose, because drawing a control
that does nothing is worse than not drawing it.

The page-header pattern, `.band` plus `.byline` plus `.byline-rule`, is meant as the template
for every screener MLRI puts on the site rather than one page's styling.

Court Forms Online's own interview screens are dated Docassemble defaults (Bootstrap carets, a
flat sidebar step list). The big Yes/No tiles in `archive/snap-screening-v2.html` are the
better pattern if the design ever grows them.

## Contrast model: white page, tinted controls

Every page is `--bg:#ffffff`, matching both Court Forms Online and MassLegalHelp. Separation
comes from tinting the *controls*, not the page. Do not revert options to a white fill; on a
white page they would disappear.

Because the page is white in both, the control tokens below survived the MassLegalHelp
rebrand unchanged; only the chrome moved. Host chrome tokens and their measured ratios are
in `MASSLEGALHELP-BRAND.md`. One trap recorded there: MLH's gold `#e8da8d` is 1.41:1 on
white, so it is decorative only and must never carry meaning outside the navy bar.

- Option fill `--field:#eef1f5`, hover `--field-hover:#e3e8f0`, selected `--sel:#d7e6f9`
- Option border `#84909f` (3.25:1 on white, so it satisfies WCAG 1.4.11 for a component
  boundary; the old `#d3d9e2` was 1.42:1 and did not)
- Radio/checkbox mark border `#767f8c` (3.58:1 on the tinted fill)
- Panel borders `#c8d2e0`. Result cards keep their own colour-coded borders
- Selected state is carried by the accent border (6.29:1 classic, 8.76:1 v2) plus the filled
  mark, not by the fill. Any two pale tints sit near 1.05:1, so fill alone cannot do it

The landing pages use border-only cards for the same reason. Before changing any of these
values, check the ratio; `ba5502f` fixed contrast on these screens once already.
