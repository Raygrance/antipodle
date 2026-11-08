// Prints what the live OEC API says about the cube and a 3-row sample, so you can confirm
// level names and the response shape before running the full fetch.
//   npm run data:probe
// Same env vars as fetch-oec.mjs (OEC_TOKEN, OEC_CUBE, OEC_LEVEL, OEC_BASE).

const BASE = process.env.OEC_BASE ?? "https://api-v2.oec.world/tesseract";
const CUBE = process.env.OEC_CUBE ?? "trade_i_baci_a_22";
const LEVEL = (process.env.OEC_LEVEL ?? "Section").replace(/ /g, "+");
const TOKEN = process.env.OEC_TOKEN;
const tok = TOKEN ? `&token=${TOKEN}` : "";

async function show(label, u) {
  console.log(`\n=== ${label}\n${u.replace(TOKEN ?? "\u0000", "***")}`);
  const res = await fetch(u, { headers: { "user-agent": "antipodle-data-script" } });
  const text = await res.text();
  console.log(`HTTP ${res.status}`);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 1).slice(0, 5000));
  } catch {
    console.log(text.slice(0, 1000));
  }
}

await show("cube schema (look for dimension and level names)", `${BASE}/cubes/${CUBE}${TOKEN ? `?token=${TOKEN}` : ""}`);
await show(
  `sample rows grouped by "${process.env.OEC_LEVEL ?? "Section"}"`,
  `${BASE}/data.jsonrecords?cube=${CUBE}&drilldowns=Year,Exporter+Country,${LEVEL}&measures=Trade+Value&time=Year.latest&limit=3,0${tok}`,
);
