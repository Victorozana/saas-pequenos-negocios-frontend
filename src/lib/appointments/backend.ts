import { normalizeApiBaseUrl } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/auth/backend";

export type TodayAppointment = {
  id: string;
  type: string;
  startTime: string;
  endTime: string;
  address?: string;
};

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class AppointmentBackendError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AppointmentBackendError";
  }
}

function isTodayAppointment(value: unknown): value is TodayAppointment {
  if (!value || typeof value !== "object") return false;

  const appointment = value as Partial<TodayAppointment>;
  return (
    typeof appointment.id === "string" &&
    typeof appointment.type === "string" &&
    typeof appointment.startTime === "string" &&
    !Number.isNaN(Date.parse(appointment.startTime)) &&
    typeof appointment.endTime === "string" &&
    !Number.isNaN(Date.parse(appointment.endTime)) &&
    (appointment.address === undefined || typeof appointment.address === "string")
  );
}

function currentDayRange(now: Date): { startDate: string; endDate: string } {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export async function fetchTodayAppointments(
  accessToken: string,
  assignedToUserId: string,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
  now = new Date(),
): Promise<TodayAppointment[]> {
  const range = currentDayRange(now);
  const url = new URL(
    "/api/v1/appointments/",
    `${normalizeApiBaseUrl(baseUrl)}/`,
  );
  url.search = new URLSearchParams({
    ...range,
    assignedToUserId,
  }).toString();

  let response: Response;
  try {
    response = await fetcher(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
  } catch {
    throw new AppointmentBackendError(503, "Agenda backend unavailable");
  }

  if (!response.ok) {
    throw new AppointmentBackendError(response.status, "Agenda backend rejected request");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AppointmentBackendError(502, "Agenda backend returned invalid JSON");
  }

  if (!Array.isArray(payload) || !payload.every(isTodayAppointment)) {
    throw new AppointmentBackendError(502, "Agenda backend returned an invalid payload");
  }

  return payload.sort(
    (first, second) =>
      new Date(first.startTime).getTime() - new Date(second.startTime).getTime(),
  );
}
