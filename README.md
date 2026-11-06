# Barber Control — Multi-Tenant SaaS

> Barbershop management and online booking system with a multi-tenant architecture, WhatsApp integration (Evolution API) and a DevSecOps pipeline.

[![CI/CD Pipeline](https://github.com/nathandev77/Sistema-de-Barbearias/actions/workflows/ci.yml/badge.svg)](https://github.com/nathandev77/Sistema-de-Barbearias/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- **Online booking** for customers, with barber, service, date and time selection.
- **Barbershop dashboard**: schedule, clients, barbers, services, products, sales, expenses and history.
- **Subscription plans** for customers and SaaS plans for barbershops.
- **WhatsApp bot API** (Evolution API / N8N webhooks) that lets customers check barbershop info, see available time slots and book appointments through WhatsApp.
- **SaaS admin area** to manage tenants (barbershops) and platform financials.

## Architecture

The project uses a modular architecture organized as logical services, with data isolation per *tenantId* at the database level.

- **Frontend**: React 18 (Vite), React Router v6, Tailwind CSS, Shadcn UI / Radix.
- **Backend**: Node.js 20, Express 5, TypeScript.
- **Database**: PostgreSQL (Prisma ORM), Redis (ioredis).
- **Messaging/Automation**: Evolution API, webhooks via N8N.
- **Infrastructure**: Multi-stage Docker builds, CI/CD via GitHub Actions.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) and Docker Compose (for the local environment)
- [PostgreSQL](https://www.postgresql.org/) v14+ (or a managed database such as Supabase/Neon)

## Local Setup

### 1. Clone the repository and install dependencies

```bash
git clone https://github.com/nathandev77/Sistema-de-Barbearias.git
cd Sistema-de-Barbearias

# Install the web interface dependencies
npm install

# Install the API dependencies
cd backend
npm install
```

### 2. Environment Variables

In the `/backend` directory, use the provided template to create your environment file:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file to include your database credentials (`DATABASE_URL`).  
To generate secure cryptographic keys for the system (`JWT_SECRET`, `SUPER_ADMIN_KEYS`), run the built-in utility:

```bash
node scripts/generate_keys.mjs
```

### 3. Database Migrations

With `.env` configured, sync the Prisma schema:

```bash
npx prisma db push
npx prisma generate
```

### 4. Running

Start both applications in parallel:

```bash
# Terminal 1: Backend (listens on port 3001)
cd backend && npm run dev

# Terminal 2: Frontend (listens on port 5173)
npm run dev
```

Open the system administration interface at `http://localhost:5173/saas-admin/login`.

Alternatively, run the whole stack with Docker:

```bash
docker compose up -d --build
```

## CI/CD & Deployment

This repository implements a strict **DevSecOps** pipeline on GitHub Actions (`.github/workflows/ci.yml`):

1. **Security Gates**: secret scanning of the git history with *TruffleHog* and static analysis (SAST) with *CodeQL* against OWASP Top 10 vulnerabilities.
2. **Quality Gates**: dependency checks (`npm audit`), type checking/linting and unit tests.
3. **Continuous Delivery**: deployment to the VPS is triggered manually (`workflow_dispatch` on `main`), using secure SSH connections and `docker compose` orchestration.

## Applied Security (OWASP)

The backend has built-in protections against common attack vectors:
- **Rate Limiting**: brute-force mitigation on authentication and password recovery routes.
- **Timing Attacks**: administrative (Super Admin) key verification using `crypto.timingSafeEqual`.
- **Injections**: strict validation layer with `Zod`, rejecting malformed payloads before they reach the ORM.
- **Data Exposure**: passwords removed from memory and hashed with `bcrypt` (salt 12). Logs are masked in production.

## License

This project is licensed under the [MIT License](LICENSE).
