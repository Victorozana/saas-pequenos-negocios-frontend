# Autenticação e sessão — validação

**Veredito**: FAIL
**Data**: 2026-08-11
**Spec**: `.specs/features/auth-session/spec.md`
**Diff range**: `05a8833^..5b41538`
**Verifier**: subagente independente (autor != verifier)

## Resultado executivo

Os quatro gates declarados pelo orquestrador passaram e o sensor matou 6/6 mutações críticas. A feature ainda não pode ser marcada como verificada: três critérios possuem cobertura parcial, `AUTH-007` contradiz o fallback de desenvolvimento definido no design, `tasks.md` não declara os comandos obrigatórios de gate e `git diff --check` falha em 20 arquivos.

## Conclusão das tarefas

| Tarefa | Estado verificado | Evidência / observação |
| --- | --- | --- |
| T01 | PASS | O contrato contém `CreateSessionRequest`, `SessionResponse` e `UserProfileResponse` em `src/lib/api/generated/schema.d.ts:826`, `src/lib/api/generated/schema.d.ts:994` e `src/lib/api/generated/schema.d.ts:1055`. |
| T02 | PARCIAL | Adaptador, Bearer e permissões estão implementados, mas os testes de erro cobrem apenas 401; faltam 400, 403 e indisponibilidade. |
| T03 | PARCIAL | Login, sessão e expiração do cookie têm testes. A rejeição da sessão não testa a remoção do cookie pela rota. |
| T04 | PARCIAL | O proxy anônimo e o resolvedor de token rejeitado têm testes separados; falta provar que o dashboard redireciona quando a validação autoritativa falha. |
| T05 | PARCIAL | Login e navegação por permissões têm testes. O redirecionamento do botão de logout não tem teste. |

## Critérios de aceite ancorados na spec

| Critério | Resultado definido pela spec | Evidência `file:line` + asserção | Resultado |
| --- | --- | --- | --- |
| Login bem-sucedido cria cookie HttpOnly e redireciona para `/dashboard` | Cookie inacessível a JavaScript; destino exato `/dashboard` | `src/app/api/auth/login/route.test.ts:20` — `expect(response.status).toBe(200)`; `src/app/api/auth/login/route.test.ts:22` — `expect(set-cookie).toContain("agendamento_session=private-token")`; `src/app/api/auth/login/route.test.ts:25` — `expect(set-cookie).toContain("HttpOnly")`; `src/components/auth/login-form.test.tsx:36` — `expect(replace).toHaveBeenCalledWith("/dashboard")` | PASS |
| Nenhuma resposta BFF contém `accessToken` | Corpo de login e sessão não contém o token | `src/app/api/auth/login/route.test.ts:21` — `expect(response.json()).resolves.toEqual({ authenticated: true })`; `src/app/api/auth/login/route.test.ts:26` — `expect(body).not.toContain("private-token")`; `src/app/api/auth/session/route.test.ts:34` — `expect(response.json()).resolves.toEqual({ user: profile })`; `src/app/api/auth/session/route.test.ts:35` — `expect(body).not.toContain("private-token")` | PASS |
| Login recusado exibe mensagem coerente com status/título | Distinção entre dados inválidos, credenciais inválidas, e-mail não confirmado e indisponibilidade | `src/lib/auth/backend.test.ts:81` — valida somente status 401 e mensagem `E-mail ou senha incorretos.`; `src/components/auth/login-form.test.tsx:60` — valida somente a exibição dessa mensagem 401 | GAP: faltam 400, 403 e 503 |
| Acesso anônimo a `/dashboard` redireciona para `/login` | Status 307 e localização com destino preservado | `src/proxy.test.ts:12` — `expect(response.status).toBe(307)`; `src/proxy.test.ts:13` — `expect(location).toBe("https://app.example.com/login?next=%2Fdashboard%2Fagenda")` | PASS |
| Token rejeitado impede renderização do dashboard | Sessão vira ausente e a página redireciona para `/login` | `src/lib/auth/server-session.test.ts:37` — `expect(resolveSessionUser(...)).resolves.toBeNull()`; a decisão de redirecionar existe em `src/app/dashboard/page.tsx:38`, mas não há asserção de teste sobre a página | GAP: integração não comprovada |
| Logout expira cookie e redireciona para `/login` | `Max-Age=0`, HttpOnly e destino `/login` | `src/app/api/auth/logout/route.test.ts:10` — status 200; `src/app/api/auth/logout/route.test.ts:12` — contém `Max-Age=0`; `src/app/api/auth/logout/route.test.ts:13` — contém `HttpOnly`; o redirecionamento existe em `src/components/auth/logout-button.tsx:16`, mas não tem teste | GAP: redirecionamento não comprovado |
| Permissões controlam módulos disponíveis | Módulos autorizados aparecem como indisponíveis sem link; módulo sem permissão não aparece | `src/components/app/app-shell.test.tsx:31` — dashboard aponta para `/dashboard`; `src/components/app/app-shell.test.tsx:33` e `:34` — Clientes e Agenda aparecem; `src/components/app/app-shell.test.tsx:35` — Financeiro não aparece; `src/components/app/app-shell.test.tsx:36` — dois rótulos `Em breve` | PASS |
| Testes, tipos, lint e build passam | Todos os comandos encerram com código 0 | Execução desta validação: 27/27 testes; `npm run typecheck`, `npm run lint` e `npm run build` passaram | PASS |

**Cobertura estrita**: 5/8 critérios completamente comprovados; 3/8 possuem gaps de teste. Não há critério vago sem resultado observável, mas há uma contradição de requisito em `AUTH-007`.

## Auditoria dos requisitos

| Requisito | Resultado | Evidência / gap |
| --- | --- | --- |
| AUTH-001 | PASS | Endpoint e payload exatos em `src/lib/auth/backend.test.ts:55`; cookie e redirecionamento em `src/app/api/auth/login/route.test.ts:22` e `src/components/auth/login-form.test.tsx:36`. |
| AUTH-002 | FAIL | A implementação mapeia 400/401/403 em `src/lib/auth/backend.ts:37`, mas os testes exercitam somente 401 em `src/lib/auth/backend.test.ts:67`. Indisponibilidade também não é testada. |
| AUTH-003 | PASS | Perfil completo comparado em `src/lib/auth/backend.test.ts:90`; header exato `Bearer signed-token` em `src/lib/auth/backend.test.ts:98`; rota BFF devolve somente `{ user: profile }` em `src/app/api/auth/session/route.test.ts:34`. |
| AUTH-004 | FAIL | Proxy anônimo está coberto em `src/proxy.test.ts:12`; token rejeitado vira `null` em `src/lib/auth/server-session.test.ts:37`; falta teste do redirecionamento autoritativo da página. |
| AUTH-005 | FAIL | Expiração segue `expiresAt` em `src/lib/auth/session-cookie.test.ts:16`; a rota de logout expira o cookie em `src/app/api/auth/logout/route.test.ts:12`; falta teste do redirecionamento client-side. |
| AUTH-006 | PASS | Filtro explícito por permissões comprovado em `src/components/app/app-shell.test.tsx:30`. |
| AUTH-007 | SPEC/DESIGN CONFLICT | A spec exige rejeitar configuração ausente em `.specs/features/auth-session/spec.md:41`; o design define fallback local em `.specs/features/auth-session/design.md:21` e o teste exige esse fallback em `src/lib/auth/backend.test.ts:29`. É preciso decidir e alinhar a fonte de verdade. Protocolo inválido e flags do cookie estão cobertos em `src/lib/api/client.test.ts:18` e `src/lib/auth/session-cookie.test.ts:16`. |

## Gates

| Comando | Resultado |
| --- | --- |
| `npm test` | PASS: 11 arquivos, 27 testes, 0 falhas, 0 ignorados |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS: Next.js 16.2.11, 9 páginas geradas |
| `git diff --check 05a8833^..HEAD` | FAIL: `new blank line at EOF` em 20 arquivos |

Contagem antes da feature: 3 testes. Contagem depois: 27. Delta: +24. Nenhum teste foi removido ou ignorado.

`tasks.md` não possui a seção obrigatória `Gate Check Commands`; os quatro comandos acima vieram da solicitação do orquestrador e dos scripts de `package.json:6`.

## Sensor de discriminação

**Profundidade**: P0 manual expandido. As seis mutações foram aplicadas em worktree descartável. O baseline do workspace real estava limpo antes do sensor e voltou ao mesmo estado após a remoção do worktree.

| # | Mutação | Teste que matou a mutação | Resultado |
| --- | --- | --- | --- |
| 1 | `httpOnly: true` → `false` em `src/lib/auth/session-cookie.ts:5` | `src/lib/auth/session-cookie.test.ts:16` rejeitou o objeto | KILLED |
| 2 | Inclusão de `accessToken` no JSON de login em `src/app/api/auth/login/route.ts:37` | `src/app/api/auth/login/route.test.ts:21` rejeitou o corpo extra | KILLED |
| 3 | `Bearer` → `Basic` em `src/lib/auth/backend.ts:143` | `src/lib/auth/backend.test.ts:94` rejeitou o header | KILLED |
| 4 | Remoção de 401 da lista de sessão rejeitada em `src/lib/auth/server-session.ts:23` | `src/lib/auth/server-session.test.ts:37` recebeu rejeição em vez de `null` | KILLED |
| 5 | Remoção do filtro de permissões em `src/components/app/app-shell.tsx:43` | `src/components/app/app-shell.test.tsx:35` encontrou Financeiro indevidamente | KILLED |
| 6 | Redirecionamento pós-login `/dashboard` → `/login` em `src/components/auth/login-form.tsx:44` | `src/components/auth/login-form.test.tsx:36` rejeitou o destino | KILLED |

**Score**: 6/6 mortos, 0 sobreviventes. O worktree temporário e o junction de dependências foram removidos. Nenhum processo foi iniciado.

## Qualidade

| Verificação | Resultado |
| --- | --- |
| Escopo cirúrgico e sem funcionalidade fora da spec | PASS |
| Token permanece fora das respostas BFF | PASS |
| Asserções de payload validam valores, não apenas chamadas | PASS |
| Cobertura por camada para happy, edge e error paths | FAIL: faltam erros 400/403/503, dashboard autoritativo e logout client-side |
| Todo teste em escopo mapeia para requisito/critério | PASS |
| Padrões do projeto seguidos | PASS: `AGENTS.md` e `coding-principles.md` |
| Integridade de whitespace do diff | FAIL: 20 avisos `new blank line at EOF` |

UAT visual interativo não foi executado por este Verifier. A auditoria foi automatizada e baseada na spec.

## Gaps priorizados

1. **Major — AUTH-004**: adicionar teste da página protegida comprovando `redirect("/login")` quando o backend rejeita o token.
2. **Major — AUTH-005**: adicionar teste de `LogoutButton` comprovando POST, `router.replace("/login")` e refresh.
3. **Major — AUTH-002**: adicionar casos de 400, 403 e indisponibilidade, com mensagens exatas e seguras no adaptador/BFF/formulário conforme a camada.
4. **Major — AUTH-007**: decidir se ausência de `API_BASE_URL` é rejeitada sempre ou somente em produção; alinhar spec, design e teste.
5. **Minor — processo**: incluir `Gate Check Commands` em `tasks.md`.
6. **Minor — qualidade**: remover linhas vazias excedentes no EOF dos 20 arquivos apontados por `git diff --check`.

## Resumo

**Overall**: NOT READY

O comportamento principal está implementado e os testes existentes discriminam falhas críticas. O veredito permanece FAIL por cobertura incompleta de três critérios, uma contradição entre spec e design e dois gaps estruturais. O validador `validate_state.py` não pode produzir PASS enquanto estes gaps existirem. Nenhuma lesson foi gravada porque a tarefa autorizou escrever somente este relatório.

O comando de `validate_state.py` também não pôde executar: `python3.exe` é apenas o alias da Microsoft Store e não há runtime Python instalado. A checagem manual confirmou que o relatório existe, declara FAIL e contém evidências `file:line`.
