import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuotationModal } from "./quotation-modal";

const mockCustomers = {
  customers: {
    items: [
      { id: "cust-1", name: "Cliente Alpha" },
      { id: "cust-2", name: "Cliente Beta" },
    ],
  },
};

describe("QuotationModal", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(<QuotationModal isOpen={false} onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders correctly when open and loads customers", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async input => Response.json(String(input).includes("/api/services") ? { services: { items: [], totalCount: 0 } } : mockCustomers));

    render(<QuotationModal isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByText("Novo Orçamento")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Cliente Alpha")).toBeTruthy();
      expect(screen.getByText("Cliente Beta")).toBeTruthy();
    });
  });

  it("calculates total price correctly when quantities, prices and discounts change", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async input => Response.json(String(input).includes("/api/services") ? { services: { items: [], totalCount: 0 } } : mockCustomers));

    render(<QuotationModal isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} />);

    const quantityInput = screen.getByLabelText(/Quantidade/i);
    const priceInput = screen.getByLabelText(/Preço Unit/i);
    const discountInput = screen.getByLabelText(/Desconto/i);

    fireEvent.change(quantityInput, { target: { value: "2" } });
    fireEvent.change(priceInput, { target: { value: "150" } });
    fireEvent.change(discountInput, { target: { value: "50" } });

    // (2 * 150) - 50 = 250
    await waitFor(() => {
      const formatted = screen.getAllByText(/250,00/);
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  it("validates missing customer on submit", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async input => Response.json(String(input).includes("/api/services") ? { services: { items: [], totalCount: 0 } } : mockCustomers));

    render(<QuotationModal isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Cliente Alpha")).toBeTruthy();
    });

    const priceInput = screen.getByLabelText(/Preço Unit/i);
    fireEvent.change(priceInput, { target: { value: "100" } });

    const submitButton = screen.getByRole("button", { name: /Gerar Orçamento/i });
    fireEvent.click(submitButton);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Selecione um cliente.");
  });

  it("validates missing service name on submit", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async input => Response.json(String(input).includes("/api/services") ? { services: { items: [], totalCount: 0 } } : mockCustomers));

    render(<QuotationModal isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Cliente Alpha")).toBeTruthy();
    });

    const customerSelect = screen.getByLabelText(/Cliente/i);
    fireEvent.change(customerSelect, { target: { value: "cust-1" } });

    const priceInput = screen.getByLabelText(/Preço Unit/i);
    fireEvent.change(priceInput, { target: { value: "100" } });

    const submitButton = screen.getByRole("button", { name: /Gerar Orçamento/i });
    fireEvent.click(submitButton);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("O nome do serviço no item 1 é obrigatório.");
  });

  it("submits valid quotation and invokes onSaved and onClose", async () => {
    const handleClose = vi.fn();
    const handleSaved = vi.fn();

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/services")) {
        return Promise.resolve(Response.json({ services: { items: [], totalCount: 0 } }));
      }
      if (url.includes("/api/customers")) {
        return Promise.resolve(Response.json(mockCustomers));
      }
      if (url.includes("/api/quotations") && init?.method === "POST") {
        return Promise.resolve(Response.json({ id: "quot-123" }, { status: 201 }));
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    render(<QuotationModal isOpen={true} onClose={handleClose} onSaved={handleSaved} />);

    await waitFor(() => {
      expect(screen.getByText("Cliente Alpha")).toBeTruthy();
    });

    const customerSelect = screen.getByLabelText(/Cliente/i);
    fireEvent.change(customerSelect, { target: { value: "cust-1" } });

    const serviceInput = screen.getByLabelText(/Serviço/i);
    fireEvent.change(serviceInput, { target: { value: "Instalação de Vidro" } });

    const priceInput = screen.getByLabelText(/Preço Unit/i);
    fireEvent.change(priceInput, { target: { value: "300" } });

    const submitButton = screen.getByRole("button", { name: /Gerar Orçamento/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/quotations",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Instalação de Vidro"),
        }),
      );
      expect(handleSaved).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });

    const postCall = fetchSpy.mock.calls.find(([, init]) => init?.method === "POST");
    const submitted = JSON.parse(String(postCall?.[1]?.body));
    expect(submitted).toMatchObject({
      code: expect.stringMatching(/^ORC-[0-9A-F-]{36}$/),
      customerId: "cust-1",
      issueDate: expect.any(String),
      notes: null,
      paymentTerms: null,
      deposit: null,
      items: [{
        serviceItemId: null,
        serviceName: "Instalação de Vidro",
        unit: "Unidade",
        unitPrice: 300,
        quantity: 1,
        discountAmount: 0,
      }],
    });
  });
  it("uses the tenant catalog and submits the selected service with its price and unit", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
      const url = String(input);
      if (url.includes("/api/customers")) return Promise.resolve(Response.json(mockCustomers));
      if (url.includes("/api/services")) return Promise.resolve(Response.json({ services: {
        items: [
          { id: "service-1", name: "Corte cadastrado", unit: "m²", basePrice: 150, isActive: true },
          { id: "inactive", name: "Servico inativo", unit: "un", basePrice: 50, isActive: false },
        ], totalCount: 2,
      } }));
      if (init?.method === "POST") return Promise.resolve(Response.json({ id: "quotation" }, { status: 201 }));
      return Promise.reject(new Error("Unexpected request"));
    });
    render(<QuotationModal isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} />);
    await screen.findByText("Corte cadastrado");
    expect(screen.queryByText("Servico inativo")).toBeNull();
    fireEvent.change(screen.getByLabelText(/Cliente/i), { target: { value: "cust-1" } });
    fireEvent.change(screen.getByLabelText(/Catálogo cadastrado/i), { target: { value: "service-1" } });
    fireEvent.click(screen.getByRole("button", { name: /Gerar Orçamento/i }));
    await waitFor(() => {
      const call = fetchSpy.mock.calls.find(([, init]) => init?.method === "POST");
      expect(JSON.parse(String(call?.[1]?.body)).items[0]).toMatchObject({
        serviceItemId: "service-1", serviceName: "Corte cadastrado", unit: "m²", unitPrice: 150,
      });
    });
  });
});
