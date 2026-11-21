import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile();
  }
} catch {
  // Ignore if .env is missing or already loaded
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const BASE_URL = "https://rfl-studios.com";

const staticPages = [
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

const fallbackProducts = [
  "mini-strike",
  "rfl-connect",
  "forge-ai",
  "forge-code",
  "pixel-rally",
  "forge-shield",
];

async function generateSitemap() {
  let productEntries: { slug: string; updated_at?: string }[] = [];

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from("products")
        .select("slug, updated_at")
        .eq("published", true);

      if (!error && data && data.length > 0) {
        productEntries = data;
      }
    } catch (err) {
      console.warn("Could not fetch remote products from Supabase, using fallback product list:", err);
    }
  }

  if (productEntries.length === 0) {
    productEntries = fallbackProducts.map((slug) => ({ slug }));
  }

  const currentDate = new Date().toISOString();

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  staticPages.forEach((page) => {
    sitemap += `\n  <url>\n    <loc>${BASE_URL}${page.path}</loc>\n    <lastmod>${currentDate}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`;
  });

  productEntries.forEach((product) => {
    const lastmod = product.updated_at ? new Date(product.updated_at).toISOString() : currentDate;
    sitemap += `\n  <url>\n    <loc>${BASE_URL}/products/${product.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>`;
  });

  sitemap += `\n</urlset>\n`;

  writeFileSync("public/sitemap.xml", sitemap, "utf8");
  console.log("public/sitemap.xml successfully generated with " + (staticPages.length + productEntries.length) + " URLs!");
}

generateSitemap().catch(console.error);
