# SNAP work rules screening: MassLegalHelp build

The public build of the SNAP ABAWD screening, wearing MassLegalHelp chrome. This is the
one intended to ship, and the only one. The earlier Court Forms styled builds were retired
to `archive/` on 2026-07-30 and are frozen.

## Deploy contract

**It ships at `tools.masslegalhelp.org`, decided 2026-08-07.** The landing page is the root of
that subdomain and the screener is `/snap-abawd/`.

The vendor had proposed a Cloudflare Worker serving this at a path on `masslegalhelp.org`, and
that still works. It lost on one thing: a Worker at a path sits in the live site's request path
permanently, and owning it is a cost MLRI would carry rather than the vendor, now that MLRI
holds the Cloudflare account. A subdomain is one DNS record, needs no Worker, and cannot break
the site it sits beside. Cookies did not decide it, because MassLegalHelp sets them on
`.masslegalhelp.org` and they follow the tool either way; see below.

That decision is why this folder has no `tools/` wrapper. It had one while the destination was
`masslegalhelp.org/tools/snap-abawd/`, where the segment does real work. On a subdomain the
subdomain is the container, and `tools.masslegalhelp.org/tools/snap-abawd/` said it twice.

The contents of this folder are the site root. `index.html` is the tools landing page and
`snap-abawd/index.html` is the SNAP screener. Both paths are asserted by `scripts/publish-mlh.js`,
which refuses to publish without them.

Moving to a path later costs nothing in here. Every reference is relative and the publish guards
enforce that, so a Worker mapping `/tools/*` to this root would serve it unchanged.

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

Requests to this tool will carry `masslegalhelp.org` cookies, wherever it is served from.
MassLegalHelp sets them on `.masslegalhelp.org`, with the leading dot, so they reach every
subdomain as well as every path. A subdomain does not avoid this and neither does a Worker at
a path; the two are equal on it, which is why the choice between them turns on other things.

What the tool does with them is nothing. It never reads `document.cookie` and makes no
network request of any kind: no fetch, no XHR, no beacon. The exposure is entirely in logs. A
request log that keeps the Cookie header can tie an identifiable session to "used the SNAP
ABAWD screener", on a tool that asks about pregnancy, disability, domestic violence and
personal safety.

Strip the header at the edge. This used to say the Worker must do it, which is misleading now
that a subdomain is the plan, because a subdomain has no Worker and a reader would conclude
the requirement cannot be met. It can, without one: a Transform Rule doing HTTP request header
modification, matching the tool's hostname and removing `Cookie`. Check what Logpush retains
for the zone while you are there. MLRI holds the Cloudflare login, so this is a thing to do
rather than a thing to ask the vendor.

## Gating it while it is being tested

MLRI has the Cloudflare account for `masslegalhelp.org`, so this does not need the vendor.
Two routes work and one does not.

Worth knowing which of these steps can reach the live site, because most of them cannot. A
GitHub repo, a push to it, and a Cloudflare Pages project are separate resources: creating a
Pages project never reads or writes the DNS zone, and it comes with its own `pages.dev`
hostname. The zone is touched only when a custom domain is added, and that adds one record
for a hostname that does not exist yet; DNS records are per-hostname, so it cannot alter the
apex or `www`. The one step with real reach is the Access policy, which gates exactly the
hostname it is given.

So there is a version of this that touches `masslegalhelp.org` not at all: deploy to the
Pages project, protect the `pages.dev` hostname, and stop. The cost is that a `.pages.dev`
host matches the review allowlist, so `?sample=` and **Screener home** are live there. That
is irrelevant to a copy review and matters only for confirming those are absent in
production, which needs the real hostname and can wait for it.

**Cloudflare Access is the one to reach for.** An application scoped to
`tools.masslegalhelp.org` in Zero Trust, allowing named addresses or a one-time PIN to an
`@mlri.org` address. No code, no environment variable, and turning it off is a toggle rather
than a deploy. What makes it the right answer rather than merely a working one is that the
files stay byte-identical to what the public gets, so the pass tests the thing that ships.

Two cautions. Scope it to the subdomain and re-read the hostname before saving, because an
application written against `masslegalhelp.org` would put the whole public site behind a login
immediately. And Access is per-person, so it is a better fit than a shared password for
anything that outlives a review round.

**What does not work is putting the gate in this folder.** `scripts/publish-mlh.js` refuses
`SITE_PASSWORD` and `WWW-Authenticate` here, and would refuse a `functions/_middleware.js`
copied in from the repo root. Two reasons beyond the guard. The build under test would carry
auth code that has to come out before launch, and that removal is a step someone can forget.
And this folder is produced by `git subtree split`, so anything added to the deploy branch by
hand is overwritten the next time the script runs.

One thing gating the real hostname buys that the password-protected preview cannot: it is the
only environment that tests the production configuration. On `tools.masslegalhelp.org`,
`samplesAllowed()` is false, so `?sample=` does nothing and the review-only **Screener home**
button is absent. Both are live on a `.pages.dev` preview. The cost is that reaching the
good-cause result there means answering through all four groups honestly, which is the point.

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

The top-bar control is **Learn More**, a link to the MassLegalHelp ABAWD article, from
2026-08-07. Its href is written out in the markup rather than read from the module, so the
header needs no JavaScript; a test holds it equal to `LINKS.abawd` so the two copies cannot
drift.

It replaced **Quick exit**, which called `location.replace()` after clearing the stored
answers, so no history entry survived for Back to return to. Recorded because of what went
with it rather than as history: that was the only control that erased the answers, and the
only one on the question screens at all. **Delete my answers** is on the results screen, so
someone partway through the domestic violence or pregnancy questions now has no fast way
out. Raised with MLRI; the decision is theirs.

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
Closing the tab is what erases them now; the control that did it on demand went on 2026-08-07.

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
each is waiting on a decision, and the hosting ones are MLRI's own to make.

### Still open, and each one blocks launch

- **The footer disclaimer, in MLRI's words, is in as of 2026-08-07, but read the next
  sentence before ticking this off.** The text approved says who developed the tool, that
  DTA runs SNAP, and that the ABAWD work rules are not the MassHealth work rules. The
  sentence it replaced carried three different facts: that the tool is not legal advice,
  that it sends nothing to DTA, and that using it does not change a SNAP case. None of the
  three is on the page now. That may be deliberate, and the host site's terms may be meant
  to cover it. It is raised in `SCREENER-COPY.md` under `page.footerAbout` and has not been
  changed, because the words are MLRI's.
- **No fast way off the question screens.** Quick exit was replaced by Learn More on
  2026-08-07 at MLRI's direction, which closes the old question about whether `weather.com`
  was the right neutral destination by removing the control. What it leaves open is the gap
  it filled: **Delete my answers** is on the results screen only, so between the domestic
  violence question and the end there is nothing that erases the answers or leaves without a
  history entry. Worth a decision rather than an assumption, given the questions this tool
  asks and the shared-phone assumption above.
- **Terms of Use and Privacy Policy. Linked as of 2026-08-07,** to
  `masslegalhelp.org/terms-use` and `masslegalhelp.org/privacy-policy`, on MassLegalHelp's
  darker `#0c1639` sub-strip under the footer text. What is still open is narrower: this
  build has no Terms of Use checkbox, unlike the retired variants. Linking the terms is not
  the same as asking someone to accept them, so whether the tool inherits the host site's
  terms or needs its own gate is still a decision.
- **Two hosting items, both in the deploy contract above, and both MLRI's own to do rather
  than the vendor's, since MLRI holds the Cloudflare login for the domain.** It needs its own
  Pages project or repo, because a project containing `functions/` puts the public tool behind
  the preview site's password. And a Transform Rule has to strip the `Cookie` header for the
  tool's hostname, because MassLegalHelp's cookies are set on `.masslegalhelp.org` and so
  follow it to a subdomain as readily as to a path. The tool reads none of them; the point is
  that logs should not be able to tie a session to a screening about domestic violence.
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
