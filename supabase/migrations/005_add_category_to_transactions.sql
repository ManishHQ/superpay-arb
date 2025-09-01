-- Add category field to transactions table
-- This will help categorize expenses and auto-link to savings pots

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN (
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
));

-- Add comment to explain the column
COMMENT ON COLUMN transactions.category IS 'Transaction category for expense tracking and pot auto-linking';

-- Create index on category for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- Create index on category + user_id for filtered queries
CREATE INDEX IF NOT EXISTS idx_transactions_category_user ON transactions(from_user_id, category) WHERE category IS NOT NULL;
