import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadges";
import { PreorderButton } from "./PreorderButton";
import type { Product } from "@/lib/data";
import { Download } from "lucide-react";

const KIND_LABEL: Record<string, string> = { app: "App", game: "Game", ai: "Tool" };
const KIND_GRADIENT: Record<string, string> = {
  app: "from-blue-500/30 to-cyan-400/20",
  game: "from-rose-500/30 to-rose-400/20",
  ai: "from-emerald-500/30 to-teal-400/20",
};
const KIND_HOVER_COLOR: Record<string, string> = {
  app: "group-hover:text-blue-500",
  game: "group-hover:text-rose-500",
  ai: "group-hover:text-emerald-500",
};
const KIND_BORDER_COLOR: Record<string, string> = {
  app: "hover:border-blue-500/40",
  game: "hover:border-rose-500/40",
  ai: "hover:border-emerald-500/40",
};
const KIND_BADGE_COLOR: Record<string, string> = {
  app: "bg-blue-500/90",
  game: "bg-rose-500/90",
  ai: "bg-emerald-500/90",
};

export function ProductCard({ p }: { p: Product }) {
  const bannerOpacity = (p as any).banner_opacity ?? 0.55;
  return (
    <Link
      to="/products/$slug"
      params={{ slug: p.slug }}
      className="group block"
    >
      <Card className={`glass overflow-hidden border-white/5 bg-transparent transition-all duration-300 hover:-translate-y-1 ${KIND_BORDER_COLOR[p.kind] ?? 'hover:border-primary/40'}`}>
        <div className={`relative h-32 overflow-hidden bg-gradient-to-br ${KIND_GRADIENT[p.kind]}`}>
          {p.banner_url && (
            <img
              src={p.banner_url}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 md:group-hover:scale-105"
              style={{ opacity: bannerOpacity }}
            />
          )}
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="absolute inset-0 flex items-center justify-center">
            {p.icon_url ? (
              <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/20 glass-strong">
                <img src={p.icon_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-2xl glass-strong text-2xl font-bold text-foreground">
                {p.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
            <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
              {KIND_LABEL[p.kind] ?? p.kind}
            </span>
            {(p as any).coming_soon && (
              <span className={`rounded-md ${KIND_BADGE_COLOR[p.kind] ?? 'bg-primary/90'} px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-foreground shadow`}>
                Coming Soon
              </span>
            )}
          </div>

        </div>
        <div className="p-4">
          <h3 className={`truncate text-base font-semibold text-foreground ${KIND_HOVER_COLOR[p.kind] ?? 'group-hover:text-primary'}`}>{p.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.tagline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <StatusBadge value={p.status} />
            <StatusBadge value={p.source_type} />
          </div>
          {(p as any).coming_soon ? (
            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
              <PreorderButton productId={p.id} slug={p.slug} kind={p.kind} />
            </div>
          ) : (p as any).downloads && (p as any).downloads.length > 0 ? (
            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
              <Button asChild size="sm" className={`w-full bg-gradient-to-r ${KIND_GRADIENT[p.kind]?.replace('/30', '/90').replace('/20', '/80') ?? 'bg-primary'} text-white hover:opacity-90`}>
                <a href={(p as any).downloads[0].url} target="_blank" rel="noreferrer">
                  <Download className="mr-2 h-3 w-3" /> Download
                </a>
              </Button>
            </div>
          ) : null}
          {p.latest_version && !(p as any).coming_soon && (
            <div className="mt-2 text-xs text-muted-foreground">v{p.latest_version}</div>
          )}
        </div>
      </Card>
    </Link>
  );
}
