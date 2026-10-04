# Gestão de Orçamentos Design Document

## Architecture Overview

```
[ Browser / Page: /orcamentos ]
        │
        ├─> [ QuotationList Component ] ───> GET /api/quotations?search=&status=&page=
        ├─> [ QuotationModal ] ────────────> POST /api/quotations
        ├─> [ Quotation Status Update ] ───> PATCH /api/quotations/[id]/status
        └─> [ PDF Download Action ] ───────> GET /api/quotations/[id]/export
                                                   │
                                                   ▼
                                        [ Next.js BFF Route Handlers ]
                                                   │
                                                   ▼
                                        [ Backend: /api/v1/quotations ]
```

## Data Types & Models (`src/lib/quotations/backend.ts`)

```typescript
export type QuotationStatus = 'Draft' | 'Sent' | 'Approved' | 'Rejected';

export type QuotationItem = {
  id: string;
  serviceName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  totalPrice: number;
};

export type Quotation = {
  id: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  status: QuotationStatus;
  validUntil: string;
  notes: string | null;
  items: QuotationItem[];
  createdAt: string;
};

export type PaginatedQuotations = {
  items: Quotation[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type CreateQuotationItemPayload = {
  serviceName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
};

export type CreateQuotationPayload = {
  customerId: string;
  validUntil: string;
  notes?: string;
  items: CreateQuotationItemPayload[];
};
```

## BFF Route Handlers

1. **`GET /api/quotations`**:
   - Query params: `search`, `status`, `page`, `pageSize`.
   - Reads `agendamento_session` cookie.
   - Forwards to backend `GET /api/v1/quotations?search=...`.
   - Returns `{ quotations: PaginatedQuotations }`.
2. **`POST /api/quotations`**:
   - Body: `CreateQuotationPayload`.
   - Forwards to backend `POST /api/v1/quotations`.
   - Returns 201 `{ id: string }`.
3. **`PATCH /api/quotations/[id]/status`**:
   - Path param: `id`.
   - Body: `{ status: QuotationStatus }`.
   - Forwards to backend `PATCH /api/v1/quotations/{id}/status`.
   - Returns 200 `{ success: true }`.
4. **`GET /api/quotations/[id]/export`**:
   - Path param: `id`.
   - Forwards to backend `GET /api/v1/quotations/{id}/export/pdf`.
   - Retrieves the binary blob/buffer and proxies it back with `Content-Type: application/pdf` and `Content-Disposition: attachment`.

## UI Components & Aesthetics

1. **`<QuotationList />`**:
   - Header with title, search input, status filter Tabs/Dropdown, and "Novo Orçamento" CTA button.
   - Table displaying Customer Name, Date, Total Amount, Status (Color-coded Badges: Draft=Gray, Sent=Blue, Approved=Green, Rejected=Red), and Action Dropdown (Update Status, Download PDF).
   - Accessible Skeleton loading state.
   - Pagination controls.
2. **`<QuotationModal />` / `<QuotationForm />`**:
   - Modal dialog for creation.
   - Field: Customer selection (Searchable select or simple native select for MVP).
   - Field: Valid Until Date.
   - Section: Service Items
     - Dynamic array fields using `react-hook-form` `useFieldArray`.
     - Each row has: `ServiceName`, `Quantity`, `Unit` (Metros, Unidades, etc.), `UnitPrice`, `Discount`.
     - Real-time Subtotal per item and Grand Total calculated for UI feedback.
   - Submit state with spinner and error alert.

## Error Handling

- **401/403**: Clear `agendamento_session` cookie and redirect to `/login`.
- **400**: Return field-specific or bad request error message.
- **500/503/Network Error**: Return `Não foi possível processar o orçamento. Tente novamente.` sem expor stack traces.
