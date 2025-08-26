-- ============================================
-- MISSING SUPABASE STORAGE POLICIES FOR AVATARS BUCKET
-- ============================================
-- Run these commands in: Supabase Dashboard → SQL Editor
-- (SELECT policy already exists, so only adding the missing ones)

-- 1. INSERT Policy - Allow anyone to upload avatars
CREATE POLICY "Public can upload avatars" ON storage.objects
    FOR INSERT 
    WITH CHECK (bucket_id = 'avatars');

-- 2. UPDATE Policy - Allow anyone to update avatars  
CREATE POLICY "Public can update avatars" ON storage.objects
    FOR UPDATE 
    USING (bucket_id = 'avatars')
    WITH CHECK (bucket_id = 'avatars');

-- 3. DELETE Policy - Allow anyone to delete avatars
CREATE POLICY "Public can delete avatars" ON storage.objects
    FOR DELETE 
    USING (bucket_id = 'avatars');

-- ============================================
-- VERIFY POLICIES (Optional - run to check)
-- ============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;
