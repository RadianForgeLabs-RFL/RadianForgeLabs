import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export type ProductKind = "app" | "game" | "ai";

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  features: string[] | null;
  requirements: string | null;
  kind: ProductKind;
  category_id: string | null;
  developer_id: string | null;
  publisher: string | null;
  license: string | null;
  status: string;
  source_type: string;
  play_modes: string[] | null;
  app_modes: string[] | null;
  platforms: string[] | null;
  architectures: string[] | null;
  icon_url: string | null;
  banner_url: string | null;
  banner_opacity: number | null;
  trailer_url: string | null;
  latest_version: string | null;
  release_date: string | null;
  file_size: string | null;
  changelog: string | null;
  known_issues: string | null;
  roadmap: string | null;
  dependencies: string[] | null;
  documentation_url: string | null;
  source_url: string | null;
  featured: boolean;
  coming_soon: boolean;
  published: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
};

// Released products only (published AND not coming soon)
export const productListQuery = (kind?: ProductKind | "all") =>
  queryOptions({
    queryKey: ["products", "released", kind ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .eq("coming_soon", false)
        .order("homepage_order");
      if (kind && kind !== "all") q = q.eq("kind", kind);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

// Coming soon products (published AND coming soon)
export const comingSoonQuery = (kind?: ProductKind | "all") =>
  queryOptions({
    queryKey: ["products", "coming-soon", kind ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .eq("coming_soon", true)
        .order("homepage_order");
      if (kind && kind !== "all") q = q.eq("kind", kind);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

// All published products (released AND coming soon mixed)
export const allProductsQuery = (kind?: ProductKind | "all") =>
  queryOptions({
    queryKey: ["products", "all-published", kind ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .order("homepage_order");
      if (kind && kind !== "all") q = q.eq("kind", kind);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

export const adminProductListQuery = () =>
  queryOptions({
    queryKey: ["products", "admin-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

export const comingSoonProductsQuery = () =>
  queryOptions({
    queryKey: ["products", "coming-soon"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("coming_soon", true)
        .order("homepage_order");
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

export const productBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(*), screenshots(*), downloads(*), versions(*), tags:product_tags(tag:tags(*))")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

export const newsQuery = () =>
  queryOptions({
    queryKey: ["news"],
    queryFn: async () => {
      const { data, error } = await supabase.from("news").select("*").eq("published", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

export const announcementQuery = () =>
  queryOptions({
    queryKey: ["announcement"],
    queryFn: async () => {
      const { data, error } = await supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

// Live counts from products (excludes coming-soon from the "released" tally)
export const homeCountsQuery = () =>
  queryOptions({
    queryKey: ["home-counts"],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("kind, coming_soon, published")
        .eq("published", true)
        .eq("coming_soon", false);
      if (productsError) throw productsError;
      const rows = products ?? [];
      
      // Get settings for custom counts (key-value structure)
      const { data: settings, error: settingsError } = await supabase
        .from("settings")
        .select("*");
      if (settingsError) throw settingsError;
      
      const userCount = settings?.find((s: any) => s.key === "user_count")?.value ?? "10K+";
      const playerCount = settings?.find((s: any) => s.key === "player_count")?.value ?? "10K+";
      const downloadsCount = settings?.find((s: any) => s.key === "downloads_count")?.value ?? "50K+";
      const studiosIcon = settings?.find((s: any) => s.key === "studios_icon")?.value ?? "Code";
      const entertainmentIcon = settings?.find((s: any) => s.key === "entertainment_icon")?.value ?? "Gamepad2";
      const studiosIconUrl = settings?.find((s: any) => s.key === "studios_icon_url")?.value ?? null;
      const entertainmentIconUrl = settings?.find((s: any) => s.key === "entertainment_icon_url")?.value ?? null;
      const heroBannerUrl = settings?.find((s: any) => s.key === "hero_banner_url")?.value ?? null;
      const studiosBannerUrl = settings?.find((s: any) => s.key === "studios_banner_url")?.value ?? null;
      const entertainmentBannerUrl = settings?.find((s: any) => s.key === "entertainment_banner_url")?.value ?? null;
      
      return {
        apps: rows.filter((r: any) => r.kind === "app").length,
        games: rows.filter((r: any) => r.kind === "game").length,
        userCount,
        playerCount,
        downloadsCount,
        studiosIcon,
        entertainmentIcon,
        studiosIconUrl,
        entertainmentIconUrl,
        heroBannerUrl,
        studiosBannerUrl,
        entertainmentBannerUrl,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
