import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/auth/backend";
import { isVerificationToken, messageForOnboardingStatus, readOnboardingProblem } from "@/lib/onboarding/tenant-onboarding";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Não foi possível confirmar o e-mail." }, { status: 400 }); }
  if (!isVerificationToken(body)) return NextResponse.json({ message: "Não foi possível confirmar o e-mail." }, { status: 400 });
  try {
    const upstream = await fetch(`${getApiBaseUrl()}/api/v1/auth/email-verifications`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    if (upstream.status === 204) return new NextResponse(null, { status: 204 });
    return NextResponse.json({ message: messageForOnboardingStatus(upstream.status, await readOnboardingProblem(upstream)) }, { status: upstream.status });
  } catch { return NextResponse.json({ message: "O serviço está temporariamente indisponível. Tente novamente." }, { status: 503 }); }
}
