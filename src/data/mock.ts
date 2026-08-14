export type EmailStatus = "needs_review" | "draft" | "approved" | "sent" | "archived";

export interface ThreadMessage {
  id: string;
  from: string;
  fromEmail: string;
  body: string;
  sentAt: string;
  direction: "inbound" | "outbound";
}

export interface EmailThread {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  snippet: string;
  receivedAt: string;
  status: EmailStatus;
  unread: boolean;
  messages: ThreadMessage[];
  draftHtml: string;
  sources: string[];
  kind?: "payment_reminder" | undefined;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

export interface HistoricalEmail {
  id: string;
  sourceAccount: string;
  threadSubject: string;
  bodyChunk: string;
  sentAt: string;
  included: boolean;
}

export interface VoiceProfile {
  tone: string;
  avgLength: string;
  greeting: string;
  signoff: string;
  phrases: string[];
}

export interface TagRule {
  tag: string;
  mode: "review" | "auto";
}

export type ConnectionMode = "managed" | "self_hosted";

export interface McpSettings {
  mode: ConnectionMode;
  managed: {
    providerName: string;
    endpointUrl: string;
    apiKey: string;
  };
  selfHosted: {
    serverUrl: string;
    authToken: string;
    imapHost: string;
    imapPort: string;
    smtpHost: string;
    smtpPort: string;
    username: string;
    password: string;
  };
}

export interface AgentKey {
  id: string;
  label: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
}

export interface AppSettings {
  mcp: McpSettings;
  fromName: string;
  fromEmail: string;
  signature: string;
  tagRules: TagRule[];
  paypalLink: string;
  paymentRemindersEnabled: boolean;
  reminderAfterDays: number;
  agentKeys: AgentKey[];
}

export const MCP_TOOLS = [
  { name: "read_emails", description: "Fetch unread messages from the connected mailbox." },
  { name: "draft_email", description: "Create a draft reply on the connected mailbox." },
  { name: "send_email", description: "Send an approved reply." },
  { name: "list_folders", description: "List mailbox folders available for scanning." },
];

export const EXPORTED_TOOLS = [
  {
    name: "get_pending_drafts",
    description: "List AI drafts waiting for human review, with subject, sender and draft text.",
    readOnly: true,
  },
  {
    name: "approve_and_send_draft",
    description: "Approve a pending draft by id and send it to the original sender.",
    readOnly: false,
  },
  {
    name: "query_rag_history",
    description: "Search indexed past replies and knowledge base entries by topic.",
    readOnly: true,
  },
];

export const mockThreads: EmailThread[] = [
  {
    id: "t1",
    sender: "Dana Whitfield",
    senderEmail: "dana@northlinegoods.com",
    subject: "[REFUND] Order #40213 arrived damaged",
    snippet: "The box was crushed on delivery and two mugs were broken...",
    receivedAt: "2026-08-13T14:02:00Z",
    status: "draft",
    unread: true,
    messages: [
      {
        id: "m1",
        from: "Dana Whitfield",
        fromEmail: "dana@northlinegoods.com",
        direction: "inbound",
        sentAt: "2026-08-13T14:02:00Z",
        body: "Hi, the box was crushed on delivery and two mugs were broken. Order #40213. I'd like a refund for the damaged items — photos attached.",
      },
    ],
    draftHtml:
      "<p>Hi Dana,</p><p>I'm sorry your order arrived in that state — that's not the unboxing we want for anyone. I've approved a refund for the two damaged mugs on order #40213; it should land back on your original payment method within 3–5 business days.</p><p>No need to return the broken pieces. If anything else in the box looks off, just reply here and I'll sort it out.</p><p>Best,<br/>Sam</p>",
    sources: ["KB: Damaged goods policy", "Past reply: 'Order #38771 refund' (Mar 2026)"],
  },
  {
    id: "t2",
    sender: "Accounts — Bright Studio",
    senderEmail: "billing@brightstudio.io",
    subject: "[PAYMENT] Invoice INV-2291 still outstanding",
    snippet: "Our records show invoice INV-2291 is 18 days past due...",
    receivedAt: "2026-08-13T09:41:00Z",
    status: "draft",
    unread: true,
    kind: "payment_reminder",
    messages: [
      {
        id: "m2",
        from: "Accounts — Bright Studio",
        fromEmail: "billing@brightstudio.io",
        direction: "inbound",
        sentAt: "2026-08-13T09:41:00Z",
        body: "Hello, our records show invoice INV-2291 ($1,480.00) is 18 days past due. Could you confirm the payment status?",
      },
    ],
    draftHtml:
      "<p>Hi there,</p><p>Thanks for the nudge on INV-2291 ($1,480.00). Payment is going out today — you can also settle or confirm it directly here:</p><p><a href=\"https://paypal.me/sharedinbox/1480\">Pay INV-2291 via PayPal</a></p><p>Please reference <strong>INV-2291</strong> in the payment note so it reconciles automatically. Apologies for the delay.</p><p>Best,<br/>Sam</p>",
    sources: ["Rule: Payment reminder workflow", "Setting: PayPal payment link"],
  },
  {
    id: "t3",
    sender: "Marcus Lee",
    senderEmail: "marcus.lee@fieldwork.co",
    subject: "#URGENT !ESCALATE Site down since 3am",
    snippet: "Our dashboard has been unreachable since roughly 3am UTC...",
    receivedAt: "2026-08-13T06:15:00Z",
    status: "needs_review",
    unread: true,
    messages: [
      {
        id: "m3",
        from: "Marcus Lee",
        fromEmail: "marcus.lee@fieldwork.co",
        direction: "inbound",
        sentAt: "2026-08-13T06:15:00Z",
        body: "Our dashboard has been unreachable since roughly 3am UTC. This is blocking our morning reporting. Please escalate.",
      },
    ],
    draftHtml:
      "<p>Hi Marcus,</p><p>Thanks for flagging this — I've escalated it to our on-call engineer and we're actively investigating the dashboard outage.</p><p>I'll send you an update within the hour, and sooner if we resolve it before then.</p><p>Best,<br/>Sam</p>",
    sources: ["KB: Incident escalation ladder"],
  },
  {
    id: "t4",
    sender: "Priya Raman",
    senderEmail: "priya@harborcraft.com",
    subject: "Question about bulk pricing",
    snippet: "We're looking at around 250 units per quarter — is there a tier...",
    receivedAt: "2026-08-12T17:20:00Z",
    status: "draft",
    unread: false,
    messages: [
      {
        id: "m4",
        from: "Priya Raman",
        fromEmail: "priya@harborcraft.com",
        direction: "inbound",
        sentAt: "2026-08-12T17:20:00Z",
        body: "We're looking at around 250 units per quarter — is there a tier for that volume, and how does shipping work at that scale?",
      },
    ],
    draftHtml:
      "<p>Hi Priya,</p><p>250 units a quarter puts you in our tier 2 bracket — that's 18% off list, with freight quoted per shipment rather than flat-rated.</p><p>Happy to put together a proper quote if you can share your delivery city and preferred cadence.</p><p>Best,<br/>Sam</p>",
    sources: ["KB: Volume pricing tiers", "Past reply: 'Bulk order — Coastline' (Jan 2026)"],
  },
  {
    id: "t5",
    sender: "Tomas Vidal",
    senderEmail: "tomas@vidalconsult.es",
    subject: "[PAYMENT] Overdue notice — subscription renewal failed",
    snippet: "The card on file was declined for the August renewal...",
    receivedAt: "2026-08-12T11:05:00Z",
    status: "needs_review",
    unread: false,
    kind: "payment_reminder",
    messages: [
      {
        id: "m5",
        from: "Tomas Vidal",
        fromEmail: "tomas@vidalconsult.es",
        direction: "inbound",
        sentAt: "2026-08-12T11:05:00Z",
        body: "The card on file was declined for the August renewal. What are my options to pay?",
      },
    ],
    draftHtml:
      "<p>Hi Tomas,</p><p>No problem at all — the August renewal ($240.00) can be settled with the link below, and your account stays active in the meantime:</p><p><a href=\"https://paypal.me/sharedinbox/240\">Pay renewal via PayPal</a></p><p>If you'd rather update the card on file instead, reply here and I'll send a secure link.</p><p>Best,<br/>Sam</p>",
    sources: ["Rule: Payment reminder workflow", "KB: Failed renewal handling"],
  },
];

export const mockKnowledge: KnowledgeEntry[] = [
  {
    id: "k1",
    title: "Damaged goods policy",
    content:
      "Refund damaged items within 30 days of delivery without requiring a return. Photos are appreciated but not mandatory. Refunds go back to the original payment method in 3–5 business days.",
    tags: ["REFUND"],
  },
  {
    id: "k2",
    title: "Volume pricing tiers",
    content:
      "Tier 1: 100–249 units, 12% off list. Tier 2: 250–749 units, 18% off. Tier 3: 750+ units, negotiated. Freight is quoted per shipment above tier 1.",
    tags: [],
  },
  {
    id: "k3",
    title: "Payment reminder workflow",
    content:
      "For unpaid invoices and overdue notices: acknowledge the balance, restate the invoice number and amount, include the PayPal payment link from Settings, and ask the payer to reference the invoice number in the payment note. Never threaten service suspension in the first reminder.",
    tags: ["PAYMENT"],
  },
  {
    id: "k4",
    title: "Incident escalation ladder",
    content:
      "Anything tagged !ESCALATE goes to on-call within 15 minutes. Always acknowledge within the hour and commit to an update window rather than a fix time.",
    tags: ["URGENT", "ESCALATE"],
  },
];

export const mockHistorical: HistoricalEmail[] = [
  {
    id: "h1",
    sourceAccount: "sam@sharedinbox.co",
    threadSubject: "Order #38771 refund",
    bodyChunk: "Sorry about that — I've refunded the two items, no need to send anything back.",
    sentAt: "2026-03-04T10:12:00Z",
    included: true,
  },
  {
    id: "h2",
    sourceAccount: "sam@sharedinbox.co",
    threadSubject: "Bulk order — Coastline",
    bodyChunk: "That volume lands you in tier 2, so 18% off list. Freight quoted per shipment.",
    sentAt: "2026-01-22T15:48:00Z",
    included: true,
  },
  {
    id: "h3",
    sourceAccount: "sam@sharedinbox.co",
    threadSubject: "Re: Late invoice",
    bodyChunk: "Payment's going out today — here's the link if it's easier to settle directly.",
    sentAt: "2026-02-11T08:30:00Z",
    included: true,
  },
  {
    id: "h4",
    sourceAccount: "sam@sharedinbox.co",
    threadSubject: "Holiday hours",
    bodyChunk: "We're closed the 24th through the 2nd, replies resume the 3rd.",
    sentAt: "2025-12-18T09:00:00Z",
    included: false,
  },
];

export const mockVoice: VoiceProfile = {
  tone: "Warm, direct, lightly informal. Owns mistakes quickly without over-apologising.",
  avgLength: "68 words",
  greeting: "Hi {first_name},",
  signoff: "Best,\nSam",
  phrases: ["no need to send anything back", "happy to sort that out", "I'll follow up by"],
};

export const defaultSettings: AppSettings = {
  mcp: {
    mode: "self_hosted",
    managed: {
      providerName: "Agently",
      endpointUrl: "https://mcp.agently.com/email/v1",
      apiKey: "",
    },
    selfHosted: {
      serverUrl: "http://localhost:8931/mcp",
      authToken: "",
      imapHost: "imap.ionos.com",
      imapPort: "993",
      smtpHost: "smtp.ionos.com",
      smtpPort: "587",
      username: "sales@johnnygoodguytv.com",
      password: "",
    },
  },
  fromName: "Johnny Goodguy TV Sales",
  fromEmail: "sales@johnnygoodguytv.com",
  signature: "Sales — Johnny Goodguy TV",
  tagRules: [
    { tag: "URGENT", mode: "review" },
    { tag: "REFUND", mode: "review" },
    { tag: "PAYMENT", mode: "review" },
    { tag: "ESCALATE", mode: "review" },
  ],
  paypalLink: "https://paypal.me/sharedinbox",
  paymentRemindersEnabled: true,
  reminderAfterDays: 7,
  agentKeys: [
    {
      id: "ak1",
      label: "Claude Desktop — Sam",
      key: "sk_mcp_9f4c2b71ae0d4c8fa1e6",
      createdAt: "2026-07-30T12:00:00Z",
      lastUsed: "2026-08-12T19:22:00Z",
    },
  ],
};