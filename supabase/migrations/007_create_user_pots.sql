-- Create user_pots table for savings pots functionality
-- This enables users to create and manage savings goals

-- Create user_pots table
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

-- Create indexes for better performance
CREATE INDEX idx_user_pots_user_id ON user_pots(user_id);
CREATE INDEX idx_user_pots_category ON user_pots(category);
CREATE INDEX idx_user_pots_is_archived ON user_pots(is_archived);
CREATE INDEX idx_user_pots_created_at ON user_pots(created_at);

-- Add comments for documentation
COMMENT ON TABLE user_pots IS 'Savings pots for users to set financial goals and track progress';
COMMENT ON COLUMN user_pots.target_amount IS 'Target savings amount in USDC';
COMMENT ON COLUMN user_pots.current_amount IS 'Current amount saved in USDC';
COMMENT ON COLUMN user_pots.yield_strategy IS 'DeFi protocol for yield generation';
COMMENT ON COLUMN user_pots.apy IS 'Annual percentage yield as decimal (e.g., 0.0525 for 5.25%)';
COMMENT ON COLUMN user_pots.auto_invest_frequency IS 'Frequency of automatic contributions';
COMMENT ON COLUMN user_pots.strict_deadline IS 'Date before which withdrawals are not allowed for strict pots';
COMMENT ON COLUMN user_pots.collaborators IS 'Array of user IDs who can contribute to joint pots';

-- Enable Row Level Security (RLS)
ALTER TABLE user_pots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own pots" ON user_pots
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own pots" ON user_pots
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pots" ON user_pots
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own pots" ON user_pots
    FOR DELETE USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_pots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_pots_updated_at
    BEFORE UPDATE ON user_pots
    FOR EACH ROW
    EXECUTE FUNCTION update_user_pots_updated_at();

-- Update pot_activities table to reference the new user_pots table
-- First, drop the existing foreign key constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_pot_activities_pot' 
        AND table_name = 'pot_activities'
    ) THEN
        ALTER TABLE pot_activities DROP CONSTRAINT fk_pot_activities_pot;
    END IF;
END $$;

-- Add the correct foreign key constraint
ALTER TABLE pot_activities 
ADD CONSTRAINT fk_pot_activities_pot 
FOREIGN KEY (pot_id) REFERENCES user_pots(id) ON DELETE CASCADE;

-- Update RLS policies for pot_activities to use the new table structure
DROP POLICY IF EXISTS "Users can view activities for their own pots" ON pot_activities;
DROP POLICY IF EXISTS "Users can insert activities for their own pots" ON pot_activities;
DROP POLICY IF EXISTS "Users can update activities for their own pots" ON pot_activities;

CREATE POLICY "Users can view activities for their own pots" ON pot_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_pots
            WHERE user_pots.id = pot_activities.pot_id
            AND user_pots.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert activities for their own pots" ON pot_activities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_pots
            WHERE user_pots.id = pot_activities.pot_id
            AND user_pots.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update activities for their own pots" ON pot_activities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_pots
            WHERE user_pots.id = pot_activities.pot_id
            AND user_pots.user_id = auth.uid()
        )
    );
