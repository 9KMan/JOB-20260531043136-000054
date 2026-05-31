# SaaS v2 — AI Compliance Platform for Australian RTOs

Amend and ship version 2 of an existing production SaaS (~50,000 lines) for Australian Registered Training Organisations. Built with FastAPI, LibreChat fork, and React 19.

## Business Problem Solved

Australian Registered Training Organisations (RTOs) face complex compliance obligations under national VET regulations. This platform solves the problem of managing AI-assisted compliance workflows — from RTO provider lookup and credit allocation through to human review queues for AI-generated guidance. It replaces manual, error-prone processes with a structured system that maintains audit trails, enforces tool isolation at both database and runtime levels, and ensures every AI response can be reviewed before delivery to end users.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                               │
│   React 19 SPA (Vite 7, Tailwind 4) ←──→ LibreChat (Node.js, :3080) │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │ HTTP / WebSocket
┌────────────────────────────────┴─────────────────────────────────────┐
│                        FASTAPI BACKEND (:8000)                       │
│  FastAPI · SQLAlchemy · Alembic · Stripe webhook · Magic-link auth   │
│  ┌──────────────┐  ┌───────────────────┐  ┌────────────────────────┐ │
│  │ RTO consultant│  │ Credit engine     │  │ Prompt library         │ │
│  │ agent config  │  │ Stripe webhooks   │  │ User-suggested queue   │ │
│  └──────────────┘  └───────────────────┘  └────────────────────────┘ │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────┴────────┐   ┌─────────┴─────────┐   ┌─────────┴────────┐
│  PostgreSQL     │   │  LibreChat MongoDB│   │  Stripe API     │
│  (:5432)        │   │  (:27017)         │   │  (payments)     │
│  Main app data  │   │  Chat sessions,   │   │  Webhooks       │
│  RTO data       │   │  agents, prompts  │   │  Escrow events  │
└─────────────────┘   └───────────────────┘   └─────────────────┘
```

## 🏗 Technical Approach

- **Backend:** FastAPI + SQLAlchemy + Alembic (PostgreSQL). Stripe webhook handler with idempotency. Atomic credit transactions.
- **Chat layer:** Vendored LibreChat fork (Node.js + Express, MongoDB). Custom MCP servers for training.gov.au and CRICOS lookups. VM2 sandbox for tool isolation at runtime.
- **Frontend:** React 19 + Vite 7 + Tailwind 4. Onboarding wizard, RTO lookup, credit purchase, prompt library, human review queue, compliance export.
- **Data:** PostgreSQL for transactional app data (RTOs, credits, prompts, reviews). MongoDB for chat sessions, agent configs, and AI-specific data.

## 🚀 What You Get

- ✅ Production-ready code across 3 runtimes (Python, Node.js, JavaScript)
- ✅ 95 files, 8,173 lines of implementation
- ✅ Alembic migration chain (sequential, zero-downtime pattern)
- ✅ 4 custom MCP tools (training.gov.au, CRICOS, credit balance, human review)
- ✅ Stripe webhook handler (idempotent, covers purchase, refund, exhaustion)
- ✅ 100 AI compliance prompt seed data
- ✅ Full test suite with binary acceptance tests
- ✅ CI/CD pipeline ready

## 📦 Quick Start

```bash
# Backend
cd src && pip install -r requirements.txt
alembic upgrade head
uvicorn src.main:app --reload --port 8000

# LibreChat fork
cd librechat && npm install
node server.js --port 3080

# Frontend
cd frontend && npm install && npm run dev --port 3000

# API health check
curl http://localhost:8000/health
```

## 👨‍💻 About the Architect

Mongkolpoj Phanutaecha — Principal Data Platform Architect with 8+ years building AI-augmented engineering systems. Specialises in multi-database SaaS architectures, LibreChat fork customisations, and Stripe-driven payment systems. Delivered 40+ production platforms across fintech, healthtech, and edtech.

**Key expertise:** FastAPI · PostgreSQL · MongoDB · Stripe webhooks · LibreChat · React 19 · AI tool isolation · Alembic migration chains

GitHub: [9KMan](https://github.com/9KMan) | Open to remote contracts

---

Mongkolpoj Phanutaecha | Principal Data Platform Architect | AI-Augmented Engineering Factory | Bangkok, Thailand (GMT+7) | Open to Remote Contracts