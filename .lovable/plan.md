# Cloudflare Email Routing -> mail intake endpoint

Right now the app only has one inbound path: the self-hosted IMAP bridge in `bridge/`, called by `syncMailbox` in `src/lib/sync.functions.ts`. There is no `src/routes/api/` folder yet, so no intake endpoint exists. That is why nothing is arriving — the bridge has to be deployed and running.

The Cloudflare route removes that requirement entirely: mail is pushed to the app instead of the app pulling it. No server to host, no IMAP socket.

## How it works

```text
sender -> MX (Cloudflare) -> Email Worker -> POST /api/public/email-intake -> emails table -> inbox UI
```

## What gets built

1. **Intake endpoint** at `src/routes/api/public/email-intake.ts`
   - Accepts the raw MIME message posted by the Cloudflare Email Worker.
   - Rejects anything without the correct shared secret header (stored as a project secret, timing-safe compare).
   - Parses sender, recipient, subject, text/HTML body, Message-ID, In-Reply-To.
   - Deduplicates on Message-ID, then writes an `emails` row plus its first `email_messages` row, exactly as the bridge sync does today.
   - Runs tag parsing (`src/lib/tags.ts`) so `#URGENT` / `[REFUND]` pills work on arrival.

2. **Cloudflare Email Worker script** committed under `cloudflare/email-worker/` with a short setup guide: enable Email Routing on johnnygoodguytv.com, add the Worker, route `sales@johnnygoodguytv.com` to it, set the endpoint URL + shared secret as Worker vars.

3. **Settings update** — add an "Email intake" panel showing the endpoint URL to paste into the Worker and the intake secret status, alongside the existing Self-hosted/Managed tabs. The IMAP bridge stays as-is, unused unless you deploy it.

## Trade-offs you should know before approving

- **Receiving:** fully solved, nothing to host.
- **Sending:** Cloudflare Email Routing cannot send. Approve & Send and billing reminders still need an outbound path — either the IONOS SMTP bridge, or Lovable's built-in email sending (requires verifying johnnygoodguytv.com as a sender domain here). I'd recommend the latter so you never host anything.
- **MX change:** the domain's MX records move from IONOS to Cloudflare. The IONOS mailbox stops receiving new mail from that point on.

## Open question

Which outbound path do you want alongside this — Lovable managed sending (verify the domain, nothing to host) or keep the IONOS SMTP bridge for sending only?

## Technical details

- Public route under `src/routes/api/public/*` so Cloudflare can reach it unauthenticated; the handler verifies the shared secret itself.
- Zod validation on the posted payload; size cap on the raw MIME body.
- Writes use `supabaseAdmin`, imported inside the handler after secret verification.
- No new tables — reuses `emails` and `email_messages`.
