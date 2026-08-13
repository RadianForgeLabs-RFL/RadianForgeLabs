import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

const BUCKET = "product-media";
// ~100 years — private bucket needs signed URLs
const SIGNED_EXPIRY = 60 * 60 * 24 * 365 * 100;

// Image size configurations based on use case
const IMAGE_SIZES: Record<string, { maxWidth: number; maxHeight: number; quality: number }> = {
  icon: { maxWidth: 256, maxHeight: 256, quality: 0.9 },
  banner: { maxWidth: 1920, maxHeight: 600, quality: 0.85 },
  screenshot: { maxWidth: 1280, maxHeight: 720, quality: 0.8 },
  default: { maxWidth: 1024, maxHeight: 1024, quality: 0.85 },
};

// Resize image using canvas
async function resizeImage(file: File, sizeConfig: { maxWidth: number; maxHeight: number; quality: number }): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;
      const { maxWidth, maxHeight, quality } = sizeConfig;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to resize image'));
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadToBucket(file: File, folder: string, useCase: string = "default"): Promise<string> {
  const sizeConfig = IMAGE_SIZES[useCase] || IMAGE_SIZES.default;
  
  // Resize image before upload
  const resizedBlob = await resizeImage(file, sizeConfig);
  
  const ext = "webp"; // Always use WebP for better compression
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, resizedBlob, {
    cacheControl: "31536000",
    upsert: false,
    contentType: "image/webp",
  });
  if (error) throw error;
  
  // Use public URL for public bucket instead of signed URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function ImageUpload({
  value,
  onChange,
  folder,
  label = "Image",
  aspect = "aspect-square",
  useCase = "default",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  label?: string;
  aspect?: string;
  useCase?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const url = await uploadToBucket(f, folder, useCase);
      onChange(url);
      toast.success(`${label} uploaded`);
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div className="flex items-start gap-3">
      <div className={`${aspect} w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5`}>
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-[10px] text-muted-foreground">No {label}</div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input ref={ref} type="file" accept="image/*" onChange={handle} className="hidden" />
        <Button type="button" size="sm" variant="outline" className="border-white/10" disabled={busy} onClick={() => ref.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />{busy ? "Uploading…" : `Upload ${label}`}
        </Button>
        {value && (
          <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => onChange(null)}>
            <X className="mr-2 h-4 w-4" />Remove
          </Button>
        )}
      </div>
    </div>
  );
}

export function MultiImageUpload({
  items,
  onAdd,
  onRemove,
  folder,
  useCase = "screenshot",
}: {
  items: { id?: string; url: string }[];
  onAdd: (url: string) => Promise<void> | void;
  onRemove: (item: { id?: string; url: string }) => Promise<void> | void;
  folder: string;
  useCase?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    try {
      for (const f of files) {
        const url = await uploadToBucket(f, folder, useCase);
        await onAdd(url);
      }
      toast.success(`${files.length} screenshot(s) uploaded`);
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.url} className="group relative aspect-video overflow-hidden rounded-md border border-white/10 bg-white/5">
            <img src={it.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(it)}
              className="absolute right-1 top-1 rounded-md bg-black/70 p-1 opacity-0 transition group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple onChange={handle} className="hidden" />
      <Button type="button" size="sm" variant="outline" className="mt-2 border-white/10" disabled={busy} onClick={() => ref.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />{busy ? "Uploading…" : "Add screenshots"}
      </Button>
    </div>
  );
}
