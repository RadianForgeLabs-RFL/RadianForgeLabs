import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Auth callback — RFL Studios" }, { name: "robots", content: "noindex" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const nav = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          nav({ to: '/auth', search: { redirect: undefined } });
          return;
        }

        if (data.session) {
          // Check if user signed in with GitHub
          const provider = data.session.user.app_metadata.provider;
          if (provider === 'github') {
            // Update profiles table to set link_with_github to true
            await supabase
              .from('profiles')
              .update({ link_with_github: true })
              .eq('id', data.session.user.id);
          }
          
          // Successfully authenticated
          nav({ to: '/' });
        } else {
          // No session, redirect to auth
          nav({ to: '/auth', search: { redirect: undefined } });
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        nav({ to: '/auth', search: { redirect: undefined } });
      }
    };

    handleAuthCallback();
  }, [nav]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  );
}
