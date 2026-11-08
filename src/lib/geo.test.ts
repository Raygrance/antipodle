import { describe, expect, it } from "vitest";
import { antipode, bearingDeg, distanceKm } from "./geo";
import {
  buildPuzzle,
  exporters,
  exporterForDay,
  playableExporters,
  MAX_OFFSET_KM,
} from "./game";

describe("geo", () => {
  it("antipode flips latitude and shifts longitude by 180", () => {
    expect(antipode({ lat: 40, lon: -4 })).toEqual({ lat: -40, lon: 176 });
    expect(antipode({ lat: -34, lon: -64 })).toEqual({ lat: 34, lon: 116 });
  });

  it("antipode of antipode is the original point", () => {
    const p = { lat: 12.3, lon: 45.6 };
    const back = antipode(antipode(p));
    expect(back.lat).toBeCloseTo(p.lat, 9);
    expect(back.lon).toBeCloseTo(p.lon, 9);
  });

  it("distance: quarter of the equator is ~10,007 km", () => {
    const d = distanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 90 });
    expect(d).toBeGreaterThan(10000);
    expect(d).toBeLessThan(10015);
  });

  it("distance to antipode is half the circumference (~20,015 km)", () => {
    const d = distanceKm({ lat: 40, lon: -4 }, antipode({ lat: 40, lon: -4 }));
    expect(Math.round(d)).toBe(20015);
  });

  it("bearing: due east is 90, due north is 0", () => {
    expect(Math.round(bearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: 10 }))).toBe(90);
    expect(Math.round(bearingDeg({ lat: 0, lon: 0 }, { lat: 10, lon: 0 }))).toBe(0);
  });
});

describe("puzzles", () => {
  it("Spain's opposite is New Zealand", () => {
    expect(buildPuzzle("ES").answer.iso).toBe("NZ");
  });

  it("Argentina's opposite is China", () => {
    expect(buildPuzzle("AR").answer.iso).toBe("CN");
  });

  it("Chile's opposite is China", () => {
    expect(buildPuzzle("CL").answer.iso).toBe("CN");
  });

  it("every exporter yields an answer that is not itself", () => {
    for (const iso of exporters) {
      expect(buildPuzzle(iso).answer.iso).not.toBe(iso);
    }
  });

  it("daily pick is deterministic and cycles through all exporters", () => {
    expect(exporterForDay(20000)).toBe(exporterForDay(20000));
    const seen = new Set(playableExporters.map((_, i) => exporterForDay(i)));
    expect(seen.size).toBe(playableExporters.length);
  });

  it("Colombia's and Ecuador's antipodes are next to Indonesia and Malaysia, not Singapore", () => {
    expect(buildPuzzle("CO").answer.iso).toBe("ID");
    expect(buildPuzzle("EC").answer.iso).toBe("MY");
  });

  it("land-on-land antipodes have zero offset", () => {
    expect(buildPuzzle("ES").answerOffsetKm).toBe(0);
    expect(buildPuzzle("AR").answerOffsetKm).toBe(0);
  });

  it("rotation excludes stretched puzzles like Canada and Australia", () => {
    expect(playableExporters).not.toContain("CA");
    expect(playableExporters).not.toContain("AU");
    for (const iso of playableExporters) {
      expect(buildPuzzle(iso).answerOffsetKm).toBeLessThanOrEqual(MAX_OFFSET_KM);
    }
  });
});
