CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.mailbox_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_mode TEXT NOT NULL DEFAULT 'self_hosted',
  provider_name TEXT,
  endpoint_url TEXT,
  auth_token TEXT,
  imap_host TEXT,
  imap_port TEXT,
  smtp_host TEXT,
  smtp_port TEXT,
  username TEXT,
  password TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mailbox_connections TO authenticated;
GRANT ALL ON public.mailbox_connections TO service_role;
ALTER TABLE public.mailbox_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage mailbox connections" ON public.mailbox_connections FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  snippet TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'draft_ready',
  unread BOOLEAN NOT NULL DEFAULT true,
  kind TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  draft_html TEXT,
  sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emails TO authenticated;
GRANT ALL ON public.emails TO service_role;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage emails" ON public.emails FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'inbound',
  body TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_messages TO authenticated;
GRANT ALL ON public.email_messages TO service_role;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage email messages" ON public.email_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_base TO authenticated;
GRANT ALL ON public.knowledge_base TO service_role;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage knowledge base" ON public.knowledge_base FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.historical_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_account TEXT NOT NULL,
  thread_subject TEXT NOT NULL,
  body_chunk TEXT NOT NULL,
  embedding vector(1536),
  sent_at TIMESTAMP WITH TIME ZONE,
  included BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historical_emails TO authenticated;
GRANT ALL ON public.historical_emails TO service_role;
ALTER TABLE public.historical_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage historical emails" ON public.historical_emails FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tone TEXT,
  avg_length TEXT,
  greeting TEXT,
  signoff TEXT,
  phrases TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_profiles TO authenticated;
GRANT ALL ON public.voice_profiles TO service_role;
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage voice profiles" ON public.voice_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.agent_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used TIMESTAMP WITH TIME ZONE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_keys TO authenticated;
GRANT ALL ON public.agent_keys TO service_role;
ALTER TABLE public.agent_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage agent keys" ON public.agent_keys FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_mailbox_connections_updated_at BEFORE UPDATE ON public.mailbox_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON public.emails FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_messages_updated_at BEFORE UPDATE ON public.email_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON public.knowledge_base FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_historical_emails_updated_at BEFORE UPDATE ON public.historical_emails FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_voice_profiles_updated_at BEFORE UPDATE ON public.voice_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agent_keys_updated_at BEFORE UPDATE ON public.agent_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.knowledge_base (id, title, content, tags) VALUES
  ('a0b2c4d6-e8f0-1234-5678-90abcdef1234', 'Damaged goods policy', 'Refund damaged items within 30 days of delivery without requiring a return. Photos are appreciated but not mandatory. Refunds go back to the original payment method in 3–5 business days.', ARRAY['REFUND']),
  ('b1c3d5e7-f9a1-2345-6789-01abcdef1234', 'Volume pricing tiers', 'Tier 1: 100–249 units, 12% off list. Tier 2: 250–749 units, 18% off. Tier 3: 750+ units, negotiated. Freight is quoted per shipment above tier 1.', ARRAY[]::TEXT[]),
  ('c2d4e6f8-a0b2-3456-7890-12abcdef1234', 'Payment reminder workflow', 'For unpaid invoices and overdue notices: acknowledge the balance, restate the invoice number and amount, include the PayPal payment link from Settings, and ask the payer to reference the invoice number in the payment note. Never threaten service suspension in the first reminder.', ARRAY['PAYMENT']),
  ('d3e5f7a9-b1c3-4567-8901-23abcdef1234', 'Incident escalation ladder', 'Anything tagged !ESCALATE goes to on-call within 15 minutes. Always acknowledge within the hour and commit to an update window rather than a fix time.', ARRAY['URGENT', 'ESCALATE']);

INSERT INTO public.historical_emails (id, source_account, thread_subject, body_chunk, sent_at, included) VALUES
  ('e4f6a8b0-c2d4-5678-9012-34abcdef1234', 'sam@sharedinbox.co', 'Order #38771 refund', 'Sorry about that — I''ve refunded the two items, no need to send anything back.', '2026-03-04T10:12:00Z', true),
  ('f5a7b9c1-d3e5-6789-0123-45abcdef1234', 'sam@sharedinbox.co', 'Bulk order — Coastline', 'That volume lands you in tier 2, so 18% off list. Freight quoted per shipment.', '2026-01-22T15:48:00Z', true),
  ('a6b8c0d2-e4f6-7890-1234-56abcdef1234', 'sam@sharedinbox.co', 'Re: Late invoice', 'Payment''s going out today — here''s the link if it''s easier to settle directly.', '2026-02-11T08:30:00Z', true),
  ('b7c9d1e3-f5a7-8901-2345-67abcdef1234', 'sam@sharedinbox.co', 'Holiday hours', 'We''re closed the 24th through the 2nd, replies resume the 3rd.', '2025-12-18T09:00:00Z', false);

INSERT INTO public.voice_profiles (id, tone, avg_length, greeting, signoff, phrases, is_active) VALUES
  ('c8d0e2f4-a6b8-9012-3456-78abcdef1234', 'Warm, direct, lightly informal. Owns mistakes quickly without over-apologising.', '68 words', 'Hi {first_name},', 'Best,\nSam', ARRAY['no need to send anything back', 'happy to sort that out', 'I''ll follow up by'], true);

INSERT INTO public.agent_keys (id, label, key_hash, created_at, last_used) VALUES
  ('d9e1f3a5-b7c9-0123-4567-89abcdef1234', 'Claude Desktop — Sam', 'sk_mcp_9f4c2b71ae0d4c8fa1e6', '2026-07-30T12:00:00Z', '2026-08-12T19:22:00Z');

INSERT INTO public.emails (id, external_id, sender_name, sender_email, subject, snippet, body, status, unread, kind, received_at, draft_html, sources) VALUES
  ('e0f2a4b6-c8d0-1234-5678-9abcdef12345', 't1', 'Dana Whitfield', 'dana@northlinegoods.com', '[REFUND] Order #40213 arrived damaged', 'The box was crushed on delivery and two mugs were broken...', 'Hi, the box was crushed on delivery and two mugs were broken. Order #40213. I''d like a refund for the damaged items — photos attached.', 'draft_ready', true, NULL, '2026-08-13T14:02:00Z', '<p>Hi Dana,</p><p>I''m sorry your order arrived in that state — that''s not the unboxing we want for anyone. I''ve approved a refund for the two damaged mugs on order #40213; it should land back on your original payment method within 3–5 business days.</p><p>No need to return the broken pieces. If anything else in the box looks off, just reply here and I''ll sort it out.</p><p>Best,<br/>Sam</p>', ARRAY['KB: Damaged goods policy', 'Past reply: Order #38771 refund (Mar 2026)']),
  ('f1a3b5c7-d9e1-2345-6789-0abcdef12345', 't2', 'Accounts — Bright Studio', 'billing@brightstudio.io', '[PAYMENT] Invoice INV-2291 still outstanding', 'Our records show invoice INV-2291 is 18 days past due...', 'Hello, our records show invoice INV-2291 ($1,480.00) is 18 days past due. Could you confirm the payment status?', 'draft_ready', true, 'payment_reminder', '2026-08-13T09:41:00Z', '<p>Hi there,</p><p>Thanks for the nudge on INV-2291 ($1,480.00). Payment is going out today — you can also settle or confirm it directly here:</p><p><a href="https://paypal.me/sharedinbox/1480">Pay INV-2291 via PayPal</a></p><p>Please reference <strong>INV-2291</strong> in the payment note so it reconciles automatically. Apologies for the delay.</p><p>Best,<br/>Sam</p>', ARRAY['Rule: Payment reminder workflow', 'Setting: PayPal payment link']),
  ('a2b4c6d8-e0f2-3456-7890-1abcdef12345', 't3', 'Marcus Lee', 'marcus.lee@fieldwork.co', '#URGENT !ESCALATE Site down since 3am', 'Our dashboard has been unreachable since roughly 3am UTC...', 'Our dashboard has been unreachable since roughly 3am UTC. This is blocking our morning reporting. Please escalate.', 'needs_review', true, NULL, '2026-08-13T06:15:00Z', '<p>Hi Marcus,</p><p>Thanks for flagging this — I''ve escalated it to our on-call engineer and we''re actively investigating the dashboard outage.</p><p>I''ll send you an update within the hour, and sooner if we resolve it before then.</p><p>Best,<br/>Sam</p>', ARRAY['KB: Incident escalation ladder']),
  ('b3c5d7e9-f1a3-4567-8901-2abcdef12345', 't4', 'Priya Raman', 'priya@harborcraft.com', 'Question about bulk pricing', 'We''re looking at around 250 units per quarter — is there a tier...', 'We''re looking at around 250 units per quarter — is there a tier for that volume, and how does shipping work at that scale?', 'draft_ready', false, NULL, '2026-08-12T17:20:00Z', '<p>Hi Priya,</p><p>250 units a quarter puts you in our tier 2 bracket — that''s 18% off list, with freight quoted per shipment rather than flat-rated.</p><p>Happy to put together a proper quote if you can share your delivery city and preferred cadence.</p><p>Best,<br/>Sam</p>', ARRAY['KB: Volume pricing tiers', 'Past reply: Bulk order — Coastline (Jan 2026)']),
  ('c4d6e8f0-a2b4-5678-9012-3abcdef12345', 't5', 'Tomas Vidal', 'tomas@vidalconsult.es', '[PAYMENT] Overdue notice — subscription renewal failed', 'The card on file was declined for the August renewal...', 'The card on file was declined for the August renewal. What are my options to pay?', 'needs_review', false, 'payment_reminder', '2026-08-12T11:05:00Z', '<p>Hi Tomas,</p><p>No problem at all — the August renewal ($240.00) can be settled with the link below, and your account stays active in the meantime:</p><p><a href="https://paypal.me/sharedinbox/240">Pay renewal via PayPal</a></p><p>If you''d rather update the card on file instead, reply here and I''ll send a secure link.</p><p>Best,<br/>Sam</p>', ARRAY['Rule: Payment reminder workflow', 'KB: Failed renewal handling']);

INSERT INTO public.email_messages (id, email_id, from_name, from_email, direction, body, sent_at) VALUES
  ('d5e7f9a1-b3c5-6789-0123-4abcdef12345', 'e0f2a4b6-c8d0-1234-5678-9abcdef12345', 'Dana Whitfield', 'dana@northlinegoods.com', 'inbound', 'Hi, the box was crushed on delivery and two mugs were broken. Order #40213. I''d like a refund for the damaged items — photos attached.', '2026-08-13T14:02:00Z'),
  ('e6f8a0b2-c4d6-7890-1234-5abcdef12345', 'f1a3b5c7-d9e1-2345-6789-0abcdef12345', 'Accounts — Bright Studio', 'billing@brightstudio.io', 'inbound', 'Hello, our records show invoice INV-2291 ($1,480.00) is 18 days past due. Could you confirm the payment status?', '2026-08-13T09:41:00Z'),
  ('f7a9b1c3-d5e7-8901-2345-6abcdef12345', 'a2b4c6d8-e0f2-3456-7890-1abcdef12345', 'Marcus Lee', 'marcus.lee@fieldwork.co', 'inbound', 'Our dashboard has been unreachable since roughly 3am UTC. This is blocking our morning reporting. Please escalate.', '2026-08-13T06:15:00Z'),
  ('a8b0c2d4-e6f8-9012-3456-7abcdef12345', 'b3c5d7e9-f1a3-4567-8901-2abcdef12345', 'Priya Raman', 'priya@harborcraft.com', 'inbound', 'We''re looking at around 250 units per quarter — is there a tier for that volume, and how does shipping work at that scale?', '2026-08-12T17:20:00Z'),
  ('b9c1d3e5-f7a9-0123-4567-8abcdef12345', 'c4d6e8f0-a2b4-5678-9012-3abcdef12345', 'Tomas Vidal', 'tomas@vidalconsult.es', 'inbound', 'The card on file was declined for the August renewal. What are my options to pay?', '2026-08-12T11:05:00Z');
