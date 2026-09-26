-- FrontierGram — Supabase RLS / Storage policy security fixes
-- Applied manually via the Supabase SQL Editor on 2026-09-26 (project gtagpzvmltlqhmwmxrld).
--
-- This project has no Supabase CLI / migrations directory (no `supabase/` folder,
-- no linked project). This file is documentation of changes already applied by
-- hand in the dashboard, not an executable migration — it is not run by any
-- build/deploy step. Kept here so the RLS history is visible in the repo
-- alongside the application code that depends on it.
--
-- Context: an RLS audit found that comments/likes/follows INSERT policies, and
-- all three storage.objects INSERT policies, had NULL `with_check` — meaning
-- they were unconditionally permissive for any authenticated user (any user
-- could insert rows/files under someone else's identity). The statements below
-- close those gaps. DELETE policies on comments/likes/follows/posts, and the
-- profiles UPDATE policy, were already correctly scoped and were not touched.

-- 1. public.comments — INSERT must be restricted to the requester's own user_id
drop policy if exists "users can comment as themselves" on public.comments;
create policy "users can comment as themselves"
on public.comments
for insert
to authenticated
with check (auth.uid() = user_id);

-- 2. public.likes — INSERT must be restricted to the requester's own user_id
drop policy if exists "users can like as themselves" on public.likes;
create policy "users can like as themselves"
on public.likes
for insert
to authenticated
with check (auth.uid() = user_id);

-- 3. public.follows — INSERT must be restricted to the requester's own
--    follower_id, and self-follows are rejected at the database level (the
--    application's own JS-side guard in lib/follows.ts is not sufficient on
--    its own, since it can be bypassed by calling the API directly).
drop policy if exists "users can follow as themselves" on public.follows;
create policy "users can follow as themselves"
on public.follows
for insert
to authenticated
with check (
  auth.uid() = follower_id
  and follower_id <> followed_id
);

-- 4. storage.objects — post-images INSERT restricted to the uploader's own
--    "<userId>/..." folder (matches the upload path convention in
--    lib/posts.ts / app/components/CreatePostForm.tsx).
drop policy if exists "Authenticated users can upload post images" on storage.objects;
create policy "Authenticated users can upload post images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. storage.objects — profile-pictures: the older, broader
--    "Authenticated users can upload profile pictures" INSERT policy (which
--    duplicated/overlapped with the one below and also had a NULL with_check)
--    was removed, leaving a single INSERT policy for this bucket.
drop policy if exists "Authenticated users can upload profile pictures" on storage.objects;

-- The remaining "Authenticated users can upload their own avatar" INSERT
-- policy (matching the "<userId>/..." folder convention in lib/profile.ts's
-- uploadAvatar()) was fixed/kept in place directly in the dashboard and is not
-- restated here. Existing profile-picture UPDATE/DELETE policies were left
-- unchanged, as they were not part of this audit's confirmed gaps.
