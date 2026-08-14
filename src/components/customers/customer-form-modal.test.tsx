import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { type Customer } from "@/lib/customers/backend";
import { CustomerFormModal } from "./customer-form-modal";

const mockCustomer: Customer = {
  id: "cust-1",
  name: "Padaria Central",
  phone: "11988887777",
  email: "contato@padaria.com",
  documentType: "CNPJ",
  documentValue: "12345678000199",
  street: "Rua A",
  number: "10",
  complement: null,
  neighborhood: "Bairro X",
  city: "São Paulo",
  state: "SP",
  zipCode: "01000-000",
  isActive: true,
};

describe("CustomerFormModal", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(<CustomerFormModal isOpen={false} onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("validates invalid CPF document format on submit", async () => {
    render(<CustomerFormModal isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} />);

    const nameInput = screen.getByLabelText(/nome completo/i);
    const phoneInput = screen.getByLabelText(/telefone/i);
    const docInput = screen.getByLabelText(/cpf/i);

    fireEvent.change(nameInput, { target: { value: "João Santos" } });
    fireEvent.change(phoneInput, { target: { value: "11988889999" } });
    fireEvent.change(docInput, { target: { value: "1234" } }); // Only 4 digits

    const saveBtn = screen.getByRole("button", { name: "Salvar Cliente" });
    fireEvent.click(saveBtn);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
  });

  it("submits valid create payload to POST /api/customers", async () => {
    const handleSaved = vi.fn();
    const handleClose = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ id: "new-id" }, { status: 201 }),
    );

    render(<CustomerFormModal isOpen={true} onClose={handleClose} onSaved={handleSaved} />);

    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: "Ana Maria" } });
    fireEvent.change(screen.getByLabelText(/telefone/i), { target: { value: "11977776666" } });

    fireEvent.click(screen.getByRole("button", { name: "Salvar Cliente" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/customers",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "Ana Maria",
            phone: "11977776666",
            email: null,
            documentType: null,
            documentValue: null,
            street: null,
            number: null,
            complement: null,
            neighborhood: null,
            city: null,
            state: null,
            zipCode: null,
          }),
        }),
      );
      expect(handleSaved).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("pre-fills form and submits PUT /api/customers/[id] when editing", async () => {
    const handleSaved = vi.fn();
    const handleClose = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true }),
    );

    render(
      <CustomerFormModal
        isOpen={true}
        onClose={handleClose}
        onSaved={handleSaved}
        customerToEdit={mockCustomer}
      />,
    );

    expect(screen.getByDisplayValue("Padaria Central")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Salvar Cliente" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/customers/cust-1",
        expect.objectContaining({
          method: "PUT",
        }),
      );
      expect(handleSaved).toHaveBeenCalled();
    });
  });
});
