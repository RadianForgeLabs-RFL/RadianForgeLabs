import { createFileRoute, Link, useQuery } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { communitySettingsQuery, communityCategoriesQuery } from "@/lib/community";
import { fetchRepoMeta, fetchDiscussions } from "@/lib/community.functions";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community - Radian Forge Labs" },
      { name: "description", content: "Join the Radian Forge Labs community discussions." },
      { property: "og:title", content: "Community - Radian Forge Labs" },
      { property: "og:description", content: "Join the Radian Forge Labs community discussions." },
    ],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const settings = useQuery(communitySettingsQuery());
  const categories = useQuery(communityCategoriesQuery());

  const repoMeta = useQuery({
    queryKey: ["repo-meta", settings.data?.repo_owner, settings.data?.repo_name],
    queryFn: () => fetchRepoMeta({ data: { owner: settings.data?.repo_owner || "", name: settings.data?.repo_name || "" } }),
    enabled: !!settings.data?.repo_owner && !!settings.data?.repo_name,
  });

  const discussions = useQuery({
    queryKey: ["discussions", settings.data?.repo_owner, settings.data?.repo_name, null],
    queryFn: () => fetchDiscussions({ data: { owner: settings.data?.repo_owner || "", name: settings.data?.repo_name || "", categoryId: null, limit: 20 } }),
    enabled: !!settings.data?.repo_owner && !!settings.data?.repo_name && repoMeta.data?.ok,
  });

  const isLoading = settings.isLoading || categories.isLoading || repoMeta.isLoading || discussions.isLoading;
  const hasError = repoMeta.data?.error || discussions.data?.error;

  const displayCategories = categories.data?.length ? categories.data : repoMeta.data?.ok ? repoMeta.data.categories : [];
  const displayDiscussions = discussions.data?.ok ? discussions.data.discussions : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Community</h1>
        <p className="text-muted-foreground">Join discussions, share ideas, and connect with the community.</p>
      </div>

      {hasError && (
        <Card className="mb-6 border border-yellow-500/20 bg-yellow-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-500">Community Features Unavailable</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {repoMeta.data?.error || discussions.data?.error || "Unable to load community discussions. This may be due to missing GitHub configuration."}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar - Categories */}
        <aside className="glass sticky top-24 h-fit rounded-xl border border-white/5 p-4">
          <h2 className="mb-4 text-lg font-semibold">Categories</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <nav className="flex flex-col gap-2">
              {displayCategories.map((cat) => (
                <button
                  key={cat.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium">{cat.name}</div>
                    <div className="text-xs opacity-70">{cat.description}</div>
                  </div>
                </button>
              ))}
            </nav>
          )}
        </aside>

        {/* Main Content - Discussions */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Discussions</h2>
            <Button variant="outline" size="sm" asChild>
              <a href={`https://github.com/${settings.data?.repo_owner}/${settings.data?.repo_name}/discussions/new`} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="mr-2 h-4 w-4" />
                New Discussion
              </a>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : displayDiscussions.length === 0 ? (
            <Card className="border border-white/5 bg-white/5 p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Discussions Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to start a conversation in the community.
              </p>
              <Button variant="outline" asChild>
                <a href={`https://github.com/${settings.data?.repo_owner}/${settings.data?.repo_name}/discussions/new`} target="_blank" rel="noopener noreferrer">
                  Start a Discussion
                </a>
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayDiscussions.map((disc) => (
                <Card key={disc.id} className="border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition-colors">
                  <Link to="/community/$number" params={{ number: disc.number.toString() }}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-500">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {disc.isAnswered && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                        <h3 className="font-semibold text-foreground mb-1 hover:text-purple-400 transition-colors">{disc.title}</h3>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {disc.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(disc.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {disc.upvoteCount} upvotes
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Sign in with GitHub to participate in discussions.
            </p>
            <Button variant="outline" asChild>
              <a href={`https://github.com/${settings.data?.repo_owner}/${settings.data?.repo_name}`} target="_blank" rel="noopener noreferrer">
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
