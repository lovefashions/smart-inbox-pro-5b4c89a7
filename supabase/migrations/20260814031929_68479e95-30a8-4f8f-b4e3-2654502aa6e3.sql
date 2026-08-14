CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_name TEXT NOT NULL DEFAULT '',
  from_email TEXT NOT NULL DEFAULT '',
  signature TEXT NOT NULL DEFAULT '',
  tag_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  paypal_link TEXT NOT NULL DEFAULT '',
  payment_reminders_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_after_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organization members can manage app settings" ON public.app_settings FOR ALL TO authenticated USING (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.app_settings.organization_id)) WITH CHECK (auth.uid() IN (SELECT user_id FROM public.user_organizations WHERE organization_id = public.app_settings.organization_id));

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed settings for the default organization
INSERT INTO public.app_settings (organization_id, from_name, from_email, signature, paypal_link, reminder_after_days)
VALUES ('00000000-0000-0000-0000-000000000001', 'Johnny Goodguy TV Sales', 'sales@johnnygoodguytv.com', '— Johnny\nJohnny Goodguy TV Sales', '', 7)
ON CONFLICT (organization_id) DO NOTHING;
