import { describe, expect, it, vi } from "vitest";

import { AuthBackendError } from "@/lib/auth/backend";
import {
  createCustomer,
  fetchCustomers,
  isCustomer,
  isPaginatedCustomers,
  updateCustomer,
} from "./backend";

describe("customers backend client", () => {
  it("validates single customer and paginated customers schema", () => {
    const validCustomer = {
      id: "cust-1",
      name: "Maria Santos",
      phone: "11999999999",
      email: "maria@exemplo.com",
      documentType: "CPF",
      documentValue: "12345678901",
      street: "Rua A",
      number: "100",
      complement: null,
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
      zipCode: "01000-000",
      isActive: true,
      automaticRemindersEnabled: true,
    };

    expect(isCustomer(validCustomer)).toBe(true);
    expect(isCustomer({ ...validCustomer, automaticRemindersEnabled: false })).toBe(true);
    expect(isCustomer({ ...validCustomer, automaticRemindersEnabled: "false" })).toBe(false);
    expect(isCustomer(null)).toBe(false);

    const validPaginated = {
      items: [validCustomer],
      totalCount: 1,
      page: 1,
      pageSize: 20,
    };

    expect(isPaginatedCustomers(validPaginated)).toBe(true);
    expect(isPaginatedCustomers({})).toBe(false);
  });

  it("fetches customers list with query params and authorization", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            id: "cust-1",
            name: "Maria Santos",
            phone: "11999999999",
            email: "maria@exemplo.com",
            documentType: "CPF",
            documentValue: "12345678901",
            street: null,
            number: null,
            complement: null,
            neighborhood: null,
            city: null,
            state: null,
            zipCode: null,
            isActive: true,
            automaticRemindersEnabled: true,
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20,
      }),
    });

    const result = await fetchCustomers("valid-token", "Maria", 1, 20, fetcher as unknown as typeof fetch);

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:5050/api/v1/customers?search=Maria&page=1&pageSize=20",
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          Authorization: "Bearer valid-token",
        },
      }),
    );
    expect(result.items[0].name).toBe("Maria Santos");
  });

  it("posts new customer to backend", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "new-cust-id" }),
    });

    const result = await createCustomer(
      "valid-token",
      { name: "João", phone: "11988888888" },
      fetcher as unknown as typeof fetch,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:5050/api/v1/customers",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "João", phone: "11988888888" }),
      }),
    );
    expect(result.id).toBe("new-cust-id");
  });

  it("puts updated customer to backend", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
    });

    await updateCustomer(
      "valid-token",
      "cust-1",
      { customerId: "cust-1", name: "João Editado", phone: "11988888888", automaticRemindersEnabled: false, preserveDocument: true },
      fetcher as unknown as typeof fetch,
    );

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:5050/api/v1/customers/cust-1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ customerId: "cust-1", name: "João Editado", phone: "11988888888", automaticRemindersEnabled: false, preserveDocument: true }),
      }),
    );
  });

  it("throws AuthBackendError when server fails", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(
      fetchCustomers("invalid-token", undefined, 1, 20, fetcher as unknown as typeof fetch),
    ).rejects.toThrow(AuthBackendError);
  });
});
