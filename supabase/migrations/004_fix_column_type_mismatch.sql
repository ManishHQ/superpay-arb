-- Fix column type mismatch in search_users function
-- First, let's check and fix the actual table structure if needed
-- Drop the existing function
DROP FUNCTION IF EXISTS search_users(TEXT, UUID);

-- Create the search_users function with return types that match the actual table structure
CREATE OR REPLACE FUNCTION search_users(search_term TEXT, requesting_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    username VARCHAR(50),
    full_name VARCHAR(200),  -- Match the actual table column type
    email VARCHAR(255),
    avatar_url TEXT,
    wallet_address VARCHAR(42),
    display_name VARCHAR(100),
    role VARCHAR(20),
    business_name VARCHAR(200),  -- Match the actual table column type
    business_type VARCHAR(100),  -- Match the actual table column type
    is_favorite BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.username,
        up.full_name,
        CASE 
            WHEN up.show_email THEN up.email 
            ELSE NULL 
        END as email,
        up.avatar_url,
        CASE 
            WHEN up.show_wallet_address THEN up.wallet_address 
            ELSE NULL 
        END as wallet_address,
        up.display_name,
        up.role,
        up.business_name,
        up.business_type,
        COALESCE(uc.is_favorite, FALSE) as is_favorite
    FROM user_profiles up
    LEFT JOIN user_contacts uc ON (up.id = uc.contact_user_id AND uc.user_id = requesting_user_id)
    WHERE 
        up.is_active = TRUE 
        AND up.allow_search = TRUE
        AND up.id != COALESCE(requesting_user_id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND (
            -- Only search by username (case-insensitive)
            LOWER(up.username) LIKE LOWER('%' || search_term || '%')
        )
    ORDER BY 
        -- Prioritize favorites
        COALESCE(uc.is_favorite, FALSE) DESC,
        -- Then exact username matches (case-insensitive)
        CASE WHEN LOWER(up.username) = LOWER(search_term) THEN 1 ELSE 2 END,
        -- Then username starts with search term (case-insensitive)
        CASE WHEN LOWER(up.username) LIKE LOWER(search_term || '%') THEN 1 ELSE 2 END,
        -- Then alphabetically
        up.username;
END;
$$ LANGUAGE plpgsql;

