import { describe, expect, it, vi } from "vitest";

import { AuthBackendError } from "@/lib/auth/backend";
import { handleDashboardReport } from "./route";

describe("dashboard report BFF route", () => {
  it("streams CSV file when token is valid", async () => {
    const csvContent = "Data,Faturamento,Agendamentos\n2026-08-13,1000,5\n";
    const encoder = new TextEncoder();
    const loadReport = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => encoder.encode(csvContent).buffer,
    });

    const response = await handleDashboardReport("valid-token", loadReport);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="relatorio-desempenho.csv"');

    const text = await response.text();
    expect(text).toContain("Data,Faturamento,Agendamentos");
  });

  it("returns 401 and expires cookie when no token is present", async () => {
    const response = await handleDashboardReport(undefined);

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });

  it("returns 401 and expires cookie on expired session error", async () => {
    const loadReport = vi.fn().mockRejectedValue(new AuthBackendError(401, "Expired"));

    const response = await handleDashboardReport("expired-token", loadReport);

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });

  it("returns safe 503 error on backend failure", async () => {
    const loadReport = vi.fn().mockRejectedValue(new AuthBackendError(500, "Internal Server Error"));

    const response = await handleDashboardReport("valid-token", loadReport);

    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.message).toBe("Não foi possível exportar o relatório agora. Tente novamente.");
  });
});
