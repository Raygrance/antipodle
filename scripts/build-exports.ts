// data/raw/exports.json (from fetch-oec.mjs or baci-to-raw.mjs) -> src/data/exports.json
//
// Output shape:
//   { "_meta": { source, retrieved, level },
//     "ES": { "total": 4.2e11, "year": 2024, "items": [{ "p": "Machinery & electrical", "s": 0.21 }, ...] } }

import { readFileSync, writeFileSync } from "node:fs";

const TOP_N = 8; // boxes shown; everything else is shown as "Other"
const MIN_SHARE = 0.01;

type Row = { iso3: string; product: string; value: number; year: number };
const raw = JSON.parse(readFileSync("data/raw/exports.json", "utf8")) as {
  meta: { source: string; retrieved: string; level?: string };
  rows: Row[];
};
const countries = JSON.parse(readFileSync("src/data/countries.json", "utf8")) as Array<{
  iso: string;
  iso3: string;
}>;
const iso2Of = new Map(countries.map((c) => [c.iso3, c.iso]));

const byCountry = new Map<string, { year: number; products: Map<string, number> }>();
const skipped = new Set<string>();

for (const r of raw.rows) {
  const iso2 = iso2Of.get(r.iso3);
  if (!iso2) {
    skipped.add(r.iso3);
    continue;
  }
  if (!Number.isFinite(r.value) || r.value <= 0) continue;
  const entry = byCountry.get(iso2) ?? { year: 0, products: new Map() };
  entry.year = Math.max(entry.year, r.year);
  entry.products.set(r.product, (entry.products.get(r.product) ?? 0) + r.value);
  byCountry.set(iso2, entry);
}

const out: Record<string, unknown> = {
  _meta: { source: raw.meta.source, retrieved: raw.meta.retrieved, level: raw.meta.level },
};

for (const [iso2, { year, products }] of [...byCountry].sort(([a], [b]) => a.localeCompare(b))) {
  const total = [...products.values()].reduce((a, b) => a + b, 0);
  const items = [...products]
    .map(([p, v]) => ({ p, s: Math.round((v / total) * 1000) / 1000 }))
    .filter((x) => x.s >= MIN_SHARE)
    .sort((a, b) => b.s - a.s)
    .slice(0, TOP_N);
  out[iso2] = { total: Math.round(total), year, items };
}

writeFileSync("src/data/exports.json", JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${byCountry.size} exporters to src/data/exports.json`);
if (skipped.size) {
  console.log(`Skipped ${skipped.size} codes not in countries.json: ${[...skipped].sort().join(", ")}`);
}
