import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { fetchCurrentUser, type UserProfile } from "@/lib/auth/backend";
import { SESSION_COOKIE_NAME, expiredSessionCookieOptions } from "@/lib/auth/session-cookie";
import { 
  updateAppointment, 
  AppointmentBackendError,
  type UpdateAppointmentPayload
} from "@/lib/appointments/backend";

type ProfileLoader = (accessToken: string) => Promise<UserProfile>;
type UpdaterFunc = (accessToken: string, id: string, payload: UpdateAppointmentPayload) => Promise<void>;

const SAFE_ERROR_MESSAGE = "Não foi possível processar o reagendamento agora. Tente novamente.";
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

export async function handleUpdateAppointment(
  accessToken: string | undefined,
  id: string,
  payload: UpdateAppointmentPayload,
  loadProfile: ProfileLoader = fetchCurrentUser,
  updater: UpdaterFunc = updateAppointment,
): Promise<NextResponse> {
  if (!accessToken) {
    const response = NextResponse.json({ message: EXPIRED_SESSION_MESSAGE }, { status: 401 });
    response.cookies.set(SESSION_COOKIE_NAME, "", expiredSessionCookieOptions());
    return response;
  }

  try {
    await loadProfile(accessToken);
    await updater(accessToken, id, payload);
    return new NextResponse(null, { status: 204 });
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const cookieStore = await cookies();
  
  let payload: UpdateAppointmentPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }
  
  return handleUpdateAppointment(cookieStore.get(SESSION_COOKIE_NAME)?.value, id, payload);
}
