import { Request, Response } from '@cloudflare/workers-types';

export async function onRequest(context: { request: Request; env: any }) {
  const { request, env } = context;

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json();
    const { query, variables } = body;

    if (!query) {
      return new Response('Query is required', { status: 400 });
    }

    // Use server-side GitHub token from environment variables
    const githubToken = env.GITHUB_TOKEN;
    if (!githubToken) {
      return new Response('GitHub token not configured', { status: 500 });
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
      return new Response(`GitHub API error: ${response.status}`, { status: response.status });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(`Error: ${error}`, { status: 500 });
  }
}
