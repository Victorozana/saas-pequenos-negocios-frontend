import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { type ServiceItem } from "@/lib/services/backend";
import { ServiceList } from "./service-list";

const mockService: ServiceItem = {
  id: "srv-1",
  name: "Corte de Mármore",
  description: "Corte reto com acabamento",
  unit: "m²",
  basePrice: 180,
  isActive: true,
};

describe("ServiceList", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading skeleton initially", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}));

    render(<ServiceList onEditService={vi.fn()} onNewService={vi.fn()} />);

    expect(screen.getByRole("status").getAttribute("aria-label")).toBe("Carregando lista de serviços");
  });

  it("renders services list when fetch succeeds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        services: {
          items: [mockService],
          totalCount: 1,
          page: 1,
          pageSize: 10,
        },
      }),
    );

    render(<ServiceList onEditService={vi.fn()} onNewService={vi.fn()} />);

    expect(await screen.findByText("Corte de Mármore")).toBeTruthy();
    expect(screen.getByText("Corte reto com acabamento")).toBeTruthy();
    expect(screen.getByText("m²")).toBeTruthy();
    expect(screen.getByText(/180,00/)).toBeTruthy();
  });

  it("renders empty state when no services are found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        services: {
          items: [],
          totalCount: 0,
          page: 1,
          pageSize: 10,
        },
      }),
    );

    render(<ServiceList onEditService={vi.fn()} onNewService={vi.fn()} />);

    expect(await screen.findByText("Nenhum serviço encontrado")).toBeTruthy();
  });

  it("calls onEditService when clicking Edit button", async () => {
    const handleEdit = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        services: {
          items: [mockService],
          totalCount: 1,
          page: 1,
          pageSize: 10,
        },
      }),
    );

    render(<ServiceList onEditService={handleEdit} onNewService={vi.fn()} />);

    expect(await screen.findByText("Corte de Mármore")).toBeTruthy();

    const editBtn = screen.getByRole("button", { name: /editar/i });
    fireEvent.click(editBtn);

    expect(handleEdit).toHaveBeenCalledWith(mockService);
  });

  it("calls onNewService when clicking Cadastrar Primeiro Serviço CTA", async () => {
    const handleNew = vi.fn();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        services: {
          items: [],
          totalCount: 0,
          page: 1,
          pageSize: 10,
        },
      }),
    );

    render(<ServiceList onEditService={vi.fn()} onNewService={handleNew} />);

    expect(await screen.findByText("Nenhum serviço encontrado")).toBeTruthy();

    const newBtn = screen.getByRole("button", { name: /cadastrar primeiro serviço/i });
    fireEvent.click(newBtn);

    expect(handleNew).toHaveBeenCalled();
  });
});
