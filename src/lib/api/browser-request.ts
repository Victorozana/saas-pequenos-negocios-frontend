export class RequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function browserRequest<T>(
  url: string,
  method = "GET",
  payload?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      cache: "no-store",
      headers:
        payload === undefined ? {} : { "Content-Type": "application/json" },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
  } catch {
    throw new RequestError(503, "Falha de conexão. Tente novamente.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (response.status === 401 && !url.endsWith("/invitations/accept"))
      window.location.assign(
        `/login?next=${encodeURIComponent(window.location.pathname)}`,
      );
    throw new RequestError(
      response.status,
      body?.message || "Não foi possível concluir a ação.",
    );
  }
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
