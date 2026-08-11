import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, ExternalLink } from "lucide-react";

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

      <Card className="border border-white/5 bg-white/5 p-8 text-center">
        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-2xl font-bold mb-2">View Discussion on GitHub</h2>
        <p className="text-muted-foreground mb-6">
          This discussion is hosted on GitHub Discussions. Click below to view and participate.
        </p>
        <Button size="lg" asChild>
          <a href={`https://github.com/orgs/RadianForgeLabs/discussions/${number}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Discussion #{number}
          </a>
        </Button>
      </Card>
    </div>
  );
}
