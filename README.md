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

First boot generates `server/data/price-list.pdf`, chunks it, embeds it with Gemini and stores it in Chroma.
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
| PDF creation | `server/src/rag/generatePdf.js` |
| Chunk, embed, store | `server/src/rag/chunk.js`, `embed.js`, `ingest.js` |
| Retrieval | `server/src/rag/search.js` |
| MCP server (tools) | `server/src/mcp/calendarServer.js` |
| Slot logic | `server/src/mcp/slots.js` |
| Agent loop + MCP client | `server/src/agent.js` |

Re-ingest after changing the PDF: `docker compose exec server npm run ingest`.
