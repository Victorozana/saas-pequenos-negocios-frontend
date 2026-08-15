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
  createCustomer,
  type CreateCustomerPayload,
  fetchCustomers,
  type PaginatedCustomers,
} from "@/lib/customers/backend";

type ProfileLoader = (accessToken: string) => Promise<UserProfile>;
type CustomersFetcher = (
  accessToken: string,
  search?: string,
  page?: number,
  pageSize?: number,
) => Promise<PaginatedCustomers>;
type CustomerCreator = (
  accessToken: string,
  payload: CreateCustomerPayload,
) => Promise<{ id: string }>;

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

export async function handleGetCustomers(
  accessToken: string | undefined,
  search?: string,
  page = 1,
  pageSize = 20,
  loadProfile: ProfileLoader = fetchCurrentUser,
  loadCustomers: CustomersFetcher = fetchCustomers,
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
    const customers = await loadCustomers(accessToken, search, page, pageSize);
    return NextResponse.json({ user, customers });
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

export async function handleCreateCustomer(
  accessToken: string | undefined,
  payload: CreateCustomerPayload,
  loadProfile: ProfileLoader = fetchCurrentUser,
  saveCustomer: CustomerCreator = createCustomer,
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
    const result = await saveCustomer(accessToken, payload);
    return NextResponse.json(result, { status: 201 });
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  return handleGetCustomers(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
    search,
    page,
    pageSize,
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  let payload: CreateCustomerPayload;
  try {
    payload = (await request.json()) as CreateCustomerPayload;
  } catch {
    return NextResponse.json(
      { message: "Dados inválidos." },
      { status: 400 },
    );
  }

  return handleCreateCustomer(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
    payload,
  );
}
