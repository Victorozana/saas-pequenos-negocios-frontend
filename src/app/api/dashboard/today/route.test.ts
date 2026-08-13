import { describe, expect, it, vi } from "vitest";

import { AuthBackendError, type UserProfile } from "@/lib/auth/backend";

import { handleTodayAgenda } from "./route";

const user: UserProfile = {
  id: "6c67977e-6965-4ab5-999a-0b56bf129eb7",
  name: "Vitória Lima",
  email: "vitoria@example.com",
  role: "Admin",
  tenantId: "0cbad8e6-caf7-47fe-85b0-b6c3e219689f",
  permissions: ["appointments.read"],
  status: "Active",
};

const appointments = [
  {
    id: "7a6b8a65-8b5c-4ab7-998a-0b56bf129eb7",
    type: "OnSite",
    startTime: "2026-08-12T13:00:00.000Z",
    endTime: "2026-08-12T14:00:00.000Z",
    address: "Rua das Flores, 10",
  },
];

describe("today agenda BFF route", () => {
  it("returns only the public profile and today's appointments for a valid session", async () => {
    const loadProfile = vi.fn(async () => user);
    const loadAppointments = vi.fn(async () => appointments);

    const response = await handleTodayAgenda(
      "private-token",
      loadProfile,
      loadAppointments,
    );

    const responseCopy = response.clone();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user, appointments });
    expect(loadAppointments).toHaveBeenCalledWith("private-token", user.id);
    expect(await responseCopy.text()).not.toContain("private-token");
  });

  it("returns an empty agenda without converting it into an error", async () => {
    const response = await handleTodayAgenda(
      "private-token",
      async () => user,
      async () => [],
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user, appointments: [] });
  });

  it("expires a missing local session cookie", async () => {
    const response = await handleTodayAgenda(undefined);

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("maps backend and network failures to a safe message", async () => {
    const response = await handleTodayAgenda(
      "private-token",
      async () => user,
      async () => {
        throw new AuthBackendError(503, "connection reset by upstream");
      },
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      message: "Não foi possível carregar sua agenda agora. Tente novamente.",
    });
  });

  it.each([401, 403, 404])(
    "expires the cookie when the backend rejects a session with %i",
    async (status) => {
      const response = await handleTodayAgenda(
        "expired-token",
        async () => {
          throw new AuthBackendError(status, "Backend session rejection");
        },
        vi.fn(),
      );

      expect(response.status).toBe(401);
      expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
      await expect(response.json()).resolves.toEqual({
        message: "Sua sessão expirou. Entre novamente.",
      });
    },
  );
});
