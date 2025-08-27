-- Fix search_users function return type mismatch
-- Drop the existing function first
DROP FUNCTION IF EXISTS search_users(TEXT, UUID);

-- Recreate the function with correct return types
CREATE OR REPLACE FUNCTION search_users(search_term TEXT, requesting_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    username VARCHAR(50),
    full_name TEXT,
    email VARCHAR(255),
    avatar_url TEXT,
    wallet_address VARCHAR(42),
    display_name VARCHAR(100),
    role VARCHAR(20),
    business_name TEXT,
    business_type TEXT,
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
            up.username ILIKE '%' || search_term || '%' OR
            up.full_name ILIKE '%' || search_term || '%' OR
            up.display_name ILIKE '%' || search_term || '%' OR
            up.business_name ILIKE '%' || search_term || '%' OR
            up.business_type ILIKE '%' || search_term || '%' OR
            (up.show_email AND up.email ILIKE '%' || search_term || '%')
        )
    ORDER BY 
        -- Prioritize favorites
        COALESCE(uc.is_favorite, FALSE) DESC,
        -- Prioritize businesses for business searches
        CASE WHEN search_term ILIKE '%business%' OR search_term ILIKE '%company%' THEN 
            CASE WHEN up.role = 'business' THEN 1 ELSE 2 END
            ELSE 1
        END,
        -- Then exact username matches
        CASE WHEN up.username ILIKE search_term THEN 1 ELSE 2 END,
        -- Then business name matches (for businesses)
        CASE WHEN up.business_name ILIKE search_term THEN 1 ELSE 2 END,
        -- Then username starts with search term
        CASE WHEN up.username ILIKE search_term || '%' THEN 1 ELSE 2 END,
        -- Then alphabetically
        COALESCE(up.business_name, up.username);
END;
$$ LANGUAGE plpgsql;
