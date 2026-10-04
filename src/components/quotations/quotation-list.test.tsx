import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuotationList } from "./quotation-list";

const mockQuotationsData = {
  quotations: {
    items: [
      {
        id: "quot-1",
        customerId: "cust-1",
        customerName: "Vidraçaria Central",
        totalAmount: 1200,
        status: "Draft",
        validUntil: "2026-12-31T00:00:00Z",
        notes: "Entrega em 5 dias",
        createdAt: "2026-08-15T10:00:00Z",
        items: [
          {
            id: "item-1",
            serviceName: "Corte de Vidro Temperado",
            unit: "M2",
            unitPrice: 300,
            quantity: 4,
            discountAmount: 0,
            totalPrice: 1200,
          },
        ],
      },
      {
        id: "quot-2",
        customerId: "cust-2",
        customerName: "Marmoraria Silva",
        totalAmount: 3500,
        status: "Approved",
        validUntil: "2026-12-31T00:00:00Z",
        notes: null,
        createdAt: "2026-08-14T10:00:00Z",
        items: [
          {
            id: "item-2",
            serviceName: "Bancada Granito",
            unit: "Unidade",
            unitPrice: 3500,
            quantity: 1,
            discountAmount: 0,
            totalPrice: 3500,
          },
        ],
      },
    ],
    totalCount: 2,
    page: 1,
    pageSize: 10,
  },
};

describe("QuotationList", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading skeleton initially", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}));

    render(<QuotationList onNewQuotation={vi.fn()} />);

    expect(screen.getByRole("status").getAttribute("aria-label")).toBe("Carregando orçamentos");
  });

  it("renders quotations table with items and status badges", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(mockQuotationsData),
    );

    render(<QuotationList onNewQuotation={vi.fn()} />);

    expect(await screen.findByText("Vidraçaria Central")).toBeTruthy();
    expect(screen.getByText("Marmoraria Silva")).toBeTruthy();
    expect(screen.getAllByText("Rascunho").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Aprovado").length).toBeGreaterThanOrEqual(1);
  });

  it("renders empty state when no quotations are returned", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        quotations: { items: [], totalCount: 0, page: 1, pageSize: 10 },
      }),
    );

    const handleNew = vi.fn();
    render(<QuotationList onNewQuotation={handleNew} />);

    expect(await screen.findByText("Nenhum orçamento encontrado")).toBeTruthy();

    const createBtn = screen.getByRole("button", { name: /Criar Orçamento/i });
    fireEvent.click(createBtn);
    expect(handleNew).toHaveBeenCalled();
  });

  it("filters by status when clicking status button", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(mockQuotationsData),
    );

    render(<QuotationList onNewQuotation={vi.fn()} />);

    expect(await screen.findByText("Vidraçaria Central")).toBeTruthy();

    // The filter buttons are at the top
    const filterButtons = screen.getAllByRole("button", { name: "Aprovado" });
    fireEvent.click(filterButtons[0]);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("status=Approved"),
      );
    });
  });

  it("triggers search with debounced input", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(mockQuotationsData),
    );

    render(<QuotationList onNewQuotation={vi.fn()} />);

    expect(await screen.findByText("Vidraçaria Central")).toBeTruthy();

    const searchInput = screen.getByPlaceholderText("Buscar orçamento...");
    fireEvent.change(searchInput, { target: { value: "Vidraçaria" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("search=Vidra%C3%A7aria"),
      );
    });
  });

  it("calls onNewQuotation when clicking Novo Orçamento button", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(mockQuotationsData),
    );

    const handleNew = vi.fn();
    render(<QuotationList onNewQuotation={handleNew} />);

    expect(await screen.findByText("Vidraçaria Central")).toBeTruthy();

    const newBtn = screen.getByRole("button", { name: /Novo Orçamento/i });
    fireEvent.click(newBtn);

    expect(handleNew).toHaveBeenCalled();
  });
});
