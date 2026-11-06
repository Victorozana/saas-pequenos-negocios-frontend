import { forwardModuleRequest } from "@/lib/api/module-proxy";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return forwardModuleRequest(request, "work-orders/" + encodeURIComponent((await params).id) + "/schedule");
}
