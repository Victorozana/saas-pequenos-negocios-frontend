import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { fetchCurrentUser, type UserProfile } from "@/lib/auth/backend";
import { SESSION_COOKIE_NAME, expiredSessionCookieOptions } from "@/lib/auth/session-cookie";
import { convertQuotationToWorkOrder, WorkOrderBackendError } from "@/lib/work-orders/backend";

type ProfileLoader = (accessToken: string) => Promise<UserProfile>;
type Converter = (accessToken: string, quotationId: string) => Promise<{ id: string }>;

const SAFE_ERROR_MESSAGE = "Não foi possível processar a conversão de orçamento agora. Tente novamente.";
const EXPIRED_SESSION_MESSAGE = "Sua sessão expirou. Entre novamente.";

function backendStatus(error: unknown): number | undefined {
  if (error instanceof WorkOrderBackendError) return error.status;
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

export async function handleConvertQuotation(
  accessToken: string | undefined,
  quotationId: string,
  loadProfile: ProfileLoader = fetchCurrentUser,
  convert: Converter = convertQuotationToWorkOrder,
): Promise<NextResponse> {
  if (!accessToken) {
    const response = NextResponse.json({ message: EXPIRED_SESSION_MESSAGE }, { status: 401 });
    response.cookies.set(SESSION_COOKIE_NAME, "", expiredSessionCookieOptions());
    return response;
  }

  try {
    await loadProfile(accessToken);
    const result = await convert(accessToken, quotationId);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (isExpiredSession(error)) {
      const response = NextResponse.json({ message: EXPIRED_SESSION_MESSAGE }, { status: 401 });
      response.cookies.set(SESSION_COOKIE_NAME, "", expiredSessionCookieOptions());
      return response;
    }

    if (error instanceof WorkOrderBackendError && error.status === 400) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: SAFE_ERROR_MESSAGE }, { status: statusFor(error) });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const cookieStore = await cookies();

  return handleConvertQuotation(cookieStore.get(SESSION_COOKIE_NAME)?.value, id);
}
