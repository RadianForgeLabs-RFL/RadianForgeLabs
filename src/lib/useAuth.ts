import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useGitHubAuth } from "./githubAuth";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: githubUser, loading: githubLoading } = useGitHubAuth();

  useEffect(() => {
    // Use GitHub OAuth as primary auth
    if (!githubLoading) {
      if (githubUser) {
        // Create a mock user object for compatibility with existing code
        setUser({
          id: githubUser.githubId,
          email: githubUser.email,
          user_metadata: {
            username: githubUser.login,
            avatar_url: githubUser.avatar,
            full_name: githubUser.name,
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as unknown as User);
        setSession({ user: { id: githubUser.githubId } } as unknown as Session);
      } else {
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    }
  }, [githubUser, githubLoading]);

  return { session, user, loading };
}

export function useIsAdmin(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!userId) { setIsAdmin(false); setLoading(false); return; }
    let alive = true;
    supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle()
      .then(({ data }) => { if (alive) { setIsAdmin(!!data); setLoading(false); } });
    return () => { alive = false; };
  }, [userId]);
  return { isAdmin, loading };
}
