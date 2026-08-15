import { describe, expect, it, vi } from "vitest";

import { AuthBackendError } from "@/lib/auth/backend";
import {
  createServiceItem,
  fetchServices,
  isPaginatedServices,
  isServiceItem,
  updateServiceItem,
} from "./backend";

describe("services backend client", () => {
  it("validates single service and paginated services schema", () => {
    const validService = {
      id: "srv-1",
      name: "Corte de Mármore",
      description: "Corte sob medida",
      unit: "m²",
      basePrice: 150.5,
      isActive: true,
    };

    expect(isServiceItem(validService)).toBe(true);
    expect(isServiceItem(null)).toBe(false);

    const validPaginated = {
      items: [validService],
      totalCount: 1,
      page: 1,
      pageSize: 20,
    };

    expect(isPaginatedServices(validPaginated)).toBe(true);
    expect(isPaginatedServices({})).toBe(false);
  });

  it("fetches services list with query params and bearer token", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "srv-1",
            name: "Corte de Mármore",
            description: null,
            unit: "m²",
            basePrice: 150.5,
            isActive: true,
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20,
      }),
    });

    const result = await fetchServices("valid-token", "Corte", 1, 20, fetcher as unknown as typeof fetch);

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:5050/api/v1/services?searchTerm=Corte&page=1&pageSize=20",
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          Authorization: "Bearer valid-token",
        },
      }),
    );
    expect(result.items[0].name).toBe("Corte de Mármore");
  });

  it("posts new service item to backend", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "new-srv-id" }),
    });

    const result = await createServiceItem(
      "valid-token",
      { name: "Instalação", unit: "hora", basePrice: 100 },
      fetcher as unknown as typeof fetch,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:5050/api/v1/services",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Instalação", unit: "hora", basePrice: 100 }),
      }),
    );
    expect(result.id).toBe("new-srv-id");
  });

  it("puts updated service item to backend", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
    });

    await updateServiceItem(
      "valid-token",
      "srv-1",
      { name: "Instalação Editada", unit: "hora", basePrice: 120 },
      fetcher as unknown as typeof fetch,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:5050/api/v1/services/srv-1",
      expect.objectContaining({
        method: "PUT",
      }),
    );
  });

  it("throws AuthBackendError on server failure", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(
      fetchServices("invalid-token", undefined, 1, 20, fetcher as unknown as typeof fetch),
    ).rejects.toThrow(AuthBackendError);
  });
});
