# Gestão de Clientes Design Document

## Architecture Overview

```
[ Browser / Page: /clientes ]
        │
        ├─> [ CustomerList Component ] ───> GET /api/customers?search=&page=
        └─> [ CustomerForm Modal ] ───────> POST /api/customers | PUT /api/customers/[id]
                                                  │
                                                  ▼
                                       [ Next.js BFF Route Handlers ]
                                                  │
                                                  ▼
                                       [ Backend: GET/POST/PUT /api/v1/customers ]
```

## Data Types & Models (`src/lib/customers/backend.ts`)

```typescript
export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  documentType: string | null;
  documentValue: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  isActive: boolean;
};

export type PaginatedCustomers = {
  items: Customer[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type CreateCustomerPayload = {
  name: string;
  phone: string;
  email?: string | null;
  documentType?: string | null;
  documentValue?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

export type UpdateCustomerPayload = CreateCustomerPayload & {
  customerId: string;
};
```

## BFF Route Handlers

1. **`GET /api/customers`**:
   - Query params: `search`, `page`, `pageSize`.
   - Reads `agendamento_session` cookie.
   - Forwards to backend `GET /api/v1/customers?search=...`.
   - Returns `{ customers: PaginatedCustomers }`.
2. **`POST /api/customers`**:
   - Body: `CreateCustomerPayload`.
   - Forwards to backend `POST /api/v1/customers`.
   - Returns 201 `{ id: string }`.
3. **`PUT /api/customers/[id]`**:
   - Path param: `id`.
   - Body: `UpdateCustomerPayload`.
   - Forwards to backend `PUT /api/v1/customers/{id}`.
   - Returns 200 `{ success: true }`.

## UI Components & Aesthetics

1. **`<CustomerList />`**:
   - Header with title, search input (with Search icon), and "Novo Cliente" CTA button (UserPlus icon).
   - Table displaying Name, Document (CPF/CNPJ badge), Phone (WhatsApp link), Address summary, and "Editar" action.
   - Accessible Skeleton loading state.
   - Pagination controls (Anterior / Próxima).
2. **`<CustomerModal />` / `<CustomerForm />`**:
   - Modal dialog with clean typography and form controls.
   - Toggle buttons for "Pessoa Física (CPF)" vs "Pessoa Jurídica (CNPJ)".
   - Dynamic document mask / validation.
   - Phone mask / validation.
   - Address fields (CEP, Rua, Número, Bairro, Cidade, UF).
   - Submit state with spinner and error alert on failure.

## Error Handling

- **401/403**: Clear `agendamento_session` cookie and redirect to `/login`.
- **400**: Return field-specific or bad request error message.
- **500/503/Network Error**: Return `Não foi possível processar a requisição de clientes agora. Tente novamente.`
