import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuotationDetail } from "@/lib/quotations/backend";
import { QuotationModal } from "./quotation-modal";
import { QuotationList } from "./quotation-list";

const quotation: QuotationDetail = {
  id: "quotation-1", code: "ORC-123", customerId: "customer-1", customerName: "Cliente",
  issueDate: "2026-10-10T10:00:00Z", validUntil: "2026-12-10T00:00:00Z", status: "Pending",
  notes: "Observação existente", paymentTerms: "Saldo na entrega", subtotalAmount: 100, discountAmount: 0, totalAmount: 100,
  depositInfo: { type: 1, value: 25, paymentNotes: "Entrada combinada" },
  items: [{ id: "item-1", serviceItemId: null, serviceName: "Serviço original", unit: "un", unitPrice: 100, quantity: 1, discountAmount: 0, totalPrice: 100 }],
};

function mockFetch() {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    if (init?.method === "PUT") return new Response(null, { status: 204 });
    if (String(input).includes("/api/services")) return Response.json({ services: { items: [], totalCount: 0 } });
    if (String(input).includes("/api/customers")) return Response.json({ customers: { items: [{ id: "customer-1", name: "Cliente" }] } });
    if (String(input) === "/api/quotations/quotation-1") return Response.json({ quotation });
    return Response.json({ quotations: { items: [quotation, { ...quotation, id: "approved", code: "ORC-456", status: "Approved" }], totalCount: 2, page: 1, pageSize: 10 } });
  });
}

describe("AC-206 pending quotation editing", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("edits pending items and notes while preserving code, issue date, payment terms and deposit", async () => {
    const fetchSpy = mockFetch();
    const saved = vi.fn();
    render(<QuotationModal isOpen onClose={vi.fn()} onSaved={saved} quotationToEdit={quotation} />);
    await screen.findByRole("option", { name: "Cliente" });
    expect(screen.getByDisplayValue("Serviço original")).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/^Serviço/), { target: { value: "Serviço revisado" } });
    fireEvent.change(screen.getByLabelText(/Quantidade/), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText(/Observações/), { target: { value: "Observação revisada" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar Orçamento" }));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    const request = fetchSpy.mock.calls.find(([, init]) => init?.method === "PUT");
    expect(request?.[0]).toBe("/api/quotations/quotation-1");
    expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
      code: quotation.code, issueDate: quotation.issueDate, customerId: quotation.customerId,
      paymentTerms: quotation.paymentTerms, notes: "Observação revisada", deposit: quotation.depositInfo,
      items: [{ serviceName: "Serviço revisado", quantity: 2, unitPrice: 100 }],
    });
  });

  it("rejects editing a quotation that is no longer pending", async () => {
    const fetchSpy = mockFetch();
    render(<QuotationModal isOpen onClose={vi.fn()} onSaved={vi.fn()} quotationToEdit={{ ...quotation, status: "Approved" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Salvar Orçamento" }));
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Somente orçamentos pendentes podem ser editados.");
    expect(fetchSpy.mock.calls.some(([, init]) => init?.method === "PUT")).toBe(false);
  });

  it("offers edit only for pending quotations and loads their full details", async () => {
    const fetchSpy = mockFetch();
    render(<QuotationList onNewQuotation={vi.fn()} />);
    const edit = await screen.findByRole("button", { name: "Editar orçamento ORC-123" });
    expect(screen.queryByRole("button", { name: "Editar orçamento ORC-456" })).toBeNull();
    fireEvent.click(edit);
    expect(await screen.findByText("Editar Orçamento")).toBeTruthy();
    expect(screen.getByDisplayValue("Serviço original")).toBeTruthy();
    expect(fetchSpy).toHaveBeenCalledWith("/api/quotations/quotation-1");
  });
});
