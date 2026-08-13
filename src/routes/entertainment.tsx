import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { productListQuery, comingSoonQuery, homeCountsQuery } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Gamepad2, Monitor, Smartphone, Trophy, Users, Zap } from "lucide-react";

const ProductCard = lazy(() => import("@/components/site/ProductCard").then(m => ({ default: m.ProductCard })));

export const Route = createFileRoute("/entertainment")({
  head: () => ({
    meta: [
      { title: "RFL Entertainment — Games by Radian Forge Labs" },
      { name: "description", content: "PC and Android games by RFL Entertainment. Experience immersive gaming with our latest releases." },
    ],
  }),
  component: Entertainment,
});

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <Card className="border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent p-6 transition-all hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/10">
      <Icon className="h-8 w-8 text-rose-500" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}

function Entertainment() {
  const games = useQuery(productListQuery("game"));
  const comingSoon = useQuery(comingSoonQuery("game"));
  const counts = useQuery(homeCountsQuery());
  const c = counts.data ?? { entertainmentBannerUrl: null };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-rose-500/10 bg-gradient-to-b from-rose-500/5 via-transparent to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-32">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
                <span className="bg-gradient-to-r from-rose-500 to-rose-400 bg-clip-text text-transparent">RFL Entertainment</span>
              </h1>
              <p className="mt-6 max-w-2xl text-xl text-muted-foreground">
                Immersive gaming experiences for PC and Android. From casual play to epic adventures.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-gradient-to-r from-rose-500 to-rose-400 text-white hover:opacity-90">
                  <Link to="/games">Browse Games</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                  <Link to="/games">Coming Soon</Link>
                </Button>
              </div>
            </div>
            {c.entertainmentBannerUrl && (
              <div className="relative">
                <img src={String(c.entertainmentBannerUrl)} alt="Entertainment Banner" className="rounded-2xl border border-white/10 shadow-2xl" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-3xl font-bold">Our Games</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={Monitor}
            title="PC Games"
            description="High-quality games optimized for Windows with stunning graphics."
          />
          <FeatureCard
            icon={Smartphone}
            title="Mobile Games"
            description="Engaging Android games perfect for on-the-go entertainment."
          />
          <FeatureCard
            icon={Trophy}
            title="Competitive"
            description="Games designed for competitive play and leaderboards."
          />
          <FeatureCard
            icon={Users}
            title="Community"
            description="Join our growing community of gamers and enthusiasts."
          />
          <FeatureCard
            icon={Zap}
            title="Fast Updates"
            description="Regular updates with new content and features."
          />
          <FeatureCard
            icon={Gamepad2}
            title="Cross-Platform"
            description="Play across devices with synchronized progress."
          />
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Card className="border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent p-6 text-center">
            <div className="text-4xl font-bold text-rose-500">{counts.data?.games ?? 0}</div>
            <div className="mt-2 text-sm text-muted-foreground">Games</div>
          </Card>
          <Card className="border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent p-6 text-center">
            <div className="text-4xl font-bold text-rose-500">{String(counts.data?.playerCount ?? "10K+")}</div>
            <div className="mt-2 text-sm text-muted-foreground">Players</div>
          </Card>
          <Card className="border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent p-6 text-center">
            <div className="text-4xl font-bold text-rose-500">Free</div>
            <div className="mt-2 text-sm text-muted-foreground">To Play</div>
          </Card>
        </div>
      </section>

      {/* LATEST GAMES */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold">Latest Games</h2>
            <p className="mt-2 text-sm text-muted-foreground">Fresh releases from our gaming division.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/games">All Games <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={Array(6).fill(0).map((_, i) => (
            <Card key={i} className="border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent p-6">
              <div className="h-40 bg-rose-500/10 rounded animate-pulse" />
              <div className="mt-4 h-4 w-3/4 bg-rose-500/10 rounded" />
            </Card>
          ))}>
            {(games.data ?? []).slice(0, 6).map((p) => <ProductCard key={p.id} p={p} />)}
          </Suspense>
        </div>
      </section>

      {/* COMING SOON */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold">Coming Soon</h2>
            <p className="mt-2 text-sm text-muted-foreground">Games in development.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/games">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={Array(3).fill(0).map((_, i) => (
            <Card key={i} className="border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent p-6">
              <div className="h-40 bg-rose-500/10 rounded animate-pulse" />
              <div className="mt-4 h-4 w-3/4 bg-rose-500/10 rounded" />
            </Card>
          ))}>
            {(comingSoon.data ?? []).slice(0, 3).map((p) => <ProductCard key={p.id} p={p} />)}
          </Suspense>
        </div>
      </section>
    </div>
  );
}
