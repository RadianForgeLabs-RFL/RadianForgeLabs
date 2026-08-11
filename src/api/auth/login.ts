import { getRequest } from '@tanstack/react-start/server';

export async function GET() {
  const request = getRequest();
  const clientId = process.env.VITE_GITHUB_CLIENT_ID;
  
  if (!clientId) {
    return new Response('GitHub Client ID not configured', { status: 500 });
  }

  const redirectUri = `${new URL(request.url).origin}/api/auth/callback`;
  const scope = 'read:user user:email';
  const state = crypto.randomUUID();

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('scope', scope);
  githubAuthUrl.searchParams.set('state', state);

  // Set state in cookie for CSRF protection
  const response = Response.redirect(githubAuthUrl.toString());
  response.headers.set('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  
  return response;
}
