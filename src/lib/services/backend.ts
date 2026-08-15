import { normalizeApiBaseUrl } from "@/lib/api/client";
import { AuthBackendError, getApiBaseUrl } from "@/lib/auth/backend";

export type ServiceItem = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  basePrice: number;
  isActive: boolean;
};

export type PaginatedServices = {
  items: ServiceItem[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type CreateServicePayload = {
  name: string;
  description?: string | null;
  unit: string;
  basePrice: number;
};

export type UpdateServicePayload = CreateServicePayload;

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export function isServiceItem(value: unknown): value is ServiceItem {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<ServiceItem>;

  return (
    typeof s.id === "string" &&
    typeof s.name === "string" &&
    typeof s.unit === "string" &&
    typeof s.basePrice === "number" &&
    typeof s.isActive === "boolean"
  );
}

export function isPaginatedServices(
  value: unknown,
): value is PaginatedServices {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<PaginatedServices>;

  return (
    Array.isArray(p.items) &&
    p.items.every(isServiceItem) &&
    typeof p.totalCount === "number" &&
    typeof p.page === "number" &&
    typeof p.pageSize === "number"
  );
}

export async function fetchServices(
  accessToken: string,
  searchTerm?: string,
  page = 1,
  pageSize = 20,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<PaginatedServices> {
  const queryParams = new URLSearchParams();
  if (searchTerm && searchTerm.trim()) queryParams.set("searchTerm", searchTerm.trim());
  queryParams.set("page", page.toString());
  queryParams.set("pageSize", pageSize.toString());

  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/services?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );
  } catch {
    throw new AuthBackendError(
      503,
      "Não foi possível carregar a lista de serviços agora. Tente novamente.",
    );
  }

  if (!response.ok) {
    throw new AuthBackendError(
      response.status,
      response.status === 401 || response.status === 403
        ? "Sua sessão expirou. Entre novamente."
        : "Não foi possível carregar a lista de serviços agora. Tente novamente.",
    );
  }

  const data: unknown = await response.json().catch(() => null);
  if (!isPaginatedServices(data)) {
    throw new AuthBackendError(
      502,
      "O serviço retornou um formato de serviços inválido.",
    );
  }

  return data;
}

export async function createServiceItem(
  accessToken: string,
  payload: CreateServicePayload,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<{ id: string }> {
  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/services`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );
  } catch {
    throw new AuthBackendError(
      503,
      "Não foi possível cadastrar o serviço agora. Tente novamente.",
    );
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as {
      title?: string;
      message?: string;
    };
    const message =
      typeof problem?.title === "string" && problem.title.trim()
        ? problem.title
        : typeof problem?.message === "string" && problem.message.trim()
          ? problem.message
          : response.status === 401 || response.status === 403
            ? "Sua sessão expirou. Entre novamente."
            : "Não foi possível cadastrar o serviço agora. Tente novamente.";

    throw new AuthBackendError(response.status, message);
  }

  const data = (await response.json().catch(() => ({}))) as { id?: string; Id?: string };
  const id = data.id || data.Id;
  if (!id || typeof id !== "string") {
    throw new AuthBackendError(502, "ID do serviço não retornado pelo servidor.");
  }

  return { id };
}

export async function updateServiceItem(
  accessToken: string,
  id: string,
  payload: UpdateServicePayload,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<void> {
  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/services/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );
  } catch {
    throw new AuthBackendError(
      503,
      "Não foi possível atualizar o serviço agora. Tente novamente.",
    );
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as {
      title?: string;
      message?: string;
    };
    const message =
      typeof problem?.title === "string" && problem.title.trim()
        ? problem.title
        : typeof problem?.message === "string" && problem.message.trim()
          ? problem.message
          : response.status === 401 || response.status === 403
            ? "Sua sessão expirou. Entre novamente."
            : "Não foi possível atualizar o serviço agora. Tente novamente.";

    throw new AuthBackendError(response.status, message);
  }
}
