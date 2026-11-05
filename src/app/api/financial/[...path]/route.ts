import { NextResponse } from "next/server";
import { forwardModuleRequest } from "@/lib/api/module-proxy";

type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  const path = (await context.params).path.join("/");
  const guid =
    "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
  const allowed =
    request.method === "GET"
      ? /^(receivables|payables|statement)$/.test(path)
      : path === "payables" ||
        new RegExp(`^(receivables|payables)/${guid}/pay$`).test(path);
  if (!allowed)
    return NextResponse.json(
      { message: "Rota não encontrada." },
      { status: 404 },
    );
  const query = new URLSearchParams();
  if (path === "statement") {
    const input = new URL(request.url).searchParams;
    for (const key of ["startDate", "endDate"]) {
      const value = input.get(key);
      if (!value || !Number.isFinite(Date.parse(value)))
        return NextResponse.json(
          { message: "Informe um período válido." },
          { status: 400 },
        );
      query.set(key, value);
    }
  }
  return forwardModuleRequest(
    request,
    `financial/${path}${query.size ? `?${query}` : ""}`,
  );
}
export const GET = handle;
export const POST = handle;
