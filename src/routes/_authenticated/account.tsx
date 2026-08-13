import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Github, CheckCircle, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account — RFL Studios" }, { name: "robots", content: "noindex" }] }),
  component: Account,
});

function Account() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const favs = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("product:products(*)").eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Check linked providers
  const hasGithubIdentity = user?.identities?.some((identity: any) => identity.provider === 'github');
  const hasGoogleIdentity = user?.identities?.some((identity: any) => identity.provider === 'google');


  const handleLinkGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
        scopes: 'read:user user:email'
      }
    });
    if (error) {
      toast.error('Failed to link GitHub account');
    }
  };

  const handleLinkGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback'
      }
    });
    if (error) {
      toast.error('Failed to link Google account');
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Logged out successfully");
      window.location.href = "/";
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    
    const { error } = await supabase.auth.admin.deleteUser(user!.id);
    if (error) {
      toast.error("Failed to delete account. Please contact support.");
    } else {
      toast.success("Account deleted successfully");
      window.location.href = "/";
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-bold md:text-5xl gradient-text">Account</h1>
      <p className="mt-2 text-muted-foreground">{user?.email}</p>

      {/* Connected Accounts */}
      <Card className="mt-8 glass border-white/5 bg-transparent p-6">
        <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
        
        {/* GitHub */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-white/5">
            <div className="flex items-center gap-3">
              <Github className="h-5 w-5" />
              <div>
                <p className="font-medium">GitHub</p>
                <p className="text-sm text-muted-foreground">
                  {hasGithubIdentity ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            {hasGithubIdentity ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <Button onClick={handleLinkGithub} variant="outline" size="sm">
                Connect
              </Button>
            )}
          </div>
        </div>

        {/* Google */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-white/5">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M21.35 11.1H12v3.2h5.35c-.23 1.5-1.66 4.4-5.35 4.4-3.22 0-5.85-2.66-5.85-5.95S8.78 6.8 12 6.8c1.83 0 3.06.78 3.76 1.45l2.57-2.48C16.6 4.14 14.5 3.2 12 3.2 6.98 3.2 2.9 7.28 2.9 12.3S6.98 21.4 12 21.4c6.94 0 8.55-6.09 8.55-9.22 0-.63-.06-1.11-.2-1.08z"/>
              </svg>
              <div>
                <p className="font-medium">Google</p>
                <p className="text-sm text-muted-foreground">
                  {hasGoogleIdentity ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            {hasGoogleIdentity ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <Button onClick={handleLinkGoogle} variant="outline" size="sm">
                Connect
              </Button>
            )}
          </div>
        </div>

      </Card>


      {/* Account Actions */}
      <Card className="mt-6 glass border-white/5 bg-transparent p-6">
        <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
        <div className="space-y-3">
          <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
          <Button
            onClick={handleDeleteAccount}
            variant="outline"
            className="w-full border-destructive text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Favorites */}
      <h2 className="mt-10 flex items-center gap-2 text-xl font-semibold"><Heart className="h-5 w-5 text-pink-400" /> Favorites</h2>
      <div className="mt-4 grid gap-3">
        {(favs.data ?? []).length === 0 && <p className="text-muted-foreground">No favorites yet — browse products and hit ❤️.</p>}
        {(favs.data ?? []).map((row: any) => (
          <Card key={row.product.id} className="glass border-white/5 bg-transparent p-4">
            <Link to="/products/$slug" params={{ slug: row.product.slug }} className="font-semibold hover:text-primary">{row.product.name}</Link>
            <div className="text-sm text-muted-foreground">{row.product.tagline}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
