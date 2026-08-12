# RFL Studios Database Migration Guide

## Overview
This guide will help you migrate your database from the old Supabase project to the new one.

**Target Project:** https://zndizxgtyigkjrqmpsqe.supabase.co

## Prerequisites
- Access to the new Supabase project dashboard
- Migration files extracted in `supabase/migration-extracted/`
- Node.js installed (for automated storage migration)

## Step 1: Restore Database Schema (Manual)

1. Go to https://supabase.com/dashboard/project/zndizxgtyigkjrqmpsqe
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open the file: `supabase/migration-extracted/full-schema-export.sql`
5. Copy all the content (Ctrl+A, Ctrl+C)
6. Paste into the SQL editor
7. Click **Run** (or press Ctrl+Enter)

**What this does:**
- Creates all database tables
- Sets up enums (app_role, product_kind, etc.)
- Creates RLS policies
- Sets up functions and triggers
- **Creates the `product-media` storage bucket** (required for Step 2)

## Step 2: Upload Product Media to Storage (Automated)

After completing Step 1, run the automated storage migration script:

```bash
node migrate-storage.js
```

**What this does:**
- Automatically uploads all product media files to Supabase Storage
- Uploads icons, banners, and screenshots with correct folder structure
- Sets proper content types for each file

**If the script fails:**
- Ensure Step 1 was completed successfully (creates the storage bucket)
- Check that `supabase/migration-extracted/product-media/` exists
- Run the script again

## Step 3: Restore Database Data (Manual)

1. In the SQL Editor, click **New Query**
2. Open the file: `supabase/migration-extracted/full-data-export.sql`
3. Copy all the content
4. Paste into the SQL editor
5. Click **Run**

**What this does:**
- Restores all data from tables:
  - categories (10 rows)
  - developers (3 rows)
  - products (2 rows)
  - screenshots (1 row)
  - settings (7 rows)
  - announcements (1 row)
  - community_settings (1 row)
  - profiles (2 rows)
  - user_roles (3 rows)
  - favorites (2 rows)

## Step 4: Update Storage URLs

The database still has old storage URLs. Update them to the new project:

1. In SQL Editor, click **New Query**
2. Run this SQL:

```sql
-- Update product media URLs
UPDATE products SET 
  icon_url = REPLACE(icon_url, 'https://vblulnytbpvdeziushxw.supabase.co', 'https://zndizxgtyigkjrqmpsqe.supabase.co'),
  banner_url = REPLACE(banner_url, 'https://vblulnytbpvdeziushxw.supabase.co', 'https://zndizxgtyigkjrqmpsqe.supabase.co'),
  trailer_url = REPLACE(trailer_url, 'https://vblulnytbpvdeziushxw.supabase.co', 'https://zndizxgtyigkjrqmpsqe.supabase.co');

-- Update screenshot URLs
UPDATE screenshots SET 
  url = REPLACE(url, 'https://vblulnytbpvdeziushxw.supabase.co', 'https://zndizxgtyigkjrqmpsqe.supabase.co');
```

3. Click **Run**

## Step 5: Configure Authentication

### Enable GitHub OAuth
1. Go to **Authentication** → **Providers**
2. Find **GitHub** and click **Enable**
3. Add credentials:
   - **Client ID:** `Ov23li0ThYMiH6jSFKh5`
   - **Client Secret:** `e2da4f98d0af0c181765bcf43722b6c6697e568f`
4. Set **Redirect URL:** `https://zndizxgtyigkjrqmpsqe.supabase.co/auth/v1/callback`
5. Click **Save**

### Enable Email Confirmation (Optional)
1. Go to **Authentication** → **Providers**
2. Click on **Email**
3. Enable **Confirm email** if desired
4. Configure email settings if needed

## Step 6: Test the Migration

1. Sign in to your website with `krishnaramalesh8838@gmail.com`
2. Your admin role should be automatically restored
3. Check that products display correctly with images
4. Test creating a discussion in the community
5. Verify favorites functionality

## What's NOT Migrated

- **Auth users/passwords** - Users need to re-register
- **Secrets** - Need to be reconfigured in the new project
- **Auth providers** - Need to be reconfigured (GitHub done above)

## Troubleshooting

### Storage Migration Script Fails
- **"Bucket not found" error:** You must complete Step 1 first (schema migration creates the bucket)
- **"Folder not found" error:** Check that `supabase/migration-extracted/product-media/` exists
- **Upload errors:** Check your Supabase service key in `migrate-storage.js`

### Manual Storage Upload (Alternative)
If the automated script fails, you can upload manually:
1. Go to **Storage** → **product-media** bucket
2. Upload files from `supabase/migration-extracted/product-media/`
3. Keep folder structure: `icons/`, `banners/`, `screenshots/`

### SQL Execution Errors
- Check that the schema was created successfully first
- Look for specific error messages in the SQL Editor
- Some statements may fail if tables already exist - this is normal

### Images Not Loading
- Verify storage URLs were updated in Step 4
- Check that files were uploaded to the correct paths
- Ensure storage bucket is public (if needed)

## Migration Summary

1. **Step 1:** Run schema SQL in Supabase SQL Editor (creates tables + storage bucket)
2. **Step 2:** Run `node migrate-storage.js` (uploads media files automatically)
3. **Step 3:** Run data SQL in Supabase SQL Editor (restores all data)
4. **Step 4:** Run URL update SQL (fixes storage URLs)
5. **Step 5:** Configure GitHub OAuth in Supabase dashboard
6. **Step 6:** Test everything works

## Next Steps

After migration is complete:

1. Add environment variables to Cloudflare Pages (see separate guide)
2. Trigger a new deployment
3. Test all functionality
4. Remove old migration files if desired
