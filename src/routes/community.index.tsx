import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { communityCategoriesQuery, communitySettingsQuery, SECTIONS } from "@/lib/community";
import { fetchDiscussions } from "@/lib/community.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, CheckCircle2, Github, Plus, Users } from "lucide-react";

export const Route = createFileRoute("/community/")({
  head: () => ({
    meta: [
      { title: "Community — Radian Forge Labs" },
      { name: "description", content: "Ask questions, share ideas and get help from the Radian Forge Labs community, powered by GitHub Discussions." },
      { property: "og:title", content: "Community — Radian Forge Labs" },
      { property: "og:description", content: "Discussions, ideas and support for RFL Studios and RFL Entertainment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunityPage,
});

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d > 30) return new Date(iso).toLocaleDateString();
  if (d >= 1) return `${d}d ago`;
  const h = Math.floor(diff / 3600000);
  if (h >= 1) return `${h}h ago`;
  return "just now";
}

function CommunityPage() {
  const settings = useQuery(communitySettingsQuery());
  const cats = useQuery(communityCategoriesQuery(true));
  const [active, setActive] = useState<string | null>(null);
  const run = useServerFn(fetchDiscussions);
  const s = settings.data;

  const threads = useQuery({
    queryKey: ["community-threads", s?.repo_owner, s?.repo_name, active],
    enabled: !!s?.enabled && !!s?.repo_owner,
    queryFn: () => run({ data: { owner: s!.repo_owner, name: s!.repo_name, categoryId: active, limit: 30 } }),
    staleTime: 60_000,
  });

  if (settings.isLoading) return <div className="p-16 text-center text-muted-foreground">Loading…</div>;

  if (!s?.enabled) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Community is currently unavailable</h1>
        <p className="mt-3 text-muted-foreground">Our discussion space is temporarily switched off. Please check back soon.</p>
      </div>
    );
  }

  const repoUrl = `https://github.com/${s.repo_owner}/${s.repo_name}/discussions`;
  const grouped = SECTIONS.map((sec) => ({ ...sec, items: (cats.data ?? []).filter((c) => c.section === sec.value) })).filter((g) => g.items.length);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="glass mb-8 rounded-2xl border border-white/5 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">Community</span>
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Ask questions, report bugs and share ideas with the Radian Forge Labs team. Discussions are powered by GitHub — sign in with your GitHub account to take part.
            </p>
          </div>
          <div className="flex gap-2">
            {s.allow_new_discussions && (
              <Button asChild className="bg-gradient-brand text-brand-foreground shadow-glow">
                <a href={`${repoUrl}/new`} target="_blank" rel="noopener noreferrer"><Plus className="mr-2 h-4 w-4" />New discussion</a>
              </Button>
            )}
            {s.show_github_links && (
              <Button asChild variant="outline">
                <a href={repoUrl} target="_blank" rel="noopener noreferrer"><Github className="mr-2 h-4 w-4" />View on GitHub</a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="glass h-fit rounded-xl border border-white/5 p-3 lg:sticky lg:top-24">
          <button
            onClick={() => setActive(null)}
            className={`mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${active === null ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
          >
            <Users className="h-4 w-4" /> All discussions
          </button>
          {grouped.map((g) => (
            <div key={g.value} className="mt-3">
              <div className="px-3 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{g.label}</div>
              {g.items.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActive(c.github_category_id)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${active === c.github_category_id ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                >
                  <span>{c.emoji ?? "💬"}</span>
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          ))}
          {!grouped.length && <p className="px-3 py-2 text-xs text-muted-foreground">No categories configured yet.</p>}
        </aside>

        <div className="space-y-3">
          {threads.isLoading && <div className="p-10 text-center text-muted-foreground">Loading discussions…</div>}
          {threads.data && !threads.data.ok && (
            <Card className="border border-amber-500/30 bg-amber-500/5 p-6 text-sm text-foreground">
              Couldn’t load discussions: {threads.data.error}
            </Card>
          )}
          {threads.data?.ok && threads.data.discussions.length === 0 && (
            <Card className="p-10 text-center text-muted-foreground">No discussions here yet — be the first to start one.</Card>
          )}
          {threads.data?.ok &&
            threads.data.discussions.map((d) => (
              <Card key={d.id} className="glass border border-white/5 p-5 transition hover:border-primary/30">
                <div className="flex items-start gap-4">
                  {d.author?.avatarUrl && <img src={d.author.avatarUrl} alt={`${d.author.login} avatar`} className="h-10 w-10 rounded-full" loading="lazy" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to="/community/$number" params={{ number: String(d.number) }} className="truncate text-lg font-semibold hover:text-primary">
                        {d.title}
                      </Link>
                      {d.category && <Badge variant="outline">{d.category.emoji} {d.category.name}</Badge>}
                      {d.isAnswered && <Badge className="bg-emerald-500/15 text-emerald-400"><CheckCircle2 className="mr-1 h-3 w-3" />Answered</Badge>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.bodyText}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>{d.author?.login ?? "unknown"} · {timeAgo(d.createdAt)}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{d.comments.totalCount}</span>
                      {s.reactions_enabled && <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{d.upvoteCount}</span>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
