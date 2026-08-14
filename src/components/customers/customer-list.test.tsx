import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { type Customer } from "@/lib/customers/backend";
import { CustomerList } from "./customer-list";

const mockCustomer: Customer = {
  id: "cust-1",
  name: "Padaria Central",
  phone: "11988887777",
  email: "contato@padaria.com",
  documentType: "CNPJ",
  documentValue: "12345678000199",
  street: "Rua do Comércio",
  number: "50",
  complement: null,
  neighborhood: "Centro",
  city: "Campinas",
  state: "SP",
  zipCode: "13010-000",
  isActive: true,
};

describe("CustomerList", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading skeleton initially", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}));

    render(<CustomerList onEditCustomer={vi.fn()} onNewCustomer={vi.fn()} />);

    expect(screen.getByRole("status").getAttribute("aria-label")).toBe("Carregando lista de clientes");
  });

  it("renders customers list when fetch succeeds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        customers: {
          items: [mockCustomer],
          totalCount: 1,
          page: 1,
          pageSize: 10,
        },
      }),
    );

    render(<CustomerList onEditCustomer={vi.fn()} onNewCustomer={vi.fn()} />);

    expect(await screen.findByText("Padaria Central")).toBeTruthy();
    expect(screen.getByText("contato@padaria.com")).toBeTruthy();
    expect(screen.getByText("Campinas / SP")).toBeTruthy();
  });

  it("renders empty state when no customers are found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        customers: {
          items: [],
          totalCount: 0,
          page: 1,
          pageSize: 10,
        },
      }),
    );

    render(<CustomerList onEditCustomer={vi.fn()} onNewCustomer={vi.fn()} />);

    expect(await screen.findByText("Nenhum cliente encontrado")).toBeTruthy();
  });

  it("calls onEditCustomer when clicking Edit button", async () => {
    const handleEdit = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        customers: {
          items: [mockCustomer],
          totalCount: 1,
          page: 1,
          pageSize: 10,
        },
      }),
    );

    render(<CustomerList onEditCustomer={handleEdit} onNewCustomer={vi.fn()} />);

    expect(await screen.findByText("Padaria Central")).toBeTruthy();

    const editBtn = screen.getByRole("button", { name: /editar/i });
    fireEvent.click(editBtn);

    expect(handleEdit).toHaveBeenCalledWith(mockCustomer);
  });

  it("calls onNewCustomer when clicking Cadastrar Primeiro Cliente CTA in empty state", async () => {
    const handleNew = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        customers: {
          items: [],
          totalCount: 0,
          page: 1,
          pageSize: 10,
        },
      }),
    );

    render(<CustomerList onEditCustomer={vi.fn()} onNewCustomer={handleNew} />);

    expect(await screen.findByText("Nenhum cliente encontrado")).toBeTruthy();

    const newBtn = screen.getByRole("button", { name: /cadastrar primeiro cliente/i });
    fireEvent.click(newBtn);

    expect(handleNew).toHaveBeenCalled();
  });
});
