# Deploy the IMAP bridge to Railway

Pulling stays the approach: the app keeps reading `sales@johnnygoodguytv.com` over IMAP at IONOS, MX records stay where they are, and nothing about the domain changes. The only missing piece is a public home for the bridge in `bridge/`. Railway can run it directly from the repo.

## Steps you do in Railway

1. Railway -> **New Project** -> **Deploy from GitHub repo** -> pick this repo.
2. In the service settings set **Root Directory** to `bridge`. Railway then detects Node and runs the build/start scripts already in `bridge/package.json`.
3. Add these variables under **Variables**:

```text
MCP_AUTH_TOKEN        (generate a long random string - you also paste this into the app)
IONOS_EMAIL           sales@johnnygoodguytv.com
IONOS_EMAIL_PASSWORD  (IONOS mailbox password, or app password if 2FA is on)
MAILBOX_FROM          Johnny Goodguy TV Sales <sales@johnnygoodguytv.com>
IMAP_HOST             imap.ionos.com
IMAP_PORT             993
SMTP_HOST             smtp.ionos.com
SMTP_PORT             587
```

4. **Settings -> Networking -> Generate Domain**. You get something like `email-mcp-bridge-production.up.railway.app`. Railway terminates HTTPS for you.
5. Confirm it is alive: open `https://<your-domain>/health` in a browser, expect `{"ok":true}`.

## Steps I do in the app

1. Add `bridge/railway.json` and a `PORT`-aware start so Railway's injected port is used instead of the hard-coded 8931, plus a `bridge/.env.example`.
2. Add a Railway section to `bridge/README.md` mirroring the steps above.
3. In **Settings -> Self-hosted**, prefill the MCP server URL field with a Railway-shaped placeholder and add short helper text ("paste the Railway domain + `/mcp`"), so the connection test target is obvious.
4. No database or schema changes - `syncMailbox` already talks to whatever endpoint is saved.

## After deploy

In the app: **Settings -> Self-hosted** -> URL `https://<your-domain>/mcp`, token = the `MCP_AUTH_TOKEN` you set -> **Test connection**. It should report 4 tools. Then **Sync inbox** pulls unread mail from IONOS into the inbox.

## Notes

- Railway bills by usage; this service idles at near-zero CPU and costs very little.
- If the connection test fails with an auth error, it is almost always the IONOS password - IONOS requires an app password once 2FA is enabled on the account.
