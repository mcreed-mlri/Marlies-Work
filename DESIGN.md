---
name: Marlie's MLRI Work
description: Two visual territories: an inherited Court Forms Online tool chrome, and a warm paper shell that indexes the prototypes.
colors:
  court-navy: "#0a2b52"
  action-blue: "#1a5fb4"
  action-blue-deep: "#124a8f"
  link-blue: "#134a8e"
  torch-gold: "#f4bd3f"
  approval-green: "#1e7a45"
  caution-ochre: "#9a6a00"
  page-white: "#ffffff"
  ink-warm: "#1b1f27"
  ink-cool: "#16202e"
  prose-ink: "#3a424e"
  lead-ink: "#37414f"
  muted-ink: "#5b6675"
  boundary: "#84909f"
  boundary-strong: "#767f8c"
  panel-line: "#c8d2e0"
  field: "#eef1f5"
  field-hover: "#e3e8f0"
  selected-fill: "#d7e6f9"
  soft-blue: "#e8f0fb"
  soft-blue-cool: "#eaf1fb"
  exempt-fill: "#e6f4ec"
  exempt-line: "#cbe4d5"
  exempt-ink: "#14532d"
  notexempt-fill: "#fbf1dc"
  notexempt-line: "#ecd9a8"
  notexempt-ink: "#7a4a00"
  progress-track: "#dbe3ef"
  bar-link: "#cfe0f5"
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
  kicker:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.14em"
  shell-entry-title:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  shell-foot-title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  shell-tool-title:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.3
  tag-label:
    fontFamily: "Atkinson Hyperlegible, system-ui, -apple-system, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.06em"
rounded:
  focus: "3px"
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
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.page-white}"
    rounded: "{rounded.md}"
    padding: "15px 26px"
    height: "48px"
  button-next:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.page-white}"
    rounded: "{rounded.md}"
    padding: "12px 22px"
    height: "48px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.action-blue}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
    height: "48px"
  button-exit:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.court-navy}"
    rounded: "{rounded.pill}"
    padding: "10px 14px"
    height: "44px"
  option:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.ink-warm}"
    typography: "option"
    rounded: "{rounded.md}"
    padding: "16px 18px"
    height: "52px"
  option-hover:
    backgroundColor: "{colors.field}"
  option-selected:
    backgroundColor: "{colors.selected-fill}"
    textColor: "{colors.ink-warm}"
  option-mark:
    backgroundColor: "{colors.page-white}"
    rounded: "{rounded.circle}"
    size: "24px"
  option-mark-selected:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.page-white}"
    size: "24px"
  input:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.ink-warm}"
    rounded: "{rounded.sm}"
    padding: "12px"
    height: "48px"
  topbar:
    backgroundColor: "{colors.court-navy}"
    textColor: "{colors.page-white}"
    padding: "12px 16px"
  result-card-exempt:
    backgroundColor: "{colors.exempt-fill}"
    textColor: "{colors.exempt-ink}"
    rounded: "{rounded.md}"
    padding: "20px 22px"
  result-card-notexempt:
    backgroundColor: "{colors.notexempt-fill}"
    textColor: "{colors.notexempt-ink}"
    rounded: "{rounded.md}"
    padding: "20px 22px"
  result-card-info:
    backgroundColor: "{colors.soft-blue}"
    textColor: "{colors.action-blue-deep}"
    rounded: "{rounded.md}"
    padding: "20px 22px"
  panel-soft:
    backgroundColor: "{colors.soft-blue}"
    rounded: "{rounded.md}"
    padding: "18px 20px"
  nav-row:
    backgroundColor: "{colors.page-white}"
    textColor: "{colors.ink-cool}"
    rounded: "{rounded.xl}"
    padding: "19px 20px"
  shell-entry:
    backgroundColor: "{colors.shell-card}"
    textColor: "{colors.shell-ink}"
    rounded: "{rounded.xl}"
    padding: "18px"
---

# Design System: Marlie's MLRI Work

## Overview

**Creative North Star: "The Kitchen Table Form"**

Someone got a notice from DTA saying they might lose their food benefits. They are reading
it on a phone, possibly at a kitchen table, possibly with a friend or an advocate beside
them. The design's job is to sit in that chair patiently: one question at a time, in words
that do not assume they already understand the rules, in controls large enough to hit
without care. Nothing hurries them and nothing implies they should have known this already.

The tone that carries it is steady, trustworthy, and official. The screener borrows the
authority of a real state-facing website on purpose, because a person deciding whether to
trust a result about their benefits needs the page to look like it comes from an institution
that will honor what it says. Warmth lives in the sentence lengths and the spacing, not in
decoration.

This project holds **two visual territories, and they are not meant to converge.**
The `court-forms/` territory is a deliberate copy of the live Court Forms Online design
system, adopted so a finished tool can be dropped into production without a redesign. It is
inherited, not invented. The root shell (`index.html`) is Marlie's own style: warm paper, a
serif display face, dark mode. It indexes the prototypes for colleagues and has no reason to
look like Court Forms. Neither territory borrows from the other.

**Key Characteristics:**
- One typeface across every tool screen, chosen for legibility rather than for style
- A white page with tinted controls, never a tinted page with white controls
- Flat by default: borders carry structure, and the only shadow at rest is a 2px press edge
- 44px to 52px minimum targets, and no input below 16px
- Color is a status vocabulary (green exempt, ochre not exempt, blue informational), never decoration
- Every contrast value in the system has a measured ratio behind it

## Colors

Two palettes, held apart on purpose. The Court Forms territory is cool, institutional, and
inherited; the shell territory is warm, papery, and personal.

### Primary

- **Court Navy** (`#0a2b52`): The top bar of every `court-forms/` page, the torch mark's
  field, focus rings on the white page, and link hover. It is the color that says "this is a
  government-facing tool" before a single word is read.
- **Action Blue** (`#1a5fb4`): Every primary action and selected state in the ABAWD screener.
  It fills the Continue and Start buttons, draws the selected option border, fills the
  radio and checkbox mark, and advances the progress bar. **Action Blue Deep** (`#124a8f`)
  is its darker partner: the 2px press edge under primary buttons, the focus ring, and link
  hover inside the tool.
- **Link Blue** (`#134a8e`): The same role on the hub, the how-it-works page, and the v2
  redesign, which declare their accent one step deeper than the screener does. Do not
  cross-wire the two; each page's `:root` is the authority for that page.

### Secondary

- **Torch Gold** (`#f4bd3f`): The Court Forms torch glyph, and the focus ring on the navy
  bar where a navy or blue ring would vanish. It is chrome and focus only.

### Tertiary

- **Approval Green** (`#1e7a45`): Exemption results and the checkmark badges that list the
  reasons someone qualifies. Its role is "good news, and here is what to do next."
- **Caution Ochre** (`#9a6a00`): The "may need to meet the work rules" outcome and its hub
  entry. It carries caution without the alarm of red, because that outcome is not a denial.

### Neutral

- **Page White** (`#ffffff`): Every `court-forms/` page background, matching production.
- **Ink Warm** (`#1b1f27`) and **Ink Cool** (`#16202e`): Body text. The two screener
  variants use the warm value; the hub, the explainer, and the v2 redesign use the cool one.
- **Prose Ink** (`#3a424e`) and **Lead Ink** (`#37414f`): Long-form paragraph and lead text,
  a half step down from full ink so a wall of explanation reads softer without losing AA.
- **Muted Ink** (`#5b6675`): Section labels, quiet notes, progress captions.
- **Boundary** (`#84909f`): The border of anything clickable: option tiles, nav rows, cards.
  Measured at 3.25:1 on white, so it satisfies WCAG 1.4.11 as a component boundary.
- **Boundary Strong** (`#767f8c`): Radio and checkbox mark borders and input strokes,
  3.58:1 on the tinted fill.
- **Panel Line** (`#c8d2e0`): Non-interactive panel and disclosure borders.
- **Field** (`#eef1f5`), **Field Hover** (`#e3e8f0`), **Selected Fill** (`#d7e6f9`): The
  control tints that create separation on a white page.
- **Soft Blue** (`#e8f0fb`) and **Soft Blue Cool** (`#eaf1fb`): Informational panel fills.
- **Progress Track** (`#dbe3ef`) and **Bar Link** (`#cfe0f5`): The unfilled progress
  channel, and link text on the navy bar where page-level blue is illegible.

### Shell territory (root `index.html`, not Court Forms)

- **Shell Paper** (`#fbf8f1`) on **Shell Card** (`#fffef9`): a warm off-white stack that
  reads as paper rather than as screen.
- **Shell Edge** (`#9e8e66`, `#706755` dark) and **Shell Rule** (`#e4ddcd`, `#332e24` dark):
  two boundary weights doing two jobs. Shell Edge bounds a whole surface (project card,
  footer panel, contact button, theme toggle) and is measured at 3.04:1 on paper and 3.19:1
  on card, so the shell holds the same 3:1 boundary rule as the tools. Shell Rule stays the
  hairline *inside* a card, dividing one LACE tool from the next, where a 3:1 line would
  fight the paper.
- **Shell Pine** (`#3a5a40`): the shell's accent and PWA theme color.
  **Shell House Blue** (`#3d5a80`) carries kickers and focus.
  **Shell Terracotta** (`#a85a32`) is scoped to the Court Forms entry card as its accent.
- Dark mode swaps the whole set (`#17150f` paper, `#ece7db` ink, `#93b899` pine,
  `#9ab7d6` house blue, `#dc9163` terracotta) under both `prefers-color-scheme` and an
  explicit `data-theme` attribute.

### Named Rules

**The Borrowed Chrome Rule.** The `court-forms/` palette is copied from a live production
site. Court Navy, Torch Gold, and the blues are not available for restyling; changing one is
a compatibility decision about dropping into production, never a taste decision.

**The Tinted Control Rule.** The page is white and the controls are tinted. Never invert it.
An option reverted to a white fill disappears on a white page, and two pale tints sit near
1.05:1 against each other, so fill alone can never carry a selected state. Selection is
carried by the accent border plus the filled mark.

**The Measured Ratio Rule.** Every boundary, mark, and text color in this system has a
computed contrast ratio behind it, recorded in CLAUDE.md. Before changing any of them,
compute the new ratio. `#d3d9e2` was tried for option borders once and failed at 1.42:1.

**The One Gold Rule.** Torch Gold appears twice: the torch glyph and the focus ring on the
navy bar. It is never a fill, never a status color, and never decoration.

**The Two Territories Rule.** The shell's warm paper palette and the tool's institutional
palette never mix. No Fraunces in `court-forms/`, no navy chrome on the homepage.

## Typography

**Display Font:** Fraunces (with Georgia, serif), root shell only
**Body Font:** Atkinson Hyperlegible (with system-ui, -apple-system, sans-serif)
**Label/Mono Font:** `ui-monospace` stack, used only for the shell's kicker

**Character:** Atkinson Hyperlegible was designed by the Braille Institute to make letterforms
maximally distinguishable for low-vision readers, and it is here for that reason and not for
its look. On the tool screens it works alone, at 700 for anything a person must act on and
400 for prose. The shell allows itself one indulgence: Fraunces at 600 for the page title,
which is why the two territories read as different voices at a glance.

### Hierarchy

- **Display** (600, `clamp(26px, 6vw, 32px)`, 1.15, -0.02em): Fraunces. The homepage title
  and the footer heading. Never appears in `court-forms/`.
- **Headline** (700, `clamp(24px, 6vw, 29px)`, 1.2, -0.01em): the `.h1` on a screener
  screen. One per screen, and it is the question or the result, not the product name.
- **Title** (700, `clamp(21px, 5.5vw, 25px)`, 1.25, -0.01em): `.h2` and `.h-result`, the
  result heading inside its colored card header.
- **Body** (400, 16.5px, 1.6): screener prose. Long explanation drops to Prose Ink.
- **Body Small** (400, 15px to 15.5px, 1.6 to 1.7): nested lists, panel copy, footnotes.
- **Option** (700, 16.5px, 1.35): the answer tiles. Bold because the tile is the control,
  and its label is the thing being chosen.
- **Label** (700, 14.5px, 1.35): field labels above each write-in blank.
- **Kicker** (400, 12px, 0.14em, uppercase): shell only, monospace, above the page title.

### Named Rules

**The One Face Rule.** Atkinson Hyperlegible carries every tool screen alone. A display
pairing would work against the reason the face was chosen, and the source files carry an
explicit `impeccable-disable single-font` comment recording that decision. Do not "fix" it.

**The No-Zoom Rule.** No `input`, `textarea`, or `select` goes below 16px. iOS Safari zooms
the viewport on focus below that, which throws a person out of their place in the form.

**The Bold-Means-Actionable Rule.** In the tools, 700 marks something to act on or a result:
buttons, option labels, field labels, headings. Emphasis inside prose uses `<strong>`
sparingly, on the words that change what a person should do.

## Layout

A single centered column, one thing at a time, no sidebars and no multi-column reading. The
stage caps differ by surface and are deliberate: 660px for the ABAWD screener, 680px for the
hub and the explainer, 760px for the v2 redesign, 560px for the shell index. The navy top bar
spans full width with its own 1200px inner cap, so the chrome reads as site-wide while the
content stays at reading measure.

Horizontal padding is always `max(16px, env(safe-area-inset-*))`, dropping to 14px under
640px, so content clears notches and rounded corners on a phone. Vertical rhythm runs on
roughly 8 / 10 / 14 / 18 / 22 / 28px, with 40px to 44px between major sections on the hub.

Prose measure is capped where the container is wide enough to overrun it: the v2 result body
holds `max-width: 68ch` because a 760px card at 17px ran about 83 characters per line.

Responsive behavior is one breakpoint doing most of the work at 640px: the top bar subtitle
hides, two-column form rows collapse to one, option padding tightens, and every navigation
button becomes full width and center-aligned so it is thumb-reachable. A second breakpoint at
380px stacks the v2 Yes/No pair vertically. Pointer and hover queries, not width, decide
whether help text is a popover or an inline accordion.

### Named Rules

**The One Question Rule.** A screener page asks one grouped thing and shows its own Back and
Continue. Do not consolidate sections onto a single scrolling page to save clicks.

**The Thumb Rule.** Below 640px, every action a person must take is full width or at least
140px wide, minimum 44px tall, and center-aligned.

## Elevation & Depth

This system is flat. There are no ambient shadows on any page at rest, and no glass, gradient,
or blur anywhere. Depth comes from three sources: a border, a tinted fill, and the navy bar
sitting above a white page. A card is a 1px `#c8d2e0` outline, not a lift.

The one shadow that appears at rest is not a shadow in spirit. Primary buttons carry
`0 2px 0` in their own darker blue, a hard bottom edge with no blur and no offset spread. It
reads as a physical press edge on a sturdy button, which is why it survives the flat rule.

### Shadow Vocabulary

- **Press edge** (`box-shadow: 0 2px 0 var(--accent-dark)`): Primary and Next buttons only.
  The v2 page uses Court Navy for the same edge under Link Blue buttons.
- **Selection halo** (`box-shadow: inset 0 0 0 1px var(--accent), 0 0 0 3px rgba(26,95,180,.16)`):
  A selected option tile. The inset thickens the accent border optically while the outer ring
  stays translucent, so it never reads as a glow. v2 uses a 4px ring at `rgba(19,74,142,.16)`.
- **Floating panel** (`box-shadow: 0 8px 24px rgba(16,32,56,.12)`): Only the desktop help
  popover, which genuinely floats over content. It is neutral and offset, never a colored
  halo, and it is removed entirely in the coarse-pointer accordion form.
- **Shell hover lift** (`0 8px 22px -14px var(--lift)`): Root shell cards on hover, paired
  with a 2px translate. The color is a token, not a literal: pine-tinted
  (`rgba(58,90,64,.45)`) in light, and plain `rgba(0,0,0,.6)` in dark, because a tinted glow
  on a near-black card reads as haze instead of depth. `--lift-house` is the same idea in
  house blue for the toggle and the contact buttons. Does not exist in `court-forms/`, where
  rows lift 1px with a border color change and no shadow.

### Named Rules

**The Flat-At-Rest Rule.** Nothing on a `court-forms/` page casts a shadow at rest except a
button's press edge. If a new element needs to separate from the page, give it a border or a
tinted fill.

## Shapes

Rounded but not soft. The base radius is 10px, held in `--radius`, and the derivations are
computed from it rather than picked: inputs and signature panels use `calc(var(--radius) - 3px)`
(7px), and the help popover uses `calc(var(--radius) + 2px)` (12px) so it reads as sitting one
layer above. Nav rows and shell cards go to 14px; the v2 redesign runs looser at 12px buttons,
14px to 16px tiles, and 20px cards.

Full circles are reserved for two jobs: the radio marks and the icon badges. Checkbox marks
are the same 24px square with a 6px radius, so shape alone tells a person whether they can
choose more than one answer. The pill radius (`999px`) appears exactly once, on the top-bar
exit control, which is why it reads as chrome rather than as page content.

Borders carry weight as meaning: 1px for a non-interactive panel, 1.5px for an input,
2px for a clickable option tile, and 2.5px to 3px on the v2 tiles where the target is larger.

The shell territory runs on two radii and nothing else: 14px for a surface (project card,
footer panel) and 10px for a control or a badge. The pill radius covers the status tag, the
circle covers the theme toggle, and 3px is the focus-ring radius on inline text.

### Named Rules

**The Derived Radius Rule.** New surfaces compute from `--radius` rather than introducing a
new literal. A radius that does not trace back to 10px needs a reason.

**The Shape-Carries-Meaning Rule.** Circle means "choose one," rounded square means "choose
any." Never restyle one to match the other.

## Components

### Buttons

- **Shape:** Base 10px radius (`{rounded.md}`), squared enough to read as a control rather
  than a chip.
- **Primary:** Action Blue fill, white 700 text at 17px, 15px by 26px padding, 48px minimum
  height, and the 2px Action Blue Deep press edge. One per screen. Full width below 640px.
- **Next:** The same treatment one step smaller (16px text, 12px by 22px padding) for
  in-flow advancement, so it does not compete with a screen's real primary action.
- **Hover / Focus:** Primary buttons have no hover fill change; the affordance is the press
  edge and the label. Focus is a 3px Action Blue Deep ring at 2px offset, switching to Torch
  Gold inside the navy bar. Disabled is `opacity: .5` plus `aria-disabled`, never a
  `disabled` attribute that would drop the control out of the tab order.
- **Ghost:** Transparent fill, 2px Action Blue border, Action Blue 700 label at 15px, 48px
  minimum height. Carries Back, Start over, Download, and Email.
- **Link button:** For an action that sits inside a sentence. Inherits size, 700 weight,
  Action Blue, underlined at 3px offset, no padding and no border.
- **Exit / Back (top bar):** White pill on navy, Court Navy 700 label at 13px, 44px minimum
  height. In production this becomes Quick exit to a neutral external site.

### Option tiles (signature component)

The single most important control in the system, and the reason the v2 pattern was kept over
production's Docassemble radios.

- **Style:** Full-width tile, white fill, 2px Boundary border, 10px radius, 16px by 18px
  padding, 52px minimum height, and a 700 label at 16.5px left-aligned beside a 24px mark.
- **Mark:** 24px circle for single-select, 6px-radius square for multi-select, white fill with
  a 2px Boundary Strong border, filling with Action Blue and a white glyph when chosen.
- **Hover:** Border darkens to Muted Ink and the fill takes the Field tint. **Active:** the
  Field Hover tint.
- **Selected:** Action Blue border, Selected Fill background, and the selection halo. The
  border and the filled mark carry the state; the fill alone never does.
- **Semantics:** Real `role="radio"` and `role="checkbox"` with `aria-checked`, so the tile
  is announced as the control it looks like.

### Help tips (signature component)

One component with two physical forms, chosen by pointer type rather than by width. On a fine
pointer above 641px it is a fixed-position popover, 300px wide, white on a Boundary Strong
border with the floating-panel shadow, opening on hover, focus-within, or click. On a coarse
pointer or below 640px it becomes an inline accordion that pushes content down, with the
shadow removed and a 44px minimum trigger. The trigger is a dotted-underlined 12.5px label
with a small ringed `i`, or the ring alone in icon-only mode.

### Cards and result panels

- **Corner Style:** 10px, `overflow: hidden` so the colored header bleeds to the edge.
- **Structure:** A tinted header carrying the result heading over a white body carrying the
  detail. The header fill, the border, and the heading ink are the status vocabulary:
  Exempt Fill with Exempt Ink on Exempt Line for an exemption, Not-Exempt Fill with
  Not-Exempt Ink on Not-Exempt Line for the work-rules outcome, Soft Blue with Action Blue
  Deep on `#c7d6f0` for informational and good-cause results.
- **Shadow Strategy:** None. See Elevation.
- **Internal Padding:** 20px by 22px in result cards, 18px by 20px in nested panels, 22px in
  the statement form.
- **Nested panels:** A pale fill plus a matching 1px border and the base radius, used for
  "how to meet the work rules" and "how to tell DTA" blocks inside a result body.

### Inputs and fields

- **Style:** White fill, 1.5px Boundary Strong stroke, 7px radius, 12px padding, 48px minimum
  height, 16px text. Textareas add `resize: vertical` and 1.5 line height. Two-up fields sit
  in a 1fr 1fr grid that collapses to one column below 640px.
- **Labels:** Always visible above the field, 700 at 14.5px. Placeholders are examples only,
  never the label.
- **Focus:** The global 3px ring; no border-color-only focus states.
- **Signature pad:** A 140px canvas in the same 1.5px stroke and 7px radius, with a Clear
  ghost button and `role="img"` plus `aria-labelledby`.

### Navigation

- **Top bar:** Court Navy, white text, the gold torch glyph at 26px, a 700 title at 15px to
  18px with a 12px subtitle at 0.85 opacity that hides below 640px, and the exit pill at the
  right. Focus rings inside it are Torch Gold.
- **Nav rows (hub and index):** A bordered 14px-radius row: 40px circular icon badge, 17px
  700 title, 15px Muted Ink description, and a blue arrow. Hover darkens the border to the
  accent and lifts 1px. The badge fill encodes the destination's status color.
- **Progress:** A 6px full-bleed channel on Progress Track, filled with Action Blue via
  `transform: scaleX()` over 0.3s so the animation stays off the layout path, plus a 13px
  700 "Section N of M" caption in Muted Ink. Exposed as a real `role="progressbar"`.

### Motion

State transitions are 0.15s ease on background, border, and box-shadow. Screens fade in over
0.3s to 0.35s with opacity only, never a translate. The progress fill animates transform for
0.3s. Every one of these is disabled under `prefers-reduced-motion: reduce`, including the
card entrance and the tile transitions, and the hover lifts are zeroed too.

## Do's and Don'ts

### Do:

- **Do** treat the `court-forms/` palette and chrome as inherited from production. Match it;
  do not improve it.
- **Do** tint the control, not the page. Options are `#eef1f5` at rest, `#e3e8f0` on hover,
  `#d7e6f9` when selected, on a `#ffffff` page.
- **Do** compute a contrast ratio before changing any border, mark, or text color, and keep
  clickable boundaries at or above 3:1 on white.
- **Do** derive new radii from `--radius` (10px) and new spacing from the 8 / 10 / 14 / 18 /
  22 / 28px rhythm.
- **Do** give every interactive element a 44px minimum target, 52px for option tiles, and
  keep inputs at 16px or larger.
- **Do** use a Lucide line glyph in a filled circle for iconography: white stroke on Court
  Navy, Action Blue, Approval Green, or `#9a6a00`, matching the result screens.
- **Do** pair every status color with an icon and a text label, so color is never the only
  channel carrying the outcome.
- **Do** keep the answer tiles as the interaction pattern for questions.

### Don't:

- **Don't** copy production's Docassemble interview screens: Bootstrap carets, the flat
  sidebar step list, small dense radios. The tiles in this system replaced them on purpose.
- **Don't** reach for consumer-app polish: gradients, glassy or blurred panels, floating
  cards, playful illustration, animated flourishes. A benefits decision is not a marketing
  page.
- **Don't** build a dense government portal either: no small type, no wall-to-wall tables, no
  unexplained acronyms, and no showing every section at once.
- **Don't** give an option a white fill, and don't let a fill alone carry the selected state.
- **Don't** add an ambient shadow to a `court-forms/` surface. The 2px press edge under
  primary buttons is the only shadow at rest.
- **Don't** introduce a second typeface into the tools, and don't "fix" the single-font
  detector comment that documents why.
- **Don't** use emoji in the UI. Use the Lucide-in-a-circle pattern instead. Note that
  `snap-abawd.html` and `snap-abawd-classic-v2.html` still carry a lock emoji in the privacy
  notice; that is a known exception to correct, not a precedent.
- **Don't** use red for the "may need to meet the work rules" result. It is not a denial, and
  Caution Ochre (`#9a6a00`) is the deliberate choice.
- **Don't** carry the shell's warm paper palette, Fraunces, or its dark mode into
  `court-forms/`, and don't push the Court Forms chrome onto the root index page.
- **Don't** load a webfont or icon library from a CDN inside the tools. Atkinson Hyperlegible
  and Lucide are self-hosted under `court-forms/fonts/` and `court-forms/vendor/`.
