import { describe, expect, it, vi } from "vitest";

import { AuthBackendError, type UserProfile } from "@/lib/auth/backend";
import { type DashboardSummary } from "@/lib/dashboard/backend";
import { handleDashboardSummary } from "./route";

const mockUser: UserProfile = {
  id: "user-123",
  name: "João Silva",
  email: "joao@exemplo.com",
  role: "owner_admin",
  tenantId: "tenant-123",
  permissions: ["view:dashboard"],
  status: "ACTIVE",
};

const mockSummary: DashboardSummary = {
  totalReceivedAmount: 25000,
  totalReceivableAmount: 5400,
  pendingWorkOrdersCount: 3,
  conversionMetrics: {
    totalQuotations: 12,
    approvedQuotations: 9,
    conversionRatePercentage: 75,
  },
};

describe("dashboard summary BFF route", () => {
  it("returns user and summary when token is valid", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const loadSummary = vi.fn().mockResolvedValue(mockSummary);

    const response = await handleDashboardSummary("valid-token", loadProfile, loadSummary);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user.name).toBe("João Silva");
    expect(data.summary.totalReceivedAmount).toBe(25000);
    expect(data.summary.conversionMetrics.conversionRatePercentage).toBe(75);
  });

  it("returns 401 and expires cookie when no token is present", async () => {
    const response = await handleDashboardSummary(undefined);

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });

  it("returns 401 and expires cookie on expired backend session", async () => {
    const loadProfile = vi.fn().mockRejectedValue(new AuthBackendError(401, "Expired"));

    const response = await handleDashboardSummary("expired-token", loadProfile);

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });

  it("returns safe 502/503 message on backend failure", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const loadSummary = vi.fn().mockRejectedValue(new AuthBackendError(500, "Internal Server Error"));

    const response = await handleDashboardSummary("token", loadProfile, loadSummary);

    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.message).toBe("Não foi possível carregar as métricas agora. Tente novamente.");
  });
});
