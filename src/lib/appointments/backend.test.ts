import { describe, expect, it, vi } from "vitest";

import {
  AppointmentBackendError,
  createAppointment,
  fetchTodayAppointments,
} from "./backend";

it("preserves the work order validation message from ProblemDetails", async () => {
  await expect(createAppointment("token", {
    type: 1,
    startTime: "2026-10-11T12:00:00Z",
    endTime: "2026-10-11T13:00:00Z",
    workOrderId: "missing",
  }, async () => Response.json({ title: "A ordem de serviço informada não foi encontrada." }, { status: 400 }), "http://localhost:5050"))
    .rejects.toMatchObject({ status: 400, message: "A ordem de serviço informada não foi encontrada." });
});

describe("fetchTodayAppointments", () => {
  it("queries the backend day and visibility policy and returns appointments ordered by time", async () => {
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
      fetcher,
      "http://localhost:5050",
    );

    const [url, request] = fetcher.mock.calls[0] as unknown as [
      URL,
      RequestInit,
    ];
    expect(url.toString()).toBe(
      "http://localhost:5050/api/v1/appointments/today",
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
        async () => Response.json([{ id: "missing-fields" }]),
        "http://localhost:5050",
      ),
    ).rejects.toEqual(
      expect.objectContaining<Partial<AppointmentBackendError>>({ status: 502 }),
    );
  });
});
