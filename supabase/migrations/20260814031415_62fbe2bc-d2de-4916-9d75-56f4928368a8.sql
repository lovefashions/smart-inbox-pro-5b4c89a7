CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;
ALTER TABLE public.knowledge_base ALTER COLUMN embedding TYPE extensions.vector(1536);
ALTER TABLE public.historical_emails ALTER COLUMN embedding TYPE extensions.vector(1536);
ALTER DATABASE postgres SET search_path TO public, extensions;
