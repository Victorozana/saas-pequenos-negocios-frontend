# Agenda de hoje Specification

## Problem Statement

Após o login, o dashboard ainda apresenta conteúdo de fundação e não informa a agenda operacional da pessoa autenticada. A primeira tela precisa mostrar os compromissos atribuídos àquela pessoa no dia corrente sem expor a credencial de acesso.

## Goals

- [ ] Mostrar no `/dashboard` a agenda do dia da pessoa autenticada.
- [ ] Manter a consulta autenticada no servidor, por meio de um BFF.
- [ ] Comunicar carregamento, ausência de itens, falha segura e expiração de sessão.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Criar, editar ou cancelar agendamentos | Não faz parte desta entrega. |
| Cadastro ou exibição de clientes | O contrato de agendamentos não fornece o cliente. |
| Link para novo agendamento | A rota ainda não existe. |
| Alterar o backend | O backend é somente fonte do contrato. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Fuso horário da agenda | O intervalo do dia é calculado no relógio do servidor Next. | O contrato não fornece fuso da pessoa ou do negócio. | n |
| Dados do negócio | Não exibir nome do negócio. | `UserProfileResponse` só disponibiliza `tenantId`; `GET /tenants/me` não tem corpo tipado no OpenAPI ativo. | n |
| CTA vazio | Botão desabilitado, sem `href`. | Dá visibilidade à próxima ação sem criar navegação indisponível. | n |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Consultar a agenda pessoal de hoje ⭐ MVP

**User Story**: Como pessoa autenticada, quero ver meus agendamentos de hoje ao entrar no dashboard para iniciar o trabalho sabendo meus próximos compromissos.

**Why P1**: Esta é a operação principal da tela inicial pós-login.

**Acceptance Criteria**:

1. WHEN a pessoa autenticada abre `/dashboard` THEN the system SHALL render the heading `Agenda de hoje` and request only that person's appointments for the current day through an internal BFF. <!-- event-driven -->
2. WHILE the agenda request is pending the system SHALL render an accessible loading skeleton in the agenda block. <!-- state-driven -->
3. WHEN the BFF returns appointments THEN the system SHALL render each appointment ordered by start time with its start and end time, type, and available address. <!-- event-driven -->
4. WHEN the BFF returns an empty appointment list THEN the system SHALL render `Nenhum agendamento para hoje` and a disabled `Criar primeiro agendamento` button without a link. <!-- event-driven -->
5. IF the backend or network request fails THEN the system SHALL return and render the safe message `Não foi possível carregar sua agenda agora. Tente novamente.` without backend details. <!-- unwanted-behavior -->
6. IF the session cookie is absent or the backend rejects the access token with 401, 403, or 404 THEN the system SHALL return 401, expire the session cookie, and redirect the browser to `/login`. <!-- unwanted-behavior -->
7. The system SHALL never include the access token in its JSON response, browser URL, persistent browser storage, or logs. <!-- ubiquitous -->

**Independent Test**: Mock the BFF and verify populated, empty, failed, and expired-session dashboard states; mock backend adapters and verify BFF authorization and safe responses.

## Edge Cases

- IF a backend payload has missing or invalid appointment fields THEN the system SHALL treat it as a safe backend failure.
- WHERE an appointment has no address THEN the system SHALL omit the address line.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| AGENDA-01 | P1: Consultar a agenda pessoal de hoje | Tasks | Implementing |
| AGENDA-02 | P1: Consultar a agenda pessoal de hoje | Tasks | Implementing |
| AGENDA-03 | P1: Consultar a agenda pessoal de hoje | Tasks | Implementing |
| AGENDA-04 | P1: Consultar a agenda pessoal de hoje | Tasks | Implementing |
| AGENDA-05 | P1: Consultar a agenda pessoal de hoje | Tasks | Implementing |
| AGENDA-06 | P1: Consultar a agenda pessoal de hoje | Tasks | Implementing |
| AGENDA-07 | P1: Consultar a agenda pessoal de hoje | Tasks | Implementing |

**Coverage:** 7 total, 7 mapped to tasks, 0 unmapped.

## Success Criteria

- [ ] A signed-in person sees a usable agenda state for today at `/dashboard`.
- [ ] Every agenda request is authorized only server-side with the HttpOnly session cookie.
