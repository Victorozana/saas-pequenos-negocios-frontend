# Tenant Onboarding Validation

**Verdict: FAIL.** The implementation passes its build gate and the two targeted mutations were killed, but six acceptance criteria and one edge case have no spec-anchored test evidence.

**Date**: 2026-08-13
**Spec**: `.specs/features/tenant-onboarding/spec.md`
**Diff range**: `538090a..e058f12`
**Verifier**: independent sub-agent (author ≠ verifier)

---

## Task Completion

| Task | Status | Notes |
| --- | --- | --- |
| T1–T5 | ✅ Done | Implementation and named tests exist. |
| T6 | ⚠️ Partial | Build gate reproduced. Desktop/mobile check is recorded in `tasks.md`, but no repeatable visual-test evidence exists in the feature test suite. |

## Spec-Anchored Acceptance Criteria

| Criterion | Spec-defined outcome | Evidence | Result |
| --- | --- | --- | --- |
| Valid registration | POST forwards every required field with a non-empty idempotency key. | `src/app/api/tenants/register/route.test.ts:11` asserts the forwarded body and key; `:12-13` assert 201 and header token. | ✅ PASS |
| Invalid password | Submission is blocked and an accessible field message is associated. | `src/components/onboarding/tenant-onboarding.test.tsx:13-17` asserts blocking and alert text; `src/components/onboarding/tenant-onboarding.tsx:14,20` provide `aria-describedby` and validation. | ✅ PASS |
| Loading | Completion command is disabled and indicates loading while submitting. | No assertion. | ❌ GAP |
| 400/422 | Safe Problem Details message preserves non-sensitive values. | `src/app/api/tenants/register/route.test.ts:16-20` asserts only 422 title forwarding. No UI retention assertion and no 400 evidence. | ❌ GAP |
| 409 | Conflict message allows correction. | `src/lib/onboarding/tenant-onboarding.test.ts:54-59` checks only message text. No UI/correction-path assertion. | ❌ GAP |
| Network/5xx | Safe unavailability message, without internal details. | `src/app/api/auth/email-verifications/route.test.ts:13-17` covers confirmation-network failure only. Registration client/5xx has no assertion. | ❌ GAP |
| 201 with development token | Confirmation step appears; token is absent from URL, persistent storage, and logs. | `src/components/onboarding/tenant-onboarding.test.tsx:19-22` asserts confirmation and the JSON confirmation body; `src/app/api/tenants/register/route.test.ts:8-13` asserts header-token response. URL/storage/log absence is not asserted. | ❌ GAP |
| Confirm email | JSON token POST and redirect to `/login` after 204. | `src/components/onboarding/tenant-onboarding.test.tsx:22` asserts body and `replace("/login")`; `src/app/api/auth/email-verifications/route.test.ts:6-10` asserts 204 forwarding. | ✅ PASS |
| Confirmation failure | Safe message and confirmation step remains visible. | No assertion. | ❌ GAP |
| Login entry | `/login` links to `/cadastro`. | `src/app/login/page.test.tsx:9-12` asserts exact link and href. | ✅ PASS |
| No unavailable-feature links | No links to unavailable functionality. | No assertion that enumerates or excludes such links. | ❌ GAP |

**Status**: ❌ 4/11 criteria have complete spec-anchored evidence. No criterion was imprecise in the specification.

## Edge Cases

- [x] Missing development token after 201: `src/app/api/tenants/register/route.test.ts:22-25` asserts safe 502 response and no fabricated token.
- [ ] Invalid success body: implemented at `src/app/api/tenants/register/route.ts:13`, but has no test assertion.

## Gate Check

- **Command**: `npm run test && npm run typecheck && npm run lint && npm run build`
- **Result**: 59 passed, 0 failed, 0 skipped. Typecheck, lint, and production build passed.
- **Test count before feature**: Not reproducible from the current checkout without installing dependencies for the historical revision.
- **Test count after feature**: 59.
- **Test integrity**: No skipped tests in the executed suite. The feature-added tests are present; this verifier found no evidence of deleted or weakened tests in the supplied range.

## Discrimination Sensor

An isolated temporary git worktree was created at `HEAD`. The real-tree porcelain was empty before and after the sensor. The temporary worktree was removed from Git after execution; a leftover untracked temporary directory could not be deleted by the environment policy and contains no repository changes.

| Mutation | File:line | Fault | Killed? |
| --- | --- | --- | --- |
| 1 | `src/app/api/tenants/register/route.ts:16` | Returned `"mutated-token"` instead of the upstream header token. | ✅ `route.test.ts:13` failed. |
| 2 | `src/components/onboarding/tenant-onboarding.tsx:21` | Redirected successful verification to `/dashboard` instead of `/login`. | ✅ `tenant-onboarding.test.tsx:22` failed. |

**Sensor depth**: lightweight. **Result**: 2/2 killed, PASS.

## Interactive UAT / Visual Validation

Not independently performed in this verifier pass. `tasks.md` records prior desktop and 390 px checks, but no screenshot, automated viewport assertion, or user UAT result is retained as evidence.

## Code Quality

| Principle | Status |
| --- | --- |
| Minimum code; no scope creep; surgical changes | ✅ |
| Matches local patterns | ✅ |
| Tests map to claimed requirements | ⚠️ Partial: several criteria are unclaimed. |
| Spec-anchored outcome values match where asserted | ✅ |
| Per-layer coverage expectation | ❌ Missing UI error/loading and security-observability coverage. |
| Documented guidelines followed | ✅ `C:\Users\victo\.agents\skills\tlc-spec-driven\references\coding-principles.md` |

## Requirement Traceability Update

| Requirement | Previous | Validation result |
| --- | --- | --- |
| ONBOARD-01 | Verified | ❌ Needs tests for loading, 400/422 retention, 409 correction, and registration unavailable states. |
| ONBOARD-02 | Verified | ❌ Needs tests for token non-disclosure, confirmation failure, and invalid success body. |
| ONBOARD-03 | Verified | ❌ Needs exclusion test for unavailable-feature links. |
| ONBOARD-04 | Verified | ✅ Verified. |

## Ranked Gaps

1. **Major, ONBOARD-01**: Add UI tests for loading/disabled completion and every registration error branch, including value preservation and 409 recovery.
2. **Major, ONBOARD-02**: Add tests proving the token is never sent to navigation, persistent storage, or logging; test failed confirmation stays on the confirmation step.
3. **Major, edge case**: Test malformed 201 response handling.
4. **Minor, ONBOARD-03/T6**: Add an explicit unavailable-link exclusion test and reproducible desktop/mobile visual evidence.

## Summary

**Overall**: ❌ Not ready to mark complete under the specification-driven release gate. The build is healthy and the sensor demonstrates two high-risk happy-path assertions are discriminating. The missing acceptance-criterion coverage must be added and independently re-verified.
