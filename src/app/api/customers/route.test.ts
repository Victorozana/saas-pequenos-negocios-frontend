import { describe, expect, it, vi } from "vitest";

import { AuthBackendError, type UserProfile } from "@/lib/auth/backend";
import { type PaginatedCustomers } from "@/lib/customers/backend";
import { handleCreateCustomer, handleGetCustomers } from "./route";

const mockUser: UserProfile = {
  id: "user-1",
  name: "Carlos Silva",
  email: "carlos@exemplo.com",
  role: "Owner",
  tenantId: "tenant-1",
  permissions: ["customers.read", "customers.write"],
  status: "Active",
};

const mockCustomers: PaginatedCustomers = {
  items: [
    {
      id: "cust-1",
      name: "Empresa X",
      phone: "11977777777",
      email: "contato@empresax.com",
      documentType: "CNPJ",
      documentValue: "12345678000199",
      street: "Av. Paulista",
      number: "1000",
      complement: "Sala 10",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
      isActive: true,
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 20,
};

describe("customers BFF routes", () => {
  it("GET returns user and paginated customers list", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const loadCustomers = vi.fn().mockResolvedValue(mockCustomers);

    const response = await handleGetCustomers("valid-token", "Empresa", 1, 20, loadProfile, loadCustomers);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user.name).toBe("Carlos Silva");
    expect(data.customers.items[0].name).toBe("Empresa X");
  });

  it("GET returns 401 on missing session token", async () => {
    const response = await handleGetCustomers(undefined);

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });

  it("POST creates new customer and returns 201 with id", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const saveCustomer = vi.fn().mockResolvedValue({ id: "cust-new-id" });

    const response = await handleCreateCustomer(
      "valid-token",
      { name: "Novo Cliente", phone: "11988888888" },
      loadProfile,
      saveCustomer,
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe("cust-new-id");
  });

  it("POST returns 401 on expired session error", async () => {
    const loadProfile = vi.fn().mockRejectedValue(new AuthBackendError(401, "Expired"));

    const response = await handleCreateCustomer(
      "expired-token",
      { name: "Novo Cliente", phone: "11988888888" },
      loadProfile,
    );

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });
});
