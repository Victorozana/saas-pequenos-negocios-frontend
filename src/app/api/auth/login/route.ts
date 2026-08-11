import { NextResponse } from "next/server";

import {
  AuthBackendError,
  authenticateWithBackend,
  type BackendSession,
  type Credentials,
} from "@/lib/auth/backend";
import {
  SESSION_COOKIE_NAME,
  createSessionCookieOptions,
} from "@/lib/auth/session-cookie";

type Authenticator = (credentials: Credentials) => Promise<BackendSession>;

function isCredentials(value: unknown): value is Credentials {
  if (!value || typeof value !== "object") return false;
  const credentials = value as Partial<Credentials>;

  return (
    typeof credentials.email === "string" &&
    credentials.email.trim().length > 0 &&
    typeof credentials.password === "string" &&
    credentials.password.length > 0
  );
}

export async function handleLogin(
  credentials: Credentials,
  authenticate: Authenticator = authenticateWithBackend,
): Promise<NextResponse> {
  try {
    const session = await authenticate({
      email: credentials.email.trim(),
      password: credentials.password,
    });
    const response = NextResponse.json({ authenticated: true });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      session.accessToken,
      createSessionCookieOptions(session.expiresAt),
    );

    return response;
  } catch (error) {
    if (error instanceof AuthBackendError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { message: "Não foi possível acessar sua conta agora. Tente novamente." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Informe um e-mail e uma senha válidos." },
      { status: 400 },
    );
  }

  if (!isCredentials(body)) {
    return NextResponse.json(
      { message: "Informe um e-mail e uma senha válidos." },
      { status: 400 },
    );
  }

  return handleLogin(body);
}

