# Environment Variables

This document lists all required environment variables for the RadianForgeLabs RFL Studios website.

## Public Variables (Client-Side)

These variables are exposed to the browser and should be prefixed with `VITE_`.

### Supabase (Required)
- `VITE_SUPABASE_URL` - Your Supabase project URL (e.g., `https://your-project.supabase.co`)
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key

### GitHub (DEPRECATED - No longer used)
- ~~`VITE_GITHUB_TOKEN`~~ - **REMOVED** - GitHub token is now server-side only

## Secret Variables (Server-Side)

These variables are NEVER exposed to the browser and must be configured in your deployment platform (Cloudflare Pages).

### Supabase (Required for Admin Operations)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (admin privileges)
  - **WARNING**: Never expose this to the client
  - Used only in server-side functions for administrative operations

### GitHub (Required for Community Features)
- `GITHUB_TOKEN` - GitHub personal access token for GraphQL API
  - **WARNING**: Never expose this to the client
  - **CRITICAL**: Required for both local development AND production
  - Used in Cloudflare Pages Functions (`/api/github-graphql`) in production
  - Used in Vite proxy for local development
  - Required scopes: `read:org`, `read:discussion`, `read:user`
  - **Without this variable, community discussions will NOT load**

### OAuth Provider Secrets (Optional - Configured in Supabase Dashboard)
These are typically configured directly in the Supabase Dashboard under Authentication → Providers:
- GitHub OAuth Client ID and Secret
- Google OAuth Client ID and Secret

**Note**: OAuth secrets should be configured in Supabase Dashboard, not as environment variables.

## Development Setup

1. Create a `.env` file in the project root:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

2. For local development with server-side functions, you may need:
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GITHUB_TOKEN=ghp_your-github-token
```

## Production Setup (Cloudflare Pages)

Configure these in Cloudflare Pages Dashboard → Settings → Environment Variables:

### Production Environment
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GITHUB_TOKEN=ghp_your-github-token
```

### Preview Environment (Optional)
```
VITE_SUPABASE_URL=https://your-preview-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-preview-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-preview-service-role-key
GITHUB_TOKEN=ghp_your-github-token
```

## Security Notes

1. **Never commit secrets to Git**
2. **Never use VITE_ prefix for secrets**
3. **Never expose service role keys to client**
4. **Never expose GitHub tokens to client**
5. **Rotate compromised keys immediately**
6. **Use different Supabase projects for dev/staging/production**

## OAuth Callback URLs

Configure these in your OAuth provider dashboards (GitHub, Google):

### Development
- `http://localhost:5173/auth/callback`

### Production
- `https://your-domain.com/auth/callback`

### Preview (Cloudflare Pages)
- `https://your-preview-url.pages.dev/auth/callback`

## Required Supabase Configuration

### Authentication Providers
Enable the following in Supabase Dashboard → Authentication → Providers:
- Email provider (enabled by default)
- GitHub provider (configure OAuth app)
- Google provider (configure OAuth app)

### Email Templates
Configure email templates in Supabase Dashboard → Authentication → Email Templates:
- Confirm signup
- Reset password
- Email change

### SMTP Settings (Optional but Recommended)
Configure SMTP in Supabase Dashboard → Authentication → SMTP Settings:
- Use a provider like Brevo (Sendinblue), SendGrid, or Mailgun
- This allows branded email verification and password reset emails

### Storage Buckets
The following storage buckets are created via migrations:
- `assets` - Public app/game icons, screenshots, banners (admin upload only)
- `avatars` - User profile pictures (user can upload own, admin can manage all)

## Database Migrations

Run migrations to set up the database schema:
```bash
supabase db push
```

Or apply specific migrations:
```bash
supabase migration up
```

## Initial Admin Setup

After deployment, set up the initial administrator:

1. Sign up with your email via the website
2. Get your user ID from the profiles table
3. Run the following SQL in Supabase SQL Editor:
```sql
SELECT public.promote_to_admin('your-user-id-here');
```

Or use the service role key in a server-side function.

## Troubleshooting

### GitHub API Errors
- Ensure `GITHUB_TOKEN` is set in Cloudflare Pages environment variables
- Verify the token has the required scopes
- Check the `/api/github-graphql` function is deployed

### OAuth Errors
- Verify callback URLs match in both Supabase and OAuth provider dashboards
- Ensure OAuth providers are enabled in Supabase Dashboard
- Check that redirect URLs are whitelisted in OAuth provider settings

### RLS Policy Errors
- Ensure RLS is enabled on all tables
- Check that policies are correctly configured
- Verify the `has_role` function exists and is accessible

### Storage Upload Errors
- Ensure storage buckets exist (`assets`, `avatars`)
- Check storage policies are correctly configured
- Verify user has appropriate role for upload operations
