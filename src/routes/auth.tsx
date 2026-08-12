import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Github } from "lucide-react";

const authSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(200),
});

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    try {
      authSchema.parse({ email, password });
      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email before signing in');
        }
        throw error;
      }
      toast.success("Welcome back");
    } catch (e: any) {
      if (e.name === 'ZodError') {
        toast.error('Please enter a valid email and password (min 8 characters)');
      } else {
        toast.error(e.message || 'Failed to sign in');
      }
    } finally { setBusy(false); }
  };
  const signUp = async () => {
    try {
      authSchema.parse({ email, password });
      setBusy(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { 
          emailRedirectTo: window.location.origin + '/auth/callback'
        }
      });
      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists');
        }
        if (error.message.includes('Password should be')) {
          throw new Error('Password must be at least 8 characters');
        }
        throw error;
      }
      toast.success("Account created — check your email to verify.");
    } catch (e: any) {
      if (e.name === 'ZodError') {
        toast.error('Please enter a valid email and password (min 8 characters)');
      } else {
        toast.error(e.message || 'Failed to create account');
      }
    } finally { setBusy(false); }
  };
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
  const reset = async () => {
    if (!email) return toast.error("Enter your email first");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { 
        redirectTo: window.location.origin + "/reset-password" 
      });
      if (error) {
        if (error.message.includes('Unable to validate email address')) {
          throw new Error('Please enter a valid email address');
        }
        throw error;
      }
      toast.success("Password reset email sent");
    } catch (e: any) {
      toast.error(e.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <Link to="/" className="mb-8 flex items-center gap-2.5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand font-bold text-brand-foreground shadow-glow">RFL</div>
        <div><div className="font-bold">RFL Studios</div></div>
      </Link>
      <Card className="glass-strong w-full border-white/5 bg-transparent p-6">
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2 glass border border-white/5">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-4 space-y-4">
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="Password" value={password} onChange={setPassword} type="password" />
            <Button onClick={signIn} disabled={busy} className="w-full bg-gradient-brand text-brand-foreground shadow-glow">{busy ? "Signing in…" : "Sign in"}</Button>
            <button onClick={reset} className="text-xs text-muted-foreground hover:text-primary">Forgot password?</button>
          </TabsContent>
          <TabsContent value="signup" className="mt-4 space-y-4">
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="Password (min 8 chars)" value={password} onChange={setPassword} type="password" />
            <Button onClick={signUp} disabled={busy} className="w-full bg-gradient-brand text-brand-foreground shadow-glow">{busy ? "Creating…" : "Create account"}</Button>
          </TabsContent>
        </Tabs>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
        <div className="space-y-2">
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

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="glass border-white/10 bg-transparent" />
    </div>
  );
}
