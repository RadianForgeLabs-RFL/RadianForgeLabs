import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/news")({
  component: AdminNews,
});

function AdminNews() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-news"], queryFn: async () => (await supabase.from("news").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setSlug("");
    setTitle("");
    setExcerpt("");
    setBody("");
  };

  const startEdit = (n: any) => {
    setEditingId(n.id);
    setSlug(n.slug);
    setTitle(n.title);
    setExcerpt(n.excerpt);
    setBody(n.body);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase.from("news").update({ slug, title, excerpt, body }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("news").insert({ slug, title, excerpt, body });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Updated" : "Published");
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin-news"] });
      qc.invalidateQueries({ queryKey: ["news"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-news"] });
      qc.invalidateQueries({ queryKey: ["news"] });
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold">News</h1>
      <Card className="glass mt-6 border-white/5 bg-transparent p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editingId ? "Edit News" : "Create News"}</h2>
          {editingId && <Button size="sm" variant="ghost" onClick={resetForm}>Cancel</Button>}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div><Label>Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="news-slug" /></div>
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="News title" /></div>
          <div className="md:col-span-2"><Label>Excerpt</Label><Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Short summary" /></div>
          <div className="md:col-span-2"><Label>Body</Label><Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Full news content" /></div>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="mt-3 bg-gradient-brand text-brand-foreground shadow-glow">
          {save.isPending ? "Saving…" : editingId ? "Update" : "Publish"}
        </Button>
      </Card>
      <div className="mt-6 space-y-3">
        {(data ?? []).map((n: any) => (
          <Card key={n.id} className="glass flex items-center justify-between border-white/5 bg-transparent p-4">
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{n.title}</div>
              <div className="text-xs text-muted-foreground truncate">{n.slug}</div>
              <div className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-white/10" onClick={() => startEdit(n)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" className="border-white/10 text-destructive" onClick={() => del.mutate(n.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && <p className="text-sm text-muted-foreground">No news items yet.</p>}
      </div>
    </div>
  );
}
