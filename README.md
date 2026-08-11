# Nexo Local — frontend

Frontend do SaaS de gestão para pequenos negócios locais, construído com Next.js, TypeScript, Tailwind CSS e Shadcn UI.

## Executar localmente

Pré-requisitos: Node.js e o backend disponível em `http://localhost:5050`.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). A raiz redireciona para `/login`.

Se o backend usar outro endereço, altere `API_BASE_URL` em `.env.local`. Essa variável fica somente no servidor Next e não deve receber o prefixo `NEXT_PUBLIC_`.

## Verificações

```powershell
npm run test
npm run typecheck
npm run lint
npm run build
```

## Contrato da API

Com o backend em execução na porta 5050, atualize os tipos gerados com:

```powershell
npm run generate:api
```

O token de acesso permanece em cookie `HttpOnly`. O backend atual não oferece refresh token; ao expirar, a pessoa precisa entrar novamente.
