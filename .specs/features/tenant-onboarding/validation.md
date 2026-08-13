# Tenant Onboarding Validation

## Validation: Tenant Onboarding - PASS

**Verdict: PASS.** All 11 acceptance criteria and both edge cases have spec-anchored evidence. The mandatory Build gate passes, and all 7 isolated critical-path mutants are killed.

**Date**: 2026-08-13
**Spec**: `.specs/features/tenant-onboarding/spec.md`
**Validated HEAD**: `54fa665920a968c9117642fa74e3310e90a7327c`
**Validated historical range**: `f330738..54fa665` (`538090a^..54fa665`)
**Verifier**: independent sub-agent (author != verifier)

The historical range starts at the parent of `538090a`, the first onboarding commit. Unrelated agenda commits are interleaved, so diff review and evidence are scoped to the onboarding spec, implementation, routes, public navigation, and named tests. T11, T12, and T13 are present at `c2dcf18`, `3e4dc5a`, and `54fa665` respectively.

---

## Task Completion

| Task | Status | Evidence |
| --- | --- | --- |
| T1-T5 | Done | Contract helpers, BFF routes, onboarding UI, `/cadastro`, and `/login` entry point exist in the validated range. |
| T6 | Done | The mandatory Build gate was reproduced at HEAD. `tasks.md` records the prior desktop and 390 px visual checks; interactive visual UAT was not repeated by this verifier. |
| T7-T10 | Done | Loading/recovery, malformed registration response, token containment, confirmation recovery, and unavailable-link assertions pass. |
| T11 | Done | `src/app/api/auth/email-verifications/route.test.ts:13-16` asserts the exact URL plus path/query/fragment exclusion; `:20-29` asserts upstream 400 and 500 remain failures. |
| T12 | Done | `src/components/onboarding/tenant-onboarding.test.tsx:63-77` isolates all five password-policy conjuncts and accessibility association; `:87-89` asserts the complete UI payload and non-empty idempotency key. |
| T13 | Done | `src/components/onboarding/tenant-onboarding.test.tsx:175-200` asserts both malformed 201 states, safe messages, retained values, and no confirmation transition. |

## Spec-Anchored Acceptance Criteria

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| Valid registration | POST every required `RegisterTenantRequest` value with a non-empty `Idempotency-Key`. | `src/components/onboarding/tenant-onboarding.test.tsx:87` - `expect(JSON.parse(String(registrationInit.body))).toEqual(expectedRegistrationRequest)` checks every value declared at `:9-35`; `:88-89` requires a string whose trimmed value is non-empty. `src/app/api/tenants/register/route.test.ts:11` checks the BFF forwards the exact body and key. | PASS |
| Invalid password | Block submission independently for length, uppercase, lowercase, number, and special-character failures; associate the accessible message with the field. | `src/components/onboarding/tenant-onboarding.test.tsx:63-77` - five isolated invalid samples; exact alert text; `aria-describedby === alert.id`; `aria-invalid === "true"`. | PASS |
| Registration loading | Disable completion and announce loading while pending. | `src/components/onboarding/tenant-onboarding.test.tsx:139-140` - `findByRole("button", { name: "Enviando…" })` and `expect(...disabled).toBe(true)`. | PASS |
| Registration 400/422 | Show the safe Problem Details message and retain non-sensitive values. | `src/components/onboarding/tenant-onboarding.test.tsx:145-161` - parameterized 400/422 exact messages plus retained administrator and company values. `src/app/api/tenants/register/route.test.ts:16-19` checks the 422 title and status at the BFF boundary. | PASS |
| Registration 409 | Show the conflict message and allow correction. | `src/components/onboarding/tenant-onboarding.test.tsx:145-161` - exact 409 conflict message, retained values, and navigation back to editable company data. | PASS |
| Registration network/5xx | Show unavailability without internal details. | `src/components/onboarding/tenant-onboarding.test.tsx:145-172` - exact safe 503 text; a thrown `"database endpoint leaked"` produces only `"Não foi possível concluir o cadastro agora. Tente novamente."`. | PASS |
| 201 with development token | Show confirmation without placing the token in URL, persistent storage, or logs. | `src/components/onboarding/tenant-onboarding.test.tsx:83` finds the confirmation action; `:108-112` excludes the token from `window.location.href`, local/session storage, storage writes, and console calls. `src/app/api/auth/email-verifications/route.test.ts:13-16` locks the upstream URL and excludes the token from pathname, search, and hash. | PASS |
| Confirm email | POST the token in JSON and redirect to `/login` only after 204. | `src/components/onboarding/tenant-onboarding.test.tsx:90` - exact confirmation JSON body, no early redirect, then `replace("/login")` after the pending 204 resolves. `src/app/api/auth/email-verifications/route.test.ts:12,17` checks preserved 204 and exact body. | PASS |
| Confirmation failure | Show a safe message and remain on confirmation. | `src/components/onboarding/tenant-onboarding.test.tsx:125-128` - exact safe alert, confirmation heading/action still present, and `replace` not called. `src/app/api/auth/email-verifications/route.test.ts:20-36` covers safe upstream 400/500 and network failure. | PASS |
| Login entry | Link `/login` to `/cadastro`. | `src/app/login/page.test.tsx:13` - exact accessible link has `href === "/cadastro"`. | PASS |
| No unavailable links | Render no links to unavailable public modules. | `src/app/login/page.test.tsx:18` - all rendered link targets must equal exactly `["/cadastro"]`. | PASS |

**Status**: 11/11 acceptance criteria match the spec-defined outcomes. Zero uncovered criteria and zero spec-precision gaps.

## Edge Cases

| Edge case | Evidence | Result |
| --- | --- | --- |
| Development token header absent after 201 | `src/app/api/tenants/register/route.test.ts:22-25` requires 502 and the exact environment message with no fabricated token. `src/components/onboarding/tenant-onboarding.test.tsx:175-200` requires that message, retained values, and no confirmation step. | PASS |
| Successful response body invalid | `src/app/api/tenants/register/route.test.ts:28-32` requires 502 and the exact safe response without a token. `src/components/onboarding/tenant-onboarding.test.tsx:181-200` requires the safe generic message, retained values, and no confirmation step. | PASS |

## Gate Check

- **Mandatory command**: `npm run test && npm run typecheck && npm run lint && npm run build`
- **HEAD result**: PASS. 21 test files, 77 passed, 0 failed, 0 skipped. TypeScript, ESLint, and the Next.js 16.2.11 production build passed; 13 static pages were generated and the expected onboarding routes were listed.
- **Before-feature baseline**: detached worktree at `f330738`; `npm ci` succeeded; `npm run test` passed 13 files and 33/33 tests. The first baseline attempt timed out at 64.1 seconds without a test result; the repeated run completed in 32.27 seconds with exit 0.
- **Delta**: 77 - 33 = +44 repository tests and +8 test files. The range contains unrelated agenda work; the five onboarding test files currently contain 30 tests.
- **Integrity**: no onboarding test deletion, skip, disable, or weakened assertion was found. T11-T13 strengthen previously shallow assertions.

## Discrimination Sensor

The sensor ran only in detached worktree `C:\Users\victo\AppData\Local\Temp\codex-tenant-onboarding-96f16dc995` at HEAD. Each mutation was restored to HEAD and scratch porcelain was confirmed empty before the next mutation. No stash was used. The real-tree `git status --porcelain=v1` contained 0 entries before the sensor and 0 after cleanup (`MATCH=True`). The sensor worktree and directory were removed (`SCRATCH_EXISTS=False`).

| Mutation | Scratch file:line | Behavior fault | Targeted result | Killed? |
| --- | --- | --- | --- | --- |
| M1 | `src/components/onboarding/tenant-onboarding.tsx:18` | Corrupt UI-generated `adminEmail` to `mutated@example.invalid`. | Component suite: 1 failed, 15 passed; exact payload assertion failed at `src/components/onboarding/tenant-onboarding.test.tsx:87`. | KILLED |
| M2 | `src/lib/onboarding/tenant-onboarding.ts:16` | Remove the uppercase-character password rule. | Helper + component suites: 1 failed, 19 passed; uppercase case failed at `src/components/onboarding/tenant-onboarding.test.tsx:75`. | KILLED |
| M3 | `src/app/api/auth/email-verifications/route.ts:11` | Put the token in the upstream URL path. | Route suite: 1 failed, 3 passed; exact URL assertion failed at `src/app/api/auth/email-verifications/route.test.ts:13`. | KILLED |
| M4 | `src/app/api/auth/email-verifications/route.ts:11` | Put the token in the upstream URL query. | Route suite: 1 failed, 3 passed; exact URL assertion failed at `src/app/api/auth/email-verifications/route.test.ts:13`. | KILLED |
| M5 | `src/app/api/auth/email-verifications/route.ts:11` | Put the token in the upstream URL fragment. | Route suite: 1 failed, 3 passed; exact URL assertion failed at `src/app/api/auth/email-verifications/route.test.ts:13`. | KILLED |
| M6 | `src/app/api/auth/email-verifications/route.ts:13` | Convert upstream HTTP errors into 204 success. | Route + component suites: 2 failed, 18 passed; 400 and 500 status assertions failed at `src/app/api/auth/email-verifications/route.test.ts:28`. | KILLED |
| M7 | `src/app/login/page.tsx:100` | Add an unavailable `/recuperar-senha` public link. | Login suite: 1 failed, 1 passed; exact link-set assertion failed at `src/app/login/page.test.tsx:18`. | KILLED |

**Sensor depth**: critical-path manual mutation; 7 isolated behavior mutations across payload integrity, validation conjunction, token containment in path/query/fragment, upstream error semantics, and public navigation.
**Sensor outcome**: 7/7 killed, 0 survived. PASS.

## Code Quality

| Principle | Status |
| --- | --- |
| Minimum and surgical implementation | PASS |
| No unrelated scope in onboarding paths | PASS |
| Matches existing Next.js route-handler and client-boundary patterns | PASS |
| Spec-anchored outcome check | PASS: exact values/states match all 11 ACs. |
| Payload/conjunction rule | PASS: every UI payload value and every password-policy conjunct is independently asserted. |
| Per-layer coverage | PASS: helpers, both BFF routes, UI happy/edge/error states, and public navigation are covered. |
| Test claim mapping | PASS: every onboarding test maps to an AC, edge case, or task Done-when criterion. |
| Documented guidelines | PASS: workspace `AGENTS.md`, `references/validate.md`, and `references/coding-principles.md` were applied. |

## Requirement Traceability Update

| Requirement | Spec status | Validation result |
| --- | --- | --- |
| ONBOARD-01 | Verified | PASS: complete registration payload, idempotency, password policy, loading, and registration failures are proven. |
| ONBOARD-02 | Verified | PASS: registration response edge states and safe recovery are proven. |
| ONBOARD-03 | Verified | PASS: confirmation token containment, JSON forwarding, 204 redirect, and safe failures are proven. |
| ONBOARD-04 | Verified | PASS: `/cadastro` entry and unavailable-link exclusion are proven. |

## Summary

**Overall**: PASS. The implementation at `54fa665` satisfies all spec outcomes. The Build gate passes with 77/77 tests, and the critical-path sensor kills all 7 mutations. No ranked gaps or new lesson signals remain.
