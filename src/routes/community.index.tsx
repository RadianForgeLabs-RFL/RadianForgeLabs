import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Clock, CheckCircle } from "lucide-react";

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
  // Placeholder data - will be replaced with GitHub API data
  const categories = [
    { id: "1", name: "Announcements", emoji: "📢", description: "Official announcements and updates" },
    { id: "2", name: "General", emoji: "💬", description: "General discussions" },
    { id: "3", name: "Games", emoji: "🎮", description: "Game discussions and feedback" },
    { id: "4", name: "Apps", emoji: "📱", description: "App discussions and support" },
    { id: "5", name: "Bugs", emoji: "🐛", description: "Bug reports and issues" },
    { id: "6", name: "Ideas", emoji: "💡", description: "Feature requests and ideas" },
  ];

  const discussions = [
    { id: "1", number: 1, title: "Welcome to the community!", author: "admin", createdAt: "2024-01-01", isAnswered: true, replyCount: 5, category: "Announcements" },
    { id: "2", number: 2, title: "Feature request: Dark mode", author: "user1", createdAt: "2024-01-02", isAnswered: false, replyCount: 12, category: "Ideas" },
    { id: "3", number: 3, title: "Bug: Login not working", author: "user2", createdAt: "2024-01-03", isAnswered: true, replyCount: 3, category: "Bugs" },
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

        {/* Main Content - Discussions */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Discussions</h2>
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              New Discussion
            </Button>
          </div>

          <div className="space-y-3">
            {discussions.map((disc) => (
              <Card key={disc.id} className="border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition-colors">
                <Link to="/community/$number" params={{ number: disc.number.toString() }}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-500">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">{disc.category}</span>
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
                          {disc.createdAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {disc.replyCount} replies
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Sign in with GitHub to participate in discussions.
            </p>
            <Button variant="outline">
              Sign in with GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
