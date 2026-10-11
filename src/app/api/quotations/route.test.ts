import { describe, expect, it, vi } from "vitest";

import { AuthBackendError, type UserProfile } from "@/lib/auth/backend";
import { fetchQuotations, type PaginatedQuotations } from "@/lib/quotations/backend";
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
      code: "ORC-2026-001",
      customerName: "Empresa X",
      totalAmount: 1500,
      status: "Draft",
      validUntil: "2026-12-31T00:00:00Z",
      issueDate: "2026-08-14T00:00:00Z",
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 20,
};

describe("quotations BFF routes", () => {
  it("GET accepts the API list DTO with numeric Pending status and no detail fields", async () => {
    const backendResponse = {
      ...mockQuotations,
      items: [{ ...mockQuotations.items[0], status: 2, validUntil: null }],
    };
    const fetcher = vi.fn().mockResolvedValue(Response.json(backendResponse));
    const response = await handleGetQuotations(
      "valid-token", undefined, undefined, 1, 10,
      vi.fn().mockResolvedValue(mockUser),
      (token, search, status, page, pageSize) => fetchQuotations(
        token, search, status, page, pageSize, fetcher, "http://localhost:5050",
      ),
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.quotations.items[0]).toMatchObject({
      code: "ORC-2026-001", status: "Pending", validUntil: null,
    });
  });

  it("GET preserves invalid-response errors as 502 instead of reporting an unavailable service", async () => {
    const response = await handleGetQuotations(
      "valid-token", undefined, undefined, 1, 10,
      vi.fn().mockResolvedValue(mockUser),
      vi.fn().mockRejectedValue(new AuthBackendError(502, "Invalid response")),
    );
    expect(response.status).toBe(502);
  });

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
      {
        code: "ORC-2026-001",
        customerId: "cust-1",
        issueDate: "2026-10-10T12:00:00Z",
        validUntil: "2026-12-31T00:00:00Z",
        notes: null,
        paymentTerms: null,
        items: [],
        deposit: null,
      },
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
      {
        code: "ORC-2026-001",
        customerId: "cust-1",
        issueDate: "2026-10-10T12:00:00Z",
        validUntil: "2026-12-31T00:00:00Z",
        notes: null,
        paymentTerms: null,
        items: [],
        deposit: null,
      },
      loadProfile,
    );

    expect(response.status).toBe(401);
    expect(response.cookies.get("agendamento_session")?.value).toBe("");
  });
});
