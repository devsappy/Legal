# Corpus

The assistant answers only from the text in this folder. One sub-folder per
jurisdiction id from `src/lib/config.ts` (`central`, `maharashtra`, `gujarat`,
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
you can add or edit Acts while `npm run dev` is running.

The files shipped here are short excerpts so the demo has something to cite.
Official Act texts: https://www.indiacode.nic.in (central) and the state
legislature / cooperation department sites.
