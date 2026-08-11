import { describe, expect, it, vi } from "vitest";

import { AuthBackendError, type UserProfile } from "@/lib/auth/backend";

import { handleSession } from "./route";

const profile: UserProfile = {
  id: "6c67977e-6965-4ab5-999a-0b56bf129eb7",
  name: "Vitória Lima",
  email: "vitoria@example.com",
  role: "Admin",
  tenantId: "0cbad8e6-caf7-47fe-85b0-b6c3e219689f",
  permissions: ["customers.read"],
  status: "Active",
};

describe("session BFF route", () => {
  it("returns 401 without a session cookie", async () => {
    const loadProfile = vi.fn();

    const response = await handleSession(undefined, loadProfile);

    expect(response.status).toBe(401);
    expect(loadProfile).not.toHaveBeenCalled();
  });

  it("returns only the public profile for a valid session", async () => {
    const loadProfile = vi.fn(async () => profile);

    const response = await handleSession("private-token", loadProfile);

    const responseCopy = response.clone();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: profile });
    expect(await responseCopy.text()).not.toContain("private-token");
  });

  it("expires the cookie when the backend rejects the session", async () => {
    const loadProfile = vi.fn(async () => {
      throw new AuthBackendError(401, "Sua sessão expirou. Entre novamente.");
    });

    const response = await handleSession("expired-token", loadProfile);

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
