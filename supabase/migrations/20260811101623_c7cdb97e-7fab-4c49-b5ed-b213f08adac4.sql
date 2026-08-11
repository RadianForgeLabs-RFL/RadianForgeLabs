CREATE TABLE public.community_settings (
  id text PRIMARY KEY DEFAULT 'default',
  enabled boolean NOT NULL DEFAULT true,
  repo_owner text NOT NULL DEFAULT 'RadianForgeLabs',
  repo_name text NOT NULL DEFAULT 'Community',
  repo_id text,
  mapping text NOT NULL DEFAULT 'number',
  theme_follows_site boolean NOT NULL DEFAULT true,
  theme text NOT NULL DEFAULT 'dark',
  reactions_enabled boolean NOT NULL DEFAULT true,
  input_position text NOT NULL DEFAULT 'bottom',
  lazy_load boolean NOT NULL DEFAULT true,
  allow_new_discussions boolean NOT NULL DEFAULT true,
  comments_enabled boolean NOT NULL DEFAULT true,
  show_github_links boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.community_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_settings TO authenticated;
GRANT ALL ON public.community_settings TO service_role;
ALTER TABLE public.community_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community settings read" ON public.community_settings FOR SELECT USING (true);
CREATE POLICY "community settings admin" ON public.community_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_community_settings_touch BEFORE UPDATE ON public.community_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.community_settings (id) VALUES ('default');

CREATE TABLE public.community_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  github_category_id text NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  emoji text,
  description text,
  section text NOT NULL DEFAULT 'general',
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (github_category_id)
);

GRANT SELECT ON public.community_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_categories TO authenticated;
GRANT ALL ON public.community_categories TO service_role;
ALTER TABLE public.community_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community categories read" ON public.community_categories FOR SELECT USING (true);
CREATE POLICY "community categories admin" ON public.community_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));