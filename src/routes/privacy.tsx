import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Radian Forge Labs" },
      { name: "description", content: "Privacy policy for Radian Forge Labs, RFL Studios, and RFL Entertainment." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <BackButton to="/" label="Back to Home" />
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">Privacy Policy</h1>
      <p className="mt-4 text-muted-foreground">Last updated: August 1, 2026</p>
      
      <Card className="mt-8 border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8">
        <div className="prose prose-invert max-w-none">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">1. Information We Collect</h2>
          <p className="mt-2 text-muted-foreground">
            We collect information you provide directly to us, such as when you create an account, contact us, or use our services. This may include your name, email address, and any other information you choose to provide.
          </p>

          <h2 className="mt-8 text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">2. How We Use Your Information</h2>
          <p className="mt-2 text-muted-foreground">
            We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to comply with legal obligations.
          </p>

          <h2 className="mt-8 text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">3. Data Security</h2>
          <p className="mt-2 text-muted-foreground">
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="mt-8 text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">4. Third-Party Services</h2>
          <p className="mt-2 text-muted-foreground">
            Our services may integrate with third-party services. These third parties have access to your personal information only to perform specific tasks on our behalf.
          </p>

          <h2 className="mt-8 text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">5. Your Rights</h2>
          <p className="mt-2 text-muted-foreground">
            You have the right to access, correct, or delete your personal information. You may also opt out of certain communications from us.
          </p>

          <h2 className="mt-8 text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">6. Contact Us</h2>
          <p className="mt-2 text-muted-foreground">
            If you have any questions about this Privacy Policy, please contact us at support@radianforlabs.com.
          </p>
        </div>
      </Card>
    </div>
  );
}
