import { normalizeApiBaseUrl } from "@/lib/api/client";
import { AuthBackendError, getApiBaseUrl } from "@/lib/auth/backend";

export type QuotationStatus = "Draft" | "Sent" | "Approved" | "Rejected";

export type QuotationItem = {
  id: string;
  serviceName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  totalPrice: number;
};

export type Quotation = {
  id: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  status: QuotationStatus;
  validUntil: string;
  notes: string | null;
  items: QuotationItem[];
  createdAt: string;
};

export type PaginatedQuotations = {
  items: Quotation[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type CreateQuotationItemPayload = {
  serviceName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
};

export type CreateQuotationPayload = {
  customerId: string;
  validUntil: string;
  notes?: string;
  items: CreateQuotationItemPayload[];
};

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

export function isQuotation(value: unknown): value is Quotation {
  if (!value || typeof value !== "object") return false;
  const q = value as Partial<Quotation>;

  return (
    typeof q.id === "string" &&
    typeof q.customerId === "string" &&
    typeof q.status === "string" &&
    typeof q.totalAmount === "number" &&
    Array.isArray(q.items) &&
    q.items.every(isQuotationItem)
  );
}

export function isPaginatedQuotations(
  value: unknown,
): value is PaginatedQuotations {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<PaginatedQuotations>;

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
  if (search && search.trim()) queryParams.set("search", search.trim());
  if (status && status.trim()) queryParams.set("status", status.trim());
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

  return data;
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
        body: JSON.stringify({ status }),
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
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/quotations/${quotationId}/export/pdf`,
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
