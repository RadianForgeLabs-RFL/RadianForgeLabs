import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const ADMIN_EMAILS = ['krishnaramalesh8838@gmail.com', 'radianforgelabs@gmail.com'];

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (s: Record<string, unknown>) => ({ 
    error: typeof s.error === "string" ? s.error : undefined,
    error_description: typeof s.error_description === "string" ? s.error_description : undefined 
  }),
  head: () => ({ meta: [{ title: "Auth callback — RFL Studios" }, { name: "robots", content: "noindex" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const nav = useNavigate();
  const search = useSearch({ from: "/auth/callback" });

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle OAuth errors
        if (search.error) {
          console.error('OAuth error:', search.error, search.error_description);
          toast.error(search.error_description || search.error || 'Authentication failed');
          nav({ to: '/auth', search: { redirect: undefined } });
          return;
        }

        // Exchange the code for a session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast.error(error.message);
          nav({ to: '/auth', search: { redirect: undefined } });
          return;
        }

        if (data.session) {
          const user = data.session.user;
          const provider = user.app_metadata.provider;
          const userEmail = user.email?.toLowerCase();

          // Check if user email is in admin list (case-insensitive)
          if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
            await supabase.auth.signOut();
            toast.error('Access denied: Only authorized admin emails are allowed');
            nav({ to: '/auth', search: { redirect: undefined } });
            return;
          }
          
          // Ensure profile exists
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              display_name: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0] || null,
              username: user.user_metadata.user_name || user.user_metadata.preferred_username || user.email?.split('@')[0] || null,
              avatar_url: user.user_metadata.avatar_url || user.user_metadata.picture || null,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id'
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }

          // Update provider-specific flags
          const updateData: any = { updated_at: new Date().toISOString() };
          if (provider === 'github') {
            updateData.link_with_github = true;
          }
          if (provider === 'google') {
            updateData.link_with_google = true;
          }

          await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);

          // Ensure user has a role (default to 'user')
          const { data: existingRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existingRole) {
            await supabase
              .from('user_roles')
              .insert({
                user_id: user.id,
                role: 'user'
              });
          }

          toast.success("Successfully signed in");
          nav({ to: '/' });
        } else {
          // No session, redirect to auth
          nav({ to: '/auth', search: { redirect: undefined } });
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        toast.error('An unexpected error occurred');
        nav({ to: '/auth', search: { redirect: undefined } });
      }
    };

    handleAuthCallback();
  }, [nav, search]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  );
}
