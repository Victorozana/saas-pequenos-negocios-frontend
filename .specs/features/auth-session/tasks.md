# Tarefas — autenticação e sessão

- [x] T01 Atualizar e validar o contrato OpenAPI gerado a partir do backend atual.
- [x] T02 Implementar adaptador autenticado do backend, erros e permissões com testes.
- [x] T03 Implementar rotas BFF de login, sessão e logout com cookie seguro e testes.
- [x] T04 Implementar proteção otimista por proxy e validação autoritativa no dashboard com testes.
- [ ] T05 Implementar telas responsivas de login/dashboard e validar test, typecheck, lint e build.

## Matriz de rastreabilidade

| Requisito | Tarefa | Evidência esperada |
| --- | --- | --- |
| AUTH-001, AUTH-002 | T02, T03, T05 | testes do adaptador, rotas e formulário |
| AUTH-003 | T02, T03, T04 | teste Bearer e sessão sem token na resposta |
| AUTH-004 | T04 | testes de proxy e carregamento protegido |
| AUTH-005 | T03, T05 | testes das opções/remoção do cookie |
| AUTH-006 | T02, T05 | testes de permissões e navegação |
| AUTH-007 | T02, T03 | testes de configuração e cookie |
