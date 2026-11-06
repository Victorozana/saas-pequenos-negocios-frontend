import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, expiredSessionCookieOptions } from "@/lib/auth/session-cookie";
import { convertQuotationToWorkOrder, WorkOrderBackendError } from "@/lib/work-orders/backend";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin)
    return NextResponse.json({ message: "Origem inválida." }, { status: 403 });
  const key = request.headers.get("Idempotency-Key");
  const payload = await request.json().catch(() => null);
  if (!key || !payload)
    return NextResponse.json({ message: "Informe os dados da ordem de serviço." }, { status: 400 });
  try {
    if (!token) throw new WorkOrderBackendError(401, "Sua sessão expirou. Entre novamente.");
    const result = await convertQuotationToWorkOrder(token, (await params).id, payload, key);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const status = error instanceof WorkOrderBackendError ? error.status : 502;
    const message = status === 403 ? "Você não tem permissão para criar uma OS."
      : status === 404 ? "Orçamento não encontrado."
      : error instanceof WorkOrderBackendError && [400, 401, 409].includes(status) ? error.message
      : "Não foi possível criar a ordem de serviço agora. Tente novamente.";
    const response = NextResponse.json({ message }, { status: status >= 500 ? 503 : status });
    if (status === 401) response.cookies.set(SESSION_COOKIE_NAME, "", expiredSessionCookieOptions());
    return response;
  }
}
