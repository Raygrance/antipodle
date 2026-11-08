/** Compact US-dollar amount: 1.23T, 456B, 12.3B, 850M. */
export function formatUsd(value: number): string {
  const abs = Math.abs(value);
  const units: Array<[number, string]> = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const n = value / size;
      const digits = Math.abs(n) >= 100 ? 0 : Math.abs(n) >= 10 ? 1 : 2;
      const fixed = n.toFixed(digits);
      // only trim zeros after a decimal point ("1.50" -> "1.5", but never "850" -> "85")
      const trimmed = fixed.includes(".") ? fixed.replace(/\.?0+$/, "") : fixed;
      return `$${trimmed}${suffix}`;
    }
  }
  return `$${Math.round(value)}`;
}

/** Share as a percentage label; shows "<1%" for tiny slices. */
export function formatPct(share: number): string {
  const pct = share * 100;
  return pct < 1 ? "<1%" : `${Math.round(pct)}%`;
}
