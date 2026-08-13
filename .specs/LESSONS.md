# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Assert every field value in request payloads assembled at the UI boundary.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `onboarding-ui` · harmful: 0
- features: tenant-onboarding
- evidence: validation.md:M1 (onboarding-ui)
- last seen: 2026-08-13T16:23:26Z

### L-002 - Test each validation-rule conjunct with a sample that satisfies every other conjunct.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `validation` · harmful: 0
- features: tenant-onboarding
- evidence: validation.md:M2 (validation)
- last seen: 2026-08-13T16:23:27Z

### L-003 - Assert complete outbound URLs for token-bearing routes to prevent secret leakage through paths or queries.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `bff-security` · harmful: 0
- features: tenant-onboarding
- evidence: validation.md:M4 (bff-security)
- last seen: 2026-08-13T16:23:27Z

### L-004 - Test upstream non-success HTTP responses separately from thrown network errors in every BFF route.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `bff-routes` · harmful: 0
- features: tenant-onboarding
- evidence: validation.md:M5 (bff-routes)
- last seen: 2026-08-13T16:23:27Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
