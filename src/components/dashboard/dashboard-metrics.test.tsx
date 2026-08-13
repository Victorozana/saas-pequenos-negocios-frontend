import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardMetrics } from "./dashboard-metrics";

describe("DashboardMetrics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading skeleton while loading summary", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}));

    render(<DashboardMetrics />);

    expect(screen.getByRole("status").getAttribute("aria-label")).toBe("Carregando métricas executivas");
  });

  it("renders executive KPI cards when summary loads successfully", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        summary: {
          totalReceivedAmount: 15000,
          totalReceivableAmount: 3200,
          pendingWorkOrdersCount: 4,
          conversionMetrics: {
            totalQuotations: 10,
            approvedQuotations: 7,
            conversionRatePercentage: 70,
          },
        },
      }),
    );

    render(<DashboardMetrics />);

    expect(await screen.findByText("Resumo Executivo")).toBeTruthy();
    expect(screen.getByText(/15\.000,00/)).toBeTruthy();
    expect(screen.getByText(/3\.200,00/)).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("70.0%")).toBeTruthy();
    expect(screen.getByText("7 de 10 aprovados")).toBeTruthy();
  });

  it("renders safe error message when summary fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        { message: "Não foi possível carregar as métricas agora. Tente novamente." },
        { status: 503 },
      ),
    );

    render(<DashboardMetrics />);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Não foi possível carregar as métricas agora. Tente novamente.");
  });

  it("triggers CSV download when clicking export button", async () => {
    const createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/mock-uuid");
    const revokeObjectURLMock = vi.fn();
    Object.defineProperty(window, "URL", {
      writable: true,
      value: {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      },
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const path = typeof url === "string" ? url : url.toString();
      if (path === "/api/dashboard/summary") {
        return Promise.resolve(
          Response.json({
            summary: {
              totalReceivedAmount: 1000,
              totalReceivableAmount: 500,
              pendingWorkOrdersCount: 1,
              conversionMetrics: {
                totalQuotations: 2,
                approvedQuotations: 1,
                conversionRatePercentage: 50,
              },
            },
          }),
        );
      }
      if (path === "/api/dashboard/report") {
        return Promise.resolve(
          new Response("Data,Faturamento\n2026-08-13,1000\n", {
            headers: { "Content-Type": "text/csv" },
          }),
        );
      }
      return Promise.reject(new Error("Unknown route"));
    });

    render(<DashboardMetrics />);

    const exportButton = await screen.findByRole("button", { name: /exportar csv/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/dashboard/report");
      expect(createObjectURLMock).toHaveBeenCalled();
    });
  });
});
