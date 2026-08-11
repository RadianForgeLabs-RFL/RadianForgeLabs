import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Github, CheckCircle, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account — RFL Studios" }, { name: "robots", content: "noindex" }] }),
  component: Account,
});

function Account() {
  const { user } = useAuth();
  const favs = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("product:products(*)").eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Check if user has GitHub identity linked
  const hasGithubIdentity = user?.identities?.some((identity: any) => identity.provider === 'github');

  const handleLinkGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
        scopes: 'read:user user:email'
      }
    });
    if (error) {
      console.error('Error linking GitHub:', error);
      alert('Failed to link GitHub account. Please ensure GitHub provider is enabled in Supabase.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-bold md:text-5xl gradient-text">Account</h1>
      <p className="mt-2 text-muted-foreground">{user?.email}</p>

      {/* GitHub Account Linking */}
      <Card className="mt-8 glass border-white/5 bg-transparent p-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold mb-4">
          <Github className="h-5 w-5" />
          GitHub Account
        </h2>
        {hasGithubIdentity ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <div>
              <p className="font-medium text-green-500">GitHub Account Linked</p>
              <p className="text-sm text-muted-foreground">You can create discussions and reply to community posts.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
              <div>
                <p className="font-medium text-yellow-500">GitHub Account Not Linked</p>
                <p className="text-sm text-muted-foreground">Link your GitHub account to create discussions and reply to community posts.</p>
              </div>
            </div>
            <Button onClick={handleLinkGithub} className="w-full">
              <Github className="mr-2 h-4 w-4" />
              Link GitHub Account
            </Button>
          </div>
        )}
      </Card>

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
