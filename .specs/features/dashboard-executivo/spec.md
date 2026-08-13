# Dashboard Executivo e Métricas Specification

## Problem Statement

O `/dashboard` exibe a agenda do dia, mas não apresenta as métricas consolidadas do negócio (faturamento recebido, valores a receber, ordens de serviço pendentes, taxa de conversão de orçamentos e exportação de relatórios), impedindo o gestor de ter visibilidade executiva completa.

## Goals

- Exibir no `/dashboard` os cards de métricas executivas (Faturamento Recebido, A Receber, Ordens de Serviço Pendentes e Taxa de Conversão).
- Permitir o download do relatório de desempenho em formato CSV.
- Manter as consultas e downloads autenticados via BFFs protegidos por cookie de sessão.
- Tratar falhas de forma amigável e segura, sem expor detalhes de rede ou infraestrutura.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Filtros personalizados de data na UI | O MVP utiliza os períodos padrões do backend para o dashboard inicial. |
| Edição de métricas | O dashboard é exclusivamente de leitura/resumo. |

## User Stories

### P1: Visualizar métricas executivas do negócio ⭐ MVP

**User Story**: Como gestor autenticado, quero visualizar no dashboard as métricas de faturamento, ordens de serviço pendentes e conversão de orçamentos para acompanhar o desempenho da empresa.

**Acceptance Criteria**:

1. WHEN an authenticated user visits `/dashboard` THEN the system SHALL request summary metrics via `GET /api/dashboard/summary` and render cards for Faturamento Recebido (R$), A Receber (R$), Ordens de Serviço Pendentes, and Taxa de Conversão de Orçamentos (%). <!-- DASH-001 -->
2. WHILE the metrics request is pending THEN the system SHALL render accessible loading skeletons for the metrics cards. <!-- DASH-002 -->
3. WHEN the summary metrics are loaded THEN the system SHALL format monetary values in BRL (`pt-BR`) and percentages with appropriate precision. <!-- DASH-003 -->
4. WHEN the user clicks "Exportar relatório" THEN the system SHALL request the CSV report via `GET /api/dashboard/report` and trigger a file download named `relatorio-desempenho.csv`. <!-- DASH-004 -->
5. IF the summary or report request fails THEN the system SHALL render the safe message `Não foi possível carregar as métricas agora. Tente novamente.` without internal details. <!-- DASH-005 -->
6. IF the session cookie is missing or the backend returns 401/403 THEN the system SHALL expire the session cookie and redirect to `/login`. <!-- DASH-006 -->

## Success Criteria

- O gestor visualiza os 4 cards de métricas executivas e a taxa de conversão no `/dashboard`.
- O botão de exportação baixa o arquivo CSV gerado pelo backend.
- Todas as rotas do BFF e componentes possuem testes automatizados cobrindo sucesso, erros e expiração de sessão.
