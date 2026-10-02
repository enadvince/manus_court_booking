import { describe, expect, it } from "vitest";
import { dashboardBookings, getDashboardSummary } from "./adminDashboard";

describe("getDashboardSummary", () => {
  it("counts confirmed, open play, and available slots separately", () => {
    expect(getDashboardSummary(dashboardBookings)).toEqual({
      confirmed: 2,
      openPlay: 1,
      available: 1,
    });
  });

  it("returns zero for an empty schedule", () => {
    expect(getDashboardSummary([])).toEqual({ confirmed: 0, openPlay: 0, available: 0 });
  });
});
