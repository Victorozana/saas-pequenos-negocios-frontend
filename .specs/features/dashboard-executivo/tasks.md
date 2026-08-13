# Dashboard Executivo e Métricas Tasks

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location | Command |
| --- | --- | --- | --- | --- |
| BFF summary route | unit | exact backend URL, payload validation, status mapping | `src/app/api/dashboard/summary/route.test.ts` | focused Vitest |
| BFF report route | unit | exact backend URL, header forwarding, status mapping | `src/app/api/dashboard/report/route.test.ts` | focused Vitest |
| UI Component | component | loading, KPI rendering, formatting, error state, CSV download action | `src/components/dashboard/dashboard-metrics.test.tsx` | focused Vitest |
| Dashboard Page | component | integration of metrics and agenda on `/dashboard` | `src/app/dashboard/page.test.tsx` | focused Vitest |

## Gate Check Commands

| Gate | Command |
| --- | --- |
| Frontend focused | `npm run test -- <feature test files>` |
| Build | `npm run test && npm run typecheck && npm run lint && npm run build` |

## Execution Plan

```text
T1 → T2 → T3 → T4 → T5
```

## Task Breakdown

### T1: Implement dashboard summary BFF route
**Depends on**: none
**Requirements**: DASH-001, DASH-005, DASH-006
**Tests**: unit
**Gate**: Frontend focused
**Commit**: `feat(dashboard): add dashboard summary bff route`
- **Done when**: `GET /api/dashboard/summary` validates backend payload, maps status codes, and returns safe messages.

### T2: Implement dashboard report export BFF route
**Depends on**: T1
**Requirements**: DASH-004, DASH-005, DASH-006
**Tests**: unit
**Gate**: Frontend focused
**Commit**: `feat(dashboard): add performance report export bff route`
- **Done when**: `GET /api/dashboard/report` streams CSV output with disposition header and safe status mapping.

### T3: Build DashboardMetrics UI component
**Depends on**: T2
**Requirements**: DASH-001, DASH-002, DASH-003, DASH-004, DASH-005
**Tests**: component
**Gate**: Frontend focused
**Commit**: `feat(dashboard): add executive metrics cards component`
- **Done when**: KPI cards, currency formatting, loading state, error display, and CSV export action are tested and working.

### T4: Integrate DashboardMetrics into dashboard page
**Depends on**: T3
**Requirements**: DASH-001, DASH-004
**Tests**: component
**Gate**: Frontend focused
**Commit**: `feat(dashboard): integrate metrics into dashboard page`
- **Done when**: `/dashboard` displays greeting, executive metrics cards, CSV export button, and today's schedule.

### T5: Validate dashboard executive feature independently ✅
**Depends on**: T4
**Requirements**: DASH-001..DASH-006
**Tests**: full + discrimination sensor
**Gate**: Build
**Commit**: `test(dashboard): validate executive metrics flow`
- **Done when**: a fresh verifier reports PASS, mutations are killed and `validate_state.py dashboard-executivo` exits zero.

## Requirement Traceability

| Requirements | Tasks | Status |
| --- | --- | --- |
| DASH-001..DASH-006 | T1, T2, T3, T4, T5 | Verified |
