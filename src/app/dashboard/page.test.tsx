import { describe, expect, it, vi } from "vitest";

const { getSessionUser, redirect } = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("@/lib/auth/server-session", () => ({ getSessionUser }));
vi.mock("next/navigation", () => ({ redirect }));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  it("redirects when authoritative session validation fails", async () => {
    getSessionUser.mockResolvedValueOnce(null);

    await expect(DashboardPage()).rejects.toThrow("redirect:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
