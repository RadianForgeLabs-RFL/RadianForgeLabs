import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { productListQuery, comingSoonQuery, homeCountsQuery } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Code, Smartphone, Download, Zap } from "lucide-react";

const ProductCard = lazy(() => import("@/components/site/ProductCard").then(m => ({ default: m.ProductCard })));

export const Route = createFileRoute("/studios")({
  head: () => ({
    meta: [
      { title: "RFL Studios — Apps, Tools & Software by Radian Forge Labs" },
      { name: "description", content: "Professional Windows and Android applications, utilities, and developer tools by RFL Studios." },
    ],
  }),
  component: Studios,
});

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <Card className="border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent p-6 transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10">
      <Icon className="h-8 w-8 text-blue-500" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}

function Studios() {
  const apps = useQuery(productListQuery("app"));
  const comingSoon = useQuery(comingSoonQuery("app"));
  const counts = useQuery(homeCountsQuery());
  const c = counts.data ?? { studiosBannerUrl: null };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-blue-500/10 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-32">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">RFL Studios</span>
              </h1>
              <p className="mt-6 max-w-2xl text-xl text-muted-foreground">
                Professional software solutions for Windows and Android. Building tools that empower developers and users alike.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:opacity-90">
                  <Link to="/apps">Browse Apps</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                  <Link to="/apps">Coming Soon</Link>
                </Button>
              </div>
            </div>
            {c.studiosBannerUrl && (
              <div className="relative">
                <img src={String(c.studiosBannerUrl)} alt="Studios Banner" className="rounded-2xl border border-white/10 shadow-2xl" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-3xl font-bold">What We Build</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={Smartphone}
            title="Mobile Apps"
            description="Android applications designed for productivity and utility."
          />
          <FeatureCard
            icon={Code}
            title="Developer Tools"
            description="Tools and utilities to streamline your development workflow."
          />
          <FeatureCard
            icon={Download}
            title="Utilities"
            description="Essential utilities for everyday computing tasks."
          />
          <FeatureCard
            icon={Zap}
            title="Open Source"
            description="Contributing to the open-source community with quality software."
          />
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Card className="border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent p-6 text-center">
            <div className="text-4xl font-bold text-blue-500">{counts.data?.apps ?? 0}</div>
            <div className="mt-2 text-sm text-muted-foreground">Applications</div>
          </Card>
          <Card className="border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent p-6 text-center">
            <div className="text-4xl font-bold text-blue-500">100%</div>
            <div className="mt-2 text-sm text-muted-foreground">Free & Open</div>
          </Card>
          <Card className="border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent p-6 text-center">
            <div className="text-4xl font-bold text-blue-500">24/7</div>
            <div className="mt-2 text-sm text-muted-foreground">Support</div>
          </Card>
        </div>
      </section>

      {/* LATEST APPS */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold">Latest Applications</h2>
            <p className="mt-2 text-sm text-muted-foreground">Fresh releases from our software division.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/apps">All Apps <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={Array(6).fill(0).map((_, i) => (
            <Card key={i} className="border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent p-6">
              <div className="h-40 bg-blue-500/10 rounded animate-pulse" />
              <div className="mt-4 h-4 w-3/4 bg-blue-500/10 rounded" />
            </Card>
          ))}>
            {(apps.data ?? []).slice(0, 6).map((p) => <ProductCard key={p.id} p={p} />)}
          </Suspense>
        </div>
      </section>

      {/* COMING SOON */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold">Coming Soon</h2>
            <p className="mt-2 text-sm text-muted-foreground">Applications and tools in development.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/apps">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={Array(3).fill(0).map((_, i) => (
            <Card key={i} className="border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent p-6">
              <div className="h-40 bg-blue-500/10 rounded animate-pulse" />
              <div className="mt-4 h-4 w-3/4 bg-blue-500/10 rounded" />
            </Card>
          ))}>
            {(comingSoon.data ?? []).slice(0, 3).map((p) => <ProductCard key={p.id} p={p} />)}
          </Suspense>
        </div>
      </section>
    </div>
  );
}
