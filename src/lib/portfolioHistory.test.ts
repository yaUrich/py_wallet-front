import { afterEach, describe, expect, it, vi } from "vitest";
import type { PortfolioHistory } from "../api/types";
import { buildDailyHistoryData, buildPortfolioChartData } from "./portfolioHistory";

type HistoryPoint = PortfolioHistory["points"][number];

function point(
  snapshot_at: string,
  total_usd: string,
  onchain_usd: string,
  cex_usd: string | null,
  manual_usd: string,
): HistoryPoint {
  return {
    snapshot_at,
    total_usd,
    sources: { onchain_usd, cex_usd, manual_usd },
  };
}

function localIso(day: number, hour: number) {
  return new Date(2026, 8, day, hour).toISOString();
}

afterEach(() => {
  vi.useRealTimers();
});

describe("portfolio history transforms", () => {
  it("sorts timestamps and combines source values without inventing CEX data", () => {
    const earlier = "2026-09-28T08:00:00.000Z";
    const shared = "2026-09-29T08:00:00.000Z";

    const result = buildPortfolioChartData(
      [
        point(shared, "100", "60", null, "40"),
        point(earlier, "75", "50", null, "25"),
        point(shared, "25", "0", "25", "0"),
      ],
      "en-US",
    );

    expect(result.map(({ timestamp }) => timestamp)).toEqual([earlier, shared]);
    expect(result[0]).toMatchObject({
      total: 75,
      onchain: 50,
      cex: null,
      manual: 25,
    });
    expect(result[1]).toMatchObject({
      total: 125,
      onchain: 60,
      cex: 25,
      manual: 40,
    });
  });

  it("seeds the window, keeps the latest daily snapshot, and carries gaps forward", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 29, 9));
    const chartPoints = buildPortfolioChartData(
      [
        point(localIso(25, 12), "90", "60", null, "30"),
        point(localIso(27, 10), "100", "70", null, "30"),
        point(localIso(27, 18), "120", "80", null, "40"),
        point(localIso(29, 9), "150", "100", "20", "30"),
      ],
      "en-US",
    );

    const result = buildDailyHistoryData(chartPoints, 3, "en-US");

    expect(
      result.map(({ day, total, previousTotal, delta, hasSnapshot }) => ({
        day,
        total,
        previousTotal,
        delta,
        hasSnapshot,
      })),
    ).toEqual([
      {
        day: "2026-09-27",
        total: 120,
        previousTotal: 90,
        delta: 30,
        hasSnapshot: true,
      },
      {
        day: "2026-09-28",
        total: 120,
        previousTotal: 120,
        delta: 0,
        hasSnapshot: false,
      },
      {
        day: "2026-09-29",
        total: 150,
        previousTotal: 120,
        delta: 30,
        hasSnapshot: true,
      },
    ]);
    expect(result[1]).toMatchObject({ onchain: 80, cex: null, manual: 40 });
  });
});
