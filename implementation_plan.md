# CI/CD Pipeline and Project Cleanup

## Goal Description
We will set up a modern CI/CD pipeline for the SaaS Barber project, clean unnecessary files from the repository, finish the security‑audit script, and add the missing agenda‑notification behavior (mark as read on click). The pipeline will run on GitHub Actions, execute linting, tests, build the Docker images, and optionally deploy to a staging environment.

## User Review Required
> [!IMPORTANT]
> **Repository hosting** – The CI workflow requires the code to be pushed to a remote GitHub repository. Please confirm the GitHub repository URL (or create a new one) where you would like the CI pipeline to live.
>
> > *If you do not have a repository yet, we can initialize one locally and push it for you.*
>
> **Deployment target** – Do you want the CI to also push Docker images to a registry (e.g., Docker Hub, GitHub Packages) and/or deploy to a VPS/Render? Specify the target if you want automated deployment.
>
> **Secret management** – CI will need secrets for the database URL, JWT secret, Redis URL, and email service credentials. Please confirm you will add these as GitHub repository secrets.

## Open Questions
> [!WARNING]
> - Which branch should be considered the main development branch (e.g., `main` or `dev`)?
> - Do you prefer using **npm scripts** (`npm test`, `npm run lint`, `npm run build`) or **Makefile** targets for the CI steps?
> - For the security‑audit script, should we integrate it as an NPM `audit` script that fails the CI on detected issues?
> - Regarding the agenda UI, should the "mark as read" action also send a backend request to update a `notificationRead` flag, or is a client‑side state sufficient?

## Proposed Changes
---
### CI/CD Configuration
#### [NEW] [.github/workflows/ci.yml](file:///c:/Users/natha/OneDrive/Documentos/saas%20barber/.github/workflows/ci.yml)
```yaml
name: CI

on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main, dev ]

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm test
      - name: Build Docker image
        run: |
          docker build -t ghcr.io/${{ github.repository }}/backend:$(git sha1short) .
      - name: Push Docker image (optional)
        if: github.ref == 'refs/heads/main'
        env:
          GHCR_TOKEN: ${{ secrets.GHCR_TOKEN }}
        run: |
          echo $GHCR_TOKEN | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/${{ github.repository }}/backend:$(git rev-parse --short HEAD)
```

#### [MODIFY] [package.json](file:///c:/Users/natha/OneDrive/Documentos/saas%20barber/package.json)
Add scripts for CI:
```json
"scripts": {
  "lint": "eslint . --ext .ts,.tsx",
  "test": "npm run test --silent",
  "ci": "npm run lint && npm test",
  "audit": "node scripts/security_audit.mjs"
}
```

---
### Repository Cleanup
#### [DELETE] [node_modules](file:///c:/Users/natha/OneDrive/Documentos/saas%20barber/node_modules)
We will add `node_modules` to `.gitignore` (already present) and delete local copies that are not needed for version control.

#### [DELETE] [dist](file:///c:/Users/natha/OneDrive/Documentos/saas%20barber/dist)
Generated build artifacts are recreated by the CI; keep the folder ignored.

---
### Security Audit Script
#### [MODIFY] [scripts/security_audit.mjs](file:///c:/Users/natha/OneDrive/Documentos/saas%20barber/scripts/security_audit.mjs)
Add comprehensive checks for:
- XSS payload injection via request bodies.
- SQL injection patterns in query parameters.
- Tenant isolation verification (ensure tenantId scoping).
- OTP brute‑force lock‑out (simulate >3 attempts).
- Fake email domain validation using MX lookup.
The script will exit with non‑zero status if any check fails, causing the CI job to fail.

---
### Agenda Notification Read Status
#### [NEW] [frontend/src/components/AgendaNotification.jsx](file:///c:/Users/natha/OneDrive/Documentos/saas%20barber/src/components/AgendaNotification.jsx)
Create a component that, on click, sends `POST /api/notifications/read` with the notification ID and updates UI state.

#### [MODIFY] [backend/src/routes/notificationRoutes.ts](file:///c:/Users/natha/OneDrive/Documentos/saas%20barber/backend/src/routes/notificationRoutes.ts)
Add route handler to set `readAt` timestamp in DB.

---
## Verification Plan
### Automated Tests
- Run `npm run ci` locally and ensure lint, unit tests, and the new `npm run audit` pass.
- Push a test branch; CI should execute the same steps and report success/failure.
- Verify that the Docker build step completes without errors.

### Manual Verification
- After CI passes, open the deployed staging environment (if configured) and check that agenda notifications disappear after clicking.
- Run the security audit script manually (`npm run audit`) and confirm it reports no vulnerabilities.
- Confirm that the repository no longer contains unnecessary `node_modules` or `dist` folders.

---
**Next Steps**
1. Provide the GitHub repository URL (or create a new one).
2. Confirm branch naming and any deployment preferences.
3. Approve the plan so we can generate the CI files, clean the repo, and finish the remaining implementations.
