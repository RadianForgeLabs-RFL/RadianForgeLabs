import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/github-graphql")({
  GET: async ({ request }) => {
    return new Response("Method not allowed", { status: 405 });
  },
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { query, variables } = body;

      if (!query) {
        return new Response("Query is required", { status: 400 });
      }

      // Get GitHub token from environment
      const githubToken = import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
      if (!githubToken) {
        return new Response("GitHub token not configured", { status: 500 });
      }

      const requestBody: any = { query };
      if (variables) {
        requestBody.variables = variables;
      }

      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "Content-Type": "application/json",
          "User-Agent": "RadianForgeLabs-Community",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("GitHub API error:", errorText);
        return new Response(`GitHub API error: ${response.status} - ${errorText}`, {
          status: response.status,
        });
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error in github-graphql route:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
