-- Fix search_users function overloading issue
-- Drop all existing versions of the function

DROP FUNCTION IF EXISTS search_users(TEXT);
DROP FUNCTION IF EXISTS search_users(TEXT, UUID);

-- Create a single, unified search_users function that handles both cases
CREATE OR REPLACE FUNCTION search_users(
    search_term TEXT, 
    requesting_user_id UUID DEFAULT NULL
)
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
        up.allow_search = true AND
        up.is_active = true AND
        (requesting_user_id IS NULL OR up.id != requesting_user_id) AND
        (
            up.username ILIKE '%' || search_term || '%' OR
            up.full_name ILIKE '%' || search_term || '%' OR
            up.display_name ILIKE '%' || search_term || '%' OR
            up.business_name ILIKE '%' || search_term || '%' OR
            up.email ILIKE '%' || search_term || '%'
        )
    ORDER BY 
        CASE 
            WHEN up.username ILIKE search_term || '%' THEN 1
            WHEN up.display_name ILIKE search_term || '%' THEN 2
            WHEN up.business_name ILIKE search_term || '%' THEN 3
            WHEN up.full_name ILIKE search_term || '%' THEN 4
            ELSE 5
        END,
        up.username
    LIMIT 50; -- Add reasonable limit to prevent performance issues
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_users(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_users(TEXT, UUID) TO anon;
