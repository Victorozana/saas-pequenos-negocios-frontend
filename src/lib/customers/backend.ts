import { normalizeApiBaseUrl } from "@/lib/api/client";
import { AuthBackendError, getApiBaseUrl } from "@/lib/auth/backend";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  documentType: string | null;
  documentValue: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  isActive: boolean;
};

export type PaginatedCustomers = {
  items: Customer[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type CreateCustomerPayload = {
  name: string;
  phone: string;
  email?: string | null;
  documentType?: string | null;
  documentValue?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

export type UpdateCustomerPayload = CreateCustomerPayload & {
  customerId: string;
};

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export function isCustomer(value: unknown): value is Customer {
  if (!value || typeof value !== "object") return false;
  const c = value as Partial<Customer>;

  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.phone === "string" &&
    typeof c.isActive === "boolean"
  );
}

export function isPaginatedCustomers(
  value: unknown,
): value is PaginatedCustomers {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<PaginatedCustomers>;

  return (
    Array.isArray(p.items) &&
    p.items.every(isCustomer) &&
    typeof p.totalCount === "number" &&
    typeof p.page === "number" &&
    typeof p.pageSize === "number"
  );
}

export async function fetchCustomers(
  accessToken: string,
  search?: string,
  page = 1,
  pageSize = 20,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<PaginatedCustomers> {
  const queryParams = new URLSearchParams();
  if (search && search.trim()) queryParams.set("search", search.trim());
  queryParams.set("page", page.toString());
  queryParams.set("pageSize", pageSize.toString());

  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/customers?${queryParams.toString()}`,
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
      "Não foi possível carregar a lista de clientes agora. Tente novamente.",
    );
  }

  if (!response.ok) {
    throw new AuthBackendError(
      response.status,
      response.status === 401 || response.status === 403
        ? "Sua sessão expirou. Entre novamente."
        : "Não foi possível carregar a lista de clientes agora. Tente novamente.",
    );
  }

  const data: unknown = await response.json().catch(() => null);
  if (!isPaginatedCustomers(data)) {
    throw new AuthBackendError(
      502,
      "O serviço retornou um formato de clientes inválido.",
    );
  }

  return data;
}

export async function createCustomer(
  accessToken: string,
  payload: CreateCustomerPayload,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<{ id: string }> {
  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/customers`,
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
      "Não foi possível cadastrar o cliente agora. Tente novamente.",
    );
  }

  if (!response.ok) {
    throw new AuthBackendError(
      response.status,
      response.status === 401 || response.status === 403
        ? "Sua sessão expirou. Entre novamente."
        : "Não foi possível cadastrar o cliente agora. Tente novamente.",
    );
  }

  const data = (await response.json().catch(() => ({}))) as { id?: string; Id?: string };
  const id = data.id || data.Id;
  if (!id || typeof id !== "string") {
    throw new AuthBackendError(502, "ID do cliente não retornado pelo servidor.");
  }

  return { id };
}

export async function updateCustomer(
  accessToken: string,
  customerId: string,
  payload: UpdateCustomerPayload,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<void> {
  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/customers/${customerId}`,
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
      "Não foi possível atualizar o cliente agora. Tente novamente.",
    );
  }

  if (!response.ok) {
    throw new AuthBackendError(
      response.status,
      response.status === 401 || response.status === 403
        ? "Sua sessão expirou. Entre novamente."
        : "Não foi possível atualizar o cliente agora. Tente novamente.",
    );
  }
}
