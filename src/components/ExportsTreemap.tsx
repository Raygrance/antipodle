import { squarify } from "../lib/treemap";
import { formatPct, formatUsd } from "../lib/format";
import type { ExportsEntry } from "../lib/game";

// Layout space for the treemap; the box is drawn at 100% width with this aspect ratio.
const W = 100;
const H = 62;

const COLORS = ["#3fb6a8", "#e0a33a", "#7b8fe8", "#e06c75", "#98c379", "#c678dd", "#56b6c2", "#d19a66"];
const OTHER_COLOR = "#3a4551";

export default function ExportsTreemap({ data }: { data: ExportsEntry }) {
  const shownShare = data.items.reduce((a, i) => a + i.s, 0);
  const other = Math.max(0, 1 - shownShare);

  const items = [
    ...data.items.map((i, idx) => ({ label: i.p, value: i.s, color: COLORS[idx % COLORS.length] })),
    ...(other >= 0.005 ? [{ label: "Other", value: other, color: OTHER_COLOR }] : []),
  ];
  const boxes = squarify(items, W, H);

  return (
    <div>
      {data.total != null && (
        <p className="total">
          Total exports <strong>{formatUsd(data.total)}</strong>
          {data.year ? <span className="total-year"> in {data.year}</span> : null}
        </p>
      )}
      <div
        className="treemap"
        role="img"
        aria-label={`Export shares: ${items.map((i) => `${i.label} ${formatPct(i.value)}`).join(", ")}`}
      >
        {boxes.map((b) => {
          const area = b.w * b.h;
          return (
            <div
              key={b.label}
              className="tm-box"
              title={`${b.label}: ${formatPct(b.value)}`}
              style={{
                left: `${(b.x / W) * 100}%`,
                top: `${(b.y / H) * 100}%`,
                width: `${(b.w / W) * 100}%`,
                height: `${(b.h / H) * 100}%`,
                background: b.color,
              }}
            >
              {area > 200 && <span className="tm-label">{b.label}</span>}
              {area > 90 && <span className="tm-pct">{formatPct(b.value)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
