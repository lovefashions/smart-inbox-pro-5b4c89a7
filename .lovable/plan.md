# Manual Sync + Generate Drafts Button

## What you get
One button in the sidebar: **Sync & Generate Drafts**. Pressing it pulls new mail from the bridge, then writes an AI draft reply for every email still waiting on review, and refreshes the inbox so the new drafts appear immediately.

Today the sidebar only has "Sync mailbox", and nothing generates drafts — the Pending AI Drafts queue stays empty.

## Behavior
1. Runs the existing mailbox sync (imports new messages).
2. For each email with status `needs_review` and no draft yet, generates a reply using the AI gateway, guided by:
   - The email subject and body
   - The knowledge base entries and voice profile settings already in the app
3. Saves the reply into `draft_html` and flips the email to `draft` status.
4. Shows a result line: "Imported 3, drafted 5."
5. Button shows a spinner while running and is disabled to prevent double runs.

## Technical notes
- New server function `syncAndDraft` in `src/lib/drafts.functions.ts`, auth-protected, which calls the existing sync logic then loops over pending emails.
- AI generation via the Lovable AI Gateway (`google/gemini-3-flash`), no API key needed from you.
- Batch capped (e.g. 10 emails per press) so a press stays fast and cheap.
- `src/components/inbox/AppShell.tsx` sidebar button updated to call the new function; a second smaller "Generate drafts" action is available on the Pending AI Drafts page.
- No database schema changes.
