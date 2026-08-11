import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

export function proxy(request: NextRequest): NextResponse {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (hasSession) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
