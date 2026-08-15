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
  createServiceItem,
  type CreateServicePayload,
  fetchServices,
  type PaginatedServices,
} from "@/lib/services/backend";

type ProfileLoader = (accessToken: string) => Promise<UserProfile>;
type ServicesFetcher = (
  accessToken: string,
  searchTerm?: string,
  page?: number,
  pageSize?: number,
) => Promise<PaginatedServices>;
type ServiceCreator = (
  accessToken: string,
  payload: CreateServicePayload,
) => Promise<{ id: string }>;

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

export async function handleGetServices(
  accessToken: string | undefined,
  searchTerm?: string,
  page = 1,
  pageSize = 20,
  loadProfile: ProfileLoader = fetchCurrentUser,
  loadServices: ServicesFetcher = fetchServices,
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
    const services = await loadServices(accessToken, searchTerm, page, pageSize);
    return NextResponse.json({ user, services });
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

export async function handleCreateService(
  accessToken: string | undefined,
  payload: CreateServicePayload,
  loadProfile: ProfileLoader = fetchCurrentUser,
  saveService: ServiceCreator = createServiceItem,
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
    const result = await saveService(accessToken, payload);
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
  const searchTerm = searchParams.get("searchTerm") || searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  return handleGetServices(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
    searchTerm,
    page,
    pageSize,
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  let payload: CreateServicePayload;
  try {
    payload = (await request.json()) as CreateServicePayload;
  } catch {
    return NextResponse.json(
      { message: "Dados inválidos." },
      { status: 400 },
    );
  }

  return handleCreateService(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
    payload,
  );
}
