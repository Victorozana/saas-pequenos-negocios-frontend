import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  fetchTodayAppointments,
  type TodayAppointment,
} from "@/lib/appointments/backend";
import {
  AuthBackendError,
  fetchCurrentUser,
  type UserProfile,
} from "@/lib/auth/backend";
import {
  SESSION_COOKIE_NAME,
  expiredSessionCookieOptions,
} from "@/lib/auth/session-cookie";

type ProfileLoader = (accessToken: string) => Promise<UserProfile>;
type AppointmentLoader = (
  accessToken: string,
  userId: string,
) => Promise<TodayAppointment[]>;

const SAFE_ERROR_MESSAGE =
  "Não foi possível carregar sua agenda agora. Tente novamente.";
const EXPIRED_SESSION_MESSAGE = "Sua sessão expirou. Entre novamente.";

function backendStatus(error: unknown): number | undefined {
  if (error instanceof AuthBackendError) return error.status;

  if (error instanceof Error && "status" in error) {
    const status = error.status;
    if (typeof status === "number") return status;
  }

  return undefined;
}

function isExpiredSession(error: unknown): boolean {
  const status = backendStatus(error);
  return status !== undefined && [401, 403, 404].includes(status);
}

function statusFor(error: unknown): number {
  const status = backendStatus(error);
  if (status !== undefined) return status >= 500 ? 503 : 502;

  return 502;
}

export async function handleTodayAgenda(
  accessToken: string | undefined,
  loadProfile: ProfileLoader = fetchCurrentUser,
  loadAppointments: AppointmentLoader = fetchTodayAppointments,
): Promise<NextResponse> {
  if (!accessToken) {
    const response = NextResponse.json(
      { message: EXPIRED_SESSION_MESSAGE },
      { status: 401 },
    );
    response.cookies.set(
      SESSION_COOKIE_NAME,
      "",
      expiredSessionCookieOptions(),
    );
    return response;
  }

  try {
    const user = await loadProfile(accessToken);
    const appointments = await loadAppointments(accessToken, user.id);
    return NextResponse.json({ user, appointments });
  } catch (error) {
    if (isExpiredSession(error)) {
      const response = NextResponse.json(
        { message: EXPIRED_SESSION_MESSAGE },
        { status: 401 },
      );
      response.cookies.set(
        SESSION_COOKIE_NAME,
        "",
        expiredSessionCookieOptions(),
      );
      return response;
    }

    return NextResponse.json(
      { message: SAFE_ERROR_MESSAGE },
      { status: statusFor(error) },
    );
  }
}

export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies();
  return handleTodayAgenda(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
