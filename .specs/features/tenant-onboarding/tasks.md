# Tenant Onboarding Tasks

## Gate Check Commands

- **Quick**: `npm run test -- --runInBand`
- **Build**: `npm run test && npm run typecheck && npm run lint && npm run build`

## Phase 1: Contract and BFF

### T1: Add tenant onboarding API contract helpers ✅

- **Depends on**: none
- **Tests**: `src/lib/onboarding/tenant-onboarding.test.ts`
- **Gate**: Quick
- **Done when**: registration and verification payloads are validated, password rules are enforced, and safe messages distinguish conflict, validation and unavailable service.

### T2: Add tenant registration and verification BFF routes ✅

- **Depends on**: T1
- **Tests**: `src/app/api/tenants/register/route.test.ts`, `src/app/api/auth/email-verifications/route.test.ts`
- **Gate**: Quick
- **Done when**: routes forward valid payloads, preserve idempotency, pass only the in-memory verification token response, and return safe failures.

## Phase 2: Onboarding UI

### T3: Build the accessible multi-step registration form ✅

- **Depends on**: T1
- **Tests**: `src/components/onboarding/tenant-onboarding.test.tsx`
- **Gate**: Quick
- **Done when**: all required request fields can be entered across company, fiscal/address and administrator steps, and client validation blocks invalid passwords.

### T4: Connect registration and confirmation states ✅

- **Depends on**: T2, T3
- **Tests**: `src/components/onboarding/tenant-onboarding.test.tsx`
- **Gate**: Quick
- **Done when**: loading, validation, Problem Details, conflict, unavailable, missing-token, confirmation failure and successful redirect behaviors match the specification.

### T5: Expose the public route and login entry point ✅

- **Depends on**: T3
- **Tests**: `src/app/login/page.test.tsx`
- **Gate**: Quick
- **Done when**: `/cadastro` renders the onboarding flow and `/login` has a useful link to it without unavailable-feature links.

## Phase 3: Release validation

### T6: Run full checks and visual validation ⚠️

- **Depends on**: T1, T2, T3, T4, T5
- **Tests**: all feature tests
- **Gate**: Build
- **Done when**: test, typecheck, lint, build and desktop/mobile visual checks pass.
