# Autenticação e sessão — validação

**Veredito**: PASS
**Data**: 2026-08-13
**Spec**: `.specs/features/auth-session/spec.md`
**Diff range**: frontend `05a8833^..84a8322`; backend `778c4b4..1517ebf`
**Verifier**: subagente independente (autor != verifier)

## Resultado executivo

Os oito critérios de aceite possuem evidência ancorada no resultado definido pela spec. O gate completo do frontend passou com 77/77 testes. Os gates focais do backend passaram com 6/6 testes. O sensor P0 matou 6/6 mutações críticas em worktrees descartáveis. As árvores reais permaneceram no baseline anterior ao sensor.

## Conclusão das tarefas

| Tarefa | Estado verificado | Evidência |
| --- | --- | --- |
| T1 | PASS | Contrato gerado contém sessão, perfil e respostas de erro atualizadas em `src/lib/api/generated/schema.d.ts:179`. |
| T2 | PASS | Adaptador cobre configuração, 400, 401, 403, 503, sucesso malformado e perfil Bearer em `src/lib/auth/backend.test.ts:26`. |
| T3 | PASS | BFF mantém token fora do JSON e controla cookie em `src/app/api/auth/login/route.test.ts:20` e `src/app/api/auth/session/route.test.ts:33`. |
| T4 | PASS | Proxy e página comprovam proteção otimista e autoritativa em `src/proxy.test.ts:12` e `src/app/dashboard/page.test.tsx:26`. |
| T5 | PASS | Login, logout e navegação por permissões possuem asserções de destino e estado em `src/components/auth/logout-button.test.tsx:31` e `src/components/app/app-shell.test.tsx:30`. |
| T6 | PASS | Esta validação matou 6/6 mutações; o gate determinístico foi executado após gravar o relatório. |

## Critérios de aceite ancorados na spec

| Critério | Resultado definido pela spec | Evidência `file:line` + asserção | Resultado |
| --- | --- | --- | --- |
| Login bem-sucedido cria cookie HttpOnly e redireciona para `/dashboard` | Cookie `HttpOnly`; destino exato `/dashboard` | `src/app/api/auth/login/route.test.ts:22` — `expect(set-cookie).toContain("agendamento_session=private-token")`; `src/app/api/auth/login/route.test.ts:25` — contém `HttpOnly`; `src/components/auth/login-form.test.tsx:36` — `expect(replace).toHaveBeenCalledWith("/dashboard")` | PASS |
| Nenhuma resposta BFF contém `accessToken` | Login e sessão devolvem somente estado/perfil | `src/app/api/auth/login/route.test.ts:21` — corpo igual a `{ authenticated: true }`; `src/app/api/auth/login/route.test.ts:26` — corpo não contém token; `src/app/api/auth/session/route.test.ts:34` — corpo igual a `{ user: profile }`; `src/app/api/auth/session/route.test.ts:35` — corpo não contém token | PASS |
| Login recusado exibe mensagem coerente com o backend | 400, 401, 403 e indisponibilidade permanecem distintos e seguros | `src/lib/auth/backend.test.ts:75` — 401 rejeita com mensagem segura; `src/lib/auth/backend.test.ts:95` — tabela exige mensagens exatas para 400 e 403; `src/lib/auth/backend.test.ts:109` — falha de rede rejeita com status 503 | PASS |
| Acesso anônimo ao dashboard redireciona para login | 307 e localização preserva o destino | `src/proxy.test.ts:12` — status igual a 307; `src/proxy.test.ts:13` — localização igual a `/login?next=%2Fdashboard%2Fagenda` | PASS |
| Token rejeitado impede renderização do dashboard | Validação autoritativa ausente redireciona para `/login` | `src/app/dashboard/page.test.tsx:26` — página rejeita com `redirect:/login`; `src/app/dashboard/page.test.tsx:27` — `redirect` chamado com `/login`; `src/app/api/auth/session/route.test.ts:45` — sessão rejeitada retorna 401 e expira cookie em `:46` | PASS |
| Logout expira cookie e redireciona para login | `Max-Age=0`, cookie seguro e destino `/login` | `src/app/api/auth/logout/route.test.ts:12` — cookie contém `Max-Age=0`; `src/app/api/auth/logout/route.test.ts:13` — contém `HttpOnly`; `src/components/auth/logout-button.test.tsx:31` — POST exato; `:34` — replace para `/login`; `:35` — refresh uma vez | PASS |
| Permissões controlam módulos | Módulo autorizado aparece; não autorizado não aparece; indisponíveis não viram links | `src/components/app/app-shell.test.tsx:30` — Dashboard é link; `:33` e `:34` — Clientes e Agenda aparecem; `:35` — Financeiro ausente; `:36` — dois rótulos `Em breve` | PASS |
| Testes, tipos, lint e build passam | Todos os gates encerram com zero | Gate desta validação: 21 arquivos e 77 testes; typecheck, lint e build Next.js 16.2.11 passaram | PASS |

**Cobertura estrita**: 8/8 critérios comprovados; 0 gaps de precisão.

## Requisitos e integração backend

| Requisito | Resultado | Evidência |
| --- | --- | --- |
| AUTH-001 | PASS | Endpoint e payload exatos em `src/lib/auth/backend.test.ts:55`; cookie e destino nos testes BFF/UI citados acima. |
| AUTH-002 | PASS | 400/401/403/503 cobertos; conta ainda inativa e não verificada retorna 403 em `tests/Agendamento.IntegrationTests/Identity/SessionEndpointTests.cs:24`. |
| AUTH-003 | PASS | Perfil integrado contém id, email, name, role, tenantId, todas as permissões e status em `tests/Agendamento.IntegrationTests/Tenants/TenantOnboardingFlowTests.cs:116`. |
| AUTH-004 | PASS | Proxy e página protegida cobrem ambos os limites. |
| AUTH-005 | PASS | Cookie segue `expiresAt` em `src/lib/auth/session-cookie.test.ts:16`; logout expira e redireciona. |
| AUTH-006 | PASS | `owner_admin` recebe todas as permissões e `HasPermission` responde verdadeiro em `tests/Agendamento.UnitTests/Tenants/TenantPersistenceTests.cs:75`. |
| AUTH-007 | PASS | Produção exige URL em `src/lib/auth/backend.test.ts:26`; Development usa fallback em `:33`; protocolo inválido é rejeitado em `src/lib/api/client.test.ts:19`; opções de cookie são verificadas em `src/lib/auth/session-cookie.test.ts:16`. |

## Sensor de discriminação

**Profundidade**: P0 manual expandido.

| # | Mutação | Teste discriminante | Resultado |
| --- | --- | --- | --- |
| 1 | Inverteu a prioridade entre conta não verificada e inativa no handler backend | `SessionEndpointTests.cs:24` recebeu 401 no lugar de 403 | KILLED |
| 2 | Converteu respostas HTTP 400/401/403 em sessão de sucesso no adaptador | `backend.test.ts:75` e `:95` tiveram 3 falhas em 9 testes | KILLED |
| 3 | Removeu `owner_admin` dos papéis administrativos | `TenantPersistenceTests.cs:75` detectou permissões vazias | KILLED |
| 4 | Removeu o redirecionamento autoritativo da página protegida | `page.test.tsx:26` detectou resolução nula em vez de redirect | KILLED |
| 5 | Alterou `HttpOnly` de `true` para `false` | `session-cookie.test.ts:16` detectou a flag incorreta | KILLED |
| 6 | Removeu o filtro visual por permissões | `app-shell.test.tsx:35` detectou Financeiro indevidamente visível | KILLED |

**Resultado**: 6/6 mortos, 0 sobreviventes — PASS.

As mutações foram aplicadas somente em `auth-session-front-verify-20260813` e `auth-session-back-verify-20260813`. Ambos os worktrees e o junction de dependências foram removidos. O frontend real permaneceu limpo. O backend real permaneceu exatamente com as três alterações preexistentes em `.spec/verification/sinais.json` e `src/Agendamento.Api/obj/Debug/net10.0/Agendamento.Api.AssemblyInfo*`.

## Gates

| Comando | Resultado |
| --- | --- |
| `npm run test` | PASS: 21 arquivos, 77 testes, 0 falhas, 0 ignorados |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS: Next.js 16.2.11, 13 páginas |
| Backend `SessionEndpointTests` | PASS: 2/2 |
| Backend `TenantOnboardingFlowTests` | PASS: 1/1 |
| Backend `TenantPersistenceTests` | PASS: 3/3 |

Não houve redução de testes nem testes ignorados. A tentativa inicial de paralelizar dois comandos do mesmo projeto de integração disputou `MvcTestingAppManifest.json`; a execução válida foi repetida sequencialmente e passou. No scratch backend, `-p:NuGetAudit=false` foi usado somente para evitar que uma atualização externa do advisory de SSH.NET impedisse a compilação do mutante.

## Qualidade

| Verificação | Resultado |
| --- | --- |
| Escopo cirúrgico e sem funcionalidade fora da spec | PASS |
| Token ausente das respostas BFF | PASS |
| Payloads e estados verificados por valor | PASS |
| Rotas cobrem sucesso, ausência, rejeição e indisponibilidade | PASS |
| Cobertura ancorada em resultados precisos da spec | PASS |
| Padrões seguidos | PASS: `AGENTS.md` de ambos os repositórios e `coding-principles.md` |
| Isolamento do sensor | PASS |

UAT visual interativo não foi necessário para este gate: os comportamentos observáveis de login, logout, proteção e permissões possuem testes automatizados determinísticos.

## Resumo

**Overall**: READY

**Spec-anchored check**: 8/8 critérios correspondem ao resultado definido pela spec.
**Sensor**: 6/6 mutações mortas.
**Gate**: frontend 77/77 e backend focal 6/6.
**Issues found**: nenhum gap funcional ou de cobertura no escopo de autenticação e sessão.
**Next step**: o orquestrador pode marcar T6 e a rastreabilidade como verificadas no commit atômico de fechamento.
