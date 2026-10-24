import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Radian Forge Labs" },
      { name: "description", content: "Terms of service for Radian Forge Labs, RFL Studios, and RFL Entertainment." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <BackButton to="/" label="Back to Home" />
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">Terms of Service</h1>
      <p className="mt-4 text-muted-foreground">Last updated: August 1, 2026</p>
      
      <Card className="mt-8 border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8">
        <div className="prose prose-invert max-w-none">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">1. Acceptance of Terms</h2>
          <p className="mt-2 text-muted-foreground">
            By accessing or using our services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>

          <h2 className="mt-8 text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">2. Description of Service</h2>
          <p className="mt-2 text-muted-foreground">
            Radian Forge Labs provides software applications and games through our divisions: RFL Studios (professional software) and RFL Entertainment (gaming experiences). We reserve the right to modify, suspend, or discontinue any service at any time.
          </p>

          <h2 className="mt-8 text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">3. User Responsibilities</h2>
          <p className="mt-2 text-muted-foreground">
            You agree to use our services only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account information.
          </p>

          <h2 className="mt-8 text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">4. Intellectual Property</h2>
          <p className="mt-2 text-muted-foreground">
            All content, features, and functionality of our services are owned by Radian Forge Labs and are protected by international copyright, trademark, and other intellectual property laws.
          </p>

          <h2 className="mt-8 text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">5. Open Source Software</h2>
          <p className="mt-2 text-muted-foreground">
            Some of our software is released under open source licenses. When using open source software, you agree to comply with the specific license terms for that software.
          </p>

          <h2 className="mt-8 text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">6. Disclaimer of Warranties</h2>
          <p className="mt-2 text-muted-foreground">
            Our services are provided "as is" without warranties of any kind, either express or implied. We do not warrant that our services will be uninterrupted, secure, or error-free.
          </p>

          <h2 className="mt-8 text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">7. Limitation of Liability</h2>
          <p className="mt-2 text-muted-foreground">
            To the fullest extent permitted by law, Radian Forge Labs shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.
          </p>

          <h2 className="mt-8 text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">8. Changes to Terms</h2>
          <p className="mt-2 text-muted-foreground">
            We reserve the right to modify these terms at any time. Your continued use of our services after such modifications constitutes your acceptance of the updated terms.
          </p>

          <h2 className="mt-8 text-2xl font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 bg-clip-text text-transparent">9. Contact Information</h2>
          <p className="mt-2 text-muted-foreground">
            For questions about these Terms of Service, please contact us at support@radianforlabs.com.
          </p>
        </div>
      </Card>
    </div>
  );
}
