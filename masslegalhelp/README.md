# SNAP work rules screening: MassLegalHelp build

The public build of the SNAP ABAWD screening, wearing MassLegalHelp chrome. This is the
one intended to ship, and the only one. The earlier Court Forms styled builds were retired
to `archive/` on 2026-07-30 and are frozen.

## Deploy contract

The MassLegalHelp vendor proposed a Cloudflare Worker serving this at a path on
`masslegalhelp.org`, since that domain already fronts Cloudflare. That works, and this
build is written for it.

The contents of this folder are the site root. `tool/index.html` is the tools landing page and
`tool/snap/index.html` is the SNAP screener. Both paths are asserted by `scripts/publish-mlh.js`,
which refuses to publish without them.

Four things this build depends on:

Every path is relative, so it works at any subpath. `/interview`, `/screeners`, or a
subdomain all behave the same and nothing has to change if the path is renamed.

It must not be deployed from a project that contains `functions/`. Cloudflare Pages picks
that directory up automatically, and the repo root has a `_middleware.js` that enforces an
HTTP Basic password on every request. Deploying this folder from the preview repo's root
would put the public tool behind a password. Give it its own Pages project, or its own
repo, which is the plan.

There is no service worker. The preview site registers one for offline support and shows a
"new version is ready" banner. Both are review-surface affordances, and an unexpected
service worker on a production origin is not something to hand a vendor.

Fonts are self-hosted in `fonts/`. Nothing here makes an external request, so the tool
cannot be broken by a third party and sends no data to one.

If the Worker sits on the `masslegalhelp.org` origin, requests to this path will carry
`masslegalhelp.org` cookies. Confirm with the vendor that the Worker strips them and that
no request logging retains them. This tool asks about pregnancy, disability, domestic
violence, and personal safety.

## Decisions worth knowing

The chrome is MassLegalHelp's: navy header, a 9px `#eab736` gold rule, brand navy text, and
their page-header pattern, a pale blue title panel with a solid block offset behind it, then
a short heavy rule. Two deliberate departures: the panel is a flat `#d3e7ff` rather than
their `linear-gradient(#d3e7ff, #fafcff)`, whose 1.03:1 bottom edge left the offset block
reading as a bar floating under nothing at this column width, and there is no byline row.
Values and measured contrast ratios are in `MASSLEGALHELP-BRAND.md` in the MLRI source
repository. (Paths to sibling documents are named rather than linked, because this folder is
also published on its own as the deploy repository root, where a relative link out would
break.)

Atkinson Hyperlegible stays as the typeface, headings included. MassLegalHelp sets body copy
in Montserrat and headings in Domine, but Atkinson was chosen for low-vision readers and that
outranks matching a host font. Headings briefly pointed at a `--serif` token reading
`'Domine', Georgia, serif` against a font file that never arrived, so they shipped in Georgia
until 2026-07-30. Revisit only with the file in hand and a decision to go with it.

The top-bar control is **Quick exit**, not Back. It calls `location.replace()`, so it
leaves no history entry and Back cannot return to a screen holding answers.

`?sample=exempt|goodcause|notexempt` jumps straight to a result screen, and is gated to
review hosts by `SAMPLE_HOSTS` and `samplesAllowed()`. It is inert on masslegalhelp.org. The
team reviews every result screen before launch and reaching the good-cause one honestly means
answering through four groups, so the mode earns its place; it must not work in front of the
public, where a shared URL would show a reader a result that is not theirs. The gate is an
allowlist rather than an exclusion of production, so a preview moving to a new host loses its
samples, which is visible and harmless, instead of a production move silently switching a
demo on.

Answers live in `sessionStorage`, not `localStorage`: they survive a refresh and are erased
when the tab closes. The questions cover pregnancy, disability, substance use treatment and
domestic violence, and the working assumption is a shared or monitored phone, so a day of
recoverable answers is a worse trade than losing resume-tomorrow on a three-minute screening.
Quick exit erases them before it navigates.

No `vendor/lucide.min.js`. This build inlines its SVGs, so that 361KB dependency would be
dead weight.

## The logic module is a copy

`snap-screening-logic.js` lives here and nowhere else. Until 2026-07-30 there were two
copies, one per build, with a test that failed if they drifted; it fired twice on real
one-sided edits. Archiving `court-forms/` removed the second copy, so that failure is now
impossible rather than detected, and the guard came out with it.

`archive/` keeps its own frozen snapshot. That one is meant to fall behind and is not
checked. If a second live build ever appears, restore the drift guard before the copy.

## Before this goes live

Three groups, because reading this on launch day and having to work out which items still
need somebody is how one of them gets missed. Nothing in the first group is a code problem;
each is waiting on a decision or on the vendor.

### Still open, and each one blocks launch

- **The footer disclaimer, in MLRI's words, is in as of 2026-08-07, but read the next
  sentence before ticking this off.** The text approved says who developed the tool, that
  DTA runs SNAP, and that the ABAWD work rules are not the MassHealth work rules. The
  sentence it replaced carried three different facts: that the tool is not legal advice,
  that it sends nothing to DTA, and that using it does not change a SNAP case. None of the
  three is on the page now. That may be deliberate, and the host site's terms may be meant
  to cover it. It is raised in `SCREENER-COPY.md` under `page.footerAbout` and has not been
  changed, because the words are MLRI's.
- **Quick exit destination.** Currently `weather.com`, set in `PRODUCTION_QUICK_EXIT_URL`
  in the logic module. Confirm that is the right neutral site.
- **Terms of Use and Privacy Policy. Linked as of 2026-08-07,** to
  `masslegalhelp.org/terms-use` and `masslegalhelp.org/privacy-policy`, on MassLegalHelp's
  darker `#0c1639` sub-strip under the footer text. What is still open is narrower: this
  build has no Terms of Use checkbox, unlike the retired variants. Linking the terms is not
  the same as asking someone to accept them, so whether the tool inherits the host site's
  terms or needs its own gate is still a decision.
- **Two vendor items, both in the deploy contract above.** It needs its own Pages project or
  repo, because a project containing `functions/` puts the public tool behind the preview
  site's password. And confirm the Worker strips `masslegalhelp.org` cookies and retains
  none in its logs.
- **Author copy edits.** Several are applied; several are waiting on the author. See
  `SCREENER-COPY.md` in the MLRI source repository, which lists every string and prints each
  open question beside the text it is about.

### Known limits, to be stated rather than fixed

- **Signing without a pointer.** The signature pad is a canvas and only takes a finger or a
  mouse, so it cannot be operated by keyboard, switch, or screen reader. The printed
  statement already leaves a ruled line when the pad is empty, and the page now says so, but
  the underlying limit stands. If DTA ever accepts a typed or checkbox attestation, that is
  the real fix.
- **Emailing a copy.** "Email myself a copy" opens a panel whose Send button is disabled,
  because MassLegalHelp has not provided a send endpoint. The panel says so, and "open in my
  email app instead" works and keeps the text off any server.
- **Languages.** English only. MassLegalHelp publishes the ABAWD article in Spanish, and
  its language selector lives in the Drupal header, which a statically served tool at a
  path will not participate in.

### Settled

- **Guided ending.** Archived at `archive/snap-guided/` for records. The shipping build is
  write-in only. Section 10 of `SCREENER-COPY.md` still lists every composed sentence if
  the idea returns.
- **Thresholds. Settled 2026-08-07.** Confirmed against MLRI's SNAP Advocacy Guide, May 2026,
  Part 2, Question 61, which gives $217.50 a week, 14.5 hours at $15 an hour, and 30 or more
  hours a week below minimum wage. The guide is in `reference/`. The citation lives in
  `THRESHOLD_SOURCE` in `snap-screening-logic.js` and every generated document reads it from
  there, so it cannot go stale in one place and not another. The age wording was settled on
  2026-08-03 and reads "18 through 64" everywhere, which the same question confirms.
- **The housing follow-up. Settled 2026-08-07,** to the author's two-case spec, and no longer
  open. No regular place to sleep is not something the tool concludes on its own: when it is
  the only thing the screening finds, the result is a fifth type, `housingreview`, which asks
  DTA to review rather than telling the person they are exempt. Two headings, depending on
  whether any follow-up answer was ticked, and the ticked answers print under the reason in
  both the result and the letter. Answered alongside any other exemption, the normal exempt
  result shows with housing listed among the others. The old behaviour returned a flat
  not-exempt for a diploma plus a steady job and the ticked answers appeared nowhere.
- **The "testing preview" footer line. Removed 2026-08-07.** Both pages carried "A testing
  preview from Mass Legal Help." in the footer. It described the review site, and on a
  benefits tool it tells a reader their result may not count.

## How this folder becomes the deploy repository

`scripts/publish-mlh.js` in the source repository does a `git subtree split` on this folder,
producing a branch whose root is these files, with history. That branch is what the deploy
repository holds, which is why this README makes sense read from either place.

The split means there is no second copy to maintain. This folder stays the single source of
truth, and publishing again is the same command.

The script runs guards first and refuses on any of them: a missing logic module, a
parent-relative or rooted path that would 404 at the deploy root, a local reference that does
not resolve, a service worker, password-gate code, a `functions/` directory, or `?sample=`
mode present without its host gate. It never pushes; it prints the push command and stops.

## Verifying a change

No build step and no `npm` on the authoring machine. Run Node directly:

```
"$LOCALAPPDATA/OpenAI/Codex/bin/node.exe" scripts/check-pages.js
"$LOCALAPPDATA/OpenAI/Codex/bin/node.exe" --test tests/snap-screening-logic.test.js tests/render-smoke.test.js
```

Both cover this build, which since 2026-07-30 is the only one. `check-pages.js` reads it
because `masslegalhelp` is in its `PAGE_GLOBS`, and the render smoke test drives every result
screen and every button path through this page.

There is also `node scripts/publish-mlh.js --check`, which runs the deploy guards above
without changing anything. Worth running after any edit here.
