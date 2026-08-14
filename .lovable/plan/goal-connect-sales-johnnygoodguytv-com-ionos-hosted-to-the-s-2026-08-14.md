Goal: Connect sales@johnnygoodguytv.com (IONOS-hosted) to the shared inbox through a self-hosted email MCP bridge, while keeping the Managed tab ready for a future provider.

Current state:
- Frontend has a 3-pane inbox, drafts, sent, knowledge base, voice training, and settings pages.
- Settings already has Managed and Self-hosted MCP tabs plus a Test connection button.
- `testMailboxConnection` is a `createServerFn` that calls an external MCP endpoint's `tools/list`.
- All data is still mock in React context; no Supabase schema or migrations exist yet.
- The "Agent Integration" tab advertises `/mcp` but the app does not actually export an MCP server yet.

Plan:

1. Self-hosted email MCP bridge service
   - Build a standalone Node.js MCP server that connects to IONOS IMAP (`imap.ionos.com:993`) and SMTP (`smtp.ionos.com:587`).
   - Expose MCP tools: `read_emails`, `draft_email`, `send_email`, `list_folders`.
   - Use Streamable HTTP or SSE transport so the TanStack app can call it over HTTPS.
   - Provide run-locally and deploy-to-VPS/Docker instructions.
   - This bridge must live outside the app's serverless runtime because the Worker cannot open raw TCP IMAP sockets.

2. App-side MCP client integration
   - Add a `mailbox_connections` table to store the active MCP endpoint URL, auth token, and provider mode (encrypted credentials server-side).
   - Add an `emails` table matching the current thread schema, plus `vector` columns for RAG.
   - Use `createServerFn` (not Supabase Edge Functions) to call the bridge's tools from the server runtime.
   - Wire the Settings "Test connection" button to the existing `testMailboxConnection` function.
   - Add a "Sync inbox" action that calls `read_emails` and upserts the `emails` table.

3. Exported MCP server (app actions)
   - Add `@lovable.dev/mcp-js` and expose the app itself as an MCP server at `/mcp`.
   - Implement tools: `get_pending_drafts`, `approve_and_send_draft`, `query_rag_history`.
   - Authenticate via agent keys stored in a new `agent_keys` table.
   - The existing "Agent Integration" tab in Settings then becomes functional end-to-end.

4. RAG / Knowledge Base
   - Enable the `pgvector` extension in Supabase.
   - Create a `knowledge_base` table with vector embeddings.
   - Create a `historical_emails` table with vector embeddings for voice training.
   - When a new email arrives, run a vector search to find relevant past replies and knowledge entries, then include them in the AI draft prompt.

5. Automated payment reminders
   - Add a public TanStack server route that can be triggered by `pg_cron` or an external scheduler.
   - The route scans for overdue/payment emails, auto-drafts a reminder using the PayPal link from Settings, and queues it as a draft.
   - Respect tag rules: reminders can be marked `draft_ready` or `needs_review` depending on configuration.

6. Managed tab placeholder
   - Leave the Managed tab UI intact and store the same endpoint/token shape in `mailbox_connections`.
   - Document it as a future provider slot; once a real managed email MCP service is chosen, the same MCP client code and table work with no new backend path.

7. Voice training
   - Add a training-mailbox connection flow in the Voice Training page.
   - Scan a sent folder through the bridge and build a `voice_profiles` table from the indexed replies.
   - Use the active voice profile to guide AI draft generation.

Out of scope for this plan:
- Building or operating a hosted managed email MCP provider (kept as UI placeholder).
- Replacing the lightweight rich-text editor with a full TipTap implementation.

Technical details:
- Use `createServerFn` for all app-internal MCP calls, per TanStack Start conventions.
- Use TanStack server routes under `src/routes/api/public/*` for cron/webhook entry points.
- Store IMAP credentials encrypted server-side; never expose them to the browser.
- Use Supabase `pgvector` for embeddings and Lovable AI Gateway for embedding generation.
- Use `supabaseAdmin` only inside handlers for credential reads; rely on RLS policies for user-facing data.
