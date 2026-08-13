import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Bell, BellRing } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const KIND_GRADIENT: Record<string, string> = {
  app: "bg-gradient-brand",
  game: "bg-gradient-to-r from-rose-500 to-rose-400",
  ai: "bg-gradient-to-r from-emerald-500 to-emerald-400",
};

export function PreorderButton({
  productId,
  slug,
  size = "sm",
  className = "",
  kind = "app",
}: {
  productId: string;
  slug?: string;
  size?: "sm" | "lg" | "default";
  className?: string;
  kind?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [preordered, setPreordered] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || slug) { setPreordered(false); return; }
    supabase
      .from("preorders")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle()
      .then(({ data }) => setPreordered(!!data));
  }, [user, productId, slug]);

  async function onClick() {
    if (slug) {
      navigate({ to: "/products/$slug", params: { slug } });
      return;
    }
    if (!user) {
      toast.info("Please sign in to pre-order and get notified.");
      navigate({ to: "/auth", search: { redirect: window.location.pathname } as any });
      return;
    }
    setLoading(true);
    try {
      if (preordered) {
        const { error } = await supabase.from("preorders").delete()
          .eq("user_id", user.id).eq("product_id", productId);
        if (error) throw error;
        setPreordered(false);
        toast.success("Pre-order cancelled");
      } else {
        const { error } = await supabase.from("preorders").insert({
          user_id: user.id, product_id: productId, email: user.email ?? "",
        });
        if (error) throw error;
        setPreordered(true);
        toast.success("You're on the list — we'll email you at launch.");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size={size}
      onClick={onClick}
      disabled={loading}
      className={`${preordered ? "" : `${KIND_GRADIENT[kind] ?? "bg-gradient-brand"} text-brand-foreground shadow-glow`} ${className}`}
      variant={preordered ? "outline" : "default"}
    >
      {preordered ? <BellRing className="mr-2 h-4 w-4" /> : <Bell className="mr-2 h-4 w-4" />}
      {preordered ? "Cancel notify" : "Pre-order · Notify me"}
    </Button>
  );
}
