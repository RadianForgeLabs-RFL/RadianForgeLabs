import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Clock, CheckCircle, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/community/")({
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

interface Discussion {
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

function CommunityPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: "1", name: "Announcements", emoji: "📢", description: "Official announcements and updates" },
    { id: "2", name: "General", emoji: "💬", description: "General discussions" },
    { id: "3", name: "Games", emoji: "🎮", description: "Game discussions and feedback" },
    { id: "4", name: "Apps", emoji: "📱", description: "App discussions and support" },
    { id: "5", name: "Bugs", emoji: "🐛", description: "Bug reports and issues" },
    { id: "6", name: "Ideas", emoji: "💡", description: "Feature requests and ideas" },
    { id: "7", name: "Showcase", emoji: "🎨", description: "Share your projects and creations" },
    { id: "8", name: "Help", emoji: "❓", description: "Get help from the community" },
  ];

  useEffect(() => {
    async function fetchDiscussions() {
      try {
        // Using GitHub REST API for discussions (public access)
        const response = await fetch('https://api.github.com/repos/RadianForgeLabs-RFL/RFL-Studios/discussions?per_page=20', {
          headers: {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        
        const formattedDiscussions: Discussion[] = data.map((d: any) => ({
          id: d.id,
          number: d.number,
          title: d.title,
          author: d.user?.login || 'Unknown',
          createdAt: d.created_at,
          isAnswered: d.answer_chosen_at !== null,
          upvoteCount: d.reactions?.['+1'] || 0,
          bodyText: d.body_text || '',
          categoryName: d.category?.name || 'General'
        }));

        setDiscussions(formattedDiscussions);
      } catch (err) {
        console.error('Error fetching discussions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load discussions');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDiscussions();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Community</h1>
        <p className="text-muted-foreground">Join discussions, share ideas, and connect with the community.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar - Categories */}
        <aside className="glass sticky top-24 h-fit rounded-xl border border-white/5 p-4">
          <h2 className="mb-4 text-lg font-semibold">Categories</h2>
          <nav className="flex flex-col gap-2">
            {categories.map((cat) => (
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
        </aside>

        {/* Main Content */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Discussions</h2>
            <Button variant="outline" size="sm" asChild>
              <a href="https://github.com/RadianForgeLabs-RFL/RFL-Studios/discussions/new" target="_blank" rel="noopener noreferrer">
                <MessageSquare className="mr-2 h-4 w-4" />
                New Discussion
              </a>
            </Button>
          </div>

          {error && (
            <Card className="mb-6 border border-yellow-500/20 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-500">Unable to Load Discussions</h3>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : discussions.length === 0 ? (
            <Card className="border border-white/5 bg-white/5 p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Discussions Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to start a conversation in the community.
              </p>
              <Button variant="outline" asChild>
                <a href="https://github.com/RadianForgeLabs-RFL/RFL-Studios/discussions/new" target="_blank" rel="noopener noreferrer">
                  Start a Discussion
                </a>
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {discussions.map((disc) => (
                <Card key={disc.id} className="border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition-colors">
                  <a href={`https://github.com/RadianForgeLabs-RFL/RFL-Studios/discussions/${disc.number}`} target="_blank" rel="noopener noreferrer">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-500">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {disc.categoryName && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">{disc.categoryName}</span>
                          )}
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
                  </a>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Sign in with GitHub to participate in discussions.
            </p>
            <Button variant="outline" asChild>
              <a href="https://github.com/RadianForgeLabs-RFL/RFL-Studios/discussions" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View All on GitHub
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
