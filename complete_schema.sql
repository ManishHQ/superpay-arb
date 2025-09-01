-- Complete database schema for Dynamic.xyz payment app - One Shot Migration
-- This schema consolidates all migrations into one comprehensive file
-- Designed to work with Dynamic.xyz authentication (not Supabase Auth)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean start)
DROP TABLE IF EXISTS waitlist CASCADE;
DROP TABLE IF EXISTS pot_activities CASCADE;
DROP TABLE IF EXISTS user_pots CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS transaction_requests CASCADE;
DROP TABLE IF EXISTS user_contacts CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP FUNCTION IF EXISTS search_users(TEXT, UUID);
DROP FUNCTION IF EXISTS search_users(TEXT);
DROP FUNCTION IF EXISTS get_user_transactions(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_user_pots_updated_at();
DROP FUNCTION IF EXISTS update_waitlist_updated_at();
DROP VIEW IF EXISTS user_dashboard_stats;

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
    
    -- Additional business fields
    address TEXT,
    website TEXT,
    phone TEXT,
    
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
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT username_lowercase CHECK (username = LOWER(username))
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
    
    -- Transaction categorization
    category TEXT CHECK (category IN (
        'housing',
        'transport',
        'emergency',
        'vacation',
        'investment',
        'custom',
        'food',
        'entertainment',
        'healthcare',
        'utilities',
        'shopping',
        'other'
    )),
    
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

-- Create user_pots table for savings pots functionality
CREATE TABLE user_pots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Basic pot information
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    target_amount DECIMAL(20, 8) NOT NULL CHECK (target_amount > 0),
    current_amount DECIMAL(20, 8) DEFAULT 0 CHECK (current_amount >= 0),
    
    -- Visual customization
    icon VARCHAR(10) DEFAULT '💰',
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    
    -- Pot configuration
    category VARCHAR(50) DEFAULT 'custom' CHECK (category IN ('housing', 'transport', 'emergency', 'vacation', 'investment', 'custom')),
    is_yield_enabled BOOLEAN DEFAULT FALSE,
    yield_strategy VARCHAR(50), -- 'aave', 'compound', 'celo', 'coinbase'
    apy DECIMAL(5, 4), -- Annual percentage yield (e.g., 0.0525 for 5.25%)
    
    -- Auto-invest settings
    is_auto_invest_enabled BOOLEAN DEFAULT FALSE,
    auto_invest_amount DECIMAL(20, 8),
    auto_invest_frequency VARCHAR(10) CHECK (auto_invest_frequency IN ('weekly', 'monthly')),
    monthly_contribution DECIMAL(20, 8),
    
    -- Strict pot settings
    is_strict BOOLEAN DEFAULT FALSE,
    strict_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Joint pot settings
    is_joint BOOLEAN DEFAULT FALSE,
    collaborators UUID[] DEFAULT '{}', -- Array of user IDs
    invited_users TEXT[] DEFAULT '{}', -- Array of email addresses
    
    -- Status
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    target_date TIMESTAMP WITH TIME ZONE
);

-- Create pot_activities table to track activities within savings pots
CREATE TABLE pot_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pot_id UUID NOT NULL REFERENCES user_pots(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'deposit',
        'withdrawal',
        'interest',
        'fee',
        'transfer_in',
        'transfer_out'
    )),
    amount DECIMAL(18,6) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USDC',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waitlist table for collecting early access signups
CREATE TABLE waitlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- User information
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'launched')),
    
    -- Metadata
    source VARCHAR(100), -- How they found us (optional)
    referrer VARCHAR(100), -- Referral source (optional)
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT waitlist_email_lowercase CHECK (email = lower(email))
);

-- Create indexes for optimal performance
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_wallet_address ON user_profiles(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_user_profiles_dynamic_user_id ON user_profiles(dynamic_user_id) WHERE dynamic_user_id IS NOT NULL;
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active_searchable ON user_profiles(username, full_name) WHERE is_active = TRUE AND allow_search = TRUE;
CREATE INDEX idx_user_profiles_business_search ON user_profiles(business_name, business_type) WHERE role = 'business' AND is_active = TRUE;
CREATE INDEX idx_user_profiles_business_name ON user_profiles(business_name);
CREATE INDEX idx_user_profiles_business_type ON user_profiles(business_type);

-- Username case-insensitive unique index
CREATE UNIQUE INDEX idx_user_profiles_username_case_insensitive ON user_profiles (LOWER(username));

CREATE INDEX idx_transactions_from_user ON transactions(from_user_id, created_at DESC);
CREATE INDEX idx_transactions_to_user ON transactions(to_user_id, created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_hash ON transactions(transaction_hash) WHERE transaction_hash IS NOT NULL;
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_category_user ON transactions(from_user_id, category) WHERE category IS NOT NULL;

CREATE INDEX idx_user_contacts_user_id ON user_contacts(user_id);
CREATE INDEX idx_user_contacts_favorites ON user_contacts(user_id, is_favorite) WHERE is_favorite = TRUE;

CREATE INDEX idx_transaction_requests_from_user ON transaction_requests(from_user_id, created_at DESC);
CREATE INDEX idx_transaction_requests_to_user ON transaction_requests(to_user_id, created_at DESC);
CREATE INDEX idx_transaction_requests_status ON transaction_requests(status);

CREATE INDEX idx_user_pots_user_id ON user_pots(user_id);
CREATE INDEX idx_user_pots_category ON user_pots(category);
CREATE INDEX idx_user_pots_is_archived ON user_pots(is_archived);
CREATE INDEX idx_user_pots_created_at ON user_pots(created_at);

CREATE INDEX idx_pot_activities_pot_id ON pot_activities(pot_id);
CREATE INDEX idx_pot_activities_transaction_id ON pot_activities(transaction_id);
CREATE INDEX idx_pot_activities_created_at ON pot_activities(created_at DESC);
CREATE INDEX idx_pot_activities_type ON pot_activities(activity_type);

CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at DESC);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to update updated_at timestamp for user_pots
CREATE OR REPLACE FUNCTION update_user_pots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update updated_at timestamp for waitlist
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE TRIGGER update_user_pots_updated_at
    BEFORE UPDATE ON user_pots
    FOR EACH ROW
    EXECUTE FUNCTION update_user_pots_updated_at();

CREATE TRIGGER update_waitlist_updated_at
    BEFORE UPDATE ON waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_waitlist_updated_at();

-- Create unified search_users function
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
            LOWER(up.username) LIKE LOWER('%' || search_term || '%')
        )
    ORDER BY 
        -- Exact username matches (case-insensitive)
        CASE WHEN LOWER(up.username) = LOWER(search_term) THEN 1 ELSE 2 END,
        -- Username starts with search term (case-insensitive)
        CASE WHEN LOWER(up.username) LIKE LOWER(search_term || '%') THEN 1 ELSE 2 END,
        -- Then alphabetically
        up.username
    LIMIT 50; -- Add reasonable limit to prevent performance issues
END;
$$;

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

-- Enable Row Level Security (RLS) - Using open policies for Dynamic.xyz compatibility
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pot_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles (Dynamic.xyz compatible - open access)
CREATE POLICY "Anyone can read public profiles" ON user_profiles
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Anyone can create profiles" ON user_profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update any profile" ON user_profiles
    FOR UPDATE USING (true) WITH CHECK (true);

-- RLS Policies for transactions (open access for app-level security)
CREATE POLICY "Users can read all transactions" ON transactions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create transactions" ON transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update transactions" ON transactions
    FOR UPDATE USING (true) WITH CHECK (true);

-- RLS Policies for user_contacts (open access)
CREATE POLICY "Users can manage all contacts" ON user_contacts
    FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for transaction_requests (open access)
CREATE POLICY "Users can manage all requests" ON transaction_requests
    FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for user_settings (open access)
CREATE POLICY "Users can manage all settings" ON user_settings
    FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for user_pots (open access - disabled RLS as per migration 008)
ALTER TABLE user_pots DISABLE ROW LEVEL SECURITY;

-- RLS Policies for pot_activities (open access - disabled RLS as per migration 008)
ALTER TABLE pot_activities DISABLE ROW LEVEL SECURITY;

-- RLS Policies for waitlist
CREATE POLICY "Allow public to join waitlist" ON waitlist
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow reading waitlist for analytics" ON waitlist
    FOR SELECT USING (true);

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

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION search_users(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_users(TEXT, UUID) TO anon;

-- Insert sample data for user_profiles
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
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    '6ba7b812-9dad-11d1-80b4-00c04fd430c8'
)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (
    from_user_id, to_user_id, amount, currency, note, status, transaction_type, category
) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    25.50,
    'USDC',
    'Coffee payment ☕',
    'completed',
    'transfer',
    'food'
),
(
    '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    '550e8400-e29b-41d4-a716-446655440000',
    100.00,
    'USDC',
    'Lunch split 🍕',
    'completed',
    'transfer',
    'food'
);

-- Insert sample waitlist data
INSERT INTO waitlist (name, email, source) VALUES 
    ('John Doe', 'john@example.com', 'website'),
    ('Jane Smith', 'jane@example.com', 'social_media'),
    ('Bob Johnson', 'bob@example.com', 'referral'),
    ('Alice Brown', 'alice@example.com', 'website'),
    ('Charlie Wilson', 'charlie@example.com', 'social_media'),
    ('Diana Davis', 'diana@example.com', 'website'),
    ('Ethan Miller', 'ethan@example.com', 'referral'),
    ('Fiona Garcia', 'fiona@example.com', 'website'),
    ('George Martinez', 'george@example.com', 'social_media'),
    ('Hannah Taylor', 'hannah@example.com', 'website'),
    ('Ian Anderson', 'ian@example.com', 'referral'),
    ('Julia Thomas', 'julia@example.com', 'website'),
    ('Kevin Jackson', 'kevin@example.com', 'social_media'),
    ('Lisa White', 'lisa@example.com', 'website'),
    ('Mike Harris', 'mike@example.com', 'referral'),
    ('Nina Clark', 'nina@example.com', 'website'),
    ('Oscar Lewis', 'oscar@example.com', 'social_media'),
    ('Paula Hall', 'paula@example.com', 'website'),
    ('Quinn Young', 'quinn@example.com', 'referral'),
    ('Rachel King', 'rachel@example.com', 'website'),
    ('Sam Wright', 'sam@example.com', 'social_media'),
    ('Tina Scott', 'tina@example.com', 'website'),
    ('Uma Green', 'uma@example.com', 'referral'),
    ('Victor Baker', 'victor@example.com', 'website'),
    ('Wendy Adams', 'wendy@example.com', 'social_media'),
    ('Xavier Nelson', 'xavier@example.com', 'website'),
    ('Yara Carter', 'yara@example.com', 'referral'),
    ('Zoe Mitchell', 'zoe@example.com', 'website');

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'User profiles for the payment app with Dynamic.xyz integration';
COMMENT ON TABLE transactions IS 'Transaction records between users with blockchain integration';
COMMENT ON TABLE user_pots IS 'Savings pots for users to set financial goals and track progress';
COMMENT ON TABLE pot_activities IS 'Tracks all activities within savings pots including deposits, withdrawals, and interest';
COMMENT ON TABLE waitlist IS 'Waitlist table for collecting early access signups';

COMMENT ON COLUMN transactions.category IS 'Transaction category for expense tracking and pot auto-linking';
COMMENT ON COLUMN user_pots.target_amount IS 'Target savings amount in USDC';
COMMENT ON COLUMN user_pots.current_amount IS 'Current amount saved in USDC';
COMMENT ON COLUMN user_pots.yield_strategy IS 'DeFi protocol for yield generation';
COMMENT ON COLUMN user_pots.apy IS 'Annual percentage yield as decimal (e.g., 0.0525 for 5.25%)';
COMMENT ON COLUMN user_pots.auto_invest_frequency IS 'Frequency of automatic contributions';
COMMENT ON COLUMN user_pots.strict_deadline IS 'Date before which withdrawals are not allowed for strict pots';
COMMENT ON COLUMN user_pots.collaborators IS 'Array of user IDs who can contribute to joint pots';