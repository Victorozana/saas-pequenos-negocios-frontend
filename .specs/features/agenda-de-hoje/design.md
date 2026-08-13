# Agenda de hoje Design

## Decision

The dashboard remains a Server Component for authoritative session validation and contains a client-only agenda block. The client calls `GET /api/dashboard/today`; the Route Handler reads the HttpOnly cookie, validates the current profile, calls `GET /api/v1/appointments` with the bearer token and the user's ID, then returns only public profile and appointment data.

## Data flow

```
Browser → /dashboard (server session validation) → AgendaToday
AgendaToday → /api/dashboard/today → HttpOnly cookie → backend profile + appointments
```

`/api/dashboard/today` computes the current local-day interval and sends `startDate`, `endDate`, and `assignedToUserId`. The raw backend response is runtime-validated because the active OpenAPI operation omits a 200 response schema.

## Failure behavior

- Missing/expired/forbidden session: BFF answers 401 and expires the cookie; client redirects to `/login`.
- Network, invalid payload, or other backend status: BFF answers 502/503 with one fixed safe message.
- Empty list: client renders its non-navigating CTA.

## Display constraints

The available profile contract permits showing the person's name and role. It does not provide a business name, customer name, or work-order label, so those are not inferred or displayed.
