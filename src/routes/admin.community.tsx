import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/community")({
  head: () => ({ meta: [{ title: "Community Settings — Admin" }, { name: "robots", content: "noindex" }] }),
  component: CommunityAdmin,
});

function CommunityAdmin() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Community Settings</h1>
        <p className="text-muted-foreground">Configure your GitHub Discussions integration.</p>
      </div>

      <Card className="border border-white/5 bg-white/5 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          GitHub Discussions Configuration
        </h2>

        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">Organization Name</p>
            <p className="text-sm text-muted-foreground">RadianForgeLabs</p>
          </div>

          <div>
            <p className="font-medium mb-2">Discussions URL</p>
            <a 
              href="https://github.com/orgs/RadianForgeLabs/discussions" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              https://github.com/orgs/RadianForgeLabs/discussions
            </a>
          </div>

          <div className="pt-4">
            <Button asChild>
              <a href="https://github.com/orgs/RadianForgeLabs/discussions" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Discussions on GitHub
              </a>
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border border-white/5 bg-white/5 p-6">
        <h3 className="font-semibold mb-4">Categories</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Community categories are managed on GitHub Discussions.
        </p>
        <div className="space-y-2">
          {[
            { name: "Announcements", emoji: "📢" },
            { name: "General", emoji: "💬" },
            { name: "Games", emoji: "🎮" },
            { name: "Apps", emoji: "📱" },
            { name: "Bugs", emoji: "🐛" },
            { name: "Ideas", emoji: "💡" },
            { name: "Showcase", emoji: "🎨" },
            { name: "Help", emoji: "❓" },
          ].map((cat) => (
            <div key={cat.name} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/5">
              <span className="text-xl">{cat.emoji}</span>
              <span className="font-medium">{cat.name}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
