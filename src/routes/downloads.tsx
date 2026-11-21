import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productListQuery } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "Downloads — Official Software & Game Releases | RFL Studios" },
      { name: "description", content: "Direct downloads for official apps and games developed by Radian Forge Labs. Verified installers and APKs for Windows, Linux, Mac, and Android." },
      { property: "og:title", content: "Downloads — Official Software & Game Releases | RFL Studios" },
      { property: "og:description", content: "Direct downloads for official apps and games developed by Radian Forge Labs for Windows, Linux, Mac, and Android." },
      { property: "og:url", content: "https://rfl-studios.com/downloads" },
      { property: "og:image", content: "https://rfl-studios.com/og-image.png" },
      { name: "twitter:title", content: "Downloads — Official Releases | RFL Studios" },
      { name: "twitter:description", content: "Direct downloads for official apps and games developed by Radian Forge Labs for Windows, Linux, Mac, and Android." },
      { name: "twitter:image", content: "https://rfl-studios.com/og-image.png" },
    ],
    links: [
      { rel: "canonical", href: "https://rfl-studios.com/downloads" },
    ],
  }),
  component: Downloads,
});

function Downloads() {
  const { data } = useQuery(productListQuery("all"));
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-4xl font-bold md:text-5xl gradient-text">Downloads</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Every release across every platform — Windows, Linux, Mac, Android and more.</p>
      <div className="mt-8 space-y-4">
        {(data ?? []).map((p) => (
          <Card key={p.id} className="glass border-white/5 bg-transparent p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
              <div className="min-w-0">
                <Link to="/products/$slug" params={{ slug: p.slug }} className="text-lg font-semibold hover:text-primary">{p.name}</Link>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(p.platforms ?? []).map((pl) => <Badge key={pl} variant="outline" className="border-white/10">{pl}</Badge>)}
                  <Badge variant="outline" className="border-white/10">v{p.latest_version}</Badge>
                  <Badge variant="outline" className="border-white/10 text-muted-foreground">{p.file_size}</Badge>
                </div>
              </div>
              <Link to="/products/$slug" params={{ slug: p.slug }} className="inline-flex items-center gap-2 rounded-md bg-gradient-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-glow">
                <Download className="h-4 w-4" /> Download
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
