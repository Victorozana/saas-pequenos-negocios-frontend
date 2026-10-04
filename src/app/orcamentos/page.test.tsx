import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { replace } = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/components/quotations/quotation-list", () => ({
  QuotationList: () => <div data-testid="quotation-list">Lista de Orçamentos</div>,
}));

vi.mock("@/components/quotations/quotation-modal", () => ({
  QuotationModal: () => <div data-testid="quotation-modal">Modal Orçamento</div>,
}));

import OrcamentosPage from "./page";

describe("OrcamentosPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("redirects to /login when session check fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ message: "Unauthenticated" }, { status: 401 }),
    );

    render(<OrcamentosPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
  });

  it("renders page header and quotation components when authenticated", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        user: {
          id: "user-1",
          name: "Carlos Silva",
          email: "carlos@exemplo.com",
          role: "Admin",
          tenantId: "tenant-1",
          permissions: ["sales.read"],
          status: "Active",
        },
      }),
    );

    render(<OrcamentosPage />);

    expect(await screen.findByText("Gestão de Orçamentos")).toBeTruthy();
    expect(screen.getByTestId("quotation-list")).toBeTruthy();
    expect(screen.getByTestId("quotation-modal")).toBeTruthy();
  });
});
