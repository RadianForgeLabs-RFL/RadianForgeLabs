import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://rfl-studios.com";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries: { path: string; lastmod?: string; changefreq: string; priority: string }[] = [
          { path: "", changefreq: "daily", priority: "1.0" },
          { path: "/studios", changefreq: "daily", priority: "0.9" },
          { path: "/entertainment", changefreq: "daily", priority: "0.9" },
          { path: "/apps", changefreq: "daily", priority: "0.9" },
          { path: "/games", changefreq: "daily", priority: "0.9" },
          { path: "/community", changefreq: "daily", priority: "0.8" },
          { path: "/downloads", changefreq: "weekly", priority: "0.8" },
          { path: "/projects", changefreq: "weekly", priority: "0.8" },
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/support", changefreq: "monthly", priority: "0.7" },
          { path: "/privacy", changefreq: "monthly", priority: "0.5" },
          { path: "/terms", changefreq: "monthly", priority: "0.5" },
        ];

        let dynamicEntries: { path: string; lastmod?: string; changefreq: string; priority: string }[] = [];
        try {
          const { data } = await supabase
            .from("products")
            .select("slug, updated_at")
            .eq("published", true);

          if (data && data.length > 0) {
            dynamicEntries = data.map((p) => ({
              path: `/products/${p.slug}`,
              lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
              changefreq: "weekly",
              priority: "0.9",
            }));
          }
        } catch (e) {
          console.error("Error fetching products for sitemap:", e);
        }

        const allEntries = [...staticEntries, ...dynamicEntries];
        const urls = allEntries
          .map(
            (e) => `  <url>
    <loc>${BASE_URL}${e.path}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
          },
        });
      },
    },
  },
});
