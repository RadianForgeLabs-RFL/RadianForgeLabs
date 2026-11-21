import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/useAuth";

export const Route = createFileRoute("/_authenticated")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth", search: { redirect: window.location.pathname } as any });
  }, [user, loading]);
  if (loading || !user) return <div className="p-16 text-center text-muted-foreground">Loading…</div>;
  return <Outlet />;
}
