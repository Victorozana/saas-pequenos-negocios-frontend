import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { replace } = vi.hoisted(() => ({
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/components/customers/customer-list", () => ({
  CustomerList: () => <div data-testid="customer-list">Lista de Clientes</div>,
}));

vi.mock("@/components/customers/customer-form-modal", () => ({
  CustomerFormModal: () => <div data-testid="customer-modal">Modal Form</div>,
}));

import ClientesPage from "./page";

describe("ClientesPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("redirects to /login when session check fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ message: "Unauthenticated" }, { status: 401 }),
    );

    render(<ClientesPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
  });

  it("renders page header and customer components when authenticated", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        user: {
          id: "user-1",
          name: "Lucas Alvares",
          email: "lucas@exemplo.com",
          role: "Admin",
          tenantId: "tenant-1",
          permissions: ["customers.read"],
          status: "Active",
        },
      }),
    );

    render(<ClientesPage />);

    expect(await screen.findByText("Gestão de Clientes")).toBeTruthy();
    expect(screen.getByTestId("customer-list")).toBeTruthy();
    expect(screen.getByTestId("customer-modal")).toBeTruthy();
  });
});
