# Especificação — autenticação e sessão

## Objetivo

Entregar a base autenticada do SaaS usando os contratos reais do backend, sem expor o JWT ao JavaScript do navegador e preparando a navegação para permissões granulares.

## Requisitos

### AUTH-001 — Login

Quando uma pessoa enviar e-mail e senha válidos, o frontend deve criar a sessão em `POST /api/v1/auth/sessions`, armazenar o token somente em cookie `HttpOnly` e encaminhá-la ao dashboard.

### AUTH-002 — Erros de acesso

Se o backend recusar o login, o frontend deve apresentar uma mensagem segura e útil, preservando a distinção entre credenciais inválidas, e-mail não confirmado, dados inválidos e indisponibilidade do serviço.

### AUTH-003 — Sessão atual

Enquanto houver um cookie de sessão válido, o frontend deve consultar `GET /api/v1/users/me` com `Authorization: Bearer`, disponibilizando `id`, `name`, `email`, `role`, `tenantId`, `permissions` e `status` sem devolver o token ao navegador.

### AUTH-004 — Proteção de rota

Se uma requisição ao dashboard não tiver cookie de sessão, o frontend deve redirecioná-la para `/login`. Se o cookie existir mas o backend o rejeitar, a renderização do dashboard também deve redirecionar para `/login`.

### AUTH-005 — Expiração e logout

O cookie deve expirar no instante `expiresAt` informado pelo backend. Quando a pessoa sair, o frontend deve remover o cookie local e retornar à tela de login.

### AUTH-006 — Permissões

Quando o perfil autenticado for carregado, a navegação deve habilitar apenas módulos cuja permissão de leitura correspondente esteja presente. Itens ainda não implementados devem permanecer identificados como indisponíveis, sem links quebrados.

### AUTH-007 — Segurança operacional

Em produção, o frontend deve rejeitar configuração de API ausente. Em qualquer ambiente, deve rejeitar protocolo diferente de HTTP/HTTPS. Em desenvolvimento, pode usar o fallback documentado `http://localhost:5050`. O cookie deve usar `SameSite=Lax`, `HttpOnly`, escopo `/` e `Secure` em produção.

## Fora do escopo

- Renovação silenciosa de sessão: o backend ainda não oferece refresh token.
- Revogação servidor de sessão: o backend ainda não oferece logout/revogação.
- CRUD de equipe: o contrato já está disponível, mas pertence à fase funcional de equipe.
- Recuperação de senha e login social.

## Critérios de aceite

- Login bem-sucedido cria cookie inacessível ao JavaScript e redireciona para `/dashboard`.
- Nenhuma resposta das rotas BFF contém `accessToken`.
- Login recusado exibe mensagem coerente com o status/título do backend.
- Acesso anônimo a `/dashboard` redireciona para `/login`.
- Token rejeitado em `/users/me` impede a renderização do dashboard.
- Logout expira o cookie e redireciona para `/login`.
- Permissões do perfil controlam a disponibilidade visual dos módulos.
- Testes, verificação de tipos, lint e build passam.

## Decisões confirmadas no código do backend

- Sessão: `POST /api/v1/auth/sessions` retorna `accessToken` e `expiresAt`.
- Perfil: `GET /api/v1/users/me` exige Bearer token.
- Permissões: 13 chaves em `Domain/Identity/Permissions.cs`.
- Não existem endpoints de refresh token ou logout na versão inspecionada.
