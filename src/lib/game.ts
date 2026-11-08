import countriesJson from "../data/countries.json";
import exportsJson from "../data/exports.json";
import puzzlesJson from "../data/puzzles.json";
import { antipode, distanceKm, bearingDeg, arrowFor, type Point } from "./geo";

export type Country = { iso: string; iso3: string; name: string; lat: number; lon: number };
export type ExportItem = { p: string; s: number };
export type ExportsEntry = { total?: number; year?: number; items: ExportItem[] };
export type DataMeta = { source: string; retrieved?: string; level?: string };

export const MAX_GUESSES = 6;

/**
 * Puzzles whose answer's border is further than this from the true antipodal point feel
 * unfair (e.g. Canada -> South Africa, ~3,300 km away), so they're kept out of rotation.
 * Raise it for a bigger pool, lower it for tighter puzzles.
 */
export const MAX_OFFSET_KM = 1500;

export const countries: Country[] = countriesJson;
export const byIso = new Map(countries.map((c) => [c.iso, c]));

const exportData = exportsJson as unknown as Record<string, unknown>;
const puzzleRows = puzzlesJson as Record<string, { a: string; km: number }>;

export const dataMeta = exportData._meta as DataMeta | undefined;

/** Exporters that have both trade data and a precomputed answer. */
export const exporters: string[] = Object.keys(puzzleRows)
  .filter((iso) => byIso.has(iso) && iso in exportData)
  .sort();

export const playableExporters: string[] = exporters.filter(
  (iso) => puzzleRows[iso].km <= MAX_OFFSET_KM,
);

export function exportsOf(iso: string): ExportsEntry {
  return exportData[iso] as ExportsEntry;
}

export type Puzzle = {
  exporter: Country;
  antipodePoint: Point;
  answer: Country;
  /** km from the antipodal point to the answer's centroid (0 = bullseye) */
  answerOffsetKm: number;
};

/** Looks up the precomputed answer for an exporter (see scripts/build-puzzles.ts). */
export function buildPuzzle(exporterIso: string): Puzzle {
  const exporter = byIso.get(exporterIso)!;
  const row = puzzleRows[exporterIso];
  return {
    exporter,
    antipodePoint: antipode(exporter),
    answer: byIso.get(row.a)!,
    answerOffsetKm: row.km,
  };
}

export type GuessFeedback = {
  country: Country;
  km: number;
  arrow: string;
  correct: boolean;
};

export function judge(guessIso: string, puzzle: Puzzle): GuessFeedback {
  const country = byIso.get(guessIso)!;
  const correct = country.iso === puzzle.answer.iso;
  return {
    country,
    correct,
    km: Math.round(distanceKm(country, puzzle.answer)),
    arrow: correct ? "🎯" : arrowFor(bearingDeg(country, puzzle.answer)),
  };
}

// ---- daily selection -------------------------------------------------------

function hash32(n: number): number {
  let x = (n + 0x9e3779b9) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

/** Days since 1970-01-01 in the player's local timezone. */
export function localDayNumber(d = new Date()): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / 86_400_000);
}

/** Deterministic shuffle so every country comes up once per cycle. */
export function exporterForDay(day: number): string {
  const order = [...playableExporters].sort((a, b) => {
    const ha = hash32(a.charCodeAt(0) * 256 + a.charCodeAt(1));
    const hb = hash32(b.charCodeAt(0) * 256 + b.charCodeAt(1));
    return ha - hb;
  });
  return order[((day % order.length) + order.length) % order.length];
}

export function randomExporter(except?: string): string {
  const pool = playableExporters.filter((e) => e !== except);
  return pool[Math.floor(Math.random() * pool.length)];
}
