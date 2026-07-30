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
for production; the SNAP screener is aimed at MassLegalHelp.org, a site MLRI already owns.
It was aimed at CourtFormsOnline.org until 2026-07-30, when that turned out to require a
Docassemble interview and a review process MLRI does not control.

## Positioning

The prototypes are working software, not mockups. Real screening logic, real outbound links,
real print and download output, so a reviewer exercises actual behavior instead of imagining
it from a picture. The screener wears MassLegalHelp's chrome, measured from their live pages,
so what a reviewer approves is what the public will see rather than a lookalike.

## Operating Context

- Hosted on Cloudflare Pages from the GitHub repo `mcreed-mlri/Marlies-Work`. Framework
  preset None, no build command, output directory `/`. Every push to `main` auto-deploys.
- Access is HTTP Basic Auth enforced at the edge by `functions/_middleware.js`, reading an
  encrypted `SITE_PASSWORD`. It fails closed with a 503 if the variable is unset. The
  password never reaches the browser as source. That middleware must not follow the screener
  to its public deploy; see `masslegalhelp/README.md`.
- Installable as a PWA. HTML, JS, and CSS are network-first; `sw-register.js` shows a "A new
  version is ready" banner when a deploy lands.
- Feedback comes back by email, Slack, or a booked meeting; the homepage footer carries those
  links.
- The homepage also links two LACE Project apps that are live and hosted elsewhere on Vercel,
  the Learning Hub and Brightspace Manager. They are not in this repo.
- The screener runs entirely in the visitor's browser and nothing is transmitted anywhere.
  Storage differs by build, on purpose. The shipping MassLegalHelp build uses
  `sessionStorage`, so answers are erased when the tab closes; the preview builds keep them
  in `localStorage` for 24 hours so a reviewer can return to a part-finished session. The
  shared-phone assumption below is why the public build gives up resume-tomorrow. Decided
  2026-07-30 after the MassLegalHelp vendor pointed out that the intro copy claimed answers
  were not saved on the device while `localStorage` was doing exactly that.
- The "Tell DTA" statement fields, name, Client/Agency ID, free text, and signature, are
  never stored. They are read from the page only when someone prints, downloads, or emails.
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
- No backend. No analytics yet, though aggregate non-identifying counts are planned; see the
  open items. Fonts are self-hosted under `masslegalhelp/fonts/`.
- The SNAP screener walks up to 14 questions plus a good-cause follow-up and returns one of
  four results: exempt, good cause, may need to meet the work rules, or age may not apply.
  Rules and question text live in `masslegalhelp/snap-screening-logic.js`; every outbound URL
  lives in `LINKS` there.
- One build, `masslegalhelp/index.html`, using the `classic2` copy. It is both the page
  reviewers approve and the page the public gets, which removes the risk of approving a
  lookalike rather than testing for it. All three earlier designs and the `court-forms/`
  folder moved to `archive/` on 2026-07-30 and are frozen and untested. Carrying several
  variants through every shared-logic change was worth it while the destination was
  undecided; it is not now. The superseded note below is kept for context.
- Superseded 2026-07-29: three UIs shared that logic module; the active variant was `classic2`
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
- Done 2026-07-30: Quick exit replaced the Back control in the shipping build and clears
  storage before navigating. Still pending: confirm the neutral exit URL, currently
  weather.com, and settle whether the tool needs its own Terms of Use or inherits
  MassLegalHelp's.

## Brand Commitments

- Names: "Marlie's MLRI Work" for the site. The screener wears MassLegalHelp's chrome: navy
  header, saturated gold rule, and the page-header pattern recorded in
  `MASSLEGALHELP-BRAND.md`. Court Forms Online's navy bar and gold torch mark are retired to
  `archive/`.
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
