import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { fetchCurrentUser, type UserProfile } from "@/lib/auth/backend";
import { SESSION_COOKIE_NAME, expiredSessionCookieOptions } from "@/lib/auth/session-cookie";
import { 
  fetchAppointments, 
  createAppointment, 
  AppointmentBackendError,
  type CreateAppointmentPayload
} from "@/lib/appointments/backend";

type ProfileLoader = (accessToken: string) => Promise<UserProfile>;
type FetcherFunc = (accessToken: string, params?: any) => Promise<any>;
type CreatorFunc = (accessToken: string, payload: CreateAppointmentPayload) => Promise<{ id: string }>;

const SAFE_ERROR_MESSAGE = "Não foi possível processar os agendamentos agora. Tente novamente.";
const EXPIRED_SESSION_MESSAGE = "Sua sessão expirou. Entre novamente.";

function backendStatus(error: unknown): number | undefined {
  if (error instanceof AppointmentBackendError) return error.status;
  if (error instanceof Error && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

function isExpiredSession(error: unknown): boolean {
  const status = backendStatus(error);
  return status !== undefined && [401, 403].includes(status);
}

function statusFor(error: unknown): number {
  const status = backendStatus(error);
  if (status !== undefined) return status >= 500 ? 503 : 502;
  return 502;
}

export async function handleGetAppointments(
  accessToken: string | undefined,
  params: any,
  loadProfile: ProfileLoader = fetchCurrentUser,
  fetcher: FetcherFunc = fetchAppointments,
): Promise<NextResponse> {
  if (!accessToken) {
    const response = NextResponse.json({ message: EXPIRED_SESSION_MESSAGE }, { status: 401 });
    response.cookies.set(SESSION_COOKIE_NAME, "", expiredSessionCookieOptions());
    return response;
  }

  try {
    await loadProfile(accessToken);
    const data = await fetcher(accessToken, params);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (isExpiredSession(error)) {
      const response = NextResponse.json({ message: EXPIRED_SESSION_MESSAGE }, { status: 401 });
      response.cookies.set(SESSION_COOKIE_NAME, "", expiredSessionCookieOptions());
      return response;
    }
    return NextResponse.json({ message: SAFE_ERROR_MESSAGE }, { status: statusFor(error) });
  }
}

export async function handleCreateAppointment(
  accessToken: string | undefined,
  payload: CreateAppointmentPayload,
  loadProfile: ProfileLoader = fetchCurrentUser,
  creator: CreatorFunc = createAppointment,
): Promise<NextResponse> {
  if (!accessToken) {
    const response = NextResponse.json({ message: EXPIRED_SESSION_MESSAGE }, { status: 401 });
    response.cookies.set(SESSION_COOKIE_NAME, "", expiredSessionCookieOptions());
    return response;
  }

  try {
    await loadProfile(accessToken);
    const result = await creator(accessToken, payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (isExpiredSession(error)) {
      const response = NextResponse.json({ message: EXPIRED_SESSION_MESSAGE }, { status: 401 });
      response.cookies.set(SESSION_COOKIE_NAME, "", expiredSessionCookieOptions());
      return response;
    }
    if (error instanceof AppointmentBackendError && error.status === 400) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: SAFE_ERROR_MESSAGE }, { status: statusFor(error) });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const searchParams = request.nextUrl.searchParams;
  const params = {
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    assignedToUserId: searchParams.get("assignedToUserId") || undefined,
    workOrderId: searchParams.get("workOrderId") || undefined,
  };
  return handleGetAppointments(cookieStore.get(SESSION_COOKIE_NAME)?.value, params);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  let payload: CreateAppointmentPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }
  return handleCreateAppointment(cookieStore.get(SESSION_COOKIE_NAME)?.value, payload);
}
