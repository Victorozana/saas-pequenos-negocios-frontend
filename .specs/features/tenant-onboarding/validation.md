# Tenant Onboarding Validation

## Validation: Tenant Onboarding - FAIL

**Verdict: FAIL.** The Build gate passes, but four of six critical-path mutants survive. Three acceptance criteria and both edge cases lack complete spec-anchored UI evidence.

**Date**: 2026-08-13
**Spec**: `.specs/features/tenant-onboarding/spec.md`
**Requested diff range**: `538090a..ee56c72`
**Validated feature range**: `538090a^..ee56c72` (`f330738..ee56c72`)
**Verifier**: independent sub-agent (author != verifier)

The requested range is off by one: `538090a` is the first onboarding commit and contains the contract helpers, BFF routes, tests, spec, design, and tasks. The validated range starts at its parent so T1 and T2 are included. Evidence and quality review are limited to onboarding paths because unrelated agenda commits are interleaved in the range.

---

## Task Completion

| Task | Status | Notes |
| --- | --- | --- |
| T1-T5 | Done | Named implementation and tests exist in the validated feature range. |
| T6 | Done with non-repeatable visual evidence | The Build gate was reproduced. `tasks.md` records desktop and 390 px checks, but this verifier did not repeat interactive visual UAT. |
| T7-T10 | Done | Remediation tests and implementation are committed through `ee56c72`. |

## Spec-Anchored Acceptance Criteria

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| Valid registration | POST every required `RegisterTenantRequest` value and a non-empty `Idempotency-Key`. | `src/app/api/tenants/register/route.test.ts:11` - `toHaveBeenCalledWith(... body: JSON.stringify(request), ... "Idempotency-Key": "idempotency-key")` proves forwarding of a supplied complete request. `src/components/onboarding/tenant-onboarding.test.tsx:45` asserts only `cnpj` and `addressStreet` from the UI-generated payload. Mutant M1 corrupted `adminEmail` and survived. | GAP |
| Invalid password | Block submission for each missing password rule and associate an accessible field message. | `src/lib/onboarding/tenant-onboarding.test.ts:49-52` asserts valid, short, and no-number samples. `src/components/onboarding/tenant-onboarding.test.tsx:39` asserts only alert text for a short/no-uppercase password. It does not assert field association, and mutant M2 removed the uppercase rule without failure. | GAP |
| Registration loading | Disable completion and announce loading while pending. | `src/components/onboarding/tenant-onboarding.test.tsx:94-95` - finds `button[name="Enviando..."]` and asserts `disabled === true`. | PASS |
| Registration 400/422 | Show the safe Problem Details message and retain non-sensitive values. | `src/components/onboarding/tenant-onboarding.test.tsx:100-117` - parameterized exact 400/422 message assertions plus retained administrator and company values. | PASS |
| Registration 409 | Show the conflict message and allow correction. | `src/components/onboarding/tenant-onboarding.test.tsx:100-117` - exact 409 message, retained values, and navigation back to editable company fields. | PASS |
| Registration network/5xx | Show unavailability without internal details. | `src/components/onboarding/tenant-onboarding.test.tsx:100-112` asserts the exact safe 503 message; `:119-127` rejects with `"database endpoint leaked"` and asserts only the generic safe message. | PASS |
| 201 with development token | Show confirmation while keeping the token out of URLs, persistent storage, and logs. | `src/components/onboarding/tenant-onboarding.test.tsx:45` asserts the confirmation action appears. `:63-67` excludes the token from the browser URL, local/session storage, storage writes, and console calls. `src/app/api/auth/email-verifications/route.test.ts:10` only uses `expect.stringContaining(...)` for the upstream URL; mutant M4 appended the token to that URL and survived. | GAP |
| Confirm email | POST the token as JSON and redirect to `/login` only after 204. | `src/components/onboarding/tenant-onboarding.test.tsx:45` - exact JSON body, no early redirect, then `replace("/login")` after resolving 204. `src/app/api/auth/email-verifications/route.test.ts:9-10` asserts upstream 204 and exact JSON body. | PASS |
| Confirmation failure | Show a safe message and remain on confirmation. | `src/components/onboarding/tenant-onboarding.test.tsx:70-83` - injects an internal 500 detail, asserts the exact safe alert, confirmation heading/button, and no redirect. | PASS |
| Login entry | Link `/login` to `/cadastro`. | `src/app/login/page.test.tsx:11-13` - exact accessible link name and `href === "/cadastro"`. | PASS |
| No unavailable links | Render no links to unavailable public modules. | `src/app/login/page.test.tsx:16-18` - enumerates all link targets and requires exactly `["/cadastro"]`. | PASS |

**Status**: 8/11 acceptance criteria have complete spec-anchored evidence. No spec-precision gap was found.

## Edge Cases

| Edge case | Evidence | Result |
| --- | --- | --- |
| Missing development token after 201 | `src/app/api/tenants/register/route.test.ts:22-25` asserts 502 and the exact environment message with no fabricated token. No component assertion proves that this message is shown while the form does not advance. M3 confirms the BFF assertion is discriminating. | GAP |
| Invalid successful response body | `src/app/api/tenants/register/route.test.ts:28-32` asserts 502 and the exact safe message without a token. No component assertion proves the safe message and unchanged registration step. | GAP |

## Gate Check

- **Command**: `npm run test && npm run typecheck && npm run lint && npm run build`
- **Gate outcome**: PASS. 21 test files, 69 passed, 0 failed, 0 skipped. Typecheck, ESLint, and Next.js 16.2.11 production build passed.
- **Before-feature baseline**: At `f330738`, 13 test files and 33 tests passed, with 0 failures.
- **Current total**: 21 test files and 69 tests passed.
- **Delta**: +8 test files and +36 tests across the complete historical range. The range contains unrelated agenda work, so this is a repository-level integrity delta, not an onboarding-only attribution.
- **Integrity**: No skips, deletions, or weakened assertions were found in the onboarding diff. New assertions remain too shallow in the survivor areas below.

## Discrimination Sensor

The sensor ran only in `C:\Users\victo\AppData\Local\Temp\codex-tenant-onboarding-ee56c72`, a detached temporary worktree. The real-tree porcelain was empty before the sensor and empty after cleanup. The scratch worktree and its directory were removed; no stash was used.

| Mutation | File:line | Behavior fault | Targeted result | Killed? |
| --- | --- | --- | --- | --- |
| M1 | `src/components/onboarding/tenant-onboarding.tsx:20` | Override the submitted administrator email with `mutated@example.invalid`. | Component suite: 10 passed. | SURVIVED |
| M2 | `src/lib/onboarding/tenant-onboarding.ts:16` | Remove the uppercase-character requirement from password validation. | Helper + component suites: 14 passed. | SURVIVED |
| M3 | `src/app/api/tenants/register/route.ts:15` | Accept a 201 response without the development verification header. | Registration route test failed at `src/app/api/tenants/register/route.test.ts:24`, expected 502 and received 201. | KILLED |
| M4 | `src/app/api/auth/email-verifications/route.ts:11` | Append the verification token to the upstream confirmation URL. | Confirmation route + component suites: 12 passed. | SURVIVED |
| M5 | `src/app/api/auth/email-verifications/route.ts:12` | Treat every upstream HTTP error as 204 success. | Confirmation route + component suites: 12 passed. | SURVIVED |
| M6 | `src/app/login/page.tsx:96` | Add an unavailable `/recuperar-senha` public link. | Login test failed at `src/app/login/page.test.tsx:18`, which received two links instead of only `/cadastro`. | KILLED |

**Sensor depth**: critical-path manual mutation, 6 targeted behavior mutations.
**Sensor outcome**: 2/6 killed, 4/6 survived. FAIL.

## Code Quality

| Principle | Status |
| --- | --- |
| Minimum and surgical implementation | PASS |
| No unrelated scope in onboarding paths | PASS |
| Matches the documented Next.js 16 route-handler and client-boundary conventions | PASS |
| Spec-anchored assertions match exact outcomes where present | PASS |
| Payload/conjunction rule | FAIL: UI payload values and every password-rule conjunct are not independently asserted. |
| Per-layer route coverage | FAIL: confirmation route tests omit upstream HTTP error behavior and exact URL token exclusion. |
| Every onboarding test maps to an AC, edge case, or task done-when | PASS |
| Documented guidelines | PASS: workspace `AGENTS.md` and `references/coding-principles.md` were applied. |

## Requirement Traceability Update

| Requirement | Spec status | Validation result |
| --- | --- | --- |
| ONBOARD-01 | Verified | Needs tests for the complete UI-generated payload and each password-policy conjunct/accessibility association. |
| ONBOARD-02 | Verified | Needs exact upstream URL non-disclosure, upstream HTTP failure, and UI edge-response tests. |
| ONBOARD-03 | Verified | Verified: unavailable-link exclusion is discriminating. |
| ONBOARD-04 | Verified | Verified: `/login` links to `/cadastro`. |

## Ranked Gaps

1. **Major, token security**: M4 survived. Assert the complete upstream confirmation URL so a token in any URL fails the route test.
2. **Major, confirmation error behavior**: M5 survived. Add route tests for upstream non-204 HTTP responses and prove they cannot become success.
3. **Major, registration payload integrity**: M1 survived. Assert every UI-generated `RegisterTenantRequest` value, not two representative fields.
4. **Major, password policy/accessibility**: M2 survived. Test each password-rule conjunct independently and assert the alert is associated with the password field.
5. **Major, edge-case UI state**: Add component assertions for missing-token and malformed-success responses, including the exact safe message and no step advancement.
6. **Minor, visual reproducibility**: Preserve repeatable desktop/mobile UAT evidence if T6 is expected to be independently auditable.

## Summary

**Overall**: FAIL. The implementation builds and the main happy/error paths execute, but the critical security and payload assertions do not reliably detect four behavior regressions. Fix the ranked gaps and run a fresh independent verification.
