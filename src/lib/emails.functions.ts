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

const listEmailsOutput = z.array(
  z.object({
    id: z.string(),
    external_id: z.string(),
    sender_name: z.string(),
    sender_email: z.string(),
    subject: z.string(),
    snippet: z.string(),
    status: z.enum(["needs_review", "draft", "approved", "sent", "archived"]),
    unread: z.boolean(),
    tags: z.array(z.string()),
    draft_html: z.string(),
    sources: z.array(z.string()),
    received_at: z.string(),
    kind: z.enum(["inbound", "outbound"]),
  }),
);

export const listEmails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as TypedSupabase;
    const organizationId = await getOrganizationId(supabase, context.userId);

    const { data, error } = await supabase
      .from("emails")
      .select("*")
      .eq("organization_id", organizationId)
      .order("received_at", { ascending: false });

    if (error) throw error;

    return listEmailsOutput.parse(data ?? []);
  });

const updateDraftSchema = z.object({
  id: z.string(),
  draftHtml: z.string(),
  status: z.enum(["needs_review", "draft", "approved", "sent", "archived"]).optional(),
});

export const updateDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => updateDraftSchema.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as TypedSupabase;
    const organizationId = await getOrganizationId(supabase, context.userId);

    const { error } = await supabase
      .from("emails")
      .update({ draft_html: data.draftHtml, status: data.status ?? "draft" })
      .eq("id", data.id)
      .eq("organization_id", organizationId);

    if (error) throw error;
    return { ok: true };
  });

const sendEmailSchema = z.object({ emailId: z.string() });

export const sendEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => sendEmailSchema.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as TypedSupabase;
    const organizationId = await getOrganizationId(supabase, context.userId);

    const { data: email } = await supabase
      .from("emails")
      .select("*")
      .eq("id", data.emailId)
      .eq("organization_id", organizationId)
      .single();

    if (!email) throw new Error("Email not found");

    const { data: connection } = await supabase
      .from("mailbox_connections")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!connection?.endpoint_url) {
      throw new Error("No mailbox connection configured");
    }

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
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "send_email",
          arguments: {
            to: [{ address: email.sender_email, name: email.sender_name }],
            subject: email.subject,
            text: (email.draft_html || "").replace(/<[^>]+>/g, " "),
            html: email.draft_html || "",
          },
        },
      }),
    });

    if (!res.ok) throw new Error(`Send failed: ${res.status}`);

    await supabase
      .from("emails")
      .update({ status: "sent", unread: false })
      .eq("id", data.emailId)
      .eq("organization_id", organizationId);

    return { ok: true };
  });

export const discardEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as TypedSupabase;
    const organizationId = await getOrganizationId(supabase, context.userId);

    const { error } = await supabase
      .from("emails")
      .update({ status: "archived", draft_html: "" })
      .eq("id", data.id)
      .eq("organization_id", organizationId);

    if (error) throw error;
    return { ok: true };
  });
