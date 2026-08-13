# Consulta CNPJ no onboarding Tasks

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location | Command |
| --- | --- | --- | --- | --- |
| Backend handler/endpoint | integration | 200, 400, 404, 422, 503; provider not called for invalid input; non-food CNAE accepted | `tests/Agendamento.IntegrationTests/Tenants` | focused `dotnet test` |
| Provider gateway | unit/integration | exact URL, mapping, 404, timeout, non-success and malformed payload | backend company-registry tests | focused `dotnet test` |
| OpenAPI/client | architecture/type | response schema and every documented status | backend architecture tests + frontend typecheck | focused gate |
| Frontend adapter/BFF | unit | exact backend URL, payload validation and safe status mapping | `src/lib/onboarding`, `src/app/api/company-registry` | focused Vitest |
| Onboarding UI | component | lookup, exact field population, edit/preserve, loading and errors | `src/components/onboarding` | focused Vitest |
| Proxy | unit | every protected root/nested path and cookie branch | `src/proxy.test.ts` | focused Vitest |

## Gate Check Commands

| Gate | Command |
| --- | --- |
| Backend focused | `dotnet test` with the company-registry filter |
| Frontend focused | `npm run test -- <feature test files>` |
| Build | backend relevant suites, then `npm run test && npm run typecheck && npm run lint && npm run build` |

## Execution Plan

```text
T1 → T2 → T3 → T4 → T5
T3 → T6
T5 → T7
T6 → T7
```

## Task Breakdown

### T1: Correct company lookup semantics ✅

**Depends on**: none
**Requirements**: CNPJ-001, CNPJ-003, CNPJ-004, CNPJ-005, CNPJ-006
**Tests**: integration
**Gate**: Backend focused
**Commit**: `fix(cnpj): align company lookup eligibility`
- **Done when**: tests prove invalid input does not call the gateway, any active business CNAE is accepted, and failure categories map safely.

### T2: Implement the configurable BrasilAPI gateway ✅

**Depends on**: T1
**Requirements**: CNPJ-002, CNPJ-004, CNPJ-006, CNPJ-011
**Tests**: unit/integration
**Gate**: Backend focused
**Commit**: `feat(cnpj): integrate configurable company registry`
- **Done when**: exact provider URL, complete mapping, timeout, 404, non-success and malformed payload are tested and DI resolves the endpoint.

### T3: Publish the typed company registry contract

**Depends on**: T2
**Requirements**: CNPJ-001..CNPJ-006
**Tests**: architecture/type
**Gate**: Backend focused + frontend typecheck
**Commit**: `fix(openapi): type company registry responses`
- **Done when**: backend OpenAPI and generated TypeScript expose the success body and safe error statuses.

### T4: Add the safe company lookup BFF

**Depends on**: T3
**Requirements**: CNPJ-002, CNPJ-004, CNPJ-005, CNPJ-006, CNPJ-011
**Tests**: unit
**Gate**: Frontend focused
**Commit**: `feat(onboarding): add company registry bff`
- **Done when**: the browser-facing route validates payloads, maps statuses and leaks no upstream detail.

### T5: Integrate lookup into the company step

**Depends on**: T4
**Requirements**: CNPJ-007..CNPJ-011
**Tests**: component
**Gate**: Frontend focused
**Commit**: `feat(onboarding): prefill company data by cnpj`
- **Done when**: lookup loading, exact population, editing, preservation and failure states match the spec.

### T6: Extend the authenticated route boundary

**Depends on**: T3
**Requirements**: CNPJ-012, CNPJ-013
**Tests**: unit
**Gate**: Frontend focused
**Commit**: `fix(auth): protect all operational routes`
- **Done when**: every current/future operational root and nested path has the optimistic session boundary.

### T7: Validate company registry onboarding independently

**Depends on**: T5, T6
**Requirements**: CNPJ-001..CNPJ-013
**Tests**: full + discrimination sensor
**Gate**: Build
**Commit**: `test(onboarding): validate company registry flow`
- **Done when**: a fresh verifier reports PASS, mutations are killed and `validate_state.py company-registry-onboarding` exits zero.

## Requirement Traceability

| Requirements | Tasks | Status |
| --- | --- | --- |
| CNPJ-001..CNPJ-006 | T1, T2, T3, T4, T7 | Planned |
| CNPJ-007..CNPJ-011 | T4, T5, T7 | Planned |
| CNPJ-012..CNPJ-013 | T6, T7 | Planned |
