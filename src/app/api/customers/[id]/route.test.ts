import { describe, expect, it, vi } from "vitest";

import { AuthBackendError, type UserProfile } from "@/lib/auth/backend";
import { handleUpdateCustomer } from "./route";

const mockUser: UserProfile = {
  id: "user-1",
  name: "Carlos Silva",
  email: "carlos@exemplo.com",
  role: "Owner",
  tenantId: "tenant-1",
  permissions: ["customers.write"],
  status: "Active",
};

describe("customers [id] BFF route", () => {
  it("PUT updates customer and returns 200", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const saveCustomer = vi.fn().mockResolvedValue(undefined);

    const response = await handleUpdateCustomer(
      "valid-token",
      "cust-1",
      { customerId: "cust-1", name: "Cliente Alterado", phone: "11988888888" },
      loadProfile,
      saveCustomer,
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("PUT returns 401 on missing session token", async () => {
    const response = await handleUpdateCustomer(undefined, "cust-1", {
      customerId: "cust-1",
      name: "Teste",
      phone: "11988888888",
    });

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });

  it("PUT returns safe 503 error on backend server failure", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const saveCustomer = vi.fn().mockRejectedValue(new AuthBackendError(500, "Server Error"));

    const response = await handleUpdateCustomer(
      "valid-token",
      "cust-1",
      { customerId: "cust-1", name: "Teste", phone: "11988888888" },
      loadProfile,
      saveCustomer,
    );

    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.message).toBe("Não foi possível processar a requisição de clientes agora. Tente novamente.");
  });
});
