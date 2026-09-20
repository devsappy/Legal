# Corpus

The assistant answers only from the text in this folder. One sub-folder per
jurisdiction id from `packages/shared/src/config.ts` (`central`, `maharashtra`, `gujarat`,
`karnataka`, `tamil-nadu`, `west-bengal`). Questions in a state jurisdiction
draw on that state's folder plus `central`.

Files are Markdown or plain text:

```
# Maharashtra Cooperative Societies Act, 1960      <- Act name (first "#" heading)
## §73 Committee, its powers and functions          <- one "##" per section
Text of the section ...
## Rule 12 ...
```

The word after `##` is the section label (`§39(1)`, `cl. 24(3)`, `Rule 12`),
the rest is its title. Files are re-read automatically when they change, so
you can add or edit Acts while the backend is running.

## What is here

| Folder | Act | Sections | Source |
|---|---|---|---|
| `central/` | Multi-State Co-operative Societies Act, 2002 (as amended 2022) | 126 | cooperation.gov.in |
| `central/` | Model bylaws for credit societies (excerpt) | 1 | — |
| `maharashtra/` | Maharashtra Co-operative Societies Act, 1960 | 193 | sahakarayukta.maharashtra.gov.in |
| `gujarat/` | Gujarat Co-operative Societies Act, 1961 | 211 | cooperation.gov.in |
| `karnataka/` | Karnataka Co-operative Societies Act, 1959 | 195 | faolex.fao.org |
| `tamil-nadu/` | Tamil Nadu Co-operative Societies Act, 1983 | 183 | rcs.tn.gov.in |
| `west-bengal/` | West Bengal Co-operative Societies Act, 2006 | 159 | cooperation.wb.gov.in |

The PDFs they were built from are in `_sources/`. They were converted with
`scripts/ingest.mjs`, which recognises the different house styles (titles in
the contents list only, `Title.- (1) body` on one line, upper-case titles,
amendment footnotes). A handful of sections have no title and some section
numbers are absent because they were repealed; treat the Markdown as a
working copy and correct it by hand where the PDF text layer was poor.

## Adding or refreshing an Act

```bash
node scripts/ingest.mjs corpus/_sources/some-act.pdf <jurisdiction> "<Act title>" --out some-act.md
```

Scanned PDFs need OCR first (the script reads the text layer only). Rules and
model bylaws go in the same folders; use `Rule 12` / `cl. 24(3)` as the label
after `##` so citations read correctly.
