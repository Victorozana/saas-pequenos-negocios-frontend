export const SESSION_COOKIE_NAME = "agendamento_session";

export function sessionCookieSecurityOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    priority: "high" as const,
  };
}
export function createSessionCookieOptions(expiresAt: string) {
  const expires = new Date(expiresAt);

  if (Number.isNaN(expires.getTime())) {
    throw new Error("Session expiry is invalid");
  }

  return {
    ...sessionCookieSecurityOptions(),
    expires,
  };
}

export function expiredSessionCookieOptions() {
  return {
    ...sessionCookieSecurityOptions(),
    expires: new Date(0),
    maxAge: 0,
  };
}
