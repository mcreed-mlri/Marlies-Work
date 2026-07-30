# SNAP work rules screening: MassLegalHelp build

The public build of the SNAP ABAWD screening, wearing MassLegalHelp chrome. This is the
one intended to ship, and the only one. The earlier Court Forms styled builds were retired
to `archive/` on 2026-07-30 and are frozen.

## Deploy contract

The MassLegalHelp vendor proposed a Cloudflare Worker serving this at a path on
`masslegalhelp.org`, since that domain already fronts Cloudflare. That works, and this
build is written for it.

The contents of this folder are the site root. `index.html` is the entry point.

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
their page-header pattern, a pale blue gradient title panel with a solid block offset behind
it, then a byline and a short heavy rule.
Values and measured contrast ratios are in `MASSLEGALHELP-BRAND.md` in the MLRI source
repository. (Paths to sibling documents are named rather than linked, because this folder is
also published on its own as the deploy repository root, where a relative link out would
break.)

Atkinson Hyperlegible stays as the typeface. MassLegalHelp sets body copy in Montserrat
and headings in Domine, but Atkinson was chosen for low-vision readers and that outranks
matching a host font. Revisit only if their font files are available to self-host.

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

- **Quick exit destination.** Currently `weather.com`, set in `PRODUCTION_QUICK_EXIT_URL`
  in the logic module. Confirm that is the right neutral site.
- **Terms of Use and Privacy Policy.** The footer has no links to either, because they are
  not in MassLegalHelp's `<footer>` element and their URLs are unknown. Get them from the
  vendor. Separately, this build has no Terms of Use checkbox at all, unlike the other
  variants, so decide whether the tool inherits the host site's terms or needs its own
  gate.
- **Author copy edits.** Several are applied; several are waiting on the author. See
  `SCREENER-COPY.md` in the MLRI source repository, which lists every string and the open
  questions against it.
- **Thresholds.** Last verified November 2025. MLRI's own ABAWD article on MassLegalHelp
  was reviewed February 2026 and is therefore newer than this tool, so the income and hour
  figures still need an SME. The age wording was settled on 2026-07-30 and now reads "18 or
  older and under 65" everywhere; that reading of the federal cap is still worth confirming.
- **Languages.** English only. MassLegalHelp publishes the ABAWD article in Spanish, and
  its language selector lives in the Drupal header, which a statically served tool at a
  path will not participate in.

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
