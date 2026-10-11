// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { AuthBackendError, type UserProfile } from "@/lib/auth/backend";
import { handleExportQuotation } from "./route";

const mockUser: UserProfile = {
  id: "user-1",
  name: "Carlos Silva",
  email: "carlos@exemplo.com",
  role: "Owner",
  tenantId: "tenant-1",
  permissions: ["sales.read"],
  status: "Active",
};

describe("GET /api/quotations/[id]/export BFF handler", () => {
  it("returns 200 with application/pdf blob and Content-Disposition header", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const mockBlob = new Blob(["%PDF-1.4..."], { type: "application/pdf" });
    const exportPdf = vi.fn().mockResolvedValue(mockBlob);

    const response = await handleExportQuotation(
      "valid-token",
      "quot-1",
      loadProfile,
      exportPdf,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain('attachment; filename="orcamento-quot-1.pdf"');
    expect(await response.text()).toBe("%PDF-1.4...");
  });

  it("returns 404 without clearing the session when the quotation is not found", async () => {
    const response = await handleExportQuotation(
      "valid-token", "quot-missing",
      vi.fn().mockResolvedValue(mockUser),
      vi.fn().mockRejectedValue(new AuthBackendError(404, "Not found")),
    );

    expect(response.status).toBe(404);
    expect(response.headers.has("set-cookie")).toBe(false);
    expect(await response.json()).toEqual({ message: "Orçamento não encontrado." });
  });

  it("returns 401 and clears cookie when session is missing", async () => {
    const response = await handleExportQuotation(undefined, "quot-1");

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });

  it("returns 401 when session expires", async () => {
    const loadProfile = vi.fn().mockRejectedValue(new AuthBackendError(401, "Expired"));

    const response = await handleExportQuotation(
      "expired-token",
      "quot-1",
      loadProfile,
    );

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });

  it("returns safe 502 error when export fails", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const exportPdf = vi.fn().mockRejectedValue(new Error("PDF Generator failure"));

    const response = await handleExportQuotation(
      "valid-token",
      "quot-1",
      loadProfile,
      exportPdf,
    );

    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.message).toBe("Não foi possível exportar o orçamento agora. Tente novamente.");
  });
});
