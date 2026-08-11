import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, ExternalLink, Save } from "lucide-react";

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

        <div className="space-y-6">
          <div>
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              defaultValue="RadianForgeLabs"
              placeholder="RadianForgeLabs"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Your GitHub organization name (e.g., RadianForgeLabs)
            </p>
          </div>

          <div>
            <Label htmlFor="discussions-url">Discussions URL</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="discussions-url"
                defaultValue="https://github.com/orgs/RadianForgeLabs/discussions"
                placeholder="https://github.com/orgs/YOUR_ORG/discussions"
                className="flex-1"
              />
              <Button variant="outline" size="icon" asChild>
                <a href="https://github.com/orgs/RadianForgeLabs/discussions" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              The URL to your GitHub Discussions page
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="enable-comments">Enable Comments</Label>
              <div className="flex items-center gap-2 mt-2">
                <Switch id="enable-comments" defaultChecked />
                <span className="text-sm text-muted-foreground">Allow users to comment</span>
              </div>
            </div>

            <div>
              <Label htmlFor="lazy-load">Lazy Load</Label>
              <div className="flex items-center gap-2 mt-2">
                <Switch id="lazy-load" defaultChecked />
                <span className="text-sm text-muted-foreground">Load widget on scroll</span>
              </div>
            </div>

            <div>
              <Label htmlFor="reactions">Enable Reactions</Label>
              <div className="flex items-center gap-2 mt-2">
                <Switch id="reactions" defaultChecked />
                <span className="text-sm text-muted-foreground">Allow emoji reactions</span>
              </div>
            </div>

            <div>
              <Label htmlFor="input-position">Input Position</Label>
              <Select defaultValue="bottom">
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="theme">Theme</Label>
            <Select defaultValue="preferred_color_scheme">
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="preferred_color_scheme">System Preference</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="mapping">Discussion Mapping</Label>
            <Select defaultValue="pathname">
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pathname">Pathname</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="og:title">OG Title</SelectItem>
                <SelectItem value="specific">Specific Term</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              How discussions are mapped to pages
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </Card>

      <Card className="border border-white/5 bg-white/5 p-6">
        <h3 className="font-semibold mb-4">Categories</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your community categories. Categories are synced from GitHub Discussions.
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
            <div key={cat.name} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/5">
              <div className="flex items-center gap-3">
                <span className="text-xl">{cat.emoji}</span>
                <span className="font-medium">{cat.name}</span>
              </div>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
