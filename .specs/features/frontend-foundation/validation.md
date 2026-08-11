# Frontend Foundation Validation

**Verdict**: PASS
**Date**: 2026-08-11
**Source of truth**: six inline criteria supplied for this validation. No formal `spec.md` or `tasks.md` was created.
**Diff range**: `8ab61e5..56dbb17` (`9c063da`, `2072acf`, `293203b`, `56dbb17`)
**Verifier**: independent sub-agent (author != verifier)

## Acceptance Criteria

| Criterion | Evidence | Result |
| --- | --- | --- |
| Next.js 14+ App Router, TypeScript, and Tailwind build | `package.json:19` pins Next 16.2.11; `src/app/layout.tsx:20` is the App Router root layout; `src/app/globals.css:1` imports Tailwind. `npm run build` passed. | PASS |
| Lint, typecheck, and Vitest scripts work | `package.json:9-11` defines the three scripts. `npm run lint`, `npm run typecheck`, and `npm run test` passed. | PASS |
| Shadcn/Radix base has neutral CSS-variable tokens, `cn`, and a compiling base Button | `components.json:3-10` selects Radix Nova, neutral base color, and CSS variables; `src/app/globals.css:51-84` defines reversible neutral tokens; `src/lib/utils.ts:1-5` exports `cn`; `src/components/ui/button.tsx:44-67` exports the base Button. Typecheck and build passed. | PASS |
| OpenAPI types are generated from the supplied Swagger and regeneration targets the confirmed backend route | `package.json:13` targets `http://localhost:5050/openapi/v1.json`; `src/lib/api/generated/schema.d.ts:1-6` identifies the generated artifact and exports `paths`. | PASS |
| API client requires a HTTP(S) base URL, normalizes it, and returns the tested errors | `src/lib/api/client.ts:5-22` trims, rejects empty and non-HTTP(S) protocols with the expected messages, removes the trailing slash, and passes the normalized URL to `openapi-fetch`. Exact outcome assertions: `src/lib/api/client.test.ts:7-9`, `src/lib/api/client.test.ts:13-15`, and `src/lib/api/client.test.ts:19-21`. | PASS |
| Authentication/session is intentionally deferred until the backend contract is complete | The feature runtime surface is limited to URL normalization and a typed `openapi-fetch` client at `src/lib/api/client.ts:1-22`; no runtime authorization, token, refresh, storage, cookie, or session implementation exists under `src/` outside generated API type names. | PASS |

**Spec precision**: The supplied six criteria are sufficiently concrete for this foundation. The absence of a formal specification does not prevent a trustworthy verdict; no requirements were inferred beyond them.

## Gate Check

Run in fail-fast order. All commands exited 0.

| Command | Result |
| --- | --- |
| `npm run test` | 1 file passed, 3 tests passed, 0 failed, 0 skipped |
| `npm run typecheck` | passed |
| `npm run lint` | passed |
| `npm run build` | passed; Next.js 16.2.11 production build completed |

Test count before the feature range: 0. Test count after: 3. Delta: +3. `git diff --check 8ab61e5..56dbb17` passed.

The skill's `validate_state.py` gate could not run because this environment has no Python runtime. Manual fallback confirmed this report exists, declares `PASS`, and includes `file:line` evidence.

## Discrimination Sensor

Sensor depth: lightweight. A detached temporary worktree was used. The real-tree porcelain baseline was empty both before and after cleanup.

| Mutation | File:line | Focused test result | Killed |
| --- | --- | --- | --- |
| Return `url.toString()` without removing the trailing slash | `src/lib/api/client.ts:18` | `client.test.ts` failed at `src/lib/api/client.test.ts:7` (received `http://localhost:5050/`) | Yes |
| Change the empty-base error text | `src/lib/api/client.ts:9` | `client.test.ts` failed at `src/lib/api/client.test.ts:13` (exact-message assertion) | Yes |
| Disable the non-HTTP(S) protocol guard | `src/lib/api/client.ts:14` | `client.test.ts` failed at `src/lib/api/client.test.ts:19` (expected throw) | Yes |

Result: 3/3 mutations killed. Scratch worktree removed. No real code or test files were modified.

## Code Quality

| Check | Result |
| --- | --- |
| Minimum, surgical scope | PASS |
| No unnecessary abstraction or configuration | PASS |
| Matches local style and dependencies | PASS |
| Tests assert specified outcomes, not implementation details | PASS |
| Every in-scope test maps to the API URL criterion | PASS |
| Documented guidelines followed | PASS (`AGENTS.md`; `coding-principles.md`) |

## Ranked Gaps

None.

## Summary

The six supplied source-of-truth criteria are satisfied. The build-level gate passed, the API URL tests killed all three behavior-level mutations, and the real worktree remained unchanged by the sensor.
