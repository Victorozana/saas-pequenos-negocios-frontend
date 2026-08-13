import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { getSessionUser, redirect } = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("@/lib/auth/server-session", () => ({ getSessionUser }));
vi.mock("next/navigation", () => ({
  redirect,
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/components/dashboard/agenda-today", () => ({
  AgendaToday: () => <div>Agenda de hoje carregada</div>,
}));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  it("redirects when authoritative session validation fails", async () => {
    getSessionUser.mockResolvedValueOnce(null);

    await expect(DashboardPage()).rejects.toThrow("redirect:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("uses the authenticated person's identity and agenda as the dashboard focus", async () => {
    getSessionUser.mockResolvedValueOnce({
      id: "6c67977e-6965-4ab5-999a-0b56bf129eb7",
      name: "Vitória Lima",
      email: "vitoria@example.com",
      role: "Admin",
      tenantId: "0cbad8e6-caf7-47fe-85b0-b6c3e219689f",
      permissions: ["appointments.read"],
      status: "Active",
    });

    render(await DashboardPage());

    expect(screen.getByRole("heading", { name: "Olá, Vitória." })).toBeTruthy();
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
    expect(screen.getByText("Agenda de hoje carregada")).toBeTruthy();
  });
});
