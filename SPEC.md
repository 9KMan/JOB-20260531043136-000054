# SPEC: Senior Full-Stack Developer — SaaS v2 Build (FastAPI + LibreChat + React 19)

## 1. Project Overview

- **Client:** Australian AI compliance SaaS for Registered Training Organisations (RTOs)
- **Goal:** Ship v2 of an existing production SaaS (~50,000 lines), an AI compliance product for Australian RTOs. Amendment and feature delivery on a vendored LibreChat fork + FastAPI backend + React 19 frontend.
- **Stack:** FastAPI · PostgreSQL · SQLAlchemy · Alembic · Stripe · LibreChat fork (Node.js + MongoDB) · React 19 · Vite 7 · Tailwind 4
- **Contract:** Fixed-price $3,600 · 5 milestones · 4–6 weeks · Upwork escrow
- **Stack complexity:** 3 distinct runtimes (Python/FastAPI, Node.js/LibreChat, JS/React), 2 databases (Postgres + MongoDB), 2 payment systems (Stripe + Upwork escrow)

## 2. Architecture

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

### LibreChat Fork Architecture

```
LibreChat (Node.js + MongoDB)
├── Custom MCP servers (tool-isolation at Mongo + runtime level)
│   ├── training.gov.au lookup (Provider Registry)
│   └── CRICOS provider lookup
├── RTO Consultant agent config
├── Review-mode injection
└── Custom credit engine interface
```

## 3. Workstreams (5 Milestones)

### Milestone 1 — Database Foundation
- Database migration chain (Alembic chain, multi-step)
- Schema reconciliation between Postgres and MongoDB
- Security fix patch
- 100-prompt seed data for AI compliance scenarios
- **Acceptance:** 69 binary tests across all milestones; M1 must pass all M1 tests before M2 funded

### Milestone 2 — Rebrand + Onboarding + Registry
- Full rebrand (client branding applied to all surfaces)
- Onboarding wizard (new RTO setup flow)
- Provider Registry lookup integration:
  - training.gov.au API → RTO provider data
  - CRICOS (Commonwealth Register of Institutions and Courses for Overseas Students) lookup
- Server-side Passport.js auth gate (magic-link + session model — existing pattern)

### Milestone 3 — AI Tool Isolation + Agent Config
- General Assistant tool-isolation at MongoDB level (document-level access control)
- General Assistant tool-isolation at Node.js runtime level (module/sandbox isolation)
- RTO Consultant agent configuration
- Review-mode injection in LibreChat (audit trail for AI responses)

### Milestone 4 — Credit Engine + Features
- Credit engine (usage-based credit allocation + tracking)
- Stripe webhook extensions (credit purchase, credit exhaustion, refund events)
- Prompt Library UI (browsable, searchable AI prompt templates)
- User-suggested prompt admin queue (users submit prompts, admin approves)
- Structured export guard (data export with compliance formatting)
- Human Review queue (flag AI responses for human review before delivery)

### Milestone 5 — Testing + Handover
- Full acceptance testing in staging environment
- Staging screen-share demonstration with client
- Handover documentation (architecture, runbooks, API reference)
- 7-day defect window post-delivery
- Milestone 5 escrow released after staging acceptance sign-off

## 4. Data Model

### PostgreSQL (FastAPI side)
```sql
-- RTO Organisation
CREATE TABLE rto_organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    rto_number VARCHAR(50) UNIQUE NOT NULL,
    cricos_provider_code VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',  -- active, suspended, cancelled
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Account
CREATE TABLE credit_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    rto_id UUID REFERENCES rto_organisations(id),
    balance INTEGER NOT NULL DEFAULT 0,  -- credit units
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Transaction
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES credit_accounts(id),
    amount INTEGER NOT NULL,  -- positive = credit, negative = debit
    reason VARCHAR(100),       -- 'purchase', 'usage', 'refund', 'bonus'
    stripe_payment_intent VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt Template
CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(100),
    is_approved BOOLEAN DEFAULT FALSE,
    suggested_by UUID,
    approved_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Human Review Queue
CREATE TABLE human_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    prompt TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, reviewed, escalated
    reviewed_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe Webhook Events (idempotency)
CREATE TABLE stripe_events (
    id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### MongoDB (LibreChat side)
```javascript
// Chat sessions collection
db.sessions.insertOne({
    sessionId: "uuid",
    userId: "uuid",
    messages: [{
        role: "user" | "assistant",
        content: "string",
        timestamp: ISODate(),
        reviewMode: Boolean,
        toolCall: "string" | null,
        toolResult: "object" | null
    }],
    agentConfig: {
        type: "general" | "rto_consultant",
        toolIsolationEnabled: Boolean,
        reviewInjectionEnabled: Boolean
    },
    createdAt: ISODate()
});

// RTO Consultant agent config
db.agentConfigs.insertOne({
    agentType: "rto_consultant",
    systemPrompt: "string",
    allowedTools: ["tool1", "tool2"],
    blockedTools: ["dangerous_tool"],
    mcpServerIds: ["training_gov_au", "cricos"],
    isolationLevel: "runtime" | "mongo_document"
});

// MCP Server registry
db.mcpServers.insertOne({
    serverId: "training_gov_au",
    name: "training.gov.au Provider Registry",
    endpoint: "https://www.training.gov.au/祥",
    authType: "api_key",
    rateLimit: 100,  // requests per hour
    isActive: Boolean
});
```

## 5. Technical Decisions

1. **LibreChat fork as chat layer** — Vendored LibreChat provides LLM orchestration, conversation management, and plugin system. Custom MCP servers extend tool capabilities without modifying core LibreChat.
2. **Dual-database architecture** — PostgreSQL for transactional app data (users, credits, organisations); MongoDB for chat sessions, agent configs, and document-oriented AI data.
3. **Stripe webhook idempotency** — Every Stripe event stored with `stripe_events.id` as PK before processing; re-delivered events are no-ops.
4. **Alembic multi-step migrations** — Chain ` alembic upgrade head` sequentially; each milestone has a named revision.
5. **Tool isolation at two levels** — MongoDB document-level (field-level access read model) + Node.js runtime sandbox (VM2 or isolated-eval for untrusted tool code).
6. **Magic-link auth (existing pattern)** — No passwords; email link sends signed JWT. Continue existing pattern, do not introduce new auth mechanisms.
7. **Credit engine as separate service module** — `src/credit_engine/` Python module; Stripe webhooks update credit balances atomically within a DB transaction.
8. **Prompt library admin queue** — `suggested_by` UUID references user; `is_approved` boolean gate; admin UI filters `is_approved=False` entries.
9. **Review-mode injection** — `reviewInjectionEnabled` flag on session; when true, AI responses are intercepted and queued for `human_review_queue` before delivery to user.
10. **Structured export with compliance watermark** — Export includes RTO number, timestamp, and SHA256 hash of source data for audit integrity.

## 6. API Design

### FastAPI Endpoints
```
POST   /api/auth/magic-link          Send magic link email
GET    /api/auth/verify?token=       Verify magic link, set session

GET    /api/rto/lookup/{rto_number}  training.gov.au provider lookup
GET    /api/rto/cricos/{code}        CRICOS provider lookup

GET    /api/credits                  Get current user's credit balance
POST   /api/credits/purchase         Initiate Stripe payment for credits
POST   /api/webhooks/stripe           Stripe webhook receiver (idempotent)

GET    /api/prompts                   List approved prompt templates
GET    /api/prompts/suggested         List pending-suggested prompts (admin)
POST   /api/prompts/suggest           User suggests a prompt
PATCH  /api/prompts/{id}/approve      Admin approves suggested prompt

GET    /api/review-queue              List pending human reviews
PATCH  /api/review-queue/{id}         Submit review (approve/escalate)

POST   /api/export/compliance         Generate compliance export PDF/CSV
```

### LibreChat MCP Tool Interface
```
Tools are registered via MCP (Model Context Protocol):
- training_gov_au_lookup(rto_number) → RTO details JSON
- cricos_lookup(provider_code) → CRICOS registration JSON
- credit_balance_check(user_id) → current credit units
- submit_for_human_review(session_id, message_id) → queue entry
```

## 7. Out of Scope

- Greenfield build (existing ~50k line codebase is the base)
- Mobile app development
- Changing the underlying LibreChat core architecture (custom agents via MCP only)
- Direct database writes from client side — all data changes via API
- Third-party SSO beyond magic-link email
- SEO or marketing site work
- CSS changes outside component-level Tailwind utility classes

## 8. Success Metrics

- All 69 binary acceptance tests pass in staging screen-share
- M1–M5 escrow payments released sequentially per milestone acceptance
- Zero data loss incidents across all migration steps
- Human review queue reduces AI-only errors by client-defined threshold
- Compliance export passes internal audit format requirements
- 7-day defect window closes with ≤3 reported issues