import { describe, expect, it, vi } from "vitest";
import { convertQuotationToWorkOrder, updateWorkOrderStatus } from "./backend";

const payload = { type: 1, participantIds: ["person"], startTime: "2026-11-05T15:00:00Z",
  endTime: "2026-11-05T16:00:00Z", address: null, notes: null };
const key = "1398161a-0c30-42c4-9fb8-b37c5c30190f";

describe("contrato de conversão de orçamento", () => {
  it("consome o título ProblemDetails e mantém o status de domínio", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 400, title: "Não foi possível converter o orçamento em ordem de serviço.",
    }), { status: 400, headers: { "Content-Type": "application/problem+json" } }));
    await expect(convertQuotationToWorkOrder("test-token", "quotation", payload, key, fetcher)).rejects.toMatchObject({
      status: 400, message: "Não foi possível converter o orçamento em ordem de serviço.",
    });
  });

  it("aceita o challenge 401 vazio sem tentar tratá-lo como JSON", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    await expect(convertQuotationToWorkOrder("test-token", "quotation", payload, key, fetcher)).rejects.toMatchObject({
      status: 401, message: "Sua sessão expirou. Entre novamente.",
    });
  });

  it("mapeia id tipado e rejeita sucesso sem o identificador", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ id: "order-id" }))
      .mockResolvedValueOnce(Response.json({}));
    await expect(convertQuotationToWorkOrder("test-token", "quotation", payload, key, fetcher)).resolves.toEqual({ id: "order-id" });
    expect(fetcher).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/work-orders\/from-quotation\/quotation$/),
      expect.objectContaining({ body: JSON.stringify(payload), headers: expect.objectContaining({ "Idempotency-Key": key }) }));
    await expect(convertQuotationToWorkOrder("test-token", "quotation", payload, key, fetcher)).rejects.toMatchObject({ status: 502 });
  });

  it("envia o enum numérico do schema para atualizar OS e aceita 204 sem corpo", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    await expect(updateWorkOrderStatus("test-token", "order-id", "Completed", undefined, fetcher)).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      method: "PATCH", body: JSON.stringify({ status: 4 }),
    }));
  });
});
