import { getRequest } from '@tanstack/react-start/server';

export async function GET() {
  const response = Response.redirect(`${new URL(getRequest().url).origin}/`);
  response.headers.set('Set-Cookie', 'radianforge_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  
  return response;
}
