import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

import type { UserProfile } from "@/lib/auth/backend";

import { AppShell } from "./app-shell";

const user: UserProfile = {
  id: "6c67977e-6965-4ab5-999a-0b56bf129eb7",
  name: "Vitória Lima",
  email: "vitoria@example.com",
  role: "Admin",
  tenantId: "0cbad8e6-caf7-47fe-85b0-b6c3e219689f",
  permissions: ["customers.read", "appointments.read"],
  status: "Active",
};

describe("AppShell", () => {
  it("shows only modules covered by the current profile permissions", () => {
    render(
      <AppShell user={user}>
        <p>Conteúdo protegido</p>
      </AppShell>,
    );

    expect(
      screen.getByRole("link", { name: /Visão geral/ }).getAttribute("href"),
    ).toBe("/dashboard");
    expect(screen.getByText("Clientes")).toBeTruthy();
    expect(screen.getByText("Agenda")).toBeTruthy();
    expect(screen.queryByText("Financeiro")).toBeNull();
    expect(screen.getAllByText("Em breve")).toHaveLength(2);
  });
});
