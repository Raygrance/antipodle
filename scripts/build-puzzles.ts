// Precomputes every puzzle answer -> src/data/puzzles.json
//   { "ES": { "a": "NZ", "km": 202 }, ... }
//
// For each exporter we take the antipode of its centre point and find the country whose
// territory contains that point. If it lands in the ocean (most do), the answer is the
// country whose BORDER is nearest. "a" is the answer's ISO code; "km" is the distance from
// the antipodal point to that border (0 = the point is inside the country).
//
// Border polygons come from the `world-countries` package (data/<iso3>.geo.json). Nothing
// here runs in the browser: the game just looks the results up.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { pointToPolygonDistance } from "@turf/point-to-polygon-distance";
import { point } from "@turf/helpers";
import { antipode, distanceKm } from "../src/lib/geo";

type Country = { iso: string; iso3: string; name: string; lat: number; lon: number };
type Coord = [number, number]; // [lon, lat]

const countries = JSON.parse(readFileSync("src/data/countries.json", "utf8")) as Country[];
const exportsData = JSON.parse(readFileSync("src/data/exports.json", "utf8")) as Record<string, unknown>;

function flatten(coords: unknown, out: Coord[] = []): Coord[] {
  if (Array.isArray(coords) && typeof coords[0] === "number") out.push(coords as Coord);
  else if (Array.isArray(coords)) for (const c of coords) flatten(c, out);
  return out;
}

type Territory = {
  country: Country;
  feature: { type: "Feature"; properties: object; geometry: { type: string; coordinates: unknown } };
  vertices: Coord[];
  bbox: [number, number, number, number]; // minLon, minLat, maxLon, maxLat
};

const territories: Territory[] = [];
for (const country of countries) {
  const file = `node_modules/world-countries/data/${country.iso3.toLowerCase()}.geo.json`;
  if (!existsSync(file)) {
    console.warn(`No border data for ${country.name} (${country.iso3}); it can't be an answer.`);
    continue;
  }
  const geometry = JSON.parse(readFileSync(file, "utf8")).features[0].geometry;
  const vertices = flatten(geometry.coordinates);
  const lons = vertices.map((v) => v[0]);
  const lats = vertices.map((v) => v[1]);
  territories.push({
    country,
    feature: { type: "Feature", properties: {}, geometry },
    vertices,
    bbox: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
  });
}

function nearestVertexKm(p: { lat: number; lon: number }, t: Territory): number {
  let best = Infinity;
  for (const [lon, lat] of t.vertices) {
    const d = distanceKm(p, { lat, lon });
    if (d < best) best = d;
  }
  return best;
}

/** Exact signed distance (km) from p to a country's territory: negative = inside. */
function exactKm(p: { lat: number; lon: number }, t: Territory): number {
  return pointToPolygonDistance(point([p.lon, p.lat]), t.feature as never, { units: "kilometers" });
}

function answerFor(exporter: Country) {
  const target = antipode(exporter);
  const others = territories.filter((t) => t.country.iso !== exporter.iso);

  // Cheap pre-filter so exact distance only runs on plausible candidates: the 8 countries
  // with the closest vertex, plus any whose bounding box contains the point (a large country
  // can contain the point while all its vertices are far away).
  const byVertex = others
    .map((t) => ({ t, d: nearestVertexKm(target, t) }))
    .sort((a, b) => a.d - b.d);
  const candidates = new Set(byVertex.slice(0, 8).map((x) => x.t));
  for (const t of others) {
    const [minLon, minLat, maxLon, maxLat] = t.bbox;
    if (target.lon >= minLon && target.lon <= maxLon && target.lat >= minLat && target.lat <= maxLat) {
      candidates.add(t);
    }
  }

  let best: { t: Territory; d: number } | undefined;
  for (const t of candidates) {
    const d = exactKm(target, t);
    if (!best || d < best.d) best = { t, d };
  }
  return { a: best!.t.country.iso, km: Math.max(0, Math.round(best!.d)) };
}

const out: Record<string, { a: string; km: number }> = {};
for (const country of countries) {
  if (!(country.iso in exportsData)) continue; // only exporters with data become puzzles
  out[country.iso] = answerFor(country);
}

writeFileSync("src/data/puzzles.json", JSON.stringify(out, null, 1) + "\n");
console.log(`Wrote ${Object.keys(out).length} puzzles to src/data/puzzles.json`);
