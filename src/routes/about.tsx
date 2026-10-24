import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Radian Forge Labs" }, { name: "description", content: "About Radian Forge Labs and our divisions: RFL Studios and RFL Entertainment." }] }),
  component: () => (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <BackButton to="/" label="Back to Home" />
      <h1 className="text-4xl font-bold md:text-5xl bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">About Radian Forge Labs</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        <strong className="text-blue-500">Radian Forge Labs</strong> is a technology company building professional software through
        <strong className="text-purple-500">RFL Studios</strong> and immersive gaming experiences through
        <strong className="text-rose-500">RFL Entertainment</strong>.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card className="glass border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent p-6">
          <h2 className="text-xl font-semibold text-blue-500">Our mission</h2>
          <p className="mt-2 text-sm text-muted-foreground">To create innovative software and gaming experiences that empower users and bring joy to millions. We believe in open-source, accessibility, and the power of technology to transform lives.</p>
        </Card>
        <Card className="glass border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent p-6">
          <h2 className="text-xl font-semibold text-rose-500">Our divisions</h2>
          <p className="mt-2 text-sm text-muted-foreground"><strong className="text-blue-500">RFL Studios</strong> builds professional Windows and Android applications. <strong className="text-rose-500">RFL Entertainment</strong> creates immersive PC and Android games.</p>
        </Card>
      </div>
    </div>
  ),
});
