# Tenant Onboarding Tasks

## Gate Check Commands

- **Quick**: `npm run test -- --runInBand`
- **Build**: `npm run test && npm run typecheck && npm run lint && npm run build`

## Test Coverage Matrix

| Layer | Tasks | Tests | Gate |
| --- | --- | --- | --- |
| Contract helpers | T1 | `src/lib/onboarding/tenant-onboarding.test.ts` | Quick |
| BFF routes | T2, T8 | `src/app/api/tenants/register/route.test.ts`, `src/app/api/auth/email-verifications/route.test.ts` | Quick |
| Onboarding UI | T3, T4, T7, T9 | `src/components/onboarding/tenant-onboarding.test.tsx` | Quick |
| Public navigation | T5, T10 | `src/app/login/page.test.tsx` | Quick |
| Release validation | T6 | all feature tests | Build |

## Execution Plan

T1 → T2 → T4 → T6 → T7 → T9

T1 → T3 → T4

T3 → T5 → T6 → T8

T6 → T10

## Task Breakdown

## Phase 1: Contract and BFF

### T1: Add tenant onboarding API contract helpers ✅

**Depends on**: none
**Tests**: `src/lib/onboarding/tenant-onboarding.test.ts`
**Gate**: Quick
- **Done when**: registration and verification payloads are validated, password rules are enforced, and safe messages distinguish conflict, validation and unavailable service.

### T2: Add tenant registration and verification BFF routes ✅

**Depends on**: T1
**Tests**: `src/app/api/tenants/register/route.test.ts`, `src/app/api/auth/email-verifications/route.test.ts`
**Gate**: Quick
- **Done when**: routes forward valid payloads, preserve idempotency, pass only the in-memory verification token response, and return safe failures.

## Phase 2: Onboarding UI

### T3: Build the accessible multi-step registration form ✅

**Depends on**: T1
**Tests**: `src/components/onboarding/tenant-onboarding.test.tsx`
**Gate**: Quick
- **Done when**: all required request fields can be entered across company, fiscal/address and administrator steps, and client validation blocks invalid passwords.

### T4: Connect registration and confirmation states ✅

**Depends on**: T2, T3
**Tests**: `src/components/onboarding/tenant-onboarding.test.tsx`
**Gate**: Quick
- **Done when**: loading, validation, Problem Details, conflict, unavailable, missing-token, confirmation failure and successful redirect behaviors match the specification.

### T5: Expose the public route and login entry point ✅

**Depends on**: T3
**Tests**: `src/app/login/page.test.tsx`
**Gate**: Quick
- **Done when**: `/cadastro` renders the onboarding flow and `/login` has a useful link to it without unavailable-feature links.

## Phase 3: Release validation

### T6: Run full checks and visual validation ✅

**Depends on**: T1, T2, T3, T4, T5
**Tests**: all feature tests
**Gate**: Build
- **Done when**: test, typecheck, lint, build and desktop/mobile visual checks pass. Verified on 2026-08-13: 59/59 tests passed; typecheck, lint and production build passed; `/login` and `/cadastro` were checked at desktop and 390 px mobile widths without horizontal overflow.

## Phase 4: Validation remediation

### T7: Cover registration loading and recoverable errors ✅

**Depends on**: T6
**Tests**: `src/components/onboarding/tenant-onboarding.test.tsx`
**Gate**: Quick
- **Done when**: component tests assert disabled loading feedback, safe 400/422/409/5xx registration messages, and retained non-sensitive values after a recoverable failure. Verified: 8/8 component tests pass.

### T8: Cover malformed successful registration responses ✅

**Depends on**: T6
**Tests**: `src/app/api/tenants/register/route.test.ts`
**Gate**: Quick
- **Done when**: the BFF test proves a 201 response with an invalid body returns the specified safe 502 message and does not return a token. Verified: 4/4 route tests pass.

### T9: Cover confirmation-token containment and failure recovery ✅

**Depends on**: T7
**Tests**: `src/components/onboarding/tenant-onboarding.test.tsx`
**Gate**: Quick
- **Done when**: component tests prove the verification token is absent from browser URL, persistent storage and logs, and a failed confirmation displays a safe message without leaving the confirmation step. Verified: 10/10 component tests pass.

### T10: Cover exclusion of unavailable public links

**Depends on**: T6
**Tests**: `src/app/login/page.test.tsx`
**Gate**: Quick
- **Done when**: the login page test proves no link targets an unavailable module route.
