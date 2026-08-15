# Gestão de Serviços Design Document

## Architecture Overview

```
[ Browser / Page: /servicos ]
        │
        ├─> [ ServiceList Component ] ───> GET /api/services?searchTerm=&page=
        └─> [ ServiceForm Modal ] ──────> POST /api/services | PUT /api/services/[id]
                                                  │
                                                  ▼
                                       [ Next.js BFF Route Handlers ]
                                                  │
                                                  ▼
                                       [ Backend: GET/POST/PUT /api/v1/services ]
```

## Data Types & Models (`src/lib/services/backend.ts`)

```typescript
export type ServiceItem = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  basePrice: number;
  isActive: boolean;
};

export type PaginatedServices = {
  items: ServiceItem[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type CreateServicePayload = {
  name: string;
  description?: string | null;
  unit: string;
  basePrice: number;
};

export type UpdateServicePayload = CreateServicePayload;
```

## BFF Route Handlers

1. **`GET /api/services`**:
   - Query params: `searchTerm`, `page`, `pageSize`.
   - Reads `agendamento_session` cookie.
   - Forwards to backend `GET /api/v1/services?searchTerm=...`.
   - Returns `{ services: PaginatedServices }`.
2. **`POST /api/services`**:
   - Body: `CreateServicePayload`.
   - Forwards to backend `POST /api/v1/services`.
   - Returns 201 `{ id: string }`.
3. **`PUT /api/services/[id]`**:
   - Path param: `id`.
   - Body: `UpdateServicePayload`.
   - Forwards to backend `PUT /api/v1/services/{id}`.
   - Returns 200 `{ success: true }`.

## UI Components & Aesthetics

1. **`<ServiceList />`**:
   - Header with title, search input (Search icon), and "Novo Serviço" CTA button (Wrench icon).
   - Table displaying Service Name & Description, Unit badge (ex: `m²`, `hora`, `unidade`), Base Price formatted in BRL (`R$ 150,00`), Status badge (`Ativo`), and "Editar" action.
   - Accessible Skeleton loading state (`aria-label="Carregando lista de serviços"`).
   - Pagination controls (Anterior / Próxima).
2. **`<ServiceFormModal />`**:
   - Modal dialog with clean typography and form inputs.
   - Common unit chips/options (`m²`, `m`, `hora`, `unidade`, `diária`, `kg`, `ponto`, `outro`).
   - Base Price input with BRL currency formatting.
   - Submit state with spinner and error alert on failure.

## Error Handling

- **401/403**: Clear `agendamento_session` cookie and redirect to `/login`.
- **400**: Return field-specific or bad request error message.
- **500/503/Network Error**: Return `Não foi possível processar a requisição de serviços agora. Tente novamente.`
