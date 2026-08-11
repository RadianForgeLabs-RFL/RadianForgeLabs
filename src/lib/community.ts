import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommunitySettings {
  id: string;
  repo_owner: string;
  repo_name: string;
  repo_id: string | null;
  comments_enabled: boolean;
  mapping: "pathname" | "url" | "title" | "number";
  theme: "dark" | "light" | "preferred_color_scheme";
  theme_follows_site: boolean;
  reactions_enabled: boolean;
  input_position: "top" | "bottom";
  lazy_load: boolean;
}

export interface CommunityCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  slug: string;
  visible: boolean;
  sort_order: number;
}

export interface Discussion {
  id: string;
  number: number;
  title: string;
  author: string;
  createdAt: string;
  isAnswered: boolean;
  upvoteCount: number;
  bodyText: string;
  categoryName?: string;
}

const DEFAULT_COMMUNITY_SETTINGS: CommunitySettings = {
  id: "default",
  repo_owner: "RadianForgeLabs-RFL",
  repo_name: "RFL-Studios",
  repo_id: null,
  comments_enabled: true,
  mapping: "pathname",
  theme: "preferred_color_scheme",
  theme_follows_site: true,
  reactions_enabled: true,
  input_position: "bottom",
  lazy_load: true,
};

export function communitySettingsQuery() {
  return queryOptions({
    queryKey: ["community-settings"],
    queryFn: async (): Promise<CommunitySettings> => {
      try {
        const { data } = await supabase.from("community_settings").select("*").eq("id", "default").maybeSingle();
        return (data as CommunitySettings | null) ?? DEFAULT_COMMUNITY_SETTINGS;
      } catch (error) {
        console.error("Error fetching community settings:", error);
        return DEFAULT_COMMUNITY_SETTINGS;
      }
    },
  });
}

export function communityCategoriesQuery(onlyVisible = true) {
  return queryOptions({
    queryKey: ["community-categories", onlyVisible],
    queryFn: async (): Promise<CommunityCategory[]> => {
      try {
        let q = supabase.from("community_categories").select("*").order("sort_order", { ascending: true });
        if (onlyVisible) q = q.eq("visible", true);
        const { data } = await q;
        return (data as CommunityCategory[] | null) ?? [];
      } catch (error) {
        console.error("Error fetching community categories:", error);
        return [];
      }
    },
  });
}
