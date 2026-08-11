import { getRequest } from '@tanstack/react-start/server';

export async function GET() {
  const request = getRequest();
  const cookies = request.headers.get('Cookie') || '';
  const sessionMatch = cookies.match(/radianforge_session=([^;]+)/);

  if (!sessionMatch) {
    return new Response(JSON.stringify({ user: null }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const encryptedSession = sessionMatch[1];
    const sessionData = JSON.parse(Buffer.from(encryptedSession, 'base64').toString());

    return new Response(JSON.stringify({ user: sessionData }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ user: null }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
