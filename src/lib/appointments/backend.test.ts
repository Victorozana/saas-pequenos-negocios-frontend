import { describe, expect, it, vi } from "vitest";

import {
  AppointmentBackendError,
  fetchTodayAppointments,
} from "./backend";

describe("fetchTodayAppointments", () => {
  it("queries the assigned person's current day and returns appointments ordered by time", async () => {
    const fetcher = vi.fn(async () =>
      Response.json([
        {
          id: "late",
          type: "Remote",
          startTime: "2026-08-12T15:00:00.000Z",
          endTime: "2026-08-12T16:00:00.000Z",
        },
        {
          id: "early",
          type: "OnSite",
          startTime: "2026-08-12T13:00:00.000Z",
          endTime: "2026-08-12T14:00:00.000Z",
          address: "Rua das Flores, 10",
        },
      ]),
    );

    const appointments = await fetchTodayAppointments(
      "private-token",
      "user-123",
      fetcher,
      "http://localhost:5050",
      new Date("2026-08-12T15:30:00.000Z"),
    );

    const [url, request] = fetcher.mock.calls[0] as unknown as [
      URL,
      RequestInit,
    ];
    expect(url.toString()).toBe(
      "http://localhost:5050/api/v1/appointments/?startDate=2026-08-12T03%3A00%3A00.000Z&endDate=2026-08-13T03%3A00%3A00.000Z&assignedToUserId=user-123",
    );
    expect(request).toMatchObject({
      cache: "no-store",
      headers: { Authorization: "Bearer private-token" },
    });
    expect(appointments.map((appointment) => appointment.id)).toEqual([
      "early",
      "late",
    ]);
    expect(appointments[1]).not.toHaveProperty("address");
  });

  it("rejects a malformed backend payload safely", async () => {
    await expect(
      fetchTodayAppointments(
        "private-token",
        "user-123",
        async () => Response.json([{ id: "missing-fields" }]),
        "http://localhost:5050",
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<AppointmentBackendError>>({ status: 502 }),
    );
  });
});
