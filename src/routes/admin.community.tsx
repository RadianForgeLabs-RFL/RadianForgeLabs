import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, ExternalLink, RefreshCw, Shield, Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/community")({
  head: () => ({ meta: [{ title: "Community Settings — Admin" }, { name: "robots", content: "noindex" }] }),
  component: CommunityAdmin,
});

function CommunityAdmin() {
  const qc = useQueryClient();
  const [communityEnabled, setCommunityEnabled] = useState(true);
  const [discussionLimit, setDiscussionLimit] = useState("20");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const set = useQuery({ queryKey: ["community-settings"], queryFn: async () => (await supabase.from("settings").select("*")).data ?? [] });

  const toggleCommunity = useMutation({
    mutationFn: async (v: boolean) => { const { error } = await supabase.from("settings").upsert({ key: "community_enabled", value: v as any }); if (error) throw error; },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["community-settings"] }); },
  });

  const updateCommunitySettings = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("settings").upsert([
        { key: "community_enabled", value: communityEnabled },
        { key: "discussion_limit", value: parseInt(discussionLimit) },
        { key: "auto_refresh_discussions", value: autoRefresh },
      ]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Community settings updated"); qc.invalidateQueries({ queryKey: ["community-settings"] }); },
  });

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

      <Card className="border border-white/5 bg-white/5 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Community Control
        </h2>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={communityEnabled} 
                onChange={(e) => { setCommunityEnabled(e.target.checked); toggleCommunity.mutate(e.target.checked); }} 
              />
              Enable Community Section
            </label>
            <p className="text-xs text-muted-foreground mt-1">Show or hide the community section on the website</p>
          </div>

          <div>
            <Label>Discussion Limit</Label>
            <Input 
              value={discussionLimit} 
              onChange={(e) => setDiscussionLimit(e.target.value)} 
              placeholder="20" 
              type="number"
            />
            <p className="text-xs text-muted-foreground mt-1">Maximum number of discussions to display</p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)} 
              />
              Auto-refresh Discussions
            </label>
            <p className="text-xs text-muted-foreground mt-1">Automatically refresh discussions from GitHub</p>
          </div>

          <Button onClick={() => updateCommunitySettings.mutate()} className="bg-gradient-brand text-brand-foreground shadow-glow">
            <RefreshCw className="mr-2 h-4 w-4" />
            Update Settings
          </Button>
        </div>
      </Card>

      <Card className="border border-white/5 bg-white/5 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Moderation Settings
        </h2>

        <div className="space-y-4">
          <div>
            <p className="font-medium mb-2">Moderation Tools</p>
            <p className="text-sm text-muted-foreground">
              Community moderation is handled through GitHub Discussions. 
              Use GitHub's built-in moderation tools to manage discussions, 
              comments, and user interactions.
            </p>
          </div>

          <div className="pt-4">
            <Button asChild variant="outline">
              <a href="https://github.com/orgs/RadianForgeLabs/settings/discussions" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Moderation on GitHub
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
