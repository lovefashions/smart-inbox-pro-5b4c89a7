import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type TypedSupabase = SupabaseClient<Database>;

const BATCH_LIMIT = 10;

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

function toHtml(text: string): string {
  return text
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br />").replace(/</g, "&lt;")}</p>`)
    .join("");
}

export const generateDrafts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as TypedSupabase;
    const organizationId = await getOrganizationId(supabase, context.userId);

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { ok: false, drafted: 0, message: "AI is not configured." };
    }

    const { data: pending } = await supabase
      .from("emails")
      .select("id, subject, body, sender_name, sender_email")
      .eq("organization_id", organizationId)
      .eq("status", "needs_review")
      .order("received_at", { ascending: false })
      .limit(BATCH_LIMIT);

    if (!pending?.length) {
      return { ok: true, drafted: 0, message: "No emails waiting for a draft." };
    }

    const [{ data: knowledge }, { data: voice }, { data: settings }] = await Promise.all([
      supabase.from("knowledge_base").select("title, content").eq("organization_id", organizationId).limit(20),
      supabase
        .from("voice_profiles")
        .select("tone, greeting, signoff, phrases, avg_length")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("app_settings")
        .select("from_name, signature")
        .eq("organization_id", organizationId)
        .maybeSingle(),
    ]);

    const knowledgeText = (knowledge ?? [])
      .map((k) => `- ${k.title}: ${k.content}`)
      .join("\n");

    const voiceText = voice
      ? `Tone: ${voice.tone ?? "professional"}. Greeting style: ${voice.greeting ?? "Hi {name},"}. Sign-off: ${voice.signoff ?? "Thanks"}. Typical length: ${voice.avg_length ?? "short"}. Common phrases: ${(voice.phrases ?? []).join(", ")}.`
      : "Tone: warm, concise, professional.";

    const systemPrompt = [
      `You write email replies for ${settings?.from_name || "our team"}.`,
      voiceText,
      knowledgeText ? `Business rules and knowledge:\n${knowledgeText}` : "",
      settings?.signature ? `End with this signature:\n${settings.signature}` : "",
      "Reply in plain text only. No subject line, no commentary, just the reply body.",
    ]
      .filter(Boolean)
      .join("\n\n");

    let drafted = 0;
    const sources = knowledge?.length ? (knowledge.map((k) => k.title) as string[]) : [];

    for (const email of pending) {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash",
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `From: ${email.sender_name} <${email.sender_email}>\nSubject: ${email.subject}\n\n${(email.body ?? "").slice(0, 4000)}`,
              },
            ],
          }),
        });

        if (!res.ok) {
          if (res.status === 429) {
            return {
              ok: false,
              drafted,
              message: "AI rate limit reached. Try again in a moment.",
            };
          }
          if (res.status === 402) {
            return { ok: false, drafted, message: "AI credits exhausted." };
          }
          continue;
        }

        const json = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const text = json.choices?.[0]?.message?.content?.trim();
        if (!text) continue;

        const { error } = await supabase
          .from("emails")
          .update({ draft_html: toHtml(text), status: "draft", sources })
          .eq("id", email.id)
          .eq("organization_id", organizationId);

        if (!error) drafted += 1;
      } catch {
        continue;
      }
    }

    return { ok: true, drafted, message: `Drafted ${drafted} repl${drafted === 1 ? "y" : "ies"}.` };
  });
