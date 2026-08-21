# Barber Control — SaaS Multi-Tenant

> Sistema de gestão de barbearias e agendamento online com arquitetura multi-tenant, integração com WhatsApp (Evolution API) e pipeline DevSecOps.

[![CI/CD Pipeline](https://github.com/nathandev77/Sistema-de-Barbearias/actions/workflows/ci.yml/badge.svg)](https://github.com/nathandev77/Sistema-de-Barbearias/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Arquitetura

O projeto adota uma arquitetura modular baseada em microsserviços lógicos, com isolamento de dados por *tenantId* em nível de banco de dados.

- **Frontend**: React 18 (Vite), React Router v6, Tailwind CSS, Shadcn UI / Radix.
- **Backend**: Node.js 20, Express 5, TypeScript.
- **Database**: PostgreSQL (Prisma ORM).
- **Mensageria/Automação**: Evolution API, webhooks via N8N.
- **Infraestrutura**: Docker Multi-stage, CI/CD via GitHub Actions.

## Requisitos Prévios

- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) e Docker Compose (para ambiente local)
- [PostgreSQL](https://www.postgresql.org/) v14+ (ou banco gerenciado como Supabase/Neon)

## Configuração do Ambiente Local

### 1. Clonar repositório e instalar dependências

```bash
git clone https://github.com/nathandev77/Sistema-de-Barbearias.git
cd Sistema-de-Barbearias

# Instalar dependências da interface web
npm install

# Instalar dependências da API
cd backend
npm install
```

### 2. Variáveis de Ambiente

No diretório `/backend`, utilize o template fornecido para criar seu arquivo de ambiente:

```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env` para incluir suas credenciais de banco de dados (`DATABASE_URL`).  
Para gerar chaves criptográficas seguras para o sistema (`JWT_SECRET`, `SUPER_ADMIN_KEYS`), execute o utilitário nativo:

```bash
node scripts/generate_keys.mjs
```

### 3. Migrações do Banco de Dados

Com o `.env` configurado, sincronize o schema do Prisma:

```bash
npx prisma db push
npx prisma generate
```

### 4. Execução

Suba as duas aplicações paralelamente:

```bash
# Terminal 1: Backend (Escuta na porta 3001)
cd backend && npm run dev

# Terminal 2: Frontend (Escuta na porta 5173)
npm run dev
```

Acesse a interface de administração do sistema em `http://localhost:5173/saas-admin/login`.

## CI/CD & Deploy

Este repositório implementa um pipeline **DevSecOps** rigoroso no GitHub Actions (`.github/workflows/ci.yml`):

1. **Security Gates**: Escaneamento de secrets no histórico via *TruffleHog* e análise estática (SAST) via *CodeQL* contra vulnerabilidades da OWASP Top 10.
2. **Quality Gates**: Checagem de dependências (`npm audit`), validação de lint e testes unitários.
3. **Continuous Deployment**: Pushes na branch `main` ativam o deploy automatizado para a VPS, utilizando conexões seguras via SSH e orquestração por `docker-compose`.

## Segurança Aplicada (OWASP)

O backend possui proteções nativas contra vetores comuns:
- **Rate Limiting**: Mitigação de brute-force em rotas de autenticação e recuperação de senha.
- **Timing Attacks**: Verificação de chaves administrativas (Super Admin) utilizando `crypto.timingSafeEqual`.
- **Injections**: Camada de validação estrita via `Zod`, rejeitando payloads malformados antes de alcançarem o ORM.
- **Data Exposure**: Remoção de senhas em memória e hashes via `bcrypt` (salt 12). Logs mascarados em ambiente produtivo.
