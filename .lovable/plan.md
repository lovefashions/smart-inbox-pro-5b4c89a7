# Current connection status: NOT connected

Two independent checks say the mailbox is not wired up yet.

## What I checked

1. **The Railway bridge** — `https://smart-inbox-pro-5b4c89a7-production.up.railway.app/health`
   returns HTTP 200 but with an **empty body** (`content-length: 0`), and `/mcp` returns nothing at all.
   A working bridge must answer `/health` with `{"ok":true}` and answer `/mcp` with a JSON tool list.
   So Railway's edge is up, but the bridge process behind it is not serving requests.

2. **The app's saved connection** — the `mailbox_connections` table is **empty**.
   Even if the bridge were healthy, the app has no server URL, token, or mailbox credentials saved,
   so nothing in the app can read or send mail yet.

What *is* working: sign-in, the inbox/drafts/settings UI, and the saved sender settings
(from name, from address, signature).

## Plan to get it connected

### Step 1 — Make the Railway bridge actually respond (you, in Railway)
- Service → **Settings → Source → Root Directory** = `bridge`
- Service → **Settings → Networking** → confirm the public domain targets the port the app binds
  (the bridge reads `PORT`; if Railway's target port is fixed at 8931, add a variable `PORT=8931`)
- Variables required: `MCP_AUTH_TOKEN`, `MAILBOX_USERNAME` (or `IONOS_EMAIL`),
  `MAILBOX_PASSWORD` (or `IONOS_EMAIL_PASSWORD`), `MAILBOX_FROM`
- Redeploy, then check the deploy logs for `Email MCP bridge listening on port ...`

If the deploy is failing instead of running, it is most likely the TypeScript build errors in
`bridge/src/imap.ts` flagged earlier. I can fix those typings as part of this work.

### Step 2 — Save the connection in Settings (me + you)
Once `/health` returns `{"ok":true}`:
- Server URL: `https://smart-inbox-pro-5b4c89a7-production.up.railway.app/mcp`
- Auth Token: the same `MCP_AUTH_TOKEN`
- IMAP `imap.ionos.com:993`, SMTP `smtp.ionos.com:587`
- Username `sales@johnnygoodguytv.com`, plus the mailbox password
- Click Save, then Test Connection

### Step 3 — Diagnostics so this is self-service next time
Add a **Test IMAP/SMTP** button to the self-hosted form that logs into IMAP (lists folders) and
verifies SMTP, and shows a detailed result panel: per-protocol pass/fail, the exact server error
text, and a plain-language next step (bad password, wrong port, TLS mismatch, bridge unreachable,
token mismatch). This requires a small `test_connection` tool added to the bridge plus a redeploy.

### Technical notes
- New bridge tool `test_connection` in `bridge/src/index.ts` returning `{ imap: {ok,error}, smtp: {ok,error} }` instead of throwing.
- New server function `testImapSmtp` in `src/lib/mailbox.functions.ts` that calls it over JSON-RPC with the values currently typed into the form.
- Settings UI (`src/routes/_authenticated/settings.tsx`) gains the button, result rows, and hint mapping.
- Credentials never reach the browser; only result text does.
