# Email MCP Bridge

A small, self-hosted MCP bridge that connects the Shared Inbox app to an IONOS (or any IMAP/SMTP) mailbox.

## What it does

- Exposes a JSON-RPC MCP endpoint at `POST /mcp`.
- Implements `read_emails`, `draft_email`, `send_email`, and `list_folders`.
- Talks directly to your IMAP/SMTP server so the TanStack app never opens a raw TCP socket.

## Environment variables

```bash
PORT=8931
MCP_AUTH_TOKEN="a strong random token — paste this into the app Self-hosted tab"

MAILBOX_USERNAME="sales@johnnygoodguytv.com"
MAILBOX_PASSWORD="your-ionos-mailbox-password-or-app-password"
MAILBOX_FROM="Johnny Goodguy TV Sales <sales@johnnygoodguytv.com>"

IMAP_HOST="imap.ionos.com"
IMAP_PORT="993"
IMAP_USE_TLS="true"

SMTP_HOST="smtp.ionos.com"
SMTP_PORT="587"
SMTP_USE_TLS="true"
```

> IONOS does not support OAuth for IMAP/SMTP, so use the mailbox password. If you have 2FA enabled on the IONOS account, create an app-specific password in the IONOS Mail Admin panel.

## Run locally

```bash
cd bridge
bun install  # or npm install
bun run dev  # or npm run dev
```

The bridge will be available at `http://localhost:8931/mcp`.

## Test it from the app

1. Open **Settings** → **Self-hosted open-source**.
2. Set **Custom MCP server URL** to `http://localhost:8931/mcp`.
3. Set **Auth token** to the same `MCP_AUTH_TOKEN` you configured.
4. Click **Test connection**.

## Deploy to a VPS / cloud server

The bridge must run somewhere that can reach the public internet (for the app) and reach `imap.ionos.com:993` / `smtp.ionos.com:587`.

```bash
cd bridge
bun install
bun run build
PORT=8931 MCP_AUTH_TOKEN=... MAILBOX_PASSWORD=... node dist/index.js
```

For production, put it behind a reverse proxy (Nginx, Caddy, Traefik) with HTTPS. Then paste the public HTTPS URL + token into the app.

## Docker

```bash
cd bridge
docker build -t email-mcp-bridge .
docker run -p 8931:8931 \
  -e MCP_AUTH_TOKEN=... \
  -e MAILBOX_USERNAME=... \
  -e MAILBOX_PASSWORD=... \
  -e MAILBOX_FROM=... \
  email-mcp-bridge
```

## Notes

- This is a single-mailbox bridge. If you want to connect multiple mailboxes, run one instance per mailbox or add multi-tenant config support.
- The `draft_email` tool stores a copy of the draft via SMTP because IMAP/SMTP does not expose a modern drafts API. The app should treat the returned draft as the final draft to review.
- Keep the `MCP_AUTH_TOKEN` secret. The bridge rejects requests with mismatched tokens.
