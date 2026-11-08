import { describe, expect, it } from "vitest";
import { squarify } from "./treemap";

const items = [
  { id: "a", value: 45 },
  { id: "b", value: 20 },
  { id: "c", value: 15 },
  { id: "d", value: 10 },
  { id: "e", value: 6 },
  { id: "f", value: 4 },
];

describe("squarify", () => {
  const W = 100;
  const H = 62;
  const boxes = squarify(items, W, H);

  it("returns one box per item", () => {
    expect(boxes.map((b) => b.id).sort()).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("fills the whole rectangle (areas sum to W*H)", () => {
    const area = boxes.reduce((a, b) => a + b.w * b.h, 0);
    expect(area).toBeCloseTo(W * H, 6);
  });

  it("each box's area is proportional to its value", () => {
    const total = items.reduce((a, i) => a + i.value, 0);
    for (const b of boxes) {
      expect((b.w * b.h) / (W * H)).toBeCloseTo(b.value / total, 6);
    }
  });

  it("keeps every box inside the bounds", () => {
    for (const b of boxes) {
      expect(b.x).toBeGreaterThanOrEqual(-1e-9);
      expect(b.y).toBeGreaterThanOrEqual(-1e-9);
      expect(b.x + b.w).toBeLessThanOrEqual(W + 1e-9);
      expect(b.y + b.h).toBeLessThanOrEqual(H + 1e-9);
    }
  });

  it("boxes do not overlap", () => {
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlapW = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapH = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        expect(overlapW > 1e-9 && overlapH > 1e-9).toBe(false);
      }
    }
  });

  it("handles empty or zero-value input", () => {
    expect(squarify([], W, H)).toEqual([]);
    expect(squarify([{ value: 0 }], W, H)).toEqual([]);
  });

  it("handles a single item", () => {
    const [only] = squarify([{ value: 5 }], W, H);
    expect(only).toMatchObject({ x: 0, y: 0, w: W, h: H });
  });
});
