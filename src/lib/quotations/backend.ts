import { normalizeApiBaseUrl } from "@/lib/api/client";
import type { components } from "@/lib/api/generated/schema";
import { AuthBackendError, getApiBaseUrl } from "@/lib/auth/backend";

// The API enum is numbered from 1, in this order.
export const QUOTATION_STATUSES = [
  "Draft", "Pending", "Approved", "Rejected", "Expired", "Canceled", "Converted",
] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export function isQuotationStatus(value: unknown): value is QuotationStatus {
  return QUOTATION_STATUSES.some((status) => status === value);
}

export type QuotationItem = {
  id: string;
  serviceName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  totalPrice: number;
};

export type Quotation = Omit<components["schemas"]["QuotationListDto"], "status" | "totalAmount"> & {
  totalAmount: number;
  status: QuotationStatus;
};

export type PaginatedQuotations = {
  items: Quotation[];
  totalCount: number;
  page: number;
  pageSize: number;
};

type BackendQuotation = Omit<Quotation, "status"> & { status: number };
type BackendPaginatedQuotations = Omit<PaginatedQuotations, "items"> & {
  items: BackendQuotation[];
};

export type CreateQuotationItemPayload = {
  serviceItemId: string | null;
  serviceName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
};

export type CreateQuotationPayload = {
  code: string;
  customerId: string;
  issueDate: string;
  validUntil: string | null;
  notes: string | null;
  paymentTerms: string | null;
  items: CreateQuotationItemPayload[];
  deposit: { type: number; value: number; paymentNotes: string | null } | null;
};

export type QuotationDetail = Omit<components["schemas"]["QuotationDetailDto"], "status" | "items" | "depositInfo"> & {
  status: QuotationStatus;
  items: (QuotationItem & { serviceItemId: string | null })[];
  depositInfo: { type: number; value: number; paymentNotes: string | null } | null;
};

export async function fetchQuotation(accessToken: string, id: string, fetcher: Fetcher = fetch, baseUrl = getApiBaseUrl()): Promise<QuotationDetail> {
  const data = await quotationRequest(accessToken, id, "GET", undefined, fetcher, baseUrl);
  if (!isQuotation(data) || !("items" in data) || !Array.isArray(data.items) || !data.items.every(isQuotationItem)) {
    throw new AuthBackendError(502, "O serviço retornou um formato de orçamento inválido.");
  }
  return { ...data, status: QUOTATION_STATUSES[data.status - 1] } as QuotationDetail;
}

export async function updateQuotation(accessToken: string, id: string, payload: CreateQuotationPayload, fetcher: Fetcher = fetch, baseUrl = getApiBaseUrl()): Promise<void> {
  await quotationRequest(accessToken, id, "PUT", payload, fetcher, baseUrl);
}

async function quotationRequest(accessToken: string, id: string, method: "GET" | "PUT", payload: CreateQuotationPayload | undefined, fetcher: Fetcher, baseUrl: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetcher(`${normalizeApiBaseUrl(baseUrl)}/api/v1/quotations/${id}`, {
      method,
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
      cache: "no-store",
    });
  } catch {
    throw new AuthBackendError(503, "Não foi possível acessar o orçamento agora. Tente novamente.");
  }
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    throw new AuthBackendError(response.status, problem.message || problem.title || "Não foi possível acessar o orçamento agora. Tente novamente.");
  }
  return method === "GET" ? response.json() : undefined;
}

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export function isQuotationItem(value: unknown): value is QuotationItem {
  if (!value || typeof value !== "object") return false;
  const i = value as Partial<QuotationItem>;
  return (
    typeof i.id === "string" &&
    typeof i.serviceName === "string" &&
    typeof i.quantity === "number" &&
    typeof i.unitPrice === "number"
  );
}

export function isQuotation(value: unknown): value is BackendQuotation {
  if (!value || typeof value !== "object") return false;
  const q = value as Partial<BackendQuotation>;

  return (
    typeof q.id === "string" &&
    typeof q.code === "string" &&
    typeof q.customerName === "string" &&
    typeof q.issueDate === "string" && !Number.isNaN(Date.parse(q.issueDate)) &&
    (q.validUntil === null || (typeof q.validUntil === "string" && !Number.isNaN(Date.parse(q.validUntil)))) &&
    typeof q.status === "number" && Number.isInteger(q.status) &&
    q.status >= 1 && q.status <= QUOTATION_STATUSES.length &&
    typeof q.totalAmount === "number" &&
    Number.isFinite(q.totalAmount)
  );
}

export function isPaginatedQuotations(
  value: unknown,
): value is BackendPaginatedQuotations {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<BackendPaginatedQuotations>;

  return (
    Array.isArray(p.items) &&
    p.items.every(isQuotation) &&
    typeof p.totalCount === "number" &&
    typeof p.page === "number" &&
    typeof p.pageSize === "number"
  );
}

export async function fetchQuotations(
  accessToken: string,
  search?: string,
  status?: string,
  page = 1,
  pageSize = 20,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<PaginatedQuotations> {
  const queryParams = new URLSearchParams();
  if (search && search.trim()) queryParams.set("SearchTerm", search.trim());
  if (status && status.trim()) {
    const selectedStatus = status.trim();
    if (!isQuotationStatus(selectedStatus)) {
      throw new AuthBackendError(400, "Status inválido.");
    }
    queryParams.set("Status", String(QUOTATION_STATUSES.indexOf(selectedStatus) + 1));
  }
  queryParams.set("page", page.toString());
  queryParams.set("pageSize", pageSize.toString());

  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/quotations?${queryParams.toString()}`,
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
      "Não foi possível carregar a lista de orçamentos agora. Tente novamente.",
    );
  }

  if (!response.ok) {
    throw new AuthBackendError(
      response.status,
      response.status === 401 || response.status === 403
        ? "Sua sessão expirou. Entre novamente."
        : "Não foi possível carregar a lista de orçamentos agora. Tente novamente.",
    );
  }

  const data: unknown = await response.json().catch(() => null);
  if (!isPaginatedQuotations(data)) {
    throw new AuthBackendError(
      502,
      "O serviço retornou um formato de orçamentos inválido.",
    );
  }

  return {
    ...data,
    items: data.items.map((quotation) => ({
      ...quotation,
      status: QUOTATION_STATUSES[quotation.status - 1],
    })),
  };
}

export async function createQuotation(
  accessToken: string,
  payload: CreateQuotationPayload,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<{ id: string }> {
  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/quotations`,
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
      "Não foi possível criar o orçamento agora. Tente novamente.",
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
            : "Não foi possível criar o orçamento agora. Tente novamente.";

    throw new AuthBackendError(response.status, message);
  }

  const data = (await response.json().catch(() => ({}))) as { id?: string; Id?: string };
  const id = data.id || data.Id;
  if (!id || typeof id !== "string") {
    throw new AuthBackendError(502, "ID do orçamento não retornado pelo servidor.");
  }

  return { id };
}

export async function updateQuotationStatus(
  accessToken: string,
  quotationId: string,
  status: QuotationStatus,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<void> {
  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/quotations/${quotationId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newStatus: QUOTATION_STATUSES.indexOf(status) + 1 }),
        cache: "no-store",
      },
    );
  } catch {
    throw new AuthBackendError(
      503,
      "Não foi possível atualizar o status do orçamento agora. Tente novamente.",
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
            : "Não foi possível atualizar o status agora. Tente novamente.";

    throw new AuthBackendError(response.status, message);
  }
}

export async function exportQuotationPdf(
  accessToken: string,
  quotationId: string,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<Blob> {
  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/quotations/${quotationId}/pdf`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );
  } catch {
    throw new AuthBackendError(
      503,
      "Não foi possível gerar o PDF agora. Tente novamente.",
    );
  }

  if (!response.ok) {
    throw new AuthBackendError(
      response.status,
      response.status === 401 || response.status === 403
        ? "Sua sessão expirou. Entre novamente."
        : "Não foi possível gerar o PDF agora. Tente novamente.",
    );
  }

  return response.blob();
}
