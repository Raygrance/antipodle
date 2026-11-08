export type Point = { lat: number; lon: number };

const EARTH_RADIUS_KM = 6371;
const RAD = Math.PI / 180;

/** The point on the exact opposite side of the globe. */
export function antipode(p: Point): Point {
  return { lat: -p.lat, lon: p.lon > 0 ? p.lon - 180 : p.lon + 180 };
}

/** Great-circle distance in km (haversine). */
export function distanceKm(a: Point, b: Point): number {
  const dLat = (b.lat - a.lat) * RAD;
  const dLon = (b.lon - a.lon) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing from `from` to `to`, in degrees [0, 360). */
export function bearingDeg(from: Point, to: Point): number {
  const dLon = (to.lon - from.lon) * RAD;
  const y = Math.sin(dLon) * Math.cos(to.lat * RAD);
  const x =
    Math.cos(from.lat * RAD) * Math.sin(to.lat * RAD) -
    Math.sin(from.lat * RAD) * Math.cos(to.lat * RAD) * Math.cos(dLon);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

const ARROWS = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"];

/** Map a bearing to one of 8 arrow emoji. */
export function arrowFor(deg: number): string {
  return ARROWS[Math.round(deg / 45) % 8];
}
