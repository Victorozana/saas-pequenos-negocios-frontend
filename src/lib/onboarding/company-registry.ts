import type { components } from "@/lib/api/generated/schema";

export type CompanyRegistryResult = components["schemas"]["CompanyRegistryResult"];

const companyFields = ["cnpj", "corporateName", "tradeName", "legalNature", "status"] as const;
const addressFields = ["street", "number", "complement", "neighborhood", "city", "state", "zipCode"] as const;

export function isCompanyRegistryResult(value: unknown): value is CompanyRegistryResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  if (!companyFields.every((field) => typeof candidate[field] === "string")) return false;
  if (!Array.isArray(candidate.cnaes) || !candidate.cnaes.every((cnae) => typeof cnae === "string")) return false;
  if (!candidate.address || typeof candidate.address !== "object") return false;
  const address = candidate.address as Record<string, unknown>;
  return addressFields.every((field) => typeof address[field] === "string");
}

export function companyRegistryMessage(status: number): string {
  if (status === 400) return "CNPJ inválido.";
  if (status === 404) return "Empresa não encontrada.";
  if (status === 422) return "A empresa não está ativa.";
  return "Não foi possível consultar o CNPJ agora.";
}
