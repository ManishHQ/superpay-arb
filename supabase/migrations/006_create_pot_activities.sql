-- Create pot_activities table to track activities within savings pots
-- This enables linking transactions to pots and tracking pot-specific activities

CREATE TABLE IF NOT EXISTS pot_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pot_id UUID NOT NULL,
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

  -- Foreign key constraint will be added in migration 007 after user_pots table is created
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pot_activities_pot_id ON pot_activities(pot_id);
CREATE INDEX IF NOT EXISTS idx_pot_activities_transaction_id ON pot_activities(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pot_activities_created_at ON pot_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pot_activities_type ON pot_activities(activity_type);

-- Add comments
COMMENT ON TABLE pot_activities IS 'Tracks all activities within savings pots including deposits, withdrawals, and interest';
COMMENT ON COLUMN pot_activities.pot_id IS 'Reference to the savings pot';
COMMENT ON COLUMN pot_activities.transaction_id IS 'Optional reference to the blockchain transaction';
COMMENT ON COLUMN pot_activities.activity_type IS 'Type of activity performed on the pot';
COMMENT ON COLUMN pot_activities.amount IS 'Amount of the activity in specified currency';
COMMENT ON COLUMN pot_activities.metadata IS 'Additional metadata for the activity (e.g., transaction details)';

-- Enable Row Level Security
ALTER TABLE pot_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies will be added in migration 007 after user_pots table is created
