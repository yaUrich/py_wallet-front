import { describe, expect, it } from "vitest";
import { formatUsd, shortAddress, toNumber } from "./format";

describe("formatUsd", () => {
  it("falls back to zero for missing and non-finite values", () => {
    expect(formatUsd()).toBe("$0.00");
    expect(formatUsd(null)).toBe("$0.00");
    expect(formatUsd("NaN")).toBe("$0.00");
    expect(formatUsd("not-a-number")).toBe("$0.00");
    expect(formatUsd(Number.POSITIVE_INFINITY)).toBe("$0.00");
    expect(formatUsd("1e1000")).toBe("$0.00");
  });

  it("keeps cents below one thousand and rounds larger totals", () => {
    expect(formatUsd("999.99")).toBe("$999.99");
    expect(formatUsd("1234.56")).toBe("$1,235");
  });
});

describe("toNumber", () => {
  it("converts finite values and normalizes unusable values to zero", () => {
    expect(toNumber("12.50")).toBe(12.5);
    expect(toNumber(-3)).toBe(-3);
    expect(toNumber(null)).toBe(0);
    expect(toNumber("not-a-number")).toBe(0);
    expect(toNumber(Number.NEGATIVE_INFINITY)).toBe(0);
    expect(toNumber("1e1000")).toBe(0);
  });
});

describe("shortAddress", () => {
  it("labels addressless assets as manual", () => {
    expect(shortAddress()).toBe("manual");
    expect(shortAddress(null)).toBe("manual");
    expect(shortAddress("")).toBe("manual");
  });

  it("keeps short addresses and truncates long addresses deterministically", () => {
    expect(shortAddress("short-wallet")).toBe("short-wallet");
    expect(shortAddress("0x1234567890abcdef")).toBe("0x1234...cdef");
  });
});
