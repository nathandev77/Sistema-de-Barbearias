# 💈 Barber Control — Multi-Tenant SaaS Platform

Sistema completo de gestão, agendamento online e automação via WhatsApp para barbearias, salões e profissionais de estética.

[![CI/CD Pipeline](https://github.com/nathan/saas-barber/actions/workflows/ci.yml/badge.svg)](https://github.com/nathan/saas-barber/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Security: OWASP Top 10 Audited](https://img.shields.io/badge/Security-OWASP%20Audited-emerald.svg)](#segurança--owasp-top-10)

---

## 📐 Arquitetura & Stack Tecnológica

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (React 18)                  │
│   Vite + Tailwind CSS + Lucide Icons + Framer Motion   │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / REST API (JWT)
┌──────────────────────────▼─────────────────────────────┐
│                 Backend (Node.js / Express)             │
│   Helmet • CORS • Rate Limiting • Zod • Prisma ORM      │
└──────────┬──────────────────────────┬──────────────────┘
           │                          │
┌──────────▼───────────────┐ ┌────────▼──────────────────┐
│   PostgreSQL (Supabase)  │ │ Evolution API (WhatsApp)  │
│   Multi-tenant Isolation │ │ N8N Flow Automations      │
└──────────────────────────┘ └───────────────────────────┘
```

- **Frontend**: React 18, Vite, React Router 6, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express 5, TypeScript, Prisma 7, Zod Validation.
- **Database**: PostgreSQL (Supabase / Neon) com suporte a Connection Pooling (`pgbouncer`).
- **Automação**: Evolution API (WhatsApp) + N8N Webhooks.

---

## ⚡ Começando (Ambiente Local)

### Pré-requisitos
- Node.js 20+
- PostgreSQL ativo (local ou Supabase)
- npm ou yarn

### 1. Clonar o Repositório e Instalar Dependências
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o modelo de variáveis de ambiente no backend:
```bash
cd backend
cp .env.example .env
```
Edite o arquivo `backend/.env` com sua conexão do PostgreSQL, `JWT_SECRET` e `SUPER_ADMIN_KEYS`.

> 💡 **Gerar Chaves Seguras**: Execute o utilitário incluído no repositório:
> ```bash
> node scripts/generate_keys.mjs
> ```

### 3. Sincronizar o Banco de Dados
```bash
cd backend
npx prisma db push
npx prisma generate
```

### 4. Executar os Servidores de Desenvolvimento
```bash
# Terminal 1 - Backend (Porta 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (Porta 5173)
npm run dev
```

---

## 🛡️ Segurança & OWASP Top 10

O sistema foi blindado seguindo as diretrizes da **OWASP Top 10**:

- **A01: Broken Access Control**: Isolamento rígido por `tenantId` extraído exclusivamente do token JWT assinado, prevenindo ataques BOLA/IDOR.
- **A02: Cryptographic Failures**: Hash de senhas via `bcryptjs` (salt 10), tokens JWT efêmeros e chaves mestras validadas com `crypto.timingSafeEqual` para proteção contra timing attacks.
- **A03: Injection**: Validação e parsing rigorosos com schemas Zod + sanitização recursiva de inputs.
- **A04: Insecure Design**: Limitação de taxa (Rate Limiting) em rotas críticas de autenticação e proteção contra força bruta de OTP.
- **A05: Security Misconfiguration**: Headers HTTP seguros via `helmet`, `x-powered-by` desabilitado e CORS restrito a origens confiáveis.

---

## 📊 Painel Master & Controle Geral (`/saas-admin`)

Acesse `http://localhost:5173/saas-admin/login` para gerenciar toda a plataforma:

1. **Visão Geral**: Métricas em tempo real (MRR, Lucro Líquido, Assinantes, Churn, Gráficos de Crescimento).
2. **Financeiro**: Funil de conversão trial → pagante e distribuição de custos operacionais.
3. **Barbearias**: Gestão de clientes, extensão de dias de teste (+7d), ativação imediata e bloqueio de acesso.
4. **Custos Operacionais**: Cadastro e monitoramento de custos mensais da infraestrutura (VPS, banco, domínio, e-mails).

---

## 🧪 Testes & Auditoria Automatizada

Para executar a bateria completa de testes de segurança:
```bash
node scripts/security_audit.mjs
```

Para verificar integridade das dependências:
```bash
npm audit --audit-level=high
cd backend && npm audit --audit-level=high
```
