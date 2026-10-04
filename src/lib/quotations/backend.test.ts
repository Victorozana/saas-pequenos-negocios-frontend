import { describe, expect, it, vi } from "vitest";

import { AuthBackendError } from "@/lib/auth/backend";
import {
  createQuotation,
  exportQuotationPdf,
  fetchQuotations,
  isPaginatedQuotations,
  isQuotation,
  isQuotationItem,
  updateQuotationStatus,
} from "./backend";

describe("quotations backend client", () => {
  it("validates quotation type guards correctly", () => {
    const validItem = {
      id: "item-1",
      serviceName: "Instalação",
      unit: "Unidade",
      unitPrice: 100,
      quantity: 2,
      discountAmount: 10,
      totalPrice: 190,
    };
    expect(isQuotationItem(validItem)).toBe(true);
    expect(isQuotationItem(null)).toBe(false);
    expect(isQuotationItem({ id: "item-1" })).toBe(false);

    const validQuotation = {
      id: "quot-1",
      customerId: "cust-1",
      customerName: "Empresa",
      totalAmount: 190,
      status: "Draft",
      validUntil: "2026-12-31T00:00:00Z",
      notes: null,
      items: [validItem],
      createdAt: "2026-08-15T00:00:00Z",
    };
    expect(isQuotation(validQuotation)).toBe(true);
    expect(isQuotation(null)).toBe(false);

    const validPaginated = {
      items: [validQuotation],
      totalCount: 1,
      page: 1,
      pageSize: 20,
    };
    expect(isPaginatedQuotations(validPaginated)).toBe(true);
    expect(isPaginatedQuotations({ items: "invalid" })).toBe(false);
  });

  it("fetchQuotations passes token, search, status, and pagination query params", async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            {
              id: "quot-1",
              customerId: "cust-1",
              customerName: "Vidraçaria Silva",
              totalAmount: 500,
              status: "Sent",
              validUntil: "2026-12-31T00:00:00Z",
              notes: null,
              items: [
                {
                  id: "it-1",
                  serviceName: "Box Vidro",
                  unit: "Unidade",
                  unitPrice: 500,
                  quantity: 1,
                  discountAmount: 0,
                  totalPrice: 500,
                },
              ],
              createdAt: "2026-08-15T00:00:00Z",
            },
          ],
          totalCount: 1,
          page: 2,
          pageSize: 10,
        }),
    });

    const result = await fetchQuotations(
      "test-token",
      "Silva",
      "Sent",
      2,
      10,
      mockFetcher as unknown as typeof fetch,
      "http://localhost:5050",
    );

    expect(mockFetcher).toHaveBeenCalledWith(
      "http://localhost:5050/api/v1/quotations?search=Silva&status=Sent&page=2&pageSize=10",
      expect.objectContaining({
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer test-token",
        },
      }),
    );
    expect(result.items.length).toBe(1);
    expect(result.items[0].customerName).toBe("Vidraçaria Silva");
  });

  it("createQuotation sends POST payload and returns created id", async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "quot-created-999" }),
    });

    const payload = {
      customerId: "cust-1",
      validUntil: "2026-12-31T00:00:00Z",
      items: [
        {
          serviceName: "Manutenção",
          unit: "Horas",
          unitPrice: 120,
          quantity: 3,
          discountAmount: 20,
        },
      ],
    };

    const result = await createQuotation(
      "test-token",
      payload,
      mockFetcher as unknown as typeof fetch,
      "http://localhost:5050",
    );

    expect(mockFetcher).toHaveBeenCalledWith(
      "http://localhost:5050/api/v1/quotations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    expect(result.id).toBe("quot-created-999");
  });

  it("updateQuotationStatus sends PATCH request with new status", async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await updateQuotationStatus(
      "test-token",
      "quot-1",
      "Approved",
      mockFetcher as unknown as typeof fetch,
      "http://localhost:5050",
    );

    expect(mockFetcher).toHaveBeenCalledWith(
      "http://localhost:5050/api/v1/quotations/quot-1/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "Approved" }),
      }),
    );
  });

  it("exportQuotationPdf fetches pdf binary blob", async () => {
    const mockBlob = new Blob(["pdf content"], { type: "application/pdf" });
    const mockFetcher = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    const result = await exportQuotationPdf(
      "test-token",
      "quot-1",
      mockFetcher as unknown as typeof fetch,
      "http://localhost:5050",
    );

    expect(mockFetcher).toHaveBeenCalledWith(
      "http://localhost:5050/api/v1/quotations/quot-1/export/pdf",
      expect.objectContaining({
        method: "GET",
        headers: {
          Authorization: "Bearer test-token",
        },
      }),
    );
    expect(result).toBe(mockBlob);
  });

  it("handles network and server errors gracefully with AuthBackendError", async () => {
    const mockReject = vi.fn().mockRejectedValue(new Error("Network failure"));

    await expect(
      fetchQuotations("token", undefined, undefined, 1, 20, mockReject as unknown as typeof fetch),
    ).rejects.toThrow(AuthBackendError);
  });
});
