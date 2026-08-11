import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CommunitySettings = {
  id: string;
  enabled: boolean;
  repo_owner: string;
  repo_name: string;
  repo_id: string | null;
  mapping: string;
  theme_follows_site: boolean;
  theme: string;
  reactions_enabled: boolean;
  input_position: string;
  lazy_load: boolean;
  allow_new_discussions: boolean;
  comments_enabled: boolean;
  show_github_links: boolean;
};

export type CommunityCategory = {
  id: string;
  github_category_id: string;
  slug: string;
  name: string;
  emoji: string | null;
  description: string | null;
  section: string;
  visible: boolean;
  sort_order: number;
};

export const DEFAULT_COMMUNITY_SETTINGS: CommunitySettings = {
  id: "default",
  enabled: true,
  repo_owner: "RadianForgeLabs",
  repo_name: "Community",
  repo_id: null,
  mapping: "number",
  theme_follows_site: true,
  theme: "dark",
  reactions_enabled: true,
  input_position: "bottom",
  lazy_load: true,
  allow_new_discussions: true,
  comments_enabled: true,
  show_github_links: true,
};

export const SECTIONS = [
  { value: "studios", label: "RFL Studios" },
  { value: "entertainment", label: "RFL Entertainment" },
  { value: "general", label: "General" },
] as const;

export function communitySettingsQuery() {
  return queryOptions({
    queryKey: ["community-settings"],
    queryFn: async (): Promise<CommunitySettings> => {
      const { data } = await supabase.from("community_settings").select("*").eq("id", "default").maybeSingle();
      return (data as CommunitySettings | null) ?? DEFAULT_COMMUNITY_SETTINGS;
    },
  });
}

export function communityCategoriesQuery(onlyVisible = true) {
  return queryOptions({
    queryKey: ["community-categories", onlyVisible],
    queryFn: async (): Promise<CommunityCategory[]> => {
      let q = supabase.from("community_categories").select("*").order("sort_order", { ascending: true });
      if (onlyVisible) q = q.eq("visible", true);
      const { data } = await q;
      return (data as CommunityCategory[] | null) ?? [];
    },
  });
}
