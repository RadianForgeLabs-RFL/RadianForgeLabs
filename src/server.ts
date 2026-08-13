import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      
      // Handle GitHub GraphQL API proxy
      if (url.pathname === '/api/github-graphql' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { query, variables } = body;

          if (!query) {
            return new Response(JSON.stringify({ error: 'Query is required' }), { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // Get GitHub token from environment
          // Try both env parameter and process.env for Cloudflare Pages compatibility
          const githubToken = (env as any)?.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
          if (!githubToken) {
            console.error('GITHUB_TOKEN not found in env or process.env');
            console.error('env keys:', env ? Object.keys(env) : 'env is null/undefined');
            console.error('process.env keys:', Object.keys(process.env).filter(k => k.includes('GITHUB')));
            return new Response(JSON.stringify({ 
              error: 'GitHub token not configured',
              message: 'Please add GITHUB_TOKEN to Cloudflare Pages environment variables.'
            }), { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          const requestBody: any = { query };
          if (variables) {
            requestBody.variables = variables;
          }

          const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${githubToken}`,
              'Content-Type': 'application/json',
              'User-Agent': 'RadianForgeLabs-Community',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            return new Response(JSON.stringify({ 
              error: 'GitHub API error',
              status: response.status,
              details: errorText
            }), { 
              status: response.status,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          const data = await response.json();
          return new Response(JSON.stringify(data), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        } catch (error) {
          return new Response(JSON.stringify({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : String(error)
          }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
