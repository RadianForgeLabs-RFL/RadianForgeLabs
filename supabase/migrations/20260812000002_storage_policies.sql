-- Create storage buckets for website assets
-- These buckets will store icons, screenshots, banners, and other media

-- Create main assets bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets', 'assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for assets bucket
-- Public can read
CREATE POLICY "assets public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'assets');

-- Authenticated users cannot upload (only admins)
CREATE POLICY "assets admin insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assets' AND 
  public.has_role(auth.uid(), 'admin')
);

-- Only admins can update
CREATE POLICY "assets admin update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assets' AND 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'assets' AND 
  public.has_role(auth.uid(), 'admin')
);

-- Only admins can delete
CREATE POLICY "assets admin delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assets' AND 
  public.has_role(auth.uid(), 'admin')
);

-- Create avatars bucket (for user profile pictures)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read avatars
CREATE POLICY "avatars public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "avatars self insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "avatars self update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "avatars self delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can manage any avatar
CREATE POLICY "avatars admin all"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'avatars' AND 
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'avatars' AND 
  public.has_role(auth.uid(), 'admin')
);
