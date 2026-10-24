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

export const Route = createFileRoute("/apps")({
  head: () => ({
    meta: [
      { title: "All Apps — RFL Studios" },
      { name: "description", content: "Browse all applications from RFL Studios, including released and coming soon apps." },
    ],
  }),
  component: Apps,
});

function Apps() {
  const apps = useQuery(productListQuery("app"));
  const [searchQuery, setSearchQuery] = useState("");

  const filteredApps = (apps.data ?? []).filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-blue-500/10 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-32">
          <BackButton to="/" label="Back to Home" />
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">All Apps</span>
            </h1>
            <p className="mt-6 max-w-2xl text-xl text-muted-foreground md:text-2xl">
              Browse all applications from RFL Studios, including released and coming soon projects.
            </p>
          </div>
        </div>
      </section>

      {/* APPS GRID */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        {/* Search Bar */}
        <div className="mb-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-blue-500/30 bg-blue-500/5 focus:border-blue-500/50"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={Array(6).fill(0).map((_, i) => (
            <Card key={i} className="border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent p-6">
              <div className="h-40 bg-blue-500/10 rounded animate-pulse" />
              <div className="mt-4 h-4 w-3/4 bg-blue-500/10 rounded" />
            </Card>
          ))}>
            {filteredApps.map((p) => <ProductCard key={p.id} p={p} />)}
          </Suspense>
        </div>
        {filteredApps.length === 0 && apps.data && apps.data.length > 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No apps found matching "{searchQuery}".</p>
          </div>
        )}
        {apps.data?.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No apps available yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
