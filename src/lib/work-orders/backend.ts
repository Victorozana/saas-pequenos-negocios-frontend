import { normalizeApiBaseUrl } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/auth/backend";
import type { components } from "@/lib/api/generated/schema";

export type WorkOrderStatus =
  | "Scheduled"
  | "InProgress"
  | "WaitingForMaterial"
  | "Completed"
  | "Cancelled";

const workOrderStatusValues: Record<WorkOrderStatus, components["schemas"]["WorkOrderStatus"]> = {
  Scheduled: 1,
  InProgress: 2,
  WaitingForMaterial: 3,
  Completed: 4,
  Cancelled: 5,
};

export type WorkOrderItem = {
  id: string;
  serviceItemId?: string;
  serviceName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalAmount: number;
};

export type WorkOrder = {
  id: string;
  code: string;
  customerId: string;
  quotationId: string;
  createdAt: string;
  completedAt?: string;
  status: WorkOrderStatus;
  notes?: string;
  items: WorkOrderItem[];
};

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class WorkOrderBackendError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "WorkOrderBackendError";
  }
}

export async function convertQuotationToWorkOrder(
  accessToken: string,
  quotationId: string,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<{ id: string }> {
  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/quotations/${quotationId}/convert`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );
  } catch {
    throw new WorkOrderBackendError(503, "Backend unavailable");
  }

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    const title = data && typeof data === "object" && "title" in data ? data.title : undefined;
    throw new WorkOrderBackendError(
      response.status,
      typeof title === "string" && title.trim()
        ? title
        : response.status === 401 || response.status === 403
          ? "Sua sessão expirou. Entre novamente."
          : "Não foi possível converter o orçamento em ordem de serviço.",
    );
  }

  const payload: components["schemas"]["WorkOrderConversionResponse"] | null = await response.json().catch(() => null);
  if (!payload || typeof payload.workOrderId !== "string" || !payload.workOrderId.trim()) {
    throw new WorkOrderBackendError(502, "O serviço retornou uma conversão inválida.");
  }
  return { id: payload.workOrderId };
}

export async function fetchWorkOrderById(
  accessToken: string,
  id: string,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<WorkOrder> {
  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/work-orders/${id}`,
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
    throw new WorkOrderBackendError(503, "Backend unavailable");
  }

  if (!response.ok) {
    throw new WorkOrderBackendError(response.status, "Work order not found");
  }

  return response.json();
}

export async function updateWorkOrderStatus(
  accessToken: string,
  id: string,
  status: WorkOrderStatus,
  notes?: string,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<void> {
  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/work-orders/${id}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: workOrderStatusValues[status], notes }),
        cache: "no-store",
      },
    );
  } catch {
    throw new WorkOrderBackendError(503, "Backend unavailable");
  }

  if (!response.ok) {
    throw new WorkOrderBackendError(response.status, "Failed to update work order status");
  }
}
