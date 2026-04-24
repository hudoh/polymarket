-- Polymarket schema for TheMcQ

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  fake_balance BIGINT DEFAULT 1000000000000, -- $1M in micro-dollars
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  description TEXT,
  outcomes TEXT[] NOT NULL,
  resolved BOOLEAN DEFAULT false,
  winning_outcome INTEGER,
  close_date TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  liquidity BIGINT DEFAULT 1000000000000,
  volume BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  market_id UUID REFERENCES markets(id) NOT NULL,
  outcome_index INTEGER NOT NULL,
  shares BIGINT DEFAULT 0,
  avg_price NUMERIC(10, 6) DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, market_id, outcome_index)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type TEXT NOT NULL, -- 'bet', 'payout', 'deposit'
  amount BIGINT NOT NULL,
  market_id UUID REFERENCES markets(id),
  shares BIGINT,
  outcome_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_market ON positions(market_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_markets_resolved ON markets(resolved);
