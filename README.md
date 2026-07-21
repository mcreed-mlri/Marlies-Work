# Court Forms Online — preview gallery

A small set of static prototype pages for Court Forms Online / MLRI, shared with
the team for feedback behind a light password gate.

## What's in here

| File | What it is |
|------|------------|
| `index.html` | Top-level landing — **"Marlie's MLRI Work"** — lists projects. **Start here.** |
| `court-forms.html` | The **Court Forms Online** project page; links to the pages below. |
| `snap-abawd.html` | The current SNAP ABAWD Work Rules screening tool. |
| `snap-screening-v2.html` | The accessible / plain-language redesign of that screening. |
| `immigration-court-landing.html` | Landing-page demo for the guided EOIR-28 form. |
| `assets/gate.js` | Shared client-side password gate included by every page (interim; see below). |

## The password gate

Every page includes `assets/gate.js`, which shows a password overlay until the
visitor enters the shared password. Once entered, it's remembered for the
browser session (via `sessionStorage`), so navigation between pages doesn't
re-prompt.

- **To set the password:** edit the single line `var PREVIEW_PASSWORD = "…";`
  at the top of `assets/gate.js`, then commit + push.
- **⚠️ This is not real security.** The password and page HTML are visible to
  anyone who opens browser dev tools / "view source." It only keeps casual
  visitors out of an internal prototype. For genuine privacy, use Vercel
  Deployment Protection (paid) or Cloudflare Access instead.
- **To remove the gate** before shipping a page to production: delete its
  `<script src="assets/gate.js"></script>` line (first element in `<body>`).

## Hosting: Cloudflare Pages + Access

Hosted on **Cloudflare Pages**, connected to the GitHub repo
(`mcreed-mlri/Marlies-Work`). It's plain static files, so the Pages build
settings are: Framework preset **None**, no build command, output directory
`/`. Every `git push` to `main` auto-deploys.

Access is (or will be) locked down with **Cloudflare Access** (Zero Trust free
tier): a self-hosted application on the `*.pages.dev` hostname with an Allow
policy for `@mlri.org` emails plus an allowlist of specific external reviewers.
This is real, edge-enforced auth — once it's confirmed working, the interim
`assets/gate.js` script tags can be removed so reviewers see only one login.

---

# SNAP ABAWD Work Rules Screening (`snap-abawd.html`)

A short, private screening tool that helps someone on SNAP check whether the
Massachusetts DTA **ABAWD work rules** apply to them — or whether they're
exempt or already meeting the rules. Built for Court Forms Online / MLRI.

It walks through up to 14 questions plus a "good cause" follow-up and shows one
of three results:

- **Exempt** — the person qualifies for one or more exemptions, with a
  printable "Tell DTA" form listing their reasons.
- **Good cause** — no exemption, but a temporary situation (transportation,
  emergency, unreasonable employment) may excuse missed hours, also with a form.
- **May need to meet the work rules** — no exemption or good cause; explains the
  work / community-service options.

## How to run it

It's a self-contained file — **no build step, no dependencies, no server.**
Open `index.html` (the gallery) in any browser, or open `snap-abawd.html`
directly.

## Deployment to production

Intended to be deployed on **CourtFormsOnline.org**. Upload `snap-abawd.html` to
any static host (the CourtFormsOnline web server, GitHub Pages, Netlify, an S3
bucket, etc.). Nothing else is required. Remove the `assets/gate.js` script tag
first — the password gate is only for the internal preview.

Before go-live, fill in the two placeholders:

- The **"Learn more about the SNAP ABAWD work rules"** link on the intro
  (currently `href="#"`) — point it at the explainer page.
- Confirm the **Terms of Use** wording in the intro matches the hosting
  organization's real terms.

## Privacy & data retention

Everything runs in the visitor's browser — there is **no backend, no analytics,
and answers are never transmitted anywhere.**

- **1-day retention.** Screening answers are saved in the browser's
  `localStorage` (key `cfo-abawd-screening-v1`) so a visitor can close the tab
  and finish later. Anything older than 24 hours is discarded automatically on
  the next visit. Tune the window via `RETENTION_MS` in `snap-abawd.html`.
- **Delete my answers.** The results screen has an explicit button that clears
  the stored answers immediately and returns to the start.
- **"Tell DTA" form fields** (name, agency ID, free text) are *not* stored at
  all — the visitor saves or prints the page to keep a copy.
- The only outbound request is for the Atkinson Hyperlegible web font (Google
  Fonts). For zero third-party requests, self-host the font and update the
  `<link>` in `snap-abawd.html`.

> Note: because screening answers (which can include health, pregnancy, or
> safety-related responses) persist for up to a day on the device, the intro
> discloses this and offers **Quick exit** and **Delete my answers** for people
> on shared or monitored devices.

## Terms of Use gate

The screening cannot start until the visitor checks **"I have read and agree to
the Terms of Use."** The Start button is disabled (and guarded in code) until
then.

## Accessibility

- Uses the **Atkinson Hyperlegible** typeface (designed for low-vision readers).
- Keyboard navigable, with visible focus rings.
- Question options expose ARIA roles (`radio` / `checkbox`) and the progress bar
  is announced to screen readers.
- "Quick exit" button leaves the site immediately for safety.

## Editing the questions

All content lives in the `<script>` block at the bottom of `snap-abawd.html`:

- `QUESTIONS` — the main question list. Each has an `id`, a `type`
  (`yn` / `multi` / `single`), the exemption rule (`exemptOn` or `exemptIfAny`),
  and the `reason` shown on the exempt result.
- `GOODCAUSE` / `GC_TEXT` — the good-cause follow-up question and its result text.

No tooling is needed to edit — change the text, save, and refresh the browser.

## Development notes

Ported from the Claude Design comp `ABAWD Screening Tool.dc.html` into plain
HTML + vanilla JS. The full user flow — all three result paths, back navigation,
help toggles, multi-select, the Terms of Use gate, 1-day retention/restore, and
the delete button — is exercised by a Playwright script kept outside the repo
during development.
