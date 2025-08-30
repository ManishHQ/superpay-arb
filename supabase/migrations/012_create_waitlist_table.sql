-- Create waitlist table for collecting early access signups
-- This table stores user information for the waitlist feature

CREATE TABLE IF NOT EXISTS waitlist (
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
    
    -- Indexes for performance
    CONSTRAINT waitlist_email_lowercase CHECK (email = lower(email))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anyone to insert (join waitlist)
CREATE POLICY "Allow public to join waitlist" ON waitlist
    FOR INSERT WITH CHECK (true);

-- Allow reading for analytics (could be restricted to admin users later)
CREATE POLICY "Allow reading waitlist for analytics" ON waitlist
    FOR SELECT USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_waitlist_updated_at
    BEFORE UPDATE ON waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_waitlist_updated_at();

-- Insert some sample data for testing
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
