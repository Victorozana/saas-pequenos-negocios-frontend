import { describe, expect, it, vi } from "vitest";

import { AuthBackendError, type UserProfile } from "@/lib/auth/backend";
import { type PaginatedServices } from "@/lib/services/backend";
import { handleCreateService, handleGetServices } from "./route";

const mockUser: UserProfile = {
  id: "user-1",
  name: "Carlos Silva",
  email: "carlos@exemplo.com",
  role: "Owner",
  tenantId: "tenant-1",
  permissions: ["services.read", "services.write"],
  status: "Active",
};

const mockServices: PaginatedServices = {
  items: [
    {
      id: "srv-1",
      name: "Acabamento de Borda",
      description: "Polimento meia esquadria",
      unit: "m",
      basePrice: 85,
      isActive: true,
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 20,
};

describe("services BFF routes", () => {
  it("GET returns user and paginated services list", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const loadServices = vi.fn().mockResolvedValue(mockServices);

    const response = await handleGetServices("valid-token", "Acabamento", 1, 20, loadProfile, loadServices);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user.name).toBe("Carlos Silva");
    expect(data.services.items[0].name).toBe("Acabamento de Borda");
  });

  it("GET returns 401 on missing session token", async () => {
    const response = await handleGetServices(undefined);

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });

  it("POST creates new service and returns 201 with id", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const saveService = vi.fn().mockResolvedValue({ id: "srv-new-id" });

    const response = await handleCreateService(
      "valid-token",
      { name: "Novo Serviço", unit: "unidade", basePrice: 150 },
      loadProfile,
      saveService,
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe("srv-new-id");
  });

  it("POST returns 401 on expired session error", async () => {
    const loadProfile = vi.fn().mockRejectedValue(new AuthBackendError(401, "Expired"));

    const response = await handleCreateService(
      "expired-token",
      { name: "Novo Serviço", unit: "unidade", basePrice: 150 },
      loadProfile,
    );

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });
});
