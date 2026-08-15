import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

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
  type UpdateServicePayload,
  updateServiceItem,
} from "@/lib/services/backend";

type ProfileLoader = (accessToken: string) => Promise<UserProfile>;
type ServiceUpdater = (
  accessToken: string,
  id: string,
  payload: UpdateServicePayload,
) => Promise<void>;

const SAFE_ERROR_MESSAGE =
  "Não foi possível processar a requisição de serviços agora. Tente novamente.";
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

export async function handleUpdateService(
  accessToken: string | undefined,
  id: string,
  payload: UpdateServicePayload,
  loadProfile: ProfileLoader = fetchCurrentUser,
  saveService: ServiceUpdater = updateServiceItem,
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
    await loadProfile(accessToken);
    await saveService(accessToken, id, payload);
    return NextResponse.json({ success: true }, { status: 200 });
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

    if (error instanceof AuthBackendError && error.status === 400) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: SAFE_ERROR_MESSAGE },
      { status: statusFor(error) },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const { id } = await params;
  let payload: UpdateServicePayload;
  try {
    payload = (await request.json()) as UpdateServicePayload;
  } catch {
    return NextResponse.json(
      { message: "Dados inválidos." },
      { status: 400 },
    );
  }

  return handleUpdateService(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
    id,
    payload,
  );
}
