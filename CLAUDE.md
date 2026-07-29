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

The Playwright suite (`tests/snap-screening.spec.js`) cannot run locally. CI covers the
unit and page checks on every push.

## Writing style

No em dashes. Use a colon, semicolon, or a second sentence instead. Keep prose short and
direct.

Avoid the `**Thing** — short gloss` bullet shape. If a bullet needs a bold lead-in, follow
it with a real sentence and let bullet lengths vary.

## Icons

No emoji in UI. Use Lucide line glyphs in a filled circle, white stroke on
`--navy` / `--blue` / `--green` / `#9a6a00`, matching the result screens in
`court-forms/snap-screening-v2.html`.

The screener pages load `vendor/lucide.min.js` and call `lucide.createIcons()` because they
render icons dynamically. The small static pages (`court-forms/index.html`,
`snap-screening.html`, `snap-how-it-works.html`) inline the SVG instead, to avoid a 361KB
dependency that would blank the icons if it failed to load.

## Court Forms Online look

`court-forms/` deliberately mirrors production Court Forms Online so the tools can be
dropped in. Match the chrome: navy top bar, gold torch mark, and the color tokens in
`:root`.

Do not copy production's interview screens wholesale. They are dated Docassemble defaults
(Bootstrap carets, a flat sidebar step list). The big Yes/No tiles in `snap-screening-v2.html`
are the better pattern and should stay.

## Contrast model: white page, tinted controls

All `court-forms/` pages are `--bg:#ffffff`, matching production. Separation comes from
tinting the *controls*, not the page. Do not revert options to a white fill; on a white page
they would disappear.

- Option fill `--field:#eef1f5`, hover `--field-hover:#e3e8f0`, selected `--sel:#d7e6f9`
- Option border `#84909f` (3.25:1 on white, so it satisfies WCAG 1.4.11 for a component
  boundary; the old `#d3d9e2` was 1.42:1 and did not)
- Radio/checkbox mark border `#767f8c` (3.58:1 on the tinted fill)
- Panel borders `#c8d2e0`. Result cards keep their own colour-coded borders
- Selected state is carried by the accent border (6.29:1 classic, 8.76:1 v2) plus the filled
  mark, not by the fill. Any two pale tints sit near 1.05:1, so fill alone cannot do it

The landing pages use border-only cards for the same reason. Before changing any of these
values, check the ratio; `ba5502f` fixed contrast on these screens once already.
