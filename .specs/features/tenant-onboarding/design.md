# Tenant Onboarding Design

## Architecture

`/cadastro` remains a Server Component and renders a focused Client Component for the multi-step form. The client calls same-origin BFF route handlers. The BFF validates the public request shape, forwards it to the configured API URL, translates failures to safe messages, and never logs request bodies or verification tokens.

The registration BFF reads `X-Development-Verification-Token` from the upstream response. It returns the token only in the one registration response so the client can hold it in React state. It is never persisted, added to the address, or copied into an application log. The confirmation BFF accepts the token in a POST body and forwards it upstream.

## Components

| Component | Responsibility |
| --- | --- |
| `tenant-onboarding.tsx` | Three accessible data-entry steps and a confirmation step; holds verification token in component state. |
| `tenant-onboarding.ts` | Contract guards, password rule and safe backend error translation. |
| `api/tenants/register/route.ts` | Same-origin proxy for tenant registration with idempotency forwarding. |
| `api/auth/email-verifications/route.ts` | Same-origin proxy for confirmation. |

## Security Decisions

- A new UUID is generated in memory for each registration attempt.
- Password and verification token are never interpolated into URLs, errors, logs, browser storage or cookies.
- The existing login BFF remains responsible for setting the HttpOnly session cookie after confirmation.
