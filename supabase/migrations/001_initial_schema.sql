-- Complete database schema for Dynamic.xyz payment app
-- This schema is designed to work with Dynamic.xyz authentication (not Supabase Auth)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean start)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP FUNCTION IF EXISTS search_users(TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Basic profile information
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(200),
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    
    -- User role and type
    role VARCHAR(20) DEFAULT 'person' CHECK (role IN ('person', 'business')),
    business_name VARCHAR(200), -- Only for business users
    business_type VARCHAR(100), -- e.g., 'restaurant', 'retail', 'services', etc.
    business_description TEXT,
    
    -- Dynamic.xyz integration
    wallet_address VARCHAR(42) UNIQUE, -- Ethereum addresses are 42 chars (0x + 40 hex)
    dynamic_user_id VARCHAR(255), -- Dynamic.xyz user ID if available
    
    -- Profile settings
    display_name VARCHAR(100), -- Optional display name different from username
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Privacy settings
    show_wallet_address BOOLEAN DEFAULT TRUE,
    show_email BOOLEAN DEFAULT FALSE,
    allow_search BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Transaction participants
    from_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Transaction details
    amount DECIMAL(20, 8) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) DEFAULT 'USDC' NOT NULL,
    note TEXT,
    
    -- Transaction status and blockchain info
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    transaction_hash VARCHAR(66), -- Ethereum tx hashes are 66 chars (0x + 64 hex)
    block_number BIGINT,
    blockchain VARCHAR(50) DEFAULT 'arbitrum',
    network VARCHAR(50) DEFAULT 'sepolia',
    
    -- Fee information
    gas_fee DECIMAL(20, 8),
    gas_fee_currency VARCHAR(10) DEFAULT 'ETH',
    platform_fee DECIMAL(20, 8),
    platform_fee_currency VARCHAR(10) DEFAULT 'USDC',
    
    -- Metadata
    transaction_type VARCHAR(20) DEFAULT 'transfer' CHECK (transaction_type IN ('transfer', 'request', 'split', 'refund')),
    is_internal BOOLEAN DEFAULT TRUE, -- Whether transaction is between app users
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT different_users CHECK (from_user_id != to_user_id)
);

-- Create user_contacts table (for frequent contacts)
CREATE TABLE user_contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    contact_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    nickname VARCHAR(100), -- Optional nickname for the contact
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique contact relationships
    UNIQUE(user_id, contact_user_id),
    CONSTRAINT no_self_contact CHECK (user_id != contact_user_id)
);

-- Create transaction_requests table (for payment requests)
CREATE TABLE transaction_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Request details
    from_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE, -- Who is requesting
    to_user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,   -- Who should pay
    amount DECIMAL(20, 8) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) DEFAULT 'USDC' NOT NULL,
    note TEXT,
    
    -- Request status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Linked transaction (when request is fulfilled)
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT different_users_request CHECK (from_user_id != to_user_id)
);

-- Create user_settings table
CREATE TABLE user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    transaction_notifications BOOLEAN DEFAULT TRUE,
    request_notifications BOOLEAN DEFAULT TRUE,
    
    -- App preferences
    default_currency VARCHAR(10) DEFAULT 'USDC',
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language VARCHAR(10) DEFAULT 'en',
    
    -- Security settings
    require_confirmation BOOLEAN DEFAULT TRUE,
    biometric_enabled BOOLEAN DEFAULT FALSE,
    auto_logout_minutes INTEGER DEFAULT 30,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for optimal performance
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_wallet_address ON user_profiles(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_user_profiles_dynamic_user_id ON user_profiles(dynamic_user_id) WHERE dynamic_user_id IS NOT NULL;
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active_searchable ON user_profiles(username, full_name) WHERE is_active = TRUE AND allow_search = TRUE;
CREATE INDEX idx_user_profiles_business_search ON user_profiles(business_name, business_type) WHERE role = 'business' AND is_active = TRUE;

CREATE INDEX idx_transactions_from_user ON transactions(from_user_id, created_at DESC);
CREATE INDEX idx_transactions_to_user ON transactions(to_user_id, created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_hash ON transactions(transaction_hash) WHERE transaction_hash IS NOT NULL;

CREATE INDEX idx_user_contacts_user_id ON user_contacts(user_id);
CREATE INDEX idx_user_contacts_favorites ON user_contacts(user_id, is_favorite) WHERE is_favorite = TRUE;

CREATE INDEX idx_transaction_requests_from_user ON transaction_requests(from_user_id, created_at DESC);
CREATE INDEX idx_transaction_requests_to_user ON transaction_requests(to_user_id, created_at DESC);
CREATE INDEX idx_transaction_requests_status ON transaction_requests(status);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transaction_requests_updated_at 
    BEFORE UPDATE ON transaction_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to search users
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

-- Create function to get user transaction history
CREATE OR REPLACE FUNCTION get_user_transactions(
    user_id_param UUID, 
    limit_param INTEGER DEFAULT 50,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    amount DECIMAL(20, 8),
    currency VARCHAR(10),
    note TEXT,
    status VARCHAR(20),
    transaction_type VARCHAR(20),
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    other_user_id UUID,
    other_user_username VARCHAR(50),
    other_user_name TEXT,
    other_user_avatar TEXT,
    is_sender BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.amount,
        t.currency,
        t.note,
        t.status,
        t.transaction_type,
        t.transaction_hash,
        t.created_at,
        t.completed_at,
        CASE 
            WHEN t.from_user_id = user_id_param THEN t.to_user_id 
            ELSE t.from_user_id 
        END as other_user_id,
        CASE 
            WHEN t.from_user_id = user_id_param THEN to_user.username 
            ELSE from_user.username 
        END as other_user_username,
        CASE 
            WHEN t.from_user_id = user_id_param THEN 
                COALESCE(to_user.display_name, to_user.full_name)
            ELSE 
                COALESCE(from_user.display_name, from_user.full_name)
        END as other_user_name,
        CASE 
            WHEN t.from_user_id = user_id_param THEN to_user.avatar_url 
            ELSE from_user.avatar_url 
        END as other_user_avatar,
        (t.from_user_id = user_id_param) as is_sender
    FROM transactions t
    JOIN user_profiles from_user ON t.from_user_id = from_user.id
    JOIN user_profiles to_user ON t.to_user_id = to_user.id
    WHERE t.from_user_id = user_id_param OR t.to_user_id = user_id_param
    ORDER BY t.created_at DESC
    LIMIT limit_param OFFSET offset_param;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles (Dynamic.xyz compatible)
CREATE POLICY "Anyone can read public profiles" ON user_profiles
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can create profiles" ON user_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update any profile" ON user_profiles
    FOR UPDATE USING (true) WITH CHECK (true);

-- RLS Policies for transactions
CREATE POLICY "Users can read all transactions" ON transactions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create transactions" ON transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update transactions" ON transactions
    FOR UPDATE USING (true) WITH CHECK (true);

-- RLS Policies for user_contacts
CREATE POLICY "Users can manage all contacts" ON user_contacts
    FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for transaction_requests
CREATE POLICY "Users can manage all requests" ON transaction_requests
    FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for user_settings
CREATE POLICY "Users can manage all settings" ON user_settings
    FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data
INSERT INTO user_profiles (
    id, username, full_name, email, avatar_url, wallet_address, display_name, role, business_name, business_type
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    'alice_crypto',
    'Alice Johnson',
    'alice@example.com',
    'https://i.pravatar.cc/150?img=1',
    '0x1234567890123456789012345678901234567890',
    'Alice J.',
    'person',
    NULL,
    NULL
),
(
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    'bob_blockchain',
    'Bob Smith',
    'bob@example.com',
    'https://i.pravatar.cc/150?img=2',
    '0x2345678901234567890123456789012345678901',
    'Bob S.',
    'person',
    NULL,
    NULL
),
(
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    'coffee_corner_nyc',
    'Sarah Williams',
    'sarah@coffeecornernyc.com',
    'https://i.pravatar.cc/150?img=3',
    '0x3456789012345678901234567890123456789012',
    'Coffee Corner NYC',
    'business',
    'Coffee Corner NYC',
    'Restaurant'
),
(
    '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    'tech_solutions_llc',
    'Michael Davis',
    'michael@techsolutions.com',
    'https://i.pravatar.cc/150?img=4',
    '0x4567890123456789012345678901234567890123',
    'Tech Solutions LLC',
    'business',
    'Tech Solutions LLC',
    'Technology Services'
)
ON CONFLICT (email) DO NOTHING;

-- Insert default settings for sample users
INSERT INTO user_settings (user_id) 
SELECT id FROM user_profiles 
WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440000',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (
    from_user_id, to_user_id, amount, currency, note, status, transaction_type
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    25.50,
    'USDC',
    'Coffee payment ☕',
    'completed',
    'transfer'
),
(
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    '550e8400-e29b-41d4-a716-446655440000',
    100.00,
    'USDC',
    'Lunch split 🍕',
    'completed',
    'transfer'
);

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload avatar images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can update avatar images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete avatar images" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars');

-- Create view for user dashboard stats
CREATE VIEW user_dashboard_stats AS
SELECT 
    up.id as user_id,
    up.username,
    -- Transaction counts
    COALESCE(sent_count.count, 0) as transactions_sent,
    COALESCE(received_count.count, 0) as transactions_received,
    COALESCE(total_count.count, 0) as total_transactions,
    
    -- Amount totals (in USDC)
    COALESCE(sent_amount.total, 0) as total_sent_usdc,
    COALESCE(received_amount.total, 0) as total_received_usdc,
    
    -- Recent activity
    latest_transaction.created_at as last_transaction_at,
    
    -- Contact count
    COALESCE(contact_count.count, 0) as contact_count

FROM user_profiles up

-- Sent transactions count
LEFT JOIN (
    SELECT from_user_id, COUNT(*) as count
    FROM transactions 
    WHERE status = 'completed'
    GROUP BY from_user_id
) sent_count ON up.id = sent_count.from_user_id

-- Received transactions count
LEFT JOIN (
    SELECT to_user_id, COUNT(*) as count
    FROM transactions 
    WHERE status = 'completed'
    GROUP BY to_user_id
) received_count ON up.id = received_count.to_user_id

-- Total transactions count
LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM (
        SELECT from_user_id as user_id FROM transactions WHERE status = 'completed'
        UNION ALL
        SELECT to_user_id as user_id FROM transactions WHERE status = 'completed'
    ) all_transactions
    GROUP BY user_id
) total_count ON up.id = total_count.user_id

-- Sent amounts
LEFT JOIN (
    SELECT from_user_id, SUM(amount) as total
    FROM transactions 
    WHERE status = 'completed' AND currency = 'USDC'
    GROUP BY from_user_id
) sent_amount ON up.id = sent_amount.from_user_id

-- Received amounts
LEFT JOIN (
    SELECT to_user_id, SUM(amount) as total
    FROM transactions 
    WHERE status = 'completed' AND currency = 'USDC'
    GROUP BY to_user_id
) received_amount ON up.id = received_amount.to_user_id

-- Latest transaction
LEFT JOIN (
    SELECT 
        user_id,
        MAX(created_at) as created_at
    FROM (
        SELECT from_user_id as user_id, created_at FROM transactions
        UNION ALL
        SELECT to_user_id as user_id, created_at FROM transactions
    ) all_user_transactions
    GROUP BY user_id
) latest_transaction ON up.id = latest_transaction.user_id

-- Contact count
LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM user_contacts
    GROUP BY user_id
) contact_count ON up.id = contact_count.user_id

WHERE up.is_active = TRUE;
