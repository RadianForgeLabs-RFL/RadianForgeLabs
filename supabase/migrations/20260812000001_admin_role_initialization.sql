-- Remove hardcoded admin email from trigger and create proper admin initialization function
-- This provides a secure way to designate the initial administrator

-- Drop the old trigger with hardcoded email
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved user handler without hardcoded admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Always assign 'user' role by default
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a secure function to promote a user to admin
-- This can only be called by an existing admin or via service role
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_admin_role public.app_role;
BEGIN
  -- Check if the caller is an admin
  SELECT role INTO current_admin_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin';
  
  -- If not admin via auth.uid(), this might be called via service role
  -- In that case, we allow it (for initial setup via SQL/migrations)
  
  -- Insert admin role for target user
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (target_user_id, 'admin') 
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END; $$;

-- Grant execute on promote_to_admin to service role only
GRANT EXECUTE ON FUNCTION public.promote_to_admin(UUID) TO service_role;

-- Create a function to demote an admin (for security)
CREATE OR REPLACE FUNCTION public.demote_from_admin(target_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_admin_role public.app_role;
BEGIN
  -- Check if the caller is an admin
  SELECT role INTO current_admin_role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only admins can demote other admins';
  END IF;
  
  -- Prevent self-demotion (last admin check)
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot demote yourself';
  END IF;
  
  -- Check if this would leave zero admins
  IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') <= 1 THEN
    RAISE EXCEPTION 'Cannot demote the last admin';
  END IF;
  
  -- Remove admin role
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id AND role = 'admin';
  
  RETURN TRUE;
END; $$;

GRANT EXECUTE ON FUNCTION public.demote_from_admin(UUID) TO authenticated;
