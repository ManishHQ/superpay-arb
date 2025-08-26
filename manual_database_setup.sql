-- MANUAL DATABASE SETUP
-- Run these commands in your Supabase SQL Editor or database client

-- 1. Add missing columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Update the updated_at column to have a default value
ALTER TABLE user_profiles 
ALTER COLUMN updated_at SET DEFAULT now();

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_name ON user_profiles(business_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_type ON user_profiles(business_type);

-- 4. Update search_users function to handle new columns
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    display_name TEXT,
    business_name TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.username,
        up.full_name,
        up.display_name,
        up.business_name,
        up.email,
        up.avatar_url,
        up.role,
        up.created_at,
        up.updated_at
    FROM user_profiles up
    WHERE 
        up.username ILIKE '%' || search_term || '%' OR
        up.full_name ILIKE '%' || search_term || '%' OR
        up.display_name ILIKE '%' || search_term || '%' OR
        up.business_name ILIKE '%' || search_term || '%' OR
        up.email ILIKE '%' || search_term || '%'
    ORDER BY 
        CASE 
            WHEN up.username ILIKE search_term || '%' THEN 1
            WHEN up.display_name ILIKE search_term || '%' THEN 2
            WHEN up.business_name ILIKE search_term || '%' THEN 3
            WHEN up.full_name ILIKE search_term || '%' THEN 4
            ELSE 5
        END,
        up.username;
END;
$$;

-- 5. OPTIONAL: Set up Supabase Storage (if you want to use file uploads)
-- Go to your Supabase Dashboard > Storage and:
-- 1. Create a new bucket called "avatars"
-- 2. Make it public
-- 3. Set file size limit to 5MB
-- 4. Add allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
-- 5. Add RLS policies:

-- Allow authenticated users to upload avatars
-- CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
-- FOR INSERT 
-- TO authenticated
-- WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update avatars  
-- CREATE POLICY "Authenticated users can update avatars" ON storage.objects
-- FOR UPDATE 
-- TO authenticated
-- USING (bucket_id = 'avatars')
-- WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to delete avatars
-- CREATE POLICY "Authenticated users can delete avatars" ON storage.objects
-- FOR DELETE 
-- TO authenticated
-- USING (bucket_id = 'avatars');

-- Allow public read access to all avatars
-- CREATE POLICY "Public can view avatars" ON storage.objects
-- FOR SELECT 
-- TO public
-- USING (bucket_id = 'avatars');
