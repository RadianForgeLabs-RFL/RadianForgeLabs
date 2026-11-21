import { createFileRoute } from "@tanstack/react-router";
import { ListingPage } from "@/components/site/ListingPage";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "All Projects & Products — RFL Studios & RFL Entertainment" },
      { name: "description", content: "Explore the complete project catalogue from Radian Forge Labs: desktop software, mobile applications, indie video games, and developer tools." },
      { property: "og:title", content: "All Projects & Products — Radian Forge Labs" },
      { property: "og:description", content: "Explore the complete project catalogue from Radian Forge Labs: desktop software, mobile applications, indie video games, and developer tools." },
      { property: "og:url", content: "https://rfl-studios.com/projects" },
      { property: "og:image", content: "https://rfl-studios.com/og-image.png" },
      { name: "twitter:title", content: "All Projects & Products — Radian Forge Labs" },
      { name: "twitter:description", content: "Explore the complete project catalogue from Radian Forge Labs: desktop software, mobile applications, indie video games, and developer tools." },
      { name: "twitter:image", content: "https://rfl-studios.com/og-image.png" },
    ],
    links: [
      { rel: "canonical", href: "https://rfl-studios.com/projects" },
    ],
  }),
  component: () => <ListingPage kind="all" title="All Projects" subtitle="The complete catalogue — apps, games, AI, tools." />,
});
