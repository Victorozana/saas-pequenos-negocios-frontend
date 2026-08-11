import { describe, expect, it, vi } from "vitest";

import { AuthBackendError, type UserProfile } from "./backend";
import { resolveSessionUser } from "./server-session";

const profile: UserProfile = {
  id: "6c67977e-6965-4ab5-999a-0b56bf129eb7",
  name: "Vitória Lima",
  email: "vitoria@example.com",
  role: "Admin",
  tenantId: "0cbad8e6-caf7-47fe-85b0-b6c3e219689f",
  permissions: ["customers.read"],
  status: "Active",
};

describe("authoritative server session", () => {
  it("returns null when no cookie exists", async () => {
    const loader = vi.fn();

    await expect(resolveSessionUser(undefined, loader)).resolves.toBeNull();
    expect(loader).not.toHaveBeenCalled();
  });

  it("returns the backend profile for a valid token", async () => {
    const loader = vi.fn(async () => profile);

    await expect(resolveSessionUser("private-token", loader)).resolves.toBe(
      profile,
    );
  });

  it("treats a rejected token as an absent session", async () => {
    const loader = vi.fn(async () => {
      throw new AuthBackendError(401, "expired");
    });

    await expect(resolveSessionUser("expired-token", loader)).resolves.toBeNull();
  });

  it("does not disguise backend outages as an expired session", async () => {
    const loader = vi.fn(async () => {
      throw new AuthBackendError(503, "offline");
    });

    await expect(resolveSessionUser("private-token", loader)).rejects.toThrow(
      "offline",
    );
  });
});
