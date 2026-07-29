# Fonts for the homepage

Self-hosted so the installed PWA keeps its typography offline and so no visitor
request reaches a third-party CDN. `sw.js` returns early on cross-origin requests,
so a Google-hosted face could never be cached; offline the page fell back to
Georgia and system-ui.

| File | Face | Source |
|------|------|--------|
| `atkinson-400.woff2` | Atkinson Hyperlegible 400 | Copy of `court-forms/fonts/atkinson-400.woff2` |
| `atkinson-700.woff2` | Atkinson Hyperlegible 700 | Copy of `court-forms/fonts/atkinson-700.woff2` |
| `fraunces-600.woff2` | Fraunces 600, latin subset | Google Fonts `fraunces/v38`, the file the CDN served for `opsz,wght@9..144,600` |

Both families are licensed under the SIL Open Font License 1.1, which permits
self-hosting and redistribution. Atkinson Hyperlegible is by the Braille Institute;
Fraunces is by Undercase Type.

`court-forms/fonts/` keeps its own copy of Atkinson on purpose. That folder ships to
CourtFormsOnline.org on its own, so it cannot depend on anything at the repo root.
The 17KB duplication buys that independence.

Only the latin subset of Fraunces is here, and only weight 600, because that is all
the homepage uses. Atkinson italic is not included; the page has no italic text.
