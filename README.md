# Marlie's MLRI Work — preview site

A growing set of static prototype projects for MLRI, shared with the team for
feedback behind a server-side password. Each project lives in its own folder;
the homepage lists them.

## What's in here

| Path | What it is |
|------|------------|
| `index.html` | Homepage (**"Marlie's MLRI Work"**). Lists projects. **Start here.** |
| `court-forms/` | The **Court Forms Online** project folder → `/court-forms/`. |
| `court-forms/index.html` | Minimal project page — links to the SNAP screening hub. |
| `court-forms/snap-screening.html` | SNAP screening **hub** — links to the tool, sample results, and how-it-works. |
| `court-forms/snap-screening-logic.js` | Shared screening logic (questions, thresholds, links, result engine) used by all three tools. |
| `court-forms/snap-abawd.html` | SNAP ABAWD work-rules screening (classic). |
| `court-forms/snap-abawd-classic-v2.html` | SNAP ABAWD screening — **classic design, author's copy draft**. Same look as `snap-abawd.html`, rebuilt from the MLRI author's website copy draft (see [Classic v2](#classic-v2-the-authors-copy-draft) below). |
| `court-forms/snap-screening-v2.html` | SNAP screening — accessible / plain-language redesign. Supports `?sample=exempt\|goodcause\|notexempt` to jump straight to a sample result screen (demo only; nothing saved). |
| `court-forms/snap-how-it-works.html` | Plain-language explainer of the screening. |
| `court-forms/immigration-court-landing.html` | Landing-page demo for the guided EOIR-28 form. _(Unlinked. Kept in the repo but not shown in site nav.)_ |
| `functions/_middleware.js` | Cloudflare Pages Function enforcing the site-wide password (see below). |

## Adding a new project

1. Create a new top-level folder (e.g. `housing/`) with an `index.html` and any
   pages inside it. It's served at `/housing/`.
2. Add an entry to the homepage `index.html` (copy an existing `.entry` block,
   bump the number, and update the `.count` in the section label).
3. Commit + push. Cloudflare Pages auto-deploys, and the password gate already
   covers the new folder automatically (no extra config).

## The password gate (server-side)

Access is protected by a **Cloudflare Pages Function** at
[`functions/_middleware.js`](functions/_middleware.js). It runs on Cloudflare's
edge for every request and returns HTTP Basic Auth (the browser's native
username/password prompt) until the visitor supplies the right credentials.

Unlike a client-side script, **the password never reaches the browser as
source**. It's read from an encrypted environment variable. This is real,
edge-enforced protection, and it needs no credit card (no Cloudflare Access /
Zero Trust required).

**To set or change the password** (no code change needed), in the Cloudflare
Pages dashboard → **Settings → Variables and secrets**, add for **Production**:

- `SITE_PASSWORD` = your password. Click **Encrypt** to store it as a secret
- `SITE_USER` = optional username (defaults to `mlri`)

Then **redeploy** (Deployments → latest → Retry deployment, or push a commit) so
the Function picks up the value. The gate **fails closed**: if `SITE_PASSWORD`
is unset, the site returns 503 rather than serving unprotected.

> Want per-person logins instead of one shared password (e.g. Google sign-in for
> `@mlri.org` plus an external allowlist)? That's Cloudflare Access, a bigger
> setup that requires a card on file (still $0 on the free tier).

## Hosting: Cloudflare Pages

Hosted on **Cloudflare Pages**, connected to the GitHub repo
(`mcreed-mlri/Marlies-Work`). It's plain static files, so the Pages build
settings are: Framework preset **None**, no build command, output directory
`/`. Every `git push` to `main` auto-deploys. The `functions/` directory is
picked up automatically as Pages Functions. No extra config.

---

# SNAP ABAWD Work Rules Screening

A short, private screening tool that helps someone on SNAP check whether the
Massachusetts DTA **ABAWD work rules** apply to them, or whether they may be
exempt or have good cause. Built for Court Forms Online / MLRI.

Three UIs share one logic module ([`court-forms/snap-screening-logic.js`](court-forms/snap-screening-logic.js)), each selecting a copy variant via `SnapScreening.create(variant)`:

| File | Variant | What it is |
|------|---------|-----------|
| [`court-forms/snap-abawd.html`](court-forms/snap-abawd.html) | `classic` | Classic design |
| [`court-forms/snap-abawd-classic-v2.html`](court-forms/snap-abawd-classic-v2.html) | `classic2` | Classic design, author's copy draft |
| [`court-forms/snap-screening-v2.html`](court-forms/snap-screening-v2.html) | `v2` | Accessible redesign |

It walks through up to 14 questions plus a "good cause" follow-up and shows one
of these results:

- **Exempt** — qualifies for one or more exemptions (including income/work-based exemptions), with a printable "Tell DTA" form.
- **Good cause** — no exemption, but a temporary hardship may excuse missed hours.
- **May need to meet the work rules** — no exemption or good cause; explains work/volunteer options.
- **Age may not apply** — if the person is not 18–64, shown before question flow.

## Classic v2: the author's copy draft

[`court-forms/snap-abawd-classic-v2.html`](court-forms/snap-abawd-classic-v2.html)
is the classic design rebuilt from the MLRI author's **ABAWD Screening Tool
website copy draft**, which also supplies every outbound URL. That draft is
shared separately and is not tracked in this repo. It keeps the four grouped
question sections, the Terms of Use gate, and the 18–64 question, and adds
material the original classic page does not have:

- Intro explains the **SNAP and Work notice** and that DTA must screen for all exemptions first, with a *More on the SNAP ABAWD work rules* disclosure.
- Every outbound link lives in one place: `LINKS` in `snap-screening-logic.js`.
- The exempt screen states the result directly ("You are exempt and do not need to meet the ABAWD work rules") rather than hedging.
- **One labelled write-in blank per exemption that needs explaining** instead of a single box. Driven by `statementPromptsFor` in the logic module; each blank prints as its own labelled section of the statement letter.
- The not-exempt screen carries the good-cause guidance and *How to tell DTA if you are meeting the work rules*.
- The good-cause screen lists **all three** categories with detail and *More examples* links, not just the one selected.
- An *Or, you can do one of these next steps* panel including DTA's own exemption form.

It stores answers under its own key (`cfo-abawd-classic-v2-screening-v1`), so it
never shares state with `snap-abawd.html`.

### Open items for the author

- **"Why are we asking for more information?"** The draft marks this as help text but does not supply the wording. `WHY_INFO_HELP` in the HTML holds a placeholder pending review.
- **Good-cause "More examples"** (Emergency, Employment issues) have no URL in the draft. Both currently point at the good-cause anchor the draft supplies on the not-exempt page.
- **The safety question** is narrower here than in `snap-abawd.html`, which names stalking, sexual harassment, and sexual assault explicitly. This page follows the draft; see the launch question below.
- **Housing follow-up labels** reuse the shared `HOUSING_OPTION_DEFS` text, which differs from the draft only in trailing punctuation.

## How to run it

Open [`court-forms/snap-screening.html`](court-forms/snap-screening.html) in any browser, or any tool file directly. **No build step** is required for the tools themselves.

For automated tests:

```bash
npm install
npm test          # unit tests for snap-screening-logic.js
npm run test:e2e  # Playwright browser tests (starts a local static server)
```

## Deployment to production

Intended for **CourtFormsOnline.org**. Deploy the entire `court-forms/` folder (including `snap-screening-logic.js`, `fonts/`, and `vendor/`) to any static host.

The internal MLRI preview site uses Cloudflare Pages with password protection via [`functions/_middleware.js`](functions/_middleware.js). That middleware is **not** needed on the public Court Forms Online site.

Before go-live:

- Confirm **Terms of Use** wording matches the hosting organization.
- Verify DTA contact info (phone, fax, mail) against current Mass.gov guidance.
- Have an SME spot-check thresholds in `snap-screening-logic.js` (last verified Nov 2025: $217.50/week, 14.5×$15, 30 hrs/week below minimum wage, 20 hrs/week or 80 hrs/month requirement).
- **Restore Quick exit on production** — this preview uses a **← Back** button to `snap-screening.html`. On the live Court Forms Online site, replace it with **Quick exit** that jumps to a neutral external URL (see `PRODUCTION_QUICK_EXIT_URL` in `snap-screening-logic.js` and the deploy note below).

### Preview vs production top bar

| Environment | Top-bar control | Destination |
|-------------|-----------------|-------------|
| **This preview repo** | ← Back | `snap-screening.html` (screening hub) |
| **Production deploy** | Quick exit | Neutral external site (default: `https://www.weather.com/`) |

**TODO when deploying:** In `snap-abawd.html`, `snap-abawd-classic-v2.html`, and `snap-screening-v2.html`, change the top-bar button from `data-action="go-back"` / “← Back” to `data-action="quick-exit"` / “Quick exit”, and handle `quick-exit` with `window.location.replace(PRODUCTION_QUICK_EXIT_URL)` instead of `go-back`. Update intro/privacy copy if it still says “Back.”

### SME verification checklist

- [ ] Compare exemption categories to [Mass Legal Help ABAWD article](https://www.masslegalhelp.org/public-benefits-ssi/snap-food-benefits/snap-3-month-time-limit-abawd-work-rules)
- [ ] Compare income/hour thresholds to current Mass.gov ABAWD flyer
- [ ] Walk through personas: pregnant, homeless+GED, student, DV, tribal member, 25 hrs at $12/hr, disability benefits
- [ ] Confirm **Quick exit** (production only) jumps to a neutral external URL. Not needed for this preview, which uses **← Back** to the hub
- [ ] Confirm printable "Tell DTA" statement is acceptable to DTA / MLRI

### Questions to clarify before launch

- Should working 30+ hours/week while earning less than minimum wage always route to the exempt result, and what proof should the statement ask for?
- Should "Other disability benefit or payment" route to exempt as a cautious tell-DTA path, or ask a follow-up before showing an exemption result?
- Is the housing result language right when DTA must review unable-to-work factors rather than treat housing status as automatic?
- Should the substance use treatment question name specific treatment/program participation criteria?
- Does the safety question cover the right categories: domestic violence, stalking, sexual harassment, sexual assault, and related safety concerns that affect work?
- Should the not-exempt screen say more about how to prove unpaid, in-kind, training, or volunteer/community service hours?

## Privacy & data retention

Everything runs in the visitor's browser. There is **no backend, no analytics,
and answers are never transmitted anywhere.**

- **1-day retention.** Screening answers are saved in the browser's
  `localStorage` so a visitor can close the tab and finish later. Anything older
  than 24 hours is discarded automatically on the next visit. Each tool uses its
  own key, so they never share state: `cfo-abawd-screening-v1` (classic),
  `cfo-abawd-classic-v2-screening-v1` (classic v2), `cfo-abawd-screening-v2`
  (accessible redesign). Tune the window via `RETENTION_MS` in each HTML file.
- **Delete my answers.** The results screen has an explicit button that clears
  the stored answers immediately and returns to the start.
- **"Tell DTA" form fields** (name, agency ID, free text) are *not* stored on the device. The visitor prints or downloads to keep a copy.
- Fonts and icons are **self-hosted** under `court-forms/fonts/` and `court-forms/vendor/` (no Google Fonts or unpkg in production tools).

> Note: because screening answers (which can include health, pregnancy, or
> safety-related responses) persist for up to a day on the device, the intro
> discloses this and offers **Delete my answers** for people on shared or monitored devices. (Production should also offer **Quick exit** to a neutral external site; see deploy note above.)

## Terms of Use gate

The screening cannot start until the visitor checks **"I have read and agree to
the Terms of Use."** The Start button is disabled (and guarded in code) until
then.

## Accessibility

- Uses the **Atkinson Hyperlegible** typeface (designed for low-vision readers).
- Keyboard navigable, with visible focus rings.
- Question options expose ARIA roles (`radio` / `checkbox`) and the progress bar
  is announced to screen readers.
- Preview tools use a **← Back** button to return to the screening hub. Production should use **Quick exit** to a neutral external site instead (see **Preview vs production top bar** above).

## Editing the questions

Screening rules and question text live in [`court-forms/snap-screening-logic.js`](court-forms/snap-screening-logic.js):

- `QUESTION_COPY` — per-variant wording (`classic`, `classic2`, `v2`) against the same logic IDs
- `GOODCAUSE_DEFS` — good-cause question wording, plus the `title` / `detail` used by the classic-v2 results screen
- `WORK_OPTION_DEFS`, `HOUSING_OPTION_DEFS`, `DISABILITY_OPTION_DEFS` — stable option IDs
- `LINKS` — every outbound URL, in one place
- `STATEMENT_PROMPTS` / `statementPromptsFor` — which write-in blanks each exemption gets
- `resultTypeFor`, `exemptReasonsFor`, `housingUnableExempt` — decision engine

A variant may add these optional per-question fields, which the classic-v2 page
knows how to render: `helpHtml` (help text containing links), `listItems` (bullet
list inside the question), `note` (footnote under the options), and
`yesLabel` / `noLabel` (custom Yes/No wording). They only fill in where the
question definition left the field unset.

UI/rendering stays in each HTML file. After logic changes, run `npm test`.

## Development notes

Automated tests live in [`tests/`](tests/):

- `snap-screening-logic.test.js` — pure logic unit tests
- `snap-screening.spec.js` — Playwright end-to-end tests for all three HTML tools
