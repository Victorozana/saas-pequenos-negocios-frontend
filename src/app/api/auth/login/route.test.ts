import { describe, expect, it, vi } from "vitest";

import { AuthBackendError } from "@/lib/auth/backend";

import { handleLogin } from "./route";

describe("login BFF route", () => {
  it("sets the session cookie without returning the access token", async () => {
    const authenticate = vi.fn(async () => ({
      accessToken: "private-token",
      expiresAt: "2026-08-11T20:00:00Z",
    }));

    const response = await handleLogin(
      { email: "vitoria@example.com", password: "secret" },
      authenticate,
    );

    const responseCopy = response.clone();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ authenticated: true });
    expect(response.headers.get("set-cookie")).toContain(
      "agendamento_session=private-token",
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(await responseCopy.text()).not.toContain("private-token");
  });

  it("returns a safe message and preserves a meaningful auth status", async () => {
    const authenticate = vi.fn(async () => {
      throw new AuthBackendError(401, "E-mail ou senha incorretos.");
    });

    const response = await handleLogin(
      { email: "vitoria@example.com", password: "wrong" },
      authenticate,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "E-mail ou senha incorretos.",
    });
  });
});
