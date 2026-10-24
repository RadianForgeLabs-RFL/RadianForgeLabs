import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import { productListQuery } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BackButton } from "@/components/ui/back-button";
import { ArrowRight, Search } from "lucide-react";

const ProductCard = lazy(() => import("@/components/site/ProductCard").then(m => ({ default: m.ProductCard })));

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "All Games — RFL Entertainment" },
      { name: "description", content: "Browse all games from RFL Entertainment, including released and coming soon games." },
    ],
  }),
  component: Games,
});

function Games() {
  const games = useQuery(productListQuery("game"));
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGames = (games.data ?? []).filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-rose-500/10 bg-gradient-to-b from-rose-500/5 via-transparent to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-32">
          <BackButton to="/" label="Back to Home" />
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              <span className="bg-gradient-to-r from-rose-500 to-rose-400 bg-clip-text text-transparent">All Games</span>
            </h1>
            <p className="mt-6 max-w-2xl text-xl text-muted-foreground md:text-2xl">
              Browse all games from RFL Entertainment, including released and coming soon projects.
            </p>
          </div>
        </div>
      </section>

      {/* GAMES GRID */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        {/* Search Bar */}
        <div className="mb-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-rose-500/30 bg-rose-500/5 focus:border-rose-500/50"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={Array(6).fill(0).map((_, i) => (
            <Card key={i} className="border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent p-6">
              <div className="h-40 bg-rose-500/10 rounded animate-pulse" />
              <div className="mt-4 h-4 w-3/4 bg-rose-500/10 rounded" />
            </Card>
          ))}>
            {filteredGames.map((p) => <ProductCard key={p.id} p={p} />)}
          </Suspense>
        </div>
        {filteredGames.length === 0 && games.data && games.data.length > 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No games found matching "{searchQuery}".</p>
          </div>
        )}
        {games.data?.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No games available yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
