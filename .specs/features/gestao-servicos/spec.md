# Gestão de Serviços Specification

## Problem Statement

A aplicação necessita de uma interface para cadastrar, pesquisar, listar e atualizar o catálogo de serviços oferecidos pelo prestador de serviço (ex: corte de pedras, acabamento, instalação, hora técnica, diária). A lista de serviços na rota `/servicos` serve de base para precificação e emissão de orçamentos e ordens de serviço.

## Goals

- Listar os serviços do catálogo com busca por nome/descrição, filtro de status, unidade de medida e preço base formatado em BRL.
- Permitir o cadastro de novos serviços informando Nome, Descrição (opcional), Unidade de Medida (m², m, hora, unidade, diária, etc.) e Preço Base.
- Permitir a edição de serviços existentes.
- Proteger todas as chamadas pelo cookie de sessão autenticada via BFF.
- Tratar validações de preço base positivo e exibir falhas seguras da API.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Exclusão física de serviços | Serviços são mantidos no catálogo com controle de status `isActive`. |
| Tabelas de preço dinâmicas por cliente | Orçamentos e negociações diretas ocorrem na Célula 3A (`gestao-orcamentos`). |

## User Stories

### P1: Listar e Pesquisar Serviços ⭐ MVP

**User Story**: Como prestador de serviço autenticado, quero listar e buscar meus serviços cadastrados por nome ou descrição para consultar preços e unidades rapidamente.

**Acceptance Criteria**:

1. WHEN an authenticated user visits `/servicos` THEN the system SHALL request the service list via `GET /api/services?searchTerm={term}&page={page}` and render active service items in a paginated list. <!-- SER-001 -->
2. WHEN the user types in the search input THEN the system SHALL filter service items by name or description. <!-- SER-002 -->
3. WHILE service data is loading THEN the system SHALL display an accessible loading skeleton. <!-- SER-003 -->
4. WHEN no services match the search or the list is empty THEN the system SHALL display `Nenhum serviço encontrado` and a CTA button to register the first service item. <!-- SER-004 -->

### P1: Cadastrar Novo Serviço ⭐ MVP

**User Story**: Como prestador de serviço autenticado, quero cadastrar um novo serviço informando nome, unidade de medida e preço base para expandir o catálogo da empresa.

**Acceptance Criteria**:

1. WHEN the user clicks "Novo Serviço" THEN the system SHALL open a form modal with fields for Name, Description, Unit of Measurement, and Base Price (R$). <!-- SER-005 -->
2. WHEN the user submits a valid form THEN the system SHALL send `POST /api/services`, update the catalog list, and display success feedback. <!-- SER-006 -->
3. IF the base price is less than or equal to zero THEN the system SHALL reject submission with `Informe um preço base maior que zero.`. <!-- SER-007 -->

### P1: Editar Serviço Existente

**User Story**: Como prestador de serviço autenticado, quero editar os dados ou preço de um serviço existente para atualizar a tabela de preços da empresa.

**Acceptance Criteria**:

1. WHEN the user clicks "Editar" on a service item THEN the system SHALL open the form modal pre-filled with the service's current data. <!-- SER-008 -->
2. WHEN the user saves changes THEN the system SHALL send `PUT /api/services/{id}`, update the service catalog, and display success feedback. <!-- SER-009 -->
3. IF the backend returns 401/403 or the session is expired THEN the system SHALL expire the session cookie and redirect to `/login`. <!-- SER-010 -->
4. IF a backend server failure occurs THEN the system SHALL display `Não foi possível processar a requisição de serviços agora. Tente novamente.` without internal details. <!-- SER-011 -->

## Success Criteria

- O prestador consegue visualizar, buscar, cadastrar e editar serviços em `/servicos`.
- Preços base são formatados em BRL e validados no cliente e no servidor.
- Todas as rotas e componentes possuem testes automatizados cobrindo sucesso, validação e falhas seguras.
