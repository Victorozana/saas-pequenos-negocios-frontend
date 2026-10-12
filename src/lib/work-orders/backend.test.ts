import { describe, expect, it, vi } from "vitest";
import { convertQuotationToWorkOrder, updateWorkOrderStatus } from "./backend";

describe("contrato de conversão de orçamento", () => {
  it("consome o título ProblemDetails e mantém o status de domínio", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 400, title: "Não foi possível converter o orçamento em ordem de serviço.",
    }), { status: 400, headers: { "Content-Type": "application/problem+json" } }));
    await expect(convertQuotationToWorkOrder("test-token", "quotation", fetcher)).rejects.toMatchObject({
      status: 400, message: "Não foi possível converter o orçamento em ordem de serviço.",
    });
  });

  it("aceita o challenge 401 vazio sem tentar tratá-lo como JSON", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    await expect(convertQuotationToWorkOrder("test-token", "quotation", fetcher)).rejects.toMatchObject({
      status: 401, message: "Sua sessão expirou. Entre novamente.",
    });
  });

  it("mapeia workOrderId tipado e rejeita sucesso sem o identificador", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ workOrderId: "order-id" }))
      .mockResolvedValueOnce(Response.json({}));
    await expect(convertQuotationToWorkOrder("test-token", "quotation", fetcher)).resolves.toEqual({ id: "order-id" });
    await expect(convertQuotationToWorkOrder("test-token", "quotation", fetcher)).rejects.toMatchObject({ status: 502 });
  });

  it("envia o enum numérico do schema para atualizar OS e aceita 204 sem corpo", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    await expect(updateWorkOrderStatus("test-token", "order-id", "Completed", undefined, fetcher)).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      method: "PATCH", body: JSON.stringify({ status: 4 }),
    }));
  });
});
