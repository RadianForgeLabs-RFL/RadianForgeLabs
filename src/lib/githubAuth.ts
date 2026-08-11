import { useEffect, useState } from "react";

interface GitHubUser {
  githubId: string;
  login: string;
  avatar: string;
  email: string | null;
  name: string;
}

export function useGitHubAuth() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, []);

  const login = () => {
    window.location.href = '/api/auth/login';
  };

  const logout = () => {
    window.location.href = '/api/auth/logout';
  };

  return { user, loading, login, logout };
}
