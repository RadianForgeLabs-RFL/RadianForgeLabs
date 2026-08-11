import { useEffect, useState } from "react";
import Giscus from "@giscus/react";
import type { CommunitySettings } from "@/lib/community";

function useSiteTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setDark(el.classList.contains("dark"));
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export function GiscusThread({
  settings,
  categoryId,
  term,
}: {
  settings: CommunitySettings;
  categoryId: string;
  term: string;
}) {
  const dark = useSiteTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!settings.comments_enabled) {
    return (
      <div className="glass rounded-xl border border-white/5 p-6 text-center text-sm text-muted-foreground">
        Comments are currently disabled by the administrators.
      </div>
    );
  }
  if (!settings.repo_id) {
    return (
      <div className="glass rounded-xl border border-white/5 p-6 text-center text-sm text-muted-foreground">
        The discussion widget isn’t configured yet.
      </div>
    );
  }
  if (!mounted) return <div className="h-40 animate-pulse rounded-xl bg-white/5" />;

  const theme = settings.theme_follows_site ? (dark ? "dark" : "light") : settings.theme;

  return (
    <div className="glass rounded-xl border border-white/5 p-4">
      <Giscus
        id={`giscus-${term}`}
        repo={`${settings.repo_owner}/${settings.repo_name}` as `${string}/${string}`}
        repoId={settings.repo_id}
        category=""
        categoryId={categoryId}
        mapping={(settings.mapping || "number") as any}
        term={term}
        strict="0"
        reactionsEnabled={settings.reactions_enabled ? "1" : "0"}
        emitMetadata="0"
        inputPosition={(settings.input_position === "top" ? "top" : "bottom") as "top" | "bottom"}
        theme={theme}
        lang="en"
        loading={settings.lazy_load ? "lazy" : "eager"}
      />
    </div>
  );
}
