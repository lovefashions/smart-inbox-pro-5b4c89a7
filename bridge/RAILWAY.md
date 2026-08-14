# Deploy the Email MCP Bridge to Railway

Repo: `lovefashions/smart-inbox-pro-5b4c89a7` — the service lives in the `bridge/` folder.

## 1. Create the service
1. Go to https://railway.app and sign in with GitHub.
2. **New Project** -> **Deploy from GitHub repo**.
3. Pick `lovefashions/smart-inbox-pro-5b4c89a7` (authorize Railway for the org if prompted).

## 2. Point it at the bridge folder
1. Open the new service -> **Settings**.
2. **Source** -> **Root Directory** -> set it to `bridge` -> Save.
3. Railway now picks up `bridge/railway.json` and builds with `bridge/Dockerfile`.

## 3. Add environment variables
**Variables** tab -> **Raw Editor** -> paste and edit:

```
MCP_AUTH_TOKEN=<generate a long random string>
IONOS_EMAIL=sales@johnnygoodguytv.com
IONOS_EMAIL_PASSWORD=<mailbox password or app password>
MAILBOX_FROM=sales@johnnygoodguytv.com
IMAP_HOST=imap.ionos.com
IMAP_PORT=993
IMAP_USE_TLS=true
SMTP_HOST=smtp.ionos.com
SMTP_PORT=587
SMTP_USE_TLS=true
```

Do NOT set `PORT` — Railway injects it and the bridge binds to it on `0.0.0.0`.

## 4. Get a public URL
1. **Settings** -> **Networking** -> **Generate Domain**.
2. You get something like `https://smart-inbox-bridge-production.up.railway.app`.

## 5. Verify
```
curl https://<your-domain>/health
# {"ok":true}
```

## 6. Connect the app
In the app: **Settings -> Self-hosted**
- Custom MCP server URL: `https://<your-domain>/mcp`
- Auth token: the same `MCP_AUTH_TOKEN`
- Click **Test connection**, then **Save**.

## Troubleshooting
- Build fails: confirm Root Directory is exactly `bridge`.
- Healthcheck fails: check **Deploy Logs** for the IMAP login error.
- 401 from the app: token mismatch between Railway and app settings.
- IONOS auth error: use an app-specific password if 2FA is on.