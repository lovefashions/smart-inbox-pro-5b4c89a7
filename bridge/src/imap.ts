import { ImapFlow } from "imapflow";

export interface ImapConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  useTLS?: boolean;
}

export async function listFolders(config: ImapConfig): Promise<string[]> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.useTLS ?? config.port === 993,
    auth: { user: config.username, pass: config.password },
    logger: false,
  });

  try {
    await client.connect();
    const tree = await client.list();
    return tree.map((f) => f.path);
  } finally {
    await client.logout();
  }
}

export interface FetchedEmail {
  uid: number;
  messageId: string;
  from: { name?: string; address: string };
  to: { address: string }[];
  subject: string;
  date: string;
  text: string;
  html: string;
  flags: string[];
}

export async function readEmails(
  config: ImapConfig,
  options: { folder?: string; unseenOnly?: boolean; limit?: number } = {},
): Promise<FetchedEmail[]> {
  const folder = options.folder ?? "INBOX";
  const limit = options.limit ?? 50;

  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.useTLS ?? config.port === 993,
    auth: { user: config.username, pass: config.password },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);
    try {
      const searchQuery = options.unseenOnly ? { unseen: true } : { all: true };
      const uids = await client.search(searchQuery, { uid: true });
      const selected = uids.slice(-limit).reverse();

      const results: FetchedEmail[] = [];
      for (const uid of selected) {
        const message = await client.fetchOne(uid.toString(), { source: true, envelope: true, flags: true }, { uid: true });
        if (!message.source) continue;

        const source = await message.source.toString();
        const text = extractPlainText(source);
        const html = extractHtml(source);
        const envelope = message.envelope;

        results.push({
          uid,
          messageId: envelope?.messageId ?? uid.toString(),
          from: { name: envelope?.from?.[0]?.name, address: envelope?.from?.[0]?.address ?? "" },
          to: (envelope?.to ?? []).map((a) => ({ address: a.address ?? "" })),
          subject: envelope?.subject ?? "",
          date: envelope?.date ? new Date(envelope.date).toISOString() : new Date().toISOString(),
          text,
          html,
          flags: message.flags?.size ? Array.from(message.flags) : [],
        });
      }

      return results;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}

function extractPlainText(source: string): string {
  const boundaryMatch = source.match(/boundary="([^"]+)"/);
  if (!boundaryMatch) return stripHtmlTags(source);

  const boundary = boundaryMatch[1];
  const parts = source.split(`--${boundary}`);
  for (const part of parts) {
    if (part.includes('Content-Type: text/plain')) {
      const idx = part.indexOf('\r\n\r\n');
      if (idx === -1) continue;
      return part.slice(idx + 4).trim().replace(/\r\n/g, '\n');
    }
  }
  return stripHtmlTags(source);
}

function extractHtml(source: string): string {
  const boundaryMatch = source.match(/boundary="([^"]+)"/);
  if (!boundaryMatch) return "";

  const boundary = boundaryMatch[1];
  const parts = source.split(`--${boundary}`);
  for (const part of parts) {
    if (part.includes('Content-Type: text/html')) {
      const idx = part.indexOf('\r\n\r\n');
      if (idx === -1) continue;
      return part.slice(idx + 4).trim();
    }
  }
  return "";
}

function stripHtmlTags(raw: string): string {
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
