# Consulta CNPJ no onboarding Specification

## Problem Statement

O onboarding exige digitação manual dos dados empresariais porque a consulta CNPJ do backend é um stub, possui contrato sem corpo tipado e ainda aplica uma regra alimentar incompatível com as categorias do produto.

## Goals

- Consultar um CNPJ válido antes de avançar no cadastro.
- Preencher dados públicos da empresa e endereço sem impedir revisão manual.
- Manter o provedor externo atrás do backend e do BFF.
- Proteger todas as futuras telas de negócio pela mesma fronteira autenticada.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Busca por nome empresarial | O provedor e o contrato usam CNPJ exato. |
| Persistir onboarding parcial | O cadastro continua atômico no POST final. |
| Autenticação automática após confirmação | O fluxo seguro aprovado continua confirmação → login. |
| Novas categorias de negócio | A consulta não altera o catálogo atual. |

## Assumptions & Open Questions

| Decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Provedor inicial | BrasilAPI em URL configurável | API pública sem credencial e substituível pelo gateway. | y — execução aprovada em 2026-08-13 |
| Elegibilidade | Situação cadastral `ATIVA` | O produto atende várias categorias; CNAE não bloqueia cadastro. | y — roadmap aprovado |
| Dados retornados | Preenchidos e editáveis | A fonte externa pode estar incompleta ou desatualizada. | y — roadmap aprovado |
| Falha externa | 503 seguro | Indisponibilidade não significa CNPJ inválido. | y — requisito de segurança existente |

**Open questions:** none.

## User Stories

### P1: Consultar empresa por CNPJ

**User Story**: Como responsável pela empresa, quero consultar o CNPJ para preencher o cadastro com menos digitação e conferir a situação cadastral.

**Acceptance Criteria**:

1. IF the CNPJ is syntactically invalid THEN the system SHALL return HTTP 400 with the safe title `CNPJ inválido.` and SHALL NOT call the external provider. <!-- CNPJ-001 -->
2. WHEN the provider returns an active company THEN the system SHALL return HTTP 200 with normalized CNPJ, corporate name, trade name, legal nature, all CNAEs, status and every address field defined by the contract. <!-- CNPJ-002 -->
3. WHEN an active company has a CNAE outside the former food policy THEN the system SHALL still return HTTP 200 with that company. <!-- CNPJ-003 -->
4. IF the company is not found THEN the system SHALL return HTTP 404 with the safe title `Empresa não encontrada.`. <!-- CNPJ-004 -->
5. IF the company is not active THEN the system SHALL return HTTP 422 with the safe title `A empresa não está ativa.`. <!-- CNPJ-005 -->
6. IF the provider times out, rejects the request, or returns an invalid payload THEN the system SHALL return HTTP 503 with the safe title `Não foi possível consultar o CNPJ agora.` without provider details. <!-- CNPJ-006 -->

### P1: Preencher e revisar os dados consultados

**User Story**: Como responsável, quero consultar o CNPJ na primeira etapa e revisar os campos antes de continuar.

**Acceptance Criteria**:

1. WHEN the user requests a valid active CNPJ THEN the UI SHALL call only `/api/company-registry/{encoded-cnpj}` and SHALL populate CNPJ, razão social, nome fantasia, natureza jurídica, CNAE principal and available address fields with exact response values. <!-- CNPJ-007 -->
2. WHEN lookup data is populated THEN the UI SHALL keep every populated field editable and SHALL preserve edited values when moving between steps. <!-- CNPJ-008 -->
3. WHILE the lookup is pending THEN the UI SHALL disable the lookup action and announce `Consultando…`. <!-- CNPJ-009 -->
4. IF the BFF returns 400, 404, 422, or 503 THEN the UI SHALL display its safe message, remain on the company step and preserve every non-sensitive value already entered. <!-- CNPJ-010 -->
5. The system SHALL never place external-provider details, credentials, or the final registration password in lookup URLs, JSON responses, storage, or logs. <!-- CNPJ-011 -->

### P1: Proteger as telas de negócio

**User Story**: Como administrador, quero que todas as telas operacionais exijam a sessão autenticada.

**Acceptance Criteria**:

1. WHEN an anonymous request targets `/dashboard`, `/clientes`, `/servicos`, `/orcamentos`, or `/agenda` and any nested path THEN the system SHALL redirect to `/login` with the exact original pathname in `next`. <!-- CNPJ-012 -->
2. WHEN any protected path has a session cookie THEN the optimistic proxy SHALL allow the request for authoritative page validation. <!-- CNPJ-013 -->

## Edge Cases

- A resposta externa pode omitir nome fantasia, complemento ou partes do endereço; o contrato retorna strings vazias sem inventar dados.
- CNAEs podem chegar como números ou strings; o gateway os normaliza como strings.
- Uma segunda consulta substitui apenas os campos públicos mapeados e preserva categoria, contato empresarial e demais valores locais.

## Requirement Traceability

| Requirement | Story | Status |
| --- | --- | --- |
| CNPJ-001 | Consultar empresa por CNPJ | Tasks |
| CNPJ-002 | Consultar empresa por CNPJ | Tasks |
| CNPJ-003 | Consultar empresa por CNPJ | Tasks |
| CNPJ-004 | Consultar empresa por CNPJ | Tasks |
| CNPJ-005 | Consultar empresa por CNPJ | Tasks |
| CNPJ-006 | Consultar empresa por CNPJ | Tasks |
| CNPJ-007 | Preencher e revisar os dados | Tasks |
| CNPJ-008 | Preencher e revisar os dados | Tasks |
| CNPJ-009 | Preencher e revisar os dados | Tasks |
| CNPJ-010 | Preencher e revisar os dados | Tasks |
| CNPJ-011 | Preencher e revisar os dados | Tasks |
| CNPJ-012 | Proteger telas de negócio | Tasks |
| CNPJ-013 | Proteger telas de negócio | Tasks |

## Success Criteria

- A primeira etapa consulta e preenche uma empresa ativa sem depender do CNAE.
- Todos os erros são semanticamente corretos e seguros.
- O OpenAPI e o cliente TypeScript descrevem a mesma resposta.
- As futuras rotas operacionais compartilham a fronteira autenticada.
