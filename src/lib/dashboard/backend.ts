import type { components } from "@/lib/api/generated/schema";
import { normalizeApiBaseUrl } from "@/lib/api/client";
import { AuthBackendError, getApiBaseUrl } from "@/lib/auth/backend";

export type DashboardSummary = components["schemas"]["DashboardSummaryDto"];

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export function isDashboardSummary(value: unknown): value is DashboardSummary {
  if (!value || typeof value !== "object") return false;
  const summary = value as Partial<DashboardSummary>;

  if (
    typeof summary.totalReceivedAmount !== "number" ||
    typeof summary.totalReceivableAmount !== "number" ||
    typeof summary.pendingWorkOrdersCount !== "number" ||
    !summary.conversionMetrics ||
    typeof summary.conversionMetrics !== "object"
  ) {
    return false;
  }

  const metrics = summary.conversionMetrics;
  return (
    typeof metrics.totalQuotations === "number" &&
    typeof metrics.approvedQuotations === "number" &&
    typeof metrics.conversionRatePercentage === "number"
  );
}

export async function fetchDashboardSummary(
  accessToken: string,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<DashboardSummary> {
  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/dashboard/summary`,
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
      "Não foi possível carregar as métricas agora. Tente novamente.",
    );
  }

  if (!response.ok) {
    throw new AuthBackendError(
      response.status,
      response.status === 401 || response.status === 403
        ? "Sua sessão expirou. Entre novamente."
        : "Não foi possível carregar as métricas agora. Tente novamente.",
    );
  }

  const data: unknown = await response.json().catch(() => null);
  if (!isDashboardSummary(data)) {
    throw new AuthBackendError(502, "Formato de métricas inválido.");
  }

  return data;
}

export async function fetchPerformanceReport(
  accessToken: string,
  fetcher: Fetcher = fetch,
  baseUrl = getApiBaseUrl(),
): Promise<Response> {
  let response: Response;
  try {
    response = await fetcher(
      `${normalizeApiBaseUrl(baseUrl)}/api/v1/dashboard/report`,
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
      "Não foi possível exportar o relatório agora. Tente novamente.",
    );
  }

  if (!response.ok) {
    throw new AuthBackendError(
      response.status,
      response.status === 401 || response.status === 403
        ? "Sua sessão expirou. Entre novamente."
        : "Não foi possível exportar o relatório agora. Tente novamente.",
    );
  }

  return response;
}
