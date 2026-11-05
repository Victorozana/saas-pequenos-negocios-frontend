import { NextResponse } from "next/server";
import { forwardModuleRequest } from "@/lib/api/module-proxy";
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  const path = (await context.params).path.join("/");
  const guid =
    "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
  const allowed =
    request.method === "POST"
      ? ["invitations", "invitations/accept"].includes(path)
      : request.method === "PUT"
        ? new RegExp(`^${guid}$`).test(path)
        : new RegExp(`^${guid}/status$`).test(path);
  if (!allowed)
    return NextResponse.json(
      { message: "Rota não encontrada." },
      { status: 404 },
    );
  return forwardModuleRequest(
    request,
    `team-members/${path}`,
    path === "invitations/accept",
  );
}
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
