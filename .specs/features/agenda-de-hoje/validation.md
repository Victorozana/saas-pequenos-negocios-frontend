# Agenda de hoje Validation

**Date**: 2026-08-12
**Spec**: `.specs/features/agenda-de-hoje/spec.md`
**Diff range**: `80e6cdf..a87a629`
**Verifier**: independent sub-agent (author != verifier)

---

## Task Completion

| Task | Status | Notes |
| --- | --- | --- |
| T1 | ✅ Done | Secure BFF and adapter are present. |
| T2 | ⚠️ Partial | Required UI states exist, but appointment ordering and field rendering coverage is incomplete. |
| T3 | ✅ Done | Dashboard remains server-authenticated and composes the agenda block. |

## Spec-Anchored Acceptance Criteria

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| AGENDA-01 | `/dashboard` renders the heading and the BFF queries appointments assigned to the authenticated person for today. | `src/app/dashboard/page.test.tsx:45` - `expect(...Agenda de hoje carregada...).toBeTruthy()`; `src/app/api/dashboard/today/route.test.ts:41` - `expect(loadAppointments).toHaveBeenCalledWith("private-token", user.id)` | ⚠️ Partial: the endpoint/date filter is implemented at `src/lib/appointments/backend.ts:59-77`, but has no adapter-level assertion. |
| AGENDA-02 | Pending request renders accessible loading skeleton. | `src/components/dashboard/agenda-today.test.tsx:39` - `expect(screen.getByText("Carregando agenda…")).toBeTruthy()` | ✅ PASS |
| AGENDA-03 | Every appointment is ordered by start time and displays start/end, type, and available address. | `src/components/dashboard/agenda-today.test.tsx:40-41` - type/address assertions only. | ❌ GAP: no assertion for either displayed times or ordering; `src/lib/appointments/backend.ts:97-100` sorting is untested. |
| AGENDA-04 | Empty list shows exact empty message and disabled CTA with no link. | `src/components/dashboard/agenda-today.test.tsx:51-57` - exact text, `disabled === true`, no link. | ✅ PASS |
| AGENDA-05 | Backend/network failures return/render the exact safe message without details. | `src/app/api/dashboard/today/route.test.ts:65-68`; `src/components/dashboard/agenda-today.test.tsx:65-68` | ✅ PASS |
| AGENDA-06 | Missing cookie and backend 401/403/404 each return 401, expire cookie, then client redirects to `/login`. | `src/app/api/dashboard/today/route.test.ts:80-84` tests only backend 401; `src/components/dashboard/agenda-today.test.tsx:81-84` tests client redirect for 401. | ❌ GAP: no evidence for absent cookie, 403, or 404; no assertion that the missing-cookie path expires the cookie. |
| AGENDA-07 | No access token in BFF JSON, URL, persistent browser storage, or logs. | `src/app/api/dashboard/today/route.test.ts:42` - `expect(await responseCopy.text()).not.toContain("private-token")`. | ⚠️ Partial: JSON exclusion is covered. URL, persistent-storage, and logging constraints are not asserted; inspection finds no client token use (`src/components/dashboard/agenda-today.tsx:48`) and no logging in the diff. |

**Status**: ❌ Gaps present (2 requirements incomplete; 2 partially evidenced).

## Discrimination Sensor

| Mutation | File:line | Description | Killed? |
| --- | --- | --- | --- |
| 1 | `src/components/dashboard/agenda-today.tsx:15-16` | Replaced the fixed safe error message with `Mensagem insegura alterada`. | ✅ Killed by `AgendaToday > shows a safe error after a BFF or network failure` at `src/components/dashboard/agenda-today.test.tsx:60-69`. |

**Sensor depth**: lightweight (1 targeted mutation in a temporary detached worktree).

**Result**: 1/1 killed. The primary workspace porcelain matched its pre-sensor empty baseline after the run.

## Code Quality

| Principle | Status |
| --- | --- |
| Minimum code / surgical changes | ✅ |
| No scope creep or unavailable navigation | ✅ |
| Matches existing auth patterns | ✅ |
| Tests map to requirements | ⚠️ Two requirement behaviors are not asserted. |
| Documented guidelines followed | ✅ `AGENTS.md`; feature artifacts and local patterns inspected. |

## Edge Cases

- [ ] Invalid or missing appointment fields: implementation rejects them at `src/lib/appointments/backend.ts:27-40,93-95`, but there is no adapter test evidence.
- [x] Missing address: the UI conditionally omits the address at `src/components/dashboard/agenda-today.tsx:136-141`; no explicit test is present.

## Gate Check

- **Focused command**: `npm run test -- src/app/api/dashboard/today/route.test.ts src/components/dashboard/agenda-today.test.tsx src/app/dashboard/page.test.tsx`
- **Result**: 10 passed, 0 failed (three test files).
- **Test count before feature**: 43
- **Test count after feature**: 52
- **Delta**: +9 tests
- **Full build gate**: not re-run by this verifier; it is owned by the implementation handoff and remains required before release.

## Fix Plans

### Fix 1: Assert contract-safe appointment handling

- **Root cause**: `fetchTodayAppointments` has no direct tests.
- **Fix task**: Add adapter tests for endpoint/query range/user filter, chronological sorting, malformed payload rejection, and no-address output.
- **Priority**: Major

### Fix 2: Complete expired-session coverage

- **Root cause**: route tests cover only backend 401.
- **Fix task**: Add separate tests for missing cookie, 403, and 404 verifying 401 and `Set-Cookie` expiration; clarify or assert the missing-cookie cookie-expiration policy.
- **Priority**: Major

### Fix 3: Prove rendered appointment detail

- **Root cause**: component test asserts type/address only.
- **Fix task**: Supply unsorted appointments and assert chronological order plus both formatted times; assert absent address is not rendered.
- **Priority**: Major

## Summary

**Overall**: ❌ Not Ready

**Spec-anchored check**: 3/7 fully matched, 2 partial, 2 gaps.
**Sensor**: 1/1 mutation killed.
**Gate**: 10 focused tests passed.

The operational UI and secure boundary are present, but the mandatory test suite does not yet prove chronological rendering, malformed backend payload safety, or all expired-session cases.
