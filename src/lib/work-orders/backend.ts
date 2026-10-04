import { normalizeApiBaseUrl } from "@/lib/api/client";
import { AuthBackendError, getApiBaseUrl } from "@/lib/auth/backend";

export type WorkOrderStatus =
  | "Scheduled"
  | "InProgress"
  | "WaitingForMaterial"
  | "Completed"
  | "Cancelled";

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
    const data = await response.json().catch(() => ({}));
    throw new WorkOrderBackendError(
      response.status,
      data.error || "Failed to convert quotation to work order",
    );
  }

  const payload = await response.json();
  return { id: payload.workOrderId || payload.WorkOrderId || payload.id };
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
        body: JSON.stringify({ status, notes }),
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
