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
  type UpdateCustomerPayload,
  updateCustomer,
} from "@/lib/customers/backend";

type ProfileLoader = (accessToken: string) => Promise<UserProfile>;
type CustomerUpdater = (
  accessToken: string,
  customerId: string,
  payload: UpdateCustomerPayload,
) => Promise<void>;

const SAFE_ERROR_MESSAGE =
  "Não foi possível processar a requisição de clientes agora. Tente novamente.";
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

export async function handleUpdateCustomer(
  accessToken: string | undefined,
  id: string,
  payload: UpdateCustomerPayload,
  loadProfile: ProfileLoader = fetchCurrentUser,
  saveCustomer: CustomerUpdater = updateCustomer,
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
    await saveCustomer(accessToken, id, payload);
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
  let payload: UpdateCustomerPayload;
  try {
    payload = (await request.json()) as UpdateCustomerPayload;
  } catch {
    return NextResponse.json(
      { message: "Dados inválidos." },
      { status: 400 },
    );
  }

  return handleUpdateCustomer(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
    id,
    payload,
  );
}
