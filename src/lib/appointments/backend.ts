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

export type Appointment = {
  id: string;
  workOrderId?: string;
  type: string;
  startTime: string;
  endTime: string;
  address?: string;
  notes?: string;
  assignedToUserId?: string;
};

export type CreateAppointmentPayload = {
  workOrderId?: string;
  type: number;
  startTime: string;
  endTime: string;
  address?: string;
  notes?: string;
  assignedToUserId?: string;
};

export type UpdateAppointmentPayload = {
  startTime: string;
  endTime: string;
  assignedToUserId?: string;
};

export async function fetchAppointments(
  accessToken: string,
  params?: {
    startDate?: string;
    endDate?: string;
    assignedToUserId?: string;
    workOrderId?: string;
  },
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<Appointment[]> {
  const url = new URL("/api/v1/appointments", `${normalizeApiBaseUrl(baseUrl)}/`);
  if (params) {
    if (params.startDate) url.searchParams.append("startDate", params.startDate);
    if (params.endDate) url.searchParams.append("endDate", params.endDate);
    if (params.assignedToUserId) url.searchParams.append("assignedToUserId", params.assignedToUserId);
    if (params.workOrderId) url.searchParams.append("workOrderId", params.workOrderId);
  }

  const response = await fetcher(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new AppointmentBackendError(response.status, "Failed to fetch appointments");
  }

  return response.json();
}

export async function createAppointment(
  accessToken: string,
  payload: CreateAppointmentPayload,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<{ id: string }> {
  const response = await fetcher(`${normalizeApiBaseUrl(baseUrl)}/api/v1/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new AppointmentBackendError(response.status, data.error || "Failed to create appointment");
  }

  return response.json();
}

export async function updateAppointment(
  accessToken: string,
  id: string,
  payload: UpdateAppointmentPayload,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<void> {
  const response = await fetcher(`${normalizeApiBaseUrl(baseUrl)}/api/v1/appointments/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new AppointmentBackendError(response.status, data.error || "Failed to update appointment");
  }
}
