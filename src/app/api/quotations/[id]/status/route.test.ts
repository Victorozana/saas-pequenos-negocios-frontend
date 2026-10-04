import { describe, expect, it, vi } from "vitest";

import { AuthBackendError, type UserProfile } from "@/lib/auth/backend";
import { handleUpdateQuotationStatus } from "./route";

const mockUser: UserProfile = {
  id: "user-1",
  name: "Carlos Silva",
  email: "carlos@exemplo.com",
  role: "Owner",
  tenantId: "tenant-1",
  permissions: ["sales.write"],
  status: "Active",
};

describe("PATCH /api/quotations/[id]/status BFF handler", () => {
  it("returns 200 with success when update succeeds", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const updateStatus = vi.fn().mockResolvedValue(undefined);

    const response = await handleUpdateQuotationStatus(
      "valid-token",
      "quot-1",
      "Approved",
      loadProfile,
      updateStatus,
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(updateStatus).toHaveBeenCalledWith("valid-token", "quot-1", "Approved");
  });

  it("returns 401 and clears cookie when session is missing", async () => {
    const response = await handleUpdateQuotationStatus(
      undefined,
      "quot-1",
      "Approved",
    );

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });

  it("returns 401 when backend throws expired session error", async () => {
    const loadProfile = vi.fn().mockRejectedValue(new AuthBackendError(401, "Expired"));

    const response = await handleUpdateQuotationStatus(
      "expired-token",
      "quot-1",
      "Approved",
      loadProfile,
    );

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });

  it("returns safe 502 error on unexpected failure", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const updateStatus = vi.fn().mockRejectedValue(new Error("Connection error"));

    const response = await handleUpdateQuotationStatus(
      "valid-token",
      "quot-1",
      "Approved",
      loadProfile,
      updateStatus,
    );

    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.message).toBe("Não foi possível processar a requisição de orçamentos agora. Tente novamente.");
  });
});
