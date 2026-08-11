import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticPaths = ["/", "/apps", "/games", "/projects", "/downloads", "/about", "/support"];
        const { data } = await supabase.from("products").select("slug, updated_at").eq("published", true);
        const dynamic = (data ?? []).map((p) => ({ path: `/products/${p.slug}`, lastmod: (p as any).updated_at as string }));
        const entries = [
          ...staticPaths.map((p) => ({ path: p, changefreq: "weekly" as const, priority: p === "/" ? "1.0" : "0.7" })),
          ...dynamic.map((d) => ({ ...d, changefreq: "weekly" as const, priority: "0.6" })),
        ];
        const urls = entries.map((e: any) => `  <url>
    <loc>${BASE_URL}${e.path}</loc>${e.lastmod ? `\n    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : ""}
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
