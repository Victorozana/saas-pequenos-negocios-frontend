import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/auth/backend";
import { isRegisterTenantRequest, messageForOnboardingStatus, readOnboardingProblem, type RegisterTenantRequest } from "@/lib/onboarding/tenant-onboarding";

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function registerTenant(request: RegisterTenantRequest, idempotencyKey: string, fetcher: Fetcher = fetch): Promise<NextResponse> {
  try {
    const upstream = await fetcher(`${getApiBaseUrl()}/api/v1/tenants`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify(request), cache: "no-store" });
    if (!upstream.ok) return NextResponse.json({ message: messageForOnboardingStatus(upstream.status, await readOnboardingProblem(upstream)) }, { status: upstream.status });
    const body: unknown = await upstream.json().catch(() => null);
    if (!body || typeof body !== "object" || typeof (body as { message?: unknown }).message !== "string") return NextResponse.json({ message: "O serviço retornou uma resposta inválida." }, { status: 502 });
    return NextResponse.json({ message: (body as { message: string }).message }, { status: 201 });
  } catch { return NextResponse.json({ message: "O serviço está temporariamente indisponível. Tente novamente." }, { status: 503 }); }
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Dados de cadastro inválidos." }, { status: 400 }); }
  const key = request.headers.get("Idempotency-Key");
  if (!isRegisterTenantRequest(body) || !key?.trim()) return NextResponse.json({ message: "Dados de cadastro inválidos." }, { status: 400 });
  return registerTenant(body, key);
}
