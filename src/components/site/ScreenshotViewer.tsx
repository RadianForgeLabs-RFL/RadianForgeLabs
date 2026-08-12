import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ScreenshotGallery({ screenshots }: { screenshots: { id?: string; url: string; caption?: string | null }[] }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const openAt = (i: number) => { setIdx(i); setOpen(true); };
  const prev = useCallback(() => setIdx((i) => (i - 1 + screenshots.length) % screenshots.length), [screenshots.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % screenshots.length), [screenshots.length]);

  useEffect(() => {
    if (!open) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [open, prev, next]);

  if (!screenshots.length) return null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {screenshots.map((s, i) => (
          <button
            key={s.id ?? s.url}
            type="button"
            onClick={() => openAt(i)}
            className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-muted transition hover:border-primary/60"
          >
            <img src={s.url} alt={s.caption ?? `Screenshot ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl border-white/5 bg-background/95 p-2 sm:p-3">
          <DialogTitle className="sr-only">Screenshot Gallery</DialogTitle>
          <div className="relative">
            <img src={screenshots[idx]?.url} alt="" className="max-h-[80vh] w-full rounded-md object-contain" />
            {screenshots.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"><ChevronLeft className="h-5 w-5" /></button>
                <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"><ChevronRight className="h-5 w-5" /></button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{idx + 1} / {screenshots.length}</div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
