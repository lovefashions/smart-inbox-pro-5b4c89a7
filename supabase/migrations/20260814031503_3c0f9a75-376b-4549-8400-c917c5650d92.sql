REVOKE SELECT, INSERT, UPDATE, DELETE ON public.mailbox_connections FROM authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.emails FROM authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.email_messages FROM authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.knowledge_base FROM authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.historical_emails FROM authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.voice_profiles FROM authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.agent_keys FROM authenticated;

DROP POLICY IF EXISTS "Authenticated users can manage mailbox connections" ON public.mailbox_connections;
DROP POLICY IF EXISTS "Authenticated users can manage emails" ON public.emails;
DROP POLICY IF EXISTS "Authenticated users can manage email messages" ON public.email_messages;
DROP POLICY IF EXISTS "Authenticated users can manage knowledge base" ON public.knowledge_base;
DROP POLICY IF EXISTS "Authenticated users can manage historical emails" ON public.historical_emails;
DROP POLICY IF EXISTS "Authenticated users can manage voice profiles" ON public.voice_profiles;
DROP POLICY IF EXISTS "Authenticated users can manage agent keys" ON public.agent_keys;
