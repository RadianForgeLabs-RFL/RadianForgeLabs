import { Request, Response } from '@cloudflare/workers-types';

export async function onRequest(context: { request: Request; env: any }) {
  const { request, env } = context;

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { query, variables } = body;

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use server-side GitHub token from environment variables
    const githubToken = env.GITHUB_TOKEN;
    if (!githubToken) {
      console.error('GITHUB_TOKEN not found in environment. Available env keys:', Object.keys(env));
      return new Response(JSON.stringify({ 
        error: 'GitHub token not configured',
        message: 'Please add GITHUB_TOKEN to Cloudflare Pages environment variables.',
        availableKeys: Object.keys(env)
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
      console.error('GitHub API error:', response.status, errorText);
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
    console.error('Error in github-graphql function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
