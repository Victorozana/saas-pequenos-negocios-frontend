# Dashboard Executivo e Métricas Design

## Decisions

1. **Route Handlers (BFF)**:
   - `GET /api/dashboard/summary`: Chama o backend `GET /api/v1/dashboard/summary` com o token da sessão e valida a estrutura da resposta em runtime (`totalReceivedAmount`, `totalReceivableAmount`, `pendingWorkOrdersCount`, `conversionMetrics`).
   - `GET /api/dashboard/report`: Chama o backend `GET /api/v1/dashboard/report` e repassa o stream `text/csv` com cabeçalho `Content-Disposition`.

2. **Componentes UI**:
   - `<DashboardMetrics />`: Componente cliente que busca o resumo via BFF, exibe o esqueleto durante o carregamento, renderiza 4 cards estilizados em grid (Faturamento Recebido, A Receber, OS Pendentes, Taxa de Conversão) e contém a ação de download do relatório CSV.
   - Integrado em `src/app/dashboard/page.tsx` junto com `<AgendaToday />`.

3. **Validação de Entrada e Formatação**:
   - Formatação numérica/monetária com `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.
   - Formatação percentual com `Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1 })` ou exibição amigável `XX.X%`.

4. **Tratamento de Falhas**:
   - Respostas de erro do backend (400, 500, etc) ou falhas de rede viram HTTP 503 com mensagem amigável no BFF.
   - Rejeição de autenticação (401/403) redireciona para `/login`.
