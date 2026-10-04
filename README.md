# Nexo Local — Frontend

Interface web do Nexo Local, um sistema de gestão voltado a pequenos negócios locais. O projeto permite acompanhar clientes, serviços, agenda, orçamentos, ordens de serviço e indicadores do dia.

## Tecnologias

- Next.js 16, React 19 e TypeScript
- Tailwind CSS e componentes Shadcn UI
- Vitest e Testing Library
- Integração tipada com a API via OpenAPI

## Pré-requisitos

- Node.js 20 ou superior
- npm
- Backend do projeto em execução — por padrão, em `http://localhost:5050`

## Como executar

1. Instale as dependências:

   ```powershell
   npm install
   ```

2. Crie sua configuração local a partir do exemplo:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Inicie o ambiente de desenvolvimento:

   ```powershell
   npm run dev
   ```

4. Acesse [http://localhost:3000](http://localhost:3000). A página inicial direciona para `/login`.

Caso a API esteja em outro endereço, ajuste `API_BASE_URL` em `.env.local`. Essa variável é lida somente no servidor Next.js; não use o prefixo `NEXT_PUBLIC_`. Não versione arquivos `.env.local`.

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o ambiente de desenvolvimento. |
| `npm run build` | Gera a versão de produção. |
| `npm run start` | Executa a versão de produção após o build. |
| `npm run lint` | Executa a verificação de estilo. |
| `npm run typecheck` | Valida os tipos TypeScript. |
| `npm run test` | Executa os testes automatizados. |
| `npm run generate:api` | Atualiza os tipos da API a partir do OpenAPI local. |

## Atualização do contrato da API

Com o backend em execução na porta 5050, execute:

```powershell
npm run generate:api
```

O resultado é salvo em `src/lib/api/generated/schema.d.ts`. Sempre que o contrato do backend mudar, regenere esse arquivo antes de desenvolver a integração correspondente.

## Autenticação

O token de acesso é mantido em cookie `HttpOnly` pelo servidor. No estado atual da API, não há refresh token: quando a sessão expira, é necessário entrar novamente.

## Verificação antes de contribuir

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

## Repositório relacionado

O backend canônico está em `C:\\Users\\victo\\OneDrive\\Documentos\\projetos\\agendamento` e é a fonte de verdade para o contrato HTTP usado por esta aplicação.
