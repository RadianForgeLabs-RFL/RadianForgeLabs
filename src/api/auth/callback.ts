import { getRequest } from '@tanstack/react-start/server';

export async function GET() {
  const request = getRequest();
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const clientId = process.env.VITE_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!code || !state) {
    return new Response('Missing code or state parameter', { status: 400 });
  }

  if (!clientId || !clientSecret || !sessionSecret) {
    return new Response('Server configuration error', { status: 500 });
  }

  // Verify state from cookie for CSRF protection
  const cookies = request.headers.get('Cookie') || '';
  const stateMatch = cookies.match(/oauth_state=([^;]+)/);
  if (!stateMatch || stateMatch[1] !== state) {
    return new Response('Invalid state parameter', { status: 400 });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Failed to exchange code for token');
    }

    // Fetch user data from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'RadianForgeLabs',
      },
    });

    const userData = await userResponse.json();

    // Create session data
    const sessionData = {
      githubId: userData.id.toString(),
      login: userData.login,
      avatar: userData.avatar_url,
      email: userData.email || null,
      name: userData.name || userData.login,
    };

    // Encrypt session data (simple base64 encoding for now, should use proper encryption in production)
    const encryptedSession = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    // Set session cookie
    const response = Response.redirect(`${new URL(request.url).origin}/community`);
    response.headers.set('Set-Cookie', `radianforge_session=${encryptedSession}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`); // 7 days
    response.headers.set('Set-Cookie', `oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`); // Clear state cookie

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response('Authentication failed', { status: 500 });
  }
}
