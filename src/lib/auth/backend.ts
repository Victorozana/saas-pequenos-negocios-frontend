import type { components } from "@/lib/api/generated/schema";
import { normalizeApiBaseUrl } from "@/lib/api/client";

export type Credentials = components["schemas"]["CreateSessionRequest"];
export type BackendSession = components["schemas"]["SessionResponse"];
export type UserProfile = components["schemas"]["UserProfileResponse"];

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

type ProblemDetails = {
  title?: unknown;
};

export class AuthBackendError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthBackendError";
  }
}

export function getApiBaseUrl(): string {
  const configuredUrl = process.env.API_BASE_URL?.trim();

  if (!configuredUrl && process.env.NODE_ENV === "production") {
    throw new Error("API_BASE_URL is required in production");
  }

  return normalizeApiBaseUrl(configuredUrl || "http://localhost:5050");
}

function messageForStatus(status: number, problem?: ProblemDetails): string {
  if (status === 400) return "Preencha o e-mail e a senha corretamente.";
  if (status === 401) return "E-mail ou senha incorretos.";
  if (status === 403) return "Confirme seu e-mail antes de entrar.";

  if (typeof problem?.title === "string" && problem.title.trim()) {
    return problem.title;
  }

  return "Não foi possível acessar sua conta agora. Tente novamente.";
}

async function readProblem(response: Response): Promise<ProblemDetails> {
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return {};
  }
}

function isBackendSession(value: unknown): value is BackendSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<BackendSession>;

  return (
    typeof session.accessToken === "string" &&
    session.accessToken.length > 0 &&
    typeof session.expiresAt === "string" &&
    !Number.isNaN(Date.parse(session.expiresAt))
  );
}

function isUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<UserProfile>;

  return (
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    typeof user.role === "string" &&
    typeof user.tenantId === "string" &&
    Array.isArray(user.permissions) &&
    user.permissions.every((permission) => typeof permission === "string") &&
    typeof user.status === "string"
  );
}

async function requestBackend(
  url: string,
  init: RequestInit,
  fetcher: Fetcher,
): Promise<Response> {
  try {
    return await fetcher(url, init);
  } catch {
    throw new AuthBackendError(
      503,
      "O serviço está temporariamente indisponível. Tente novamente.",
    );
  }
}

export async function authenticateWithBackend(
  credentials: Credentials,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<BackendSession> {
  const response = await requestBackend(
    `${normalizeApiBaseUrl(baseUrl)}/api/v1/auth/sessions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      cache: "no-store",
    },
    fetcher,
  );

  if (!response.ok) {
    const problem = await readProblem(response);
    throw new AuthBackendError(
      response.status,
      messageForStatus(response.status, problem),
    );
  }

  const session: unknown = await response.json();
  if (!isBackendSession(session)) {
    throw new AuthBackendError(502, "O serviço retornou uma sessão inválida.");
  }

  return session;
}

export async function fetchCurrentUser(
  accessToken: string,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<UserProfile> {
  const response = await requestBackend(
    `${normalizeApiBaseUrl(baseUrl)}/api/v1/users/me`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
    fetcher,
  );

  if (!response.ok) {
    throw new AuthBackendError(
      response.status,
      response.status === 401
        ? "Sua sessão expirou. Entre novamente."
        : "Não foi possível carregar seu perfil.",
    );
  }

  const user: unknown = await response.json();
  if (!isUserProfile(user)) {
    throw new AuthBackendError(502, "O serviço retornou um perfil inválido.");
  }

  return user;
}

