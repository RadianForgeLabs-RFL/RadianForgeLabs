# RFL Studios — full migration bundle

Target project: https://zndizxgtyigkjrqmpsqe.supabase.co

## Order of steps
1. **Schema** — run `full-schema-export.sql` in the new project's SQL editor.
   (tables, enums, RLS policies, grants, functions, triggers, `product-media` bucket)
2. **Data** — run `full-data-export.sql`. Contains every row from every table:
   categories (10), developers (3), products (2), screenshots (1), settings (7),
   announcements (1), community_settings (1), profiles (2), user_roles (3), favorites (2).
   Empty tables: tags, product_tags, downloads, versions, news, community_categories,
   preorders, requests, reviews.
3. **Storage** — upload everything under `product-media/` (keep the
   icons/ banners/ screenshots/ folder names and file names) into the new
   project's `product-media` bucket.
4. **URL rewrite** — run the UPDATE statements at the bottom of `full-data-export.sql`.

## Not transferable
- **Auth users / passwords** — Supabase does not export password hashes. Users
  re-register; the bootstrap trigger re-grants admin to krishnaramalesh8838@gmail.com
  on first sign-up. profiles + user_roles rows are included and will match once the
  same user ids exist (or re-create them after sign-up).
- **Secrets** (LOVABLE_API_KEY etc.) — set them again in the new project.
- **Auth providers** (Google OAuth) — reconfigure in the new project.
