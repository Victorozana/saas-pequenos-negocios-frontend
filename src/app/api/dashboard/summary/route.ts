import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  AuthBackendError,
  fetchCurrentUser,
  type UserProfile,
} from "@/lib/auth/backend";
import {
  SESSION_COOKIE_NAME,
  expiredSessionCookieOptions,
} from "@/lib/auth/session-cookie";
import {
  type DashboardSummary,
  fetchDashboardSummary,
} from "@/lib/dashboard/backend";

type ProfileLoader = (accessToken: string) => Promise<UserProfile>;
type SummaryLoader = (accessToken: string) => Promise<DashboardSummary>;

const SAFE_ERROR_MESSAGE =
  "Não foi possível carregar as métricas agora. Tente novamente.";
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

export async function handleDashboardSummary(
  accessToken: string | undefined,
  loadProfile: ProfileLoader = fetchCurrentUser,
  loadSummary: SummaryLoader = fetchDashboardSummary,
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
    const summary = await loadSummary(accessToken);
    return NextResponse.json({ user, summary });
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
  return handleDashboardSummary(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
