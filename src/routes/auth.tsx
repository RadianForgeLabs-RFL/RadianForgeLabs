import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Github } from "lucide-react";

const ADMIN_EMAILS = ['krishnaramalesh8838@gmail.com', 'radianforgelabs@gmail.com'];

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  head: () => ({ meta: [{ title: "Sign in — RFL Studios" }, { name: "description", content: "Sign in or create your RFL Studios account." }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const search = useSearch({ from: "/auth" });

  useEffect(() => { if (user) nav({ to: search.redirect ?? "/" as any }); }, [user]);

  const google = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      });
      if (error) {
        if (error.message.includes('Provider is not enabled')) {
          throw new Error('Google login is not configured. Please contact support.');
        }
        throw error;
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to sign in with Google');
    }
  };
  const github = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      });
      if (error) {
        if (error.message.includes('Provider is not enabled')) {
          throw new Error('GitHub login is not configured. Please contact support.');
        }
        throw error;
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to sign in with GitHub');
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <Link to="/" className="mb-8 flex items-center gap-2.5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand font-bold text-brand-foreground shadow-glow">RFL</div>
        <div><div className="font-bold">RadianForgeLabs</div></div>
      </Link>
      <Card className="glass-strong w-full border-white/5 bg-transparent p-6">
        <div className="space-y-4">
          <Button onClick={google} variant="outline" className="w-full border-white/10 glass">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1H12v3.2h5.35c-.23 1.5-1.66 4.4-5.35 4.4-3.22 0-5.85-2.66-5.85-5.95S8.78 6.8 12 6.8c1.83 0 3.06.78 3.76 1.45l2.57-2.48C16.6 4.14 14.5 3.2 12 3.2 6.98 3.2 2.9 7.28 2.9 12.3S6.98 21.4 12 21.4c6.94 0 8.55-6.09 8.55-9.22 0-.63-.06-1.11-.2-1.08z"/></svg>
            Continue with Google
          </Button>
          <Button onClick={github} variant="outline" className="w-full border-white/10 glass">
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
        </div>
      </Card>
    </div>
  );
}
