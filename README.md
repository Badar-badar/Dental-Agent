# Dental Clinic AI Agent (MERN + Gemini + Chroma + MCP)

Chat agent that answers from a price-list PDF (RAG) and books appointments in Google Calendar (MCP).

```
React chat ──> Express /api/chat ──> Gemini (function calling)
                                       ├─ search_price_list ──> Chroma (Gemini embeddings of price-list.pdf)
                                       └─ check_availability / create_appointment ──> MCP server ──> Google Calendar
MongoDB stores chat sessions.
```

## Run

```bash
cp .env.example .env        # add GEMINI_API_KEY
docker compose up --build
# open http://localhost:8080
```

First boot generates `server/data/knowledge-base/price-list.pdf` if it is missing, chunks it, embeds it with Gemini and stores it in Chroma.
With `MOCK_CALENDAR=true` (default) bookings go to an in-memory calendar so you can test immediately.

## Real Google Calendar

1. Google Cloud Console: create a project, enable **Google Calendar API**, create an **OAuth client ID** (type: Web application) with redirect URI `http://localhost:3000/oauth2callback`. Add yourself as a test user on the consent screen.
2. Get a refresh token (run locally, not in Docker):
   ```bash
   cd server && npm install
   GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/getRefreshToken.js
   ```
3. In `.env`: set `MOCK_CALENDAR=false`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, and `GOOGLE_CALENDAR_ID` (use a dedicated test calendar's ID).
4. `docker compose up --build`

## Where things live

| Concern | File |
|---|---|
| Express app and bootstrap | `server/src/app.js`, `server/src/index.js` |
| Chat route/controller | `server/src/routes/chat.routes.js`, `server/src/controllers/chat.controller.js` |
| Session persistence | `server/src/models/Session.js`, `server/src/services/session.service.js` |
| Agent loop and MCP client | `server/src/services/agent.service.js` |
| System prompt | `server/src/prompts/systemPrompt.js` |
| PDF and RAG pipeline | `server/src/rag/pdf/generatePdf.js`, `chunking.js`, `embeddings.js`, `ingest.js`, `retriever.js`, `vectorStore.js` |
| MCP tools, slots, and providers | `server/src/mcp/server/`, `server/src/mcp/providers/` |
| Client API, chat hook, and UI | `client/src/api/`, `client/src/hooks/`, `client/src/components/` |

Re-ingest after changing the PDF: `docker compose exec server npm run ingest`.

## Project structure

```text
client/
  src/
    api/                 Chat API requests
    components/          Chat header, messages, prompts, and composer
    constants/           Tool labels and starter prompts
    hooks/               Chat state and actions
    styles/              Base and chat styles
server/
  data/knowledge-base/   Clinic price-list PDF
  scripts/               Local operational scripts
  src/
    config/              Environment configuration
    controllers/         HTTP request handlers
    mcp/                 MCP server, slots, and calendar providers
    models/              Mongoose models
    prompts/             Agent system prompt
    rag/                 PDF ingestion and retrieval
    routes/               Express routes
    services/             Agent and session services
    utils/                Logger
docs/
  architecture.md
```
