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

const mcpSchema = z.object({
  mode: z.enum(["managed", "self_hosted"]),
  managed: z.object({
    providerName: z.string(),
    endpointUrl: z.string(),
    apiKey: z.string(),
  }),
  selfHosted: z.object({
    serverUrl: z.string(),
    authToken: z.string(),
    imapHost: z.string(),
    imapPort: z.string(),
    smtpHost: z.string(),
    smtpPort: z.string(),
    username: z.string(),
    password: z.string(),
  }),
});

const updateSchema = z.object({
  mcp: mcpSchema,
  fromName: z.string(),
  fromEmail: z.string().email(),
  signature: z.string(),
  tagRules: z.array(z.object({ tag: z.string(), mode: z.enum(["review", "auto"]) })),
  paypalLink: z.string(),
  paymentRemindersEnabled: z.boolean(),
  reminderAfterDays: z.number().int(),
});

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as TypedSupabase;
    const organizationId = await getOrganizationId(supabase, context.userId);

    const [{ data: appSettings }, { data: mailbox }] = await Promise.all([
      supabase.from("app_settings").select("*").eq("organization_id", organizationId).maybeSingle(),
      supabase.from("mailbox_connections").select("*").eq("organization_id", organizationId).maybeSingle(),
    ]);

    return {
      organizationId,
      appSettings: appSettings ?? null,
      mailbox: mailbox ?? null,
    };
  });

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as TypedSupabase;
    const organizationId = await getOrganizationId(supabase, context.userId);

    const {
      mcp,
      fromName,
      fromEmail,
      signature,
      tagRules,
      paypalLink,
      paymentRemindersEnabled,
      reminderAfterDays,
    } = data;

    const { error: appSettingsError } = await supabase.from("app_settings").upsert(
      {
        organization_id: organizationId,
        from_name: fromName,
        from_email: fromEmail,
        signature,
        tag_rules: tagRules as unknown as Database["public"]["Tables"]["app_settings"]["Insert"]["tag_rules"],
        paypal_link: paypalLink,
        payment_reminders_enabled: paymentRemindersEnabled,
        reminder_after_days: reminderAfterDays,
      },
      { onConflict: "organization_id" },
    );

    if (appSettingsError) throw appSettingsError;

    const { error: mailboxError } = await supabase.from("mailbox_connections").upsert(
      {
        organization_id: organizationId,
        provider_mode: mcp.mode,
        provider_name: mcp.mode === "managed" ? mcp.managed.providerName : "Self-hosted",
        endpoint_url: mcp.mode === "managed" ? mcp.managed.endpointUrl : mcp.selfHosted.serverUrl,
        auth_token: mcp.mode === "managed" ? mcp.managed.apiKey : mcp.selfHosted.authToken,
        imap_host: mcp.selfHosted.imapHost,
        imap_port: mcp.selfHosted.imapPort,
        smtp_host: mcp.selfHosted.smtpHost,
        smtp_port: mcp.selfHosted.smtpPort,
        username: mcp.selfHosted.username,
        password: mcp.selfHosted.password,
        is_active: true,
      },
      { onConflict: "organization_id" },
    );

    if (mailboxError) throw mailboxError;

    return { ok: true, organizationId };
  });
