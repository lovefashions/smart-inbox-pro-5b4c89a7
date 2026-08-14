CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_organizations TO authenticated;
GRANT ALL ON public.user_organizations TO service_role;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

INSERT INTO public.organizations (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Default Shared Inbox') ON CONFLICT (id) DO NOTHING;

-- Now that both tables exist, add the policies that reference them
CREATE POLICY "Organization members can view organizations" ON public.organizations FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.organizations.id));
CREATE POLICY "Users can view their own memberships" ON public.user_organizations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own memberships" ON public.user_organizations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.mailbox_connections ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.email_messages ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.knowledge_base ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.historical_emails ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.voice_profiles ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.agent_keys ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.mailbox_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization members can manage mailbox connections" ON public.mailbox_connections FOR ALL TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.mailbox_connections.organization_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.mailbox_connections.organization_id));
CREATE POLICY "Organization members can manage emails" ON public.emails FOR ALL TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.emails.organization_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.emails.organization_id));
CREATE POLICY "Organization members can manage email messages" ON public.email_messages FOR ALL TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.email_messages.organization_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.email_messages.organization_id));
CREATE POLICY "Organization members can manage knowledge base" ON public.knowledge_base FOR ALL TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.knowledge_base.organization_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.knowledge_base.organization_id));
CREATE POLICY "Organization members can manage historical emails" ON public.historical_emails FOR ALL TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.historical_emails.organization_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.historical_emails.organization_id));
CREATE POLICY "Organization members can manage voice profiles" ON public.voice_profiles FOR ALL TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.voice_profiles.organization_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.voice_profiles.organization_id));
CREATE POLICY "Organization members can manage agent keys" ON public.agent_keys FOR ALL TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.agent_keys.organization_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.agent_keys.organization_id));

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_organizations_updated_at BEFORE UPDATE ON public.user_organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
