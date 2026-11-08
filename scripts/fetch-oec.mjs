// Fetches every country's exports by product group from the OEC API and writes the
// normalised intermediate file data/raw/exports.json.
//
// Usage:
//   npm run data:probe     # first, to confirm cube / level names against the live API
//   npm run data:fetch
//
// Environment variables (all optional):
//   OEC_TOKEN   your API token (OEC lists an API key under its paid plans; the docs also say
//               some historical endpoints work without one. Try without first.)
//   OEC_CUBE    default trade_i_baci_a_22 (HS22, 2022-2024). Pick the revision for your year.
//   OEC_LEVEL   product level to group by. Default "Section"; run data:probe to see the
//               level names your cube really has (e.g. HS2, HS4).
//   OEC_YEAR    a specific year, e.g. 2023. Default: the latest year in the cube.
//   OEC_BASE    override the API base URL (used for local testing).
//
// It makes one paged query for ALL exporters, not one request per country, to keep the load
// on OEC's servers small. Read OEC's terms (oec.world/resources/terms) before shipping the
// result: they restrict redistribution of OEC content and automated access.

import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.OEC_BASE ?? "https://api-v2.oec.world/tesseract";
const CUBE = process.env.OEC_CUBE ?? "trade_i_baci_a_22";
const LEVEL = process.env.OEC_LEVEL ?? "Section";
const YEAR = process.env.OEC_YEAR;
const TOKEN = process.env.OEC_TOKEN;
const PAGE = 5000;
const plus = (s) => s.replace(/ /g, "+");

function url(offset) {
  const q = [
    `cube=${CUBE}`,
    `drilldowns=Year,Exporter+Country,${plus(LEVEL)}`,
    `measures=Trade+Value`,
    YEAR ? `include=Year:${YEAR}` : `time=Year.latest`,
    `limit=${PAGE},${offset}`,
  ];
  if (TOKEN) q.push(`token=${TOKEN}`);
  return `${BASE}/data.jsonrecords?${q.join("&")}`;
}

async function getPage(offset) {
  const res = await fetch(url(offset), { headers: { "user-agent": "antipodle-data-script" } });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    const hint =
      res.status === 401 || res.status === 403
        ? "\nThis endpoint may need an API token: set OEC_TOKEN (see the header of this file)."
        : "";
    throw new Error(`HTTP ${res.status} from OEC: ${body}${hint}`);
  }
  return res.json();
}

const rows = [];
for (let offset = 0; ; offset += PAGE) {
  const json = await getPage(offset);
  const data = json.data;
  if (!Array.isArray(data)) throw new Error("Unexpected response: no `data` array");
  rows.push(...data);
  console.log(`fetched ${rows.length} rows`);
  if (data.length < PAGE) break;
  await new Promise((r) => setTimeout(r, 1000));
}

if (rows.length === 0) throw new Error("OEC returned no rows. Check cube, level and year.");

for (const key of ["Exporter Country ID", LEVEL, "Trade Value", "Year"]) {
  if (!(key in rows[0])) {
    throw new Error(
      `Expected a "${key}" field but the rows have: ${Object.keys(rows[0]).join(", ")}.\n` +
        `Run npm run data:probe and adjust OEC_LEVEL / OEC_CUBE.`,
    );
  }
}

// OEC exporter IDs look like "euesp" / "nacan": a 2-letter continent code + ISO3 in lower case.
const normalised = rows.map((r) => ({
  iso3: String(r["Exporter Country ID"]).slice(2).toUpperCase(),
  product: String(r[LEVEL]),
  value: Number(r["Trade Value"]),
  year: Number(r.Year),
}));

mkdirSync("data/raw", { recursive: true });
writeFileSync(
  "data/raw/exports.json",
  JSON.stringify(
    {
      meta: {
        source: `Observatory of Economic Complexity (oec.world), cube ${CUBE}`,
        retrieved: new Date().toISOString().slice(0, 10),
        level: LEVEL,
      },
      rows: normalised,
    },
    null,
    1,
  ),
);
console.log(`Wrote ${normalised.length} rows to data/raw/exports.json. Next: npm run data:build`);
