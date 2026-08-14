# Test IMAP/SMTP from the Settings page

## What you get
A **Test IMAP/SMTP** button in the self-hosted connection form that actually logs into the mailbox (IMAP) and verifies the outgoing server (SMTP), then shows a clear result panel:

- Green: which folders were found on IMAP, and that SMTP accepted the login.
- Red: the exact error the mail server returned, plus a plain-language hint of what to change (wrong password, wrong port, TLS mismatch, bridge unreachable, etc.).

## How it works
1. **Bridge (`bridge/`)** — add a `test_connection` tool that:
   - connects to IMAP with the configured host/port/user/password and lists folders,
   - runs an SMTP `verify()` handshake,
   - returns per-protocol `{ ok, error }` instead of throwing, so the app can display detail.
2. **App server function** — new `testImapSmtp` in `src/lib/mailbox.functions.ts` that calls the bridge's `test_connection` over JSON-RPC using the Server URL + Auth Token currently typed in the form (no save required first).
3. **Settings UI** (`src/routes/_authenticated/settings.tsx`) — new button next to the existing MCP "Test Connection", with a result card showing:
   - IMAP row and SMTP row, each pass/fail with the raw server message,
   - a hint line mapped from common failure signatures (401 from bridge, `AUTH` failure, `ECONNREFUSED`, TLS/port mismatch, missing credentials),
   - next step text, e.g. "Set MCP_AUTH_TOKEN in Railway to match" or "IONOS requires the full email address as username".

## Notes
- Passwords stay server-side; the browser only ever sees the result text.
- You'll need to redeploy the Railway bridge after this change for the new tool to exist; until then the button will report "bridge does not expose test_connection yet" rather than a vague failure.
