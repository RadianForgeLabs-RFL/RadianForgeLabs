import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, lazy, Suspense, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/site/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMobile } from "@/hooks/use-mobile";

// Lazy load heavy components
const Header = lazy(() => import("@/components/site/Header").then(m => ({ default: m.Header })));
const Footer = lazy(() => import("@/components/site/Footer").then(m => ({ default: m.Footer })));
const AnnouncementBar = lazy(() => import("@/components/site/AnnouncementBar").then(m => ({ default: m.AnnouncementBar })));

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-gradient-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-glow">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or head home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-gradient-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-glow">Try again</button>
          <a href="/" className="rounded-md border border-white/10 px-4 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RFL Studios — Apps, Games, AI & Open Software" },
      { name: "description", content: "RFL Studios by Radian Forge Labs — the official portal for our apps and games." },
      { name: "author", content: "Radian Forge Labs" },
      { name: "theme-color", content: "#0b0f1e" },
      { name: "application-name", content: "RadianForgeLabs" },
      { name: "msapplication-TileColor", content: "#0b0f1e" },
      { name: "msapplication-TileImage", content: "/favicon.png" },
      { property: "og:title", content: "RFL Studios — Apps, Games, AI & Open Software" },
      { property: "og:description", content: "Creating games and apps." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "RFL Studios" },
      { name: "twitter:card", content: "summary_large_image" },
      { httpEquiv: "X-DNS-Prefetch-Control", content: "on" },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
      { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "preconnect", href: "https://vblulnytbpvdeziushxw.supabase.co" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body className="min-h-screen">{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const { isMobile, isLowEnd } = useMobile();
  const currentPath = router.state.location.pathname;

  // Determine theme based on route
  const getThemeClass = () => {
    if (currentPath.startsWith('/studios')) return 'theme-studios';
    if (currentPath.startsWith('/entertainment')) return 'theme-entertainment';
    if (currentPath.startsWith('/apps') || currentPath.startsWith('/games')) return 'theme-home';
    // Common pages use mixed blue-rose gradient
    if (['/', '/about', '/support', '/privacy', '/terms'].includes(currentPath)) return 'theme-common';
    return 'theme-home';
  };

  useEffect(() => {
    // Apply performance optimizations for mobile/low-end devices
    if (isMobile || isLowEnd) {
      document.documentElement.classList.add('reduce-motion');
      document.documentElement.classList.add('reduce-effects');
    } else {
      document.documentElement.classList.remove('reduce-motion');
      document.documentElement.classList.remove('reduce-effects');
    }
  }, [isMobile, isLowEnd]);

  useEffect(() => {
    // Apply theme class to body
    const themeClass = getThemeClass();
    document.body.className = `min-h-screen ${themeClass}`;
  }, [currentPath]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <MaintenanceWrapper>
        <ThemeProvider>
          <Suspense fallback={null}>
            <AnnouncementBar />
          </Suspense>
          <Suspense fallback={<div className="h-16 border-b border-white/5" />}>
            <Header />
          </Suspense>
          <main className="min-h-[70vh]"><Outlet /></main>
          <Suspense fallback={<div className="h-20 border-t border-white/5" />}>
            <Footer />
          </Suspense>
          <Toaster position="top-right" />
        </ThemeProvider>
      </MaintenanceWrapper>
    </QueryClientProvider>
  );
}

function MaintenanceWrapper({ children }: { children: ReactNode }) {
  const { data: settings } = useQuery({
    queryKey: ["settings-all"],
    queryFn: async () => (await supabase.from("settings").select("*")).data ?? [],
  });

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });

  const router = useRouter();
  const currentPath = router.state.location.pathname;

  const maintenanceMode = settings?.find((s: any) => s.key === "maintenance_mode")?.value === true;
  const isAdmin = session?.user?.email?.endsWith('@radianforlabs.com') || session?.user?.email === 'krishnaramalesh8838@gmail.com' || currentPath.startsWith('/admin');

  // Allow admin access during maintenance
  if (maintenanceMode && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold gradient-text">Under Maintenance</h1>
          <p className="mt-4 text-sm text-muted-foreground">We're currently performing maintenance. Please check back soon.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
