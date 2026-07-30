# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two layers, because the site is a review surface holding tools built for someone else.

The site's own audience is MLRI colleagues and reviewers. They arrive from a link Marlie
sends, sign in with one shared password, look at a draft, and reply with feedback. They are
often on a phone and are not looking for documentation; they want to try the thing.

The primary user of the SNAP ABAWD screener inside it is a Massachusetts SNAP recipient
working through the questions themselves, possibly on a shared or monitored device. Legal
aid advocates and DTA-facing workers use it with clients often enough that their needs are a
real constraint, but the recipient comes first: reading level, safety, and privacy decisions
are made for them.

## Product Purpose

"Marlie's MLRI Work" collects in-progress MLRI prototypes in one password-gated place so the
team can review them and give feedback before anything reaches a public site. Each project
lives in its own top-level folder; the homepage lists them.

Success for the site is a reviewer opening a link, understanding what the draft is within a
few seconds, testing it, and responding. Success for a project inside it is being accepted
for production; the SNAP screener is aimed at CourtFormsOnline.org.

## Positioning

The prototypes are working software, not mockups. Real screening logic, real outbound links,
real print and download output, so a reviewer exercises actual behavior instead of imagining
it from a picture. The `court-forms/` folder deliberately mirrors production Court Forms
Online chrome so a finished tool can be dropped in without a redesign first.

## Operating Context

- Hosted on Cloudflare Pages from the GitHub repo `mcreed-mlri/Marlies-Work`. Framework
  preset None, no build command, output directory `/`. Every push to `main` auto-deploys.
- Access is HTTP Basic Auth enforced at the edge by `functions/_middleware.js`, reading an
  encrypted `SITE_PASSWORD`. It fails closed with a 503 if the variable is unset. The
  password never reaches the browser as source. That middleware is not needed on the public
  Court Forms Online site.
- Installable as a PWA. HTML, JS, and CSS are network-first; `sw-register.js` shows a "A new
  version is ready" banner when a deploy lands.
- Feedback comes back by email, Slack, or a booked meeting; the homepage footer carries those
  links.
- The homepage also links two LACE Project apps that are live and hosted elsewhere on Vercel,
  the Learning Hub and Brightspace Manager. They are not in this repo.
- The screener runs entirely in the visitor's browser. Answers persist in `localStorage` for
  24 hours so someone can close the tab and finish later, under a per-tool key. Nothing is
  transmitted anywhere.
- The review chain includes the MLRI author who supplied the ABAWD copy draft and an SME who
  must spot-check the income and hour thresholds. Thresholds were last verified in November
  2025.
- Outputs are physical: a printable, signed "Tell DTA" statement the person mails, faxes, or
  uploads to DTA Connect.

## Capabilities and Constraints

- Static files with no build step: plain HTML, hand-written CSS, vanilla JS. There is no
  `npm` on the authoring machine, so `package.json` scripts are for CI only and local runs go
  through the bundled Node binary. The Playwright suite cannot run locally.
- Adding a project means a new top-level folder with an `index.html` plus an entry on the
  homepage. The password gate covers new folders automatically.
- No backend and no analytics. Fonts and icons are self-hosted under `court-forms/fonts/` and
  `court-forms/vendor/`.
- The SNAP screener walks up to 14 questions plus a good-cause follow-up and returns one of
  four results: exempt, good cause, may need to meet the work rules, or age may not apply.
  Rules and question text live in `court-forms/snap-screening-logic.js`; every outbound URL
  lives in `LINKS` there.
- Three UIs share that logic module. Confirmed 2026-07-29: the active variant is `classic2`
  (`court-forms/snap-abawd-classic-v2.html`), the classic design carrying the author's
  updated language. `snap-abawd.html` (classic) and `snap-screening-v2.html` (accessible
  redesign) stay in the repo but are not where work goes; do not assume a change must be
  carried across all three.
- Terms of Use gating is inconsistent, and this entry used to claim otherwise. In `classic`
  and `v2`, `canStart()` requires `state.agreed` and the Start button stays disabled until
  the visitor accepts. In `classic2`, the variant that ships, `canStart()` checks only the
  age answer and there is no Terms of Use text on the page at all. Undecided and not ours to
  settle: whether the tool inherits the host site's terms, MassLegalHelp having its own, or
  needs its own gate.
- Screener copy is author-supplied and frozen. See Brand Commitments.
- Undecided, and not ours to resolve silently: the launch questions listed in README.md
  (30+ hours below minimum wage routing, "other disability benefit" routing, housing result
  language, substance use treatment criteria, the safety question's categories, and how much
  the not-exempt screen should say about proving unpaid or volunteer hours).
- Pending before production: swap the top-bar "← Back" control for "Quick exit" to a neutral
  external site in the shipping screener, and confirm the Terms of Use wording matches the
  hosting organization.

## Brand Commitments

- Names: "Marlie's MLRI Work" for the site, "Court Forms Online" for the project folder, with
  that product's navy bar and gold torch mark.
- Copy in the SNAP screening was provided to Marlie by the MLRI author and is not ours to
  edit. Propose wording changes; do not rewrite factual or legal copy in place.
- Atkinson Hyperlegible is the typeface, chosen for low-vision readers rather than for style.
- No emoji in the UI. Icons are Lucide line glyphs in a filled circle.
- Prose in this repo avoids em dashes and stays short and direct.

## Evidence on Hand

- `README.md` is the fullest existing record of the screener: results, retention, deploy
  steps, the SME checklist, and the open launch questions.
- The author's copy draft, untracked in this repo and shared separately: "ABAWD Screener Tool
  (Court Forms Draft).md" and "Website Draft - ABAWD Screening Tool" (`.md` and `.pdf`). It is
  the source of the `classic2` wording and of every outbound URL.
- Real DTA contact detail already in the draft and the logic module: DTA Assistance Line
  (877) 382-2363, the Document Processing Center address in Taunton, the fax number, DTA
  Connect, the exemption self-declaration form, and the Mass Legal Help ABAWD article.
- Tests that exist because the bugs they catch actually shipped: `tests/render-smoke.test.js`,
  its interpolation guard, `tests/snap-screening-logic.test.js`, and
  `scripts/check-pages.js`.

Absences future work must not paper over: there is no analytics data, no user testing, no
testimonials or usage numbers, no DTA sign-off on the printable statement, and no confirmation
that the Terms of Use wording matches the hosting organization. The good-cause "More examples"
links for Emergency and Employment issues have no URL in the draft and currently point at a
substitute anchor.

## Product Principles

1. A reviewer should be able to exercise real behavior, not read a description of it. Working
   logic beats a prettier static comp.
2. Author-supplied copy outranks editorial instinct. Where the wording came from MLRI or from
   the draft, propose changes instead of making them.
3. Legal accuracy belongs to an SME. Unverified thresholds and undecided routing stay visibly
   flagged rather than quietly resolved in code.
4. Assume a shared or monitored phone. Nothing leaves the device, anything stored is disclosed
   in plain language, and the visitor can delete it in one action.
5. Match production where a tool has to drop in, but do not inherit production's dated
   interview patterns along with its chrome.

## Accessibility & Inclusion

Full accessibility is a requirement, stated directly by Marlie on 2026-07-29, not an
aspiration to trade away. WCAG 2.1 AA is the floor for every screen, and the practices already
in the code are held to it: documented contrast ratios for every control and border, visible
focus rings, ARIA `radio` and `checkbox` roles on question options, an announced progress bar,
and full keyboard operation. No organization has named a standard in writing, so AA is the bar
this project sets for itself rather than one imposed on it. Treat a regression against it as a
defect, not a preference.

One real tension to respect: the screener's copy is frozen, so plain-language and reading-level
improvements go to the MLRI author as proposals. Everything accessibility needs that is not
copy (structure, contrast, focus order, labels tied to their controls, announcements, target
size, reduced motion) is ours to fix directly.

Known user needs that are not negotiable: low-vision readers, for whom Atkinson Hyperlegible
was chosen; readers who need plain language and short sentences to get through a benefits
screening at all; and people answering questions about health, pregnancy, or personal safety,
who may be on a device someone else can see.
