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

type ProfileLoader = (accessToken: string) => Promise<UserProfile>;

export async function handleSession(
  accessToken: string | undefined,
  loadProfile: ProfileLoader = fetchCurrentUser,
): Promise<NextResponse> {
  if (!accessToken) {
    return NextResponse.json(
      { message: "Sessão não encontrada." },
      { status: 401 },
    );
  }

  try {
    const user = await loadProfile(accessToken);
    return NextResponse.json({ user });
  } catch (error) {
    const status = error instanceof AuthBackendError ? error.status : 500;
    const response = NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar sua sessão.",
      },
      { status },
    );

    if (status === 401 || status === 403 || status === 404) {
      response.cookies.set(
        SESSION_COOKIE_NAME,
        "",
        expiredSessionCookieOptions(),
      );
    }

    return response;
  }
}

export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies();
  return handleSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
