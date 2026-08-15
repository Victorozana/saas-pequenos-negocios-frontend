# Gestão de Serviços Tasks

## Task Breakdown

### T1: Implement Service Backend Client & BFF Routes
**Requirements**: SER-001, SER-006, SER-009, SER-010, SER-011
**Files**:
- `src/lib/services/backend.ts` [NEW]
- `src/lib/services/backend.test.ts` [NEW]
- `src/app/api/services/route.ts` [NEW]
- `src/app/api/services/route.test.ts` [NEW]
- `src/app/api/services/[id]/route.ts` [NEW]
- `src/app/api/services/[id]/route.test.ts` [NEW]
**Gate**: `npm run test -- src/lib/services/backend.test.ts src/app/api/services/route.test.ts src/app/api/services/[id]/route.test.ts`
**Commit**: `feat(services): add service management bff routes`

### T2: Build Service List Component
**Requirements**: SER-001, SER-002, SER-003, SER-004
**Files**:
- `src/components/services/service-list.tsx` [NEW]
- `src/components/services/service-list.test.tsx` [NEW]
**Gate**: `npm run test -- src/components/services/service-list.test.tsx`
**Commit**: `feat(services): add service list component`

### T3: Build Service Form Modal Component
**Requirements**: SER-005, SER-006, SER-007, SER-008, SER-009
**Files**:
- `src/components/services/service-form-modal.tsx` [NEW]
- `src/components/services/service-form-modal.test.tsx` [NEW]
**Gate**: `npm run test -- src/components/services/service-form-modal.test.tsx`
**Commit**: `feat(services): add service form modal`

### T4: Integrate Service Management Page
**Requirements**: SER-001, SER-005, SER-008, SER-010
**Files**:
- `src/app/servicos/page.tsx` [NEW]
- `src/app/servicos/page.test.tsx` [NEW]
**Gate**: `npm run test -- src/app/servicos/page.test.tsx`
**Commit**: `feat(services): add servicos management page`

### T5: Validate Gestão de Serviços Feature Independently ✅
**Requirements**: SER-001..SER-011
**Files**:
- `frontend/.specs/features/gestao-servicos/validation.md` [NEW]
- `frontend/.specs/features/gestao-servicos/tasks.md` [MODIFY]
**Gate**: Build + Discrimination Sensor
**Commit**: `test(services): validate gestao servicos flow`

---

## Requirement Traceability

| Requirements | Tasks | Status |
| --- | --- | --- |
| SER-001..SER-011 | T1, T2, T3, T4, T5 | Verified |
