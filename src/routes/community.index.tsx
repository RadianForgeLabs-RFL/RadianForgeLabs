import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ExternalLink } from "lucide-react";

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

function CommunityPage() {
  const categories = [
    { id: "1", name: "Announcements", emoji: "📢", description: "Official announcements and updates" },
    { id: "2", name: "General", emoji: "💬", description: "General discussions" },
    { id: "3", name: "Games", emoji: "🎮", description: "Game discussions and feedback" },
    { id: "4", name: "Apps", emoji: "📱", description: "App discussions and support" },
    { id: "5", name: "Bugs", emoji: "🐛", description: "Bug reports and issues" },
    { id: "6", name: "Ideas", emoji: "💡", description: "Feature requests and ideas" },
  ];

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
          <Card className="border border-white/5 bg-white/5 p-8 text-center mb-6">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-bold mb-2">Join Our Community</h2>
            <p className="text-muted-foreground mb-6">
              Participate in discussions, share ideas, and connect with other community members on GitHub Discussions.
            </p>
            <Button asChild size="lg">
              <a href="https://github.com/RadianForgeLabs-RFL/RFL-Studios/discussions" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Discussions on GitHub
              </a>
            </Button>
          </Card>

          <Card className="border border-white/5 bg-white/5 p-6">
            <h3 className="font-semibold mb-4">How to Participate</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-purple-500">1.</span>
                <span>Visit our GitHub Discussions page to see all conversations</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-500">2.</span>
                <span>Sign in with your GitHub account to post comments</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-500">3.</span>
                <span>Create new discussions or reply to existing ones</span>
              </li>
              <li className="flex gap-2">
                <span className="text-purple-500">4.</span>
                <span>React to posts with likes and mark answers as helpful</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
