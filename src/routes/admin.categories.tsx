import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/MediaUpload";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategories,
});

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function AdminCategories() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["categories"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage product categories and their icons.</p>
        </div>
        <CategoryDialog trigger={<Button className="bg-gradient-brand text-brand-foreground shadow-glow"><Plus className="mr-2 h-4 w-4" />New category</Button>} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((cat) => (
          <Card key={cat.id} className="glass border-white/5 bg-transparent p-4">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
                {cat.icon ? (
                  <img src={cat.icon} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl">📁</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{cat.name}</div>
                <div className="text-xs text-muted-foreground">{cat.slug} · {cat.kind}</div>
              </div>
              <div className="flex gap-2">
                <CategoryDialog category={cat} trigger={<Button size="sm" variant="outline" className="border-white/10"><Pencil className="h-4 w-4" /></Button>} />
                <Button size="sm" variant="outline" className="border-white/10 text-destructive" onClick={() => { if (confirm("Delete?")) del.mutate(cat.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CategoryDialog({ category, trigger }: { category?: any; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [kind, setKind] = useState(category?.kind ?? "app");
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? 0);
  const [iconUrl, setIconUrl] = useState<string | null>(category?.icon ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(category?.id ?? null);
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name,
        slug: slug || slugify(name),
        description: description || null,
        kind,
        sort_order: sortOrder,
        icon: iconUrl,
      };
      if (categoryId) {
        const { error } = await supabase.from("categories").update(payload).eq("id", categoryId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("categories").insert(payload).select("id").single();
        if (error) throw error;
        setCategoryId(data.id);
      }
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["categories"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-strong max-h-[90vh] max-w-lg overflow-y-auto border-white/5 bg-background/95">
        <DialogHeader><DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(name)} />
          </div>
          <div>
            <Label className="mb-2 block">Kind</Label>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm">
              <option value="app">App</option>
              <option value="game">Game</option>
              <option value="ai">AI Tools</option>
            </select>
          </div>
          <div>
            <Label className="mb-2 block">Sort Order</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <Label className="mb-2 block">Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Icon</Label>
            <ImageUpload value={iconUrl} label="Icon" folder="category-icons" useCase="icon" onChange={async (url) => {
              setIconUrl(url);
              if (categoryId) await supabase.from("categories").update({ icon: url }).eq("id", categoryId);
              qc.invalidateQueries({ queryKey: ["categories"] });
            }} />
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full bg-gradient-brand text-brand-foreground shadow-glow">
            {save.isPending ? "Saving…" : categoryId ? "Save changes" : "Create category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
