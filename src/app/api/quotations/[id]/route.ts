import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { AuthBackendError, fetchCurrentUser } from "@/lib/auth/backend";
import { SESSION_COOKIE_NAME, expiredSessionCookieOptions } from "@/lib/auth/session-cookie";
import { fetchQuotation, updateQuotation, type CreateQuotationPayload } from "@/lib/quotations/backend";

export async function handleQuotationRequest(token: string | undefined, id: string, payload?: CreateQuotationPayload,
  loadProfile = fetchCurrentUser, loadQuotation = fetchQuotation, saveQuotation = updateQuotation): Promise<NextResponse> {
  try {
    if (!token) throw new AuthBackendError(401, "Sua sessão expirou. Entre novamente.");
    await loadProfile(token);
    if (payload) {
      await saveQuotation(token, id, payload);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ quotation: await loadQuotation(token, id) });
  } catch (error) {
    const status = error instanceof AuthBackendError ? error.status : 503;
    if (status === 401 || status === 403) {
      const response = NextResponse.json({ message: "Sua sessão expirou. Entre novamente." }, { status: 401 });
      response.cookies.set(SESSION_COOKIE_NAME, "", expiredSessionCookieOptions());
      return response;
    }
    const message = error instanceof AuthBackendError && [400, 404, 409].includes(status)
      ? error.message : "Não foi possível acessar o orçamento agora. Tente novamente.";
    return NextResponse.json({ message }, { status: [400, 404, 409].includes(status) ? status : 503 });
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  return handleQuotationRequest(cookieStore.get(SESSION_COOKIE_NAME)?.value, (await params).id);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let payload: CreateQuotationPayload;
  try {
    payload = await request.json();
    if (!payload || typeof payload !== "object") throw new Error();
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }
  const cookieStore = await cookies();
  return handleQuotationRequest(cookieStore.get(SESSION_COOKIE_NAME)?.value, (await params).id, payload);
}
