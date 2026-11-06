<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Encerramento e continuidade (preferência permanente do usuário)

- Nesta máquina, o frontend é este repositório e o backend é o diretório irmão `../saas-pequenos-negocios-backend`. Os caminhos antigos abaixo são históricos.
- Ao concluir uma entrega de desenvolvimento neste projeto, executar as verificações pertinentes, revisar o diff e fazer commit e push das alterações da entrega nos repositórios afetados. O usuário autoriza esse fluxo habitual; isso substitui a exigência genérica de nova aprovação de push abaixo. Uma instrução posterior do usuário prevalece.
- Não incluir segredos, logs locais, caches ou artefatos de build no commit. Preservar alterações alheias à entrega; não usar force push, reset destrutivo ou descarte para limpar o status.
- Conferir branch, remoto e upstream antes de publicar. Após o push, confirmar que HEAD e upstream coincidem e informar branch, hash, verificações e pendências locais. Se houver falha de autenticação, conflito, teste falhando ou dúvida sobre arquivos, relatar o impedimento e o que ficou salvo; nunca afirmar que houve push sem confirmação.
- Registrar no repositório o estado funcional e o próximo passo quando houver trabalho incompleto. Não encerrar silenciosamente com trabalho existente apenas nesta máquina.

- Em entregas que toquem agenda, ordens de serviço, autorização, rotas ou PDF, execute `pwsh ./scripts/regression.ps1`. Registre os SHAs das duas aplicações e os resultados de PostgreSQL e Playwright no fechamento.

## Backend access and integration authority

- The canonical backend repository for this frontend is `C:\Users\victo\OneDrive\Documentos\projetos\agendamento`.
- Agents may inspect, start, build, test, debug, and modify that backend whenever required to plan, implement, or verify the frontend and the shared MVP. Do not ask for permission again for ordinary local backend access or for safe changes that are directly required by the current task.
- Read and obey the backend repository's own `AGENTS.md` and applicable local skills before changing backend code.
- The backend Development HTTP profile listens on `http://localhost:5050`. Prefer the repository's documented .NET commands and start background services with hidden windows.
- Treat the backend implementation and its generated OpenAPI document as the contract source of truth. When a required contract is missing or incorrect, fix and verify the backend first, then regenerate `src/lib/api/generated/schema.d.ts` and implement the frontend against the regenerated contract.
- Before working in either repository, inspect `git status` and recent commits. Preserve all pre-existing changes, including generated or untracked files, unless the user explicitly places them in scope.
- Local tests, builds, temporary databases, scratch worktrees, and Development-only service startup are authorized. Keep mutations isolated and clean up only temporary resources created by the current task.
- Never expose passwords, access tokens, verification tokens, connection strings, or other secrets in URLs, logs, fixtures, reports, or chat output.
- This standing authorization does not include push, deploy, production access, destructive database operations, force operations, or deletion of user-owned work. Those actions still require explicit approval.
- Keep the user informed with concise commentary when starting or stopping services, changing repositories, modifying contracts, applying migrations, or encountering blockers.
