# AI Email Reply Assistant — Shared Inbox (Phase 1: UI with mock data)

Build the full three-pane shared inbox front end with realistic mock data, including a "Learn from a mailbox" flow so the assistant can study a second email account's past replies and imitate that voice. No backend yet — every screen runs on local state so you can click through and judge the feel.

## Screens

**App shell (left sidebar)**
Inbox, Pending AI Drafts, Sent, Knowledge Base, Voice Training, Settings. Unread/pending counts on the relevant items. Clean, minimal, neutral palette with one accent color; compact type; keyboard-friendly.

**Inbox (three panes)**
- Middle: scrollable email list — sender, subject, snippet, timestamp, status badge (AI Draft Ready / Needs Review / Sent), plus colored tag pills parsed from subject/body (`#URGENT`, `[REFUND]`, `[PAYMENT]`, `!ESCALATE`). Search box and a tag filter bar above the list.
- Right: selected thread rendered top to bottom (each message with sender, time, body), and below it a bordered "AI Draft Response" card.

**AI Draft card**
- Rich-text editor (bold, italic, underline, bullet/numbered list, link) with the draft prefilled.
- Buttons: Approve & Send, Discard, and a Quick Actions dropdown — Make shorter, Make more professional, Make friendlier, Add apology, Regenerate. In phase 1 these transform the mock draft locally so the interaction is real.
- A "Sources" strip showing which knowledge-base entries and which past emails the draft imitated (mocked), so the learning loop is visible in the UI.
- Approve & Send moves the email to Sent and marks the thread resolved.

**Voice Training (the "scan another email" feature)**
- Connect a mailbox to learn from: pick provider (Gmail / Outlook / IMAP), enter the address, choose how far back to scan and which folders (Sent is the default — sent mail is where your voice lives).
- A scan progress view: messages scanned, threads indexed, snippets extracted.
- A "Learned voice profile" summary: tone, average reply length, greeting and sign-off patterns, common phrases — all editable so you can correct what it inferred.
- A list of indexed past threads with a toggle to exclude any from training.
- Mocked in phase 1 with a simulated scan; the same screens wire directly to the real indexing job later.

**Knowledge Base**
List of entries (title + body) with add/edit/delete, a large textarea for business rules like return policies, and tag labels so entries can be scoped to specific email tags.

**Settings**
OpenAI API key field (masked, with show/hide), Gmail connect card with connected/disconnected state, sending identity (from name/address, signature), and per-tag automation rules: for each tag choose Draft for review or Auto-send. Default everything to review; auto-send is opt-in per tag.

**Sent**
Simple list of sent replies with the original subject and the final text.

## Data shape (mock now, matches the future tables)

- `emails`: id, thread_id, sender, sender_email, subject, body, snippet, received_at, status, tags[]
- `messages`: id, thread_id, from, body, sent_at, direction
- `drafts`: id, email_id, content_html, generated_at, sources[]
- `knowledge_base`: id, title, content_text, tags[]
- `historical_emails`: id, source_account, thread_subject, body_chunk, sent_at, included_in_training
- `voice_profile`: tone, avg_length, greeting, signoff, phrases[]
- `settings`: openai_key_set, gmail_connected, from_name, from_email, signature, tag_rules[]

## Technical notes

- TanStack Start routes: `/` (inbox, replaces the placeholder), `/drafts`, `/sent`, `/knowledge`, `/training`, `/settings`. Shared sidebar layout via a pathless layout route.
- shadcn/ui + Tailwind; all colors as semantic tokens in `src/styles.css` — no hardcoded color utilities.
- Mock data in `src/data/mock.ts`; app state in a single React context provider so selections, edits, sends, and settings persist while navigating between pages.
- Rich text: lightweight `contentEditable` toolbar (no heavy dependency) unless you want full TipTap later.
- Tag parsing runs as a small regex utility now, and the same utility is reused server-side in phase 2.
- Per-route `head()` metadata with unique titles/descriptions.

## Phase 2 (after you approve the look)

Enable Lovable Cloud, create the tables above with RLS and grants, enable `pgvector`, and add the server logic: mailbox scan and embedding of past sent mail, tag routing with per-tag templates and auto-send rules, retrieval of the top matching past threads at draft time, and re-embedding of every approved reply so the assistant keeps getting closer to your voice.
