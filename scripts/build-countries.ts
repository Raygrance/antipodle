// Generates src/data/countries.json (iso, iso3, name, lat, lon) from the `world-countries`
// package. Run once: npm run data:countries
//
// `latlng` in that dataset is an approximate centre point per country. That is good enough
// for centroid-to-centroid distance, but see README for the polygon-distance upgrade.

import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const all = require("world-countries") as Array<{
  cca2: string;
  cca3: string;
  name: { common: string };
  latlng: [number, number];
  independent: boolean;
}>;

const out = all
  .filter((c) => c.independent && c.latlng?.length === 2)
  .map((c) => ({
    iso: c.cca2,
    iso3: c.cca3,
    name: c.name.common,
    lat: c.latlng[0],
    lon: c.latlng[1],
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

writeFileSync("src/data/countries.json", JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${out.length} countries to src/data/countries.json`);
