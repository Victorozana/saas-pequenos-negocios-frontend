import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/auth/backend";
import { companyRegistryMessage, isCompanyRegistryResult } from "@/lib/onboarding/company-registry";

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function lookupCompany(cnpj: string, fetcher: Fetcher = fetch): Promise<NextResponse> {
  try {
    const upstream = await fetcher(
      `${getApiBaseUrl()}/api/v1/company-registry/${encodeURIComponent(cnpj)}`,
      { cache: "no-store" },
    );

    if (!upstream.ok) {
      const status = [400, 404, 422].includes(upstream.status) ? upstream.status : 503;
      return NextResponse.json({ message: companyRegistryMessage(status) }, { status });
    }

    const body: unknown = await upstream.json().catch(() => null);
    if (!isCompanyRegistryResult(body)) {
      return NextResponse.json({ message: companyRegistryMessage(503) }, { status: 503 });
    }

    return NextResponse.json(body, { status: 200 });
  } catch {
    return NextResponse.json({ message: companyRegistryMessage(503) }, { status: 503 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cnpj: string }> },
): Promise<NextResponse> {
  const { cnpj } = await params;
  return lookupCompany(cnpj);
}
