import type { components } from "@/lib/api/generated/schema";

type ApiTitle = components["schemas"]["FinancialTitleResponse"];
// The OpenAPI generator currently emits decimal fields as unknown. Narrow after validation.
export type FinancialTitle = Omit<
  ApiTitle,
  "originalAmount" | "paidAmount" | "balanceDue"
> & { originalAmount: number; paidAmount: number; balanceDue: number };
export type FinancialStatement = {
  [K in keyof components["schemas"]["FinancialStatementResult"]]: number;
};
export const paymentMethods = [
  "Pix",
  "Cartão de crédito",
  "Cartão de débito",
  "Dinheiro",
  "Transferência bancária",
];
export const statusLabels: Record<string, string> = {
  Pending: "Pendente",
  PartiallyPaid: "Parcial",
  Paid: "Quitado",
  Overdue: "Em atraso",
  Canceled: "Cancelado",
};
export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );
export function localDay(value: string | Date = new Date()): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function displayDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
export function isOverdue(title: FinancialTitle, today = localDay()) {
  return (
    title.status !== "Canceled" &&
    title.balanceDue > 0 &&
    localDay(title.dueDate) < today
  );
}
export function monthPeriod() {
  const today = localDay();
  const [year, month] = today.split("-").map(Number);
  return {
    start: `${today.slice(0, 7)}-01`,
    end: `${today.slice(0, 7)}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}`,
  };
}
export function periodQuery(start: string, end: string) {
  // São Paulo is UTC-03:00; use the complete last day, including sub-millisecond timestamps.
  return new URLSearchParams({
    startDate: `${start}T00:00:00-03:00`,
    endDate: `${end}T23:59:59.9999999-03:00`,
  }).toString();
}
export function parseTitles(data: unknown): FinancialTitle[] {
  if (
    !Array.isArray(data) ||
    !data.every(
      (t) =>
        t &&
        typeof t.id === "string" &&
        typeof t.description === "string" &&
        Number.isFinite(Date.parse(t.dueDate)) &&
        typeof t.status === "string" &&
        [t.originalAmount, t.paidAmount, t.balanceDue].every(
          (n) => typeof n === "number" && Number.isFinite(n),
        ),
    )
  )
    throw new Error("O serviço retornou contas em formato inválido.");
  return data as FinancialTitle[];
}
export function parseStatement(data: unknown): FinancialStatement {
  const keys = [
    "totalReceivables",
    "totalPayables",
    "totalPaidReceivables",
    "totalPaidPayables",
    "projectedBalance",
    "realizedBalance",
  ] as const;
  if (
    !data ||
    typeof data !== "object" ||
    !keys.every(
      (k) =>
        typeof (data as Record<string, unknown>)[k] === "number" &&
        Number.isFinite((data as Record<string, number>)[k]),
    )
  )
    throw new Error("O serviço retornou um resumo inválido.");
  return data as FinancialStatement;
}
