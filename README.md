# SACCOChain – Hybrid Blockchain Credit Platform

A full-stack platform for SACCOs that combines blockchain transparency with AI-powered credit scoring. Built as a hybrid system: off-chain for speed and privacy, on-chain for verifiable trust.

## 1) Problem, Solution, and Why Now

- **Problem**
  - Duplicate borrowing across SACCOs due to poor data sharing and slow/centralized credit checks (CRB friction).
  - Limited transparency reduces member trust; data privacy concerns limit sharing.
  - Smaller/rural SACCOs lack affordable interoperable tools to digitize and make data-driven decisions.

- **Solution**
  - SACCOChain is a hybrid on-chain/off-chain platform:
    - Off-chain (Node.js + PostgreSQL): fast workflows, secure storage of PII and transactions.
    - On-chain (Sui Move): immutable proofs of credit events (score hashes) for verifiable trust.
    - AI service (Flask): credit scoring using behavioral and transactional features.
    - Modern frontend (React + Tailwind): landing page, multilingual (EN/SW), dark mode, chatbot, dashboards.

- **Why Now**
  - Mature L1s (Sui) provide low-fee, high-throughput execution.
  - Digital transformation in SACCOs is accelerating; interoperability/trust gaps remain.
  - Affordable fintech tooling + AI makes a practical, scalable solution feasible.

## 2) Core Objectives

- **Reduce fraud and duplicate loans** via cross-institution trust proofs.
- **Portable credit reputation** for members while preserving privacy.
- **Accelerate loan workflows** using AI scoring and verifiable records.
- **Inclusive access** via web and scalable APIs for partners and regulators.

## 3) Architecture Overview

```mermaid
graph LR
  U[User (Member/Admin/Auditor)] --> FE[React Frontend]
  FE -->|REST /api| BE[Node.js/Express Backend]
  BE --> DB[(PostgreSQL + Prisma)]
  BE --> REDIS[(Redis Cache)]
  BE --> AI[(Flask AI Service)]
  BE --> SUI[(Sui Blockchain)]
  FE --> NGINX[Nginx Reverse Proxy]
```

- **Frontend (`frontend/`)**: React + Vite + Tailwind
  - Public landing page, multilingual (English/Swahili), dark mode, chatbot toggle, newsletter signup
  - Authenticated dashboards for members/admins
- **Backend (`backend/`)**: Node.js + Express
  - Auth, SACCO, transactions, scoring, Sui proofs, newsletter
  - Prisma ORM (PostgreSQL), Redis cache, security middleware
- **AI Service (`ai-service/`)**: Python + Flask
  - `/api/score` with ML model or rule-based fallback
  - `train_model.py` builds realistic dataset and saves model artifacts
- **Blockchain (`blockchain/`)**: Sui Move contracts
  - `sacco_registry`, `credit_registry`, `credit_oracle`
  - Anchors credit score hashes; future extensibility with Sui objects
- **Infra**: Docker Compose + Nginx reverse proxy + health checks

## 4) How It Works (E2E)

1. Member actions (deposits/loans/repayments) create `Transaction` rows.
2. Admin triggers credit scoring:
   - Backend aggregates features from activity.
   - AI service returns a score and risk level.
   - Backend stores a `CreditScore` and updates `User.creditScore`.
   - Optionally, backend anchors a hash of score data on Sui for proof.
3. Other SACCOs can verify a member’s anchored proof without accessing raw PII.

Data persists in Prisma models: `User`, `Sacco`, `Transaction`, `CreditScore`, `NewsletterSubscription`.

## 5) Features

- **Landing Page (`frontend/src/pages/LandingPage.jsx`)**
  - Sections: Hero, Features, How It Works, Technology, Testimonials, Newsletter, CTA, Footer
  - Multilingual via `src/i18n.js`, `src/locales/en.json`, `src/locales/sw.json`
  - Dark mode toggle (adds/removes `dark` class)
  - Chatbot widget toggle
  - Newsletter form (wired to `POST /api/newsletter/subscribe`)
  - “Watch Demo” button (video modal)
- **Auth & Roles**
  - JWT-based sessions, roles: `ADMIN`, `MEMBER`, `AUDITOR`
- **Credit Scoring**
  - `POST /api/score/calculate/:userId` stores `CreditScore` and updates `User.creditScore`
  - `GET /api/score/history/:userId` returns history
- **Blockchain (Sui)**
  - `POST /api/sui/store-score` anchors credit score hash
  - `GET /api/sui/verify-score/:creditScoreId` verifies proof
- **Admin**
  - System stats, users, SACCOs, analytics

## 6) Project Structure

```text
saccochain/
├─ README.md                      # Project overview, setup, architecture, APIs
├─ docker-compose.yml             # Orchestrates FE, BE, AI, DB, Redis, Nginx
├─ .env.example                   # Compose-level env template (secrets/overrides)

├─ backend/                       # Node.js + Express API (Prisma, Redis, Sui)
│  ├─ package.json
│  ├─ Dockerfile
│  ├─ Dockerfile.prod
│  ├─ .env.example
│  ├─ prisma/
│  │  ├─ schema.prisma            # Models: User, Sacco, Transaction, CreditScore, NewsletterSubscription
│  │  ├─ migrations/              # Prisma migrations
│  │  └─ seed.js                  # Seeds demo data
│  └─ src/
│     ├─ server.js                # Server bootstrap & DB check
│     ├─ app.js                   # Express app & route mounts
│     ├─ routes/                  # API routes (auth/sacco/score/sui/transactions/admin/newsletter)
│     ├─ middleware/              # Auth, validation, security, errors
│     ├─ services/                # Sui & blockchain helpers
│     ├─ utils/                   # Logger/response helpers (extensible)
│     ├─ health/                  # Health endpoints (extensible)
│     └─ jobs/                    # Background workers (extensible)

├─ frontend/                      # React + Vite + Tailwind UI
│  ├─ package.json
│  ├─ Dockerfile
│  ├─ Dockerfile.prod
│  ├─ index.html
│  ├─ vite.config.js
│  ├─ tailwind.config.js
│  ├─ .env.example
│  └─ src/
│     ├─ main.jsx                 # App bootstrap
│     ├─ App.jsx                  # Routes and guards
│     ├─ pages/                   # Pages (Landing, Login, Register, Dashboards)
│     ├─ components/              # Reusable UI (Navbar, cards, modals)
│     ├─ context/                 # AuthContext
│     ├─ services/                # api.js (Auth/SACCO/Score/Tx/Admin/Sui/Newsletter)
│     ├─ locales/                 # i18n translations (en, sw)
│     └─ i18n.js                  # i18n setup

├─ ai-service/                    # Flask microservice for credit scoring
│  ├─ app.py                      # /api/health, /api/score
│  ├─ train_model.py              # Model training & artifacts
│  ├─ requirements.txt
│  ├─ Dockerfile
│  └─ Dockerfile.prod

├─ blockchain/                    # Sui Move contracts & scripts
│  ├─ Move.toml
│  ├─ sources/                    # sacco_registry.move, credit_registry.move, credit_oracle.move
│  └─ scripts/                    # deploy.js, test-contracts.js

├─ nginx/
│  ├─ nginx.conf                  # SPA + /api reverse proxy, security headers, gzip
│  └─ ssl/                        # saccochain.crt, saccochain.key (production)
  - `SUI_NODE_URL=https://fullnode.mainnet.sui.io:443` (or testnet)
  - `SUI_PACKAGE_ID=0x...` (after deploy)
  - `SUI_PRIVATE_KEY=...`
- **Frontend (`frontend/.env`)**
  - `VITE_API_URL=http://localhost:3001` (local) or reverse-proxy path in prod
- **Docker Compose**
  - `DB_PASSWORD`, `JWT_SECRET`, etc. provided via compose env

## 8) Local Development

- **Backend**
  - `cd backend && npm install`
  - `npx prisma generate && npx prisma db push`
  - `npm run db:seed`
  - `npm run dev`
- **Frontend**
  - `cd frontend && npm install && npm run dev`
- **AI Service**
  - `cd ai-service && pip install -r requirements.txt && python app.py`
- **Blockchain**
  - Deploy Move package; set `SUI_PACKAGE_ID` in backend `.env`

## 9) Docker Deployment

- Build & run:
  - `docker-compose build && docker-compose up -d`
- Nginx serves SPA and proxies `/api` to backend
- Health checks enabled
- TLS: place `nginx/ssl/saccochain.crt` and `saccochain.key` for production HTTPS

## 10) API Overview (Selected)

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`
- Scoring: `POST /api/score/calculate/:userId`, `GET /api/score/history/:userId`
- Sui: `POST /api/sui/store-score`, `GET /api/sui/verify-score/:creditScoreId`
- Admin: `GET /api/admin/stats`, `GET /api/admin/users`, `PATCH /api/admin/users/:userId/role`
- Transactions: `GET /api/transactions/:userId`, `POST /api/transactions`
- Newsletter: `POST /api/newsletter/subscribe`
- Health: `GET /health`, AI: `GET /api/health` (Flask)

## 11) Security & Compliance

- Backend: Helmet, CORS, rate limiting, JWT auth, bcrypt hashing, structured error handling
- Data: PII remains off-chain; only hashes on-chain (privacy by design)
- Infra: Nginx security headers, Redis cache, non-root Docker images in production

## 12) Why SACCOs Will Adopt

- Complements CRB with faster, cheaper, SACCO-focused reputation signals (savings, repayments, guarantorship behavior)
- Interoperability: cross-SACCO trust without exposing raw PII
- Member trust via auditable proofs; inclusive, affordable SaaS

## 13) Roadmap

- Mobile app + USSD/WhatsApp interfaces for rural access
- Deeper Sui object models (SACCO, Member, Loan agreements)
- Partner APIs for regulators/banks/micro-lenders
- Advanced ML models + explainability dashboards

## 14) Development Notes

- Seed demo data: run `backend/prisma/seed.js`
- Set `SUI_*` envs before calling on-chain routes
- For HTTPS locally, use dev certs or switch Nginx to HTTP

## 15) License

- MIT License. See `LICENSE`.
