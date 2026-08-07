# Marlie's MLRI Work (preview site)

A growing set of static prototype projects for MLRI, shared with the team for
feedback behind a server-side password. Each project lives in its own folder;
the homepage lists them.

## What's in here

| Path | What it is |
|------|------------|
| `index.html` | Homepage (**"Marlie's MLRI Work"**). Lists projects. **Start here.** |
| `screener/index.html` | **Screener landing page** → `/screener/`. The screener, the sample results, and the review documents. |
| `masslegalhelp/tools/` | The MassLegalHelp interactive tools landing page → `/masslegalhelp/tools/`. |
| `archive/` | Three earlier designs and the retired `court-forms/` project page, frozen and untested. See `archive/README.md`. |
| `masslegalhelp/snap-screening-logic.js` | The screening logic: questions, thresholds, links, result engine. One copy, next to the one build that uses it. |
| `masslegalhelp/tools/snap-abawd/index.html` | **The SNAP screener.** MassLegalHelp chrome, Quick exit, `sessionStorage`. Supports `?sample=exempt\|goodcause\|notexempt` on review hosts only. |
| `screener/how-it-works.html` | Plain-language explainer of the screening, in the preview site's own look rather than Court Forms chrome. It is documentation about the tool, not part of it. |
| `functions/_middleware.js` | Cloudflare Pages Function enforcing the site-wide password (see below). |
| `sw.js` | Service worker. Offline support and update handling for the PWA. |
| `sw-register.js` | Client script that checks for service worker updates and prompts a refresh. |
| `_headers` | Cloudflare Pages cache headers (keeps HTML and the service worker fresh). |
| `_redirects` | One line, sending the magic `/favicon.ico` path into `icons/`. |
| `icons/` | Favicons, the apple-touch icon, and the PWA icons. Referenced by the pages, `manifest.webmanifest`, and the service worker's PRECACHE. |

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

## PWA updates (service worker)

The preview site is installable as a PWA. HTML, JS, and CSS are fetched
**network-first** so routine deploys reach returning visitors without a hard
refresh. Icons and images stay cache-first for speed.

Each page loads [`sw-register.js`](sw-register.js), which checks for updates on
load, when the tab regains focus, and when you switch back to the tab. When a
new version is ready, visitors see a small **"A new version is ready"** banner
with a **Refresh** button (or the page refreshes automatically if the tab is in
the background).

### Bumping the cache version on deploy

After **significant changes** (especially to HTML, JS, or CSS), bump the cache
names in [`sw.js`](sw.js) so any leftover cached files are cleared:

```js
const CACHE = 'mlri-work-v5';        // was v4
const STATIC_CACHE = 'mlri-work-static-v5';  // was v4
```

Change both `CACHE` and `STATIC_CACHE` together (e.g. `v3` → `v4`). You do not
need to do this for every small edit; network-first fetching handles most
day-to-day updates. Bump the version when you want to force a clean slate (big
logic changes, broken cached state, or if someone still sees stale content).

The [`_headers`](_headers) file tells Cloudflare not to cache `sw.js`,
`sw-register.js`, or HTML, so the browser always checks for a new service worker
on deploy.

---

# SNAP ABAWD Work Rules Screening

A short, private screening tool that helps someone on SNAP check whether the
Massachusetts DTA **ABAWD work rules** apply to them, or whether they may be
exempt or have good cause. Built by MLRI, for MassLegalHelp.

One build, [`masslegalhelp/tools/snap-abawd/index.html`](masslegalhelp/tools/snap-abawd/index.html), selecting its copy variant via `SnapScreening.create('classic2')`. Three earlier designs and the `court-forms/` folder moved to `archive/` on 2026-07-30:

| File | Variant | What it is |
|------|---------|-----------|
| [`masslegalhelp/tools/snap-abawd/index.html`](masslegalhelp/tools/snap-abawd/index.html) | `classic2` | **Ships.** MassLegalHelp chrome, Quick exit, `sessionStorage` |

It walks through up to 14 questions plus a "good cause" follow-up and shows one
of these results:

- **Exempt.** The person qualifies for one or more exemptions, including the
  income and work-based ones. Includes a printable "Tell DTA" form.
- **Good cause.** No exemption, but a temporary hardship may excuse missed hours.
- **May need to meet the work rules.** Neither an exemption nor good cause came
  up, so the screen explains the work and volunteer options instead.

## The author's copy draft

The shipping build ([`masslegalhelp/tools/snap-abawd/index.html`](masslegalhelp/tools/snap-abawd/index.html))
is the classic design rebuilt from the MLRI author's **ABAWD Screening Tool
website copy draft**, which also supplies every outbound URL. That draft is
shared separately and is not tracked in this repo. It keeps the four grouped
question sections and adds
material the original classic page does not have:

- Intro explains the **SNAP and Work notice** and that DTA must talk to someone and check for all exemptions before telling them they have to meet the rules, then points at the MassLegalHelp article for the rest. The *More on the SNAP ABAWD work rules* disclosure that used to sit here came out on 2026-08-06: three paragraphs behind a click, most of which the article says better.
- Every outbound link lives in one place: `LINKS` in `snap-screening-logic.js`.
- The exempt screen names the reasons it found. Since 2026-07-30 it reads "You may be exempt and do not need to meet the ABAWD work rules because of these reasons:", because the screening cannot confirm an exemption, only suggest one.
- **One labelled write-in blank per exemption that needs explaining** instead of a single box. Driven by `statementPromptsFor` in the logic module; each blank prints as its own labelled section of the statement letter.
- The not-exempt screen carries the good-cause guidance and *How to tell DTA if you are meeting the work rules*.
- The good-cause screen lists **all three** categories with detail and *More examples* links, not just the one selected.
- An *Or, you can do one of these next steps* panel including DTA's own exemption form.

It stores answers under its own key (`cfo-abawd-classic-v2-screening-v1`), so it
never shares state with `snap-abawd.html`.

### Open items for the author

- **Good-cause "More examples"** (Emergency, Employment issues) have no URL in the draft. Both currently point at the good-cause anchor the draft supplies on the not-exempt page.
- **The safety question** is narrower here than in `snap-abawd.html`, which names stalking, sexual harassment, and sexual assault explicitly. This page follows the draft; see the launch question below.
- **Housing follow-up labels** reuse the shared `HOUSING_OPTION_DEFS` text, which differs from the draft only in trailing punctuation.

## How to run it

Open [`masslegalhelp/tools/`](masslegalhelp/tools/index.html) for the tool landing page, [`masslegalhelp/tools/snap-abawd/index.html`](masslegalhelp/tools/snap-abawd/index.html) for the SNAP screener, or [`screener/index.html`](screener/index.html) for the review list. **No build step** is required for the tools themselves.

For automated tests:

```bash
npm run verify    # everything below except the browser tests; run this before a deploy
npm run check     # structural checks on the shipped pages (no dependencies)
npm test          # unit tests plus the render smoke tests (no dependencies)

npm install       # only needed for the Playwright tests
npm run test:e2e  # Playwright browser tests (starts a local static server)
```

`npm run verify` and everything it calls use only Node builtins, so they work
without `npm install`. [CI](.github/workflows/ci.yml) runs both on every push.

### What the checks protect against

These pages are static files with no build step, so nothing catches a mistake
before a visitor does. Each check exists because of a bug that actually shipped:

| Check | Catches |
|---|---|
| `tests/render-smoke.test.js` | A reference to something undeclared inside a template literal. It parses fine, then throws at render time and the page paints **nothing**. Drives every result screen, every question page, and every button path (print, download, email, restart) against a small DOM shim. |
| Interpolation guard in the same file | The same bug on a path the tests do not drive. Reads the source and checks every interpolated `SCREAMING_CASE` name is declared. |
| `scripts/check-pages.js` | An inline `<script>` that does not parse; mojibake or a lost character from a bulk find-and-replace writing the wrong encoding; a CSS class used in markup but never defined, which silently falls back to browser defaults; HTML, JS, or CSS added to the service worker's `PRECACHE`, which would pin visitors to a stale build. |

Because the pages are unbundled and share copy through `snap-screening-logic.js`,
the cheapest protection is coverage of the render paths. Add a screen or a button
and it is worth adding a line to `SCREENS` or `ACTIONS` in the smoke test.

## Deployment to production

Intended for **CourtFormsOnline.org**. Deploy the entire `court-forms/` folder (including `snap-screening-logic.js`, `fonts/`, and `vendor/`) to any static host.

The internal MLRI preview site uses Cloudflare Pages with password protection via [`functions/_middleware.js`](functions/_middleware.js). That middleware is **not** needed on the public Court Forms Online site.

Before go-live:

- Confirm **Terms of Use** wording matches the hosting organization.
- Verify DTA contact info (phone, fax, mail) against current Mass.gov guidance.
- ~~Have an SME spot-check thresholds in `snap-screening-logic.js`.~~ **Done 2026-08-07.** Confirmed against MLRI's SNAP Advocacy Guide, May 2026, Part 2, Question 61: $217.50/week, 14.5 hrs at $15, 30 hrs/week below minimum wage, and 20 hrs/week or 80 hrs/month to meet the rules. The guide is in `reference/`; the citation is `THRESHOLD_SOURCE` in `snap-screening-logic.js`, which every generated document reads rather than restating.
- **Housing follow-up: DTA assesses, so the tool should not decide.** The same Question 61 says those screening answers "are not an 'automatic' exemption". The tool returns a flat not-exempt for a diploma plus a steady job, and the ticked answers then show nowhere. It should record that DTA has to review. Waiting on the author; this is the last correctness question before launch.
- **Proof notes may be stricter than the rule.** Question 61 ends: proof is needed for income-based exemptions, and "otherwise, DTA only needs a self-declaration unless the statement is questionable." The disability and state agency proof lines ask for more than that. Author's wording, so hers to soften.
- **Quick exit** is live in `masslegalhelp/tools/snap-abawd/index.html` and clears storage before navigating. The preview build keeps a **← Back** button, now pointing at `/screener/`. Previously read: on the live Court Forms Online site, replace it with **Quick exit** that jumps to a neutral external URL (see `PRODUCTION_QUICK_EXIT_URL` in `snap-screening-logic.js` and the deploy note below).

### Preview vs production top bar

| Environment | Top-bar control | Destination |
|-------------|-----------------|-------------|
| **This preview repo** | ← Back | `/screener/` (the screener landing page) |
| **Production deploy** | Quick exit | Neutral external site (default: `https://www.weather.com/`) |

**Done 2026-07-30** in `masslegalhelp/tools/snap-abawd/index.html`, which is the build that ships. The preview `snap-abawd-classic-v2.html` keeps its Back button on purpose. Previously read: in each tool, change the top-bar button from `data-action="go-back"` / “← Back” to `data-action="quick-exit"` / “Quick exit”, and handle `quick-exit` with `window.location.replace(PRODUCTION_QUICK_EXIT_URL)` instead of `go-back`. Update intro/privacy copy if it still says “Back.”

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

- **The shipping build keeps answers for the tab only.**
  `masslegalhelp/tools/snap-abawd/index.html` uses `sessionStorage`, so answers survive a refresh
  or a stray navigation and are erased when the tab closes. Nothing is
  recoverable afterwards. Key: `mlh-snap-work-rules-v1`.

  This is deliberate and differs from the preview builds. The questions cover
  pregnancy, disability, substance use treatment, and domestic violence, and the
  working assumption is a shared or monitored phone, so a day of recoverable
  answers on a borrowed device is a worse trade than losing resume-tomorrow on a
  three-minute screening. Raised by the MassLegalHelp vendor and decided
  2026-07-30. `RETENTION_MS` still applies but now only bounds a tab left open
  for days.
- **The preview builds keep answers for a day**, in `localStorage`, so a reviewer
  can come back to a part-finished session. Each uses its own key, because on the
  preview site every build is served from one origin and a shared key means they
  overwrite each other: `cfo-abawd-screening-v1` (classic),
  `cfo-abawd-classic-v2-screening-v1` (classic v2), `cfo-abawd-screening-v2`
  (accessible redesign). Tune the window via `RETENTION_MS` in each HTML file.
- **Delete my answers.** The results screen has an explicit button that clears
  the stored answers immediately and returns to the start.
- **Quick exit clears storage before it navigates.** It exists for someone who
  needs to stop being on the page immediately, so leaving answers behind would
  defeat it. `location.replace()` also means no history entry survives.
- **"Tell DTA" form fields** (name, agency ID, free text) are *not* stored on the device. The visitor prints or downloads to keep a copy.
- Fonts are **self-hosted** under `masslegalhelp/fonts/` (no Google Fonts or unpkg in the shipping tool). Icons are inline SVG; the vendored Lucide bundle went to `archive/` with the one page that used it.

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

Screening rules and question text live in [`masslegalhelp/snap-screening-logic.js`](masslegalhelp/snap-screening-logic.js):

- `QUESTION_COPY`: per-variant wording (`classic`, `classic2`, `v2`) against the same logic IDs
- `GOODCAUSE_DEFS`: good-cause question wording, plus the `title` / `detail` used by the classic-v2 results screen
- `WORK_OPTION_DEFS`, `HOUSING_OPTION_DEFS`, `DISABILITY_OPTION_DEFS`: stable option IDs
- `LINKS`: every outbound URL, in one place
- `STATEMENT_PROMPTS` / `statementPromptsFor`: which write-in blanks each exemption gets
- `resultTypeFor`, `exemptReasonsFor`, `housingUnableExempt`: the decision engine

A variant may add these optional per-question fields, which the classic-v2 page
knows how to render: `helpHtml` (help text containing links), `listItems` (bullet
list inside the question), `note` (footnote under the options), and
`yesLabel` / `noLabel` (custom Yes/No wording). They only fill in where the
question definition left the field unset.

UI/rendering stays in each HTML file. After logic changes, run `npm test`.

## Development notes

Automated tests live in [`tests/`](tests/):

- `snap-screening-logic.test.js`: pure logic unit tests
- `snap-screening.spec.js`: Playwright end-to-end tests for all three HTML tools
