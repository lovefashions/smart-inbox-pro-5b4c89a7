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

export const listSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as TypedSupabase;
    const organizationId = await getOrganizationId(supabase, context.userId);

    const [{ data: subs, error }, { data: settings }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("organization_id", organizationId)
        .order("renewal_date", { ascending: true }),
      supabase
        .from("app_settings")
        .select("paypal_link, reminder_after_days, payment_reminders_enabled")
        .eq("organization_id", organizationId)
        .maybeSingle(),
    ]);

    if (error) throw error;

    return {
      subscriptions: subs ?? [],
      settings: {
        paypalLink: settings?.paypal_link ?? "",
        reminderAfterDays: settings?.reminder_after_days ?? 7,
        remindersEnabled: settings?.payment_reminders_enabled ?? false,
      },
    };
  });

const subscriptionInput = z.object({
  id: z.string().optional(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  planName: z.string(),
  amount: z.number(),
  currency: z.string().default("USD"),
  renewalDate: z.string(),
  billingPeriod: z.enum(["monthly", "quarterly", "yearly"]),
  status: z.enum(["active", "past_due", "canceled"]),
  notes: z.string().optional(),
});

export const saveSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => subscriptionInput.parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as TypedSupabase;
    const organizationId = await getOrganizationId(supabase, context.userId);

    const row = {
      organization_id: organizationId,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      plan_name: data.planName,
      amount: data.amount,
      currency: data.currency,
      renewal_date: data.renewalDate,
      billing_period: data.billingPeriod,
      status: data.status,
      notes: data.notes ?? null,
    };

    if (data.id) {
      const { error } = await supabase
        .from("subscriptions")
        .update(row)
        .eq("id", data.id)
        .eq("organization_id", organizationId);
      if (error) throw error;
      return { ok: true, id: data.id };
    }

    const { data: inserted, error } = await supabase
      .from("subscriptions")
      .insert(row)
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: inserted.id };
  });

export const deleteSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as TypedSupabase;
    const organizationId = await getOrganizationId(supabase, context.userId);
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", data.id)
      .eq("organization_id", organizationId);
    if (error) throw error;
    return { ok: true };
  });

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function buildReminder(
  sub: Database["public"]["Tables"]["subscriptions"]["Row"],
  opts: { paypalLink: string; fromName: string; signature: string },
) {
  const amount = money(Number(sub.amount), sub.currency);
  const name = sub.customer_name?.trim() || "there";
  const plan = sub.plan_name?.trim() || "your subscription";
  const due = new Date(`${sub.renewal_date}T00:00:00Z`);
  const dueLabel = due.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  const overdue = due.getTime() < Date.now();

  const subject = overdue
    ? `[PAYMENT] ${plan} renewal past due — ${amount}`
    : `[PAYMENT] ${plan} renews ${dueLabel} — ${amount}`;

  const payBlock = opts.paypalLink
    ? `<p><a href="${opts.paypalLink}">Renew / pay ${amount} here</a></p>`
    : "";

  const html = [
    `<p>Hi ${name},</p>`,
    overdue
      ? `<p>Quick reminder that the ${plan} renewal of <strong>${amount}</strong> was due on ${dueLabel} and is still outstanding.</p>`
      : `<p>Heads up — your ${plan} subscription renews on <strong>${dueLabel}</strong> for <strong>${amount}</strong>.</p>`,
    payBlock,
    `<p>If you've already taken care of it, thanks — you can ignore this note. Any questions about the plan or billing, just reply here.</p>`,
    `<p>${opts.signature ? opts.signature.replace(/\n/g, "<br/>") : `Best,<br/>${opts.fromName}`}</p>`,
  ]
    .filter(Boolean)
    .join("");

  return { subject, html };
}

const queueSchema = z.object({ ids: z.array(z.string()).optional(), dueOnly: z.boolean().optional() });

export const queueReminders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => queueSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as TypedSupabase;
    const organizationId = await getOrganizationId(supabase, context.userId);

    const { data: settings } = await supabase
      .from("app_settings")
      .select("paypal_link, reminder_after_days, from_name, signature")
      .eq("organization_id", organizationId)
      .maybeSingle();

    let query = supabase
      .from("subscriptions")
      .select("*")
      .eq("organization_id", organizationId)
      .neq("status", "canceled");

    if (data.ids?.length) query = query.in("id", data.ids);

    const { data: subs, error } = await query;
    if (error) throw error;

    const leadDays = settings?.reminder_after_days ?? 7;
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() + leadDays);

    const targets = (subs ?? []).filter((s) => {
      if (data.ids?.length) return true;
      if (!data.dueOnly) return true;
      return new Date(`${s.renewal_date}T00:00:00Z`).getTime() <= cutoff.getTime();
    });

    let queued = 0;
    for (const sub of targets) {
      const { subject, html } = buildReminder(sub, {
        paypalLink: settings?.paypal_link ?? "",
        fromName: settings?.from_name ?? "",
        signature: settings?.signature ?? "",
      });

      const { error: insertError } = await supabase.from("emails").insert({
        organization_id: organizationId,
        external_id: `reminder-${sub.id}-${sub.renewal_date}-${sub.reminder_count}`,
        sender_name: sub.customer_name || sub.customer_email,
        sender_email: sub.customer_email,
        subject,
        snippet: `Renewal reminder for ${sub.plan_name || "subscription"}`,
        body: "",
        status: "draft",
        unread: true,
        kind: "outbound",
        draft_html: html,
        sources: ["Billing: subscription renewal", "Setting: PayPal payment link"],
        received_at: new Date().toISOString(),
      });

      if (!insertError) {
        queued += 1;
        await supabase
          .from("subscriptions")
          .update({
            last_reminder_sent_at: new Date().toISOString(),
            reminder_count: sub.reminder_count + 1,
          })
          .eq("id", sub.id)
          .eq("organization_id", organizationId);
      }
    }

    return { queued, skipped: targets.length - queued };
  });
