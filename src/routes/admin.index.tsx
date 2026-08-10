import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, news] = await Promise.all([
        supabase.from("products").select("id, kind, published"),
        supabase.from("news").select("id, published"),
      ]);
      return {
        totalProducts: products.data?.length ?? 0,
        apps: products.data?.filter((p: any) => p.kind === "app").length ?? 0,
        games: products.data?.filter((p: any) => p.kind === "game").length ?? 0,
        published: products.data?.filter((p: any) => p.published).length ?? 0,
        news: news.data?.length ?? 0,
      };
    },
  });
  const s = stats.data;

  const cards = [
    ["Products", s?.totalProducts], ["Apps", s?.apps], ["Games", s?.games],
    ["Published", s?.published], ["News posts", s?.news],
  ];


  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Overview of your RadianForgeLabs portal.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([l, v]) => (
          <Card key={l as string} className="glass border-white/5 bg-transparent p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{l}</div>
            <div className="mt-1 text-2xl font-bold gradient-text">{v ?? "—"}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
