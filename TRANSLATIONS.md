# SOPKA policy translations — 2026-11-15

Text assets for Kazakh, Spanish and Brazilian Portuguese were prepared from the
published HTML in `fec805f7ea027cd669564b608fec9cec49541e01`, effective
November 14, 2026. The older Android-repository `PRIVACY_POLICY.md` was not used.
These assets translate the existing policy; they do not introduce new policies,
permissions, recipients, retention promises or consent. Independent legal or
native-speaker review is not claimed.

## Integration contract

- `translations/{kk,es,pt-BR}.json`: `blocks` contains exactly62 HTML inner
  fragments in source article order. The source extraction contract is
  `/<(h2|h3|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g` within `article#en`.
  Reuse the source tags, lists and layout; replace only each inner fragment.
- `title` and `description` are page metadata. `labels` contains the translated
  header/language/hero/aside/footer labels. `policy` labels the selected article;
  preserve all five language names in the language switcher. Existing font
  licensing names and destinations remain unchanged.
- `translations/source.json` records source commit, Git-blob SHA256, working-copy
  SHA256 and the SHA256 of `JSON.stringify(englishBlocks)`. The working copy uses
  CRLF; its byte hash differs from the LF Git blob without changing the articles.

The source effective date stays November14,2026. Numeric constraints, links,
article blocks and data-flow meanings were preserved. New translations cover
all62blocks and all16shell labels per language. EN/RU articles and existing HTML
were left unchanged. Publication, browser rendering and language-switch behavior
remain the integrating agent's next step at the existing Pages URL and audience.

## Validation

Run from the policy checkout:

```text
node --test tests/translation-assets.test.mjs
git diff --check
```

Final result: **8/8 PASS,0skips**, and `git diff --check` passed.
The first test run reported two false failures because its technical-term check
required the English word order `Android API`/`Billing SDK` inside grammatical
Spanish/Portuguese text. It now requires each technical term in the same source
block without imposing English order. The translated data flows, all numbers,
links and markup remained unchanged; no content was omitted to pass validation.

The test checks the real published-source digest,62blocks per language, exact
HTML tags/hrefs, numeric constraints and percentages, named recipients and
technical facts, shell-label completeness and unchanged EN/RU articles.
It does not certify legal equivalence or native pronunciation. No Android,
Pixel, external account or public website was changed by this task.

## Six static pages

The follow-up rendering stage keeps the existing root `index.html` and both
published RU/EN articles byte-identical to the fixed source template inside it.
Root navigation now offers all five languages; old `#ru`, `#en`, `#delete-ru`
and `#delete-en` anchors remain available. Added `en/`, `ru/`, `kk/`, `es/` and
`pt-BR/` each contain exactly one complete article and its fully localized shell.
Native language names link all pages to each other. Canonical/alternate links
use the existing `https://baltvova-code.github.io/sopka-policy/` address.

`templates/source-2026-11-14.html` is the verified Git blob from `fec805f7`.
`scripts/build-languages.mjs` refuses a template/block digest mismatch, keeps
the source tag/list structure and inserts translated inner fragments. `.gitattributes`
keeps these HTML files in LF so the published-source byte comparison survives
Windows checkouts. Styles, font sizes and local fonts remain the source design;
only the standalone pages' font paths become `../assets/`. No `<base>`, JavaScript,
external fonts, analytics or hidden empty policy content were added.

Regenerate and check from the policy checkout:

```text
node scripts/build-languages.mjs
node scripts/build-languages.mjs --check
node --test tests/translation-assets.test.mjs tests/static-languages.test.mjs
git diff --check
```

`--capture-source` can recreate the immutable template only from the exact
provenance commit after verifying its byte digest. Normal builds use the
template, not the already rendered root HTML. Tests check all six pages,
all five native language links, complete localized shells, all62blocks,
source article bytes, unchanged style declarations, anchors and real local
font/license files. Browser layout review and Pages publication remain with
the integrating agent; this stage does not push or deploy.

Final rendered-stage result: **27/27 PASS,0skips** across the source/translation
and six-page static checks; generator `--check`, Node syntax and
`git diff --check` also pass. All six pages are ready for the integrator's
browser review: `/`, `/en/`, `/ru/`, `/kk/`, `/es/` and `/pt-BR/`.

## Language flags

The five language links use local 4:3 SVG flags from the same pinned
flag-icons7.6.0 bundle as the SOPKA website (GB/RU/KZ/ES/BR).
The unchanged MIT notice and byte hashes are in `assets/flag-icons-LICENSE.txt`
and `assets/flag-icons-provenance.json`. No policy text, script or external
request was added by this visual change.
