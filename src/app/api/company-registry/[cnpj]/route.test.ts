import { describe, expect, it, vi } from "vitest";

import { lookupCompany } from "./route";

const company = {
  cnpj: "00000000000191",
  corporateName: "Empresa Exemplo LTDA",
  tradeName: "Empresa Exemplo",
  legalNature: "Sociedade Empresária Limitada",
  cnaes: ["2391503", "4744005"],
  status: "ATIVA",
  address: {
    street: "Rua das Flores",
    number: "10",
    complement: "Sala 2",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    zipCode: "01001000",
  },
};

describe("company registry BFF", () => {
  it("uses the exact backend URL and returns every validated field", async () => {
    const fetcher = vi.fn(async () => Response.json(company));

    const response = await lookupCompany("00.000.000/0001-91", fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:5050/api/v1/company-registry/00.000.000%2F0001-91",
      { cache: "no-store" },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(company);
  });

  it.each([
    [400, "CNPJ inválido."],
    [404, "Empresa não encontrada."],
    [422, "A empresa não está ativa."],
    [429, "Não foi possível consultar o CNPJ agora."],
    [500, "Não foi possível consultar o CNPJ agora."],
  ])("maps upstream HTTP %i to a safe response", async (upstreamStatus, message) => {
    const response = await lookupCompany("00000000000191", async () =>
      Response.json({ title: "provider database host leaked" }, { status: upstreamStatus }));

    expect(response.status).toBe(upstreamStatus === 400 || upstreamStatus === 404 || upstreamStatus === 422 ? upstreamStatus : 503);
    await expect(response.json()).resolves.toEqual({ message });
  });

  it.each([
    ["missing address", { ...company, address: undefined }],
    ["invalid CNAEs", { ...company, cnaes: [123] }],
    ["invalid body", "not-json"],
  ])("rejects a successful response with %s", async (_scenario, payload) => {
    const response = await lookupCompany("00000000000191", async () =>
      typeof payload === "string"
        ? new Response(payload, { status: 200, headers: { "Content-Type": "application/json" } })
        : Response.json(payload));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ message: "Não foi possível consultar o CNPJ agora." });
  });

  it("hides network details", async () => {
    const response = await lookupCompany("00000000000191", async () => {
      throw new Error("provider hostname leaked");
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ message: "Não foi possível consultar o CNPJ agora." });
  });
});
