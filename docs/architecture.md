# Architecture

The React client sends chat messages to the Express API. The API loads history from MongoDB and passes the conversation to the Gemini agent. The agent uses the price-list retriever and a child-process MCP server for calendar availability and booking.

```text
React client
    |
    | POST /api/chat
    v
Express app -> chat controller -> session service -> MongoDB
                     |
                     v
               agent service <-> Gemini function calling
                  /      \
                 /        \
 price-list retriever     MCP client (stdio child process)
          |                        |
          v                        v
 Chroma vector store       calendar MCP tools
          ^                  /           \
          |              Google       Mock provider
 Gemini embeddings
          ^
          |
 Generated/curated knowledge-base PDF
```

The server bootstrap connects to MongoDB, ingests the price-list PDF into Chroma, initializes the MCP client, and starts the HTTP listener. `MOCK_CALENDAR=true` selects the in-memory calendar provider; otherwise the Google Calendar provider is used.
