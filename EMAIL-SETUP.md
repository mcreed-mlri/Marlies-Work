# Email yourself a copy: what is left to do

Runbook for finishing the "Email myself a copy" button on the SNAP screener. This is a
source-repository document. It is not published with the tool and does not travel with the
subtree split, because most of it describes work that happens before the split.

Written 2026-08-04. Nothing in here contains a key or a secret.

## The shape of the thing

The reader fills in the screening, opens "Email myself a copy", types an address, and gets a
short email listing their result and the reasons that applied. The email is not the letter to
DTA and says so. Print or save this form is still how a signed letter gets made.

The browser posts to a Cloudflare Pages Function on the same origin, which calls Resend. The
browser never talks to Resend and never holds an API key.

What the browser sends is the address, the result type, and **reason ids**. It does not send
the wording. The Function resolves the ids against `REASON_TEXT_BY_ID` in the logic module and
composes the body itself. This is the whole reason the payload looks the way it does: an
endpoint that accepts arbitrary text addressed to an arbitrary recipient is a spam relay that
authenticates as MassLegalHelp, and the sending subdomain would earn its blocklisting fairly.

Decided against, with reasons, so nobody re-opens them by accident:

Cloudflare Email Service instead of Resend. It needs Workers Paid at $5 a month where Resend
is free at this volume, and choosing it would have meant asking the vendor to add a paid plan
to their account. Resend needs nothing from them. If deliverability disappoints, switching is
one function inside our own endpoint with no client changes.

Emailing the person's written statement, their name, and their Client/Agency ID. All three
were in the summary until 2026-08-04. The email is the only artefact this tool makes that
outlives the tab, and the questions cover pregnancy, disability, substance use treatment and
domestic violence. See the comment on `buildResultsEmailContent`.

Removing the mail app route. It survives as the fallback. It is the only email path that
works when the endpoint is down, when a preview deploy is missing its key, or when Turnstile
cannot load, and it puts nothing on a server.

## Done already, uncommitted on `main`

- `scripts/publish-mlh.js`: the `functions/` ban narrowed to `_middleware.js` only, and the
  parent-path-in-a-JS-string guard now resolves the path instead of refusing every `../`, so
  `'../../api/email'` passes while anything leaving the folder still fails. Six cases tested
  by hand, including that a middleware file is still caught by two independent guards.
- `masslegalhelp/snap-screening-logic.js`: `buildResultsEmailContent` rewritten to result and
  reasons only; `REASON_TEXT_BY_ID` with all 17 exempt reasons; `exemptReasonEntriesFor`
  returning `{id, text}`; `exemptReasonsFor` reduced to the text-only view of the same
  traversal so ids and wording cannot drift; `resolveReasonIds` as the endpoint's input
  filter; new and changed `email*` strings in `RESULT_COPY`.
- `scripts/copy-doc.js` and `scripts/copy-screener-only.js`: the new copy keys added to both
  key lists, without which the strings never reach `SCREENER-COPY.md`.
- `tests/snap-screening-logic.test.js`: the email tests inverted to assert the free text, the
  name, and the ID are absent, plus five tests on the reason catalog.
- `SCREENER-COPY.md` regenerated. `decision-spec.json` regenerated and byte-identical, which
  is the evidence that the `exemptReasonsFor` refactor changed no decision.

## Phase 0: unblock the repository

- [ ] Fix the two failing tests in `tests/render-smoke.test.js`. They assert that
      `screener/how-it-works.html` quotes the sentences `composeStatement` produces, and commit
      589792b correctly removed that list when the guided ending was archived. The tests are
      stale, not the page. Delete them with a comment recording why, and drop the orphaned
      `.build` CSS at `how-it-works.html:160`. Confirm first that `SCREENER-COPY.md` section 10
      is enough to justify keeping `composeStatement`, since CLAUDE.md names these tests as
      part of that argument.

This is first because CI runs on every push and `main` is red today. It is unrelated to the
email work.

## Phase 1: finish the code, before the move

- [ ] Rewrite the modal in `masslegalhelp/tools/snap/index.html` with progressive disclosure.
      Send and the address field up front. On failure, and when the feature flag is off,
      reveal "Open in my email app instead", and the copy-the-text panel behind that. Three
      peer buttons for one action is what made removing the fallback look attractive.
- [ ] Do not render the "Email myself a copy" button at all when the flag is off. There is
      nothing to fall back to at that point, and `MASSLEGALHELP-BRAND.md` is explicit that
      drawing a control that does nothing is worse than not drawing it.
- [ ] Add `masslegalhelp/functions/api/email.js`. Reads `env.RESEND_API_KEY`. Imports the logic
      module to resolve reason ids and compose the body. Validates the address, caps the
      payload, verifies Turnstile when `env.TURNSTILE_SECRET` is set and skips when it is not.
      Logs no addresses and no bodies.
- [ ] Reset the Turnstile widget and retry once on a `timeout-or-duplicate` verdict. Tokens are
      single use and expire after 300 seconds, so a reader who opens the modal and comes back
      five minutes later, or who double-clicks Send, hits this on a correct configuration.
- [ ] Load the Turnstile script only when the modal opens, not on page load, so a visitor who
      never emails themselves makes no external request.
- [ ] Amend `masslegalhelp/README.md:32`. It currently says nothing here makes an external
      request and no data goes to a third party. Both stop being true. Change the sentence
      deliberately rather than leaving it to rot.
- [ ] Review the three email checks in `scripts/testing-doc.js` around line 343 and regenerate
      `TESTING.md`. They describe the mail app route and the trimming behaviour, which both
      survive, but the panel they open has changed.
- [ ] Regenerate and run everything: `copy-doc.js`, `copy-walkthrough.js`, `testing-doc.js`,
      then `check-pages.js`, the unit and render tests, `publish-mlh.js --check`, and the two
      Python parity suites.

## Phase 2: the repository move

The subtree split already produces what is needed. `masslegalhelp/functions/api/email.js`
becomes `functions/api/email.js` at the new root, which is where Pages looks, and
`'../../api/email'` resolves the same at any subpath.

- [ ] Decide whether the new repository is deploy-only or becomes the development home. The
      generators, the tests, the copy documents, and `CLAUDE.md` all live at this repository's
      root, outside `masslegalhelp/`. Deploy-only needs no thought. If development relocates,
      all of that has to travel or the copy documents and parity tests stop being run.
- [ ] Run `scripts/publish-mlh.js --check`, then `scripts/publish-mlh.js`, and use the push
      command it prints. It never pushes on its own.
- [ ] Give the new repository its own Pages project. It must not be deployed from a project
      containing the preview site's `functions/_middleware.js`, which would put the public tool
      behind an HTTP Basic password.

## Phase 3: Resend and DNS

Free tier is 3,000 emails a month and 100 a day, which is comfortably above expected volume.
Pages Functions are on the Workers free tier at 100,000 requests a day, so **no paid Cloudflare
plan is needed**. The whole feature is $0.

- [ ] Check that `notify.masslegalhelp.org` and `send.notify.masslegalhelp.org` are both free
      in DNS before committing to the name. Resend puts the return path on the `send.` child,
      and the MX record there is the collision that is easy to miss.
- [ ] Add `notify.masslegalhelp.org` as a domain in Resend and paste the DKIM TXT, SPF TXT, and
      MX records it gives you into the `masslegalhelp.org` zone.
- [ ] Check the root DMARC policy and give the subdomain its own DMARC record. A subdomain
      inherits the root policy unless it has one. Start at `p=none` with a reporting address so
      you can read the authentication results, then tighten to `p=reject`, which is safe here
      because nothing legitimate has ever sent from this name.
- [ ] Confirm with whoever monitors `info@masslegalservices.org` that public replies are
      expected there. It is the Reply-To, and the tool already gives that address to readers
      for this exact topic in `RESULT_COPY.lostSnapIntro`.
- [ ] Ask Resend whether they retain message bodies and for how long. The body carries a
      reason such as "Domestic violence, stalking, sexual harassment...", so the answer matters
      and is not in their public documentation.

From and display name, settled: `noreply@notify.masslegalhelp.org`, shown as `MassLegalHelp`.
The display name is what most inbox lists show. Not "SNAP Screener".

## Phase 4: Cloudflare Pages configuration

- [ ] Set `RESEND_API_KEY` on the Pages project, encrypted, on **both** the production and the
      preview environment.
- [ ] Confirm a preview deployment can send. This is the step that catches the missing preview
      variable, which otherwise looks deployed and fails every send.

## Phase 5: Turnstile

Turnstile is account-level in the Cloudflare dashboard, not inside the zone.

- [ ] Create a widget. Mode **Managed**, with `appearance: 'interaction-only'` in the embed, so
      nothing is drawn unless Cloudflare actually wants a click.
- [ ] Add `masslegalhelp.org` to the widget's hostnames, and the `*.pages.dev` preview hostname
      too if previews are used. Turnstile enforces this and previews fail without it.
- [ ] Commit the **sitekey** as a plain constant in `index.html`. It is public by design and
      treating it as a secret only makes deploys harder.
- [ ] Set `TURNSTILE_SECRET` on the Pages project, both environments. Never in the repository.
- [ ] Exercise both paths with the dummy keys first, pairing sitekey and secret from the same
      row:

      always pass      1x00000000000000000000AA   1x0000000000000000000000000000000AA
      always fail      2x00000000000000000000AB   2x0000000000000000000000000000000AA
      interactive      3x00000000000000000000FF   (with the passing secret)
      token spent      (any passing sitekey)      3x0000000000000000000000000000000AA

      The last row is the double-click and stale-token case, and it is the one most likely to
      reach a real reader.

Skipping Turnstile for v1 is a supported configuration: leave `TURNSTILE_SECRET` unset and the
Function does not verify. The rate limiting rule carries it, with the limitation below.

## Phase 6: rate limiting

The zone is on the Pro plan, which allows 2 rate limiting rules, counting by IP only, with a
counting window capped at 1 minute and a mitigation timeout up to 1 hour.

- [ ] Check whether the vendor has already spent both rules on Drupal login or similar. If so,
      count in the Function instead, where no zone budget applies.
- [ ] Add a rule matching the endpoint path: 3 requests in 1 minute from an IP, then block that
      IP for an hour. Path is an allowed expression field on Pro.

A per-hour budget is not expressible on Pro, so someone sending two a minute stays under any
rule you can write. Turnstile is the real control and this is a blunt backstop.

## Phase 7: go live

- [ ] Flip the feature flag in `index.html`.
- [ ] Send to a Gmail, a Yahoo, and an Outlook address and confirm each arrives in the inbox
      rather than spam. These are what readers actually use, and a new sending subdomain has no
      reputation yet.
- [ ] Confirm the endpoint refuses a request with an unknown reason id, and that the email that
      results still lists the reasons that were recognised.
- [ ] Confirm nothing in the Function logs an address or a body.
- [ ] Read `TESTING.md` and work the email section by hand.

## Still open, not blocking

Whether the emailed reasons should be non-specific. "You are a survivor of domestic violence"
as a bare list item is close to as exposing as the paragraph that was removed, and a neutral
subject line does not help once the body is open. A version reading "Based on what you told us
about your health, your household, or your circumstances" keeps the email useful as a reminder
without naming the reason. This is an author decision. It is one function to change.

The subject line still names SNAP. It was kept because a subject vague enough to hide the topic
reads as spam and gets deleted unread, but it is a disclosure to anyone who can see the inbox
list, and it is worth the author seeing that trade stated.

A usage threshold and a review date. The feature is being built partly to find out whether
anyone wants it, and Resend's dashboard gives a sent count for free, so no instrumentation is
needed and none should be added. Agree now what number by what date would justify keeping it,
or the trial has no end.
