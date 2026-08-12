-- RFL Studios: full schema export for a new Supabase project
-- Run this in the SQL editor of the target project (zndizxgtyigkjrqmpsqe).

-- ============ 20260716150433_4c3c7021-624d-4e12-9732-74f51c4d17e9.sql ============

-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE TYPE public.product_kind AS ENUM ('app','game','ai');
CREATE TYPE public.product_status AS ENUM ('stable','beta','experimental','deprecated','abandoned');
CREATE TYPE public.source_type AS ENUM ('open_source','closed_source','mod','official','community');
CREATE TYPE public.play_mode AS ENUM ('single_player','multiplayer','lan','online','offline','cross_platform');
CREATE TYPE public.request_type AS ENUM ('bug','feature','app_request','game_request','review_request');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles self read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ============ AUTH TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  -- Bootstrap first admin
  IF NEW.email = 'krishnaramalesh8838@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ updated_at ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  kind public.product_kind,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cat read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "cat admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ DEVELOPERS ============
CREATE TABLE public.developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  website TEXT,
  logo_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.developers TO anon, authenticated;
GRANT ALL ON public.developers TO service_role;
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev read" ON public.developers FOR SELECT USING (true);
CREATE POLICY "dev admin write" ON public.developers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ TAGS ============
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags read" ON public.tags FOR SELECT USING (true);
CREATE POLICY "tags admin write" ON public.tags FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  features TEXT[],
  requirements TEXT,
  kind public.product_kind NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  publisher TEXT,
  license TEXT,
  status public.product_status NOT NULL DEFAULT 'stable',
  source_type public.source_type NOT NULL DEFAULT 'closed_source',
  play_modes public.play_mode[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  architectures TEXT[] DEFAULT '{}',
  icon_url TEXT,
  banner_url TEXT,
  trailer_url TEXT,
  latest_version TEXT,
  release_date DATE,
  file_size TEXT,
  changelog TEXT,
  known_issues TEXT,
  roadmap TEXT,
  dependencies TEXT[],
  documentation_url TEXT,
  source_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  homepage_order INT NOT NULL DEFAULT 0,
  download_count BIGINT NOT NULL DEFAULT 0,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_kind ON public.products(kind) WHERE published;
CREATE INDEX idx_products_featured ON public.products(featured) WHERE published;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prod public read" ON public.products FOR SELECT USING (published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "prod admin write" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ PRODUCT_TAGS ============
CREATE TABLE public.product_tags (
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);
GRANT SELECT ON public.product_tags TO anon, authenticated;
GRANT ALL ON public.product_tags TO service_role;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ptag read" ON public.product_tags FOR SELECT USING (true);
CREATE POLICY "ptag admin" ON public.product_tags FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ SCREENSHOTS ============
CREATE TABLE public.screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.screenshots TO anon, authenticated;
GRANT ALL ON public.screenshots TO service_role;
ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ss read" ON public.screenshots FOR SELECT USING (true);
CREATE POLICY "ss admin" ON public.screenshots FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ VERSIONS ============
CREATE TABLE public.versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog TEXT,
  released_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_latest BOOLEAN NOT NULL DEFAULT false
);
GRANT SELECT ON public.versions TO anon, authenticated;
GRANT ALL ON public.versions TO service_role;
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ver read" ON public.versions FOR SELECT USING (true);
CREATE POLICY "ver admin" ON public.versions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ DOWNLOADS ============
CREATE TABLE public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  version TEXT,
  platform TEXT NOT NULL,   -- windows, linux, mac, android, ios, web
  format TEXT NOT NULL,     -- apk, exe, zip, 7z, msix, appimage, flatpak, deb, rpm, dmg, github
  architecture TEXT,        -- x86_64, arm64, universal
  url TEXT NOT NULL,
  mirror_name TEXT,         -- e.g., "GitHub", "SourceForge", "Direct"
  is_primary BOOLEAN NOT NULL DEFAULT false,
  size_bytes BIGINT,
  download_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.downloads TO anon, authenticated;
GRANT ALL ON public.downloads TO service_role;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dl read" ON public.downloads FOR SELECT USING (true);
CREATE POLICY "dl admin" ON public.downloads FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ REVIEWS ============
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  likes INT NOT NULL DEFAULT 0,
  dislikes INT NOT NULL DEFAULT 0,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rev read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "rev insert self" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rev update self" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "rev delete self or admin" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_reviews_touch BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Rating rollup trigger
CREATE OR REPLACE FUNCTION public.recalc_product_rating()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE pid UUID;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products p SET
    rating_avg = COALESCE((SELECT ROUND(AVG(rating)::numeric,2) FROM public.reviews WHERE product_id = pid),0),
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = pid)
  WHERE p.id = pid;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_reviews_rating AFTER INSERT OR UPDATE OR DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.recalc_product_rating();

-- ============ FAVORITES ============
CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fav self all" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ REQUESTS ============
CREATE TABLE public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind public.request_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.requests TO authenticated;
GRANT INSERT ON public.requests TO authenticated;
GRANT ALL ON public.requests TO service_role;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "req read self or admin" ON public.requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "req insert self" ON public.requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "req admin update" ON public.requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ NEWS ============
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT,
  cover_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon, authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news read" ON public.news FOR SELECT USING (published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "news admin" ON public.news FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ ANNOUNCEMENTS ============
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'info',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann read" ON public.announcements FOR SELECT USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ann admin" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ SETTINGS ============
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "set read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "set admin" ON public.settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ SEED CATEGORIES ============
INSERT INTO public.categories(slug,name,icon,kind,sort_order) VALUES
 ('apps','Apps','LayoutGrid','app',1),
 ('games','Games','Gamepad2','game',2),
 ('ai','AI Tools','Sparkles','ai',3),
 ('developer-tools','Developer Tools','Code2','app',4),
 ('utilities','Utilities','Wrench','app',5),
 ('media','Media','Music','app',6),
 ('internet','Internet','Globe','app',7),
 ('security','Security','ShieldCheck','app',8),
 ('education','Education','GraduationCap','app',9),
 ('system','System','Cpu','app',10);

-- ============ SEED DEVELOPERS ============
INSERT INTO public.developers(slug,name,bio,verified) VALUES
 ('rfl-studios','RFL Studios','First-party projects from Radian Forge Labs.',true),
 ('radian-forge-labs','Radian Forge Labs','Parent research and engineering studio.',true),
 ('community','Community','Contributions from independent open-source developers.',false);

-- ============ SEED PRODUCTS ============
WITH d AS (SELECT id, slug FROM public.developers), c AS (SELECT id, slug FROM public.categories)
INSERT INTO public.products
  (slug,name,tagline,description,features,requirements,kind,category_id,developer_id,publisher,license,status,source_type,play_modes,platforms,architectures,latest_version,release_date,file_size,featured,homepage_order,download_count)
VALUES
 ('mini-strike','Mini Strike','Fast-paced tactical shooter, LAN & online.',
  'Mini Strike is a lightweight competitive shooter designed for low-spec machines with LAN parties and online multiplayer.',
  ARRAY['LAN Multiplayer','Online Matchmaking','Cross-Platform','Custom Maps'],
  'Windows 10+, 4GB RAM, integrated GPU',
  'game',(SELECT id FROM c WHERE slug='games'),(SELECT id FROM d WHERE slug='rfl-studios'),
  'RFL Studios','Proprietary (Free)','beta','closed_source',
  ARRAY['multiplayer','lan','online','cross_platform']::public.play_mode[],
  ARRAY['Windows','Linux','Android'],ARRAY['x86_64','arm64'],
  '0.6.2','2025-04-12','420 MB',true,1,18450),
 ('rfl-connect','RFL Connect','Unified messaging & LAN sync for RFL apps.',
  'RFL Connect keeps your files, chats, and game sessions synced across every RFL app on your local network.',
  ARRAY['End-to-end encryption','LAN Discovery','Cross-Platform sync','File sharing'],
  'Any modern OS',
  'app',(SELECT id FROM c WHERE slug='apps'),(SELECT id FROM d WHERE slug='rfl-studios'),
  'RFL Studios','Apache-2.0','stable','open_source',
  ARRAY['online','offline','lan']::public.play_mode[],
  ARRAY['Windows','Linux','Mac','Android'],ARRAY['x86_64','arm64','universal'],
  '1.4.0','2025-06-01','62 MB',true,2,32100),
 ('forge-ai','Forge AI','Local-first AI assistant with plugin marketplace.',
  'Forge AI runs models locally with a hot-swappable plugin marketplace for coding, writing, and research.',
  ARRAY['Local inference','Plugin marketplace','Model manager','Vector memory'],
  '8GB RAM minimum, GPU recommended',
  'ai',(SELECT id FROM c WHERE slug='ai'),(SELECT id FROM d WHERE slug='radian-forge-labs'),
  'Radian Forge Labs','MIT','stable','open_source',
  ARRAY['online','offline']::public.play_mode[],
  ARRAY['Windows','Linux','Mac'],ARRAY['x86_64','arm64'],
  '2.1.3','2025-07-08','180 MB',true,3,9820),
 ('forge-code','Forge Code','A blazing-fast editor for the AI era.',
  'Forge Code is a keyboard-first editor with baked-in AI review, refactors, and semantic search.',
  ARRAY['AI review','Semantic search','LSP-first','Extensible'],
  'Any modern OS',
  'app',(SELECT id FROM c WHERE slug='developer-tools'),(SELECT id FROM d WHERE slug='rfl-studios'),
  'RFL Studios','GPL-3.0','stable','open_source',
  ARRAY['offline','online']::public.play_mode[],
  ARRAY['Windows','Linux','Mac'],ARRAY['x86_64','arm64'],
  '3.0.0','2025-05-20','96 MB',true,4,15600),
 ('pixel-rally','Pixel Rally','Retro top-down racing with online leagues.',
  'Race across hand-crafted pixel tracks. Weekly leagues, ghost replays, and split-screen LAN parties.',
  ARRAY['Split-screen','Online leagues','Ghost replays','Level editor'],
  'Windows 10+, 2GB RAM',
  'game',(SELECT id FROM c WHERE slug='games'),(SELECT id FROM d WHERE slug='rfl-studios'),
  'RFL Studios','Proprietary (Free)','stable','closed_source',
  ARRAY['single_player','multiplayer','lan','online']::public.play_mode[],
  ARRAY['Windows','Linux'],ARRAY['x86_64'],
  '1.2.1','2025-03-02','210 MB',false,5,7420),
 ('forge-shield','Forge Shield','Open-source endpoint security for teams.',
  'Forge Shield delivers modern EDR-lite with per-device policies, telemetry, and open dashboards.',
  ARRAY['Per-device policies','Live telemetry','Open dashboards'],
  'Server: 2 vCPU / 4GB RAM',
  'app',(SELECT id FROM c WHERE slug='security'),(SELECT id FROM d WHERE slug='radian-forge-labs'),
  'Radian Forge Labs','AGPL-3.0','experimental','open_source',
  ARRAY['online','offline']::public.play_mode[],
  ARRAY['Windows','Linux','Mac'],ARRAY['x86_64','arm64'],
  '0.3.0','2025-07-15','54 MB',false,6,2140);

-- Downloads for demo products
INSERT INTO public.downloads(product_id,version,platform,format,architecture,url,mirror_name,is_primary,size_bytes)
SELECT p.id,p.latest_version,'Windows','exe','x86_64','https://downloads.rflstudios.example/'||p.slug||'-setup.exe','GitHub Releases',true,209715200 FROM public.products p
UNION ALL
SELECT p.id,p.latest_version,'Linux','appimage','x86_64','https://downloads.rflstudios.example/'||p.slug||'.AppImage','Direct',false,146800640 FROM public.products p
UNION ALL
SELECT p.id,p.latest_version,'Android','apk','arm64','https://downloads.rflstudios.example/'||p.slug||'.apk','Direct',false,73400320 FROM public.products p WHERE p.kind IN ('app','game');

-- ============ NEWS SEED ============
INSERT INTO public.news(slug,title,excerpt,body,cover_url) VALUES
 ('rfl-studios-launch','RFL Studios opens the portal','A single home for every app, game, and AI tool by Radian Forge Labs.','Welcome to the new RFL Studios portal. Browse, download, and follow every project as it ships.',null),
 ('mini-strike-06','Mini Strike 0.6 lands with LAN','Massive netcode overhaul and native LAN discovery.','Mini Strike 0.6 is out. Expect smoother matches, LAN party discovery, and a redesigned HUD.',null),
 ('forge-ai-plugins','Forge AI plugin marketplace goes public','Install AI plugins in one click.','Forge AI 2.1 opens the plugin marketplace to every developer.',null);

-- Announcement
INSERT INTO public.announcements(message,variant) VALUES ('Welcome to RFL Studios — the new home for our apps, games, and AI.','info');

-- Settings defaults
INSERT INTO public.settings(key,value) VALUES
 ('maintenance_mode', 'false'::jsonb),
 ('stats', '{"apps_published":24,"games_published":8,"downloads":142000,"users":9800,"community_members":15400,"open_source_projects":31}'::jsonb);

-- ============ 20260716150503_41c6abd4-b35d-4f6f-8df6-3246c2686532.sql ============

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_product_rating() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- ============ 20260716151300_75ef5272-b1bc-48be-b69c-d15233436561.sql ============
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
-- ============ 20260717053752_62151a8d-86dd-483a-9e46-420b7b731f37.sql ============

CREATE POLICY "product-media public read" ON storage.objects FOR SELECT USING (bucket_id = 'product-media');
CREATE POLICY "product-media admin write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "product-media admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "product-media admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));

-- ============ 20260719072341_9a3431d7-fc7a-47b2-ab77-c4862f11aac2.sql ============
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS banner_opacity numeric NOT NULL DEFAULT 0.4;
-- ============ 20260720041329_fa2a7de5-6792-4ecd-a575-4d64eddcdf44.sql ============

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS coming_soon boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.preorders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

GRANT SELECT, INSERT, DELETE ON public.preorders TO authenticated;
GRANT ALL ON public.preorders TO service_role;

ALTER TABLE public.preorders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own preorders" ON public.preorders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all preorders" ON public.preorders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own preorders" ON public.preorders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own preorders" ON public.preorders
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ 20260721000000_add_extra_guidance.sql ============
-- Add extra guidance field to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS extra_guidance TEXT;

-- ============ 20260722000000_remove_reviews_ratings.sql ============
-- Remove reviews and ratings system
-- Run this in Supabase SQL Editor

-- Drop the rating recalculation trigger
DROP TRIGGER IF EXISTS trg_reviews_rating ON public.reviews;

-- Drop the rating recalculation function
DROP FUNCTION IF EXISTS public.recalc_product_rating();

-- Drop the reviews table
DROP TABLE IF EXISTS public.reviews;

-- Remove rating columns from products table
ALTER TABLE public.products DROP COLUMN IF EXISTS rating_avg;
ALTER TABLE public.products DROP COLUMN IF EXISTS rating_count;

-- ============ 20260811101623_c7cdb97e-7fab-4c49-b5ed-b213f08adac4.sql ============
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
