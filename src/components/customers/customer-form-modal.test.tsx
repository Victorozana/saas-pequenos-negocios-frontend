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
  automaticRemindersEnabled: true,
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
            automaticRemindersEnabled: true,
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

  it("preserves a masked CPF when editing other fields without submitting the mask", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    render(<CustomerFormModal isOpen onClose={vi.fn()} onSaved={vi.fn()}
      customerToEdit={{ ...mockCustomer, documentType: "CPF", documentValue: "***.***.***-09" }} />);
    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: "Nome editado" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar Cliente" }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body.name).toBe("Nome editado");
    expect(body.documentType).toBeNull();
    expect(body.documentValue).toBeNull();
    expect(body.preserveDocument).toBe(true);
  });

  it("AC-207 disables automatic reminders while preserving a masked CPF and reads the saved preference on reopening", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    const customer = { ...mockCustomer, documentType: "CPF", documentValue: "***.***.***-09" };
    const { unmount } = render(<CustomerFormModal isOpen onClose={vi.fn()} onSaved={vi.fn()} customerToEdit={customer} />);
    const checkbox = screen.getByRole("checkbox", { name: "Receber lembretes automáticos" }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "Salvar Cliente" }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body.automaticRemindersEnabled).toBe(false);
    expect(body.preserveDocument).toBe(true);
    expect(body.documentValue).toBeNull();
    unmount();
    render(<CustomerFormModal isOpen onClose={vi.fn()} onSaved={vi.fn()} customerToEdit={{ ...customer, automaticRemindersEnabled: body.automaticRemindersEnabled }} />);
    expect((screen.getByRole("checkbox", { name: "Receber lembretes automáticos" }) as HTMLInputElement).checked).toBe(false);
  });

  it("AC-207 keeps reminders disabled during unrelated edits and permits enabling them again", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    render(<CustomerFormModal isOpen onClose={vi.fn()} onSaved={vi.fn()} customerToEdit={{ ...mockCustomer, automaticRemindersEnabled: false }} />);
    fireEvent.change(screen.getByLabelText(/nome completo/i), { target: { value: "Nome editado" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar Cliente" }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body)).automaticRemindersEnabled).toBe(false);
    fireEvent.click(screen.getByRole("checkbox", { name: "Receber lembretes automáticos" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar Cliente" }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));
    expect(JSON.parse(String(fetchSpy.mock.calls[1][1]?.body)).automaticRemindersEnabled).toBe(true);
  });

  it("AC-207 allows replacing a masked CPF together with the reminder preference", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    render(<CustomerFormModal isOpen onClose={vi.fn()} onSaved={vi.fn()}
      customerToEdit={{ ...mockCustomer, documentType: "CPF", documentValue: "***.***.***-09" }} />);
    fireEvent.change(screen.getByLabelText(/cpf \(11/i), { target: { value: "529.982.247-25" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Receber lembretes automáticos" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar Cliente" }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body.automaticRemindersEnabled).toBe(false);
    expect(body.documentType).toBe("CPF");
    expect(body.documentValue).toBe("52998224725");
    expect(body.preserveDocument).toBeUndefined();
  });
});
