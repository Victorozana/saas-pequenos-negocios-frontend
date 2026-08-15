import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { replace } = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/components/services/service-list", () => ({
  ServiceList: () => <div data-testid="service-list">Lista de Serviços</div>,
}));

vi.mock("@/components/services/service-form-modal", () => ({
  ServiceFormModal: () => <div data-testid="service-modal">Modal Form</div>,
}));

import ServicosPage from "./page";

describe("ServicosPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("redirects to /login when session check fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ message: "Unauthenticated" }, { status: 401 }),
    );

    render(<ServicosPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
  });

  it("renders page header and service components when authenticated", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        user: {
          id: "user-1",
          name: "Carlos Silva",
          email: "carlos@exemplo.com",
          role: "Admin",
          tenantId: "tenant-1",
          permissions: ["services.read"],
          status: "Active",
        },
      }),
    );

    render(<ServicosPage />);

    expect(await screen.findByText("Catálogo de Serviços")).toBeTruthy();
    expect(screen.getByTestId("service-list")).toBeTruthy();
    expect(screen.getByTestId("service-modal")).toBeTruthy();
  });
});
