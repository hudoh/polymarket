-- Add is_protocol flag to users for AMM pool seeding
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_protocol BOOLEAN DEFAULT FALSE NOT NULL;
