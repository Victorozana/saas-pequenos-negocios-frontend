# Consulta CNPJ no onboarding Design

## Decision

O navegador chama um Route Handler do Next. O BFF valida o CNPJ e chama o endpoint público do backend. O backend normaliza o identificador, consulta um `HttpClient` tipado para a BrasilAPI, valida a resposta e devolve somente `CompanyRegistryResult`.

```text
TenantOnboarding → GET /api/company-registry/{cnpj}
                 → GET backend /api/v1/company-registry/{cnpj}
                 → CompanyRegistryGateway → BrasilAPI
```

## Backend boundary

- `CompanyRegistryGateway` recebe `HttpClient` configurado por `CompanyRegistry:BaseUrl` e timeout.
- 404 externo vira empresa ausente; timeout, transporte, rate limit, 5xx e payload inválido viram indisponibilidade.
- O handler distingue entrada inválida, ausência, empresa inativa e dependência indisponível por exceções próprias.
- O endpoint traduz essas categorias para 400, 404, 422 e 503 com títulos fixos.
- O OpenAPI declara `CompanyRegistryResult`, respostas ProblemDetails e rate limit 429.

## Frontend boundary

- O adaptador chama somente o backend configurado e valida a resposta em runtime.
- O Route Handler nunca repassa detalhes desconhecidos do backend.
- A UI mantém os valores em estado controlado para que preenchimento, edição e navegação entre etapas sejam determinísticos.
- O primeiro CNAE retornado preenche `primaryCnae`; todos permanecem disponíveis no contrato, sem criar novos campos de cadastro.

## Authentication boundary

O matcher do proxy cobre `/dashboard`, `/clientes`, `/servicos`, `/orcamentos` e `/agenda`, incluindo caminhos aninhados. A validação autoritativa permanece responsabilidade das páginas e BFFs autenticados.

## Failure behavior

| Condition | Backend | BFF/UI |
| --- | --- | --- |
| CNPJ inválido | 400 | `CNPJ inválido.` |
| Não encontrado | 404 | `Empresa não encontrada.` |
| Inativo | 422 | `A empresa não está ativa.` |
| Dependência indisponível/inválida | 503 | `Não foi possível consultar o CNPJ agora.` |

Nenhuma falha inclui URL do provedor, corpo bruto, stack trace ou detalhe de rede.
