import { describe, expect, it, vi } from "vitest";
import { AuthBackendError } from "@/lib/auth/backend";
import { handleQuotationRequest } from "./route";
import type { CreateQuotationPayload } from "@/lib/quotations/backend";

const payload: CreateQuotationPayload = {
  code: "ORC-1", customerId: "customer-1", issueDate: "2026-10-10T00:00:00Z", validUntil: null,
  notes: "Revisado", paymentTerms: null, items: [], deposit: null,
};

describe("AC-206 quotation route", () => {
  it("does not read or update quotations without an authenticated session", async () => {
    const profile = vi.fn();
    const save = vi.fn();
    const result = await handleQuotationRequest(undefined, "quotation-1", payload, profile, vi.fn(), save);
    expect(result.status).toBe(401);
    expect(profile).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("forwards the edit after validating the session", async () => {
    const profile = vi.fn();
    const save = vi.fn();
    const result = await handleQuotationRequest("test-token", "quotation-1", payload, profile, vi.fn(), save);
    expect(result.status).toBe(200);
    expect(profile).toHaveBeenCalledWith("test-token");
    expect(save).toHaveBeenCalledWith("test-token", "quotation-1", payload);
  });

  it("preserves backend validation rejection without reporting a successful edit", async () => {
    const save = vi.fn().mockRejectedValue(new AuthBackendError(400, "Somente orçamentos pendentes podem ser editados."));
    const result = await handleQuotationRequest("test-token", "quotation-1", payload, vi.fn(), vi.fn(), save);
    expect(result.status).toBe(400);
    expect(await result.json()).toEqual({ message: "Somente orçamentos pendentes podem ser editados." });
  });

  it("returns missing tenant-scoped quotation as 404 without expiring a valid session", async () => {
    const load = vi.fn().mockRejectedValue(new AuthBackendError(404, "Orçamento não encontrado."));
    const result = await handleQuotationRequest("test-token", "other-tenant", undefined, vi.fn(), load);
    expect(result.status).toBe(404);
    expect(result.cookies.getAll()).toHaveLength(0);
  });
});
