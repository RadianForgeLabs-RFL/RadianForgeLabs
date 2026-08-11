import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, CheckCircle, Clock, User } from "lucide-react";

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

  // Placeholder data - will be replaced with GitHub API data
  const discussion = {
    number: parseInt(number),
    title: "Welcome to the community!",
    author: "admin",
    createdAt: "2024-01-01T10:00:00Z",
    isAnswered: true,
    body: "Welcome to the Radian Forge Labs community! This is a place to discuss our projects, share ideas, and get help from other community members.",
    comments: [
      {
        id: "1",
        author: "user1",
        createdAt: "2024-01-01T11:00:00Z",
        body: "Thanks for the welcome! Excited to be here.",
      },
      {
        id: "2",
        author: "user2",
        createdAt: "2024-01-01T12:00:00Z",
        body: "Looking forward to the discussions!",
      },
    ],
  };

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
              <h1 className="text-2xl font-bold">{discussion.title}</h1>
              {discussion.isAnswered && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {discussion.author}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(discussion.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {discussion.comments.length} comments
              </span>
            </div>
          </div>
        </div>

        <div className="prose prose-invert max-w-none mb-6">
          <p>{discussion.body}</p>
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Sign in with GitHub to reply to this discussion.
          </p>
          <Button variant="outline">
            Sign in with GitHub
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Comments</h2>
        {discussion.comments.map((comment) => (
          <Card key={comment.id} className="border border-white/5 bg-white/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-500">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{comment.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{comment.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
