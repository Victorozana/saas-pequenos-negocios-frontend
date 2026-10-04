import { describe, expect, it, vi } from "vitest";

import { AuthBackendError, type UserProfile } from "@/lib/auth/backend";
import { type PaginatedQuotations } from "@/lib/quotations/backend";
import { handleCreateQuotation, handleGetQuotations } from "./route";

const mockUser: UserProfile = {
  id: "user-1",
  name: "Carlos Silva",
  email: "carlos@exemplo.com",
  role: "Owner",
  tenantId: "tenant-1",
  permissions: ["sales.read", "sales.write"],
  status: "Active",
};

const mockQuotations: PaginatedQuotations = {
  items: [
    {
      id: "quot-1",
      customerId: "cust-1",
      customerName: "Empresa X",
      totalAmount: 1500,
      status: "Draft",
      validUntil: "2026-12-31T00:00:00Z",
      notes: null,
      createdAt: "2026-08-14T00:00:00Z",
      items: [
        {
          id: "item-1",
          serviceName: "Consultoria",
          unit: "Horas",
          unitPrice: 150,
          quantity: 10,
          discountAmount: 0,
          totalPrice: 1500,
        }
      ]
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 20,
};

describe("quotations BFF routes", () => {
  it("GET returns user and paginated quotations list", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const loadQuotations = vi.fn().mockResolvedValue(mockQuotations);

    const response = await handleGetQuotations("valid-token", undefined, undefined, 1, 20, loadProfile, loadQuotations);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.user.name).toBe("Carlos Silva");
    expect(data.quotations.items[0].customerName).toBe("Empresa X");
  });

  it("GET returns 401 on missing session token", async () => {
    const response = await handleGetQuotations(undefined);

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });

  it("POST creates new quotation and returns 201 with id", async () => {
    const loadProfile = vi.fn().mockResolvedValue(mockUser);
    const saveQuotation = vi.fn().mockResolvedValue({ id: "quot-new-id" });

    const response = await handleCreateQuotation(
      "valid-token",
      { customerId: "cust-1", validUntil: "2026-12-31T00:00:00Z", items: [] },
      loadProfile,
      saveQuotation,
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe("quot-new-id");
  });

  it("POST returns 401 on expired session error", async () => {
    const loadProfile = vi.fn().mockRejectedValue(new AuthBackendError(401, "Expired"));

    const response = await handleCreateQuotation(
      "expired-token",
      { customerId: "cust-1", validUntil: "2026-12-31T00:00:00Z", items: [] },
      loadProfile,
    );

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });
});
