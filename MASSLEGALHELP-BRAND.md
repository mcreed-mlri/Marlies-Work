# MassLegalHelp chrome reference

Captured from masslegalhelp.org on 2026-07-30 by reading computed styles in the browser,
not from a style guide. MLRI owns the site, so ask whoever runs it for the real tokens
before launch and correct anything here that disagrees.

The site is Drupal 10 with a custom theme, `citizen_dart`. Assets live under
`/themes/custom/citizen_dart/`. That matters for the path-proxy plan: the screener is
static files served at a path on their origin, so it cannot inherit the Drupal header at
render time. The chrome below has to be reproduced in static HTML and will drift when they
restyle the site. Budget for that, or ask their web team for an include.

## Colour

| Token | Value | Where it appears |
|---|---|---|
| Top strip | `#0c1639` | Thin bar above the header holding the language selector, 42px |
| Header | `#1e2e5f` | Main header bar, 120px at rest |
| Brand navy | `#1f2c5c` | Body text, headings, links, footer background |
| Pale gold | `#e8da8d` | The `Legal Topics` pill, and the left accent bars on promo cards |
| Gold | `#eab736` | The rule under the header, **9.6px**. Corrected 2026-07-30: this was originally read as `#e8da8d` at 4px, which rendered as a hairline instead of the band it actually is. Two different golds, measured separately |
| Band top | `#d3e7ff` | Top of the page-title gradient |
| Band bottom | `#fafcff` | Bottom of the same gradient |
| Band edge | `#a2c4f0` | The solid block offset behind the title panel |
| Rule ink | `#192a65` | The short heavy rule under the byline, 146px by 5px |
| Pale blue | `#d3e7ff` | Hero band, section backgrounds behind card grids, page-title band |
| Pale blue, low end | `#fafcff` | Bottom of the title band gradient, `linear-gradient(#d3e7ff, #fafcff)` |
| Accent blue | `#0057a2` | Skip-link focus, circular arrow affordances on cards |
| Page | `#ffffff` | Same as the existing screener and as Court Forms Online |

## Type

Body is Montserrat at 16px with a 22.4px line height, colour `#1f2c5c`. Headings are Domine,
a serif, at 700; `h1` is 36px over 48px. Both are self-hosted by the theme. Montserrat ships
at 500, 600, 700 and Domine at 500, 700.

Body links are the same navy as body text and are distinguished by an underline, not by
colour. Anything we build has to keep the underline, because removing it would leave links
indistinguishable from text.

## Measured contrast

Ratios computed 2026-07-30. Every text pair clears AA comfortably, which is why adopting
this palette does not disturb the existing control tokens.

| Pair | Ratio | Verdict |
|---|---|---|
| `#1f2c5c` on `#ffffff` | 13.35 | AA text |
| `#ffffff` on `#1e2e5f` | 13.03 | AA text |
| `#ffffff` on `#0c1639` | 17.65 | AA text |
| `#1f2c5c` on `#e8da8d` | 9.44 | AA text |
| `#1f2c5c` on `#d3e7ff` | 10.58 | AA text |
| `#0057a2` on `#ffffff` | 7.28 | AA text |
| `#1f2c5c` on `#eef1f5` (existing option fill) | 11.78 | AA text |
| `#1f2c5c` on `#d7e6f9` (existing selected fill) | 10.54 | AA text |

The existing control tokens survive the rebrand unchanged. `--field:#eef1f5`, hover
`#e3e8f0`, selected `#d7e6f9`, option border `#84909f` at 3.25:1, and radio mark border
`#767f8c` at 3.58:1 on the tinted fill all still hold, because the page stays white and only
the chrome changes. MLH's own pale blue `#d3e7ff` is within a hair of the existing selected
fill, so the tinted-control model is if anything more at home here than on Court Forms
Online.

## One trap: the gold

Gold `#e8da8d` is 1.41:1 on white and 9.21:1 on the header navy. MLH uses it as a decorative
rule, which is fine, because a decorative divider carries no information and 1.4.11 does not
apply to it.

It is not fine for anything that carries meaning. The screener currently sets
`.topbar :focus-visible{outline-color:var(--yellow)}`. That is legitimate only while the
focus ring stays inside the navy bar. A gold focus ring, selected state, or error indicator
anywhere on the white page would fail. Use `#0057a2` at 7.28:1 for those.

## The page-header pattern

This is the part that makes a page read as theirs, and it is worth treating as the template
for every screener MLRI puts on the site rather than as one page's styling. Implemented as
`.band` and `.byline-rule` in `masslegalhelp/tools/snap/index.html`.

Their article pages open with four things in order. A pale blue gradient panel holding the
title, `linear-gradient(#d3e7ff, #fafcff)`, padded roughly `42px 51px 20px` at their column
width. A solid `#a2c4f0` block offset behind it, down and to the right. A byline: a navy
circle with a document glyph, then `By <organisation>` and `Reviewed <Month Year>`. Then a
short heavy rule, 146px by 5px, in `#192a65`.

The offset block is theirs as an absolutely positioned `::after`, inset `top:8px left:8px
right:-8px bottom:-8px`. Ours is `box-shadow:8px 8px 0 0 var(--band-edge)`, which produces
the same visible result for two reasons. A pseudo-element needs `z-index:-1` to sit behind
the panel, and since `.band` creates no stacking context that puts it behind the page's own
white background where it is invisible. And a shadow never affects layout, so it cannot push
a horizontal scrollbar onto a narrow screen the way a negatively inset absolute box can.

Measured 2026-07-30, and worth copying: their panel carries `margin-right:8px`, so the block
sits in reserved space and the panel's right edge lines up with the body copy underneath
rather than overhanging it by 8px. Their panel's left edge is flush with the body column,
and the `h1` is indented by the panel's own 51px of padding. Ours now matches all three.

## What we deliberately do not copy

Five pieces of their chrome are absent on purpose, because faking them is worse than
leaving them out.

The dark top strip exists to hold a language selector. Until there is a Spanish version there
is nothing to select, and an empty dark bar is decoration pretending to be navigation. Add
the strip when translations land, not before.

The breadcrumb row with Print and Share, and the "Listen to this Page" button. Each is a
working control on their site. A screener that draws them without wiring them is offering a
button that does nothing, which is worse than a page that never promised it.

Headings in Domine. Their `h1` is Domine 700 at 36px over 48px; ours is Atkinson Hyperlegible.
This is the largest remaining visual difference, and this document used to call it a missing
font file rather than a decision. That framing cost us: the page carried a `--serif` token
reading `'Domine', Georgia, serif`, the file never landed, and every heading shipped in
Georgia, a face nothing in the repository declared, sitting over a body set in a typeface
chosen specifically for low-vision readers. Reverted to Atkinson on 2026-07-30. Domine is
OFL and self-hosted by their theme, so it is still available, but it needs the file, a
decision, and a DESIGN.md entry in that order, not a fallback chain hoping for one. Body
copy stays Atkinson regardless: they use Montserrat, and Atkinson was chosen for low-vision
readers, which outranks matching a host font.

The title panel's gradient. Theirs is `linear-gradient(#d3e7ff, #fafcff)` and ours is a flat
`#d3e7ff`. The gradient bottoms out at 1.03:1 against a white page, so the panel's own
bottom edge vanishes while the `#a2c4f0` block behind it holds 1.80:1: the ornament ends up
1.7x more visible than the thing it is offset from, and the 8px strip reads as a bar
floating under nothing. Their 805px column and the two-line byline underneath carry it;
our 628px column with no byline does not. A flat fill gives the panel a 1.26:1 boundary on
all four sides, which is what makes an offset block legible as depth. This is the only
measured value in this document we knowingly diverge from.

The byline row. See the section below on the review date, which is the part of it worth
bringing back.

## Layout patterns worth matching

Page title sits in a pale blue band with the `#d3e7ff` to `#fafcff` gradient and a narrow
right-edge accent, above a breadcrumb row with Print and Share on the right.

Card grids are white cards on a pale blue section, thin borders, navy underlined titles, and
a circular `#0057a2` arrow at the bottom right. Promo cards use a gold left accent bar
instead of a border.

Footer is `#1f2c5c` with a gold rule above it and a darker `#0c1639` strip below carrying
Terms of Use and Privacy Policy. It credits MLAC funding and reads
`©2026 Massachusetts Legal Assistance Corporation`.

The header collapses on scroll: the tagline hides and the bar shortens. Ours does not need
to reproduce that, but the resting and collapsed heights differ, so do not hardcode a
120px offset.

Article bodies use collapsible accordion sections under Domine `h2` toggles. Worth knowing
because it is the pattern a reader arriving from the ABAWD article will have just used.

## Content pattern the screener does not honour, and the one open question in it

Article pages carry a byline block: an icon, `By Massachusetts Law Reform Institute`, and a
`Reviewed <Month Year>` date. The ABAWD article read `Reviewed February 2026` on the day this
was captured.

This document used to say the screener should carry the same block. It did, in a
byline-shaped half: the icon and the organisation, with no review date, because nobody has
signed off on the thresholds. The whole row came out on 2026-07-30. A byline answers "who
wrote this" on an article, and on a three-minute screening the reader's question is whether
the rules apply to them; MLRI is already named a screen later in the privacy note. One line
of text against a 40px mark also sat visibly high, and the fix for that would have been the
review date, which is exactly the thing we cannot assert.

The half of the argument that survives is the review date. Content staleness belongs
somewhere a reader and an SME can both see it, and a threshold last verified in November
2025 with no date shown anywhere is worse than one carrying its age. MLRI's own ABAWD
article was reviewed February 2026 and is therefore newer than this tool. When someone
reviews, the date comes back as a full byline block above the rule, which is the pattern; a
date floating alone is not.
