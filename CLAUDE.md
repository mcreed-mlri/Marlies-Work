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

CI runs six jobs on every push: the unit and render tests, the page checks, the
JavaScript-to-Python decision parity, a check that every generated file is current,
the browser tests, and the publish guards on the shipping build. The generated-files
and publish jobs exist because both failures are silent. A stale `SCREENER-COPY.md`
means the author reviews copy the tool no longer has, and a parent-relative path
works in the preview site and 404s in production.

## The two copy documents

Both are generated from the same code and neither is optional.

`SCREENER-COPY.md` lists every string with the `code.name` that finds it in the source.
Those ids are how an edit gets back to the right string, so they stay, and they are also
what makes the document hard to read straight through. This is the one to write edits into.

`SCREENER-WALKTHROUGH.md` is the same wording with no ids, in the order someone meets it,
followed by worked examples showing the letter being assembled one answer at a time. It is
for reading and for showing people. Two conventions hold it together: narration is italic
and the screener's own words never are, and the screener's own bold is carried through
rather than stripped, because which half of a sentence is emphasised is a decision someone
made. Both are stated in a legend at the top.

Add copy to the walkthrough through `say()` if it is narration and `quote()` if it is the
tool's words. Writing a raw `w('> ...')` puts a blockquote past both the italics rule and
the `--docs` conversion, which is how two stray `>` lines once reached the Google Docs
export as literal text.

`TESTING.md` is generated too, for the same reason: a manual checklist that is quietly
missing a case is worse than none, because working through it feels like coverage. The
exemptions, the guided questions, and every composed sentence are read from the code; the
judgement sections are prose in the generator. Reading its output is a real review step,
not a formality. Laying every sentence out side by side is how a subject-verb disagreement
and a letter that contradicted itself about hours were both caught.

Generators and the publish path, same binary. All four are safe to re-run; each
overwrites its own output and nothing else:

```
scripts/copy-doc.js                 regenerates SCREENER-COPY.md from the code
scripts/copy-walkthrough.js         regenerates SCREENER-WALKTHROUGH.md, and the Google Docs
                                    copy in _local/ with it, since nothing watches that one
scripts/copy-walkthrough.js --docs  only the Google Docs copy, if that is all you want
scripts/testing-doc.js              regenerates TESTING.md from the code
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

`masslegalhelp/tools/snap/index.html` is the screener. It is what reviewers look at and what
the public gets, and there is exactly one copy of `snap-screening-logic.js`, at
`masslegalhelp/snap-screening-logic.js`. The tools landing page is
`masslegalhelp/tools/index.html`. Read `masslegalhelp/README.md` before touching any of it; it
carries the deploy contract.

`court-forms/` is gone as of 2026-07-30. Court Forms Online requires a Docassemble interview,
so a Court Forms styled static page shipped nowhere, and the three earlier designs are frozen
in `archive/`. Two guards went with it: a drift test between the two copies of the logic
module, and the same check in the publish script. They caught a real one-sided edit twice, and
are unnecessary now that there is nothing to drift against.

If a second build ever appears, bring the drift guard back before the second copy does.

## Guided ending (archived)

The shipping screener is write-in only: one blank box per exemption, and the person writes
the letter body. The guided ending, where pick-lists compose the statement, is archived at
`archive/snap-guided/index.html` for records. It is not linked from the shipping or review
landing pages.

The logic module still carries `guidedQuestions`, `composeStatement`, and the composed copy in
`RESULT_COPY`, because the copy documents and unit tests read them. Nothing a guided question
answers may reach the decision; `decision-spec.json` is generated from the logic module and
the Python parity suite reads it.

Every composed sentence is printed in full in `SCREENER-COPY.md` section 10. Month names are
resolved at compose time against a passed-in date and never appear in an option label, or the
copy doc would change every month and fail CI on the first.

## MassLegalHelp look

The shipping build wears MassLegalHelp's chrome, measured off their live article pages and
recorded with contrast ratios in `MASSLEGALHELP-BRAND.md`. Read the "what we deliberately do
not copy" section there before adding any of their chrome that is missing: the language strip,
breadcrumbs, Print, Share, and Listen are all absent on purpose, because drawing a control
that does nothing is worse than not drawing it.

The page-header pattern, `.band` plus `.byline-rule`, is meant as the template for every
screener MLRI puts on the site rather than one page's styling. Two parts of it depart from
the measured original on purpose, both recorded in `MASSLEGALHELP-BRAND.md`: the panel is a
flat `#d3e7ff` rather than their gradient, because the gradient's 1.03:1 bottom edge left
the offset block reading as a floating bar at our narrower column, and the byline row is
gone. Do not restore either from the brand doc's measurements alone.

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
