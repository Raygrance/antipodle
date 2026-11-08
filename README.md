# Antipodle

A Tradle-style game: you're shown a country's export mix as a treemap of percentage boxes
plus its total export value, and you guess the country on the **opposite side of the world**.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # type-check + production build into dist/
```

## How the puzzle works

1. The exporter is picked per local day (`exporterForDay` in `src/lib/game.ts`).
2. Its **antipode** is `(-lat, lon ± 180)` from its centre point.
3. The answer is the country whose territory contains that point; if it's ocean (most are),
   the country with the **nearest border**. All of this is **precomputed** into
   `src/data/puzzles.json` by `scripts/build-puzzles.ts` (from `world-countries` border
   polygons), so the browser only does lookups.
4. Each guess shows great-circle distance and a compass arrow to the answer.
5. Puzzles whose answer is more than `MAX_OFFSET_KM` (1,500) from the true antipode are
   kept out of rotation. Tune it in `src/lib/game.ts`.

## Data pipeline

```
 OEC API ──► scripts/fetch-oec.mjs ─┐
                                    ├─► data/raw/exports.json ─► build-exports.ts ─► src/data/exports.json
 BACI CSVs ─► scripts/baci-to-raw.mjs┘                        └► build-puzzles.ts ─► src/data/puzzles.json
```

Both sources write the same intermediate file (`{ meta, rows: [{ iso3, product, value, year }] }`),
so everything after that is source-agnostic.

```bash
npm run data:countries   # once: regenerate src/data/countries.jnson (194 countries)

# Option A: OEC API
npm run data:probe       # prints the cube schema + 3 sample rows: confirm names first
OEC_TOKEN=... npm run data:fetch      # token optional; see licensing below
npm run data:build

# Option B: CEPII BACI bulk files (see licensing below)
node scripts/baci-to-raw.mjs BACI_HS22_Y2024_V202601.csv country_codes_V202601.csv
npm run data:build
```

`data:fetch` options: `OEC_CUBE` (default `trade_i_baci_a_22`), `OEC_LEVEL` (default
`Section`; use `data:probe` to see the level names your cube has), `OEC_YEAR` (default: latest).
It makes one paged query for all exporters rather than one request per country.

**Not yet verified against the live API:** the fetch script was tested against a local mock
shaped like OEC's documented responses, not the real service. Run `data:probe` first.

`src/data/exports.json` currently holds **placeholder** numbers (`_meta.source` is
`"placeholder"`; the UI says so in the footer and hides the total). Running `data:build`
replaces it.

## Licensing: read before you deploy

- **OEC** (oec.world/resources/terms): the terms restrict redistribution of OEC content,
  restrict automated access unless your subscription allows it, and require attribution.
  Their plans page lists an API key under the paid Pro plan. A public site that ships
  OEC-derived numbers is the kind of use to check with them first.
- **CEPII BACI** (the dataset OEC's trade data is built on) is published under the Etalab
  Open Licence 2.0: any use is allowed provided the source is credited
  (https://www.cepii.fr/DATA_DOWNLOAD/baci/doc/baci_webpage.html).

Whichever you use, the footer shows `_meta.source` and the retrieval date; adjust the wording
to match the attribution that source requires.

## Project layout

```
src/lib/geo.ts        antipode, haversine distance, bearing, arrows
src/lib/game.ts       puzzle lookup, judging guesses, daily rotation
src/lib/treemap.ts    squarified treemap layout
src/lib/format.ts     $1.23T / 45% formatting
src/components/       ExportsTreemap
src/data/             countries.json, exports.json, puzzles.json (all generated)
scripts/              data pipeline (offline, never shipped to the browser)
```

## Deploy on Vercel

Push to GitHub, then at vercel.com: Add New > Project > import the repo. Vercel detects Vite
(build `npm run build`, output `dist`). Or `npm i -g vercel && vercel`.

## Ideas

- Streaks and stats in `localStorage`
- End-screen map: exporter -> antipodal point -> answer
- Antipode of a country's whole territory (or its largest city) instead of one centre point
- Hide tiny island nations as answers, or add a hard mode that includes them
