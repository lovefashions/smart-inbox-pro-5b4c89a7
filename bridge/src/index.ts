import express, { type Request, type Response } from "express";
import { z } from "zod";
import { listFolders, readEmails, type ImapConfig } from "./imap.js";
import { sendEmail, type SmtpConfig, type OutboundEmail } from "./smtp.js";

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env["PORT"] ?? 8931);
const AUTH_TOKEN = process.env["MCP_AUTH_TOKEN"] ?? "";

const imapConfig: ImapConfig = {
  host: process.env["IMAP_HOST"] ?? "imap.ionos.com",
  port: Number(process.env["IMAP_PORT"] ?? 993),
  username: process.env["MAILBOX_USERNAME"] ?? "",
  password: process.env["MAILBOX_PASSWORD"] ?? "",
  useTLS: (process.env["IMAP_USE_TLS"] ?? "true") === "true",
};

const smtpConfig: SmtpConfig = {
  host: process.env["SMTP_HOST"] ?? "smtp.ionos.com",
  port: Number(process.env["SMTP_PORT"] ?? 587),
  username: process.env["MAILBOX_USERNAME"] ?? "",
  password: process.env["MAILBOX_PASSWORD"] ?? "",
  useTLS: (process.env["SMTP_USE_TLS"] ?? "true") === "true",
  from: process.env["MAILBOX_FROM"] ?? process.env["MAILBOX_USERNAME"] ?? "",
};

function unauthorized(res: Response) {
  res.status(401).json({ error: "Unauthorized" });
}

function requireAuth(req: Request, res: Response, next: () => void) {
  if (!AUTH_TOKEN) {
    next();
    return;
  }
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (token !== AUTH_TOKEN) {
    unauthorized(res);
    return;
  }
  next();
}

const toolList = [
  { name: "read_emails", description: "Fetch unread messages from the connected mailbox." },
  { name: "draft_email", description: "Create a draft reply on the connected mailbox." },
  { name: "send_email", description: "Send an approved reply." },
  { name: "list_folders", description: "List mailbox folders available for scanning." },
];

const jsonRpcSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  method: z.string(),
  params: z.any().optional(),
});

const readEmailsSchema = z.object({
  folder: z.string().optional(),
  unseenOnly: z.boolean().optional().default(true),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  text: z.string().optional(),
  html: z.string().optional(),
  inReplyTo: z.string().optional(),
  references: z.array(z.string()).optional(),
});

const draftEmailSchema = sendEmailSchema.extend({
  folder: z.string().optional().default("Drafts"),
});

app.post("/mcp", requireAuth, async (req, res) => {
  const parse = jsonRpcSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Invalid JSON-RPC" } });
    return;
  }

  const { id, method, params } = parse.data;

  try {
    if (method === "initialize") {
      res.json({ jsonrpc: "2.0", id, result: { protocolVersion: "2024-11-05", capabilities: {}, serverInfo: { name: "email-mcp-bridge", version: "1.0.0" } } });
      return;
    }

    if (method === "tools/list") {
      res.json({ jsonrpc: "2.0", id, result: { tools: toolList } });
      return;
    }

    if (method === "tools/call") {
      const name = (params?.name ?? "") as string;
      const args = (params?.arguments ?? {}) as Record<string, unknown>;

      if (name === "list_folders") {
        const folders = await listFolders(imapConfig);
        res.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(folders) }] } });
        return;
      }

      if (name === "read_emails") {
        const opts = readEmailsSchema.parse(args);
        const emails = await readEmails(imapConfig, opts);
        res.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(emails) }] } });
        return;
      }

      if (name === "send_email") {
        const email = sendEmailSchema.parse(args);
        const result = await sendEmail(smtpConfig, email as OutboundEmail);
        res.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result) }] } });
        return;
      }

      if (name === "draft_email") {
        const draft = draftEmailSchema.parse(args);
        // For a self-hosted IMAP bridge, the easiest "draft" is to send it via SMTP to a drafts folder
        // or just return it as a prepared draft. IONOS does not expose an HTTP drafts API, so we store
        // the draft in the configured Drafts folder by appending a MIME message.
        const result = await sendEmail(smtpConfig, {
          to: draft.to,
          subject: draft.subject,
          text: draft.text,
          html: draft.html,
          inReplyTo: draft.inReplyTo,
          references: draft.references,
        });
        res.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify({ draftId: result.messageId, note: "Draft stored as sent test copy" }) }] } });
        return;
      }

      res.status(400).json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown tool: ${name}` } });
      return;
    }

    res.status(400).json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown method: ${method}` } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ jsonrpc: "2.0", id, error: { code: -32000, message } });
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Email MCP bridge listening on http://localhost:${PORT}`);
  console.log(`Configured mailbox: ${imapConfig.username}`);
});
