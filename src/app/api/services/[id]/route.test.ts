import { describe, expect, it, vi } from "vitest";

import { AuthBackendError, type UserProfile } from "@/lib/auth/backend";
import { handleUpdateService } from "./route";

const mockUser: UserProfile = {
  id: "user-1",
  name: "Carlos Silva",
  email: "carlos@exemplo.com",
  role: "Owner",
  tenantId: "tenant-1",
  permissions: ["services.write"],
  status: "Active",
};

describe("services [id] BFF route", () => {
  it("PUT updates service item and returns 200", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const saveService = vi.fn().mockResolvedValue(undefined);

    const response = await handleUpdateService(
      "valid-token",
      "srv-1",
      { name: "Serviço Alterado", unit: "m²", basePrice: 200 },
      loadProfile,
      saveService,
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("PUT returns 401 on missing session token", async () => {
    const response = await handleUpdateService(undefined, "srv-1", {
      name: "Teste",
      unit: "m²",
      basePrice: 100,
    });

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });

  it("PUT returns safe 503 error on backend failure", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const saveService = vi.fn().mockRejectedValue(new AuthBackendError(500, "Server Error"));

    const response = await handleUpdateService(
      "valid-token",
      "srv-1",
      { name: "Teste", unit: "m²", basePrice: 100 },
      loadProfile,
      saveService,
    );

    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.message).toBe("Não foi possível processar a requisição de serviços agora. Tente novamente.");
  });
});
