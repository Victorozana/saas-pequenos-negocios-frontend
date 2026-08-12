# Onboarding de tenant Specification

## Problem Statement

Uma pessoa ainda sem conta precisa cadastrar seu negócio e seu primeiro administrador antes de acessar o SaaS. O frontend deve enviar somente o contrato vigente, conduzir a confirmação de e-mail em Development/Test e manter senha, token e sessão fora de URLs e logs.

## Goals

- [ ] Permitir cadastro do tenant e do administrador em `/cadastro`.
- [ ] Permitir confirmar o e-mail e direcionar ao login.
- [ ] Preservar o token de sessão em cookie HttpOnly.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Consulta de CNPJ | O fluxo inicial usa os dados obrigatórios do endpoint de cadastro; a etapa de consulta não é necessária para enviar o contrato atual. |
| Recuperação de senha | Não há contrato de backend. |
| Persistência parcial do formulário | Não há contrato nem requisito para salvar rascunho. |
| Links para módulos futuros | Não existem funcionalidades correspondentes na aplicação. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Valores de categoria | Exibir as sete categorias do enum do backend: 10–15 e 99. | O OpenAPI expõe apenas `categoryId` numérico; os valores foram confirmados no enum do backend. | y |
| Regime tributário | Exibir `SimplesNacional`, `LucroPresumido` e `LucroReal`. | O backend faz parse desses nomes, embora o OpenAPI os exponha como string. | y |
| Token de confirmação | Guardar em memória do cliente somente após o `201` e ler o header `X-Development-Verification-Token`. | O header é o contrato Development/Test documentado; ele não entra em URL, storage ou logs. | y |
| Conflito | Mostrar mensagem própria para HTTP 409, se retornado; tratar 422 documentado como erro de validação. | O OpenAPI atual não lista 409 para cadastro, mas o escopo pede tratamento de conflito. | y |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Criar o primeiro negócio ⭐ MVP

**User Story**: As a pessoa responsável, I want cadastrar o negócio e o administrador so that posso iniciar o acesso à plataforma.

**Why P1**: É a porta de entrada do produto.

**Acceptance Criteria**:

1. WHEN a pessoa envia dados válidos THEN the frontend SHALL enviar `POST /api/v1/tenants` com todos os campos obrigatórios do `RegisterTenantRequest` e um `Idempotency-Key` não vazio. <!-- event-driven -->
2. IF a senha tiver menos de 12 caracteres, não incluir maiúscula, minúscula, número e caractere especial THEN the frontend SHALL impedir o envio e associar uma mensagem acessível ao campo. <!-- unwanted-behavior -->
3. WHILE o cadastro estiver em envio THEN the frontend SHALL desabilitar o comando de conclusão e indicar carregamento. <!-- state-driven -->
4. IF o backend responder 400 ou 422 THEN the frontend SHALL exibir a mensagem segura do Problem Details sem limpar os valores não sensíveis do formulário. <!-- unwanted-behavior -->
5. IF o backend responder 409 THEN the frontend SHALL informar que já existe um cadastro conflitante e permitir corrigir os dados. <!-- unwanted-behavior -->
6. IF a rede falhar ou o backend responder 5xx THEN the frontend SHALL informar indisponibilidade sem expor detalhes internos. <!-- unwanted-behavior -->

**Independent Test**: Preencher e enviar o formulário simulado, confirmando payload, idempotência e cada estado de erro.

### P1: Confirmar e-mail do administrador ⭐ MVP

**User Story**: As a pessoa recém-cadastrada, I want confirmar meu e-mail so that possa entrar na plataforma.

**Why P1**: O backend bloqueia a criação da sessão antes da confirmação.

**Acceptance Criteria**:

1. WHEN o cadastro retornar 201 com `X-Development-Verification-Token` THEN the frontend SHALL apresentar a etapa de confirmação sem colocar o token em URL, storage persistente ou logs. <!-- event-driven -->
2. WHEN a pessoa confirmar o e-mail THEN the frontend SHALL enviar `POST /api/v1/auth/email-verifications` com o token em JSON e redirecionar para `/login` após 204. <!-- event-driven -->
3. IF a confirmação falhar THEN the frontend SHALL mostrar uma mensagem segura e manter a pessoa na etapa de confirmação. <!-- unwanted-behavior -->

**Independent Test**: Simular o header de token, confirmar e verificar redirecionamento ao login.

### P1: Navegar entre acesso e cadastro ⭐ MVP

**User Story**: As a pessoa sem conta, I want encontrar o cadastro a partir do login so that possa iniciar o onboarding.

**Why P1**: Sem o link, o fluxo público fica inacessível.

**Acceptance Criteria**:

1. WHEN a pessoa visualizar `/login` THEN the frontend SHALL oferecer um link para `/cadastro`. <!-- event-driven -->
2. The frontend SHALL not render links to funcionalidades ainda indisponíveis. <!-- ubiquitous -->

**Independent Test**: Renderizar login e verificar o link de cadastro.

## Edge Cases

- IF o header de token de desenvolvimento estiver ausente após 201 THEN the frontend SHALL mostrar que a confirmação não pode continuar naquele ambiente e não inventar um token.
- IF uma resposta de sucesso tiver corpo inválido THEN the frontend SHALL mostrar um erro seguro e não avançar de etapa.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| ONBOARD-01 | P1: Criar o primeiro negócio | Execute | Implemented |
| ONBOARD-02 | P1: Criar o primeiro negócio | Execute | Implemented |
| ONBOARD-03 | P1: Confirmar e-mail | Execute | Implemented |
| ONBOARD-04 | P1: Navegar entre acesso e cadastro | Execute | Implemented |

**Coverage:** 4 total, 0 mapped to tasks, 4 unmapped ⚠️

## Success Criteria

- [ ] O fluxo de cadastro e confirmação pode ser demonstrado com o OpenAPI ativo.
- [ ] Testes, typecheck, lint e build passam.
