import { createFileRoute, Link, useQuery } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, CheckCircle, Clock, User, AlertCircle, Loader2 } from "lucide-react";
import { communitySettingsQuery } from "@/lib/community";
import { fetchDiscussion } from "@/lib/community.functions";

export const Route = createFileRoute("/community/$number")({
  head: ({ params }) => ({
    meta: [
      { title: `Discussion #${params.number} - Radian Forge Labs Community` },
      { name: "description", content: "Read and join this Radian Forge Labs community discussion." },
      { property: "og:title", content: `Discussion #${params.number} - RFL Community` },
      { property: "og:description", content: "Read and join this Radian Forge Labs community discussion." },
    ],
  }),
  component: DiscussionPage,
});

function DiscussionPage() {
  const { number } = Route.useParams();
  const settings = useQuery(communitySettingsQuery());

  const discussion = useQuery({
    queryKey: ["discussion", settings.data?.repo_owner, settings.data?.repo_name, number],
    queryFn: () => fetchDiscussion({ data: { owner: settings.data?.repo_owner || "", name: settings.data?.repo_name || "", number: parseInt(number) } }),
    enabled: !!settings.data?.repo_owner && !!settings.data?.repo_name,
  });

  if (discussion.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link to="/community">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to community
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (discussion.data?.error || !discussion.data?.discussion) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Link to="/community">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to community
            </Button>
          </Link>
        </div>
        <Card className="border border-yellow-500/20 bg-yellow-500/5 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-500">Discussion Not Found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {discussion.data?.error || "This discussion could not be loaded. It may have been deleted or you may not have access to it."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const disc = discussion.data.discussion;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link to="/community">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to community
          </Button>
        </Link>
      </div>

      <Card className="border border-white/5 bg-white/5 p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 text-purple-500">
            <User className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold">{disc.title}</h1>
              {disc.isAnswered && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {disc.author}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(disc.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {disc.upvoteCount} upvotes
              </span>
            </div>
          </div>
        </div>

        <div className="prose prose-invert max-w-none mb-6">
          <p>{disc.bodyText}</p>
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Sign in with GitHub to reply to this discussion.
          </p>
          <Button variant="outline" asChild>
            <a href={`https://github.com/${settings.data?.repo_owner}/${settings.data?.repo_name}/discussions/${disc.number}`} target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
          </Button>
        </div>
      </Card>

      {/* Placeholder for Giscus widget */}
      <Card className="border border-white/5 bg-white/5 p-6 mt-6">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Comments powered by GitHub Discussions</p>
          <p className="text-sm mt-2">Sign in with GitHub to participate.</p>
        </div>
      </Card>
    </div>
  );
}
