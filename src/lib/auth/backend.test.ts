import { afterEach, describe, expect, it, vi } from "vitest";

import {
  authenticateWithBackend,
  fetchCurrentUser,
  getApiBaseUrl,
} from "./backend";

const profile = {
  id: "6c67977e-6965-4ab5-999a-0b56bf129eb7",
  name: "Vitória Lima",
  email: "vitoria@example.com",
  role: "Admin",
  tenantId: "0cbad8e6-caf7-47fe-85b0-b6c3e219689f",
  permissions: ["customers.read", "services.read"],
  status: "Active",
};

describe("auth backend adapter", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("requires a server API URL in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_BASE_URL", "");

    expect(() => getApiBaseUrl()).toThrow("API_BASE_URL is required in production");
  });

  it("uses the documented local API URL during development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("API_BASE_URL", "");

    expect(getApiBaseUrl()).toBe("http://localhost:5050");
  });

  it("creates a backend session without leaking credentials into the URL", async () => {
    const fetcher = vi.fn(async () =>
      Response.json({
        accessToken: "signed-token",
        expiresAt: "2026-08-11T20:00:00Z",
      }),
    );

    await expect(
      authenticateWithBackend(
        { email: "vitoria@example.com", password: "correct horse" },
        fetcher,
        "https://api.example.com/",
      ),
    ).resolves.toEqual({
      accessToken: "signed-token",
      expiresAt: "2026-08-11T20:00:00Z",
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/auth/sessions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "vitoria@example.com",
          password: "correct horse",
        }),
      }),
    );
  });

  it("maps a rejected login to a safe user-facing error", async () => {
    const fetcher = vi.fn(async () =>
      Response.json(
        { title: "Não foi possível iniciar a sessão." },
        { status: 401 },
      ),
    );

    await expect(
      authenticateWithBackend(
        { email: "vitoria@example.com", password: "wrong" },
        fetcher,
        "https://api.example.com",
      ),
    ).rejects.toMatchObject({
      status: 401,
      message: "E-mail ou senha incorretos.",
    });
  });

  it("loads the current profile with a bearer token", async () => {
    const fetcher = vi.fn(async () => Response.json(profile));

    await expect(
      fetchCurrentUser("signed-token", fetcher, "https://api.example.com"),
    ).resolves.toEqual(profile);

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.example.com/api/v1/users/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer signed-token",
        }),
      }),
    );
  });

  it("rejects malformed successful responses", async () => {
    const fetcher = vi.fn(async () => Response.json({ expiresAt: "tomorrow" }));

    await expect(
      authenticateWithBackend(
        { email: "vitoria@example.com", password: "secret" },
        fetcher,
        "https://api.example.com",
      ),
    ).rejects.toMatchObject({ status: 502 });
  });
});
