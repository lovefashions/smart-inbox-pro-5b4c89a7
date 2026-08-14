import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type TypedSupabase = SupabaseClient<Database>;

async function getOrganizationId(supabase: TypedSupabase, userId: string): Promise<string> {
  const { data: memberships } = await supabase
    .from("user_organizations")
    .select("organization_id")
    .limit(1);

  const membership = memberships?.[0];
  if (membership?.organization_id) return membership.organization_id;

  const { data: org } = await supabase
    .from("organizations")
    .insert({ name: "My Shared Inbox" })
    .select("id")
    .single();

  if (!org?.id) throw new Error("Could not create organization");

  await supabase.from("user_organizations").insert({
    user_id: userId,
    organization_id: org.id,
    role: "owner",
  });

  return org.id;
}

async function getMailboxConnection(supabase: TypedSupabase, organizationId: string) {
  const { data } = await supabase
    .from("mailbox_connections")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  return data;
}

async function mcpCall(
  connection: { endpoint_url: string; auth_token: string | null },
  method: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (connection.auth_token) {
    headers["Authorization"] = `Bearer ${connection.auth_token}`;
  }

  const res = await fetch(connection.endpoint_url, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`MCP server returned ${res.status}: ${text.slice(0, 200)}`);
  }

  const jsonText = text.includes("data:")
    ? (text.split("\n").find((l) => l.startsWith("data:")) ?? "").slice(5).trim()
    : text;

  const parsed = JSON.parse(jsonText) as { result?: unknown; error?: { message?: string } };
  if (parsed.error) {
    throw new Error(parsed.error.message ?? "MCP server error");
  }
  return parsed.result;
}

const syncResultSchema = z.object({
  content: z.array(z.object({ type: z.literal("text"), text: z.string() })),
});

const fetchedEmailSchema = z.array(
  z.object({
    uid: z.number(),
    messageId: z.string(),
    from: z.object({ name: z.string().optional(), address: z.string() }),
    to: z.array(z.object({ address: z.string() })),
    subject: z.string(),
    date: z.string(),
    text: z.string(),
    html: z.string(),
    flags: z.array(z.string()),
  }),
);

export const syncMailbox = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as TypedSupabase;
    const organizationId = await getOrganizationId(supabase, context.userId);
    const connection = await getMailboxConnection(supabase, organizationId);

    if (!connection?.endpoint_url) {
      return { ok: false, imported: 0, message: "No mailbox connection configured." };
    }

    try {
      const result = await mcpCall(connection, "tools/call", {
        name: "read_emails",
        arguments: { folder: "INBOX", unseenOnly: true, limit: 50 },
      });

      const parsed = syncResultSchema.parse(result);
      const rawText = parsed.content[0]?.text ?? "[]";
      const emails = fetchedEmailSchema.parse(JSON.parse(rawText));

      let imported = 0;
      for (const email of emails) {
        const externalId = email.messageId || email.uid.toString();
        const { data: existing } = await supabase
          .from("emails")
          .select("id")
          .eq("external_id", externalId)
          .eq("organization_id", organizationId)
          .maybeSingle();

        if (existing) continue;

        const { data: emailRow, error: emailError } = await supabase
          .from("emails")
          .insert({
            organization_id: organizationId,
            external_id: externalId,
            sender_name: email.from.name || email.from.address,
            sender_email: email.from.address,
            subject: email.subject,
            snippet: email.text.slice(0, 200).replace(/\n/g, " "),
            body: email.text,
            status: "needs_review",
            unread: true,
            kind: "inbound",
            received_at: email.date,
            draft_html: "",
            sources: [],
          })
          .select("id")
          .single();

        if (emailError || !emailRow) continue;

        await supabase.from("email_messages").insert({
          email_id: emailRow.id,
          organization_id: organizationId,
          from_name: email.from.name || "",
          from_email: email.from.address,
          direction: "inbound",
          body: email.text,
          sent_at: email.date,
        });

        imported += 1;
      }

      return { ok: true, imported, message: `Imported ${imported} new message(s).` };
    } catch (err) {
      return {
        ok: false,
        imported: 0,
        message: err instanceof Error ? err.message : "Sync failed.",
      };
    }
  });
