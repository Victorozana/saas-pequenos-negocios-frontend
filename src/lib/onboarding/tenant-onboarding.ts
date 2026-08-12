import type { components } from "@/lib/api/generated/schema";

export type RegisterTenantRequest = components["schemas"]["RegisterTenantRequest"];

type ProblemDetails = { title?: unknown; detail?: unknown };

const requestFields = [
  "cnpj", "companyName", "tradeName", "legalNature", "primaryCnae", "categoryId",
  "email", "phone", "addressStreet", "addressNumber", "addressComplement",
  "addressNeighborhood", "addressCity", "addressState", "addressZipCode",
  "stateRegistration", "municipalRegistration", "isTaxExempt", "taxRegime", "fiscalEmail",
  "adminName", "adminCpf", "adminEmail", "adminPassword", "isLegalRepresentative",
] as const;

export function isValidPassword(value: string): boolean {
  return value.length >= 12 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}

export function isRegisterTenantRequest(value: unknown): value is RegisterTenantRequest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return requestFields.every((field) => {
    const fieldValue = candidate[field];
    return field === "categoryId" ? Number.isInteger(fieldValue) :
      field === "isTaxExempt" || field === "isLegalRepresentative" ? typeof fieldValue === "boolean" :
      typeof fieldValue === "string" && fieldValue.trim().length > 0;
  });
}

export function isVerificationToken(value: unknown): value is { token: string } {
  return Boolean(value && typeof value === "object" && typeof (value as { token?: unknown }).token === "string" && (value as { token: string }).token.trim());
}

export function messageForOnboardingStatus(status: number, problem?: ProblemDetails): string {
  if (status === 409) return "Já existe um cadastro conflitante. Revise os dados e tente novamente.";
  if ((status === 400 || status === 422) && typeof problem?.title === "string" && problem.title.trim()) return problem.title;
  if (status >= 500 || status === 502 || status === 503) return "O serviço está temporariamente indisponível. Tente novamente.";
  return "Não foi possível concluir o cadastro agora. Tente novamente.";
}

export async function readOnboardingProblem(response: Response): Promise<ProblemDetails> {
  try { return (await response.json()) as ProblemDetails; } catch { return {}; }
}
