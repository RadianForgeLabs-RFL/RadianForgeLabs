import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import { LayoutDashboard, Package, Newspaper, Settings, MessageSquare, Menu, X } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — RadianForgeLabs" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const LINKS: { to: string; label: string; icon: any; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/news", label: "News", icon: Newspaper },
  { to: "/admin/community", label: "Community", icon: MessageSquare },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminLayout() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: rLoading } = useIsAdmin(user?.id);
  const nav = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth", search: { redirect: "/admin" } as any });
  }, [user, loading]);
  if (loading || rLoading) return <div className="p-16 text-center text-muted-foreground">Loading…</div>;
  if (!user) return null;
  if (!isAdmin) return (
    <div className="p-16 text-center">
      <h1 className="text-3xl font-bold gradient-text">Not authorized</h1>
      <p className="mt-2 text-muted-foreground">You need admin access to view this page.</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 py-4 md:py-8">
      <div className="grid gap-3 lg:gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="glass sticky top-24 h-fit rounded-xl border border-white/5 p-3 lg:block hidden">
          <div className="mb-2 px-2 text-xs uppercase tracking-widest text-muted-foreground">Admin</div>
          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to as any} activeOptions={{ exact: l.exact }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
                activeProps={{ className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground bg-white/5" }}>
                <l.icon className="h-4 w-4" />{l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mb-3 flex w-full items-center justify-between rounded-lg bg-white/5 p-3"
          >
            <span className="text-sm font-medium">Admin Menu</span>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {mobileMenuOpen && (
            <nav className="mb-3 space-y-1 rounded-lg bg-white/5 p-2">
              {LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to as any}
                  activeOptions={{ exact: l.exact }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  activeProps={{ className: "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-foreground bg-white/10" }}
                >
                  <l.icon className="h-4 w-4 flex-shrink-0" />{l.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="lg:col-span-1"><Outlet /></div>
      </div>
    </div>
  );
}
