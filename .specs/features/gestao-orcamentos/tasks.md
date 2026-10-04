# Tasks: Gestão de Orçamentos

## Phase 1: Core Specifications & Design
- [x] Create `spec.md` with requirements and User Stories.
- [x] Create `design.md` with architecture, BFF routes, and UI details.
- [x] Create `tasks.md` to track progress.

## Phase 2: Backend Integration & BFF
- [x] Implement `src/lib/quotations/backend.ts` (Types and API helpers).
- [x] Implement BFF `GET /api/quotations` route handler.
- [x] Implement BFF `POST /api/quotations` route handler.
- [x] Implement BFF `PATCH /api/quotations/[id]/status` route handler.
- [x] Implement BFF `GET /api/quotations/[id]/export` route handler (PDF Blob).

## Phase 3: UI Components
- [x] Add `/orcamentos` to application Navigation/Sidebar (`permissions.ts`).
- [x] Create `app/orcamentos/page.tsx` integrated with AppShell and session auth.
- [x] Implement `<QuotationList />` (Table, Badges, Search, Status Filter, Pagination).
- [x] Implement `<QuotationModal />` (Customer Select, Items, Total Preview, Validation).
- [x] Integrate actions: Update Status (Dropdown Menu) and Download PDF.

## Phase 4: Validation & Quality
- [x] Write unit tests for frontend calculator (`(Qty * Price) - Discount`).
- [x] Add Vitest tests for `<QuotationModal />` interactions.
- [x] Ensure layout is responsive and matches Design Guidelines (Clean, Minimal, Accessible).
- [x] Verify Safe Fallbacks (API Error handling displays correct Toast/Alert).
- [x] Pass all gates (Typecheck, Vitest, ESLint, Next.js Build).
