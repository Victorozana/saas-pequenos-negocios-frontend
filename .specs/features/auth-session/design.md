# Design — autenticação e sessão

## Fluxo

1. A tela `/login` envia credenciais para `/api/auth/login` no mesmo domínio.
2. O Route Handler chama o backend e grava apenas o JWT em cookie `HttpOnly`.
3. O `proxy.ts` faz a checagem otimista da existência do cookie no acesso ao dashboard.
4. O Server Component do dashboard valida a sessão consultando `/api/v1/users/me` antes de renderizar dados protegidos.
5. `/api/auth/logout` remove o cookie local.

## Limites de confiança

- O navegador conhece o perfil, mas nunca o token.
- A presença do cookie no proxy não é autorização; a confirmação ocorre no backend.
- A lista `permissions` devolvida pelo backend é a fonte de verdade para a UI.
- O papel (`role`) é exibido, mas não substitui permissões explícitas.

## Configuração

`API_BASE_URL` é uma variável somente do servidor. Em desenvolvimento, o fallback documentado é `http://localhost:5050`; produção deve configurar explicitamente o endereço da API.

