# Gestão de Clientes Specification

## Problem Statement

A aplicação não possui uma interface para visualizar, pesquisar, cadastrar ou atualizar os clientes (Pessoa Física ou Jurídica) da empresa. O prestador precisa de uma carteira de clientes centralizada na rota `/clientes` para vincular contatos a futuros orçamentos e agendamentos.

## Goals

- Listar os clientes ativos do tenant com paginação e busca por nome, CPF/CNPJ ou telefone (WhatsApp).
- Permitir o cadastro de novos clientes (Pessoa Física ou Pessoa Jurídica) coletando documento, contatos e endereço.
- Permitir a edição de clientes existentes.
- Proteger todas as chamadas pelo cookie de sessão autenticada via BFF.
- Tratar validações de formato de CPF (11 dígitos) e CNPJ (14 dígitos) e falhas seguras da API.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Exclusão física de clientes | Clientes são desativados/inativados via campo `isActive`. |
| Histórico de ordens de serviço por cliente | Pertence às células de orçamentos e ordens de serviço. |

## User Stories

### P1: Listar e Pesquisar Clientes ⭐ MVP

**User Story**: Como prestador autenticado, quero listar e pesquisar meus clientes por nome, CPF/CNPJ ou telefone para localizar contatos rapidamente.

**Acceptance Criteria**:

1. WHEN an authenticated user visits `/clientes` THEN the system SHALL request customer list via `GET /api/customers?search={term}&page={page}` and render active customers in a paginated list/table. <!-- CLI-001 -->
2. WHEN the user types in the search input THEN the system SHALL filter customers by name, document, or phone. <!-- CLI-002 -->
3. WHILE customer data is loading THEN the system SHALL display an accessible loading skeleton. <!-- CLI-003 -->
4. WHEN no customers match the search or the list is empty THEN the system SHALL display `Nenhum cliente encontrado` and a button to register the first customer. <!-- CLI-004 -->

### P1: Cadastrar Novo Cliente ⭐ MVP

**User Story**: Como prestador autenticado, quero cadastrar um novo cliente selecionando o tipo (Pessoa Física com CPF ou Pessoa Jurídica com CNPJ), telefone, e-mail e endereço.

**Acceptance Criteria**:

1. WHEN the user clicks "Novo cliente" THEN the system SHALL open a modal with fields for Name, Document Type (CPF/CNPJ), Document Value, Phone (WhatsApp), Email, and Address fields. <!-- CLI-005 -->
2. WHEN the user submits a valid form THEN the system SHALL send `POST /api/customers`, refresh the list, and display success feedback. <!-- CLI-006 -->
3. IF the document format is invalid (neither 11 digits for CPF nor 14 digits for CNPJ) THEN the system SHALL reject submission with `Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.`. <!-- CLI-007 -->

### P1: Editar Cliente Existente

**User Story**: Como prestador autenticado, quero editar os dados de um cliente existente para manter a carteira atualizada.

**Acceptance Criteria**:

1. WHEN the user clicks "Editar" on a customer THEN the system SHALL open the form modal pre-filled with the customer's current data. <!-- CLI-008 -->
2. WHEN the user saves changes THEN the system SHALL send `PUT /api/customers/{id}`, update the customer list, and display success feedback. <!-- CLI-009 -->
3. IF the backend returns 401/403 or the session is expired THEN the system SHALL expire the session cookie and redirect to `/login`. <!-- CLI-010 -->
4. IF a backend network or server failure occurs THEN the system SHALL display `Não foi possível salvar o cliente agora. Tente novamente.` without internal details. <!-- CLI-011 -->

## Success Criteria

- O prestador consegue visualizar, buscar, cadastrar e editar clientes em `/clientes`.
- Formatos de CPF e CNPJ são validados no cliente e no servidor.
- Todas as rotas e componentes possuem testes automatizados cobrindo sucesso, validações e falhas seguras.
