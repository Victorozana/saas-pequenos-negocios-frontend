import { describe, expect, it, vi } from "vitest";

import { registerTenant } from "./route";

const request = { cnpj:"12", companyName:"Nexo", tradeName:"Nexo", legalNature:"LTDA", primaryCnae:"1", categoryId:10, email:"e@n.com", phone:"1", addressStreet:"Rua", addressNumber:"1", addressComplement:"-", addressNeighborhood:"Centro", addressCity:"SP", addressState:"SP", addressZipCode:"1", stateRegistration:"ISENTO", municipalRegistration:"1", isTaxExempt:true, taxRegime:"SimplesNacional", fiscalEmail:"f@n.com", adminName:"Admin", adminCpf:"1", adminEmail:"a@n.com", adminPassword:"SenhaSegura123!", isLegalRepresentative:true };

describe("tenant registration BFF", () => {
  it("forwards every payload field and idempotency key without exposing an upstream token", async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ message: "Criado" }), { status: 201, headers: { "X-Development-Verification-Token": "verification-token" } }));
    const response = await registerTenant(request, "idempotency-key", fetcher);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining("/api/v1/tenants"), expect.objectContaining({ headers: expect.objectContaining({ "Idempotency-Key": "idempotency-key" }), body: JSON.stringify(request) }));
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ message: "Criado" });
  });

  it("returns the Problem Details title for validation errors", async () => {
    const response = await registerTenant(request, "key", async () => Response.json({ title: "CNPJ inválido" }, { status: 422 }));
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ message: "CNPJ inválido" });
  });

  it("does not invent a verification token when the success header is missing", async () => {
    const response = await registerTenant(request, "key", async () => Response.json({ message: "Criado" }, { status: 201 }));
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ message: "Criado" });
  });

  it("rejects a malformed successful response without returning a verification token", async () => {
    const response = await registerTenant(request, "key", async () => Response.json({ created: true }, { status: 201, headers: { "X-Development-Verification-Token": "verification-token" } }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ message: "O serviço retornou uma resposta inválida." });
  });

  it("does not forward sensitive extra fields in an upstream success body", async () => {
    const response = await registerTenant(request, "key", async () => Response.json({
      message: "Criado", verificationToken: "placeholder", passwordHash: "placeholder", adminCpf: "placeholder",
    }, { status: 201 }));
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ message: "Criado" });
  });
});
