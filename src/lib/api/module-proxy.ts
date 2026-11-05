import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/auth/backend";
import {
  SESSION_COOKIE_NAME,
  expiredSessionCookieOptions,
} from "@/lib/auth/session-cookie";

/** Forward only explicitly allowed module operations; credentials never reach the browser. */
export async function forwardModuleRequest(
  request: Request,
  path: string,
  anonymous = false,
) {
  const token = anonymous
    ? undefined
    : (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const headers = { "Cache-Control": "no-store" };
  if (!anonymous && !token)
    return NextResponse.json(
      { message: "Sua sessão expirou. Entre novamente." },
      { status: 401, headers },
    );

  let body: string | undefined;
  if (request.method !== "GET") {
    // The browser sends JSON only. Never forward arbitrary content or authentication headers.
    try {
      body = JSON.stringify(await request.json());
    } catch {
      return NextResponse.json(
        { message: "Dados inválidos." },
        { status: 400, headers },
      );
    }
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return NextResponse.json(
        { message: "Origem inválida." },
        { status: 403, headers },
      );
  }
  try {
    const upstream = await fetch(`${getApiBaseUrl()}/api/v1/${path}`, {
      method: request.method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!upstream.ok) {
      const problem = await upstream.json().catch(() => null);
      const status = upstream.status;
      const defaults: Record<number, string> = {
        401: "Sua sessão expirou. Entre novamente.",
        403: "Você não tem permissão para esta ação.",
        404: "Este registro não está mais disponível. Atualize a lista.",
        400: "Confira os dados informados.",
        409: "Os dados foram alterados. Atualize e tente novamente.",
      };
      const message =
        status === 400 || status === 409
          ? typeof problem?.title === "string"
            ? problem.title
            : defaults[status]
          : defaults[status];
      const response = NextResponse.json(
        { message: message || "O serviço está indisponível. Tente novamente." },
        { status: status >= 500 ? 503 : status, headers },
      );
      if (status === 401 && !anonymous)
        response.cookies.set(
          SESSION_COOKIE_NAME,
          "",
          expiredSessionCookieOptions(),
        );
      return response;
    }
    if (upstream.status === 204)
      return new NextResponse(null, { status: 204, headers });
    const text = await upstream.text();
    return new NextResponse(text || null, {
      status: upstream.status,
      headers: {
        ...headers,
        ...(text ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível conectar ao serviço. Tente novamente." },
      { status: 503, headers },
    );
  }
}
