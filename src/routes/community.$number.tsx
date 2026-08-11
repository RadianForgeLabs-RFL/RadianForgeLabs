import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { communitySettingsQuery } from "@/lib/community";
import { fetchDiscussion } from "@/lib/community.functions";
import { GiscusThread } from "@/components/site/GiscusThread";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Github } from "lucide-react";

export const Route = createFileRoute("/community/$number")({
  head: ({ params }) => ({
    meta: [
      { title: `Discussion #${params.number} — Radian Forge Labs Community` },
      { name: "description", content: "Read and join this Radian Forge Labs community discussion." },
      { property: "og:title", content: `Discussion #${params.number} — RFL Community` },
      { property: "og:description", content: "Read and join this Radian Forge Labs community discussion." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { number } = Route.useParams();
  const settings = useQuery(communitySettingsQuery());
  const run = useServerFn(fetchDiscussion);
  const s = settings.data;

  const thread = useQuery({
    queryKey: ["community-thread", s?.repo_owner, s?.repo_name, number],
    enabled: !!s?.enabled && !!s?.repo_owner,
    queryFn: () => run({ data: { owner: s!.repo_owner, name: s!.repo_name, number: Number(number) } }),
  });

  if (!s || thread.isLoading) return <div className="p-16 text-center text-muted-foreground">Loading…</div>;

  const d = thread.data?.discussion;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/community"><ArrowLeft className="mr-2 h-4 w-4" />Back to community</Link>
      </Button>

      {!d && (
        <Card className="p-10 text-center text-muted-foreground">
          {thread.data?.error ?? "This discussion could not be found."}
        </Card>
      )}

      {d && (
        <>
          <div className="glass rounded-2xl border border-white/5 p-6">
            <div className="flex flex-wrap items-center gap-2">
              {d.category && <Badge variant="outline">{d.category.emoji} {d.category.name}</Badge>}
              {d.isAnswered && <Badge className="bg-emerald-500/15 text-emerald-400"><CheckCircle2 className="mr-1 h-3 w-3" />Answered</Badge>}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{d.title}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              {d.author?.avatarUrl && <img src={d.author.avatarUrl} alt={`${d.author.login} avatar`} className="h-6 w-6 rounded-full" />}
              <span>{d.author?.login ?? "unknown"} · {new Date(d.createdAt).toLocaleDateString()}</span>
              {s.show_github_links && (
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 hover:text-foreground">
                  <Github className="h-4 w-4" />View on GitHub
                </a>
              )}
            </div>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{d.bodyText}</p>
          </div>

          <div className="mt-6">
            <GiscusThread settings={s} categoryId={d.category?.id ?? ""} term={String(d.number)} />
          </div>
        </>
      )}
    </div>
  );
}
