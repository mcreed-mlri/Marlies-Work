# Marlie's MLRI Work — preview site

A growing set of static prototype projects for MLRI, shared with the team for
feedback behind a server-side password. Each project lives in its own folder;
the homepage lists them.

## What's in here

| Path | What it is |
|------|------------|
| `index.html` | Homepage — **"Marlie's MLRI Work"** — lists projects. **Start here.** |
| `court-forms/` | The **Court Forms Online** project folder → `/court-forms/`. |
| `court-forms/index.html` | Minimal project page — links to the SNAP screening hub. |
| `court-forms/snap-screening.html` | SNAP screening **hub** — links to the tool, sample results, and how-it-works. |
| `court-forms/snap-abawd.html` | SNAP ABAWD work-rules screening (classic). |
| `court-forms/snap-screening-v2.html` | SNAP screening — accessible / plain-language redesign. Supports `?sample=exempt\|goodcause\|notexempt` to jump straight to a sample result screen (demo only; nothing saved). |
| `court-forms/snap-how-it-works.html` | Plain-language explainer of the screening. |
| `court-forms/immigration-court-landing.html` | Landing-page demo for the guided EOIR-28 form. _(Unlinked — kept in the repo but not shown in site nav.)_ |
| `functions/_middleware.js` | Cloudflare Pages Function enforcing the site-wide password (see below). |

## Adding a new project

1. Create a new top-level folder (e.g. `housing/`) with an `index.html` and any
   pages inside it. It's served at `/housing/`.
2. Add an entry to the homepage `index.html` (copy an existing `.entry` block,
   bump the number, and update the `.count` in the section label).
3. Commit + push — Cloudflare Pages auto-deploys, and the password gate already
   covers the new folder automatically (no extra config).

## The password gate (server-side)

Access is protected by a **Cloudflare Pages Function** at
[`functions/_middleware.js`](functions/_middleware.js). It runs on Cloudflare's
edge for every request and returns HTTP Basic Auth (the browser's native
username/password prompt) until the visitor supplies the right credentials.

Unlike a client-side script, **the password never reaches the browser as
source** — it's read from an encrypted environment variable. This is real,
edge-enforced protection, and it needs no credit card (no Cloudflare Access /
Zero Trust required).

**To set or change the password** (no code change needed), in the Cloudflare
Pages dashboard → **Settings → Variables and secrets**, add for **Production**:

- `SITE_PASSWORD` = your password — click **Encrypt** to store it as a secret
- `SITE_USER` = optional username (defaults to `mlri`)

Then **redeploy** (Deployments → latest → Retry deployment, or push a commit) so
the Function picks up the value. The gate **fails closed**: if `SITE_PASSWORD`
is unset, the site returns 503 rather than serving unprotected.

> Want per-person logins instead of one shared password (e.g. Google sign-in for
> `@mlri.org` plus an external allowlist)? That's Cloudflare Access — a bigger
> setup that requires a card on file (still $0 on the free tier).

## Hosting: Cloudflare Pages

Hosted on **Cloudflare Pages**, connected to the GitHub repo
(`mcreed-mlri/Marlies-Work`). It's plain static files, so the Pages build
settings are: Framework preset **None**, no build command, output directory
`/`. Every `git push` to `main` auto-deploys. The `functions/` directory is
picked up automatically as Pages Functions — no extra config.

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

Before go-live, confirm the **Terms of Use** wording in the intro matches the
hosting organization's real terms.

The **"Learn more about the SNAP work rules"** links point to the Massachusetts
Legal Help article on the ABAWD work rules.

## Privacy & data retention

Everything runs in the visitor's browser — there is **no backend, no analytics,
and answers are never transmitted anywhere.**

- **1-day retention.** Screening answers are saved in the browser's
  `localStorage` (key `cfo-abawd-screening-v1`) so a visitor can close the tab
  and finish later. Anything older than 24 hours is discarded automatically on
  the next visit. Tune the window via `RETENTION_MS` in `snap-abawd.html`.
- **Delete my answers.** The results screen has an explicit button that clears
  the stored answers immediately and returns to the start.
- **"Tell DTA" form fields** (name, agency ID, free text) are *not* stored on the device — the visitor prints or downloads to keep a copy.
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
