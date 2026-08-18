import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, ShieldCheck, User as UserIcon, Menu, Coffee } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import { SupportModal } from "./SupportModal";

const NAV = [
  { to: "/", label: "Home", color: "blue" },
  { to: "/studios", label: "Studios", color: "blue" },
  { to: "/entertainment", label: "Entertainment", color: "rose" },
  { to: "/community", label: "Community", color: "purple" },
  { to: "/about", label: "About", color: "purple" },
  { to: "/support", label: "Contact", color: "purple" },
] as const;

export function Header() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin(user?.id);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const currentPath = router.state.location.pathname;

  const getSupportTitle = () => {
    if (currentPath.startsWith('/studios')) return "Support RFL Studios";
    if (currentPath.startsWith('/entertainment')) return "Support RFL Entertainment";
    return "Support RadianForgeLabs";
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 glass-strong">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" className="group flex shrink-0 items-center gap-2.5">
          <Logo className="h-9 w-9" />
          <div className="hidden flex-col leading-none sm:flex">
            <span className="text-sm font-bold tracking-tight">Radian Forge Labs</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Technology Company</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-${n.color}-500`}
              activeProps={{ className: `rounded-md px-3 py-1.5 text-sm text-${n.color}-500 bg-${n.color}-500/10` }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SupportModal
            title={getSupportTitle()}
            trigger={
              <Button size="sm" variant="outline" className="hidden gap-1.5 border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20 md:inline-flex">
                <Coffee className="h-4 w-4 text-primary" />
                <span className="hidden md:inline">Buy Me a Coffee</span>
              </Button>
            }
          />
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-brand text-xs text-brand-foreground">{(user.email ?? "?").slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[140px] truncate sm:inline">{user.user_metadata?.username || user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-strong w-56 text-foreground">
                <DropdownMenuLabel className="truncate text-foreground">{user.user_metadata?.full_name || user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="text-foreground focus:text-foreground"><Link to="/account"><UserIcon className="mr-2 h-4 w-4" />Account</Link></DropdownMenuItem>
                {isAdmin && <DropdownMenuItem asChild className="text-foreground focus:text-foreground"><Link to="/admin"><ShieldCheck className="mr-2 h-4 w-4" />Admin</Link></DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-foreground focus:text-foreground"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90">
              <Link to="/auth" search={{ redirect: undefined }}>Login</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden dark:border-primary/40 border-border dark:bg-primary/10 bg-background text-foreground dark:hover:bg-primary/20 hover:bg-muted"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 dark:bg-background/95 bg-background text-foreground border-border dark:border-white/10">
              <nav className="mt-8 flex flex-col gap-1">
                {NAV.map((n) => (
                  <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                    className={`rounded-md px-3 py-2 text-sm text-foreground/80 dark:hover:bg-white/10 hover:bg-muted hover:text-${n.color}-500`}>
                    {n.label}
                  </Link>
                ))}
                <div className="mt-4 border-t border-border dark:border-white/10 pt-4">
                  <SupportModal
                    title={getSupportTitle()}
                    trigger={
                      <Button className="w-full bg-gradient-brand text-brand-foreground shadow-glow">
                        <Coffee className="mr-2 h-4 w-4" /> Buy Me a Coffee
                      </Button>
                    }
                  />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <script src="https://keepandroidopen.org/banner.js?size=minimal&animation=off"></script>
    </header>
  );
}
