import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SESSION_COOKIE_NAME,
  createSessionCookieOptions,
} from "./session-cookie";

describe("session cookie", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is inaccessible to JavaScript and follows the backend expiry", () => {
    vi.stubEnv("NODE_ENV", "development");
    const expiresAt = "2026-08-11T20:00:00Z";

    expect(SESSION_COOKIE_NAME).toBe("agendamento_session");
    expect(createSessionCookieOptions(expiresAt)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
      expires: new Date(expiresAt),
    });
  });

  it("requires HTTPS transport in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(createSessionCookieOptions("2026-08-11T20:00:00Z").secure).toBe(
      true,
    );
  });
});
