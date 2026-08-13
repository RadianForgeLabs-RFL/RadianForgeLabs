import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { adminProductListQuery } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ImageUpload, MultiImageUpload } from "@/components/admin/MediaUpload";

const PLAY_MODES = ["single_player", "multiplayer", "lan", "online", "offline", "cross_platform"];
const PLATFORM_OPTIONS = ["Windows", "Linux", "Mac", "Android", "iOS", "Web"];
const ARCHITECTURE_OPTIONS = ["x86_64", "arm64", "universal", "x86", "arm", "other"];
const LICENSE_OPTIONS = ["MIT", "Apache-2.0", "GPL-3.0", "GPL-2.0", "BSD-3-Clause", "BSD-2-Clause", "LGPL-3.0", "LGPL-2.1", "MPL-2.0", "Unlicense", "Proprietary", "Custom"];

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function AdminProducts() {
  const qc = useQueryClient();
  const { data } = useQuery(adminProductListQuery());

  const del = useMutation({
    mutationFn: async (id: string) => {
      // Delete related records first due to foreign key constraints
      await supabase.from("screenshots").delete().eq("product_id", id);
      await supabase.from("downloads").delete().eq("product_id", id);
      await supabase.from("versions").delete().eq("product_id", id);
      await supabase.from("product_tags").delete().eq("product_id", id);
      await supabase.from("favorites").delete().eq("product_id", id);
      await supabase.from("preorders").delete().eq("product_id", id);
      await supabase.from("requests").delete().eq("product_id", id);
      
      // Finally delete the product
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["products"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage apps and games.</p>
        </div>
        <ProductDialog trigger={<Button className="bg-gradient-brand text-brand-foreground shadow-glow"><Plus className="mr-2 h-4 w-4" />New product</Button>} />
      </div>

      <div className="mt-6 space-y-3">
        {(data ?? []).map((p) => (
          <Card key={p.id} className="glass border-white/5 bg-transparent p-4">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                {p.icon_url ? <img src={p.icon_url} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0">
                <div className="truncate font-semibold">{p.name} <span className="text-xs uppercase text-muted-foreground">· {p.kind}</span></div>
                <div className="text-xs text-muted-foreground">{p.slug} · v{p.latest_version} · {p.status}</div>
              </div>
              <div className="flex gap-2">
                <ProductDialog product={p} trigger={<Button size="sm" variant="outline" className="border-white/10"><Pencil className="h-4 w-4" /></Button>} />
                <Button size="sm" variant="outline" className="border-white/10 text-destructive" onClick={() => { if (confirm("Delete?")) del.mutate(p.id); }}>
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

function ProductDialog({ product, trigger }: { product?: any; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [extra_guidance, setExtraGuidance] = useState(product?.extra_guidance ?? "");
  const [kind, setKind] = useState(product?.kind ?? "app");
  const [status, setStatus] = useState(product?.status ?? "stable");
  const [source_type, setSourceType] = useState(product?.source_type ?? "closed_source");
  const [latest_version, setVersion] = useState(product?.latest_version ?? "1.0.0");
  const [coming_soon, setComingSoon] = useState(product?.coming_soon ?? false);
  const [published, setPublished] = useState(product?.published ?? true);
  const [icon_url, setIconUrl] = useState<string | null>(product?.icon_url ?? null);
  const [banner_url, setBannerUrl] = useState<string | null>(product?.banner_url ?? null);
  const [banner_opacity, setBannerOpacity] = useState<number>(product?.banner_opacity ?? 0.4);
  const [productId, setProductId] = useState<string | null>(product?.id ?? null);
  const [developerId, setDeveloperId] = useState(product?.developer_id ?? "");
  const [license, setLicense] = useState(product?.license ?? "");
  const [publisher, setPublisher] = useState(product?.publisher ?? "");
  const [releaseDate, setReleaseDate] = useState(product?.release_date ?? "");
  const [fileSize, setFileSize] = useState(product?.file_size ?? "");
  const [features, setFeatures] = useState(product?.features?.join(", ") ?? "");
  const [requirements, setRequirements] = useState(product?.requirements ?? "");
  const [knownIssues, setKnownIssues] = useState(product?.known_issues ?? "");
  const [roadmap, setRoadmap] = useState(product?.roadmap ?? "");
  const [trailerUrl, setTrailerUrl] = useState(product?.trailer_url ?? "");
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [homepageOrder, setHomepageOrder] = useState(product?.homepage_order ?? 0);
  const [playModes, setPlayModes] = useState(product?.play_modes?.join(", ") ?? "");
  const [platforms, setPlatforms] = useState(product?.platforms?.join(", ") ?? "");
  const [architectures, setArchitectures] = useState(product?.architectures?.join(", ") ?? "");
  const [dependencies, setDependencies] = useState(product?.dependencies?.join(", ") ?? "");
  const [documentationUrl, setDocumentationUrl] = useState(product?.documentation_url ?? "");
  const [sourceUrl, setSourceUrl] = useState(product?.source_url ?? "");
  const qc = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setProductId(product?.id ?? null);
    setIconUrl(product?.icon_url ?? null);
    setBannerUrl(product?.banner_url ?? null);
    setBannerOpacity(product?.banner_opacity ?? 0.4);
    setExtraGuidance(product?.extra_guidance ?? "");
    setDeveloperId(product?.developer_id ?? "");
    setLicense(product?.license ?? "");
    setPublisher(product?.publisher ?? "");
    setReleaseDate(product?.release_date ?? "");
    setFileSize(product?.file_size ?? "");
    setFeatures(product?.features?.join(", ") ?? "");
    setRequirements(product?.requirements ?? "");
    setKnownIssues(product?.known_issues ?? "");
    setRoadmap(product?.roadmap ?? "");
    setTrailerUrl(product?.trailer_url ?? "");
    setFeatured(product?.featured ?? false);
    setHomepageOrder(product?.homepage_order ?? 0);
    setPlayModes(product?.play_modes?.join(", ") ?? "");
    setPlatforms(product?.platforms?.join(", ") ?? "");
    setArchitectures(product?.architectures?.join(", ") ?? "");
    setDependencies(product?.dependencies?.join(", ") ?? "");
    setDocumentationUrl(product?.documentation_url ?? "");
    setSourceUrl(product?.source_url ?? "");
  }, [open, product]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name, slug: slug || slugify(name), tagline, description, extra_guidance, kind, status, source_type,
        latest_version, coming_soon, published, icon_url, banner_url, banner_opacity,
        developer_id: developerId || null,
        license: license || null,
        publisher: publisher || null,
        release_date: releaseDate || null,
        file_size: fileSize || null,
        features: features ? features.split(",").map((f: string) => f.trim()).filter(Boolean) : [],
        requirements: requirements || null,
        known_issues: knownIssues || null,
        roadmap: roadmap || null,
        trailer_url: trailerUrl || null,
        featured,
        homepage_order: homepageOrder,
        play_modes: playModes ? playModes.split(",").map((p: string) => p.trim()).filter(Boolean) : [],
        platforms: platforms ? platforms.split(",").map((p: string) => p.trim()).filter(Boolean) : [],
        architectures: architectures ? architectures.split(",").map((a: string) => a.trim()).filter(Boolean) : [],
        dependencies: dependencies ? dependencies.split(",").map((d: string) => d.trim()).filter(Boolean) : [],
        documentation_url: documentationUrl || null,
        source_url: sourceUrl || null,
      };
      if (productId) {
        const { error } = await supabase.from("products").update(payload).eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        setProductId(data.id);
      }
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["products"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="glass-strong max-h-[90vh] max-w-3xl overflow-y-auto border-white/5 bg-background/95">
        <DialogHeader><DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle></DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="media" disabled={!productId}>Media</TabsTrigger>
            <TabsTrigger value="downloads" disabled={!productId}>Downloads</TabsTrigger>
            <TabsTrigger value="versions" disabled={!productId}>Old Versions</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="grid gap-3 md:grid-cols-2">
              <F label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></F>
              <F label="Slug"><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(name)} /></F>
              <F label="Kind">
                <select value={kind} onChange={(e) => setKind(e.target.value)} className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm">
                  <option value="app">App</option><option value="game">Game</option>
                </select>
              </F>
              <F label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm">
                  <option value="stable">Stable</option><option value="beta">Beta</option><option value="experimental">Experimental</option>
                  <option value="deprecated">Deprecated</option><option value="abandoned">Abandoned</option>
                </select>
              </F>
              <F label="Source">
                <select value={source_type} onChange={(e) => setSourceType(e.target.value)} className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm">
                  <option value="open_source">Open Source</option><option value="closed_source">Closed Source</option>
                  <option value="mod">MOD</option><option value="official">Official</option><option value="community">Community</option>
                </select>
              </F>
              <F label="Version"><Input value={latest_version} onChange={(e) => setVersion(e.target.value)} /></F>
              <F label="Tagline" className="md:col-span-2"><Input value={tagline} onChange={(e) => setTagline(e.target.value)} /></F>
              <F label="Description" className="md:col-span-2"><Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></F>
              <F label="Extra Guidance (shown on product page)" className="md:col-span-2">
                <Textarea rows={3} value={extra_guidance} onChange={(e) => setExtraGuidance(e.target.value)} placeholder="Additional instructions or tips for users (e.g., installation steps, system requirements, usage tips)" />
              </F>
              
              {/* Organization */}
              <F label="Developer"><Input value={developerId} onChange={(e) => setDeveloperId(e.target.value)} placeholder="e.g. RFL Studios" /></F>
              <F label="Publisher"><Input value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="e.g. RFL Studios" /></F>
              <F label="License">
                <select value={license} onChange={(e) => setLicense(e.target.value)} className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm">
                  <option value="">Select license...</option>
                  {LICENSE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </F>
              
              {/* Release Info */}
              <F label="Release Date"><Input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} /></F>
              <F label="File Size"><Input value={fileSize} onChange={(e) => setFileSize(e.target.value)} placeholder="e.g. 120 MB" /></F>
              
              {/* URLs */}
              <F label="Trailer URL" className="md:col-span-2"><Input value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)} placeholder="YouTube or video URL" /></F>
              <F label="Source URL"><Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="GitHub repository URL" /></F>
              <F label="Documentation URL"><Input value={documentationUrl} onChange={(e) => setDocumentationUrl(e.target.value)} placeholder="Docs website URL" /></F>
              
              {/* Features & Requirements */}
              <F label="Features (comma-separated)" className="md:col-span-2">
                <Textarea rows={2} value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="e.g. LAN Multiplayer, Cross-Platform, Custom Maps" />
              </F>
              <F label="Requirements" className="md:col-span-2">
                <Textarea rows={2} value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="System requirements..." />
              </F>
              <F label="Known Issues" className="md:col-span-2">
                <Textarea rows={2} value={knownIssues} onChange={(e) => setKnownIssues(e.target.value)} placeholder="Known bugs or issues..." />
              </F>
              <F label="Roadmap" className="md:col-span-2">
                <Textarea rows={2} value={roadmap} onChange={(e) => setRoadmap(e.target.value)} placeholder="Future plans..." />
              </F>
              <F label="Dependencies (comma-separated)" className="md:col-span-2">
                <Textarea rows={2} value={dependencies} onChange={(e) => setDependencies(e.target.value)} placeholder="e.g. .NET 6, DirectX 11, Vulkan" />
              </F>
              
              {/* Platform & Mode Selection */}
              <F label="Platforms" className="md:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_OPTIONS.map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={platforms.split(", ").includes(p)}
                        onChange={(e) => {
                          const current = platforms.split(", ").filter(Boolean);
                          if (e.target.checked) {
                            setPlatforms([...current, p].join(", "));
                          } else {
                            setPlatforms(current.filter((x: string) => x !== p).join(", "));
                          }
                        }}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </F>
              <F label="Architectures" className="md:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {ARCHITECTURE_OPTIONS.map((a) => (
                    <label key={a} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={architectures.split(", ").includes(a)}
                        onChange={(e) => {
                          const current = architectures.split(", ").filter(Boolean);
                          if (e.target.checked) {
                            setArchitectures([...current, a].join(", "));
                          } else {
                            setArchitectures(current.filter((x: string) => x !== a).join(", "));
                          }
                        }}
                      />
                      {a}
                    </label>
                  ))}
                </div>
              </F>
              <F label="Play Modes" className="md:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {PLAY_MODES.map((pm) => (
                    <label key={pm} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={playModes.split(", ").includes(pm)}
                        onChange={(e) => {
                          const current = playModes.split(", ").filter(Boolean);
                          if (e.target.checked) {
                            setPlayModes([...current, pm].join(", "));
                          } else {
                            setPlayModes(current.filter((x: string) => x !== pm).join(", "));
                          }
                        }}
                      />
                      {pm.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  ))}
                </div>
              </F>
              
              {/* Display Options */}
              <F label="Homepage Order"><Input type="number" value={homepageOrder} onChange={(e) => setHomepageOrder(parseInt(e.target.value) || 0)} placeholder="0 = top" /></F>
              <F label="">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                  Featured (show on homepage)
                </label>
              </F>
              
              <div className="md:col-span-2">
                <Label className="mb-2 block">Release status</Label>
                <div className="glass inline-flex items-center gap-1 rounded-full border border-white/10 p-1">
                  <button
                    type="button"
                    onClick={() => { setComingSoon(false); setPublished(true); }}
                    className={`rounded-full px-4 py-1.5 text-sm transition ${!coming_soon && published ? "bg-gradient-brand text-brand-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Released
                  </button>
                  <button
                    type="button"
                    onClick={() => { setComingSoon(true); setPublished(true); }}
                    className={`rounded-full px-4 py-1.5 text-sm transition ${coming_soon && published ? "bg-gradient-brand text-brand-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Coming Soon
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPublished(false); }}
                    className={`rounded-full px-4 py-1.5 text-sm transition ${!published ? "bg-white/15 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Draft
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Released shows in Apps/Games listings. Coming Soon shows only in the Coming Soon section with a pre-order button. Draft hides it from the public.
                </p>
              </div>
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="mt-4 bg-gradient-brand text-brand-foreground shadow-glow">
              {save.isPending ? "Saving…" : productId ? "Save changes" : "Create & continue"}
            </Button>
            {!productId && <p className="mt-2 text-xs text-muted-foreground">Save first to unlock media, downloads, and version tabs.</p>}
          </TabsContent>

          <TabsContent value="media" className="mt-4 space-y-6">
            <div>
              <Label className="mb-2 block">Icon</Label>
              <ImageUpload value={icon_url} label="Icon" folder="icons" useCase="icon" onChange={async (url) => {
                setIconUrl(url);
                if (productId) await supabase.from("products").update({ icon_url: url }).eq("id", productId);
                qc.invalidateQueries({ queryKey: ["products"] });
              }} />
            </div>
            <div>
              <Label className="mb-2 block">Banner</Label>
              <ImageUpload value={banner_url} label="Banner" aspect="aspect-video" folder="banners" useCase="banner" onChange={async (url) => {
                setBannerUrl(url);
                if (productId) await supabase.from("products").update({ banner_url: url }).eq("id", productId);
                qc.invalidateQueries({ queryKey: ["products"] });
              }} />
            </div>
            <div>
              <Label className="mb-2 block">Banner transparency ({Math.round(banner_opacity * 100)}%)</Label>
              <input
                type="range" min={0} max={1} step={0.005} value={banner_opacity}
                onChange={async (e) => {
                  const v = parseFloat(e.target.value);
                  setBannerOpacity(v);
                  if (productId) await supabase.from("products").update({ banner_opacity: v }).eq("id", productId);
                  qc.invalidateQueries({ queryKey: ["products"] });
                }}
                className="w-full accent-primary"
              />
              {banner_url && (
                <div className="relative mt-2 h-32 overflow-hidden rounded-lg border border-white/10 bg-black">
                  <img src={banner_url} alt="" className="h-full w-full object-cover" style={{ opacity: banner_opacity }} />
                </div>
              )}
            </div>
            <ScreenshotsEditor productId={productId!} />
          </TabsContent>

          <TabsContent value="downloads" className="mt-4">
            <DownloadsEditor productId={productId!} defaultVersion={latest_version} />
          </TabsContent>

          <TabsContent value="versions" className="mt-4">
            <VersionsEditor productId={productId!} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function F({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><Label className="mb-1 block">{label}</Label>{children}</div>;
}

// ---------- Screenshots ----------
function ScreenshotsEditor({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["screenshots", productId],
    queryFn: async () => {
      const { data, error } = await supabase.from("screenshots").select("*").eq("product_id", productId).order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!productId,
  });
  return (
    <div>
      <Label className="mb-2 block">Screenshots</Label>
      <MultiImageUpload
        folder="screenshots"
        useCase="screenshot"
        items={(data ?? []).map((s: any) => ({ id: s.id, url: s.url }))}
        onAdd={async (url) => {
          const { error } = await supabase.from("screenshots").insert({ product_id: productId, url });
          if (error) throw error;
          qc.invalidateQueries({ queryKey: ["screenshots", productId] });
        }}
        onRemove={async (it) => {
          if (!it.id) return;
          const { error } = await supabase.from("screenshots").delete().eq("id", it.id);
          if (error) { toast.error(error.message); return; }
          qc.invalidateQueries({ queryKey: ["screenshots", productId] });
        }}
      />
    </div>
  );
}

// ---------- Downloads ----------
const PLATFORMS = ["windows", "macos", "linux", "android", "ios", "web"];
const FORMATS = ["exe", "msi", "dmg", "pkg", "deb", "rpm", "appimage", "apk", "aab", "zip", "tar.gz", "web", "other"];
const ARCHITECTURES = ["x86_64", "arm64", "universal", "x86", "arm", "other"];

function DownloadsEditor({ productId, defaultVersion }: { productId: string; defaultVersion: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["downloads", productId],
    queryFn: async () => {
      const { data, error } = await supabase.from("downloads").select("*").eq("product_id", productId).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!productId,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [platform, setPlatform] = useState("windows");
  const [format, setFormat] = useState("exe");
  const [architecture, setArchitecture] = useState("x86_64");
  const [url, setUrl] = useState("");
  const [version, setVersion] = useState(defaultVersion);
  const [mirror, setMirror] = useState("");
  const [sizeBytes, setSizeBytes] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setPlatform("windows");
    setFormat("exe");
    setArchitecture("x86_64");
    setUrl("");
    setVersion(defaultVersion);
    setMirror("");
    setSizeBytes("");
    setIsPrimary(false);
  };

  const startEdit = (d: any) => {
    setEditingId(d.id);
    setPlatform(d.platform);
    setFormat(d.format);
    setArchitecture(d.architecture || "x86_64");
    setUrl(d.url);
    setVersion(d.version || defaultVersion);
    setMirror(d.mirror_name || "");
    setSizeBytes(d.size_bytes?.toString() || "");
    setIsPrimary(d.is_primary || false);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!url) throw new Error("URL required");
      const payload = {
        product_id: productId,
        platform,
        format,
        architecture: architecture || null,
        url,
        version: version || null,
        mirror_name: mirror || null,
        is_primary: isPrimary,
        size_bytes: sizeBytes ? parseInt(sizeBytes) : null,
      };
      
      if (editingId) {
        const { error } = await supabase.from("downloads").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("downloads").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Download updated" : "Download link added");
      resetForm();
      qc.invalidateQueries({ queryKey: ["downloads", productId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("downloads").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["downloads", productId] }),
  });

  const setPrimary = useMutation({
    mutationFn: async (id: string) => {
      // First, remove primary from all downloads for this product
      await supabase.from("downloads").update({ is_primary: false }).eq("product_id", productId);
      // Then set the selected one as primary
      const { error } = await supabase.from("downloads").update({ is_primary: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Primary download updated");
      qc.invalidateQueries({ queryKey: ["downloads", productId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card className="glass border-white/5 bg-transparent p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">{editingId ? "Edit download" : "Add new download"}</h3>
          {editingId && <Button size="sm" variant="ghost" onClick={resetForm}>Cancel</Button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <F label="Platform">
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm">
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </F>
          <F label="Format">
            <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm">
              {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </F>
          <F label="Architecture">
            <select value={architecture} onChange={(e) => setArchitecture(e.target.value)} className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm">
              {ARCHITECTURES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </F>
          <F label="Version"><Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder={defaultVersion} /></F>
          <F label="Mirror name (optional)"><Input value={mirror} onChange={(e) => setMirror(e.target.value)} placeholder="e.g. GitHub, CDN" /></F>
          <F label="Size in bytes (optional)"><Input type="number" value={sizeBytes} onChange={(e) => setSizeBytes(e.target.value)} placeholder="e.g. 1048576" /></F>
          <F label="Download URL" className="sm:col-span-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </F>
          <F label="" className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
              Mark as primary download
            </label>
          </F>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="mt-3 bg-gradient-brand text-brand-foreground shadow-glow">
          {save.isPending ? "Saving…" : editingId ? <><Pencil className="mr-2 h-4 w-4" />Update download</> : <><Plus className="mr-2 h-4 w-4" />Add download link</>}
        </Button>
      </Card>

      <div className="space-y-2">
        {(data ?? []).map((d: any) => (
          <div key={d.id} className="glass flex items-start justify-between gap-3 rounded-md border border-white/5 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{d.platform}</span>
                <span className="text-muted-foreground">·</span>
                <span>{d.format}</span>
                {d.architecture && <><span className="text-muted-foreground">·</span><span>{d.architecture}</span></>}
                {d.version && <><span className="text-muted-foreground">·</span><span className="text-xs">v{d.version}</span></>}
                {d.is_primary && <span className="rounded bg-gradient-brand px-1.5 py-0.5 text-[10px] text-brand-foreground">PRIMARY</span>}
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{d.url}</div>
              <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                {d.mirror_name && <span>{d.mirror_name}</span>}
                {d.size_bytes && <span>{(d.size_bytes / 1024 / 1024).toFixed(2)} MB</span>}
                <span>{new Date(d.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="border-white/10" onClick={() => startEdit(d)}>
                <Pencil className="h-4 w-4" />
              </Button>
              {!d.is_primary && (
                <Button size="sm" variant="outline" className="border-white/10" onClick={() => setPrimary.mutate(d.id)} title="Set as primary">
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" variant="outline" className="border-white/10 text-destructive" onClick={() => del.mutate(d.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {!data?.length && <p className="text-sm text-muted-foreground">No download links yet.</p>}
      </div>
    </div>
  );
}

// ---------- Versions (changelog / historical) ----------
function VersionsEditor({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["versions", productId],
    queryFn: async () => {
      const { data, error } = await supabase.from("versions").select("*").eq("product_id", productId).order("released_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!productId,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [releasedAt, setReleasedAt] = useState("");
  const [isLatest, setIsLatest] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setVersion("");
    setChangelog("");
    setReleasedAt(new Date().toISOString().slice(0, 16));
    setIsLatest(false);
  };

  useEffect(() => {
    resetForm();
  }, [productId]);

  const startEdit = (v: any) => {
    setEditingId(v.id);
    setVersion(v.version);
    setChangelog(v.changelog || "");
    setReleasedAt(v.released_at ? new Date(v.released_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16));
    setIsLatest(v.is_latest || false);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!version) throw new Error("Version required");
      const payload = {
        product_id: productId,
        version,
        changelog: changelog || null,
        is_latest: isLatest,
        released_at: releasedAt ? new Date(releasedAt).toISOString() : new Date().toISOString(),
      };
      
      if (editingId) {
        const { error } = await supabase.from("versions").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("versions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Version updated" : "Version added");
      resetForm();
      qc.invalidateQueries({ queryKey: ["versions", productId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("versions").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["versions", productId] }),
  });

  const setLatest = useMutation({
    mutationFn: async (id: string) => {
      // First, remove latest from all versions for this product
      await supabase.from("versions").update({ is_latest: false }).eq("product_id", productId);
      // Then set the selected one as latest
      const { error } = await supabase.from("versions").update({ is_latest: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Latest version updated");
      qc.invalidateQueries({ queryKey: ["versions", productId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card className="glass border-white/5 bg-transparent p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">{editingId ? "Edit version" : "Add new version"}</h3>
          {editingId && <Button size="sm" variant="ghost" onClick={resetForm}>Cancel</Button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <F label="Version tag" className="sm:col-span-2">
            <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 1.2.3" />
          </F>
          <F label="Release date">
            <Input 
              type="datetime-local" 
              value={releasedAt} 
              onChange={(e) => setReleasedAt(e.target.value)} 
              className="w-full"
            />
          </F>
          <F label="">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isLatest} onChange={(e) => setIsLatest(e.target.checked)} />
              Mark as latest version
            </label>
          </F>
          <F label="Changelog" className="sm:col-span-2">
            <Textarea 
              rows={4} 
              value={changelog} 
              onChange={(e) => setChangelog(e.target.value)} 
              placeholder="Describe what's new in this version..."
            />
          </F>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="mt-3 bg-gradient-brand text-brand-foreground shadow-glow">
          {save.isPending ? "Saving…" : editingId ? <><Pencil className="mr-2 h-4 w-4" />Update version</> : <><Plus className="mr-2 h-4 w-4" />Add version</>}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          To attach a download link for an older version, add it in the Downloads tab with the matching version tag.
        </p>
      </Card>

      <div className="space-y-2">
        {(data ?? []).map((v: any) => (
          <div key={v.id} className="glass flex items-start justify-between gap-3 rounded-md border border-white/5 p-3 text-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">v{v.version}</span>
                {v.is_latest && <span className="rounded bg-gradient-brand px-1.5 py-0.5 text-[10px] text-brand-foreground">LATEST</span>}
              </div>
              {v.changelog && <div className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground line-clamp-3">{v.changelog}</div>}
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                <span>Released: {new Date(v.released_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="border-white/10" onClick={() => startEdit(v)}>
                <Pencil className="h-4 w-4" />
              </Button>
              {!v.is_latest && (
                <Button size="sm" variant="outline" className="border-white/10" onClick={() => setLatest.mutate(v.id)} title="Set as latest">
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" variant="outline" className="border-white/10 text-destructive" onClick={() => del.mutate(v.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {!data?.length && <p className="text-sm text-muted-foreground">No versions logged yet.</p>}
      </div>
    </div>
  );
}
