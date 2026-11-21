import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — RFL Studios" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const submit = async () => {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    nav({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card className="glass-strong border-white/5 bg-transparent p-6">
        <h1 className="text-2xl font-semibold">Set a new password</h1>
        <div className="mt-4 space-y-3">
          <Label>New password</Label>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="glass border-white/10 bg-transparent" />
          <Button onClick={submit} disabled={busy} className="w-full bg-gradient-brand text-brand-foreground shadow-glow">{busy ? "Saving…" : "Update password"}</Button>
        </div>
      </Card>
    </div>
  );
}
