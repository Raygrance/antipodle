import { describe, expect, it } from "vitest";
import { formatPct, formatUsd } from "./format";

describe("formatUsd", () => {
  it("formats trillions, billions, millions", () => {
    expect(formatUsd(1.23e12)).toBe("$1.23T");
    expect(formatUsd(456e9)).toBe("$456B");
    expect(formatUsd(12.34e9)).toBe("$12.3B");
    expect(formatUsd(850e6)).toBe("$850M");
  });

  it("drops trailing zeros", () => {
    expect(formatUsd(2e12)).toBe("$2T");
    expect(formatUsd(1.5e9)).toBe("$1.5B");
  });

  it("handles small values", () => {
    expect(formatUsd(5400)).toBe("$5.4K");
    expect(formatUsd(42)).toBe("$42");
  });
});

describe("formatPct", () => {
  it("rounds to whole percent and flags tiny shares", () => {
    expect(formatPct(0.446)).toBe("45%");
    expect(formatPct(0.004)).toBe("<1%");
    expect(formatPct(0.01)).toBe("1%");
  });
});
