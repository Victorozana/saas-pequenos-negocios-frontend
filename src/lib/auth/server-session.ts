import { cookies } from "next/headers";

import {
  AuthBackendError,
  fetchCurrentUser,
  type UserProfile,
} from "./backend";
import { SESSION_COOKIE_NAME } from "./session-cookie";

type ProfileLoader = (accessToken: string) => Promise<UserProfile>;

export async function resolveSessionUser(
  accessToken: string | undefined,
  loadProfile: ProfileLoader = fetchCurrentUser,
): Promise<UserProfile | null> {
  if (!accessToken) return null;

  try {
    return await loadProfile(accessToken);
  } catch (error) {
    if (
      error instanceof AuthBackendError &&
      [401, 403, 404].includes(error.status)
    ) {
      return null;
    }

    throw error;
  }
}

export async function getSessionUser(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  return resolveSessionUser(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
