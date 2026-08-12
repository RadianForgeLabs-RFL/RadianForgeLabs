import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Github, CheckCircle, AlertCircle, Mail, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account — RFL Studios" }, { name: "robots", content: "noindex" }] }),
  component: Account,
});

function Account() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

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
  const hasEmailIdentity = user?.identities?.some((identity: any) => identity.provider === 'email');

  const changePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password updated successfully");
      setNewPassword("");
      setIsChangingPassword(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const changeEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Email update initiated - check your inbox for verification");
      setNewEmail("");
      setIsChangingEmail(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

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

        {/* Email */}
        <div>
          <div className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-white/5">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5" />
              <div>
                <p className="font-medium">Email & Password</p>
                <p className="text-sm text-muted-foreground">
                  {hasEmailIdentity ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            {hasEmailIdentity ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <span className="text-sm text-muted-foreground">Set up via sign up</span>
            )}
          </div>
        </div>
      </Card>

      {/* Change Password */}
      {hasEmailIdentity && (
        <Card className="mt-6 glass border-white/5 bg-transparent p-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          {!isChangingPassword ? (
            <Button onClick={() => setIsChangingPassword(true)} variant="outline">
              Change Password
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="glass border-white/10 bg-transparent"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => changePasswordMutation.mutate(newPassword)}
                  disabled={changePasswordMutation.isPending || newPassword.length < 8}
                >
                  {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                </Button>
                <Button onClick={() => setIsChangingPassword(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Change Email */}
      <Card className="mt-6 glass border-white/5 bg-transparent p-6">
        <h2 className="text-xl font-semibold mb-4">Change Email</h2>
        {!isChangingEmail ? (
          <Button onClick={() => setIsChangingEmail(true)} variant="outline">
            Change Email
          </Button>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>New Email</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="your@email.com"
                className="glass border-white/10 bg-transparent"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => changeEmailMutation.mutate(newEmail)}
                disabled={changeEmailMutation.isPending || !newEmail.includes('@')}
              >
                {changeEmailMutation.isPending ? 'Sending...' : 'Send Verification'}
              </Button>
              <Button onClick={() => setIsChangingEmail(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}
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
