-- Debts table for funny fund requests
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  amount BIGINT NOT NULL DEFAULT 1000000,
  creditor_name TEXT NOT NULL DEFAULT 'Bruce McQuillen',
  rate_monthly_percent NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS debts_user_idx ON debts(user_id);
