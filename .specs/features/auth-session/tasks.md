# Autenticação e sessão Tasks

## Test Coverage Matrix

> Generated from `AGENTS.md`, `README.md`, `package.json`, `vitest.config.mts`, the feature spec, and co-located Vitest tests.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Backend authentication adapter | unit | Every documented status, network failure, malformed success, Bearer profile, and configuration branch | `src/lib/auth/*.test.ts` | `npm run test` |
| Auth BFF routes | unit | Happy path, missing/rejected session, cookie security, safe errors, and token exclusion | `src/app/api/auth/**/*.test.ts` | `npm run test` |
| Protected pages and components | unit | Login/logout redirects, authoritative protection, permission visibility, loading and failure states | `src/app/**/*.test.tsx`, `src/components/**/*.test.tsx` | `npm run test` |
| Proxy and configuration | unit | Anonymous redirect, allowed protocols, production requirements and Development fallback | `src/proxy.test.ts`, `src/lib/api/client.test.ts` | `npm run test` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After a focused task | `npm run test` |
| Build | Phase completion | `npm run test && npm run typecheck && npm run lint && npm run build` |

## Execution Plan

### Phase 1: Contract and session boundary

```text
T1 → T2 → T3
```

### Phase 2: Protected application UI

```text
T3 → T4 → T5
```

### Phase 3: Independent reconciliation

```text
T5 → T6
```

## Task Breakdown

### T1: Refresh the authentication contract ✅

**Depends on**: none
**Tests**: unit
**Gate**: Quick
- **Done when**: the generated contract contains session requests/responses and the complete current-user profile.

### T2: Implement the authenticated backend adapter ✅

**Depends on**: T1
**Tests**: unit
**Gate**: Quick
- **Done when**: login errors, network failure, malformed success, Bearer profile loading, permissions and API configuration match AUTH-002, AUTH-003 and AUTH-007.

### T3: Protect the session behind BFF routes ✅

**Depends on**: T2
**Tests**: unit
**Gate**: Quick
- **Done when**: login/session/logout routes keep the token out of JSON, apply the secure cookie contract and expire rejected sessions.

### T4: Enforce optimistic and authoritative route protection ✅

**Depends on**: T3
**Tests**: unit
**Gate**: Quick
- **Done when**: anonymous requests and backend-rejected sessions redirect to `/login` without rendering protected content.

### T5: Deliver the permission-aware authenticated UI ✅

**Depends on**: T4
**Tests**: unit
**Gate**: Build
- **Done when**: login, logout, dashboard identity and permission-filtered navigation match the specification and the Build gate passes.

### T6: Reconcile current authentication evidence

**Depends on**: T5
**Tests**: unit
**Gate**: Build
- **Done when**: current tests prove every AUTH criterion, a fresh independent verifier kills critical mutations, `validation.md` is PASS, and `validate_state.py auth-session` exits zero.

## Requirement Traceability

| Requirement | Tasks | Status |
| --- | --- | --- |
| AUTH-001 | T1, T2, T3, T5 | Implemented |
| AUTH-002 | T2, T3, T5, T6 | Implemented; awaiting fresh verification |
| AUTH-003 | T1, T2, T3 | Implemented |
| AUTH-004 | T4, T6 | Implemented; awaiting fresh verification |
| AUTH-005 | T3, T5, T6 | Implemented; awaiting fresh verification |
| AUTH-006 | T2, T5 | Implemented |
| AUTH-007 | T2, T3, T6 | Implemented; awaiting fresh verification |
