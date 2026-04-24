-- Polymarket Schema for Supabase

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  fake_balance BIGINT DEFAULT 1000000 NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  is_protocol BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  description TEXT,
  outcomes TEXT[] NOT NULL,
  close_date TIMESTAMPTZ NOT NULL,
  resolved BOOLEAN DEFAULT FALSE NOT NULL,
  winning_outcome INT,
  created_by UUID REFERENCES users(id),
  volume BIGINT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Positions (user shares in each outcome)
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  market_id UUID REFERENCES markets(id) NOT NULL,
  outcome_index INT NOT NULL,
  shares BIGINT NOT NULL DEFAULT 0,
  avg_price NUMERIC(12, 6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, market_id, outcome_index)
);

-- Transactions ledger
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bet', 'payout', 'deposit', 'initial')),
  amount BIGINT NOT NULL,
  market_id UUID REFERENCES markets(id),
  shares BIGINT,
  outcome_index INT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS positions_user_idx ON positions(user_id);
CREATE INDEX IF NOT EXISTS positions_market_idx ON positions(market_id);
CREATE INDEX IF NOT EXISTS transactions_user_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS markets_resolved_idx ON markets(resolved);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users: anyone can see profiles, only self can update
CREATE POLICY "Public profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users update own" ON users FOR UPDATE USING (auth.uid() = id);

-- Markets: anyone can read, only admins can write
CREATE POLICY "Public read markets" ON markets FOR SELECT USING (true);
CREATE POLICY "Admin write markets" ON markets FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
);

-- Positions: users see own, markets visible to all
CREATE POLICY "Public read positions" ON positions FOR SELECT USING (true);
CREATE POLICY "Users manage own positions" ON positions FOR ALL USING (auth.uid() = user_id);

-- Transactions: users see own, public read
CREATE POLICY "Public read transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Users manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
