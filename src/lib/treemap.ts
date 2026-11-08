export type Rect = { x: number; y: number; w: number; h: number };

function worst(areas: number[], side: number): number {
  const sum = areas.reduce((a, b) => a + b, 0);
  const max = Math.max(...areas);
  const min = Math.min(...areas);
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
}

/**
 * Squarified treemap (Bruls, Huizing, van Wijk). Lays `items` out inside a W x H rectangle
 * so that each rectangle's area is proportional to its value. Returns items sorted by value
 * descending, each with x, y, w, h in the same units as W and H.
 */
export function squarify<T extends { value: number }>(
  input: T[],
  W: number,
  H: number,
): Array<T & Rect> {
  const positive = input.filter((i) => i.value > 0);
  const total = positive.reduce((a, i) => a + i.value, 0);
  if (total <= 0) return [];

  const items = [...positive]
    .sort((a, b) => b.value - a.value)
    .map((item) => ({ item, area: (item.value / total) * W * H }));

  const out: Array<T & Rect> = [];
  let x = 0;
  let y = 0;
  let w = W;
  let h = H;
  let i = 0;

  while (i < items.length) {
    const side = Math.min(w, h);
    let row = [items[i]];
    let j = i + 1;
    while (j < items.length) {
      const next = [...row, items[j]];
      if (worst(next.map((r) => r.area), side) <= worst(row.map((r) => r.area), side)) {
        row = next;
        j++;
      } else {
        break;
      }
    }

    const rowArea = row.reduce((a, r) => a + r.area, 0);
    if (w >= h) {
      // lay the row as a column on the left edge
      const colW = rowArea / h;
      let cy = y;
      for (const r of row) {
        const rh = r.area / colW;
        out.push({ ...r.item, x, y: cy, w: colW, h: rh });
        cy += rh;
      }
      x += colW;
      w -= colW;
    } else {
      // lay the row along the top edge
      const rowH = rowArea / w;
      let cx = x;
      for (const r of row) {
        const rw = r.area / rowH;
        out.push({ ...r.item, x: cx, y, w: rw, h: rowH });
        cx += rw;
      }
      y += rowH;
      h -= rowH;
    }
    i = j;
  }
  return out;
}
