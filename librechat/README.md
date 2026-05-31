# LibreChat RTO Fork

A LibreChat fork for Australian Registered Training Organisations (RTOs) AI compliance SaaS.

## Features

- **RTO Consultant Agent**: Specialized AI assistant for Australian vocational education compliance
- **training.gov.au Lookup**: Real-time RTO provider data from official government registry
- **CRICOS Provider Lookup**: International education provider compliance checking
- **Credit Engine Integration**: Usage-based credit tracking via FastAPI backend
- **Review Mode Injection**: Human review queue for AI responses before delivery
- **Tool Isolation**: Runtime sandboxing for secure tool execution

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React 19 SPA                         │
└─────────────────────────────────┬───────────────────────┘
                                  │ HTTP/WebSocket
┌─────────────────────────────────┴───────────────────────┐
│           LibreChat Fork (Node.js :3080)                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Chat Routes │  │ MCP Servers  │  │ Agent Config   │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────┬───────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────┴─────────┐   ┌─────────┴─────────┐   ┌─────────┴─────────┐
│    MongoDB        │   │   FastAPI         │   │  External APIs   │
│    (:27017)      │   │   (:8000)         │   │  - training.gov.au│
│  Sessions,       │   │  Credit Engine,   │   │  - CRICOS         │
│  Agent Configs   │   │  Review Queue     │   │                   │
└──────────────────┘   └───────────────────┘   └───────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- FastAPI backend (for credit engine and review queue)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/librechat_rto
CREDIT_ENGINE_URL=http://localhost:8000
CREDIT_ENGINE_API_KEY=your-api-key
JWT_SECRET=your-jwt-secret
PORT=3080
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Running

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Chat

- `GET /api/chat/sessions` - List user sessions
- `POST /api/chat/sessions` - Create new session
- `GET /api/chat/sessions/:sessionId` - Get session with messages
- `POST /api/chat/sessions/:sessionId/messages` - Send message
- `DELETE /api/chat/sessions/:sessionId` - Delete session

### Agents

- `GET /api/agents/config` - Get agent configuration
- `PUT /api/agents/config` - Update agent config (admin)
- `GET /api/agents/tools` - List tools with access status

### MCP

- `GET /api/mcp/servers` - List MCP servers
- `POST /api/mcp/servers` - Register new server
- `GET /api/mcp/tools` - List available tools
- `POST /api/mcp/execute` - Execute a tool

## MCP Tools

### training_gov_au_lookup(rto_number)
Look up RTO provider details from training.gov.au

### cricos_lookup(provider_code)
Look up CRICOS provider registration details

### credit_balance_check(user_id)
Check current credit balance from FastAPI

### submit_for_human_review(session_id, message_id, prompt, ai_response, user_id)
Queue AI response for human review

## Security

- **JWT Authentication**: All API routes require valid JWT tokens
- **Tool Isolation**: VM2 sandbox for untrusted tool code execution
- **Rate Limiting**: Per-server rate limits on MCP tools
- **Review Mode**: AI responses can be intercepted for human review

## License

ISC