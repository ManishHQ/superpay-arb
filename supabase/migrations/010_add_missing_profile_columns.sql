-- Add missing columns to user_profiles table for business functionality
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update the updated_at column to have a default value
ALTER TABLE user_profiles 
ALTER COLUMN updated_at SET DEFAULT now();

-- Add an index on business_name for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_name ON user_profiles(business_name);

-- Add an index on business_type for filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_business_type ON user_profiles(business_type);

-- Create or replace the search_users function to handle the new columns
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
