---
name: Marlie's MLRI Work
description: One SNAP screener wearing MassLegalHelp's chrome, indexed by a warm paper preview shell.
colors:
  header-navy: "#1e2e5f"
  brand-navy: "#1f2c5c"
  strip-navy: "#0c1639"
  accent-blue: "#0057a2"
  rule-gold: "#eab736"
  pill-gold: "#e8da8d"
  band-top: "#d3e7ff"
  band-bottom: "#fafcff"
  band-edge: "#a2c4f0"
  rule-ink: "#192a65"
  page-white: "#ffffff"
  field: "#eef1f5"
  field-hover: "#e3e8f0"
  selected-fill: "#d7e6f9"
  boundary: "#84909f"
  boundary-hover: "#5b6675"
  boundary-strong: "#767f8c"
  panel-line: "#c8d2e0"
  muted-ink: "#5b6470"
  placeholder-ink: "#6b7280"
  progress-track: "#dbe3ef"
  exempt-fill: "#e6f4ec"
  exempt-bg: "#eef7f1"
  exempt-line: "#cbe4d5"
  exempt-ink: "#14532d"
  exempt-strong: "#166534"
  approval-green: "#1e7a45"
  caution-fill: "#fbf1dc"
  caution-bg: "#fff8e8"
  caution-line: "#ecd9a8"
  caution-ink: "#7a4a00"
  info-line: "#c7d6f0"
  danger: "#a12b2b"
  danger-line: "#c58484"
  shell-paper: "#fbf8f1"
  shell-card: "#fffef9"
  shell-ink: "#221f1a"
  shell-muted: "#6b6255"
  shell-edge: "#9e8e66"
  shell-rule: "#e4ddcd"
  shell-pine: "#3a5a40"
  shell-house-blue: "#3d5a80"
  shell-terracotta: "#a85a32"
  shell-tag: "#eef1e9"
  shell-paper-dark: "#17150f"
  shell-card-dark: "#1e1b13"
  shell-ink-dark: "#ece7db"
  shell-muted-dark: "#a39a87"
  shell-edge-dark: "#706755"
  shell-rule-dark: "#332e24"
  shell-pine-dark: "#93b899"
  shell-house-blue-dark: "#9ab7d6"
  shell-terracotta-dark: "#dc9163"
  shell-tag-dark: "#242a20"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(26px, 6vw, 32px)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(24px, 6vw, 29px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(21px, 5.5vw, 25px)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  result-title:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(21px, 5.5vw, 26px)"
    fontWeight: 700
    lineHeight: 1.25
  question:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(18px, 4.6vw, 21px)"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  panel-title:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "16.5px"
    fontWeight: 400
    lineHeight: 1.6
  body-small:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  byline:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.5
  option:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "16.5px"
    fontWeight: 700
    lineHeight: 1.35
  label:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "14.5px"
    fontWeight: 700
    lineHeight: 1.35
  caption:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.4
  control-small:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "13.5px"
    fontWeight: 700
    lineHeight: 1.3
  shell-section:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  shell-entry-title:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.2
rounded:
  focus: "3px"
  xs: "4px"
  mark: "6px"
  sm: "7px"
  md: "10px"
  lg: "12px"
  xl: "14px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "8px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "22px"
  xxl: "28px"
components:
  topbar:
    backgroundColor: "{colors.header-navy}"
    textColor: "{colors.page-white}"
    padding: "12px 16px"
  button-exit:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.header-navy}"
    rounded: "{rounded.pill}"
    padding: "10px 14px"
    height: "44px"
  band:
    backgroundColor: "{colors.band-top}"
    textColor: "{colors.brand-navy}"
    padding: "30px 26px 22px"
  byline-mark:
    backgroundColor: "{colors.accent-blue}"
    textColor: "{colors.page-white}"
    rounded: "{rounded.circle}"
    size: "40px"
  button-primary:
    backgroundColor: "{colors.accent-blue}"
    textColor: "{colors.page-white}"
    rounded: "{rounded.md}"
    padding: "15px 26px"
    height: "48px"
  button-next:
    backgroundColor: "{colors.accent-blue}"
    textColor: "{colors.page-white}"
    rounded: "{rounded.md}"
    padding: "12px 22px"
    height: "48px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.accent-blue}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
    height: "48px"
  button-danger-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
    height: "48px"
  option:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.brand-navy}"
    typography: "option"
    rounded: "{rounded.md}"
    padding: "16px 18px"
    height: "52px"
  option-hover:
    backgroundColor: "{colors.field}"
  option-active:
    backgroundColor: "{colors.field-hover}"
  option-selected:
    backgroundColor: "{colors.selected-fill}"
    textColor: "{colors.brand-navy}"
  option-mark:
    backgroundColor: "{colors.page-white}"
    rounded: "{rounded.circle}"
    size: "24px"
  option-mark-selected:
    backgroundColor: "{colors.accent-blue}"
    textColor: "{colors.page-white}"
    size: "24px"
  input:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.sm}"
    padding: "12px"
    height: "48px"
  panel-soft:
    backgroundColor: "{colors.band-top}"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.md}"
    padding: "18px 20px"
  panel-white:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.md}"
    padding: "18px"
  result-card-exempt:
    backgroundColor: "{colors.exempt-fill}"
    textColor: "{colors.exempt-ink}"
    rounded: "{rounded.md}"
    padding: "20px 22px"
  result-card-caution:
    backgroundColor: "{colors.caution-fill}"
    textColor: "{colors.caution-ink}"
    rounded: "{rounded.md}"
    padding: "20px 22px"
  result-card-info:
    backgroundColor: "{colors.band-top}"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.md}"
    padding: "20px 22px"
  hint-panel:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.brand-navy}"
    rounded: "{rounded.lg}"
    padding: "12px 14px"
  shell-entry:
    backgroundColor: "{colors.shell-card}"
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.xl}"
    padding: "18px"
  shell-badge:
    backgroundColor: "{colors.shell-tag}"
    textColor: "{colors.shell-pine}"
    rounded: "{rounded.md}"
    size: "40px"
  shell-theme-toggle:
    backgroundColor: "{colors.shell-card}"
    textColor: "{colors.shell-house-blue}"
    rounded: "{rounded.circle}"
    size: "44px"
---

# Design System: Marlie's MLRI Work

## Overview

**Creative North Star: "The Kitchen Table Form"**

The shipped screener is a public-benefits form that has to survive being read on a
borrowed phone, in a hurry, by someone whose SNAP is already at risk. Everything in the
system serves that: one legibility-first typeface at 16.5px body copy, 48px minimum
controls, a white page with tinted controls so nothing depends on a subtle fill, and a
measured contrast ratio behind every boundary value. Nothing here is styled for effect.
Where a decorative choice and a legibility choice conflicted, legibility won and the
comment in the code says so.

There are two live territories and they do not mix. The screener at
`masslegalhelp/index.html` wears MassLegalHelp's chrome: navy header bar, a 9px gold rule
under it, one brand navy carrying both headings and body copy, and their pale blue
page-title band with a solid block offset behind it. The chrome tokens are theirs, read
off masslegalhelp.org and recorded with measured ratios in `MASSLEGALHELP-BRAND.md`, which
is authoritative for those values and for what we deliberately do not copy. The preview
site (root `index.html`, `screener/index.html`, `screener/how-it-works.html`) is the second
territory and is deliberately unlike the first: warm paper, a Fraunces display face,
pine and house-blue accents, and a full dark mode. It is a reviewer's index, not a host
site, so it gets to have its own voice.

The Court Forms Online palette (court navy `#0a2b52`, action blue `#1a5fb4`, torch gold
`#f4bd3f`) is retired. It survives only in `archive/`, frozen and untested, and is not
available to new work. What did survive the rebrand is the control layer underneath the
chrome: the page stayed white and only the chrome moved, so the field, boundary, and mark
tokens carried over unchanged and with their ratios intact.

**Key Characteristics:**
- One typeface, Atkinson Hyperlegible, chosen for low-vision readers rather than style
- White page, tinted controls; separation comes from the control, never from the page
- Every boundary and text value has a computed contrast ratio behind it
- Host chrome reproduced faithfully, including its offset title band, but never its fonts
- A warm paper shell with dark mode, kept strictly off the screener

## Colors

Institutional navy and blue on white for the tool, warm paper and pine for the shell, with
a small status vocabulary of fill, border, and ink triplets.

### Primary
- **Accent Blue** (`#0057a2`): every actionable thing on the screener. Primary and Next
  buttons, ghost button strokes, link text, the byline mark, the progress fill, the filled
  radio and checkbox mark, and the selected option border. 7.28:1 on white, so it is also
  the only accent allowed to carry meaning.
- **Brand Navy** (`#1f2c5c`): MassLegalHelp sets headings and body copy in one navy and so
  do we. 13.35:1 on white. Also the footer band and the hover color for links.
- **Header Navy** (`#1e2e5f`): the top bar and the footer field only. Slightly lighter
  than brand navy; it is a surface color, not a text color.
- **Strip Navy** (`#0c1639`): the darker strip below the footer carrying the credit line.

### Secondary
- **Rule Gold** (`#eab736`): the 9px rule under the header bar. The strongest single cue
  that a page belongs to MassLegalHelp.
- **Pill Gold** (`#e8da8d`): their pale Legal Topics gold. Here it is the footer's top rule
  and the focus ring inside the navy bar, where a dark blue ring would vanish.

### Tertiary
- **Pale Blue** (`#d3e7ff`): the top of the title-band gradient, and the fill of every
  soft information panel and help callout. 10.58:1 under brand navy text.
- **Band Bottom** (`#fafcff`) and **Band Edge** (`#a2c4f0`): the bottom of that gradient
  and the solid block offset behind the panel.
- **Rule Ink** (`#192a65`): the short heavy rule under the byline, darker than body navy.

### Neutral
- **Field** (`#eef1f5`), **Field Hover** (`#e3e8f0`), **Selected Fill** (`#d7e6f9`): the
  tint layer on controls. An option is white at rest, field on hover, field-hover while
  pressed, selected-fill once chosen.
- **Boundary** (`#84909f`): the border of anything clickable. 3.25:1 on white, which is
  what WCAG 1.4.11 requires of a component boundary. Hover deepens it to `#5b6675`.
- **Boundary Strong** (`#767f8c`): radio and checkbox mark borders and input strokes.
  3.58:1 on the tinted fill.
- **Panel Line** (`#c8d2e0`): the border of a non-interactive panel, fieldset, or
  disclosure. Lighter than a control border on purpose: it bounds, it does not invite.
- **Muted Ink** (`#5b6470`) at 6:1 for captions and quiet controls, **Placeholder Ink**
  (`#6b7280`) at 4.83:1, **Progress Track** (`#dbe3ef`) behind the accent fill.

### Status
- **Exempt** (fill `#e6f4ec`, tint `#eef7f1`, border `#cbe4d5`, ink `#14532d`, strong
  `#166534`): a good outcome. **Approval Green** `#1e7a45` fills the numbered and checked
  markers inside those cards.
- **Caution** (fill `#fbf1dc`, tint `#fff8e8`, border `#ecd9a8`, ink `#7a4a00`): not
  exempt, skipped questions, and the sample-result banner.
- **Info** (border `#c7d6f0` over pale blue): a neutral outcome such as the out-of-age-range
  result.
- **Danger** (`#a12b2b`, border `#c58484` at 3:1): the delete-my-answers control, and
  nothing else.

### Shell
- **Paper** (`#fbf8f1`) and **Card** (`#fffef9`) with **Shell Ink** (`#221f1a`) and
  **Shell Muted** (`#6b6255`).
- **Edge** (`#9e8e66`) bounds a whole surface at 3.04:1 on paper. **Rule** (`#e4ddcd`) is
  the hairline *inside* one, where a 3:1 line would fight the paper. Two weights, two jobs.
- **Pine** (`#3a5a40`) is the shell accent, **House Blue** (`#3d5a80`) is navigation and
  focus, **Terracotta** (`#a85a32`) marks the archived designs, **Tag** (`#eef1e9`) fills
  the badge. Dark mode swaps every one of them at `:root[data-theme="dark"]` and again
  under `prefers-color-scheme: dark`.

### Named Rules
**The Tinted Control Rule.** The page is white and the controls are tinted. Never invert
it. An option reverted to a white fill disappears on a white page, and any two pale tints
sit near 1.05:1 against each other, so fill can never carry a selected state on its own.
Selection is carried by the accent border plus the filled mark; the fill only agrees.

**The Two Golds Rule.** There are two golds because MassLegalHelp has two: `#eab736` is
the saturated rule under the header and `#e8da8d` is their pale Legal Topics tone. Both are
decorative and both fail contrast on white. Neither may carry meaning anywhere off the
navy bar: no gold focus ring, selected state, or error indicator on the white page. Use
accent blue at 7.28:1 for those.

**The Measured Ratio Rule.** Every boundary, mark, and text color here has a computed
ratio behind it, in `CLAUDE.md` for the controls and `MASSLEGALHELP-BRAND.md` for the
chrome. Compute the new ratio before changing one. `#d3d9e2` was tried for option borders
and failed at 1.42:1.

**The Two Territories Rule.** The screener's chrome and the preview site's paper never
mix. No Fraunces, pine, or paper on the screener; no navy chrome or gold rule on the
preview pages. A page belongs to one territory and reads entirely as that one.

## Typography

**Display Font:** Fraunces 600 (with Georgia, serif), preview site only
**Body Font:** Atkinson Hyperlegible 400/700 (with system-ui, -apple-system, sans-serif)
**Label/Mono Font:** ui-monospace stack, one small use on the preview site

**Character:** The screener is single-face by design: Atkinson Hyperlegible everywhere, with
weight and size doing all the hierarchy work. Its disambiguated letterforms are the point,
not its personality. The preview site adds Fraunces for headings, a high-contrast serif that
gives the index a hand-set editorial feel the tool is not allowed to have.

### Hierarchy
- **Display** (Fraunces 600, `clamp(26px, 6vw, 32px)`, 1.15, -0.02em): preview-site page
  titles only.
- **Headline** (700, `clamp(24px, 6vw, 29px)`, 1.2, -0.01em): the screener's `h1`, inside
  the title band.
- **Title** (700, `clamp(21px, 5.5vw, 25px)`, 1.25): section headings. Result headings run
  slightly larger at `clamp(21px, 5.5vw, 26px)`.
- **Question** (700, `clamp(18px, 4.6vw, 21px)`, 1.3): a single screening question. Smaller
  than a section title because a question is a prompt, not a chapter.
- **Body** (400, 16.5px, 1.6): screener prose, in brand navy, in a 660px column. Secondary
  and in-panel prose drops to 15px at the same 1.6.
- **Option** (700, 16.5px, 1.35): the answer tiles. Bold, because the tile is the decision.
- **Label** (700, 14.5px) and **Caption** (700, 13px): field labels, progress text, and
  print notes. Both bold; small type here is quiet by size, never by weight.

### Named Rules
**The Legibility-First Rule.** Atkinson Hyperlegible is not a style choice and does not
lose an argument to a host font. MassLegalHelp sets body copy in Montserrat and headings in
Domine; we match their color and their layout and keep our typeface. Revisit only with a
self-hosted `domine-700.woff2` in hand, and only for headings.

**The Weight-Not-Size Rule.** The screener's steps are close together (16.5px body, 18-21px
question, 21-25px section) and separation comes from weight, color, and space. Do not open
the ramp with a larger display size; a form is not an article.

**The 16px Input Floor.** Every `input`, `textarea`, and `select` is at least 16px, because
anything smaller triggers iOS zoom on focus and throws the reader out of the form.

## Layout

The screener is one centered column: `#stage` at `max-width:660px`, padded 22px top and
60px bottom, with horizontal padding written as `max(16px, env(safe-area-inset-*))` so it
clears a notch. The footer's inner block repeats the same 660px measure so the page reads
as one column top to bottom. The preview site uses a narrower 560px `.wrap` with 40px of
top padding.

Spacing runs on a coarse rhythm of 8, 10, 14, 18, 22, and 28px. Panels are padded 18px to
22px, option tiles 16px by 18px, and the vertical gap between blocks is usually 22px. The
gaps are not a strict multiple-of-4 scale; the values sit where they landed and 13px gaps
inside flex rows are common.

One breakpoint carries the responsive work: 640px. Below it the header subtitle hides, stage
padding tightens to 16px and 14px, the two-column `.form-row` collapses to one, option type
drops to 16px with 15px by 14px padding, nav buttons stretch to fill, and the title band's
offset block shortens from 8px to 5px. A second axis matters more than width: at
`(hover:none)` or `(pointer:coarse)` the help tip stops being a floating popover and becomes
an inline accordion, and at `(hover:hover) and (min-width:641px) and (pointer:fine)` it
becomes a fixed-position panel that flips above the trigger when it would overflow.

Touch targets are 44px minimum for secondary controls and 48px for buttons and inputs;
option tiles are 52px. Where a 44px minimum would add dead air, the build absorbs it with
matching negative margins rather than shrinking the target.

## Elevation & Depth

Depth is mostly not shadow. On the screener, surfaces are separated by fill and border:
white panels with a `#c8d2e0` line, pale blue panels with no border at all, status cards
with a colored header band over a white body. Only three shadows exist, and two of them are
hard-edged with zero blur.

### Shadow Vocabulary
- **Offset block** (`box-shadow: 8px 8px 0 0 #a2c4f0`, 5px on phones): the solid block
  behind the title band. This is a reproduction of MassLegalHelp's own article-page chrome,
  where it is an absolutely positioned `::after` inset 8px. A shadow is used instead because
  a pseudo-element would need `z-index:-1` and `.band` creates no stacking context, and
  because a shadow never affects layout and so cannot push a horizontal scrollbar onto a
  narrow screen.
- **Press edge** (`box-shadow: 0 2px 0 #1f2c5c`): under Primary and Next buttons. A hard
  bottom edge, read as a button with a physical bottom rather than a floating card.
- **Selection halo** (`box-shadow: inset 0 0 0 1px #0057a2, 0 0 0 3px rgba(26,95,180,.16)`):
  a selected option. The inset optically thickens the accent border; the outer ring stays
  translucent so it reads as a ring and not a glow.
- **Floating panel** (`box-shadow: 0 8px 24px rgba(16,32,56,.12)`): the desktop help
  popover, the only element that genuinely floats over content. Neutral and offset, never
  chromatic. Removed entirely in the coarse-pointer accordion form.
- **Shell hover lift** (`box-shadow: 0 8px 22px -14px var(--lift)`, and
  `0 6px 16px -10px var(--lift-house)` on the theme toggle): preview-site cards on hover,
  paired with a 2px translate. Tinted pine in light mode, plain black in dark, because a
  tinted glow on a near-black card reads as haze instead of depth.

### Named Rules
**The Hard Edge Rule.** Offset depth on the screener has zero blur and a real color:
`8px 8px 0` behind the band, `0 2px 0` under a button. Blur belongs only to something that
actually floats, which here is one help popover.

**The Motion-Is-Optional Rule.** The only entrance is a 0.3s opacity fade, never a
translate, so nothing shifts under a reader mid-sentence. The progress bar animates
`transform: scaleX()` to stay off the layout path. `prefers-reduced-motion: reduce` zeroes
card entrances, tile transitions, and hover lifts rather than shortening them.

## Shapes

One rounding family, moderate and consistent. The screener's `--radius:10px` is the default
for buttons, option tiles, panels, and status cards. Inputs use `calc(var(--radius) - 3px)`
so a field reads slightly tighter than the panel holding it, and the help popover uses
`calc(var(--radius) + 2px)`. Focus rings round to 4px, checkbox marks to 6px, radio marks
and the byline mark to a full circle, and the Quick exit pill to 999px. The preview site is
softer at 14px for cards and panels, 10px for badges.

Borders do the structural work: 2px on anything clickable, 1.5px on an input, 1px on a
panel. A status card is a 1px colored ring around a colored header band and a white body,
with `overflow:hidden` so the band's corners follow the card. There are no cut corners, no
clipping, and no decorative dividers apart from the byline rule.

## Components

### Buttons
- **Shape:** moderately rounded (10px), never a pill except the Quick exit control
- **Primary:** accent blue fill, white 700 text at 17px, 15px by 26px padding, 48px minimum
  height, with the hard `0 2px 0` brand-navy press edge. Next is the same at 16px and 12px
  by 22px.
- **Ghost:** transparent with a 2px accent-blue border and accent-blue 700 text at 15px, 10px
  by 18px. Used for Back and for secondary actions on a result screen.
- **Danger ghost:** same geometry with `#a12b2b` text and a `#c58484` border at 3:1. Only
  the delete-answers control uses it.
- **Link button:** an inline `button` styled as underlined bold accent-blue text at inherited
  size, for actions that live inside a sentence.
- **Quick exit:** white pill on the navy bar, navy 700 text at 13px, 44px tall.
- **Focus:** a 3px brand-navy ring offset 2px everywhere, switching to pill gold inside the
  navy top bar where a dark ring would disappear.

### Option Tiles
- **Style:** a full-width row, 52px minimum, 2px `#84909f` border, white fill, bold 16.5px
  navy label, with a 24px mark on the left. The mark is a circle for single-answer questions
  and a 6px-rounded square for multi-select, so the shape says whether one or several
  answers are possible before anything is read.
- **States:** hover deepens the border to `#5b6675` and fills with `#eef1f5`; active goes
  `#e3e8f0`; selected takes the accent border, the `#d7e6f9` fill, the selection halo, and a
  mark filled solid accent blue with a white dot or check inside.
- **Transitions:** 0.15s ease on background, border-color, and box-shadow; none under
  reduced motion.

### Cards and Panels
- **Result card:** a 10px `overflow:hidden` container with a 1px status border, a status-fill
  header band padded 20px by 22px carrying the heading, and a white body padded the same.
  Exempt is green, not-exempt is ochre, neutral outcomes are pale blue with `#c7d6f0`.
- **Soft panel:** pale blue, 10px, 18px by 20px padding, no border. For supporting
  information next to a result. A help callout is the same with a 4px accent-blue left bar.
- **White panel:** white with a 1px `#c8d2e0` border and 18px padding, for the question card,
  the printable form, and disclosures.
- **Internal padding:** 18px to 22px; never below 15px on a phone.

### Inputs
- **Style:** white fill, 1.5px `#767f8c` stroke, 7px radius, 12px padding, 16px text, 48px
  minimum height, full width. Labels are bold 14px to 14.5px directly above.
- **Focus:** the global 3px brand-navy ring offset 2px. No border-color-only focus anywhere.
- **Signature pad:** a canvas in the same stroke and radius, with placeholder-ink hint text
  centered inside and a small ghost Clear button beside it.

### Navigation
- **Top bar:** header navy, white, space-between, 12px padding, carrying a bold 17px title
  and a 12px subtitle that hides below 640px, with the Quick exit pill at the right and a
  9px gold rule along the bottom.
- **Footer:** a pill-gold 4px rule, a brand-navy band with the same 660px measure holding the
  disclaimer and three white underlined links, then a strip-navy bar with the credit line.
- **Progress:** a 6px track in `#dbe3ef` with an accent-blue fill, built once and updated in
  place so its live region actually announces, with a bold 13px muted "Section n of n" label
  under it.

### The Page-Header Pattern
The signature component, and the one intended for reuse. Four things in order: a pale blue
gradient panel (`linear-gradient(#d3e7ff, #fafcff)`) holding the `h1`, padded 30px 26px 22px,
with the solid `#a2c4f0` block offset 8px down and right behind it; a byline of a 40px
accent-blue circle with an inline document glyph beside "By" and the organisation name; a
146px by 5px `#192a65` rule; then body copy. It is implemented as reusable classes
(`.band`, `.byline`, `.byline-mark`, `.byline-rule`), not inline styles, because the intent
is a template for every screener MLRI puts on the site rather than one page's styling.

**The Page-Header Rule.** A new MLRI screener opens with the band, the byline, and the rule,
in that order, before any prose. Nothing else goes inside the band except the `h1`.

### Shell Cards (preview site)
A `.entry` is a 14px card in `#fffef9` on paper with a 1px `#9e8e66` edge, a 40px tag-filled
Fraunces badge at the left, a bold 17px title, muted 15px prose, and a "Go" link whose arrow
slides 4px on hover. Hover lifts the card 2px, shifts the border to the accent, and adds the
tinted lift shadow. A secondary group is one `.panel` card with `#e4ddcd` hairline-divided
rows instead of more cards. Archive entries override the accent to terracotta.

## Do's and Don'ts

### Do:
- **Do** keep the page white and tint the control. Option fill `#eef1f5`, hover `#e3e8f0`,
  selected `#d7e6f9`, and a `#84909f` boundary at 3.25:1 around anything clickable.
- **Do** carry a selected state with the accent border plus the filled mark. Two pale tints
  sit near 1.05:1, so fill alone communicates nothing.
- **Do** compute the contrast ratio before changing any boundary, mark, or text value, and
  record it next to the token the way the existing ones are recorded.
- **Do** open a new screener with the page-header pattern: band, byline, 146px rule.
- **Do** set every interactive target at 48px, or 44px for a secondary control, and every
  text input at 16px or larger.
- **Do** reproduce the host chrome exactly where it is reproduced at all: header navy, the
  9px gold rule, one navy for headings and body, and their pale blue band.
- **Do** keep both territories whole. Fraunces, paper, and pine belong to the preview site;
  navy chrome and the gold rule belong to the screener.

### Don't:
- **Don't** let gold carry meaning anywhere off the navy bar. `#eab736` is 1.41:1 class
  decoration on white; a gold focus ring, selected state, or error mark fails outright.
- **Don't** revive the Court Forms Online palette. It is archived, frozen, and untested, and
  a new surface inheriting court navy or torch gold would be inheriting a retired identity.
- **Don't** substitute a second typeface on the screener for hierarchy. Use weight, size, and
  space; Atkinson Hyperlegible carries the whole ramp.
- **Don't** animate a translate or a height on an entrance. Opacity only, `scaleX` for
  progress, and everything zeroed under `prefers-reduced-motion`.
- **Don't** blur a shadow that is standing in for a solid offset block. `8px 8px 0` and
  `0 2px 0` are hard on purpose.
- **Don't** use a class in markup with no CSS rule behind it. `scripts/check-pages.js` fails
  the build on it, and the guard only works while the page's own `<style>` block owns its
  classes.
- **Don't** ship a control that is drawn but not wired. Print, Share, and Listen exist on the
  host site and are deliberately absent here for exactly that reason.
