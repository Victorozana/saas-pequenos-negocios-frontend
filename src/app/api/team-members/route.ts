import { forwardModuleRequest } from "@/lib/api/module-proxy";
export async function GET(request: Request) {
  return forwardModuleRequest(request, "team-members");
}
