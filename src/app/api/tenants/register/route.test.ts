import { describe, expect, it, vi } from "vitest";

import { registerTenant } from "./route";

const request = { cnpj:"12", companyName:"Nexo", tradeName:"Nexo", legalNature:"LTDA", primaryCnae:"1", categoryId:10, email:"e@n.com", phone:"1", addressStreet:"Rua", addressNumber:"1", addressComplement:"-", addressNeighborhood:"Centro", addressCity:"SP", addressState:"SP", addressZipCode:"1", stateRegistration:"ISENTO", municipalRegistration:"1", isTaxExempt:true, taxRegime:"SimplesNacional", fiscalEmail:"f@n.com", adminName:"Admin", adminCpf:"1", adminEmail:"a@n.com", adminPassword:"SenhaSegura123!", isLegalRepresentative:true };

describe("tenant registration BFF", () => {
  it("forwards every payload field and idempotency key, returning only the header token", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ message: "Criado" }), { status: 201, headers: { "X-Development-Verification-Token": "verification-token" } }));
    const response = await registerTenant(request, "idempotency-key", fetcher);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/api/v1/tenants"), expect.objectContaining({ headers: expect.objectContaining({ "Idempotency-Key": "idempotency-key" }), body: JSON.stringify(request) }));
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ message: "Criado", token: "verification-token" });
  });

  it("returns the Problem Details title for validation errors", async () => {
    const response = await registerTenant(request, "key", async () => Response.json({ title: "CNPJ inválido" }, { status: 422 }));
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ message: "CNPJ inválido" });
  });

  it("does not invent a verification token when the success header is missing", async () => {
    const response = await registerTenant(request, "key", async () => Response.json({ message: "Criado" }, { status: 201 }));
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ message: "A confirmação não pode continuar neste ambiente." });
  });
});
