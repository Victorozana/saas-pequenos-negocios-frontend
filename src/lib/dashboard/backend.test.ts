import { describe, expect, it, vi } from "vitest";

import { AuthBackendError } from "@/lib/auth/backend";
import { fetchDashboardSummary, isDashboardSummary } from "./backend";

describe("dashboard backend client", () => {
  it("validates a complete DashboardSummary object", () => {
    const valid = {
      totalReceivedAmount: 15000,
      totalReceivableAmount: 3200,
      pendingWorkOrdersCount: 4,
      conversionMetrics: {
        totalQuotations: 10,
        approvedQuotations: 7,
        conversionRatePercentage: 70,
      },
    };

    expect(isDashboardSummary(valid)).toBe(true);
    expect(isDashboardSummary(null)).toBe(false);
    expect(isDashboardSummary({})).toBe(false);
    expect(isDashboardSummary({ totalReceivedAmount: "invalid" })).toBe(false);
  });

  it("fetches dashboard summary using Bearer authorization", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        totalReceivedAmount: 1000,
        totalReceivableAmount: 500,
        pendingWorkOrdersCount: 2,
        conversionMetrics: {
          totalQuotations: 5,
          approvedQuotations: 3,
          conversionRatePercentage: 60,
        },
      }),
    });

    const result = await fetchDashboardSummary("valid-token", fetcher as unknown as typeof fetch);

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:5050/api/v1/dashboard/summary",
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          Authorization: "Bearer valid-token",
        },
      }),
    );
    expect(result.totalReceivedAmount).toBe(1000);
  });

  it("throws AuthBackendError when backend returns an unauthenticated status", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(
      fetchDashboardSummary("expired-token", fetcher as unknown as typeof fetch),
    ).rejects.toThrow(AuthBackendError);
  });
});
