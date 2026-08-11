import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/admin/MediaUpload";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const [maintenance, setMaintenance] = useState(false);
  const [userCount, setUserCount] = useState("10K+");
  const [playerCount, setPlayerCount] = useState("10K+");
  const [downloadsCount, setDownloadsCount] = useState("50K+");
  const [studiosIcon, setStudiosIcon] = useState("Code");
  const [entertainmentIcon, setEntertainmentIcon] = useState("Gamepad2");
  const [studiosIconUrl, setStudiosIconUrl] = useState<string | null>(null);
  const [entertainmentIconUrl, setEntertainmentIconUrl] = useState<string | null>(null);

  const ann = useQuery({ queryKey: ["ann-all"], queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [] });
  const set = useQuery({ queryKey: ["settings-all"], queryFn: async () => (await supabase.from("settings").select("*")).data ?? [] });

  useEffect(() => {
    const m = set.data?.find((s: any) => s.key === "maintenance_mode");
    setMaintenance(m?.value === true);
    
    const uc = set.data?.find((s: any) => s.key === "user_count");
    const pc = set.data?.find((s: any) => s.key === "player_count");
    const dc = set.data?.find((s: any) => s.key === "downloads_count");
    const si = set.data?.find((s: any) => s.key === "studios_icon");
    const ei = set.data?.find((s: any) => s.key === "entertainment_icon");
    const siu = set.data?.find((s: any) => s.key === "studios_icon_url");
    const eiu = set.data?.find((s: any) => s.key === "entertainment_icon_url");
    
    if (uc) setUserCount(String(uc.value ?? ''));
    if (pc) setPlayerCount(String(pc.value ?? ''));
    if (dc) setDownloadsCount(String(dc.value ?? ''));
    if (si) setStudiosIcon(String(si.value ?? ''));
    if (ei) setEntertainmentIcon(String(ei.value ?? ''));
    if (siu) setStudiosIconUrl(siu.value ? String(siu.value) : null);
    if (eiu) setEntertainmentIconUrl(eiu.value ? String(eiu.value) : null);
  }, [set.data]);

  const addAnn = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("announcements").insert({ message, variant: "info", active: true }); if (error) throw error; },
    onSuccess: () => { toast.success("Announcement added"); setMessage(""); qc.invalidateQueries({ queryKey: ["ann-all"] }); qc.invalidateQueries({ queryKey: ["announcement"] }); },
  });
  const toggleAnn = useMutation({
    mutationFn: async ({ id, active }: any) => { const { error } = await supabase.from("announcements").update({ active }).eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ann-all"] }); qc.invalidateQueries({ queryKey: ["announcement"] }); },
  });
  const deleteAnn = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("announcements").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Announcement deleted"); qc.invalidateQueries({ queryKey: ["ann-all"] }); qc.invalidateQueries({ queryKey: ["announcement"] }); },
  });
  const toggleMaintenance = useMutation({
    mutationFn: async (v: boolean) => { const { error } = await supabase.from("settings").upsert({ key: "maintenance_mode", value: v as any }); if (error) throw error; },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["settings-all"] }); },
  });
  const updateStats = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("settings").upsert([
        { key: "user_count", value: userCount },
        { key: "player_count", value: playerCount },
        { key: "downloads_count", value: downloadsCount },
        { key: "studios_icon", value: studiosIcon },
        { key: "entertainment_icon", value: entertainmentIcon },
        { key: "studios_icon_url", value: studiosIconUrl },
        { key: "entertainment_icon_url", value: entertainmentIconUrl },
      ]);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Stats updated"); qc.invalidateQueries({ queryKey: ["settings-all"] }); qc.invalidateQueries({ queryKey: ["home-counts"] }); },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card className="glass mt-6 border-white/5 bg-transparent p-5">
        <h2 className="text-lg font-semibold">Site announcement</h2>
        <div className="mt-3 flex gap-2">
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="New announcement…" />
          <Button onClick={() => addAnn.mutate()} className="bg-gradient-brand text-brand-foreground shadow-glow">Add</Button>
        </div>
        <div className="mt-4 space-y-2">
          {(ann.data ?? []).map((a: any) => (
            <div key={a.id} className="flex items-center justify-between rounded border border-white/5 p-3 text-sm">
              <span>{a.message}</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={a.active} onChange={(e) => toggleAnn.mutate({ id: a.id, active: e.target.checked })} />Active
                </label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteAnn.mutate(a.id)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="glass mt-6 border-white/5 bg-transparent p-5">
        <h2 className="text-lg font-semibold">Maintenance mode</h2>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={maintenance} onChange={(e) => { setMaintenance(e.target.checked); toggleMaintenance.mutate(e.target.checked); }} />
          Enable maintenance mode
        </label>
      </Card>

      <Card className="glass mt-6 border-white/5 bg-transparent p-5">
        <h2 className="text-lg font-semibold">Company Statistics</h2>
        <div className="mt-4 space-y-4">
          <div>
            <Label>User Count</Label>
            <Input value={userCount} onChange={(e) => setUserCount(e.target.value)} placeholder="10K+" />
          </div>
          <div>
            <Label>Player Count</Label>
            <Input value={playerCount} onChange={(e) => setPlayerCount(e.target.value)} placeholder="10K+" />
          </div>
          <div>
            <Label>Downloads Count</Label>
            <Input value={downloadsCount} onChange={(e) => setDownloadsCount(e.target.value)} placeholder="50K+" />
          </div>
          <div>
            <Label>RFL Studios Icon (Lucide icon name)</Label>
            <Input value={studiosIcon} onChange={(e) => setStudiosIcon(e.target.value)} placeholder="Code" />
          </div>
          <div>
            <Label>RFL Studios Icon Image</Label>
            <ImageUpload value={studiosIconUrl} onChange={setStudiosIconUrl} folder="icons" label="Studios Icon" useCase="icon" />
          </div>
          <div>
            <Label>RFL Entertainment Icon (Lucide icon name)</Label>
            <Input value={entertainmentIcon} onChange={(e) => setEntertainmentIcon(e.target.value)} placeholder="Gamepad2" />
          </div>
          <div>
            <Label>RFL Entertainment Icon Image</Label>
            <ImageUpload value={entertainmentIconUrl} onChange={setEntertainmentIconUrl} folder="icons" label="Entertainment Icon" useCase="icon" />
          </div>
          <Button onClick={() => updateStats.mutate()} className="bg-gradient-brand text-brand-foreground shadow-glow">Update Stats</Button>
        </div>
      </Card>
    </div>
  );
}
