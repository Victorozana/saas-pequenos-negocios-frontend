import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { type ServiceItem } from "@/lib/services/backend";
import { ServiceFormModal } from "./service-form-modal";

const mockService: ServiceItem = {
  id: "srv-1",
  name: "Corte de Mármore",
  description: "Corte reto com acabamento",
  unit: "m²",
  basePrice: 180,
  isActive: true,
};

describe("ServiceFormModal", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(<ServiceFormModal isOpen={false} onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("validates zero or negative base price on submit", async () => {
    render(<ServiceFormModal isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/nome do serviço/i), { target: { value: "Instalação" } });
    fireEvent.change(screen.getByLabelText(/preço base/i), { target: { value: "0" } });

    fireEvent.click(screen.getByRole("button", { name: "Salvar Serviço" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Informe um preço base maior que zero.");
  });

  it("submits valid create payload to POST /api/services", async () => {
    const handleSaved = vi.fn();
    const handleClose = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ id: "new-srv-id" }, { status: 201 }),
    );

    render(<ServiceFormModal isOpen={true} onClose={handleClose} onSaved={handleSaved} />);

    fireEvent.change(screen.getByLabelText(/nome do serviço/i), { target: { value: "Polimento Especial" } });
    fireEvent.change(screen.getByLabelText(/preço base/i), { target: { value: "150,50" } });

    fireEvent.click(screen.getByRole("button", { name: "Salvar Serviço" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/services",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "Polimento Especial",
            description: null,
            unit: "m²",
            basePrice: 150.5,
          }),
        }),
      );
      expect(handleSaved).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("pre-fills form and submits PUT /api/services/[id] when editing", async () => {
    const handleSaved = vi.fn();
    const handleClose = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true }),
    );

    render(
      <ServiceFormModal
        isOpen={true}
        onClose={handleClose}
        onSaved={handleSaved}
        serviceToEdit={mockService}
      />,
    );

    expect(screen.getByDisplayValue("Corte de Mármore")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Salvar Serviço" }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/services/srv-1",
        expect.objectContaining({
          method: "PUT",
        }),
      );
      expect(handleSaved).toHaveBeenCalled();
    });
  });
});
