import { NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  expiredSessionCookieOptions,
} from "@/lib/auth/session-cookie";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ authenticated: false });

  response.cookies.set(
    SESSION_COOKIE_NAME,
    "",
    expiredSessionCookieOptions(),
  );

  return response;
}
