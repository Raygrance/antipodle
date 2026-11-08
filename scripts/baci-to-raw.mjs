// Converts CEPII BACI bulk CSVs into data/raw/exports.json (same format as fetch-oec.mjs).
// BACI is distributed under the Etalab Open Licence 2.0 (credit BACI / CEPII); see
// https://www.cepii.fr/DATA_DOWNLOAD/baci/doc/baci_webpage.html
//
// 1. Download one HS revision for one year, e.g. BACI_HS22_Y2024_V202601.csv, plus the
//    matching country_codes_V202601.csv from the page above.
// 2. node scripts/baci-to-raw.mjs <trade.csv> <country_codes.csv>
//
// BACI columns: t (year), i (exporter), j (importer), k (HS6 product), v (value, thousand
// USD), q (quantity). Products are grouped into the 21 HS sections via the first two digits.

import { createReadStream, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { sectionForHs2 } from "./hs-sections.mjs";

const [tradeCsv, codesCsv] = process.argv.slice(2);
if (!tradeCsv || !codesCsv) {
  console.error("Usage: node scripts/baci-to-raw.mjs <trade.csv> <country_codes.csv>");
  process.exit(1);
}

// country_code -> iso3 (the codes file is plain CSV with a header row)
const codeRows = readFileSync(codesCsv, "utf8").trim().split(/\r?\n/);
const head = codeRows.shift().split(",");
const iCode = head.indexOf("country_code");
const iIso3 = head.indexOf("country_iso3");
if (iCode < 0 || iIso3 < 0) throw new Error("country_codes.csv needs country_code and country_iso3 columns");
const iso3Of = new Map(codeRows.map((l) => l.split(",")).map((c) => [c[iCode], c[iIso3]]));

const totals = new Map(); // "ISO3|Section" -> thousand USD
let year = 0;

const rl = createInterface({ input: createReadStream(tradeCsv), crlfDelay: Infinity });
let first = true;
for await (const line of rl) {
  if (first) {
    first = false;
    if (line.startsWith("t,")) continue; // header
  }
  const [t, i, , k, v] = line.split(",");
  const iso3 = iso3Of.get(i);
  if (!iso3) continue;
  year = Math.max(year, Number(t));
  const section = sectionForHs2(k.padStart(6, "0").slice(0, 2));
  const key = `${iso3}|${section}`;
  totals.set(key, (totals.get(key) ?? 0) + Number(v));
}

const rows = [...totals].map(([key, thousandUsd]) => {
  const [iso3, product] = key.split("|");
  return { iso3, product, value: thousandUsd * 1000, year };
});

mkdirSync("data/raw", { recursive: true });
writeFileSync(
  "data/raw/exports.json",
  JSON.stringify(
    { meta: { source: "BACI, CEPII", retrieved: new Date().toISOString().slice(0, 10), level: "HS section" }, rows },
    null,
    1,
  ),
);
console.log(`Wrote ${rows.length} rows (year ${year}) to data/raw/exports.json. Next: npm run data:build`);
