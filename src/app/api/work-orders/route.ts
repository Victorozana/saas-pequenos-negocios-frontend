import { forwardModuleRequest } from "@/lib/api/module-proxy";

export function GET(request: Request) {
  return forwardModuleRequest(request, "work-orders" + new URL(request.url).search);
}
