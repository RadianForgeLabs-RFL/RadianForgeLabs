import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { communityCategoriesQuery, communitySettingsQuery, SECTIONS, type CommunityCategory, type CommunitySettings } from "@/lib/community";
import { fetchRepoMeta } from "@/lib/community.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, RefreshCw, Save } from "lucide-react";

export const Route = createFileRoute("/admin/community")({
  head: () => ({ meta: [{ title: "Community — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminCommunity,
});

function AdminCommunity() {
  const qc = useQueryClient();
  const settings = useQuery(communitySettingsQuery());
  const cats = useQuery(communityCategoriesQuery(false));
  const syncRepo = useServerFn(fetchRepoMeta);
  const [form, setForm] = useState<CommunitySettings | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { if (settings.data) setForm(settings.data); }, [settings.data]);

  const set = <K extends keyof CommunitySettings>(k: K, v: CommunitySettings[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const { id, ...rest } = form;
      const { error } = await supabase.from("community_settings").update(rest as any).eq("id", "default");
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Community settings saved"); qc.invalidateQueries({ queryKey: ["community-settings"] }); },
    onError: (e: any) => toast.error(e.message ?? "Could not save"),
  });

  const updateCat = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CommunityCategory> }) => {
      const { error } = await supabase.from("community_categories").update(patch as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community-categories"] }),
    onError: (e: any) => toast.error(e.message ?? "Could not update category"),
  });

  const syncCategories = async () => {
    if (!form) return;
    setSyncing(true);
    try {
      const res = await syncRepo({ data: { owner: form.repo_owner, name: form.repo_name } });
      if (!res.ok) { toast.error(res.error); return; }
      if (!res.hasDiscussions) toast.warning("Discussions are not enabled on this repository.");
      set("repo_id", res.repoId);
      await supabase.from("community_settings").update({ repo_id: res.repoId, repo_owner: form.repo_owner, repo_name: form.repo_name } as any).eq("id", "default");
      const existing = cats.data ?? [];
      let order = existing.length;
      for (const c of res.categories) {
        const match = existing.find((e) => e.github_category_id === c.id);
        if (match) {
          await supabase.from("community_categories").update({ name: c.name, emoji: c.emoji, description: c.description, slug: c.slug } as any).eq("id", match.id);
        } else {
          await supabase.from("community_categories").insert({
            github_category_id: c.id, slug: c.slug, name: c.name, emoji: c.emoji, description: c.description, sort_order: order++,
          } as any);
        }
      }
      qc.invalidateQueries({ queryKey: ["community-categories"] });
      qc.invalidateQueries({ queryKey: ["community-settings"] });
      toast.success(`Synced ${res.categories.length} categories from GitHub`);
    } finally {
      setSyncing(false);
    }
  };

  const move = async (cat: CommunityCategory, dir: -1 | 1) => {
    const list = [...(cats.data ?? [])];
    const i = list.findIndex((c) => c.id === cat.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    await updateCat.mutateAsync({ id: list[i].id, patch: { sort_order: list[j].sort_order } });
    await updateCat.mutateAsync({ id: list[j].id, patch: { sort_order: list[i].sort_order } });
  };

  if (!form) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Community</h1>
        <p className="text-sm text-muted-foreground">Control the GitHub Discussions powered community page.</p>
      </div>

      <Card className="glass space-y-5 border border-white/5 p-6">
        <div className="flex items-center justify-between">
          <div><Label>Community page enabled</Label><p className="text-xs text-muted-foreground">Turn the whole /community page on or off.</p></div>
          <Switch checked={form.enabled} onCheckedChange={(v) => set("enabled", v)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Repository owner</Label><Input value={form.repo_owner} onChange={(e) => set("repo_owner", e.target.value)} /></div>
          <div><Label>Repository name</Label><Input value={form.repo_name} onChange={(e) => set("repo_name", e.target.value)} /></div>
        </div>
        <div><Label>Repository ID</Label><Input value={form.repo_id ?? ""} readOnly placeholder="Sync from GitHub to fill this" /></div>
        <Button variant="outline" onClick={syncCategories} disabled={syncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />Sync repository & categories from GitHub
        </Button>
      </Card>

      <Card className="glass space-y-5 border border-white/5 p-6">
        <h2 className="font-semibold">Discussion widget</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Mapping strategy</Label>
            <Select value={form.mapping} onValueChange={(v) => set("mapping", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Specific discussion number</SelectItem>
                <SelectItem value="pathname">Page pathname</SelectItem>
                <SelectItem value="url">Full URL</SelectItem>
                <SelectItem value="title">Page title</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Comment box position</Label>
            <Select value={form.input_position} onValueChange={(v) => set("input_position", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom">Below comments</SelectItem>
                <SelectItem value="top">Above comments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between"><Label>Theme follows site</Label><Switch checked={form.theme_follows_site} onCheckedChange={(v) => set("theme_follows_site", v)} /></div>
        {!form.theme_follows_site && (
          <div>
            <Label>Fixed theme</Label>
            <Select value={form.theme} onValueChange={(v) => set("theme", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="dark">Dark</SelectItem><SelectItem value="light">Light</SelectItem></SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center justify-between"><Label>Enable reactions</Label><Switch checked={form.reactions_enabled} onCheckedChange={(v) => set("reactions_enabled", v)} /></div>
        <div className="flex items-center justify-between"><Label>Enable comments</Label><Switch checked={form.comments_enabled} onCheckedChange={(v) => set("comments_enabled", v)} /></div>
        <div className="flex items-center justify-between"><Label>Allow new discussions</Label><Switch checked={form.allow_new_discussions} onCheckedChange={(v) => set("allow_new_discussions", v)} /></div>
        <div className="flex items-center justify-between"><Label>Lazy load comments</Label><Switch checked={form.lazy_load} onCheckedChange={(v) => set("lazy_load", v)} /></div>
        <div className="flex items-center justify-between"><Label>Show “View on GitHub” links</Label><Switch checked={form.show_github_links} onCheckedChange={(v) => set("show_github_links", v)} /></div>
        <Button onClick={() => save.mutate()} className="bg-gradient-brand text-brand-foreground"><Save className="mr-2 h-4 w-4" />Save settings</Button>
      </Card>

      <Card className="glass border border-white/5 p-6">
        <h2 className="font-semibold">Categories</h2>
        <p className="mb-4 text-xs text-muted-foreground">Choose which discussion categories appear, which division they belong to, and their order.</p>
        <div className="space-y-3">
          {(cats.data ?? []).map((c, i) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3">
              <span className="text-lg">{c.emoji ?? "💬"}</span>
              <span className="min-w-[140px] flex-1 font-medium">{c.name}</span>
              <Select value={c.section} onValueChange={(v) => updateCat.mutate({ id: c.id, patch: { section: v } })}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>{SECTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Visible</Label>
                <Switch checked={c.visible} onCheckedChange={(v) => updateCat.mutate({ id: c.id, patch: { visible: v } })} />
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(c, -1)}><ArrowUp className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" disabled={i === (cats.data?.length ?? 1) - 1} onClick={() => move(c, 1)}><ArrowDown className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {!cats.data?.length && <p className="text-sm text-muted-foreground">No categories yet — sync them from GitHub above.</p>}
        </div>
      </Card>
    </div>
  );
}
