# Agenda de hoje Tasks

## Execution Protocol

Implement these tasks with the `tlc-spec-driven` skill and its Execute flow.

**Design**: `.specs/features/agenda-de-hoje/design.md`
**Status**: In Progress

## Test Coverage Matrix

> Generated from `AGENTS.md`, `README.md`, `package.json`, `vitest.config.mts`, and co-located Vitest samples. All feature behavior is covered by unit/component tests.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Backend adapter / BFF route | unit | Success, empty, backend/network failure, expired session, token exclusion | `src/app/api/**/*.test.ts` | `npm run test` |
| Dashboard agenda component | unit | Loading, populated, empty, error, expired-session redirect | `src/components/**/*.test.tsx` | `npm run test` |
| Server dashboard page | unit | Authentication redirect and agenda composition | `src/app/dashboard/*.test.tsx` | `npm run test` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After each task | `npm run test -- --runInBand` |
| Build | Final verification | `npm run test && npm run typecheck && npm run lint && npm run build` |

## Execution Plan

### Phase 1: Secure data boundary

```
T1 → T2
```

### Phase 2: Operational dashboard

```
T2 → T3
```

## Task Breakdown

### T1: Add appointment backend adapter and BFF

**Status**: Completed
**What**: Query and validate today's assigned appointments server-side; map safe failures and expire invalid sessions.
**Where**: `src/lib/appointments/backend.ts`, `src/app/api/dashboard/today/route.ts`
**Depends on**: None
**Requirement**: AGENDA-01, AGENDA-05, AGENDA-06, AGENDA-07
**Tests**: unit
**Gate**: Quick
**Commit**: `feat(agenda): add secure today agenda bff`

### T2: Create agenda block

**Status**: Completed
**What**: Render loading, populated, empty, error, and expired-session states from the BFF.
**Where**: `src/components/dashboard/agenda-today.tsx`
**Depends on**: T1
**Requirement**: AGENDA-02, AGENDA-03, AGENDA-04, AGENDA-05, AGENDA-06
**Tests**: unit
**Gate**: Quick
**Commit**: `feat(agenda): add today agenda states`

### T3: Compose dashboard as an operational landing page

**What**: Replace placeholder dashboard content with person-focused identification and the agenda block.
**Where**: `src/app/dashboard/page.tsx`
**Depends on**: T2
**Requirement**: AGENDA-01, AGENDA-03
**Tests**: unit
**Gate**: Quick
**Commit**: `feat(dashboard): make today agenda the landing view`

## Phase Execution Map

```
Phase 1: T1 → T2
Phase 2: T2 → T3
```

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | One secure data boundary | ✅ Granular |
| T2 | One UI component | ✅ Granular |
| T3 | One page composition | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- |
| T1 | Adapter / BFF route | unit | unit | ✅ OK |
| T2 | Dashboard component | unit | unit | ✅ OK |
| T3 | Dashboard page | unit | unit | ✅ OK |
